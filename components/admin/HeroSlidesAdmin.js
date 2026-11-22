"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { resizeImage } from "@/lib/adminHelpers";
import { removeImages, uploadImage } from "@/lib/imageStorage";

const KEY = "home_slides";
const OLD_KEY = "home_cover"; // the single cover photo used before the slideshow existed
const MAX_SLIDES = 8;
const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));
const pct = (n, d) => (typeof n === "number" && n >= 0 && n <= 100 ? n : d);

const FIXED_LINKS = [
  { label: "All collections", href: "/collections" },
  { label: "New arrivals", href: "/collections?sort=newest" },
  { label: "Sale", href: "/collections?avail=sale" },
];

let nextId = 1;
const withId = (s) => ({ id: nextId++, url: s.url, x: pct(s.x, 50), y: pct(s.y, 30), title: s.title || "", link: s.link || "/collections" });

// The photos that change by themselves at the top of the home page.
// Add several photos, drag the circle to choose which part stays in view, give each an optional heading and button link.
export default function HeroSlidesAdmin() {
  const [slides, setSlides] = useState([]);
  const [dark, setDark] = useState(30); // percent
  const [seconds, setSeconds] = useState(3); // how long each photo stays
  const [sel, setSel] = useState(0);
  const [ratio, setRatio] = useState(1.5); // width / height of the selected photo
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notSaved, setNotSaved] = useState(false); // showing the old cover photo that is not yet part of a slideshow
  const [message, setMessage] = useState("");
  const pad = useRef(null);
  const dragging = useRef(false);

  const load = useCallback(async () => {
    const [{ data: row }, { data: cols }] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle(),
      supabase.from("collections").select("slug,name,parent_slug").order("sort_order"),
    ]);
    setCollections(cols || []);
    const v = row?.value;
    if (v && Array.isArray(v.slides)) {
      setSlides(v.slides.filter((s) => s?.url).map(withId));
      const d = Math.round(Number(v.dark) * 100);
      setDark(d >= 10 && d <= 85 ? d : 30);
      const sec = Number(v.seconds);
      setSeconds(sec >= 2 && sec <= 8 ? sec : 3);
    } else {
      // Nothing saved yet: start from the old single cover photo, if there is one.
      const { data: old } = await supabase.from("site_settings").select("value").eq("key", OLD_KEY).maybeSingle();
      const o = old?.value;
      if (o?.url) {
        setSlides([withId({ url: o.url, x: o.x, y: o.y })]);
        setNotSaved(true);
      }
      setDark(30);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = slides[sel] || null;

  async function persist(nextSlides, nextDark, nextSeconds = seconds) {
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: KEY,
        value: {
          slides: nextSlides.map(({ url, x, y, title, link }) => ({ url, x, y, title: title.trim(), link })),
          dark: nextDark / 100,
          seconds: nextSeconds,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    return error;
  }

  function edit(patch) {
    setSlides((list) => list.map((s, k) => (k === sel ? { ...s, ...patch } : s)));
    setDirty(true);
    setMessage("");
  }

  async function onPick(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_SLIDES - slides.length);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setMessage("");
    const uploadedUrls = [];
    try {
      const added = [];
      for (const [k, file] of files.entries()) {
        const { blob, ext, contentType } = await resizeImage(file, 1920, 0.8);
        const path = `slides/${Date.now()}-${k}.${ext}`;
        const url = await uploadImage(path, blob, contentType);
        uploadedUrls.push(url);
        added.push(withId({ url }));
      }
      const next = [...slides, ...added];
      const error = await persist(next, dark);
      if (error) throw error;
      setSlides(next);
      setSel(slides.length);
      setNotSaved(false);
      setDirty(false);
      setMessage(`${added.length} photo${added.length > 1 ? "s" : ""} added and saved. Now choose which part of each photo should show.`);
    } catch {
      if (uploadedUrls.length) await removeImages(uploadedUrls);
      setMessage("Could not save the photo. Please try again.");
    }
    setBusy(false);
  }

  async function onSave() {
    setBusy(true);
    const error = await persist(slides, dark);
    setBusy(false);
    if (!error) {
      setDirty(false);
      setNotSaved(false);
    }
    setMessage(error ? "Could not save." : "Saved. The home page shows the change within a minute.");
  }

  async function onRemove() {
    if (!current || !window.confirm("Remove this photo from the slideshow? The photo file is deleted too.")) return;
    setBusy(true);
    const next = slides.filter((_, k) => k !== sel);
    const error = await persist(next, dark);
    if (!error) {
      await removeImages([current.url]);
      setSlides(next);
      setSel(Math.max(0, Math.min(sel, next.length - 1)));
      setNotSaved(false);
      setMessage("Photo removed.");
    } else {
      setMessage("Could not remove it.");
    }
    setBusy(false);
  }

  function move(by) {
    const to = sel + by;
    if (to < 0 || to >= slides.length) return;
    setSlides((list) => {
      const copy = [...list];
      [copy[sel], copy[to]] = [copy[to], copy[sel]];
      return copy;
    });
    setSel(to);
    setDirty(true);
    setMessage("");
  }

  // Click or drag on the full photo to choose the part that stays in view.
  function setFromEvent(e) {
    const r = pad.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return;
    edit({
      x: clamp(((e.clientX - r.left) / r.width) * 100),
      y: clamp(((e.clientY - r.top) / r.height) * 100),
    });
  }

  const shade = { background: `rgba(0,0,0,${dark / 100})` };
  const objectPosition = current ? `${current.x}% ${current.y}%` : "50% 30%";
  const linkOptions = [
    ...FIXED_LINKS,
    ...collections.map((c) => ({ label: (c.parent_slug ? "— " : "") + c.name, href: `/collections/${c.slug}` })),
  ];
  const linkKnown = current ? linkOptions.some((o) => o.href === current.link) : true;

  return (
    <div className="mb-8 max-w-3xl space-y-4 rounded-lg border border-stone-200 p-4">
      <h2 className="text-lg">Home page slideshow</h2>
      <p className="text-xs text-stone-600">
        The big photos at the top of the home page. They change by themselves every few seconds. Add 3 to 6 wide photos (a model or the
        shop). A photo of 2 to 3 MB is fine: it is made smaller (about 1920 px wide, a few hundred KB) automatically before it is saved. The menu and logo sit on top of the photo, so keep the top part of each photo simple. If you add nothing, the photos of
        your first suits are shown.
      </p>

      {loading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <>
          {notSaved && (
            <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">
              This is your old cover photo. Add more photos below to make a slideshow.
            </p>
          )}

          {slides.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slides.map((s, k) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSel(k)}
                  className={`relative h-16 w-24 overflow-hidden rounded border-2 ${k === sel ? "border-[#111]" : "border-transparent opacity-70"}`}
                  aria-label={`Photo ${k + 1}`}
                >
                  <img src={s.url} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${s.x}% ${s.y}%` }} />
                  <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[11px] leading-5 text-white">{k + 1}</span>
                </button>
              ))}
            </div>
          )}

          {current && (
            <div className="space-y-4 rounded border border-stone-200 p-3">
              <div>
                <p className="mb-1 text-sm font-medium">1. Choose the part that should show (photo {sel + 1})</p>
                <p className="mb-2 text-xs text-stone-600">
                  Tap or drag on the photo. The circle marks the centre of what stays in view. The previews below change as you move it.
                </p>
                <div
                  ref={pad}
                  className="relative cursor-crosshair touch-none select-none overflow-hidden rounded bg-stone-100"
                  style={{ width: `min(100%, ${18 * ratio}rem)`, aspectRatio: ratio }}
                  onPointerDown={(e) => {
                    dragging.current = true;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setFromEvent(e);
                  }}
                  onPointerMove={(e) => {
                    if (dragging.current) setFromEvent(e);
                  }}
                  onPointerUp={() => {
                    dragging.current = false;
                  }}
                  onPointerCancel={() => {
                    dragging.current = false;
                  }}
                >
                  <img
                    src={current.url}
                    alt=""
                    draggable={false}
                    onLoad={(e) => {
                      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                      if (w && h) setRatio(w / h);
                    }}
                    className="absolute inset-0 h-full w-full"
                  />
                  <span
                    className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.65)]"
                    style={{ left: `${current.x}%`, top: `${current.y}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">2. How it will look</p>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="mb-1 text-xs text-stone-500">Computer</p>
                    <div className="relative aspect-[16/9] overflow-hidden rounded bg-stone-800">
                      <img src={current.url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition }} />
                      <div className="absolute inset-0" style={shade} />
                      <p className="font-display relative flex h-full items-center justify-center px-2 text-center text-xl uppercase tracking-[0.1em] text-white">
                        {current.title}
                      </p>
                    </div>
                  </div>
                  <div className="w-28 shrink-0">
                    <p className="mb-1 text-xs text-stone-500">Phone</p>
                    <div className="relative aspect-[9/16] overflow-hidden rounded bg-stone-800">
                      <img src={current.url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition }} />
                      <div className="absolute inset-0" style={shade} />
                      <p className="font-display relative flex h-full items-center justify-center px-1 text-center text-sm uppercase tracking-[0.08em] text-white">
                        {current.title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <label className="block text-sm">
                3. Big heading in the middle of this photo (optional)
                <input
                  type="text"
                  maxLength={40}
                  value={current.title}
                  onChange={(e) => edit({ title: e.target.value })}
                  placeholder="For example: Eid Special. Leave empty for no heading."
                  className="mt-1 block w-full rounded border border-stone-300 px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                4. The “Shop now” button (at the bottom of the photo) opens
                <select
                  value={current.link}
                  onChange={(e) => edit({ link: e.target.value })}
                  className="mt-1 block w-full rounded border border-stone-300 px-3 py-2"
                >
                  {!linkKnown && <option value={current.link}>{current.link}</option>}
                  {linkOptions.map((o) => (
                    <option key={o.href} value={o.href}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2 text-sm">
                <button type="button" onClick={() => move(-1)} disabled={busy || sel === 0} className="rounded border border-stone-300 px-3 py-2 disabled:opacity-40">
                  ← Move earlier
                </button>
                <button type="button" onClick={() => move(1)} disabled={busy || sel === slides.length - 1} className="rounded border border-stone-300 px-3 py-2 disabled:opacity-40">
                  Move later →
                </button>
                <button type="button" onClick={onRemove} disabled={busy} className="ml-auto rounded border border-red-300 px-3 py-2 text-red-700 disabled:opacity-60">
                  Remove this photo
                </button>
              </div>
            </div>
          )}

          <label className="block text-sm">
            Change to the next photo every
            <select
              value={seconds}
              onChange={(e) => {
                setSeconds(Number(e.target.value));
                setDirty(true);
                setMessage("");
              }}
              className="mx-2 rounded border border-stone-300 px-2 py-1"
            >
              {[2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            seconds
          </label>

          <label className="block text-sm">
            Darkness over the photos: {dark}%
            <input
              type="range"
              min={10}
              max={85}
              value={dark}
              onChange={(e) => {
                setDark(Number(e.target.value));
                setDirty(true);
                setMessage("");
              }}
              className="mt-1 block w-full"
            />
            <span className="text-xs text-stone-500">Lower is brighter. Around 30% is good. Go higher only if the writing is hard to read.</span>
          </label>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              onClick={onSave}
              disabled={busy || slides.length === 0 || (!dirty && !notSaved)}
              className="rounded bg-[var(--brand)] px-4 py-2 text-[var(--brand-contrast)] disabled:opacity-50"
            >
              Save changes
            </button>
            {slides.length < MAX_SLIDES ? (
              <label className="cursor-pointer rounded border border-stone-300 px-4 py-2">
                {busy ? "Please wait…" : slides.length ? "Add photos" : "Upload photos"}
                <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={onPick} />
              </label>
            ) : (
              <span className="text-xs text-stone-500">Up to {MAX_SLIDES} photos.</span>
            )}
            {dirty && <span className="text-xs text-amber-700">You have changes that are not saved yet.</span>}
          </div>
          {message && <p className="text-sm text-stone-700">{message}</p>}
        </>
      )}
    </div>
  );
}
