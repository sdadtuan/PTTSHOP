"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AdminButton,
  AdminCard,
  AdminInput,
  AdminPageHeader,
  AdminTextarea,
  useAdminToast,
} from "@/components/admin/ui";
import { StorefrontUiEditor, StorefrontUiToolbar } from "@/components/admin/storefront-ui-editor";
import {
  DEFAULT_STOREFRONT_UI,
  type StorefrontUiCopy,
  type UiCopySectionKey,
} from "@/lib/storefront/ui-copy-types";

type PageRow = {
  id: string;
  slug: string;
  title: string;
  draftTitle: string;
  draftDescription: string | null;
  draftBody: string[];
  updatedAt: string;
};

export default function AdminNoiDungPage() {
  const { toast } = useAdminToast();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftBody, setDraftBody] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"pages" | "ui">("pages");
  const [uiDraft, setUiDraft] = useState<StorefrontUiCopy>(DEFAULT_STOREFRONT_UI);
  const [uiHasChanges, setUiHasChanges] = useState(false);
  const [uiSection, setUiSection] = useState<UiCopySectionKey>("contact");

  const selected = pages.find((p) => p.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/storefront-pages", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tải được");
      setPages(data.pages);
      setSelectedId((cur) => cur ?? data.pages[0]?.id ?? null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadUi = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/storefront-ui", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tải được UI copy");
      setUiDraft(data.draft);
      setUiHasChanges(data.hasUnpublishedChanges);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi tải UI", "error");
    }
  }, [toast]);

  useEffect(() => {
    void load();
    void loadUi();
  }, [load, loadUi]);

  useEffect(() => {
    if (!selected) return;
    setDraftTitle(selected.draftTitle);
    setDraftDescription(selected.draftDescription || "");
    setDraftBody(selected.draftBody.length ? [...selected.draftBody] : [""]);
  }, [selected]);

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/storefront-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi");
    setPages(data.pages);
    return data;
  }

  const onSave = () =>
    void (async () => {
      if (!selected) return;
      setBusy(true);
      try {
        await post({
          action: "save",
          id: selected.id,
          draftTitle,
          draftDescription: draftDescription || null,
          draftBody: draftBody.filter((l) => l.trim()),
        });
        toast("Đã lưu nháp trang", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Lỗi lưu", "error");
      } finally {
        setBusy(false);
      }
    })();

  const onPublish = () =>
    void (async () => {
      if (!selected || !confirm("Xuất bản nội dung này lên website?")) return;
      setBusy(true);
      try {
        await post({
          action: "save",
          id: selected.id,
          draftTitle,
          draftDescription: draftDescription || null,
          draftBody: draftBody.filter((l) => l.trim()),
        });
        await post({ action: "publish", id: selected.id });
        toast("Đã xuất bản", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Lỗi xuất bản", "error");
      } finally {
        setBusy(false);
      }
    })();

  return (
    <div className="space-y-6" data-testid="admin-noi-dung">
      <AdminPageHeader
        title="Trang nội dung"
        description="Trang tĩnh (Về chúng tôi, Hỗ trợ, Tin tức…) và copy giao diện cửa hàng (giỏ hàng, đăng nhập, liên hệ…)."
        breadcrumbs={[{ href: "/admin", label: "Admin" }, { label: "Trang nội dung" }]}
        actions={
          tab === "pages" ? (
            <div className="flex gap-2">
              <AdminButton variant="secondary" disabled={busy || !selected} onClick={onSave}>
                Lưu nháp
              </AdminButton>
              <AdminButton variant="accent" disabled={busy || !selected} onClick={onPublish}>
                Xuất bản
              </AdminButton>
            </div>
          ) : (
            <StorefrontUiToolbar
              hasChanges={uiHasChanges}
              busy={busy}
              onSave={() =>
                void (async () => {
                  setBusy(true);
                  try {
                    const res = await fetch("/api/admin/storefront-ui", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "save_draft", draft: uiDraft }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Lỗi");
                    setUiDraft(data.draft);
                    setUiHasChanges(data.hasUnpublishedChanges);
                    toast("Đã lưu nháp copy cửa hàng", "success");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Lỗi", "error");
                  } finally {
                    setBusy(false);
                  }
                })()
              }
              onPublish={() =>
                void (async () => {
                  if (!confirm("Xuất bản toàn bộ copy cửa hàng lên site?")) return;
                  setBusy(true);
                  try {
                    await fetch("/api/admin/storefront-ui", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "save_draft", draft: uiDraft }),
                    });
                    const res = await fetch("/api/admin/storefront-ui", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "publish" }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Lỗi");
                    setUiDraft(data.draft);
                    setUiHasChanges(false);
                    toast("Đã xuất bản copy cửa hàng", "success");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Lỗi", "error");
                  } finally {
                    setBusy(false);
                  }
                })()
              }
              onDiscard={() =>
                void (async () => {
                  if (!confirm("Hủy nháp copy cửa hàng?")) return;
                  setBusy(true);
                  try {
                    const res = await fetch("/api/admin/storefront-ui", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "discard_draft" }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Lỗi");
                    setUiDraft(data.draft);
                    setUiHasChanges(false);
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Lỗi", "error");
                  } finally {
                    setBusy(false);
                  }
                })()
              }
            />
          )
        }
      />

      <MotionUITabs tab={tab} onTab={setTab} />

      {tab === "ui" ? (
        <StorefrontUiEditor
          draft={uiDraft}
          onChange={(next) => {
            setUiDraft(next);
            setUiHasChanges(true);
          }}
          selected={uiSection}
          onSelect={setUiSection}
        />
      ) : null}

      {tab === "pages" ? (
      <MotionLayout loading={loading} pages={pages} selectedId={selectedId} onSelect={setSelectedId}>
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--admin-text-muted)]">
              Đường dẫn:{" "}
              <Link href={`/${selected.slug}`} className="font-medium text-[var(--admin-accent-hover)] underline" target="_blank">
                /{selected.slug}
              </Link>
            </p>
            <AdminInput label="Tiêu đề" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
            <AdminInput
              label="Mô tả (SEO)"
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Nội dung (mỗi ô = 1 đoạn / 1 dòng danh sách)</p>
                <AdminButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setDraftBody([...draftBody, ""])}
                >
                  + Thêm đoạn
                </AdminButton>
              </div>
              {draftBody.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <AdminTextarea
                    className="flex-1"
                    aria-label={`Đoạn ${i + 1}`}
                    value={line}
                    onChange={(e) => {
                      const next = [...draftBody];
                      next[i] = e.target.value;
                      setDraftBody(next);
                    }}
                  />
                  <AdminButton type="button" size="sm" variant="ghost" onClick={() => setDraftBody(draftBody.filter((_, k) => k !== i))}>
                    Xóa
                  </AdminButton>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--admin-text-muted)]">Chọn một trang để chỉnh.</p>
        )}
      </MotionLayout>
      ) : null}
    </div>
  );
}

