"use client";

import { useEffect, useState } from "react";

// For things that slide / fade in AND out (cart, quick view).
//   mounted = keep it on the page (true while it is animating out too)
//   shown   = play the "open" look (false = the closed look)
// Use:  const { mounted, shown } = useMountTransition(open, 300);  if (!mounted) return null;
export function useMountTransition(open, ms = 300) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // two frames, so the browser paints the closed look first and then animates to the open look
      let b;
      const a = requestAnimationFrame(() => {
        b = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(a);
        if (b) cancelAnimationFrame(b);
      };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);

  return { mounted, shown };
}

// Stops the page behind a pop-up from scrolling while the pop-up is open.
export function useLockScroll(locked) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const old = document.body.style.overflow;
    const oldPad = document.body.style.paddingRight;
    const bar = window.innerWidth - html.clientWidth; // keeps the page from jumping sideways
    document.body.style.overflow = "hidden";
    if (bar > 0) document.body.style.paddingRight = `${bar}px`;
    return () => {
      document.body.style.overflow = old;
      document.body.style.paddingRight = oldPad;
    };
  }, [locked]);
}
