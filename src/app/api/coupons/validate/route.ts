import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { computeCouponDiscount, findValidCoupon } from "@/lib/coupons";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().trim().min(2).max(40),
  subtotal: z.number().int().nonnegative(),
});

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientKey(req, "coupon"), 30, 60_000);
    if (!rl.ok) {
      return jsonOk({ valid: false, error: "Quá nhiều yêu cầu" });
    }
    const body = schema.parse(await req.json());
    const coupon = await findValidCoupon(prisma, body.code, body.subtotal);
    const discount = computeCouponDiscount(coupon, body.subtotal);
    return jsonOk({
      valid: true,
      code: coupon.code,
      discount,
      description: coupon.description,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
