"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "rc_cart_v1";

export function lineKey(slug, size) {
  return `${slug}__${size}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load saved cart once (localStorage can fail in private mode, so try/catch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((item, options = {}) => {
    setItems((prev) => {
      const key = lineKey(item.slug, item.size);
      const found = prev.find((l) => lineKey(l.slug, l.size) === key);
      if (found) {
        return prev.map((l) =>
          lineKey(l.slug, l.size) === key ? { ...l, qty: Math.min(10, l.qty + item.qty) } : l
        );
      }
      return [...prev, { ...item, qty: Math.min(10, item.qty) }];
    });
    if (!options.silent) setDrawerOpen(true);
  }, []);

  const setQty = useCallback((key, qty) => {
    setItems((prev) =>
      prev
        .map((l) => (lineKey(l.slug, l.size) === key ? { ...l, qty: Math.max(0, Math.min(10, qty)) } : l))
        .filter((l) => l.qty > 0)
    );
  }, []);

  const remove = useCallback((key) => {
    setItems((prev) => prev.filter((l) => lineKey(l.slug, l.size) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((n, l) => n + l.qty, 0);
    const subtotal = items.reduce((n, l) => n + l.price * l.qty, 0);
    return {
      items,
      count,
      subtotal,
      ready,
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [items, ready, add, setQty, remove, clear, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
