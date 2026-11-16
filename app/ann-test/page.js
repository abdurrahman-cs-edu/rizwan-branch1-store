"use client";

// TEMPORARY page to look at every announcement style. Removed before the pull request is finished.
import { useState } from "react";
import AlertBar from "@/components/AlertBar";
import AnnouncementBar from "@/components/AnnouncementBar";
import AlertEditor from "@/components/admin/AlertEditor";
import { COLOR_PRESETS, STYLES, normalizeAlert } from "@/lib/announcements";

const MSGS = [
  { text: "Extra 5% discount on all prepaid orders", link: "/collections" },
  { text: "Nationwide delivery!", link: "" },
  { text: "New Eid collection is live", link: "/collections?sort=newest" },
];

export default function Page() {
  const [end] = useState(() => new Date(Date.now() + 2 * 86400000 + 4 * 3600000).toISOString());
  const [draft, setDraft] = useState(() => normalizeAlert({ id: "t1", messages: MSGS, style: "ticker", color: "red" }, { keepEmpty: true }));
  const [closed, setClosed] = useState(false);
  return (
    <div className="mx-auto max-w-5xl space-y-3 p-4">
      <h1 className="text-lg font-bold">Announcement styles (test)</h1>
      <p className="text-xs text-stone-500">Real AnnouncementBar: one closable bar should show; the future one and the expired one must not.</p>
      <div data-real>
        <AnnouncementBar
          serverNow={Date.now()}
          alerts={[
            normalizeAlert({ id: "now1", messages: [{ text: "Closable bar" }], closable: true, style: "still", color: "green" }),
            normalizeAlert({ id: "fut1", messages: [{ text: "FUTURE bar" }], start: new Date(Date.now() + 3600e3).toISOString() }),
            normalizeAlert({ id: "old1", messages: [{ text: "EXPIRED bar" }], end: new Date(Date.now() - 3600e3).toISOString() }),
          ]}
        />
      </div>
      {STYLES.map((s, i) => (
        <div key={s.key} data-style={s.key}>
          <p className="text-xs text-stone-500">{s.label}</p>
          <AlertBar
            preview
            alert={normalizeAlert({
              id: "s" + i,
              messages: MSGS,
              style: s.key,
              color: COLOR_PRESETS[(i + 1) % COLOR_PRESETS.length].key,
              speed: "normal",
              countdownOn: s.key === "ticker" || s.key === "still",
              countdownEnd: end,
            })}
          />
        </div>
      ))}
      <p className="text-xs text-stone-500">Live mode (links work, close button, white, bold, large, uppercase)</p>
      {!closed && (
        <AlertBar
          onClose={() => setClosed(true)}
          alert={normalizeAlert({ id: "live", messages: MSGS.slice(0, 2), style: "fade", color: "white", closable: true, bold: true, upper: true, size: "large" })}
        />
      )}
      <p className="text-xs text-stone-500">Editor</p>
      <div className="rounded-lg border border-stone-200 p-3">
        <AlertEditor alert={draft} onChange={setDraft} pages={[{ label: "Sale", href: "/collections?avail=sale" }]} />
      </div>
    </div>
  );
}
