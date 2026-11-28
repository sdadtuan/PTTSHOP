"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { canAddLookItem, type LookVariantChoice } from "@/lib/looks";

type Item = {
  productId: string;
  name: string;
  slug: string;
  variants: (LookVariantChoice & { color: string; size: string; price: number; image: string })[];
};

export function LookShop({ items }: { items: Item[] }) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  async function add(item: Item) {
    const variantId = selected[item.productId] || null;
    if (!canAddLookItem(variantId, item.variants)) {
      setNote("Chọn size còn hàng trước khi thêm.");
      return;
    }
    const variant = item.variants.find((row) => row.id === variantId);
    if (!variant) return;
    const result = await addItem({
      variantId: variant.id,
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      image: variant.image,
      forSale: true,
    });
    setNote(result.ok ? `Đã thêm ${item.name} size ${variant.size}.` : result.error);
  }

  return (
    <ul className="mt-8 space-y-6">
      {items.map((item) => {
        const available = item.variants.filter((variant) => variant.stock > 0);
        return (
          <li key={item.productId} className="rounded border border-neutral-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/san-pham/${item.slug}`} className="font-semibold">{item.name}</Link>
              {available.length === 0 ? <span className="text-sm text-red-600">Hết hàng</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  disabled={variant.stock <= 0}
                  aria-pressed={selected[item.productId] === variant.id}
                  onClick={() => setSelected((current) => ({ ...current, [item.productId]: variant.id }))}
                  className="rounded border px-3 py-1 text-sm disabled:text-neutral-400"
                >
                  {variant.label}{variant.stock <= 0 ? " · hết" : ""}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-40"
              disabled={!canAddLookItem(selected[item.productId] || null, item.variants)}
              onClick={() => void add(item)}
            >
              Thêm món này
            </button>
          </li>
        );
      })}
      {note ? <p className="text-sm text-neutral-600">{note}</p> : null}
    </ul>
  );
}
