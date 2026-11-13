/**
 * PRATYEKSHA OWNER — Owner-facing PWA
 * ────────────────────────────────────────────────────────────────
 * Mount this at /owner/:tenantId/* inside your existing router:
 *
 *   import OwnerApp from './OwnerApp/PratyekshaOwnerApp';
 *   <Route path="/owner/:tenantId/*" element={<OwnerApp />} />
 *
 * No JWT / auth-verify is included here by design — every call is
 * scoped by :tenantId only, matching the rest of server.js.
 *
 * Requires: react-router-dom, axios, socket.io-client, recharts,
 * lucide-react (all already in the Pratyeksha dependency tree).
 */
import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, useId } from 'react';
import SupportContact from './SupportContact.jsx';
import { Routes, Route, NavLink, useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RenewalReminder } from './SubscriptionGate.jsx';
import DiscoveryAnalytics from './DiscoveryAnalytics.jsx';
import { ForgotLink } from './ForgotPassword.jsx';
import { PxAuthShell, PxCard, PxField, PxButton, PxLink, PxDivider, PxAlert, PxSecure, PxStrength, passwordIssues, PX } from './AuthKit.jsx';
import { Crown as PxCrown, Mail as PxMail, Lock as PxLock, User as PxUser, KeyRound as PxKey, UserPlus as PxUserPlus } from 'lucide-react';
import {
  LayoutDashboard, TrendingUp, PieChart as PieIcon, UtensilsCrossed, Package, ChefHat,
  Users, UserCircle2,  ShieldCheck, ClipboardList, Settings as SettingsIcon, LogOut,
  ChevronDown, ChevronRight, ChevronLeft, ArrowUpRight, ArrowDownRight, LayoutGrid, Wallet,
  Target, AlertTriangle, CheckCircle2, Clock, Flame, Sparkles, Download, Send, Phone, Store, Copy,
  Menu as MenuIcon, X, RefreshCcw, Eye, EyeOff, IndianRupee, Percent, TrendingDown, Boxes,
  Timer, Megaphone, MapPin, Star, Gauge, CalendarClock, FileSpreadsheet, FileText, Mail,
  Search, Filter, MoreVertical, Plus, Minus, Check, ShoppingBag, Truck, CreditCard, Banknote,
  Smartphone, UserCheck, UserX, Award, ThumbsUp, PackageX, PackageCheck, Zap, Activity,
  Receipt, ExternalLink, WifiOff, Loader2, BarChart3, Rocket, Shield, PlayCircle, Quote,
  Lock, ArrowLeftRight
  , Crosshair,
  LifeBuoy, Lightbulb,
} from 'lucide-react';
import SpoonForkIcon from './SpoonForkIcon.jsx';
const Bell = SpoonForkIcon; // crossed spoon & fork instead of the bell
import './bklit.css';
import { BkArea, BkLine, BkColumns, BkHBars, BkDonut, BkMiniBars, BkGauge, BkRings } from './ownerCharts.jsx';
import { OwnerMotion, PageTransition } from './ownerMotion.jsx';
import AlertsView from './OwnerAlerts.jsx';
import KitchenView from './OwnerKitchen.jsx';
import { motion as Motion, AnimatePresence } from 'motion/react'; // alias keeps this project's lint (which misses <Motion.x> JSX uses) clean

/* ════════════════════════════════════════════════════════════
   THEME — identical to Pratyeksha's design system
   ════════════════════════════════════════════════════════════ */
const T = {
  primary: '#d3bfa2',
  primarySoft: 'rgba(211,191,162,0.14)',
  bg: '#101012',
  surface: '#1a1a1d',
  surfaceRaised: '#1a1a1d',
  border: 'rgba(211,191,162,0.12)',
  borderStrong: 'rgba(211,191,162,0.24)',
  textHigh: '#ffffff',
  // Same white as before, slightly more opaque: 55% / 42% fell below the 4.5:1 contrast minimum for small text.
  textMed: 'rgba(255,255,255,0.66)',
  textLow: 'rgba(255,255,255,0.52)',
  danger: 'rgba(214,109,39,0.92)',
  dangerSoft: 'rgba(214,109,39,0.14)',
  warning: 'rgba(226,154,88,0.9)',
  warningSoft: 'rgba(226,154,88,0.12)',
  success: '#d3bfa2',
  successSoft: 'rgba(211,191,162,0.14)',
  mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
  font: "'Poppins', -apple-system, sans-serif",
  ease: 'cubic-bezier(.4,0,.2,1)',
  glow: '0 0 0 1px rgba(211,191,162,0.06), 0 12px 32px -12px rgba(0,0,0,0.55)',
  glowHover: '0 0 0 1px rgba(211,191,162,0.18), 0 20px 44px -14px rgba(0,0,0,0.7), 0 0 32px -8px rgba(211,191,162,0.12)',
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
    /* Lock the page to exactly one viewport and neutralise Vite/CRA boilerplate CSS
       (#root max-width, body flex-centering) — this app manages its own internal
       scroll regions (sidebar + main pane) rather than relying on document scroll,
       so it works no matter what the host page's outer CSS does. */
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }
    body {
      display: block !important; place-items: unset !important; min-width: 0 !important;
      background: ${T.bg};
    }
    #root {
      max-width: none !important; width: 100% !important; height: 100% !important;
      margin: 0 !important; padding: 0 !important; text-align: left !important; display: block !important;
    }
    .pown * { box-sizing: border-box; }
    .pown {
      font-family: ${T.font}; color: ${T.textHigh}; -webkit-font-smoothing: antialiased;
      height: 100vh; width: 100%; overflow: hidden;
      background:
        radial-gradient(ellipse 1100px 620px at 14% -8%, rgba(211,191,162,0.09), transparent 60%),
        radial-gradient(ellipse 900px 560px at 100% 0%, rgba(211,191,162,0.055), transparent 55%),
        radial-gradient(ellipse 1400px 900px at 50% 110%, rgba(211,191,162,0.035), transparent 60%),
        ${T.bg};
      background-attachment: fixed;
    }
    .pown-scrollpane { overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; scroll-behavior: smooth; }
    .pown ::selection { background: ${T.primarySoft}; color: ${T.primary}; }
    .pown-scroll::-webkit-scrollbar, ::-webkit-scrollbar { width: 7px; height: 7px; }
    .pown-scroll::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb { background: ${T.borderStrong}; border-radius: 10px; }
    .pown-scroll::-webkit-scrollbar-track, ::-webkit-scrollbar-track { background: transparent; }
    .pown-mono { font-family: ${T.mono}; font-variant-numeric: tabular-nums; }
    .pown-fade-in { animation: pownFadeIn .4s ${T.ease} both; }
    @keyframes pownFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .pown-pulse { animation: pownPulse 1.8s ease-in-out infinite; }
    @keyframes pownPulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
    @keyframes pownSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pown-skel { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%); background-size: 400% 100%; animation: pownShimmer 1.6s ease infinite; border-radius: 10px; }
    @media (prefers-reduced-motion: reduce) { .pown-skel { animation: none; } }
    @keyframes pownShimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
    .pown-btn { cursor: pointer; border: none; font-family: inherit; transition: transform .15s ${T.ease}, opacity .15s ease, background .2s ease, box-shadow .2s ease, border-color .2s ease; }
    .pown-btn:active { transform: scale(0.96); }
    .pown-row-hover { transition: background .15s ease; }
    .pown-row-hover:hover { background: rgba(211,191,162,0.035); }
    .pown-nav-link { transition: color .18s ease, background .18s ease; position: relative; }
    a.pown-nav-link, a.pown-nav-link:visited { text-decoration: none; }
    .pown-card { transition: transform .25s ${T.ease}, border-color .25s ${T.ease}, box-shadow .25s ${T.ease}; }
    .pown-card-hover:hover { transform: translateY(-3px); border-color: ${T.borderStrong} !important; box-shadow: ${T.glowHover}; }
    .pown-kpi:hover .pown-kpi-icon { transform: scale(1.08) rotate(-4deg); }
    .pown-kpi-icon { transition: transform .3s ${T.ease}; }
    .pown-hide-scroll::-webkit-scrollbar { display: none; }
    .pown-hide-scroll { scrollbar-width: none; }
    .pown-gradient-text {
      background: linear-gradient(120deg, #f0e6d6 0%, ${T.primary} 55%, #b89f7c 100%);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .pown-shimmer-btn { position: relative; overflow: hidden; }
    .pown-shimmer-btn::after {
      content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
      transform: skewX(-20deg); transition: left .6s ${T.ease};
    }
    .pown-shimmer-btn:hover::after { left: 130%; }
    .pown-stagger > * { animation: pownFadeIn .5s ${T.ease} both; }
    .pown-stagger > *:nth-child(1) { animation-delay: .02s; }
    .pown-stagger > *:nth-child(2) { animation-delay: .07s; }
    .pown-stagger > *:nth-child(3) { animation-delay: .12s; }
    .pown-stagger > *:nth-child(4) { animation-delay: .17s; }
    .pown-stagger > *:nth-child(5) { animation-delay: .22s; }
    .pown-stagger > *:nth-child(6) { animation-delay: .27s; }
    .pown-divider { height: 1px; background: linear-gradient(90deg, ${T.border}, transparent 85%); border: none; margin: 4px 0 16px; }
    .pown-live-dot { position: relative; }
    .pown-live-dot::before {
      content: ''; position: absolute; inset: -4px; border-radius: 50%;
      border: 1px solid ${T.primary}; opacity: 0; animation: pownRing 2.2s ease-out infinite;
    }
    @keyframes pownRing { 0% { opacity: .55; transform: scale(0.6); } 100% { opacity: 0; transform: scale(2.1); } }
    .pown-page-transition { animation: pownPageIn .38s cubic-bezier(.4,0,.2,1) both; }
    @keyframes pownPageIn { from { opacity: 0; transform: translateY(8px) scale(0.994); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @media (max-width: 640px) { .pown-hide-mobile { display: none !important; } }

    /* ── Keyboard focus: every control gets a visible ring (the old styles removed outlines and added none) ── */
    .pown button:focus-visible, .pown a:focus-visible, .pown [role="switch"]:focus-visible, .pown summary:focus-visible {
      outline: 2px solid ${T.primary}; outline-offset: 2px; border-radius: 10px;
    }
    .pown input:focus-visible, .pown select:focus-visible, .pown textarea:focus-visible {
      outline: none; border-color: ${T.primary} !important; box-shadow: 0 0 0 3px ${T.primarySoft};
    }
    .pown input, .pown select, .pown textarea { transition: border-color .15s ease, box-shadow .15s ease; }
    .pown input::placeholder, .pown textarea::placeholder { color: rgba(255,255,255,0.38); }
    .pown input[type="date"], .pown input[type="month"], .pown input[type="time"] { color-scheme: dark; }

    /* ── Readable line length on very wide screens: content is centred instead of stretching edge to edge ── */
    .pown-content { width: 100%; max-width: 1320px; margin: 0 auto; overflow-x: clip; }
    /* Mobile hardening: grid/flex children may shrink below their content, and media never exceeds its card */
    .pown-content > *, .pown-card { min-width: 0; }
    .pown svg, .pown img, .pown canvas { max-width: 100%; }
    .pown-card h2, .pown-card h3 { overflow-wrap: anywhere; }
    /* Phones: modals become bottom sheets (thumb reach, no clipped corners, respects the home indicator) */
    @media (max-width: 520px) {
      .pown-modal-bg { align-items: flex-end !important; padding: 0 !important; }
      .pown-modal { width: 100% !important; max-width: 100% !important; max-height: 92vh !important; border-radius: 22px 22px 0 0 !important; padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px)) !important; }
      .pown-card { border-radius: 16px !important; }
      .pown-split-main, .pown-grid-2 { gap: 12px !important; }
    }


    /* ── Tables: quiet header, roomy rows, sticky header inside scroll panes ── */
    .pown table { border-collapse: separate; border-spacing: 0; }
    .pown table thead th {
      position: sticky; top: 0; z-index: 1; background: ${T.surface};
      font-size: 10.5px; font-weight: 700; letter-spacing: 0.9px; text-transform: uppercase; color: ${T.textLow};
      border-bottom: 1px solid ${T.borderStrong};
    }
    .pown table tbody tr { transition: background .15s ease; }
    .pown table tbody tr:hover { background: rgba(211,191,162,0.045); }
    .pown table tbody td { border-bottom: 1px solid rgba(255,255,255,0.045); }
    .pown table tbody tr:last-child td { border-bottom: none; }

    /* ── Navigation ── */
    .pown-nav-group { font-size: 10px; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; color: rgba(211,191,162,0.72); padding: 14px 12px 6px; }
    .pown-nav-link:hover { background: rgba(255,255,255,0.045) !important; color: #f1ede4 !important; }
    .pown-nav-link.active { background: linear-gradient(135deg, rgba(211,191,162,0.22), rgba(211,191,162,0.06)) !important; color: #f7f3eb !important; }
    .pown-nav-link.active svg { color: ${T.primary}; }

    /* ── Touch devices: comfortable targets for the small icon-only and pill controls ── */
    @media (pointer: coarse) { .pown-btn { min-height: 38px; } }

    /* Phones: the live-activity strip becomes a tidy two-column grid (it stacked into one tall list with stray dividers) */
    @media (max-width: 640px) {
      .pown-strip { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 12px !important; }
      .pown-strip > .pown-strip-divider { display: none !important; }
    }

    /* Phones: KPI rows sit two per row instead of one tall card each */
    @media (max-width: 520px) {
      .pown-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
      .pown-kpi-grid .pown-kpi { padding: 14px !important; min-height: 104px !important; }
      .pown-kpi-grid .pown-kpi > .pown-mono { font-size: 21px !important; }
    }

    @media (prefers-reduced-motion: reduce) {
      .pown *, .pown *::before, .pown *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
    }

    /* ── Responsive grid utilities — fixed-column grids that would otherwise
       squash illegibly on phones instead collapse to fewer columns. ── */
    .pown-split-main { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(0,1fr); gap: 14px; }
    @media (max-width: 860px) { .pown-split-main { grid-template-columns: 1fr; } }
    .pown-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 520px) { .pown-grid-2 { grid-template-columns: 1fr; } }
    .pown-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    @media (max-width: 480px) { .pown-grid-3 { grid-template-columns: 1fr; } }
    .pown-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    @media (max-width: 560px) { .pown-grid-4 { grid-template-columns: repeat(2, 1fr); } }

    /* ── Tables: force a real horizontal scroll instead of squashing columns
       into illegibility, with a visible cue that there's more off-screen. ── */
    .pown-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .pown-scroll-hint { display: none; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 700; color: ${T.textLow}; padding: 0 20px 10px; }
    @media (max-width: 780px) { .pown-scroll-hint { display: flex; } }

    /* ── Sticky footers inside <main> must clear the fixed mobile bottom nav. ── */
    .pown-sticky-footer { position: sticky; bottom: 14px; z-index: 10; }
    @media (max-width: 1023px) { .pown-sticky-footer { bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 14px); } }

    /* Soft fade at the top/bottom edge of the sidebar's scrollable tab list,
       so it reads as its own independent scroll region. */
    .pown-sidebar-fade { mask-image: linear-gradient(to bottom, transparent 0, black 14px, black calc(100% - 14px), transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0, black 14px, black calc(100% - 14px), transparent 100%); }

    /* Soft drifting glow orbs behind the auth screens */
    .pown-auth-glow {
      position: absolute; width: 320px; height: 320px; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(211,191,162,0.16) 0%, transparent 70%);
      filter: blur(10px); animation: pownDrift 12s ease-in-out infinite alternate;
    }
    @keyframes pownDrift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(18px,-14px) scale(1.08); } }
  `}</style>
);

/* ════════════════════════════════════════════════════════════
   API + SOCKET CONTEXT
   ════════════════════════════════════════════════════════════ */
// Point this at your deployed backend (matches server.js CORS origins).
const API_BASE = (((typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:10000').replace(/\/api\/?$/, ''));
const BRAND_LOGO = '/pratyeksha-logo.png';

const api = axios.create({ baseURL: API_BASE });

// Any 401 from the API (expired/invalid token) broadcasts a single event —
// OwnerProvider listens for it and drops back to the login screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) window.dispatchEvent(new Event('owner-auth-expired'));
    // A subscription that expires or is paused mid-session answers 402 on every call; only 401 was handled, so each page just showed a generic load error.
    else if (err?.response?.status === 402) {
      // This instance is separate from the global axios one, so the app-wide renewal screen never heard about expiries seen here.
      if (err.response.data?.code === 'SUBSCRIPTION_EXPIRED') window.dispatchEvent(new CustomEvent('px-subscription-expired', { detail: err.response.data }));
      window.dispatchEvent(new CustomEvent('owner-subscription-blocked', { detail: err.response.data?.error || '' }));
    }
    return Promise.reject(err);
  }
);

const OwnerCtx = createContext(null);
const useOwner = () => useContext(OwnerCtx);
const LAST_TENANT_KEY = 'pratyeksha_owner_last_tenant';
const tokenKeyFor = (tenantId) => `pratyeksha_owner_token_${tenantId}`;

/** Turns an axios error into a specific, actionable message instead of a generic failure. */
function describeAuthError(err, url) {
  if (err?.response) {
    const status = err.response.status;
    const serverMsg = err.response.data?.error;
    if (status === 404) return `The server responded, but this tenant ID wasn't found (404). Check the tenant ID in the URL is exactly right.\n\nRequest: ${url}`;
    return `Server responded with an error (${status}): ${serverMsg || 'no message'}\n\nRequest: ${url}`;
  }
  if (err?.request) {
    return `No response from the server — this is almost always a wrong API URL or a CORS block.\n\n` +
      `Request: ${url}\n\n` +
      `Check: 1) VITE_API_URL is set to your actual backend address (currently: ${API_BASE}) 2) your backend's CORS config allows this site's origin 3) the backend is actually running.`;
  }
  return `Request failed before it was sent: ${err?.message || 'unknown error'}\n\nRequest: ${url}`;
}

function OwnerProvider({ tenantId, children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState(null);
  const [liveAdminNotification, setLiveAdminNotification] = useState(null);
  const [liveOrderEvent, setLiveOrderEvent] = useState(null);
  const [liveStockEvent, setLiveStockEvent] = useState(null);
  const [liveStaffEvent, setLiveStaffEvent] = useState(null);
  const [outlet, setOutlet] = useState(tenantId);

  // authStatus: 'checking' | 'needsSetup' | 'needsLogin' | 'authed' | 'error'
  const [authStatus, setAuthStatus] = useState('checking');
  const [authToken, setAuthToken] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  const [supportView, setSupportView] = useState(false);
  const [authErrorDetail, setAuthErrorDetail] = useState(null);
  const [authBlocked, setAuthBlocked] = useState(false); // true when the server refused because the subscription expired / the account is paused
  const authSeq = useRef(0);

  /**
   * Sets (or clears) the axios default header immediately, as a plain object
   * mutation — not through a useEffect. This matters: React fires a child
   * component's mount effects (e.g. the Dashboard's first data fetch)
   * BEFORE this provider's own effects in the same commit, so a
   * useEffect([authToken]) here can lose the race and send the first
   * request with no Authorization header at all, producing a 401 the
   * instant login succeeds. Calling this synchronously, right before the
   * state update that reveals the authenticated app, closes that gap.
   */
  const applyAuthHeader = (token) => {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
  };

  const resolveAuth = useCallback(async () => {
    // `cancelled` used to be a local that nothing ever set, so a slow check for the previous outlet could finish after the outlet changed
    // and overwrite the token / status of the new one. Only the latest call may apply its result.
    const mySeq = ++authSeq.current;
    const cancelled = () => mySeq !== authSeq.current;
    applyAuthHeader(null); // never carry the previous outlet's token into this check
    setAuthStatus('checking');
    setAuthErrorDetail(null);
    setAuthBlocked(false);
    let stored = null;
    // Support view from Master Admin: a short-lived token in the URL hash. It is kept in memory only
    // (never saved), so it cannot replace the owner's own saved login.
    let viaSupport = false;
    try {
      const m = /[#&]viewas=([^&]+)/.exec(window.location.hash || '');
      if (m) { stored = decodeURIComponent(m[1]); viaSupport = true; }
    } catch (e) {}
    if (!viaSupport) { try { stored = localStorage.getItem(tokenKeyFor(outlet)); } catch (e) {} }
    setSupportView(false);

    if (stored) {
      try {
        const res = await axios.get(`${API_BASE}/api/owner/auth/verify`, { headers: { Authorization: `Bearer ${stored}` } });
        if (cancelled()) return;
        applyAuthHeader(stored);
        setAuthToken(stored);
        setOwnerName(res.data.ownerName || '');
        if (viaSupport) setSupportView(true);
        setAuthStatus('authed');
        return;
      } catch (e) {
        if (cancelled()) return;
        // 402 = subscription expired / account paused: say that plainly instead of a "couldn't reach the server" screen.
        if (e?.response?.status === 402) {
          setAuthErrorDetail(e.response.data?.error || 'This account is unavailable. Please contact Pratyeksha support.');
          setAuthBlocked(true);
          setAuthStatus('error');
          return;
        }
        // A 401 here just means the token expired — fall through to a normal
        // status check. Anything else (network/CORS/server down) should NOT
        // be silently treated as "token invalid, ask for login" — surface it.
        if (e?.response?.status && e.response.status !== 401) {
          setAuthErrorDetail(describeAuthError(e, `${API_BASE}/api/owner/auth/verify`));
          setAuthStatus('error');
          return;
        }
        applyAuthHeader(null);
        if (!viaSupport) { try { localStorage.removeItem(tokenKeyFor(outlet)); } catch (e2) {} }
      }
    }
    try {
      const res = await axios.get(`${API_BASE}/api/owner/auth/status/${outlet}`);
      if (cancelled()) return;
      setAuthStatus(res.data.setupComplete ? 'needsLogin' : 'needsSetup');
    } catch (e) {
      // Never guess between Setup/Login on a failed request — a wrong
      // API URL, CORS block, or downed server must never look like a
      // legitimate "please log in" screen, or the real problem gets hidden.
      if (!cancelled()) {
        console.error('[owner-auth] status check failed:', e);
        setAuthErrorDetail(describeAuthError(e, `${API_BASE}/api/owner/auth/status/${outlet}`));
        setAuthStatus('error');
      }
    }
  }, [outlet]);

  // Resolve auth state whenever the outlet changes.
  useEffect(() => { resolveAuth(); }, [resolveAuth]);

  const completeAuth = useCallback((token, name) => {
    try { localStorage.setItem(tokenKeyFor(outlet), token); } catch (e) {}
    applyAuthHeader(token);
    setAuthToken(token);
    setOwnerName(name || '');
    setAuthStatus('authed');
  }, [outlet]);

  const logout = useCallback(() => {
    try { localStorage.removeItem(tokenKeyFor(outlet)); } catch (e) {}
    applyAuthHeader(null);
    setAuthToken(null);
    setAuthStatus('needsLogin');
  }, [outlet]);

  useEffect(() => {
    window.addEventListener('owner-auth-expired', logout);
    return () => window.removeEventListener('owner-auth-expired', logout);
  }, [logout]);

  useEffect(() => {
    const onBlocked = (ev) => {
      setAuthErrorDetail(ev?.detail || 'This account is unavailable. Please contact Pratyeksha support.');
      setAuthBlocked(true);
      setAuthStatus(cur => (cur === 'authed' ? 'error' : cur));
    };
    window.addEventListener('owner-subscription-blocked', onBlocked);
    return () => window.removeEventListener('owner-subscription-blocked', onBlocked);
  }, []);

  // Only open the realtime connection once actually authenticated.
  useEffect(() => {
    if (authStatus !== 'authed') return;
    const s = io(API_BASE, { transports: ['websocket', 'polling'], auth: { token: authToken } });
    s.on('connect', () => { setConnected(true); s.emit('join_owner_room', outlet); s.emit('join_restaurant', outlet); });
    s.on('disconnect', () => setConnected(false));
    s.on('owner_alert', (payload) => setLiveAlert({ ...payload, _t: Date.now() }));
    s.on('admin_notification', (payload) => setLiveAdminNotification({ ...payload, _t: Date.now() }));
    // Real-time order lifecycle events — the same ones the Kitchen/Operator
    // views already listen for. Without these, every order-dependent number
    // (live tables, kitchen queue, today's revenue) only ever updated on the
    // next poll — up to 60s stale, which is exactly what made the dashboard
    // disagree with a kitchen that had already cleared.
    s.on('new_order', () => setLiveOrderEvent({ type: 'new_order', _t: Date.now() }));
    s.on('order_status_updated', (order) => setLiveOrderEvent({ type: 'order_status_updated', order, _t: Date.now() }));
    s.on('order_voided', (payload) => setLiveOrderEvent({ type: 'order_voided', order: payload, _t: Date.now() }));
    // Kitchen (KDS) activity: dish started / crossed off, and ticket edits. Without these the
    // owner's Kitchen page only caught up on its 20s poll.
    s.on('kds_item_timing_updated', () => setLiveOrderEvent({ type: 'kds_item_timing_updated', _t: Date.now() }));
    s.on('order_modification_detected', () => setLiveOrderEvent({ type: 'order_modification_detected', _t: Date.now() }));
    // Stock/menu events — same idea: these already fire from the backend
    // (inventory deduction, low-stock threshold, 86'd dish), the Owner App
    // just never listened. Wired to Inventory + Menu pages below.
    s.on('low_stock_alert', () => setLiveStockEvent({ type: 'low_stock_alert', _t: Date.now() }));
    s.on('ingredient_out_of_stock', () => setLiveStockEvent({ type: 'ingredient_out_of_stock', _t: Date.now() }));
    s.on('menu_updated', () => setLiveStockEvent({ type: 'menu_updated', _t: Date.now() }));
    // Service requests, reservations, wastage — same treatment: the backend
    // already broadcasts these, the app just wasn't listening.
    s.on('new_waiter_request', () => setLiveOrderEvent({ type: 'new_waiter_request', _t: Date.now() }));
    s.on('waiter_request_resolved', () => setLiveOrderEvent({ type: 'waiter_request_resolved', _t: Date.now() }));
    s.on('new_reservation', () => setLiveOrderEvent({ type: 'new_reservation', _t: Date.now() }));
    s.on('reservation_updated', () => setLiveOrderEvent({ type: 'reservation_updated', _t: Date.now() }));
    s.on('wastage_logged', () => setLiveStockEvent({ type: 'wastage_logged', _t: Date.now() }));
    s.on('inventory_updated', () => setLiveStockEvent({ type: 'inventory_updated', _t: Date.now() }));
    // Staff attendance — backend fix (separate patch) adds these emits;
    // without them clock-in/out had literally no real-time path at all.
    s.on('staff_clocked_in', () => setLiveStaffEvent({ type: 'staff_clocked_in', _t: Date.now() }));
    s.on('staff_clocked_out', () => setLiveStaffEvent({ type: 'staff_clocked_out', _t: Date.now() }));
    setSocket(s);
    return () => s.disconnect();
  }, [outlet, authStatus, authToken]);

  // Remember the active outlet so relaunching the installed app (which opens
  // at the generic /owner/ start_url) can jump straight back to it.
  useEffect(() => {
    if (outlet && authStatus === 'authed') { try { localStorage.setItem(LAST_TENANT_KEY, outlet); } catch (e) {} }
  }, [outlet, authStatus]);

  const value = useMemo(() => ({
    tenantId: outlet, setOutlet, socket, connected, liveAlert, liveAdminNotification, liveOrderEvent, liveStockEvent, liveStaffEvent,
    authStatus, ownerName, supportView, completeAuth, logout, authErrorDetail, authBlocked, retryAuth: resolveAuth
  }), [outlet, socket, connected, liveAlert, liveAdminNotification, liveOrderEvent, liveStockEvent, liveStaffEvent, authStatus, ownerName, supportView, completeAuth, logout, authErrorDetail, authBlocked, resolveAuth]);
  return <OwnerCtx.Provider value={value}>{children}</OwnerCtx.Provider>;
}

/** Gates the app behind auth — shows a splash while checking, then Setup/Login/Error/the real app. */
function AuthGate({ children }) {
  const { authStatus, supportView } = useOwner();
  if (authStatus === 'checking') return <AuthSplash />;
  if (authStatus === 'error') return <AuthErrorScreen />;
  if (authStatus === 'needsSetup') return <SetupScreen />;
  if (authStatus === 'needsLogin') return <LoginScreen />;
  if (supportView) return (<>
    <div role="status" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100000, background: '#d3bfa2', color: '#141416', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '5px 10px', letterSpacing: 0.3 }}>Support view — you are seeing this as the client. Access expires in 30 minutes and is logged.</div>
    <div style={{ paddingTop: 28 }}>{children}</div>
  </>);
  return children;
}

