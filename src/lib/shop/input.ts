import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const text = value.trim();
  return text ? text : null;
};

const phoneField = z.preprocess(emptyToNull, z.string().nullable()).superRefine((value, ctx) => {
  if (value == null) return;
  const text = value.replace(/[\s.-]/g, "");
  if (!/^(?:0\d{9}|\+84\d{9})$/.test(text)) {
    ctx.addIssue({ code: "custom", message: "Số điện thoại phải là 0 và 9 chữ số, hoặc +84 và 9 chữ số." });
  }
});

const emailField = z.preprocess(
  emptyToNull,
  z.string().email("Email không hợp lệ.").nullable(),
);

const optionalMoney = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.number({ error: "Phải là số nguyên không âm." }).int().min(0).nullable(),
);

const optionalDays = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.number({ error: "Số ngày phải là số nguyên không âm." }).int().min(0).max(60).nullable(),
);

export const shopProfileInputSchema = z.object({
  hotline: phoneField,
  email: emailField,
  address: z.preprocess(emptyToNull, z.string().max(300).nullable()),
  hours: z.preprocess(emptyToNull, z.string().max(120).nullable()),
  zaloUrl: z.preprocess(emptyToNull, z.string().url("Link Zalo không hợp lệ.").nullable()),
  freeShipThreshold: optionalMoney,
  fallbackFee: optionalMoney,
  lowStockThreshold: z.preprocess(
    (value) => (value === "" || value == null || value === 0 ? null : value),
    z.number({ error: "Ngưỡng tồn phải là số nguyên dương." }).int().positive().nullable(),
  ).optional(),
  returnWindowDays: optionalDays,
  codEnabled: z.boolean(),
  bankTransferEnabled: z.boolean(),
  bankBin: z.string().trim().max(6),
  bankName: z.string().trim().max(80),
  bankAccountNumber: z.string().trim().max(19),
  keepBankAccount: z.boolean(),
  bankAccountName: z.string().trim().max(50),
  bankBranch: z.string().trim().max(80),
});

export type ShopProfileInput = z.infer<typeof shopProfileInputSchema>;

export function parseShopProfileInput(input: unknown) {
  const parsed = shopProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Dữ liệu cửa hàng không hợp lệ." };
  }
  const value = parsed.data;
  if (value.hotline) value.hotline = value.hotline.replace(/[\s.-]/g, "");
  if (value.zaloUrl && !/^https?:\/\//i.test(value.zaloUrl)) {
    return { ok: false as const, error: "Link Zalo phải bắt đầu bằng http:// hoặc https://." };
  }
  if (value.bankAccountNumber && !/^\d{6,19}$/.test(value.bankAccountNumber)) {
    return { ok: false as const, error: "Số tài khoản chỉ gồm 6 đến 19 chữ số." };
  }
  if (value.bankBin && !/^\d{6}$/.test(value.bankBin)) {
    return { ok: false as const, error: "Mã ngân hàng phải gồm 6 chữ số." };
  }
  return { ok: true as const, value };
}
