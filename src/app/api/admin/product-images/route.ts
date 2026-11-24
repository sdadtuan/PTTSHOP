import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  productId: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  type: z.enum(["image", "video"]).default("image"),
  posterUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = createSchema.parse(await req.json());
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) return jsonError("Không tìm thấy sản phẩm", 404);

    const sortOrder =
      body.sortOrder ??
      (body.type === "video"
        ? 0
        : product.images.length
          ? Math.max(...product.images.map((i) => i.sortOrder)) + 1
          : 0);

    const image = await prisma.productImage.create({
      data: {
        productId: body.productId,
        url: body.url,
        alt: body.alt || product.name,
        color: body.color || null,
        type: body.type,
        posterUrl: body.posterUrl || null,
        sortOrder,
      },
    });

    // Keep videos first, then images, stable within each group
    const all = await prisma.productImage.findMany({
      where: { productId: body.productId },
      orderBy: [{ sortOrder: "asc" }],
    });
    const videos = all.filter((i) => i.type === "video");
    const photos = all.filter((i) => i.type !== "video");
    let order = 0;
    for (const row of [...videos, ...photos]) {
      if (row.sortOrder !== order) {
        await prisma.productImage.update({
          where: { id: row.id },
          data: { sortOrder: order },
        });
      }
      order += 1;
    }

    const images = await prisma.productImage.findMany({
      where: { productId: body.productId },
      orderBy: { sortOrder: "asc" },
    });
    return jsonOk({ image, images }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  alt: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  posterUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  type: z.enum(["image", "video"]).optional(),
});

export async function PATCH(req: Request) {
  try {
    await enforceAdmin(req);
    const body = patchSchema.parse(await req.json());
    const { id, ...data } = body;
    const image = await prisma.productImage.update({
      where: { id },
      data,
    });
    return jsonOk({ image });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    await enforceAdmin(req);
    const { id } = deleteSchema.parse(await req.json());
    await prisma.productImage.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
