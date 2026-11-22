import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { addToCart } from "@/lib/cart-service";
import { parseCsv, parseSpreadsheet, validateCatalogSheet } from "@/lib/catalog-import";
import { commitCatalogImport } from "@/lib/catalog-import-commit";
import { planDemoRemoval } from "@/lib/demo-catalog-removal";
import { cleanDb, resetTestDb } from "./helpers";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const header =
  "slug,name,category_slug,category_name,gender,description,material,color,color_hex,size,sku,price,compare_at,cost_price,stock,image_file,sale_status";

function csv(...lines: string[]) {
  return parseCsv([header, ...lines].join("\n"));
}

const prisma = new PrismaClient();
let mediaDir = "";

beforeAll(async () => {
  mediaDir = await mkdtemp(path.join(tmpdir(), "ptt-media-"));
  process.env.MEDIA_DIR = mediaDir;
  resetTestDb();
});

beforeEach(async () => {
  await cleanDb(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
  await rm(mediaDir, { recursive: true, force: true });
});

describe("catalog import", () => {
  it("reports each bad row and rejects remote images", () => {
    const grid = csv(
      "demo-ao,Ao demo,demo-ao,Ao,nam,,cotton,Den,#111111,M,DEMO-AO-M,100000,, ,2,https://images.example/a.jpg,SELLING",
      "demo-ao,Ao demo,demo-ao,Ao,nam,,cotton,Den,#111111,M,DEMO-AO-M,100000,,,1,a.png,SELLING",
    );
    const result = validateCatalogSheet(grid, { mode: "demo", fileNames: new Set(["a.png"]) });
    expect(result.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(["image_file", "sku"]));
    expect(result.issues.some((issue) => issue.message.includes("link"))).toBe(true);
  });

  it("groups variants and reads xlsx", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      header.split(","),
      ["demo-ao", "Ao demo", "demo-ao", "Ao", "nam", "", "", "Den", "#111111", "M", "DEMO-AO-M", "100000", "150000", "", "2", "a.png", "SELLING"],
      ["demo-ao", "Ao demo", "demo-ao", "Ao", "nam", "", "", "Den", "#111111", "L", "DEMO-AO-L", "100000", "", "", "0", "a.png", "SELLING"],
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Hang");
    const bytes = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const grid = parseSpreadsheet({ name: "hang.xlsx", bytes });
    const result = validateCatalogSheet(grid, { mode: "demo", fileNames: new Set(["a.png"]) });
    expect(result.issues).toEqual([]);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].variants.map((v) => v.stock)).toEqual([2, 0]);
    expect(result.products[0].variants[0].compareAt).toBe(150000);
    expect(result.products[0].variants[0].costPrice).toBeNull();
  });

  it("saves a new demo product and refuses to overwrite an existing one", async () => {
    await prisma.product.create({
      data: {
        name: "Ao thun cu",
        slug: "ao-thun-oversize",
        variants: { create: { sku: "VIZ-1", color: "Den", colorHex: "#000000", size: "M", price: 1000, stock: 3 } },
      },
    });
    const grid = csv(
      "demo-ao,Ao demo,demo-ao,Ao demo,nam,,cotton,Den,#111111,M,DEMO-AO-M,120000,180000,,1,a.png,SELLING",
      "demo-ao,Ao demo,demo-ao,Ao demo,nam,,cotton,Den,#111111,L,DEMO-AO-L,120000,,,0,a.png,SELLING",
    );
    const sheet = validateCatalogSheet(grid, { mode: "demo", fileNames: new Set(["a.png"]) });
    const files = new Map([["a.png", { name: "a.png", bytes: png, mime: "image/png" }]]);
    const saved = await commitCatalogImport(prisma, { mode: "demo", products: sheet.products, issues: sheet.issues, files });
    expect("created" in saved && saved.created.map((row) => row.slug)).toEqual(["demo-ao"]);
    const product = await prisma.product.findUnique({
      where: { slug: "demo-ao" },
      include: { variants: true, images: true, category: true },
    });
    expect(product?.category?.slug).toBe("demo-ao");
    expect(product?.images[0].url.startsWith("/media/catalog/")).toBe(true);
    expect(product?.variants.find((v) => v.sku === "DEMO-AO-L")?.stock).toBe(0);
    expect(product?.variants.find((v) => v.sku === "DEMO-AO-M")?.costPrice).toBeNull();
    const old = await prisma.product.findUnique({ where: { slug: "ao-thun-oversize" } });
    expect(old?.name).toBe("Ao thun cu");

    const again = await commitCatalogImport(prisma, { mode: "demo", products: sheet.products, issues: sheet.issues, files });
    expect("issues" in again).toBe(true);

    const out = product?.variants.find((v) => v.sku === "DEMO-AO-L");
    await expect(addToCart({ sessionId: "s1", variantId: out!.id, quantity: 1 })).rejects.toThrow(/hết hàng/);
  });
});

describe("demo removal plan", () => {
  it("deletes only a pure demo product and blocks everything else", () => {
    expect(
      planDemoRemoval({ slug: "demo-ao", skus: ["DEMO-AO-M"], orderNotes: [], orderIds: [], orderHasForeignItem: false }).action,
    ).toBe("delete");
    expect(
      planDemoRemoval({ slug: "ao-thun-oversize", skus: ["VIZ-1"], orderNotes: [], orderIds: [], orderHasForeignItem: false }).action,
    ).toBe("skip");
    expect(
      planDemoRemoval({ slug: "demo-ao", skus: ["DEMO-AO-M"], orderNotes: ["giao that"], orderIds: ["o1"], orderHasForeignItem: false }).action,
    ).toBe("blocked");
  });
});
