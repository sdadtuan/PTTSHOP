import { e2eAdmin } from "./accounts";
import { expect, test, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * PDP tabs are editable per product. Untouched products keep the previous copy.
 * Creates only TEST products (slug prefix below) and restores the site shipping policy.
 */
const PREFIX = "test-pdp-tabs-";
const IMG = path.resolve(process.cwd(), "e2e/fixtures/media/test-1.jpg");
const SHOTS = "C:\\CursorAI\\_pdp-tabs-shots";

const TABS = [
  ["details", "Chi tiết sản phẩm"],
  ["material", "Chất liệu"],
  ["size", "Bảng size"],
  ["shipping", "Vận chuyển & Đổi trả"],
] as const;

async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
}

async function adminLogin(page: Page) {
  await page.goto("/api/auth/csrf");
  await page.goto("/dang-nhap?callbackUrl=/admin/products");
  await page.getByLabel(/^Email$/i).fill(e2eAdmin().email);
  await page.getByLabel(/Mật khẩu/i).fill(e2eAdmin().password);
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL((u) => u.pathname === "/admin" || u.pathname.startsWith("/admin/"), { timeout: 25_000 });
}

async function tabText(page: Page, id: string) {
  await page.getByTestId(`pdp-tab-${id}`).click();
  return (await page.getByTestId("pdp-tab-panel").innerText()).replace(/\s+/g, " ").trim();
}

async function readTabs(page: Page, slug: string) {
  await page.goto(`/san-pham/${slug}`);
  await expect(page.getByTestId("pdp-tab-details")).toBeVisible({ timeout: 20_000 });
  const out: Record<string, string> = {};
  for (const [id] of TABS) out[id] = await tabText(page, id);
  return out;
}

async function noOverflow(page: Page) {
  const vw = page.viewportSize()?.width ?? 0;
  const doc = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
  );
  expect(doc).toBeLessThanOrEqual(vw + 1);
}

