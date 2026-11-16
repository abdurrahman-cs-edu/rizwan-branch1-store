"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SIZES } from "@/lib/config";
import { useCart } from "@/components/CartProvider";
import { effectivePrice } from "@/lib/products";

const BIG_BUTTON =
  "press w-full border border-[#111] py-3.5 text-[13px] font-bold uppercase tracking-[0.3em] transition";

// compact = used inside the quick-view pop-up (no size-guide link, a little tighter).
// onDone = called after the suit was added or "Buy it now" was pressed (the pop-up closes itself then).
export default function AddToCart({ product, compact = false, onDone }) {
  const { add } = useCart();
  const router = useRouter();
  // stock = {"S":3,"M":0,...}; null means the shop does not count quantity for this suit
  const stock = product.stock && typeof product.stock === "object" ? product.stock : null;
  const left = (s) => (stock ? Math.max(0, Number(stock[s]) || 0) : null);
  const inStock = (s) => left(s) === null || left(s) > 0;

  const [size, setSize] = useState(() => (inStock("M") ? "M" : SIZES.find(inStock) || "M"));
  const [qty, setQty] = useState(1);
  const maxQty = Math.min(10, left(size) ?? 10);

  function pickSize(s) {
    setSize(s);
    setQty((q) => Math.max(1, Math.min(q, Math.min(10, left(s) ?? 10))));
  }

  if (product.sold_out) {
    return (
      <button
        disabled
        className="mt-4 w-full cursor-not-allowed border border-stone-300 bg-stone-200 py-3.5 text-[13px] font-bold uppercase tracking-[0.3em] text-stone-500"
      >
        Sold out
      </button>
    );
  }

  function item() {
    return {
      slug: product.slug,
      name: product.name,
      price: effectivePrice(product),
      image: (product.images || [])[0] || "",
      size,
      qty,
    };
  }

  function onAdd() {
    add(item());
    // Back to 1, so choosing another size afterwards cannot add the same big quantity again by mistake.
    setQty(1);
    onDone?.();
  }

  // Buy it now: put the suit in the cart and go straight to checkout.
  function onBuyNow() {
    add(item(), { silent: true });
    onDone?.();
    router.push("/checkout");
  }

  return (
    <div className={compact ? "mt-4 space-y-4" : "mt-5 space-y-5"}>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-[0.15em]">Size</p>
          {!compact && <a href="#size-chart" className="text-xs text-stone-600 underline">Size guide</a>}
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickSize(s)}
              disabled={!inStock(s)}
              title={inStock(s) ? undefined : "Sold out in this size"}
              className={
                "press min-w-12 border px-3 py-2 text-sm transition-colors duration-200 " +
                (!inStock(s)
                  ? "cursor-not-allowed border-stone-200 text-stone-300 line-through"
                  : s === size
                    ? "border-[#111] bg-[#111] text-white"
                    : "border-stone-300 hover:border-stone-500")
              }
            >
              {s}
            </button>
          ))}
        </div>
        {left(size) !== null && left(size) <= 5 && (
          <p className="mt-2 text-xs text-red-600">Only <span className="num">{left(size)}</span> left in size {size}</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.15em]">Quantity</p>
        <div className="inline-flex items-center border border-stone-300">
          <button type="button" aria-label="Less" className="press px-3 py-2 transition-colors hover:bg-stone-100" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span key={qty} className="num pop w-10 text-center">{qty}</span>
          <button type="button" aria-label="More" className="press px-3 py-2 transition-colors hover:bg-stone-100" onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>+</button>
        </div>
      </div>

      <div className="space-y-2.5">
        <button type="button" onClick={onAdd} className={`${BIG_BUTTON} bg-[#111] text-white hover:opacity-85`}>
          Add to cart
        </button>
        <button type="button" onClick={onBuyNow} className={`${BIG_BUTTON} bg-white text-[#111] hover:bg-[#111] hover:text-white`}>
          Buy it now
        </button>
      </div>
    </div>
  );
}
