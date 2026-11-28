"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { migrateStorageValue } from "@/lib/legacy-storage";

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  color: string;
  size: string;
  price: number;
  compareAt?: number | null;
  image: string;
  quantity: number;
  forSale?: boolean;
  bundleId?: string | null;
  bundleDiscountShare?: number;
  bundleBlocksCoupon?: boolean;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (
    item: Omit<CartLine, "quantity" | "bundleId" | "bundleDiscountShare" | "bundleBlocksCoupon">,
    quantity?: number,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  addBundle: (
    bundleId: string,
    selections: { productId: string; variantId: string }[],
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const WISHLIST_GUEST_KEY = "ptt-wishlist";
const LEGACY_WISHLIST_KEY = "vizfas-wishlist";

export function readGuestWishlistRaw() {
  if (typeof window === "undefined") return null;
  return migrateStorageValue(localStorage, WISHLIST_GUEST_KEY, LEGACY_WISHLIST_KEY);
}

export function writeGuestWishlistRaw(value: string) {
  localStorage.setItem(WISHLIST_GUEST_KEY, value);
}

type ApiCart = {
  items: CartLine[];
  count: number;
  subtotal: number;
};

async function fetchCart(): Promise<ApiCart> {
  const res = await fetch("/api/cart", { credentials: "same-origin" });
  if (!res.ok) return { items: [], count: 0, subtotal: 0 };
  return res.json();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const data = await fetchCart();
    setItems(data.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Merge guest cart when user logs in
  useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      await fetch("/api/cart/merge", {
        method: "POST",
        credentials: "same-origin",
      });
      // Merge guest wishlist (localStorage) into server
      try {
        const raw = readGuestWishlistRaw();
        if (raw) {
          const guest = JSON.parse(raw) as { variantId: string }[];
          for (const g of guest) {
            await fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ variantId: g.variantId }),
            });
          }
          localStorage.removeItem(WISHLIST_GUEST_KEY);
        }
      } catch {
        /* ignore */
      }
      await refresh();
    })();
  }, [status, refresh]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return {
      items,
      count,
      subtotal,
      loading,
      refresh,
      addBundle: (bundleId, selections) => {
        return (async () => {
          try {
            const res = await fetch("/api/cart/bundles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ bundleId, selections }),
            });
            const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
            await refresh();
            if (!res.ok) {
              const error = typeof data?.error === "string" ? data.error : "Không thêm được combo";
              return { ok: false as const, error };
            }
            return { ok: true as const };
          } catch {
            await refresh();
            return { ok: false as const, error: "Không thêm được combo" };
          }
        })();
      },
      addItem: (item, quantity = 1) => {
        startTransition(() => {
          setItems((prev) => {
            const existing = prev.find((p) => p.variantId === item.variantId);
            if (existing) {
              return prev.map((p) =>
                p.variantId === item.variantId
                  ? { ...p, quantity: p.quantity + quantity }
                  : p,
              );
            }
            return [...prev, { ...item, quantity }];
          });
        });
        return (async () => {
          try {
            const res = await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ variantId: item.variantId, quantity }),
            });
            const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
            await refresh();
            if (!res.ok) {
              const error = typeof data?.error === "string" ? data.error : "Không thêm được vào giỏ";
              return { ok: false as const, error };
            }
            return { ok: true as const };
          } catch {
            await refresh();
            return { ok: false as const, error: "Không thêm được vào giỏ" };
          }
        })();
      },
      removeItem: (variantId) => {
        setItems((prev) => prev.filter((p) => p.variantId !== variantId));
        void fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ variantId }),
        }).then(() => refresh());
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          setItems((prev) => prev.filter((p) => p.variantId !== variantId));
        } else {
          setItems((prev) =>
            prev.map((p) => (p.variantId === variantId ? { ...p, quantity } : p)),
          );
        }
        void fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ variantId, quantity }),
        }).then(() => refresh());
      },
      clear: () => {
        setItems([]);
        void fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ clear: true }),
        });
      },
    };
  }, [items, loading, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
