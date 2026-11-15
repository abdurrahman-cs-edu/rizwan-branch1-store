import "./globals.css";
import { bodyFont, displayFont } from "@/lib/fonts";
import { SITE } from "@/lib/config";
import { CartProvider } from "@/components/CartProvider";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Rizwan Clothing | City Center, Qambar, Swat",
    template: "%s | Rizwan Clothing",
  },
  description:
    "Shop premium suits from Rizwan Clothing, Branch 1 (City Center, Qambar, Swat). Cash on delivery and advance payment available. Nationwide delivery.",
  openGraph: {
    siteName: "Rizwan Clothing",
    type: "website",
    locale: "en_PK",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
