import { expect, test } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/api/auth/csrf");
  await page.goto("/dang-nhap?callbackUrl=/admin/products");
  await expect(page.getByTestId("login-form")).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel(/^Email$/i).fill("admin@vizfas.vn");
  await page.getByLabel(/Mật khẩu/i).fill("admin123");
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL(/\/admin\/products/, { timeout: 25_000 });
}

test.describe("Admin products compact list", () => {
  test("summary row expands Màu × Size stock editors", async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole("heading", { name: /^Sản phẩm$/i })).toBeVisible();
    await expect(page.getByTestId("admin-products-table")).toBeVisible();
    await expect(page.getByText(/biến thể/i).first()).toBeVisible();

    const expand = page.getByTestId(/^expand-product-/).first();
    await expect(expand).toBeVisible();
    const testId = await expand.getAttribute("data-testid");
    const slug = testId?.replace("expand-product-", "") || "";
    expect(slug).toBeTruthy();

    await expand.click();
    const panel = page.getByTestId(`product-expand-${slug}`);
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Biến thể Màu × Size/i)).toBeVisible();
    await expect(panel.getByLabel(/^Tồn /i).first()).toBeVisible();

    await expect(page.getByTestId("admin-product-new")).toBeVisible();
    await expect(page.getByRole("link", { name: /Sửa/i }).first()).toBeVisible();
  });
});
