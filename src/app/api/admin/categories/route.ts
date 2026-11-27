import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";
import { deleteCategoryIfEmpty, uniqueCategorySlug } from "@/lib/category-admin";
import { isValidSlug, slugify } from "@/lib/slug";
import { refreshCategorySearchText } from "@/lib/search/text";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
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
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  image: z.string().url().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = createSchema.parse(await req.json());
    const slug = await uniqueCategorySlug(body.name, body.slug);
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        image: body.image ?? undefined,
        parentId: body.parentId ?? undefined,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return jsonOk({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request) {
  try {
    await enforceAdmin(req);
    const body = patchSchema.parse(await req.json());
    const { id, slug: slugRaw, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (slugRaw !== undefined) {
      const slug = slugify(slugRaw, { fallback: "danh-muc" });
      if (!isValidSlug(slug)) return jsonError("Slug không hợp lệ", 400);
      const clash = await prisma.category.findFirst({
        where: { slug, NOT: { id } },
      });
      if (clash) return jsonError("Slug đã được danh mục khác dùng", 409);
      data.slug = slug;
    }
    const before = await prisma.category.findUnique({ where: { id }, select: { name: true, slug: true } });
    const category = await prisma.category.update({ where: { id }, data });
    if (before && (before.name !== category.name || before.slug !== category.slug)) {
      await refreshCategorySearchText(prisma, category.id);
    }
    return jsonOk({ category });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    await enforceAdmin(req);
    const { id } = deleteSchema.parse(await req.json());
    const result = await deleteCategoryIfEmpty(id);
    if (!result.ok) return jsonError(result.error, result.status);
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
