import type { Prisma } from "@prisma/client";

export const SALE_STATUSES = ["DRAFT", "SELLING", "HIDDEN", "DISCONTINUED"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SELLING: SaleStatus = "SELLING";

export const NOT_FOR_SALE_MESSAGE = "Sản phẩm không còn bán";

export function variantIsForSale(product: { isDemo: boolean; saleStatus: string }) {
  return !product.isDemo && product.saleStatus === SELLING;
}

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  DRAFT: "Nháp",
  SELLING: "Đang bán",
  HIDDEN: "Tạm ẩn",
  DISCONTINUED: "Ngừng bán",
};

export const publicCatalogWhere = {
  saleStatus: SELLING,
  isDemo: false,
} satisfies Prisma.ProductWhereInput;

export function publicVariants() {
  return { omit: { costPrice: true } } as const;
}
