import { expect, test } from "@playwright/test";

test.describe("Storefront", () => {
  test("homepage matches key design copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "VIZFAS" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Mặc Đơn Giản/i })).toBeVisible();
    await expect(page.getByText(/Vẫn Nổi Bật/i).first()).toBeVisible();
    await expect(page.getByText(/BỘ SƯU TẬP Hè 2024/i).first()).toBeVisible();
    await expect(page.getByText(/Phong Cách Đơn Giản/i).first()).toBeVisible();
    await expect(page.getByText(/Khám Phá Các/i).first()).toBeVisible();
    await expect(page.getByText(/Đa Dạng Kiểu Dáng/i).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Tất cả/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Sản phẩm\s+Nổi Bật/i }),
    ).toBeVisible();
    await expect(page.getByText(/PHỐI/i).first()).toBeVisible();
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

