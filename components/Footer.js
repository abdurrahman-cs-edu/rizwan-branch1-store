import Link from "next/link";
import { SITE, SOCIAL, PAYMENT_METHODS_LABELS } from "@/lib/config";
import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
  const socials = [
    ["Instagram", SOCIAL.instagram],
    ["YouTube", SOCIAL.youtube],
    ["TikTok", SOCIAL.tiktok],
  ].filter(([, url]) => url);

  return (
    <footer className="mt-16 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src="/logo.svg" alt={SITE.name} className="mb-3 h-12 w-auto mix-blend-multiply" />
          <p className="text-sm text-stone-600">{SITE.branch}</p>
          <p className="mt-1 text-sm text-stone-600">{SITE.address}</p>
          <Link href="/branch" className="mt-2 inline-block text-sm underline">
            Branch info
          </Link>
        </div>

        <div>
          <h3 className="mb-3 font-semibold">Policies</h3>
          <ul className="space-y-1 text-sm text-stone-600">
            <li><Link href="/policies/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/policies/terms" className="hover:underline">Terms of Service</Link></li>
            <li><Link href="/policies/refund" className="hover:underline">Refund Policy</Link></li>
            <li><Link href="/policies/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold">Follow us</h3>
          {socials.length === 0 ? (
            <p className="text-sm text-stone-500">Coming soon</p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-600">
              {socials.map(([label, url]) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-3 font-semibold">Newsletter</h3>
          <p className="mb-2 text-sm text-stone-600">Get news about new designs and offers.</p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-stone-200 px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <span>{PAYMENT_METHODS_LABELS.join(" · ")}</span>
        </div>
      </div>
    </footer>
  );
}
