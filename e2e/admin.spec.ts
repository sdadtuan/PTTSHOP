import { expect, test } from "@playwright/test";

test.describe("Admin orders", () => {
  test("admin can login and open orders", async ({ page }) => {
    await page.goto("/dang-nhap?callbackUrl=/admin");
    await page.getByLabel(/^Email$/i).fill("admin@vizfas.vn");
    await page.getByLabel(/Mật khẩu/i).fill("admin123");
    await Promise.all([
      page.waitForURL(/\/admin/, { timeout: 20_000 }),
      page.getByRole("button", { name: /Đăng nhập/i }).click(),
    ]);
    await expect(page.getByRole("heading", { name: /Admin VIZFAS/i })).toBeVisible();
    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { name: /Đơn hàng/i })).toBeVisible();
  });
});
