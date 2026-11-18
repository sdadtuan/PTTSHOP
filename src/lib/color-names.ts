/**
 * Vietnamese + English fashion colour names → hex.
 * - Case/diacritics-insensitive ("Xanh Rêu" = "xanh reu" = "XANH RÊU").
 * - Full phrase first, then base colour + modifier (nhạt/đậm/sáng/tối/pastel/neon…).
 * - All CSS named colours, plus direct hex ("#A0522D", "A0522D", "#abc").
 * - Several colours in one field are split on / , ; | + & - "và" "and".
 * Unknown names return null — callers must warn, never fall back to black.
 */

export const LEGACY_DEFAULT_HEX = "#111111";

export function normalizeColorName(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[_.\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** CSS Color Module Level 4 named colours (148). */
const CSS: Record<string, string> = {
  aliceblue: "#F0F8FF", antiquewhite: "#FAEBD7", aqua: "#00FFFF", aquamarine: "#7FFFD4", azure: "#F0FFFF",
  beige: "#F5F5DC", bisque: "#FFE4C4", black: "#000000", blanchedalmond: "#FFEBCD", blue: "#0000FF",
  blueviolet: "#8A2BE2", brown: "#A52A2A", burlywood: "#DEB887", cadetblue: "#5F9EA0", chartreuse: "#7FFF00",
  chocolate: "#D2691E", coral: "#FF7F50", cornflowerblue: "#6495ED", cornsilk: "#FFF8DC", crimson: "#DC143C",
  cyan: "#00FFFF", darkblue: "#00008B", darkcyan: "#008B8B", darkgoldenrod: "#B8860B", darkgray: "#A9A9A9",
  darkgreen: "#006400", darkgrey: "#A9A9A9", darkkhaki: "#BDB76B", darkmagenta: "#8B008B", darkolivegreen: "#556B2F",
  darkorange: "#FF8C00", darkorchid: "#9932CC", darkred: "#8B0000", darksalmon: "#E9967A", darkseagreen: "#8FBC8F",
  darkslateblue: "#483D8B", darkslategray: "#2F4F4F", darkslategrey: "#2F4F4F", darkturquoise: "#00CED1",
  darkviolet: "#9400D3", deeppink: "#FF1493", deepskyblue: "#00BFFF", dimgray: "#696969", dimgrey: "#696969",
  dodgerblue: "#1E90FF", firebrick: "#B22222", floralwhite: "#FFFAF0", forestgreen: "#228B22", fuchsia: "#FF00FF",
  gainsboro: "#DCDCDC", ghostwhite: "#F8F8FF", gold: "#FFD700", goldenrod: "#DAA520", gray: "#808080",
  green: "#008000", greenyellow: "#ADFF2F", grey: "#808080", honeydew: "#F0FFF0", hotpink: "#FF69B4",
  indianred: "#CD5C5C", indigo: "#4B0082", ivory: "#FFFFF0", khaki: "#F0E68C", lavender: "#E6E6FA",
  lavenderblush: "#FFF0F5", lawngreen: "#7CFC00", lemonchiffon: "#FFFACD", lightblue: "#ADD8E6", lightcoral: "#F08080",
  lightcyan: "#E0FFFF", lightgoldenrodyellow: "#FAFAD2", lightgray: "#D3D3D3", lightgreen: "#90EE90", lightgrey: "#D3D3D3",
  lightpink: "#FFB6C1", lightsalmon: "#FFA07A", lightseagreen: "#20B2AA", lightskyblue: "#87CEFA", lightslategray: "#778899",
  lightslategrey: "#778899", lightsteelblue: "#B0C4DE", lightyellow: "#FFFFE0", lime: "#00FF00", limegreen: "#32CD32",
  linen: "#FAF0E6", magenta: "#FF00FF", maroon: "#800000", mediumaquamarine: "#66CDAA", mediumblue: "#0000CD",
  mediumorchid: "#BA55D3", mediumpurple: "#9370DB", mediumseagreen: "#3CB371", mediumslateblue: "#7B68EE",
  mediumspringgreen: "#00FA9A", mediumturquoise: "#48D1CC", mediumvioletred: "#C71585", midnightblue: "#191970",
  mintcream: "#F5FFFA", mistyrose: "#FFE4E1", moccasin: "#FFE4B5", navajowhite: "#FFDEAD", navy: "#000080",
  oldlace: "#FDF5E6", olive: "#808000", olivedrab: "#6B8E23", orange: "#FFA500", orangered: "#FF4500",
  orchid: "#DA70D6", palegoldenrod: "#EEE8AA", palegreen: "#98FB98", paleturquoise: "#AFEEEE", palevioletred: "#DB7093",
  papayawhip: "#FFEFD5", peachpuff: "#FFDAB9", peru: "#CD853F", pink: "#FFC0CB", plum: "#DDA0DD",
  powderblue: "#B0E0E6", purple: "#800080", rebeccapurple: "#663399", red: "#FF0000", rosybrown: "#BC8F8F",
  royalblue: "#4169E1", saddlebrown: "#8B4513", salmon: "#FA8072", sandybrown: "#F4A460", seagreen: "#2E8B57",
  seashell: "#FFF5EE", sienna: "#A0522D", silver: "#C0C0C0", skyblue: "#87CEEB", slateblue: "#6A5ACD",
  slategray: "#708090", slategrey: "#708090", snow: "#FFFAFA", springgreen: "#00FF7F", steelblue: "#4682B4",
  tan: "#D2B48C", teal: "#008080", thistle: "#D8BFD8", tomato: "#FF6347", turquoise: "#40E0D0",
  violet: "#EE82EE", wheat: "#F5DEB3", white: "#FFFFFF", whitesmoke: "#F5F5F5", yellow: "#FFFF00",
  yellowgreen: "#9ACD32",
};

/** Fashion palette (keys are normalized: no diacritics, lower-case, single spaces). */
const FASHION: Record<string, string> = {
  // trắng / đen / xám
  trang: "#FFFFFF", "trang tinh": "#FFFFFF", "trang kem": "#F8F4E6", "trang nga": "#FFFDF0", "trang sua": "#FAF7EF",
  "trang xam": "#E6E6E6", "off white": "#F5F2EA", offwhite: "#F5F2EA",
  den: "#111111", "den tuyen": "#0A0A0A", "den nhung": "#151515", "den bong": "#1A1A1A", "jet black": "#0A0A0A",
  xam: "#8A8A8A", ghi: "#9E9E9E", "ghi xam": "#9E9E9E", "xam ghi": "#9E9E9E", "xam tro": "#B2BEB5", tro: "#B2BEB5",
  "xam chi": "#4A4A4A", chi: "#4A4A4A", "xam khoi": "#6E6E6E", "xam long chuot": "#9A9A9A", "xam bac": "#C0C0C0",
  "xam xanh": "#7A8B99", "xam muoi tieu": "#9B9B9B", "xam melange": "#A7A7A7", melange: "#A7A7A7", charcoal: "#36454F",
  bac: "#C0C0C0", "mau bac": "#C0C0C0", "bach kim": "#E5E4E2", platinum: "#E5E4E2", graphite: "#383838",
  // be / kem / nâu
  be: "#D9C7A7", "be sua": "#E8DCC6", "be dam": "#C2A878", "be nhat": "#EDE3D1", "be hong": "#E8C9B5", nude: "#E3BC9A",
  kem: "#E8DCC8", "kem sua": "#F1E8D8", "kem dam": "#D8C7A8", cream: "#FFFDD0", "mau kem": "#E8DCC8",
  sua: "#F3EBDD", "mau sua": "#F3EBDD", "ca phe sua": "#A67B5B", "nau sua": "#A67B5B", latte: "#C5A582", mocha: "#6F4E37",
  nau: "#6B4423", "nau tay": "#A47551", "nau socola": "#4E2A1E", socola: "#4E2A1E", "nau chocolate": "#4E2A1E",
  "nau dat": "#8B5A2B", "nau do": "#7B3F2A", "nau ca phe": "#6F4E37", "ca phe": "#6F4E37", coffee: "#6F4E37",
  "nau vang": "#B5835A", "nau bo": "#8B5E3C", "nau go": "#966F33", "nau hat de": "#8E5B3E", "hat de": "#8E5B3E",
  "nau cam": "#B5651D", "nau camel": "#C19A6B", camel: "#C19A6B", "nau caramel": "#AF6E4D", caramel: "#AF6E4D",
  bo: "#4A6A8F", denim: "#4A6A8F", jean: "#4A6A8F", jeans: "#4A6A8F", "xanh jean": "#4A6A8F", "xanh bo": "#4A6A8F",
  khaki: "#C3B091", kaki: "#C3B091", "be kaki": "#C3B091", "xanh kaki": "#8A8B5C", "reu kaki": "#8A8B5C", taupe: "#8B7D6B",
  cognac: "#9A463D", rust: "#B7410E", "gi set": "#B7410E", terracotta: "#E2725B", "dat nung": "#E2725B",
  // xanh dương / navy
  xanh: "#2563EB", "xanh duong": "#1E5AA8", "xanh da troi": "#87CEEB", "xanh troi": "#87CEEB", "xanh bien": "#1D4E89",
  "xanh nuoc bien": "#1D4E89", "xanh lam": "#2B6CB0", "xanh coban": "#0047AB", cobalt: "#0047AB", "xanh hoang gia": "#4169E1",
  "xanh navy": "#1B2A4A", "xanh than": "#1B2A4A", "xanh tim than": "#1F2A44", "xanh den": "#1C2533", "xanh dam": "#1E3A5F",
  "xanh baby": "#A7C7E7", "xanh pastel": "#AEC6CF", "xanh nhat": "#ADD8E6", "xanh sky": "#87CEEB", "sky blue": "#87CEEB",
  "baby blue": "#A7C7E7", "xanh bang": "#A5D8E6", "xanh khoi": "#7393B3", "xanh xam": "#6D8299", "xanh dien": "#0066FF",
  // xanh lá / rêu / mint / ngọc
  "xanh la": "#2E8B57", "xanh la cay": "#228B22", "xanh luc": "#2E8B57", "xanh la dam": "#1F5E3A", "xanh la nhat": "#9ACD32",
  "xanh reu": "#4B5D3A", reu: "#4B5D3A", "xanh quan doi": "#4B5320", "army green": "#4B5320", "xanh oliu": "#708238",
  "xanh olive": "#708238", oliu: "#708238", "xanh chuoi": "#B5D334", "xanh non chuoi": "#B5D334", "xanh co": "#7CB342",
  "xanh mint": "#98D8C8", mint: "#98D8C8", "xanh bac ha": "#98D8C8", "bac ha": "#98D8C8",
  "xanh ngoc": "#2BB5A0", "ngoc": "#2BB5A0", "xanh ngoc bich": "#00A86B", "ngoc bich": "#00A86B", jade: "#00A86B",
  emerald: "#50C878", "xanh luc bao": "#50C878", "luc bao": "#50C878", "xanh co vit": "#00827F", "co vit": "#00827F",
  "xanh teal": "#008080", "xanh sage": "#9CAF88", sage: "#9CAF88", "xanh xa cu": "#9CAF88", "xanh vit": "#00827F",
  "xanh neon": "#39FF14", "xanh chanh": "#BFFF00", "xanh la ma": "#32CD32", "xanh thien thanh": "#4FC3F7",
  // đỏ / hồng / tím
  do: "#D32F2F", "do tuoi": "#E53935", "do do": "#7B1E26", "do ruou": "#722F37", "do ruou vang": "#722F37", "ruou vang": "#722F37",
  "do man": "#800020", burgundy: "#800020", wine: "#722F37", "do gach": "#B5532A", gach: "#B5532A",
  "do cam": "#E2583E", "do son": "#C21E56", "do dau": "#C8102E", "do cherry": "#990F2F", cherry: "#990F2F", "do tham": "#8B0000",
  "do dam": "#8B0000", "do nhat": "#F28B82", "do san ho": "#FF7F50", "san ho": "#FF7F50", "do neon": "#FF3131",
  hong: "#F4A6B8", "hong pastel": "#F8C8D4", "hong phan": "#F7CAC9", "hong baby": "#F4C2C2", "hong nhat": "#FADADD",
  "hong dam": "#E75480", "hong canh sen": "#E75480", "hong sen": "#E75480", "hong dat": "#C08081", "hong ruoc": "#F88379",
  "hong dao": "#FFB7C5", "hong cam": "#F9A07A", "hong tim": "#C154C1", "hong neon": "#FF6EC7", "hong sua": "#F3D1D1",
  "hong kho": "#C9A9A6", "dusty pink": "#D8A7A7", "hot pink": "#FF69B4", fuschia: "#FF00FF", "hong fuchsia": "#FF00FF",
  tim: "#7B3FA0", "tim than": "#4B2E59", "tim dam": "#4B2E59", "tim nhat": "#C9A0DC", "tim pastel": "#CBC3E3",
  "tim lavender": "#B497D6", "tim oai huong": "#B497D6", "oai huong": "#B497D6", "tim mong cut": "#4E1F4F",
  "tim ca": "#614051", "tim hoa ca": "#614051", "tim moc mien": "#B784A7", lilac: "#C8A2C8", mauve: "#E0B0FF",
  // vàng / cam
  vang: "#F2C200", "vang nhat": "#F3E5AB", "vang chanh": "#FFF44F", "vang bo": "#F3E5AB", "vang dam": "#D4A017",
  "vang mustard": "#D4A017", mustard: "#E1AD01", "mu tat": "#E1AD01", "vang mu tat": "#E1AD01", "vang gold": "#D4AF37",
  "vang kim": "#D4AF37", "vang dong": "#B5A642", "vang dat": "#C9A227", "vang nghe": "#E3A21A", "vang pastel": "#FDFD96",
  "vang neon": "#FFFF33", "vang cat": "#E2CA76", "vang kem": "#F3E5AB", "nhu": "#D4AF37",
  cam: "#F57C00", "cam dat": "#C8572B", "cam dao": "#FFB07C", "cam nhat": "#FFC48C", "cam dam": "#CC5500",
  "cam chay": "#CC5500", "cam neon": "#FF5F1F", "cam san ho": "#FF7F50", "cam pastel": "#FFD1A9", peach: "#FFDAB9",
  dao: "#FFDAB9", "mau dao": "#FFDAB9", apricot: "#FBCEB1", "mo": "#FBCEB1",
  // khác
  navy: "#1B2A4A", "navy blue": "#1B2A4A", "olive green": "#708238",
  "mau den": "#111111", "mau trang": "#FFFFFF", "da bo": "#8B5A2B", "da": "#E3BC9A", "mau da": "#E3BC9A", "phoi mau": "",
};

const BASE: Record<string, string> = Object.fromEntries(
  Object.entries({ ...Object.fromEntries(Object.entries(CSS)), ...FASHION }).filter(([, v]) => v),
);

/** Modifiers: [normalized words, lightness delta (-1..1), saturation boost]. */
const MODIFIERS: { words: string[]; light: number; sat?: number }[] = [
  { words: ["nhat", "light", "sang", "pastel", "phan", "lot", "baby", "pale"], light: 0.3 },
  { words: ["dam", "dark", "toi", "tham", "deep", "sam"], light: -0.3 },
  { words: ["neon", "tuoi", "chuoi", "bright", "dien"], light: 0.05, sat: 0.35 },
];

function hexToHsl(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
  }
  return `#${[r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function adjustHex(hex: string, light: number, sat = 0): string {
  const [h, s, l] = hexToHsl(hex);
  const nl = light >= 0 ? l + (1 - l) * light : l * (1 + light);
  return hslToHex(h, Math.min(1, s + (1 - s) * sat), Math.max(0, Math.min(1, nl)));
}

/** "#A0522D" / "A0522D" / "#abc" → "#A0522D". */
export function parseHexName(name: string): string | null {
  const t = name.trim().replace(/^mau\s+/i, "");
  const m = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(t) || /^([0-9a-f]{6})$/i.exec(t);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return `#${h.toUpperCase()}`;
}

const stripPrefix = (s: string) => s.replace(/^(mau|color|colour)\s+/, "").trim();

/**
 * Resolve ONE colour name to hex. Order: direct hex → exact phrase (VN/EN/CSS,
 * also with spaces removed for CSS like "light blue") → base colour + modifier
 * (lightness/saturation adjusted) → longest known phrase inside the name.
 */
export function colorNameToHex(name: string): string | null {
  if (!name) return null;
  const hex = parseHexName(normalizeColorName(name));
  if (hex) return hex;
  const n = stripPrefix(normalizeColorName(name));
  if (!n) return null;
  if (BASE[n]) return BASE[n].toUpperCase();
  const compact = n.replace(/[\s-]+/g, "");
  if (CSS[compact]) return CSS[compact];

  // base + modifier (modifier may be before or after: "xanh dương nhạt", "light pink", "đậm nâu")
  const words = n.split(" ");
  for (const mod of MODIFIERS) {
    const idx = words.findIndex((w) => mod.words.includes(w));
    if (idx === -1) continue;
    const rest = [...words.slice(0, idx), ...words.slice(idx + 1)].join(" ").trim();
    const base = rest && (BASE[rest] || CSS[rest.replace(/\s+/g, "")] || colorNameToHex(rest));
    if (base) return adjustHex(base, mod.light, mod.sat ?? 0);
  }

  // longest known phrase contained in the name ("áo xanh rêu đậm chất" → xanh rêu)
  let best: string | null = null;
  for (let len = words.length - 1; len >= 1 && !best; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      const phrase = words.slice(i, i + len).join(" ");
      if (BASE[phrase]) {
        best = BASE[phrase];
        break;
      }
    }
  }
  return best ? best.toUpperCase() : null;
}

