"use client";

import { MessageCircle, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useStorefrontLayout } from "@/components/cms/storefront-layout-context";
import { defaultSectionContent, type FloatingContactContent } from "@/lib/cms/types";
import { cn } from "@/lib/utils";
import { visibleHref } from "@/lib/public-brand";

const defaults = (defaultSectionContent("floating_contact") as FloatingContactContent).items;

/** Default destinations — used in tests and when CMS is empty. */
export const FLOATING_SOCIAL_ITEMS = defaults;

function FloatingIcon({ preset }: { preset: string }) {
  if (preset === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
      </svg>
    );
  }
  if (preset === "messenger") return <MessageCircle className="h-4 w-4" />;
  if (preset === "zalo") {
    return <span className="text-[10px] font-bold tracking-tight">Zalo</span>;
  }
  if (preset === "phone") return <Phone className="h-4 w-4" />;
  return <span className="text-[9px] font-bold uppercase">{preset.slice(0, 4)}</span>;
}

const STYLE: Record<string, string> = {
  facebook: "bg-[#1877F2] text-white",
  messenger: "bg-[#0084FF] text-white",
  zalo: "bg-[#0068FF] text-white",
  phone: "bg-[var(--accent)] text-white",
  instagram: "bg-neutral-900 text-white",
  custom: "bg-neutral-800 text-white",
};

export function FloatingSocial() {
  const pathname = usePathname();
  const { floatingContact } = useStorefrontLayout();
  if (pathname?.startsWith("/admin")) return null;

  const isDemoV2 = pathname?.startsWith("/demo-v2");
  const items = (floatingContact.items.length ? floatingContact.items : defaults).filter(
    (item) => visibleHref(item.href),
  );
  if (items.length === 0) return null;

  return (
    <div
      data-testid="floating-social"
      data-demo-v2={isDemoV2 ? "true" : "false"}
      className={cn(
        "pointer-events-none fixed z-40 flex-col gap-2",
        !isDemoV2 &&
          "top-1/2 right-3 hidden -translate-y-1/2 md:right-4 lg:flex",
        isDemoV2 && "dv2-float flex",
      )}
      aria-label="Liên hệ nhanh"
    >
      {items.map((item) => (
        <a
          key={item.label + item.href}
          href={item.href}
          target={item.href.startsWith("tel:") ? undefined : "_blank"}
          rel={item.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
          aria-label={item.label}
          className={cn(
            "pointer-events-auto flex items-center justify-center rounded-full shadow-md transition hover:scale-105",
            isDemoV2 ? "dv2-float__btn h-10 w-10 md:h-11 md:w-11" : "h-11 w-11",
            STYLE[item.preset] ?? STYLE.custom,
          )}
        >
          <FloatingIcon preset={item.preset} />
        </a>
      ))}
    </div>
  );
}