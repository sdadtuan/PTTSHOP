import { z } from "zod";
import { DEFAULT_LOGO_LAYOUT, logoLayoutSchema } from "@/lib/cms/logo-layout";
import { isLocalShopMediaUrl, isVietqrMediaUrl } from "@/lib/product-media-url";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Allow relative app paths or http(s) URLs; block javascript: and data: for links. */
export function isSafeHref(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith("/")) {
    if (v.startsWith("//")) return false;
    if (v.includes("\\") || v.includes("<") || v.includes(">")) return false;
    return true;
  }
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:" || u.protocol === "tel:";
  } catch {
    return false;
  }
}

/** Host ảnh ngoài còn được CMS nhận. Unsplash không còn trong danh sách này. */
export const ALLOWED_IMAGE_HOSTS = new Set(["cdn.vietqr.io"]);

export function isSafeMediaUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  // Used in src attributes and CSS url(); forbid characters that could break out of either.
  if (/["'()\s<>\\`]/.test(v)) return false;
  if (v.startsWith("/")) return isLocalShopMediaUrl(v);
  return isVietqrMediaUrl(v);
}

/**
 * Plain-text CMS fields are rendered by React (always escaped), so this is defense in depth:
 * removes HTML tags and control characters but keeps normal characters like "Free ship > 500k".
 */
export function sanitizePlainText(input: string, max = 2000): string {
  return input
    .replace(/<\/?[a-zA-Z!][^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, max);
}

const safeHref = z.string().refine(isSafeHref, { message: "URL không hợp lệ" });
const safeMedia = z.string().refine(isSafeMediaUrl, { message: "Đường dẫn ảnh không hợp lệ" });
const plain = z.string().transform((s) => sanitizePlainText(s));

export const siteSettingsSchema = z.object({
  brandName: plain.pipe(z.string().min(1).max(80)),
  brandColor: z.string().regex(HEX_COLOR, "Màu phải là hex #RGB hoặc #RRGGBB"),
  logoUrl: z
    .union([safeMedia, z.literal(""), z.null()])
    .optional()
    .transform((v): string | null => (v ? v : null)),
  logoLayout: logoLayoutSchema.optional().default(DEFAULT_LOGO_LAYOUT),
  footerTagline: plain.pipe(z.string().max(500)),
  contactAddress: plain.pipe(z.string().max(300)),
  contactEmail: plain.pipe(
    z.string().max(200).refine((v) => !v || /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v), {
      message: "Email không hợp lệ",
    }),
  ),
  contactPhone: plain.pipe(
    z.string().max(50).refine((v) => !v || /^[0-9+().\s-]{6,20}$/.test(v), {
      message: "Số điện thoại không hợp lệ",
    }),
  ),
  hotline: plain.pipe(
    z.string().max(50).refine((v) => !v || /^[0-9+().\s-]{6,20}$/.test(v), {
      message: "Hotline không hợp lệ",
    }),
  ).optional().default(""),
  messengerUrl: z
    .string()
    .refine((v) => !v || isSafeHref(v), { message: "URL Messenger không hợp lệ" })
    .optional()
    .default(""),
  contactHours: plain.pipe(z.string().max(120)),
  socialInstagram: z.string().refine((v) => !v || isSafeHref(v), { message: "URL MXH không hợp lệ" }),
  socialFacebook: z.string().refine((v) => !v || isSafeHref(v), { message: "URL MXH không hợp lệ" }),
  socialTiktok: z.string().refine((v) => !v || isSafeHref(v), { message: "URL MXH không hợp lệ" }),
  socialYoutube: z.string().refine((v) => !v || isSafeHref(v), { message: "URL MXH không hợp lệ" }),
  seoTitle: plain.pipe(z.string().max(160)),
  seoDescription: plain.pipe(z.string().max(400)),
});

const navLinkSchema = z.object({
  href: safeHref,
  label: plain.pipe(z.string().min(1).max(80)),
  match: plain.pipe(z.string().max(120)).optional(),
  hash: plain.pipe(z.string().max(40)).optional(),
});

const footerLinkSchema = z.object({
  href: safeHref,
  label: plain.pipe(z.string().min(1).max(120)),
});

export const sectionKeySchema = z.enum([
  "header",
  "navigation",
  "footer_links",
  "floating_contact",
  "reviews",
  "hero",
  "dual_banner",
  "collections",
  "diverse",
  "featured",
  "color_play",
  "promo_banner",
  "footer",
]);

const headerContentSchema = z.object({
  brandName: plain.pipe(z.string().min(1).max(80)),
  logoUrl: z.union([safeMedia, z.literal(""), z.null()]).nullable().optional(),
});

const trustPairSchema = z.object({
  title: plain.pipe(z.string().max(80)),
  subtitle: plain.pipe(z.string().max(120)),
});

const demoHeroSlideSchema = z.object({
  eyebrow: plain.pipe(z.string().max(80)),
  title: plain.pipe(z.string().max(80)),
  subtitle: plain.pipe(z.string().max(240)),
  ctaHref: safeHref,
  ctaLabel: plain.pipe(z.string().max(80)),
  mainImage: safeMedia,
  sideAImage: safeMedia,
  sideBImage: safeMedia,
});

const heroContentSchema = z.object({
  badgeLine1: plain.pipe(z.string().max(80)),
  badgeLine2: plain.pipe(z.string().max(80)),
  title: plain.pipe(z.string().min(1).max(120)),
  subtitle: plain.pipe(z.string().max(120)),
  description: plain.pipe(z.string().max(500)),
  ctaLabel: plain.pipe(z.string().max(80)),
  ctaHref: safeHref,
  imageUrl: safeMedia,
  trustItems: z.array(plain.pipe(z.string().max(80))).max(8),
  trustPairs: z.array(trustPairSchema).max(8),
  demoExtraSlides: z.array(demoHeroSlideSchema).max(6),
  useHeroBanner: z.boolean(),
});

const navigationContentSchema = z.object({
  searchPlaceholder: plain.pipe(z.string().max(80)),
  primaryNav: z.array(navLinkSchema).max(16),
  mobileExtra: z.array(navLinkSchema).max(16),
  demoPrimaryNav: z.array(navLinkSchema).max(16),
  demoMobileExtra: z.array(navLinkSchema).max(16),
});

const footerLinksContentSchema = z.object({
  columns: z
    .array(
      z.object({
        title: plain.pipe(z.string().max(80)),
        links: z.array(footerLinkSchema).max(16),
      }),
    )
    .max(6),
  legalLinks: z.array(footerLinkSchema).max(10),
  contactColumnTitle: plain.pipe(z.string().max(80)),
  copyrightNote: plain.pipe(z.string().max(200)),
  showHomepageSwitcher: z.boolean(),
});

const floatingContactContentSchema = z.object({
  items: z
    .array(
      z.object({
        href: z.string().refine((v) => isSafeHref(v), { message: "URL không hợp lệ" }),
        label: plain.pipe(z.string().max(40)),
        preset: z.enum(["facebook", "messenger", "zalo", "phone", "instagram", "custom"]),
      }),
    )
    .max(8),
});

const reviewsSectionContentSchema = z.object({
  title: plain.pipe(z.string().max(160)),
  emptyLine1: plain.pipe(z.string().max(200)),
  emptyLine2: plain.pipe(z.string().max(200)),
});

const dualBannerContentSchema = z.object({
  titleLine1: plain.pipe(z.string().max(120)),
  titleLine2: plain.pipe(z.string().max(120)),
  titleLine3: plain.pipe(z.string().max(120)),
  description: plain.pipe(z.string().max(500)),
  leftImage: safeMedia,
  rightImage: safeMedia,
});

const collectionsContentSchema = z.object({
  eyebrow: plain.pipe(z.string().max(80)),
  titleLine1: plain.pipe(z.string().max(120)),
  titleLine2: plain.pipe(z.string().max(120)),
  ctaLabel: plain.pipe(z.string().max(80)),
  ctaHref: safeHref,
  tiles: z
    .array(
      z.object({
        categorySlug: plain.pipe(z.string().max(80)),
        title: plain.pipe(z.string().max(80)),
        description: plain.pipe(z.string().max(200)),
        imageUrl: safeMedia,
      }),
    )
    .max(6),
});

const diverseContentSchema = z.object({
  eyebrow: plain.pipe(z.string().max(80)),
  titleLine1: plain.pipe(z.string().max(80)),
  titleLine2: plain.pipe(z.string().max(80)),
  titleLine3: plain.pipe(z.string().max(80)),
  description: plain.pipe(z.string().max(500)),
  ctaLabel: plain.pipe(z.string().max(80)),
  ctaHref: safeHref,
  modelImage: safeMedia,
  watermark: plain.pipe(z.string().max(40)),
});

const featuredContentSchema = z.object({
  titlePrefix: plain.pipe(z.string().max(80)),
  titleAccent: plain.pipe(z.string().max(80)),
  ctaLabel: plain.pipe(z.string().max(80)),
  ctaHref: safeHref,
  productIds: z.array(z.string().max(64)).max(24),
  largeImages: z.array(safeMedia).max(4),
  smallImages: z.array(safeMedia).max(8),
});

const colorPlayContentSchema = z.object({
  mainImage: safeMedia,
  typeFillImage: safeMedia,
  gridImages: z.array(safeMedia).max(9),
  headline: plain.pipe(z.string().max(200)),
  paragraph1: plain.pipe(z.string().max(600)),
  paragraph2: plain.pipe(z.string().max(600)),
  introImage1: safeMedia,
  introImage2: safeMedia,
  introImage1Alt: plain.pipe(z.string().max(160)),
  introImage2Alt: plain.pipe(z.string().max(160)),
  verticalLabel: plain.pipe(z.string().max(80)),
  brandLine1: plain.pipe(z.string().max(40)),
  brandEmphasis: plain.pipe(z.string().max(40)),
  ctaLabel: plain.pipe(z.string().max(80)),
  ctaHref: safeHref,
});

const promoBannerContentSchema = z.object({
  enabledNote: plain.pipe(z.string().max(200)),
  imageUrl: safeMedia,
  title: plain.pipe(z.string().max(120)),
  subtitle: plain.pipe(z.string().max(200)),
  ctaLabel: plain.pipe(z.string().max(80)),
  ctaHref: safeHref,
});

const footerContentSchema = z.object({
  tagline: plain.pipe(z.string().max(500)),
  address: plain.pipe(z.string().max(300)),
  email: plain.pipe(z.string().max(200)),
  phone: plain.pipe(z.string().max(50)),
  hours: plain.pipe(z.string().max(120)),
  socialInstagram: z.string().refine((v) => !v || isSafeHref(v)),
  socialFacebook: z.string().refine((v) => !v || isSafeHref(v)),
  socialTiktok: z.string().refine((v) => !v || isSafeHref(v)),
  socialYoutube: z.string().refine((v) => !v || isSafeHref(v)),
});

export const sectionContentSchemas = {
  header: headerContentSchema,
  navigation: navigationContentSchema,
  footer_links: footerLinksContentSchema,
  floating_contact: floatingContactContentSchema,
  reviews: reviewsSectionContentSchema,
  hero: heroContentSchema,
  dual_banner: dualBannerContentSchema,
  collections: collectionsContentSchema,
  diverse: diverseContentSchema,
  featured: featuredContentSchema,
  color_play: colorPlayContentSchema,
  promo_banner: promoBannerContentSchema,
  footer: footerContentSchema,
} as const;

export function parseSectionContent(key: z.infer<typeof sectionKeySchema>, raw: unknown) {
  return sectionContentSchemas[key].parse(raw);
}
