import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanDb, resetTestDb, seedMinimal } from "./helpers";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { firstColorPhotoIndex, isVideoMedia, mediaForColor, normalizeHex, primaryImage } from "@/lib/product-media";
import { saveProductFull } from "@/lib/product-save";
import {
  buildSavePayload,
  colorsFromApi,
  makeMain,
  mediaFromApi,
  movePhoto,
  type EditorMedia,
} from "@/components/admin/product-editor/editor-state";
import { GET as productsGET, PUT as productsPUT } from "@/app/api/admin/products/route";

const prisma = new PrismaClient();

const img = (n: number, color: string | null = null) => ({ url: `/uploads/t${n}.jpg`, type: "image", color });
const vid = { url: "/uploads/v.mp4", type: "video", color: null };

function basePayload(over: Record<string, unknown> = {}) {
  return {
    name: "TEST Media Product",
    slug: "test-media-product",
    gender: "UNISEX",
    media: [
      { url: "/uploads/v.mp4", type: "video" },
      ...[1, 2, 3, 4, 5].map((n) => ({ url: `/uploads/t${n}.jpg`, type: "image", color: n <= 2 ? "Đen" : n <= 4 ? "Kem" : "Xanh rêu" })),
    ],
    variants: [
      ...["S", "M"].map((s) => ({ color: "Đen", colorHex: "#111111", size: s, price: 300000, stock: 3 })),
      ...["M", "L"].map((s) => ({ color: "Kem", colorHex: "#E8DCC8", size: s, price: 300000, stock: 4 })),
      { color: "Xanh rêu", colorHex: "#4B5D3A", size: "XL", price: 320000, stock: 0 },
    ],
    ...over,
  };
}

const put = (body: unknown) =>
  productsPUT(new Request("http://localhost/api/admin/products", { method: "PUT", body: JSON.stringify(body) }));

beforeAll(() => resetTestDb());
beforeEach(async () => {
  authMock.mockReset();
  await cleanDb(prisma);
  await seedMinimal(prisma);
});
afterAll(async () => prisma.$disconnect());

describe("media helpers", () => {
  it("detects video by type or extension", () => {
    expect(isVideoMedia({ url: "/uploads/a.mp4", type: "image" })).toBe(true);
    expect(isVideoMedia({ url: "/uploads/a.webm?x=1" })).toBe(true);
    expect(isVideoMedia({ url: "/uploads/a.png", type: "video" })).toBe(true);
    expect(isVideoMedia({ url: "/uploads/a.png", type: "image" })).toBe(false);
  });

  it("primaryImage never returns a video or a hidden row (root cause of broken cards)", () => {
    const list = [vid, { ...img(9), isHidden: true }, img(1, "Đen"), img(2, "Kem")];
    expect(primaryImage(list)?.url).toBe("/uploads/t1.jpg");
    expect(primaryImage(list, "Kem")?.url).toBe("/uploads/t2.jpg");
    expect(primaryImage([vid])).toBeUndefined();
  });

  it("mediaForColor shows ALL visible media: video first, then the colour's photos, shared, other colours", () => {
    const list = [img(1, "Đen"), img(2, "Kem"), vid, img(3, null), { ...img(4), isHidden: true }];
    expect(mediaForColor(list, "Đen").map((m) => m.url)).toEqual(["/uploads/v.mp4", "/uploads/t1.jpg", "/uploads/t3.jpg", "/uploads/t2.jpg"]);
    expect(mediaForColor(list, "Kem").map((m) => m.url)).toEqual(["/uploads/v.mp4", "/uploads/t2.jpg", "/uploads/t3.jpg", "/uploads/t1.jpg"]);
    expect(mediaForColor(list).map((m) => m.url)).toEqual(["/uploads/v.mp4", "/uploads/t1.jpg", "/uploads/t2.jpg", "/uploads/t3.jpg"]);
    expect(firstColorPhotoIndex(mediaForColor(list, "Kem"), "Kem")).toBe(1);
    expect(firstColorPhotoIndex(mediaForColor(list, "Tím"), "Tím")).toBe(0);
  });

  it("a shared cover that is also tagged for a colour is shown once and counts as that colour", () => {
    const list = [{ url: "/n.jpg", color: null }, { url: "/n.jpg", color: "Nâu" }, { url: "/d.jpg", color: "Đen" }];
    expect(mediaForColor(list, "Đen").map((m) => m.url)).toEqual(["/d.jpg", "/n.jpg"]);
    expect(mediaForColor(list, "Nâu").map((m) => m.url)).toEqual(["/n.jpg", "/d.jpg"]);
  });

  it("normalizes hex", () => {
    expect(normalizeHex("#111")).toBe("#111111");
    expect(normalizeHex("#6b4423")).toBe("#6B4423");
    expect(normalizeHex("red")).toBe("#CCCCCC");
  });
});

