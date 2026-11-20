"use client";

import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ReviewSearchSuggestion = {
  key: string;
  kind: "category" | "product" | "reviewer";
  label: string;
  meta?: string;
  categoryId?: string;
  productId?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPick: (item: ReviewSearchSuggestion) => void;
  suggestions: ReviewSearchSuggestion[];
  label?: string;
  placeholder?: string;
};

export function ReviewSearchCombobox({
  value,
  onChange,
  onPick,
  suggestions,
  label = "Tìm kiếm",
  placeholder = "Sản phẩm, khách, nội dung…",
}: Props) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q
      ? suggestions.filter(
          (s) =>
            s.label.toLowerCase().includes(q) ||
            (s.meta || "").toLowerCase().includes(q),
        )
      : suggestions;
    return list.slice(0, 24);
  }, [value, suggestions]);

  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(true);
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setOpen(false), 180);
  }

  return (
    <div className="relative block space-y-1.5 text-sm md:col-span-2">
      <label htmlFor={inputId} className="font-medium text-[var(--admin-text)]">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-text-subtle)] focus-visible:border-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/25"
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white py-1 shadow-[var(--admin-shadow-lg)]"
        >
          {filtered.map((s) => (
            <li key={s.key} role="option">
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-[var(--admin-surface-muted)]",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(s);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-[var(--admin-text)]">{s.label}</span>
                {s.meta ? (
                  <span className="text-xs text-[var(--admin-text-muted)]">
                    {s.kind === "category" ? "Danh mục" : s.kind === "product" ? "Sản phẩm" : "Khách"} · {s.meta}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-[var(--admin-text-muted)]">
        Bấm ô tìm kiếm để xem danh mục, sản phẩm có đánh giá và tên khách — hoặc gõ để lọc.
      </p>
    </div>
  );
}