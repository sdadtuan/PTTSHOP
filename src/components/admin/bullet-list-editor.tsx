"use client";

import { AdminButton } from "@/components/admin/ui";
import { moveListItem } from "@/lib/pdp-tabs";

const inputClass =
  "min-w-0 w-full flex-1 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-text)] focus-visible:border-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/25";

export function BulletListEditor({
  bullets,
  onChange,
  testId,
  addLabel = "Thêm dòng",
}: {
  bullets: string[];
  onChange: (next: string[]) => void;
  testId: string;
  addLabel?: string;
}) {
  return (
    <div className="min-w-0 space-y-2" data-testid={testId}>
      {bullets.map((bullet, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center" data-testid={`${testId}-row`}>
          <input
            value={bullet}
            onChange={(e) => {
              const next = bullets.slice();
              next[index] = e.target.value;
              onChange(next);
            }}
            className={inputClass}
            data-testid={`${testId}-input`}
            aria-label={`Dòng ${index + 1}`}
            maxLength={400}
          />
          <div className="flex shrink-0 flex-wrap gap-1">
            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Lên dòng ${index + 1}`}
              disabled={index === 0}
              onClick={() => onChange(moveListItem(bullets, index, -1))}
            >
              ↑
            </AdminButton>
            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Xuống dòng ${index + 1}`}
              disabled={index === bullets.length - 1}
              onClick={() => onChange(moveListItem(bullets, index, 1))}
            >
              ↓
            </AdminButton>
            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Xóa dòng ${index + 1}`}
              onClick={() => onChange(bullets.filter((_, i) => i !== index))}
            >
              Xóa
            </AdminButton>
          </div>
        </div>
      ))}
      <AdminButton type="button" size="sm" variant="secondary" data-testid={`${testId}-add`} onClick={() => onChange([...bullets, ""])}>
        {addLabel}
      </AdminButton>
    </div>
  );
}
