import { describe, expect, it } from "vitest";
import { publicCatalogWhere } from "@/lib/catalog-visibility";
import { includeInPublicSitemap, productIsDemo } from "@/lib/demo-product";
import { buildProductWhere } from "@/lib/products-query";

describe("demo catalog stays off the storefront", () => {
  it("marks demo by name, slug or sku", () => {
    expect(productIsDemo({ name: "[DEMO] Áo thun", slug: "ao-thun" })).toBe(true);
    expect(productIsDemo({ name: "Áo thun", slug: "demo-ao-thun-nam-cotton-basic" })).toBe(true);
    expect(productIsDemo({ name: "Áo thun", slug: "ao-thun", skus: ["DEMO-AT-DEN-M"] })).toBe(true);
    expect(productIsDemo({ name: "Áo thun", slug: "ao-thun", skus: ["AT-DEN-M"] })).toBe(false);
  });

  it("storefront search only takes published products that are not demo", () => {
    expect(publicCatalogWhere).toEqual({ saleStatus: "SELLING", isDemo: false });
    const where = buildProductWhere({ q: "demo" });
    expect(where.isDemo).toBe(false);
    expect(where.saleStatus).toBe("SELLING");
    expect(where.searchText).toEqual({ contains: "demo" });
  });

  it("sitemap drops demo rows even if a query forgot the flag", () => {
    expect(includeInPublicSitemap({ isDemo: true, name: "Áo", slug: "ao" })).toBe(false);
    expect(includeInPublicSitemap({ isDemo: false, name: "[DEMO] Áo", slug: "ao" })).toBe(false);
    expect(includeInPublicSitemap({ isDemo: false, name: "Áo", slug: "demo-ao-thun-nam-cotton-basic" })).toBe(false);
    expect(includeInPublicSitemap({ isDemo: false, name: "Áo thun", slug: "ao-thun" })).toBe(true);
  });
});
