import type { PrismaClient } from "@prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export const PUBLISHED_REVIEW_WHERE = { isPublished: true } as const;
export const CUSTOMER_RATING_WHERE = { isPublished: true, isAdminCreated: false } as const;

export function reviewDisplayName(r: {
  displayName: string | null;
  user?: { name: string | null } | null;
}) {
  if (r.displayName?.trim()) return r.displayName.trim();
  if (r.user?.name?.trim()) return r.user.name.trim();
  return "Khách";
}

export async function recomputeProductRating(
  db: Tx | PrismaClient,
  productId: string,
) {
  const agg = await db.review.aggregate({
    where: { productId, ...CUSTOMER_RATING_WHERE },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await db.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      reviewCount: agg._count.rating,
    },
  });
}

export type ReviewCatalogFilters = {
  page?: number;
  pageSize?: number;
  rating?: number;
  productId?: string;
  productSlug?: string;
  categoryId?: string;
  categorySlug?: string;
};

export async function listPublishedReviews(
  db: Tx | PrismaClient,
  filters: ReviewCatalogFilters = {},
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, filters.pageSize ?? 12));
  let categoryId = filters.categoryId;
  if (!categoryId && filters.categorySlug) {
    const cat = await db.category.findUnique({
      where: { slug: filters.categorySlug },
      select: { id: true },
    });
    categoryId = cat?.id;
  }

  const where: {
    isPublished: true;
    rating?: number;
    productId?: string;
    product?: { slug?: string; categoryId?: string };
  } = { isPublished: true };
  if (filters.rating && filters.rating >= 1 && filters.rating <= 5) {
    where.rating = filters.rating;
  }
  if (filters.productId) where.productId = filters.productId;
  else if (filters.productSlug) where.product = { slug: filters.productSlug };
  else if (categoryId) where.product = { categoryId };

  const [total, reviews, summary] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      include: {
        user: { select: { name: true } },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isHidden: false, type: { not: "video" } },
              orderBy: { sortOrder: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.review.groupBy({
      by: ["rating"],
      where: { ...CUSTOMER_RATING_WHERE },
      _count: { rating: true },
    }),
  ]);

  const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let publishedTotal = 0;
  let weighted = 0;
  for (const row of summary) {
    starCounts[row.rating] = row._count.rating;
    publishedTotal += row._count.rating;
    weighted += row.rating * row._count.rating;
  }
  const average = publishedTotal > 0 ? Math.round((weighted / publishedTotal) * 10) / 10 : null;

  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary: { average, total: publishedTotal, starCounts },
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      userName: reviewDisplayName(r),
      avatarUrl: r.avatarUrl,
      product: {
        id: r.product.id,
        name: r.product.name,
        slug: r.product.slug,
        image: r.product.images[0]?.url ?? null,
      },
    })),
  };
}

type ReviewDb = Tx | PrismaClient;

export async function reviewEligibility(
  db: ReviewDb,
  args: { userId: string; productId: string; orderId: string },
) {
  const order = await db.order.findFirst({
    where: {
      id: args.orderId,
      userId: args.userId,
      items: { some: { variant: { productId: args.productId } } },
    },
    select: { id: true, status: true },
  });
  if (!order || order.status === "CANCELLED") return false;
  if (order.status === "COMPLETED") return true;
  const items = await db.orderItem.findMany({
    where: { orderId: order.id, variant: { productId: args.productId } },
    select: { id: true },
  });
  if (items.length === 0) return false;
  const delivered = await db.shipment.findFirst({
    where: {
      orderId: order.id,
      status: "DELIVERED",
      items: { some: { orderItemId: { in: items.map((item) => item.id) } } },
    },
    select: { id: true },
  });
  return Boolean(delivered);
}

export async function latestReviewableOrderId(db: ReviewDb, userId: string, productId: string) {
  const orders = await db.order.findMany({
    where: {
      userId,
      status: { not: "CANCELLED" },
      items: { some: { variant: { productId } } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  for (const order of orders) {
    if (await reviewEligibility(db, { userId, productId, orderId: order.id })) return order.id;
  }
  return null;
}