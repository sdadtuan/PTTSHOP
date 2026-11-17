"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminCard,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTh,
  AdminTr,
  paginate,
} from "@/components/admin/ui";

type Customer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: { orders: number };
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (!res.ok) setError(data.error || "Không tải được khách hàng");
      else {
        setError("");
        setCustomers(data.customers || []);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.phone || "").toLowerCase().includes(query),
    );
  }, [customers, q]);

  const paged = paginate(filtered, page, 10);

  return (
    <div>
      <AdminPageHeader
        title="Khách hàng"
        description="Danh sách tài khoản khách đã đăng ký"
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Khách hàng" },
        ]}
      />

      <AdminCard className="mb-4">
        <AdminInput
          label="Tìm kiếm"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Tên, email, SĐT…"
        />
      </AdminCard>

      {error ? (
        <p
          className="mb-4 rounded-[var(--admin-radius-md)] border border-red-200 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <AdminTableSkeleton />
      ) : paged.items.length === 0 ? (
        <AdminEmptyState
          title="Chưa có khách hàng"
          description="Khi có tài khoản mới, danh sách sẽ hiện tại đây."
        />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Tên</AdminTh>
                <AdminTh>Email</AdminTh>
                <AdminTh>SĐT</AdminTh>
                <AdminTh>Đơn</AdminTh>
                <AdminTh>Tham gia</AdminTh>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((c) => (
                <AdminTr key={c.id}>
                  <AdminTd className="font-medium">{c.name || "—"}</AdminTd>
                  <AdminTd>{c.email}</AdminTd>
                  <AdminTd>{c.phone || "—"}</AdminTd>
                  <AdminTd>{c._count.orders}</AdminTd>
                  <AdminTd className="text-[var(--admin-text-muted)]">
                    {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
          <div className="mt-4">
            <AdminPagination
              page={paged.page}
              totalPages={paged.totalPages}
              total={paged.total}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
