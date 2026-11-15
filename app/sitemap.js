import { SITE } from "@/lib/config";
import { getCatalogue, getCollections } from "@/lib/catalogue";

export const revalidate = 3600;

export default async function sitemap() {
  const [{ products, isDemo }, collections] = await Promise.all([getCatalogue(), getCollections()]);
  const base = SITE.url;

  const pages = ["", "/collections", "/branch", "/policies/privacy", "/policies/terms", "/policies/refund", "/policies/contact"].map(
    (path) => ({ url: `${base}${path}` })
  );
  const cols = collections.map((c) => ({ url: `${base}/collections/${c.slug}` }));
  // Demo products must never be listed for search engines
  const prods = isDemo
    ? []
    : products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.website_added_at,
      }));

  return [...pages, ...cols, ...prods];
}
