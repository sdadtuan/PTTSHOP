export const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const VIDEO_MIME = new Set(["video/mp4", "video/webm"]);

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXT = new Set(["mp4", "webm"]);

export type UploadKind = "image" | "video";

export type UploadValidationOk = {
  ok: true;
  kind: UploadKind;
  ext: string;
  maxBytes: number;
};

export type UploadValidationErr = {
  ok: false;
  status: number;
  error: string;
};

export type UploadValidationResult = UploadValidationOk | UploadValidationErr;

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i + 1).toLowerCase();
}

function expectedExtForMime(mime: string): string[] {
  switch (mime) {
    case "image/jpeg":
      return ["jpg", "jpeg"];
    case "image/png":
      return ["png"];
    case "image/webp":
      return ["webp"];
    case "image/gif":
      return ["gif"];
    case "video/mp4":
      return ["mp4"];
    case "video/webm":
      return ["webm"];
    default:
      return [];
  }
}

export function validateUploadFile(input: {
  mime: string;
  size: number;
  name?: string;
}): UploadValidationResult {
  const mime = (input.mime || "").toLowerCase();
  const name = input.name || "";
  const ext = extFromName(name);

  const isImage = IMAGE_MIME.has(mime);
  const isVideo = VIDEO_MIME.has(mime);

  if (!isImage && !isVideo) {
    return {
      ok: false,
      status: 400,
      error: "Chỉ nhận JPEG/PNG/WebP/GIF hoặc MP4/WebM",
    };
  }

  if (ext) {
    const allowedExt = isImage ? IMAGE_EXT : VIDEO_EXT;
    if (!allowedExt.has(ext)) {
      return {
        ok: false,
        status: 400,
        error: isImage
          ? "Đuôi file ảnh không hợp lệ"
          : "Đuôi file video không hợp lệ",
      };
    }
    const expected = expectedExtForMime(mime);
    if (expected.length && !expected.includes(ext)) {
      return {
        ok: false,
        status: 400,
        error: "MIME và đuôi file không khớp",
      };
    }
  }

  const kind: UploadKind = isVideo ? "video" : "image";
  const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (input.size > maxBytes) {
    return {
      ok: false,
      status: 400,
      error: isVideo ? "Video tối đa 100MB" : "File tối đa 5MB",
    };
  }

  const resolvedExt =
    ext ||
    (mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : mime === "image/gif"
          ? "gif"
          : mime === "video/mp4"
            ? "mp4"
            : mime === "video/webm"
              ? "webm"
              : "jpg");

  return { ok: true, kind, ext: resolvedExt, maxBytes };
}
