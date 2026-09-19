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
import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { Routes, Route, NavLink, useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LayoutDashboard, TrendingUp, PieChart as PieIcon, UtensilsCrossed, Package, ChefHat,
  Users, UserCircle2, Bell, ShieldCheck, ClipboardList, Settings as SettingsIcon, LogOut,
  ChevronDown, ChevronRight, ChevronLeft, ArrowUpRight, ArrowDownRight, LayoutGrid, Wallet,
  Target, AlertTriangle, CheckCircle2, Clock, Flame, Sparkles, Download, Send, Phone, Store,
  Menu as MenuIcon, X, RefreshCcw, Eye, EyeOff, IndianRupee, Percent, TrendingDown, Boxes,
  Timer, Megaphone, MapPin, Star, Gauge, CalendarClock, FileSpreadsheet, FileText, Mail,
  Search, Filter, MoreVertical, Plus, Minus, Check, ShoppingBag, Truck, CreditCard, Banknote,
  Smartphone, UserCheck, UserX, Award, ThumbsUp, PackageX, PackageCheck, Zap, Activity,
  Receipt, ExternalLink, WifiOff, Loader2, BarChart3, Rocket, Shield, PlayCircle, Quote,
  Lock, ArrowLeftRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';

/* ════════════════════════════════════════════════════════════
   THEME — identical to Pratyeksha's design system
   ════════════════════════════════════════════════════════════ */
const T = {
  primary: '#d3bfa2',
  primarySoft: 'rgba(211,191,162,0.14)',
  bg: '#060606',
  surface: '#0a0a0a',
  surfaceRaised: '#0d0d0d',
  border: 'rgba(211,191,162,0.12)',
  borderStrong: 'rgba(211,191,162,0.24)',
  textHigh: '#ffffff',
  textMed: 'rgba(255,255,255,0.55)',
  textLow: 'rgba(255,255,255,0.20)',
  danger: 'rgba(214,109,39,0.92)',
  dangerSoft: 'rgba(214,109,39,0.14)',
  warning: 'rgba(240,165,0,0.85)',
  warningSoft: 'rgba(240,165,0,0.12)',
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
    .pown-skel { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%); background-size: 400% 100%; animation: pownShimmer 1.6s ease infinite; border-radius: 10px; }
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
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:10000';

const api = axios.create({ baseURL: API_BASE });

// Any 401 from the API (expired/invalid token) broadcasts a single event —
// OwnerProvider listens for it and drops back to the login screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) window.dispatchEvent(new Event('owner-auth-expired'));
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
  const [authErrorDetail, setAuthErrorDetail] = useState(null);

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
    let cancelled = false;
    setAuthStatus('checking');
    setAuthErrorDetail(null);
    let stored = null;
    try { stored = localStorage.getItem(tokenKeyFor(outlet)); } catch (e) {}

    if (stored) {
      try {
        const res = await axios.get(`${API_BASE}/api/owner/auth/verify`, { headers: { Authorization: `Bearer ${stored}` } });
        if (cancelled) return;
        applyAuthHeader(stored);
        setAuthToken(stored);
        setOwnerName(res.data.ownerName || '');
        setAuthStatus('authed');
        return;
      } catch (e) {
        // A 401 here just means the token expired — fall through to a normal
        // status check. Anything else (network/CORS/server down) should NOT
        // be silently treated as "token invalid, ask for login" — surface it.
        if (e?.response?.status && e.response.status !== 401) {
          setAuthErrorDetail(describeAuthError(e, `${API_BASE}/api/owner/auth/verify`));
          setAuthStatus('error');
          return;
        }
        applyAuthHeader(null);
        try { localStorage.removeItem(tokenKeyFor(outlet)); } catch (e2) {}
      }
    }
    try {
      const res = await axios.get(`${API_BASE}/api/owner/auth/status/${outlet}`);
      if (cancelled) return;
      setAuthStatus(res.data.setupComplete ? 'needsLogin' : 'needsSetup');
    } catch (e) {
      // Never guess between Setup/Login on a failed request — a wrong
      // API URL, CORS block, or downed server must never look like a
      // legitimate "please log in" screen, or the real problem gets hidden.
      if (!cancelled) {
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
    authStatus, ownerName, completeAuth, logout, authErrorDetail, retryAuth: resolveAuth
  }), [outlet, socket, connected, liveAlert, liveAdminNotification, liveOrderEvent, liveStockEvent, liveStaffEvent, authStatus, ownerName, completeAuth, logout, authErrorDetail, resolveAuth]);
  return <OwnerCtx.Provider value={value}>{children}</OwnerCtx.Provider>;
}

/** Gates the app behind auth — shows a splash while checking, then Setup/Login/Error/the real app. */
function AuthGate({ children }) {
  const { authStatus } = useOwner();
  if (authStatus === 'checking') return <AuthSplash />;
  if (authStatus === 'error') return <AuthErrorScreen />;
  if (authStatus === 'needsSetup') return <SetupScreen />;
  if (authStatus === 'needsLogin') return <LoginScreen />;
  return children;
}

/** Generic fetch-with-loading hook, scoped to the active tenant, auto-refreshing. */
function useOwnerData(path, { refreshMs = 0, params = {} } = {}) {
  const { tenantId } = useOwner();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);

  const fetchData = useCallback(async (silent) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.get(path.replace(':tenantId', tenantId), { params });
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tenantId, paramsKey]);

  useEffect(() => { fetchData(false); }, [fetchData]);
  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(() => fetchData(true), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, fetchData]);

  return { data, loading, error, refetch: () => fetchData(true) };
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
      meta.name = 'theme-color'; meta.content = '#0a0a0a';
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
      background: `linear-gradient(160deg, ${T.surfaceRaised} 0%, ${T.surface} 100%)`,
      border: `1px solid ${T.border}`, borderRadius: 18, boxShadow: T.glow,
      padding: padded ? '22px' : 0, ...style
    }}
    {...rest}
  >{children}</div>
);

const Label = ({ children, style }) => (
  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: T.textLow, ...style }}>{children}</div>
);

const SectionHeading = ({ icon: Icon, title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {Icon && (
        <div style={{
          width: 28, height: 28, borderRadius: 9, background: T.primarySoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}><Icon size={14} color={T.primary} strokeWidth={2.25} /></div>
      )}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: T.textHigh, letterSpacing: -0.2 }}>{title}</h2>
    </div>
    {action}
  </div>
);

/** Animates a number counting up/down to its new value whenever it changes. */
function useCountUp(target, duration = 700) {
  const numericTarget = Number(target) || 0;
  const [display, setDisplay] = useState(numericTarget);
  const prevRef = useRef(numericTarget);
  useEffect(() => {
    const start = prevRef.current;
    const end = numericTarget;
    if (start === end) return;
    let startTime = null;
    let raf;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min(1, (ts - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
      else prevRef.current = end;
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
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: up ? T.primary : T.danger }}>
      <Icon size={12} strokeWidth={2.5} />
      <span className="pown-mono">{Math.abs(pct)}%</span>
    </span>
  );
};

const Badge = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: { bg: 'rgba(255,255,255,0.06)', c: T.textMed },
    gold: { bg: T.primarySoft, c: T.primary },
    danger: { bg: T.dangerSoft, c: T.danger },
    warning: { bg: T.warningSoft, c: T.warning },
  };
  const s = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 100,
      fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, background: s.bg, color: s.c, textTransform: 'uppercase'
    }}>{children}</span>
  );
};

