import { SITE } from "@/lib/config";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/order/", "/account", "/admin"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
