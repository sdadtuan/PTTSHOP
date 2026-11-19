import { describe, expect, it } from "vitest";
import {
  groupVariantsByColor,
  summarizeVariants,
} from "@/lib/admin-product-summary";

const variants = [
  { id: "1", color: "Đen", size: "M", stock: 3, price: 299000 },
  { id: "2", color: "Đen", size: "L", stock: 1, price: 299000 },
  { id: "3", color: "Trắng", size: "M", stock: 5, price: 319000 },
];

describe("summarizeVariants", () => {
  it("aggregates color/size/stock/price for summary rows", () => {
    expect(summarizeVariants(variants)).toEqual({
      variantCount: 3,
      colorCount: 2,
      sizeCount: 2,
      totalStock: 9,
      minPrice: 299000,
      maxPrice: 319000,
    });
  });

  it("handles empty list", () => {
    expect(summarizeVariants([])).toEqual({
      variantCount: 0,
      colorCount: 0,
      sizeCount: 0,
      totalStock: 0,
      minPrice: null,
      maxPrice: null,
    });
  });
});

describe("groupVariantsByColor", () => {
  it("groups and sorts sizes for expand panels", () => {
    const groups = groupVariantsByColor(variants);
    expect(groups.map((g) => g.color)).toEqual(["Đen", "Trắng"]);
    expect(groups[0]!.items.map((v) => v.size)).toEqual(["L", "M"]);
  });
});
