"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";

const nav = [
  { href: "/demo-v2", label: "Trang Chủ", match: "/demo-v2" },
  { href: "/bo-suu-tap", label: "Bộ Sưu Tập" },
  { href: "/san-pham", label: "Sản Phẩm" },
  { href: "/ve-chung-toi", label: "Về VIZFAS" },
  { href: "/lien-he", label: "Liên Hệ" },
];

export function DemoHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

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
          VIZFAS<span>®</span>
        </Link>

        <nav className="dv2-nav" aria-label="Điều hướng chính">
          {nav.map((item) => {
            const active =
              item.match != null
                ? pathname === item.match
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="dv2-utils">
          <Link href="/san-pham" className="dv2-icon-btn" aria-label="Tìm kiếm">
            <Search className="h-4 w-4" />
          </Link>
          <Link href="/tai-khoan" className="dv2-icon-btn" aria-label="Tài khoản">
            <User className="h-4 w-4" />
          </Link>
          <Link href="/gio-hang" className="dv2-icon-btn" aria-label="Giỏ hàng">
            <ShoppingBag className="h-4 w-4" />
            <span className="dv2-cart-count">{count}</span>
          </Link>
        </div>
      </div>

      {open ? (
        <nav className="dv2-mobile-nav" aria-label="Menu di động">
          {nav.map((item) => {
            const active =
              item.match != null
                ? pathname === item.match
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
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
