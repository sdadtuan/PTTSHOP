import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { assertScope, enforceAdmin } from "@/lib/rbac-access";
import { approveRefund, completeRefund } from "@/lib/ops/return-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  action: z.enum(["approve", "complete"]),
  refundId: z.string(),
  reference: z.string().optional(),
});

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const refunds = await prisma.refundRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { approvals: true } });
    return jsonOk({ refunds });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    if (body.action === "approve") {
      const current = await prisma.refundRequest.findUnique({ where: { id: body.refundId } });
      if (!current) return jsonError("Không tìm thấy phiếu hoàn tiền.");
      assertScope(session.access, current.status === "PENDING_SECOND_APPROVAL" ? "refunds.approve2" : "refunds.approve1");
      const refund = await approveRefund(prisma, { refundId: body.refundId, actorId: session.user.id });
      await recordAudit({ access: session.access, actorId: session.user.id, actorEmail: session.user.email, action: "REFUND_APPROVE", entityType: "RefundRequest", entityId: refund.id, before: { status: current.status }, after: { status: refund.status }, req });
      return jsonOk({ refund });
    }
    assertScope(session.access, "refunds.complete");
    if (!body.reference?.trim()) return jsonError("Cần mã tham chiếu đã chuyển hoàn.");
    const result = await completeRefund(prisma, { refundId: body.refundId, reference: body.reference, actorId: session.user.id });
    await recordAudit({ access: session.access, actorId: session.user.id, actorEmail: session.user.email, action: "REFUND_COMPLETE", entityType: "RefundRequest", entityId: result.refund.id, before: { status: "APPROVED" }, after: { status: "COMPLETED", reference: body.reference }, req });
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
