import Link from "next/link";
import { getStorefrontUi } from "@/lib/storefront/ui-copy";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;
  const ui = (await getStorefrontUi()).orderSuccess;

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm tracking-[0.25em] text-[var(--accent)] uppercase">{ui.eyebrow}</p>
      <h1 className="mt-3 type-title text-3xl font-bold">{ui.title}</h1>
      {order ? (
        <p className="mt-3 text-neutral-600">
          {ui.orderLabel}{" "}
          <span className="font-semibold text-neutral-900">{order}</span>
        </p>
      ) : null}
      <p className="mt-2 text-sm text-neutral-500">{ui.body}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/san-pham"
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          {ui.ctaShop}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold"
        >
          {ui.ctaHome}
        </Link>
      </div>
    </div>
  );
}