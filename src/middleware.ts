import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    const url = new URL("/dang-nhap", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
