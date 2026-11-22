import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { saveProductFull } from "@/lib/product-save";
import { GET as shippingGET, PUT as shippingPUT } from "@/app/api/admin/shipping-policy/route";
import {
  addSizeColumn,
  cloneSizeChart,
  defaultDetailBullets,
  defaultMaterialBullets,
  draftFromProduct,
  moveSizeColumn,
  normalizeBulletsForSave,
  parseBulletList,
  parseSizeChart,
  removeSizeColumn,
  resolvePdpTabs,
  tabPayload,
  DEFAULT_SHIPPING_BULLETS,
  DEFAULT_SIZE_CHART,
} from "@/lib/pdp-tabs";

const prisma = new PrismaClient();

function payload(over: Record<string, unknown> = {}) {
  return {
    name: "TEST PDP Tabs",
    slug: "test-pdp-tabs",
    gender: "UNISEX",
    media: [{ url: "/uploads/pdp-tabs.jpg", type: "image" }],
    variants: [{ color: "Đen", colorHex: "#111111", size: "M", price: 100000, stock: 2 }],
    ...over,
  };
}

beforeAll(() => resetTestDb());
beforeEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
  await cleanDb(prisma);
  await seedMinimal(prisma);
});
afterAll(async () => prisma.$disconnect());

describe("pdp tab defaults", () => {
  it("matches the copy the product page used to hardcode", () => {
    const resolved = resolvePdpTabs({ fit: "One size", material: null, origin: null, thickness: null });
    expect(resolved.detailCustom).toBe(false);
    expect(resolved.detailBullets).toEqual([
      "Form One size, thoải mái vận động",
      "Chất nỉ mềm, dày dặn, giữ form tốt",
      "Phong cách unisex, dễ phối mỗi ngày",
    ]);
    expect(resolved.origin).toBe("Việt Nam");
    expect(resolved.thickness).toBe("Trung bình");
    expect(resolved.materialBullets[0]).toBe("Chất liệu: Cotton / nỉ cao cấp");
    expect(resolved.sizeCustom).toBe(false);
    expect(resolved.sizeChart.columns).toEqual(DEFAULT_SIZE_CHART.columns);
    expect(resolved.sizeChart.rows[0]).toEqual(["S", "98–102", "68", "44"]);
    expect(resolved.shippingCustom).toBe(false);
    expect(resolved.shippingBullets).toEqual(DEFAULT_SHIPPING_BULLETS);
    expect(defaultDetailBullets("")).toEqual(defaultDetailBullets(null));
    expect(defaultMaterialBullets("Nỉ cotton")[0]).toBe("Chất liệu: Nỉ cotton");
  });

  it("strips tags and ignores invalid JSON", () => {
    expect(normalizeBulletsForSave(["  <b>Đậm</b>  ", "<script>alert(1)</script>Xin chào", ""])).toEqual([
      "Đậm",
      "alert(1)Xin chào",
    ]);
    expect(parseBulletList(null)).toBeNull();
    expect(parseBulletList("not-json")).toBeNull();
    expect(parseBulletList("[1,2]")).toBeNull();
    expect(parseBulletList('["<img src=x onerror=alert(1)>An toàn"]')).toEqual(["An toàn"]);
    expect(parseSizeChart("{")).toBeNull();
  });

  it("reorders size columns together with their cells", () => {
    const chart = addSizeColumn(cloneSizeChart());
    chart.rows[0][chart.columns.length - 1] = "tay";
    const moved = moveSizeColumn(chart, chart.columns.length - 1, -1);
    expect(moved.columns.at(-2)).toBe("Cột mới");
    expect(moved.rows[0].at(-2)).toBe("tay");
    expect(removeSizeColumn(moved, 0).columns[0]).toBe(moved.columns[1]);
    expect(removeSizeColumn(cloneSizeChart(), 0).columns).toHaveLength(3);
  });

  it("keeps generated copy until a list is actually edited", () => {
    const draft = draftFromProduct({ fit: "Oversize", material: "Cotton", origin: "Việt Nam", thickness: "Dày vừa" }, []);
    expect(draft.detailTouched).toBe(false);
    expect(draft.detailBullets[0]).toBe("Form Oversize, thoải mái vận động");
    expect(tabPayload(draft).detailBullets).toBeNull();
    expect(tabPayload(draft).origin).toBe("Việt Nam");
    const custom = tabPayload({ ...draft, detailTouched: true, detailBullets: ["<i>Một dòng</i>"] });
    expect(custom.detailBullets).toEqual(["Một dòng"]);
  });
});

