import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";
import { DEFAULT_STOREFRONT_UI } from "@/lib/storefront/ui-copy-types";
import { parseStorefrontUi } from "@/lib/storefront/ui-copy-validate";
import { ensureStorefrontUiSeeded, getStorefrontUi } from "@/lib/storefront/ui-copy";

const prisma = new PrismaClient();

beforeAll(() => {
  resetTestDb();
});

beforeEach(async () => {
  await cleanDb(prisma);
  await seedMinimal(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("storefront UI copy", () => {
  it("default copy passes validation", () => {
    expect(parseStorefrontUi(DEFAULT_STOREFRONT_UI)).toEqual(DEFAULT_STOREFRONT_UI);
  });

  it("drops demo login hints from published copy sent to the client", () => {
    const parsed = parseStorefrontUi({
      auth: {
        loginDemoHint: "Demo: khach@vizfas.vn / khach123 hoặc admin@vizfas.vn / admin123",
        loginAdminWarning: "Đổi mật khẩu admin@vizfas.vn / admin123",
        loginTitle: "Đăng nhập",
      },
    });
    const json = JSON.stringify(parsed);
    expect(parsed.auth).not.toHaveProperty("loginDemoHint");
    expect(parsed.auth).not.toHaveProperty("loginAdminWarning");
    expect(json).not.toContain("khach123");
    expect(json).not.toContain("admin123");
    expect(json).not.toContain("khach@vizfas.vn");
    expect(json).not.toContain("admin@vizfas.vn");
  });

  it("seeds published draft matching defaults", async () => {
    await ensureStorefrontUiSeeded();
    const ui = await getStorefrontUi("published");
    expect(ui.contact.title).toBe("Liên hệ");
    expect(ui.cart.checkoutCta).toBe("Thanh toán");
    expect(ui.pdp.addToCart).toBe("Thêm vào giỏ hàng");
  });
});