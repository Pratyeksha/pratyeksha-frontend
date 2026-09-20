import React, { useEffect, useRef, useState } from "react";

/*
  PRATYEKSHa
  Single-file landing website
  React + CSS inside App.jsx
*/

const API = "https://pratyeksha-backend.onrender.com/api";

/* =========================================================
   ICON SYSTEM
========================================================= */

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

/* =========================================================
   DATA
========================================================= */

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
  { q: "Is PRATYEKSHa a POS replacement?", a: "PRATYEKSHa is designed as a connected restaurant experience and intelligence layer, bringing customer experience, kitchen workflows, billing, inventory and marketing signals into one connected journey." },
  { q: "Can customers order directly from a QR menu?", a: "Yes. The customer journey can connect QR discovery with menu browsing, dish information, ordering and configured order-status experiences." },
  { q: "Can operators control menu visibility?", a: "Yes. Menu visibility and availability can be managed as part of the restaurant's operational workflow, while keeping the customer-facing menu connected." },
  { q: "Does the platform support GST billing?", a: "The platform includes GST-oriented billing workflows with CGST and SGST calculations, invoice sequencing and configured payment methods." },
  { q: "Can recipes connect with inventory?", a: "Yes. Recipe and ingredient relationships can connect dish availability, stock movement and operational inventory information." },
  { q: "Can it support multiple outlets?", a: "PRATYEKSHa is designed with multi-outlet workflows in mind, allowing menu, operational and reporting structures to extend across locations." },
  { q: "Does it support multilingual experiences?", a: "The customer experience can support English, Marathi and Hindi-oriented menu and voice experiences where configured." },
  { q: "How can I see it for my restaurant?", a: "Use the private demonstration form and share the parts of your current restaurant setup you want to improve. The walkthrough can then focus on the relevant PRATYEKSHa workflows." },
];

/* =========================================================
   APP
========================================================= */

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
            <span>PRATYEKSHa SIGNAL</span>
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


