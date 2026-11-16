"use client";

import Link from "next/link";
import { useCart, lineKey } from "@/components/CartProvider";
import Price from "@/components/Price";

export default function CartDrawer() {
  const { items, subtotal, drawerOpen, closeDrawer, setQty, remove } = useCart();
  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
        onClick={closeDrawer}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="font-semibold">Your cart</h2>
          <button type="button" onClick={closeDrawer} aria-label="Close" className="p-1 text-lg">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Your cart is empty.</p>
          ) : (
            items.map((l) => {
              const key = lineKey(l.slug, l.size);
              return (
                <div key={key} className="flex gap-3 border-b border-stone-100 py-3">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded bg-stone-100">
                    {l.image && <img src={l.image} alt={l.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-stone-500">Size {l.size}</p>
                    <p><Price value={l.price} /></p>
                    <div className="mt-1 flex items-center gap-2">
                      <button type="button" className="h-6 w-6 rounded border" onClick={() => setQty(key, l.qty - 1)}>−</button>
                      <span className="num">{l.qty}</span>
                      <button type="button" className="h-6 w-6 rounded border" onClick={() => setQty(key, l.qty + 1)}>+</button>
                      <button type="button" className="ml-auto text-xs text-red-600 underline" onClick={() => remove(key)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-2 border-t border-stone-200 p-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold"><Price value={subtotal} /></span>
          </div>
          <Link
            href="/cart"
            onClick={closeDrawer}
            className="block rounded border border-stone-300 py-2 text-center text-sm"
          >
            View cart
          </Link>
          {items.length > 0 && (
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="block rounded bg-[var(--brand)] py-2 text-center text-sm text-[var(--brand-contrast)]"
            >
              Checkout
            </Link>
          )}
          <button type="button" onClick={closeDrawer} className="block w-full py-1 text-center text-sm underline">
            Continue shopping
          </button>
        </div>
      </aside>
    </div>
  );
}
