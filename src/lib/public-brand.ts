const PLACEHOLDER_PHONE_DIGITS = new Set(["0321456789", "0901234567"]);

/** Tên hiển thị. Giá trị CMS trống hoặc còn VIZFAS thì dùng PTT Shop. Không sửa dòng trong database. */
export function displayBrandName(value: string | null | undefined, fallback = "PTT Shop") {
  const text = (value || "").replace(/vizfas/gi, fallback).trim();
  return text || fallback;
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
