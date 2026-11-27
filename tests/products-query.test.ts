import { describe, expect, it } from "vitest";
import { buildProductWhere } from "@/lib/products-query";

describe("buildProductWhere", () => {
  it("matches name, slug, description and category", () => {
    const where = buildProductWhere({ q: "  áo thun  ", category: "ao-thun" });
    expect(where.saleStatus).toBe("SELLING");
    expect(where.isDemo).toBe(false);
    expect(where.category).toEqual({ slug: "ao-thun" });
    expect(where.searchText).toEqual({ contains: "ao thun" });
  });

  it("ignores a blank query", () => {
    expect(buildProductWhere({ q: "   " }).searchText).toBeUndefined();
  });
});
