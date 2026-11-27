import { IMAGE_MAX_BYTES, VIDEO_MAX_BYTES } from "@/lib/upload-validate";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function reviewMediaDecision(size: number, detected: string | null) {
  const ext = detected ? EXT[detected] : undefined;
  if (!detected || !ext) return { ok: false as const, error: "Chỉ nhận ảnh hoặc video" };
  const kind = detected.startsWith("video/") ? ("video" as const) : ("image" as const);
  if (size > (kind === "image" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES)) {
    return { ok: false as const, error: "File quá lớn" };
  }
  return { ok: true as const, mime: detected, kind, ext };
}
