import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { handleApiError } from "@/lib/api";
import { ensurePublicMediaLink, mediaRoot } from "@/lib/catalog-import-commit";
import {
  VIDEO_MAX_BYTES,
  detectMimeFromBuffer,
  validateCatalogImage,
  validateUploadFile,
} from "@/lib/upload-validate";

function storedName(ext: string) {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
    }

    // Reject oversize files before reading them into memory.
    if (file.size > VIDEO_MAX_BYTES) {
      return NextResponse.json({ error: "File quá lớn" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const detected = detectMimeFromBuffer(buf);

    // Video stays on public/uploads. Nginx /media/uploads only serves images.
    if (detected === "video/mp4" || detected === "video/webm") {
      const result = validateUploadFile({
        mime: file.type,
        size: file.size,
        name: file.name,
        buffer: buf,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      const name = storedName(result.ext);
      const dir = path.join(process.cwd(), "public", "uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), buf);
      return NextResponse.json({ url: `/uploads/${name}`, kind: "video" });
    }

    // Logo, banner, giao diện, ảnh sản phẩm: same byte check and random name as /media/catalog.
    const image = validateCatalogImage({
      name: file.name,
      size: file.size,
      buffer: buf,
    });
    if (!image.ok) {
      return NextResponse.json({ error: image.error }, { status: image.status });
    }
    const name = storedName(image.ext);
    await ensurePublicMediaLink();
    const dir = path.join(mediaRoot(), "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf);
    return NextResponse.json({ url: `/media/uploads/${name}`, kind: "image" });
  } catch (err) {
    return handleApiError(err);
  }
}
