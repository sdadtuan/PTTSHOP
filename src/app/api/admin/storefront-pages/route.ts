import { NextResponse } from "next/server";
import { enforceAdmin } from "@/lib/rbac-access";
import { handleApiError } from "@/lib/api";
import {
  listAdminStorefrontPages,
  publishStorefrontPage,
  saveStorefrontPage,
} from "@/lib/storefront/pages";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    return NextResponse.json({ pages: await listAdminStorefrontPages() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
  } catch (err) {
    return handleApiError(err);
  }
  const body = await req.json();
  const action = body.action as string;

  if (action === "save") {
    const { id, draftTitle, draftDescription, draftBody } = body;
    if (!id || !draftTitle) {
      return NextResponse.json({ error: "Thiếu id hoặc tiêu đề" }, { status: 400 });
    }
    await saveStorefrontPage({
      id,
      draftTitle,
      draftDescription: draftDescription ?? null,
      draftBody: Array.isArray(draftBody) ? draftBody : [],
    });
    return NextResponse.json({ ok: true, pages: await listAdminStorefrontPages() });
  }

  if (action === "publish") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
    await publishStorefrontPage(id);
    return NextResponse.json({ ok: true, pages: await listAdminStorefrontPages() });
  }

  return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
}