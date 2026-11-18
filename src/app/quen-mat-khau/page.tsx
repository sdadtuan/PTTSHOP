"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email") || "") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không gửi được yêu cầu");
      setMessage(data.message || "Đã gửi hướng dẫn nếu email tồn tại.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="type-title text-3xl font-bold">
        Quên mật khẩu
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Nhập email để nhận liên kết đặt lại mật khẩu
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60"
        >
          {loading ? "Đang gửi..." : "Gửi liên kết"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/dang-nhap" className="text-[var(--accent)]">
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
