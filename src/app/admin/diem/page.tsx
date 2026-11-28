"use client";

import { FormEvent, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

export default function LoyaltyAdminPage() {
  const { toast } = useAdminToast();
  const [enabled, setEnabled] = useState(false);
  const [points, setPoints] = useState("");
  const [amount, setAmount] = useState("");
  const [earnOn, setEarnOn] = useState("");
  const [expireDays, setExpireDays] = useState("");
  const [cap, setCap] = useState("");
  const [vnd, setVnd] = useState("");
  const [referral, setReferral] = useState("");
  const [tiers, setTiers] = useState("");

  async function load() {
    const res = await fetch("/api/admin/loyalty");
    const data = await res.json();
    if (!res.ok) {
      toast("Không tải được điểm");
      return;
    }
    const settings = data.settings || {};
    const text = (value: unknown) => (value == null || value === "" ? "" : String(value));
    setEnabled(settings.enabled === true);
    setPoints(text(settings.pointsPerAmount));
    setAmount(text(settings.amountVnd));
    setEarnOn(settings.earnOn || "");
    setExpireDays(text(settings.expireDays));
    setCap(text(settings.redeemCapPerOrder));
    setVnd(text(settings.redeemVndPerPoint));
    setReferral(text(settings.referralPointsEach));
    setTiers((data.tiers || []).map((tier: { name: string; minPoints: number; benefit: string | null }) => `${tier.name}|${tier.minPoints}|${tier.benefit || ""}`).join("\n"));
  }

  function num(value: string) {
    return value.trim() ? Number(value) : null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedTiers = tiers.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [name, minPoints, benefit] = line.split("|");
      return { name: name || "", minPoints: Number(minPoints), benefit: benefit || null };
    });
    const res = await fetch("/api/admin/loyalty", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        pointsPerAmount: num(String(points)),
        amountVnd: num(String(amount)),
        earnOn: earnOn === "COMPLETED" || earnOn === "PAID" ? earnOn : null,
        expireDays: num(String(expireDays)),
        redeemCapPerOrder: num(String(cap)),
        redeemVndPerPoint: num(String(vnd)),
        referralPointsEach: num(String(referral)),
        tiers: parsedTiers,
      }),
    });
    const data = await res.json().catch(() => null);
    toast(res.ok ? "Đã lưu. Tắt thì khách không thấy điểm." : data?.error || "Không lưu được");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminPageHeader title="Điểm" description="Mặc định tắt và chưa có tỷ lệ. Số dư chỉ đổi qua sổ điểm. Tắt thì ẩn khỏi khách." />
      <AdminButton type="button" onClick={() => void load()}>Tải quy tắc</AdminButton>
      <AdminCard>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Bật điểm
        </label>
        <label className="mt-3 block text-sm">Điểm cộng
          <input value={points} onChange={(event) => setPoints(event.target.value)} inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="mt-3 block text-sm">cho mỗi số tiền (đồng)
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="mt-3 block text-sm">Đơn được tính
          <select value={earnOn} onChange={(event) => setEarnOn(event.target.value)} className="mt-1 w-full rounded border px-2 py-1">
            <option value="">Chưa chọn</option>
            <option value="COMPLETED">Đã giao</option>
            <option value="PAID">Đã thanh toán</option>
          </select>
        </label>
        <label className="mt-3 block text-sm">Hạn dùng (ngày)
          <input value={expireDays} onChange={(event) => setExpireDays(event.target.value)} inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="mt-3 block text-sm">Trần điểm mỗi đơn
          <input value={cap} onChange={(event) => setCap(event.target.value)} inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="mt-3 block text-sm">Một điểm đổi được (đồng)
          <input value={vnd} onChange={(event) => setVnd(event.target.value)} inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="mt-3 block text-sm">Điểm giới thiệu mỗi bên
          <input value={referral} onChange={(event) => setReferral(event.target.value)} inputMode="numeric" className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="mt-3 block text-sm">Hạng, mỗi dòng: tên|điểm tối thiểu|quyền
          <textarea value={tiers} onChange={(event) => setTiers(event.target.value)} rows={4} className="mt-1 w-full rounded border px-2 py-1 font-mono text-xs" />
        </label>
        <AdminButton type="submit" className="mt-3">Lưu</AdminButton>
      </AdminCard>
    </form>
  );
}
