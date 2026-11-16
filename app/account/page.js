import Link from "next/link";

export const metadata = { title: "Log in", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Customer accounts</h1>
      <p className="mt-3 text-sm text-stone-600">
        Customer log in and order history are coming soon. You can place orders without an account.
      </p>
      <Link href="/collections" className="mt-6 inline-block rounded bg-[var(--brand)] px-6 py-3 text-[var(--brand-contrast)]">
        Continue shopping
      </Link>
    </div>
  );
}
