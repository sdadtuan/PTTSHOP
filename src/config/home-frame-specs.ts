/**
 * Homepage image frame specs from docs/design-reference/homepage-mau-v2.png
 * Mock canvas: 510 × 2560. Desktop scale = 1280 / 510 ≈ 2.510.
 *
 * Prefer fixed CSS aspect-ratio + object-cover; gaps scaled from mock gutters.
 * Target: screenshot vs mock aspect drift ≤ ~5%.
 */

export const MOCK_WIDTH = 510;
export const DESKTOP_REF = 1280;
export const MOCK_SCALE = DESKTOP_REF / MOCK_WIDTH; // ≈ 2.5098

/** Gap between collage / mosaic tiles (mock → desktop). */
export const GAPS = {
  heroCollage: { mock: 4, desktop: Math.round(4 * MOCK_SCALE) }, // ~10px
  collections: { mock: 8, desktop: Math.round(8 * MOCK_SCALE) }, // ~20px
  productGrid: { mock: 8, desktop: Math.round(8 * MOCK_SCALE) },
  featured: { mock: 11, desktop: Math.round(11 * MOCK_SCALE) }, // ~28px
  phoiGrid: { mock: 6, desktop: Math.round(6 * MOCK_SCALE) },
} as const;

/**
 * Aspect ratios for each photo slot (width / height).
 * Sourced from labeled ROIs on the 510px mock (± luminance assist).
 */
export const FRAME_ASPECT = {
  /** Overall hero collage plane. Mock ≈ 224×304 → 0.737 */
  heroCollage: "224 / 304",
  /** Uniform shatter cell (2×3 desktop). Mock cell ≈ 108×96 → 1.125 */
  heroCell: "108 / 96",
  /** Dual banner left portrait. Mock ≈ 100×125 → 0.80 */
  bannerLeft: "4 / 5",
  /** Dual banner right on orange square. Mock ≈ square frame */
  bannerRight: "1 / 1",
  /** Collections — measured frames */
  catAoThun: "233 / 266", // 0.876
  catQuan: "235 / 126", // 1.865
  catPhuKien: "236 / 132", // 1.788
  /** Đa dạng */
  diverseModel: "202 / 250", // 0.808
  diversePants: "3 / 4",
  /** Nổi bật — measured ~1.07 / ~0.98 */
  featuredLarge: "232 / 217",
  featuredSmall: "111 / 113",
  /** Phối màu */
  phoiMain: "3 / 4",
  phoiGrid: "4 / 3",
} as const;

export const OBJECT_POSITION = {
  hero: "50% 18%",
  bannerLeft: "50% 12%",
  bannerRight: "50% 18%",
  catAoThun: "50% 18%",
  catQuan: "50% 40%",
  catPhuKien: "50% 50%",
  diverseModel: "50% 8%",
  diversePants: "50% 50%",
  featured: "50% 15%",
  phoiMain: "50% 12%",
  phoiGrid: "50% 28%",
} as const;

/** Hero collage grid density (simplified uniform shatter of mock mosaic). */
export const HERO_GRID = {
  desktop: { cols: 2, rows: 3 },
  mobile: { cols: 2, rows: 2 },
} as const;

/**
 * Full measurement table (mock px → desktop @1280).
 * Used by report + Vitest drift checks.
 */
