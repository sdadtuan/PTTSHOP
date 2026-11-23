import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { bankByBin } from "@/lib/payments/banks";
import { maskAccount } from "@/lib/payments/mask";
import { bankReady, napasAccountName } from "@/lib/payments/policy";
import { getPaymentConfig } from "@/lib/payments/store";
import { prisma } from "@/lib/prisma";

const putSchema = z.object({
  codEnabled: z.boolean(),
  codMaxAmount: z.number().int().positive().max(1_000_000_000),
  holdHours: z.number().int().min(1).max(168),
  codConfirmHours: z.number().int().min(1).max(168),
  bankBin: z.string().trim().max(6),
  bankName: z.string().trim().max(80),
  bankAccountNumber: z.string().trim().max(19),
  bankAccountName: z.string().trim().max(50),
  bankBranch: z.string().trim().max(80),
});

export async function GET() {
  try {
    await requireAdmin();
    const config = await getPaymentConfig();
    return jsonOk({
      ...config,
      bankReady: bankReady(config),
      bankAccountMasked: config.bankAccountNumber ? maskAccount(config.bankAccountNumber) : "",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = putSchema.parse(await req.json());
    if (body.bankBin && !/^\d{6}$/.test(body.bankBin)) return jsonError("Mã ngân hàng phải gồm 6 chữ số.", 400);
    if (body.bankAccountNumber && !/^\d{6,19}$/.test(body.bankAccountNumber)) {
      return jsonError("Số tài khoản chỉ gồm 6 đến 19 chữ số.", 400);
    }
    if (body.bankAccountName && body.bankAccountName !== napasAccountName(body.bankAccountName)) {
      return jsonError("Tên chủ tài khoản phải in hoa, không dấu, theo chuẩn NAPAS.", 400);
    }
    const known = body.bankBin ? bankByBin(body.bankBin) : null;
    await prisma.paymentSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        codEnabled: body.codEnabled,
        codMaxAmount: body.codMaxAmount,
        holdHours: body.holdHours,
        codConfirmHours: body.codConfirmHours,
        bankBin: body.bankBin || null,
        bankName: body.bankName || known?.shortName || null,
        bankAccountNumber: body.bankAccountNumber || null,
        bankAccountName: body.bankAccountName || null,
        bankBranch: body.bankBranch || null,
      },
      update: {
        codEnabled: body.codEnabled,
        codMaxAmount: body.codMaxAmount,
        holdHours: body.holdHours,
        codConfirmHours: body.codConfirmHours,
        bankBin: body.bankBin || null,
        bankName: body.bankName || known?.shortName || null,
        bankAccountNumber: body.bankAccountNumber || null,
        bankAccountName: body.bankAccountName || null,
        bankBranch: body.bankBranch || null,
      },
    });
    return jsonOk({ ok: true, bankAccountMasked: body.bankAccountNumber ? maskAccount(body.bankAccountNumber) : "" });
  } catch (err) {
    return handleApiError(err);
  }
}
