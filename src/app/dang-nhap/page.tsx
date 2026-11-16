"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email hoặc mật khẩu không đúng");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Đăng nhập
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Demo: <code>khach@vizfas.vn / khach123</code> hoặc{" "}
        <code>admin@vizfas.vn / admin123</code>
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
        <label className="block text-sm">
          <span className="mb-1.5 block">Mật khẩu</span>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/" className="text-[var(--accent)]">
          Về trang chủ
        </Link>
      </p>
    </div>
  );
}
