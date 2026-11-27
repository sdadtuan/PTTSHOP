"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useCart, readGuestWishlistRaw, writeGuestWishlistRaw } from "@/components/cart/cart-context";
import { discountPercent, formatVnd } from "@/lib/format";
import { resolveSwatch, swatchBackground } from "@/lib/color-names";
import { primaryImage } from "@/lib/product-media";
import { cn } from "@/lib/utils";
import { useShopProfile } from "@/components/cms/shop-profile-context";
import { useStorefrontUi } from "@/components/cms/storefront-layout-context";
import { purchaseBadges } from "@/lib/shop/profile";
import { lowStockCount } from "@/lib/catalog/listing";
import { formatStockTemplate } from "@/lib/storefront/ui-copy-types";
import { colorOutOfStock, resolveSizeChoice } from "@/lib/variant-stock";
import { useAssignedVariant } from "@/components/experiments/experiment-provider";
import { buyNowLabel, stickyVisible } from "@/lib/experiments/assign";

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
    customerRating: number | null;
    customerReviewCount: number;
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
  /** Custom chart. Omitted = the original built-in popup. */
  sizeChart?: { columns: string[]; rows: string[][]; note: string } | null;
};

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];
function sizeRank(size: string) {
  const i = SIZE_ORDER.indexOf(size.toUpperCase());
  return i === -1 ? 100 + (Number.parseInt(size, 10) || 0) : i;
}

