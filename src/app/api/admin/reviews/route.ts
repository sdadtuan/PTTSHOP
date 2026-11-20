import { revalidatePath } from "next/cache";
import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { recomputeProductRating, reviewDisplayName } from "@/lib/reviews";

function serializeReview(r: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  isPublished: boolean;
  isAdminCreated: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  user: { name: string | null; email: string } | null;
  product: { id: string; name: string; slug: string };
}) {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    isPublished: r.isPublished,
    isAdminCreated: r.isAdminCreated,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    userName: reviewDisplayName(r),
    user: r.user,
    product: r.product,
  };
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase();
    const rating = url.searchParams.get("rating");
    const published = url.searchParams.get("published");
    const productId = url.searchParams.get("productId") || undefined;

    const reviews = await prisma.review.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(rating ? { rating: Number(rating) } : {}),
        ...(published === "0" ? { isPublished: false } : published === "1" ? { isPublished: true } : {}),
      },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const filtered = q
      ? reviews.filter(
          (r) =>
            r.product.name.toLowerCase().includes(q) ||
            (r.user?.name || "").toLowerCase().includes(q) ||
            (r.user?.email || "").toLowerCase().includes(q) ||
            (r.displayName || "").toLowerCase().includes(q) ||
            (r.comment || "").toLowerCase().includes(q),
        )
      : reviews;

    return jsonOk({ reviews: filtered.map(serializeReview) });
  } catch (err) {
    return handleApiError(err);
  }
}

const adminCreateSchema = z.object({
  productId: z.string().min(1),
  displayName: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = adminCreateSchema.parse(await req.json());
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) return jsonError("Không tìm thấy sản phẩm", 404);

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId: body.productId,
          userId: null,
          orderId: null,
          rating: body.rating,
          comment: body.comment || null,
          displayName: body.displayName,
          avatarUrl: body.avatarUrl ?? null,
          isAdminCreated: true,
          isPublished: body.isPublished ?? true,
          ...(body.createdAt ? { createdAt: new Date(body.createdAt) } : {}),
        },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      });
      await recomputeProductRating(tx, body.productId);
      return created;
    });

    revalidatePath("/danh-gia");
    revalidatePath(`/san-pham/${product.slug}`);
    return jsonOk({ review: serializeReview(review) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(2000).optional().nullable(),
  displayName: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const { id, createdAt, ...rest } = body;
    const existing = await prisma.review.findUnique({
      where: { id },
      include: { product: { select: { slug: true } } },
    });
    if (!existing) return jsonError("Không tìm thấy đánh giá", 404);

    const review = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          ...rest,
          ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
        },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      });
      await recomputeProductRating(tx, existing.productId);
      return updated;
    });

    revalidatePath("/danh-gia");
    revalidatePath(`/san-pham/${existing.product.slug}`);
    return jsonOk({ review: serializeReview(review) });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = deleteSchema.parse(await req.json());
    const review = await prisma.review.findUnique({
      where: { id },
      include: { product: { select: { slug: true } } },
    });
    if (!review) return jsonOk({ ok: true });
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await recomputeProductRating(tx, review.productId);
    });
    revalidatePath("/danh-gia");
    revalidatePath(`/san-pham/${review.product.slug}`);
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}