export const MEASUREMENT_TABLE = [
  {
    id: "hero-collage",
    section: "Hero collage",
    mockW: 224,
    mockH: 304,
    aspect: 0.737,
    desktopW: Math.round(224 * MOCK_SCALE),
    desktopH: Math.round(304 * MOCK_SCALE),
    gapMock: 4,
    cssAspect: FRAME_ASPECT.heroCollage,
  },
  {
    id: "hero-cell",
    section: "Hero collage cells (×6)",
    mockW: 108,
    mockH: 96,
    aspect: 1.125,
    desktopW: Math.round(108 * MOCK_SCALE),
    desktopH: Math.round(96 * MOCK_SCALE),
    gapMock: 4,
    cssAspect: FRAME_ASPECT.heroCell,
  },
  {
    id: "banner-left",
    section: "Banner",
    mockW: 100,
    mockH: 125,
    aspect: 0.8,
    desktopW: Math.round(100 * MOCK_SCALE),
    desktopH: Math.round(125 * MOCK_SCALE),
    gapMock: null as number | null,
    cssAspect: FRAME_ASPECT.bannerLeft,
  },
  {
    id: "banner-right",
    section: "Banner",
    mockW: 160,
    mockH: 160,
    aspect: 1,
    desktopW: Math.round(160 * MOCK_SCALE),
    desktopH: Math.round(160 * MOCK_SCALE),
    gapMock: null as number | null,
    cssAspect: FRAME_ASPECT.bannerRight,
  },
  {
    id: "cat-ao-thun",
    section: "Collections",
    mockW: 233,
    mockH: 266,
    aspect: 0.876,
    desktopW: Math.round(233 * MOCK_SCALE),
    desktopH: Math.round(266 * MOCK_SCALE),
    gapMock: 8,
    cssAspect: FRAME_ASPECT.catAoThun,
  },
  {
    id: "cat-quan",
    section: "Collections",
    mockW: 235,
    mockH: 126,
    aspect: 1.865,
    desktopW: Math.round(235 * MOCK_SCALE),
    desktopH: Math.round(126 * MOCK_SCALE),
    gapMock: 8,
    cssAspect: FRAME_ASPECT.catQuan,
  },
  {
    id: "cat-phu-kien",
    section: "Collections",
    mockW: 236,
    mockH: 132,
    aspect: 1.788,
    desktopW: Math.round(236 * MOCK_SCALE),
    desktopH: Math.round(132 * MOCK_SCALE),
    gapMock: 8,
    cssAspect: FRAME_ASPECT.catPhuKien,
  },
  {
    id: "diverse-model",
    section: "Đa dạng",
    mockW: 202,
    mockH: 250,
    aspect: 0.808,
    desktopW: Math.round(202 * MOCK_SCALE),
    desktopH: Math.round(250 * MOCK_SCALE),
    gapMock: null as number | null,
    cssAspect: FRAME_ASPECT.diverseModel,
  },
  {
    id: "diverse-pants",
    section: "Đa dạng — 6 ô quần",
    mockW: 74,
    mockH: 98,
    aspect: 0.755,
    desktopW: Math.round(74 * MOCK_SCALE),
    desktopH: Math.round(98 * MOCK_SCALE),
    gapMock: 8,
    cssAspect: FRAME_ASPECT.diversePants,
  },
  {
    id: "featured-large",
    section: "Nổi bật — 2 thẻ lớn",
    mockW: 232,
    mockH: 217,
    aspect: 1.069,
    desktopW: Math.round(232 * MOCK_SCALE),
    desktopH: Math.round(217 * MOCK_SCALE),
    gapMock: 11,
    cssAspect: FRAME_ASPECT.featuredLarge,
  },
  {
    id: "featured-small",
    section: "Nổi bật — 4 thẻ nhỏ",
    mockW: 111,
    mockH: 113,
    aspect: 0.982,
    desktopW: Math.round(111 * MOCK_SCALE),
    desktopH: Math.round(113 * MOCK_SCALE),
    gapMock: 10,
    cssAspect: FRAME_ASPECT.featuredSmall,
  },
  {
    id: "phoi-main",
    section: "Phối màu — ảnh lớn",
    mockW: 148,
    mockH: 198,
    aspect: 0.747,
    desktopW: Math.round(148 * MOCK_SCALE),
    desktopH: Math.round(198 * MOCK_SCALE),
    gapMock: null as number | null,
    cssAspect: FRAME_ASPECT.phoiMain,
  },
  {
    id: "phoi-grid",
    section: "Phối màu — lưới 2×3",
    mockW: 68,
    mockH: 51,
    aspect: 1.333,
    desktopW: Math.round(68 * MOCK_SCALE),
    desktopH: Math.round(51 * MOCK_SCALE),
    gapMock: 6,
    cssAspect: FRAME_ASPECT.phoiGrid,
  },
] as const;

/** Max allowed |cssAspect − mockAspect| / mockAspect */
export const ASPECT_DRIFT_MAX = 0.05;
