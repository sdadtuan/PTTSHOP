"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  TicketPercent,
  Star,
  Search,
  LogOut,
  MessageCircle,
  Menu,
  X,
  Store,
  ImageIcon,
  PanelsTopLeft,
  FileText,
  ShieldCheck,
  Wallet,
  Truck,
  Receipt,
  RotateCcw,
  Bell,
  BadgeDollarSign,
  ScrollText,
  Plug,
  FlaskConical,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { adminPermissionDenied } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { AdminButton } from "./ui/button";
import { AdminToastProvider } from "./ui/toast";

const nav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
  { href: "/admin/cua-hang", label: "Cửa hàng", icon: Store },
  { href: "/admin/thanh-toan", label: "Thanh toán", icon: Wallet },
  { href: "/admin/giao-dich", label: "Giao dịch", icon: Receipt },
  { href: "/admin/van-chuyen", label: "Vận chuyển", icon: Truck },
  { href: "/admin/hoa-don", label: "Hoá đơn", icon: Receipt },
  { href: "/admin/doi-tra", label: "Đổi trả & Hoàn tiền", icon: RotateCcw },
  { href: "/admin/thong-bao", label: "CRM & Thông báo", icon: Bell },
  { href: "/admin/nhac-gio", label: "Nhắc giỏ", icon: Bell },
  { href: "/admin/tro-ly", label: "Trợ lý", icon: MessageCircle },
  { href: "/admin/thi-nghiem", label: "Thử nghiệm", icon: FlaskConical },
  { href: "/admin/quy-tac-gia", label: "Quy tắc giá", icon: BadgeDollarSign },
  { href: "/admin/nha-cung-cap", label: "Nhà cung cấp", icon: Store },
  { href: "/admin/phan-quyen", label: "Phân quyền", icon: ShieldCheck },
  { href: "/admin/tich-hop", label: "Tích hợp", icon: Plug },
  { href: "/admin/nhat-ky", label: "Nhật ký", icon: ScrollText },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/nhap-san-pham", label: "Nhập sản phẩm", icon: Package },
  {
    href: "/admin/giao-dien",
    label: "Quản lý giao diện",
    icon: PanelsTopLeft,
  },
  { href: "/admin/noi-dung", label: "Trang nội dung", icon: FileText },
  { href: "/admin/banners", label: "Banner trang chủ", icon: ImageIcon },
  { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { href: "/admin/customers", label: "Khách hàng", icon: Users },
  { href: "/admin/coupons", label: "Mã giảm", icon: TicketPercent },
  { href: "/admin/reviews", label: "Đánh giá", icon: Star },
  { href: "/admin/yeu-cau-du-lieu", label: "Yêu cầu dữ liệu", icon: ShieldCheck },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const visibleNav = session?.user
    ? nav.filter((item) => !adminPermissionDenied(item.href, session.user))
    : nav;
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const mobileOpen = menuPath === pathname;
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    if (q.includes("đơn") || q.includes("order")) {
      window.location.href = "/admin/orders";
      return;
    }
    if (q.includes("khách") || q.includes("customer")) {
      window.location.href = "/admin/customers";
      return;
    }
    if (q.includes("danh mục") || q.includes("category")) {
      window.location.href = "/admin/categories";
      return;
    }
    if (q.includes("mã") || q.includes("coupon")) {
      window.location.href = "/admin/coupons";
      return;
    }
    if (q.includes("đánh giá") || q.includes("review")) {
      window.location.href = "/admin/reviews";
      return;
    }
    window.location.href = `/admin/products?q=${encodeURIComponent(query.trim())}`;
  }

  const sidebar = (
    <aside
      className={cn(
        "flex h-full w-[var(--admin-sidebar)] flex-col border-r border-[var(--admin-border)] bg-white",
      )}
    >
      <div className="flex h-[var(--admin-header)] items-center gap-2 border-b border-[var(--admin-border)] px-5">
        <Link
          href="/admin"
          className="font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight text-[var(--admin-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/40"
        >
          PTT Shop
        </Link>
        <span className="rounded-full bg-[var(--admin-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-accent-hover)]">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menu quản trị">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--admin-radius-md)] px-3 py-2.5 text-sm font-medium transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/40",
                active
                  ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent-hover)]"
                  : "text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-text)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--admin-border)] p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-[var(--admin-radius-md)] px-3 py-2.5 text-sm text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/40"
        >
          <Store className="h-4 w-4" aria-hidden />
          Về storefront
        </Link>
      </div>
    </aside>
  );

  return (
    <AdminToastProvider>
      <div className="admin-root min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
        <div className="flex min-h-screen">
          <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[var(--admin-sidebar)] print:hidden">
            {sidebar}
          </div>

          {mobileOpen ? (
            <div className="fixed inset-0 z-[70] lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-neutral-900/40"
                aria-label="Đóng menu"
                onClick={() => setMenuPath(null)}
              />
              <div className="relative z-10 h-full w-[min(100%,var(--admin-sidebar))] shadow-[var(--admin-shadow-lg)]">
                {sidebar}
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col lg:pl-[var(--admin-sidebar)]">
            <header className="sticky top-0 z-40 flex h-[var(--admin-header)] items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/95 px-4 backdrop-blur md:px-6 print:hidden">
              <AdminButton
                variant="ghost"
                size="sm"
                className="lg:hidden"
                aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
                onClick={() => setMenuPath((current) => (current === pathname ? null : pathname))}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </AdminButton>

              <form onSubmit={onSearch} className="relative min-w-0 flex-1 max-w-md">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-subtle)]"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm sản phẩm, đơn, khách…"
                  className="h-10 w-full rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white pl-9 pr-3 text-sm focus-visible:border-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/25"
                  aria-label="Tìm kiếm admin"
                />
              </form>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium leading-tight">
                    {session?.user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-[var(--admin-text-muted)]">
                    {session?.user?.email}
                  </p>
                </div>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/dang-nhap" })}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </AdminButton>
              </div>
            </header>

            <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
          </div>
        </div>
      </div>
    </AdminToastProvider>
  );
}
