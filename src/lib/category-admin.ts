import { prisma } from "@/lib/prisma";
import { slugify, uniqueSlug } from "@/lib/slug";

export async function uniqueCategorySlug(name: string, preferred?: string) {
  const base = slugify(preferred?.trim() || name, { fallback: "danh-muc" });
  return uniqueSlug(base, async (s) =>
    Boolean(await prisma.category.findUnique({ where: { slug: s } })),
  );
}

export async function deleteCategoryIfEmpty(id: string) {
  const row = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!row) return { ok: false as const, status: 404, error: "Không tìm thấy danh mục" };
  if (row._count.products > 0) {
    return {
      ok: false as const,
      status: 409,
      error: `Không thể xóa: còn ${row._count.products} sản phẩm trong danh mục này. Chuyển sản phẩm sang danh mục khác trước.`,
    };
  }
  if (row._count.children > 0) {
    return {
      ok: false as const,
      status: 409,
      error: "Không thể xóa: danh mục còn danh mục con.",
    };
  }
  await prisma.category.delete({ where: { id } });
  return { ok: true as const };
}