import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { clipQuery } from "@/lib/search/parse";

export function clipLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 8;
  return Math.min(10, Math.max(1, Math.floor(parsed)));
}

export function allowSearch(req: Request, bucket: string, limit: number) {
  return rateLimit(clientKey(req, bucket), limit, 60_000).ok;
}

export function searchJson(data: unknown, cookie?: string) {
  const response = NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
  if (cookie) {
    response.cookies.set("ptt_search", cookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return response;
}

export function readQuery(value: string | null) {
  return clipQuery(value || "");
}
