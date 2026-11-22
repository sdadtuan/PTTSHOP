"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  subject: string;
  requestType: string | null;
  detail: string | null;
  status: string;
  createdAt: string;
  handledAt: string | null;
};

export default function AdminDataRequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/data-requests");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không tải được");
      return;
    }
    setRows(data.rows ?? []);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function mark(id: string) {
    const res = await fetch("/api/admin/data-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Yêu cầu dữ liệu</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-3 text-sm">
        {rows.map((row) => (
          <li key={row.id} className="rounded border border-neutral-200 p-3">
            <p className="font-semibold">{row.subject}</p>
            <p>{row.requestType}: {row.detail}</p>
            <p className="text-neutral-500">
              {row.status}
              {row.handledAt ? ` · ${row.handledAt}` : ""}
            </p>
            {row.status !== "handled" ? (
              <button className="mt-2 underline" type="button" onClick={() => mark(row.id)}>
                Đánh dấu đã xử lý
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
