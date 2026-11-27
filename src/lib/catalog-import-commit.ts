import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { lstat, mkdir, mkdtemp, readdir, readFile, rm, symlink, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { productIsDemo } from "@/lib/demo-product";
import { refreshProductSearchText } from "@/lib/search/text";
import type { ImportIssue, ImportProduct } from "@/lib/catalog-import";
import { validateCatalogImage } from "@/lib/upload-validate";

export type ImportSummary = {
  productsCreate: number;
  productsUpdate: number;
  variantsCreate: number;
  variantsUpdate: number;
  categoriesCreate: string[];
};

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

export async function filesFromZip(bytes: Buffer): Promise<Map<string, { name: string; bytes: Buffer; mime: string }>> {
  const dir = await mkdtemp(path.join(tmpdir(), "ptt-zip-"));
  const out: Map<string, { name: string; bytes: Buffer; mime: string }> = new Map();
  try {
    const zipPath = path.join(dir, "in.zip");
    await writeFile(zipPath, bytes);
    const dest = path.join(dir, "out");
    await mkdir(dest);
    await exec("unzip", ["-j", "-o", zipPath, "-d", dest]);
    for (const name of await readdir(dest)) {
      if (name.startsWith(".") || name === "in.zip") continue;
      const full = path.join(dest, name);
      const buf = await readFile(full);
      out.set(name, { name, bytes: buf, mime: mimeOf(name) });
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  return out;
}

function mimeOf(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

function exec(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile(cmd, args, (err) => (err ? reject(err) : resolve()));
  });
}

export async function planCatalogImport(
  prisma: PrismaClient,
  products: ImportProduct[],
): Promise<{ issues: ImportIssue[]; summary: ImportSummary }> {
  const issues: ImportIssue[] = [];
  const skus = products.flatMap((product) => product.variants.map((variant) => variant.sku));
  const slugs = products.map((product) => product.slug);
  const [existingVariants, existingProducts, categories] = await Promise.all([
    prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, product: { select: { id: true, slug: true } } },
    }),
    prisma.product.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true, variants: { select: { sku: true } } },
    }),
    prisma.category.findMany({
      where: { slug: { in: products.map((product) => product.categorySlug) } },
      select: { slug: true },
    }),
  ]);
  const variantOwner = new Map(existingVariants.map((row) => [row.sku, row.product]));
  const bySlug = new Map(existingProducts.map((row) => [row.slug, row]));
  const categorySlugs = new Set(categories.map((row) => row.slug));
  let productsCreate = 0;
  let productsUpdate = 0;
  let variantsCreate = 0;
  let variantsUpdate = 0;
  const categoriesCreate = new Set<string>();

  for (const product of products) {
    const slugOwner = bySlug.get(product.slug);
    const owners = new Set(
      product.variants
        .map((variant) => variantOwner.get(variant.sku)?.id)
        .filter((id): id is string => Boolean(id)),
    );
    if (owners.size > 1) {
      issues.push({
        row: product.variants[0].row,
        field: "sku",
        message: "Các SKU của slug này đang thuộc nhiều sản phẩm khác nhau",
      });
      continue;
    }
    const ownerId = [...owners][0];
    if (ownerId && slugOwner && ownerId !== slugOwner.id) {
      issues.push({
        row: product.variants[0].row,
        field: "product_slug",
        message: "Slug trùng với sản phẩm khác",
      });
      continue;
    }
    if (ownerId && !slugOwner) {
      const ownerSlug = product.variants
        .map((variant) => variantOwner.get(variant.sku)?.slug)
        .find(Boolean);
      issues.push({
        row: product.variants[0].row,
        field: "sku",
        message: `SKU đã thuộc sản phẩm ${ownerSlug}`,
      });
      continue;
    }
    if (slugOwner && !ownerId && slugOwner.variants.length > 0) {
      issues.push({
        row: product.variants[0].row,
        field: "product_slug",
        message: "Slug trùng với sản phẩm khác",
      });
      continue;
    }
    for (const variant of product.variants) {
      const owner = variantOwner.get(variant.sku);
      if (owner && slugOwner && owner.id !== slugOwner.id) {
        issues.push({ row: variant.row, field: "sku", message: "SKU trùng với sản phẩm khác" });
      }
    }
    if (issues.some((issue) => product.variants.some((variant) => variant.row === issue.row))) continue;
    if (slugOwner) productsUpdate += 1;
    else productsCreate += 1;
    for (const variant of product.variants) {
      if (variantOwner.has(variant.sku)) variantsUpdate += 1;
      else variantsCreate += 1;
    }
    if (!categorySlugs.has(product.categorySlug)) categoriesCreate.add(product.categoryName);
  }

  return {
    issues,
    summary: {
      productsCreate,
      productsUpdate,
      variantsCreate,
      variantsUpdate,
      categoriesCreate: [...categoriesCreate],
    },
  };
}

