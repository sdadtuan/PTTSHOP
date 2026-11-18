import { expect, test, type Page } from "@playwright/test";

/**
 * Responsive audit: no horizontal page overflow and no element sticking out of the
 * viewport (unless it sits inside its own scroll/clip container, e.g. a table wrapper)
 * on storefront, cart/checkout and admin pages, from 320px phones to 1440px desktops.
 * Chromium project: explicit viewport list. Device projects (iPhone 13 on Chromium + real WebKit,
 * Pixel 7, iPad gen 7 portrait/landscape): each device's own size, UA and touch.
 */
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

const PUBLIC = ["/", "/san-pham", "/san-pham?q=hoodie", "/san-pham/ao-hoodie-brown-layer-club", "/bo-suu-tap", "/gio-hang", "/thanh-toan", "/dang-nhap"];
const ADMIN = ["/admin", "/admin/products", "/admin/products/new", "EDIT", "/admin/orders", "/admin/banners", "/admin/giao-dien", "/admin/customers", "/admin/coupons"];

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function overflowReport(page: Page) {
  // Compare with the configured viewport, not innerWidth: mobile WebKit widens the layout
  // viewport to fit overflowing content, which would hide the overflow.
  const vw = page.viewportSize()?.width ?? 0;
  return page.evaluate((vw) => {
    const doc = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth) - vw;
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (["auto", "scroll", "hidden", "clip"].includes(s.overflowX)) {
          const r = p.getBoundingClientRect();
          if (r.right <= vw + 1 && r.left >= -1) return true;
        }
      }
      return false;
    };
    const out: string[] = [];
    for (const el of document.body.querySelectorAll("*")) {
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) {
        out.push(`${el.tagName.toLowerCase()}.${(el.getAttribute("class") || "").split(" ").slice(0, 3).join(".")} [${Math.round(r.left)}..${Math.round(r.right)}]`);
        if (out.length > 5) break;
      }
    }
    return { doc, out };
  }, vw);
}

async function adminLogin(page: Page) {
  await page.goto("/api/auth/csrf");
  await page.goto("/dang-nhap?callbackUrl=/admin");
  await page.getByLabel(/^Email$/i).fill("admin@vizfas.vn");
  await page.getByLabel(/Mật khẩu/i).fill("admin123");
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/admin"), { timeout: 25_000 });
}

async function auditAll(page: Page, label: string) {
  // put something in the cart so /gio-hang and /thanh-toan render their full layout
  await page.goto("/san-pham/ao-hoodie-essential");
  const added = page.waitForResponse((r) => r.url().endsWith("/api/cart") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Thêm vào giỏ hàng/i }).click();
  await expect(page.getByRole("button", { name: /Đã thêm/i })).toBeVisible();
  await added;
  const problems: string[] = [];
  for (const url of PUBLIC) {
    await page.goto(url);
    await settle(page);
    const r = await overflowReport(page);
    if (r.doc > 1 || r.out.length) problems.push(`${label} ${url}: doc+${r.doc} ${r.out.join(" | ")}`);
  }
  await adminLogin(page);
  const list = await (await page.request.get("/api/admin/products")).json();
  const editId = (list.products || []).find((p: { slug: string }) => p.slug === "ao-hoodie-brown-layer-club")?.id ?? list.products?.[0]?.id;
  for (const raw of ADMIN) {
    const url = raw === "EDIT" ? `/admin/products/${editId}` : raw;
    await page.goto(url);
    await settle(page);
    const r = await overflowReport(page);
    if (r.doc > 1 || r.out.length) problems.push(`${label} ${url}: doc+${r.doc} ${r.out.join(" | ")}`);
  }
  expect(problems, problems.join("\n")).toEqual([]);
}

test.describe("Responsive: no horizontal overflow", () => {
  for (const vp of VIEWPORTS) {
    test(`chromium ${vp.width}x${vp.height}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium", "explicit viewports on chromium");
      test.setTimeout(240_000);
      await page.setViewportSize(vp);
      await auditAll(page, `${vp.width}x${vp.height}`);
    });
  }

  test("device emulation (mobile / webkit-iphone / pixel / ipad projects)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium", "device projects only");
    test.setTimeout(240_000);
    await auditAll(page, testInfo.project.name);
  });
});
