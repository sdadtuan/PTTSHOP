/** Bỏ khoảng trắng và gạch, đổi +84/84 về đầu 0. */
export function normalizePhone(value: string) {
  const compact = value.replace(/[\s.-]/g, "");
  if (compact.startsWith("+84")) return `0${compact.slice(3)}`;
  if (compact.startsWith("84") && compact.length >= 11) return `0${compact.slice(2)}`;
  return compact;
}

export function phoneDedupKey(value: string) {
  return `phone:${normalizePhone(value)}`;
}
