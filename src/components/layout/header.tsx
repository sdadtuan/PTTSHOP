"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

const leftNav = [
  { href: "/", label: "Trang chủ" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/san-pham?category=phu-kien", label: "Phụ kiện" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
];

const mobileNav = [
  ...leftNav,
  { href: "/san-pham?gender=MALE", label: "Nam" },
  { href: "/san-pham?gender=FEMALE", label: "Nữ" },
  { href: "/bo-suu-tap", label: "Bộ sưu tập" },
  { href: "/tai-khoan", label: "Tài khoản" },
  { href: "/lien-he", label: "Liên hệ" },
];

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[var(--background)]/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 md:h-[4.5rem] md:px-6">
        <button
          type="button"
          className="rounded-full p-2 text-neutral-700 transition hover:bg-black/5 md:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="hidden min-w-0 flex-1 items-center gap-6 text-sm font-medium text-neutral-800 md:flex">
          {leftNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="whitespace-nowrap transition hover:text-[var(--accent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2"
          onClick={() => setOpen(false)}
        >
          <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-[0.22em] text-neutral-900 md:text-[1.65rem]">
            VIZFAS
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="rounded-full p-2 text-neutral-700 transition hover:bg-black/5"
            aria-label="Tìm kiếm"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/tai-khoan"
            className="rounded-full p-2 text-neutral-700 transition hover:bg-black/5"
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
            className="relative rounded-full p-2 text-neutral-700 transition hover:bg-black/5"
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
              placeholder="Tìm sản phẩm..."
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
