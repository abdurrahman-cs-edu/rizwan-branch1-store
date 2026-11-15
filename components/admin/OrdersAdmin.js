"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPKR } from "@/lib/products";
import { waNumber } from "@/lib/adminHelpers";

const STATUS_LABEL = { new: "New", confirmed: "Confirmed", cancelled: "Cancelled" };
const STATUS_STYLE = {
  new: "bg-amber-100 text-amber-900",
  confirmed: "bg-green-100 text-green-900",
  cancelled: "bg-stone-200 text-stone-600",
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("new");
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("web_orders")
      .select("*, web_order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setError("Could not load orders.");
    else setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id, status) {
    const { error } = await supabase.from("web_orders").update({ status }).eq("id", id);
    if (error) {
      setError("Could not update the order.");
      return;
    }
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const count = (s) => orders.filter((o) => o.status === s).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {["new", "confirmed", "cancelled", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={"rounded-full px-4 py-1.5 " + (filter === s ? "bg-stone-800 text-white" : "border border-stone-300")}
          >
            {s === "all" ? "All" : STATUS_LABEL[s]} {s !== "all" && `(${count(s)})`}
          </button>
        ))}
        <button onClick={load} className="ml-auto underline">Refresh</button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-stone-500">Loading…</p>}
      {!loading && shown.length === 0 && <p className="py-8 text-center text-stone-500">No orders here.</p>}

      <div className="space-y-3">
        {shown.map((o) => (
          <div key={o.id} className="rounded-lg border border-stone-200">
            <button
              onClick={() => setOpen(open === o.id ? null : o.id)}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm"
            >
              <span className="font-semibold">{o.order_number}</span>
              <span>{o.customer_name}</span>
              <span className="text-stone-500">{o.city}</span>
              <span className="text-stone-500">{o.payment_method === "advance" ? "Advance" : "COD"}</span>
              <span className="ml-auto font-semibold">{formatPKR(o.total)}</span>
              <span className={"rounded px-2 py-0.5 text-xs " + STATUS_STYLE[o.status]}>{STATUS_LABEL[o.status]}</span>
            </button>

            {open === o.id && (
              <div className="space-y-3 border-t border-stone-200 px-4 py-3 text-sm">
                <p className="text-stone-500">
                  {new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}
                </p>
                <p>
                  <b>Phone:</b> {o.phone} ·{" "}
                  <a
                    className="underline"
                    href={`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(
                      `Hello ${o.customer_name}, this is Rizwan Clothing about your order ${o.order_number}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </p>
                <p><b>Address:</b> {o.address}, {o.city}</p>
                {o.notes && <p><b>Note:</b> {o.notes}</p>}
                <ul className="list-inside list-disc">
                  {(o.web_order_items || []).map((it) => (
                    <li key={it.id}>
                      {it.name} ({it.size}) × {it.qty} = {formatPKR(it.unit_price * it.qty)}
                    </li>
                  ))}
                </ul>
                <p>
                  Subtotal {formatPKR(o.subtotal)}
                  {o.discount > 0 && ` · Prepaid discount − ${formatPKR(o.discount)}`} ·{" "}
                  <b>Total {formatPKR(o.total)}</b>
                </p>
                <div className="flex gap-2">
                  {o.status !== "confirmed" && (
                    <button onClick={() => setStatus(o.id, "confirmed")} className="rounded bg-green-600 px-3 py-1.5 text-white">
                      Confirm
                    </button>
                  )}
                  {o.status !== "cancelled" && (
                    <button onClick={() => setStatus(o.id, "cancelled")} className="rounded border border-stone-300 px-3 py-1.5">
                      Cancel
                    </button>
                  )}
                  {o.status !== "new" && (
                    <button onClick={() => setStatus(o.id, "new")} className="rounded border border-stone-300 px-3 py-1.5">
                      Mark as new
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