describe("editor state", () => {
  const m = (k: string, type: "image" | "video" = "image"): EditorMedia => ({
    key: k, url: `/${k}`, alt: "", color: "", type, posterUrl: "", isHidden: false,
  });

  it("reorders photos, sets main image, keeps video first", () => {
    const list = [m("v", "video"), m("a"), m("b"), m("c")];
    expect(movePhoto(list, "b", -1).map((x) => x.key)).toEqual(["v", "b", "a", "c"]);
    expect(movePhoto(list, "a", -1)).toBe(list);
    expect(makeMain(list, "c").map((x) => x.key)).toEqual(["v", "c", "a", "b"]);
    const payload = buildSavePayload({}, [m("a"), m("v", "video")], []);
    expect(payload.media.map((x) => x.type)).toEqual(["video", "image"]);
  });

  it("groups variants by colour and sorts sizes", () => {
    const colors = colorsFromApi({
      id: "p",
      variants: [
        { id: "1", color: "Đen", colorHex: "#111", size: "XL", price: 1, stock: 1 },
        { id: "2", color: "Kem", colorHex: "#E8DCC8", size: "M", price: 1, stock: 1 },
        { id: "3", color: "Đen", colorHex: "#111", size: "S", price: 1, stock: 1 },
      ],
    });
    expect(colors.map((c) => c.name)).toEqual(["Đen", "Kem"]);
    expect(colors[0].hex).toBe("#111111");
    expect(colors[0].sizes.map((s) => s.size)).toEqual(["S", "XL"]);
    expect(mediaFromApi({ id: "p", images: [{ url: "/x.mp4" }] })[0].type).toBe("video");
  });
});

