import { visibleParagraphs } from "@/content/company";
import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getStorefrontPageBySlug("tin-tuc");
  return { title: page?.title || "Tin tức", description: page?.description || undefined };
}

export default async function NewsPage() {
  const page = await getStorefrontPageBySlug("tin-tuc");
  const title = page?.title || "Tin tức";
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
        {visibleParagraphs(page?.body ?? []).map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}