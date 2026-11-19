/**
 * Central homepage image map — `/images/home-v2/*` per MAPPING.md.
 * Swap paths here only.
 */

const HV2 = "/images/home-v2";

export const homeImages = {
  hero: {
    /** Complete portrait; CSS 2×3 shutter collage overlays white gutters. */
    main: `${HV2}/hero-main.jpg`,
  },
  dualBanner: {
    left: `${HV2}/banner-left.jpg`,
    right: `${HV2}/banner-right.jpg`,
  },
  collections: {
    aoThun: `${HV2}/cat-ao-thun.jpg`,
    quan: `${HV2}/cat-quan.jpg`,
    phuKien: `${HV2}/cat-phu-kien.jpg`,
  },
  diverse: {
    model: `${HV2}/mix-model.jpg`,
    /** Catalog flats for the 6-up grid (still link to real DB products). */
    pants: [
      `${HV2}/mix-pants-beige.jpg`,
      `${HV2}/mix-pants-black.jpg`,
      `${HV2}/mix-pants-olive.jpg`,
      `${HV2}/mix-pants-charcoal.jpg`,
      `${HV2}/mix-pants-cream.jpg`,
      `${HV2}/mix-pants-brown.jpg`,
    ] as const,
  },
  featured: {
    large: [`${HV2}/featured-1.jpg`, `${HV2}/featured-2.jpg`] as const,
    small: [
      `${HV2}/featured-hoodie.jpg`,
      `${HV2}/featured-jacket.jpg`,
      `${HV2}/featured-polo.jpg`,
      `${HV2}/featured-cargo.jpg`,
    ] as const,
  },
  colorPlay: {
    main: `${HV2}/phoi-mau-main.jpg`,
    /** Photo fill clipped inside large “PHỐI” letterforms — not a product tile. */
    typeFill: `${HV2}/phoi-mau-type.jpg`,
    /** Two lifestyle frames under “Xu Hướng Màu Sắc” intro copy (CMS-replaceable). */
    intro: [`${HV2}/phoi-mau-2.jpg`, `${HV2}/phoi-mau-5.jpg`] as const,
    grid: [
      `${HV2}/phoi-mau-1.jpg`,
      `${HV2}/phoi-mau-2.jpg`,
      `${HV2}/phoi-mau-3.jpg`,
      `${HV2}/phoi-mau-4.jpg`,
      `${HV2}/phoi-mau-5.jpg`,
      `${HV2}/phoi-mau-6.jpg`,
    ] as const,
  },
} as const;

export type HomeImages = typeof homeImages;
