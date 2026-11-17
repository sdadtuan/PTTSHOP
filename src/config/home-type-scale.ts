/**
 * Typography scale from homepage-mau-v2.png (510px) → desktop @1280 (×2.51).
 * Cap-height approx for display lines; CSS font-size targets ±5%.
 */
export const MOCK_SCALE = 1280 / 510;

export const TYPE_SCALE = {
  heroH1: {
    label: "Hero H1 (Mặc Đơn Giản / Vẫn Nổi Bật)",
    mockPx: 30, // cap height ~30 → 75 desktop
    desktopPx: 76,
    css: "clamp(2.75rem, 6vw, 4.75rem)", // ~44–76px @1280 ≈76.8
  },
  bannerH2: {
    label: "Banner Phong Cách H2",
    mockPx: 26,
    desktopPx: 64,
    css: "clamp(2.25rem, 4.8vw, 4rem)", // ~36–64px
  },
  collectionsH2: {
    label: "Bộ Sưu Tập H2",
    mockPx: 24,
    desktopPx: 60,
    css: "clamp(2.25rem, 4.5vw, 3.75rem)",
  },
  diverseH2: {
    label: "Đa Dạng H2",
    mockPx: 24,
    desktopPx: 56,
    css: "clamp(2.125rem, 4.2vw, 3.5rem)",
  },
  featuredH2: {
    label: "Nổi Bật H2",
    mockPx: 22,
    desktopPx: 52,
    css: "clamp(2rem, 4vw, 3.25rem)",
  },
  phoiType: {
    label: "PHỐI/MÀU/TẠO/CHẤT stacked",
    mockPx: 48,
    desktopPx: 120,
    css: "clamp(3.75rem, 10.5vw, 8.25rem)", // ~60–132px
  },
  phoiXuHuong: {
    label: "Xu Hướng Màu Sắc",
    mockPx: 14,
    desktopPx: 28,
    css: "clamp(1.25rem, 2.2vw, 1.75rem)",
  },
  footerLogo: {
    label: "Footer VIZFAS",
    mockPx: 28,
    desktopPx: 64,
    css: "clamp(2.5rem, 5vw, 4rem)",
  },
  verticalLabel: {
    label: "BỘ SƯU TẬP MỚI dọc",
    mockPx: 8,
    desktopPx: 16,
    css: "0.95rem",
  },
} as const;
