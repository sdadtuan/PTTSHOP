"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Film } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTh,
  AdminTr,
  paginate,
  useAdminToast,
} from "@/components/admin/ui";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  color: string | null;
  type: string;
  posterUrl: string | null;
  sortOrder: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  category?: { name: string } | null;
  variants: {
    id: string;
    sku: string;
    stock: number;
    price: number;
    color: string;
    size: string;
  }[];
  images: ProductImage[];
};

type Category = { id: string; name: string };


export default function AdminProductsPage() {
  const { toast } = useAdminToast();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [manageId, setManageId] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/categories"),
    ]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    if (!pRes.ok) setError(pData.error || "Không tải được sản phẩm");
    else {
      setError("");
      setProducts(pData.products || []);
    }
    if (cRes.ok) setCategories(cData.categories || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q");
    if (initial) setQ(initial);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        (p.category?.name || "").toLowerCase().includes(query),
    );
  }, [products, q]);

  const paged = paginate(filtered, page, 8);

  async function uploadFile(file: File) {
    const upload = new FormData();
    upload.set("file", file);
    const upRes = await fetch("/api/upload", { method: "POST", body: upload });
    const upData = await upRes.json();
    if (!upRes.ok) throw new Error(upData.error || "Upload thất bại");
    return upData as { url: string; kind: string };
  }

  async function handleVideoFiles(
    files: FileList | File[],
    opts?: { productId?: string; color?: string; posterUrl?: string },
  ) {
    setError("");
    setVideoBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("video/")) {
          setError("Chỉ nhận video MP4/WebM");
          continue;
        }
        const up = await uploadFile(file);
        if (opts?.productId) {
          const res = await fetch("/api/admin/product-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: opts.productId,
              url: up.url,
              type: "video",
              color: opts.color || null,
              posterUrl: opts.posterUrl || null,
              alt: "Video sản phẩm",
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Gắn video thất bại");
        }
      }
      if (opts?.productId) {
        toast("Đã gắn video");
        await load();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload video thất bại";
      setError(msg);
      toast(msg, "error");
    } finally {
      setVideoBusy(false);
    }
  }

  async function updateStock(id: string, stock: number) {
    await fetch("/api/admin/variants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stock }),
    });
    await load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });
    setDeleting(false);
    setDeleteId(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xóa thất bại");
      toast(data.error || "Xóa thất bại", "error");
      return;
    }
    toast("Đã xóa sản phẩm");
    await load();
  }

  async function removeImage(id: string) {
    if (!confirm("Xóa media này khỏi sản phẩm?")) return;
    const res = await fetch("/api/admin/product-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xóa thất bại");
      toast(data.error || "Xóa thất bại", "error");
      return;
    }
    toast("Đã xóa media");
    await load();
  }

  async function patchImage(
    id: string,
    data: Partial<Pick<ProductImage, "color" | "posterUrl" | "sortOrder">>,
  ) {
    await fetch("/api/admin/product-images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    await load();
  }

  const managed = products.find((p) => p.id === manageId) || null;

  return (
    <div>
      <AdminPageHeader
        title="Sản phẩm"
        description="Quản lý hàng, biến thể, ảnh và video"
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Sản phẩm" },
        ]}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-[var(--admin-radius-md)] bg-[var(--admin-accent)] px-4 text-sm font-medium text-white hover:bg-[var(--admin-accent-hover)]"
            data-testid="admin-product-new"
          >
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </Link>
        }
      />

      <AdminCard className="mb-4">
        <AdminInput
          label="Tìm kiếm"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Tên, slug, danh mục…"
        />
      </AdminCard>

      {error ? (
        <p
          className="mb-4 rounded-[var(--admin-radius-md)] border border-red-200 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}


      {managed ? (
        <div className="mb-6" data-testid="admin-video-manager">
        <AdminCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Video / media — {managed.name}</h2>
            <AdminButton variant="ghost" size="sm" onClick={() => setManageId(null)}>
              Đóng
            </AdminButton>
          </div>
          <div
            className={cn(
              "rounded-[var(--admin-radius-md)] border border-dashed p-4",
              dragOver
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]"
                : "border-[var(--admin-border-strong)]",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) {
                void handleVideoFiles(e.dataTransfer.files, {
                  productId: managed.id,
                });
              }
            }}
          >
            <p className="text-sm">Kéo-thả hoặc chọn video MP4/WebM</p>
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="mt-2 block text-sm"
              data-testid="admin-manage-video-file"
              disabled={videoBusy}
              onChange={(e) => {
                if (e.target.files?.length) {
                  void handleVideoFiles(e.target.files, {
                    productId: managed.id,
                  });
                  e.target.value = "";
                }
              }}
            />
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {managed.images.map((img) => (
              <li
                key={img.id}
                className="rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3"
              >
                {img.type === "video" ? (
                  <video
                    src={img.url}
                    poster={img.posterUrl || undefined}
                    muted
                    playsInline
                    preload="metadata"
                    className="mb-2 aspect-video w-full rounded bg-[var(--admin-surface-muted)] object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="mb-2 aspect-video w-full rounded bg-[var(--admin-surface-muted)] object-cover"
                  />
                )}
                <p className="mb-2 text-sm font-medium">
                  {img.type === "video" ? "Video" : "Ảnh"} · sort {img.sortOrder}
                </p>
                <div className="space-y-2">
                  <AdminInput
                    label="Màu"
                    defaultValue={img.color || ""}
                    onBlur={(e) =>
                      void patchImage(img.id, {
                        color: e.target.value.trim() || null,
                      })
                    }
                  />
                  {img.type === "video" ? (
                    <AdminInput
                      label="Poster URL"
                      defaultValue={img.posterUrl || ""}
                      onBlur={(e) =>
                        void patchImage(img.id, {
                          posterUrl: e.target.value.trim() || null,
                        })
                      }
                    />
                  ) : null}
                  <AdminInput
                    label="Sort"
                    type="number"
                    defaultValue={img.sortOrder}
                    onBlur={(e) =>
                      void patchImage(img.id, {
                        sortOrder: Number(e.target.value),
                      })
                    }
                  />
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    className="text-[var(--admin-danger)]"
                    onClick={() => void removeImage(img.id)}
                  >
                    Xóa
                  </AdminButton>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
        </div>
      ) : null}

      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : paged.items.length === 0 ? (
        <AdminEmptyState
          title="Chưa có sản phẩm"
          description="Thêm sản phẩm mới để bắt đầu bán."
          action={
            <AdminButton variant="accent" onClick={() => router.push("/admin/products/new")}>
              Thêm sản phẩm
            </AdminButton>
          }
        />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Sản phẩm</AdminTh>
                <AdminTh>Danh mục</AdminTh>
                <AdminTh>Biến thể / tồn</AdminTh>
                <AdminTh>Thẻ</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {paged.items.map((p) => {
                const thumb = p.images.find((i) => i.type !== "video")?.url;
                return (
                  <AdminTr key={p.id}>
                    <AdminTd>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[var(--admin-radius-sm)] bg-[var(--admin-surface-muted)] ring-1 ring-[var(--admin-border)]">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="font-medium hover:text-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/30"
                          >
                            {p.name}
                          </Link>
                          <p className="truncate text-xs text-[var(--admin-text-muted)]">
                            {p.slug}
                          </p>
                        </div>
                      </div>
                    </AdminTd>
                    <AdminTd>{p.category?.name ?? "—"}</AdminTd>
                    <AdminTd>
                      <ul className="space-y-1">
                        {p.variants.slice(0, 4).map((v) => (
                          <li key={v.id} className="flex items-center gap-2 text-xs">
                            <span>
                              {v.color}/{v.size} · {formatVnd(v.price)}
                            </span>
                            <input
                              type="number"
                              defaultValue={v.stock}
                              aria-label={`Tồn ${v.color} ${v.size}`}
                              className="w-16 rounded border border-[var(--admin-border)] px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/25"
                              onBlur={(e) =>
                                void updateStock(v.id, Number(e.target.value))
                              }
                            />
                          </li>
                        ))}
                        {p.variants.length > 4 ? (
                          <li className="text-xs text-[var(--admin-text-subtle)]">
                            +{p.variants.length - 4} biến thể
                          </li>
                        ) : null}
                      </ul>
                    </AdminTd>
                    <AdminTd>
                      <div className="flex flex-wrap gap-1">
                        {p.isNew ? <AdminBadge tone="accent">Mới</AdminBadge> : null}
                        {p.isBestSeller ? (
                          <AdminBadge tone="success">Bán chạy</AdminBadge>
                        ) : null}
                        {p.isFeatured ? (
                          <AdminBadge tone="info">Nổi bật</AdminBadge>
                        ) : null}
                        {p.images.some((i) => i.type === "video") ? (
                          <AdminBadge tone="accent">Video</AdminBadge>
                        ) : null}
                      </div>
                    </AdminTd>
                    <AdminTd>
                      <div className="flex flex-col items-start gap-1">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/30"
                        >
                          <Pencil className="h-4 w-4" />
                          Sửa
                        </Link>
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 text-[var(--admin-accent)]"
                          data-testid={`manage-media-${p.slug}`}
                          onClick={() => setManageId(p.id)}
                        >
                          <Film className="h-3.5 w-3.5" />
                          Video / media
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          aria-label="Xóa"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-4 w-4 text-[var(--admin-danger)]" />
                        </AdminButton>
                      </div>
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </tbody>
          </AdminTable>
          <div className="mt-4">
            <AdminPagination
              page={paged.page}
              totalPages={paged.totalPages}
              total={paged.total}
              onChange={setPage}
            />
          </div>
        </>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xóa sản phẩm?"
        description="Hành động này không hoàn tác. Sản phẩm và biến thể liên quan sẽ bị xóa."
        loading={deleting}
      />
    </div>
  );
}
