import { e2eAdmin } from "./accounts";
import { expect, test, type Page } from "@playwright/test";

/** Real usage on a phone-sized screen: menu, PDP gallery/video/colour/size, cart, checkout form, admin. */
async function useMobile(page: Page, projectName: string) {
  if (projectName === "chromium") await page.setViewportSize({ width: 390, height: 844 });
  test.skip(/^ipad/.test(projectName), "phone flows; iPad covered by the overflow audit");
}

test.describe("Mobile flows", () => {
  test("menu, PDP gallery + video + colour/size, cart qty, checkout form (no order placed)", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await useMobile(page, testInfo.project.name);
    await page.goto("/");
    await page.getByRole("button", { name: "Mở menu" }).click();
    const mobileNav = page.locator("header nav").last();
    await expect(mobileNav.getByRole("link").first()).toBeVisible();
    await mobileNav.getByRole("link", { name: /Sản phẩm/i }).first().click();
    await expect(page).toHaveURL(/\/san-pham/);

    await page.goto("/san-pham/ao-hoodie-brown-layer-club");
    const strip = page.getByTestId("gallery-thumbs-mobile");
    await expect(strip).toBeVisible();
    await expect(page.getByTestId("pdp-product-video")).toBeVisible();
    const imgThumb = strip.getByTestId("gallery-thumb-image").first();
    await imgThumb.click();
    await expect(page.getByTestId("gallery-main")).toHaveAttribute("data-current-type", "image");
    await strip.getByTestId("gallery-thumb-video").click();
    await expect(page.getByTestId("pdp-product-video")).toBeVisible();
    const dots = page.getByTestId("pdp-color-dot");
    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveAttribute("aria-pressed", "true");
    const size = page.locator('[data-testid="pdp-size"]:not([disabled])').last();
    await size.click();
    await expect(size).toHaveAttribute("aria-pressed", "true");

    await page.goto("/san-pham/ao-hoodie-essential");
    const added = page.waitForResponse((r) => r.url().endsWith("/api/cart") && r.request().method() === "POST");
    await page.getByRole("button", { name: /Thêm vào giỏ hàng/i }).click();
    await expect(page.getByRole("button", { name: /Đã thêm/i })).toBeVisible();
    await added;
    await page.goto("/gio-hang");
    const qty = page.locator("main li").first();
    await expect(qty).toBeVisible();
    const before = Number((await qty.locator("span.min-w-7").textContent()) || "0");
    await qty.getByRole("button").filter({ has: page.locator("svg.lucide-plus") }).click();
    await expect(qty.locator("span.min-w-7")).toHaveText(String(before + 1));
    await page.getByRole("link", { name: /^Thanh toán$/ }).click();
    await expect(page).toHaveURL(/\/thanh-toan/);
    const inputs = page.locator("form input:not([type=radio]):not([type=checkbox])");
    await inputs.first().fill("Khách Test Responsive");
    await expect(page.getByRole("button", { name: /Đặt hàng/i })).toBeVisible();
    // do NOT submit: no real order
    const vpw = page.viewportSize()?.width ?? 390;
    const overflow = await page.evaluate((w) => Math.max(document.documentElement.scrollWidth, window.innerWidth) - w, vpw);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("admin on phone: sidebar menu, product editor save, CMS save draft", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await useMobile(page, testInfo.project.name);
    await page.goto("/api/auth/csrf");
    await page.goto("/dang-nhap?callbackUrl=/admin");
    await page.getByLabel(/^Email$/i).fill(e2eAdmin().email);
    await page.getByLabel(/Mật khẩu/i).fill(e2eAdmin().password);
    await page.getByRole("button", { name: /Đăng nhập/i }).click();
    await page.waitForURL((u) => u.pathname.startsWith("/admin"), { timeout: 25_000 });

    await page.getByRole("button", { name: /Mở menu/i }).click();
    const nav = page.getByRole("navigation", { name: /Menu quản trị/i });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: /Sản phẩm/i }).click();
    await expect(page.getByRole("heading", { name: /^Sản phẩm$/ })).toBeVisible();

    // edit the TEST product only (no real product data changed), save unchanged
    const list = await (await page.request.get("/api/admin/products")).json();
    const test1 = (list.products || []).find((p: { slug: string }) => p.slug === "test-mau-tu-dong");
    test.skip(!test1, "no TEST product available");
    await page.goto(`/admin/products/${test1.id}`);
    await expect(page.getByTestId("product-editor")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("pe-size-table-scroll").first()).toBeVisible();
    await page.getByTestId("pe-save").click();
    await expect(page.getByTestId("pe-error")).toHaveCount(0);
    await expect(page.getByText(/Đã lưu sản phẩm|Đã lưu\./).first()).toBeVisible({ timeout: 15_000 });

    await page.goto("/admin/giao-dien");
    await expect(page.getByTestId("admin-giao-dien")).toBeVisible({ timeout: 20_000 });
    const preview = page.getByTestId("admin-preview-desktop");
    const box = await preview.boundingBox();
    expect(box && box.x + box.width).toBeLessThanOrEqual((page.viewportSize()?.width ?? 390) + 1);
    const save = page.getByTestId("cms-save-draft");
    if (await save.isEnabled()) {
      await save.click();
      await expect(page.getByText(/Đã lưu nháp|Lưu nháp/).first()).toBeVisible();
    }
    const vpw = page.viewportSize()?.width ?? 390;
    const overflow = await page.evaluate((w) => Math.max(document.documentElement.scrollWidth, window.innerWidth) - w, vpw);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
