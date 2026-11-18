"use client";

import { useState } from "react";
import { cleanLink } from "@/lib/announcements";
import { HOME_ITEM, LINK_PRESETS, MAX_ITEMS, MAX_LINKS, newLinkId } from "@/lib/menu";

// The two menus of the website. Each one has its own list, so something can be on the phone only (or the PC only).
const PANELS = [
  { key: "laptop", title: "PC navbar", help: "The bar under the logo on laptops and wide screens." },
  { key: "phone", title: "Mobile menu", help: "The 3 lines button on phones, tablets and small windows." },
];

const kindOf = (id) => (id === "home" ? "home" : id.startsWith("c:") ? "collection" : "link");

// One menu: its items (order, remove, rename), what can still be added, and a preview.
function MenuList({ title, help, otherTitle, items, choices, onChange, onCopy, setMessage }) {
  const [custom, setCustom] = useState({ label: "", href: "" });

  const has = (id) => items.some((i) => i.id === id);
  const links = items.filter((i) => kindOf(i.id) === "link");

  function add(item) {
    if (items.length >= MAX_ITEMS) return setMessage(`The ${title} can have at most ${MAX_ITEMS} items.`);
    setMessage("");
    onChange([...items, item]);
  }
  function addLink(label, href) {
    const cleanHref = cleanLink(href);
    if (!label.trim()) return setMessage("Type a name for the menu item, for example Sale.");
    if (!cleanHref) return setMessage("The link must be a shop page like /collections?avail=sale, or a web address like https://…");
    if (links.length >= MAX_LINKS) return setMessage(`You can add at most ${MAX_LINKS} extra links to the ${title}.`);
    add({ id: newLinkId(), label: label.trim().slice(0, 30), href: cleanHref, children: [] });
    setCustom({ label: "", href: "" });
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  const patch = (id, values) => onChange(items.map((x) => (x.id === id ? { ...x, ...values } : x)));

  const quickAdd = [
    ...(has("home") ? [] : [{ key: "home", label: "Home", item: HOME_ITEM }]),
    ...choices.filter((c) => !has(c.id)).map((c) => ({ key: c.id, label: c.label, item: c })),
    ...LINK_PRESETS.filter((p) => !links.some((l) => l.href === p.href)).map((p) => ({
      key: "p:" + p.href,
      label: p.label,
      item: { id: newLinkId(), label: p.label, href: p.href, children: [] },
    })),
  ];

  return (
    <section className="rounded-lg border border-stone-200">
      <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
        <h3 className="text-base font-bold">{title}</h3>
        <p className="text-xs text-stone-600">{help}</p>
      </div>

      <ul className="divide-y divide-stone-200">
        {items.length === 0 && <li className="p-4 text-sm text-stone-500">Nothing here yet. Add something below.</li>}
        {items.map((it, i) => {
          const kind = kindOf(it.id);
          return (
            <li key={it.id} className="flex items-center gap-3 p-3 text-sm">
              <div className="flex flex-col">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="disabled:opacity-30">▲</button>
                <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="disabled:opacity-30">▼</button>
              </div>
              <div className="min-w-0 flex-1">
                {kind === "link" ? (
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={it.label}
                      maxLength={30}
                      onChange={(e) => patch(it.id, { label: e.target.value })}
                      className="w-32 rounded border border-stone-300 px-2 py-1.5"
                      aria-label="Menu item name"
                    />
                    <input
                      value={it.href}
                      onChange={(e) => patch(it.id, { href: e.target.value })}
                      className="min-w-32 flex-1 rounded border border-stone-300 px-2 py-1.5"
                      aria-label="Menu item link"
                    />
                  </div>
                ) : (
                  <p className="font-medium">{it.label}</p>
                )}
                <p className="mt-0.5 text-xs text-stone-500">
                  {kind === "home" && "Home page"}
                  {kind === "collection" && (it.children.length > 0 ? `Collection, with a dropdown of ${it.children.length} inside it` : "Collection")}
                  {kind === "link" && "Link"}
                </p>
              </div>
              <button type="button" onClick={() => onChange(items.filter((x) => x.id !== it.id))} className="shrink-0 text-xs text-red-600 underline">
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-stone-200 p-4 text-sm">
        <p className="font-medium">Add to the {title}</p>
        {quickAdd.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {quickAdd.map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => add(q.item)}
                className="rounded border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-50"
              >
                + {q.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-stone-500">Everything is already added.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            placeholder="Your own name, e.g. Eid Special"
            value={custom.label}
            maxLength={30}
            onChange={(e) => setCustom({ ...custom, label: e.target.value })}
            className="w-44 rounded border border-stone-300 px-2 py-1.5"
          />
          <input
            placeholder="Link, e.g. /collections/summer"
            value={custom.href}
            onChange={(e) => setCustom({ ...custom, href: e.target.value })}
            className="min-w-40 flex-1 rounded border border-stone-300 px-2 py-1.5"
          />
          <button type="button" onClick={() => addLink(custom.label, custom.href)} className="rounded border border-stone-300 bg-white px-3 py-1.5">
            + Add
          </button>
        </div>
        <button type="button" onClick={onCopy} className="mt-3 text-xs underline">
          Copy everything from the {otherTitle}
        </button>
      </div>

      <div className="border-t border-stone-200 bg-stone-50 p-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">How it will look</p>
        <p className="text-xs uppercase leading-6 tracking-[0.12em]">
          {items.length ? items.map((i) => i.label).join("   ·   ") : <span className="normal-case text-stone-400">Empty</span>}
        </p>
      </div>
    </section>
  );
}

// The Menu tab's screen: the two menus side by side, then Save. The data (loading and saving) lives in MenuAdmin.
export default function MenuEditor({ lists, choices, onChange, onCopy, onReset, onSave, saving, dirty, message, setMessage }) {
  return (
    <div className="max-w-5xl">
      <h2 className="text-lg font-bold">Menu</h2>
      <p className="mt-1 text-sm text-stone-600">
        The website has two menus and you set each one on its own. For example, put <b>Sale</b> only in the Mobile menu, or a collection only in
        the PC navbar. Use ▲▼ to change the order, then press <b>Save menu</b>.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {PANELS.map((p, i) => (
          <MenuList
            key={p.key}
            title={p.title}
            help={p.help}
            otherTitle={PANELS[1 - i].title}
            items={lists[p.key]}
            choices={choices}
            onChange={(items) => onChange(p.key, items)}
            onCopy={() => onCopy(p.key)}
            setMessage={setMessage}
          />
        ))}
      </div>

      {message && <p className={"mt-4 text-sm " + (message.startsWith("Saved") ? "text-green-700" : "text-red-600")}>{message}</p>}
      {dirty && !message && <p className="mt-4 text-sm text-amber-700">You have changes that are not saved yet.</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button onClick={onSave} disabled={saving || !dirty} className="rounded bg-[var(--brand)] px-6 py-2 text-[var(--brand-contrast)] disabled:opacity-60">
          {saving ? "Saving…" : "Save menu"}
        </button>
        <button type="button" onClick={onReset} className="text-xs underline">
          Start over (both menus: Home and the collections ticked “In menu”, no extra links)
        </button>
      </div>
    </div>
  );
}
