import Link from "next/link";
import ProductCard from "@/components/ProductCard";

export default function ProductSection({ title, products, href }) {
  if (!products || products.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl uppercase tracking-[0.12em] sm:text-2xl">{title}</h2>
        {href && (
          <Link href={href} className="text-sm underline">
            View all
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
