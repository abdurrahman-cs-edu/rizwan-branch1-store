"use client";

import { useEffect, useRef } from "react";
import { ANNOUNCEMENTS } from "@/lib/config";

// The bar at the very top. It also tells the page how tall it is (--ann-h), so the home page photo
// can fill exactly the rest of the screen, with no white strip below it.
export default function AnnouncementBar() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--ann-h", `${el.getBoundingClientRect().height}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-[var(--brand)] px-4 py-2 text-center text-xs text-[var(--brand-contrast)] sm:text-sm">
      {ANNOUNCEMENTS.map((text, i) => (
        <span key={text}>
          {i > 0 && <span className="mx-3 opacity-50">|</span>}
          {text}
        </span>
      ))}
    </div>
  );
}
