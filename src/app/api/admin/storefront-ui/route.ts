import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { handleApiError } from "@/lib/api";
import {
  discardStorefrontUiDraft,
  getAdminStorefrontUiState,
  publishStorefrontUi,
  saveStorefrontUiDraft,
} from "@/lib/storefront/ui-copy";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getAdminStorefrontUiState());
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const action = body.action as string;
    if (action === "save_draft") {
      return NextResponse.json(await saveStorefrontUiDraft(body.draft));
    }
    if (action === "publish") {
      return NextResponse.json(await publishStorefrontUi());
    }
    if (action === "discard_draft") {
      return NextResponse.json(await discardStorefrontUiDraft());
    }
    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}