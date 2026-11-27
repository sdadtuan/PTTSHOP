export type ListingVariant = {
  id?: string;
  color: string;
  size: string;
  price: number;
  compareAt: number | null;
  stock: number;
};

export type ListingFilters = {
  color?: string;
  size?: string;
  priceMin?: number;
  priceMax?: number;
  onSale?: boolean;
};

function same(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function variantMatchesListing(variant: ListingVariant, filters: ListingFilters, ignore?: "color" | "size") {
  if (variant.stock <= 0) return false;
  if (ignore !== "color" && filters.color && !same(variant.color, filters.color)) return false;
  if (ignore !== "size" && filters.size && !same(variant.size, filters.size)) return false;
  if (filters.priceMin != null && variant.price < filters.priceMin) return false;
  if (filters.priceMax != null && variant.price > filters.priceMax) return false;
  if (filters.onSale && !(variant.compareAt != null && variant.compareAt > variant.price)) return false;
  return true;
}

export function listingFacets(products: { variants: ListingVariant[] }[], filters: ListingFilters) {
  const colors = new Set<string>();
  const sizes = new Set<string>();
  for (const product of products) {
    for (const variant of product.variants) {
      if (variantMatchesListing(variant, filters, "color")) colors.add(variant.color);
      if (variantMatchesListing(variant, filters, "size")) sizes.add(variant.size);
    }
  }
  return {
    colors: [...colors].sort((a, b) => a.localeCompare(b, "vi")),
    sizes: [...sizes].sort((a, b) => a.localeCompare(b, "vi")),
  };
}

export function hasSellableMatch(variants: ListingVariant[], filters: ListingFilters) {
  return variants.some((variant) => variantMatchesListing(variant, filters));
}

/** Null khi ngưỡng trống hoặc tồn còn cao hơn ngưỡng. Không bịa số. */
export function lowStockCount(stock: number, threshold: number | null | undefined) {
  if (threshold == null || threshold <= 0) return null;
  if (!Number.isInteger(stock) || stock <= 0 || stock > threshold) return null;
  return stock;
}
