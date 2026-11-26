/**
 * Ảnh/video mới chỉ được lưu từ file của shop hoặc QR VietQR.
 * Unsplash còn trên sản phẩm đang bán được giữ khi sửa, không được thêm mới.
 */

const LOCAL_PREFIXES = ["/media/", "/images/", "/uploads/", "/videos/"] as const;

export function isLocalShopMediaUrl(url: string): boolean {
  if (!url.startsWith("/") || url.startsWith("//")) return false;
  if (/[\s"'()<>\\`]/.test(url)) return false;
  return LOCAL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function isVietqrMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "cdn.vietqr.io";
  } catch {
    return false;
  }
}

export function isLegacyUnsplashUrl(url: string): boolean {
  return url.startsWith("https://images.unsplash.com/");
}

/** Host ngoài mới (kể cả Unsplash) không được thêm. */
export function isAllowedNewMediaUrl(url: string): boolean {
  return isLocalShopMediaUrl(url) || isVietqrMediaUrl(url);
}

/**
 * URL đã nằm trên sản phẩm và là Unsplash thì được giữ nguyên khi lưu lại.
 * Mọi URL Unsplash khác bị từ chối.
 */
export function isAllowedProductMediaUrl(url: string, existingUrls: ReadonlySet<string>): boolean {
  if (isAllowedNewMediaUrl(url)) return true;
  return isLegacyUnsplashUrl(url) && existingUrls.has(url);
}
