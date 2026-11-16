"use client";

import { useState } from "react";

// Big photo with the small photos in a column on the left (wide screens)
// or in a row below the big photo (phones).
export default function ProductGallery({ images = [], name }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center bg-stone-100 p-6 text-center text-stone-400">
        {name}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar order-2 flex gap-2 overflow-x-auto md:order-1 md:max-h-[640px] md:w-20 md:shrink-0 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={
                "aspect-[3/4] w-16 shrink-0 overflow-hidden border-2 transition-[opacity,border-color] duration-300 md:w-full " +
                (i === active ? "border-[#111]" : "border-transparent opacity-70 hover:opacity-100")
              }
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="order-1 min-w-0 flex-1 md:order-2">
        <div className="aspect-[3/4] w-full overflow-hidden bg-stone-100">
          <img
            key={active}
            src={images[active]}
            alt={name}
            className="fade-in h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
          />
        </div>
      </div>
    </div>
  );
}
