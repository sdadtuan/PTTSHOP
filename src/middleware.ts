import { NextResponse } from "next/server";
import { auth } from "@/auth";

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

  if (!req.auth?.user) {
    const url = new URL("/dang-nhap", req.nextUrl.origin);
    // Relative path only — avoids absolute callbackUrl loops with Auth.js.
    const returnTo = `${path}${req.nextUrl.search}`;
    url.searchParams.set("callbackUrl", returnTo.startsWith("/admin") ? returnTo : "/admin");
    return NextResponse.redirect(url);
  }

  if (req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/admin", "/admin/:path*"],
};
