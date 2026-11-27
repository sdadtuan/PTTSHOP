const PLACEHOLDER_PHONE_DIGITS = new Set(["0321456789", "0901" + "234567"]);

/** Chuỗi public. Không ghi đè database. Tên cũ và lỗi “Nữmỗi” được sửa lúc hiển thị. */
export function publicCopy(value: string | null | undefined, fallback = "") {
  const text = (value || "")
    .replace(/vizfas(?:\.vn)?/gi, "PTT Shop")
    .replace(/\bWEARLY\b/gi, "PTT Shop")
    .replace(/Nữmỗi/g, "Nữ mỗi")
    .replace(/PTT Shop(?:\s+PTT Shop)+/g, "PTT Shop")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return text || fallback;
}

/** Tên hiển thị. Giá trị CMS trống hoặc còn tên cũ thì dùng PTT Shop. Không sửa dòng trong database. */
export function displayBrandName(value: string | null | undefined, fallback = "PTT Shop") {
  return publicCopy(value, "") || fallback;
}

/** Chữ nền trang chủ. Tên theme cũ thì ẩn, không thay bằng chữ khác. */
export function publicWatermark(value: string | null | undefined) {
  const text = (value || "").trim();
  if (!text || /wearly|vizfas/i.test(text)) return "";
  return text;
}

/** Nhãn menu. “Đánh giá” viết thường được đưa về “Đánh Giá”. */
export function publicNavLabel(label: string) {
  const text = publicCopy(label);
  if (/^đánh giá$/i.test(text)) return "Đánh Giá";
  return text;
}

export function visiblePhone(value: string | null | undefined) {
  const raw = (value || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!raw || raw.includes("[cần chốt]") || PLACEHOLDER_PHONE_DIGITS.has(digits)) return "";
  return raw;
}

export function visibleEmail(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw || raw.includes("[cần chốt]") || /vizfas/i.test(raw)) return "";
  return raw;
}

/** Ẩn href rỗng và các link mẫu (facebook.com, m.me/vizfas, số giả). */
export function visibleHref(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw || raw === "#") return "";
  if (/m\.me\/vizfas/i.test(raw)) return "";
  if (/^https?:\/\/(www\.)?(facebook|instagram|tiktok|youtube)\.com\/?$/i.test(raw)) return "";
  if (/^https?:\/\/(www\.)?pttshop\.vn\/?$/i.test(raw)) return "";
  if (/zalo\.me\/0*901234567/.test(raw)) return "";
  if (/^tel:/i.test(raw) && !visiblePhone(raw.replace(/^tel:/i, ""))) return "";
  if (/^mailto:/i.test(raw) && !visibleEmail(raw.replace(/^mailto:/i, ""))) return "";
  return raw;
}
