"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { BrandLogoImg } from "@/components/cms/brand-logo-img";
import { useSiteBrand } from "@/components/cms/site-brand-context";
import { useStorefrontLayout } from "@/components/cms/storefront-layout-context";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const brand = useSiteBrand();
  const { navigation } = useStorefrontLayout();
  const primaryNav = navigation.primaryNav;
  const mobileNav = [...primaryNav, ...navigation.mobileExtra];
  const searchPlaceholder = navigation.searchPlaceholder || "Tìm sản phẩm...";
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const brandName = brand.brandName || "PTT Shop";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/demo-v2")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[var(--background)]/95 backdrop-blur-md">
      {/* Row 1: logo centered + utilities */}
      <div className="relative mx-auto flex h-14 max-w-7xl items-center px-4 max-md:grid max-md:grid-cols-[2.75rem_minmax(0,1fr)_auto] max-md:items-center max-md:gap-x-2 max-md:px-3 md:h-16 md:px-6">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-2 text-neutral-700 transition hover:bg-black/5 max-md:justify-self-start md:hidden md:min-h-0 md:min-w-0"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          href="/"
          className="max-md:relative max-md:left-auto max-md:flex max-md:min-w-0 max-md:max-w-full max-md:translate-x-0 max-md:justify-center max-md:overflow-hidden max-md:[&_img]:mx-auto md:absolute md:left-1/2 md:-translate-x-1/2"
          onClick={() => setOpen(false)}
        >
          {brand.logoUrl ? (
            <BrandLogoImg
              src={brand.logoUrl}
              alt={brandName}
              slot="header"
              layout={brand.logoLayout}
            />
          ) : (
            <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-[0.22em] text-neutral-900 md:text-[1.75rem]">
              {brandName}
            </span>
          )}
        </Link>

        <div className="ml-auto flex items-center gap-0 max-md:justify-self-end max-md:gap-0 sm:gap-1 md:ml-auto">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-neutral-700 transition hover:bg-black/5 md:min-h-0 md:min-w-0"
            aria-label="Tìm kiếm"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/tai-khoan"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-neutral-700 transition hover:bg-black/5 md:min-h-0 md:min-w-0"
            aria-label="Tài khoản"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/yeu-thich"
            className="hidden rounded-full p-2 text-neutral-700 transition hover:bg-black/5 sm:inline-flex"
            aria-label="Yêu thích"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/gio-hang"
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-neutral-700 transition hover:bg-black/5 md:min-h-0 md:min-w-0"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="h-5 w-5" />
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white",
                count === 0 && "opacity-40",
              )}
            >
              {count}
            </span>
          </Link>
        </div>
      </div>

      {/* Row 2: centered nav (desktop) — mock layout */}
      <nav className="hidden border-t border-black/[0.04] md:block">
        <ul className="mx-auto flex max-w-7xl items-center justify-center gap-10 px-6 py-2.5 text-sm font-medium text-neutral-800">
          {primaryNav.map((item) => (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                className="whitespace-nowrap transition hover:text-[var(--accent)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {searchOpen ? (
        <div className="border-t border-black/5 bg-[var(--background)]">
          <form
            action="/san-pham"
            className="mx-auto flex max-w-7xl gap-2 px-4 py-3 md:px-6"
            onSubmit={() => setSearchOpen(false)}
          >
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-neutral-900"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Tìm
            </button>
          </form>
        </div>
      ) : null}

      {open ? (
        <div className="border-t border-black/5 bg-[var(--background)] md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-2 py-2">
            {mobileNav.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-neutral-800 transition hover:bg-black/5 hover:text-[var(--accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
