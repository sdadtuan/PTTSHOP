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
  { id: "size", label: "Bảng size" },
  { id: "shipping", label: "Vận chuyển & Đổi trả" },
] as const;

export function ProductDetailClient({ product }: Props) {
  const initialColor = product.variants[0]?.color ?? "";
  const [color, setColor] = useState(initialColor);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("details");

  const detailImage = useMemo(() => {
    const byColor = product.images.filter((img) => img.color === color);
    const fabric =
      byColor.find((img) => img.url.includes("fabric")) ||
      byColor[byColor.length - 1] ||
      byColor[0];
    return fabric?.url || product.images[0]?.url;
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
                  <li>Chất nỉ mềm, dày dặn, giữ form tốt</li>
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
                <li>Bo tay và gấu áo co giãn nhẹ</li>
              </ul>
            ) : null}
            {tab === "size" ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-900">
                      <th className="py-2 pr-3 font-semibold">Size</th>
                      <th className="py-2 pr-3 font-semibold">Ngực (cm)</th>
                      <th className="py-2 pr-3 font-semibold">Dài áo</th>
                      <th className="py-2 font-semibold">Vai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["S", "98–102", "68", "44"],
                      ["M", "102–106", "70", "46"],
                      ["L", "106–110", "72", "48"],
                      ["XL", "110–114", "74", "50"],
                      ["XXL", "114–118", "76", "52"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-neutral-100">
                        {row.map((cell) => (
                          <td key={cell} className="py-2 pr-3">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-neutral-500">
                  Form oversize — nếu thích mặc vừa, chọn nhỏ hơn 1 size.
                </p>
              </div>
            ) : null}
            {tab === "shipping" ? (
              <ul className="list-disc space-y-2 pl-5">
                <li>Giao hàng toàn quốc 2–5 ngày làm việc</li>
                <li>Miễn phí đổi size trong 30 ngày nếu còn tem/tag</li>
                <li>Hoàn tiền theo chính sách cửa hàng khi lỗi sản xuất</li>
                <li>Thanh toán COD hoặc chuyển khoản an toàn</li>
              </ul>
            ) : null}
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-sm bg-neutral-100 md:min-h-[380px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detailImage || "/images/hoodies/kem/05-fabric.jpg"}
              alt={`Chi tiết chất liệu ${color}`}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
