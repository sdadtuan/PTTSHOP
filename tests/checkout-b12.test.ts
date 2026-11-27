import { describe, expect, it } from "vitest";
import { checkoutItemSchema, checkoutPhoneSchema } from "@/lib/checkout/order-input";
import { formatVnd } from "@/lib/format";
import { cartLineImage } from "@/lib/product-media";
import { normalizeVnPhone, phonesMatch } from "@/lib/phone";
import { freeshipProgress } from "@/lib/shipping/progress";
import { resolveSizeChoice } from "@/lib/variant-stock";

describe("normalizeVnPhone", () => {
  it("chuẩn hóa 0, +84 và 84, bỏ khoảng trắng và dấu chấm", () => {
    expect(normalizeVnPhone("0901234567")).toBe("0901234567");
    expect(normalizeVnPhone("0901 234 567")).toBe("0901234567");
    expect(normalizeVnPhone("0901.234.567")).toBe("0901234567");
    expect(normalizeVnPhone("+84 901 234 567")).toBe("0901234567");
    expect(normalizeVnPhone("84.901.234.567")).toBe("0901234567");
  });

  it("từ chối số không đủ 10 số", () => {
    expect(normalizeVnPhone("090123456")).toBeNull();
    expect(normalizeVnPhone("12345678")).toBeNull();
    expect(normalizeVnPhone("+84 901 234 5678")).toBeNull();
  });

  it("khớp đơn mới và vẫn khớp đơn cũ không đúng dạng", () => {
    expect(phonesMatch("0901234567", "+84 901 234 567")).toBe(true);
    expect(phonesMatch("1234 5678", "12345678")).toBe(true);
    expect(phonesMatch("0901234567", "0912345678")).toBe(false);
  });
});

describe("checkout input", () => {
  it("lưu SĐT đã chuẩn hóa", () => {
    expect(checkoutPhoneSchema.parse("0901.234.567")).toBe("0901234567");
  });

  it("bỏ giá và phí client gửi kèm dòng hàng", () => {
    expect(
      checkoutItemSchema.parse({
        variantId: "var_1",
        quantity: 1,
        price: 1,
        shippingFee: 0,
      }),
    ).toEqual({ variantId: "var_1", quantity: 1 });
  });
});

describe("freeshipProgress", () => {
  it("ẩn khi ngưỡng trống", () => {
    expect(freeshipProgress(123000, null)).toBeNull();
    expect(freeshipProgress(123000, undefined)).toBeNull();
    expect(freeshipProgress(123000, 0)).toBeNull();
  });

  it("còn thiếu và không vượt 100 phần trăm", () => {
    expect(freeshipProgress(123000, 500000)).toEqual({
      remaining: 377000,
      percent: 25,
      reached: false,
    });
    expect(formatVnd(123000)).toBe("123.000đ");
    expect(freeshipProgress(800000, 500000)).toEqual({
      remaining: 0,
      percent: 100,
      reached: true,
    });
  });
});

describe("resolveSizeChoice", () => {
  const many = [
    { color: "Đen", size: "S", stock: 2 },
    { color: "Đen", size: "M", stock: 2 },
    { color: "Trắng", size: "Free size", stock: 1 },
  ];

  it("không chọn sẵn khi có nhiều size", () => {
    expect(resolveSizeChoice(many, "Đen", "")).toBe("");
  });

  it("tự chọn khi chỉ một size hoặc Free size", () => {
    expect(resolveSizeChoice(many, "Trắng", "")).toBe("Free size");
    expect(resolveSizeChoice([{ color: "Đen", size: "M", stock: 0 }], "Đen", "")).toBe("M");
  });

  it("giữ size người dùng đã bấm", () => {
    expect(resolveSizeChoice(many, "Đen", "M")).toBe("M");
  });
});

describe("cartLineImage", () => {
  const images = [
    { url: "/hidden-den.jpg", color: "Đen", isHidden: true },
    { url: "/video.mp4", type: "video", color: "Đen" },
    { url: "/first.jpg", color: "Trắng" },
    { url: "/den.jpg", color: "Đen" },
  ];

  it("ưu tiên ảnh đúng màu và bỏ ảnh ẩn", () => {
    expect(cartLineImage(images, "Đen")).toBe("/den.jpg");
  });

  it("không có ảnh màu thì dùng ảnh đầu, không để trống", () => {
    expect(cartLineImage(images, "Navy")).toBe("/first.jpg");
  });
});