/** Generic fetch-with-loading hook, scoped to the active tenant, auto-refreshing. */
function useOwnerData(path, { refreshMs = 0, params = {} } = {}) {
  const { tenantId } = useOwner();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);
  const reqSeq = useRef(0);
  const dataRef = useRef(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  const fetchData = useCallback(async (silent) => {
    const mySeq = ++reqSeq.current;
    if (!silent) { setLoading(true); setError(null); }
    try {
      const res = await api.get(path.replace(':tenantId', tenantId), { params });
      if (mySeq !== reqSeq.current) return;
      setData(res.data); setError(null);
    } catch (e) {
      if (mySeq !== reqSeq.current) return;
      // A background refresh that fails (a brief network blip) used to swap the whole page for an error screen even though good data was
      // already showing. Keep what is on screen; only a foreground load, or a page with nothing yet, shows the error.
      if (silent && dataRef.current != null) return;
      setError(e?.response?.data?.error || e.message || 'Failed to load');
    } finally {
      if (mySeq === reqSeq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tenantId, paramsKey]);

  useEffect(() => { fetchData(false); }, [fetchData]);
  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(() => { if (typeof document === 'undefined' || !document.hidden) fetchData(true); }, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, fetchData]);

  // Retry on the error screen must show a spinner; refreshes behind existing data stay silent.
  return { data, loading, error, refetch: () => fetchData(dataRef.current != null) };
}

/* ════════════════════════════════════════════════════════════
   PWA — installable app (manifest + service worker + install prompt)
   Files referenced below (/owner-manifest.webmanifest, /owner-sw.js,
   /pwa/icon-*.png) must be placed in your Vite project's /public folder
   — see the deployment note at the bottom of this file.
   ════════════════════════════════════════════════════════════ */
function usePwaInstall() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Inject manifest link + theme-color + apple touch icon once, scoped to this app.
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/owner-manifest.webmanifest';
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color'; meta.content = '#1a1a1d';
      document.head.appendChild(meta);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/pwa/apple-touch-icon.png';
      document.head.appendChild(link);
    }

    // Register the service worker, scoped only to /owner/ so it never
    // touches the customer menu / kitchen / admin routes.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/owner-sw.js', { scope: '/owner/' }).catch(() => {});
    }

    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone);
    setInstalled(window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true);

    const onBeforeInstall = (e) => { e.preventDefault(); setInstallEvent(e); };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return 'unavailable';
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setInstallEvent(null);
    return outcome;
  };

  // canInstall: a real one-click native prompt is available (Chrome/Edge/Android/desktop).
  // isIos: no native prompt exists on iOS Safari — show manual "Add to Home Screen" steps instead.
  return { canInstall: !!installEvent, installed, isIos, promptInstall };
}

/* ════════════════════════════════════════════════════════════
   EXPORT HELPERS — Excel (SheetJS) + branded PDF (jsPDF)
   Requires: npm i xlsx jspdf jspdf-autotable
   ════════════════════════════════════════════════════════════ */
const rupee = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
const todayLabel = () => new Date(Date.now() + 330 * 60000).toISOString().split('T')[0];

/** sheets: [{ name, rows: [{col: val, ...}, ...] }] */
function downloadExcel(filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows && rows.length ? rows : [{ 'No data': '—' }]);
    const colWidths = Object.keys(rows?.[0] || { 'No data': 1 }).map(k => ({ wch: Math.max(12, k.length + 2) }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}

/** Branded PDF document shell — Pratyeksha gold-on-dark header, tables via autoTable. */
function newBrandedPdf(title, subtitle) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(211, 191, 162);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('PRATYEKSHA', 14, 12);
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
  doc.text(title, 14, 19);
  if (subtitle) { doc.setTextColor(160, 160, 160); doc.setFontSize(8); doc.text(subtitle, 14, 24); }
  doc.setTextColor(20, 20, 20);
  return doc;
}
/** Draws a heading + table, returns the next Y cursor. */
function pdfSection(doc, startY, heading, head, body) {
  let y = startY;
  if (heading) {
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
    doc.text(heading, 14, y);
    y += 4;
  }
  if (head && body) {
    autoTable(doc, {
      startY: y, head: [head], body, theme: 'grid', styles: { fontSize: 8, cellPadding: 2.4 },
      headStyles: { fillColor: [211, 191, 162], textColor: [10, 10, 10], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 245, 241] }, margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 9;
  }
  return y;
}
function savePdf(doc, filename) { doc.save(filename); }

/* ════════════════════════════════════════════════════════════
   UI ATOMS
   ════════════════════════════════════════════════════════════ */
const Card = ({ children, style, padded = true, interactive = false, className = '', ...rest }) => (
  <div
    className={`pown-card${interactive ? ' pown-card-hover' : ''}${className ? ' ' + className : ''}`}
    style={{
      /* Tracking-tab card: glass gradient, gold-tinted hairline, soft inner highlight */
      background: 'linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.016))',
      border: '1px solid rgba(211,191,162,0.16)', borderRadius: 18,
      boxShadow: '0 18px 44px -22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      padding: padded ? '20px 22px' : 0, ...style
    }}
    {...rest}
  >{children}</div>
);

const Label = ({ children, style }) => (
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', color: T.textLow, ...style }}>{children}</div>
);

const SectionHeading = ({ icon: Icon, title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
    <h2 style={{
      fontFamily: 'inherit', fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase', margin: 0, lineHeight: 1.3,
      color: T.primary, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8
    }}>{Icon && <Icon size={13} color={T.primary} strokeWidth={2} />}{title}</h2>
    {action}
  </div>
);

/** Animates a number counting up/down to its new value whenever it changes. */
function useCountUp(target, duration = 700) {
  const numericTarget = Number(target) || 0;
  const [display, setDisplay] = useState(numericTarget);
  // Tracks what is actually on screen. It used to hold the last *finished* target, so a new value arriving mid-animation restarted from
  // a stale number, and returning to that stale number skipped the animation and left a half-way figure showing.
  const shownRef = useRef(numericTarget);
  useEffect(() => {
    const start = shownRef.current;
    const end = numericTarget;
    if (start === end) { setDisplay(end); return; }
    let startTime = null;
    let raf;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min(1, (ts - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const v = progress < 1 ? Math.round(start + (end - start) * eased) : end;
      shownRef.current = v;
      setDisplay(v);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [numericTarget, duration]);
  return display;
}

const Money = ({ value, size = 15, weight = 700, color = T.textHigh, prefix = '\u20B9', animate = true }) => {
  const animated = useCountUp(value);
  const shown = animate ? animated : (Number(value) || 0);
  return (
    <span className="pown-mono" style={{ fontSize: size, fontWeight: weight, color }}>
      {prefix}{shown.toLocaleString('en-IN')}
    </span>
  );
};

const Delta = ({ pct }) => {
  const up = !(Number(pct) < 0);
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: up ? T.primary : T.danger }}>
      <Icon size={12} strokeWidth={2.5} />
      <span className="pown-mono">{Math.abs(Number(pct) || 0)}%</span>
    </span>
  );
};

const Badge = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: { c: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.06)', bd: 'rgba(255,255,255,0.14)' },
    gold: { c: T.primary, bg: 'rgba(211,191,162,0.12)', bd: 'rgba(211,191,162,0.3)' },
    danger: { c: T.danger, bg: T.dangerSoft, bd: 'rgba(226,154,88,0.35)' },
    warning: { c: T.warning, bg: T.warningSoft, bd: 'rgba(226,154,88,0.3)' },
  };
  const s = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100,
      fontSize: 10, fontWeight: 800, letterSpacing: 0.5, background: s.bg, color: s.c, border: `1px solid ${s.bd}`, textTransform: 'uppercase'
    }}>{children}</span>
  );
};

const ProgressBar = ({ pct, tone = 'gold', height = 8 }) => {
  const colors = { gold: T.primary, danger: T.danger, warning: T.warning };
  return (
    <div style={{ width: '100%', height, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, Number(pct) || 0))}%`, height: '100%', background: `linear-gradient(90deg, #8a704d, ${colors[tone] || T.primary})`, borderRadius: 100, transition: 'width .5s ease' }} />
    </div>
  );
};

const Skeleton = ({ h = 90, style }) => <div className="pown-skel" style={{ height: h, width: '100%', ...style }} />;

const SkeletonGrid = ({ count = 4, h = 108 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => <Skeleton key={i} h={h} />)}
  </div>
);

const EmptyState = ({ icon: Icon = Boxes, title, subtitle }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textLow }}>
    <div style={{ width: 52, height: 52, borderRadius: 16, background: T.primarySoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      <Icon size={24} strokeWidth={1.6} color={T.primary} />
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: T.textHigh }}>{title}</div>
    {subtitle && <div style={{ fontSize: 12.5, marginTop: 4, color: T.textLow }}>{subtitle}</div>}
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <WifiOff size={22} color={T.danger} style={{ marginBottom: 10 }} />
    <div style={{ fontSize: 13, color: T.textMed, marginBottom: 14 }}>{message || 'Could not load this data.'}</div>
    {onRetry && (
      <button type="button" onClick={onRetry} className="pown-btn" style={{
        background: T.primarySoft, color: T.primary, border: `1px solid ${T.borderStrong}`,
        borderRadius: 10, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, display: 'inline-flex', gap: 6, alignItems: 'center'
      }}><RefreshCcw size={13} /> Retry</button>
    )}
  </div>
);

/** Wraps a data section with automatic loading / error / empty handling. */
const DataBoundary = ({ loading, error, empty, emptyProps, onRetry, skeleton, children }) => {
  if (loading) return skeleton || <SkeletonGrid />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (empty) return <EmptyState {...emptyProps} />;
  return children;
};

/* ════════════════════════════════════════════════════════════
   PAGE SKELETONS — one composition per tab, built from the same geometry as the loaded layout
   (KPI cards 118/132 px, 230 px trend charts, donut cards, tables with their real column counts) so nothing jumps when data lands.
   ════════════════════════════════════════════════════════════ */
const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
const skb = (w, h = 10, style) => <Skeleton h={h} style={{ width: w, borderRadius: Math.min(8, h / 2 + 2), flex: '0 0 auto', ...style }} />;
const SkPage = ({ label, children }) => (
  <div role="status" aria-busy="true" aria-live="polite" style={{ display: 'grid', gap: 16 }}>
    <span style={SR_ONLY}>{label}</span>
    <div aria-hidden="true" style={{ display: 'grid', gap: 16 }}>{children}</div>
  </div>
);
const SkHead = ({ w = 130, pill }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{skb(18, 18, { borderRadius: 6 })}{skb(w, 13)}</div>
    {pill && skb(pill, 22, { borderRadius: 100 })}
  </div>
);
const SkKpis = ({ n = 4, min = 180, hero = false }) => (
  <div data-sk="kpis" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 12 }}>
    {Array.from({ length: n }).map((_, i) => (
      <Card key={i} data-sk="kpi" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: hero && i === 0 ? 132 : 118, borderColor: hero && i === 0 ? T.borderStrong : T.border }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{skb(hero && i === 0 ? 112 : 84, 10)}{skb(30, 30, { borderRadius: 9 })}</div>
        {skb(hero && i === 0 ? '58%' : '46%', hero && i === 0 ? 32 : 25, { borderRadius: 8 })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{skb(46, 16, { borderRadius: 100 })}{skb(78, 10)}</div>
      </Card>
    ))}
  </div>
);
const SK_BARS = [34, 46, 40, 58, 52, 70, 62, 78, 66, 84, 72, 60, 74, 88, 80, 68, 76, 92, 84, 70, 62, 78, 66, 56, 72, 64, 52, 60, 48, 56];
const SkChart = ({ title = 140, h = 230, action }) => (
  <Card data-sk="chart">
    <SkHead w={title} pill={action} />
    <div style={{ height: h, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 4px' }}>
      {SK_BARS.map((b, i) => <Skeleton key={i} h={`${b}%`} style={{ flex: 1, borderRadius: '4px 4px 0 0', animationDelay: `${(i % 10) * 0.08}s` }} />)}
    </div>
  </Card>
);
const SkBarsCard = ({ title = 150, rows = 5 }) => (
  <Card data-sk="bars">
    <SkHead w={title} />
    <div style={{ display: 'grid', gap: 14 }}>
      {[88, 70, 58, 40, 28, 20, 14].slice(0, rows).map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{skb(96, 10)}<div style={{ flex: 1 }}>{skb(`${w}%`, 12, { borderRadius: 6 })}</div></div>
      ))}
    </div>
  </Card>
);
const SkDonuts = ({ n = 3, min = 260 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 14 }}>
    {Array.from({ length: n }).map((_, i) => (
      <Card key={i} data-sk="donut">
        <SkHead w={130} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Skeleton h={118} style={{ width: 118, borderRadius: '50%', flex: '0 0 auto', animationDelay: `${i * 0.1}s` }} />
          <div style={{ flex: 1, minWidth: 110, display: 'grid', gap: 11 }}>{[0, 1, 2, 3].map(k => <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{skb(10, 10, { borderRadius: 3 })}{skb(`${64 - k * 9}%`, 10)}</div>)}</div>
        </div>
      </Card>
    ))}
  </div>
);
const SkStats = ({ n = 4, min = 130 }) => (
  <div data-sk="stats" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 10 }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, display: 'grid', gap: 10 }}>{skb(58, 9)}{skb(44, 22, { borderRadius: 7 })}</div>
    ))}
  </div>
);
const SkHealth = ({ title = 150, stats = 4 }) => (
  <Card data-sk="health">
    <SkHead w={title} pill={90} />
    {skb('100%', 9, { borderRadius: 100 })}
    <div style={{ marginTop: 16 }}><SkStats n={stats} min={120} /></div>
  </Card>
);
const SkTable = ({ cols = 5, rows = 6, min = 560, title = 140 }) => (
  <Card padded={false} data-sk="table">
    <div style={{ padding: '18px 20px 14px' }}><SkHead w={title} /></div>
    <div className="pown-scroll" style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: min, padding: '0 20px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)`, gap: 14, padding: '0 0 12px', borderBottom: `1px solid ${T.border}` }}>{Array.from({ length: cols }).map((_, c) => <span key={c}>{skb(c === 0 ? 70 : 52, 9)}</span>)}</div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} data-sk="row" style={{ display: 'grid', gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)`, gap: 14, alignItems: 'center', padding: '13px 0', borderBottom: r < rows - 1 ? `1px solid ${T.border}` : 'none' }}>
            {Array.from({ length: cols }).map((_, c) => <span key={c}>{skb(c === 0 ? `${52 + ((r * 13) % 30)}%` : `${44 + ((r + c) * 11) % 36}%`, 11)}</span>)}
          </div>
        ))}
      </div>
    </div>
  </Card>
);
const SkList = ({ rows = 6, title, padded = true }) => (
  <Card data-sk="list" padded={padded}>
    {title && <SkHead w={title} />}
    <div style={{ display: 'grid' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} data-sk="row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: padded ? '12px 0' : '14px 20px', borderBottom: i < rows - 1 ? `1px solid ${T.border}` : 'none' }}>
          {skb(34, 34, { borderRadius: 10 })}
          <div style={{ flex: 1, display: 'grid', gap: 8 }}>{skb(`${48 + ((i * 17) % 34)}%`, 11)}{skb(`${30 + ((i * 11) % 30)}%`, 9)}</div>
          {skb(56, 20, { borderRadius: 100 })}
        </div>
      ))}
    </div>
  </Card>
);
const SkFields = ({ title = 130, rows = 2, toggles = 0 }) => (
  <Card data-sk="form">
    <SkHead w={title} />
    <div style={{ display: 'grid', gap: 16 }}>
      {Array.from({ length: rows }).map((_, i) => <div key={i} style={{ display: 'grid', gap: 8 }}>{skb(86, 9)}{skb('100%', 40, { borderRadius: 11 })}</div>)}
      {Array.from({ length: toggles }).map((_, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>{skb(`${40 + ((i * 13) % 30)}%`, 11)}{skb(40, 22, { borderRadius: 100 })}</div>)}
    </div>
  </Card>
);
const SkGrid = ({ min = 300, children }) => <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 14 }}>{children}</div>;

const SkDashboard = () => (
  <SkPage label="Loading dashboard…">
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{skb(160, 14)}{skb(90, 14)}</div>
    <SkKpis n={4} min={190} hero />
    <Card data-sk="goal" style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', padding: '14px 20px' }}>
      {skb(54, 54, { borderRadius: '50%' })}
      <div style={{ flex: 1, minWidth: 180, display: 'grid', gap: 10 }}>{skb('46%', 12)}{skb('100%', 8, { borderRadius: 100 })}</div>
      {skb(96, 34, { borderRadius: 11 })}
    </Card>
    <SkChart title={170} h={200} />
    <SkGrid min={300}><SkList rows={4} title={130} /><SkBarsCard title={120} rows={4} /></SkGrid>
  </SkPage>
);
const SkRevenue = () => (<SkPage label="Loading revenue…"><SkKpis n={4} min={180} /><SkChart title={120} h={230} /><SkDonuts n={3} min={260} /><SkChart title={140} h={150} /></SkPage>);
const SkPnl = () => (<SkPage label="Loading profit and loss…"><SkChart title={110} h={200} action={150} /><SkKpis n={3} min={190} /><SkChart title={150} h={200} /><SkBarsCard title={120} rows={6} /></SkPage>);
const SkMenu = () => (<SkPage label="Loading menu analytics…"><SkKpis n={4} min={220} /><SkGrid min={300}><SkBarsCard title={150} rows={7} /><SkDonuts n={1} min={300} /><SkBarsCard title={110} rows={4} /></SkGrid><SkTable cols={6} rows={8} min={640} title={130} /></SkPage>);
const SkInventory = () => (<SkPage label="Loading inventory…"><SkHealth title={120} stats={4} /><SkGrid min={300}><SkDonuts n={1} min={300} /><SkBarsCard title={110} rows={6} /></SkGrid><SkList rows={5} title={110} /><SkList rows={3} title={80} /></SkPage>);
const SkKitchen = () => (<SkPage label="Loading kitchen…"><SkHealth title={150} stats={4} /><SkKpis n={4} min={200} /><SkGrid min={300}><SkChart title={110} h={170} /><SkBarsCard title={130} rows={7} /></SkGrid><SkList rows={5} title={140} /></SkPage>);
const SkStaff = () => (<SkPage label="Loading staff…"><SkKpis n={4} min={150} /><SkTable cols={5} rows={6} min={540} title={130} /><Card data-sk="payroll"><SkHead w={170} /><SkStats n={3} min={140} /><div style={{ marginTop: 16 }}>{skb('100%', 8, { borderRadius: 100 })}</div></Card><SkDonuts n={2} min={300} /></SkPage>);
const SkCustomers = () => (<SkPage label="Loading customers…"><SkKpis n={4} min={150} /><SkStats n={4} /><SkDonuts n={1} min={300} /><Card data-sk="winback"><SkHead w={150} /><div style={{ display: 'grid', gap: 10 }}>{skb('70%', 11)}{skb('46%', 10)}</div><div style={{ marginTop: 16 }}>{skb(140, 38, { borderRadius: 11 })}</div></Card><SkTable cols={5} rows={6} min={600} title={120} /></SkPage>);
const SkAlerts = () => (<SkPage label="Loading alerts…"><SkStats n={3} min={150} /><SkList rows={7} padded={false} /></SkPage>);
const SkCompliance = () => (<SkPage label="Loading compliance…"><Card data-sk="gst"><SkHead w={190} /><SkStats n={5} min={140} /></Card><Card data-sk="turnover"><SkHead w={160} /><SkStats n={3} min={160} /><div style={{ marginTop: 14 }}>{skb('100%', 8, { borderRadius: 100 })}</div></Card><Card data-sk="downloads"><SkHead w={110} /><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{[0, 1, 2].map(i => <span key={i}>{skb(150, 40, { borderRadius: 11 })}</span>)}</div></Card><SkTable cols={6} rows={7} min={620} title={130} /></SkPage>);
const SkInsights = () => (
  <SkPage label="Loading executive insights…">
    <SkKpis n={4} min={165} hero />
    <SkGrid min={240}>{[0, 1, 2].map(i => <Card key={i} data-sk="pulse"><SkHead w={110} /><div style={{ display: 'grid', gap: 14 }}>{[0, 1, 2, 3].map(k => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>{skb(`${40 + k * 7}%`, 10)}{skb(54, 10)}</div>)}</div></Card>)}</SkGrid>
    <Card data-sk="actions"><SkHead w={140} /><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>{[0, 1, 2].map(i => <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, display: 'grid', gap: 9 }}>{skb('60%', 12)}{skb('90%', 9)}{skb('70%', 9)}</div>)}</div></Card>
  </SkPage>
);
const SkSettings = () => (<SkPage label="Loading settings…"><SkFields title={140} toggles={2} /><SkFields title={90} rows={2} /><SkFields title={130} rows={2} /><SkFields title={140} rows={1} toggles={2} /><SkFields title={150} toggles={6} rows={0} /><SkFields title={130} rows={1} /></SkPage>);

const IconBtn = ({ icon: Icon, onClick, active, title }) => (
  <button type="button" onClick={onClick} title={title} className="pown-btn" style={{
    width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? T.primarySoft : 'transparent', border: `1px solid ${active ? T.borderStrong : T.border}`,
    color: active ? T.primary : T.textMed
  }}><Icon size={15} /></button>
);

