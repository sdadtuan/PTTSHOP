"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

type Row = { key: string; enabled: boolean; variants: string; trafficPercent: number };

export default function ExperimentsPage() {
  const { toast } = useAdminToast();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void fetch("/api/admin/experiments")
      .then((res) => res.json())
      .then((data) => setRows(data.experiments || []))
      .catch(() => toast("Không tải được thử nghiệm."));
  }, [toast]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    for (const row of rows) {
      const res = await fetch("/api/admin/experiments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: row.key, enabled: row.enabled }),
      });
      if (!res.ok) {
        toast("Không lưu được.");
        return;
      }
    }
    toast("Đã lưu. Tắt thử nghiệm thì mọi khách về bản gốc.");
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <AdminPageHeader title="Thử nghiệm" description="Mặc định tắt. Bật tại đây, không cần deploy lại." />
      <AdminCard className="mt-4 grid gap-3">
        {rows.map((row) => (
          <label key={row.key} className="flex items-center justify-between gap-3 text-sm">
            <span>
              {row.key}
              <span className="ml-2 text-neutral-500">{row.variants}</span>
            </span>
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(event) => setRows((current) => current.map((item) => item.key === row.key ? { ...item, enabled: event.target.checked } : item))}
            />
          </label>
        ))}
        <AdminButton type="submit">Lưu</AdminButton>
      </AdminCard>
    </form>
  );
}
