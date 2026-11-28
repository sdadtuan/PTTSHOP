import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LookShop } from "@/components/lookbook/look-shop";
import { publicCatalogWhere } from "@/lib/catalog-visibility";
import { sellableTotals } from "@/lib/dropship/service";
import { lookIsPublic } from "@/lib/looks";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const look = await prisma.look.findUnique({ where: { slug }, select: { title: true, isPublished: true } });
  if (!lookIsPublic(look)) return { title: "Lookbook" };
  return { title: look?.title };
}

export default async function LookPage({ params }: Props) {
  const { slug } = await params;
  const look = await prisma.look.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isDemo: true,
              saleStatus: true,
              images: { where: { isHidden: false }, orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
              variants: { select: { id: true, color: true, size: true, price: true, stock: true } },
            },
          },
        },
      },
    },
  });
  if (!lookIsPublic(look) || !look) notFound();
  const visible = look.items.filter((item) => item.product.saleStatus === publicCatalogWhere.saleStatus && !item.product.isDemo);
  const stock = await sellableTotals(prisma, visible.flatMap((item) => item.product.variants.map((variant) => variant.id)));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="type-title text-3xl font-bold">{look.title}</h1>
      {look.description ? <p className="mt-3 text-neutral-600">{look.description}</p> : null}
      <LookShop
        items={visible.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          variants: item.product.variants.map((variant) => ({
            id: variant.id,
            label: `${variant.color} / ${variant.size}`,
            stock: stock.get(variant.id) ?? 0,
            color: variant.color,
            size: variant.size,
            price: variant.price,
            image: item.product.images[0]?.url || "",
          })),
        }))}
      />
    </div>
  );
}
