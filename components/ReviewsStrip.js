"use client";

import { useEffect, useState } from "react";

// Customer feedback screenshots in a swipeable row. Tap one to see it big.
export default function ReviewsStrip({ title = "Customer feedback", reviews = [] }) {
  const [open, setOpen] = useState(null); // the review being shown big

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = old;
    };
  }, [open]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="mb-1 text-center text-xl uppercase tracking-[0.12em] sm:text-2xl">{title}</h2>
      <p className="mb-5 text-center text-xs text-stone-500">Messages from our happy customers. Tap to enlarge.</p>

      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
        {reviews.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setOpen(r)}
            className="w-40 shrink-0 snap-start text-left sm:w-48"
            aria-label="Open customer feedback"
          >
            <div className="h-64 overflow-hidden border border-stone-200 bg-stone-50 sm:h-80">
              <img src={r.image_url} alt={r.caption || "Customer feedback"} loading="lazy" className="h-full w-full object-cover object-top" />
            </div>
            {r.caption && <p className="mt-1.5 line-clamp-2 text-xs text-stone-600">{r.caption}</p>}
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-lg"
            onClick={() => setOpen(null)}
          >
            ✕
          </button>
          <div className="max-h-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <img src={open.image_url} alt={open.caption || "Customer feedback"} className="max-h-[85vh] w-auto bg-white object-contain" />
            {open.caption && <p className="mt-2 text-center text-sm text-white">{open.caption}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
