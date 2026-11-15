"use client";

import { useState } from "react";

// "Share" on phones (opens the share sheet), "Copy link" elsewhere.
export default function ShareButton({ title }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // The person closed the share sheet, or copying is not allowed: nothing to do.
    }
  }

  return (
    <button type="button" onClick={onShare} className="mt-4 text-sm text-stone-600 underline">
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
