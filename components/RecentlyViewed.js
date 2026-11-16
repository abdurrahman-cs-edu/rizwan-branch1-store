"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductSection from "@/components/ProductSection";

const KEY = "rc_recent_v1";
const KEEP = 12; // how many suits are remembered
const SHOW = 4; // how many are shown (one row)

// "Recently viewed": the suits this visitor looked at before, newest first.
// The list lives only in this browser (nothing is sent anywhere); the suits are loaded again
// from the catalogue, so the prices and "Sold out" are always up to date.
export default function RecentlyViewed({ slug }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    let list = [];
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) list = saved.filter((s) => typeof s === "string");
    } catch {}

    // This suit becomes the newest one in the list
    try {
      localStorage.setItem(KEY, JSON.stringify([slug, ...list.filter((s) => s !== slug)].slice(0, KEEP)));
    } catch {}

    const others = list.filter((s) => s !== slug).slice(0, SHOW + 4);
    if (others.length === 0 || !supabase) {
      setProducts([]);
      return;
    }

    supabase
      .from("website_catalogue")
      .select("*")
      .in("slug", others)
      .then(({ data }) => {
        if (!alive || !data) return;
        const order = new Map(others.map((s, i) => [s, i]));
        setProducts([...data].sort((a, b) => order.get(a.slug) - order.get(b.slug)).slice(0, SHOW));
      });

    return () => {
      alive = false;
    };
  }, [slug]);

  if (products.length === 0) return null;
  return <ProductSection title="Recently viewed" products={products} />;
}