const PillTabs = ({ options, value, onChange }) => {
  const group = useId().replace(/:/g, '');
  return (
    <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const on = value === opt.value;
        return (
          <button type="button" role="tab" aria-selected={on} key={opt.value} onClick={() => onChange(opt.value)} className="pown-btn" style={{
            position: 'relative', padding: '9px 14px', borderRadius: 13, fontSize: 12, fontWeight: 700,
            border: `1px solid ${on ? 'transparent' : 'rgba(211,191,162,0.16)'}`, background: 'transparent',
            color: on ? '#f7f3eb' : 'rgba(255,255,255,0.55)'
          }}>
            {on && (
              <Motion.span layoutId={`pilltab-${group}`} aria-hidden="true" transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                style={{ position: 'absolute', inset: -1, borderRadius: 13, border: '1px solid rgba(211,191,162,0.5)', background: 'linear-gradient(135deg, rgba(211,191,162,0.22), rgba(211,191,162,0.06))' }} />
            )}
            <span style={{ position: 'relative' }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const Toggle = ({ checked, onChange }) => (
  <button type="button" role="switch" aria-checked={!!checked} onClick={() => onChange(!checked)} className="pown-btn" style={{
    width: 40, height: 23, borderRadius: 100, background: checked ? T.primary : 'rgba(255,255,255,0.12)',
    position: 'relative', flexShrink: 0, transition: 'background .2s ease'
  }}>
    <Motion.span initial={false} animate={{ x: checked ? 17 : 0 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }} style={{
      position: 'absolute', top: 2, left: 2, width: 19, height: 19, borderRadius: '50%',
      background: checked ? '#1a1a1d' : '#fff'
    }} />
  </button>
);

const Modal = ({ open, onClose, title, children, width = 420 }) => {
  const downOnBackdrop = useRef(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <Motion.div key="modal" className="pown-modal-bg" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16
          }} onMouseDown={e => { downOnBackdrop.current = e.target === e.currentTarget; }}
          onClick={e => { if (downOnBackdrop.current && e.target === e.currentTarget) onClose?.(); downOnBackdrop.current = false; }}>
          <Motion.div className="pown-modal" onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
            style={{
              width, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', background: T.surfaceRaised,
              border: `1px solid ${T.borderStrong}`, borderRadius: 18, padding: 22
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: T.textHigh, textAlign: 'left' }}>{title}</h3>
              <button type="button" onClick={onClose} className="pown-btn" style={{ background: 'transparent', color: T.textMed }}><X size={18} /></button>
            </div>
            {children}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMed, marginBottom: 6, letterSpacing: 0.4 }}>{label}</div>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(211,191,162,0.16)', borderRadius: 11,
  padding: '10px 12px', color: T.textHigh, fontSize: 13, fontFamily: T.font, outline: 'none', colorScheme: 'dark'
};

const PrimaryBtn = ({ children, onClick, icon: Icon, disabled, style, type = 'button' }) => (
  <button type={type} onClick={onClick} disabled={disabled} className="pown-btn" style={{
    background: disabled ? 'rgba(211,191,162,0.35)' : 'linear-gradient(135deg,#e6d6b8,#d3bfa2)',
    color: '#14110c', border: 'none',
    borderRadius: 11, padding: '9px 15px', fontSize: 12, fontWeight: 800, display: 'inline-flex',
    alignItems: 'center', gap: 7, opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style
  }}>{Icon && <Icon size={14} />}{children}</button>
);

const GhostBtn = ({ children, onClick, icon: Icon, style, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} className="pown-btn" style={{
    background: 'rgba(255,255,255,0.03)', color: '#e8e2d8', border: '1px solid rgba(211,191,162,0.16)',
    borderRadius: 11, padding: '9px 14px', fontSize: 12, fontWeight: 700, display: 'inline-flex',
    alignItems: 'center', gap: 7, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style
  }}>{Icon && <Icon size={14} className={Icon === Loader2 ? 'pown-pulse' : ''} />}{children}</button>
);

function useFlash(ms = 3200) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), ms);
  }, [ms]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, flash];
}

const Toast = ({ message }) => {
  if (!message) return null;
  // flash() carries failures too ("Could not save settings"); they used to get the same green tick as successes.
  const isError = /could not|couldn.t|failed|unable|must be|error|invalid/i.test(String(message));
  return (
    <div role="status" aria-live="polite" className="pown-fade-in" style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
      background: T.surfaceRaised, border: `1px solid ${T.borderStrong}`, borderRadius: 12,
      padding: '11px 18px', fontSize: 12.5, fontWeight: 700, color: T.textHigh, boxShadow: T.glowHover,
      display: 'flex', alignItems: 'center', gap: 8
    }}>{isError ? <AlertTriangle size={15} color={T.danger} /> : <CheckCircle2 size={15} color={T.primary} />}{message}</div>
  );
};

/* ════════════════════════════════════════════════════════════
   AUTH SCREENS — first-time setup, login, splash
   ════════════════════════════════════════════════════════════ */
const AuthShell = ({ children }) => (
  <div className="pown" style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
    overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    padding: 'max(28px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
    position: 'relative'
  }}>
    <GlobalStyles />
    <div className="pown-auth-glow" style={{ top: '8%', left: '12%' }} />
    <div className="pown-auth-glow" style={{ bottom: '6%', right: '10%', animationDelay: '-4s' }} />
    <div className="pown-fade-in" style={{ width: 400, maxWidth: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div style={{ width: 188, height: 78, borderRadius: 20, background: '#f7f3eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 14px', boxShadow: '0 16px 40px -10px rgba(211,191,162,0.38)' }}>
          <img src={BRAND_LOGO} alt="Pratyeksha" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </div>
      {children}
    </div>
  </div>
);

const AuthSplash = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg,#f7eee2,#efe1cf 50%,#f9f1e7)' }}>
    <GlobalStyles />
    <div className="pown-pulse" style={{ width: 150, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={BRAND_LOGO} alt="Pratyeksha" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  </div>
);

const AuthErrorScreen = () => {
  const { authErrorDetail, authBlocked, retryAuth, tenantId } = useOwner();
  const navigate = useNavigate();
  // The launcher jumps straight to the remembered outlet, so a mistyped or removed outlet left no way to pick another one.
  const switchOutlet = () => { try { localStorage.removeItem(LAST_TENANT_KEY); } catch (e) {} navigate('/owner'); };
  return (
    <PxAuthShell art={PxCrown} headline="Grow Your Café & Restaurant Business" sub="Smarter Tools. Greater Insights.">
      <PxCard icon={WifiOff} title={authBlocked ? 'Account unavailable' : "Couldn't reach the server"} subtitle={<span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{authErrorDetail || 'Something went wrong checking your account.'}</span>}>
        <PxButton type="button" icon={RefreshCcw} onClick={retryAuth}>Retry</PxButton>
        <div style={{ textAlign: 'center', marginTop: 8 }}><PxLink onClick={switchOutlet}>Switch to a different outlet</PxLink></div>
      </PxCard>
    </PxAuthShell>
  );
};

const LoginScreen = () => {
  const { tenantId, completeAuth } = useOwner();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (mode === 'signup') return <SetupScreen onBack={(msg) => { setNotice(msg || ''); setMode('login'); }} />;

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('Enter your username or email and password'); return; }
    setLoading(true); setError(''); setNotice('');
    try {
      const res = await axios.post(`${API_BASE}/api/owner/auth/login/${tenantId}`, { username: username.trim(), password });
      completeAuth(res.data.token, res.data.ownerName);
    } catch (err) {
      setError(err?.response?.data?.error || (err?.response ? 'Could not sign in' : 'Cannot reach the server. Check your internet and try again.'));
    } finally { setLoading(false); }
  };

  return (
    <PxAuthShell art={PxCrown} headline="Grow Your Café & Restaurant Business" sub="Smarter Tools. Greater Insights.">
      <PxCard icon={PxCrown} title="Owner Login" subtitle="Access your business dashboard">
        <form onSubmit={submit} noValidate>
          <PxField icon={PxMail} label="Username or email" placeholder="Username or email" value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
          <PxField icon={PxLock} type="password" label="Password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          <PxAlert kind="ok">{notice}</PxAlert>
          <PxAlert>{error}</PxAlert>
          <PxButton type="submit" loading={loading}>{loading ? 'Signing in…' : 'Sign In'}</PxButton>
        </form>
        <div style={{ textAlign: 'center', marginTop: 10 }}><ForgotLink scope="owner" tenantId={tenantId} defaultUsername={username} /></div>
        <PxDivider />
        <PxButton type="button" ghost icon={PxUserPlus} onClick={() => { setError(''); setMode('signup'); }}>Create Account</PxButton>
        <PxSecure />
      </PxCard>
    </PxAuthShell>
  );
};

/** First-time owner sign-up for a restaurant: step 1 proves you may (restaurant's operator password), step 2 creates the login. */
const SetupScreen = ({ onBack }) => {
  const { tenantId, completeAuth } = useOwner();
  const [step, setStep] = useState(1);
  const [ownerName, setOwnerNameField] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errs, setErrs] = useState({});

  const next = (e) => {
    e.preventDefault();
    if (!operatorPassword) { setErrs({ op: 'Enter the operator password' }); return; }
    setErrs({}); setError(''); setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (username.trim().length < 3) x.username = 'Choose a username of at least 3 characters';
    if (/\s/.test(username.trim())) x.username = 'Username cannot contain spaces';
    if (recoveryEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.trim())) x.email = 'Enter a valid email';
    const why = passwordIssues(password); if (why) x.password = why;
    if (!x.password && password !== confirm) x.confirm = 'Passwords do not match';
    setErrs(x); if (Object.keys(x).length) return;
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/owner/auth/setup/${tenantId}`, { username: username.trim(), password, ownerName: ownerName.trim(), operatorPassword, email: recoveryEmail.trim() || undefined });
      completeAuth(res.data.token, res.data.ownerName);
    } catch (err) {
      const d = err?.response?.data;
      if (d?.code === 'OPERATOR_PASSWORD_REQUIRED') { setStep(1); setErrs({ op: 'That operator password is not correct.' }); setError(''); }
      else if (err?.response?.status === 409) { if (onBack) onBack('An owner login already exists for this business. Please sign in.'); else setError(d?.error); }
      else setError(d?.error || (err?.response ? 'Could not complete sign-up' : 'Cannot reach the server. Check your internet and try again.'));
    } finally { setLoading(false); }
  };

  const dots = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '-8px 0 16px' }} aria-label={`Step ${step} of 2`}>
      {[1, 2].map(n => <span key={n} style={{ width: n === step ? 26 : 8, height: 8, borderRadius: 5, background: n <= step ? PX.goldSoft : PX.line, transition: 'width .2s' }} />)}
    </div>
  );

  return (
    <PxAuthShell art={PxUserPlus} headline="Create your owner account" sub="One quick setup, then your whole business is at your fingertips.">
      <PxCard icon={PxUserPlus} title="Create Account" subtitle={step === 1 ? 'Verify you can manage this business. Ask your manager or Pratyeksha support for the operator password.' : 'Choose how you will sign in. You only do this once.'}>
        {dots}
        {step === 1 ? (
          <form onSubmit={next} noValidate>
            <PxField icon={PxKey} type="password" label="Operator password" placeholder="Operator password" value={operatorPassword} onChange={e => setOperatorPassword(e.target.value)} error={errs.op} autoComplete="off" autoFocus />
            <PxAlert>{error}</PxAlert>
            <PxButton type="submit">Continue</PxButton>
          </form>
        ) : (
          <form onSubmit={submit} noValidate>
            <PxField icon={PxUser} label="Your name" placeholder="Your name (e.g. Rohan Patil)" value={ownerName} onChange={e => setOwnerNameField(e.target.value)} autoComplete="name" autoFocus />
            <PxField icon={PxUser} label="Choose a username" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} error={errs.username} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
            <PxField icon={PxMail} type="email" label="Recovery email" placeholder="Recovery email (for password reset)" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} error={errs.email} autoComplete="email" hint="Also works to sign in. Strongly recommended." />
            <PxField icon={PxLock} type="password" label="Choose a password" placeholder="Choose a password" value={password} onChange={e => setPassword(e.target.value)} error={errs.password} autoComplete="new-password" />
            <PxStrength value={password} />
            <PxField icon={PxLock} type="password" label="Confirm password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} error={errs.confirm} autoComplete="new-password" />
            <PxAlert>{error}</PxAlert>
            <PxButton type="submit" loading={loading} icon={CheckCircle2}>{loading ? 'Creating…' : 'Create Account & Continue'}</PxButton>
            <div style={{ textAlign: 'center', marginTop: 4 }}><PxLink onClick={() => { setStep(1); setError(''); }}>← Back</PxLink></div>
          </form>
        )}
        <PxDivider />
        <PxButton type="button" ghost noIcon onClick={() => onBack && onBack('')}>I already have an account</PxButton>
        <PxSecure />
      </PxCard>
    </PxAuthShell>
  );
};

/* ════════════════════════════════════════════════════════════
   NAVIGATION CONFIG
   ════════════════════════════════════════════════════════════ */
const NAV_GROUPS = ['Overview', 'Money', 'Operations', 'Guests & growth', 'Account'];
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview', desc: 'Live sales, tables and kitchen at a glance' },
  { key: 'alerts', label: 'Alerts', icon: Bell, group: 'Overview', desc: 'What needs your attention right now' },
  { key: 'insights', label: 'Executive Insights', icon: Gauge, badge: true, group: 'Overview', desc: 'One-page snapshot across every part of the business' },
  { key: 'revenue', label: 'Revenue & Sales', icon: TrendingUp, group: 'Money', desc: 'Where the money comes from, and how you are pacing' },
  { key: 'pnl', label: 'P&L', icon: PieIcon, group: 'Money', desc: 'Profit after food cost, staff and GST' },
  { key: 'compliance', label: 'Compliance & GST', icon: ShieldCheck, group: 'Money', desc: 'GST totals, invoice register and filing exports' },
  { key: 'reports', label: 'Reports & Exports', icon: ClipboardList, group: 'Money', desc: 'Download daily, weekly and monthly reports' },
  { key: 'menu', label: 'Menu Intelligence', icon: UtensilsCrossed, group: 'Operations', desc: 'Which dishes earn, which ones to fix or drop' },
  { key: 'inventory', label: 'Inventory & Stock', icon: Package, group: 'Operations', desc: 'Stock health, run-out forecasts and wastage' },
  { key: 'kitchen', label: 'Kitchen Performance', icon: ChefHat, group: 'Operations', desc: 'Prep times, delays and live tickets' },
  { key: 'staff', label: 'Staff & Payroll', icon: Users, group: 'Operations', desc: 'Attendance, salaries and top performers' },
  { key: 'customers', label: 'Customers', icon: UserCircle2, group: 'Guests & growth', desc: 'Who comes back, and who is slipping away' },
  { key: 'listing', label: 'Guest Discovery', icon: Eye, group: 'Guests & growth', desc: 'How guests find and see your restaurant' },
  { key: 'growth', label: 'Why Pratyeksha', icon: Rocket, badge: true, group: 'Guests & growth', desc: 'What Pratyeksha does for you, compared with doing it by hand' },
  { key: 'help', label: 'Help & feedback', icon: LifeBuoy, group: 'Account', desc: 'Contact support, suggest an idea, and rate Pratyeksha' },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, group: 'Account', desc: 'Targets, hours, alerts, payments and password' },
];
// Quick-access row on mobile; the 5th slot opens the full drawer with every tab.
const BOTTOM_NAV_KEYS = ['dashboard', 'revenue', 'kitchen', 'alerts'];
// (order here is the order on screen)

/* ════════════════════════════════════════════════════════════
   LAYOUT — Sidebar (desktop) + Bottom Nav (mobile) + Top Bar
   ════════════════════════════════════════════════════════════ */
const IosStep = ({ n, text }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.primarySoft, color: T.primary, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
    <div style={{ fontSize: 12.5, color: T.textMed, lineHeight: 1.6, paddingTop: 2 }}>{text}</div>
  </div>
);

const IosInstallModal = ({ open, onClose }) => (
  <Modal open={open} onClose={onClose} title="Install on iPhone / iPad" width={360}>
    <div style={{ display: 'grid', gap: 14 }}>
      <IosStep n={1} text={<>Tap the <b>Share</b> icon in Safari's toolbar</>} />
      <IosStep n={2} text={<>Scroll down and tap <b>"Add to Home Screen"</b></>} />
      <IosStep n={3} text={<>Tap <b>Add</b> — the app icon appears on your home screen</>} />
    </div>
  </Modal>
);

/** Compact install button for the sidebar footer. */
const InstallAppButton = () => {
  const { canInstall, installed, isIos, promptInstall } = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (installed) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.textLow, fontWeight: 700, padding: '9px 2px' }}>
      <CheckCircle2 size={13} color={T.primary} /> App installed
    </div>
  );
  if (!canInstall && !isIos) return null;

  return (
    <>
      <button type="button" onClick={() => isIos ? setShowIosHelp(true) : promptInstall()} className="pown-btn pown-shimmer-btn" style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '11px 12px',
        borderRadius: 12, background: `linear-gradient(135deg, #e2d3ba, ${T.primary} 55%, #c2a97e)`, color: '#0f0f11',
        border: 'none', fontSize: 12.5, fontWeight: 800, boxShadow: '0 8px 20px -8px rgba(211,191,162,0.55)'
      }}><Download size={14} /> Install App</button>
      <IosInstallModal open={showIosHelp} onClose={() => setShowIosHelp(false)} />
    </>
  );
};

