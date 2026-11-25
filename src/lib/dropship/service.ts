import type { PrismaClient } from "@prisma/client";
import { pullCjDropshipping, pullGoogleSheet } from "@/lib/dropship/adapters";
import { assertDemoSupplierAllowed, DEMO_SUPPLIER_CODE } from "@/lib/dropship/demo";
import { DEFAULT_FLOOR_PARAMS, type FloorParams } from "@/lib/dropship/floor";
import { decideCostUpdate, matchVariant, parseSupplierCsv, type VariantMatch } from "@/lib/dropship/sync";
import { poFile, slaMarks, slaScan } from "@/lib/dropship/orders";
import { allocateQuantity, sellableQuantity, type StockSource } from "@/lib/dropship/stock";
import { effectiveFloor } from "@/lib/dropship/floor";
import { queueEmail } from "@/lib/ops/email-queue";

type Db = PrismaClient;

export async function loadFloorParams(db: Db): Promise<FloorParams> {
  const row = await db.floorSettings.findUnique({ where: { id: "default" } });
  if (!row) return DEFAULT_FLOOR_PARAMS;
  return {
    manualFloor: row.manualFloor,
    marginBps: row.marginBps,
    returnBps: row.returnBps,
    adsBps: row.adsBps,
    feeBps: row.feeBps,
    vatBps: row.vatBps,
    shippingCost: row.shippingCost,
    paymentCost: row.paymentCost,
    fixedCost: row.fixedCost,
  };
}

export async function applySupplierCsv(db: Db, input: {
  supplierId: string;
  source: "FILE" | "GOOGLE_SHEET" | "MANUAL";
  csv: string;
  now: Date;
  alertTo?: string;
}) {
  const startedAt = input.now;
  const parsed = parseSupplierCsv(input.csv);
  const variants = await db.productVariant.findMany({
    include: { product: { select: { name: true } } },
  });
  const matches: VariantMatch[] = variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    name: variant.product.name,
    color: variant.color,
    size: variant.size,
    price: variant.price,
    isPurchasable: variant.isPurchasable,
  }));
  const params = await loadFloorParams(db);
  const issues = [...parsed.issues];
  let rowsChanged = 0;
  for (const row of parsed.rows) {
    const variant = matchVariant(row, matches);
    if (!variant) {
      issues.push({ line: row.line, code: "UNMAPPED", message: "SKU chưa ánh xạ" });
      continue;
    }
    const decision = decideCostUpdate({
      price: variant.price,
      isPurchasable: variant.isPurchasable,
      nextCost: row.costPrice,
      params,
    });
    const updatedAt = new Date(`${row.updatedOn}T00:00:00.000Z`);
    const existing = await db.supplierSku.findUnique({
      where: { supplierId_supplierSku: { supplierId: input.supplierId, supplierSku: row.supplierSku } },
    });
    if (existing) {
      await db.supplierSku.update({
        where: { id: existing.id },
        data: {
          variantId: variant.id,
          costPrice: row.costPrice,
          supplierStock: row.stock,
          stockUpdatedAt: updatedAt,
        },
      });
    } else {
      const taken = await db.supplierSku.findUnique({
        where: { supplierId_variantId: { supplierId: input.supplierId, variantId: variant.id } },
      });
      if (taken) {
        issues.push({ line: row.line, code: "VARIANT_TAKEN", message: "Biến thể đã có mã NCC khác" });
        continue;
      }
      await db.supplierSku.create({
        data: {
          supplierId: input.supplierId,
          variantId: variant.id,
          supplierSku: row.supplierSku,
          priority: 1,
          costPrice: row.costPrice,
          supplierStock: row.stock,
          stockUpdatedAt: updatedAt,
        },
      });
    }
    await db.productVariant.update({
      where: { id: variant.id },
      data: { costPrice: row.costPrice, isPurchasable: decision.isPurchasable },
    });
    variant.isPurchasable = decision.isPurchasable;
    if (decision.hide && input.alertTo) {
      await queueEmail(db, {
        templateKey: "INTERNAL_BELOW_FLOOR",
        to: input.alertTo,
        vars: { sku: variant.sku, price: variant.price, floorPrice: decision.floor },
        provider: "SANDBOX_MOCK",
      });
    }
    rowsChanged += 1;
  }
  const rowsErrored = issues.length;
  const status = rowsChanged === 0 && rowsErrored > 0 ? "FAILED" : rowsErrored > 0 ? "PARTIAL" : "OK";
  const run = await db.syncRun.create({
    data: {
      supplierId: input.supplierId,
      source: input.source,
      startedAt,
      finishedAt: new Date(),
      status,
      rowsRead: parsed.rows.length + parsed.issues.length,
      rowsChanged,
      rowsErrored,
      errorDetail: JSON.stringify(issues),
    },
  });
  await db.supplier.update({ where: { id: input.supplierId }, data: { lastSyncAt: input.now } });
  return run;
}

