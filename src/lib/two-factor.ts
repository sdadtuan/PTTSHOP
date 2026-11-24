import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt } from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function authKey() {
  return createHash("sha256").update(process.env.AUTH_SECRET || "test-secret-vitest").digest();
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", authKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}

export function decryptSecret(payload: string) {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", authKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function generateTotpSecret() {
  let out = "";
  const bytes = randomBytes(20);
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

function decodeBase32(value: string) {
  const clean = value.replace(/=+$/g, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totpCode(secret: string, at = Date.now()) {
  const counter = Math.floor(at / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", decodeBase32(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const bin = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return bin.toString().padStart(6, "0");
}

export function verifyTotp(secret: string, code: string, at = Date.now()) {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return false;
  return [-1, 0, 1].some((window) => totpCode(secret, at + window * 30_000) === token);
}

export function otpauthUrl(email: string, secret: string) {
  return `otpauth://totp/PTT%20Shop:${encodeURIComponent(email)}?secret=${secret}&issuer=PTT%20Shop&digits=6&period=30`;
}

export function hashRecoveryCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function consumeRecovery(stored: string | null, code: string) {
  const hashes = JSON.parse(stored || "[]") as string[];
  const hash = hashRecoveryCode(code);
  if (!hashes.includes(hash)) return null;
  return hashes.filter((item) => item !== hash);
}

export function generateRecoveryCodes() {
  return Array.from({ length: 8 }, () => randomInt(0, 36 ** 5).toString(36).toUpperCase().padStart(5, "0") + randomInt(0, 36 ** 5).toString(36).toUpperCase().padStart(5, "0"));
}
