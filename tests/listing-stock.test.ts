import { describe, expect, it } from "vitest";
import { hasSellableMatch, listingFacets, lowStockCount } from "@/lib/catalog/listing";

const products = [
  {
    variants: [
      { color: "Đen", size: "S", price: 200000, compareAt: null, stock: 0 },
      { color: "Đen", size: "L", price: 250000, compareAt: 300000, stock: 2 },
      { color: "Trắng", size: "L", price: 250000, compareAt: null, stock: 4 },
    ],
  },
];

describe("listing facets", () => {
  it("chỉ hiện màu và size còn hàng trong tập lọc", () => {
    expect(listingFacets(products, { size: "L" }).colors).toEqual(["Trắng", "Đen"].sort((a, b) => a.localeCompare(b, "vi")));
    expect(listingFacets(products, { color: "Đen" }).sizes).toEqual(["L"]);
    expect(listingFacets(products, { priceMax: 200000 }).colors).toEqual([]);
  });

  it("bỏ sản phẩm hết hàng", () => {
    expect(hasSellableMatch(products[0].variants, { color: "Đen", size: "S" })).toBe(false);
    expect(hasSellableMatch(products[0].variants, { color: "Đen", size: "L" })).toBe(true);
  });
});

describe("lowStockCount", () => {
  it("ẩn khi ngưỡng trống hoặc tồn còn cao", () => {
    expect(lowStockCount(2, null)).toBeNull();
    expect(lowStockCount(8, 3)).toBeNull();
    expect(lowStockCount(0, 3)).toBeNull();
  });

  it("hiện đúng số khi tồn không vượt ngưỡng", () => {
    expect(lowStockCount(2, 3)).toBe(2);
  });
});