export async function syncSupplierSource(db: Db, supplierId: string, now: Date, fetchImpl?: typeof fetch) {
  const supplier = await db.supplier.findUniqueOrThrow({ where: { id: supplierId } });
  if (supplier.connectionType === "API_STUB") {
    const pulled = pullCjDropshipping();
    return db.syncRun.create({
      data: {
        supplierId,
        source: "STUB",
        startedAt: now,
        finishedAt: new Date(),
        status: "FAILED",
        rowsRead: 0,
        rowsChanged: 0,
        rowsErrored: 1,
        errorDetail: JSON.stringify([{ line: 0, code: "STUB", message: pulled.ok ? "" : pulled.error }]),
      },
    });
  }
  if (supplier.connectionType === "GOOGLE_SHEET") {
    if (!supplier.sheetUrl) throw new Error("Thiếu URL sheet");
    const pulled = await pullGoogleSheet(supplier.sheetUrl, fetchImpl);
    if (!pulled.ok) {
      return db.syncRun.create({
        data: {
          supplierId,
          source: "GOOGLE_SHEET",
          startedAt: now,
          finishedAt: new Date(),
          status: "FAILED",
          errorDetail: JSON.stringify([{ line: 0, code: "SHEET", message: pulled.error }]),
        },
      });
    }
    return applySupplierCsv(db, { supplierId, source: "GOOGLE_SHEET", csv: pulled.csv, now });
  }
  throw new Error("Nguồn này đồng bộ bằng tay");
}

export async function runDueSyncs(db: Db, now: Date, fetchImpl?: typeof fetch) {
  const suppliers = await db.supplier.findMany({
    where: { isActive: true, connectionType: { in: ["GOOGLE_SHEET", "API_STUB"] } },
  });
  const ran = [];
  for (const supplier of suppliers) {
    const due = !supplier.lastSyncAt || now.getTime() - supplier.lastSyncAt.getTime() >= supplier.syncEveryHours * 60 * 60 * 1000;
    if (!due) continue;
    ran.push(await syncSupplierSource(db, supplier.id, now, fetchImpl));
  }
  return ran;
}

export function buildPo(input: {
  poNumber: string;
  supplierName: string;
  lines: Array<{ supplierSku: string; name: string; color: string; size: string; quantity: number }>;
}) {
  return poFile(input);
}

export async function markSupplierOrderSent(db: Db, id: string, sentAt: Date) {
  const row = await db.supplierOrder.findUniqueOrThrow({ where: { id }, include: { supplier: true } });
  const marks = slaMarks(sentAt, row.supplier.warnHours, row.supplier.slaHours);
  return db.supplierOrder.update({
    where: { id },
    data: { status: "SENT", sentAt, warnAt: marks.warnAt, slaDueAt: marks.slaDueAt },
  });
}

export async function setSupplierTracking(db: Db, id: string, trackingCode: string) {
  return db.supplierOrder.update({
    where: { id },
    data: { trackingCode, status: "SHIPPED" },
  });
}

export async function scanSupplierSlas(db: Db, now: Date, alertTo: string) {
  const rows = await db.supplierOrder.findMany({
    where: { status: { in: ["SENT", "ACKNOWLEDGED"] } },
    include: { order: { select: { orderNumber: true } } },
  });
  const warned = [];
  for (const row of rows) {
    const result = slaScan({
      status: row.status,
      trackingCode: row.trackingCode,
      warnAt: row.warnAt,
      warnedAt: row.warnedAt,
      slaDueAt: row.slaDueAt,
      now,
    });
    if (result.warn) {
      await db.supplierOrder.update({ where: { id: row.id }, data: { warnedAt: now } });
      warned.push(await queueEmail(db, {
        templateKey: "INTERNAL_SLA",
        to: alertTo,
        vars: { orderNumber: row.order.orderNumber },
        provider: "SANDBOX_MOCK",
      }));
    }
    if (result.breach) {
      await db.supplierOrder.update({ where: { id: row.id }, data: { status: "SLA_BREACH" } });
    }
  }
  return warned;
}

