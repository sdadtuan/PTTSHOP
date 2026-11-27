import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { applyGatewayPayment } from "@/lib/payments/apply-gateway";
import {
  paymentDecision,
  signGateway,
  signedPayload,
  verifyGatewaySignature,
  vietqrContent,
  visibleGateways,
} from "@/lib/payments/gateways";

const flags = {
  vietqrEnabled: false,
  vietqrMerchantId: "",
  momoEnabled: false,
  momoPartnerCode: "",
  zalopayEnabled: false,
  zalopayAppId: "",
};
const secrets = { vietqr: null, momo: null, zalopay: null };

describe("cổng thanh toán", () => {
  it("ẩn cổng khi tắt hoặc thiếu merchant", () => {
    expect(visibleGateways(flags, secrets)).toEqual({ vietqr: false, momo: false, zalopay: false });
    expect(visibleGateways(
      { ...flags, vietqrEnabled: true, vietqrMerchantId: "SHOP1" },
      { ...secrets, vietqr: "local-test-secret" },
    ).vietqr).toBe(true);
  });

  it("chữ ký giả lập đúng thì nhận, sai thì từ chối", () => {
    const secret = "local-test-secret";
    const payload = signedPayload({ provider: "vietqr", txnId: "txn-1", amount: 199000, orderNumber: "PTT1" });
    const signature = signGateway(secret, payload);
    expect(verifyGatewaySignature(secret, payload, signature)).toBe(true);
    expect(verifyGatewaySignature(secret, payload, "deadbeef")).toBe(false);
  });

  it("không đánh dấu đã trả khi lệch số tiền hoặc gọi lần hai", () => {
    expect(paymentDecision({ amount: 199000, orderAmount: 199000, alreadyPaid: false })).toBe("mark_paid");
    expect(paymentDecision({ amount: 1, orderAmount: 199000, alreadyPaid: false })).toBe("amount_mismatch");
    expect(paymentDecision({ amount: 199000, orderAmount: 199000, alreadyPaid: true })).toBe("duplicate");
  });

  it("QR chứa đúng số tiền và mã đơn", () => {
    const content = vietqrContent({ amount: 199000, orderNumber: "PTT1", bin: "970436", account: "0123456789" });
    expect(content).toContain("amount=199000");
    expect(content).toContain("addInfo=PTT1");
    expect(content).not.toContain("secret");
  });
});

describe("webhook idempotent", () => {
  it("cùng giao dịch hai lần không đánh dấu đã trả hai lần", async () => {
    const db = new PrismaClient();
    const stamp = Date.now();
    const product = await db.product.create({
      data: {
        name: "Áo cổng",
        slug: `ao-cong-${stamp}`,
        gender: "UNISEX",
        variants: { create: { sku: `cong-${stamp}`, color: "Đen", size: "M", price: 100_000, stock: 2 } },
      },
      include: { variants: true },
    });
    const variant = product.variants[0]!;
    const orderNumber = `PTTGW${stamp}`;
    const order = await db.order.create({
      data: {
        orderNumber,
        paymentMethod: "VIETQR",
        paymentStatus: "UNPAID",
        customerName: "Khách test",
        customerPhone: "0900000002",
        address: "Địa chỉ test",
        subtotal: 100_000,
        total: 100_000,
        items: { create: { variantId: variant.id, name: product.name, color: "Đen", size: "M", price: 100_000, quantity: 1 } },
      },
    });
    const input = { provider: "vietqr", txnId: `txn-${stamp}`, amount: 100_000, orderNumber };
    const first = await applyGatewayPayment(db, input);
    const second = await applyGatewayPayment(db, input);
    const left = await db.order.findUnique({ where: { id: order.id } });
    const count = await db.paymentTransaction.count({ where: { orderId: order.id } });
    await db.paymentTransaction.deleteMany({ where: { orderId: order.id } });
    await db.orderItem.deleteMany({ where: { orderId: order.id } });
    await db.order.delete({ where: { id: order.id } });
    await db.productVariant.deleteMany({ where: { productId: product.id } });
    await db.product.delete({ where: { id: product.id } });
    await db.$disconnect();
    expect(first).toMatchObject({ ok: true, duplicate: false });
    expect(second).toMatchObject({ ok: true, duplicate: true });
    expect(left?.paymentStatus).toBe("PAID");
    expect(count).toBe(1);
  });
});
