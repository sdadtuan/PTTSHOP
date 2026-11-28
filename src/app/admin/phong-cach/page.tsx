"use client";

import { useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

export default function QuizAdminPage() {
  const { toast } = useAdminToast();
  const [enabled, setEnabled] = useState(false);
  const [summary, setSummary] = useState("Chưa tải");

  async function load() {
    const res = await fetch("/api/admin/quiz");
    const data = await res.json();
    if (!res.ok) {
      toast("Không tải được quiz");
      return;
    }
    setEnabled(data.enabled === true);
    setSummary(`${data.questions?.length || 0} câu, ${data.enabled ? "đang bật" : "đang tắt"}`);
  }

  async function install() {
    const res = await fetch("/api/admin/quiz", { method: "POST" });
    toast(res.ok ? "Đã tạo bộ câu mặc định, vẫn tắt." : "Không tạo được");
    if (res.ok) void load();
  }

  async function save(next: boolean) {
    const current = await fetch("/api/admin/quiz").then((res) => res.json());
    const res = await fetch("/api/admin/quiz", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next, questions: current.questions || [] }),
    });
    toast(res.ok ? "Đã lưu" : "Không lưu được");
    if (res.ok) setEnabled(next);
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Quiz phong cách" description="Bộ mặc định đang tắt. Không hỏi tuổi hay cân nặng. Chưa bật thì khách không thấy trang." />
      <AdminButton type="button" onClick={() => void load()}>Tải cấu hình</AdminButton>
      <AdminCard>
        <p className="text-sm">{summary}</p>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Bật quiz
        </label>
        <div className="mt-3 flex gap-2">
          <AdminButton type="button" onClick={() => void install()}>Tạo bộ câu mặc định</AdminButton>
          <AdminButton type="button" onClick={() => void save(enabled)}>Lưu bật/tắt</AdminButton>
        </div>
      </AdminCard>
    </div>
  );
}
