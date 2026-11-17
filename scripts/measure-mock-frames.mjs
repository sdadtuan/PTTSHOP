/**
 * Measure labeled photo frames in homepage-mau-v2.png.
 * Mock 510×2560 → desktop scale = 1280/510 ≈ 2.51.
 *
 * ROIs are hand-tuned against section crops + luminance assist so each
 * named slot (hero cells, banners, collections, …) has W/H/aspect/gap.
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const src = path.resolve(
  "C:/CursorAI/PTTSHOP/docs/design-reference/homepage-mau-v2.png",
);
const outDir = path.resolve(
  "C:/Users/ADMIN/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-277c8ed9-f1c9-4705-96c7-25d86dbd9ada/files/media/home-v2/mock-crops",
);
fs.mkdirSync(outDir, { recursive: true });

const meta = await sharp(src).metadata();
const W = meta.width;
const H = meta.height;
const SCALE = 1280 / W;

/** Labeled ROIs [x, y, w, h] in mock px — tuned vs mock layout. */
const ROIS = [
  // Hero collage 2×3 (right column of first viewport)
  { id: "hero-cell-1", section: "Hero collage", x: 268, y: 48, w: 108, h: 96 },
  { id: "hero-cell-2", section: "Hero collage", x: 384, y: 48, w: 108, h: 96 },
  { id: "hero-cell-3", section: "Hero collage", x: 268, y: 152, w: 108, h: 96 },
  { id: "hero-cell-4", section: "Hero collage", x: 384, y: 152, w: 108, h: 96 },
  { id: "hero-cell-5", section: "Hero collage", x: 268, y: 256, w: 108, h: 96 },
  { id: "hero-cell-6", section: "Hero collage", x: 384, y: 256, w: 108, h: 96 },
  { id: "hero-collage", section: "Hero collage", x: 268, y: 48, w: 224, h: 304 },

  // Dual banner
  { id: "banner-left", section: "Banner", x: 28, y: 520, w: 168, h: 224 },
  { id: "banner-right", section: "Banner", x: 268, y: 480, w: 200, h: 200 },

  // Collections mosaic
  { id: "cat-ao-thun", section: "Collections", x: 18, y: 795, w: 233, h: 266 },
  { id: "cat-quan", section: "Collections", x: 258, y: 795, w: 235, h: 126 },
  { id: "cat-phu-kien", section: "Collections", x: 257, y: 929, w: 236, h: 132 },

  // Đa dạng — model + 6 pants (approximate grid on right)
  { id: "diverse-model", section: "Đa dạng", x: 30, y: 1120, w: 202, h: 250 },
  { id: "diverse-pants-1", section: "Đa dạng", x: 258, y: 1088, w: 74, h: 98 },
  { id: "diverse-pants-2", section: "Đa dạng", x: 342, y: 1088, w: 74, h: 98 },
  { id: "diverse-pants-3", section: "Đa dạng", x: 426, y: 1088, w: 74, h: 98 },
  { id: "diverse-pants-4", section: "Đa dạng", x: 258, y: 1196, w: 74, h: 98 },
  { id: "diverse-pants-5", section: "Đa dạng", x: 342, y: 1196, w: 74, h: 98 },
  { id: "diverse-pants-6", section: "Đa dạng", x: 426, y: 1196, w: 74, h: 98 },

  // Nổi bật — 2 large + 4 small
  { id: "featured-large-1", section: "Nổi bật", x: 16, y: 1401, w: 232, h: 217 },
  { id: "featured-large-2", section: "Nổi bật", x: 259, y: 1401, w: 231, h: 217 },
  { id: "featured-small-1", section: "Nổi bật", x: 16, y: 1664, w: 112, h: 113 },
  { id: "featured-small-2", section: "Nổi bật", x: 138, y: 1664, w: 110, h: 113 },
  { id: "featured-small-3", section: "Nổi bật", x: 259, y: 1664, w: 111, h: 113 },
  { id: "featured-small-4", section: "Nổi bật", x: 380, y: 1664, w: 111, h: 113 },

  // Phối màu — large + 2×3 grid
  { id: "phoi-main", section: "Phối màu", x: 118, y: 1888, w: 148, h: 198 },
  { id: "phoi-grid-1", section: "Phối màu", x: 280, y: 1920, w: 68, h: 64 },
  { id: "phoi-grid-2", section: "Phối màu", x: 356, y: 1920, w: 68, h: 64 },
  { id: "phoi-grid-3", section: "Phối màu", x: 432, y: 1920, w: 68, h: 64 },
  { id: "phoi-grid-4", section: "Phối màu", x: 280, y: 1992, w: 68, h: 64 },
  { id: "phoi-grid-5", section: "Phối màu", x: 356, y: 1992, w: 68, h: 64 },
  { id: "phoi-grid-6", section: "Phối màu", x: 432, y: 1992, w: 68, h: 64 },
];

function gapBetween(a, b) {
  if (a.y === b.y) return Math.max(0, b.x - (a.x + a.w));
  if (a.x === b.x || Math.abs(a.x - b.x) < 4)
    return Math.max(0, b.y - (a.y + a.h));
  return null;
}

const frames = ROIS.map((r) => {
  const aspect = +(r.w / r.h).toFixed(3);
  return {
    id: r.id,
    section: r.section,
    mock: { x: r.x, y: r.y, w: r.w, h: r.h },
    desktop: {
      w: Math.round(r.w * SCALE),
      h: Math.round(r.h * SCALE),
    },
    aspect,
    cssAspect: `${r.w} / ${r.h}`,
  };
});

const gaps = {
  heroCollage: gapBetween(
    ROIS.find((r) => r.id === "hero-cell-1"),
    ROIS.find((r) => r.id === "hero-cell-2"),
  ),
  collections: gapBetween(
    ROIS.find((r) => r.id === "cat-ao-thun"),
    ROIS.find((r) => r.id === "cat-quan"),
  ),
  featuredLarge: gapBetween(
    ROIS.find((r) => r.id === "featured-large-1"),
    ROIS.find((r) => r.id === "featured-large-2"),
  ),
  featuredSmall: gapBetween(
    ROIS.find((r) => r.id === "featured-small-1"),
    ROIS.find((r) => r.id === "featured-small-2"),
  ),
  diversePants: gapBetween(
    ROIS.find((r) => r.id === "diverse-pants-1"),
    ROIS.find((r) => r.id === "diverse-pants-2"),
  ),
  phoiGrid: gapBetween(
    ROIS.find((r) => r.id === "phoi-grid-1"),
    ROIS.find((r) => r.id === "phoi-grid-2"),
  ),
};

const result = {
  mock: { W, H },
  scale: SCALE,
  desktopRef: 1280,
  gaps: Object.fromEntries(
    Object.entries(gaps).map(([k, mockGap]) => [
      k,
      {
        mock: mockGap,
        desktop: mockGap == null ? null : Math.round(mockGap * SCALE),
      },
    ]),
  ),
  frames,
};

fs.writeFileSync(
  path.join(outDir, "measurements.json"),
  JSON.stringify(result, null, 2),
);

// Export each ROI crop for visual QA
await Promise.all(
  ROIS.map(async (r, i) => {
    const name = `labeled-${String(i + 1).padStart(2, "0")}-${r.id}.png`;
    await sharp(src)
      .extract({
        left: Math.max(0, r.x),
        top: Math.max(0, r.y),
        width: Math.min(r.w, W - r.x),
        height: Math.min(r.h, H - r.y),
      })
      .png()
      .toFile(path.join(outDir, name));
  }),
);

console.log(JSON.stringify(result, null, 2));
