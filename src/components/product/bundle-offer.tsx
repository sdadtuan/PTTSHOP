"use client";

import { useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { priceBundle } from "@/lib/bundles";
import { formatVnd } from "@/lib/format";

type Variant = { id: string; color: string; size: string; price: number; stock: number };
type Item = { productId: string; name: string; slug: string; variants: Variant[] };
type Offer = {
  id: string;
  title: string;
  priceMode: string;
  priceVnd: number | null;
  percentOff: number | null;
  offer: "bundle" | "retail";
  note: string | null;
  items: Item[];
};

/** Tải khi khối vào gần khung nhìn. Không có combo thì không hiện. */
export function BundleOffer({ productId }: { productId: string }) {
  const { addItem, addBundle, refresh } = useCart();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const observer = useRef<IntersectionObserver | null>(null);

  function watch(node: HTMLElement | null) {
    observer.current?.disconnect();
    if (!node || offers) return;
    observer.current = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.current?.disconnect();
      void fetch(`/api/bundles?productId=${encodeURIComponent(productId)}`)
        .then((res) => res.json())
        .then((data: { bundles?: Offer[] }) => setOffers(data.bundles || []))
        .catch(() => setOffers([]));
    }, { rootMargin: "200px" });
    observer.current.observe(node);
  }

  if (offers && offers.length === 0) return null;

  async function add(offer: Offer) {
    const selections = offer.items.map((item) => ({
      productId: item.productId,
      variantId: picked[`${offer.id}:${item.productId}`] || "",
    }));
    if (selections.some((row) => !row.variantId)) {
      setNote("Chọn size còn hàng cho từng món.");
      return;
    }
    if (offer.offer === "retail") {
      for (const item of offer.items) {
        const variant = item.variants.find((row) => row.id === picked[`${offer.id}:${item.productId}`]);
        if (!variant) continue;
        const result = await addItem({
          variantId: variant.id,
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          color: variant.color,
          size: variant.size,
          price: variant.price,
          image: "",
          forSale: true,
        });
        if (!result.ok) {
          setNote(result.error);
          return;
        }
      }
      setNote(offer.note || "Đã thêm phần còn lại theo giá lẻ.");
      await refresh();
      return;
    }
    const result = await addBundle(offer.id, selections);
    setNote(result.ok ? "Đã thêm combo vào giỏ." : result.error);
  }

  return (
    <section ref={watch} className="mx-auto mt-12 max-w-7xl px-4 md:px-6" data-testid="bundle-offer">
      {offers?.map((offer) => {
        const selected = offer.items.map((item) => item.variants.find((row) => row.id === picked[`${offer.id}:${item.productId}`]));
        const ready = selected.every(Boolean);
        const retailSum = selected.reduce((sum, variant) => sum + (variant?.price || 0), 0);
        const priced = ready
          ? priceBundle({
              priceMode: offer.priceMode,
              priceVnd: offer.priceVnd,
              percentOff: offer.percentOff,
              retailSum,
            })
          : null;
        return (
          <div key={offer.id} className="border border-neutral-200 p-4">
            <h2 className="text-lg font-bold">{offer.title}</h2>
            {offer.note ? <p className="mt-1 text-sm text-neutral-600">{offer.note}</p> : null}
            <ul className="mt-4 space-y-4">
              {offer.items.map((item) => (
                <li key={item.productId}>
                  <p className="text-sm font-medium">{item.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.variants.map((variant) => {
                      const key = `${offer.id}:${item.productId}`;
                      const on = picked[key] === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setPicked((prev) => ({ ...prev, [key]: variant.id }))}
                          className={`border px-2 py-1 text-xs ${on ? "border-neutral-900" : "border-neutral-300"}`}
                        >
                          {variant.color} / {variant.size}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
            {offer.offer === "bundle" && priced?.ok ? (
              <p className="mt-3 text-sm">Giá combo {formatVnd(priced.price)}. Giá lẻ {formatVnd(retailSum)}.</p>
            ) : null}
            {offer.offer === "bundle" && priced && !priced.ok ? <p className="mt-3 text-sm text-red-600">{priced.error}</p> : null}
            <button
              type="button"
              disabled={!ready || (offer.offer === "bundle" && !priced?.ok)}
              onClick={() => void add(offer)}
              className="mt-4 rounded bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-neutral-300"
            >
              {offer.offer === "retail" ? "Thêm phần còn lại" : "Thêm combo"}
            </button>
          </div>
        );
      })}
      {note ? <p className="mt-3 text-sm">{note}</p> : null}
    </section>
  );
}