/** Prominent, dismissible install banner shown on the Dashboard. */
const INSTALL_DISMISS_KEY = 'pratyeksha_owner_install_dismissed';
const InstallBanner = () => {
  const { canInstall, installed, isIos, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem(INSTALL_DISMISS_KEY) === '1'; } catch (e) { return false; } });
  const [showIosHelp, setShowIosHelp] = useState(false);

  const dismiss = () => { setDismissed(true); try { localStorage.setItem(INSTALL_DISMISS_KEY, '1'); } catch (e) {} };

  if (installed || dismissed || (!canInstall && !isIos)) return null;

  return (
    <Card interactive style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
      background: `linear-gradient(120deg, ${T.surfaceRaised} 0%, ${T.surface} 60%, rgba(211,191,162,0.06) 100%)`,
      flexWrap: 'wrap'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: `linear-gradient(140deg, ${T.primary}, #b89f7c)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -6px rgba(211,191,162,0.5)'
      }}><Smartphone size={20} color="#0f0f11" strokeWidth={2.25} /></div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Install Pratyeksha Owner</div>
        <div style={{ fontSize: 11.5, color: T.textLow, marginTop: 2 }}>One tap, no app store — live on your home screen like any other app.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <PrimaryBtn icon={Download} onClick={() => isIos ? setShowIosHelp(true) : promptInstall()}>Install</PrimaryBtn>
        <button type="button" onClick={dismiss} className="pown-btn" style={{ background: 'transparent', color: T.textLow, padding: 6 }}><X size={16} /></button>
      </div>
      <IosInstallModal open={showIosHelp} onClose={() => setShowIosHelp(false)} />
    </Card>
  );
};

/** Same page header as the Tracking tab: gold eyebrow with icon, serif title, quiet description. Rendered once by the shell for every tab. */
const OwnerPageHeader = ({ item }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontSize: 10, letterSpacing: 2.4, color: T.primary, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>
      <item.icon size={13} /> {item.group}
    </div>
    <h1 style={{
      fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px,3.2vw,36px)', fontWeight: 700, margin: '8px 0 4px',
      color: '#f7f3eb', letterSpacing: 0.3, lineHeight: 1.15, textAlign: 'left'
    }}>{item.label}</h1>
    {item.desc && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{item.desc}</div>}
  </div>
);

/** One grouped tab list for desktop sidebar and mobile drawer, so the two can never drift apart. */
const NavList = ({ tenantId, compact = false }) => (
  <>
    {NAV_GROUPS.map(group => (
      <div key={group} role="group" aria-label={group}>
        <div className="pown-nav-group">{group}</div>
        {NAV_ITEMS.filter(i => i.group === group).map(item => (
          <NavLink key={item.key} to={`/owner/${tenantId}/${item.key}`} className="pown-nav-link" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 11, padding: compact ? '9px 12px' : '9px 12px', borderRadius: 12,
            marginBottom: 3, fontSize: compact ? 13.5 : 12.5, fontWeight: 700,
            border: `1px solid ${isActive ? 'transparent' : 'transparent'}`,
            background: 'transparent',
            color: isActive ? '#f7f3eb' : 'rgba(255,255,255,0.58)'
          })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <Motion.span layoutId={compact ? 'owner-nav-pill-drawer' : 'owner-nav-pill'} aria-hidden="true" transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                    style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid rgba(211,191,162,0.5)', background: 'linear-gradient(135deg, rgba(211,191,162,0.22), rgba(211,191,162,0.06))', zIndex: 0 }} />
                )}
                <item.icon size={16} strokeWidth={2} color={undefined} style={{ position: 'relative' }} />
                <span style={{ position: 'relative', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                {item.badge && <span aria-hidden="true" style={{ position: 'relative', marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.primary, flexShrink: 0 }} />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    ))}
  </>
);

const Sidebar = () => {
  const { tenantId, ownerName, logout } = useOwner();
  return (
    <aside style={{
      width: 262, flexShrink: 0, margin: 12, marginRight: 0, height: 'calc(100% - 24px)',
      border: `1px solid ${T.border}`, borderRadius: 24,
      background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018))',
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 24px 60px -28px rgba(0,0,0,0.7)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* Pinned header — logo + owner chip, never scrolls */}
      <div style={{ padding: '26px 22px 18px', flexShrink: 0 }}>
        <div style={{ width: '100%', height: 64, borderRadius: 16, background: '#f7f3eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 14px', boxShadow: '0 8px 22px -6px rgba(211,191,162,0.3)' }}>
          <img src={BRAND_LOGO} alt="Pratyeksha" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        {ownerName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '9px 11px', background: 'rgba(255,255,255,0.03)', borderRadius: 11 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.primarySoft, color: T.primary, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {ownerName.trim()[0]?.toUpperCase() || 'O'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textHigh, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ownerName}</div>
          </div>
        )}
      </div>

      {/* Only the tab list scrolls — header and footer stay put */}
      <nav aria-label="Main" className="pown-scroll pown-scrollpane pown-sidebar-fade" style={{ padding: '0 14px 8px', flex: '1 1 auto', minHeight: 0 }}>
        <NavList tenantId={tenantId} />
      </nav>

      {/* Pinned footer — install / logout, never scrolls */}
      <div style={{ padding: 18, borderTop: `1px solid ${T.border}`, display: 'grid', gap: 10, flexShrink: 0 }}>
        <InstallAppButton />
        <SupportContact style={{ marginBottom: 0, borderRadius: 12 }} />
        <button type="button" onClick={logout} className="pown-btn" style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
          borderRadius: 12, background: 'transparent', border: `1px solid ${T.border}`, color: T.textMed, fontSize: 12.5, fontWeight: 700
        }}><LogOut size={14} /> Log out</button>
      </div>
    </aside>
  );
};

/** Full-screen slide-in drawer listing every tab — how mobile reaches all 13, not just the bottom-nav 5. */
const MobileDrawer = ({ open, onClose }) => {
  const { tenantId, ownerName, logout } = useOwner();
  const location = useLocation();
  useEffect(() => { onClose(); /* eslint-disable-line */ }, [location.pathname]);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 190, background: 'rgba(0,0,0,0.6)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .28s ease'
      }} />
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 288, maxWidth: '84vw', zIndex: 195,
        background: `linear-gradient(180deg, ${T.surfaceRaised} 0%, ${T.bg} 100%)`, borderRight: `1px solid ${T.borderStrong}`,
        transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: `transform .32s cubic-bezier(.4,0,.2,1), visibility 0s linear ${open ? '0s' : '.32s'}`,
        visibility: open ? 'visible' : 'hidden', // a closed drawer's links stayed in the tab order
        display: 'flex', flexDirection: 'column', boxShadow: open ? '20px 0 60px -20px rgba(0,0,0,0.6)' : 'none'
      }}>
        <div style={{ padding: '22px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ width: 148, height: 54, borderRadius: 14, background: '#f7f3eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 12px' }}>
            <img src={BRAND_LOGO} alt="Pratyeksha" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <button type="button" onClick={onClose} className="pown-btn" style={{ background: 'transparent', color: T.textLow }}><X size={18} /></button>
        </div>
        {ownerName && (
          <div style={{ margin: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', background: 'rgba(255,255,255,0.03)', borderRadius: 11 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.primarySoft, color: T.primary, fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {ownerName.trim()[0]?.toUpperCase() || 'O'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{ownerName}</div>
          </div>
        )}
        <nav aria-label="Main" className="pown-scrollpane pown-sidebar-fade" style={{ padding: '0 14px 8px', flex: '1 1 auto', minHeight: 0 }}>
          <NavList tenantId={tenantId} compact />
        </nav>
        <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, flexShrink: 0, display: 'grid', gap: 10 }}>
          <SupportContact style={{ marginBottom: 0 }} />
          <button type="button" onClick={logout} className="pown-btn" style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
            borderRadius: 12, background: 'transparent', border: `1px solid ${T.border}`, color: T.textMed, fontSize: 12.5, fontWeight: 700
          }}><LogOut size={14} /> Log out</button>
        </div>
      </div>
    </>
  );
};

const BottomNav = ({ onMore }) => {
  const { tenantId } = useParams();
  const items = BOTTOM_NAV_KEYS.map(k => NAV_ITEMS.find(i => i.key === k)).filter(Boolean);
  return (
    <nav aria-label="Quick tabs" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: 'rgba(14,14,16,0.94)',
      backdropFilter: 'blur(18px)', borderTop: `1px solid ${T.border}`, display: 'flex', zIndex: 100,
      boxShadow: '0 -8px 24px -8px rgba(0,0,0,0.6)'
    }}>
      {items.map(item => (
        <NavLink key={item.key} to={`/owner/${tenantId}/${item.key}`} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, textDecoration: 'none',
          color: isActive ? T.primary : T.textLow, transition: 'color .18s ease'
        })}>
          <item.icon size={19} strokeWidth={2} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label.split(' ')[0]}</span>
        </NavLink>
      ))}
      <button type="button" onClick={onMore} className="pown-btn" style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'transparent', color: T.textLow
      }}>
        <LayoutGrid size={19} strokeWidth={2} />
        <span style={{ fontSize: 10, fontWeight: 700 }}>More</span>
      </button>
    </nav>
  );
};

const TopBar = ({ onMenu }) => {
  const { tenantId, connected } = useOwner();
  const location = useLocation();
  // `includes('/menu')` matched the outlet id too (e.g. /owner/menu_house/dashboard titled the page "Menu Intelligence"): compare the page segment only.
  const pageKey = location.pathname.split('/')[3];
  const current = NAV_ITEMS.find(i => i.key === pageKey);
  const [outletMenuOpen, setOutletMenuOpen] = useState(false);
  const outletMenuRef = useRef(null);
  useEffect(() => { setOutletMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!outletMenuOpen) return;
    const onDown = (e) => { if (outletMenuRef.current && !outletMenuRef.current.contains(e.target)) setOutletMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOutletMenuOpen(false); };
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [outletMenuOpen]);
  const navigate = useNavigate();
  const switchOutlet = () => { try { localStorage.removeItem(LAST_TENANT_KEY); } catch (e) {} navigate('/owner'); };
  return (
    <header style={{
      flexShrink: 0, zIndex: 50, background: 'transparent',
      padding: onMenu ? '12px 14px' : '14px clamp(18px, 3vw, 40px) 0',
      borderBottom: onMenu ? `1px solid ${T.border}` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {onMenu && (
          <button type="button" onClick={onMenu} aria-label="Open menu" className="pown-btn" style={{
            width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(211,191,162,0.16)', color: T.textHigh, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><MenuIcon size={18} /></button>
        )}
        {onMenu && <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: '#f7f3eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current?.label || 'Dashboard'}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div role="status" title={connected ? 'Receiving live updates' : 'Trying to reconnect to live updates'} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 100,
          background: connected ? T.primarySoft : 'rgba(255,255,255,0.05)', border: `1px solid ${connected ? T.borderStrong : T.border}`,
          fontSize: 11.5, fontWeight: 700, color: connected ? T.primary : T.textMed
        }}>
          <span className={connected ? 'pown-live-dot' : 'pown-pulse'} style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? T.primary : T.textLow }} />
          <span className="pown-hide-mobile">{connected ? 'Live' : 'Reconnecting…'}</span>
        </div>
        <div ref={outletMenuRef} style={{ position: 'relative' }}>
          <button type="button" onClick={() => setOutletMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={outletMenuOpen} aria-label={`Outlet: ${tenantId}`} className="pown-btn" style={{
            display: 'flex', alignItems: 'center', gap: 8, background: T.surfaceRaised, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: '9px 13px', color: T.textHigh, fontSize: 12.5, fontWeight: 700, minHeight: 40
          }}>
            <MapPin size={14} color={T.primary} /> <span className="pown-hide-mobile" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenantId}</span> <ChevronDown size={13} />
          </button>
          {outletMenuOpen && (
            <div role="menu" className="pown-fade-in" style={{
              position: 'absolute', right: 0, top: 48, width: 230, background: T.surfaceRaised,
              border: `1px solid ${T.borderStrong}`, borderRadius: 14, padding: 6, zIndex: 60, boxShadow: T.glowHover
            }}>
              <div style={{ padding: '8px 10px', fontSize: 10.5, color: T.textLow, fontWeight: 800, letterSpacing: 1 }}>CURRENT OUTLET</div>
              <div style={{ padding: '9px 10px', fontSize: 12.5, fontWeight: 600, color: T.primary, background: T.primarySoft, borderRadius: 9, overflowWrap: 'anywhere' }}>{tenantId}</div>
              {/* The old menu ended with a greyed-out "+ Add outlet" that did nothing; this one does what it says. */}
              <button type="button" role="menuitem" onClick={switchOutlet} className="pown-btn" style={{
                width: '100%', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '10px', borderRadius: 9,
                background: 'transparent', color: T.textMed, fontSize: 12.5, fontWeight: 600, textAlign: 'left'
              }}><ArrowLeftRight size={14} /> Switch outlet</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * App-shell layout: the outer frame is pinned to exactly one viewport
 * (height:100vh, overflow:hidden — set in GlobalStyles on .pown), and only
 * the Sidebar and the <main> content pane scroll internally. This guarantees
 * every tab scrolls correctly no matter what the host page's CSS does,
 * because scrolling never depends on document/body height calculations.
 */
const OwnerShell = ({ children }) => {
  const { tenantId: ownerTenantId } = useOwner();
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(null);
  const PULL_THRESHOLD = 70;

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset scroll position to the top whenever the tab (route) changes.
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [location.pathname]);

  // Pull-to-refresh (mobile) — only activates when already scrolled to the
  // top, so it never fights with normal scrolling. Releasing past the
  // threshold remounts the current page, which re-runs its data fetch.
  const onTouchStart = (e) => {
    if (isDesktop || refreshing) return;
    if (mainRef.current && mainRef.current.scrollTop <= 0) touchStartY.current = e.touches[0].clientY;
    else touchStartY.current = null;
  };
  const onTouchMove = (e) => {
    if (touchStartY.current == null) return;
    const dist = e.touches[0].clientY - touchStartY.current;
    if (dist > 0) setPullDist(Math.min(dist * 0.5, 110));
  };
  const onTouchEnd = () => {
    if (pullDist >= PULL_THRESHOLD) {
      setRefreshing(true);
      setTimeout(() => { setRefreshKey(k => k + 1); setRefreshing(false); }, 550);
    }
    setPullDist(0);
    touchStartY.current = null;
  };

  return (
    <div className="pown" style={{
      display: 'flex', width: '100%', height: '100vh',
      background: 'radial-gradient(1100px 520px at 12% -8%, rgba(211,191,162,0.09), transparent 62%), radial-gradient(900px 480px at 100% 105%, rgba(211,191,162,0.05), transparent 60%), #101012'
    }}>
      {isDesktop && <Sidebar />}
      {!isDesktop && <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar onMenu={!isDesktop ? () => setDrawerOpen(true) : undefined} />
        {!isDesktop && (pullDist > 0 || refreshing) && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: refreshing ? 44 : pullDist, transition: refreshing ? 'height .2s ease' : 'none',
            overflow: 'hidden', flexShrink: 0
          }}>
            <RefreshCcw size={16} color={T.primary} style={{
              transform: `rotate(${refreshing ? 0 : pullDist * 3.2}deg)`,
              animation: refreshing ? 'pownSpin .7s linear infinite' : 'none',
              opacity: refreshing ? 1 : Math.min(pullDist / PULL_THRESHOLD, 1)
            }} />
          </div>
        )}
        <main
          ref={mainRef} className="pown-scroll pown-scrollpane"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{
            flex: '1 1 auto', minHeight: 0, width: '100%',
            padding: isDesktop ? '26px clamp(18px, 3vw, 40px) 56px' : '16px 14px 96px'
          }}>
          <RenewalReminder tenantId={ownerTenantId} />
          <TermsBanner tenantId={ownerTenantId} />
          <div className="pown-content">
            <div key={`${location.pathname}-${refreshKey}`} className="pown-page-transition">
              {(() => { const page = NAV_ITEMS.find(i => i.key === location.pathname.split('/')[3]); return page ? <OwnerPageHeader item={page} /> : null; })()}
              {children}
            </div>
          </div>
        </main>
      </div>
      {!isDesktop && <BottomNav onMore={() => setDrawerOpen(true)} />}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   REUSABLE: KPI CARD
   ════════════════════════════════════════════════════════════ */
const KpiCard = ({ icon: Icon, label, value, sub, delta, tone = 'default', hero = false }) => (
  <Card interactive className="pown-kpi" style={{
    display: 'flex', flexDirection: 'column', minHeight: hero ? 130 : 112, padding: '16px 16px 14px',
    // (not `borderColor: undefined`: React then clears the colour the card's border shorthand set, leaving a white outline)
    ...(hero ? { borderColor: T.borderStrong } : {})
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>
      <span className="pown-kpi-icon" style={{ display: 'inline-flex' }}><Icon size={13} color={tone === 'danger' ? T.danger : T.primary} strokeWidth={2} /></span>
      {label}
    </div>
    <div className="pown-mono" style={{
      marginTop: 10, fontSize: hero ? 30 : 26, fontWeight: 700, color: tone === 'danger' ? T.danger : '#f7f3eb',
      lineHeight: 1.05, letterSpacing: -0.5
    }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
      {delta !== undefined && <Delta pct={delta} />}
      {sub && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{sub}</span>}
    </div>
  </Card>
);

const greetingFor = (hour) => hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';

const LiveClock = () => {
  const [now, setNow] = useState(() => new Date(Date.now() + 330 * 60000));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date(Date.now() + 330 * 60000)), 10000); // 30s left the displayed minute up to 30s late
    return () => clearInterval(id);
  }, []);
  const hour = now.getUTCHours();
  const time = now.toISOString().slice(11, 16);
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 2 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2, color: '#f1ede4' }}>{greetingFor(hour)}</div>
        <div style={{ fontSize: 12, color: T.textLow, fontWeight: 600, marginTop: 2 }}>{dateStr}</div>
      </div>
      <div className="pown-mono" style={{
        fontSize: 12.5, fontWeight: 700, color: T.primary, background: 'rgba(211,191,162,0.12)',
        padding: '6px 12px', borderRadius: 100, border: '1px solid rgba(211,191,162,0.3)'
      }}>{time} IST</div>
    </div>
  );
};

/** Hourly revenue bars (Bklit BarSparkline) used across modules */
const MiniBarChart = ({ data, dataKey = 'value', xKey = 'x', height = 64, color = 'var(--chart-1)' }) => (
  <BkMiniBars data={data} dataKey={dataKey} xKey={xKey} height={height} color={color} valueFormat={fmtINRc} hoverLabel={(h) => `Hour ${h}`} />
);

const fmtCompactINR = (v) => {
  const n = Number(v) || 0, a = Math.abs(n);
  if (a >= 10000000) return `₹${+(n / 10000000).toFixed(1)}Cr`;
  if (a >= 100000) return `₹${+(n / 100000).toFixed(1)}L`;
  if (a >= 1000) return `₹${+(n / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  return `₹${Math.round(n)}`;
};

/* ════════════════════════════════════════════════════════════
   CHART KIT — shared visuals for every owner module
   Categorical hues are the validated dark-surface set (blue, orange, aqua, violet, amber, magenta) assigned in fixed order;
   single-series charts use the brand gold. Every chart ships a value legend/list (never colour alone) and a hover tooltip.
   ════════════════════════════════════════════════════════════ */
const VIZ = ['#cdbb98', '#e29a58', '#ecdcb9', '#b8a47f', '#8a704d', '#e29a58'];
const fmtINRc = (v) => `₹${Math.round(Number(v) || 0).toLocaleString('en-IN')}`;
const clipLabel = (s, n = 17) => { const t = String(s ?? ''); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
/** Top-N rows kept, the rest folded into one "Other" row (a 7th+ hue is never generated). */
const foldOther = (rows, max = 5) => {
  const list = (rows || []).filter(r => Number(r.value) > 0).sort((a, b) => b.value - a.value);
  if (list.length <= max) return list;
  const rest = list.slice(max - 1).reduce((a, r) => a + Number(r.value), 0);
  return [...list.slice(0, max - 1), { label: 'Other', value: rest }];
};

const ChartCard = ({ icon, title, hint, children }) => (
  <Card>
    <SectionHeading icon={icon} title={title} />
    {hint && <div style={{ fontSize: 11, color: T.textLow, margin: '-6px 0 12px', lineHeight: 1.5 }}>{hint}</div>}
    {children}
  </Card>
);

const DonutChart = ({ items, valueFormat = (v) => v, centerValue, centerLabel, size = 176 }) => {
  const rows = (items || []).filter(i => Number(i.value) > 0);
  const total = rows.reduce((a, r) => a + Number(r.value), 0);
  if (!rows.length) return <EmptyState icon={BarChart3} title="No data yet" />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <BkDonut rows={rows.map((r, i) => ({ ...r, color: r.color || VIZ[i % VIZ.length] }))} valueFormat={valueFormat} centerValue={centerValue} centerLabel={centerLabel} size={size} />
      <div style={{ flex: '1 1 160px', minWidth: 150, display: 'grid', gap: 9 }}>
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, flex: '0 0 auto', background: r.color || VIZ[i % VIZ.length] }} />
            <span style={{ flex: 1, minWidth: 0, color: T.textMed, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <span className="pown-mono" style={{ color: T.textHigh, fontWeight: 700 }}>{valueFormat(r.value)}</span>
            <span className="pown-mono" style={{ color: T.textLow, width: 36, textAlign: 'right' }}>{Math.round((Number(r.value) / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HBarChart = ({ data, valueFormat = (v) => v, color = 'var(--chart-1)', rowHeight = 30, nameWidth = 112 }) => {
  const rows = (data || []).filter(r => r && r.label != null).map(r => ({ ...r, label: clipLabel(r.label) }));
  if (!rows.length) return <EmptyState icon={BarChart3} title="No data yet" />;
  return <BkHBars rows={rows} valueFormat={valueFormat} color={color} rowHeight={rowHeight} nameWidth={nameWidth} />;
};

const ColumnChart = ({ data, valueFormat = (v) => v, height = 200, color = 'var(--chart-1)', highlightLabel }) => {
  const rows = (data || []).filter(r => r && r.label != null).map(r => ({ ...r, label: clipLabel(r.label, 11) }));
  if (!rows.length) return <EmptyState icon={BarChart3} title="No data yet" />;
  return <BkColumns rows={rows} valueFormat={valueFormat} height={height} color={color} highlightLabel={highlightLabel != null ? clipLabel(highlightLabel, 11) : undefined} />;
};

/** Responsive row of visual cards: 3-up on desktop, stacks to one column on phones (min(100%, …) prevents overflow on 320px screens). */
const VisualGrid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>{children}</div>
);
/** Bklit gauge (0–100) in a card. `centerValue` lets the dial show a raw figure while the arc is clamped. */
const GaugeCard = ({ icon, title, value, centerValue, suffix = '%', label, hint, maxWidth = 220 }) => (
  <Card style={{ minWidth: 0 }}>
    <SectionHeading icon={icon} title={title} />
    <BkGauge value={value} centerValue={centerValue} suffix={suffix} label={label} maxWidth={maxWidth} />
    {hint && <div style={{ fontSize: 11.5, color: T.textMed, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>{hint}</div>}
  </Card>
);
/** Bklit concentric rings + a value list. items: [{label, value, max}] — every ring is a share of its own max. */
const RingCard = ({ icon, title, items, centerLabel, formatCenter, valueFormat = (v) => v }) => {
  const rows = (items || []).map((r, i) => ({ ...r, color: VIZ_VARS[i % VIZ_VARS.length] }));
  return (
    <Card style={{ minWidth: 0 }}>
      <SectionHeading icon={icon} title={title} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <BkRings items={rows} size={150} centerLabel={centerLabel} formatCenter={formatCenter} />
        <div style={{ flex: '1 1 130px', minWidth: 120, display: 'grid', gap: 9 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color, flex: '0 0 auto' }} />
              <span style={{ flex: 1, minWidth: 0, color: T.textMed, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
              <span className="pown-mono" style={{ color: T.textHigh, fontWeight: 700 }}>{valueFormat(r.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
const VIZ_VARS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)'];

/* ════════════════════════════════════════════════════════════
   MODULE 1 — LIVE DASHBOARD
   ════════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const navigate = useNavigate();
  const { tenantId, liveOrderEvent, liveStaffEvent } = useOwner();
  const { data, loading, error, refetch } = useOwnerData('/api/owner/dashboard/:tenantId', { refreshMs: 45000 });
  const animatedRevenue = useCountUp(data?.revenue?.today || 0);
  const animatedProfit = useCountUp(data?.liveProfit?.estimatedGrossProfit || 0);

  // Refetch the instant a new order comes in or any order's status changes
  // (kitchen marks ready, waiter serves, bill settles) — the 45s poll above
  // is now just a safety net, not the primary way this page stays current.
  useEffect(() => { if (liveOrderEvent) refetch(); }, [liveOrderEvent]); // eslint-disable-line
  useEffect(() => { if (liveStaffEvent) refetch(); }, [liveStaffEvent]); // eslint-disable-line

  if (loading) return <SkDashboard />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const hourlyData = (data.hourlyToday || []).map(h => ({ x: h.hour, value: h.revenue }));

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <LiveClock />
      {/* Hero KPI row */}
      <div className="pown-stagger pown-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <KpiCard hero icon={IndianRupee} label="TODAY REVENUE" value={`\u20B9${animatedRevenue.toLocaleString('en-IN')}`}
          delta={data.revenue.todayVsYday} sub="vs yesterday" />
        <KpiCard icon={LayoutGrid} label="LIVE TABLES" value={`${data.tables.occupied} / ${data.tables.total}`}
          sub={`${data.tables.billPending} bill pending · ${data.tables.free} free`} />
        <KpiCard icon={Wallet} label="GROSS PROFIT" value={`\u20B9${animatedProfit.toLocaleString('en-IN')}`}
          sub={data.revenue.today > 0 ? `${100 - data.liveProfit.foodCostPct}% margin est.` : 'No sales yet today'} /> {/* with no revenue the food-cost % is 0, which read as a "100% margin" */}
        <KpiCard icon={Target} label="BREAK-EVEN" value={`${data.breakEven.pct}% achieved`}
          sub={`\u20B9${data.breakEven.remaining.toLocaleString('en-IN')} more to target`} />
      </div>

      {/* Live activity strip */}
      <Card className="pown-strip" style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', padding: '14px 20px' }}>
        <StripItem icon={ChefHat} label="Kitchen" value={`${data.orders.pendingInKDS} cooking`} tone={data.orders.pendingInKDS > 0 ? 'warning' : 'default'} />
        <Divider />
        <StripItem icon={PackageCheck} label="Ready" value={`${data.orders.readyForPickup} for pickup`} tone={data.orders.readyForPickup > 0 ? 'warning' : 'default'} />
        <Divider />
        <StripItem icon={Bell} label="Service" value={`${data.serviceRequests} requests`} tone={data.serviceRequests > 0 ? 'warning' : 'default'} />
        <Divider />
        <StripItem icon={Package} label="Low stock" value={`${data.lowStockCount} items`} tone={data.lowStockCount > 0 ? 'danger' : 'default'} />
        <Divider />
        <StripItem icon={UserCheck} label="Staff" value={`${data.staffPresent} / ${data.staffTotal} present`} />
      </Card>

      <div className="pown-split-main">
        {/* Hourly sparkline */}
        <Card>
          <SectionHeading icon={BarChart3} title="Today's Hourly Revenue" />
          {hourlyData.some(h => h.value > 0)
            ? <MiniBarChart data={hourlyData} height={140} />
            : <EmptyState icon={BarChart3} title="No sales yet today" subtitle="Revenue will populate as orders settle" />}
        </Card>

        {/* Top dish + staff */}
        <div style={{ display: 'grid', gap: 14 }}>
          <Card>
            <Label style={{ marginBottom: 10 }}>TOP DISH TODAY</Label>
            {data.topDishToday ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={18} color={T.primary} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{data.topDishToday.name}</div>
                  <div style={{ fontSize: 11.5, color: T.textLow }} className="pown-mono">{data.topDishToday.qty} sold · <Money value={data.topDishToday.revenue} size={11.5} weight={600} color={T.textLow} /></div>
                </div>
              </div>
            ) : <EmptyState icon={Flame} title="No dishes sold yet" />}
          </Card>
          <Card>
            <Label style={{ marginBottom: 10 }}>STAFF ATTENDANCE</Label>
            {/* The bar used to squeeze the figure, so "11 / 14" wrapped onto two lines. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="pown-mono" style={{ fontSize: 20, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>{data.staffPresent} <span style={{ fontSize: 13, color: T.textLow, fontWeight: 600 }}>/ {data.staffTotal}</span></span>
              <div style={{ flex: 1, minWidth: 40 }}><ProgressBar pct={data.staffTotal ? (data.staffPresent / data.staffTotal) * 100 : 0} height={7} /></div>
            </div>
          </Card>
        </div>
      </div>

      {data.tables && data.breakEven && (
        <VisualGrid>
          <GaugeCard icon={Target} title="Break-even today" value={data.breakEven.pct} centerValue={Math.round(Number(data.breakEven.pct) || 0)} label="ACHIEVED"
            hint={`\u20B9${Number(data.breakEven.remaining || 0).toLocaleString('en-IN')} more to cover today's costs`} />
          {Number(data.tables.total) > 0 && (
            <RingCard icon={LayoutGrid} title="Table status" centerLabel="TABLES" formatCenter={(v) => Math.round(v)}
              items={[{ label: 'Occupied', value: data.tables.occupied, max: data.tables.total }, { label: 'Bill pending', value: data.tables.billPending, max: data.tables.total }, { label: 'Free', value: data.tables.free, max: data.tables.total }]} />
          )}
          {data.liveProfit && (
            <GaugeCard icon={Percent} title="Food cost" value={data.liveProfit.foodCostPct} centerValue={Math.round(Number(data.liveProfit.foodCostPct) || 0)} label="OF REVENUE"
              hint="Share of today's sales spent on ingredients" />
          )}
        </VisualGrid>
      )}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <GhostBtn icon={ChefHat} onClick={() => navigate(`/owner/${tenantId}/kitchen`)}>View Live Orders</GhostBtn>
        <GhostBtn icon={Package} onClick={() => navigate(`/owner/${tenantId}/inventory`)}>Check Inventory</GhostBtn>
        <GhostBtn icon={TrendingUp} onClick={() => navigate(`/owner/${tenantId}/revenue`)}>View Revenue</GhostBtn>
      </div>
    </div>
  );
};

const StripItem = ({ icon: Icon, label, value, tone = 'default' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Icon size={14} color={tone === 'danger' ? T.danger : tone === 'warning' ? T.warning : T.primary} />
    <span style={{ fontSize: 12, color: T.textLow, fontWeight: 600 }}>{label}:</span>
    <span className="pown-mono" style={{ fontSize: 12.5, fontWeight: 700, color: tone === 'danger' ? T.danger : tone === 'warning' ? T.warning : T.textHigh }}>{value}</span>
  </div>
);
const Divider = () => <div className="pown-strip-divider" style={{ width: 1, height: 16, background: T.border }} />;

/* ════════════════════════════════════════════════════════════
   MODULE 2 — REVENUE & SALES
   ════════════════════════════════════════════════════════════ */
const dateRangeFor = (key) => {
  const fmt = (d) => d.toISOString().split('T')[0];
  const today = new Date(Date.now() + 330 * 60000);
  const y = new Date(today); y.setUTCDate(y.getUTCDate() - 1); // UTC setters: `today` is an IST-shifted instant, local-time setters/constructors drifted a day
  switch (key) {
    case 'today': return { from: fmt(today), to: fmt(today) };
    case 'yesterday': return { from: fmt(y), to: fmt(y) };
    case 'week': { const s = new Date(today); s.setUTCDate(s.getUTCDate() - today.getUTCDay()); return { from: fmt(s), to: fmt(today) }; }
    case 'month': { const s = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); return { from: fmt(s), to: fmt(today) }; }
    case 'lastMonth': { const s = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)); const e = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)); return { from: fmt(s), to: fmt(e) }; }
    default: return { from: fmt(today), to: fmt(today) };
  }
};

const RevenuePage = () => {
  const [range, setRange] = useState('today');
  // `dates` was memoised on `range` alone, so a page left open past midnight kept asking for yesterday as "today".
  const [dayKey, setDayKey] = useState(() => dateRangeFor('today').from);
  useEffect(() => {
    const t = setInterval(() => setDayKey(prev => { const d = dateRangeFor('today').from; return d === prev ? prev : d; }), 60000);
    return () => clearInterval(t);
  }, []);
  const dates = useMemo(() => dateRangeFor(range), [range, dayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const { liveOrderEvent } = useOwner();
  // No refreshMs was set here before — meaning this page only ever fetched
  // once and then sat stale indefinitely if left open. Now it polls as a
  // backstop AND refetches instantly whenever an order settles.
  const { data, loading, error, refetch } = useOwnerData('/api/owner/revenue/summary/:tenantId', { params: dates, refreshMs: 45000 });
  useEffect(() => {
    if (liveOrderEvent?.type === 'order_voided' || (liveOrderEvent?.type === 'order_status_updated' && liveOrderEvent.order?.status === 'settled')) refetch();
  }, [liveOrderEvent]); // eslint-disable-line

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <PillTabs value={range} onChange={setRange} options={[
        { value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' },
        { value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' }
      ]} />

      <DataBoundary skeleton={<SkRevenue />} loading={loading} error={error} onRetry={refetch} empty={data && data.orderCount === 0}
        emptyProps={{ icon: TrendingUp, title: 'No settled orders in this range' }}>
        {data && (
          <>
            <div className="pown-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <KpiCard icon={IndianRupee} label="TOTAL REVENUE" value={`\u20B9${data.totalRevenue.toLocaleString('en-IN')}`} sub={`${data.orderCount} orders`} />
              <KpiCard icon={Receipt} label="AVG ORDER VALUE" value={`\u20B9${data.metrics.avgOrderValue}`} />
              <KpiCard icon={Star} label="HIGHEST BILL" value={`\u20B9${Number(data.metrics.highestBill.amount || 0).toLocaleString('en-IN')}`} sub={`Table ${data.metrics.highestBill.table}`} />
              <KpiCard icon={LayoutGrid} label="TABLES TURNED" value={data.metrics.tablesTurned} sub={`\u20B9${data.metrics.revenuePerCover} / cover`} />
            </div>

            {data.forecast && (
              <VisualGrid>
                <GaugeCard icon={Target} title="Month target" value={data.forecast.pctAchieved} centerValue={Math.round(Number(data.forecast.pctAchieved) || 0)} label="ACHIEVED"
                  hint={`Target ${fmtINRc(data.forecast.monthTarget)}`} />
                <Card style={{ minWidth: 0 }}>
                  <SectionHeading icon={TrendingUp} title="Month outlook" />
                  <HBarChart valueFormat={fmtCompactINR} nameWidth={104}
                    data={[{ label: 'Target', value: data.forecast.monthTarget }, { label: 'At current pace', value: data.forecast.atCurrentPace }, { label: 'Best case', value: data.forecast.bestCase }]} />
                </Card>
              </VisualGrid>
            )}

            <Card>
              <SectionHeading icon={BarChart3} title="Revenue Trend" />
              <BkArea data={data.dailyBreakdown} yKey="revenue" label="Revenue" valueFormat={fmtINRc} axisFormat={fmtCompactINR} height={220} />
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
              <ChartCard title="Revenue by Source">
                <DonutChart items={foldOther(data.bySource.map(s => ({ label: s.source, value: s.revenue })))} valueFormat={fmtINRc} centerLabel="REVENUE" />
              </ChartCard>
              <ChartCard title="Revenue by Payment Mode">
                <DonutChart items={foldOther(data.byPayment.map(p => ({ label: p.mode, value: p.revenue })))} valueFormat={fmtINRc} centerLabel="COLLECTED" />
              </ChartCard>
              <ChartCard title="Revenue by Time of Day">
                <ColumnChart data={data.byTimeOfDay.map(t => ({ label: t.label, value: t.revenue }))} valueFormat={fmtINRc} height={190} highlightLabel={[...data.byTimeOfDay].sort((a, b) => b.revenue - a.revenue)[0]?.label} />
              </ChartCard>
            </div>

            <Card>
              <SectionHeading icon={Target} title="Revenue Forecast" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                <ForecastStat label="At current pace" value={data.forecast.atCurrentPace} />
                <ForecastStat label="Best case" value={data.forecast.bestCase} />
                <ForecastStat label="Month target" value={data.forecast.monthTarget} />
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, color: T.textLow, fontWeight: 700 }}>{data.forecast.pctAchieved}% of monthly target achieved</span>
                </div>
                <ProgressBar pct={data.forecast.pctAchieved} />
              </div>
            </Card>
          </>
        )}
      </DataBoundary>
    </div>
  );
};

const ForecastStat = ({ label, value }) => (
  <div>
    <Label style={{ marginBottom: 6 }}>{label.toUpperCase()}</Label>
    <Money value={value} size={18} />
  </div>
);

const BreakdownList = ({ items, showPct = true }) => (
  <div style={{ display: 'grid', gap: 12 }}>
    {items.map((it, i) => (
      <div key={i}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: T.textMed, display: 'flex', alignItems: 'center', gap: 6 }}>
            {it.icon && <it.icon size={13} color={T.primary} />}{it.label}
          </span>
          <span style={{ fontSize: 12.5 }}><Money value={it.value} size={12.5} weight={700} /> {showPct && it.pct !== undefined && <span style={{ color: T.textLow, marginLeft: 5 }}>({it.pct}%)</span>}</span>
        </div>
        {showPct && it.pct !== undefined && <ProgressBar pct={it.pct} height={5} />}
      </div>
    ))}
  </div>
);

/* ════════════════════════════════════════════════════════════
   MODULE 3 — REAL-TIME P&L
   ════════════════════════════════════════════════════════════ */
const foodCostTone = (pct) => {
  if (pct < 30) return { tone: 'gold', label: 'Excellent' };
  if (pct < 38) return { tone: 'gold', label: 'Healthy' };
  if (pct < 45) return { tone: 'warning', label: 'Watch this' };
  return { tone: 'danger', label: 'Urgent attention' };
};

const PnlPage = () => {
  const [month, setMonth] = useState(new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7));
  const { data, loading, error, refetch } = useOwnerData('/api/owner/pnl/:tenantId', { params: { month }, refreshMs: 60000 });

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 12.5, color: T.textLow, fontWeight: 700 }}>The real-time margin view — no other Indian POS shows you this live.</div>
        <input type="month" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value); /* clearing it sent month="" and the page errored */ }} style={{ ...inputStyle, width: 160 }} />
      </div>

      <DataBoundary skeleton={<SkPnl />} loading={loading} error={error} onRetry={refetch} empty={data && data.revenue === 0}
        emptyProps={{ icon: PieIcon, title: 'No settled revenue this month yet' }}>
        {data && (() => {
          const fc = foodCostTone(data.foodCostPct);
          return (
            <>
              <Card>
                <SectionHeading icon={Wallet} title="P&L Waterfall" action={<Badge tone={fc.tone}>{data.foodCostPct}% food cost — {fc.label}</Badge>} />
                <div style={{ display: 'grid', gap: 10 }}>
                  <WaterfallRow label="GROSS REVENUE" value={data.revenue} pct={100} strong />
                  <WaterfallRow label="Food Cost" value={-data.foodCost} pct={data.foodCostPct} tone="danger" />
                  <WaterfallRow label="GROSS PROFIT" value={data.grossProfit} pct={data.grossMarginPct} strong divider />
                  <WaterfallRow label="GST Paid" value={-data.gstPaid} pct={data.revenue ? Math.round((data.gstPaid / data.revenue) * 100) : 0} tone="danger" />
                  <WaterfallRow label="Staff Payroll" value={-data.staffCost} pct={data.revenue ? Math.round((data.staffCost / data.revenue) * 100) : 0} tone="danger" />
                  <WaterfallRow label="NET PROFIT" value={data.netProfit} pct={data.netMarginPct} strong divider highlight />
                </div>
              </Card>

              {data.alerts?.length > 0 && (
                <Card style={{ borderColor: 'rgba(240,165,0,0.3)' }}>
                  {data.alerts.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AlertTriangle size={16} color={T.warning} />
                      <span style={{ fontSize: 12.5, color: T.textMed }}>{a.message}</span>
                    </div>
                  ))}
                </Card>
              )}

              <div className="pown-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <KpiCard icon={Percent} label="GROSS MARGIN" value={`${data.grossMarginPct}%`} />
                <KpiCard icon={Percent} label="NET MARGIN" value={`${data.netMarginPct}%`} />
                <KpiCard icon={Target} label="MONTH PROJECTION" value={`\u20B9${data.projection.atCurrentMargin.toLocaleString('en-IN')}`} sub="net profit, if margin holds" />
              </div>

              <VisualGrid>
                <Card style={{ minWidth: 0 }}>
                  <SectionHeading icon={Percent} title="Where each rupee goes" />
                  <DonutChart valueFormat={fmtINRc} centerValue={fmtCompactINR(data.revenue)} centerLabel="REVENUE" size={150}
                    items={[{ label: 'Food cost', value: data.foodCost }, { label: 'Staff cost', value: data.staffCost }, { label: 'GST', value: data.gstPaid }, { label: 'Net profit', value: data.netProfit }]} />
                </Card>
                <GaugeCard icon={Percent} title="Gross margin" value={data.grossMarginPct} centerValue={Math.round(Number(data.grossMarginPct) || 0)} label="GROSS" hint="Revenue left after food cost" />
                <GaugeCard icon={Percent} title="Net margin" value={Math.max(0, Number(data.netMarginPct) || 0)} centerValue={Math.round(Number(data.netMarginPct) || 0)} label="NET" hint="Revenue kept after all costs" />
              </VisualGrid>

              <Card>
                <SectionHeading icon={TrendingUp} title="Daily Net Profit Trend" />
                <BkLine data={data.revenueByDay} yKey="profit" label="Profit" valueFormat={fmtINRc} axisFormat={fmtCompactINR} height={200} />
              </Card>

              <Card>
                <SectionHeading icon={Flame} title="Top Cost Drivers" />
                <BreakdownList items={data.topCostIngredients.map(c => ({ label: c.name, value: c.cost, pct: c.pct }))} />
              </Card>
            </>
          );
        })()}
      </DataBoundary>
    </div>
  );
};

