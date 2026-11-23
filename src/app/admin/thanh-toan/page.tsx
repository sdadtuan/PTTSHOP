"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminInput, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

type FormState = {
  codEnabled: boolean;
  codMaxAmount: string;
  holdHours: string;
  codConfirmHours: string;
  bankBin: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch: string;
  bankReady: boolean;
};

const empty: FormState = {
  codEnabled: true,
  codMaxAmount: "5000000",
  holdHours: "24",
  codConfirmHours: "48",
  bankBin: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  bankBranch: "",
  bankReady: false,
};

export default function AdminPaymentSettingsPage() {
  const { toast } = useAdminToast();
  const [form, setForm] = useState<FormState>(empty);
  const [masked, setMasked] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/payment-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast(data.error, "error");
          return;
        }
        setForm({
          codEnabled: data.codEnabled !== false,
          codMaxAmount: String(data.codMaxAmount ?? 5000000),
          holdHours: String(data.holdHours ?? 24),
          codConfirmHours: String(data.codConfirmHours ?? 48),
          bankBin: data.bankBin || "",
          bankName: data.bankName || "",
          bankAccountNumber: data.bankAccountNumber || "",
          bankAccountName: data.bankAccountName || "",
          bankBranch: data.bankBranch || "",
          bankReady: Boolean(data.bankReady),
        });
        setMasked(data.bankAccountMasked || "");
      })
      .finally(() => setLoading(false));
  }, [toast]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/payment-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        codMaxAmount: Number(form.codMaxAmount),
        holdHours: Number(form.holdHours),
        codConfirmHours: Number(form.codConfirmHours),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Không lưu được", "error");
      return;
    }
    setMasked(data.bankAccountMasked || "");
    setForm((current) => ({ ...current, bankReady: Boolean(current.bankBin && current.bankAccountNumber && current.bankAccountName && current.bankName) }));
    toast("Đã lưu cài đặt thanh toán");
  }

  return (
    <div>
      <AdminPageHeader title="Thanh toán" description="COD, hạn giữ hàng và tài khoản nhận chuyển khoản." />
      {!loading && !form.bankReady ? (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          Chưa cấu hình tài khoản nhận tiền
        </p>
      ) : null}
      <AdminCard>
        {loading ? <p className="text-sm text-[var(--admin-text-muted)]">Đang tải…</p> : (
          <form onSubmit={(e) => void onSubmit(e)} className="max-w-xl space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.codEnabled} onChange={(e) => setForm({ ...form, codEnabled: e.target.checked })} />
              Bật thanh toán khi nhận hàng (COD)
            </label>
            <AdminInput label="Ngưỡng tối đa đơn COD (đồng)" hint="Mặc định đề xuất 5.000.000." value={form.codMaxAmount} onChange={(e) => setForm({ ...form, codMaxAmount: e.target.value })} />
            <AdminInput label="Thời gian giữ hàng chuyển khoản / payOS (giờ)" hint="Mặc định đề xuất 24 giờ. Quá hạn thì huỷ đơn tạo sau thời điểm deploy và trả tồn." value={form.holdHours} onChange={(e) => setForm({ ...form, holdHours: e.target.value })} />
            <AdminInput label="Thời hạn xác nhận COD (giờ)" hint="Mặc định đề xuất 48 giờ. Quá hạn chỉ cảnh báo, không tự huỷ." value={form.codConfirmHours} onChange={(e) => setForm({ ...form, codConfirmHours: e.target.value })} />
            <AdminInput label="Mã ngân hàng (BIN)" value={form.bankBin} onChange={(e) => setForm({ ...form, bankBin: e.target.value })} />
            <AdminInput label="Tên ngân hàng" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            <AdminInput label="Số tài khoản" hint={masked ? `Đang lưu dạng ${masked}` : "Chưa có số tài khoản."} value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
            <AdminInput label="Tên chủ tài khoản" hint="In hoa, không dấu." value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} />
            <AdminInput label="Chi nhánh (tuỳ chọn)" value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} />
            <AdminButton type="submit">Lưu</AdminButton>
          </form>
        )}
      </AdminCard>
    </div>
  );
}
