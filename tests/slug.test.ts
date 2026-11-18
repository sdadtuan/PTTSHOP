import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";
import { isValidSlug, slugify, uniqueSlug, uniqueSlugSync, SLUG_FALLBACK, SLUG_MAX_LENGTH } from "@/lib/slug";
import { resolveProductSlug, saveProductFull } from "@/lib/product-save";

const CASES: [string, string][] = [
  // Vietnamese, every tone + đ
  ["Áo Thun Đen Basic", "ao-thun-den-basic"],
  ["Quần Jean Ống Rộng", "quan-jean-ong-rong"],
  ["ĐẦM DỰ TIỆC CAO CẤP", "dam-du-tiec-cao-cap"],
  ["Váy Đầm Hè Nữ", "vay-dam-he-nu"],
  ["Áo Sơ Mi Trắng Tay Dài", "ao-so-mi-trang-tay-dai"],
  ["Giày Thể Thao Nữ Đế Bằng", "giay-the-thao-nu-de-bang"],
  ["Mũ Lưỡi Trai Đỏ", "mu-luoi-trai-do"],
  ["Túi Xách Da Bò Thật", "tui-xach-da-bo-that"],
  ["Ổ Khóa Ưu Đãi", "o-khoa-uu-dai"],
  ["đĐ đỏ ĐEN", "dd-do-den"],
  ["áàảãạ ăắằẳẵặ âấầẩẫậ", "aaaaa-aaaaaa-aaaaaa"],
  ["éèẻẽẹ êếềểễệ íìỉĩị", "eeeee-eeeeee-iiiii"],
  ["óòỏõọ ôốồổỗộ ơớờởỡợ", "ooooo-oooooo-oooooo"],
  ["úùủũụ ưứừửữự ýỳỷỹỵ", "uuuuu-uuuuuu-yyyyy"],
  ["ÁÀẢÃẠ ĂẮẰẲẴẶ ÂẤẦẨẪẬ Ơ Ư Ô Ê", "aaaaa-aaaaaa-aaaaaa-o-u-o-e"],
  // Decomposed (NFD) input, e.g. pasted from macOS
  ["A\u0301o thu\u0303n", "ao-thun"],
  // numbers + English
  ["Hoodie Oversize 2026", "hoodie-oversize-2026"],
  ["T-Shirt Basic V2.0", "t-shirt-basic-v2-0"],
  ["Nike Air Force 1 '07", "nike-air-force-1-07"],
  ["100% Cotton Tee", "100-cotton-tee"],
  ["Size XL/XXL", "size-xl-xxl"],
  ["2 in 1 Jacket", "2-in-1-jacket"],
  // special characters
  ["Hoodie & Jogger Set", "hoodie-jogger-set"],
  ["Áo khoác (Limited) #1 @VIZFAS", "ao-khoac-limited-1-vizfas"],
  ["Quần \"Cargo\" 'Túi Hộp'", "quan-cargo-tui-hop"],
  ["Sale 50% + Free ship", "sale-50-free-ship"],
  ["Áo/Quần/Váy", "ao-quan-vay"],
  ["a_b.c,d;e:f!g?h*i", "a-b-c-d-e-f-g-h-i"],
  ["Set 3 món: áo + quần + nón", "set-3-mon-ao-quan-non"],
  ["<script>alert(1)</script>", "script-alert-1-script"],
  // emoji / other scripts mixed in
  ["Áo 🔥 Hot 🔥", "ao-hot"],
  ["❤️ Love Tee ❤️", "love-tee"],
  ["Áo Платье 2026", "ao-2026"],
  ["Café Crème Señor Straße", "cafe-creme-senor-strasse"],
  ["Øre Æble Łódź", "ore-aeble-lodz"],
  // spacing / dashes
  ["   Áo    khoác   gió   ", "ao-khoac-gio"],
  ["--Áo---khoác--", "ao-khoac"],
  ["\tÁo\nthun\r\n", "ao-thun"],
  ["!!!Áo thun!!!", "ao-thun"],
  ["Áo – thun — nam", "ao-thun-nam"],
  ["ao-thun-den", "ao-thun-den"],
  ["AO-THUN-DEN", "ao-thun-den"],
];