const WaterfallRow = ({ label, value, pct, tone, strong, divider, highlight }) => (
  <div style={{ borderTop: divider ? `1px solid ${T.border}` : 'none', paddingTop: divider ? 10 : 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontSize: strong ? 13 : 12.5, fontWeight: strong ? 800 : 600, color: highlight ? T.primary : strong ? T.textHigh : T.textMed }}>{label}</span>
      <Money value={Math.abs(value)} size={strong ? 15 : 13} weight={strong ? 800 : 700}
        color={value < 0 ? T.danger : highlight ? T.primary : T.textHigh}
        prefix={value < 0 ? '\u2212\u20B9' : '\u20B9'} />
    </div>
    <ProgressBar pct={pct} tone={tone === 'danger' ? 'danger' : highlight ? 'gold' : 'gold'} height={6} />
  </div>
);

/* ════════════════════════════════════════════════════════════
   MODULE 4 — MENU INTELLIGENCE
   ════════════════════════════════════════════════════════════ */
const QUADRANT_META = {
  stars: { label: 'Stars', hint: 'Promote aggressively, protect margin', tone: 'gold' },
  plowhorses: { label: 'Plowhorses', hint: 'Raise price 10–15%, or trim portion cost', tone: 'warning' },
  puzzles: { label: 'Puzzles', hint: 'Market more, add photos, improve placement', tone: 'gold' },
  dogs: { label: 'Dogs', hint: 'Consider removing or repricing', tone: 'danger' },
};

const MenuPage = () => {
  const { data, loading, error, refetch } = useOwnerData('/api/owner/menu/insights/:tenantId', { refreshMs: 60000 });
  const [priceModal, setPriceModal] = useState(null);
  const { tenantId, liveStockEvent } = useOwner();
  useEffect(() => { if (liveStockEvent?.type === 'menu_updated') refetch(); }, [liveStockEvent]); // eslint-disable-line

  const savePrice = async (itemId, price) => {
    await api.patch(`/api/owner/menu/price/${tenantId}/${itemId}`, { price: Number(price) });
    setPriceModal(null); refetch();
  };

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <DataBoundary skeleton={<SkMenu />} loading={loading} error={error} onRetry={refetch} empty={data && data.dishTable.length === 0}
        emptyProps={{ icon: UtensilsCrossed, title: 'No menu items with sales data' }}>
        {data && (
          <>
            {data.deadItemsCount > 0 && (
              <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: T.dangerSoft.replace('0.14', '0.35') }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={16} color={T.danger} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{data.deadItemsCount} dishes had zero orders this month</span>
                </div>
                <Badge tone="danger">Review</Badge>
              </Card>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {Object.entries(QUADRANT_META).map(([key, meta]) => (
                <Card key={key}>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <div className="pown-mono" style={{ fontSize: 22, fontWeight: 800, margin: '10px 0 4px' }}>{data.matrix[key]?.length || 0}</div>
                  <div style={{ fontSize: 11, color: T.textLow, lineHeight: 1.5 }}>{meta.hint}</div>
                </Card>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
              <ChartCard icon={TrendingUp} title="Top Dishes by Revenue" hint="Best earners this month">
                <HBarChart data={[...data.dishTable].sort((a, b) => b.revenue - a.revenue).slice(0, 8).map(d => ({ label: d.name, value: d.revenue }))} valueFormat={fmtINRc} nameWidth={118} />
              </ChartCard>
              <ChartCard icon={PieIcon} title="Category Share" hint="Where the revenue comes from">
                <DonutChart items={foldOther(data.categoryBreakdown.map(c => ({ label: c.category, value: c.revenue })))} valueFormat={fmtINRc} centerLabel="REVENUE" />
              </ChartCard>
              <ChartCard icon={ClipboardList} title="Menu Matrix" hint="Dishes per quadrant">
                <HBarChart data={Object.entries(QUADRANT_META).map(([key, meta]) => ({ label: meta.label, value: data.matrix[key]?.length || 0 }))} nameWidth={100} />
              </ChartCard>
            </div>

            <Card padded={false}>
              <div style={{ padding: '18px 20px 0' }}><SectionHeading icon={ClipboardList} title="Dish Performance" /></div>
              <div className="pown-scroll-hint"><ArrowLeftRight size={12} />Scroll sideways for more columns</div>
              <div className="pown-table-scroll pown-scrollpane">
                <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Dish', 'Sold', 'Revenue', 'Margin', 'Category', ''].map(h => (
                        <th key={h} style={{ textAlign: h === 'Dish' ? 'left' : 'right', padding: '10px 20px', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: T.textLow, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.dishTable.slice(0, 30).map(d => (
                      <tr key={d._id} className="pown-row-hover" style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: '11px 20px', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{d.name}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }} className="pown-mono">{d.sold}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }}><Money value={d.revenue} size={12.5} /></td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }} className="pown-mono">{d.marginPct}%</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }}><Badge tone={QUADRANT_META[d.quadrant.toLowerCase()]?.tone}>{d.quadrant}</Badge></td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                          <button type="button" onClick={() => setPriceModal(d)} className="pown-btn" style={{ background: 'transparent', color: T.primary, fontSize: 11.5, fontWeight: 700 }}>Reprice</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <SectionHeading title="Category Revenue" />
              <BreakdownList items={data.categoryBreakdown.map(c => ({ label: c.category, value: c.revenue, pct: c.pct }))} />
            </Card>
          </>
        )}
      </DataBoundary>

      <Modal open={!!priceModal} onClose={() => setPriceModal(null)} title={`Reprice — ${priceModal?.name || ''}`}>
        {priceModal && <RepriceForm item={priceModal} onSave={savePrice} />}
      </Modal>
    </div>
  );
};

const RepriceForm = ({ item, onSave }) => {
  const [price, setPrice] = useState(item.price ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    // An empty field is Number('') === 0, which the server accepts as a valid price: the dish silently became free.
    const n = Number(price);
    if (String(price).trim() === '' || !Number.isFinite(n) || n <= 0) { setErr('Enter a price greater than 0'); return; }
    setBusy(true); setErr('');
    try { await onSave(item._id, n); }
    catch (e) { setErr(e?.response?.data?.error || e?.message || 'Could not update the price'); setBusy(false); }
  };
  return (
    <div>
      <Field label="NEW PRICE (₹)">
        <input type="number" min="0" step="0.01" value={price} onChange={e => { setPrice(e.target.value); setErr(''); }} style={inputStyle} />
      </Field>
      <div style={{ fontSize: 11.5, color: T.textLow, marginBottom: 16 }}>Current: ₹{Number(item.price || 0).toLocaleString('en-IN')} · {item.sold} sold this month</div>
      {err && <div style={{ fontSize: 12, color: T.danger, marginBottom: 10 }}>{err}</div>}
      <PrimaryBtn icon={Check} disabled={busy} onClick={submit}>{busy ? 'Saving…' : 'Update Price'}</PrimaryBtn>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MODULE 5 — INVENTORY & STOCK
   ════════════════════════════════════════════════════════════ */
const InventoryPage = () => {
  const { data, loading, error, refetch } = useOwnerData('/api/owner/inventory/health/:tenantId', { refreshMs: 60000 });
  const { liveStockEvent } = useOwner();
  useEffect(() => { if (liveStockEvent) refetch(); }, [liveStockEvent]); // eslint-disable-line

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <DataBoundary skeleton={<SkInventory />} loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            <Card>
              <SectionHeading icon={Gauge} title="Stock Health" action={<Money value={data.totalValue} size={14} weight={700} />} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span className="pown-mono" style={{ fontSize: 26, fontWeight: 800 }}>{data.healthScorePct}%</span>
              </div>
              <ProgressBar pct={data.healthScorePct} height={9} />
              <div className="pown-grid-4" style={{ marginTop: 16 }}>
                <StatBlock label="Healthy" value={data.counts.healthy} tone="gold" />
                <StatBlock label="Low" value={data.counts.low} tone="warning" />
                <StatBlock label="Critical" value={data.counts.critical} tone="danger" />
                <StatBlock label="Depleted" value={data.counts.depleted} tone="danger" />
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
              <ChartCard icon={Gauge} title="Stock Status" hint="Ingredients by health">
                <DonutChart centerValue={data.counts.healthy + data.counts.low + data.counts.critical + data.counts.depleted} centerLabel="ITEMS" items={[
                  { label: 'Healthy', value: data.counts.healthy, color: VIZ[2] },
                  { label: 'Low', value: data.counts.low, color: VIZ[4] },
                  { label: 'Critical', value: data.counts.critical, color: VIZ[1] },
                  { label: 'Depleted', value: data.counts.depleted, color: VIZ[5] }
                ]} />
              </ChartCard>
              <ChartCard icon={Flame} title="Wastage Cost" hint="Top wasted items this month">
                <HBarChart data={(data.wastage.topWasted || []).slice(0, 6).map(w => ({ label: w.name, value: w.cost }))} valueFormat={fmtINRc} color={VIZ[1]} nameWidth={110} />
              </ChartCard>
            </div>

            <Card>
              <SectionHeading icon={AlertTriangle} title="Critical Items" />
              {data.criticalItems.length === 0
                ? <EmptyState icon={PackageCheck} title="Nothing critical right now" />
                : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {data.criticalItems.slice(0, 8).map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{it.name}</div>
                          <div className="pown-mono" style={{ fontSize: 11, color: T.textLow }}>{it.currentStock} {it.unit} left</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {it.status === 'depleted'
                            ? <Badge tone="danger">Out of stock</Badge>
                            : it.predictedRunoutTime
                              ? <Badge tone="warning">Runs out {new Date(it.predictedRunoutTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</Badge>
                              : <Badge tone={it.status === 'critical' ? 'danger' : 'warning'}>{it.status}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              <GhostBtn icon={Phone} style={{ marginTop: 14 }} onClick={() => {
                // Was encoded twice (msg, then again in the URL), so the vendor received literal "%0A" and "%20" instead of line breaks and spaces.
                const msg = `Hi, please deliver:\n${data.criticalItems.slice(0, 6).map(i => `- ${i.name}`).join('\n')}\n\nThank you.`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
              }}>Contact Vendor on WhatsApp</GhostBtn>
            </Card>

            <Card>
              <SectionHeading icon={Flame} title="Wastage" />
              <div className="pown-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
                <KpiCard icon={Flame} label="TODAY" value={`\u20B9${data.wastage.today}`} />
                <KpiCard icon={Flame} label="THIS MONTH" value={`\u20B9${data.wastage.month}`} />
                <KpiCard icon={Percent} label="% OF REVENUE" value={`${data.wastage.pctOfRevenue}%`} tone={data.wastage.pctOfRevenue > 2 ? 'danger' : 'default'} />
              </div>
              <BreakdownList showPct={false} items={data.wastage.topWasted.map(w => ({ label: `${w.name} — ${w.reason}`, value: w.cost }))} />
            </Card>
          </>
        )}
      </DataBoundary>
    </div>
  );
};

const StatBlock = ({ label, value, tone }) => (
  <div style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
    <div className="pown-mono" style={{ fontSize: 16, fontWeight: 800, color: tone === 'danger' ? T.danger : tone === 'warning' ? T.warning : T.primary }}>{value}</div>
    <div style={{ fontSize: 10, color: T.textLow, fontWeight: 700, marginTop: 2 }}>{label}</div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   MODULE 6 — KITCHEN PERFORMANCE (read-only KDS view)
   ════════════════════════════════════════════════════════════ */
const KitchenPage = () => {
  const { liveOrderEvent } = useOwner();
  const { data, loading, error, refetch } = useOwnerData('/api/owner/kitchen/summary/:tenantId', { refreshMs: 20000 });
  // Debounced: a busy kitchen fires many dish events per second.
  useEffect(() => {
    if (!liveOrderEvent) return undefined;
    const id = setTimeout(() => refetch(), 1200);
    return () => clearTimeout(id);
  }, [liveOrderEvent]); // eslint-disable-line

  return (
    <div className="pown-fade-in">
      <DataBoundary skeleton={<SkKitchen />} loading={loading} error={error} onRetry={refetch}>
        {data && <KitchenView data={data} />}
      </DataBoundary>
    </div>
  );
};

const ScoreLine = ({ label, value, pass, target }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.textMed }}>{label}</div>
      <div className="pown-mono" style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
      {target && <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 2 }}>Target {target}</div>}{/* target was passed in by every caller but never shown */}
    </div>
    {pass ? <CheckCircle2 size={16} color={T.primary} /> : <AlertTriangle size={16} color={T.warning} />}
  </div>
);

/* ════════════════════════════════════════════════════════════
   MODULE 7 — STAFF & PAYROLL
   ════════════════════════════════════════════════════════════ */
const StaffPage = () => {
  const [month, setMonth] = useState(new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7));
  const { data, loading, error, refetch } = useOwnerData('/api/owner/staff/summary/:tenantId', { params: { month }, refreshMs: 45000 });
  const { liveStaffEvent } = useOwner();
  useEffect(() => { if (liveStaffEvent) refetch(); }, [liveStaffEvent]); // eslint-disable-line

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input type="month" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value); /* clearing it sent month="" and the page errored */ }} style={{ ...inputStyle, width: 160 }} />
      </div>
      <DataBoundary skeleton={<SkStaff />} loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="pown-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <KpiCard icon={UserCheck} label="PRESENT" value={data.attendanceToday.present} sub={`of ${data.attendanceToday.list.length}`} />
              <KpiCard icon={UserX} label="ABSENT" value={data.attendanceToday.absent} tone={data.attendanceToday.absent > 0 ? 'danger' : 'default'} />
              <KpiCard icon={Clock} label="LATE" value={data.attendanceToday.late} />
              <KpiCard icon={Percent} label="STAFF COST RATIO" value={`${data.payroll.staffCostRatio}%`} sub="of revenue" />
            </div>

            <Card padded={false}>
              <div style={{ padding: '18px 20px 0' }}><SectionHeading title="Today's Attendance" /></div>
              <div className="pown-scroll-hint"><ArrowLeftRight size={12} />Scroll sideways for more columns</div>
              <div className="pown-table-scroll pown-scrollpane">
                <table style={{ width: '100%', minWidth: 540, borderCollapse: 'collapse' }}>
                  <thead><tr>{['Name', 'Role', 'Status', 'Clock In', 'Hours'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 20px', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: T.textLow, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {data.attendanceToday.list.map((s, i) => (
                      <tr key={i} className="pown-row-hover" style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: '11px 20px', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 12, color: T.textLow }}>{s.role}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                          <Badge tone={s.status === 'Present' ? 'gold' : s.status === 'Late' ? 'warning' : 'danger'}>{s.status}</Badge>
                        </td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }} className="pown-mono">{s.clockIn || '\u2014'}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }} className="pown-mono">{s.hours ? `${s.hours}h` : '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <SectionHeading icon={Wallet} title={`Payroll — ${data.payroll.monthLabel}`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div><Label>TOTAL</Label><Money value={data.payroll.total} size={17} /></div>
                <div><Label>PAID</Label><Money value={data.payroll.paid} size={17} color={T.primary} /><div style={{ fontSize: 11, color: T.textLow }}>{data.payroll.paidCount} staff</div></div>
                <div><Label>PENDING</Label><Money value={data.payroll.pending} size={17} color={T.danger} /><div style={{ fontSize: 11, color: T.textLow }}>{data.payroll.pendingCount} staff</div></div>
              </div>
              <ProgressBar pct={data.payroll.total ? (data.payroll.paid / data.payroll.total) * 100 : 0} />
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
              <ChartCard icon={UserCheck} title="Today's Attendance">
                <DonutChart centerValue={data.attendanceToday.list.length} centerLabel="STAFF" items={[
                  { label: 'Present', value: data.attendanceToday.present, color: VIZ[2] },
                  { label: 'Late', value: data.attendanceToday.late, color: VIZ[4] },
                  { label: 'Absent', value: data.attendanceToday.absent, color: VIZ[1] }
                ]} />
              </ChartCard>
              <ChartCard icon={Wallet} title="Payroll Status" hint={data.payroll.monthLabel}>
                <DonutChart valueFormat={fmtINRc} centerLabel="TOTAL" items={[
                  { label: 'Paid', value: data.payroll.paid, color: VIZ[2] },
                  { label: 'Pending', value: data.payroll.pending, color: VIZ[4] }
                ]} />
              </ChartCard>
            </div>

            {data.leaderboard.length > 0 && (
              <Card>
                <SectionHeading icon={Award} title="Performance Leaderboard" />
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.leaderboard.map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                      <span className="pown-mono" style={{ width: 20, color: T.textLow, fontSize: 12, fontWeight: 700 }}>#{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{l.name}</span>
                      <span className="pown-mono" style={{ fontSize: 11.5, color: T.textLow }}>{l.tablesServed} tables</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} color={T.primary} fill={T.primary} /><span className="pown-mono" style={{ fontSize: 12 }}>{l.rating ?? '—'}</span></span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </DataBoundary>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MODULE 8 — CUSTOMERS
   ════════════════════════════════════════════════════════════ */
/* DPDP — guests who could not self-verify their deletion request land here for the owner to verify and complete. */
const PrivacyRequestsCard = ({ tenantId }) => {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [note, setNote] = useState('');
  const load = useCallback(async () => {
    try { const r = await api.get(`/api/data-requests/${encodeURIComponent(tenantId)}`); setRows(Array.isArray(r.data) ? r.data : []); } catch { /* optional panel */ }
  }, [tenantId]);
  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);
  const resolve = async (id, action) => {
    if (busyId) return;
    // Erasing a guest's data cannot be undone and was a single click.
    if (action === 'erase' && !window.confirm('Permanently delete this guest\'s data? Bills are kept for tax records with their name and number removed. This cannot be undone.')) return;
    setBusyId(id);
    try {
      await api.post(`/api/data-requests/${encodeURIComponent(tenantId)}/${id}/resolve`, { action });
      setNote(action === 'reject' ? 'Request dismissed' : 'Guest data deleted');
      await load();
    } catch (e) { setNote(e?.response?.data?.error || 'Could not update the request'); }
    finally { setBusyId(''); setTimeout(() => setNote(''), 3500); }
  };
  if (!rows.length && !note) return null;
  return (
    <Card>
      <SectionHeading icon={ShieldCheck} title={`Privacy requests (${rows.length})`} />
      <div style={{ fontSize: 12, color: T.textLow, margin: '2px 0 12px', lineHeight: 1.5 }}>
        Guests asked to delete their data but this device could not prove the number is theirs. Verify (for example by calling them) and then delete. Bills are kept for tax records, with the guest's name and number removed.
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map(r => (
          <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{r.name || 'Guest'}</div>
              <div className="pown-mono" style={{ fontSize: 11.5, color: T.textLow }}>{r.phone} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
            </div>
            <button type="button" disabled={busyId === r._id} onClick={() => resolve(r._id, 'erase')} style={{ padding: '8px 12px', borderRadius: 10, border: 0, background: T.gold || '#d3bfa2', color: '#0f0f11', fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}>Delete data</button>
            <button type="button" disabled={busyId === r._id} onClick={() => resolve(r._id, 'reject')} style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: 'inherit', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}>Dismiss</button>
          </div>
        ))}
      </div>
      {note && <div style={{ marginTop: 10, fontSize: 12, color: T.textLow }}>{note}</div>}
    </Card>
  );
};

