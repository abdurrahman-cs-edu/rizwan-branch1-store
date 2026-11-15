"use client";

import { useState } from "react";
import { SIZES } from "@/lib/config";
import { useCart } from "@/components/CartProvider";
import { effectivePrice } from "@/lib/products";

export default function AddToCart({ product }) {
  const { add } = useCart();
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);

  if (product.sold_out) {
    return (
      <button disabled className="mt-4 w-full cursor-not-allowed rounded bg-stone-300 py-3 text-stone-600">
        Sold out
      </button>
    );
  }

  function onAdd() {
    add({
      slug: product.slug,
      name: product.name,
      price: effectivePrice(product),
      image: (product.images || [])[0] || "",
      size,
      qty,
    });
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Size</p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={
                "min-w-12 rounded border px-3 py-2 text-sm " +
                (s === size
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]"
                  : "border-stone-300")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Quantity</p>
        <div className="inline-flex items-center rounded border border-stone-300">
          <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-10 text-center">{qty}</span>
          <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="w-full rounded bg-[var(--brand)] py-3 text-[var(--brand-contrast)] hover:opacity-90"
      >
        Add to cart
      </button>
    </div>
  );
}
