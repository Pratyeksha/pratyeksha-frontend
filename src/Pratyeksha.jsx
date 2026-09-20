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
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2" />
    </>
  ),
};

const I = ({ name, size = 20, stroke = 1.5 }) => (
  <Icon size={size} stroke={stroke}>
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

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("home");
  const [cursorActive, setCursorActive] = useState(false);

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
    const sectionIds = ["home", "system", "experience", "operations", "intelligence", "marketing", "demo"];

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

        <section className="intro-band" id="system">
          <div className="intro-label reveal">
            <span>THE SYSTEM</span>
            <i />
          </div>

          <div className="intro-content">
            <h2 className="reveal">
              One platform.
              <br />
              <em>Every moving part.</em>
            </h2>

            <p className="reveal delay-1">
              From the moment a guest scans a QR code to the moment
              the kitchen completes an order — and from inventory
              deduction to the next marketing interaction —
              PRATYEKSHa keeps the entire experience connected.
            </p>
          </div>

          <div className="system-line reveal">
            {[
              ["01", "Guest"],
              ["02", "Order"],
              ["03", "Kitchen"],
              ["04", "Billing"],
              ["05", "Inventory"],
              ["06", "Intelligence"],
            ].map(([n, t]) => (
              <div key={n}>
                <span>{n}</span>
                <strong>{t}</strong>
              </div>
            ))}
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

`;