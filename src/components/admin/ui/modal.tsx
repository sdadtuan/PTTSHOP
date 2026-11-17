"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminButton } from "./button";

export function AdminModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel) return;
      const nodes = [
        ...panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute("disabled"));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]"
        aria-label="Đóng hộp thoại"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 w-full rounded-[var(--admin-radius-xl)] border border-[var(--admin-border)] bg-white shadow-[var(--admin-shadow-lg)]",
          size === "sm" && "max-w-md",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <h2 id={titleId} className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {title}
          </h2>
          <AdminButton variant="ghost" size="sm" aria-label="Đóng" onClick={onClose}>
            <X className="h-4 w-4" />
          </AdminButton>
        </div>
        <div className="px-5 py-4 text-sm text-[var(--admin-text)]">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--admin-border)] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Xóa",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </AdminButton>
          <AdminButton
            variant="danger"
            disabled={loading}
            onClick={() => void onConfirm()}
          >
            {loading ? "Đang xử lý…" : confirmLabel}
          </AdminButton>
        </>
      }
    >
      <p className="text-[var(--admin-text-muted)]">{description}</p>
    </AdminModal>
  );
}
