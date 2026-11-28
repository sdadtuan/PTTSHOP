import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const rows = await prisma.experiment.findMany({ orderBy: { key: "asc" } });
    return jsonOk({ experiments: rows });
  } catch (err) {
    return handleApiError(err);
  }
}

const bodySchema = z.object({
  key: z.string().min(1).max(40),
  enabled: z.boolean(),
});

export async function PUT(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const existing = await prisma.experiment.findUnique({ where: { key: body.key } });
    if (!existing) return jsonError("Không có thử nghiệm này.", 404);
    const row = await prisma.experiment.update({
      where: { key: body.key },
      data: { enabled: body.enabled },
    });
    return jsonOk({ experiment: row });
  } catch (err) {
    return handleApiError(err);
  }
}
