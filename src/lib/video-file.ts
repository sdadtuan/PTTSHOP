const FORBIDDEN = new Set([
  "hev1",
  "hvc1",
  "dvh1",
  "dvhe",
  "apch",
  "apcn",
  "apcs",
  "apco",
  "ap4h",
  "ap4x",
]);

const CONTAINERS = new Set([
  "moov",
  "trak",
  "mdia",
  "minf",
  "stbl",
  "edts",
  "dinf",
  "udta",
  "mvex",
  "moof",
  "traf",
]);

export const VIDEO_CODEC_ERROR = "Không nhận video HEVC hoặc ProRes";

export type Mp4Inspect =
  | { ok: true; faststart: boolean }
  | { ok: false; error: string };

function brandAt(buf: Buffer, offset: number) {
  if (offset + 4 > buf.length) return "";
  return buf.toString("latin1", offset, offset + 4);
}

function walk(buf: Buffer, start: number, end: number): string | null {
  let offset = start;
  while (offset + 8 <= end) {
    let size = buf.readUInt32BE(offset);
    const type = brandAt(buf, offset + 4);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > end) return "File MP4 không đọc được";
      const large = buf.readBigUInt64BE(offset + 8);
      if (large > BigInt(Number.MAX_SAFE_INTEGER)) return "File MP4 không đọc được";
      size = Number(large);
      header = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < header || offset + size > end) return "File MP4 không đọc được";
    if (FORBIDDEN.has(type)) return VIDEO_CODEC_ERROR;
    const payload = offset + header;
    if (type === "ftyp") {
      for (let i = payload; i + 4 <= offset + size; i += 4) {
        if (i === payload + 4) continue;
        if (FORBIDDEN.has(brandAt(buf, i))) return VIDEO_CODEC_ERROR;
      }
    } else if (type === "stsd") {
      const nested = walk(buf, payload + 8, offset + size);
      if (nested) return nested;
    } else if (CONTAINERS.has(type)) {
      const nested = walk(buf, payload, offset + size);
      if (nested) return nested;
    }
    offset += size;
  }
  return null;
}

function topLevel(buf: Buffer) {
  const boxes: { type: string; offset: number }[] = [];
  let offset = 0;
  while (offset + 8 <= buf.length) {
    let size = buf.readUInt32BE(offset);
    const type = brandAt(buf, offset + 4);
    if (size === 1) {
      if (offset + 16 > buf.length) break;
      const large = buf.readBigUInt64BE(offset + 8);
      if (large > BigInt(Number.MAX_SAFE_INTEGER)) break;
      size = Number(large);
    } else if (size === 0) {
      size = buf.length - offset;
    }
    if (size < 8 || offset + size > buf.length) break;
    boxes.push({ type, offset });
    offset += size;
  }
  return boxes;
}

/** Đọc hộp MP4. HEVC/ProRes bị từ chối. faststart khi moov đứng sau mdat. */
export function inspectMp4(buf: Buffer): Mp4Inspect {
  const boxes = topLevel(buf);
  const moov = boxes.find((box) => box.type === "moov");
  const mdat = boxes.find((box) => box.type === "mdat");
  if (!moov) return { ok: false, error: "File MP4 thiếu moov" };
  const problem = walk(buf, 0, buf.length);
  if (problem) return { ok: false, error: problem };
  const faststart = Boolean(mdat && moov.offset > mdat.offset);
  return { ok: true, faststart };
}
