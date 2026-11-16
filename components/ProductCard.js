import Link from "next/link";
import { effectivePrice, isOnSale } from "@/lib/products";
import Price from "@/components/Price";
import SaleTag from "@/components/SaleTag";

export default function ProductCard({ p }) {
  const [first, second] = p.images || [];
  const onSale = isOnSale(p) && !p.sold_out;

  return (
    <Link href={`/products/${p.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
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

        <div className="absolute left-2 top-2 flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider">
          {p.is_new && <span className="bg-black px-2 py-0.5 text-white">New</span>}
        </div>
        {p.sold_out && (
          <span className="absolute right-2 top-2 bg-stone-700 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3 text-center text-sm">
        <p className="line-clamp-2 font-display uppercase tracking-[0.08em] group-hover:underline">{p.name}</p>
        <p className="mt-1">
          {onSale ? (
            <>
              <span className="mr-2 text-stone-400 line-through"><Price value={p.price} /></span>
              <span className="font-semibold text-red-600"><Price value={effectivePrice(p)} /></span>
            </>
          ) : (
            <span className="font-medium"><Price value={p.price} /></span>
          )}
        </p>
        {onSale && (
          <p className="mt-1.5">
            <SaleTag p={p} />
          </p>
        )}
      </div>
    </Link>
  );
}
