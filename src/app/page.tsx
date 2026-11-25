import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { Metadata } from "next";
import { preload } from "react-dom";
import { StorefrontImage } from "@/components/product/storefront-image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Gem,
  Leaf,
  Shirt,
  Truck,
} from "lucide-react";
import { HeroShatterCollage } from "@/components/home/hero-shatter-collage";
import { HomeStyleTabs } from "@/components/home/home-style-tabs";
import { PhoiMauType } from "@/components/home/phoi-mau-type";
import { ProductCard } from "@/components/product/product-card";
import { FRAME_ASPECT, GAPS, OBJECT_POSITION } from "@/config/home-frame-specs";
import { homeImages } from "@/config/home-images";
import { TYPE_SCALE } from "@/config/home-type-scale";
import { optimizedPublicImageUrl } from "@/lib/catalog-image";
import { getHomeSectionsForRequest } from "@/lib/cms/published";
import { displayBrandName } from "@/lib/public-brand";
import type {
  ColorPlayContent,
  CollectionsContent,
  DiverseContent,
  DualBannerContent,
  FeaturedContent,
  HeroContent,
  HomepageSectionKey,
  PromoBannerContent,
} from "@/lib/cms/types";
import { HOMEPAGE_BODY_SECTION_KEYS } from "@/lib/cms/types";
import { publicCatalogWhere, publicVariants } from "@/lib/catalog-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TRUST_ICONS = [Leaf, Shirt, Gem, Truck] as const;

type CardProduct = {
  id: string;
  name: string;
  slug: string;
  images: { url: string; alt: string | null }[];
  variants: {
    price: number;
    compareAt: number | null;
    colorHex: string | null;
  }[];
};

