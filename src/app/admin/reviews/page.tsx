"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
  product: { name: string; slug: string };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/reviews");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Lỗi");
    else setReviews(data.reviews || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Xóa đánh giá?")) return;
    await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Đánh giá
      </h1>
      <AdminNav current="/admin/reviews" />
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <ul className="mt-6 divide-y border border-neutral-100 bg-white">
        {reviews.map((r) => (
          <li key={r.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {r.product.name} · ★ {r.rating}
              </p>
              <p className="text-xs text-neutral-500">
                {r.user.name || r.user.email} ·{" "}
                {new Date(r.createdAt).toLocaleDateString("vi-VN")}
              </p>
              {r.comment ? (
                <p className="mt-1 text-neutral-600">{r.comment}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void remove(r.id)}
              className="shrink-0 text-xs text-red-600"
            >
              Xóa
            </button>
          </li>
        ))}
        {reviews.length === 0 ? (
          <li className="px-4 py-8 text-center text-neutral-500">
            Chưa có đánh giá
          </li>
        ) : null}
      </ul>
    </div>
  );
}
