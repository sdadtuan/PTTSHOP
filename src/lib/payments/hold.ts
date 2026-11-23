import type { Prisma, PrismaClient } from "@prisma/client";
import { isTransferHold } from "@/lib/payments/policy";
import { withSqliteRetry } from "@/lib/payments/sqlite-retry";

type HoldOrder = {
  method: string;
  paymentStatus: string;
  status: string;
  dueAt: Date | null;
  createdAt: Date;
};

export function shouldReleaseHold(order: HoldOrder, now: Date, enforceFrom: Date | null) {
  if (!enforceFrom) return false;
  if (order.createdAt.getTime() <= enforceFrom.getTime()) return false;
  if (!isTransferHold(order.method)) return false;
  if (order.paymentStatus !== "UNPAID") return false;
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") return false;
  if (!order.dueAt || order.dueAt.getTime() >= now.getTime()) return false;
  return true;
}

export function holdEnforceFrom(env: NodeJS.ProcessEnv = process.env) {
  const raw = env.PAYMENT_HOLD_ENFORCE_FROM?.trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function releaseExpiredUnpaid(
  db: PrismaClient,
  now: Date,
  enforceFrom: Date | null,
) {
  if (!enforceFrom) return { released: 0 };
  const due = await db.order.findMany({
    where: {
      paymentStatus: "UNPAID",
      paymentMethod: { in: ["BANK_TRANSFER", "PAYOS"] },
      status: { in: ["PENDING", "CONFIRMED"] },
      paymentDueAt: { lt: now },
      createdAt: { gt: enforceFrom },
    },
    include: { items: true },
  });
  let released = 0;
  for (const order of due) {
    if (!shouldReleaseHold({
      method: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      dueAt: order.paymentDueAt,
      createdAt: order.createdAt,
    }, now, enforceFrom)) continue;
    const changed = await withSqliteRetry(() =>
      db.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: "UNPAID", status: { in: ["PENDING", "CONFIRMED"] } },
          data: { status: "CANCELLED" },
        });
        if (updated.count !== 1) return false;
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.paymentAuditLog.create({
          data: { orderId: order.id, action: "HOLD_EXPIRED", amount: order.total },
        });
        return true;
      }),
    );
    if (changed) released += 1;
  }
  return { released };
}

export type Tx = Prisma.TransactionClient;
