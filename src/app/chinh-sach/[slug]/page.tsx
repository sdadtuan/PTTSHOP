import { notFound } from "next/navigation";
import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await getStorefrontPageBySlug(`chinh-sach/${slug}`);
  return { title: page?.title || "Chính sách" };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = await getStorefrontPageBySlug(`chinh-sach/${slug}`);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold">{page.title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
        {page.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}