import { DemoCollections } from "@/components/demo-v2/demo-collections";
import { DemoDiverse } from "@/components/demo-v2/demo-diverse";
import { DemoFeatured } from "@/components/demo-v2/demo-featured";
import { DemoHero } from "@/components/demo-v2/demo-hero";
import { DemoPhoiMau } from "@/components/demo-v2/demo-phoi-mau";
import { DemoPhongCach } from "@/components/demo-v2/demo-phong-cach";
import { DemoPromo } from "@/components/demo-v2/demo-promo";
import { DemoReviews } from "@/components/demo-v2/demo-reviews";
import { DemoTrustBar } from "@/components/demo-v2/demo-trust-bar";
import { getHomeSectionsForRequest, getStorefrontLayoutForRequest } from "@/lib/cms/published";
import type {
  CollectionsContent,
  ColorPlayContent,
  DiverseContent,
  DualBannerContent,
  FeaturedContent,
  HeroContent,
  PromoBannerContent,
} from "@/lib/cms/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function padProducts<T extends { id: string }>(list: T[], need: number, pool: T[]) {
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

export default async function DemoV2HomePage() {
  const [{ sections, settings }, layoutCms, categories, featured, catalog, reviewRows] =
    await Promise.all([
      getHomeSectionsForRequest(),
      getStorefrontLayoutForRequest(),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 6 }),
      prisma.product.findMany({
        where: { isFeatured: true },
        include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
        take: 12,
      }),
      prisma.product.findMany({
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: { select: { slug: true } },
        },
        take: 24,
        orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
      }),
      prisma.review.findMany({
        include: {
          user: { select: { name: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

  void settings;

  const reviews = reviewRows
    .filter((r) => r.isPublished)
    .map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    userName: r.displayName?.trim() || r.user?.name || "Khách VIZFAS",
    productName: r.product.name,
    productSlug: r.product.slug,
  }));

  const hero = sections.hero.content as HeroContent;
  const dual = sections.dual_banner.content as DualBannerContent;
  const col = sections.collections.content as CollectionsContent;
  const diverse = sections.diverse.content as DiverseContent;
  const featuredCms = sections.featured.content as FeaturedContent;
  const colorPlay = sections.color_play.content as ColorPlayContent;
  const promo = sections.promo_banner.content as PromoBannerContent;

  let selectedFeatured = featured;
  if (featuredCms.productIds.length > 0) {
    const picked = await prisma.product.findMany({
      where: { id: { in: featuredCms.productIds } },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
    });
    const order = new Map(featuredCms.productIds.map((id, i) => [id, i]));
    selectedFeatured = [...picked].sort(
      (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
    );
  }

  const pool = padProducts(selectedFeatured, 5, catalog);

  return (
    <>
      {sections.hero.isEnabled ? (
        <DemoHero
          content={hero}
          eyebrow={
            [hero.badgeLine1, hero.badgeLine2].filter(Boolean).join(" ") ||
            "NEW COLLECTION"
          }
          title={hero.title || "VIZFAS"}
          subtitle={
            hero.description ||
            `${hero.subtitle || "Streetwear hiện đại"} / Cho phong cách của riêng bạn.`
          }
          ctaHref={hero.ctaHref || "/san-pham"}
          ctaLabel={hero.ctaLabel || "Khám Phá Ngay"}
          image={hero.imageUrl}
        />
      ) : null}

      <DemoTrustBar items={hero.trustItems} pairs={hero.trustPairs} />

      {sections.dual_banner.isEnabled ? <DemoPhongCach content={dual} /> : null}

      {sections.collections.isEnabled ? (
        <DemoCollections content={col} categories={categories} />
      ) : null}

      {sections.diverse.isEnabled ? (
        <DemoDiverse content={diverse} products={catalog} />
      ) : null}

      {sections.featured.isEnabled ? (
        <DemoFeatured content={featuredCms} products={pool} />
      ) : null}

      {sections.promo_banner.isEnabled ? <DemoPromo content={promo} /> : null}

      {sections.color_play.isEnabled ? <DemoPhoiMau content={colorPlay} /> : null}

      {sections.reviews?.isEnabled !== false ? (
        <DemoReviews
          reviews={reviews}
          title={layoutCms.reviews.title}
          emptyLine1={layoutCms.reviews.emptyLine1}
          emptyLine2={layoutCms.reviews.emptyLine2}
        />
      ) : null}
    </>
  );
}
