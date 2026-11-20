import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getStorefrontPageBySlug("tuyen-dung");
  return { title: page?.title || "Tuyển dụng", description: page?.description || undefined };
}

export default async function CareersPage() {
  const page = await getStorefrontPageBySlug("tuyen-dung");
  const title = page?.title || "Tuyển dụng";
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
        {(page?.body ?? []).map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}