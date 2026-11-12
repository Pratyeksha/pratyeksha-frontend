import React, { useEffect, useRef, useState } from "react";
import { UtensilsCrossed } from "lucide-react";

// Shared base: with VITE_API_URL unset this used "" and posted to /demo-request on the Vercel host (404), losing every lead.
import API_BASE_URL from "./apiBase.js";
const API = API_BASE_URL;
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
    fetchpriority="high"
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
const MODULE_MINI = {
  experience: { kpis: [["Menu views", "1,284"], ["Orders via QR", "312"]], bars: [38, 52, 44, 70, 58, 86, 74], rows: ["Table 12 · placed", "Table 5 · served"] },
  operations: { kpis: [["Avg. prep", "11 min"], ["Open tickets", "7"]], bars: [60, 48, 72, 40, 66, 52, 44], rows: ["Butter Naan · 4:10", "Cold Coffee · 1:35"] },
  billing: { kpis: [["Today", "₹48,260"], ["GST (CGST+SGST)", "₹2,298"]], bars: [30, 42, 55, 49, 68, 80, 92], rows: ["Invoice #1042 · UPI", "Invoice #1043 · Cash"] },
  inventory: { kpis: [["Low stock", "3 items"], ["Wastage", "−18%"]], bars: [82, 74, 66, 58, 49, 41, 36], rows: ["Paneer · 1.2 kg left", "Milk · reorder"] },
  intelligence: { kpis: [["Repeat guests", "42%"], ["Peak hour", "8–9 pm"]], bars: [28, 36, 50, 47, 76, 90, 64], rows: ["Best seller · Masala Dosa", "Slow mover · Soup"] },
  marketing: { kpis: [["Campaign reach", "2.4k"], ["Redeemed", "186"]], bars: [20, 34, 41, 63, 57, 78, 88], rows: ["Weekend offer · live", "Win-back · scheduled"] },
};
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
    ["Who is Pratyeksha for?", "users"],
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

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/pratyeksha.io/";
// Replace each fallback with the exact share URL copied from its Instagram Highlight.
const INSTAGRAM_HIGHLIGHTS = [
  { title: "Start Here", icon: "spark", tone: "ivory", url: INSTAGRAM_PROFILE_URL, note: "Meet the ecosystem" },
  { title: "Products", icon: "layers", tone: "sage", url: INSTAGRAM_PROFILE_URL, note: "Explore the platform" },
  { title: "For Cafés", icon: "coffee", tone: "gold", url: INSTAGRAM_PROFILE_URL, note: "Built for café teams" },
  { title: "For Restaurants", icon: "utensils", tone: "charcoal", url: INSTAGRAM_PROFILE_URL, note: "Made for restaurants" },
  { title: "Insights", icon: "chart", tone: "taupe", url: INSTAGRAM_PROFILE_URL, note: "See the bigger picture" },
  { title: "Trust", icon: "shield", tone: "ivory", url: INSTAGRAM_PROFILE_URL, note: "Our principles" },
  { title: "Book Demo", icon: "arrowUpRight", tone: "sage", url: INSTAGRAM_PROFILE_URL, note: "Take the next step" },
];

const HERO_HEADLINE_WORDS = ["harmony.", "your control.", "clear focus.", "good flow."];
const HERO_ROTATING_WORDS = ["in sync.", "more smoothly.", "with clarity.", "beautifully."];

