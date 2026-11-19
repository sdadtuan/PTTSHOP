import { expect, test } from "@playwright/test";

test.describe("Demo V2 storefront", () => {
  test("renders Version B homepage sections", async ({ page }) => {
    await page.goto("/demo-v2");
    await expect(page.getByTestId("demo-v2-root")).toBeVisible();
    await expect(page.getByTestId("demo-v2-header")).toBeVisible();
    await expect(page.getByTestId("demo-v2-hero")).toBeVisible();
    await expect(page.getByRole("heading", { name: /VIZFAS/i }).first()).toBeVisible();
    await expect(page.getByTestId("demo-v2-hero-cta")).toContainText(/Khám Phá Ngay/i);
    await expect(page.getByTestId("demo-v2-trust")).toContainText(/Giao Hàng Nhanh/i);
    await expect(page.getByTestId("demo-v2-collections")).toContainText(/Bộ Sưu Tập/i);
    await expect(page.getByTestId("demo-v2-phoi-mau")).toContainText(/Phối Màu/i);
    await expect(page.getByTestId("demo-v2-featured")).toContainText(/Sản Phẩm Nổi Bật/i);
    await expect(page.getByTestId("demo-v2-product-card").first()).toBeVisible();
  });

  test("product cards link to real PDP routes", async ({ page }) => {
    await page.goto("/demo-v2");
    const card = page.getByTestId("demo-v2-product-card").first();
    const href = await card.locator('a[href^="/san-pham/"]').first().getAttribute("href");
    expect(href).toMatch(/^\/san-pham\/.+/);
    await page.goto(href!);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Thêm vào giỏ hàng/i })).toBeVisible();
  });

  test("sends noindex on demo-v2", async ({ page }) => {
    await page.goto("/demo-v2");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots || "").toMatch(/noindex/i);
  });

  test("mobile demo-v2 has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/demo-v2");
    await expect(page.getByTestId("demo-v2-hero")).toBeVisible();
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(390);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(390);
  });

  test("floating contact stack is fixed on desktop and survives scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/demo-v2");
    const stack = page.getByTestId("floating-social");
    await expect(stack).toBeVisible();
    await expect(stack).toHaveAttribute("data-demo-v2", "true");
    await expect(stack.getByLabel("Facebook")).toBeVisible();
    await expect(stack.getByLabel("Messenger")).toBeVisible();
    await expect(stack.getByLabel("Zalo")).toBeVisible();
    await expect(stack.getByLabel("Gọi điện")).toBeVisible();
    const before = await stack.evaluate((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { position: s.position, top: r.top, right: window.innerWidth - r.right };
    });
    expect(before.position).toBe("fixed");
    expect(before.right).toBeLessThan(48);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    const after = await stack.evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(after - before.top)).toBeLessThan(2);
    await expect(stack).toBeVisible();
  });

  test("floating contact stack shows on mobile without covering header cart", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/demo-v2");
    const stack = page.getByTestId("floating-social");
    await expect(stack).toBeVisible();
    const cart = page.getByRole("link", { name: /Giỏ hàng/i });
    await expect(cart).toBeVisible();
    const boxes = await page.evaluate(() => {
      const float = document.querySelector('[data-testid="floating-social"]');
      const cartEl = document.querySelector('a[aria-label="Giỏ hàng"]');
      if (!float || !cartEl) return null;
      const f = float.getBoundingClientRect();
      const c = cartEl.getBoundingClientRect();
      const overlap = !(f.right < c.left || f.left > c.right || f.bottom < c.top || f.top > c.bottom);
      return {
        floatBottom: f.bottom,
        viewport: window.innerHeight,
        overlap,
        floatRight: window.innerWidth - f.right,
      };
    });
    expect(boxes).toBeTruthy();
    expect(boxes!.overlap).toBe(false);
    expect(boxes!.floatBottom).toBeLessThan(844 - 24);
    expect(boxes!.floatRight).toBeLessThan(40);
  });
});

test.describe("Version A unchanged smoke", () => {
  test("homepage A still shows shatter collage and key copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Mặc Đơn Giản/i })).toBeVisible();
    await expect(page.getByTestId("hero-shatter-collage")).toBeVisible();
    await expect(page.getByTestId("banner-phong-cach")).toBeVisible();
    await expect(page.getByTestId("demo-v2-root")).toHaveCount(0);
  });

  test("homepage A floating stack stays desktop-only", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const stack = page.getByTestId("floating-social");
    await expect(stack).toHaveAttribute("data-demo-v2", "false");
    await expect(stack).toBeHidden();
  });
});
