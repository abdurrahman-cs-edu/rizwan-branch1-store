import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { PRODUCT_GRID, WIDE } from "@/lib/layout";
import FilterToggle from "@/components/FilterToggle";
import { effectivePrice, isOnSale } from "@/lib/products";

const STEP = 12;

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "name-asc", label: "Alphabetically, A-Z" },
  { value: "name-desc", label: "Alphabetically, Z-A" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "oldest", label: "Date, old to new" },
  { value: "newest", label: "Date, new to old" },
];

function sortProducts(list, sort) {
  const copy = [...list];
  const added = (p) => new Date(p.website_added_at).getTime() || 0;
  if (sort === "price-asc") copy.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  else if (sort === "price-desc") copy.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  else if (sort === "name-asc") copy.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "name-desc") copy.sort((a, b) => b.name.localeCompare(a.name));
  else if (sort === "newest") copy.sort((a, b) => added(b) - added(a));
  else if (sort === "oldest") copy.sort((a, b) => added(a) - added(b));
  return copy; // "featured" keeps the order from the database
}

function toNumber(value) {
  const n = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Product grid with filters (availability, price range, sort) and a "View more" button.
// Filters are a plain GET form, so no JavaScript is needed.
export default function CollectionView({ products, searchParams = {}, basePath, extraHidden = {} }) {
  const sort = SORTS.some((s) => s.value === searchParams.sort) ? searchParams.sort : "featured";
  // "On sale" only exists as a choice while at least one suit is on sale.
  const saleOn = products.some((p) => isOnSale(p) && !p.sold_out);
  const availParam = searchParams.avail || "all";
  const avail = availParam === "sale" && !saleOn ? "all" : availParam;
  const minPrice = toNumber(searchParams.min);
  const maxPrice = toNumber(searchParams.max);
  const limit = Math.min(Math.max(parseInt(searchParams.limit, 10) || STEP, STEP), 120);

  let list = products;
  if (avail === "in") list = list.filter((p) => !p.sold_out);
  if (avail === "sale") list = list.filter((p) => isOnSale(p) && !p.sold_out);
  if (minPrice !== null) list = list.filter((p) => effectivePrice(p) >= minPrice);
  if (maxPrice !== null) list = list.filter((p) => effectivePrice(p) <= maxPrice);
  list = sortProducts(list, sort);
  const shown = list.slice(0, limit);

  const highest = Math.max(0, ...products.map((p) => effectivePrice(p)));

  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({
    ...extraHidden,
    sort,
    avail,
    min: minPrice ? String(minPrice) : "",
    max: maxPrice ? String(maxPrice) : "",
  })) {
    if (v) next.set(k, v);
  }
  next.set("limit", String(limit + STEP));

  const field = "rounded border border-stone-300 bg-white px-2 py-1.5";
  const activeCount = [avail !== "all", Boolean(minPrice || maxPrice), sort !== "featured"].filter(Boolean).length;
  const resetHref = `${basePath}${Object.keys(extraHidden).length ? "?" + new URLSearchParams(extraHidden).toString() : ""}`;

  return (
    <div className={`${WIDE} py-6`}>
      <FilterToggle activeCount={activeCount} total={list.length} resetHref={resetHref}>
      <form action={basePath} className="flex flex-wrap items-end gap-3 text-sm">
        {Object.entries(extraHidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-stone-500">Show</span>
          <select name="avail" defaultValue={avail} className={field}>
            <option value="all">All</option>
            <option value="in">In stock</option>
            {saleOn && <option value="sale">On sale</option>}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-stone-500">
            Price (PKR){highest > 0 ? `, highest is ${highest.toLocaleString("en-PK")}` : ""}
          </span>
          <div className="flex items-center gap-2">
            <input
              name="min"
              inputMode="numeric"
              placeholder="From"
              defaultValue={minPrice || ""}
              className={`${field} w-24`}
              aria-label="Lowest price"
            />
            <span className="text-stone-400">to</span>
            <input
              name="max"
              inputMode="numeric"
              placeholder="To"
              defaultValue={maxPrice || ""}
              className={`${field} w-24`}
              aria-label="Highest price"
            />
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-stone-500">Sort by</span>
          <select name="sort" defaultValue={sort} className={field}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button className="press bg-[#111] px-5 py-1.5 text-[13px] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85">Apply</button>
      </form>
      </FilterToggle>

      {shown.length === 0 ? (
        <p className="py-12 text-center text-stone-500">No products found.</p>
      ) : (
        <div className={PRODUCT_GRID}>
          {shown.map((p, i) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
        </div>
      )}

      {list.length > shown.length && (
        <div className="mt-8 text-center">
          <Link
            href={`${basePath}?${next.toString()}`}
            className="press inline-block rounded border border-stone-400 px-6 py-2 text-sm transition-colors duration-300 hover:bg-stone-100"
          >
            View more
          </Link>
        </div>
      )}
    </div>
  );
}
