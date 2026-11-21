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

test.describe("Admin product image React keys", () => {
  test("hoodie Nâu edit page has no duplicate React key warning", async ({
    page,
  }) => {
    const keyWarnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error" && msg.type() !== "warning") return;
      const text = msg.text();
      if (/two children with the same key/i.test(text)) {
        keyWarnings.push(text);
      }
    });

    await loginAdmin(page);

    const res = await page.request.get("/api/admin/products");
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()) as {
      products?: Array<{ id: string; slug: string; name: string }>;
    };
    const product =
      data.products?.find((p) => p.slug === "ao-hoodie-brown-layer") ||
      data.products?.find((p) => /nâu|nau|brown/i.test(`${p.slug} ${p.name}`));
    expect(product, "hoodie Nâu product").toBeTruthy();

    await page.goto(`/admin/products/${product!.id}`);
    await expect(
      page.getByRole("heading", { name: /Sửa sản phẩm|Chỉnh sửa/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Ảnh sản phẩm/i)).toBeVisible();

    await page.waitForTimeout(800);
    expect(keyWarnings).toEqual([]);
  });
});
