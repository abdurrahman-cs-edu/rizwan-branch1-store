"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AlertBar from "@/components/AlertBar";
import AlertEditor from "@/components/admin/AlertEditor";
import {
  MAX_ALERTS,
  STYLES,
  blankAlert,
  defaultAlerts,
  normalizeAlert,
  normalizeAnnouncements,
} from "@/lib/announcements";

const KEY = "announcements";

const FIXED_PAGES = [
  { label: "All collections", href: "/collections" },
  { label: "New arrivals", href: "/collections?sort=newest" },
  { label: "Sale", href: "/collections?avail=sale" },
  { label: "Branch info", href: "/branch" },
];

const when = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Is this bar showing on the website right now (once saved)?
function statusOf(a) {
  const now = Date.now();
  if (!a.enabled) return ["Hidden", "bg-stone-200 text-stone-700"];
  if (a.start && now < Date.parse(a.start)) return [`Starts ${when(a.start)}`, "bg-amber-100 text-amber-800"];
  if (a.end && now >= Date.parse(a.end)) return ["Ended", "bg-red-100 text-red-700"];
  return [a.end ? `Live until ${when(a.end)}` : "Live", "bg-green-100 text-green-800"];
}

// The strip(s) at the very top of the website: add a bar, choose how it moves (ticker, blinking, rotating ...),
// its colours, a countdown, and when it shows. Changes appear on the website within about a minute after saving.
export default function AnnouncementsAdmin() {
  const [alerts, setAlerts] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [pages, setPages] = useState(FIXED_PAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notSaved, setNotSaved] = useState(false); // showing the original messages, nothing saved yet
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: row }, { data: cols }] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle(),
        supabase.from("collections").select("slug,name,parent_slug").order("sort_order"),
      ]);
      const saved = normalizeAnnouncements(row?.value);
      setAlerts(saved ?? defaultAlerts());
      setNotSaved(saved === null);
      setPages([
        ...FIXED_PAGES,
        ...(cols || []).map((c) => ({ label: (c.parent_slug ? "— " : "") + c.name, href: `/collections/${c.slug}` })),
      ]);
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
    setAlerts(next);
    setDirty(true);
    setMessage("");
  };
  const update = (id, a) => change(alerts.map((x) => (x.id === id ? a : x)));

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= alerts.length) return;
    const next = [...alerts];
    [next[i], next[j]] = [next[j], next[i]];
    change(next);
  }

  function add() {
    if (alerts.length >= MAX_ALERTS) return setMessage(`You can have at most ${MAX_ALERTS} bars.`);
    const a = blankAlert();
    change([...alerts, a]);
    setOpenId(a.id);
  }

  function remove(id) {
    change(alerts.filter((x) => x.id !== id));
    setConfirmId(null);
    if (openId === id) setOpenId(null);
  }

  async function onSave() {
    setMessage("");
    for (let i = 0; i < alerts.length; i++) {
      const a = alerts[i];
      const n = `Bar ${i + 1}`;
      if (!a.messages.some((m) => m.text.trim())) {
        setOpenId(a.id);
        return setMessage(`${n} has no message. Type a message, or delete the bar.`);
      }
      if (a.countdownOn && !a.countdownEnd) {
        setOpenId(a.id);
        return setMessage(`${n}: choose the countdown date and time, or turn the countdown off.`);
      }
      if (a.start && a.end && Date.parse(a.end) <= Date.parse(a.start)) {
        setOpenId(a.id);
        return setMessage(`${n}: “Hide after” must be later than “Show from”.`);
      }
    }
    const clean = alerts.map((a) => normalizeAlert(a));
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: KEY, value: { version: 1, alerts: clean }, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(false);
    if (error) return setMessage("Could not save the announcements.");
    setAlerts(clean);
    setDirty(false);
    setNotSaved(false);
    setMessage(
      clean.length === 0
        ? "Saved. The website will show no bar at the top within about a minute."
        : "Saved. The website will show it within about a minute."
    );
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold">Announcements</h2>
      <p className="mt-1 text-sm text-stone-600">
        The strip at the very top of the website. Add news, offers or a notice, choose how it moves and what colour it is, then press Save.
        If you add more than one bar they sit one under the other, so one or two is best.
      </p>

      {notSaved && (
        <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
          This is the original bar the website shows now. Edit it or add new ones, then press Save.
        </p>
      )}

      {alerts.length === 0 && (
        <p className="mt-4 rounded border border-dashed border-stone-300 p-4 text-sm text-stone-600">
          No bars. The website shows nothing at the top. Press “Add a bar” to create one.
        </p>
      )}

      <ul className="mt-4 space-y-4">
        {alerts.map((a, i) => {
          const open = openId === a.id;
          const [status, statusCls] = statusOf(a);
          const styleLabel = STYLES.find((s) => s.key === a.style)?.label;
          return (
            <li key={a.id} className="rounded-lg border border-stone-200">
              {!open && (
                <div className="overflow-hidden rounded-t-lg">
                  <AlertBar alert={a} preview />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 p-3 text-sm">
                <span className="font-semibold">Bar {i + 1}</span>
                <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + statusCls}>{status}</span>
                <span className="text-xs text-stone-500">{styleLabel}</span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setOpenId(open ? null : a.id)} className="rounded border border-stone-300 px-3 py-1.5">
                    {open ? "Close editor" : "Edit"}
                  </button>
                  <button type="button" onClick={() => update(a.id, { ...a, enabled: !a.enabled })} className="rounded border border-stone-300 px-3 py-1.5">
                    {a.enabled ? "Hide" : "Show"}
                  </button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded border border-stone-300 px-2.5 py-1.5 disabled:opacity-40">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === alerts.length - 1} aria-label="Move down" className="rounded border border-stone-300 px-2.5 py-1.5 disabled:opacity-40">
                    ↓
                  </button>
                  {confirmId === a.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-red-700">Delete this bar?</span>
                      <button type="button" onClick={() => remove(a.id)} className="rounded bg-red-600 px-3 py-1.5 text-white">
                        Yes, delete
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className="rounded border border-stone-300 px-3 py-1.5">
                        No
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(a.id)} className="rounded border border-red-300 px-3 py-1.5 text-red-700">
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {open && (
                <div className="border-t border-stone-200 p-3">
                  <AlertEditor alert={a} onChange={(next) => update(a.id, next)} pages={pages} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={add} className="rounded border border-stone-300 px-4 py-2">
          + Add a bar
        </button>
        <button
          type="button"
          onClick={() => {
            change(defaultAlerts());
            setOpenId(null);
          }}
          className="text-xs underline"
        >
          Start over with the original messages
        </button>
      </div>

      {message && <p className={"mt-4 text-sm " + (message.startsWith("Saved") ? "text-green-700" : "text-red-600")}>{message}</p>}
      {dirty && !message && <p className="mt-4 text-sm text-amber-700">You have changes that are not saved yet.</p>}

      <button onClick={onSave} disabled={saving || !dirty} className="mt-4 rounded bg-[var(--brand)] px-6 py-2 text-[var(--brand-contrast)] disabled:opacity-60">
        {saving ? "Saving…" : "Save announcements"}
      </button>
    </div>
  );
}
