/** Admin design tokens — cream/white + orange accent (storefront-aligned). */
export const adminTokens = {
  color: {
    bg: "#fdfcf8",
    surface: "#ffffff",
    surfaceMuted: "#f7f5f0",
    border: "#ebe6dc",
    borderStrong: "#d6d0c4",
    text: "#171717",
    textMuted: "#6b7280",
    textSubtle: "#9ca3af",
    accent: "#f97316",
    accentSoft: "#fff7ed",
    accentHover: "#ea580c",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    info: "#2563eb",
    infoSoft: "#eff6ff",
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "18px",
  },
  shadow: {
    sm: "0 1px 2px rgba(23, 23, 23, 0.04)",
    md: "0 4px 16px rgba(23, 23, 23, 0.06)",
    lg: "0 12px 32px rgba(23, 23, 23, 0.08)",
  },
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
  },
  sidebarWidth: "240px",
  sidebarCollapsed: "72px",
  headerHeight: "64px",
} as const;

export type OrderStatusTone = "pending" | "info" | "shipping" | "success" | "danger";

export function orderStatusTone(
  status: string,
): OrderStatusTone {
  switch (status) {
    case "PENDING":
      return "pending";
    case "CONFIRMED":
      return "info";
    case "SHIPPING":
      return "shipping";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    default:
      return "info";
  }
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(safePage, totalPages);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    totalPages,
    total,
    items: items.slice(start, start + pageSize),
  };
}
