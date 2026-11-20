"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Star, Trash2, Upload } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  AdminTableSkeleton,
  AdminTextarea,
  useAdminToast,
} from "@/components/admin/ui";
import { HEX_RE } from "@/lib/product-media";
import {
  autoSlugOnNameChange,
  autoSlugOnSlugBlur,
  autoSlugOnSlugChange,
  slugFromDisplayName,
} from "@/lib/auto-slug-field";
import { slugify, uniqueSlugSync } from "@/lib/slug";
import { cn } from "@/lib/utils";
import {
  AUTO_UNKNOWN_HEX,
  autoHexForName,
  buildSavePayload,
  colorNameStatus,
  colorsFromApi,
  splitColorEntry,
  makeMain,
  mediaFromApi,
  movePhoto,
  newKey,
  renameColorInMedia,
  SIZE_ORDER,
  type ApiProduct,
  type EditorColor,
  type EditorMedia,
} from "./editor-state";
import { PdpTabFields } from "./pdp-tab-fields";
import {
  DEFAULT_SHIPPING_BULLETS,
  defaultDetailBullets,
  defaultMaterialBullets,
  draftFromProduct,
  tabPayload,
  type PdpTabDraft,
} from "@/lib/pdp-tabs";

import { CategoryField, type AdminCategory } from "./category-field";

type Info = {
  name: string;
  slug: string;
  description: string;
  material: string;
  fit: string;
  gender: "MALE" | "FEMALE" | "UNISEX";
  categoryId: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
};

type LoadedProduct = ApiProduct & Partial<Omit<Info, "description" | "material" | "fit" | "categoryId">> & {
  description?: string | null;
  material?: string | null;
  fit?: string | null;
  origin?: string | null;
  thickness?: string | null;
  categoryId?: string | null;
  detailBulletsJson?: string | null;
  materialBulletsJson?: string | null;
  sizeChartJson?: string | null;
  shippingOverrideJson?: string | null;
};

const EMPTY_INFO: Info = {
  name: "",
  slug: "",
  description: "",
  material: "",
  fit: "",
  gender: "UNISEX",
  categoryId: "",
  isFeatured: false,
  isNew: true,
  isBestSeller: false,
};

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const VIDEO_ACCEPT = "video/mp4,video/webm";

