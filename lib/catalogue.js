// Server-side data loading. Reads only PUBLIC data (the safe catalogue view,
// collections and home sections). If the database tables do not exist yet,
// demo data is shown so the site still works in preview.

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_COLLECTIONS, DEFAULT_HOME_SECTIONS, SIZE_CHART } from "@/lib/config";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const demo = (i, name, collection, price, extra = {}) => ({
  id: `demo-${i}`,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  fabric: "Lawn",
  price,
  sale_price: null,
  description: "Demo product shown until real designs are added to the database.",
  images: [],
  collection_slug: collection,
  includes: "Shirt, Dupatta, Trouser",
  sold_out: false,
  is_new: false,
  website_sort: i,
  website_added_at: new Date(2026, 10, 20 - i).toISOString(),
  ...extra,
});

const DEMO_PRODUCTS = [
  demo(1, "Demo Lawn Suit 01", "premium-embroidered-lawn", 6500, { is_new: true }),
  demo(2, "Demo Lawn Suit 02", "premium-embroidered-lawn", 7200, { sale_price: 5900 }),
  demo(3, "Demo Dupatta Print 03", "premium-dupatta-prints", 4800),
  demo(4, "Demo Dupatta Print 04", "premium-dupatta-prints", 5200, { is_new: true }),
  demo(5, "Demo Karandi 05", "print-embroidered-karandi", 8900),
  demo(6, "Demo Karandi 06", "print-embroidered-karandi", 9400, { sold_out: true }),
  demo(7, "Demo Ethnic 07", "the-ethnic", 11500, { is_new: true }),
  demo(8, "Demo Leather Peach 08", "leather-peach", 12800, { sale_price: 10900 }),
];

export async function getCatalogue() {
  const client = db();
  if (!client) return { products: DEMO_PRODUCTS, isDemo: true };
  const { data, error } = await client
    .from("website_catalogue")
    .select("*")
    .order("website_sort", { ascending: true, nullsFirst: false })
    .order("website_added_at", { ascending: false });
  if (error || !data || data.length === 0) {
    return { products: DEMO_PRODUCTS, isDemo: true };
  }
  return { products: data, isDemo: false };
}

export async function getProductBySlug(slug) {
  const { products, isDemo } = await getCatalogue();
  const product = products.find((p) => p.slug === slug) || null;
  return { product, products, isDemo };
}

export async function getCollections() {
  const client = db();
  if (!client) return DEFAULT_COLLECTIONS;
  const { data, error } = await client
    .from("collections")
    .select("slug,name,parent_slug,sort_order,image_url")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return DEFAULT_COLLECTIONS;
  return data;
}

export async function getHomeSections() {
  const client = db();
  if (!client) return DEFAULT_HOME_SECTIONS;
  const { data, error } = await client
    .from("home_sections")
    .select("id,title,kind,collection_slug,sort_order")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return DEFAULT_HOME_SECTIONS;
  return data;
}

// Size chart edited in the admin panel (table "site_settings"). Falls back to the default in config.
export async function getSizeChart() {
  const client = db();
  if (!client) return SIZE_CHART;
  const { data, error } = await client
    .from("site_settings")
    .select("value")
    .eq("key", "size_chart")
    .maybeSingle();
  const v = data?.value;
  if (error || !v || !Array.isArray(v.sizes) || !Array.isArray(v.rows) || v.sizes.length === 0) {
    return SIZE_CHART;
  }
  return { title: SIZE_CHART.title, unit: v.unit || SIZE_CHART.unit, sizes: v.sizes, rows: v.rows };
}

// Best sellers of the last 14 days (needs the "website_trending" view).
// Falls back to the first products if the view does not exist yet.
export async function getTrendingSlugs() {
  const client = db();
  if (!client) return [];
  const { data, error } = await client
    .from("website_trending")
    .select("slug,rank")
    .order("rank", { ascending: true })
    .limit(12);
  if (error || !data) return [];
  return data.map((r) => r.slug);
}

// A collection together with all of its sub-collections.
export function collectionSlugs(collections, slug) {
  const slugs = new Set([slug]);
  for (const c of collections) {
    if (c.parent_slug === slug) slugs.add(c.slug);
  }
  return slugs;
}

export function productsInCollection(products, collections, slug) {
  const slugs = collectionSlugs(collections, slug);
  return products.filter((p) => slugs.has(p.collection_slug));
}
