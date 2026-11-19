import { homeImages } from "@/config/home-images";

export const HOMEPAGE_SECTION_KEYS = [
  "header",
  "hero",
  "dual_banner",
  "collections",
  "diverse",
  "featured",
  "color_play",
  "promo_banner",
  "footer",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export type SiteSettingsData = {
  brandName: string;
  brandColor: string;
  logoUrl: string | null;
  footerTagline: string;
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
  contactHours: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  socialYoutube: string;
};

export type HeaderContent = {
  brandName: string;
  logoUrl: string | null;
};

export type HeroContent = {
  badgeLine1: string;
  badgeLine2: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  trustItems: string[];
  /** When true, merge active HeroBanner over image/title/subtitle/cta. */
  useHeroBanner: boolean;
};

export type DualBannerContent = {
  titleLine1: string;
  titleLine2: string;
  titleLine3: string;
  description: string;
  leftImage: string;
  rightImage: string;
};

export type CollectionTile = {
  categorySlug: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type CollectionsContent = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  ctaLabel: string;
  ctaHref: string;
  tiles: CollectionTile[];
};

export type DiverseContent = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  titleLine3: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  modelImage: string;
  watermark: string;
};

export type FeaturedContent = {
  titlePrefix: string;
  titleAccent: string;
  ctaLabel: string;
  ctaHref: string;
  productIds: string[];
  largeImages: string[];
  smallImages: string[];
};

export type ColorPlayContent = {
  mainImage: string;
  typeFillImage: string;
  gridImages: string[];
  headline: string;
  paragraph1: string;
  paragraph2: string;
  /** Two images under the intro paragraphs (fill empty copy column). */
  introImage1: string;
  introImage2: string;
  introImage1Alt: string;
  introImage2Alt: string;
  verticalLabel: string;
};

