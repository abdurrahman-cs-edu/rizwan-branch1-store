import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getReviews, getSizeChart } from "@/lib/catalogue";
import { effectivePrice, formatPKR, isOnSale } from "@/lib/products";
import { SEASON_LABELS, SHIPPING_FEE, SITE, SIZES, PREPAID_DISCOUNT_PERCENT } from "@/lib/config";
import ProductGallery from "@/components/ProductGallery";
import ShareButton from "@/components/ShareButton";
import SizeChart from "@/components/SizeChart";
import AddToCart from "@/components/AddToCart";
import ReviewsStrip from "@/components/ReviewsStrip";
import SaleTag from "@/components/SaleTag";
import ProductSection from "@/components/ProductSection";
import DemoNotice from "@/components/DemoNotice";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const description =
    product.description ||
    `${product.name}: ${product.fabric || "premium"} suit from Rizwan Clothing. Price ${formatPKR(effectivePrice(product))}.`;
  const image = (product.images || [])[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `/products/${product.slug}`,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const { product, products, isDemo } = await getProductBySlug(slug);
  if (!product) notFound();
  const [sizeChart, reviews] = await Promise.all([getSizeChart(), getReviews({ productSlug: product.slug })]);

  const onSale = isOnSale(product) && !product.sold_out;
  const saving = onSale ? Number(product.price) - effectivePrice(product) : 0;

  // Shirt / dupatta / trouser lines, shown only for the parts that have a fabric.
  const includedParts = [
    { label: "Shirt", value: product.shirt_fabric },
    { label: "Dupatta", value: product.dupatta_fabric },
    { label: "Trouser", value: product.trouser_fabric },
  ].filter((part) => part.value);

  const details = [
    { label: "Fabric", value: product.fabric },
    { label: "Colour", value: product.color },
    { label: "Season", value: SEASON_LABELS[product.season] || "" },
    { label: "Sizes", value: SIZES.join(", ") },
  ].filter((d) => d.value);

  const related = products
    .filter((p) => p.slug !== product.slug && p.collection_slug === product.collection_slug)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.images || [],
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: effectivePrice(product),
      availability: product.sold_out
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${SITE.url}/products/${product.slug}`,
    },
  };

  return (
    <>
      <DemoNotice show={isDemo} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12">
        <ProductGallery images={product.images || []} name={product.name} />

        <div>
          <p className="text-xs text-stone-500">
            <Link href="/collections" className="underline">Collections</Link>
          </p>
          <h1 className="mt-2 text-2xl leading-snug text-stone-700 sm:text-3xl">{product.name}</h1>

          <div className="mt-4">
            {onSale ? (
              <>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xl">
                  <span className="text-stone-400 line-through">{formatPKR(product.price)}</span>
                  <span className="font-semibold text-red-600">{formatPKR(effectivePrice(product))}</span>
                  <SaleTag p={product} />
                </p>
                <p className="mt-1 text-xs text-red-600">You save {formatPKR(saving)}</p>
              </>
            ) : (
              <p className="text-xl font-medium">{formatPKR(product.price)}</p>
            )}
            <p className="mt-1 text-xs text-stone-500">
              Flat delivery charge of {formatPKR(SHIPPING_FEE)} per order, added at checkout.
            </p>
            <p className="mt-1 text-xs text-green-700">
              Get an additional {PREPAID_DISCOUNT_PERCENT}% discount on prepaid orders
            </p>
          </div>

          <div className="mt-5 border-t border-stone-200 pt-1">
            <AddToCart product={product} />
          </div>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-stone-700">{product.description}</p>
          )}

          {includedParts.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-sm uppercase tracking-[0.15em]">What&apos;s included</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {includedParts.map((part) => (
                  <li key={part.label}>
                    <span className="font-medium">{part.label}:</span> {part.value}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            product.includes && (
              <div className="mt-6">
                <h2 className="text-sm uppercase tracking-[0.15em]">What&apos;s included</h2>
                <p className="mt-2 text-sm">{product.includes}</p>
              </div>
            )
          )}

          {details.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm uppercase tracking-[0.15em]">Product details</h2>
              <dl className="mt-2 space-y-1 text-sm">
                {details.map((d) => (
                  <div key={d.label} className="flex gap-2">
                    <dt className="w-24 shrink-0 font-medium">{d.label}</dt>
                    <dd>{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <p className="mt-6 text-xs text-stone-500">
            Due to photographic lighting and different screen settings, colours may look slightly
            different from the pictures.
          </p>
          <ShareButton title={product.name} />

          <SizeChart chart={sizeChart} />
        </div>
      </div>

      <ReviewsStrip title="Customer feedback" reviews={reviews} />

      <ProductSection title="You may also like" products={related} />
    </>
  );
}
