import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalogue";
import { effectivePrice, formatPKR, isOnSale } from "@/lib/products";
import { SITE, PREPAID_DISCOUNT_PERCENT } from "@/lib/config";
import ProductGallery from "@/components/ProductGallery";
import AddToCart from "@/components/AddToCart";
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

  const onSale = isOnSale(product);
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

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
        <ProductGallery images={product.images || []} name={product.name} />

        <div>
          <p className="text-xs text-stone-500">
            <Link href="/collections" className="underline">Collections</Link>
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>

          <p className="mt-3 text-xl">
            {onSale ? (
              <>
                <span className="mr-3 text-stone-400 line-through">{formatPKR(product.price)}</span>
                <span className="font-semibold text-red-600">{formatPKR(effectivePrice(product))}</span>
              </>
            ) : (
              <span className="font-semibold">{formatPKR(product.price)}</span>
            )}
          </p>
          <p className="mt-1 text-xs text-green-700">
            Extra {PREPAID_DISCOUNT_PERCENT}% off when you pay in advance
          </p>

          <dl className="mt-5 space-y-2 text-sm">
            {product.fabric && (
              <div className="flex gap-2">
                <dt className="w-24 font-medium">Fabric</dt>
                <dd>{product.fabric}</dd>
              </div>
            )}
            {product.includes && (
              <div className="flex gap-2">
                <dt className="w-24 font-medium">Includes</dt>
                <dd>{product.includes}</dd>
              </div>
            )}
          </dl>

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-sm text-stone-700">{product.description}</p>
          )}

          <AddToCart product={product} />
        </div>
      </div>

      <ProductSection title="You may also like" products={related} />
    </>
  );
}
