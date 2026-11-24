"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type FormState = {
  freeShipThreshold: number;
  fallbackFee: number;
  intraProvinceFee: number | null;
  interProvinceFee: number | null;
  parcelWeightGrams: number;
  warehouseProvinceCode: string;
  warehouseWardCode: string;
  warehouseAddress: string;
  senderName: string;
  senderPhone: string;
  defaultProvider: "MANUAL" | "GHN" | "GHTK";
  ghnEnabled?: boolean;
  ghnWebhookEnabled?: boolean;
  ghtkEnabled?: boolean;
};

export default function ShippingSettingsPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ code: string; name: string }[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/admin/shipping-settings")
      .then((res) => res.json())
      .then((data) => setForm(data))
      .catch(() => setMessage("Không tải được cài đặt."));
    void fetch("/api/address")
      .then((res) => res.json())
      .then((data) => setProvinces(data.provinces || []));
  }, []);

  useEffect(() => {
    if (!form?.warehouseProvinceCode) return;
    void fetch(`/api/address?province=${encodeURIComponent(form.warehouseProvinceCode)}`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards || []));
  }, [form?.warehouseProvinceCode]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMessage("");
    const res = await fetch("/api/admin/shipping-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        intraProvinceFee: form.intraProvinceFee,
        interProvinceFee: form.interProvinceFee,
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Đã lưu cài đặt vận chuyển." : data.error || "Không lưu được.");
  }

  if (!form) return <p className="text-sm">Đang tải…</p>;

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <AdminPageHeader
        title="Vận chuyển"
        description="Một quy tắc phí cho cả site. Kho để trống cho tới khi bạn nhập."
        actions={
          <Link href="/admin/van-chuyen/doi-soat-cod" className="text-sm text-[var(--admin-accent)]">
            Đối soát COD
          </Link>
        }
      />
      <AdminCard className="mt-4 space-y-4">
        <p className="text-sm text-[var(--admin-text-muted)]">
          GHN {form.ghnEnabled ? "đã có token" : "chưa có GHN_TOKEN và GHN_SHOP_ID, đang dùng phí dự phòng"}.
          Webhook {form.ghnWebhookEnabled ? "đã cấu hình" : "chưa có GHN_WEBHOOK_TOKEN"}.
          GHTK {form.ghtkEnabled ? "có token nhưng bản này chưa gọi API GHTK" : "chưa có token"}.
        </p>
        <label className="block text-sm">
          Ngưỡng miễn phí ship (đ)
          <input className="mt-1 w-full rounded border px-3 py-2" type="number" value={form.freeShipThreshold} onChange={(e) => setForm({ ...form, freeShipThreshold: Number(e.target.value) })} />
        </label>
        <label className="block text-sm">
          Phí dự phòng (đ)
          <input className="mt-1 w-full rounded border px-3 py-2" type="number" value={form.fallbackFee} onChange={(e) => setForm({ ...form, fallbackFee: Number(e.target.value) })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Phí nội tỉnh, để trống nếu chưa chốt
            <input className="mt-1 w-full rounded border px-3 py-2" type="number" value={form.intraProvinceFee ?? ""} onChange={(e) => setForm({ ...form, intraProvinceFee: e.target.value === "" ? null : Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            Phí liên tỉnh, để trống nếu chưa chốt
            <input className="mt-1 w-full rounded border px-3 py-2" type="number" value={form.interProvinceFee ?? ""} onChange={(e) => setForm({ ...form, interProvinceFee: e.target.value === "" ? null : Number(e.target.value) })} />
          </label>
        </div>
        <label className="block text-sm">
          Hãng mặc định
          <select className="mt-1 w-full rounded border px-3 py-2" value={form.defaultProvider} onChange={(e) => setForm({ ...form, defaultProvider: e.target.value as FormState["defaultProvider"] })}>
            <option value="MANUAL">Thủ công</option>
            <option value="GHN">GHN</option>
            <option value="GHTK">GHTK</option>
          </select>
        </label>
        <label className="block text-sm">
          Khối lượng mặc định một kiện (gam)
          <input className="mt-1 w-full rounded border px-3 py-2" type="number" value={form.parcelWeightGrams} onChange={(e) => setForm({ ...form, parcelWeightGrams: Number(e.target.value) })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Tỉnh kho
            <select className="mt-1 w-full rounded border px-3 py-2" value={form.warehouseProvinceCode} onChange={(e) => setForm({ ...form, warehouseProvinceCode: e.target.value, warehouseWardCode: "" })}>
              <option value="">Chưa nhập</option>
              {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            Phường/xã kho
            <select className="mt-1 w-full rounded border px-3 py-2" value={form.warehouseWardCode} onChange={(e) => setForm({ ...form, warehouseWardCode: e.target.value })}>
              <option value="">Chưa nhập</option>
              {wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          Địa chỉ kho
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.warehouseAddress} onChange={(e) => setForm({ ...form, warehouseAddress: e.target.value })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Người gửi
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
          </label>
          <label className="block text-sm">
            SĐT người gửi
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} />
          </label>
        </div>
        <AdminButton type="submit">Lưu</AdminButton>
        {message ? <p className="text-sm">{message}</p> : null}
      </AdminCard>
    </form>
  );
}
