import type { Prisma } from "@prisma/client";
import type { ProductSort } from "@/lib/validation";

export function productOrderBy(
  sort: ProductSort,
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { variants: { _count: "asc" } };
    case "price_desc":
      return { variants: { _count: "desc" } };
    case "name_asc":
      return { name: "asc" };
    case "bestseller":
      return { isBestSeller: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

/** Sort products in memory by min variant price when needed. */
export function sortProductsByPrice<
  T extends { variants: { price: number }[]; name: string; createdAt: Date; isBestSeller: boolean },
>(products: T[], sort: ProductSort): T[] {
  const copy = [...products];
  switch (sort) {
    case "price_asc":
      return copy.sort(
        (a, b) =>
          Math.min(...a.variants.map((v) => v.price)) -
          Math.min(...b.variants.map((v) => v.price)),
      );
    case "price_desc":
      return copy.sort(
        (a, b) =>
          Math.min(...b.variants.map((v) => v.price)) -
          Math.min(...a.variants.map((v) => v.price)),
      );
    case "name_asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    case "bestseller":
      return copy.sort(
        (a, b) => Number(b.isBestSeller) - Number(a.isBestSeller),
      );
    case "newest":
    default:
      return copy.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
  }
}

export function buildProductWhere(params: {
  category?: string;
  gender?: string;
  collection?: string;
  q?: string;
  isNew?: boolean;
}): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (params.category) where.category = { slug: params.category };
  if (params.gender && ["MALE", "FEMALE", "UNISEX"].includes(params.gender)) {
    where.gender = params.gender as "MALE" | "FEMALE" | "UNISEX";
  }
  if (params.isNew) where.isNew = true;
  if (params.collection) {
    where.collections = { some: { collection: { slug: params.collection } } };
  }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { slug: { contains: params.q } },
      { description: { contains: params.q } },
    ];
  }
  return where;
}
