// The top menu: which items show, in what order, and on which screens.
// The admin panel ("Menu" tab) saves this in site_settings, key "menu_layout":
//   { version: 1, items: [ { id, laptop, phone }, ... ] }
// Item ids: "home", "c:<collection slug>" (a main collection) or "l:<code>" (a link the admin added; it also has label + href).
// "laptop" = the bar under the logo on wide screens, "phone" = the 3-lines menu.

import { cleanLink } from "@/lib/announcements";

export const MAX_ITEMS = 30;
export const MAX_LINKS = 8;

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

// The saved value -> a clean list. Returns null when the admin never saved a menu.
export function normalizeMenuLayout(value) {
  if (!value || !Array.isArray(value.items)) return null;
  const seen = new Set();
  const out = [];
  for (const raw of value.items) {
    const id = typeof raw?.id === "string" ? raw.id : "";
    if (!ID.test(id) || seen.has(id)) continue;
    const item = { id, laptop: raw.laptop !== false, phone: raw.phone !== false };
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

// base = [{ id, label, href, children }] (Home and the collections ticked "In menu").
// With no saved layout everything shows on both. With a layout: its order and its laptop / phone ticks win;
// links the admin added come in; a new collection that is not in the layout yet goes to the end, on both.
export function applyMenuLayout(base, layout) {
  const all = base.map((m) => ({ ...m, laptop: true, phone: true }));
  if (!layout) return all;
  const byId = new Map(all.map((m) => [m.id, m]));
  const out = [];
  for (const it of layout) {
    if (it.id.startsWith("l:")) {
      out.push({ id: it.id, label: it.label, href: it.href, children: [], laptop: it.laptop, phone: it.phone });
      continue;
    }
    const b = byId.get(it.id);
    if (!b) continue; // a collection that was deleted, hidden or taken out of the menu
    byId.delete(it.id);
    out.push({ ...b, laptop: it.laptop, phone: it.phone });
  }
  const home = byId.get("home");
  byId.delete("home");
  return [...(home ? [home] : []), ...out, ...byId.values()];
}
