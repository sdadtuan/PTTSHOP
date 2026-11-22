import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { parseSpreadsheet, validateCatalogSheet, type ImportMode } from "@/lib/catalog-import";
import { lookupCatalogCollisions, modeOf } from "@/lib/catalog-import-commit";
import { prisma } from "@/lib/prisma";

const MAX_SHEET = 2 * 1024 * 1024;

export async function readCatalogForm(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return { error: "Thiếu file CSV hoặc Excel" as const };
  }
  if (file.size > MAX_SHEET) return { error: "File bảng tính tối đa 2MB" as const };
  const mode: ImportMode = modeOf(String(form.get("mode") || "demo"));
  const images = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  const fileNames = new Set(images.map((image) => image.name));
  const grid = parseSpreadsheet({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  const sheet = validateCatalogSheet(grid, { mode, fileNames });
  const files = new Map<string, { name: string; bytes: Buffer; mime: string }>();
  for (const image of images) {
    files.set(image.name, { name: image.name, bytes: Buffer.from(await image.arrayBuffer()), mime: image.type });
  }
  return { mode, sheet, files };
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const parsed = await readCatalogForm(req);
    if ("error" in parsed) return jsonOk({ ok: false, issues: [{ row: 1, field: "file", message: parsed.error }], products: [] });
    const dbIssues = await lookupCatalogCollisions(prisma, parsed.sheet.products);
    const issues = [...parsed.sheet.issues, ...dbIssues];
    return jsonOk({
      ok: issues.length === 0 && parsed.sheet.products.length > 0,
      mode: parsed.mode,
      issues,
      products: parsed.sheet.products.map((product) => ({
        slug: product.slug,
        name: product.name,
        categorySlug: product.categorySlug,
        categoryName: product.categoryName,
        saleStatus: product.saleStatus,
        variantCount: product.variants.length,
        stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
        outOfStock: product.variants.filter((variant) => variant.stock === 0).map((variant) => variant.sku),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
