"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(100%-2rem,360px)] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start justify-between gap-3 rounded-[var(--admin-radius-md)] border px-4 py-3 text-sm shadow-[var(--admin-shadow-md)]",
              item.tone === "success" &&
                "border-green-200 bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
              item.tone === "error" &&
                "border-red-200 bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
              item.tone === "info" &&
                "border-blue-200 bg-[var(--admin-info-soft)] text-[var(--admin-info)]",
            )}
          >
            <span>{item.message}</span>
            <button
              type="button"
              className="rounded p-0.5 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30"
              aria-label="Đóng thông báo"
              onClick={() =>
                setItems((prev) => prev.filter((t) => t.id !== item.id))
              }
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (message: string) => {
        if (typeof window !== "undefined") window.alert(message);
      },
    };
  }
  return ctx;
}
