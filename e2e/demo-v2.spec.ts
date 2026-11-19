import { expect, test } from "@playwright/test";

test.describe("Demo V2 storefront", () => {
  test("renders Version B homepage sections with A content parity", async ({ page }) => {
    await page.goto("/demo-v2");
    await expect(page.getByTestId("demo-v2-root")).toBeVisible();
    await expect(page.getByTestId("demo-v2-header")).toBeVisible();
    await expect(page.getByTestId("demo-v2-hero")).toBeVisible();
    await expect(page.getByTestId("demo-v2-hero-cta")).toBeVisible();
    await expect(page.getByTestId("demo-v2-trust")).toBeVisible();
    await expect(page.getByTestId("demo-v2-phong-cach")).toContainText(/Phong Cách Đơn Giản/i);
    await expect(page.getByTestId("demo-v2-collections")).toBeVisible();
    await expect(page.getByTestId("demo-v2-diverse")).toContainText(/Dễ Phối Đồ|Đa Dạng/i);
    await expect(page.getByTestId("demo-v2-style-tabs")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Tất cả/i })).toBeVisible();
    await expect(page.getByTestId("demo-v2-featured")).toBeVisible();
    await expect(page.getByTestId("demo-v2-phoi-mau")).toBeVisible();
    await expect(page.getByTestId("demo-v2-phoi-mau")).toHaveCount(1);
    await expect(page.getByTestId("demo-v2-phoi-cta")).toBeVisible();
    await expect(page.getByTestId("demo-v2-phoi-intro")).toBeVisible();
    await expect(page.getByTestId("demo-v2-color-play")).toBeVisible();
    await expect(page.getByTestId("demo-v2-phoi-vertical-label")).toBeVisible();
    await expect(page.getByTestId("demo-v2-featured-glance")).toHaveCount(0);
    await expect(page.getByTestId("demo-v2-footer")).toBeVisible();
    await expect(page.getByTestId("floating-social")).toBeVisible();
    await expect(page.getByTestId("demo-v2-nav-danh-gia")).toHaveText("ĐÁNH GIÁ");
    await expect(page.getByTestId("demo-v2-reviews")).toContainText(
      /Khách Hàng Nói Gì Về VIZFAS/i,
    );
  });

  test("ĐÁNH GIÁ nav scrolls to reviews and underlines active", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/demo-v2");
    const nav = page.getByTestId("demo-v2-nav-danh-gia");
    await expect(nav).toHaveText("ĐÁNH GIÁ");
    await nav.click();
    await expect(page).toHaveURL(/#danh-gia/);
    await expect(nav).toHaveAttribute("data-active", "true");
    await expect(page.getByTestId("demo-v2-reviews")).toBeInViewport();
    const cards = page.getByTestId("demo-v2-review-card");
    const empty = page.getByTestId("demo-v2-reviews-empty");
    const cardCount = await cards.count();
    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible();
      await expect(cards.first().locator(".dv2-reviews__stars")).toBeVisible();
    } else {
      await expect(empty).toBeVisible();
    }
  });

  test("header search and wishlist affordances work", async ({ page }) => {
    await page.goto("/demo-v2");
    await page.getByRole("button", { name: /Tìm kiếm/i }).click();
    await expect(page.getByTestId("demo-v2-search")).toBeVisible();
    await page.getByLabel(/Tìm sản phẩm/i).fill("hoodie");
    await page.getByTestId("demo-v2-search").locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/san-pham.*hoodie|q=hoodie/);
  });

  test("BST Quần tabs filter and add-to-cart works", async ({ page }) => {
    await page.goto("/demo-v2");
    const tabs = page.getByTestId("demo-v2-style-tabs");
    await expect(tabs.getByRole("tab", { name: /Tất cả/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await tabs.getByRole("tab", { name: /^Quần$/i }).click();
    await expect(tabs.getByRole("tab", { name: /^Quần$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const card = tabs.getByTestId("demo-v2-style-card").first();
    await expect(card).toBeVisible();
    const post = page.waitForResponse(
      (r) =>
        r.url().includes("/api/cart") &&
        r.request().method() === "POST" &&
        r.ok(),
    );
    await card.getByRole("button", { name: /Thêm .* vào giỏ/i }).click();
    await post;
    await expect(card.getByText(/Đã thêm/i)).toBeVisible();
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
  });

  test("mobile float sits bottom-right and clears collection arrows", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/demo-v2");
    await page.getByTestId("demo-v2-collections").scrollIntoViewIfNeeded();
    const stack = page.getByTestId("floating-social");
    await expect(stack).toBeVisible();
    const metrics = await page.evaluate(() => {
      const float = document.querySelector('[data-testid="floating-social"]');
      if (!float) return null;
      const f = float.getBoundingClientRect();
      return {
        top: f.top,
        bottom: f.bottom,
        right: window.innerWidth - f.right,
        height: window.innerHeight,
        btnH: float.querySelector("a")?.getBoundingClientRect().height ?? 0,
      };
    });
    expect(metrics).toBeTruthy();
    expect(metrics!.bottom).toBeGreaterThan(metrics!.height - 160);
    expect(metrics!.top).toBeGreaterThan(metrics!.height * 0.45);
    expect(metrics!.right).toBeLessThan(28);
    expect(metrics!.btnH).toBeLessThanOrEqual(40);
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
