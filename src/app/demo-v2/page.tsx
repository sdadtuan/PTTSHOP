import { DemoCollections } from "@/components/demo-v2/demo-collections";
import { DemoDiverse } from "@/components/demo-v2/demo-diverse";
import { DemoFeatured } from "@/components/demo-v2/demo-featured";
import { DemoHero } from "@/components/demo-v2/demo-hero";
import { DemoPhoiMau } from "@/components/demo-v2/demo-phoi-mau";
import { DemoPhongCach } from "@/components/demo-v2/demo-phong-cach";
import { DemoPromo } from "@/components/demo-v2/demo-promo";
import { DemoTrustBar } from "@/components/demo-v2/demo-trust-bar";
import { getHomeSectionsForRequest } from "@/lib/cms/published";
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
  const [{ sections, settings }, categories, featured, catalog] = await Promise.all([
    getHomeSectionsForRequest(),
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
  ]);

  void settings;

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

  const pool = padProducts(selectedFeatured, 6, catalog);

  return (
    <>
      {sections.hero.isEnabled ? (
        <DemoHero
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

      <DemoTrustBar items={hero.trustItems} />

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
    </>
  );
}
