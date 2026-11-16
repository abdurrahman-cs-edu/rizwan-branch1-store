import Link from "next/link";
import { getCatalogue, getCollections } from "@/lib/catalogue";
import CollectionView from "@/components/CollectionView";
import DemoNotice from "@/components/DemoNotice";
import { WIDE } from "@/lib/layout";

export const revalidate = 60;
export const metadata = { title: "All Collections" };

export default async function AllCollections({ searchParams }) {
  const sp = await searchParams;
  const [{ products, isDemo }, collections] = await Promise.all([getCatalogue(), getCollections()]);

  return (
    <>
      <DemoNotice show={isDemo} />
      <div className={`${WIDE} pt-8`}>
        <h1 className="text-2xl font-bold sm:text-3xl">All Collections</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {collections
            .filter((c) => !c.parent_slug)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:bg-stone-100"
              >
                {c.name}
              </Link>
            ))}
        </div>
      </div>
      <CollectionView products={products} searchParams={sp} basePath="/collections" />
    </>
  );
}
