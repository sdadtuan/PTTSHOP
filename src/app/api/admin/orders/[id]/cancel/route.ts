import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { enforceAdmin } from "@/lib/rbac-access";
import { cancelOrder } from "@/lib/ops/cancel-order";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ reason: z.string().trim().min(1).max(500) });

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await enforceAdmin(req);
    const { id } = await context.params;
    const body = bodySchema.parse(await req.json());
    const before = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    const result = await cancelOrder(prisma, { orderId: id, reason: body.reason, actorId: session.user.id });
    const { syncOrderLoyalty } = await import("@/lib/loyalty-sync");
    await syncOrderLoyalty(id);
    const { syncShopOrder } = await import("@/lib/ops/crm-order");
    await syncShopOrder(id, "cancelled");
    await recordAudit({ access: session.access, actorId: session.user.id, actorEmail: session.user.email, action: "CANCEL_ORDER", entityType: "Order", entityId: id, before, after: { status: "CANCELLED", reason: body.reason }, req });
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
