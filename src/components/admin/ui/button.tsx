"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900/30",
  secondary:
    "bg-white text-neutral-900 border border-[var(--admin-border)] hover:bg-[var(--admin-surface-muted)] focus-visible:ring-neutral-400/30",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-[var(--admin-surface-muted)] focus-visible:ring-neutral-400/30",
  danger:
    "bg-[var(--admin-danger)] text-white hover:bg-red-700 focus-visible:ring-red-500/30",
  accent:
    "bg-[var(--admin-accent)] text-white hover:bg-[var(--admin-accent-hover)] focus-visible:ring-orange-500/30",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  function AdminButton(
    { className, variant = "primary", size = "md", type = "button", disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--admin-radius-md)] font-medium transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
