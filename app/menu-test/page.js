"use client";

// TEMPORARY page to look at the Menu tab and the two menus. Removed before this is finished.
import { useState } from "react";
import Header from "@/components/Header";
import MenuEditor from "@/components/admin/MenuEditor";
import { buildMenu } from "@/lib/catalogue";
import { applyMenuLayout, collectionItem, menuBase, normalizeMenuLayout } from "@/lib/menu";

const COLS = [
  { slug: "summer", name: "Summer", parent_slug: null, in_menu: true, is_visible: true },
  { slug: "premium-lawn", name: "Premium Lawn", parent_slug: "summer", in_menu: false, is_visible: true },
  { slug: "winter", name: "Winter", parent_slug: null, in_menu: true, is_visible: true },
  { slug: "tropical", name: "Tropical weather", parent_slug: null, in_menu: true, is_visible: true },
  { slug: "best", name: "Best of Rizwan Clothing", parent_slug: null, in_menu: true, is_visible: true },
  { slug: "the-ethnic", name: "Dilkash", parent_slug: null, in_menu: false, is_visible: true },
];
const RAW = {
  version: 2,
  laptop: [{ id: "home" }, { id: "c:summer" }, { id: "c:tropical" }, { id: "c:winter" }],
  phone: [
    { id: "home" },
    { id: "l:sale1", label: "Sale", href: "/collections?avail=sale" },
    { id: "c:winter" },
    { id: "l:bad", label: "Bad", href: "javascript:alert(1)" },
    { id: "c:summer" },
  ],
};

export default function Page() {
  const layout = normalizeMenuLayout(RAW);
  const menu = buildMenu(COLS, layout);
  const [lists, setLists] = useState(() => applyMenuLayout(menuBase(COLS), layout));
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const choices = COLS.filter((c) => !c.parent_slug).map((c) => collectionItem(c, COLS));
  return (
    <div>
      <Header menu={menu} />
      <div className="mx-auto max-w-5xl p-4">
        <pre id="menu-json" className="mb-6 overflow-auto bg-stone-100 p-2 text-xs">
          {JSON.stringify({ laptop: menu.laptop.map((m) => m.label), phone: menu.phone.map((m) => m.label), old: normalizeMenuLayout({ items: [{ id: "home" }, { id: "c:summer", phone: false }, { id: "c:winter", laptop: false }] }) })}
        </pre>
        <MenuEditor
          lists={lists}
          choices={choices}
          onChange={(k, items) => {
            setLists((l) => ({ ...l, [k]: items }));
            setDirty(true);
            setMessage("");
          }}
          onCopy={(to) => {
            const from = to === "laptop" ? "phone" : "laptop";
            setLists((l) => ({ ...l, [to]: l[from].map((i) => ({ ...i })) }));
            setDirty(true);
          }}
          onReset={() => setLists(applyMenuLayout(menuBase(COLS), null))}
          onSave={() => setMessage("Saved. (test)")}
          saving={false}
          dirty={dirty}
          message={message}
          setMessage={setMessage}
        />
      </div>
    </div>
  );
}