describe("saveProductFull (DB)", () => {
  it("creates a product with 5 images, 1 video and 3 colours, all persisted in order", async () => {
    const { productId } = await saveProductFull(prisma, basePayload());
    const p = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
    });
    expect(p.images.map((i) => i.url)).toEqual([
      "/uploads/v.mp4", "/uploads/t1.jpg", "/uploads/t2.jpg", "/uploads/t3.jpg", "/uploads/t4.jpg", "/uploads/t5.jpg",
    ]);
    expect(p.images[0].type).toBe("video");
    expect(p.images.filter((i) => i.color === "Kem").length).toBe(2);
    expect(new Set(p.variants.map((v) => v.color))).toEqual(new Set(["Đen", "Kem", "Xanh rêu"]));
    expect(p.variants.find((v) => v.color === "Xanh rêu")?.colorHex).toBe("#4B5D3A");
    expect(p.variants.find((v) => v.color === "Kem" && v.size === "L")?.stock).toBe(4);
    expect(new Set(p.variants.map((v) => v.sku)).size).toBe(5);
  });

  it("edit: reorder, delete + re-add, change main image; ids stay stable", async () => {
    const { productId } = await saveProductFull(prisma, basePayload());
    const before = await prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
    const variants = await prisma.productVariant.findMany({ where: { productId } });
    const photos = before.filter((i) => i.type === "image");
    // new order: t3 main, t1, t4, t5 ; t2 deleted then re-added at the end (new row)
    const media = [
      before[0],
      photos[2], photos[0], photos[3], photos[4],
      { url: photos[1].url, type: "image", color: "Đen" },
    ].map((m) => ({ id: "id" in m ? m.id : undefined, url: m.url, type: m.type as "image" | "video", color: m.color }));
    await saveProductFull(prisma, basePayload({
      id: productId,
      media,
      variants: variants.map((v) => ({ id: v.id, color: v.color, colorHex: v.colorHex!, size: v.size, price: v.price, stock: v.stock + 1 })),
    }));
    const after = await prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
    expect(after.map((i) => i.url)).toEqual([
      "/uploads/v.mp4", "/uploads/t3.jpg", "/uploads/t1.jpg", "/uploads/t4.jpg", "/uploads/t5.jpg", "/uploads/t2.jpg",
    ]);
    expect(after[1].id).toBe(photos[2].id);
    expect(after[5].id).not.toBe(photos[1].id);
    const v2 = await prisma.productVariant.findMany({ where: { productId } });
    expect(v2.map((v) => v.id).sort()).toEqual(variants.map((v) => v.id).sort());
    expect(v2.every((v) => v.stock >= 1)).toBe(true);
  });

  it("removing a variant that has orders keeps it (stock 0) instead of deleting order history", async () => {
    const { productId } = await saveProductFull(prisma, basePayload());
    const sold = await prisma.productVariant.findFirstOrThrow({ where: { productId, color: "Đen", size: "S" } });
    const user = await prisma.user.findFirstOrThrow();
    await prisma.order.create({
      data: {
        orderNumber: "T-ORDER-MEDIA-1",
        userId: user.id,
        customerName: "Test",
        customerPhone: "0900000000",
        address: "Test",
        subtotal: 1,
        total: 1,
        items: { create: [{ variantId: sold.id, name: "x", color: "Đen", size: "S", price: 1, quantity: 1 }] },
      },
    });
    const res = await saveProductFull(prisma, basePayload({
      id: productId,
      variants: basePayload().variants.filter((v) => !(v.color === "Đen" && v.size === "S")),
    }));
    expect(res.keptVariantIds).toEqual([sold.id]);
    const still = await prisma.productVariant.findUnique({ where: { id: sold.id } });
    expect(still?.stock).toBe(0);
  });

  it("rejects combined sizes, bad hex, duplicate colour+size, video saved as image, no photo, unsafe url", async () => {
    const bad = [
      basePayload({ variants: [{ color: "Đen", colorHex: "#111111", size: "M/S/XL", price: 1, stock: 1 }] }),
      basePayload({ variants: [{ color: "Đen", colorHex: "#111", size: "M", price: 1, stock: 1 }] }),
      basePayload({ variants: [{ color: "Đen", colorHex: "#111111", size: "M", price: 1, stock: 1 }, { color: "Đen", colorHex: "#111111", size: "m", price: 1, stock: 1 }] }),
      basePayload({ media: [{ url: "/uploads/a.mp4", type: "image" }, { url: "/uploads/b.jpg", type: "image" }] }),
      basePayload({ media: [{ url: "/uploads/a.mp4", type: "video" }] }),
      basePayload({ media: [{ url: "javascript:alert(1)", type: "image" }] }),
      basePayload({ media: [{ url: "https://evil.example/x.jpg", type: "image" }] }),
    ];
    for (const b of bad) await expect(saveProductFull(prisma, b)).rejects.toThrow();
    expect(await prisma.product.count({ where: { slug: "test-media-product" } })).toBe(0);
  });

  it("keeps an Unsplash URL already stored and rejects a new external URL", async () => {
    const { productId } = await saveProductFull(prisma, basePayload());
    const kept = "https://images.unsplash.com/photo-kept?auto=format&fit=crop&w=800&q=80";
    await prisma.productImage.create({
      data: { productId, url: kept, alt: "ảnh cũ", sortOrder: 9 },
    });
    await expect(
      saveProductFull(
        prisma,
        basePayload({
          id: productId,
          media: [
            { url: kept, type: "image" },
            { url: "/uploads/t1.jpg", type: "image" },
          ],
        }),
      ),
    ).resolves.toMatchObject({ productId });
    const fresh = "https://images.unsplash.com/photo-new";
    await expect(
      saveProductFull(
        prisma,
        basePayload({
          id: productId,
          media: [
            { url: fresh, type: "image" },
            { url: "/uploads/t1.jpg", type: "image" },
          ],
        }),
      ),
    ).rejects.toThrow(/cdn\.vietqr\.io/);
    await expect(
      saveProductFull(prisma, basePayload({ media: [{ url: fresh, type: "image" }] })),
    ).rejects.toThrow();
    expect(await prisma.product.count({ where: { slug: "test-media-product" } })).toBe(1);
  });

  it("slug conflict → saved with a unique suffix, the other product is untouched", async () => {
    const before = await prisma.product.findUniqueOrThrow({ where: { slug: "test-tee" } });
    const { productId } = await saveProductFull(prisma, basePayload({ slug: "test-tee" }));
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).slug).toBe("test-tee-2");
    expect((await prisma.product.findUniqueOrThrow({ where: { id: before.id } })).slug).toBe("test-tee");
  });
});

describe("PUT/GET /api/admin/products", () => {
  it("requires admin", async () => {
    authMock.mockResolvedValue(null);
    expect((await put(basePayload())).status).toBe(401);
    authMock.mockResolvedValue({ user: { id: "c1", role: "CUSTOMER" } });
    expect((await put(basePayload())).status).toBe(403);
  });

  it("admin saves and reloads the same data (persist after reload)", async () => {
    const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
    authMock.mockResolvedValue({ user: { id: admin.id, role: "ADMIN" } });
    const res = await put(basePayload());
    expect(res.status).toBe(200);
    const { product } = await res.json();
    const reload = await productsGET(new Request(`http://localhost/api/admin/products?id=${product.id}`));
    const data = await reload.json();
    expect(data.product.images).toHaveLength(6);
    expect(data.product.variants).toHaveLength(5);
    const bad = await put(basePayload({ id: product.id, variants: [{ color: "A", colorHex: "zzz", size: "M", price: 1, stock: 1 }] }));
    expect(bad.status).toBe(400);
    const again = await (await productsGET(new Request(`http://localhost/api/admin/products?id=${product.id}`))).json();
    expect(again.product.variants).toHaveLength(5);
  });
});
