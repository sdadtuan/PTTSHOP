import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { testPgUrl } from "./pg";
import { describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { POST as cancelPost } from "@/app/api/admin/orders/[id]/cancel/route";
import { GET as returnsGet } from "@/app/api/admin/returns/route";
import { GET as refundsGet } from "@/app/api/admin/refunds/route";
import { GET as crmGet } from "@/app/api/admin/crm/route";
import { GET as emailsGet } from "@/app/api/admin/emails/route";
import { adminEntryRedirect } from "@/lib/admin-gate";
import { cancelOrder } from "@/lib/ops/cancel-order";
import { SandboxCrm, attemptCrm, crmBlockReason, enqueueCrm } from "@/lib/ops/crm";
import { queueBelowFloor, queueEmail } from "@/lib/ops/email-queue";
import { isBelowFloor, renderTemplate } from "@/lib/ops/email-templates";
import { normalizePhone } from "@/lib/ops/phone";
import { approveRefund, completeRefund, completeReturn, openReturn } from "@/lib/ops/return-service";
import { excludedCategoryHit, refundMethodForPayment, reviewRefundApproval, reviewReturnWindow, shippingFeePayer } from "@/lib/ops/returns-policy";

const dbUrl = testPgUrl("pttshop_ops");

function db() {
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
  return new PrismaClient({ datasourceUrl: dbUrl });
}

async function sale(client: PrismaClient, extra: Record<string, unknown> = {}) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const category = await client.category.create({ data: { name: `Cat ${stamp}`, slug: `cat-${stamp}` } });
  const product = await client.product.create({
    data: {
      name: "Ao ops",
      slug: `ops-${stamp}`,
      gender: "UNISEX",
      categoryId: category.id,
      variants: { create: { sku: `ops-${stamp}`, color: "Den", size: "M", price: 249000, stock: 5 } },
    },
    include: { variants: true },
  });
  const variant = product.variants[0]!;
  const order = await client.order.create({
    data: {
      orderNumber: `PTTOP${stamp}`,
      status: "CONFIRMED",
      paymentMethod: "COD",
      paymentStatus: "PAID",
      customerName: "Khach ops",
      customerPhone: "0901234567",
      address: "73 Ta Hien",
      subtotal: 498000,
      shippingFee: 0,
      discount: 0,
      total: 498000,
      items: { create: { variantId: variant.id, name: "Ao ops", color: "Den", size: "M", price: 249000, quantity: 2 } },
      ...extra,
    },
    include: { items: true },
  });
  await client.shipment.create({ data: { orderId: order.id, shipmentNumber: `SH${stamp}`, status: "CREATED" } });
  await client.shipment.create({ data: { orderId: order.id, shipmentNumber: `DL${stamp}`, status: "DELIVERED" } });
  return { order, variant, category };
}

describe("return and refund rules", () => {
  it("maps the fee payer, the window and the refund method", () => {
    expect(shippingFeePayer("DEFECTIVE")).toBe("SHOP");
    expect(shippingFeePayer("WRONG_ITEM")).toBe("SHOP");
    expect(shippingFeePayer("CHANGE_OF_MIND")).toBe("CUSTOMER");
    expect(refundMethodForPayment("COD")).toBe("BANK_TRANSFER_MANUAL");
    expect(refundMethodForPayment("BANK_TRANSFER")).toBe("BANK_TRANSFER_MANUAL");
    const delivered = new Date("2026-11-01T00:00:00Z");
    expect(reviewReturnWindow({ deliveredAt: delivered, now: new Date("2026-11-09T00:00:00Z"), windowDays: 7 }).ok).toBe(false);
    expect(reviewReturnWindow({ deliveredAt: null, now: delivered, windowDays: 7 }).ok).toBe(false);
    expect(reviewReturnWindow({ deliveredAt: delivered, now: new Date("2026-11-09T00:00:00Z"), windowDays: 7, exceptionReason: "khách báo muộn" }).ok).toBe(true);
    expect(excludedCategoryHit(["cat-a"], ["cat-a"])).toBe(true);
    expect(excludedCategoryHit(["cat-b"], ["cat-a"])).toBe(false);
  });

  it("requires a second different approver above 2000000", () => {
    const small = reviewRefundApproval({ amount: 2_000_000, threshold: 2_000_000, status: "PENDING", firstApproverId: null, actorId: "a" });
    const large = reviewRefundApproval({ amount: 2_000_001, threshold: 2_000_000, status: "PENDING", firstApproverId: null, actorId: "a" });
    const same = reviewRefundApproval({ amount: 2_000_001, threshold: 2_000_000, status: "PENDING_SECOND_APPROVAL", firstApproverId: "a", actorId: "a" });
    const other = reviewRefundApproval({ amount: 2_000_001, threshold: 2_000_000, status: "PENDING_SECOND_APPROVAL", firstApproverId: "a", actorId: "b" });
    expect(small.ok && small.status).toBe("APPROVED");
    expect(large.ok && large.status).toBe("PENDING_SECOND_APPROVAL");
    expect(same.ok).toBe(false);
    if (!same.ok) expect(same.status).toBe(403);
    expect(other.ok && other.status).toBe("APPROVED");
  });
});

