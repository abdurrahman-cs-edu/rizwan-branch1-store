"use client";

// Friendly page when something breaks while a page is loading (instead of a blank error screen).
export default function Error({ reset }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone-600">Sorry, this page could not load. Please try again.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded bg-[var(--brand)] px-6 py-3 text-[var(--brand-contrast)]"
        >
          Try again
        </button>
        <a href="/" className="rounded border border-stone-300 px-6 py-3">
          Back to home
        </a>
      </div>
    </div>
  );
}
