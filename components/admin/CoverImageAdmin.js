"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BUCKET, resizeImage, storagePathFromUrl } from "@/lib/adminHelpers";

const KEY = "home_cover";

// The big photo behind "Rizwan Clothing" on the home page.
export default function CoverImageAdmin() {
  const [url, setUrl] = useState(null);
  const [dark, setDark] = useState(55); // percent
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", KEY).maybeSingle();
    const v = data?.value;
    setUrl(v?.url || null);
    const d = Math.round(Number(v?.dark) * 100);
    setDark(d >= 20 && d <= 85 ? d : 55);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(nextUrl, nextDark) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: KEY, value: { url: nextUrl, dark: nextDark / 100 }, updated_at: new Date().toISOString() }, { onConflict: "key" });
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
      const error = await save(newUrl, dark);
      if (error) throw error;
      const oldPath = url ? storagePathFromUrl(url) : null;
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      setUrl(newUrl);
      setMessage("Cover photo saved.");
    } catch {
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      setMessage("Could not save the cover photo. Please try again.");
    }
    setBusy(false);
  }

  async function onSaveDark() {
    setBusy(true);
    const error = await save(url, dark);
    setBusy(false);
    setMessage(error ? "Could not save." : "Saved.");
  }

  async function onRemove() {
    if (!url || !window.confirm("Remove the cover photo? The home page will use the photo of your first suit instead.")) return;
    setBusy(true);
    const error = await save(null, dark);
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

  return (
    <div className="mb-8 max-w-2xl space-y-3 rounded-lg border border-stone-200 p-4">
      <h2 className="text-lg">Home page cover photo</h2>
      <p className="text-xs text-stone-600">
        The big photo behind “Rizwan Clothing” at the top of the home page. A wide photo works best (a shop or model photo).
        If you upload nothing, the photo of your first suit is used.
      </p>

      {loading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <>
          <div className="relative h-40 overflow-hidden rounded bg-stone-800">
            {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_30%]" />}
            <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dark / 100})` }} />
            <p className="relative flex h-full items-center justify-center text-xl uppercase tracking-[0.15em] text-white">
              Rizwan Clothing
            </p>
          </div>

          <label className="block text-sm">
            Darkness: {dark}%
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
            <label className="cursor-pointer rounded bg-[var(--brand)] px-4 py-2 text-[var(--brand-contrast)]">
              {busy ? "Please wait…" : url ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={onPick} />
            </label>
            <button onClick={onSaveDark} disabled={busy} className="rounded border border-stone-300 px-4 py-2 disabled:opacity-60">
              Save darkness
            </button>
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
