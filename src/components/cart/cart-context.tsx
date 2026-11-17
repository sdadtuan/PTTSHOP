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
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const WISHLIST_GUEST_KEY = "vizfas-wishlist";

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
        const raw = localStorage.getItem(WISHLIST_GUEST_KEY);
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
        void fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ variantId: item.variantId, quantity }),
        }).then(() => refresh());
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

export { WISHLIST_GUEST_KEY };
