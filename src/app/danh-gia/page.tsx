import { ReviewsCatalogClient } from "@/components/reviews/reviews-catalog-client";
import { prisma } from "@/lib/prisma";
import { listPublishedReviews } from "@/lib/reviews";
import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getStorefrontPageBySlug("danh-gia");
  return {
    title: page?.title || "Đánh giá",
    description: page?.description || "Đánh giá sản phẩm từ khách hàng VIZFAS",
  };
}

export default async function ReviewsPage() {
  const [page, initial, products, categories] = await Promise.all([
    getStorefrontPageBySlug("danh-gia"),
    listPublishedReviews(prisma, { page: 1, pageSize: 12 }),
    prisma.product.findMany({
      where: { reviews: { some: { isPublished: true } } },
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
    page?.body?.[0] ||
    page?.description ||
    "Xem nhận xét thật từ khách đã mua và trải nghiệm sản phẩm VIZFAS.";

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