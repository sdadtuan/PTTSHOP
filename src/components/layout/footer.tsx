"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Mail, Phone, Clock } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .56.04.82.12V9.01a6.27 6.27 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.2 8.2 0 0 0 4.76 1.52V6.84a4.85 4.85 0 0 1-1-.15Z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23 7.5s-.2-1.6-.9-2.3c-.8-.9-1.7-.9-2.1-1C16.9 4 12 4 12 4s-4.9 0-7.9.2c-.5.1-1.3.1-2.1 1C1.3 5.9 1 7.5 1 7.5S.8 9.4.8 11.2v1.6c0 1.9.2 3.7.2 3.7s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.7.2 7.7.2s4.9 0 7.9-.2c.5-.1 1.3-.1 2.1-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.7v-1.6c0-1.8-.2-3.7-.2-3.7ZM9.8 14.8V8.9l6.1 3-6.1 2.9Z" />
    </svg>
  );
}

function SparkLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 1.5 13.8 8.2 20.5 10 13.8 11.8 12 18.5 10.2 11.8 3.5 10 10.2 8.2 12 1.5Z"
      />
      <path
        fill="currentColor"
        d="M19 3.2 19.7 5.8 22.3 6.5 19.7 7.2 19 9.8 18.3 7.2 15.7 6.5 18.3 5.8 19 3.2Z"
        opacity="0.9"
      />
    </svg>
  );
}

const columns = [
  {
    title: "Mua sắm",
    links: [
      { href: "/san-pham?sort=newest", label: "Sản phẩm mới" },
      { href: "/san-pham?category=ao-thun", label: "Áo thun" },
      { href: "/san-pham?category=ao-khoac", label: "Áo khoác" },
      { href: "/san-pham?category=quan", label: "Quần" },
      { href: "/san-pham?category=phu-kien", label: "Phụ kiện" },
      { href: "/san-pham?sale=1", label: "Sale" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { href: "/ho-tro/mua-hang", label: "Hướng dẫn mua hàng" },
      { href: "/ho-tro/doi-tra", label: "Chính sách đổi trả" },
      { href: "/ho-tro/van-chuyen", label: "Chính sách vận chuyển" },
      { href: "/ho-tro/thanh-toan", label: "Phương thức thanh toán" },
      { href: "/ho-tro/cau-hoi", label: "Câu hỏi thường gặp" },
    ],
  },
  {
    title: "Về chúng tôi",
    links: [
      { href: "/ve-chung-toi", label: "Câu chuyện thương hiệu" },
      { href: "/ve-chung-toi#gia-tri", label: "Giá trị cốt lõi" },
      { href: "/bo-suu-tap", label: "Bộ sưu tập" },
      { href: "/tin-tuc", label: "Tin tức" },
      { href: "/tuyen-dung", label: "Tuyển dụng" },
      { href: "/lien-he", label: "Liên hệ" },
    ],
  },
];

const social = [
  { href: "https://instagram.com", label: "Instagram", Icon: InstagramIcon },
  { href: "https://facebook.com", label: "Facebook", Icon: FacebookIcon },
  { href: "https://tiktok.com", label: "TikTok", Icon: TikTokIcon },
  { href: "https://youtube.com", label: "YouTube", Icon: YoutubeIcon },
] as const;

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-black/5 bg-white text-neutral-700">
      <div
        className="pointer-events-none absolute top-6 right-[18%] h-16 w-16 rotate-[22deg] rounded-2xl bg-[var(--accent)]/85"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-16 right-[10%] h-12 w-12 -rotate-[14deg] rounded-xl bg-neutral-300/90"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-10 md:px-6">
        <div className="flex flex-col gap-8 border-b border-black/5 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5">
              <SparkLogo className="h-8 w-8 text-[var(--accent)] md:h-9 md:w-9" />
              <p className="font-[family-name:var(--font-display)] text-4xl font-black tracking-[0.12em] text-neutral-900 md:text-5xl">
                VIZFAS
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-[15px]">
              Thời trang hiện đại, tối giản và khác biệt cho thế hệ trẻ tự tin
              thể hiện phong cách mỗi ngày.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {social.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-[var(--accent)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-bold tracking-wide text-neutral-900">
                {col.title}
              </p>
              <span
                className="mt-2 block h-[3px] w-9 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
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
            <p className="text-sm font-bold tracking-wide text-neutral-900">
              Liên hệ
            </p>
            <span
              className="mt-2 block h-[3px] w-9 rounded-full bg-[var(--accent)]"
              aria-hidden
            />
            <ul className="mt-4 space-y-3 text-sm text-neutral-500">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <a href="mailto:hello@vizfas.vn" className="hover:text-[var(--accent)]">
                  hello@vizfas.vn
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <a href="tel:0321456789" className="hover:text-[var(--accent)]">
                  0321 456 789
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>Thứ 2 – Chủ Nhật 8:00 – 22:00</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-xs text-neutral-500 md:flex-row md:items-center md:px-6">
          <p>© {new Date().getFullYear()} VIZFAS. Tất cả quyền được bảo lưu.</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link href="/chinh-sach/dieu-khoan" className="hover:text-neutral-800">
              Điều khoản sử dụng
            </Link>
            <span aria-hidden>|</span>
            <Link href="/chinh-sach/bao-mat" className="hover:text-neutral-800">
              Chính sách bảo mật
            </Link>
            <span aria-hidden>|</span>
            <Link href="/chinh-sach/cookie" className="hover:text-neutral-800">
              Chính sách cookie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
