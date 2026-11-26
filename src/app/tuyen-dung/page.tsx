import { visibleParagraphs } from "@/content/company";
import { publicCopy, visibleEmail } from "@/lib/public-brand";
import { getStorefrontPageBySlug } from "@/lib/storefront/pages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getStorefrontPageBySlug("tuyen-dung");
  return {
    title: publicCopy(page?.title, "Tuyển dụng"),
    description: publicCopy(page?.description, "") || undefined,
  };
}

export default async function CareersPage() {
  const page = await getStorefrontPageBySlug("tuyen-dung");
  const title = publicCopy(page?.title, "Tuyển dụng");
  const careersEmail = visibleEmail(process.env.SHOP_CAREERS_EMAIL);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
        {visibleParagraphs(page?.body ?? []).map((p) => (
          <p key={p}>{p}</p>
        ))}
        {careersEmail ? (
          <p>Gửi CV qua email {careersEmail} với tiêu đề &quot;Ứng tuyển PTT Shop&quot;.</p>
        ) : (
          <p>Email tuyển dụng sẽ cập nhật sau.</p>
        )}
      </div>
    </div>
  );
}