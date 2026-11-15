"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/config";
import AdvancePaymentInfo from "@/components/AdvancePaymentInfo";
import { formatPKR, waLink } from "@/lib/products";

export default function OrderConfirmation() {
  const { number } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rc_last_order");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.order_number === number) setOrder(parsed);
      }
    } catch {}
  }, [number]);

  const advance = order?.payment_method === "advance";
  const paymentLink = waLink(
    `Hello ${SITE.name}, I have placed order ${number}. Here is my payment screenshot.`
  );
  const helpLink = waLink(`Hello ${SITE.name}, I have a question about my order ${number}.`);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <div className="text-5xl">✅</div>
      <h1 className="mt-3 text-2xl font-bold">Thank you for your order!</h1>
      <p className="mt-2 text-stone-600">Your order number is</p>
      <p className="mt-1 text-3xl font-bold tracking-wide">{number}</p>
      <p className="mt-4 text-sm">We will contact you on WhatsApp to confirm your order.</p>

      {order && (
        <div className="mt-6 rounded-lg bg-stone-50 p-4 text-left text-sm">
          <p className="mb-2 font-semibold">Order details</p>
          <ul className="space-y-1">
            {order.items.map((l, i) => (
              <li key={i}>{l.name} ({l.size}) × {l.qty}</li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-stone-200 pt-3">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Prepaid discount</span><span>− {formatPKR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPKR(order.total)}</span></div>
          </div>
          <p className="mt-3 text-stone-600">
            Deliver to: {order.name}, {order.city} ({order.phone})
          </p>
        </div>
      )}

      {advance && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-left text-sm">
          <p className="font-semibold">Next step: send your payment</p>
          <div className="mt-3">
            <AdvancePaymentInfo />
          </div>
          {paymentLink ? (
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-lg bg-green-600 py-3 text-center font-medium text-white"
            >
              Send payment screenshot on WhatsApp
            </a>
          ) : (
            <p className="mt-3 text-stone-600">
              Our team will message you on WhatsApp with the payment details. Please keep your order number ready.
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-2">
        {helpLink && (
          <a href={helpLink} target="_blank" rel="noopener noreferrer" className="text-sm underline">
            Questions? Chat with us on WhatsApp
          </a>
        )}
        <Link href="/collections" className="rounded bg-[var(--brand)] px-6 py-3 text-[var(--brand-contrast)]">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
