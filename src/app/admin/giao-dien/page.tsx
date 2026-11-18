"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminInput,
  AdminPageHeader,
  AdminTextarea,
  useAdminToast,
} from "@/components/admin/ui";
import { CmsFieldList, ImageField, setPath } from "@/components/cms/cms-fields";
import { LAYOUT_SECTIONS, SECTION_FIELDS, SECTION_HELP } from "@/lib/cms/admin-fields";
import { ShippingPolicyCard } from "@/components/admin/shipping-policy-card";
import type { HomepageSectionKey, SiteSettingsData } from "@/lib/cms/types";

type CmsSection = {
  id: string;
  key: HomepageSectionKey;
  label: string;
  sortOrder: number;
  draftSortOrder: number;
  isEnabled: boolean;
  draftEnabled: boolean;
  content: Record<string, unknown>;
  draftContent: Record<string, unknown>;
};

type CmsVersion = { id: string; version: number; label: string | null; createdAt: string };

type CmsState = {
  settings: { published: SiteSettingsData; draft: SiteSettingsData };
  sections: CmsSection[];
  versions: CmsVersion[];
  currentVersionId: string | null;
  hasUnpublishedChanges: boolean;
  heroBanner: { id: string; imageUrl: string; title: string | null } | null;
  publishedAt: string | null;
};

type ProductOption = { id: string; name: string; image?: string; isFeatured?: boolean };
type CategoryOption = { id: string; name: string; slug: string };
type Tile = { categorySlug: string; title: string; description: string; imageUrl: string };

const PREVIEW = {
  desktop: { w: 1280, h: 860, scale: 0.6 },
  mobile: { w: 390, h: 844, scale: 0.75 },
} as const;

function errorText(data: { error?: string; issues?: Array<{ path: string; message: string }> }, fallback: string) {
  const issue = data.issues?.[0];
  return issue ? `${data.error || fallback}: ${issue.path} — ${issue.message}` : data.error || fallback;
}

