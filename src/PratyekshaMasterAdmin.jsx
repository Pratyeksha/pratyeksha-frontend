import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from './apiBase.js';
import LeadCRM from './LeadCRM.jsx';
import MasterTracking from './MasterTracking.jsx';
import MasterDocuments from './MasterDocuments.jsx';
import QrStudio from './QrStudio.jsx';
import { QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, RefreshCcw, Search, Users, Trophy, ShieldCheck, AlertCircle, Utensils, Coffee, CalendarClock, Phone, Mail, MapPin, ChevronRight, CheckCircle2, Clock, X, Menu, Plus, Power, RotateCcw, UserPlus, IndianRupee, AlertTriangle, Calendar, Store, BarChart3, Eye, EyeOff, Copy, Check, Wallet, Download, Smartphone, Upload, FileJson, Loader2, FileDown, Trash2,  Send, Receipt, Megaphone as MegaphoneIcon, TrendingDown, PlusCircle, Edit3, FileText, Radar } from 'lucide-react';
import SpoonForkIcon from './SpoonForkIcon.jsx';
const Bell = SpoonForkIcon; // crossed spoon & fork instead of the bell

const BASE_URL = API_BASE_URL;
const BRAND_LOGO = '/pratyeksha-logo.png';
const EXPENSE_CATEGORY_LABELS_FRONTEND = {
  domain: 'Domain', hosting: 'Hosting / Server', email: 'Email Service',
  sms_whatsapp: 'SMS / WhatsApp API', qr_stands: 'QR Stands', payment_gateway: 'Payment Gateway',
  software: 'Software / Tools', marketing: 'Marketing', other: 'Other'
};

/* ─────────────────────────────────────────
   DESIGN TOKENS
   #d3bfa2 — primary light gold (headings, CTAs, active states)
   #8a704d — secondary dark gold (muted labels, secondary actions)
───────────────────────────────────────── */
const C = {
  /* backgrounds */
  bg:      '#141416',
  bgDark:  '#101012',
  bgCard:  '#1b1b1e',
  bgCard2: '#232327',
  bgInput: '#17171a',

  /* borders */
  border:    '#2e2e34',
  borderMid: '#3b3b42',

  /* ── TWO-TONE GOLD SYSTEM ── */
  goldPrimary: '#d3bfa2',          /* light warm gold  — active nav, CTA buttons, key numbers */
  goldSecond:  '#8a704d',          /* dark amber       — muted labels, secondary text, hover hints */
  goldPrimaryFaint: 'rgba(211,191,162,0.07)',
  goldPrimaryBorder: 'rgba(211,191,162,0.16)',
  goldSecondFaint: 'rgba(138,112,77,0.07)',
  goldSecondBorder: 'rgba(138,112,77,0.2)',

  /* text */
  text:      '#e8e8e8',   /* near-white primary body */
  textMid:   '#a8a8a8',   /* secondary body */
  textDim:   '#8a8a92',   /* labels, placeholders */
  textFaint: '#6e6e76',   /* very dim */

  /* status colors — kept neutral, no gold bleed */
  warning:  '#d4903a',
  danger:   '#e29a58',
  success:  '#ecdcb9',
  green:    '#ecdcb9',
  amber:    '#b87c33',
};

