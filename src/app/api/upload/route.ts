import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { handleApiError } from "@/lib/api";
import { storeAdminUpload } from "@/lib/admin-upload";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
    }

    const stored = await storeAdminUpload(file);
    if (!stored.ok) {
      return NextResponse.json({ error: stored.error }, { status: stored.status });
    }
    return NextResponse.json({ url: stored.url, kind: stored.kind });
  } catch (err) {
    return handleApiError(err);
  }
}
