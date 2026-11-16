import Link from "next/link";
import { SITE } from "@/lib/config";
import {
  getCatalogue,
  getCollections,
  getHomeCover,
  getHomeSections,
  getHomeSlides,
  getReviews,
  getTrendingSlugs,
  productsInCollection,
} from "@/lib/catalogue";
import { isOnSale } from "@/lib/products";
import ProductSection from "@/components/ProductSection";
import ReviewsStrip from "@/components/ReviewsStrip";
import DemoNotice from "@/components/DemoNotice";
import HeroSlider from "@/components/HeroSlider";

export const revalidate = 60;

export default async function Home() {
  const [{ products, isDemo }, collections, sections, trendingSlugs, reviews, cover, slideshow] = await Promise.all([
    getCatalogue(),
    getCollections(),
    getHomeSections(),
    getTrendingSlugs(),
    getReviews(),
    getHomeCover(),
    getHomeSlides(),
  ]);
  // Slideshow photos: the ones chosen in the admin panel. Until the admin saves a slideshow,
  // the old single cover photo (if any) is followed by the photos of a few suits, so the page already moves.
  let slides = slideshow?.slides || [];
  let heroDark = slideshow?.dark ?? 0.3;
  if (!slideshow) {
    const suitPhotos = products
      .filter((p) => !p.sold_out && p.images?.[0])
      .slice(0, cover?.url ? 3 : 4)
      .map((p) => ({ url: p.images[0], x: 50, y: 30, title: "", link: `/products/${p.slug}` }));
    slides = [...(cover?.url ? [{ url: cover.url, x: cover.x, y: cover.y, title: "", link: "/collections" }] : []), ...suitPhotos];
    heroDark = Math.min(cover?.dark ?? 0.3, 0.45);
  }
  if (slides.length === 0) {
    const any = products.find((p) => p.images?.[0]);
    slides = [{ url: any?.images[0] || "", x: 50, y: 30, title: "", link: "/collections" }].filter((x) => x.url);
  }
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

      {slides.length > 0 ? (
        <HeroSlider slides={slides} dark={heroDark} siteName={SITE.name} tagline={SITE.tagline} />
      ) : (
        <section data-home-hero className="relative flex h-[86svh] min-h-[460px] flex-col items-center justify-center bg-stone-900 px-6 pt-16 text-center text-white sm:h-[92svh]">
          <h1 className="text-3xl sm:text-6xl">{SITE.name}</h1>
          <p className="mt-3 text-stone-100">{SITE.tagline}</p>
          <Link
            href="/collections"
            className="mt-8 inline-block border border-white px-8 py-3 text-[13px] uppercase tracking-[0.3em] hover:bg-white hover:text-[#111]"
          >
            Shop now
          </Link>
        </section>
      )}

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

      </section>

      <ReviewsStrip title="Customer feedback" reviews={reviews} />

      {sections.map((s) => (
        <ProductSection key={s.id} title={s.title} products={itemsFor(s)} href={hrefFor(s)} />
      ))}
    </>
  );
}
