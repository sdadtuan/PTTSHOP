import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { recomputeProductRating } from "@/lib/reviews";

export async function GET() {
  try {
    await requireAdmin();
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return jsonOk({ reviews });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = deleteSchema.parse(await req.json());
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return jsonOk({ ok: true });
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await recomputeProductRating(tx, review.productId);
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
