import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { approveRefund, completeRefund } from "@/lib/ops/return-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  action: z.enum(["approve", "complete"]),
  refundId: z.string(),
  reference: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const refunds = await prisma.refundRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { approvals: true } });
    return jsonOk({ refunds });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = bodySchema.parse(await req.json());
    if (body.action === "approve") {
      const refund = await approveRefund(prisma, { refundId: body.refundId, actorId: session.user.id });
      return jsonOk({ refund });
    }
    if (!body.reference?.trim()) return jsonError("Cần mã tham chiếu đã chuyển hoàn.");
    const result = await completeRefund(prisma, { refundId: body.refundId, reference: body.reference, actorId: session.user.id });
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
