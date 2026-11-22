/** Ảnh /media/ do Nginx đọc đĩa. Next optimizer gọi lại app và nhận 404. */
export function isCatalogMediaSrc(src: string): boolean {
  return src.startsWith("/media/");
}
