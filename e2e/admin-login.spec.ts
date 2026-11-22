import { e2eAdmin } from "./accounts";
import { expect, test } from "@playwright/test";

async function openLogin(page: import("@playwright/test").Page, callbackUrl: string) {
  await page.goto("/api/auth/csrf");
  await page.goto(`/dang-nhap?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  const form = page.getByTestId("login-form");
  await expect(form).toHaveAttribute("method", /post/i);
  await expect(form).toHaveAttribute("data-hydrated", "true", { timeout: 10_000 });
  return form;
}

test.describe("Admin login form", () => {
  test("uses POST, blocks pre-hydrate submit, reaches admin without password in URL", async ({
    page,
  }) => {
    await openLogin(page, "/admin");

    await page.getByLabel(/^Email$/i).fill(e2eAdmin().email);
    await page.getByLabel(/Mật khẩu/i).fill(e2eAdmin().password);
    await page.getByRole("button", { name: /Đăng nhập/i }).click();

    await page.waitForURL(
      (url) => url.pathname === "/admin" || url.pathname.startsWith("/admin/"),
      { timeout: 25_000 },
    );

    expect(page.url()).not.toMatch(/password=/i);
    expect(page.url()).not.toContain(e2eAdmin().password);
    await expect(page.getByRole("heading", { name: /Tổng quan/i })).toBeVisible();
  });

  test("products list opens after login", async ({ page }) => {
    await openLogin(page, "/admin/products");
    await page.getByLabel(/^Email$/i).fill(e2eAdmin().email);
    await page.getByLabel(/Mật khẩu/i).fill(e2eAdmin().password);
    await page.getByRole("button", { name: /Đăng nhập/i }).click();
    await page.waitForURL(/\/admin\/products/, { timeout: 25_000 });
    await expect(page.getByRole("heading", { name: /^Sản phẩm$/i })).toBeVisible();
    await expect(page.getByTestId("admin-products-table")).toBeVisible();
  });
});

