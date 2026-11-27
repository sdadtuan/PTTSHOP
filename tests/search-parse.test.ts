import { describe, expect, it } from "vitest";
import { foldVi } from "@/lib/search/fold";
import { buildSearchText } from "@/lib/search/text";
import { parseSearchQuery, searchPath, suggestionPhrase } from "@/lib/search/parse";
import { shouldSkipDuplicateSuggest } from "@/lib/search/events";

describe("search fold and parse", () => {
  it("folds case, accents and đ", () => {
    expect(foldVi("Áo Thun Đỏ")).toBe("ao thun do");
  });

  it("parses the acceptance phrases without inventing filters", () => {
    expect(parseSearchQuery("áo thun")).toMatchObject({ category: "ao-thun", keywords: [] });
    expect(parseSearchQuery("ao thun")).toMatchObject({ category: "ao-thun", keywords: [] });
    expect(parseSearchQuery("ao thun nam")).toMatchObject({ category: "ao-thun", gender: "MALE", keywords: [] });
    const hodie = parseSearchQuery("hodie");
    expect(hodie.category).toBeUndefined();
    expect(hodie.keywords).toEqual(["hodie"]);
    expect(parseSearchQuery("ao den duoi 300k")).toMatchObject({
      color: "den",
      priceMax: 300000,
      keywords: ["ao"],
    });
    expect(parseSearchQuery("quan kaki be")).toMatchObject({
      category: "quan",
      color: "be",
      keywords: ["kaki"],
    });
    expect(parseSearchQuery("non")).toMatchObject({ category: "phu-kien", keywords: ["non"] });
    expect(parseSearchQuery("xyzabc").category).toBeUndefined();
    expect(parseSearchQuery("xyzabc").keywords).toEqual(["xyzabc"]);
    expect(parseSearchQuery("ao 300").priceMax).toBeUndefined();
  });

  it("parses a price range and builds a shareable URL", () => {
    const parsed = parseSearchQuery("quan 200-400k");
    expect(parsed.priceMin).toBe(200000);
    expect(parsed.priceMax).toBe(400000);
    expect(searchPath("quan 200-400k", parsed)).toContain("priceMin=200000");
    expect(searchPath("quan 200-400k", parsed)).toContain("priceMax=400000");
    expect(searchPath("quan 200-400k", parsed)).toContain("category=quan");
  });

  it("clips the query at 100 characters", () => {
    expect(parseSearchQuery("a".repeat(140)).raw).toHaveLength(100);
  });

  it("builds folded search text from category and variants", () => {
    expect(
      buildSearchText({
        name: "Áo Thun Đen",
        slug: "ao-thun-den",
        categoryName: "Áo thun",
        categorySlug: "ao-thun",
        gender: "MALE",
        colors: ["Đen"],
        sizes: ["M"],
      }),
    ).toContain("ao thun den");
  });

  it("suggests a phrase only from parsed filters", () => {
    expect(suggestionPhrase(parseSearchQuery("ao thun nam"))).toBe("Áo thun nam");
    expect(suggestionPhrase(parseSearchQuery("hodie"))).toBe("");
  });

  it("skips a repeated suggest inside two seconds", () => {
    expect(shouldSkipDuplicateSuggest(1_000, 2_500)).toBe(true);
    expect(shouldSkipDuplicateSuggest(1_000, 3_500)).toBe(false);
    expect(shouldSkipDuplicateSuggest(null, 3_500)).toBe(false);
  });
});
