import { Prisma, type PrismaClient } from "@prisma/client";
import { withSqliteRetry } from "@/lib/payments/sqlite-retry";

export async function applyPayosPayment(
  db: PrismaClient,
  order: { id: string; orderNumber: string; total: number; paymentStatus: string },
  eventId: string,
) {
  try {
    await withSqliteRetry(() =>
      db.$transaction(async (tx) => {
        await tx.webhookEvent.create({
          data: { eventId, orderNumber: order.orderNumber, amount: order.total },
        });
        if (order.paymentStatus === "PAID") return;
        const updated = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: { not: "PAID" } },
          data: {
            paymentStatus: "PAID",
            paymentConfirmedAt: new Date(),
            paymentProvider: "payos",
          },
        });
        if (updated.count === 1) {
          await tx.paymentAuditLog.create({
            data: { orderId: order.id, action: "WEBHOOK_PAID", amount: order.total },
          });
        }
      }),
    );
    return { duplicate: false };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { duplicate: true };
    }
    throw err;
  }
}
