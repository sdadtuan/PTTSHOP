import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  DemoProductCard,
  type DemoProduct,
} from "@/components/demo-v2/demo-product-card";

export function DemoFeatured({ products }: { products: DemoProduct[] }) {
  return (
    <section
      className="dv2-section"
      data-testid="demo-v2-featured"
      aria-labelledby="dv2-featured-title"
    >
      <div className="dv2-wrap">
        <div className="dv2-section__head">
          <h2 id="dv2-featured-title" className="dv2-section__title">
            <span className="dv2-slashes" aria-hidden>
              ///
            </span>
            Sản Phẩm Nổi Bật
          </h2>
          <Link href="/san-pham" className="dv2-all">
            Xem Tất Cả <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="dv2-products">
          {products.map((product) => (
            <DemoProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