export async function commitCatalogImport(
  prisma: PrismaClient,
  opts: {
    products: ImportProduct[];
    issues: ImportIssue[];
    files: Map<string, { name: string; bytes: Buffer; mime: string }>;
  },
): Promise<{ summary: ImportSummary } | { issues: ImportIssue[] }> {
  const plan = await planCatalogImport(prisma, opts.products);
  const issues = [...opts.issues, ...plan.issues];
  if (issues.length || opts.products.length === 0) {
    return { issues: issues.length ? issues : [{ row: 1, field: "file", message: "Không có dòng sản phẩm" }] };
  }

  await ensurePublicMediaLink();
  const written: string[] = [];
  const urls = new Map<string, string>();
  try {
    for (const [name, file] of opts.files) {
      const needed = opts.products.some((product) => product.variants.some((variant) => variant.imageFile === name));
      if (!needed) continue;
      const checked = validateCatalogImage({
        size: file.bytes.length,
        name: file.name,
        buffer: file.bytes,
      });
      if (!checked.ok) {
        await Promise.all(written.map((file) => unlink(file).catch(() => undefined)));
        return { issues: [{ row: 1, field: "image_file", message: `${name}: ${checked.error}` }] };
      }
      const stored = `${Date.now()}-${randomUUID().slice(0, 8)}.${checked.ext}`;
      const full = path.join(mediaRoot(), "catalog", stored);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, file.bytes);
      written.push(full);
      urls.set(name, `/media/catalog/${stored}`);
    }

    await prisma.$transaction(async (tx) => {
      for (const product of opts.products) {
        let category = await tx.category.findUnique({ where: { slug: product.categorySlug } });
        if (!category) {
          category = await tx.category.create({
            data: { name: product.categoryName, slug: product.categorySlug },
          });
        }
        const existing = await tx.product.findUnique({ where: { slug: product.slug } });
        const row = existing
          ? await tx.product.update({
              where: { id: existing.id },
              data: {
                name: product.name,
                description: product.description,
                gender: product.gender,
                categoryId: category.id,
                saleStatus: product.saleStatus,
              },
            })
          : await tx.product.create({
              data: {
                name: product.name,
                slug: product.slug,
                description: product.description,
                gender: product.gender,
                categoryId: category.id,
                saleStatus: product.saleStatus,
              },
            });
        const seenImages = new Set<string>();
        let sort = await tx.productImage.count({ where: { productId: row.id } });
        for (const variant of product.variants) {
          const url = urls.get(variant.imageFile);
          if (!url) throw new ApiError(`Thiếu ảnh ${variant.imageFile}`, 400);
          const key = `${variant.imageFile}|${variant.color.toLowerCase()}`;
          if (!seenImages.has(key)) {
            seenImages.add(key);
            const image = await tx.productImage.findFirst({
              where: { productId: row.id, color: variant.color },
            });
            if (image) {
              await tx.productImage.update({ where: { id: image.id }, data: { url, alt: product.name } });
            } else {
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
          }
          const data = {
            color: variant.color,
            colorHex: variant.colorHex,
            size: variant.size,
            price: variant.price,
            compareAt: variant.compareAt,
            costPrice: variant.costPrice,
            stock: variant.stock,
          };
          const current = await tx.productVariant.findUnique({ where: { sku: variant.sku } });
          if (current) {
            if (current.productId !== row.id) throw new ApiError(`SKU ${variant.sku} thuộc sản phẩm khác`, 409);
            await tx.productVariant.update({ where: { id: current.id }, data });
          } else {
            await tx.productVariant.create({ data: { ...data, sku: variant.sku, productId: row.id } });
          }
        }
        await tx.product.update({
          where: { id: row.id },
          data: {
            isDemo: productIsDemo({
              name: product.name,
              slug: product.slug,
              skus: product.variants.map((variant) => variant.sku),
            }),
          },
        });
        await refreshProductSearchText(tx, row.id);
      }
    }, { timeout: 30000 });
    return { summary: plan.summary };
  } catch (err) {
    await Promise.all(written.map((file) => unlink(file).catch(() => undefined)));
    throw err;
  }
}
