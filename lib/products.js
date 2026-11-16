import { SITE } from "@/lib/config";

export function formatPKR(n) {
  const num = Number(n) || 0;
  return "Rs. " + num.toLocaleString("en-US");
}

export function isOnSale(p) {
  return Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price);
}

// Whole-number percent off (from the database, or worked out from the two prices)
export function salePercent(p) {
  if (!isOnSale(p)) return 0;
  const fromDb = Number(p.sale_percent);
  if (fromDb > 0) return fromDb;
  return Math.max(1, Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100));
}

export function effectivePrice(p) {
  return isOnSale(p) ? Number(p.sale_price) : Number(p.price);
}

// Every collection / season a suit shows in. Newer suits have the list "collection_slugs";
// older rows (and demo products) only have the single "collection_slug".
export function productCollectionSlugs(p) {
  if (Array.isArray(p.collection_slugs) && p.collection_slugs.length > 0) return p.collection_slugs;
  return p.collection_slug ? [p.collection_slug] : [];
}

export function waLink(text) {
  if (!SITE.whatsapp) return null;
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

// Pakistani mobile: 03XXXXXXXXX. Accepts +92 / 92 / 0 prefixes.
export function normalizePhone(input) {
  let d = String(input || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+92")) d = "0" + d.slice(3);
  else if (d.startsWith("0092")) d = "0" + d.slice(4);
  else if (d.startsWith("92") && d.length === 12) d = "0" + d.slice(2);
  return /^03\d{9}$/.test(d) ? d : null;
}
