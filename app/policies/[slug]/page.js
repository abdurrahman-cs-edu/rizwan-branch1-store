import { notFound } from "next/navigation";
import { POLICY_PAGES } from "@/lib/config";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = POLICY_PAGES[slug];
  return { title: page ? page.title : "Not found" };
}

export function generateStaticParams() {
  return Object.keys(POLICY_PAGES).map((slug) => ({ slug }));
}

export default async function PolicyPage({ params }) {
  const { slug } = await params;
  const page = POLICY_PAGES[slug];
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">{page.title}</h1>
      <div className="mt-4 space-y-3 text-sm text-stone-700">
        {page.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}
