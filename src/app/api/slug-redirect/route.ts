import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSlugRedirect } from "@/lib/slug-redirect";

export async function GET(req: Request) {
  const from = new URL(req.url).searchParams.get("from")?.trim() || "";
  if (!from || from.includes("/") || from.length > 300) {
    return NextResponse.json({ to: null });
  }
  const to = await resolveSlugRedirect(prisma, from);
  return NextResponse.json({ to });
}
