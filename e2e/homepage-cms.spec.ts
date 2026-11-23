import { e2eAdmin, e2eCustomer } from "./accounts";
import { expect, test, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

async function login(page: Page, email: string, password: string, callbackUrl = "/") {
  await page.goto("/api/auth/csrf");
  await page.goto(`/dang-nhap?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel(/^Email$/i).fill(email);
  await page.getByLabel(/Mật khẩu/i).fill(password);
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
}

async function loginAdmin(page: Page) {
  await login(page, e2eAdmin().email, e2eAdmin().password, "/admin/giao-dien");
  await page.waitForURL((u) => u.pathname.startsWith("/admin"), { timeout: 25_000 });
}

async function openCms(page: Page) {
  await page.goto("/admin/giao-dien");
  await expect(page.getByTestId("admin-giao-dien")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("cms-section-hero")).toBeVisible({ timeout: 20_000 });
}

test.describe("Homepage CMS (Quản lý giao diện)", () => {
  test("admin menu has Quản lý giao diện", async ({ page }, info) => {
    test.skip(info.project.name !== "chromium", "desktop sidebar");
    await loginAdmin(page);
    await page.goto("/admin");
    await page.getByRole("link", { name: "Quản lý giao diện" }).first().click();
    await expect(page).toHaveURL(/\/admin\/giao-dien$/);
  });

  test("draft → homepage unchanged; publish → changed; restore previous → reverted", async ({ page, browser }, info) => {
    test.skip(info.project.name !== "chromium", "mutates shared dev DB; run once");
    page.on("dialog", (d) => void d.accept());
    await loginAdmin(page);
    await openCms(page);
    await page.getByTestId("cms-section-hero").click();

    const title = page.getByTestId("cms-field-hero-title");
    await expect(title).toBeVisible();
    const original = await title.inputValue();
    expect(original.length).toBeGreaterThan(0);
    const draftTitle = `CMS Draft ${Date.now()}`;
    await title.fill(draftTitle);

    await page.getByTestId("cms-save-draft").click();
    await expect(page.getByText(/Đã lưu nháp/i)).toBeVisible({ timeout: 15_000 });

    const home = await page.context().newPage();
    await home.goto("/");
    await expect(home.getByTestId("hero-h1")).toContainText(original);
    await expect(home.getByTestId("hero-h1")).not.toContainText(draftTitle);

    // Admin draft preview shows the draft …
    await home.goto("/?cmsPreview=draft");
    await expect(home.getByTestId("hero-h1")).toContainText(draftTitle);
    // … the preview iframe inside the CMS too
    await expect(page.frameLocator('[data-testid="cms-preview-frame"]').getByTestId("hero-h1")).toContainText(draftTitle, { timeout: 30_000 });
    // … but a guest asking for preview still gets the published page.
    const guest = await browser.newContext();
    const gp = await guest.newPage();
    await gp.goto("/?cmsPreview=draft");
    await expect(gp.getByTestId("hero-h1")).not.toContainText(draftTitle);
    await guest.close();

    await page.getByTestId("cms-publish").click();
    await expect(page.getByText(/Đã xuất bản/i)).toBeVisible({ timeout: 20_000 });
    await home.goto("/");
    await expect(home.getByTestId("hero-h1")).toContainText(draftTitle);

    await page.getByTestId("cms-restore-previous").click();
    await expect(page.getByText(/Đã khôi phục/i)).toBeVisible({ timeout: 20_000 });
    await home.reload();
    await expect(home.getByTestId("hero-h1")).toContainText(original);
    await expect(home.getByTestId("hero-h1")).not.toContainText(draftTitle);
    await expect(page.getByTestId("cms-field-hero-title")).toHaveValue(original);
    await home.close();
  });

  test("logo upload on giao-dien returns /media/uploads", async ({ page }, info) => {
    test.skip(info.project.name !== "chromium", "desktop admin");
    await loginAdmin(page);
    await openCms(page);
    await page.getByTestId("cms-section-header").click();

    const png = path.join(process.cwd(), "test-results", "cms-logo.png");
    fs.mkdirSync(path.dirname(png), { recursive: true });
    fs.writeFileSync(
      png,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    );

    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/upload") && r.request().method() === "POST"),
      page.getByTestId("cms-logo-upload").setInputFiles(png),
    ]);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(String(body.url || "")).toMatch(/^\/media\/uploads\//);
    await expect(page.getByLabel(/Logo \(để trống/)).toHaveValue(/^\/media\/uploads\//);
  });

  test("upload rejects a non-image file", async ({ page }, info) => {
    test.skip(info.project.name !== "chromium", "desktop admin");
    await loginAdmin(page);
    await openCms(page);
    await page.getByTestId("cms-section-hero").click();

    const tmp = path.join(process.cwd(), "test-results", "fake-cms.txt");
    fs.mkdirSync(path.dirname(tmp), { recursive: true });
    fs.writeFileSync(tmp, "not-an-image, just text");

    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/upload") && r.request().method() === "POST"),
      page.getByTestId("cms-field-hero-imageUrl-upload").setInputFiles(tmp),
    ]);
    expect(res.status()).toBe(400);
    expect(String((await res.json()).error || "")).toMatch(/định dạng|JPEG|nhận/i);
  });

  test("guest cannot open CMS UI or API", async ({ page }) => {
    await page.goto("/admin/giao-dien");
    await expect(page).toHaveURL(/\/dang-nhap/);
    const api = await page.request.get("/api/admin/homepage-cms");
    expect(api.status()).toBe(401);
    const post = await page.request.post("/api/admin/homepage-cms", { data: { action: "publish" } });
    expect(post.status()).toBe(401);
  });

  test("customer cannot open CMS UI or API", async ({ page }) => {
    await login(page, e2eCustomer().email, e2eCustomer().password);
    await page.waitForTimeout(1500);
    await page.goto("/admin/giao-dien");
    await expect(page).not.toHaveURL(/\/admin\/giao-dien/);
    expect((await page.request.get("/api/admin/homepage-cms")).status()).toBe(403);
    expect((await page.request.post("/api/admin/homepage-cms", { data: { action: "publish" } })).status()).toBe(403);
    expect((await page.request.post("/api/admin/homepage-cms", { data: { action: "restore_previous" } })).status()).toBe(403);
  });
});
