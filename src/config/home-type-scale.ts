/**
 * Typography scale from homepage-mau-v2.png (510px) → desktop @1280 (×2.51).
 */
export const MOCK_SCALE = 1280 / 510;

export const TYPE_SCALE = {
  heroH1: {
    label: "Hero H1",
    desktopPx: 76,
    css: "clamp(2.75rem, 6vw, 4.75rem)",
  },
  heroBadge: {
    label: "Hero badge text",
    desktopPx: 20,
    css: "1.25rem", // 20px
  },
  heroFeature: {
    label: "Hero feature icons label",
    desktopPx: 16,
    css: "1rem", // 16px
  },
  bannerH2: {
    label: "Banner Phong Cách H2",
    desktopPx: 56,
    css: "clamp(2rem, 4.2vw, 3.5rem)",
  },
  collectionsH2: {
    label: "Bộ Sưu Tập H2",
    desktopPx: 68,
    css: "clamp(2.5rem, 5.2vw, 4.25rem)", // ~64–72
  },
  diverseH2: {
    label: "Đa Dạng H2",
    desktopPx: 68,
    css: "clamp(2.5rem, 5.2vw, 4.25rem)",
  },
  featuredH2: {
    label: "Nổi Bật H2",
    desktopPx: 68,
    css: "clamp(2.5rem, 5.2vw, 4.25rem)",
  },
  tileLabel: {
    label: "Collection tile title",
    desktopPx: 36,
    css: "2.25rem", // 36px @1280
  },
  productName: {
    label: "Product card name (×1.5)",
    desktopPx: 22.5,
    css: "clamp(1.125rem, 1.6vw, 1.4rem)", // ~18–22.5
  },
  productNameLarge: {
    label: "Product card name large (×1.5)",
    desktopPx: 27,
    css: "clamp(1.25rem, 1.9vw, 1.7rem)",
  },
  productPrice: {
    label: "Product price (×1.5)",
    desktopPx: 21,
    css: "clamp(1.05rem, 1.5vw, 1.3rem)",
  },
  phoiType: {
    label: "PHỐI/MÀU/TẠO/CHẤT",
    desktopPx: 120,
    css: "clamp(3.5rem, 9.5vw, 7.5rem)",
  },
  phoiXuHuong: {
    label: "Xu Hướng Màu Sắc",
    desktopPx: 28,
    css: "clamp(1.25rem, 2.2vw, 1.75rem)",
  },
  footerLogo: {
    label: "Footer VIZFAS",
    desktopPx: 48,
    css: "3rem", // 48px
  },
  footerTagline: {
    label: "Footer tagline / column title",
    desktopPx: 22,
    css: "1.375rem", // 22px
  },
  footerLink: {
    label: "Footer link",
    desktopPx: 18,
    css: "1.125rem", // 18px
  },
  verticalLabel: {
    label: "BỘ SƯU TẬP MỚI dọc",
    desktopPx: 16,
    css: "1rem",
  },
} as const;