/** Number of distinct entries in the dictionary (for docs/tests). */
export const COLOR_DICTIONARY_SIZE = Object.keys(BASE).length;

const SPLIT_RE = /\s*(?:[\/,;|+&]|\s-\s|-(?=\S)|\s(?:va|và|and|voi|với)\s)\s*/i;

/**
 * Split a field that holds several colours ("trắng/nâu/xám/xanh", "Đen và Kem").
 * Hyphens inside a known single name ("off-white") are kept. No limit on count.
 */
export function splitColorNames(input: string): string[] {
  const raw = (input || "").trim();
  if (!raw) return [];
  if (colorNameToHex(raw) && !/[\/,;|+&]/.test(raw) && !/\s(va|và|and|voi|với)\s/i.test(raw) && BASE[normalizeColorName(raw)]) {
    return [raw];
  }
  const parts = raw
    .split(new RegExp(SPLIT_RE.source, "gi"))
    .map((p) => p.trim())
    .filter(Boolean);
  // re-join hyphenated pieces that form a known name, e.g. "off-white"
  const out: string[] = [];
  for (const p of parts) {
    const prev = out[out.length - 1];
    if (prev && raw.includes(`${prev}-${p}`) && BASE[normalizeColorName(`${prev} ${p}`)]) {
      out[out.length - 1] = `${prev}-${p}`;
    } else out.push(p);
  }
  const seen = new Set<string>();
  return out.filter((p) => {
    const k = normalizeColorName(p);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const isMultiColorName = (name: string) => splitColorNames(name).length > 1;

/** "trắng" → "Trắng" (keeps the user's words). */
export function prettyColorName(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.charAt(0).toLocaleUpperCase("vi") + t.slice(1);
}

const isBlackHex = (hex: string) => {
  const [, , l] = hexToHsl(hex);
  return l < 0.12;
};

/**
 * Swatch colours to show for a variant. The stored hex wins unless it is missing
 * or the old default #111111 on a name that isn't black — then resolve from the
 * name. Multi-colour names give several stops (rendered as a split dot).
 * Unresolvable names → null (render a neutral "?" dot, never black).
 */
export function resolveSwatch(name: string, storedHex?: string | null): { hex: string | null; stops: string[] } {
  const stored = parseHexName(storedHex || "");
  const parts = splitColorNames(name);
  const resolved = parts.map((p) => colorNameToHex(p)).filter((h): h is string => Boolean(h));
  const nameIsBlack = resolved.length > 0 && resolved.every(isBlackHex);
  const legacy = !stored || (stored === LEGACY_DEFAULT_HEX && !nameIsBlack);
  if (!legacy) return { hex: stored, stops: [stored!] };
  if (resolved.length) return { hex: resolved[0], stops: resolved };
  return { hex: null, stops: [] };
}

export function swatchBackground(stops: string[]): string {
  if (!stops.length) return "repeating-linear-gradient(45deg,#e5e5e5 0 4px,#f5f5f5 4px 8px)";
  if (stops.length === 1) return stops[0];
  const step = 360 / stops.length;
  return `conic-gradient(${stops.map((c, i) => `${c} ${i * step}deg ${(i + 1) * step}deg`).join(", ")})`;
}
