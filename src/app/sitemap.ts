import type { MetadataRoute } from "next";
import { companyPolicyLinks } from "@/content/company";
import { publicCatalogWhere } from "@/lib/catalog-visibility";
import { prisma } from "@/lib/prisma";
import { includeInPublicSitemap } from "@/lib/demo-product";
import { siteBaseUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const [products, looks] = await Promise.all([
    prisma.product.findMany({
    where: publicCatalogWhere,
    select: { name: true, slug: true, updatedAt: true, isDemo: true },
  }),
    prisma.look.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/san-pham`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/bo-suu-tap`, changeFrequency: "weekly", priority: 0.7 },
    ...(looks.length
      ? [{ url: `${base}/lookbook`, changeFrequency: "weekly" as const, priority: 0.6 }]
      : []),
    ...looks.map((look) => ({
      url: `${base}/lookbook/${look.slug}`,
      lastModified: look.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${base}/lien-he`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/ve-chung-toi`, changeFrequency: "monthly", priority: 0.5 },
    ...companyPolicyLinks.map((link) => ({
      url: `${base}${link.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...products
      .filter((product) => includeInPublicSitemap(product))
      .map((product) => ({
        url: `${base}/san-pham/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