describe("slugify", () => {
  it.each(CASES)("%s → %s", (name, slug) => {
    expect(slugify(name)).toBe(slug);
    expect(isValidSlug(slugify(name))).toBe(true);
  });

  it("only symbols / emoji / empty → fallback", () => {
    for (const n of ["", "   ", "!!!", "🔥🔥🔥", "---", "Платье", "日本語", null, undefined]) {
      expect(slugify(n)).toBe(SLUG_FALLBACK);
    }
    expect(slugify("🔥", { fallback: "" })).toBe("");
  });

  it("very long names are capped on a word boundary and stay valid", () => {
    const long = "Áo thun nam nữ unisex form rộng chất cotton cao cấp phong cách Hàn Quốc trẻ trung năng động 2026 mới nhất";
    const s = slugify(long);
    expect(s.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(isValidSlug(s)).toBe(true);
    expect(long.length).toBeGreaterThan(80);
    expect(slugify(long).startsWith("ao-thun-nam-nu-unisex")).toBe(true);
    expect(slugify("a".repeat(200))).toBe("a".repeat(SLUG_MAX_LENGTH));
  });

  it("is idempotent", () => {
    for (const [name] of CASES) expect(slugify(slugify(name))).toBe(slugify(name));
  });

  it("live typing keeps one trailing dash", () => {
    expect(slugify("ao ", { keepTrailingDash: true, fallback: "" })).toBe("ao-");
    expect(slugify("Áo  Thun--", { keepTrailingDash: true, fallback: "" })).toBe("ao-thun-");
    expect(slugify("--", { keepTrailingDash: true, fallback: "" })).toBe("");
  });
});

describe("uniqueSlug", () => {
  it("adds -2, -3 … for duplicates", () => {
    expect(uniqueSlugSync("ao", new Set())).toBe("ao");
    expect(uniqueSlugSync("ao", new Set(["ao"]))).toBe("ao-2");
    expect(uniqueSlugSync("ao", new Set(["ao", "ao-2", "ao-3"]))).toBe("ao-4");
  });
  it("suffix never exceeds the max length", () => {
    const base = slugify("x".repeat(200));
    const s = uniqueSlugSync(base, new Set([base]));
    expect(s.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(s.endsWith("-2")).toBe(true);
  });
  it("async variant", async () => {
    const taken = new Set(["vay", "vay-2"]);
    expect(await uniqueSlug("vay", async (s) => taken.has(s))).toBe("vay-3");
  });
});

describe("product slug on save (DB)", () => {
  const prisma = new PrismaClient();
  const payload = (over: Record<string, unknown> = {}) => ({
    name: "TEST Áo Slug Tự Động",
    gender: "UNISEX",
    media: [{ url: "/uploads/t1.jpg", type: "image" }],
    variants: [{ color: "Đen", colorHex: "#111111", size: "M", price: 300000, stock: 1 }],
    ...over,
  });

  beforeAll(() => resetTestDb());
  beforeEach(async () => {
    await cleanDb(prisma);
    await seedMinimal(prisma);
  });
  afterAll(async () => prisma.$disconnect());

  const slugOf = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id } })).slug;

  it("empty slug → generated from the name", async () => {
    const { productId } = await saveProductFull(prisma, payload({ slug: "" }));
    expect(await slugOf(productId)).toBe("test-ao-slug-tu-dong");
    const { productId: p2 } = await saveProductFull(prisma, payload({ name: "TEST Quần Jean 2026", slug: undefined }));
    expect(await slugOf(p2)).toBe("test-quan-jean-2026");
  });

  it("invalid manual slug is normalised", async () => {
    const { productId } = await saveProductFull(prisma, payload({ slug: "  Áo Thun ĐEN!! " }));
    expect(await slugOf(productId)).toBe("ao-thun-den");
  });

  it("same name twice → -2, -3", async () => {
    const a = await saveProductFull(prisma, payload({ slug: "" }));
    const b = await saveProductFull(prisma, payload({ slug: "" }));
    const c = await saveProductFull(prisma, payload({ slug: "test-ao-slug-tu-dong" }));
    expect([await slugOf(a.productId), await slugOf(b.productId), await slugOf(c.productId)]).toEqual([
      "test-ao-slug-tu-dong",
      "test-ao-slug-tu-dong-2",
      "test-ao-slug-tu-dong-3",
    ]);
  });

  it("editing keeps the stored slug (even a legacy one) and never collides with itself", async () => {
    const { productId } = await saveProductFull(prisma, payload({ slug: "" }));
    // rename only → slug unchanged
    await saveProductFull(prisma, payload({ id: productId, name: "TEST Tên Mới Hoàn Toàn", slug: "test-ao-slug-tu-dong" }));
    expect(await slugOf(productId)).toBe("test-ao-slug-tu-dong");
    // legacy slug not matching today's rules is kept as-is when unchanged
    await prisma.product.update({ where: { id: productId }, data: { slug: "Legacy_Slug" } });
    await saveProductFull(prisma, payload({ id: productId, slug: "Legacy_Slug" }));
    expect(await slugOf(productId)).toBe("Legacy_Slug");
    // changing it to another product's slug → suffixed, the other product untouched
    await saveProductFull(prisma, payload({ id: productId, slug: "test-tee" }));
    expect(await slugOf(productId)).toBe("test-tee-2");
    expect(await prisma.product.count({ where: { slug: "test-tee" } })).toBe(1);
  });

  it("resolveProductSlug excludes the product itself", async () => {
    const tee = await prisma.product.findUniqueOrThrow({ where: { slug: "test-tee" } });
    expect(await resolveProductSlug(prisma, { id: tee.id, slug: "test-tee", name: "x" })).toBe("test-tee");
    expect(await resolveProductSlug(prisma, { id: tee.id, slug: "", name: "Test Tee" })).toBe("test-tee");
    expect(await resolveProductSlug(prisma, { slug: "", name: "Test Tee" })).toBe("test-tee-2");
  });
});
