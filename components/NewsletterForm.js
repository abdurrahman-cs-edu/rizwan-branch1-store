"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MailIcon } from "@/components/Icons";

// E-mail box with a line under it and an envelope button (like logoofficial.com).
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
    <form onSubmit={onSubmit} className="max-w-[270px]">
      <div className="flex items-center border-b-2 border-black">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="Enter your email"
          className="h-10 w-full bg-transparent text-[13.6px] text-black outline-none placeholder:text-black/70"
          aria-label="Email address"
        />
        <button
          disabled={state === "saving"}
          aria-label="Subscribe"
          className="press shrink-0 p-1 transition-opacity hover:opacity-60 disabled:opacity-40"
        >
          <MailIcon />
        </button>
      </div>
      <span className="sr-only" role="status">
        {state === "done" ? "Subscribed" : ""}
      </span>
      {state === "done" && <p className="fade-in mt-2 text-xs text-green-700">Thank you! You are subscribed.</p>}
      {state === "error" && <p className="fade-in mt-2 text-xs text-red-600">Please enter a valid email and try again.</p>}
    </form>
  );
}
