export const STAFF_ROLES = ["ADMIN", "DIRECTOR", "WAREHOUSE", "CSKH", "ACCOUNTANT", "MARKETING"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị",
  DIRECTOR: "Giám đốc",
  WAREHOUSE: "Kho",
  CSKH: "CSKH",
  ACCOUNTANT: "Kế toán",
  MARKETING: "Marketing",
};

export type Scope =
  | "dashboard.read"
  | "security.self"
  | "products.read"
  | "products.write"
  | "products.content"
  | "pricing.read"
  | "pricing.write"
  | "coupons.read"
  | "coupons.write"
  | "orders.read"
  | "orders.pack"
  | "orders.service"
  | "orders.phone"
  | "shipping.read"
  | "shipping.write"
  | "returns.read"
  | "returns.inspect"
  | "returns.write"
  | "refunds.read"
  | "refunds.create"
  | "refunds.approve1"
  | "refunds.approve2"
  | "refunds.complete"
  | "invoices.read"
  | "invoices.write"
  | "staff.read"
  | "staff.write"
  | "audit.read"
  | "settings.read"
  | "settings.write"
  | "suppliers.read"
  | "suppliers.write"
  | "suppliers.cost"
  | "suppliers.sync"
  | "suppliers.order"
  | "suppliers.debit";

const ALL_READ: Scope[] = [
  "dashboard.read",
  "security.self",
  "products.read",
  "orders.read",
  "orders.phone",
];

const GRANTS: Record<string, Scope[]> = {
  ADMIN: [
    ...ALL_READ,
    "products.write",
    "products.content",
    "pricing.read",
    "pricing.write",
    "coupons.read",
    "coupons.write",
    "orders.pack",
    "orders.service",
    "shipping.read",
    "shipping.write",
    "returns.read",
    "returns.inspect",
    "returns.write",
    "refunds.read",
    "refunds.approve1",
    "invoices.read",
    "staff.read",
    "staff.write",
    "audit.read",
    "settings.read",
    "settings.write",
    "suppliers.read",
    "suppliers.write",
    "suppliers.cost",
    "suppliers.sync",
    "suppliers.order",
    "suppliers.debit",
  ],
  DIRECTOR: [
    ...ALL_READ,
    "pricing.read",
    "pricing.write",
    "coupons.read",
    "shipping.read",
    "returns.read",
    "refunds.read",
    "refunds.approve2",
    "invoices.read",
    "staff.read",
    "audit.read",
    "settings.read",
    "suppliers.read",
    "suppliers.cost",
    "suppliers.debit",
  ],
  WAREHOUSE: [
    "dashboard.read",
    "security.self",
    "products.read",
    "orders.read",
    "orders.pack",
    "orders.phone",
    "shipping.read",
    "shipping.write",
    "returns.read",
    "returns.inspect",
    "suppliers.read",
    "suppliers.sync",
    "suppliers.order",
  ],
  CSKH: [
    ...ALL_READ,
    "coupons.read",
    "orders.service",
    "shipping.read",
    "returns.read",
    "returns.write",
    "refunds.read",
    "refunds.create",
    "invoices.read",
    "suppliers.read",
  ],
  ACCOUNTANT: [
    ...ALL_READ,
    "pricing.read",
    "coupons.read",
    "shipping.read",
    "returns.read",
    "refunds.read",
    "refunds.complete",
    "invoices.read",
    "invoices.write",
    "suppliers.read",
    "suppliers.cost",
    "suppliers.debit",
  ],
  MARKETING: [
    "dashboard.read",
    "security.self",
    "products.read",
    "products.content",
    "coupons.read",
    "coupons.write",
    "orders.read",
    "suppliers.read",
  ],
};

export type Access = { roles: string[]; legacy: boolean };

export function can(access: Access, scope: Scope) {
  if (access.legacy) return true;
  return access.roles.some((role) => (GRANTS[role] || []).includes(scope));
}

export function canAny(access: Access, scopes: Scope | Scope[]) {
  const list = Array.isArray(scopes) ? scopes : [scopes];
  return list.some((scope) => can(access, scope));
}

export function maskCustomerPhone(phone: string) {
  const digits = phone.replace(/\s/g, "");
  if (digits.length <= 2) return "••••";
  return `${"•".repeat(Math.max(4, digits.length - 2))}${digits.slice(-2)}`;
}

const PAGES: Array<{ prefix: string; scope: Scope }> = [
  { prefix: "/admin/van-chuyen/doi-soat-cod", scope: "invoices.read" },
  { prefix: "/admin/van-chuyen", scope: "shipping.read" },
  { prefix: "/admin/quy-tac-gia", scope: "pricing.read" },
  { prefix: "/admin/doi-tru-ncc", scope: "suppliers.debit" },
  { prefix: "/admin/dong-bo-ton", scope: "suppliers.read" },
  { prefix: "/admin/phieu-dat-ncc", scope: "suppliers.read" },
  { prefix: "/admin/anh-xa-sku", scope: "suppliers.read" },
  { prefix: "/admin/nha-cung-cap", scope: "suppliers.read" },
  { prefix: "/admin/phan-quyen", scope: "staff.read" },
  { prefix: "/admin/tich-hop", scope: "staff.read" },
  { prefix: "/admin/nhat-ky", scope: "audit.read" },
  { prefix: "/admin/bao-mat", scope: "security.self" },
  { prefix: "/admin/doi-tra", scope: "returns.read" },
  { prefix: "/admin/hoa-don", scope: "invoices.read" },
  { prefix: "/admin/orders", scope: "orders.read" },
  { prefix: "/admin/coupons", scope: "coupons.read" },
  { prefix: "/admin/products", scope: "products.read" },
  { prefix: "/admin/nhap-san-pham", scope: "shipping.read" },
  { prefix: "/admin/import", scope: "shipping.read" },
  { prefix: "/admin/cua-hang", scope: "settings.read" },
  { prefix: "/admin/thanh-toan", scope: "settings.read" },
  { prefix: "/admin/thong-bao", scope: "settings.read" },
  { prefix: "/admin/nhac-gio", scope: "settings.read" },
  { prefix: "/admin/tro-ly", scope: "settings.read" },
  { prefix: "/admin/giao-dien", scope: "products.read" },
  { prefix: "/admin/noi-dung", scope: "products.read" },
  { prefix: "/admin/banners", scope: "products.read" },
  { prefix: "/admin/categories", scope: "products.read" },
  { prefix: "/admin/customers", scope: "orders.read" },
  { prefix: "/admin/reviews", scope: "products.read" },
  { prefix: "/admin/yeu-cau-du-lieu", scope: "staff.read" },
];

