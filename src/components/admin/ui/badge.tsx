import { cn } from "@/lib/utils";
import type { OrderStatusTone } from "./tokens";

const tones: Record<OrderStatusTone | "neutral" | "accent", string> = {
  pending: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)] ring-amber-200/80",
  info: "bg-[var(--admin-info-soft)] text-[var(--admin-info)] ring-blue-200/80",
  shipping: "bg-sky-50 text-sky-700 ring-sky-200/80",
  success: "bg-[var(--admin-success-soft)] text-[var(--admin-success)] ring-green-200/80",
  danger: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)] ring-red-200/80",
  neutral: "bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)] ring-[var(--admin-border)]",
  accent: "bg-[var(--admin-accent-soft)] text-[var(--admin-accent-hover)] ring-orange-200/80",
};

export function AdminBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
