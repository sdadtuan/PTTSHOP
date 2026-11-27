import { createHmac, timingSafeEqual } from "crypto";

export const GATEWAY_NAMES = ["vietqr", "momo", "zalopay"] as const;
export type GatewayName = (typeof GATEWAY_NAMES)[number];

export type GatewayFlags = {
  vietqrEnabled: boolean;
  vietqrMerchantId: string;
  momoEnabled: boolean;
  momoPartnerCode: string;
  zalopayEnabled: boolean;
  zalopayAppId: string;
};

export type GatewaySecrets = {
  vietqr: string | null;
  momo: string | null;
  zalopay: string | null;
};

export function blankSecret(value: string | undefined) {
  const text = (value ?? "").trim();
  return text ? text : null;
}

export function gatewaySecrets(): GatewaySecrets {
  return {
    vietqr: blankSecret(process.env.VIETQR_SECRET),
    momo: blankSecret(process.env.MOMO_SECRET),
    zalopay: blankSecret(process.env.ZALOPAY_SECRET),
  };
}

export function visibleGateways(flags: GatewayFlags, secrets: GatewaySecrets) {
  return {
    vietqr: flags.vietqrEnabled && flags.vietqrMerchantId.trim().length > 0 && Boolean(secrets.vietqr),
    momo: flags.momoEnabled && flags.momoPartnerCode.trim().length > 0 && Boolean(secrets.momo),
    zalopay: flags.zalopayEnabled && flags.zalopayAppId.trim().length > 0 && Boolean(secrets.zalopay),
  };
}

export function signedPayload(input: { provider: string; txnId: string; amount: number; orderNumber: string }) {
  return `${input.provider}|${input.txnId}|${input.amount}|${input.orderNumber}`;
}

export function signGateway(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyGatewaySignature(secret: string, payload: string, signature: string) {
  const expected = Buffer.from(signGateway(secret, payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function paymentDecision(input: { amount: number; orderAmount: number; alreadyPaid: boolean }) {
  if (input.alreadyPaid) return "duplicate" as const;
  if (input.amount !== input.orderAmount) return "amount_mismatch" as const;
  return "mark_paid" as const;
}

/** Nội dung QR đối soát. Không chứa khóa merchant. */
export function vietqrContent(input: { amount: number; orderNumber: string; bin: string; account: string }) {
  return `amount=${input.amount}&addInfo=${input.orderNumber}&bin=${input.bin}&account=${input.account}`;
}