const CustomersPage = () => {
  const { data, loading, error, refetch } = useOwnerData('/api/owner/customers/insights/:tenantId', { refreshMs: 90000 });
  const { tenantId } = useOwner();
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [sentOnce, setSentOnce] = useState(false);

  const sendWinback = async () => {
    if (sending || sentOnce || !data?.atRiskList?.length) return;
    // This messages every at-risk customer with an offer, and could be fired again with another click: confirm first, then lock.
    if (!window.confirm(`Send the 15% win-back offer to ${data.atRiskList.length} customers now? This cannot be undone.`)) return;
    setSending(true);
    try {
      await api.post(`/api/owner/customers/winback/${tenantId}`, {
        phones: data.atRiskList.map(c => c.phone),
        message: `We miss you! Here's 15% off your next visit. Valid 7 days.`
      });
      setSendMsg('Win-back offer sent'); setSentOnce(true);
    } catch (e) {
      setSendMsg(e?.response?.data?.error || 'Could not send win-back offer');
    } finally { setSending(false); setTimeout(() => setSendMsg(''), 3500); }
  };

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <PrivacyRequestsCard tenantId={tenantId} />
      <DataBoundary skeleton={<SkCustomers />} loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="pown-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <KpiCard icon={Users} label="TOTAL CUSTOMERS" value={data.overview.total} sub={`+${data.overview.newThisMonth} this month`} />
              <KpiCard icon={ThumbsUp} label="RETURNING" value={`${data.overview.returningPct}%`} />
              <KpiCard icon={AlertTriangle} label="AT-RISK" value={data.overview.atRisk} tone={data.overview.atRisk > 0 ? 'danger' : 'default'} />
              <KpiCard icon={Star} label="AVG VISITS" value={data.overview.avgVisits} />
            </div>

            <VisualGrid>
              <GaugeCard icon={ThumbsUp} title="Returning customers" value={data.overview.returningPct} centerValue={Math.round(Number(data.overview.returningPct) || 0)} label="RETURNING" hint={`${data.overview.total} customers in total`} />
              <GaugeCard icon={AlertTriangle} title="At-risk share" value={data.overview.total ? (data.overview.atRisk / data.overview.total) * 100 : 0} centerValue={Math.round(data.overview.total ? (data.overview.atRisk / data.overview.total) * 100 : 0)} label="AT RISK" hint={`${data.overview.atRisk} haven't visited in a while`} />
            </VisualGrid>

            <div className="pown-grid-4">
              <StatBlock label="VIP" value={data.segments.vip} tone="gold" />
              <StatBlock label="Regular" value={data.segments.regular} />
              <StatBlock label="One-time" value={data.segments.oneTime} />
              <StatBlock label="At-risk" value={data.segments.atRisk} tone="danger" />
            </div>

            <ChartCard icon={Users} title="Customer Segments" hint="How your guests split by visit pattern">
              <DonutChart centerValue={data.overview.total} centerLabel="CUSTOMERS" items={[
                { label: 'VIP', value: data.segments.vip, color: VIZ[3] },
                { label: 'Regular', value: data.segments.regular, color: VIZ[0] },
                { label: 'One-time', value: data.segments.oneTime, color: VIZ[4] },
                { label: 'At-risk', value: data.segments.atRisk, color: VIZ[1] }
              ]} />
            </ChartCard>

            <Card>
              <SectionHeading icon={Megaphone} title="Win-Back Campaign"
                action={<Badge tone="gold">{data.atRiskList.length} at-risk</Badge>} />
              <p style={{ fontSize: 12.5, color: T.textMed, lineHeight: 1.6, marginBottom: 14 }}>
                "We miss you! Here's 15% off your next visit. Valid 7 days." — sent to customers silent for 30+ days. Estimated response rate 25–30%.
              </p>
              <PrimaryBtn icon={Send} onClick={sendWinback} disabled={sending || sentOnce || !data.atRiskList.length}>
                {sending ? 'Sending…' : sentOnce ? 'Offer sent' : `Send to ${data.atRiskList.length} At-Risk Customers`}
              </PrimaryBtn>
              {sendMsg && <div role="status" style={{ marginTop: 8, fontSize: 12, color: T.textLow }}>{sendMsg}</div>}
            </Card>

            <Card padded={false}>
              <div style={{ padding: '18px 20px 0' }}><SectionHeading title="Top Customers" /></div>
              <div className="pown-scroll-hint"><ArrowLeftRight size={12} />Scroll sideways for more columns</div>
              <div className="pown-table-scroll pown-scrollpane">
                <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
                  <thead><tr>{['Customer', 'Visits', 'Lifetime Spend', 'Last Visit', 'Favourite'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 20px', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: T.textLow, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {data.topCustomers.map((c, i) => (
                      <tr key={i} className="pown-row-hover" style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: '11px 20px', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.name} <span className="pown-mono" style={{ color: T.textLow, fontSize: 11 }}>{c.phone}</span></td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }} className="pown-mono">{c.visits}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }}><Money value={c.lifetimeSpend} size={12.5} /></td>
                        <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 11.5, color: T.textLow }}>{c.lastVisit != null ? `${c.lastVisit}d ago` : '\u2014'}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 12 }}>{c.favourite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </DataBoundary>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MODULE 9 — ALERTS & NOTIFICATIONS
   ════════════════════════════════════════════════════════════ */

const AlertsPage = () => {
  const { data, loading, error, refetch } = useOwnerData('/api/owner/alerts/:tenantId', { refreshMs: 30000 });
  const { data: notifData, refetch: refetchNotifs } = useOwnerData('/api/owner/notifications/:tenantId', { refreshMs: 30000 });
  const { liveAlert, liveAdminNotification } = useOwner();

  useEffect(() => { if (liveAlert) refetch(); }, [liveAlert]); // eslint-disable-line
  useEffect(() => { if (liveAdminNotification) refetchNotifs(); }, [liveAdminNotification]); // eslint-disable-line

  // "Mark all read" fires one request per item; refetch once after the burst instead of once per item.
  const refetchTimer = useRef(null);
  const refetchSoon = () => { clearTimeout(refetchTimer.current); refetchTimer.current = setTimeout(() => { refetch(); refetchNotifs(); }, 450); };
  useEffect(() => () => clearTimeout(refetchTimer.current), []);
  const markRead = async (id) => { try { await api.post(`/api/owner/alerts/read/${id}`); } catch (_) { /* ignore; refetch shows truth */ } refetchSoon(); };
  const markNotifRead = async (id) => { try { await api.post(`/api/owner/notifications/${id}/read`); } catch (_) { /* ignore */ } refetchSoon(); };

  return (
    <div className="pown-fade-in">
      <DataBoundary skeleton={<SkAlerts />} loading={loading} error={error} onRetry={refetch}>
        {data && <AlertsView alerts={data.alerts || []} notifs={notifData || []} onReadAlert={markRead} onReadNotif={markNotifRead} live={!!liveAlert} />}
      </DataBoundary>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MODULE 10 — COMPLIANCE & GST
   ════════════════════════════════════════════════════════════ */
const CompliancePage = () => {
  const [month, setMonth] = useState(new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7));
  const { data, loading, error, refetch } = useOwnerData('/api/owner/reports/gst/:tenantId', { params: { month }, refreshMs: 120000 });
  const { tenantId } = useOwner();
  const [toast, flash] = useFlash();

  const exportInvoiceRegister = () => {
    if (!data) return;
    downloadExcel(`invoice-register-${month}.xlsx`, [
      { name: 'Invoice Register', rows: data.invoiceRegister.map(r => ({ 'Bill No': r.billNo, Date: r.date, Table: r.table, Amount: r.amount, GST: r.gst, Payment: r.payment })) }
    ]);
    flash('Invoice register downloaded');
  };

  const exportGstr1 = () => {
    if (!data) return;
    // GSTR-1 (outward supplies) — B2C summary derived from settled invoices this month.
    downloadExcel(`GSTR1-${month}.xlsx`, [
      { name: 'B2C (Others)', rows: [{ 'Place of Supply': 'Intra-state', 'Rate %': (Number(data.cgstPct) + Number(data.sgstPct)), 'Taxable Value': Number((Number(data.revenue) - Number(data.totalGST)).toFixed(2)), 'CGST': data.cgst, 'SGST': data.sgst, 'Invoice Value': data.revenue, 'Total Invoices': data.invoiceRegister.length }] },
      { name: 'Invoice-wise', rows: data.invoiceRegister.map(r => ({ 'Invoice No': r.billNo, Date: r.date, 'Taxable Value': Number((r.amount - r.gst).toFixed(2)), GST: r.gst, 'Invoice Value': r.amount })) },
    ]);
    flash('GSTR-1 data downloaded');
  };

  const exportGstr3b = () => {
    if (!data) return;
    downloadExcel(`GSTR3B-${month}.xlsx`, [
      { name: 'Summary', rows: [{
        Month: data.monthLabel, 'Total Taxable Value': Math.round(data.revenue - data.totalGST),
        'CGST Payable': data.cgst, 'SGST Payable': data.sgst, 'Total Tax Liability': data.totalGST,
        'FY Turnover So Far': data.fyTurnoverSoFar, Regime: data.regime
      }] }
    ]);
    flash('GSTR-3B data downloaded');
  };

  const emailToCa = () => {
    if (!data) return;
    const subject = encodeURIComponent(`GST Summary — ${data.monthLabel} — ${tenantId}`);
    const body = encodeURIComponent(
      `GST summary for ${data.monthLabel}\n\n` +
      `Revenue: ${rupee(data.revenue)}\nCGST (${data.cgstPct}%): ${rupee(data.cgst)}\nSGST (${data.sgstPct}%): ${rupee(data.sgst)}\n` +
      `Total GST due: ${rupee(data.totalGST)}\n\nFY turnover so far: ${rupee(data.fyTurnoverSoFar)}\nProjected annual: ${rupee(data.projectedAnnual)}\nRegime: ${data.regime}\n\n` +
      `(Full invoice register attached separately — download from the Owner App and attach before sending.)`
    );
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input type="month" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value); /* clearing it sent month="" and the page errored */ }} style={{ ...inputStyle, width: 160 }} />
      </div>
      <DataBoundary skeleton={<SkCompliance />} loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            <Card>
              <SectionHeading icon={ShieldCheck} title={`GST Overview — ${data.monthLabel}`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                <div><Label>REVENUE</Label><Money value={data.revenue} size={17} /></div>
                <div><Label>{`CGST @ ${data.cgstPct}%`}</Label><Money value={data.cgst} size={17} /></div>
                <div><Label>{`SGST @ ${data.sgstPct}%`}</Label><Money value={data.sgst} size={17} /></div>
                <div><Label>TOTAL GST DUE</Label><Money value={data.totalGST} size={17} color={T.primary} /></div>
              </div>
            </Card>

            <Card>
              <SectionHeading title="Annual Turnover Tracker" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 12 }}>
                <div><Label>FY SO FAR</Label><Money value={data.fyTurnoverSoFar} size={16} /></div>
                <div><Label>PROJECTED ANNUAL</Label><Money value={data.projectedAnnual} size={16} /></div>
                <div><Label>COMPOSITION LIMIT</Label><Money value={data.compositionLimit} size={16} /></div>
              </div>
              <Badge tone={data.regime.includes('REGULAR') ? 'gold' : 'warning'}>{data.regime}</Badge>
            </Card>

            <VisualGrid>
              <Card style={{ minWidth: 0 }}>
                <SectionHeading icon={Receipt} title="GST split" />
                <DonutChart valueFormat={fmtINRc} centerValue={fmtINRc(data.totalGST)} centerLabel="TOTAL GST" size={150}
                  items={[{ label: `CGST @ ${data.cgstPct}%`, value: data.cgst }, { label: `SGST @ ${data.sgstPct}%`, value: data.sgst }]} />
              </Card>
              {Number(data.compositionLimit) > 0 && (
                <GaugeCard icon={ShieldCheck} title="Composition limit used" value={(Number(data.fyTurnoverSoFar) / Number(data.compositionLimit)) * 100}
                  centerValue={Math.round((Number(data.fyTurnoverSoFar) / Number(data.compositionLimit)) * 100)} label="OF LIMIT"
                  hint={`Projected annual ${fmtCompactINR(data.projectedAnnual)} vs limit ${fmtCompactINR(data.compositionLimit)}`} />
              )}
            </VisualGrid>

            <Card>
              <SectionHeading icon={FileSpreadsheet} title="Downloads" />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <GhostBtn icon={FileSpreadsheet} onClick={exportInvoiceRegister}>Invoice Register (Excel)</GhostBtn>
                <GhostBtn icon={FileText} onClick={exportGstr1}>GSTR-1 Data</GhostBtn>
                <GhostBtn icon={FileText} onClick={exportGstr3b}>GSTR-3B Data</GhostBtn>
                <GhostBtn icon={Mail} onClick={emailToCa}>Email to CA</GhostBtn>
              </div>
              <div style={{ fontSize: 10.5, color: T.textLow, marginTop: 10, lineHeight: 1.6 }}>
                GSTR exports are computation aids derived from settled invoices — verify against your books before filing.
              </div>
            </Card>

            <Card padded={false}>
              <div style={{ padding: '18px 20px 0' }}><SectionHeading title="Invoice Register" /></div>
              <div className="pown-scroll-hint"><ArrowLeftRight size={12} />Scroll sideways for more columns</div>
              {data.invoiceRegister.length > 200 && <div style={{ padding: '0 20px 8px', fontSize: 11, color: T.textLow }}>Showing the first 200 of {data.invoiceRegister.length} invoices. The Excel downloads include all of them.</div>}
              <div className="pown-scrollpane" style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse' }}>
                  <thead><tr>{['Bill No', 'Date', 'Table', 'Amount', 'GST', 'Payment'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 20px', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: T.textLow, position: 'sticky', top: 0, background: T.surface, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {data.invoiceRegister.slice(0, 200).map((r, i) => (
                      <tr key={i} className="pown-row-hover" style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 20px', fontSize: 12 }} className="pown-mono">{r.billNo}</td>
                        <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: 11.5, color: T.textLow }}>{r.date}</td>
                        <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: 12 }}>{r.table}</td>
                        <td style={{ padding: '10px 20px', textAlign: 'right' }}><Money value={r.amount} size={12} /></td>
                        <td style={{ padding: '10px 20px', textAlign: 'right' }} className="pown-mono">{r.gst}</td>
                        <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: 11.5 }}>{r.payment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </DataBoundary>
      <Toast message={toast} />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MODULE 11 — REPORTS & EXPORTS
   ════════════════════════════════════════════════════════════ */
const REPORT_TYPES = [
  { key: 'daily', label: 'Daily Closing Report', icon: CalendarClock, format: 'PDF' },
  { key: 'weekly', label: 'Weekly Summary', icon: BarChart3, format: 'PDF' },
  { key: 'pnl', label: 'Monthly P&L Report', icon: PieIcon, format: 'PDF' },
  { key: 'inventory', label: 'Inventory Report', icon: Package, format: 'Excel' },
  { key: 'dishes', label: 'Dish Profitability', icon: UtensilsCrossed, format: 'Excel' },
  { key: 'staff', label: 'Staff Report', icon: Users, format: 'Excel' },
  { key: 'gst', label: 'GST Report', icon: ShieldCheck, format: 'Excel' },
];

const ReportsPage = () => {
  const { tenantId } = useOwner();
  const [downloading, setDownloading] = useState(null);
  const [toast, flash] = useFlash();

  const buildDaily = (d) => {
    const doc = newBrandedPdf('Daily Closing Report', `${d.date} · ${tenantId}`);
    let y = 34;
    y = pdfSection(doc, y, 'Summary', ['Metric', 'Value'], [
      ['Total Revenue', rupee(d.revenue)], ['Orders Settled', d.orderCount],
      ['Cash in Hand', rupee(d.cashInHand)], ['Wastage Cost', rupee(d.wastageCost)],
      ['Staff Present', `${d.staffAttendance.present} / ${d.staffAttendance.total}`]
    ]);
    y = pdfSection(doc, y, 'Top 5 Dishes', ['Dish', 'Qty Sold', 'Revenue'],
      d.top5Dishes.map(x => [x.name, x.qty, rupee(x.revenue)]));
    pdfSection(doc, y, 'Payment Split', ['Mode', 'Amount'], [
      ['Cash', rupee(d.paymentSplit.cash)], ['UPI', rupee(d.paymentSplit.upi)], ['Card', rupee(d.paymentSplit.card)]
    ]);
    savePdf(doc, `daily-closing-${d.date}.pdf`);
  };

  const buildWeekly = (d) => {
    const doc = newBrandedPdf('Weekly Summary', `${d.from} to ${d.to} · ${tenantId}`);
    let y = 34;
    y = pdfSection(doc, y, 'Overview', ['Metric', 'Value'], [['Total Revenue', rupee(d.totalRevenue)]]);
    y = pdfSection(doc, y, 'Revenue by Day', ['Date', 'Revenue'], d.revenueByDay.map(x => [x.date, rupee(x.revenue)]));
    pdfSection(doc, y, 'Top Dishes', ['Dish', 'Qty Sold'], d.topDishes.map(x => [x.name, x.qty]));
    savePdf(doc, `weekly-summary-${d.to}.pdf`);
  };

  const buildPnl = (d) => {
    const doc = newBrandedPdf('Monthly P&L Report', `${d.monthLabel} · ${tenantId}`);
    let y = 34;
    y = pdfSection(doc, y, 'Waterfall', ['Line', 'Amount', '% of Revenue'], [
      ['Gross Revenue', rupee(d.revenue), '100%'],
      ['Food Cost', `- ${rupee(d.foodCost)}`, `${d.foodCostPct}%`],
      ['Gross Profit', rupee(d.grossProfit), `${d.grossMarginPct}%`],
      ['GST Paid', `- ${rupee(d.gstPaid)}`, ''],
      ['Staff Payroll', `- ${rupee(d.staffCost)}`, ''],
      ['Net Profit', rupee(d.netProfit), `${d.netMarginPct}%`],
    ]);
    y = pdfSection(doc, y, 'Top Cost Drivers', ['Ingredient', 'Cost', '% of Food Cost'],
      d.topCostIngredients.map(x => [x.name, rupee(x.cost), `${x.pct}%`]));
    if (d.alerts?.length) pdfSection(doc, y, 'Alerts', ['Message'], d.alerts.map(a => [a.message]));
    savePdf(doc, `pnl-${d.monthLabel}.pdf`);
  };

  const buildInventoryExcel = (d) => downloadExcel(`inventory-report-${todayLabel()}.xlsx`, [
    { name: 'Stock Health', rows: [{ 'Health Score %': d.healthScorePct, Healthy: d.counts.healthy, Low: d.counts.low, Critical: d.counts.critical, Depleted: d.counts.depleted, 'Total Stock Value': d.totalValue }] },
    { name: 'Critical Items', rows: d.criticalItems.map(i => ({ Item: i.name, 'Current Stock': i.currentStock, Unit: i.unit, Status: i.status, 'Predicted Runout': i.predictedRunoutTime || '—' })) },
    { name: 'Wastage', rows: d.wastage.topWasted.map(w => ({ Item: w.name, Cost: w.cost, Reason: w.reason })) },
  ]);

  const buildDishesExcel = (d) => downloadExcel(`dish-profitability-${d.monthLabel}.xlsx`, [
    { name: 'Dish Performance', rows: d.dishTable.map(x => ({ Dish: x.name, Category: x.category, Price: x.price, 'Sold (mo)': x.sold, Revenue: x.revenue, 'Margin %': x.marginPct, Quadrant: x.quadrant })) },
    { name: 'Category Revenue', rows: d.categoryBreakdown.map(c => ({ Category: c.category, Revenue: c.revenue, '% of Total': c.pct })) },
  ]);

  const buildStaffExcel = (d) => downloadExcel(`staff-report-${d.payroll.monthLabel}.xlsx`, [
    { name: 'Today Attendance', rows: d.attendanceToday.list.map(s => ({ Name: s.name, Role: s.role, Status: s.status, 'Clock In': s.clockIn || '—', Hours: s.hours })) },
    { name: 'Payroll', rows: [{ Month: d.payroll.monthLabel, Total: d.payroll.total, Paid: d.payroll.paid, 'Paid Count': d.payroll.paidCount, Pending: d.payroll.pending, 'Pending Count': d.payroll.pendingCount, 'Staff Cost Ratio %': d.payroll.staffCostRatio }] },
    { name: 'Leaderboard', rows: d.leaderboard.map(l => ({ Name: l.name, 'Tables Served': l.tablesServed, 'Avg Service (min)': l.avgService, Rating: l.rating })) },
  ]);

  const buildGstExcel = (d) => downloadExcel(`gst-report-${d.monthLabel}.xlsx`, [
    { name: 'GST Summary', rows: [{ Month: d.monthLabel, Revenue: d.revenue, CGST: d.cgst, SGST: d.sgst, 'Total GST': d.totalGST, 'FY Turnover So Far': d.fyTurnoverSoFar, 'Projected Annual': d.projectedAnnual, Regime: d.regime }] },
    { name: 'Invoice Register', rows: d.invoiceRegister.map(r => ({ 'Bill No': r.billNo, Date: r.date, Table: r.table, Amount: r.amount, GST: r.gst, Payment: r.payment })) },
  ]);

  const download = async (type) => {
    if (downloading) return; // two clicks at once raced the shared "downloading" flag
    setDownloading(type);
    try {
      if (type === 'daily') buildDaily((await api.get(`/api/owner/reports/daily/${tenantId}`)).data);
      else if (type === 'weekly') buildWeekly((await api.get(`/api/owner/reports/weekly/${tenantId}`)).data);
      else if (type === 'pnl') buildPnl((await api.get(`/api/owner/reports/pnl/${tenantId}`)).data);
      else if (type === 'inventory') buildInventoryExcel((await api.get(`/api/owner/inventory/health/${tenantId}`)).data);
      else if (type === 'dishes') buildDishesExcel((await api.get(`/api/owner/menu/insights/${tenantId}`)).data);
      else if (type === 'staff') buildStaffExcel((await api.get(`/api/owner/staff/summary/${tenantId}`)).data);
      else if (type === 'gst') buildGstExcel((await api.get(`/api/owner/reports/gst/${tenantId}`)).data);
      flash('Report downloaded');
    } catch (e) {
      flash(e?.response?.data?.error || 'Could not generate report');
    } finally { setDownloading(null); }
  };

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 14 }}>
      <p style={{ fontSize: 12.5, color: T.textLow, lineHeight: 1.6, maxWidth: 560 }}>
        The daily closing report auto-generates at 11 PM and is sent to your registered email. Tap any card below to pull it on demand.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {REPORT_TYPES.map(r => (
          <Card key={r.key} interactive style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <r.icon size={18} color={T.primary} />
              </div>
              <Badge tone="neutral">{r.format}</Badge>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{r.label}</div>
            <GhostBtn icon={downloading === r.key ? Loader2 : Download} onClick={() => download(r.key)} style={{ justifyContent: 'center' }}>
              {downloading === r.key ? 'Preparing…' : 'Download'}
            </GhostBtn>
          </Card>
        ))}
      </div>
      <Toast message={toast} />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   EXECUTIVE INSIGHTS — compact owner decision centre
   ════════════════════════════════════════════════════════════ */
