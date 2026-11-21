import React, { useEffect, useRef, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { AnimatedNumber, ScrollProgress } from "../../shared/ui/motionKit.jsx";
import { BarChart, RingGauge, Sparkline } from "../../shared/ui/chartKit.jsx";
import "../../shared/ui/premium-polish.css";
// The landing stylesheet is injected through <style> (it carries page-level html/body rules that must not outlive this route),
// but now lives in real .css files: Vite minifies them and the JS chunk no longer carries ~300 kB of template-string CSS.
import CSS from "./landing.css?inline";
import NX_CSS from "./landing-nx.css?inline";

// Shared base: with VITE_API_URL unset this used "" and posted to /demo-request on the Vercel host (404), losing every lead.
import API_BASE_URL from "../../shared/lib/apiBase.js";
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
function TrialSignup() {
  const [f, setF] = useState({ restaurant: "", owner: "", phone: "", city: "", company: "" });
  const [state, setState] = useState({ busy: false, done: false, error: "" });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (state.busy) return;
    const phone = f.phone.replace(/\D/g, "").slice(-10);
    if (!f.restaurant.trim() || !f.owner.trim()) return setState({ busy: false, done: false, error: "Add your restaurant and your name." });
    if (phone.length !== 10) return setState({ busy: false, done: false, error: "Enter a 10-digit mobile number." });
    setState({ busy: true, done: false, error: "" });
    try {
      const r = await fetch(`${API}/public/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, phone }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not send. Please try again.");
      setState({ busy: false, done: true, error: "" });
    } catch (err) {
      setState({ busy: false, done: false, error: err.message || "Could not send. Please try again." });
    }
  };
  return (
    <section id="trial" className="nx-sec nx-trial" aria-labelledby="trial-h">
      <div className="nx-wrap nx-trial-grid">
        <div className="nx-trial-copy">
          <span className="nx-kicker">START WITH YOUR OWN MENU</span>
          <h2 id="trial-h">See it running in <em>your</em> restaurant.</h2>
          <p>Tell us a little about your place. We call you back to set up your menu, tables and QR codes, so the first guest scan happens on your real data.</p>
          <ul className="nx-trial-list">
            <li><b>Menu, tables and QR</b> set up together with you</li>
            <li><b>Billing with GST</b> and end-of-day cash close from day one</li>
            <li><b>No commitment</b> to see how it fits your service</li>
          </ul>
        </div>
        {state.done ? (
          <div className="nx-trial-card is-done" role="status"><h3>Thank you, we have your details.</h3><p>Someone from our team will call you on the number you shared.</p></div>
        ) : (
          <form className="nx-trial-card" onSubmit={submit} noValidate>
            <label>Restaurant name<input value={f.restaurant} onChange={set("restaurant")} maxLength={80} autoComplete="organization" required /></label>
            <label>Your name<input value={f.owner} onChange={set("owner")} maxLength={60} autoComplete="name" required /></label>
            <label>Mobile number<input value={f.phone} onChange={set("phone")} inputMode="numeric" maxLength={14} autoComplete="tel" required /></label>
            <label>City<input value={f.city} onChange={set("city")} maxLength={60} autoComplete="address-level2" /></label>
            <input className="nx-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.company} onChange={set("company")} />
            {state.error && <div className="nx-trial-err" role="alert">{state.error}</div>}
            <button type="submit" className="nx-btn is-gold" disabled={state.busy}>{state.busy ? "Sending…" : "Request a callback"}</button>
          </form>
        )}
      </div>
    </section>
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
        <ScrollProgress />
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
            <div className="nx-pulse" role="group" aria-label="Sample sales pulse">
              <div className="nx-pulse-h"><span>TODAY · SAMPLE</span><em>+12.8%</em></div>
              <AnimatedNumber className="nx-pulse-n" value={48260} prefix="₹ " />
              <Sparkline data={[18, 24, 21, 33, 29, 41, 38, 52, 47, 61]} height={34} ariaLabel="Sample sales trend" />
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
                    <div><small>TODAY'S SALES</small><strong><AnimatedNumber value={48260} prefix="₹ " /></strong><em>+12.8%</em><div className="nx-m-spark"><Sparkline data={[30, 36, 33, 45, 41, 58, 52, 66]} height={26} ariaLabel="Sample sales trend" /></div></div>
                    <div><small>ORDERS</small><strong><AnimatedNumber value={126} /></strong><em>+18</em><div className="nx-m-spark"><Sparkline data={[12, 15, 14, 19, 17, 24, 21, 27]} height={26} color="var(--chart-3)" ariaLabel="Sample orders trend" /></div></div>
                    <div><small>ACTIVE TABLES</small><strong><AnimatedNumber value={18} /></strong><div className="nx-m-ring"><RingGauge value={75} size={34} stroke={5} ariaLabel="Table occupancy (sample)" /><em style={{ marginTop: 0 }}>06 OPEN</em></div></div>
                    <div><small>KITCHEN FLOW</small><strong><AnimatedNumber value={94} suffix="%" /></strong><em>STABLE</em></div>
                  </div>
                  <div className="nx-board-low">
                    <div className="nx-panel">
                      <header><span>Revenue rhythm</span><small>LAST 7 DAYS · SAMPLE</small></header>
                      <BarChart height={138} highlight={5} ariaLabel="Revenue rhythm, last 7 days (sample data)" format={(v) => `₹ ${v}k`}
                        data={[["Mon", 42], ["Tue", 55], ["Wed", 48], ["Thu", 72], ["Fri", 61], ["Sat", 88], ["Sun", 76]].map(([label, value]) => ({ label, value }))} />
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

        <TrialSignup />

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
export default function Pratyeksha() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}