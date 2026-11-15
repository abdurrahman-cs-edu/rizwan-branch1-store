"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";
import { CITIES, PAYMENT_DETAILS, PREPAID_DISCOUNT_PERCENT } from "@/lib/config";
import { formatPKR, normalizePhone } from "@/lib/products";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, ready, clear } = useCart();

  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", notes: "" });
  const [payment, setPayment] = useState("cod");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const discount = payment === "advance" ? Math.round((subtotal * PREPAID_DISCOUNT_PERCENT) / 100) : 0;
  const total = subtotal - discount;

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Please enter your full name.";
    if (!normalizePhone(form.phone)) e.phone = "Enter a valid mobile number, like 0300 1234567.";
    if (form.address.trim().length < 10) e.address = "Please enter your full address.";
    if (form.city.trim().length < 2) e.city = "Please enter your city.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    if (!supabase) {
      setServerError("The shop is not connected to its database yet. Please try again later.");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      phone: normalizePhone(form.phone),
      address: form.address.trim(),
      city: form.city.trim(),
      notes: form.notes.trim(),
      payment_method: payment,
      // Only slug, size and quantity are sent. Prices are decided on the server.
      items: items.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty })),
    };

    const { data, error } = await supabase.functions.invoke("create-web-order", { body: payload });
    setSubmitting(false);

    if (error || !data || !data.order_number) {
      let msg = "Sorry, we could not place your order. Please try again.";
      try {
        const body = await error?.context?.json?.();
        if (body?.error) msg = body.error;
      } catch {}
      setServerError(msg);
      return;
    }

    try {
      sessionStorage.setItem(
        "rc_last_order",
        JSON.stringify({
          order_number: data.order_number,
          name: payload.name,
          phone: payload.phone,
          city: payload.city,
          payment_method: payment,
          subtotal: data.subtotal,
          discount: data.discount,
          total: data.total,
          items: items.map((l) => ({ name: l.name, size: l.size, qty: l.qty })),
        })
      );
    } catch {}
    clear();
    router.push(`/order/${data.order_number}`);
  }

  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-stone-500">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/collections" className="mt-6 inline-block rounded bg-[var(--brand)] px-6 py-3 text-[var(--brand-contrast)]">
          Continue shopping
        </Link>
      </div>
    );
  }

  const input = "w-full rounded border border-stone-300 px-3 py-2 text-sm";
  const hasAnyDetails =
    PAYMENT_DETAILS.bank.accountNumber || PAYMENT_DETAILS.bank.iban ||
    PAYMENT_DETAILS.jazzcash.number || PAYMENT_DETAILS.easypaisa.number;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-5">
      <form onSubmit={onSubmit} className="space-y-4 md:col-span-3" noValidate>
        <h1 className="text-2xl font-bold">Checkout</h1>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="name">Full name *</label>
          <input id="name" className={input} value={form.name} onChange={set("name")} autoComplete="name" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="phone">Phone (WhatsApp preferred) *</label>
          <input id="phone" className={input} value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="0300 1234567" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="address">Full address *</label>
          <textarea id="address" rows={3} className={input} value={form.address} onChange={set("address")} autoComplete="street-address" />
          {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="city">City *</label>
          <input id="city" list="city-list" className={input} value={form.city} onChange={set("city")} autoComplete="address-level2" />
          <datalist id="city-list">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="notes">Note (optional)</label>
          <input id="notes" className={input} value={form.notes} onChange={set("notes")} maxLength={300} />
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Payment</legend>
          <label className="flex cursor-pointer items-start gap-2 rounded border border-stone-300 p-3 text-sm">
            <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} className="mt-1" />
            <span>
              <span className="font-medium">Cash on Delivery</span>
              <span className="block text-stone-500">Pay when your parcel arrives.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded border border-stone-300 p-3 text-sm">
            <input type="radio" name="payment" checked={payment === "advance"} onChange={() => setPayment("advance")} className="mt-1" />
            <span>
              <span className="font-medium">Advance payment ({PREPAID_DISCOUNT_PERCENT}% off)</span>
              <span className="block text-stone-500">Pay by bank transfer, JazzCash or Easypaisa.</span>
            </span>
          </label>

          {payment === "advance" && (
            <div className="rounded bg-stone-50 p-3 text-sm">
              {hasAnyDetails ? (
                <div className="space-y-2">
                  {(PAYMENT_DETAILS.bank.accountNumber || PAYMENT_DETAILS.bank.iban) && (
                    <p>
                      <b>Bank:</b> {PAYMENT_DETAILS.bank.title} {PAYMENT_DETAILS.bank.accountTitle}{" "}
                      {PAYMENT_DETAILS.bank.accountNumber} {PAYMENT_DETAILS.bank.iban}
                    </p>
                  )}
                  {PAYMENT_DETAILS.jazzcash.number && (
                    <p><b>JazzCash:</b> {PAYMENT_DETAILS.jazzcash.accountTitle} {PAYMENT_DETAILS.jazzcash.number}</p>
                  )}
                  {PAYMENT_DETAILS.easypaisa.number && (
                    <p><b>Easypaisa:</b> {PAYMENT_DETAILS.easypaisa.accountTitle} {PAYMENT_DETAILS.easypaisa.number}</p>
                  )}
                </div>
              ) : (
                <p>Our payment account details will be shown on your order confirmation page.</p>
              )}
              <p className="mt-2 text-stone-600">
                After placing the order, send your payment screenshot on WhatsApp with your order number.
              </p>
            </div>
          )}
        </fieldset>

        {serverError && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}

        <button
          disabled={submitting}
          className="w-full rounded bg-[var(--brand)] py-3 text-[var(--brand-contrast)] disabled:opacity-60"
        >
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </form>

      <aside className="md:col-span-2">
        <div className="sticky top-20 rounded-lg bg-stone-50 p-4 text-sm">
          <h2 className="mb-3 font-semibold">Order summary</h2>
          <ul className="space-y-2">
            {items.map((l) => (
              <li key={`${l.slug}-${l.size}`} className="flex justify-between gap-2">
                <span>{l.name} ({l.size}) × {l.qty}</span>
                <span>{formatPKR(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-stone-200 pt-3">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Prepaid discount</span><span>− {formatPKR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span><span>{formatPKR(total)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Delivery charges, if any, will be confirmed by our team on WhatsApp. The final price is checked
            again when you place the order.
          </p>
        </div>
      </aside>
    </div>
  );
}