const ExecutiveInsightsPage = () => {
  const navigate = useNavigate();
  const { tenantId, liveOrderEvent, liveStockEvent } = useOwner();
  const { data, loading, error, refetch } = useOwnerData('/api/owner/insights/:tenantId', { refreshMs: 60000 });
  useEffect(() => { if (liveOrderEvent || liveStockEvent) refetch(); }, [liveOrderEvent, liveStockEvent]);
  return (
    <div className="pown-fade-in" style={{ display:'grid', gap:16 }}>
      <Card interactive style={{ padding:'22px', background:`linear-gradient(135deg, ${T.surfaceRaised}, rgba(211,191,162,0.07))`, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', width:220, height:220, right:-80, top:-100, borderRadius:'50%', background:T.primarySoft, filter:'blur(4px)', pointerEvents:'none' }} />
        <Badge tone="gold">Owner decision centre</Badge>
        <div style={{ fontSize:21, fontWeight:800, marginTop:10, letterSpacing:-0.4 }}>Know what needs attention now.</div>
        <div style={{ fontSize:12, color:T.textMed, marginTop:5, lineHeight:1.6, maxWidth:620 }}>A compact snapshot built from settled revenue anchors, live stock and stored customer totals.</div>
      </Card>
      <DataBoundary skeleton={<SkInsights />} loading={loading} error={error} onRetry={refetch}>
        {data && <>
          <div className="pown-stagger pown-kpi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))', gap:12 }}>
            <KpiCard hero icon={IndianRupee} label="TODAY" value={`₹${Number(data.today.revenue||0).toLocaleString('en-IN')}`} sub={`${data.today.orders} settled bills`} />
            <KpiCard icon={TrendingUp} label="MONTH" value={`₹${Number(data.month.revenue||0).toLocaleString('en-IN')}`} sub={`${data.month.orders} settled orders`} />
            <KpiCard icon={Receipt} label="GST" value={`₹${Number(data.month.gst||0).toLocaleString('en-IN')}`} sub="stored invoice tax" />
            <KpiCard icon={Package} label="LOW STOCK" value={data.inventory.lowStock} sub={`${data.inventory.total} inventory items`} tone={data.inventory.lowStock ? 'danger' : 'default'} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 240px), 1fr))', gap:14 }}>
            <Card><SectionHeading icon={Wallet} title="Financial pulse" /><div style={{ display:'grid', gap:10 }}><InsightRow label="Average order value" value={`₹${Number(data.month.avgOrderValue||0).toLocaleString('en-IN')}`} /><InsightRow label="Month GST" value={`₹${Number(data.month.gst||0).toLocaleString('en-IN')}`} /><InsightRow label="Settled orders" value={data.month.orders} /></div></Card>
            <Card><SectionHeading icon={Package} title="Stock pulse" /><div style={{ display:'grid', gap:10 }}><InsightRow label="Inventory value" value={`₹${Number(data.inventory.stockValue||0).toLocaleString('en-IN')}`} /><InsightRow label="Low-stock items" value={data.inventory.lowStock} /><InsightRow label="Total items" value={data.inventory.total} /></div></Card>
            <Card><SectionHeading icon={Users} title="Customer pulse" /><div style={{ display:'grid', gap:10 }}><InsightRow label="Customers" value={data.customers.total} /><InsightRow label="Loyal customers" value={data.customers.loyal} /><InsightRow label="Loyalty rate" value={`${data.customers.loyaltyRate}%`} /></div></Card>
          </div>
          <VisualGrid>
            <GaugeCard icon={Package} title="Stock health" value={data.inventory.total ? ((data.inventory.total - data.inventory.lowStock) / data.inventory.total) * 100 : 0}
              centerValue={Math.round(data.inventory.total ? ((data.inventory.total - data.inventory.lowStock) / data.inventory.total) * 100 : 0)} label="WELL STOCKED" hint={`${data.inventory.lowStock} of ${data.inventory.total} items running low`} />
            {Number(data.customers.total) > 0 && (
              <GaugeCard icon={Users} title="Loyal customers" value={(Number(data.customers.loyal) / Number(data.customers.total)) * 100}
                centerValue={Math.round((Number(data.customers.loyal) / Number(data.customers.total)) * 100)} label="OF CUSTOMERS" hint={`${data.customers.loyal} of ${data.customers.total} are loyal`} />
            )}
          </VisualGrid>
          <Card><SectionHeading icon={Zap} title="Suggested actions" /><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
            {data.inventory.lowStock > 0 && <InsightAction label="Review low stock" onClick={() => navigate(`/owner/${tenantId}/inventory`)} />}
            <InsightAction label="Review revenue & sales" onClick={() => navigate(`/owner/${tenantId}/revenue`)} />
            <InsightAction label="Review customer retention" onClick={() => navigate(`/owner/${tenantId}/customers`)} />
          </div></Card>
        </>}
      </DataBoundary>
    </div>
  );
};
const InsightRow = ({ label, value }) => <div style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'10px 0', borderTop:`1px solid ${T.border}` }}><span style={{ fontSize:12, color:T.textMed }}>{label}</span><span className="pown-mono" style={{ fontSize:12.5, fontWeight:800, color:T.textHigh }}>{value}</span></div>;
const InsightAction = ({ label, onClick }) => <button type="button" onClick={onClick} className="pown-btn" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 13px', background:T.primarySoft, border:`1px solid ${T.borderStrong}`, color:T.textHigh, borderRadius:11, fontSize:12.5, fontWeight:700 }}>{label}<ChevronRight size={14} color={T.primary} /></button>;

/* ════════════════════════════════════════════════════════════
   "WHY PRATYEKSHA" — growth-oriented value tab
   ════════════════════════════════════════════════════════════ */
const GROWTH_PILLARS = [
  {
    icon: Zap, title: 'Live, not next-morning',
    body: "Revenue, food cost, and table status update the moment a bill settles — no end-of-day reconciliation, no waiting for someone to export a spreadsheet."
  },
  {
    icon: Gauge, title: 'One number that matters: margin',
    body: 'Most POS systems show you revenue. Pratyeksha computes food cost from your actual recipes and inventory, so you see real-time gross profit — not just top-line sales.'
  },
  {
    icon: ShieldCheck, title: 'GST-ready, always',
    body: 'Every settled invoice already carries its tax breakdown. Compliance, invoice registers, and GSTR exports are generated from the same ledger — never re-entered by hand.'
  },
  {
    icon: Bell, title: 'It watches, so you don\u2019t have to',
    body: 'Low stock, a large discount, a delayed kitchen ticket, an unusually quiet day — these surface as alerts the moment they happen, on whichever device you have open.'
  },
];

const GROWTH_COMPARISON = [
  { manual: 'Reconcile cash and card totals at midnight', pratyeksha: 'Payment split updates live as each table settles' },
  { manual: 'Call the kitchen to ask what\u2019s running low', pratyeksha: 'Inventory health and predicted stock-outs, on one screen' },
  { manual: 'Export orders to Excel to estimate food cost', pratyeksha: 'Food cost computed automatically from recipes + stock' },
  { manual: 'Chase a CA every month for GST numbers', pratyeksha: 'Invoice register and GST summary, one tap away' },
  { manual: 'Find out a dish is unpopular after months', pratyeksha: 'Menu Intelligence flags dead items and low-margin dishes' },
];

