"use client";

import { useEffect, useState } from "react";
import AlertBar from "@/components/AlertBar";
import {
  COLOR_PRESETS,
  MAX_MESSAGES,
  MAX_TEXT,
  SIZES,
  SPEEDS,
  STYLES,
  colorsOf,
  contrastRatio,
  fromLocalInput,
  toLocalInput,
} from "@/lib/announcements";

const field = "w-full rounded border border-stone-300 px-2 py-1.5 text-sm";
const heading = "mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500";

// A row of buttons where exactly one is chosen
function Choice({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={
            "rounded border px-3 py-1.5 text-sm " +
            (value === o.key
              ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]"
              : "border-stone-300 bg-white")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4" />
      <span>{children}</span>
    </label>
  );
}

// All the settings of ONE announcement bar, with a live preview that stays in view while you scroll.
// "pages" are the shop pages that can be picked as a link: [{ label, href }].
export default function AlertEditor({ alert, onChange, pages = [] }) {
  const [view, setView] = useState("laptop");
  // The website header sticks to the top while scrolling; the preview sticks right under it
  const [top, setTop] = useState(0);
  useEffect(() => {
    const update = () => {
      const h = document.querySelector("header.site-header");
      setTop(h ? Math.round(h.getBoundingClientRect().height) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const set = (patch) => onChange({ ...alert, ...patch });

  const setMessage = (i, patch) => set({ messages: alert.messages.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) });
  const addMessage = () => set({ messages: [...alert.messages, { text: "", link: "" }] });
  const removeMessage = (i) => set({ messages: alert.messages.filter((_, idx) => idx !== i) });

  const custom = alert.color === "custom";
  const colors = colorsOf(alert);
  const hard = custom && contrastRatio(colors.bg, colors.fg) < 3;
  const badDates = alert.start && alert.end && Date.parse(alert.end) <= Date.parse(alert.start);

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="sticky z-20 -mx-3 bg-white px-3 pb-3 pt-1 shadow-[0_6px_8px_-6px_rgba(0,0,0,0.15)]" style={{ top }}>
        <div className="mb-1.5 flex items-center justify-between">
          <p className={heading + " mb-0"}>Preview (how customers will see it)</p>
          <div className="flex gap-1 text-xs">
            {[
              ["laptop", "Laptop"],
              ["phone", "Phone"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setView(k)}
                aria-pressed={view === k}
                className={"rounded border px-2.5 py-1 " + (view === k ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]" : "border-stone-300")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto overflow-hidden rounded border border-stone-200" style={{ maxWidth: view === "phone" ? 390 : undefined }}>
          <AlertBar alert={alert} preview />
        </div>
      </div>

      {/* Messages */}
      <section>
        <p className={heading}>Messages</p>
        <div className="space-y-2">
          {alert.messages.map((m, i) => (
            <div key={i} className="rounded border border-stone-200 p-2.5">
              <input
                value={m.text}
                maxLength={MAX_TEXT}
                onChange={(e) => setMessage(i, { text: e.target.value })}
                placeholder="Message, for example: Free delivery all over Pakistan"
                className={field}
                aria-label={`Message ${i + 1}`}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={m.link}
                  onChange={(e) => setMessage(i, { link: e.target.value })}
                  placeholder="Link when tapped (optional)"
                  className={field + " min-w-0 flex-1"}
                  aria-label={`Link for message ${i + 1}`}
                />
                {pages.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => e.target.value && setMessage(i, { link: e.target.value })}
                    className="rounded border border-stone-300 px-2 py-1.5 text-sm"
                    aria-label="Choose a page for the link"
                  >
                    <option value="">Choose a page…</option>
                    {pages.map((p) => (
                      <option key={p.href} value={p.href}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                )}
                {alert.messages.length > 1 && (
                  <button type="button" onClick={() => removeMessage(i)} className="text-xs text-red-600 underline">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {alert.messages.length < MAX_MESSAGES && (
          <button type="button" onClick={addMessage} className="mt-2 rounded border border-stone-300 px-3 py-1.5 text-sm">
            + Add another message
          </button>
        )}
        <p className="mt-1.5 text-xs text-stone-500">
          With more than one message, “Still text” puts them side by side, “News ticker” scrolls them all, and “Rotating” shows one after another.
        </p>
      </section>

      {/* Style */}
      <section>
        <p className={heading}>Style</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={alert.style === s.key}
              onClick={() => set({ style: s.key })}
              className={
                "rounded border p-2.5 text-left " +
                (alert.style === s.key ? "border-[var(--brand)] ring-2 ring-[var(--brand)]" : "border-stone-300")
              }
            >
              <span className="block text-sm font-semibold">{s.label}</span>
              <span className="block text-xs text-stone-500">{s.hint}</span>
            </button>
          ))}
        </div>

        {alert.style !== "still" && (
          <div className="mt-3">
            <p className={heading}>
              {alert.style === "ticker" ? "Scrolling speed" : alert.style === "fade" || alert.style === "slide" ? "How long each message stays" : "Speed"}
            </p>
            <Choice value={alert.speed} options={SPEEDS} onChange={(speed) => set({ speed })} />
          </div>
        )}
        {alert.style === "ticker" && (
          <div className="mt-3">
            <p className={heading}>Direction</p>
            <Choice
              value={alert.direction}
              options={[
                { key: "left", label: "Right to left (like TV news)" },
                { key: "right", label: "Left to right" },
              ]}
              onChange={(direction) => set({ direction })}
            />
          </div>
        )}
      </section>

      {/* Colours */}
      <section>
        <p className={heading}>Colours</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={alert.color === p.key}
              aria-label={p.label}
              title={p.label}
              onClick={() => set({ color: p.key })}
              className={
                "flex h-10 w-16 items-center justify-center rounded border text-sm font-semibold " +
                (alert.color === p.key ? "ring-2 ring-offset-2 ring-[var(--brand)]" : "")
              }
              style={{ background: p.bg, color: p.fg, borderColor: "#d6d3d1" }}
            >
              Aa
            </button>
          ))}
          <button
            type="button"
            aria-pressed={custom}
            onClick={() => set({ color: "custom", bg: custom ? alert.bg : colors.bg.startsWith("#") ? colors.bg : "#1f2937", fg: custom ? alert.fg : colors.fg.startsWith("#") ? colors.fg : "#ffffff" })}
            className={"h-10 rounded border border-stone-300 px-3 text-sm " + (custom ? "ring-2 ring-offset-2 ring-[var(--brand)]" : "")}
          >
            Custom
          </button>
        </div>
        {custom && (
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              Background
              <input type="color" value={alert.bg} onChange={(e) => set({ bg: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-stone-300" />
            </label>
            <label className="flex items-center gap-2">
              Text
              <input type="color" value={alert.fg} onChange={(e) => set({ fg: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-stone-300" />
            </label>
            {hard && <span className="text-xs text-red-600">These two colours are hard to read together. Pick colours that differ more.</span>}
          </div>
        )}
      </section>

      {/* Text look */}
      <section>
        <p className={heading}>Text</p>
        <Choice value={alert.size} options={SIZES} onChange={(size) => set({ size })} />
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <Check checked={alert.bold} onChange={(bold) => set({ bold })}>Bold text</Check>
          <Check checked={alert.upper} onChange={(upper) => set({ upper })}>CAPITAL LETTERS</Check>
        </div>
      </section>

      {/* Extras */}
      <section className="space-y-3">
        <p className={heading}>Extras</p>
        <Check checked={alert.closable} onChange={(closable) => set({ closable })}>
          Let customers close this bar (shows a ✕ button; it stays closed for that visit)
        </Check>

        <div>
          <Check checked={alert.countdownOn} onChange={(countdownOn) => set({ countdownOn })}>
            Show a countdown (for example: “Ends in 2d 04h 15m 10s”)
          </Check>
          {alert.countdownOn && (
            <div className="mt-2 flex flex-wrap items-end gap-3 pl-6 text-sm">
              <label>
                <span className="mb-1 block text-xs text-stone-500">Counts down to</span>
                <input
                  type="datetime-local"
                  value={toLocalInput(alert.countdownEnd)}
                  onChange={(e) => set({ countdownEnd: fromLocalInput(e.target.value) })}
                  className="rounded border border-stone-300 px-2 py-1.5"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs text-stone-500">Words before the time</span>
                <input
                  value={alert.countdownLabel}
                  maxLength={30}
                  onChange={(e) => set({ countdownLabel: e.target.value })}
                  placeholder="Ends in"
                  className="w-40 rounded border border-stone-300 px-2 py-1.5"
                />
              </label>
              {!alert.countdownEnd && <span className="text-xs text-red-600">Choose the date and time.</span>}
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-sm">Show only between these times (optional)</p>
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <label>
              <span className="mb-1 block text-xs text-stone-500">Show from</span>
              <input
                type="datetime-local"
                value={toLocalInput(alert.start)}
                onChange={(e) => set({ start: fromLocalInput(e.target.value) })}
                className="rounded border border-stone-300 px-2 py-1.5"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-stone-500">Hide after</span>
              <input
                type="datetime-local"
                value={toLocalInput(alert.end)}
                onChange={(e) => set({ end: fromLocalInput(e.target.value) })}
                className="rounded border border-stone-300 px-2 py-1.5"
              />
            </label>
            {(alert.start || alert.end) && (
              <button type="button" onClick={() => set({ start: "", end: "" })} className="pb-2 text-xs underline">
                Clear times
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Times are your computer’s time. Leave both empty to show the bar whenever it is switched on.
          </p>
          {badDates && <p className="mt-1 text-xs text-red-600">“Hide after” must be later than “Show from”.</p>}
        </div>
      </section>
    </div>
  );
}