/* ── Global CSS ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body, html {
    overflow: hidden !important;
    width: 100vw; height: 100vh;
    background: #1a1a1d;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #e8e8e8;
    -webkit-font-smoothing: antialiased;
    font-size: 14px; line-height: 1.5;
  }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #222; border-radius: 99px; }
  .no-sb::-webkit-scrollbar { display: none; }
  .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
  input, select, textarea, button { font-family: 'Inter', sans-serif; font-size: 13px; }
  a { text-decoration: none; color: inherit; }

  .p-sidebar {
    width: 256px; min-width: 256px; height: calc(100vh - 24px); margin: 12px 0 12px 12px;
    background: linear-gradient(180deg, rgba(34,34,38,0.92), rgba(22,22,25,0.96)); border: 1px solid rgba(211,191,162,0.16);
    border-radius: 24px; box-shadow: 0 24px 60px -24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(14px);
    display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
    transition: transform 0.26s cubic-bezier(.4,0,.2,1);
    position: relative; z-index: 149;
  }
  .p-sidebar-inner { display: flex; flex-direction: column; height: 100%; overflow: hidden; padding: 22px 14px; }

  .p-topbar {
    display: none; position: fixed; top: 0; left: 0; right: 0;
    height: 50px; background: #101012; border-bottom: 1px solid #313137;
    z-index: 160; align-items: center; justify-content: space-between; padding: 0 14px;
  }
  .p-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 148; }

  /* Input focus — light gold ring */
  .p-inp { transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
  .p-modal { text-align: left; }
  .p-modal input[type=checkbox], .p-modal input[type=radio] { accent-color: #d3bfa2; }
  .p-modal input[type=date] { color-scheme: dark; }
  .p-inp:focus {
    border-color: rgba(211,191,162,0.45) !important;
    box-shadow: 0 0 0 3px rgba(211,191,162,0.06) !important;
  }

  .p-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .p-stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
  .p-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .p-filterbar { display: flex; border-bottom: 1px solid #313137; flex-shrink: 0; background: #101012; overflow-x: auto; }
  .p-filterbar::-webkit-scrollbar { display: none; }
  .p-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
  .p-main { min-height: 0; }
  .p-main > .p-scroll { min-height: 0; width: 100%; }
  .p-pad { padding: 24px 32px 48px; }

  .p-row { transition: background 0.1s; }
  .p-row:hover { background: #222226 !important; }

  /* Card hover — light gold border + gentle lift */
  .p-card { transition: border-color 0.18s, transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s; }
  .p-card:hover { border-color: rgba(211,191,162,0.22) !important; }
  .p-card-lift:hover { transform: translateY(-3px); box-shadow: 0 16px 32px -14px rgba(0,0,0,0.55); }

  .p-demo-card { transition: background 0.1s, border-color 0.1s; cursor: pointer; }
  .p-demo-card:hover { background: #222226 !important; }

  /* Nav hover — subtle light gold tint */
  .p-nav-item:hover { background: rgba(211,191,162,0.04) !important; color: #d3bfa2 !important; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pulse-slow { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
  @keyframes p-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .p-fade-in { animation: p-fade-in .3s cubic-bezier(.4,0,.2,1) both; }
  .p-stagger > * { animation: p-fade-in .4s cubic-bezier(.4,0,.2,1) both; }
  .p-stagger > *:nth-child(1){animation-delay:.02s} .p-stagger > *:nth-child(2){animation-delay:.06s}
  .p-stagger > *:nth-child(3){animation-delay:.1s} .p-stagger > *:nth-child(4){animation-delay:.14s}

  /* Modal overlay */
  .p-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(3px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .p-modal { background: #222226; border: 1px solid #3b3b42; border-radius: 16px; padding: 22px; width: 420px; max-width: 100%; max-height: 88vh; overflow-y: auto; }

  /* Table horizontal scroll + hint */
  .p-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .p-scroll-hint { display: none; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 600; color: #a9a9ad; padding: 8px 32px 0; }
  @media (max-width: 780px) { .p-scroll-hint { display: flex; } }

  /* Dropzone */
  .p-dropzone { border: 1.5px dashed #3b3b42; border-radius: 12px; transition: border-color .15s, background .15s; cursor: pointer; }
  .p-dropzone:hover, .p-dropzone.drag { border-color: rgba(211,191,162,0.45); background: rgba(211,191,162,0.03); }

  .p-btn-shimmer { position: relative; overflow: hidden; }
  .p-btn-shimmer::after { content:''; position:absolute; top:0; left:-60%; width:40%; height:100%; background:linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent); transform:skewX(-20deg); transition:left .6s cubic-bezier(.4,0,.2,1); }
  .p-btn-shimmer:hover::after { left:130%; }

  @media (max-width: 1100px) {
    .p-stat-grid { grid-template-columns: repeat(2,1fr); }
    .p-chart-grid { grid-template-columns: 1fr; }
    .p-pad { padding: 20px 20px 40px; }
    .p-sidebar { width: 220px; min-width: 220px; }
  }
  @media (max-width: 768px) {
    .p-topbar { display: flex; }
    .p-scroll { min-height: 0; }
    .p-pad { padding-left: 14px !important; padding-right: 14px !important; }
    .p-header { padding-left: 14px !important; padding-right: 14px !important; }
    .p-form-grid { grid-template-columns: 1fr !important; }
    .p-form-grid > * { grid-column: auto !important; }
    .p-sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 80vw; max-width: 260px; height: auto; margin: 0; border-radius: 0 24px 24px 0;
      transform: translateX(-100%); z-index: 160;
    }
    .p-sidebar.open { transform: translateX(0); }
    .p-backdrop.open { display: block; }
    .p-main { padding-top: 50px !important; }
    .p-stat-grid { grid-template-columns: 1fr 1fr; }
    .p-form-grid { grid-template-columns: 1fr; }
    .p-pad { padding: 14px 14px 40px; }
    .p-chart-grid { grid-template-columns: 1fr; }
    .hide-mob { display: none !important; }
    .p-header { padding: 14px 14px 12px !important; }
    .p-drawer {
      position: fixed !important; inset: 50px 0 0 0 !important;
      width: 100vw !important; max-width: 100vw !important;
      z-index: 170 !important; border-left: none !important;
    }
    .p-demo-list { flex: 1 !important; }
    .p-demo-list.has-detail { display: none !important; }
  }
  @media (max-width: 480px) {
    .p-stat-grid { grid-template-columns: 1fr; }
    .hide-sm { display: none !important; }
  }
  @media (min-width: 769px) {
    .p-demo-list { display: flex !important; }
    .p-drawer { position: relative !important; flex-shrink: 0 !important; }
  }
`;

/* These rules lock html/body and reset every element's margin/padding, so they must only exist while the
   admin console is mounted. Injecting at import time leaked them into every other route (the guest home
   could not scroll). */
function useAdminGlobalStyles() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const s = document.createElement('style');
    s.id = 'p-admin-styles';
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);
}

/* ─────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────── */

/* Status chip:
   Pending   → light gold (#d3bfa2) bg tint
   Contacted → dark amber (#8a704d) tint
   Done      → neutral gray
*/
const StatusChip = ({ status }) => {
  const map = {
    'Pending':    { color: '#d3bfa2', bg: 'rgba(211,191,162,0.08)', border: 'rgba(211,191,162,0.2)',  label: 'Pending' },
    'Contacted':  { color: '#8a704d', bg: 'rgba(138,112,77,0.10)',  border: 'rgba(138,112,77,0.22)', label: 'Contacted' },
    'Demo Given': { color: '#a9a9ad', bg: 'rgba(96,96,96,0.07)',    border: 'rgba(96,96,96,0.16)',   label: 'Done' },
  };
  const s = map[status] || map['Pending'];
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 6,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.2px', whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
};

/* Status dot on client row */
const ClientStatusDot = ({ client }) => {
  const base = { width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0 };
  const st = subOf(client).state;
  if (st === 'expiring') return <span style={{ ...base, background: STATE_META.expiring.color, animation: 'pulse-slow 2s infinite' }} />;
  return <span style={{ ...base, background: (STATE_META[st] || STATE_META.unset).color }} />;
};

/* Section heading inside forms/drawers */
const SectionLabel = ({ children, icon: Icon }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, color: C.textDim,
    letterSpacing: '0.6px', textTransform: 'uppercase',
    marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7,
  }}>
    {Icon && <Icon size={12} color={C.textDim} strokeWidth={1.5} />}
    {children}
  </div>
);

/* Thin horizontal rule */
const Div = () => <div style={{ height: 1, background: C.border, margin: '16px 0' }} />;

/* Form row wrapper */
const LabeledInput = ({ label, required, hint, children }) => (
  <div>
    <label style={{
      display: 'block', marginBottom: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.3px',
      color: required ? C.textMid : C.textDim,
    }}>
      {label}
      {/* required asterisk in dark amber — visible but not shouty */}
      {required && <span style={{ color: '#8a704d', marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>{hint}</div>}
  </div>
);

/* Base input style */
const inp = {
  width: '100%', padding: '10px 12px',
  background: C.bgInput, border: `1px solid ${C.borderMid}`,
  color: C.text, borderRadius: 8, fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
};

/* ── Subscription state: the server computes it once (subscriptionView) and every screen reads that. ── */
const DAY_MS = 86400000;
const subOf = (c) => {
  if (c?.subscriptionView) return c.subscriptionView;
  const now = new Date();
  const exp = c?.config?.planExpiry ? new Date(c.config.planExpiry) : null;
  const state = exp && exp <= now ? 'expired' : c?.isActive === false ? 'disabled' : !exp ? 'unset' : (exp - now) / DAY_MS <= 30 ? 'expiring' : 'active';
  return { state, planExpiry: exp ? exp.toISOString() : null, daysLeft: exp && exp > now ? Math.ceil((exp - now) / DAY_MS) : exp ? 0 : null, isActive: c?.isActive !== false, startedAt: c?.createdAt || null, lastPaymentAt: null, lastPaymentAmount: 0, lastPaymentMonths: 0, deactivatedReason: '' };
};
const STATE_META = {
  active:   { label: 'Active',    color: '#d3bfa2' },
  expiring: { label: 'Expiring',  color: '#8a704d' },
  expired:  { label: 'Expired',   color: C.warning },
  disabled: { label: 'Disabled',  color: C.danger },
  unset:    { label: 'No expiry', color: C.textDim },
};
const fmtDay = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const addMonthsClamped = (from, m) => { const d = new Date(from); const day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + m); d.setUTCDate(Math.min(day, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate())); return d; };
const PAY_METHODS = ['UPI', 'Cash', 'Bank transfer', 'Card', 'Other'];

/* ─────────────────────────────────────────
   PWA — installable app support
   Needs /admin-manifest.webmanifest, /admin-sw.js and /admin-pwa/*.png
   placed in the frontend project's /public folder (see deployment notes).
───────────────────────────────────────── */
function usePwaInstall() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Remember what we inject and remove it on unmount: it used to stay in <head> after leaving this page, so the admin
    // manifest / icon stayed attached to every other screen of the SPA.
    const injected = [];
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/admin-manifest.webmanifest';
      document.head.appendChild(link); injected.push(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color'; meta.content = '#1a1a1d';
      document.head.appendChild(meta); injected.push(meta);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/admin-pwa/apple-touch-icon.png';
      document.head.appendChild(link); injected.push(link);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/admin-sw.js', { scope: '/master-admin' }).catch(() => {});
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
      injected.forEach(el => { try { el.remove(); } catch { /* already gone */ } });
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return 'unavailable';
    try {
      installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setInstallEvent(null);
      return outcome;
    } catch {
      // The event can only be used once; a second tap threw and left the button stuck.
      setInstallEvent(null);
      return 'unavailable';
    }
  };

  return { canInstall: !!installEvent, installed, isIos, promptInstall };
}

/** Animates a number counting up to its new value. */
function useCountUp(target, duration = 700) {
  const numericTarget = Number(target) || 0;
  const [display, setDisplay] = useState(numericTarget);
  // Start every animation from what is on screen. It used to start from the last *completed* target, so changing the
  // value again mid-animation jumped, and returning to the previous value left the half-animated number stuck.
  const displayRef = useRef(numericTarget);
  useEffect(() => {
    const start = displayRef.current, end = numericTarget;
    if (start === end) { setDisplay(end); return undefined; }
    let startTime = null, raf;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min(1, (ts - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const v = progress >= 1 ? end : Math.round(start + (end - start) * eased);
      displayRef.current = v;
      setDisplay(v);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [numericTarget, duration]);
  return display;
}

const CountUp = (props) => {
  const val = useCountUp(props.value);
  return <>{val.toLocaleString()}</>;
};

const IosInstallSteps = () => (
  <div style={{ display: 'grid', gap: 12 }}>
    {[
      <>Tap the <b>Share</b> icon in Safari's toolbar</>,
      <>Scroll down and tap <b>"Add to Home Screen"</b></>,
      <>Tap <b>Add</b> — the admin icon appears on your home screen</>,
    ].map((text, i) => (
      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(211,191,162,0.1)', color: '#d3bfa2', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
        <div style={{ fontSize: 12.5, color: C.textMid, lineHeight: 1.6, paddingTop: 2 }}>{text}</div>
      </div>
    ))}
  </div>
);

const InstallButton = ({ compact }) => {
  const { canInstall, installed, isIos, promptInstall } = usePwaInstall();
  const [showIos, setShowIos] = useState(false);
  if (installed) return compact ? null : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: C.textDim, fontWeight: 600, padding: '9px 2px' }}>
      <CheckCircle2 size={13} color="#d3bfa2" /> App installed
    </div>
  );
  if (!canInstall && !isIos) return null;
  return (
    <>
      <button type="button" onClick={() => isIos ? setShowIos(true) : promptInstall()} className="p-btn-shimmer" style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 12px',
        borderRadius: 9, background: 'linear-gradient(135deg,#e9dcc4,#d3bfa2 55%,#b3986f)', color: '#0f0f11',
        border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
      }}><Download size={13} /> Install App</button>
      <AnimatePresence>
        {showIos && (
          <ModalShell title="Install on iPhone / iPad" onClose={() => setShowIos(false)} icon={Smartphone}>
            <IosInstallSteps />
          </ModalShell>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─────────────────────────────────────────
   SHARED: modal shell, toast, confirm/renew/import dialogs
───────────────────────────────────────── */
const ModalShell = ({ title, icon: Icon, onClose, children, width }) => {
  // Close on a click that both started and ended on the backdrop: selecting text in an input and releasing the mouse outside
  // the dialog used to close it and throw away a half-filled form. Escape closes too.
  const downOnBackdrop = useRef(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
  <motion.div className="p-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onMouseDown={e => { downOnBackdrop.current = e.target === e.currentTarget; }}
    onClick={e => { if (downOnBackdrop.current && e.target === e.currentTarget) onClose?.(); downOnBackdrop.current = false; }}>
    <motion.div className="p-modal" style={width ? { width } : undefined}
      initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={15} color="#d3bfa2" /></div>}
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.textDim, cursor: 'pointer', display: 'flex', padding: 4 }}><X size={17} /></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
  );
};

const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        style={{
          position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 400,
          background: '#222226', border: `1px solid ${toast.tone === 'error' ? 'rgba(226,154,88,0.4)' : 'rgba(211,191,162,0.3)'}`,
          borderRadius: 11, padding: '11px 18px', fontSize: 12.5, fontWeight: 600, color: C.text,
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 16px 40px -12px rgba(0,0,0,0.6)', maxWidth: '90vw'
        }}>
        {toast.tone === 'error' ? <AlertTriangle size={15} color={C.danger} /> : <CheckCircle2 size={15} color="#d3bfa2" />}
        <span style={{ wordBreak: 'break-word' }}>{toast.msg}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

const ConfirmModal = ({ data, onClose, onConfirm }) => {
  const [busy, setBusy] = useState(false);
  if (!data) return null;
  const run = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }; // a throwing onConfirm left the button locked on "Working…" forever
  return (
    <ModalShell title={data.title} icon={data.icon || AlertTriangle} onClose={onClose} width={380}>
      <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 20 }}>{data.message}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={run} disabled={busy} style={{
          flex: 1, padding: '11px', borderRadius: 9, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
          background: data.tone === 'danger' ? C.danger : '#d3bfa2', color: '#0f0f11', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
        }}>{busy ? <Loader2 size={14} className="p-spin" style={{ animation: 'spin 0.8s linear infinite' }} /> : null}{busy ? 'Working…' : (data.confirmLabel || 'Confirm')}</button>
        <button type="button" onClick={onClose} disabled={busy} style={{ flex: 1, padding: '11px', borderRadius: 9, background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
      </div>
    </ModalShell>
  );
};

const RenewModal = ({ client, onClose, onSubmit }) => {
  const [months, setMonths] = useState('12');
  const [amount, setAmount] = useState('1200');
  const [products, setProducts] = useState({ pratyeksha: true, feedbackSuite: false, whatsappCampaigns: false });
  const [feedbackAdminEmail, setFeedbackAdminEmail] = useState('');
  const [feedbackAdminPassword, setFeedbackAdminPassword] = useState('');
  const [campaignStudioPassword, setCampaignStudioPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [paidAt, setPaidAt] = useState(todayIST());
  const [method, setMethod] = useState('UPI');
  const [note, setNote] = useState('');
  const [formErr, setFormErr] = useState('');
  // This component stays mounted while closed, so the previous client's duration/amount were pre-filled for the next one
  // and could be confirmed by mistake as that client's payment. Reset whenever a different client is opened.
  useEffect(() => { if (client) { setMonths('12'); setAmount('1200'); setProducts({ pratyeksha: client.config?.products?.pratyeksha !== false, feedbackSuite: client.config?.products?.feedbackSuite === true, whatsappCampaigns: client.config?.products?.whatsappCampaigns === true }); setFeedbackAdminEmail(client.config?.feedbackAdmin?.email || ''); setFeedbackAdminPassword(''); setCampaignStudioPassword(''); setPaidAt(todayIST()); setMethod('UPI'); setNote(''); setFormErr(''); setBusy(false); } }, [client]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!client) return null;
  const submit = async () => {
    // Every failed check used to just `return` with no message, so the button looked dead; fractional / huge month counts also went through.
    const m = Number(months), amt = Number(amount);
    if (!products.pratyeksha && !products.feedbackSuite) { setFormErr('Select at least one product.'); return; }
    if (!Number.isInteger(m) || m < 1 || m > 120) { setFormErr('Plan duration must be a whole number of months between 1 and 120.'); return; }
    if (String(amount).trim() === '' || !Number.isFinite(amt) || amt < 0) { setFormErr('Enter the amount received (0 or more).'); return; }
    if (paidAt && paidAt > todayIST()) { setFormErr('Payment date cannot be in the future.'); return; }
    if (products.feedbackSuite && !String(feedbackAdminEmail).trim()) { setFormErr('Feedback admin email is required.'); return; }
    if (products.feedbackSuite && !client.config?.feedbackAdmin?.passwordConfigured && feedbackAdminPassword.length < 10) { setFormErr('Feedback admin password must be at least 10 characters.'); return; }
    if (products.feedbackSuite && feedbackAdminPassword && feedbackAdminPassword.length < 10) { setFormErr('Feedback admin password must be at least 10 characters.'); return; }
    if (products.whatsappCampaigns && !client.config?.feedbackAdmin?.campaignPasswordConfigured && campaignStudioPassword.length < 10) { setFormErr('Campaign Studio password must be at least 10 characters.'); return; }
    setFormErr(''); setBusy(true);
    try { await onSubmit(m, amt, products, { feedbackAdminEmail: String(feedbackAdminEmail).trim(), feedbackAdminPassword, campaignStudioPassword }, { paidAt, paymentMethod: method, paymentNote: note }); }
    finally { setBusy(false); }
  };
  return (
    <ModalShell title={`Renew — ${client.name}`} icon={RotateCcw} onClose={onClose} width={380}>
      <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
        <LabeledInput label="Plan Duration (months)">
          <input className="p-inp" style={inp} type="number" value={months} onChange={e => setMonths(e.target.value)} autoFocus />
        </LabeledInput>
        <LabeledInput label="Amount Received (₹)">
          <input className="p-inp" style={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        </LabeledInput>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LabeledInput label="Payment Date">
            <input className="p-inp" style={inp} type="date" max={todayIST()} value={paidAt} onChange={e => setPaidAt(e.target.value)} />
          </LabeledInput>
          <LabeledInput label="Method">
            <select className="p-inp" style={{ ...inp, cursor: 'pointer' }} value={method} onChange={e => setMethod(e.target.value)}>{PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select>
          </LabeledInput>
        </div>
        <LabeledInput label="Note (optional)">
          <input className="p-inp" style={inp} maxLength={300} placeholder="e.g. GPay ref / discount given" value={note} onChange={e => setNote(e.target.value)} />
        </LabeledInput>
        {(() => {
          const sub = subOf(client); const m = Math.round(Number(months));
          if (!Number.isFinite(m) || m < 1 || m > 120) return null;
          const base = sub.planExpiry && new Date(sub.planExpiry) > new Date() ? new Date(sub.planExpiry) : new Date();
          return <div style={{ fontSize: 12, color: C.textMid, padding: '9px 12px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgCard }}>
            Current expiry <b style={{ color: C.text }}>{fmtDay(sub.planExpiry)}</b> → new expiry <b style={{ color: '#d3bfa2' }}>{fmtDay(addMonthsClamped(base, m))}</b>
          </div>;
        })()}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 9, padding: 12, border: `1px solid ${C.border}`, borderRadius: 9 }}>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Products included</div>
          {[['pratyeksha','PRATYEKSHa Restaurant Suite'],['feedbackSuite','Feedback Suite'],['whatsappCampaigns','WhatsApp Offer Campaigns']].map(([key,label]) => (
            <label key={key} style={{ display:'flex', alignItems:'center', gap:9, color:C.text, fontSize:12, cursor:'pointer' }}>
              <input type="checkbox" checked={!!products[key]} disabled={key==='whatsappCampaigns' && !products.feedbackSuite} onChange={e=>setProducts(prev=>({ ...prev, [key]:e.target.checked, ...(key==='feedbackSuite' && !e.target.checked ? {whatsappCampaigns:false} : {}) }))} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {products.feedbackSuite && <div style={{ display:'grid', gap:10, padding:12, border:`1px solid ${C.border}`, borderRadius:9 }}>
          <LabeledInput label="Feedback Admin Email" required>
            <input className="p-inp" style={inp} type="email" value={feedbackAdminEmail} onChange={e=>setFeedbackAdminEmail(e.target.value)} required />
          </LabeledInput>
          <LabeledInput label={client.config?.feedbackAdmin?.passwordConfigured ? 'Change Feedback Password (optional)' : 'Feedback Admin Password'} required={!client.config?.feedbackAdmin?.passwordConfigured} hint="At least 10 characters">
            <input className="p-inp" style={inp} type="password" minLength={10} value={feedbackAdminPassword} onChange={e=>setFeedbackAdminPassword(e.target.value)} required={!client.config?.feedbackAdmin?.passwordConfigured} />
          </LabeledInput>
          {products.whatsappCampaigns && <LabeledInput label={client.config?.feedbackAdmin?.campaignPasswordConfigured ? 'Change Campaign Password (optional)' : 'Campaign Studio Password'} required={!client.config?.feedbackAdmin?.campaignPasswordConfigured} hint="At least 10 characters; separate from admin password">
            <input className="p-inp" style={inp} type="password" minLength={10} value={campaignStudioPassword} onChange={e=>setCampaignStudioPassword(e.target.value)} required={!client.config?.feedbackAdmin?.campaignPasswordConfigured} />
          </LabeledInput>}
        </div>}
      </div>
      {formErr && <div style={{ fontSize: 12, color: C.danger, marginBottom: 12 }}>{formErr}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={submit} disabled={busy || !months || !amount || (!products.pratyeksha && !products.feedbackSuite)} style={{
          flex: 1, padding: '11px', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: '#d3bfa2', color: '#0f0f11', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: busy ? 0.6 : 1
        }}>{busy ? 'Renewing…' : 'Confirm Renewal'}</button>
        <button type="button" onClick={onClose} disabled={busy} style={{ flex: 1, padding: '11px', borderRadius: 9, background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
      </div>
    </ModalShell>
  );
};

/* Per-client subscription card: dates, state, payment history and the controls to change them. */
const SubscriptionModal = ({ client, onClose, onChanged, onRenew, onToggle, flash }) => {
  const [data, setData] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [expiry, setExpiry] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/admin/master/subscription/${client._id}`);
      setData(r.data); setLoadErr('');
      setExpiry(r.data.planExpiry ? new Date(new Date(r.data.planExpiry).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10) : '');
    } catch (e) { setLoadErr(e?.response?.data?.error || 'Could not load the subscription'); }
  }, [client._id]);
  useEffect(() => { load(); }, [load]);

  const save = async (value, successMsg) => {
    setBusy(true);
    try {
      await axios.patch(`${API_BASE_URL}/admin/master/subscription/${client._id}/expiry`, { planExpiry: value, note });
      flash(successMsg); setNote(''); await load(); await onChanged();
    } catch (e) { flash(e?.response?.data?.error || 'Could not update the expiry', 'error'); }
    finally { setBusy(false); }
  };
  const meta = STATE_META[data?.state] || STATE_META.active;
  const cell = (label, value, sub) => (
    <div style={{ padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgCard }}>
      <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
  return (
    <ModalShell title={`Subscription — ${client.name}`} icon={Wallet} onClose={onClose} width={560}>
      {loadErr && <div style={{ color: C.danger, fontSize: 12.5, marginBottom: 12 }}>{loadErr}</div>}
      {!data && !loadErr && <div style={{ color: C.textDim, fontSize: 12.5 }}>Loading…</div>}
      {data && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 7, background: `${meta.color}14`, color: meta.color, border: `1px solid ${meta.color}40` }}>{meta.label}</span>
            <span style={{ fontSize: 12, color: C.textDim }}>
              {data.state === 'expired' ? 'Apps are locked for this client until it is renewed.' : data.state === 'disabled' ? 'Switched off by you; apps are locked.' : data.state === 'unset' ? 'No expiry on record — access is not limited. Set an expiry below.' : 'Apps are running normally.'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {cell('Subscribed since', fmtDay(data.startedAt))}
            {cell('Last payment', data.lastPaymentAt ? fmtDay(data.lastPaymentAt) : 'No date on record', data.lastPaymentAt ? `₹${Number(data.lastPaymentAmount || 0).toLocaleString('en-IN')} · ${data.lastPaymentMonths || 0} mo` : null)}
            {cell('Expires', fmtDay(data.planExpiry), data.planExpiry ? (data.daysLeft > 0 ? `${data.daysLeft} day${data.daysLeft === 1 ? '' : 's'} left` : 'Expired') : null)}
            {cell('Total received', `₹${Number(data.totalPaidAmount || 0).toLocaleString('en-IN')}`)}
          </div>

          <div style={{ padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Set expiry date</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10 }}>
              <input className="p-inp" style={inp} type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
              <input className="p-inp" style={inp} maxLength={300} placeholder="Reason (optional)" value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" disabled={busy || !expiry} onClick={() => save(expiry, 'Expiry updated')} style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: '#d3bfa2', color: '#0f0f11', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', opacity: busy || !expiry ? 0.6 : 1 }}>Save expiry</button>
              <button type="button" disabled={busy} onClick={() => { if (window.confirm(`Expire ${client.name} at the end of today (India time)? Their apps will lock at midnight unless you renew.`)) save(todayIST(), 'Plan will expire at the end of today (India time)'); }} style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.borderMid}`, background: 'transparent', color: C.textMid, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Expire today</button>
              <span style={{ fontSize: 11, color: C.textDim, alignSelf: 'center' }}>A date means the end of that day (India time).</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={onRenew} style={{ flex: 1, minWidth: 140, padding: '10px', borderRadius: 9, border: 'none', background: '#d3bfa2', color: '#0f0f11', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><RotateCcw size={14} /> Record payment / renew</button>
            <button type="button" onClick={onToggle} style={{ flex: 1, minWidth: 140, padding: '10px', borderRadius: 9, border: `1px solid ${C.borderMid}`, background: 'transparent', color: data.isActive ? C.danger : '#d3bfa2', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Power size={14} /> {data.isActive ? 'Disable client' : 'Enable client'}</button>
          </div>

          <div>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Payment & expiry history</div>
            {data.payments?.length ? (
              <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {data.payments.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '9px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgCard }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>
                        {p.kind === 'onboard' ? 'Onboarding' : p.kind === 'manual-expiry' ? 'Expiry changed' : 'Renewal'}
                        {p.kind !== 'manual-expiry' && <span style={{ color: C.textDim, fontWeight: 500 }}> · {p.months} mo{p.method ? ` · ${p.method}` : ''}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                        {p.kind !== 'manual-expiry' ? `Paid ${fmtDay(p.paidAt || p.at)} · ` : `${fmtDay(p.at)} · `}{p.expiryBefore ? `${fmtDay(p.expiryBefore)} → ` : ''}{fmtDay(p.expiryAfter)}
                      </div>
                      {p.note ? <div style={{ fontSize: 11, color: C.textMid, marginTop: 2, wordBreak: 'break-word' }}>{p.note}</div> : null}
                    </div>
                    {p.kind !== 'manual-expiry' && <div style={{ fontSize: 13, fontWeight: 700, color: '#8a704d', fontFamily: 'JetBrains Mono, monospace' }}>₹{Number(p.amount || 0).toLocaleString('en-IN')}</div>}
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12, color: C.textDim }}>No payments recorded yet. Payments made from now on are saved here with their date.</div>}
          </div>
        </div>
      )}
    </ModalShell>
  );
};

/* ── JSON menu import ── */
/** One dropzone that parses a single JSON file into an array under `arrayKey` (e.g. "categories"). */
const SingleJsonDropzone = ({ label, arrayKey, hint, onParsed, accentDanger }) => {
  const [file, setFile] = useState(null);
  const [count, setCount] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setError(''); setCount(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const arr = Array.isArray(json) ? json : Array.isArray(json[arrayKey]) ? json[arrayKey] : null;
        if (!arr) { setError(`No array found (expected either a bare [...] array, or {"${arrayKey}": [...]})`); onParsed(null); return; }
        // Catch the two files being dropped into the wrong slots: dishes carry a price, categories never do.
        if (arr.some(x => !x || typeof x !== 'object' || Array.isArray(x))) { setError('Every entry must be an object ({...}).'); onParsed(null); return; }
        if (arr.length > 0 && arrayKey === 'categories' && arr.every(x => 'price' in x)) { setError('This looks like a menu items file (entries have a price). Drop it in the Menu Items box.'); onParsed(null); return; }
        if (arr.length > 0 && arrayKey === 'menuItems' && arr.every(x => !('price' in x))) { setError('This looks like a categories file (no prices). Drop it in the Categories box.'); onParsed(null); return; }
        setCount(arr.length);
        onParsed(arr);
      } catch (err) { setError('Not valid JSON.'); onParsed(null); }
    };
    reader.readAsText(f);
  };

  const clear = () => { setFile(null); setCount(null); setError(''); onParsed(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      <div
        className={`p-dropzone${dragging ? ' drag' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; /* re-picking the same (corrected) file did not fire onChange */ }} />
        <Upload size={17} color={file ? '#d3bfa2' : C.textDim} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: file ? C.text : C.textMid, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file ? file.name : `Click or drop ${label.toLowerCase()} JSON`}</div>
          <div style={{ fontSize: 10.5, color: error ? C.danger : C.textFaint, marginTop: 2 }}>{error || hint}</div>
        </div>
        {count !== null && !error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#d3bfa2', fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>
            <button type="button" onClick={e => { e.stopPropagation(); clear(); }} style={{ background: 'transparent', border: 'none', color: C.textDim, cursor: 'pointer', display: 'flex' }}><X size={13} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

/** Two independent JSON uploads — categories and menu items are separate files, as requested. */
const DualJsonUpload = ({ onChange }) => {
  const [categories, setCategoriesArr] = useState(null);
  const [menuItems, setMenuItemsArr] = useState(null);
  const update = (cats, items) => onChange({ categories: cats, menuItems: items });
  return (
    <div>
      <SingleJsonDropzone
        label="Categories JSON" arrayKey="categories" hint="e.g. Starters, Main Course, Desserts…"
        onParsed={(arr) => { setCategoriesArr(arr); update(arr, menuItems); }}
      />
      <SingleJsonDropzone
        label="Menu Items JSON" arrayKey="menuItems" hint="Each item needs categoryId, name, price"
        onParsed={(arr) => { setMenuItemsArr(arr); update(categories, arr); }}
      />
    </div>
  );
};

const ImportMenuModal = ({ target, onClose, onDone, flash }) => {
  const [pending, setPending] = useState({ categories: null, menuItems: null });
  const [mode, setMode] = useState('append');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  if (!target) return null;

  const downloadTemplate = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/master/menu-template`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pratyeksha-menu-template.json'; a.click();
    } catch (e) { flash('Could not download template', 'error'); }
  };

  const hasContent = (pending.categories?.length > 0) || (pending.menuItems?.length > 0);
  const canImport = hasContent;

  const runImport = async () => {
    if (!canImport) return;
    if (mode === 'replace' && !window.confirm(`Replace the menu for ${target.tenantName}?\n\nDishes that are not in the uploaded file will be removed (dishes that are in it keep their recipes). This cannot be undone.`)) return;
    setImporting(true); setError('');
    try {
      const res = await axios.post(`${BASE_URL}/admin/master/import-menu/${encodeURIComponent(target.tenantId)}?mode=${encodeURIComponent(mode)}`, {
        categories: pending.categories || [], menuItems: pending.menuItems || []
      });
      setResult(res.data);
      flash(`Imported ${res.data.counts.categories} categories, ${res.data.counts.menuItems} items for ${target.tenantName}`);
      onDone && onDone();
    } catch (err) {
      const details = err?.response?.data?.details;
      setError(details ? details.join('\n') : (err?.response?.data?.error || 'Import failed'));
    } finally { setImporting(false); }
  };

  return (
    <ModalShell title={`Import Menu — ${target.tenantName}`} icon={FileJson} onClose={onClose} width={460}>
      {result ? (
        <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <CheckCircle2 size={22} color="#d3bfa2" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Import complete</div>
          <div style={{ fontSize: 12.5, color: C.textMid, marginBottom: 20 }}>
            {result.counts.categories} categories &middot; {result.counts.menuItems} menu items written ({mode})
          </div>
          <button type="button" onClick={onClose} style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: '#d3bfa2', color: '#0f0f11', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Done</button>
        </div>
      ) : (
        <>
          <DualJsonUpload onChange={setPending} />

          {error && (
            <div style={{ background: 'rgba(226,154,88,0.06)', border: '1px solid rgba(226,154,88,0.2)', borderRadius: 9, padding: '10px 12px', marginBottom: 14, fontSize: 11.5, color: C.danger, whiteSpace: 'pre-wrap', maxHeight: 140, overflowY: 'auto' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Import Mode</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setMode('append')} style={{
                flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: mode === 'append' ? 'rgba(211,191,162,0.1)' : 'transparent',
                border: `1px solid ${mode === 'append' ? 'rgba(211,191,162,0.4)' : C.border}`,
                color: mode === 'append' ? '#d3bfa2' : C.textDim
              }}>Append / Update</button>
              <button type="button" onClick={() => setMode('replace')} style={{
                flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: mode === 'replace' ? 'rgba(226,154,88,0.1)' : 'transparent',
                border: `1px solid ${mode === 'replace' ? 'rgba(226,154,88,0.4)' : C.border}`,
                color: mode === 'replace' ? C.danger : C.textDim
              }}>Replace Entire Menu</button>
            </div>
            {mode === 'replace' && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 8, fontSize: 11, color: C.danger }}>
                <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} /> Dishes that are not in the uploaded files are removed (dishes in the file keep their recipes). Cannot be undone.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button type="button" onClick={runImport} disabled={!canImport || importing} className="p-btn-shimmer" style={{
              flex: 1, padding: '11px', borderRadius: 9, border: 'none', cursor: (!canImport || importing) ? 'not-allowed' : 'pointer',
              background: (!canImport || importing) ? C.bgCard2 : '#d3bfa2', color: (!canImport || importing) ? C.textDim : '#0f0f11',
              fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
            }}>{importing ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Importing…</> : <><Upload size={14} /> Import</>}</button>
            <button type="button" onClick={onClose} disabled={importing} style={{ flex: 1, padding: '11px', borderRadius: 9, background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
          <button type="button" onClick={downloadTemplate} style={{ width: '100%', padding: '9px', background: 'transparent', border: 'none', color: C.textDim, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <FileDown size={12} /> Download example template
          </button>
        </>
      )}
    </ModalShell>
  );
};

/** Serious destructive-action modal — requires typing the exact tenant ID to proceed. */
const DeleteTenantModal = ({ client, onClose, onConfirm }) => {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  if (!client) return null;
  const matches = typed === client.tenantId;
  const run = async () => { if (!matches) return; setBusy(true); try { await onConfirm(typed); } finally { setBusy(false); } };
  return (
    <ModalShell title="Delete Client — Permanent" icon={Trash2} onClose={onClose} width={420}>
      <div style={{ background: 'rgba(226,154,88,0.06)', border: '1px solid rgba(226,154,88,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10 }}>
        <AlertTriangle size={16} color={C.danger} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>
          This permanently deletes <b style={{ color: C.text }}>{client.name}</b> and every record tied to it — orders, menu, inventory, staff, customers, everything. There is no undo.
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: 8 }}>
        Type <span style={{ fontFamily: 'JetBrains Mono, monospace', color: C.text, background: C.bgDark, padding: '1px 6px', borderRadius: 4 }}>{client.tenantId}</span> to confirm:
      </div>
      <input className="p-inp" style={{ ...inp, marginBottom: 18 }} value={typed} onChange={e => setTyped(e.target.value)} placeholder={client.tenantId} autoFocus autoCapitalize="none" autoCorrect="off" spellCheck="false" />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={run} disabled={!matches || busy} style={{
          flex: 1, padding: '11px', borderRadius: 9, border: 'none', cursor: (!matches || busy) ? 'not-allowed' : 'pointer',
          background: matches ? C.danger : C.bgCard2, color: matches ? '#fff' : C.textDim, fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
        }}>{busy ? 'Deleting…' : 'Delete Permanently'}</button>
        <button type="button" onClick={onClose} disabled={busy} style={{ flex: 1, padding: '11px', borderRadius: 9, background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
      </div>
    </ModalShell>
  );
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
/* ─────────────────────────────────────────
   LOADING SKELETON — mirrors the real shell (floating sidebar, revenue card, nav, client list) and the Demo Requests
   screen it opens on, so nothing jumps when data arrives. Self-contained CSS: the global admin stylesheet is only
   injected after first paint. One gold-tinted sweep, staggered; disabled for prefers-reduced-motion.
───────────────────────────────────────── */
const PKS_CSS = `
.pks{position:relative;overflow:hidden;background:rgba(255,255,255,0.055);border-radius:6px;flex-shrink:0}
.pks::after{content:'';position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(100deg,transparent 15%,rgba(211,191,162,0.10) 50%,transparent 85%);
  animation:pks-sweep 1.8s cubic-bezier(.45,0,.25,1) infinite;animation-delay:var(--pks-d,0s)}
@keyframes pks-sweep{to{transform:translateX(100%)}}
.pks-root{position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;overflow:hidden;box-sizing:border-box;
  background:radial-gradient(1100px 520px at 12% -8%, rgba(211,191,162,0.09), transparent 62%), radial-gradient(900px 480px at 100% 105%, rgba(211,191,162,0.05), transparent 60%), #141416}
.pks-root *,.pks-root *::before,.pks-root *::after{box-sizing:border-box}
.pks-side{width:256px;min-width:256px;height:calc(100vh - 24px);margin:12px 0 12px 12px;padding:22px 14px;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden;
  background:linear-gradient(180deg, rgba(34,34,38,0.92), rgba(22,22,25,0.96));border:1px solid rgba(211,191,162,0.16);border-radius:24px;
  box-shadow:0 24px 60px -24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)}
.pks-top{display:none;position:fixed;top:0;left:0;right:0;height:50px;background:#101012;border-bottom:1px solid #313137;align-items:center;justify-content:space-between;padding:0 14px;z-index:5}
.pks-main{flex:1;min-width:0;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.pks-hdr{padding:20px 32px 14px;background:#101012;border-bottom:1px solid #2e2e34;flex-shrink:0}
.pks-tabs{display:flex;padding:0 32px;border-bottom:1px solid #313137;background:#101012;flex-shrink:0;overflow:hidden}
.pks-list{padding:14px 32px 40px;flex:1;min-height:0;overflow:hidden}
@media (max-width:1100px){.pks-side{width:220px;min-width:220px}.pks-hdr,.pks-tabs,.pks-list{padding-left:20px;padding-right:20px}}
@media (max-width:768px){
  .pks-side{display:none}.pks-top{display:flex}.pks-main{padding-top:50px}
  .pks-hdr{padding:14px 14px 12px}.pks-tabs{padding:0 14px}.pks-list{padding:14px 14px 40px}
  .pks-hide-mob{display:none!important}.pks-search{display:none!important}
}
@media (prefers-reduced-motion:reduce){.pks::after{animation:none;opacity:0}}
`;

const Pk = ({ w, h, r = 6, style, className = '' }) => (
  <div className={`pks ${className}`.trim()} style={{ width: w, height: h, borderRadius: r, ...style }} />
);

/* One Demo Requests row: same padding / radius / rows as the real card. */
const DemoCardSkeleton = ({ index = 0 }) => (
  <div aria-hidden="true" style={{ '--pks-d': `${index * 0.1}s`, padding:'14px 16px', borderRadius:10, marginBottom:6, background:C.bgCard, border:`1px solid ${C.border}`, borderLeft:'2px solid transparent' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
      <div style={{ flex:1, minWidth:0, marginRight:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
          <Pk w={104 + ((index * 23) % 64)} h={14} r={4} />
          <Pk w={58} h={19} r={6} />
        </div>
        <Pk w={`${34 + ((index * 13) % 26)}%`} h={12} r={4} />
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
        <Pk w={64} h={26} r={7} />
        <Pk w={14} h={14} r={4} />
      </div>
    </div>
    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
      <Pk w={96} h={12} r={4} />
      <Pk className="pks-hide-mob" w={70} h={12} r={4} />
      <Pk className="pks-hide-mob" w={62} h={12} r={4} />
      <Pk w={42} h={11} r={4} style={{ marginLeft:'auto' }} />
    </div>
  </div>
);

const DemoListSkeleton = ({ count = 6 }) => (
  <div role="status" aria-label="Loading requests">
    {Array.from({ length: count }, (_, i) => <DemoCardSkeleton key={i} index={i} />)}
  </div>
);

const AdminSkeleton = () => (
  <div className="pks-root" role="status" aria-busy="true" aria-label="Loading Pratyeksha control centre">
    <style>{PKS_CSS}</style>
    <span style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(0 0 0 0)', whiteSpace:'nowrap' }}>Loading control centre…</span>

    {/* mobile top bar */}
    <div className="pks-top" aria-hidden="true">
      <Pk w={30} h={30} r={8} />
      <Pk w={72} h={28} r={8} />
      <Pk w={30} h={30} r={8} />
    </div>

    {/* sidebar */}
    <aside className="pks-side" aria-hidden="true">
      {/* brand */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28, paddingBottom:18, borderBottom:`1px solid ${C.border}` }}>
        <Pk w={58} h={34} r={9} />
        <div>
          <Pk w={86} h={13} r={4} style={{ marginBottom:6 }} />
          <Pk w={64} h={10} r={4} />
        </div>
      </div>
      {/* revenue card */}
      <div style={{ marginBottom:20, padding:14, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10 }}>
        <Pk w={112} h={10} r={4} style={{ marginBottom:8 }} />
        <Pk w={146} h={22} r={5} style={{ marginBottom:8 }} />
        <Pk w={160} h={10} r={4} style={{ marginBottom:12 }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ background:C.bgDark, padding:'7px 8px', borderRadius:7, border:`1px solid ${C.border}` }}>
              <Pk w={26} h={16} r={4} style={{ marginBottom:5 }} />
              <Pk w={42} h={10} r={4} />
            </div>
          ))}
        </div>
      </div>
      {/* navigation */}
      <Pk w={64} h={10} r={4} style={{ marginBottom:10, marginLeft:10 }} />
      <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:12, maxHeight:236, overflow:'hidden', flexShrink:0 }}>
        {[88, 72, 96, 84, 56, 62, 82, 90, 70].map((w, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 10px', borderLeft:'2px solid transparent', borderRadius:8, background: i === 0 ? 'rgba(211,191,162,0.06)' : 'transparent' }}>
            <Pk w={15} h={15} r={4} />
            <Pk w={w} h={11} r={4} style={{ '--pks-d': `${i * 0.08}s` }} />
          </div>
        ))}
      </div>
      <div style={{ height:1, background:C.border, margin:'4px 0 14px' }} />
      {/* clients */}
      <Pk w={48} h={10} r={4} style={{ marginBottom:10, marginLeft:4 }} />
      <div style={{ overflow:'hidden', minHeight:70, maxHeight:150 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, padding:'7px 8px', borderRadius:7, background:C.bgCard, border:`1px solid ${C.border}` }}>
            <Pk w={7} h={7} r={99} />
            <div style={{ flex:1 }}>
              <Pk w={`${54 + i * 12}%`} h={11} r={4} style={{ marginBottom:5 }} />
              <Pk w={`${36 + i * 8}%`} h={9} r={3} />
            </div>
          </div>
        ))}
      </div>
    </aside>

    {/* main: Demo Requests (the screen the console opens on) */}
    <main className="pks-main" aria-hidden="true">
      <div className="pks-hdr">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
          <div>
            <Pk w={92} h={10} r={4} style={{ marginBottom:8 }} />
            <Pk w={176} h={22} r={5} style={{ marginBottom:9 }} />
            <Pk w={236} h={12} r={4} />
          </div>
          <Pk className="pks-search" w={200} h={38} r={8} style={{ border:`1px solid ${C.borderMid}`, background:C.bgInput }} />
        </div>
      </div>
      <div className="pks-tabs">
        {[46, 70, 84, 54].map((w, i) => (
          <div key={i} style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:7, borderBottom:`2px solid ${i === 0 ? 'rgba(211,191,162,0.5)' : 'transparent'}` }}>
            <Pk w={w - 20} h={12} r={4} />
            <Pk w={22} h={17} r={99} />
          </div>
        ))}
      </div>
      <div className="pks-list">
        {Array.from({ length: 7 }, (_, i) => <DemoCardSkeleton key={i} index={i} />)}
      </div>
    </main>
  </div>
);

/* Module-level on purpose: declared inside the page component it was a new component type on every render, so the whole
   sidebar remounted on every state change (each keystroke in any form). */
const NavItem = ({ id, label, icon:Icon, count, urgent, active, onNav }) => {
    const isActive = active===id;
    return (
      <button type="button" onClick={()=>onNav(id)} className="p-nav-item" style={{
        width:'100%', display:'flex', alignItems:'center', gap:9,
        padding:'9px 10px', borderRadius:8, cursor:'pointer', border:'none',
        background: isActive ? 'rgba(211,191,162,0.06)' : 'transparent',
        color: isActive ? '#d3bfa2' : C.textDim,
        fontSize:13, fontWeight: isActive ? 600 : 400,
        textAlign:'left', outline:'none',
        /* active left bar in light gold */
        borderLeft: isActive ? '2px solid #d3bfa2' : '2px solid transparent',
        transition:'all 0.12s',
      }}>
        <Icon size={15} strokeWidth={isActive ? 2 : 1.5} style={{ flexShrink:0 }} />
        <span style={{ flex:1 }}>{label}</span>
        {count !== undefined && count > 0 && (
          <span style={{
            fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:99,
            /* urgent badge: dark amber bg, light gold text */
            background: urgent ? 'rgba(138,112,77,0.15)' : C.bgCard2,
            color: urgent ? '#d3bfa2' : C.textDim,
            border: `1px solid ${urgent ? 'rgba(211,191,162,0.22)' : C.border}`,
          }}>{count}</span>
        )}
      </button>
    );
  };

export default function PratyekshaMasterAdmin() {
  useAdminGlobalStyles();
  const [activeSection, setActiveSection] = useState('demos');
  const [docsClientId, setDocsClientId] = useState(null);
  const [clients,       setClients]       = useState([]);
  const [stats,         setStats]         = useState({ totalRevenue:0, grossRevenue:0, totalExpenses:0, netRevenue:0, activeCount:0, expiredCount:0, disabledCount:0, expiringSoon:0, topClients:[], totalClients:0 });
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [clientFilter,  setClientFilter]  = useState('all');

  const [demoRequests, setDemoRequests] = useState([]);
  const [demoLoading,  setDemoLoading]  = useState(false);
  const [demoFilter,   setDemoFilter]   = useState('Pending');
  const [demoSearch,   setDemoSearch]   = useState('');
  const [selectedDemo, setSelectedDemo] = useState(null);

  const [onboarding, setOnboarding] = useState({
    name:'', businessType:'Restaurant', ownerName:'', contact:'', gstin:'',
    street:'', city:'', state:'', pincode:'', area:'', landmark:'', mapsUrl:'',
    tableCount:'12', taxPercentage:'5',
    username:'', password:'', confirmPassword:'',
    planMonths:'12', paidAmount:'', paidAt:'', paymentMethod:'UPI', googleReview:'', instaId:'', products:{ pratyeksha:true, feedbackSuite:false, whatsappCampaigns:false }, feedbackAdminEmail:'', feedbackAdminPassword:'', campaignStudioPassword:''
  });
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(null);
  const [onboardError,   setOnboardError]   = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [copied,         setCopied]         = useState('');
  const [onboardCategories, setOnboardCategories] = useState(null); // parsed array | null
  const [onboardMenuItems,  setOnboardMenuItems]  = useState(null);
  const [onboardUploadKey, setOnboardUploadKey] = useState(0); // remounts the dropzones, which keep their own "file loaded" state

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const flash = useCallback((msg, tone = 'success') => {
    setToast({ msg, tone });
    // Each toast used to schedule its own clear, so an older timer wiped a newer message (an error could vanish instantly).
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);
  const [confirmModal, setConfirmModal] = useState(null);
  const [renewClient,  setRenewClient]  = useState(null);
  const [planClient,   setPlanClient]   = useState(null);
  const [importTarget, setImportTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [notifications,     setNotifications]     = useState([]);
  const [notifLoading,      setNotifLoading]       = useState(false);
  const [notifCompose,      setNotifCompose]      = useState({
    target: 'single', tenantId: '', title: '', message: '',
    audience: ['owner', 'operator'], severity: 'info', sendMode: 'now', scheduledAt: ''
  });
  const [notifSending, setNotifSending] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'domain', label: '', amount: '', date: new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10),
    recurring: false, recurringInterval: 'monthly', vendor: '', notes: ''
  });
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const now = new Date();

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/master/tenants`),
        axios.get(`${BASE_URL}/admin/master/analytics`),
      ]);
      setClients(cRes.data || []);
      setStats(sRes.data || {});
    } catch(e){ console.error(e); flash(e?.response?.data?.error || 'Could not load clients. Check the connection and refresh.', 'error'); }
    finally{ setLoading(false); }
  }, [flash]);

  const fetchDemos = useCallback(async () => {
    setDemoLoading(true);
    try {
      const r = await axios.get(`${BASE_URL}/admin/master/demo-requests`);
      setDemoRequests(r.data || []);
    } catch(e){ console.error(e); }
    finally{ setDemoLoading(false); }
  }, []);

  useEffect(() => { fetchData(); fetchDemos(); fetchNotifications(); fetchExpenses(); }, []);
  // selectedDemo is a copy taken when the row was clicked: after a refresh the drawer kept showing the old status / details.
  useEffect(() => {
    setSelectedDemo(cur => {
      if (!cur) return cur;
      const fresh = demoRequests.find(r => r._id === cur._id);
      return fresh && fresh !== cur ? fresh : cur;
    });
  }, [demoRequests]);

  /* ── helpers ── */
  const getClientStatus = (c) => STATE_META[subOf(c).state] || STATE_META.active;

  const getDaysLeft = (c) => {
    const exp = c.config?.planExpiry;
    if (!exp) return null;
    return Math.ceil((new Date(exp) - now) / (1000*60*60*24));
  };

  const submitRenew = async (client, months, amount, products, credentials, payment = {}) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/renew-subscription/${client._id}`, { planMonths: months, paidAmount: amount, products, ...credentials, ...payment });
      await fetchData();
      setRenewClient(null);
      flash(`${client.name} renewed for ${months} month${months === 1 ? '' : 's'}`);
    } catch (err) { flash(err?.response?.data?.error || 'Renewal failed.', 'error'); }
  };

  const submitToggle = async (client) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/toggle-tenant/${client._id}`);
      await fetchData();
      setConfirmModal(null);
      flash(`${client.name} ${client.isActive ? 'disabled' : 'enabled'}`);
    } catch (err) { setConfirmModal(null); flash(err?.response?.data?.error || 'Action failed.', 'error'); await fetchData(); }
  };

  const handleRenew = (client) => setRenewClient(client);

  const handleToggle = (client) => {
    if (!client.isActive && subOf(client).state === 'expired') { setRenewClient(client); flash('Subscription expired — renew (or set a new expiry) to switch this client back on', 'error'); return; }
    setConfirmModal({
    title: client.isActive ? 'Disable Client' : 'Enable Client',
    icon: Power, tone: client.isActive ? 'danger' : 'default',
    message: `${client.isActive ? 'Disable' : 'Enable'} account access for "${client.name}"? ${client.isActive ? 'Their staff and customers will lose access immediately.' : ''}`,
    confirmLabel: client.isActive ? 'Disable' : 'Enable',
    onConfirm: () => submitToggle(client),
    });
  };

  const markDone = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/demo-requests/${id}`);
      setDemoRequests(p => p.map(r => r._id===id ? {...r, status:'Demo Given'} : r));
      if (selectedDemo?._id===id) setSelectedDemo(p => ({...p, status:'Demo Given'}));
    } catch(e){ console.error(e); flash(e?.response?.data?.error || 'Could not update the request. Try again.', 'error'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/demo-requests/${id}`, { status });
      setDemoRequests(p => p.map(r => r._id===id ? {...r, status} : r));
      if (selectedDemo?._id===id) setSelectedDemo(p => ({...p, status}));
    } catch(e){ console.error(e); flash(e?.response?.data?.error || 'Could not update the status. Try again.', 'error'); }
  };

  const navTo = (sec) => { setActiveSection(sec); setSidebarOpen(false); setSelectedDemo(null); };
  const refresh = () => { fetchData(); fetchDemos(); };

  const copyTimerRef = useRef(null);
  const copyText = (text, key) => {
    // navigator.clipboard is undefined on plain-http pages and some older browsers: the bare call threw and copied nothing.
    const fallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      } catch { flash('Copy failed — select and copy it manually', 'error'); }
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(fallback); else fallback();
    setCopied(key);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(()=>setCopied(''), 2000);
  };

  /* ── onboard ── */
  const handleOnboard = async () => {
    if (onboardLoading) return; // a double-click could submit twice
    if (!String(onboarding.name || '').trim() || !String(onboarding.username || '').trim() || !onboarding.password) {
      setOnboardError('Restaurant name, username and password are required.'); return;
    }
    // A blank field is Number('') === 0: the tenant would be created billing 0% GST (or with no tables).
    const taxNum = Number(onboarding.taxPercentage), tablesNum = Number(onboarding.tableCount);
    if (String(onboarding.taxPercentage).trim() === '' || !Number.isFinite(taxNum) || taxNum < 0 || taxNum > 40) {
      setOnboardError('Enter a GST percentage between 0 and 40.'); return;
    }
    if (String(onboarding.tableCount).trim() === '' || !Number.isInteger(tablesNum) || tablesNum < 1) {
      setOnboardError('Number of tables must be a whole number of at least 1.'); return;
    }
    if (String(onboarding.username).trim().length < 3) { setOnboardError('Username must be at least 3 characters.'); return; }
    if (String(onboarding.pincode || '').trim() && !/^\d{6}$/.test(String(onboarding.pincode).trim())) { setOnboardError('Pincode must be 6 digits.'); return; }
    if (String(onboarding.contact || '').trim() && String(onboarding.contact).replace(/\D/g, '').length < 10) { setOnboardError('Contact number must have at least 10 digits.'); return; }
    if (String(onboarding.mapsUrl || '').trim() && !/^https?:\/\//i.test(String(onboarding.mapsUrl).trim())) { setOnboardError('Google Maps link must start with http:// or https://'); return; }
    const paidNum = Number(onboarding.paidAmount);
    if (String(onboarding.paidAmount).trim() !== '' && (!Number.isFinite(paidNum) || paidNum < 0)) { setOnboardError('Amount received must be 0 or more.'); return; }
    if (onboarding.paidAt && onboarding.paidAt > todayIST()) { setOnboardError('Payment date cannot be in the future.'); return; }
    if (onboarding.password !== onboarding.confirmPassword) {
      setOnboardError('Passwords do not match.'); return;
    }
    if (onboarding.password.length < 6) {
      setOnboardError('Password must be at least 6 characters.'); return;
    }
    if (onboarding.products?.feedbackSuite) {
      if (!String(onboarding.feedbackAdminEmail || '').trim()) { setOnboardError('Feedback admin email is required for the Feedback Suite.'); return; }
      if ((onboarding.feedbackAdminPassword || '').length < 10) { setOnboardError('Feedback admin password must be at least 10 characters.'); return; }
      if (onboarding.products?.whatsappCampaigns && (onboarding.campaignStudioPassword || '').length < 10) { setOnboardError('Campaign Studio password must be at least 10 characters.'); return; }
    }
    if (!onboarding.products?.pratyeksha && !onboarding.products?.feedbackSuite) { setOnboardError('Select at least one product.'); return; }
    setOnboardLoading(true); setOnboardError('');
    try {
      // Trim the text fields (a trailing space in the name/username/city was stored as typed) and don't send confirmPassword.
      const { confirmPassword: _omit, ...rest } = onboarding;
      const trimmed = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, (typeof v === 'string' && !/password/i.test(k)) ? v.trim() : v]));
      const res = await axios.post(`${BASE_URL}/admin/master/onboard`, {
        ...trimmed,
        tableCount:Number(onboarding.tableCount),
        taxPercentage:Number(onboarding.taxPercentage),
        planMonths:Number(onboarding.planMonths),
        paidAmount:Number(onboarding.paidAmount),
        products:onboarding.products,
        feedbackAdminEmail:onboarding.feedbackAdminEmail,
        feedbackAdminPassword:onboarding.feedbackAdminPassword,
        campaignStudioPassword:onboarding.campaignStudioPassword,
        categories: onboardCategories || undefined,
        menuItems: onboardMenuItems || undefined,
      });
      setOnboardSuccess({
        tenantId:res.data.tenantId, username:onboarding.username, password:onboarding.password, name:onboarding.name,
        categoriesWritten: res.data.categoriesWritten, menuItemsWritten: res.data.menuItemsWritten
      });
      setOnboarding({ name:'', businessType:'Restaurant', ownerName:'', contact:'', gstin:'', street:'', city:'', state:'', pincode:'', area:'', landmark:'', mapsUrl:'', tableCount:'12', taxPercentage:'5', username:'', password:'', confirmPassword:'', planMonths:'12', paidAmount:'', paidAt:'', paymentMethod:'UPI', googleReview:'', instaId:'', products:{ pratyeksha:true, feedbackSuite:false, whatsappCampaigns:false }, feedbackAdminEmail:'', feedbackAdminPassword:'', campaignStudioPassword:'' });
      setOnboardCategories(null); setOnboardMenuItems(null);
      setOnboardUploadKey(k => k + 1); // the dropzones kept showing the previous client's files as loaded
      fetchData();
    } catch(err) {
      setOnboardError(err.response?.data?.error || 'Onboarding failed.');
    } finally{ setOnboardLoading(false); }
  };

  const runDeleteTenant = async (client, confirmText) => {
    // A failed delete (wrong confirm text, server error) used to be an unhandled rejection with no message at all.
    try {
      const res = await axios.delete(`${BASE_URL}/admin/master/tenant/${client.tenantId}`, { data: { confirm: confirmText } });
      await fetchData();
      setDeleteTarget(null);
      // Built after the delete succeeded: a missing field here threw into the catch and reported "Could not delete" for a client that was gone.
      const removed = Number(res?.data?.totalDocumentsDeleted) || 0;
      const colls = Object.keys(res?.data?.collections || {}).length;
      flash(`${client.name} deleted${removed ? ` — ${removed} records removed${colls ? ` across ${colls} collections` : ''}` : ''}`);
    } catch (e) {
      flash(e?.response?.data?.error || 'Could not delete client', 'error');
    }
  };

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const r = await axios.get(`${BASE_URL}/admin/master/notifications`);
      setNotifications(r.data || []);
    } catch (e) { console.error(e); }
    finally { setNotifLoading(false); }
  }, []);

  const sendNotification = async () => {
    if (!notifCompose.title.trim() || !notifCompose.message.trim()) { flash('Title and message are required', 'error'); return; }
    if (!Array.isArray(notifCompose.audience) || notifCompose.audience.length === 0) { flash('Choose who should receive it (owner and/or operator)', 'error'); return; }
    let tenantIds;
    if (notifCompose.target === 'all') tenantIds = 'ALL';
    else if (!notifCompose.tenantId) { flash('Pick a client to notify', 'error'); return; }
    else tenantIds = notifCompose.tenantId;

    // "Schedule" with no (or an unparsable / past) time used to fall through to scheduledAt = undefined, i.e. send NOW to everyone.
    if (notifCompose.sendMode === 'schedule') {
      const when = notifCompose.scheduledAt ? new Date(notifCompose.scheduledAt) : null;
      if (!when || Number.isNaN(when.getTime())) { flash('Pick the date and time to send this', 'error'); return; }
      if (when.getTime() <= Date.now()) { flash('Scheduled time must be in the future', 'error'); return; }
    }

    // One click used to broadcast to every client immediately.
    if (notifCompose.target === 'all' && !window.confirm(notifCompose.sendMode === 'schedule' ? 'Schedule this notification for ALL clients?' : 'Send this notification to ALL clients right now?')) return;

    setNotifSending(true);
    try {
      const scheduledAt = notifCompose.sendMode === 'schedule' && notifCompose.scheduledAt
        ? new Date(notifCompose.scheduledAt).toISOString() : undefined;
      await axios.post(`${BASE_URL}/admin/master/notifications`, {
        tenantIds, title: notifCompose.title.trim(), message: notifCompose.message.trim(),
        audience: notifCompose.audience, severity: notifCompose.severity, scheduledAt
      });
      flash(scheduledAt ? 'Notification scheduled' : 'Notification sent');
      setNotifCompose(c => ({ ...c, title: '', message: '' }));
      fetchNotifications();
    } catch (e) { flash(e?.response?.data?.error || 'Could not send notification', 'error'); }
    finally { setNotifSending(false); }
  };

  const cancelNotification = async (id) => {
    try { await axios.delete(`${BASE_URL}/admin/master/notifications/${id}`); fetchNotifications(); flash('Notification cancelled'); }
    catch (e) { flash('Could not cancel', 'error'); }
  };

  const fetchExpenses = useCallback(async () => {
    setExpenseLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/master/expenses`),
        axios.get(`${BASE_URL}/admin/master/expenses/summary`)
      ]);
      setExpenses(expRes.data || []);
      setExpenseSummary(sumRes.data || null);
    } catch (e) { console.error(e); }
    finally { setExpenseLoading(false); }
  }, []);

  const resetExpenseForm = () => {
    setExpenseForm({ category: 'domain', label: '', amount: '', date: new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10), recurring: false, recurringInterval: 'monthly', vendor: '', notes: '' });
    setEditingExpenseId(null);
  };

  const submitExpense = async () => {
    if (!String(expenseForm.label).trim() || String(expenseForm.amount).trim() === '') { flash('Label and amount are required', 'error'); return; }
    const amt = Number(expenseForm.amount);
    if (!Number.isFinite(amt) || amt <= 0) { flash('Amount must be a number greater than 0', 'error'); return; }
    if (!expenseForm.date) { flash('Pick the expense date', 'error'); return; }
    setExpenseSaving(true);
    try {
      if (editingExpenseId) {
        await axios.put(`${BASE_URL}/admin/master/expenses/${editingExpenseId}`, expenseForm);
        flash('Expense updated');
      } else {
        await axios.post(`${BASE_URL}/admin/master/expenses`, expenseForm);
        flash('Expense added');
      }
      resetExpenseForm();
      fetchExpenses();
    } catch (e) { flash(e?.response?.data?.error || 'Could not save expense', 'error'); }
    finally { setExpenseSaving(false); }
  };

  const editExpense = (exp) => {
    setExpenseForm({
      category: exp.category, label: exp.label, amount: String(exp.amount),
      date: (exp.date && !Number.isNaN(new Date(exp.date).getTime()) ? new Date(exp.date).toISOString() : new Date(Date.now() + 330 * 60000).toISOString()).slice(0, 10), recurring: !!exp.recurring,
      recurringInterval: exp.recurringInterval || 'monthly', vendor: exp.vendor || '', notes: exp.notes || ''
    });
    setEditingExpenseId(exp._id);
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Remove this expense? This cannot be undone.')) return;
    try {
      await axios.delete(`${BASE_URL}/admin/master/expenses/${id}`);
      if (editingExpenseId === id) resetExpenseForm(); // otherwise the next Save PUT a record that no longer exists
      fetchExpenses(); flash('Expense removed');
    }
    catch (e) { flash('Could not remove expense', 'error'); }
  };

  /* ── derived ── */
  const stateCounts = clients.reduce((m, c) => { const st = subOf(c).state; m[st] = (m[st] || 0) + 1; return m; }, {});
  const filteredClients = clients
    .filter(c => {
      const st = subOf(c).state;
      if (clientFilter==='active')   return st === 'active' || st === 'expiring';
      if (clientFilter==='expiring') return st === 'expiring';
      if (clientFilter==='expired')  return st === 'expired';
      if (clientFilter==='disabled') return st === 'disabled';
      if (clientFilter==='unset')    return st === 'unset';
      return true;
    })
    .filter(c => {
      const q = searchTerm.trim().toLowerCase();
      return !q ||
        String(c.name ?? '').toLowerCase().includes(q) ||
        String(c.tenantId ?? '').toLowerCase().includes(q) ||
        String(c.address?.city ?? '').toLowerCase().includes(q);
    });

  const demoCounts = {
    all:          demoRequests.length,
    Pending:      demoRequests.filter(r=>r.status==='Pending').length,
    Contacted:    demoRequests.filter(r=>r.status==='Contacted').length,
    'Demo Given': demoRequests.filter(r=>r.status==='Demo Given').length,
  };

  const filteredDemos = demoRequests.filter(r => {
    const okFilter = demoFilter==='all' || r.status===demoFilter;
    const okSearch = !demoSearch ||
      r.name?.toLowerCase().includes(demoSearch.toLowerCase()) ||
      r.restaurant?.toLowerCase().includes(demoSearch.toLowerCase()) ||
      String(r.phone ?? '').includes(demoSearch.trim()) ||
      r.city?.toLowerCase().includes(demoSearch.toLowerCase());
    return okFilter && okSearch;
  });

  /* ── loader ── */
  if (loading) return <AdminSkeleton />;

  /* ── nav item ──
     active:  light gold text + left border + faint bg
     inactive: dim text
  */
  /* filter tab active style */
  const filterTab = (isActive) => ({
    padding:'10px 14px', background:'transparent', border:'none', cursor:'pointer',
    fontSize:12, fontWeight: isActive ? 600 : 400,
    color: isActive ? C.text : C.textDim,
    /* active underline in light gold */
    borderBottom: `2px solid ${isActive ? '#d3bfa2' : 'transparent'}`,
    display:'flex', alignItems:'center', gap:7,
    transition:'all 0.12s', whiteSpace:'nowrap', flexShrink:0,
  });

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div style={{ display:'flex', width:'100vw', height:'100vh', background:'radial-gradient(1100px 520px at 12% -8%, rgba(211,191,162,0.09), transparent 62%), radial-gradient(900px 480px at 100% 105%, rgba(211,191,162,0.05), transparent 60%), #141416', color:C.text, overflow:'hidden', position:'fixed', top:0, left:0 }}>

      {/* Mobile topbar */}
      <div className="p-topbar">
        <button type="button" onClick={()=>setSidebarOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:6, display:'flex', color:C.textMid }}>
          <Menu size={18} />
        </button>
        {/* brand name in light gold */}
        <span style={{ width:72, height:28, background:'#fff', borderRadius:8, padding:4, display:'inline-flex', alignItems:'center' }}><img src={BRAND_LOGO} alt="Pratyeksha" style={{ width:'100%', height:'100%', objectFit:'contain' }} /></span>
        <button type="button" onClick={refresh} style={{ background:'none', border:'none', cursor:'pointer', padding:6, display:'flex', color:C.textDim }}>
          <RefreshCcw size={15} />
        </button>
      </div>

      <div className={`p-backdrop${sidebarOpen ? ' open' : ''}`} onClick={()=>setSidebarOpen(false)} />

      {/* ════════ SIDEBAR ════════ */}
      <aside className={`p-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="p-sidebar-inner no-sb">

          {/* Brand — icon bg is light gold, text is near-white */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28, paddingBottom:18, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:58, height:34, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:5, flexShrink:0 }}>
              <img src={BRAND_LOGO} alt="Pratyeksha" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, letterSpacing:'0.3px', lineHeight:1.2 }}>Pratyeksha</div>
              <div style={{ fontSize:10, color:C.textDim, marginTop:2 }}>Control Centre</div>
            </div>
          </div>

          {/* Revenue card:
              label    → dim gray
              number   → light gold (#d3bfa2)
              sub-grid → status-colored numbers, dark bg
          */}
          <div style={{ marginBottom:20, padding:'14px', background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10 }}>
            <div style={{ fontSize:10, color:C.textDim, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:6 }}>Net Platform Revenue</div>
            <div style={{ fontSize:22, fontWeight:700, color:(stats.netRevenue ?? stats.totalRevenue ?? 0) >= 0 ? '#d3bfa2' : C.danger, lineHeight:1, marginBottom:6, fontFamily:'JetBrains Mono, monospace' }}>
              ₹{Math.abs(stats.netRevenue ?? stats.totalRevenue ?? 0).toLocaleString()}{(stats.netRevenue ?? 0) < 0 ? ' (loss)' : ''}
            </div>
            <div style={{ fontSize:10.5, color:C.textDim, marginBottom:12, display:'flex', gap:8, flexWrap:'wrap' }}><span>Gross ₹{(stats.grossRevenue ?? stats.totalRevenue ?? 0).toLocaleString()}</span><span>− Costs ₹{(stats.totalExpenses||0).toLocaleString()}</span></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {[
                { val:stats.activeCount   ||0, lbl:'Active',   c:'#d3bfa2' },   /* light gold */
                { val:stats.expiredCount  ||0, lbl:'Expired',  c:C.warning },
                { val:stats.disabledCount ||0, lbl:'Disabled', c:C.danger  },
                { val:stats.totalClients  ||0, lbl:'Total',    c:C.textMid },
              ].map(s => (
                <div key={s.lbl} style={{ background:C.bgDark, padding:'7px 8px', borderRadius:7, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:16, fontWeight:700, color:s.c, lineHeight:1, fontFamily:'JetBrains Mono, monospace' }}>{s.val}</div>
                  <div style={{ fontSize:10, color:C.textDim, marginTop:2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div style={{ fontSize:10, color:C.textFaint, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:6, paddingLeft:10, flexShrink:0 }}>Navigation</div>
          <div className="no-sb" style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:12, overflowY:'auto', minHeight:0, flex:'0 1 auto', maxHeight:236, paddingRight:2 }}>
            <NavItem active={activeSection} onNav={navTo} id="demos"     label="Demo Requests"   icon={CalendarClock} count={demoCounts.Pending} urgent />
            <NavItem active={activeSection} onNav={navTo} id="dashboard" label="Dashboard"       icon={BarChart3} />
            <NavItem active={activeSection} onNav={navTo} id="clients"   label="Client Partners" icon={Building2} count={clients.length} />
            <NavItem active={activeSection} onNav={navTo} id="onboard"   label="Onboard Client"  icon={UserPlus} />
            <NavItem active={activeSection} onNav={navTo} id="tracking" label="Tracking" icon={Radar} />
            <NavItem active={activeSection} onNav={navTo} id="crm" label="Lead CRM" icon={Users} />
            <NavItem active={activeSection} onNav={navTo} id="notifications" label="Notifications" icon={Bell} />
            <NavItem active={activeSection} onNav={navTo} id="expenses" label="Operating Costs" icon={Receipt} />
            <NavItem active={activeSection} onNav={navTo} id="documents" label="Documents" icon={FileText} />
            <NavItem active={activeSection} onNav={navTo} id="qrstudio" label="QR Studio" icon={QrCode} />
          </div>

          <Div />

          {/* Client list — scrollable and visible at the bottom of the control centre */}
          <div style={{ fontSize:10, color:C.textFaint, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, paddingLeft:4, display:'flex', alignItems:'center', gap:5 }}>
            <Trophy size={10} color={C.textFaint} /> Clients
          </div>
          <div className="no-sb" style={{ minHeight:70, maxHeight:150, overflowY:'auto', paddingRight:2, flexShrink:1 }}>
            {[...clients].sort((a,b)=>(b.totalPaidAmount||0)-(a.totalPaidAmount||0)).map(c => (
              <div key={c._id || c.tenantId} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, padding:'7px 8px', borderRadius:7, background:C.bgCard, border:`1px solid ${C.border}` }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:(STATE_META[subOf(c).state] || STATE_META.unset).color, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                  <div style={{ fontSize:11.5, fontWeight:600, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize:10, color:C.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.tenantId}</div>
                </div>
                <div style={{ fontSize:10.5, color:'#8a704d', fontWeight:700, fontFamily:'JetBrains Mono, monospace' }}>₹{(c.totalPaidAmount||0).toLocaleString()}</div>
              </div>
            ))}
            {clients.length === 0 && <div style={{ fontSize:11, color:C.textDim, padding:'12px 4px' }}>No clients yet.</div>}
          </div>
          <Div />
          <div style={{ display: 'grid', gap: 8 }}>
            <InstallButton />
            <button type="button" onClick={refresh} style={{
              width:'100%', padding:'9px', background:C.bgCard, border:`1px solid ${C.border}`,
              color:C.textDim, borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <RefreshCcw size={12} /> Refresh
            </button>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN ════════ */}
      <main className="p-main" style={{ flex:1, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', minWidth:0 }}>

        {/* ══ DEMO REQUESTS ══ */}
        {activeSection==='demos' && (
          <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
            <div className={`p-demo-list${selectedDemo ? ' has-detail' : ''}`}
              style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

              {/* Header */}
              <div className="p-header" style={{ padding:'20px 32px 14px', background:C.bgDark, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <div style={{ fontSize:10, color:C.textDim, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:4 }}>Inbound Pipeline</div>
                    <h1 style={{ fontSize:22, fontWeight:700, color:C.text, letterSpacing:'-0.3px', lineHeight:1 }}>Demo Requests</h1>
                    <div style={{ fontSize:12, color:C.textDim, marginTop:4 }}>
                      {/* pending count in light gold */}
                      <span style={{ color:'#d3bfa2', fontWeight:600 }}>{demoCounts.Pending}</span>
                      {' '}pending · {demoCounts.Contacted} contacted · {demoCounts['Demo Given']} completed
                    </div>
                  </div>
                  <div style={{ position:'relative' }}>
                    <Search size={13} color={C.textDim} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input className="p-inp" placeholder="Search requests…" value={demoSearch}
                      onChange={e=>setDemoSearch(e.target.value)}
                      style={{ ...inp, paddingLeft:34, width:200, fontSize:13 }} />
                  </div>
                </div>
              </div>

              {/* Filter tabs — active underline in light gold */}
              <div className="p-filterbar" style={{ padding:'0 32px' }}>
                {[
                  { id:'all',        label:'All',       count:demoCounts.all },
                  { id:'Pending',    label:'Pending',   count:demoCounts.Pending, urgent:true },
                  { id:'Contacted',  label:'Contacted', count:demoCounts.Contacted },
                  { id:'Demo Given', label:'Done',      count:demoCounts['Demo Given'] },
                ].map(f => (
                  <button type="button" key={f.id} onClick={()=>setDemoFilter(f.id)} style={filterTab(demoFilter===f.id)}>
                    {f.label}
                    {f.count>0 && (
                      <span style={{
                        fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:99,
                        background: demoFilter===f.id ? 'rgba(211,191,162,0.1)' : C.bgCard,
                        color: demoFilter===f.id ? '#d3bfa2' : C.textDim,
                        border: `1px solid ${demoFilter===f.id ? 'rgba(211,191,162,0.25)' : C.border}`,
                      }}>{f.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="p-scroll no-sb" style={{ padding:'14px 32px 40px' }}>
                {demoLoading ? (
                  <>
                    <style>{PKS_CSS}</style>
                    <DemoListSkeleton count={6} />
                  </>
                ) : filteredDemos.length===0 ? (
                  <div style={{ textAlign:'center', padding:'80px 0', color:C.textDim }}>
                    <CalendarClock size={28} color={C.border} style={{ marginBottom:10 }} />
                    <div style={{ fontSize:13, fontWeight:500 }}>No requests found</div>
                  </div>
                ) : filteredDemos.map(req => {
                  const isSel = selectedDemo?._id===req._id;
                  return (
                    <motion.div key={req._id} layout initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
                      className="p-demo-card"
                      onClick={()=>setSelectedDemo(isSel ? null : req)}
                      style={{
                        padding:'14px 16px', borderRadius:10, marginBottom:6,
                        background: isSel ? C.bgCard2 : C.bgCard,
                        border: `1px solid ${isSel ? 'rgba(211,191,162,0.2)' : C.border}`,
                        /* selected left accent: light gold */
                        borderLeft: `2px solid ${isSel ? '#d3bfa2' : 'transparent'}`,
                      }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div style={{ flex:1, minWidth:0, marginRight:12 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                            <span style={{ fontSize:14, fontWeight:600, color:C.text }}>{req.name}</span>
                            <StatusChip status={req.status} />
                          </div>
                          <div style={{ fontSize:12, color:C.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{req.restaurant}</div>
                        </div>
                        <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                          {req.status!=='Demo Given' && (
                            <button type="button" onClick={e=>{ e.stopPropagation(); markDone(req._id); }} style={{
                              display:'flex', alignItems:'center', gap:5, padding:'5px 10px',
                              /* Done button: dark amber outline */
                              background:'rgba(138,112,77,0.07)', border:`1px solid rgba(138,112,77,0.22)`,
                              color:'#8a704d', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
                            }}>
                              <CheckCircle2 size={11} /> Done
                            </button>
                          )}
                          <ChevronRight size={14} color={isSel ? '#d3bfa2' : C.textDim} />
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
                        {[
                          { icon:Phone,   val:req.phone, show:true },
                          { icon:MapPin,  val:req.city,  show:!!req.city,  cls:'hide-mob' },
                          { icon:Utensils,val:req.type,  show:!!req.type,  cls:'hide-mob' },
                        ].filter(r=>r.show).map((r,i) => (
                          <span key={i} className={r.cls||''} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.textDim }}>
                            <r.icon size={10} strokeWidth={1.5} /> {r.val}
                          </span>
                        ))}
                        <span style={{ marginLeft:'auto', fontSize:11, color:C.textFaint, display:'flex', alignItems:'center', gap:4 }}>
                          <Clock size={9} strokeWidth={1.5} />
                          {new Date(req.createdAt).toLocaleDateString('en-GB',{ timeZone: 'Asia/Kolkata',day:'2-digit',month:'short'})}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Detail Drawer */}
            <AnimatePresence>
              {selectedDemo && (
                <motion.div className="p-drawer"
                  initial={{ x:'100%', opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:'100%', opacity:0 }}
                  transition={{ duration:0.2, ease:'easeInOut' }}
                  style={{ width:320, background:C.bgDark, borderLeft:`1px solid ${C.border}`, height:'100%', overflow:'hidden', flexShrink:0 }}>
                  <div className="no-sb" style={{ height:'100%', overflowY:'auto', padding:'20px' }}>

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                      <div>
                        <div style={{ fontSize:10, color:C.textDim, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:5 }}>Demo Detail</div>
                        <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{selectedDemo.name}</div>
                        <div style={{ fontSize:12, color:C.textDim, marginTop:3 }}>{selectedDemo.restaurant}</div>
                      </div>
                      <button type="button" onClick={()=>setSelectedDemo(null)} style={{ background:C.bgCard, border:`1px solid ${C.border}`, color:C.textDim, padding:7, borderRadius:7, cursor:'pointer', display:'flex' }}>
                        <X size={13} />
                      </button>
                    </div>

                    {/* Status buttons:
                        Pending   → light gold when active
                        Contacted → dark amber when active
                        Done      → neutral
                    */}
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:10, color:C.textDim, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:8 }}>Update Status</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
                        {['Pending','Contacted','Demo Given'].map(s => {
                          const isActive = selectedDemo.status===s;
                          const colorMap = { 'Pending':'#d3bfa2', 'Contacted':'#8a704d', 'Demo Given':C.textMid };
                          const c = colorMap[s];
                          return (
                            <button type="button" key={s} onClick={()=>updateStatus(selectedDemo._id, s)} style={{
                              padding:'8px 4px', borderRadius:7,
                              border: `1px solid ${isActive ? c+'55' : C.border}`,
                              background: isActive ? `${c}12` : 'transparent',
                              color: isActive ? c : C.textDim,
                              fontSize:11, fontWeight: isActive ? 600 : 400, cursor:'pointer', transition:'all 0.12s',
                            }}>
                              {s==='Demo Given' ? 'Done' : s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Div />

                    {/* Contact rows */}
                    <div style={{ marginBottom:18 }}>
                      <SectionLabel>Contact</SectionLabel>
                      {[
                        { icon:Phone,  label:'Mobile', val:selectedDemo.phone, href:`tel:${selectedDemo.phone}` },
                        selectedDemo.email && { icon:Mail,   label:'Email',  val:selectedDemo.email, href:`mailto:${selectedDemo.email}` },
                        selectedDemo.city  && { icon:MapPin, label:'City',   val:selectedDemo.city },
                      ].filter(Boolean).map(row => (
                        <div key={row.label} style={{ display:'flex', gap:10, marginBottom:12 }}>
                          <div style={{ width:26, height:26, borderRadius:7, background:C.bgCard, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <row.icon size={11} color={C.textDim} strokeWidth={1.5} />
                          </div>
                          <div>
                            <div style={{ fontSize:10, color:C.textDim, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{row.label}</div>
                            {/* phone/email links in light gold */}
                            {row.href
                              ? <a href={row.href} style={{ fontSize:13, fontWeight:500, color:'#d3bfa2' }}>{row.val}</a>
                              : <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{row.val}</div>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                    <Div />

                    {/* Establishment info */}
                    <div style={{ marginBottom:18 }}>
                      <SectionLabel>Establishment</SectionLabel>
                      {[
                        { l:'Name',   v:selectedDemo.restaurant },
                        { l:'Type',   v:selectedDemo.type   || '—' },
                        { l:'Tables', v:selectedDemo.tables || '—' },
                      ].map(r => (
                        <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:12, color:C.textDim }}>{r.l}</span>
                          <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{r.v}</span>
                        </div>
                      ))}
                      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}>
                        <span style={{ fontSize:12, color:C.textDim }}>Submitted</span>
                        <span style={{ fontSize:12, color:C.textDim }}>{new Date(selectedDemo.createdAt).toLocaleDateString('en-GB',{ timeZone: 'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'})}</span>
                      </div>
                    </div>
                    <Div />

                    {/* Action buttons:
                        Call: solid light gold bg, black text
                        Onboard: dark amber outline
                        Mark Done: neutral ghost
                    */}
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      <a href={`tel:${selectedDemo.phone}`} style={{
                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        padding:'12px', background:'#d3bfa2', borderRadius:9, fontSize:13, fontWeight:600, color:'#0f0f11',
                      }}>
                        <Phone size={13} /> Call Now
                      </a>
                      <button type="button" onClick={()=>{ setOnboarding(p=>({...p,
                          name:selectedDemo.restaurant||'', contact:selectedDemo.phone||'',
                          ownerName: p.ownerName || selectedDemo.name || '', city: p.city || selectedDemo.city || '',
                          // "10-20" / "about 12" went straight into a numeric field: take the first whole number.
                          tableCount: String(parseInt(String(selectedDemo.tables ?? '').match(/\d+/)?.[0], 10) || 12)
                        })); navTo('onboard'); }} style={{
                        padding:'11px', background:'rgba(138,112,77,0.07)',
                        border:`1px solid rgba(138,112,77,0.25)`, color:'#8a704d',
                        borderRadius:9, fontSize:13, fontWeight:500, cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                      }}>
                        <UserPlus size={13} /> Onboard This Client
                      </button>
                      {selectedDemo.status!=='Demo Given' && (
                        <button type="button" onClick={()=>markDone(selectedDemo._id)} style={{
                          padding:'11px', background:C.bgCard, border:`1px solid ${C.border}`,
                          color:C.textMid, borderRadius:9, fontSize:13, fontWeight:400, cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                        }}>
                          <CheckCircle2 size={13} /> Mark Demo Done
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {activeSection==='dashboard' && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
            <div className="p-header" style={{ padding:'20px 32px 14px', background:C.bgDark, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontSize:10, color:C.textDim, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:4 }}>Overview</div>
                  <h1 style={{ fontSize:22, fontWeight:700, color:C.text, letterSpacing:'-0.3px', lineHeight:1 }}>Dashboard</h1>
                </div>
                {/* primary CTA: light gold bg */}
                <button type="button" onClick={()=>navTo('onboard')} style={{
                  display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
                  background:'#d3bfa2', color:'#0f0f11', border:'none', borderRadius:9,
                  fontSize:13, fontWeight:600, cursor:'pointer',
                }}>
                  <UserPlus size={13} /> Onboard Client
                </button>
              </div>
            </div>

            <div className="p-scroll no-sb p-pad">
              {/* KPI cards:
                  Revenue → light gold accent
                  Active  → light gold accent
                  others  → their own status color
              */}
              <div className="p-stat-grid p-stagger" style={{ marginBottom:20 }}>
                {[
                  { icon:Wallet, label:'Net Revenue', val:stats.netRevenue ?? stats.totalRevenue ?? 0, prefix:'₹', sub:`Gross ₹${(stats.grossRevenue ?? stats.totalRevenue ?? 0).toLocaleString()} − costs ₹${(stats.totalExpenses||0).toLocaleString()}`, accent:'#d3bfa2' },
                  { icon:ShieldCheck, label:'Active',        val:stats.activeCount  ||0,             sub:'Live subscriptions', accent:'#d3bfa2' },
                  { icon:AlertTriangle,label:'Expired',      val:stats.expiredCount ||0,             sub:'Need renewal',    accent:C.warning },
                  { icon:Calendar,    label:'Expiring Soon', val:stats.expiringSoon ||0,             sub:'Within 30 days',  accent:'#8a704d' },
                ].map(k => (
                  <div key={k.label} className="p-card p-card-lift" style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 16px' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${k.accent}14`, border:`1px solid ${k.accent}22`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                      <k.icon size={15} color={k.accent} strokeWidth={1.5} />
                    </div>
                    <div style={{ fontSize:11, color:C.textDim, fontWeight:500, marginBottom:4 }}>{k.label}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:k.accent, lineHeight:1, marginBottom:3, fontFamily:'JetBrains Mono, monospace' }}>{k.prefix}<CountUp value={k.val} /></div>
                    <div style={{ fontSize:11, color:C.textDim }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Net revenue strip — gross revenue minus operating costs */}
              {expenseSummary && (
                <div className="p-card p-card-lift" onClick={()=>navTo('expenses')} style={{
                  background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px',
                  marginBottom:18, cursor:'pointer', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap'
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'rgba(211,191,162,0.08)', border:'1px solid rgba(211,191,162,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Wallet size={15} color="#d3bfa2" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:C.textDim, fontWeight:500 }}>Net Revenue</div>
                      <div style={{ fontSize:18, fontWeight:700, color: expenseSummary.netRevenue>=0 ? '#d3bfa2' : C.danger, fontFamily:'JetBrains Mono, monospace' }}>
                        ₹{Math.abs(expenseSummary.netRevenue).toLocaleString()}{expenseSummary.netRevenue<0 ? ' (loss)' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:11.5, color:C.textDim, display:'flex', gap:14, flexWrap:'wrap' }}>
                    <span>Gross ₹{expenseSummary.totalRevenue.toLocaleString()}</span>
                    <span style={{ color:C.danger }}>− Costs ₹{expenseSummary.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, color:C.textDim, fontSize:11.5, fontWeight:600 }}>
                    View Operating Costs <ChevronRight size={13} />
                  </div>
                </div>
              )}

              {/* Warning banner */}
              {(stats.expiringSoon||0)>0 && (
                <div style={{ background:'rgba(138,112,77,0.05)', border:`1px solid rgba(138,112,77,0.22)`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <AlertCircle size={16} color='#8a704d' strokeWidth={1.5} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{stats.expiringSoon} subscription{stats.expiringSoon>1?'s':''} expiring within 30 days</div>
                    <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>Reach out proactively before expiry</div>
                  </div>
                  <button type="button" onClick={()=>{ setClientFilter('expiring'); navTo('clients'); }} style={{
                    padding:'6px 12px', background:'rgba(138,112,77,0.08)', border:`1px solid rgba(138,112,77,0.22)`,
                    color:'#8a704d', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer',
                  }}>View</button>
                </div>
              )}

              <div className="p-chart-grid">
                {/* Top earners chart */}
                <div className="p-card" style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                    <Trophy size={13} color={C.textDim} strokeWidth={1.5} />
                    <span style={{ fontSize:12, fontWeight:600, color:C.textMid }}>Top Revenue Clients</span>
                  </div>
                  {[...clients].sort((a,b)=>(b.totalPaidAmount||0)-(a.totalPaidAmount||0)).slice(0,6).map((c,i) => (
                    <div key={c._id} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ fontSize:11, color:C.textFaint, minWidth:14 }}>#{i+1}</span>
                          <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{c.name}</span>
                        </div>
                        {/* revenue figure: dark amber — complements the light gold bars */}
                        <span style={{ fontSize:13, fontWeight:600, color:'#8a704d', fontFamily:'JetBrains Mono, monospace' }}>₹{(c.totalPaidAmount||0).toLocaleString()}</span>
                      </div>
                      <div style={{ height:3, background:C.border, borderRadius:99, overflow:'hidden' }}>
                        {/* bar fill: light gold */}
                        <div style={{ height:'100%', borderRadius:99, background:'#d3bfa2', opacity:0.5,
                          width:`${Math.min(100,((c.totalPaidAmount||0)/Math.max(...clients.map(x => x.totalPaidAmount||0), 1))*100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subscription health */}
                <div className="p-card" style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px', display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                    <BarChart3 size={13} color={C.textDim} strokeWidth={1.5} />
                    <span style={{ fontSize:12, fontWeight:600, color:C.textMid }}>Subscription Health</span>
                  </div>
                  {[
                    { label:'Active',   val:stats.activeCount  ||0, c:'#d3bfa2', pct:((stats.activeCount  ||0)/Math.max(stats.totalClients||1,1))*100 },
                    { label:'Expired',  val:stats.expiredCount ||0, c:C.warning, pct:((stats.expiredCount ||0)/Math.max(stats.totalClients||1,1))*100 },
                    { label:'Disabled', val:stats.disabledCount||0, c:C.danger,  pct:((stats.disabledCount||0)/Math.max(stats.totalClients||1,1))*100 },
                  ].map(s => (
                    <div key={s.label} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, alignItems:'center' }}>
                        <span style={{ fontSize:12, color:C.textMid }}>{s.label}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:'JetBrains Mono, monospace' }}>
                          {s.val} <span style={{ color:C.textDim, fontSize:11, fontFamily:'Inter,sans-serif' }}>({Math.round(s.pct)}%)</span>
                        </span>
                      </div>
                      <div style={{ height:4, background:C.border, borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${s.pct}%`, background:s.c, borderRadius:99, opacity:0.72 }} />
                      </div>
                    </div>
                  ))}
                  <Div />
                  <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                    {/* primary action: light gold */}
                    <button type="button" onClick={()=>navTo('onboard')} style={{
                      flex:1, padding:'10px', background:'#d3bfa2', border:'none', color:'#0f0f11',
                      borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    }}>
                      <UserPlus size={12} /> Onboard
                    </button>
                    {/* secondary: dark amber outline */}
                    <button type="button" onClick={()=>navTo('clients')} style={{
                      flex:1, padding:'10px', background:'transparent',
                      border:`1px solid rgba(138,112,77,0.3)`, color:'#8a704d',
                      borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    }}>
                      <Building2 size={12} /> Clients
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ CLIENTS ══ */}
        {activeSection==='clients' && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
            <div className="p-header" style={{ padding:'20px 32px 14px', background:C.bgDark, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontSize:10, color:C.textDim, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:4 }}>Accounts</div>
                  <h1 style={{ fontSize:22, fontWeight:700, color:C.text, letterSpacing:'-0.3px', lineHeight:1 }}>Client Partners</h1>
                  <div style={{ fontSize:12, color:C.textDim, marginTop:4 }}>{filteredClients.length} of {clients.length} shown</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ position:'relative' }}>
                    <Search size={13} color={C.textDim} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input className="p-inp" placeholder="Search…" value={searchTerm}
                      onChange={e=>setSearchTerm(e.target.value)}
                      style={{ ...inp, paddingLeft:34, width:180, fontSize:13 }} />
                  </div>
                  <button type="button" onClick={()=>navTo('onboard')} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'9px 14px',
                    background:'#d3bfa2', border:'none', color:'#0f0f11',
                    borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
                  }}>
                    <Plus size={13} /> New Client
                  </button>
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="p-filterbar" style={{ padding:'0 32px' }}>
              {[
                { id:'all',      label:'All',      count:clients.length },
                // Counted with the same subOf() the rows are filtered by: server totals could disagree with the visible list.
                { id:'active',   label:'Active',   count:(stateCounts.active||0) + (stateCounts.expiring||0) },
                { id:'expiring', label:'Expiring', count:stateCounts.expiring||0 },
                { id:'expired',  label:'Expired',  count:stateCounts.expired||0 },
                { id:'disabled', label:'Disabled', count:stateCounts.disabled||0 },
                ...((stateCounts.unset||0) > 0 ? [{ id:'unset', label:'No expiry', count:stateCounts.unset }] : []),
              ].map(f => (
                <button type="button" key={f.id} onClick={()=>setClientFilter(f.id)} style={filterTab(clientFilter===f.id)}>
                  {f.label}
                  <span style={{
                    fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:99,
                    background: clientFilter===f.id ? 'rgba(211,191,162,0.1)' : C.bgCard,
                    color: clientFilter===f.id ? '#d3bfa2' : C.textDim,
                    border: `1px solid ${clientFilter===f.id ? 'rgba(211,191,162,0.25)' : C.border}`,
                  }}>{f.count}</span>
                </button>
              ))}
            </div>

            {/* Clients table */}
            <div className="p-scroll no-sb" style={{ padding:'14px 32px 40px', overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px', minWidth:480 }}>
                <thead>
                  <tr style={{ fontSize:11, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.8px' }}>
                    {['Partner','Type','Expiry','Status','Revenue','Actions'].map((h,i) => (
                      <th key={h} className={i===1||i===2||i===4?'hide-mob':''} style={{
                        paddingLeft: i===0?14:0, paddingBottom:8,
                        textAlign: i===5?'right':'left', paddingRight: i===5?10:0,
                        fontWeight:600,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => {
                    const st = getClientStatus(client);
                    const dl = getDaysLeft(client);
                    return (
                      <motion.tr layout key={client._id} className="p-row" style={{ background:C.bgCard }}>
                        <td style={{ paddingLeft:14, paddingTop:12, paddingBottom:12, borderRadius:'10px 0 0 10px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                            <ClientStatusDot client={client} />
                            <div>
                              <div style={{ fontWeight:600, fontSize:13, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:155 }}>{client.name}</div>
                              <div style={{ fontSize:11, color:C.textDim, marginTop:1, fontFamily:'JetBrains Mono, monospace' }}>{client.tenantId}</div>
                              {client.address?.city && (
                                <div style={{ fontSize:11, color:C.textDim, marginTop:2, display:'flex', alignItems:'center', gap:3 }}>
                                  <MapPin size={8} strokeWidth={1.5} />{client.address.city}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hide-mob">
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            {client.businessType==='Cafe' ? <Coffee size={11} color={C.textDim} strokeWidth={1.5}/> : <Utensils size={11} color={C.textDim} strokeWidth={1.5}/>}
                            <span style={{ color:C.textDim, fontSize:12 }}>{client.businessType||'Restaurant'}</span>
                          </div>
                        </td>
                        <td className="hide-mob">
                          <div style={{ fontSize:13, fontWeight:500, color:C.text }}>
                            {fmtDay(client.config?.planExpiry)}
                          </div>
                          {dl!==null && (
                            <div style={{ fontSize:11, fontWeight:500, marginTop:2, color: dl<=0?C.danger:dl<=30?'#8a704d':C.textDim }}>
                              {dl<=0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`}
                            </div>
                          )}
                          <div style={{ fontSize:10.5, marginTop:3, color:C.textDim }}>
                            {subOf(client).lastPaymentAt ? `Paid ${fmtDay(subOf(client).lastPaymentAt)} · ₹${Number(subOf(client).lastPaymentAmount||0).toLocaleString('en-IN')}` : 'No payment date on record'}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:6, background:`${st.color}12`, color:st.color, border:`1px solid ${st.color}30` }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="hide-mob">
                          {/* revenue: dark amber — pairs with light gold bar fills */}
                          <span style={{ fontWeight:700, color:'#8a704d', fontSize:13, fontFamily:'JetBrains Mono, monospace' }}>₹{(client.totalPaidAmount||0).toLocaleString()}</span>
                        </td>
                        <td style={{ textAlign:'right', paddingRight:10, borderRadius:'0 10px 10px 0' }}>
                          <div style={{ display:'flex', gap:6, justifyContent:'flex-end', alignItems:'center' }}>
                            <button type="button" onClick={()=>{ setDocsClientId(String(client._id || client.tenantId)); navTo('documents'); }} title="Prepare welcome / invoice / agreement" style={{
                              padding:'5px 8px', borderRadius:7, fontSize:12, fontWeight:500,
                              cursor:'pointer', background:'transparent',
                              border:`1px solid ${C.border}`, color: C.textDim,
                              display:'flex', alignItems:'center', gap:4,
                            }}>
                              <FileText size={12} />
                            </button>
                            <button type="button" onClick={()=>setImportTarget({ tenantId: client.tenantId, tenantName: client.name })} title="Import menu (JSON)" style={{
                              padding:'5px 8px', borderRadius:7, fontSize:12, fontWeight:500,
                              cursor:'pointer', background:'transparent',
                              border:`1px solid ${C.border}`, color: C.textDim,
                              display:'flex', alignItems:'center', gap:4,
                            }}>
                              <FileJson size={12} />
                            </button>
                            <button type="button" onClick={()=>setDeleteTarget(client)} title="Delete client permanently" style={{
                              padding:'5px 8px', borderRadius:7, fontSize:12, fontWeight:500,
                              cursor:'pointer', background:'transparent',
                              border:`1px solid ${C.border}`, color: C.textDim,
                              display:'flex', alignItems:'center', gap:4,
                            }}>
                              <Trash2 size={12} />
                            </button>
                            <button type="button" onClick={()=>setPlanClient(client)} title="Subscription: dates, payments, set expiry" style={{
                              padding:'5px 8px', borderRadius:7, fontSize:12, fontWeight:500,
                              cursor:'pointer', background:'transparent',
                              border:`1px solid ${C.border}`, color: C.textDim,
                              display:'flex', alignItems:'center', gap:4,
                            }}>
                              <Wallet size={12} /><span className="hide-sm">Plan</span>
                            </button>
                            <button type="button" onClick={()=>handleToggle(client)} style={{
                              padding:'5px 10px', borderRadius:7, fontSize:12, fontWeight:500,
                              cursor:'pointer', background:'transparent',
                              border:`1px solid ${client.isActive ? `${C.danger}35` : 'rgba(211,191,162,0.25)'}`,
                              color: client.isActive ? C.danger : '#d3bfa2',
                              display:'flex', alignItems:'center', gap:4,
                            }}>
                              <Power size={10} />
                              <span className="hide-sm">{client.isActive ? 'Disable' : 'Enable'}</span>
                            </button>
                            <button type="button" onClick={()=>handleRenew(client)} style={{
                              padding:'5px 11px', borderRadius:7, fontSize:12, fontWeight:600,
                              cursor:'pointer', whiteSpace:'nowrap',
                              /* expired/disabled → solid light gold; active → dark amber outline */
                              background: (st.label==='Expired'||st.label==='Disabled') ? '#d3bfa2' : 'transparent',
                              border: (st.label==='Expired'||st.label==='Disabled') ? 'none' : `1px solid rgba(138,112,77,0.3)`,
                              color: (st.label==='Expired'||st.label==='Disabled') ? '#0f0f11' : '#8a704d',
                            }}>
                              {(st.label==='Active'||st.label==='Expiring') ? 'Renew' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredClients.length===0 && (
                <div style={{ textAlign:'center', padding:'80px 0', color:C.textDim }}>
                  <Building2 size={28} color={C.border} style={{ marginBottom:12 }} />
                  <div style={{ fontSize:13, fontWeight:500 }}>No clients found</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ONBOARD ══ */}
        {activeSection==='onboard' && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
            <div className="p-header" style={{ padding:'20px 32px 14px', background:C.bgDark, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              <div style={{ fontSize:10, color:C.textDim, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:4 }}>New Client</div>
              <h1 style={{ fontSize:22, fontWeight:700, color:C.text, letterSpacing:'-0.3px', lineHeight:1 }}>Client Onboarding</h1>
              <div style={{ fontSize:12, color:C.textDim, marginTop:4 }}>Register a restaurant or café on Pratyeksha</div>
            </div>

            <div className="p-scroll no-sb p-pad">

              {/* Success banner — light gold border, dark amber label */}
              <AnimatePresence>
                {onboardSuccess && (
                  <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ background:'rgba(211,191,162,0.04)', border:`1px solid rgba(211,191,162,0.18)`, borderRadius:12, padding:'18px 20px', marginBottom:24 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:11, color:'#8a704d', fontWeight:600, letterSpacing:'0.5px', marginBottom:4 }}>Client Onboarded ✓</div>
                        <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{onboardSuccess.name}</div>
                      </div>
                      <button type="button" onClick={()=>setOnboardSuccess(null)} style={{ background:C.bgCard, border:`1px solid ${C.border}`, color:C.textDim, padding:7, borderRadius:7, cursor:'pointer', display:'flex' }}>
                        <X size={13} />
                      </button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:8, marginBottom:12 }}>
                      {[
                        { lbl:'Tenant ID', val:onboardSuccess.tenantId, key:'tid' },
                        { lbl:'Username',  val:onboardSuccess.username,  key:'usr' },
                        { lbl:'Password',  val:onboardSuccess.password,  key:'pwd' },
                      ].map(r => (
                        <div key={r.key} style={{ background:C.bgDark, border:`1px solid rgba(211,191,162,0.14)`, borderRadius:9, padding:'10px 12px' }}>
                          {/* credential label: dark amber */}
                          <div style={{ fontSize:10, color:'#8a704d', fontWeight:600, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>{r.lbl}</div>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                            <code style={{ fontSize:12, color:C.text, fontFamily:'JetBrains Mono, monospace', wordBreak:'break-all' }}>{r.val}</code>
                            {/* copy icon: light gold when copied */}
                            <button type="button" onClick={()=>copyText(r.val, r.key)} style={{ background:'transparent', border:'none', cursor:'pointer', flexShrink:0, color: copied===r.key ? '#d3bfa2' : C.textDim }}>
                              {copied===r.key ? <Check size={13}/> : <Copy size={13}/>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color:C.textDim, display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                      <AlertCircle size={11}/> Save credentials — password cannot be recovered after closing.
                    </div>
                    {(onboardSuccess.categoriesWritten || onboardSuccess.menuItemsWritten) ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(211,191,162,0.06)', border:'1px solid rgba(211,191,162,0.2)', borderRadius:9, padding:'10px 12px', marginBottom:14, fontSize:11.5, color:'#d3bfa2' }}>
                        <CheckCircle2 size={14} /> {onboardSuccess.categoriesWritten || 0} categories &middot; {onboardSuccess.menuItemsWritten || 0} menu items imported
                      </div>
                    ) : null}
                    <button type="button" onClick={() => setImportTarget({ tenantId: onboardSuccess.tenantId, tenantName: onboardSuccess.name })} className="p-btn-shimmer" style={{
                      width: '100%', padding: '11px', borderRadius: 9, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#e9dcc4,#d3bfa2 55%,#b3986f)', color: '#0f0f11', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}><FileJson size={14} /> {(onboardSuccess.categoriesWritten || onboardSuccess.menuItemsWritten) ? 'Import More Menu Items' : `Import Menu for ${onboardSuccess.name}`} (JSON)</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {onboardError && (
                <div style={{ background:'rgba(226,154,88,0.06)', border:`1px solid rgba(226,154,88,0.2)`, borderRadius:9, padding:'11px 14px', marginBottom:18, fontSize:13, color:C.danger, display:'flex', alignItems:'center', gap:8 }}>
                  <AlertTriangle size={14}/> {onboardError}
                </div>
              )}

              <div style={{ display:'grid', gap:16, maxWidth:820 }}>

                {/* Business Info */}
                <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px' }}>
                  <SectionLabel icon={Store}>Business Information</SectionLabel>
                  <div className="p-form-grid">
                    <LabeledInput label="Restaurant / Café Name" required>
                      <input className="p-inp" style={inp} placeholder="Jay Ambe Fusion" value={onboarding.name} onChange={e=>setOnboarding(p=>({...p,name:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Business Type" required>
                      <select className="p-inp" style={{...inp,cursor:'pointer'}} value={onboarding.businessType} onChange={e=>setOnboarding(p=>({...p,businessType:e.target.value}))}>
                        <option>Restaurant</option><option>Cafe</option><option>Hotel</option>
                      </select>
                    </LabeledInput>
                    <LabeledInput label="Owner Name">
                      <input className="p-inp" style={inp} placeholder="Full name" value={onboarding.ownerName} onChange={e=>setOnboarding(p=>({...p,ownerName:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Contact Number">
                      <input className="p-inp" style={inp} placeholder="10-digit mobile" value={onboarding.contact} onChange={e=>setOnboarding(p=>({...p,contact:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="GSTIN">
                      <input className="p-inp" style={inp} placeholder="27AABCU1234F1Z5" value={onboarding.gstin} onChange={e=>setOnboarding(p=>({...p,gstin:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Number of Tables">
                      <input className="p-inp" style={inp} type="number" placeholder="12" value={onboarding.tableCount} onChange={e=>setOnboarding(p=>({...p,tableCount:e.target.value}))} />
                    </LabeledInput>
                  </div>
                </div>

                {/* Address */}
                <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px' }}>
                  <SectionLabel icon={MapPin}>Address</SectionLabel>
                  <div className="p-form-grid">
                    <div style={{ gridColumn:'span 2' }}>
                      <LabeledInput label="Street Address">
                        <input className="p-inp" style={inp} placeholder="Shop no., Street name" value={onboarding.street} onChange={e=>setOnboarding(p=>({...p,street:e.target.value}))} />
                      </LabeledInput>
                    </div>
                    <LabeledInput label="City">
                      <input className="p-inp" style={inp} placeholder="Kolhapur" value={onboarding.city} onChange={e=>setOnboarding(p=>({...p,city:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="State">
                      <input className="p-inp" style={inp} placeholder="Maharashtra" value={onboarding.state} onChange={e=>setOnboarding(p=>({...p,state:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Pincode">
                      <input className="p-inp" style={inp} placeholder="416001" value={onboarding.pincode} onChange={e=>setOnboarding(p=>({...p,pincode:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Area / Neighbourhood" hint="Used by the guest area filter">
                      <input className="p-inp" style={inp} placeholder="Rajarampuri" value={onboarding.area} onChange={e=>setOnboarding(p=>({...p,area:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Google Maps Link" hint="Optional share link for directions">
                      <input className="p-inp" style={inp} placeholder="https://maps.app.goo.gl/..." value={onboarding.mapsUrl} onChange={e=>setOnboarding(p=>({...p,mapsUrl:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Tax Percentage (%)">
                      <input className="p-inp" style={inp} type="number" placeholder="5" value={onboarding.taxPercentage} onChange={e=>setOnboarding(p=>({...p,taxPercentage:e.target.value}))} />
                    </LabeledInput>
                  </div>
                </div>

                {/* Credentials */}
                <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px' }}>
                  <SectionLabel icon={ShieldCheck}>Admin Credentials</SectionLabel>
                  <div className="p-form-grid">
                    <LabeledInput label="Username" required hint="Used to login to operator portal">
                      <input className="p-inp" style={inp} placeholder="jay_ambe_admin" value={onboarding.username} onChange={e=>setOnboarding(p=>({...p,username:e.target.value.toLowerCase().replace(/\s/g,'_')}))} />
                    </LabeledInput>
                    <LabeledInput label="Password" required>
                      <div style={{ position:'relative' }}>
                        <input className="p-inp" style={{...inp,paddingRight:42}} type={showPassword?'text':'password'} placeholder="Min 6 characters" value={onboarding.password} onChange={e=>setOnboarding(p=>({...p,password:e.target.value}))} />
                        <button type="button" onClick={()=>setShowPassword(p=>!p)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:C.textDim, display:'flex' }}>
                          {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                    </LabeledInput>
                    <LabeledInput label="Confirm Password" required>
                      <input className="p-inp" style={{...inp, borderColor: onboarding.confirmPassword && onboarding.password!==onboarding.confirmPassword ? `${C.danger}55` : C.borderMid}} type="password" placeholder="Re-enter password" value={onboarding.confirmPassword} onChange={e=>setOnboarding(p=>({...p,confirmPassword:e.target.value}))} />
                    </LabeledInput>
                  </div>
                </div>

                {/* Subscription — left border in dark amber */}
                <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderLeft:`2px solid rgba(138,112,77,0.4)`, borderRadius:12, padding:'20px' }}>
                  <SectionLabel icon={Wallet}>Subscription & Payment</SectionLabel>
                  <div style={{ fontSize:12, color:C.textDim, marginBottom:14, marginTop:-6 }}>Collect via GPay manually and record below.</div>
                  <div className="p-form-grid">
                    <LabeledInput label="Plan Duration" required>
                      <select className="p-inp" style={{...inp,cursor:'pointer'}} value={onboarding.planMonths} onChange={e=>setOnboarding(p=>({...p,planMonths:e.target.value}))}>
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year (12 Months)</option>
                      </select>
                    </LabeledInput>
                    <LabeledInput label="Amount Received (₹)" hint="Enter 0 if not yet collected">
                      <div style={{ position:'relative' }}>
                        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.textDim, fontSize:13 }}>₹</span>
                        <input className="p-inp" style={{...inp,paddingLeft:24}} type="number" placeholder="1200" value={onboarding.paidAmount} onChange={e=>setOnboarding(p=>({...p,paidAmount:e.target.value}))} />
                      </div>
                    </LabeledInput>
                    <LabeledInput label="Payment Date" hint="Leave empty for today">
                      <input className="p-inp" style={inp} type="date" max={todayIST()} value={onboarding.paidAt} onChange={e=>setOnboarding(p=>({...p,paidAt:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Payment Method">
                      <select className="p-inp" style={{...inp,cursor:'pointer'}} value={onboarding.paymentMethod} onChange={e=>setOnboarding(p=>({...p,paymentMethod:e.target.value}))}>
                        {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </LabeledInput>
                    <LabeledInput label="Google Review Link">
                      <input className="p-inp" style={inp} placeholder="https://g.page/..." value={onboarding.googleReview} onChange={e=>setOnboarding(p=>({...p,googleReview:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Instagram Handle">
                      <input className="p-inp" style={inp} placeholder="@jayambefusion" value={onboarding.instaId} onChange={e=>setOnboarding(p=>({...p,instaId:e.target.value}))} />
                    </LabeledInput>
                  </div>
                  <div style={{ marginTop:14, padding:12, border:`1px solid ${C.border}`, borderRadius:9, display:'grid', gap:9 }}>
                    <div style={{ fontSize:11, color:C.textDim, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' }}>Products in this subscription</div>
                    {[['pratyeksha','PRATYEKSHa Restaurant Suite'],['feedbackSuite','Feedback Suite'],['whatsappCampaigns','WhatsApp Offer Campaigns']].map(([key,label]) => (
                      <label key={key} style={{ display:'flex', alignItems:'center', gap:9, color:C.text, fontSize:12, cursor:'pointer' }}>
                        <input type="checkbox" checked={!!onboarding.products?.[key]} disabled={key==='whatsappCampaigns' && !onboarding.products?.feedbackSuite} onChange={e=>setOnboarding(prev=>({ ...prev, products:{ ...prev.products, [key]:e.target.checked, ...(key==='feedbackSuite' && !e.target.checked ? {whatsappCampaigns:false} : {}) } }))} />
                        <span>{label}</span>
                      </label>
                    ))}
                    {onboarding.products?.feedbackSuite && <div className="p-form-grid" style={{ marginTop:8 }}>
                      <LabeledInput label="Feedback Admin Email" required>
                        <input className="p-inp" style={inp} type="email" placeholder="owner@business.com" value={onboarding.feedbackAdminEmail} onChange={e=>setOnboarding(prev=>({...prev,feedbackAdminEmail:e.target.value}))} />
                      </LabeledInput>
                      <LabeledInput label="Feedback Admin Password" required hint="At least 10 characters; stored as a hash">
                        <input className="p-inp" style={inp} type="password" minLength={10} value={onboarding.feedbackAdminPassword} onChange={e=>setOnboarding(prev=>({...prev,feedbackAdminPassword:e.target.value}))} />
                      </LabeledInput>
                      {onboarding.products?.whatsappCampaigns && <LabeledInput label="Campaign Studio Password" required hint="Use a different password; at least 10 characters">
                        <input className="p-inp" style={inp} type="password" minLength={10} value={onboarding.campaignStudioPassword} onChange={e=>setOnboarding(prev=>({...prev,campaignStudioPassword:e.target.value}))} />
                      </LabeledInput>}
                    </div>}
                  </div>
                </div>

                {/* Menu setup — optional JSON uploads instead of manual entry */}
                <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 22px', marginBottom:18 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:4 }}>
                    <FileJson size={15} color="#d3bfa2" />
                    <div style={{ fontSize:13.5, fontWeight:700, color:C.text }}>Menu Setup (optional)</div>
                  </div>
                  <div style={{ fontSize:11.5, color:C.textDim, marginBottom:16, lineHeight:1.6 }}>
                    Upload the client's categories and menu items as JSON instead of typing them in by hand — both are optional and independent. Skip this and the client starts with 5 default categories and no dishes.
                  </div>
                  <DualJsonUpload key={onboardUploadKey} onChange={({ categories, menuItems }) => { setOnboardCategories(categories); setOnboardMenuItems(menuItems); }} />
                  <a href={`${BASE_URL}/admin/master/menu-template`} target="_blank" rel="noreferrer" style={{ fontSize:11, color:C.textDim, display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none' }}>
                    <FileDown size={12} /> View example template
                  </a>
                </div>

                {/* Submit — primary: light gold solid; secondary: ghost */}
                <div style={{ display:'flex', gap:10, paddingBottom:20 }}>
                  <button type="button" onClick={handleOnboard} disabled={onboardLoading} style={{
                    flex:2, padding:'13px', borderRadius:10, border:'none',
                    background: onboardLoading ? C.bgCard2 : '#d3bfa2',
                    color: onboardLoading ? C.textDim : '#0f0f11',
                    cursor: onboardLoading ? 'not-allowed' : 'pointer',
                    fontSize:14, fontWeight:600,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  }}>
                    {onboardLoading
                      ? <><RefreshCcw size={14} style={{ animation:'spin 0.9s linear infinite' }}/> Onboarding…</>
                      : <><UserPlus size={14}/> Onboard Client &amp; Generate Access</>
                    }
                  </button>
                  <button type="button" onClick={()=>{setOnboarding({ name:'', businessType:'Restaurant', ownerName:'', contact:'', gstin:'', street:'', city:'', state:'', pincode:'', area:'', landmark:'', mapsUrl:'', tableCount:'12', taxPercentage:'5', username:'', password:'', confirmPassword:'', planMonths:'12', paidAmount:'', paidAt:'', paymentMethod:'UPI', googleReview:'', instaId:'', products:{ pratyeksha:true, feedbackSuite:false, whatsappCampaigns:false }, feedbackAdminEmail:'', feedbackAdminPassword:'', campaignStudioPassword:'' }); setOnboardCategories(null); setOnboardMenuItems(null); setOnboardUploadKey(k => k + 1); setOnboardError('');}}
                    style={{ flex:1, padding:'13px', background:'transparent', border:`1px solid ${C.border}`, color:C.textDim, borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer' }}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection==='tracking' && <MasterTracking onOpenClients={() => navTo('clients')} onOpenCrm={() => navTo('crm')} />}

        {activeSection==='crm' && <LeadCRM />}

        {activeSection==='qrstudio' && (
          <div className="no-sb p-fade-in" style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', width:'100%', WebkitOverflowScrolling:'touch' }}>
            <QrStudio />
          </div>
        )}

        {activeSection==='documents' && (
          <div className="no-sb p-fade-in" style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', width:'100%', WebkitOverflowScrolling:'touch' }}>
            <MasterDocuments clients={clients} focusClientId={docsClientId} onFocusHandled={()=>setDocsClientId(null)} />
          </div>
        )}

        {activeSection==='notifications' && (
          <div className="p-scroll no-sb p-fade-in" style={{ padding:'20px 32px 40px', maxWidth: 900, width:'100%' }}>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:19, fontWeight:700, color:C.text, marginBottom:4 }}>Notifications</div>
              <div style={{ fontSize:12.5, color:C.textDim }}>Send a message to one client, several, or everyone — shows up inside their Owner App and Operator Portal only.</div>
            </div>

            <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 22px', marginBottom:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <LabeledInput label="Send To">
                  <select className="p-inp" style={inp} value={notifCompose.target} onChange={e=>setNotifCompose(c=>({...c, target:e.target.value, tenantId:''}))}>
                    <option value="single">One client</option>
                    <option value="all">All active clients</option>
                  </select>
                </LabeledInput>
                {notifCompose.target === 'single' ? (
                  <LabeledInput label="Client">
                    <select className="p-inp" style={inp} value={notifCompose.tenantId} onChange={e=>setNotifCompose(c=>({...c, tenantId:e.target.value}))}>
                      <option value="">Select a client…</option>
                      {clients.map(c => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}
                    </select>
                  </LabeledInput>
                ) : (
                  <LabeledInput label="Severity">
                    <select className="p-inp" style={inp} value={notifCompose.severity} onChange={e=>setNotifCompose(c=>({...c, severity:e.target.value}))}>
                      <option value="info">Info</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </LabeledInput>
                )}
              </div>
              {notifCompose.target === 'single' && (
                <div style={{ marginBottom:14 }}>
                  <LabeledInput label="Severity">
                    <select className="p-inp" style={inp} value={notifCompose.severity} onChange={e=>setNotifCompose(c=>({...c, severity:e.target.value}))}>
                      <option value="info">Info</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </LabeledInput>
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <LabeledInput label="Title">
                  <input className="p-inp" style={inp} placeholder="e.g. Scheduled maintenance tonight" value={notifCompose.title} onChange={e=>setNotifCompose(c=>({...c, title:e.target.value}))} />
                </LabeledInput>
              </div>
              <div style={{ marginBottom:14 }}>
                <LabeledInput label="Message">
                  <textarea className="p-inp" style={{ ...inp, minHeight:80, resize:'vertical', fontFamily:'inherit' }} placeholder="What do you want them to know?" value={notifCompose.message} onChange={e=>setNotifCompose(c=>({...c, message:e.target.value}))} />
                </LabeledInput>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.textDim, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.4px' }}>Visible To</div>
                <div style={{ display:'flex', gap:16 }}>
                  {['owner','operator'].map(a => (
                    <label key={a} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, color:C.textMid, cursor:'pointer' }}>
                      <input type="checkbox" checked={notifCompose.audience.includes(a)} onChange={e=>{
                        setNotifCompose(c=>({...c, audience: e.target.checked ? [...c.audience, a] : c.audience.filter(x=>x!==a)}));
                      }} />
                      {a === 'owner' ? 'Owner App' : 'Operator Portal'}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns: notifCompose.sendMode==='schedule' ? '1fr 1fr' : '1fr', gap:14, marginBottom:18 }}>
                <LabeledInput label="When">
                  <select className="p-inp" style={inp} value={notifCompose.sendMode} onChange={e=>setNotifCompose(c=>({...c, sendMode:e.target.value}))}>
                    <option value="now">Send immediately</option>
                    <option value="schedule">Schedule for later</option>
                  </select>
                </LabeledInput>
                {notifCompose.sendMode === 'schedule' && (
                  <LabeledInput label="Date &amp; Time">
                    <input className="p-inp" style={inp} type="datetime-local" value={notifCompose.scheduledAt} onChange={e=>setNotifCompose(c=>({...c, scheduledAt:e.target.value}))} />
                  </LabeledInput>
                )}
              </div>
              <button type="button" onClick={sendNotification} disabled={notifSending} className="p-btn-shimmer" style={{
                padding:'11px 20px', borderRadius:9, border:'none', cursor: notifSending ? 'not-allowed' : 'pointer',
                background: notifSending ? C.bgCard2 : '#d3bfa2', color: notifSending ? C.textDim : '#0f0f11',
                fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:8
              }}>
                {notifSending ? <><Loader2 size={14} style={{ animation:'spin 0.8s linear infinite' }} /> Sending…</> : <><Send size={14} /> {notifCompose.sendMode==='schedule' ? 'Schedule Notification' : 'Send Now'}</>}
              </button>
            </div>

            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12 }}>History</div>
            {notifLoading ? (
              <div style={{ fontSize:12.5, color:C.textDim }}>Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={{ fontSize:12.5, color:C.textDim, padding:'20px 0' }}>No notifications sent yet.</div>
            ) : (
              <div style={{ display:'grid', gap:8 }} className="p-stagger">
                {notifications.map(n => {
                  const client = clients.find(c => c.tenantId === n.tenantId);
                  const pending = !n.delivered;
                  return (
                    <div key={n._id} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{
                        width:8, height:8, borderRadius:'50%', marginTop:5, flexShrink:0,
                        background: n.severity==='urgent' ? C.danger : n.severity==='important' ? '#8a704d' : '#d3bfa2'
                      }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{n.title}</div>
                        <div style={{ fontSize:12, color:C.textMid, marginTop:2, lineHeight:1.5 }}>{n.message}</div>
                        <div style={{ fontSize:10.5, color:C.textFaint, marginTop:6, display:'flex', gap:10, flexWrap:'wrap' }}>
                          <span>{client?.name || n.tenantId}</span>
                          <span>&middot;</span>
                          <span>{(Array.isArray(n.audience) ? n.audience : []).join(' + ') || '—'}</span>
                          <span>&middot;</span>
                          <span>{pending ? `Scheduled ${new Date(n.scheduledAt).toLocaleString()}` : `Delivered ${new Date(n.scheduledAt).toLocaleString()}`}</span>
                        </div>
                      </div>
                      {pending && (
                        <button type="button" onClick={()=>cancelNotification(n._id)} title="Cancel" style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textDim, borderRadius:7, padding:'5px 8px', cursor:'pointer', flexShrink:0 }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSection==='expenses' && (
          <div className="p-scroll no-sb p-fade-in" style={{ padding:'20px 32px 40px', maxWidth: 980, width:'100%' }}>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:19, fontWeight:700, color:C.text, marginBottom:4 }}>Operating Costs</div>
              <div style={{ fontSize:12.5, color:C.textDim }}>Domain, hosting, email, QR stands, SMS/WhatsApp — every platform cost is deducted from gross collections to show the real net position.</div>
              <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:12 }}>
                {[
                  ['domain','Domain renewal'], ['email','Email / SMTP'], ['qr_stands','QR stand supply'],
                  ['hosting','Hosting / Render'], ['sms_whatsapp','SMS / WhatsApp']
                ].map(([category,label]) => (
                  <button type="button" key={category} onClick={()=>setExpenseForm(f=>({...f, category,
                    // Only replace a label that came from a preset button; a label the admin typed is kept.
                    label: (!f.label || ['Domain renewal','Email / SMTP','QR stand supply','Hosting / Render','SMS / WhatsApp'].includes(f.label)) ? label : f.label }))} className="p-nav-item" style={{ padding:'7px 10px', borderRadius:8, background:C.bgCard, border:`1px solid ${C.border}`, color:C.textMid, fontSize:11.5, fontWeight:600, cursor:'pointer' }}>
                    <Plus size={11} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {expenseSummary && (
              <div className="p-stat-grid p-stagger" style={{ marginBottom:22 }}>
                {[
                  { icon:IndianRupee, label:'Platform Revenue', val:expenseSummary.totalRevenue, prefix:'₹', accent:'#d3bfa2' },
                  { icon:TrendingDown, label:'Total Operating Costs', val:expenseSummary.totalExpenses, prefix:'₹', accent:C.danger },
                  { icon:Wallet, label:'Net Revenue', val:expenseSummary.netRevenue, prefix:'₹', accent: expenseSummary.netRevenue >= 0 ? '#d3bfa2' : C.danger },
                  { icon:Receipt, label:'Monthly Run-Rate', val:expenseSummary.monthlyRunRate, prefix:'₹', accent:'#8a704d', sub:'committed recurring costs' },
                ].map(k => (
                  <div key={k.label} className="p-card p-card-lift" style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 16px' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${k.accent}14`, border:`1px solid ${k.accent}22`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                      <k.icon size={15} color={k.accent} strokeWidth={1.5} />
                    </div>
                    <div style={{ fontSize:11, color:C.textDim, fontWeight:500, marginBottom:4 }}>{k.label}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:k.accent, lineHeight:1, marginBottom:3, fontFamily:'JetBrains Mono, monospace' }}>{k.prefix}{Math.abs(k.val).toLocaleString()}{k.val < 0 ? ' (loss)' : ''}</div>
                    {k.sub && <div style={{ fontSize:10.5, color:C.textDim }}>{k.sub}</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 22px', marginBottom:22 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                {editingExpenseId ? <Edit3 size={14} color="#d3bfa2" /> : <PlusCircle size={14} color="#d3bfa2" />}
                {editingExpenseId ? 'Edit Cost' : 'Add a Cost'}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <LabeledInput label="Category">
                  <select className="p-inp" style={inp} value={expenseForm.category} onChange={e=>setExpenseForm(f=>({...f, category:e.target.value}))}>
                    {Object.entries({domain:'Domain', hosting:'Hosting / Server', email:'Email Service', sms_whatsapp:'SMS / WhatsApp API', qr_stands:'QR Stands', payment_gateway:'Payment Gateway', software:'Software / Tools', marketing:'Marketing', other:'Other'}).map(([k,v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </LabeledInput>
                <LabeledInput label="Amount (₹)">
                  <input className="p-inp" style={inp} type="number" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f, amount:e.target.value}))} placeholder="999" />
                </LabeledInput>
              </div>
              <div style={{ marginBottom:14 }}>
                <LabeledInput label="Label">
                  <input className="p-inp" style={inp} value={expenseForm.label} onChange={e=>setExpenseForm(f=>({...f, label:e.target.value}))} placeholder="e.g. pratyeksha.app domain renewal" />
                </LabeledInput>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <LabeledInput label="Vendor (optional)">
                  <input className="p-inp" style={inp} value={expenseForm.vendor} onChange={e=>setExpenseForm(f=>({...f, vendor:e.target.value}))} placeholder="e.g. GoDaddy, Twilio" />
                </LabeledInput>
                <LabeledInput label="Date">
                  <input className="p-inp" style={inp} type="date" value={expenseForm.date} onChange={e=>setExpenseForm(f=>({...f, date:e.target.value}))} />
                </LabeledInput>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, color:C.textMid, cursor:'pointer' }}>
                  <input type="checkbox" checked={expenseForm.recurring} onChange={e=>setExpenseForm(f=>({...f, recurring:e.target.checked}))} />
                  Recurring cost
                </label>
                {expenseForm.recurring && (
                  <select className="p-inp" style={{ ...inp, width:140 }} value={expenseForm.recurringInterval} onChange={e=>setExpenseForm(f=>({...f, recurringInterval:e.target.value}))}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={submitExpense} disabled={expenseSaving} className="p-btn-shimmer" style={{
                  padding:'11px 20px', borderRadius:9, border:'none', cursor: expenseSaving ? 'not-allowed' : 'pointer',
                  background: expenseSaving ? C.bgCard2 : '#d3bfa2', color: expenseSaving ? C.textDim : '#0f0f11',
                  fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:8
                }}>
                  {expenseSaving ? <Loader2 size={14} style={{ animation:'spin 0.8s linear infinite' }} /> : (editingExpenseId ? <Check size={14} /> : <Plus size={14} />)}
                  {expenseSaving ? 'Saving…' : (editingExpenseId ? 'Update Cost' : 'Add Cost')}
                </button>
                {editingExpenseId && (
                  <button type="button" onClick={resetExpenseForm} style={{ padding:'11px 18px', borderRadius:9, background:'transparent', border:`1px solid ${C.border}`, color:C.textDim, fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel Edit</button>
                )}
              </div>
            </div>

            {expenseSummary?.categoryBreakdown?.length > 0 && (
              <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 22px', marginBottom:22 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14 }}>By Category</div>
                <div style={{ display:'grid', gap:10 }}>
                  {expenseSummary.categoryBreakdown.map(c => {
                    const cAmt = Number(c.amount) || 0;
                    const pct = expenseSummary.totalExpenses > 0 ? Math.round((cAmt / expenseSummary.totalExpenses) * 100) : 0;
                    return (
                      <div key={c.category}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                          <span style={{ color:C.textMid, fontWeight:600 }}>{c.label}</span>
                          <span style={{ color:C.text, fontFamily:'JetBrains Mono, monospace' }}>₹{cAmt.toLocaleString()} <span style={{ color:C.textDim }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height:6, borderRadius:100, background:C.bgDark, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:'#d3bfa2', borderRadius:100 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12 }}>All Costs</div>
            {expenseLoading ? (
              <div style={{ fontSize:12.5, color:C.textDim }}>Loading…</div>
            ) : expenses.length === 0 ? (
              <div style={{ fontSize:12.5, color:C.textDim, padding:'20px 0' }}>No costs logged yet.</div>
            ) : (
              <div className="p-table-scroll">
                <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px', minWidth:640 }}>
                  <thead>
                    <tr style={{ fontSize:11, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.8px' }}>
                      <th style={{ textAlign:'left', padding:'0 12px 8px' }}>Cost</th>
                      <th style={{ textAlign:'left', padding:'0 12px 8px' }}>Category</th>
                      <th style={{ textAlign:'left', padding:'0 12px 8px' }}>Date</th>
                      <th style={{ textAlign:'right', padding:'0 12px 8px' }}>Amount</th>
                      <th style={{ textAlign:'right', padding:'0 12px 8px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e._id} style={{ background:C.bgCard }}>
                        <td style={{ padding:'12px', borderRadius:'10px 0 0 10px' }}>
                          <div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{e.label}</div>
                          {e.vendor && <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>{e.vendor}{e.recurring ? ` · ${e.recurringInterval}` : ''}</div>}
                        </td>
                        <td style={{ padding:'12px', fontSize:12, color:C.textMid }}>{EXPENSE_CATEGORY_LABELS_FRONTEND[e.category] || e.category}</td>
                        <td style={{ padding:'12px', fontSize:12, color:C.textDim }}>{new Date(e.date).toLocaleDateString(undefined, { timeZone: 'Asia/Kolkata' })}</td>
                        <td style={{ padding:'12px', textAlign:'right', fontSize:13, fontWeight:700, color:C.text, fontFamily:'JetBrains Mono, monospace' }}>₹{e.amount.toLocaleString()}</td>
                        <td style={{ padding:'12px', borderRadius:'0 10px 10px 0', textAlign:'right' }}>
                          <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                            <button type="button" onClick={()=>editExpense(e)} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textDim, borderRadius:7, padding:'5px 8px', cursor:'pointer' }}><Edit3 size={11} /></button>
                            <button type="button" onClick={()=>deleteExpense(e._id)} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.danger, borderRadius:7, padding:'5px 8px', cursor:'pointer' }}><Trash2 size={11} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      <AnimatePresence>
        {confirmModal && (
          <ConfirmModal data={confirmModal} onClose={() => setConfirmModal(null)} onConfirm={confirmModal.onConfirm} />
        )}
        {planClient && (
          <SubscriptionModal client={planClient} onClose={() => setPlanClient(null)} onChanged={fetchData}
            onRenew={() => { const c = planClient; setPlanClient(null); setRenewClient(c); }} onToggle={() => { const c = planClient; setPlanClient(null); handleToggle(c); }} flash={flash} />
        )}
        {renewClient && (
          <RenewModal client={renewClient} onClose={() => setRenewClient(null)} onSubmit={(m, a, products, credentials, payment) => submitRenew(renewClient, m, a, products, credentials, payment)} />
        )}
        {importTarget && (
          <ImportMenuModal target={importTarget} onClose={() => setImportTarget(null)} onDone={fetchData} flash={flash} />
        )}
        {deleteTarget && (
          <DeleteTenantModal client={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={(text) => runDeleteTenant(deleteTarget, text)} />
        )}
      </AnimatePresence>
      <Toast toast={toast} />
    </div>
  );
}