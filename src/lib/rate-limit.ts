type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory rate limiter (single-process / SQLite local).
 * For multi-instance production, swap for Redis/Upstash.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, current.resetAt - now),
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    ok: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterMs: 0,
  };
}

/** Read-only check without incrementing. */
export function isRateLimited(
  key: string,
  limit: number,
): { limited: boolean; retryAfterMs: number } {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    return { limited: false, retryAfterMs: 0 };
  }
  if (current.count >= limit) {
    return { limited: true, retryAfterMs: Math.max(0, current.resetAt - now) };
  }
  return { limited: false, retryAfterMs: 0 };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}

export function clientKey(req: Request, suffix: string) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  return `${suffix}:${ip}`;
}
