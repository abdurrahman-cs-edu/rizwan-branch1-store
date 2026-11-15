"use client";

import Link from "next/link";
import { useState } from "react";
import { MENU, SITE } from "@/lib/config";
import { useCart } from "@/components/CartProvider";

export default function Header() {
  const { count, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="rounded p-2 text-xl md:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <Link href="/" className="text-lg font-bold tracking-wide sm:text-xl">
          {SITE.name}
          <span className="ml-2 hidden text-xs font-normal text-stone-500 sm:inline">{SITE.branch}</span>
        </Link>

        <nav className="ml-6 hidden gap-6 text-sm md:flex">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="hover:underline">
              {m.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 text-sm">
          <button
            type="button"
            className="rounded p-2"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            🔍
          </button>
          <Link href="/account" className="hidden rounded p-2 hover:underline sm:inline">
            Log in
          </Link>
          <button
            type="button"
            className="relative rounded p-2"
            aria-label="Open cart"
            onClick={openDrawer}
          >
            🛒
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[11px] text-[var(--brand-contrast)]">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form action="/search" className="mx-auto flex max-w-6xl gap-2 px-4 pb-3">
          <input
            name="q"
            autoFocus
            placeholder="Search suits"
            className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <button className="rounded bg-[var(--brand)] px-4 py-2 text-sm text-[var(--brand-contrast)]">
            Search
          </button>
        </form>
      )}

      {menuOpen && (
        <nav className="border-t border-stone-200 bg-white px-4 py-2 md:hidden">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm"
            >
              {m.label}
            </Link>
          ))}
          <Link href="/account" onClick={() => setMenuOpen(false)} className="block py-2 text-sm">
            Log in
          </Link>
        </nav>
      )}
    </header>
  );
}
