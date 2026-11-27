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

function foldSize(size: string) {
  return size
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function isFreeSize(size: string) {
  const folded = foldSize(size);
  return folded === "freesize" || folded === "onesize";
}

/**
 * Một size, kể cả Free size, thì chọn sẵn.
 * Nhiều size thì giữ lựa chọn người dùng; chưa chọn thì để trống.
 */
export function resolveSizeChoice(
  variants: StockVariant[],
  color: string,
  currentSize: string,
): string {
  const rows = variants.filter((variant) => variant.color === color);
  const distinct = [...new Set(rows.map((variant) => variant.size))];
  if (distinct.length === 1) return distinct[0];
  if (distinct.length > 0 && distinct.every(isFreeSize)) {
    return rows.find((variant) => variant.stock > 0)?.size ?? distinct[0];
  }
  if (currentSize && rows.some((variant) => variant.size === currentSize)) return currentSize;
  return "";
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
