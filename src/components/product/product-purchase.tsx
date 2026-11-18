"use client";

import { useMemo, useState } from "react";
import {
  Heart,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart, WISHLIST_GUEST_KEY } from "@/components/cart/cart-context";
import { discountPercent, formatVnd } from "@/lib/format";
import { resolveSwatch, swatchBackground } from "@/lib/color-names";
import { primaryImage } from "@/lib/product-media";
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
    isNew?: boolean;
    rating: number;
    reviewCount: number;
    images: {
      url: string;
      color?: string | null;
      type?: string | null;
      isHidden?: boolean | null;
    }[];
    variants: Variant[];
  };
  color: string;
  onColorChange: (color: string) => void;
};

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];
function sizeRank(size: string) {
  const i = SIZE_ORDER.indexOf(size.toUpperCase());
  return i === -1 ? 100 + (Number.parseInt(size, 10) || 0) : i;
}

export function ProductPurchase({ product, color, onColorChange }: Props) {
  const { addItem } = useCart();
  const { status } = useSession();
  const [wishSaved, setWishSaved] = useState(false);
  const colors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string | null; bg: string }>();
    for (const v of product.variants) {
      if (!map.has(v.color)) {
        // Legacy rows saved with the old default #111111 resolve from the name
        // ("trắng" → white); multi-colour names render as a split dot.
        const sw = resolveSwatch(v.color, v.colorHex);
        map.set(v.color, { name: v.color, hex: sw.hex, bg: swatchBackground(sw.stops) });
      }
    }
    return [...map.values()];
  }, [product.variants]);

  const sizesForColor = useMemo(
    () =>
      product.variants
        .filter((v) => v.color === color)
        .sort((a, b) => sizeRank(a.size) - sizeRank(b.size)),
    [product.variants, color],
  );
  const [size, setSize] = useState(
    sizesForColor.find((v) => v.stock > 0)?.size ?? sizesForColor[0]?.size ?? "",
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const selected =
    product.variants.find((v) => v.color === color && v.size === size) ??
    sizesForColor[0];

  const percent = selected
    ? discountPercent(selected.price, selected.compareAt)
    : null;

  const imageForCart = primaryImage(product.images, color)?.url || "";

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
        image: imageForCart,
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
      image: imageForCart,
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
        {product.isNew ? (
          <span className="inline-flex rounded bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
            Mới về
          </span>
        ) : null}
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
          {product.name}
        </h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
          <span className="text-amber-500">
            {"★".repeat(Math.round(Math.min(5, product.rating || 5)))}
          </span>
          <span className="font-medium text-neutral-800">
            {product.rating > 0 ? product.rating.toFixed(1) : "5.0"}
          </span>
          <span>({product.reviewCount} đánh giá)</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <p className="text-3xl font-extrabold text-[var(--accent)]">
          {selected ? formatVnd(selected.price) : "—"}
        </p>
        {selected?.compareAt && selected.compareAt > selected.price ? (
          <>
            <p className="pb-1 text-base text-neutral-400 line-through">
              {formatVnd(selected.compareAt)}
            </p>
            {percent ? (
              <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-xs font-bold text-white">
                {percent}% GIẢM
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
                onColorChange(c.name);
                const next =
                  product.variants.find(
                    (v) => v.color === c.name && v.size === size && v.stock > 0,
                  ) ??
                  product.variants.find((v) => v.color === c.name && v.stock > 0) ??
                  product.variants.find((v) => v.color === c.name);
                if (next) setSize(next.size);
              }}
              className={cn(
                "h-9 w-9 rounded-full border-2 p-0.5 transition",
                color === c.name ? "border-neutral-900" : "border-transparent",
              )}
              aria-label={c.name}
              aria-pressed={color === c.name}
              title={c.name}
              data-testid="pdp-color-dot"
              data-color={c.name}
              data-hex={c.hex || ""}
            >
              <span
                className="block h-full w-full rounded-full ring-1 ring-black/10"
                style={{ background: c.bg }}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-800">Kích thước:</p>
          <button
            type="button"
            onClick={() => setShowChart((v) => !v)}
            className="-my-1.5 inline-flex items-center gap-1 py-1.5 text-xs text-neutral-500 underline"
          >
            <Ruler className="h-3.5 w-3.5" />
            Bảng size
          </button>
        </div>
        {showChart ? (
          <div className="mb-3 overflow-x-auto border border-neutral-100 bg-white p-3 text-xs text-neutral-600">
            <table className="min-w-full text-left" id="bang-size">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="py-1 pr-4">Size</th>
                  <th className="py-1 pr-4">Ngực (cm)</th>
                  <th className="py-1 pr-4">Dài áo (cm)</th>
                  <th className="py-1">Vai (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["S", "96", "68", "44"],
                  ["M", "100", "70", "46"],
                  ["L", "104", "72", "48"],
                  ["XL", "108", "74", "50"],
                  ["XXL", "112", "76", "52"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-neutral-50">
                    {row.map((cell) => (
                      <td key={cell} className="py-1 pr-4">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {sizesForColor.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock <= 0}
              onClick={() => setSize(v.size)}
              data-testid="pdp-size"
              data-size={v.size}
              data-stock={v.stock}
              aria-pressed={size === v.size}
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

      <p className="-mt-3 text-xs text-neutral-500" data-testid="pdp-stock">
        {selected
          ? selected.stock > 0
            ? `Còn ${selected.stock} sản phẩm (${selected.color} / ${selected.size})`
            : `Hết hàng (${selected.color} / ${selected.size})`
          : "Chưa có biến thể"}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded border border-neutral-200 bg-white">
          <button
            type="button"
            className="px-3 py-3"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Giảm"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            className="px-3 py-3"
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
          className="flex flex-1 items-center justify-center gap-2 rounded bg-neutral-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" />
          {added ? "Đã thêm!" : "Thêm vào giỏ hàng"}
        </button>

        <button
          type="button"
          onClick={() => void handleWish()}
          className={cn(
            "rounded border border-neutral-200 p-3.5 transition hover:border-neutral-400",
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
          Free Shipping
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Đổi trả 30 ngày
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          Thanh toán an toàn
        </div>
      </div>
    </div>
  );
}
