"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";

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
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "vizfas-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return {
      items,
      count,
      subtotal,
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
      },
      removeItem: (variantId) => {
        setItems((prev) => prev.filter((p) => p.variantId !== variantId));
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          setItems((prev) => prev.filter((p) => p.variantId !== variantId));
          return;
        }
        setItems((prev) =>
          prev.map((p) => (p.variantId === variantId ? { ...p, quantity } : p)),
        );
      },
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
