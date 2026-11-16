// Edge Function: create-web-order
// Validates a website order and saves it. Prices ALWAYS come from the
// database (website_catalogue), never from the browser.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// Supabase inside Edge Functions. You never copy or paste the service key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PREPAID_DISCOUNT_PERCENT = 5;
const SIZES = ["S", "M", "L", "XL", "XXL"];
const MAX_ORDERS_PER_PHONE_10MIN = 3;
const MAX_ORDERS_PER_IP_HOUR = 10;
const SHIPPING_FEE = 300; // flat delivery charge per order (PKR), added on the server

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(input: unknown): string | null {
  let d = String(input ?? "").replace(/[^\d+]/g, "");
  if (d.startsWith("+92")) d = "0" + d.slice(3);
  else if (d.startsWith("0092")) d = "0" + d.slice(4);
  else if (d.startsWith("92") && d.length === 12) d = "0" + d.slice(2);
  return /^03\d{9}$/.test(d) ? d : null;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // ---------- Validate ----------
  const name = String(body.name ?? "").trim();
  const phone = normalizePhone(body.phone);
  const address = String(body.address ?? "").trim();
  const city = String(body.city ?? "").trim();
  const notes = String(body.notes ?? "").trim().slice(0, 300);
  const payment = body.payment_method;
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (name.length < 2 || name.length > 80) return json({ error: "Please enter your full name." }, 400);
  if (!phone) return json({ error: "Please enter a valid mobile number, like 0300 1234567." }, 400);
  if (address.length < 10 || address.length > 300) return json({ error: "Please enter your full address." }, 400);
  if (city.length < 2 || city.length > 60) return json({ error: "Please enter your city." }, 400);
  if (payment !== "cod" && payment !== "advance") return json({ error: "Please choose a payment method." }, 400);
  if (rawItems.length < 1 || rawItems.length > 20) return json({ error: "Your cart is empty." }, 400);

  const items: { slug: string; size: string; qty: number }[] = [];
  for (const it of rawItems) {
    const slug = String(it?.slug ?? "");
    const size = String(it?.size ?? "");
    const qty = Number(it?.qty);
    if (!slug || slug.length > 120) return json({ error: "Invalid item in cart." }, 400);
    if (!SIZES.includes(size)) return json({ error: "Invalid size in cart." }, 400);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return json({ error: "Invalid quantity in cart." }, 400);
    items.push({ slug, size, qty });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // ---------- Rate limit (per phone and per IP) ----------
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const ipHash = await sha256(ip);
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [byPhone, byIp] = await Promise.all([
    supabase.from("web_orders").select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", tenMinAgo),
    supabase.from("web_orders").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", hourAgo),
  ]);
  if ((byPhone.count ?? 0) >= MAX_ORDERS_PER_PHONE_10MIN || (byIp.count ?? 0) >= MAX_ORDERS_PER_IP_HOUR) {
    return json({ error: "Too many orders. Please wait a few minutes and try again." }, 429);
  }

  // ---------- Prices from the database ----------
  const slugs = [...new Set(items.map((i) => i.slug))];
  const { data: designs, error: designsError } = await supabase
    .from("website_catalogue")
    .select("id, slug, name, price, sale_price, sold_out")
    .in("slug", slugs);

  if (designsError || !designs) return json({ error: "Could not check prices. Please try again." }, 500);

  const bySlug = new Map(designs.map((d: any) => [d.slug, d]));
  let subtotal = 0;
  const lines = [];
  for (const it of items) {
    const d: any = bySlug.get(it.slug);
    if (!d) return json({ error: "One of the items is no longer available." }, 400);
    if (d.sold_out) return json({ error: `${d.name} is sold out.` }, 400);
    const price = Number(d.sale_price) > 0 && Number(d.sale_price) < Number(d.price)
      ? Number(d.sale_price)
      : Number(d.price);
    subtotal += price * it.qty;
    lines.push({
      design_id: String(d.id),
      slug: d.slug,
      name: d.name,
      size: it.size,
      qty: it.qty,
      unit_price: price,
    });
  }

  const discount = payment === "advance" ? Math.round((subtotal * PREPAID_DISCOUNT_PERCENT) / 100) : 0;
  const shipping = SHIPPING_FEE;
  const total = subtotal - discount + shipping;

  // ---------- Save ----------
  const { data: order, error: orderError } = await supabase
    .from("web_orders")
    .insert({
      customer_name: name,
      phone,
      address,
      city,
      notes: notes || null,
      payment_method: payment,
      subtotal,
      discount,
      shipping,
      total,
      ip_hash: ipHash,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) return json({ error: "Could not save your order. Please try again." }, 500);

  const { error: itemsError } = await supabase
    .from("web_order_items")
    .insert(lines.map((l) => ({ ...l, order_id: order.id })));

  if (itemsError) {
    // Do not leave an order without items
    await supabase.from("web_orders").delete().eq("id", order.id);
    // The database refuses an item when there is not enough stock in that size: OUT_OF_STOCK|name|size|left
    const m = /OUT_OF_STOCK\|([^|]*)\|([^|]*)\|(\d+)/.exec(itemsError.message ?? "");
    if (m) {
      const left = Number(m[3]);
      return json({
        error: left > 0
          ? `Sorry, only ${left} left in size ${m[2]} for ${m[1]}. Please reduce the quantity.`
          : `Sorry, size ${m[2]} of ${m[1]} is sold out. Please choose another size.`,
      }, 409);
    }
    return json({ error: "Could not save your order. Please try again." }, 500);
  }

  return json({
    order_number: order.order_number,
    subtotal,
    discount,
    shipping,
    total,
    payment_method: payment,
  });
});
