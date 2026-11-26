import type { PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api";
import {
  DEFAULT_DUAL_APPROVAL_THRESHOLD,
  excludedCategoryHit,
  refundMethodForPayment,
  reviewRefundApproval,
  reviewReturnWindow,
  shippingFeePayer,
} from "@/lib/ops/returns-policy";

type Db = PrismaClient;

export async function loadReturnSettings(db: Db) {
  const row = await db.returnSettings.findUnique({ where: { id: "default" } });
  const excluded = row?.excludedCategoryIds ? (JSON.parse(row.excludedCategoryIds) as string[]) : [];
  return {
    returnWindowDays: row?.returnWindowDays ?? null,
    excludedCategoryIds: Array.isArray(excluded) ? excluded : [],
    dualApprovalThreshold: row?.dualApprovalThreshold ?? DEFAULT_DUAL_APPROVAL_THRESHOLD,
  };
}

export async function openReturn(db: Db, input: {
  orderId: string;
  type: "RETURN_REFUND" | "EXCHANGE";
  reason: "DEFECTIVE" | "WRONG_ITEM" | "CHANGE_OF_MIND" | "OTHER";
  note?: string;
  orderItemIds: string[];
  exceptionReason?: string;
  now?: Date;
}) {
  const settings = await loadReturnSettings(db);
  if (settings.returnWindowDays == null) {
    throw new ApiError("Chưa cấu hình số ngày đổi trả.", 400);
  }
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!order) throw new ApiError("Không tìm thấy đơn.", 404);
  const deliveredAt = order.status === "COMPLETED" ? order.updatedAt : null;
  const window = reviewReturnWindow({
    deliveredAt,
    now: input.now ?? new Date(),
    windowDays: settings.returnWindowDays,
    exceptionReason: input.exceptionReason,
  });
  if (!window.ok) throw new ApiError(window.error, 400);
  const chosen = order.items.filter((item) => input.orderItemIds.includes(item.id));
  if (chosen.length === 0) throw new ApiError("Chọn ít nhất một dòng hàng.", 400);
  if (excludedCategoryHit(chosen.map((item) => item.variant.product.categoryId), settings.excludedCategoryIds)) {
    throw new ApiError("Có sản phẩm thuộc danh mục không áp dụng đổi trả.", 400);
  }
  return db.returnRequest.create({
    data: {
      orderId: order.id,
      type: input.type,
      reason: input.reason,
      note: input.note || null,
      status: "REQUESTED",
      shippingFeePayer: shippingFeePayer(input.reason),
      exceptionReason: window.exception ? input.exceptionReason?.trim() || null : null,
      items: { create: chosen.map((item) => ({ orderItemId: item.id, quantity: item.quantity })) },
    },
    include: { items: true },
  });
}

export async function completeReturn(db: Db, input: { returnId: string; restock: boolean }) {
  const request = await db.returnRequest.findUnique({
    where: { id: input.returnId },
    include: { items: true, order: { include: { items: true } } },
  });
  if (!request) throw new ApiError("Không tìm thấy yêu cầu đổi trả.", 404);
  if (request.status === "COMPLETED") return request;
  if (input.restock) {
    for (const line of request.items) {
      const marked = await db.returnItem.updateMany({ where: { id: line.id, restocked: false }, data: { restocked: true } });
      if (marked.count !== 1) continue;
      const orderItem = request.order.items.find((item) => item.id === line.orderItemId);
      if (!orderItem) continue;
      await db.productVariant.update({ where: { id: orderItem.variantId }, data: { stock: { increment: line.quantity } } });
    }
  }
  const updated = await db.returnRequest.update({
    where: { id: request.id },
    data: { status: "COMPLETED" },
    include: { items: true },
  });
  if (request.type === "RETURN_REFUND") {
    await db.refundRequest.create({
      data: {
        orderId: request.orderId,
        returnRequestId: request.id,
        idempotencyKey: `return:${request.id}`,
        amount: request.order.total,
        refundMethod: refundMethodForPayment(request.order.paymentMethod),
        status: "PENDING",
      },
    }).catch(() => undefined);
  }
  return updated;
}

export async function approveRefund(db: Db, input: { refundId: string; actorId: string }) {
  const settings = await loadReturnSettings(db);
  const refund = await db.refundRequest.findUnique({ where: { id: input.refundId } });
  if (!refund) throw new ApiError("Không tìm thấy phiếu hoàn tiền.", 404);
  const decision = reviewRefundApproval({
    amount: refund.amount,
    threshold: settings.dualApprovalThreshold,
    status: refund.status,
    firstApproverId: refund.firstApproverId,
    actorId: input.actorId,
  });
  if (!decision.ok) throw new ApiError(decision.error, decision.status);
  const saved = await db.refundRequest.update({
    where: { id: refund.id },
    data: {
      status: decision.status,
      firstApproverId: decision.firstApproverId,
      secondApproverId: decision.secondApproverId,
    },
  });
  await db.refundApprovalLog.create({
    data: { refundId: refund.id, actorId: input.actorId, action: decision.status },
  });
  return saved;
}

export async function completeRefund(db: Db, input: { refundId: string; reference: string; actorId: string }) {
  const refund = await db.refundRequest.findUnique({ where: { id: input.refundId }, include: { order: { include: { invoices: true } } } });
  if (!refund) throw new ApiError("Không tìm thấy phiếu hoàn tiền.", 404);
  if (refund.status !== "APPROVED") throw new ApiError("Chỉ đánh dấu đã hoàn khi phiếu đã được duyệt.", 400);
  const saved = await db.refundRequest.update({
    where: { id: refund.id },
    data: { status: "COMPLETED", reference: input.reference.trim() },
  });
  await db.refundApprovalLog.create({ data: { refundId: refund.id, actorId: input.actorId, action: "COMPLETED", note: input.reference } });
  const suggestInvoice = refund.order.invoices.some((row) => row.type === "ORIGINAL" && row.status === "ISSUED");
  return { refund: saved, suggestInvoiceAdjustment: suggestInvoice };
}
