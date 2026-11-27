import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { enforceAdmin } from "@/lib/rbac-access";
import { bankByBin } from "@/lib/payments/banks";
import { maskAccount } from "@/lib/payments/mask";
import { bankReady, napasAccountName } from "@/lib/payments/policy";
import { getPaymentConfig } from "@/lib/payments/store";
import { prisma } from "@/lib/prisma";
import { parseShopProfileInput } from "@/lib/shop/input";
import { getShopProfile } from "@/lib/shop/load";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const [profile, payment, site] = await Promise.all([
      getShopProfile(),
      getPaymentConfig(),
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
    ]);
    return jsonOk({
      hotline: profile.hotline ?? "",
      email: profile.email ?? "",
      address: profile.address ?? "",
      hours: profile.hours ?? "",
      zaloUrl: profile.zaloUrl ?? "",
      freeShipThreshold: profile.freeShipThreshold,
      fallbackFee: profile.fallbackFee,
      returnWindowDays: profile.returnWindowDays,
      lowStockThreshold: profile.lowStockThreshold,
      codEnabled: profile.codEnabled,
      bankTransferEnabled: profile.bankTransferEnabled,
      bankVisible: profile.bankVisible,
      bankBin: payment.bankBin,
      bankName: payment.bankName,
      bankAccountName: payment.bankAccountName,
      bankBranch: payment.bankBranch,
      bankAccountMasked: payment.bankAccountNumber ? maskAccount(payment.bankAccountNumber) : "",
      hasBankAccount: Boolean(payment.bankAccountNumber),
      ga4MeasurementId: site?.ga4MeasurementId ?? "",
      metaPixelId: site?.metaPixelId ?? "",
      tiktokPixelId: site?.tiktokPixelId ?? "",
      clarityProjectId: site?.clarityProjectId ?? "",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const parsed = parseShopProfileInput(await req.json());
    if (!parsed.ok) return jsonError(parsed.error, 400);
    const body = parsed.value;
    const current = await getPaymentConfig();
    const account = body.bankAccountNumber || (body.keepBankAccount ? current.bankAccountNumber : "");
    if (body.bankAccountName && body.bankAccountName !== napasAccountName(body.bankAccountName)) {
      return jsonError("Tên chủ tài khoản phải in hoa, không dấu, theo chuẩn NAPAS.", 400);
    }
    const nextBank = {
      ...current,
      bankTransferEnabled: body.bankTransferEnabled,
      bankBin: body.bankBin,
      bankName: body.bankName,
      bankAccountNumber: account,
      bankAccountName: body.bankAccountName,
      bankBranch: body.bankBranch,
    };
    if (body.bankTransferEnabled && !bankReady(nextBank)) {
      return jsonError("Cần đủ BIN, tên ngân hàng, số tài khoản và tên chủ tài khoản để bật chuyển khoản.", 400);
    }
    const known = body.bankBin ? bankByBin(body.bankBin) : null;
    await prisma.$transaction([
      prisma.siteSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          hotline: body.hotline,
          contactPhone: null,
          contactEmail: body.email,
          contactAddress: body.address,
          contactHours: body.hours,
          zaloUrl: body.zaloUrl,
          ...(body.lowStockThreshold !== undefined ? { lowStockThreshold: body.lowStockThreshold } : {}),
          ...(body.ga4MeasurementId !== undefined ? { ga4MeasurementId: body.ga4MeasurementId } : {}),
          ...(body.metaPixelId !== undefined ? { metaPixelId: body.metaPixelId } : {}),
          ...(body.tiktokPixelId !== undefined ? { tiktokPixelId: body.tiktokPixelId } : {}),
          ...(body.clarityProjectId !== undefined ? { clarityProjectId: body.clarityProjectId } : {}),
        },
        update: {
          hotline: body.hotline,
          contactPhone: null,
          contactEmail: body.email,
          contactAddress: body.address,
          contactHours: body.hours,
          zaloUrl: body.zaloUrl,
          ...(body.lowStockThreshold !== undefined ? { lowStockThreshold: body.lowStockThreshold } : {}),
          ...(body.ga4MeasurementId !== undefined ? { ga4MeasurementId: body.ga4MeasurementId } : {}),
          ...(body.metaPixelId !== undefined ? { metaPixelId: body.metaPixelId } : {}),
          ...(body.tiktokPixelId !== undefined ? { tiktokPixelId: body.tiktokPixelId } : {}),
          ...(body.clarityProjectId !== undefined ? { clarityProjectId: body.clarityProjectId } : {}),
        },
      }),
      prisma.shippingSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          freeShipThreshold: body.freeShipThreshold,
          fallbackFee: body.fallbackFee,
        },
        update: {
          freeShipThreshold: body.freeShipThreshold,
          fallbackFee: body.fallbackFee,
        },
      }),
      prisma.returnSettings.upsert({
        where: { id: "default" },
        create: { id: "default", returnWindowDays: body.returnWindowDays },
        update: { returnWindowDays: body.returnWindowDays },
      }),
      prisma.paymentSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          codEnabled: body.codEnabled,
          bankTransferEnabled: body.bankTransferEnabled,
          bankBin: body.bankBin || null,
          bankName: body.bankName || known?.shortName || null,
          bankAccountNumber: account || null,
          bankAccountName: body.bankAccountName || null,
          bankBranch: body.bankBranch || null,
        },
        update: {
          codEnabled: body.codEnabled,
          bankTransferEnabled: body.bankTransferEnabled,
          bankBin: body.bankBin || null,
          bankName: body.bankName || known?.shortName || null,
          bankAccountNumber: account || null,
          bankAccountName: body.bankAccountName || null,
          bankBranch: body.bankBranch || null,
        },
      }),
    ]);
    await recordAudit({
      access: session.access,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "SHOP_PROFILE",
      entityType: "SiteSettings",
      entityId: "default",
      after: {
        hotlineSet: Boolean(body.hotline),
        emailSet: Boolean(body.email),
        addressSet: Boolean(body.address),
        hoursSet: Boolean(body.hours),
        zaloSet: Boolean(body.zaloUrl),
        freeShipThreshold: body.freeShipThreshold,
        fallbackFee: body.fallbackFee,
        returnWindowDays: body.returnWindowDays,
        codEnabled: body.codEnabled,
        bankTransferEnabled: body.bankTransferEnabled,
        bankReady: body.bankTransferEnabled && bankReady(nextBank),
      },
      req,
    });
    return jsonOk({ ok: true, bankAccountMasked: account ? maskAccount(account) : "" });
  } catch (err) {
    return handleApiError(err);
  }
}
