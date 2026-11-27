"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminInput, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

type FormState = {
  hotline: string;
  email: string;
  address: string;
  hours: string;
  zaloUrl: string;
  freeShipThreshold: string;
  fallbackFee: string;
  returnWindowDays: string;
  lowStockThreshold: string;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  bankBin: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch: string;
  bankAccountMasked: string;
  ga4MeasurementId: string;
  metaPixelId: string;
  tiktokPixelId: string;
  clarityProjectId: string;
};

const empty: FormState = {
  hotline: "",
  email: "",
  address: "",
  hours: "",
  zaloUrl: "",
  freeShipThreshold: "",
  fallbackFee: "",
  returnWindowDays: "",
  lowStockThreshold: "",
  codEnabled: true,
  bankTransferEnabled: false,
  bankBin: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  bankBranch: "",
  bankAccountMasked: "",
  ga4MeasurementId: "",
  metaPixelId: "",
  tiktokPixelId: "",
  clarityProjectId: "",
};

function moneyOrNull(value: string) {
  if (!value.trim()) return null;
  return Number(value);
}

export default function AdminShopPage() {
  const { toast } = useAdminToast();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/shop-profile")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          ...empty,
          hotline: data.hotline || "",
          email: data.email || "",
          address: data.address || "",
          hours: data.hours || "",
          zaloUrl: data.zaloUrl || "",
          freeShipThreshold: data.freeShipThreshold == null ? "" : String(data.freeShipThreshold),
          fallbackFee: data.fallbackFee == null ? "" : String(data.fallbackFee),
          returnWindowDays: data.returnWindowDays == null ? "" : String(data.returnWindowDays),
          lowStockThreshold: data.lowStockThreshold == null ? "" : String(data.lowStockThreshold),
          codEnabled: data.codEnabled !== false,
          bankTransferEnabled: Boolean(data.bankTransferEnabled),
          bankBin: data.bankBin || "",
          bankName: data.bankName || "",
          bankAccountName: data.bankAccountName || "",
          bankBranch: data.bankBranch || "",
          bankAccountMasked: data.bankAccountMasked || "",
          ga4MeasurementId: data.ga4MeasurementId || "",
          metaPixelId: data.metaPixelId || "",
          tiktokPixelId: data.tiktokPixelId || "",
          clarityProjectId: data.clarityProjectId || "",
        });
      })
      .catch(() => toast("Không tải được cấu hình cửa hàng."))
      .finally(() => setLoading(false));
  }, [toast]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/shop-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotline: form.hotline,
        email: form.email,
        address: form.address,
        hours: form.hours,
        zaloUrl: form.zaloUrl,
        freeShipThreshold: moneyOrNull(form.freeShipThreshold),
        fallbackFee: moneyOrNull(form.fallbackFee),
        returnWindowDays: moneyOrNull(form.returnWindowDays),
        lowStockThreshold: moneyOrNull(form.lowStockThreshold),
        codEnabled: form.codEnabled,
        bankTransferEnabled: form.bankTransferEnabled,
        bankBin: form.bankBin,
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        keepBankAccount: !form.bankAccountNumber && Boolean(form.bankAccountMasked),
        bankAccountName: form.bankAccountName,
        bankBranch: form.bankBranch,
        ga4MeasurementId: form.ga4MeasurementId,
        metaPixelId: form.metaPixelId,
        tiktokPixelId: form.tiktokPixelId,
        clarityProjectId: form.clarityProjectId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Không lưu được.");
      return;
    }
    setForm((current) => ({
      ...current,
      bankAccountNumber: "",
      bankAccountMasked: data.bankAccountMasked || "",
    }));
    toast("Đã lưu cấu hình cửa hàng.");
  }

  if (loading) return <p className="text-sm">Đang tải…</p>;

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <AdminPageHeader
        title="Cửa hàng"
        description="Để trống thì trang bán hàng ẩn mục đó. Không điền số liệu mẫu."
      />
      <AdminCard className="mt-4 grid gap-4">
        <AdminInput label="Hotline" value={form.hotline} onChange={(e) => setForm({ ...form, hotline: e.target.value })} hint="0 và 9 chữ số, hoặc +84 và 9 chữ số." />
        <AdminInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <AdminInput label="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <AdminInput label="Giờ mở cửa" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
        <AdminInput label="Link Zalo" value={form.zaloUrl} onChange={(e) => setForm({ ...form, zaloUrl: e.target.value })} hint="https://… Để trống thì ẩn nút Zalo." />
        <AdminInput label="Ngưỡng freeship (đ)" type="number" min={0} value={form.freeShipThreshold} onChange={(e) => setForm({ ...form, freeShipThreshold: e.target.value })} hint="Để trống thì không hiện freeship." />
        <AdminInput label="Phí vận chuyển dự phòng (đ)" type="number" min={0} value={form.fallbackFee} onChange={(e) => setForm({ ...form, fallbackFee: e.target.value })} hint="Để trống thì giỏ ghi phí sẽ báo khi xác nhận đơn." />
        <AdminInput label="Số ngày đổi trả" type="number" min={0} value={form.returnWindowDays} onChange={(e) => setForm({ ...form, returnWindowDays: e.target.value })} hint="Để trống thì không ghi số ngày." />
        <AdminInput label="Ngưỡng còn ít hàng" type="number" min={1} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} hint="Để trống thì không hiện “Còn N” trên trang sản phẩm." />
        <AdminInput label="GA4 measurement ID" value={form.ga4MeasurementId} onChange={(e) => setForm({ ...form, ga4MeasurementId: e.target.value })} hint="Để trống thì không tải GA4." />
        <AdminInput label="Meta pixel ID" value={form.metaPixelId} onChange={(e) => setForm({ ...form, metaPixelId: e.target.value })} hint="Để trống thì không tải Meta." />
        <AdminInput label="TikTok pixel ID" value={form.tiktokPixelId} onChange={(e) => setForm({ ...form, tiktokPixelId: e.target.value })} hint="Để trống thì không tải TikTok." />
        <AdminInput label="Clarity project ID" value={form.clarityProjectId} onChange={(e) => setForm({ ...form, clarityProjectId: e.target.value })} hint="Để trống thì không tải Clarity." />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.codEnabled} onChange={(e) => setForm({ ...form, codEnabled: e.target.checked })} />
          Bật thanh toán COD
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.bankTransferEnabled} onChange={(e) => setForm({ ...form, bankTransferEnabled: e.target.checked })} />
          Bật chuyển khoản
        </label>
        <AdminInput label="BIN ngân hàng" value={form.bankBin} onChange={(e) => setForm({ ...form, bankBin: e.target.value })} />
        <AdminInput label="Tên ngân hàng" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
        <AdminInput
          label="Số tài khoản"
          value={form.bankAccountNumber}
          onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
          hint={form.bankAccountMasked ? `Đang lưu ${form.bankAccountMasked}. Để trống nếu giữ số cũ.` : "Chưa lưu số tài khoản."}
          autoComplete="off"
        />
        <AdminInput label="Tên chủ tài khoản" value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} hint="In hoa, không dấu." />
        <AdminInput label="Chi nhánh" value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} />
        <AdminButton type="submit">Lưu</AdminButton>
      </AdminCard>
    </form>
  );
}
