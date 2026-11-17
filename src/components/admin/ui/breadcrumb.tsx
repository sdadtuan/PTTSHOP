import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminBreadcrumb({
  items,
  className,
}: {
  items: { href?: string; label: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-[var(--admin-text-muted)]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded hover:text-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/30"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(last && "font-medium text-[var(--admin-text)]")}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
