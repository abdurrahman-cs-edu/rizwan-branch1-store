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
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
        {/* Left: menu button (phones) or menu links (wide screens) */}
        <div className="flex items-center">
          <button
            type="button"
            className="-ml-2 rounded p-2 text-xl lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          <nav className="hidden gap-6 text-[13px] uppercase tracking-[0.18em] lg:flex">
            {MENU.map((m) => (
              <Link key={m.href} href={m.href} className="hover:underline">
                {m.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Centre: logo with the branch name under it */}
        <Link href="/" className="flex flex-col items-center" aria-label={`${SITE.name} home`}>
          <img src="/logo.png" alt={SITE.name} className="h-11 w-auto sm:h-14" />
          <span className="font-display mt-0.5 text-[10px] uppercase tracking-[0.4em] text-stone-600 sm:text-xs">
            {SITE.branch}
          </span>
        </Link>

        {/* Right: search, log in, cart */}
        <div className="flex items-center justify-end gap-1 text-sm">
          <button
            type="button"
            className="rounded p-2"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            🔍
          </button>
          <Link href="/account" className="hidden rounded p-2 text-[13px] uppercase tracking-[0.18em] hover:underline sm:inline">
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
        <nav className="border-t border-stone-200 bg-white px-4 py-2 lg:hidden">
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
