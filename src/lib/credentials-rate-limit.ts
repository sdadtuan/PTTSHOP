import { NextResponse } from "next/server";
import { clientKey, isRateLimited, rateLimit } from "@/lib/rate-limit";

export const CREDENTIALS_FAIL_LIMIT = 5;
export const CREDENTIALS_FAIL_WINDOW_MS = 15 * 60 * 1000;

export function isCredentialsCallback(url: string, method: string) {
  if (method !== "POST") return false;
  try {
    return new URL(url).pathname === "/api/auth/callback/credentials";
  } catch {
    return false;
  }
}

export async function credentialsResponseFailed(res: Response): Promise<boolean> {
  if (res.status === 401 || res.status === 403) return true;
  const location = res.headers.get("location") ?? "";
  if (/[?&]error=/.test(location) && !location.includes("MissingCSRF")) return true;
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("json")) return false;
  try {
    const data = (await res.clone().json()) as { error?: unknown };
    return typeof data?.error === "string" && data.error.length > 0 && data.error !== "MissingCSRF";
  } catch {
    return false;
  }
}

export async function guardCredentialsCallback(
  req: Request,
  next: (req: Request) => Promise<Response>,
): Promise<Response> {
  if (!isCredentialsCallback(req.url, req.method)) return next(req);

  const key = clientKey(req, "credentials-callback");
  const blocked = isRateLimited(key, CREDENTIALS_FAIL_LIMIT);
  if (blocked.limited) {
    return NextResponse.json(
      { error: "Quá nhiều lần đăng nhập sai. Thử lại sau." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(blocked.retryAfterMs / 1000)) },
      },
    );
  }

  const res = await next(req);
  if (await credentialsResponseFailed(res)) {
    rateLimit(key, CREDENTIALS_FAIL_LIMIT, CREDENTIALS_FAIL_WINDOW_MS);
  }
  return res;
}
