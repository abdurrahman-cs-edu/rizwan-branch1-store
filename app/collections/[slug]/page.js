import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogue, getCollections, productsInCollection } from "@/lib/catalogue";
import CollectionView from "@/components/CollectionView";
import DemoNotice from "@/components/DemoNotice";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const collections = await getCollections();
  const c = collections.find((x) => x.slug === slug);
  if (!c) return { title: "Collection not found" };
  return {
    title: c.name,
    description: `Shop ${c.name} suits from Rizwan Clothing. Cash on delivery and advance payment available.`,
  };
}

export default async function CollectionPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const [{ products, isDemo }, collections] = await Promise.all([getCatalogue(), getCollections()]);

  const collection = collections.find((c) => c.slug === slug);
  if (!collection) notFound();

  const children = collections.filter((c) => c.parent_slug === slug);
  const list = productsInCollection(products, collections, slug);

  return (
    <>
      <DemoNotice show={isDemo} />
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <p className="text-xs text-stone-500">
          <Link href="/" className="underline">Home</Link> / <Link href="/collections" className="underline">Collections</Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{collection.name}</h1>
        {children.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {children.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:bg-stone-100"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
      <CollectionView products={list} searchParams={sp} basePath={`/collections/${slug}`} />
    </>
  );
}
