"use client";

import { useState } from "react";
import { cleanLink } from "@/lib/announcements";
import { LINK_PRESETS, MAX_LINKS, newLinkId } from "@/lib/menu";

// Rows of the menu, in order. A row is "home", a main collection, or a link added here (Sale and so on).
// laptop / phone = whether it shows in the bar under the logo, and in the 3-lines menu.
export function buildRows(cols, layout) {
  const main = cols.filter((c) => !c.parent_slug && c.is_visible);
  const inside = (slug) => cols.filter((x) => x.parent_slug === slug).length;
  const base = [
    { id: "home", kind: "home", label: "Home", href: "/", laptop: true, phone: true },
    ...main.map((c) => ({
      id: "c:" + c.slug,
      kind: "collection",
      slug: c.slug,
      label: c.name,
      href: `/collections/${c.slug}`,
      inside: inside(c.slug),
      wasInMenu: !!c.in_menu,
      laptop: !!c.in_menu,
      phone: !!c.in_menu,
    })),
  ];
  if (!layout) return base;
  const byId = new Map(base.map((r) => [r.id, r]));
  const rows = [];
  for (const it of layout) {
    if (it.id.startsWith("l:")) {
      rows.push({ id: it.id, kind: "link", label: it.label, href: it.href, laptop: it.laptop, phone: it.phone });
      continue;
    }
    const b = byId.get(it.id);
    if (!b) continue;
    byId.delete(it.id);
    // A collection that is not "In menu" stays off, whatever the saved ticks say
    rows.push({ ...b, laptop: b.laptop && it.laptop, phone: b.phone && it.phone });
  }
  const home = byId.get("home");
  byId.delete("home");
  return [...(home ? [home] : []), ...rows, ...byId.values()];
}

