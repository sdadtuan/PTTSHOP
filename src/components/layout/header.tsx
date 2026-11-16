"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
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

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf9f7]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-20 md:px-6">
        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-700 lg:flex">
          {nav.slice(0, 3).map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="transition hover:text-[var(--accent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className="group flex flex-col items-center">
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[0.2em] text-neutral-900 md:text-3xl">
            VIZFAS
          </span>
          <span className="text-[10px] tracking-[0.35em] text-neutral-500 uppercase">
            Everyday Cool
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <nav className="mr-2 hidden items-center gap-6 text-sm font-medium text-neutral-700 lg:flex">
            {nav.slice(3).map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="transition hover:text-[var(--accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/san-pham"
            className="rounded-full p-2 text-neutral-700 transition hover:bg-black/5"
            aria-label="Tìm kiếm"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/dang-nhap"
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
                count === 0 && "opacity-0",
              )}
            >
              {count}
            </span>
          </Link>
          <Link
            href="/san-pham"
            className="ml-1 hidden rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold tracking-wide text-white transition hover:bg-[var(--accent)] sm:inline-flex"
          >
            Khám phá ngay
          </Link>
        </div>
      </div>
    </header>
  );
}
