"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatVnd } from "@/lib/format";
import { WISHLIST_GUEST_KEY } from "@/components/cart/cart-context";
import { useStorefrontUi } from "@/components/cms/storefront-layout-context";

type WishItem = {
  id?: string;
  variantId: string;
  productId?: string;
  slug: string;
  name: string;
  color: string;
  size: string;
  price: number;
  image: string;
};

export default function WishlistPage() {
  const w = useStorefrontUi().wishlist;
  const { status } = useSession();
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (status === "loading") return;
      if (status === "authenticated") {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } else {
        try {
          const raw = localStorage.getItem(WISHLIST_GUEST_KEY);
          setItems(raw ? (JSON.parse(raw) as WishItem[]) : []);
        } catch {
          setItems([]);
        }
      }
      setLoading(false);
    })();
  }, [status]);

  async function remove(variantId: string) {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    if (status === "authenticated") {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
    } else {
      const next = items.filter((i) => i.variantId !== variantId);
      localStorage.setItem(WISHLIST_GUEST_KEY, JSON.stringify(next));
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center text-sm text-neutral-500">
        {w.loading}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="type-title text-3xl font-bold">{w.title}</h1>
        <p className="mt-3 text-sm text-neutral-500">{w.emptyBody}</p>
        <Link
          href="/san-pham"
          className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          {w.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="type-title text-3xl font-bold">{w.title}</h1>
      {status !== "authenticated" ? (
        <p className="mt-2 text-sm text-neutral-500">
          {w.guestHint}{" "}
          <Link href="/dang-nhap" className="text-[var(--accent)]">
            {w.guestLoginLink}
          </Link>{" "}
          để đồng bộ tài khoản.
        </p>
      ) : null}
      <ul className="mt-8 divide-y divide-neutral-100 border border-neutral-100 bg-white">
        {items.map((i) => (
          <li key={i.variantId} className="flex gap-4 p-4">
            <Link href={`/san-pham/${i.slug}`} className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
              {i.image ? (
                <Image src={i.image} alt={i.name} fill className="object-cover" sizes="64px" />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/san-pham/${i.slug}`} className="font-medium hover:text-[var(--accent)]">
                {i.name}
              </Link>
              <p className="text-xs text-neutral-500">
                {i.color} / {i.size}
              </p>
              <p className="mt-1 text-sm font-semibold">{formatVnd(i.price)}</p>
            </div>
            <button
              type="button"
              onClick={() => void remove(i.variantId)}
              className="self-start text-xs text-neutral-500 hover:text-red-600"
            >
              {w.removeLabel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
