import { expect, test, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Admin types colour NAMES → hex auto-fills, multi-colour names split into separate
 * colours, unknown names warn; PDP shows one correct dot per colour.
 * TEST product only (slug below); re-runs reuse it.
 */
const SLUG = "test-mau-tu-dong";
const IMG = path.resolve(process.cwd(), "e2e/fixtures/media/test-1.jpg");
const SHOTS = process.env.COLOR_SHOTS_DIR;
const rgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
const EXPECTED = [
  ["Trắng", "#FFFFFF"],
  ["Nâu", "#6B4423"],
  ["Xám", "#8A8A8A"],
  ["Xanh", "#2563EB"],
] as const;

async function adminLogin(page: Page) {
  await page.goto("/api/auth/csrf");
  await page.goto("/dang-nhap?callbackUrl=/admin/products");
  await page.getByLabel(/^Email$/i).fill("admin@vizfas.vn");
  await page.getByLabel(/Mật khẩu/i).fill("admin123");
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL((u) => u.pathname === "/admin" || u.pathname.startsWith("/admin/"), { timeout: 25_000 });
}

async function shot(page: Page, name: string, fullPage = false) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name), fullPage });
}

test.describe.configure({ mode: "serial" });

test.describe("Colour names → correct swatches", () => {
  test("admin: typing names auto-fills hex, splits 'trắng/nâu/xám/xanh', warns on unknown; PDP shows 4 correct dots", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "admin flow once on desktop");
    test.setTimeout(150_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await adminLogin(page);

    const list = await (await page.request.get("/api/admin/products")).json();
    const existing = (list.products || []).find((p: { slug: string }) => p.slug === SLUG);
    if (existing) {
      await page.goto(`/admin/products/${existing.id}`);
      await expect(page.getByTestId("product-editor")).toBeVisible({ timeout: 20_000 });
      while (await page.getByTestId("pe-color-delete").count()) await page.getByTestId("pe-color-delete").first().click();
      await page.getByTestId("pe-add-color").click();
    } else {
      await page.goto("/admin/products/new");
      await expect(page.getByTestId("product-editor")).toBeVisible({ timeout: 20_000 });
      await page.getByTestId("pe-name").fill("TEST Màu tự động");
      await page.getByTestId("pe-slug").fill(SLUG);
      await page.getByTestId("pe-image-files").setInputFiles([IMG]);
      await expect(page.getByTestId("pe-image")).toHaveCount(1, { timeout: 30_000 });
    }

    const cards = page.getByTestId("pe-color");
    await expect(cards).toHaveCount(1);
    const first = cards.first();

    // single names auto-fill the hex while typing
    await first.getByTestId("pe-color-name").fill("xanh rêu");
    await expect(first.getByTestId("pe-color-hex")).toHaveValue("#4B5D3A");
    await first.getByTestId("pe-color-name").fill("Hồng Pastel");
    await expect(first.getByTestId("pe-color-hex")).toHaveValue("#F8C8D4");
    await first.getByTestId("pe-color-name").fill("#A0522D");
    await expect(first.getByTestId("pe-color-hex")).toHaveValue("#A0522D");

    // unknown → warning, not black
    await first.getByTestId("pe-color-name").fill("abcxyz");
    await expect(first.getByTestId("pe-color-unknown")).toBeVisible();
    await expect(first.getByTestId("pe-color-hex")).not.toHaveValue("#111111");

    // several colours in one field → ask → split into 4 separate colours
    await first.getByTestId("pe-color-name").fill("trắng/nâu/xám/xanh");
    await expect(first.getByTestId("pe-color-split-banner")).toBeVisible();
    const rows = first.getByTestId("pe-size-row");
    for (const [i, stock] of [8, 4, 4].entries()) {
      await rows.nth(i).getByTestId("pe-price").fill("399000");
      await rows.nth(i).getByTestId("pe-stock").fill(String(stock));
    }
    await shot(page, "01-admin-hoi-tach-mau.png");
    await first.getByTestId("pe-color-split").click();
    await expect(cards).toHaveCount(4);
    for (const [i, [name, hex]] of EXPECTED.entries()) {
      await expect(cards.nth(i).getByTestId("pe-color-name")).toHaveValue(name);
      await expect(cards.nth(i).getByTestId("pe-color-hex")).toHaveValue(hex);
      await expect(cards.nth(i).getByTestId("pe-size-row")).toHaveCount(3);
    }
    // stock divided, not multiplied: S 8 → 2 each
    const sStocks = await cards.locator('[data-testid="pe-size-row"][data-size="S"] [data-testid="pe-stock"]').evaluateAll((els) => els.map((e) => Number((e as HTMLInputElement).value)));
    expect(sStocks.reduce((a, b) => a + b, 0)).toBe(8);
    // colour picker still overrides the auto value
    await cards.nth(3).getByTestId("pe-color-hex").fill("#1E5AA8");
    await cards.nth(3).getByTestId("pe-color-name").fill("Xanh dương");
    await expect(cards.nth(3).getByTestId("pe-color-hex")).toHaveValue("#1E5AA8");
    await cards.nth(3).getByTestId("pe-color-name").fill("Xanh");
    await shot(page, "02-admin-tu-dong-ma-mau.png", true);

    await page.getByTestId("pe-save").click();
    await expect(page.getByTestId("pe-error")).toHaveCount(0);
    await page.waitForURL(/\/admin\/products\/(?!new)[^/]+$/, { timeout: 30_000 });
    await page.reload();
    await expect(page.getByTestId("pe-color")).toHaveCount(4, { timeout: 20_000 });

    // PDP: 4 dots with the right colours
    await page.goto(`/san-pham/${SLUG}`);
    const dots = page.getByTestId("pdp-color-dot");
    await expect(dots).toHaveCount(4);
    const want: [string, string][] = [["Trắng", "#FFFFFF"], ["Nâu", "#6B4423"], ["Xám", "#8A8A8A"], ["Xanh", "#1E5AA8"]];
    for (const [name, hex] of want) {
      const dot = page.locator(`[data-testid="pdp-color-dot"][data-color="${name}"]`);
      await expect(dot.locator("span")).toHaveCSS("background-color", rgb(hex));
    }
    await shot(page, "03-pdp-test-4-cham-mau.png");
  });

  test("Hoodie Brown Layer Club (was 'trắng/nâu/xám/xanh' + black dot) shows 4 correct dots", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "desktop");
    await page.setViewportSize({ width: 1280, height: 900 });
    const res = await page.goto("/san-pham/ao-hoodie-brown-layer-club");
    test.skip(res?.status() === 404, "product not present");
    const dots = page.getByTestId("pdp-color-dot");
    await expect(dots).toHaveCount(4);
    for (const [name, hex] of EXPECTED) {
      await expect(page.locator(`[data-testid="pdp-color-dot"][data-color="${name}"] span`)).toHaveCSS("background-color", rgb(hex));
    }
    // no dot is the old default black
    const bgs = await dots.locator("span").evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor));
    expect(bgs).not.toContain("rgb(17, 17, 17)");
    await shot(page, "04-pdp-hoodie-brown-layer-club-4-mau.png");
  });
});
