import Link from "next/link";
import ProductCard from "@/components/ProductCard";

// One home page section: centred title, products, and a "View all" button under them.
export default function ProductSection({ title, products, href }) {
  if (!products || products.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="font-logo mb-6 text-center text-base uppercase tracking-[0.14em] sm:text-xl">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      {href && (
        <div className="mt-7 text-center">
          <Link
            href={href}
            className="inline-block border border-[#111] px-8 py-2.5 text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-[#111] hover:text-white"
          >
            View all
          </Link>
        </div>
      )}
    </section>
  );
}
