import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { HEX_RE, isVideoMedia, skuPart } from "@/lib/product-media";
import { sanitizePlainText } from "@/lib/cms/validate";
import { bulletsToJson, sizeChartToJson, type SizeChart } from "@/lib/pdp-tabs";
import { slugify, uniqueSlug } from "@/lib/slug";

/**
 * Full product save (basic info + all media + all colour/size variants) in one
 * transaction. Used by the admin product editor for both create and edit so
 * images, video and variants are always persisted together.
 */

const mediaUrl = z
  .string()
  .trim()
  .min(1)
  .refine(
    (u) =>
      (u.startsWith("/") && !u.startsWith("//") && !/[\s"'()<>\\]/.test(u)) ||
      u.startsWith("https://images.unsplash.com/"),
    "URL ảnh/video không hợp lệ (chỉ /media, /uploads, /images, /videos hoặc images.unsplash.com)",
  );

export const mediaInputSchema = z.object({
  id: z.string().optional(),
  url: mediaUrl,
  alt: z.string().max(200).optional().nullable(),
  color: z.string().max(60).optional().nullable(),
  type: z.enum(["image", "video"]).default("image"),
  posterUrl: mediaUrl.optional().nullable().or(z.literal("")),
  isHidden: z.boolean().optional().default(false),
});

export const variantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().optional().nullable(),
  color: z.string().trim().min(1, "Thiếu tên màu").max(60),
  colorHex: z.string().regex(HEX_RE, "Mã màu phải dạng #RRGGBB"),
  size: z
    .string()
    .trim()
    .min(1, "Thiếu size")
    .max(12)
    .refine((s) => !/[\/,;]/.test(s), "Mỗi size phải nhập riêng (không dùng / hoặc ,)"),
  price: z.number().int().positive(),
  compareAt: z.number().int().positive().optional().nullable(),
  costPrice: z.number().int().positive().optional().nullable(),
  stock: z.number().int().nonnegative(),
});

export const productSaveSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2),
    // Optional: empty/invalid → generated from the name; duplicates get -2, -3… (see resolveProductSlug)
    slug: z.string().trim().max(300).optional().nullable(),
    description: z.string().optional().nullable(),
    material: z.string().optional().nullable(),
    fit: z.string().optional().nullable(),
    origin: z.union([z.string().max(200), z.null()]).optional(),
    thickness: z.union([z.string().max(200), z.null()]).optional(),
    detailBullets: z.union([z.array(z.string().max(2000)).max(30), z.null()]).optional(),
    materialBullets: z.union([z.array(z.string().max(2000)).max(30), z.null()]).optional(),
    sizeChart: z
      .union([
        z.object({
          columns: z.array(z.string().max(200)).min(1).max(8),
          rows: z.array(z.array(z.string().max(200))).min(1).max(40),
          note: z.string().max(500).optional(),
        }),
        z.null(),
      ])
      .optional(),
    shippingBullets: z.union([z.array(z.string().max(2000)).max(30), z.null()]).optional(),
    gender: z.enum(["MALE", "FEMALE", "UNISEX"]).default("UNISEX"),
    saleStatus: z.enum(["DRAFT", "SELLING", "HIDDEN", "DISCONTINUED"]).optional(),
    categoryId: z.string().optional().nullable(),
    isFeatured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    media: z.array(mediaInputSchema).max(60),
    variants: z.array(variantInputSchema).min(1, "Cần ít nhất 1 màu + size").max(200),
  })
  .superRefine((p, ctx) => {
    const seen = new Set<string>();
    const hexByColor = new Map<string, string>();
    p.variants.forEach((v, i) => {
      const key = `${v.color.toLowerCase()}|${v.size.toUpperCase()}`;
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", path: ["variants", i, "size"], message: `Trùng màu + size: ${v.color} / ${v.size}` });
      }
      seen.add(key);
      const prev = hexByColor.get(v.color);
      if (prev && prev.toLowerCase() !== v.colorHex.toLowerCase()) {
        ctx.addIssue({ code: "custom", path: ["variants", i, "colorHex"], message: `Màu ${v.color} có 2 mã màu khác nhau` });
      }
      hexByColor.set(v.color, v.colorHex);
    });
    if (!p.media.some((m) => m.type === "image" && !isVideoMedia(m) && !m.isHidden)) {
      ctx.addIssue({ code: "custom", path: ["media"], message: "Cần ít nhất 1 ảnh sản phẩm (không tính video)" });
    }
    p.media.forEach((m, i) => {
      if (m.type === "image" && isVideoMedia({ url: m.url })) {
        ctx.addIssue({ code: "custom", path: ["media", i, "type"], message: "File video phải được lưu là video" });
      }
    });
  });

export type ProductSaveInput = z.input<typeof productSaveSchema>;


export type ProductSaveResult = {
  productId: string;
  /** Variants removed in the editor but kept (stock 0) because orders reference them. */
  keptVariantIds: string[];
};

type SlugLookup = Pick<PrismaClient, "product">;

/**
 * Final slug for a create/update:
 * - edit + slug unchanged → the stored slug is kept as-is (old products are never rewritten)
 * - otherwise slugify(slug || name), then make it unique (-2, -3…) excluding the product itself
 */
export async function resolveProductSlug(
  db: SlugLookup,
  { id, slug, name }: { id?: string | null; slug?: string | null; name: string },
): Promise<string> {
  const wanted = (slug ?? "").trim();
  if (id) {
    const current = await db.product.findUnique({ where: { id }, select: { slug: true } });
    if (current && wanted && wanted === current.slug) return current.slug;
  }
  const base = slugify(wanted || name);
  return uniqueSlug(base, async (s) => {
    const owner = await db.product.findUnique({ where: { slug: s }, select: { id: true } });
    return Boolean(owner && owner.id !== id);
  });
}