export async function recordSupplierDebit(db: Db, input: {
  supplierId: string;
  supplierOrderId?: string | null;
  returnRequestId?: string | null;
  amount: number;
  reason: string;
}) {
  const supplier = await db.supplier.findUniqueOrThrow({ where: { id: input.supplierId } });
  if (supplier.paysReturnFee === false) {
    throw new Error("NCC này không chịu phí đổi trả");
  }
  return db.supplierDebit.create({
    data: {
      supplierId: input.supplierId,
      supplierOrderId: input.supplierOrderId || null,
      returnRequestId: input.returnRequestId || null,
      amount: input.amount,
      reason: input.reason,
      status: "CONFIRMED",
      note: "Lỗi do NCC",
    },
  });
}

function stockSources(rows: Array<{
  supplierId: string;
  priority: number;
  supplierStock: number;
  safetyStock: number;
  stockUpdatedAt: Date | null;
  isActive: boolean;
  costPrice: number;
}>): StockSource[] {
  return rows.filter((row) => row.isActive).map((row) => ({
    supplierId: row.supplierId,
    priority: row.priority,
    supplierStock: row.supplierStock,
    safetyStock: row.safetyStock,
    stockUpdatedAt: row.stockUpdatedAt,
    isActive: row.isActive,
    costPrice: row.costPrice,
  }));
}

export async function sellableTotals(db: Db, variantIds: string[], now = new Date()) {
  const ids = [...new Set(variantIds)];
  const totals = new Map<string, number>();
  if (ids.length === 0) return totals;
  const params = await loadFloorParams(db);
  const variants = await db.productVariant.findMany({
    where: { id: { in: ids } },
    include: { supplierSkus: true },
  });
  for (const variant of variants) {
    const sources = stockSources(variant.supplierSkus);
    const cost = sources.slice().sort((a, b) => a.priority - b.priority)[0]?.costPrice ?? variant.costPrice;
    totals.set(variant.id, sellableQuantity({
      stock: variant.stock,
      safetyStock: variant.safetyStock,
      isPurchasable: variant.isPurchasable,
      hasFloor: effectiveFloor(cost, params) != null,
      sources,
      now,
    }).total);
  }
  return totals;
}

export async function planCheckoutLines(db: Db, lines: Array<{ variantId: string; quantity: number }>, now: Date) {
  const params = await loadFloorParams(db);
  const variants = await db.productVariant.findMany({
    where: { id: { in: lines.map((line) => line.variantId) } },
    include: { supplierSkus: true },
  });
  return lines.map((line) => {
    const variant = variants.find((row) => row.id === line.variantId);
    if (!variant) return { ok: false as const, variantId: line.variantId, error: "Không còn biến thể" };
    const sources = stockSources(variant.supplierSkus);
    const cost = sources.slice().sort((a, b) => a.priority - b.priority)[0]?.costPrice ?? variant.costPrice;
    const allocation = allocateQuantity({
      quantity: line.quantity,
      stock: variant.stock,
      safetyStock: variant.safetyStock,
      isPurchasable: variant.isPurchasable,
      hasFloor: effectiveFloor(cost, params) != null,
      sources,
      now,
    });
    if (!allocation.ok) return { ok: false as const, variantId: variant.id, error: allocation.error };
    return { ...allocation, variantId: variant.id };
  });
}

export async function ensureDemoSupplier(db: Db, databaseUrl: string) {
  assertDemoSupplierAllowed(databaseUrl);
  return db.supplier.upsert({
    where: { code: DEMO_SUPPLIER_CODE },
    update: {},
    create: {
      code: DEMO_SUPPLIER_CODE,
      name: "Nhà cung cấp mẫu",
      connectionType: "FILE",
      slaHours: 48,
      warnHours: 24,
      paysReturnFee: true,
      imageLicense: "NONE",
    },
  });
}
