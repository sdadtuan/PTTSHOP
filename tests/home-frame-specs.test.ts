import { describe, expect, it } from "vitest";
import {
  ASPECT_DRIFT_MAX,
  FRAME_ASPECT,
  GAPS,
  HERO_GRID,
  MEASUREMENT_TABLE,
  MOCK_SCALE,
} from "@/config/home-frame-specs";
import { heroCellBackgroundPosition, heroCellCount } from "@/lib/hero-grid";

function parseAspect(css: string): number {
  const [w, h] = css.split("/").map((s) => Number(s.trim()));
  return w / h;
}

describe("home frame specs vs mock", () => {
  it("keeps mock→desktop scale ≈ 2.51", () => {
    expect(MOCK_SCALE).toBeCloseTo(1280 / 510, 4);
  });

  it("documents every homepage photo slot", () => {
    const ids = MEASUREMENT_TABLE.map((r) => r.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "hero-collage",
        "hero-cell",
        "banner-left",
        "banner-right",
        "cat-ao-thun",
        "cat-quan",
        "cat-phu-kien",
        "diverse-model",
        "diverse-pants",
        "featured-large",
        "featured-small",
        "phoi-main",
        "phoi-grid",
      ]),
    );
  });

  it("keeps CSS aspect within ~5% of measured mock aspect", () => {
    for (const row of MEASUREMENT_TABLE) {
      const css = parseAspect(row.cssAspect);
      const drift = Math.abs(css - row.aspect) / row.aspect;
      expect(drift, `${row.id} drift ${drift}`).toBeLessThanOrEqual(
        ASPECT_DRIFT_MAX + 0.001,
      );
    }
  });

  it("exports FRAME_ASPECT keys used by homepage", () => {
    expect(FRAME_ASPECT.heroCollage).toBeTruthy();
    expect(FRAME_ASPECT.catAoThun).toBe("233 / 266");
    expect(FRAME_ASPECT.featuredLarge).toBe("232 / 217");
    expect(GAPS.heroCollage.desktop).toBe(Math.round(4 * MOCK_SCALE));
  });
});

describe("hero grid helpers", () => {
  it("counts pieces for desktop 2×3 and mobile 2×2", () => {
    expect(heroCellCount(HERO_GRID.desktop.cols, HERO_GRID.desktop.rows)).toBe(
      6,
    );
    expect(heroCellCount(HERO_GRID.mobile.cols, HERO_GRID.mobile.rows)).toBe(4);
  });

  it("maps corner cells to 0%/100% background positions", () => {
    expect(heroCellBackgroundPosition(0, 2, 3)).toEqual({ x: 0, y: 0 });
    expect(heroCellBackgroundPosition(1, 2, 3)).toEqual({ x: 100, y: 0 });
    expect(heroCellBackgroundPosition(5, 2, 3)).toEqual({ x: 100, y: 100 });
  });
});