describe("cancel, return and refund records", () => {
  it("releases stock once, cancels an open shipment and opens a refund when paid", async () => {
    const client = db();
    const { order, variant } = await sale(client);
    const [first, second] = await Promise.all([
      cancelOrder(client, { orderId: order.id, reason: "Khách nhầm", actorId: "admin-a" }),
      cancelOrder(client, { orderId: order.id, reason: "Khách nhầm", actorId: "admin-a" }),
    ]);
    expect([first.stockReleased, second.stockReleased].filter(Boolean)).toHaveLength(1);
    expect((await client.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(7);
    const again = await cancelOrder(client, { orderId: order.id, reason: "Bấm lại", actorId: "admin-a" });
    expect(again.alreadyCancelled).toBe(true);
    expect((await client.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(7);
    const shipments = await client.shipment.findMany({ where: { orderId: order.id } });
    expect(shipments.find((row) => row.shipmentNumber?.startsWith("SH"))?.status).toBe("CANCELLED");
    expect(shipments.find((row) => row.shipmentNumber?.startsWith("DL"))?.status).toBe("DELIVERED");
    expect(await client.refundRequest.count({ where: { orderId: order.id } })).toBe(1);
    const delivered = await sale(client, { status: "COMPLETED", paymentStatus: "UNPAID" });
    await expect(cancelOrder(client, { orderId: delivered.order.id, reason: "Muon huy", actorId: "admin-a" })).rejects.toThrow(/Đổi trả/);
  });

  it("blocks a late return, an excluded category, and stores the fee payer", async () => {
    const client = db();
    const { order, category, variant } = await sale(client, { status: "COMPLETED" });
    await client.returnSettings.upsert({
      where: { id: "default" },
      create: { id: "default", returnWindowDays: 7 },
      update: { returnWindowDays: 7 },
    });
    await expect(openReturn(client, {
      orderId: order.id,
      type: "RETURN_REFUND",
      reason: "CHANGE_OF_MIND",
      orderItemIds: [order.items[0]!.id],
      now: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    })).rejects.toThrow(/quá 7 ngày/);
    await client.returnSettings.upsert({
      where: { id: "default" },
      create: { id: "default", excludedCategoryIds: JSON.stringify([category.id]) },
      update: { excludedCategoryIds: JSON.stringify([category.id]) },
    });
    await expect(openReturn(client, {
      orderId: order.id,
      type: "EXCHANGE",
      reason: "DEFECTIVE",
      orderItemIds: [order.items[0]!.id],
    })).rejects.toThrow(/danh mục/);
    await client.returnSettings.update({ where: { id: "default" }, data: { excludedCategoryIds: "[]" } });
    const request = await openReturn(client, {
      orderId: order.id,
      type: "RETURN_REFUND",
      reason: "WRONG_ITEM",
      orderItemIds: [order.items[0]!.id],
    });
    expect(request.shippingFeePayer).toBe("SHOP");
    await completeReturn(client, { returnId: request.id, restock: true });
    await completeReturn(client, { returnId: request.id, restock: true });
    expect((await client.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(7);
    const refund = await client.refundRequest.findFirstOrThrow({ where: { returnRequestId: request.id } });
    expect(refund.refundMethod).toBe("BANK_TRANSFER_MANUAL");
  });

  it("enforces two-person approval on the stored refund", async () => {
    const client = db();
    const smallOrder = await sale(client, { total: 2_000_000, paymentStatus: "UNPAID" });
    const small = await client.refundRequest.create({
      data: { orderId: smallOrder.order.id, idempotencyKey: `small-${smallOrder.order.id}`, amount: 2_000_000, refundMethod: "BANK_TRANSFER_MANUAL", status: "PENDING" },
    });
    expect((await approveRefund(client, { refundId: small.id, actorId: "admin-a" })).status).toBe("APPROVED");
    const largeOrder = await sale(client, { total: 2_000_001, paymentStatus: "UNPAID" });
    const large = await client.refundRequest.create({
      data: { orderId: largeOrder.order.id, idempotencyKey: `large-${largeOrder.order.id}`, amount: 2_000_001, refundMethod: "BANK_TRANSFER_MANUAL", status: "PENDING" },
    });
    expect((await approveRefund(client, { refundId: large.id, actorId: "admin-a" })).status).toBe("PENDING_SECOND_APPROVAL");
    await expect(approveRefund(client, { refundId: large.id, actorId: "admin-a" })).rejects.toMatchObject({ status: 403 });
    expect((await approveRefund(client, { refundId: large.id, actorId: "admin-b" })).status).toBe("APPROVED");
    const done = await completeRefund(client, { refundId: large.id, reference: "CK-001", actorId: "admin-b" });
    expect(done.refund.status).toBe("COMPLETED");
  });
});

describe("crm and email queues", () => {
  it("normalizes a phone and retries a sandbox failure without calling the network", async () => {
    expect(normalizePhone("+84 90-123 4567")).toBe("0901234567");
    const client = db();
    const local = `090${String(Date.now()).slice(-7)}`;
    const international = `+84${local.slice(1)}`;
    const first = await enqueueCrm(client, { phone: local, kind: "CUSTOMER", payload: { name: "A" } });
    const second = await enqueueCrm(client, { phone: international, kind: "CUSTOMER", payload: { name: "A" } });
    expect(second.id).toBe(first.id);
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    await client.crmSettings.upsert({ where: { id: "default" }, create: { id: "default", provider: "SANDBOX_MOCK" }, update: { provider: "SANDBOX_MOCK" } });
    const failed = await attemptCrm(client, first.id, new SandboxCrm(1), {}, "SANDBOX_MOCK");
    expect(failed.status).toBe("RETRYING");
    const sent = await attemptCrm(client, first.id, new SandboxCrm(0), {}, "SANDBOX_MOCK");
    expect(sent.status).toBe("SENT");
    await client.crmSettings.update({ where: { id: "default" }, data: { provider: "RS_PTTADS" } });
    const pending = await enqueueCrm(client, { phone: local, kind: "ORDER", payload: { name: "A" } });
    const blocked = await attemptCrm(client, pending.id, new SandboxCrm(), {}, "RS_PTTADS");
    expect(blocked.lastError).toMatch(/Không gọi/);
    expect(crmBlockReason("RS_PTTADS", {})).toMatch(/CRM_RS_BASE_URL/);
    expect(fetchImpl).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("renders templates into the outbox and does not send while disabled", async () => {
    const client = db();
    const created = await queueEmail(client, {
      templateKey: "INTERNAL_NEW_ORDER",
      to: "ke-toan@example.com",
      vars: { orderNumber: "PTT1", name: "An" },
      provider: "DISABLED",
    });
    expect(created.status).toBe("SKIPPED_DISABLED");
    expect(created.subject).toContain("PTT1");
    const failed = await queueEmail(client, {
      templateKey: "INTERNAL_INVOICE_FAILED",
      to: "ke-toan@example.com",
      vars: { orderNumber: "PTT1", error: "cổng tắt" },
      provider: "DISABLED",
    });
    expect(renderTemplate(failed.body, {})).toContain("cổng tắt");
    const queued = await queueBelowFloor(client, [{ sku: "SKU1", price: 1000, floorPrice: null }, { sku: "SKU2", price: 1000, floorPrice: 2000 }], "ke-toan@example.com");
    expect(isBelowFloor(1000, null)).toBe(false);
    expect(queued).toHaveLength(1);
    expect(queued[0]?.body).toContain("SKU2");
  });
});

describe("admin ops access", () => {
  it("redirects anonymous admin pages and rejects anonymous APIs", async () => {
    expect(adminEntryRedirect("http://localhost", "/admin/doi-tra", "", null)?.status).toBe(307);
    expect(adminEntryRedirect("http://localhost", "/admin/thong-bao", "", null)?.status).toBe(307);
    authMock.mockResolvedValue(null);
    const req = new Request("http://localhost/api/admin/returns");
    expect((await returnsGet()).status).toBe(401);
    expect((await refundsGet()).status).toBe(401);
    expect((await crmGet()).status).toBe(401);
    expect((await emailsGet()).status).toBe(401);
    expect((await cancelPost(req, { params: Promise.resolve({ id: "x" }) })).status).toBe(401);
  });
});
