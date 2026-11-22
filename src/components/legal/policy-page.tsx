import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { policyBySlug } from "@/content/policies";
import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export async function policyMetadata(slug: string): Promise<Metadata> {
  const policy = policyBySlug(slug);
  return { title: policy?.title ?? "Chính sách" };
}

export async function PolicyDocument({ slug }: { slug: string }) {
  const fallback = policyBySlug(slug);
  if (!fallback) notFound();
  const stored = await getStorefrontPageBySlug(slug);
  const title = stored?.title || fallback.title;
  const body = stored?.body?.length ? stored.body : fallback.body;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold">{title}</h1>
      <p className="mt-3 text-sm text-neutral-500">Ngày hiệu lực: {fallback.effectiveLabel}</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
        {body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
