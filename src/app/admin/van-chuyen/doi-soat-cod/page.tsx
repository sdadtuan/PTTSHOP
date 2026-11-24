"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { formatVnd } from "@/lib/format";

type Line = {
  trackingCode: string;
  orderNumber: string;
  expectedAmount: number | null;
  actualAmount: number;
  result: "MATCH" | "MISMATCH" | "UNMATCHED";
};

type SessionRow = {
  id: string;
  createdAt: string;
  provider: string | null;
  lineCount: number;
  matchCount: number;
  mismatchCount: number;
};

export default function CodReconcilePage() {
  const [csv, setCsv] = useState("trackingCode,orderNumber,amount\n");
  const [lines, setLines] = useState<Line[]>([]);
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<SessionRow[]>([]);
  const [historyReady, setHistoryReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/cod-reconcile")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setHistory(Array.isArray(data.sessions) ? data.sessions : []);
        setHistoryReady(true);
      })
      .catch(() => {
        if (!cancelled) setHistoryReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lines]);

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
      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold">Lịch sử đối soát</h2>
        {historyReady && history.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--admin-text-muted)]">Chưa có phiên đối soát COD.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {history.map((session) => (
              <li key={session.id} className="rounded border p-3">
                <p>
                  {new Date(session.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                  {session.provider ? ` · ${session.provider}` : ""}
                </p>
                <p>
                  {session.lineCount} dòng · khớp {session.matchCount} · lệch {session.mismatchCount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </form>
  );
}
