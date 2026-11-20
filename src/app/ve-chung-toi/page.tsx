import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getStorefrontPageBySlug("ve-chung-toi");
  return {
    title: page?.title || "Về chúng tôi",
    description: page?.description || "Câu chuyện thương hiệu VIZFAS.",
  };
}

export default async function AboutPage() {
  const page = await getStorefrontPageBySlug("ve-chung-toi");
  const title = page?.title || "Về VIZFAS";
  const body = page?.body ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold md:text-4xl">{title}</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-neutral-600 md:text-base">
        {body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}