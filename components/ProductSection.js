import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { PRODUCT_GRID, WIDE } from "@/lib/layout";

// One home page section: centred title, products, and a "View all" button under them.
export default function ProductSection({ title, products, href }) {
  if (!products || products.length === 0) return null;
  return (
    <section className={`${WIDE} py-8 sm:py-10`}>
      <Reveal as="h2" className="font-logo mb-6 text-center text-base uppercase tracking-[0.14em] sm:mb-8 sm:text-xl">{title}</Reveal>
      <div className={PRODUCT_GRID}>
        {products.map((p, i) => (
          <ProductCard key={p.id} p={p} index={i} />
        ))}
      </div>
      {href && (
        <div className="mt-7 text-center">
          <Link
            href={href}
            className="press inline-block border border-[#111] px-8 py-2.5 text-[12px] font-bold uppercase tracking-[0.3em] transition-colors duration-300 hover:bg-[#111] hover:text-white"
          >
            View all
          </Link>
        </div>
      )}
    </section>
  );
}