const ProgressBar = ({ pct, tone = 'gold', height = 8 }) => {
  const colors = { gold: T.primary, danger: T.danger, warning: T.warning };
  return (
    <div style={{ width: '100%', height, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: colors[tone], borderRadius: 100, transition: 'width .5s ease' }} />
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
  <div style={{ textAlign: 'center', padding: '46px 20px', color: T.textLow }}>
    <Icon size={26} strokeWidth={1.5} style={{ marginBottom: 10, opacity: 0.6 }} />
    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.textMed }}>{title}</div>
    {subtitle && <div style={{ fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <WifiOff size={22} color={T.danger} style={{ marginBottom: 10 }} />
    <div style={{ fontSize: 13, color: T.textMed, marginBottom: 14 }}>{message || 'Could not load this data.'}</div>
    {onRetry && (
      <button onClick={onRetry} className="pown-btn" style={{
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

const IconBtn = ({ icon: Icon, onClick, active, title }) => (
  <button onClick={onClick} title={title} className="pown-btn" style={{
    width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? T.primarySoft : 'transparent', border: `1px solid ${active ? T.borderStrong : T.border}`,
    color: active ? T.primary : T.textMed
  }}><Icon size={15} /></button>
);

const PillTabs = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {options.map(opt => (
      <button key={opt.value} onClick={() => onChange(opt.value)} className="pown-btn" style={{
        padding: '7px 13px', borderRadius: 100, fontSize: 12, fontWeight: 700,
        background: value === opt.value ? T.primary : 'transparent',
        color: value === opt.value ? '#0a0a0a' : T.textMed,
        border: `1px solid ${value === opt.value ? T.primary : T.border}`
      }}>{opt.label}</button>
    ))}
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button onClick={() => onChange(!checked)} className="pown-btn" style={{
    width: 40, height: 23, borderRadius: 100, background: checked ? T.primary : 'rgba(255,255,255,0.12)',
    position: 'relative', flexShrink: 0
  }}>
    <span style={{
      position: 'absolute', top: 2, left: checked ? 19 : 2, width: 19, height: 19, borderRadius: '50%',
      background: checked ? '#0a0a0a' : '#fff', transition: 'left .18s ease'
    }} />
  </button>
);

const Modal = ({ open, onClose, title, children, width = 420 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16
    }} onClick={onClose}>
      <div className="pown-fade-in" onClick={e => e.stopPropagation()} style={{
        width, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', background: T.surfaceRaised,
        border: `1px solid ${T.borderStrong}`, borderRadius: 18, padding: 22
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} className="pown-btn" style={{ background: 'transparent', color: T.textMed }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMed, marginBottom: 6, letterSpacing: 0.4 }}>{label}</div>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', background: '#050505', border: `1px solid ${T.border}`, borderRadius: 10,
  padding: '10px 12px', color: T.textHigh, fontSize: 13, fontFamily: T.font, outline: 'none'
};

const PrimaryBtn = ({ children, onClick, icon: Icon, disabled, style }) => (
  <button onClick={onClick} disabled={disabled} className={`pown-btn${disabled ? '' : ' pown-shimmer-btn'}`} style={{
    background: disabled ? 'rgba(211,191,162,0.35)' : `linear-gradient(135deg, #e2d3ba, ${T.primary} 55%, #c2a97e)`,
    color: '#0a0a0a', border: 'none', boxShadow: disabled ? 'none' : '0 8px 20px -8px rgba(211,191,162,0.55)',
    borderRadius: 11, padding: '10px 16px', fontSize: 12.5, fontWeight: 800, display: 'inline-flex',
    alignItems: 'center', gap: 7, opacity: disabled ? 0.6 : 1, ...style
  }}>{Icon && <Icon size={14} />}{children}</button>
);

const GhostBtn = ({ children, onClick, icon: Icon, style }) => (
  <button onClick={onClick} className="pown-btn" style={{
    background: 'transparent', color: T.textMed, border: `1px solid ${T.border}`,
    borderRadius: 11, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, display: 'inline-flex',
    alignItems: 'center', gap: 7, ...style
  }}>{Icon && <Icon size={14} className={Icon === Loader2 ? 'pown-pulse' : ''} />}{children}</button>
);

const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="pown-fade-in" style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
      background: T.surfaceRaised, border: `1px solid ${T.borderStrong}`, borderRadius: 12,
      padding: '11px 18px', fontSize: 12.5, fontWeight: 700, color: T.textHigh, boxShadow: T.glowHover,
      display: 'flex', alignItems: 'center', gap: 8
    }}><CheckCircle2 size={15} color={T.primary} />{message}</div>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 26 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: `linear-gradient(140deg, ${T.primary}, #b89f7c)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px -6px rgba(211,191,162,0.5)'
        }}><Store size={19} color="#0a0a0a" strokeWidth={2.25} /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.4 }}>PRATYEKSHA</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: T.primary }}>OWNER SUITE</div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

const AuthSplash = () => (
  <div className="pown" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <GlobalStyles />
    <div className="pown-pulse" style={{
      width: 40, height: 40, borderRadius: 12, background: `linear-gradient(140deg, ${T.primary}, #b89f7c)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}><Store size={19} color="#0a0a0a" strokeWidth={2.25} /></div>
  </div>
);

const AuthErrorScreen = () => {
  const { authErrorDetail, retryAuth, tenantId } = useOwner();
  return (
    <AuthShell>
      <Card style={{ borderColor: T.dangerSoft.replace('0.14', '0.4') }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <WifiOff size={16} color={T.danger} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Couldn't reach the server</div>
        </div>
        <div style={{ fontSize: 12, color: T.textMed, marginBottom: 18, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {authErrorDetail || `Something went wrong checking the account for ${tenantId}.`}
        </div>
        <PrimaryBtn icon={RefreshCcw} onClick={retryAuth} style={{ width: '100%', justifyContent: 'center' }}>Retry</PrimaryBtn>
      </Card>
    </AuthShell>
  );
};

const LoginScreen = () => {
  const { tenantId, completeAuth } = useOwner();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true); setError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/owner/auth/login/${tenantId}`, { username, password });
      completeAuth(res.data.token, res.data.ownerName);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not sign in');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <Card>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3 }}>Welcome back</div>
        <div style={{ fontSize: 12, color: T.textLow, marginBottom: 22 }}>Signing in to <b style={{ color: T.primary }}>{tenantId}</b></div>
        <form onSubmit={submit}>
          <Field label="USERNAME">
            <input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} autoFocus autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
          </Field>
          <Field label="PASSWORD">
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 38 }} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="pown-btn" style={{ position: 'absolute', right: 8, top: 8, background: 'transparent', color: T.textLow }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          {error && <div style={{ fontSize: 11.5, color: T.danger, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.5 }}><AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ wordBreak: 'break-word' }}>{error}</span></div>}
          <PrimaryBtn icon={loading ? Loader2 : ChevronRight} disabled={loading || !username || !password} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </PrimaryBtn>
        </form>
      </Card>
      <div style={{ textAlign: 'center', fontSize: 11, color: T.textLow, marginTop: 16 }}>Wrong outlet? Close the app and open it again from a fresh link.</div>
    </AuthShell>
  );
};

const SetupScreen = () => {
  const { tenantId, completeAuth } = useOwner();
  const [ownerName, setOwnerNameField] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = username.trim() && password.length >= 6 && password === confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/owner/auth/setup/${tenantId}`, { username, password, ownerName });
      completeAuth(res.data.token, res.data.ownerName);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not complete setup');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <Card>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3 }}>Set up your owner login</div>
        <div style={{ fontSize: 12, color: T.textLow, marginBottom: 22 }}>First time here for <b style={{ color: T.primary }}>{tenantId}</b> — create your credentials. You'll only do this once.</div>
        <form onSubmit={submit}>
          <Field label="YOUR NAME"><input value={ownerName} onChange={e => setOwnerNameField(e.target.value)} style={inputStyle} placeholder="e.g. Rohan Patil" autoFocus /></Field>
          <Field label="CHOOSE A USERNAME"><input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" /></Field>
          <Field label="CHOOSE A PASSWORD"><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" /></Field>
          <Field label="CONFIRM PASSWORD"><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" /></Field>
          {password && password.length < 6 && <div style={{ fontSize: 11, color: T.textLow, marginBottom: 10 }}>Password needs at least 6 characters.</div>}
          {confirm && password !== confirm && <div style={{ fontSize: 11, color: T.danger, marginBottom: 10 }}>Passwords don't match.</div>}
          {error && <div style={{ fontSize: 11.5, color: T.danger, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.5 }}><AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ wordBreak: 'break-word' }}>{error}</span></div>}
          <PrimaryBtn icon={loading ? Loader2 : CheckCircle2} disabled={loading || !canSubmit} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Setting up…' : 'Create Login & Continue'}
          </PrimaryBtn>
        </form>
      </Card>
    </AuthShell>
  );
};

/* ════════════════════════════════════════════════════════════
   NAVIGATION CONFIG
   ════════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'revenue', label: 'Revenue & Sales', icon: TrendingUp },
  { key: 'pnl', label: 'P&L', icon: PieIcon },
  { key: 'menu', label: 'Menu Intelligence', icon: UtensilsCrossed },
  { key: 'inventory', label: 'Inventory & Stock', icon: Package },
  { key: 'kitchen', label: 'Kitchen Performance', icon: ChefHat },
  { key: 'staff', label: 'Staff & Payroll', icon: Users },
  { key: 'customers', label: 'Customers', icon: UserCircle2 },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'compliance', label: 'Compliance & GST', icon: ShieldCheck },
  { key: 'reports', label: 'Reports & Exports', icon: ClipboardList },
  { key: 'growth', label: 'Why Pratyeksha', icon: Rocket, badge: true },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];
// Quick-access row on mobile; the 5th slot opens the full drawer with every tab.
const BOTTOM_NAV_KEYS = ['dashboard', 'revenue', 'kitchen', 'alerts'];

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
      <button onClick={() => isIos ? setShowIosHelp(true) : promptInstall()} className="pown-btn pown-shimmer-btn" style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '11px 12px',
        borderRadius: 12, background: `linear-gradient(135deg, #e2d3ba, ${T.primary} 55%, #c2a97e)`, color: '#0a0a0a',
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
      }}><Smartphone size={20} color="#0a0a0a" strokeWidth={2.25} /></div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Install Pratyeksha Owner</div>
        <div style={{ fontSize: 11.5, color: T.textLow, marginTop: 2 }}>One tap, no app store — live on your home screen like any other app.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <PrimaryBtn icon={Download} onClick={() => isIos ? setShowIosHelp(true) : promptInstall()}>Install</PrimaryBtn>
        <button onClick={dismiss} className="pown-btn" style={{ background: 'transparent', color: T.textLow, padding: 6 }}><X size={16} /></button>
      </div>
      <IosInstallModal open={showIosHelp} onClose={() => setShowIosHelp(false)} />
    </Card>
  );
};

const Sidebar = () => {
  const { tenantId, ownerName, logout } = useOwner();
  return (
    <aside style={{
      width: 262, flexShrink: 0,
      borderRight: `1px solid ${T.border}`,
      background: `linear-gradient(180deg, ${T.surfaceRaised} 0%, ${T.bg} 100%)`,
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden'
    }}>
      {/* Pinned header — logo + owner chip, never scrolls */}
      <div style={{ padding: '26px 22px 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: `linear-gradient(140deg, ${T.primary}, #b89f7c)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 18px -4px rgba(211,191,162,0.5)`
          }}>
            <Store size={17} color="#0a0a0a" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.4 }}>PRATYEKSHA</div>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 2, color: T.primary }}>OWNER SUITE</div>
          </div>
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
      <nav className="pown-scroll pown-scrollpane pown-sidebar-fade" style={{ padding: '6px 14px', flex: '1 1 auto', minHeight: 0 }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.key} to={`/owner/${tenantId}/${item.key}`} className="pown-nav-link" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12, padding: '10.5px 13px', borderRadius: 12,
            marginBottom: 3, fontSize: 13, fontWeight: 600,
            background: isActive ? T.primarySoft : 'transparent',
            color: isActive ? T.primary : T.textMed,
            boxShadow: isActive ? `inset 2.5px 0 0 ${T.primary}` : 'none'
          })}>
            <item.icon size={15} strokeWidth={2} />
            {item.label}
            {item.badge && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.primary }} />}
          </NavLink>
        ))}
      </nav>

      {/* Pinned footer — install / logout, never scrolls */}
      <div style={{ padding: 18, borderTop: `1px solid ${T.border}`, display: 'grid', gap: 10, flexShrink: 0 }}>
        <InstallAppButton />
        <button onClick={logout} className="pown-btn" style={{
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
        transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .32s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column', boxShadow: open ? '20px 0 60px -20px rgba(0,0,0,0.6)' : 'none'
      }}>
        <div style={{ padding: '22px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, background: `linear-gradient(140deg, ${T.primary}, #b89f7c)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Store size={16} color="#0a0a0a" strokeWidth={2.5} /></div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: 1.2 }}>PRATYEKSHA</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, color: T.primary }}>OWNER SUITE</div>
            </div>
          </div>
          <button onClick={onClose} className="pown-btn" style={{ background: 'transparent', color: T.textLow }}><X size={18} /></button>
        </div>
        {ownerName && (
          <div style={{ margin: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', background: 'rgba(255,255,255,0.03)', borderRadius: 11 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.primarySoft, color: T.primary, fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {ownerName.trim()[0]?.toUpperCase() || 'O'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{ownerName}</div>
          </div>
        )}
        <nav className="pown-scrollpane pown-sidebar-fade" style={{ padding: '4px 14px', flex: '1 1 auto', minHeight: 0 }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.key} to={`/owner/${tenantId}/${item.key}`} className="pown-nav-link" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 12,
              marginBottom: 3, fontSize: 13.5, fontWeight: 600,
              background: isActive ? T.primarySoft : 'transparent',
              color: isActive ? T.primary : T.textMed,
              boxShadow: isActive ? `inset 2.5px 0 0 ${T.primary}` : 'none'
            })}>
              <item.icon size={16} strokeWidth={2} />
              {item.label}
              {item.badge && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.primary }} />}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={logout} className="pown-btn" style={{
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
  const items = NAV_ITEMS.filter(i => BOTTOM_NAV_KEYS.includes(i.key));
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: 'rgba(6,6,6,0.94)',
      backdropFilter: 'blur(18px)', borderTop: `1px solid ${T.border}`, display: 'flex', zIndex: 100,
      boxShadow: '0 -8px 24px -8px rgba(0,0,0,0.6)'
    }}>
      {items.map(item => (
        <NavLink key={item.key} to={`/owner/${tenantId}/${item.key}`} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          color: isActive ? T.primary : T.textLow, transition: 'color .18s ease'
        })}>
          <item.icon size={19} strokeWidth={2} />
          <span style={{ fontSize: 9.5, fontWeight: 700 }}>{item.label.split(' ')[0]}</span>
        </NavLink>
      ))}
      <button onClick={onMore} className="pown-btn" style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'transparent', color: T.textLow
      }}>
        <LayoutGrid size={19} strokeWidth={2} />
        <span style={{ fontSize: 9.5, fontWeight: 700 }}>More</span>
      </button>
    </nav>
  );
};

