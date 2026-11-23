import { describe, expect, it } from "vitest";
import { checkoutConsentPlan } from "@/lib/consent";
import { nextOrderNumber } from "@/lib/order-number";
import { orderBuyerId } from "@/lib/order-buyer";
import { orderReceipt } from "@/lib/order-receipt";
import { canShowReceipt, hashReceiptToken } from "@/lib/order-receipt-token";
import { migrateStorageValue } from "@/lib/legacy-storage";

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

describe("canShowReceipt", () => {
  it("hiện biên nhận khi token đúng và giấu khi token sai", () => {
    const token = "a".repeat(32);
    const hash = hashReceiptToken(token);
    expect(canShowReceipt(hash, [token, null])).toBe(true);
    expect(canShowReceipt(hash, ["b".repeat(32), null])).toBe(false);
    expect(canShowReceipt(hash, [null, null])).toBe(false);
    expect(canShowReceipt(null, [token])).toBe(false);
  });
});

describe("orderBuyerId", () => {
  it("đơn của admin không gắn tài khoản", () => {
    expect(orderBuyerId({ id: "admin-1", role: "ADMIN" })).toBeNull();
    expect(orderBuyerId({ id: "khach-1", role: "CUSTOMER" })).toBe("khach-1");
    expect(orderBuyerId(null)).toBeNull();
  });
});

describe("migrateStorageValue", () => {
  it("chuyển giá trị khóa cũ sang khóa mới một lần", () => {
    const store = new Map<string, string>([["vizfas-wishlist", "[1]"]]);
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    expect(migrateStorageValue(storage, "ptt-wishlist", "vizfas-wishlist")).toBe("[1]");
    expect(store.get("ptt-wishlist")).toBe("[1]");
    expect(store.has("vizfas-wishlist")).toBe(false);
  });
});
