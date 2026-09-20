import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Coffee,
  ConciergeBell,
  Flame,
  Globe2,
  Headphones,
  Layers3,
  LayoutGrid,
  Menu,
  MessageCircle,
  MoreHorizontal,
  MoveUpRight,
  Package,
  Play,
  Plus,
  QrCode,
  ReceiptIndianRupee,
  RefreshCcw,
  Search,
  Send,
  Settings2,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TabletSmartphone,
  Target,
  TrendingUp,
  Users,
  Utensils,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

const PRODUCTS = {
  experience: {
    number: "01",
    eyebrow: "CUSTOMER EXPERIENCE",
    title: "A menu people actually want to explore.",
    description:
      "Turn a QR scan into a premium digital dining experience with rich dishes, intelligent suggestions, 3D views and effortless ordering.",
  },
  kitchen: {
    number: "02",
    eyebrow: "KITCHEN FLOW",
    title: "Every order. One calm kitchen.",
    description:
      "Give the kitchen a live operating surface that keeps tickets, timers, priorities and preparation states visible.",
  },
  operations: {
    number: "03",
    eyebrow: "OPERATIONS",
    title: "See the restaurant as it moves.",
    description:
      "Connect tables, orders, billing, menu availability and daily operations into one visual operating layer.",
  },
  intelligence: {
    number: "04",
    eyebrow: "RESTAURANT INTELLIGENCE",
    title: "Turn everyday orders into useful signals.",
    description:
      "Understand what customers choose, when they return, what performs and where opportunities are hiding.",
  },
  marketing: {
    number: "05",
    eyebrow: "RETENTION & MARKETING",
    title: "Make the second visit easier to earn.",
    description:
      "Remember preferences, understand customer behavior and create campaigns around real restaurant interactions.",
  },
};

const FEATURE_ITEMS = [
  "Smart digital menu",
  "3D dish experience",
  "Kitchen display",
  "Live order tracking",
  "Smart inventory",
  "GST billing",
  "Customer memory",
  "Marketing intelligence",
  "Feedback intelligence",
  "WhatsApp campaigns",
  "Table management",
  "Restaurant analytics",
];

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function GoldLine({ className = "" }) {
  return (
    <div className={`gold-line ${className}`}>
      <span />
      <span />
      <span />
    </div>
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
            <Search size={13} />
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
                <Utensils size={26} />
              </div>
            </div>

            <div className="dish-info">
              <div>
                <strong>Paneer Tikka</strong>
                <span>Smoky • Chef special</span>
              </div>
              <button>
                <Plus size={15} />
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
              View order <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="floating-note note-one">
          <QrCode size={16} />
          <div>
            <small>SCAN → EXPLORE</small>
            <strong>Table 12 active</strong>
          </div>
        </div>

        <div className="floating-note note-two">
          <Sparkles size={15} />
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
                  <ArrowRight size={13} />
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
                  <ArrowRight size={13} />
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
                  <Check size={13} />
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
                <Check size={12} /> Ready for pickup
              </div>
            </div>
          </div>
        </div>

        <div className="kitchen-bottom">
          <div>
            <Clock3 size={16} />
            <span>Average prep time</span>
            <b>11m 42s</b>
          </div>
          <div>
            <Flame size={16} />
            <span>Active tickets</span>
            <b>07</b>
          </div>
          <div>
            <Bell size={16} />
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
                <TrendingUp size={12} /> +18.4%
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
            <Brain size={17} />
          </div>
          <div>
            <span>PRATYEKSHa SIGNAL</span>
            <strong>
              Weekend dinner orders are trending toward premium combos.
            </strong>
          </div>
          <ArrowUpRight size={17} />
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
            <Utensils size={16} />
            <div>
              <strong>Paneer dishes</strong>
              <span>Ordered 8 times</span>
            </div>
          </div>

          <div className="preference">
            <Coffee size={16} />
            <div>
              <strong>Cold Coffee</strong>
              <span>Often ordered with dinner</span>
            </div>
          </div>

          <div className="preference">
            <Star size={16} />
            <div>
              <strong>Chef specials</strong>
              <span>High engagement</span>
            </div>
          </div>
        </div>

        <div className="campaign-card">
          <div className="campaign-visual">
            <Sparkles size={25} />
          </div>

          <div>
            <span>PERSONALISED CAMPAIGN</span>
            <strong>“Something familiar?”</strong>
            <p>Invite Akshay back with a dish he already loves.</p>
          </div>

          <button>
            Send campaign <Send size={14} />
          </button>
        </div>
      </div>

      <div className="marketing-footer">
        <div>
          <MessageCircle size={15} />
          WhatsApp ready
        </div>
        <span>1,284 reachable customers</span>
      </div>
    </div>
  );
}

