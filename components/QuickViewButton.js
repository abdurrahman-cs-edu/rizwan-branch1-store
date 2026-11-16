"use client";

import { useQuickView } from "@/components/QuickView";

// "Quick view" on a suit card: a dark bar that slides up over the photo (mouse),
// or a small round eye button in the corner (phones and tablets).
export default function QuickViewButton({ product }) {
  const { openQuick } = useQuickView();

  return (
    <button
      type="button"
      className="qv-btn"
      aria-label={`Quick view: ${product.name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuick(product);
      }}
    >
      <span className="qv-text">Quick view</span>
      <svg className="qv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}
