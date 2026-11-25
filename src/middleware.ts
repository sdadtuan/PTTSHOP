import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { adminEntryRedirect } from "@/lib/admin-gate";
import { adminPermissionDenied } from "@/lib/rbac";

const CMS_PREVIEW_HEADER = "x-cms-preview";

async function oldSlugRedirect(req: { nextUrl: URL; headers: Headers }) {
  const match = req.nextUrl.pathname.match(/^\/san-pham\/([^/]+)$/);
  if (!match) return null;
  let from = match[1];
  try {
    from = decodeURIComponent(from);
  } catch {
    return null;
  }
  const port = process.env.PORT || "3000";
  const probe = new URL("/api/slug-redirect", `http://127.0.0.1:${port}`);
  probe.searchParams.set("from", from);
  try {
    const res = await fetch(probe, { cache: "no-store", signal: AbortSignal.timeout(1500) });
    if (!res.ok) return null;
    const data = (await res.json()) as { to?: string | null };
    if (!data.to || data.to === from) return null;
    const dest = new URL(req.nextUrl.href);
    dest.pathname = `/san-pham/${data.to}`;
    return NextResponse.redirect(dest, 301);
  } catch {
    return null;
  }
}

export default auth(async (req) => {
  const redirected = await oldSlugRedirect(req);
  if (redirected) return redirected;

  const path = req.nextUrl.pathname;

  if (path === "/") {
    // Never trust a client-sent preview header; only flag draft preview for ADMIN sessions.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.delete(CMS_PREVIEW_HEADER);
    if (
      req.nextUrl.searchParams.get("cmsPreview") === "draft" &&
      req.auth?.user?.role === "ADMIN"
    ) {
      requestHeaders.set(CMS_PREVIEW_HEADER, "draft");
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!path.startsWith("/admin")) {
    return NextResponse.next();
  }

  const gate = adminEntryRedirect(req.nextUrl.origin, path, req.nextUrl.search, req.auth?.user ?? null);
  if (gate) {
    return NextResponse.redirect(new URL(gate.location, req.nextUrl.origin), gate.status);
  }

  const denied = adminPermissionDenied(path, req.auth?.user ?? null);
  if (denied) {
    return new NextResponse(denied.message, { status: denied.status, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/admin", "/admin/:path*", "/san-pham/:path*"],
};
