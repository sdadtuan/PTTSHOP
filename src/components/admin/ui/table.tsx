import { cn } from "@/lib/utils";

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[var(--admin-radius-lg)] border border-[var(--admin-border)] bg-white shadow-[var(--admin-shadow-sm)]",
        className,
      )}
    >
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminTh({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-4 py-3 text-[var(--admin-text)]", className)}>
      {children}
    </td>
  );
}

export function AdminTr({
  children,
  className,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--admin-border)]/70 transition-colors last:border-0 hover:bg-[var(--admin-accent-soft)]/40",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}
