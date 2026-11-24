import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { transferView } from "@/lib/payments/instructions";
import { getPaymentConfig } from "@/lib/payments/store";
import { prisma } from "@/lib/prisma";
import { publicShipments } from "@/lib/shipping/service";
import { phoneSchema } from "@/lib/validation";

const bodySchema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  phone: phoneSchema,
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const order = await prisma.order.findUnique({
      where: { orderNumber: body.orderNumber },
      include: { shipments: { orderBy: { createdAt: "asc" } } },
    });
    if (!order || order.customerPhone.replace(/\s/g, "") !== body.phone.replace(/\s/g, "")) {
      return jsonError("Không tìm thấy đơn khớp số điện thoại.", 404);
    }
    const transfer =
      order.paymentMethod === "BANK_TRANSFER"
        ? transferView({
            config: await getPaymentConfig(),
            amount: order.total,
            orderNumber: order.orderNumber,
            dueAt: order.paymentDueAt,
          })
        : null;
    return jsonOk({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      transfer,
      payosQr: order.paymentMethod === "PAYOS" ? order.payosQr : null,
      shipments: publicShipments(order.shipments),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
