import Link from "next/link";
import { SITE, SOCIAL } from "@/lib/config";
import { WIDE } from "@/lib/layout";
import NewsletterForm from "@/components/NewsletterForm";
import Reveal from "@/components/Reveal";
import { InstagramIcon, TiktokIcon, YoutubeIcon } from "@/components/Icons";

// Footer laid out like logoofficial.com: logo and contact details, two link columns, then
// the e-mail box with the social icons; payment methods and the copyright line centred below.
// Headings: Tenor Sans, small and widely spaced. Everything else: Outfit, light.
// (The letter spacing is set in "style" because the global rule for h2 in globals.css would override a class.)
const HEADING = "font-display text-[12.8px] font-normal uppercase text-black";
const HEADING_STYLE = { letterSpacing: "0.3em" };
const LINK = "slide-underline inline-block pb-0.5 text-[13.6px] font-light leading-[13.6px] text-black";

// Payment icons (Visa, Mastercard): the same ready-made icons as logoofficial.com, in public/payment
// (MIT licence, see public/payment/LICENSE.txt). Shown only as a look; checkout takes COD or Advance.
const PAYMENT_ICONS = [
  { name: "Visa", src: "/payment/visa.svg" },
  { name: "Mastercard", src: "/payment/mastercard.svg" },
];

function FooterLink({ href, external, children }) {
  return (
    <li className="mb-[3.4px] py-[3px] text-[13.6px] leading-[13.6px]">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
          {children}
        </a>
      ) : (
        <Link href={href} className={LINK}>
          {children}
        </Link>
      )}
    </li>
  );
}

export default function Footer() {
  const socials = [
    ["Instagram", SOCIAL.instagram, InstagramIcon],
    ["YouTube", SOCIAL.youtube, YoutubeIcon],
    ["TikTok", SOCIAL.tiktok, TiktokIcon],
  ].filter(([, url]) => url);

  return (
    <footer className="mt-16 border-t border-stone-200 bg-white text-black">
      <Reveal className={`${WIDE} pb-8 pt-12`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {/* Logo and contact details */}
          <div>
            <img src="/logo.svg" alt={SITE.name} className="h-auto w-[220px]" />
            <p className="font-logo mt-2 text-[13px] uppercase tracking-[0.28em]">{SITE.branch}</p>
            <div className="mt-5 text-[13.6px] font-light leading-[1.45]">
              {/* Query, e-mail and address stay together; timings come after a gap */}
              <p>
                {SITE.phone && (
                  <>
                    <strong className="font-bold">For any query, call:</strong>{" "}
                    <a href={`tel:${SITE.phone.replace(/\s+/g, "")}`} className="num">{SITE.phone}</a>
                    <br />
                  </>
                )}
                {SITE.email && (
                  <>
                    <strong className="font-bold">Email:</strong> {SITE.email}
                    <br />
                  </>
                )}
                <strong className="font-bold">Address:</strong> {SITE.address}
              </p>
              {SITE.timings && (
                <p className="mt-4">
                  <strong className="font-bold">Timings:</strong> {SITE.timings}
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className={`${HEADING} mb-5`} style={HEADING_STYLE}>Customer care</h2>
            <ul>
              <FooterLink href="/policies/contact">Contact Us</FooterLink>
              <FooterLink href="/branch">Branch Info</FooterLink>
              <FooterLink href="/policies/refund">Refund Policy</FooterLink>
              <FooterLink href="/policies/terms">Terms of Service</FooterLink>
            </ul>
          </div>

          <div>
            <h2 className={`${HEADING} mb-5`} style={HEADING_STYLE}>Company</h2>
            <ul>
              <FooterLink href="/policies/privacy">Privacy Policy</FooterLink>
              {SITE.stitchedSiteUrl && (
                <FooterLink href={SITE.stitchedSiteUrl} external>
                  {SITE.stitchedSiteName}
                </FooterLink>
              )}
            </ul>
          </div>

          {/* E-mail box and social icons */}
          <div>
            <h2 className={`${HEADING} mb-5`} style={HEADING_STYLE}>Sign up and save</h2>
            <p className="mb-3 max-w-[270px] text-[13.6px] font-light leading-snug">
              Subscribe to get news about new designs, special offers and sales.
            </p>
            <NewsletterForm />
            {socials.length > 0 && (
              <ul className="mt-6 flex items-center gap-[15px]">
                {socials.map(([label, url, Icon]) => (
                  <li key={label}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      className="press block transition-opacity hover:opacity-60"
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Payment methods and copyright, centred */}
        <div className="mt-12 text-center">
          <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Payment methods">
            {PAYMENT_ICONS.map((p) => (
              <li key={p.name} className="h-[26px] w-[38px]">
                <img src={p.src} alt={p.name} width="38" height="24" className="h-6 w-[38px]" />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] font-light">
            © {new Date().getFullYear()} {SITE.name}, {SITE.branch}
          </p>
        </div>
      </Reveal>
    </footer>
  );
}
