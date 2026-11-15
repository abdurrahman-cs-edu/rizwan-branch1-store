"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SIZES } from "@/lib/config";
import { useCart } from "@/components/CartProvider";
import { effectivePrice } from "@/lib/products";

const BIG_BUTTON =
  "w-full border border-[#111] py-3.5 text-[13px] font-bold uppercase tracking-[0.3em] transition";

export default function AddToCart({ product }) {
  const { add } = useCart();
  const router = useRouter();
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);

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
  }

  // Buy it now: put the suit in the cart and go straight to checkout.
  function onBuyNow() {
    add(item(), { silent: true });
    router.push("/checkout");
  }

  return (
    <div className="mt-5 space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-[0.15em]">Size</p>
          <a href="#size-chart" className="text-xs text-stone-600 underline">Size guide</a>
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={
                "min-w-12 border px-3 py-2 text-sm " +
                (s === size
                  ? "border-[#111] bg-[#111] text-white"
                  : "border-stone-300 hover:border-stone-500")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.15em]">Quantity</p>
        <div className="inline-flex items-center border border-stone-300">
          <button type="button" aria-label="Less" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-10 text-center">{qty}</span>
          <button type="button" aria-label="More" className="px-3 py-2" onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
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
