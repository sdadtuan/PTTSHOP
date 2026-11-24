import { NextResponse } from "next/server";
import { enforceAdmin } from "@/lib/rbac-access";
import { handleApiError } from "@/lib/api";
import {
  discardStorefrontUiDraft,
  getAdminStorefrontUiState,
  publishStorefrontUi,
  saveStorefrontUiDraft,
} from "@/lib/storefront/ui-copy";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    return NextResponse.json(await getAdminStorefrontUiState());
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
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