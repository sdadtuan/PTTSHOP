import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createReview } from "@/app/api/reviews/route";
import { POST as claimPurchaseRoute } from "@/app/api/analytics/purchase/route";
import { hashReceiptToken } from "@/lib/order-receipt-token";
import { saveProductFull } from "@/lib/product-save";
import { recomputeProductRating } from "@/lib/reviews";
import { resolveSlugRedirect } from "@/lib/slug-redirect";
import {
  CONSENT_DEFAULT_SCRIPT,
  claimPurchase,
  purchaseParams,
  trackerScriptUrls,
} from "@/lib/tracking";
import { isDemoName, productJsonLd } from "@/lib/seo";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";

const sessionBox = vi.hoisted(() => ({ current: null as null | { user: { id: string } } }));

vi.mock("@/auth", () => ({
  auth: async () => sessionBox.current,
}));

const prisma = new PrismaClient();

beforeAll(() => {
  resetTestDb();
});

beforeEach(async () => {
  sessionBox.current = null;
  await cleanDb(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

function orderInput(userId: string, variantId: string, orderNumber: string, status: "PENDING" | "COMPLETED") {
  return {
    userId,
    orderNumber,
    status,
    customerName: "Test",
    customerPhone: "0900000000",
    address: "Test address",
    subtotal: 100000,
    total: 100000,
    items: {
      create: {
        variantId,
        name: "Áo",
        color: "Đen",
        size: "M",
        price: 100000,
        quantity: 1,
      },
    },
  } as const;
}

describe("đo lường và schema", () => {
  it("keeps consent default denied and does not load GTM", () => {
    expect(CONSENT_DEFAULT_SCRIPT).toContain("analytics_storage:'denied'");
    expect(CONSENT_DEFAULT_SCRIPT).toContain("ad_storage:'denied'");
    expect(CONSENT_DEFAULT_SCRIPT).not.toContain("GTM-PQX685KW");
    const ids = { ga4: "G-TEST1234", meta: "1234567890123", tiktok: null, clarity: null };
    expect(trackerScriptUrls(ids).some((url) => url.includes("id=G-TEST1234"))).toBe(true);
    expect(trackerScriptUrls(ids).some((url) => url.includes("fbevents.js"))).toBe(true);
    expect(trackerScriptUrls({ ga4: null, meta: null, tiktok: null, clarity: null })).toEqual([]);
    expect(trackerScriptUrls(ids).some((url) => url.includes("GTM-PQX685KW"))).toBe(false);
  });

  it("uses the order number as transaction_id and event_id", () => {
    expect(purchaseParams("PTT1", 120000)).toEqual({
      transaction_id: "PTT1",
      event_id: "PTT1",
      currency: "VND",
      value: 120000,
    });
  });

  it("omits aggregateRating until a customer review is published", () => {
    const empty = productJsonLd({
      name: "[DEMO] Mũ",
      url: "https://pttshop.vn/san-pham/mu",
      price: 150000,
      availability: "InStock",
      breadcrumbs: [{ name: "Trang chủ", url: "https://pttshop.vn" }],
      customerReviewCount: 0,
      customerRating: null,
    });
    const text = JSON.stringify(empty);
    expect(text).toContain("\"@type\":\"Product\"");
    expect(text).toContain("\"@type\":\"Offer\"");
    expect(text).toContain("\"@type\":\"BreadcrumbList\"");
    expect(text).not.toContain("aggregateRating");
    expect(text).not.toContain("\"@type\":\"Review\"");
    expect(isDemoName("[DEMO] Mũ")).toBe(true);

    const rated = productJsonLd({
      name: "Áo thun",
      url: "https://pttshop.vn/san-pham/ao",
      price: 200000,
      availability: "InStock",
      breadcrumbs: [{ name: "Trang chủ", url: "https://pttshop.vn" }],
      customerReviewCount: 2,
      customerRating: 4.5,
    });
    const ratedText = JSON.stringify(rated);
    expect(ratedText).toContain("aggregateRating");
    expect(ratedText).toContain("\"reviewCount\":\"2\"");
  });

  it("claims purchase once per channel", async () => {
    const first = await claimPurchase(prisma, "PTT-ONCE");
    const second = await claimPurchase(prisma, "PTT-ONCE");
    expect(first).toEqual({ ga4: true, meta: true, tiktok: true });
    expect(second).toEqual({ ga4: false, meta: false, tiktok: false });
    const rows = await prisma.analyticsEvent.findMany({ where: { orderNumber: "PTT-ONCE" } });
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.eventId === "PTT-ONCE")).toBe(true);
  });

  it("does not record purchase without cookie consent", async () => {
    const token = "b".repeat(40);
    const order = await prisma.order.create({
      data: {
        orderNumber: "PTT-CONSENT",
        status: "COMPLETED",
        customerName: "Test",
        customerPhone: "0900000000",
        address: "Test",
        subtotal: 100000,
        total: 180000,
        receiptTokenHash: hashReceiptToken(token),
      },
    });
    const denied = await claimPurchaseRoute(
      new Request("http://localhost/api/analytics/purchase", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `pttshop_cookie=essential; ptt_receipt=${order.orderNumber}.${token}`,
        },
        body: JSON.stringify({ orderNumber: order.orderNumber }),
      }),
    );
    expect((await denied.json()).ga4).toBe(false);
    expect(await prisma.analyticsEvent.count({ where: { orderNumber: order.orderNumber } })).toBe(0);

    const allowed = await claimPurchaseRoute(
      new Request("http://localhost/api/analytics/purchase", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `pttshop_cookie=all; ptt_receipt=${order.orderNumber}.${token}`,
        },
        body: JSON.stringify({ orderNumber: order.orderNumber }),
      }),
    );
    const body = await allowed.json();
    expect(body.ga4).toBe(true);
    expect(body.meta).toBe(true);
    expect(body.tiktok).toBe(true);
    expect(body.transactionId).toBe(order.orderNumber);
    expect(body.eventId).toBe(order.orderNumber);
    const again = await claimPurchaseRoute(
      new Request("http://localhost/api/analytics/purchase", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `pttshop_cookie=all; ptt_receipt=${order.orderNumber}.${token}`,
        },
        body: JSON.stringify({ orderNumber: order.orderNumber }),
      }),
    );
    expect((await again.json()).ga4).toBe(false);
    expect(await prisma.analyticsEvent.count({ where: { orderNumber: order.orderNumber } })).toBe(3);
  });
});

