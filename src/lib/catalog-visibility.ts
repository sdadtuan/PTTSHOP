import type { Prisma } from "@prisma/client";

export const SALE_STATUSES = ["DRAFT", "SELLING", "HIDDEN", "DISCONTINUED"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SELLING: SaleStatus = "SELLING";

export const publicCatalogWhere = { saleStatus: SELLING } satisfies Prisma.ProductWhereInput;

export function publicVariants() {
  return { omit: { costPrice: true } } as const;
}
