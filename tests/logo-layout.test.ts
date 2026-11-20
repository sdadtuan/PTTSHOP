import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOGO_LAYOUT,
  LEGACY_FOOTER_LOGO_LAYOUT,
  applyLogoLayoutDefaults,
  parseLogoLayout,
} from "@/lib/cms/logo-layout";
import { siteSettingsSchema } from "@/lib/cms/validate";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms/types";

describe("logo layout", () => {
  it("defaults match current header/footer Tailwind sizes", () => {
    expect(DEFAULT_LOGO_LAYOUT.header.mobile.heightPx).toBe(32);
    expect(DEFAULT_LOGO_LAYOUT.header.desktop.heightPx).toBe(40);
    expect(DEFAULT_LOGO_LAYOUT.footer.mobile.heightPx).toBe(56);
    expect(DEFAULT_LOGO_LAYOUT.footer.desktop.heightPx).toBe(72);
    expect(DEFAULT_LOGO_LAYOUT.footerShowBrandName).toBe(false);
  });

  it("nâng footer legacy 40/56 lên default mới, giữ chỉnh tay khác legacy", () => {
    const legacy: typeof DEFAULT_LOGO_LAYOUT = {
      ...DEFAULT_LOGO_LAYOUT,
      footer: LEGACY_FOOTER_LOGO_LAYOUT,
    };
    expect(applyLogoLayoutDefaults(legacy).footer).toEqual(DEFAULT_LOGO_LAYOUT.footer);
    const custom = {
      ...DEFAULT_LOGO_LAYOUT,
      footer: { mobile: { heightPx: 48, maxWidthPx: 120 }, desktop: { heightPx: 64, maxWidthPx: 0 } },
    };
    expect(applyLogoLayoutDefaults(custom).footer).toEqual(custom.footer);
  });

  it("site settings without logoLayout get defaults", () => {
    const { logoLayout: _, ...rest } = DEFAULT_SITE_SETTINGS;
    const parsed = siteSettingsSchema.parse(rest);
    expect(parsed.logoLayout).toEqual(DEFAULT_LOGO_LAYOUT);
  });

  it("rejects invalid values and keeps defaults", () => {
    const layout = parseLogoLayout({
      header: { mobile: { heightPx: 999, maxWidthPx: -5 }, desktop: { heightPx: 40, maxWidthPx: 0 } },
      footer: DEFAULT_LOGO_LAYOUT.footer,
    });
    expect(layout.header.mobile.heightPx).toBe(DEFAULT_LOGO_LAYOUT.header.mobile.heightPx);
  });
});