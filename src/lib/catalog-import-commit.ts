import { randomUUID } from "crypto";
import { lstat, mkdir, symlink, unlink, writeFile } from "fs/promises";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api";
import type { ImportIssue, ImportMode, ImportProduct } from "@/lib/catalog-import";
import { validateUploadFile } from "@/lib/upload-validate";

export function mediaRoot() {
  return process.env.MEDIA_DIR
    ? path.resolve(process.env.MEDIA_DIR)
    : path.join(process.cwd(), "data", "media");
}

export async function ensurePublicMediaLink() {
  const root = mediaRoot();
  await mkdir(root, { recursive: true });
  if (process.env.MEDIA_DIR) return;
  const link = path.join(process.cwd(), "public", "media");
  try {
    const st = await lstat(link);
    if (st.isSymbolicLink()) return;
    throw new ApiError("public/media đã tồn tại và không trỏ tới data/media", 500);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await symlink(root, link, "dir");
      return;
    }
    throw err;
  }
}

export async function lookupCatalogCollisions(
  prisma: PrismaClient,
  products: ImportProduct[],
): Promise<ImportIssue[]> {
  const issues: ImportIssue[] = [];
  for (const product of products) {
    const row = product.variants[0]?.row ?? 2;
    const category = await prisma.category.findUnique({ where: { slug: product.categorySlug } });
    if (!category && product.categoryName.trim().length < 2) {
      issues.push({
        row,
        field: "category_name",
        message: "Danh mục chưa có. Điền category_name để tạo mới. Danh mục đã có sẽ không bị sửa.",
      });
    }
    const existing = await prisma.product.findUnique({ where: { slug: product.slug }, select: { id: true } });
    if (existing) {
      issues.push({ row, field: "slug", message: "Slug đã có. Nhập file không ghi đè sản phẩm cũ." });
    }
    for (const variant of product.variants) {
      const sku = await prisma.productVariant.findUnique({ where: { sku: variant.sku }, select: { id: true } });
      if (sku) {
        issues.push({ row: variant.row, field: "sku", message: "SKU đã có. Nhập file không ghi đè biến thể cũ." });
      }
    }
  }
  return issues;
}

export async function commitCatalogImport(
  prisma: PrismaClient,
  opts: {
    mode: ImportMode;
    products: ImportProduct[];
    issues: ImportIssue[];
    files: Map<string, { name: string; bytes: Buffer; mime: string }>;
  },
): Promise<{ created: { slug: string; id: string }[] } | { issues: ImportIssue[] }> {
  const issues = [...opts.issues, ...(await lookupCatalogCollisions(prisma, opts.products))];
  if (issues.length || opts.products.length === 0) {
    return { issues: issues.length ? issues : [{ row: 1, field: "file", message: "Không có dòng sản phẩm" }] };
  }

  await ensurePublicMediaLink();
  const written: string[] = [];
  const urls = new Map<string, string>();
  try {
    for (const [name, file] of opts.files) {
      const checked = validateUploadFile({
        mime: file.mime,
        size: file.bytes.length,
        name: file.name,
        buffer: file.bytes,
      });
      if (!checked.ok) {
        return { issues: [{ row: 1, field: "image_file", message: `${name}: ${checked.error}` }] };
      }
      const stored = `${Date.now()}-${randomUUID().slice(0, 8)}.${checked.ext}`;
      const full = path.join(mediaRoot(), "catalog", stored);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, file.bytes);
      written.push(full);
      urls.set(name, `/media/catalog/${stored}`);
    }

    const created = await prisma.$transaction(async (tx) => {
      const out: { slug: string; id: string }[] = [];
      for (const product of opts.products) {
        const again = await tx.product.findUnique({ where: { slug: product.slug }, select: { id: true } });
        if (again) throw new ApiError(`Slug ${product.slug} vừa được tạo bởi thao tác khác`, 409);
        let category = await tx.category.findUnique({ where: { slug: product.categorySlug } });
        if (!category) {
          category = await tx.category.create({
            data: { name: product.categoryName.trim(), slug: product.categorySlug },
          });
        }
        const row = await tx.product.create({
          data: {
            name: product.name,
            slug: product.slug,
            description: product.description,
            material: product.material,
            gender: product.gender,
            categoryId: category.id,
            saleStatus: product.saleStatus,
          },
        });
        const seenImages = new Set<string>();
        let sort = 0;
        for (const variant of product.variants) {
          const url = urls.get(variant.imageFile);
          if (!url) throw new ApiError(`Thiếu ảnh ${variant.imageFile}`, 400);
          const key = `${variant.imageFile}|${variant.color.toLowerCase()}`;
          if (!seenImages.has(key)) {
            seenImages.add(key);
            await tx.productImage.create({
              data: {
                productId: row.id,
                url,
                alt: product.name,
                color: variant.color,
                type: "image",
                sortOrder: sort,
              },
            });
            sort += 1;
          }
          await tx.productVariant.create({
            data: {
              productId: row.id,
              sku: variant.sku,
              color: variant.color,
              colorHex: variant.colorHex,
              size: variant.size,
              price: variant.price,
              compareAt: variant.compareAt,
              costPrice: variant.costPrice,
              stock: variant.stock,
            },
          });
        }
        out.push({ slug: product.slug, id: row.id });
      }
      return out;
    });
    return { created };
  } catch (err) {
    await Promise.all(written.map((file) => unlink(file).catch(() => undefined)));
    throw err;
  }
}

export function modeOf(raw: string | null): ImportMode {
  return raw === "catalog" ? "catalog" : "demo";
}
