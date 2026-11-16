"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BUCKET, resizeImage, storagePathFromUrl } from "@/lib/adminHelpers";

const KEY = "home_cover";
const DEFAULT_POS = { x: 50, y: 30 }; // percent from the left / top
const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));

// The big photo behind "Rizwan Clothing" on the home page:
// upload it, choose which part of it stays in view, and how dark it is.
export default function CoverImageAdmin() {
  const [url, setUrl] = useState(null);
  const [dark, setDark] = useState(55); // percent
  const [pos, setPos] = useState(DEFAULT_POS);
  const [ratio, setRatio] = useState(1.5); // width / height of the uploaded photo
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pad = useRef(null);
  const dragging = useRef(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle();
    const v = data?.value;
    setUrl(v?.url || null);
    const d = Math.round(Number(v?.dark) * 100);
    setDark(d >= 20 && d <= 85 ? d : 55);
    setPos({
      x: typeof v?.x === "number" && v.x >= 0 && v.x <= 100 ? v.x : DEFAULT_POS.x,
      y: typeof v?.y === "number" && v.y >= 0 && v.y <= 100 ? v.y : DEFAULT_POS.y,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(nextUrl, nextDark, nextPos) {
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          key: KEY,
          value: { url: nextUrl, dark: nextDark / 100, x: nextPos.x, y: nextPos.y },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    return error;
  }

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage("");
    let path = null;
    try {
      const { blob, ext, contentType } = await resizeImage(file, 2200, 0.82);
      path = `cover/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType, cacheControl: "31536000" });
      if (upErr) throw upErr;
      const newUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const error = await save(newUrl, dark, DEFAULT_POS);
      if (error) throw error;
      const oldPath = url ? storagePathFromUrl(url) : null;
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      setUrl(newUrl);
      setPos(DEFAULT_POS);
      setMessage("Cover photo saved. Now choose which part of it should show.");
    } catch {
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      setMessage("Could not save the cover photo. Please try again.");
    }
    setBusy(false);
  }

  async function onSaveLook() {
    setBusy(true);
    const error = await save(url, dark, pos);
    setBusy(false);
    setMessage(error ? "Could not save." : "Saved.");
  }

  async function onRemove() {
    if (!url || !window.confirm("Remove the cover photo? The home page will use the photo of your first suit instead.")) return;
    setBusy(true);
    const error = await save(null, dark, pos);
    if (!error) {
      const oldPath = storagePathFromUrl(url);
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      setUrl(null);
      setMessage("Cover photo removed.");
    } else {
      setMessage("Could not remove it.");
    }
    setBusy(false);
  }

  // Click or drag on the full photo to choose the part that stays in view.
  function setFromEvent(e) {
    const r = pad.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return;
    setPos({
      x: clamp(((e.clientX - r.left) / r.width) * 100),
      y: clamp(((e.clientY - r.top) / r.height) * 100),
    });
  }

  const objectPosition = `${pos.x}% ${pos.y}%`;
  const shade = { background: `rgba(0,0,0,${dark / 100})` };

  return (
    <div className="mb-8 max-w-2xl space-y-4 rounded-lg border border-stone-200 p-4">
      <h2 className="text-lg">Home page cover photo</h2>
      <p className="text-xs text-stone-600">
        The big photo behind “Rizwan Clothing” at the top of the home page. A wide photo works best (a shop or model photo).
        If you upload nothing, the photo of your first suit is used.
      </p>

      {loading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <>
          {url && (
            <div>
              <p className="mb-1 text-sm font-medium">1. Choose the part that should show</p>
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
                  src={url}
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
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">{url ? "2. How it will look" : "Preview"}</p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-0 flex-1 basis-64">
                <p className="mb-1 text-xs text-stone-500">Computer</p>
                <div className="relative aspect-[10/3] overflow-hidden rounded bg-stone-800">
                  {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition }} />}
                  <div className="absolute inset-0" style={shade} />
                  <p className="font-display relative flex h-full items-center justify-center text-xl uppercase tracking-[0.15em] text-white">
                    Rizwan Clothing
                  </p>
                </div>
              </div>
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs text-stone-500">Phone</p>
                <div className="relative aspect-[6/5] overflow-hidden rounded bg-stone-800">
                  {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition }} />}
                  <div className="absolute inset-0" style={shade} />
                  <p className="font-display relative flex h-full items-center justify-center px-2 text-center text-sm uppercase tracking-[0.12em] text-white">
                    Rizwan Clothing
                  </p>
                </div>
              </div>
            </div>
          </div>

          <label className="block text-sm">
            {url ? "3. " : ""}Darkness: {dark}%
            <input
              type="range"
              min={20}
              max={85}
              value={dark}
              onChange={(e) => setDark(Number(e.target.value))}
              className="mt-1 block w-full"
            />
          </label>

          <div className="flex flex-wrap gap-2 text-sm">
            <button onClick={onSaveLook} disabled={busy} className="rounded bg-[var(--brand)] px-4 py-2 text-[var(--brand-contrast)] disabled:opacity-60">
              Save position and darkness
            </button>
            <label className="cursor-pointer rounded border border-stone-300 px-4 py-2">
              {busy ? "Please wait…" : url ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={onPick} />
            </label>
            {url && (
              <button onClick={onRemove} disabled={busy} className="rounded border border-red-300 px-4 py-2 text-red-700 disabled:opacity-60">
                Remove photo
              </button>
            )}
          </div>
          {message && <p className="text-sm text-stone-700">{message}</p>}
        </>
      )}
    </div>
  );
}
