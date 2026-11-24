import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { parseCodCsv, reconcileCod } from "@/lib/shipping/reconcile";

const bodySchema = z.object({
  provider: z.string().trim().max(20).optional(),
  note: z.string().trim().max(200).optional(),
  csv: z.string().max(100_000).optional(),
  rows: z
    .array(
      z.object({
        trackingCode: z.string().trim().max(40).optional(),
        orderNumber: z.string().trim().max(40).optional(),
        amount: z.number().int().min(0),
      }),
    )
    .max(500)
    .optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await req.json());
    const payments = body.rows?.length ? body.rows : parseCodCsv(body.csv || "");
    const shipments = await prisma.shipment.findMany({
      where: { codAmount: { gt: 0 } },
      include: { order: { select: { orderNumber: true, total: true } } },
    });
    const report = reconcileCod(
      payments.map((row) => ({
        trackingCode: row.trackingCode,
        orderNumber: row.orderNumber,
        amount: row.amount,
      })),
      shipments.map((row) => ({
        trackingCode: row.trackingCode,
        orderNumber: row.order?.orderNumber || "",
        codAmount: row.codAmount || 0,
      })),
    );
    const session = await prisma.codReconcileSession.create({
      data: {
        provider: body.provider || null,
        note: body.note || null,
        lines: {
          create: report.lines.map((line) => ({
            trackingCode: line.trackingCode || null,
            orderNumber: line.orderNumber || null,
            expectedAmount: line.expectedAmount,
            actualAmount: line.actualAmount,
            result: line.result,
          })),
        },
      },
      include: { lines: true },
    });
    const totals = await prisma.order.findMany({
      where: { id: { in: shipments.map((row) => row.orderId).filter((id): id is string => Boolean(id)) } },
      select: { id: true, total: true },
    });
    return jsonOk({ sessionId: session.id, report, orderTotals: totals });
  } catch (err) {
    return handleApiError(err);
  }
}
