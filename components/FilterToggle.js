"use client";

import { useState } from "react";
import Link from "next/link";

// A "Filter" button. The filters (show, price, sort) only appear after it is pressed.
export default function FilterToggle({ activeCount = 0, total = 0, resetHref, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={
            "inline-flex items-center gap-2 border border-[#111] px-5 py-2 text-[13px] uppercase tracking-[0.2em] " +
            (open ? "bg-[#111] text-white" : "bg-white hover:bg-[#111] hover:text-white")
          }
        >
          <span aria-hidden="true">☰</span>
          Filter{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
        {activeCount > 0 && resetHref && (
          <Link href={resetHref} className="text-xs underline">
            Reset
          </Link>
        )}
        <span className="ml-auto text-xs text-stone-500">{total} products</span>
      </div>

      {open && <div className="mt-3 border border-stone-200 bg-stone-50 p-4">{children}</div>}
    </div>
  );
}
