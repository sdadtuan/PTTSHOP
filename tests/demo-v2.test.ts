import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("demo-v2 isolation", () => {
  it("owns a dedicated route and components under demo-v2", () => {
    expect(read("src/app/demo-v2/page.tsx")).toContain("notFound");
    expect(read("src/app/demo-v2/page.tsx")).not.toContain("DemoHero");
    expect(read("next.config.ts")).toContain("poweredByHeader: false");
    expect(read("src/app/demo-v2/layout.tsx")).toContain("robots");
    expect(read("src/app/demo-v2/layout.tsx")).toMatch(/index:\s*false/);
    expect(read("src/components/demo-v2/demo-v2.css")).toContain(".demo-v2");
    expect(read("src/components/demo-v2/demo-v2.css")).toContain("--dv2-orange");
  });

  it("does not alter Version A homepage route content for B chrome", () => {
    const home = read("src/app/page.tsx");
    expect(home).not.toContain("demo-v2");
    expect(home).toContain("HeroShatterCollage");
    expect(home).toContain("Mặc Đơn Giản");
  });

  it("keeps demo-v2 chrome out of shared globals.css", () => {
    const globals = read("src/app/globals.css");
    expect(globals).not.toContain("demo-v2");
    expect(globals).not.toContain("--dv2-");
  });

  it("disallows /demo-v2 in robots and hides A header/footer on that path", () => {
    expect(read("src/app/robots.ts")).toContain('"/demo-v2"');
    expect(read("src/components/layout/header.tsx")).toContain(
      'pathname?.startsWith("/demo-v2")',
    );
    expect(read("src/components/layout/footer.tsx")).toContain(
      'pathname?.startsWith("/demo-v2")',
    );
  });

  it("reuses FloatingSocial on /demo-v2 with scoped B float styles", () => {
    const float = read("src/components/layout/floating-social.tsx");
    expect(float).toContain("FLOATING_SOCIAL_ITEMS");
    expect(float).toContain("isDemoV2");
    expect(float).toContain("dv2-float");
    expect(float).not.toMatch(
      /startsWith\("\/admin"\)\s*\|\|\s*pathname\?\.startsWith\("\/demo-v2"\)/,
    );
    expect(read("src/components/demo-v2/demo-v2.css")).toContain(".dv2-float");
  });

  it("implements A section parity modules for B", () => {
    const files = [
      "src/components/demo-v2/demo-phong-cach.tsx",
      "src/components/demo-v2/demo-diverse.tsx",
      "src/components/demo-v2/demo-style-tabs.tsx",
      "src/components/demo-v2/demo-phoi-mau.tsx",
      "src/components/demo-v2/demo-featured.tsx",
      "src/components/demo-v2/demo-promo.tsx",
      "src/components/demo-v2/demo-reviews.tsx",
    ];
    for (const f of files) {
      expect(read(f).length).toBeGreaterThan(100);
    }
    expect(read("src/components/demo-v2/demo-style-tabs.tsx")).toContain("addItem");
    const phoi = read("src/components/demo-v2/demo-phoi-mau.tsx");
    expect(phoi).toContain("demo-v2-phoi-vertical-label");
    expect(phoi).toContain("demo-v2-phoi-intro");
    expect(phoi).toContain("Xem Gợi Ý Phối Đồ");
    // Single merged section — not two sibling <section> blocks
    expect((phoi.match(/<section/g) || []).length).toBe(1);
    expect(read("src/components/demo-v2/demo-featured.tsx")).not.toContain(
      "featured-glance",
    );
    expect(read("src/components/demo-v2/demo-style-tabs.tsx")).toContain(
      "slice(0, 5)",
    );
  });

  it("exposes ĐÁNH GIÁ nav and #danh-gia reviews (read-only)", () => {
    expect(read("src/lib/cms/layout-defaults.ts")).toContain('label: "ĐÁNH GIÁ"');
    expect(read("src/components/demo-v2/demo-header.tsx")).toContain("useStorefrontLayout");
    expect(read("src/components/demo-v2/demo-reviews.tsx")).toContain('id="danh-gia"');
    expect(read("src/components/demo-v2/demo-reviews.tsx")).toContain(
      "Khách Hàng Nói Gì Về VIZFAS",
    );
    expect(read("src/app/demo-v2/page.tsx")).toContain("notFound");
    expect(read("src/app/page.tsx")).not.toContain("ĐÁNH GIÁ");
  });
});
