// Server-side data loading. Reads only PUBLIC data (the safe catalogue view,
// collections and home sections). If the database tables do not exist yet,
// demo data is shown so the site still works in preview.

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_COLLECTIONS, DEFAULT_HOME_SECTIONS, SIZE_CHART } from "@/lib/config";
import { productCollectionSlugs } from "@/lib/products";
import { defaultAlerts, normalizeAnnouncements } from "@/lib/announcements";

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
    .select("slug,name,parent_slug,sort_order,image_url,in_menu")
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

// Home page cover photo chosen in the admin panel (site_settings key "home_cover").
// "dark" is how dark the layer over the photo is (0.2 to 0.85).
export async function getHomeCover() {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("site_settings").select("value").eq("key", "home_cover").maybeSingle();
  const v = data?.value;
  const dark = Number(v?.dark);
  return {
    url: typeof v?.url === "string" && v.url ? v.url : null,
    dark: dark >= 0.2 && dark <= 0.85 ? dark : 0.55,
    // Which part of the photo stays in view (percent from the left / top)
    x: typeof v?.x === "number" && v.x >= 0 && v.x <= 100 ? v.x : 50,
    y: typeof v?.y === "number" && v.y >= 0 && v.y <= 100 ? v.y : 30,
  };
}

// Home page slideshow chosen in the admin panel (site_settings key "home_slides").
// Returns null when the admin has never saved a slideshow (the home page then falls back
// to the old single cover photo and the suit photos). "dark" is the layer over the photos.
export async function getHomeSlides() {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("site_settings").select("value").eq("key", "home_slides").maybeSingle();
  const v = data?.value;
  if (!v || !Array.isArray(v.slides)) return null;
  const pct = (n, d) => (typeof n === "number" && n >= 0 && n <= 100 ? n : d);
  const slides = v.slides
    .filter((s) => s && typeof s.url === "string" && s.url)
    .slice(0, 8)
    .map((s) => ({
      url: s.url,
      x: pct(s.x, 50),
      y: pct(s.y, 30),
      title: typeof s.title === "string" ? s.title.trim().slice(0, 40) : "",
      link: typeof s.link === "string" && s.link.startsWith("/") ? s.link : "/collections",
    }));
  const dark = Number(v.dark);
  const seconds = Number(v.seconds);
  return {
    slides,
    dark: dark >= 0.1 && dark <= 0.85 ? dark : 0.3,
    // How many seconds each photo stays (2 to 8)
    seconds: seconds >= 2 && seconds <= 8 ? seconds : 3,
  };
}

// Customer feedback screenshots added in the admin panel (table "reviews").
// On a suit page: feedback tagged to that suit plus the general feedback.
export async function getReviews({ productSlug } = {}) {
  const client = db();
  if (!client) return [];
  let query = client
    .from("reviews")
    .select("id,image_url,caption,product_slug,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (productSlug && /^[a-z0-9-]+$/.test(productSlug)) {
    query = query.or(`product_slug.eq.${productSlug},product_slug.is.null`);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data;
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
  return products.filter((p) => productCollectionSlugs(p).some((s) => slugs.has(s)));
}

// The top menu: Home, then every main collection ticked "In menu" in the admin panel
// (each with the collections inside it as a dropdown and a "View all" link).
export function buildMenu(collections) {
  const main = collections.filter((c) => !c.parent_slug && c.in_menu);
  return [
    { label: "Home", href: "/", children: [] },
    ...main.map((c) => ({
      label: c.name,
      href: `/collections/${c.slug}`,
      children: collections
        .filter((x) => x.parent_slug === c.slug)
        .map((x) => ({ label: x.name, href: `/collections/${x.slug}` })),
    })),
  ];
}

// Announcement bars at the very top, edited in the admin panel (site_settings key "announcements").
// Nothing saved yet (or the database cannot be reached): the old fixed messages are shown.
// Saved with no bars at all: no bar is shown.
export async function getAnnouncements() {
  const client = db();
  if (!client) return defaultAlerts();
  const { data, error } = await client.from("site_settings").select("value").eq("key", "announcements").maybeSingle();
  if (error) return defaultAlerts();
  return normalizeAnnouncements(data?.value) ?? defaultAlerts();
}
