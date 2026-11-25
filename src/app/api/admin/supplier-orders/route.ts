import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { markSupplierOrderSent, scanSupplierSlas, setSupplierTracking } from "@/lib/dropship/service";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  id: z.string().min(1),
  action: z.enum(["sent", "tracking", "scan"]),
  trackingCode: z.string().trim().max(80).optional(),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const orders = await prisma.supplierOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { supplier: { select: { name: true, code: true } }, order: { select: { orderNumber: true } } },
    });
    return jsonOk({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    if (body.action === "scan") {
      const warned = await scanSupplierSlas(prisma, new Date(), "admin@pttshop.local");
      return jsonOk({ warned: warned.length });
    }
    if (body.action === "sent") {
      const order = await markSupplierOrderSent(prisma, body.id, new Date());
      return jsonOk({ order });
    }
    if (!body.trackingCode) return jsonOk({ error: "Thiếu mã vận đơn" });
    const order = await setSupplierTracking(prisma, body.id, body.trackingCode);
    if (order.shipmentId) {
      await prisma.shipment.update({ where: { id: order.shipmentId }, data: { trackingCode: body.trackingCode, status: "IN_TRANSIT" } });
    }
    return jsonOk({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