const TopBar = ({ onMenu }) => {
  const { tenantId, connected } = useOwner();
  const location = useLocation();
  const current = NAV_ITEMS.find(i => location.pathname.includes(`/${i.key}`));
  const [outletMenuOpen, setOutletMenuOpen] = useState(false);
  return (
    <header style={{
      flexShrink: 0, zIndex: 50, background: 'rgba(6,6,6,0.72)', backdropFilter: 'blur(18px)',
      borderBottom: `1px solid ${T.border}`, padding: '18px clamp(18px, 3vw, 40px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {onMenu && (
          <button onClick={onMenu} className="pown-btn" style={{
            width: 36, height: 36, flexShrink: 0, borderRadius: 10, background: T.surfaceRaised,
            border: `1px solid ${T.border}`, color: T.textHigh, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><MenuIcon size={17} /></button>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current?.label || 'Dashboard'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span className={connected ? 'pown-live-dot' : 'pown-pulse'} style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? T.primary : T.textLow, boxShadow: connected ? `0 0 0 3px ${T.primarySoft}` : 'none' }} />
            <span style={{ fontSize: 11, color: T.textLow, fontWeight: 600 }}>{connected ? 'Live' : 'Reconnecting…'} · {tenantId}</span>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOutletMenuOpen(v => !v)} className="pown-btn" style={{
          display: 'flex', alignItems: 'center', gap: 8, background: T.surfaceRaised, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: '9px 14px', color: T.textHigh, fontSize: 12.5, fontWeight: 700, boxShadow: T.glow
        }}>
          <MapPin size={13} color={T.primary} /> <span className="pown-hide-mobile">{tenantId}</span> <ChevronDown size={13} />
        </button>
        {outletMenuOpen && (
          <div className="pown-fade-in" style={{
            position: 'absolute', right: 0, top: 46, width: 210, background: T.surfaceRaised,
            border: `1px solid ${T.borderStrong}`, borderRadius: 13, padding: 6, zIndex: 60, boxShadow: T.glowHover
          }}>
            <div style={{ padding: '8px 10px', fontSize: 10.5, color: T.textLow, fontWeight: 800, letterSpacing: 1 }}>OUTLETS</div>
            <div style={{ padding: '9px 10px', fontSize: 12.5, fontWeight: 600, color: T.primary, background: T.primarySoft, borderRadius: 9 }}>{tenantId} (current)</div>
            <div style={{ padding: '9px 10px', fontSize: 12, color: T.textLow, cursor: 'not-allowed' }}>+ Add outlet</div>
          </div>
        )}
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
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset scroll position to the top whenever the tab (route) changes.
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [location.pathname]);

  return (
    <div className="pown" style={{ display: 'flex', width: '100%', height: '100vh' }}>
      {isDesktop && <Sidebar />}
      {!isDesktop && <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar onMenu={!isDesktop ? () => setDrawerOpen(true) : undefined} />
        <main ref={mainRef} className="pown-scroll pown-scrollpane" style={{
          flex: '1 1 auto', minHeight: 0, width: '100%',
          padding: isDesktop ? '26px clamp(18px, 3vw, 40px) 56px' : '16px 14px 96px'
        }}>
          <div key={location.pathname} className="pown-page-transition">
            {children}
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
    display: 'flex', flexDirection: 'column', gap: 12, minHeight: hero ? 132 : 118, position: 'relative', overflow: 'hidden',
    borderColor: hero ? T.borderStrong : T.border
  }}>
    <div style={{
      position: 'absolute', top: -30, right: -30, width: hero ? 130 : 100, height: hero ? 130 : 100, borderRadius: '50%',
      background: `radial-gradient(circle, ${tone === 'danger' ? T.dangerSoft : T.primarySoft} 0%, transparent 70%)`, pointerEvents: 'none'
    }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
      <Label>{label}</Label>
      <div className="pown-kpi-icon" style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: tone === 'danger' ? T.dangerSoft : T.primarySoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}><Icon size={15} color={tone === 'danger' ? T.danger : T.primary} strokeWidth={2} /></div>
    </div>
    <div className={`pown-mono${hero && tone !== 'danger' ? ' pown-gradient-text' : ''}`} style={{
      fontSize: hero ? 32 : 25, fontWeight: 800, color: tone === 'danger' ? T.danger : T.textHigh,
      lineHeight: 1, position: 'relative', letterSpacing: -0.8
    }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      {delta !== undefined && <Delta pct={delta} />}
      {sub && <span style={{ fontSize: 11.5, color: T.textLow }}>{sub}</span>}
    </div>
  </Card>
);

const greetingFor = (hour) => hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';

const LiveClock = () => {
  const [now, setNow] = useState(() => new Date(Date.now() + 330 * 60000));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date(Date.now() + 330 * 60000)), 30000);
    return () => clearInterval(id);
  }, []);
  const hour = now.getUTCHours();
  const time = now.toISOString().substr(11, 5);
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 2 }}>
      <div>
        <div className="pown-gradient-text" style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.4 }}>{greetingFor(hour)}</div>
        <div style={{ fontSize: 12, color: T.textLow, fontWeight: 600, marginTop: 2 }}>{dateStr}</div>
      </div>
      <div className="pown-mono" style={{
        fontSize: 13, fontWeight: 700, color: T.primary, background: T.primarySoft,
        padding: '7px 13px', borderRadius: 100, border: `1px solid ${T.borderStrong}`
      }}>{time} IST</div>
    </div>
  );
};

