import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getOptionalSession, requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { PUBLISHED_REVIEW_WHERE, recomputeProductRating, reviewDisplayName } from "@/lib/reviews";

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
      const existing = await prisma.review.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId,
          },
        },
      });
      if (!existing) {
        const order = await prisma.order.findFirst({
          where: {
            userId: session.user.id,
            status: { not: "CANCELLED" },
            items: { some: { variant: { productId } } },
          },
          orderBy: { createdAt: "desc" },
        });
        eligibleOrderId = order?.id ?? null;
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

    const order = await prisma.order.findFirst({
      where: {
        id: body.orderId,
        userId: session.user.id,
        status: { not: "CANCELLED" },
        items: { some: { variant: { productId: body.productId } } },
      },
    });
    if (!order) {
      return jsonError("Chỉ đánh giá sản phẩm đã mua", 403);
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          userId: session.user.id,
          productId: body.productId,
          orderId: body.orderId,
          rating: body.rating,
          comment: body.comment || null,
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
