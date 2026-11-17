import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/categories", label: "Danh mục" },
  { href: "/admin/customers", label: "Khách hàng" },
  { href: "/admin/coupons", label: "Mã giảm" },
  { href: "/admin/reviews", label: "Đánh giá" },
];

export function AdminNav({ current }: { current?: string }) {
  return (
    <nav className="mt-6 flex flex-wrap gap-2 border-b border-neutral-100 pb-4 text-sm">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            current === l.href
              ? "rounded bg-neutral-900 px-3 py-1.5 text-white"
              : "rounded px-3 py-1.5 text-neutral-600 hover:bg-neutral-100"
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
