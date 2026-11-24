"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCsrfToken, signIn } from "next-auth/react";
import { safeCallbackUrl } from "@/lib/safe-callback-url";
import { useStorefrontUi } from "@/components/cms/storefront-layout-context";

async function signInCredentials(email: string, password: string, otp: string) {
  await getCsrfToken();
  let res = await signIn("credentials", {
    email,
    password,
    otp,
    redirect: false,
  });
  // Rare race on first paint: CSRF cookie not yet readable — retry once.
  if (res?.error === "MissingCSRF") {
    await getCsrfToken();
    res = await signIn("credentials", {
      email,
      password,
      otp,
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
  const a = useStorefrontUi().auth;
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
    const otp = String(form.get("otp") || "");
    const res = await signInCredentials(email, password, otp);
    if (res?.error) {
      setLoading(false);
      const code = (res as { code?: string }).code;
      setError(
        code === "two_factor_required"
          ? "Nhập mã 6 số từ ứng dụng xác thực."
          : code === "two_factor_invalid"
            ? "Mã xác thực không đúng."
            : res.error === "CredentialsSignin"
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
      <label className="block text-sm">
        <span className="mb-1.5 block">Mã xác thực 6 số, nếu đã bật</span>
        <input
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
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
          {a.loginHydrateWait}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!hydrated || loading}
        className="w-full rounded bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60"
      >
        {loading ? a.loginSubmitLoading : a.loginSubmit}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const a = useStorefrontUi().auth;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="type-title text-3xl font-bold">{a.loginTitle}</h1>

      <Suspense fallback={<p className="mt-8 text-sm text-neutral-500">Đang tải...</p>}>
        <LoginForm />
      </Suspense>

      <div className="mt-6 space-y-2 text-center text-sm text-neutral-500">
        <p>
          {a.loginNoAccount}{" "}
          <Link href="/dang-ky" className="text-[var(--accent)]">
            {a.loginRegisterLink}
          </Link>
        </p>
        <p>
          <Link href="/quen-mat-khau" className="text-[var(--accent)]">
            {a.loginForgotLink}
          </Link>
        </p>
        <p>
          <Link href="/" className="text-[var(--accent)]">
            {a.loginHomeLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
