"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminButton } from "./button";

export function AdminPagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-[var(--admin-text-muted)]">
        {total} mục
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-[var(--admin-text-muted)]">
        Trang {page}/{totalPages} · {total} mục
      </p>
      <div className="flex items-center gap-2">
        <AdminButton
          variant="secondary"
          size="sm"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </AdminButton>
        <AdminButton
          variant="secondary"
          size="sm"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </AdminButton>
      </div>
    </div>
  );
}
