import { expect, test } from "@playwright/test";

test.describe("Storefront", () => {
  test("homepage matches key design copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "VIZFAS" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Mặc Đơn Giản/i })).toBeVisible();
    await expect(page.getByText(/Vẫn Nổi Bật/i).first()).toBeVisible();
    await expect(page.getByTestId("hero-badge")).toBeVisible();
    await expect(page.getByTestId("hero-badge")).toContainText(/2026/i);
    await expect(page.getByTestId("banner-phong-cach")).toBeVisible();
    await expect(
      page.getByText(/Phong Cách Đơn Giản/i).locator("visible=true").first(),
    ).toBeVisible();
    await expect(page.getByText(/Khám Phá Các/i).first()).toBeVisible();
    await expect(page.getByText(/Đa Dạng Kiểu Dáng/i).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Tất cả/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Sản phẩm\s+Nổi Bật/i }),
    ).toBeVisible();
    await expect(page.getByText(/PHỐI/i).first()).toBeVisible();
  });

  test("hero shatter collage has 6 pieces on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const collage = page.getByTestId("hero-shatter-collage");
    await expect(collage).toBeVisible();
    await expect(collage).toHaveAttribute("data-piece-count", "6");
    await expect(page.getByTestId("hero-shatter-cell")).toHaveCount(6);
    const box = await collage.boundingBox();
    expect(box).toBeTruthy();
    const aspect = box!.width / box!.height;
    // mock collage 224/304 ≈ 0.737 — allow ≤5%
    expect(Math.abs(aspect - 224 / 304) / (224 / 304)).toBeLessThanOrEqual(0.05);
  });

  test("hero shatter respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const collage = page.getByTestId("hero-shatter-collage");
    await expect(collage).toHaveAttribute("data-reduced-motion", "true");
  });

  test("PDP colour swatch updates gallery", async ({ page }) => {
    await page.goto("/san-pham/ao-hoodie-essential");
    await expect(
      page.getByRole("heading", { name: /Áo Hoodie Essential Form Rộng/i }),
    ).toBeVisible();
    await expect(page.getByText(/Mới về/i)).toBeVisible();
    const black = page.getByRole("button", { name: "Đen" });
    await black.click();
    await expect(page.getByText(/Màu sắc:\s*Đen/i)).toBeVisible();
  });

  test("listing search and sort controls render", async ({ page }) => {
    await page.goto("/san-pham?q=hoodie");
    await expect(page.getByRole("heading", { name: /Sản phẩm/i })).toBeVisible();
  });

  test("mobile homepage has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByTestId("banner-phong-cach")).toBeVisible();
    await expect(page.getByTestId("banner-title-mobile")).toBeVisible();
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(390);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(390);
  });
});

test.describe("Access control", () => {
  test("admin redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/dang-nhap/);
  });

  test("customer cannot open admin after login", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByLabel(/Email/i).fill("khach@vizfas.vn");
    await page.getByLabel(/Mật khẩu/i).fill("khach123");
    await page.getByRole("button", { name: /Đăng nhập/i }).click();
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});

test.describe("Purchase flow", () => {
  test("add to cart and reach checkout", async ({ page }) => {
    await page.goto("/san-pham/ao-hoodie-essential");
    const post = page.waitForResponse(
      (r) =>
        r.url().includes("/api/cart") &&
        r.request().method() === "POST" &&
        r.ok(),
    );
    await page.getByRole("button", { name: /Thêm vào giỏ hàng/i }).click();
    await post;
    await expect(page.getByRole("button", { name: /Đã thêm/i })).toBeVisible();
    await page.getByRole("link", { name: /Giỏ hàng/i }).click();
    await expect(page.getByText(/Áo Hoodie Essential/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.goto("/thanh-toan");
    await expect(
      page.getByText(/Thanh toán|Đặt hàng|COD|Chuyển khoản/i).first(),
    ).toBeVisible();
  });
});

