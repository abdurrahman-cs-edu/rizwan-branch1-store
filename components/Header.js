"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MENU, SITE } from "@/lib/config";
import { useCart } from "@/components/CartProvider";

// Thin-line icons, drawn to match the logo (no emoji).
function Icon({ children, className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const SearchIcon = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Icon>
);

const BagIcon = (props) => (
  <Icon {...props}>
    <path d="M6.2 8h11.6l1 12H5.2l1-12Z" />
    <path d="M9 8V7a3 3 0 0 1 6 0v1" />
  </Icon>
);

const ChevronIcon = (props) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

const MenuIcon = ({ open, ...props }) => (
  <Icon {...props}>{open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</Icon>
);

// menu = [{ label, href, children: [{ label, href }] }], built from the collections in the admin panel.
export default function Header({ menu = MENU }) {
  const { count, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null); // which phone-menu item is expanded
  const [scrolled, setScrolled] = useState(false);

  // The big logo shrinks a little once the page is scrolled, so it does not cover the suits.
  // (Different limits for shrinking and growing, so the header does not flicker.)
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled((s) => (s ? y > 20 : y > 90));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
        {/* Left: menu button (phones, tablets) or menu links (wide screens) */}
        <div className="flex items-center">
          <button
            type="button"
            className="-ml-2 rounded-full p-1.5 hover:bg-stone-100 xl:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MenuIcon open={menuOpen} />
          </button>
          <nav className="hidden gap-7 text-[13px] uppercase tracking-[0.18em] xl:flex">
            {menu.map((m) =>
              m.children?.length ? (
                // Opens when the mouse is over it or when it is reached with the keyboard
                <div key={m.href} className="group relative -my-3 py-3">
                  <Link href={m.href} className="flex items-center gap-1 hover:underline">
                    {m.label}
                    <ChevronIcon className="h-3 w-3 transition-transform group-hover:rotate-180" />
                  </Link>
                  <div className="invisible absolute left-0 top-full z-40 min-w-60 border border-stone-200 bg-white py-2 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {m.children.map((c) => (
                      <Link key={c.href} href={c.href} className="block px-5 py-2 text-[12px] tracking-[0.12em] hover:bg-stone-50 hover:underline">
                        {c.label}
                      </Link>
                    ))}
                    <Link
                      href={m.href}
                      className="mt-1 block border-t border-stone-200 px-5 py-2 text-[12px] font-bold tracking-[0.2em] hover:bg-stone-50"
                    >
                      View all
                    </Link>
                  </div>
                </div>
              ) : (
                <Link key={m.href} href={m.href} className="hover:underline">
                  {m.label}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Centre: logo with the branch name under it */}
        <Link href="/" className="flex flex-col items-center" aria-label={`${SITE.name} home`}>
          <img
            src="/logo.svg"
            alt={SITE.name}
            className={`w-auto transition-[height] duration-200 ${
              scrolled ? "h-9 sm:h-11" : "h-[52px] sm:h-16 xl:h-20"
            }`}
          />
          {!scrolled && (
            <span className="font-logo mt-0.5 text-[9px] uppercase tracking-[0.35em] text-stone-600 sm:text-[10px]">
              {SITE.branch}
            </span>
          )}
        </Link>

        {/* Right: search, log in, cart */}
        <div className="flex items-center justify-end gap-1 text-sm">
          {/* Search bar (laptops and bigger) */}
          <form action="/search" role="search" className="relative mr-2 hidden lg:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              type="search"
              name="q"
              placeholder="Search suits"
              aria-label="Search suits"
              className="h-10 w-40 rounded-full border border-stone-300 bg-stone-50 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-stone-400 focus:w-52 focus:border-[#111] focus:bg-white xl:w-56 xl:focus:w-64"
            />
          </form>
          {/* Search button (phones, tablets): opens the bar under the header */}
          <button
            type="button"
            className="rounded-full p-1.5 hover:bg-stone-100 lg:hidden"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <SearchIcon />
          </button>
          <Link
            href="/account"
            className="hidden rounded p-2 text-[13px] uppercase tracking-[0.18em] hover:underline sm:inline"
          >
            Log in
          </Link>
          <button
            type="button"
            className="relative rounded-full p-1.5 hover:bg-stone-100"
            aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
            onClick={openDrawer}
          >
            <BagIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[11px] font-medium leading-none text-[var(--brand-contrast)]">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form action="/search" role="search" className="mx-auto flex max-w-7xl gap-2 px-4 pb-3 lg:hidden">
          <div className="relative w-full">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              type="search"
              name="q"
              autoFocus
              placeholder="Search suits"
              aria-label="Search suits"
              className="h-10 w-full rounded-full border border-stone-300 bg-stone-50 pl-9 pr-4 text-sm outline-none placeholder:text-stone-400 focus:border-[#111] focus:bg-white"
            />
          </div>
          <button className="rounded-full bg-[var(--brand)] px-5 text-sm text-[var(--brand-contrast)]">Search</button>
        </form>
      )}

      {menuOpen && (
        <nav className="border-t border-stone-200 bg-white px-4 py-2 xl:hidden">
          {menu.map((m) => {
            const kids = m.children || [];
            if (kids.length === 0) {
              return (
                <Link key={m.href} href={m.href} onClick={() => setMenuOpen(false)} className="block py-2 text-sm">
                  {m.label}
                </Link>
              );
            }
            const open = openGroup === m.href;
            return (
              <div key={m.href}>
                <div className="flex items-center justify-between">
                  <Link href={m.href} onClick={() => setMenuOpen(false)} className="flex-1 py-2 text-sm">
                    {m.label}
                  </Link>
                  <button
                    type="button"
                    aria-label={`${open ? "Hide" : "Show"} ${m.label} collections`}
                    aria-expanded={open}
                    className="p-2"
                    onClick={() => setOpenGroup(open ? null : m.href)}
                  >
                    <ChevronIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {open && (
                  <div className="mb-1 ml-3 border-l border-stone-200 pl-3">
                    {kids.map((c) => (
                      <Link key={c.href} href={c.href} onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm text-stone-700">
                        {c.label}
                      </Link>
                    ))}
                    <Link href={m.href} onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm font-medium underline">
                      View all
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
          <Link href="/account" onClick={() => setMenuOpen(false)} className="block py-2 text-sm">
            Log in
          </Link>
        </nav>
      )}
    </header>
  );
}
