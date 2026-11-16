"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BUCKET, resizeImage, storagePathFromUrl } from "@/lib/adminHelpers";

// Customer feedback: upload WhatsApp screenshots. They show on the home page (top)
// and on suit pages (general ones everywhere, tagged ones only on that suit).
export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [r, p] = await Promise.all([
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("slug,name").order("name"),
    ]);
    if (r.error) setMessage("Could not load feedback.");
    else setReviews(r.data || []);
    setProducts(p.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    setMessage("");
    let done = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        // Screenshots keep more detail than product photos so the chat text stays readable.
        const { blob, ext, contentType } = await resizeImage(files[i], 2000, 0.85);
        const path = `reviews/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
          contentType,
          cacheControl: "31536000",
        });
        if (upErr) throw upErr;
        const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const { error: insErr } = await supabase.from("reviews").insert({
          image_url: url,
          caption: newCaption.trim() || null,
          product_slug: newSlug || null,
        });
        if (insErr) {
          await supabase.storage.from(BUCKET).remove([path]);
          throw insErr;
        }
        done++;
      }
      setMessage(`${done} screenshot${done === 1 ? "" : "s"} added.`);
      setNewCaption("");
    } catch (err) {
      setMessage(`Upload stopped${done ? ` after ${done} screenshot${done === 1 ? "" : "s"}` : ""}. Please try again.`);
    }
    setUploading(false);
    load();
  }

  async function update(r, patch) {
    const { error } = await supabase.from("reviews").update(patch).eq("id", r.id);
    if (error) return setMessage("Could not save the change.");
    setReviews((list) => list.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
  }

  async function onDelete(r) {
    if (!window.confirm("Delete this feedback screenshot for good? Use Hide if you only want it off the website.")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) return setMessage("Could not delete it.");
    const path = storagePathFromUrl(r.image_url);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    setMessage("Deleted.");
    load();
  }

  const input = "w-full rounded border border-stone-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-3 rounded-lg border border-stone-200 p-4">
        <h2 className="text-lg">Add customer feedback</h2>
        <p className="text-xs text-stone-600">
          Save the WhatsApp screenshot to your phone or computer, then pick it here. You can pick many at once.
          Hide the customer&apos;s phone number first if it shows in the screenshot.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-stone-600">Caption (optional, e.g. “Ayesha, Mingora”)</label>
            <input className={input} value={newCaption} onChange={(e) => setNewCaption(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-600">Show on</label>
            <select className={input} value={newSlug} onChange={(e) => setNewSlug(e.target.value)}>
              <option value="">Home page and every suit page</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>Home page and only {p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="inline-block cursor-pointer rounded bg-[var(--brand)] px-4 py-2 text-sm text-[var(--brand-contrast)]">
          {uploading ? "Uploading…" : "Choose screenshots"}
          <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={onPickFiles} />
        </label>
        {message && <p className="text-sm text-stone-700">{message}</p>}
      </div>

      {loading && <p className="text-sm text-stone-500">Loading…</p>}
      {!loading && reviews.length === 0 && <p className="py-4 text-center text-stone-500">No feedback added yet.</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {reviews.map((r) => (
          <div key={r.id} className="space-y-2 rounded-lg border border-stone-200 p-2 text-xs">
            <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="block">
              <img src={r.image_url} alt="" className={"h-56 w-full rounded object-cover object-top " + (r.is_visible ? "" : "opacity-40")} />
            </a>
            <input
              className="w-full rounded border border-stone-300 px-2 py-1.5"
              placeholder="Caption"
              defaultValue={r.caption || ""}
              onBlur={(e) => {
                const v = e.target.value.trim() || null;
                if (v !== (r.caption || null)) update(r, { caption: v });
              }}
            />
            <select
              className="w-full rounded border border-stone-300 px-2 py-1.5"
              value={r.product_slug || ""}
              onChange={(e) => update(r, { product_slug: e.target.value || null })}
            >
              <option value="">Every page</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>Only {p.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => update(r, { is_visible: !r.is_visible })} className="flex-1 rounded border border-stone-300 py-1">
                {r.is_visible ? "Hide" : "Show"}
              </button>
              <button onClick={() => onDelete(r)} className="flex-1 rounded border border-red-300 py-1 text-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
