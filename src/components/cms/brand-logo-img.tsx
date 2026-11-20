"use client";

import type { LogoLayoutSettings } from "@/lib/cms/logo-layout";
import { DEFAULT_LOGO_LAYOUT, logoImgStyle } from "@/lib/cms/logo-layout";
import { cn } from "@/lib/utils";

type Slot = keyof LogoLayoutSettings;

export function BrandLogoImg({
  src,
  alt,
  slot,
  layout = DEFAULT_LOGO_LAYOUT,
  className,
}: {
  src: string;
  alt: string;
  slot: Slot;
  layout?: LogoLayoutSettings;
  className?: string;
}) {
  const mobile = layout[slot].mobile;
  const desktop = layout[slot].desktop;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn("object-contain md:hidden", className)}
        style={logoImgStyle(mobile)}
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
