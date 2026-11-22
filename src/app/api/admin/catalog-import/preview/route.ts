import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { parseSpreadsheet, validateCatalogSheet } from "@/lib/catalog-import";
import { filesFromZip, planCatalogImport } from "@/lib/catalog-import-commit";
import { prisma } from "@/lib/prisma";

const MAX_SHEET = 2 * 1024 * 1024;
const MAX_ZIP = 30 * 1024 * 1024;

export async function readCatalogForm(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "Thiếu file CSV hoặc Excel" as const };
  if (file.size > MAX_SHEET) return { error: "File bảng tính tối đa 2MB" as const };
  const uploads = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  const files = new Map<string, { name: string; bytes: Buffer; mime: string }>();
  for (const image of uploads) {
    const base = image.name.split(/[/\\]/).pop() || image.name;
    if (base.toLowerCase().endsWith(".zip")) {
      if (image.size > MAX_ZIP) return { error: "File zip tối đa 30MB" as const };
      const zipped = await filesFromZip(Buffer.from(await image.arrayBuffer()));
      for (const [name, item] of zipped) files.set(name, item);
      continue;
    }
    files.set(base, { name: base, bytes: Buffer.from(await image.arrayBuffer()), mime: image.type });
  }
  const grid = parseSpreadsheet({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  const sheet = validateCatalogSheet(grid, { fileNames: new Set(files.keys()) });
  return { sheet, files };
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const parsed = await readCatalogForm(req);
    if ("error" in parsed) {
      return jsonOk({ ok: false, issues: [{ row: 1, field: "file", message: parsed.error }], summary: null, products: [] });
    }
    const plan = await planCatalogImport(prisma, parsed.sheet.products);
    const issues = [...parsed.sheet.issues, ...plan.issues];
    return jsonOk({
      ok: issues.length === 0 && parsed.sheet.products.length > 0,
      issues,
      summary: plan.summary,
      products: parsed.sheet.products.map((product) => ({
        slug: product.slug,
        name: product.name,
        categoryName: product.categoryName,
        variantCount: product.variants.length,
        outOfStock: product.variants.filter((variant) => variant.stock === 0).map((variant) => variant.sku),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
