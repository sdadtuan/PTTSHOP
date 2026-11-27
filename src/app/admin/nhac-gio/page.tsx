"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

type Settings = {
  znsEnabled: boolean;
  cartReminderEnabled: boolean;
  reminderAfterHours: number | null;
  reminderMaxTimes: number | null;
};

const EMPTY: Settings = {
  znsEnabled: false,
  cartReminderEnabled: false,
  reminderAfterHours: null,
  reminderMaxTimes: null,
};

export default function CartReminderPage() {
  const { toast } = useAdminToast();
  const [settings, setSettings] = useState<Settings>(EMPTY);

  useEffect(() => {
    void fetch("/api/admin/message-settings")
      .then((res) => res.json())
      .then((data) => setSettings({ ...EMPTY, ...data }))
      .catch(() => toast("Không tải được cài đặt nhắc giỏ."));
  }, [toast]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const hoursText = String(form.get("hours") ?? "").trim();
    const timesText = String(form.get("times") ?? "").trim();
    const res = await fetch("/api/admin/message-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        znsEnabled: form.get("zns") === "on",
        cartReminderEnabled: form.get("cart") === "on",
        reminderAfterHours: hoursText === "" ? null : Number(hoursText),
        reminderMaxTimes: timesText === "" ? null : Number(timesText),
      }),
    });
    if (!res.ok) {
      toast("Không lưu được.");
      return;
    }
    const data = await res.json();
    setSettings({ ...EMPTY, ...data });
    toast("Đã lưu. Để trống số giờ hoặc số lần thì job không chạy.");
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <AdminPageHeader
        title="Nhắc giỏ"
        description="Mặc định tắt. Để trống số giờ hoặc số lần thì không nhắc. Job chỉ ghi log dry-run, không gửi tin."
      />
      <AdminCard className="mt-4 grid max-w-lg gap-4">
        <label className="flex items-center justify-between gap-3 text-sm">
          ZNS
          <input name="zns" type="checkbox" defaultChecked={settings.znsEnabled} key={`zns-${settings.znsEnabled}`} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          Nhắc giỏ bỏ dở
          <input name="cart" type="checkbox" defaultChecked={settings.cartReminderEnabled} key={`cart-${settings.cartReminderEnabled}`} />
        </label>
        <label className="grid gap-1 text-sm">
          Số giờ chờ
          <input
            name="hours"
            inputMode="numeric"
            defaultValue={settings.reminderAfterHours ?? ""}
            key={`hours-${settings.reminderAfterHours ?? ""}`}
            className="rounded border border-neutral-200 px-3 py-2"
            placeholder="Trống = không chạy"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Số lần nhắc tối đa
          <input
            name="times"
            inputMode="numeric"
            defaultValue={settings.reminderMaxTimes ?? ""}
            key={`times-${settings.reminderMaxTimes ?? ""}`}
            className="rounded border border-neutral-200 px-3 py-2"
            placeholder="Trống = không chạy"
          />
        </label>
        <AdminButton type="submit">Lưu</AdminButton>
      </AdminCard>
    </form>
  );
}