/** Simple bar sparkline (recharts) used across modules */
const MiniBarChart = ({ data, dataKey = 'value', xKey = 'x', height = 64, color = T.primary }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data}>
      <Bar dataKey={dataKey} radius={[3, 3, 0, 0]} fill={color} />
    </BarChart>
  </ResponsiveContainer>
);

const AxisTick = { fill: 'rgba(255,255,255,0.35)', fontSize: 10.5, fontFamily: T.mono };
const chartTooltipStyle = {
  contentStyle: { background: '#0d0d0d', border: `1px solid ${T.borderStrong}`, borderRadius: 10, fontSize: 12, fontFamily: T.mono },
  labelStyle: { color: T.textMed }, itemStyle: { color: T.primary }
};

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

  if (loading) return (
    <div style={{ display: 'grid', gap: 14 }}>
      <SkeletonGrid count={4} h={112} />
      <Skeleton h={54} />
      <Skeleton h={220} />
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const hourlyData = (data.hourlyToday || []).map(h => ({ x: h.hour, value: h.revenue }));

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <LiveClock />
      <InstallBanner />
      {/* Hero KPI row */}
      <div className="pown-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <KpiCard hero icon={IndianRupee} label="TODAY REVENUE" value={`\u20B9${animatedRevenue.toLocaleString('en-IN')}`}
          delta={data.revenue.todayVsYday} sub="vs yesterday" />
        <KpiCard icon={LayoutGrid} label="LIVE TABLES" value={`${data.tables.occupied} / ${data.tables.total}`}
          sub={`${data.tables.billPending} bill pending · ${data.tables.free} free`} />
        <KpiCard icon={Wallet} label="GROSS PROFIT" value={`\u20B9${animatedProfit.toLocaleString('en-IN')}`}
          sub={`${100 - data.liveProfit.foodCostPct}% margin est.`} />
        <KpiCard icon={Target} label="BREAK-EVEN" value={`${data.breakEven.pct}% achieved`}
          sub={`\u20B9${data.breakEven.remaining.toLocaleString('en-IN')} more to target`} />
      </div>

      {/* Live activity strip */}
      <Card style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', padding: '14px 20px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="pown-mono" style={{ fontSize: 20, fontWeight: 800 }}>{data.staffPresent} <span style={{ fontSize: 13, color: T.textLow, fontWeight: 600 }}>/ {data.staffTotal}</span></span>
              <ProgressBar pct={data.staffTotal ? (data.staffPresent / data.staffTotal) * 100 : 0} height={7} />
            </div>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <GhostBtn icon={ChefHat} onClick={() => navigate(`/owner/${tenantId}/kitchen`)}>View Live Orders</GhostBtn>
        <GhostBtn icon={Package} onClick={() => navigate(`/owner/${tenantId}/inventory`)}>Check Inventory</GhostBtn>
        <GhostBtn icon={LayoutGrid} onClick={() => navigate(`/owner/${tenantId}/revenue`)}>View Floor Map</GhostBtn>
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
const Divider = () => <div style={{ width: 1, height: 16, background: T.border }} />;

/* ════════════════════════════════════════════════════════════
   MODULE 2 — REVENUE & SALES
   ════════════════════════════════════════════════════════════ */
const dateRangeFor = (key) => {
  const fmt = (d) => d.toISOString().split('T')[0];
  const today = new Date(Date.now() + 330 * 60000);
  const y = new Date(today); y.setDate(y.getDate() - 1);
  switch (key) {
    case 'today': return { from: fmt(today), to: fmt(today) };
    case 'yesterday': return { from: fmt(y), to: fmt(y) };
    case 'week': { const s = new Date(today); s.setDate(s.getDate() - today.getUTCDay()); return { from: fmt(s), to: fmt(today) }; }
    case 'month': { const s = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1); return { from: fmt(s), to: fmt(today) }; }
    case 'lastMonth': { const s = new Date(today.getUTCFullYear(), today.getUTCMonth() - 1, 1); const e = new Date(today.getUTCFullYear(), today.getUTCMonth(), 0); return { from: fmt(s), to: fmt(e) }; }
    default: return { from: fmt(today), to: fmt(today) };
  }
};

