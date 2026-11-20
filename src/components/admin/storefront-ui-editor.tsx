"use client";

import {
  AdminButton,
  AdminCard,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui";
import {
  UI_COPY_FIELD_LABELS,
  UI_COPY_SECTION_LABELS,
  type StorefrontUiCopy,
  type UiCopySectionKey,
} from "@/lib/storefront/ui-copy-types";

type Props = {
  draft: StorefrontUiCopy;
  onChange: (next: StorefrontUiCopy) => void;
  selected: UiCopySectionKey;
  onSelect: (k: UiCopySectionKey) => void;
};

export function StorefrontUiEditor({ draft, onChange, selected, onSelect }: Props) {
  const section = draft[selected];
  const labels = UI_COPY_FIELD_LABELS[selected];

  const patch = (key: string, value: string | boolean) => {
    onChange({
      ...draft,
      [selected]: { ...section, [key]: value },
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <AdminCard>
        <h2 className="mb-3 font-semibold">Khu vực cửa hàng</h2>
        <ul className="space-y-1 text-sm">
          {(Object.keys(UI_COPY_SECTION_LABELS) as UiCopySectionKey[]).map((k) => (
            <li key={k}>
              <button
                type="button"
                className={`w-full rounded px-2 py-2 text-left ${
                  selected === k ? "bg-[var(--admin-accent-soft)] font-medium" : "hover:bg-[var(--admin-surface-muted)]"
                }`}
                onClick={() => onSelect(k)}
              >
                {UI_COPY_SECTION_LABELS[k]}
              </button>
            </li>
          ))}
        </ul>
      </AdminCard>
      <AdminCard>
        <h2 className="mb-4 text-lg font-semibold">{UI_COPY_SECTION_LABELS[selected]}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(section).map(([key, value]) => {
            const label = labels[key] ?? key;
            if (typeof value === "boolean") {
              return (
                <label key={key} className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => patch(key, e.target.checked)}
                  />
                  {label}
                </label>
              );
            }
            const long = value.length > 80 || key.includes("body") || key.includes("intro") || key.includes("Hint");
            if (long) {
              return (
                <AdminTextarea
                  key={key}
                  className="sm:col-span-2"
                  label={label}
                  value={value}
                  onChange={(e) => patch(key, e.target.value)}
                />
              );
            }
            return (
              <AdminInput
                key={key}
                label={label}
                value={value}
                onChange={(e) => patch(key, e.target.value)}
              />
            );
          })}
        </div>
        <p className="mt-4 text-xs text-[var(--admin-text-muted)]">
          PDP: chuỗi tồn kho hỗ trợ {"{stock}"}, {"{color}"}, {"{size}"}.
        </p>
      </AdminCard>
    </div>
  );
}

export function StorefrontUiToolbar({
  hasChanges,
  busy,
  onSave,
  onPublish,
  onDiscard,
}: {
  hasChanges: boolean;
  busy: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminButton variant="secondary" disabled={busy} onClick={onSave}>
        Lưu nháp
      </AdminButton>
      <AdminButton variant="accent" disabled={busy} onClick={onPublish}>
        Xuất bản
      </AdminButton>
      {hasChanges ? (
        <AdminButton variant="ghost" disabled={busy} onClick={onDiscard}>
          Hủy nháp
        </AdminButton>
      ) : null}
    </div>
  );
}