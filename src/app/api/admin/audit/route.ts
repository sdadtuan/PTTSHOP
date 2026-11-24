import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || undefined;
    const entityType = url.searchParams.get("entityType") || undefined;
    const actor = url.searchParams.get("actor") || undefined;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const rows = await prisma.adminAuditLog.findMany({
      where: {
        action,
        entityType,
        ...(actor ? { OR: [{ actorEmail: { contains: actor, mode: "insensitive" } }, { actorId: actor }] } : {}),
        ...(from || to
          ? { createdAt: { gte: from ? new Date(`${from}T00:00:00`) : undefined, lte: to ? new Date(`${to}T23:59:59`) : undefined } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ rows });
  } catch (err) {
    return handleApiError(err);
  }
}
