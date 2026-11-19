"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { useSiteBrand } from "@/components/cms/site-brand-context";
import { TYPE_SCALE } from "@/config/home-type-scale";

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

export function Footer() {
  const pathname = usePathname();
  const brand = useSiteBrand();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/demo-v2")) return null;

  const social = [
    { href: brand.socialInstagram || "https://instagram.com", label: "Instagram", Icon: InstagramIcon },
    { href: brand.socialFacebook || "https://facebook.com", label: "Facebook", Icon: FacebookIcon },
    { href: brand.socialTiktok || "https://tiktok.com", label: "TikTok", Icon: TikTokIcon },
    { href: brand.socialYoutube || "https://youtube.com", label: "YouTube", Icon: YoutubeIcon },
  ] as const;

  const brandName = brand.brandName || "VIZFAS";

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-black/5 bg-white text-neutral-700">
      {/* Decor — desktop only large; mobile tucked away so không đè logo */}
      <div
        className="pointer-events-none absolute top-4 right-[-10%] z-0 h-24 w-24 rotate-[22deg] rounded-[1.5rem] bg-[var(--accent)]/70 sm:right-[14%] sm:h-44 sm:w-44 sm:rounded-[2rem] sm:bg-[var(--accent)]/90 md:h-52 md:w-52"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-36 right-[-6%] z-0 hidden h-32 w-32 -rotate-[14deg] rounded-3xl bg-neutral-300 sm:block md:top-28 md:right-[5%] md:h-40 md:w-40"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl overflow-hidden px-4 pt-16 pb-12 md:px-6 md:pt-20 md:pb-14">
        <div className="flex flex-col gap-8 border-b border-black/5 pb-10 md:flex-row md:items-start md:justify-between md:pb-14">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 md:gap-4">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoUrl}
                  alt=""
                  className="h-10 w-10 object-contain md:h-14 md:w-14"
                />
              ) : (
                <SparkLogo className="h-10 w-10 shrink-0 text-[var(--accent)] md:h-14 md:w-14" />
              )}
              <p
                className="font-[family-name:var(--font-display)] font-black tracking-[0.12em] text-neutral-900"
                style={{ fontSize: TYPE_SCALE.footerLogo.css }}
              >
                {brandName}
              </p>
            </div>
            <p
              className="mt-5 leading-relaxed text-neutral-600"
              style={{ fontSize: TYPE_SCALE.footerTagline.css }}
            >
              {brand.footerTagline}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {social.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-[var(--accent)]"
                >
                  <Icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <p
                className="font-bold tracking-wide text-neutral-900"
                style={{ fontSize: TYPE_SCALE.footerTagline.css }}
              >
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
                      className="text-neutral-500 transition hover:text-[var(--accent)]"
                      style={{ fontSize: TYPE_SCALE.footerLink.css }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p
              className="font-bold tracking-wide text-neutral-900"
              style={{ fontSize: TYPE_SCALE.footerTagline.css }}
            >
              Liên hệ
            </p>
            <span
              className="mt-2 block h-[3px] w-9 rounded-full bg-[var(--accent)]"
              aria-hidden
            />
            <ul
              className="mt-4 space-y-3 text-neutral-500"
              style={{ fontSize: TYPE_SCALE.footerLink.css }}
            >
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>{brand.contactAddress}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <a
                  href={`mailto:${brand.contactEmail}`}
                  className="hover:text-[var(--accent)]"
                >
                  {brand.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <a
                  href={`tel:${brand.contactPhone.replace(/\s/g, "")}`}
                  className="hover:text-[var(--accent)]"
                >
                  {brand.contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>{brand.contactHours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-xs text-neutral-500 md:flex-row md:items-center md:px-6">
          <p>
            © {new Date().getFullYear()} {`${brandName}. Tất cả quyền được bảo lưu.`}
          </p>
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
