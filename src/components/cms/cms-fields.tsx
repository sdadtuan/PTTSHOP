"use client";

import { useRef } from "react";
import { AdminButton, AdminInput, AdminTextarea } from "@/components/admin/ui";

export type FieldKind = "text" | "textarea" | "href" | "image" | "images" | "lines" | "bool";

export type FieldDef = {
  path: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  /** Max items for images/lines lists. */
  max?: number;
};

export type UploadFn = (file: File) => Promise<string | null>;

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function Thumb({ src, testId }: { src: string; testId?: string }) {
  if (!src) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded border border-dashed border-[var(--admin-border)] text-[10px] text-[var(--admin-text-subtle)]">
        Trống
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of arbitrary URL
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-20 w-20 shrink-0 rounded border border-[var(--admin-border)] object-cover"
      data-testid={testId}
    />
  );
}

function UploadButton({
  onFile,
  testId,
  label = "Tải ảnh lên",
}: {
  onFile: (f: File) => void;
  testId?: string;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <AdminButton type="button" size="sm" variant="secondary" onClick={() => ref.current?.click()}>
        {label}
      </AdminButton>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        className="hidden"
        data-testid={testId}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
    </>
  );
}

/** Single image: preview + upload/replace + URL + delete. */
export function ImageField({
  label,
  value,
  onChange,
  upload,
  hint,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  upload: UploadFn;
  hint?: string;
  testId: string;
}) {
  return (
    <div className="space-y-2 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3" data-testid={testId}>
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-start gap-3">
        <Thumb src={value} testId={`${testId}-preview`} />
        <div className="min-w-[200px] flex-1 space-y-2">
          <AdminInput
            aria-label={`${label} (đường dẫn)`}
            value={value}
            placeholder="/media/uploads/… hoặc https://…"
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <UploadButton
              testId={`${testId}-upload`}
              label={value ? "Thay ảnh" : "Tải ảnh lên"}
              onFile={(f) => void upload(f).then((url) => url && onChange(url))}
            />
            {value ? (
              <AdminButton type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                Xóa ảnh
              </AdminButton>
            ) : null}
          </div>
          {hint ? <p className="text-xs text-[var(--admin-text-muted)]">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

/** Ordered image list: preview each, replace, delete, move up/down, add. */
export function ImageListField({
  label,
  value,
  onChange,
  upload,
  max = 9,
  hint,
  testId,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  upload: UploadFn;
  max?: number;
  hint?: string;
  testId: string;
}) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="space-y-2 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {label} <span className="text-xs text-[var(--admin-text-muted)]">({value.length}/{max})</span>
        </p>
        {value.length < max ? (
          <UploadButton
            testId={`${testId}-add`}
            label="+ Thêm ảnh"
            onFile={(f) => void upload(f).then((url) => url && onChange([...value, url]))}
          />
        ) : null}
      </div>
      {hint ? <p className="text-xs text-[var(--admin-text-muted)]">{hint}</p> : null}
      <ul className="grid gap-2 sm:grid-cols-2">
        {value.map((src, i) => (
          <li
            key={`${i}-${src}`}
            className="flex items-center gap-2 rounded border border-[var(--admin-border)] p-2"
            data-testid={`${testId}-item-${i}`}
          >
            <span className="w-5 text-center text-xs text-[var(--admin-text-muted)]">{i + 1}</span>
            <Thumb src={src} />
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <AdminButton type="button" size="sm" variant="secondary" aria-label="Lên" disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </AdminButton>
                <AdminButton type="button" size="sm" variant="secondary" aria-label="Xuống" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </AdminButton>
              </div>
              <UploadButton
                label="Thay"
                onFile={(f) =>
                  void upload(f).then((url) => {
                    if (!url) return;
                    const next = [...value];
                    next[i] = url;
                    onChange(next);
                  })
                }
              />
              <AdminButton type="button" size="sm" variant="ghost" onClick={() => onChange(value.filter((_, k) => k !== i))}>
                Xóa
              </AdminButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, p) => (cur && typeof cur === "object" ? (cur as Record<string, unknown>)[p] : undefined), obj);
}

export function setPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const parts = path.split(".");
  const root: Record<string, unknown> = { ...obj };
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    const child = cur[p];
    cur[p] = Array.isArray(child) ? [...child] : { ...(child as Record<string, unknown>) };
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
  return root as T;
}

/** Renders a list of declarative field definitions against a content object. */
export function CmsFieldList({
  defs,
  value,
  onChange,
  upload,
  sectionKey,
}: {
  defs: FieldDef[];
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  upload: UploadFn;
  sectionKey: string;
}) {
  return (
    <div className="space-y-3">
      {defs.map((f) => {
        const raw = getPath(value, f.path);
        const testId = `cms-field-${sectionKey}-${f.path.replace(/\./g, "-")}`;
        const set = (v: unknown) => onChange(setPath(value, f.path, v));
        switch (f.kind) {
          case "bool":
            return (
              <label key={f.path} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={Boolean(raw)} data-testid={testId} onChange={(e) => set(e.target.checked)} />
                <span>
                  <span className="font-medium">{f.label}</span>
                  {f.hint ? <span className="block text-xs text-[var(--admin-text-muted)]">{f.hint}</span> : null}
                </span>
              </label>
            );
          case "image":
            return <ImageField key={f.path} label={f.label} hint={f.hint} value={String(raw ?? "")} onChange={set} upload={upload} testId={testId} />;
          case "images":
            return (
              <ImageListField
                key={f.path}
                label={f.label}
                hint={f.hint}
                max={f.max}
                value={Array.isArray(raw) ? (raw as string[]) : []}
                onChange={set}
                upload={upload}
                testId={testId}
              />
            );
          case "lines":
            return (
              <AdminTextarea
                key={f.path}
                label={f.label}
                rows={4}
                data-testid={testId}
                value={Array.isArray(raw) ? (raw as string[]).join("\n") : ""}
                onChange={(e) =>
                  set(
                    e.target.value
                      .split("\n")
                      .map((x) => x.trimStart())
                      .slice(0, f.max ?? 8),
                  )
                }
                onBlur={(e) => set(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))}
              />
            );
          case "textarea":
            return <AdminTextarea key={f.path} label={f.label} rows={3} data-testid={testId} value={String(raw ?? "")} onChange={(e) => set(e.target.value)} />;
          default:
            return (
              <AdminInput
                key={f.path}
                label={f.label}
                hint={f.hint ?? (f.kind === "href" ? "Đường dẫn trong web (vd. /san-pham) hoặc https://…" : undefined)}
                data-testid={testId}
                value={String(raw ?? "")}
                onChange={(e) => set(e.target.value)}
              />
            );
        }
      })}
    </div>
  );
}
