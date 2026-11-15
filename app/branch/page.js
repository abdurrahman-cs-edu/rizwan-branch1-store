import { SITE } from "@/lib/config";
import { waLink } from "@/lib/products";

export const metadata = {
  title: "Branch 1: City Center, Qambar, Swat",
  description: "Visit Rizwan Clothing Branch 1 at Block B, Phase 1, City Center, Qambar, Swat.",
};

export default function BranchPage() {
  const wa = waLink(`Hello ${SITE.name}, I have a question.`);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">{SITE.name}, {SITE.branch}</h1>

      <dl className="mt-6 space-y-4 text-sm">
        <div>
          <dt className="font-semibold">Address</dt>
          <dd className="text-stone-700">{SITE.address}</dd>
          <a href={SITE.mapsLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block underline">
            Open in Google Maps
          </a>
        </div>
        <div>
          <dt className="font-semibold">Timings</dt>
          <dd className="text-stone-700">{SITE.timings}</dd>
          <dd className="text-stone-500">{SITE.timingsNote}</dd>
        </div>
        {(SITE.phone || wa || SITE.email) && (
          <div>
            <dt className="font-semibold">Contact</dt>
            {SITE.phone && <dd><a href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="underline">{SITE.phone}</a></dd>}
            {wa && <dd><a href={wa} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a></dd>}
            {SITE.email && <dd><a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a></dd>}
          </div>
        )}
      </dl>
    </div>
  );
}
