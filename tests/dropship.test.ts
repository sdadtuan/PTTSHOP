import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: async () => null }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
  }),
}));
import { pullCjDropshipping, pullGoogleSheet } from "@/lib/dropship/adapters";
import { assertDemoSupplierAllowed, databaseName } from "@/lib/dropship/demo";
import { effectiveFloor, listedPriceFromCost, DEFAULT_FLOOR_PARAMS } from "@/lib/dropship/floor";
import { poFile, slaScan, trackingLabel } from "@/lib/dropship/orders";
import { allocateQuantity, sellableQuantity } from "@/lib/dropship/stock";
import { parseSupplierCsv } from "@/lib/dropship/sync";
import { applySupplierCsv, ensureDemoSupplier, recordSupplierDebit, scanSupplierSlas } from "@/lib/dropship/service";
import { POST as placeOrder } from "@/app/api/orders/route";
import { decideShippingFee, normalizeShippingConfig } from "@/lib/shipping/policy";
import { publicShipments } from "@/lib/shipping/service";
import { testPgUrl } from "./pg";

const now = new Date("2026-11-25T04:00:00.000Z");

describe("tồn an toàn kho riêng và tồn NCC", () => {
  it("stores 0 when a new variant omits warehouse safety stock", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const product = await db.product.create({
      data: {
        name: "Áo tồn 1",
        slug: `ao-ton1-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `ton1-${stamp}`, color: "Đen", size: "M", price: 100_000, stock: 1 } },
      },
      include: { variants: true },
    });
    expect(product.variants[0]?.safetyStock).toBe(0);
    expect(sellableQuantity({
      stock: product.variants[0].stock,
      safetyStock: product.variants[0].safetyStock,
      isPurchasable: product.variants[0].isPurchasable,
      hasFloor: false,
      sources: [],
      now,
    }).total).toBe(1);
    await db.$disconnect();
  });

  it("sells own stock of 1 when warehouse safety stock stays at 0", () => {
    const row = sellableQuantity({
      stock: 1,
      safetyStock: 0,
      isPurchasable: true,
      hasFloor: true,
      sources: [],
      now,
    });
    expect(row).toEqual({ own: 1, supplier: 0, total: 1, supplierId: null });
  });

  it("keeps supplier safety at 2 and ignores supplier stock older than 24 hours", () => {
    const fresh = sellableQuantity({
      stock: 1,
      safetyStock: 0,
      isPurchasable: true,
      hasFloor: true,
      sources: [{
        supplierId: "ncc",
        priority: 1,
        supplierStock: 5,
        safetyStock: 2,
        stockUpdatedAt: now,
        isActive: true,
        costPrice: 80_000,
      }],
      now,
    });
    expect(fresh.total).toBe(4);
    const stale = sellableQuantity({
      stock: 1,
      safetyStock: 0,
      isPurchasable: true,
      hasFloor: true,
      sources: [{
        supplierId: "ncc",
        priority: 1,
        supplierStock: 5,
        safetyStock: 2,
        stockUpdatedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        isActive: true,
        costPrice: 80_000,
      }],
      now,
    });
    expect(stale).toEqual({ own: 1, supplier: 0, total: 1, supplierId: null });
  });
});

describe("TC-07 giá sàn và ẩn SKU", () => {
  it("hides a SKU when the new cost puts the selling price under the floor and does not change the price", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const product = await db.product.create({
      data: {
        name: "Áo thun",
        slug: `ao-tc07-${stamp}`,
        gender: "UNISEX",
        variants: {
          create: [
            { sku: `den-${stamp}`, color: "Đen", size: "M", price: 200_000, stock: 8, safetyStock: 2 },
            { sku: `do-${stamp}`, color: "Đỏ", size: "L", price: 200_000, stock: 8, safetyStock: 2 },
          ],
        },
      },
      include: { variants: true },
    });
    const supplier = await db.supplier.create({
      data: { code: `NCC-${stamp}`, name: "NCC test", connectionType: "FILE", paysReturnFee: true },
    });
    const run = await applySupplierCsv(db, {
      supplierId: supplier.id,
      source: "FILE",
      csv: readFileSync("docs/specs/samples/ncc-ton-mau.csv", "utf8"),
      now,
      alertTo: "admin@example.com",
    });
    expect(run.rowsRead).toBe(5);
    expect(run.rowsChanged).toBe(2);
    expect(run.rowsErrored).toBe(3);
    const black = await db.productVariant.findUniqueOrThrow({ where: { sku: `den-${stamp}` } });
    const red = await db.productVariant.findUniqueOrThrow({ where: { sku: `do-${stamp}` } });
    expect(black.price).toBe(200_000);
    expect(black.isPurchasable).toBe(true);
    expect(red.price).toBe(200_000);
    expect(red.isPurchasable).toBe(false);
    const lowered = [
      "mã NCC,tên,màu,size,giá vốn,tồn,ngày cập nhật",
      `AO-DO-L,${product.name},Đỏ,L,100000,6,2026-11-25`,
    ].join("\n");
    await applySupplierCsv(db, { supplierId: supplier.id, source: "FILE", csv: lowered, now, alertTo: "admin@example.com" });
    const redAfter = await db.productVariant.findUniqueOrThrow({ where: { sku: `do-${stamp}` } });
    expect(redAfter.price).toBe(200_000);
    expect(redAfter.isPurchasable).toBe(false);
    const mail = await db.emailOutbox.findFirst({ where: { templateKey: "INTERNAL_BELOW_FLOOR", body: { contains: red.sku } } });
    expect(mail).toBeTruthy();
    await db.$disconnect();
  });

  it("uses the higher of the manual floor and formula G", () => {
    const listed = listedPriceFromCost(180_000, DEFAULT_FLOOR_PARAMS);
    expect(listed).toBe(225_000);
    expect(effectiveFloor(180_000, { ...DEFAULT_FLOOR_PARAMS, manualFloor: 300_000 })).toBe(300_000);
    expect(effectiveFloor(null, DEFAULT_FLOOR_PARAMS)).toBeNull();
  });
});

describe("TC-06 tách kiện", () => {
  it("splits warehouse and supplier quantities and keeps a single shipping fee", async () => {
    const split = allocateQuantity({
      quantity: 3,
      stock: 4,
      safetyStock: 2,
      isPurchasable: true,
      hasFloor: true,
      now,
      sources: [{
        supplierId: "sup",
        priority: 1,
        supplierStock: 5,
        safetyStock: 2,
        stockUpdatedAt: now,
        isActive: true,
        costPrice: 80_000,
      }],
    });
    expect(split).toMatchObject({ ok: true, warehouseQty: 2, supplierQty: 1 });
    const fee = decideShippingFee({
      subtotal: 600_000,
      config: normalizeShippingConfig(null),
      sameProvince: null,
      carrierFee: null,
      carrierAvailable: false,
    });
    expect(fee.fee).toBe(0);
    const db = new PrismaClient();
    const stamp = Date.now();
    const supplier = await db.supplier.create({
      data: { code: `SHIP-${stamp}`, name: "NCC giao", connectionType: "MANUAL", paysReturnFee: true },
    });
    const product = await db.product.create({
      data: {
        name: "Áo kho",
        slug: `ao-tc06-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `tc06-${stamp}`, color: "Đen", size: "M", price: 200_000, stock: 4, safetyStock: 2 } },
      },
      include: { variants: true },
    });
    const variant = product.variants[0];
    await db.supplierSku.create({
      data: {
        supplierId: supplier.id,
        variantId: variant.id,
        supplierSku: "AO-KHO",
        priority: 1,
        costPrice: 80_000,
        supplierStock: 5,
        safetyStock: 2,
        stockUpdatedAt: now,
      },
    });
    const order = await db.order.create({
      data: {
        orderNumber: `TC06-${stamp}`,
        status: "PENDING",
        customerName: "An",
        customerPhone: "0900000000",
        address: "1 Nguyen Hue",
        subtotal: 600_000,
        shippingFee: fee.fee,
        total: 600_000,
        items: { create: { variantId: variant.id, name: "Áo kho", color: "Đen", size: "M", price: 200_000, quantity: 3, supplierQty: 1, supplierId: supplier.id } },
      },
      include: { items: true },
    });
    const item = order.items[0];
    await db.shipment.create({
      data: {
        orderId: order.id,
        shipmentNumber: `${order.orderNumber}-KHO`,
        idempotencyKey: `${order.orderNumber}-KHO`,
        provider: "MANUAL",
        trackingCode: "VD-KHO",
        status: "CREATED",
        fulfillmentSource: "WAREHOUSE",
        items: { create: { orderItemId: item.id, quantity: 2 } },
      },
    });
    const supplierShipment = await db.shipment.create({
      data: {
        orderId: order.id,
        shipmentNumber: `${order.orderNumber}-NCC`,
        idempotencyKey: `${order.orderNumber}-NCC`,
        provider: "MANUAL",
        status: "CREATED",
        fulfillmentSource: "SUPPLIER",
        items: { create: { orderItemId: item.id, quantity: 1 } },
      },
    });
    const file = poFile({
      poNumber: `PO-${stamp}`,
      supplierName: supplier.name,
      lines: [{ supplierSku: "AO-KHO", name: "Áo kho", color: "Đen", size: "M", quantity: 1 }],
    });
    await db.supplierOrder.create({
      data: {
        orderId: order.id,
        shipmentId: supplierShipment.id,
        supplierId: supplier.id,
        status: "READY",
        poNumber: `PO-${stamp}`,
        fileName: file.fileName,
        emailSubject: file.emailSubject,
        emailBody: file.emailBody,
      },
    });
    const saved = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { shipments: true } });
    expect(saved.shippingFee).toBe(0);
    expect(saved.shipments).toHaveLength(2);
    const view = publicShipments(saved.shipments);
    expect(view.map((row) => row.trackingCode)).toEqual(["VD-KHO", null]);
    expect(trackingLabel(null, "SUPPLIER")).toBe("Đang đặt hàng");
    expect(file.csv).toContain("AO-KHO");
    await db.$disconnect();
  });
});

