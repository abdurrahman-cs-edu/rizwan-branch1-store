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
      {page.updated && <p className="mt-1 text-xs text-stone-500">Last updated: {page.updated}</p>}
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700">
        {page.body.map((item, i) => {
          if (typeof item === "string") return <p key={i}>{item}</p>;
          if (item.h) {
            return (
              <h2 key={i} className="pt-3 text-base font-semibold text-stone-900">
                {item.h}
              </h2>
            );
          }
          if (item.list) {
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5">
                {item.list.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
