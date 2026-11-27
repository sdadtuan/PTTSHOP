import { foldVi } from "@/lib/search/fold";

export const SEARCH_QUERY_MAX = 100;

export type ParsedSearch = {
  raw: string;
  normalized: string;
  category?: string;
  categoryLabel?: string;
  gender?: "MALE" | "FEMALE";
  color?: string;
  size?: string;
  priceMin?: number;
  priceMax?: number;
  isNew?: boolean;
  onSale?: boolean;
  keywords: string[];
};

const CATEGORIES: { tokens: string[]; slug: string; label: string; keepKeyword?: boolean }[] = [
  { tokens: ["ao", "thun"], slug: "ao-thun", label: "Áo thun" },
  { tokens: ["ao", "khoac"], slug: "ao-khoac", label: "Áo khoác" },
  { tokens: ["hoodie"], slug: "hoodie", label: "Hoodie" },
  { tokens: ["quan"], slug: "quan", label: "Quần" },
  // Nón nằm trong Phụ kiện. Giữ từ "non" để túi không lọt vào.
  { tokens: ["non"], slug: "phu-kien", label: "Nón", keepKeyword: true },
];

const COLORS = new Set(["den", "trang", "do", "hong", "kem", "nau", "navy", "olive", "xam", "xanh", "be", "cam", "ghi"]);
const AMBIGUOUS = new Set(["kaki", "khaki", "denim", "jean", "bo"]);
const SIZES: Record<string, string> = {
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
  freesize: "Free",
  free: "Free",
};

function money(token: string): number | null {
  const k = /^(\d+(?:[.,]\d+)?)k$/.exec(token);
  if (k) return Math.round(Number(k[1].replace(",", ".")) * 1000);
  const grouped = /^(\d{1,3}(?:\.\d{3})+)$/.exec(token);
  if (grouped) return Number(grouped[1].replace(/\./g, ""));
  if (/^\d{5,7}$/.test(token)) return Number(token);
  return null;
}

function range(token: string): { min: number; max: number } | null {
  const match = /^(\d+(?:[.,]\d+)?)-(\d+(?:[.,]\d+)?)(k)?$/.exec(token);
  if (!match) return null;
  const factor = match[3] ? 1000 : 1;
  const min = Math.round(Number(match[1].replace(",", ".")) * factor);
  const max = Math.round(Number(match[2].replace(",", ".")) * factor);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) return null;
  if (!match[3] && max < 1000) return null;
  return { min, max };
}

export function clipQuery(value: string) {
  return value.trim().slice(0, SEARCH_QUERY_MAX);
}

export function parseSearchQuery(input: string): ParsedSearch {
  const raw = clipQuery(input);
  const normalized = foldVi(raw);
  const tokens = normalized.split(" ").filter(Boolean);
  const used = new Set<number>();
  const parsed: ParsedSearch = { raw, normalized, keywords: [] };

  for (const category of CATEGORIES) {
    for (let i = 0; i <= tokens.length - category.tokens.length; i++) {
      if (category.tokens.every((token, offset) => tokens[i + offset] === token && !used.has(i + offset))) {
        parsed.category = category.slug;
        parsed.categoryLabel = category.label;
        if (!category.keepKeyword) {
          category.tokens.forEach((_, offset) => used.add(i + offset));
        }
        break;
      }
    }
    if (parsed.category) break;
  }

  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i)) continue;
    const span = range(tokens[i]);
    if (span) {
      parsed.priceMin = span.min;
      parsed.priceMax = span.max;
      used.add(i);
      continue;
    }
    const next = tokens[i + 1];
    const amount = next ? money(next) : null;
    if (amount != null && (tokens[i] === "duoi" || tokens[i] === "toida")) {
      parsed.priceMax = amount;
      used.add(i);
      used.add(i + 1);
      i += 1;
      continue;
    }
    if (amount != null && (tokens[i] === "tren" || tokens[i] === "toithieu")) {
      parsed.priceMin = amount;
      used.add(i);
      used.add(i + 1);
      i += 1;
      continue;
    }
    if (tokens[i] === "tu" && amount != null && (tokens[i + 2] === "den" || tokens[i + 2] === "-") && money(tokens[i + 3] || "")) {
      parsed.priceMin = amount;
      parsed.priceMax = money(tokens[i + 3])!;
      used.add(i);
      used.add(i + 1);
      used.add(i + 2);
      used.add(i + 3);
      i += 3;
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    if (used.has(i) || used.has(i + 1)) continue;
    const pair = `${tokens[i]} ${tokens[i + 1]}`;
    if (pair === "hang moi") {
      parsed.isNew = true;
      used.add(i);
      used.add(i + 1);
    } else if (pair === "dang giam" || pair === "giam gia") {
      parsed.onSale = true;
      used.add(i);
      used.add(i + 1);
    }
  }

  const colors: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i)) continue;
    if (tokens[i] === "sale") {
      parsed.onSale = true;
      used.add(i);
      continue;
    }
    if (SIZES[tokens[i]]) {
      parsed.size = SIZES[tokens[i]];
      used.add(i);
      continue;
    }
    if (parsed.category && (tokens[i] === "nam" || tokens[i] === "nu")) {
      parsed.gender = tokens[i] === "nam" ? "MALE" : "FEMALE";
      used.add(i);
      continue;
    }
    if (COLORS.has(tokens[i]) && !AMBIGUOUS.has(tokens[i])) colors.push(i);
  }
  if (colors.length === 1) {
    parsed.color = tokens[colors[0]];
    used.add(colors[0]);
  }

  parsed.keywords = tokens.filter((_, index) => !used.has(index));
  return parsed;
}

export function searchPath(raw: string, parsed: ParsedSearch) {
  const params = new URLSearchParams();
  const q = clipQuery(raw);
  if (q) params.set("q", q);
  if (parsed.category) params.set("category", parsed.category);
  if (parsed.color) params.set("color", parsed.color);
  if (parsed.size) params.set("size", parsed.size);
  if (parsed.priceMin != null) params.set("priceMin", String(parsed.priceMin));
  if (parsed.priceMax != null) params.set("priceMax", String(parsed.priceMax));
  if (parsed.gender) params.set("gender", parsed.gender);
  if (parsed.isNew) params.set("new", "1");
  if (parsed.onSale) params.set("sale", "1");
  const query = params.toString();
  return query ? `/san-pham?${query}` : "/san-pham";
}

export function suggestionPhrase(parsed: ParsedSearch) {
  const parts = [
    parsed.categoryLabel,
    parsed.gender === "MALE" ? "nam" : parsed.gender === "FEMALE" ? "nữ" : "",
    parsed.color,
    parsed.priceMax != null && parsed.priceMin == null ? `dưới ${Math.round(parsed.priceMax / 1000)}k` : "",
    parsed.priceMin != null && parsed.priceMax != null ? `${Math.round(parsed.priceMin / 1000)}-${Math.round(parsed.priceMax / 1000)}k` : "",
    parsed.isNew ? "hàng mới" : "",
    parsed.onSale ? "đang giảm" : "",
  ].filter(Boolean);
  return parts.join(" ");
}
