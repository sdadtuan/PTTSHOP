import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const collections = [
  {
    title: "Áo Thun",
    blurb: "Oversize & basic",
    href: "/san-pham?category=ao-thun",
    image: "/images/home-v2/cat-ao-thun.jpg",
  },
  {
    title: "Quần",
    blurb: "Cargo & kaki",
    href: "/san-pham?category=quan",
    image: "/images/home-v2/cat-quan.jpg",
  },
  {
    title: "Phụ Kiện",
    blurb: "Nón & túi",
    href: "/san-pham?category=phu-kien",
    image: "/images/home-v2/cat-phu-kien.jpg",
  },
] as const;

export function DemoCollections() {
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
            Khám Phá Các Bộ Sưu Tập
          </h2>
          <Link href="/bo-suu-tap" className="dv2-all">
            Xem Tất Cả <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="dv2-collections">
          {collections.map((c) => (
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
