const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];

export type StockVariant = { color: string; size: string; stock: number };

function sizeRank(size: string) {
  const index = SIZE_ORDER.indexOf(size.toUpperCase());
  return index === -1 ? 100 + (Number.parseInt(size, 10) || 0) : index;
}

export function colorOutOfStock(variants: StockVariant[], color: string): boolean {
  const rows = variants.filter((variant) => variant.color === color);
  return rows.length > 0 && rows.every((variant) => variant.stock <= 0);
}

/** Giữ size đang chọn nếu còn hàng; không thì lấy size còn hàng nhỏ nhất. */
export function pickSizeForColor(
  variants: StockVariant[],
  color: string,
  currentSize: string,
): string {
  const rows = variants
    .filter((variant) => variant.color === color)
    .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
  const keep = rows.find((variant) => variant.size === currentSize && variant.stock > 0);
  if (keep) return keep.size;
  return rows.find((variant) => variant.stock > 0)?.size ?? rows[0]?.size ?? currentSize;
}
