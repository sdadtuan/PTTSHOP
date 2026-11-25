import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { applySupplierCsv, runDueSyncs, syncSupplierSource } from "@/lib/dropship/service";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  supplierId: z.string().min(1).optional(),
  csv: z.string().optional(),
  scheduled: z.boolean().optional(),
  source: z.enum(["FILE", "MANUAL", "GOOGLE_SHEET"]).optional(),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const runs = await prisma.syncRun.findMany({ orderBy: { startedAt: "desc" }, take: 30 });
    return jsonOk({ runs });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    if (body.scheduled) {
      const runs = await runDueSyncs(prisma, new Date());
      return jsonOk({ runs });
    }
    if (!body.supplierId) return jsonOk({ error: "Thiếu nhà cung cấp" });
    if (body.source === "GOOGLE_SHEET") {
      const run = await syncSupplierSource(prisma, body.supplierId, new Date());
      return jsonOk({ run });
    }
    if (!body.csv) return jsonOk({ error: "Thiếu nội dung file" });
    const run = await applySupplierCsv(prisma, {
      supplierId: body.supplierId,
      source: body.source === "MANUAL" ? "MANUAL" : "FILE",
      csv: body.csv,
      now: new Date(),
      alertTo: "admin@pttshop.local",
    });
    return jsonOk({ run });
  } catch (err) {
    return handleApiError(err);
  }
}
