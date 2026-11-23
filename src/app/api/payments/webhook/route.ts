import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { applyPayosPayment } from "@/lib/payments/apply-webhook";
import { payosEnv, payosEventId, payosSignatureMatches, reviewPayosWebhook, type PayosNotice } from "@/lib/payments/payos";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const env = payosEnv();
    const raw = await req.text();
    let body: { data?: PayosNotice; signature?: string } = {};
    if (env.enabled) {
      try {
        body = JSON.parse(raw) as { data?: PayosNotice; signature?: string };
      } catch {
        body = {};
      }
    }
    const data = (body.data || {}) as PayosNotice & Record<string, unknown>;
    const signatureOk = env.enabled && payosSignatureMatches(data, body.signature || "", env.checksumKey);
    const eventId = payosEventId(data);
    const existing = eventId
      ? await prisma.webhookEvent.findUnique({ where: { eventId } })
      : null;
    const order = typeof data.orderCode === "number"
      ? await prisma.order.findUnique({ where: { payosOrderCode: data.orderCode } })
      : null;
    const decision = reviewPayosWebhook({
      configured: env.enabled,
      signatureOk,
      seen: Boolean(existing),
      orderFound: Boolean(order),
      amountMatches: Boolean(order && data.amount === order.total),
      descriptionMatches: Boolean(order && data.description === order.orderNumber),
      paidCode: data.code === "00",
    });
    if (!decision.apply) {
      if (decision.status === 200) return jsonOk({ ok: true, duplicate: Boolean(decision.duplicate), ignored: Boolean(decision.ignored) });
      const message = decision.status === 404 ? "Webhook chưa được cấu hình." : decision.status === 403 ? "Chữ ký không hợp lệ." : "Số tiền hoặc mã đơn không khớp.";
      return jsonError(message, decision.status);
    }
    if (!order || !eventId) return jsonError("Số tiền hoặc mã đơn không khớp.", 409);
    const applied = await applyPayosPayment(prisma, order, eventId);
    return jsonOk({ ok: true, duplicate: applied.duplicate });
  } catch (err) {
    return handleApiError(err);
  }
}
