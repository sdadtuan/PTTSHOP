import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: {
  where: { type: { not: "video" }, isHidden: false },
  orderBy: { sortOrder: "asc" },
  take: 1,
},
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      items: items.map((i) => ({
        id: i.id,
        variantId: i.variantId,
        productId: i.variant.productId,
        slug: i.variant.product.slug,
        name: i.variant.product.name,
        color: i.variant.color,
        size: i.variant.size,
        price: i.variant.price,
        image: i.variant.product.images[0]?.url ?? "",
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const addSchema = z.object({
  variantId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const { variantId } = addSchema.parse(await req.json());
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) return jsonError("Biến thể không tồn tại", 404);

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_variantId: { userId: session.user.id, variantId },
      },
      create: { userId: session.user.id, variantId },
      update: {},
    });
    return jsonOk({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({
  variantId: z.string().min(1),
});

export async function DELETE(req: Request) {
  try {
    const session = await requireSession();
    const { variantId } = deleteSchema.parse(await req.json());
    await prisma.wishlistItem.deleteMany({
      where: { userId: session.user.id, variantId },
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
