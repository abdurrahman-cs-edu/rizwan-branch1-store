import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { effectivePrice } from "@/lib/products";

const STEP = 12;

function sortProducts(list, sort) {
  const copy = [...list];
  if (sort === "price-asc") copy.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  else if (sort === "price-desc") copy.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  else if (sort === "newest")
    copy.sort((a, b) => new Date(b.website_added_at) - new Date(a.website_added_at));
  return copy; // "featured" keeps the order from the database
}

// Product grid with filters (sort + availability) and a "View more" button.
// Filters are a plain GET form, so no JavaScript is needed.
export default function CollectionView({ products, searchParams = {}, basePath, extraHidden = {} }) {
  const sort = searchParams.sort || "featured";
  const avail = searchParams.avail || "all";
  const limit = Math.min(Math.max(parseInt(searchParams.limit, 10) || STEP, STEP), 120);

  let list = products;
  if (avail === "in") list = list.filter((p) => !p.sold_out);
  list = sortProducts(list, sort);
  const shown = list.slice(0, limit);

  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...extraHidden, sort, avail })) {
    if (v) next.set(k, v);
  }
  next.set("limit", String(limit + STEP));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <form action={basePath} className="mb-6 flex flex-wrap items-end gap-3 text-sm">
        {Object.entries(extraHidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-stone-500">Availability</span>
          <select name="avail" defaultValue={avail} className="rounded border border-stone-300 px-2 py-1.5">
            <option value="all">All</option>
            <option value="in">In stock</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-stone-500">Sort by</span>
          <select name="sort" defaultValue={sort} className="rounded border border-stone-300 px-2 py-1.5">
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
        <button className="rounded bg-[var(--brand)] px-4 py-1.5 text-[var(--brand-contrast)]">Apply</button>
        <span className="ml-auto text-xs text-stone-500">{list.length} products</span>
      </form>

      {shown.length === 0 ? (
        <p className="py-12 text-center text-stone-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {list.length > shown.length && (
        <div className="mt-8 text-center">
          <Link
            href={`${basePath}?${next.toString()}`}
            className="inline-block rounded border border-stone-400 px-6 py-2 text-sm hover:bg-stone-100"
          >
            View more
          </Link>
        </div>
      )}
    </div>
  );
}
