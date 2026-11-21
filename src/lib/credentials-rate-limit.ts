import { NextResponse } from "next/server";
import { clientKey, isRateLimited, rateLimit } from "@/lib/rate-limit";

export const CREDENTIALS_FAIL_LIMIT = 5;
export const CREDENTIALS_FAIL_WINDOW_MS = 15 * 60 * 1000;
/** Cùng một mã cho sai mật khẩu, email không tồn tại và khi bị chặn. */
export const LOGIN_FAILURE_ERROR = "CredentialsSignin";

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

export function credentialsEmailKey(email: string) {
  return `credentials-email:${email.trim().toLowerCase()}`;
}

export async function emailFromCredentialsRequest(req: Request): Promise<string | null> {
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const data = (await req.clone().json()) as { email?: unknown; username?: unknown };
      const email = data?.email ?? data?.username;
      return typeof email === "string" && email.trim() ? email : null;
    }
    const form = await req.clone().formData();
    const email = form.get("email") ?? form.get("username");
    return typeof email === "string" && email.trim() ? email : null;
  } catch {
    return null;
  }
}

function lockedResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: LOGIN_FAILURE_ERROR },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
    },
  );
}

export async function guardCredentialsCallback(
  req: Request,
  next: (req: Request) => Promise<Response>,
): Promise<Response> {
  if (!isCredentialsCallback(req.url, req.method)) return next(req);

  const ipKey = clientKey(req, "credentials-callback");
  const email = await emailFromCredentialsRequest(req);
  const emailKey = email ? credentialsEmailKey(email) : null;
  const ipBlocked = isRateLimited(ipKey, CREDENTIALS_FAIL_LIMIT);
  const emailBlocked = emailKey
    ? isRateLimited(emailKey, CREDENTIALS_FAIL_LIMIT)
    : { limited: false, retryAfterMs: 0 };
  if (ipBlocked.limited || emailBlocked.limited) {
    return lockedResponse(Math.max(ipBlocked.retryAfterMs, emailBlocked.retryAfterMs));
  }

  const res = await next(req);
  if (await credentialsResponseFailed(res)) {
    rateLimit(ipKey, CREDENTIALS_FAIL_LIMIT, CREDENTIALS_FAIL_WINDOW_MS);
    if (emailKey) rateLimit(emailKey, CREDENTIALS_FAIL_LIMIT, CREDENTIALS_FAIL_WINDOW_MS);
  }
  return res;
}
