"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          token: String(form.get("token") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không đặt lại được mật khẩu");
      router.push("/dang-nhap");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <input type="hidden" name="token" defaultValue={params.get("token") || ""} />
      <label className="block text-sm">
        <span className="mb-1.5 block">Email</span>
        <input
          name="email"
          type="email"
          required
          defaultValue={params.get("email") || ""}
          className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block">Mật khẩu mới</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60"
      >
        {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="type-title text-3xl font-bold">
        Đặt lại mật khẩu
      </h1>
      <Suspense fallback={<p className="mt-8 text-sm text-neutral-500">Đang tải...</p>}>
        <ResetForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/dang-nhap" className="text-[var(--accent)]">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
