import { describe, expect, it } from "vitest";
import {
  measurementAllowed,
  rankRecommendations,
  recommendationAnchors,
  type RecCandidate,
} from "@/lib/recommendations";

function product(partial: Partial<RecCandidate> & Pick<RecCandidate, "id">): RecCandidate {
  return {
    name: partial.id,
    slug: partial.id,
    forSale: true,
    isDemo: false,
    stock: 3,
    createdAt: 1,
    orderCount: 0,
    price: 1000,
    compareAt: null,
    imageUrl: null,
    imageAlt: null,
    color: null,
    colorHex: null,
    ...partial,
  };
}

const catalog = [
  product({ id: "self", createdAt: 5 }),
  product({ id: "manual", createdAt: 1 }),
  product({ id: "bought", createdAt: 2, orderCount: 4 }),
  product({ id: "new", createdAt: 9 }),
  product({ id: "demo", isDemo: true, createdAt: 20 }),
  product({ id: "hidden", forSale: false, createdAt: 20 }),
  product({ id: "empty", stock: 0, createdAt: 20 }),
  product({ id: "in-cart", createdAt: 8 }),
];

describe("recommendations", () => {
  it("ranks a hand-picked relation ahead of co-purchase and newest", () => {
    const ranked = rankRecommendations({
      candidates: catalog,
      anchors: ["self"],
      excludeIds: ["self", "in-cart"],
      relations: [{ productId: "self", relatedId: "manual", position: 0 }],
      coPurchase: [{ anchorId: "self", relatedId: "bought", orders: 3 }],
      bestsellerMinOrders: null,
      limit: 4,
    });
    expect(ranked.map((item) => item.product.id)).toEqual(["manual", "bought", "new"]);
    expect(ranked.map((item) => item.reason)).toEqual(["manual", "copurchase", "newest"]);
    expect(ranked.every((item) => item.label == null)).toBe(true);
    expect(JSON.stringify(ranked)).not.toContain("Bán chạy");
  });

  it("drops demo, hidden, out of stock, itself and items already in the cart", () => {
    const ranked = rankRecommendations({
      candidates: catalog,
      anchors: ["self"],
      excludeIds: ["self", "in-cart"],
      relations: [
        { productId: "self", relatedId: "demo", position: 0 },
        { productId: "self", relatedId: "empty", position: 1 },
        { productId: "self", relatedId: "self", position: 2 },
      ],
      coPurchase: [],
      bestsellerMinOrders: null,
      limit: 8,
    });
    const ids = ranked.map((item) => item.product.id);
    expect(ids).not.toContain("demo");
    expect(ids).not.toContain("hidden");
    expect(ids).not.toContain("empty");
    expect(ids).not.toContain("self");
    expect(ids).not.toContain("in-cart");
  });

  it("writes bán chạy only when real orders meet a configured threshold", () => {
    const ranked = rankRecommendations({
      candidates: catalog,
      anchors: ["self"],
      excludeIds: ["self"],
      relations: [],
      coPurchase: [{ anchorId: "self", relatedId: "bought", orders: 2 }],
      bestsellerMinOrders: 4,
      limit: 1,
    });
    expect(ranked[0]?.label).toBe("Bán chạy");
    const below = rankRecommendations({
      candidates: catalog,
      anchors: ["self"],
      excludeIds: ["self"],
      relations: [],
      coPurchase: [],
      bestsellerMinOrders: 5,
      limit: 4,
    });
    expect(below.every((item) => item.label == null)).toBe(true);
  });

  it("ignores viewed products until measurement consent", () => {
    expect(measurementAllowed("pttshop_cookie=essential")).toBe(false);
    expect(measurementAllowed("pttshop_cookie=all")).toBe(true);
    expect(recommendationAnchors({
      placement: "home",
      cartProductIds: [],
      viewedProductIds: ["viewed"],
      measurementAllowed: false,
    })).toEqual([]);
    expect(recommendationAnchors({
      placement: "home",
      cartProductIds: [],
      viewedProductIds: ["viewed"],
      measurementAllowed: true,
    })).toEqual(["viewed"]);
    expect(recommendationAnchors({
      placement: "pdp",
      productId: "self",
      cartProductIds: ["in-cart"],
      viewedProductIds: ["viewed"],
      measurementAllowed: false,
    })).toEqual(["self"]);
  });
});
