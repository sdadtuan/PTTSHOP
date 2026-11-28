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

import { POST as placeOrder } from "@/app/api/orders/route";
import { merchandiseAfterBundle, priceBundle, settleBundles, type BundleRecord } from "@/lib/bundles";

const now = new Date("2026-11-28T04:00:00.000Z");

function bundle(partial: Partial<BundleRecord> & Pick<BundleRecord, "id" | "productIds">): BundleRecord {
  return {
    title: "Combo",
    isPublished: true,
    startsAt: null,
    endsAt: null,
    priceMode: "FIXED",
    priceVnd: 400_000,
    percentOff: null,
    ...partial,
  };
}

describe("giá combo", () => {
  it("keeps a fixed price below the retail sum and above zero", () => {
    const priced = priceBundle({ priceMode: "FIXED", priceVnd: 400_000, percentOff: null, retailSum: 600_000 });
    expect(priced).toEqual({ ok: true, price: 400_000, discount: 200_000 });
    expect(priceBundle({ priceMode: "FIXED", priceVnd: 600_000, percentOff: null, retailSum: 600_000 }).ok).toBe(false);
    expect(priceBundle({ priceMode: "FIXED", priceVnd: 0, percentOff: null, retailSum: 600_000 }).ok).toBe(false);
    expect(priceBundle({ priceMode: "FIXED", priceVnd: -1, percentOff: null, retailSum: 600_000 }).ok).toBe(false);
  });

  it("rounds a percent discount to whole VND and rejects a price that is not cheaper", () => {
    expect(priceBundle({ priceMode: "PERCENT", priceVnd: null, percentOff: 10, retailSum: 333_333 })).toMatchObject({
      ok: true,
      discount: 33_333,
      price: 300_000,
    });
    expect(priceBundle({ priceMode: "PERCENT", priceVnd: null, percentOff: 1, retailSum: 1 }).ok).toBe(false);
    expect(priceBundle({ priceMode: "PERCENT", priceVnd: null, percentOff: 0, retailSum: 100_000 }).ok).toBe(false);
    expect(priceBundle({ priceMode: "PERCENT", priceVnd: null, percentOff: 100, retailSum: 100_000 }).ok).toBe(false);
    expect(priceBundle({ priceMode: "PERCENT", priceVnd: null, percentOff: -5, retailSum: 100_000 }).ok).toBe(false);
  });

  it("prices two units from the server unit price, not a client price", () => {
    const priced = priceBundle({ priceMode: "FIXED", priceVnd: 400_000, percentOff: null, retailSum: 1_200_000, units: 2 });
    expect(priced).toEqual({ ok: true, price: 800_000, discount: 400_000 });
  });

  it("hides a partial bundle unless retail remainder is enabled", () => {
    const lines = [
      { variantId: "a", productId: "ao", unitPrice: 300_000, quantity: 1, bundleId: "b" },
    ];
    const row = bundle({ id: "b", productIds: ["ao", "quan"] });
    expect(settleBundles({
      lines, bundles: [row], now, couponRequested: false, stackCoupon: false, outOfStockMode: "HIDE", unavailableProductIds: ["quan"],
    }).error).toMatch(/ẩn/);
    const retail = settleBundles({
      lines, bundles: [row], now, couponRequested: false, stackCoupon: false, outOfStockMode: "RETAIL", unavailableProductIds: ["quan"],
    });
    expect(retail.error).toBeNull();
    expect(retail.discount).toBe(0);
  });

  it("refuses a coupon unless stacking is enabled and quotes shipping after the bundle", () => {
    const lines = [
      { variantId: "a", productId: "ao", unitPrice: 300_000, quantity: 1, bundleId: "b" },
      { variantId: "q", productId: "quan", unitPrice: 300_000, quantity: 1, bundleId: "b" },
    ];
    const row = bundle({ id: "b", productIds: ["ao", "quan"] });
    const blocked = settleBundles({
      lines, bundles: [row], now, couponRequested: true, stackCoupon: false, outOfStockMode: "HIDE", unavailableProductIds: [],
    });
    expect(blocked.error).toMatch(/Mã giảm/);
    const stacked = settleBundles({
      lines, bundles: [row], now, couponRequested: true, stackCoupon: true, outOfStockMode: "HIDE", unavailableProductIds: [],
    });
    expect(stacked.discount).toBe(200_000);
    expect(merchandiseAfterBundle(600_000, stacked.discount)).toBe(400_000);
    expect(settleBundles({
      lines, bundles: [{ ...row, isPublished: false }], now, couponRequested: false, stackCoupon: false, outOfStockMode: "HIDE", unavailableProductIds: [],
    })).toMatchObject({ discount: 0, error: null });
  });
});

