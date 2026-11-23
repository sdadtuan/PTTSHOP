import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const CART_SESSION_COOKIE = "ptt_cart_sid";
const LEGACY_CART_COOKIE = "vizfas_cart_sid";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function getOrCreateCartSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_SESSION_COOKIE)?.value;
  if (existing && existing.length >= 16) return existing;

  const legacy = jar.get(LEGACY_CART_COOKIE)?.value;
  const sid = legacy && legacy.length >= 16 ? legacy : randomBytes(24).toString("hex");
  jar.set(CART_SESSION_COOKIE, sid, cookieOptions);
  if (legacy) jar.delete(LEGACY_CART_COOKIE);
  return sid;
}

export async function getCartSessionId(): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(CART_SESSION_COOKIE)?.value;
  if (existing) return existing;
  const legacy = jar.get(LEGACY_CART_COOKIE)?.value;
  if (!legacy) return null;
  jar.set(CART_SESSION_COOKIE, legacy, cookieOptions);
  jar.delete(LEGACY_CART_COOKIE);
  return legacy;
}

export async function clearCartSessionCookie() {
  const jar = await cookies();
  jar.delete(CART_SESSION_COOKIE);
  jar.delete(LEGACY_CART_COOKIE);
}
