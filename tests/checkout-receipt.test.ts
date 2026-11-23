import { describe, expect, it } from "vitest";
import { checkoutConsentPlan } from "@/lib/consent";
import { nextOrderNumber } from "@/lib/order-number";
import { orderReceipt } from "@/lib/order-receipt";

describe("checkoutConsentPlan", () => {
  it("ghi giao hàng và khuyến mãi, không tạo dòng xuất chứng từ", () => {
    const rows = checkoutConsentPlan([
      { purpose: "delivery", granted: true },
      { purpose: "marketing", granted: false },
    ]);
    expect(rows.map((row) => row.purpose)).toEqual(["delivery", "marketing"]);
    expect(rows.find((row) => row.purpose === "delivery")?.granted).toBe(true);
    expect(rows.find((row) => row.purpose === "marketing")?.granted).toBe(false);
  });

  it("từ chối khi chưa đồng ý giao hàng", () => {
    expect(() =>
      checkoutConsentPlan([{ purpose: "delivery", granted: false }]),
    ).toThrow(/giao hàng/);
  });
});

describe("nextOrderNumber", () => {
  it("đơn mới dùng tiền tố PTT", () => {
    const code = nextOrderNumber(1_700_000_000_000, 123);
    expect(code.startsWith("PTT")).toBe(true);
    expect(code.startsWith("VF")).toBe(false);
    expect(code).toBe("PTT00000000123");
  });
});

describe("orderReceipt", () => {
  it("tóm tắt món, tiền và hình thức thanh toán", () => {
    const view = orderReceipt({
      orderNumber: "PTT00000000123",
      paymentMethod: "COD",
      subtotal: 249000,
      shippingFee: 30000,
      discount: 0,
      total: 279000,
      items: [
        { name: "Áo thun", color: "Navy", size: "S", price: 249000, quantity: 1 },
      ],
    });
    expect(view.orderNumber).toBe("PTT00000000123");
    expect(view.paymentLabel).toBe("Thanh toán khi nhận hàng");
    expect(view.lines[0]?.label).toContain("Áo thun");
    expect(view.subtotal).toBe(249000);
    expect(view.shippingFee).toBe(30000);
    expect(view.total).toBe(279000);
  });
});
