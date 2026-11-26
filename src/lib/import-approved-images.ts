/**
 * Kế hoạch gắn 12 ảnh đã duyệt làm ảnh chính và ẩn mọi ảnh Unsplash của đúng các sản phẩm đó.
 * Không xóa dòng, không đụng sản phẩm demo.
 */

/** Danh mục Áo thun nhận ảnh shop của Áo Thun Nam Basic. */
export const AO_THUN_CATEGORY_SLUG = "ao-thun";
export const AO_THUN_COVER_SLUG = "ao-thun-nam-basic";

/** Thư mục log id đã tạo và đã ẩn. Không đổi theo môi trường. */
export const IMPORT_BACKUP_DIR = "/var/backups/pttshop";

export const APPROVED_SLUGS = [
  "ao-polo-essential",
  "ao-thun-raglan",
  "tui-deo-cheo",
  "non-baseball",
  "quan-kaki",
  "quan-cargo",
  "ao-khoac-varsity",
  "ao-khoac-bomber",
  "ao-hoodie-essential",
  "ao-thun-nu-basic",
  "ao-thun-nam-basic",
  "ao-thun-oversize",
] as const;

export type ApprovedSlug = (typeof APPROVED_SLUGS)[number];

export type ExistingProductImage = {
  id: string;
  url: string;
  sortOrder: number;
  isHidden: boolean;
  /** sha256 của file trên đĩa, nếu URL là /media/uploads và file đọc được. */
  sha256: string | null;
};

export type ImageUpdate = {
  id: string;
  sortOrder: number;
  isHidden: boolean;
  previous: { sortOrder: number; isHidden: boolean };
};

export type ImagePlan = {
  /** Chưa có dòng nào trùng sha256 của ảnh đã duyệt. */
  needsCreate: boolean;
  updates: ImageUpdate[];
};

export function isUnsplashImageUrl(url: string): boolean {
  return url.startsWith("https://images.unsplash.com/");
}

/**
 * URL Unsplash được thay. `replacement` null nghĩa là để trống (placeholder / ảnh sản phẩm kế tiếp).
 * URL shop hoặc ô trống giữ nguyên.
 */
export function planUnsplashField(
  current: string | null,
  replacement: string | null,
): { next: string | null; change: boolean } {
  if (!current || !isUnsplashImageUrl(current)) return { next: current, change: false };
  if (current === replacement) return { next: current, change: false };
  return { next: replacement, change: true };
}

export type ImportLog = {
  database: string;
  created: Array<{ id: string; slug: string; url: string }>;
  hidden: Array<{ id: string; slug: string }>;
  reordered: Array<{ id: string; slug: string; previousSortOrder: number; nextSortOrder: number }>;
  categories: Array<{ id: string; slug: string; previous: string | null; next: string | null }>;
  collections: Array<{ id: string; slug: string; previous: string | null; next: string | null }>;
};

function sqlLiteral(value: string | null): string {
  if (value === null) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

/** Lệnh quay lui đúng các id trong log. Không đụng dòng khác. */
export function rollbackSql(log: ImportLog): string {
  const created = log.created.map((row) => sqlLiteral(row.id)).join(", ");
  const hidden = log.hidden.map((row) => sqlLiteral(row.id)).join(", ");
  const lines = [
    "BEGIN;",
    created
      ? `DELETE FROM "ProductImage" WHERE id IN (${created});`
      : "-- không có dòng ProductImage mới",
    hidden
      ? `UPDATE "ProductImage" SET "isHidden" = false WHERE id IN (${hidden});`
      : "-- không có ảnh đã ẩn",
  ];
  for (const row of log.reordered) {
    if (!Number.isInteger(row.previousSortOrder)) throw new Error("sortOrder không hợp lệ");
    lines.push(
      `UPDATE "ProductImage" SET "sortOrder" = ${row.previousSortOrder} WHERE id = ${sqlLiteral(row.id)};`,
    );
  }
  for (const row of log.categories) {
    lines.push(
      `UPDATE "Category" SET image = ${sqlLiteral(row.previous)} WHERE id = ${sqlLiteral(row.id)};`,
    );
  }
  for (const row of log.collections) {
    lines.push(
      `UPDATE "Collection" SET image = ${sqlLiteral(row.previous)} WHERE id = ${sqlLiteral(row.id)};`,
    );
  }
  lines.push("COMMIT;");
  return `${lines.join("\n")}\n`;
}

/** Rộng/cao của WebP VP8 hoặc VP8X. Trả null nếu không đọc được. */
export function webpDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const tag = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (tag === "VP8 ") {
      if (buf.length < data + 10) return null;
      if (buf[data + 3] !== 0x9d || buf[data + 4] !== 0x01 || buf[data + 5] !== 0x2a) return null;
      return {
        width: buf.readUInt16LE(data + 6) & 0x3fff,
        height: buf.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    if (tag === "VP8X") {
      if (buf.length < data + 10) return null;
      return {
        width: 1 + (buf[data + 4]! | (buf[data + 5]! << 8) | (buf[data + 6]! << 16)),
        height: 1 + (buf[data + 7]! | (buf[data + 8]! << 8) | (buf[data + 9]! << 16)),
      };
    }
    const padded = size + (size % 2);
    offset = data + padded;
    if (padded < 0) return null;
  }
  return null;
}

/**
 * Ảnh đã duyệt (cùng sha256) đứng sortOrder 0 và hiện.
 * Mọi URL Unsplash của sản phẩm này đặt isHidden, không xóa.
 * Ảnh khác (kể cả placeholder) chỉ bị đẩy xuống sau.
 * Gọi lại khi đã đúng thì updates rỗng và needsCreate false.
 */
export function planApprovedPrimary(input: {
  images: ExistingProductImage[];
  approvedSha256: string;
}): ImagePlan {
  const ordered = [...input.images].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
  const approved = ordered.find((image) => image.sha256 === input.approvedSha256);
  const rest = ordered.filter((image) => image !== approved);
  const sequence = approved ? [approved, ...rest] : rest;
  const updates: ImageUpdate[] = [];
  sequence.forEach((image, index) => {
    const sortOrder = approved ? index : index + 1;
    const isHidden = isUnsplashImageUrl(image.url) ? true : image === approved ? false : image.isHidden;
    if (image.sortOrder !== sortOrder || image.isHidden !== isHidden) {
      updates.push({
        id: image.id,
        sortOrder,
        isHidden,
        previous: { sortOrder: image.sortOrder, isHidden: image.isHidden },
      });
    }
  });
  return { needsCreate: !approved, updates };
}
