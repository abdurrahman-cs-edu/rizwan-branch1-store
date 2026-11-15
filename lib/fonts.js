import { Noto_Nastaliq_Urdu } from "next/font/google";

// Urdu text font. Only used for the Urdu payment instructions.
export const urduFont = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});