const GrowthPage = () => {
  const { tenantId } = useOwner();
  const navigate = useNavigate();
  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 18 }}>
      {/* Hero */}
      <Card interactive style={{
        padding: '30px 26px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${T.surfaceRaised} 0%, ${T.surface} 55%, rgba(211,191,162,0.07) 100%)`
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.primarySoft} 0%, transparent 70%)`, pointerEvents: 'none'
        }} />
        <Badge tone="gold">Built for growth</Badge>
        <div className="pown-gradient-text" style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: '12px 0 8px', maxWidth: 480, position: 'relative' }}>
          A restaurant runs on decisions. Pratyeksha makes sure you're never guessing.
        </div>
        <div style={{ fontSize: 13, color: T.textMed, lineHeight: 1.7, maxWidth: 480, position: 'relative' }}>
          Every module in this app exists to answer one question fast — "is {tenantId} doing well right now?" — without you having to piece it together from memory, a notebook, or three different apps.
        </div>
      </Card>

      {/* Pillars */}
      <div className="pown-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
        {GROWTH_PILLARS.map((p, i) => (
          <Card key={i} interactive>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: T.primarySoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14
            }}><p.icon size={17} color={T.primary} /></div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: T.textLow, lineHeight: 1.6 }}>{p.body}</div>
          </Card>
        ))}
      </div>

      {/* Old way vs Pratyeksha */}
      <Card padded={false}>
        <div style={{ padding: '22px 22px 6px' }}>
          <SectionHeading icon={Rocket} title="The old way, vs. this app" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 22px', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: T.textLow }}>WITHOUT PRATYEKSHA</th>
                <th style={{ textAlign: 'left', padding: '10px 22px', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: T.primary }}>WITH PRATYEKSHA</th>
              </tr>
            </thead>
            <tbody>
              {GROWTH_COMPARISON.map((row, i) => (
                <tr key={i} className="pown-row-hover" style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: '13px 22px', fontSize: 12.5, color: T.textLow }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <X size={14} color={T.danger} style={{ marginTop: 2, flexShrink: 0 }} />{row.manual}
                    </div>
                  </td>
                  <td style={{ padding: '13px 22px', fontSize: 12.5, color: T.textHigh, fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <CheckCircle2 size={14} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />{row.pratyeksha}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Explore modules */}
      <div>
        <SectionHeading icon={LayoutGrid} title="Everything included, in one app" />
        <div className="pown-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {NAV_ITEMS.filter(i => !['growth', 'settings'].includes(i.key)).map(item => (
            <button type="button" key={item.key} onClick={() => navigate(`/owner/${tenantId}/${item.key}`)} className="pown-btn pown-row-hover" style={{
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '13px 14px',
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 13, color: T.textHigh
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={14} color={T.primary} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{item.label}</span>
              <ChevronRight size={14} color={T.textLow} style={{ marginLeft: 'auto' }} />
            </button>
          ))}
        </div>
      </div>

      {/* What's next */}
      <Card style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: T.primarySoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}><PlayCircle size={19} color={T.primary} /></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Always improving</div>
          <div style={{ fontSize: 11.5, color: T.textLow, marginTop: 2, lineHeight: 1.6 }}>
            This app updates on the same account you're already logged into — new modules and refinements just show up here, no re-install needed.
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MODULE 12 — SETTINGS & REMOTE CONTROLS
   ════════════════════════════════════════════════════════════ */
/* Where guests find this outlet on the home screen: area filter + Google Maps + directions. */
const PaymentCard = ({ tenantId }) => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [clearAcc, setClearAcc] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
  useEffect(() => {
    let alive = true;
    api.get(`/api/owner/payment/${tenantId}`)
      .then(r => { if (alive) setForm({ ...r.data, accountNumber: '' }); })
      // A failed load used to fall back to a blank form, and Save then overwrote the stored UPI ID and bank details with empty values.
      .catch(() => { if (alive) { setLoadFailed(true); setForm({ upiId: '', payeeName: '', bankName: '', accountHolder: '', accountNumberMasked: '', hasAccountNumber: false, ifsc: '', accountNumber: '' }); } });
    return () => { alive = false; };
  }, [tenantId]);
  if (!form) return null;
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setMsg({ text: '', ok: true }); };
  const upi = String(form.upiId || '').trim();
  const upiBad = upi && !UPI_RE.test(upi);
  const save = async () => {
    if (loadFailed) { setMsg({ text: 'Your saved payment details could not be loaded, so saving is turned off to avoid overwriting them. Reload the page and try again.', ok: false }); return; }
    // same rules as the server, so mistakes are caught before they cost a customer a failed payment
    if (upiBad) { setMsg({ text: 'UPI ID looks wrong. It should look like name@bank (for example shop@okhdfcbank).', ok: false }); return; }
    if (upi && !String(form.payeeName || '').trim()) { setMsg({ text: 'Enter the name customers will see when they pay (your restaurant name).', ok: false }); return; }
    const ifsc = String(form.ifsc || '').trim().toUpperCase();
    if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) { setMsg({ text: 'IFSC code looks wrong. It is 11 characters, like HDFC0001234.', ok: false }); return; }
    const acc = String(form.accountNumber || '').replace(/\s+/g, '');
    if (acc && !/^\d{9,18}$/.test(acc)) { setMsg({ text: 'Account number must be 9 to 18 digits.', ok: false }); return; }
    setSaving(true); setMsg({ text: '', ok: true });
    try {
      const r = await api.put(`/api/owner/payment/${tenantId}`, {
        upiId: upi, payeeName: form.payeeName, bankName: form.bankName, accountHolder: form.accountHolder, ifsc, accountNumber: acc, clearAccountNumber: clearAcc, merchant: !!form.merchant, mcc: form.mcc || '5812',
      });
      setForm({ ...r.data, accountNumber: '' }); setClearAcc(false);
      setMsg({ text: r.data.upiId ? 'Saved. Guests can now pay their bill through Google Pay, PhonePe, Paytm and other UPI apps.' : 'Saved. Add a UPI ID to let guests pay online.', ok: true });
    } catch (e) { setMsg({ text: e?.response?.data?.error || 'Could not save payment details', ok: false }); }
    finally { setSaving(false); }
  };
  return (
    <Card>
      <SectionHeading icon={Wallet} title="Online Payments (UPI) & Bank Details" />
      {loadFailed && <div style={{ fontSize: 11.5, color: '#c9806a', marginBottom: 12 }}>Could not load your saved payment details. Reload the page before editing.</div>}
      <div style={{ fontSize: 11.5, color: T.textLow, lineHeight: 1.6, marginBottom: 14 }}>
        With a UPI ID saved, the guest's bill shows Google Pay, PhonePe and Paytm buttons. Tapping one opens that app with your restaurant name and the exact bill amount filled in; the guest only enters their PIN.
        Use your <b style={{ color: T.textMed }}>business / merchant UPI ID</b> (from your bank or payment app) — apps are more likely to decline payments to personal IDs for business amounts.
        Staff are alerted when a guest taps “I've paid”, and still confirm the payment before settling the table.
      </div>
      <div className="pown-grid-2">
        <Field label="UPI ID (VPA)">
          <input value={form.upiId || ''} onChange={e => set('upiId', e.target.value.replace(/\s/g, ''))} placeholder="restaurant@okhdfcbank" autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{ ...inputStyle, borderColor: upiBad ? '#c9806a' : inputStyle.border }} />
          {upiBad && <div style={{ fontSize: 10.5, color: '#c9806a', marginTop: 4 }}>Format: name@bank</div>}
        </Field>
        <Field label="NAME SHOWN TO CUSTOMERS">
          <input value={form.payeeName || ''} onChange={e => set('payeeName', e.target.value)} maxLength={60} placeholder="Your restaurant name" style={inputStyle} />
        </Field>
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: T.textMed, margin: '2px 0 12px', cursor: 'pointer', lineHeight: 1.5 }}>
        <input type="checkbox" checked={!!form.merchant} onChange={e => set('merchant', e.target.checked)} style={{ marginTop: 3 }} />
        <span>This is a registered <b>business / merchant</b> UPI ID (from your bank or payment app). Payment links then carry the merchant category code{form.merchant ? <> <input value={form.mcc || '5812'} onChange={e => set('mcc', e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ ...inputStyle, width: 70, display: 'inline-block', padding: '3px 6px', margin: '0 4px' }} aria-label="Merchant category code" /> (5812 = restaurants)</> : ''} and a transaction reference, which UPI apps expect for business accounts. Leave it off for a personal UPI ID.</span>
      </label>
      <div style={{ height: 1, background: T.border, margin: '4px 0 14px' }} />
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMed, letterSpacing: 0.4, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={12} /> BANK DETAILS (for your records — never shown to guests)</div>
      <div className="pown-grid-2">
        <Field label="ACCOUNT HOLDER NAME"><input value={form.accountHolder || ''} onChange={e => set('accountHolder', e.target.value)} maxLength={80} style={inputStyle} /></Field>
        <Field label="BANK NAME"><input value={form.bankName || ''} onChange={e => set('bankName', e.target.value)} maxLength={80} style={inputStyle} /></Field>
      </div>
      <div className="pown-grid-2">
        <Field label={form.hasAccountNumber ? `ACCOUNT NUMBER (saved: ${form.accountNumberMasked})` : 'ACCOUNT NUMBER'}>
          <input value={form.accountNumber || ''} onChange={e => set('accountNumber', e.target.value.replace(/[^\d\s]/g, ''))} inputMode="numeric" autoComplete="off" maxLength={24}
            placeholder={form.hasAccountNumber ? 'Leave empty to keep the saved number' : '9 to 18 digits'} style={inputStyle} />
        </Field>
        <Field label="IFSC CODE"><input value={form.ifsc || ''} onChange={e => set('ifsc', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={11} placeholder="HDFC0001234" autoCapitalize="characters" style={inputStyle} /></Field>
      </div>
      {form.hasAccountNumber && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: T.textLow, marginBottom: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={clearAcc} onChange={e => setClearAcc(e.target.checked)} /> Remove the saved account number
        </label>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <PrimaryBtn icon={Check} onClick={save} disabled={saving || loadFailed}>{saving ? 'Saving' : 'Save payment details'}</PrimaryBtn>
        {msg.text && <span style={{ fontSize: 11.5, color: msg.ok ? T.textMed : '#c9806a', lineHeight: 1.5 }}>{msg.text}</span>}
      </div>
    </Card>
  );
};

const LocationCard = ({ tenantId }) => {
  const [addr, setAddr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    // A failed load used to show an empty form that Save then wrote over the stored area / landmark / map link / coordinates.
    api.get(`/api/tenant/location/${tenantId}`).then(r => { if (alive) setAddr(r.data?.address || {}); }).catch(() => { if (alive) { setLoadFailed(true); setAddr({}); } });
    return () => { alive = false; };
  }, [tenantId]);
  const set = (k, v) => setAddr(a => ({ ...a, [k]: v }));
  const useHere = () => {
    if (!navigator.geolocation) { setMsg('Location is not available on this device'); return; }
    setMsg('Finding your position…');
    navigator.geolocation.getCurrentPosition(
      pos => { set('lat', Number(pos.coords.latitude.toFixed(6))); set('lng', Number(pos.coords.longitude.toFixed(6))); setMsg('Position captured — stand inside the outlet for best accuracy, then save'); },
      () => setMsg('Allow location access to capture the position'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };
  const save = async () => {
    if (loadFailed) { setMsg('Your saved location could not be loaded, so saving is turned off to avoid overwriting it. Reload the page and try again.'); return; }
    const latStr = String(addr.lat ?? '').trim(), lngStr = String(addr.lng ?? '').trim();
    if (latStr !== '' && (!Number.isFinite(Number(latStr)) || Math.abs(Number(latStr)) > 90)) { setMsg('Latitude must be a number between -90 and 90'); return; }
    if (lngStr !== '' && (!Number.isFinite(Number(lngStr)) || Math.abs(Number(lngStr)) > 180)) { setMsg('Longitude must be a number between -180 and 180'); return; }
    if (String(addr.mapsUrl || '').trim() && !/^https?:\/\//i.test(String(addr.mapsUrl).trim())) { setMsg('The Google Maps link must start with http:// or https://'); return; }
    setSaving(true); setMsg('');
    try {
      const body = { area: addr.area || '', landmark: addr.landmark || '', mapsUrl: addr.mapsUrl || '', lat: addr.lat ?? '', lng: addr.lng ?? '' };
      await api.patch(`/api/tenant/profile/${tenantId}`, { address: body });
      setMsg('Saved — guests now see this on the home screen');
    } catch (e) { setMsg(e?.response?.data?.error || 'Could not save'); }
    finally { setSaving(false); }
  };
  if (!addr) return null;
  return (
    <Card>
      <SectionHeading icon={MapPin} title="Location & Map" />
      <div style={{ fontSize: 11.5, color: T.textLow, lineHeight: 1.6, marginBottom: 14 }}>
        Guests can filter outlets by area and open directions in Google Maps. Street and city come from your onboarding details{addr.city ? ` (${addr.city})` : ''}.
      </div>
      <div className="pown-grid-2">
        <Field label="AREA / NEIGHBOURHOOD"><input value={addr.area || ''} onChange={e => set('area', e.target.value)} placeholder="e.g. Rajarampuri" style={inputStyle} /></Field>
        <Field label="LANDMARK (OPTIONAL)"><input value={addr.landmark || ''} onChange={e => set('landmark', e.target.value)} placeholder="Opp. city bus stand" style={inputStyle} /></Field>
      </div>
      <Field label="GOOGLE MAPS LINK (OPTIONAL)"><input value={addr.mapsUrl || ''} onChange={e => set('mapsUrl', e.target.value)} placeholder="https://maps.app.goo.gl/…" style={inputStyle} /></Field>
      <div className="pown-grid-2">
        <Field label="LATITUDE"><input value={addr.lat ?? ''} onChange={e => set('lat', e.target.value)} inputMode="decimal" placeholder="16.7050" style={inputStyle} /></Field>
        <Field label="LONGITUDE"><input value={addr.lng ?? ''} onChange={e => set('lng', e.target.value)} inputMode="decimal" placeholder="74.2433" style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <GhostBtn icon={Crosshair} onClick={useHere}>Use my current position</GhostBtn>
        <PrimaryBtn icon={Check} onClick={save} disabled={saving || loadFailed}>{saving ? 'Saving…' : 'Save location'}</PrimaryBtn>
        {msg && <span style={{ fontSize: 11.5, color: T.textMed }}>{msg}</span>}
      </div>
    </Card>
  );
};

/* ════════════════════════════════════════════════════════════
   GUEST DISCOVERY — customer-home activity + marketing performance for this outlet.
   The screen itself is shared with the Operator portal (DiscoveryAnalytics.jsx).
   ════════════════════════════════════════════════════════════ */
const ListingInsightsPage = () => {
  const { tenantId } = useOwner();
  const navigate = useNavigate();
  const load = useCallback((days) => api.get(`/api/owner/discovery/${tenantId}`, { params: { days } }).then(r => r.data), [tenantId]);
  // Only items the owner can change in this app get a "Fix" button.
  const fixable = ['area', 'pin', 'hours', 'phone'];
  return (
    <div className="pown-fade-in">
      <DiscoveryAnalytics load={load} canFix={(k) => fixable.includes(k)} onFixListing={() => navigate(`/owner/${tenantId}/settings`)} />
    </div>
  );
};

const SettingsPage = () => {
  const { tenantId } = useOwner();
  const { data, loading, error, refetch } = useOwnerData('/api/owner/settings/:tenantId');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [eightySixOpen, setEightySixOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [toast, flash] = useFlash();

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = async () => {
    // An emptied or negative target went to the server as-is.
    for (const [k, label] of [['dailyTarget', 'Daily'], ['monthlyTarget', 'Monthly']]) {
      const raw = String(form[k] ?? '').trim();
      if (raw === '' || !Number.isFinite(Number(raw)) || Number(raw) < 0) { flash(`${label} target must be a number (0 or more)`); return; }
    }
    setSaving(true);
    try { await api.put(`/api/owner/settings/${tenantId}`, { ...form, dailyTarget: Number(form.dailyTarget), monthlyTarget: Number(form.monthlyTarget) }); refetch(); flash('Settings saved'); }
    catch (e) { flash(e?.response?.data?.error || 'Could not save settings'); }
    finally { setSaving(false); }
  };

  const [sendingTest, setSendingTest] = useState(false);
  const sendTestEmail = async () => {
    setSendingTest(true);
    try {
      await api.put(`/api/owner/settings/${tenantId}`, form); // persist the email first, in case it changed
      await api.post(`/api/owner/reports/daily/send/${tenantId}`);
      flash('Test email sent — check the inbox');
    } catch (e) {
      flash(e?.response?.data?.error || 'Could not send — check SMTP setup');
    } finally { setSendingTest(false); }
  };

  const toggleAlert = (group, key) => {
    setForm(f => ({
      ...f, alerts: { ...f.alerts, [group]: { ...f.alerts[group], [key]: { ...f.alerts[group][key], enabled: !f.alerts[group][key].enabled } } }
    }));
  };

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <DataBoundary skeleton={<SkSettings />} loading={loading || !form} error={error} onRetry={refetch}>
        {form && (
          <>
            <Card>
              <SectionHeading icon={Megaphone} title="Remote Controls" />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <GhostBtn icon={Megaphone} onClick={() => setAnnounceOpen(true)}>Push Announcement</GhostBtn>
                <GhostBtn icon={EyeOff} onClick={() => setEightySixOpen(true)}>Emergency 86 a Dish</GhostBtn>
              </div>
              <div style={{ fontSize: 11, color: T.textLow, marginTop: 10 }}>Use the Menu Intelligence tab to hide dishes or change prices instantly.</div>
            </Card>

            <Card>
              <SectionHeading icon={Lock} title="Security" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 11.5, color: T.textLow, lineHeight: 1.6, maxWidth: 320 }}>
                  Your owner login is separate from any staff or kitchen accounts and only works for {tenantId}.
                </div>
                <GhostBtn icon={Lock} onClick={() => setChangePwOpen(true)}>Change Password</GhostBtn>
              </div>
            </Card>

            <LocationCard tenantId={tenantId} />

            <PaymentCard tenantId={tenantId} />

            <Card>
              <SectionHeading icon={Target} title="Revenue Targets" />
              <div className="pown-grid-2">
                <Field label="DAILY TARGET (₹)">
                  <input type="number" value={form.dailyTarget} onChange={e => setForm(f => ({ ...f, dailyTarget: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="MONTHLY TARGET (₹)">
                  <input type="number" value={form.monthlyTarget} onChange={e => setForm(f => ({ ...f, monthlyTarget: e.target.value }))} style={inputStyle} />
                </Field>
              </div>
            </Card>

            <Card>
              <SectionHeading icon={Clock} title="Operating Hours" />
              <div className="pown-grid-2">
                <Field label="MON–FRI">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="time" value={form.operatingHours.weekday.open} onChange={e => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, weekday: { ...f.operatingHours.weekday, open: e.target.value } } }))} style={inputStyle} />
                    <input type="time" value={form.operatingHours.weekday.close} onChange={e => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, weekday: { ...f.operatingHours.weekday, close: e.target.value } } }))} style={inputStyle} />
                  </div>
                </Field>
                <Field label="SAT–SUN">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="time" value={form.operatingHours.weekend.open} onChange={e => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, weekend: { ...f.operatingHours.weekend, open: e.target.value } } }))} style={inputStyle} />
                    <input type="time" value={form.operatingHours.weekend.close} onChange={e => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, weekend: { ...f.operatingHours.weekend, close: e.target.value } } }))} style={inputStyle} />
                  </div>
                </Field>
              </div>
              <Field label="WEEKLY OFF DAYS">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                    const off = Array.isArray(form.operatingHours.closedDays) && form.operatingHours.closedDays.includes(i);
                    return (
                      <button type="button" key={d} aria-pressed={off} className="pown-btn" onClick={() => setForm(f => {
                        const cur = Array.isArray(f.operatingHours.closedDays) ? f.operatingHours.closedDays : [];
                        return { ...f, operatingHours: { ...f.operatingHours, closedDays: off ? cur.filter(x => x !== i) : [...cur, i].sort((a, b) => a - b) } };
                      })} style={{
                        padding: '7px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                        background: off ? T.dangerSoft : 'transparent', color: off ? T.danger : T.textMed, border: `1px solid ${off ? T.danger : T.border}`
                      }}>{d}</button>
                    );
                  })}
                </div>
              </Field>
              {[['Mon–Fri', form.operatingHours.weekday], ['Sat–Sun', form.operatingHours.weekend]].map(([lbl, b]) => {
                const note = !b?.open || !b?.close ? '' : b.close === b.open ? 'open 24 hours' : b.close < b.open ? `closes at ${b.close} the next day` : '';
                return note ? <div key={lbl} style={{ fontSize: 11.5, color: T.primary, marginBottom: 6 }}>{lbl}: {note}</div> : null;
              })}
              <div style={{ display: 'grid', gap: 12, marginTop: 6 }}>
                <AlertToggleRow label="Show Open / Closed on the guest directory" checked={form.operatingHours.showOnListing === true} onChange={() => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, showOnListing: !(f.operatingHours.showOnListing === true) } }))} />
                <AlertToggleRow label="Temporarily closed (holiday / emergency)" checked={form.operatingHours.temporarilyClosed === true} onChange={() => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, temporarilyClosed: !(f.operatingHours.temporarilyClosed === true) } }))} />
              </div>
              <div style={{ fontSize: 11, color: T.textLow, lineHeight: 1.6, marginTop: 12 }}>
                Times are in IST. A closing time earlier than the opening time means you close after midnight (for example 18:00 to 02:00). Guests see "Open now" and can filter for open places only when the first switch is on; it stays hidden until you turn it on, so default times are never shown by mistake.
              </div>
            </Card>

            <Card>
              <SectionHeading icon={Bell} title="Alert Configuration" />
              <div style={{ display: 'grid', gap: 10 }}>
                <AlertToggleRow label="Daily revenue summary" checked={form.alerts.revenue.dailySummary.enabled} onChange={() => toggleAlert('revenue', 'dailySummary')} />
                <AlertToggleRow label="Revenue milestones" checked={form.alerts.revenue.milestone.enabled} onChange={() => toggleAlert('revenue', 'milestone')} />
                <AlertToggleRow label="Low stock" checked={form.alerts.inventory.lowStock.enabled} onChange={() => toggleAlert('inventory', 'lowStock')} />
                <AlertToggleRow label="Predicted stock runout" checked={form.alerts.inventory.predictedRunout.enabled} onChange={() => toggleAlert('inventory', 'predictedRunout')} />
                <AlertToggleRow label="Large discounts (>20%)" checked={form.alerts.financial.largeDiscount.enabled} onChange={() => toggleAlert('financial', 'largeDiscount')} />
                <AlertToggleRow label="High food cost (>40%)" checked={form.alerts.financial.highFoodCost.enabled} onChange={() => toggleAlert('financial', 'highFoodCost')} />
                <AlertToggleRow label="Staff absence" checked={form.alerts.staff.absentAlert.enabled} onChange={() => toggleAlert('staff', 'absentAlert')} />
                <AlertToggleRow label="Kitchen ticket delays" checked={form.alerts.kitchen.ticketDelayed.enabled} onChange={() => toggleAlert('kitchen', 'ticketDelayed')} />
                <AlertToggleRow label="GSTR filing reminders" checked={form.alerts.compliance.gstrReminder.enabled} onChange={() => toggleAlert('compliance', 'gstrReminder')} />
              </div>
            </Card>

            <Card>
              <SectionHeading icon={Mail} title="Report Delivery" />
              <Field label="EMAIL FOR REPORTS">
                <input type="email" placeholder="owner@restaurant.com" value={form.reportEmail} onChange={e => setForm(f => ({ ...f, reportEmail: e.target.value }))} style={inputStyle} />
              </Field>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 11, color: T.textLow, lineHeight: 1.6, maxWidth: 320 }}>
                  Your daily closing report is emailed here automatically every night at 11:00 PM IST, when the "Daily revenue summary" alert above is on.
                </div>
                <GhostBtn icon={sendingTest ? Loader2 : Send} onClick={sendTestEmail} disabled={sendingTest || !form.reportEmail}>
                  {sendingTest ? 'Sending…' : 'Send Test Email'}
                </GhostBtn>
              </div>
            </Card>

            <div className="pown-sticky-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryBtn icon={Check} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</PrimaryBtn>
            </div>
          </>
        )}
      </DataBoundary>

      <Modal open={announceOpen} onClose={() => setAnnounceOpen(false)} title="Push Announcement">
        <AnnouncementForm tenantId={tenantId} onDone={() => setAnnounceOpen(false)} />
      </Modal>
      <Modal open={eightySixOpen} onClose={() => setEightySixOpen(false)} title="Emergency 86 a Dish" width={460}>
        <EightySixForm tenantId={tenantId} onDone={(msg) => { setEightySixOpen(false); flash(msg); }} />
      </Modal>
      <Modal open={changePwOpen} onClose={() => setChangePwOpen(false)} title="Change Password" width={380}>
        <ChangePasswordForm tenantId={tenantId} onDone={(msg) => { setChangePwOpen(false); flash(msg); }} />
      </Modal>
      <Toast message={toast} />
    </div>
  );
};

const AlertToggleRow = ({ label, checked, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 12.5, fontWeight: 600, color: T.textMed }}>{label}</span>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const AnnouncementForm = ({ tenantId, onDone }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const send = async () => {
    if (sending) return;
    setSending(true); setError('');
    try {
      await api.post(`/api/owner/announcement/${tenantId}`, { title: title.trim(), message: message.trim(), expiresAt: new Date(Date.now() + 4 * 3600000).toISOString() });
      onDone();
    } catch (e) { setError(e?.response?.data?.error || 'Could not send the announcement'); }
    finally { setSending(false); }
  };
  return (
    <div>
      <Field label="TITLE"><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Weekend Special" /></Field>
      <Field label="MESSAGE"><textarea value={message} onChange={e => setMessage(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Shown on every table's menu for 4 hours" /></Field>
      {error && <div style={{ fontSize: 11.5, color: T.danger, marginBottom: 12 }}>{error}</div>}
      <PrimaryBtn icon={Send} onClick={send} disabled={sending || !title.trim() || !message.trim()}>{sending ? 'Sending…' : 'Push to All Tables'}</PrimaryBtn>
    </div>
  );
};

const EightySixForm = ({ tenantId, onDone }) => {
  const { data, loading } = useOwnerData('/api/owner/menu/insights/:tenantId');
  const [query, setQuery] = useState('');
  const [hiding, setHiding] = useState(null);
  const [hideError, setHideError] = useState('');

  const dishes = (data?.dishTable || []).filter(d => String(d.name || '').toLowerCase().includes(query.toLowerCase()));

  const hideDish = async (dish) => {
    if (hiding) return;
    setHiding(dish._id); setHideError('');
    try {
      await api.patch(`/api/owner/menu/hide/${tenantId}/${dish._id}`, { isAvailable: false });
      onDone(`"${dish.name}" hidden from the menu`);
    } catch (e) { setHideError(e?.response?.data?.error || `Could not hide "${dish.name}"`); }
    finally { setHiding(null); }
  };

  return (
    <div>
      <Field label="SEARCH DISH">
        <div style={{ position: 'relative' }}>
          <Search size={14} color={T.textLow} style={{ position: 'absolute', left: 11, top: 12 }} />
          <input value={query} onChange={e => setQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Type to filter…" autoFocus />
        </div>
      </Field>
      {hideError && <div style={{ fontSize: 11.5, color: T.danger, marginBottom: 10 }}>{hideError}</div>}
      <div className="pown-scroll" style={{ maxHeight: 280, overflowY: 'auto', display: 'grid', gap: 6 }}>
        {loading ? <div role="status" aria-busy="true" style={{ display: 'grid', gap: 6 }}>{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} h={40} style={{ borderRadius: 10 }} />)}</div> : dishes.length === 0 ? (
          <div style={{ fontSize: 12, color: T.textLow, padding: '10px 0' }}>No matching dishes</div>
        ) : dishes.slice(0, 30).map(d => (
          <div key={d._id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px',
            background: 'rgba(255,255,255,0.02)', borderRadius: 10
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.name}</span>
            <button type="button" onClick={() => hideDish(d)} disabled={hiding === d._id} className="pown-btn" style={{
              background: T.dangerSoft, color: T.danger, border: 'none', borderRadius: 8,
              padding: '6px 11px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5
            }}><EyeOff size={12} />{hiding === d._id ? 'Hiding…' : '86 It'}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChangePasswordForm = ({ tenantId, onDone }) => {
  const { completeAuth, ownerName } = useOwner();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const canSubmit = current && next.length >= 8 && /[a-z]/i.test(next) && /\d/.test(next) && next === confirm && next !== current;

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true); setError(null);
    try {
      const r = await api.put(`/api/owner/auth/change-password/${tenantId}`, { currentPassword: current, newPassword: next });
      // Other devices are signed out by the server; this one continues with the fresh token it returns.
      if (r.data?.token) completeAuth(r.data.token, ownerName);
      onDone('Password updated — other devices were signed out');
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not update password');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <Field label="CURRENT PASSWORD"><input type="password" value={current} onChange={e => setCurrent(e.target.value)} style={inputStyle} autoFocus /></Field>
      <Field label="NEW PASSWORD"><input type="password" value={next} onChange={e => setNext(e.target.value)} style={inputStyle} /></Field>
      <Field label="CONFIRM NEW PASSWORD"><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} /></Field>
      {next && (next.length < 8 || !/[a-z]/i.test(next) || !/\d/.test(next)) && <div style={{ fontSize: 11, color: T.textLow, marginBottom: 10 }}>Needs 8 or more characters, with letters and numbers.</div>}
      {confirm && next !== confirm && <div style={{ fontSize: 11, color: T.danger, marginBottom: 10 }}>Passwords don't match.</div>}
      {next && current && next === current && <div style={{ fontSize: 11, color: T.danger, marginBottom: 10 }}>The new password must be different from the current one.</div>}
      {error && <div style={{ fontSize: 11.5, color: T.danger, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13} />{error}</div>}
      <PrimaryBtn icon={saving ? Loader2 : Check} onClick={submit} disabled={saving || !canSubmit}>{saving ? 'Updating…' : 'Update Password'}</PrimaryBtn>
    </div>
  );
};

/* ═════════════════════════════════════════════════
   HELP & FEEDBACK — terms, support tickets, ideas, rating (talks to Master Admin)
   ═════════════════════════════════════════════════ */
const apiErr = (e) => e?.response?.data?.error || e?.message || 'Something went wrong';

/** Shows when Pratyeksha has published new terms this restaurant has not accepted. Never blocks the app. */
const TermsBanner = ({ tenantId }) => {
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true;
    api.get(`/api/owner/terms/${encodeURIComponent(tenantId)}`).then(r => { if (live) setInfo(r.data); }).catch(() => {});
    return () => { live = false; };
  }, [tenantId]);
  if (!info?.terms || info.accepted) return null;
  const accept = async () => {
    setBusy(true); setErr('');
    try { await api.post(`/api/owner/terms/${encodeURIComponent(tenantId)}/accept`); setInfo(i => ({ ...i, accepted: true })); setOpen(false); }
    catch (e) { setErr(apiErr(e)); } finally { setBusy(false); }
  };
  return (
    <>
      <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '11px 14px', marginBottom: 14, borderRadius: 14, background: T.primarySoft, border: `1px solid ${T.borderStrong}` }}>
        <FileText size={16} color={T.primary} />
        <div style={{ flex: 1, minWidth: 200, fontSize: 12.5, color: T.textHigh, lineHeight: 1.5 }}>Updated terms of service are ready. Please read and accept them.</div>
        <PrimaryBtn onClick={() => setOpen(true)}>Read & accept</PrimaryBtn>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={info.terms.title} width={560}>
        <div style={{ maxHeight: '52vh', overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: 12.5, lineHeight: 1.7, color: T.textMed, paddingRight: 6 }}>{info.terms.body}</div>
        {err && <div role="alert" style={{ color: T.danger, fontSize: 12, marginTop: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <GhostBtn onClick={() => setOpen(false)}>Later</GhostBtn>
          <PrimaryBtn onClick={accept} disabled={busy}>{busy ? 'Saving…' : 'I accept'}</PrimaryBtn>
        </div>
      </Modal>
    </>
  );
};

const TICKET_TONE = { open: T.warning, pending: T.warning, resolved: T.success, closed: T.textLow };

const SupportCard = ({ tenantId, flash }) => {
  const { data, loading, error, refetch } = useOwnerData('/api/owner/support/:tenantId/tickets');
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'howto', text: '' });
  const [busy, setBusy] = useState(false);
  const [openNo, setOpenNo] = useState(null);
  const [reply, setReply] = useState('');
  const create = async () => {
    setBusy(true);
    try { await api.post(`/api/owner/support/${encodeURIComponent(tenantId)}/tickets`, form); setForm({ subject: '', category: 'howto', text: '' }); setComposing(false); flash('Sent. We will reply here.'); refetch(); }
    catch (e) { flash(apiErr(e)); } finally { setBusy(false); }
  };
  const send = async (no) => {
    setBusy(true);
    try { await api.post(`/api/owner/support/${encodeURIComponent(tenantId)}/tickets/${encodeURIComponent(no)}/reply`, { text: reply }); setReply(''); refetch(); }
    catch (e) { flash(apiErr(e)); } finally { setBusy(false); }
  };
  const rows = Array.isArray(data) ? data : [];
  return (
    <Card>
      <SectionHeading icon={LifeBuoy} title="Support" action={!composing && <PrimaryBtn icon={Plus} onClick={() => setComposing(true)}>New request</PrimaryBtn>} />
      {composing && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 14, border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
          <Field label="WHAT DO YOU NEED HELP WITH?">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle} aria-label="Type of request">
              <option value="howto">How do I…?</option><option value="bug">Something is not working</option><option value="billing">Billing or plan</option><option value="feature">I need a feature</option><option value="other">Something else</option>
            </select>
          </Field>
          <Field label="SUBJECT"><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputStyle} maxLength={140} aria-label="Subject" /></Field>
          <Field label="DETAILS"><textarea rows={4} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} maxLength={2000} aria-label="Details" /></Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <GhostBtn onClick={() => setComposing(false)}>Cancel</GhostBtn>
            <PrimaryBtn icon={Send} onClick={create} disabled={busy || form.subject.trim().length < 3 || !form.text.trim()}>{busy ? 'Sending…' : 'Send'}</PrimaryBtn>
          </div>
        </div>
      )}
      {error ? <div style={{ color: T.danger, fontSize: 12.5 }}>{String(error)}</div>
        : loading && !data ? <div style={{ color: T.textLow, fontSize: 12.5 }}>Loading…</div>
        : !rows.length ? <div style={{ color: T.textLow, fontSize: 12.5 }}>No requests yet. If something is not working, tell us here.</div>
        : (
          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map(t => (
              <div key={t.number} style={{ border: `1px solid ${T.border}`, borderRadius: 13, overflow: 'hidden' }}>
                <button type="button" onClick={() => setOpenNo(openNo === t.number ? null : t.number)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '11px 14px', background: 'transparent', border: 0, color: T.textHigh, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textLow }}>{t.number}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{t.subject}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TICKET_TONE[t.status] || T.textMed, textTransform: 'capitalize' }}>{t.status}</span>
                </button>
                {openNo === t.number && (
                  <div style={{ padding: '4px 14px 14px', display: 'grid', gap: 8 }}>
                    {(t.messages || []).map((m, i) => (
                      <div key={i} style={{ justifySelf: m.from === 'client' ? 'end' : 'start', maxWidth: '88%', padding: '8px 12px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', background: m.from === 'client' ? T.primarySoft : 'rgba(255,255,255,0.05)', color: T.textHigh }}>
                        <div style={{ fontSize: 10, color: T.textLow, marginBottom: 2 }}>{m.from === 'client' ? 'You' : 'Pratyeksha'}</div>{m.text}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={reply} onChange={e => setReply(e.target.value)} placeholder={['resolved', 'closed'].includes(t.status) ? 'Reply to reopen this request' : 'Write a reply'} style={inputStyle} aria-label="Reply" maxLength={2000} />
                      <PrimaryBtn icon={Send} onClick={() => send(t.number)} disabled={busy || !reply.trim()}>Send</PrimaryBtn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </Card>
  );
};

const IdeasCard = ({ tenantId, flash }) => {
  const { data, loading, error, refetch } = useOwnerData('/api/owner/features/:tenantId');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try { const r = await api.post(`/api/owner/features/${encodeURIComponent(tenantId)}`, { title }); setTitle(''); flash(r.data?.merged ? 'Someone suggested this already — we added your vote.' : 'Thanks! Your idea is on the list.'); refetch(); }
    catch (e) { flash(apiErr(e)); } finally { setBusy(false); }
  };
  const vote = async (id) => { try { await api.post(`/api/owner/features/${encodeURIComponent(tenantId)}/${id}/vote`); refetch(); } catch (e) { flash(apiErr(e)); } };
  const rows = Array.isArray(data) ? data : [];
  const STATUS = { new: 'Under review', planned: 'Planned', building: 'Being built', shipped: 'Released' };
  return (
    <Card>
      <SectionHeading icon={Lightbulb} title="Ideas for Pratyeksha" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What would make your work easier?" style={inputStyle} aria-label="Your idea" maxLength={120} />
        <PrimaryBtn icon={Plus} onClick={add} disabled={busy || title.trim().length < 4}>Suggest</PrimaryBtn>
      </div>
      {error ? <div style={{ color: T.danger, fontSize: 12.5 }}>{String(error)}</div>
        : loading && !data ? <div style={{ color: T.textLow, fontSize: 12.5 }}>Loading…</div>
        : !rows.length ? <div style={{ color: T.textLow, fontSize: 12.5 }}>No ideas yet — be the first.</div>
        : (
          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map(f => (
              <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 13 }}>
                <button type="button" onClick={() => vote(f._id)} aria-pressed={!!f.mine} aria-label={`${f.mine ? 'Remove your vote from' : 'Vote for'} ${f.title}`} style={{ minWidth: 48, padding: '6px 8px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${f.mine ? T.primary : T.border}`, background: f.mine ? T.primarySoft : 'transparent', color: f.mine ? T.primary : T.textMed, fontWeight: 800, fontSize: 12 }}>▲ {f.votes}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textHigh }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{STATUS[f.status] || f.status}{f.response ? ` · ${f.response}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
    </Card>
  );
};

const RatingCard = ({ tenantId, flash }) => {
  const { data, refetch } = useOwnerData('/api/owner/feedback/:tenantId');
  const [score, setScore] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await api.post(`/api/owner/feedback/${encodeURIComponent(tenantId)}`, { kind: 'nps', score, comment }); flash('Thank you for the feedback!'); setScore(null); setComment(''); refetch(); }
    catch (e) { flash(apiErr(e)); } finally { setBusy(false); }
  };
  return (
    <Card>
      <SectionHeading icon={Star} title="How are we doing?" />
      {data && data.canRate === false ? <div style={{ fontSize: 12.5, color: T.textMed }}>Thanks — we have your rating for this month. You can rate again next month.</div> : (
        <>
          <div style={{ fontSize: 12.5, color: T.textMed, marginBottom: 10 }}>How likely are you to recommend Pratyeksha to another restaurant owner?</div>
          <div role="radiogroup" aria-label="Recommendation score" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {Array.from({ length: 11 }, (_, i) => (
              <button type="button" key={i} role="radio" aria-checked={score === i} onClick={() => setScore(i)} style={{ width: 38, height: 38, borderRadius: 11, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${score === i ? T.primary : T.border}`, background: score === i ? T.primarySoft : 'transparent', color: score === i ? T.primary : T.textMed }}>{i}</button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: T.textLow, marginBottom: 12 }}><span>Not likely</span><span>Very likely</span></div>
          <Field label="ANYTHING YOU WOULD LIKE US TO KNOW? (OPTIONAL)"><textarea rows={2} value={comment} onChange={e => setComment(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} maxLength={400} aria-label="Comment" /></Field>
          <PrimaryBtn onClick={submit} disabled={busy || score == null}>{busy ? 'Sending…' : 'Send rating'}</PrimaryBtn>
        </>
      )}
    </Card>
  );
};

const HelpPage = () => {
  const { tenantId } = useOwner();
  const [toast, flash] = useFlash();
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <SupportCard tenantId={tenantId} flash={flash} />
      <IdeasCard tenantId={tenantId} flash={flash} />
      <RatingCard tenantId={tenantId} flash={flash} />
      <Toast message={toast} />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   ROOT — OwnerApp (mount at /owner/:tenantId/*)
   ════════════════════════════════════════════════════════════ */
const OwnerAppInner = () => {
  const location = useLocation();
  return (
  <OwnerShell>
    <PageTransition pageKey={location.pathname}>
    <Routes location={location}>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="revenue" element={<RevenuePage />} />
      <Route path="pnl" element={<PnlPage />} />
      <Route path="menu" element={<MenuPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="kitchen" element={<KitchenPage />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="listing" element={<ListingInsightsPage />} />
      <Route path="insights" element={<ExecutiveInsightsPage />} />
      <Route path="alerts" element={<AlertsPage />} />
      <Route path="compliance" element={<CompliancePage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="growth" element={<GrowthPage />} />
      <Route path="help" element={<HelpPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
    </PageTransition>
  </OwnerShell>
  );
};

export default function OwnerApp() {
  const { tenantId } = useParams();
  return (
    <OwnerMotion>
      <GlobalStyles />
      {/* bk-scope carries the Bklit chart tokens; display:contents keeps layout untouched */}
      <div className="bk-scope" style={{ display: 'contents' }}>
        <OwnerProvider key={tenantId} tenantId={tenantId}>
          <AuthGate>
            <OwnerAppInner />
          </AuthGate>
        </OwnerProvider>
      </div>
    </OwnerMotion>
  );
}

/**
 * OwnerLauncher — mount this at the bare "/owner" path (exact, no :tenantId).
 * This is what actually opens when someone taps the installed app icon,
 * because a web manifest's start_url can't contain a dynamic segment.
 * It jumps straight to the last outlet used on this device, or asks once.
 *
 *   import { OwnerLauncher } from './OwnerApp/PratyekshaOwnerApp.jsx';
 *   <Route path="/owner" element={<OwnerLauncher />} />
 *   <Route path="/owner/:tenantId/*" element={<OwnerApp />} />
 */
export function OwnerLauncher() {
  const navigate = useNavigate();
  const [outletInput, setOutletInput] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let last = null;
    try { last = localStorage.getItem(LAST_TENANT_KEY); } catch (e) {}
    if (last) navigate(`/owner/${encodeURIComponent(last)}/dashboard`, { replace: true });
    else setChecking(false);
  }, [navigate]);

  const go = () => {
    // Outlet ids are lower-case with no spaces; a pasted "Jay Ambe " or a stray "/" made a wrong or broken URL.
    const id = outletInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (id) navigate(`/owner/${encodeURIComponent(id)}/dashboard`);
  };

  if (checking) return null;

  return (
    <div className="pown" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 20 }}>
      <GlobalStyles />
      <Card style={{ width: 360, maxWidth: '100%', textAlign: 'center' }}>
        <div style={{
          width: 168, height: 70, borderRadius: 18, margin: '0 auto 18px', padding: '6px 12px',
          background: '#f7f3eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 26px -6px rgba(211,191,162,0.4)'
        }}><img src={BRAND_LOGO} alt="Pratyeksha" style={{ width:'100%', height:'100%', objectFit:'contain' }} /></div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Welcome to Pratyeksha Owner</div>
        <div style={{ fontSize: 12, color: T.textLow, marginBottom: 20, lineHeight: 1.6 }}>Enter your outlet ID to open your dashboard. You'll only need to do this once on this device.</div>
        <input value={outletInput} onChange={e => setOutletInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
          placeholder="e.g. jay_ambe_fusion" style={{ ...inputStyle, textAlign: 'center', marginBottom: 14 }} autoFocus />
        <PrimaryBtn icon={ChevronRight} onClick={go} disabled={!outletInput.trim()} style={{ width: '100%', justifyContent: 'center' }}>Open Dashboard</PrimaryBtn>
      </Card>
    </div>
  );
}