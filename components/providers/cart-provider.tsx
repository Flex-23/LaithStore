"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartContext,
  type CartItem,
  type CartContextValue,
} from "./cart-context";
import { CartDrawer } from "@/components/cart-drawer";

// v2: prices switched from USD to IQD — older carts must not be reused.
const STORAGE_KEY = "lumiere.cart.v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items, ready]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        const cap = Math.max(item.stock, 1);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id
              ? { ...i, quantity: Math.min(i.quantity + quantity, cap) }
              : i,
          );
        }
        return [...prev, { ...item, quantity: Math.min(quantity, cap) }];
      });
    },
    [],
  );

  const updateQty = useCallback<CartContextValue["updateQty"]>((id, quantity) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return [i];
        const next = Math.min(Math.max(quantity, 0), Math.max(i.stock, 1));
        return next <= 0 ? [] : [{ ...i, quantity: next }];
      }),
    );
  }, []);

  const removeItem = useCallback<CartContextValue["removeItem"]>((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const i of items) {
      c += i.quantity;
      s += i.quantity * i.price;
    }
    return { count: c, subtotal: s };
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      subtotal,
      isOpen,
      ready,
      addItem,
      updateQty,
      removeItem,
      clear,
      openCart,
      closeCart,
    }),
    [items, count, subtotal, isOpen, ready, addItem, updateQty, removeItem, clear, openCart, closeCart],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}
