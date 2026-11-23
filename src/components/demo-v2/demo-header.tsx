"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { useStorefrontLayout } from "@/components/cms/storefront-layout-context";
import type { NavLink } from "@/lib/cms/types";
import { displayBrandName } from "@/lib/public-brand";

type NavItem = NavLink;

export function DemoHeader({ brandName = "PTT Shop" }: { brandName?: string }) {
  const name = displayBrandName(brandName);
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const { navigation } = useStorefrontLayout();
  const primaryNav = navigation.demoPrimaryNav;
  const mobileExtra = navigation.demoMobileExtra;
  const searchPlaceholder = navigation.searchPlaceholder || "Tìm sản phẩm...";
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash || "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    setSearchOpen(false);
    router.push(query ? `/san-pham?q=${encodeURIComponent(query)}` : "/san-pham");
  }

  function isActive(item: NavItem) {
    if (item.hash) {
      return pathname === (item.match || "/demo-v2") && hash === item.hash;
    }
    if (item.match === "/demo-v2") {
      return pathname === "/demo-v2" && hash !== "#danh-gia";
    }
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  }

  function onNavClick(e: MouseEvent<HTMLAnchorElement>, item: NavItem) {
    if (!item.hash) return;
    if (pathname === "/demo-v2") {
      e.preventDefault();
      const el = document.getElementById("danh-gia");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#danh-gia");
        setHash("#danh-gia");
      }
    }
    setOpen(false);
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

        <Link
          href="/demo-v2"
          className="dv2-logo"
          onClick={() => {
            setOpen(false);
            setHash("");
          }}
        >
          {name}
          <span>®</span>
        </Link>

        <nav className="dv2-nav" aria-label="Điều hướng chính">
          {primaryNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              data-active={isActive(item) ? "true" : "false"}
              data-testid={item.hash ? "demo-v2-nav-danh-gia" : undefined}
              onClick={(e) => onNavClick(e, item)}
            >
              {item.label}
            </Link>
          ))}
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
        <form className="dv2-search" data-testid="demo-v2-search" onSubmit={onSearch}>
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Tìm sản phẩm"
            autoFocus
          />
          <button type="submit">Tìm</button>
        </form>
      ) : null}

      {open ? (
        <nav className="dv2-mobile-nav" aria-label="Menu di động">
          {[...primaryNav, ...mobileExtra].map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              data-active={isActive(item) ? "true" : "false"}
              data-testid={item.hash ? "demo-v2-nav-danh-gia-mobile" : undefined}
              onClick={(e) => onNavClick(e, item)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
