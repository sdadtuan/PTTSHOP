import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import {
  attemptIssue,
  createLinkedInvoice,
  issueOriginalForOrder,
  loadInvoiceConfig,
  processInvoiceQueue,
  providerFor,
} from "@/lib/invoices/service";
import { invoiceBlockReason } from "@/lib/invoices/settings";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  action: z.enum(["issue", "retry", "queue", "adjust", "replace"]),
  orderId: z.string().optional(),
  invoiceId: z.string().optional(),
  reason: z.string().optional(),
  amount: z.number().int().min(0).optional(),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "";
    const q = (url.searchParams.get("q") || "").trim();
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" } },
          { buyerTaxCode: { contains: q, mode: "insensitive" } },
          { buyerName: { contains: q, mode: "insensitive" } },
          { order: { orderNumber: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { order: { select: { id: true, orderNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const [issued, waiting, attention] = await Promise.all([
      prisma.invoice.count({ where: { status: "ISSUED" } }),
      prisma.invoice.count({ where: { status: { in: ["PENDING", "ISSUING", "RETRYING"] } } }),
      prisma.invoice.count({ where: { needsAccountantAttention: true } }),
    ]);
    const config = await loadInvoiceConfig(prisma);
    return jsonOk({
      summary: { issued, waiting, attention },
      blockReason: invoiceBlockReason(config, process.env),
      sandbox: config.provider === "SANDBOX_MOCK",
      invoices,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const config = await loadInvoiceConfig(prisma);
    const provider = providerFor(config, process.env);
    if (body.action === "queue") {
      const rows = await processInvoiceQueue(prisma, provider, process.env);
      return jsonOk({ invoices: rows });
    }
    if (body.action === "issue") {
      if (!body.orderId) return jsonError("Thiếu đơn hàng.");
      const invoice = await issueOriginalForOrder(prisma, body.orderId, provider, process.env, session.user.id);
      return jsonOk({ invoice });
    }
    if (body.action === "retry") {
      if (!body.invoiceId) return jsonError("Thiếu hoá đơn.");
      const invoice = await attemptIssue(prisma, body.invoiceId, provider, process.env, session.user.id);
      return jsonOk({ invoice });
    }
    if (!body.invoiceId || body.amount == null) return jsonError("Thiếu hoá đơn hoặc số tiền.");
    const linked = await createLinkedInvoice(prisma, {
      parentId: body.invoiceId,
      type: body.action === "adjust" ? "ADJUSTMENT" : "REPLACEMENT",
      reason: body.reason || "",
      amount: body.amount,
      provider,
      env: process.env,
      actorId: session.user.id,
    });
    return jsonOk(linked);
  } catch (err) {
    return handleApiError(err);
  }
}
