const BLANK_PLACEHOLDER = /\/images\/placeholder-product\.(png|svg|jpe?g|webp)(?:[?#]|$)/i;

/** File placeholder cũ (ô gần như trống). Không phải ảnh shop. */
export function isBlankProductPlaceholder(src: string | null | undefined): boolean {
  return BLANK_PLACEHOLDER.test((src || "").trim());
}

export function missingProductImageAlt(name: string): string {
  const label = name.trim() || "sản phẩm";
  return `Chưa có ảnh ${label}`;
}

/** URL đem ra next/image. File placeholder trống và chuỗi rỗng → null. Unsplash vẫn giữ. */
export function shopDisplaySrc(src: string | null | undefined): string | null {
  const value = (src || "").trim();
  if (!value || isBlankProductPlaceholder(value)) return null;
  return value;
}
