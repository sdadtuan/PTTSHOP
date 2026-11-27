import { prisma } from "@/lib/prisma";
import {
  DEFAULT_COD_CONFIRM_HOURS,
  DEFAULT_COD_MAX_AMOUNT,
  DEFAULT_HOLD_HOURS,
  type PaymentConfig,
} from "@/lib/payments/policy";

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const row = await prisma.paymentSettings.findUnique({ where: { id: "default" } });
  return {
    codEnabled: row?.codEnabled ?? true,
    codMaxAmount: row?.codMaxAmount ?? DEFAULT_COD_MAX_AMOUNT,
    holdHours: row?.holdHours ?? DEFAULT_HOLD_HOURS,
    codConfirmHours: row?.codConfirmHours ?? DEFAULT_COD_CONFIRM_HOURS,
    bankTransferEnabled: row?.bankTransferEnabled === true,
    bankBin: row?.bankBin ?? "",
    bankName: row?.bankName ?? "",
    bankAccountNumber: row?.bankAccountNumber ?? "",
    bankAccountName: row?.bankAccountName ?? "",
    bankBranch: row?.bankBranch ?? "",
  };
}

export async function getGatewayFlags() {
  const row = await prisma.paymentSettings.findUnique({ where: { id: "default" } });
  return {
    vietqrEnabled: row?.vietqrEnabled === true,
    vietqrMerchantId: row?.vietqrMerchantId ?? "",
    momoEnabled: row?.momoEnabled === true,
    momoPartnerCode: row?.momoPartnerCode ?? "",
    zalopayEnabled: row?.zalopayEnabled === true,
    zalopayAppId: row?.zalopayAppId ?? "",
  };
}
