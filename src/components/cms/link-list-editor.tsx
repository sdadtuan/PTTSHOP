"use client";

import { AdminButton, AdminInput } from "@/components/admin/ui";

export type EditableLink = {
  href: string;
  label: string;
  match?: string;
  hash?: string;
};

export function LinkListEditor({
  label,
  value,
  onChange,
  max = 16,
  showMatchFields = false,
  testId,
}: {
  label: string;
  value: EditableLink[];
  onChange: (next: EditableLink[]) => void;
  max?: number;
  showMatchFields?: boolean;
  testId: string;
}) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  const patch = (i: number, patch: Partial<EditableLink>) => {
    const next = [...value];
    next[i] = { ...next[i]!, ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {label}{" "}
          <span className="text-xs font-normal text-[var(--admin-text-muted)]">
            ({value.length}/{max})
          </span>
        </p>
        {value.length < max ? (
          <AdminButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onChange([...value, { href: "/", label: "Liên kết mới" }])}
          >
            + Thêm
          </AdminButton>
        ) : null}
      </div>
      <ul className="space-y-2">
        {value.map((item, i) => (
          <li
            key={`${i}-${item.href}-${item.label}`}
            className="space-y-2 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3"
            data-testid={`${testId}-item-${i}`}
          >
            <MotionControls
              i={i}
              total={value.length}
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
              onRemove={() => onChange(value.filter((_, k) => k !== i))}
            />
            <AdminInput
              label="Nhãn"
              value={item.label}
              onChange={(e) => patch(i, { label: e.target.value })}
            />
            <AdminInput
              label="Đường dẫn"
              value={item.href}
              onChange={(e) => patch(i, { href: e.target.value })}
              hint="Ví dụ: /san-pham hoặc https://..."
            />
            {showMatchFields ? (
              <>
                <AdminInput
                  label="Match (tùy chọn)"
                  value={item.match || ""}
                  onChange={(e) => patch(i, { match: e.target.value || undefined })}
                  hint="Dùng cho active state demo (ví dụ /demo-v2)."
                />
                <AdminInput
                  label="Hash (tùy chọn)"
                  value={item.hash || ""}
                  onChange={(e) => patch(i, { hash: e.target.value || undefined })}
                  hint="Ví dụ #danh-gia"
                />
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MotionControls({
  i,
  total,
  onUp,
  onDown,
  onRemove,
}: {
  i: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-[var(--admin-text-muted)]">
      <span>Mục {i + 1}</span>
      <div className="flex gap-1">
        <AdminButton type="button" size="sm" variant="ghost" disabled={i === 0} onClick={onUp}>
          ↑
        </AdminButton>
        <AdminButton type="button" size="sm" variant="ghost" disabled={i >= total - 1} onClick={onDown}>
          ↓
        </AdminButton>
        <AdminButton type="button" size="sm" variant="ghost" onClick={onRemove}>
          Xóa
        </AdminButton>
      </div>
    </div>
  );
}

export function FooterColumnsEditor({
  columns,
  onChange,
  testId,
}: {
  columns: Array<{ title: string; links: EditableLink[] }>;
  onChange: (next: Array<{ title: string; links: EditableLink[] }>) => void;
  testId: string;
}) {
  const patchCol = (i: number, patch: Partial<{ title: string; links: EditableLink[] }>) => {
    const next = [...columns];
    next[i] = { ...next[i]!, ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4" data-testid={testId}>
      <MotionHeader
        count={columns.length}
        max={6}
        onAdd={() => onChange([...columns, { title: "Cột mới", links: [] }])}
      />
      {columns.map((col, i) => (
        <div key={`col-${i}-${col.title}`} className="rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3">
          <AdminInput
            label={`Tiêu đề cột ${i + 1}`}
            value={col.title}
            onChange={(e) => patchCol(i, { title: e.target.value })}
          />
          <LinkListEditor
            label="Liên kết trong cột"
            value={col.links}
            onChange={(links) => patchCol(i, { links })}
            testId={`${testId}-col-${i}-links`}
          />
          <AdminButton
            type="button"
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => onChange(columns.filter((_, k) => k !== i))}
          >
            Xóa cột
          </AdminButton>
        </div>
      ))}
    </div>
  );
}

function MotionHeader({
  count,
  max,
  onAdd,
}: {
  count: number;
  max: number;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium">
        Cột chân trang ({count}/{max})
      </p>
      {count < max ? (
        <AdminButton type="button" size="sm" variant="secondary" onClick={onAdd}>
          + Thêm cột
        </AdminButton>
      ) : null}
    </div>
  );
}