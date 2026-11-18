import { describe, expect, it } from "vitest";
import {
  adjustHex,
  COLOR_DICTIONARY_SIZE,
  colorNameToHex,
  normalizeColorName,
  parseHexName,
  resolveSwatch,
  splitColorNames,
  swatchBackground,
} from "@/lib/color-names";
import { colorsFromApi, splitColorEntry, type EditorColor } from "@/components/admin/product-editor/editor-state";

const lightness = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
};

describe("colour dictionary", () => {
  it("is comprehensive (VN + EN fashion + all 148 CSS names)", () => {
    expect(COLOR_DICTIONARY_SIZE).toBeGreaterThan(300);
  });

  it.each([
    ["trắng", "#FFFFFF"], ["Trắng", "#FFFFFF"], ["TRANG", "#FFFFFF"], ["đen", "#111111"], ["Den", "#111111"],
    ["nâu", "#6B4423"], ["xám", "#8A8A8A"], ["ghi", "#9E9E9E"], ["xanh", "#2563EB"], ["xanh dương", "#1E5AA8"],
    ["xanh navy", "#1B2A4A"], ["navy", "#1B2A4A"], ["xanh than", "#1B2A4A"], ["xanh rêu", "#4B5D3A"], ["Xanh Rêu", "#4B5D3A"],
    ["xanh reu", "#4B5D3A"], ["rêu", "#4B5D3A"], ["xanh lá", "#2E8B57"], ["xanh mint", "#98D8C8"], ["be", "#D9C7A7"],
    ["kem", "#E8DCC8"], ["đỏ", "#D32F2F"], ["đỏ đô", "#7B1E26"], ["hồng", "#F4A6B8"], ["tím", "#7B3FA0"],
    ["vàng", "#F2C200"], ["cam", "#F57C00"], ["bò", "#4A6A8F"], ["khaki", "#C3B091"], ["kaki", "#C3B091"],
    ["white", "#FFFFFF"], ["black", "#000000"], ["xanh ngọc", "#2BB5A0"], ["xanh cổ vịt", "#00827F"],
    ["xanh pastel", "#AEC6CF"], ["hồng đất", "#C08081"], ["hồng pastel", "#F8C8D4"], ["nâu tây", "#A47551"],
    ["nâu socola", "#4E2A1E"], ["đỏ rượu vang", "#722F37"], ["vàng mustard", "#D4A017"], ["cam đất", "#C8572B"],
    ["tím than", "#4B2E59"], ["be sữa", "#E8DCC6"], ["trắng kem", "#F8F4E6"], ["xám tro", "#B2BEB5"],
    ["xám chì", "#4A4A4A"], ["bạc", "#C0C0C0"], ["vàng gold", "#D4AF37"], ["off-white", "#F5F2EA"], ["Off White", "#F5F2EA"],
    ["màu xanh ngọc", "#2BB5A0"], ["olive", "#808000"], ["xanh olive", "#708238"],
  ])("%s → %s", (name, hex) => {
    expect(colorNameToHex(name)).toBe(hex);
  });

  it.each(["aliceblue", "rebeccapurple", "Light Blue", "light-blue", "DarkSlateGray", "papayawhip", "Sienna"])(
    "CSS name %s resolves",
    (name) => {
      expect(colorNameToHex(name)).toMatch(/^#[0-9A-F]{6}$/);
    },
  );

  it("direct hex typed as a name", () => {
    expect(colorNameToHex("#A0522D")).toBe("#A0522D");
    expect(colorNameToHex("a0522d")).toBe("#A0522D");
    expect(colorNameToHex("#abc")).toBe("#AABBCC");
    expect(parseHexName("abc")).toBeNull();
  });

  it("modifiers adjust lightness: nhạt lighter, đậm darker, also for un-listed combos", () => {
    const base = colorNameToHex("xanh dương")!;
    expect(lightness(colorNameToHex("xanh dương nhạt")!)).toBeGreaterThan(lightness(base));
    expect(lightness(colorNameToHex("xanh dương đậm")!)).toBeLessThan(lightness(base));
    expect(lightness(colorNameToHex("nâu sáng")!)).toBeGreaterThan(lightness(colorNameToHex("nâu")!));
    expect(lightness(colorNameToHex("cam tối")!)).toBeLessThan(lightness(colorNameToHex("cam")!));
    expect(colorNameToHex("dark sienna")).toMatch(/^#/);
    expect(adjustHex("#808080", 0.5)).not.toBe("#808080");
  });

  it("unknown names → null (never silently black)", () => {
    for (const n of ["abcxyz", "màu bí ẩn", "", "qwerty"]) expect(colorNameToHex(n)).toBeNull();
    expect(resolveSwatch("abcxyz", "#111111")).toEqual({ hex: null, stops: [] });
    expect(swatchBackground([])).not.toContain("#111111");
  });

  it("normalizes case and diacritics", () => {
    expect(normalizeColorName("  XANH   Dương ")).toBe("xanh duong");
    expect(normalizeColorName("Đỏ đô")).toBe("do do");
  });
});

describe("splitting several colours in one field (no limit)", () => {
  it.each([
    ["trắng/nâu/xám/xanh", ["trắng", "nâu", "xám", "xanh"]],
    ["Đen/nâu", ["Đen", "nâu"]],
    ["Đen và Kem", ["Đen", "Kem"]],
    ["đen, trắng; xám | xanh navy + đỏ - vàng & tím", ["đen", "trắng", "xám", "xanh navy", "đỏ", "vàng", "tím"]],
    ["xanh-trắng", ["xanh", "trắng"]],
    ["off-white", ["off-white"]],
    ["Xanh rêu", ["Xanh rêu"]],
    ["đen/đen/trắng", ["đen", "trắng"]],
  ])("%s", (input, parts) => {
    expect(splitColorNames(input)).toEqual(parts);
  });

  it("12 colours split fine", () => {
    const names = "trắng/đen/nâu/xám/xanh/đỏ/hồng/tím/vàng/cam/be/kem";
    expect(splitColorNames(names)).toHaveLength(12);
  });
});

describe("PDP swatch resolution", () => {
  it("old default #111111 on a non-black name resolves from the name", () => {
    expect(resolveSwatch("Trắng", "#111111").hex).toBe("#FFFFFF");
    expect(resolveSwatch("trắng/nâu/xám/xanh", "#111111").stops).toEqual(["#FFFFFF", "#6B4423", "#8A8A8A", "#2563EB"]);
    expect(resolveSwatch("Nâu", null).hex).toBe("#6B4423");
  });
  it("real black and custom hex are kept", () => {
    expect(resolveSwatch("Đen", "#111111").hex).toBe("#111111");
    expect(resolveSwatch("Đen/Kem", "#222222").hex).toBe("#222222");
    expect(resolveSwatch("Trắng", "#FAFAFA").hex).toBe("#FAFAFA");
  });
});

describe("editor split", () => {
  const c: EditorColor = {
    key: "c1",
    name: "trắng/nâu/xám/xanh",
    hex: "#111111",
    sizes: [
      { key: "v1", id: "v1", size: "S", price: 1, compareAt: null, stock: 5 },
      { key: "v2", id: "v2", size: "M", price: 2, compareAt: null, stock: 4 },
    ],
  };
  it("splits into 4 colours with own hex, divides stock, keeps ids on the first colour", () => {
    const parts = splitColorEntry(c);
    expect(parts.map((p) => p.name)).toEqual(["Trắng", "Nâu", "Xám", "Xanh"]);
    expect(parts.map((p) => p.hex)).toEqual(["#FFFFFF", "#6B4423", "#8A8A8A", "#2563EB"]);
    expect(parts[0].sizes.map((s) => s.id)).toEqual(["v1", "v2"]);
    expect(parts[1].sizes.every((s) => !s.id)).toBe(true);
    const totalS = parts.reduce((a, p) => a + p.sizes[0].stock, 0);
    const totalM = parts.reduce((a, p) => a + p.sizes[1].stock, 0);
    expect([totalS, totalM]).toEqual([5, 4]);
  });
  it("loading a legacy #111111 variant auto-resolves hex; two-tone with own hex stays combined", () => {
    const cols = colorsFromApi({
      id: "p",
      variants: [
        { id: "a", color: "Trắng", colorHex: "#111111", size: "M", price: 1, stock: 1 },
        { id: "b", color: "Đen/Kem", colorHex: "#222222", size: "M", price: 1, stock: 1 },
        { id: "c", color: "Đen", colorHex: "#111111", size: "M", price: 1, stock: 1 },
      ],
    });
    expect(cols[0]).toMatchObject({ hex: "#FFFFFF", hexManual: false });
    expect(cols[1]).toMatchObject({ hex: "#222222", keepCombined: true, hexManual: true });
    expect(cols[2]).toMatchObject({ hex: "#111111", hexManual: true });
  });
});
