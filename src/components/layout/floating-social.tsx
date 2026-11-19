"use client";

import { MessageCircle, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Shared contact destinations — Version A + demo-v2 reuse the same links. */
export const FLOATING_SOCIAL_ITEMS = [
  {
    href: "https://facebook.com",
    label: "Facebook",
    className: "bg-[#1877F2] text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
      </svg>
    ),
  },
  {
    href: "https://m.me/vizfas",
    label: "Messenger",
    className: "bg-[#0084FF] text-white",
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    href: "https://zalo.me/0901234567",
    label: "Zalo",
    className: "bg-[#0068FF] text-white",
    icon: <span className="text-[10px] font-bold tracking-tight">Zalo</span>,
  },
  {
    href: "tel:0901234567",
    label: "Gọi điện",
    className: "bg-[var(--accent)] text-white",
    icon: <Phone className="h-4 w-4" />,
  },
] as const;

export function FloatingSocial() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const isDemoV2 = pathname?.startsWith("/demo-v2");

  return (
    <div
      data-testid="floating-social"
      data-demo-v2={isDemoV2 ? "true" : "false"}
      className={cn(
        "pointer-events-none fixed z-40 flex-col gap-2",
        // Version A: desktop-only stack (unchanged breakpoint)
        !isDemoV2 &&
          "top-1/2 right-3 hidden -translate-y-1/2 md:right-4 lg:flex",
        // Version B: fixed right on desktop + mobile; scoped via .dv2-float
        isDemoV2 && "dv2-float flex",
      )}
      aria-label="Liên hệ nhanh"
    >
      {FLOATING_SOCIAL_ITEMS.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target={item.href.startsWith("tel:") ? undefined : "_blank"}
          rel={item.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
          aria-label={item.label}
          className={cn(
            "pointer-events-auto flex items-center justify-center rounded-full shadow-md transition hover:scale-105",
            isDemoV2 ? "dv2-float__btn h-10 w-10 md:h-11 md:w-11" : "h-11 w-11",
            item.className,
          )}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
