"use client";

import { FormEvent, useState } from "react";

const types = [
  { value: "view", label: "Xem dữ liệu" },
  { value: "edit", label: "Sửa dữ liệu" },
  { value: "delete", label: "Xóa dữ liệu" },
  { value: "withdraw", label: "Rút đồng ý tiếp thị" },
] as const;

export default function DataRequestPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/data-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: String(form.get("subject") || ""),
        requestType: String(form.get("requestType") || ""),
        detail: String(form.get("detail") || ""),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Không gửi được yêu cầu");
      return;
    }
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="type-title text-3xl font-bold">Yêu cầu về dữ liệu</h1>
      <p className="mt-3 text-sm text-neutral-600">
        Bạn có thể yêu cầu xem, sửa, xóa dữ liệu cá nhân hoặc rút đồng ý nhận tin khuyến mãi.
      </p>
      {done ? (
        <p className="mt-8 text-sm">Đã ghi nhận yêu cầu. Cửa hàng sẽ xử lý và ghi thời điểm xử lý.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4 text-sm">
          <label className="block">
            <span className="mb-1.5 block text-neutral-600">Email hoặc số điện thoại đã dùng khi mua</span>
            <input name="subject" required className="w-full rounded border border-neutral-200 px-3 py-2.5" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-neutral-600">Loại yêu cầu</span>
            <select name="requestType" className="w-full rounded border border-neutral-200 px-3 py-2.5">
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-neutral-600">Nội dung</span>
            <textarea name="detail" required rows={4} className="w-full rounded border border-neutral-200 px-3 py-2.5" />
          </label>
          {error ? <p className="text-red-600">{error}</p> : null}
          <button className="rounded bg-neutral-900 px-4 py-2.5 font-semibold text-white" type="submit">
            Gửi yêu cầu
          </button>
        </form>
      )}
    </div>
  );
}
