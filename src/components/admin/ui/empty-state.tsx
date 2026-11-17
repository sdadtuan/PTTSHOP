import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--admin-radius-lg)] border border-dashed border-[var(--admin-border)] bg-white px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)]">
        <Inbox className="h-5 w-5" aria-hidden />
      </div>
      <p className="font-semibold text-[var(--admin-text)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[var(--admin-text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
