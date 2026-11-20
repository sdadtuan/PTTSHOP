import { describe, expect, it } from "vitest";
import { DEFAULT_LOGO_LAYOUT, parseLogoLayout } from "@/lib/cms/logo-layout";
import { siteSettingsSchema } from "@/lib/cms/validate";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms/types";

describe("logo layout", () => {
  it("defaults match current header/footer Tailwind sizes", () => {
    expect(DEFAULT_LOGO_LAYOUT.header.mobile.heightPx).toBe(32);
    expect(DEFAULT_LOGO_LAYOUT.header.desktop.heightPx).toBe(40);
    expect(DEFAULT_LOGO_LAYOUT.footer.mobile.heightPx).toBe(40);
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