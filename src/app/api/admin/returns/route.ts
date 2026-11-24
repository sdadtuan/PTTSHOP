import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { completeReturn, loadReturnSettings, openReturn } from "@/lib/ops/return-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  action: z.enum(["open", "complete", "settings"]).optional(),
  orderId: z.string().optional(),
  returnId: z.string().optional(),
  type: z.enum(["RETURN_REFUND", "EXCHANGE"]).optional(),
  reason: z.enum(["DEFECTIVE", "WRONG_ITEM", "CHANGE_OF_MIND", "OTHER"]).optional(),
  note: z.string().optional(),
  orderItemIds: z.array(z.string()).optional(),
  exceptionReason: z.string().optional(),
  restock: z.boolean().optional(),
  returnWindowDays: z.number().int().min(0).max(60).optional(),
  excludedCategoryIds: z.array(z.string()).optional(),
  dualApprovalThreshold: z.number().int().min(0).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const [requests, settings] = await Promise.all([
      prisma.returnRequest.findMany({ include: { items: true, order: { select: { orderNumber: true, total: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
      loadReturnSettings(prisma),
    ]);
    const refunds = await prisma.refundRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return jsonOk({
      requests,
      refunds,
      settings,
      summary: {
        waiting: requests.filter((row) => row.status === "REQUESTED" || row.status === "APPROVED" || row.status === "RECEIVING").length,
        second: refunds.filter((row) => row.status === "PENDING_SECOND_APPROVAL").length,
        refunded: refunds.filter((row) => row.status === "COMPLETED").length,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await req.json());
    if (body.action === "settings") {
      await prisma.returnSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          returnWindowDays: body.returnWindowDays,
          dualApprovalThreshold: body.dualApprovalThreshold,
          excludedCategoryIds: JSON.stringify(body.excludedCategoryIds || []),
        },
        update: {
          returnWindowDays: body.returnWindowDays,
          dualApprovalThreshold: body.dualApprovalThreshold,
          excludedCategoryIds: JSON.stringify(body.excludedCategoryIds || []),
        },
      });
      return jsonOk({ settings: await loadReturnSettings(prisma) });
    }
    if (body.action === "complete") {
      if (!body.returnId) throw new Error("Thiếu yêu cầu.");
      return jsonOk({ request: await completeReturn(prisma, { returnId: body.returnId, restock: Boolean(body.restock) }) });
    }
    if (!body.orderId || !body.type || !body.reason) throw new Error("Thiếu dữ liệu đổi trả.");
    const request = await openReturn(prisma, {
      orderId: body.orderId,
      type: body.type,
      reason: body.reason,
      note: body.note,
      orderItemIds: body.orderItemIds || [],
      exceptionReason: body.exceptionReason,
    });
    return jsonOk({ request });
  } catch (err) {
    return handleApiError(err);
  }
}
