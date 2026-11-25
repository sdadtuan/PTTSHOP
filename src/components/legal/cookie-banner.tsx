"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { COOKIE_CHOICE } from "@/lib/tracking";

function choice() {
  if (typeof document === "undefined") return "";
  const row = document.cookie.split("; ").find((item) => item.startsWith(`${COOKIE_CHOICE}=`));
  return row?.split("=")[1] ?? "";
}

function save(value: "essential" | "all") {
  document.cookie = `${COOKIE_CHOICE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax`;
}

export function CookieBanner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setOpen(choice() === ""));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!open || pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white p-4 shadow-lg md:px-6">
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
              setOpen(false);
            }}
          >
            Chỉ cookie cần thiết
          </button>
          <button
            type="button"
            className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
            onClick={() => {
              save("all");
              setOpen(false);
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
