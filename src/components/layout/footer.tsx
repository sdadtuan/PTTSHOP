"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { BrandLogoImg } from "@/components/cms/brand-logo-img";
import { useSiteBrand } from "@/components/cms/site-brand-context";
import { useStorefrontLayout } from "@/components/cms/storefront-layout-context";
import { TYPE_SCALE } from "@/config/home-type-scale";
import { company, companyPolicyLinks, isUnset } from "@/content/company";
import { displayBrandName, visibleEmail, visibleHref, visiblePhone } from "@/lib/public-brand";

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

export function Footer() {
  const pathname = usePathname();
  const brand = useSiteBrand();
  const { footerLinks } = useStorefrontLayout();
  const columns = footerLinks.columns;
  const legalLinks = footerLinks.legalLinks;
  const contactTitle = footerLinks.contactColumnTitle || "Liên hệ";
  const copyrightNote = footerLinks.copyrightNote || "Tất cả quyền được bảo lưu.";
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/demo-v2")) return null;

  const social = [
    { href: visibleHref(brand.socialInstagram), label: "Instagram", Icon: InstagramIcon },
    { href: visibleHref(brand.socialFacebook), label: "Facebook", Icon: FacebookIcon },
    { href: visibleHref(brand.socialTiktok), label: "TikTok", Icon: TikTokIcon },
    { href: visibleHref(brand.socialYoutube), label: "YouTube", Icon: YoutubeIcon },
    { href: visibleHref(brand.messengerUrl), label: "Messenger", Icon: FacebookIcon },
  ].filter((item) => item.href);

  const brandName = displayBrandName(brand.brandName);
  const email = visibleEmail(brand.contactEmail);
  const phone = visiblePhone(brand.hotline || brand.contactPhone);
  const showFooterBrandText = Boolean(brand.logoUrl && brand.logoLayout.footerShowBrandName);

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-black/5 bg-white text-neutral-700">
      {/* Decor — ẩn mobile để không đè khối logo/tagline */}
      <div
        className="pointer-events-none absolute top-4 right-[-10%] z-0 hidden h-24 w-24 rotate-[22deg] rounded-[1.5rem] bg-[var(--accent)]/70 sm:right-[14%] sm:block sm:h-44 sm:w-44 sm:rounded-[2rem] sm:bg-[var(--accent)]/90 md:h-52 md:w-52"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-36 right-[-6%] z-0 hidden h-32 w-32 -rotate-[14deg] rounded-3xl bg-neutral-300 sm:block md:top-28 md:right-[5%] md:h-40 md:w-40"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl overflow-hidden px-4 pt-16 pb-12 md:px-6 md:pt-20 md:pb-14">
        <div className="flex flex-col gap-8 border-b border-black/5 pb-10 md:flex-row md:items-start md:justify-between md:pb-14">
          <div className="relative z-10 max-w-2xl pr-2 sm:pr-0">
            <div
              className={
                brand.logoUrl
                  ? showFooterBrandText
                    ? "flex flex-wrap items-center gap-3 md:gap-4"
                    : "flex flex-col items-start"
                  : "flex items-center gap-3 md:gap-4"
              }
            >
              {brand.logoUrl ? (
                <BrandLogoImg src={brand.logoUrl} alt={brandName} slot="footer" layout={brand.logoLayout} />
              ) : (
                <SparkLogo className="h-10 w-10 shrink-0 text-[var(--accent)] md:h-14 md:w-14" />
              )}
              {brand.logoUrl ? (
                showFooterBrandText ? (
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[0.08em] text-neutral-900 md:text-2xl">
                    {brandName}
                  </p>
                ) : null
              ) : (
                <p
                  className="font-[family-name:var(--font-display)] font-black tracking-[0.12em] text-neutral-900"
                  style={{ fontSize: TYPE_SCALE.footerLogo.css }}
                >
                  {brandName}
                </p>
              )}
            </div>
            <p
              className="mt-4 leading-relaxed text-neutral-600 md:mt-5"
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
              {contactTitle}
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
              {email ? (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-[var(--accent)]"
                >
                  {email}
                </a>
              </li>
              ) : null}
              {phone ? (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="hover:text-[var(--accent)]"
                >
                  {phone}
                </a>
              </li>
              ) : null}
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>{brand.contactHours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-6 text-xs leading-relaxed text-neutral-500 md:px-6">
          <p className="font-semibold text-neutral-800">{company.name}</p>
          <p>
            MST {company.taxId}, cấp ngày {company.issuedOn}
            {isUnset(company.issuedBy) ? "" : `, nơi cấp ${company.issuedBy}`}. Người đại diện: {company.representative}.
          </p>
          <p>
            {company.address}
            {isUnset(company.hotline) ? "" : `. Hotline ${company.hotline}`}
            {isUnset(company.email) ? "" : `. Email ${company.email}`}.
          </p>
          <p>
            <Link href="/yeu-cau-du-lieu" className="hover:text-neutral-800">
              Yêu cầu xem, sửa, xóa dữ liệu hoặc rút đồng ý
            </Link>
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {companyPolicyLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-neutral-800">
                {link.label}
              </Link>
            ))}
          </p>
          {company.tradeConfirmCode ? (
            <p>Đã thông báo Bộ Công Thương. Mã: {company.tradeConfirmCode}</p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-xs text-neutral-500 md:flex-row md:items-center md:px-6">
          <p>
            © {new Date().getFullYear()} {`${brandName}. ${copyrightNote}`}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {legalLinks.map((link, i) => (
              <span key={link.href + link.label} className="contents">
                {i > 0 ? <span aria-hidden>|</span> : null}
                <Link href={link.href} className="hover:text-neutral-800">
                  {link.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
