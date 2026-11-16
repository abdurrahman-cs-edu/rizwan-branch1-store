"use client";

import Link from "next/link";
import { useCart, lineKey } from "@/components/CartProvider";
import Price from "@/components/Price";
import { PREPAID_DISCOUNT_PERCENT, SHIPPING_FEE } from "@/lib/config";
import { AnimatedRow, useLeaving } from "@/components/RowAnim";

export default function CartPage() {
  const { items, subtotal, ready, setQty, remove } = useCart();
  const { leaving, start } = useLeaving(300);

  // Taking the last one away folds the row up first, then removes it
  function change(key, qty) {
    if (qty <= 0) start(key, () => setQty(key, 0));
    else setQty(key, qty);
  }

  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-stone-500">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="fade-in mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/collections" className="press mt-6 inline-block rounded bg-[var(--brand)] px-6 py-3 text-[var(--brand-contrast)] transition-opacity hover:opacity-85">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Your cart</h1>

      <div className="mt-4">
        {items.map((l) => {
          const key = lineKey(l.slug, l.size);
          return (
            <AnimatedRow key={key} leaving={!!leaving[key]}>
            <div className="flex gap-4 border-b border-stone-200 py-4">
              <Link href={`/products/${l.slug}`} className="h-28 w-22 shrink-0 overflow-hidden rounded bg-stone-100">
                {l.image && <img src={l.image} alt={l.name} className="h-28 w-[88px] object-cover" />}
              </Link>
              <div className="flex-1 text-sm">
                <Link href={`/products/${l.slug}`} className="font-medium hover:underline">{l.name}</Link>
                <p className="text-stone-500">Size {l.size}</p>
                <p><Price value={l.price} /></p>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" aria-label="Less" className="press h-7 w-7 rounded border transition-colors hover:bg-stone-100" onClick={() => change(key, l.qty - 1)}>−</button>
                  <span key={l.qty} className="num pop w-6 text-center">{l.qty}</span>
                  <button type="button" aria-label="More" className="press h-7 w-7 rounded border transition-colors hover:bg-stone-100" onClick={() => change(key, l.qty + 1)}>+</button>
                  <button type="button" className="ml-4 text-xs text-red-600 underline transition-opacity hover:opacity-70" onClick={() => start(key, () => remove(key))}>Remove</button>
                </div>
              </div>
              <div key={l.qty} className="pop text-sm font-semibold"><Price value={l.price * l.qty} /></div>
            </div>
            </AnimatedRow>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-stone-50 p-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span key={subtotal} className="pop font-semibold"><Price value={subtotal} /></span>
        </div>
        <p className="mt-1 text-xs text-green-700">
          Choose Advance / prepaid payment at checkout to get an additional {PREPAID_DISCOUNT_PERCENT}% discount.
          A flat delivery charge of <Price value={SHIPPING_FEE} /> is added at checkout.
        </p>
        <Link
          href="/checkout"
          className="press mt-4 block rounded bg-[var(--brand)] py-3 text-center text-[var(--brand-contrast)] transition-opacity hover:opacity-85"
        >
          Checkout
        </Link>
        <Link href="/collections" className="mt-2 block text-center text-sm underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
