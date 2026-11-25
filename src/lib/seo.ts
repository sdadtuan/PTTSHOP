export function siteBaseUrl() {
  const raw = process.env.AUTH_URL || "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function absoluteUrl(pathOrUrl: string, base = siteBaseUrl()) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${base}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function isDemoName(name: string) {
  return name.trimStart().startsWith("[DEMO]");
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationJsonLd(input: { name: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
  };
}

export function productJsonLd(input: {
  name: string;
  description?: string | null;
  url: string;
  image?: string | null;
  sku?: string | null;
  price: number | null;
  availability: "InStock" | "OutOfStock";
  breadcrumbs: { name: string; url: string }[];
  customerReviewCount: number;
  customerRating: number | null;
}) {
  const product: Record<string, unknown> = {
    "@type": "Product",
    name: input.name,
    url: input.url,
  };
  if (input.description) product.description = input.description;
  if (input.image) product.image = [input.image];
  if (input.sku) product.sku = input.sku;
  if (input.price != null && input.price > 0) {
    product.offers = {
      "@type": "Offer",
      priceCurrency: "VND",
      price: String(input.price),
      availability: `https://schema.org/${input.availability}`,
      url: input.url,
    };
  }
  if (input.customerReviewCount > 0 && input.customerRating != null) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(input.customerRating),
      reviewCount: String(input.customerReviewCount),
    };
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: input.breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
      product,
    ],
  };
}
