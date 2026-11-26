/** Cùng quy tắc với migration 20261126104400_product_is_demo. */
export function productIsDemo(input: { name: string; slug: string; skus?: string[] }) {
  if (input.name.trimStart().startsWith("[DEMO]")) return true;
  if (input.slug.trim().toLowerCase().startsWith("demo-")) return true;
  return (input.skus ?? []).some((sku) => sku.trim().toUpperCase().startsWith("DEMO-"));
}

export function includeInPublicSitemap(product: { isDemo: boolean; name: string; slug: string }) {
  return !product.isDemo && !productIsDemo({ name: product.name, slug: product.slug });
}
