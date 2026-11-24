"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Row = { id: string; createdAt: string; actorEmail: string | null; action: string; entityType: string; entityId: string | null; beforeJson: string | null; afterJson: string | null };

export default function AuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");

  function load(search = query) {
    void fetch(`/api/admin/audit?${search}`)
      .then((res) => res.json())
      .then((data) => setRows(data.rows || []));
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/audit")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRows(data.rows || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onFilter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["action", "entityType", "actor", "from", "to"]) {
      const value = String(form.get(key) || "");
      if (value) params.set(key, value);
    }
    setQuery(params.toString());
    load(params.toString());
  }

  return (
    <div>
      <AdminPageHeader title="Nhật ký thao tác" description="Chỉ đọc. Không có sửa hoặc xoá." />
      <AdminCard className="mt-4">
        <form className="flex flex-wrap gap-2" onSubmit={onFilter}>
          <input name="action" placeholder="Hành động" className="rounded border px-2 py-2" />
          <input name="entityType" placeholder="Đối tượng" className="rounded border px-2 py-2" />
          <input name="actor" placeholder="Người thao tác" className="rounded border px-2 py-2" />
          <input name="from" type="date" className="rounded border px-2 py-2" />
          <input name="to" type="date" className="rounded border px-2 py-2" />
          <AdminButton type="submit">Lọc</AdminButton>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {rows.length === 0 ? <li>Chưa có nhật ký.</li> : null}
          {rows.map((row) => (
            <li key={row.id} className="rounded border p-3">
              <p>{new Date(row.createdAt).toLocaleString("vi-VN")} · {row.actorEmail || "—"} · {row.action} · {row.entityType}</p>
              <p className="text-[var(--admin-text-muted)]">Trước: {row.beforeJson || "—"}</p>
              <p>Sau: {row.afterJson || "—"}</p>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
