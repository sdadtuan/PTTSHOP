import { expect, test } from "@playwright/test";

test("demo-v2 responds with 404", async ({ page }) => {
  const response = await page.goto("/demo-v2");
  expect(response?.status()).toBe(404);
});
