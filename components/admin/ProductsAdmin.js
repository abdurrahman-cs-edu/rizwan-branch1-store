"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPKR } from "@/lib/products";
import { FABRIC_SUGGESTIONS, SEASONS, SIZES } from "@/lib/config";
import { BUCKET, resizeImage, slugify, storagePathFromUrl } from "@/lib/adminHelpers";

const EMPTY = {
  id: null,
  name: "",
  slug: "",
  fabric: "",
  color: "",
  shirt_fabric: "",
  dupatta_fabric: "",
  trouser_fabric: "",
  price: "",
  sale_percent: "",
  sale_active: false,
  stock: { S: "", M: "", L: "", XL: "", XXL: "" },
  collection_slugs: [], // every collection / season the suit shows in
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
  const [bulkPercent, setBulkPercent] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from("products").select("*").order("id", { ascending: false }),
      supabase.from("collections").select("slug,name,parent_slug,is_visible").order("sort_order"),
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
        sale_percent: product.sale_percent == null ? "" : String(product.sale_percent),
        sale_active: !!product.sale_active,
        stock: Object.fromEntries(
          SIZES.map((s) => [s, product.stock && product.stock[s] != null ? String(product.stock[s]) : ""])
        ),
        collection_slugs:
          Array.isArray(product.collection_slugs) && product.collection_slugs.length > 0
            ? product.collection_slugs
            : [product.collection_slug, product.season].filter(Boolean),
        fabric: product.fabric || "",
        color: product.color || "",
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

  // Tick / untick a collection. Ticking one inside Summer also ticks Summer;
  // unticking Summer also unticks the ones inside it.
  function toggleCollection(slug) {
    setForm((f) => {
      const set = new Set(f.collection_slugs);
      const c = collections.find((x) => x.slug === slug);
      if (set.has(slug)) {
        set.delete(slug);
        collections.filter((x) => x.parent_slug === slug).forEach((x) => set.delete(x.slug));
      } else {
        set.add(slug);
        if (c?.parent_slug) set.add(c.parent_slug);
      }
      return { ...f, collection_slugs: [...set] };
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
    const salePct = form.sale_percent === "" ? null : Number(form.sale_percent);

    if (form.name.trim().length < 2) return setMessage("Please enter the product name.");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setMessage("Slug can only have small letters, numbers and dashes.");
    if (!(price >= 0) || form.price === "") return setMessage("Please enter a valid price.");
    if (salePct !== null && !(Number.isInteger(salePct) && salePct >= 1 && salePct <= 90)) return setMessage("Sale % must be a whole number from 1 to 90.");
    if (form.sale_active && salePct === null) return setMessage("Enter the sale % to turn the sale on.");

    // Quantity per size: all boxes empty = quantity is not counted (null); otherwise empty boxes count as 0.
    const anyStock = SIZES.some((s) => String(form.stock[s]).trim() !== "");
    const stock = anyStock
      ? Object.fromEntries(SIZES.map((s) => [s, Math.min(9999, parseInt(form.stock[s], 10) || 0)]))
      : null;

    // The old single columns are kept in step for older code: "season" = first ticked season,
    // "collection_slug" = the most specific ticked collection.
    const chosen = form.collection_slugs;
    const seasonValues = SEASONS.map((x) => x.value);
    const parentOf = (slug) => collections.find((x) => x.slug === slug)?.parent_slug;
    const season = chosen.find((x) => seasonValues.includes(x)) || null;
    const mainCollection =
      chosen.find((x) => parentOf(x)) || chosen.find((x) => !seasonValues.includes(x)) || chosen[0] || null;

    const payload = {
      name: form.name.trim(),
      slug: form.slug,
      fabric: form.fabric.trim() || null,
      color: form.color.trim() || null,
      season,
      shirt_fabric: form.shirt_fabric.trim() || null,
      dupatta_fabric: form.dupatta_fabric.trim() || null,
      trouser_fabric: form.trouser_fabric.trim() || null,
      price,
      sale_percent: salePct,
      sale_active: form.sale_active && salePct !== null,
      stock,
      collection_slug: mainCollection,
      collection_slugs: chosen,
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

  // Start / stop the same sale on every suit at once (the % stays saved when a sale is stopped).
  async function startSaleAll() {
    const pct = Number(bulkPercent);
    if (!Number.isInteger(pct) || pct < 1 || pct > 90) return setMessage("Enter a sale % from 1 to 90.");
    if (!window.confirm(`Start a ${pct}% sale on all ${products.length} suits?`)) return;
    const { error } = await supabase.from("products").update({ sale_percent: pct, sale_active: true }).gt("id", 0);
    if (error) return setMessage("Could not start the sale.");
    setMessage(`${pct}% sale is ON for all suits.`);
    load();
  }

  async function stopSaleAll() {
    if (!window.confirm("Stop the sale on all suits? Prices go back to normal.")) return;
    const { error } = await supabase.from("products").update({ sale_active: false }).gt("id", 0);
    if (error) return setMessage("Could not stop the sale.");
    setMessage("Sale is OFF for all suits.");
    load();
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
            <label className="mb-1 block text-sm font-medium">Sale % off (e.g. 30)</label>
            <input className={input} inputMode="numeric" placeholder="Leave empty for no sale" value={form.sale_percent} onChange={(e) => setField("sale_percent", e.target.value.replace(/[^\d]/g, ""))} />
          </div>
        </div>
        <div className="rounded border border-stone-200 bg-stone-50 p-3 text-sm">
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" checked={form.sale_active} onChange={(e) => setField("sale_active", e.target.checked)} />
            Sale is ON for this suit
          </label>
          <p className="mt-1 text-xs text-stone-600">
            {Number(form.price) > 0 && Number(form.sale_percent) >= 1 && Number(form.sale_percent) <= 90
              ? `Customers will pay ${formatPKR(Math.round((Number(form.price) * (100 - Number(form.sale_percent))) / 100))} (${form.sale_percent}% off ${formatPKR(Number(form.price))}) while the sale is on.`
              : "Type the % and tick the box to start the sale. Untick it to stop the sale (the % stays saved)."}
            {" "}A glowing “% OFF” tag shows under the suit and it joins the Sale section and the “On sale” filter automatically.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Fabric</label>
            <input className={input} value={form.fabric} onChange={(e) => setField("fabric", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Colour</label>
            <input className={input} value={form.color} onChange={(e) => setField("color", e.target.value)} />
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">Show this suit in (tick all that apply)</p>
          <div className="space-y-2 rounded border border-stone-200 p-3 text-sm">
            {collections.filter((c) => !c.parent_slug).map((parent) => (
              <div key={parent.slug}>
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={form.collection_slugs.includes(parent.slug)} onChange={() => toggleCollection(parent.slug)} />
                  {parent.name}
                  {!parent.is_visible && <span className="text-xs font-normal text-stone-500">(hidden)</span>}
                </label>
                {collections.filter((c) => c.parent_slug === parent.slug).map((c) => (
                  <label key={c.slug} className="ml-6 mt-1 flex items-center gap-2">
                    <input type="checkbox" checked={form.collection_slugs.includes(c.slug)} onChange={() => toggleCollection(c.slug)} />
                    {c.name}
                    {!c.is_visible && <span className="text-xs text-stone-500">(hidden)</span>}
                  </label>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-stone-600">
            Tick Summer, Winter and/or Tropical weather to show the suit in each of them. A suit ticked inside a season (indented) also shows in that season.
          </p>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">What is included (fabric of each piece)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["shirt_fabric", "Shirt fabric", "shirt"],
              ["dupatta_fabric", "Dupatta fabric (Chiffon, Net, …)", "dupatta"],
              ["trouser_fabric", "Trouser fabric", "trouser"],
            ].map(([field, label, key]) => (
              <div key={field}>
                <label className="mb-1 block text-xs text-stone-600">{label}</label>
                <input
                  className={input}
                  list={`fabric-${key}`}
                  placeholder="Choose or type"
                  value={form[field]}
                  onChange={(e) => setField(field, e.target.value)}
                />
                <datalist id={`fabric-${key}`}>
                  {FABRIC_SUGGESTIONS[key].map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-stone-500">Pick from the list or type your own. Leave empty to show the simple text below instead.</p>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Quantity in stock (per size)</p>
          <div className="grid grid-cols-5 gap-2">
            {SIZES.map((s) => (
              <div key={s}>
                <label className="mb-1 block text-center text-xs text-stone-600">{s}</label>
                <input
                  className={`${input} text-center`}
                  inputMode="numeric"
                  placeholder="0"
                  value={form.stock[s]}
                  onChange={(e) => setForm((f) => ({ ...f, stock: { ...f.stock, [s]: e.target.value.replace(/[^\d]/g, "") } }))}
                />
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-stone-500">
            How many pieces you have in each size. A size at 0 shows as sold out to customers, and when every size is 0 the
            whole suit shows Sold out. Website orders reduce these numbers by themselves and cancelling an order adds them
            back. For sales made in the shop, change the numbers here. Leave all boxes empty if you do not want to count
            quantity (empty boxes count as 0 once you fill at least one).
          </p>
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

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
        <span className="font-medium">Sale on all suits:</span>
        <input
          className="w-16 rounded border border-stone-300 px-2 py-1.5 text-center"
          inputMode="numeric"
          value={bulkPercent}
          onChange={(e) => setBulkPercent(e.target.value.replace(/[^\d]/g, ""))}
          aria-label="Sale percent"
        />
        <span>% off</span>
        <button onClick={startSaleAll} className="rounded bg-[var(--brand)] px-3 py-1.5 text-[var(--brand-contrast)]">Start sale</button>
        <button onClick={stopSaleAll} className="rounded border border-stone-300 px-3 py-1.5">Stop sale</button>
        <span className="text-xs text-stone-500">For one suit only, use Edit.</span>
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
                {formatPKR(p.price)}
                {p.sale_active && p.sale_percent ? ` → ${formatPKR(Math.round((Number(p.price) * (100 - p.sale_percent)) / 100))} (${p.sale_percent}% off)` : ""}
                {" · "}
                {(Array.isArray(p.collection_slugs) && p.collection_slugs.length > 0 ? p.collection_slugs : [p.collection_slug].filter(Boolean))
                  .map((slug) => collections.find((c) => c.slug === slug)?.name || slug)
                  .join(", ") || "no collection"}
              </p>
              {p.stock && (
                <p className="text-xs text-stone-600">
                  Stock:{" "}
                  {SIZES.map((s) => {
                    const n = Number(p.stock[s]) || 0;
                    return (
                      <span key={s} className={"mr-2 " + (n === 0 ? "text-red-600" : "")}>
                        {s} {n}
                      </span>
                    );
                  })}
                </p>
              )}
              <p className="text-xs">
                {!p.is_visible && <span className="mr-2 rounded bg-stone-200 px-1.5">Hidden</span>}
                {p.sold_out && <span className="mr-2 rounded bg-red-100 px-1.5 text-red-800">Sold out</span>}
                {p.is_new && <span className="mr-2 rounded bg-black px-1.5 text-white">New</span>}
                {p.sale_active && p.sale_percent && <span className="rounded bg-orange-100 px-1.5 text-orange-800">Sale {p.sale_percent}%</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openForm(p)} className="rounded border border-stone-300 px-3 py-1">Edit</button>
              {p.sale_percent && (
                <button onClick={() => quickToggle(p, "sale_active")} className="rounded border border-stone-300 px-3 py-1">
                  {p.sale_active ? "Sale off" : "Sale on"}
                </button>
              )}
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
