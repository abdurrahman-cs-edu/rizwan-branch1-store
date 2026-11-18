"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cleanLink } from "@/lib/announcements";
import { applyMenuLayout, collectionItem, menuBase, normalizeMenuLayout } from "@/lib/menu";
import MenuEditor from "@/components/admin/MenuEditor";

const KEY = "menu_layout";

// Admin "Menu" tab: the PC navbar and the Mobile menu (3 lines) are two separate lists.
// Saved in site_settings (key menu_layout); a collection that is in at least one list is marked "In menu".
export default function MenuAdmin() {
  const [cols, setCols] = useState([]); // visible collections
  const [lists, setLists] = useState({ laptop: [], phone: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: row }] = await Promise.all([
        supabase.from("collections").select("slug,name,parent_slug,in_menu,is_visible,sort_order").order("sort_order"),
        supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle(),
      ]);
      const visible = (c || []).filter((x) => x.is_visible);
      setCols(visible);
      setLists(applyMenuLayout(menuBase(visible), normalizeMenuLayout(row?.value)));
      setLoading(false);
    })();
  }, []);

  // Warn before leaving the page with changes that are not saved
  useEffect(() => {
    if (!dirty) return;
    const stop = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", stop);
    return () => window.removeEventListener("beforeunload", stop);
  }, [dirty]);

  const touch = () => {
    setDirty(true);
    setMessage("");
  };
  const onChange = (key, items) => {
    setLists((l) => ({ ...l, [key]: items }));
    touch();
  };
  function onCopy(toKey) {
    const from = toKey === "laptop" ? "phone" : "laptop";
    const names = { laptop: "PC navbar", phone: "Mobile menu" };
    if (lists[toKey].length && !window.confirm(`Replace the ${names[toKey]} with a copy of the ${names[from]}?`)) return;
    setLists((l) => ({ ...l, [toKey]: l[from].map((i) => ({ ...i })) }));
    touch();
  }
  function onReset() {
    setLists(applyMenuLayout(menuBase(cols), null));
    touch();
  }

  async function onSave() {
    setMessage("");
    for (const r of [...lists.laptop, ...lists.phone].filter((i) => i.id.startsWith("l:"))) {
      if (!r.label.trim()) return setMessage("Every extra link needs a name.");
      if (!cleanLink(r.href)) return setMessage(`The link for “${r.label}” is not valid.`);
    }
    setSaving(true);
    // A collection is "In menu" when it is in at least one of the two lists
    const used = new Set([...lists.laptop, ...lists.phone].map((i) => i.id));
    const changed = [];
    for (const c of cols.filter((x) => !x.parent_slug)) {
      const want = used.has("c:" + c.slug);
      if (want !== !!c.in_menu) {
        const { error } = await supabase.from("collections").update({ in_menu: want }).eq("slug", c.slug);
        if (error) {
          setSaving(false);
          return setMessage("Could not save the menu.");
        }
        changed.push(c.slug);
      }
    }
    const save = (i) => (i.id.startsWith("l:") ? { id: i.id, label: i.label.trim(), href: cleanLink(i.href) } : { id: i.id });
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: KEY, value: { version: 2, laptop: lists.laptop.map(save), phone: lists.phone.map(save) }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    setSaving(false);
    if (error) return setMessage("Could not save the menu.");
    setCols(cols.map((c) => (changed.includes(c.slug) ? { ...c, in_menu: used.has("c:" + c.slug) } : c)));
    setDirty(false);
    setMessage("Saved. The website menus update within about a minute.");
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>;

  // Every main collection can be added to either menu (adding one marks it "In menu" when saved)
  const choices = cols.filter((c) => !c.parent_slug).map((c) => collectionItem(c, cols));

  return (
    <MenuEditor
      lists={lists}
      choices={choices}
      onChange={onChange}
      onCopy={onCopy}
      onReset={onReset}
      onSave={onSave}
      saving={saving}
      dirty={dirty}
      message={message}
      setMessage={setMessage}
    />
  );
}
