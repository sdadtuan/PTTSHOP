"use client";

import type { LogoLayoutSettings } from "@/lib/cms/logo-layout";
import { DEFAULT_LOGO_LAYOUT, logoImgStyle } from "@/lib/cms/logo-layout";
import { cn } from "@/lib/utils";

type LogoImageSlot = "header" | "footer";

export function BrandLogoImg({
  src,
  alt,
  slot,
  layout = DEFAULT_LOGO_LAYOUT,
  className,
}: {
  src: string;
  alt: string;
  slot: LogoImageSlot;
  layout?: LogoLayoutSettings;
  className?: string;
}) {
  const slotLayout = layout[slot];
  const mobile = slotLayout.mobile;
  const desktop = slotLayout.desktop;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn("object-contain md:hidden", className)}
        style={logoImgStyle(mobile, slot === "header" ? { ignoreMaxWidth: true } : undefined)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn("hidden object-contain md:block", className)}
        style={logoImgStyle(desktop)}
      />
    </>
  );
}
