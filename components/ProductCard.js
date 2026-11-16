import Link from "next/link";
import { effectivePrice, isOnSale } from "@/lib/products";
import Price from "@/components/Price";
import SaleTag from "@/components/SaleTag";
import Reveal from "@/components/Reveal";
import QuickViewButton from "@/components/QuickViewButton";

// Only what the quick-view pop-up needs (keeps the page light).
function quickData(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    fabric: p.fabric,
    price: p.price,
    sale_price: p.sale_price,
    sale_percent: p.sale_percent,
    images: p.images || [],
    is_new: p.is_new,
    sold_out: p.sold_out,
    stock: p.stock,
  };
}

// Card size and look copied from logoofficial.com: tall photo (2:3), small spaced name, small price.
// index = place in the grid, so a row of cards appears one after another.
export default function ProductCard({ p, index = 0 }) {
  const [first, second] = p.images || [];
  const onSale = isOnSale(p) && !p.sold_out;
  const href = `/products/${p.slug}`;

  return (
    <Reveal delay={(index % 4) * 70} className="product-card group">
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          <div className="relative aspect-[2/3] overflow-hidden bg-stone-100">
            {first ? (
              <img
                src={first}
                alt={p.name}
                loading="lazy"
                className={
                  "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.04] " +
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
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100"
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
        </Link>
        <QuickViewButton product={quickData(p)} />
      </div>

      <Link href={href} className="mt-3 block text-center">
        <p className="line-clamp-2 font-display text-[12px] uppercase leading-snug tracking-[0.14em] transition-opacity duration-300 group-hover:opacity-60 sm:text-[14px] sm:tracking-[0.2em]">
          {p.name}
        </p>
        <p className="mt-1 text-[13px]">
          {onSale ? (
            <>
              <span className="mr-2 text-stone-400 line-through"><Price value={p.price} /></span>
              <span className="font-semibold text-red-600"><Price value={effectivePrice(p)} /></span>
            </>
          ) : (
            <span className="text-stone-700"><Price value={p.price} /></span>
          )}
        </p>
        {onSale && (
          <p className="mt-1.5">
            <SaleTag p={p} />
          </p>
        )}
      </Link>
    </Reveal>
  );
}
