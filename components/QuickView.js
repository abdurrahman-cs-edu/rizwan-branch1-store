"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AddToCart from "@/components/AddToCart";
import Price from "@/components/Price";
import SaleTag from "@/components/SaleTag";
import { CloseIcon } from "@/components/Icons";
import { effectivePrice, isOnSale } from "@/lib/products";
import { useLockScroll, useMountTransition } from "@/lib/useMountTransition";

const QuickViewContext = createContext(null);

// Any suit card can call openQuick(product) to show the small pop-up instead of a new page.
export function useQuickView() {
  const ctx = useContext(QuickViewContext);
  return ctx || { openQuick: () => {} };
}

// Lives once in the layout. Holds the pop-up and which suit it shows.
export function QuickViewProvider({ children }) {
  const pathname = usePathname();
  const [product, setProduct] = useState(null);
  const [open, setOpen] = useState(false);

  const openQuick = useCallback((p) => {
    setProduct(p);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  // Going to another page closes it
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const value = useMemo(() => ({ openQuick }), [openQuick]);

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <QuickViewModal product={product} open={open} onClose={close} />
    </QuickViewContext.Provider>
  );
}

function QuickViewModal({ product, open, onClose }) {
  const { mounted, shown } = useMountTransition(open, 300);
  const [active, setActive] = useState(0);
  const closeBtn = useRef(null);
  const lastFocus = useRef(null);

  useLockScroll(open);

  // First photo again for every suit
  useEffect(() => {
    setActive(0);
  }, [product?.slug]);

  // Escape closes; focus goes into the pop-up and comes back to the button afterwards
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const t = setTimeout(() => closeBtn.current?.focus({ preventScroll: true }), 60);
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!mounted || !product) return null;

  const images = product.images || [];
  const onSale = isOnSale(product) && !product.sold_out;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close quick view"
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative flex max-h-[92svh] w-full max-w-4xl flex-col overflow-y-auto bg-white shadow-2xl transition-[opacity,transform] duration-300 ease-out sm:h-[min(88svh,620px)] sm:flex-row sm:overflow-hidden ${
          shown ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-10 opacity-0 sm:translate-y-4 sm:scale-[0.97]"
        }`}
      >
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="press absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#111] shadow transition-colors hover:bg-white"
        >
          <CloseIcon />
        </button>

        {/* Photos */}
        <div className="flex shrink-0 flex-col bg-stone-100 sm:w-[44%]">
          <div className="relative h-[44svh] w-full overflow-hidden sm:h-auto sm:min-h-0 sm:flex-1">
            {images.length > 0 ? (
              <img key={active} src={images[active]} alt={product.name} className="fade-in absolute inset-0 h-full w-full object-contain sm:object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 text-center text-stone-400">{product.name}</div>
            )}
            {product.is_new && (
              <span className="absolute left-2 top-2 bg-black px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">New</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto bg-white p-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={`h-14 w-11 shrink-0 overflow-hidden border transition-[opacity,border-color] duration-200 ${
                    i === active ? "border-[#111]" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 px-5 pb-7 pt-5 sm:overflow-y-auto sm:px-8 sm:pb-8 sm:pt-9">
          <h2 className="pr-10 font-display text-lg uppercase leading-snug tracking-[0.14em] sm:text-xl">{product.name}</h2>

          <div className="mt-3">
            {onSale ? (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-light">
                <span className="text-stone-400 line-through"><Price value={product.price} /></span>
                <span className="text-red-600"><Price value={effectivePrice(product)} /></span>
                <SaleTag p={product} />
              </p>
            ) : (
              <p className="text-lg font-light text-stone-700"><Price value={product.price} /></p>
            )}
          </div>

          {product.fabric && <p className="mt-3 text-sm text-stone-600">{product.fabric}</p>}

          <div className="border-t border-stone-200 pt-1">
            <AddToCart product={product} compact onDone={onClose} />
          </div>

          <Link
            href={`/products/${product.slug}`}
            onClick={onClose}
            className="slide-underline mt-6 inline-block pb-0.5 text-[13px] uppercase tracking-[0.18em]"
          >
            View full details
          </Link>
        </div>
      </div>
    </div>
  );
}
