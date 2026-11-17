import { describe, expect, it } from "vitest";
import { homeImages } from "@/config/home-images";

describe("homeImages config", () => {
  it("points every slot at /images/home-v2", () => {
    expect(homeImages.hero.main).toBe("/images/home-v2/hero-main.jpg");
    expect(homeImages.dualBanner.left).toContain("/images/home-v2/");
    expect(homeImages.dualBanner.right).toContain("/images/home-v2/");
    expect(homeImages.collections.aoThun).toContain("cat-ao-thun");
    expect(homeImages.diverse.model).toContain("mix-model");
    expect(homeImages.diverse.pants).toHaveLength(6);
    expect(homeImages.featured.large).toHaveLength(2);
    expect(homeImages.featured.small).toHaveLength(4);
    expect(homeImages.colorPlay.typeFill).toBe(
      "/images/home-v2/phoi-mau-type.jpg",
    );
    expect(homeImages.colorPlay.grid).toHaveLength(6);
  });
});
