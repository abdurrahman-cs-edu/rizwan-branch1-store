import { SITE } from "@/lib/config";

export function formatPKR(n) {
  const num = Number(n) || 0;
  return "Rs. " + num.toLocaleString("en-US");
}

export function isOnSale(p) {
  return Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price);
}

export function effectivePrice(p) {
  return isOnSale(p) ? Number(p.sale_price) : Number(p.price);
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
