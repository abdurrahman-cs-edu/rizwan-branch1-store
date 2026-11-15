"use client";

import Link from "next/link";
import { useCart, lineKey } from "@/components/CartProvider";
import { formatPKR } from "@/lib/products";
import { PREPAID_DISCOUNT_PERCENT } from "@/lib/config";

export default function CartPage() {
  const { items, subtotal, ready, setQty, remove } = useCart();

  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-stone-500">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/collections" className="mt-6 inline-block rounded bg-[var(--brand)] px-6 py-3 text-[var(--brand-contrast)]">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Your cart</h1>

      <div className="mt-4 divide-y divide-stone-200">
        {items.map((l) => {
          const key = lineKey(l.slug, l.size);
          return (
            <div key={key} className="flex gap-4 py-4">
              <Link href={`/products/${l.slug}`} className="h-28 w-22 shrink-0 overflow-hidden rounded bg-stone-100">
                {l.image && <img src={l.image} alt={l.name} className="h-28 w-[88px] object-cover" />}
              </Link>
              <div className="flex-1 text-sm">
                <Link href={`/products/${l.slug}`} className="font-medium hover:underline">{l.name}</Link>
                <p className="text-stone-500">Size {l.size}</p>
                <p>{formatPKR(l.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" className="h-7 w-7 rounded border" onClick={() => setQty(key, l.qty - 1)}>−</button>
                  <span className="w-6 text-center">{l.qty}</span>
                  <button type="button" className="h-7 w-7 rounded border" onClick={() => setQty(key, l.qty + 1)}>+</button>
                  <button type="button" className="ml-4 text-xs text-red-600 underline" onClick={() => remove(key)}>Remove</button>
                </div>
              </div>
              <div className="text-sm font-semibold">{formatPKR(l.price * l.qty)}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-stone-50 p-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">{formatPKR(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-green-700">
          Choose Advance / prepaid payment at checkout to get an additional {PREPAID_DISCOUNT_PERCENT}% discount.
          Delivery charges, if any, are confirmed on WhatsApp.
        </p>
        <Link
          href="/checkout"
          className="mt-4 block rounded bg-[var(--brand)] py-3 text-center text-[var(--brand-contrast)]"
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
