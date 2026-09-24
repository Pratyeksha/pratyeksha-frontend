import React, { useEffect, useRef, useState } from "react";

const API = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "";
const GA_MEASUREMENT_ID = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GA_MEASUREMENT_ID) || "";
const LOGO_SRC = "/pratyeksha-logo.png";
const CONSENT_STORAGE_KEY = "pratyeksha-consent-v2";
const CONSENT_VERSION = "2026-09-24";
const SITE_PATHS = ["/", "/landing", "/thank-you"];
const PAGE_META = {
  home: {
    title: "Pratyeksha | Restaurant Experience System",
    description: "Pratyeksha connects customer experience, menu, kitchen, billing, inventory, intelligence and marketing workflows for cafés and restaurants.",
  },
  privacy: {
    title: "Privacy Policy | Pratyeksha",
    description: "Learn how Pratyeksha collects, uses, protects, retains and handles personal data across its website, enquiries and services.",
  },
  terms: {
    title: "Terms of Use | Pratyeksha",
    description: "Read the terms governing access to the Pratyeksha website, product information, demonstrations and related services.",
  },
  thankYou: {
    title: "Demo Request Received | Pratyeksha",
    description: "Your Pratyeksha private demo request has been received. We will contact you using the details you provided.",
  },
  notFound: {
    title: "Page Not Found | Pratyeksha",
    description: "The Pratyeksha page you requested could not be found.",
  },
};
const ALLOWED_BUSINESS_TYPES = new Set([
  "Café / Coffee Shop",
  "Restaurant",
  "QSR / Fast Food",
  "Bakery / Bistro",
  "Cloud Kitchen",
  "Multi-outlet Business",
]);
const MAX_FORM = { name: 80, business: 120, phone: 20, email: 160, message: 1000 };
const getPath = () => {
  if (typeof window === "undefined") return "/landing";
  return window.location.pathname.replace(/\/+$/, "") || "/";
};
const pushPath = (path) => {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
const readConsent = () => {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.version === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
};
const saveConsent = (analytics) => {
  const value = { version: CONSENT_VERSION, analytics: Boolean(analytics), timestamp: new Date().toISOString() };
  try { window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value)); } catch {}
  return value;
};
const BrandLogo = ({ className = "", alt = "Pratyeksha" }) => (
  <img
    className={`brand-logo-image ${className}`.trim()}
    src={LOGO_SRC}
    alt={alt}
    loading="eager"
    decoding="async"
  />
);
const Icon = ({ children, size = 20, stroke = 1.5, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);
const icons = {
  spark: (
    <>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
      <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  play: <path d="m9 6 9 6-9 6V6Z" />,
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>
  ),
  kitchen: (
    <>
      <rect x="3" y="3" width="18" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 16v5" />
    </>
  ),
  billing: (
    <>
      <path d="M6 2h9l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path d="M14 2v5h5" />
      <path d="M8 12h8" />
      <path d="M8 16h6" />
    </>
  ),
  inventory: (
    <>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 4-4 3 2 5-6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a5 5 0 0 1 10 0v2" />
      <path d="M16 3.5a4 4 0 0 1 0 7.5" />
      <path d="M22 21v-2a5 5 0 0 0-4-4.8" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M19 10a7 7 0 0 1-14 0" />
      <path d="M12 17v5" />
      <path d="M8 22h8" />
    </>
  ),
  box: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" />
      <path d="m3 7 9 5 9-5" />
      <path d="M12 12v10" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3 3 15 0 18" />
      <path d="M12 3c-3 3-3 15 0 18" />
    </>
  ),
  phone: (
    <path d="M6.5 3.5 9 3l2 5-2.2 1.7a16 16 0 0 0 5.5 5.5L16 13l5 2 .5 2.5a2 2 0 0 1-2.2 2.3C10.8 18.7 5.3 13.2 4.2 4.7A2 2 0 0 1 6.5 3.5Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  map: (
    <>
      <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  utensils: (
    <>
      <path d="M7 3v7" />
      <path d="M4 3v4a3 3 0 0 0 6 0V3" />
      <path d="M7 10v11" />
      <path d="M17 3v18" />
      <path d="M17 3c3 2 3 7 0 9" />
    </>
  ),
  flame: (
    <path d="M12 22c4.5 0 7-3 7-7.2 0-3.4-2.1-6.1-4.7-8.8.1 2.4-.7 3.7-2 4.8.2-3.4-1.4-6.4-3.6-8.8C8.5 6.7 5 9.8 5 14.3 5 19 8 22 12 22Z" />
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  trending: (
    <>
      <path d="M4 16l6-6 4 4 6-7" />
      <path d="M15 7h5v5" />
    </>
  ),
  brain: (
    <>
      <path d="M9 4a3 3 0 0 0-5 2 3 3 0 0 0 1 5 3 3 0 0 0 2 5 3 3 0 0 0 5 2V6a3 3 0 0 0-3-2Z" />
      <path d="M15 4a3 3 0 0 1 5 2 3 3 0 0 1-1 5 3 3 0 0 1-2 5 3 3 0 0 1-5 2V6a3 3 0 0 1 3-2Z" />
      <path d="M9 9h3M12 14h3" />
    </>
  ),
  arrowUpRight: (
    <>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M17 10h2a3 3 0 0 1 0 6h-2" />
      <path d="M7 4c0 1 1 1 1 2M11 4c0 1 1 1 1 2" />
    </>
  ),
  star: (
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  message: (
    <>
      <path d="M20 11.5a8 8 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L3 20l1.7-4A8 8 0 1 1 20 11.5Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </>
  ),
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2" />
    </>
  ),
};
const I = ({ name, size = 20, stroke = 1.5, className = "" }) => (
  <Icon size={size} stroke={stroke} className={className}>
    {icons[name]}
  </Icon>
);
const modules = [
  {
    id: "experience",
    number: "01",
    eyebrow: "CUSTOMER EXPERIENCE",
    title: "A digital menu guests actually want to use.",
    text:
      "Turn a simple table QR into a premium ordering experience. Guests explore dishes, view 3D food, hear dish descriptions, switch languages and order directly from their phone.",
    icon: "layers",
    color: "cream",
    features: [
      "3D / AR dish visualization",
      "Bilingual English + Marathi menu",
      "Voice “Hear About This Dish”",
      "Bestseller and Chef Special badges",
      "Live order status",
      "Waitlist, reservation and pickup",
      "Service requests from table",
      "Remembered dishes and reorder",
    ],
  },
  {
    id: "operations",
    number: "02",
    eyebrow: "KITCHEN + OPERATIONS",
    title: "Connect the floor, kitchen and counter.",
    text:
      "Every order moves through one connected operational layer. Kitchen teams see live tickets while operators see tables, orders, inventory and billing in real time.",
    icon: "kitchen",
    color: "dark",
    features: [
      "Real-time Kitchen Display System",
      "FIFO ticket queue",
      "Per-item cooking timers",
      "Voice-enabled kitchen controls",
      "Live floor / table map",
      "Takeaway and online orders",
      "Instant sold-out controls",
      "Real-time multi-device sync",
    ],
  },
  {
    id: "billing",
    number: "03",
    eyebrow: "SMART BILLING",
    title: "Billing without the end-of-day headache.",
    text:
      "Bring every order round into one settlement flow with GST calculations, split payments and audit-ready invoices.",
    icon: "billing",
    color: "cream",
    features: [
      "CGST + SGST calculation",
      "Cash / UPI / Card / split payments",
      "GSTIN and FSSAI details",
      "Sequential invoice numbering",
      "Digital PDF invoices",
      "Takeaway billing",
      "Settlement protection",
      "Daily billing summary",
    ],
  },
  {
    id: "inventory",
    number: "04",
    eyebrow: "INVENTORY + RECIPES",
    title: "Know what every dish actually costs.",
    text:
      "Map dishes to ingredients once. Pratyeksha can connect recipe usage with sales and inventory so operators understand stock, wastage and real dish costs.",
    icon: "inventory",
    color: "dark",
    features: [
      "Recipe-to-ingredient mapping",
      "Automatic stock deduction",
      "Weighted Average Cost",
      "Purchase history",
      "Low-stock monitoring",
      "Wastage tracking",
      "Dish availability controls",
      "Ingredient-based profitability",
    ],
  },
  {
    id: "intelligence",
    number: "05",
    eyebrow: "BUSINESS INTELLIGENCE",
    title: "From restaurant data to useful decisions.",
    text:
      "See the patterns hidden inside daily operations — menu performance, peak hours, customer behaviour, profitability and business trends.",
    icon: "chart",
    color: "cream",
    features: [
      "Menu performance analysis",
      "Peak-hour analytics",
      "Revenue trends",
      "Dish profitability",
      "Customer retention",
      "GST / business reporting",
      "Exportable reports",
      "Operational recommendations",
    ],
  },
  {
    id: "marketing",
    number: "06",
    eyebrow: "CUSTOMER + MARKETING",
    title: "Keep the relationship alive after the bill.",
    text:
      "Turn customer interactions into useful marketing signals. Understand returning customers, feedback, favourite dishes and opportunities for re-engagement.",
    icon: "users",
    color: "dark",
    features: [
      "Customer feedback",
      "Favourite / remembered dishes",
      "Repeat customer signals",
      "WhatsApp marketing workflows",
      "Review prompts",
      "Customer segmentation",
      "Campaign insights",
      "Marketing intelligence",
    ],
  },
];
const PRODUCTS = {
  experience: { number: "01", eyebrow: "CUSTOMER EXPERIENCE", title: "A menu people actually want to explore.", description: "Turn a QR scan into a premium digital dining experience with rich dishes, intelligent suggestions, 3D views and effortless ordering." },
  kitchen: { number: "02", eyebrow: "KITCHEN FLOW", title: "Every order. One calm kitchen.", description: "Give the kitchen a live operating surface that keeps tickets, timers, priorities and preparation states visible." },
  operations: { number: "03", eyebrow: "OPERATIONS", title: "See the restaurant as it moves.", description: "Connect tables, orders, billing, menu availability and daily operations into one visual operating layer." },
  intelligence: { number: "04", eyebrow: "RESTAURANT INTELLIGENCE", title: "Turn everyday orders into useful signals.", description: "Understand what customers choose, when they return, what performs and where opportunities are hiding." },
  marketing: { number: "05", eyebrow: "RETENTION & MARKETING", title: "Make the second visit easier to earn.", description: "Remember preferences, understand customer behavior and create campaigns around real restaurant interactions." },
};
const PRODUCT_FEATURES = ["Live data", "Mobile ready", "Smart actions", "Real-time flow", "Restaurant aware", "Connected system"];
const useCases = [
  {
    title: "Cafés",
    desc: "For fast-moving cafés, coffee shops, bakeries and modern bistros.",
    points: ["QR ordering", "Quick billing", "Table service", "Customer retention"],
  },
  {
    title: "Restaurants",
    desc: "For dine-in restaurants, QSRs, family restaurants and premium dining.",
    points: ["Kitchen operations", "GST billing", "Inventory", "Analytics"],
  },
  {
    title: "Multi-outlet",
    desc: "For growing food businesses that need consistency across locations.",
    points: ["Central intelligence", "Outlet operations", "Menu control", "Reporting"],
  },
];
const faqs = [
  { q: "Is Pratyeksha a POS replacement?", a: "Pratyeksha is designed as a connected restaurant experience and intelligence layer, bringing customer experience, kitchen workflows, billing, inventory and marketing signals into one connected journey." },
  { q: "Can customers order directly from a QR menu?", a: "Yes. The customer journey can connect QR discovery with menu browsing, dish information, ordering and configured order-status experiences." },
  { q: "Can operators control menu visibility?", a: "Yes. Menu visibility and availability can be managed as part of the restaurant's operational workflow, while keeping the customer-facing menu connected." },
  { q: "Does the platform support GST billing?", a: "The platform includes GST-oriented billing workflows with CGST and SGST calculations, invoice sequencing and configured payment methods." },
  { q: "Can recipes connect with inventory?", a: "Yes. Recipe and ingredient relationships can connect dish availability, stock movement and operational inventory information." },
  { q: "Can it support multiple outlets?", a: "Pratyeksha is designed with multi-outlet workflows in mind, allowing menu, operational and reporting structures to extend across locations." },
  { q: "Does it support multilingual experiences?", a: "The customer experience can support English, Marathi and Hindi-oriented menu and voice experiences where configured." },
  { q: "How can I see it for my restaurant?", a: "Use the private demonstration form and share the parts of your current restaurant setup you want to improve. The walkthrough can then focus on the relevant Pratyeksha workflows." },
];
const CHATBOT_KNOWLEDGE = {
  brand: "Pratyeksha",
  positioning: "Pratyeksha is a premium restaurant experience system for cafes and restaurants. It is a connected customer-experience and intelligence layer rather than a simple POS replacement.",
  audience: ["cafes", "coffee shops", "bakeries", "bistros", "restaurants", "QSRs", "family restaurants", "cloud kitchens", "multi-outlet food businesses"],
  capabilities: [
    "QR menu and customer ordering journeys",
    "rich dish information and recommendations",
    "3D dish experiences where configured",
    "kitchen display and live order flow",
    "billing with GST-oriented CGST/SGST workflows",
    "inventory and recipe/ingredient relationships",
    "menu visibility and availability controls",
    "analytics and restaurant intelligence",
    "customer feedback and remembered/favourite dishes",
    "WhatsApp marketing workflows",
    "English, Marathi and Hindi-oriented customer/voice experiences where configured",
    "multi-outlet operational and reporting workflows"
  ],
  contact: { email: "hello.pratyeksha@gmail.com", phone: "+91 87676 22654", alternatePhone: "+91 86050 15294", location: "Maharashtra, India" },
  faq: faqs,
  bookingAnchor: "demo"
};
const CHATBOT_INTENTS = [
  {
    id: "identity", title: "What is Pratyeksha?", icon: "spark",
    terms: ["pratyeksha", "what is", "what does it do", "platform", "system", "software", "solution", "app", "website"],
    answer: "Pratyeksha is a premium restaurant experience system for cafés and restaurants. It connects the customer journey with menu, ordering, kitchen flow, billing, inventory, intelligence and marketing workflows instead of treating each part as a separate system."
  },
  {
    id: "positioning", title: "Is Pratyeksha a POS?", icon: "layers",
    terms: ["pos", "point of sale", "replacement", "replace pos", "instead of pos", "pos software", "cash counter"],
    answer: "Pratyeksha is positioned as a connected restaurant experience and intelligence layer rather than simply a POS replacement. It can connect customer experience, kitchen operations, billing, inventory and marketing signals into one journey."
  },
  {
    id: "businesses", title: "Who is it for?", icon: "users",
    terms: ["cafe", "café", "restaurant", "coffee shop", "bakery", "bistro", "qsr", "fast food", "family restaurant", "cloud kitchen", "business type", "suitable", "for whom"],
    answer: "Pratyeksha is designed for cafés, coffee shops, bakeries, bistros, restaurants, QSRs, family restaurants, cloud kitchens and growing multi-outlet food businesses. The exact workflow can be configured around the business model."
  },
  {
    id: "qr", title: "How does QR ordering work?", icon: "qr",
    terms: ["qr", "qr code", "scan", "scan menu", "table qr", "digital menu", "online menu", "qr ordering", "order from table", "order using qr"],
    answer: "A customer can scan a table QR, explore the digital menu, open rich dish information, use configured recommendations and place an order through the connected customer journey."
  },
  {
    id: "menu", title: "How does the digital menu work?", icon: "search",
    terms: ["menu", "digital menu", "categories", "dish", "item", "food item", "menu design", "menu update", "menu edit", "menu management"],
    answer: "The customer-facing menu is designed to make discovery easier through categories, search/filter experiences, dish details, availability and ordering. Operators can manage menu information through the connected operational workflow."
  },
  {
    id: "visibility", title: "Can I hide or disable dishes?", icon: "eye",
    terms: ["hide dish", "hide item", "disable dish", "disable item", "sold out", "unavailable", "availability", "visible", "visibility", "menu visibility", "out of stock"],
    answer: "Yes. Pratyeksha supports menu visibility and availability controls so an operator can control what customers can see/order according to the configured operational state."
  },
  {
    id: "dish", title: "What information can a dish show?", icon: "utensils",
    terms: ["dish details", "description", "ingredients", "spice", "serving", "bestseller", "chef special", "suggestion", "recommendation", "dish information"],
    answer: "A configured dish experience can present rich information such as description, serving information, spice context, ingredients, bestseller or chef-special signals and matching suggestions."
  },
  {
    id: "threeD", title: "Does it have 3D dishes?", icon: "box",
    terms: ["3d", "three d", "3d dish", "3d food", "ar", "augmented reality", "model", "dish model", "visualize food"],
    answer: "Yes, Pratyeksha can support 3D dish experiences where the relevant dish model and configuration are available. The 3D view is intended to make dish discovery more visual and engaging."
  },
  {
    id: "ordering", title: "What happens after a customer orders?", icon: "arrow",
    terms: ["after order", "order flow", "order process", "place order", "customer order", "order status", "track order", "order journey"],
    answer: "The customer order can move into the connected restaurant workflow, where kitchen preparation, status handling and downstream billing/operational steps can be coordinated according to the configured setup."
  },
  {
    id: "kitchen", title: "How does the kitchen work?", icon: "kitchen",
    terms: ["kitchen", "kitchen display", "kds", "ticket", "tickets", "preparation", "cook", "chef", "order queue", "kitchen screen"],
    answer: "Pratyeksha includes a kitchen-facing workflow for live tickets, preparation states and timers. The goal is to keep incoming orders and kitchen priorities visible without relying only on paper or disconnected screens."
  },
  {
    id: "timers", title: "Does the kitchen have timers?", icon: "clock",
    terms: ["timer", "timers", "prep time", "preparation time", "waiting time", "ticket timer", "cooking time", "late order"],
    answer: "Yes. The kitchen workflow can use live ticket timers and preparation states so the team can see how long orders have been waiting or progressing."
  },
  {
    id: "billing", title: "What does billing support?", icon: "billing",
    terms: ["billing", "bill", "invoice", "checkout", "settlement", "cash", "card", "upi", "split payment", "payment methods"],
    answer: "Pratyeksha includes connected billing workflows with configured payment methods such as UPI, cash and card, plus split-payment handling where enabled."
  },
  {
    id: "gst", title: "Does it support GST, CGST and SGST?", icon: "billing",
    terms: ["gst", "cgst", "sgst", "tax", "gst invoice", "tax invoice", "gst billing", "gst calculation"],
    answer: "Yes. The platform includes GST-oriented billing workflows with CGST and SGST calculations and invoice sequencing as configured for the business."
  },
  {
    id: "invoice", title: "How are invoices handled?", icon: "billing",
    terms: ["invoice number", "invoice sequence", "invoice numbering", "pdf invoice", "receipt", "bill pdf", "invoice pdf", "invoice reset"],
    answer: "Pratyeksha supports configured invoice workflows, including invoice sequencing and invoice/receipt generation. Exact numbering rules depend on the production configuration and business requirements."
  },
  {
    id: "inventory", title: "How does inventory work?", icon: "inventory",
    terms: ["inventory", "stock", "stock management", "store stock", "quantity", "wac", "weighted average", "stock movement", "ingredient stock"],
    answer: "Inventory can connect ingredients, recipes, stock movement and dish availability. The operational model is intended to help the restaurant understand what is available and how ingredient usage affects dish availability."
  },
  {
    id: "stock", title: "Can stock prevent over-ordering?", icon: "shield",
    terms: ["over order", "overordering", "oversell", "stock limit", "stock restriction", "quantity limit", "available quantity", "inventory limit"],
    answer: "A properly configured inventory workflow can use current stock and availability rules to prevent customers from ordering unavailable quantities. Final enforcement must happen server-side as well as in the customer UI for production safety."
  },
  {
    id: "recipes", title: "Can recipes connect to ingredients?", icon: "utensils",
    terms: ["recipe", "recipes", "recipe mapping", "ingredient mapping", "ingredient", "ingredients", "dish recipe", "recipe stock"],
    answer: "Yes. Recipes can connect dishes with their ingredients so operational inventory information can be related to dish availability and stock movement."
  },
  {
    id: "analytics", title: "What analytics are available?", icon: "chart",
    terms: ["analytics", "reports", "reporting", "dashboard", "sales report", "performance", "insights", "metrics", "restaurant analytics"],
    answer: "Pratyeksha is designed to turn restaurant activity into useful operational and customer signals, including configured reporting, performance views, order trends and intelligence workflows. Exact reports depend on the enabled modules."
  },
  {
    id: "intelligence", title: "What is restaurant intelligence?", icon: "brain",
    terms: ["intelligence", "smart", "ai", "insight", "intelligent", "recommend", "prediction", "signals", "restaurant intelligence"],
    answer: "Restaurant intelligence means turning everyday customer and operational activity into useful signals—such as what customers choose, returning-customer behavior, feedback, menu performance and opportunities for action."
  },
  {
    id: "feedback", title: "Can customers leave feedback?", icon: "message",
    terms: ["feedback", "review", "rating", "complaint", "customer feedback", "customer review", "feedback form", "experience feedback"],
    answer: "Yes. Customer feedback is part of the platform's customer-experience and intelligence layer, helping the business capture useful signals after interactions."
  },
  {
    id: "marketing", title: "How does marketing work?", icon: "trending",
    terms: ["marketing", "campaign", "campaigns", "retention", "customer retention", "re engagement", "promotion", "marketing intelligence", "repeat customer"],
    answer: "Pratyeksha can turn customer interactions into marketing signals, including remembered/favourite dishes, repeat-customer signals, segmentation, campaign insights and re-engagement workflows."
  },
  {
    id: "whatsapp", title: "Does it support WhatsApp marketing?", icon: "message",
    terms: ["whatsapp", "whatsapp marketing", "whatsapp campaign", "whatsapp message", "message customer", "customer messaging"],
    answer: "WhatsApp marketing workflows are part of the Pratyeksha direction. Availability and the exact messaging integration depend on the production configuration and connected services."
  },
  {
    id: "remember", title: "Can it remember customer preferences?", icon: "star",
    terms: ["remember", "remembered dishes", "favourite", "favorite", "preferences", "customer preference", "last order", "order again", "repeat order"],
    answer: "The customer-experience layer can use remembered or favourite-dish signals and repeat-customer information to make future visits more relevant, where the business has enabled those workflows."
  },
  {
    id: "multioutlet", title: "Can it manage multiple outlets?", icon: "layers",
    terms: ["multi outlet", "multiple outlets", "multiple branches", "branch", "branches", "chain", "locations", "outlets", "franchise"],
    answer: "Yes. Pratyeksha is designed with multi-outlet operational and reporting workflows in mind, allowing menu, operational and reporting structures to extend across locations."
  },
  {
    id: "language", title: "Does it support Marathi and Hindi?", icon: "globe",
    terms: ["marathi", "hindi", "english", "language", "multilingual", "multiple language", "regional language", "मराठी", "हिंदी"],
    answer: "The customer experience can support English, Marathi and Hindi-oriented menu and voice experiences where configured."
  },
  {
    id: "voice", title: "Does the menu have voice features?", icon: "mic",
    terms: ["voice", "voice assistant", "listen", "speech", "speak", "audio", "read aloud", "hear about dish", "voice menu"],
    answer: "Pratyeksha can support configured voice experiences for dish information, including English, Marathi and Hindi-oriented speech flows where browser/device support is available."
  },
  {
    id: "security", title: "Is customer and restaurant data secure?", icon: "shield",
    terms: ["security", "secure", "privacy", "data security", "customer data", "database security", "encryption", "access", "permissions", "safe"],
    answer: "Pratyeksha should keep secrets and database credentials server-side, use authenticated/authorized backend access, HTTPS, validation and restricted database access in production. The exact security controls depend on the deployed backend and hosting configuration."
  },
  {
    id: "integrations", title: "Can it integrate with other systems?", icon: "layers",
    terms: ["integration", "integrations", "api", "connect", "connected", "third party", "external system", "webhook", "software integration"],
    answer: "Pratyeksha is designed as a connected platform and can expose or consume integrations where supported by the deployed backend. Specific third-party integrations should be confirmed during a demo rather than assumed."
  },
  {
    id: "implementation", title: "How does setup work?", icon: "check",
    terms: ["setup", "install", "implementation", "onboarding", "getting started", "configuration", "configure", "launch", "go live"],
    answer: "Setup is business-specific. A demo can be used to understand your current workflow, decide which Pratyeksha modules are relevant and confirm the implementation/configuration path before launch."
  },
  {
    id: "pricing", title: "What is the pricing?", icon: "star",
    terms: ["price", "pricing", "cost", "fee", "fees", "subscription", "monthly", "yearly", "per day", "99", "₹", "rupee", "plan", "plans", "offer", "discount"],
    answer: "I don't want to invent a commercial figure because pricing and offers can change by business, modules and current commercial terms. For the current applicable price, contact the Pratyeksha team or book a private demo and the team can confirm the exact details."
  },
  {
    id: "demo", title: "How do I book a demo?", icon: "arrowUpRight",
    terms: ["demo", "book demo", "booking", "book", "schedule", "appointment", "meeting", "walkthrough", "presentation", "trial", "see it", "show me", "contact sales"],
    answer: "You can use the private demo section on this website. Share your business type and what you want to improve, and the walkthrough can focus on the relevant Pratyeksha workflows."
  },
  {
    id: "contact", title: "How can I contact Pratyeksha?", icon: "phone",
    terms: ["contact", "phone", "call", "email", "mail", "reach", "number", "support", "talk to someone", "sales team"],
    answer: `You can contact Pratyeksha at ${CHATBOT_KNOWLEDGE.contact.email}, ${CHATBOT_KNOWLEDGE.contact.phone} or ${CHATBOT_KNOWLEDGE.contact.alternatePhone}. For a detailed discussion, use the Book a private demo action.`
  },
  {
    id: "difference", title: "How is it different from a normal restaurant app?", icon: "spark",
    terms: ["difference", "different", "unique", "why pratyeksha", "advantage", "better", "normal app", "restaurant software", "traditional software"],
    answer: "The core idea is connection: customer experience, menu discovery, ordering, kitchen flow, billing, inventory, intelligence and marketing are treated as one restaurant journey instead of isolated tools."
  },
  {
    id: "customerexperience", title: "How does it improve customer experience?", icon: "star",
    terms: ["customer experience", "guest experience", "customer journey", "dining experience", "customer satisfaction", "faster ordering", "easy ordering", "discover dishes"],
    answer: "Pratyeksha focuses on a richer digital customer journey: QR discovery, visual dish information, recommendations, configured 3D/voice experiences, ordering, feedback and remembered preferences."
  },
  {
    id: "operations", title: "What restaurant operations does it connect?", icon: "layers",
    terms: ["operations", "restaurant operations", "daily operations", "workflow", "operator", "floor", "tables", "staff", "daily management"],
    answer: "The platform is designed to connect customer orders with operational workflows such as menu availability, kitchen flow, billing, inventory and reporting. Some operational modules depend on the deployed configuration."
  },
  {
    id: "staff", title: "Does it help restaurant staff?", icon: "users",
    terms: ["staff", "employee", "employees", "team", "waiter", "waiters", "manager", "chef", "cashier", "staff workflow"],
    answer: "Yes. Different operational surfaces can give kitchen, billing and management teams the information relevant to their workflow, reducing the need to coordinate everything manually."
  },
  {
    id: "payments", title: "Which payment methods can be used?", icon: "billing",
    terms: ["payment", "upi", "cash", "card", "credit card", "debit card", "split", "split bill", "payment mode"],
    answer: "The billing workflow supports configured payment methods including UPI, cash and card, with split-payment handling where enabled. Exact payment-gateway integrations should be confirmed for your deployment."
  },
  {
    id: "languagevoice", title: "Can customers hear dish information in their language?", icon: "mic",
    terms: ["hear dish", "dish voice", "spoken dish", "marathi voice", "hindi voice", "english voice", "voice language"],
    answer: "Where configured and supported by the device/browser, dish information can be presented through English, Marathi and Hindi-oriented voice experiences."
  },
  {
    id: "availability", title: "What if an item becomes unavailable?", icon: "bell",
    terms: ["unavailable item", "item unavailable", "dish unavailable", "sold out item", "stock finished", "no stock", "out of stock", "disable ordering"],
    answer: "Menu availability can be connected to operational and inventory information so unavailable dishes can be controlled. Production enforcement should always be server-side so multiple customers cannot bypass stock rules."
  },
  {
    id: "benefits", title: "What are the main benefits?", icon: "star",
    terms: ["benefit", "benefits", "advantage", "advantages", "value", "why should i use", "why use pratyeksha", "how can it help", "help my restaurant", "help my cafe"],
    answer: "The main value is connection: customers get an easier digital journey, while the business can connect menu, ordering, kitchen flow, billing, inventory, intelligence and marketing signals in one system. The exact business impact depends on how your current workflow is configured."
  },
  {
    id: "features", title: "What features are included?", icon: "layers",
    terms: ["features", "feature list", "included", "modules", "module", "what do i get", "what is included", "full feature list", "capabilities", "everything included"],
    answer: "Core capabilities include QR menu and ordering journeys, rich dish information, configured 3D and voice experiences, kitchen display workflows, billing with GST-oriented CGST/SGST flows, inventory and recipe relationships, analytics, feedback, customer signals, marketing workflows and multi-outlet operations where configured."
  },
  {
    id: "waitlist", title: "Can I manage a waitlist?", icon: "clock",
    terms: ["waitlist", "waiting list", "queue", "waiting queue", "walk in queue", "guest queue"],
    answer: "Yes. Waitlist functionality is part of the customer-experience feature set. The exact workflow can be configured around the restaurant's operating process."
  },
  {
    id: "reservation", title: "Can customers make reservations?", icon: "calendar",
    terms: ["reservation", "reservations", "reserve table", "table reservation", "booking table", "book a table", "table booking"],
    answer: "Yes. Reservation workflows are part of the platform direction. The exact reservation rules and availability should be confirmed for your deployed setup."
  },
  {
    id: "pickup", title: "Does it support pickup orders?", icon: "arrowUpRight",
    terms: ["pickup", "pick up", "takeaway", "take away", "pickup order", "takeaway order", "collect order"],
    answer: "Yes. Pickup and takeaway journeys are included in the platform's customer and operational workflows, with the exact flow depending on the configured business setup."
  },
  {
    id: "service", title: "Can guests request service from the table?", icon: "bell",
    terms: ["service request", "call waiter", "call staff", "request service", "table service", "waiter call", "need assistance", "ask waiter"],
    answer: "Yes. Service requests from the table are part of the customer-experience feature set, allowing configured restaurant teams to receive and handle guest requests through the connected workflow."
  },
  {
    id: "reorder", title: "Can returning customers reorder easily?", icon: "star",
    terms: ["reorder", "re order", "order again", "repeat order", "last order", "previous order", "returning customer", "repeat customer"],
    answer: "Yes. Remembered or favourite dishes and repeat-customer signals can support easier future ordering where those workflows are enabled."
  },
  {
    id: "customization", title: "Can the system fit my restaurant workflow?", icon: "layers",
    terms: ["customize", "customise", "customization", "customisation", "tailor", "tailored", "configured", "configuration", "fit my workflow", "my workflow"],
    answer: "Pratyeksha is designed around configured restaurant workflows. A private demo is the best way to map your current menu, ordering, kitchen, billing, inventory and customer processes to the relevant modules."
  },
  {
    id: "reports", title: "Can I export business reports?", icon: "chart",
    terms: ["export reports", "export report", "download report", "download reports", "csv report", "report export", "exportable reports", "business report"],
    answer: "Exportable reports are part of the intelligence feature set. The exact report formats and exports depend on the enabled production modules."
  },
  {
    id: "workload", title: "Can it reduce manual coordination?", icon: "users",
    terms: ["reduce manual work", "manual coordination", "less manual", "save staff time", "staff time", "reduce waiter work", "waiter workload", "manual workload"],
    answer: "Pratyeksha connects digital menu discovery, ordering, kitchen flow, billing, availability and customer signals, which can reduce some manual coordination. The actual time or staffing impact depends on the restaurant's workflow and adoption."
  },
];
const CHATBOT_QUERY_VARIANTS = [
  "what is", "tell me about", "explain", "how does", "how can", "can i", "can we", "does it", "do you support", "is there", "is it possible", "what about", "where can i", "why use", "how much", "how many", "who is it for", "is pratyeksha", "does pratyeksha", "can pratyeksha", "could you explain", "tell me whether", "i want to know", "give me details on", "is support available for"
];
const CHATBOT_TOPIC_VARIANTS = [
  "the platform", "the system", "the software", "this feature", "this workflow", "for my cafe", "for my restaurant", "for my business", "for my outlet", "for multiple outlets"
];
const CHATBOT_COVERAGE_ESTIMATE = CHATBOT_INTENTS.length * CHATBOT_QUERY_VARIANTS.length * CHATBOT_TOPIC_VARIANTS.length;
const CHATBOT_VERIFIED_INTENTS = CHATBOT_INTENTS.map(({ id, title, terms, answer }) => ({ id, title, terms, answer }));
const CHAT_TOPIC_SETS = {
  Discover: [
    ["What is Pratyeksha?", "spark"],
    ["Who is PRATYEKSHa for?", "users"],
    ["What are the main benefits?", "spark"],
    ["What features are included?", "layers"],
    ["How is it different from a normal restaurant app?", "spark"],
    ["Is it suitable for my café?", "coffee"],
    ["Is it suitable for my restaurant?", "utensils"],
    ["Can it support multiple outlets?", "layers"]
  ],
  Experience: [
    ["How does QR ordering work?", "qr"],
    ["What can a dish show?", "utensils"],
    ["Can customers see 3D dishes?", "box"],
    ["Can customers hear dish information?", "mic"],
    ["Does it support Marathi and Hindi?", "globe"],
    ["Can it remember favourite dishes?", "star"],
    ["Can guests request service from the table?", "bell"],
    ["Does it support pickup or takeaway?", "arrowUpRight"]
  ],
  Operations: [
    ["How does the kitchen work?", "kitchen"],
    ["Does the kitchen have timers?", "clock"],
    ["Does it support GST billing?", "billing"],
    ["Which payment methods can be used?", "billing"],
    ["How does inventory work?", "inventory"],
    ["Can recipes connect to ingredients?", "utensils"],
    ["Can unavailable dishes be controlled?", "shield"],
    ["What restaurant operations does it connect?", "layers"]
  ],
  Business: [
    ["What analytics are available?", "chart"],
    ["What is restaurant intelligence?", "brain"],
    ["How does marketing work?", "trending"],
    ["Does it support WhatsApp marketing?", "message"],
    ["What is the pricing?", "star"],
    ["How can I book a demo?", "arrowUpRight"],
    ["Can it integrate with other systems?", "layers"],
    ["How is customer data handled?", "shield"]
  ]
};
const CHAT_TOPIC_META = {
  Discover: ["spark", "Discover"],
  Experience: ["star", "Customer experience"],
  Operations: ["kitchen", "Operations"],
  Business: ["chart", "Business value"]
};
const normalizeChatText = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFKC")
  .replace(/[^\p{L}\p{N}\s₹+]/gu, " ")
  .replace(/\s+/g, " ")
  .trim();
const CHATBOT_QUESTION_MAP = Object.fromEntries(Object.values(CHAT_TOPIC_SETS).flat().map(([q]) => [normalizeChatText(q), q]));
const CHATBOT_FRIENDLY_OPENERS = { identity:"Absolutely — here’s the simple picture.", positioning:"Good question — the distinction is important.", businesses:"Absolutely — it is designed around real food businesses.", qr:"Yes — here’s how the customer journey works.", menu:"Of course — here’s how the menu experience works.", visibility:"Yes — availability can be controlled cleanly.", dish:"Absolutely — dishes can carry much richer information.", threeD:"Yes — this is one of the experience layers.", ordering:"Here’s what happens after the customer places an order.", kitchen:"Absolutely — the kitchen stays connected to the order flow.", timers:"Yes — timing visibility is built into the kitchen workflow.", billing:"Sure — here’s what the billing layer covers.", gst:"Yes — GST handling is part of the billing workflow.", invoice:"Here’s how invoice handling is structured.", inventory:"Absolutely — inventory is connected to the operational flow.", stock:"Yes — stock controls are important for preventing overselling.", analytics:"Absolutely — this is where the intelligence layer becomes useful.", intelligence:"Here’s what the intelligence layer is meant to help you understand.", marketing:"Yes — the marketing layer continues beyond the bill.", whatsapp:"Absolutely — customer engagement can continue after the visit.", security:"Security matters, so here is the verified scope.", integrations:"Here’s the safe answer without guessing about a specific integration.", multilingual:"Yes — language support is designed for real customer use.", pricing:"For pricing, I’d rather give you the current verified figure than guess.", demo:"Absolutely — seeing the workflow live is the easiest way to understand it.", contact:"Of course — here are the direct contact options.", difference:"The main difference is how the pieces are connected.", customerexperience:"Absolutely — the customer journey is a major part of the platform.", operations:"Here’s how the operational layer connects the restaurant.", staff:"Yes — the goal is to make each team’s workflow clearer.", payments:"Sure — here are the payment options supported in the configured billing flow.", languagevoice:"Yes — voice and language experiences can be configured for customers.", availability:"Yes — availability can be connected to operational state.", benefits:"Absolutely — the biggest value comes from connecting the moving parts.", features:"Here’s a clear view of the core feature set.", waitlist:"Yes — waitlist handling is part of the customer experience.", reservation:"Yes — reservation workflows can be supported where configured.", pickup:"Yes — pickup and takeaway can be part of the customer journey.", service:"Yes — guests can request assistance from the table.", reorder:"Absolutely — repeat visits can become much easier.", customization:"Yes — the system is designed around the restaurant’s workflow.", reports:"Yes — reporting can turn operational data into something useful.", workload:"That’s one of the practical goals — reducing unnecessary manual coordination." };
const scoreChatIntent = (question, intent) => {
  const q = normalizeChatText(question);
  const mapped = CHATBOT_QUESTION_MAP[q];
  let score = mapped && normalizeChatText(intent.title) === normalizeChatText(mapped) ? 100 : 0;
  const qTokens = new Set(q.split(" ").filter((x) => x.length > 2));
  for (const term of intent.terms) {
    const t = normalizeChatText(term);
    if (!t) continue;
    if (q === t) score += 40;
    else if (q.includes(t)) score += t.includes(" ") ? 9 : t.length >= 8 ? 6 : t.length >= 5 ? 4 : 2;
    const overlap = t.split(" ").filter((x) => qTokens.has(x)).length;
    if (overlap) score += overlap * 2;
  }
  return score;
};
const findLocalChatIntent = (question) => {
  const q = normalizeChatText(question);
  const exact = CHATBOT_INTENTS.find((intent) => normalizeChatText(intent.title) === q || intent.terms.some((term) => normalizeChatText(term) === q));
  if (exact) return exact;
  const ranked = CHATBOT_INTENTS.map((intent) => ({ intent, score: scoreChatIntent(question, intent) })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  return best?.score >= 5 && (!second || best.score - second.score >= 2) ? best.intent : null;
};
const buildLocalChatAnswer = (intent) => ({ text: `${CHATBOT_FRIENDLY_OPENERS[intent.id] || "Absolutely — here’s the verified answer."}\n\n${intent.answer}`, intent: intent.id, title: intent.title, icon: intent.icon || "spark" });
function PratyekshaChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTopic, setActiveTopic] = useState("Discover");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to PRATYEKSHa. I can help you explore the system — from QR ordering and customer experience to kitchen, billing, inventory, intelligence and marketing.",
      meta: "PRATYEKSHa knowledge assistant"
    }
  ]);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const openDemo = () => {
    setOpen(false);
    window.setTimeout(() => {
      document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };
  const fallbackAnswer = (question) => {
    const intent = findLocalChatIntent(question);
    if (intent) return buildLocalChatAnswer(intent);
    return { text: `I want to give you a precise answer rather than guess.\n\n${CHATBOT_KNOWLEDGE.contact.email}\n${CHATBOT_KNOWLEDGE.contact.phone}\n${CHATBOT_KNOWLEDGE.contact.alternatePhone}\n\nFor a feature, integration, implementation or commercial detail that is not verified here, book a private demo and the Pratyeksha team can confirm it for your business.`, intent: "unknown", title: "Let’s confirm that for you", icon: "phone" };
  };
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending]);
  const send = async (forcedText) => {
    const question = String(forcedText ?? input).trim().slice(0, 1200);
    if (!question || sending) return;
    setInput("");
    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    const local = fallbackAnswer(question);
    if (local.intent !== "unknown") {
      setMessages((prev) => [...prev, { role: "assistant", text: local.text, intent: local.intent, icon: local.icon, title: local.title, meta: "Verified PRATYEKSHa information" }]);
      setSending(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
          message: question,
          history: [...messages, userMessage].slice(-10).map((m) => ({ role: m.role, content: m.text })),
          knowledge: CHATBOT_KNOWLEDGE,
          verifiedIntents: CHATBOT_VERIFIED_INTENTS,
          answerPolicy: {
            coverage: `Use verified PRATYEKSHa information. The local intent matrix represents ${CHATBOT_COVERAGE_ESTIMATE.toLocaleString()}+ practical question variations.`,
            neverInvent: ["pricing", "features not listed", "integrations", "availability", "contracts", "performance guarantees", "security certifications"],
            unknownAction: `If the answer is not supported, clearly say so, provide ${CHATBOT_KNOWLEDGE.contact.email}, ${CHATBOT_KNOWLEDGE.contact.phone} and ${CHATBOT_KNOWLEDGE.contact.alternatePhone}, and encourage a private demo.`,
            style: "Premium, warm, concise, left-aligned, factual and helpful. Use short paragraphs or bullets when useful. Never pretend certainty when information is insufficient."
          }
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data?.answer !== "string" || !data.answer.trim()) throw new Error("chat_unavailable");
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: data.answer.trim().slice(0, 5000),
        title: "PRATYEKSHa assistant",
        icon: "spark",
        meta: data?.source === "knowledge" ? "Verified PRATYEKSHa information" : "PRATYEKSHa assistant",
        needsContact: Boolean(data?.needsContact)
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: local.text,
        title: local.title,
        icon: local.icon,
        fallback: true,
        intent: local.intent,
        meta: local.intent === "unknown" ? "A team member can confirm this" : "Verified PRATYEKSHa information"
      }]);
    } finally {
      window.clearTimeout(timeout);
      setSending(false);
    }
  };
  const suggestions = CHAT_TOPIC_SETS[activeTopic] || CHAT_TOPIC_SETS.Discover;
  const [topicIcon, topicLabel] = CHAT_TOPIC_META[activeTopic] || CHAT_TOPIC_META.Discover;
  return (
    <>
      {open && <div className="chat-backdrop is-open" onClick={() => setOpen(false)} aria-hidden="true" />}
      <button className={`chat-launcher ${open ? "is-open" : ""}`} onClick={() => setOpen((v) => !v)} aria-label={open ? "Close PRATYEKSHa assistant" : "Open PRATYEKSHa assistant"}>
        <span className="chat-launcher-glow" />
        <span className="chat-launcher-icon"><I name={open ? "close" : "spark"} size={21} /></span>
        {!open && <span className="chat-launcher-copy"><small>PRATYEKSHa</small><strong>Ask the system</strong></span>}
      </button>
      <aside className={`chat-panel ${open ? "is-open" : ""}`} aria-hidden={!open} aria-label="PRATYEKSHa AI assistant">
        <div className="chat-header">
          <div className="chat-agent-mark"><I name="spark" size={18} /></div>
          <div className="chat-agent-title">
            <span>PRATYEKSHa / AI ASSISTANT</span>
            <strong>Ask. Explore. Understand.</strong>
            <small><span className="chat-status-dot" /> {CHATBOT_COVERAGE_ESTIMATE.toLocaleString()}+ question variations covered</small>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close assistant"><I name="close" size={17} /></button>
        </div>
        <div className="chat-trust">
          <span className="chat-live-dot" /> Grounded in PRATYEKSHa information <span>•</span> No invented pricing
        </div>
        <div className="chat-topic-bar" aria-label="Question categories">
          {Object.keys(CHAT_TOPIC_SETS).map((topic) => {
            const [icon] = CHAT_TOPIC_META[topic];
            return (
              <button key={topic} className={activeTopic === topic ? "active" : ""} onClick={() => setActiveTopic(topic)}>
                <I name={icon} size={11} /> {topic}
              </button>
            );
          })}
        </div>
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div className={`chat-message-row ${message.role}`} key={`${message.role}-${index}`}>
              {message.role === "assistant" && <span className="chat-mini-mark"><I name="spark" size={11} /></span>}
              <div className="chat-message-stack">
                {message.role === "assistant" && <div className="chat-answer-heading"><span><I name={message.icon || "spark"} size={13} /></span><strong>{message.title || "PRATYEKSHa assistant"}</strong></div>}
                <div className="chat-bubble">{message.text}</div>
                {message.role === "assistant" && message.meta && <span className="chat-meta">{message.meta}</span>}
                {message.role === "assistant" && (message.needsContact || (message.fallback && message.intent === "unknown")) && (
                  <div className="chat-escalation">
                    <div className="chat-contact-title">
                      <span><I name="phone" size={13} /></span>
                      <div>
                        <strong>Need a precise answer?</strong>
                        <small>Talk directly with the PRATYEKSHa team</small>
                      </div>
                    </div>
                    <div className="chat-contact-links">
                      <a href={`mailto:${CHATBOT_KNOWLEDGE.contact.email}`}><I name="mail" size={12} /> {CHATBOT_KNOWLEDGE.contact.email}</a>
                      <a href={`tel:${CHATBOT_KNOWLEDGE.contact.phone.replace(/[^\d+]/g, "")}`}><I name="phone" size={12} /> {CHATBOT_KNOWLEDGE.contact.phone}</a>
                    </div>
                    <button onClick={openDemo}>Book a private demo <I name="arrowUpRight" size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="chat-message-row assistant">
              <span className="chat-mini-mark"><I name="spark" size={11} /></span>
              <div className="chat-message-stack">
                <div className="chat-bubble chat-typing"><i /><i /><i /><span>Thinking from PRATYEKSHa knowledge</span></div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="chat-suggestions-wrap">
          <div className="chat-suggestion-label">
            <span><I name={topicIcon} size={11} /> {topicLabel}</span>
            <small>Questions you can ask</small>
          </div>
          <div className="chat-suggestions">
            {suggestions.map(([item, icon]) => (
              <button key={item} onClick={() => send(item)}>
                <span><I name={icon} size={13} /></span>
                <b>{item}</b>
                <I name="arrow" size={11} />
              </button>
            ))}
          </div>
        </div>
        <form className="chat-input-wrap" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <span className="chat-input-icon"><I name="search" size={15} /></span>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value.slice(0, 1200))} placeholder="Ask your own question…" aria-label="Ask PRATYEKSHa assistant" maxLength={1200} />
          <span className="chat-counter">{input.length > 900 ? `${input.length}/1200` : ""}</span>
          <button type="submit" disabled={!input.trim() || sending} aria-label="Send question"><I name="arrow" size={17} /></button>
        </form>
        <div className="chat-footer-row">
          <span><I name="shield" size={10} /> Grounded answers</span>
          <span>•</span>
          <span><I name="users" size={10} /> Human confirmation for unknowns</span>
          <span>•</span>
          <button onClick={openDemo}>Book demo <I name="arrowUpRight" size={11} /></button>
        </div>
      </aside>
    </>
  );
}
function ProductVisual({ type }) {
  if (type === "experience") {
    return (
      <div className="visual-stage experience-stage">
        <div className="stage-glow stage-glow-one" />
        <div className="stage-glow stage-glow-two" />
        <div className="phone-shell">
          <div className="phone-top">
            <span>12:42</span>
            <span className="phone-signal">● ● ●</span>
          </div>
          <div className="menu-brand">
            <div>
              <span className="mini-kicker">JAY AMBE</span>
              <strong>Multi Fusion</strong>
            </div>
            <div className="mini-avatar">JA</div>
          </div>
          <div className="menu-search">
            <I name="search" size={13} />
            <span>Search dishes</span>
          </div>
          <div className="menu-tabs">
            <span className="active">Popular</span>
            <span>Starters</span>
            <span>Main</span>
            <span>Drinks</span>
          </div>
          <div className="dish-large">
            <div className="dish-image dish-one">
              <div className="dish-ring">
                <I name="utensils" size={26} />
              </div>
            </div>
            <div className="dish-info">
              <div>
                <strong>Paneer Tikka</strong>
                <span>Smoky • Chef special</span>
              </div>
              <button>
                <I name="plus" size={15} />
              </button>
            </div>
          </div>
          <div className="dish-row">
            <div className="mini-dish">
              <div className="mini-dish-image">🍽</div>
              <span>Veg Momos</span>
              <b>₹180</b>
            </div>
            <div className="mini-dish">
              <div className="mini-dish-image">✦</div>
              <span>Masala Pasta</span>
              <b>₹220</b>
            </div>
          </div>
          <div className="phone-bottom">
            <span>Table 12</span>
            <button>
              View order <I name="arrow" size={13} />
            </button>
          </div>
        </div>
        <div className="floating-note note-one">
          <I name="qr" size={16} />
          <div>
            <small>SCAN → EXPLORE</small>
            <strong>Table 12 active</strong>
          </div>
        </div>
        <div className="floating-note note-two">
          <I name="spark" size={15} />
          <div>
            <small>SMART SUGGESTION</small>
            <strong>Pairs well with this dish</strong>
          </div>
        </div>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
      </div>
    );
  }
  if (type === "kitchen") {
    return (
      <div className="visual-stage kitchen-stage">
        <div className="kitchen-header">
          <div>
            <span className="mini-kicker">KITCHEN DISPLAY</span>
            <h3>Service flow</h3>
          </div>
          <div className="live-status">
            <span />
            LIVE
          </div>
        </div>
        <div className="kitchen-columns">
          <div className="kitchen-column">
            <span className="column-title">NEW</span>
            <div className="ticket ticket-gold">
              <div className="ticket-top">
                <b>#1048</b>
                <span>02:18</span>
              </div>
              <strong>Table 12</strong>
              <p>Paneer Tikka × 2</p>
              <p>Veg Momos × 1</p>
              <div className="ticket-footer">
                <span>4 items</span>
                <button>
                  <I name="arrow" size={13} />
                </button>
              </div>
            </div>
            <div className="ticket">
              <div className="ticket-top">
                <b>#1049</b>
                <span>00:54</span>
              </div>
              <strong>Table 04</strong>
              <p>Masala Pasta × 2</p>
              <p>Cold Coffee × 2</p>
              <div className="ticket-footer">
                <span>4 items</span>
                <button>
                  <I name="arrow" size={13} />
                </button>
              </div>
            </div>
          </div>
          <div className="kitchen-column preparing">
            <span className="column-title">PREPARING</span>
            <div className="ticket active-ticket">
              <div className="ticket-top">
                <b>#1043</b>
                <span>08:24</span>
              </div>
              <strong>Table 08</strong>
              <p>Paneer Biryani × 2</p>
              <p>Butter Naan × 4</p>
              <div className="timer-line">
                <span />
              </div>
              <div className="ticket-footer">
                <span>Chef: Rahul</span>
                <button>
                  <I name="check" size={13} />
                </button>
              </div>
            </div>
          </div>
          <div className="kitchen-column">
            <span className="column-title">READY</span>
            <div className="ticket ready-ticket">
              <div className="ticket-top">
                <b>#1039</b>
                <span>12:02</span>
              </div>
              <strong>Table 03</strong>
              <p>Veg Burger × 2</p>
              <p>French Fries × 1</p>
              <div className="ready-label">
                <I name="check" size={12} /> Ready for pickup
              </div>
            </div>
          </div>
        </div>
        <div className="kitchen-bottom">
          <div>
            <I name="clock" size={16} />
            <span>Average prep time</span>
            <b>11m 42s</b>
          </div>
          <div>
            <I name="flame" size={16} />
            <span>Active tickets</span>
            <b>07</b>
          </div>
          <div>
            <I name="bell" size={16} />
            <span>Priority orders</span>
            <b>02</b>
          </div>
        </div>
      </div>
    );
  }
  if (type === "operations") {
    return (
      <div className="visual-stage operations-stage">
        <div className="operations-top">
          <div>
            <span className="mini-kicker">LIVE FLOOR</span>
            <h3>Restaurant overview</h3>
          </div>
          <div className="date-pill">TODAY · 12 SEP</div>
        </div>
        <div className="operations-grid">
          <div className="floor-map">
            <div className="floor-label">MAIN FLOOR</div>
            {[
              ["01", "occupied"],
              ["02", "available"],
              ["03", "occupied"],
              ["04", "occupied"],
              ["05", "available"],
              ["06", "occupied"],
              ["07", "available"],
              ["08", "occupied"],
              ["09", "available"],
              ["10", "occupied"],
              ["11", "available"],
              ["12", "occupied"],
            ].map(([table, status]) => (
              <div
                key={table}
                className={`floor-table ${status}`}
                style={{
                  "--x": `${((Number(table) - 1) % 4) * 23 + 5}%`,
                  "--y": `${Math.floor((Number(table) - 1) / 4) * 28 + 12}%`,
                }}
              >
                <span>{table}</span>
                <small>{status === "occupied" ? "₹" : "+"}</small>
              </div>
            ))}
            <div className="floor-legend">
              <span>
                <i className="occupied-dot" /> Occupied
              </span>
              <span>
                <i className="available-dot" /> Available
              </span>
            </div>
          </div>
          <div className="operation-side">
            <div className="metric-box">
              <span>Live revenue</span>
              <strong>₹48,920</strong>
              <small>
                <I name="trending" size={12} /> +18.4%
              </small>
            </div>
            <div className="metric-box">
              <span>Active orders</span>
              <strong>18</strong>
              <small>6 preparing</small>
            </div>
            <div className="mini-order">
              <div>
                <span className="mini-dot" />
                <strong>Table 12</strong>
              </div>
              <span>₹1,840</span>
            </div>
            <div className="mini-order">
              <div>
                <span className="mini-dot muted" />
                <strong>Table 08</strong>
              </div>
              <span>₹2,260</span>
            </div>
            <div className="mini-order">
              <div>
                <span className="mini-dot" />
                <strong>Table 03</strong>
              </div>
              <span>₹920</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (type === "intelligence") {
    return (
      <div className="visual-stage intelligence-stage">
        <div className="intelligence-top">
          <div>
            <span className="mini-kicker">RESTAURANT INTELLIGENCE</span>
            <h3>What is happening?</h3>
          </div>
          <div className="insight-period">
            <span>7D</span>
            <span className="active">30D</span>
            <span>90D</span>
          </div>
        </div>
        <div className="intelligence-metrics">
          <div>
            <span>Returning customers</span>
            <strong>38.6%</strong>
            <small>+7.2%</small>
          </div>
          <div>
            <span>Avg. order value</span>
            <strong>₹684</strong>
            <small>+12.8%</small>
          </div>
          <div>
            <span>Top dish</span>
            <strong>Paneer Tikka</strong>
            <small>214 orders</small>
          </div>
        </div>
        <div className="chart-panel">
          <div className="chart-y">
            <span>60k</span>
            <span>40k</span>
            <span>20k</span>
            <span>0</span>
          </div>
          <div className="chart">
            <svg viewBox="0 0 700 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a96a" stopOpacity=".32" />
                  <stop offset="100%" stopColor="#c9a96a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,190 C65,178 75,156 125,166 S190,130 230,142 S290,92 340,108 S400,125 450,83 S520,105 555,65 S620,76 700,30 L700,240 L0,240 Z"
                fill="url(#goldFill)"
              />
              <path
                d="M0,190 C65,178 75,156 125,166 S190,130 230,142 S290,92 340,108 S400,125 450,83 S520,105 555,65 S620,76 700,30"
                fill="none"
                stroke="#c9a96a"
                strokeWidth="3"
              />
              <circle cx="555" cy="65" r="5" fill="#e7d3a6" />
            </svg>
            <div className="chart-labels">
              <span>SEP 01</span>
              <span>SEP 07</span>
              <span>SEP 14</span>
              <span>SEP 21</span>
              <span>SEP 30</span>
            </div>
          </div>
        </div>
        <div className="ai-insight">
          <div className="ai-icon">
            <I name="brain" size={17} />
          </div>
          <div>
            <span>Pratyeksha SIGNAL</span>
            <strong>
              Weekend dinner orders are trending toward premium combos.
            </strong>
          </div>
          <I name="arrowUpRight" size={17} />
        </div>
      </div>
    );
  }
  return (
    <div className="visual-stage marketing-stage">
      <div className="marketing-top">
        <div>
          <span className="mini-kicker">CUSTOMER RELATIONSHIP</span>
          <h3>Make the next visit personal.</h3>
        </div>
        <div className="campaign-status">
          <span /> Campaign live
        </div>
      </div>
      <div className="customer-profile">
        <div className="profile-avatar">A</div>
        <div>
          <span>RETURNING CUSTOMER</span>
          <strong>Akshay Patil</strong>
        </div>
        <div className="profile-score">
          <small>RETURN SCORE</small>
          <b>84</b>
        </div>
      </div>
      <div className="marketing-grid">
        <div className="preference-panel">
          <span className="panel-kicker">REMEMBERED</span>
          <div className="preference">
            <I name="utensils" size={16} />
            <div>
              <strong>Paneer dishes</strong>
              <span>Ordered 8 times</span>
            </div>
          </div>
          <div className="preference">
            <I name="coffee" size={16} />
            <div>
              <strong>Cold Coffee</strong>
              <span>Often ordered with dinner</span>
            </div>
          </div>
          <div className="preference">
            <I name="star" size={16} />
            <div>
              <strong>Chef specials</strong>
              <span>High engagement</span>
            </div>
          </div>
        </div>
        <div className="campaign-card">
          <div className="campaign-visual">
            <I name="spark" size={25} />
          </div>
          <div>
            <span>PERSONALISED CAMPAIGN</span>
            <strong>“Something familiar?”</strong>
            <p>Invite Akshay back with a dish he already loves.</p>
          </div>
          <button>
            Send campaign <I name="send" size={14} />
          </button>
        </div>
      </div>
      <div className="marketing-footer">
        <div>
          <I name="message" size={15} />
          WhatsApp ready
        </div>
        <span>1,284 reachable customers</span>
      </div>
    </div>
  );
}
function NotFoundPage({ onHome }) {
  useEffect(() => {
    document.title = PAGE_META.notFound.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", PAGE_META.notFound.description);
  }, []);
  return (
    <div className="special-page special-page-404">
      <style>{CSS}</style>
      <div className="special-page-glow" />
      <BrandLogo className="special-logo" alt="Pratyeksha logo" />
      <span className="special-kicker">404 / PAGE NOT FOUND</span>
      <h1>This page took a<br /><em>wrong turn.</em></h1>
      <p>The page you requested does not exist or may have moved. Return to the restaurant experience system and continue exploring.</p>
      <button className="button primary" onClick={onHome}>Back to Pratyeksha <I name="arrow" size={16} /></button>
    </div>
  );
}
function ThankYouPage({ onHome, onDemo }) {
  useEffect(() => {
    document.title = PAGE_META.thankYou.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", PAGE_META.thankYou.description);
  }, []);
  return (
    <div className="special-page special-page-thanks">
      <style>{CSS}</style>
      <BrandLogo className="special-logo" alt="Pratyeksha logo" />
      <div className="thank-icon"><I name="check" size={28} /></div>
      <span className="special-kicker">REQUEST RECEIVED</span>
      <h1>Your next restaurant<br /><em>conversation starts here.</em></h1>
      <p>Thanks for requesting a private demo. Our team will review the details and contact you using the information you provided.</p>
      <div className="special-actions">
        <button className="button primary" onClick={onHome}>Back to website <I name="arrow" size={16} /></button>
        <button className="button secondary" onClick={onDemo}>Send another request</button>
      </div>
      <small className="special-note">If you need us sooner: hello.pratyeksha@gmail.com</small>
    </div>
  );
}
function CookieBanner({ consent, onAccept, onReject, onManage }) {
  if (consent) return null;
  return (
    <aside className="cookie-banner" role="dialog" aria-label="Privacy and analytics preferences" aria-live="polite">
      <div className="cookie-copy">
        <strong>Privacy first.</strong>
        <p>We use essential storage to run this website. Optional analytics help us understand visits and improve the experience. Analytics stays off until you choose it.</p>
        <span>Read our <button type="button" onClick={onManage}>Privacy Policy</button>. You can change analytics consent later from Privacy Settings.</span>
      </div>
      <div className="cookie-actions">
        <button type="button" className="cookie-secondary" onClick={onReject}>Essential only</button>
        <button type="button" className="cookie-secondary" onClick={onManage}>Privacy Policy</button>
        <button type="button" className="cookie-primary" onClick={onAccept}>Allow analytics</button>
      </div>
    </aside>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    if (typeof console !== "undefined" && console.error) {
      console.error("Pratyeksha frontend error", error, info);
    }
  }
  handleReload = () => {
    window.location.reload();
  };
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        background: "#11100d",
        color: "#f5efe3",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{
            width: 48,
            height: 48,
            margin: "0 auto 22px",
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(211,191,162,.35)",
            borderRadius: 12,
            color: "#d3bfa2",
          }}>
            <I name="spark" size={20} />
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(28px,5vw,42px)", lineHeight: 1.08 }}>
            Something needs a refresh.
          </h1>
          <p style={{ margin: "0 0 24px", color: "rgba(245,239,227,.68)", lineHeight: 1.7 }}>
            The website encountered an unexpected error. Your information has not been displayed here.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              border: "1px solid rgba(211,191,162,.45)",
              background: "#d3bfa2",
              color: "#11100d",
              borderRadius: 999,
              padding: "12px 20px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reload website
          </button>
        </div>
      </div>
    );
  }
}
function App() {
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [openFaq, setOpenFaq] = useState(-1);
  const [activeSection, setActiveSection] = useState("home");
  const [activeProduct, setActiveProduct] = useState("experience");
  const [cursorActive, setCursorActive] = useState(false);
  const [legalPage, setLegalPage] = useState(() => {
    const path = getPath();
    return path === "/privacy" ? "privacy" : path === "/terms" ? "terms" : null;
  });
  const [currentPath, setCurrentPath] = useState(() => {
    const path = getPath();
    return path === "/privacy" || path === "/terms" ? "/landing" : path;
  });
  const [cookieConsent, setCookieConsent] = useState(() => readConsent());
  const [showConsentSettings, setShowConsentSettings] = useState(false);
  const activeProductIndex = Object.keys(PRODUCTS).indexOf(activeProduct);
  const activeProductData = PRODUCTS[activeProduct];
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    business: "",
    phone: "",
    email: "",
    type: "",
    message: "",
    website: "",
    privacyConsent: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  useEffect(() => {
    document.body.classList.add("pratyeksha-page");
    const timer = setTimeout(() => {
      setLoading(false);
    }, 900);
    return () => {
      clearTimeout(timer);
      document.body.classList.remove("pratyeksha-page");
    };
  }, []);
  useEffect(() => {
    const handlePopState = () => {
      const path = getPath();
      if (path === "/privacy" || path === "/terms") {
        setCurrentPath("/landing");
        setLegalPage(path.slice(1));
        window.history.replaceState({}, "", "/landing");
      } else {
        setCurrentPath(path);
        setLegalPage(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  useEffect(() => {
    const path = getPath();
    if (path === "/privacy" || path === "/terms") {
      setLegalPage(path.slice(1));
      setCurrentPath("/landing");
      window.history.replaceState({}, "", "/landing");
    }
    if (path === "/thank-you") setSent(true);
  }, []);
  useEffect(() => {
    if (!cookieConsent?.analytics || !GA_MEASUREMENT_ID) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    if (!document.querySelector(`script[data-pratyeksha-ga="${GA_MEASUREMENT_ID}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
      script.dataset.pratyekshaGa = GA_MEASUREMENT_ID;
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true, send_page_view: true });
    } else {
      window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true, send_page_view: true });
    }
  }, [cookieConsent]);
  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag && GA_MEASUREMENT_ID) {
      window.gtag("event", "page_view", { page_title: document.title, page_location: window.location.href });
    }
  }, [currentPath, legalPage, sent]);
  useEffect(() => {
    if (cookieConsent || !showConsentSettings) return;
  }, [cookieConsent, showConsentSettings]);
  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    const pageKey = currentPath === "/privacy" || legalPage === "privacy"
      ? "privacy"
      : currentPath === "/terms" || legalPage === "terms"
        ? "terms"
        : currentPath === "/thank-you" || sent
          ? "thankYou"
          : SITE_PATHS.includes(currentPath) ? "home" : "notFound";
    const title = PAGE_META[pageKey].title;
    const description = PAGE_META[pageKey].description;
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    let theme = document.querySelector('meta[name="theme-color"]');
    if (!theme) {
      theme = document.createElement("meta");
      theme.name = "theme-color";
      document.head.appendChild(theme);
    }
    theme.setAttribute("content", legalPage ? "#faf6ee" : "#11100d");
    let referrer = document.querySelector('meta[name="referrer"]');
    if (!referrer) { referrer = document.createElement("meta"); referrer.name = "referrer"; document.head.appendChild(referrer); }
    referrer.setAttribute("content", "strict-origin-when-cross-origin");
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.setAttribute("content", "index,follow,max-image-preview:large");
    const canonicalUrl = window.location.origin + window.location.pathname;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
    const setMeta = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:type", "website");
    setMeta("og:url", canonicalUrl);
    setMeta("og:image", `${window.location.origin}/og-image.png`);
    setMeta("og:image:alt", "Pratyeksha restaurant experience system logo");
    let structuredData = document.getElementById("pratyeksha-structured-data");
    if (!structuredData) {
      structuredData = document.createElement("script");
      structuredData.id = "pratyeksha-structured-data";
      structuredData.type = "application/ld+json";
      document.head.appendChild(structuredData);
    }
    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Pratyeksha",
      url: canonicalUrl,
      email: "hello.pratyeksha@gmail.com",
      telephone: "+91 87676 22654",
      description: "Restaurant experience system for cafés and restaurants."
    });
  }, [legalPage, currentPath, sent]);
  useEffect(() => {
    const sectionIds = ["home", "system", "experience", "operations", "intelligence", "marketing", "signature", "journey", "command", "fusion", "faq", "demo"];
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const doc = document.documentElement;
      const total = Math.max(0, doc.scrollHeight - window.innerHeight);
      setProgress(total > 0 ? Math.min(100, (y / total) * 100) : 0);
      let current = "home";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.34) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeLegal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px",
      }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, legalPage]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (!legalPage && !loading) {
      requestAnimationFrame(() => {
        document.querySelectorAll(".site .reveal").forEach((el) => {
          el.classList.remove("visible");
        });
        requestAnimationFrame(() => {
          document.querySelectorAll(".site .reveal").forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.95) el.classList.add("visible");
          });
          window.dispatchEvent(new Event("scroll"));
        });
      });
    }
  }, [legalPage, loading]);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let raf;
    const move = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const animate = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx}px,${my}px,0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      }
      raf = requestAnimationFrame(animate);
    };
    const activate = () => setCursorActive(true);
    const deactivate = () => setCursorActive(false);
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseenter", activate);
    document.addEventListener("mouseleave", deactivate);
    animate();
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseenter", activate);
      document.removeEventListener("mouseleave", deactivate);
      cancelAnimationFrame(raf);
    };
  }, []);
  useEffect(() => {
    const targets = document.querySelectorAll(
      "a,button,.feature-card,.module-visual,.use-card"
    );
    const enter = () => {
      document.body.classList.add("cursor-large");
    };
    const leave = () => {
      document.body.classList.remove("cursor-large");
    };
    targets.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });
    return () => {
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, [loading, mobileOpen, legalPage]);
  const openLegal = (page) => {
    setMobileOpen(false);
    setLegalPage(page);
    setCurrentPath("/landing");
    // Privacy Policy and Terms intentionally stay on the main URL.
  };
  const closeLegal = () => {
    setLegalPage(null);
    setCurrentPath("/landing");
  };
  const goHome = () => {
    setSent(false);
    setLegalPage(null);
    setCurrentPath("/landing");
    pushPath("/landing");
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }), 20);
  };
  const goDemoAgain = () => {
    setSent(false);
    setCurrentPath("/landing");
    pushPath("/landing");
    window.setTimeout(() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };
  const updateConsent = (analytics) => {
    const next = saveConsent(analytics);
    setCookieConsent(next);
    setShowConsentSettings(false);
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", { analytics_storage: analytics ? "granted" : "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    }
  };
  const scrollTo = (id) => {
    setMobileOpen(false);
    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (!target) return;
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });
  };
  const updateForm = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "type" && value && !ALLOWED_BUSINESS_TYPES.has(value)) return;
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
    } else {
      const max = MAX_FORM[name];
      const safeValue = typeof max === "number" ? value.slice(0, max) : value;
      setForm((p) => ({ ...p, [name]: safeValue }));
    }
    setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (formError) setFormError("");
  };
  const validateDemo = () => {
    const errors = {};
    const name = form.name.trim();
    const business = form.business.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!name) errors.name = "Your name is required.";
    if (!business) errors.business = "Business name is required.";
    if (!phone) errors.phone = "Phone number is required.";
    else if (!/^[+0-9()\-\s]{8,20}$/.test(phone)) errors.phone = "Enter a valid phone number.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!ALLOWED_BUSINESS_TYPES.has(form.type)) errors.type = "Select a business type.";
    if (!form.privacyConsent) errors.privacyConsent = "Please confirm the privacy notice before submitting.";
    if (name.length > MAX_FORM.name || business.length > MAX_FORM.business || phone.length > MAX_FORM.phone || email.length > MAX_FORM.email || form.message.trim().length > MAX_FORM.message) {
      errors.form = "One or more fields are too long.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setFormError(errors.form || "Please review the highlighted fields.");
      return false;
    }
    setFormError("");
    return true;
  };
  const submitDemo = async (e) => {
    e.preventDefault();
    if (sending) return;
    const name = form.name.trim();
    const business = form.business.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const website = form.website.trim();
    if (website) {
      setSent(true);
      setFormError("");
      return;
    }
    if (!validateDemo()) return;
    setSending(true);
    setFormError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${API}/demo-request`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        referrerPolicy: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          name,
          business,
          phone,
          email,
          type: form.type,
          message: form.message.trim(),
          website,
          privacyConsent: true,
          consentVersion: CONSENT_VERSION,
        }),
        signal: controller.signal,
      });
      let result = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          result = await response.json();
        } catch {
          result = null;
        }
      }
      if (!response.ok) {
        throw new Error(
          result && typeof result.message === "string" && result.message.length < 180
            ? result.message
            : `Demo request failed with ${response.status}`
        );
      }
      setSent(true);
      setCurrentPath("/thank-you");
      pushPath("/thank-you");
      setForm({
        name: "",
        business: "",
        phone: "",
        email: "",
        type: "",
        message: "",
        website: "",
        privacyConsent: false,
      });
    } catch (error) {
      setFormError(
        error?.name === "AbortError"
          ? "The request took too long. Please check your connection and try again."
          : "We couldn't send your request right now. Please try again or contact us directly."
      );
    } finally {
      window.clearTimeout(timeout);
      setSending(false);
    }
  };
  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="loading-screen">
          <div className="loading-orbit orbit-one" />
          <div className="loading-orbit orbit-two" />
          <div className="loading-center" role="status" aria-live="polite" aria-label="Loading Pratyeksha">
            <BrandLogo className="loading-brand-image" alt="Pratyeksha logo" />
            <div className="loading-line">
              <span />
            </div>
            <div className="loading-label">
              RESTAURANT EXPERIENCE SYSTEM
            </div>
            <div className="loading-status">
              Preparing your experience
            </div>
          </div>
        </div>
      </>
    );
  }
  if (!SITE_PATHS.includes(currentPath)) {
    return <NotFoundPage onHome={goHome} />;
  }
  if (currentPath === "/thank-you" || sent) {
    return <ThankYouPage onHome={goHome} onDemo={goDemoAgain} />;
  }
  if (legalPage) {
    const isPrivacy = legalPage === "privacy";
    return (
      <div className="legal-page-shell">
        <style>{CSS}</style>
        <header className="legal-nav">
          <button className="legal-brand" onClick={closeLegal} aria-label="Back to Pratyeksha home">
            <BrandLogo className="legal-brand-image" alt="Pratyeksha logo" />
          </button>
          <button className="legal-close" onClick={closeLegal}>
            <span>Back to website</span><I name="arrow" size={15} />
          </button>
        </header>
        <main className="legal-main">
          <section className="legal-hero">
            <div className="legal-hero-orbit orbit-a" />
            <div className="legal-hero-orbit orbit-b" />
            <div className="legal-hero-copy">
              <div className="eyebrow">Pratyeksha / LEGAL</div>
              <div className="legal-index">{isPrivacy ? "01 / PRIVACY" : "02 / TERMS"}</div>
              <h1>{isPrivacy ? <>Privacy <em>Policy</em></> : <>Terms of <em>Use</em></>}</h1>
              <p>
                {isPrivacy
                  ? "A clear explanation of how Pratyeksha handles information across its website, product enquiries and customer-facing experiences."
                  : "The terms that govern access to the Pratyeksha website, platform information, demos and related services."}
              </p>
              <div className="legal-meta">
                <span>Last updated: 24 September 2026</span>
                <span>India</span>
              </div>
            </div>
            <div className="legal-hero-card">
              <div className="legal-card-mark"><I name={isPrivacy ? "shield" : "layers"} size={22} /></div>
              <span>{isPrivacy ? "YOUR INFORMATION" : "YOUR USE"}</span>
              <strong>{isPrivacy ? "Clear, purposeful, responsible." : "Simple rules. Clear expectations."}</strong>
              <small>{isPrivacy ? "We collect and use information only for defined business and product purposes." : "Use Pratyeksha responsibly and respect the people, systems and businesses connected to it."}</small>
            </div>
          </section>
          <section className="legal-layout">
            <aside className="legal-toc">
              <span>ON THIS PAGE</span>
              {(isPrivacy ? ["Information we collect","Purpose & lawful processing","Sharing & service providers","Cookies & analytics","Security & retention","Your rights & grievances","Children's privacy","Changes & contact"] : ["Acceptance","Using the website","Accounts & enquiries","Intellectual property","Third-party services","Availability","Disclaimers","Liability","Governing law","Changes & contact"]).map((item, i) => (
                <a key={item} href={`#legal-${i + 1}`}>{String(i + 1).padStart(2,"0")} <span>{item}</span></a>
              ))}
            </aside>
            <article className="legal-document">
              {isPrivacy ? (
                <>
                  <section id="legal-1" className="legal-block"><span className="legal-num">01</span><div><h2>Information we collect</h2><p>Pratyeksha may receive information you voluntarily provide when you contact us, request a demo, communicate with our team or use a product feature. This can include your name, business name, phone number, email address, outlet information and the contents of your enquiry.</p><p>When the platform is used by a restaurant or café, operational information may also be processed on behalf of that business, such as menu, order, inventory, billing or customer-experience data configured by the business.</p></div></section>
                  <section id="legal-2" className="legal-block"><span className="legal-num">02</span><div><h2>Purpose, notice & lawful processing</h2><p>We collect only the information reasonably needed for the stated purpose, such as responding to a demo request, arranging a walkthrough, providing requested services, maintaining security or meeting legal obligations. Where consent is the basis for processing, the notice explains the purpose before the information is submitted and consent is requested through a clear affirmative action.</p><p>You may withdraw consent where processing is based on consent. Withdrawal will not affect processing already carried out lawfully before withdrawal, and some services may no longer be available where the information is necessary for the requested service.</p></div></section>
                  <section id="legal-3" className="legal-block"><span className="legal-num">03</span><div><h2>Sharing & service providers</h2><p>We may share information with trusted technology and service providers that help us operate the website or platform, such as hosting, database, analytics, communication and infrastructure providers. They receive only the information reasonably necessary for the service they provide.</p><p>We may also disclose information where required by law, to protect rights and safety, prevent abuse or fraud, or as part of a business transfer such as a merger, acquisition or restructuring.</p></div></section>
                  <section id="legal-4" className="legal-block"><span className="legal-num">04</span><div><h2>Cookies & analytics</h2><p>Pratyeksha may use cookies, local storage or similar technologies to keep the website functional, remember preferences, understand usage and improve the experience. Third-party analytics or embedded services may use their own technologies subject to their respective policies.</p><p>You can control cookies through your browser settings. Disabling some technologies may affect certain website functions.</p></div></section>
                  <section id="legal-5" className="legal-block"><span className="legal-num">05</span><div><h2>Security, retention & incidents</h2><p>We use reasonable technical and organisational safeguards designed to protect personal data against unauthorised access, loss, misuse or alteration. If a personal-data breach occurs, we will follow the notification and response obligations applicable to us under the DPDP framework and other applicable law.</p><p>Personal data is retained only for as long as reasonably necessary for the stated purpose, contractual or operational needs, dispute resolution, legal obligations and applicable retention requirements, after which it is deleted or anonymised where appropriate.</p></div></section>
                  <section id="legal-6" className="legal-block"><span className="legal-num">06</span><div><h2>Your rights & grievance redressal</h2><p>Subject to applicable law, you may request access to information about your personal data, correction or updating of inaccurate data, erasure where retention is not required, withdrawal of consent where consent is the processing basis, and grievance redressal. Requests can be made using the contact details below. We may verify a request before acting on it.</p><p>For privacy questions or grievances, contact hello.pratyeksha@gmail.com. We will maintain a readily available channel for privacy-related requests and respond within the period required by applicable law.</p></div></section>
                  <section id="legal-7" className="legal-block"><span className="legal-num">07</span><div><h2>Children's privacy</h2><p>Pratyeksha is designed for businesses and general audiences and is not directed at children. We do not knowingly request personal information from children for independent account creation. If you believe a child has provided information to us, contact us so we can review and take appropriate action.</p></div></section>
                  <section id="legal-8" className="legal-block"><span className="legal-num">08</span><div><h2>Changes & contact</h2><p>We may update this policy when our services, technology or legal obligations change. The latest version will be posted on this page with its updated date.</p><div className="legal-contact"><strong>Privacy questions?</strong><a href="mailto:hello.pratyeksha@gmail.com">hello.pratyeksha@gmail.com</a><span>+91 87676 22654 · +91 86050 15294</span></div></div></section>
                </>
              ) : (
                <>
                  <section id="legal-1" className="legal-block"><span className="legal-num">01</span><div><h2>Acceptance</h2><p>By accessing the Pratyeksha website or requesting and using its services, you agree to these Terms of Use. If you are using Pratyeksha for a business, you confirm that you are authorised to act for that business.</p></div></section>
                  <section id="legal-2" className="legal-block"><span className="legal-num">02</span><div><h2>Using the website</h2><p>You may use the website for lawful purposes, including learning about Pratyeksha, contacting our team and requesting a product demonstration. You must not misuse the website, interfere with its operation, attempt unauthorised access, introduce malicious code or use automated activity that places unreasonable load on our systems.</p></div></section>
                  <section id="legal-3" className="legal-block"><span className="legal-num">03</span><div><h2>Accounts & enquiries</h2><p>Information submitted through a demo or contact form should be accurate and current. A demo request does not by itself create a customer contract, subscription or guarantee of service availability.</p><p>Any paid service, subscription, implementation, support level or commercial commitment is governed by the applicable order form, proposal, agreement or service terms provided to the customer.</p></div></section>
                  <section id="legal-4" className="legal-block"><span className="legal-num">04</span><div><h2>Intellectual property</h2><p>The Pratyeksha name, branding, website design, visual system, original content, software, interfaces and related materials are owned by or licensed to Pratyeksha and are protected by applicable intellectual-property laws. You may not copy, modify, distribute or commercially exploit them without permission.</p></div></section>
                  <section id="legal-5" className="legal-block"><span className="legal-num">05</span><div><h2>Third-party services</h2><p>Pratyeksha may integrate with or link to third-party services. Those services are governed by their own terms and privacy policies. We are not responsible for third-party services outside our control.</p></div></section>
                  <section id="legal-6" className="legal-block"><span className="legal-num">06</span><div><h2>Availability</h2><p>We aim to keep the website and platform reliable, but services may occasionally be unavailable because of maintenance, updates, infrastructure issues, network conditions or circumstances beyond our reasonable control.</p></div></section>
                  <section id="legal-7" className="legal-block"><span className="legal-num">07</span><div><h2>Disclaimers</h2><p>Website content is provided for general informational purposes. Features, integrations, pricing, availability and product capabilities may change. Nothing on the website constitutes financial, legal, tax, accounting or other professional advice.</p></div></section>
                  <section id="legal-8" className="legal-block"><span className="legal-num">08</span><div><h2>Liability</h2><p>To the extent permitted by applicable law, Pratyeksha will not be responsible for indirect, incidental, special or consequential losses arising from use of the website or information on it. Nothing in these terms excludes liability that cannot lawfully be excluded.</p></div></section>
                  <section id="legal-9" className="legal-block"><span className="legal-num">09</span><div><h2>Governing law</h2><p>These terms are intended to be governed by the laws applicable in India, subject to any mandatory rights or protections available to you under applicable law. Any contractual dispute will be handled in the jurisdiction agreed in the applicable customer agreement.</p></div></section>
                  <section id="legal-10" className="legal-block"><span className="legal-num">10</span><div><h2>Changes & contact</h2><p>We may update these terms as the website or services evolve. Continued use after an updated version is published constitutes acceptance of the updated terms to the extent permitted by law.</p><div className="legal-contact"><strong>Questions about these terms?</strong><a href="mailto:hello.pratyeksha@gmail.com">hello.pratyeksha@gmail.com</a><span>+91 87676 22654 · +91 86050 15294</span></div></div></section>
                </>
              )}
            </article>
          </section>
        </main>
        <footer className="legal-footer">
          <span>© {new Date().getFullYear()} Pratyeksha</span>
          <span>Built for cafés & restaurants.</span>
          <div>
            <button onClick={() => openLegal("privacy")}>Privacy Policy</button>
            <button onClick={() => openLegal("terms")}>Terms of Use</button>
            <button onClick={() => setShowConsentSettings(true)}>Privacy Settings</button>
          </div>
        </footer>
      </div>
    );
  }
  return (
    <div className="site">
      <style>{CSS}</style>
      {}
      <div
        ref={dotRef}
        className={`cursor-dot ${cursorActive ? "active" : ""}`}
      />
      <div
        ref={ringRef}
        className={`cursor-ring ${cursorActive ? "active" : ""}`}
      />
      {}
      <div
        className="scroll-progress"
        style={{ width: `${progress}%` }}
      />
      {}
      <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <button
          className="brand"
          onClick={() => scrollTo("home")}
          aria-label="Pratyeksha home"
        >
          <span className="brand-logo-wrap">
            <BrandLogo className="nav-brand-image" alt="Pratyeksha logo" />
          </span>
        </button>
        <nav className="desktop-nav">
          <button
            className={activeSection === "system" ? "active" : ""}
            onClick={() => scrollTo("system")}
          >
            System
          </button>
          <button
            className={activeSection === "experience" ? "active" : ""}
            onClick={() => scrollTo("experience")}
          >
            Experience
          </button>
          <button
            className={activeSection === "operations" ? "active" : ""}
            onClick={() => scrollTo("operations")}
          >
            Operations
          </button>
          <button
            className={activeSection === "intelligence" ? "active" : ""}
            onClick={() => scrollTo("intelligence")}
          >
            Intelligence
          </button>
          <button onClick={() => scrollTo("demo")} className="nav-demo">
            Book Demo
          </button>
        </nav>
        <button
          className="mobile-menu-button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <I name="menu" size={22} />
        </button>
      </header>
      {}
      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        <button
          className="mobile-close"
          onClick={() => setMobileOpen(false)}
        >
          <I name="close" size={24} />
        </button>
        <div className="mobile-menu-inner">
          <BrandLogo className="mobile-brand-image" alt="Pratyeksha logo" />
          {[
            ["home", "Home"],
            ["system", "System"],
            ["experience", "Experience"],
            ["operations", "Operations"],
            ["intelligence", "Intelligence"],
            ["marketing", "Marketing"],
            ["demo", "Book a Demo"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {}
      <main>
        <section id="home" className="hero">
          <div className="hero-left">
            <div className="hero-eyebrow reveal">
              <span />
              BUILT FOR CAFÉS + RESTAURANTS
            </div>
            <h1 className="hero-title reveal delay-1">
              The digital layer
              <br />
              behind a{" "}
              <em>
                better
                <br />
                food experience.
              </em>
            </h1>
            <p className="hero-description reveal delay-2">
              Pratyeksha connects your customer menu, kitchen,
              billing, inventory, analytics and marketing into one
              intelligent restaurant experience system.
            </p>
            <div className="hero-actions reveal delay-3">
              <button
                className="button primary"
                onClick={() => scrollTo("demo")}
              >
                Book a Private Demo
                <I name="arrow" size={16} />
              </button>
              <button
                className="button secondary"
                onClick={() => scrollTo("system")}
              >
                Explore the System
              </button>
            </div>
            <div className="hero-cta-note"><I name="shield" size={13} /> Private walkthrough · no pressure · built around your workflow</div>
            <div className="hero-meta reveal delay-4">
              <div>
                <strong>01</strong>
                <span>Customer</span>
              </div>
              <div>
                <strong>02</strong>
                <span>Operations</span>
              </div>
              <div>
                <strong>03</strong>
                <span>Intelligence</span>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-glow" />
            <div className="hero-orbit orbit-a" />
            <div className="hero-orbit orbit-b" />
            <div className="restaurant-card">
              <div className="restaurant-top">
                <div>
                  <small>LIVE RESTAURANT</small>
                  <BrandLogo className="restaurant-brand-image" alt="Pratyeksha logo" />
                </div>
                <span className="live">
                  <i />
                  LIVE
                </span>
              </div>
              <div className="table-scene">
                <div className="table-circle">
                  <div className="dish dish-one" />
                  <div className="dish dish-two" />
                  <div className="dish dish-three" />
                  <div className="glass" />
                </div>
                <div className="scene-label">
                  <span>TABLE 12</span>
                  <strong>Order Experience</strong>
                </div>
              </div>
              <div className="restaurant-stats">
                <div>
                  <small>ORDERS</small>
                  <strong>24</strong>
                </div>
                <div>
                  <small>KITCHEN</small>
                  <strong>08</strong>
                </div>
                <div>
                  <small>TABLES</small>
                  <strong>17</strong>
                </div>
              </div>
              <div className="mini-order">
                <div className="mini-icon">
                  <I name="qr" size={16} />
                </div>
                <div>
                  <strong>Smart Menu Active</strong>
                  <span>3D · Voice · Bilingual</span>
                </div>
                <div className="mini-arrow">
                  <I name="arrow" size={15} />
                </div>
              </div>
            </div>
            <div className="floating-note note-one">
              <I name="mic" size={15} />
              <div>
                <small>VOICE MENU</small>
                <strong>English · मराठी</strong>
              </div>
            </div>
            <div className="floating-note note-two">
              <I name="chart" size={15} />
              <div>
                <small>INTELLIGENCE</small>
                <strong>+24.8% insight</strong>
              </div>
            </div>
          </div>
          <div className="hero-scroll">
            <span>SCROLL TO EXPLORE</span>
            <i />
          </div>
        </section>
        {}
        <section id="system" className="product-section">
          <div className="product-section-inner">
            <div className="section-head">
              <div>
                <span className="eyebrow">The Pratyeksha system</span>
                <h2>Five layers. One restaurant experience.</h2>
              </div>
              <p>Instead of forcing every part of the restaurant into one dashboard, each layer gets an interface designed around the job it needs to perform.</p>
            </div>
            <div className="product-tabs">
              {Object.entries(PRODUCTS).map(([key, item]) => (
                <button key={key} className={`product-tab ${activeProduct === key ? "active" : ""}`} onClick={() => setActiveProduct(key)} aria-label={`View ${item.eyebrow}`}>
                  <div className="product-tab-top">
                    <span className="product-tab-number">{item.number}</span>
                    <I name={{experience:"phone",kitchen:"kitchen",operations:"layers",intelligence:"chart",marketing:"spark"}[key]} size={15} className="product-tab-icon" />
                  </div>
                  <strong>{item.eyebrow}</strong>
                </button>
              ))}
            </div>
            <div className="product-detail">
              <div className="product-copy reveal" key={activeProduct}>
                <div className="product-copy-top">
                  <span className="section-number">{activeProductData.number}</span>
                  <h3>{activeProductData.title}</h3>
                  <p>{activeProductData.description}</p>
                  <div className="feature-list">
                    {PRODUCT_FEATURES.map((feature) => (
                      <div key={feature}><I name="check" size={13} /> {feature}</div>
                    ))}
                  </div>
                </div>
                <div className="product-nav">
                  <button aria-label="Previous layer" onClick={() => { const keys = Object.keys(PRODUCTS); setActiveProduct(keys[(activeProductIndex - 1 + keys.length) % keys.length]); }}>
                    <I name="chevronLeft" size={16} />
                  </button>
                  <button aria-label="Next layer" onClick={() => { const keys = Object.keys(PRODUCTS); setActiveProduct(keys[(activeProductIndex + 1) % keys.length]); }}>
                    <I name="chevronRight" size={16} />
                  </button>
                  <span className="product-counter">0{activeProductIndex + 1} / 05</span>
                </div>
              </div>
              <div className="product-visual-wrap reveal delay-1" key={`visual-${activeProduct}`}>
                <ProductVisual type={activeProduct} />
              </div>
            </div>
          </div>
        </section>
        {}
        <section className="use-section">
          <div className="section-heading reveal">
            <div className="eyebrow">ONE PLATFORM / MANY FORMATS</div>
            <h2>
              Designed for the way
              <br />
              <em>you actually operate.</em>
            </h2>
            <p>
              Whether you run a compact café, a busy restaurant,
              a QSR or multiple outlets, the same connected
              foundation adapts around your operation.
            </p>
          </div>
          <div className="use-grid">
            {useCases.map((item, index) => (
              <article
                className="use-card reveal"
                key={item.title}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="use-number">0{index + 1}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <div className="use-points">
                  {item.points.map((point) => (
                    <span key={point}>
                      <I name="check" size={12} />
                      {point}
                    </span>
                  ))}
                </div>
                <div className="use-arrow">
                  <I name="arrow" size={17} />
                </div>
              </article>
            ))}
          </div>
        </section>
        {}
        {modules.map((module, index) => (
          <section
            id={module.id}
            className={`module-section ${module.color}`}
            key={module.id}
          >
            <div className="module-grid">
              <div className="module-copy">
                <div className="module-number reveal">
                  {module.number}
                </div>
                <div className="eyebrow reveal">
                  {module.eyebrow}
                </div>
                <h2 className="reveal delay-1">
                  {module.title}
                </h2>
                <p className="module-description reveal delay-2">
                  {module.text}
                </p>
                <div className="module-features reveal delay-3">
                  {module.features.map((feature) => (
                    <div key={feature}>
                      <span className="feature-check">
                        <I name="check" size={12} />
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="module-link reveal delay-4"
                  onClick={() => scrollTo("demo")}
                >
                  Explore this capability
                  <I name="arrow" size={15} />
                </button>
              </div>
              <div className="module-visual reveal">
                <div className="visual-grid" />
                <div className="visual-window">
                  <div className="visual-header">
                    <div>
                      <span />
                      <span />
                      <span />
                    </div>
                    <small>Pratyeksha / {module.eyebrow}</small>
                  </div>
                  <div className="visual-body">
                    <div className="visual-symbol">
                      <I name={module.icon} size={38} stroke={1.2} />
                    </div>
                    <div className="visual-title">
                      <small>CONNECTED MODULE</small>
                      <strong>{module.title}</strong>
                    </div>
                    <div className="visual-bars">
                      <i style={{ width: "88%" }} />
                      <i style={{ width: "62%" }} />
                      <i style={{ width: "76%" }} />
                      <i style={{ width: "45%" }} />
                    </div>
                    <div className="visual-status">
                      <span>
                        <i />
                        REAL-TIME
                      </span>
                      <span>
                        <I name="shield" size={12} />
                        SECURE
                      </span>
                    </div>
                  </div>
                </div>
                <div className="visual-float float-top">
                  <I name={module.icon} size={15} />
                  LIVE MODULE
                </div>
                <div className="visual-float float-bottom">
                  <span />
                  Connected
                </div>
              </div>
            </div>
          </section>
        ))}
        {}
        <section className="matrix-section">
          <div className="section-heading center reveal">
            <div className="eyebrow">THE COMPLETE LAYER</div>
            <h2>
              More than a menu.
              <br />
              <em>More than a POS.</em>
            </h2>
            <p>
              Pratyeksha sits between the customer experience
              and the operational engine of your café or restaurant.
            </p>
          </div>
          <div className="matrix">
            {[
              {
                icon: "qr",
                title: "Smart QR Menu",
                desc: "Beautiful digital menus without forcing customers to install another app.",
              },
              {
                icon: "layers",
                title: "3D Dish Experience",
                desc: "Let guests understand the dish before they order it.",
              },
              {
                icon: "mic",
                title: "Voice Experience",
                desc: "Dish narration and kitchen interaction through voice.",
              },
              {
                icon: "kitchen",
                title: "Live KDS",
                desc: "Kitchen tickets, timers, routing and queue management.",
              },
              {
                icon: "map",
                title: "Live Floor",
                desc: "See table state, orders and service activity together.",
              },
              {
                icon: "billing",
                title: "GST Billing",
                desc: "Connected settlement with GST and payment handling.",
              },
              {
                icon: "box",
                title: "Smart Inventory",
                desc: "Connect ingredients, recipes and availability.",
              },
              {
                icon: "chart",
                title: "Business Intelligence",
                desc: "Understand what is happening instead of only seeing numbers.",
              },
              {
                icon: "users",
                title: "Customer Intelligence",
                desc: "Learn what returning guests actually prefer.",
              },
              {
                icon: "globe",
                title: "Multilingual",
                desc: "Designed for real Indian café and restaurant environments.",
              },
              {
                icon: "shield",
                title: "Operational Controls",
                desc: "Permissions, availability, billing and workflow safeguards.",
              },
              {
                icon: "spark",
                title: "Marketing Layer",
                desc: "Turn restaurant interactions into future customer relationships.",
              },
            ].map((item, index) => (
              <article
                className="feature-card reveal"
                key={item.title}
                style={{ transitionDelay: `${(index % 4) * 70}ms` }}
              >
                <div className="feature-icon">
                  <I name={item.icon} size={19} />
                </div>
                <div className="feature-index">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <div className="feature-line" />
              </article>
            ))}
          </div>
        </section>
        {}
        <section className="flow-section">
          <div className="flow-heading reveal">
            <div className="eyebrow">ONE CUSTOMER JOURNEY</div>
            <h2>
              From scan
              <br />
              <em>to loyalty.</em>
            </h2>
          </div>
          <div className="flow-track">
            {[
              ["01", "SCAN", "Guest scans your table QR."],
              ["02", "DISCOVER", "Explores menu and 3D dishes."],
              ["03", "ORDER", "Places order directly."],
              ["04", "PREPARE", "Kitchen receives live ticket."],
              ["05", "SETTLE", "Billing consolidates everything."],
              ["06", "REMEMBER", "Customer relationship continues."],
            ].map(([number, title, text], index) => (
              <div className="flow-step reveal" key={number}>
                <div className="flow-number">{number}</div>
                <div className="flow-dot">
                  <span />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < 5 && <div className="flow-connector" />}
              </div>
            ))}
          </div>
        </section>
        {}
        <section className="brand-moment">
          <div className="brand-moment-glow" />
          <div className="brand-moment-inner">
            <div className="eyebrow reveal">
              RESTAURANT EXPERIENCE SYSTEM
            </div>
            <h2 className="reveal delay-1">
              Make every part of the
              <br />
              <em>experience feel connected.</em>
            </h2>
            <p className="reveal delay-2">
              Better menus. Faster operations. Smarter decisions.
              Stronger customer relationships.
            </p>
            <div className="moment-stats reveal delay-3">
              <div>
                <strong>6+</strong>
                <span>Connected layers</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Digital availability</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Unified system</span>
              </div>
            </div>
          </div>
        </section>
        {}
        <section id="demo" className="demo-section">
          <div className="demo-grid">
            <div className="demo-copy">
              <div className="eyebrow reveal">
                PRIVATE DEMONSTRATION
              </div>
              <h2 className="reveal delay-1">
                See what
                <br />
                <em>Pratyeksha</em>
                <br />
                can do for you.
              </h2>
              <p className="reveal delay-2">
                Tell us about your café or restaurant. We will
                walk you through the parts of the platform that
                matter to your operation.
              </p>
              <div className="contact-details reveal delay-3">
                <a href="tel:+918767622654">
                  <span>
                    <I name="phone" size={15} />
                  </span>
                  +91 87676 22654
                </a>
                <a href="tel:+918605015294">
                  <span>
                    <I name="phone" size={15} />
                  </span>
                  +91 86050 15294
                </a>
                <a href="mailto:hello.pratyeksha@gmail.com">
                  <span>
                    <I name="mail" size={15} />
                  </span>
                  hello.pratyeksha@gmail.com
                </a>
              </div>
            </div>
            <div className="demo-form-wrap reveal">
              {sent ? (
                <div className="success-state">
                  <div className="success-icon">
                    <I name="check" size={28} />
                  </div>
                  <small>REQUEST RECEIVED</small>
                  <h3>We'll be in touch.</h3>
                  <p>
                    Your demo request has been received. Our team
                    will contact you shortly.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => setSent(false)}
                  >
                    Send another request
                  </button>
                </div>
              ) : (
                <form onSubmit={submitDemo} aria-busy={sending}>
                  <div className="form-top">
                    <small>BOOK A DEMO</small>
                    <span>01 / 01</span>
                  </div>
                  <div className="hp-field" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={updateForm}
                    />
                  </div>
                  <div className="form-grid">
                    <label className={fieldErrors.name ? "has-error" : ""}>
                      <span>Your Name *</span>
                      <input
                        name="name"
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={fieldErrors.name ? "name-error" : undefined}
                        required
                        autoComplete="name"
                        maxLength={80}
                        value={form.name}
                        onChange={updateForm}
                        placeholder="Enter your name"
                      />
                      {fieldErrors.name && <span id="name-error" className="field-error">{fieldErrors.name}</span>}
                    </label>
                    <label className={fieldErrors.business ? "has-error" : ""}>
                      <span>Café / Restaurant *</span>
                      <input
                        name="business"
                        aria-invalid={Boolean(fieldErrors.business)}
                        aria-describedby={fieldErrors.business ? "business-error" : undefined}
                        required
                        autoComplete="organization"
                        maxLength={120}
                        value={form.business}
                        onChange={updateForm}
                        placeholder="Business name"
                      />
                      {fieldErrors.business && <span id="business-error" className="field-error">{fieldErrors.business}</span>}
                    </label>
                    <label className={fieldErrors.phone ? "has-error" : ""}>
                      <span>Phone *</span>
                      <input
                        name="phone"
                        aria-invalid={Boolean(fieldErrors.phone)}
                        aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                        required
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        pattern="[0-9+()\-\s]{8,20}"
                        maxLength={20}
                        value={form.phone}
                        onChange={updateForm}
                        placeholder="+91"
                      />
                      {fieldErrors.phone && <span id="phone-error" className="field-error">{fieldErrors.phone}</span>}
                    </label>
                    <label className={fieldErrors.email ? "has-error" : ""}>
                      <span>Email</span>
                      <input
                        name="email"
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={160}
                        value={form.email}
                        onChange={updateForm}
                        placeholder="you@example.com"
                      />
                      {fieldErrors.email && <span id="email-error" className="field-error">{fieldErrors.email}</span>}
                    </label>
                    <label className="full">
                      <span>Business Type</span>
                      <select
                        name="type"
                        aria-invalid={Boolean(fieldErrors.type)}
                        aria-describedby={fieldErrors.type ? "type-error" : undefined}
                        value={form.type}
                        onChange={updateForm}
                      >
                        <option value="">Select type</option>
                        <option>Café / Coffee Shop</option>
                        <option>Restaurant</option>
                        <option>QSR / Fast Food</option>
                        <option>Bakery / Bistro</option>
                        <option>Cloud Kitchen</option>
                        <option>Multi-outlet Business</option>
                      </select>
                      {fieldErrors.type && <span id="type-error" className="field-error">{fieldErrors.type}</span>}
                    </label>
                    <label className="full">
                      <span>What would you like to improve?</span>
                      <textarea
                        name="message"
                        maxLength={1000}
                        value={form.message}
                        onChange={updateForm}
                        placeholder="Tell us briefly about your current setup..."
                        rows={4}
                      />
                    </label>
                  </div>
                  <p className="form-privacy-notice"><strong>How we use these details:</strong> We collect the information you provide here to respond to your demo request, arrange the walkthrough and communicate about that request. Required fields are marked *. Analytics consent is separate and optional.</p>
                  <label className={`form-consent ${fieldErrors.privacyConsent ? "has-error" : ""}`}>
                    <input
                      name="privacyConsent"
                      type="checkbox"
                      checked={form.privacyConsent}
                      onChange={updateForm}
                      aria-invalid={Boolean(fieldErrors.privacyConsent)}
                      aria-describedby="privacy-consent-note"
                    />
                    <span id="privacy-consent-note">I confirm that I have read the <button type="button" onClick={() => openLegal("privacy")}>Privacy Policy</button> and agree that Pratyeksha may use the details I submit to respond to my demo request.</span>
                  </label>
                  {fieldErrors.privacyConsent && <span className="field-error" role="alert">{fieldErrors.privacyConsent}</span>}
                  {formError && (
                    <p className="form-error" role="alert" aria-live="polite">
                      {formError}
                    </p>
                  )}
                  <button
                    className="submit-button"
                    type="submit"
                    disabled={sending}
                  >
                    {sending ? "Sending securely…" : "Book a Private Demo"}
                    <I name="arrow" size={17} />
                  </button>
                  <p className="form-note">
                    No spam. No pressure. Just a walkthrough of
                    the platform.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      <section id="signature" className="signature-section">
        <div className="signature-shell">
          <div className="signature-heading reveal">
            <div className="eyebrow">THE Pratyeksha DIFFERENCE</div>
            <h2>One experience.<br /><em>Many intelligent layers.</em></h2>
            <p>Editorial typography, cinematic dark surfaces, warm beige panels and quiet sage signals bring the earlier Pratyeksha visual language into the new landing experience.</p>
          </div>
          <div className="signature-grid">
            <article className="signature-card reveal"><span className="signature-number">01</span><I name="spark" size={22} /><div className="signature-rule" /><h3>Discovery</h3><p>A menu should feel like an experience before it becomes an order.</p><small>MENU / CUSTOMER EXPERIENCE</small></article>
            <article className="signature-card reveal delay-1"><span className="signature-number">02</span><I name="layers" size={22} /><div className="signature-rule" /><h3>Connection</h3><p>Guest, kitchen, billing and inventory signals stay connected.</p><small>OPERATIONS / ONE SYSTEM</small></article>
            <article className="signature-card reveal delay-2"><span className="signature-number">03</span><I name="kitchen" size={22} /><div className="signature-rule" /><h3>Control</h3><p>Operators get a clearer view of what is happening across the restaurant.</p><small>OPERATOR / LIVE VIEW</small></article>
            <article className="signature-card reveal delay-3"><span className="signature-number">04</span><I name="users" size={22} /><div className="signature-rule" /><h3>Memory</h3><p>Useful customer signals can continue beyond a single table visit.</p><small>INTELLIGENCE / RETENTION</small></article>
          </div>
          <div className="signature-marquee" aria-hidden="true"><div className="signature-marquee-track"><span>SCAN</span><i>✦</i><span>DISCOVER</span><i>✦</i><span>ORDER</span><i>✦</i><span>SERVE</span><i>✦</i><span>REMEMBER</span><i>✦</i><span>RETURN</span><i>✦</i></div></div>
        </div>
      </section>
      <section id="journey" className="journey-section">
        <div className="journey-shell">
          <div className="journey-copy reveal">
            <div className="eyebrow">DESIGNED AROUND THE GUEST</div>
            <h2>From the first <em>scan</em><br />to the last impression.</h2>
            <p>A premium restaurant experience is made from small moments. Pratyeksha connects those moments without making the customer feel like they are navigating software.</p>
            <div className="journey-note"><span className="journey-dot" /> QUIET TECHNOLOGY / VISIBLE EXPERIENCE</div>
          </div>
          <div className="journey-visual reveal delay-1">
            <div className="journey-phone phone-back">
              <div className="phone-notch" />
              <div className="phone-screen dark-phone">
                <small>TABLE 12</small><strong>Discover</strong><div className="mock-dish" /><div className="mock-line" /><div className="mock-line short" />
              </div>
            </div>
            <div className="journey-phone phone-front">
              <div className="phone-notch" />
              <div className="phone-screen light-phone">
                <small>TABLE 12 / MENU</small><strong>Tonight's menu</strong><p>Find something you will remember.</p>
                <div className="mock-menu"><span /><div><b>Paneer Special</b><small>Chef selection</small></div></div>
                <div className="mock-menu"><span className="sage-dish" /><div><b>Fresh Fruit Shake</b><small>Made to order</small></div></div>
                <button>Explore menu <I name="arrow" size={13} /></button>
              </div>
            </div>
            <div className="journey-float"><I name="spark" size={15} /><span><small>SMART SIGNAL</small><b>Returning guest</b></span></div>
          </div>
          <div className="journey-steps">
            <div className="journey-step reveal"><span>01</span><div><h3>Scan</h3><p>A clean QR entry point starts the experience.</p></div></div>
            <div className="journey-step reveal"><span>02</span><div><h3>Explore</h3><p>Visual menu, categories and dish context help discovery.</p></div></div>
            <div className="journey-step reveal"><span>03</span><div><h3>Order</h3><p>A direct digital journey keeps the interaction simple.</p></div></div>
            <div className="journey-step reveal"><span>04</span><div><h3>Remember</h3><p>Signals from the visit can become future customer intelligence.</p></div></div>
          </div>
        </div>
      </section>
      <section id="command" className="command-section">
        <div className="command-shell">
          <div className="command-heading reveal">
            <div>
              <div className="eyebrow">THE OPERATOR VIEW</div>
              <h2>See the restaurant<br /><em>as one system.</em></h2>
            </div>
            <span className="live-pill"><i /> LIVE OPERATIONS / CONNECTED</span>
          </div>
          <div className="command-board reveal delay-1">
            <div className="board-top"><span>Pratyeksha</span><span>OPERATOR / TODAY</span><span>10:42 PM</span></div>
            <div className="board-body">
              <aside className="board-sidebar">
                <div className="board-nav active"><I name="spark" size={14} />Overview</div>
                <div className="board-nav"><I name="receipt" size={14} />Orders</div>
                <div className="board-nav"><I name="layers" size={14} />Menu</div>
                <div className="board-nav"><I name="inventory" size={14} />Inventory</div>
                <div className="board-nav"><I name="chart" size={14} />Intelligence</div>
              </aside>
              <div className="board-main">
                <div className="board-welcome">
                  <div><small>GOOD EVENING</small><b>Restaurant overview</b></div>
                  <button>View live floor <I name="arrow" size={12} /></button>
                </div>
                <div className="board-metrics">
                  <div><small>TODAY'S SALES</small><strong>₹ 48,260</strong><em>+12.8%</em></div>
                  <div><small>ORDERS</small><strong>126</strong><em>+18</em></div>
                  <div><small>ACTIVE TABLES</small><strong>18</strong><em>06 OPEN</em></div>
                  <div><small>KITCHEN FLOW</small><strong>94%</strong><em>STABLE</em></div>
                </div>
                <div className="board-lower">
                  <div className="board-panel">
                    <header><span>Revenue rhythm</span><small>LAST 7 DAYS</small></header>
                    <div className="bars"><i /><i /><i /><i /><i /><i /><i /></div>
                    <footer><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></footer>
                  </div>
                  <div className="board-panel activity">
                    <header><span>Live activity</span><small>NOW</small></header>
                    <div><i /><b>Table 12</b><small>Order accepted</small><em>2 min</em></div>
                    <div><i /><b>Table 04</b><small>Kitchen preparing</small><em>4 min</em></div>
                    <div><i /><b>Table 18</b><small>Bill requested</small><em>1 min</em></div>
                    <div><i /><b>Table 07</b><small>Feedback received</small><em>6 min</em></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="command-footer"><span>ONE RESTAURANT / ONE CONNECTED FLOW</span><span>DESIGNED FOR CLARITY · BUILT FOR DAILY USE</span></div>
        </div>
      </section>
      {}
      <section id="fusion" className="fusion-section">
        <div className="fusion-orb fusion-orb-one"/><div className="fusion-orb fusion-orb-two"/>
        <div className="fusion-inner">
          <div className="fusion-heading reveal"><div className="eyebrow">THE COMPLETE PRODUCT VIEW</div><div className="fusion-kicker">09 / EXPERIENCE × OPERATIONS × INTELLIGENCE</div><h2>Three design directions.<br/><em>One Pratyeksha system.</em></h2><p>The strongest visual language from the earlier concepts is brought together here: the warm editorial restaurant feel, the dark operational dashboard aesthetic, and the refined premium landing experience.</p></div>
          <div className="fusion-grid">
            <article className="fusion-panel fusion-menu-panel reveal"><div className="fusion-panel-top"><span>01 / GUEST EXPERIENCE</span><I name="qr" size={18}/></div><div className="fusion-phone"><div className="fusion-phone-top"><span>Pratyeksha</span><span>TABLE 12</span></div><div className="fusion-phone-brand">Multi Fusion Food</div><div className="fusion-phone-search"><I name="globe" size={14}/> Explore the menu <span>⌕</span></div><div className="fusion-dish-hero"><div className="fusion-dish-orbit"/><div className="fusion-dish-core">✦</div><span>CHEF SPECIAL</span></div><div className="fusion-phone-title">Signature dish</div><div className="fusion-phone-copy">Discover dishes, ingredients and recommendations before you order.</div><div className="fusion-phone-tabs"><b>Popular</b><span>Chaat</span><span>Pizza</span><span>Shakes</span></div></div><div className="fusion-panel-note"><strong>QR → Explore → Understand → Order</strong><span>Premium customer-facing layer</span></div></article>
            <article className="fusion-panel fusion-kitchen-panel reveal delay-1"><div className="fusion-panel-top"><span>02 / KITCHEN FLOW</span><I name="kitchen" size={18}/></div><div className="fusion-board"><div className="fusion-board-head"><strong>Kitchen Display</strong><span className="fusion-live">LIVE</span></div><div className="fusion-columns"><div><small>NEW</small><div className="fusion-ticket"><b>#1048</b><strong>Paneer Tikka</strong><span>Table 12 · 2 items</span><i>00:48</i></div><div className="fusion-ticket"><b>#1049</b><strong>Veg Momos</strong><span>Takeaway · 1 item</span><i>01:12</i></div></div><div><small>PREPARING</small><div className="fusion-ticket active"><b>#1045</b><strong>Special Combo</strong><span>Table 08 · 4 items</span><i>04:28</i></div><div className="fusion-ticket"><b>#1046</b><strong>Fresh Fruit Shake</strong><span>Table 03 · 2 items</span><i>02:06</i></div></div><div><small>READY</small><div className="fusion-ticket ready"><b>#1041</b><strong>Masala Maggi</strong><span>Table 05 · 1 item</span><i>READY</i></div></div></div></div><div className="fusion-panel-note"><strong>Order state stays visible.</strong><span>FIFO tickets · timers · live sync</span></div></article>
            <article className="fusion-panel fusion-command-panel reveal delay-2"><div className="fusion-panel-top"><span>03 / OPERATOR COMMAND</span><I name="chart" size={18}/></div><div className="fusion-command-window"><div className="fusion-command-head"><div><small>RESTAURANT OVERVIEW</small><strong>Today at a glance</strong></div><span>20 SEP 2026</span></div><div className="fusion-metrics"><div><small>REVENUE</small><b>₹48.2K</b><span>+12.8%</span></div><div><small>ORDERS</small><b>184</b><span>+8.4%</span></div><div><small>AVG. BILL</small><b>₹842</b><span>+4.1%</span></div></div><div className="fusion-chart"><div className="fusion-chart-line"><span/><span/><span/><span/><span/><span/><span/></div><div className="fusion-chart-fill"/></div><div className="fusion-floor"><span className="occupied">●</span><span className="occupied">●</span><span>●</span><span className="occupied">●</span><span>●</span><span className="occupied">●</span><span>●</span><span className="occupied">●</span></div><div className="fusion-command-foot"><span>6 occupied</span><span>2 available</span><span>Inventory synced</span></div></div><div className="fusion-panel-note"><strong>Signals, not software noise.</strong><span>Billing · floor · inventory · analytics</span></div></article>
          </div>
        </div>
      </section>
      <section id="faq" className="faq-section">
        <div className="faq-orbit faq-orbit-one"/><div className="faq-orbit faq-orbit-two"/>
        <div className="faq-inner">
          <div className="faq-intro reveal"><div className="eyebrow">QUESTIONS / ANSWERS</div><div className="faq-kicker">08 / CLARITY BEFORE COMMITMENT</div><h2>Everything you need to know, <em>before the first demo.</em></h2><p>A concise look at how Pratyeksha fits into a real café or restaurant without the usual software-sales noise.</p><div className="faq-side-card"><span><I name="spark" size={17}/></span><div><small>STILL CURIOUS?</small><strong>Let's show you the actual experience.</strong></div><button onClick={()=>scrollTo("demo")}>Book demo <I name="arrow" size={14}/></button></div></div>
          <div className="faq-list reveal delay-1">{faqs.map((item,index)=>{const open=openFaq===index;return <article className={`faq-item ${open?'is-open':''}`} key={item.q}><button className="faq-question" onClick={()=>setOpenFaq(open?-1:index)} aria-expanded={open}><span className="faq-index">{String(index+1).padStart(2,"0")}</span><span className="faq-question-text">{item.q}</span><span className="faq-toggle"><i/><i/></span></button><div className="faq-answer-wrap"><div className="faq-answer">{item.a}</div></div></article>})}</div>
        </div>
        <div className="faq-bottom-line"><span>Pratyeksha / RESTAURANT EXPERIENCE SYSTEM</span><span>DESIGNED AROUND THE WAY PEOPLE DINE</span></div>
      </section>
      </main>
      {}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <button
              className="footer-logo"
              onClick={() => scrollTo("home")}
            >
              <BrandLogo className="footer-brand-image" alt="Pratyeksha logo" />
            </button>
            <p>
              The digital layer behind better café and restaurant
              experiences.
            </p>
            <div className="footer-tag">
              VISUALIZE <i /> ORDER <i /> RELISH
            </div>
          </div>
          <div className="footer-column">
            <h4>Platform</h4>
            <button onClick={() => scrollTo("experience")}>
              Customer Experience
            </button>
            <button onClick={() => scrollTo("operations")}>
              Kitchen & Operations
            </button>
            <button onClick={() => scrollTo("billing")}>
              Smart Billing
            </button>
            <button onClick={() => scrollTo("inventory")}>
              Inventory
            </button>
            <button onClick={() => scrollTo("intelligence")}>
              Intelligence
            </button>
          </div>
          <div className="footer-column">
            <h4>For Business</h4>
            <button onClick={() => scrollTo("system")}>
              Cafés
            </button>
            <button onClick={() => scrollTo("system")}>
              Restaurants
            </button>
            <button onClick={() => scrollTo("system")}>
              QSRs
            </button>
            <button onClick={() => scrollTo("system")}>
              Multi-outlet
            </button>
            <button onClick={() => scrollTo("demo")}>
              Book Demo
            </button>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <a href="tel:+918767622654">+91 87676 22654</a>
            <a href="tel:+918605015294">+91 86050 15294</a>
            <a href="mailto:hello.pratyeksha@gmail.com">
              hello.pratyeksha@gmail.com
            </a>
            <span className="footer-location">
              <I name="map" size={13} />
              Maharashtra, India
            </span>
          </div>
        </div>
        <div className="footer-middle">
          <div>
            <span>RESTAURANT EXPERIENCE SYSTEM</span>
          </div>
          <button onClick={() => scrollTo("home")}>
            Back to top
            <I name="arrow" size={14} />
          </button>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Pratyeksha. All rights
            reserved.
          </span>
          <span>Built for cafés & restaurants.</span>
          <div className="footer-legal-links">
            <button onClick={() => openLegal("privacy")}>Privacy Policy</button>
            <button onClick={() => openLegal("terms")}>Terms of Use</button>
            <button onClick={() => setShowConsentSettings(true)}>Privacy Settings</button>
          </div>
        </div>
      </footer>
      <PratyekshaChatbot />
      <div className="mobile-sticky-cta" aria-label="Book a private demo">
        <button onClick={() => scrollTo("demo")}><span>Book a Private Demo</span><I name="arrow" size={15} /></button>
      </div>
      <CookieBanner
        consent={cookieConsent}
        onAccept={() => updateConsent(true)}
        onReject={() => updateConsent(false)}
        onManage={() => { setShowConsentSettings(true); }}
      />
      {showConsentSettings && cookieConsent && (
        <div className="consent-settings-toast" role="status">
          <span>Analytics preference: {cookieConsent.analytics ? "allowed" : "off"}.</span>
          <button onClick={() => updateConsent(!cookieConsent.analytics)}>{cookieConsent.analytics ? "Turn off analytics" : "Allow analytics"}</button>
        </div>
      )}
    </div>
  );
}
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400&display=swap');
:root{
  --ink:#11100d;
  --ink2:#181713;
  --ink3:#222019;
  --cream:#f4ecdc;
  --cream2:#ebe0ca;
  --cream3:#faf6ee;
  --gold:#c7a269;
  --gold2:#dfc18d;
  --gold3:#a98248;
  --sage:#a6b09a;
  --darkText:#201d17;
  --bodyText:#675e4e;
  --muted:#928775;
  --border:rgba(39,31,20,.12);
  --darkBorder:rgba(255,255,255,.09);
  --radius:18px;
  --max:1480px;
}
*,
*::before,
*::after{
  box-sizing:border-box;
  margin:0;
  padding:0;
}
html{
  width:100%;
  min-height:100%;
  overflow-x:hidden;
  overflow-y:scroll;
  scroll-behavior:smooth;
  -webkit-overflow-scrolling:touch;
}
body{
  width:100%;
  min-height:100vh;
  overflow-x:hidden;
  overflow-y:auto;
  background:var(--cream3);
  color:var(--darkText);
  font-family:'DM Sans',sans-serif;
  line-height:1.6;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
#root{
  width:100%;
  min-height:100vh;
  overflow:visible;
}
button,
input,
textarea,
select{
  font:inherit;
}
button{
  border:0;
}
a{
  color:inherit;
}
button,
a{
  -webkit-tap-highlight-color:transparent;
}
.site{
  width:100%;
  min-height:100vh;
  overflow:visible;
}
section{
  scroll-margin-top:90px;
}
::selection{
  background:var(--gold);
  color:var(--ink);
}
.cursor-dot,
.cursor-ring{
  position:fixed;
  left:0;
  top:0;
  pointer-events:none;
  z-index:99999;
  transform:translate3d(-100px,-100px,0);
  transition:
    width .25s ease,
    height .25s ease,
    border-color .25s ease,
    background .25s ease;
}
.cursor-dot{
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--gold);
  margin-left:-3px;
  margin-top:-3px;
}
.cursor-ring{
  width:32px;
  height:32px;
  border:1px solid rgba(199,162,105,.7);
  border-radius:50%;
  margin-left:-16px;
  margin-top:-16px;
}
body.cursor-large .cursor-dot{
  width:10px;
  height:10px;
  margin-left:-5px;
  margin-top:-5px;
}
body.cursor-large .cursor-ring{
  width:52px;
  height:52px;
  margin-left:-26px;
  margin-top:-26px;
  background:rgba(199,162,105,.06);
  border-color:var(--gold);
}
.loading-screen{
  position:fixed;
  inset:0;
  z-index:100000;
  background:#11100d;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
}
.loading-center{
  position:relative;
  z-index:2;
  display:flex;
  align-items:center;
  flex-direction:column;
}
.loading-mark{
  width:58px;
  height:58px;
  border:1px solid rgba(199,162,105,.45);
  color:var(--gold);
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:16px;
  margin-bottom:25px;
  animation:loaderPulse 2s ease-in-out infinite;
}
.loading-brand{
  font-family:'DM Serif Display',serif;
  color:#f1e4ce;
  font-size:2.2rem;
  letter-spacing:2px;
}
.loading-line{
  width:170px;
  height:1px;
  background:rgba(255,255,255,.08);
  margin-top:24px;
  overflow:hidden;
}
.loading-line span{
  display:block;
  width:0;
  height:100%;
  background:var(--gold);
  animation:loaderLine 5.7s cubic-bezier(.65,0,.35,1) forwards;
}
.loading-label{
  margin-top:22px;
  color:rgba(199,162,105,.7);
  font-size:.55rem;
  letter-spacing:4px;
}
.loading-status{
  margin-top:10px;
  color:rgba(255,255,255,.25);
  font-size:.65rem;
  letter-spacing:1px;
}
.loading-orbit{
  position:absolute;
  width:520px;
  height:520px;
  border:1px solid rgba(199,162,105,.07);
  border-radius:50%;
}
.orbit-one{
  animation:orbit 16s linear infinite;
}
.orbit-two{
  width:760px;
  height:760px;
  border-color:rgba(166,176,154,.05);
  animation:orbitReverse 22s linear infinite;
}
@keyframes loaderLine{
  to{width:100%;}
}
@keyframes loaderPulse{
  0%,100%{transform:scale(1);box-shadow:0 0 0 rgba(199,162,105,0);}
  50%{transform:scale(1.05);box-shadow:0 0 45px rgba(199,162,105,.12);}
}
@keyframes orbit{
  to{transform:rotate(360deg);}
}
@keyframes orbitReverse{
  to{transform:rotate(-360deg);}
}
.scroll-progress{
  position:fixed;
  top:0;
  left:0;
  height:2px;
  background:var(--gold);
  z-index:10000;
  transition:width .08s linear;
}
.nav{
  position:fixed;
  top:0;
  left:0;
  right:0;
  height:78px;
  z-index:500;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 5vw;
  transition:.35s ease;
}
.nav-scrolled{
  background:rgba(244,236,220,.92);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid rgba(39,31,20,.09);
  box-shadow:0 10px 35px rgba(30,23,12,.06);
}
.brand{
  background:none;
  cursor:pointer;
  display:flex;
  align-items:center;
  gap:11px;
  color:var(--darkText);
}
.brand-mark{
  width:34px;
  height:34px;
  border:1px solid rgba(199,162,105,.6);
  background:var(--ink);
  color:var(--gold2);
  border-radius:9px;
  display:flex;
  align-items:center;
  justify-content:center;
}
.brand-name{
  font-family:'DM Serif Display',serif;
  font-size:1.35rem;
  letter-spacing:.2px;
}
.desktop-nav{
  display:flex;
  align-items:center;
  gap:28px;
}
.desktop-nav button{
  background:none;
  color:#665d4e;
  cursor:pointer;
  font-size:.74rem;
  transition:.2s;
}
.desktop-nav button:hover{
  color:var(--gold3);
}
.desktop-nav .nav-demo{
  background:var(--ink);
  color:var(--gold2);
  padding:10px 19px;
  border-radius:6px;
}
.desktop-nav .nav-demo:hover{
  background:var(--gold);
  color:var(--ink);
}
.mobile-menu-button{
  display:none;
  background:none;
  color:var(--darkText);
  cursor:pointer;
}
.mobile-menu{
  position:fixed;
  inset:0;
  z-index:900;
  background:var(--cream);
  transform:translateY(-100%);
  transition:transform .5s cubic-bezier(.7,0,.2,1);
  display:flex;
  align-items:center;
  justify-content:center;
}
.mobile-menu.open{
  transform:translateY(0);
}
.mobile-close{
  position:absolute;
  right:24px;
  top:23px;
  background:none;
  color:var(--darkText);
  cursor:pointer;
}
.mobile-menu-inner{
  display:flex;
  flex-direction:column;
  gap:23px;
  align-items:center;
}
.mobile-menu-inner > span{
  color:var(--gold3);
  font-size:.58rem;
  letter-spacing:3px;
  margin-bottom:15px;
}
.mobile-menu-inner button{
  background:none;
  color:var(--darkText);
  font-family:'DM Serif Display',serif;
  font-size:2rem;
  cursor:pointer;
}
.hero{
  width:100%;
  min-height:100svh;
  display:grid;
  grid-template-columns:1fr 1fr;
  position:relative;
  overflow:hidden;
  background:var(--cream);
}
.hero-left{
  min-height:100svh;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:140px 6vw 100px;
  position:relative;
  z-index:2;
}
.hero-right{
  min-height:100svh;
  position:relative;
  background:var(--ink2);
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
}
.hero-glow{
  position:absolute;
  width:70%;
  height:70%;
  border-radius:50%;
  background:radial-gradient(
    circle,
    rgba(199,162,105,.13),
    transparent 65%
  );
  filter:blur(10px);
}
.hero-eyebrow,
.eyebrow{
  display:flex;
  align-items:center;
  gap:9px;
  color:var(--gold3);
  font-size:.57rem;
  letter-spacing:3px;
  font-weight:500;
  text-transform:uppercase;
}
.hero-eyebrow span{
  width:28px;
  height:1px;
  background:var(--gold);
}
.hero-title{
  margin-top:22px;
  color:var(--darkText);
  font-family:'DM Serif Display',serif;
  font-weight:400;
  font-size:clamp(3rem,4.6vw,5.1rem);
  line-height:1.02;
  letter-spacing:-1.6px;
  max-width:720px;
}
.hero-title em{
  color:var(--gold3);
  font-style:italic;
}
.hero-description{
  margin-top:26px;
  max-width:520px;
  color:var(--bodyText);
  font-size:.91rem;
  line-height:1.85;
}
.hero-actions{
  display:flex;
  gap:11px;
  flex-wrap:wrap;
  margin-top:35px;
}
.button{
  min-height:46px;
  padding:0 21px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:9px;
  border-radius:6px;
  cursor:pointer;
  font-size:.74rem;
  transition:.25s ease;
}
.button.primary{
  background:var(--ink);
  color:var(--gold2);
}
.button.primary:hover{
  background:var(--gold);
  color:var(--ink);
  transform:translateY(-2px);
}
.button.secondary{
  background:transparent;
  border:1px solid rgba(39,31,20,.15);
  color:var(--darkText);
}
.button.secondary:hover{
  border-color:var(--gold);
  color:var(--gold3);
}
.hero-meta{
  margin-top:48px;
  display:flex;
  gap:30px;
}
.hero-meta div{
  display:flex;
  flex-direction:column;
  gap:3px;
}
.hero-meta strong{
  font-family:'DM Mono',monospace;
  color:var(--gold3);
  font-size:.65rem;
}
.hero-meta span{
  font-size:.58rem;
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:1.5px;
}
.hero-scroll{
  position:absolute;
  left:6vw;
  bottom:30px;
  display:flex;
  align-items:center;
  gap:12px;
  z-index:4;
}
.hero-scroll span{
  font-size:.5rem;
  letter-spacing:2.5px;
  color:rgba(39,31,20,.42);
}
.hero-scroll i{
  width:42px;
  height:1px;
  background:rgba(39,31,20,.2);
}
.hero-orbit{
  position:absolute;
  border:1px solid rgba(199,162,105,.1);
  border-radius:50%;
}
.orbit-a{
  width:620px;
  height:620px;
}
.orbit-b{
  width:850px;
  height:850px;
  border-color:rgba(166,176,154,.06);
}
.restaurant-card{
  width:min(390px,72%);
  position:relative;
  z-index:4;
  background:#211f19;
  border:1px solid rgba(199,162,105,.2);
  border-radius:22px;
  box-shadow:0 35px 90px rgba(0,0,0,.55);
  overflow:hidden;
  transform:rotate(-3deg);
  animation:cardFloat 7s ease-in-out infinite;
}
@keyframes cardFloat{
  0%,100%{transform:rotate(-3deg) translateY(0);}
  50%{transform:rotate(-2deg) translateY(-14px);}
}
.restaurant-top{
  padding:19px 21px;
  display:flex;
  justify-content:space-between;
  border-bottom:1px solid rgba(255,255,255,.07);
}
.restaurant-top small{
  display:block;
  color:rgba(199,162,105,.45);
  font-size:.48rem;
  letter-spacing:2px;
}
.restaurant-top strong{
  display:block;
  margin-top:4px;
  color:#f3e7d2;
  font-family:'DM Serif Display',serif;
  font-size:1.15rem;
  font-weight:400;
}
.live{
  display:flex;
  gap:5px;
  align-items:center;
  color:#a6b09a;
  font-size:.5rem;
  letter-spacing:1px;
}
.live i{
  width:5px;
  height:5px;
  border-radius:50%;
  background:#a6b09a;
  box-shadow:0 0 10px #a6b09a;
}
.table-scene{
  height:280px;
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  background:
    radial-gradient(circle at 50% 40%,rgba(199,162,105,.1),transparent 55%),
    #181713;
}
.table-circle{
  width:205px;
  height:205px;
  border-radius:50%;
  border:1px solid rgba(199,162,105,.3);
  position:relative;
  box-shadow:
    0 0 0 18px rgba(199,162,105,.025),
    0 0 0 42px rgba(199,162,105,.012);
}
.dish{
  position:absolute;
  border-radius:50%;
  border:1px solid rgba(255,255,255,.13);
  background:radial-gradient(circle at 40% 30%,#d7c8a9,#625643 55%,#25211a);
}
.dish-one{
  width:70px;
  height:70px;
  left:28px;
  top:35px;
}
.dish-two{
  width:57px;
  height:57px;
  right:27px;
  bottom:35px;
}
.dish-three{
  width:43px;
  height:43px;
  right:34px;
  top:30px;
}
.glass{
  position:absolute;
  width:31px;
  height:58px;
  left:30px;
  bottom:30px;
  border:1px solid rgba(220,230,220,.35);
  border-radius:7px 7px 10px 10px;
  background:rgba(166,176,154,.06);
}
.scene-label{
  position:absolute;
  bottom:17px;
  left:20px;
}
.scene-label span{
  display:block;
  color:rgba(199,162,105,.45);
  font-size:.45rem;
  letter-spacing:2px;
}
.scene-label strong{
  color:#eee3cf;
  font-size:.66rem;
  font-weight:400;
}
.restaurant-stats{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  border-top:1px solid rgba(255,255,255,.06);
  border-bottom:1px solid rgba(255,255,255,.06);
}
.restaurant-stats div{
  padding:15px;
  border-right:1px solid rgba(255,255,255,.06);
}
.restaurant-stats div:last-child{
  border:0;
}
.restaurant-stats small{
  display:block;
  color:rgba(255,255,255,.25);
  font-size:.43rem;
  letter-spacing:1.5px;
}
.restaurant-stats strong{
  color:var(--gold2);
  font-family:'DM Serif Display',serif;
  font-size:1.35rem;
}
.mini-order{
  margin:13px;
  padding:12px;
  border:1px solid rgba(199,162,105,.1);
  background:rgba(255,255,255,.025);
  display:flex;
  align-items:center;
  gap:10px;
  border-radius:9px;
}
.mini-icon{
  width:31px;
  height:31px;
  border-radius:7px;
  background:rgba(199,162,105,.1);
  color:var(--gold2);
  display:flex;
  align-items:center;
  justify-content:center;
}
.mini-order strong,
.mini-order span{
  display:block;
}
.mini-order strong{
  color:#eee4d1;
  font-size:.59rem;
}
.mini-order span{
  margin-top:2px;
  color:rgba(255,255,255,.27);
  font-size:.48rem;
}
.mini-arrow{
  margin-left:auto;
  color:var(--gold);
}
.floating-note{
  position:absolute;
  z-index:5;
  display:flex;
  align-items:center;
  gap:9px;
  padding:10px 13px;
  background:rgba(32,30,24,.88);
  backdrop-filter:blur(12px);
  border:1px solid rgba(199,162,105,.15);
  border-radius:9px;
  box-shadow:0 15px 35px rgba(0,0,0,.25);
}
.floating-note > svg{
  color:var(--gold);
}
.floating-note small,
.floating-note strong{
  display:block;
}
.floating-note small{
  color:rgba(255,255,255,.27);
  font-size:.4rem;
  letter-spacing:1.4px;
}
.floating-note strong{
  color:#eee4d1;
  font-size:.57rem;
  font-weight:400;
}
.note-one{
  top:25%;
  left:8%;
  animation:noteOne 6s ease-in-out infinite;
}
.note-two{
  right:7%;
  bottom:24%;
  animation:noteTwo 7s ease-in-out infinite;
}
@keyframes noteOne{
  0%,100%{transform:translateY(0);}
  50%{transform:translateY(-9px);}
}
@keyframes noteTwo{
  0%,100%{transform:translateY(0);}
  50%{transform:translateY(9px);}
}
.intro-band{
  background:var(--ink);
  color:#f4ecdc;
  width:100%;
  padding:120px 7vw 100px;
}
.intro-label{
  display:flex;
  align-items:center;
  gap:15px;
  color:rgba(199,162,105,.7);
  font-size:.54rem;
  letter-spacing:3px;
}
.intro-label i{
  width:50px;
  height:1px;
  background:rgba(199,162,105,.35);
}
.intro-content{
  display:grid;
  grid-template-columns:1.1fr .9fr;
  gap:8vw;
  margin-top:42px;
}
.intro-content h2{
  font-family:'DM Serif Display',serif;
  font-size:clamp(2.6rem,5vw,5.3rem);
  font-weight:400;
  line-height:1.03;
  letter-spacing:-1px;
}
.intro-content h2 em{
  color:var(--gold2);
  font-style:italic;
}
.intro-content p{
  max-width:570px;
  color:rgba(255,255,255,.42);
  font-size:.91rem;
  line-height:1.95;
  align-self:end;
}
.system-line{
  margin-top:90px;
  border-top:1px solid rgba(255,255,255,.09);
  display:grid;
  grid-template-columns:repeat(6,1fr);
}
.system-line div{
  padding:19px 15px 0;
  border-right:1px solid rgba(255,255,255,.07);
}
.system-line div:last-child{
  border-right:0;
}
.system-line span{
  display:block;
  color:rgba(199,162,105,.45);
  font-size:.48rem;
  font-family:'DM Mono',monospace;
}
.system-line strong{
  display:block;
  color:rgba(255,255,255,.58);
  font-size:.65rem;
  font-weight:400;
  margin-top:5px;
}
.use-section{
  background:var(--cream);
  padding:120px 7vw;
}
.section-heading{
  max-width:700px;
}
.section-heading.center{
  margin-left:auto;
  margin-right:auto;
  text-align:center;
}
.section-heading h2{
  color:var(--darkText);
  font-family:'DM Serif Display',serif;
  font-size:clamp(2.5rem,4.5vw,4.5rem);
  font-weight:400;
  line-height:1.04;
  letter-spacing:-1px;
  margin-top:16px;
}
.section-heading h2 em{
  color:var(--gold3);
  font-style:italic;
}
.section-heading p{
  color:var(--bodyText);
  font-size:.88rem;
  line-height:1.85;
  max-width:600px;
  margin-top:20px;
}
.section-heading.center p{
  margin-left:auto;
  margin-right:auto;
}
.use-grid{
  margin-top:65px;
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:15px;
}
.use-card{
  min-height:390px;
  padding:34px;
  border:1px solid var(--border);
  background:var(--cream3);
  position:relative;
  overflow:hidden;
  transition:.4s ease;
}
.use-card:hover{
  transform:translateY(-8px);
  border-color:rgba(199,162,105,.45);
  box-shadow:0 25px 55px rgba(40,30,15,.08);
}
.use-card::after{
  content:"";
  position:absolute;
  width:180px;
  height:180px;
  border-radius:50%;
  right:-90px;
  bottom:-90px;
  background:rgba(199,162,105,.07);
}
.use-number{
  color:var(--gold3);
  font-family:'DM Mono',monospace;
  font-size:.6rem;
}
.use-card h3{
  font-family:'DM Serif Display',serif;
  color:var(--darkText);
  font-size:2rem;
  font-weight:400;
  margin-top:55px;
}
.use-card p{
  margin-top:13px;
  color:var(--bodyText);
  font-size:.75rem;
  line-height:1.75;
  max-width:330px;
}
.use-points{
  margin-top:28px;
  display:grid;
  gap:8px;
}
.use-points span{
  display:flex;
  align-items:center;
  gap:7px;
  color:#625947;
  font-size:.62rem;
}
.use-points svg{
  color:var(--gold3);
}
.use-arrow{
  position:absolute;
  right:28px;
  bottom:25px;
  color:var(--gold3);
}
.module-section{
  width:100%;
  padding:125px 7vw;
}
.module-section.cream{
  background:var(--cream3);
  color:var(--darkText);
}
.module-section.dark{
  background:var(--ink2);
  color:#f5eddf;
}
.module-grid{
  width:100%;
  max-width:var(--max);
  margin:auto;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8vw;
  align-items:center;
}
.module-copy{
  max-width:650px;
}
.module-number{
  color:var(--gold3);
  font-family:'DM Mono',monospace;
  font-size:.58rem;
  margin-bottom:25px;
}
.dark .module-number{
  color:var(--gold2);
}
.module-section .eyebrow{
  color:var(--gold3);
}
.dark .module-section .eyebrow{
  color:var(--gold2);
}
.module-copy h2{
  font-family:'DM Serif Display',serif;
  font-size:clamp(2.5rem,4.2vw,4.6rem);
  font-weight:400;
  line-height:1.03;
  letter-spacing:-1px;
  margin-top:17px;
  color:var(--darkText);
}
.dark .module-copy h2{
  color:#f4ecdc;
}
.module-description{
  margin-top:23px;
  color:var(--bodyText);
  font-size:.86rem;
  line-height:1.9;
  max-width:580px;
}
.dark .module-description{
  color:rgba(255,255,255,.43);
}
.module-features{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:11px 24px;
  margin-top:32px;
}
.module-features > div{
  display:flex;
  align-items:flex-start;
  gap:9px;
  color:#655c4d;
  font-size:.66rem;
  line-height:1.5;
}
.dark .module-features > div{
  color:rgba(255,255,255,.47);
}
.feature-check{
  width:19px;
  height:19px;
  min-width:19px;
  border:1px solid rgba(199,162,105,.3);
  color:var(--gold3);
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
}
.module-link{
  margin-top:36px;
  display:inline-flex;
  align-items:center;
  gap:8px;
  background:none;
  color:var(--gold3);
  cursor:pointer;
  font-size:.67rem;
  border-bottom:1px solid rgba(199,162,105,.3);
  padding-bottom:7px;
}
.dark .module-link{
  color:var(--gold2);
}
.module-visual{
  min-height:510px;
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
}
.cream .module-visual{
  background:var(--cream2);
}
.dark .module-visual{
  background:#12110e;
}
.visual-grid{
  position:absolute;
  inset:0;
  opacity:.5;
  background-image:
    linear-gradient(rgba(199,162,105,.08) 1px,transparent 1px),
    linear-gradient(90deg,rgba(199,162,105,.08) 1px,transparent 1px);
  background-size:38px 38px;
}
.visual-window{
  width:78%;
  min-height:370px;
  position:relative;
  z-index:2;
  background:#1c1a15;
  border:1px solid rgba(199,162,105,.18);
  border-radius:17px;
  overflow:hidden;
  box-shadow:0 35px 80px rgba(0,0,0,.25);
  transform:rotate(-2deg);
  transition:.5s;
}
.module-visual:hover .visual-window{
  transform:rotate(0deg) translateY(-7px);
}
.visual-header{
  height:42px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 15px;
  border-bottom:1px solid rgba(255,255,255,.07);
}
.visual-header div{
  display:flex;
  gap:5px;
}
.visual-header div span{
  width:6px;
  height:6px;
  border-radius:50%;
  background:rgba(255,255,255,.2);
}
.visual-header small{
  color:rgba(255,255,255,.27);
  font-size:.43rem;
  letter-spacing:1px;
}
.visual-body{
  min-height:328px;
  padding:42px;
  display:flex;
  flex-direction:column;
  justify-content:center;
}
.visual-symbol{
  width:62px;
  height:62px;
  border:1px solid rgba(199,162,105,.25);
  color:var(--gold2);
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:14px;
  background:rgba(199,162,105,.05);
}
.visual-title{
  margin-top:22px;
}
.visual-title small{
  display:block;
  color:rgba(199,162,105,.55);
  font-size:.46rem;
  letter-spacing:2px;
}
.visual-title strong{
  display:block;
  color:#eee5d4;
  font-family:'DM Serif Display',serif;
  font-size:1.7rem;
  line-height:1.1;
  margin-top:6px;
  max-width:330px;
  font-weight:400;
}
.visual-bars{
  margin-top:30px;
  display:grid;
  gap:9px;
}
.visual-bars i{
  height:4px;
  display:block;
  border-radius:20px;
  background:linear-gradient(90deg,var(--gold),rgba(199,162,105,.15));
}
.visual-status{
  display:flex;
  gap:17px;
  margin-top:28px;
}
.visual-status span{
  display:flex;
  align-items:center;
  gap:6px;
  color:rgba(255,255,255,.32);
  font-size:.45rem;
  letter-spacing:1px;
}
.visual-status i{
  width:5px;
  height:5px;
  background:var(--sage);
  border-radius:50%;
}
.visual-float{
  position:absolute;
  z-index:5;
  background:#25221b;
  color:#e9ddc8;
  border:1px solid rgba(199,162,105,.18);
  box-shadow:0 15px 35px rgba(0,0,0,.22);
  display:flex;
  align-items:center;
  gap:8px;
  padding:10px 13px;
  border-radius:7px;
  font-size:.5rem;
  letter-spacing:1px;
}
.visual-float svg{
  color:var(--gold);
}
.float-top{
  top:13%;
  right:3%;
}
.float-bottom{
  bottom:12%;
  left:4%;
}
.float-bottom span{
  width:5px;
  height:5px;
  border-radius:50%;
  background:var(--sage);
}
.matrix-section{
  padding:125px 7vw;
  background:var(--cream);
}
.matrix{
  max-width:var(--max);
  margin:70px auto 0;
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:1px;
  background:rgba(39,31,20,.11);
  border:1px solid rgba(39,31,20,.11);
}
.feature-card{
  min-height:245px;
  background:var(--cream3);
  padding:28px;
  position:relative;
  transition:.35s;
}
.feature-card:hover{
  background:#f0e5d0;
  transform:translateY(-4px);
  z-index:2;
  box-shadow:0 20px 35px rgba(40,30,15,.08);
}
.feature-icon{
  width:42px;
  height:42px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--gold3);
  background:rgba(199,162,105,.08);
  border:1px solid rgba(199,162,105,.17);
  border-radius:10px;
}
.feature-index{
  position:absolute;
  top:29px;
  right:28px;
  color:rgba(39,31,20,.22);
  font-family:'DM Mono',monospace;
  font-size:.5rem;
}
.feature-card h3{
  margin-top:28px;
  color:var(--darkText);
  font-family:'DM Serif Display',serif;
  font-weight:400;
  font-size:1.3rem;
}
.feature-card p{
  margin-top:8px;
  color:var(--bodyText);
  font-size:.65rem;
  line-height:1.7;
}
.feature-line{
  position:absolute;
  left:28px;
  right:28px;
  bottom:24px;
  height:1px;
  background:rgba(39,31,20,.08);
}
.flow-section{
  background:var(--ink);
  color:#f4ecdc;
  padding:125px 7vw;
}
.flow-heading{
  max-width:650px;
}
.flow-heading h2{
  font-family:'DM Serif Display',serif;
  font-size:clamp(3rem,5vw,5.3rem);
  line-height:1;
  font-weight:400;
  margin-top:15px;
}
.flow-heading h2 em{
  color:var(--gold2);
  font-style:italic;
}
.flow-track{
  max-width:var(--max);
  margin:100px auto 0;
  display:grid;
  grid-template-columns:repeat(6,1fr);
  position:relative;
}
.flow-step{
  position:relative;
  padding-right:30px;
}
.flow-number{
  color:rgba(199,162,105,.5);
  font-family:'DM Mono',monospace;
  font-size:.55rem;
}
.flow-dot{
  width:28px;
  height:28px;
  margin-top:20px;
  border:1px solid rgba(199,162,105,.4);
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
  z-index:2;
  background:var(--ink);
}
.flow-dot span{
  width:6px;
  height:6px;
  background:var(--gold);
  border-radius:50%;
}
.flow-step h3{
  margin-top:19px;
  color:#eee5d5;
  font-family:'DM Serif Display',serif;
  font-size:1.15rem;
  font-weight:400;
}
.flow-step p{
  margin-top:7px;
  color:rgba(255,255,255,.34);
  font-size:.62rem;
  line-height:1.65;
  max-width:150px;
}
.flow-connector{
  position:absolute;
  left:28px;
  right:-20px;
  top:68px;
  height:1px;
  background:rgba(199,162,105,.15);
}
.brand-moment{
  min-height:650px;
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  background:
    radial-gradient(circle at 50% 40%,rgba(199,162,105,.13),transparent 32%),
    var(--ink2);
  text-align:center;
}
.brand-moment::before,
.brand-moment::after{
  content:"";
  position:absolute;
  border:1px solid rgba(199,162,105,.09);
  border-radius:50%;
}
.brand-moment::before{
  width:500px;
  height:500px;
}
.brand-moment::after{
  width:800px;
  height:800px;
  border-color:rgba(166,176,154,.05);
}
.brand-moment-inner{
  position:relative;
  z-index:2;
  padding:50px 25px;
}
.brand-moment-inner .eyebrow{
  justify-content:center;
  color:var(--gold2);
}
.brand-moment h2{
  margin-top:20px;
  font-family:'DM Serif Display',serif;
  font-weight:400;
  font-size:clamp(3rem,5.7vw,6rem);
  line-height:.98;
  letter-spacing:-1.5px;
  color:#f4ecdc;
}
.brand-moment h2 em{
  color:var(--gold2);
  font-style:italic;
}
.brand-moment p{
  max-width:530px;
  margin:25px auto 0;
  color:rgba(255,255,255,.4);
  font-size:.85rem;
}
.moment-stats{
  margin:55px auto 0;
  display:flex;
  justify-content:center;
  gap:1px;
}
.moment-stats div{
  min-width:170px;
  padding:16px 30px;
  border-right:1px solid rgba(255,255,255,.08);
}
.moment-stats div:last-child{
  border-right:0;
}
.moment-stats strong{
  display:block;
  color:var(--gold2);
  font-family:'DM Serif Display',serif;
  font-size:1.9rem;
  font-weight:400;
}
.moment-stats span{
  display:block;
  margin-top:3px;
  color:rgba(255,255,255,.28);
  font-size:.52rem;
  letter-spacing:1px;
  text-transform:uppercase;
}
.demo-section{
  background:var(--cream);
  padding:130px 7vw;
}
.demo-grid{
  max-width:var(--max);
  margin:auto;
  display:grid;
  grid-template-columns:.8fr 1.2fr;
  gap:8vw;
  align-items:start;
}
.demo-copy h2{
  margin-top:18px;
  font-family:'DM Serif Display',serif;
  font-weight:400;
  font-size:clamp(3rem,5vw,5.4rem);
  line-height:.98;
  letter-spacing:-1.3px;
  color:var(--darkText);
}
.demo-copy h2 em{
  color:var(--gold3);
  font-style:italic;
}
.demo-copy > p{
  margin-top:25px;
  max-width:430px;
  color:var(--bodyText);
  font-size:.86rem;
  line-height:1.85;
}
.contact-details{
  margin-top:42px;
  display:grid;
  gap:11px;
}
.contact-details a{
  text-decoration:none;
  color:#554d40;
  display:flex;
  align-items:center;
  gap:10px;
  font-size:.68rem;
}
.contact-details a:hover{
  color:var(--gold3);
}
.contact-details span{
  width:29px;
  height:29px;
  border:1px solid rgba(199,162,105,.22);
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--gold3);
  border-radius:7px;
}
.demo-form-wrap{
  background:#211f19;
  border:1px solid rgba(199,162,105,.16);
  padding:35px;
  box-shadow:0 30px 70px rgba(30,22,10,.14);
}
.form-top{
  display:flex;
  justify-content:space-between;
  color:var(--gold2);
  font-size:.52rem;
  letter-spacing:2px;
  padding-bottom:21px;
  border-bottom:1px solid rgba(255,255,255,.08);
}
.form-top span{
  color:rgba(255,255,255,.25);
}
.form-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:17px;
  margin-top:25px;
}
.form-grid label{
  display:block;
}
.form-grid label.full{
  grid-column:1/-1;
}
.form-grid label span{
  display:block;
  margin-bottom:7px;
  color:rgba(255,255,255,.35);
  font-size:.52rem;
  letter-spacing:1.3px;
  text-transform:uppercase;
}
.form-grid input,
.form-grid select,
.form-grid textarea{
  width:100%;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.035);
  color:#eee5d4;
  outline:none;
  padding:13px 14px;
  border-radius:5px;
  font-size:.68rem;
  transition:.2s;
}
.form-grid input::placeholder,
.form-grid textarea::placeholder{
  color:rgba(255,255,255,.2);
}
.form-grid select{
  color:rgba(255,255,255,.55);
}
.form-grid input:focus,
.form-grid select:focus,
.form-grid textarea:focus{
  border-color:rgba(199,162,105,.65);
  background:rgba(199,162,105,.035);
}
.form-grid textarea{
  resize:vertical;
  min-height:105px;
}
.submit-button{
  margin-top:22px;
  width:100%;
  min-height:50px;
  background:var(--gold);
  color:var(--ink);
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  cursor:pointer;
  font-size:.7rem;
  border-radius:5px;
  transition:.25s;
}
.submit-button:hover{
  background:var(--gold2);
}
.submit-button:disabled{
  opacity:.6;
  cursor:wait;
}
.form-note{
  text-align:center;
  color:rgba(255,255,255,.2);
  font-size:.5rem;
  margin-top:14px;
}
.success-state{
  min-height:480px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.success-icon{
  width:65px;
  height:65px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  color:var(--gold);
  border:1px solid rgba(199,162,105,.3);
}
.success-state small{
  margin-top:25px;
  color:var(--gold);
  font-size:.5rem;
  letter-spacing:2px;
}
.success-state h3{
  margin-top:10px;
  color:#f1e5d1;
  font-family:'DM Serif Display',serif;
  font-size:2.4rem;
  font-weight:400;
}
.success-state p{
  max-width:350px;
  margin:12px auto 25px;
  color:rgba(255,255,255,.35);
  font-size:.7rem;
}
.success-state .button{
  margin-top:5px;
}
.footer{
  width:100%;
  background:#0e0d0b;
  color:#eee4d1;
  padding:80px 7vw 25px;
}
.footer-top{
  max-width:var(--max);
  margin:auto;
  display:grid;
  grid-template-columns:1.5fr 1fr 1fr 1.2fr;
  gap:70px;
  padding-bottom:70px;
}
.footer-logo{
  display:flex;
  align-items:center;
  gap:10px;
  background:none;
  color:#f2e7d3;
  font-family:'DM Serif Display',serif;
  font-size:1.4rem;
  cursor:pointer;
}
.footer-logo span{
  width:34px;
  height:34px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--gold);
  border:1px solid rgba(199,162,105,.3);
  border-radius:8px;
}
.footer-brand p{
  margin-top:19px;
  max-width:330px;
  color:rgba(255,255,255,.3);
  font-size:.68rem;
  line-height:1.8;
}
.footer-tag{
  margin-top:25px;
  color:rgba(199,162,105,.55);
  font-size:.48rem;
  letter-spacing:2px;
}
.footer-tag i{
  display:inline-block;
  width:3px;
  height:3px;
  background:var(--gold);
  border-radius:50%;
  margin:0 7px 2px;
}
.footer-column{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:10px;
}
.footer-column h4{
  color:var(--gold2);
  font-size:.55rem;
  letter-spacing:2px;
  font-weight:500;
  text-transform:uppercase;
  margin-bottom:7px;
}
.footer-column button,
.footer-column a{
  color:rgba(255,255,255,.37);
  background:none;
  text-decoration:none;
  font-size:.63rem;
  cursor:pointer;
  text-align:left;
  transition:.2s;
}
.footer-column button:hover,
.footer-column a:hover{
  color:var(--gold2);
}
.footer-location{
  margin-top:10px;
  display:flex;
  align-items:center;
  gap:7px;
  color:rgba(255,255,255,.25);
  font-size:.58rem;
}
.footer-middle{
  max-width:var(--max);
  margin:auto;
  padding:22px 0;
  border-top:1px solid rgba(255,255,255,.07);
  border-bottom:1px solid rgba(255,255,255,.07);
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.footer-middle span{
  color:rgba(199,162,105,.38);
  font-size:.48rem;
  letter-spacing:2.5px;
}
.footer-middle button{
  background:none;
  color:rgba(255,255,255,.4);
  display:flex;
  align-items:center;
  gap:8px;
  font-size:.57rem;
  cursor:pointer;
}
.footer-middle button:hover{
  color:var(--gold2);
}
.footer-bottom{
  max-width:var(--max);
  margin:0 auto;
  padding-top:24px;
  display:flex;
  justify-content:space-between;
  gap:20px;
  color:rgba(255,255,255,.2);
  font-size:.5rem;
}
.reveal{
  opacity:0;
  transform:translateY(35px);
  transition:
    opacity .8s ease,
    transform .8s cubic-bezier(.2,.8,.2,1);
}
.reveal.visible{
  opacity:1;
  transform:translateY(0);
}
.delay-1{transition-delay:.08s;}
.delay-2{transition-delay:.16s;}
.delay-3{transition-delay:.24s;}
.delay-4{transition-delay:.32s;}
@media(max-width:1100px){
  .desktop-nav{
    gap:18px;
  }
  .hero-left{
    padding-left:5vw;
  }
  .module-grid{
    gap:5vw;
  }
  .matrix{
    grid-template-columns:repeat(3,1fr);
  }
  .footer-top{
    gap:40px;
  }
}
@media(max-width:900px){
  body{
    cursor:auto;
  }
  .cursor-dot,
  .cursor-ring{
    display:none;
  }
  .desktop-nav{
    display:none;
  }
  .mobile-menu-button{
    display:flex;
  }
  .hero{
    grid-template-columns:1fr;
  }
  .hero-left{
    min-height:auto;
    padding-top:145px;
    padding-bottom:85px;
  }
  .hero-right{
    min-height:650px;
  }
  .hero-scroll{
    bottom:20px;
  }
  .intro-content{
    grid-template-columns:1fr;
    gap:35px;
  }
  .system-line{
    grid-template-columns:repeat(3,1fr);
  }
  .system-line div{
    padding-bottom:20px;
  }
  .use-grid{
    grid-template-columns:1fr;
  }
  .use-card{
    min-height:320px;
  }
  .module-grid{
    grid-template-columns:1fr;
  }
  .module-visual{
    min-height:480px;
  }
  .matrix{
    grid-template-columns:repeat(2,1fr);
  }
  .flow-track{
    grid-template-columns:repeat(3,1fr);
    row-gap:65px;
  }
  .flow-connector{
    display:none;
  }
  .demo-grid{
    grid-template-columns:1fr;
  }
  .footer-top{
    grid-template-columns:1fr 1fr;
  }
}
@media(max-width:600px){
  .nav{
    height:68px;
    padding:0 20px;
  }
  .brand-name{
    font-size:1.15rem;
  }
  .hero-left{
    padding:125px 23px 80px;
  }
  .hero-title{
    font-size:clamp(2.8rem,13vw,4rem);
    letter-spacing:-.8px;
  }
  .hero-description{
    font-size:.8rem;
  }
  .hero-actions{
    flex-direction:column;
    align-items:stretch;
  }
  .button{
    width:100%;
  }
  .hero-meta{
    gap:20px;
  }
  .hero-right{
    min-height:540px;
  }
  .restaurant-card{
    width:78%;
  }
  .floating-note{
    transform:scale(.82);
  }
  .note-one{
    left:-2%;
  }
  .note-two{
    right:-2%;
  }
  .hero-scroll{
    left:23px;
  }
  .intro-band,
  .use-section,
  .matrix-section,
  .flow-section,
  .demo-section{
    padding-left:23px;
    padding-right:23px;
  }
  .module-section{
    padding:90px 23px;
  }
  .intro-band{
    padding-top:90px;
    padding-bottom:85px;
  }
  .intro-content h2{
    font-size:2.8rem;
  }
  .system-line{
    grid-template-columns:repeat(2,1fr);
    margin-top:65px;
  }
  .section-heading h2{
    font-size:2.8rem;
  }
  .module-copy h2{
    font-size:2.8rem;
  }
  .module-features{
    grid-template-columns:1fr;
  }
  .module-visual{
    min-height:390px;
  }
  .visual-window{
    width:90%;
  }
  .visual-body{
    padding:28px;
  }
  .visual-title strong{
    font-size:1.35rem;
  }
  .float-top{
    right:0;
  }
  .float-bottom{
    left:0;
  }
  .matrix{
    grid-template-columns:1fr;
    margin-top:45px;
  }
  .feature-card{
    min-height:210px;
  }
  .flow-heading h2{
    font-size:3.1rem;
  }
  .flow-track{
    grid-template-columns:1fr 1fr;
    margin-top:65px;
  }
  .brand-moment{
    min-height:570px;
  }
  .brand-moment h2{
    font-size:3.1rem;
  }
  .moment-stats{
    flex-direction:column;
    gap:0;
  }
  .moment-stats div{
    border-right:0;
    border-bottom:1px solid rgba(255,255,255,.08);
    padding:14px;
  }
  .moment-stats div:last-child{
    border-bottom:0;
  }
  .demo-form-wrap{
    padding:23px;
  }
  .form-grid{
    grid-template-columns:1fr;
  }
  .form-grid label.full{
    grid-column:auto;
  }
  .footer{
    padding:65px 23px 22px;
  }
  .footer-top{
    grid-template-columns:1fr;
    gap:42px;
    padding-bottom:50px;
  }
  .footer-middle{
    align-items:flex-start;
    flex-direction:column;
    gap:15px;
  }
  .footer-bottom{
    flex-direction:column;
  }
}
@media(max-width:390px){
  .hero-title{
    font-size:2.65rem;
  }
  .hero-right{
    min-height:500px;
  }
  .restaurant-card{
    width:84%;
  }
  .hero-meta{
    gap:13px;
  }
  .hero-meta span{
    font-size:.5rem;
  }
  .flow-track{
    grid-template-columns:1fr;
  }
}
@media(prefers-reduced-motion:reduce){
  *,
  *::before,
  *::after{
    scroll-behavior:auto!important;
    animation-duration:.01ms!important;
    animation-iteration-count:1!important;
    transition-duration:.01ms!important;
  }
  .reveal{
    opacity:1!important;
    transform:none!important;
  }
}
html,
body{
  overflow-x:hidden!important;
  overflow-y:auto!important;
  height:auto!important;
  min-height:100%!important;
  overscroll-behavior-y:auto;
  scrollbar-gutter:stable;
}
html{
  scroll-behavior:smooth!important;
  scroll-padding-top:96px;
}
body{
  position:relative;
}
#root,
.site{
  min-height:100vh!important;
  height:auto!important;
  overflow:visible!important;
}
.site{
  position:relative;
  isolation:isolate;
  background:
    radial-gradient(circle at 82% 8%, rgba(199,162,105,.07), transparent 28rem),
    radial-gradient(circle at 12% 38%, rgba(166,176,154,.045), transparent 26rem);
}
.site::before{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;
  z-index:900;
  opacity:.055;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.28'/%3E%3C/svg%3E");
  mix-blend-mode:soft-light;
}
html::-webkit-scrollbar{
  width:12px;
}
html::-webkit-scrollbar-track{
  background:#15130f;
}
html::-webkit-scrollbar-thumb{
  background:linear-gradient(180deg,#dfc18d,#a98248);
  border:3px solid #15130f;
  border-radius:999px;
}
html::-webkit-scrollbar-thumb:hover{
  background:#f0d39e;
}
html{
  scrollbar-width:auto;
  scrollbar-color:#c7a269 #15130f;
}
.nav{
  transition:
    background .45s ease,
    border-color .45s ease,
    box-shadow .45s ease,
    transform .45s cubic-bezier(.2,.8,.2,1);
}
.nav-scrolled{
  background:rgba(17,16,13,.84)!important;
  border-bottom-color:rgba(223,193,141,.13)!important;
  box-shadow:0 14px 50px rgba(0,0,0,.18);
}
.desktop-nav button{
  position:relative;
  transition:color .25s ease, transform .25s ease;
}
.desktop-nav button::after{
  content:"";
  position:absolute;
  left:50%;
  bottom:-8px;
  width:5px;
  height:5px;
  border-radius:50%;
  background:var(--gold2);
  transform:translateX(-50%) scale(0);
  transition:transform .25s ease;
}
.desktop-nav button:hover{
  color:var(--cream3);
  transform:translateY(-1px);
}
.desktop-nav button.active{
  color:var(--cream3);
}
.desktop-nav button.active::after{
  transform:translateX(-50%) scale(1);
}
.nav-demo{
  box-shadow:0 0 0 0 rgba(199,162,105,.0);
}
.nav-demo:hover{
  box-shadow:0 0 0 5px rgba(199,162,105,.08);
}
.hero{
  position:relative;
  overflow:hidden;
}
.hero::before{
  content:"";
  position:absolute;
  width:min(42vw,620px);
  height:min(42vw,620px);
  right:-15vw;
  top:8%;
  border-radius:50%;
  border:1px solid rgba(199,162,105,.08);
  box-shadow:
    0 0 100px rgba(199,162,105,.035),
    inset 0 0 100px rgba(199,162,105,.025);
  pointer-events:none;
}
.hero-title{
  text-wrap:balance;
}
.hero-actions .button{
  box-shadow:0 12px 35px rgba(0,0,0,.12);
}
.hero-actions .button.primary{
  box-shadow:
    0 12px 35px rgba(100,75,35,.16),
    inset 0 1px 0 rgba(255,255,255,.2);
}
.restaurant-card{
  box-shadow:
    0 45px 100px rgba(0,0,0,.34),
    0 0 0 1px rgba(255,255,255,.025);
  transition:transform .6s cubic-bezier(.2,.8,.2,1), box-shadow .6s ease;
}
.restaurant-card:hover{
  transform:translateY(-8px) rotateX(1deg) rotateY(-1deg);
  box-shadow:
    0 55px 120px rgba(0,0,0,.42),
    0 0 0 1px rgba(223,193,141,.08);
}
.intro-band,
.use-section,
.module-section,
.matrix-section,
.flow-section,
.brand-moment,
.demo-section,
.footer{
  position:relative;
  isolation:isolate;
}
.section-heading h2,
.flow-heading h2,
.brand-moment h2,
.demo-copy h2{
  text-wrap:balance;
}
.module-section{
  overflow:hidden;
}
.module-grid{
  position:relative;
}
.module-visual{
  transition:
    transform .6s cubic-bezier(.2,.8,.2,1),
    box-shadow .6s ease,
    border-color .4s ease;
}
.module-visual:hover{
  transform:translateY(-7px);
}
.feature-card,
.use-card,
.matrix-card{
  transition:
    transform .45s cubic-bezier(.2,.8,.2,1),
    box-shadow .45s ease,
    border-color .35s ease,
    background .35s ease;
}
.feature-card:hover,
.use-card:hover,
.matrix-card:hover{
  transform:translateY(-6px);
  box-shadow:0 24px 55px rgba(25,20,12,.11);
  border-color:rgba(199,162,105,.28);
}
.dark .feature-card:hover,
.dark .use-card:hover,
.module-section.dark .feature-card:hover{
  box-shadow:0 24px 55px rgba(0,0,0,.24);
}
.flow-step{
  position:relative;
}
.flow-step::before{
  content:"";
  position:absolute;
  inset:8px;
  border:1px solid rgba(199,162,105,.07);
  border-radius:inherit;
  pointer-events:none;
}
.demo-form-wrap{
  position:relative;
  overflow:hidden;
  border-radius:24px!important;
}
.demo-form-wrap::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 100% 0%, rgba(223,193,141,.09), transparent 30%),
    linear-gradient(135deg,rgba(255,255,255,.025),transparent 45%);
}
.form-grid input,
.form-grid textarea,
.form-grid select{
  transition:
    border-color .25s ease,
    background .25s ease,
    box-shadow .25s ease,
    transform .25s ease;
}
.form-grid input:focus,
.form-grid textarea:focus,
.form-grid select:focus{
  outline:none;
  border-color:rgba(223,193,141,.65)!important;
  background:rgba(255,255,255,.065)!important;
  box-shadow:0 0 0 4px rgba(199,162,105,.08);
}
.form-grid label:focus-within > span{
  color:var(--gold2);
}
.form-grid label.full select[name="type"]{background:#fff!important;color:#25221c!important;border:1px solid rgba(255,255,255,.9)!important;font-weight:500!important;appearance:auto!important;-webkit-appearance:auto!important}.form-grid label.full select[name="type"] option{background:#fff!important;color:#25221c!important;font-weight:500!important}.form-grid label.full select[name="type"]:focus{background:#fff!important;color:#25221c!important;border-color:#d3bfa2!important;box-shadow:0 0 0 4px rgba(211,191,162,.18)!important}.form-grid label.full:has(select[name="type"]) > span{color:#fff!important}.form-grid label.full:has(select[name="type"]) > span::after{content:""}.form-grid label.full select[name="type"] option[value=""]{color:#777168!important}

.button{
  position:relative;
  overflow:hidden;
}
.button::before,
.button-primary::before{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.18) 48%,transparent 76%);
  transform:translateX(-120%);
  transition:transform .65s ease;
  pointer-events:none;
}
.button:hover::before,
.button-primary:hover::before{
  transform:translateX(120%);
}
.reveal{
  will-change:transform,opacity;
}
@media(max-width:900px){
  html,
  body{
    overflow-y:auto!important;
  }
  .desktop-nav{
    display:none!important;
  }
  .mobile-menu-button{
    min-width:46px;
    min-height:46px;
  }
  .hero{
    min-height:100svh;
  }
  .hero-actions{
    width:100%;
  }
  .hero-actions .button{
    min-height:52px;
  }
  .demo-grid{
    gap:48px!important;
  }
  .demo-form-wrap{
    border-radius:20px!important;
  }
}
@media(max-width:600px){
  html{
    scrollbar-width:auto;
  }
  .hero-title{
    font-size:clamp(3.2rem,16vw,5.2rem)!important;
  }
  .section-heading h2,
  .flow-heading h2,
  .brand-moment h2,
  .demo-copy h2{
    letter-spacing:-1.7px;
  }
  .form-grid{
    grid-template-columns:1fr!important;
  }
  .form-grid label.full{
    grid-column:auto!important;
  }
  .contact-details a{
    min-height:42px;
  }
}
img,
svg,
canvas,
video{
  max-width:100%;
}
.signature-section{position:relative;overflow:hidden;padding:150px 6vw 120px;background:radial-gradient(circle at 15% 18%,rgba(199,162,105,.15),transparent 25%),radial-gradient(circle at 88% 78%,rgba(166,176,154,.14),transparent 26%),linear-gradient(145deg,#f0e5d2,#e3d3ba 55%,#f5ecdf);color:var(--darkText);isolation:isolate;}
.signature-shell{max-width:1480px;margin:auto;position:relative;z-index:2;}
.signature-orbit{position:absolute;border:1px solid rgba(39,31,20,.08);border-radius:50%;pointer-events:none;animation:premiumOrbit 26s linear infinite;}
.signature-orbit-a{width:700px;height:700px;right:-360px;top:80px;}.signature-orbit-b{width:430px;height:430px;left:-280px;bottom:-180px;animation-direction:reverse;}
.signature-heading{max-width:820px;}.signature-heading h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(3.2rem,6vw,6.4rem);line-height:.92;letter-spacing:-3px;margin:20px 0 30px;}.signature-heading h2 em{color:#8e7752;font-style:italic;}.signature-heading p{max-width:690px;color:rgba(32,29,23,.6);font-size:.9rem;line-height:1.9;}
.signature-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(32,29,23,.14);border:1px solid rgba(32,29,23,.12);margin-top:90px;}.signature-card{position:relative;min-height:370px;padding:28px 25px;background:rgba(248,242,231,.75);transition:transform .45s ease,box-shadow .45s ease,background .35s ease;overflow:hidden;}.signature-card:hover{transform:translateY(-10px);background:#f8f0e2;box-shadow:0 35px 70px rgba(52,40,25,.13);z-index:3;}.signature-card>svg{color:#9d8459;position:absolute;right:25px;top:28px;}.signature-number{font:400 .55rem/1 'DM Mono',monospace;letter-spacing:2px;color:#8e7752;}.signature-rule{height:1px;background:rgba(32,29,23,.11);margin:75px 0 38px;position:relative;}.signature-rule::after{content:"";position:absolute;left:0;top:-1px;width:34%;height:1px;background:#b99b6c;}.signature-card h3{font-family:'DM Serif Display',serif;font-size:1.8rem;font-weight:400;margin-bottom:13px;}.signature-card p{max-width:240px;font-size:.75rem;line-height:1.8;color:rgba(32,29,23,.56);}.signature-card small{position:absolute;bottom:24px;left:25px;font:400 .45rem/1 'DM Mono',monospace;letter-spacing:1.4px;color:rgba(32,29,23,.3);}.signature-marquee{margin-top:75px;border-top:1px solid rgba(32,29,23,.1);border-bottom:1px solid rgba(32,29,23,.1);padding:22px 0;overflow:hidden;white-space:nowrap;}.signature-marquee-track{width:max-content;display:flex;align-items:center;gap:25px;font:400 .55rem/1 'DM Mono',monospace;letter-spacing:2px;color:rgba(32,29,23,.42);animation:premiumMarquee 30s linear infinite;}.signature-marquee-track i{font-style:normal;color:#9f865a;}
.journey-section{position:relative;overflow:hidden;background:#151511;color:#eee5d5;padding:155px 6vw 135px;isolation:isolate;}.journey-section::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 25%,rgba(199,162,105,.12),transparent 25%),radial-gradient(circle at 10% 80%,rgba(166,176,154,.08),transparent 28%);z-index:-1;}.journey-shell{max-width:1480px;margin:auto;display:grid;grid-template-columns:.9fr 1.1fr;gap:7vw;align-items:center;}.journey-copy h2{font-family:'DM Serif Display',serif;font-size:clamp(3rem,5.5vw,6rem);font-weight:400;line-height:.94;letter-spacing:-2.5px;margin:20px 0 28px;}.journey-copy h2 em{font-style:italic;color:#c7a269;}.journey-copy p{max-width:560px;color:rgba(238,229,213,.52);font-size:.88rem;line-height:1.9;}.journey-note{margin-top:42px;font:400 .48rem/1 'DM Mono',monospace;letter-spacing:1.8px;color:rgba(238,229,213,.34);display:flex;align-items:center;gap:9px;}.journey-dot{width:7px;height:7px;border-radius:50%;background:#a6b09a;box-shadow:0 0 16px rgba(166,176,154,.6);}
.journey-visual{position:relative;min-height:650px;display:flex;align-items:center;justify-content:center;}.journey-phone{width:275px;height:555px;border-radius:34px;padding:10px;border:1px solid rgba(255,255,255,.15);position:absolute;box-shadow:0 45px 100px rgba(0,0,0,.45);}.phone-back{transform:translate(-105px,-25px) rotate(-8deg);background:#20201b;opacity:.5;}.phone-front{transform:translate(50px,25px) rotate(4deg);background:#e8ddca;color:#27231d;z-index:2;}.phone-notch{width:78px;height:17px;background:#080806;border-radius:0 0 14px 14px;position:absolute;top:0;left:50%;transform:translateX(-50%);}.phone-screen{padding:45px 17px 20px;display:flex;flex-direction:column;gap:12px;height:100%;border-radius:26px;overflow:hidden;}.dark-phone{color:#eee5d5;background:linear-gradient(150deg,#292720,#10100d);}.light-phone{background:linear-gradient(150deg,#f6eddf,#d8cbb4);}.phone-screen small{font:400 .42rem/1 'DM Mono',monospace;letter-spacing:1.4px;opacity:.5;}.phone-screen strong{font-family:'DM Serif Display',serif;font-size:2rem;font-weight:400;line-height:1;}.phone-screen p{font-size:.62rem;opacity:.52;line-height:1.5;}.mock-dish{height:150px;border-radius:22px;background:radial-gradient(circle at 50% 45%,#c5ab7e 0 16%,#766448 17% 25%,transparent 26%),radial-gradient(circle at 50% 50%,#27251f 0 45%,#0d0d0b 46% 58%,transparent 59%);margin:8px 0;}.mock-line{height:8px;border-radius:99px;background:currentColor;opacity:.12;width:90%;}.mock-line.short{width:55%;}.mock-menu{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center;padding:8px;border:1px solid rgba(39,31,20,.1);background:rgba(255,255,255,.25);border-radius:12px;}.mock-menu>span{width:52px;height:52px;border-radius:11px;background:radial-gradient(circle at 50% 45%,#a68b5d 0 20%,#5e4e38 21% 35%,#25231e 36% 52%,#171612 53%);}.mock-menu>span.sage-dish{background:radial-gradient(circle at 50% 50%,#b1ad84 0 19%,#6d704d 20% 34%,#29271f 35% 52%,#171612 53%);}.mock-menu b{display:block;font-size:.62rem;font-weight:600;}.mock-menu small{display:block;margin-top:4px;font-size:.43rem;}.phone-screen button{border:0;background:#29251f;color:#f2e7d5;border-radius:999px;padding:11px 13px;font-size:.58rem;display:flex;align-items:center;justify-content:center;gap:7px;}.journey-float{position:absolute;right:0;bottom:70px;z-index:5;display:flex;align-items:center;gap:10px;padding:13px 15px;background:rgba(28,27,23,.86);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px);}.journey-float>svg{color:#c7a269;}.journey-float small{display:block;font:400 .42rem/1 'DM Mono',monospace;letter-spacing:1.4px;color:rgba(238,229,213,.34);}.journey-float b{display:block;font-size:.67rem;font-weight:500;margin-top:4px;}.journey-steps{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(255,255,255,.11);margin-top:55px;}.journey-step{display:grid;grid-template-columns:35px 1fr;gap:15px;padding:28px 22px 8px;border-right:1px solid rgba(255,255,255,.09);min-height:150px;}.journey-step:last-child{border-right:0;}.journey-step>span{font:400 .5rem/1 'DM Mono',monospace;color:#c7a269;letter-spacing:1.4px;}.journey-step h3{font-family:'DM Serif Display',serif;font-size:1.3rem;font-weight:400;margin-bottom:7px;}.journey-step p{font-size:.65rem;line-height:1.7;color:rgba(238,229,213,.4);}
.command-section{position:relative;overflow:hidden;background:#e8ddca;color:#242018;padding:150px 6vw 135px;}.command-section::before{content:"";position:absolute;inset:0;opacity:.35;background-image:linear-gradient(rgba(40,32,21,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(40,32,21,.07) 1px,transparent 1px);background-size:90px 90px;mask-image:radial-gradient(circle at 50% 45%,#000,transparent 82%);}.command-shell{max-width:1480px;margin:auto;position:relative;z-index:2;}.command-heading{display:flex;justify-content:space-between;align-items:end;gap:30px;}.command-heading h2{font-family:'DM Serif Display',serif;font-size:clamp(3rem,5.3vw,5.8rem);font-weight:400;line-height:.94;letter-spacing:-2.5px;margin-top:18px;}.command-heading h2 em{font-style:italic;color:#8f7855;}.live-pill{font:400 .47rem/1 'DM Mono',monospace;letter-spacing:1.5px;border:1px solid rgba(36,32,24,.14);padding:10px 13px;display:flex;gap:8px;align-items:center;color:rgba(36,32,24,.48);}.live-pill i{width:6px;height:6px;border-radius:50%;background:#8d9a7e;box-shadow:0 0 10px rgba(141,154,126,.8);}.command-board{margin-top:65px;background:#1a1915;color:#e9dfcf;border:1px solid rgba(255,255,255,.1);box-shadow:0 55px 110px rgba(49,38,23,.22);overflow:hidden;}.board-top{height:54px;border-bottom:1px solid rgba(255,255,255,.08);display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;padding:0 20px;font:400 .45rem/1 'DM Mono',monospace;letter-spacing:1.5px;color:rgba(233,223,207,.38);}.board-top span:nth-child(2){text-align:center;}.board-top span:last-child{text-align:right;}.board-top span:first-child{color:#c7a269;}.board-body{display:grid;grid-template-columns:190px 1fr;min-height:560px;}.board-sidebar{border-right:1px solid rgba(255,255,255,.08);padding:25px 13px;}.board-nav{display:flex;align-items:center;gap:10px;padding:12px;color:rgba(233,223,207,.38);font-size:.62rem;margin-bottom:4px;border:1px solid transparent;transition:.25s ease;}.board-nav.active{color:#eadfcf;border-color:rgba(199,162,105,.16);background:rgba(199,162,105,.07);}.board-nav:hover{color:#eadfcf;background:rgba(255,255,255,.03);}.board-main{padding:32px;}.board-welcome{display:flex;justify-content:space-between;align-items:end;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.08);}.board-welcome small{display:block;font:400 .44rem/1 'DM Mono',monospace;letter-spacing:1.4px;color:rgba(233,223,207,.3);margin-bottom:8px;}.board-welcome b{font-family:'DM Serif Display',serif;font-size:1.65rem;font-weight:400;}.board-welcome button{background:transparent;border:1px solid rgba(255,255,255,.12);color:rgba(233,223,207,.62);padding:10px 13px;font-size:.56rem;display:flex;gap:7px;align-items:center;}.board-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.08);margin:25px 0;}.board-metrics>div{background:#1a1915;padding:18px;min-height:120px;display:flex;flex-direction:column;justify-content:space-between;}.board-metrics small{font:400 .42rem/1 'DM Mono',monospace;letter-spacing:1.3px;color:rgba(233,223,207,.3);}.board-metrics strong{font-size:1.35rem;font-weight:500;}.board-metrics em{font-style:normal;font-size:.52rem;color:#9fa98e;}.board-lower{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;}.board-panel{border:1px solid rgba(255,255,255,.08);padding:20px;background:#171613;min-height:265px;}.board-panel header{display:flex;justify-content:space-between;margin-bottom:30px;font-size:.65rem;}.board-panel header small{font:400 .41rem/1 'DM Mono',monospace;color:rgba(233,223,207,.28);letter-spacing:1px;}.bars{height:150px;display:flex;align-items:end;gap:11px;border-bottom:1px solid rgba(255,255,255,.08);padding:0 8px;}.bars i{flex:1;display:block;min-height:14px;border-radius:3px 3px 0 0;background:linear-gradient(180deg,#c7a269,#806d4b);}.bars i:nth-child(1){height:35%;}.bars i:nth-child(2){height:50%;}.bars i:nth-child(3){height:43%;}.bars i:nth-child(4){height:67%;}.bars i:nth-child(5){height:59%;}.bars i:nth-child(6){height:81%;}.bars i:nth-child(7){height:93%;}.board-panel footer{display:flex;justify-content:space-between;padding:9px 8px 0;font:400 .4rem/1 'DM Mono',monospace;color:rgba(233,223,207,.25);}.activity>div:not(.panel-head){display:grid;grid-template-columns:8px 1fr auto;column-gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06);}.activity>div:last-child{border-bottom:0;}.activity>div>i{width:5px;height:5px;border-radius:50%;background:#a6b09a;box-shadow:0 0 8px rgba(166,176,154,.5);}.activity b{font-size:.6rem;font-weight:500;}.activity small{display:block;font-size:.46rem;color:rgba(233,223,207,.34);margin-top:3px;}.activity em{font:400 .42rem/1 'DM Mono',monospace;font-style:normal;color:rgba(233,223,207,.27);}.command-footer{display:flex;justify-content:space-between;margin-top:25px;font:400 .46rem/1 'DM Mono',monospace;letter-spacing:1.5px;color:rgba(36,32,24,.4);}
.faq-section{position:relative;overflow:hidden;padding:150px 6vw 45px;background:#11100d;color:#f4ecdc;isolation:isolate;}.faq-section::before{content:"";position:absolute;inset:0;z-index:-2;background:radial-gradient(circle at 12% 20%,rgba(199,162,105,.14),transparent 30%),radial-gradient(circle at 88% 78%,rgba(166,176,154,.08),transparent 28%),linear-gradient(135deg,#11100d,#1b1914 55%,#11100d);}.faq-inner{max-width:1480px;margin:auto;display:grid;grid-template-columns:minmax(320px,.78fr) minmax(520px,1.22fr);gap:9vw;position:relative;z-index:2;}.faq-intro{position:sticky;top:120px;align-self:start;}.faq-kicker{font:400 .58rem/1 'DM Mono',monospace;letter-spacing:2px;color:rgba(244,236,220,.34);margin-top:28px;}.faq-intro h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(2.8rem,4.8vw,5.5rem);line-height:.98;letter-spacing:-2px;margin:18px 0 25px;}.faq-intro h2 em{color:#d1b27e;font-style:italic;}.faq-intro>p{max-width:500px;color:rgba(244,236,220,.56);font-size:.9rem;line-height:1.85;}.faq-side-card{margin-top:52px;padding:18px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);backdrop-filter:blur(14px);display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:center;max-width:500px;}.faq-side-card>span{width:40px;height:40px;border:1px solid rgba(199,162,105,.45);display:grid;place-items:center;color:#d1b27e;background:rgba(199,162,105,.06);}.faq-side-card small{display:block;color:#b99968;font:400 .52rem/1 'DM Mono',monospace;letter-spacing:2px;margin-bottom:5px;}.faq-side-card strong{font-size:.76rem;font-weight:500;color:rgba(244,236,220,.8);}.faq-side-card button{grid-column:1/-1;justify-self:start;background:transparent;color:#d1b27e;font-size:.67rem;display:flex;align-items:center;gap:9px;padding:7px 0;cursor:pointer;}.faq-list{border-top:1px solid rgba(255,255,255,.13);}.faq-item{border-bottom:1px solid rgba(255,255,255,.13);position:relative;}.faq-item::before{content:"";position:absolute;left:0;top:0;width:1px;height:0;background:#c7a269;transition:height .45s ease;}.faq-item.is-open::before{height:100%;}.faq-question{width:100%;background:none;color:#f4ecdc;display:grid;grid-template-columns:44px 1fr 38px;gap:18px;text-align:left;align-items:center;padding:27px 0;cursor:pointer;}.faq-index{font:400 .56rem/1 'DM Mono',monospace;color:rgba(199,162,105,.7);letter-spacing:1px;}.faq-question-text{font-family:'DM Serif Display',serif;font-size:clamp(1.05rem,1.55vw,1.45rem);font-weight:400;line-height:1.25;transition:color .25s ease;}.faq-question:hover .faq-question-text,.faq-item.is-open .faq-question-text{color:#d1b27e;}.faq-toggle{width:32px;height:32px;border:1px solid rgba(255,255,255,.14);border-radius:50%;position:relative;display:block;transition:.35s ease;}.faq-toggle i{position:absolute;left:9px;top:15px;width:12px;height:1px;background:#d1b27e;transition:.35s ease;}.faq-toggle i+i{transform:rotate(90deg);}.faq-item.is-open .faq-toggle{background:#b99968;border-color:#b99968;transform:rotate(45deg);}.faq-item.is-open .faq-toggle i{background:#11100d;}.faq-answer-wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s cubic-bezier(.2,.8,.2,1);}.faq-item.is-open .faq-answer-wrap{grid-template-rows:1fr;}.faq-answer{overflow:hidden;min-height:0;color:rgba(244,236,220,.52);font-size:.81rem;line-height:1.85;padding:0 70px 0 62px;opacity:0;transition:padding .45s ease,opacity .35s ease;}.faq-item.is-open .faq-answer{padding-bottom:29px;opacity:1;}.faq-orbit{position:absolute;border:1px solid rgba(199,162,105,.08);border-radius:50%;pointer-events:none;z-index:-1;}.faq-orbit-one{width:650px;height:650px;right:-330px;top:90px;}.faq-orbit-two{width:430px;height:430px;left:-300px;bottom:-220px;border-color:rgba(166,176,154,.06);}.faq-bottom-line{max-width:1480px;margin:100px auto 0;padding-top:18px;border-top:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;color:rgba(244,236,220,.25);font:400 .5rem/1 'DM Mono',monospace;letter-spacing:2px;}
html,body,#root{height:auto!important;min-height:100%!important;overflow-x:hidden!important;}.site{height:auto!important;min-height:100vh!important;max-height:none!important;overflow:visible!important;}.site>main{height:auto!important;max-height:none!important;overflow:visible!important;}html{overflow-y:scroll!important;scroll-behavior:smooth!important;scrollbar-gutter:stable;}body{overflow-y:auto!important;overscroll-behavior-y:auto!important;}section[id]{scroll-margin-top:92px;}
body{scrollbar-width:thin;scrollbar-color:#c7a269 #11100d;}body::-webkit-scrollbar{width:11px;}body::-webkit-scrollbar-track{background:#11100d;}body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#d1b27e,#a88758);border:3px solid #11100d;border-radius:999px;}
@keyframes premiumOrbit{to{transform:rotate(360deg);}}@keyframes premiumMarquee{to{transform:translateX(-50%);}}
@media(max-width:1180px){.signature-grid{grid-template-columns:repeat(2,1fr);}.journey-shell{grid-template-columns:1fr;}.journey-visual{min-height:700px;}.journey-steps{margin-top:20px;}.board-body{grid-template-columns:160px 1fr;}.board-main{padding:25px;}}
@media(max-width:900px){.signature-section,.journey-section,.command-section,.faq-section{padding-left:28px;padding-right:28px;}.command-heading{align-items:flex-start;flex-direction:column;}.board-metrics{grid-template-columns:repeat(2,1fr);}.board-lower{grid-template-columns:1fr;}.faq-inner{grid-template-columns:1fr;gap:55px;}.faq-intro{position:relative;top:auto;}.faq-side-card{margin-top:30px;}}
@media(max-width:760px){.signature-section{padding-top:105px;padding-bottom:90px;}.signature-heading h2{font-size:clamp(3rem,13vw,4.5rem);letter-spacing:-1.5px;}.signature-grid{grid-template-columns:1fr;margin-top:55px;}.journey-section{padding-top:105px;padding-bottom:90px;}.journey-copy h2{font-size:clamp(2.8rem,13vw,4.4rem);}.journey-visual{transform:scale(.86);transform-origin:center top;margin-bottom:-70px;}.phone-back{transform:translate(-75px,-15px) rotate(-7deg);}.phone-front{transform:translate(35px,25px) rotate(3deg);}.journey-float{right:-5px;bottom:55px;}.journey-steps{grid-template-columns:1fr 1fr;}.journey-step{border-bottom:1px solid rgba(255,255,255,.1);}.journey-step:nth-child(2){border-right:0;}.command-section{padding-top:105px;padding-bottom:90px;}.command-board{overflow:auto;}.board-body{min-width:760px;}.command-footer{flex-direction:column;gap:12px;line-height:1.6;}.faq-section{padding-top:105px;padding-bottom:35px;}.faq-intro h2{font-size:clamp(2.6rem,13vw,4rem);}.faq-question{grid-template-columns:30px 1fr 32px;gap:11px;padding:23px 0;}.faq-question-text{font-size:1.05rem;}.faq-answer{padding-left:41px;padding-right:20px;font-size:.76rem;}.faq-bottom-line{margin-top:65px;gap:20px;flex-direction:column;}}
@media(max-width:520px){.signature-section,.journey-section,.command-section,.faq-section{padding-left:20px;padding-right:20px;}.journey-visual{transform:scale(.72);margin-bottom:-130px;}.journey-steps{grid-template-columns:1fr;}.journey-step{border-right:0!important;min-height:120px;}.board-main{padding:20px;}.faq-side-card{padding:15px;}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important;}.signature-orbit,.signature-marquee-track{animation:none!important;}.reveal{transition:none!important;transform:none!important;opacity:1!important;}}
.pratyeksha-detail-1{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-2{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-3{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-4{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-5{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-6{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-7{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-8{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-9{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-10{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-11{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-12{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-13{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-14{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-15{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-16{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-17{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-18{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-19{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-20{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-21{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-22{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-23{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-24{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-25{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-26{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-27{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-28{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-29{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-30{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-31{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-32{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-33{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-34{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-35{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-36{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-37{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-38{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-39{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-40{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-41{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-42{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-43{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-44{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-45{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-46{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-47{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-48{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-49{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-50{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-51{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-52{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-53{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-54{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-55{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-56{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-57{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-58{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-59{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-60{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-61{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-62{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-63{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-64{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-65{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-66{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-67{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-68{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-69{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-70{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-71{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-72{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-73{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-74{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-75{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-76{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-77{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-78{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-79{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-80{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-81{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-82{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-83{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-84{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-85{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-86{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-87{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-88{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-89{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-90{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-91{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-92{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-93{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-94{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-95{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-96{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-97{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-98{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-99{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.pratyeksha-detail-100{
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
*,*::before,*::after{box-sizing:border-box;}
.signature-section,.journey-section,.command-section,.faq-section,.signature-section h2,.signature-section h3,.journey-section h2,.journey-section h3,.command-section h2,.command-section h3,.faq-section h2,.faq-section h3,.signature-section p,.journey-section p,.command-section p,.faq-section p{overflow-wrap:anywhere;}
.signature-section{padding-top:132px;padding-bottom:112px;}.signature-heading{width:100%;max-width:760px;}.signature-heading .eyebrow{margin-bottom:18px;}.signature-heading h2{max-width:760px;margin:0 0 25px;line-height:.96;}.signature-heading p{max-width:650px;margin:0;color:rgba(32,29,23,.72);}.signature-grid{margin-top:72px;}.signature-card{padding:30px 28px 68px;min-height:355px;}.signature-card>svg{right:28px;top:30px;opacity:.9;}.signature-rule{margin:68px 0 32px;}.signature-card h3{max-width:210px;line-height:1.05;margin:0 0 12px;}.signature-card p{max-width:235px;margin:0;color:rgba(32,29,23,.66);line-height:1.75;}.signature-card small{left:28px;bottom:27px;color:rgba(32,29,23,.46);}.signature-marquee{margin-top:62px;padding:20px 0;}.signature-marquee-track{color:rgba(32,29,23,.55);}.signature-marquee-track i{color:#806a48;}
.journey-section{padding-top:132px;padding-bottom:118px;}.journey-shell{gap:6vw;}.journey-copy{min-width:0;}.journey-copy .eyebrow{margin-bottom:18px;}.journey-copy h2{max-width:650px;margin:0 0 25px;line-height:.97;}.journey-copy p{max-width:540px;margin:0;color:rgba(238,229,213,.70);}.journey-note{margin-top:32px;color:rgba(238,229,213,.48);}.journey-visual{min-width:0;}.journey-float{right:2%;}.journey-steps{margin-top:46px;}.journey-step{padding:27px 24px 18px;}.journey-step h3{margin:0 0 8px;line-height:1.05;}.journey-step p{margin:0;color:rgba(238,229,213,.56);}
.command-section{padding-top:132px;padding-bottom:118px;}.command-heading{gap:42px;}.command-heading>div{min-width:0;}.command-heading .eyebrow{margin-bottom:18px;}.command-heading h2{max-width:700px;margin:0;line-height:.97;}.live-pill{flex:0 0 auto;white-space:nowrap;}.command-board{margin-top:58px;border-radius:2px;}.board-top{padding:0 24px;min-height:54px;}.board-body{min-height:540px;}.board-sidebar{padding:26px 14px;}.board-nav{padding:11px 12px;min-height:40px;}.board-main{padding:30px;min-width:0;}.board-welcome{gap:20px;}.board-welcome>div{min-width:0;}.board-welcome b{line-height:1.1;}.board-welcome button{flex:0 0 auto;white-space:nowrap;}.board-metrics{margin:24px 0;}.board-metrics>div{padding:17px 18px;min-height:116px;}.board-metrics strong{line-height:1.05;}.board-lower{gap:16px;}.board-panel{padding:19px;}.command-footer{margin-top:22px;gap:24px;line-height:1.5;}.command-footer span:last-child{text-align:right;}
.faq-section{padding-top:132px;padding-bottom:42px;}.faq-inner{gap:7vw;}.faq-intro{min-width:0;}.faq-intro .eyebrow{margin-bottom:18px;}.faq-kicker{margin-top:0;margin-bottom:18px;color:rgba(244,236,220,.48);}.faq-intro h2{max-width:620px;margin:0 0 24px;line-height:.99;}.faq-intro>p{max-width:500px;margin:0;color:rgba(244,236,220,.68);}.faq-side-card{margin-top:38px;padding:18px 19px;}.faq-side-card strong{line-height:1.35;}.faq-list{min-width:0;}.faq-question{padding:25px 0;min-height:84px;}.faq-question-text{padding-right:8px;line-height:1.3;}.faq-answer{padding-left:62px;padding-right:58px;color:rgba(244,236,220,.68);line-height:1.8;}.faq-item.is-open .faq-answer{padding-bottom:27px;}.faq-bottom-line{margin-top:78px;padding:18px 0 0;gap:28px;line-height:1.5;}.faq-bottom-line span:last-child{text-align:right;}
.signature-card h3,.journey-step h3,.board-welcome b,.faq-question-text{color:inherit;}.signature-card p,.journey-copy p,.journey-step p,.faq-intro>p,.faq-answer{font-weight:400;}
@media(max-width:1180px){.signature-section,.journey-section,.command-section,.faq-section{padding-top:112px;padding-bottom:96px;}.signature-grid{margin-top:58px;}.journey-shell{gap:40px;}.journey-copy h2{max-width:700px;}.journey-visual{min-height:650px;}.command-board{margin-top:48px;}.faq-inner{gap:50px;}}
@media(max-width:900px){.signature-section,.journey-section,.command-section,.faq-section{padding-left:30px;padding-right:30px;}.signature-heading h2,.journey-copy h2,.command-heading h2,.faq-intro h2{letter-spacing:-1.8px;}.signature-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.journey-copy p{max-width:620px;}.journey-visual{width:100%;}.command-heading{gap:22px;}.live-pill{margin-top:4px;}.board-main{padding:25px;}.faq-inner{gap:44px;}.faq-intro>p{max-width:650px;}}
@media(max-width:760px){.signature-section,.journey-section,.command-section,.faq-section{padding-left:22px;padding-right:22px;}.signature-section{padding-top:88px;padding-bottom:78px;}.signature-heading h2{margin-bottom:20px;line-height:.98;}.signature-heading p{font-size:.82rem;line-height:1.8;}.signature-grid{margin-top:42px;gap:1px;}.signature-card{min-height:315px;padding:25px 22px 62px;}.signature-card>svg{right:22px;top:25px;}.signature-rule{margin:58px 0 27px;}.signature-card h3{font-size:1.55rem;max-width:190px;}.signature-card p{max-width:270px;}.signature-card small{left:22px;bottom:22px;}.signature-marquee{margin-top:45px;}.journey-section{padding-top:88px;padding-bottom:78px;}.journey-copy h2{margin-bottom:20px;line-height:1;}.journey-copy p{font-size:.82rem;line-height:1.8;}.journey-note{margin-top:27px;line-height:1.4;}.journey-visual{min-height:600px;}.journey-float{right:0;bottom:42px;}.journey-steps{margin-top:15px;}.journey-step{padding:23px 18px 17px;}.journey-step p{font-size:.62rem;line-height:1.65;}.command-section{padding-top:88px;padding-bottom:78px;}.command-heading h2{line-height:1;}.live-pill{white-space:normal;line-height:1.4;}.command-board{margin-top:38px;}.command-footer{margin-top:18px;gap:9px;}.command-footer span:last-child{text-align:left;}.faq-section{padding-top:88px;padding-bottom:30px;}.faq-kicker{margin-bottom:14px;}.faq-intro h2{margin-bottom:19px;line-height:1.01;}.faq-intro>p{font-size:.82rem;line-height:1.8;}.faq-side-card{margin-top:27px;}.faq-question{grid-template-columns:27px minmax(0,1fr) 32px;gap:10px;padding:21px 0;min-height:74px;}.faq-question-text{font-size:1rem;line-height:1.28;padding-right:2px;}.faq-answer{padding-left:37px;padding-right:15px;font-size:.75rem;line-height:1.75;}.faq-item.is-open .faq-answer{padding-bottom:23px;}.faq-bottom-line{margin-top:54px;gap:14px;}.faq-bottom-line span:last-child{text-align:left;}}
@media(max-width:520px){.signature-section,.journey-section,.command-section,.faq-section{padding-left:18px;padding-right:18px;}.signature-grid{grid-template-columns:1fr;}.signature-card{min-height:300px;}.journey-visual{min-height:540px;}.journey-float{right:-2px;max-width:190px;}.board-main{padding:19px;}.faq-side-card{padding:15px;}}
.signature-number{color:#765f3e;}.signature-card small{color:rgba(32,29,23,.50);}.journey-note{color:rgba(238,229,213,.48);}.board-top,.board-metrics small,.board-panel header small,.activity small,.activity em,.board-panel footer{color:rgba(233,223,207,.48);}.faq-index{color:rgba(209,178,126,.86);}.faq-answer{color:rgba(244,236,220,.70);}.faq-bottom-line{color:rgba(244,236,220,.38);}
.fusion-section{position:relative;overflow:hidden;background:linear-gradient(135deg,#171712 0%,#211f19 52%,#171814 100%);color:#f7efdf;padding:150px 6vw 120px;border-top:1px solid rgba(231,214,184,.12)}
.fusion-inner{position:relative;z-index:2;max-width:1480px;margin:auto}.fusion-orb{position:absolute;border-radius:50%;pointer-events:none}.fusion-orb-one{width:420px;height:420px;left:-180px;top:90px;background:radial-gradient(circle,rgba(199,162,105,.16),transparent 68%)}.fusion-orb-two{width:520px;height:520px;right:-250px;bottom:-200px;background:radial-gradient(circle,rgba(166,176,154,.13),transparent 68%)}
.fusion-heading{max-width:850px}.fusion-kicker{font:10px/1.4 'DM Mono',monospace;letter-spacing:.2em;color:#a6b09a;margin:18px 0 25px}.fusion-heading h2{font:clamp(42px,5.5vw,82px)/.96 'DM Sans',sans-serif;letter-spacing:-.055em;font-weight:500}.fusion-heading h2 em{font-family:'DM Serif Display',serif;color:#dfc18d;font-weight:400}.fusion-heading p{max-width:700px;color:#b7af9f;font-size:15px;line-height:1.9;margin-top:28px}
.fusion-grid{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:16px;margin-top:70px}.fusion-panel{min-height:650px;padding:18px;border:1px solid rgba(231,214,184,.13);background:rgba(250,246,238,.035);box-shadow:0 30px 100px rgba(0,0,0,.24);backdrop-filter:blur(18px);position:relative;overflow:hidden}.fusion-panel-top{display:flex;justify-content:space-between;align-items:center;color:#9f988a;font:10px 'DM Mono',monospace;letter-spacing:.16em;padding:4px 4px 16px}.fusion-panel-top svg{color:#c7a269}.fusion-phone{width:min(285px,82%);margin:18px auto 0;border-radius:34px;padding:17px 14px 20px;background:linear-gradient(160deg,#f7edda,#e7d6b8);color:#242119;box-shadow:0 28px 80px rgba(0,0,0,.4);transform:rotate(-2deg)}.fusion-phone-top,.fusion-phone-search,.fusion-phone-tabs{display:flex;justify-content:space-between;align-items:center}.fusion-phone-top{font:8px 'DM Mono',monospace;letter-spacing:.12em;color:#746b5c}.fusion-phone-brand{font:22px 'DM Serif Display',serif;margin:23px 4px 14px}.fusion-phone-search{font-size:9px;border:1px solid rgba(30,25,18,.13);border-radius:12px;padding:10px 9px;color:#6d6558}.fusion-phone-tabs{gap:6px;margin-top:16px;font-size:8px;color:#776e60}.fusion-phone-tabs b{color:#201d17;border-bottom:1px solid #c7a269;padding-bottom:5px}.fusion-dish-hero{height:190px;margin:10px 0 14px;border-radius:25px;background:radial-gradient(circle at 50% 46%,#d5c39e 0 19%,#a68e62 20% 28%,#433c2d 29% 31%,transparent 32%),linear-gradient(145deg,#ded0b2,#a99877);position:relative;display:grid;place-items:center;overflow:hidden}.fusion-dish-orbit{width:145px;height:145px;border:1px solid rgba(255,255,255,.55);border-radius:50%}.fusion-dish-core{position:absolute;font-size:30px;color:#fff5df}.fusion-dish-hero span{position:absolute;left:12px;bottom:12px;background:#201d17;color:#f4ecdc;border-radius:999px;padding:5px 8px;font:7px 'DM Mono',monospace}.fusion-phone-title{font:20px 'DM Serif Display',serif}.fusion-phone-copy{font-size:9px;line-height:1.7;color:#6b6254;margin-top:5px}.fusion-panel-note{position:absolute;left:22px;right:22px;bottom:20px;display:flex;justify-content:space-between;gap:14px;align-items:end;border-top:1px solid rgba(231,214,184,.11);padding-top:15px}.fusion-panel-note strong{font-size:12px;font-weight:500}.fusion-panel-note span{font:8px/1.5 'DM Mono',monospace;color:#8e887b;text-align:right}
.fusion-board{background:#11120f;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px;margin-top:10px}.fusion-board-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px}.fusion-live{font:8px 'DM Mono',monospace;color:#a6b09a;border:1px solid rgba(166,176,154,.3);border-radius:99px;padding:5px 8px}.fusion-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.fusion-columns small{font:8px 'DM Mono',monospace;color:#817b70;letter-spacing:.12em}.fusion-ticket{margin-top:8px;background:#1d1d18;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:11px;display:grid;gap:5px}.fusion-ticket.active{border-color:rgba(199,162,105,.55)}.fusion-ticket.ready{border-color:rgba(166,176,154,.4)}.fusion-ticket b{font:8px 'DM Mono',monospace;color:#c7a269}.fusion-ticket strong{font-size:10px;font-weight:500}.fusion-ticket span{font-size:7px;color:#817b70}.fusion-ticket i{font:8px 'DM Mono',monospace;color:#dfc18d;font-style:normal}.fusion-ticket.ready i{color:#a6b09a}
.fusion-command-window{margin-top:10px;background:#f1e6d2;color:#28251d;border-radius:18px;padding:18px}.fusion-command-head{display:flex;justify-content:space-between;gap:10px}.fusion-command-head small{display:block;font:7px 'DM Mono',monospace;color:#8b806d;letter-spacing:.12em}.fusion-command-head strong{display:block;font:18px 'DM Serif Display',serif;margin-top:4px}.fusion-command-head>span{font:7px 'DM Mono',monospace;color:#8b806d}.fusion-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:18px}.fusion-metrics div{background:rgba(255,255,255,.42);padding:10px;border-radius:10px}.fusion-metrics small{display:block;font:6px 'DM Mono',monospace;color:#847966}.fusion-metrics b{display:block;font-size:14px;margin-top:5px}.fusion-metrics span{font:7px 'DM Mono',monospace;color:#718064}.fusion-chart{height:180px;margin-top:16px;position:relative;overflow:hidden;border-bottom:1px solid rgba(40,37,29,.14)}.fusion-chart-fill{position:absolute;inset:45% -10% -10% 0;background:linear-gradient(180deg,rgba(199,162,105,.28),rgba(199,162,105,0));clip-path:polygon(0 45%,15% 52%,30% 30%,45% 38%,60% 20%,75% 31%,90% 10%,100% 20%,100% 100%,0 100%)}.fusion-chart-line{position:absolute;inset:0;display:flex;justify-content:space-around;align-items:flex-start;padding-top:45%;z-index:2}.fusion-chart-line span{width:7px;height:7px;border-radius:50%;background:#927542}.fusion-floor{display:grid;grid-template-columns:repeat(8,1fr);gap:7px;margin-top:14px}.fusion-floor span{height:24px;border:1px solid rgba(40,37,29,.12);border-radius:7px;text-align:center;line-height:22px;color:#aaa18f;font-size:8px}.fusion-floor .occupied{color:#8d7043;background:rgba(199,162,105,.16)}.fusion-command-foot{display:flex;justify-content:space-between;margin-top:12px;font:7px 'DM Mono',monospace;color:#817665}.fusion-bottom{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:45px;padding-top:24px;border-top:1px solid rgba(231,214,184,.12)}.fusion-bottom>span{font:8px 'DM Mono',monospace;color:#8f897c;letter-spacing:.13em}.fusion-bottom strong{font:14px 'DM Serif Display',serif;font-weight:400;color:#dfc18d}.fusion-swatches{display:flex;gap:5px}.fusion-swatches i{width:18px;height:18px;border-radius:50%;display:block;border:1px solid rgba(255,255,255,.12)}.fusion-swatches i:nth-child(1){background:#171712}.fusion-swatches i:nth-child(2){background:#f4ecdc}.fusion-swatches i:nth-child(3){background:#c7a269}.fusion-swatches i:nth-child(4){background:#a6b09a}
@media(max-width:1050px){.fusion-grid{grid-template-columns:1fr 1fr}.fusion-command-panel{grid-column:1/-1}.fusion-command-window{max-width:680px;margin:10px auto 0}.fusion-bottom{flex-wrap:wrap}}
@media(max-width:760px){.fusion-section{padding:90px 22px 80px}.fusion-heading h2{font-size:42px}.fusion-grid{grid-template-columns:1fr;gap:12px;margin-top:45px}.fusion-panel{min-height:610px}.fusion-command-panel{grid-column:auto}.fusion-phone{width:78%}.fusion-columns{grid-template-columns:1fr}.fusion-columns>div:not(:first-child){display:none}.fusion-bottom{display:grid;gap:16px}.fusion-panel-note{align-items:flex-start;flex-direction:column}.fusion-panel-note span{text-align:left}.fusion-command-window{padding:14px}.fusion-metrics b{font-size:12px}.fusion-chart{height:145px}}
.product-section {
  padding: 150px 5vw;
  background:
    radial-gradient(circle at 70% 20%, rgba(200,168,107,.08), transparent 30%),
    var(--charcoal);
}
.section-head {
  max-width: 1500px;
  margin: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
}
.section-head h2 {
  margin: 12px 0 0;
  max-width: 800px;
  font-family: "Playfair Display", serif;
  font-size: clamp(45px, 5.4vw, 82px);
  line-height: .96;
  letter-spacing: -.06em;
  font-weight: 500;
}
.section-head p {
  max-width: 400px;
  color: #8f8b7e;
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}
.product-tabs {
  max-width: 1500px;
  margin: 80px auto 35px;
  display: flex;
  gap: 7px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}
.product-tabs::-webkit-scrollbar {
  display: none;
}
.product-tab {
  min-width: 180px;
  padding: 18px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #77766d;
  text-align: left;
  transition: .3s ease;
}
.product-tab:hover {
  color: var(--cream);
}
.product-tab.active {
  color: var(--cream);
  border-bottom-color: var(--gold);
}
.product-tab-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.product-tab-number {
  color: var(--gold);
  font-size: 9px;
}
.product-tab-icon {
  color: #66665e;
}
.product-tab.active .product-tab-icon {
  color: var(--gold-light);
}
.product-tab strong {
  display: block;
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.product-detail {
  max-width: 1500px;
  margin: auto;
  display: grid;
  grid-template-columns: .62fr 1.38fr;
  gap: 50px;
  align-items: stretch;
}
.product-copy {
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.product-copy-top h3 {
  margin: 14px 0 20px;
  max-width: 520px;
  font-family: "Playfair Display", serif;
  font-weight: 500;
  font-size: clamp(40px, 4.2vw, 68px);
  line-height: .98;
  letter-spacing: -.055em;
}
.product-copy-top p {
  max-width: 470px;
  color: #8f8c82;
  line-height: 1.8;
  font-size: 14px;
}
.feature-list {
  margin-top: 35px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.feature-list div {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a5a092;
  font-size: 11px;
}
.feature-list svg {
  color: var(--gold);
}
.product-nav {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 55px;
}
.product-nav button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--cream);
  transition: .25s ease;
}
.product-nav button:hover {
  background: var(--gold);
  color: var(--black);
  border-color: var(--gold);
}
.product-counter {
  margin-left: 9px;
  color: #69685f;
  font-size: 10px;
  letter-spacing: .12em;
}
.visual-stage {
  min-height: 650px;
  position: relative;
  overflow: hidden;
  background: #20211c;
  border: 1px solid rgba(231,214,184,.12);
  box-shadow: var(--shadow);
}
.experience-stage {
  background:
    radial-gradient(circle at 70% 25%, rgba(200,168,107,.14), transparent 28%),
    radial-gradient(circle at 20% 70%, rgba(170,181,157,.1), transparent 30%),
    #20211c;
}
.stage-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: .16;
}
.stage-glow-one {
  background: var(--gold);
  right: -100px;
  top: -100px;
}
.stage-glow-two {
  background: var(--sage);
  left: -140px;
  bottom: -100px;
}
.phone-shell {
  position: absolute;
  width: 285px;
  height: 570px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-4deg);
  border: 7px solid #0d0e0c;
  border-radius: 40px;
  background: #f3ead7;
  box-shadow:
    35px 45px 80px rgba(0,0,0,.42),
    0 0 0 1px rgba(231,214,184,.15);
  padding: 14px;
  color: var(--black);
}
.phone-top {
  display: flex;
  justify-content: space-between;
  color: #716b5d;
  font-size: 8px;
}
.phone-signal {
  font-size: 5px;
  letter-spacing: 2px;
}
.menu-brand {
  margin-top: 21px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mini-kicker {
  display: block;
  font-size: 8px;
  letter-spacing: .16em;
  color: var(--gold-light);
  text-transform: uppercase;
}
.phone-shell .mini-kicker {
  color: #86704a;
}
.menu-brand strong {
  display: block;
  margin-top: 3px;
  font-family: "Playfair Display", serif;
  font-size: 19px;
}
.mini-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #20211c;
  color: var(--gold-light);
  font-size: 8px;
}
.menu-search {
  margin-top: 18px;
  height: 35px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 8px;
  background: #e5dbc7;
  color: #837c6e;
  font-size: 8px;
}
.menu-tabs {
  display: flex;
  gap: 10px;
  overflow: hidden;
  margin: 16px 0;
  white-space: nowrap;
}
.menu-tabs span {
  color: #81796a;
  font-size: 8px;
}
.menu-tabs .active {
  color: #181913;
  font-weight: 700;
}
.dish-large {
  border-radius: 12px;
  overflow: hidden;
  background: #e8deca;
}
.dish-image {
  height: 170px;
  display: grid;
  place-items: center;
}
.dish-one {
  background:
    radial-gradient(circle at 50% 50%, #9d7d49 0 18%, transparent 19%),
    radial-gradient(circle at 38% 42%, #b8995e 0 9%, transparent 10%),
    radial-gradient(circle at 63% 60%, #6c5132 0 11%, transparent 12%),
    radial-gradient(circle at 30% 68%, #8b6a40 0 10%, transparent 11%),
    #302d25;
}
.dish-ring {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  border: 1px solid rgba(243,234,215,.45);
  display: grid;
  place-items: center;
  color: var(--cream);
}
.dish-info {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dish-info strong {
  display: block;
  font-size: 11px;
}
.dish-info span {
  display: block;
  margin-top: 4px;
  font-size: 7px;
  color: #817b6f;
}
.dish-info button {
  width: 27px;
  height: 27px;
  border: 0;
  background: #24251f;
  color: var(--gold-light);
  display: grid;
  place-items: center;
}
.dish-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
.mini-dish {
  padding: 7px;
  background: #e8deca;
  border-radius: 8px;
}
.mini-dish-image {
  height: 54px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  background: #302e27;
  color: var(--gold-light);
  font-size: 18px;
}
.mini-dish span {
  display: block;
  margin-top: 7px;
  font-size: 7px;
}
.mini-dish b {
  display: block;
  margin-top: 3px;
  color: #876f47;
  font-size: 7px;
}
.phone-bottom {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 7px;
  color: #777064;
}
.phone-bottom button {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: #846b40;
  font-size: 7px;
  font-weight: 700;
}
.floating-note {
  position: absolute;
  z-index: 5;
  padding: 12px;
  background: rgba(17,18,15,.86);
  border: 1px solid rgba(200,168,107,.28);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 20px 45px rgba(0,0,0,.3);
}
.floating-note svg {
  color: var(--gold-light);
}
.floating-note small {
  display: block;
  color: #757268;
  font-size: 7px;
  letter-spacing: .13em;
}
.floating-note strong {
  display: block;
  margin-top: 4px;
  font-size: 9px;
  color: var(--cream);
}
.note-one {
  left: 7%;
  top: 24%;
  animation: float 5s ease-in-out infinite;
}
.note-two {
  right: 5%;
  bottom: 20%;
  animation: float 6s ease-in-out infinite reverse;
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-9px); }
}
.orbit {
  position: absolute;
  border: 1px solid rgba(200,168,107,.13);
  border-radius: 50%;
  pointer-events: none;
}
.orbit-one {
  width: 520px;
  height: 520px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(25deg);
}
.orbit-two {
  width: 420px;
  height: 420px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
}
.kitchen-stage,
.operations-stage,
.intelligence-stage,
.marketing-stage {
  padding: 35px;
}
.kitchen-header,
.operations-top,
.intelligence-top,
.marketing-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.visual-stage h3 {
  margin: 6px 0 0;
  font-family: "Playfair Display", serif;
  font-size: 29px;
  font-weight: 500;
  letter-spacing: -.04em;
}
.live-status,
.campaign-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--sage);
  font-size: 8px;
  letter-spacing: .13em;
  text-transform: uppercase;
}
.live-status span,
.campaign-status span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sage);
  box-shadow: 0 0 0 5px rgba(170,181,157,.08);
}
.kitchen-columns {
  margin-top: 35px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.kitchen-column {
  min-width: 0;
}
.column-title {
  display: block;
  margin-bottom: 10px;
  color: #68675f;
  font-size: 8px;
  letter-spacing: .16em;
}
.ticket {
  padding: 15px;
  margin-bottom: 10px;
  background: #282923;
  border: 1px solid rgba(231,214,184,.08);
  transition: transform .25s ease, border-color .25s ease;
}
.ticket:hover {
  transform: translateY(-3px);
  border-color: rgba(200,168,107,.35);
}
.ticket-gold {
  border-top: 2px solid var(--gold);
}
.ticket-top {
  display: flex;
  justify-content: space-between;
  color: #7d7a70;
  font-size: 8px;
}
.ticket-top b {
  color: var(--gold-light);
}
.ticket > strong {
  display: block;
  margin: 14px 0 11px;
  font-size: 12px;
}
.ticket p {
  margin: 5px 0;
  color: #99958a;
  font-size: 9px;
}
.ticket-footer {
  border-top: 1px solid rgba(231,214,184,.08);
  margin-top: 13px;
  padding-top: 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #77756b;
  font-size: 8px;
}
.ticket-footer button {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(200,168,107,.2);
  background: transparent;
  color: var(--gold-light);
}
.active-ticket {
  background: linear-gradient(145deg, rgba(200,168,107,.13), #282923);
}
.timer-line {
  height: 3px;
  background: #33342d;
  margin-top: 16px;
}
.timer-line span {
  display: block;
  width: 72%;
  height: 100%;
  background: var(--gold);
}
.ready-ticket {
  border-color: rgba(170,181,157,.22);
}
.ready-label {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--sage);
  font-size: 8px;
}
.kitchen-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid rgba(231,214,184,.08);
  background: rgba(17,18,15,.3);
}
.kitchen-bottom > div {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 9px;
  padding: 15px 20px;
  border-right: 1px solid rgba(231,214,184,.08);
  color: #747268;
  font-size: 8px;
}
.kitchen-bottom svg {
  color: var(--gold);
}
.kitchen-bottom b {
  color: var(--cream);
  font-size: 10px;
}
.date-pill {
  border: 1px solid rgba(231,214,184,.12);
  padding: 8px 10px;
  color: #77756b;
  font-size: 8px;
  letter-spacing: .08em;
}
.operations-grid {
  display: grid;
  grid-template-columns: 1.35fr .65fr;
  gap: 16px;
  margin-top: 30px;
}
.floor-map {
  min-height: 450px;
  position: relative;
  background:
    linear-gradient(rgba(231,214,184,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(231,214,184,.045) 1px, transparent 1px),
    #191a16;
  background-size: 35px 35px;
  border: 1px solid rgba(231,214,184,.07);
}
.floor-label {
  position: absolute;
  left: 15px;
  top: 13px;
  color: #5f5e57;
  font-size: 7px;
  letter-spacing: .18em;
}
.floor-table {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: 60px;
  height: 42px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(231,214,184,.16);
  display: grid;
  place-items: center;
  color: #9d988b;
  font-size: 9px;
  transition: .3s ease;
}
.floor-table:hover {
  transform: translate(-50%, -50%) scale(1.08);
}
.floor-table.occupied {
  background: rgba(200,168,107,.15);
  border-color: rgba(200,168,107,.55);
  color: var(--gold-light);
}
.floor-table small {
  position: absolute;
  right: 5px;
  top: 3px;
  font-size: 7px;
}
.floor-legend {
  position: absolute;
  left: 15px;
  bottom: 14px;
  display: flex;
  gap: 15px;
  font-size: 7px;
  color: #77756b;
}
.floor-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.floor-legend i {
  width: 6px;
  height: 6px;
  display: block;
}
.occupied-dot {
  background: var(--gold);
}
.available-dot {
  background: #585951;
}
.operation-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.metric-box {
  padding: 18px;
  border: 1px solid rgba(231,214,184,.09);
  background: #282923;
}
.metric-box span {
  display: block;
  color: #727068;
  font-size: 8px;
}
.metric-box strong {
  display: block;
  margin-top: 8px;
  color: var(--cream);
  font-size: 24px;
  font-family: "Playfair Display", serif;
}
.metric-box small {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--sage);
  margin-top: 5px;
  font-size: 8px;
}
.mini-order {
  padding: 12px 13px;
  border-bottom: 1px solid rgba(231,214,184,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #89867b;
  font-size: 8px;
}
.mini-order > div {
  display: flex;
  align-items: center;
  gap: 7px;
}
.mini-order strong {
  color: #aaa597;
  font-size: 9px;
}
.mini-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold);
}
.mini-dot.muted {
  background: var(--sage);
}
.insight-period {
  display: flex;
  border: 1px solid rgba(231,214,184,.1);
}
.insight-period span {
  padding: 7px 10px;
  font-size: 7px;
  color: #68675f;
}
.insight-period .active {
  background: rgba(200,168,107,.15);
  color: var(--gold-light);
}
.intelligence-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 35px;
}
.intelligence-metrics > div {
  padding: 17px;
  border: 1px solid rgba(231,214,184,.08);
  background: #282923;
}
.intelligence-metrics span,
.intelligence-metrics small {
  display: block;
  color: #747268;
  font-size: 8px;
}
.intelligence-metrics strong {
  display: block;
  margin: 10px 0 4px;
  color: var(--cream);
  font-family: "Playfair Display", serif;
  font-size: 22px;
}
.intelligence-metrics small {
  color: var(--sage);
}
.chart-panel {
  margin-top: 13px;
  height: 270px;
  display: grid;
  grid-template-columns: 45px 1fr;
  padding: 18px 12px 12px;
  background: #191a16;
  border: 1px solid rgba(231,214,184,.07);
}
.chart-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #5e5d56;
  font-size: 7px;
  padding-bottom: 25px;
}
.chart {
  position: relative;
  height: 100%;
  background:
    linear-gradient(rgba(231,214,184,.045) 1px, transparent 1px);
  background-size: 100% 25%;
}
.chart svg {
  width: 100%;
  height: calc(100% - 25px);
}
.chart-labels {
  display: flex;
  justify-content: space-between;
  color: #5f5e57;
  font-size: 6px;
}
.ai-insight {
  margin-top: 12px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  background: rgba(200,168,107,.09);
  border: 1px solid rgba(200,168,107,.18);
}
.ai-icon {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  background: rgba(200,168,107,.12);
  color: var(--gold-light);
}
.ai-insight span {
  display: block;
  color: var(--gold-light);
  font-size: 7px;
  letter-spacing: .14em;
}
.ai-insight strong {
  display: block;
  margin-top: 5px;
  color: #b4afa2;
  font-size: 9px;
  font-weight: 500;
}
.customer-profile {
  margin-top: 35px;
  padding: 15px;
  background: #282923;
  border: 1px solid rgba(231,214,184,.08);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
}
.profile-avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: rgba(200,168,107,.16);
  color: var(--gold-light);
  font-family: "Playfair Display", serif;
  font-size: 17px;
}
.customer-profile span,
.profile-score small {
  display: block;
  color: #747268;
  font-size: 7px;
  letter-spacing: .1em;
}
.customer-profile strong {
  display: block;
  margin-top: 4px;
  color: var(--cream);
  font-size: 12px;
}
.profile-score {
  text-align: right;
}
.profile-score b {
  display: block;
  color: var(--gold-light);
  font-family: "Playfair Display", serif;
  font-size: 23px;
  margin-top: 2px;
}
.marketing-grid {
  display: grid;
  grid-template-columns: .9fr 1.1fr;
  gap: 12px;
  margin-top: 12px;
}
.preference-panel {
  padding: 18px;
  border: 1px solid rgba(231,214,184,.08);
  background: #191a16;
}
.panel-kicker {
  display: block;
  color: #6e6c64;
  font-size: 7px;
  letter-spacing: .14em;
  margin-bottom: 15px;
}
.preference {
  display: flex;
  gap: 9px;
  padding: 11px 0;
  border-top: 1px solid rgba(231,214,184,.07);
  color: var(--gold);
}
.preference div {
  flex: 1;
}
.preference strong {
  display: block;
  color: #aaa598;
  font-size: 9px;
  font-weight: 500;
}
.preference span {
  display: block;
  color: #69685f;
  font-size: 7px;
  margin-top: 4px;
}
.campaign-card {
  padding: 18px;
  background:
    linear-gradient(145deg, rgba(200,168,107,.15), transparent 55%),
    #282923;
  border: 1px solid rgba(200,168,107,.17);
}
.campaign-visual {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  color: var(--gold-light);
  background: rgba(200,168,107,.1);
}
.campaign-card span {
  display: block;
  margin-top: 20px;
  color: #77746b;
  font-size: 7px;
  letter-spacing: .13em;
}
.campaign-card strong {
  display: block;
  margin-top: 7px;
  font-family: "Playfair Display", serif;
  color: var(--cream);
  font-size: 21px;
  font-weight: 500;
}
.campaign-card p {
  color: #878379;
  font-size: 8px;
  line-height: 1.6;
  max-width: 220px;
}
.campaign-card button {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(200,168,107,.3);
  background: transparent;
  color: var(--gold-light);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 8px;
}
.marketing-footer {
  margin-top: 12px;
  padding: 11px 13px;
  display: flex;
  justify-content: space-between;
  color: #77746b;
  font-size: 8px;
}
.marketing-footer div {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--sage);
}
.product-section{
  --black:var(--ink);
  --charcoal:var(--ink2);
  --charcoal-2:var(--ink3);
  --charcoal-3:#2b2922;
  --cream:var(--cream);
  --cream-2:var(--cream2);
  --cream-3:var(--cream3);
  --gold-light:var(--gold2);
  --sage:var(--sage);
  --shadow:0 30px 100px rgba(0,0,0,.32);
}
.product-section-inner{max-width:1500px;margin:0 auto;color:#f3ead7;}
.product-visual-wrap{min-width:0;}
.product-section .section-head h2{color:#f3ead7 !important;}
.product-section .section-head p{color:#b7ad9b !important;}
.product-section .section-head .eyebrow{color:#dfc78f !important;}
.product-section .section-number{color:#c8a86b;font-size:10px;letter-spacing:.16em;}
.product-section .product-copy-top h3{color:#f3ead7 !important;}
.product-section .product-copy-top p{color:#b7ad9b !important;}
.product-section .feature-list div{color:#b8af9f !important;}
.product-section .product-tab{color:#918a7b;}
.product-section .product-tab strong{color:inherit;}
.product-section .product-tab:hover,.product-section .product-tab.active{color:#f3ead7;}
.product-section .product-tab-icon{color:#827b6e;}
.product-section .product-tab.active .product-tab-icon{color:#dfc78f;}
.product-section .product-counter{color:#9b927f;}
.product-section .product-nav button{color:#f3ead7;border-color:rgba(231,214,184,.22);}
.product-section .feature-list svg{color:#c8a86b;}
.product-section .reveal{opacity:1;transform:none;}
@media(max-width:1180px){
  .product-detail{grid-template-columns:1fr 1.25fr;}
  .product-copy-top h3{font-size:clamp(38px,5vw,60px);}
}
@media(max-width:900px){
  .product-section{padding:120px 28px;}
  .section-head{display:block;}
  .section-head p{margin-top:25px;}
  .product-detail{grid-template-columns:1fr;gap:35px;}
  .product-copy{padding:10px 0 0;}
  .product-tabs{margin-top:55px;}
  .visual-stage{min-height:620px;}
}
@media(max-width:650px){
  .product-section{padding:100px 20px;}
  .product-tabs{margin-top:50px;}
  .product-tab{min-width:150px;}
  .product-copy-top h3{font-size:clamp(42px,12vw,64px);}
  .feature-list{grid-template-columns:1fr 1fr;}
  .visual-stage{min-height:570px;}
  .kitchen-stage,.operations-stage,.intelligence-stage,.marketing-stage{padding:22px;}
  .phone-shell{width:240px;height:485px;}
  .dish-image{height:130px;}
  .note-one{left:3%;top:15%;}
  .note-two{right:3%;bottom:11%;}
}
@media(max-width:480px){
  .product-section{padding-left:16px;padding-right:16px;}
  .product-section .section-head h2{font-size:clamp(44px,14vw,66px);}
  .product-tabs{gap:0;}
  .product-tab{min-width:145px;padding-left:12px;padding-right:12px;}
  .product-tab strong{font-size:9px;line-height:1.35;}
  .visual-stage{min-height:540px;}
  .phone-shell{width:220px;height:450px;}
  .floating-note{transform:scale(.9);}
  .feature-list{grid-template-columns:1fr;}
}
.product-section{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  background:
    radial-gradient(900px 520px at 78% 14%, rgba(200,168,107,.105), transparent 62%),
    radial-gradient(760px 620px at 8% 72%, rgba(170,181,157,.075), transparent 64%),
    linear-gradient(180deg,#151611 0%,#191a16 48%,#171813 100%);
}
.product-section::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:-2;
  pointer-events:none;
  opacity:.48;
  background-image:
    linear-gradient(rgba(231,214,184,.032) 1px,transparent 1px),
    linear-gradient(90deg,rgba(231,214,184,.032) 1px,transparent 1px);
  background-size:72px 72px;
  mask-image:linear-gradient(to bottom,transparent 0%,black 13%,black 82%,transparent 100%);
  -webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 13%,black 82%,transparent 100%);
}
.product-section::after{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  pointer-events:none;
  opacity:.34;
  background:
    radial-gradient(circle at 74% 17%,rgba(223,199,143,.12),transparent 18%),
    radial-gradient(circle at 14% 74%,rgba(170,181,157,.08),transparent 20%),
    radial-gradient(circle at 52% 52%,transparent 35%,rgba(0,0,0,.28) 100%);
  animation:fiveLayersAmbient 12s ease-in-out infinite alternate;
}
.product-section .section-head,
.product-section .product-tabs,
.product-section .product-detail{position:relative;z-index:2;}
.product-section .section-head h2{
  color:#f3ead7 !important;
  text-shadow:0 2px 24px rgba(0,0,0,.24);
}
.product-section .section-head p{
  color:#bdb4a3 !important;
  text-shadow:0 1px 12px rgba(0,0,0,.3);
}
.product-section .section-head .eyebrow{color:#dfc78f !important;}
.product-section .product-tabs{
  border-bottom-color:rgba(231,214,184,.17);
  position:relative;
}
.product-section .product-tabs::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  bottom:-1px;
  height:1px;
  background:linear-gradient(90deg,rgba(200,168,107,.42),rgba(231,214,184,.05),transparent);
  pointer-events:none;
}
.product-section .product-tab{
  color:#a8a092 !important;
  position:relative;
  min-height:78px;
}
.product-section .product-tab strong{color:inherit !important;}
.product-section .product-tab:hover{color:#e8ddca !important;}
.product-section .product-tab.active{
  color:#f3ead7 !important;
  border-bottom-color:#c8a86b !important;
}
.product-section .product-tab.active::after{
  content:"";
  position:absolute;
  left:16px;
  right:16px;
  bottom:-2px;
  height:2px;
  background:linear-gradient(90deg,#c8a86b,#dfc78f);
  box-shadow:0 0 16px rgba(200,168,107,.28);
}
.product-section .product-tab-icon{
  color:#817b70 !important;
  transition:color .25s ease,transform .25s ease;
}
.product-section .product-tab:hover .product-tab-icon{color:#bca875 !important;transform:translateY(-1px);}
.product-section .product-tab.active .product-tab-icon{color:#dfc78f !important;}
.product-section .product-tab-number{color:#c8a86b !important;}
.product-section .product-copy-top h3{
  color:#f3ead7 !important;
  text-shadow:0 2px 20px rgba(0,0,0,.25);
}
.product-section .product-copy-top p{color:#b9b09f !important;}
.product-section .feature-list div{color:#b8af9f !important;}
.product-section .feature-list svg{color:#c8a86b !important;filter:drop-shadow(0 0 7px rgba(200,168,107,.18));}
.product-section .product-nav button{
  color:#f3ead7 !important;
  border-color:rgba(231,214,184,.24) !important;
  background:rgba(17,18,15,.28) !important;
  backdrop-filter:blur(10px);
}
.product-section .product-nav button:hover{background:#c8a86b !important;color:#11120f !important;}
.product-section .product-counter{color:#9f9788 !important;}
.product-section .visual-stage{
  border-color:rgba(231,214,184,.16);
  box-shadow:0 35px 110px rgba(0,0,0,.38),0 0 0 1px rgba(200,168,107,.025);
}
.product-section .visual-stage::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:0;
  opacity:.42;
  background:
    linear-gradient(90deg,transparent 49.8%,rgba(231,214,184,.035) 50%,transparent 50.2%),
    linear-gradient(0deg,transparent 49.8%,rgba(231,214,184,.035) 50%,transparent 50.2%);
  background-size:120px 120px;
  mask-image:radial-gradient(circle at center,black 0%,transparent 80%);
  -webkit-mask-image:radial-gradient(circle at center,black 0%,transparent 80%);
}
.product-section .visual-stage > *{z-index:1;}
.product-section .stage-glow{
  opacity:.23;
  mix-blend-mode:screen;
  animation:stageGlowFloat 8s ease-in-out infinite alternate;
}
.product-section .stage-glow-two{animation-delay:-3s;}
.product-section .experience-stage{
  background:
    radial-gradient(circle at 72% 24%,rgba(200,168,107,.16),transparent 27%),
    radial-gradient(circle at 20% 76%,rgba(170,181,157,.11),transparent 31%),
    linear-gradient(145deg,#22231e,#1a1b17 62%,#25231d);
}
@keyframes fiveLayersAmbient{
  from{transform:scale(1);opacity:.28}
  to{transform:scale(1.035);opacity:.48}
}
@keyframes stageGlowFloat{
  from{transform:translate3d(0,0,0) scale(.96)}
  to{transform:translate3d(14px,-12px,0) scale(1.05)}
}
@media(max-width:900px){
  .product-section::before{background-size:54px 54px;}
  .product-section .product-tab.active::after{left:12px;right:12px;}
}
@media(prefers-reduced-motion:reduce){
  .product-section::after,.product-section .stage-glow{animation:none !important;}
}
html{
  font-size:16px;
  text-size-adjust:100%;
  -webkit-text-size-adjust:100%;
  scroll-behavior:smooth;
}
body{
  margin:0;
  overflow-x:hidden;
  overflow-y:auto;
  text-rendering:optimizeLegibility;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}
*,*::before,*::after{box-sizing:border-box;}
img,svg,video,canvas{max-width:100%;}
h1,h2,h3,h4,h5,h6,p,span,strong,small,a,button,label{
  overflow-wrap:anywhere;
}
h1,h2,h3,h4,h5,h6,p{margin-block-start:0;}
.hero-left,
.product-copy,
.section-heading,
.module-copy,
.journey-copy,
.signature-heading,
.command-heading,
.fusion-heading,
.faq-intro,
.demo-copy,
.footer-brand,
.footer-column{
  text-align:left;
}
.hero-actions,
.hero-meta,
.module-features,
.contact-details,
.footer-column{
  justify-content:flex-start;
}
.section-heading.center{
  text-align:center;
}
.section-heading.center p{
  margin-inline:auto;
}
.hero-title,
.section-heading h2,
.product-copy-top h3,
.module-copy h2,
.journey-copy h2,
.signature-heading h2,
.command-heading h2,
.fusion-heading h2,
.demo-copy h2,
.faq-intro h2{
  text-wrap:balance;
}
.hero-description,
.section-heading p,
.product-copy-top p,
.module-description,
.journey-copy p,
.signature-heading p,
.demo-copy > p,
.faq-intro p{
  text-wrap:pretty;
}
.hero,
.use-section,
.module-section.cream,
.signature-section,
.command-section,
.demo-section{
  color:var(--darkText);
}
.hero h1,
.hero h2,
.hero h3,
.hero p,
.use-section h1,
.use-section h2,
.use-section h3,
.use-section p,
.module-section.cream h1,
.module-section.cream h2,
.module-section.cream h3,
.module-section.cream p,
.signature-section h1,
.signature-section h2,
.signature-section h3,
.signature-section p,
.command-section h1,
.command-section h2,
.command-section h3,
.command-section p,
.demo-section h1,
.demo-section h2,
.demo-section h3,
.demo-section p{
  color:inherit;
}
.hero-title,
.section-heading h2,
.module-section.cream .module-copy h2,
.signature-heading h2,
.command-heading h2,
.demo-copy h2{
  color:var(--darkText);
}
.hero-description,
.section-heading p,
.module-section.cream .module-description,
.module-section.cream .module-features > div,
.signature-heading p,
.command-section p,
.demo-copy > p{
  color:var(--bodyText);
}
.product-section,
.module-section.dark,
.journey-section,
.fusion-section,
.faq-section,
.footer{
  color:#f4ecdc;
}
.product-section h1,
.product-section h2,
.product-section h3,
.product-section h4,
.product-section p,
.module-section.dark h1,
.module-section.dark h2,
.module-section.dark h3,
.module-section.dark p,
.journey-section h1,
.journey-section h2,
.journey-section h3,
.journey-section p,
.fusion-section h1,
.fusion-section h2,
.fusion-section h3,
.fusion-section p,
.faq-section h1,
.faq-section h2,
.faq-section h3,
.faq-section p,
.footer h1,
.footer h2,
.footer h3,
.footer h4,
.footer p{
  color:inherit;
}
.product-section .section-head p,
.product-copy-top p,
.module-section.dark .module-description,
.module-section.dark .module-features > div,
.journey-copy p,
.faq-intro p,
.footer-brand p{
  color:rgba(244,236,220,.70);
}
.use-card,
.demo-form-wrap,
.visual-window,
.visual-stage,
.phone-shell,
.ticket,
.metric-box,
.mini-order,
.customer-profile,
.preference-panel,
.campaign-card{
  color:initial;
}
.use-section .use-card{
  color:var(--darkText) !important;
  background:var(--cream3);
}
.use-section .use-card h3{
  color:var(--darkText) !important;
}
.use-section .use-card p{
  color:var(--bodyText) !important;
}
.use-section .use-card .use-points span{
  color:#4f493e !important;
}
.use-section .use-card .use-number,
.use-section .use-card .use-arrow,
.use-section .use-card .use-points svg{
  color:var(--gold3) !important;
}
.hero-left{padding-inline:clamp(28px,6vw,96px);}
.use-section,
.module-section,
.demo-section,
.signature-section,
.journey-section,
.command-section,
.fusion-section,
.faq-section{
  padding-inline:clamp(22px,6vw,96px);
}
.product-section{padding-inline:clamp(22px,6vw,96px);}
.section-heading,
.section-head,
.module-grid,
.demo-grid,
.signature-shell,
.journey-shell,
.command-shell,
.fusion-inner,
.faq-inner,
.footer-top{
  width:100%;
  max-width:1480px;
  margin-inline:auto;
}
.section-heading p{max-width:620px;}
.product-copy-top p{max-width:600px;}
.module-description{max-width:600px;}
@media (min-width:1201px){
  .hero-title{font-size:clamp(3.4rem,4.25vw,5rem);}
  .hero-description{max-width:620px;}
  .section-heading h2{max-width:760px;}
  .module-copy h2{max-width:680px;}
  .demo-copy h2{max-width:620px;}
}
@media (max-width:1100px){
  .hero{
    grid-template-columns:1fr;
    min-height:auto;
  }
  .hero-left{
    min-height:auto;
    padding-top:125px;
    padding-bottom:80px;
  }
  .hero-right{
    min-height:620px;
  }
  .module-grid,
  .demo-grid,
  .journey-shell,
  .faq-inner{
    grid-template-columns:1fr;
    gap:55px;
  }
  .faq-intro{position:static;}
  .command-heading{
    align-items:flex-start;
    flex-direction:column;
  }
  .use-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
  .footer-top{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:45px;
  }
}
@media (max-width:700px){
  html,body,#root{width:100%;min-height:100%;}
  body{
    overflow-x:hidden;
    overflow-y:auto;
    touch-action:pan-y;
  }
  .hero-left,
  .use-section,
  .module-section,
  .product-section,
  .demo-section,
  .signature-section,
  .journey-section,
  .command-section,
  .fusion-section,
  .faq-section{
    padding-inline:18px;
  }
  .hero-left{padding-top:105px;padding-bottom:64px;}
  .hero-right{min-height:540px;}
  .hero-title{
    font-size:clamp(2.7rem,11vw,4rem);
    line-height:1.02;
    letter-spacing:-1.2px;
    max-width:100%;
  }
  .hero-description,
  .section-heading p,
  .product-copy-top p,
  .module-description,
  .journey-copy p,
  .signature-heading p,
  .demo-copy > p,
  .faq-intro p{
    font-size:.9rem;
    line-height:1.72;
  }
  .section-heading h2,
  .product-copy-top h3,
  .module-copy h2,
  .journey-copy h2,
  .signature-heading h2,
  .command-heading h2,
  .fusion-heading h2,
  .demo-copy h2,
  .faq-intro h2{
    font-size:clamp(2.35rem,10vw,4rem);
    line-height:1.02;
    letter-spacing:-1.1px;
  }
  .hero-actions{
    display:flex;
    flex-wrap:wrap;
    gap:10px;
  }
  .hero-actions .button{min-height:46px;}
  .hero-meta{
    gap:22px;
    flex-wrap:wrap;
  }
  .use-grid{grid-template-columns:1fr;gap:12px;}
  .module-grid{gap:42px;}
  .module-features{grid-template-columns:1fr;gap:10px;}
  .demo-grid{gap:40px;}
  .demo-form-wrap{padding:24px;}
  .product-section .section-head{
    display:block;
  }
  .product-section .section-head p{margin-top:18px;}
  .product-tabs{
    overflow-x:auto;
    scrollbar-width:none;
    -webkit-overflow-scrolling:touch;
  }
  .product-tabs::-webkit-scrollbar{display:none;}
  .product-detail{min-width:0;}
  .product-visual-wrap{min-width:0;}
  .signature-heading,
  .journey-copy,
  .faq-intro,
  .demo-copy{max-width:100%;}
  .footer-top{
    grid-template-columns:1fr;
    gap:36px;
  }
  .footer-column{align-items:flex-start;}
}
@media (max-width:480px){
  .hero-left,
  .use-section,
  .module-section,
  .product-section,
  .demo-section,
  .signature-section,
  .journey-section,
  .command-section,
  .fusion-section,
  .faq-section{
    padding-inline:16px;
  }
  .hero-title{font-size:clamp(2.45rem,12vw,3.35rem);}
  .hero-right{min-height:470px;}
  .hero-actions .button{
    width:100%;
    justify-content:center;
  }
  .use-card{padding:26px;}
  .module-section{padding-block:88px;}
  .demo-section{padding-block:90px;}
  .demo-form-wrap{padding:20px;}
  .footer{padding-inline:16px;}
}
@media (prefers-color-scheme:dark){
  .hero,
  .use-section,
  .module-section.cream,
  .signature-section,
  .command-section,
  .demo-section{
    color:var(--darkText);
  }
  .hero-title,
  .section-heading h2,
  .module-section.cream .module-copy h2,
  .signature-heading h2,
  .command-heading h2,
  .demo-copy h2{
    color:var(--darkText);
  }
  .hero-description,
  .section-heading p,
  .module-section.cream .module-description,
  .module-section.cream .module-features > div,
  .signature-heading p,
  .command-section p,
  .demo-copy > p{
    color:var(--bodyText);
  }
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto;}
}
.legal-page-shell{
  min-height:100vh;
  background:var(--cream3);
  color:var(--darkText);
  overflow:visible;
  position:relative;
  z-index:1;
}
.legal-page-shell .legal-nav,
.legal-page-shell .legal-main,
.legal-page-shell .legal-footer{
  opacity:1!important;
  visibility:visible!important;
}
.legal-nav{
  position:sticky;
  top:0;
  z-index:100;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px;
  padding:18px clamp(20px,5vw,72px);
  background:rgba(250,246,238,.88);
  border-bottom:1px solid rgba(39,31,20,.1);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
}
.legal-brand,.legal-close{
  border:0;
  background:transparent;
  color:var(--darkText);
  cursor:pointer;
  font:500 .84rem/1 DM Sans,sans-serif;
}
.legal-brand{display:flex;align-items:center;gap:10px;font-size:1.05rem;letter-spacing:-.02em}
.legal-brand span{width:34px;height:34px;border:1px solid rgba(167,130,72,.35);display:grid;place-items:center;border-radius:9px;background:#171612;color:var(--gold2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.035)}
.legal-close{display:flex;align-items:center;gap:10px;text-transform:uppercase;letter-spacing:.12em;font-size:.68rem}
.legal-close svg{transition:transform .25s ease}
.legal-close:hover svg{transform:translateX(4px)}
.legal-main{width:100%;}
.legal-hero{
  position:relative;
  min-height:clamp(520px,68vh,760px);
  display:grid;
  grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);
  align-items:end;
  gap:clamp(40px,8vw,130px);
  padding:clamp(72px,10vw,140px) clamp(22px,7vw,110px) clamp(64px,8vw,110px);
  background:linear-gradient(135deg,#f8f1e4 0%,#eee1ca 55%,#d9c7a7 100%);
  overflow:hidden;
}
.legal-hero::after{content:"";position:absolute;inset:auto -8% -42% 34%;height:500px;background:radial-gradient(circle,rgba(255,255,255,.58),transparent 65%);pointer-events:none}
.legal-hero-copy,.legal-hero-card{position:relative;z-index:2}
.legal-hero-copy{max-width:900px}
.legal-hero-copy .eyebrow{margin-bottom:20px;color:#675e4e}
.legal-index{font:400 .67rem/1 DM Mono,monospace;letter-spacing:.18em;color:#8a7049;margin-bottom:18px}
.legal-hero h1{margin:0;max-width:850px;font:400 clamp(4rem,8.8vw,9rem)/.9 "DM Serif Display",serif;letter-spacing:-.055em;color:#201d17}
.legal-hero h1 em{color:#967343;font-style:italic}
.legal-hero-copy>p{max-width:670px;margin:32px 0 26px;font:400 clamp(1rem,1.35vw,1.18rem)/1.7 DM Sans,sans-serif;color:#5e5548}
.legal-meta{display:flex;flex-wrap:wrap;gap:10px 24px;font:400 .66rem/1.4 DM Mono,monospace;letter-spacing:.08em;text-transform:uppercase;color:#786c5b}
.legal-meta span+span{position:relative;padding-left:24px}
.legal-meta span+span::before{content:"";position:absolute;left:0;top:50%;width:5px;height:5px;border-radius:50%;background:#a98248;transform:translateY(-50%)}
.legal-hero-card{justify-self:end;width:min(100%,360px);padding:28px;border:1px solid rgba(70,52,26,.16);background:rgba(250,246,238,.62);box-shadow:0 25px 70px rgba(60,45,24,.12);backdrop-filter:blur(12px);border-radius:24px}
.legal-card-mark{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;background:#201d17;color:#dfc18d;margin-bottom:40px}
.legal-hero-card>span{display:block;font:400 .62rem/1 DM Mono,monospace;letter-spacing:.15em;color:#8b7149;margin-bottom:12px}
.legal-hero-card strong{display:block;font:500 1.45rem/1.15 DM Sans,sans-serif;letter-spacing:-.03em;color:#201d17;margin-bottom:12px}
.legal-hero-card small{display:block;font:400 .86rem/1.65 DM Sans,sans-serif;color:#6a604f}
.legal-hero-orbit{position:absolute;border:1px solid rgba(111,85,46,.16);border-radius:50%;pointer-events:none}
.legal-hero-orbit.orbit-a{width:500px;height:500px;right:-120px;top:80px}
.legal-hero-orbit.orbit-b{width:280px;height:280px;right:45px;top:190px}
.legal-layout{display:grid;grid-template-columns:minmax(190px,270px) minmax(0,900px);gap:clamp(45px,8vw,120px);max-width:1320px;margin:0 auto;padding:clamp(70px,9vw,120px) clamp(22px,5vw,60px) 130px}
.legal-toc{position:sticky;top:100px;align-self:start;display:flex;flex-direction:column;gap:15px;padding-top:5px}
.legal-toc>span{font:400 .62rem/1 DM Mono,monospace;letter-spacing:.16em;color:#9a8060;margin-bottom:8px}
.legal-toc a{display:grid;grid-template-columns:24px 1fr;gap:8px;text-decoration:none;color:#766b5b;font:400 .76rem/1.35 DM Sans,sans-serif;transition:color .2s ease,transform .2s ease}
.legal-toc a::first-letter{color:#a98248}
.legal-toc a:hover{color:#201d17;transform:translateX(3px)}
.legal-document{min-width:0}
.legal-block{display:grid;grid-template-columns:55px minmax(0,1fr);gap:28px;padding:0 0 62px;margin-bottom:62px;border-bottom:1px solid rgba(39,31,20,.1);scroll-margin-top:110px}
.legal-num{font:400 .68rem/1 DM Mono,monospace;letter-spacing:.12em;color:#a98248;padding-top:9px}
.legal-block h2{margin:0 0 18px;font:500 clamp(1.45rem,2.2vw,2rem)/1.15 DM Sans,sans-serif;letter-spacing:-.035em;color:#201d17}
.legal-block p{margin:0 0 17px;max-width:760px;font:400 .98rem/1.85 DM Sans,sans-serif;color:#655c4d}
.legal-block p:last-child{margin-bottom:0}
.legal-contact{margin-top:26px;padding:22px;border-left:2px solid #a98248;background:#f2eadb;display:flex;flex-direction:column;gap:7px}
.legal-contact strong{font:500 .86rem/1.3 DM Sans,sans-serif;color:#201d17}
.legal-contact a,.legal-contact span{font:400 .82rem/1.5 DM Sans,sans-serif;color:#756954;text-decoration:none}
.legal-contact a:hover{text-decoration:underline;color:#8d6b38}
.legal-footer{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;padding:25px clamp(20px,5vw,72px);background:#171612;color:rgba(244,236,220,.64);font:400 .67rem/1.4 DM Mono,monospace;letter-spacing:.04em}
.legal-footer>div{display:flex;gap:18px}
.legal-footer button{border:0;background:none;color:rgba(244,236,220,.72);font:400 .67rem/1.4 DM Mono,monospace;cursor:pointer;padding:0}
.legal-footer button:hover{color:#dfc18d}
.footer-legal-links{display:flex;gap:18px;align-items:center}
.footer-legal-links button{border:0;background:none;color:inherit;cursor:pointer;font:inherit;padding:0;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:4px;transition:color .2s ease,text-decoration-color .2s ease}
.footer-legal-links button:hover{color:var(--gold2);text-decoration-color:currentColor}
@media(max-width:900px){
  .legal-hero{grid-template-columns:1fr;align-items:start;min-height:auto;padding-top:75px}
  .legal-hero-card{justify-self:start;max-width:420px}
  .legal-layout{grid-template-columns:1fr;gap:45px}
  .legal-toc{position:relative;top:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 24px;padding:20px 0;border-top:1px solid rgba(39,31,20,.1);border-bottom:1px solid rgba(39,31,20,.1)}
  .legal-toc>span{grid-column:1/-1}
}
@media(max-width:600px){
  .legal-nav{padding:15px 18px}
  .legal-close span{display:none}
  .legal-hero{padding:65px 20px 55px}
  .legal-hero h1{font-size:clamp(3.25rem,16vw,5rem)}
  .legal-hero-copy>p{font-size:.92rem;margin-top:25px}
  .legal-hero-orbit.orbit-a{width:320px;height:320px;right:-170px;top:100px}
  .legal-hero-orbit.orbit-b{width:190px;height:190px;right:-10px;top:165px}
  .legal-layout{padding:58px 20px 80px}
  .legal-toc{grid-template-columns:1fr}
  .legal-block{grid-template-columns:32px minmax(0,1fr);gap:12px;padding-bottom:42px;margin-bottom:42px}
  .legal-block p{font-size:.9rem;line-height:1.75}
  .legal-footer{flex-direction:column;align-items:flex-start}
  .footer-legal-links{flex-wrap:wrap}
}
html{
  background:#15130f!important;
  scrollbar-gutter:auto!important;
}
body{
  background:var(--cream3);
  scrollbar-gutter:auto!important;
}
#root,
.site,
.legal-page-shell{
  width:100%;
  max-width:100%;
}
.nav .brand-name{
  color:var(--darkText);
  transition:color .35s ease;
}
.nav.nav-scrolled .brand-name{
  color:var(--gold2)!important;
}
.nav.nav-scrolled .brand{
  color:var(--gold2)!important;
}
.nav.nav-scrolled .brand-mark{
  border-color:rgba(223,193,141,.58);
}
.legal-page-shell{
  overflow:visible!important;
  position:relative!important;
  isolation:isolate;
}
.legal-nav{
  position:sticky!important;
  top:0!important;
  left:auto!important;
  right:auto!important;
  width:100%!important;
  min-height:70px;
  z-index:10000!important;
  flex-shrink:0;
  background:rgba(250,246,238,.94)!important;
  border-bottom:1px solid rgba(39,31,20,.12)!important;
  box-shadow:0 8px 30px rgba(39,31,20,.055);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
}
.legal-page-shell .legal-brand span{
  border-radius:9px!important;
  background:#171612!important;
  color:#dfc18d!important;
}
@media(max-width:700px){
  .nav{
    width:100%;
  }
  .legal-nav{
    min-height:64px;
    padding:14px 18px!important;
  }
}
.legal-nav{position:sticky!important;top:0!important;z-index:5000!important;}
.legal-page-shell .legal-brand span{width:34px!important;height:34px!important;border-radius:9px!important;background:#171612!important;color:#dfc18d!important;}
.legal-page-shell .legal-brand,
.legal-page-shell .legal-close,
.legal-page-shell .legal-toc a,
.legal-page-shell .legal-block h2,
.legal-page-shell .legal-block p,
.legal-page-shell .legal-contact strong,
.legal-page-shell .legal-contact a,
.legal-page-shell .legal-contact span{opacity:1!important;visibility:visible!important;}
.site .reveal.visible{opacity:1;visibility:visible;}
html, body, #root {
  width:100%;
  max-width:100%;
  margin:0;
  padding:0;
  overflow-x:clip !important;
}
@supports not (overflow: clip) {
  html, body, #root { overflow-x:hidden !important; }
}
.site,
.site main,
.site section,
.legal-page-shell,
.legal-page-shell .legal-main {
  width:100%;
  max-width:100%;
  overflow-x:clip;
}
.hero,
.use-section,
.module-section,
.product-section,
.signature-section,
.journey-section,
.command-section,
.fusion-section,
.faq-section,
.demo-section,
.footer {
  max-width:100%;
  overflow:hidden;
}
.nav {
  z-index:6000 !important;
  max-width:100vw;
}
.nav.nav-scrolled .brand-name,
.nav.nav-scrolled .brand-name strong,
.nav.nav-scrolled .brand-text,
.nav.nav-scrolled .brand {
  color:var(--gold2) !important;
}
.nav.nav-scrolled .nav-links a {
  color:rgba(244,236,220,.86) !important;
}
.nav.nav-scrolled .nav-links a:hover {
  color:var(--gold2) !important;
}
.nav.nav-scrolled .brand-mark {
  background:#171612 !important;
  border-color:rgba(223,193,141,.72) !important;
  color:var(--gold2) !important;
}
.nav.nav-scrolled .nav-demo,
.nav.nav-scrolled .nav-cta,
.nav.nav-scrolled button {
  color:var(--gold2) !important;
}
.legal-page-shell {
  min-height:100vh;
  overflow-x:clip !important;
}
.legal-page-shell .legal-nav {
  position:sticky !important;
  top:0 !important;
  z-index:10000 !important;
  width:100%;
  max-width:100vw;
  box-sizing:border-box;
}
.legal-page-shell .legal-main,
.legal-page-shell .legal-layout,
.legal-page-shell .legal-block {
  scroll-margin-top:96px;
}
.legal-page-shell .legal-toc {
  top:96px !important;
  z-index:20;
}
.legal-page-shell .legal-brand span {
  border-radius:9px !important;
  background:#171612 !important;
  color:var(--gold2) !important;
  border-color:rgba(223,193,141,.58) !important;
}
.legal-page-shell * {
  visibility:visible;
}
@media (max-width:900px) {
  .legal-page-shell .legal-nav {
    padding-left:18px !important;
    padding-right:18px !important;
  }
  .legal-page-shell .legal-toc {
    position:relative !important;
    top:auto !important;
  }
}
@media (max-width:600px) {
  .nav.nav-scrolled .nav-links a {
    color:var(--gold2) !important;
  }
  .legal-page-shell .legal-nav {
    min-height:68px;
    gap:12px;
  }
  .legal-page-shell .legal-close span {
    display:none;
  }
}
html, body {
  overscroll-behavior-x:none;
}
body {
  min-width:320px;
}
.site *, .legal-page-shell * {
  max-width:100%;
}
.nav {
  padding-left:clamp(18px,5vw,80px);
  padding-right:clamp(18px,5vw,80px);
}
.nav .brand,
.nav .brand-name,
.nav .brand-text {
  flex-shrink:0;
}
.form-error {
  margin:14px 0 0;
  padding:12px 14px;
  border:1px solid rgba(142,75,56,.28);
  background:rgba(142,75,56,.07);
  color:#7b4638;
  font-size:.82rem;
  line-height:1.55;
  border-radius:10px;
}
.submit-button:disabled {
  cursor:wait;
  opacity:.65;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline:2px solid var(--gold3);
  outline-offset:3px;
}
@media (pointer:coarse) {
  .cursor-dot,
  .cursor-ring {
    display:none !important;
  }
}
@media (max-width:600px) {
  .nav {
    padding-left:16px;
    padding-right:16px;
  }
  .legal-nav {
    padding-left:16px !important;
    padding-right:16px !important;
  }
}
@media (prefers-reduced-motion:reduce) {
  html {
    scroll-behavior:auto !important;
  }
  *, *::before, *::after {
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
    scroll-behavior:auto !important;
  }
}
.hp-field{
  position:absolute!important;
  left:-10000px!important;
  top:auto!important;
  width:1px!important;
  height:1px!important;
  overflow:hidden!important;
  opacity:0!important;
  pointer-events:none!important;
}
.hp-field input{
  position:absolute!important;
  width:1px!important;
  height:1px!important;
}
html,body,#root,.site,.legal-page-shell{
  max-width:100%;
  overflow-x:clip;
}
@supports not (overflow: clip){
  html,body,#root,.site,.legal-page-shell{overflow-x:hidden;}
}
@media (pointer:coarse){
  .cursor-dot,.cursor-ring{display:none!important;}
}
.chat-backdrop{position:fixed;inset:0;background:rgba(10,9,7,.46);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:7990;opacity:0;pointer-events:none;transition:opacity .3s ease}
.chat-backdrop.is-open{opacity:1;pointer-events:auto}
.chat-launcher{position:fixed;right:28px;bottom:28px;z-index:8002;border:1px solid rgba(220,193,145,.38);background:linear-gradient(135deg,#2b271f,#14130f);color:#f8f1e4;display:flex;align-items:center;gap:11px;padding:8px 16px 8px 8px;border-radius:999px;box-shadow:0 18px 55px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.08);cursor:pointer;transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease}
.chat-launcher:hover{transform:translateY(-3px);border-color:rgba(220,193,145,.65);box-shadow:0 24px 70px rgba(0,0,0,.4),0 0 0 1px rgba(220,193,145,.08)}
.chat-launcher-glow{position:absolute;inset:-5px;border-radius:inherit;border:1px solid rgba(180,153,101,.16);animation:chatPulse 2.8s ease-in-out infinite;pointer-events:none}
.chat-launcher-icon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#dfc38d,#a6814b);color:#17130e;box-shadow:0 6px 20px rgba(183,146,83,.28)}
.chat-launcher-copy{display:flex;flex-direction:column;align-items:flex-start;line-height:1.05;padding-right:2px}.chat-launcher-copy small{font:400 8px/1.2 'DM Mono',monospace;letter-spacing:.16em;color:#c8ad7b}.chat-launcher-copy strong{font:500 12px/1.25 'DM Sans',sans-serif;margin-top:3px}
.chat-panel{position:fixed;right:28px;bottom:92px;width:min(500px,calc(100vw - 32px));height:min(770px,calc(100vh - 118px));z-index:8001;background:#f8f3e9;color:#25221c;border:1px solid rgba(168,135,82,.38);box-shadow:0 35px 100px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.3) inset;display:flex;flex-direction:column;border-radius:27px;overflow:hidden;transform:translateY(22px) scale(.965);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .28s ease,transform .34s cubic-bezier(.22,1,.36,1),visibility .28s ease}
.chat-panel.is-open{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0) scale(1)}
.chat-header{display:flex;align-items:center;gap:11px;padding:17px 17px 14px;background:linear-gradient(135deg,#171510,#1d1a14);color:#f7f0e3;border-bottom:1px solid rgba(218,190,140,.15);position:relative}
.chat-header:after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,transparent,rgba(215,182,123,.55),transparent)}
.chat-agent-mark{width:43px;height:43px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#dec18a,#b28c51);color:#17130e;box-shadow:0 8px 25px rgba(210,179,122,.2);flex:0 0 auto}
.chat-agent-title{display:flex;flex-direction:column;min-width:0;flex:1;text-align:left}.chat-agent-title span{font:400 8px/1.2 'DM Mono',monospace;letter-spacing:.13em;color:#bba273}.chat-agent-title strong{font:600 14px/1.3 'DM Sans',sans-serif;margin-top:3px;color:#f7f0e3}.chat-agent-title small{display:flex;align-items:center;gap:5px;margin-top:5px;color:#8f897d;font:400 8px/1.25 'DM Mono',monospace}.chat-status-dot{width:5px;height:5px;border-radius:50%;background:#a5ad83;box-shadow:0 0 0 3px rgba(165,173,131,.1)}
.chat-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.1);border-radius:50%;display:grid;place-items:center;background:transparent;color:#e9dfce;cursor:pointer;transition:.2s ease}.chat-close:hover{background:rgba(255,255,255,.06);border-color:rgba(220,193,145,.3);transform:rotate(4deg)}
.chat-trust{padding:9px 17px;background:#eee6d8;border-bottom:1px solid rgba(110,91,61,.1);font:400 9px/1.3 'DM Mono',monospace;letter-spacing:.02em;color:#6f6049;text-align:left}.chat-trust span{margin:0 4px}.chat-live-dot{display:inline-block!important;width:6px;height:6px;border-radius:50%;background:#8e9b72;box-shadow:0 0 0 4px rgba(142,155,114,.12);vertical-align:middle}
.chat-topic-bar{display:flex;gap:6px;padding:9px 12px 8px;background:#f3ecdf;border-bottom:1px solid rgba(110,91,61,.09);overflow:auto;scrollbar-width:none;touch-action:pan-x}.chat-topic-bar::-webkit-scrollbar{display:none}.chat-topic-bar button{flex:0 0 auto;border:1px solid rgba(133,106,67,.14);background:rgba(255,255,255,.5);color:#75634a;border-radius:999px;padding:7px 10px;font:500 9px/1 'DM Sans',sans-serif;cursor:pointer;transition:.2s ease;display:inline-flex;align-items:center;gap:5px}.chat-topic-bar button:hover{background:#fffaf0;border-color:rgba(169,136,80,.35)}.chat-topic-bar button.active{background:#29251d;color:#f8efe0;border-color:#29251d;box-shadow:0 4px 12px rgba(35,29,20,.1)}
.chat-messages{flex:1;min-height:115px;overflow:auto;padding:17px 16px 9px;scroll-behavior:smooth;background:radial-gradient(circle at 85% 5%,rgba(202,178,136,.14),transparent 30%),radial-gradient(circle at 5% 90%,rgba(157,171,126,.08),transparent 25%),#f8f3e9;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.chat-message-row{display:flex;gap:8px;margin:0 0 14px;align-items:flex-end;text-align:left}.chat-message-row.user{justify-content:flex-end}
.chat-mini-mark{flex:0 0 23px;width:23px;height:23px;border-radius:7px;background:#d3b37a;color:#17130e;display:grid;place-items:center}
.chat-message-stack{max-width:88%;display:flex;flex-direction:column;align-items:flex-start;text-align:left}.chat-bubble{max-width:100%;padding:12px 14px;border:1px solid rgba(93,77,52,.12);border-radius:16px 16px 16px 5px;background:rgba(255,253,248,.96);color:#322d25;font:400 12.5px/1.6 'DM Sans',sans-serif;box-shadow:0 6px 22px rgba(49,40,28,.045);white-space:pre-wrap;overflow-wrap:anywhere;text-align:left!important}.chat-message-row.user .chat-bubble{border-radius:16px 16px 5px 16px;background:#29251d;color:#f7efe2;border-color:#29251d}
.chat-answer-heading{display:flex;align-items:center;gap:7px;margin:0 3px 5px;text-align:left}.chat-answer-heading span{width:24px;height:24px;border-radius:7px;background:linear-gradient(145deg,#dfc38d,#b08b50);color:#211b12;display:grid;place-items:center;box-shadow:0 4px 12px rgba(168,130,72,.16)}.chat-answer-heading strong{font:600 9px/1.25 'DM Sans',sans-serif;color:#5d4b34;text-align:left}.chat-meta{font:400 7.5px/1.3 'DM Mono',monospace;color:#9a8d78;margin:5px 3px 0;text-align:left}.chat-typing{display:flex;gap:4px;align-items:center;padding:12px 14px}.chat-typing i{width:5px;height:5px;border-radius:50%;background:#9c8053;animation:chatTyping 1.1s infinite ease-in-out}.chat-typing i:nth-child(2){animation-delay:.15s}.chat-typing i:nth-child(3){animation-delay:.3s}.chat-typing span{margin-left:5px;color:#8f8068;font:400 8px/1.2 'DM Mono',monospace}
.chat-escalation{margin-top:8px;width:min(100%,390px);border:1px solid rgba(153,123,74,.2);background:linear-gradient(135deg,#f0e7d7,#fbf7ee);border-radius:14px;padding:10px;text-align:left}.chat-contact-title{display:flex;align-items:center;gap:8px}.chat-contact-title>span{width:28px;height:28px;border-radius:8px;background:#d4b579;color:#211b12;display:grid;place-items:center}.chat-contact-title strong{display:block;font:600 10px/1.2 'DM Sans',sans-serif;color:#443a2d}.chat-contact-title small{display:block;margin-top:2px;font:400 8px/1.25 'DM Mono',monospace;color:#88775e}.chat-contact-links{display:grid;gap:4px;margin-top:8px}.chat-contact-links a{display:flex;align-items:center;gap:6px;color:#765d38;text-decoration:none;font:500 8px/1.35 'DM Sans',sans-serif;overflow-wrap:anywhere}.chat-contact-links a:hover{text-decoration:underline;color:#4c3b24}.chat-escalation button{width:100%;margin-top:9px;border:1px solid #2b271f;background:#2b271f;color:#f8efe1;border-radius:10px;padding:9px;display:flex;justify-content:center;align-items:center;gap:5px;font:600 9px/1.1 'DM Sans',sans-serif;cursor:pointer;transition:.2s ease}.chat-escalation button:hover{background:#a27e4d;border-color:#a27e4d;transform:translateY(-1px)}
.chat-suggestions-wrap{flex:0 0 auto;padding:9px 13px 10px;background:linear-gradient(180deg,#f8f3e9,#f5eee2);border-top:1px solid rgba(110,91,61,.08);max-height:205px;overflow:auto;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.chat-suggestion-label{display:flex;align-items:center;justify-content:space-between;margin:0 2px 7px}.chat-suggestion-label span{text-transform:uppercase;letter-spacing:.1em;color:#8b714b;font:500 7.5px/1.2 'DM Mono',monospace;display:inline-flex;align-items:center;gap:5px}.chat-suggestion-label small{color:#a09482;font:400 7.5px/1.2 'DM Mono',monospace}
.chat-suggestions{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:transparent;padding:0}.chat-suggestions button{min-width:0;text-align:left;border:1px solid rgba(133,106,67,.17);background:rgba(255,250,240,.72);color:#5d4d37;border-radius:12px;padding:8px 8px;font:500 9px/1.3 'DM Sans',sans-serif;cursor:pointer;display:grid;grid-template-columns:23px 1fr 12px;align-items:center;gap:7px;transition:.2s ease}.chat-suggestions button>span{width:23px;height:23px;border-radius:7px;background:#eadcc5;color:#81653c;display:grid;place-items:center}.chat-suggestions button b{font-weight:600;text-align:left}.chat-suggestions button:hover{border-color:#ad8d59;background:#fffaf0;transform:translateY(-1px);box-shadow:0 5px 14px rgba(62,48,29,.06)}
.chat-input-wrap{margin:0 13px 8px;padding:6px 7px 6px 10px;background:#fffdf8;border:1px solid rgba(100,80,51,.2);border-radius:16px;display:flex;align-items:center;gap:5px;box-shadow:0 8px 25px rgba(44,35,23,.055);flex:0 0 auto}.chat-input-icon{color:#9d8d75;display:grid;place-items:center}.chat-input-wrap input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#28241e;padding:9px 4px;font:400 12px/1.3 'DM Sans',sans-serif}.chat-input-wrap input::placeholder{color:#aa9b85}.chat-counter{min-width:34px;text-align:right;color:#a89982;font:400 7px/1 'DM Mono',monospace}.chat-input-wrap button{width:36px;height:36px;border:0;border-radius:11px;background:#2b271f;color:#f6eddd;display:grid;place-items:center;cursor:pointer;transition:.2s ease}.chat-input-wrap button:not(:disabled):hover{background:#a98551;transform:translateX(1px)}.chat-input-wrap button:disabled{opacity:.35;cursor:not-allowed}
.chat-footer-row{padding:0 16px 12px;color:#9a8d78;display:flex;justify-content:flex-start;align-items:center;gap:6px;flex-wrap:wrap;font:400 7px/1.3 'DM Mono',monospace;text-align:left;flex:0 0 auto}.chat-footer-row span{display:inline-flex;align-items:center;gap:3px}.chat-footer-row button{border:0;background:transparent;color:#8b6a3f;font:600 7px/1.3 'DM Mono',monospace;padding:0;cursor:pointer;display:inline-flex;align-items:center;gap:3px}.chat-footer-row button:hover{text-decoration:underline}
@media (max-width:640px){.chat-launcher{right:16px;bottom:16px;padding:7px}.chat-launcher-copy{display:none}.chat-launcher-icon{width:45px;height:45px}.chat-panel{right:8px;bottom:76px;width:calc(100vw - 16px);height:min(720px,calc(100vh - 94px));border-radius:21px}.chat-header{padding:14px}.chat-agent-title strong{font-size:13px}.chat-messages{padding:13px 13px 8px}.chat-bubble{font-size:12px;line-height:1.55}.chat-message-stack{max-width:91%}.chat-suggestions-wrap{max-height:188px}.chat-suggestions{grid-template-columns:1fr}.chat-topic-bar{padding-left:10px;padding-right:10px}.chat-footer-row{padding-bottom:10px}}
@media (max-height:720px) and (min-width:641px){.chat-panel{height:calc(100vh - 100px)}.chat-suggestions-wrap{max-height:175px}.chat-messages{padding-top:11px}.chat-footer-row{padding-bottom:8px}}
@keyframes chatPulse{0%,100%{transform:scale(.98);opacity:.4}50%{transform:scale(1.025);opacity:1}}
@keyframes chatTyping{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-3px);opacity:1}}
html, body, #root { width:100%; max-width:100%; overflow-x:clip; }
@supports not (overflow: clip) { html, body, #root { overflow-x:hidden; } }
body { overscroll-behavior-x:none; -webkit-tap-highlight-color:transparent; }
button, a, input, select, textarea { -webkit-tap-highlight-color:transparent; }
:focus-visible { outline:2px solid var(--gold2); outline-offset:3px; }
@media (pointer: coarse) { .cursor-dot, .cursor-ring { display:none !important; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; scroll-behavior:auto !important; }
}
.legal-page-shell .legal-block { scroll-margin-top:92px; }
.legal-page-shell .legal-nav { min-height:72px; }
.legal-page-shell, .legal-page-shell * { visibility:visible; }

/* Launch-readiness additions */
.brand-logo-image{display:block;object-fit:contain;max-width:100%;height:auto}
.brand-logo-wrap{display:flex;align-items:center;justify-content:flex-start;width:128px;height:48px;padding:4px 8px;background:#f4ecdc;border:1px solid rgba(199,162,105,.35);border-radius:9px;overflow:hidden}
.nav-brand-image{width:116px;height:43px}
.nav .brand{justify-content:flex-start;text-align:left}
.mobile-brand-image{width:150px;height:62px;margin-bottom:16px;padding:7px 10px;background:#f4ecdc;border-radius:10px}
.restaurant-brand-image{width:102px;height:38px;object-fit:contain;margin-top:5px;padding:2px 5px;background:#f4ecdc;border-radius:6px}
.footer-brand-image{width:165px;height:68px;object-fit:contain;padding:7px 10px;background:#f4ecdc;border-radius:10px}
.loading-brand-image{width:min(270px,70vw);height:92px;object-fit:contain;padding:9px 14px;background:#f4ecdc;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.2)}
.legal-brand-image{width:135px;height:55px;object-fit:contain;padding:4px 7px;background:#f4ecdc;border-radius:8px}
.hero-cta-note{display:flex;align-items:center;gap:7px;margin-top:12px;color:rgba(244,236,220,.55);font:400 .55rem/1.4 'DM Mono',monospace;letter-spacing:.04em}
.form-grid label.has-error input,.form-grid label.has-error select,.form-grid label.has-error textarea,.form-consent.has-error input{border-color:#9a5544;box-shadow:0 0 0 3px rgba(154,85,68,.08)}
.field-error{display:block;margin-top:6px;color:#9a5544;font:500 .68rem/1.4 'DM Sans',sans-serif}
.form-privacy-notice{margin:16px 0 0;color:rgba(32,29,23,.58);font:400 .68rem/1.55 'DM Sans',sans-serif}.form-privacy-notice strong{font-weight:600;color:#4d4232}.form-consent{display:flex!important;flex-direction:row!important;align-items:flex-start!important;justify-content:flex-start!important;gap:10px!important;margin-top:16px!important;font-size:.66rem!important;line-height:1.55!important;color:rgba(32,29,23,.62)!important;text-align:left!important;width:100%!important}.form-consent > span{display:block!important;flex:1!important;text-align:left!important;margin:0!important}
.form-consent input{width:17px!important;height:17px!important;flex:0 0 17px!important;margin-top:1px!important;accent-color:#8e7752}
.form-consent button{border:0;background:none;padding:0;color:#705b3d;text-decoration:underline;cursor:pointer;font:inherit}
.form-consent button:hover{color:#2d271e}
.special-page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:32px 24px;text-align:center;background:#11100d;color:#f5efe3}
.special-page-glow{position:absolute;width:65vw;height:65vw;max-width:760px;max-height:760px;border-radius:50%;background:radial-gradient(circle,rgba(211,191,162,.12),transparent 65%);pointer-events:none}
.special-logo{position:relative;width:min(250px,72vw);height:86px;object-fit:contain;padding:8px 12px;background:#f4ecdc;border-radius:12px;margin-bottom:38px}
.special-kicker{position:relative;font:500 .58rem/1 'DM Mono',monospace;letter-spacing:.22em;color:#b99b6c;margin-bottom:16px}
.special-page h1{position:relative;margin:0;max-width:800px;font:400 clamp(3rem,7vw,6.6rem)/.95 'DM Serif Display',serif;letter-spacing:-2px}
.special-page h1 em{color:#d3bfa2;font-style:italic}
.special-page p{position:relative;max-width:560px;margin:24px auto 30px;color:rgba(245,239,227,.64);font-size:.9rem;line-height:1.8}
.special-actions{position:relative;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.special-note{position:relative;margin-top:25px;color:rgba(245,239,227,.4);font:400 .62rem/1.4 'DM Mono',monospace}
.thank-icon{position:relative;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin-bottom:22px;background:#d3bfa2;color:#17130e;box-shadow:0 20px 55px rgba(211,191,162,.16)}
.mobile-sticky-cta{display:none}
.cookie-banner{position:fixed;left:18px;right:18px;bottom:18px;z-index:10050;display:flex;align-items:center;justify-content:space-between;gap:22px;padding:15px 17px;background:rgba(249,244,235,.98);color:#2c271f;border:1px solid rgba(124,99,62,.2);border-radius:16px;box-shadow:0 22px 70px rgba(0,0,0,.25);backdrop-filter:blur(18px)}
.cookie-copy{min-width:0;max-width:760px;text-align:left}.cookie-copy strong{display:block;font:600 .78rem/1.2 'DM Sans',sans-serif}.cookie-copy p{margin:4px 0 3px;font:400 .68rem/1.5 'DM Sans',sans-serif;color:#665b4b}.cookie-copy span{font:400 .58rem/1.4 'DM Mono',monospace;color:#8a7b65}.cookie-copy button{border:0;background:none;padding:0;color:#705b3d;text-decoration:underline;cursor:pointer;font:inherit}
.cookie-actions{display:flex;gap:7px;flex:0 0 auto}.cookie-actions button{min-height:38px;padding:9px 13px;border-radius:9px;cursor:pointer;font:600 .62rem/1 'DM Sans',sans-serif}.cookie-secondary{background:transparent;border:1px solid rgba(89,72,48,.25);color:#554735}.cookie-primary{background:#29251d;border:1px solid #29251d;color:#f8efe1}.cookie-primary:hover{background:#8d724a;border-color:#8d724a}.consent-settings-toast{position:fixed;right:18px;bottom:18px;z-index:10051;display:flex;align-items:center;gap:10px;padding:11px 13px;border:1px solid rgba(124,99,62,.22);background:#f8f2e7;color:#4f4435;border-radius:12px;box-shadow:0 15px 45px rgba(0,0,0,.18);font:500 .65rem/1.3 'DM Sans',sans-serif}.consent-settings-toast button{border:0;background:#29251d;color:#f8efe1;border-radius:8px;padding:8px 10px;cursor:pointer;font:600 .62rem/1 'DM Sans',sans-serif}
@media(max-width:767px){
  .brand-logo-wrap{width:110px;height:42px;padding:3px 6px}.nav-brand-image{width:100px;height:37px}
  .hero-cta-note{font-size:.53rem;line-height:1.5}
  .mobile-sticky-cta{display:block;position:fixed;left:12px;right:12px;bottom:12px;z-index:9997;padding-bottom:env(safe-area-inset-bottom)}
  .mobile-sticky-cta button{width:100%;min-height:50px;border:1px solid #2b271f;background:#2b271f;color:#f8efe1;border-radius:12px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font:600 .72rem/1 'DM Sans',sans-serif;box-shadow:0 15px 38px rgba(0,0,0,.28)}
  .mobile-sticky-cta button:active{transform:translateY(1px)}
  .cookie-banner{left:10px;right:10px;bottom:76px;display:block;padding:14px;border-radius:14px}.cookie-actions{margin-top:11px;display:grid;grid-template-columns:1fr 1fr 1fr}.cookie-actions button{padding:9px 7px}.cookie-copy span{display:block}.consent-settings-toast{left:10px;right:10px;bottom:74px;justify-content:space-between}
  .special-page{padding:26px 18px}.special-logo{width:210px;height:72px;margin-bottom:28px}.special-page h1{font-size:clamp(2.7rem,13vw,4.4rem);letter-spacing:-1px}.special-page p{font-size:.82rem;line-height:1.7}
}
@media(max-width:480px){
  .footer-brand-image{width:145px;height:62px}.loading-brand-image{height:78px}.legal-brand-image{width:118px;height:48px}
  .mobile-sticky-cta{left:9px;right:9px;bottom:9px}.mobile-sticky-cta button{min-height:48px}
  .cookie-actions{grid-template-columns:1fr 1fr}.cookie-actions .cookie-primary{grid-column:1/-1}.cookie-banner{bottom:68px}
}
@media(max-width:360px){.mobile-sticky-cta button{font-size:.66rem}.hero-cta-note{align-items:flex-start}.cookie-copy p{font-size:.64rem}}
/* Final launch polish */
.special-page{text-align:center;align-items:center}
.special-page p{margin-left:auto;margin-right:auto}
.special-actions{justify-content:center}
.special-page .special-logo{margin-left:auto;margin-right:auto}
.legal-page-shell .legal-nav{text-align:left}
.legal-page-shell .legal-brand{text-align:left}
@media(max-width:767px){
  .nav .brand-logo-wrap{width:110px;height:42px}
  .nav .nav-brand-image{width:100px;height:37px}
}

@media(prefers-reduced-motion:reduce){.special-page-glow{display:none}.mobile-sticky-cta button{transition:none}}
`;
export default function Pratyeksha() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
