"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const INTERVAL = 5500; // milliseconds each photo stays

// Full-screen photo slideshow at the top of the home page.
// The header sits on top of it (see Header.js). Photos fade into each other,
// change by themselves, and can be swiped on a phone or changed with the dots / arrows.
export default function HeroSlider({ slides, dark = 0.3, siteName, tagline }) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef(null);

  const go = (k) => setI((((k % n) + n) % n));

  // People who asked their phone for less motion get no automatic changing.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Next photo after a few seconds. Changing by hand restarts the timer.
  useEffect(() => {
    if (n < 2 || paused || reduced) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), INTERVAL);
    return () => clearTimeout(t);
  }, [i, n, paused, reduced]);

  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 45) go(dx < 0 ? i + 1 : i - 1);
  }

  return (
    <section
      data-home-hero
      className="relative isolate h-[86svh] min-h-[460px] touch-pan-y overflow-hidden bg-stone-900 text-white sm:h-[92svh]"
      aria-roledescription="carousel"
      aria-label="Featured photos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h1 className="sr-only">
        {siteName}: {tagline}
      </h1>

      {slides.map((s, k) => (
        <div
          key={s.url + k}
          aria-hidden={k !== i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            k === i ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <img
            src={s.url}
            alt=""
            decoding="async"
            fetchPriority={k === 0 ? "high" : "auto"}
            loading={k === 0 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `${s.x ?? 50}% ${s.y ?? 30}%` }}
          />
          {/* Dark layer so the writing is easy to read on any photo */}
          <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dark})` }} />
          <div className="relative flex h-full flex-col items-center justify-center px-6 pt-16 text-center [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]">
            <p className="font-display max-w-4xl text-balance text-3xl uppercase tracking-[0.06em] sm:text-6xl lg:text-7xl">
              {s.title || siteName}
            </p>
            {!s.title && tagline && <p className="mt-3 text-stone-100 sm:text-lg">{tagline}</p>}
            <Link
              href={s.link || "/collections"}
              tabIndex={k === i ? 0 : -1}
              className="mt-8 inline-block border border-white px-8 py-3 text-[13px] uppercase tracking-[0.3em] [text-shadow:none] hover:bg-white hover:text-[#111]"
            >
              Shop now
            </Link>
          </div>
        </div>
      ))}

      {/* Soft dark band at the top so the white header writing can be read on bright photos */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 bg-gradient-to-b from-black/50 to-transparent" />

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(i - 1)}
            className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/20 hover:bg-black/40 md:flex"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(i + 1)}
            className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/20 hover:bg-black/40 md:flex"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
            {slides.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Show photo ${k + 1}`}
                aria-current={k === i}
                onClick={() => go(k)}
                className="p-2"
              >
                <span className={`block h-2 rounded-full transition-all duration-300 ${k === i ? "w-6 bg-white" : "w-2 bg-white/55"}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
