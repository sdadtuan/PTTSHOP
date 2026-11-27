import type { Prisma, PrismaClient } from "@prisma/client";
import { foldKey } from "@/lib/search/fold";

type Db = PrismaClient | Prisma.TransactionClient;

const GENDER_LABEL: Record<string, string> = {
  MALE: "nam",
  FEMALE: "nu",
  UNISEX: "unisex",
};

export function buildSearchText(input: {
  name: string;
  slug: string;
  description?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  gender?: string | null;
  colors?: string[];
  sizes?: string[];
}) {
  return foldKey(
    [
      input.name,
      input.slug,
      input.description,
      input.categoryName,
      input.categorySlug,
      input.gender ? GENDER_LABEL[input.gender] || input.gender : "",
      ...(input.colors ?? []),
      ...(input.sizes ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  ).slice(0, 2000);
}

export async function refreshProductSearchText(db: Db, productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { name: true, slug: true } },
      variants: { select: { color: true, size: true } },
    },
  });
  if (!product) return;
  const searchText = buildSearchText({
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryName: product.category?.name,
    categorySlug: product.category?.slug,
    gender: product.gender,
    colors: product.variants.map((variant) => variant.color),
    sizes: product.variants.map((variant) => variant.size),
  });
  if (product.searchText === searchText) return;
  await db.product.update({ where: { id: productId }, data: { searchText } });
}

export async function refreshCategorySearchText(db: Db, categoryId: string) {
  const products = await db.product.findMany({ where: { categoryId }, select: { id: true } });
  for (const product of products) {
    await refreshProductSearchText(db, product.id);
  }
}
