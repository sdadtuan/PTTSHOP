import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const rows = await prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { order: { select: { orderNumber: true, paymentStatus: true } } },
    });
    return jsonOk({
      transactions: rows.map((row) => ({
        id: row.id,
        provider: row.provider,
        providerTxnId: row.providerTxnId,
        amount: row.amount,
        status: row.status,
        orderNumber: row.order.orderNumber,
        paymentStatus: row.order.paymentStatus,
        createdAt: row.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
