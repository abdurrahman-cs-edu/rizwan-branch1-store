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
  "Get an additional 5% discount on all prepaid orders",
  "Nationwide delivery!",
];

export const MENU = [
  { label: "Home", href: "/" },
  { label: "Summer", href: "/collections/summer" },
  { label: "Winter", href: "/collections/winter" },
  { label: "All Collections", href: "/collections" },
];

// Rizwan Clothing brand accounts (same links as rizwanclothing.com).
export const SOCIAL = {
  instagram: "https://www.instagram.com/rizwan.clothing",
  youtube: "https://www.youtube.com/channel/UCHR5A9zBdEIyJUJko212qhg",
  tiktok: "https://www.tiktok.com/@rizwanclothing",
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

// Policy pages. Each item in "body" is either:
//   "plain text"          -> a paragraph
//   { h: "Heading" }      -> a heading
//   { list: ["a", "b"] }  -> a bullet list
// Wording follows rizwanclothing.com (Branch 2); contact details are Branch 1's.
export const POLICY_PAGES = {
  privacy: {
    title: "Privacy Policy",
    updated: "November 2026",
    body: [
      `This policy explains what personal information ${SITE.name} (${SITE.branch}) collects through this website, how we use it, and the choices you have.`,
      { h: "What we collect" },
      {
        list: [
          "Contact details you enter when you order: your name, phone number, full address and city.",
          "Order details: the items, sizes and quantities you order, the payment method you choose, and any note you write for us.",
          "Your email address, only if you subscribe to our newsletter.",
          "Messages you send us, for example on WhatsApp.",
          "Technical data: to stop spam and repeated fake orders we keep a scrambled (hashed) form of your IP address for a short time. We do not store your card details because we do not take card payments on this website.",
        ],
      },
      { h: "How we use it" },
      {
        list: [
          "To confirm, prepare and deliver your order, and to contact you about it by WhatsApp or phone.",
          "To handle exchanges, returns and cancellations.",
          "To send our newsletter, only if you subscribed. You can ask us to stop at any time.",
          "To keep the website secure and prevent misuse.",
        ],
      },
      { h: "Who we share it with" },
      "We do not sell your details. We share them only with the courier who delivers your parcel, and with the technology services that host this website and store our orders (Vercel and Supabase). They may only use the data to provide those services.",
      { h: "Your browser" },
      "Your shopping cart is saved in your own browser so it is still there when you come back. We do not use it to track you on other websites.",
      { h: "How long we keep it" },
      "We keep order records for as long as we need them to deliver your order, handle exchanges and meet our legal and accounting duties.",
      { h: "Your choices" },
      `You can ask us to show you the details we hold about you, correct them, or delete them. Contact us on WhatsApp at ${SITE.phone} and we will help.`,
      { h: "Children" },
      "This website is not meant for children. If a parent or guardian believes a child has given us personal information, please contact us and we will delete it.",
      { h: "Changes" },
      "We may update this policy from time to time. The latest version is always on this page, with its date at the top.",
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "November 2026",
    body: [
      `These terms apply when you browse or order from the ${SITE.name} (${SITE.branch}) website. By placing an order you agree to them.`,
      { h: "Orders" },
      {
        list: [
          "When you place an order you are making an offer to buy. Your order is not accepted until we confirm it, and we may decline an order for any reason.",
          "Please make sure your name, phone number, address and city are correct. Our team may contact you on WhatsApp or by phone to confirm the order before dispatch.",
          "Items marked Sold out cannot be ordered.",
        ],
      },
      { h: "Prices" },
      "All prices are in Pakistani Rupees (PKR). The price is the one shown when you place your order. Prices are always checked by our system at the time of ordering, and we may correct obvious mistakes. Delivery charges, if any, are confirmed by our team on WhatsApp.",
      { h: "Payment" },
      {
        list: [
          "Cash on Delivery: you pay the courier when the parcel arrives.",
          "Advance payment: pay by bank transfer, JazzCash or Easypaisa and send the payment screenshot with your order number on WhatsApp. Orders paid in advance get an additional 5% discount. An advance order is processed after we receive and confirm your payment.",
        ],
      },
      { h: "Delivery" },
      "We deliver across Pakistan. Delivery times are estimates and can change with your city, the courier and the season. Please check the parcel when you receive it and tell us at once if anything is wrong.",
      { h: "Cancellations, exchanges and returns" },
      "Please read our Refund Policy. Orders can be cancelled only within 24 hours of placing them, and we may not be able to cancel an order that has already been dispatched.",
      { h: "Product colours" },
      "Because of photographic lighting and different screen settings, colours may look slightly different from the pictures.",
      { h: "Changes" },
      "We may update these terms from time to time. The latest version is always on this page.",
    ],
  },
  refund: {
    title: "Refund Policy",
    updated: "November 2026",
    body: [
      { h: "Exchanges and returns" },
      {
        list: [
          "Exchange is possible within 7 days of delivery only if the item is faulty, damaged or defective on delivery, or does not match the product you ordered.",
          `To report a problem, please tell us within 3 days of delivery by calling or messaging ${SITE.phone}.`,
          "For a faulty or damaged item, send it back within 7 days of purchase. After we receive it, we will give you a replacement for the product on your invoice.",
        ],
      },
      { h: "When we cannot exchange" },
      {
        list: [
          "The request is made after the time limit above.",
          "The product has been worn, used, washed, altered, damaged through use or tampered with.",
          "Anything is missing, including tags, labels, original packaging and free gifts.",
          "Sale items cannot be exchanged or refunded.",
          "Summer items can only be exchanged for summer items, and winter items only for winter items.",
        ],
      },
      { h: "How to start an exchange or return" },
      `Message us on WhatsApp at ${SITE.phone}, say you want an exchange or return, and include your order number. We will guide you through the process. Once it is approved, send the item back by courier. We will share the return address when you message us.`,
      { h: "Shipping costs" },
      "Shipping is not refunded, except when the item arrived damaged, we sent the wrong item, or the order had free shipping as a promotion. In all other cases you pay to send the item back.",
      { h: "Another option" },
      `You can visit ${SITE.name}, ${SITE.address}, and buy something else of the same amount. Please bring your original receipt and pay any difference at that time.`,
      { h: "Cancellations" },
      `Orders can be cancelled only within 24 hours of placing them. Message us on WhatsApp at ${SITE.phone} with your order number.`,
    ],
  },
  contact: {
    title: "Contact",
    body: [
      { h: `${SITE.name}, ${SITE.branch}` },
      {
        list: [
          `Address: ${SITE.address}`,
          `Phone and WhatsApp: ${SITE.phone}`,
          `Timings: ${SITE.timings}. ${SITE.timingsNote}`,
        ],
      },
      "For order questions, exchanges and cancellations, WhatsApp is the fastest way to reach us. Please keep your order number ready.",
    ],
  },
};
