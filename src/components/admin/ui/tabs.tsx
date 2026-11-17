"use client";

import { cn } from "@/lib/utils";

export function AdminTabs({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className="flex flex-wrap gap-1 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-1"
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={cn(
              "rounded-[var(--admin-radius-sm)] px-3 py-1.5 text-sm font-medium transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/40",
              active
                ? "bg-white text-[var(--admin-text)] shadow-[var(--admin-shadow-sm)]"
                : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]",
            )}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
