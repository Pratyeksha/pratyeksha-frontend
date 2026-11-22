/* Single source for landing-site SEO. Imported by the app (runtime head tags) and by vite.config.js (static HTML per page,
   sitemap), so crawlers that never run JavaScript still get a real title, description, headings and links for each page.
   Copy only describes what Pratyeksha does today. */

export const SITE_NAME = "Pratyeksha";
export const ORG = {
  name: "Pratyeksha",
  email: "hello.pratyeksha@gmail.com",
  phones: ["+91 87676 22654", "+91 86050 15294"],
  locality: "Kolhapur", region: "Maharashtra", country: "IN",
};

export const LANDING_PAGES = [
  {
    key: "home", path: "/landing", changefreq: "weekly", priority: "1.0", schema: "WebPage", crumb: "Home",
    title: "Pratyeksha | Restaurant & Café Management Software in India",
    description: "Pratyeksha connects QR menus, kitchen display, GST billing, inventory and guest marketing into one live system for cafés and restaurants in India.",
    keywords: "restaurant management software India, café POS, QR menu, kitchen display system, GST billing, restaurant inventory, restaurant SaaS, Marathi menu",
    h1: "Your restaurant. More in sync.",
    summary: "Orders, kitchen flow, stock and guest relationships working together in one live system for Indian cafés and restaurants.",
    points: ["QR table menu with 3D dishes, in English and Marathi", "Kitchen display with live tickets and cooking timers", "GST billing with UPI, cash and card", "Inventory tied to dishes with low-stock and sold-out control", "Owner insights, revenue and P&L", "Waitlist, reservation and pickup for guests"],
  },
  {
    key: "features", path: "/landing/features", changefreq: "weekly", priority: "0.9", schema: "WebPage", crumb: "Features",
    title: "Features: QR Menu, Kitchen Display, GST Billing & Inventory | Pratyeksha",
    description: "Every Pratyeksha feature: QR menu with 3D dishes, waitlist, reservation and pickup, kitchen display, GST billing, inventory, owner insights and guest discovery.",
    keywords: "restaurant software features, QR code menu, kitchen display system, GST invoice restaurant, restaurant inventory management, waitlist reservation pickup, owner dashboard",
    h1: "One system for the whole restaurant day.",
    summary: "From the guest's first scan to the owner's last report: guest menu, kitchen display, operator portal, owner dashboard and guest home.",
    points: ["Guest menu: scan the table QR, browse, order, request service and pay", "Waitlist, reservation and pickup with edits until the restaurant confirms", "Kitchen display with per-item timers", "Billing with CGST and SGST, sequential invoices and exports", "Stock alerts and instant sold-out control", "Executive insights, P&L and day close"],
  },
  {
    key: "benefits", path: "/landing/benefits", changefreq: "weekly", priority: "0.8", schema: "WebPage", crumb: "Benefits",
    title: "Benefits for Owners, Managers, Kitchens & Guests | Pratyeksha",
    description: "What Pratyeksha changes for owners, managers, kitchens and guests: fewer missed orders, clearer margins, easier GST days and guests who return.",
    keywords: "restaurant software benefits, reduce missed orders, restaurant profit margins, GST compliance restaurant, guest retention, restaurant owner dashboard",
    h1: "Better service, clearer numbers, guests who return.",
    summary: "How one live system helps the owner, the manager and counter, the kitchen and the guest.",
    points: ["Fewer missed orders: guest, kitchen and counter see the same order", "Fewer stock surprises: dishes tied to ingredients", "Clearer margins: dish cost, wastage and profit next to sales", "Easier GST days with sequential invoices and exports", "Guests who come back through remembered dishes, feedback and campaigns"],
  },
  {
    key: "about", path: "/landing/about", changefreq: "monthly", priority: "0.7", schema: "AboutPage", crumb: "About",
    title: "About Pratyeksha | Restaurant Experience System from Maharashtra",
    description: "Pratyeksha is a restaurant experience system built in Maharashtra for Indian cafés and restaurants, connecting guest, kitchen, counter and owner in one live system.",
    keywords: "about Pratyeksha, restaurant technology Maharashtra, Kolhapur software, Indian café software, restaurant experience system",
    h1: "Software that keeps up with your service.",
    summary: "A restaurant experience system built in Maharashtra, India, for GST billing, UPI payments, English and Marathi.",
    points: ["Five screens, one system: guest menu, kitchen display, operator portal, owner dashboard, guest home", "Built for service pressure", "Indian by default: rupees, GST, UPI, English and Marathi", "Each restaurant's data kept separate", "Signed QR codes and device-bound tables"],
  },
  {
    key: "demo", path: "/landing/demo", changefreq: "monthly", priority: "0.9", schema: "ContactPage", crumb: "Book a demo",
    title: "Book a Private Demo | Pratyeksha Restaurant Software",
    description: "Book a private Pratyeksha walkthrough focused on how your café or restaurant works today: orders, stock, billing and bringing guests back.",
    keywords: "book restaurant software demo, Pratyeksha demo, café software demo India, restaurant POS demo",
    h1: "Make room for better service.",
    summary: "A private, owner-focused walkthrough built around your priorities. Call +91 87676 22654 or email hello.pratyeksha@gmail.com.",
    points: ["Map your current workflow", "Focus on what matters to you", "Understand the next step: fit, setup and subscription options"],
  },
];

