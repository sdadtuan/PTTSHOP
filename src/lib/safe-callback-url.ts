const AUTH_PAGES = new Set([
  "/dang-nhap",
  "/dang-ky",
  "/quen-mat-khau",
  "/dat-lai-mat-khau",
]);

/**
 * Only allow same-origin relative paths. Reject auth pages to avoid
 * login ↔ callback redirect loops.
 */
export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/",
): string {
  if (!raw) return fallback;

  let path: string;
  try {
    if (raw.startsWith("/")) {
      path = raw;
    } else {
      // Absolute URLs only accepted if we can treat them as path-only later;
      // reject outright to avoid open redirects.
      return fallback;
    }
  } catch {
    return fallback;
  }

  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.includes("\\") || path.includes("@")) return fallback;

  const pathname = path.split(/[?#]/, 1)[0] || "/";
  if (AUTH_PAGES.has(pathname) || pathname.startsWith("/api/auth")) {
    return fallback;
  }

  return path;
}
