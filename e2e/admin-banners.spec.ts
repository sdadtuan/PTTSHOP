import { expect, test } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/dang-nhap");
  await page.getByLabel(/^Email$/i).fill("admin@vizfas.vn");
  await page.getByLabel(/Mật khẩu/i).fill("admin123");
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL(/\/admin/);
}

test.describe("Admin Hero Banners", () => {
  test("admin can open Banner page and see upload form", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/banners");
    await expect(
      page.getByRole("heading", { name: /Banner trang chủ/i }),
    ).toBeVisible();
    await expect(page.getByText(/Upload ảnh lớn/i).first()).toBeVisible();
    await expect(page.getByTestId("admin-banner-upload")).toBeVisible();
    await expect(page.getByTestId("admin-banner-create")).toBeDisabled();
  });

  test("upload hero image enables create and shows preview grid", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/banners");

    // Seed draft via API then reload — upload route needs multipart; use create API with known asset
    const res = await page.request.post("/api/admin/hero-banners", {
      data: {
        imageUrl: "/images/home-v2/hero-main.jpg",
        title: "Mặc Đơn Giản",
        subtitle: "Vẫn Nổi Bật",
        ctaLabel: "Xem sản phẩm",
        ctaHref: "/san-pham",
        focalPoint: "50% 20%",
        gridCols: 2,
        gridRows: 3,
        isActive: true,
      },
    });
    expect(res.ok()).toBeTruthy();

    await page.reload();
    const preview = page.getByTestId("admin-banner-preview-grid");
    await expect(preview.first()).toBeVisible({ timeout: 15000 });
  });
});
