"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { MessageCircle, X } from "lucide-react";

type Citation = { source: string; detail: string };
type Turn = { role: "user" | "assistant"; text: string; citations?: Citation[] };

/** Nằm phía trên thanh mua dính và banner cookie, không đè nút đặt hàng. */
export function ChatWidget({ productId }: { productId?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setTurns((current) => [...current, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(sessionId ? { sessionId } : {}),
          message,
          ...(productId ? { contextProductId: productId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không gửi được");
      if (data.sessionId) setSessionId(data.sessionId);
      setTurns((current) => [...current, { role: "assistant", text: data.text || "", citations: data.citations || [] }]);
    } catch (err) {
      setTurns((current) => [...current, { role: "assistant", text: err instanceof Error ? err.message : "Lỗi" }]);
    } finally {
      setBusy(false);
    }
  }

  async function clearChat() {
    if (sessionId) {
      await fetch("/api/chat", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
    }
    setTurns([]);
    setSessionId(null);
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <div
      className="fixed left-3 z-20 lg:bottom-[calc(var(--ptt-cookie-offset,0px)+1rem)] bottom-[calc(var(--ptt-cookie-offset,0px)+7.5rem)]"
      data-testid="chat-widget"
    >
      {open ? (
        <form onSubmit={onSubmit} className="mb-2 w-[min(22rem,calc(100vw-1.5rem))] border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Hỏi PTT Shop</p>
            <button type="button" aria-label="Đóng trợ lý" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
            {turns.length === 0 ? <p className="text-neutral-500">Hỏi giá, tồn, size hoặc đơn hàng. Mình chỉ trả lời theo dữ liệu cửa hàng.</p> : null}
            {turns.map((turn, index) => (
              <p key={`${turn.role}-${index}`} className={turn.role === "user" ? "text-right" : ""}>
                {turn.text}
              </p>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-w-0 flex-1 rounded border border-neutral-200 px-2 py-1 text-sm"
              placeholder="Nhập câu hỏi"
              aria-label="Câu hỏi"
            />
            <button type="submit" disabled={busy} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-60">
              Gửi
            </button>
          </div>
          <button type="button" onClick={() => void clearChat()} className="mt-2 text-xs text-neutral-500 underline">
            Xóa hội thoại
          </button>
        </form>
      ) : null}
      <button
        type="button"
        aria-label={open ? "Thu nhỏ trợ lý" : "Mở trợ lý"}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
