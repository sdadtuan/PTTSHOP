"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui";

type Job = { id: string; dedupKey: string; status: string; retryCount: number; lastError: string | null };
type Template = { key: string; subject: string; audience: string };
type Message = { id: string; templateKey: string; toAddress: string; subject: string; body: string; status: string };

export default function AdminNoticePage() {
  const [crmProvider, setCrmProvider] = useState("DISABLED");
  const [emailProvider, setEmailProvider] = useState("DISABLED");
  const [crmBlock, setCrmBlock] = useState<string | null>(null);
  const [emailBlock, setEmailBlock] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [outbox, setOutbox] = useState<Message[]>([]);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetch("/api/admin/crm").then((res) => res.json()), fetch("/api/admin/emails").then((res) => res.json())])
      .then(([crm, email]) => {
        if (cancelled) return;
        setCrmProvider(crm.provider || "DISABLED");
        setCrmBlock(crm.blockReason || null);
        setJobs(crm.jobs || []);
        setEmailProvider(email.provider || "DISABLED");
        setEmailBlock(email.blockReason || null);
        setTemplates(email.templates || []);
        setOutbox(email.outbox || []);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được CRM và email.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveCrm(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "settings", provider: crmProvider }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không lưu được CRM.");
    else setCrmBlock(data.blockReason || null);
  }

  async function retry(jobId: string) {
    const res = await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry", jobId }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Không thử lại được.");
    else setJobs((rows) => rows.map((row) => (row.id === jobId ? data.job : row)));
  }

  return (
    <div>
      <AdminPageHeader title="CRM & Thông báo" description="Mặc định tắt. Thiếu cấu hình môi trường thì không gọi CRM và không gửi email thật." />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold">Đồng bộ CRM rs.pttads.vn</h2>
        {crmProvider === "DISABLED" || crmBlock ? (
          <p className="mt-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {crmBlock || "CRM đang tắt. Chưa có tài liệu API rs.pttads.vn nên không gọi mạng."}
          </p>
        ) : null}
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => void saveCrm(e)}>
          <label className="text-sm">Trạng thái
            <select value={crmProvider} onChange={(e) => setCrmProvider(e.target.value)} className="mt-1 block rounded border px-2 py-2">
              <option value="DISABLED">Tắt</option>
              <option value="SANDBOX_MOCK">Giả lập</option>
              <option value="RS_PTTADS">rs.pttads.vn</option>
            </select>
          </label>
          <AdminButton type="submit">Lưu CRM</AdminButton>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {jobs.length === 0 ? <li>Hàng đợi CRM trống.</li> : null}
          {jobs.map((job) => (
            <li key={job.id} className="rounded border p-3">
              <p>{job.dedupKey} · {job.status} · thử {job.retryCount}</p>
              {job.lastError ? <p className="text-red-600">{job.lastError}</p> : null}
              <AdminButton type="button" size="sm" className="mt-2" onClick={() => void retry(job.id)}>Thử lại</AdminButton>
            </li>
          ))}
        </ul>
      </AdminCard>
      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold">Email</h2>
        {emailProvider === "DISABLED" || emailBlock ? (
          <p className="mt-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {emailBlock || "Email đang tắt. Thư được ghi vào hộp thư đi với trạng thái bỏ qua, không gửi thật."}
          </p>
        ) : null}
        <p className="mt-2 text-sm">Nhà cung cấp: {emailProvider}</p>
        <h3 className="mt-4 text-sm font-semibold">Mẫu</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {templates.map((row) => <li key={row.key}>{row.audience} · {row.key} · {row.subject}</li>)}
        </ul>
        <h3 className="mt-4 text-sm font-semibold">Hộp thư đi</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {outbox.length === 0 ? <li>Chưa có thư.</li> : null}
          {outbox.map((row) => (
            <li key={row.id} className="rounded border p-3">
              <p>{row.templateKey} → {row.toAddress} · {row.status}</p>
              <p>{row.subject}</p>
              <AdminButton type="button" size="sm" className="mt-2" variant="secondary" onClick={() => setPreview(row.body)}>Xem trước</AdminButton>
            </li>
          ))}
        </ul>
        {preview ? <pre className="mt-3 whitespace-pre-wrap rounded bg-neutral-50 p-3 text-sm">{preview}</pre> : null}
      </AdminCard>
    </div>
  );
}