function MotionUITabs({
  tab,
  onTab,
}: {
  tab: "pages" | "ui";
  onTab: (t: "pages" | "ui") => void;
}) {
  return (
    <MotionTabRow>
      <AdminButton variant={tab === "pages" ? "accent" : "secondary"} size="sm" onClick={() => onTab("pages")}>
        Trang tĩnh
      </AdminButton>
      <AdminButton variant={tab === "ui" ? "accent" : "secondary"} size="sm" onClick={() => onTab("ui")}>
        Copy cửa hàng (A)
      </AdminButton>
    </MotionTabRow>
  );
}

function MotionTabRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function MotionLayout({
  loading,
  pages,
  selectedId,
  onSelect,
  children,
}: {
  loading: boolean;
  pages: PageRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <AdminCard>
        <h2 className="mb-3 font-semibold">Danh sách trang</h2>
        {loading ? (
          <p className="text-sm text-[var(--admin-text-muted)]">Đang tải…</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pages.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`w-full rounded px-2 py-2 text-left ${
                    selectedId === p.id
                      ? "bg-[var(--admin-accent-soft)] font-medium"
                      : "hover:bg-[var(--admin-surface-muted)]"
                  }`}
                  onClick={() => onSelect(p.id)}
                >
                  {p.title}
                  <span className="mt-0.5 block text-xs text-[var(--admin-text-muted)]">/{p.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
      <AdminCard>{children}</AdminCard>
    </div>
  );
}