"use client";

import { FormEvent, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, useAdminToast } from "@/components/admin/ui";

export default function ChatAdminPage() {
  const { toast } = useAdminToast();
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<"" | "mock">("");
  const [sessionTokenBudget, setSessionTokenBudget] = useState("");
  const [dailyTokenBudget, setDailyTokenBudget] = useState("");

  async function load() {
    const res = await fetch("/api/admin/chat-settings");
    const data = await res.json();
    if (!res.ok) {
      toast("Không tải được cấu hình trợ lý");
      return;
    }
    setEnabled(data.enabled === true);
    setProvider(data.provider === "mock" ? "mock" : "");
    setSessionTokenBudget(data.sessionTokenBudget == null ? "" : String(data.sessionTokenBudget));
    setDailyTokenBudget(data.dailyTokenBudget == null ? "" : String(data.dailyTokenBudget));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/chat-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        provider,
        sessionTokenBudget: sessionTokenBudget.trim() ? Number(sessionTokenBudget) : null,
        dailyTokenBudget: dailyTokenBudget.trim() ? Number(dailyTokenBudget) : null,
      }),
    });
    if (!res.ok) {
      toast("Không lưu được");
      return;
    }
    toast("Đã lưu. Provider mock mới hiện widget; để trống thì ẩn.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminPageHeader title="Trợ lý" description="Mặc định tắt. Chỉ provider mock mới hiện widget. Không lưu khóa LLM." />
      <AdminCard className="space-y-3">
        <AdminButton type="button" onClick={() => void load()}>Tải cấu hình hiện tại</AdminButton>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Bật trợ lý
        </label>
        <label className="block text-sm">
          Provider
          <select value={provider} onChange={(event) => setProvider(event.target.value === "mock" ? "mock" : "")} className="mt-1 block rounded border border-neutral-200 px-2 py-1">
            <option value="">Tắt (ẩn widget)</option>
            <option value="mock">Mock, không gọi LLM</option>
          </select>
        </label>
        <label className="block text-sm">
          Trần token mỗi phiên
          <input value={sessionTokenBudget} onChange={(event) => setSessionTokenBudget(event.target.value)} placeholder="Trống = trần an toàn" className="mt-1 block rounded border border-neutral-200 px-2 py-1" />
        </label>
        <label className="block text-sm">
          Trần token mỗi ngày
          <input value={dailyTokenBudget} onChange={(event) => setDailyTokenBudget(event.target.value)} placeholder="Trống = trần an toàn" className="mt-1 block rounded border border-neutral-200 px-2 py-1" />
        </label>
        <AdminButton type="submit">Lưu</AdminButton>
      </AdminCard>
    </form>
  );
}
