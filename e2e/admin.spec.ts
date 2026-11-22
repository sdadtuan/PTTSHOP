import { e2eAdmin } from "./accounts";
import { expect, test } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/api/auth/csrf");
  await page.goto("/dang-nhap?callbackUrl=/admin");
  await page.getByLabel(/^Email$/i).fill(e2eAdmin().email);
  await page.getByLabel(/Mật khẩu/i).fill(e2eAdmin().password);
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL(
    (url) => url.pathname === "/admin" || url.pathname.startsWith("/admin/"),
    { timeout: 25_000 },
  );
}

test.describe("Admin redesign", () => {
  test("admin can open dashboard, products, orders", async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole("heading", { name: /Tổng quan/i })).toBeVisible();
    const desktopNav = page.getByRole("navigation", { name: /Menu quản trị/i });
    if (await desktopNav.isVisible().catch(() => false)) {
      await expect(desktopNav).toBeVisible();
    } else {
      await page.getByRole("button", { name: /Mở menu|Menu/i }).click();
      await expect(page.getByRole("navigation", { name: /Menu quản trị/i })).toBeVisible();
    }
    await expect(page.getByText(/Doanh thu/i).first()).toBeVisible();

    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: /^Sản phẩm$/i })).toBeVisible();

    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { name: /Đơn hàng/i })).toBeVisible();
  });

  test("admin shell is responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAdmin(page);
    await expect(page.getByRole("heading", { name: /Tổng quan/i })).toBeVisible();
    await page.getByRole("button", { name: /Mở menu/i }).click();
    await expect(page.getByRole("navigation", { name: /Menu quản trị/i })).toBeVisible();
  });
});
