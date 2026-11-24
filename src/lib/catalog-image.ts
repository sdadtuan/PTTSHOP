/** Ảnh /media/catalog và /media/uploads do Nginx đọc đĩa. Next optimizer gọi lại app và nhận 404. */
export function isCatalogMediaSrc(src: string): boolean {
  return src.startsWith("/media/");
}

/** Ảnh public nội bộ đi qua optimizer (WebP/AVIF, đúng bề rộng). /media/ giữ nguyên. */
export function optimizedPublicImageUrl(src: string, width = 828) {
  if (!src.startsWith("/") || isCatalogMediaSrc(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
