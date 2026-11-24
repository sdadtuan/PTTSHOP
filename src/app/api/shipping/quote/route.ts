import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getShippingConfig, quoteCheckout } from "@/lib/shipping/service";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const subtotal = Number(url.searchParams.get("subtotal") || 0);
    if (!Number.isInteger(subtotal) || subtotal < 0 || subtotal > 1_000_000_000) {
      return jsonError("Tạm tính không hợp lệ.", 400);
    }
    const config = await getShippingConfig(prisma);
    const quoted = await quoteCheckout({
      db: prisma,
      subtotal,
      provinceCode: url.searchParams.get("provinceCode") || undefined,
      wardCode: url.searchParams.get("wardCode") || undefined,
    });
    return jsonOk({
      fee: quoted.fee,
      source: quoted.source,
      freeShipThreshold: config.freeShipThreshold,
      fallbackFee: config.fallbackFee,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