export default function App() {
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [openFaq, setOpenFaq] = useState(-1);
  const [activeSection, setActiveSection] = useState("home");
  const [activeProduct, setActiveProduct] = useState("experience");
  const [cursorActive, setCursorActive] = useState(false);
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
  });

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  /* -------------------------------------------------------
     6 SECOND LOADER
  ------------------------------------------------------- */

  useEffect(() => {
    document.body.classList.add("pratyeksha-page");

    const timer = setTimeout(() => {
      setLoading(false);
    }, 6000);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove("pratyeksha-page");
    };
  }, []);

  /* -------------------------------------------------------
     SCROLL
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     REVEAL ON SCROLL
  ------------------------------------------------------- */

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
  }, [loading]);

  /* -------------------------------------------------------
     CURSOR
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     CURSOR HOVER TARGETS
  ------------------------------------------------------- */

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
  }, [loading, mobileOpen]);

  /* -------------------------------------------------------
     HELPERS
  ------------------------------------------------------- */

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
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const submitDemo = async (e) => {
    e.preventDefault();

    setSending(true);

    try {
      await fetch(`${API}/demo-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      setSent(true);

      setForm({
        name: "",
        business: "",
        phone: "",
        email: "",
        type: "",
        message: "",
      });
    } catch {
      /*
        Keep the landing page usable even if backend
        is unavailable.
      */
      setSent(true);
    }

    setSending(false);
  };

  /* =======================================================
     LOADING SCREEN
  ======================================================= */

  if (loading) {
    return (
      <>
        <style>{CSS}</style>

        <div className="loading-screen">
          <div className="loading-orbit orbit-one" />
          <div className="loading-orbit orbit-two" />

          <div className="loading-center">
            <div className="loading-mark">
              <I name="spark" size={24} />
            </div>

            <div className="loading-brand">PRATYEKSHa</div>

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

  /* =======================================================
     WEBSITE
  ======================================================= */

  return (
    <div className="site">
      <style>{CSS}</style>

      {/* CURSOR */}
      <div
        ref={dotRef}
        className={`cursor-dot ${cursorActive ? "active" : ""}`}
      />

      <div
        ref={ringRef}
        className={`cursor-ring ${cursorActive ? "active" : ""}`}
      />

      {/* SCROLL PROGRESS */}
      <div
        className="scroll-progress"
        style={{ width: `${progress}%` }}
      />

      {/* ===================================================
          NAVIGATION
      =================================================== */}

      <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <button
          className="brand"
          onClick={() => scrollTo("home")}
          aria-label="PRATYEKSHa home"
        >
          <span className="brand-mark">
            <I name="spark" size={16} />
          </span>

          <span className="brand-name">PRATYEKSHa</span>
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

      {/* MOBILE MENU */}

      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        <button
          className="mobile-close"
          onClick={() => setMobileOpen(false)}
        >
          <I name="close" size={24} />
        </button>

        <div className="mobile-menu-inner">
          <span>PRATYEKSHa</span>

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

      {/* ===================================================
          HERO
      =================================================== */}

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
              PRATYEKSHa connects your customer menu, kitchen,
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
                  <strong>PRATYEKSHa</strong>
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

        {/* =================================================
            INTRO BAND
        ================================================= */}

        <section id="system" className="product-section">
          <div className="product-section-inner">
            <div className="section-head">
              <div>
                <span className="eyebrow">The PRATYEKSHa system</span>
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

        {/* =================================================
            CAFE + RESTAURANT
        ================================================= */}

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

        {/* =================================================
            FEATURE / MODULE SECTIONS
        ================================================= */}

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

                    <small>PRATYEKSHa / {module.eyebrow}</small>
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

        {/* =================================================
            FEATURE MATRIX
        ================================================= */}

        <section className="matrix-section">
          <div className="section-heading center reveal">
            <div className="eyebrow">THE COMPLETE LAYER</div>

            <h2>
              More than a menu.
              <br />
              <em>More than a POS.</em>
            </h2>

            <p>
              PRATYEKSHa sits between the customer experience
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

        {/* =================================================
            EXPERIENCE FLOW
        ================================================= */}

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

        {/* =================================================
            STATS / BRAND MOMENT
        ================================================= */}

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

        {/* =================================================
            DEMO
        ================================================= */}

        <section id="demo" className="demo-section">
          <div className="demo-grid">
            <div className="demo-copy">
              <div className="eyebrow reveal">
                PRIVATE DEMONSTRATION
              </div>

              <h2 className="reveal delay-1">
                See what
                <br />
                <em>PRATYEKSHa</em>
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
                <form onSubmit={submitDemo}>
                  <div className="form-top">
                    <small>BOOK A DEMO</small>
                    <span>01 / 01</span>
                  </div>

                  <div className="form-grid">
                    <label>
                      <span>Your Name *</span>
                      <input
                        name="name"
                        required
                        value={form.name}
                        onChange={updateForm}
                        placeholder="Enter your name"
                      />
                    </label>

                    <label>
                      <span>Café / Restaurant *</span>
                      <input
                        name="business"
                        required
                        value={form.business}
                        onChange={updateForm}
                        placeholder="Business name"
                      />
                    </label>

                    <label>
                      <span>Phone *</span>
                      <input
                        name="phone"
                        required
                        value={form.phone}
                        onChange={updateForm}
                        placeholder="+91"
                      />
                    </label>

                    <label>
                      <span>Email</span>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateForm}
                        placeholder="you@example.com"
                      />
                    </label>

                    <label className="full">
                      <span>Business Type</span>

                      <select
                        name="type"
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
                    </label>

                    <label className="full">
                      <span>What would you like to improve?</span>

                      <textarea
                        name="message"
                        value={form.message}
                        onChange={updateForm}
                        placeholder="Tell us briefly about your current setup..."
                        rows={4}
                      />
                    </label>
                  </div>

                  <button
                    className="submit-button"
                    type="submit"
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Request Private Demo"}

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
            <div className="eyebrow">THE PRATYEKSHa DIFFERENCE</div>
            <h2>One experience.<br /><em>Many intelligent layers.</em></h2>
            <p>Editorial typography, cinematic dark surfaces, warm beige panels and quiet sage signals bring the earlier PRATYEKSHa visual language into the new landing experience.</p>
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
            <p>A premium restaurant experience is made from small moments. PRATYEKSHa connects those moments without making the customer feel like they are navigating software.</p>
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
            <div className="board-top"><span>PRATYEKSHa</span><span>OPERATOR / TODAY</span><span>10:42 PM</span></div>
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

      {/* =====================================================
          FAQ / PREMIUM CLARITY
      ===================================================== */}
      <section id="fusion" className="fusion-section">
        <div className="fusion-orb fusion-orb-one"/><div className="fusion-orb fusion-orb-two"/>
        <div className="fusion-inner">
          <div className="fusion-heading reveal"><div className="eyebrow">THE COMPLETE PRODUCT VIEW</div><div className="fusion-kicker">09 / EXPERIENCE × OPERATIONS × INTELLIGENCE</div><h2>Three design directions.<br/><em>One PRATYEKSHa system.</em></h2><p>The strongest visual language from the earlier concepts is brought together here: the warm editorial restaurant feel, the dark operational dashboard aesthetic, and the refined premium landing experience.</p></div>
          <div className="fusion-grid">
            <article className="fusion-panel fusion-menu-panel reveal"><div className="fusion-panel-top"><span>01 / GUEST EXPERIENCE</span><I name="qr" size={18}/></div><div className="fusion-phone"><div className="fusion-phone-top"><span>PRATYEKSHa</span><span>TABLE 12</span></div><div className="fusion-phone-brand">Multi Fusion Food</div><div className="fusion-phone-search"><I name="globe" size={14}/> Explore the menu <span>⌕</span></div><div className="fusion-dish-hero"><div className="fusion-dish-orbit"/><div className="fusion-dish-core">✦</div><span>CHEF SPECIAL</span></div><div className="fusion-phone-title">Signature dish</div><div className="fusion-phone-copy">Discover dishes, ingredients and recommendations before you order.</div><div className="fusion-phone-tabs"><b>Popular</b><span>Chaat</span><span>Pizza</span><span>Shakes</span></div></div><div className="fusion-panel-note"><strong>QR → Explore → Understand → Order</strong><span>Premium customer-facing layer</span></div></article>
            <article className="fusion-panel fusion-kitchen-panel reveal delay-1"><div className="fusion-panel-top"><span>02 / KITCHEN FLOW</span><I name="kitchen" size={18}/></div><div className="fusion-board"><div className="fusion-board-head"><strong>Kitchen Display</strong><span className="fusion-live">LIVE</span></div><div className="fusion-columns"><div><small>NEW</small><div className="fusion-ticket"><b>#1048</b><strong>Paneer Tikka</strong><span>Table 12 · 2 items</span><i>00:48</i></div><div className="fusion-ticket"><b>#1049</b><strong>Veg Momos</strong><span>Takeaway · 1 item</span><i>01:12</i></div></div><div><small>PREPARING</small><div className="fusion-ticket active"><b>#1045</b><strong>Special Combo</strong><span>Table 08 · 4 items</span><i>04:28</i></div><div className="fusion-ticket"><b>#1046</b><strong>Fresh Fruit Shake</strong><span>Table 03 · 2 items</span><i>02:06</i></div></div><div><small>READY</small><div className="fusion-ticket ready"><b>#1041</b><strong>Masala Maggi</strong><span>Table 05 · 1 item</span><i>READY</i></div></div></div></div><div className="fusion-panel-note"><strong>Order state stays visible.</strong><span>FIFO tickets · timers · live sync</span></div></article>
            <article className="fusion-panel fusion-command-panel reveal delay-2"><div className="fusion-panel-top"><span>03 / OPERATOR COMMAND</span><I name="chart" size={18}/></div><div className="fusion-command-window"><div className="fusion-command-head"><div><small>RESTAURANT OVERVIEW</small><strong>Today at a glance</strong></div><span>20 SEP 2026</span></div><div className="fusion-metrics"><div><small>REVENUE</small><b>₹48.2K</b><span>+12.8%</span></div><div><small>ORDERS</small><b>184</b><span>+8.4%</span></div><div><small>AVG. BILL</small><b>₹842</b><span>+4.1%</span></div></div><div className="fusion-chart"><div className="fusion-chart-line"><span/><span/><span/><span/><span/><span/><span/></div><div className="fusion-chart-fill"/></div><div className="fusion-floor"><span className="occupied">●</span><span className="occupied">●</span><span>●</span><span className="occupied">●</span><span>●</span><span className="occupied">●</span><span>●</span><span className="occupied">●</span></div><div className="fusion-command-foot"><span>6 occupied</span><span>2 available</span><span>Inventory synced</span></div></div><div className="fusion-panel-note"><strong>Signals, not software noise.</strong><span>Billing · floor · inventory · analytics</span></div></article>
          </div>
          <div className="fusion-bottom reveal delay-3"><span>CHARCOAL / BEIGE / GOLD / DIM SAGE</span><div className="fusion-swatches"><i/><i/><i/><i/></div><strong>One premium visual system across every touchpoint.</strong></div>
        </div>
      </section>

      <section id="faq" className="faq-section">
        <div className="faq-orbit faq-orbit-one"/><div className="faq-orbit faq-orbit-two"/>
        <div className="faq-inner">
          <div className="faq-intro reveal"><div className="eyebrow">QUESTIONS / ANSWERS</div><div className="faq-kicker">08 / CLARITY BEFORE COMMITMENT</div><h2>Everything you need to know, <em>before the first demo.</em></h2><p>A concise look at how PRATYEKSHa fits into a real café or restaurant without the usual software-sales noise.</p><div className="faq-side-card"><span><I name="spark" size={17}/></span><div><small>STILL CURIOUS?</small><strong>Let's show you the actual experience.</strong></div><button onClick={()=>scrollTo("demo")}>Book demo <I name="arrow" size={14}/></button></div></div>
          <div className="faq-list reveal delay-1">{faqs.map((item,index)=>{const open=openFaq===index;return <article className={`faq-item ${open?'is-open':''}`} key={item.q}><button className="faq-question" onClick={()=>setOpenFaq(open?-1:index)} aria-expanded={open}><span className="faq-index">{String(index+1).padStart(2,"0")}</span><span className="faq-question-text">{item.q}</span><span className="faq-toggle"><i/><i/></span></button><div className="faq-answer-wrap"><div className="faq-answer">{item.a}</div></div></article>})}</div>
        </div>
        <div className="faq-bottom-line"><span>PRATYEKSHa / RESTAURANT EXPERIENCE SYSTEM</span><span>DESIGNED AROUND THE WAY PEOPLE DINE</span></div>
      </section>

      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <button
              className="footer-logo"
              onClick={() => scrollTo("home")}
            >
              <span>
                <I name="spark" size={17} />
              </span>

              PRATYEKSHa
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
            © {new Date().getFullYear()} PRATYEKSHa. All rights
            reserved.
          </span>

          <span>Built for cafés & restaurants.</span>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   CSS
========================================================= */

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

/* =========================================================
   RESET / SCROLL
========================================================= */

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

/* =========================================================
   CURSOR
========================================================= */

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

/* =========================================================
   LOADING
========================================================= */

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

/* =========================================================
   PROGRESS
========================================================= */

.scroll-progress{
  position:fixed;
  top:0;
  left:0;
  height:2px;
  background:var(--gold);
  z-index:10000;
  transition:width .08s linear;
}

/* =========================================================
   NAV
========================================================= */

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

/* =========================================================
   MOBILE MENU
========================================================= */

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

/* =========================================================
   HERO
========================================================= */

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

/* HERO VISUAL */

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

/* =========================================================
   INTRO
========================================================= */

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

/* =========================================================
   USE CASE
========================================================= */

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

/* =========================================================
   MODULES
========================================================= */

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

/* =========================================================
   MATRIX
========================================================= */

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

/* =========================================================
   FLOW
========================================================= */

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

/* =========================================================
   BRAND MOMENT
========================================================= */

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

/* =========================================================
   DEMO
========================================================= */

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

/* =========================================================
   FOOTER
========================================================= */

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

/* =========================================================
   REVEAL
========================================================= */

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

/* =========================================================
   RESPONSIVE
========================================================= */

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

/* =========================================================
   REDUCED MOTION
========================================================= */


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

/* =========================================================
   PREMIUM UX POLISH + HARDENED NATIVE PAGE SCROLL
========================================================= */

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

/* Keep one real browser scrollbar — never create a fixed scroll shell. */
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

/* Premium scrollbar */
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

/* Navigation */
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

/* Hero depth */
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

/* Section rhythm */
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

/* Module cards */
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

/* Flow becomes visually connected */
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

/* Form UX */
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

/* Buttons */
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

/* Reveal polish */
.reveal{
  will-change:transform,opacity;
}

/* Mobile: preserve native vertical scrolling and improve touch targets */
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

/* Prevent accidental horizontal overflow from animated visual layers */
img,
svg,
canvas,
video{
  max-width:100%;
}


/* =========================================================
   SIGNATURE / JOURNEY / COMMAND / FAQ SYSTEM
========================================================= */
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

/* hard scroll ownership: no nested wrapper captures page scrolling */
html,body,#root{height:auto!important;min-height:100%!important;overflow-x:hidden!important;}.site{height:auto!important;min-height:100vh!important;max-height:none!important;overflow:visible!important;}.site>main{height:auto!important;max-height:none!important;overflow:visible!important;}html{overflow-y:scroll!important;scroll-behavior:smooth!important;scrollbar-gutter:stable;}body{overflow-y:auto!important;overscroll-behavior-y:auto!important;}section[id]{scroll-margin-top:92px;}
body{scrollbar-width:thin;scrollbar-color:#c7a269 #11100d;}body::-webkit-scrollbar{width:11px;}body::-webkit-scrollbar-track{background:#11100d;}body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#d1b27e,#a88758);border:3px solid #11100d;border-radius:999px;}
@keyframes premiumOrbit{to{transform:rotate(360deg);}}@keyframes premiumMarquee{to{transform:translateX(-50%);}}

@media(max-width:1180px){.signature-grid{grid-template-columns:repeat(2,1fr);}.journey-shell{grid-template-columns:1fr;}.journey-visual{min-height:700px;}.journey-steps{margin-top:20px;}.board-body{grid-template-columns:160px 1fr;}.board-main{padding:25px;}}
@media(max-width:900px){.signature-section,.journey-section,.command-section,.faq-section{padding-left:28px;padding-right:28px;}.command-heading{align-items:flex-start;flex-direction:column;}.board-metrics{grid-template-columns:repeat(2,1fr);}.board-lower{grid-template-columns:1fr;}.faq-inner{grid-template-columns:1fr;gap:55px;}.faq-intro{position:relative;top:auto;}.faq-side-card{margin-top:30px;}}
@media(max-width:760px){.signature-section{padding-top:105px;padding-bottom:90px;}.signature-heading h2{font-size:clamp(3rem,13vw,4.5rem);letter-spacing:-1.5px;}.signature-grid{grid-template-columns:1fr;margin-top:55px;}.journey-section{padding-top:105px;padding-bottom:90px;}.journey-copy h2{font-size:clamp(2.8rem,13vw,4.4rem);}.journey-visual{transform:scale(.86);transform-origin:center top;margin-bottom:-70px;}.phone-back{transform:translate(-75px,-15px) rotate(-7deg);}.phone-front{transform:translate(35px,25px) rotate(3deg);}.journey-float{right:-5px;bottom:55px;}.journey-steps{grid-template-columns:1fr 1fr;}.journey-step{border-bottom:1px solid rgba(255,255,255,.1);}.journey-step:nth-child(2){border-right:0;}.command-section{padding-top:105px;padding-bottom:90px;}.command-board{overflow:auto;}.board-body{min-width:760px;}.command-footer{flex-direction:column;gap:12px;line-height:1.6;}.faq-section{padding-top:105px;padding-bottom:35px;}.faq-intro h2{font-size:clamp(2.6rem,13vw,4rem);}.faq-question{grid-template-columns:30px 1fr 32px;gap:11px;padding:23px 0;}.faq-question-text{font-size:1.05rem;}.faq-answer{padding-left:41px;padding-right:20px;font-size:.76rem;}.faq-bottom-line{margin-top:65px;gap:20px;flex-direction:column;}}
@media(max-width:520px){.signature-section,.journey-section,.command-section,.faq-section{padding-left:20px;padding-right:20px;}.journey-visual{transform:scale(.72);margin-bottom:-130px;}.journey-steps{grid-template-columns:1fr;}.journey-step{border-right:0!important;min-height:120px;}.board-main{padding:20px;}.faq-side-card{padding:15px;}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important;}.signature-orbit,.signature-marquee-track{animation:none!important;}.reveal{transition:none!important;transform:none!important;opacity:1!important;}}

/* =========================================================
   EXTENDED RESPONSIVE DETAIL TOKENS
========================================================= */
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

/* MAINTENANCE NOTES */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */
/* Keep vertical scrolling owned by the document; avoid fixed-height page wrappers. */


/* =========================================================
   FINAL POLISH — ALIGNMENT / SPACING / VISIBILITY
   Keeps the existing design language and functionality intact.
========================================================= */
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

/* THREE-VERSION FUSION LAYER */
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

/* =========================================================
   FIVE LAYERS / INTERACTIVE SYSTEM — SOURCE DESIGN ADAPTED
========================================================= */
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


/* =========================================================
   FIVE LAYERS — REFINED BACKGROUND / STANDARD UI PASS
========================================================= */
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

`;