export const LEGAL_PAGES = [
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

export const FAQS = [
  { q: "Is Pratyeksha a POS replacement?", a: "Pratyeksha is designed as a connected restaurant experience and intelligence layer, bringing customer experience, kitchen workflows, billing, inventory and marketing signals into one connected journey." },
  { q: "Can customers order directly from a QR menu?", a: "Yes. The customer journey can connect QR discovery with menu browsing, dish information, ordering and configured order-status experiences." },
  { q: "Can operators control menu visibility?", a: "Yes. Menu visibility and availability can be managed as part of the restaurant's operational workflow, while keeping the customer-facing menu connected." },
  { q: "Does the platform support GST billing?", a: "The platform includes GST-oriented billing workflows with CGST and SGST calculations, invoice sequencing and configured payment methods." },
  { q: "Can recipes connect with inventory?", a: "Yes. Recipe and ingredient relationships can connect dish availability, stock movement and operational inventory information." },
  { q: "Can it support multiple outlets?", a: "Pratyeksha is designed with multi-outlet workflows in mind, allowing menu, operational and reporting structures to extend across locations." },
  { q: "Does it support multilingual experiences?", a: "The customer experience can support English, Marathi and Hindi-oriented menu and voice experiences where configured." },
  { q: "How can I see it for my restaurant?", a: "Use the private demonstration form and share the parts of your current restaurant setup you want to improve. The walkthrough can then focus on the relevant Pratyeksha workflows." },
];

export const pageByKey = (k) => LANDING_PAGES.find((p) => p.key === k);

const abs = (base, path) => `${base}${path}`;

/* JSON-LD graph for one page. `faqs` (home only) and `features` are passed in by the caller. */
export function buildGraph(base, page, { faqs = [], features = [] } = {}) {
  const org = `${base}/#org`;
  const g = [
    {
      "@type": "Organization", "@id": org, name: ORG.name, url: base, logo: abs(base, "/pratyeksha-logo.png"), email: ORG.email,
      contactPoint: ORG.phones.map((t) => ({ "@type": "ContactPoint", telephone: t, contactType: "sales", areaServed: "IN", availableLanguage: ["en", "mr"] })),
      address: { "@type": "PostalAddress", addressLocality: ORG.locality, addressRegion: ORG.region, addressCountry: ORG.country },
    },
    { "@type": "WebSite", "@id": `${base}/#website`, url: base, name: SITE_NAME, inLanguage: "en-IN", publisher: { "@id": org } },
    {
      "@type": page.schema, "@id": `${abs(base, page.path)}#page`, url: abs(base, page.path), name: page.title, description: page.description, inLanguage: "en-IN",
      isPartOf: { "@id": `${base}/#website` }, about: { "@id": `${base}/#app` }, primaryImageOfPage: { "@type": "ImageObject", url: abs(base, "/og-image.png") },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: abs(base, "/landing") }, ...(page.key === "home" ? [] : [{ "@type": "ListItem", position: 2, name: page.crumb, item: abs(base, page.path) }])],
    },
    {
      "@type": "SoftwareApplication", "@id": `${base}/#app`, name: SITE_NAME, applicationCategory: "BusinessApplication", operatingSystem: "Web, Android, iOS",
      description: LANDING_PAGES[0].description, url: abs(base, "/landing"), publisher: { "@id": org }, inLanguage: ["en-IN", "mr-IN"],
      ...(features.length ? { featureList: features } : {}),
    },
  ];
  if (faqs.length && page.key === "home") g.push({ "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  return { "@context": "https://schema.org", "@graph": g };
}
