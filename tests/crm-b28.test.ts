import { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  CRM_FIELDS_TO_CONFIRM,
  MockCrmAdapter,
  attemptShopOrder,
  shopOrderPayload,
  syncShopOrder,
  type ShopOrderSource,
} from "@/lib/ops/crm-order";

const source: ShopOrderSource = {
  id: "order-1",
  orderNumber: "PTT1",
  status: "PENDING",
  paymentStatus: "UNPAID",
  paymentMethod: "COD",
  subtotal: 100_000,
  shippingFee: null,
  discount: 0,
  total: 100_000,
  customerName: "An",
  customerPhone: "0000000000",
  customerEmail: null,
  address: "Staging",
  items: [{ name: "Ao", quantity: 1, price: 100_000, variant: { sku: "SKU1" } }],
};

describe("payload CRM", () => {
  it("keeps the order total and does not add invoice or note fields", () => {
    const payload = shopOrderPayload(source, "created");
    expect(payload.total).toBe(100_000);
    expect(payload.currency).toBe("VND");
    expect(payload.items[0]).toEqual({ sku: "SKU1", name: "Ao", quantity: 1, unit_price: 100_000 });
    expect(JSON.stringify(payload)).not.toMatch(/invoice|taxCode|note|bank/i);
    expect(CRM_FIELDS_TO_CONFIRM).toContain("shop_order_id");
    expect(CRM_FIELDS_TO_CONFIRM).toContain("customer.phone");
  });
});

describe("outbox đơn CRM", () => {
  it("stays off, then records one job per event and retries on the mock", async () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    const db = new PrismaClient();
    const stamp = Date.now();
    const previous = await db.crmSettings.findUnique({ where: { id: "default" } });
    const product = await db.product.create({
      data: {
        name: "Ao CRM",
        slug: `crm-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `crm-${stamp}`, color: "Den", size: "M", price: 100_000, stock: 2 } },
      },
      include: { variants: true },
    });
    const order = await db.order.create({
      data: {
        orderNumber: `PTTCRM${stamp}`,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        customerName: "Kiem CRM",
        customerPhone: "0000000000",
        address: "Staging",
        subtotal: 100_000,
        total: 100_000,
        items: { create: { variantId: product.variants[0]!.id, name: "Ao CRM", color: "Den", size: "M", price: 100_000, quantity: 1 } },
      },
    });
    try {
      await db.crmSettings.deleteMany({ where: { id: "default" } });
      expect(await syncShopOrder(order.id, "created", db)).toBeNull();
      expect(await db.crmSyncJob.count({ where: { shopOrderId: order.id } })).toBe(0);
      await db.crmSettings.create({ data: { id: "default", provider: "SANDBOX_MOCK", retryBaseMinutes: 15 } });
      const first = await syncShopOrder(order.id, "created", db);
      const second = await syncShopOrder(order.id, "created", db);
      expect(second?.id).toBe(first?.id);
      const paid = await syncShopOrder(order.id, "paid", db);
      expect(paid?.id).not.toBe(first?.id);
      const stored = JSON.parse((await db.crmSyncJob.findUniqueOrThrow({ where: { id: first!.id } })).payloadJson);
      expect(stored.total).toBe(100_000);
      expect(stored.shop_order_id).toBe(order.id);
      const failed = await attemptShopOrder(db, first!.id, new MockCrmAdapter(1), {}, new Date("2026-11-28T00:00:00.000Z"));
      expect(failed?.status).toBe("RETRYING");
      expect(failed?.nextRetryAt).not.toBeNull();
      const sent = await attemptShopOrder(db, first!.id, new MockCrmAdapter(0), {});
      expect(sent?.status).toBe("SENT");
      await db.crmSettings.update({ where: { id: "default" }, data: { provider: "RS_PTTADS" } });
      const blocked = await attemptShopOrder(db, paid!.id, new MockCrmAdapter(0), {});
      expect(blocked?.lastError).toMatch(/Không gọi/);
      expect(blocked?.status).not.toBe("SENT");
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      await db.crmSyncJob.deleteMany({ where: { shopOrderId: order.id } });
      await db.orderItem.deleteMany({ where: { orderId: order.id } });
      await db.order.delete({ where: { id: order.id } });
      await db.productVariant.deleteMany({ where: { productId: product.id } });
      await db.product.delete({ where: { id: product.id } });
      if (previous) {
        await db.crmSettings.upsert({
          where: { id: "default" },
          create: { id: "default", provider: previous.provider, maxRetries: previous.maxRetries, retryBaseMinutes: previous.retryBaseMinutes },
          update: { provider: previous.provider, maxRetries: previous.maxRetries, retryBaseMinutes: previous.retryBaseMinutes },
        });
      } else {
        await db.crmSettings.deleteMany({ where: { id: "default" } });
      }
      await db.$disconnect();
    }
  });

  it("still returns null when the order does not exist", async () => {
    const db = new PrismaClient();
    expect(await syncShopOrder("missing-order", "created", db)).toBeNull();
    await db.$disconnect();
  });
});
