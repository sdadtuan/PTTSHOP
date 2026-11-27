"use client";

import { FormEvent, useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
};

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/reviews?productId=${productId}`);
    if (!res.ok) return;
    const data = await res.json();
    setReviews(data.reviews || []);
    setEligibleOrderId(data.eligibleOrderId || null);
  }

  useEffect(() => {
    void load();
  }, [productId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eligibleOrderId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderId: eligibleOrderId,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không gửi được đánh giá");
      if (file && data.review?.id) {
        const body = new FormData();
        body.set("reviewId", data.review.id);
        body.set("file", file);
        const media = await fetch("/api/reviews/media", { method: "POST", body });
        if (!media.ok) {
          const mediaBody = await media.json().catch(() => ({}));
          throw new Error(mediaBody.error || "Đánh giá đã gửi, file chưa được nhận");
        }
      }
      setComment("");
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-16 border-t border-neutral-100 pt-10">
      <h2 className="type-title text-xl font-bold">
        Đánh giá ({reviews.length})
      </h2>

      {eligibleOrderId ? (
        <form onSubmit={onSubmit} className="mt-4 space-y-3 border border-neutral-100 bg-white p-4">
          <p className="text-sm text-neutral-600">Bạn đã mua sản phẩm này — hãy để lại đánh giá.</p>
          <label className="block text-sm">
            Số sao
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="ml-2 rounded border border-neutral-200 px-2 py-1"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Nhận xét của bạn"
            className="w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          />
          <label className="block text-sm text-neutral-600">
            Ảnh hoặc video (không bắt buộc)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="mt-1 block w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="text-xs text-neutral-500">Đánh giá chỉ hiện sau khi PTT Shop duyệt.</p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      ) : null}

      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="border-b border-neutral-50 pb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.userName}</span>
              <span className="text-amber-500">★ {r.rating}</span>
              <span className="text-xs text-neutral-400">
                {new Date(r.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            {r.comment ? (
              <p className="mt-1 text-neutral-600">{r.comment}</p>
            ) : null}
          </li>
        ))}
        {reviews.length === 0 ? (
          <li className="text-sm text-neutral-500">Chưa có đánh giá.</li>
        ) : null}
      </ul>
    </section>
  );
}