export function pageScope(path: string): Scope {
  const hit = PAGES.find((item) => path === item.prefix || path.startsWith(`${item.prefix}/`));
  return hit?.scope || "dashboard.read";
}

export function adminPermissionDenied(
  path: string,
  user: { role?: string; rbacRoles?: string[] | null; legacyAdmin?: boolean | null } | null,
) {
  if (!path.startsWith("/admin")) return null;
  if (!user || user.role !== "ADMIN") return null;
  const access = accessFromSession(user);
  if (can(access, pageScope(path))) return null;
  return { status: 403 as const, message: "Bạn không có quyền xem trang này." };
}

export function accessFromSession(user: { role?: string; rbacRoles?: string[] | null; legacyAdmin?: boolean | null }) {
  if (user.legacyAdmin || (user.role === "ADMIN" && !user.rbacRoles)) {
    return { roles: ["ADMIN"], legacy: true } satisfies Access;
  }
  return { roles: user.rbacRoles || [], legacy: false } satisfies Access;
}

export function scopeForApi(pathname: string, method: string): Scope | Scope[] | null {
  if (!pathname.startsWith("/api/admin")) return null;
  const write = method !== "GET" && method !== "HEAD";
  if (pathname.startsWith("/api/admin/pricing-rules") || pathname.startsWith("/api/admin/floor-settings")) {
    return write ? "pricing.write" : "pricing.read";
  }
  if (pathname.startsWith("/api/admin/supplier-debits")) return write ? "suppliers.debit" : "suppliers.read";
  if (pathname.startsWith("/api/admin/supplier-sync")) return write ? "suppliers.sync" : "suppliers.read";
  if (pathname.startsWith("/api/admin/supplier-orders")) return write ? "suppliers.order" : "suppliers.read";
  if (pathname.startsWith("/api/admin/supplier-skus")) return write ? "suppliers.write" : "suppliers.read";
  if (pathname.startsWith("/api/admin/suppliers")) return write ? "suppliers.write" : "suppliers.read";
  if (pathname.startsWith("/api/admin/phan-quyen")) return write ? "staff.write" : "staff.read";
  if (pathname.startsWith("/api/admin/integrations")) return "staff.read";
  if (pathname.startsWith("/api/admin/audit")) return "audit.read";
  if (pathname.startsWith("/api/admin/two-factor")) return "security.self";
  if (
    pathname.startsWith("/api/admin/invoices") ||
    pathname.startsWith("/api/admin/invoice-settings") ||
    pathname.startsWith("/api/admin/cod-reconcile")
  ) {
    return write ? "invoices.write" : "invoices.read";
  }
  if (
    pathname.startsWith("/api/admin/shipments") ||
    pathname.startsWith("/api/admin/shipping-settings") ||
    pathname.startsWith("/api/admin/shipping-policy") ||
    pathname.startsWith("/api/admin/catalog-import")
  ) {
    return write ? "shipping.write" : "shipping.read";
  }
  if (pathname.includes("/cancel")) return "orders.service";
  if (pathname.startsWith("/api/admin/orders")) return write ? ["orders.pack", "orders.service"] : "orders.read";
  if (pathname.startsWith("/api/admin/refunds")) {
    return write ? ["refunds.approve1", "refunds.approve2", "refunds.complete", "refunds.create"] : "refunds.read";
  }
  if (pathname.startsWith("/api/admin/returns")) return write ? ["returns.write", "returns.inspect"] : "returns.read";
  if (pathname.startsWith("/api/admin/coupons")) return write ? "coupons.write" : "coupons.read";
  if (pathname.startsWith("/api/admin/variants")) return write ? ["products.write", "pricing.write", "shipping.write"] : "products.read";
  if (
    pathname.startsWith("/api/admin/products") ||
    pathname.startsWith("/api/admin/product-images") ||
    pathname.startsWith("/api/admin/categories") ||
    pathname.startsWith("/api/admin/hero-banners") ||
    pathname.startsWith("/api/admin/homepage-cms") ||
    pathname.startsWith("/api/admin/storefront") ||
    pathname.startsWith("/api/admin/reviews")
  ) {
    return write ? ["products.write", "products.content"] : "products.read";
  }
  if (
    pathname.startsWith("/api/admin/shop-profile") ||
    pathname.startsWith("/api/admin/payment-settings") ||
    pathname.startsWith("/api/admin/message-settings") ||
    pathname.startsWith("/api/admin/chat-settings") ||
    pathname.startsWith("/api/admin/emails") ||
    pathname.startsWith("/api/admin/crm")
  ) {
    return write ? "settings.write" : "settings.read";
  }
  if (pathname.startsWith("/api/admin/customers")) return "orders.read";
  if (pathname.startsWith("/api/admin/stats")) return "dashboard.read";
  if (pathname.startsWith("/api/admin/data-requests")) return "staff.read";
  return write ? "staff.write" : "staff.read";
}