async function uploadFile(file: File) {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload thất bại: ${file.name}`);
  return data as { url: string; kind: string };
}

function defaultColor(price = 0): EditorColor {
  return {
    key: newKey("c"),
    name: "",
    hex: AUTO_UNKNOWN_HEX,
    hexManual: false,
    sizes: ["S", "M", "L"].map((size) => ({ key: newKey("s"), size, price, compareAt: null, stock: 0 })),
  };
}

export function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const { toast } = useAdminToast();
  const isNew = !productId;
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [info, setInfo] = useState<Info>(EMPTY_INFO);
  const [slugTouched, setSlugTouched] = useState(false);
  const [media, setMedia] = useState<EditorMedia[]>([]);
  const [colors, setColors] = useState<EditorColor[]>(isNew ? [defaultColor()] : []);
  const [savedSlug, setSavedSlug] = useState("");
  const [tabs, setTabs] = useState<PdpTabDraft>(() => draftFromProduct({}, [...DEFAULT_SHIPPING_BULLETS]));
  const [siteShipping, setSiteShipping] = useState<string[]>([...DEFAULT_SHIPPING_BULLETS]);
  const siteShippingRef = useRef(siteShipping);
  // other products' slugs → live "already used" hint (server makes the final slug unique too)
  const [otherSlugs, setOtherSlugs] = useState<Set<string>>(new Set());

  function applyProduct(p: LoadedProduct, site = siteShippingRef.current) {
    setInfo({
      name: p.name || "",
      slug: p.slug || "",
      description: p.description || "",
      material: p.material || "",
      fit: p.fit || "",
      gender: (p.gender as Info["gender"]) || "UNISEX",
      categoryId: p.categoryId || "",
      isFeatured: Boolean(p.isFeatured),
      isNew: Boolean(p.isNew),
      isBestSeller: Boolean(p.isBestSeller),
    });
    setSavedSlug(p.slug || "");
    // saved products keep their slug: editing the name never rewrites it (clear the field to re-generate)
    setSlugTouched(Boolean(p.slug));
    setMedia(mediaFromApi(p));
    setColors(colorsFromApi(p));
    setTabs(draftFromProduct(p, site));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cRes, shipRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/shipping-policy"),
      ]);
      const cData = await cRes.json().catch(() => ({}));
      if (!cancelled && cRes.ok) setCategories(cData.categories || []);
      let site = [...DEFAULT_SHIPPING_BULLETS];
      if (shipRes.ok) {
        const ship = await shipRes.json().catch(() => ({}));
        if (Array.isArray(ship.effective) && ship.effective.length && ship.effective.every((x: unknown) => typeof x === "string")) {
          site = ship.effective as string[];
        }
      }
      if (cancelled) return;
      siteShippingRef.current = site;
      setSiteShipping(site);
      if (!productId) setTabs((t) => (t.shippingTouched ? t : { ...t, shippingBullets: [...site] }));
      void fetch("/api/admin/products?fields=slug")
        .then((r) => (r.ok ? r.json() : { slugs: [] }))
        .then((d: { slugs?: { id: string; slug: string }[] }) => {
          if (!cancelled) setOtherSlugs(new Set((d.slugs || []).filter((x) => x.id !== productId).map((x) => x.slug)));
        })
        .catch(() => {});
      if (!productId) return;
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`);
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok || !data.product) {
        setNotFound(true);
        setError(data.error || "Không tìm thấy sản phẩm");
      } else {
        applyProduct(data.product, site);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const photos = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");
  const colorNames = useMemo(
    () => colors.map((c) => c.name.trim()).filter(Boolean),
    [colors],
  );

  async function addFiles(files: FileList | File[] | null, kind: "image" | "video", color = "") {
    const list = files ? [...files] : [];
    if (!list.length) return;
    setError("");
    const added: EditorMedia[] = [];
    try {
      for (const [i, file] of list.entries()) {
        setUploading(`Đang tải ${kind === "video" ? "video" : "ảnh"} ${i + 1}/${list.length}…`);
        const up = await uploadFile(file);
        const isVideo = up.kind === "video" || kind === "video";
        added.push({
          key: newKey("m"),
          url: up.url,
          alt: info.name || "",
          color,
          type: isVideo ? "video" : "image",
          posterUrl: "",
          isHidden: false,
        });
      }
      toast(`Đã tải lên ${added.length} file — nhớ bấm Lưu sản phẩm`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload thất bại";
      setError(msg);
      toast(msg, "error");
    } finally {
      if (added.length) setMedia((prev) => [...prev, ...added]);
      setUploading("");
    }
  }

  function patchMedia(key: string, patch: Partial<EditorMedia>) {
    setMedia((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  function removeMedia(key: string) {
    setMedia((prev) => prev.filter((m) => m.key !== key));
  }

  function patchColor(key: string, patch: Partial<EditorColor>) {
    const old = colors.find((c) => c.key === key);
    if (old && patch.name !== undefined && patch.name !== old.name) {
      const from = old.name;
      const to = patch.name;
      setMedia((m) => renameColorInMedia(m, from, to));
    }
    setColors((prev) =>
      prev.map((c) => {
        if (c.key !== key) return c;
        const next = { ...c, ...patch };
        // auto-fill hex from the typed name unless the admin picked one
        if (patch.name !== undefined && !next.hexManual) {
          next.hex = autoHexForName(patch.name) ?? AUTO_UNKNOWN_HEX;
        }
        if (patch.name !== undefined && patch.name !== c.name) next.keepCombined = false;
        return next;
      }),
    );
  }

  function splitColor(key: string) {
    const c = colors.find((x) => x.key === key);
    if (!c) return;
    const parts = splitColorEntry(c);
    if (parts.length < 2) return;
    setColors((prev) => prev.flatMap((x) => (x.key === key ? parts : [x])));
    // media tagged with the combined name become shared (visible for every colour)
    setMedia((m) => m.map((x) => (x.color === c.name ? { ...x, color: "" } : x)));
    toast(`Đã tách thành ${parts.length} màu riêng — tồn kho được chia đều, hãy kiểm tra lại`);
  }

  function patchSize(colorKey: string, sizeKey: string, patch: Partial<EditorColor["sizes"][number]>) {
    setColors((prev) =>
      prev.map((c) =>
        c.key === colorKey
          ? { ...c, sizes: c.sizes.map((s) => (s.key === sizeKey ? { ...s, ...patch } : s)) }
          : c,
      ),
    );
  }

  function addSize(colorKey: string) {
    setColors((prev) =>
      prev.map((c) => {
        if (c.key !== colorKey) return c;
        const used = new Set(c.sizes.map((s) => s.size.toUpperCase()));
        const nextSize = SIZE_ORDER.find((s) => !used.has(s)) || "";
        const price = c.sizes[0]?.price ?? colors[0]?.sizes[0]?.price ?? 0;
        return { ...c, sizes: [...c.sizes, { key: newKey("s"), size: nextSize, price, compareAt: null, stock: 0 }] };
      }),
    );
  }

  function removeColor(key: string) {
    const c = colors.find((x) => x.key === key);
    setColors((prev) => prev.filter((x) => x.key !== key));
    if (c?.name) setMedia((prev) => prev.map((m) => (m.color === c.name ? { ...m, color: "" } : m)));
  }

  async function onSave() {
    setError("");
    setIssues([]);
    const local: string[] = [];
    if (!info.name.trim()) local.push("Thiếu tên sản phẩm");
    if (!photos.some((m) => !m.isHidden)) local.push("Cần ít nhất 1 ảnh sản phẩm hiển thị");
    if (!colors.length) local.push("Cần ít nhất 1 màu");
    colors.forEach((c, i) => {
      if (!c.name.trim()) local.push(`Màu #${i + 1} chưa có tên`);
      if (!HEX_RE.test(c.hex)) local.push(`Màu ${c.name || i + 1}: mã màu phải dạng #RRGGBB`);
      const st = colorNameStatus(c.name);
      if (st.parts.length > 1 && !c.keepCombined) {
        local.push(`"${c.name}" có ${st.parts.length} màu — bấm "Tách thành ${st.parts.length} màu" hoặc "Giữ là 1 màu phối"`);
      } else if (c.name.trim() && st.unknown.length && !c.hexManual) {
        local.push(`Không nhận ra màu "${c.name}" — hãy chọn mã màu bằng bảng màu`);
      }
      if (!c.sizes.length) local.push(`Màu ${c.name || i + 1} chưa có size`);
      c.sizes.forEach((s) => {
        if (!s.size.trim()) local.push(`Màu ${c.name}: có size trống`);
        if (!(s.price > 0)) local.push(`Màu ${c.name} / ${s.size}: giá phải > 0`);
      });
    });
    if (new Set(colorNames.map((n) => n.toLowerCase())).size !== colorNames.length) {
      local.push("Tên màu bị trùng");
    }
    if (local.length) {
      setIssues(local);
      toast(local[0], "error");
      return;
    }
    setSaving(true);
    // unchanged stored slug is sent as-is; anything else is normalised (server also dedupes)
    const sentSlug = !isNew && info.slug === savedSlug ? savedSlug : slugify(info.slug || info.name);
    const payload = buildSavePayload(
      {
        id: productId,
        name: info.name.trim(),
        slug: sentSlug,
        description: info.description,
        material: info.material || null,
        fit: info.fit || null,
        gender: info.gender,
        categoryId: info.categoryId || null,
        isFeatured: info.isFeatured,
        isNew: info.isNew,
        isBestSeller: info.isBestSeller,
        ...tabPayload(tabs),
      },
      media,
      colors,
    );
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      const list = Array.isArray(data.issues)
        ? data.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`)
        : [];
      setIssues(list);
      setError(data.error || "Lưu thất bại");
      toast(data.error || "Lưu thất bại", "error");
      return;
    }
    const kept = (data.keptVariantIds || []).length;
    const finalSlug: string = data.product?.slug || "";
    const slugNote = finalSlug && finalSlug !== sentSlug ? ` · Slug đã có, dùng: ${finalSlug}` : "";
    toast((kept ? `Đã lưu. ${kept} biến thể đã có đơn được giữ lại (tồn 0).` : "Đã lưu sản phẩm") + slugNote);
    if (isNew) {
      router.replace(`/admin/products/${data.product.id}`);
      return;
    }
    applyProduct(data.product);
  }

  const slugPreview = !isNew && info.slug === savedSlug ? savedSlug : slugify(info.slug || info.name, { fallback: "" });
  const slugConflict =
    slugPreview && otherSlugs.has(slugPreview) ? uniqueSlugSync(slugPreview, otherSlugs) : "";

  const crumbs = [
    { href: "/admin", label: "Admin" },
    { href: "/admin/products", label: "Sản phẩm" },
    { label: isNew ? "Thêm mới" : info.name || "Sửa" },
  ];
  const title = isNew ? "Thêm sản phẩm" : "Sửa sản phẩm";

  if (loading) {
    return (
      <div>
        <AdminPageHeader title={title} breadcrumbs={crumbs} />
        <AdminTableSkeleton rows={4} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div>
        <AdminPageHeader title={title} breadcrumbs={crumbs} />
        <AdminEmptyState
          title="Không tìm thấy sản phẩm"
          description={error || "Sản phẩm có thể đã bị xóa."}
          action={
            <AdminButton variant="secondary" onClick={() => router.push("/admin/products")}>
              Về danh sách
            </AdminButton>
          }
        />
      </div>
    );
  }

  const colorSelect = (value: string, onChange: (v: string) => void, testId: string, label: string) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-[var(--admin-border)] bg-white px-2 py-1 text-xs"
      data-testid={testId}
      aria-label={label}
    >
      <option value="">Mọi màu</option>
      {colorNames.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
      {value && !colorNames.includes(value) ? <option value={value}>{value} (không còn)</option> : null}
    </select>
  );

  return (
    <div data-testid="product-editor">
      <AdminPageHeader
        title={title}
        description={isNew ? "Ảnh, video, màu sắc, size và tồn kho được lưu cùng lúc" : savedSlug}
        breadcrumbs={crumbs}
        actions={
          <AdminButton variant="secondary" onClick={() => router.push("/admin/products")}>
            Quay lại
          </AdminButton>
        }
      />

      {error || issues.length ? (
        <div
          className="mb-4 rounded-[var(--admin-radius-md)] border border-red-200 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]"
          role="alert"
          data-testid="pe-error"
        >
          {error ? <p className="font-medium">{error}</p> : null}
          {issues.length ? (
            <ul className="mt-1 list-disc pl-5">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        <AdminCard>
          <h2 className="mb-4 font-semibold">Thông tin cơ bản</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              name="name"
              required
              label="Tên sản phẩm"
              value={info.name}
              data-testid="pe-name"
              onChange={(e) => {
                const name = e.target.value;
                setInfo((p) => {
                  const next = autoSlugOnNameChange(
                    { name: p.name, slug: p.slug, slugManual: slugTouched },
                    name,
                  );
                  return { ...p, name: next.name, slug: next.slug };
                });
              }}
            />
            <AdminInput
              name="slug"
              label="Slug (URL)"
              value={info.slug}
              data-testid="pe-slug"
              hint={
                slugConflict
                  ? `Slug đã có — khi lưu sẽ dùng: ${slugConflict}`
                  : isNew
                    ? "Tự tạo từ tên, có thể sửa"
                    : "Đổi slug sẽ đổi link sản phẩm"
              }
              onChange={(e) => {
                setInfo((p) => {
                  const next = autoSlugOnSlugChange(
                    { name: p.name, slug: p.slug, slugManual: slugTouched },
                    e.target.value,
                  );
                  setSlugTouched(next.slugManual);
                  return { ...p, slug: next.slug };
                });
              }}
              onBlur={() => {
                setInfo((p) => {
                  if (!isNew && p.slug === savedSlug) return p;
                  const next = autoSlugOnSlugBlur(
                    { name: p.name, slug: p.slug, slugManual: slugTouched },
                  );
                  if (!next.slug && p.name.trim()) {
                    return { ...p, slug: slugFromDisplayName(p.name) };
                  }
                  return next.slug === p.slug ? p : { ...p, slug: next.slug };
                });
              }}
            />
            <CategoryField
              categoryId={info.categoryId}
              categories={categories}
              onCategoryIdChange={(categoryId) => setInfo((p) => ({ ...p, categoryId }))}
              onCategoriesUpdated={setCategories}
            />
            <AdminSelect
              name="gender"
              label="Giới tính"
              value={info.gender}
              onChange={(e) => setInfo((p) => ({ ...p, gender: e.target.value as Info["gender"] }))}
            >
              <option value="UNISEX">Unisex</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </AdminSelect>
            <AdminInput
              name="material"
              label="Chất liệu"
              value={info.material}
              onChange={(e) => {
                const material = e.target.value;
                setInfo((p) => ({ ...p, material }));
                setTabs((t) => (t.materialTouched ? t : { ...t, materialBullets: defaultMaterialBullets(material) }));
              }}
            />
            <AdminInput
              name="fit"
              label="Form"
              value={info.fit}
              onChange={(e) => {
                const fit = e.target.value;
                setInfo((p) => ({ ...p, fit }));
                setTabs((t) => (t.detailTouched ? t : { ...t, detailBullets: defaultDetailBullets(fit) }));
              }}
            />
            <div className="flex flex-wrap items-end gap-4 pb-2 text-sm sm:col-span-2">
              {(
                [
                  ["isNew", "Mới"],
                  ["isBestSeller", "Bán chạy"],
                  ["isFeatured", "Nổi bật"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={info[k]}
                    onChange={(e) => setInfo((p) => ({ ...p, [k]: e.target.checked }))}
                    className="rounded border-[var(--admin-border)]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="sm:col-span-2">
              <AdminTextarea
                name="description"
                label="Mô tả"
                value={info.description}
                onChange={(e) => setInfo((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-1 font-semibold">Nội dung tab trang sản phẩm</h2>
          <p className="mb-4 text-xs text-[var(--admin-text-muted)]">
            Sản phẩm chưa chỉnh vẫn hiện đúng nội dung hiện tại. Chỉ những phần bạn sửa mới được lưu riêng.
          </p>
          <PdpTabFields
            draft={tabs}
            fit={info.fit}
            material={info.material}
            siteShipping={siteShipping}
            onChange={setTabs}
          />
        </AdminCard>

        <AdminCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Ảnh sản phẩm</h2>
              <p className="text-xs text-[var(--admin-text-muted)]">
                Chọn nhiều ảnh cùng lúc · ảnh đầu tiên là ảnh chính · gán màu để ảnh đổi theo màu trên trang sản phẩm
              </p>
            </div>
            <AdminBadge>{photos.length} ảnh</AdminBadge>
          </div>
          <label
            className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--admin-radius-md)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] px-4 py-6 text-sm"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void addFiles(e.dataTransfer.files, "image");
            }}
          >
            <Upload className="h-5 w-5" />
            <span className="font-medium">Chọn hoặc kéo-thả nhiều ảnh (JPG, PNG, WebP, GIF · tối đa 5MB/ảnh)</span>
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              multiple
              className="sr-only"
              data-testid="pe-image-files"
              disabled={Boolean(uploading)}
              onChange={(e) => {
                void addFiles(e.target.files, "image");
                e.target.value = "";
              }}
            />
          </label>
          {uploading ? (
            <p className="mb-3 text-sm text-[var(--admin-text-muted)]" data-testid="pe-uploading">
              {uploading}
            </p>
          ) : null}
          {photos.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-muted)]">Chưa có ảnh.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="pe-image-list">
              {photos.map((m, i) => (
                <li
                  key={m.key}
                  className={cn(
                    "overflow-hidden rounded-[var(--admin-radius-md)] bg-white ring-1 ring-[var(--admin-border)]",
                    i === 0 && "ring-2 ring-[var(--admin-accent)]",
                    m.isHidden && "opacity-60",
                  )}
                  data-testid="pe-image"
                  data-url={m.url}
                  data-main={i === 0 ? "true" : "false"}
                >
                  <div className="relative aspect-square bg-[var(--admin-surface-muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.alt || info.name} className="h-full w-full object-cover" />
                    {i === 0 ? (
                      <span className="absolute top-1 left-1 rounded bg-[var(--admin-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Ảnh chính
                      </span>
                    ) : null}
                    {m.isHidden ? (
                      <span className="absolute top-1 right-1 rounded bg-neutral-900/80 px-1.5 py-0.5 text-[10px] text-white">
                        Đang ẩn
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1.5 p-2">
                    {colorSelect(m.color, (v) => patchMedia(m.key, { color: v }), "pe-image-color", `Màu của ảnh ${i + 1}`)}
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-[var(--admin-surface-muted)] disabled:opacity-30"
                        disabled={i === 0}
                        onClick={() => setMedia((prev) => movePhoto(prev, m.key, -1))}
                        aria-label={`Đưa ảnh ${i + 1} lên trước`}
                        data-testid="pe-image-left"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-[var(--admin-surface-muted)] disabled:opacity-30"
                        disabled={i === 0}
                        onClick={() => setMedia((prev) => makeMain(prev, m.key))}
                        aria-label={`Đặt ảnh ${i + 1} làm ảnh chính`}
                        title="Đặt làm ảnh chính"
                        data-testid="pe-image-main"
                      >
                        <Star className={cn("h-4 w-4", i === 0 && "fill-current text-[var(--admin-accent)]")} />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-[var(--admin-surface-muted)] disabled:opacity-30"
                        disabled={i === photos.length - 1}
                        onClick={() => setMedia((prev) => movePhoto(prev, m.key, 1))}
                        aria-label={`Đưa ảnh ${i + 1} ra sau`}
                        data-testid="pe-image-right"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]"
                        onClick={() => removeMedia(m.key)}
                        aria-label={`Xóa ảnh ${i + 1}`}
                        data-testid="pe-image-delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-muted)]">
                      <input
                        type="checkbox"
                        checked={m.isHidden}
                        onChange={(e) => patchMedia(m.key, { isHidden: e.target.checked })}
                        data-testid="pe-image-hidden"
                      />
                      Ẩn trên trang khách
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Video sản phẩm</h2>
              <p className="text-xs text-[var(--admin-text-muted)]">
                MP4/WebM tối đa 100MB · video hiện đầu gallery trang sản phẩm, ảnh vẫn giữ nguyên
              </p>
            </div>
            <AdminBadge>{videos.length} video</AdminBadge>
          </div>
          <label className="mb-4 flex cursor-pointer items-center gap-2 rounded-[var(--admin-radius-md)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] px-4 py-4 text-sm">
            <Upload className="h-4 w-4" />
            <span className="font-medium">Chọn video</span>
            <input
              type="file"
              accept={VIDEO_ACCEPT}
              className="sr-only"
              data-testid="pe-video-file"
              disabled={Boolean(uploading)}
              onChange={(e) => {
                void addFiles(e.target.files, "video");
                e.target.value = "";
              }}
            />
          </label>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((m, i) => (
              <li
                key={m.key}
                className="space-y-2 rounded-[var(--admin-radius-md)] p-2 ring-1 ring-[var(--admin-border)]"
                data-testid="pe-video"
                data-url={m.url}
              >
                <video
                  src={m.url}
                  poster={m.posterUrl || undefined}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full rounded bg-black object-contain"
                />
                {colorSelect(m.color, (v) => patchMedia(m.key, { color: v }), "pe-video-color", `Màu của video ${i + 1}`)}
                <input
                  value={m.posterUrl}
                  onChange={(e) => patchMedia(m.key, { posterUrl: e.target.value })}
                  placeholder="Poster URL (tuỳ chọn)"
                  className="w-full rounded border border-[var(--admin-border)] px-2 py-1 text-xs"
                  aria-label={`Poster video ${i + 1}`}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-muted)]">
                    <input
                      type="checkbox"
                      checked={m.isHidden}
                      onChange={(e) => patchMedia(m.key, { isHidden: e.target.checked })}
                    />
                    Ẩn
                  </label>
                  <button
                    type="button"
                    className="text-xs text-[var(--admin-danger)]"
                    onClick={() => removeMedia(m.key)}
                    data-testid="pe-video-delete"
                  >
                    Xóa video
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {videos.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-muted)]">Chưa có video.</p>
          ) : null}
        </AdminCard>

        <AdminCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Màu sắc, size & tồn kho</h2>
              <p className="text-xs text-[var(--admin-text-muted)]">
                Mỗi màu thêm riêng (không gộp &quot;Đen/nâu&quot;) với mã màu, ảnh, size, giá và tồn riêng
              </p>
            </div>
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              data-testid="pe-add-color"
              onClick={() => setColors((prev) => [...prev, defaultColor(prev[0]?.sizes[0]?.price ?? 0)])}
            >
              <Plus className="h-4 w-4" />
              Thêm màu
            </AdminButton>
          </div>
          <div className="space-y-4">
            {colors.map((c, ci) => {
              const ownPhotos = photos.filter((m) => c.name && m.color === c.name);
              return (
                <div
                  key={c.key}
                  className="rounded-[var(--admin-radius-md)] p-3 ring-1 ring-[var(--admin-border)]"
                  data-testid="pe-color"
                  data-color={c.name}
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <span
                      className="mb-1 h-8 w-8 shrink-0 rounded-full ring-1 ring-black/15"
                      style={{ backgroundColor: HEX_RE.test(c.hex) ? c.hex : "#ddd" }}
                      aria-hidden="true"
                    />
                    <label className="block min-w-40 flex-1 space-y-1 text-sm">
                      <span className="font-medium">Tên màu #{ci + 1}</span>
                      <input
                        value={c.name}
                        onChange={(e) => patchColor(c.key, { name: e.target.value })}
                        placeholder="VD: Nâu, Xanh rêu, #A0522D"
                        className="w-full rounded border border-[var(--admin-border)] px-2 py-1.5"
                        data-testid="pe-color-name"
                      />
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium">Mã màu</span>
                      <span className="flex items-center gap-2">
                        <input
                          type="color"
                          value={HEX_RE.test(c.hex) ? c.hex.toLowerCase() : "#111111"}
                          onChange={(e) => patchColor(c.key, { hex: e.target.value.toUpperCase(), hexManual: true })}
                          className="h-9 w-12 cursor-pointer rounded border border-[var(--admin-border)]"
                          aria-label={`Chọn mã màu ${c.name}`}
                        />
                        <input
                          value={c.hex}
                          onChange={(e) => patchColor(c.key, { hex: e.target.value.trim(), hexManual: true })}
                          className="w-24 rounded border border-[var(--admin-border)] px-2 py-1.5 font-mono text-xs uppercase"
                          data-testid="pe-color-hex"
                          aria-label={`Mã hex ${c.name}`}
                        />
                      </span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--admin-border)] px-2 py-1.5 text-xs">
                      <Upload className="h-3.5 w-3.5" />
                      Thêm ảnh cho màu này
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        multiple
                        className="sr-only"
                        disabled={!c.name.trim() || Boolean(uploading)}
                        data-testid="pe-color-files"
                        onChange={(e) => {
                          void addFiles(e.target.files, "image", c.name.trim());
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="mb-1 text-xs text-[var(--admin-danger)]"
                      onClick={() => removeColor(c.key)}
                      data-testid="pe-color-delete"
                    >
                      Xóa màu
                    </button>
                  </div>
                  {(() => {
                    const st = colorNameStatus(c.name);
                    if (st.parts.length > 1 && !c.keepCombined) {
                      return (
                        <div
                          className="mt-2 flex flex-wrap items-center gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                          data-testid="pe-color-split-banner"
                        >
                          <span>
                            Tên này có {st.parts.length} màu:{" "}
                            {st.parts.map((p) => (
                              <span key={p} className="mr-1 inline-flex items-center gap-1">
                                <span
                                  className="inline-block h-3 w-3 rounded-full ring-1 ring-black/15"
                                  style={{ background: autoHexForName(p) ?? "#ddd" }}
                                />
                                {p}
                              </span>
                            ))}
                          </span>
                          <button
                            type="button"
                            className="rounded bg-[var(--admin-accent)] px-2 py-1 font-medium text-white"
                            onClick={() => splitColor(c.key)}
                            data-testid="pe-color-split"
                          >
                            Tách thành {st.parts.length} màu riêng
                          </button>
                          <button
                            type="button"
                            className="rounded border border-amber-400 px-2 py-1"
                            onClick={() => patchColor(c.key, { keepCombined: true })}
                            data-testid="pe-color-keep"
                          >
                            Giữ là 1 màu phối
                          </button>
                        </div>
                      );
                    }
                    if (c.name.trim() && st.unknown.length && !c.hexManual) {
                      return (
                        <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900" data-testid="pe-color-unknown">
                          Không nhận ra màu &quot;{st.unknown.join(", ")}&quot; — hãy chọn mã màu bằng bảng màu bên cạnh (đang tạm hiện xám, không phải đen).
                        </p>
                      );
                    }
                    return null;
                  })()}
                  <p className="mt-2 text-xs text-[var(--admin-text-muted)]" data-testid="pe-color-image-count">
                    {ownPhotos.length} ảnh riêng của màu này
                  </p>
                  <div className="mt-2 overflow-x-auto" data-testid="pe-size-table-scroll">
                  <table className="w-full min-w-[440px] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[var(--admin-text-muted)]">
                        <th className="py-1 pr-2 font-medium">Size</th>
                        <th className="py-1 pr-2 font-medium">Giá (đ)</th>
                        <th className="py-1 pr-2 font-medium">Giá gốc</th>
                        <th className="py-1 pr-2 font-medium">Tồn kho</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {c.sizes.map((s) => (
                        <tr key={s.key} data-testid="pe-size-row" data-size={s.size}>
                          <td className="py-1 pr-2">
                            <input
                              value={s.size}
                              onChange={(e) => patchSize(c.key, s.key, { size: e.target.value.toUpperCase() })}
                              className="w-16 rounded border border-[var(--admin-border)] px-2 py-1"
                              data-testid="pe-size"
                              aria-label={`Size ${c.name}`}
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={s.price || ""}
                              onChange={(e) => patchSize(c.key, s.key, { price: Number(e.target.value) })}
                              className="w-28 rounded border border-[var(--admin-border)] px-2 py-1"
                              data-testid="pe-price"
                              aria-label={`Giá ${c.name} ${s.size}`}
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={s.compareAt ?? ""}
                              onChange={(e) =>
                                patchSize(c.key, s.key, { compareAt: e.target.value ? Number(e.target.value) : null })
                              }
                              className="w-28 rounded border border-[var(--admin-border)] px-2 py-1"
                              aria-label={`Giá gốc ${c.name} ${s.size}`}
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={s.stock}
                              onChange={(e) => patchSize(c.key, s.key, { stock: Number(e.target.value) })}
                              className="w-20 rounded border border-[var(--admin-border)] px-2 py-1"
                              data-testid="pe-stock"
                              aria-label={`Tồn ${c.name} ${s.size}`}
                            />
                          </td>
                          <td className="py-1 text-right">
                            <button
                              type="button"
                              className="text-xs text-[var(--admin-danger)]"
                              onClick={() =>
                                setColors((prev) =>
                                  prev.map((x) =>
                                    x.key === c.key ? { ...x, sizes: x.sizes.filter((y) => y.key !== s.key) } : x,
                                  ),
                                )
                              }
                              aria-label={`Xóa size ${s.size} màu ${c.name}`}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium text-[var(--admin-accent)]"
                    onClick={() => addSize(c.key)}
                    data-testid="pe-add-size"
                  >
                    + Thêm size
                  </button>
                </div>
              );
            })}
            {colors.length === 0 ? (
              <p className="text-sm text-[var(--admin-text-muted)]">Chưa có màu nào.</p>
            ) : null}
          </div>
        </AdminCard>

        <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-bg,white)]/95 py-3 backdrop-blur">
          <AdminButton
            type="button"
            variant="accent"
            disabled={saving || Boolean(uploading)}
            onClick={() => void onSave()}
            data-testid="pe-save"
          >
            {saving ? "Đang lưu…" : isNew ? "Tạo sản phẩm" : "Lưu sản phẩm"}
          </AdminButton>
          {!isNew && savedSlug ? (
            <Link
              href={`/san-pham/${savedSlug}`}
              target="_blank"
              className="inline-flex h-10 items-center rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] px-4 text-sm font-medium hover:bg-[var(--admin-surface-muted)]"
            >
              Xem trên storefront
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
