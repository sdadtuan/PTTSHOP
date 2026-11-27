import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUnset, visibleParagraphs } from "@/content/company";
import { publicCopy } from "@/lib/public-brand";
import { policyBySlug } from "@/content/policies";
import { getShopProfile } from "@/lib/shop/load";
import { policyParagraphs } from "@/lib/shop/profile";
import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export async function policyMetadata(slug: string): Promise<Metadata> {
  const policy = policyBySlug(slug);
  return { title: publicCopy(policy?.title, "Chính sách") };
}

export async function PolicyDocument({ slug }: { slug: string }) {
  const fallback = policyBySlug(slug);
  if (!fallback) notFound();
  const stored = await getStorefrontPageBySlug(slug);
  const title = publicCopy(stored?.title || fallback.title);
  const profile = await getShopProfile();
  const body = policyParagraphs(
    slug,
    visibleParagraphs(stored?.body?.length ? stored.body : fallback.body),
    profile,
  );

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold">{title}</h1>
      {isUnset(fallback.effectiveLabel) ? null : (
        <p className="mt-3 text-sm text-neutral-500">Ngày hiệu lực: {fallback.effectiveLabel}</p>
      )}
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
        {body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
