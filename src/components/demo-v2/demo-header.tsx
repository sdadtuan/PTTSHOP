"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";

const primaryNav = [
  { href: "/demo-v2", label: "Trang Chủ", match: "/demo-v2" },
  { href: "/bo-suu-tap", label: "Bộ Sưu Tập" },
  { href: "/san-pham", label: "Sản Phẩm" },
  { href: "/ve-chung-toi", label: "Về VIZFAS" },
  { href: "/lien-he", label: "Liên Hệ" },
];

const mobileNav = [
  ...primaryNav,
  { href: "/san-pham?gender=MALE", label: "Nam" },
  { href: "/san-pham?gender=FEMALE", label: "Nữ" },
  { href: "/tai-khoan", label: "Tài khoản" },
  { href: "/yeu-thich", label: "Yêu thích" },
];

export function DemoHeader({ brandName = "VIZFAS" }: { brandName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    setSearchOpen(false);
    router.push(query ? `/san-pham?q=${encodeURIComponent(query)}` : "/san-pham");
  }

  return (
    <header className="dv2-header" data-testid="demo-v2-header">
      <div className="dv2-header__inner">
        <button
          type="button"
          className="dv2-icon-btn dv2-menu-btn"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/demo-v2" className="dv2-logo" onClick={() => setOpen(false)}>
          {brandName}
          <span>®</span>
        </Link>

        <nav className="dv2-nav" aria-label="Điều hướng chính">
          {primaryNav.map((item) => {
            const active =
              item.match != null
                ? pathname === item.match
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                data-active={active ? "true" : "false"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="dv2-utils">
          <button
            type="button"
            className="dv2-icon-btn"
            aria-label="Tìm kiếm"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-4 w-4" />
          </button>
          <Link href="/tai-khoan" className="dv2-icon-btn" aria-label="Tài khoản">
            <User className="h-4 w-4" />
          </Link>
          <Link
            href="/yeu-thich"
            className="dv2-icon-btn dv2-icon-btn--wish"
            aria-label="Yêu thích"
          >
            <Heart className="h-4 w-4" />
          </Link>
          <Link href="/gio-hang" className="dv2-icon-btn" aria-label="Giỏ hàng">
            <ShoppingBag className="h-4 w-4" />
            <span className="dv2-cart-count">{count}</span>
          </Link>
        </div>
      </div>

      {searchOpen ? (
        <form
          className="dv2-search"
          data-testid="demo-v2-search"
          onSubmit={onSearch}
        >
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm sản phẩm..."
            aria-label="Tìm sản phẩm"
            autoFocus
          />
          <button type="submit">Tìm</button>
        </form>
      ) : null}

      {open ? (
        <nav className="dv2-mobile-nav" aria-label="Menu di động">
          {mobileNav.map((item) => {
            const active =
              "match" in item && item.match != null
                ? pathname === item.match
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                data-active={active ? "true" : "false"}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
