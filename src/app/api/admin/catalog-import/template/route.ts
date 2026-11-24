import { templateCsv } from "@/lib/catalog-import";
import { enforceAdmin } from "@/lib/rbac-access";
import { handleApiError } from "@/lib/api";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
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
