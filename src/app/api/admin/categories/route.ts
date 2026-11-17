import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return jsonOk({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  image: z.string().url().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await req.json());
    const existing = await prisma.category.findUnique({
      where: { slug: body.slug },
    });
    if (existing) return jsonError("Slug đã tồn tại", 409);
    const category = await prisma.category.create({ data: body });
    return jsonOk({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const { id, ...data } = body;
    const category = await prisma.category.update({ where: { id }, data });
    return jsonOk({ category });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = deleteSchema.parse(await req.json());
    await prisma.category.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
