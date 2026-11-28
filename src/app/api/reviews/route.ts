import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getOptionalSession, requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { PUBLISHED_REVIEW_WHERE, latestReviewableOrderId, recomputeProductRating, reviewDisplayName, reviewEligibility } from "@/lib/reviews";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) return jsonError("Thiếu productId", 400);

    const reviews = await prisma.review.findMany({
      where: { productId, ...PUBLISHED_REVIEW_WHERE },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const session = await getOptionalSession();
    let eligibleOrderId: string | null = null;
    if (session?.user?.id) {
      const orderId = await latestReviewableOrderId(prisma, session.user.id, productId);
      if (orderId) {
        const existing = await prisma.review.findFirst({ where: { orderId, productId } });
        if (!existing) eligibleOrderId = orderId;
      }
    }

    return jsonOk({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        userName: reviewDisplayName(r),
      })),
      eligibleOrderId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = createSchema.parse(await req.json());

    const allowed = await reviewEligibility(prisma, {
      userId: session.user.id,
      productId: body.productId,
      orderId: body.orderId,
    });
    if (!allowed) {
      return jsonError("Chỉ đánh giá khi đơn đã giao hoặc đã hoàn tất", 403);
    }
    const duplicate = await prisma.review.findFirst({
      where: { orderId: body.orderId, productId: body.productId },
      select: { id: true },
    });
    if (duplicate) return jsonError("Đơn này đã có đánh giá cho sản phẩm", 409);

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          userId: session.user.id,
          productId: body.productId,
          orderId: body.orderId,
          rating: body.rating,
          comment: body.comment || null,
          isPublished: false,
          isAdminCreated: false,
        },
      });
      await recomputeProductRating(tx, body.productId);
      return created;
    });

    return jsonOk({ review }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
