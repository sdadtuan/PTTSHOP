import type { CSSProperties } from "react";
import { z } from "zod";

export const LOGO_HEIGHT_MIN = 16;
export const LOGO_HEIGHT_MAX = 160;
export const LOGO_MAX_WIDTH_MIN = 0;
export const LOGO_MAX_WIDTH_MAX = 520;

/** maxWidthPx = 0 → không giới hạn (w-auto, giữ tỷ lệ). */
export type LogoSlotSize = {
  heightPx: number;
  maxWidthPx: number;
};

export type LogoSlotResponsive = {
  mobile: LogoSlotSize;
  desktop: LogoSlotSize;
};

export type LogoLayoutSettings = {
  header: LogoSlotResponsive;
  footer: LogoSlotResponsive;
};

export const DEFAULT_LOGO_LAYOUT: LogoLayoutSettings = {
  header: {
    mobile: { heightPx: 32, maxWidthPx: 0 },
    desktop: { heightPx: 40, maxWidthPx: 0 },
  },
  footer: {
    mobile: { heightPx: 40, maxWidthPx: 40 },
    desktop: { heightPx: 56, maxWidthPx: 56 },
  },
};

const slotSchema = z.object({
  heightPx: z.number().int().min(LOGO_HEIGHT_MIN).max(LOGO_HEIGHT_MAX),
  maxWidthPx: z.number().int().min(LOGO_MAX_WIDTH_MIN).max(LOGO_MAX_WIDTH_MAX),
});

const responsiveSchema = z.object({
  mobile: slotSchema,
  desktop: slotSchema,
});

export const logoLayoutSchema = z.object({
  header: responsiveSchema,
  footer: responsiveSchema,
});

export function parseLogoLayout(raw: unknown): LogoLayoutSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_LOGO_LAYOUT;
  const o = raw as Partial<LogoLayoutSettings>;
  const merged: LogoLayoutSettings = {
    header: {
      mobile: { ...DEFAULT_LOGO_LAYOUT.header.mobile, ...o.header?.mobile },
      desktop: { ...DEFAULT_LOGO_LAYOUT.header.desktop, ...o.header?.desktop },
    },
    footer: {
      mobile: { ...DEFAULT_LOGO_LAYOUT.footer.mobile, ...o.footer?.mobile },
      desktop: { ...DEFAULT_LOGO_LAYOUT.footer.desktop, ...o.footer?.desktop },
    },
  };
  const parsed = logoLayoutSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_LOGO_LAYOUT;
}

export function parseLogoLayoutJson(json: string | null | undefined): LogoLayoutSettings {
  if (!json?.trim()) return DEFAULT_LOGO_LAYOUT;
  try {
    return parseLogoLayout(JSON.parse(json));
  } catch {
    return DEFAULT_LOGO_LAYOUT;
  }
}

export function clampLogoSlot(slot: LogoSlotSize): LogoSlotSize {
  return {
    heightPx: Math.min(LOGO_HEIGHT_MAX, Math.max(LOGO_HEIGHT_MIN, Math.round(slot.heightPx))),
    maxWidthPx: Math.min(LOGO_MAX_WIDTH_MAX, Math.max(LOGO_MAX_WIDTH_MIN, Math.round(slot.maxWidthPx))),
  };
}

export function logoImgStyle(slot: LogoSlotSize): CSSProperties {
  const s = clampLogoSlot(slot);
  const style: CSSProperties = {
    height: s.heightPx,
    width: "auto",
    maxHeight: s.heightPx,
    objectFit: "contain",
  };
  if (s.maxWidthPx > 0) style.maxWidth = s.maxWidthPx;
  return style;
}