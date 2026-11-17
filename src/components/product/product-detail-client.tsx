"use client";

import { useMemo, useState } from "react";
import { ProductGallery, type GalleryImage } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";

type Variant = {
  id: string;
  color: string;
  colorHex: string | null;
  size: string;
  price: number;
  compareAt: number | null;
  stock: number;
};

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    material: string | null;
    fit: string | null;
    thickness: string | null;
    origin: string | null;
    isNew: boolean;
    rating: number;
    reviewCount: number;
    images: GalleryImage[];
    variants: Variant[];
  };
};

const TABS = [
  { id: "details", label: "Chi tiết sản phẩm" },
  { id: "material", label: "Chất liệu" },
  { id: "care", label: "Bảo quản" },
] as const;

export function ProductDetailClient({ product }: Props) {
  const initialColor = product.variants[0]?.color ?? "";
  const [color, setColor] = useState(initialColor);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("details");

  const detailImage = useMemo(() => {
    const byColor = product.images.find((img) => img.color === color);
    return byColor?.url || product.images[1]?.url || product.images[0]?.url;
  }, [product.images, color]);

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery
          images={product.images}
          name={product.name}
          selectedColor={color}
        />
        <ProductPurchase
          product={product}
          color={color}
          onColorChange={setColor}
        />
      </div>

      <section className="mt-16 border-t border-neutral-100 pt-8">
        <div className="flex flex-wrap gap-6 border-b border-neutral-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                tab === t.id
                  ? "border-b-2 border-neutral-900 pb-3 text-sm font-semibold text-neutral-900"
                  : "pb-3 text-sm text-neutral-500 hover:text-neutral-800"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="text-sm leading-relaxed text-neutral-600">
            {tab === "details" ? (
              <>
                <p>{product.description}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5">
                  <li>Form {product.fit || "rộng"}, thoải mái vận động</li>
                  <li>Phong cách unisex, dễ phối mỗi ngày</li>
                  <li>Xuất xứ: {product.origin || "Việt Nam"}</li>
                  <li>Độ dày: {product.thickness || "Trung bình"}</li>
                </ul>
              </>
            ) : null}
            {tab === "material" ? (
              <ul className="list-disc space-y-2 pl-5">
                <li>Chất liệu: {product.material || "Cotton / nỉ cao cấp"}</li>
                <li>Mềm, dày vừa, ít xù sau giặt</li>
                <li>Thấm hút tốt, mặc cả ngày vẫn thoải mái</li>
              </ul>
            ) : null}
            {tab === "care" ? (
              <ul className="list-disc space-y-2 pl-5">
                <li>Giặt máy nhẹ hoặc giặt tay với nước lạnh</li>
                <li>Không dùng chất tẩy mạnh</li>
                <li>Lộn trái khi phơi, tránh ánh nắng gắt</li>
              </ul>
            ) : null}
          </div>
          <div className="relative min-h-[280px] overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                detailImage ||
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"
              }
              alt="Chi tiết chất liệu"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
