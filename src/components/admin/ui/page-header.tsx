import { cn } from "@/lib/utils";
import { AdminBreadcrumb } from "./breadcrumb";

export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { href?: string; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {breadcrumbs?.length ? <AdminBreadcrumb items={breadcrumbs} /> : null}
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--admin-text)] md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-[var(--admin-text-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
