import type { Prisma, PrismaClient } from "@prisma/client";

type RedirectDb = Prisma.TransactionClient | PrismaClient;

export async function rememberSlugRedirect(
  db: RedirectDb,
  productId: string,
  fromSlug: string,
  toSlug: string,
) {
  if (!fromSlug || fromSlug === toSlug) return;
  await db.slugRedirect.deleteMany({ where: { fromSlug: toSlug } });
  await db.slugRedirect.updateMany({ where: { toSlug: fromSlug }, data: { toSlug } });
  await db.slugRedirect.upsert({
    where: { fromSlug },
    create: { fromSlug, toSlug, productId },
    update: { toSlug, productId },
  });
}

/** Public selling slug to send the visitor to, or null when the URL should stay. */
export async function resolveSlugRedirect(db: RedirectDb, fromSlug: string) {
  const current = await db.product.findUnique({
    where: { slug: fromSlug },
    select: { slug: true },
  });
  if (current) return null;

  let cursor = fromSlug;
  const seen = new Set<string>([fromSlug]);
  for (let hop = 0; hop < 8; hop += 1) {
    const row = await db.slugRedirect.findUnique({ where: { fromSlug: cursor } });
    if (!row || row.toSlug === cursor || seen.has(row.toSlug)) return null;
    const product = await db.product.findUnique({
      where: { slug: row.toSlug },
      select: { slug: true, saleStatus: true, isDemo: true },
    });
    if (product) return product.saleStatus === "SELLING" && !product.isDemo ? product.slug : null;
    seen.add(row.toSlug);
    cursor = row.toSlug;
  }
  return null;
}