// The Menu tab's screen: the list of menu items with their Laptop / Phone ticks, the "add a link" box and the two previews.
// The data (loading and saving) lives in MenuAdmin, so this part can also be looked at on its own.
export default function MenuEditor({ rows, onChange, onSave, onReset, saving, dirty, message, setMessage }) {
  const [custom, setCustom] = useState({ label: "", href: "" });

  const patch = (id, values) => onChange(rows.map((r) => (r.id === id ? { ...r, ...values } : r)));

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  const links = rows.filter((r) => r.kind === "link");

  function addLink(label, href) {
    const cleanHref = cleanLink(href);
    if (!label.trim()) return setMessage("Type a name for the menu item, for example Sale.");
    if (!cleanHref) return setMessage("The link must be a shop page like /collections?avail=sale, or a web address like https://…");
    if (links.length >= MAX_LINKS) return setMessage(`You can add at most ${MAX_LINKS} extra links.`);
    onChange([...rows, { id: newLinkId(), kind: "link", label: label.trim().slice(0, 30), href: cleanHref, laptop: true, phone: true }]);
    setCustom({ label: "", href: "" });
  }

  const laptopItems = rows.filter((r) => r.laptop);
  const phoneItems = rows.filter((r) => r.phone);
  const tick = "flex cursor-pointer select-none items-center gap-1.5 rounded border px-2.5 py-1.5 text-sm ";

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold">Menu</h2>
      <p className="mt-1 text-sm text-stone-600">
        Choose what shows in the <b>laptop menu</b> (the bar under the logo on wide screens) and in the <b>phone menu</b> (the 3 lines button on
        phones, tablets and smaller windows). Tick one or both for each item, use ▲▼ to change the order, then press Save.
      </p>

      <ul className="mt-4 divide-y divide-stone-200 rounded-lg border border-stone-200">
        {rows.map((r, i) => {
          const off = !r.laptop && !r.phone;
          return (
            <li key={r.id} className={"flex flex-wrap items-center gap-3 p-3 text-sm " + (off ? "bg-stone-50" : "")}>
              <div className="flex flex-col">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="disabled:opacity-30">▲</button>
                <button type="button" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="disabled:opacity-30">▼</button>
              </div>
              <div className="min-w-40 flex-1">
                {r.kind === "link" ? (
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={r.label}
                      maxLength={30}
                      onChange={(e) => patch(r.id, { label: e.target.value })}
                      className="w-36 rounded border border-stone-300 px-2 py-1.5"
                      aria-label="Menu item name"
                    />
                    <input
                      value={r.href}
                      onChange={(e) => patch(r.id, { href: e.target.value })}
                      className="min-w-40 flex-1 rounded border border-stone-300 px-2 py-1.5"
                      aria-label="Menu item link"
                    />
                  </div>
                ) : (
                  <p className={"font-medium " + (off ? "text-stone-500" : "")}>{r.label}</p>
                )}
                <p className="mt-0.5 text-xs text-stone-500">
                  {r.kind === "home" && "Home page"}
                  {r.kind === "collection" &&
                    (r.inside > 0 ? `Collection, with a dropdown of ${r.inside} inside it` : "Collection") + (off ? " · not in the menu" : "")}
                  {r.kind === "link" && "Extra link"}
                </p>
              </div>
              <label className={tick + (r.laptop ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]" : "border-stone-300 bg-white")}>
                <input type="checkbox" checked={r.laptop} onChange={(e) => patch(r.id, { laptop: e.target.checked })} className="h-4 w-4" />
                Laptop
              </label>
              <label className={tick + (r.phone ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]" : "border-stone-300 bg-white")}>
                <input type="checkbox" checked={r.phone} onChange={(e) => patch(r.id, { phone: e.target.checked })} className="h-4 w-4" />
                Phone
              </label>
              {r.kind === "link" ? (
                <button type="button" onClick={() => onChange(rows.filter((x) => x.id !== r.id))} className="text-xs text-red-600 underline">
                  Remove
                </button>
              ) : (
                <span className="w-[52px]" />
              )}
            </li>
          );
        })}
      </ul>

      <section className="mt-5 rounded-lg bg-stone-50 p-3 text-sm">
        <p className="font-medium">Add a link to the menu</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LINK_PRESETS.map((p) => {
            const used = links.some((l) => l.href === p.href);
            return (
              <button
                key={p.href}
                type="button"
                disabled={used}
                onClick={() => addLink(p.label, p.href)}
                className="rounded border border-stone-300 bg-white px-3 py-1.5 disabled:opacity-40"
              >
                {used ? "✓ " : "+ "}
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            placeholder="Name, e.g. Eid Special"
            value={custom.label}
            maxLength={30}
            onChange={(e) => setCustom({ ...custom, label: e.target.value })}
            className="w-44 rounded border border-stone-300 px-2 py-1.5"
          />
          <input
            placeholder="Link, e.g. /collections/summer or https://…"
            value={custom.href}
            onChange={(e) => setCustom({ ...custom, href: e.target.value })}
            className="min-w-52 flex-1 rounded border border-stone-300 px-2 py-1.5"
          />
          <button type="button" onClick={() => addLink(custom.label, custom.href)} className="rounded border border-stone-300 bg-white px-3 py-1.5">
            + Add
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-600">
          New links show on both menus; untick Laptop or Phone above if you want one only. To put a collection in the menu, tick it in its row.
          New collections are added at the end.
        </p>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Laptop menu will show</p>
          <div className="min-h-12 rounded border border-stone-200 p-3 text-xs uppercase tracking-[0.12em]">
            {laptopItems.length ? laptopItems.map((r) => r.label).join("   ·   ") : <span className="normal-case text-stone-400">Nothing</span>}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Phone menu (3 lines) will show</p>
          <ul className="min-h-12 rounded border border-stone-200 p-3 text-xs uppercase tracking-[0.12em]">
            {phoneItems.length ? phoneItems.map((r) => <li key={r.id} className="py-1">{r.label}</li>) : <li className="normal-case text-stone-400">Nothing</li>}
          </ul>
        </div>
      </section>

      {message && <p className={"mt-4 text-sm " + (message.startsWith("Saved") ? "text-green-700" : "text-red-600")}>{message}</p>}
      {dirty && !message && <p className="mt-4 text-sm text-amber-700">You have changes that are not saved yet.</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button onClick={onSave} disabled={saving || !dirty} className="rounded bg-[var(--brand)] px-6 py-2 text-[var(--brand-contrast)] disabled:opacity-60">
          {saving ? "Saving…" : "Save menu"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="text-xs underline"
        >
          Start over (Home and the collections ticked “In menu”, no extra links)
        </button>
      </div>
    </div>
  );
}
