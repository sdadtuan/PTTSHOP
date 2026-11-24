import { Prisma, type PrismaClient } from "@prisma/client";
import { invoiceBuyer } from "@/lib/invoices/buyer";
import { buildInvoiceLines, vatFromGross } from "@/lib/invoices/money";
import {
  DisabledInvoiceProvider,
  MisaMeInvoiceProvider,
  SandboxMockInvoiceProvider,
  ViettelSInvoiceProvider,
  type InvoiceProvider,
} from "@/lib/invoices/provider";
import { nextRetryAt } from "@/lib/invoices/retry";
import { invoiceBlockReason, normalizeInvoiceSettings, type InvoiceConfig } from "@/lib/invoices/settings";
import { withSqliteRetry } from "@/lib/payments/sqlite-retry";

type Db = PrismaClient;

const ACTIVE = ["PENDING", "RETRYING", "FAILED"] as const;

function isUnique(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

async function audit(
  db: Db,
  invoiceId: string,
  action: string,
  fromStatus: string | null,
  toStatus: string | null,
  actorId: string,
  metadata: Record<string, unknown>,
) {
  await db.invoiceAuditLog.create({
    data: {
      invoiceId,
      action,
      fromStatus,
      toStatus,
      actorId,
      metadataJson: JSON.stringify(metadata),
    },
  });
}

export async function loadInvoiceConfig(db: Db) {
  const row = await db.invoiceSettings.findUnique({ where: { id: "default" } });
  return normalizeInvoiceSettings(row);
}

function snapshot(order: {
  customerName: string;
  customerEmail: string | null;
  address: string;
  invoiceCompanyName: string | null;
  invoiceTaxCode: string | null;
  invoiceAddress: string | null;
  invoiceEmail: string | null;
  items: Array<{ name: string; color: string; size: string; price: number; quantity: number }>;
  discount: number;
  shippingFee: number;
  total: number;
}, config: InvoiceConfig) {
  const buyer = invoiceBuyer(order);
  const lines = buildInvoiceLines(order, config.vatRate);
  const money = vatFromGross(order.total, config.vatRate);
  return { buyer, lines, money };
}

export async function enqueueOriginal(db: Db, orderId: string, actorId = "system") {
  const config = await loadInvoiceConfig(db);
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("Không tìm thấy đơn.");
  const existing = await db.invoice.findFirst({ where: { originalOrderKey: order.id } });
  if (existing) return existing;
  const shot = snapshot(order, config);
  try {
    return await withSqliteRetry(() =>
      db.invoice.create({
        data: {
          orderId: order.id,
          type: "ORIGINAL",
          originalOrderKey: order.id,
          idempotencyKey: `original:${order.id}`,
          status: "PENDING",
          ...shot.buyer,
          linesJson: JSON.stringify(shot.lines),
          vatRate: config.vatRate,
          ...shot.money,
          provider: config.provider,
          templateCode: config.templateCode,
          invoiceSeries: config.invoiceSeries,
          maxRetries: config.maxRetries,
        },
      }),
    );
  } catch (err) {
    if (!isUnique(err)) throw err;
    const row = await db.invoice.findFirst({ where: { originalOrderKey: order.id } });
    if (!row) throw err;
    return row;
  } finally {
    const row = await db.invoice.findFirst({ where: { originalOrderKey: order.id } });
    if (row) {
      const already = await db.invoiceAuditLog.findFirst({ where: { invoiceId: row.id, action: "ENQUEUED" } });
      if (!already) await audit(db, row.id, "ENQUEUED", null, "PENDING", actorId, { orderId: order.id });
    }
  }
}

async function claim(db: Db, invoiceId: string) {
  const updated = await db.invoice.updateMany({
    where: { id: invoiceId, status: { in: [...ACTIVE] } },
    data: { status: "ISSUING" },
  });
  return updated.count === 1;
}

export async function attemptIssue(
  db: Db,
  invoiceId: string,
  provider: InvoiceProvider,
  env: Record<string, string | undefined>,
  actorId = "system",
  now = new Date(),
) {
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Không tìm thấy hoá đơn.");
  if (invoice.status === "ISSUED" || invoice.status === "ADJUSTED" || invoice.status === "REPLACED" || invoice.status === "CANCELED") {
    return invoice;
  }
  const config = await loadInvoiceConfig(db);
  const block = invoiceBlockReason(config, env);
  if (block && config.provider !== "SANDBOX_MOCK") {
    await db.invoice.update({ where: { id: invoice.id }, data: { lastError: block, status: invoice.status === "ISSUING" ? "PENDING" : invoice.status } });
    await audit(db, invoice.id, "BLOCKED", invoice.status, invoice.status, actorId, { error: block });
    return db.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
  }
  const won = await claim(db, invoice.id);
  if (!won) return db.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
  const request = {
    idempotencyKey: invoice.idempotencyKey,
    buyerName: invoice.buyerName,
    buyerTaxCode: invoice.buyerTaxCode,
    lines: JSON.parse(invoice.linesJson) as ReturnType<typeof buildInvoiceLines>,
    subtotalAmount: invoice.subtotalAmount,
    vatAmount: invoice.vatAmount,
    totalAmount: invoice.totalAmount,
    vatRate: invoice.vatRate,
    templateCode: invoice.templateCode,
    invoiceSeries: invoice.invoiceSeries,
    reason: invoice.adjustmentReason || undefined,
  };
  const method = invoice.type === "ADJUSTMENT" ? "adjustInvoice" : invoice.type === "REPLACEMENT" ? "replaceInvoice" : "issueInvoice";
  const result = await provider[method](request);
  if (result.ok) {
    const issued = await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "ISSUED",
        provider: config.provider,
        providerInvoiceId: result.providerInvoiceId,
        invoiceNumber: result.invoiceNumber,
        lookupCode: result.lookupCode,
        lookupUrl: result.lookupUrl,
        issuedAt: now,
        lastError: null,
        needsAccountantAttention: false,
        nextRetryAt: null,
      },
    });
    await audit(db, invoice.id, "ISSUED", "ISSUING", "ISSUED", actorId, { invoiceNumber: result.invoiceNumber });
    return issued;
  }
  const retryCount = invoice.retryCount + (result.temporary ? 1 : 0);
  const exhausted = result.temporary && retryCount >= invoice.maxRetries;
  const status = exhausted ? "FAILED" : result.temporary ? "RETRYING" : "PENDING";
  const saved = await db.invoice.update({
    where: { id: invoice.id },
    data: {
      status,
      retryCount,
      lastError: result.error,
      nextRetryAt: status === "RETRYING" ? nextRetryAt(now, retryCount, config.retryBaseMinutes) : null,
      needsAccountantAttention: exhausted,
    },
  });
  await audit(db, invoice.id, exhausted ? "ATTENTION" : "RETRY", "ISSUING", status, actorId, {
    error: result.error,
    retryCount,
  });
  return saved;
}

