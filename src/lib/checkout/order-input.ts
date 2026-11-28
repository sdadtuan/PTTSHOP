import { z } from "zod";
import { normalizeVnPhone } from "@/lib/phone";

export const checkoutPhoneSchema = z.string().transform((value, ctx) => {
  const phone = normalizeVnPhone(value);
  if (!phone) {
    ctx.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ" });
    return z.NEVER;
  }
  return phone;
});

/** Giá và phí client gửi lên bị bỏ. Server tự tính lại. */
export const checkoutItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  bundleId: z.string().trim().min(1).max(80).nullish(),
});