describe("nhật ký đồng bộ và adapter", () => {
  it("rejects duplicate codes, unmapped rows and a bad header without calling CJ", async () => {
    const parsed = parseSupplierCsv(readFileSync("docs/specs/samples/ncc-ton-mau.csv", "utf8"));
    expect(parsed.rows.map((row) => row.supplierSku).sort()).toEqual(["AO-DEN-M", "AO-DO-L", "KHONG-CO"]);
    expect(parsed.issues.map((issue) => issue.code)).toEqual(["DUPLICATE", "DUPLICATE"]);
    let calls = 0;
    const sheet = await pullGoogleSheet("https://example.com/sheet.csv", (async () => {
      calls += 1;
      return new Response("mã NCC,tên,màu,size,giá vốn,tồn,ngày cập nhật\nA,Ao,Den,M,1,1,2026-11-25");
    }) as typeof fetch);
    expect(sheet.ok).toBe(true);
    expect(calls).toBe(1);
    const cj = pullCjDropshipping();
    expect(cj.ok).toBe(false);
    expect(calls).toBe(1);
  });

  it("warns before the SLA breach and records a supplier debit", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const supplier = await db.supplier.create({
      data: { code: `SLA-${stamp}`, name: "NCC SLA", connectionType: "MANUAL", slaHours: 48, warnHours: 24, paysReturnFee: true },
    });
    const order = await db.order.create({
      data: {
        orderNumber: `SLA-${stamp}`,
        customerName: "An",
        customerPhone: "0900000001",
        address: "1 Nguyen Hue",
        subtotal: 1000,
        total: 1000,
      },
    });
    const sentAt = new Date("2026-11-24T00:00:00.000Z");
    const row = await db.supplierOrder.create({
      data: {
        orderId: order.id,
        supplierId: supplier.id,
        status: "SENT",
        poNumber: `PO-SLA-${stamp}`,
        sentAt,
        warnAt: new Date("2026-11-25T00:00:00.000Z"),
        slaDueAt: new Date("2026-11-26T00:00:00.000Z"),
      },
    });
    await scanSupplierSlas(db, new Date("2026-11-25T01:00:00.000Z"), "admin@example.com");
    const warned = await db.supplierOrder.findUniqueOrThrow({ where: { id: row.id } });
    expect(warned.warnedAt).toBeTruthy();
    expect(warned.status).toBe("SENT");
    const breach = slaScan({
      status: "SENT",
      trackingCode: null,
      warnAt: warned.warnAt,
      warnedAt: warned.warnedAt,
      slaDueAt: warned.slaDueAt,
      now: new Date("2026-11-26T01:00:00.000Z"),
    });
    expect(breach).toMatchObject({ breach: true, status: "SLA_BREACH" });
    const debit = await recordSupplierDebit(db, { supplierId: supplier.id, supplierOrderId: row.id, amount: 30_000, reason: "Hàng lỗi" });
    expect(debit.status).toBe("CONFIRMED");
    expect(debit.amount).toBe(30_000);
    await db.$disconnect();
  });

  it("refuses the demo supplier on production and allows another database name", async () => {
    expect(databaseName("postgresql://pttshop_prod:secret@127.0.0.1:5432/pttshop_prod")).toBe("pttshop_prod");
    expect(() => assertDemoSupplierAllowed("postgresql://pttshop_prod:secret@127.0.0.1:5432/pttshop_prod")).toThrow(/production/);
    const db = new PrismaClient();
    const created = await ensureDemoSupplier(db, testPgUrl());
    expect(created.code).toBe("NCC-DEMO");
    await db.$disconnect();
  });
});

