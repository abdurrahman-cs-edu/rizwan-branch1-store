import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-stone-600">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-6 inline-block rounded bg-[var(--brand)] px-6 py-3 text-[var(--brand-contrast)]">
        Back to home
      </Link>
    </div>
  );
}
