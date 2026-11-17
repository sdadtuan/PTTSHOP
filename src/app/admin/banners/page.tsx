"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminTableSkeleton,
  useAdminToast,
} from "@/components/admin/ui";

type HeroBanner = {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  focalPoint: string;
  gridCols: number;
  gridRows: number;
  sortOrder: number;
  isActive: boolean;
};

function PreviewGrid({
  imageUrl,
  cols,
  rows,
  focalPoint,
}: {
  imageUrl: string;
  cols: number;
  rows: number;
  focalPoint: string;
}) {
  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = cols <= 1 ? 50 : (col / (cols - 1)) * 100;
    const y = rows <= 1 ? 50 : (row / (rows - 1)) * 100;
    return { i, x, y };
  });
  return (
    <div
      className="grid aspect-[3/4] w-full max-w-xs gap-1.5 overflow-hidden rounded-[var(--admin-radius-md)]"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
      data-testid="admin-banner-preview-grid"
    >
      {cells.map((c) => (
        <div
          key={c.i}
          className="rounded-md bg-neutral-200 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: `${cols * 100}% ${rows * 100}%`,
            backgroundPosition: `${c.x}% ${c.y}%`,
          }}
          title={`focal ${focalPoint}`}
        />
      ))}
    </div>
  );
}

export default function AdminBannersPage() {
  const { toast } = useAdminToast();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");
  const [title, setTitle] = useState("Mặc Đơn Giản");
  const [subtitle, setSubtitle] = useState("Vẫn Nổi Bật");
  const [ctaLabel, setCtaLabel] = useState("Xem sản phẩm");
  const [ctaHref, setCtaHref] = useState("/san-pham");
  const [focalPoint, setFocalPoint] = useState("50% 20%");
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(3);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/hero-banners");
    const data = await res.json();
    if (res.ok) setBanners(data.banners || []);
    else toast({ title: data.error || "Không tải được banner", tone: "danger" });
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadFile(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload thất bại");
      setDraftUrl(data.url);
      toast({ title: "Đã upload ảnh", tone: "success" });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Upload lỗi",
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  async function createBanner() {
    if (!draftUrl) {
      toast({ title: "Cần upload ảnh trước", tone: "danger" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/hero-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: draftUrl,
          title,
          subtitle,
          ctaLabel,
          ctaHref,
          focalPoint,
          gridCols,
          gridRows,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo banner thất bại");
      toast({ title: "Đã tạo banner", tone: "success" });
      setDraftUrl("");
      await load();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Lỗi",
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  async function patchBanner(id: string, patch: Partial<HeroBanner>) {
    const res = await fetch("/api/admin/hero-banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Cập nhật thất bại", tone: "danger" });
      return;
    }
    await load();
  }

  async function removeBanner(id: string) {
    const res = await fetch(`/api/admin/hero-banners?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      toast({ title: data.error || "Xóa thất bại", tone: "danger" });
      return;
    }
    toast({ title: "Đã xóa banner", tone: "success" });
    await load();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Banner trang chủ"
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Banner trang chủ" },
        ]}
      />

      <AdminCard>
        <h2 className="mb-4 font-semibold">Thêm banner mới</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Upload ảnh lớn</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                data-testid="admin-banner-upload"
                disabled={busy}
                className="block w-full rounded-[var(--admin-radius-md)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] px-4 py-6 text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput label="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
              <AdminInput
                label="Phụ đề / nhấn cam"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
              <AdminInput
                label="CTA label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
              />
              <AdminInput
                label="CTA href"
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
              />
              <AdminInput
                label="Focal point (CSS)"
                value={focalPoint}
                onChange={(e) => setFocalPoint(e.target.value)}
              />
              <AdminInput
                label="Lưới cột"
                type="number"
                value={String(gridCols)}
                onChange={(e) => setGridCols(Number(e.target.value) || 2)}
              />
              <AdminInput
                label="Lưới hàng"
                type="number"
                value={String(gridRows)}
                onChange={(e) => setGridRows(Number(e.target.value) || 3)}
              />
            </div>
            <AdminButton
              type="button"
              disabled={busy || !draftUrl}
              data-testid="admin-banner-create"
              onClick={() => void createBanner()}
            >
              Lưu banner
            </AdminButton>
          </div>
          {draftUrl ? (
            <PreviewGrid
              imageUrl={draftUrl}
              cols={gridCols}
              rows={gridRows}
              focalPoint={focalPoint}
            />
          ) : (
            <div className="flex aspect-[3/4] max-w-xs items-center justify-center rounded-[var(--admin-radius-md)] bg-[var(--admin-surface-muted)] text-sm text-[var(--admin-text-muted)]">
              Preview lưới
            </div>
          )}
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="mb-4 font-semibold">Danh sách banner</h2>
        {loading ? (
          <AdminTableSkeleton rows={3} />
        ) : banners.length === 0 ? (
          <AdminEmptyState title="Chưa có banner" description="Upload ảnh để tạo hero collage." />
        ) : (
          <ul className="space-y-4" data-testid="admin-banner-list">
            {banners.map((b) => (
              <li
                key={b.id}
                className="grid gap-4 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-4 lg:grid-cols-[200px_1fr]"
              >
                <PreviewGrid
                  imageUrl={b.imageUrl}
                  cols={b.gridCols}
                  rows={b.gridRows}
                  focalPoint={b.focalPoint}
                />
                <div className="space-y-2">
                  <p className="font-semibold">{b.title || "(không tiêu đề)"}</p>
                  <p className="text-sm text-[var(--admin-text-muted)]">
                    {b.subtitle} · lưới {b.gridCols}×{b.gridRows} · sort {b.sortOrder}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        void patchBanner(b.id, { isActive: !b.isActive })
                      }
                    >
                      {b.isActive ? "Tắt" : "Bật"}
                    </AdminButton>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        void patchBanner(b.id, { sortOrder: b.sortOrder - 1 })
                      }
                    >
                      Lên
                    </AdminButton>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        void patchBanner(b.id, { sortOrder: b.sortOrder + 1 })
                      }
                    >
                      Xuống
                    </AdminButton>
                    <AdminButton
                      type="button"
                      variant="danger"
                      onClick={() => void removeBanner(b.id)}
                    >
                      Xóa
                    </AdminButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
