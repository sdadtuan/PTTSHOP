"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: { products: number };
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Lỗi");
    else setCategories(data.categories || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        slug: String(form.get("slug") || "")
          .toLowerCase()
          .replace(/\s+/g, "-"),
        sortOrder: Number(form.get("sortOrder") || 0),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Tạo thất bại");
      return;
    }
    e.currentTarget.reset();
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa danh mục?")) return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Danh mục
      </h1>
      <AdminNav current="/admin/categories" />
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={onCreate} className="mt-6 flex flex-wrap gap-2">
        <input name="name" required placeholder="Tên" className="rounded border px-3 py-2 text-sm" />
        <input name="slug" required placeholder="slug" className="rounded border px-3 py-2 text-sm" />
        <input name="sortOrder" type="number" defaultValue={0} className="w-24 rounded border px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
          Thêm
        </button>
      </form>
      <ul className="mt-6 divide-y border border-neutral-100 bg-white">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-neutral-500">
                {c.slug} · {c._count?.products ?? 0} SP
              </p>
            </div>
            <button type="button" onClick={() => void remove(c.id)} className="text-xs text-red-600">
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