function padProducts(list: CardProduct[], need: number, pool: CardProduct[]) {
  const out = [...list];
  for (const p of pool) {
    if (out.length >= need) break;
    if (!out.some((x) => x.id === p.id)) out.push(p);
  }
  while (out.length < need && out.length > 0) {
    out.push({ ...out[out.length % list.length || 0], id: `${out[0].id}-pad-${out.length}` });
  }
  return out.slice(0, need);
}

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ sections }, categories, featured, catalog] = await Promise.all([
    getHomeSectionsForRequest(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.product.findMany({
      where: { isFeatured: true, ...publicCatalogWhere },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: publicVariants() },
      take: 12,
    }),
    prisma.product.findMany({
      where: publicCatalogWhere,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: publicVariants(),
        category: { select: { slug: true } },
      },
      take: 24,
      orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const heroSec = sections.hero;
  const hero = heroSec.content as HeroContent;
  const dualSec = sections.dual_banner;
  const dual = dualSec.content as DualBannerContent;
  const colSec = sections.collections;
  const col = colSec.content as CollectionsContent;
  const divSec = sections.diverse;
  const diverse = divSec.content as DiverseContent;
  const featSec = sections.featured;
  const featuredCms = featSec.content as FeaturedContent;
  const colorSec = sections.color_play;
  const colorPlay = colorSec.content as ColorPlayContent;
  const promoSec = sections.promo_banner;
  const promo = promoSec.content as PromoBannerContent;

  const heroSrc = hero.imageUrl || homeImages.hero.main;
  preload(optimizedPublicImageUrl(heroSrc), { as: "image", fetchPriority: "high" });
  const heroTitle = hero.title || "Mặc Đơn Giản";
  const heroSubtitle = hero.subtitle || "Vẫn Nổi Bật";
  const heroCtaHref = hero.ctaHref || "/san-pham";

  const mosaicCats = {
    ao:
      categories.find((c) => c.slug === (col.tiles[0]?.categorySlug || "ao-thun")) ??
      categories[0],
    quan:
      categories.find((c) => c.slug === (col.tiles[1]?.categorySlug || "quan")) ??
      categories[1],
    pk:
      categories.find((c) => c.slug === (col.tiles[2]?.categorySlug || "phu-kien")) ??
      categories[2],
  };

  let selectedFeatured: CardProduct[] = featured;
  if (featuredCms.productIds.length > 0) {
    const picked = await prisma.product.findMany({
      where: { id: { in: featuredCms.productIds }, ...publicCatalogWhere },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: publicVariants() },
    });
    const order = new Map(featuredCms.productIds.map((id, i) => [id, i]));
    selectedFeatured = [...picked].sort(
      (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
    );
  }

  const pool = padProducts(selectedFeatured, 6, catalog);
  const featuredLarge = pool.slice(0, 2);
  const featuredSmall = pool.slice(2, 6);
  const largeImages = featuredCms.largeImages.length
    ? featuredCms.largeImages
    : [...homeImages.featured.large];
  const smallImages = featuredCms.smallImages.length
    ? featuredCms.smallImages
    : [...homeImages.featured.small];

  const blocks: Partial<Record<HomepageSectionKey, ReactNode>> = {};

  /** Chỉ mobile: subtitle đọc được trên ảnh, không scrim. */
  const collectionTileSubtitle =
    "mt-1 text-sm font-medium text-neutral-800 max-md:text-[15px] max-md:font-semibold max-md:leading-[1.35] max-md:text-neutral-900 max-md:[text-shadow:0_0_1px_rgb(255_255_255_/_0.9),0_1px_2px_rgb(255_255_255_/_0.5)]";

  // Hero — text ~45% / collage ~50%; title vertically mid-collage
  blocks["hero"] = heroSec.isEnabled ? (
      <section className="relative bg-[#f0f0f0]">
        <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-4 py-8 md:grid-cols-[0.45fr_0.5fr] md:gap-[5%] md:px-6 md:py-16 lg:py-20">
          <div className="absolute top-8 left-4 z-0 h-12 w-12 rotate-[14deg] rounded-xl bg-[var(--accent)] md:left-2 md:h-14 md:w-14" />
          <div className="absolute top-24 left-[38%] z-0 hidden h-10 w-10 rounded-full bg-neutral-300/90 md:block" />

          <div className="animate-fade-up relative z-10 w-full min-w-0 md:max-w-[45vw]">
            <div
              className="mb-6 inline-flex items-center gap-3"
              data-testid="hero-badge"
              style={{ fontSize: TYPE_SCALE.heroBadge.css }}
            >
              <span className="inline-block h-[2.4em] w-[2.4em] shrink-0 rotate-12 rounded-lg bg-[var(--accent)]" />
              <p className="text-[1em] leading-[1.2] font-bold tracking-[0.06em] text-neutral-800 uppercase">
                <span className="block">{hero.badgeLine1}</span>
                <span className="block">{hero.badgeLine2}</span>
              </p>
            </div>
            <h1
              className="type-display w-full text-neutral-900"
              style={{ fontSize: TYPE_SCALE.heroH1.css }}
              data-testid="hero-h1"
            >
              <span className="block md:whitespace-nowrap">{heroTitle}</span>
              <span className="mt-1 block text-[var(--accent)] md:whitespace-nowrap">
                {heroSubtitle}
                <span
                  className="mt-2 block h-2 w-[70%] rounded-full bg-[var(--accent)]"
                  aria-hidden
                />
              </span>
            </h1>
            <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-neutral-600 md:mt-6 md:text-lg">
              {hero.description}
            </p>
            <Link
              href={heroCtaHref}
              className="mt-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition hover:bg-[var(--accent)] md:mt-10"
              aria-label={hero.ctaLabel || "Xem sản phẩm"}
            >
              <ArrowRight className="h-6 w-6" />
            </Link>

            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3 md:mt-12 md:gap-4">
              {(hero.trustItems.length ? hero.trustItems : [
                "Chất liệu thoáng mát",
                "Form dáng hiện đại",
                "Bền màu",
                "Free ship > 500k",
              ]).map((title, i) => {
                const Icon = TRUST_ICONS[i % TRUST_ICONS.length]!;
                return (
                  <li key={title} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800" />
                    <span
                      className="leading-snug font-bold tracking-wide text-neutral-800"
                      style={{ fontSize: TYPE_SCALE.heroFeature.css }}
                    >
                      {title}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative min-w-0 self-center">
            <div className="absolute -top-6 -left-3 z-20 h-12 w-12 -rotate-6 rounded-xl bg-neutral-300 md:h-14 md:w-14" />
            <div className="absolute -top-4 -right-1 z-20 h-14 w-14 rotate-[18deg] rounded-2xl bg-[var(--accent)] md:-right-3 md:h-16 md:w-16" />
            <div className="absolute -bottom-3 left-8 z-10 h-10 w-10 rotate-12 rounded-xl bg-neutral-300" />
            <HeroShatterCollage src={heroSrc} />
            <Link
              href={heroCtaHref}
              className="absolute -right-2 bottom-8 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition hover:bg-[var(--accent)] md:-right-4 md:bottom-12 md:h-16 md:w-16"
              aria-label="Khám phá bộ sưu tập"
            >
              <ArrowUpRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>
  ) : null;

  // Banner Phong Cách — desktop layered; mobile stacked (no overflow)
  blocks["dual_banner"] = dualSec.isEnabled ? (
      <section className="relative overflow-hidden bg-[#f3f3f3]" data-testid="banner-phong-cach">
        {/* —— Desktop —— */}
        <div className="relative mx-auto hidden min-h-[min(42vw,480px)] max-w-7xl px-6 py-12 md:block">
          <div className="pointer-events-none absolute top-2 right-[10%] z-0 h-24 w-24 rotate-[20deg] rounded-2xl bg-[var(--accent)]" />
          <div className="pointer-events-none absolute bottom-5 left-[2%] z-0 h-20 w-20 -rotate-[16deg] rounded-2xl bg-[var(--accent)]" />

          {/* Left photo — only touches title edge */}
          <div className="absolute top-6 left-[1%] z-10 w-[20%] max-w-[260px] -rotate-[8deg] overflow-hidden rounded-xl bg-neutral-200 shadow-md">
            <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerLeft }}>
              <StorefrontImage
                src={dual.leftImage || homeImages.dualBanner.left}
                alt="Look đơn giản — banner trái"
                fill
                sizes="20vw"
                className="object-cover"
                style={{ objectPosition: OBJECT_POSITION.bannerLeft }}
              />
            </div>
          </div>

          {/* Title above images; starts clear of left photo */}
          <div className="relative z-40 ml-[22%] w-[58%] max-w-[760px] pt-[10%]">
            <h2
              className="type-display text-neutral-900"
              style={{ fontSize: TYPE_SCALE.bannerH2.css }}
              data-testid="banner-title"
            >
              <span className="block whitespace-nowrap">{dual.titleLine1}</span>
              <span className="mt-1 block whitespace-nowrap text-[var(--accent)]">
                {dual.titleLine2}
              </span>
              <span className="mt-1 flex items-center gap-4 whitespace-nowrap text-[var(--accent)]">
                {dual.titleLine3}
                <span
                  className="h-2 w-[28%] min-w-[6rem] max-w-[12rem] rounded-full bg-[var(--accent)]"
                  aria-hidden
                />
              </span>
            </h2>
            <p
              className="mt-4 w-[77%] min-w-[22rem] max-w-[36rem] leading-relaxed text-neutral-600"
              style={{ fontSize: TYPE_SCALE.bannerDesc.css }}
            >
              {dual.description}
            </p>
          </div>

          {/* Right photo — top ngang Cá Nhân (thấp hơn dòng 1), dưới chữ */}
          <div className="absolute top-[54%] right-[2%] z-10 w-[20%] max-w-[260px] rotate-[5deg]">
            <div
              className="absolute -right-3 -bottom-3 h-[82%] w-[88%] rotate-2 rounded-2xl bg-[var(--accent)]"
              aria-hidden
            />
            <div className="relative z-10 overflow-hidden rounded-xl bg-neutral-200 shadow-lg">
              <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerRight }}>
                <StorefrontImage
                  src={dual.rightImage || homeImages.dualBanner.right}
                  alt="Look đơn giản — banner phải"
                  fill
                  sizes="20vw"
                  className="object-cover"
                  style={{ objectPosition: OBJECT_POSITION.bannerRight }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* —— Mobile: ảnh tách riêng, chữ wrap —— */}
        <div className="mx-auto max-w-7xl px-4 py-8 md:hidden">
          <div className="mb-5 flex items-end justify-center gap-4">
            <div className="w-[38%] -rotate-[6deg] overflow-hidden rounded-xl bg-neutral-200 shadow-md">
              <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerLeft }}>
                <StorefrontImage
                  src={dual.leftImage || homeImages.dualBanner.left}
                  alt="Look đơn giản — banner trái"
                  fill
                  sizes="38vw"
                  className="object-cover"
                  style={{ objectPosition: OBJECT_POSITION.bannerLeft }}
                />
              </div>
            </div>
            <div className="relative w-[42%] rotate-[4deg]">
              <div
                className="absolute -right-2 -bottom-2 h-[80%] w-[84%] rounded-2xl bg-[var(--accent)]"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-xl bg-neutral-200 shadow-md">
                <div className="relative" style={{ aspectRatio: FRAME_ASPECT.bannerRight }}>
                  <StorefrontImage
                    src={dual.rightImage || homeImages.dualBanner.right}
                    alt="Look đơn giản — banner phải"
                    fill
                    sizes="42vw"
                    className="object-cover"
                    style={{ objectPosition: OBJECT_POSITION.bannerRight }}
                  />
                </div>
              </div>
            </div>
          </div>
          <h2
            className="type-display text-[clamp(1.75rem,8vw,2.5rem)] break-words text-neutral-900"
            data-testid="banner-title-mobile"
          >
            <span className="block">{dual.titleLine1}</span>
            <span className="mt-1 block text-[var(--accent)]">{dual.titleLine2}</span>
            <span className="mt-1 block text-[var(--accent)]">{dual.titleLine3}</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed break-words text-neutral-600">
            {dual.description}
          </p>
        </div>
      </section>
  ) : null;

  // Collections mosaic
  blocks["collections"] = colSec.isEnabled ? (
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-16">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--accent)]">{col.eyebrow}</p>
            <h2
              className="type-display"
              style={{ fontSize: TYPE_SCALE.collectionsH2.css }}
            >
              <span className="block text-neutral-900">{col.titleLine1}</span>
              <span className="block text-[var(--accent)]">{col.titleLine2}</span>
            </h2>
          </div>
          <Link
            href={col.ctaHref || "/bo-suu-tap"}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-4"
          >
            {col.ctaLabel}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div
          className="grid md:grid-cols-2 md:grid-rows-2"
          style={{ gap: GAPS.collections.desktop }}
        >
          <Link
            href={
              mosaicCats.ao
                ? `/san-pham?category=${mosaicCats.ao.slug}`
                : "/san-pham"
            }
            className="group relative aspect-[5/4] max-h-[380px] overflow-hidden rounded-2xl bg-neutral-200 md:row-span-2 md:aspect-[233/266] md:max-h-none"
          >
            <StorefrontImage
              src={col.tiles[0]?.imageUrl || homeImages.collections.aoThun}
              alt={col.tiles[0]?.title || mosaicCats.ao?.name || "Áo thun"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              style={{ objectPosition: OBJECT_POSITION.catAoThun }}
            />
            <div className="absolute top-4 left-4 z-10 max-w-[48%] md:top-5 md:left-5 md:max-w-[70%]">
              <p
                className="type-display text-neutral-900 max-md:leading-tight"
                style={{ fontSize: TYPE_SCALE.tileLabel.css }}
              >
                {col.tiles[0]?.title || mosaicCats.ao?.name || "Áo Thun"}
              </p>
              <p className={collectionTileSubtitle}>
                {col.tiles[0]?.description || "BST mới với nhiều màu sắc"}
              </p>
            </div>
            <span className="absolute right-5 bottom-5 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition group-hover:bg-[var(--accent)]">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Link>

          <Link
            href={
              mosaicCats.quan
                ? `/san-pham?category=${mosaicCats.quan.slug}`
                : "/san-pham"
            }
            className="group relative overflow-hidden rounded-2xl bg-neutral-200"
            style={{ aspectRatio: FRAME_ASPECT.catQuan }}
          >
            <StorefrontImage
              src={col.tiles[1]?.imageUrl || homeImages.collections.quan}
              alt={col.tiles[1]?.title || mosaicCats.quan?.name || "Quần"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              style={{ objectPosition: OBJECT_POSITION.catQuan }}
            />
            <div className="absolute top-4 left-4 z-10 max-w-[45%] md:max-w-[65%]">
              <p
                className="type-display text-neutral-900 max-md:leading-tight"
                style={{ fontSize: TYPE_SCALE.tileLabel.css }}
              >
                {col.tiles[1]?.title || mosaicCats.quan?.name || "Quần"}
              </p>
              <p className={collectionTileSubtitle}>
                {col.tiles[1]?.description || "Đa dạng kiểu dáng, dễ phối đồ"}
              </p>
            </div>
            <span className="absolute right-4 bottom-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition group-hover:bg-[var(--accent)]">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href={
              mosaicCats.pk
                ? `/san-pham?category=${mosaicCats.pk.slug}`
                : "/san-pham"
            }
            className="group relative overflow-hidden rounded-2xl bg-neutral-200"
            style={{ aspectRatio: FRAME_ASPECT.catPhuKien }}
          >
            <StorefrontImage
              src={col.tiles[2]?.imageUrl || homeImages.collections.phuKien}
              alt={col.tiles[2]?.title || mosaicCats.pk?.name || "Phụ kiện"}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              style={{ objectPosition: OBJECT_POSITION.catPhuKien }}
            />
            <div className="absolute top-4 left-4 z-10 max-w-[45%] md:max-w-[65%]">
              <p
                className="type-display text-neutral-900 max-md:leading-tight"
                style={{ fontSize: TYPE_SCALE.tileLabel.css }}
              >
                {col.tiles[2]?.title || mosaicCats.pk?.name || "Phụ Kiện"}
              </p>
              <p className={collectionTileSubtitle}>
                {col.tiles[2]?.description || "Hoàn thiện phong cách của bạn"}
              </p>
            </div>
            <span className="absolute right-4 bottom-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition group-hover:bg-[var(--accent)]">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>
  ) : null;

  // Đa dạng — trái ~45% / phải ~52%; title đúng 3 dòng; model ~15–18% ngang
  blocks["diverse"] = divSec.isEnabled ? (
      <section className="relative mx-auto overflow-hidden px-4 py-10 md:px-6 md:py-20">
        <div className="mx-auto grid max-w-7xl items-start gap-6 md:grid-cols-[0.45fr_0.52fr] md:gap-[3%]">
          <div className="relative z-10 flex min-w-0 flex-col">
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-[var(--accent)] uppercase">
              {diverse.eyebrow}
            </p>
            <div className="relative flex min-h-0 items-start gap-3 md:min-h-[560px]">
              <div className="relative z-20 min-w-0 flex-1 pr-[36%] md:pr-[38%]">
                <h2
                  className="type-display text-neutral-900"
                  style={{ fontSize: TYPE_SCALE.diverseH2.css }}
                  data-testid="diverse-title"
                >
                  <span className="block md:whitespace-nowrap">{diverse.titleLine1}</span>
                  <span className="block md:whitespace-nowrap">{diverse.titleLine2}</span>
                  <span className="mt-0.5 block text-[var(--accent)] md:whitespace-nowrap">
                    {diverse.titleLine3}
                  </span>
                </h2>
                <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-neutral-600 md:text-[15px]">
                  {diverse.description}
                </p>
                <Link
                  href={diverse.ctaHref || "/san-pham"}
                  className="mt-6 inline-flex w-fit items-center gap-3 text-sm font-semibold text-neutral-900"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition hover:bg-[var(--accent)]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  {diverse.ctaLabel}
                </Link>
              </div>
              {/* Model ~15–18% page ≈ ~38% of left col; tall nearly full card */}
              <div className="pointer-events-none absolute top-0 right-0 z-10 h-[38vh] max-h-[300px] w-[36%] max-w-[220px] min-w-[130px] md:inset-y-0 md:h-auto md:max-h-none md:w-[38%]">
                <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-neutral-100/60 to-transparent">
                  <StorefrontImage
                    src={diverse.modelImage || homeImages.diverse.model}
                    alt="Đa dạng kiểu dáng"
                    fill
                    sizes="18vw"
                    className="object-cover max-md:[object-position:50%_10%] md:[object-position:50%_8%]"
                  />
                </div>
              </div>
            </div>
            <p className="pointer-events-none mt-auto pt-1 font-[family-name:var(--font-display)] text-[2.75rem] leading-none font-black tracking-[0.04em] text-neutral-200 select-none md:text-[5.5rem]">
              {diverse.watermark}
            </p>
          </div>

          <div className="relative z-10 min-w-0 overflow-hidden">
            <HomeStyleTabs products={catalog} />
          </div>
        </div>
      </section>
  ) : null;

  // Featured 2 + 4 — always 6 slots with home-v2 images
  blocks["featured"] = featSec.isEnabled ? (
      <section className="bg-white py-10 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2
              className="type-display"
              style={{ fontSize: TYPE_SCALE.featuredH2.css }}
            >
              {featuredCms.titlePrefix}{" "}
              <span className="text-[var(--accent)]">{featuredCms.titleAccent}</span>
            </h2>
            <Link
              href={featuredCms.ctaHref || "/san-pham"}
              className="text-sm font-bold tracking-[0.14em] text-neutral-800 uppercase"
            >
              {featuredCms.ctaLabel}
            </Link>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-2"
            style={{ gap: GAPS.featured.desktop }}
          >
            {featuredLarge.map((p, i) => (
              <ProductCard
                key={`feat-l-${p.id}-${i}`}
                product={p}
                large
                frame="featuredLarge"
                mobileFrame="featuredSmall"
                imageOverride={largeImages[i]}
              />
            ))}
          </div>
          <div
            className="mt-5 grid grid-cols-2 md:mt-6 md:grid-cols-4"
            style={{ gap: GAPS.featured.desktop }}
          >
            {smallImages.map((src, i) => {
              const p =
                featuredSmall[i] ||
                catalog[i] ||
                featuredLarge[0] ||
                ({
                  id: `feat-fallback-${i}`,
                  name: ["Áo Hoodie Basic", "Áo Khoác Dù", "Áo Polo", "Quần Cargo"][i],
                  slug: "ao-hoodie-essential",
                  images: [],
                  variants: [{ price: 549000, compareAt: 799000, colorHex: "#111" }],
                } as CardProduct);
              return (
                <ProductCard
                  key={`feat-s-${p.id}-${i}`}
                  product={p}
                  frame="featuredSmall"
                  imageOverride={src}
                />
              );
            })}
          </div>
        </div>
      </section>
  ) : null;

  // Optional promo banner (off by default to match 6003c40)
  blocks["promo_banner"] = promoSec.isEnabled ? (
        <section className="bg-neutral-900 py-12 text-white" data-testid="promo-banner">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="relative h-40 w-full overflow-hidden rounded-xl md:h-48 md:w-72">
              <StorefrontImage
                src={promo.imageUrl}
                alt={promo.title}
                fill
                sizes="(max-width:768px) 100vw, 288px"
                className="object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="type-display text-3xl">
                {promo.title}
              </h2>
              <p className="mt-2 text-neutral-300">{promo.subtitle}</p>
              <Link
                href={promo.ctaHref}
                className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white"
              >
                {promo.ctaLabel}
              </Link>
            </div>
          </div>
        </section>
  ) : null;

  // PHỐI MÀU — model full height; type clear; lưới spans under CHẤT (not over type)
  blocks["color_play"] = colorSec.isEnabled ? (
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-10 md:px-6 md:py-20">
        <div className="relative grid grid-cols-1 gap-x-3 gap-y-4 max-md:grid-cols-[minmax(0,47fr)_minmax(0,53fr)] max-md:items-start md:pr-11 lg:grid-cols-[minmax(200px,0.26fr)_minmax(220px,0.3fr)_minmax(0,0.44fr)] lg:[grid-template-areas:'model_type_copy'_'model_grid_grid'] lg:pr-14">
          <div className="relative z-10 aspect-[3/4] w-full max-md:col-start-2 max-md:row-span-2 max-md:row-start-1 max-md:max-h-none max-md:self-start md:aspect-auto md:h-[420px] md:max-h-none lg:h-auto lg:[grid-area:model]">
            <StorefrontImage
              src={colorPlay.mainImage || homeImages.colorPlay.main}
              alt="Phối màu tạo chất"
              fill
              sizes="(max-width:768px) 48vw, (max-width:1024px) 100vw, 26vw"
              className="object-cover object-top max-md:[object-position:50%_12%]"
              loading="lazy"
            />
          </div>

          <div className="relative z-30 max-md:col-start-1 max-md:row-start-1 max-md:pr-0.5 lg:[grid-area:type]">
            <PhoiMauType fillImage={colorPlay.typeFillImage} />
          </div>

          <div className="relative z-20 flex min-h-0 min-w-0 flex-col pt-1 max-md:contents lg:[grid-area:copy]">
            <div className="max-md:col-start-1 max-md:row-start-2 max-md:flex max-md:flex-col max-md:gap-2 max-md:pr-0.5 md:flex md:flex-col">
              <h2
                className="type-display phoi-xu-huong-headline text-neutral-900 max-md:leading-snug"
                style={
                  {
                    ["--phoi-xh-fs" as string]: TYPE_SCALE.phoiXuHuong.css,
                  } as CSSProperties
                }
              >
                {displayBrandName(colorPlay.headline)}
              </h2>
              <p className="text-xs leading-relaxed text-neutral-600 max-md:mt-0 md:mt-4 md:text-[15px] max-md:text-[11px] max-md:leading-[1.45]">
                {displayBrandName(colorPlay.paragraph1)}
              </p>
              <p className="text-xs leading-relaxed text-neutral-600 max-md:mt-0 md:mt-3 md:text-[15px] max-md:text-[11px] max-md:leading-[1.45]">
                {displayBrandName(colorPlay.paragraph2)}
              </p>
            </div>
            {/* Two CMS intro frames fill the empty copy column under the paragraphs */}
            <div
              className="mt-5 grid grid-cols-2 gap-2 max-md:col-span-2 max-md:row-start-3 md:mt-6 md:gap-3 lg:mt-auto lg:min-h-[11rem] lg:flex-1 lg:pt-5"
              data-testid="phoi-intro-images"
            >
              {(
                [
                  {
                    src: colorPlay.introImage1 || homeImages.colorPlay.intro[0],
                    alt: colorPlay.introImage1Alt || "Look phối màu — khung 1",
                  },
                  {
                    src: colorPlay.introImage2 || homeImages.colorPlay.intro[1],
                    alt: colorPlay.introImage2Alt || "Look phối màu — khung 2",
                  },
                ] as const
              ).map((img, i) => (
                <div
                  key={`phoi-intro-${i}-${img.src}`}
                  className="relative aspect-[3/4] overflow-hidden bg-neutral-100 lg:aspect-auto lg:h-full lg:min-h-[10rem]"
                  data-testid={`phoi-intro-cell-${i + 1}`}
                >
                  <StorefrontImage
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width:1024px) 45vw, 18vw"
                    className="object-cover"
                    style={{ objectPosition: OBJECT_POSITION.phoiGrid }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 w-full max-md:col-span-2 max-md:row-start-4 lg:[grid-area:grid]">
            <div className="grid grid-cols-3 gap-1 md:gap-1.5">
              {(colorPlay.gridImages.length
                ? colorPlay.gridImages
                : [...homeImages.colorPlay.grid]
              ).map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative aspect-[4/5] overflow-hidden bg-neutral-100 sm:aspect-[4/3]"
                  data-testid={`phoi-grid-cell-${i + 1}`}
                >
                  <StorefrontImage
                    src={src}
                    alt={`Look phối màu ${i + 1}`}
                    fill
                    sizes="(max-width:768px) 30vw, 18vw"
                    className="object-cover"
                    style={{ objectPosition: OBJECT_POSITION.phoiGrid }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Vertical label centered on the full block (intro + grid); hidden below md */}
          <div
            className="pointer-events-none absolute inset-y-2 right-0 z-20 hidden max-h-full w-10 flex-col items-center justify-center md:flex lg:inset-y-3 lg:w-11"
            data-testid="phoi-vertical-label"
          >
            <span className="w-1.5 min-h-3 flex-1 rounded-full bg-[var(--accent)]" aria-hidden />
            <p
              className="type-vertical my-1.5 shrink-0 rotate-180 whitespace-nowrap text-[var(--accent)] [writing-mode:vertical-rl]"
              style={{
                fontSize: TYPE_SCALE.verticalLabel.css,
                letterSpacing: TYPE_SCALE.verticalLabel.letterSpacing,
              }}
            >
              {colorPlay.verticalLabel}
            </p>
            <span className="w-1.5 min-h-3 flex-1 rounded-full bg-[var(--accent)]" aria-hidden />
          </div>
        </div>
      </section>
  ) : null;

  // Render body sections in CMS sortOrder (header/footer live in the layout).
  const orderedKeys = (Object.values(sections) as Array<{ key: HomepageSectionKey; sortOrder: number }>)
    .filter((s) =>
      (HOMEPAGE_BODY_SECTION_KEYS as readonly string[]).includes(s.key),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => s.key);

  const heroPreload = optimizedPublicImageUrl(heroSrc);
  return (
    <div className="overflow-x-hidden">
      <link rel="preload" as="image" href={heroPreload} fetchPriority="high" />
      {orderedKeys.map((k) => (
        <Fragment key={k}>{blocks[k] ?? null}</Fragment>
      ))}
    </div>
  );
}
