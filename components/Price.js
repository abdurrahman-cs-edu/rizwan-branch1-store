import { formatPKR } from "@/lib/products";

// A price such as "Rs. 12,500" in the logo font. Works in server and client components.
export default function Price({ value, className = "" }) {
  return <span className={`num ${className}`.trim()}>{formatPKR(value)}</span>;
}
