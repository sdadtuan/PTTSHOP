import { expect, test, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Admin product slug: auto-generated live from the name, manual edits are never overwritten,
 * clearing resumes auto, duplicates get -2, editing a saved product keeps its slug.
 * Creates TEST products only (slug prefix below) and deletes them + their uploads afterwards.
 */
const PREFIX = "test-slug-";
const IMG = path.resolve(process.cwd(), "e2e/fixtures/media/test-1.jpg");
const SHOTS = process.env.SLUG_SHOTS_DIR;

async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name) });
}

async function adminLogin(page: Page) {
  await page.goto("/api/auth/csrf");
  await page.goto("/dang-nhap?callbackUrl=/admin/products");
  await page.getByLabel(/^Email$/i).fill("admin@vizfas.vn");
  await page.getByLabel(/Mật khẩu/i).fill("admin123");
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL((u) => u.pathname === "/admin" || u.pathname.startsWith("/admin/"), { timeout: 25_000 });
}

/** Delete TEST slug products and the files uploaded for them. */
async function cleanup(page: Page) {
  const list = await (await page.request.get("/api/admin/products")).json();
  for (const p of (list.products || []) as { id: string; slug: string; images?: { url: string }[] }[]) {
    if (!p.slug.startsWith(PREFIX)) continue;
    const res = await page.request.delete("/api/admin/products", { data: { id: p.id } });
    expect(res.ok()).toBe(true);
    for (const img of p.images || []) {
      if (!img.url.startsWith("/uploads/")) continue;
      const file = path.resolve(process.cwd(), "public", img.url.replace(/^\//, ""));
      if (file.startsWith(path.resolve(process.cwd(), "public", "uploads"))) fs.rmSync(file, { force: true });
    }
  }
}

async function openNew(page: Page) {
  await page.goto("/admin/products/new");
  await expect(page.getByTestId("product-editor")).toBeVisible({ timeout: 20_000 });
}

async function fillRestAndSave(page: Page) {
  await page.getByTestId("pe-image-files").setInputFiles([IMG]);
  await expect(page.getByTestId("pe-image")).toHaveCount(1, { timeout: 30_000 });
  const card = page.getByTestId("pe-color").first();
  await card.getByTestId("pe-color-name").fill("Đen");
  const rows = card.getByTestId("pe-size-row");
  for (let i = 0; i < (await rows.count()); i++) {
    await rows.nth(i).getByTestId("pe-price").fill("199000");
    await rows.nth(i).getByTestId("pe-stock").fill("1");
  }
  await page.getByTestId("pe-save").click();
  await expect(page.getByTestId("pe-error")).toHaveCount(0);
  await page.waitForURL(/\/admin\/products\/(?!new)[^/?]+$/, { timeout: 30_000 });
  await expect(page.getByTestId("pe-slug")).not.toHaveValue("", { timeout: 20_000 });
}

test.describe.configure({ mode: "serial" });

test.describe("Admin product slug", () => {
  test("auto slug while typing, manual edit kept, clearing resumes auto (desktop + mobile)", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    if (testInfo.project.name === "chromium") await page.setViewportSize({ width: 1280, height: 900 });
    await adminLogin(page);
    await openNew(page);
    const name = page.getByTestId("pe-name");
    const slug = page.getByTestId("pe-slug");
    await expect(slug).toHaveValue("");

    // every keystroke updates the slug immediately
    await name.pressSequentially("Áo Đ", { delay: 15 });
    await expect(slug).toHaveValue("ao-d");
    await name.pressSequentially("en & Trắng 2026!", { delay: 15 });
    await expect(slug).toHaveValue("ao-den-trang-2026");
    await expect(page.getByText("Tự tạo từ tên, có thể sửa")).toBeVisible();

    const samples: [string, string][] = [
      ["ĐẦM DỰ TIỆC Cao Cấp", "dam-du-tiec-cao-cap"],
      ["Hoodie Oversize (Limited) #1 @VIZFAS", "hoodie-oversize-limited-1-vizfas"],
      ["Quần \"Cargo\" 50% + Free", "quan-cargo-50-free"],
      ["  🔥 Áo   khoác   gió 🔥  ", "ao-khoac-gio"],
      ["🔥🔥", "san-pham"],
      ["Nike Air Force 1 '07 / Trắng", "nike-air-force-1-07-trang"],
    ];
    for (const [n, s] of samples) {
      await name.fill(n);
      await expect(slug).toHaveValue(s);
    }
    await name.fill("Áo Thun Đen Basic 2026");
    await expect(slug).toHaveValue("ao-thun-den-basic-2026");
    await shot(page, `01-new-auto-slug-${testInfo.project.name}.png`);

    // manual edit: sanitised live, never overwritten by later name changes
    await slug.fill("");
    await slug.pressSequentially("Bộ Sưu Tập Hè", { delay: 15 });
    await expect(slug).toHaveValue("bo-suu-tap-he");
    await name.fill("Tên khác hoàn toàn");
    await expect(slug).toHaveValue("bo-suu-tap-he");
    await shot(page, `02-manual-slug-kept-${testInfo.project.name}.png`);

    // clearing the slug → automatic again
    await slug.fill("");
    await name.fill("Váy Hoa Nhí 2 Dây");
    await expect(slug).toHaveValue("vay-hoa-nhi-2-day");

    // layout: no horizontal overflow on this form
    const vw = page.viewportSize()!.width;
    const sw = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth));
    expect(sw).toBeLessThanOrEqual(vw + 1);
  });

  test("duplicate name → -2, editing a saved product keeps its slug", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "creates products once, on desktop");
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await adminLogin(page);
    await cleanup(page);
    try {
      // 1st product
      await openNew(page);
      await page.getByTestId("pe-name").fill("TEST Slug Áo Trùng Tên");
      await expect(page.getByTestId("pe-slug")).toHaveValue("test-slug-ao-trung-ten");
      await fillRestAndSave(page);
      await expect(page.getByTestId("pe-slug")).toHaveValue("test-slug-ao-trung-ten");
      const firstUrl = page.url();

      // 2nd product, same name → hint shows the -2 slug, saved as -2
      await openNew(page);
      await page.getByTestId("pe-name").fill("TEST Slug Áo Trùng Tên");
      await expect(page.getByTestId("pe-slug")).toHaveValue("test-slug-ao-trung-ten");
      await expect(page.getByText("Slug đã có — khi lưu sẽ dùng: test-slug-ao-trung-ten-2")).toBeVisible();
      await shot(page, "03-duplicate-hint.png");
      await fillRestAndSave(page);
      await expect(page.getByTestId("pe-slug")).toHaveValue("test-slug-ao-trung-ten-2");
      await shot(page, "04-duplicate-saved-2.png");

      // edit the 1st: rename → slug stays, after save + reload too
      await page.goto(firstUrl);
      const name = page.getByTestId("pe-name");
      const slug = page.getByTestId("pe-slug");
      await expect(slug).toHaveValue("test-slug-ao-trung-ten", { timeout: 20_000 });
      await expect(page.getByText("Đổi slug sẽ đổi link sản phẩm")).toBeVisible();
      await name.fill("TEST Slug Tên Đã Đổi Hoàn Toàn");
      await expect(slug).toHaveValue("test-slug-ao-trung-ten");
      await page.getByTestId("pe-save").click();
      await expect(page.getByText(/Đã lưu sản phẩm/).first()).toBeVisible({ timeout: 15_000 });
      await page.reload();
      await expect(slug).toHaveValue("test-slug-ao-trung-ten", { timeout: 20_000 });
      await expect(name).toHaveValue("TEST Slug Tên Đã Đổi Hoàn Toàn");
      await shot(page, "05-edit-keeps-slug.png");

      // edit: typing another product's slug → hint, saved with suffix
      await slug.fill("test-slug-ao-trung-ten-2");
      await expect(page.getByText("Slug đã có — khi lưu sẽ dùng: test-slug-ao-trung-ten-2-2")).toBeVisible();
      await page.getByTestId("pe-save").click();
      await expect(slug).toHaveValue("test-slug-ao-trung-ten-2-2", { timeout: 15_000 });
    } finally {
      await cleanup(page);
    }
  });

  test("existing real product: changing the name in the form does not touch its slug (not saved)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "desktop");
    await page.setViewportSize({ width: 1280, height: 900 });
    await adminLogin(page);
    const list = await (await page.request.get("/api/admin/products")).json();
    const real = (list.products || []).find((p: { slug: string }) => !p.slug.startsWith("test-"));
    test.skip(!real, "no product");
    await page.goto(`/admin/products/${real.id}`);
    const slug = page.getByTestId("pe-slug");
    await expect(slug).toHaveValue(real.slug, { timeout: 20_000 });
    await page.getByTestId("pe-name").fill(`${real.name} đổi tên thử`);
    await expect(slug).toHaveValue(real.slug);
    // leave without saving
  });
});
