import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { canShowReceipt, RECEIPT_COOKIE } from "@/lib/order-receipt-token";
import { prisma } from "@/lib/prisma";
import { claimPurchase, consentGranted } from "@/lib/tracking";

const bodySchema = z.object({
  orderNumber: z.string().trim().min(1).max(40),
});

function cookieValue(header: string | null, name: string) {
  if (!header) return "";
  const row = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : "";
}

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const header = req.headers.get("cookie");
    if (!consentGranted(header)) {
      return jsonOk({ ga4: false, meta: false, tiktok: false, eventId: body.orderNumber, transactionId: body.orderNumber });
    }
    const receipt = cookieValue(header, RECEIPT_COOKIE);
    const cookieOrder = receipt.split(".")[0];
    const token = receipt.split(".").slice(1).join(".");
    const order = await prisma.order.findUnique({
      where: { orderNumber: body.orderNumber },
      select: { orderNumber: true, receiptTokenHash: true, total: true },
    });
    if (!order || cookieOrder !== order.orderNumber || !canShowReceipt(order.receiptTokenHash, [token])) {
      return jsonOk({ ga4: false, meta: false, tiktok: false, eventId: body.orderNumber, transactionId: body.orderNumber });
    }
    const claimed = await claimPurchase(prisma, order.orderNumber);
    return jsonOk({
      ...claimed,
      eventId: order.orderNumber,
      transactionId: order.orderNumber,
      value: order.total,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
