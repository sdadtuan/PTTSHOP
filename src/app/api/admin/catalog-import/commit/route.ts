import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { commitCatalogImport } from "@/lib/catalog-import-commit";
import { prisma } from "@/lib/prisma";
import { readCatalogForm } from "../preview/route";

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const parsed = await readCatalogForm(req);
    if ("error" in parsed && parsed.error) return jsonError(parsed.error, 400);
    if (!("sheet" in parsed)) return jsonError("Thiếu file", 400);
    const result = await commitCatalogImport(prisma, {
      products: parsed.sheet.products,
      issues: parsed.sheet.issues,
      files: parsed.files,
    });
    if ("issues" in result) return jsonError("File còn lỗi, chưa lưu", 400, { issues: result.issues });
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
