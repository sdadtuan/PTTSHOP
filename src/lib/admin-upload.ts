import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { ensurePublicMediaLink, mediaRoot } from "@/lib/catalog-import-commit";
import {
  VIDEO_MAX_BYTES,
  detectMimeFromBuffer,
  validateCatalogImage,
  validateUploadFile,
} from "@/lib/upload-validate";
import { ADMIN_UPLOAD_PATH } from "@/lib/admin-upload-path";

export { ADMIN_UPLOAD_PATH };

export type StoredAdminUpload =
  | { ok: true; url: string; kind: "image" | "video" }
  | { ok: false; status: number; error: string };

function storedName(ext: string) {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
}

/** Images go to data/media/uploads. Videos stay on public/uploads (Nginx only serves images). */
export async function storeAdminUpload(file: File): Promise<StoredAdminUpload> {
  if (file.size > VIDEO_MAX_BYTES) {
    return { ok: false, status: 400, error: "File quá lớn" };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const detected = detectMimeFromBuffer(buf);

  if (detected === "video/mp4" || detected === "video/webm") {
    const result = validateUploadFile({
      mime: file.type,
      size: file.size,
      name: file.name,
      buffer: buf,
    });
    if (!result.ok) return { ok: false, status: result.status, error: result.error };
    const name = storedName(result.ext);
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf);
    return { ok: true, url: `/uploads/${name}`, kind: "video" };
  }

  const image = validateCatalogImage({
    name: file.name,
    size: file.size,
    buffer: buf,
  });
  if (!image.ok) return { ok: false, status: image.status, error: image.error };
  const name = storedName(image.ext);
  await ensurePublicMediaLink();
  const dir = path.join(mediaRoot(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return { ok: true, url: `/media/uploads/${name}`, kind: "image" };
}
