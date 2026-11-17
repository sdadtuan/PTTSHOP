import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { handleApiError } from "@/lib/api";
import { validateUploadFile } from "@/lib/upload-validate";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
    }

    const result = validateUploadFile({
      mime: file.type,
      size: file.size,
      name: file.name,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${result.ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buf);

    return NextResponse.json({
      url: `/uploads/${name}`,
      kind: result.kind,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
