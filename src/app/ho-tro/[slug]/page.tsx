import { notFound } from "next/navigation";
import { visibleParagraphs } from "@/content/company";
import { publicCopy } from "@/lib/public-brand";
import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await getStorefrontPageBySlug(`ho-tro/${slug}`);
  return { title: publicCopy(page?.title, "Hỗ trợ") };
}

export default async function SupportPage({ params }: Props) {
  const { slug } = await params;
  const page = await getStorefrontPageBySlug(`ho-tro/${slug}`);
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold">{publicCopy(page.title)}</h1>
      <ul className="mt-6 list-disc space-y-3 pl-5 text-sm text-neutral-600">
        {visibleParagraphs(page.body).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}