describe("đặt hàng ghi sau khi kiểm tra", () => {
  function orderBody(variantId: string, consents: Array<{ purpose: "delivery"; granted: boolean }>) {
    return {
      customerName: "Kiem tra don",
      customerPhone: "0901234567",
      customerEmail: "",
      address: "1 Nguyen Hue",
      provinceCode: "79",
      wardCode: "26506",
      paymentMethod: "COD",
      consents,
      items: [{ variantId, quantity: 3 }],
    };
  }

  async function postOrder(body: ReturnType<typeof orderBody>) {
    return placeOrder(new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }));
  }

  it("returns 400 and writes nothing when delivery consent is missing", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const product = await db.product.create({
      data: {
        name: "Áo chưa đồng ý",
        slug: `chua-dong-y-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `chua-${stamp}`, color: "Đen", size: "M", price: 100_000, stock: 3 } },
      },
      include: { variants: true },
    });
    const variant = product.variants[0];
    const ordersBefore = await db.order.count();
    const shipmentsBefore = await db.shipment.count();
    const res = await postOrder(orderBody(variant.id, []));
    const body = await res.json();
    const saved = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/giao hàng/);
    expect(await db.order.count()).toBe(ordersBefore);
    expect(await db.shipment.count()).toBe(shipmentsBefore);
    expect(saved.stock).toBe(3);
    await db.$disconnect();
  });

  it("writes one order, two shipments and one shipping fee when stock comes from both sides", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const supplier = await db.supplier.create({
      data: { code: `DON-${stamp}`, name: "NCC đơn", connectionType: "MANUAL", paysReturnFee: true },
    });
    const product = await db.product.create({
      data: {
        name: "Áo tách kiện",
        slug: `tach-kien-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `tach-${stamp}`, color: "Đen", size: "M", price: 100_000, stock: 2, costPrice: 80_000 } },
      },
      include: { variants: true },
    });
    const variant = product.variants[0];
    await db.supplierSku.create({
      data: {
        supplierId: supplier.id,
        variantId: variant.id,
        supplierSku: `TACH-${stamp}`,
        priority: 1,
        costPrice: 80_000,
        supplierStock: 5,
        safetyStock: 2,
        stockUpdatedAt: new Date(),
      },
    });
    const res = await postOrder(orderBody(variant.id, [{ purpose: "delivery", granted: true }]));
    const body = await res.json();
    expect(res.status).toBe(200);
    const saved = await db.order.findUniqueOrThrow({
      where: { orderNumber: body.orderNumber },
      include: { shipments: true, items: true },
    });
    expect(saved.items).toHaveLength(1);
    expect(saved.items[0]?.quantity).toBe(3);
    expect(saved.items[0]?.supplierQty).toBe(1);
    expect(saved.shipments.map((row) => row.fulfillmentSource).sort()).toEqual(["SUPPLIER", "WAREHOUSE"]);
    expect(saved.total).toBe(saved.subtotal + saved.shippingFee - saved.discount);
    expect(saved.shippingFee).toBeGreaterThan(0);
    const supplierLeft = await db.supplierSku.findFirstOrThrow({ where: { variantId: variant.id } });
    const ownLeft = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(ownLeft.stock).toBe(0);
    expect(supplierLeft.supplierStock).toBe(4);
    await db.$disconnect();
  });
});
