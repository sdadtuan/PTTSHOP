import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { buildSlips, reviewPrintAccess } from "@/lib/shipping/print";
import { cancelShipmentRecord, createOrderShipment } from "@/lib/shipping/service";

const createSchema = z.object({
  orderId: z.string().min(1),
  idempotencyKey: z.string().trim().min(4).max(50).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  trackingCode: z.string().trim().max(40).optional(),
  cancel: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireAdmin();
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId") || "";
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipments: { include: { items: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!order) return jsonError("Không tìm thấy đơn.", 404);
    const slips = buildSlips({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.customerPhone,
      address: order.address,
      shipments: order.shipments.map((shipment) => ({
        shipmentNumber: shipment.shipmentNumber || "",
        trackingCode: shipment.trackingCode,
        status: shipment.status || "",
        items: shipment.items.map((item) => {
          const source = order.items.find((row) => row.id === item.orderItemId);
          return {
            name: source?.name || "Sản phẩm",
            sku: source?.size || "",
            quantity: item.quantity || 0,
          };
        }),
      })),
    });
    return jsonOk({
      access: reviewPrintAccess(session.user.role),
      shipments: order.shipments,
      slips,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await req.json());
    const result = await createOrderShipment(prisma, body);
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await req.json());
    if (body.cancel) {
      const result = await cancelShipmentRecord(prisma, body.id);
      if (!result.ok) return jsonError(result.error, 409);
      return jsonOk(result);
    }
    const shipment = await prisma.shipment.update({
      where: { id: body.id },
      data: { trackingCode: body.trackingCode || null },
    });
    return jsonOk({ shipment });
  } catch (err) {
    return handleApiError(err);
  }
}