export async function saveProductFull(
  prisma: PrismaClient,
  raw: unknown,
): Promise<ProductSaveResult> {
  const input = productSaveSchema.parse(raw);

  // Videos first (unchanged PDP behaviour), then photos in the admin's order —
  // the first photo is the main image used by cards/cart.
  const ordered = [
    ...input.media.filter((m) => m.type === "video"),
    ...input.media.filter((m) => m.type !== "video"),
  ];

  return prisma.$transaction(async (tx) => {
    const slug = await resolveProductSlug(tx, { id: input.id, slug: input.slug, name: input.name });

    const plainOrNull = (value: string | null | undefined) => {
      if (value == null) return null;
      return sanitizePlainText(value, 80).trim() || null;
    };

    const data = {
      name: input.name,
      slug,
      description: input.description ?? null,
      material: input.material ?? null,
      fit: input.fit ?? null,
      gender: input.gender,
      categoryId: input.categoryId || null,
      isFeatured: input.isFeatured ?? false,
      isNew: input.isNew ?? false,
      isBestSeller: input.isBestSeller ?? false,
      ...(input.saleStatus ? { saleStatus: input.saleStatus } : {}),
      ...(input.origin !== undefined ? { origin: plainOrNull(input.origin) } : {}),
      ...(input.thickness !== undefined ? { thickness: plainOrNull(input.thickness) } : {}),
      ...(input.detailBullets !== undefined ? { detailBulletsJson: bulletsToJson(input.detailBullets) } : {}),
      ...(input.materialBullets !== undefined ? { materialBulletsJson: bulletsToJson(input.materialBullets) } : {}),
      ...(input.sizeChart !== undefined
        ? { sizeChartJson: sizeChartToJson(input.sizeChart as SizeChart | null) }
        : {}),
      ...(input.shippingBullets !== undefined ? { shippingOverrideJson: bulletsToJson(input.shippingBullets) } : {}),
    };

    let productId: string;
    if (input.id) {
      const exists = await tx.product.findUnique({ where: { id: input.id } });
      if (!exists) throw new ApiError("Không tìm thấy sản phẩm", 404);
      await tx.product.update({ where: { id: input.id }, data });
      productId = input.id;
    } else {
      productId = (await tx.product.create({ data })).id;
    }

    // ---- media
    const existingMedia = await tx.productImage.findMany({ where: { productId } });
    const existingMediaIds = new Set(existingMedia.map((m) => m.id));
    const keepMedia = new Set(ordered.filter((m) => m.id && existingMediaIds.has(m.id)).map((m) => m.id!));
    await tx.productImage.deleteMany({
      where: { productId, id: { notIn: [...keepMedia] } },
    });
    for (const [i, m] of ordered.entries()) {
      const row = {
        url: m.url,
        alt: m.alt || input.name,
        color: m.color || null,
        type: m.type,
        posterUrl: m.posterUrl || null,
        isHidden: m.isHidden ?? false,
        sortOrder: i,
      };
      if (m.id && keepMedia.has(m.id)) {
        await tx.productImage.update({ where: { id: m.id }, data: row });
      } else {
        await tx.productImage.create({ data: { ...row, productId } });
      }
    }

    // ---- variants
    const existingVariants = await tx.productVariant.findMany({ where: { productId } });
    const byId = new Map(existingVariants.map((v) => [v.id, v]));
    const byKey = new Map(existingVariants.map((v) => [`${v.color.toLowerCase()}|${v.size.toUpperCase()}`, v]));
    const usedIds = new Set<string>();
    const resolved = input.variants.map((v) => {
      const match =
        (v.id && byId.get(v.id)) || byKey.get(`${v.color.toLowerCase()}|${v.size.toUpperCase()}`);
      if (match && !usedIds.has(match.id)) {
        usedIds.add(match.id);
        return { ...v, id: match.id };
      }
      return { ...v, id: undefined };
    });

    const kept: string[] = [];
    for (const old of existingVariants) {
      if (usedIds.has(old.id)) continue;
      const orders = await tx.orderItem.count({ where: { variantId: old.id } });
      if (orders > 0) {
        // Keep the row so order history stays intact; just make it unsellable.
        await tx.productVariant.update({ where: { id: old.id }, data: { stock: 0 } });
        kept.push(old.id);
      } else {
        await tx.productVariant.delete({ where: { id: old.id } });
      }
    }

    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const base = skuPart(product.slug);
    for (const v of resolved) {
      const row = {
        color: v.color,
        colorHex: v.colorHex.toUpperCase(),
        size: v.size,
        price: v.price,
        compareAt: v.compareAt || null,
        ...(v.costPrice !== undefined ? { costPrice: v.costPrice } : {}),
        stock: v.stock,
      };
      if (v.id) {
        await tx.productVariant.update({ where: { id: v.id }, data: row });
      } else {
        let sku = (v.sku && v.sku.trim()) || `${base}-${skuPart(v.color)}-${skuPart(v.size)}`;
        for (let n = 2; await tx.productVariant.findUnique({ where: { sku } }); n++) {
          sku = `${base}-${skuPart(v.color)}-${skuPart(v.size)}-${n}`;
        }
        await tx.productVariant.create({ data: { ...row, sku, productId } });
      }
    }

    return { productId, keptVariantIds: kept };
  }, { timeout: 30000, maxWait: 10000 });
}
