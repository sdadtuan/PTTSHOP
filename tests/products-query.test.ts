import { describe, expect, it } from "vitest";
import { buildProductWhere } from "@/lib/products-query";

describe("buildProductWhere", () => {
  it("matches name, slug, description and category", () => {
    const where = buildProductWhere({ q: "  áo thun  ", category: "ao-thun" });
    expect(where.category).toEqual({ slug: "ao-thun" });
    expect(where.OR).toEqual([
      { name: { contains: "áo thun", mode: "insensitive" } },
      { slug: { contains: "áo thun", mode: "insensitive" } },
      { description: { contains: "áo thun", mode: "insensitive" } },
      { category: { name: { contains: "áo thun", mode: "insensitive" } } },
    ]);
  });

  it("ignores a blank query", () => {
    expect(buildProductWhere({ q: "   " }).OR).toBeUndefined();
  });
});
