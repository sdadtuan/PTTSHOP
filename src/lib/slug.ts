/**
 * Shared slug helpers (client + server) for product URLs.
 * "Áo Thun Đen Basic 2026!" → "ao-thun-den-basic-2026"
 */
export const SLUG_MAX_LENGTH = 80;
export const SLUG_FALLBACK = "san-pham";
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Letters that NFD does not decompose into base letter + accent.
const SPECIAL_LETTERS: Record<string, string> = {
  đ: "d", Đ: "d", ð: "d", Ð: "d", ø: "o", Ø: "o", ł: "l", Ł: "l", ß: "ss", æ: "ae", Æ: "ae",
  œ: "oe", Œ: "oe", þ: "th", Þ: "th", ı: "i", ħ: "h", Ħ: "h",
};
const SPECIAL_RE = new RegExp(`[${Object.keys(SPECIAL_LETTERS).join("")}]`, "g");

export type SlugifyOptions = {
  /** Max length; cut on a "-" boundary when possible. Default 80. */
  maxLength?: number;
  /** Used when nothing usable is left (e.g. only emoji/symbols). Default "san-pham"; "" disables. */
  fallback?: string;
  /** Keep one trailing "-" (for live typing in the slug field). */
  keepTrailingDash?: boolean;
};

export function slugify(input: unknown, opts: SlugifyOptions = {}): string {
  const maxLength = opts.maxLength ?? SLUG_MAX_LENGTH;
  const fallback = opts.fallback ?? SLUG_FALLBACK;
  let s = String(input ?? "")
    .replace(SPECIAL_RE, (c) => SPECIAL_LETTERS[c] ?? c)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const trailing = opts.keepTrailingDash && s.endsWith("-") && /[a-z0-9]/.test(s);
  s = s.replace(/^-+|-+$/g, "");
  if (s.length > maxLength) {
    const cut = s.slice(0, maxLength);
    const dash = cut.lastIndexOf("-");
    // cut on a word boundary unless that would throw away more than half
    s = (dash >= maxLength / 2 ? cut.slice(0, dash) : cut).replace(/-+$/g, "");
    return s || fallback;
  }
  if (!s) return fallback;
  return trailing ? `${s}-` : s;
}

export function isValidSlug(s: string, maxLength = SLUG_MAX_LENGTH): boolean {
  return s.length > 0 && s.length <= maxLength && SLUG_RE.test(s);
}

function withSuffix(base: string, n: number, maxLength: number) {
  const suffix = `-${n}`;
  const head = base.slice(0, Math.max(1, maxLength - suffix.length)).replace(/-+$/g, "");
  return `${head}${suffix}`;
}

/** First free slug: base, base-2, base-3, … (sync, against a known set). */
export function uniqueSlugSync(base: string, taken: Set<string> | ((s: string) => boolean), maxLength = SLUG_MAX_LENGTH): string {
  const isTaken = typeof taken === "function" ? taken : (s: string) => taken.has(s);
  if (!isTaken(base)) return base;
  for (let n = 2; n < 10_000; n++) {
    const c = withSuffix(base, n, maxLength);
    if (!isTaken(c)) return c;
  }
  return withSuffix(base, Date.now(), maxLength);
}

/** Same as uniqueSlugSync but with an async lookup (DB). */
export async function uniqueSlug(base: string, isTaken: (s: string) => Promise<boolean>, maxLength = SLUG_MAX_LENGTH): Promise<string> {
  if (!(await isTaken(base))) return base;
  for (let n = 2; n < 10_000; n++) {
    const c = withSuffix(base, n, maxLength);
    if (!(await isTaken(c))) return c;
  }
  return withSuffix(base, Date.now(), maxLength);
}
