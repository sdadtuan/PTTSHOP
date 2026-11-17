import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const CART_SESSION_COOKIE = "vizfas_cart_sid";

export async function getOrCreateCartSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_SESSION_COOKIE)?.value;
  if (existing && existing.length >= 16) return existing;

  const sid = randomBytes(24).toString("hex");
  jar.set(CART_SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return sid;
}

export async function getCartSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CART_SESSION_COOKIE)?.value ?? null;
}

export async function clearCartSessionCookie() {
  const jar = await cookies();
  jar.delete(CART_SESSION_COOKIE);
}
