"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart, lineKey } from "@/components/CartProvider";
import Price from "@/components/Price";
import { CloseIcon } from "@/components/Icons";
import { AnimatedRow, useLeaving } from "@/components/RowAnim";
import { useLockScroll, useMountTransition } from "@/lib/useMountTransition";

// The cart that slides in from the right. The dark background fades in with it,
// a suit folds away smoothly when it is removed, and it all slides out again when closed.
export default function CartDrawer() {
  const { items, subtotal, drawerOpen, closeDrawer, setQty, remove } = useCart();
  const { mounted, shown } = useMountTransition(drawerOpen, 350);
  const { leaving, start } = useLeaving(300);

  useLockScroll(drawerOpen);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  if (!mounted) return null;

  function change(key, qty) {
    if (qty <= 0) start(key, () => setQty(key, 0));
    else setQty(key, qty);
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={-1}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={closeDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="font-semibold">Your cart</h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close"
            className="press -mr-1 rounded-full p-1.5 transition-colors hover:bg-stone-100"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="fade-in py-10 text-center">
              <p className="text-sm text-stone-500">Your cart is empty.</p>
              <Link
                href="/collections"
                onClick={closeDrawer}
                className="slide-underline mt-4 inline-block pb-0.5 text-[13px] uppercase tracking-[0.18em]"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            items.map((l, i) => {
              const key = lineKey(l.slug, l.size);
              return (
                <AnimatedRow key={key} leaving={!!leaving[key]}>
                  <div className="cart-line-in flex gap-3 border-b border-stone-100 py-3" style={{ animationDelay: `${i * 60}ms` }}>
                    <Link href={`/products/${l.slug}`} onClick={closeDrawer} className="h-20 w-16 shrink-0 overflow-hidden rounded bg-stone-100">
                      {l.image && <img src={l.image} alt={l.name} className="h-full w-full object-cover" />}
                    </Link>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{l.name}</p>
                      <p className="text-stone-500">Size {l.size}</p>
                      <p><Price value={l.price} /></p>
                      <div className="mt-1 flex items-center gap-2">
                        <button type="button" aria-label="Less" className="press h-6 w-6 rounded border transition-colors hover:bg-stone-100" onClick={() => change(key, l.qty - 1)}>−</button>
                        <span key={l.qty} className="num pop">{l.qty}</span>
                        <button type="button" aria-label="More" className="press h-6 w-6 rounded border transition-colors hover:bg-stone-100" onClick={() => change(key, l.qty + 1)}>+</button>
                        <button
                          type="button"
                          className="ml-auto text-xs text-red-600 underline transition-opacity hover:opacity-70"
                          onClick={() => start(key, () => remove(key))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimatedRow>
              );
            })
          )}
        </div>

        <div className="space-y-2 border-t border-stone-200 p-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span key={subtotal} className="pop"><Price value={subtotal} /></span>
          </div>
          <Link
            href="/cart"
            onClick={closeDrawer}
            className="press block rounded border border-stone-300 py-2 text-center text-sm transition-colors hover:bg-stone-50"
          >
            View cart
          </Link>
          {items.length > 0 && (
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="press block rounded bg-[var(--brand)] py-2 text-center text-sm text-[var(--brand-contrast)] transition-opacity hover:opacity-85"
            >
              Checkout
            </Link>
          )}
          <button type="button" onClick={closeDrawer} className="block w-full py-1 text-center text-sm underline transition-opacity hover:opacity-70">
            Continue shopping
          </button>
        </div>
      </aside>
    </div>
  );
}
