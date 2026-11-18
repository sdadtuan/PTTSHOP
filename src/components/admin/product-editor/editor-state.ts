/** Pure state helpers for the admin product editor (unit-tested in Vitest). */
import { isVideoMedia, normalizeHex } from "@/lib/product-media";

export type EditorMedia = {
  key: string;
  id?: string;
  url: string;
  alt: string;
  color: string;
  type: "image" | "video";
  posterUrl: string;
  isHidden: boolean;
};

export type EditorSize = {
  key: string;
  id?: string;
  size: string;
  price: number;
  compareAt: number | null;
  stock: number;
};

export type EditorColor = { key: string; name: string; hex: string; sizes: EditorSize[] };

export type ApiProduct = {
  id: string;
  images?: {
    id?: string;
    url: string;
    alt?: string | null;
    color?: string | null;
    type?: string | null;
    posterUrl?: string | null;
    isHidden?: boolean | null;
  }[];
  variants?: {
    id: string;
    color: string;
    colorHex?: string | null;
    size: string;
    price: number;
    compareAt?: number | null;
    stock: number;
  }[];
};

let seq = 0;
export const newKey = (p = "k") => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
export function sizeRank(size: string) {
  const i = SIZE_ORDER.indexOf(size.toUpperCase());
  return i === -1 ? 100 : i;
}

export function mediaFromApi(p: ApiProduct): EditorMedia[] {
  return (p.images || []).map((m) => ({
    key: m.id || newKey("m"),
    id: m.id,
    url: m.url,
    alt: m.alt || "",
    color: m.color || "",
    type: isVideoMedia(m) ? "video" : "image",
    posterUrl: m.posterUrl || "",
    isHidden: Boolean(m.isHidden),
  }));
}

export function colorsFromApi(p: ApiProduct): EditorColor[] {
  const map = new Map<string, EditorColor>();
  for (const v of p.variants || []) {
    let c = map.get(v.color);
    if (!c) {
      c = { key: newKey("c"), name: v.color, hex: normalizeHex(v.colorHex), sizes: [] };
      map.set(v.color, c);
    }
    c.sizes.push({ key: v.id, id: v.id, size: v.size, price: v.price, compareAt: v.compareAt ?? null, stock: v.stock });
  }
  const list = [...map.values()];
  list.forEach((c) => c.sizes.sort((a, b) => sizeRank(a.size) - sizeRank(b.size)));
  return list;
}

/** Move one photo by `delta` among photos only (videos keep their own order). */
export function movePhoto(media: EditorMedia[], key: string, delta: number): EditorMedia[] {
  const photos = media.filter((m) => m.type === "image");
  const i = photos.findIndex((m) => m.key === key);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= photos.length) return media;
  const next = [...photos];
  [next[i], next[j]] = [next[j], next[i]];
  return [...media.filter((m) => m.type === "video"), ...next];
}

/** Make a photo the main image (first photo = cover for cards, cart, PDP). */
export function makeMain(media: EditorMedia[], key: string): EditorMedia[] {
  const photos = media.filter((m) => m.type === "image");
  const target = photos.find((m) => m.key === key);
  if (!target) return media;
  return [...media.filter((m) => m.type === "video"), target, ...photos.filter((m) => m.key !== key)];
}

export function renameColorInMedia(media: EditorMedia[], from: string, to: string): EditorMedia[] {
  if (!from || from === to) return media;
  return media.map((m) => (m.color === from ? { ...m, color: to } : m));
}

export function buildSavePayload(
  info: Record<string, unknown>,
  media: EditorMedia[],
  colors: EditorColor[],
) {
  return {
    ...info,
    media: [
      ...media.filter((m) => m.type === "video"),
      ...media.filter((m) => m.type === "image"),
    ].map((m) => ({
      id: m.id,
      url: m.url,
      alt: m.alt || null,
      color: m.color || null,
      type: m.type,
      posterUrl: m.posterUrl || null,
      isHidden: m.isHidden,
    })),
    variants: colors.flatMap((c) =>
      c.sizes.map((s) => ({
        id: s.id,
        color: c.name.trim(),
        colorHex: c.hex.toUpperCase(),
        size: s.size.trim(),
        price: Math.round(s.price),
        compareAt: s.compareAt ? Math.round(s.compareAt) : null,
        stock: Math.max(0, Math.round(s.stock)),
      })),
    ),
  };
}
