import { randomUUID } from "crypto";
import { mkdir, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { ensurePublicMediaLink, mediaRoot } from "@/lib/catalog-import-commit";
import {
  VIDEO_MAX_BYTES,
  detectMimeFromBuffer,
  validateCatalogImage,
  validateUploadFile,
} from "@/lib/upload-validate";
import { ADMIN_UPLOAD_PATH } from "@/lib/admin-upload-path";
import { codecError, faststartMp4, posterAtOneSecond, videoCodecName } from "@/lib/video-ffmpeg";
import { inspectMp4 } from "@/lib/video-file";

export { ADMIN_UPLOAD_PATH };

export type StoredAdminUpload =
  | { ok: true; url: string; kind: "image" | "video"; posterUrl: string | null }
  | { ok: false; status: number; error: string };

function storedName(ext: string) {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
}

async function storeVideo(buf: Buffer, ext: string): Promise<StoredAdminUpload> {
  let faststart = false;
  if (ext === "mp4") {
    const inspected = inspectMp4(buf);
    if (!inspected.ok) return { ok: false, status: 400, error: inspected.error };
    faststart = inspected.faststart;
  }
  await ensurePublicMediaLink();
  const dir = path.join(mediaRoot(), "uploads");
  await mkdir(dir, { recursive: true });
  const name = storedName(ext);
  const dest = path.join(dir, name);
  const posterFile = path.join(dir, name.replace(/\.[^.]+$/, ".jpg"));
  await writeFile(dest, buf);
  const codec = codecError(await videoCodecName(dest));
  if (codec) {
    await rm(dest, { force: true });
    return { ok: false, status: 400, error: codec };
  }
  if (faststart) {
    const tmp = `${dest}.faststart.mp4`;
    try {
      await faststartMp4(dest, tmp);
      await rename(tmp, dest);
    } catch {
      await rm(tmp, { force: true });
      await rm(dest, { force: true });
      return { ok: false, status: 500, error: "Không chuyển được video sang faststart" };
    }
  }
  try {
    await posterAtOneSecond(dest, posterFile);
  } catch {
    await rm(dest, { force: true });
    await rm(posterFile, { force: true });
    return { ok: false, status: 500, error: "Không tạo được ảnh poster" };
  }
  return {
    ok: true,
    url: `/media/uploads/${name}`,
    posterUrl: `/media/uploads/${path.basename(posterFile)}`,
    kind: "video",
  };
}

/** Ảnh và video đều ghi data/media/uploads, URL /media/uploads/. */
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
    return storeVideo(buf, result.ext);
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
  return { ok: true, url: `/media/uploads/${name}`, kind: "image", posterUrl: null };
}
