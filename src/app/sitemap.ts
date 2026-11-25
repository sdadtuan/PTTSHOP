import type { MetadataRoute } from "next";
import { companyPolicyLinks } from "@/content/company";
import { publicCatalogWhere } from "@/lib/catalog-visibility";
import { prisma } from "@/lib/prisma";
import { isDemoName, siteBaseUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const products = await prisma.product.findMany({
    where: publicCatalogWhere,
    select: { name: true, slug: true, updatedAt: true },
  });

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/san-pham`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/bo-suu-tap`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/lien-he`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/ve-chung-toi`, changeFrequency: "monthly", priority: 0.5 },
    ...companyPolicyLinks.map((link) => ({
      url: `${base}${link.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...products
      .filter((product) => !isDemoName(product.name))
      .map((product) => ({
        url: `${base}/san-pham/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
