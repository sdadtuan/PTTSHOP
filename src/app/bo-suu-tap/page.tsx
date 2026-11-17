import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
        Bộ sưu tập
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Khám phá chất liệu bền bỉ cho phong cách của bạn
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/san-pham?collection=${c.slug}`}
            className="group relative min-h-[360px] overflow-hidden bg-neutral-200"
          >
            <Image
              src={
                c.image ||
                c.products[0]?.product.images[0]?.url ||
                "/images/ai-home/look-1-thun-cam.jpg"
              }
              alt={c.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width:768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-6 text-white">
              <p className="text-xs tracking-[0.25em] uppercase text-white/70">
                Collection
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
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
