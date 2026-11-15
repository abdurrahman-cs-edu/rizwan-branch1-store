"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import AdvancePaymentInfo from "@/components/AdvancePaymentInfo";
import { supabase } from "@/lib/supabase";
import { CITIES, PREPAID_DISCOUNT_PERCENT, SHIPPING_FEE } from "@/lib/config";
import { formatPKR, normalizePhone } from "@/lib/products";

// Rounded input with a floating label (like the rizwanclothing.com checkout).
function Field({ id, label, error, multiline = false, ...props }) {
  const base =
    "peer w-full rounded-lg border bg-white px-3 pb-1.5 pt-6 text-[16px] text-stone-900 outline-none transition " +
    "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 " +
    (error ? "border-red-500" : "border-stone-300");
  const labelBase =
    "pointer-events-none absolute left-3 text-[16px] text-stone-500 transition-all duration-150 " +
    (multiline ? "top-4 " : "top-1/2 -translate-y-1/2 ") +
    "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs " +
    "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs";

  return (
    <div>
      <div className="relative">
        {multiline ? (
          <textarea id={id} rows={2} placeholder=" " className={base + " resize-none"} {...props} />
        ) : (
          <input id={id} placeholder=" " className={base} {...props} />
        )}
        <label htmlFor={id} className={labelBase}>
          {label}
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Radio({ checked }) {
  return (
    <span
      className={
        "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition " +
        (checked ? "border-[var(--accent)] bg-[var(--accent)]" : "border-stone-400 bg-white")
      }
    >
      {checked && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
  );
}

function PaymentOption({ id, checked, onSelect, title, badge, children }) {
  return (
    <div
      className={
        "relative rounded-lg " +
        (checked ? "z-10 bg-[var(--accent-soft)] ring-2 ring-inset ring-[var(--accent)]" : "bg-white")
      }
    >
      <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--accent)]">
        <input
          id={id}
          type="radio"
          name="payment"
          checked={checked}
          onChange={onSelect}
          className="peer sr-only"
        />
        <Radio checked={checked} />
        <span className="flex-1 text-[15px] font-medium text-stone-900">{title}</span>
        {badge && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">{badge}</span>
        )}
      </label>
      {checked && children && (
        <div className="rounded-b-lg border-t border-stone-200 bg-stone-100 px-4 py-4 text-sm text-stone-700">
          {children}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, ready, clear } = useCart();

  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", notes: "" });
  const [payment, setPayment] = useState("cod");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const discount = payment === "advance" ? Math.round((subtotal * PREPAID_DISCOUNT_PERCENT) / 100) : 0;
  const total = subtotal - discount + SHIPPING_FEE;

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const e = {};
    if (!normalizePhone(form.phone)) e.phone = "Enter a valid mobile number, like 0300 1234567.";
    if (form.name.trim().length < 2) e.name = "Please enter your full name.";
    if (form.address.trim().length < 10) e.address = "Please enter your full address.";
    if (form.city.trim().length < 2) e.city = "Please enter your city.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) {
      setTimeout(() => {
        document.querySelector("[data-first-error]")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
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
          shipping: data.shipping ?? SHIPPING_FEE,
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

  const firstError = Object.keys(errors)[0];
  const err = (key) => ({ error: errors[key], "data-first-error": firstError === key ? "" : undefined });

  const summary = (
    <div className="text-sm">
      <ul className="space-y-4">
        {items.map((l) => (
          <li key={`${l.slug}-${l.size}`} className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-lg border border-stone-200 bg-white">
                {l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}
              </div>
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-stone-800 px-1 text-xs font-medium text-white">
                {l.qty}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-medium text-stone-900">{l.name}</p>
              <p className="text-xs text-stone-500">{l.size}</p>
            </div>
            <span className="text-stone-900">{formatPKR(l.price * l.qty)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPKR(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Prepaid discount ({PREPAID_DISCOUNT_PERCENT}%)</span>
            <span>− {formatPKR(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatPKR(SHIPPING_FEE)}</span>
        </div>
        <div className="flex items-baseline justify-between pt-2 text-lg font-semibold text-stone-900">
          <span>Total</span>
          <span>
            <span className="mr-2 text-xs font-normal text-stone-500">PKR</span>
            {formatPKR(total)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-stone-500">
        The final price is checked again by our system when you place the order.
      </p>
    </div>
  );

  const h2 = "mb-3 text-xl font-semibold text-stone-900";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:grid md:grid-cols-[minmax(0,1fr)_380px] md:gap-10 md:py-10">
      {/* Phones: collapsible summary on top */}
      <details className="mb-6 rounded-xl bg-stone-100 md:hidden">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-[var(--accent)]">
          <span>Show order summary</span>
          <span className="text-stone-900">{formatPKR(total)}</span>
        </summary>
        <div className="px-4 pb-4">{summary}</div>
      </details>

      <form onSubmit={onSubmit} className="space-y-8" noValidate>
        <section>
          <h2 className={h2}>Contact</h2>
          <Field
            id="phone"
            label="Mobile number (WhatsApp preferred)"
            value={form.phone}
            onChange={set("phone")}
            inputMode="tel"
            autoComplete="tel"
            {...err("phone")}
          />
        </section>

        <section>
          <h2 className={h2}>Delivery</h2>
          <div className="space-y-3">
            <Field id="name" label="Full name" value={form.name} onChange={set("name")} autoComplete="name" {...err("name")} />
            <Field
              id="address"
              label="Full address"
              multiline
              value={form.address}
              onChange={set("address")}
              autoComplete="street-address"
              {...err("address")}
            />
            <Field
              id="city"
              label="City"
              list="city-list"
              value={form.city}
              onChange={set("city")}
              autoComplete="address-level2"
              {...err("city")}
            />
            <datalist id="city-list">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <Field
              id="notes"
              label="Order special instructions (optional)"
              value={form.notes}
              onChange={set("notes")}
              maxLength={300}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">Payment</h2>
          <p className="mb-3 mt-1 text-sm text-stone-500">Choose how you would like to pay.</p>

          <div className="space-y-px overflow-hidden rounded-lg border border-stone-300 bg-stone-300">
            <PaymentOption
              id="pay-cod"
              checked={payment === "cod"}
              onSelect={() => setPayment("cod")}
              title="Cash on Delivery (COD)"
            >
              <p className="text-center">Pay in cash when your parcel arrives.</p>
            </PaymentOption>
            <PaymentOption
              id="pay-advance"
              checked={payment === "advance"}
              onSelect={() => setPayment("advance")}
              title="Advance payment (Bank, JazzCash, Easypaisa)"
              badge={`${PREPAID_DISCOUNT_PERCENT}% off`}
            >
              <AdvancePaymentInfo />
            </PaymentOption>
          </div>
        </section>

        {serverError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}

        <div>
          <button
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--accent)] py-4 text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Placing order…" : "Complete order"}
          </button>
          <p className="mt-3 text-center text-xs text-stone-500">
            By placing your order you agree to our{" "}
            <Link href="/policies/terms" className="underline">Terms of Service</Link> and{" "}
            <Link href="/policies/refund" className="underline">Refund Policy</Link>. Your order is confirmed
            once our team contacts you on WhatsApp.
          </p>
        </div>
      </form>

      {/* Desktop: grey summary panel */}
      <aside className="hidden md:block">
        <div className="sticky top-24 rounded-xl bg-stone-100 p-6">{summary}</div>
      </aside>
    </div>
  );
}
