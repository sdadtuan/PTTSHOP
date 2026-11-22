import { readFile, readdir, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { parseSpreadsheet, validateCatalogSheet } from "@/lib/catalog-import";
import { commitCatalogImport } from "@/lib/catalog-import-commit";
import { applyDemoRemoval, inspectDemoCatalog, planDemoRemoval } from "@/lib/demo-catalog-removal";
import { cleanDb, resetTestDb } from "./helpers";

const root = path.join(process.cwd(), "docs/demo-products");
const prisma = new PrismaClient();
let mediaDir = "";

async function demoFiles() {
  const names = (await readdir(path.join(root, "images"))).filter((name) => name.endsWith(".jpg"));
  const files = new Map<string, { name: string; bytes: Buffer; mime: string }>();
  for (const name of names) {
    files.set(name, {
      name,
      bytes: await readFile(path.join(root, "images", name)),
      mime: "image/jpeg",
    });
  }
  return files;
}

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

describe("demo catalog file", () => {
  it("rejects a negative price and a missing image before save", () => {
    const grid = parseSpreadsheet({
      name: "a.csv",
      bytes: new TextEncoder().encode(
        "sku,product_slug,product_name,category,description,size,color,price_vnd,compare_at_price_vnd,cost_vnd,stock,image_file,status\nDEMO-X-1,demo-x,Ao demo,Nam,,M,Đen,-1,,100,1,missing.jpg,active\n",
      ),
    });
    const result = validateCatalogSheet(grid, { fileNames: new Set() });
    expect(result.issues.map((issue) => issue.field).sort()).toEqual(["image_file", "price_vnd"]);
    expect(result.products).toHaveLength(0);
  });

  it("imports 15 products and 120 variants, updates on the second run, then removal leaves other products", async () => {
    const csv = await readFile(path.join(root, "demo-products.csv"));
    const xlsx = await readFile(path.join(root, "demo-products.xlsx"));
    const fromCsv = parseSpreadsheet({ name: "demo-products.csv", bytes: csv });
    const fromXlsx = parseSpreadsheet({ name: "demo-products.xlsx", bytes: xlsx });
    const files = await demoFiles();
    const sheet = validateCatalogSheet(fromCsv, { fileNames: new Set(files.keys()) });
    const fromSheet = validateCatalogSheet(fromXlsx, { fileNames: new Set(files.keys()) });
    expect(fromSheet.issues).toEqual([]);
    expect(fromSheet.products).toHaveLength(15);
    expect(sheet.issues).toEqual([]);
    expect(sheet.products).toHaveLength(15);
    expect(sheet.products.reduce((sum, product) => sum + product.variants.length, 0)).toBe(120);

    await prisma.product.create({
      data: {
        name: "Ao thun cu",
        slug: "ao-thun-oversize",
        variants: { create: { sku: "VIZ-1", color: "Den", colorHex: "#111111", size: "M", price: 1000, stock: 3 } },
      },
    });

    const saved = await commitCatalogImport(prisma, { products: sheet.products, issues: sheet.issues, files });
    expect("summary" in saved && saved.summary.productsCreate).toBe(15);
    expect("summary" in saved && saved.summary.variantsCreate).toBe(120);
    expect("summary" in saved && saved.summary.categoriesCreate.sort()).toEqual(["Giày", "Nam", "Nữ", "Phụ kiện"]);
    expect(await prisma.product.count({ where: { slug: { startsWith: "demo-" } } })).toBe(15);
    expect(await prisma.productVariant.count({ where: { sku: { startsWith: "DEMO-" } } })).toBe(120);
    const soldOut = await prisma.productVariant.findUnique({ where: { sku: "DEMO-AT-NAVY-XL" } });
    expect(soldOut?.stock).toBe(0);
    expect(soldOut?.costPrice).toBeGreaterThan(0);
    const image = await prisma.productImage.findFirst({ where: { product: { slug: "demo-ao-thun-nam-cotton-basic" } } });
    expect(image?.url.startsWith("/media/catalog/")).toBe(true);
    expect(await prisma.product.findUnique({ where: { slug: "ao-thun-oversize" } })).toMatchObject({ name: "Ao thun cu" });

    const again = await commitCatalogImport(prisma, { products: sheet.products, issues: sheet.issues, files });
    expect("summary" in again && again.summary).toMatchObject({ productsCreate: 0, productsUpdate: 15, variantsCreate: 0, variantsUpdate: 120 });
    expect(await prisma.product.count({ where: { slug: { startsWith: "demo-" } } })).toBe(15);

    const inspected = await inspectDemoCatalog(prisma);
    expect(inspected.filter((row) => row.plan.action === "delete")).toHaveLength(15);
    expect(inspected.some((row) => row.slug === "ao-thun-oversize")).toBe(false);
    const removed = await applyDemoRemoval(prisma, inspected);
    expect(removed).toEqual({ deleted: 15, blocked: 0 });
    expect(await prisma.product.count({ where: { slug: { startsWith: "demo-" } } })).toBe(0);
    expect(await prisma.productVariant.count({ where: { sku: { startsWith: "DEMO-" } } })).toBe(0);
    expect(await prisma.product.findUnique({ where: { slug: "ao-thun-oversize" } })).not.toBeNull();
  });
});

describe("demo removal plan", () => {
  it("blocks an order that is not marked TEST", () => {
    expect(
      planDemoRemoval({
        slug: "demo-ao",
        skus: ["DEMO-AO-M"],
        orderNotes: ["giao that"],
        orderIds: ["o1"],
        orderHasForeignItem: false,
      }).action,
    ).toBe("blocked");
  });
});
