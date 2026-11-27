/** Chữ thường, bỏ dấu, đ → d. Giữ gạch ngang để còn nhận khoảng giá 200-400k. */
export function foldVi(value: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function foldKey(value: string) {
  return foldVi(value).replace(/[_.]+/g, " ").replace(/\s+/g, " ").trim();
}
