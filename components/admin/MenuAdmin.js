"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cleanLink } from "@/lib/announcements";
import { normalizeMenuLayout } from "@/lib/menu";
import MenuEditor, { buildRows } from "@/components/admin/MenuEditor";

const KEY = "menu_layout";

// Admin "Menu" tab: choose what shows in the top menu (laptop) and in the 3-lines menu (phone), and in what order.
// Saved in site_settings (key menu_layout); a collection shown on at least one menu is marked "In menu".
export default function MenuAdmin() {
  const [cols, setCols] = useState([]);
  const [rows, setRows] = useState([]);
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
      setCols(c || []);
      setRows(buildRows(c || [], normalizeMenuLayout(row?.value)));
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

  const change = (next) => {
    setRows(next);
    setDirty(true);
    setMessage("");
  };

  async function onSave() {
    setMessage("");
    const links = rows.filter((r) => r.kind === "link");
    for (const r of links) {
      if (!r.label.trim()) return setMessage("Every extra link needs a name.");
      if (!cleanLink(r.href)) return setMessage(`The link for “${r.label}” is not valid.`);
    }
    setSaving(true);
    // A collection is "In menu" when it shows on at least one of the two menus
    for (const r of rows.filter((x) => x.kind === "collection")) {
      const want = r.laptop || r.phone;
      if (want !== r.wasInMenu) {
        const { error } = await supabase.from("collections").update({ in_menu: want }).eq("slug", r.slug);
        if (error) {
          setSaving(false);
          return setMessage("Could not save the menu.");
        }
      }
    }
    const items = rows.map((r) =>
      r.kind === "link"
        ? { id: r.id, label: r.label.trim(), href: cleanLink(r.href), laptop: r.laptop, phone: r.phone }
        : { id: r.id, laptop: r.laptop, phone: r.phone }
    );
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: KEY, value: { version: 1, items }, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(false);
    if (error) return setMessage("Could not save the menu.");
    setRows(rows.map((r) => (r.kind === "collection" ? { ...r, wasInMenu: r.laptop || r.phone } : r)));
    setCols(
      cols.map((c) => {
        const r = rows.find((x) => x.id === "c:" + c.slug);
        return r ? { ...c, in_menu: r.laptop || r.phone } : c;
      })
    );
    setDirty(false);
    setMessage("Saved. The website menu updates within about a minute.");
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>;

  return (
    <MenuEditor
      rows={rows}
      onChange={change}
      onSave={onSave}
      onReset={() => change(buildRows(cols, null))}
      saving={saving}
      dirty={dirty}
      message={message}
      setMessage={setMessage}
    />
  );
}
