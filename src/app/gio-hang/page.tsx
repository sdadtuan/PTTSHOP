"use client";

import { StorefrontImage } from "@/components/product/storefront-image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { useStorefrontUi } from "@/components/cms/storefront-layout-context";
import { formatVnd } from "@/lib/format";
import { displayBrandName } from "@/lib/public-brand";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, loading } = useCart();
  const c = useStorefrontUi().cart;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="type-title text-3xl font-bold">
          {c.title}
        </h1>
        <p className="mt-3 text-neutral-500">{c.loading}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="type-title text-3xl font-bold">
          {c.emptyTitle}
        </h1>
        <p className="mt-3 text-neutral-500">{displayBrandName(c.emptyBody)}</p>
        <Link
          href="/san-pham"
          className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          {c.emptyCta}
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="type-title text-3xl font-bold">
        {c.title}
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_0.9fr]">
        <ul className="min-w-0 divide-y divide-neutral-100 border border-neutral-100 bg-white">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-4 p-4 md:p-5">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-neutral-100">
                {item.image ? (
                  <StorefrontImage
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/san-pham/${item.slug}`}
                      className="font-medium text-neutral-900 hover:text-[var(--accent)]"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.color} · Size {item.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="-m-2 p-2 text-neutral-400 hover:text-red-500"
                    aria-label="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center border border-neutral-200">
                    <button
                      type="button"
                      className="px-2 py-1.5"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-7 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-1.5"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-semibold">
                    {formatVnd(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit min-w-0 border border-neutral-100 bg-white p-6">
          <h2 className="type-title text-lg font-bold">
            {c.summaryTitle}
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">{c.subtotalLabel}</dt>
              <dd>{formatVnd(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">{c.shippingLabel}</dt>
              <dd>{shipping === 0 ? c.shippingFree : formatVnd(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-semibold">
              <dt>{c.totalLabel}</dt>
              <dd>{formatVnd(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-neutral-500">
            {c.shippingNote}
          </p>
          <Link
            href="/thanh-toan"
            className="mt-6 flex w-full items-center justify-center rounded bg-[var(--accent)] py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {c.checkoutCta}
          </Link>
        </aside>
      </div>
    </div>
  );
}