export type PromoBannerContent = {
  enabledNote: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export type FooterContent = {
  tagline: string;
  address: string;
  email: string;
  phone: string;
  hours: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  socialYoutube: string;
};

export type SectionContentMap = {
  header: HeaderContent;
  hero: HeroContent;
  dual_banner: DualBannerContent;
  collections: CollectionsContent;
  diverse: DiverseContent;
  featured: FeaturedContent;
  color_play: ColorPlayContent;
  promo_banner: PromoBannerContent;
  footer: FooterContent;
};

export type HomepageSectionRecord = {
  key: HomepageSectionKey;
  label: string;
  sortOrder: number;
  isEnabled: boolean;
  draftEnabled: boolean;
  content: SectionContentMap[HomepageSectionKey];
  draftContent: SectionContentMap[HomepageSectionKey];
};

export type HomepageSnapshot = {
  settings: SiteSettingsData;
  sections: Array<{
    key: HomepageSectionKey;
    label: string;
    sortOrder: number;
    isEnabled: boolean;
    content: SectionContentMap[HomepageSectionKey];
  }>;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  brandName: "VIZFAS",
  brandColor: "#f97316",
  logoUrl: null,
  footerTagline:
    "Thời trang hiện đại, tối giản và khác biệt cho thế hệ trẻ tự tin thể hiện phong cách mỗi ngày.",
  contactAddress: "TP. Hồ Chí Minh, Việt Nam",
  contactEmail: "hello@vizfas.vn",
  contactPhone: "0321 456 789",
  contactHours: "Thứ 2 – Chủ Nhật 8:00 – 22:00",
  socialInstagram: "https://instagram.com",
  socialFacebook: "https://facebook.com",
  socialTiktok: "https://tiktok.com",
  socialYoutube: "https://youtube.com",
};

export const SECTION_LABELS: Record<HomepageSectionKey, string> = {
  header: "Header / Logo",
  hero: "Hero shatter",
  dual_banner: "Banner Phong Cách",
  collections: "Bộ sưu tập",
  diverse: "Đa dạng kiểu dáng",
  featured: "Sản phẩm nổi bật",
  color_play: "Phối Màu",
  promo_banner: "Banner quảng cáo",
  footer: "Footer",
};

export function defaultSectionContent(
  key: HomepageSectionKey,
): SectionContentMap[HomepageSectionKey] {
  switch (key) {
    case "header":
      return {
        brandName: "VIZFAS",
        logoUrl: null,
      } satisfies HeaderContent;
    case "hero":
      return {
        badgeLine1: "Bộ sưu tập",
        badgeLine2: "mới 2026",
        title: "Mặc Đơn Giản",
        subtitle: "Vẫn Nổi Bật",
        description:
          "Những chiếc áo thun dành cho phong cách hiện đại, thoải mái và tự tin mỗi ngày.",
        ctaLabel: "Xem sản phẩm",
        ctaHref: "/san-pham",
        imageUrl: homeImages.hero.main,
        trustItems: [
          "Chất liệu thoáng mát",
          "Form dáng hiện đại",
          "Bền màu",
          "Free ship > 500k",
        ],
        useHeroBanner: true,
      } satisfies HeroContent;
    case "dual_banner":
      return {
        titleLine1: "Phong Cách Đơn Giản",
        titleLine2: "Mang Đậm Tính",
        titleLine3: "Cá Nhân",
        description:
          "Những bộ trang phục dành cho phong cách hiện đại, thoải mái và tự tin mỗi ngày.",
        leftImage: homeImages.dualBanner.left,
        rightImage: homeImages.dualBanner.right,
      } satisfies DualBannerContent;
    case "collections":
      return {
        eyebrow: "Bộ sưu tập",
        titleLine1: "Khám Phá Các",
        titleLine2: "Bộ Sưu Tập",
        ctaLabel: "Xem tất cả bộ sưu tập",
        ctaHref: "/bo-suu-tap",
        tiles: [
          {
            categorySlug: "ao-thun",
            // "" = use the live category name (exactly what 6003c40 rendered)
            title: "",
            description: "BST mới với nhiều màu sắc",
            imageUrl: homeImages.collections.aoThun,
          },
          {
            categorySlug: "quan",
            // "" = use the live category name (exactly what 6003c40 rendered)
            title: "",
            description: "Đa dạng kiểu dáng, dễ phối đồ",
            imageUrl: homeImages.collections.quan,
          },
          {
            categorySlug: "phu-kien",
            // "" = use the live category name (exactly what 6003c40 rendered)
            title: "",
            description: "Hoàn thiện phong cách của bạn",
            imageUrl: homeImages.collections.phuKien,
          },
        ],
      } satisfies CollectionsContent;
    case "diverse":
      return {
        eyebrow: "BST quần",
        titleLine1: "Đa Dạng",
        titleLine2: "Kiểu Dáng",
        titleLine3: "Dễ Phối Đồ",
        description:
          "Những mẫu quần dành cho phong cách hiện đại, thoải mái và phù hợp mỗi ngày.",
        ctaLabel: "Xem tất cả sản phẩm",
        ctaHref: "/san-pham",
        modelImage: homeImages.diverse.model,
        watermark: "WEARLY",
      } satisfies DiverseContent;
    case "featured":
      return {
        titlePrefix: "Sản phẩm",
        titleAccent: "Nổi Bật",
        ctaLabel: "XEM TẤT CẢ →",
        ctaHref: "/san-pham",
        productIds: [],
        largeImages: [...homeImages.featured.large],
        smallImages: [...homeImages.featured.small],
      } satisfies FeaturedContent;
    case "color_play":
      return {
        mainImage: homeImages.colorPlay.main,
        typeFillImage: homeImages.colorPlay.typeFill,
        gridImages: [...homeImages.colorPlay.grid],
        headline: "Xu Hướng Màu Sắc: Tự Do Thể Hiện Phong Cách Riêng",
        paragraph1:
          "Từ kem trung tính đến đen tối giản hay cam nổi bật — VIZFAS giúp bạn phối màu tạo chất mà vẫn mặc được mỗi ngày.",
        paragraph2:
          "Chọn một item Essential, thêm phụ kiện, và hoàn thiện look trong vài phút — giữ form sạch, điểm nhấn rõ.",
        introImage1: homeImages.colorPlay.intro[0],
        introImage2: homeImages.colorPlay.intro[1],
        introImage1Alt: "Look phối màu — khung 1",
        introImage2Alt: "Look phối màu — khung 2",
        verticalLabel: "BỘ SƯU TẬP MỚI",
      } satisfies ColorPlayContent;
    case "promo_banner":
      return {
        enabledNote: "Tắt mặc định — dùng Banner Phong Cách / HeroBanner.",
        imageUrl: homeImages.dualBanner.right,
        title: "Ưu đãi đặc biệt",
        subtitle: "Khám phá bộ sưu tập mới",
        ctaLabel: "Mua ngay",
        ctaHref: "/san-pham",
      } satisfies PromoBannerContent;
    case "footer":
      return {
        tagline: DEFAULT_SITE_SETTINGS.footerTagline,
        address: DEFAULT_SITE_SETTINGS.contactAddress,
        email: DEFAULT_SITE_SETTINGS.contactEmail,
        phone: DEFAULT_SITE_SETTINGS.contactPhone,
        hours: DEFAULT_SITE_SETTINGS.contactHours,
        socialInstagram: DEFAULT_SITE_SETTINGS.socialInstagram,
        socialFacebook: DEFAULT_SITE_SETTINGS.socialFacebook,
        socialTiktok: DEFAULT_SITE_SETTINGS.socialTiktok,
        socialYoutube: DEFAULT_SITE_SETTINGS.socialYoutube,
      } satisfies FooterContent;
  }
}

export function defaultSectionsSeed(): Array<{
  key: HomepageSectionKey;
  label: string;
  sortOrder: number;
  isEnabled: boolean;
  content: SectionContentMap[HomepageSectionKey];
}> {
  return HOMEPAGE_SECTION_KEYS.map((key, i) => ({
    key,
    label: SECTION_LABELS[key],
    sortOrder: i,
    // promo_banner off by default so homepage matches 6003c40 layout
    isEnabled: key !== "promo_banner",
    content: defaultSectionContent(key),
  }));
}
