import Link from "next/link";
import { SITE } from "@/lib/config";
import {
  getCatalogue,
  getCollections,
  getHomeSections,
  getReviews,
  getTrendingSlugs,
  productsInCollection,
} from "@/lib/catalogue";
import { isOnSale } from "@/lib/products";
import ProductSection from "@/components/ProductSection";
import ReviewsStrip from "@/components/ReviewsStrip";
import DemoNotice from "@/components/DemoNotice";

export const revalidate = 60;

export default async function Home() {
  const [{ products, isDemo }, collections, sections, trendingSlugs, reviews] = await Promise.all([
    getCatalogue(),
    getCollections(),
    getHomeSections(),
    getTrendingSlugs(),
    getReviews(),
  ]);
  // The "On sale" shortcut and filter only appear while at least one suit is on sale.
  const saleOn = products.some((p) => isOnSale(p) && !p.sold_out);

  const available = products.filter((p) => !p.sold_out);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const newest = [...products]
    .sort((a, b) => new Date(b.website_added_at) - new Date(a.website_added_at))
    .filter((p) => p.is_new)
    .slice(0, 8);

  function itemsFor(section) {
    switch (section.kind) {
      case "trending": {
        const fromSales = trendingSlugs.map((s) => bySlug.get(s)).filter(Boolean).slice(0, 8);
        return fromSales.length > 0 ? fromSales : available.slice(0, 8);
      }
      case "new":
        return newest.length > 0 ? newest : products.slice(0, 8);
      case "sale":
        return products.filter(isOnSale).slice(0, 8);
      case "collection":
        return productsInCollection(products, collections, section.collection_slug).slice(0, 8);
      default:
        return [];
    }
  }

  function hrefFor(section) {
    if (section.kind === "collection") return `/collections/${section.collection_slug}`;
    if (section.kind === "sale") return "/collections?avail=sale";
    if (section.kind === "new") return "/collections?sort=newest";
    return "/collections";
  }

  const topCollections = collections.filter((c) => !c.parent_slug);

  return (
    <>
      <DemoNotice show={isDemo} />

      <section className="bg-stone-100 px-4 py-14 text-center">
        <h1 className="text-3xl sm:text-5xl">{SITE.name}</h1>
        <p className="mt-3 text-stone-600">{SITE.tagline}</p>
        <Link
          href="/collections"
          className="mt-6 inline-block bg-[#111] px-8 py-3 text-[13px] font-bold uppercase tracking-[0.3em] text-white hover:opacity-85"
        >
          Shop all collections
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-2 pt-8">
        <div className="flex flex-wrap justify-center gap-3">
          {topCollections.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="rounded-full border border-stone-300 px-5 py-2 text-sm hover:bg-stone-100"
            >
              {c.name}
            </Link>
          ))}
          {saleOn && (
            <Link href="/collections?avail=sale" className="sale-tag !px-5 !py-2 !text-sm">
              ✦ Sale
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-stone-600">
          <span className="uppercase tracking-[0.15em]">Sort suits:</span>
          <Link href="/collections?sort=price-asc" className="underline">Price, low to high</Link>
          <Link href="/collections?sort=price-desc" className="underline">Price, high to low</Link>
          <Link href="/collections?sort=newest" className="underline">New to old</Link>
          {saleOn && <Link href="/collections?avail=sale" className="font-semibold text-red-600 underline">On sale</Link>}
        </div>
      </section>

      <ReviewsStrip title="Customer feedback" reviews={reviews} />

      {sections.map((s) => (
        <ProductSection key={s.id} title={s.title} products={itemsFor(s)} href={hrefFor(s)} />
      ))}
    </>
  );
}
