import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { homeImages } from "@/config/home-images";
import type { CollectionsContent } from "@/lib/cms/types";

export function DemoCollections({
  content,
  categories,
}: {
  content: CollectionsContent;
  categories: { name: string; slug: string }[];
}) {
  const bySlug = (slug: string) => categories.find((c) => c.slug === slug);
  const tiles = [
    {
      title:
        content.tiles[0]?.title ||
        bySlug(content.tiles[0]?.categorySlug || "ao-thun")?.name ||
        "Áo Thun",
      blurb: content.tiles[0]?.description || "Oversize & basic",
      href: `/san-pham?category=${content.tiles[0]?.categorySlug || "ao-thun"}`,
      image: content.tiles[0]?.imageUrl || homeImages.collections.aoThun,
    },
    {
      title:
        content.tiles[1]?.title ||
        bySlug(content.tiles[1]?.categorySlug || "quan")?.name ||
        "Quần",
      blurb: content.tiles[1]?.description || "Cargo & kaki",
      href: `/san-pham?category=${content.tiles[1]?.categorySlug || "quan"}`,
      image: content.tiles[1]?.imageUrl || homeImages.collections.quan,
    },
    {
      title:
        content.tiles[2]?.title ||
        bySlug(content.tiles[2]?.categorySlug || "phu-kien")?.name ||
        "Phụ Kiện",
      blurb: content.tiles[2]?.description || "Nón & túi",
      href: `/san-pham?category=${content.tiles[2]?.categorySlug || "phu-kien"}`,
      image: content.tiles[2]?.imageUrl || homeImages.collections.phuKien,
    },
  ] as const;

  return (
    <section
      className="dv2-section"
      data-testid="demo-v2-collections"
      aria-labelledby="dv2-collections-title"
    >
      <div className="dv2-wrap">
        <div className="dv2-section__head">
          <h2 id="dv2-collections-title" className="dv2-section__title">
            <span className="dv2-slashes" aria-hidden>
              ///
            </span>
            {content.titleLine1} {content.titleLine2}
          </h2>
          <Link href={content.ctaHref || "/bo-suu-tap"} className="dv2-all">
            {content.ctaLabel || "Xem Tất Cả"} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="dv2-collections">
          {tiles.map((c) => (
            <Link key={c.title} href={c.href} className="dv2-collection">
              <div className="dv2-collection__media">
                <Image
                  src={c.image}
                  alt={c.title}
                  fill
                  sizes="(max-width:768px) 50vw, 20vw"
                  className="object-cover"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="dv2-collection__body">
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.blurb}</p>
                </div>
                <span className="dv2-round-btn" aria-hidden>
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
