"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCsrfToken, signIn } from "next-auth/react";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

async function signInCredentials(email: string, password: string) {
  await getCsrfToken();
  let res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });
  // Rare race on first paint: CSRF cookie not yet readable — retry once.
  if (res?.error === "MissingCSRF") {
    await getCsrfToken();
    res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  }
  return res;
}

async function waitForSession(timeoutMs = 5_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const data = await fetch("/api/auth/session").then((r) => r.json());
      if (data?.user) return true;
    } catch {
      // ignore transient fetch errors
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    void getCsrfToken();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hydrated || loading) return;

    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const res = await signInCredentials(email, password);
    if (res?.error) {
      setLoading(false);
      setError(
        res.error === "CredentialsSignin"
          ? "Email hoặc mật khẩu không đúng"
          : res.error,
      );
      return;
    }
    const callback = safeCallbackUrl(searchParams.get("callbackUrl"), "/");
    await waitForSession();
    // Full navigation so the session cookie is sent on the next document
    // request (avoids middleware redirect loops after client router.push).
    window.location.assign(callback);
  }

  return (
    <form
      method="post"
      action="/dang-nhap"
      onSubmit={onSubmit}
      className="mt-8 space-y-4"
      data-testid="login-form"
      data-hydrated={hydrated ? "true" : "false"}
    >
      <label className="block text-sm">
        <span className="mb-1.5 block">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block">Mật khẩu</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {!hydrated ? (
        <p className="text-xs text-neutral-500" data-testid="login-hydrate-wait">
          Đang sẵn sàng form đăng nhập…
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!hydrated || loading}
        className="w-full rounded bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="type-title text-3xl font-bold">
        Đăng nhập
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Demo: <code>khach@vizfas.vn / khach123</code> hoặc{" "}
        <code>admin@vizfas.vn / admin123</code>
      </p>
      <p className="mt-1 text-xs text-amber-700">
        Đổi mật khẩu admin mặc định trước khi dùng môi trường chia sẻ.
      </p>

      <Suspense fallback={<p className="mt-8 text-sm text-neutral-500">Đang tải...</p>}>
        <LoginForm />
      </Suspense>

      <div className="mt-6 space-y-2 text-center text-sm text-neutral-500">
        <p>
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="text-[var(--accent)]">
            Đăng ký
          </Link>
        </p>
        <p>
          <Link href="/quen-mat-khau" className="text-[var(--accent)]">
            Quên mật khẩu?
          </Link>
        </p>
        <p>
          <Link href="/" className="text-[var(--accent)]">
            Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
