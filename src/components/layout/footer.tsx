"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const columns = [
  {
    title: "Mua sắm",
    links: [
      { href: "/san-pham?category=ao-thun", label: "Áo thun" },
      { href: "/san-pham?category=ao-khoac", label: "Áo khoác" },
      { href: "/san-pham?category=quan", label: "Quần" },
      { href: "/san-pham?category=hoodie", label: "Hoodie" },
      { href: "/san-pham?category=phu-kien", label: "Phụ kiện" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { href: "/tai-khoan/don-hang", label: "Theo dõi đơn hàng" },
      { href: "/ho-tro/doi-tra", label: "Đổi trả" },
      { href: "/ho-tro/bang-size", label: "Bảng size" },
      { href: "/ho-tro/van-chuyen", label: "Vận chuyển" },
      { href: "/ho-tro/cau-hoi", label: "Câu hỏi thường gặp" },
    ],
  },
  {
    title: "Về chúng tôi",
    links: [
      { href: "/ve-chung-toi", label: "Câu chuyện thương hiệu" },
      { href: "/bo-suu-tap", label: "Bộ sưu tập" },
      { href: "/lien-he", label: "Tuyển dụng / Liên hệ" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-black/5 bg-[var(--background)] text-neutral-700">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 md:px-6">
        <div className="flex flex-col gap-6 border-b border-black/5 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[0.2em] text-neutral-900">
              VIZFAS
              <span className="ml-1 inline-block text-[var(--accent)]" aria-hidden>
                ✦
              </span>
            </p>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              Thời trang đơn giản, vẫn nổi bật — form hiện đại, dễ phối mỗi ngày.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold tracking-wide text-neutral-600">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-neutral-200 px-3 py-2 transition hover:border-neutral-900"
            >
              FB
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-neutral-200 px-3 py-2 transition hover:border-neutral-900"
            >
              IG
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-neutral-200 px-3 py-2 transition hover:border-neutral-900"
            >
              TT
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-neutral-200 px-3 py-2 transition hover:border-neutral-900"
            >
              YT
            </a>
          </div>
        </div>

        <div className="grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold tracking-wide text-neutral-900">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 transition hover:text-[var(--accent)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-sm font-semibold tracking-wide text-neutral-900">
              Liên hệ
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
              <li>123 Nguyễn Huệ, Quận 1, TP.HCM</li>
              <li>
                <a href="mailto:hello@vizfas.vn" className="hover:text-[var(--accent)]">
                  hello@vizfas.vn
                </a>
              </li>
              <li>
                <a href="tel:0901234567" className="hover:text-[var(--accent)]">
                  0901 234 567
                </a>
              </li>
              <li>Giờ làm việc: 9:00 – 21:00</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-xs text-neutral-500 md:flex-row md:items-center md:px-6">
          <p>© {new Date().getFullYear()} VIZFAS. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/chinh-sach/dieu-khoan" className="hover:text-neutral-800">
              Điều khoản sử dụng
            </Link>
            <Link href="/chinh-sach/bao-mat" className="hover:text-neutral-800">
              Chính sách bảo mật
            </Link>
            <Link href="/chinh-sach/van-chuyen" className="hover:text-neutral-800">
              Quy định bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
