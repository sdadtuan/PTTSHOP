export type VariantLike = {
  id: string;
  color: string;
  size: string;
  stock: number;
  price: number;
  sku?: string;
};

export type ProductSummary = {
  variantCount: number;
  colorCount: number;
  sizeCount: number;
  totalStock: number;
  minPrice: number | null;
  maxPrice: number | null;
};

export function summarizeVariants(variants: VariantLike[]): ProductSummary {
  if (variants.length === 0) {
    return {
      variantCount: 0,
      colorCount: 0,
      sizeCount: 0,
      totalStock: 0,
      minPrice: null,
      maxPrice: null,
    };
  }

  const colors = new Set<string>();
  const sizes = new Set<string>();
  let totalStock = 0;
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = Number.NEGATIVE_INFINITY;

  for (const v of variants) {
    colors.add(v.color);
    sizes.add(v.size);
    totalStock += v.stock;
    if (v.price < minPrice) minPrice = v.price;
    if (v.price > maxPrice) maxPrice = v.price;
  }

  return {
    variantCount: variants.length,
    colorCount: colors.size,
    sizeCount: sizes.size,
    totalStock,
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
  };
}

/** Group variants by color for expand rows (stable color order). */
export function groupVariantsByColor(variants: VariantLike[]) {
  const map = new Map<string, VariantLike[]>();
  for (const v of variants) {
    const list = map.get(v.color) ?? [];
    list.push(v);
    map.set(v.color, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.size.localeCompare(b.size, "vi"));
  }
  return [...map.entries()].map(([color, items]) => ({ color, items }));
}