async function deleteTestProducts(page: Page) {
  const list = await (await page.request.get("/api/admin/products")).json();
  for (const p of (list.products || []) as { id: string; slug: string; images?: { url: string }[] }[]) {
    if (!p.slug?.startsWith(PREFIX)) continue;
    const res = await page.request.delete("/api/admin/products", { data: { id: p.id } });
    expect(res.ok()).toBeTruthy();
    for (const img of p.images || []) {
      if (!img.url.startsWith("/uploads/")) continue;
      const file = path.resolve(process.cwd(), "public", img.url.replace(/^\//, ""));
      if (file.startsWith(path.resolve(process.cwd(), "public", "uploads"))) fs.rmSync(file, { force: true });
    }
  }
}

async function putPolicy(page: Page, bullets: string[] | null) {
  const res = await page.request.put("/api/admin/shipping-policy", { data: { bullets } });
  expect(res.ok()).toBeTruthy();
}

async function fillAndSave(page: Page) {
  await page.getByTestId("pe-image-files").setInputFiles([IMG]);
  await expect(page.getByTestId("pe-image")).toHaveCount(1, { timeout: 30_000 });
  const card = page.getByTestId("pe-color").first();
  await card.getByTestId("pe-color-name").fill("Đen");
  const rows = card.getByTestId("pe-size-row");
  for (let i = 0; i < (await rows.count()); i++) {
    await rows.nth(i).getByTestId("pe-price").fill("199000");
    await rows.nth(i).getByTestId("pe-stock").fill("2");
  }
  await page.getByTestId("pe-save").click();
  await expect(page.getByTestId("pe-error")).toHaveCount(0);
  await page.waitForURL(/\/admin\/products\/(?!new)[^/?]+$/, { timeout: 30_000 });
}

test.describe("PDP tab content", () => {
  test("edit each tab, untouched product stays the same, mobile has no overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "data setup runs once on desktop");
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await adminLogin(page);
    const policyRes = await page.request.get("/api/admin/shipping-policy");
    expect(policyRes.ok()).toBeTruthy();
    const originalPolicy = ((await policyRes.json()) as { bullets: string[] | null }).bullets ?? null;
    try {
      await putPolicy(page, null);
      await deleteTestProducts(page);

    const list = await (await page.request.get("/api/admin/products")).json();
    const existing = (list.products || []).find(
      (p: { slug: string }) => p.slug && !p.slug.startsWith(PREFIX) && !p.slug.startsWith("test-"),
    ) as { id: string; slug: string } | undefined;
    expect(existing, "need one real product to prove untouched copy").toBeTruthy();
    const before = await readTabs(page, existing!.slug);
    await shot(page, "12-untouched-pdp-before.png");

    await page.goto(`/admin/products/${existing!.id}`);
    await expect(page.getByTestId("pe-origin")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("pe-tab-details").click();
    const detailCount = await page.getByTestId("pe-detail-bullets-input").count();
    expect(detailCount).toBeGreaterThan(0);
    for (let i = 0; i < detailCount; i++) {
      const value = await page.getByTestId("pe-detail-bullets-input").nth(i).inputValue();
      expect(before.details).toContain(value);
    }
    expect(before.details).toContain(`Xuất xứ: ${await page.getByTestId("pe-origin").inputValue()}`);
    expect(before.details).toContain(`Độ dày: ${await page.getByTestId("pe-thickness").inputValue()}`);
    await page.getByTestId("pe-tab-material").click();
    const material0 = await page.getByTestId("pe-material-bullets-input").first().inputValue();
    expect(before.material).toContain(material0);
    await page.getByTestId("pe-tab-size").click();
    await expect(page.getByTestId("pe-size-note")).toHaveValue(/.+/);
    const note = await page.getByTestId("pe-size-note").inputValue();
    expect(before.size).toContain(note);
    await page.getByTestId("pe-tab-shipping").click();
    const ship0 = await page.getByTestId("pe-shipping-bullets-input").first().inputValue();
    expect(before.shipping).toContain(ship0);
    await shot(page, "01-admin-prefilled.png");

    await page.goto("/admin/products/new");
      await expect(page.getByTestId("pe-tab-fields")).toBeVisible();
      await page.getByTestId("pe-name").fill("TEST PDP Tabs Áo Một");
      await expect(page.getByTestId("pe-slug")).toHaveValue(`${PREFIX}ao-mot`);
      await page.getByTestId("pe-tab-details").click();
      await expect(page.getByTestId("pe-detail-bullets-input").first()).toHaveValue("Form rộng, thoải mái vận động");
      await expect(page.getByTestId("pe-origin")).toHaveValue("Việt Nam");
      await expect(page.getByTestId("pe-thickness")).toHaveValue("Trung bình");
      await fillAndSave(page);
      const plain = await readTabs(page, `${PREFIX}ao-mot`);
      expect(plain.details).toContain("Form rộng, thoải mái vận động");
      expect(plain.details).toContain("Chất nỉ mềm, dày dặn, giữ form tốt");
      expect(plain.details).toContain("Xuất xứ: Việt Nam");
      expect(plain.details).toContain("Độ dày: Trung bình");
      expect(plain.material).toContain("Chất liệu: Cotton / nỉ cao cấp");
      expect(plain.size).toContain("98–102");
      expect(plain.size).toContain("Form oversize — nếu thích mặc vừa, chọn nhỏ hơn 1 size.");
      expect(plain.shipping).toContain("Giao hàng toàn quốc 2–5 ngày làm việc");

      await page.goto("/admin/products/new");
      await page.getByTestId("pe-name").fill("TEST PDP Tabs Áo Hai");
      await fillAndSave(page);

      const again = await (await page.request.get("/api/admin/products")).json();
      const edited = (again.products as { id: string; slug: string }[]).find((p) => p.slug === `${PREFIX}ao-mot`);
      expect(edited).toBeTruthy();
      await page.goto(`/admin/products/${edited!.id}`);
      await expect(page.getByTestId("pe-origin")).toBeVisible({ timeout: 20_000 });

      await page.getByTestId("pe-tab-details").click();
      const details = page.getByTestId("pe-detail-bullets");
      await details.getByTestId("pe-detail-bullets-input").nth(1).fill("Dòng chi tiết TEST đã sửa");
      await details.getByRole("button", { name: "Lên dòng 2" }).click();
      await details.getByTestId("pe-detail-bullets-add").click();
      const detailInputs = details.getByTestId("pe-detail-bullets-input");
      await detailInputs.nth((await detailInputs.count()) - 1).fill("Dòng thêm <script>alert(1)</script>an toàn");
      await details.getByRole("button", { name: "Xóa dòng 3" }).click();
      await page.getByTestId("pe-origin").fill("Nhật Bản");
      await page.getByTestId("pe-thickness").fill("Dày đặc biệt");
      await shot(page, "02-admin-details.png");

      await page.getByTestId("pe-tab-material").click();
      await page.getByTestId("pe-material-bullets-input").first().fill("Vải TEST lanh mát");
      await shot(page, "03-admin-material.png");

      await page.getByTestId("pe-tab-size").click();
      await page.getByTestId("pe-size-col").nth(0).fill("Cỡ");
      await page.getByTestId("pe-size-cell").nth(1).fill("90–95");
      await page.getByTestId("pe-size-note").fill("Ghi chú size TEST riêng");
      await shot(page, "04-admin-size.png");

      await page.getByTestId("pe-tab-shipping").click();
      await page.getByTestId("pe-shipping-bullets-input").first().fill("Giao TEST trong 1 ngày");
      await shot(page, "05-admin-shipping.png");

      const saved = page.waitForResponse(
        (r) => r.url().includes("/api/admin/products") && r.request().method() === "PUT",
      );
      await page.getByTestId("pe-save").click();
      expect((await saved).ok()).toBeTruthy();
      await expect(page.getByTestId("pe-error")).toHaveCount(0);

      await page.reload();
      await expect(page.getByTestId("pe-origin")).toHaveValue("Nhật Bản", { timeout: 20_000 });
      await page.getByTestId("pe-tab-details").click();
      await expect(page.getByTestId("pe-detail-bullets-input").first()).toHaveValue("Dòng chi tiết TEST đã sửa");
      await expect(page.getByTestId("pe-thickness")).toHaveValue("Dày đặc biệt");
      await page.getByTestId("pe-tab-material").click();
      await expect(page.getByTestId("pe-material-bullets-input").first()).toHaveValue("Vải TEST lanh mát");
      await page.getByTestId("pe-tab-size").click();
      await expect(page.getByTestId("pe-size-col").first()).toHaveValue("Cỡ");
      await expect(page.getByTestId("pe-size-note")).toHaveValue("Ghi chú size TEST riêng");
      await page.getByTestId("pe-tab-shipping").click();
      await expect(page.getByTestId("pe-shipping-bullets-input").first()).toHaveValue("Giao TEST trong 1 ngày");

      const custom = await readTabs(page, `${PREFIX}ao-mot`);
      expect(custom.details.indexOf("Dòng chi tiết TEST đã sửa")).toBeGreaterThanOrEqual(0);
      expect(custom.details.indexOf("Dòng chi tiết TEST đã sửa")).toBeLessThan(custom.details.indexOf("Form rộng"));
      expect(custom.details).toContain("alert(1)an toàn");
      expect(custom.details).not.toContain("<script");
      expect(custom.details).not.toContain("Phong cách unisex");
      expect(custom.details).toContain("Xuất xứ: Nhật Bản");
      expect(custom.details).toContain("Độ dày: Dày đặc biệt");
      expect(custom.material).toContain("Vải TEST lanh mát");
      expect(custom.size).toContain("Cỡ");
      expect(custom.size).toContain("90–95");
      expect(custom.size).toContain("Ghi chú size TEST riêng");
      expect(custom.shipping).toContain("Giao TEST trong 1 ngày");
      expect(custom.shipping).not.toContain("Giao hàng toàn quốc 2–5 ngày làm việc");
      await page.getByTestId("pdp-tab-details").click();
      await shot(page, "06-pdp-details.png");
      await page.getByTestId("pdp-tab-material").click();
      await shot(page, "07-pdp-material.png");
      await page.getByTestId("pdp-tab-size").click();
      await shot(page, "08-pdp-size.png");
      await page.getByTestId("pdp-tab-shipping").click();
      await shot(page, "09-pdp-shipping.png");

      const untouched = await readTabs(page, `${PREFIX}ao-hai`);
      expect(untouched.details).toContain("Form rộng, thoải mái vận động");
      expect(untouched.details).toContain("Phong cách unisex, dễ phối mỗi ngày");
      expect(untouched.details).toContain("Xuất xứ: Việt Nam");
      expect(untouched.material).toContain("Cotton / nỉ cao cấp");
      expect(untouched.size).toContain("98–102");
      expect(untouched.size).not.toContain("90–95");
      expect(untouched.shipping).toContain("Giao hàng toàn quốc 2–5 ngày làm việc");
      expect(untouched.shipping).not.toContain("Giao TEST trong 1 ngày");

      const mid = await readTabs(page, existing!.slug);
      expect(mid).toEqual(before);

      await page.goto("/admin/giao-dien");
      await expect(page.getByTestId("cms-shipping-policy")).toBeVisible({ timeout: 20_000 });
      await page.getByTestId("cms-shipping-bullets-input").first().fill("Giao SITE TEST 9 ngày");
      const siteSaved = page.waitForResponse(
        (r) => r.url().includes("/api/admin/shipping-policy") && r.request().method() === "PUT",
      );
      await page.getByTestId("cms-shipping-save").click();
      expect((await siteSaved).ok()).toBeTruthy();
      await shot(page, "10-admin-shipping-site.png");

      const siteOnPlain = await readTabs(page, `${PREFIX}ao-hai`);
      expect(siteOnPlain.shipping).toContain("Giao SITE TEST 9 ngày");
      expect(siteOnPlain.details).toContain("Form rộng, thoải mái vận động");
      const siteOnCustom = await readTabs(page, `${PREFIX}ao-mot`);
      expect(siteOnCustom.shipping).toContain("Giao TEST trong 1 ngày");
      expect(siteOnCustom.shipping).not.toContain("Giao SITE TEST 9 ngày");

      await page.goto("/admin/giao-dien");
      const siteReset = page.waitForResponse(
        (r) => r.url().includes("/api/admin/shipping-policy") && r.request().method() === "PUT",
      );
      await page.getByTestId("cms-shipping-reset").click();
      expect((await siteReset).ok()).toBeTruthy();
      const restored = await readTabs(page, `${PREFIX}ao-hai`);
      expect(restored.shipping).toContain("Giao hàng toàn quốc 2–5 ngày làm việc");
      expect(restored.shipping).not.toContain("Giao SITE TEST 9 ngày");
      const after = await readTabs(page, existing!.slug);
      expect(after).toEqual(before);
      await shot(page, "13-untouched-pdp-after.png");

      for (const width of [414, 390, 320]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`/admin/products/${edited!.id}`);
        await expect(page.getByTestId("pe-tab-fields")).toBeVisible({ timeout: 20_000 });
        for (const id of ["details", "material", "size", "shipping"]) {
          await page.getByTestId(`pe-tab-${id}`).click();
          await noOverflow(page);
        }
        await shot(page, `11-admin-mobile-${width}.png`);
        await page.goto(`/san-pham/${PREFIX}ao-mot`);
        for (const [id] of TABS) {
          await page.getByTestId(`pdp-tab-${id}`).click();
          await noOverflow(page);
        }
        await shot(page, `11-pdp-mobile-${width}.png`);
      }
    } finally {
      await putPolicy(page, originalPolicy);
      await deleteTestProducts(page);
    }
  });

  test("editor and PDP do not overflow the device viewport", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium", "explicit widths run in the edit test");
    test.setTimeout(120_000);
    await adminLogin(page);
    await page.goto("/admin/products/new");
    await expect(page.getByTestId("pe-tab-fields")).toBeVisible({ timeout: 20_000 });
    for (const id of ["details", "material", "size", "shipping"]) {
      await page.getByTestId(`pe-tab-${id}`).click();
      await noOverflow(page);
    }
    await shot(page, `14-new-editor-${testInfo.project.name}.png`);
    await page.goto("/san-pham/ao-hoodie-essential");
    if (page.url().includes("ao-hoodie-essential")) {
      for (const [id] of TABS) {
        await page.getByTestId(`pdp-tab-${id}`).click();
        await noOverflow(page);
      }
      await shot(page, `14-pdp-${testInfo.project.name}.png`);
    }
  });
});
