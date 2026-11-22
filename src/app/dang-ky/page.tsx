"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useStorefrontUi } from "@/components/cms/storefront-layout-context";
import { ConsentFields, consentsFromForm } from "@/components/legal/consent-fields";

export default function RegisterPage() {
  const a = useStorefrontUi().auth;
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      phone: String(form.get("phone") || "") || undefined,
      consents: consentsFromForm(form),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không đăng ký được");

      const login = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/dang-nhap");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="type-title text-3xl font-bold">{a.registerTitle}</h1>
      <p className="mt-2 text-sm text-neutral-500">{a.registerSubtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Họ tên" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Số điện thoại" name="phone" />
        <Field label="Mật khẩu" name="password" type="password" required />
        <ConsentFields />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-[var(--accent)] disabled:opacity-60"
        >
          {loading ? a.registerSubmitLoading : a.registerSubmit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {a.registerHasAccount}{" "}
        <Link href="/dang-nhap" className="text-[var(--accent)]">
          {a.registerLoginLink}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={type === "password" ? 6 : undefined}
        className="w-full rounded border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
      />
    </label>
  );
}
