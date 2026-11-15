import Link from "next/link";
import { effectivePrice, formatPKR, isOnSale } from "@/lib/products";

export default function ProductCard({ p }) {
  const [first, second] = p.images || [];
  const onSale = isOnSale(p);

  return (
    <Link href={`/products/${p.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-stone-100">
        {first ? (
          <img
            src={first}
            alt={p.name}
            loading="lazy"
            className={
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300 " +
              (second ? "group-hover:opacity-0" : "")
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-stone-400">
            {p.name}
          </div>
        )}
        {second && (
          <img
            src={second}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1 text-[11px] font-semibold uppercase">
          {p.is_new && <span className="rounded bg-black px-2 py-0.5 text-white">New</span>}
          {onSale && !p.sold_out && <span className="rounded bg-red-600 px-2 py-0.5 text-white">Sale</span>}
        </div>
        {p.sold_out && (
          <span className="absolute right-2 top-2 rounded bg-stone-700 px-2 py-0.5 text-[11px] font-semibold text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-2 text-sm">
        <p className="line-clamp-2 font-medium group-hover:underline">{p.name}</p>
        <p className="mt-0.5">
          {onSale ? (
            <>
              <span className="mr-2 text-stone-400 line-through">{formatPKR(p.price)}</span>
              <span className="font-semibold text-red-600">{formatPKR(effectivePrice(p))}</span>
            </>
          ) : (
            <span className="font-semibold">{formatPKR(p.price)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
