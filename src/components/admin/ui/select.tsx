"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type AdminSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  function AdminSelect({ className, label, error, id, children, ...props }, ref) {
    const selectId = id || props.name;
    return (
      <label className="block space-y-1.5 text-sm">
        {label ? (
          <span className="font-medium text-[var(--admin-text)]">{label}</span>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-text)] transition",
            "focus-visible:border-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/25",
            "disabled:cursor-not-allowed disabled:opacity-70",
            error && "border-[var(--admin-danger)]",
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <span className="block text-xs text-[var(--admin-danger)]" role="alert">
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);
