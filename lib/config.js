// Shop settings. Anything left empty ("") is simply hidden on the website
// until the shop fills it in.

export const SITE = {
  name: "Rizwan Clothing",
  branch: "Branch 1",
  tagline: "Premium suits, delivered across Pakistan",
  address: "Block B, Phase 1, City Center, Qambar, Swat",
  timings: "11:00 AM to 10:00 PM",
  timingsNote: "Friday is usually off. Please confirm by call before visiting.",
  phone: "0344 0553337",
  whatsapp: "923440553337", // digits only with country code
  email: "",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://rizwan-branch1-store.vercel.app",
  mapsLink:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Rizwan Clothing, City Center, Qambar, Swat"),
};

export const ANNOUNCEMENTS = [
  "Extra 5% discount on all prepaid orders",
  "Nationwide delivery",
];

export const MENU = [
  { label: "Home", href: "/" },
  { label: "Summer", href: "/collections/summer" },
  { label: "Winter", href: "/collections/winter" },
  { label: "All Collections", href: "/collections" },
];

export const SOCIAL = {
  instagram: "",
  youtube: "",
  tiktok: "",
};

export const PREPAID_DISCOUNT_PERCENT = 5;

export const SIZES = ["S", "M", "L", "XL", "XXL"];

// Shown when the customer chooses "Advance". Empty fields are hidden.
export const PAYMENT_DETAILS = {
  bank: { title: "UBL", accountTitle: "", accountNumber: "0177390776338", iban: "" },
  jazzcash: { accountTitle: "", number: "03452704321" },
  easypaisa: { accountTitle: "", number: "03452704321" },
};

export const PAYMENT_METHODS_LABELS = ["Cash on Delivery", "Bank Transfer", "JazzCash", "Easypaisa"];

// Used until the "collections" table exists in the database.
export const DEFAULT_COLLECTIONS = [
  { slug: "summer", name: "Summer", parent_slug: null, sort_order: 1 },
  { slug: "premium-dupatta-prints", name: "Premium Dupatta Prints", parent_slug: "summer", sort_order: 2 },
  { slug: "premium-embroidered-lawn", name: "Premium Embroidered Lawn", parent_slug: "summer", sort_order: 3 },
  { slug: "premium-embroidered-lawn-karandi", name: "Premium Embroidered Lawn Karandi", parent_slug: "summer", sort_order: 4 },
  { slug: "winter", name: "Winter", parent_slug: null, sort_order: 5 },
  { slug: "print-embroidered-karandi", name: "Print Embroidered Karandi", parent_slug: "winter", sort_order: 6 },
  { slug: "the-ethnic", name: "The Ethnic", parent_slug: null, sort_order: 7 },
  { slug: "leather-peach", name: "Leather Peach", parent_slug: null, sort_order: 8 },
];

// Used until the "home_sections" table exists in the database.
export const DEFAULT_HOME_SECTIONS = [
  { id: "trending", title: "Trending these days", kind: "trending", collection_slug: null, sort_order: 1 },
  { id: "new", title: "New Arrivals", kind: "new", collection_slug: null, sort_order: 2 },
  { id: "sale", title: "Sale", kind: "sale", collection_slug: null, sort_order: 3 },
];

export const CITIES = [
  "Mingora", "Saidu Sharif", "Qambar", "Kabal", "Barikot", "Madyan", "Bahrain",
  "Khwazakhela", "Matta", "Charbagh", "Fizagat", "Odigram",
  "Peshawar", "Mardan", "Swabi", "Nowshera", "Charsadda", "Abbottabad", "Mansehra",
  "Dir", "Chitral", "Bannu", "Kohat", "Dera Ismail Khan",
  "Islamabad", "Rawalpindi", "Lahore", "Faisalabad", "Multan", "Gujranwala",
  "Sialkot", "Sargodha", "Bahawalpur", "Sahiwal", "Gujrat", "Jhelum", "Sheikhupura",
  "Karachi", "Hyderabad", "Sukkur", "Larkana", "Quetta", "Muzaffarabad", "Gilgit",
];

export const POLICY_PAGES = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect only the details you give us when you order: your name, phone number, address and city. We use them to confirm and deliver your order and to contact you about it.",
      "We do not sell your details to anyone. We share them only with the courier who delivers your parcel.",
      "If you want your details removed from our records, contact us and we will help.",
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      "By placing an order on this website you confirm that the details you entered are correct.",
      "Prices are in Pakistani Rupees (PKR). Our team may contact you by WhatsApp or phone to confirm your order before it is dispatched.",
      "Product colours may look slightly different on different screens. Items marked Sold out cannot be ordered.",
    ],
  },
  refund: {
    title: "Refund Policy",
    body: [
      "If there is a problem with your order, please contact us as soon as you receive it, with photos, and we will look into it.",
      "The exact exchange and refund conditions will be published here by the shop.",
    ],
  },
  contact: {
    title: "Contact",
    body: [
      "Rizwan Clothing, Branch 1: Block B, Phase 1, City Center, Qambar, Swat.",
      "Open daily 11:00 AM to 10:00 PM. Friday is usually off. Please confirm by call.",
    ],
  },
};
