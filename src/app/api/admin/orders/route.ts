import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { sendOrderStatusEmail } from "@/lib/mail";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const orders = await prisma.order.findMany({
      where: status ? { status: status as never } : undefined,
      include: { items: true, user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z
  .object({
    id: z.string().min(1),
    status: z
      .enum(["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"])
      .optional(),
    paymentStatus: z.enum(["UNPAID", "PENDING", "PAID", "FAILED"]).optional(),
    confirmPaid: z.boolean().optional(),
  })
  .refine((b) => Boolean(b.status || b.paymentStatus), {
    message: "Thiếu trường cập nhật",
  });

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await req.json());

    if (body.paymentStatus === "PAID" && body.confirmPaid !== true) {
      return jsonError(
        "Cần xác nhận admin (confirmPaid) để đánh dấu đã thanh toán",
        400,
      );
    }

    const data: {
      status?: typeof body.status;
      paymentStatus?: typeof body.paymentStatus;
    } = {};
    if (body.status) data.status = body.status;
    if (body.paymentStatus) data.paymentStatus = body.paymentStatus;

    const order = await prisma.order.update({
      where: { id: body.id },
      data,
    });

    if (body.status) {
      void sendOrderStatusEmail({
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        status: ORDER_STATUS_LABELS[order.status],
      });
    }

    return jsonOk({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
