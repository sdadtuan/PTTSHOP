"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { COOKIE_CHOICE } from "@/lib/tracking";

function choice() {
  if (typeof document === "undefined") return "";
  const row = document.cookie.split("; ").find((item) => item.startsWith(`${COOKIE_CHOICE}=`));
  return row?.split("=")[1] ?? "";
}

function save(value: "essential" | "all") {
  document.cookie = `${COOKIE_CHOICE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax`;
}

function needsChoice() {
  return choice() === "";
}

export function CookieBanner() {
  const pathname = usePathname();
  const unanswered = useSyncExternalStore(() => () => {}, needsChoice, () => false);
  const [hidden, setHidden] = useState(false);

  if (!unanswered || hidden || pathname?.startsWith("/admin")) return null;

  return (
    <div
      className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] md:px-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-neutral-700">
          Website dùng cookie cần thiết cho đăng nhập và giỏ hàng. Cookie đo lường chỉ chạy khi bạn đồng ý.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
            onClick={() => {
              save("essential");
              setHidden(true);
            }}
          >
            Chỉ cookie cần thiết
          </button>
          <button
            type="button"
            className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
            onClick={() => {
              save("all");
              setHidden(true);
              window.dispatchEvent(new Event("pttshop-consent"));
            }}
          >
            Đồng ý tất cả
          </button>
        </div>
      </div>
    </div>
  );
}
