"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MENU, SITE } from "@/lib/config";
import { useCart } from "@/components/CartProvider";
import { BagIcon, ChevronIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/Icons";

// menu = { laptop: [item], phone: [item] }, item = { id, label, href, children: [{ label, href }] }, built from the collections and the
// Menu tab in the admin panel (the PC navbar and the Mobile menu are two separate lists). A plain list is used for both.
//
// On the home page the header sits on top of the big photo: transparent, with white writing and a white logo.
// Once the page is scrolled (and on every other page) it is a white bar with the dark logo.
// The home page is recognised by its photo (data-home-hero), in CSS (see globals.css, ".site-header").
// It is NOT recognised by the address, because the server does not always know the address when it
// rebuilds a page, and then the first screen came out wrong.
export default function Header({ menu = MENU }) {
  // The wide-screen bar and the 3-lines menu each have their own list in the admin panel.
  const desktopMenu = Array.isArray(menu) ? menu : menu.laptop;
  const phoneMenu = Array.isArray(menu) ? menu : menu.phone;
  const { count, openDrawer } = useCart();
  const pathname = usePathname(); // only used to run the effects below again on every new page
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null); // which phone-menu item is expanded
  const [openNav, setOpenNav] = useState(null); // which wide-screen drop-down is open (opened by its small arrow only)
  const [scrolled, setScrolled] = useState(false);
  const searchInput = useRef(null);

  // Scrolling makes the header white, and the big logo a little smaller so it does not cover the suits.
  // (Different limits for going down and coming back, so the header does not flicker.
  // Only other pages need a wide gap: there the header takes space, so a size change moves the page.)
  useEffect(() => {
    const down = document.querySelector("[data-home-hero]") ? 60 : 120;
    function onScroll() {
      const y = window.scrollY;
      setScrolled((s) => (s ? y > 20 : y > down));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // A new page closes the phone menu, the search row and the drop-down.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setOpenNav(null);
  }, [pathname]);

  // The drop-down closes when you click anywhere else, or press Escape.
  useEffect(() => {
    if (!openNav) return;
    function onDown(e) {
      if (!e.target.closest?.("[data-nav-item]")) setOpenNav(null);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpenNav(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openNav]);

  // Opening the search row puts the cursor in the box; Escape closes it.
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => searchInput.current?.focus({ preventScroll: true }), 120);
    function onKey(e) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  // "clear" = at the top of the page with nothing open. On the home page that means: transparent, white writing.
  const clear = !scrolled && !menuOpen && !searchOpen;

  return (
    <header className="site-header sticky top-0 z-30" data-clear={clear}>
      <div className="site-bar border-b border-stone-200 bg-white/95 text-[#111] backdrop-blur transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2">
            {/* Left: menu button (phones, tablets) and the search icon */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="site-btn -ml-1 rounded-full p-1 hover:bg-stone-100 sm:-ml-2 sm:p-1.5 xl:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MenuIcon open={menuOpen} />
              </button>
              {/* Search: opens the search bar under the header */}
              <button
                type="button"
                className="site-btn rounded-full p-1 hover:bg-stone-100 sm:p-1.5 xl:-ml-1.5"
                aria-label="Search"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((v) => !v)}
              >
                <SearchIcon />
              </button>
            </div>

            {/* Centre: logo with the branch name under it */}
            <Link href="/" className="flex flex-col items-center" aria-label={`${SITE.name} home`}>
              {/* The logo file is cut in two, so the Rizwan name can be bigger than the small CLOTHING STORE line */}
              <img
                src="/logo-name.svg"
                alt={SITE.name}
                className={`site-logo w-auto transition-[height,filter] duration-300 ${
                  scrolled ? "h-8 sm:h-10" : "h-11 sm:h-20 xl:h-24"
                }`}
              />
              <img
                src="/logo-store.svg"
                alt=""
                className={`site-logo h-auto transition-[width,filter] duration-300 ${
                  scrolled ? "mt-0.5 w-[76px] sm:w-[104px]" : "mt-1 w-[100px] sm:mt-1.5 sm:w-[165px] xl:w-[200px]"
                }`}
              />
              {/* The line under the logo (SITE.headerLabel, for example "Unstitched") stays visible on every screen */}
              <span
                className={`site-branch font-logo uppercase leading-none text-stone-700 transition-all duration-300 ${
                  scrolled
                    ? "mt-1 text-[11px] tracking-[0.28em] sm:text-sm"
                    : "mt-1.5 text-sm tracking-[0.28em] sm:mt-2 sm:text-xl xl:text-2xl"
                }`}
              >
                {SITE.headerLabel || SITE.branch}
              </span>
            </Link>

            {/* Right: log in, cart */}
            <div className="flex min-w-[68px] items-center justify-end gap-0.5 sm:min-w-0">
              <Link href="/account" aria-label="Log in" title="Log in" className="site-btn hidden rounded-full p-1.5 hover:bg-stone-100 sm:inline-flex">
                <UserIcon />
              </Link>
              <button
                type="button"
                className="site-btn relative rounded-full p-1 hover:bg-stone-100 sm:p-1.5"
                aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
                onClick={openDrawer}
              >
                <BagIcon />
                {count > 0 && (
                  <span
                    key={count}
                    className="num cart-badge absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] leading-none text-[var(--brand-contrast)]"
                  >
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Menu links under the logo (wide screens). A drop-down opens only when its small arrow is clicked. */}
          <nav className="hidden justify-center gap-10 pb-3 pt-1 text-[14px] uppercase tracking-[0.16em] xl:flex">
            {desktopMenu.map((m) => {
              if (!m.children?.length) {
                return (
                  <Link key={m.id || m.href} href={m.href} className="slide-underline font-logo pb-1">
                    {m.label}
                  </Link>
                );
              }
              const isOpen = openNav === m.href;
              return (
                <div key={m.id || m.href} data-nav-item className="relative">
                  <div className="flex items-center gap-1">
                    <Link href={m.href} className="slide-underline font-logo pb-1">
                      {m.label}
                    </Link>
                    <button
                      type="button"
                      aria-label={`${isOpen ? "Hide" : "Show"} ${m.label} collections`}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      className="site-btn -mb-0.5 flex h-6 w-6 items-center justify-center rounded-full hover:bg-stone-100"
                      onClick={() => setOpenNav(isOpen ? null : m.href)}
                    >
                      <ChevronIcon className={`h-3 w-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  <div
                    inert={!isOpen}
                    className={`absolute left-1/2 top-full z-40 mt-3 min-w-60 -translate-x-1/2 border border-stone-200 bg-white py-2 text-[#111] shadow-lg transition-[opacity,transform,visibility] duration-300 ease-out ${
                      isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
                    }`}
                  >
                    {m.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setOpenNav(null)}
                        className="block whitespace-nowrap px-5 py-2 text-[12px] tracking-[0.12em] transition-colors hover:bg-stone-50"
                      >
                        <span className="slide-underline pb-0.5">{c.label}</span>
                      </Link>
                    ))}
                    <Link
                      href={m.href}
                      onClick={() => setOpenNav(null)}
                      className="mt-1 block border-t border-stone-200 px-5 py-2 text-[12px] font-bold tracking-[0.2em] transition-colors hover:bg-stone-50"
                    >
                      <span className="slide-underline pb-0.5">View all</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Search row: slides open under the header */}
        <div
          inert={!searchOpen}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            searchOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <form action="/search" role="search" className="mx-auto flex max-w-2xl gap-2 px-4 pb-3 pt-1">
              <div className="relative w-full">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                <input
                  ref={searchInput}
                  type="search"
                  name="q"
                  placeholder="Search suits"
                  aria-label="Search suits"
                  className="h-10 w-full rounded-full border border-stone-300 bg-stone-50 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-stone-400 focus:border-[#111] focus:bg-white"
                />
              </div>
              <button className="press rounded-full bg-[var(--brand)] px-5 text-sm text-[var(--brand-contrast)] transition-opacity hover:opacity-85">
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Phone menu: slides open under the header */}
        <div
          inert={!menuOpen}
          className={`grid transition-[grid-template-rows] duration-300 ease-out xl:hidden ${
            menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <nav className="max-h-[75svh] overflow-y-auto border-t border-stone-200 bg-white px-4 py-2 text-[#111]">
              {phoneMenu.map((m) => {
                const kids = m.children || [];
                if (kids.length === 0) {
                  return (
                    <Link key={m.id || m.href} href={m.href} onClick={() => setMenuOpen(false)} className="font-logo block py-2.5 text-[13px] uppercase tracking-[0.12em]">
                      {m.label}
                    </Link>
                  );
                }
                const open = openGroup === m.href;
                return (
                  <div key={m.id || m.href}>
                    <div className="flex items-center justify-between">
                      <Link href={m.href} onClick={() => setMenuOpen(false)} className="font-logo flex-1 py-2.5 text-[13px] uppercase tracking-[0.12em]">
                        {m.label}
                      </Link>
                      <button
                        type="button"
                        aria-label={`${open ? "Hide" : "Show"} ${m.label} collections`}
                        aria-expanded={open}
                        className="p-2"
                        onClick={() => setOpenGroup(open ? null : m.href)}
                      >
                        <ChevronIcon className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <div
                      inert={!open}
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
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
                      </div>
                    </div>
                  </div>
                );
              })}
              <Link href="/account" onClick={() => setMenuOpen(false)} className="block py-2 text-sm">
                Log in
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
