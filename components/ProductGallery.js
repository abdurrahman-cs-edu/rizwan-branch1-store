"use client";

import { useState } from "react";

export default function ProductGallery({ images = [], name }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-stone-100 p-6 text-center text-stone-400">
        {name}
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-stone-100">
        <img src={images[active]} alt={name} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={
                "h-20 w-16 shrink-0 overflow-hidden rounded border-2 " +
                (i === active ? "border-[var(--brand)]" : "border-transparent")
              }
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
