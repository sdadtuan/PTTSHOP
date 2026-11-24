import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { cancelOrder } from "@/lib/ops/cancel-order";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ reason: z.string().trim().min(1).max(500) });

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    const body = bodySchema.parse(await req.json());
    const result = await cancelOrder(prisma, { orderId: id, reason: body.reason, actorId: session.user.id });
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
