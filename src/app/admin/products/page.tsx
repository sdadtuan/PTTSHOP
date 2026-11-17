"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { formatVnd } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  category?: { name: string } | null;
  variants: { id: string; sku: string; stock: number; price: number; color: string; size: string }[];
};

type Category = { id: string; name: string };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/categories"),
    ]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    if (!pRes.ok) setError(pData.error || "Lỗi");
    else setProducts(pData.products || []);
    if (cRes.ok) setCategories(cData.categories || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get("name") || "");
    const slug = String(form.get("slug") || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const price = Number(form.get("price") || 0);
    const stock = Number(form.get("stock") || 0);
    let imageUrl = String(form.get("imageUrl") || "").trim();
    const file = form.get("imageFile");
    if (file instanceof File && file.size > 0) {
      const upload = new FormData();
      upload.set("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: upload });
      const upData = await upRes.json();
      if (!upRes.ok) {
        setError(upData.error || "Upload thất bại");
        return;
      }
      imageUrl = upData.url as string;
    }
    if (!imageUrl) {
      setError("Cần URL ảnh hoặc upload file");
      return;
    }
    const payload = {
      name,
      slug,
      description: String(form.get("description") || ""),
      gender: String(form.get("gender") || "UNISEX"),
      categoryId: String(form.get("categoryId") || "") || null,
      isNew: true,
      images: [{ url: imageUrl, alt: name }],
      variants: [
        {
          sku: `${slug}-default`.toUpperCase(),
          color: String(form.get("color") || "Đen"),
          colorHex: "#111111",
          size: String(form.get("size") || "M"),
          price,
          stock,
        },
      ],
    };
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Tạo thất bại");
      return;
    }
    setShowForm(false);
    formEl.reset();
    await load();
  }

  async function updateStock(id: string, stock: number) {
    await fetch("/api/admin/variants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stock }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa sản phẩm?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Sản phẩm
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          {showForm ? "Đóng" : "Thêm sản phẩm"}
        </button>
      </div>
      <AdminNav current="/admin/products" />
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mt-6 grid gap-3 border border-neutral-100 bg-white p-4 sm:grid-cols-2"
        >
          <input name="name" required placeholder="Tên" className="rounded border px-3 py-2 text-sm" />
          <input name="slug" required placeholder="slug" className="rounded border px-3 py-2 text-sm" />
          <input name="imageUrl" type="url" placeholder="URL ảnh (hoặc upload bên dưới)" className="rounded border px-3 py-2 text-sm sm:col-span-2" />
          <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="text-sm sm:col-span-2" />
          <textarea name="description" placeholder="Mô tả" className="rounded border px-3 py-2 text-sm sm:col-span-2" />
          <select name="categoryId" className="rounded border px-3 py-2 text-sm">
            <option value="">— Danh mục —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="gender" className="rounded border px-3 py-2 text-sm" defaultValue="UNISEX">
            <option value="UNISEX">Unisex</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
          </select>
          <input name="color" placeholder="Màu" defaultValue="Đen" className="rounded border px-3 py-2 text-sm" />
          <input name="size" placeholder="Size" defaultValue="M" className="rounded border px-3 py-2 text-sm" />
          <input name="price" type="number" required placeholder="Giá" className="rounded border px-3 py-2 text-sm" />
          <input name="stock" type="number" required placeholder="Tồn" defaultValue={10} className="rounded border px-3 py-2 text-sm" />
          <button type="submit" className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
            Tạo
          </button>
        </form>
      ) : null}

      <div className="mt-6 overflow-x-auto border border-neutral-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Biến thể / tồn</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-neutral-50 align-top">
                <td className="px-4 py-3">
                  <Link href={`/san-pham/${p.slug}`} className="font-medium hover:text-[var(--accent)]">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <ul className="space-y-1">
                    {p.variants.slice(0, 6).map((v) => (
                      <li key={v.id} className="flex items-center gap-2 text-xs">
                        <span>
                          {v.color}/{v.size} · {formatVnd(v.price)}
                        </span>
                        <input
                          type="number"
                          defaultValue={v.stock}
                          className="w-16 rounded border px-1 py-0.5"
                          onBlur={(e) =>
                            void updateStock(v.id, Number(e.target.value))
                          }
                        />
                      </li>
                    ))}
                    {p.variants.length > 6 ? (
                      <li className="text-xs text-neutral-400">
                        +{p.variants.length - 6} biến thể
                      </li>
                    ) : null}
                  </ul>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void remove(p.id)}
                    className="text-xs text-red-600"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
