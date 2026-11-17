"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { AccountMenu } from "@/components/layout/account-menu";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Trang chủ" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/san-pham?gender=MALE", label: "Nam" },
  { href: "/san-pham?gender=FEMALE", label: "Nữ" },
  { href: "/san-pham?category=phu-kien", label: "Phụ kiện" },
  { href: "/bo-suu-tap", label: "Bộ sưu tập" },
];

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf9f7]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-20 md:px-6 lg:gap-6">
        <button
          type="button"
          className="rounded-full p-2 text-neutral-700 transition hover:bg-black/5 lg:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[0.18em] text-neutral-900 sm:text-2xl">
            VIZFAS
          </span>
          <span className="mt-0.5 block text-[9px] tracking-[0.28em] text-neutral-500 uppercase">
            Everyday Cool
          </span>
        </Link>

        <nav className="ml-2 hidden min-w-0 flex-1 items-center justify-center gap-5 text-sm font-medium text-neutral-700 xl:gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="whitespace-nowrap transition hover:text-[var(--accent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/san-pham"
            className="rounded-full p-2 text-neutral-700 transition hover:bg-black/5"
            aria-label="Tìm kiếm"
          >
            <Search className="h-5 w-5" />
          </Link>
          <AccountMenu />
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
                count === 0 && "opacity-0",
              )}
            >
              {count}
            </span>
          </Link>
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/5 bg-[#faf9f7] lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-2 py-2">
            {nav.map((item) => (
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
