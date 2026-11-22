import { templateCsv } from "@/lib/catalog-import";
import { requireAdmin } from "@/lib/auth-guards";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    return new Response(templateCsv(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=mau-nhap-san-pham.csv",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
