"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OrdersAdmin from "@/components/admin/OrdersAdmin";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import SectionsAdmin from "@/components/admin/SectionsAdmin";
import SizeChartAdmin from "@/components/admin/SizeChartAdmin";
import ReviewsAdmin from "@/components/admin/ReviewsAdmin";
import HeroSlidesAdmin from "@/components/admin/HeroSlidesAdmin";

const TABS = [
  ["orders", "Orders"],
  ["products", "Products"],
  ["home", "Home & Collections"],
  ["reviews", "Feedback"],
  ["sizes", "Size Chart"],
];

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError("Wrong email or password.");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-16 max-w-sm space-y-3 rounded-lg border border-stone-200 p-6">
      <h1 className="text-xl font-bold">Admin log in</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="username"
        className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={busy}
        className="w-full rounded bg-[var(--brand)] py-2 text-[var(--brand-contrast)] disabled:opacity-60"
      >
        {busy ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    supabase.rpc("is_admin").then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [session]);

  if (!supabase) {
    return <p className="p-8 text-center">The database is not configured (check .env.local).</p>;
  }
  if (session === undefined) return <p className="p-8 text-center text-stone-500">Loading…</p>;
  if (!session) return <LoginForm />;
  if (isAdmin === null) return <p className="p-8 text-center text-stone-500">Checking access…</p>;

  if (!isAdmin) {
    return (
      <div className="mx-auto mt-16 max-w-sm space-y-3 p-4 text-center">
        <p className="font-medium">This account is not an admin.</p>
        <p className="text-sm text-stone-600">Signed in as {session.user.email}</p>
        <button onClick={() => supabase.auth.signOut()} className="rounded border border-stone-300 px-4 py-2 text-sm">
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-xl font-bold">Admin</h1>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              "rounded px-4 py-2 text-sm " +
              (tab === key ? "bg-[var(--brand)] text-[var(--brand-contrast)]" : "border border-stone-300")
            }
          >
            {label}
          </button>
        ))}
        <button onClick={() => supabase.auth.signOut()} className="ml-auto text-sm underline">
          Log out
        </button>
      </div>

      {tab === "orders" && <OrdersAdmin />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "home" && (
        <>
          <HeroSlidesAdmin />
          <SectionsAdmin />
        </>
      )}
      {tab === "reviews" && <ReviewsAdmin />}
      {tab === "sizes" && <SizeChartAdmin />}
    </div>
  );
}