const HERO_FEED = [
  { t: "Table 12", m: "Order placed · 3 items", k: "NEW" },
  { t: "Kitchen", m: "Butter Naan fired · 4 min", k: "COOKING" },
  { t: "Table 5", m: "Bill requested", k: "BILL" },
  { t: "Table 8", m: "Order served · ₹840", k: "DONE" },
  { t: "Stock", m: "Paneer running low", k: "ALERT" },
  { t: "Table 3", m: "Feedback · 5 stars", k: "LOVE" },
  { t: "Table 9", m: "Order placed · 2 items", k: "NEW" },
];
function HeroLiveFeed() {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = window.setInterval(() => { if (!document.hidden) setN((v) => v + 1); }, 2400);
    return () => window.clearInterval(id);
  }, []);
  const rows = [0, 1, 2].map((j) => ({ ...HERO_FEED[(n - j) % HERO_FEED.length], id: n - j }));
  return (
    <div className="hero-feed" aria-label="Live activity example">
      {rows.map((r) => (
        <div key={r.id} className={`hero-feed-row k-${r.k.toLowerCase()}`}>
          <span className="hero-feed-tag">{r.k}</span>
          <span className="hero-feed-txt"><b>{r.t}</b><small>{r.m}</small></span>
        </div>
      ))}
    </div>
  );
}
function TypewriterWords({ words = HERO_ROTATING_WORDS, typeSpeed = 76, deleteSpeed = 42, pause = 1450 }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(words[0] || "in sync.");
      return undefined;
    }
    const word = words[wordIndex % words.length] || "in sync.";
    const complete = !deleting && displayed === word;
    const delay = complete ? pause : deleting ? deleteSpeed : typeSpeed;
    const timer = window.setTimeout(() => {
      if (complete) {
        setDeleting(true);
      } else if (deleting) {
        if (displayed.length > 0) setDisplayed(displayed.slice(0, -1));
        else {
          setDeleting(false);
          setWordIndex((index) => (index + 1) % words.length);
        }
      } else {
        setDisplayed(word.slice(0, displayed.length + 1));
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [displayed, deleting, wordIndex, words, typeSpeed, deleteSpeed, pause]);

  return <span className="typewriter-word" aria-label={words[wordIndex % words.length]}><span aria-hidden="true">{displayed}</span><i className="typewriter-caret" aria-hidden="true" /></span>;
}

function InstagramProfileSection() {
  return (
    <section className="ig-showcase-section" id="instagram" aria-labelledby="ig-showcase-title">
      <div className="ig-showcase-inner">
        <div className="ig-showcase-heading">
          <span className="eyebrow">CONNECT WITH Pratyeksha</span>
          <p className="ig-overline">OUR WORLD, BEHIND THE EXPERIENCE <span> / </span> @pratyeksha.io</p>
          <h2 id="ig-showcase-title">Get to know <em>Pratyeksha.</em></h2>
          <p className="ig-heading-copy">Product updates, practical ideas and a closer look at how Pratyeksha helps cafés and restaurants deliver better experiences.</p>
        </div>
        <div className="ig-profile-card">
          <div className="ig-profile-topline"><span className="ig-live-dot" /> <span>OFFICIAL INSTAGRAM PROFILE</span><a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">VISIT INSTAGRAM <I name="arrowUpRight" size={13} /></a></div>
          <div className="ig-profile-main">
            <a className="ig-avatar-ring" href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer" aria-label="Open Pratyeksha on Instagram">
              <span className="ig-avatar-inner"><BrandLogo className="ig-profile-logo" alt="Pratyeksha crossed spoon-and-fork brand logo" /></span>
            </a>
            <div className="ig-profile-info">
              <div className="ig-username-row"><h3>pratyeksha.io</h3><span className="ig-profile-label">OFFICIAL PROFILE</span></div>
              <div className="ig-value-line"><span>Digital guest experience</span><i /> <span>Connected operations</span><i /> <span>Smarter decisions</span></div>
              <div className="ig-bio-block">
                <p className="ig-bio-name">Pratyeksha <span>· Restaurant technology platform</span></p>
                <p className="ig-bio">Run your café or restaurant with more clarity.<br />Digital menus · QR ordering · Kitchen · Operations · Insights<br /><strong>One connected platform. Better guest experiences.</strong></p>
              </div>
              <a className="ig-bio-link" href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer"><I name="globe" size={14} /> instagram.com/pratyeksha.io</a>
              <a className="ig-profile-cta" href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">Discover Pratyeksha on Instagram <I name="arrowUpRight" size={15} /></a>
            </div>
          </div>
          <div className="ig-divider"><span>EXPLORE OUR HIGHLIGHTS</span><span>SEVEN WAYS INTO THE Pratyeksha WORLD</span></div>
          <div className="ig-highlights-grid">
            {INSTAGRAM_HIGHLIGHTS.map((highlight, index) => (
              <a key={highlight.title} className={`ig-highlight ig-tone-${highlight.tone}`} href={highlight.url} target="_blank" rel="noreferrer" aria-label={`Open Instagram highlight: ${highlight.title}`}>
                <span className="ig-highlight-orbit"><span className="ig-highlight-icon"><I name={highlight.icon} size={23} stroke={1.45} /></span><span className="ig-highlight-index">{String(index + 1).padStart(2, "0")}</span></span>
                <strong>{highlight.title}</strong>
                <small>{highlight.note}</small>
              </a>
            ))}
          </div>
          <div className="ig-card-bottom"><span>VISUALIZE. ORDER. RELISH.</span><a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">FOLLOW @pratyeksha.io <I name="arrowUpRight" size={13} /></a></div>
        </div>
        <p className="ig-section-footnote">Follow Pratyeksha for product stories, hospitality insights and updates from our connected restaurant platform.</p>
      </div>
    </section>
  );
}

function PratyekshaChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTopic, setActiveTopic] = useState("Discover");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello, welcome to Pratyeksha.\n\nI’m here to help you find the right place to start — from a more engaging guest experience to smoother kitchen and business operations. What would you like to explore?",
      meta: "Your Pratyeksha guide"
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
      setMessages((prev) => [...prev, { role: "assistant", text: local.text, intent: local.intent, icon: local.icon, title: local.title, meta: "Verified Pratyeksha information" }]);
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
            coverage: `Use verified Pratyeksha information. The local intent matrix represents ${CHATBOT_COVERAGE_ESTIMATE.toLocaleString()}+ practical question variations.`,
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
        title: "Pratyeksha assistant",
        icon: "spark",
        meta: data?.source === "knowledge" ? "Verified Pratyeksha information" : "Pratyeksha assistant",
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
        meta: local.intent === "unknown" ? "A team member can confirm this" : "Verified Pratyeksha information"
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
      <button type="button" className={`chat-launcher ${open ? "is-open" : ""}`} onClick={() => setOpen((v) => !v)} aria-label={open ? "Close Pratyeksha assistant" : "Open Pratyeksha assistant"}>
        <span className="chat-launcher-glow" />
        <span className="chat-launcher-icon"><I name={open ? "close" : "spark"} size={21} /></span>
        {!open && <span className="chat-launcher-copy"><small>Pratyeksha</small><strong>Ask Pratyeksha</strong></span>}
      </button>
      <aside className={`chat-panel ${open ? "is-open" : ""}`} aria-hidden={!open} aria-label="Pratyeksha AI assistant">
        <div className="chat-header">
          <div className="chat-agent-mark"><I name="spark" size={18} /></div>
          <div className="chat-agent-title">
            <span>Pratyeksha / AI ASSISTANT</span>
            <strong>A little clarity for your next step.</strong>
            <small><span className="chat-status-dot" /> Explore the platform, one question at a time</small>
          </div>
          <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close assistant"><I name="close" size={17} /></button>
        </div>
        <div className="chat-trust">
          <span className="chat-live-dot" /> Answers grounded in Pratyeksha information <span>•</span> Pricing confirmed by our team
        </div>
        <div className="chat-topic-bar" aria-label="Question categories">
          {Object.keys(CHAT_TOPIC_SETS).map((topic) => {
            const [icon] = CHAT_TOPIC_META[topic];
            return (
              <button type="button" key={topic} className={activeTopic === topic ? "active" : ""} onClick={() => setActiveTopic(topic)}>
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
                {message.role === "assistant" && <div className="chat-answer-heading"><span><I name={message.icon || "spark"} size={13} /></span><strong>{message.title || "Pratyeksha assistant"}</strong></div>}
                <div className="chat-bubble">{message.text}</div>
                {message.role === "assistant" && message.meta && <span className="chat-meta">{message.meta}</span>}
                {message.role === "assistant" && (message.needsContact || (message.fallback && message.intent === "unknown")) && (
                  <div className="chat-escalation">
                    <div className="chat-contact-title">
                      <span><I name="phone" size={13} /></span>
                      <div>
                        <strong>Need a precise answer?</strong>
                        <small>Talk directly with the Pratyeksha team</small>
                      </div>
                    </div>
                    <div className="chat-contact-links">
                      <a href={`mailto:${CHATBOT_KNOWLEDGE.contact.email}`}><I name="mail" size={12} /> {CHATBOT_KNOWLEDGE.contact.email}</a>
                      <a href={`tel:${CHATBOT_KNOWLEDGE.contact.phone.replace(/[^\d+]/g, "")}`}><I name="phone" size={12} /> {CHATBOT_KNOWLEDGE.contact.phone}</a>
                    </div>
                    <button type="button" onClick={openDemo}>Book a private demo <I name="arrowUpRight" size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="chat-message-row assistant">
              <span className="chat-mini-mark"><I name="spark" size={11} /></span>
              <div className="chat-message-stack">
                <div className="chat-bubble chat-typing"><i /><i /><i /><span>Thinking from Pratyeksha knowledge</span></div>
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
              <button type="button" key={item} onClick={() => send(item)}>
                <span><I name={icon} size={13} /></span>
                <b>{item}</b>
                <I name="arrow" size={11} />
              </button>
            ))}
          </div>
        </div>
        <form className="chat-input-wrap" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <span className="chat-input-icon"><I name="search" size={15} /></span>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value.slice(0, 1200))} placeholder="Ask about your restaurant…" aria-label="Ask Pratyeksha assistant" maxLength={1200} />
          <span className="chat-counter">{input.length > 900 ? `${input.length}/1200` : ""}</span>
          <button type="submit" disabled={!input.trim() || sending} aria-label="Send question"><I name="arrow" size={17} /></button>
        </form>
        <div className="chat-footer-row">
          <span><I name="shield" size={10} /> Grounded answers</span>
          <span>•</span>
          <span><I name="users" size={10} /> Human confirmation for unknowns</span>
          <span>•</span>
          <button type="button" onClick={openDemo}>Book demo <I name="arrowUpRight" size={11} /></button>
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
              <button type="button">
                <I name="plus" size={15} />
              </button>
            </div>
          </div>
          <div className="dish-row">
            <div className="mini-dish">
              <div className="mini-dish-image"><UtensilsCrossed size={18} strokeWidth={1.8} /></div>
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
            <button type="button">
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
                <button type="button">
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
                <button type="button">
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
                <button type="button">
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
          <button type="button">
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
      <style>{CSS}{NX_CSS}</style>
      <div className="special-page-glow" />
      <BrandLogo className="special-logo" alt="Pratyeksha logo" />
      <span className="special-kicker">404 / PAGE NOT FOUND</span>
      <h1>This page took a<br /><em>wrong turn.</em></h1>
      <p>The page you requested does not exist or may have moved. Return to the restaurant experience system and continue exploring.</p>
      <button type="button" className="button primary" onClick={onHome}>Back to Pratyeksha <I name="arrow" size={16} /></button>
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
      <style>{CSS}{NX_CSS}</style>
      <BrandLogo className="special-logo" alt="Pratyeksha logo" />
      <div className="thank-icon"><I name="check" size={28} /></div>
      <span className="special-kicker">REQUEST RECEIVED</span>
      <h1>Your next restaurant<br /><em>conversation starts here.</em></h1>
      <p>Thanks for requesting a private demo. Our team will review the details and contact you using the information you provided.</p>
      <div className="special-actions">
        <button type="button" className="button primary" onClick={onHome}>Back to website <I name="arrow" size={16} /></button>
        <button type="button" className="button secondary" onClick={onDemo}>Send another request</button>
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
// Number that counts up once when it scrolls into view (reduced-motion: shows the final value straight away).
function CountUp({ to, suffix = "" }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") { setV(to); return undefined; }
    let raf = 0;
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1300); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

function App() {
  const [loading, setLoading] = useState(() => {
    try { return sessionStorage.getItem("pratyeksha_intro_seen") !== "1"; } catch { return true; }
  });
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

    // Warm the logo cache immediately so the opening screen never waits on the brand asset.
    let logoPreload = null;
    try {
      logoPreload = document.createElement("link");
      logoPreload.rel = "preload";
      logoPreload.as = "image";
      logoPreload.href = LOGO_SRC;
      logoPreload.fetchPriority = "high";
      document.head.appendChild(logoPreload);
      const logoWarmup = new Image();
      logoWarmup.fetchPriority = "high";
      logoWarmup.src = LOGO_SRC;
    } catch {}

    // Short branded intro, shown once per browser session; a revisit goes straight to the page.
    const timer = setTimeout(() => {
      try { sessionStorage.setItem("pratyeksha_intro_seen", "1"); } catch { /* storage blocked */ }
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (logoPreload?.parentNode) logoPreload.parentNode.removeChild(logoPreload);
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
    robots.setAttribute("content", pageKey === "thankYou" || pageKey === "notFound" ? "noindex,follow" : "index,follow,max-image-preview:large");
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
    setMeta("og:image:alt", "Pratyeksha restaurant experience system");
    setMeta("og:site_name", "Pratyeksha");
    setMeta("og:locale", "en_IN");
    setMeta("og:image:width", "1959");
    setMeta("og:image:height", "803");
    const setNamed = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute("name", name); document.head.appendChild(tag); }
      tag.setAttribute("content", content);
    };
    setNamed("twitter:card", "summary_large_image");
    setNamed("twitter:title", title);
    setNamed("twitter:description", description);
    setNamed("twitter:image", `${window.location.origin}/og-image.png`);
    let structuredData = document.getElementById("pratyeksha-structured-data");
    if (!structuredData) {
      structuredData = document.createElement("script");
      structuredData.id = "pratyeksha-structured-data";
      structuredData.type = "application/ld+json";
      document.head.appendChild(structuredData);
    }
    const origin = window.location.origin;
    const graph = [
      {
        "@type": "Organization",
        "@id": `${origin}/#org`,
        name: "Pratyeksha",
        url: origin,
        logo: `${origin}/pratyeksha-logo.png`,
        email: "hello.pratyeksha@gmail.com",
        telephone: "+91 87676 22654",
        address: { "@type": "PostalAddress", addressLocality: "Kolhapur", addressRegion: "Maharashtra", addressCountry: "IN" },
      },
      { "@type": "WebSite", "@id": `${origin}/#website`, url: origin, name: "Pratyeksha", inLanguage: "en-IN", publisher: { "@id": `${origin}/#org` } },
    ];
    if (pageKey === "home") {
      graph.push({
        "@type": "SoftwareApplication",
        name: "Pratyeksha",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Android, iOS",
        description: PAGE_META.home.description,
        url: `${origin}/landing`,
        publisher: { "@id": `${origin}/#org` },
        featureList: modules.flatMap((m) => m.features).slice(0, 24),
      });
      graph.push({
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      });
    }
    structuredData.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
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
  // Page motion: pointer spotlight on the feature grid + gentle parallax on the hero stage. Reveals are handled by the .reveal observer above.
  useEffect(() => {
    if (loading || legalPage) return undefined;
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return undefined;
    const stage = document.querySelector(".nx-stage");
    const onMove = (ev) => {
      const cell = ev.target.closest?.(".nx-cell");
      if (cell) {
        const r = cell.getBoundingClientRect();
        cell.style.setProperty("--mx", `${ev.clientX - r.left}px`);
        cell.style.setProperty("--my", `${ev.clientY - r.top}px`);
      }
      if (stage && stage.contains(ev.target)) {
        const r = stage.getBoundingClientRect();
        stage.style.setProperty("--ry", `${(((ev.clientX - r.left) / r.width - 0.5) * 8).toFixed(2)}deg`);
        stage.style.setProperty("--rx", `${(-((ev.clientY - r.top) / r.height - 0.5) * 6).toFixed(2)}deg`);
      }
    };
    const onLeave = (ev) => { if (stage && ev.target === stage) { stage.style.setProperty("--ry", "0deg"); stage.style.setProperty("--rx", "0deg"); } };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave, { passive: true });
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerout", onLeave); };
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
        <style>{CSS}{NX_CSS}</style>
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
        <style>{CSS}{NX_CSS}</style>
        <header className="legal-nav">
          <button type="button" className="legal-brand" onClick={closeLegal} aria-label="Back to Pratyeksha home">
            <BrandLogo className="legal-brand-image" alt="Pratyeksha logo" />
          </button>
          <button type="button" className="legal-close" onClick={closeLegal}>
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
            <button type="button" onClick={() => openLegal("privacy")}>Privacy Policy</button>
            <button type="button" onClick={() => openLegal("terms")}>Terms of Use</button>
            <button type="button" onClick={() => setShowConsentSettings(true)}>Privacy Settings</button>
          </div>
        </footer>
      </div>
    );
  }
  return (
    <div className="site">
      <style>{CSS}{NX_CSS}</style>
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
      <header className={`nx-nav ${scrolled ? "is-scrolled" : ""}`}>
        <button type="button" className="nx-brand" onClick={() => scrollTo("home")} aria-label="Pratyeksha home">
          <BrandLogo className="nx-brand-img" alt="Pratyeksha logo" />
        </button>
        <nav className="nx-links" aria-label="Primary">
          {[["system", "System"], ["experience", "Experience"], ["operations", "Operations"], ["intelligence", "Intelligence"]].map(([id, label]) => (
            <button type="button" key={id} className={activeSection === id ? "is-on" : ""} onClick={() => scrollTo(id)}>{label}</button>
          ))}
        </nav>
        <button type="button" className="nx-cta" onClick={() => scrollTo("demo")}>Book Demo <I name="arrow" size={15} /></button>
        <button type="button" className="nx-burger" onClick={() => setMobileOpen(true)} aria-label="Open menu"><I name="menu" size={22} /></button>
      </header>
      <div className={`nx-sheet ${mobileOpen ? "is-open" : ""}`} aria-hidden={!mobileOpen}>
        <button type="button" className="nx-sheet-x" onClick={() => setMobileOpen(false)} aria-label="Close menu"><I name="close" size={22} /></button>
        <BrandLogo className="nx-sheet-logo" alt="Pratyeksha logo" />
        <div className="nx-sheet-list">
          {[["home", "Home"], ["system", "System"], ["experience", "Experience"], ["operations", "Operations"], ["intelligence", "Intelligence"], ["marketing", "Marketing"], ["demo", "Book a Demo"]].map(([id, label], i) => (
            <button type="button" key={id} style={{ "--i": i }} onClick={() => scrollTo(id)}><span>{String(i + 1).padStart(2, "0")}</span>{label}<I name="arrow" size={16} /></button>
          ))}
        </div>
        <p className="nx-sheet-foot">Restaurant Experience System</p>
      </div>
      <main className="nx-main">
        {/* ───────── HERO ───────── */}
        <section id="home" className="nx-hero">
          <div className="nx-hero-bg" aria-hidden="true"><i className="glow" /></div>
          <div className="nx-hero-copy">
            <div className="nx-kicker reveal"><span />FOR THE PEOPLE WHO RUN THE ROOM</div>
            <h1 className="nx-h1 reveal delay-1">
              <span>Your restaurant.</span>
              <span>More in <em><TypewriterWords words={HERO_HEADLINE_WORDS} /></em></span>
            </h1>
            <p className="nx-lead reveal delay-2">Orders, kitchen flow, stock and guest relationships should work together—not compete for your attention. Pratyeksha brings the moving parts into one connected view, helping you spend less time chasing updates and more time shaping the business you want to build.</p>
            <div className="nx-actions reveal delay-3">
              <button type="button" className="nx-btn is-gold" onClick={() => scrollTo("demo")}>Explore Pratyeksha <I name="arrow" size={16} /></button>
              <button type="button" className="nx-btn is-ghost" onClick={() => scrollTo("system")}>Explore the Difference</button>
            </div>
            <div className="nx-note reveal delay-3"><I name="spark" size={13} /> Built around the pressure of a real service, not a software checklist</div>
            <ul className="nx-proof reveal delay-4"><li>One connected view</li><li>Fewer blind spots</li><li>Better-informed decisions</li></ul>
          </div>
          <div className="nx-stage reveal delay-2" aria-hidden="false">
            <div className="nx-phone">
              <div className="nx-phone-top"><span>TABLE 12</span><span className="nx-live"><i />LIVE</span></div>
              <small>YOUR BUSINESS, AT A GLANCE</small>
              <BrandLogo className="nx-phone-logo" alt="Pratyeksha logo" />
              <HeroLiveFeed />
              <div className="nx-phone-card"><span><I name="qr" size={16} /></span><div><strong>Smart Menu Active</strong><small>3D · Voice · Bilingual</small></div><I name="arrow" size={15} /></div>
            </div>
          </div>
        </section>
        <div className="nx-strip" aria-label="From scan to return"><ul>{["Scan", "Discover", "Order", "Serve", "Settle", "Remember", "Return"].map((w, i) => <li key={w}><b>{String(i + 1).padStart(2, "0")}</b>{w}</li>)}</ul></div>

        {/* ───────── SYSTEM ───────── */}
        <section id="system" className="nx-sec nx-system">
          <div className="nx-wrap">
            <header className="nx-head">
              <span className="nx-eyebrow reveal">The Pratyeksha system</span>
              <h2 className="reveal delay-1">Stop running your restaurant <em>in pieces.</em></h2>
              <p className="reveal delay-2">Missed orders. Stock surprises. Unclear margins. Customers who never return. One disconnected workflow can create five more problems. Pratyeksha connects the everyday work so you can see what is happening and act with more clarity.</p>
            </header>
            <ul className="nx-pains reveal" aria-label="Common restaurant operating challenges">
              <li><i />Orders scattered across tools</li><li><i />Stock surprises during service</li><li><i />Repeat visits left to chance</li>
            </ul>
            <div className="nx-product">
              <div className="nx-rail" role="tablist" aria-label="Product layers">
                {Object.entries(PRODUCTS).map(([key, item]) => (
                  <button type="button" role="tab" aria-selected={activeProduct === key} key={key} className={activeProduct === key ? "is-on" : ""} onClick={() => setActiveProduct(key)} aria-label={`View ${item.eyebrow}`}>
                    <span className="nx-rail-n">{item.number}</span>
                    <strong>{item.eyebrow}</strong>
                    <I name={{ experience: "phone", kitchen: "kitchen", operations: "layers", intelligence: "chart", marketing: "spark" }[key]} size={16} />
                  </button>
                ))}
              </div>
              <div className="nx-product-body">
                <div className="nx-product-copy" key={activeProduct}>
                  <span className="nx-bignum">{activeProductData.number}</span>
                  <h3>{activeProductData.title}</h3>
                  <p>{activeProductData.description}</p>
                  <ul className="nx-ticks">{PRODUCT_FEATURES.map((f) => <li key={f}><I name="check" size={13} />{f}</li>)}</ul>
                  <div className="nx-stepper">
                    <button type="button" aria-label="Previous layer" onClick={() => { const keys = Object.keys(PRODUCTS); setActiveProduct(keys[(activeProductIndex - 1 + keys.length) % keys.length]); }}><I name="chevronLeft" size={16} /></button>
                    <button type="button" aria-label="Next layer" onClick={() => { const keys = Object.keys(PRODUCTS); setActiveProduct(keys[(activeProductIndex + 1) % keys.length]); }}><I name="chevronRight" size={16} /></button>
                    <span>0{activeProductIndex + 1} / 05</span>
                  </div>
                </div>
                <div className="nx-product-visual" key={`visual-${activeProduct}`}><ProductVisual type={activeProduct} /></div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── USE CASES ───────── */}
        <section className="nx-sec nx-use">
          <div className="nx-wrap">
            <header className="nx-head is-center">
              <span className="nx-eyebrow reveal">ONE PLATFORM / MANY FORMATS</span>
              <h2 className="reveal delay-1">Built around the pressure <em>you deal with every day.</em></h2>
              <p className="reveal delay-2">From the first customer scan to the final bill, your team needs fewer hand-offs and clearer information. Pratyeksha is designed for cafés, restaurants and growing multi-outlet businesses.</p>
            </header>
            <div className="nx-use-grid">
              {useCases.map((item, index) => (
                <article className="nx-use reveal" key={item.title} style={{ "--i": index }}>
                  <span className="nx-use-n">0{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <ul>{item.points.map((p) => <li key={p}><I name="check" size={12} />{p}</li>)}</ul>
                  <span className="nx-use-go"><I name="arrow" size={18} /></span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── MODULES ───────── */}
        {modules.map((module, index) => (
          <section id={module.id} className={`nx-mod ${module.color === "cream" ? "is-cream" : "is-dark"} ${index % 2 ? "is-flip" : ""}`} key={module.id}>
            <span className="nx-mod-ghost" aria-hidden="true">{module.number}</span>
            <div className="nx-wrap nx-mod-grid">
              <div className="nx-mod-copy">
                <span className="nx-eyebrow reveal">{module.number} — {module.eyebrow}</span>
                <h2 className="reveal delay-1">{module.title}</h2>
                <p className="reveal delay-2">{module.text}</p>
                <ul className="nx-feats reveal delay-3">
                  {module.features.map((f) => <li key={f}><span><I name="check" size={12} /></span>{f}</li>)}
                </ul>
                <button type="button" className="nx-link reveal delay-4" onClick={() => scrollTo("demo")}>Explore this capability <I name="arrow" size={15} /></button>
              </div>
              <div className="nx-mod-card reveal">
                <div className="nx-win">
                  <div className="nx-win-bar"><span><i /><i /><i /></span><small>Pratyeksha / {module.eyebrow}</small></div>
                  <div className="nx-win-body">
                    <div className="nx-win-top"><span className="nx-win-ic"><I name={module.icon} size={24} stroke={1.3} /></span><div><small>SAMPLE VIEW</small><strong>{module.eyebrow}</strong></div></div>
                    <div className="nx-kpis">{(MODULE_MINI[module.id]?.kpis || []).map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}</div>
                    <div className="nx-bars" aria-hidden="true">{(MODULE_MINI[module.id]?.bars || []).map((h, i) => <i key={i} style={{ "--h": `${h}%`, "--i": i }} />)}</div>
                    <div className="nx-rows">{(MODULE_MINI[module.id]?.rows || []).map((r) => <span key={r}><i />{r}</span>)}</div>
                    <div className="nx-win-foot"><span><i />REAL-TIME</span><span><I name="shield" size={12} />SECURE</span></div>
                  </div>
                </div>
                <div className="nx-tag t1"><I name={module.icon} size={14} />LIVE MODULE</div>
                <div className="nx-tag t2"><i />Connected</div>
              </div>
            </div>
          </section>
        ))}

        {/* ───────── BENTO ───────── */}
        <section className="nx-sec nx-bento-sec">
          <div className="nx-wrap">
            <header className="nx-head is-center">
              <span className="nx-eyebrow reveal">THE COMPLETE LAYER</span>
              <h2 className="reveal delay-1">More than a menu. <em>More than a POS.</em></h2>
              <p className="reveal delay-2">Pratyeksha sits between the customer experience and the operational engine of your café or restaurant.</p>
            </header>
            <div className="nx-bento">
              {[
                ["qr", "Smart QR Menu", "Beautiful digital menus without forcing customers to install another app."],
                ["layers", "3D Dish Experience", "Let guests understand the dish before they order it."],
                ["mic", "Voice Experience", "Dish narration and kitchen interaction through voice."],
                ["kitchen", "Live KDS", "Kitchen tickets, timers, routing and queue management."],
                ["map", "Live Floor", "See table state, orders and service activity together."],
                ["billing", "GST Billing", "Connected settlement with GST and payment handling."],
                ["box", "Smart Inventory", "Connect ingredients, recipes and availability."],
                ["chart", "Business Intelligence", "Understand what is happening instead of only seeing numbers."],
                ["users", "Customer Intelligence", "Learn what returning guests actually prefer."],
                ["globe", "Multilingual", "Designed for real Indian café and restaurant environments."],
                ["shield", "Operational Controls", "Permissions, availability, billing and workflow safeguards."],
                ["spark", "Marketing Layer", "Turn restaurant interactions into future customer relationships."],
              ].map(([icon, title, desc], i) => (
                <article className="nx-cell reveal" key={title} style={{ "--i": i % 4 }}>
                  <span className="nx-cell-ic"><I name={icon} size={20} /></span>
                  <span className="nx-cell-n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── FLOW ───────── */}
        <section className="nx-sec nx-flow">
          <div className="nx-wrap">
            <header className="nx-head">
              <span className="nx-eyebrow reveal">ONE CUSTOMER JOURNEY</span>
              <h2 className="reveal delay-1">From scan <em>to loyalty.</em></h2>
            </header>
            <ol className="nx-track">
              {[["01", "SCAN", "Guest scans your table QR."], ["02", "DISCOVER", "Explores menu and 3D dishes."], ["03", "ORDER", "Places order directly."], ["04", "PREPARE", "Kitchen receives live ticket."], ["05", "SETTLE", "Billing consolidates everything."], ["06", "REMEMBER", "Customer relationship continues."]].map(([n, t, p], i) => (
                <li className="nx-step reveal" key={n} style={{ "--i": i }}>
                  <span className="nx-step-dot"><i /></span>
                  <b>{n}</b>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── BRAND MOMENT ───────── */}
        <section className="nx-moment">
          <div className="nx-moment-glow" aria-hidden="true" />
          <div className="nx-wrap">
            <span className="nx-eyebrow reveal">RESTAURANT EXPERIENCE SYSTEM</span>
            <h2 className="reveal delay-1">Make every part of the <em>experience feel connected.</em></h2>
            <p className="reveal delay-2">Better menus. Faster operations. Smarter decisions. Stronger customer relationships.</p>
            <div className="nx-stats reveal delay-3">
              <div><strong><CountUp to={6} suffix="+" /></strong><span>Connected layers</span></div>
              <div><strong><CountUp to={24} suffix="/7" /></strong><span>Digital availability</span></div>
              <div><strong><CountUp to={1} /></strong><span>Unified system</span></div>
            </div>
          </div>
        </section>

        {/* ───────── INSTAGRAM + DEMO (kept as built) ───────── */}
        <InstagramProfileSection />
        <section id="demo" className="demo-section">
          <div className="demo-grid">
            <div className="demo-copy">
              <div className="eyebrow reveal">
                PRIVATE DEMONSTRATION
              </div>
              <div className="demo-overline reveal delay-1">A PRIVATE, OWNER-FOCUSED WALKTHROUGH</div>
              <h2 className="reveal delay-1">
                Make room for
                <br />
                <em>better service.</em>
              </h2>
              <p className="reveal delay-2">
                Tell us what slows your team down—from order handoffs and stock visibility to billing or bringing guests back. We’ll focus the walkthrough on your priorities, then help you understand the right setup and subscription fit for your business.
              </p>
              <div className="demo-benefit-list reveal delay-3">
                <div><span>01</span><p><strong>Map your current workflow</strong><small>See where orders, stock, billing and customer follow-ups meet.</small></p></div>
                <div><span>02</span><p><strong>Focus on what matters to you</strong><small>No generic feature tour. A conversation around your priorities.</small></p></div>
                <div><span>03</span><p><strong>Understand the next step</strong><small>Explore fit, setup and applicable subscription options with the team.</small></p></div>
              </div>
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
                  <button type="button"
                    className="button primary"
                    onClick={() => setSent(false)}
                  >
                    Send another request
                  </button>
                </div>
              ) : (
                <form onSubmit={submitDemo} aria-busy={sending}>
                  <div className="form-top">
                    <div className="form-heading-mark"><I name="sparkles" size={17} /></div>
                    <div className="form-heading-copy"><small>YOUR PRIVATE WALKTHROUGH</small><strong>Let’s make it relevant.</strong><span>About a minute to get started</span></div>
                    <span className="form-step">01 <i /> 01</span>
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
                        placeholder="The person behind the business"
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
                        placeholder="Your café or restaurant name"
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
                        placeholder="What takes too much time? Where do things get missed? What would you like to improve?"
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
                    {sending ? "Sending securely…" : "See Your Restaurant, Connected"}
                    <I name="arrow" size={17} />
                  </button>
                  <p className="form-note">
                    <I name="lock-keyhole" size={13} /> Your details are used to respond to this request. No pressure—just a focused conversation about your operation.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ───────── PILLARS ───────── */}
        <section id="signature" className="nx-sec nx-pillars">
          <div className="nx-wrap">
            <header className="nx-head">
              <span className="nx-eyebrow reveal">THE Pratyeksha DIFFERENCE</span>
              <h2 className="reveal delay-1">One experience. <em>Many intelligent layers.</em></h2>
              <p className="reveal delay-2">Four ideas run through every screen, from the guest's first scan to the owner's last report of the night.</p>
            </header>
            <div className="nx-pillar-grid">
              {[
                ["01", "spark", "Discovery", "A menu should feel like an experience before it becomes an order.", "MENU / CUSTOMER EXPERIENCE"],
                ["02", "layers", "Connection", "Guest, kitchen, billing and inventory signals stay connected.", "OPERATIONS / ONE SYSTEM"],
                ["03", "kitchen", "Control", "Operators get a clearer view of what is happening across the restaurant.", "OPERATOR / LIVE VIEW"],
                ["04", "users", "Memory", "Useful customer signals can continue beyond a single table visit.", "INTELLIGENCE / RETENTION"],
              ].map(([n, ic, t, p, tag], i) => (
                <article className="nx-pillar reveal" key={n} style={{ "--i": i }}>
                  <span className="nx-pillar-n">{n}</span>
                  <I name={ic} size={22} />
                  <h3>{t}</h3>
                  <p>{p}</p>
                  <small>{tag}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── JOURNEY (guest phone) ───────── */}
        <section id="journey" className="nx-sec nx-journey">
          <div className="nx-wrap nx-journey-grid">
            <div className="nx-journey-copy">
              <span className="nx-eyebrow reveal">DESIGNED AROUND THE GUEST</span>
              <h2 className="reveal delay-1">From the first <em>scan</em> to the last impression.</h2>
              <p className="reveal delay-2">A premium restaurant experience is made from small moments. Pratyeksha connects those moments without making the customer feel like they are navigating software.</p>
              <div className="nx-quiet reveal delay-3"><i />QUIET TECHNOLOGY / VISIBLE EXPERIENCE</div>
              <ol className="nx-moments">
                {[["01", "Scan", "A clean QR entry point starts the experience."], ["02", "Explore", "Visual menu, categories and dish context help discovery."], ["03", "Order", "A direct digital journey keeps the interaction simple."], ["04", "Remember", "Signals from the visit can become future customer intelligence."]].map(([n, t, p]) => (
                  <li className="reveal" key={n}><span>{n}</span><div><h3>{t}</h3><p>{p}</p></div></li>
                ))}
              </ol>
            </div>
            <div className="nx-journey-visual reveal delay-1">
              <div className="nx-ph back"><div className="nx-ph-notch" /><small>TABLE 12</small><strong>Discover</strong><i className="nx-ph-dish" /><i className="nx-ph-line" /><i className="nx-ph-line s" /></div>
              <div className="nx-ph front">
                <div className="nx-ph-notch" />
                <small>TABLE 12 / MENU</small><strong>Tonight's menu</strong><p>Find something you will remember.</p>
                <div className="nx-ph-item"><span /><div><b>Paneer Special</b><small>Chef selection</small></div></div>
                <div className="nx-ph-item"><span className="alt" /><div><b>Fresh Fruit Shake</b><small>Made to order</small></div></div>
                <button type="button" tabIndex={-1}>Explore menu <I name="arrow" size={13} /></button>
              </div>
              <div className="nx-ph-signal"><I name="spark" size={15} /><span><small>SMART SIGNAL</small><b>Returning guest</b></span></div>
            </div>
          </div>
        </section>

        {/* ───────── OPERATOR VIEW ───────── */}
        <section id="command" className="nx-sec nx-command">
          <div className="nx-wrap">
            <header className="nx-head nx-split">
              <div>
                <span className="nx-eyebrow reveal">THE OPERATOR VIEW</span>
                <h2 className="reveal delay-1">See the restaurant <em>as one system.</em></h2>
              </div>
              <span className="nx-pill reveal"><i />LIVE OPERATIONS / CONNECTED</span>
            </header>
            <div className="nx-board reveal delay-1">
              <div className="nx-board-top"><span>Pratyeksha</span><span>OPERATOR / TODAY</span><span>10:42 PM</span></div>
              <div className="nx-board-body">
                <aside>
                  {[["spark", "Overview", true], ["receipt", "Orders"], ["layers", "Menu"], ["inventory", "Inventory"], ["chart", "Intelligence"]].map(([ic, l, on]) => <div key={l} className={on ? "is-on" : ""}><I name={ic} size={14} />{l}</div>)}
                </aside>
                <div className="nx-board-main">
                  <div className="nx-board-hello"><div><small>GOOD EVENING</small><b>Restaurant overview</b></div><button type="button" tabIndex={-1}>View live floor <I name="arrow" size={12} /></button></div>
                  <div className="nx-metrics">
                    <div><small>TODAY'S SALES</small><strong>₹ 48,260</strong><em>+12.8%</em></div>
                    <div><small>ORDERS</small><strong>126</strong><em>+18</em></div>
                    <div><small>ACTIVE TABLES</small><strong>18</strong><em>06 OPEN</em></div>
                    <div><small>KITCHEN FLOW</small><strong>94%</strong><em>STABLE</em></div>
                  </div>
                  <div className="nx-board-low">
                    <div className="nx-panel">
                      <header><span>Revenue rhythm</span><small>LAST 7 DAYS</small></header>
                      <div className="nx-spark" aria-hidden="true">{[42, 55, 48, 72, 61, 88, 76].map((h, i) => <i key={i} style={{ "--h": `${h}%`, "--i": i }} />)}</div>
                      <footer>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}</footer>
                    </div>
                    <div className="nx-panel nx-activity">
                      <header><span>Live activity</span><small>NOW</small></header>
                      {[["Table 12", "Order accepted", "2 min"], ["Table 04", "Kitchen preparing", "4 min"], ["Table 18", "Bill requested", "1 min"], ["Table 07", "Feedback received", "6 min"]].map(([a, b, c]) => <div key={a}><i /><b>{a}</b><small>{b}</small><em>{c}</em></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="nx-kds reveal delay-2">
              <div className="nx-kds-head"><span>KITCHEN DISPLAY</span><span className="nx-live"><i />LIVE</span></div>
              <div className="nx-kds-cols">
                {[
                  ["NEW", [["#1048", "Paneer Tikka", "Table 12 · 2 items", "00:48"], ["#1049", "Veg Momos", "Takeaway · 1 item", "01:12"]]],
                  ["PREPARING", [["#1045", "Special Combo", "Table 08 · 4 items", "04:28", "hot"], ["#1046", "Fresh Fruit Shake", "Table 03 · 2 items", "02:06"]]],
                  ["READY", [["#1041", "Masala Maggi", "Table 05 · 1 item", "READY", "done"]]],
                ].map(([col, tix]) => (
                  <div key={col}><small>{col}</small>
                    {tix.map(([id, name, meta, time, st]) => <div className={`nx-tk ${st || ""}`} key={id}><b>{id}</b><strong>{name}</strong><span>{meta}</span><i>{time}</i></div>)}
                  </div>
                ))}
              </div>
              <p><strong>Order state stays visible.</strong> FIFO tickets · timers · live sync</p>
            </div>
            <div className="nx-board-foot"><span>ONE RESTAURANT / ONE CONNECTED FLOW</span><span>DESIGNED FOR CLARITY · BUILT FOR DAILY USE</span></div>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section id="faq" className="nx-sec nx-faq">
          <div className="nx-wrap nx-faq-grid">
            <div className="nx-faq-intro">
              <span className="nx-eyebrow reveal">QUESTIONS / ANSWERS</span>
              <h2 className="reveal delay-1">Everything you need to know, <em>before the first demo.</em></h2>
              <p className="reveal delay-2">A concise look at how Pratyeksha fits into a real café or restaurant without the usual software-sales noise.</p>
              <div className="nx-faq-card reveal delay-3">
                <span><I name="spark" size={17} /></span>
                <div><small>STILL CURIOUS?</small><strong>Let's show you the actual experience.</strong></div>
                <button type="button" onClick={() => scrollTo("demo")}>Book demo <I name="arrow" size={14} /></button>
              </div>
            </div>
            <div className="nx-faq-list reveal delay-1">
              {faqs.map((item, index) => {
                const open = openFaq === index;
                return (
                  <article className={`nx-q ${open ? "is-open" : ""}`} key={item.q}>
                    <button type="button" onClick={() => setOpenFaq(open ? -1 : index)} aria-expanded={open}>
                      <span className="nx-q-n">{String(index + 1).padStart(2, "0")}</span>
                      <span className="nx-q-t">{item.q}</span>
                      <span className="nx-q-i"><i /><i /></span>
                    </button>
                    <div className="nx-q-a"><div>{item.a}</div></div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ───────── FOOTER ───────── */}
      <footer className="nx-footer">
        <div className="nx-wrap">
          <div className="nx-foot-top">
            <div className="nx-foot-brand">
              <button type="button" onClick={() => scrollTo("home")} aria-label="Back to top"><BrandLogo className="nx-foot-logo" alt="Pratyeksha logo" /></button>
              <p>The digital layer behind better café and restaurant experiences.</p>
              <div className="nx-foot-tag">VISUALIZE <i /> ORDER <i /> RELISH</div>
            </div>
            <div className="nx-foot-col"><h4>Platform</h4>
              <button type="button" onClick={() => scrollTo("experience")}>Customer Experience</button>
              <button type="button" onClick={() => scrollTo("operations")}>Kitchen & Operations</button>
              <button type="button" onClick={() => scrollTo("billing")}>Smart Billing</button>
              <button type="button" onClick={() => scrollTo("inventory")}>Inventory</button>
              <button type="button" onClick={() => scrollTo("intelligence")}>Intelligence</button>
            </div>
            <div className="nx-foot-col"><h4>For Business</h4>
              <button type="button" onClick={() => scrollTo("system")}>Cafés</button>
              <button type="button" onClick={() => scrollTo("system")}>Restaurants</button>
              <button type="button" onClick={() => scrollTo("system")}>QSRs</button>
              <button type="button" onClick={() => scrollTo("system")}>Multi-outlet</button>
              <button type="button" onClick={() => scrollTo("demo")}>Book Demo</button>
            </div>
            <div className="nx-foot-col"><h4>Contact</h4>
              <a href="tel:+918767622654">+91 87676 22654</a>
              <a href="tel:+918605015294">+91 86050 15294</a>
              <a href="mailto:hello.pratyeksha@gmail.com">hello.pratyeksha@gmail.com</a>
              <span className="nx-foot-loc"><I name="map" size={13} />Maharashtra, India</span>
            </div>
          </div>
          <div className="nx-wordmark" aria-hidden="true">PRATYEKSHA</div>
          <div className="nx-foot-mid"><span>RESTAURANT EXPERIENCE SYSTEM</span><button type="button" onClick={() => scrollTo("home")}>Back to top <I name="arrow" size={14} /></button></div>
          <div className="nx-foot-bot">
            <span>© {new Date().getFullYear()} Pratyeksha. All rights reserved.</span>
            <span>Built for cafés & restaurants.</span>
            <div>
              <button type="button" onClick={() => openLegal("privacy")}>Privacy Policy</button>
              <button type="button" onClick={() => openLegal("terms")}>Terms of Use</button>
              <button type="button" onClick={() => setShowConsentSettings(true)}>Privacy Settings</button>
            </div>
          </div>
        </div>
      </footer>
      <PratyekshaChatbot />
      <div className="mobile-sticky-cta" aria-label="Book a private demo">
        <button type="button" onClick={() => scrollTo("demo")}><span>See Your Restaurant, Connected</span><I name="arrow" size={15} /></button>
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
          <button type="button" onClick={() => updateConsent(!cookieConsent.analytics)}>{cookieConsent.analytics ? "Turn off analytics" : "Allow analytics"}</button>
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
  --sage:#b0a89a;
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
  animation:loaderLine 6.7s cubic-bezier(.65,0,.35,1) forwards;
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
  border-color:rgba(176, 168, 154,.05);
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
  border-color:rgba(176, 168, 154,.06);
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
  color:#b0a89a;
  font-size:.5rem;
  letter-spacing:1px;
}
.live i{
  width:5px;
  height:5px;
  border-radius:50%;
  background:#b0a89a;
  box-shadow:0 0 10px #b0a89a;
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
  border:1px solid rgba(230, 226, 220,.35);
  border-radius:7px 7px 10px 10px;
  background:rgba(176, 168, 154,.06);
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
  border-color:rgba(176, 168, 154,.05);
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
    radial-gradient(circle at 12% 38%, rgba(176, 168, 154,.045), transparent 26rem);
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
.signature-section{position:relative;overflow:hidden;padding:150px 6vw 120px;background:radial-gradient(circle at 15% 18%,rgba(199,162,105,.15),transparent 25%),radial-gradient(circle at 88% 78%,rgba(176, 168, 154,.14),transparent 26%),linear-gradient(145deg,#f0e5d2,#e3d3ba 55%,#f5ecdf);color:var(--darkText);isolation:isolate;}
.signature-shell{max-width:1480px;margin:auto;position:relative;z-index:2;}
.signature-orbit{position:absolute;border:1px solid rgba(39,31,20,.08);border-radius:50%;pointer-events:none;animation:premiumOrbit 26s linear infinite;}
.signature-orbit-a{width:700px;height:700px;right:-360px;top:80px;}.signature-orbit-b{width:430px;height:430px;left:-280px;bottom:-180px;animation-direction:reverse;}
.signature-heading{max-width:820px;}.signature-heading h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(3.2rem,6vw,6.4rem);line-height:.92;letter-spacing:-3px;margin:20px 0 30px;}.signature-heading h2 em{color:#8e7752;font-style:italic;}.signature-heading p{max-width:690px;color:rgba(32,29,23,.6);font-size:.9rem;line-height:1.9;}
.signature-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(32,29,23,.14);border:1px solid rgba(32,29,23,.12);margin-top:90px;}.signature-card{position:relative;min-height:370px;padding:28px 25px;background:rgba(248,242,231,.75);transition:transform .45s ease,box-shadow .45s ease,background .35s ease;overflow:hidden;}.signature-card:hover{transform:translateY(-10px);background:#f8f0e2;box-shadow:0 35px 70px rgba(52,40,25,.13);z-index:3;}.signature-card>svg{color:#9d8459;position:absolute;right:25px;top:28px;}.signature-number{font:400 .55rem/1 'DM Mono',monospace;letter-spacing:2px;color:#8e7752;}.signature-rule{height:1px;background:rgba(32,29,23,.11);margin:75px 0 38px;position:relative;}.signature-rule::after{content:"";position:absolute;left:0;top:-1px;width:34%;height:1px;background:#b99b6c;}.signature-card h3{font-family:'DM Serif Display',serif;font-size:1.8rem;font-weight:400;margin-bottom:13px;}.signature-card p{max-width:240px;font-size:.75rem;line-height:1.8;color:rgba(32,29,23,.56);}.signature-card small{position:absolute;bottom:24px;left:25px;font:400 .45rem/1 'DM Mono',monospace;letter-spacing:1.4px;color:rgba(32,29,23,.3);}.signature-marquee{margin-top:75px;border-top:1px solid rgba(32,29,23,.1);border-bottom:1px solid rgba(32,29,23,.1);padding:22px 0;overflow:hidden;white-space:nowrap;}.signature-marquee-track{width:max-content;display:flex;align-items:center;gap:25px;font:400 .55rem/1 'DM Mono',monospace;letter-spacing:2px;color:rgba(32,29,23,.42);animation:premiumMarquee 30s linear infinite;}.signature-marquee-track i{font-style:normal;color:#9f865a;}
.journey-section{position:relative;overflow:hidden;background:#151511;color:#eee5d5;padding:155px 6vw 135px;isolation:isolate;}.journey-section::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 25%,rgba(199,162,105,.12),transparent 25%),radial-gradient(circle at 10% 80%,rgba(176, 168, 154,.08),transparent 28%);z-index:-1;}.journey-shell{max-width:1480px;margin:auto;display:grid;grid-template-columns:.9fr 1.1fr;gap:7vw;align-items:center;}.journey-copy h2{font-family:'DM Serif Display',serif;font-size:clamp(3rem,5.5vw,6rem);font-weight:400;line-height:.94;letter-spacing:-2.5px;margin:20px 0 28px;}.journey-copy h2 em{font-style:italic;color:#c7a269;}.journey-copy p{max-width:560px;color:rgba(238,229,213,.52);font-size:.88rem;line-height:1.9;}.journey-note{margin-top:42px;font:400 .48rem/1 'DM Mono',monospace;letter-spacing:1.8px;color:rgba(238,229,213,.34);display:flex;align-items:center;gap:9px;}.journey-dot{width:7px;height:7px;border-radius:50%;background:#b0a89a;box-shadow:0 0 16px rgba(176, 168, 154,.6);}
.journey-visual{position:relative;min-height:650px;display:flex;align-items:center;justify-content:center;}.journey-phone{width:275px;height:555px;border-radius:34px;padding:10px;border:1px solid rgba(255,255,255,.15);position:absolute;box-shadow:0 45px 100px rgba(0,0,0,.45);}.phone-back{transform:translate(-105px,-25px) rotate(-8deg);background:#20201b;opacity:.5;}.phone-front{transform:translate(50px,25px) rotate(4deg);background:#e8ddca;color:#27231d;z-index:2;}.phone-notch{width:78px;height:17px;background:#080806;border-radius:0 0 14px 14px;position:absolute;top:0;left:50%;transform:translateX(-50%);}.phone-screen{padding:45px 17px 20px;display:flex;flex-direction:column;gap:12px;height:100%;border-radius:26px;overflow:hidden;}.dark-phone{color:#eee5d5;background:linear-gradient(150deg,#292720,#10100d);}.light-phone{background:linear-gradient(150deg,#f6eddf,#d8cbb4);}.phone-screen small{font:400 .42rem/1 'DM Mono',monospace;letter-spacing:1.4px;opacity:.5;}.phone-screen strong{font-family:'DM Serif Display',serif;font-size:2rem;font-weight:400;line-height:1;}.phone-screen p{font-size:.62rem;opacity:.52;line-height:1.5;}.mock-dish{height:150px;border-radius:22px;background:radial-gradient(circle at 50% 45%,#c5ab7e 0 16%,#766448 17% 25%,transparent 26%),radial-gradient(circle at 50% 50%,#27251f 0 45%,#0d0d0b 46% 58%,transparent 59%);margin:8px 0;}.mock-line{height:8px;border-radius:99px;background:currentColor;opacity:.12;width:90%;}.mock-line.short{width:55%;}.mock-menu{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center;padding:8px;border:1px solid rgba(39,31,20,.1);background:rgba(255,255,255,.25);border-radius:12px;}.mock-menu>span{width:52px;height:52px;border-radius:11px;background:radial-gradient(circle at 50% 45%,#a68b5d 0 20%,#5e4e38 21% 35%,#25231e 36% 52%,#171612 53%);}.mock-menu>span.sage-dish{background:radial-gradient(circle at 50% 50%,#b1ad84 0 19%,#70634d 20% 34%,#29271f 35% 52%,#171612 53%);}.mock-menu b{display:block;font-size:.62rem;font-weight:600;}.mock-menu small{display:block;margin-top:4px;font-size:.43rem;}.phone-screen button{border:0;background:#29251f;color:#f2e7d5;border-radius:999px;padding:11px 13px;font-size:.58rem;display:flex;align-items:center;justify-content:center;gap:7px;}.journey-float{position:absolute;right:0;bottom:70px;z-index:5;display:flex;align-items:center;gap:10px;padding:13px 15px;background:rgba(28,27,23,.86);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px);}.journey-float>svg{color:#c7a269;}.journey-float small{display:block;font:400 .42rem/1 'DM Mono',monospace;letter-spacing:1.4px;color:rgba(238,229,213,.34);}.journey-float b{display:block;font-size:.67rem;font-weight:500;margin-top:4px;}.journey-steps{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(255,255,255,.11);margin-top:55px;}.journey-step{display:grid;grid-template-columns:35px 1fr;gap:15px;padding:28px 22px 8px;border-right:1px solid rgba(255,255,255,.09);min-height:150px;}.journey-step:last-child{border-right:0;}.journey-step>span{font:400 .5rem/1 'DM Mono',monospace;color:#c7a269;letter-spacing:1.4px;}.journey-step h3{font-family:'DM Serif Display',serif;font-size:1.3rem;font-weight:400;margin-bottom:7px;}.journey-step p{font-size:.65rem;line-height:1.7;color:rgba(238,229,213,.4);}
.command-section{position:relative;overflow:hidden;background:#e8ddca;color:#242018;padding:150px 6vw 135px;}.command-section::before{content:"";position:absolute;inset:0;opacity:.35;background-image:linear-gradient(rgba(40,32,21,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(40,32,21,.07) 1px,transparent 1px);background-size:90px 90px;mask-image:radial-gradient(circle at 50% 45%,#000,transparent 82%);}.command-shell{max-width:1480px;margin:auto;position:relative;z-index:2;}.command-heading{display:flex;justify-content:space-between;align-items:end;gap:30px;}.command-heading h2{font-family:'DM Serif Display',serif;font-size:clamp(3rem,5.3vw,5.8rem);font-weight:400;line-height:.94;letter-spacing:-2.5px;margin-top:18px;}.command-heading h2 em{font-style:italic;color:#8f7855;}.live-pill{font:400 .47rem/1 'DM Mono',monospace;letter-spacing:1.5px;border:1px solid rgba(36,32,24,.14);padding:10px 13px;display:flex;gap:8px;align-items:center;color:rgba(36,32,24,.48);}.live-pill i{width:6px;height:6px;border-radius:50%;background:#9a907e;box-shadow:0 0 10px rgba(154, 144, 126,.8);}.command-board{margin-top:65px;background:#1a1915;color:#e9dfcf;border:1px solid rgba(255,255,255,.1);box-shadow:0 55px 110px rgba(49,38,23,.22);overflow:hidden;}.board-top{height:54px;border-bottom:1px solid rgba(255,255,255,.08);display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;padding:0 20px;font:400 .45rem/1 'DM Mono',monospace;letter-spacing:1.5px;color:rgba(233,223,207,.38);}.board-top span:nth-child(2){text-align:center;}.board-top span:last-child{text-align:right;}.board-top span:first-child{color:#c7a269;}.board-body{display:grid;grid-template-columns:190px 1fr;min-height:560px;}.board-sidebar{border-right:1px solid rgba(255,255,255,.08);padding:25px 13px;}.board-nav{display:flex;align-items:center;gap:10px;padding:12px;color:rgba(233,223,207,.38);font-size:.62rem;margin-bottom:4px;border:1px solid transparent;transition:.25s ease;}.board-nav.active{color:#eadfcf;border-color:rgba(199,162,105,.16);background:rgba(199,162,105,.07);}.board-nav:hover{color:#eadfcf;background:rgba(255,255,255,.03);}.board-main{padding:32px;}.board-welcome{display:flex;justify-content:space-between;align-items:end;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.08);}.board-welcome small{display:block;font:400 .44rem/1 'DM Mono',monospace;letter-spacing:1.4px;color:rgba(233,223,207,.3);margin-bottom:8px;}.board-welcome b{font-family:'DM Serif Display',serif;font-size:1.65rem;font-weight:400;}.board-welcome button{background:transparent;border:1px solid rgba(255,255,255,.12);color:rgba(233,223,207,.62);padding:10px 13px;font-size:.56rem;display:flex;gap:7px;align-items:center;}.board-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.08);margin:25px 0;}.board-metrics>div{background:#1a1915;padding:18px;min-height:120px;display:flex;flex-direction:column;justify-content:space-between;}.board-metrics small{font:400 .42rem/1 'DM Mono',monospace;letter-spacing:1.3px;color:rgba(233,223,207,.3);}.board-metrics strong{font-size:1.35rem;font-weight:500;}.board-metrics em{font-style:normal;font-size:.52rem;color:#a99f8e;}.board-lower{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;}.board-panel{border:1px solid rgba(255,255,255,.08);padding:20px;background:#171613;min-height:265px;}.board-panel header{display:flex;justify-content:space-between;margin-bottom:30px;font-size:.65rem;}.board-panel header small{font:400 .41rem/1 'DM Mono',monospace;color:rgba(233,223,207,.28);letter-spacing:1px;}.bars{height:150px;display:flex;align-items:end;gap:11px;border-bottom:1px solid rgba(255,255,255,.08);padding:0 8px;}.bars i{flex:1;display:block;min-height:14px;border-radius:3px 3px 0 0;background:linear-gradient(180deg,#c7a269,#806d4b);}.bars i:nth-child(1){height:35%;}.bars i:nth-child(2){height:50%;}.bars i:nth-child(3){height:43%;}.bars i:nth-child(4){height:67%;}.bars i:nth-child(5){height:59%;}.bars i:nth-child(6){height:81%;}.bars i:nth-child(7){height:93%;}.board-panel footer{display:flex;justify-content:space-between;padding:9px 8px 0;font:400 .4rem/1 'DM Mono',monospace;color:rgba(233,223,207,.25);}.activity>div:not(.panel-head){display:grid;grid-template-columns:8px 1fr auto;column-gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06);}.activity>div:last-child{border-bottom:0;}.activity>div>i{width:5px;height:5px;border-radius:50%;background:#b0a89a;box-shadow:0 0 8px rgba(176, 168, 154,.5);}.activity b{font-size:.6rem;font-weight:500;}.activity small{display:block;font-size:.46rem;color:rgba(233,223,207,.34);margin-top:3px;}.activity em{font:400 .42rem/1 'DM Mono',monospace;font-style:normal;color:rgba(233,223,207,.27);}.command-footer{display:flex;justify-content:space-between;margin-top:25px;font:400 .46rem/1 'DM Mono',monospace;letter-spacing:1.5px;color:rgba(36,32,24,.4);}
.faq-section{position:relative;overflow:hidden;padding:150px 6vw 45px;background:#11100d;color:#f4ecdc;isolation:isolate;}.faq-section::before{content:"";position:absolute;inset:0;z-index:-2;background:radial-gradient(circle at 12% 20%,rgba(199,162,105,.14),transparent 30%),radial-gradient(circle at 88% 78%,rgba(176, 168, 154,.08),transparent 28%),linear-gradient(135deg,#11100d,#1b1914 55%,#11100d);}.faq-inner{max-width:1480px;margin:auto;display:grid;grid-template-columns:minmax(320px,.78fr) minmax(520px,1.22fr);gap:9vw;position:relative;z-index:2;}.faq-intro{position:sticky;top:120px;align-self:start;}.faq-kicker{font:400 .58rem/1 'DM Mono',monospace;letter-spacing:2px;color:rgba(244,236,220,.34);margin-top:28px;}.faq-intro h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(2.8rem,4.8vw,5.5rem);line-height:.98;letter-spacing:-2px;margin:18px 0 25px;}.faq-intro h2 em{color:#d1b27e;font-style:italic;}.faq-intro>p{max-width:500px;color:rgba(244,236,220,.56);font-size:.9rem;line-height:1.85;}.faq-side-card{margin-top:52px;padding:18px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);backdrop-filter:blur(14px);display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:center;max-width:500px;}.faq-side-card>span{width:40px;height:40px;border:1px solid rgba(199,162,105,.45);display:grid;place-items:center;color:#d1b27e;background:rgba(199,162,105,.06);}.faq-side-card small{display:block;color:#b99968;font:400 .52rem/1 'DM Mono',monospace;letter-spacing:2px;margin-bottom:5px;}.faq-side-card strong{font-size:.76rem;font-weight:500;color:rgba(244,236,220,.8);}.faq-side-card button{grid-column:1/-1;justify-self:start;background:transparent;color:#d1b27e;font-size:.67rem;display:flex;align-items:center;gap:9px;padding:7px 0;cursor:pointer;}.faq-list{border-top:1px solid rgba(255,255,255,.13);}.faq-item{border-bottom:1px solid rgba(255,255,255,.13);position:relative;}.faq-item::before{content:"";position:absolute;left:0;top:0;width:1px;height:0;background:#c7a269;transition:height .45s ease;}.faq-item.is-open::before{height:100%;}.faq-question{width:100%;background:none;color:#f4ecdc;display:grid;grid-template-columns:44px 1fr 38px;gap:18px;text-align:left;align-items:center;padding:27px 0;cursor:pointer;}.faq-index{font:400 .56rem/1 'DM Mono',monospace;color:rgba(199,162,105,.7);letter-spacing:1px;}.faq-question-text{font-family:'DM Serif Display',serif;font-size:clamp(1.05rem,1.55vw,1.45rem);font-weight:400;line-height:1.25;transition:color .25s ease;}.faq-question:hover .faq-question-text,.faq-item.is-open .faq-question-text{color:#d1b27e;}.faq-toggle{width:32px;height:32px;border:1px solid rgba(255,255,255,.14);border-radius:50%;position:relative;display:block;transition:.35s ease;}.faq-toggle i{position:absolute;left:9px;top:15px;width:12px;height:1px;background:#d1b27e;transition:.35s ease;}.faq-toggle i+i{transform:rotate(90deg);}.faq-item.is-open .faq-toggle{background:#b99968;border-color:#b99968;transform:rotate(45deg);}.faq-item.is-open .faq-toggle i{background:#11100d;}.faq-answer-wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s cubic-bezier(.2,.8,.2,1);}.faq-item.is-open .faq-answer-wrap{grid-template-rows:1fr;}.faq-answer{overflow:hidden;min-height:0;color:rgba(244,236,220,.52);font-size:.81rem;line-height:1.85;padding:0 70px 0 62px;opacity:0;transition:padding .45s ease,opacity .35s ease;}.faq-item.is-open .faq-answer{padding-bottom:29px;opacity:1;}.faq-orbit{position:absolute;border:1px solid rgba(199,162,105,.08);border-radius:50%;pointer-events:none;z-index:-1;}.faq-orbit-one{width:650px;height:650px;right:-330px;top:90px;}.faq-orbit-two{width:430px;height:430px;left:-300px;bottom:-220px;border-color:rgba(176, 168, 154,.06);}.faq-bottom-line{max-width:1480px;margin:100px auto 0;padding-top:18px;border-top:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;color:rgba(244,236,220,.25);font:400 .5rem/1 'DM Mono',monospace;letter-spacing:2px;}
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
.fusion-section{position:relative;overflow:hidden;background:linear-gradient(135deg,#171712 0%,#211f19 52%,#191713 100%);color:#f7efdf;padding:150px 6vw 120px;border-top:1px solid rgba(231,214,184,.12)}
.fusion-inner{position:relative;z-index:2;max-width:1480px;margin:auto}.fusion-orb{position:absolute;border-radius:50%;pointer-events:none}.fusion-orb-one{width:420px;height:420px;left:-180px;top:90px;background:radial-gradient(circle,rgba(199,162,105,.16),transparent 68%)}.fusion-orb-two{width:520px;height:520px;right:-250px;bottom:-200px;background:radial-gradient(circle,rgba(176, 168, 154,.13),transparent 68%)}
.fusion-heading{max-width:850px}.fusion-kicker{font:10px/1.4 'DM Mono',monospace;letter-spacing:.2em;color:#b0a89a;margin:18px 0 25px}.fusion-heading h2{font:clamp(42px,5.5vw,82px)/.96 'DM Sans',sans-serif;letter-spacing:-.055em;font-weight:500}.fusion-heading h2 em{font-family:'DM Serif Display',serif;color:#dfc18d;font-weight:400}.fusion-heading p{max-width:700px;color:#b7af9f;font-size:15px;line-height:1.9;margin-top:28px}
.fusion-grid{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:16px;margin-top:70px}.fusion-panel{min-height:650px;padding:18px;border:1px solid rgba(231,214,184,.13);background:rgba(250,246,238,.035);box-shadow:0 30px 100px rgba(0,0,0,.24);backdrop-filter:blur(18px);position:relative;overflow:hidden}.fusion-panel-top{display:flex;justify-content:space-between;align-items:center;color:#9f988a;font:10px 'DM Mono',monospace;letter-spacing:.16em;padding:4px 4px 16px}.fusion-panel-top svg{color:#c7a269}.fusion-phone{width:min(285px,82%);margin:18px auto 0;border-radius:34px;padding:17px 14px 20px;background:linear-gradient(160deg,#f7edda,#e7d6b8);color:#242119;box-shadow:0 28px 80px rgba(0,0,0,.4);transform:rotate(-2deg)}.fusion-phone-top,.fusion-phone-search,.fusion-phone-tabs{display:flex;justify-content:space-between;align-items:center}.fusion-phone-top{font:8px 'DM Mono',monospace;letter-spacing:.12em;color:#746b5c}.fusion-phone-brand{font:22px 'DM Serif Display',serif;margin:23px 4px 14px}.fusion-phone-search{font-size:9px;border:1px solid rgba(30,25,18,.13);border-radius:12px;padding:10px 9px;color:#6d6558}.fusion-phone-tabs{gap:6px;margin-top:16px;font-size:8px;color:#776e60}.fusion-phone-tabs b{color:#201d17;border-bottom:1px solid #c7a269;padding-bottom:5px}.fusion-dish-hero{height:190px;margin:10px 0 14px;border-radius:25px;background:radial-gradient(circle at 50% 46%,#d5c39e 0 19%,#a68e62 20% 28%,#433c2d 29% 31%,transparent 32%),linear-gradient(145deg,#ded0b2,#a99877);position:relative;display:grid;place-items:center;overflow:hidden}.fusion-dish-orbit{width:145px;height:145px;border:1px solid rgba(255,255,255,.55);border-radius:50%}.fusion-dish-core{position:absolute;font-size:30px;color:#fff5df}.fusion-dish-hero span{position:absolute;left:12px;bottom:12px;background:#201d17;color:#f4ecdc;border-radius:999px;padding:5px 8px;font:7px 'DM Mono',monospace}.fusion-phone-title{font:20px 'DM Serif Display',serif}.fusion-phone-copy{font-size:9px;line-height:1.7;color:#6b6254;margin-top:5px}.fusion-panel-note{position:absolute;left:22px;right:22px;bottom:20px;display:flex;justify-content:space-between;gap:14px;align-items:end;border-top:1px solid rgba(231,214,184,.11);padding-top:15px}.fusion-panel-note strong{font-size:12px;font-weight:500}.fusion-panel-note span{font:8px/1.5 'DM Mono',monospace;color:#8e887b;text-align:right}
.fusion-board{background:#12110f;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px;margin-top:10px}.fusion-board-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px}.fusion-live{font:8px 'DM Mono',monospace;color:#b0a89a;border:1px solid rgba(176, 168, 154,.3);border-radius:99px;padding:5px 8px}.fusion-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.fusion-columns small{font:8px 'DM Mono',monospace;color:#817b70;letter-spacing:.12em}.fusion-ticket{margin-top:8px;background:#1d1d18;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:11px;display:grid;gap:5px}.fusion-ticket.active{border-color:rgba(199,162,105,.55)}.fusion-ticket.ready{border-color:rgba(176, 168, 154,.4)}.fusion-ticket b{font:8px 'DM Mono',monospace;color:#c7a269}.fusion-ticket strong{font-size:10px;font-weight:500}.fusion-ticket span{font-size:7px;color:#817b70}.fusion-ticket i{font:8px 'DM Mono',monospace;color:#dfc18d;font-style:normal}.fusion-ticket.ready i{color:#b0a89a}
.fusion-command-window{margin-top:10px;background:#f1e6d2;color:#28251d;border-radius:18px;padding:18px}.fusion-command-head{display:flex;justify-content:space-between;gap:10px}.fusion-command-head small{display:block;font:7px 'DM Mono',monospace;color:#8b806d;letter-spacing:.12em}.fusion-command-head strong{display:block;font:18px 'DM Serif Display',serif;margin-top:4px}.fusion-command-head>span{font:7px 'DM Mono',monospace;color:#8b806d}.fusion-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:18px}.fusion-metrics div{background:rgba(255,255,255,.42);padding:10px;border-radius:10px}.fusion-metrics small{display:block;font:6px 'DM Mono',monospace;color:#847966}.fusion-metrics b{display:block;font-size:14px;margin-top:5px}.fusion-metrics span{font:7px 'DM Mono',monospace;color:#807664}.fusion-chart{height:180px;margin-top:16px;position:relative;overflow:hidden;border-bottom:1px solid rgba(40,37,29,.14)}.fusion-chart-fill{position:absolute;inset:45% -10% -10% 0;background:linear-gradient(180deg,rgba(199,162,105,.28),rgba(199,162,105,0));clip-path:polygon(0 45%,15% 52%,30% 30%,45% 38%,60% 20%,75% 31%,90% 10%,100% 20%,100% 100%,0 100%)}.fusion-chart-line{position:absolute;inset:0;display:flex;justify-content:space-around;align-items:flex-start;padding-top:45%;z-index:2}.fusion-chart-line span{width:7px;height:7px;border-radius:50%;background:#927542}.fusion-floor{display:grid;grid-template-columns:repeat(8,1fr);gap:7px;margin-top:14px}.fusion-floor span{height:24px;border:1px solid rgba(40,37,29,.12);border-radius:7px;text-align:center;line-height:22px;color:#aaa18f;font-size:8px}.fusion-floor .occupied{color:#8d7043;background:rgba(199,162,105,.16)}.fusion-command-foot{display:flex;justify-content:space-between;margin-top:12px;font:7px 'DM Mono',monospace;color:#817665}.fusion-bottom{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:45px;padding-top:24px;border-top:1px solid rgba(231,214,184,.12)}.fusion-bottom>span{font:8px 'DM Mono',monospace;color:#8f897c;letter-spacing:.13em}.fusion-bottom strong{font:14px 'DM Serif Display',serif;font-weight:400;color:#dfc18d}.fusion-swatches{display:flex;gap:5px}.fusion-swatches i{width:18px;height:18px;border-radius:50%;display:block;border:1px solid rgba(255,255,255,.12)}.fusion-swatches i:nth-child(1){background:#171712}.fusion-swatches i:nth-child(2){background:#f4ecdc}.fusion-swatches i:nth-child(3){background:#c7a269}.fusion-swatches i:nth-child(4){background:#b0a89a}
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
  background: #221f1b;
  border: 1px solid rgba(231,214,184,.12);
  box-shadow: var(--shadow);
}
.experience-stage {
  background:
    radial-gradient(circle at 70% 25%, rgba(200,168,107,.14), transparent 28%),
    radial-gradient(circle at 20% 70%, rgba(181, 172, 157,.1), transparent 30%),
    #221f1b;
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
  border: 7px solid #0f0d0b;
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
  background: #221f1b;
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
  color: #191713;
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
  background: #26231e;
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
  background: rgba(18, 17, 15,.86);
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
  box-shadow: 0 0 0 5px rgba(181, 172, 157,.08);
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
  background: #2b2721;
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
  background: linear-gradient(145deg, rgba(200,168,107,.13), #2b2721);
}
.timer-line {
  height: 3px;
  background: #36322b;
  margin-top: 16px;
}
.timer-line span {
  display: block;
  width: 72%;
  height: 100%;
  background: var(--gold);
}
.ready-ticket {
  border-color: rgba(181, 172, 157,.22);
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
  background: rgba(18, 17, 15,.3);
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
    #1b1915;
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
  background: #2b2721;
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
  background: #2b2721;
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
  background: #1b1915;
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
  background: #2b2721;
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
  background: #1b1915;
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
    #2b2721;
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
    radial-gradient(760px 620px at 8% 72%, rgba(181, 172, 157,.075), transparent 64%),
    linear-gradient(180deg,#161411 0%,#1b1915 48%,#181613 100%);
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
    radial-gradient(circle at 14% 74%,rgba(181, 172, 157,.08),transparent 20%),
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
  background:rgba(18, 17, 15,.28) !important;
  backdrop-filter:blur(10px);
}
.product-section .product-nav button:hover{background:#c8a86b !important;color:#12110f !important;}
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
    radial-gradient(circle at 20% 76%,rgba(181, 172, 157,.11),transparent 31%),
    linear-gradient(145deg,#24221d,#1c1a16 62%,#25231d);
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
.chat-agent-title{display:flex;flex-direction:column;min-width:0;flex:1;text-align:left}.chat-agent-title span{font:400 8px/1.2 'DM Mono',monospace;letter-spacing:.13em;color:#bba273}.chat-agent-title strong{font:600 14px/1.3 'DM Sans',sans-serif;margin-top:3px;color:#f7f0e3}.chat-agent-title small{display:flex;align-items:center;gap:5px;margin-top:5px;color:#8f897d;font:400 8px/1.25 'DM Mono',monospace}.chat-status-dot{width:5px;height:5px;border-radius:50%;background:#ad9e83;box-shadow:0 0 0 3px rgba(173, 158, 131,.1)}
.chat-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.1);border-radius:50%;display:grid;place-items:center;background:transparent;color:#e9dfce;cursor:pointer;transition:.2s ease}.chat-close:hover{background:rgba(255,255,255,.06);border-color:rgba(220,193,145,.3);transform:rotate(4deg)}
.chat-trust{padding:9px 17px;background:#eee6d8;border-bottom:1px solid rgba(110,91,61,.1);font:400 9px/1.3 'DM Mono',monospace;letter-spacing:.02em;color:#6f6049;text-align:left}.chat-trust span{margin:0 4px}.chat-live-dot{display:inline-block!important;width:6px;height:6px;border-radius:50%;background:#9b8c72;box-shadow:0 0 0 4px rgba(155, 140, 114,.12);vertical-align:middle}
.chat-topic-bar{display:flex;gap:6px;padding:9px 12px 8px;background:#f3ecdf;border-bottom:1px solid rgba(110,91,61,.09);overflow:auto;scrollbar-width:none;touch-action:pan-x}.chat-topic-bar::-webkit-scrollbar{display:none}.chat-topic-bar button{flex:0 0 auto;border:1px solid rgba(133,106,67,.14);background:rgba(255,255,255,.5);color:#75634a;border-radius:999px;padding:7px 10px;font:500 9px/1 'DM Sans',sans-serif;cursor:pointer;transition:.2s ease;display:inline-flex;align-items:center;gap:5px}.chat-topic-bar button:hover{background:#fffaf0;border-color:rgba(169,136,80,.35)}.chat-topic-bar button.active{background:#29251d;color:#f8efe0;border-color:#29251d;box-shadow:0 4px 12px rgba(35,29,20,.1)}
.chat-messages{flex:1;min-height:115px;overflow:auto;padding:17px 16px 9px;scroll-behavior:smooth;background:radial-gradient(circle at 85% 5%,rgba(202,178,136,.14),transparent 30%),radial-gradient(circle at 5% 90%,rgba(171, 154, 126,.08),transparent 25%),#f8f3e9;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
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
/* The site intentionally stays light on light-capable surfaces even when the phone OS uses dark mode. */
html, body, #root{
  color-scheme:light;
}
input, select, textarea, button{
  color-scheme:light;
}
.form-grid input,
.form-grid select,
.form-grid textarea{
  -webkit-text-fill-color:#eee5d4;
}
.form-grid select{
  -webkit-text-fill-color:rgba(255,255,255,.72);
}
.form-grid label.full select[name="type"]{
  -webkit-text-fill-color:#25221c!important;
}
.form-privacy-notice{
  display:block!important;
  width:100%!important;
  max-width:none!important;
  margin:16px 0 0!important;
  text-align:left!important;
  text-align-last:left!important;
  color:rgba(255,255,255,.68)!important;
  font-size:.68rem!important;
  line-height:1.6!important;
}
.form-privacy-notice strong{
  color:#dfc18d!important;
  font-weight:600!important;
}
.form-consent{
  color:rgba(255,255,255,.70)!important;
}
.form-consent,
.form-consent > span{
  text-align:left!important;
  text-align-last:left!important;
}
.form-consent button{
  color:#dfc18d!important;
}
.form-consent button:hover{
  color:#f4ecdc!important;
}
/* On phones the sticky demo action occupies the bottom edge, so the assistant always sits clearly above it. */
@media(max-width:767px){
  .chat-launcher{
    right:16px!important;
    bottom:calc(76px + env(safe-area-inset-bottom))!important;
    z-index:10060!important;
  }
  .chat-panel{
    right:8px!important;
    bottom:calc(136px + env(safe-area-inset-bottom))!important;
    z-index:10059!important;
    height:min(680px,calc(100svh - 158px - env(safe-area-inset-bottom)))!important;
  }
  .chat-backdrop{
    z-index:10058!important;
  }
  .mobile-sticky-cta{
    bottom:calc(9px + env(safe-area-inset-bottom))!important;
    z-index:9997!important;
  }
  .cookie-banner{
    z-index:10050!important;
  }
}

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

/* Pratyeksha Instagram profile + highlight showcase — aligned, responsive and brand-consistent */
.ig-showcase-section{position:relative;overflow:hidden;padding:clamp(68px,8vw,112px) 6vw;background:#f7f3ea;color:#26231d;border-top:1px solid rgba(55, 50, 40,.08)}
.ig-showcase-inner{width:min(1080px,100%);margin:0 auto}
.ig-showcase-heading{max-width:720px;margin:0 auto 40px;text-align:center}
.ig-showcase-heading .eyebrow{color:#786d5a}
.ig-overline{margin:15px 0 12px;font-size:10px;letter-spacing:1.9px;font-weight:700;color:#88816f}
.ig-overline span{color:#b18b4f;padding:0 7px}
.ig-showcase-heading h2{margin:0;font-family:inherit;font-size:clamp(2.1rem,4.5vw,3.8rem);line-height:1.08;letter-spacing:-.05em;font-weight:500;color:#26231d}
.ig-showcase-heading h2 em{font-family:Georgia,serif;font-weight:400;color:#7b6e58}
.ig-heading-copy{max-width:560px;margin:17px auto 0;font-size:15px;line-height:1.75;color:#777365}
.ig-profile-card{background:#fffdf8;border:1px solid #e7dfcf;border-radius:22px;overflow:hidden;box-shadow:0 22px 60px rgba(47,42,29,.065)}
.ig-profile-topline{min-height:52px;padding:0 clamp(18px,3.5vw,34px);display:flex;align-items:center;gap:10px;border-bottom:1px solid #eee7da;color:#8c877a;font-size:9px;letter-spacing:1.35px;font-weight:700}
.ig-live-dot{flex:0 0 7px;width:7px;height:7px;border-radius:50%;background:#83745b;box-shadow:0 0 0 4px #f0ece4}
.ig-profile-topline>a{display:inline-flex;align-items:center;gap:6px;margin-left:auto;white-space:nowrap;color:#766850;text-decoration:none}
.ig-profile-main{display:grid;grid-template-columns:180px minmax(0,1fr);gap:clamp(28px,5vw,62px);align-items:center;padding:clamp(30px,4.5vw,52px) clamp(25px,6vw,72px) 42px}
.ig-avatar-ring{width:150px;height:150px;padding:5px;display:grid;place-items:center;border-radius:50%;background:conic-gradient(from 210deg,#b38a4a,#e4d7b7,#81735b,#b38a4a);text-decoration:none;justify-self:center;box-shadow:0 8px 24px rgba(104, 91, 69,.12)}
.ig-avatar-inner{width:100%;height:100%;display:grid;place-items:center;border-radius:50%;background:#f7f3ea;border:4px solid #fffdf8;overflow:hidden}
.ig-profile-logo{width:77%;height:77%;object-fit:contain;display:block}
.ig-profile-info{min-width:0;text-align:left}
.ig-username-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ig-username-row h3{margin:0;font-size:clamp(23px,2.8vw,30px);font-weight:550;letter-spacing:-.9px;color:#29251f}
.ig-profile-label{padding:6px 9px;border-radius:5px;background:#f0ecdf;color:#77704e;font-size:8px;font-weight:700;letter-spacing:1px}
.ig-value-line{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:16px 0 18px;padding:0 0 16px;border-bottom:1px solid #eee7da;color:#777365;font-size:11px;line-height:1.5}.ig-value-line i{width:3px;height:3px;flex:0 0 3px;border-radius:50%;background:#b38a4a}
.ig-bio-block{max-width:590px}
.ig-bio-name{margin:0 0 5px;color:#312d26;font-size:14px;font-weight:750;line-height:1.6}
.ig-bio-name span{font-weight:500;color:#777365}
.ig-bio{margin:0;color:#615f54;font-size:13px;line-height:1.85;overflow-wrap:anywhere}
.ig-bio strong{display:inline-block;margin-top:3px;color:#584d3a;font-size:13px;font-weight:700}
.ig-bio-link{display:inline-flex;align-items:center;gap:7px;margin-top:12px;color:#7b6c53;font-size:12px;font-weight:650;text-decoration:none;overflow-wrap:anywhere}
.ig-profile-cta{display:flex;width:max-content;max-width:100%;align-items:center;justify-content:center;gap:10px;margin-top:18px;padding:12px 16px;border-radius:8px;background:#2a2721;color:#f9f5eb;text-decoration:none;font-size:12px;font-weight:650;transition:transform .2s,background .2s}
.ig-profile-cta:hover{transform:translateY(-2px);background:#5a4f3d}
.ig-divider{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 clamp(24px,5vw,64px);padding:19px 0;border-top:1px solid #eae3d6;color:#8b8578;font-size:9px;font-weight:700;letter-spacing:1.35px}
.ig-divider span:first-child{color:#6b5e48}
.ig-highlights-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:14px;padding:22px clamp(25px,4vw,52px) 34px}
.ig-highlight{min-width:0;text-align:center;text-decoration:none;color:#333328;display:flex;flex-direction:column;align-items:center;transition:transform .22s}
.ig-highlight:hover{transform:translateY(-4px)}
.ig-highlight-orbit{width:clamp(74px,8vw,92px);aspect-ratio:1;border-radius:50%;padding:4px;display:grid;place-items:center;position:relative;border:1px solid #d9cfb8;background:#fbf8f0;transition:box-shadow .2s,border-color .2s}
.ig-highlight:hover .ig-highlight-orbit{border-color:#b38a4a;box-shadow:0 0 0 4px rgba(179,138,74,.11)}
.ig-highlight-icon{width:100%;height:100%;border-radius:50%;display:grid;place-items:center;background:#ebe5d5;color:#625744}
.ig-highlight-index{position:absolute;right:-1px;bottom:0;width:22px;height:22px;display:grid;place-items:center;border:2px solid #fffdf8;border-radius:50%;background:#2b2822;color:#f8f3e8;font-size:8px;font-weight:700}
.ig-highlight strong{margin-top:11px;font-size:12px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}
.ig-highlight small{margin-top:4px;font-size:10px;line-height:1.5;color:#918a7a}
.ig-tone-ivory .ig-highlight-icon{background:#f2eddf;color:#766850}.ig-tone-sage .ig-highlight-icon{background:#e9e3da;color:#635742}.ig-tone-gold .ig-highlight-icon{background:#f1e3c9;color:#98723b}.ig-tone-charcoal .ig-highlight-icon{background:#312d27;color:#e8d8b3}.ig-tone-taupe .ig-highlight-icon{background:#e8dfd0;color:#77705e}
.ig-card-bottom{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:19px clamp(24px,5vw,64px);border-top:1px solid #eee7da;background:#fbf8f1;color:#8b8578;font-size:9px;letter-spacing:1.35px;font-weight:700}
.ig-card-bottom>a{display:inline-flex;align-items:center;gap:7px;color:#74664e;text-decoration:none}
.ig-section-footnote{margin:16px 0 0;text-align:center;color:#8d8779;font-size:11px;line-height:1.7}
@media(max-width:900px){.ig-highlights-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:22px 12px}}
@media(max-width:760px){.ig-showcase-section{padding:64px 5vw}.ig-showcase-heading{margin-bottom:30px}.ig-profile-topline{padding:0 16px;font-size:8px;letter-spacing:.8px}.ig-profile-main{grid-template-columns:1fr;gap:23px;padding:28px 22px 30px;text-align:center}.ig-avatar-ring{width:126px;height:126px}.ig-profile-info{text-align:center}.ig-username-row{justify-content:center}.ig-value-line{justify-content:center;gap:8px;margin:15px 0;padding-bottom:14px}.ig-bio-block{margin:0 auto}.ig-bio{font-size:12px}.ig-bio-link{justify-content:center}.ig-profile-cta{margin:17px auto 0}.ig-divider{margin:0 20px;font-size:8px;letter-spacing:.8px}.ig-highlights-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:22px 8px;padding:20px 16px 27px}.ig-highlight-orbit{width:clamp(62px,16vw,80px)}.ig-highlight strong{font-size:11px}.ig-highlight small{display:none}.ig-card-bottom{padding:17px 20px;font-size:8px;letter-spacing:.8px}}
@media(max-width:440px){.ig-highlights-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:20px 8px}.ig-profile-topline{gap:8px}.ig-profile-topline>a{font-size:0}.ig-profile-topline>a svg{width:16px;height:16px}.ig-value-line{font-size:10px;gap:7px}.ig-card-bottom{align-items:flex-start;flex-direction:column}.ig-divider span:last-child{max-width:45%;text-align:right;line-height:1.5}}
@media(prefers-reduced-motion:reduce){.ig-highlight,.ig-profile-cta,.ig-highlight-orbit{transition:none}}


/* Premium editorial motion layer — calm, purposeful and accessible */
.hero{isolation:isolate}
.hero:before{content:"";position:absolute;inset:0;pointer-events:none;z-index:-1;background:radial-gradient(ellipse at 74% 40%,rgba(184,151,94,.11),transparent 34%),linear-gradient(110deg,rgba(255,255,255,.32),transparent 62%)}
.hero-title-premium{max-width:760px;letter-spacing:-.055em;line-height:1.035}
.hero-title-premium em{display:inline-flex;align-items:baseline;white-space:normal;color:#7d7059;font-style:normal;font-weight:400}
.typewriter-word{position:relative;display:inline-block;min-width:5.5ch;color:#7b6d55}
.typewriter-caret{display:inline-block;width:2px;height:.78em;margin-left:3px;vertical-align:-.02em;background:#b38a4a;animation:typeCaret 850ms steps(2,end) infinite}
@keyframes typeCaret{0%,45%{opacity:1}46%,100%{opacity:0}}
.hero-title-premium em{transition:color .35s ease}
.hero-right{perspective:1200px}
.restaurant-card{transform:translateZ(0);transition:transform .65s cubic-bezier(.2,.7,.2,1),box-shadow .65s ease;box-shadow:0 28px 85px rgba(33,29,20,.12)}
.hero-right:hover .restaurant-card{transform:translateY(-5px) rotateX(1deg);box-shadow:0 38px 100px rgba(33,29,20,.16)}
.floating-note{backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 16px 42px rgba(35,30,20,.1)}
.hero-scroll i{animation:scrollNudge 1.8s ease-in-out infinite}
@keyframes scrollNudge{0%,100%{transform:translateY(0);opacity:.5}55%{transform:translateY(7px);opacity:1}}
.reveal{transform:translate3d(0,22px,0);transition:opacity .8s cubic-bezier(.2,.65,.2,1),transform .8s cubic-bezier(.2,.65,.2,1)}
.reveal.visible{transform:translate3d(0,0,0)}
.product-tab,.feature-card,.usecase-card,.faq-item,.ig-profile-card{transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s ease,border-color .35s ease}
.product-tab:hover,.feature-card:hover,.usecase-card:hover{transform:translateY(-3px)}
/* Ask Pratyeksha: compact, calm, editorial assistant with a clear conversational hierarchy */
.chat-launcher{right:24px;bottom:24px;padding:7px 17px 7px 7px;border:1px solid rgba(179,138,74,.35);background:rgba(33, 30, 26,.96);box-shadow:0 14px 44px rgba(25,25,18,.22);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);transition:transform .28s ease,box-shadow .28s ease,border-color .28s ease}
.chat-launcher:hover{transform:translateY(-3px) scale(1.015);box-shadow:0 22px 56px rgba(25,25,18,.28);border-color:rgba(179,138,74,.7)}
.chat-launcher-icon{width:43px;height:43px;background:#e5d5b5;color:#2a2721;box-shadow:none;transition:transform .35s ease,background .35s ease}
.chat-launcher:hover .chat-launcher-icon{transform:rotate(-7deg);background:#f0e5ce}
.chat-launcher-copy small{font-family:'DM Sans',sans-serif;letter-spacing:.16em;color:#d6c49f}
.chat-launcher-copy strong{font-size:12px;letter-spacing:-.01em}
.chat-panel{right:24px;bottom:86px;width:min(430px,calc(100vw - 32px));height:min(720px,calc(100dvh - 112px));border:1px solid rgba(179,138,74,.24);border-radius:24px;background:#fbf8f1;box-shadow:0 34px 100px rgba(22,22,16,.26);overflow:hidden;transform:translateY(16px) scale(.985);transform-origin:bottom right;transition:opacity .28s ease,transform .35s cubic-bezier(.2,.8,.2,1),visibility .28s ease}
.chat-header{padding:20px 19px 17px;background:#24211c;gap:13px}
.chat-agent-mark{width:45px;height:45px;border-radius:15px;background:#e6d7b7;color:#353028;box-shadow:none}
.chat-agent-title span{font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:.17em;color:#c4b28d}
.chat-agent-title strong{font-size:16px;letter-spacing:-.025em;font-weight:550}
.chat-agent-title small{margin-top:5px;color:rgba(248,243,232,.64);font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0;line-height:1.4}
.chat-close{border-radius:12px;width:36px;height:36px;background:rgba(255,255,255,.045)}
.chat-trust{padding:10px 18px;background:#f1ecdf;color:#716b58;font-family:'DM Sans',sans-serif;font-size:10px;line-height:1.45;letter-spacing:0}
.chat-topic-bar{padding:11px 15px;background:#fbf8f1;gap:7px}
.chat-topic-bar button{border-radius:999px;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0;transition:background .2s ease,border-color .2s ease,color .2s ease}
.chat-topic-bar button.active{background:#332e26;color:#f7f2e8;border-color:#332e26;box-shadow:none}
.chat-messages{padding:20px 17px 12px;background:radial-gradient(circle at 100% 0,rgba(219,205,174,.2),transparent 33%),#fbf8f1}
.chat-message-row{gap:9px;margin-bottom:16px;animation:chatMessageIn .28s ease both}
@keyframes chatMessageIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
.chat-mini-mark{width:25px;height:25px;flex-basis:25px;border-radius:9px;background:#e6d8b9;color:#3d382e}
.chat-message-stack{max-width:88%}
.chat-answer-heading{gap:8px;margin:0 2px 7px}
.chat-answer-heading span{width:26px;height:26px;border-radius:9px;background:#e6d8b9;color:#353028;box-shadow:none}
.chat-answer-heading strong{font-size:11px;font-weight:650;color:#433d34;letter-spacing:-.01em}
.chat-bubble{padding:13px 15px;border:1px solid #eae3d5;border-radius:17px 17px 17px 5px;background:#fffefa;color:#37372e;font:400 12.5px/1.72 'DM Sans',sans-serif;box-shadow:0 5px 16px rgba(43,39,28,.025);white-space:pre-line}
.chat-message-row.user .chat-bubble{border:1px solid #37322a;background:#37322a;color:#faf6ec;border-radius:17px 17px 5px 17px;box-shadow:none}
.chat-meta{margin:6px 4px 0;color:#99917f;font:400 9px/1.4 'DM Sans',sans-serif;letter-spacing:.01em}
.chat-escalation{border-color:#e4d7bd;background:#f5efe2;border-radius:16px;padding:13px}
.chat-suggestions-wrap{padding:12px 15px 13px;background:#f7f2e8;border-top:1px solid #ece4d5;max-height:180px}
.chat-suggestion-label{margin-bottom:9px}
.chat-suggestion-label span{font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:.11em;color:#786c57}
.chat-suggestion-label small{font-size:9px;color:#9a927f}
.chat-suggestions{gap:7px}
.chat-suggestions button{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #e8dfce;border-radius:12px;background:#fffdf8;color:#4a493d;font:500 10px/1.35 'DM Sans',sans-serif;box-shadow:0 2px 5px rgba(50,43,29,.02);transition:transform .2s ease,border-color .2s ease,background .2s ease}
.chat-suggestions button:hover{transform:translateY(-1px);border-color:#c8b58b;background:#fff}
.chat-suggestions button span{width:25px;height:25px;flex:0 0 25px;border-radius:8px;background:#f0eadb;color:#7b6e58}
.chat-suggestions button b{font-weight:550;flex:1}
.chat-input-wrap{margin:0 14px 9px;padding:7px 8px 7px 12px;border:1px solid #e4dac7;border-radius:15px;background:#fffefa;box-shadow:0 5px 18px rgba(44,35,23,.035)}
.chat-input-wrap:focus-within{border-color:#a99b72;box-shadow:0 0 0 3px rgba(169,155,114,.12)}
.chat-input-wrap input{font:400 12px/1.4 'DM Sans',sans-serif;color:#342f28}
.chat-input-wrap input::placeholder{color:#a19a89}
.chat-input-wrap button{width:36px;height:36px;border-radius:11px;background:#332e26;color:#f7f2e8;transition:transform .2s ease,background .2s ease}
.chat-input-wrap button:not(:disabled):hover{transform:translateX(2px);background:#6a5e48}
.chat-footer-row{padding:0 17px 13px;background:#fbf8f1;color:#928a79;font:400 8px/1.5 'DM Sans',sans-serif;letter-spacing:0}
.chat-footer-row button{color:#6f624b;font:600 9px/1.4 'DM Sans',sans-serif}
@media(max-width:640px){
 .hero-title-premium{font-size:clamp(2.7rem,12vw,4.1rem);letter-spacing:-.06em}
 .hero-title-premium em{display:inline}
 .typewriter-word{min-width:0}
 .chat-launcher{right:14px;bottom:calc(84px + env(safe-area-inset-bottom));padding:6px;border-radius:50%}
 .chat-launcher-copy{display:none}
 .chat-launcher-icon{width:47px;height:47px}
 .chat-panel{right:8px;bottom:calc(142px + env(safe-area-inset-bottom));width:calc(100vw - 16px);height:min(680px,calc(100dvh - 160px - env(safe-area-inset-bottom)));border-radius:22px}
 .chat-header{padding:15px 15px 14px}
 .chat-suggestions-wrap{max-height:150px}
 .chat-suggestions{grid-template-columns:1fr 1fr}
 .chat-bubble{font-size:12px;line-height:1.65}
}
@media(prefers-reduced-motion:reduce){
 .typewriter-caret{animation:none;opacity:1}
 .hero-scroll i{animation:none}
 .restaurant-card,.product-tab,.feature-card,.usecase-card,.chat-message-row{transition:none;animation:none}
 .hero-right:hover .restaurant-card{transform:none}
}


/* V2 art direction: tactile editorial, kinetic type, clear contrast and owner-first storytelling */
:root{--px-ink:#221f19;--px-ivory:#faf7ef;--px-paper:#f1eadb;--px-olive:#70624a;--px-gold:#b38a4a;--px-muted:#a9a28f}
html{scroll-behavior:smooth;scroll-padding-top:86px}
::selection{background:#d7c49b;color:#221f19}
.hero{min-height:min(900px,100svh);background:radial-gradient(ellipse at 78% 36%,rgba(179,138,74,.13),transparent 30%),linear-gradient(135deg,#faf7ef 0%,#f7f1e4 58%,#eee5d2 100%)}
.hero-title-premium{font-size:clamp(3.65rem,7.4vw,7.2rem);max-width:850px;line-height:.98;letter-spacing:-.075em;font-weight:500}
.hero-title-premium em{color:#70624a;background:linear-gradient(100deg,#635741,#8d7e65,#635741);background-size:180% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:oliveShimmer 7s ease-in-out infinite}
@keyframes oliveShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.hero-description{max-width:600px;font-size:clamp(15px,1.3vw,18px);line-height:1.85;letter-spacing:-.015em}
.hero-eyebrow,.eyebrow{font-size:10px;letter-spacing:.2em;font-weight:650}
.button{border-radius:999px!important;min-height:52px;padding-inline:24px!important;transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s ease,background .3s ease!important}
.button.primary{box-shadow:0 9px 24px rgba(39, 35, 28,.13)}
.button.primary:hover{transform:translateY(-3px);box-shadow:0 17px 34px rgba(39, 35, 28,.19)}
.button.secondary:hover{transform:translateY(-3px)}
.restaurant-card{border:1px solid rgba(179,138,74,.22);border-radius:28px;overflow:hidden;animation:cardArrive 1.1s cubic-bezier(.2,.75,.2,1) both;box-shadow:0 34px 100px rgba(45,39,24,.14)}
@keyframes cardArrive{from{opacity:0;transform:translateY(24px) rotateY(-5deg) scale(.97)}to{opacity:1;transform:translateY(0) rotateY(0) scale(1)}}
.hero-orbit{animation:orbitDrift 12s ease-in-out infinite alternate}
.orbit-b{animation-delay:-5s;animation-duration:16s}
@keyframes orbitDrift{from{transform:translate3d(-7px,5px,0) rotate(-3deg)}to{transform:translate3d(10px,-10px,0) rotate(4deg)}}
.hero-meta>div{transition:transform .3s ease,color .3s ease}.hero-meta>div:hover{transform:translateY(-4px)}
/* Section two: enforce readable white-on-charcoal contrast on every content surface */
.product-section{position:relative;isolation:isolate;background:#221f19!important;color:#faf7ef!important;padding-block:clamp(84px,10vw,150px)!important}
.product-section:before{content:"";position:absolute;z-index:-1;inset:0;pointer-events:none;background:radial-gradient(ellipse at 83% 13%,rgba(179,138,74,.13),transparent 31%),linear-gradient(120deg,rgba(255,255,255,.025),transparent 50%)}
.product-section:after{content:"P";position:absolute;right:-.04em;top:-.22em;z-index:-1;font:italic 500 clamp(22rem,49vw,58rem)/1 Georgia,serif;color:rgba(250,247,239,.025);pointer-events:none}
.product-section,.product-section *{box-sizing:border-box}
.product-section .section-head h2,.product-section .section-head h2 *,.product-section h1,.product-section h2,.product-section h3,.product-section h4,.product-section .product-tab strong,.product-section .product-copy-top h3{color:#faf7ef!important}
.product-section p,.product-section .section-head p,.product-section .product-copy-top p,.product-section .feature-list,.product-section .feature-list>div{color:rgba(250,247,239,.74)!important}
.product-section .eyebrow{color:#c9ad76!important}
.product-section .section-head{align-items:end;gap:42px;margin-bottom:28px}
.product-section .section-head h2{max-width:800px;font:500 clamp(2.7rem,5.8vw,5.6rem)/.98 Georgia,'Times New Roman',serif;letter-spacing:-.06em;text-wrap:balance}
.product-section .section-head h2 em{font-weight:400;color:#d6c49e!important}
.product-section .section-head p{max-width:410px;font-size:14px;line-height:1.9}
.owner-pressure-line{display:flex;flex-wrap:wrap;gap:9px;margin:28px 0 26px}
.owner-pressure-line span{display:inline-flex;align-items:center;gap:9px;padding:10px 13px;border:1px solid rgba(250,247,239,.13);border-radius:999px;color:rgba(250,247,239,.7);font:500 10px/1.3 'DM Sans',sans-serif;letter-spacing:.015em;background:rgba(255,255,255,.025)}
.owner-pressure-line i{width:5px;height:5px;flex:0 0 5px;border-radius:50%;background:#c6a96e;box-shadow:0 0 0 4px rgba(198,169,110,.1)}
.product-tabs{gap:10px!important;margin-bottom:24px!important}
.product-tab{position:relative;overflow:hidden;min-height:116px!important;padding:18px!important;border:1px solid rgba(250,247,239,.12)!important;border-radius:17px!important;background:rgba(255,255,255,.035)!important;color:#faf7ef!important;backdrop-filter:blur(12px);transition:transform .4s cubic-bezier(.2,.8,.2,1),background .35s ease,border-color .35s ease,box-shadow .35s ease!important}
.product-tab:before{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;transform:scaleX(0);transform-origin:left;background:linear-gradient(90deg,#b38a4a,#e3d2ac);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.product-tab:hover{transform:translateY(-5px)!important;border-color:rgba(211,190,143,.45)!important;background:rgba(255,255,255,.065)!important}
.product-tab.active{background:linear-gradient(145deg,rgba(179,138,74,.18),rgba(255,255,255,.055))!important;border-color:rgba(211,190,143,.55)!important;box-shadow:0 15px 40px rgba(0,0,0,.13)!important}
.product-tab.active:before{transform:scaleX(1)}
.product-tab-number{color:#d4bd8b!important;font-size:10px!important;letter-spacing:.13em}
.product-tab-icon{color:#d4bd8b!important}
.product-detail{gap:clamp(30px,6vw,90px)!important;align-items:center}
.product-copy-top h3{font:500 clamp(2.5rem,4.5vw,4.7rem)/1 Georgia,'Times New Roman',serif!important;letter-spacing:-.055em!important;text-wrap:balance}
.product-copy-top p{font-size:15px!important;line-height:1.9!important;max-width:540px}
.feature-list>div{border-bottom:1px solid rgba(250,247,239,.1);padding:12px 0!important;transition:padding-left .25s ease,color .25s ease}
.feature-list>div:hover{padding-left:6px!important;color:#fff!important}
.feature-list>div svg{color:#cbb27d!important}
.product-nav button{width:43px!important;height:43px!important;border:1px solid rgba(250,247,239,.22)!important;background:rgba(255,255,255,.04)!important;color:#faf7ef!important;transition:background .25s ease,transform .25s ease,border-color .25s ease!important}
.product-nav button:hover{transform:translateY(-2px);background:#c5a66b!important;color:#221f19!important;border-color:#c5a66b!important}
.product-counter{color:rgba(250,247,239,.6)!important;letter-spacing:.15em}
.product-visual-wrap{filter:drop-shadow(0 24px 55px rgba(0,0,0,.19));animation:visualFloat 7s ease-in-out infinite}
@keyframes visualFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
/* Editorial hierarchy and tactile interaction throughout */
section:not(.hero):not(.product-section){scroll-margin-top:80px}
.section-heading h2,.module-copy h2,.signature-heading h2,.command-heading h2,.demo-copy h2{font-family:Georgia,'Times New Roman',serif!important;font-weight:500!important;letter-spacing:-.055em!important;line-height:1.03!important;text-wrap:balance}
.section-heading h2 em,.module-copy h2 em{font-weight:400!important}
.use-card,.module-card,.feature-card,.faq-item,.ig-profile-card{transform:translateZ(0);transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease,border-color .4s ease!important}
.use-card:hover,.module-card:hover,.feature-card:hover,.ig-profile-card:hover{transform:translateY(-6px)!important;box-shadow:0 20px 50px rgba(25,25,18,.12)!important}
.module-section .module-copy h2{font-size:clamp(2.8rem,5.3vw,5.2rem)!important}
.module-section .module-eyebrow,.section-number{letter-spacing:.17em}
.reveal{transition:opacity .85s cubic-bezier(.2,.7,.2,1),transform .85s cubic-bezier(.2,.7,.2,1),filter .85s ease!important;filter:blur(0)}
.reveal:not(.visible){filter:blur(2px)}
.delay-1{transition-delay:.08s!important}.delay-2{transition-delay:.16s!important}.delay-3{transition-delay:.24s!important}.delay-4{transition-delay:.32s!important}
.site a:focus-visible,.site button:focus-visible,.site input:focus-visible,.site textarea:focus-visible{outline:2px solid #b38a4a!important;outline-offset:4px!important}
@media(max-width:760px){.hero{min-height:auto;padding-bottom:88px}.hero-title-premium{font-size:clamp(3.2rem,12.5vw,5.4rem)}.product-section{padding-block:76px!important}.product-section .section-head{display:block}.product-section .section-head h2{font-size:clamp(2.8rem,11vw,4.3rem)}.product-section .section-head p{margin-top:20px}.owner-pressure-line{gap:7px;margin:23px 0}.owner-pressure-line span{font-size:9px;padding:9px 11px}.product-tab{min-height:92px!important;padding:13px!important}.product-tab strong{font-size:10px!important}.product-detail{gap:28px!important}.product-copy-top h3{font-size:clamp(2.7rem,10vw,4rem)!important}.product-visual-wrap{animation:none}}
@media(max-width:430px){.owner-pressure-line span{width:100%;border-radius:11px}.product-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}.product-tab:last-child{grid-column:1/-1}.product-tab{min-height:82px!important}.hero-title-premium{letter-spacing:-.07em}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.hero-title-premium em,.restaurant-card,.hero-orbit,.product-visual-wrap{animation:none!important}.reveal{filter:none!important;transition:none!important}.product-tab,.button,.use-card,.module-card{transition:none!important}}


/* V3 — signature hero, owner-first conversion, crisp contrast, no blurred content */
.hero{
  position:relative;isolation:isolate;overflow:hidden;min-height:min(960px,calc(100svh - 60px));
  background:#f8f4ea!important;
  background-image:radial-gradient(ellipse at 76% 30%,rgba(194,166,112,.2),transparent 31%),radial-gradient(ellipse at 12% 94%,rgba(119, 104, 79,.10),transparent 30%),linear-gradient(125deg,#fbf8f1 0%,#f5efdf 55%,#e9dfca 100%)!important;
}
.hero:before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.24;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.88' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E");mix-blend-mode:multiply}
.hero:after{content:"HOSPITALITY, IN HARMONY";position:absolute;right:clamp(20px,4vw,64px);top:50%;writing-mode:vertical-rl;transform:translateY(-50%);font:500 9px/1 'DM Sans',sans-serif;letter-spacing:.28em;color:rgba(54, 49, 40,.45);pointer-events:none}
.hero-left{position:relative;z-index:2;padding-top:clamp(68px,8.8vw,128px);padding-bottom:clamp(78px,9vw,128px);max-width:920px}
.hero-eyebrow{display:inline-flex;align-items:center;gap:11px;padding:10px 14px;border:1px solid rgba(57, 52, 43,.13);border-radius:999px;background:rgba(255,255,255,.43);backdrop-filter:blur(12px);font-size:9px!important;letter-spacing:.19em!important;color:#5b5b49!important}
.hero-eyebrow>span{width:7px;height:7px;border-radius:50%;background:#918268;box-shadow:0 0 0 4px rgba(145, 130, 104,.15);animation:heroPulse 2.6s ease-in-out infinite}
@keyframes heroPulse{0%,100%{box-shadow:0 0 0 3px rgba(145, 130, 104,.12)}50%{box-shadow:0 0 0 7px rgba(145, 130, 104,.02)}}
.hero-title-premium{max-width:940px!important;margin:27px 0 25px!important;font-family:'DM Serif Display',Georgia,serif!important;font-size:clamp(3.8rem,7.4vw,7.6rem)!important;font-weight:400!important;line-height:.91!important;letter-spacing:-.065em!important;text-wrap:balance;position:relative}
.hero-title-premium em{display:inline-block;min-height:1.04em;padding-right:.07em;font-family:'DM Serif Display',Georgia,serif!important;font-weight:400!important;font-style:italic;background:linear-gradient(105deg,#6d5f48 2%,#9b8b5d 48%,#645741 88%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:oliveShimmer 8s ease-in-out infinite}
.hero-description{max-width:610px!important;font-size:clamp(15px,1.22vw,17px)!important;line-height:1.85!important;color:#625d50!important}
.hero-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:30px}
.hero-actions .button.primary{background:#2c2821!important;color:#faf6ec!important;border:1px solid #2c2821!important;box-shadow:0 12px 28px rgba(37, 33, 27,.16)!important}
.hero-actions .button.primary:hover{background:#474033!important;box-shadow:0 20px 44px rgba(37, 33, 27,.2)!important}
.hero-actions .button.secondary{border:1px solid rgba(46, 42, 34,.2)!important;background:rgba(255,255,255,.38)!important;color:#312d26!important}
.hero-cta-note{margin-top:17px;color:#797260!important;font-size:11px!important;letter-spacing:.01em;display:flex;align-items:center;gap:7px}
.hero-cta-note svg{color:#8b754a}
.hero-proofline{display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin-top:35px;color:#66614f;font:500 10px/1.4 'DM Sans',sans-serif;letter-spacing:.025em}
.hero-proofline i{width:3px;height:3px;border-radius:50%;background:#b39a66}
.hero-proof-dot{width:6px;height:6px;border-radius:50%;background:#90826a;box-shadow:0 0 0 4px rgba(144, 130, 106,.12)}
.hero-meta{border-top:1px solid rgba(44,44,32,.13);max-width:580px;margin-top:34px;padding-top:19px;gap:clamp(22px,4vw,55px)!important}
.hero-meta>div strong{font-family:'DM Serif Display',Georgia,serif!important;font-size:26px!important;font-weight:400!important;color:#70644e!important}
.hero-meta>div span{font-size:9px!important;letter-spacing:.13em!important;text-transform:uppercase;color:#77705f!important}
.hero-right{position:relative;z-index:1;perspective:1400px;isolation:isolate}
.hero-glow{background:radial-gradient(ellipse,rgba(185,157,100,.25),rgba(185,157,100,0) 68%)!important;filter:blur(8px)}
.restaurant-card{border:1px solid rgba(255,255,255,.56)!important;border-radius:26px!important;background:linear-gradient(145deg,rgba(255,254,248,.92),rgba(242,235,219,.88))!important;box-shadow:0 38px 100px rgba(48,43,29,.15),inset 0 1px 0 rgba(255,255,255,.9)!important;backdrop-filter:blur(22px);transform-style:preserve-3d;transition:transform .65s cubic-bezier(.2,.8,.2,1),box-shadow .65s ease!important}
.restaurant-top{border-bottom:1px solid rgba(45,45,33,.1)!important;padding:23px 24px 18px!important}
.restaurant-top small{font:500 8px/1.4 'DM Sans',sans-serif!important;letter-spacing:.18em!important;color:#8b8068!important}
.restaurant-top .live{background:rgba(125, 109, 82,.1)!important;color:#685b45!important;border:1px solid rgba(125, 109, 82,.2);border-radius:999px;padding:7px 10px;font-size:8px;letter-spacing:.12em}
.table-scene{background:radial-gradient(ellipse at 50% 45%,rgba(199,162,105,.18),transparent 48%),linear-gradient(145deg,#eee4cf,#f8f4e9)!important;min-height:250px!important}
.table-circle{box-shadow:0 22px 55px rgba(55,45,28,.16)!important;border:1px solid rgba(255,255,255,.7)!important}
.scene-label{background:rgba(255,253,247,.82)!important;border:1px solid rgba(255,255,255,.7);border-radius:12px;padding:10px 13px!important;box-shadow:0 10px 30px rgba(50,43,30,.08);backdrop-filter:blur(12px)}
.scene-label span{color:#8a7b5d!important;letter-spacing:.17em!important}
.scene-label strong{color:#333327!important}
.restaurant-stats{gap:8px!important;padding:15px 19px!important}
.restaurant-stats>div{background:rgba(255,255,255,.48);border:1px solid rgba(48,48,35,.07);border-radius:12px;padding:11px 9px!important;min-width:0}
.restaurant-stats small{color:#8a806b!important;font-size:8px!important;letter-spacing:.12em!important}
.restaurant-stats strong{display:flex;align-items:center;gap:5px;color:#584e3d!important;font-size:11px!important;font-weight:600!important;white-space:nowrap}
.restaurant-stats strong svg{color:#9d8754}
.mini-order{margin:0 18px 18px!important;border:1px solid rgba(67, 60, 48,.1)!important;border-radius:14px!important;background:rgba(255,255,255,.54)!important;box-shadow:none!important;padding:13px!important}
.mini-order strong{color:#353129!important;font-size:11px!important}.mini-order span{color:#7a725f!important;font-size:10px!important}
.floating-note{border:1px solid rgba(255,255,255,.76)!important;background:rgba(255,253,247,.78)!important;backdrop-filter:blur(22px)!important;border-radius:17px!important;box-shadow:0 20px 48px rgba(43,39,26,.13)!important;animation:floatNote 6.5s ease-in-out infinite}
.note-two{animation-delay:-3.2s}
@keyframes floatNote{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(.6deg)}}
.hero-scroll{color:#756d5b!important;letter-spacing:.2em!important}
.hero-scroll i{background:#8b805f!important}
/* Remove the blur state that made section two appear out of focus during reveal */
.reveal,.reveal:not(.visible),.product-section .reveal,.product-section .reveal:not(.visible){filter:none!important;-webkit-filter:none!important;backdrop-filter:none!important}
.reveal:not(.visible){opacity:.98!important}
.reveal.visible{opacity:1!important;filter:none!important;-webkit-filter:none!important}
.product-section{filter:none!important;-webkit-filter:none!important;backdrop-filter:none!important;transform:none!important}
.product-section *{text-shadow:none}
.product-section .product-visual-wrap{filter:drop-shadow(0 24px 55px rgba(0,0,0,.19))!important;-webkit-filter:drop-shadow(0 24px 55px rgba(0,0,0,.19))!important}
/* A considered conversion section: ink backdrop, ivory form, no generic white SaaS card */
.demo-section{position:relative;isolation:isolate;overflow:hidden;background:#27241e!important;color:#f8f3e8!important;padding-block:clamp(90px,10vw,150px)!important}
.demo-section:before{content:"";position:absolute;z-index:-1;inset:0;pointer-events:none;background:radial-gradient(ellipse at 8% 22%,rgba(179,138,74,.16),transparent 33%),radial-gradient(ellipse at 90% 95%,rgba(143, 126, 98,.13),transparent 35%),linear-gradient(120deg,rgba(255,255,255,.018),transparent 50%)}
.demo-section:after{content:"THE NEXT SERVICE, BETTER CONNECTED";position:absolute;top:42px;right:clamp(22px,6vw,96px);font:500 8px/1 'DM Sans',sans-serif;letter-spacing:.24em;color:rgba(246,239,222,.27);pointer-events:none}
.demo-grid{align-items:start!important;gap:clamp(36px,7vw,110px)!important;position:relative;z-index:1}
.demo-copy{position:sticky;top:120px;padding-top:12px}
.demo-copy .eyebrow{color:#c6ad79!important;letter-spacing:.22em!important}
.demo-overline{margin:20px 0 12px;color:#c6ad79;font:500 9px/1.5 'DM Sans',sans-serif;letter-spacing:.18em}
.demo-copy h2{font-family:'DM Serif Display',Georgia,serif!important;font-size:clamp(3.4rem,6.3vw,6.4rem)!important;line-height:.94!important;letter-spacing:-.065em!important;font-weight:400!important;color:#faf6eb!important}
.demo-copy h2 em{color:#d7c49b!important;font-weight:400!important}
.demo-copy>p{max-width:480px!important;color:rgba(248,243,232,.68)!important;font-size:14px!important;line-height:1.9!important}
.demo-benefit-list{margin-top:35px;max-width:510px;border-top:1px solid rgba(248,243,232,.13)}
.demo-benefit-list>div{display:flex;align-items:flex-start;gap:15px;padding:16px 0;border-bottom:1px solid rgba(248,243,232,.1)}
.demo-benefit-list>div>span{padding-top:2px;color:#c6ad79;font:400 12px/1 'DM Mono',monospace}
.demo-benefit-list p{margin:0;display:grid;gap:5px}
.demo-benefit-list strong{color:#f7f1e4;font:500 12px/1.4 'DM Sans',sans-serif}
.demo-benefit-list small{color:rgba(248,243,232,.57);font:400 11px/1.65 'DM Sans',sans-serif}
.demo-section .contact-details{margin-top:28px;gap:11px}
.demo-section .contact-details a{color:rgba(248,243,232,.77)!important}
.demo-section .contact-details a>span{border-color:rgba(248,243,232,.16)!important;background:rgba(255,255,255,.035)!important;color:#d5c08e!important}
.demo-form-wrap{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.72)!important;border-radius:28px!important;padding:clamp(22px,3.3vw,43px)!important;background:linear-gradient(145deg,#fffdf7 0%,#f4eddd 100%)!important;color:#2a2721!important;box-shadow:0 35px 95px rgba(0,0,0,.23),inset 0 1px 0 #fff!important}
.demo-form-wrap:before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#635741,#b38a4a,#d8c69d,#635741);background-size:220% 100%;animation:formAccentFlow 9s linear infinite}
@keyframes formAccentFlow{to{background-position:220% 0}}
.demo-form-wrap form{position:relative;z-index:1}
.form-top{display:flex!important;align-items:center!important;gap:13px!important;margin-bottom:27px!important;padding-bottom:22px!important;border-bottom:1px solid rgba(44,43,32,.12)!important}
.form-heading-mark{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border-radius:15px;background:#e8dfca;color:#6f624c;border:1px solid rgba(111, 98, 76,.12)}
.form-heading-copy{display:grid;gap:4px;min-width:0;flex:1}
.form-heading-copy small{color:#8b7c5d!important;font:600 8px/1.3 'DM Sans',sans-serif!important;letter-spacing:.17em!important}
.form-heading-copy strong{color:#2a2721;font:400 23px/1.15 'DM Serif Display',Georgia,serif;letter-spacing:-.035em}
.form-heading-copy>span{color:#89816f;font:400 10px/1.4 'DM Sans',sans-serif}
.form-step{display:flex;align-items:center;gap:7px;color:#8d826a;font:500 9px/1 'DM Mono',monospace;letter-spacing:.08em;white-space:nowrap}
.form-step i{width:20px;height:1px;background:#c7a269;display:block}
.form-grid{gap:18px!important}
.form-grid label>span:first-child{display:block;margin-bottom:8px!important;color:#5b594a!important;font:600 9px/1.4 'DM Sans',sans-serif!important;letter-spacing:.08em!important;text-transform:uppercase}
.form-grid input,.form-grid select,.form-grid textarea{width:100%;min-height:49px;border:1px solid rgba(55,54,40,.13)!important;border-radius:12px!important;background:rgba(255,255,255,.66)!important;color:#2a2721!important;padding:13px 14px!important;font:400 12px/1.5 'DM Sans',sans-serif!important;box-shadow:inset 0 1px 2px rgba(42,39,29,.025)!important;transition:border-color .25s ease,box-shadow .25s ease,background .25s ease,transform .25s ease!important}
.form-grid input::placeholder,.form-grid textarea::placeholder{color:#a29a87!important;opacity:1}
.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus{outline:none!important;border-color:#91836b!important;background:#fffdf8!important;box-shadow:0 0 0 4px rgba(137, 120, 91,.13)!important;transform:translateY(-1px)}
.form-grid textarea{min-height:112px;resize:vertical}
.form-grid select{appearance:auto;cursor:pointer}
.form-privacy-notice{padding:12px 14px!important;margin:20px 0 14px!important;border-left:2px solid #b59a64!important;background:rgba(225,215,193,.28)!important;color:#77705f!important;font:400 10px/1.7 'DM Sans',sans-serif!important}
.form-privacy-notice strong{color:#555443!important;font-weight:600}
.form-consent{align-items:flex-start!important;gap:10px!important;color:#77705f!important;font:400 10px/1.7 'DM Sans',sans-serif!important}
.form-consent input{margin-top:3px;accent-color:#6c5e47;flex:0 0 auto}
.form-consent button{color:#695b44!important;text-decoration:underline;text-underline-offset:3px}
.submit-button{width:100%!important;min-height:56px!important;margin-top:19px!important;padding:15px 19px!important;border:1px solid #302b23!important;border-radius:14px!important;background:#302b23!important;color:#faf6ec!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:15px!important;font:500 12px/1.3 'DM Sans',sans-serif!important;letter-spacing:.01em!important;box-shadow:0 10px 22px rgba(40, 36, 29,.13)!important;transition:transform .25s ease,box-shadow .25s ease,background .25s ease!important}
.submit-button:hover{transform:translateY(-2px)!important;background:#4a4234!important;box-shadow:0 16px 30px rgba(40, 36, 29,.2)!important}
.submit-button svg{transition:transform .25s ease}.submit-button:hover svg{transform:translateX(4px)}
.form-note{display:flex!important;align-items:flex-start;gap:7px;justify-content:center;margin:13px 0 0!important;color:#89816f!important;font:400 10px/1.65 'DM Sans',sans-serif!important;text-align:center}
.form-note svg{flex:0 0 auto;margin-top:1px;color:#918268}
.demo-form-wrap .success-state{padding:36px 8px;text-align:center;color:#2a2721}
.demo-form-wrap .success-state h3{font:400 clamp(2rem,4vw,3rem)/1.05 'DM Serif Display',Georgia,serif;color:#2a2721}
.demo-form-wrap .success-state p{color:#77705f;line-height:1.8}
@media(min-width:1000px){.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(400px,.9fr);align-items:center}.hero-left{padding-right:0}.hero-right{width:100%;max-width:660px;justify-self:end;padding:50px clamp(28px,5vw,80px) 50px 25px}.restaurant-card{max-width:530px;margin-inline:auto}.floating-note.note-one{left:-2%;top:22%}.floating-note.note-two{right:1%;bottom:15%}}
@media(max-width:999px){.hero{display:flex;flex-direction:column;align-items:stretch}.hero-left{padding:70px clamp(22px,6vw,58px) 26px}.hero-right{width:min(100%,680px);margin:0 auto;padding:18px 30px 80px}.hero-title-premium{font-size:clamp(3.8rem,10vw,6.5rem)!important}.demo-copy{position:relative;top:auto}.demo-grid{grid-template-columns:1fr!important}.demo-copy{max-width:760px}.demo-benefit-list{max-width:700px}.demo-form-wrap{max-width:780px;width:100%;margin-inline:auto}}
@media(max-width:620px){.hero:after{display:none}.hero-left{padding-top:55px}.hero-title-premium{font-size:clamp(3.25rem,13.5vw,5rem)!important;line-height:.94!important;letter-spacing:-.07em!important}.hero-description{font-size:14px!important;line-height:1.8!important}.hero-actions{align-items:stretch;flex-direction:column}.hero-actions .button{width:100%;justify-content:center}.hero-proofline{gap:8px;margin-top:25px;font-size:9px}.hero-meta{margin-top:25px;gap:18px!important}.hero-meta>div strong{font-size:22px!important}.hero-meta>div span{font-size:8px!important}.hero-right{padding-inline:18px;padding-bottom:72px}.restaurant-top{padding:17px!important}.table-scene{min-height:205px!important}.restaurant-stats{padding:10px!important;gap:5px!important}.restaurant-stats>div{padding:9px 6px!important}.restaurant-stats small{font-size:7px!important}.restaurant-stats strong{font-size:9px!important;gap:3px}.restaurant-stats strong svg{width:12px;height:12px}.floating-note{transform:scale(.86)}.demo-section{padding-block:72px!important}.demo-section:after{display:none}.demo-copy h2{font-size:clamp(3.2rem,13vw,4.6rem)!important}.demo-benefit-list{margin-top:25px}.demo-form-wrap{padding:22px 17px!important;border-radius:22px!important}.form-top{gap:10px!important}.form-heading-mark{width:39px;height:39px;flex-basis:39px;border-radius:13px}.form-heading-copy strong{font-size:20px}.form-heading-copy small{font-size:7px!important}.form-step{font-size:8px}.form-grid{grid-template-columns:1fr!important;gap:15px!important}.form-grid label.full{grid-column:auto!important}.form-grid input,.form-grid select,.form-grid textarea{min-height:48px}.form-privacy-notice{font-size:9px!important}.form-consent{font-size:9px!important}}
@media(prefers-reduced-motion:reduce){.hero-eyebrow>span,.floating-note,.demo-form-wrap:before{animation:none!important}.hero-title-premium em{animation:none!important}.submit-button,.form-grid input,.form-grid select,.form-grid textarea{transition:none!important}}

/* Signature refinement: measured type, warm beige accents, and a more considered demo experience. */
.hero-left{max-width:790px!important;padding-right:clamp(28px,4.2vw,68px)!important}
.hero-title-premium{font-size:clamp(2.85rem,5.15vw,5.15rem)!important;line-height:1.015!important;letter-spacing:-.052em!important;max-width:660px!important;margin:24px 0 20px!important;color:#2d2d25!important}
.hero-title-premium em{color:#b8a27b!important;background:linear-gradient(105deg,#9f8960 0%,#c6b18a 48%,#a58e64 100%)!important;background-size:160% 100%!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;font-style:italic!important;animation:beigeGlimmer 9s ease-in-out infinite!important}
@keyframes beigeGlimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.hero-description{max-width:540px!important;font-size:clamp(13px,1.05vw,15px)!important;line-height:1.82!important;color:#696253!important}
.hero-cta-note{font-size:10px!important;color:#81745c!important}
.hero-proofline{margin-top:27px!important;font-size:9px!important;color:#77705f!important;gap:9px!important}
.hero-meta{margin-top:27px!important;padding-top:15px!important;max-width:520px!important}
.hero-meta>div strong{font-size:22px!important;color:#ad9871!important}
.hero-meta>div span{font-size:8px!important;color:#817967!important}
.hero-actions{margin-top:25px!important;gap:10px!important}
.hero-actions .button{min-height:44px!important;padding-inline:18px!important;font-size:11px!important;letter-spacing:.015em!important;border-radius:999px!important}
.hero-eyebrow{font-size:8px!important;letter-spacing:.16em!important;color:#75684f!important}
/* Preserve the original right-side restaurant visual and its layout. */
.hero-right .restaurant-card,.hero-right .floating-note,.hero-right .hero-orbit{will-change:transform}
.demo-section{padding-block:clamp(76px,8.4vw,118px)!important}
.demo-grid{grid-template-columns:minmax(0,.88fr) minmax(440px,1.12fr)!important;gap:clamp(34px,6vw,88px)!important;max-width:1320px!important;margin-inline:auto!important;padding-inline:clamp(22px,5vw,76px)!important}
.demo-copy{max-width:465px!important}
.demo-overline{font-size:8px!important;letter-spacing:.16em!important;margin:16px 0 12px!important;color:#c9b58a!important}
.demo-copy h2{font-size:clamp(2.75rem,4.5vw,4.5rem)!important;line-height:1.015!important;letter-spacing:-.045em!important;margin:16px 0 20px!important;max-width:470px!important}
.demo-copy h2 em{color:#c8b38a!important}
.demo-copy>p{font-size:13px!important;line-height:1.85!important;max-width:430px!important;color:rgba(248,243,232,.72)!important}
.demo-benefit-list{margin-top:27px!important}
.demo-benefit-list>div{padding:13px 0!important;gap:13px!important;transition:padding-left .25s ease,border-color .25s ease}
.demo-benefit-list>div:hover{padding-left:5px!important;border-bottom-color:rgba(198,173,121,.35)!important}
.demo-benefit-list>div>span{font-size:10px!important;color:#cbb78b!important}
.demo-benefit-list strong{font-size:11px!important}
.demo-benefit-list small{font-size:10px!important;line-height:1.6!important}
.demo-form-wrap{max-width:690px!important;border-radius:23px!important;padding:clamp(23px,3vw,36px)!important;background:linear-gradient(145deg,#fbf8ef 0%,#f0e7d4 100%)!important;border:1px solid rgba(255,255,255,.76)!important;box-shadow:0 28px 75px rgba(0,0,0,.22),0 1px 0 rgba(255,255,255,.8) inset!important;transform:translateZ(0);transition:transform .4s ease,box-shadow .4s ease!important}
.demo-form-wrap:hover{box-shadow:0 34px 86px rgba(0,0,0,.25),0 1px 0 rgba(255,255,255,.9) inset!important}
.demo-form-wrap:after{content:"Pratyeksha  /  PRIVATE DEMO";position:absolute;right:24px;bottom:13px;color:rgba(94,88,70,.33);font:500 7px/1 'DM Sans',sans-serif;letter-spacing:.16em;pointer-events:none}
.form-top{margin-bottom:22px!important;padding-bottom:18px!important;gap:12px!important}
.form-heading-mark{width:40px!important;height:40px!important;flex-basis:40px!important;border-radius:13px!important;background:linear-gradient(145deg,#eee4cd,#e2d5b8)!important;color:#8b754d!important}
.form-heading-copy small{font-size:7px!important;letter-spacing:.19em!important;color:#8e7a57!important}
.form-heading-copy strong{font-size:21px!important;letter-spacing:-.025em!important;color:#302f26!important}
.form-heading-copy>span{font-size:9px!important;color:#817966!important}
.form-step{font-size:8px!important;color:#98896c!important}
.form-grid{column-gap:13px!important;row-gap:15px!important}
.form-grid label>span:first-child{font-size:8px!important;letter-spacing:.12em!important;color:#68614f!important;margin-bottom:7px!important}
.form-grid input,.form-grid select,.form-grid textarea{min-height:45px!important;border-radius:10px!important;padding:11px 13px!important;background:rgba(255,255,255,.62)!important;border-color:rgba(63,58,43,.15)!important;font-size:11px!important;color:#302f26!important}
.form-grid textarea{min-height:94px!important}
.form-grid input:hover,.form-grid select:hover,.form-grid textarea:hover{border-color:rgba(154,130,84,.52)!important;background:rgba(255,255,255,.82)!important}
.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus{border-color:#b49b6d!important;box-shadow:0 0 0 3px rgba(180,155,109,.15)!important}
.form-privacy-notice{font-size:9px!important;line-height:1.65!important;margin:16px 0 12px!important;padding:11px 13px!important;border-radius:0 9px 9px 0!important;background:rgba(222,211,188,.25)!important}
.form-consent{font-size:9px!important;line-height:1.65!important}
.submit-button{min-height:51px!important;border-radius:11px!important;margin-top:15px!important;padding-inline:16px!important;font-size:11px!important;letter-spacing:.025em!important;background:#2c2822!important}
.form-note{font-size:9px!important;margin-top:10px!important}
.demo-section .contact-details{gap:9px!important;margin-top:24px!important}
.demo-section .contact-details a{font-size:10px!important;gap:9px!important}
.demo-section .contact-details a>span{width:31px!important;height:31px!important;border-radius:10px!important}
@media(max-width:999px){.hero-title-premium{font-size:clamp(3rem,7.3vw,5rem)!important}.demo-grid{grid-template-columns:1fr!important;max-width:820px!important}.demo-copy{max-width:700px!important}.demo-copy h2{font-size:clamp(2.9rem,7vw,4.2rem)!important}.demo-form-wrap{max-width:780px!important}}
@media(max-width:620px){.hero-left{padding:56px 22px 22px!important}.hero-title-premium{font-size:clamp(2.65rem,10.6vw,3.7rem)!important;line-height:1.02!important;letter-spacing:-.052em!important;margin:21px 0 17px!important}.hero-description{font-size:13px!important;line-height:1.78!important}.hero-actions .button{font-size:10px!important}.hero-proofline{font-size:8px!important}.demo-grid{padding-inline:0!important;gap:28px!important}.demo-copy h2{font-size:clamp(2.65rem,10vw,3.7rem)!important}.demo-copy>p{font-size:12px!important}.demo-form-wrap{padding:21px 16px 27px!important;border-radius:19px!important}.form-heading-copy strong{font-size:19px!important}.form-step{gap:4px!important}.form-step i{width:12px!important}.form-grid{grid-template-columns:1fr!important}.form-grid label.full{grid-column:auto!important}.demo-form-wrap:after{right:16px;font-size:6px}}
@media(prefers-reduced-motion:reduce){.hero-title-premium em{animation:none!important}.demo-form-wrap,.demo-benefit-list>div{transition:none!important}}

/* Warm-ink signature surfaces: bring the hero product preview and demo form back to Pratyeksha's olive/charcoal identity. */
.hero-right .restaurant-card{
  background:linear-gradient(145deg,#2d2923 0%,#23211c 58%,#312c24 100%)!important;
  border:1px solid rgba(205,180,124,.34)!important;
  box-shadow:0 38px 100px rgba(29, 26, 21,.25),inset 0 1px 0 rgba(255,246,220,.08)!important;
  color:#f6efdf!important;
}
.hero-right .restaurant-top{border-bottom-color:rgba(236,223,193,.13)!important}
.hero-right .restaurant-top small{color:#c9b78e!important}
.hero-right .restaurant-top .live{background:rgba(163, 144, 111,.12)!important;color:#dcceb7!important;border-color:rgba(187, 167, 133,.3)!important}
.hero-right .restaurant-top .restaurant-brand-image{filter:none!important;opacity:1!important;background:#f4ecdc!important;border:1px solid rgba(205,180,124,.28)!important;border-radius:7px!important;padding:4px 7px!important;object-fit:contain!important;box-shadow:0 5px 18px rgba(0,0,0,.16)!important}
.hero-right .table-scene{
  background:radial-gradient(ellipse at 50% 42%,rgba(181,145,81,.24),transparent 42%),linear-gradient(145deg,#463f32 0%,#302c24 58%,#38332a 100%)!important;
  border-top:1px solid rgba(224,201,153,.08)!important;border-bottom:1px solid rgba(224,201,153,.12)!important;
}
.hero-right .table-circle{background:radial-gradient(circle at 35% 25%,#685e4c,#383227 72%)!important;border:1px solid rgba(210,185,125,.38)!important;box-shadow:0 24px 60px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,246,220,.12)!important}
.hero-right .dish{background:radial-gradient(circle at 35% 30%,#f1e6cd,#c6b58f 62%,#8d7955 100%)!important;border-color:rgba(255,246,221,.48)!important;box-shadow:0 8px 18px rgba(0,0,0,.25)!important}
.hero-right .glass{border-color:rgba(233,218,180,.55)!important;background:linear-gradient(135deg,rgba(255,255,255,.22),rgba(202,178,125,.06))!important}
.hero-right .scene-label{background:rgba(34, 31, 26,.88)!important;border-color:rgba(212,188,133,.28)!important;box-shadow:0 12px 32px rgba(0,0,0,.22)!important}
.hero-right .scene-label span{color:#d0b77f!important}
.hero-right .scene-label strong{color:#f6efdf!important}
.hero-right .restaurant-stats>div{background:rgba(255,255,255,.035)!important;border-color:rgba(235,220,185,.11)!important}
.hero-right .restaurant-stats small{color:#bcb39b!important}
.hero-right .restaurant-stats strong{color:#eee5d0!important}
.hero-right .restaurant-stats strong svg{color:#c8ab70!important}
.hero-right .mini-order{background:rgba(255,255,255,.045)!important;border-color:rgba(235,220,185,.12)!important}
.hero-right .mini-order strong{color:#f4eddf!important}
.hero-right .mini-order span{color:#c5bca6!important}
.hero-right .mini-icon{background:rgba(185,154,96,.15)!important;color:#d4b778!important;border-color:rgba(198,169,112,.22)!important}
.hero-right .mini-arrow{color:#d4b778!important}
.hero-right .floating-note{background:linear-gradient(145deg,rgba(51, 47, 39,.97),rgba(36, 33, 28,.97))!important;border-color:rgba(205,180,124,.32)!important;box-shadow:0 20px 48px rgba(0,0,0,.28)!important;color:#f3ead5!important}
.hero-right .floating-note small{color:#c9b27b!important}
.hero-right .floating-note strong,.hero-right .floating-note span{color:#f3ead5!important}
.hero-right .floating-note>svg{color:#d1b477!important}
.hero-right .hero-orbit{border-color:rgba(181,145,81,.24)!important}
.hero-right .hero-glow{background:radial-gradient(ellipse,rgba(166,139,82,.2),rgba(166,139,82,0) 70%)!important}

/* Demo form: an editorial dark-olive booking panel, not a plain white card. */
.demo-form-wrap{
  position:relative!important;isolation:isolate!important;overflow:hidden!important;
  background:radial-gradient(ellipse at 100% 0%,rgba(181,145,81,.16),transparent 35%),linear-gradient(145deg,#343029 0%,#29251f 52%,#23211c 100%)!important;
  color:#f6efdf!important;border:1px solid rgba(203,177,119,.32)!important;
  border-radius:25px!important;box-shadow:0 32px 90px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,246,220,.07)!important;
  padding:clamp(24px,3.2vw,40px)!important;transition:transform .4s ease,box-shadow .4s ease,border-color .4s ease!important;
}
.demo-form-wrap:before{height:2px!important;background:linear-gradient(90deg,transparent,#a78b54 20%,#e0cc9e 50%,#a78b54 80%,transparent)!important;background-size:180% 100%!important}
.demo-form-wrap:after{color:rgba(230,214,176,.35)!important;bottom:15px!important;right:25px!important}
.demo-form-wrap:hover{transform:translateY(-3px)!important;border-color:rgba(213,187,128,.5)!important;box-shadow:0 40px 100px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,246,220,.08)!important}
.demo-form-wrap .form-top{border-bottom-color:rgba(239,226,194,.15)!important}
.demo-form-wrap .form-heading-mark{background:linear-gradient(145deg,#50483b,#3d372d)!important;border-color:rgba(210,184,125,.24)!important;color:#d6bc80!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important}
.demo-form-wrap .form-heading-copy small{color:#c9b27b!important}
.demo-form-wrap .form-heading-copy strong{color:#f7f0e1!important}
.demo-form-wrap .form-heading-copy>span{color:#bdb49f!important}
.demo-form-wrap .form-step{color:#c7b78f!important}
.demo-form-wrap .form-step i{background:#b89a5f!important}
.demo-form-wrap .form-grid label>span:first-child{color:#d9cfb7!important}
.demo-form-wrap .form-grid input,.demo-form-wrap .form-grid select,.demo-form-wrap .form-grid textarea{
  color:#f6efdf!important;background:rgba(17, 16, 13,.28)!important;border:1px solid rgba(225,209,169,.19)!important;
  border-radius:11px!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.12)!important;
}
.demo-form-wrap .form-grid input::placeholder,.demo-form-wrap .form-grid textarea::placeholder{color:#a9a28e!important;opacity:1!important}
.demo-form-wrap .form-grid input:hover,.demo-form-wrap .form-grid select:hover,.demo-form-wrap .form-grid textarea:hover{background:rgba(17, 16, 13,.42)!important;border-color:rgba(207,178,117,.45)!important}
.demo-form-wrap .form-grid input:focus,.demo-form-wrap .form-grid select:focus,.demo-form-wrap .form-grid textarea:focus{background:rgba(17, 16, 13,.5)!important;border-color:#c7aa6d!important;box-shadow:0 0 0 3px rgba(199,170,109,.16)!important}
.demo-form-wrap .form-grid select option{background:#2d2923!important;color:#f6efdf!important}
.demo-form-wrap .form-privacy-notice{color:#cfc5ac!important;background:rgba(190,161,103,.09)!important;border-left-color:#b89a5f!important}
.demo-form-wrap .form-consent,.demo-form-wrap .form-consent label,.demo-form-wrap .form-note{color:#bdb49f!important}
.demo-form-wrap .form-consent a,.demo-form-wrap .form-note a{color:#dfc58a!important;text-decoration-color:rgba(223,197,138,.4)!important}
.demo-form-wrap .form-consent input[type="checkbox"]{accent-color:#c5a66a!important}
.demo-form-wrap .field-error{color:#e8a99a!important}
.demo-form-wrap .submit-button{background:linear-gradient(105deg,#c6ad78,#e0cc9c)!important;color:#27241f!important;border:1px solid rgba(255,239,199,.38)!important;box-shadow:0 10px 24px rgba(0,0,0,.18)!important;font-weight:600!important;transition:transform .25s ease,filter .25s ease,box-shadow .25s ease!important}
.demo-form-wrap .submit-button:hover{filter:brightness(1.06)!important;transform:translateY(-2px)!important;box-shadow:0 14px 28px rgba(0,0,0,.24)!important}
.demo-form-wrap .success-state{color:#f6efdf!important}
.demo-form-wrap .success-state h3{color:#f6efdf!important}
.demo-form-wrap .success-state p{color:#c8c0ad!important}
.demo-form-wrap .success-icon{background:rgba(197,166,106,.14)!important;color:#dec58b!important;border:1px solid rgba(197,166,106,.28)!important}
@media(max-width:620px){.demo-form-wrap{padding:23px 17px 30px!important}.demo-form-wrap:after{right:16px!important;font-size:6px!important}.hero-right .restaurant-card{border-radius:21px!important}}
@media(prefers-reduced-motion:reduce){.hero-right .floating-note,.demo-form-wrap:before{animation:none!important}.demo-form-wrap,.demo-form-wrap .submit-button{transition:none!important}}


/* ===== Landing hero redesign (final layer) ===== */
.nav .desktop-nav button{color:#4a4436!important}
.nav .desktop-nav button:hover,.nav .desktop-nav button.active{color:#1b1812!important}
.nav .desktop-nav .nav-demo{color:#f7f1e4!important}
main .hero{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);align-items:center;gap:clamp(8px,3vw,48px)}
main .hero:after{display:none}
main .hero-right{background:transparent!important;min-height:0!important;padding:112px clamp(16px,4vw,64px) 80px 0;overflow:visible}
main .hero-left{min-height:0!important;padding:132px 0 80px clamp(24px,6vw,96px)!important}
main .hero-eyebrow{display:inline-flex!important;width:fit-content;max-width:100%;align-items:center;gap:9px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.6);border:1px solid rgba(112, 98, 74,.22);color:#635640}
main .hero-eyebrow span{width:7px;height:7px;border-radius:50%;background:#8a7755;flex:0 0 auto;animation:heroLive 1.8s ease-out infinite}
@keyframes heroLive{0%{box-shadow:0 0 0 0 rgba(138, 119, 85,.55)}70%,100%{box-shadow:0 0 0 8px rgba(138, 119, 85,0)}}
main .hero-title-premium{font-size:clamp(2.7rem,6.2vw,6rem);line-height:1.02}
main .hero-right .restaurant-card{width:100%;max-width:430px;margin-inline:auto;position:relative;background:linear-gradient(160deg,#25231b,#14130f)!important;border:1px solid rgba(220,193,145,.22)!important;box-shadow:0 40px 90px rgba(33,29,20,.28)!important;border-radius:26px!important;overflow:hidden;color:#f4ecdc}
main .hero-right .restaurant-card small{color:#c8ad7b!important}
main .hero-right .restaurant-card strong{color:#f6efdf!important}
main .hero-right .restaurant-top .live{background:rgba(212, 181, 127,.12)!important;color:#e0c9a2!important;border-color:rgba(212, 181, 127,.28)!important}
main .hero-right .restaurant-card{justify-content:flex-start!important}
main .hero-right .hero-orbit,main .hero-right .hero-glow{opacity:.55}
.hero-feed,.hero-feed *{text-align:left}
.hero-feed{margin:0!important;flex:0 0 auto!important;display:flex;flex-direction:column;gap:8px;padding:14px 18px;min-height:176px}
.hero-feed-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);animation:heroFeedIn .5s cubic-bezier(.2,.8,.3,1) both}
.hero-feed-row:nth-child(2){opacity:.75}.hero-feed-row:nth-child(3){opacity:.5}
@keyframes heroFeedIn{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}
.hero-feed-tag{flex:0 0 auto;min-width:64px;text-align:center;font:600 9px/1 'DM Mono',monospace;letter-spacing:.12em;padding:6px 8px;border-radius:999px;background:rgba(211,191,162,.16);color:#e6d6bb}
.k-new .hero-feed-tag{background:rgba(212, 181, 127,.16);color:#e0c9a2}
.k-alert .hero-feed-tag{background:rgba(240,170,90,.18);color:#f3b873}
.k-bill .hero-feed-tag{background:rgba(120,170,240,.16);color:#a9c9f5}
.hero-feed-txt{align-items:flex-start;display:flex;flex-direction:column;min-width:0;gap:2px}
.hero-feed-txt b{font:600 13px/1.2 'DM Sans',sans-serif;color:#f6efdf}
.hero-feed-txt small{font:400 11px/1.3 'DM Sans',sans-serif;color:rgba(244,236,220,.62)!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(max-width:900px){
  main .hero{grid-template-columns:1fr;gap:0}
  main .hero-left{padding:104px 20px 28px!important}
  main .hero-right{padding:0 16px 84px}
  main .hero-right .floating-note{display:none}
}
@media(prefers-reduced-motion:reduce){main .hero-eyebrow span,.hero-feed-row{animation:none!important}}

/* ===== Premium motion & polish layer ===== */
html{scroll-behavior:smooth}
.nav:not(.nav-scrolled) .desktop-nav button:not(.nav-demo){color:#4a4436!important}
.nav.nav-scrolled .desktop-nav button:not(.nav-demo){color:rgba(247,241,228,.78)!important}
.nav.nav-scrolled .desktop-nav button:not(.nav-demo):hover,.nav.nav-scrolled .desktop-nav button:not(.nav-demo).active{color:#fff!important}
.nav .desktop-nav .nav-demo{color:#f7f1e4!important}
.nav.nav-scrolled .desktop-nav .nav-demo{background:#e6d6bb!important;color:#14110c!important}
.nav{transition:background .45s ease,border-color .45s ease,box-shadow .45s ease,translate .5s cubic-bezier(.2,.8,.2,1)!important}
.nav.px-nav-hide{translate:0 -110%}
@keyframes pxUp{from{opacity:0;translate:0 34px;filter:blur(8px)}to{opacity:1;translate:0 0;filter:blur(0)}}
@keyframes pxFloat{0%,100%{translate:0 0}50%{translate:0 -10px}}
@keyframes pxShine{0%{left:-70%}60%,100%{left:140%}}
@keyframes pxLine{from{transform:scaleX(0)}to{transform:scaleX(1)}}
html.px-motion [data-px="out"]{opacity:0!important;filter:blur(7px)!important;translate:0 38px}
html.px-motion [data-px="in"]{opacity:1!important;filter:blur(0)!important;translate:0 0;transition:opacity .9s cubic-bezier(.2,.7,.2,1) var(--px-d,0ms),filter .9s cubic-bezier(.2,.7,.2,1) var(--px-d,0ms),translate .95s cubic-bezier(.2,.7,.2,1) var(--px-d,0ms)}
/* hero entrance on load */
main .hero-left>*{animation:pxUp 1s cubic-bezier(.2,.7,.2,1) both}
main .hero-left>*:nth-child(1){animation-delay:.05s}main .hero-left>*:nth-child(2){animation-delay:.18s}main .hero-left>*:nth-child(3){animation-delay:.32s}main .hero-left>*:nth-child(4){animation-delay:.46s}main .hero-left>*:nth-child(5){animation-delay:.58s}main .hero-left>*:nth-child(n+6){animation-delay:.7s}
main .hero-right .restaurant-card{transform:perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))!important;transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .4s ease!important;animation:pxFloat 7s ease-in-out infinite!important;will-change:transform}
main .hero-right .floating-note{animation:pxFloat 6s ease-in-out infinite!important}
main .hero-right .floating-note.note-two{animation-delay:-3s!important}
main .hero-right .hero-orbit{translate:0 var(--px-par,0px)}
/* buttons: shine sweep + magnetic ease */
.button{position:relative;overflow:hidden;transition:translate .25s cubic-bezier(.2,.7,.2,1),transform .3s ease,box-shadow .3s ease,background .3s ease!important}
.button.primary:after{content:"";position:absolute;top:0;bottom:0;left:-70%;width:45%;transform:skewX(-20deg);background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);animation:pxShine 3.8s ease-in-out infinite;pointer-events:none}
.button:active{transform:scale(.97)!important}
/* cards: soft lift + gold edge */
.use-card,.signature-card,.fusion-ticket,.module-visual,.product-tab{transition:transform .5s cubic-bezier(.2,.7,.2,1),box-shadow .5s ease,border-color .4s ease!important}
.use-card:hover,.signature-card:hover,.fusion-ticket:hover{transform:translateY(-8px)!important;box-shadow:0 28px 60px rgba(33,29,20,.16),0 0 0 1px rgba(184,151,94,.35)!important}
/* headings: gold hairline that draws in */
.section-heading:after,.module-number:after{content:"";display:block;width:54px;height:1px;margin-top:18px;background:linear-gradient(90deg,#b8975e,transparent);transform-origin:left;animation:pxLine 1.2s .2s both}
.scroll-progress{background:linear-gradient(90deg,#b8975e,#e6d6bb)!important;height:3px!important}
::selection{background:rgba(184,151,94,.35)}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}main .hero-left>*,main .hero-right .restaurant-card,main .hero-right .floating-note,.button.primary:after,.section-heading:after,.module-number:after{animation:none!important}html.px-motion [data-px]{opacity:1!important;filter:none!important;translate:none!important}}

/* ===== Scroll animation + module visual refinements ===== */
.px-w{display:inline-block}
html.px-motion [data-px-h="out"] .px-w{opacity:0;translate:0 .55em;filter:blur(6px)}
html.px-motion [data-px-h="in"] .px-w{opacity:1;translate:0 0;filter:blur(0);transition:opacity .8s cubic-bezier(.2,.7,.2,1) calc(var(--wi)*55ms),translate .9s cubic-bezier(.2,.7,.2,1) calc(var(--wi)*55ms),filter .8s ease calc(var(--wi)*55ms)}
main .hero-left{opacity:calc(1 - var(--px-hp,0)*.85);translate:0 calc(var(--px-hp,0)*-46px)}
main .hero-right .restaurant-card{opacity:calc(1 - var(--px-hp,0)*.6)}
.module-visual{--px-p:0}
.module-visual .visual-window{translate:0 calc(var(--px-p)*-26px);will-change:translate}
.module-visual .visual-float.float-top{translate:0 calc(var(--px-p)*42px)}
.module-visual .visual-float.float-bottom{translate:0 calc(var(--px-p)*-52px)}
.visual-body{display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:10px;padding:18px!important;text-align:left}
.visual-top{display:flex;align-items:center;gap:12px}
.visual-top .visual-symbol{width:44px!important;height:44px!important;margin:0!important;flex:0 0 auto;display:grid;place-items:center}
.visual-top .visual-title{text-align:left!important;margin:0!important}
.visual-kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.visual-kpis div{padding:11px 12px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09)}
.visual-kpis small{display:block;font:500 9px/1.2 'DM Mono',monospace;letter-spacing:.1em;text-transform:uppercase;opacity:.65;margin-bottom:5px}
.visual-kpis b{font:700 1.15rem/1 'DM Sans',sans-serif;color:#f6efdf}
.visual-chart{display:flex;align-items:flex-end;gap:7px;height:54px;padding:6px 2px 0}
.visual-chart i{flex:1;height:var(--h);border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#d8bd8a,rgba(216,189,138,.25));transform-origin:bottom;transform:scaleY(.12);opacity:.5;transition:transform .9s cubic-bezier(.2,.7,.2,1) calc(var(--i)*70ms + 250ms),opacity .6s ease calc(var(--i)*70ms + 250ms)}
html:not(.px-motion) .visual-chart i,[data-px="in"] .visual-chart i{transform:none;opacity:1}
.visual-rows{display:flex;flex-direction:column;gap:7px}
.visual-rows span{display:flex;align-items:center;gap:9px;font:500 12px/1.2 'DM Sans',sans-serif;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.045)}
.visual-rows span i{width:6px;height:6px;border-radius:50%;background:#d9be8f;flex:0 0 auto;animation:fxBlink 1.6s ease-in-out infinite}
@media(prefers-reduced-motion:reduce){main .hero-left,main .hero-right .restaurant-card{opacity:1;translate:none}.module-visual .visual-window,.module-visual .visual-float{translate:none}.visual-chart i{transform:none;opacity:1;transition:none}html.px-motion [data-px-h] .px-w{opacity:1;translate:none;filter:none}}

`;
const NX_CSS = `
/* ═══════════════ NX — Pratyeksha landing, ink / gold / cream ═══════════════ */
.site{--nx-ink:#0d0b08;--nx-ink2:#14110c;--nx-panel:#1a160f;--nx-line:rgba(223,193,141,.16);--nx-line2:rgba(223,193,141,.3);--nx-cream:#f4ecdc;--nx-cream2:#ebe0ca;--nx-gold:#c7a269;--nx-gold2:#dfc18d;--nx-gold3:#a98248;--nx-text:#efe6d3;--nx-mute:#a99d86;--nx-dark:#201d17;--nx-gut:clamp(18px,5vw,56px);--nx-serif:'DM Serif Display',Georgia,serif;--nx-sans:'DM Sans',system-ui,sans-serif;--nx-mono:'DM Mono',ui-monospace,monospace;background:var(--nx-ink)!important;color:var(--nx-text)}
.site .nx-main{background:var(--nx-ink);overflow:clip}
.site .nx-main *,.site .nx-nav *,.site .nx-sheet *,.site .nx-footer *{max-width:none}
.site .nx-main img,.site .nx-nav img,.site .nx-footer img{max-width:100%}
.site .nx-wrap{width:min(1240px,calc(100% - var(--nx-gut)*2));margin:0 auto;position:relative}
.site .nx-main section[id]{scroll-margin-top:84px}
.site .nx-main h1,.site .nx-main h2,.site .nx-main h3,.site .nx-main h4,.site .nx-main p,.site .nx-main ul,.site .nx-main ol{margin:0;padding:0;list-style:none}
.site .nx-main button,.site .nx-footer button,.site .nx-nav button,.site .nx-sheet button{font-family:var(--nx-sans);cursor:pointer;-webkit-tap-highlight-color:transparent}
.site .nx-main :focus-visible,.site .nx-nav :focus-visible,.site .nx-footer :focus-visible,.site .nx-sheet :focus-visible{outline:2px solid var(--nx-gold2);outline-offset:3px;border-radius:6px}

/* reveal */
.site .nx-main .reveal{opacity:0;transform:translate3d(0,26px,0);filter:none!important;transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--i,0)*80ms)}
.site .nx-main .reveal:not(.visible){opacity:0!important}
.site .nx-main .reveal.visible{opacity:1!important;transform:none}
.site .nx-main .reveal.delay-1{transition-delay:.08s}.site .nx-main .reveal.delay-2{transition-delay:.16s}.site .nx-main .reveal.delay-3{transition-delay:.24s}.site .nx-main .reveal.delay-4{transition-delay:.32s}

/* ── nav ── */
.site .nx-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:900;display:flex;align-items:center;gap:6px;width:min(1080px,calc(100% - 24px));padding:8px 8px 8px 18px;border-radius:999px;background:rgba(20,17,12,.55);border:1px solid var(--nx-line);backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);transition:background .3s,border-color .3s,box-shadow .3s,top .3s}
.site .nx-nav.is-scrolled{background:rgba(13,11,8,.86);border-color:var(--nx-line2);box-shadow:0 14px 40px rgba(0,0,0,.5)}
.site .nx-brand{background:none;border:0;padding:0;display:flex;align-items:center;margin-right:auto}
.site .nx-brand-img{height:30px;width:auto;display:block;object-fit:contain}
.site .nx-links{display:flex;gap:2px}
.site .nx-links button{background:none;border:0;color:var(--nx-mute);font:500 .84rem/1 var(--nx-sans);padding:11px 15px;border-radius:999px;transition:color .2s,background .2s}
.site .nx-links button:hover{color:var(--nx-cream)}
.site .nx-links button.is-on{color:var(--nx-ink);background:var(--nx-gold2)}
.site .nx-cta{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:11px 18px;font:700 .82rem/1 var(--nx-sans);color:var(--nx-ink);background:linear-gradient(135deg,var(--nx-gold2),var(--nx-gold));margin-left:6px;transition:transform .2s,box-shadow .2s}
.site .nx-cta:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(199,162,105,.35)}
.site .nx-burger{display:none;background:rgba(223,193,141,.1);border:1px solid var(--nx-line);color:var(--nx-cream);width:42px;height:42px;border-radius:50%;align-items:center;justify-content:center}
.site .nx-sheet{position:fixed;inset:0;z-index:1200;background:radial-gradient(120% 70% at 80% 0%,rgba(199,162,105,.18),transparent 60%),var(--nx-ink);padding:22px var(--nx-gut) 28px;display:flex;flex-direction:column;opacity:0;visibility:hidden;transform:translateY(-12px);transition:opacity .3s,transform .3s,visibility .3s}
.site .nx-sheet.is-open{opacity:1;visibility:visible;transform:none}
.site .nx-sheet-x{align-self:flex-end;background:rgba(223,193,141,.1);border:1px solid var(--nx-line);color:var(--nx-cream);width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.site .nx-sheet-logo{height:34px;width:auto;margin:6px 0 18px;object-fit:contain;align-self:flex-start}
.site .nx-sheet-list{display:flex;flex-direction:column;flex:1;overflow:auto}
.site .nx-sheet-list button{display:flex;align-items:center;gap:14px;background:none;border:0;border-bottom:1px solid var(--nx-line);color:var(--nx-cream);font:400 clamp(1.5rem,7vw,2rem)/1.1 var(--nx-serif);padding:18px 2px;text-align:left;opacity:0;transform:translateY(10px);transition:opacity .4s,transform .4s;transition-delay:calc(var(--i)*40ms + 120ms)}
.site .nx-sheet.is-open .nx-sheet-list button{opacity:1;transform:none}
.site .nx-sheet-list button span{font:500 .7rem/1 var(--nx-mono);color:var(--nx-gold);letter-spacing:.12em}
.site .nx-sheet-list button svg{margin-left:auto;color:var(--nx-gold)}
.site .nx-sheet-foot{margin-top:16px;font:500 .68rem/1 var(--nx-mono);letter-spacing:.18em;color:var(--nx-mute);text-transform:uppercase}

/* ── shared type ── */
.site .nx-eyebrow{display:inline-flex;align-items:center;gap:10px;font:500 .7rem/1.2 var(--nx-mono);letter-spacing:.2em;text-transform:uppercase;color:var(--nx-gold)}
.site .nx-eyebrow::before{content:"";width:26px;height:1px;background:currentColor}
.site .nx-sec{padding:clamp(76px,11vw,148px) 0;position:relative}
.site .nx-head{max-width:820px;margin-bottom:clamp(32px,5vw,60px)}
.site .nx-head.is-center{margin-left:auto;margin-right:auto;text-align:center}
.site .nx-head.is-center .nx-eyebrow{justify-content:center}
.site .nx-head h2,.site .nx-mod h2,.site .nx-moment h2,.site .nx-faq-intro h2,.site .nx-journey-copy h2{font:400 clamp(2.15rem,5.6vw,4.4rem)/1.02 var(--nx-serif);letter-spacing:-.015em;color:var(--nx-cream);margin-top:18px}
.site .nx-main h2 em{font-style:italic;color:var(--nx-gold2);background:linear-gradient(100deg,var(--nx-gold2),var(--nx-gold) 55%,#f1dcae);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.site .nx-head p,.site .nx-mod-copy>p,.site .nx-moment p,.site .nx-faq-intro p,.site .nx-journey-copy>p{font:400 clamp(1rem,1.5vw,1.14rem)/1.7 var(--nx-sans);color:var(--nx-mute);margin-top:20px;max-width:640px}
.site .nx-head.is-center p{margin-left:auto;margin-right:auto}
.site .nx-split{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;max-width:none}
.site .nx-pill{display:inline-flex;align-items:center;gap:9px;padding:10px 16px;border-radius:999px;border:1px solid var(--nx-line2);font:500 .68rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-gold2);background:rgba(199,162,105,.07)}
.site .nx-pill i,.site .nx-live i{width:7px;height:7px;border-radius:50%;background:var(--nx-gold2);box-shadow:0 0 0 0 rgba(223,193,141,.6);animation:nxPulse 1.8s infinite}
@keyframes nxPulse{0%{box-shadow:0 0 0 0 rgba(223,193,141,.55)}70%{box-shadow:0 0 0 9px rgba(223,193,141,0)}100%{box-shadow:0 0 0 0 rgba(223,193,141,0)}}

/* ── hero ── */
.site .nx-hero{position:relative;min-height:100vh;min-height:100svh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);align-items:center;gap:clamp(24px,4vw,64px);padding:clamp(120px,16vh,170px) var(--nx-gut) clamp(60px,9vh,100px);max-width:1360px;margin:0 auto;overflow:visible}
.site .nx-hero-bg{position:absolute;inset:-10% -50vw 0;pointer-events:none;z-index:0;overflow:hidden}
.site .nx-hero-bg .glow{position:absolute;right:6%;top:6%;width:min(720px,70vw);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(199,162,105,.26),transparent 64%);filter:blur(10px)}
.site .nx-hero-bg .r1,.site .nx-hero-bg .r2,.site .nx-hero-bg .r3{position:absolute;right:calc(50vw - 640px + 4%);top:46%;border-radius:50%;border:1px solid rgba(223,193,141,.14);translate:50% -50%;max-width:none}
.site .nx-hero-bg .r1{width:520px;height:520px}.site .nx-hero-bg .r2{width:760px;height:760px;border-style:dashed;border-color:rgba(223,193,141,.1);animation:nxSpin 90s linear infinite}.site .nx-hero-bg .r3{width:1020px;height:1020px;border-color:rgba(223,193,141,.07)}
@keyframes nxSpin{to{rotate:360deg}}
.site .nx-hero-copy,.site .nx-stage,.site .nx-layers{position:relative;z-index:1}
.site .nx-kicker{display:inline-flex;align-items:center;gap:12px;font:500 .7rem/1.3 var(--nx-mono);letter-spacing:.2em;color:var(--nx-gold)}
.site .nx-kicker span{width:34px;height:1px;background:var(--nx-gold)}
.site .nx-h1{font:400 clamp(2.9rem,8.4vw,7.2rem)/.96 var(--nx-serif);letter-spacing:-.025em;color:var(--nx-cream);margin-top:22px}
.site .nx-h1 span{display:block}
.site .nx-h1 em{font-style:italic;color:var(--nx-gold2);white-space:normal}
.site .nx-h1 .typewriter-word{display:inline}
.site .nx-h1 .typewriter-caret{display:inline-block;width:3px;height:.8em;margin-left:5px;background:var(--nx-gold2);vertical-align:-.04em;animation:nxBlink 1s steps(1) infinite}
@keyframes nxBlink{50%{opacity:0}}
.site .nx-lead{font:400 clamp(1rem,1.5vw,1.18rem)/1.75 var(--nx-sans);color:var(--nx-mute);max-width:560px;margin-top:26px}
.site .nx-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px}
.site .nx-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:999px;padding:16px 26px;font:700 .92rem/1 var(--nx-sans);border:1px solid transparent;transition:transform .25s,box-shadow .25s,background .25s,border-color .25s}
.site .nx-btn.is-gold{color:var(--nx-ink);background:linear-gradient(135deg,var(--nx-gold2),var(--nx-gold));box-shadow:0 10px 34px rgba(199,162,105,.28)}
.site .nx-btn.is-gold:hover{transform:translateY(-2px);box-shadow:0 16px 44px rgba(199,162,105,.42)}
.site .nx-btn.is-ghost{color:var(--nx-cream);background:rgba(244,236,220,.04);border-color:var(--nx-line2)}
.site .nx-btn.is-ghost:hover{background:rgba(223,193,141,.12);border-color:var(--nx-gold)}
.site .nx-note{display:flex;align-items:center;gap:9px;margin-top:20px;font:400 .84rem/1.4 var(--nx-sans);color:var(--nx-mute)}
.site .nx-note svg{color:var(--nx-gold);flex:0 0 auto}
.site .nx-proof{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}
.site .nx-proof li{padding:8px 14px;border-radius:999px;border:1px solid var(--nx-line);font:500 .74rem/1 var(--nx-sans);color:var(--nx-text);background:rgba(244,236,220,.03)}
.site .nx-stage{--rx:0deg;--ry:0deg;perspective:1100px;display:flex;align-items:center;justify-content:center;min-height:clamp(430px,52vw,600px)}
.site .nx-plate{position:absolute;width:min(480px,100%);aspect-ratio:1;display:grid;place-items:center}
.site .nx-plate i{position:absolute;border-radius:50%;border:1px solid var(--nx-line2)}
.site .nx-plate i:nth-child(1){inset:0;background:radial-gradient(circle at 35% 30%,rgba(223,193,141,.16),rgba(223,193,141,.02) 60%)}
.site .nx-plate i:nth-child(2){inset:13%;border-style:dashed;animation:nxSpin 60s linear infinite reverse}
.site .nx-plate i:nth-child(3){inset:27%;background:rgba(13,11,8,.5)}
.site .nx-plate b{font:400 3rem/1 var(--nx-serif);color:rgba(223,193,141,.3)}
.site .nx-phone{position:relative;width:min(300px,78vw);padding:20px 18px 18px;border-radius:34px;background:linear-gradient(165deg,#241f16,#14110b 70%);border:1px solid var(--nx-line2);box-shadow:0 40px 90px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06);transform:rotateY(var(--ry)) rotateX(var(--rx));transition:transform .4s cubic-bezier(.2,.7,.2,1);animation:nxFloat 7s ease-in-out infinite}
@keyframes nxFloat{50%{translate:0 -10px}}
.site .nx-phone-top{display:flex;justify-content:space-between;align-items:center;font:500 .66rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-gold2);margin-bottom:16px}
.site .nx-live{display:inline-flex;align-items:center;gap:7px}
.site .nx-phone>small{display:block;font:500 .6rem/1 var(--nx-mono);letter-spacing:.18em;color:var(--nx-mute)}
.site .nx-phone-logo{height:30px;width:auto;margin:10px 0 14px;display:block;object-fit:contain}
.site .nx-phone .hero-feed{display:flex;flex-direction:column;gap:8px;margin:0}
.site .nx-phone .hero-feed-row{display:flex;align-items:center;gap:10px;padding:10px 11px;border-radius:14px;background:rgba(244,236,220,.045);border:1px solid var(--nx-line);animation:nxIn .5s both}
@keyframes nxIn{from{opacity:0;transform:translateY(8px)}}
.site .nx-phone .hero-feed-tag{font:600 .56rem/1 var(--nx-mono);letter-spacing:.1em;padding:5px 7px;border-radius:7px;background:rgba(223,193,141,.16);color:var(--nx-gold2);flex:0 0 auto}
.site .nx-phone .hero-feed-txt{display:flex;flex-direction:column;gap:3px;min-width:0}
.site .nx-phone .hero-feed-txt b{font:600 .8rem/1.1 var(--nx-sans);color:var(--nx-cream)}
.site .nx-phone .hero-feed-txt small{font:400 .7rem/1.2 var(--nx-sans);color:var(--nx-mute)}
.site .nx-phone-card{display:flex;align-items:center;gap:11px;margin-top:12px;padding:12px;border-radius:16px;background:linear-gradient(135deg,rgba(223,193,141,.2),rgba(199,162,105,.07));border:1px solid var(--nx-line2);color:var(--nx-gold2)}
.site .nx-phone-card>span{width:34px;height:34px;border-radius:11px;background:var(--nx-gold2);color:var(--nx-ink);display:grid;place-items:center;flex:0 0 auto}
.site .nx-phone-card div{display:flex;flex-direction:column;gap:3px;margin-right:auto}
.site .nx-phone-card strong{font:600 .8rem/1 var(--nx-sans);color:var(--nx-cream)}
.site .nx-phone-card small{font:400 .68rem/1 var(--nx-sans);color:var(--nx-mute)}
.site .nx-chip{position:absolute;display:flex;align-items:center;gap:10px;padding:11px 15px;border-radius:16px;background:rgba(20,17,12,.82);border:1px solid var(--nx-line2);backdrop-filter:blur(12px);color:var(--nx-gold2);box-shadow:0 18px 40px rgba(0,0,0,.45);animation:nxFloat 6s ease-in-out infinite}
.site .nx-chip small{display:block;font:500 .56rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute)}
.site .nx-chip b{display:block;font:600 .82rem/1.2 var(--nx-sans);color:var(--nx-cream);margin-top:4px}
.site .nx-chip.c1{left:-2%;top:12%;animation-delay:-1s}.site .nx-chip.c2{right:-2%;bottom:14%;animation-delay:-3s}.site .nx-chip.c3{left:2%;bottom:6%;animation-delay:-5s}
.site .nx-layers{grid-column:1/-1;display:flex;gap:clamp(18px,5vw,56px);padding-top:26px;border-top:1px solid var(--nx-line);margin-top:10px}
.site .nx-layers li{display:flex;align-items:baseline;gap:10px;font:500 .78rem/1 var(--nx-sans);letter-spacing:.1em;text-transform:uppercase;color:var(--nx-mute)}
.site .nx-layers b{font:400 1.7rem/1 var(--nx-serif);color:var(--nx-gold2);letter-spacing:0}
.site .nx-marquee{border-block:1px solid var(--nx-line);background:var(--nx-ink2);overflow:hidden;padding:20px 0}
.site .nx-marquee-track{display:flex;width:max-content;animation:nxMarq 38s linear infinite}
.site .nx-marquee span{font:400 clamp(1.5rem,3.6vw,2.6rem)/1 var(--nx-serif);color:transparent;-webkit-text-stroke:1px rgba(223,193,141,.5);padding:0 clamp(18px,3vw,36px);display:inline-flex;align-items:center;gap:clamp(18px,3vw,36px);letter-spacing:.04em}
.site .nx-marquee span i{font-style:normal;-webkit-text-stroke:0;color:var(--nx-gold);font-size:.6em}
@keyframes nxMarq{to{transform:translateX(-50%)}}

/* ── system ── */
.site .nx-system{background:radial-gradient(70% 50% at 100% 0%,rgba(199,162,105,.1),transparent 60%),var(--nx-ink)}
.site .nx-pains{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:clamp(30px,5vw,56px)}
.site .nx-pains li{display:inline-flex;align-items:center;gap:10px;padding:11px 16px;border-radius:999px;border:1px dashed var(--nx-line2);font:500 .84rem/1 var(--nx-sans);color:var(--nx-text)}
.site .nx-pains i{width:7px;height:7px;border-radius:2px;rotate:45deg;background:var(--nx-gold)}
.site .nx-product{display:grid;grid-template-columns:260px minmax(0,1fr);gap:clamp(18px,3vw,40px);align-items:start}
.site .nx-rail{display:flex;flex-direction:column;gap:8px;position:sticky;top:96px}
.site .nx-rail button{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;text-align:left;padding:16px 16px;border-radius:16px;border:1px solid var(--nx-line);background:rgba(244,236,220,.025);color:var(--nx-mute);transition:all .25s}
.site .nx-rail button:hover{border-color:var(--nx-line2);color:var(--nx-cream)}
.site .nx-rail button.is-on{background:linear-gradient(135deg,rgba(223,193,141,.18),rgba(199,162,105,.05));border-color:var(--nx-gold);color:var(--nx-cream)}
.site .nx-rail-n{font:500 .7rem/1 var(--nx-mono);color:var(--nx-gold)}
.site .nx-rail strong{font:600 .74rem/1.25 var(--nx-sans);letter-spacing:.08em}
.site .nx-product-body{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(18px,3vw,40px);align-items:stretch;padding:clamp(20px,3vw,38px);border-radius:28px;border:1px solid var(--nx-line);background:linear-gradient(160deg,var(--nx-panel),var(--nx-ink2))}
.site .nx-product-copy{display:flex;flex-direction:column;animation:nxIn .5s both}
.site .nx-bignum{font:400 clamp(3.4rem,7vw,5.6rem)/.9 var(--nx-serif);color:transparent;-webkit-text-stroke:1px var(--nx-gold)}
.site .nx-product-copy h3{font:400 clamp(1.6rem,3vw,2.3rem)/1.1 var(--nx-serif);color:var(--nx-cream);margin-top:16px}
.site .nx-product-copy p{font:400 .98rem/1.7 var(--nx-sans);color:var(--nx-mute);margin-top:14px}
.site .nx-ticks{display:grid;grid-template-columns:1fr 1fr;gap:9px 14px;margin-top:22px}
.site .nx-ticks li{display:flex;align-items:center;gap:8px;font:500 .8rem/1.2 var(--nx-sans);color:var(--nx-text)}
.site .nx-ticks svg,.site .nx-use li svg{color:var(--nx-gold);flex:0 0 auto}
.site .nx-stepper{display:flex;align-items:center;gap:10px;margin-top:auto;padding-top:26px}
.site .nx-stepper button{width:42px;height:42px;border-radius:50%;border:1px solid var(--nx-line2);background:none;color:var(--nx-gold2);display:grid;place-items:center;transition:background .2s}
.site .nx-stepper button:hover{background:rgba(223,193,141,.14)}
.site .nx-stepper span{font:500 .72rem/1 var(--nx-mono);letter-spacing:.14em;color:var(--nx-mute);margin-left:6px}
.site .nx-product-visual{min-width:0;border-radius:20px;overflow:hidden;animation:nxIn .6s both;min-height:340px}

/* ── use cases ── */
.site .nx-use{background:var(--nx-cream)}
.site .nx-use .nx-head h2{color:var(--nx-dark)}
.site .nx-use .nx-head h2 em{background:none;-webkit-text-fill-color:var(--nx-gold3);color:var(--nx-gold3)}
.site .nx-use .nx-head p{color:#675e4e}
.site .nx-use .nx-eyebrow{color:var(--nx-gold3)}
.site .nx-use-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.site article.nx-use{position:relative;background:var(--nx-dark);color:var(--nx-text);border-radius:28px;padding:clamp(24px,3vw,38px);min-height:360px;display:flex;flex-direction:column;overflow:hidden;transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s}
.site article.nx-use::before{content:"";position:absolute;inset:auto -30% -40% auto;width:80%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(199,162,105,.28),transparent 65%)}
.site article.nx-use:nth-child(2){margin-top:34px}
.site article.nx-use:hover{transform:translateY(-8px);box-shadow:0 30px 60px rgba(32,29,23,.3)}
.site .nx-use-n{font:400 4.4rem/.9 var(--nx-serif);color:transparent;-webkit-text-stroke:1px rgba(223,193,141,.6)}
.site article.nx-use h3{font:400 2rem/1.1 var(--nx-serif);color:var(--nx-cream);margin-top:auto;padding-top:34px}
.site article.nx-use p{font:400 .94rem/1.6 var(--nx-sans);color:var(--nx-mute);margin-top:10px;position:relative}
.site article.nx-use ul{display:flex;flex-wrap:wrap;gap:7px;margin-top:20px;position:relative}
.site article.nx-use li{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:999px;border:1px solid var(--nx-line2);font:500 .72rem/1 var(--nx-sans);color:var(--nx-gold2)}
.site .nx-use-go{position:absolute;right:22px;top:22px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--nx-gold2);color:var(--nx-ink);transition:transform .3s}
.site article.nx-use:hover .nx-use-go{transform:rotate(-45deg)}

/* ── modules ── */
.site .nx-mod{position:relative;padding:clamp(76px,10vw,140px) 0;overflow:hidden}
.site .nx-mod.is-dark{background:var(--nx-ink2)}
.site .nx-mod.is-cream{background:var(--nx-cream2)}
.site .nx-mod-ghost{position:absolute;right:var(--nx-gut);top:clamp(10px,3vw,40px);font:400 clamp(9rem,26vw,22rem)/.8 var(--nx-serif);color:transparent;-webkit-text-stroke:1px rgba(223,193,141,.12);pointer-events:none;user-select:none}
.site .nx-mod.is-flip .nx-mod-ghost{right:auto;left:var(--nx-gut)}
.site .nx-mod.is-cream .nx-mod-ghost{-webkit-text-stroke-color:rgba(32,29,23,.1)}
.site .nx-mod-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6vw,88px);align-items:center}
.site .nx-mod.is-flip .nx-mod-copy{order:2}
.site .nx-mod.is-cream h2{color:var(--nx-dark)}
.site .nx-mod.is-cream h2 em{background:none;-webkit-text-fill-color:var(--nx-gold3)}
.site .nx-mod.is-cream .nx-eyebrow{color:var(--nx-gold3)}
.site .nx-mod.is-cream .nx-mod-copy>p{color:#5f5646}
.site .nx-mod h2{font-size:clamp(2rem,4.4vw,3.5rem)}
.site .nx-feats{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px;margin-top:28px}
.site .nx-feats li{display:flex;align-items:flex-start;gap:10px;font:500 .88rem/1.35 var(--nx-sans);color:var(--nx-text)}
.site .nx-mod.is-cream .nx-feats li{color:var(--nx-dark)}
.site .nx-feats li>span{width:20px;height:20px;border-radius:7px;display:grid;place-items:center;background:rgba(199,162,105,.18);color:var(--nx-gold2);flex:0 0 auto;margin-top:1px}
.site .nx-mod.is-cream .nx-feats li>span{background:var(--nx-dark);color:var(--nx-gold2)}
.site .nx-link{display:inline-flex;align-items:center;gap:10px;margin-top:30px;background:none;border:0;padding:0 0 6px;color:var(--nx-gold2);font:700 .9rem/1 var(--nx-sans);border-bottom:1px solid var(--nx-gold);transition:gap .25s}
.site .nx-link:hover{gap:16px}
.site .nx-mod.is-cream .nx-link{color:var(--nx-dark);border-color:var(--nx-dark)}
.site .nx-mod-card{position:relative;padding:clamp(10px,2vw,22px)}
.site .nx-win{border-radius:24px;border:1px solid var(--nx-line2);background:linear-gradient(160deg,#211c13,#120f0a);box-shadow:0 40px 80px rgba(0,0,0,.45);overflow:hidden;color:var(--nx-text)}
.site .nx-win-bar{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--nx-line)}
.site .nx-win-bar span{display:flex;gap:6px}.site .nx-win-bar i{width:9px;height:9px;border-radius:50%;background:rgba(223,193,141,.28)}
.site .nx-win-bar small{font:500 .64rem/1 var(--nx-mono);letter-spacing:.12em;color:var(--nx-mute);text-transform:uppercase}
.site .nx-win-body{padding:20px}
.site .nx-win-top{display:flex;align-items:center;gap:14px}
.site .nx-win-ic{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,var(--nx-gold2),var(--nx-gold));color:var(--nx-ink)}
.site .nx-win-top small,.site .nx-kpis small{display:block;font:500 .58rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute);text-transform:uppercase}
.site .nx-win-top strong{display:block;font:400 1.3rem/1.1 var(--nx-serif);color:var(--nx-cream);margin-top:6px}
.site .nx-kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.site .nx-kpis div{padding:14px;border-radius:14px;background:rgba(244,236,220,.04);border:1px solid var(--nx-line)}
.site .nx-kpis b{display:block;font:400 1.5rem/1 var(--nx-serif);color:var(--nx-gold2);margin-top:9px}
.site .nx-bars{display:flex;align-items:flex-end;gap:8px;height:96px;margin-top:18px;padding:0 2px}
.site .nx-bars i{flex:1;height:var(--h);border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--nx-gold2),rgba(199,162,105,.25));transform-origin:bottom;animation:nxGrow .9s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i)*70ms)}
@keyframes nxGrow{from{transform:scaleY(.1);opacity:.3}}
.site .nx-rows{display:grid;gap:8px;margin-top:16px}
.site .nx-rows span{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;background:rgba(244,236,220,.045);font:500 .78rem/1.2 var(--nx-sans);color:var(--nx-text)}
.site .nx-rows i{width:6px;height:6px;border-radius:50%;background:var(--nx-gold2);flex:0 0 auto}
.site .nx-win-foot{display:flex;justify-content:space-between;margin-top:16px;font:500 .6rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute)}
.site .nx-win-foot span{display:inline-flex;align-items:center;gap:7px}.site .nx-win-foot i{width:6px;height:6px;border-radius:50%;background:var(--nx-gold2)}
.site .nx-tag{position:absolute;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:var(--nx-gold2);color:var(--nx-ink);font:700 .64rem/1 var(--nx-mono);letter-spacing:.12em;box-shadow:0 12px 30px rgba(0,0,0,.35);animation:nxFloat 6s ease-in-out infinite}
.site .nx-tag.t1{top:0;right:0}.site .nx-tag.t2{bottom:2px;left:0;background:var(--nx-ink);color:var(--nx-gold2);border:1px solid var(--nx-line2);animation-delay:-2.5s}
.site .nx-tag i{width:7px;height:7px;border-radius:50%;background:var(--nx-gold2)}

/* ── bento ── */
.site .nx-bento-sec{background:radial-gradient(60% 40% at 50% 0%,rgba(199,162,105,.1),transparent 70%),var(--nx-ink)}
.site .nx-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-flow:dense;gap:14px}
.site .nx-cell{--mx:50%;--my:0%;position:relative;overflow:hidden;padding:24px;min-height:210px;border-radius:24px;border:1px solid var(--nx-line);background:var(--nx-panel);display:flex;flex-direction:column;transition:border-color .3s,transform .3s}
.site .nx-cell::before{content:"";position:absolute;inset:0;background:radial-gradient(340px circle at var(--mx) var(--my),rgba(223,193,141,.17),transparent 62%);opacity:0;transition:opacity .3s;pointer-events:none}
.site .nx-cell:hover{border-color:var(--nx-gold);transform:translateY(-4px)}
.site .nx-cell:hover::before{opacity:1}
.site .nx-cell:nth-child(1){grid-column:span 2;grid-row:span 2;background:linear-gradient(150deg,#2a2314,var(--nx-panel));justify-content:flex-end}
.site .nx-cell:nth-child(1) h3{font-size:clamp(1.8rem,3vw,2.6rem)}
.site .nx-cell:nth-child(6),.site .nx-cell:nth-child(8){grid-column:span 2}
.site .nx-cell:nth-child(8){background:linear-gradient(150deg,#2a2314,var(--nx-panel))}
.site .nx-cell-ic{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:rgba(223,193,141,.12);border:1px solid var(--nx-line2);color:var(--nx-gold2)}
.site .nx-cell:nth-child(1) .nx-cell-ic{position:absolute;top:24px;left:24px;width:56px;height:56px}
.site .nx-cell-n{position:absolute;top:22px;right:24px;font:500 .68rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute)}
.site .nx-cell h3{font:400 1.35rem/1.15 var(--nx-serif);color:var(--nx-cream);margin-top:auto;padding-top:34px;position:relative}
.site .nx-cell p{font:400 .88rem/1.55 var(--nx-sans);color:var(--nx-mute);margin-top:9px;position:relative}

/* ── flow ── */
.site .nx-flow{background:var(--nx-ink2);border-block:1px solid var(--nx-line)}
.site .nx-track{display:grid;grid-template-columns:repeat(6,1fr);gap:0;position:relative;margin-top:10px}
.site .nx-track::before{content:"";position:absolute;left:0;right:0;top:15px;height:1px;background:linear-gradient(90deg,var(--nx-gold),rgba(199,162,105,.15))}
.site .nx-step{position:relative;padding:0 16px 0 0}
.site .nx-step-dot{display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:var(--nx-ink2);border:1px solid var(--nx-gold);position:relative;z-index:1}
.site .nx-step-dot i{width:9px;height:9px;border-radius:50%;background:var(--nx-gold2);box-shadow:0 0 14px rgba(223,193,141,.8)}
.site .nx-step b{display:block;font:500 .7rem/1 var(--nx-mono);letter-spacing:.14em;color:var(--nx-gold);margin-top:22px}
.site .nx-step h3{font:400 1.45rem/1.1 var(--nx-serif);letter-spacing:.04em;color:var(--nx-cream);margin-top:10px}
.site .nx-step p{font:400 .86rem/1.55 var(--nx-sans);color:var(--nx-mute);margin-top:8px}

/* ── moment ── */
.site .nx-moment{position:relative;overflow:hidden;background:var(--nx-cream);padding:clamp(90px,13vw,170px) 0;text-align:center}
.site .nx-moment-glow{position:absolute;left:50%;top:0;width:min(900px,120vw);aspect-ratio:1;translate:-50% -45%;border-radius:50%;background:radial-gradient(circle,rgba(199,162,105,.4),transparent 62%);max-width:none}
.site .nx-moment .nx-eyebrow{color:var(--nx-gold3)}
.site .nx-moment h2{color:var(--nx-dark);font-size:clamp(2.3rem,6.4vw,5.4rem);max-width:1000px;margin-inline:auto;position:relative}
.site .nx-moment h2 em{background:none;-webkit-text-fill-color:var(--nx-gold3)}
.site .nx-moment p{color:#5f5646;margin:22px auto 0;position:relative}
.site .nx-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:clamp(40px,6vw,70px) auto 0;max-width:880px;position:relative;border-top:1px solid rgba(32,29,23,.2)}
.site .nx-stats div{padding:28px 10px 0;border-right:1px solid rgba(32,29,23,.14)}.site .nx-stats div:last-child{border:0}
.site .nx-stats strong{display:block;font:400 clamp(3rem,8vw,5.6rem)/1 var(--nx-serif);color:var(--nx-dark)}
.site .nx-stats div>span{display:block;font:500 .72rem/1.3 var(--nx-mono);letter-spacing:.16em;text-transform:uppercase;color:#6f6552;margin-top:10px}

/* ── pillars ── */
.site .nx-pillar-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.site .nx-pillar{position:relative;padding:26px 24px 24px;border-radius:24px;border:1px solid var(--nx-line);background:linear-gradient(170deg,var(--nx-panel),var(--nx-ink2));display:flex;flex-direction:column;min-height:300px;transition:border-color .3s,transform .3s}
.site .nx-pillar:hover{border-color:var(--nx-gold);transform:translateY(-6px)}
.site .nx-pillar>svg{color:var(--nx-gold2);margin-top:18px}
.site .nx-pillar-n{font:400 3.4rem/.9 var(--nx-serif);color:transparent;-webkit-text-stroke:1px rgba(223,193,141,.55)}
.site .nx-pillar h3{font:400 1.8rem/1.1 var(--nx-serif);color:var(--nx-cream);margin-top:auto;padding-top:30px}
.site .nx-pillar p{font:400 .9rem/1.6 var(--nx-sans);color:var(--nx-mute);margin-top:10px}
.site .nx-pillar small{display:block;font:500 .58rem/1.3 var(--nx-mono);letter-spacing:.14em;color:var(--nx-gold);margin-top:18px;padding-top:14px;border-top:1px solid var(--nx-line)}

/* ── journey ── */
.site .nx-journey{background:var(--nx-ink2);border-top:1px solid var(--nx-line)}
.site .nx-journey-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(32px,6vw,90px);align-items:center}
.site .nx-quiet{display:inline-flex;align-items:center;gap:10px;margin-top:24px;font:500 .66rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-gold2)}
.site .nx-quiet i{width:7px;height:7px;border-radius:50%;background:var(--nx-gold2)}
.site .nx-moments{margin-top:34px;display:grid;gap:0}
.site .nx-moments li{display:grid;grid-template-columns:54px 1fr;gap:6px;padding:18px 0;border-top:1px solid var(--nx-line)}
.site .nx-moments li span{font:500 .72rem/1 var(--nx-mono);letter-spacing:.14em;color:var(--nx-gold);padding-top:6px}
.site .nx-moments h3{font:400 1.45rem/1.1 var(--nx-serif);color:var(--nx-cream)}
.site .nx-moments p{font:400 .9rem/1.55 var(--nx-sans);color:var(--nx-mute);margin-top:6px}
.site .nx-journey-visual{position:relative;min-height:520px;display:flex;align-items:center;justify-content:center}
.site .nx-ph{position:absolute;width:min(240px,56%);aspect-ratio:9/18.5;border-radius:34px;padding:22px 16px 16px;border:1px solid var(--nx-line2);box-shadow:0 40px 80px rgba(0,0,0,.5);display:flex;flex-direction:column}
.site .nx-ph.back{left:2%;top:4%;background:linear-gradient(170deg,#241f15,#0f0c08);transform:rotate(-7deg);opacity:.9}
.site .nx-ph.front{right:2%;bottom:0;background:linear-gradient(170deg,var(--nx-cream),var(--nx-cream2));color:var(--nx-dark);transform:rotate(4deg);animation:nxFloat 7s ease-in-out infinite;border-color:rgba(32,29,23,.2)}
.site .nx-ph-notch{width:46px;height:5px;border-radius:5px;background:rgba(127,115,90,.4);margin:-8px auto 14px}
.site .nx-ph small{font:500 .54rem/1 var(--nx-mono);letter-spacing:.14em;color:var(--nx-mute)}
.site .nx-ph.front small{color:#7a6e57}
.site .nx-ph strong{font:400 1.3rem/1.1 var(--nx-serif);margin-top:8px;color:var(--nx-cream)}
.site .nx-ph.front strong{color:var(--nx-dark)}
.site .nx-ph.front p{font:400 .72rem/1.4 var(--nx-sans);color:#5f5646;margin-top:5px}
.site .nx-ph-dish{display:block;margin-top:16px;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,var(--nx-gold2),var(--nx-gold3) 55%,#3b2c14);box-shadow:inset 0 0 0 10px rgba(0,0,0,.18)}
.site .nx-ph-line{display:block;height:7px;border-radius:5px;background:rgba(223,193,141,.2);margin-top:14px}.site .nx-ph-line.s{width:55%;margin-top:8px}
.site .nx-ph-item{display:flex;align-items:center;gap:10px;margin-top:11px;padding:9px;border-radius:13px;background:rgba(32,29,23,.07)}
.site .nx-ph-item span{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,var(--nx-gold2),var(--nx-gold3));flex:0 0 auto}.site .nx-ph-item span.alt{background:radial-gradient(circle at 35% 30%,#f1dcae,#b38a4a)}
.site .nx-ph-item b{display:block;font:600 .72rem/1.1 var(--nx-sans)}
.site .nx-ph-item small{display:block;margin-top:4px;font-size:.6rem}
.site .nx-ph.front button{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;padding:11px;background:var(--nx-dark);color:var(--nx-gold2);font:700 .72rem/1 var(--nx-sans)}
.site .nx-ph-signal{position:absolute;left:0;bottom:12%;display:flex;align-items:center;gap:10px;padding:11px 15px;border-radius:16px;background:rgba(20,17,12,.9);border:1px solid var(--nx-line2);color:var(--nx-gold2);box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:2;animation:nxFloat 6s ease-in-out infinite -2s}
.site .nx-ph-signal small{display:block;font:500 .54rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute)}.site .nx-ph-signal b{display:block;font:600 .82rem/1.2 var(--nx-sans);color:var(--nx-cream);margin-top:4px}

/* ── command ── */
.site .nx-command{background:radial-gradient(60% 40% at 0% 100%,rgba(199,162,105,.1),transparent 70%),var(--nx-ink)}
.site .nx-board{border-radius:26px;border:1px solid var(--nx-line2);background:linear-gradient(160deg,#1b160e,#0f0c08);overflow:hidden;box-shadow:0 50px 100px rgba(0,0,0,.5)}
.site .nx-board-top{display:flex;justify-content:space-between;gap:10px;padding:14px 20px;border-bottom:1px solid var(--nx-line);font:500 .64rem/1 var(--nx-mono);letter-spacing:.14em;color:var(--nx-mute)}
.site .nx-board-top span:first-child{color:var(--nx-gold2)}
.site .nx-board-body{display:grid;grid-template-columns:190px minmax(0,1fr)}
.site .nx-board aside{padding:18px 14px;border-right:1px solid var(--nx-line);display:flex;flex-direction:column;gap:4px}
.site .nx-board aside div{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;font:500 .8rem/1 var(--nx-sans);color:var(--nx-mute)}
.site .nx-board aside div.is-on{background:rgba(223,193,141,.14);color:var(--nx-gold2)}
.site .nx-board-main{padding:clamp(14px,2.4vw,26px);min-width:0}
.site .nx-board-hello{display:flex;justify-content:space-between;align-items:center;gap:12px}
.site .nx-board-hello small{display:block;font:500 .6rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute)}
.site .nx-board-hello b{display:block;font:400 1.5rem/1.1 var(--nx-serif);color:var(--nx-cream);margin-top:7px}
.site .nx-board-hello button{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--nx-line2);background:none;color:var(--nx-gold2);border-radius:999px;padding:9px 14px;font:600 .72rem/1 var(--nx-sans);pointer-events:none}
.site .nx-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px}
.site .nx-metrics div{padding:14px;border-radius:16px;background:rgba(244,236,220,.04);border:1px solid var(--nx-line)}
.site .nx-metrics small{display:block;font:500 .56rem/1.2 var(--nx-mono);letter-spacing:.14em;color:var(--nx-mute)}
.site .nx-metrics strong{display:block;font:400 clamp(1.3rem,2.4vw,1.9rem)/1 var(--nx-serif);color:var(--nx-cream);margin-top:10px}
.site .nx-metrics em{display:block;font:500 .66rem/1 var(--nx-mono);font-style:normal;color:var(--nx-gold2);margin-top:8px}
.site .nx-board-low{display:grid;grid-template-columns:1.15fr .85fr;gap:10px;margin-top:10px}
.site .nx-panel{padding:16px;border-radius:16px;background:rgba(244,236,220,.04);border:1px solid var(--nx-line)}
.site .nx-panel header{display:flex;justify-content:space-between;font:600 .8rem/1 var(--nx-sans);color:var(--nx-cream);margin:0}
.site .nx-panel header small{font:500 .56rem/1 var(--nx-mono);letter-spacing:.14em;color:var(--nx-mute)}
.site .nx-spark{display:flex;align-items:flex-end;gap:9px;height:112px;margin-top:16px}
.site .nx-spark i{flex:1;height:var(--h);border-radius:7px 7px 2px 2px;background:linear-gradient(180deg,var(--nx-gold2),rgba(199,162,105,.2));animation:nxGrow .9s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i)*70ms);transform-origin:bottom}
.site .nx-panel footer{display:flex;justify-content:space-between;margin-top:9px;font:500 .58rem/1 var(--nx-mono);color:var(--nx-mute);letter-spacing:.06em}
.site .nx-activity>div{display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:8px;padding:10px 0;border-top:1px solid var(--nx-line);margin-top:0}
.site .nx-activity>header+div{margin-top:12px}
.site .nx-activity i{width:6px;height:6px;border-radius:50%;background:var(--nx-gold2)}
.site .nx-activity b{font:600 .76rem/1 var(--nx-sans);color:var(--nx-cream)}.site .nx-activity small{font:400 .72rem/1.2 var(--nx-sans);color:var(--nx-mute)}.site .nx-activity em{font:500 .62rem/1 var(--nx-mono);font-style:normal;color:var(--nx-gold)}
.site .nx-kds{margin-top:18px;border-radius:26px;border:1px solid var(--nx-line2);background:linear-gradient(160deg,#1b160e,#0f0c08);padding:clamp(16px,2.6vw,28px)}
.site .nx-kds-head{display:flex;justify-content:space-between;align-items:center;font:500 .66rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-gold2)}
.site .nx-kds-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
.site .nx-kds-cols>div>small{display:block;font:500 .6rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute);margin-bottom:10px}
.site .nx-tk{display:grid;grid-template-columns:auto 1fr auto;gap:2px 10px;align-items:center;padding:13px;border-radius:14px;background:rgba(244,236,220,.045);border:1px solid var(--nx-line);margin-bottom:9px}
.site .nx-tk b{font:500 .66rem/1 var(--nx-mono);color:var(--nx-gold)}.site .nx-tk strong{font:600 .82rem/1.1 var(--nx-sans);color:var(--nx-cream)}.site .nx-tk span{grid-column:2;font:400 .7rem/1.2 var(--nx-sans);color:var(--nx-mute)}.site .nx-tk i{grid-row:1/3;grid-column:3;font:500 .7rem/1 var(--nx-mono);font-style:normal;color:var(--nx-gold2)}
.site .nx-tk.hot{border-color:var(--nx-gold);background:rgba(223,193,141,.1)}.site .nx-tk.done{background:var(--nx-gold2)}.site .nx-tk.done *{color:var(--nx-ink)!important}
.site .nx-kds p{margin-top:8px;font:400 .84rem/1.5 var(--nx-sans);color:var(--nx-mute)}.site .nx-kds p strong{color:var(--nx-cream)}
.site .nx-board-foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:22px;font:500 .62rem/1.4 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute)}

/* ── faq ── */
.site .nx-faq{background:var(--nx-ink2);border-top:1px solid var(--nx-line)}
.site .nx-faq-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(30px,6vw,90px);align-items:start}
.site .nx-faq-intro{position:sticky;top:110px}
.site .nx-faq-intro h2{font-size:clamp(2rem,4.2vw,3.3rem)}
.site .nx-faq-card{display:grid;grid-template-columns:auto 1fr;gap:12px 14px;align-items:center;margin-top:30px;padding:18px;border-radius:20px;border:1px solid var(--nx-line2);background:rgba(223,193,141,.07)}
.site .nx-faq-card>span{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--nx-gold2);color:var(--nx-ink)}
.site .nx-faq-card small{display:block;font:500 .58rem/1 var(--nx-mono);letter-spacing:.16em;color:var(--nx-mute)}.site .nx-faq-card strong{display:block;font:400 1.1rem/1.2 var(--nx-serif);color:var(--nx-cream);margin-top:6px}
.site .nx-faq-card button{grid-column:1/-1;justify-self:start;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:11px 18px;background:linear-gradient(135deg,var(--nx-gold2),var(--nx-gold));color:var(--nx-ink);font:700 .8rem/1 var(--nx-sans)}
.site .nx-q{border-bottom:1px solid var(--nx-line)}.site .nx-q:first-child{border-top:1px solid var(--nx-line)}
.site .nx-q>button{width:100%;display:grid;grid-template-columns:38px 1fr 30px;align-items:center;gap:10px;background:none;border:0;text-align:left;padding:22px 2px;color:var(--nx-cream)}
.site .nx-q-n{font:500 .7rem/1 var(--nx-mono);letter-spacing:.12em;color:var(--nx-gold)}
.site .nx-q-t{font:400 clamp(1.1rem,1.9vw,1.4rem)/1.25 var(--nx-serif)}
.site .nx-q-i{position:relative;width:28px;height:28px;border-radius:50%;border:1px solid var(--nx-line2);transition:background .25s,transform .35s}
.site .nx-q-i i{position:absolute;left:50%;top:50%;width:11px;height:1.5px;background:var(--nx-gold2);translate:-50% -50%;transition:rotate .35s}.site .nx-q-i i+i{rotate:90deg}
.site .nx-q.is-open .nx-q-i{background:var(--nx-gold2);transform:rotate(180deg)}.site .nx-q.is-open .nx-q-i i{background:var(--nx-ink)}.site .nx-q.is-open .nx-q-i i+i{rotate:0deg}
.site .nx-q-a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s cubic-bezier(.2,.7,.2,1)}
.site .nx-q.is-open .nx-q-a{grid-template-rows:1fr}
.site .nx-q-a>div{overflow:hidden;padding:0 40px 0 48px;font:400 .96rem/1.75 var(--nx-sans);color:var(--nx-mute)}
.site .nx-q.is-open .nx-q-a>div{padding-bottom:24px}

/* ── footer ── */
.site .nx-footer{background:var(--nx-ink);border-top:1px solid var(--nx-line);padding:clamp(60px,8vw,100px) 0 30px;overflow:hidden;position:relative}
.site .nx-foot-top{display:grid;grid-template-columns:1.5fr 1fr 1fr 1.2fr;gap:clamp(24px,4vw,60px)}
.site .nx-foot-brand>button{background:none;border:0;padding:0}
.site .nx-foot-logo{height:38px;width:auto;object-fit:contain;display:block}
.site .nx-foot-brand p{font:400 .94rem/1.6 var(--nx-sans);color:var(--nx-mute);margin:18px 0 0;max-width:300px}
.site .nx-foot-tag{display:flex;align-items:center;gap:10px;margin-top:20px;font:500 .64rem/1 var(--nx-mono);letter-spacing:.2em;color:var(--nx-gold2)}
.site .nx-foot-tag i{width:5px;height:5px;rotate:45deg;background:var(--nx-gold)}
.site .nx-foot-col{display:flex;flex-direction:column;align-items:flex-start;gap:12px}
.site .nx-foot-col h4{font:500 .66rem/1 var(--nx-mono);letter-spacing:.2em;text-transform:uppercase;color:var(--nx-gold);margin:0 0 8px}
.site .nx-foot-col button,.site .nx-foot-col a{background:none;border:0;padding:0;color:var(--nx-text);font:400 .92rem/1.3 var(--nx-sans);text-decoration:none;text-align:left;transition:color .2s,translate .2s}
.site .nx-foot-col button:hover,.site .nx-foot-col a:hover{color:var(--nx-gold2);translate:4px 0}
.site .nx-foot-loc{display:inline-flex;align-items:center;gap:8px;color:var(--nx-mute);font:400 .9rem/1.3 var(--nx-sans)}
.site .nx-wordmark{font:400 clamp(3.4rem,15.4vw,15rem)/.82 var(--nx-serif);letter-spacing:-.03em;text-align:center;color:transparent;-webkit-text-stroke:1px rgba(223,193,141,.3);margin:clamp(40px,6vw,80px) 0 18px;user-select:none;white-space:nowrap}
.site .nx-foot-mid{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-top:1px solid var(--nx-line);font:500 .64rem/1 var(--nx-mono);letter-spacing:.18em;color:var(--nx-mute)}
.site .nx-foot-mid button{display:inline-flex;align-items:center;gap:8px;background:none;border:0;color:var(--nx-gold2);font:600 .76rem/1 var(--nx-sans);letter-spacing:0}
.site .nx-foot-bot{display:flex;justify-content:space-between;align-items:center;gap:12px 24px;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--nx-line);font:400 .78rem/1.4 var(--nx-sans);color:var(--nx-mute)}
.site .nx-foot-bot div{display:flex;gap:6px 18px;flex-wrap:wrap}.site .nx-foot-bot button{background:none;border:0;padding:0;color:var(--nx-mute);font:400 .78rem/1.4 var(--nx-sans);text-decoration:underline;text-underline-offset:3px}.site .nx-foot-bot button:hover{color:var(--nx-gold2)}

/* ── responsive ── */
@media(max-width:1100px){
  .site .nx-product{grid-template-columns:1fr}.site .nx-rail{position:static;flex-direction:row;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}.site .nx-rail::-webkit-scrollbar{display:none}.site .nx-rail button{min-width:200px}
  .site .nx-bento{grid-template-columns:repeat(2,1fr)}.site .nx-cell:nth-child(1){grid-row:span 1;grid-column:span 2;min-height:260px}.site .nx-cell:nth-child(6),.site .nx-cell:nth-child(8){grid-column:span 1}
  .site .nx-pillar-grid{grid-template-columns:repeat(2,1fr)}
  .site .nx-foot-top{grid-template-columns:1fr 1fr}.site .nx-foot-brand{grid-column:1/-1}
}
@media(max-width:900px){
  .site .nx-links,.site .nx-cta{display:none}.site .nx-burger{display:inline-flex}.site .nx-nav{padding:7px 7px 7px 16px}
  .site .nx-hero{grid-template-columns:1fr;min-height:auto;padding-top:112px;gap:30px}.site .nx-stage{min-height:480px}
  .site .nx-hero-bg .r1,.site .nx-hero-bg .r2,.site .nx-hero-bg .r3{right:50%;top:60%;translate:50% -50%}
  .site .nx-product-body{grid-template-columns:1fr}
  .site .nx-use-grid{grid-template-columns:1fr}.site article.nx-use:nth-child(2){margin-top:0}.site article.nx-use{min-height:300px}
  .site .nx-mod-grid{grid-template-columns:1fr}.site .nx-mod.is-flip .nx-mod-copy{order:0}
  .site .nx-track{grid-template-columns:1fr;gap:26px;padding-left:6px}.site .nx-track::before{left:21px;right:auto;top:8px;bottom:8px;width:1px;height:auto;background:linear-gradient(180deg,var(--nx-gold),rgba(199,162,105,.15))}
  .site .nx-step{display:grid;grid-template-columns:31px 1fr;gap:0 18px;padding:0}.site .nx-step-dot{grid-row:1/4}.site .nx-step b{margin-top:2px}
  .site .nx-journey-grid,.site .nx-faq-grid{grid-template-columns:1fr}.site .nx-faq-intro{position:static}
  .site .nx-journey-visual{min-height:460px}
  .site .nx-board-body{grid-template-columns:1fr}.site .nx-board aside{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid var(--nx-line);padding:10px;scrollbar-width:none}.site .nx-board aside div{white-space:nowrap}
  .site .nx-metrics{grid-template-columns:1fr 1fr}.site .nx-board-low{grid-template-columns:1fr}.site .nx-kds-cols{grid-template-columns:1fr}
}
@media(max-width:600px){
  .site .nx-feats,.site .nx-ticks{grid-template-columns:1fr}
  .site .nx-bento{grid-template-columns:1fr}.site .nx-cell:nth-child(1){grid-column:span 1}.site .nx-cell{min-height:180px}
  .site .nx-pillar-grid{grid-template-columns:1fr}.site .nx-pillar{min-height:250px}
  .site .nx-foot-top{grid-template-columns:1fr}
  .site .nx-stats strong{font-size:clamp(2.2rem,11vw,3rem)}.site .nx-stats span{font-size:.58rem;letter-spacing:.1em}
  .site .nx-chip.c1{left:0;top:2%}.site .nx-chip.c2{right:0;bottom:6%}.site .nx-chip.c3{display:none}
  .site .nx-layers{gap:14px 22px;flex-wrap:wrap}.site .nx-layers b{font-size:1.3rem}
  .site .nx-btn{width:100%}.site .nx-q>button{grid-template-columns:30px 1fr 28px}.site .nx-q-a>div{padding:0 6px 0 40px}
  .site .nx-journey-visual{min-height:420px}.site .nx-ph{width:48%}
  .site .nx-foot-mid{flex-direction:column;align-items:flex-start;gap:12px}
  .site .nx-win-body{padding:16px}.site .nx-board-hello button{display:none}
}
@media(max-width:380px){.site .nx-h1{font-size:2.6rem}.site .nx-metrics{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){
  .site .nx-main .reveal,.site .nx-main .reveal:not(.visible){opacity:1!important;transform:none;transition:none}
  .site .nx-phone,.site .nx-chip,.site .nx-tag,.site .nx-marquee-track,.site .nx-hero-bg .r2,.site .nx-plate i,.site .nx-ph.front,.site .nx-ph-signal{animation:none}
}

/* ── re-skin of kept blocks (demo form, Instagram strip, product visuals, chatbot): no green anywhere ── */
.site [class*="sage"],.site .sage-dish{--nx-x:1}
.site .visual-rows span i,.site .hero-feed-row i,.site .live i,.site .success-icon,.site .feature-check,.site .stage-glow{filter:none}

/* ── fixes after first browser pass ── */
.site .nx-hero,.site .nx-sec,.site .nx-mod,.site .nx-footer,.site .nx-nav,.site .nx-sheet{text-align:left}
.site .nx-head.is-center,.site .nx-moment,.site .nx-moment .nx-wrap{text-align:center}
.site .nx-wordmark{text-align:center}
.site .nx-h1{font-size:clamp(2.7rem,6vw,5.4rem)}
.site .nx-h1 em,.site .nx-h1 .typewriter-word,.site .nx-h1 .typewriter-word span{color:var(--nx-gold2)!important;-webkit-text-fill-color:var(--nx-gold2)!important;background:none!important}
.site .nx-brand,.site .nx-sheet-logo-wrap,.site .nx-foot-brand>button{background:var(--nx-cream);border-radius:999px;padding:5px 14px;display:inline-flex;align-items:center}
.site .nx-brand-img{height:26px}
.site .nx-sheet-logo{background:var(--nx-cream);border-radius:999px;padding:6px 16px;height:42px}
.site .nx-foot-logo{height:34px}
.site .nx-phone-logo{background:var(--nx-cream);border-radius:999px;padding:5px 12px;height:32px}
.site .nx-feats li{text-align:left}
.site .nx-product-copy,.site .nx-mod-copy{text-align:left}
.site .nx-h1 .typewriter-word{display:inline!important;min-height:0!important;height:auto!important;line-height:inherit!important}
.site .nx-h1 span{min-height:0!important}
.site .nx-h1 em span,.site .nx-h1 em i{display:inline!important}
.site .nx-h1 em .typewriter-caret{display:inline-block!important}
.site .nx-product-visual .visual-float{background:#1d1912!important;color:#efe6d3!important;border:1px solid var(--nx-line2)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;font-size:.64rem!important;letter-spacing:.08em!important}
.site .nx-product-visual .visual-float *{color:inherit!important;-webkit-text-fill-color:currentColor!important}
.site .nx-product-visual .visual-float small{color:#a99d86!important}
.site select{background-color:#1c1812;color:var(--nx-cream)}
.site select option{background:#1c1812;color:var(--nx-cream)}
@media(max-width:600px){.site .nx-pillar{min-height:0}.site .nx-pillar h3{padding-top:18px}.site article.nx-use{min-height:0}.site article.nx-use h3{padding-top:22px}}
.site .form-grid select{background:rgba(244,236,220,.045)!important;color:var(--nx-cream)!important;border:1px solid rgba(223,193,141,.22)!important}
.site .form-grid select option{background:#1c1812;color:#efe6d3}
.site .form-grid label.full select[name="type"]{-webkit-text-fill-color:#efe6d3!important}
.site .demo-form-wrap .form-grid label.full select[name="type"]{background:#1d1912!important;color:#efe6d3!important;border:1px solid rgba(223,193,141,.26)!important;-webkit-text-fill-color:#efe6d3!important}

/* ═══ minimal pass: calmer type scale, tighter spacing, no side gutters ═══ */
html:has(.site),body:has(.site){background:#0d0b08!important}
#root:has(.site){border:0!important;outline:0!important}
.site{margin:0!important;border:0!important;width:100%!important;max-width:none!important}
.site .nx-sec,.site .nx-mod{padding:clamp(52px,7vw,92px) 0}
.site .nx-moment{padding:clamp(64px,9vw,110px) 0}
.site .nx-head{margin-bottom:clamp(26px,4vw,44px)}
.site .nx-head h2,.site .nx-mod h2,.site .nx-faq-intro h2,.site .nx-journey-copy h2{font-size:clamp(1.65rem,3.3vw,2.5rem);line-height:1.12;margin-top:14px}
.site .nx-moment h2{font-size:clamp(1.8rem,4.2vw,3.1rem);line-height:1.1}
.site .nx-head p,.site .nx-mod-copy>p,.site .nx-moment p,.site .nx-faq-intro p,.site .nx-journey-copy>p{font-size:.96rem;line-height:1.65;margin-top:14px;max-width:580px}
.site .nx-eyebrow{font-size:.64rem}
.site .nx-mod-ghost{display:none}
/* hero */
.site .nx-hero{min-height:0;padding-top:clamp(104px,13vh,132px);padding-bottom:clamp(44px,7vh,72px);grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(20px,4vw,56px)}
.site .nx-h1{font-size:clamp(2rem,4.4vw,3.45rem);line-height:1.08;letter-spacing:-.02em;margin-top:16px}
.site .nx-lead{font-size:.98rem;line-height:1.7;max-width:500px;margin-top:18px}
.site .nx-actions{margin-top:24px;gap:10px}
.site .nx-btn{padding:13px 22px;font-size:.86rem}
.site .nx-note{font-size:.78rem;margin-top:16px}
.site .nx-proof{margin-top:16px;gap:6px}.site .nx-proof li{font-size:.7rem;padding:7px 12px}
.site .nx-stage{min-height:0;justify-content:flex-end}
.site .nx-phone{width:min(280px,76vw)}
.site .nx-hero-bg .glow{width:min(520px,60vw);opacity:.8}
.site .nx-marquee{padding:12px 0}.site .nx-marquee span{font-size:clamp(1rem,2vw,1.4rem)}
/* components */
.site .nx-product-copy h3{font-size:clamp(1.3rem,2.4vw,1.75rem)}
.site .nx-bignum{font-size:clamp(2.4rem,4.5vw,3.4rem)}
.site .nx-product-copy p{font-size:.92rem}
.site article.nx-use{min-height:300px}.site article.nx-use h3{font-size:1.5rem}.site .nx-use-n{font-size:3rem}
.site .nx-cell h3{font-size:1.15rem}.site .nx-cell:nth-child(1) h3{font-size:clamp(1.4rem,2.4vw,1.9rem)}.site .nx-cell{min-height:170px;padding:20px}
.site .nx-step h3{font-size:1.15rem}.site .nx-step p{font-size:.82rem}
.site .nx-stats strong{font-size:clamp(2.1rem,5vw,3.4rem)}
.site .nx-pillar{min-height:250px}.site .nx-pillar h3{font-size:1.4rem}.site .nx-pillar-n{font-size:2.5rem}
.site .nx-moments h3{font-size:1.2rem}.site .nx-q-t{font-size:clamp(1rem,1.6vw,1.15rem)}.site .nx-q>button{padding:18px 2px}
.site .nx-feats li{font-size:.84rem}
.site .nx-wordmark{font-size:clamp(2.4rem,11vw,9rem)}
.site .nx-sheet-list button{font-size:clamp(1.25rem,5.6vw,1.6rem);padding:15px 2px}
@media(max-width:900px){.site .nx-hero{grid-template-columns:1fr;padding-top:96px}.site .nx-stage{justify-content:center}}
@media(max-width:600px){.site .nx-h1{font-size:2rem}.site .nx-lead{font-size:.94rem}.site .nx-head h2,.site .nx-mod h2{font-size:1.55rem}}
.site .nx-hero{max-width:calc(1240px + var(--nx-gut)*2);grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr)}
.site .nx-stage{justify-content:center}
.site .nx-phone{width:min(292px,78vw)}
.site .nx-phone .hero-feed{width:100%;padding:0;box-sizing:border-box}
.site .nx-phone .hero-feed-row{width:100%;box-sizing:border-box;min-width:0}
.site .nx-phone .hero-feed-txt{min-width:0;overflow:hidden}
.site .nx-phone .hero-feed-txt small,.site .nx-phone .hero-feed-txt b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.site .nx-lead{margin-top:20px}
@media(max-width:900px){.site .nx-hero{grid-template-columns:minmax(0,1fr)}.site .nx-stage{margin-top:6px}}
@media(max-width:600px){.site .nx-btn{padding:13px 18px}.site .nx-note{align-items:flex-start}}

/* ═══ refined: cream first screen, flat & editorial (no glow / gradients / floating gimmicks) ═══ */
.site{--nx-paper:#fbf8f2;--nx-paper2:#f3ece0;--nx-ink-t:#1d1a14;--nx-body:#5b5243;--nx-brown:#8a6a35}
/* nav — light pill, readable on both cream and dark sections */
.site .nx-nav{background:rgba(251,248,242,.86);border:1px solid rgba(29,26,20,.1);box-shadow:none;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.site .nx-nav.is-scrolled{background:rgba(251,248,242,.94);border-color:rgba(29,26,20,.14);box-shadow:0 8px 28px rgba(0,0,0,.18)}
.site .nx-brand{background:#fff;border:1px solid rgba(29,26,20,.1)}
.site .nx-links button{color:var(--nx-body)}
.site .nx-links button:hover{color:var(--nx-ink-t)}
.site .nx-links button.is-on{background:var(--nx-ink-t);color:var(--nx-paper)}
.site .nx-cta{background:var(--nx-ink-t);color:var(--nx-paper);box-shadow:none}
.site .nx-cta:hover{background:#000;box-shadow:none;transform:none}
.site .nx-burger{background:transparent;border:1px solid rgba(29,26,20,.18);color:var(--nx-ink-t)}
.site .nx-sheet{background:var(--nx-paper)}
.site .nx-sheet-x{background:transparent;border:1px solid rgba(29,26,20,.18);color:var(--nx-ink-t)}
.site .nx-sheet-logo{background:#fff;border:1px solid rgba(29,26,20,.1)}
.site .nx-sheet-list button{color:var(--nx-ink-t);border-color:rgba(29,26,20,.1)}
.site .nx-sheet-list button span,.site .nx-sheet-list button svg{color:var(--nx-brown)}
.site .nx-sheet-foot{color:#8a8070}
/* hero */
.site .nx-hero-bg{background:var(--nx-paper);inset:0 -50vw}
.site .nx-hero-bg .glow{display:none}
.site .nx-hero{align-items:center;padding-top:clamp(112px,14vh,140px);padding-bottom:clamp(52px,8vh,84px)}
.site .nx-kicker{font:600 .7rem/1 var(--nx-sans);letter-spacing:.14em;color:var(--nx-brown)}
.site .nx-kicker span{background:var(--nx-brown);width:24px}
.site .nx-h1{color:var(--nx-ink-t);font-size:clamp(2.1rem,4.2vw,3.3rem);line-height:1.1;letter-spacing:-.022em;margin-top:18px}
.site .nx-h1 em,.site .nx-h1 .typewriter-word,.site .nx-h1 .typewriter-word span{color:var(--nx-brown)!important;-webkit-text-fill-color:var(--nx-brown)!important}
.site .nx-h1 .typewriter-caret{background:var(--nx-brown)}
.site .nx-lead{color:var(--nx-body);font-size:1rem;line-height:1.7;max-width:30rem;margin-top:20px}
.site .nx-actions{margin-top:28px}
.site .nx-btn{border-radius:10px;padding:14px 22px;font-size:.88rem;font-weight:600}
.site .nx-btn.is-gold{background:var(--nx-ink-t);color:var(--nx-paper);box-shadow:none}
.site .nx-btn.is-gold:hover{background:#000;transform:none;box-shadow:none}
.site .nx-btn.is-ghost{background:transparent;color:var(--nx-ink-t);border:1px solid rgba(29,26,20,.22)}
.site .nx-btn.is-ghost:hover{background:rgba(29,26,20,.05);border-color:rgba(29,26,20,.4)}
.site .nx-note{color:#7a6f5b;margin-top:22px;font-size:.8rem}
.site .nx-note svg{color:var(--nx-brown)}
.site .nx-proof{margin-top:22px;gap:0;flex-wrap:wrap}
.site .nx-proof li{border:0;background:none;padding:0 16px 0 0;margin-right:16px;border-right:1px solid rgba(29,26,20,.18);font-size:.8rem;font-weight:500;color:var(--nx-ink-t);border-radius:0;line-height:1}
.site .nx-proof li:last-child{border:0;margin:0;padding:0}
/* hero device — clean white card */
.site .nx-phone{background:#fff;border:1px solid rgba(29,26,20,.1);box-shadow:0 30px 60px -20px rgba(29,26,20,.22);animation:none;border-radius:28px;padding:22px 20px 20px;transform:none}
.site .nx-phone-top{color:var(--nx-ink-t)}
.site .nx-live i{background:var(--nx-brown);animation:none}
.site .nx-phone>small{color:#8a8070}
.site .nx-phone-logo{background:var(--nx-paper);border:1px solid rgba(29,26,20,.08)}
.site .nx-phone .hero-feed-row{background:var(--nx-paper);border:1px solid rgba(29,26,20,.08)}
.site .nx-phone .hero-feed-tag{background:#ece2cc;color:#6b5426}
.site .nx-phone .hero-feed-txt b{color:var(--nx-ink-t)}
.site .nx-phone .hero-feed-txt small{color:#7a6f5b}
.site .nx-phone-card{background:var(--nx-ink-t);border:0;color:var(--nx-paper)}
.site .nx-phone-card>span{background:var(--nx-gold);color:var(--nx-ink-t)}
.site .nx-phone-card strong{color:var(--nx-paper)}.site .nx-phone-card small{color:#b9ad96}
/* strip under hero */
.site .nx-strip{background:var(--nx-paper);border-top:1px solid rgba(29,26,20,.1);border-bottom:1px solid rgba(29,26,20,.1)}
.site .nx-strip ul{max-width:calc(1240px + var(--nx-gut)*2);margin:0 auto;padding:0 var(--nx-gut);display:flex;justify-content:space-between;gap:8px 24px;flex-wrap:wrap}
.site .nx-strip li{padding:18px 0;font:500 .78rem/1 var(--nx-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--nx-ink-t)}
.site .nx-strip b{font:500 .68rem/1 var(--nx-mono);color:var(--nx-brown);margin-right:10px;letter-spacing:.04em}
/* calmer details across the page */
.site .nx-main h2 em{background:none;-webkit-text-fill-color:var(--nx-gold2);color:var(--nx-gold2)}
.site .nx-use h2 em,.site .nx-mod.is-cream h2 em,.site .nx-moment h2 em{-webkit-text-fill-color:var(--nx-brown);color:var(--nx-brown)}
.site .nx-eyebrow{letter-spacing:.12em;font-weight:500}
.site .nx-link,.site .nx-faq-card button{box-shadow:none}
.site .nx-faq-card button{background:var(--nx-gold);color:var(--nx-ink)}
.site .nx-tag,.site .nx-ph-signal,.site .nx-chip{animation:none}
.site .nx-ph.front{animation:none}
.site .nx-pains li{border-style:solid}
@media(max-width:900px){.site .nx-strip ul{justify-content:flex-start}.site .nx-strip li{padding:12px 0}}
@media(max-width:600px){.site .nx-btn{width:100%}.site .nx-proof li{font-size:.76rem}.site .nx-strip li{font-size:.7rem}}
/* margins lost to the reset on p/ul/h1 — restore with matching specificity */
.site .nx-main .nx-h1{margin-top:18px}
.site .nx-main .nx-lead{margin-top:22px}
.site .nx-main .nx-proof{margin-top:20px}
.site .nx-main .nx-pains{margin:0 0 clamp(26px,4vw,44px)}
.site .nx-main .nx-feats{margin-top:26px}
.site .nx-main .nx-ticks{margin-top:22px}
.site .nx-main .nx-moments{margin-top:30px}
.site .nx-main .nx-stats{margin:clamp(34px,5vw,56px) auto 0}
.site .nx-main .nx-moment p{margin:20px auto 0}
.site .nx-main .nx-product-copy h3{margin-top:14px}.site .nx-main .nx-product-copy p{margin-top:12px}
.site .nx-main .nx-hero .hero-feed-txt small,.site .nx-phone .hero-feed-txt small{color:#6f6552!important;-webkit-text-fill-color:#6f6552!important;opacity:1!important}
.site .nx-phone .hero-feed-txt b{color:var(--nx-ink-t)!important;-webkit-text-fill-color:var(--nx-ink-t)!important}
.site .nx-phone .hero-feed-row{opacity:1}
.site .visual-float{background:#1d1912!important;color:#efe6d3!important;border:1px solid rgba(223,193,141,.3)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;font-size:.64rem!important}
.site .visual-float *{color:inherit!important;-webkit-text-fill-color:currentColor!important}
.site .visual-float small{color:#a99d86!important}

`;
export default function Pratyeksha() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}