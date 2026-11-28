import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ApiError, handleApiError, jsonError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { can, maskCustomerPhone } from "@/lib/rbac";
import { assertScope, enforceAdmin } from "@/lib/rbac-access";
import { sendOrderStatusEmail } from "@/lib/mail";
import { canTransitionOrder, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { adminOrderDetailInclude } from "@/lib/admin-orders";
import { paymentAuditEntries } from "@/lib/payments/audit-view";
import { autoIssueIfReady } from "@/lib/invoices/service";
import { reviewPaymentConfirm } from "@/lib/payments/confirm";
import { holdEnforceFrom, releaseExpiredUnpaid } from "@/lib/payments/hold";
import { prisma } from "@/lib/prisma";
import { recordOrderNotice } from "@/lib/notify/order-notice";

export async function GET(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const hidePhone = !can(session.access, "orders.phone");
    const mask = <T extends { customerPhone?: string | null }>(order: T) =>
      hidePhone ? { ...order, customerPhone: maskCustomerPhone(order.customerPhone || "") } : order;
    await releaseExpiredUnpaid(prisma, new Date(), holdEnforceFrom());
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: adminOrderDetailInclude,
      });
      if (!order) return jsonError("Không tìm thấy đơn hàng", 404);
      const actorIds = [...new Set(order.paymentAudits.map((row) => row.actorId).filter((id): id is string => Boolean(id)))];
      const actors = actorIds.length
        ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
        : [];
      return jsonOk({
        order: mask({ ...order, paymentAudits: paymentAuditEntries(order.paymentAudits, actors) }),
      });
    }
    const status = url.searchParams.get("status") || undefined;
    const orders = await prisma.order.findMany({
      where: status ? { status: status as never } : undefined,
      include: { items: true, user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ orders: orders.map((order) => mask(order)) });
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
    amount: z.number().int().nonnegative().optional(),
  })
  .refine((b) => Boolean(b.status || b.paymentStatus), {
    message: "Thiếu trường cập nhật",
  });

export async function PATCH(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = patchSchema.parse(await req.json());
    const current = await prisma.order.findUnique({ where: { id: body.id } });
    if (!current) return jsonError("Không tìm thấy đơn hàng", 404);
    if (body.paymentStatus === "PAID") assertScope(session.access, ["orders.service", "invoices.write"]);
    if (body.status) assertScope(session.access, body.status === "CONFIRMED" ? "orders.service" : ["orders.pack", "orders.service"]);

    if (body.paymentStatus === "PAID" && body.confirmPaid !== true) {
      return jsonError(
        "Cần xác nhận admin (confirmPaid) để đánh dấu đã thanh toán",
        400,
      );
    }

    if (body.paymentStatus === "PAID") {
      const decision = reviewPaymentConfirm({
        role: "ADMIN",
        paymentStatus: current.paymentStatus,
        orderTotal: current.total,
        requestedAmount: body.amount,
      });
      if (!decision.ok) return jsonError(decision.error, decision.status);
      try {
        const paid = await prisma.$transaction(async (tx) => {
          const updated = await tx.order.updateMany({
            where: { id: current.id, paymentStatus: { not: "PAID" } },
            data: {
              paymentStatus: "PAID",
              paymentConfirmedAt: new Date(),
              paymentConfirmedById: session.user.id,
              ...(body.status ? { status: body.status } : {}),
            },
          });
          if (updated.count !== 1) throw new ApiError("Đơn đã được xác nhận thanh toán.", 409);
          await tx.paymentAuditLog.create({
            data: {
              orderId: current.id,
              action: "CONFIRMED_PAID",
              actorId: session.user.id,
              amount: current.total,
            },
          });
          return tx.order.findUniqueOrThrow({ where: { id: current.id } });
        });
        await autoIssueIfReady(prisma, paid.id, "PAID");
        await recordAudit({ access: session.access, actorId: session.user.id, actorEmail: session.user.email, action: "CONFIRM_PAID", entityType: "Order", entityId: paid.id, before: { paymentStatus: current.paymentStatus }, after: { paymentStatus: "PAID" }, req });
        return jsonOk({ order: paid });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) throw err;
        throw err;
      }
    }

    if (body.status === "CANCELLED") {
      return jsonError("Huỷ đơn bằng nút Huỷ đơn trên trang chi tiết, kèm lý do.", 400);
    }
    if (body.status && !canTransitionOrder(current.status, body.status)) {
      return jsonError("Không chuyển được trạng thái này.", 400);
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
    if (order.status === "COMPLETED") await autoIssueIfReady(prisma, order.id, "DELIVERED");
    const { syncOrderLoyalty } = await import("@/lib/loyalty-sync");
    await syncOrderLoyalty(order.id);
    if (order.paymentStatus === "PAID") await autoIssueIfReady(prisma, order.id, "PAID");

    if (body.status) {
      await recordAudit({ access: session.access, actorId: session.user.id, actorEmail: session.user.email, action: "ORDER_STATUS", entityType: "Order", entityId: order.id, before: { status: current.status }, after: { status: order.status }, req });
      void sendOrderStatusEmail({
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        status: ORDER_STATUS_LABELS[order.status],
      });
      try {
        await recordOrderNotice(prisma, {
          orderId: order.id,
          status: order.status,
          phone: order.customerPhone,
          email: order.customerEmail,
        });
      } catch {
        // ZNS lỗi không chặn đổi trạng thái.
      }
    }

    return jsonOk({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
