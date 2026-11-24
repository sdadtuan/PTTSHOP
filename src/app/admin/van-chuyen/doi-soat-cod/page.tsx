"use client";

import { FormEvent, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { formatVnd } from "@/lib/format";

type Line = {
  trackingCode: string;
  orderNumber: string;
  expectedAmount: number | null;
  actualAmount: number;
  result: "MATCH" | "MISMATCH" | "UNMATCHED";
};

export default function CodReconcilePage() {
  const [csv, setCsv] = useState("trackingCode,orderNumber,amount\n");
  const [lines, setLines] = useState<Line[]>([]);
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/cod-reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "GHN", csv }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không đối soát được.");
      return;
    }
    setLines(data.report.lines);
    setOpenCount(data.report.open.length);
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <AdminPageHeader
        title="Đối soát COD"
        description="Dán CSV mã vận đơn, mã đơn, số tiền. Hệ thống không sửa số tiền đơn gốc."
      />
      <AdminCard className="mt-4 space-y-3">
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} className="w-full rounded border px-3 py-2 font-mono text-sm" />
        <AdminButton type="submit">Đối soát</AdminButton>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {openCount !== null ? <p className="text-sm">Kiện COD chưa có trong đợt này: {openCount}</p> : null}
        <ul className="space-y-2 text-sm">
          {lines.map((line, index) => (
            <li key={`${line.trackingCode}-${index}`} className="rounded border p-3">
              <p>{line.result === "MATCH" ? "Khớp" : line.result === "MISMATCH" ? "Lệch tiền" : "Chưa khớp mã"} · {line.trackingCode || line.orderNumber}</p>
              <p>Hãng chuyển {formatVnd(line.actualAmount)} · kiện ghi {line.expectedAmount === null ? "không có" : formatVnd(line.expectedAmount)}</p>
            </li>
          ))}
        </ul>
      </AdminCard>
    </form>
  );
}
