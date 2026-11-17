"use client";

// TEMPORARY page to look at the Menu tab and the menu filtering. Removed before the pull request is finished.
import { useState } from "react";
import Header from "@/components/Header";
import MenuEditor, { buildRows } from "@/components/admin/MenuEditor";
import { buildMenu } from "@/lib/catalogue";
import { normalizeMenuLayout } from "@/lib/menu";

const COLS = [
  { slug: "summer", name: "Summer", parent_slug: null, in_menu: true, is_visible: true },
  { slug: "premium-lawn", name: "Premium Lawn", parent_slug: "summer", in_menu: false, is_visible: true },
  { slug: "winter", name: "Winter", parent_slug: null, in_menu: true, is_visible: true },
  { slug: "tropical", name: "Tropical weather", parent_slug: null, in_menu: true, is_visible: true },
  { slug: "best-of-rizwan-clothing", name: "Best of Rizwan Clothing", parent_slug: null, in_menu: true, is_visible: true },
  { slug: "the-ethnic", name: "The Ethnic", parent_slug: null, in_menu: false, is_visible: true },
];
const LAYOUT = normalizeMenuLayout({
  items: [
    { id: "home", laptop: true, phone: true },
    { id: "c:summer", laptop: true, phone: true },
    { id: "c:winter", laptop: true, phone: true },
    { id: "l:sale1", label: "Sale", href: "/collections?avail=sale", laptop: false, phone: true },
    { id: "c:tropical", laptop: true, phone: false },
    { id: "l:bad", label: "Bad", href: "javascript:alert(1)", laptop: true, phone: true },
  ],
});

export default function Page() {
  const [rows, setRows] = useState(() => buildRows(COLS, LAYOUT));
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const menu = buildMenu(
    COLS.filter((c) => c.is_visible),
    LAYOUT
  );
  return (
    <div>
      <Header menu={menu} />
      <div className="mx-auto max-w-4xl p-4">
        <pre id="menu-json" className="mb-6 overflow-auto bg-stone-100 p-2 text-xs">
          {JSON.stringify(menu.map((m) => [m.label, m.laptop, m.phone, m.children.length]))}
        </pre>
        <MenuEditor
          rows={rows}
          onChange={(r) => {
            setRows(r);
            setDirty(true);
            setMessage("");
          }}
          onSave={() => setMessage("Saved. (test)")}
          onReset={() => setRows(buildRows(COLS, null))}
          saving={false}
          dirty={dirty}
          message={message}
          setMessage={setMessage}
        />
      </div>
    </div>
  );
}
