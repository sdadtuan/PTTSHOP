"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-text-subtle)] transition focus-visible:border-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/25 disabled:cursor-not-allowed disabled:bg-[var(--admin-surface-muted)] disabled:opacity-70";

export type AdminInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  function AdminInput({ className, label, hint, error, id, ...props }, ref) {
    const inputId = id || props.name;
    return (
      <label className="block space-y-1.5 text-sm">
        {label ? (
          <span className="font-medium text-[var(--admin-text)]">{label}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            fieldClass,
            error && "border-[var(--admin-danger)] focus-visible:ring-red-500/25",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error ? (
          <span id={`${inputId}-error`} className="block text-xs text-[var(--admin-danger)]" role="alert">
            {error}
          </span>
        ) : hint ? (
          <span className="block text-xs text-[var(--admin-text-muted)]">{hint}</span>
        ) : null}
      </label>
    );
  },
);

export type AdminTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const AdminTextarea = forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  function AdminTextarea({ className, label, error, id, ...props }, ref) {
    const inputId = id || props.name;
    return (
      <label className="block space-y-1.5 text-sm">
        {label ? (
          <span className="font-medium text-[var(--admin-text)]">{label}</span>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            fieldClass,
            "min-h-[96px] resize-y",
            error && "border-[var(--admin-danger)]",
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error ? (
          <span className="block text-xs text-[var(--admin-danger)]" role="alert">
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);
