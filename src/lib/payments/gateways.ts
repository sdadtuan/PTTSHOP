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

/** CRC-16/CCITT-FALSE, đa thức 0x1021, khởi tạo 0xFFFF. Vector "123456789" = 29B1. */
export function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (let i = 0; i < value.length; i++) {
    crc ^= value.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/**
 * Chuỗi EMV Napas 247 (VietQR) cho chuyển khoản tài khoản.
 * Trả null nếu BIN, số tài khoản, số tiền hoặc nội dung không đúng khuôn.
 * Không gắn khóa merchant.
 */
export function vietqrContent(input: { amount: number; orderNumber: string; bin: string; account: string }) {
  const bin = input.bin.trim();
  const account = input.account.trim();
  const addInfo = input.orderNumber.trim();
  if (!/^\d{6}$/.test(bin)) return null;
  if (!/^\d{6,19}$/.test(account)) return null;
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) return null;
  if (!/^[A-Za-z0-9]{1,25}$/.test(addInfo)) return null;
  const consumer = tlv("00", bin) + tlv("01", account);
  const merchant = tlv("00", "A000000727") + tlv("01", consumer) + tlv("02", "QRIBFTTA");
  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("38", merchant) +
    tlv("53", "704") +
    tlv("54", String(input.amount)) +
    tlv("58", "VN") +
    tlv("62", tlv("08", addInfo));
  const withCrcTag = `${body}6304`;
  return `${withCrcTag}${crc16Ccitt(withCrcTag)}`;
}
