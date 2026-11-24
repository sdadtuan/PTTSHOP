type FooterColumn = { title: string; links: { href: string; label: string }[] };

const LOOKUP = { href: "/tra-cuu-don", label: "Tra cứu đơn hàng" };

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

/** Thêm link tra cứu vào cột hỗ trợ nếu chưa có. Không đổi các cột khác. */
export function withOrderLookupLink<T extends FooterColumn>(columns: T[]): T[] {
  const index = columns.findIndex(
    (column) => fold(column.title).includes("ho tro") || column.links.some((link) => link.href.startsWith("/ho-tro")),
  );
  if (index < 0 || columns[index].links.some((link) => link.href === LOOKUP.href)) return columns;
  return columns.map((column, i) =>
    i === index ? { ...column, links: [...column.links, LOOKUP] } : column,
  );
}
