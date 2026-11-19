import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("demo-v2 isolation", () => {
  it("owns a dedicated route and components under demo-v2", () => {
    expect(read("src/app/demo-v2/page.tsx")).toContain("DemoHero");
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
});
