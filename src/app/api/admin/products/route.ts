import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { saveProductFull } from "@/lib/product-save";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: { orderBy: { id: "asc" } },
          images: { orderBy: { sortOrder: "asc" } },
        },
      });
      if (!product) return jsonError("Không tìm thấy sản phẩm", 404);
      return jsonOk({ product });
    }
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk({ products });
  } catch (err) {
    return handleApiError(err);
  }
}

const variantSchema = z.object({
  sku: z.string().min(1),
  color: z.string().min(1),
  colorHex: z.string().optional().nullable(),
  size: z.string().min(1),
  price: z.number().int().positive(),
  compareAt: z.number().int().positive().optional().nullable(),
  stock: z.number().int().nonnegative(),
});

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  material: z.string().optional(),
  fit: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]).default("UNISEX"),
  categoryId: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().optional(),
        color: z.string().optional().nullable(),
        type: z.enum(["image", "video"]).optional().default("image"),
        posterUrl: z.string().optional().nullable(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .min(1),
  variants: z.array(variantSchema).min(1),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await req.json());
    const existing = await prisma.product.findUnique({
      where: { slug: body.slug },
    });
    if (existing) return jsonError("Slug đã tồn tại", 409);

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        material: body.material,
        fit: body.fit,
        gender: body.gender,
        categoryId: body.categoryId || null,
        isFeatured: body.isFeatured ?? false,
        isNew: body.isNew ?? false,
        isBestSeller: body.isBestSeller ?? false,
        images: {
          create: body.images.map((img, i) => ({
            url: img.url,
            alt: img.alt || body.name,
            color: img.color || null,
            type: img.type || "image",
            posterUrl: img.posterUrl || null,
            sortOrder: img.sortOrder ?? i,
          })),
        },
        variants: {
          create: body.variants.map((v) => ({
            sku: v.sku,
            color: v.color,
            colorHex: v.colorHex || null,
            size: v.size,
            price: v.price,
            compareAt: v.compareAt || null,
            stock: v.stock,
          })),
        },
      },
      include: { variants: true, images: true },
    });
    return jsonOk({ product }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]).optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const { id, ...data } = body;
    const product = await prisma.product.update({
      where: { id },
      data,
    });
    return jsonOk({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = deleteSchema.parse(await req.json());
    await prisma.product.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Full save from the admin product editor: basic info + every image/video
 * (array order = display order) + every colour/size variant, in one transaction.
 * Works for create (no id) and edit (id). Removed variants that already have
 * orders are kept with stock 0 instead of being deleted.
 */
export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const result = await saveProductFull(prisma, await req.json());
    const product = await prisma.product.findUnique({
      where: { id: result.productId },
      include: {
        category: true,
        variants: { orderBy: { id: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    return jsonOk({ product, keptVariantIds: result.keptVariantIds });
  } catch (err) {
    return handleApiError(err);
  }
}
