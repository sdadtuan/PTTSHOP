export const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const VIDEO_MIME = new Set(["video/mp4", "video/webm"]);

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const VIDEO_EXT = new Set(["mp4", "webm"]);

export type UploadKind = "image" | "video";

export type UploadValidationOk = {
  ok: true;
  kind: UploadKind;
  ext: string;
  maxBytes: number;
  detectedMime?: string;
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
    case "image/avif":
      return ["avif"];
    case "video/mp4":
      return ["mp4"];
    case "video/webm":
      return ["webm"];
    default:
      return [];
  }
}

/** Detect real MIME from magic bytes (defense against spoofed Content-Type). */
export function detectMimeFromBuffer(buf: Uint8Array): string | null {
  if (buf.length < 12) return null;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  // WEBP: RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  // AVIF is also an ftyp box. A video file keeps the mp4 result.
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]);
    if (brand === "avif" || brand === "avis") return "image/avif";
    return "video/mp4";
  }
  // WebM (EBML)
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return "video/webm";
  }
  return null;
}

export function validateUploadFile(input: {
  mime: string;
  size: number;
  name?: string;
  buffer?: Uint8Array;
}): UploadValidationResult {
  let mime = (input.mime || "").toLowerCase();
  const name = input.name || "";
  const ext = extFromName(name);

  let detectedMime: string | undefined;
  if (input.buffer && input.buffer.length > 0) {
    const detected = detectMimeFromBuffer(input.buffer);
    if (!detected) {
      return {
        ok: false,
        status: 400,
        error: "Không nhận diện được định dạng file thật (magic bytes)",
      };
    }
    detectedMime = detected;
    if (mime && mime !== detected && !(mime === "image/jpg" && detected === "image/jpeg")) {
      // Prefer real MIME; reject if client claimed a different family
      const claimedImage = IMAGE_MIME.has(mime);
      const claimedVideo = VIDEO_MIME.has(mime);
      const realImage = IMAGE_MIME.has(detected);
      const realVideo = VIDEO_MIME.has(detected);
      if ((claimedImage && !realImage) || (claimedVideo && !realVideo) || (claimedImage && realImage && mime !== detected) || (claimedVideo && realVideo && mime !== detected)) {
        return {
          ok: false,
          status: 400,
          error: "MIME khai báo không khớp nội dung file",
        };
      }
    }
    mime = detected;
  }

  const isImage = IMAGE_MIME.has(mime);
  const isVideo = VIDEO_MIME.has(mime);

  if (!isImage && !isVideo) {
    return {
      ok: false,
      status: 400,
      error: "Chỉ nhận JPEG/PNG/WebP/AVIF/GIF hoặc MP4/WebM",
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
          : mime === "image/avif"
            ? "avif"
            : mime === "video/mp4"
            ? "mp4"
            : mime === "video/webm"
              ? "webm"
              : "jpg");

  return { ok: true, kind, ext: resolvedExt, maxBytes, detectedMime };
}

const CATALOG_IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Ảnh nhập catalog: chỉ tin nội dung file, và tên lưu chỉ dùng đuôi an toàn. */
export function validateCatalogImage(input: {
  name?: string;
  size: number;
  buffer: Uint8Array;
}): UploadValidationResult {
  if (input.size > IMAGE_MAX_BYTES) {
    return { ok: false, status: 400, error: "File tối đa 5MB" };
  }
  const detected = detectMimeFromBuffer(input.buffer);
  const ext = CATALOG_IMAGE_EXT[detected || ""];
  if (!detected || !ext) {
    return { ok: false, status: 400, error: "Chỉ nhận ảnh JPEG, PNG, WebP, AVIF hoặc GIF" };
  }
  const claimed = extFromName(input.name || "");
  if (claimed && !expectedExtForMime(detected).includes(claimed)) {
    return { ok: false, status: 400, error: "Đuôi file không khớp nội dung ảnh" };
  }
  return { ok: true, kind: "image", ext, maxBytes: IMAGE_MAX_BYTES, detectedMime: detected };
}
