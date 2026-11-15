"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/adminHelpers";

const KIND_LABEL = {
  trending: "Trending (best sellers, last 14 days)",
  new: "New Arrivals",
  sale: "Sale",
  collection: "A collection",
};

export default function SectionsAdmin() {
  const [sections, setSections] = useState([]);
  const [collections, setCollections] = useState([]);
  const [message, setMessage] = useState("");
  const [newSection, setNewSection] = useState({ title: "", kind: "collection", collection_slug: "" });
  const [newCollection, setNewCollection] = useState({ name: "", parent_slug: "" });

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([
      supabase.from("home_sections").select("*").order("sort_order"),
      supabase.from("collections").select("*").order("sort_order"),
    ]);
    if (s.error || c.error) setMessage("Could not load data.");
    setSections(s.data || []);
    setCollections(c.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function renumber(table, list, key = "id") {
    // Save the order as 1, 2, 3 … for every row that changed
    const updates = list
      .map((row, i) => ({ row, order: i + 1 }))
      .filter(({ row, order }) => row.sort_order !== order);
    for (const { row, order } of updates) {
      const { error } = await supabase.from(table).update({ sort_order: order }).eq(key, row[key]);
      if (error) return setMessage("Could not save the order.");
    }
    load();
  }

  function move(table, list, index, dir, key) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    renumber(table, copy, key);
  }

  async function patch(table, key, id, values) {
    const { error } = await supabase.from(table).update(values).eq(key, id);
    if (error) return setMessage("Could not save the change.");
    setMessage("");
    load();
  }

  async function addSection(e) {
    e.preventDefault();
    if (newSection.title.trim().length < 2) return setMessage("Please enter a section title.");
    if (newSection.kind === "collection" && !newSection.collection_slug) return setMessage("Please choose a collection.");
    const { error } = await supabase.from("home_sections").insert({
      title: newSection.title.trim(),
      kind: newSection.kind,
      collection_slug: newSection.kind === "collection" ? newSection.collection_slug : null,
      sort_order: sections.length + 1,
    });
    if (error) return setMessage("Could not add the section.");
    setNewSection({ title: "", kind: "collection", collection_slug: "" });
    setMessage("");
    load();
  }

  async function deleteSection(s) {
    if (!window.confirm(`Delete the section "${s.title}"? Use Hide to keep it for later.`)) return;
    const { error } = await supabase.from("home_sections").delete().eq("id", s.id);
    if (error) return setMessage("Could not delete the section.");
    load();
  }

  async function addCollection(e) {
    e.preventDefault();
    const slug = slugify(newCollection.name);
    if (!slug) return setMessage("Please enter a collection name.");
    const { error } = await supabase.from("collections").insert({
      slug,
      name: newCollection.name.trim(),
      parent_slug: newCollection.parent_slug || null,
      sort_order: collections.length + 1,
    });
    if (error) return setMessage(error.code === "23505" ? "A collection with this name already exists." : "Could not add the collection.");
    setNewCollection({ name: "", parent_slug: "" });
    setMessage("");
    load();
  }

  const input = "rounded border border-stone-300 px-2 py-1.5 text-sm";

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {message && <p className="text-sm text-red-600 md:col-span-2">{message}</p>}

      <section>
        <h2 className="mb-3 text-lg font-bold">Home page sections</h2>
        <div className="divide-y divide-stone-200 rounded-lg border border-stone-200">
          {sections.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => move("home_sections", sections, i, -1, "id")} className="disabled:opacity-30">▲</button>
                <button disabled={i === sections.length - 1} onClick={() => move("home_sections", sections, i, 1, "id")} className="disabled:opacity-30">▼</button>
              </div>
              <div className="min-w-32 flex-1">
                <input
                  defaultValue={s.title}
                  onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== s.title && patch("home_sections", "id", s.id, { title: e.target.value.trim() })}
                  className={input + " w-full"}
                />
                <p className="mt-1 text-xs text-stone-500">
                  {KIND_LABEL[s.kind]}{s.collection_slug ? `: ${s.collection_slug}` : ""}
                </p>
              </div>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={s.is_visible} onChange={(e) => patch("home_sections", "id", s.id, { is_visible: e.target.checked })} /> Show
              </label>
              <button onClick={() => deleteSection(s)} className="text-red-600 underline">Delete</button>
            </div>
          ))}
        </div>

        <form onSubmit={addSection} className="mt-4 space-y-2 rounded-lg bg-stone-50 p-3 text-sm">
          <p className="font-medium">Add a section (for example “Eid Special”)</p>
          <input placeholder="Title" value={newSection.title} onChange={(e) => setNewSection({ ...newSection, title: e.target.value })} className={input + " w-full"} />
          <select value={newSection.kind} onChange={(e) => setNewSection({ ...newSection, kind: e.target.value })} className={input + " w-full"}>
            {Object.entries(KIND_LABEL).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          {newSection.kind === "collection" && (
            <select value={newSection.collection_slug} onChange={(e) => setNewSection({ ...newSection, collection_slug: e.target.value })} className={input + " w-full"}>
              <option value="">Choose collection</option>
              {collections.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          )}
          <button className="rounded bg-[var(--brand)] px-4 py-1.5 text-[var(--brand-contrast)]">Add section</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Collections</h2>
        <div className="divide-y divide-stone-200 rounded-lg border border-stone-200">
          {collections.map((c, i) => (
            <div key={c.slug} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => move("collections", collections, i, -1, "slug")} className="disabled:opacity-30">▲</button>
                <button disabled={i === collections.length - 1} onClick={() => move("collections", collections, i, 1, "slug")} className="disabled:opacity-30">▼</button>
              </div>
              <div className="min-w-32 flex-1">
                <input
                  defaultValue={c.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== c.name && patch("collections", "slug", c.slug, { name: e.target.value.trim() })}
                  className={input + " w-full"}
                />
                <p className="mt-1 text-xs text-stone-500">{c.parent_slug ? `Inside: ${c.parent_slug}` : "Main collection"}</p>
              </div>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={c.is_visible} onChange={(e) => patch("collections", "slug", c.slug, { is_visible: e.target.checked })} /> Show
              </label>
            </div>
          ))}
        </div>

        <form onSubmit={addCollection} className="mt-4 space-y-2 rounded-lg bg-stone-50 p-3 text-sm">
          <p className="font-medium">Add a collection</p>
          <input placeholder="Name" value={newCollection.name} onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })} className={input + " w-full"} />
          <select value={newCollection.parent_slug} onChange={(e) => setNewCollection({ ...newCollection, parent_slug: e.target.value })} className={input + " w-full"}>
            <option value="">Main collection</option>
            {collections.filter((c) => !c.parent_slug).map((c) => (
              <option key={c.slug} value={c.slug}>Inside {c.name}</option>
            ))}
          </select>
          <button className="rounded bg-[var(--brand)] px-4 py-1.5 text-[var(--brand-contrast)]">Add collection</button>
        </form>
      </section>
    </div>
  );
}