export async function issueOriginalForOrder(
  db: Db,
  orderId: string,
  provider: InvoiceProvider,
  env: Record<string, string | undefined>,
  actorId = "system",
) {
  const invoice = await enqueueOriginal(db, orderId, actorId);
  return attemptIssue(db, invoice.id, provider, env, actorId);
}

export async function processInvoiceQueue(
  db: Db,
  provider: InvoiceProvider,
  env: Record<string, string | undefined>,
  now = new Date(),
) {
  const due = await db.invoice.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "RETRYING", nextRetryAt: { lte: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const done = [];
  for (const invoice of due) {
    done.push(await attemptIssue(db, invoice.id, provider, env, "system", now));
  }
  return done;
}

export async function createLinkedInvoice(
  db: Db,
  input: {
    parentId: string;
    type: "ADJUSTMENT" | "REPLACEMENT";
    reason: string;
    amount: number;
    provider: InvoiceProvider;
    env: Record<string, string | undefined>;
    actorId: string;
  },
) {
  const reason = input.reason.trim();
  if (!reason) throw new Error("Cần nhập lý do điều chỉnh hoặc thay thế.");
  if (!Number.isInteger(input.amount) || input.amount < 0) throw new Error("Số tiền điều chỉnh không hợp lệ.");
  const parent = await db.invoice.findUnique({ where: { id: input.parentId }, include: { order: { include: { items: true } } } });
  if (!parent || parent.status !== "ISSUED") throw new Error("Chỉ điều chỉnh hoặc thay thế hoá đơn đã phát hành.");
  const parentTotal = parent.totalAmount;
  const parentSubtotal = parent.subtotalAmount;
  const parentVat = parent.vatAmount;
  const config = await loadInvoiceConfig(db);
  const key = `${input.type.toLowerCase()}:${parent.id}:${reason}:${input.amount}`;
  const existing = await db.invoice.findUnique({ where: { idempotencyKey: key } });
  let child = existing;
  if (!child) {
    try {
      child = await db.invoice.create({
        data: {
      orderId: parent.orderId,
      type: input.type,
      parentInvoiceId: parent.id,
      idempotencyKey: key,
      status: "PENDING",
      buyerKind: parent.buyerKind,
      buyerName: parent.buyerName,
      buyerTaxCode: parent.buyerTaxCode,
      buyerAddress: parent.buyerAddress,
      buyerEmail: parent.buyerEmail,
      linesJson: JSON.stringify([{ name: reason, quantity: 1, unitPrice: input.amount, lineTotal: input.amount, vatRate: config.vatRate }]),
      vatRate: config.vatRate,
      ...vatFromGross(input.amount, config.vatRate),
      provider: config.provider,
      templateCode: parent.templateCode,
      invoiceSeries: parent.invoiceSeries,
      adjustmentReason: reason,
      maxRetries: config.maxRetries,
        },
      });
    } catch (err) {
      if (!isUnique(err)) throw err;
      child = await db.invoice.findUnique({ where: { idempotencyKey: key } });
    }
  }
  if (!child) throw new Error("Không tạo được hoá đơn điều chỉnh.");
  const issued = await attemptIssue(db, child.id, input.provider, input.env, input.actorId);
  if (issued.status === "ISSUED") {
    const next = input.type === "ADJUSTMENT" ? "ADJUSTED" : "REPLACED";
    await db.invoice.update({
      where: { id: parent.id },
      data: { status: next, totalAmount: parentTotal, subtotalAmount: parentSubtotal, vatAmount: parentVat },
    });
    await audit(db, parent.id, next, "ISSUED", next, input.actorId, { childId: child.id, reason });
  }
  const freshParent = await db.invoice.findUniqueOrThrow({ where: { id: parent.id } });
  return { parent: freshParent, child: issued, unchangedTotal: parentTotal };
}

export function providerFor(config: InvoiceConfig, env: Record<string, string | undefined>) {
  if (config.provider === "SANDBOX_MOCK") return new SandboxMockInvoiceProvider();
  if (config.provider === "VIETTEL_SINVOICE") return new ViettelSInvoiceProvider(env);
  if (config.provider === "MISA_MEINVOICE") return new MisaMeInvoiceProvider(env);
  return new DisabledInvoiceProvider();
}

export async function autoIssueIfReady(db: Db, orderId: string, reason: "DELIVERED" | "PAID") {
  try {
    const config = await loadInvoiceConfig(db);
    return await maybeEnqueueForOrder(db, orderId, reason, providerFor(config, process.env), process.env);
  } catch (err) {
    console.error(err instanceof Error ? err.message : "Không xếp được hoá đơn.");
    return null;
  }
}

export async function maybeEnqueueForOrder(db: Db, orderId: string, reason: "DELIVERED" | "PAID", provider: InvoiceProvider, env: Record<string, string | undefined>) {
  try {
    const config = await loadInvoiceConfig(db);
    if (!config.autoIssueEnabled) return null;
    if (reason === "DELIVERED" && config.issueTrigger !== "ON_DELIVERED") return null;
    if (reason === "PAID" && config.issueTrigger !== "ON_PAID") return null;
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return null;
    if (reason === "DELIVERED" && order.status !== "COMPLETED") return null;
    if (reason === "PAID" && order.paymentStatus !== "PAID") return null;
    return await issueOriginalForOrder(db, orderId, provider, env, "system");
  } catch (err) {
    console.error(err instanceof Error ? err.message : "Không xếp được hoá đơn.");
    return null;
  }
}
