import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, generateRecoveryCodes, generateTotpSecret, hashRecoveryCode, otpauthUrl, verifyTotp } from "@/lib/two-factor";

const bodySchema = z.object({
  action: z.enum(["start", "enable", "disable"]),
  code: z.string().optional(),
});

async function qrSvg(value: string) {
  const QR = await import("qrcode");
  return QR.toString(value, { type: "svg", margin: 1, width: 180 });
}

export async function GET(req?: Request) {
  try {
    const session = await enforceAdmin(req);
    const row = await prisma.adminTwoFactor.findUnique({ where: { userId: session.user.id } });
    return jsonOk({ enabled: Boolean(row?.enabled) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    if (body.action === "start") {
      const secret = generateTotpSecret();
      await prisma.adminTwoFactor.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, secretEncrypted: encryptSecret(secret), enabled: false },
        update: { secretEncrypted: encryptSecret(secret), enabled: false, recoveryCodesHash: null },
      });
      const url = otpauthUrl(session.user.email || "admin", secret);
      return jsonOk({ otpauth: url, qrSvg: await qrSvg(url) });
    }
    const row = await prisma.adminTwoFactor.findUnique({ where: { userId: session.user.id } });
    if (!row) return jsonError("Hãy tạo mã xác thực trước.");
    const secret = decryptSecret(row.secretEncrypted);
    if (!body.code || !verifyTotp(secret, body.code)) return jsonError("Mã xác thực không đúng.", 400);
    if (body.action === "disable") {
      await prisma.adminTwoFactor.update({ where: { userId: session.user.id }, data: { enabled: false } });
      return jsonOk({ enabled: false });
    }
    const codes = generateRecoveryCodes();
    await prisma.adminTwoFactor.update({
      where: { userId: session.user.id },
      data: { enabled: true, enabledAt: new Date(), verifiedAt: new Date(), recoveryCodesHash: JSON.stringify(codes.map(hashRecoveryCode)) },
    });
    return jsonOk({ enabled: true, recoveryCodes: codes });
  } catch (err) {
    return handleApiError(err);
  }
}
