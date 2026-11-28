import { PrismaClient } from "@prisma/client";
import { paymentDecision } from "@/lib/payments/gateways";

type Db = PrismaClient;

export async function applyGatewayPayment(
  db: Db,
  input: { provider: string; txnId: string; amount: number; orderNumber: string },
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { orderNumber: input.orderNumber } });
    if (!order) return { ok: false as const, reason: "missing_order" as const };
    const existing = await tx.paymentTransaction.findUnique({
      where: { provider_providerTxnId: { provider: input.provider, providerTxnId: input.txnId } },
    });
    const decision = paymentDecision({
      amount: input.amount,
      orderAmount: order.total,
      alreadyPaid: existing?.status === "PAID" || order.paymentStatus === "PAID",
    });
    if (decision === "duplicate") return { ok: true as const, duplicate: true as const };
    if (decision === "amount_mismatch") return { ok: false as const, reason: "amount_mismatch" as const };
    await tx.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: input.provider,
        providerTxnId: input.txnId,
        amount: input.amount,
        status: "PAID",
      },
    });
    const updated = await tx.order.updateMany({
      where: { id: order.id, paymentStatus: { not: "PAID" } },
      data: { paymentStatus: "PAID", paymentProvider: input.provider, paymentRef: input.txnId },
    });
    return { ok: true as const, duplicate: updated.count === 0 };
  });
}
