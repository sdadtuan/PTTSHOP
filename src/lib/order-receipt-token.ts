import { createHash, timingSafeEqual } from "crypto";

export const RECEIPT_COOKIE = "ptt_receipt";

export function hashReceiptToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function receiptTokenMatches(storedHash: string | null, token: string | null | undefined) {
  if (!storedHash || !token || token.length < 32) return false;
  const actual = Buffer.from(hashReceiptToken(token));
  const expected = Buffer.from(storedHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function canShowReceipt(
  storedHash: string | null | undefined,
  tokens: Array<string | null | undefined>,
) {
  return tokens.some((token) => receiptTokenMatches(storedHash ?? null, token));
}
