"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  ward: string | null;
  district: string | null;
  city: string;
  isDefault: boolean;
};

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/account/addresses");
    if (res.status === 401) {
      window.location.href = "/dang-nhap?callbackUrl=/tai-khoan/dia-chi";
      return;
    }
    const data = await res.json();
    if (!res.ok) setError(data.error || "Lỗi");
    else setAddresses(data.addresses || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") || ""),
      phone: String(form.get("phone") || ""),
      line1: String(form.get("line1") || ""),
      ward: String(form.get("ward") || "") || null,
      district: String(form.get("district") || "") || null,
      city: String(form.get("city") || ""),
      isDefault: form.get("isDefault") === "on",
    };
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không lưu được");
      return;
    }
    e.currentTarget.reset();
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa địa chỉ này?")) return;
    await fetch("/api/account/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-center gap-3 text-sm text-neutral-500">
        <Link href="/tai-khoan" className="hover:text-neutral-800">
          Tài khoản
        </Link>
        <span>/</span>
        <span className="text-neutral-800">Sổ địa chỉ</span>
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
        Sổ địa chỉ
      </h1>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-3 border border-neutral-100 bg-white p-4 sm:grid-cols-2"
      >
        <input name="fullName" required placeholder="Họ tên" className="rounded border px-3 py-2 text-sm" />
        <input name="phone" required placeholder="Số điện thoại" className="rounded border px-3 py-2 text-sm" />
        <input name="line1" required placeholder="Địa chỉ" className="rounded border px-3 py-2 text-sm sm:col-span-2" />
        <input name="ward" placeholder="Phường/Xã" className="rounded border px-3 py-2 text-sm" />
        <input name="district" placeholder="Quận/Huyện" className="rounded border px-3 py-2 text-sm" />
        <input name="city" required placeholder="Tỉnh/Thành" className="rounded border px-3 py-2 text-sm sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="isDefault" /> Đặt làm mặc định
        </label>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
          Thêm địa chỉ
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {loading ? <li className="text-sm text-neutral-500">Đang tải…</li> : null}
        {!loading && addresses.length === 0 ? (
          <li className="text-sm text-neutral-500">Chưa có địa chỉ.</li>
        ) : null}
        {addresses.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-4 border border-neutral-100 bg-white p-4">
            <div className="text-sm">
              <p className="font-semibold">
                {a.fullName}{" "}
                {a.isDefault ? (
                  <span className="ml-2 rounded bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                    Mặc định
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-neutral-500">{a.phone}</p>
              <p className="mt-1 text-neutral-600">
                {a.line1}
                {a.ward ? `, ${a.ward}` : ""}
                {a.district ? `, ${a.district}` : ""}, {a.city}
              </p>
            </div>
            <button type="button" onClick={() => void remove(a.id)} className="text-xs text-red-600">
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
