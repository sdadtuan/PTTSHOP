"use client";

import { useEffect, useState } from "react";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Row = { group: string; key: string; status: string };

export default function IntegrationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/integrations")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        setRows(data.integrations || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <AdminPageHeader title="Tích hợp" description="Chỉ hiện trạng thái và 4 ký tự cuối. Không hiện khóa đầy đủ." />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminCard className="mt-4">
        <ul className="space-y-2 text-sm">
          {rows.map((row) => <li key={row.key}>{row.group} · {row.key} · {row.status}</li>)}
        </ul>
      </AdminCard>
    </div>
  );
}
