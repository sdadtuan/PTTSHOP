/** Shared helpers for product media (images + videos) used by storefront and admin. */

export type MediaLike = {
  url: string;
  type?: string | null;
  isHidden?: boolean | null;
  color?: string | null;
};

const VIDEO_EXT = /\.(mp4|webm)(\?|#|$)/i;

export function isVideoMedia(m: Pick<MediaLike, "url" | "type">): boolean {
  if ((m.type || "").toLowerCase() === "video") return true;
  return VIDEO_EXT.test(m.url || "");
}

/** Media a customer may see (hidden rows stay in DB but are not shown). */
export function visibleMedia<T extends MediaLike>(list: T[]): T[] {
  return list.filter((m) => !m.isHidden && Boolean(m.url));
}

/** First visible photo — never a video (next/image cannot render .mp4). */
export function primaryImage<T extends MediaLike>(list: T[], color?: string | null): T | undefined {
  const photos = visibleMedia(list).filter((m) => !isVideoMedia(m));
  return (color ? photos.find((m) => m.color === color) : undefined) ?? photos[0];
}

/** Ảnh dòng giỏ: đúng màu nếu có, không thì ảnh đầu còn hiện. Ảnh ẩn không được chọn. */
export function cartLineImage(list: MediaLike[], color?: string | null): string {
  return primaryImage(list, color)?.url ?? "";
}

/**
 * Storefront gallery order for a selected colour. EVERY visible image/video is
 * returned (nothing is dropped), ordered: videos first (unchanged PDP behaviour,
 * the video stays in the main frame on load), then the selected colour's photos,
 * then shared photos, then other colours' photos. Duplicate URLs are shown once.
 * A shared photo whose URL is also tagged for a colour counts as that colour.
 */
export function mediaForColor<T extends MediaLike>(list: T[], color?: string | null): T[] {
  const vis = visibleMedia(list);
  const colorOfUrl = new Map<string, string>();
  for (const m of vis) if (m.color && !colorOfUrl.has(m.url)) colorOfUrl.set(m.url, m.color);
  const eff = (m: T) => m.color || colorOfUrl.get(m.url) || "";
  const rank = (m: T) => {
    const base = isVideoMedia(m) ? 0 : 10;
    if (!color) return base;
    const c = eff(m);
    return base + (c === color ? 0 : !c ? 1 : 2);
  };
  const sorted = vis
    .map((m, i) => ({ m, i }))
    .sort((a, b) => rank(a.m) - rank(b.m) || a.i - b.i)
    .map((x) => x.m);
  const seen = new Set<string>();
  return sorted.filter((m) => {
    const k = `${isVideoMedia(m) ? "v" : "i"}:${m.url}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Index (in mediaForColor order) of the first photo of `color`, or 0. */
export function firstColorPhotoIndex<T extends MediaLike>(ordered: T[], color?: string | null): number {
  if (!color) return 0;
  const colorOfUrl = new Map<string, string>();
  for (const m of ordered) if (m.color && !colorOfUrl.has(m.url)) colorOfUrl.set(m.url, m.color);
  const i = ordered.findIndex((m) => !isVideoMedia(m) && (m.color || colorOfUrl.get(m.url)) === color);
  return i === -1 ? 0 : i;
}

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Upper-case ASCII SKU part: "Đen nâu" → "DEN-NAU". */
export function skuPart(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

/** "#abc" → "#AABBCC"; invalid → fallback. */
export function normalizeHex(hex: string | null | undefined, fallback = "#CCCCCC"): string {
  const h = (hex || "").trim();
  if (/^#[0-9a-fA-F]{3}$/.test(h)) return `#${h.slice(1).split("").map((c) => c + c).join("")}`.toUpperCase();
  return HEX_RE.test(h) ? h.toUpperCase() : fallback;
}
