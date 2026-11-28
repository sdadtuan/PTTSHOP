import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(300).optional(),
  isPublished: z.boolean().optional(),
  productIds: z.array(z.string().min(1).max(80)).max(12).optional(),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const looks = await prisma.look.findMany({
      orderBy: { updatedAt: "desc" },
      include: { items: { orderBy: { position: "asc" }, select: { productId: true, position: true } } },
      take: 50,
    });
    return jsonOk({
      looks: looks.map((look) => ({
        id: look.id,
        title: look.title,
        slug: look.slug,
        isPublished: look.isPublished,
        items: look.items,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const slug = slugify(body.slug || body.title);
    if (!slug) return jsonError("Thiếu slug");
    const productIds = body.productIds || [];
    if (productIds.length) {
      const found = await prisma.product.count({ where: { id: { in: productIds }, isDemo: false } });
      if (found !== new Set(productIds).size) return jsonError("Chỉ gắn sản phẩm thật, không gắn hàng demo");
    }
    const look = await prisma.look.create({
      data: {
        title: body.title,
        slug,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        isPublished: body.isPublished === true,
        items: { create: productIds.map((productId, position) => ({ productId, position })) },
      },
    });
    return jsonOk({ id: look.id, slug: look.slug, isPublished: look.isPublished });
  } catch (err) {
    return handleApiError(err);
  }
}
