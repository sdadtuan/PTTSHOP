import { cn } from "@/lib/utils";

export function AdminCard({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--admin-radius-lg)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-sm)]",
        padding && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminKpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <AdminCard className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
          <p className="mt-2 type-title text-2xl font-bold text-[var(--admin-text)] md:text-3xl">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-[var(--admin-text-subtle)]">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--admin-radius-md)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
            {icon}
          </div>
        ) : null}
      </div>
    </AdminCard>
  );
}
