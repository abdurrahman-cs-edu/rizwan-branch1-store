"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | saving | done | error

  async function onSubmit(e) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setState("error");
      return;
    }
    if (!supabase) {
      setState("error");
      return;
    }
    setState("saving");
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: clean });
    // 23505 = already subscribed, which is fine for the customer
    if (error && error.code !== "23505") {
      setState("error");
      return;
    }
    setState("done");
    setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900"
        aria-label="Email address"
      />
      <button
        disabled={state === "saving"}
        className="rounded bg-[var(--brand)] px-4 py-2 text-sm text-[var(--brand-contrast)] disabled:opacity-60"
      >
        Subscribe
      </button>
      <span className="sr-only" role="status">
        {state === "done" ? "Subscribed" : ""}
      </span>
      {state === "done" && <span className="self-center text-xs text-green-700">Thank you!</span>}
      {state === "error" && <span className="self-center text-xs text-red-600">Please try again.</span>}
    </form>
  );
}
