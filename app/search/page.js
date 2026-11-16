import { getCatalogue } from "@/lib/catalogue";
import { productCollectionSlugs } from "@/lib/products";
import CollectionView from "@/components/CollectionView";
import { WIDE } from "@/lib/layout";

export const metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = String(sp.q || "").trim();
  const { products } = await getCatalogue();

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = words.length
    ? products.filter((p) => {
        const hay = `${p.name} ${p.fabric || ""} ${productCollectionSlugs(p).join(" ")}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
    : [];

  return (
    <>
      <div className={`${WIDE} pt-8`}>
        <h1 className="text-2xl font-bold">Search</h1>
        <form action="/search" className="mt-3 flex max-w-md gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search suits"
            className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <button className="rounded bg-[var(--brand)] px-4 py-2 text-sm text-[var(--brand-contrast)]">
            Search
          </button>
        </form>
        {q && <p className="mt-3 text-sm text-stone-600">{results.length} results for “{q}”</p>}
      </div>
      {q && <CollectionView products={results} searchParams={sp} basePath="/search" extraHidden={{ q }} />}
    </>
  );
}
