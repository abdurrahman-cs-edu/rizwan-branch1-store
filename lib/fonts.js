import { Noto_Nastaliq_Urdu, Tenor_Sans, Outfit } from "next/font/google";

// Urdu text font. Only used for the Urdu payment instructions.
export const urduFont = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

// Same fonts as logoofficial.com: Tenor Sans for headings, Outfit for all other text.
// To change the look of the whole site, change these two (and the names in globals.css stay the same).
export const displayFont = Tenor_Sans({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

export const bodyFont = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});
