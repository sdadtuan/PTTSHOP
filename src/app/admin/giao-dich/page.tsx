"use client";

import { useEffect, useState } from "react";
import { AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";
import { formatVnd } from "@/lib/format";

type Row = {
  id: string;
  provider: string;
  providerTxnId: string;
  amount: number;
  status: string;
  orderNumber: string;
  paymentStatus: string;
};

export default function TransactionsPage() {
  const { toast } = useAdminToast();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void fetch("/api/admin/giao-dich")
      .then((res) => res.json())
      .then((data) => setRows(data.transactions || []))
      .catch(() => toast("Không tải được giao dịch."));
  }, [toast]);

  return (
    <div>
      <AdminPageHeader title="Giao dịch" description="VietQR, MoMo và ZaloPay chỉ hiện ở trang thanh toán khi đã bật và có cấu hình merchant." />
      <AdminCard className="mt-4">
        {rows.length === 0 ? <p className="text-sm text-neutral-600">Chưa có giao dịch.</p> : (
          <ul className="divide-y text-sm">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{row.orderNumber} · {row.provider} · {row.providerTxnId}</span>
                <span>{formatVnd(row.amount)} · {row.status}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
