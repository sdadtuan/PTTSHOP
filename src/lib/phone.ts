/** Số di động / máy bàn 10 số. Lưu `0xxxxxxxxx`. Đơn cũ không bị ghi lại. */
export function normalizeVnPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s.]+/g, "");
  const digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (!/^\d+$/.test(digits)) return null;
  const local = digits.startsWith("84") && digits.length === 11 ? `0${digits.slice(2)}` : digits;
  return /^0\d{9}$/.test(local) ? local : null;
}

/** Khớp đơn mới đã chuẩn hóa, và vẫn khớp đơn cũ không đúng dạng 10 số. */
export function phonesMatch(stored: string, input: string): boolean {
  const left = normalizeVnPhone(stored);
  const right = normalizeVnPhone(input);
  if (left && right) return left === right;
  return stored.replace(/[\s.]+/g, "") === input.replace(/[\s.]+/g, "");
}
