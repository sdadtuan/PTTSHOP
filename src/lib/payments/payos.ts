import { createHmac, timingSafeEqual } from "crypto";

export type PayosEnv = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  enabled: boolean;
};

export function payosEnv(env: NodeJS.ProcessEnv = process.env): PayosEnv {
  const clientId = env.PAYOS_CLIENT_ID?.trim() || "";
  const apiKey = env.PAYOS_API_KEY?.trim() || "";
  const checksumKey = env.PAYOS_CHECKSUM_KEY?.trim() || "";
  return { clientId, apiKey, checksumKey, enabled: Boolean(clientId && apiKey && checksumKey) };
}

export function payosSign(fields: Record<string, string | number>, checksumKey: string) {
  const data = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("&");
  return createHmac("sha256", checksumKey).update(data).digest("hex");
}

export function payosDataString(data: Record<string, unknown>) {
  return Object.keys(data)
    .sort()
    .map((key) => {
      const raw = data[key];
      const value =
        raw == null || raw === "null" || raw === "undefined"
          ? ""
          : typeof raw === "object"
            ? JSON.stringify(raw)
            : String(raw);
      return `${key}=${value}`;
    })
    .join("&");
}

export function payosSignatureMatches(data: Record<string, unknown>, signature: string, checksumKey: string) {
  if (!signature || !checksumKey) return false;
  const expected = createHmac("sha256", checksumKey).update(payosDataString(data)).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature.trim());
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type PayosNotice = {
  orderCode?: number;
  amount?: number;
  description?: string;
  reference?: string;
  paymentLinkId?: string;
  code?: string;
};

export function reviewPayosWebhook(input: {
  configured: boolean;
  signatureOk: boolean;
  seen: boolean;
  orderFound: boolean;
  amountMatches: boolean;
  descriptionMatches: boolean;
  paidCode: boolean;
}) {
  if (!input.configured) return { status: 404, apply: false, duplicate: false, ignored: false };
  if (!input.signatureOk) return { status: 403, apply: false, duplicate: false, ignored: false };
  if (input.seen) return { status: 200, apply: false, duplicate: true, ignored: false };
  if (!input.paidCode) return { status: 200, apply: false, duplicate: false, ignored: true };
  if (!input.orderFound || !input.amountMatches || !input.descriptionMatches) {
    return { status: 409, apply: false, duplicate: false, ignored: false };
  }
  return { status: 200, apply: true, duplicate: false, ignored: false };
}

export function payosEventId(notice: PayosNotice) {
  const reference = (notice.reference || "").trim();
  if (reference) return reference;
  if (notice.paymentLinkId && notice.orderCode) return `${notice.orderCode}:${notice.paymentLinkId}`;
  return "";
}

export async function createPayosLink(input: {
  env: PayosEnv;
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt: number;
}) {
  const signature = payosSign(
    {
      amount: input.amount,
      cancelUrl: input.cancelUrl,
      description: input.description,
      orderCode: input.orderCode,
      returnUrl: input.returnUrl,
    },
    input.env.checksumKey,
  );
  const res = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": input.env.clientId,
      "x-api-key": input.env.apiKey,
    },
    body: JSON.stringify({
      orderCode: input.orderCode,
      amount: input.amount,
      description: input.description,
      cancelUrl: input.cancelUrl,
      returnUrl: input.returnUrl,
      expiredAt: input.expiredAt,
      signature,
    }),
  });
  const body = (await res.json().catch(() => null)) as {
    code?: string;
    data?: { qrCode?: string; paymentLinkId?: string; checkoutUrl?: string };
  } | null;
  if (!res.ok || body?.code !== "00" || !body.data?.qrCode) {
    throw new Error("payOS không tạo được mã thanh toán.");
  }
  return {
    qrCode: String(body.data.qrCode),
    paymentLinkId: String(body.data.paymentLinkId || ""),
    checkoutUrl: String(body.data.checkoutUrl || ""),
  };
}
