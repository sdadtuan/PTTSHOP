"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { ROLE_LABELS } from "@/lib/rbac";

const ROLES = ["ADMIN", "DIRECTOR", "WAREHOUSE", "CSKH", "ACCOUNTANT", "MARKETING"] as const;
type StaffUser = { id: string; email: string; name: string | null; roles: string[]; legacy: boolean };

export default function RolesPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [qr, setQr] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetch("/api/admin/phan-quyen").then((res) => res.json()), fetch("/api/admin/two-factor").then((res) => res.json())])
      .then(([roles, two]) => {
        if (cancelled) return;
        setUsers(roles.users || []);
        setEnabled(Boolean(two.enabled));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveRoles(e: FormEvent<HTMLFormElement>, userId: string) {
    e.preventDefault();
    const user = users.find((row) => row.id === userId);
    const roles = [...new FormData(e.currentTarget).getAll("role").map(String)];
    if (user?.legacy && !roles.includes("ADMIN")) {
      const accepted = window.confirm("Tài khoản này đang toàn quyền. Danh sách mới không có Quản trị. Tiếp tục?");
      if (!accepted) return;
    }
    const res = await fetch("/api/admin/phan-quyen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, roles }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không lưu được vai trò.");
    else setUsers((rows) => rows.map((row) => (row.id === userId ? { ...row, roles, legacy: roles.length === 0 } : row)));
  }

  async function startTwoFactor() {
    const res = await fetch("/api/admin/two-factor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không tạo được mã.");
    else setQr(data.qrSvg || "");
  }

  async function confirmTwoFactor(e: FormEvent<HTMLFormElement>, action: "enable" | "disable") {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") || "");
    const res = await fetch("/api/admin/two-factor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, code }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Mã không đúng.");
    else {
      setEnabled(Boolean(data.enabled));
      setCodes(data.recoveryCodes || []);
    }
  }

  return (
    <div>
      <AdminPageHeader title="Phân quyền" description="Sáu vai trò. Tài khoản quản trị cũ chưa được gán vai trò vẫn giữ toàn quyền và 2FA đang tắt." />
      <p className="mt-3 text-sm">Gán vai trò sẽ thay toàn quyền cũ. Hãy gán Quản trị trước.</p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold">Bảo mật 2 lớp</h2>
        <p className="mt-1 text-sm">{enabled ? "Đang bật" : "Đang tắt"}</p>
        <AdminButton type="button" className="mt-3" onClick={() => void startTwoFactor()}>Tạo mã QR</AdminButton>
        {qr ? <div className="mt-3 max-w-[180px]" dangerouslySetInnerHTML={{ __html: qr }} /> : null}
        <form className="mt-3 flex gap-2" onSubmit={(e) => void confirmTwoFactor(e, enabled ? "disable" : "enable")}>
          <input name="code" inputMode="numeric" placeholder="Mã 6 số" className="rounded border px-2 py-2" />
          <AdminButton type="submit">{enabled ? "Tắt 2FA" : "Bật 2FA"}</AdminButton>
        </form>
        {codes.length ? <p className="mt-3 text-sm">Mã khôi phục (chỉ hiện một lần): {codes.join(" ")}</p> : null}
      </AdminCard>
      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <AdminCard key={user.id}>
            <p className="text-sm font-medium">{user.email}{user.legacy ? " · toàn quyền cũ" : ""}</p>
            <form className="mt-2 flex flex-wrap gap-3 text-sm" onSubmit={(e) => void saveRoles(e, user.id)}>
              {ROLES.map((role) => (
                <label key={role} className="flex items-center gap-1">
                  <input type="checkbox" name="role" value={role} defaultChecked={user.roles.includes(role)} />
                  {ROLE_LABELS[role]}
                </label>
              ))}
              <AdminButton type="submit" size="sm">Lưu vai trò</AdminButton>
            </form>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
