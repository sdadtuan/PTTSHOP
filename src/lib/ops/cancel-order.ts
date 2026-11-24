import { Prisma, type PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { refundMethodForPayment } from "@/lib/ops/returns-policy";
import { withSqliteRetry } from "@/lib/payments/sqlite-retry";

type Db = PrismaClient;
const NOT_DELIVERED = ["DELIVERED", "RETURNED", "CANCELLED"];

function isUnique(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function cancelOrder(db: Db, input: { orderId: string; reason: string; actorId: string }) {
  const reason = input.reason.trim();
  if (!reason) throw new ApiError("Cần nhập lý do huỷ.", 400);
  try {
    return await withSqliteRetry(() =>
    db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        include: { items: true, cancellation: true, invoices: true },
      });
      if (!order) throw new ApiError("Không tìm thấy đơn.", 404);
      if (order.status === "COMPLETED") {
        throw new ApiError("Đơn đã giao. Hãy dùng luồng Đổi trả.", 400);
      }
      if (order.status === "CANCELLED" || order.cancellation) {
        return { order, alreadyCancelled: true, stockReleased: false, refundId: null as string | null, suggestInvoiceAdjustment: false };
      }
      await tx.orderCancellation.create({
        data: { orderId: order.id, reason, actorId: input.actorId },
      });
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.shipment.updateMany({
        where: { orderId: order.id, status: { notIn: NOT_DELIVERED } },
        data: { status: "CANCELLED" },
      });
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
        include: { items: true, invoices: true },
      });
      let refundId: string | null = null;
      if (order.paymentStatus === "PAID") {
        const refund = await tx.refundRequest.create({
          data: {
            orderId: order.id,
            idempotencyKey: `cancel:${order.id}`,
            amount: order.total,
            refundMethod: refundMethodForPayment(order.paymentMethod),
            status: "PENDING",
          },
        });
        refundId = refund.id;
      }
      const issued = updated.invoices.some((row) => row.type === "ORIGINAL" && row.status === "ISSUED");
      return { order: updated, alreadyCancelled: false, stockReleased: true, refundId, suggestInvoiceAdjustment: issued };
    }),
  );
  } catch (err) {
    if (!isUnique(err)) throw err;
    const order = await db.order.findUniqueOrThrow({
      where: { id: input.orderId },
      include: { items: true, invoices: true },
    });
    return { order, alreadyCancelled: true, stockReleased: false, refundId: null, suggestInvoiceAdjustment: false };
  }
}
