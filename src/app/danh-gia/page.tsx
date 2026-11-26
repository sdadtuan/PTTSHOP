import { ReviewsCatalogClient } from "@/components/reviews/reviews-catalog-client";
import { publicCatalogWhere } from "@/lib/catalog-visibility";
import { prisma } from "@/lib/prisma";
import { listPublishedReviews } from "@/lib/reviews";
import { publicCopy, publicNavLabel } from "@/lib/public-brand";
import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getStorefrontPageBySlug("danh-gia");
  return {
    title: publicNavLabel(page?.title || "Đánh giá"),
    description: publicCopy(page?.description, "Đánh giá sản phẩm từ khách hàng PTT Shop"),
  };
}

export default async function ReviewsPage() {
  const [page, initial, products, categories] = await Promise.all([
    getStorefrontPageBySlug("danh-gia"),
    listPublishedReviews(prisma, { page: 1, pageSize: 12 }),
    prisma.product.findMany({
      where: { ...publicCatalogWhere, reviews: { some: { isPublished: true } } },
      select: { id: true, name: true, slug: true, categoryId: true, reviewCount: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.category.findMany({
      where: { products: { some: { reviews: { some: { isPublished: true } } } } },
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const intro =
    publicCopy(
      page?.body?.[0] || page?.description,
      "Xem nhận xét thật từ khách đã mua và trải nghiệm sản phẩm PTT Shop.",
    );

  const initialClient = {
    ...initial,
    reviews: initial.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <ReviewsCatalogClient intro={intro} categories={categories} products={products} initial={initialClient} />
  );
}