/**
 * Ô danh mục trang chủ. Thiếu imageUrl thì không mượn ảnh mặc định.
 * cat-phu-kien.jpg chỉ dùng khi ô thực sự trỏ danh mục phu-kien
 * (ô "Nữ" từng hiện ảnh phụ kiện vì slug phu-kien không có trong DB).
 */
export function collectionTileSrc(input: {
  imageUrl?: string | null;
  resolvedCategorySlug?: string | null;
}): string | null {
  const url = (input.imageUrl || "").trim();
  if (!url) return null;
  const borrowedAccessory = url.endsWith("/images/home-v2/cat-phu-kien.jpg");
  if (borrowedAccessory && input.resolvedCategorySlug !== "phu-kien") return null;
  return url;
}
