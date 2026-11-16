import { salePercent } from "@/lib/products";

// Glowing "30% OFF" tag. Shows nothing when the suit is not on sale.
export default function SaleTag({ p, className = "" }) {
  const percent = salePercent(p);
  if (!percent || p.sold_out) return null;
  return <span className={`sale-tag ${className}`}>✦ <span className="num">{percent}%</span> off</span>;
}