const RevenuePage = () => {
  const [range, setRange] = useState('today');
  const dates = useMemo(() => dateRangeFor(range), [range]);
  const { liveOrderEvent } = useOwner();
  // No refreshMs was set here before — meaning this page only ever fetched
  // once and then sat stale indefinitely if left open. Now it polls as a
  // backstop AND refetches instantly whenever an order settles.
  const { data, loading, error, refetch } = useOwnerData('/api/owner/revenue/summary/:tenantId', { params: dates, refreshMs: 45000 });
  useEffect(() => { if (liveOrderEvent?.type === 'order_status_updated' && liveOrderEvent.order?.status === 'settled') refetch(); }, [liveOrderEvent]); // eslint-disable-line

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <PillTabs value={range} onChange={setRange} options={[
        { value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' },
        { value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' }
      ]} />

      <DataBoundary loading={loading} error={error} onRetry={refetch} empty={data && data.orderCount === 0}
        emptyProps={{ icon: TrendingUp, title: 'No settled orders in this range' }}>
        {data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <KpiCard icon={IndianRupee} label="TOTAL REVENUE" value={`\u20B9${data.totalRevenue.toLocaleString('en-IN')}`} sub={`${data.orderCount} orders`} />
              <KpiCard icon={Receipt} label="AVG ORDER VALUE" value={`\u20B9${data.metrics.avgOrderValue}`} />
              <KpiCard icon={Star} label="HIGHEST BILL" value={`\u20B9${data.metrics.highestBill.amount}`} sub={`Table ${data.metrics.highestBill.table}`} />
              <KpiCard icon={LayoutGrid} label="TABLES TURNED" value={data.metrics.tablesTurned} sub={`\u20B9${data.metrics.revenuePerCover} / cover`} />
            </div>

            <Card>
              <SectionHeading icon={BarChart3} title="Revenue Trend" />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.dailyBreakdown}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={AxisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={AxisTick} axisLine={false} tickLine={false} width={44} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="revenue" stroke={T.primary} strokeWidth={2} fill="url(#revFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <Card>
                <SectionHeading title="By Source" />
                <BreakdownList items={data.bySource.map(s => ({ label: s.source, value: s.revenue, pct: s.pct }))} />
              </Card>
              <Card>
                <SectionHeading title="By Payment Mode" />
                <BreakdownList items={data.byPayment.map(p => ({ label: p.mode, value: p.revenue, pct: p.pct, icon: p.mode === 'Cash' ? Banknote : p.mode === 'UPI' ? Smartphone : CreditCard }))} />
              </Card>
              <Card>
                <SectionHeading title="By Time of Day" />
                <BreakdownList items={data.byTimeOfDay.map(t => ({ label: `${t.label} (${t.range})`, value: t.revenue }))} showPct={false} />
              </Card>
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
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data, loading, error, refetch } = useOwnerData('/api/owner/pnl/:tenantId', { params: { month }, refreshMs: 60000 });

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 12.5, color: T.textLow, fontWeight: 700 }}>The real-time margin view — no other Indian POS shows you this live.</div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle, width: 160 }} />
      </div>

      <DataBoundary loading={loading} error={error} onRetry={refetch} empty={data && data.revenue === 0}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <KpiCard icon={Percent} label="GROSS MARGIN" value={`${data.grossMarginPct}%`} />
                <KpiCard icon={Percent} label="NET MARGIN" value={`${data.netMarginPct}%`} />
                <KpiCard icon={Target} label="MONTH PROJECTION" value={`\u20B9${data.projection.atCurrentMargin.toLocaleString('en-IN')}`} sub="net profit, if margin holds" />
              </div>

              <Card>
                <SectionHeading icon={TrendingUp} title="Daily Net Profit Trend" />
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.revenueByDay}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={AxisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={AxisTick} axisLine={false} tickLine={false} width={44} />
                    <Tooltip {...chartTooltipStyle} />
                    <Line type="monotone" dataKey="profit" stroke={T.primary} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
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
      <DataBoundary loading={loading} error={error} onRetry={refetch} empty={data && data.dishTable.length === 0}
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
                          <button onClick={() => setPriceModal(d)} className="pown-btn" style={{ background: 'transparent', color: T.primary, fontSize: 11.5, fontWeight: 700 }}>Reprice</button>
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
  const [price, setPrice] = useState(item.price);
  return (
    <div>
      <Field label="NEW PRICE (\u20B9)">
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} />
      </Field>
      <div style={{ fontSize: 11.5, color: T.textLow, marginBottom: 16 }}>Current: \u20B9{item.price} · {item.sold} sold this month</div>
      <PrimaryBtn icon={Check} onClick={() => onSave(item._id, price)}>Update Price</PrimaryBtn>
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
      <DataBoundary loading={loading} error={error} onRetry={refetch}>
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
                const msg = encodeURIComponent(`Hi, please deliver:\n${data.criticalItems.slice(0, 6).map(i => `- ${i.name}`).join('\n')}\n\nThank you.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}>Contact Vendor on WhatsApp</GhostBtn>
            </Card>

            <Card>
              <SectionHeading icon={Flame} title="Wastage" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
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
  useEffect(() => { if (liveOrderEvent) refetch(); }, [liveOrderEvent]); // eslint-disable-line

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <DataBoundary loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            <Card>
              <SectionHeading icon={Gauge} title="Today's Kitchen Score" />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span className="pown-mono" style={{ fontSize: 30, fontWeight: 800 }}>{data.score}</span>
                <span style={{ color: T.textLow, fontSize: 13 }}>/ 100</span>
                <Badge tone={data.score >= 80 ? 'gold' : data.score >= 60 ? 'warning' : 'danger'}>
                  {data.score >= 80 ? 'Excellent' : data.score >= 60 ? 'Good' : 'Needs attention'}
                </Badge>
              </div>
              <ProgressBar pct={data.score} height={9} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 }}>
                <ScoreLine label="Avg prep time" value={`${data.avgPrepTime} min`} pass={data.avgPrepTime < 15} target="< 15 min" />
                <ScoreLine label="Delayed tickets" value={data.delayedTickets} pass={data.delayedTickets < 5} target="< 5" />
                <ScoreLine label="Rejection rate" value={`${data.rejectionRate}%`} pass={data.rejectionRate === 0} target="0%" />
                <ScoreLine label="Wastage cost" value={`\u20B9${data.wastageCost}`} pass={data.wastageCost < 1000} target="< \u20B91000" />
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <KpiCard icon={Timer} label="TODAY AVG" value={`${data.trends.todayAvg}m`} />
              <KpiCard icon={Timer} label="YESTERDAY" value={`${data.trends.yesterdayAvg}m`} />
              <KpiCard icon={Timer} label="WEEK AVG" value={`${data.trends.weekAvg}m`} />
              <KpiCard icon={Zap} label="BEST / WORST" value={`${data.trends.best}m / ${data.trends.worst}m`} />
            </div>

            <Card>
              <SectionHeading title="Slowest Dishes Today" />
              {data.slowestDishes.length === 0 ? <EmptyState icon={ChefHat} title="No prep-time data yet today" /> : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.slowestDishes.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="pown-mono" style={{ fontSize: 12 }}>avg {d.avgTime}m</span>
                        <Badge tone={d.flag === 'Flag' ? 'danger' : d.flag === 'Watch' ? 'warning' : 'gold'}>{d.flag}</Badge>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionHeading icon={Eye} title="Live Tickets" action={<span style={{ fontSize: 11, color: T.textLow }}>View only</span>} />
              {data.liveTickets.length === 0 ? <EmptyState icon={CheckCircle2} title="No open tickets" /> : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.liveTickets.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>Table {t.tableNumber}</div>
                        <div style={{ fontSize: 11, color: T.textLow }}>{t.items.slice(0, 3).join(', ')}</div>
                      </div>
                      <Badge tone={t.ageMinutes > 25 ? 'danger' : t.ageMinutes > 15 ? 'warning' : 'gold'}>{t.ageMinutes}m</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {data.eightySixedToday.length > 0 && (
              <Card>
                <SectionHeading icon={PackageX} title="86'd Items Today" />
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.eightySixedToday.map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span>{e.name} — <span style={{ color: T.textLow }}>{e.reason}</span></span>
                      <span className="pown-mono" style={{ color: T.textLow }}>{e.time}</span>
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

const ScoreLine = ({ label, value, pass, target }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.textMed }}>{label}</div>
      <div className="pown-mono" style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
    </div>
    {pass ? <CheckCircle2 size={16} color={T.primary} /> : <AlertTriangle size={16} color={T.warning} />}
  </div>
);

/* ════════════════════════════════════════════════════════════
   MODULE 7 — STAFF & PAYROLL
   ════════════════════════════════════════════════════════════ */
const StaffPage = () => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data, loading, error, refetch } = useOwnerData('/api/owner/staff/summary/:tenantId', { params: { month }, refreshMs: 45000 });
  const { liveStaffEvent } = useOwner();
  useEffect(() => { if (liveStaffEvent) refetch(); }, [liveStaffEvent]); // eslint-disable-line

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle, width: 160 }} />
      </div>
      <DataBoundary loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
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

            {data.leaderboard.length > 0 && (
              <Card>
                <SectionHeading icon={Award} title="Performance Leaderboard" />
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.leaderboard.map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                      <span className="pown-mono" style={{ width: 20, color: T.textLow, fontSize: 12, fontWeight: 700 }}>#{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{l.name}</span>
                      <span className="pown-mono" style={{ fontSize: 11.5, color: T.textLow }}>{l.tablesServed} tables</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} color={T.primary} fill={T.primary} /><span className="pown-mono" style={{ fontSize: 12 }}>{l.rating}</span></span>
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
const CustomersPage = () => {
  const { data, loading, error, refetch } = useOwnerData('/api/owner/customers/insights/:tenantId', { refreshMs: 90000 });
  const { tenantId } = useOwner();
  const [sending, setSending] = useState(false);

  const sendWinback = async () => {
    if (!data?.atRiskList?.length) return;
    setSending(true);
    try {
      await api.post(`/api/owner/customers/winback/${tenantId}`, {
        phones: data.atRiskList.map(c => c.phone),
        message: `We miss you! Here's 15% off your next visit. Valid 7 days.`
      });
    } finally { setSending(false); }
  };

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <DataBoundary loading={loading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <KpiCard icon={Users} label="TOTAL CUSTOMERS" value={data.overview.total} sub={`+${data.overview.newThisMonth} this month`} />
              <KpiCard icon={ThumbsUp} label="RETURNING" value={`${data.overview.returningPct}%`} />
              <KpiCard icon={AlertTriangle} label="AT-RISK" value={data.overview.atRisk} tone={data.overview.atRisk > 0 ? 'danger' : 'default'} />
              <KpiCard icon={Star} label="AVG VISITS" value={data.overview.avgVisits} />
            </div>

            <div className="pown-grid-4">
              <StatBlock label="VIP" value={data.segments.vip} tone="gold" />
              <StatBlock label="Regular" value={data.segments.regular} />
              <StatBlock label="One-time" value={data.segments.oneTime} />
              <StatBlock label="At-risk" value={data.segments.atRisk} tone="danger" />
            </div>

            <Card>
              <SectionHeading icon={Megaphone} title="Win-Back Campaign"
                action={<Badge tone="gold">{data.atRiskList.length} at-risk</Badge>} />
              <p style={{ fontSize: 12.5, color: T.textMed, lineHeight: 1.6, marginBottom: 14 }}>
                "We miss you! Here's 15% off your next visit. Valid 7 days." — sent to customers silent for 30+ days. Estimated response rate 25–30%.
              </p>
              <PrimaryBtn icon={Send} onClick={sendWinback} disabled={sending || !data.atRiskList.length}>
                {sending ? 'Sending…' : `Send to ${data.atRiskList.length} At-Risk Customers`}
              </PrimaryBtn>
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
const SEVERITY_META = {
  urgent: { label: 'Urgent', tone: 'danger', icon: AlertTriangle },
  attention: { label: 'Attention', tone: 'warning', icon: Bell },
  info: { label: 'Info', tone: 'gold', icon: CheckCircle2 },
};

const AlertsPage = () => {
  const { data, loading, error, refetch } = useOwnerData('/api/owner/alerts/:tenantId', { refreshMs: 30000 });
  const { data: notifData, loading: notifLoading, refetch: refetchNotifs } = useOwnerData('/api/owner/notifications/:tenantId', { refreshMs: 30000 });
  const { liveAlert, liveAdminNotification } = useOwner();

  useEffect(() => { if (liveAlert) refetch(); }, [liveAlert]); // eslint-disable-line
  useEffect(() => { if (liveAdminNotification) refetchNotifs(); }, [liveAdminNotification]); // eslint-disable-line

  const markRead = async (id) => { await api.post(`/api/owner/alerts/read/${id}`); refetch(); };
  const markNotifRead = async (id) => { await api.post(`/api/owner/notifications/${id}/read`); refetchNotifs(); };

  const NOTIF_SEVERITY = {
    urgent: { tone: 'danger' }, important: { tone: 'warning' }, info: { tone: 'gold' }
  };

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      {!notifLoading && notifData && notifData.length > 0 && (
        <Card padded={false}>
          <div style={{ padding: '18px 20px 4px' }}>
            <SectionHeading icon={Megaphone} title="From Pratyeksha" />
          </div>
          {notifData.map((n, i) => {
            const meta = NOTIF_SEVERITY[n.severity] || NOTIF_SEVERITY.info;
            return (
              <div key={n._id} className="pown-row-hover" style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 20px',
                borderTop: i > 0 ? `1px solid ${T.border}` : 'none', opacity: n.isRead ? 0.55 : 1
              }}>
                <Megaphone size={16} color={n.severity === 'urgent' ? T.danger : n.severity === 'important' ? T.warning : T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: T.textMed, marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
                  <div className="pown-mono" style={{ fontSize: 10.5, color: T.textLow, marginTop: 5 }}>
                    {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>
                {!n.isRead && <button onClick={() => markNotifRead(n._id)} className="pown-btn" style={{ background: 'transparent', color: T.textLow, fontSize: 11, flexShrink: 0 }}>Mark read</button>}
              </div>
            );
          })}
        </Card>
      )}

      <DataBoundary loading={loading} error={error} onRetry={refetch} empty={data && data.alerts.length === 0 && (!notifData || notifData.length === 0)}
        emptyProps={{ icon: Bell, title: 'No alerts yet', subtitle: 'You\u2019ll see stock, revenue and kitchen alerts here in real time' }}>
        {data && (
          <>
            <div className="pown-grid-3">
              <StatBlock label="Urgent" value={data.counts.urgent} tone="danger" />
              <StatBlock label="Attention" value={data.counts.attention} tone="warning" />
              <StatBlock label="Info" value={data.counts.info} tone="gold" />
            </div>
            {data.alerts.length > 0 && (
            <Card padded={false}>
              {data.alerts.map((a, i) => {
                const meta = SEVERITY_META[a.severity] || SEVERITY_META.info;
                return (
                  <div key={a._id} className="pown-row-hover" style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 20px',
                    borderTop: i > 0 ? `1px solid ${T.border}` : 'none', opacity: a.isRead ? 0.55 : 1
                  }}>
                    <meta.icon size={16} color={a.severity === 'urgent' ? T.danger : a.severity === 'attention' ? T.warning : T.primary} style={{ marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.message}</div>
                      <div className="pown-mono" style={{ fontSize: 10.5, color: T.textLow, marginTop: 3 }}>
                        {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })} · {a.category}
                      </div>
                    </div>
                    {!a.isRead && <button onClick={() => markRead(a._id)} className="pown-btn" style={{ background: 'transparent', color: T.textLow, fontSize: 11 }}>Mark read</button>}
                  </div>
                );
              })}
            </Card>
            )}
          </>
        )}
      </DataBoundary>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MODULE 10 — COMPLIANCE & GST
   ════════════════════════════════════════════════════════════ */