describe("đánh giá thật và slug", () => {
  it("rejects a pending order and accepts delivered or completed orders unpublished", async () => {
    const { product, customer } = await seedMinimal(prisma);
    sessionBox.current = { user: { id: customer.id } };
    const variantId = product.variants[0]!.id;

    const pending = await prisma.order.create({
      data: orderInput(customer.id, variantId, "PTT-PENDING", "PENDING"),
      include: { items: true },
    });
    const denied = await createReview(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id, orderId: pending.id, rating: 5, comment: "Sớm" }),
      }),
    );
    expect(denied.status).toBe(403);

    await prisma.shipment.create({
      data: {
        orderId: pending.id,
        status: "DELIVERED",
        shipmentNumber: "SH-PENDING",
        items: { create: { orderItemId: pending.items[0]!.id, quantity: 1 } },
      },
    });
    const delivered = await createReview(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id, orderId: pending.id, rating: 4, comment: "Đã giao" }),
      }),
    );
    expect(delivered.status).toBe(201);
    const created = await delivered.json();
    expect(created.review.isPublished).toBe(false);

    const other = await prisma.user.create({
      data: { email: `other-${Date.now()}@test.local`, name: "Khác", password: "x", role: "CUSTOMER" },
    });
    sessionBox.current = { user: { id: other.id } };
    const completed = await prisma.order.create({
      data: orderInput(other.id, variantId, "PTT-DONE", "COMPLETED"),
    });
    const done = await createReview(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id, orderId: completed.id, rating: 5 }),
      }),
    );
    expect(done.status).toBe(201);
    expect((await done.json()).review.isPublished).toBe(false);
  });

  it("does not count an admin review toward the star average", async () => {
    const { product } = await seedMinimal(prisma);
    await prisma.review.create({
      data: {
        productId: product.id,
        rating: 5,
        isAdminCreated: true,
        isPublished: true,
        displayName: "Shop",
      },
    });
    await recomputeProductRating(prisma, product.id);
    const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.reviewCount).toBe(0);
    expect(updated.rating).toBe(0);
  });

  it("stores a 301 target when the slug changes and follows the chain", async () => {
    const stamp = Date.now();
    const first = await saveProductFull(prisma, {
      name: "Áo đổi slug",
      slug: `ao-cu-${stamp}`,
      gender: "UNISEX",
      media: [{ url: "/images/ao.jpg", type: "image" }],
      variants: [{ color: "Đen", colorHex: "#111111", size: "M", price: 100000, stock: 2 }],
    });
    await saveProductFull(prisma, {
      id: first.productId,
      name: "Áo đổi slug",
      slug: `ao-moi-${stamp}`,
      gender: "UNISEX",
      media: [{ url: "/images/ao.jpg", type: "image" }],
      variants: [{ color: "Đen", colorHex: "#111111", size: "M", price: 100000, stock: 2 }],
    });
    expect(await resolveSlugRedirect(prisma, `ao-cu-${stamp}`)).toBe(`ao-moi-${stamp}`);
    await saveProductFull(prisma, {
      id: first.productId,
      name: "Áo đổi slug",
      slug: `ao-cuoi-${stamp}`,
      gender: "UNISEX",
      media: [{ url: "/images/ao.jpg", type: "image" }],
      variants: [{ color: "Đen", colorHex: "#111111", size: "M", price: 100000, stock: 2 }],
    });
    expect(await resolveSlugRedirect(prisma, `ao-cu-${stamp}`)).toBe(`ao-cuoi-${stamp}`);
    expect(await resolveSlugRedirect(prisma, `ao-moi-${stamp}`)).toBe(`ao-cuoi-${stamp}`);
    expect(await resolveSlugRedirect(prisma, `ao-cuoi-${stamp}`)).toBeNull();
  });
});
