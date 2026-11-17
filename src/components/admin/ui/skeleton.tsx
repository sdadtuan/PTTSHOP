import { cn } from "@/lib/utils";

export function AdminSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--admin-radius-md)] bg-[var(--admin-surface-muted)]",
        className,
      )}
      aria-hidden
    />
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-[var(--admin-radius-lg)] border border-[var(--admin-border)] bg-white p-4">
      <AdminSkeleton className="h-8 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <AdminSkeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function AdminKpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <AdminSkeleton key={i} className="h-28 w-full rounded-[var(--admin-radius-lg)]" />
      ))}
    </div>
  );
}