describe("đặt combo trừ tồn từng món", () => {
  it("charges the server bundle price, freeship after the discount, and does not oversell", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const previous = await db.shippingSettings.findUnique({ where: { id: "default" } });
    let shirtId = "";
    let pantsId = "";
    let bundleId = "";
    let orderId = "";
    await db.shippingSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        freeShipThreshold: 500_000,
        intraProvinceFee: 30_000,
        warehouseProvinceCode: "79",
        defaultProvider: "MANUAL",
        fallbackFee: 30_000,
      },
      update: {
        freeShipThreshold: 500_000,
        intraProvinceFee: 30_000,
        warehouseProvinceCode: "79",
        defaultProvider: "MANUAL",
        fallbackFee: 30_000,
      },
    });
    const shirt = await db.product.create({
      data: {
        name: "Áo combo",
        slug: `ao-combo-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `ao-combo-${stamp}`, color: "Đen", size: "M", price: 300_000, stock: 1 } },
      },
      include: { variants: true },
    });
    const pants = await db.product.create({
      data: {
        name: "Quần combo",
        slug: `quan-combo-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `quan-combo-${stamp}`, color: "Be", size: "M", price: 300_000, stock: 1 } },
      },
      include: { variants: true },
    });
    const created = await db.bundle.create({
      data: {
        title: `Combo ${stamp}`,
        slug: `combo-${stamp}`,
        priceMode: "FIXED",
        priceVnd: 400_000,
        isPublished: true,
        items: {
          create: [
            { productId: shirt.id, position: 0 },
            { productId: pants.id, position: 1 },
          ],
        },
      },
    });
    const body = {
      customerName: "Kiem tra combo",
      customerPhone: "0901234567",
      customerEmail: "",
      address: "1 Nguyen Hue",
      provinceCode: "79",
      wardCode: "26506",
      paymentMethod: "COD",
      consents: [{ purpose: "delivery", granted: true }],
      items: [
        { variantId: shirt.variants[0]!.id, quantity: 1, bundleId: created.id, price: 1 },
        { variantId: pants.variants[0]!.id, quantity: 1, bundleId: created.id, price: 1 },
      ],
    };
    const request = () => placeOrder(new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }));
    shirtId = shirt.id;
    pantsId = pants.id;
    bundleId = created.id;
    try {
      const first = await request();
      const payload = await first.json();
      expect(first.status).toBe(200);
      const order = await db.order.findUniqueOrThrow({
        where: { orderNumber: payload.orderNumber },
        include: { items: true },
      });
      expect(order.subtotal).toBe(600_000);
      expect(order.bundleDiscount).toBe(200_000);
      expect(order.discount).toBe(200_000);
      expect(order.shippingFee).toBe(30_000);
      expect(order.total).toBe(430_000);
      expect(order.items.map((item) => item.price).sort()).toEqual([300_000, 300_000]);
      expect(new Set(order.items.map((item) => item.bundleId))).toEqual(new Set([created.id]));
      expect((await db.productVariant.findUniqueOrThrow({ where: { id: shirt.variants[0]!.id } })).stock).toBe(0);
      expect((await db.productVariant.findUniqueOrThrow({ where: { id: pants.variants[0]!.id } })).stock).toBe(0);
      const second = await request();
      expect(second.status).toBe(400);
      expect((await db.productVariant.findUniqueOrThrow({ where: { id: shirt.variants[0]!.id } })).stock).toBe(0);
      orderId = order.id;
      await db.order.delete({ where: { id: order.id } });
    } finally {
      if (orderId) await db.order.deleteMany({ where: { id: orderId } });
      if (bundleId) await db.bundle.deleteMany({ where: { id: bundleId } });
      if (shirtId || pantsId) await db.product.deleteMany({ where: { id: { in: [shirtId, pantsId].filter(Boolean) } } });
      if (previous) {
        const { id: _id, ...data } = previous;
        await db.shippingSettings.update({ where: { id: "default" }, data });
      } else {
        await db.shippingSettings.deleteMany({ where: { id: "default" } });
      }
      await db.$disconnect();
    }
  });
});
