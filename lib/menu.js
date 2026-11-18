// The top menu: two separate lists, one for the PC navbar (the bar under the logo on wide screens)
// and one for the Mobile menu (the 3-lines button). Each list has its own items, its own order and its own links.
// The admin panel ("Menu" tab) saves them in site_settings, key "menu_layout":
//   { version: 2, laptop: [ { id }, { id, label, href }, ... ], phone: [ ... ] }
// Item ids: "home", "c:<collection slug>" (a main collection) or "l:<code>" (a link the admin added; it also has label + href).
// The first version saved one list with laptop / phone ticks ({ version: 1, items: [...] }); it is still understood.

import { cleanLink } from "@/lib/announcements";

export const MAX_ITEMS = 30; // per list
export const MAX_LINKS = 8; // extra links per list

// Ready-made links the admin can add with one click
export const LINK_PRESETS = [
  { label: "Sale", href: "/collections?avail=sale" },
  { label: "New Arrivals", href: "/collections?sort=newest" },
  { label: "All Collections", href: "/collections" },
  { label: "Branch Info", href: "/branch" },
  { label: "Contact Us", href: "/policies/contact" },
];

const ID = /^(home|c:[a-z0-9-]{1,80}|l:[A-Za-z0-9_-]{1,24})$/;

export function newLinkId() {
  return "l:" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export const HOME_ITEM = { id: "home", label: "Home", href: "/", children: [] };

// A main collection as a menu item (with the collections inside it as a dropdown)
export function collectionItem(c, all) {
  return {
    id: "c:" + c.slug,
    label: c.name,
    href: `/collections/${c.slug}`,
    children: all.filter((x) => x.parent_slug === c.slug).map((x) => ({ label: x.name, href: `/collections/${x.slug}` })),
  };
}

// Home and every main collection ticked "In menu": what both menus show until the admin saves the Menu tab.
export function menuBase(collections) {
  return [HOME_ITEM, ...collections.filter((c) => !c.parent_slug && c.in_menu).map((c) => collectionItem(c, collections))];
}

function cleanList(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const id = typeof raw?.id === "string" ? raw.id : "";
    if (!ID.test(id) || seen.has(id)) continue;
    const item = { id };
    if (id.startsWith("l:")) {
      const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 30) : "";
      const href = cleanLink(raw.href);
      if (!label || !href) continue;
      item.label = label;
      item.href = href;
    }
    seen.add(id);
    out.push(item);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

// The saved value -> { laptop: [...], phone: [...] }. Returns null when the admin never saved a menu.
export function normalizeMenuLayout(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value.laptop) && Array.isArray(value.phone)) {
    return { laptop: cleanList(value.laptop), phone: cleanList(value.phone) };
  }
  if (Array.isArray(value.items)) {
    // first version: one list, each item ticked for laptop and / or phone
    return {
      laptop: cleanList(value.items.filter((x) => x?.laptop !== false)),
      phone: cleanList(value.items.filter((x) => x?.phone !== false)),
    };
  }
  return null;
}

// base = menuBase(...). Returns { laptop: [item], phone: [item] }, items = { id, label, href, children }.
// With no saved layout both menus show the base. With a layout each menu follows its own list; a collection that is
// not in the base any more (deleted, hidden or taken out of the menu) is skipped, and a new collection that is in
// neither list yet goes to the end of both. Home is never added by itself once a layout is saved.
export function applyMenuLayout(base, layout) {
  if (!layout) return { laptop: base, phone: base };
  const byId = new Map(base.map((m) => [m.id, m]));
  const inEither = new Set([...layout.laptop, ...layout.phone].map((x) => x.id));
  const build = (list) =>
    list
      .map((it) => (it.id.startsWith("l:") ? { id: it.id, label: it.label, href: it.href, children: [] } : byId.get(it.id)))
      .filter(Boolean);
  const fresh = base.filter((m) => m.id.startsWith("c:") && !inEither.has(m.id));
  return { laptop: [...build(layout.laptop), ...fresh], phone: [...build(layout.phone), ...fresh] };
}
