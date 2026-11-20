import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStorefrontUi } from "@/lib/storefront/ui-copy";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const colUi = (await getStorefrontUi()).collections;
  const collections = await prisma.collection.findMany({
    include: {
      products: {
        include: {
          product: {
            include: {
              images: {
  where: { type: { not: "video" }, isHidden: false },
  orderBy: { sortOrder: "asc" },
  take: 1,
},
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="type-title text-3xl font-bold md:text-4xl">
        {colUi.title}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">{colUi.subtitle}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/san-pham?collection=${c.slug}`}
            className="group relative aspect-[16/10] max-h-[min(40vh,280px)] overflow-hidden bg-neutral-200 md:aspect-auto md:max-h-none md:min-h-[360px]"
          >
            <Image
              src={
                c.image ||
                c.products[0]?.product.images[0]?.url ||
                "/images/ai-home/look-1-thun-cam.jpg"
              }
              alt={c.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105 max-md:[object-position:50%_20%]"
              sizes="(max-width:768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-6 text-white">
              <p className="text-xs tracking-[0.25em] uppercase text-white/70">
                {colUi.cardEyebrow}
              </p>
              <h2 className="mt-2 type-title text-2xl font-bold">
                {c.name}
              </h2>
              {c.description ? (
                <p className="mt-2 max-w-md text-sm text-white/80">
                  {c.description}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
