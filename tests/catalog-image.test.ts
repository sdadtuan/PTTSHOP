import { describe, expect, it } from "vitest";
import { isCatalogMediaSrc } from "@/lib/catalog-image";
import { pickSizeForColor } from "@/lib/variant-stock";

describe("isCatalogMediaSrc", () => {
  it("bỏ tối ưu Next cho ảnh /media/ do Nginx phục vụ", () => {
    expect(isCatalogMediaSrc("/media/catalog/ao.jpg")).toBe(true);
    expect(isCatalogMediaSrc("/media/catalog/a.JPEG")).toBe(true);
  });

  it("giữ tối ưu cho ảnh trong public và link ngoài", () => {
    expect(isCatalogMediaSrc("/images/placeholder-product.png")).toBe(false);
    expect(isCatalogMediaSrc("/uploads/banner.jpg")).toBe(false);
    expect(
      isCatalogMediaSrc(
        "https://images.unsplash.com/photo-1?auto=format&fit=crop&w=800&q=80",
      ),
    ).toBe(false);
    expect(isCatalogMediaSrc("")).toBe(false);
  });
});

describe("pickSizeForColor", () => {
  const variants = [
    { color: "Navy", size: "S", stock: 0 },
    { color: "Navy", size: "M", stock: 3 },
    { color: "Navy", size: "XL", stock: 0 },
    { color: "Đen", size: "XL", stock: 2 },
  ];

  it("giữ size đang chọn nếu màu mới còn hàng", () => {
    expect(pickSizeForColor(variants, "Đen", "XL")).toBe("XL");
  });

  it("chuyển sang size còn hàng khi size đang chọn hết", () => {
    expect(pickSizeForColor(variants, "Navy", "XL")).toBe("M");
  });
});
