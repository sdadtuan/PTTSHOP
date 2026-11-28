import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { loadRevenue } from "@/lib/revenue-load";
import { revenueCsv } from "@/lib/revenue";

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const url = new URL(req.url);
    const report = await loadRevenue(url.searchParams);
    if (url.searchParams.get("format") === "csv") {
      return new Response(revenueCsv(report), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=\"doanh-thu.csv\"",
        },
      });
    }
    return jsonOk(report);
  } catch (err) {
    return handleApiError(err);
  }
}
