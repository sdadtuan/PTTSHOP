"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DemoProductCard,
  type DemoProduct,
} from "@/components/demo-v2/demo-product-card";

export function DemoFeaturedCarousel({
  products,
  overrides,
}: {
  products: DemoProduct[];
  overrides: string[];
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    const amount = Math.min(280, el.clientWidth * 0.7) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className="dv2-carousel" data-testid="demo-v2-featured-carousel">
      <button
        type="button"
        className="dv2-carousel__nav dv2-carousel__nav--prev"
        aria-label="Sản phẩm trước"
        onClick={() => scrollBy(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="dv2-carousel__track" ref={scroller}>
        {products.map((product, i) => (
          <div key={`car-${product.id}-${i}`} className="dv2-carousel__slide">
            <DemoProductCard product={product} imageOverride={overrides[i]} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="dv2-carousel__nav dv2-carousel__nav--next"
        aria-label="Sản phẩm sau"
        onClick={() => scrollBy(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
