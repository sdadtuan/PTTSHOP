import { prisma } from "@/lib/prisma";
import { bankReady } from "@/lib/payments/policy";
import { getPaymentConfig } from "@/lib/payments/store";
import { blankToNull, optionalNonNegative, optionalPositive, type ShopProfile } from "@/lib/shop/profile";

/** Một lần đọc cho storefront. Null nghĩa là ẩn, không lấy số mặc định trong code. */
export async function getShopProfile(): Promise<ShopProfile> {
  const [site, shipping, returns, payment] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.shippingSettings.findUnique({ where: { id: "default" } }),
    prisma.returnSettings.findUnique({ where: { id: "default" } }),
    getPaymentConfig(),
  ]);
  return {
    hotline: blankToNull(site?.hotline) || blankToNull(site?.contactPhone),
    email: blankToNull(site?.contactEmail),
    address: blankToNull(site?.contactAddress),
    hours: blankToNull(site?.contactHours),
    zaloUrl: blankToNull(site?.zaloUrl),
    freeShipThreshold: optionalPositive(shipping?.freeShipThreshold),
    fallbackFee: optionalNonNegative(shipping?.fallbackFee),
    returnWindowDays: optionalPositive(returns?.returnWindowDays),
    codEnabled: payment.codEnabled,
    bankTransferEnabled: payment.bankTransferEnabled,
    bankVisible: payment.bankTransferEnabled && bankReady(payment),
  };
}