export function ProductPurchase({ product, color, onColorChange, sizeChart }: Props) {
  const pdp = useStorefrontUi().pdp;
  const shop = useShopProfile();
  const badges = purchaseBadges(shop);
  const buyVariant = useAssignedVariant("buy_now_copy");
  const stickyVariant = useAssignedVariant("sticky_bar");
  const buyLabel = buyNowLabel(buyVariant);
  const { addItem } = useCart();
  const router = useRouter();
  const { status } = useSession();
  const [wishSaved, setWishSaved] = useState(false);
  const sizeGroupRef = useRef<HTMLDivElement>(null);
  const inlineCtaRef = useRef<HTMLDivElement>(null);
  const posting = useRef(false);
  const [postingMode, setPostingMode] = useState<null | "add" | "buy">(null);
  const [choiceError, setChoiceError] = useState("");
  const [cartError, setCartError] = useState("");
  const [showSticky, setShowSticky] = useState(false);
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
  const [size, setSize] = useState(() => resolveSizeChoice(product.variants, color, ""));
  const variantKey = product.variants.map((variant) => variant.id).join(",");
  const sizeKey = `${color}|${variantKey}`;
  const [trackedSizeKey, setTrackedSizeKey] = useState(sizeKey);
  if (trackedSizeKey !== sizeKey) {
    setTrackedSizeKey(sizeKey);
    setSize((current) => resolveSizeChoice(product.variants, color, current));
  }
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const selected = size
    ? (product.variants.find((v) => v.color === color && v.size === size) ?? null)
    : null;
  const lowStock = selected ? lowStockCount(selected.stock, shop.lowStockThreshold) : null;
  const alternative = selected && selected.stock <= 0
    ? product.variants.find((variant) => variant.stock > 0) ?? null
    : null;
  const soldOut =
    sizesForColor.length === 0 ||
    sizesForColor.every((variant) => variant.stock <= 0) ||
    (selected != null && selected.stock <= 0);

  const percent = selected
    ? discountPercent(selected.price, selected.compareAt)
    : null;

  const imageForCart = primaryImage(product.images, color)?.url || "";

  function promptSize() {
    setChoiceError("Vui lòng chọn size");
    sizeGroupRef.current?.scrollIntoView({ block: "center" });
    sizeGroupRef.current?.focus();
  }

  async function submit(mode: "add" | "buy") {
    if (posting.current || soldOut) return;
    if (!selected) {
      promptSize();
      return;
    }
    posting.current = true;
    setPostingMode(mode);
    setCartError("");
    setChoiceError("");
    const result = await addItem(
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
    posting.current = false;
    setPostingMode(null);
    if (!result.ok) {
      setCartError(result.error);
      return;
    }
    void trackStoreEvent("add_to_cart", {
      item_id: selected.id,
      item_name: product.name,
      value: selected.price,
      quantity: qty,
      experiment_buy: buyVariant,
      experiment_sticky: stickyVariant,
    });
    if (mode === "buy") {
      router.push("/thanh-toan");
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  useEffect(() => {
    const root = document.querySelector("[data-storefront-scroller]");
    if (!(root instanceof HTMLElement)) return;
    const update = () => {
      const target = inlineCtaRef.current;
      if (!target) return;
      const rootRect = root.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      setShowSticky(rect.bottom <= rootRect.top + 1);
    };
    const frame = window.requestAnimationFrame(update);
    root.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      root.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

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
        const raw = readGuestWishlistRaw();
        const list = raw ? (JSON.parse(raw) as typeof payload[]) : [];
        if (!list.some((i) => i.variantId === selected.id)) {
          list.push(payload);
          writeGuestWishlistRaw(JSON.stringify(list));
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
        <h1 className="mt-3 type-title text-3xl font-extrabold text-neutral-900 md:text-4xl">
          {product.name}
        </h1>
        {product.customerReviewCount > 0 && product.customerRating != null ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
            <span className="text-amber-500">
              {"★".repeat(Math.round(Math.min(5, product.customerRating)))}
            </span>
            <span className="font-medium text-neutral-800">{product.customerRating.toFixed(1)}</span>
            <span>({product.customerReviewCount} đánh giá)</span>
          </div>
        ) : null}
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
          {pdp.colorLabel}{" "}
          <span className="font-normal text-neutral-500">{color}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const out = colorOutOfStock(product.variants, c.name);
            return (
            <button
              key={c.name}
              type="button"
              disabled={out}
              onClick={() => onColorChange(c.name)}
              className={cn(
                "relative h-9 w-9 rounded-full border-2 p-0.5 transition",
                color === c.name ? "border-neutral-900" : "border-transparent",
                out && "cursor-not-allowed opacity-40",
              )}
              aria-label={out ? `${c.name}, Hết hàng` : c.name}
              aria-pressed={color === c.name}
              title={out ? `${c.name} — Hết hàng` : c.name}
              data-testid="pdp-color-dot"
              data-color={c.name}
              data-hex={c.hex || ""}
              data-stock={out ? "0" : "1"}
            >
              <span
                className="block h-full w-full rounded-full ring-1 ring-black/10"
                style={{ background: c.bg }}
              />
              {out ? (
                <span className="pointer-events-none absolute inset-1 rotate-45 border-t border-neutral-900" aria-hidden="true" />
              ) : null}
            </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-800">{pdp.sizeLabel}</p>
          <button
            type="button"
            onClick={() => setShowChart((v) => !v)}
            className="-my-1.5 inline-flex items-center gap-1 py-1.5 text-xs text-neutral-500 underline"
          >
            <Ruler className="h-3.5 w-3.5" />
            {pdp.sizeChartLink}
          </button>
        </div>
        {showChart ? (
          sizeChart ? (
            <div className="mb-3 max-w-full overflow-x-auto border border-neutral-100 bg-white p-3 text-xs text-neutral-600">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {sizeChart.columns.map((col, i) => (
                      <th key={i} className="py-1 pr-4">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-neutral-50">
                      {sizeChart.columns.map((_, ci) => (
                        <td key={ci} className="py-1 pr-4">
                          {row[ci] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sizeChart.note ? <p className="mt-2 text-[11px] text-neutral-500">{sizeChart.note}</p> : null}
            </div>
          ) : (
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
          )
        ) : null}
        <div
          ref={sizeGroupRef}
          tabIndex={-1}
          id="chon-size"
          data-testid="pdp-size-group"
          aria-invalid={choiceError ? true : undefined}
          className="flex flex-wrap gap-2 outline-none"
        >
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
              aria-label={v.stock <= 0 ? `${v.size}, Hết hàng` : v.size}
              title={v.stock <= 0 ? "Hết hàng" : v.size}
              className={cn(
                "min-w-12 rounded border px-3 py-2 text-sm font-medium transition",
                size === v.size
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400",
                v.stock <= 0 && "cursor-not-allowed opacity-40",
              )}
            >
              <span className={cn(v.stock <= 0 && "line-through")}>{v.size}</span>
              {v.stock <= 0 ? (
                <span className="mt-0.5 block text-[10px] font-normal leading-none">Hết hàng</span>
              ) : null}
            </button>
          ))}
        </div>
        {choiceError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {choiceError}
          </p>
        ) : null}
      </div>

      <p className="-mt-3 text-xs text-neutral-500" data-testid="pdp-stock">
        {selected
          ? selected.stock > 0
            ? lowStock != null
              ? formatStockTemplate(pdp.stockAvailable, {
                  stock: lowStock,
                  color: selected.color,
                  size: selected.size,
                })
              : "Còn hàng"
            : formatStockTemplate(pdp.stockOut, {
                stock: selected.stock,
                color: selected.color,
                size: selected.size,
              })
          : pdp.stockNone}
      </p>
      {alternative ? (
        <button
          type="button"
          className="text-sm text-neutral-800 underline"
          onClick={() => {
            onColorChange(alternative.color);
            setSize(alternative.size);
          }}
        >
          Còn hàng: {alternative.color} / {alternative.size}
        </button>
      ) : null}

      <div ref={inlineCtaRef} className="flex flex-wrap items-center gap-3">
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
          onClick={() => void submit("add")}
          disabled={soldOut || postingMode !== null}
          className="flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded bg-neutral-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" />
          {added ? pdp.addedToCart : pdp.addToCart}
        </button>
        <button
          type="button"
          onClick={() => void submit("buy")}
          disabled={soldOut || postingMode !== null}
          data-testid="pdp-buy-now"
          className="flex min-w-[9rem] flex-1 items-center justify-center rounded border border-neutral-900 bg-white px-5 py-3.5 text-sm font-semibold text-neutral-900 transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
        >
          {postingMode === "buy" ? "Đang xử lý" : buyLabel}
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
      {cartError ? (
        <p className="-mt-3 text-sm text-red-600" role="alert">
          {cartError}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3 border-t border-neutral-100 pt-5 text-center text-[11px] text-neutral-500 sm:text-xs">
        {badges.map((label) => (
          <div key={label} className="flex min-w-24 flex-col items-center gap-1.5">
            {label.startsWith("Freeship") ? <Truck className="h-4 w-4" /> : label.startsWith("Đổi trả") ? <RefreshCw className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {label}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "fixed inset-x-0 z-30 border-t border-neutral-200 bg-white px-4 pt-2 lg:hidden",
          showSticky && stickyVisible(stickyVariant, true) ? "visible" : "invisible pointer-events-none",
        )}
        style={{
          bottom: "var(--ptt-cookie-offset, 0px)",
          paddingBottom:
            "max(0.5rem, calc(env(safe-area-inset-bottom) - var(--ptt-cookie-offset, 0px)))",
        }}
        aria-hidden={showSticky && stickyVisible(stickyVariant, true) ? undefined : true}
        aria-label="Thao tác mua hàng"
        data-testid="pdp-sticky-cta"
      >
        <p className="truncate text-xs text-neutral-500">
          {selected ? `${selected.color} · ${selected.size}` : "Chưa chọn size"}
          <span className="ml-2 font-semibold text-neutral-900">
            {selected ? formatVnd(selected.price) : "—"}
          </span>
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => void submit("add")}
            disabled={soldOut || postingMode !== null}
            className="flex-1 rounded bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pdp.addToCart}
          </button>
          <button
            type="button"
            onClick={() => void submit("buy")}
            disabled={soldOut || postingMode !== null}
            data-testid="pdp-sticky-buy"
            className="flex-1 rounded border border-neutral-900 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 disabled:opacity-50"
          >
            {postingMode === "buy" ? "Đang xử lý" : buyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