export default function App() {
  const [activeProduct, setActiveProduct] = useState("experience");
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [demoStatus, setDemoStatus] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const productRef = useRef(null);

  const product = PRODUCTS[activeProduct];

  useEffect(() => {
    document.documentElement.classList.add("pratyeksha-html");

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const height =
        document.documentElement.scrollHeight - window.innerHeight;

      setScrollProgress(height > 0 ? scrollTop / height : 0);
    };

    const onMouseMove = (event) => {
      setMouse({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove);

    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.classList.remove("pratyeksha-html");
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const scrollTo = (id) => {
    setMenuOpen(false);

    requestAnimationFrame(() => {
      const element = document.getElementById(id);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  };

  const submitDemo = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setDemoStatus("Please enter your email.");
      return;
    }

    setDemoStatus("Request received. We'll be in touch.");

    try {
      await fetch("/api/demo-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "pratyeksha-landing",
        }),
      });
    } catch {
      // Frontend fallback intentionally keeps the experience usable
      // even when the API is not running locally.
    }
  };

  const activeIndex = Object.keys(PRODUCTS).indexOf(activeProduct);

  const productIcons = useMemo(
    () => ({
      experience: TabletSmartphone,
      kitchen: Flame,
      operations: LayoutGrid,
      intelligence: BarChart3,
      marketing: Target,
    }),
    []
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');

        :root {
          --black: #11120f;
          --charcoal: #191a16;
          --charcoal-2: #20211c;
          --charcoal-3: #292a24;
          --cream: #f3ead7;
          --cream-2: #e7d6b8;
          --gold: #c8a86b;
          --gold-light: #dfc78f;
          --gold-dark: #927542;
          --sage: #aab59d;
          --sage-dark: #7d8973;
          --white: #fffaf0;
          --muted: #9f9a8c;
          --border: rgba(231,214,184,.16);
          --border-light: rgba(17,18,15,.12);
          --shadow: 0 30px 100px rgba(0,0,0,.32);
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 100px;
          min-height: 100%;
        }

        body {
          margin: 0;
          min-height: 100%;
          background: var(--black);
          color: var(--cream);
          font-family: "DM Sans", sans-serif;
          overflow-x: hidden;
          overflow-y: auto !important;
        }

        body,
        button,
        input {
          font-family: "DM Sans", sans-serif;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        button {
          cursor: pointer;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        #root {
          min-height: 100%;
          overflow: visible !important;
        }

        .site {
          min-height: 100vh;
          width: 100%;
          overflow: visible !important;
          position: relative;
          background:
            radial-gradient(circle at 90% 4%, rgba(200,168,107,.11), transparent 24%),
            radial-gradient(circle at 10% 30%, rgba(170,181,157,.07), transparent 22%),
            var(--black);
        }

        .site::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .035;
          z-index: 100;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E");
        }

        .scroll-progress {
          position: fixed;
          z-index: 200;
          top: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold-dark), var(--gold-light), var(--sage));
          width: ${scrollProgress * 100}%;
          transition: width .08s linear;
        }

        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 120;
          height: 82px;
          display: flex;
          align-items: center;
          padding: 0 5vw;
          border-bottom: 1px solid rgba(231,214,184,.08);
          background: rgba(17,18,15,.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .nav-inner {
          width: 100%;
          max-width: 1500px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 18px;
          letter-spacing: -.04em;
          font-weight: 700;
        }

        .logo-mark {
          width: 28px;
          height: 28px;
          border: 1px solid var(--gold);
          display: grid;
          place-items: center;
          transform: rotate(45deg);
          position: relative;
        }

        .logo-mark::before {
          content: "";
          width: 9px;
          height: 9px;
          background: var(--gold);
        }

        .logo-text {
          color: var(--cream);
        }

        .logo-text span {
          color: var(--gold-light);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 34px;
        }

        .nav-links button {
          background: none;
          border: 0;
          color: #aaa698;
          font-size: 12px;
          letter-spacing: .05em;
          text-transform: uppercase;
          transition: color .25s ease;
        }

        .nav-links button:hover {
          color: var(--gold-light);
        }

        .nav-demo {
          border: 1px solid rgba(200,168,107,.55);
          background: rgba(200,168,107,.08);
          color: var(--cream);
          padding: 11px 17px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          letter-spacing: .04em;
          transition: .25s ease;
        }

        .nav-demo:hover {
          background: var(--gold);
          color: var(--black);
        }

        .mobile-toggle {
          display: none;
          border: 0;
          background: transparent;
          color: var(--cream);
        }

        .mobile-menu {
          position: fixed;
          inset: 82px 0 auto 0;
          z-index: 115;
          padding: 24px 6vw 32px;
          background: rgba(20,20,17,.98);
          border-bottom: 1px solid var(--border);
        }

        .mobile-menu button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 17px 0;
          color: var(--cream);
          border: 0;
          border-bottom: 1px solid rgba(231,214,184,.1);
          background: transparent;
          font-size: 17px;
        }

        .mobile-menu .mobile-cta {
          margin-top: 20px;
          background: var(--gold);
          color: var(--black);
          padding: 16px;
          text-align: center;
        }

        section {
          position: relative;
          scroll-margin-top: 100px;
        }

        .hero {
          min-height: 100svh;
          padding: 150px 5vw 90px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .hero-grid {
          width: 100%;
          max-width: 1500px;
          margin: auto;
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 5vw;
          align-items: center;
        }

        .hero-copy {
          position: relative;
          z-index: 3;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--gold-light);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .2em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .eyebrow::before {
          content: "";
          width: 28px;
          height: 1px;
          background: var(--gold);
        }

        .hero h1 {
          margin: 0;
          max-width: 780px;
          font-family: "Playfair Display", serif;
          font-weight: 500;
          font-size: clamp(54px, 6.4vw, 108px);
          line-height: .92;
          letter-spacing: -.065em;
          color: var(--cream);
        }

        .hero h1 em {
          color: var(--gold-light);
          font-style: normal;
        }

        .hero-description {
          max-width: 520px;
          color: #a9a497;
          font-size: 16px;
          line-height: 1.75;
          margin: 34px 0;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .gold-button {
          border: 1px solid var(--gold);
          background: var(--gold);
          color: var(--black);
          padding: 15px 21px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: .02em;
          transition: transform .25s ease, background .25s ease;
        }

        .gold-button:hover {
          transform: translateY(-3px);
          background: var(--gold-light);
        }

        .ghost-button {
          border: 1px solid rgba(231,214,184,.22);
          background: transparent;
          color: var(--cream);
          padding: 15px 21px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 12px;
          transition: .25s ease;
        }

        .ghost-button:hover {
          border-color: var(--gold);
          color: var(--gold-light);
        }

        .hero-meta {
          margin-top: 50px;
          display: flex;
          align-items: center;
          gap: 25px;
          color: #77756c;
          font-size: 10px;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .hero-meta span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .hero-meta i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold);
        }

        .hero-visual {
          min-height: 620px;
          position: relative;
          display: grid;
          place-items: center;
          transform: translate(
            ${mouse.x * -5}px,
            ${mouse.y * -5}px
          );
          transition: transform .4s ease-out;
        }

        .hero-frame {
          width: min(100%, 690px);
          aspect-ratio: 1 / .86;
          position: relative;
          border: 1px solid rgba(200,168,107,.25);
          background:
            linear-gradient(135deg, rgba(200,168,107,.11), transparent 35%),
            linear-gradient(45deg, rgba(170,181,157,.07), transparent 50%),
            #1d1d18;
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .hero-frame::before {
          content: "";
          position: absolute;
          inset: 17px;
          border: 1px solid rgba(231,214,184,.08);
          pointer-events: none;
        }

        .hero-frame::after {
          content: "";
          position: absolute;
          width: 480px;
          height: 480px;
          right: -170px;
          top: -180px;
          border-radius: 50%;
          border: 1px solid rgba(200,168,107,.12);
          box-shadow:
            0 0 0 60px rgba(200,168,107,.02),
            0 0 0 120px rgba(200,168,107,.015);
        }

        .restaurant-table {
          position: absolute;
          width: 70%;
          height: 64%;
          left: 15%;
          top: 19%;
          background: radial-gradient(
            ellipse,
            #494237 0%,
            #292820 48%,
            #1b1b17 70%
          );
          border-radius: 50%;
          box-shadow:
            0 45px 70px rgba(0,0,0,.45),
            inset 0 0 50px rgba(0,0,0,.3);
          transform: rotate(-8deg);
        }

        .table-edge {
          position: absolute;
          inset: -9px;
          border-radius: 50%;
          border: 1px solid rgba(200,168,107,.35);
        }

        .plate {
          position: absolute;
          width: 155px;
          height: 155px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: #dfd0b5;
          box-shadow:
            0 10px 25px rgba(0,0,0,.35),
            inset 0 0 0 8px #c7b899,
            inset 0 0 0 13px #eee2cb;
        }

        .plate-food {
          position: absolute;
          width: 80px;
          height: 80px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 30%, #c4a45d, transparent 13%),
            radial-gradient(circle at 65% 35%, #8d6c3f, transparent 17%),
            radial-gradient(circle at 40% 65%, #a78950, transparent 17%),
            radial-gradient(circle at 70% 70%, #725637, transparent 14%),
            #5b4930;
          box-shadow: 0 8px 20px rgba(0,0,0,.35);
        }

        .table-phone {
          position: absolute;
          width: 160px;
          height: 280px;
          right: 12%;
          top: 22%;
          background: #11120f;
          border: 2px solid #4d4b42;
          border-radius: 23px;
          transform: rotate(12deg);
          box-shadow: 20px 30px 60px rgba(0,0,0,.45);
          padding: 7px;
        }

        .table-phone-inner {
          width: 100%;
          height: 100%;
          border-radius: 17px;
          background: linear-gradient(150deg, #302c24, #171813);
          padding: 15px 10px;
          overflow: hidden;
        }

        .phone-mini-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7px;
          color: #aaa18e;
        }

        .phone-mini-title {
          margin-top: 18px;
          color: var(--cream);
          font-family: "Playfair Display", serif;
          font-size: 22px;
          line-height: .95;
        }

        .phone-mini-image {
          margin-top: 15px;
          height: 85px;
          border-radius: 10px;
          background:
            radial-gradient(circle at center, #aa8750 0 15%, transparent 16%),
            radial-gradient(circle at 40% 40%, #6d5738 0 12%, transparent 13%),
            radial-gradient(circle at 62% 60%, #947548 0 12%, transparent 13%),
            #29261f;
        }

        .phone-mini-price {
          margin-top: 10px;
          color: var(--gold-light);
          font-size: 11px;
          display: flex;
          justify-content: space-between;
        }

        .hero-badge {
          position: absolute;
          left: 6%;
          bottom: 8%;
          padding: 13px 15px;
          background: rgba(18,18,15,.88);
          border: 1px solid rgba(200,168,107,.3);
          backdrop-filter: blur(15px);
          display: flex;
          gap: 11px;
          align-items: center;
        }

        .hero-badge-icon {
          width: 30px;
          height: 30px;
          background: rgba(200,168,107,.13);
          color: var(--gold-light);
          display: grid;
          place-items: center;
        }

        .hero-badge small {
          display: block;
          color: #7d7a6e;
          font-size: 8px;
          letter-spacing: .14em;
          margin-bottom: 4px;
        }

        .hero-badge strong {
          font-size: 11px;
          color: var(--cream);
        }

        .scroll-cue {
          position: absolute;
          bottom: 34px;
          left: 5vw;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #68675f;
          font-size: 9px;
          letter-spacing: .2em;
          text-transform: uppercase;
          writing-mode: vertical-rl;
        }

        .scroll-cue svg {
          color: var(--gold);
          animation: scrollArrow 1.8s ease-in-out infinite;
        }

        @keyframes scrollArrow {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }

        .marquee-wrap {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          overflow: hidden;
          background: #161713;
        }

        .marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }

        .marquee-item {
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 22px 28px;
          color: #aaa18e;
          font-size: 10px;
          letter-spacing: .15em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .marquee-item b {
          color: var(--gold);
          font-weight: 400;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .intro {
          padding: 150px 5vw;
          background: var(--cream);
          color: var(--black);
          overflow: hidden;
        }

        .intro-grid {
          max-width: 1500px;
          margin: auto;
          display: grid;
          grid-template-columns: .4fr 1.6fr;
          gap: 8vw;
        }

        .section-number {
          font-size: 10px;
          letter-spacing: .2em;
          color: var(--gold-dark);
          font-weight: 700;
        }

        .intro h2 {
          margin: 0;
          max-width: 950px;
          font-family: "Playfair Display", serif;
          font-size: clamp(45px, 6vw, 94px);
          line-height: .98;
          letter-spacing: -.06em;
          font-weight: 500;
        }

        .intro h2 em {
          color: var(--gold-dark);
          font-style: normal;
        }

        .intro-bottom {
          max-width: 1500px;
          margin: 100px auto 0;
          display: flex;
          justify-content: flex-end;
        }

        .intro-bottom p {
          max-width: 500px;
          margin: 0;
          font-size: 15px;
          line-height: 1.8;
          color: #666052;
        }

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

        .story {
          padding: 150px 5vw;
          background: #12130f;
        }

        .story-inner {
          max-width: 1500px;
          margin: auto;
        }

        .story-title {
          max-width: 850px;
        }

        .story-title h2 {
          margin: 14px 0 0;
          font-family: "Playfair Display", serif;
          font-weight: 500;
          font-size: clamp(45px, 5.5vw, 85px);
          line-height: .97;
          letter-spacing: -.06em;
        }

        .story-title h2 span {
          color: var(--gold-light);
        }

        .story-flow {
          margin-top: 100px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(231,214,184,.1);
          border: 1px solid rgba(231,214,184,.1);
        }

        .story-step {
          min-height: 300px;
          padding: 25px;
          background: #171813;
          position: relative;
        }

        .story-step-number {
          color: var(--gold);
          font-size: 10px;
        }

        .story-step svg {
          position: absolute;
          right: 22px;
          top: 23px;
          color: #4e4d46;
        }

        .story-step h3 {
          margin: 110px 0 12px;
          font-family: "Playfair Display", serif;
          font-weight: 500;
          font-size: 25px;
        }

        .story-step p {
          margin: 0;
          color: #77746b;
          font-size: 11px;
          line-height: 1.7;
        }

        .feature-section {
          padding: 130px 5vw;
          background: var(--cream);
          color: var(--black);
        }

        .feature-section-inner {
          max-width: 1500px;
          margin: auto;
        }

        .feature-head {
          display: grid;
          grid-template-columns: 1fr .8fr;
          gap: 60px;
          align-items: end;
        }

        .feature-head h2 {
          margin: 0;
          max-width: 800px;
          font-family: "Playfair Display", serif;
          font-size: clamp(45px, 5.5vw, 84px);
          line-height: .95;
          letter-spacing: -.06em;
          font-weight: 500;
        }

        .feature-head h2 em {
          color: var(--gold-dark);
          font-style: normal;
        }

        .feature-head p {
          color: #706a5e;
          font-size: 14px;
          line-height: 1.8;
          margin: 0;
        }

        .feature-grid {
          margin-top: 80px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid var(--border-light);
          border-left: 1px solid var(--border-light);
        }

        .feature-card {
          min-height: 260px;
          padding: 25px;
          border-right: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          position: relative;
          transition: background .3s ease, transform .3s ease;
        }

        .feature-card:hover {
          background: #e9ddc7;
          transform: translateY(-4px);
        }

        .feature-card-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          color: var(--gold-dark);
          border: 1px solid rgba(146,117,66,.2);
        }

        .feature-card h3 {
          margin: 80px 0 10px;
          font-family: "Playfair Display", serif;
          font-size: 25px;
          font-weight: 500;
        }

        .feature-card p {
          margin: 0;
          color: #777063;
          font-size: 10px;
          line-height: 1.7;
          max-width: 280px;
        }

        .feature-card-index {
          position: absolute;
          right: 20px;
          top: 20px;
          color: #a69b87;
          font-size: 8px;
        }

        .numbers {
          padding: 110px 5vw;
          background: #1d1e19;
        }

        .numbers-grid {
          max-width: 1500px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .number {
          padding: 38px 25px;
          border-right: 1px solid var(--border);
        }

        .number:last-child {
          border-right: 0;
        }

        .number strong {
          display: block;
          color: var(--gold-light);
          font-family: "Playfair Display", serif;
          font-size: clamp(38px, 4vw, 58px);
          font-weight: 500;
          letter-spacing: -.05em;
        }

        .number span {
          display: block;
          margin-top: 8px;
          color: #77746a;
          font-size: 9px;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .cta {
          padding: 170px 5vw;
          background:
            radial-gradient(circle at 50% 0%, rgba(200,168,107,.2), transparent 34%),
            #10110e;
          text-align: center;
          overflow: hidden;
        }

        .cta-decoration {
          position: absolute;
          width: 800px;
          height: 800px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(200,168,107,.1);
          border-radius: 50%;
          box-shadow:
            0 0 0 100px rgba(200,168,107,.018),
            0 0 0 200px rgba(200,168,107,.014),
            0 0 0 300px rgba(200,168,107,.01);
        }

        .cta-content {
          position: relative;
          z-index: 2;
          max-width: 850px;
          margin: auto;
        }

        .cta h2 {
          margin: 15px 0 25px;
          font-family: "Playfair Display", serif;
          font-size: clamp(50px, 7vw, 105px);
          line-height: .9;
          letter-spacing: -.065em;
          font-weight: 500;
        }

        .cta h2 em {
          color: var(--gold-light);
          font-style: normal;
        }

        .cta p {
          max-width: 500px;
          margin: auto auto 35px;
          color: #817e73;
          line-height: 1.8;
          font-size: 14px;
        }

        .footer {
          padding: 35px 5vw;
          border-top: 1px solid var(--border);
          background: #10110e;
        }

        .footer-inner {
          max-width: 1500px;
          margin: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .footer-copy {
          color: #5e5c55;
          font-size: 9px;
        }

        .footer-links {
          display: flex;
          gap: 20px;
        }

        .footer-links button {
          border: 0;
          background: transparent;
          color: #77746a;
          font-size: 9px;
        }

        .footer-links button:hover {
          color: var(--gold-light);
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: grid;
          place-items: center;
          padding: 25px;
          background: rgba(8,9,7,.82);
          backdrop-filter: blur(15px);
        }

        .modal {
          width: min(100%, 550px);
          padding: 38px;
          background:
            linear-gradient(145deg, rgba(200,168,107,.1), transparent 35%),
            #20211c;
          border: 1px solid rgba(200,168,107,.28);
          box-shadow: 0 40px 100px rgba(0,0,0,.5);
          position: relative;
        }

        .modal-close {
          position: absolute;
          right: 18px;
          top: 18px;
          width: 34px;
          height: 34px;
          border: 1px solid var(--border);
          background: transparent;
          color: #88857a;
          display: grid;
          place-items: center;
        }

        .modal h2 {
          margin: 12px 0;
          font-family: "Playfair Display", serif;
          font-size: 42px;
          font-weight: 500;
          line-height: .98;
        }

        .modal p {
          color: #858278;
          font-size: 12px;
          line-height: 1.7;
          max-width: 400px;
        }

        .demo-form {
          margin-top: 28px;
          display: flex;
          gap: 8px;
        }

        .demo-form input {
          flex: 1;
          min-width: 0;
          border: 1px solid rgba(231,214,184,.15);
          background: #171813;
          color: var(--cream);
          padding: 14px;
          outline: none;
        }

        .demo-form input:focus {
          border-color: var(--gold);
        }

        .demo-form button {
          border: 0;
          background: var(--gold);
          color: var(--black);
          padding: 0 18px;
          font-weight: 700;
        }

        .demo-status {
          margin-top: 14px;
          color: var(--sage);
          font-size: 10px;
        }

        .gold-line {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .gold-line span {
          display: block;
          height: 1px;
          background: var(--gold);
        }

        .gold-line span:nth-child(1) { width: 36px; }
        .gold-line span:nth-child(2) { width: 8px; opacity: .6; }
        .gold-line span:nth-child(3) { width: 3px; opacity: .3; }

        .reveal {
          opacity: 0;
          transform: translateY(35px);
          transition:
            opacity .9s cubic-bezier(.2,.8,.2,1) var(--delay),
            transform .9s cubic-bezier(.2,.8,.2,1) var(--delay);
        }

        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 1100px) {
          .hero-grid,
          .product-detail {
            grid-template-columns: 1fr;
          }

          .hero {
            padding-top: 140px;
          }

          .hero-visual {
            min-height: 570px;
          }

          .product-copy {
            padding-bottom: 0;
          }

          .product-detail {
            gap: 30px;
          }

          .story-flow {
            grid-template-columns: repeat(2, 1fr);
          }

          .feature-head {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .nav-links,
          .nav-demo {
            display: none;
          }

          .mobile-toggle {
            display: grid;
            place-items: center;
          }

          .hero {
            min-height: auto;
            padding-top: 140px;
          }

          .hero-grid {
            gap: 40px;
          }

          .hero-visual {
            min-height: 500px;
          }

          .hero-frame {
            width: 100%;
          }

          .intro-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .section-head {
            display: block;
          }

          .section-head p {
            margin-top: 25px;
          }

          .operations-grid {
            grid-template-columns: 1fr;
          }

          .operation-side {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .marketing-grid {
            grid-template-columns: 1fr;
          }

          .feature-grid {
            grid-template-columns: 1fr 1fr;
          }

          .numbers-grid {
            grid-template-columns: 1fr 1fr;
          }

          .number:nth-child(2) {
            border-right: 0;
          }

          .number:nth-child(-n+2) {
            border-bottom: 1px solid var(--border);
          }
        }

        @media (max-width: 650px) {
          .nav {
            height: 72px;
            padding: 0 6vw;
          }

          .mobile-menu {
            inset: 72px 0 auto 0;
          }

          section {
            scroll-margin-top: 80px;
          }

          .hero {
            padding: 120px 6vw 70px;
          }

          .hero h1 {
            font-size: clamp(48px, 14vw, 75px);
          }

          .hero-description {
            font-size: 14px;
          }

          .hero-meta {
            flex-wrap: wrap;
            margin-top: 35px;
          }

          .hero-visual {
            min-height: 420px;
          }

          .hero-frame {
            aspect-ratio: .86 / 1;
          }

          .restaurant-table {
            width: 92%;
            height: 48%;
            left: 4%;
            top: 29%;
          }

          .table-phone {
            width: 125px;
            height: 220px;
            right: 4%;
            top: 15%;
          }

          .plate {
            width: 115px;
            height: 115px;
          }

          .plate-food {
            width: 60px;
            height: 60px;
          }

          .hero-badge {
            left: 4%;
            bottom: 9%;
          }

          .scroll-cue {
            display: none;
          }

          .intro,
          .product-section,
          .story,
          .feature-section {
            padding: 100px 6vw;
          }

          .numbers,
          .cta {
            padding: 90px 6vw;
          }

          .product-tabs {
            margin-top: 50px;
          }

          .product-tab {
            min-width: 150px;
          }

          .visual-stage {
            min-height: 570px;
          }

          .kitchen-stage,
          .operations-stage,
          .intelligence-stage,
          .marketing-stage {
            padding: 22px;
          }

          .phone-shell {
            width: 240px;
            height: 485px;
          }

          .dish-image {
            height: 130px;
          }

          .note-one {
            left: 3%;
            top: 15%;
          }

          .note-two {
            right: 3%;
            bottom: 11%;
          }

          .kitchen-columns {
            grid-template-columns: 1fr;
            max-height: 430px;
            overflow: hidden;
          }

          .kitchen-column:nth-child(3) {
            display: none;
          }

          .kitchen-bottom {
            grid-template-columns: 1fr 1fr;
          }

          .kitchen-bottom > div:last-child {
            display: none;
          }

          .floor-map {
            min-height: 380px;
          }

          .intelligence-metrics {
            grid-template-columns: 1fr;
          }

          .intelligence-metrics > div:nth-child(3) {
            display: none;
          }

          .chart-panel {
            height: 230px;
          }

          .story-flow {
            grid-template-columns: 1fr;
          }

          .story-step {
            min-height: 220px;
          }

          .story-step h3 {
            margin-top: 70px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .feature-card {
            min-height: 220px;
          }

          .numbers-grid {
            grid-template-columns: 1fr 1fr;
          }

          .number {
            padding: 28px 16px;
          }

          .number strong {
            font-size: 37px;
          }

          .cta h2 {
            font-size: clamp(48px, 15vw, 75px);
          }

          .footer-inner {
            flex-direction: column;
            align-items: flex-start;
          }

          .demo-form {
            flex-direction: column;
          }

          .demo-form button {
            padding: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="site">
        <div className="scroll-progress" />

        <header className="nav">
          <div className="nav-inner">
            <button
              className="logo"
              onClick={() => scrollTo("top")}
              aria-label="PRATYEKSHa home"
              style={{ background: "transparent", border: 0 }}
            >
              <span className="logo-mark" />
              <span className="logo-text">
                PRATYEKSH<span>a</span>
              </span>
            </button>

            <nav className="nav-links">
              <button onClick={() => scrollTo("system")}>System</button>
              <button onClick={() => scrollTo("experience")}>Experience</button>
              <button onClick={() => scrollTo("features")}>Features</button>
              <button onClick={() => scrollTo("intelligence")}>
                Intelligence
              </button>
            </nav>

            <button className="nav-demo" onClick={() => setDemoOpen(true)}>
              Book a demo <ArrowUpRight size={14} />
            </button>

            <button
              className="mobile-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="mobile-menu">
            <button onClick={() => scrollTo("system")}>The system</button>
            <button onClick={() => scrollTo("experience")}>
              Customer experience
            </button>
            <button onClick={() => scrollTo("features")}>Features</button>
            <button onClick={() => scrollTo("intelligence")}>
              Intelligence
            </button>
            <button
              className="mobile-cta"
              onClick={() => {
                setMenuOpen(false);
                setDemoOpen(true);
              }}
            >
              Book a private demo
            </button>
          </div>
        )}

        <main>
          <section id="top" className="hero">
            <div className="hero-grid">
              <Reveal className="hero-copy">
                <div className="eyebrow">Restaurant experience system</div>

                <h1>
                  The digital layer behind{" "}
                  <em>better</em> restaurant experiences.
                </h1>

                <p className="hero-description">
                  PRATYEKSHa brings the menu, customer experience, kitchen,
                  operations, intelligence and marketing layer together —
                  without making the restaurant feel complicated.
                </p>

                <div className="hero-actions">
                  <button
                    className="gold-button"
                    onClick={() => setDemoOpen(true)}
                  >
                    Book a private demo <ArrowUpRight size={15} />
                  </button>

                  <button
                    className="ghost-button"
                    onClick={() => scrollTo("system")}
                  >
                    Explore the system <ArrowDown size={14} />
                  </button>
                </div>

                <div className="hero-meta">
                  <span>
                    <i /> Built for cafés
                  </span>
                  <span>
                    <i /> Restaurants
                  </span>
                  <span>
                    <i /> Modern dining
                  </span>
                </div>
              </Reveal>

              <Reveal className="hero-visual" delay={120}>
                <div className="hero-frame">
                  <div className="restaurant-table">
                    <div className="table-edge" />
                    <div className="plate">
                      <div className="plate-food" />
                    </div>
                  </div>

                  <div className="table-phone">
                    <div className="table-phone-inner">
                      <div className="phone-mini-header">
                        <span>12:42</span>
                        <span>PRATYEKSHa</span>
                      </div>

                      <div className="phone-mini-title">
                        What are
                        <br />
                        you craving?
                      </div>

                      <div className="phone-mini-image" />

                      <div className="phone-mini-price">
                        <span>Paneer Tikka</span>
                        <strong>₹240</strong>
                      </div>
                    </div>
                  </div>

                  <div className="hero-badge">
                    <div className="hero-badge-icon">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <small>SMART MENU</small>
                      <strong>Built around the guest</strong>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="scroll-cue">
              Scroll to explore
              <ArrowDown size={13} />
            </div>
          </section>

          <div className="marquee-wrap">
            <div className="marquee">
              {[...FEATURE_ITEMS, ...FEATURE_ITEMS].map((item, index) => (
                <div className="marquee-item" key={`${item}-${index}`}>
                  <b>✦</b> {item}
                </div>
              ))}
            </div>
          </div>

          <section className="intro">
            <div className="intro-grid">
              <Reveal>
                <span className="section-number">THE IDEA / 00</span>
              </Reveal>

              <Reveal delay={100}>
                <h2>
                  Restaurants don't need{" "}
                  <em>more software.</em>
                  <br />
                  They need a better digital experience.
                </h2>
              </Reveal>
            </div>

            <Reveal className="intro-bottom" delay={150}>
              <p>
                PRATYEKSHa is designed around the restaurant itself — the
                guest sitting at the table, the kitchen preparing the order,
                the operator watching the floor and the customer who might
                return tomorrow.
              </p>
            </Reveal>
          </section>

          <section id="system" className="product-section" ref={productRef}>
            <Reveal>
              <div className="section-head">
                <div>
                  <span className="eyebrow">The PRATYEKSHa system</span>
                  <h2>Five layers. One restaurant experience.</h2>
                </div>

                <p>
                  Instead of forcing every part of the restaurant into one
                  dashboard, each layer gets an interface designed around the
                  job it needs to perform.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="product-tabs">
                {Object.entries(PRODUCTS).map(([key, item]) => {
                  const Icon = productIcons[key];

                  return (
                    <button
                      key={key}
                      className={`product-tab ${
                        activeProduct === key ? "active" : ""
                      }`}
                      onClick={() => setActiveProduct(key)}
                    >
                      <div className="product-tab-top">
                        <span className="product-tab-number">
                          {item.number}
                        </span>
                        <Icon className="product-tab-icon" size={15} />
                      </div>
                      <strong>{item.eyebrow}</strong>
                    </button>
                  );
                })}
              </div>
            </Reveal>

            <div className="product-detail">
              <Reveal className="product-copy">
                <div className="product-copy-top" key={activeProduct}>
                  <span className="section-number">{product.number}</span>

                  <h3>{product.title}</h3>

                  <p>{product.description}</p>

                  <div className="feature-list">
                    <div>
                      <Check size={13} /> Live data
                    </div>
                    <div>
                      <Check size={13} /> Mobile ready
                    </div>
                    <div>
                      <Check size={13} /> Smart actions
                    </div>
                    <div>
                      <Check size={13} /> Real-time flow
                    </div>
                    <div>
                      <Check size={13} /> Restaurant aware
                    </div>
                    <div>
                      <Check size={13} /> Connected system
                    </div>
                  </div>
                </div>

                <div className="product-nav">
                  <button
                    onClick={() => {
                      const keys = Object.keys(PRODUCTS);
                      setActiveProduct(
                        keys[
                          (activeIndex - 1 + keys.length) % keys.length
                        ]
                      );
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    onClick={() => {
                      const keys = Object.keys(PRODUCTS);
                      setActiveProduct(
                        keys[(activeIndex + 1) % keys.length]
                      );
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>

                  <span className="product-counter">
                    0{activeIndex + 1} / 05
                  </span>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <ProductVisual type={activeProduct} />
              </Reveal>
            </div>
          </section>

          <section id="experience" className="story">
            <div className="story-inner">
              <Reveal>
                <div className="story-title">
                  <span className="eyebrow">From scan to return</span>
                  <h2>
                    A restaurant experience that feels{" "}
                    <span>connected.</span>
                  </h2>
                </div>
              </Reveal>

              <div className="story-flow">
                <Reveal delay={80}>
                  <div className="story-step">
                    <span className="story-step-number">01</span>
                    <QrCode size={19} />
                    <h3>Scan</h3>
                    <p>
                      The guest scans the table QR and enters a branded
                      digital menu designed for exploration.
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={130}>
                  <div className="story-step">
                    <span className="story-step-number">02</span>
                    <ShoppingBag size={19} />
                    <h3>Explore</h3>
                    <p>
                      Dishes become richer through descriptions, suggestions,
                      3D experiences and intelligent discovery.
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={180}>
                  <div className="story-step">
                    <span className="story-step-number">03</span>
                    <Flame size={19} />
                    <h3>Prepare</h3>
                    <p>
                      Orders move directly into a visual kitchen flow with
                      clear priorities and preparation timers.
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={230}>
                  <div className="story-step">
                    <span className="story-step-number">04</span>
                    <RefreshCcw size={19} />
                    <h3>Return</h3>
                    <p>
                      Preferences and interactions become signals that help
                      the restaurant build stronger repeat relationships.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <section id="features" className="feature-section">
            <div className="feature-section-inner">
              <Reveal>
                <div className="feature-head">
                  <h2>
                    Everything important,
                    <br />
                    <em>beautifully connected.</em>
                  </h2>

                  <p>
                    PRATYEKSHa is not one giant screen full of controls. It is
                    a collection of focused experiences that share the same
                    restaurant data.
                  </p>
                </div>
              </Reveal>

              <div className="feature-grid">
                {[
                  {
                    icon: QrCode,
                    title: "Smart QR Menu",
                    text: "A branded digital menu built for fast discovery and easy ordering.",
                  },
                  {
                    icon: Sparkles,
                    title: "3D Dish Experience",
                    text: "Let guests understand a dish before they decide to order it.",
                  },
                  {
                    icon: Flame,
                    title: "Kitchen Display",
                    text: "Live tickets, preparation states, priorities and timers in one flow.",
                  },
                  {
                    icon: Boxes,
                    title: "Smart Inventory",
                    text: "Connect ingredients, recipes and availability without hiding useful menu data.",
                  },
                  {
                    icon: ReceiptIndianRupee,
                    title: "GST Billing",
                    text: "GST-ready billing with flexible payment and settlement flows.",
                  },
                  {
                    icon: Users,
                    title: "Customer Memory",
                    text: "Remember meaningful ordering behavior to make future visits more personal.",
                  },
                  {
                    icon: MessageCircle,
                    title: "WhatsApp Marketing",
                    text: "Reach customers with campaigns based on actual restaurant interactions.",
                  },
                  {
                    icon: Brain,
                    title: "Intelligence",
                    text: "Convert restaurant activity into useful patterns and actionable signals.",
                  },
                  {
                    icon: Settings2,
                    title: "Operator Control",
                    text: "A focused operating layer for menus, staff, tables and daily workflows.",
                  },
                ].map((feature, index) => {
                  const Icon = feature.icon;

                  return (
                    <Reveal key={feature.title} delay={(index % 3) * 70}>
                      <div className="feature-card">
                        <span className="feature-card-index">
                          0{index + 1}
                        </span>

                        <div className="feature-card-icon">
                          <Icon size={17} />
                        </div>

                        <h3>{feature.title}</h3>

                        <p>{feature.text}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="intelligence" className="numbers">
            <Reveal>
              <div className="numbers-grid">
                <div className="number">
                  <strong>01</strong>
                  <span>Connected restaurant system</span>
                </div>

                <div className="number">
                  <strong>05</strong>
                  <span>Core digital layers</span>
                </div>

                <div className="number">
                  <strong>24/7</strong>
                  <span>Restaurant visibility</span>
                </div>

                <div className="number">
                  <strong>360°</strong>
                  <span>Customer journey view</span>
                </div>
              </div>
            </Reveal>
          </section>

          <section className="cta">
            <div className="cta-decoration" />

            <Reveal>
              <div className="cta-content">
                <span className="eyebrow">Ready when you are</span>

                <h2>
                  Your restaurant
                  <br />
                  deserves a <em>better layer.</em>
                </h2>

                <p>
                  See how PRATYEKSHa can fit into your restaurant's existing
                  workflow without turning the experience into another
                  complicated system.
                </p>

                <button
                  className="gold-button"
                  onClick={() => setDemoOpen(true)}
                >
                  Book a private demo <ArrowUpRight size={15} />
                </button>
              </div>
            </Reveal>
          </section>
        </main>

        <footer className="footer">
          <div className="footer-inner">
            <div className="logo">
              <span className="logo-mark" />
              <span className="logo-text">
                PRATYEKSH<span>a</span>
              </span>
            </div>

            <div className="footer-links">
              <button onClick={() => scrollTo("system")}>System</button>
              <button onClick={() => scrollTo("features")}>Features</button>
              <button onClick={() => setDemoOpen(true)}>Demo</button>
            </div>

            <div className="footer-copy">
              © 2026 PRATYEKSHa. Restaurant experience system.
            </div>
          </div>
        </footer>

        {demoOpen && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setDemoOpen(false);
              }
            }}
          >
            <div className="modal">
              <button
                className="modal-close"
                onClick={() => setDemoOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <span className="eyebrow">Private demonstration</span>

              <h2>Let's show you the system.</h2>

              <p>
                Leave your email and the PRATYEKSHa team can connect with you
                for a walkthrough of the restaurant experience platform.
              </p>

              <form className="demo-form" onSubmit={submitDemo}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                <button type="submit">
                  <Send size={15} />
                </button>
              </form>

              {demoStatus && <div className="demo-status">{demoStatus}</div>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}



