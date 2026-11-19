import { DemoCollections } from "@/components/demo-v2/demo-collections";
import { DemoFeatured } from "@/components/demo-v2/demo-featured";
import { DemoHero } from "@/components/demo-v2/demo-hero";
import { DemoPhoiMau } from "@/components/demo-v2/demo-phoi-mau";
import { DemoTrustBar } from "@/components/demo-v2/demo-trust-bar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DemoV2HomePage() {
  const featured = await prisma.product.findMany({
    where: { OR: [{ isFeatured: true }, { isBestSeller: true }, { isNew: true }] },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
    orderBy: [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { isNew: "desc" }],
    take: 5,
  });

  const fallback =
    featured.length >= 5
      ? featured
      : await prisma.product.findMany({
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

  const products = (featured.length >= 5 ? featured : fallback).slice(0, 5);

  return (
    <>
      <DemoHero />
      <DemoTrustBar />
      <DemoCollections />
      <DemoPhoiMau />
      <DemoFeatured products={products} />
    </>
  );
}
