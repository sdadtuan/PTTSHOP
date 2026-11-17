import { expect, test } from "@playwright/test";
import path from "path";
import fs from "fs";

const demoVideo = path.resolve(
  process.cwd(),
  "public/videos/demo-hoodie-kem.mp4",
);

async function adminLogin(page: import("@playwright/test").Page) {
  // Warm Auth.js CSRF cookie before credentials sign-in
  await page.goto("/api/auth/csrf");
  await page.goto("/dang-nhap?callbackUrl=/admin/products");
  await page.getByLabel(/^Email$/i).fill("admin@vizfas.vn");
  await page.getByLabel(/Mật khẩu/i).fill("admin123");
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL(
    (url) => url.pathname === "/admin" || url.pathname.startsWith("/admin/"),
    { timeout: 25_000 },
  );
}

test.describe("Product video", () => {
  test.beforeAll(() => {
    test.skip(
      !fs.existsSync(demoVideo),
      "Missing demo video public/uploads/demo-hoodie-kem.mp4",
    );
  });

  test("admin can upload video and PDP shows playing video", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop admin flow once");

    await adminLogin(page);
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: /Sản phẩm/i })).toBeVisible();

    const manageBtn = page.getByTestId("manage-media-ao-hoodie-essential");
    await manageBtn.click();
    await expect(page.getByTestId("admin-video-manager")).toBeVisible();
    await page.getByTestId("admin-manage-video-file").setInputFiles(demoVideo);
    await expect(
      page.locator('[data-testid="admin-video-manager"] video').first(),
    ).toBeVisible({ timeout: 25_000 });

    await page.goto("/san-pham/ao-hoodie-essential");
    const video = page.getByTestId("pdp-product-video");
    await expect(video).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => {
        return video.evaluate((el) => {
          const v = el as HTMLVideoElement;
          return !v.paused && v.readyState >= 2;
        });
      }, { timeout: 15_000 })
      .toBe(true);

    const imageThumb = page.getByTestId("gallery-thumb-image").first();
    if (await imageThumb.count()) {
      await imageThumb.click();
      await expect
        .poll(async () => {
          const still = page.getByTestId("pdp-product-video");
          if ((await still.count()) === 0) return true;
          return still.evaluate((el) => (el as HTMLVideoElement).paused);
        })
        .toBe(true);
    }

    const videoThumb = page.getByTestId("gallery-thumb-video").first();
    if (await videoThumb.count()) {
      await videoThumb.click();
      await expect(page.getByTestId("pdp-product-video")).toBeVisible();
    }
  });

  test("PDP video plays on mobile viewport", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile project only");
    await page.goto("/san-pham/ao-hoodie-essential");
    const video = page.getByTestId("pdp-product-video");
    await expect(video).toBeVisible({ timeout: 15_000 });
    await expect(video).toHaveJSProperty("muted", true);
    await expect
      .poll(async () =>
        video.evaluate((el) => {
          const v = el as HTMLVideoElement;
          return v.hasAttribute("playsinline") || v.playsInline === true;
        }),
      )
      .toBe(true);
  });
});