export default function AdminGiaoDienPage() {
  const { toast } = useAdminToast();
  const [state, setState] = useState<CmsState | null>(null);
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [selectedKey, setSelectedKey] = useState<HomepageSectionKey>("hero");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const [previewHostW, setPreviewHostW] = useState(0);
  const previewHostRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPreviewHostW(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [productQuery, setProductQuery] = useState("");

  const applyState = useCallback((s: CmsState) => {
    setState(s);
    setSections(s.sections);
    setSettings(s.settings.draft);
    setDirty(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cmsRes, prodRes, catRes] = await Promise.all([
        fetch("/api/admin/homepage-cms", { cache: "no-store" }),
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);
      const cms = await cmsRes.json();
      if (!cmsRes.ok) throw new Error(errorText(cms, "Không tải được dữ liệu giao diện"));
      applyState(cms);
      if (prodRes.ok) {
        const { products: list = [] } = await prodRes.json();
        setProducts(
          (list as Array<{ id: string; name: string; isFeatured?: boolean; images?: Array<{ url: string }> }>).map((p) => ({
            id: p.id,
            name: p.name,
            isFeatured: p.isFeatured,
            image: p.images?.[0]?.url,
          })),
        );
      }
      if (catRes.ok) {
        const { categories: list = [] } = await catRes.json();
        setCategories(list as CategoryOption[]);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [applyState, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch (same pattern as other admin pages)
    void load();
  }, [load]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const sorted = useMemo(() => [...sections].sort((a, b) => a.draftSortOrder - b.draftSortOrder), [sections]);
  const bodySections = sorted.filter((s) => !LAYOUT_SECTIONS.includes(s.key));
  const selected = sections.find((s) => s.key === selectedKey);

  function patchSection(key: HomepageSectionKey, patch: Partial<CmsSection>) {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    setDirty(true);
  }

  function patchSettings(patch: Partial<SiteSettingsData>) {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  }

  function moveSection(key: HomepageSectionKey, dir: -1 | 1) {
    const order = bodySections.map((s) => s.key);
    const i = order.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j]!, order[i]!];
    // header stays first, footer last; body sections get 1..n in the new order.
    const rank = new Map<HomepageSectionKey, number>([["header", 0], ...order.map((k, n) => [k, n + 1] as [HomepageSectionKey, number]), ["footer", order.length + 1]]);
    setSections((prev) => prev.map((s) => ({ ...s, draftSortOrder: rank.get(s.key) ?? s.draftSortOrder })));
    setDirty(true);
  }

  async function upload(file: File): Promise<string | null> {
    if (file.size > 5 * 1024 * 1024) {
      toast("Ảnh tối đa 5MB", "error");
      return null;
    }
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error || "Upload thất bại", "error");
      return null;
    }
    toast("Đã tải ảnh lên — nhớ Lưu nháp", "success");
    return data.url as string;
  }

  async function post(body: Record<string, unknown>, fallbackError: string) {
    const res = await fetch("/api/admin/homepage-cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(errorText(data, fallbackError));
    return data as CmsState;
  }

  async function saveDraft(opts: { quiet?: boolean } = {}) {
    if (!settings) return false;
    try {
      const data = await post(
        {
          action: "save_draft",
          settings,
          sections: sections.map((s) => ({
            key: s.key,
            draftEnabled: s.draftEnabled,
            sortOrder: s.draftSortOrder,
            draftContent: s.draftContent,
          })),
        },
        "Lưu nháp thất bại",
      );
      applyState(data);
      setPreviewKey((k) => k + 1);
      if (!opts.quiet) toast("Đã lưu nháp — trang chủ thật chưa thay đổi", "success");
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi lưu nháp", "error");
      return false;
    }
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  const onSave = () => run(async () => void (await saveDraft()));

  const onPreview = () =>
    run(async () => {
      if (dirty && !(await saveDraft({ quiet: true }))) return;
      setPreviewKey((k) => k + 1);
      document.getElementById("cms-preview")?.scrollIntoView({ behavior: "smooth" });
    });

  const onPublish = () =>
    run(async () => {
      if (!confirm("Xuất bản bản nháp lên trang chủ thật?")) return;
      if (dirty && !(await saveDraft({ quiet: true }))) return;
      try {
        applyState(await post({ action: "publish" }, "Xuất bản thất bại"));
        setPreviewKey((k) => k + 1);
        toast("Đã xuất bản trang chủ", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Lỗi xuất bản", "error");
      }
    });

  const onRestore = (versionId: string | null, label: string) =>
    run(async () => {
      if (!confirm(`Khôi phục ${label}? Trang chủ thật sẽ đổi ngay, bản nháp hiện tại sẽ bị thay.`)) return;
      try {
        applyState(
          await post(versionId ? { action: "restore", versionId } : { action: "restore_previous" }, "Khôi phục thất bại"),
        );
        setPreviewKey((k) => k + 1);
        toast("Đã khôi phục phiên bản", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Lỗi khôi phục", "error");
      }
    });

  const onDiscard = () =>
    run(async () => {
      if (!confirm("Bỏ toàn bộ thay đổi chưa xuất bản?")) return;
      try {
        applyState(await post({ action: "discard_draft" }, "Không hủy được nháp"));
        setPreviewKey((k) => k + 1);
        toast("Đã hủy bản nháp", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Lỗi", "error");
      }
    });

  const changed = (s: CmsSection) =>
    s.isEnabled !== s.draftEnabled ||
    s.sortOrder !== s.draftSortOrder ||
    JSON.stringify(s.content) !== JSON.stringify(s.draftContent);

  const disabled = busy || loading || !state;
  const pv = PREVIEW[previewMode];
  // Fit the preview frame to the available width (phones/tablets) — never larger than the design scale.
  const previewScale = previewHostW ? Math.min(pv.scale, previewHostW / pv.w) : pv.scale;

  return (
    <div className="space-y-6" data-testid="admin-giao-dien">
      <AdminPageHeader
        title="Quản lý giao diện"
        description="Chỉnh toàn bộ nội dung trang chủ. Lưu nháp không đổi trang thật; bấm Xuất bản để áp dụng."
        breadcrumbs={[{ href: "/admin", label: "Admin" }, { label: "Quản lý giao diện" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" disabled={disabled} data-testid="cms-save-draft" onClick={() => void onSave()}>
              Lưu nháp
            </AdminButton>
            <AdminButton variant="secondary" disabled={disabled} data-testid="cms-preview" onClick={() => void onPreview()}>
              Xem trước
            </AdminButton>
            <AdminButton variant="accent" disabled={disabled} data-testid="cms-publish" onClick={() => void onPublish()}>
              Xuất bản
            </AdminButton>
            <AdminButton
              variant="secondary"
              disabled={disabled || (state?.versions.length ?? 0) < 2}
              data-testid="cms-restore-previous"
              onClick={() => void onRestore(null, "phiên bản trước")}
            >
              Khôi phục phiên bản trước
            </AdminButton>
          </div>
        }
      />

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {dirty ? (
              <AdminBadge tone="pending">Có chỉnh sửa chưa lưu</AdminBadge>
            ) : state?.hasUnpublishedChanges ? (
              <AdminBadge tone="info">Nháp đã lưu, chưa xuất bản</AdminBadge>
            ) : (
              <AdminBadge tone="success">Trang chủ đang khớp bản nháp</AdminBadge>
            )}
            {state?.publishedAt ? (
              <span className="text-xs text-[var(--admin-text-muted)]">
                Xuất bản lần cuối: {new Date(state.publishedAt).toLocaleString("vi-VN")}
              </span>
            ) : null}
          </div>
          {state?.hasUnpublishedChanges || dirty ? (
            <AdminButton size="sm" variant="ghost" disabled={disabled} data-testid="cms-discard" onClick={() => void onDiscard()}>
              Hủy bản nháp
            </AdminButton>
          ) : null}
        </div>
      </AdminCard>

      <ShippingPolicyCard />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="min-w-0" data-testid="admin-sections">
          <AdminCard>
            <h2 className="mb-1 font-semibold">Khu vực trang chủ</h2>
            <p className="mb-3 text-xs text-[var(--admin-text-muted)]">Theo đúng thứ tự trên trang. Bật/tắt và ↑↓ để sắp xếp.</p>
            {loading ? (
              <p className="text-sm text-[var(--admin-text-muted)]">Đang tải…</p>
            ) : (
              <ul className="space-y-2">
                {sorted.map((s) => {
                  const fixed = LAYOUT_SECTIONS.includes(s.key);
                  const bi = bodySections.findIndex((b) => b.key === s.key);
                  return (
                    <li
                      key={s.key}
                      className={`rounded-[var(--admin-radius-md)] border p-2 ${
                        selectedKey === s.key
                          ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]"
                          : "border-[var(--admin-border)]"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left text-sm font-medium"
                          data-testid={`cms-section-${s.key}`}
                          onClick={() => setSelectedKey(s.key)}
                        >
                          {s.label}
                          <span className="mt-0.5 flex flex-wrap gap-1 text-xs font-normal">
                            {fixed ? (
                              <span className="text-[var(--admin-text-muted)]">Cố định</span>
                            ) : s.draftEnabled ? (
                              <span className="text-[var(--admin-success)]">Đang bật</span>
                            ) : (
                              <span className="text-[var(--admin-text-muted)]">Đang tắt</span>
                            )}
                            {changed(s) ? <span className="text-[var(--admin-warning)]">· chưa xuất bản</span> : null}
                          </span>
                        </button>
                        {!fixed ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <input
                              type="checkbox"
                              aria-label={`Bật ${s.label}`}
                              title="Bật/tắt khu vực"
                              data-testid={`cms-toggle-${s.key}`}
                              checked={s.draftEnabled}
                              onChange={(e) => patchSection(s.key, { draftEnabled: e.target.checked })}
                            />
                            <AdminButton size="sm" variant="ghost" aria-label="Lên" disabled={bi <= 0} data-testid={`cms-up-${s.key}`} onClick={() => moveSection(s.key, -1)}>
                              ↑
                            </AdminButton>
                            <AdminButton size="sm" variant="ghost" aria-label="Xuống" disabled={bi >= bodySections.length - 1} data-testid={`cms-down-${s.key}`} onClick={() => moveSection(s.key, 1)}>
                              ↓
                            </AdminButton>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>

        <div className="min-w-0" data-testid="admin-edit-form">
          <AdminCard>
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold" data-testid="cms-edit-title">
                {selected?.label || "…"}
              </h2>
              <p className="text-sm text-[var(--admin-text-muted)]">{SECTION_HELP[selectedKey]}</p>
            </div>

            {!selected || !settings ? (
              <p className="text-sm text-[var(--admin-text-muted)]">Đang tải…</p>
            ) : selectedKey === "header" ? (
              <div className="space-y-3">
                <AdminInput label="Tên thương hiệu" data-testid="cms-brand-name" value={settings.brandName} onChange={(e) => patchSettings({ brandName: e.target.value })} />
                <ImageField
                  label="Logo (để trống = dùng chữ thương hiệu như hiện tại)"
                  value={settings.logoUrl || ""}
                  onChange={(v) => patchSettings({ logoUrl: v || null })}
                  upload={upload}
                  testId="cms-logo"
                  hint="PNG/WebP nền trong suốt, cao ~80px."
                />
                <div className="space-y-1.5 text-sm">
                  <span className="font-medium">Màu thương hiệu</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Chọn màu thương hiệu"
                      className="h-10 w-14 cursor-pointer rounded border border-[var(--admin-border)]"
                      value={/^#[0-9a-f]{6}$/i.test(settings.brandColor) ? settings.brandColor : "#f97316"}
                      onChange={(e) => patchSettings({ brandColor: e.target.value })}
                    />
                    <AdminInput aria-label="Mã màu" data-testid="cms-brand-color" value={settings.brandColor} onChange={(e) => patchSettings({ brandColor: e.target.value })} />
                    <AdminButton size="sm" variant="ghost" onClick={() => patchSettings({ brandColor: "#f97316" })}>
                      Màu gốc
                    </AdminButton>
                  </div>
                  <span className="block text-xs text-[var(--admin-text-muted)]">Áp dụng cho nút, điểm nhấn và chữ màu trên toàn site.</span>
                </div>
              </div>
            ) : selectedKey === "footer" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminTextarea label="Mô tả dưới logo" className="sm:col-span-2" value={settings.footerTagline} onChange={(e) => patchSettings({ footerTagline: e.target.value })} />
                <AdminInput label="Địa chỉ" data-testid="cms-contact-address" value={settings.contactAddress} onChange={(e) => patchSettings({ contactAddress: e.target.value })} />
                <AdminInput label="Email" value={settings.contactEmail} onChange={(e) => patchSettings({ contactEmail: e.target.value })} />
                <AdminInput label="Điện thoại" value={settings.contactPhone} onChange={(e) => patchSettings({ contactPhone: e.target.value })} />
                <AdminInput label="Giờ mở cửa" value={settings.contactHours} onChange={(e) => patchSettings({ contactHours: e.target.value })} />
                <AdminInput label="Instagram" value={settings.socialInstagram} onChange={(e) => patchSettings({ socialInstagram: e.target.value })} />
                <AdminInput label="Facebook" value={settings.socialFacebook} onChange={(e) => patchSettings({ socialFacebook: e.target.value })} />
                <AdminInput label="TikTok" value={settings.socialTiktok} onChange={(e) => patchSettings({ socialTiktok: e.target.value })} />
                <AdminInput label="YouTube" value={settings.socialYoutube} onChange={(e) => patchSettings({ socialYoutube: e.target.value })} />
                <p className="text-xs text-[var(--admin-text-muted)] sm:col-span-2">Logo và tên thương hiệu ở chân trang dùng chung với mục Header / Logo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedKey === "hero" ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-[var(--admin-radius-md)] bg-[var(--admin-surface-muted)] p-3 text-sm">
                    {state?.heroBanner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={state.heroBanner.imageUrl} alt="" className="h-16 w-14 rounded object-cover" />
                    ) : null}
                    <div className="min-w-[12rem] flex-1">
                      <p className="font-medium">Ảnh vỡ mảnh (shatter) dùng chung với “Banner trang chủ”</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        Đổi ảnh lớn và tự chia ô tại trang Banner trang chủ. Tiêu đề, mô tả, nút ở đây.
                      </p>
                    </div>
                    <Link href="/admin/banners" className="text-sm font-semibold text-[var(--admin-accent-hover)] underline" data-testid="cms-open-banners">
                      Mở Banner trang chủ →
                    </Link>
                  </div>
                ) : null}

                <CmsFieldList
                  sectionKey={selectedKey}
                  defs={SECTION_FIELDS[selectedKey] ?? []}
                  value={selected.draftContent}
                  onChange={(v) => patchSection(selectedKey, { draftContent: v })}
                  upload={upload}
                />

                {selectedKey === "collections" ? (
                  <div className="space-y-3" data-testid="cms-collection-tiles">
                    <p className="text-sm font-medium">3 ô bộ sưu tập</p>
                    {((selected.draftContent.tiles as Tile[]) || []).map((t, i) => {
                      const setTile = (patch: Partial<Tile>) => {
                        const tiles = [...((selected.draftContent.tiles as Tile[]) || [])];
                        tiles[i] = { ...tiles[i]!, ...patch };
                        patchSection(selectedKey, { draftContent: setPath(selected.draftContent, "tiles", tiles) });
                      };
                      return (
                        <div key={i} className="space-y-2 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3">
                          <p className="text-xs font-semibold text-[var(--admin-text-muted)]">Ô {i + 1}</p>
                          <label className="block space-y-1.5 text-sm">
                            <span className="font-medium">Danh mục (link tới)</span>
                            <select
                              className="w-full rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white px-3 py-2 text-sm"
                              data-testid={`cms-tile-${i}-category`}
                              value={t.categorySlug}
                              onChange={(e) => setTile({ categorySlug: e.target.value })}
                            >
                              {!categories.some((c) => c.slug === t.categorySlug) ? <option value={t.categorySlug}>{t.categorySlug}</option> : null}
                              {categories.map((c) => (
                                <option key={c.id} value={c.slug}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <AdminInput label="Tiêu đề ô" hint="Để trống = dùng tên danh mục" value={t.title} onChange={(e) => setTile({ title: e.target.value })} />
                          <AdminInput label="Mô tả ô" value={t.description} onChange={(e) => setTile({ description: e.target.value })} />
                          <ImageField label="Ảnh ô" value={t.imageUrl} onChange={(v) => setTile({ imageUrl: v })} upload={upload} testId={`cms-tile-${i}-image`} />
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {selectedKey === "featured" ? (
                  <div className="space-y-2 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3" data-testid="cms-featured-products">
                    <p className="text-sm font-medium">Chọn sản phẩm nổi bật (theo thứ tự hiển thị, tối đa 6)</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      Để trống = tự lấy sản phẩm được đánh dấu “Nổi bật” trong Quản lý sản phẩm (như hiện tại).
                    </p>
                    {(() => {
                      const ids = (selected.draftContent.productIds as string[]) || [];
                      const setIds = (next: string[]) => patchSection(selectedKey, { draftContent: setPath(selected.draftContent, "productIds", next) });
                      const byId = new Map(products.map((p) => [p.id, p]));
                      const q = productQuery.trim().toLowerCase();
                      return (
                        <>
                          <ol className="space-y-1">
                            {ids.map((id, i) => (
                              <li key={id} className="flex items-center gap-2 text-sm">
                                <span className="w-5 text-xs text-[var(--admin-text-muted)]">{i + 1}</span>
                                {byId.get(id)?.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={byId.get(id)!.image} alt="" className="h-8 w-8 rounded object-cover" />
                                ) : null}
                                <span className="min-w-0 flex-1 truncate">{byId.get(id)?.name || id}</span>
                                <AdminButton size="sm" variant="ghost" disabled={i === 0} onClick={() => { const n = [...ids]; [n[i - 1], n[i]] = [n[i]!, n[i - 1]!]; setIds(n); }}>↑</AdminButton>
                                <AdminButton size="sm" variant="ghost" disabled={i === ids.length - 1} onClick={() => { const n = [...ids]; [n[i + 1], n[i]] = [n[i]!, n[i + 1]!]; setIds(n); }}>↓</AdminButton>
                                <AdminButton size="sm" variant="ghost" onClick={() => setIds(ids.filter((x) => x !== id))}>Bỏ</AdminButton>
                              </li>
                            ))}
                          </ol>
                          <AdminInput aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm…" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
                          <ul className="max-h-56 space-y-1 overflow-auto">
                            {products
                              .filter((p) => !ids.includes(p.id) && (!q || p.name.toLowerCase().includes(q)))
                              .slice(0, 50)
                              .map((p) => (
                                <li key={p.id} className="flex items-center gap-2 text-sm">
                                  {p.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.image} alt="" loading="lazy" className="h-8 w-8 rounded object-cover" />
                                  ) : null}
                                  <span className="min-w-0 flex-1 truncate">
                                    {p.name} {p.isFeatured ? <AdminBadge tone="accent">Nổi bật</AdminBadge> : null}
                                  </span>
                                  <AdminButton size="sm" variant="secondary" disabled={ids.length >= 6} data-testid={`cms-pick-${p.id}`} onClick={() => setIds([...ids, p.id])}>
                                    Chọn
                                  </AdminButton>
                                </li>
                              ))}
                          </ul>
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            )}
          </AdminCard>
        </div>
      </div>

      <div id="cms-preview" data-testid="cms-preview-card">
        <AdminCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Xem trước bản nháp</h2>
              <p className="text-xs text-[var(--admin-text-muted)]">
                Hiển thị bản nháp đã lưu ({pv.w}px). Khách vẫn thấy bản đã xuất bản. Bấm “Xem trước” để lưu và tải lại.
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <AdminButton size="sm" variant={previewMode === "desktop" ? "primary" : "secondary"} data-testid="cms-preview-desktop" onClick={() => setPreviewMode("desktop")}>
                Máy tính
              </AdminButton>
              <AdminButton size="sm" variant={previewMode === "mobile" ? "primary" : "secondary"} data-testid="cms-preview-mobile" onClick={() => setPreviewMode("mobile")}>
                Điện thoại
              </AdminButton>
              <a href="/?cmsPreview=draft" target="_blank" rel="noopener" className="inline-flex h-8 items-center px-3 text-xs font-semibold text-[var(--admin-accent-hover)] underline">
                Mở tab mới
              </a>
            </div>
          </div>
          <div ref={previewHostRef} className="w-full min-w-0 overflow-hidden">
          <div
            className="mx-auto overflow-hidden rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-neutral-100"
            style={{ width: pv.w * previewScale, maxWidth: "100%", height: pv.h * previewScale }}
            data-testid={previewMode === "desktop" ? "admin-preview-desktop" : "admin-preview-mobile"}
          >
            <iframe
              key={`${previewMode}-${previewKey}`}
              title={`Xem trước trang chủ (${previewMode})`}
              src={`/?cmsPreview=draft&v=${previewKey}`}
              data-testid="cms-preview-frame"
              style={{ width: pv.w, height: pv.h, transform: `scale(${previewScale})`, transformOrigin: "top left", border: 0, background: "white" }}
            />
          </div>
          </div>
        </AdminCard>
      </div>

      <div data-testid="admin-version-history">
        <AdminCard>
          <h2 className="mb-1 font-semibold">Lịch sử phiên bản</h2>
          <p className="mb-3 text-xs text-[var(--admin-text-muted)]">Mỗi lần Xuất bản hoặc Khôi phục tạo một phiên bản. Bấm Khôi phục để đưa trang chủ về đúng phiên bản đó.</p>
          {!state?.versions.length ? (
            <p className="text-sm text-[var(--admin-text-muted)]">Chưa có phiên bản.</p>
          ) : (
            <ul className="divide-y divide-[var(--admin-border)]">
              {state.versions.map((v) => {
                const current = v.id === state.currentVersionId;
                return (
                  <li key={v.id} className="flex items-center justify-between gap-2 py-2" data-testid={`cms-version-${v.version}`}>
                    <div>
                      <p className="text-sm font-medium">
                        v{v.version} · {v.label || "Phiên bản"} {current ? <AdminBadge tone="success">Đang hiển thị</AdminBadge> : null}
                      </p>
                      <p className="text-xs text-[var(--admin-text-muted)]">{new Date(v.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                    <AdminButton size="sm" variant="secondary" data-testid={`cms-restore-${v.version}`} disabled={disabled || current} onClick={() => void onRestore(v.id, `v${v.version}`)}>
                      Khôi phục
                    </AdminButton>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
