import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { adminEntryRedirect } from "@/lib/admin-gate";

const CMS_PREVIEW_HEADER = "x-cms-preview";

export default auth((req) => {
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

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/admin", "/admin/:path*"],
};
