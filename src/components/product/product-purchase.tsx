"use client";

import { useMemo, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart, WISHLIST_GUEST_KEY } from "@/components/cart/cart-context";
import { discountPercent, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

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
    rating: number;
    reviewCount: number;
    images: { url: string }[];
    variants: Variant[];
  };
};

export function ProductPurchase({ product }: Props) {
  const { addItem } = useCart();
  const { status } = useSession();
  const [wishSaved, setWishSaved] = useState(false);
  const colors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string | null }>();
    for (const v of product.variants) {
      if (!map.has(v.color)) map.set(v.color, { name: v.color, hex: v.colorHex });
    }
    return [...map.values()];
  }, [product.variants]);

  const [color, setColor] = useState(colors[0]?.name ?? "");
  const sizesForColor = useMemo(
    () => product.variants.filter((v) => v.color === color),
    [product.variants, color],
  );
  const [size, setSize] = useState(sizesForColor[0]?.size ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected =
    product.variants.find((v) => v.color === color && v.size === size) ??
    sizesForColor[0];

  const percent = selected
    ? discountPercent(selected.price, selected.compareAt)
    : null;

  function handleAdd() {
    if (!selected) return;
    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        color: selected.color,
        size: selected.size,
        price: selected.price,
        compareAt: selected.compareAt,
        image: product.images[0]?.url ?? "",
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  async function handleWish() {
    if (!selected) return;
    const payload = {
      variantId: selected.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: selected.color,
      size: selected.size,
      price: selected.price,
      image: product.images[0]?.url ?? "",
    };
    if (status === "authenticated") {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.id }),
      });
    } else {
      try {
        const raw = localStorage.getItem(WISHLIST_GUEST_KEY);
        const list = raw ? (JSON.parse(raw) as typeof payload[]) : [];
        if (!list.some((i) => i.variantId === selected.id)) {
          list.push(payload);
          localStorage.setItem(WISHLIST_GUEST_KEY, JSON.stringify(list));
        }
      } catch {
        /* ignore */
      }
    }
    setWishSaved(true);
    setTimeout(() => setWishSaved(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="text-amber-500">★ {product.rating.toFixed(1)}</span>
          <span>({product.reviewCount} đánh giá)</span>
        </div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
          {product.name}
        </h1>
        {product.description ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 md:text-[15px]">
            {product.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <p className="text-2xl font-bold text-neutral-900">
          {selected ? formatVnd(selected.price) : "—"}
        </p>
        {selected?.compareAt && selected.compareAt > selected.price ? (
          <>
            <p className="text-base text-neutral-400 line-through">
              {formatVnd(selected.compareAt)}
            </p>
            {percent ? (
              <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                {percent}% Giảm
              </span>
            ) : null}
          </>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-800">
          Màu sắc: <span className="font-normal text-neutral-500">{color}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setColor(c.name);
                const next = product.variants.find((v) => v.color === c.name);
                if (next) setSize(next.size);
              }}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition",
                color === c.name ? "border-neutral-900" : "border-transparent",
              )}
              style={{ backgroundColor: c.hex || "#ddd" }}
              aria-label={c.name}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-800">Size</p>
          <a href="#bang-size" className="text-xs text-neutral-500 underline">
            Bảng size
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          {sizesForColor.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock <= 0}
              onClick={() => setSize(v.size)}
              className={cn(
                "min-w-12 rounded border px-3 py-2 text-sm font-medium transition",
                size === v.size
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400",
                v.stock <= 0 && "cursor-not-allowed opacity-40",
              )}
            >
              {v.size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded border border-neutral-200">
          <button
            type="button"
            className="px-3 py-2.5"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Giảm"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            className="px-3 py-2.5"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Tăng"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected || selected.stock <= 0}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" />
          {added ? "Đã thêm!" : "Thêm vào giỏ"}
        </button>

        <button
          type="button"
          onClick={() => void handleWish()}
          className={cn(
            "rounded border border-neutral-200 p-3 transition hover:border-neutral-400",
            wishSaved && "border-[var(--accent)] text-[var(--accent)]",
          )}
          aria-label="Yêu thích"
        >
          <Heart className={cn("h-5 w-5", wishSaved && "fill-current")} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-neutral-100 pt-5 text-center text-[11px] text-neutral-500 sm:text-xs">
        <div className="flex flex-col items-center gap-1.5">
          <Truck className="h-4 w-4" />
          Miễn phí vận chuyển*
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Đổi trả 7 ngày
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          Thanh toán an toàn
        </div>
      </div>
    </div>
  );
}