const CompliancePage = () => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data, loading, error, refetch } = useOwnerData('/api/owner/reports/gst/:tenantId', { params: { month }, refreshMs: 120000 });
  const { tenantId } = useOwner();
  const [toast, setToast] = useState(null);
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3200); };

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
      { name: 'B2C (Others)', rows: [{ 'Place of Supply': 'Intra-state', 'Rate %': (data.cgstPct + data.sgstPct), 'Taxable Value': data.revenue, 'CGST': data.cgst, 'SGST': data.sgst, 'Total Invoices': data.invoiceRegister.length }] },
      { name: 'Invoice-wise', rows: data.invoiceRegister.map(r => ({ 'Invoice No': r.billNo, Date: r.date, 'Taxable Value': Math.round(r.amount - r.gst), GST: r.gst, 'Invoice Value': r.amount })) },
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
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="pown-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle, width: 160 }} />
      </div>
      <DataBoundary loading={loading} error={error} onRetry={refetch}>
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
  const [toast, setToast] = useState(null);
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3200); };

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
      <div className="pown-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
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
                  <td style={{ padding: '13px 22px', fontSize: 12.5, color: T.textLow, display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <X size={14} color={T.danger} style={{ marginTop: 2, flexShrink: 0 }} />{row.manual}
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
            <button key={item.key} onClick={() => navigate(`/owner/${tenantId}/${item.key}`)} className="pown-btn pown-row-hover" style={{
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
const SettingsPage = () => {
  const { tenantId } = useOwner();
  const { data, loading, error, refetch } = useOwnerData('/api/owner/settings/:tenantId');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [eightySixOpen, setEightySixOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3200); };

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = async () => {
    setSaving(true);
    try { await api.put(`/api/owner/settings/${tenantId}`, form); refetch(); }
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
      <DataBoundary loading={loading || !form} error={error} onRetry={refetch}>
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

            <Card>
              <SectionHeading icon={Target} title="Revenue Targets" />
              <div className="pown-grid-2">
                <Field label="DAILY TARGET (\u20B9)">
                  <input type="number" value={form.dailyTarget} onChange={e => setForm(f => ({ ...f, dailyTarget: Number(e.target.value) }))} style={inputStyle} />
                </Field>
                <Field label="MONTHLY TARGET (\u20B9)">
                  <input type="number" value={form.monthlyTarget} onChange={e => setForm(f => ({ ...f, monthlyTarget: Number(e.target.value) }))} style={inputStyle} />
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
  const send = async () => {
    setSending(true);
    try {
      await api.post(`/api/owner/announcement/${tenantId}`, { title, message, expiresAt: new Date(Date.now() + 4 * 3600000).toISOString() });
      onDone();
    } finally { setSending(false); }
  };
  return (
    <div>
      <Field label="TITLE"><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Weekend Special" /></Field>
      <Field label="MESSAGE"><textarea value={message} onChange={e => setMessage(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Shown on every table's menu for 4 hours" /></Field>
      <PrimaryBtn icon={Send} onClick={send} disabled={sending || !title || !message}>{sending ? 'Sending…' : 'Push to All Tables'}</PrimaryBtn>
    </div>
  );
};

const EightySixForm = ({ tenantId, onDone }) => {
  const { data, loading } = useOwnerData('/api/owner/menu/insights/:tenantId');
  const [query, setQuery] = useState('');
  const [hiding, setHiding] = useState(null);

  const dishes = (data?.dishTable || []).filter(d => d.name.toLowerCase().includes(query.toLowerCase()));

  const hideDish = async (dish) => {
    setHiding(dish._id);
    try {
      await api.patch(`/api/owner/menu/hide/${tenantId}/${dish._id}`, { isAvailable: false });
      onDone(`"${dish.name}" hidden from the menu`);
    } finally { setHiding(null); }
  };

  return (
    <div>
      <Field label="SEARCH DISH">
        <div style={{ position: 'relative' }}>
          <Search size={14} color={T.textLow} style={{ position: 'absolute', left: 11, top: 12 }} />
          <input value={query} onChange={e => setQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Type to filter…" autoFocus />
        </div>
      </Field>
      <div className="pown-scroll" style={{ maxHeight: 280, overflowY: 'auto', display: 'grid', gap: 6 }}>
        {loading ? <Skeleton h={40} /> : dishes.length === 0 ? (
          <div style={{ fontSize: 12, color: T.textLow, padding: '10px 0' }}>No matching dishes</div>
        ) : dishes.slice(0, 30).map(d => (
          <div key={d._id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px',
            background: 'rgba(255,255,255,0.02)', borderRadius: 10
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.name}</span>
            <button onClick={() => hideDish(d)} disabled={hiding === d._id} className="pown-btn" style={{
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
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const canSubmit = current && next.length >= 6 && next === confirm;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true); setError(null);
    try {
      await api.put(`/api/owner/auth/change-password/${tenantId}`, { currentPassword: current, newPassword: next });
      onDone('Password updated');
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not update password');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <Field label="CURRENT PASSWORD"><input type="password" value={current} onChange={e => setCurrent(e.target.value)} style={inputStyle} autoFocus /></Field>
      <Field label="NEW PASSWORD"><input type="password" value={next} onChange={e => setNext(e.target.value)} style={inputStyle} /></Field>
      <Field label="CONFIRM NEW PASSWORD"><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} /></Field>
      {next && next.length < 6 && <div style={{ fontSize: 11, color: T.textLow, marginBottom: 10 }}>Needs at least 6 characters.</div>}
      {confirm && next !== confirm && <div style={{ fontSize: 11, color: T.danger, marginBottom: 10 }}>Passwords don't match.</div>}
      {error && <div style={{ fontSize: 11.5, color: T.danger, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13} />{error}</div>}
      <PrimaryBtn icon={saving ? Loader2 : Check} onClick={submit} disabled={saving || !canSubmit}>{saving ? 'Updating…' : 'Update Password'}</PrimaryBtn>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   ROOT — OwnerApp (mount at /owner/:tenantId/*)
   ════════════════════════════════════════════════════════════ */
const OwnerAppInner = () => (
  <OwnerShell>
    <Routes>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="revenue" element={<RevenuePage />} />
      <Route path="pnl" element={<PnlPage />} />
      <Route path="menu" element={<MenuPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="kitchen" element={<KitchenPage />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="alerts" element={<AlertsPage />} />
      <Route path="compliance" element={<CompliancePage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="growth" element={<GrowthPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  </OwnerShell>
);

export default function OwnerApp() {
  const { tenantId } = useParams();
  return (
    <>
      <GlobalStyles />
      <OwnerProvider tenantId={tenantId}>
        <AuthGate>
          <OwnerAppInner />
        </AuthGate>
      </OwnerProvider>
    </>
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
    if (last) navigate(`/owner/${last}/dashboard`, { replace: true });
    else setChecking(false);
  }, [navigate]);

  const go = () => {
    const id = outletInput.trim();
    if (id) navigate(`/owner/${id}/dashboard`);
  };

  if (checking) return null;

  return (
    <div className="pown" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 20 }}>
      <GlobalStyles />
      <Card style={{ width: 360, maxWidth: '100%', textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 15, margin: '0 auto 18px',
          background: `linear-gradient(140deg, ${T.primary}, #b89f7c)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 26px -6px rgba(211,191,162,0.5)'
        }}><Store size={24} color="#0a0a0a" strokeWidth={2.25} /></div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Welcome to Pratyeksha Owner</div>
        <div style={{ fontSize: 12, color: T.textLow, marginBottom: 20, lineHeight: 1.6 }}>Enter your outlet ID to open your dashboard. You'll only need to do this once on this device.</div>
        <input value={outletInput} onChange={e => setOutletInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
          placeholder="e.g. jay_ambe_fusion" style={{ ...inputStyle, textAlign: 'center', marginBottom: 14 }} autoFocus />
        <PrimaryBtn icon={ChevronRight} onClick={go} disabled={!outletInput.trim()} style={{ width: '100%', justifyContent: 'center' }}>Open Dashboard</PrimaryBtn>
      </Card>
    </div>
  );
}
