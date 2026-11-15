"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPKR } from "@/lib/products";
import { BUCKET, resizeImage, slugify, storagePathFromUrl } from "@/lib/adminHelpers";

const EMPTY = {
  id: null,
  name: "",
  slug: "",
  fabric: "",
  color: "",
  season: "",
  shirt_fabric: "",
  dupatta_fabric: "",
  trouser_fabric: "",
  price: "",
  sale_price: "",
  collection_slug: "",
  includes: "Shirt, Dupatta, Trouser",
  description: "",
  is_new: false,
  sold_out: false,
  is_visible: true,
  images: [],
};

async function removeFiles(urls) {
  const paths = urls.map(storagePathFromUrl).filter(Boolean);
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [form, setForm] = useState(null); // null = show the list
  const [slugTouched, setSlugTouched] = useState(false);
  const [removed, setRemoved] = useState([]); // images removed from this form (deleted on save)
  const [uploaded, setUploaded] = useState([]); // images uploaded in this form (deleted on cancel)
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from("products").select("*").order("id", { ascending: false }),
      supabase.from("collections").select("slug,name,parent_slug").order("sort_order"),
    ]);
    if (p.error) setMessage("Could not load products.");
    else setProducts(p.data || []);
    setCollections(c.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openForm(product) {
    setMessage("");
    setRemoved([]);
    setUploaded([]);
    if (product) {
      setSlugTouched(true);
      setForm({
        ...EMPTY,
        ...product,
        price: String(product.price ?? ""),
        sale_price: product.sale_price == null ? "" : String(product.sale_price),
        collection_slug: product.collection_slug || "",
        fabric: product.fabric || "",
        color: product.color || "",
        season: product.season || "",
        shirt_fabric: product.shirt_fabric || "",
        dupatta_fabric: product.dupatta_fabric || "",
        trouser_fabric: product.trouser_fabric || "",
        description: product.description || "",
        images: product.images || [],
      });
    } else {
      setSlugTouched(false);
      setForm({ ...EMPTY });
    }
  }

  async function closeForm() {
    await removeFiles(uploaded); // photos uploaded but never saved
    setForm(null);
  }

  function setField(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    setMessage("");
    try {
      const folder = form.slug || slugify(form.name) || "new";
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const { blob, ext, contentType } = await resizeImage(files[i]);
        const path = `${folder}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
          contentType,
          cacheControl: "31536000",
        });
        if (error) throw error;
        urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
      setUploaded((u) => [...u, ...urls]);
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      setMessage("Photo upload failed. Please try again.");
    }
    setUploading(false);
  }

  function removeImage(url) {
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
    setRemoved((r) => [...r, url]);
  }

  function makeCover(url) {
    setForm((f) => ({ ...f, images: [url, ...f.images.filter((u) => u !== url)] }));
  }

  async function onSave(e) {
    e.preventDefault();
    setMessage("");
    const price = Number(form.price);
    const sale = form.sale_price === "" ? null : Number(form.sale_price);

    if (form.name.trim().length < 2) return setMessage("Please enter the product name.");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setMessage("Slug can only have small letters, numbers and dashes.");
    if (!(price >= 0) || form.price === "") return setMessage("Please enter a valid price.");
    if (sale !== null && !(sale > 0 && sale < price)) return setMessage("Sale price must be less than the price.");

    const payload = {
      name: form.name.trim(),
      slug: form.slug,
      fabric: form.fabric.trim() || null,
      color: form.color.trim() || null,
      season: form.season || null,
      shirt_fabric: form.shirt_fabric.trim() || null,
      dupatta_fabric: form.dupatta_fabric.trim() || null,
      trouser_fabric: form.trouser_fabric.trim() || null,
      price,
      sale_price: sale,
      collection_slug: form.collection_slug || null,
      includes: form.includes.trim() || "Shirt, Dupatta, Trouser",
      description: form.description.trim() || null,
      is_new: form.is_new,
      sold_out: form.sold_out,
      is_visible: form.is_visible,
      images: form.images,
    };

    setSaving(true);
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);

    if (error) {
      setMessage(error.code === "23505" ? "This slug is already used by another product." : "Could not save the product.");
      return;
    }
    await removeFiles(removed.filter((u) => !form.images.includes(u)));
    setForm(null);
    setMessage("Saved.");
    load();
  }

  async function quickToggle(p, field) {
    const { error } = await supabase.from("products").update({ [field]: !p[field] }).eq("id", p.id);
    if (error) return setMessage("Could not update the product.");
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, [field]: !p[field] } : x)));
  }

  async function onDelete(p) {
    if (!window.confirm(`Delete "${p.name}" for good, with its photos? Use Hide if you only want it off the website.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return setMessage("Could not delete the product.");
    await removeFiles(p.images || []);
    setMessage("Deleted.");
    load();
  }

  const input = "w-full rounded border border-stone-300 px-3 py-2 text-sm";

  if (form) {
    return (
      <form onSubmit={onSave} className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-lg font-bold">{form.id ? "Edit product" : "Add product"}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Name *</label>
          <input className={input} value={form.name} onChange={(e) => setField("name", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Page address (slug) *</label>
          <input
            className={input}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setField("slug", slugify(e.target.value));
            }}
          />
          <p className="mt-1 text-xs text-stone-500">Link will be /products/{form.slug || "…"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Price (Rs.) *</label>
            <input className={input} inputMode="numeric" value={form.price} onChange={(e) => setField("price", e.target.value.replace(/[^\d.]/g, ""))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sale price (optional)</label>
            <input className={input} inputMode="numeric" value={form.sale_price} onChange={(e) => setField("sale_price", e.target.value.replace(/[^\d.]/g, ""))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Fabric</label>
            <input className={input} value={form.fabric} onChange={(e) => setField("fabric", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Collection</label>
            <select className={input} value={form.collection_slug} onChange={(e) => setField("collection_slug", e.target.value)}>
              <option value="">None</option>
              {collections.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.parent_slug ? "— " : ""}{c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Colour</label>
            <input className={input} value={form.color} onChange={(e) => setField("color", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Season</label>
            <select className={input} value={form.season} onChange={(e) => setField("season", e.target.value)}>
              <option value="">Not set</option>
              <option value="summer">Summer</option>
              <option value="winter">Winter</option>
            </select>
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">What is included (fabric of each piece)</p>
          <div className="grid grid-cols-3 gap-3">
            <input className={input} placeholder="Shirt, e.g. Embroidered Lawn" value={form.shirt_fabric} onChange={(e) => setField("shirt_fabric", e.target.value)} />
            <input className={input} placeholder="Dupatta, e.g. Embroidered Chiffon" value={form.dupatta_fabric} onChange={(e) => setField("dupatta_fabric", e.target.value)} />
            <input className={input} placeholder="Trouser, e.g. Lawn" value={form.trouser_fabric} onChange={(e) => setField("trouser_fabric", e.target.value)} />
          </div>
          <p className="mt-1 text-xs text-stone-500">Leave these empty to show the simple text below instead.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Included pieces (simple text)</label>
          <input className={input} value={form.includes} onChange={(e) => setField("includes", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea rows={4} className={input} value={form.description} onChange={(e) => setField("description", e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_new} onChange={(e) => setField("is_new", e.target.checked)} /> Show “NEW” badge</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.sold_out} onChange={(e) => setField("sold_out", e.target.checked)} /> Sold out</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_visible} onChange={(e) => setField("is_visible", e.target.checked)} /> Show on website</label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Photos (first one is the cover, second shows on hover)</p>
          <div className="flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={url} className="w-24 text-center text-xs">
                <img src={url} alt="" className="h-32 w-24 rounded object-cover" />
                <div className="mt-1 flex justify-center gap-2">
                  {i > 0 && <button type="button" className="underline" onClick={() => makeCover(url)}>Cover</button>}
                  <button type="button" className="text-red-600 underline" onClick={() => removeImage(url)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <label className="mt-3 inline-block cursor-pointer rounded border border-stone-300 px-4 py-2 text-sm">
            {uploading ? "Uploading…" : "Add photos"}
            <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={onPickFiles} />
          </label>
          <p className="mt-1 text-xs text-stone-500">Photos are made smaller automatically before upload.</p>
        </div>

        {message && <p className="text-sm text-red-600">{message}</p>}

        <div className="flex gap-3">
          <button disabled={saving || uploading} className="rounded bg-[var(--brand)] px-6 py-2 text-[var(--brand-contrast)] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={closeForm} className="rounded border border-stone-300 px-6 py-2">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => openForm(null)} className="rounded bg-[var(--brand)] px-4 py-2 text-sm text-[var(--brand-contrast)]">
          + Add product
        </button>
        {message && <span className="text-sm text-stone-600">{message}</span>}
      </div>

      {loading && <p className="text-sm text-stone-500">Loading…</p>}
      {!loading && products.length === 0 && <p className="py-8 text-center text-stone-500">No products yet.</p>}

      <div className="divide-y divide-stone-200 rounded-lg border border-stone-200">
        {products.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-stone-100">
              {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-40 flex-1">
              <p className="font-medium">{p.name}</p>
              <p className="text-stone-500">
                {formatPKR(p.price)}{p.sale_price ? ` → ${formatPKR(p.sale_price)}` : ""} · {p.collection_slug || "no collection"}
              </p>
              <p className="text-xs">
                {!p.is_visible && <span className="mr-2 rounded bg-stone-200 px-1.5">Hidden</span>}
                {p.sold_out && <span className="mr-2 rounded bg-red-100 px-1.5 text-red-800">Sold out</span>}
                {p.is_new && <span className="rounded bg-black px-1.5 text-white">New</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openForm(p)} className="rounded border border-stone-300 px-3 py-1">Edit</button>
              <button onClick={() => quickToggle(p, "sold_out")} className="rounded border border-stone-300 px-3 py-1">
                {p.sold_out ? "In stock" : "Sold out"}
              </button>
              <button onClick={() => quickToggle(p, "is_visible")} className="rounded border border-stone-300 px-3 py-1">
                {p.is_visible ? "Hide" : "Show"}
              </button>
              <button onClick={() => onDelete(p)} className="rounded border border-red-300 px-3 py-1 text-red-700">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