describe("pdp tab persistence", () => {
  it("leaves new columns null until a save sends them, then keeps them when a later save omits them", async () => {
    const created = await saveProductFull(prisma, payload());
    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: created.productId } });
    expect(fresh.detailBulletsJson).toBeNull();
    expect(fresh.materialBulletsJson).toBeNull();
    expect(fresh.sizeChartJson).toBeNull();
    expect(fresh.shippingOverrideJson).toBeNull();

    await saveProductFull(
      prisma,
      payload({
        id: created.productId,
        origin: "<b>Nhật Bản</b>",
        thickness: "Dày",
        detailBullets: ["Dòng A", "<script>x</script>Dòng B"],
        materialBullets: ["Vải lanh"],
        sizeChart: {
          columns: ["Cỡ", "Ngực"],
          rows: [["S", "90"]],
          note: "Ghi chú <b>TEST</b>",
        },
        shippingBullets: ["Giao trong ngày"],
      }),
    );
    const saved = await prisma.product.findUniqueOrThrow({ where: { id: created.productId } });
    expect(saved.origin).toBe("Nhật Bản");
    expect(saved.thickness).toBe("Dày");
    expect(parseBulletList(saved.detailBulletsJson)).toEqual(["Dòng A", "xDòng B"]);
    expect(parseBulletList(saved.materialBulletsJson)).toEqual(["Vải lanh"]);
    expect(parseSizeChart(saved.sizeChartJson)).toMatchObject({
      columns: ["Cỡ", "Ngực"],
      rows: [["S", "90"]],
      note: "Ghi chú TEST",
    });
    expect(parseBulletList(saved.shippingOverrideJson)).toEqual(["Giao trong ngày"]);

    await saveProductFull(prisma, payload({ id: created.productId, name: "TEST PDP Tabs Đổi tên" }));
    const kept = await prisma.product.findUniqueOrThrow({ where: { id: created.productId } });
    expect(kept.name).toBe("TEST PDP Tabs Đổi tên");
    expect(kept.detailBulletsJson).toBe(saved.detailBulletsJson);
    expect(kept.shippingOverrideJson).toBe(saved.shippingOverrideJson);

    const shown = resolvePdpTabs(kept, null);
    expect(shown.detailBullets[0]).toBe("Dòng A");
    expect(shown.shippingBullets).toEqual(["Giao trong ngày"]);

    await saveProductFull(
      prisma,
      payload({
        id: created.productId,
        detailBullets: null,
        materialBullets: null,
        sizeChart: null,
        shippingBullets: null,
      }),
    );
    const cleared = await prisma.product.findUniqueOrThrow({ where: { id: created.productId } });
    expect(cleared.detailBulletsJson).toBeNull();
    expect(cleared.sizeChartJson).toBeNull();
    expect(cleared.shippingOverrideJson).toBeNull();
    expect(resolvePdpTabs(cleared).detailCustom).toBe(false);
  });

  it("stores a site-wide shipping policy and falls back when it is cleared", async () => {
    const put = (body: unknown) =>
      shippingPUT(
        new Request("http://localhost/api/admin/shipping-policy", {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      );
    const saved = await put({ bullets: ["<b>Giao</b> site", "Đổi trong 7 ngày"] });
    expect(saved.status).toBe(200);
    const body = await saved.json();
    expect(body.bullets).toEqual(["Giao site", "Đổi trong 7 ngày"]);
    const row = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } });
    expect(row.brandName).toBe("PTT Shop");
    expect(parseBulletList(row.shippingPolicyJson)).toEqual(["Giao site", "Đổi trong 7 ngày"]);

    const read = await shippingGET();
    expect((await read.json()).effective[0]).toBe("Giao site");

    const cleared = await put({ bullets: null });
    expect((await cleared.json()).bullets).toBeNull();
    const after = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } });
    expect(after.shippingPolicyJson).toBeNull();
  });
});
