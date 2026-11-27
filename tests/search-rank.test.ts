import { describe, expect, it } from "vitest";
import { rankSearchHits, type RankHit } from "@/lib/search/rank";

function hit(partial: Partial<RankHit> & Pick<RankHit, "id" | "name">): RankHit {
  return {
    categoryName: null,
    categorySlug: null,
    gender: null,
    colors: [],
    sizes: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    fuzzy: 0,
    ...partial,
  };
}

describe("search relevance", () => {
  it("puts Áo Thun Nam Basic first for ao thun nam", () => {
    const ranked = rankSearchHits("ao thun nam", [
      hit({
        id: "raglan",
        name: "Áo Thun Raglan",
        categoryName: "Áo thun",
        categorySlug: "ao-thun",
        gender: "UNISEX",
        createdAt: "2026-03-01T00:00:00.000Z",
        fuzzy: 0.66,
      }),
      hit({
        id: "polo",
        name: "Áo Polo Essential",
        categoryName: "Áo thun",
        categorySlug: "ao-thun",
        gender: "UNISEX",
        createdAt: "2026-04-01T00:00:00.000Z",
        fuzzy: 0.4,
      }),
      hit({
        id: "nam",
        name: "Áo Thun Nam Basic",
        categoryName: "Áo thun",
        categorySlug: "ao-thun",
        gender: "MALE",
        createdAt: "2026-01-01T00:00:00.000Z",
        fuzzy: 0.5,
      }),
    ]);
    expect(ranked[0]?.name).toBe("Áo Thun Nam Basic");
  });

  it("keeps only the hoodie for hodie", () => {
    const ranked = rankSearchHits("hodie", [
      hit({ id: "hoodie", name: "Áo Hoodie Essential Form Rộng", fuzzy: 0.83 }),
      hit({ id: "kaki", name: "Quần Kaki Năng Động", fuzzy: 0.33 }),
      hit({ id: "nu", name: "Áo Thun Nữ Basic", fuzzy: 0.33 }),
    ]);
    expect(ranked.map((item) => item.name)).toEqual(["Áo Hoodie Essential Form Rộng"]);
  });

  it("returns nothing for xyzabc", () => {
    const ranked = rankSearchHits("xyzabc", [
      hit({ id: "hoodie", name: "Áo Hoodie Essential Form Rộng", fuzzy: 0.05 }),
      hit({ id: "kaki", name: "Quần Kaki Năng Động", fuzzy: 0.02 }),
      hit({ id: "nam", name: "Áo Thun Nam Basic", categoryName: "Áo thun", categorySlug: "ao-thun", fuzzy: 0.01 }),
    ]);
    expect(ranked).toEqual([]);
  });
});
