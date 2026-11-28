import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { applyGatewayPayment } from "@/lib/payments/apply-gateway";
import {
  GATEWAY_NAMES,
  gatewaySecrets,
  signedPayload,
  verifyGatewaySignature,
  type GatewayName,
} from "@/lib/payments/gateways";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  txnId: z.string().trim().min(1).max(80),
  amount: z.number().int().positive(),
  orderNumber: z.string().trim().min(1).max(40),
  signature: z.string().trim().min(16).max(128),
});

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await ctx.params;
    if (!GATEWAY_NAMES.includes(provider as GatewayName)) return jsonError("Không có cổng này.", 404);
    const name = provider as GatewayName;
    const secret = gatewaySecrets()[name];
    if (!secret) return jsonError("Cổng chưa được cấu hình.", 404);
    const body = bodySchema.parse(await req.json());
    const payload = signedPayload({
      provider: name,
      txnId: body.txnId,
      amount: body.amount,
      orderNumber: body.orderNumber,
    });
    if (!verifyGatewaySignature(secret, payload, body.signature)) return jsonError("Chữ ký không hợp lệ.", 401);
    const result = await applyGatewayPayment(prisma, {
      provider: name,
      txnId: body.txnId,
      amount: body.amount,
      orderNumber: body.orderNumber,
    });
    if (!result.ok && result.reason === "amount_mismatch") return jsonError("Số tiền không khớp đơn.", 409);
    if (!result.ok) return jsonError("Không tìm thấy đơn.", 404);
    const { syncShopOrderByNumber } = await import("@/lib/ops/crm-order");
    await syncShopOrderByNumber(body.orderNumber, "paid");
    return jsonOk({ ok: true, duplicate: result.duplicate });
  } catch (err) {
    return handleApiError(err);
  }
}
