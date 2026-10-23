import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import PwaInstallButton from './PwaInstallButton.jsx';
import { AmbientBackdrop, BrandLoader } from './PremiumUI.jsx';
import { GuestLegalSheet, ConsentCheck, getGuestConsent, setGuestConsent, setGuestToken, clearGuestLocalData, GUEST_CONSENT_VERSION } from './GuestLegal.jsx';
import { io } from "socket.io-client";
import { 
  CheckCircle2, AlertCircle, Utensils, Info, X, Sparkles, Volume1, Volume2, Play, Pause,ChevronDown ,
  MessageSquare, StickyNote, Flame, Globe2, Timer, Search, BellRing, 
  Droplets, Trash2, HelpCircle, Minus, Plus, ReceiptText, ChevronRight, UtensilsCrossed, Layers, ShoppingBag ,Armchair,
  Clock3, Users, ChevronLeft,RefreshCw ,
  Hourglass, MapPin, CalendarClock, CircleDot, Hash, ArrowLeft,
  Package, UserCheck, MinusCircle, PlusCircle,  GlassWater, IceCream2, Cookie, Apple, Milk, Candy, Coffee, Sandwich, Wind, Box,Leaf, Drumstick, Tag,
  Sun, Moon, ArrowUp, WifiOff, AlertTriangle, Star, User, ShieldCheck, Lock
} from 'lucide-react'; 

import API_BASE_URL, { SOCKET_BASE_URL } from './apiBase.js';

import SpoonForkIcon from './SpoonForkIcon.jsx';
import UpiPay from './UpiPay.jsx';
import { decideEntry } from './sessionPolicy.js';
import SessionEndedScreen from './SessionEnded.jsx';
const BASE_URL = API_BASE_URL;
const PRATYEKSHAA_LOGO = '/pratyeksha-logo.png';

// Premium design tokens shared by every guest screen (champagne on ink — no green / red).
// `new Notification()` throws "Illegal constructor" on Android Chrome (it only allows ServiceWorkerRegistration.showNotification).
// Raw calls sat inside the same try as the API request, so a reservation that WAS saved still showed an error, and the
// "table almost ready" socket handler threw before it could show its in-app alert. Never throws.
// Every notification (push, in-app, local) uses the Pratyeksha logo on its brand background as the icon, the crossed
// spoon & fork as the small badge (never the browser's bell) and a creative picture for that kind of event.
// ── TABLE SECURITY (client half) ─────────────────────────────────────────────
// Each phone has a random private key. The first phone that orders on a table "owns" it on the server; every other phone
// that opens the same table can only browse the menu. The key is never shown or put in a URL.
const DEVICE_KEY_NAME = 'pratyeksha_device_key';
let __memDeviceKey = '';
const getDeviceKey = () => {
  const valid = (k) => typeof k === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(k);
  try { const k = localStorage.getItem(DEVICE_KEY_NAME); if (valid(k)) return k; } catch { /* storage blocked */ }
  try { const k = sessionStorage.getItem(DEVICE_KEY_NAME); if (valid(k)) return k; } catch { /* storage blocked */ }
  if (valid(__memDeviceKey)) return __memDeviceKey;
  const bytes = new Uint8Array(16);
  try { crypto.getRandomValues(bytes); } catch { for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256); }
  const k = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  __memDeviceKey = k;
  try { localStorage.setItem(DEVICE_KEY_NAME, k); } catch { try { sessionStorage.setItem(DEVICE_KEY_NAME, k); } catch { /* memory only */ } }
  return k;
};
const getTableSig = () => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('sig');
    if (fromUrl) return fromUrl;
    return JSON.parse(sessionStorage.getItem('pratyeksha_qr_session') || '{}').sig || '';
  } catch { return ''; }
};
// ── TABLE SESSION (client half) ──────────────────────────────────────────────
// A QR scan (a fresh page load) starts a server session. Generating the bill ends it. Refresh / back / forward after that
// can never reopen the menu: only scanning the QR again starts a new session.
const TSESSION_KEY = 'pratyeksha_tsession';
let __memTSession = null;
const readTSession = () => {
  try { const v = JSON.parse(sessionStorage.getItem(TSESSION_KEY) || 'null'); if (v) return v; } catch { /* storage blocked */ }
  return __memTSession;
};
const writeTSession = (o) => { __memTSession = o; try { if (o) sessionStorage.setItem(TSESSION_KEY, JSON.stringify(o)); else sessionStorage.removeItem(TSESSION_KEY); } catch { /* memory only */ } };
const BILL_KEY = (t, n) => `pratyeksha_last_bill_${t}_${n}`;
const readLastBill = (t, n) => { try { return JSON.parse(localStorage.getItem(BILL_KEY(t, n)) || 'null'); } catch { return null; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const __sessionBooted = new Set(); // one bootstrap per tenant+table per page load (a re-render must never start a second session)
const TABLE_SCOPED_PATH = /\/(orders|waiter-requests|table-access|session\/validate|table-session|payments)(\/|$|\?)/;
if (typeof window !== 'undefined' && !window.__pxTableGuard) {
  window.__pxTableGuard = true;
  axios.interceptors.request.use((config) => {
    try {
      const url = String(config.url || '');
      if (url.startsWith(BASE_URL) && TABLE_SCOPED_PATH.test(url.slice(BASE_URL.length))) {
        config.headers = config.headers || {};
        config.headers['x-device-key'] = getDeviceKey();
        const sig = getTableSig();
        if (sig) config.headers['x-table-sig'] = sig;
        if (!config.px_noSession) { const ts = readTSession(); if (ts && ts.token) config.headers['x-session-token'] = ts.token; }
      }
    } catch { /* never block a request because of this */ }
    return config;
  });
  axios.interceptors.response.use((r) => r, (err) => {
    try {
      const d = err?.response?.data;
      const cfg = err?.config || {};
      const isRead = String(cfg.method || '').toLowerCase() === 'get';
      if (err?.response?.status === 403 && d && !isRead && !cfg.px_silent) {
        // Another guest owns this table → view-only. Session over → the menu closes. Edited QR → blocked.
        if (d.code === 'TABLE_LOCKED' || d.code === 'TABLE_QR_INVALID') window.dispatchEvent(new CustomEvent('pratyeksha:table-locked', { detail: { code: d.code, message: d.error } }));
        if (d.code === 'SESSION_ENDED' || d.code === 'SESSION_REQUIRED') window.dispatchEvent(new CustomEvent('pratyeksha:session-ended', { detail: { code: d.code } }));
      }
    } catch { /* ignore */ }
    return Promise.reject(err);
  });
}

const NOTIF_ICON = '/notification-icon.png';
const NOTIF_BADGE = '/notification-badge.png';
const notifImage = (event, custom) => custom || `/notif/${event || 'default'}.jpg`;
const safeNotify = (title, options = {}) => {
  const { event, ...rest } = options || {};
  const opts = { ...rest, icon: NOTIF_ICON, badge: NOTIF_BADGE, image: rest.image || notifImage(event) };
  try { new Notification(title, opts); return true; } catch { /* fall through to the service worker */ }
  try {
    if (navigator.serviceWorker?.getRegistration) navigator.serviceWorker.getRegistration().then((r) => r && r.showNotification(title, opts)).catch(() => {});
  } catch { /* notifications unavailable */ }
  return false;
};
// Guest-typed text (name, special requests, table preference) and outlet fields were interpolated raw into the printable
// token / receipt HTML, which is opened from a blob: URL (same origin as the app). A name like `<b>` broke the layout and
// `<img onerror=…>` executed script with the app's storage access. Escape every dynamic value that goes into those documents.
const escapeHtml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const PX = {
  card: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018))',
  gold: 'linear-gradient(135deg, #e6d6b8 0%, #d3bfa2 45%, #b99f78 100%)',
  goldSoft: 'linear-gradient(135deg, rgba(211,191,162,0.16), rgba(211,191,162,0.04))',
  line: 'rgba(211,191,162,0.16)',
  glassBar: 'rgba(11,11,12,0.74)',
  shadow: '0 18px 44px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)',
  serif: "'Playfair Display', Georgia, serif",
};

// Stable shell component. Keeping this outside the parent render prevents React
// from remounting the registration form on every keystroke/state update.
const maskGuestPhone = (p) => (p && p.length >= 4 ? `+91 ••••••${p.slice(-4)}` : '');

/** Name + mobile collection. A remembered guest sees a welcome-back card instead of the form. */
const GuestIdentityBlock = ({ language, info, onName, onPhone, locked, onForget }) => {
  const mr = language === 'mr';
  const label = { fontSize: '0.54rem', color: 'rgba(211,191,162,0.72)', fontWeight: 800, letterSpacing: '2px', display: 'block', marginBottom: 10, textTransform: 'uppercase', textAlign: 'left' };
  const field = { width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 50px', background: PX.card, border: '1px solid rgba(211,191,162,0.22)', color: '#f7f3eb', borderRadius: 18, fontSize: '1rem', outline: 'none', fontFamily: 'Poppins, sans-serif', transition: 'border-color .2s, box-shadow .2s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' };
  const focus = e => { e.target.style.borderColor = 'rgba(211,191,162,0.6)'; e.target.style.boxShadow = '0 0 0 4px rgba(211,191,162,0.1)'; };
  const blur = e => { e.target.style.borderColor = 'rgba(211,191,162,0.22)'; e.target.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05)'; };
  const icon = { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' };

  if (locked && info.name && info.phone?.length === 10) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', marginBottom: 22, borderRadius: 22, background: PX.card, border: `1px solid ${PX.line}`, boxShadow: PX.shadow, textAlign: 'left' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, flexShrink: 0, background: PX.gold, color: '#14110c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PX.serif, fontWeight: 700, fontSize: '1.3rem' }}>
          {info.name.trim().charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.5rem', letterSpacing: 2.5, fontWeight: 800, color: 'rgba(211,191,162,0.65)', textTransform: 'uppercase', marginBottom: 3 }}>{mr ? 'पुन्हा स्वागत' : 'Welcome back'}</div>
          <div style={{ fontFamily: PX.serif, fontSize: '1.15rem', fontWeight: 700, color: '#f7f3eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.name}</div>
          <div style={{ fontSize: '0.64rem', color: 'rgba(247,243,235,0.5)', marginTop: 2, letterSpacing: 1 }}>{maskGuestPhone(info.phone)}</div>
        </div>
        <button type="button" onClick={onForget} style={{ background: 'none', border: '1px solid rgba(211,191,162,0.25)', color: '#d3bfa2', borderRadius: 12, padding: '8px 11px', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>
          {mr ? 'तुम्ही नाही?' : 'Not you?'}
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <label style={label}>{mr ? 'तुमचे नाव *' : 'Your name *'}</label>
        <div style={{ position: 'relative' }}>
          <User size={17} color="rgba(211,191,162,0.6)" strokeWidth={1.7} style={icon} />
          <input type="text" autoComplete="name" maxLength={60} placeholder={mr ? 'उदा. राज शर्मा' : 'e.g. Raj Sharma'} value={info.name} onChange={e => onName(e.target.value)} onFocus={focus} onBlur={blur} style={field} />
        </div>
      </div>
      <div style={{ marginBottom: 22 }}>
        <label style={label}>{mr ? '१० अंकी मोबाईल नंबर *' : '10-digit mobile number *'}</label>
        <div style={{ position: 'relative' }}>
          <span style={{ ...icon, fontSize: '0.84rem', color: 'rgba(211,191,162,0.75)', fontWeight: 700 }}>+91</span>
          <input type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="9876543210" value={info.phone} onChange={e => onPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} onFocus={focus} onBlur={blur} style={{ ...field, paddingLeft: 56, letterSpacing: 2 }} />
        </div>
        {info.phone?.length > 0 && info.phone.length !== 10 && (
          <div style={{ fontSize: '0.6rem', color: '#e8b87a', marginTop: 7, fontWeight: 700, textAlign: 'left' }}>
            {mr ? `आणखी ${10 - info.phone.length} अंक हवेत` : `${10 - info.phone.length} more digits needed`}
          </div>
        )}
      </div>
    </>
  );
};

const GuestLegalLinks = ({ language, onOpen, style }) => {
  const mr = language === 'mr';
  const btn = { background: 'none', border: 0, padding: '4px 2px', cursor: 'pointer', color: 'rgba(211,191,162,0.62)', fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif', letterSpacing: '0.3px' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', ...style }}>
      <ShieldCheck size={11} color="rgba(211,191,162,0.55)" />
      <button type="button" style={btn} onClick={() => onOpen('privacy')}>{mr ? 'गोपनीयता' : 'Privacy'}</button>
      <span style={{ color: 'rgba(211,191,162,0.3)' }}>·</span>
      <button type="button" style={btn} onClick={() => onOpen('terms')}>{mr ? 'अटी' : 'Terms'}</button>
      <span style={{ color: 'rgba(211,191,162,0.3)' }}>·</span>
      <button type="button" style={btn} onClick={() => onOpen('data')}>{mr ? 'माझा डेटा / हटवा' : 'My data / Delete'}</button>
    </div>
  );
};

const CustomerShell = ({ children, centered = true, scrollRef }) => (
  <div ref={scrollRef} style={{
    position: 'relative', minHeight: '100vh', height: '100vh', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch',
    background: '#0b0b0c', color: '#fff', fontFamily: 'Poppins, sans-serif',
    display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
  }}>
    <AmbientBackdrop />
    <div className="px-rise" style={{
      position: 'relative', zIndex: 1, flex: 1, width: '100%', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', alignItems: centered ? 'center' : 'stretch', textAlign: centered ? 'center' : 'left',
      justifyContent: 'flex-start', padding: centered ? 'calc(40px + env(safe-area-inset-top, 0px)) 22px calc(36px + env(safe-area-inset-bottom, 0px))' : '0'
    }}>{children}</div>
  </div>
);

const CustomerRestaurantBadge = ({ restaurantName }) => (
  <div style={{ textAlign: 'center', marginBottom: '30px', width: '100%', maxWidth: '400px' }}>
    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', margin: '0 auto 18px' }}>
      <PwaInstallButton kind="customer" compact />
    </div>
    <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '20px' }}>
      <div style={{ position: 'absolute', inset: '-14px', borderRadius: '30px', background: 'radial-gradient(circle, rgba(211,191,162,0.22), transparent 70%)', filter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: '#f7f3eb', borderRadius: 20, padding: '10px 16px', boxShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.35) inset' }}>
        <img src={PRATYEKSHAA_LOGO} alt="Pratyeksha" style={{ width: 150, maxWidth: '58vw', height: 'auto', display: 'block' }} />
      </div>
    </div>
    <div style={{ fontFamily: PX.serif, fontSize: '1.7rem', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.3px', background: 'linear-gradient(180deg,#f3e8d2,#d3bfa2 70%,#b99f78)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 6px' }}>{restaurantName || 'Restaurant'}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
      <span style={{ width: 34, height: 1, background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.6))' }} />
      <Sparkles size={11} color="#d3bfa2" />
      <span style={{ width: 34, height: 1, background: 'linear-gradient(90deg, rgba(211,191,162,0.6), transparent)' }} />
    </div>
  </div>
);

// Animated success header used by the confirmation screens.
const SuccessHero = ({ icon: Icon = CheckCircle2, title, subtitle }) => (
  <div style={{ textAlign: 'center', marginBottom: '26px' }}>
    <div style={{ position: 'relative', width: 92, height: 92, margin: '0 auto 22px' }}>
      <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: 'radial-gradient(circle, rgba(211,191,162,0.28), transparent 68%)', animation: 'pxBreath 3.2s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', padding: 2, background: 'conic-gradient(from 0deg, transparent 0 50%, #d3bfa2 80%, transparent 100%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', animation: 'pxOrbit 3.2s linear infinite' }} />
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
        style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: PX.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(211,191,162,0.35), inset 0 1px 0 rgba(255,255,255,0.55)' }}>
        <Icon size={30} color="#14110c" strokeWidth={2} />
      </motion.div>
    </div>
    <h1 style={{ fontFamily: PX.serif, fontSize: '1.9rem', fontWeight: 700, color: '#f7f3eb', margin: '0 0 10px', letterSpacing: '-0.4px', lineHeight: 1.15 }}>{title}</h1>
    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.7, margin: '0 auto', maxWidth: 300 }}>{subtitle}</p>
  </div>
);

const PratyekshaPremiumMenu = () => {
  const { tenantId: urlTenantId } = useParams();
  const [restaurantData, setRestaurantData] = useState(null);
  // Set when the server says this table link / session is invalid (or the outlet is gone). Kept separate from restaurantData:
  // the menu fetch re-sets restaurantData and used to silently undo the block, and a null restaurantData only rendered an empty menu.
  const [sessionBlocked, setSessionBlocked] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filterVegOnly, setFilterVegOnly] = useState(true);
  
  const [language, setLanguage] = useState('en'); 
  const [tenantId, setTenantId] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const numberToWordsClient = (num) => {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
             'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
             'Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (!num || num === 0) return 'Zero Only';
  const rounded = Math.round(Number(num));
  if (!Number.isFinite(rounded) || rounded <= 0) return 'Zero Only';
  if (rounded.toString().length > 9) return 'Overflow';
  const n = ('000000000' + rounded).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  
  if (!n) return '';
  let str = '';
  str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
  str += n[5] != 0 ? (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + ' ' : '';
  return str.replace(/\s+/g, ' ').trim() + ' Only';
};
  // ADD near your other state declarations — generates a random 6-char alphanumeric token
const generateToken = useCallback(() => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars (0,O,I,1)
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}, []);

// Store token per session so it doesn't regenerate on re-render
const [sessionToken] = useState(() => {
  let stored = null;
  try { stored = sessionStorage.getItem('pratyeksha_token'); } catch {}
  if (stored) return stored;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const token = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  try { sessionStorage.setItem('pratyeksha_token', token); } catch {}
  return token;
});

const [orderPlacedAt, setOrderPlacedAt] = useState(null);
const [prepPct, setPrepPct] = useState(0);
const [cartUnavailableItems, setCartUnavailableItems] = useState([]);
const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
const [servingFromCache, setServingFromCache] = useState(false);

// ── OFFLINE MENU BROWSING — register the service worker once, and track
// online/offline transitions so we can show a subtle "browsing saved menu" note ──
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  const goOnline = () => { setIsOffline(false); setServingFromCache(false); };
  const goOffline = () => { setIsOffline(true); };
  window.addEventListener('online', goOnline);
  window.addEventListener('offline', goOffline);
  return () => {
    window.removeEventListener('online', goOnline);
    window.removeEventListener('offline', goOffline);
  };
}, []);

  const [activeModel, setActiveModel] = useState(null);
const viewOnlyRef = useRef(false);
const [tableRole, setTableRole] = useState(null); // 'free' | 'owner' | 'viewer' | 'invalid' | null (not checked yet)
const [cart, setCartRaw] = useState({});
// Single choke-point for every add-to-cart: a view-only guest cannot put anything in the cart (clearing it is allowed).
const setCart = (v) => {
  if (viewOnlyRef.current && !(v && typeof v === 'object' && Object.keys(v).length === 0)) {
    window.dispatchEvent(new CustomEvent('pratyeksha:table-locked', { detail: { code: 'TABLE_LOCKED', soft: true } }));
    return;
  }
  setCartRaw(v);
};
const [cartStockWarning, setCartStockWarning] = useState(null); // { itemId, itemName }
const cartRef = useRef({});
const extraSendingRef = useRef(false);
useEffect(() => { cartRef.current = cart; }, [cart]);
 const [suggestions, setSuggestions] = useState({}); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [waiterCounts, setWaiterCounts] = useState({ spoon: 0, fork: 0, plates: 0, tissue: 0 });
const [orderEta, setOrderEta] = useState(null);
const etaRefreshRef = useRef(null);
  const [hasPlacedInitialOrder, setHasPlacedInitialOrder] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [approvedCustomerBill, setApprovedCustomerBill] = useState(null);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [placedOrders, setPlacedOrders] = useState([]); // To store actual items for bill calculation
  const [liveOrderStatuses, setLiveOrderStatuses] = useState({}); 
  const [orderTrackingPanelOpen, setOrderTrackingPanelOpen] = useState(false);
  const [orderPlacedScreen, setOrderPlacedScreen] = useState(false);
  // 2-minute "change my order" window after placing a dine-in order
  const [modifiable, setModifiable] = useState(null);          // { orderId, deadline(ms, client clock), items }
  const [modifyingOrderId, setModifyingOrderId] = useState(null);
  const [modifyTick, setModifyTick] = useState(Date.now());
const [isPlacingOrder, _setIsPlacingOrder] = useState(false);
const placingRef = useRef(false);
const setIsPlacingOrder = (v) => { placingRef.current = !!v; _setIsPlacingOrder(!!v); };
// The "order placed" screen auto-hides, but each placement used to start its own uncancelled timer: a second order placed
// within 60 s had its confirmation screen dismissed early by the FIRST order's timer (and timers fired after unmount).
const placedScreenTimer = useRef(null);
const showPlacedScreen = (ms) => {
  setOrderPlacedScreen(true);
  if (placedScreenTimer.current) clearTimeout(placedScreenTimer.current);
  placedScreenTimer.current = setTimeout(() => setOrderPlacedScreen(false), ms);
};
useEffect(() => () => { if (placedScreenTimer.current) clearTimeout(placedScreenTimer.current); }, []);
// { orderId: 'pending' | 'ready' | 'served' }

  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' });

const navRef = useRef(null);
const activeTabRef = useRef(null);
const nameInputRef = useRef(null);   // ← ADD
const phoneInputRef = useRef(null);  // ← ADD


const [isExtraItemsOpen, setIsExtraItemsOpen] = useState(false);
const [extraItems, setExtraItems] = useState([]);
const [extraItemsLoading, setExtraItemsLoading] = useState(false);
const [extraItemCart, setExtraItemCart] = useState({}); // { itemId: qty }
const [activeExtraCategory, setActiveExtraCategory] = useState('All');
const [extraItemSearchQuery, setExtraItemSearchQuery] = useState('');
// ── SMART VOICE ──
const [speakingItemId, setSpeakingItemId]   = useState(null);  // which dish is speaking
const [voicePaused,   setVoicePaused]       = useState(false);
const [voiceLang,     setVoiceLang]         = useState('en-IN'); // en-IN | hi-IN | mr-IN
const speechRef = useRef(null); // holds current SpeechSynthesisUtterance
const [spokenText, setSpokenText] = useState(''); // text currently being spoken — shown in UI
const [reservationDate, setReservationDate] = useState('');
const [reservationTime, setReservationTime] = useState('');
const [specialRequests, setSpecialRequests] = useState('');
const [tablePreference, setTablePreference] = useState('');
const [reservationAskOrder, setReservationAskOrder] = useState(false);

const [currentSpeechWordIndex, setCurrentSpeechWordIndex] = useState(-1);
const [customerPhone, setCustomerPhone] = useState('');
const [activeAnnouncement, setActiveAnnouncement] = useState(null);
const [announcementDismissed, setAnnouncementDismissed] = useState(false);
// true = show the "want to pre-order?" prompt after reservation fields filled

// ── COUNTER / WAITLIST MODE ──
const [counterMode, setCounterMode] = useState(null); // null | 'dine-in' | 'pickup'
const [isCounterScan, setIsCounterScan] = useState(false);
const [hasQrSession, setHasQrSession] = useState(false);
// REPLACE the existing sessionId useState:
const [sessionId, setSessionId] = useState(() => {
  // Always generate fresh — session validity checked against backend
  let stored = null;
  try { stored = sessionStorage.getItem('pratyeksha_session'); } catch {}
  if (stored) return stored;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try { sessionStorage.setItem('pratyeksha_session', id); } catch {}
  return id;
});


const [comboSuggestions, setComboSuggestions] = useState([]);
const [showComboStrip, setShowComboStrip] = useState(false);

const [welcomeCard, setWelcomeCard]         = useState(null);
const [recommendedDishes, setRecommendedDishes] = useState([]); // smart dish suggestions for welcome card
// null | { name, lastVisit, lastOrderItems, favDish, visitCount }
const [welcomePhone, setWelcomePhone]       = useState('');
const [welcomePhoneInput, setWelcomePhoneInput] = useState('');
const [welcomeLoading, setWelcomeLoading]   = useState(false);
const [welcomeDismissed, setWelcomeDismissed] = useState(false);
const [showPhonePrompt, setShowPhonePrompt] = useState(false);

const scrollRef = useRef(null);
const preserveScroll = (fn) => {
  const y = scrollRef.current?.scrollTop || 0;
  fn();
  requestAnimationFrame(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = y;
  });
};



const [searchResultCategory, setSearchResultCategory] = useState(null);
// When user selects a search result from a different category, we jump to it
const [reorderConfirmPending, setReorderConfirmPending] = useState(false);

const [waitlistEntry, setWaitlistEntry] = useState(null);
const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const customerInfoDraftRef = useRef({ name: '', phone: '' });
const [savedCustomer, setSavedCustomer] = useState(null);
const [legalSheet, setLegalSheet] = useState({ open: false, tab: 'privacy' });
const [guestConsent, setGuestConsentState] = useState(false);
const [identityEditing, setIdentityEditing] = useState(false);
const [partySize, setPartySize] = useState(1);
const [scheduledPickupTime, setScheduledPickupTime] = useState('');
const [registrationStep, setRegistrationStep] = useState('mode'); // 'mode' | 'register' | 'menu' | 'confirm'
const [avgWaitData, setAvgWaitData] = useState(null);
const [notificationBanner, setNotificationBanner] = useState(null); // { type: 'table'|'pickup', tableNumber, restaurantName }
const [pushPermissionAsked, setPushPermissionAsked] = useState(false);
const waitlistSocket = useMemo(() => io(SOCKET_BASE_URL, { transports: ['websocket', 'polling'], reconnection: true }), []);
  const t = {
    en: {
      all: "ALL",
      poweredBy: "Powered by",
      table: "Table",
      chefChoice: "CHEF'S CHOICE",
      add: "ADD",
      addHalf: "ADD HALF",
      addFull: "ADD FULL",
      half: "Half",
      full: "Full",
      view3d: "3D",
      roundOrder: "Round Order",
      emptyRound: "Round is empty.",
      orderNow: "ORDER NOW",
      viewFinalBill: "View Final Bill →",
      checkout: "Checkout",
      enterDetails: "Enter details for your automated digital receipt.",
      fullName: "Full Name",
      mobileNumber: "Mobile Number",
      generateBill: "GENERATE BILL",
      thankYou: "Thank You!",
      receiptSent: "Receipt notification sent. Keep it digital, keep it clean.",
      visitAgain: "Visit us again!",
      rateGoogle: "Rate us on Google",
      backMenu: "BACK TO MENU",
      orderSuccess: "Order sent to kitchen!",
      orderError: "Error sending order.",
      detailsReq: "Details required.",
      spiceHigh: "HIGH",
      spiceMed: "MEDIUM",
      spiceLow: "LOW",
      notes: "Less spicy, no onion etc...",
      viewInSpace: "VIEW IN YOUR SPACE",
      zoomRotate: "Pinch to zoom • Drag to rotate",
      searchPlaceholder: "Search dishes...",
      callWaiter: "Request Service",
      waiterSuccess: "Request sent to staff!",
      spoon: "Spoons",
      fork: "Forks",
      plates: "Empty Plates",
      tissue: "Tissues",
      clean: "Clean Table",
      other: "Other Request",
      sendRequest: "SEND REQUEST",
      ingredients: "Ingredients",
      billSummary: "Bill Summary",
      continue: "Continue to Feedback",
      qty: "Qty",
      amt: "Amt",
      grandTotal: "Grand Total"
    },
    mr: {
      all: "सर्व",
      poweredBy: "द्वारे समर्थित",
      table: "टेबल क्रमांक",
      chefChoice: "शेफची पसंती",
      add: "निवडा",
      addHalf: "हाफ घ्या",
      addFull: "फुल घ्या",
      half: "हाफ",
      full: "फुल",
      view3d: "३डी",
      roundOrder: "तुमची ऑर्डर",
      emptyRound: "तुमची ऑर्डर रिकामी आहे.",
      orderNow: "ऑर्डर पाठवा",
      viewFinalBill: "बिलाची माहिती →",
      checkout: "चेकआउट",
      enterDetails: "डिजिटल पावतीसाठी तुमची माहिती भरा.",
      fullName: "पूर्ण नाव",
      mobileNumber: "मोबाईल नंबर",
      generateBill: "बिल मागा",
      thankYou: "धन्यवाद!",
      receiptSent: "बिलाची माहिती पाठवली आहे. कृपया डिजिटल रहा.",
      visitAgain: "पुन्हा नक्की या!",
      rateGoogle: "आम्हाला गुगलवर रेट करा",
      backMenu: "मेनूकडे परत जा",
      orderSuccess: "ऑर्डर किचनमध्ये पाठवली आहे!",
      orderError: "ऑर्डर पाठवताना समस्या आली.",
      detailsReq: "माहिती भरणे आवश्यक आहे.",
      spiceHigh: "जास्त तिखट",
      spiceMed: "मध्यम तिखट",
      spiceLow: "कमी तिखट",
      notes: "तुमच्या आवडीनुसार सूचना...",
      viewInSpace: "तुमच्या जागेत पहा",
      zoomRotate: "झूम करण्यासाठी पिंच करा • फिरवण्यासाठी ड्रॅग करा",
      searchPlaceholder: "पदार्थ शोधा...",
      callWaiter: "सेवा विनंती",
      waiterSuccess: "सूचना पाठवण्यात आली आहे!",
      spoon: "चमचे",
      fork: "काटा चमचे",
      plates: "रिकाम्या प्लेट्स",
      tissue: "टिश्यू",
      clean: "टेबल साफ करा",
      other: "इतर काही",
      sendRequest: "विनंती पाठवा",
      ingredients: "साहित्य",
      billSummary: "बिलाचा तपशील",
      continue: "पुढे जा",
      qty: "नग",
      amt: "किंमत",
      grandTotal: "एकूण रक्कम"
    }
  };

  // =========================================================================
  // ── HOOK CONFIGURATIONS (ALL HOOKS MUST STAY CONTINUOUSLY AT THE TOP) ──
  // =========================================================================

const filteredMenuItems = useMemo(() => {
  // A query of spaces ("  ") used to count as a 2-character search and matched nothing.
  const sq = searchQuery.trim();
  const isSearching = sq.length >= 2;

return allMenuItems
  .filter(i => {
    const matchesCategory = selectedCategoryId === 'all' || i.categoryId === selectedCategoryId;
    const nameEn = i.name?.toLowerCase() || '';
    const nameMr = i.name_mr || '';
    const matchesSearch = !sq || nameEn.includes(sq.toLowerCase()) || nameMr.includes(sq);
    const matchesVeg = isSearching ? true : (filterVegOnly ? i.isVeg === true : i.isVeg !== true);
    return matchesCategory && matchesSearch && matchesVeg && i.isAvailable !== false;
  })
  .sort((a, b) => {
    // Bestsellers with a rank come first within each category
    const aRank = a.bestsellerRank ?? 999;
    const bRank = b.bestsellerRank ?? 999;
    if (aRank !== bRank) return aRank - bRank;
    // Then by name alphabetically
    return (a.name || '').localeCompare(b.name || '');
  });
}, [allMenuItems, selectedCategoryId, searchQuery, filterVegOnly]);

const cartUnavailableCheck = useMemo(() => {
  if (!cart || Object.keys(cart).length === 0) return [];
  return Object.entries(cart)
    .filter(([key]) => {
      const id = key.split('-')[0];
      const item = allMenuItems.find(m => m._id === id || m._id?.toString() === id);
      return item && item.isAvailable === false;
    })
    .map(([key]) => {
      const id = key.split('-')[0];
      return allMenuItems.find(m => m._id === id || m._id?.toString() === id)?.name || 'Unknown item';
    });
}, [cart, allMenuItems]);

// All matching search results across ALL categories (for search suggestion dropdown)
const globalSearchResults = useMemo(() => {
  const sq = (searchQuery || '').trim();
  if (sq.length < 2) return [];
  const q = sq.toLowerCase();
  return allMenuItems.filter(i => {
    const matchesVeg = filterVegOnly ? i.isVeg === true : i.isVeg !== true;
    return matchesVeg && i.isAvailable !== false &&
      (i.name?.toLowerCase().includes(q) || (i.name_mr || '').includes(sq));
  }).slice(0, 8);
}, [allMenuItems, searchQuery, filterVegOnly]);

  // Join this tenant's live room so the operator can send the approved bill back to this table.
  // Incoming bills are filtered by tenant and table before they are displayed.
  useEffect(() => {
    if (!tenantId) return;
    const joinTenant = () => waitlistSocket.emit('join_restaurant', tenantId);
    const onApprovedBill = (bill) => {
      if (!bill || String(bill.tenantId) !== String(tenantId) || String(bill.tableNumber) !== String(tableNumber)) return;
      setApprovedCustomerBill(bill);
      triggerAlert('Your final bill is ready. Please review the approved total.', 'success');
    };
    waitlistSocket.on('connect', joinTenant);
    if (waitlistSocket.connected) joinTenant();
    waitlistSocket.on('customer_bill_approved', onApprovedBill);
    return () => {
      waitlistSocket.off('connect', joinTenant);
      waitlistSocket.off('customer_bill_approved', onApprovedBill);
    };
  }, [tenantId, tableNumber, waitlistSocket]);

  useEffect(() => {
    if (!isCounterScan || !sessionId) return;
    const joinSession = () => waitlistSocket.emit('join_session', sessionId);
    waitlistSocket.on('connect', joinSession);
    if (waitlistSocket.connected) joinSession();

    waitlistSocket.on('table_assigned', (data) => {
      setNotificationBanner({ type: 'table', tableNumber: data.tableNumber, restaurantName: data.restaurantName });
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    });
    waitlistSocket.on('reservation_seated', (data) => {
      setNotificationBanner({ type: 'table', tableNumber: data.tableNumber, restaurantName: data.restaurantName });
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    });
    waitlistSocket.on('pickup_ready', (data) => {
      setNotificationBanner({ type: 'pickup', restaurantName: data.restaurantName });
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    });
    waitlistSocket.on('position_updated', (data) => {
      setWaitlistEntry(prev => prev ? { ...prev, waitlistPosition: data.position } : prev);
      setAvgWaitData(prev => prev ? { ...prev, estimatedWait: data.estimatedWait } : prev);
    });
    waitlistSocket.on('pickup_reminder', (data) => {
      triggerAlert(data.restaurantName ? `Your pickup will be ready in ~10 min at ${data.restaurantName}!` : 'Order ready soon!', 'success');
    });

waitlistSocket.on('reservation_confirmed', (data) => {
  setWaitlistEntry(prev => prev ? { ...prev, status: 'confirmed' } : prev);
  setNotificationBanner({ type: 'reservation_confirmed', restaurantName: data.restaurantName, time: data.reservationTime });
});

waitlistSocket.on('announcement_updated', (data) => {
  setActiveAnnouncement(data.announcement);
  setAnnouncementDismissed(false);
});
waitlistSocket.on('announcement_ended', () => {
  setActiveAnnouncement(null);
});
// ── Operator manual push → browser notification on customer device ──
waitlistSocket.on('operator_notify', (data) => {
  // Show browser / push notification
  const fireNotification = (title, body, tag, event) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      safeNotify(title, {
        body,
        event,
        tag: tag || 'operator-notify',
        renotify: true,
        vibrate: [200, 100, 200]
      });
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          safeNotify(title, {
            body,
            event,
            tag: tag || 'operator-notify',
            renotify: true,
          });
        }
      });
    }
  };

  const { title, body, tag, type } = data;
  const notifEvent = data.event || (type === 'waitlist' ? 'waitlist-update' : type === 'pickup' ? 'pickup-ready' : 'reservation-update');

  // Fire the notification
  fireNotification(
    title || (type === 'waitlist' ? 'Table Almost Ready!' : type === 'pickup' ? 'Pickup Ready!' : 'Reservation Update'),
    body || 'Please check with the staff.',
    tag,
    notifEvent
  );

  // Also show in-app alert for waitlist type
  if (type === 'waitlist') {
    triggerAlert(body || 'Your table is almost ready — please stay nearby!', 'success');
  }
});

return () => {
  waitlistSocket.off('table_assigned');
  waitlistSocket.off('reservation_seated');
  waitlistSocket.off('pickup_ready');
  waitlistSocket.off('position_updated');
  waitlistSocket.off('pickup_reminder');
  waitlistSocket.off('reservation_confirmed');
  waitlistSocket.off('operator_notify');
  waitlistSocket.off('announcement_updated');
  waitlistSocket.off('announcement_ended');
  waitlistSocket.off('connect', joinSession);
};  }, [isCounterScan, sessionId, waitlistSocket]);
// REPLACE the existing useEffect that has:
// "axios.get(`${BASE_URL}/waitlist/session/${activeTenant}/${sessionId}`)"

useEffect(() => {
  let cancelled = false;
  const activeTenant = urlTenantId || 'jay_ambe_fusion';
  setTenantId(activeTenant);
  const params = new URLSearchParams(window.location.search);
  const tableParam = params.get('table');

  if (tableParam) {
    setTableNumber(tableParam);
    setIsCounterScan(false);
    setHasQrSession(true);
    try {
      sessionStorage.setItem('pratyeksha_qr_session', JSON.stringify({ tenantId: activeTenant, tableNumber: tableParam, sig: params.get('sig') || '', startedAt: Date.now() }));
    } catch {}
  } else {
    setTableNumber('Counter');
    setIsCounterScan(true);
    setHasQrSession(false);
    try { sessionStorage.removeItem('pratyeksha_qr_session'); } catch {}

    axios.get(`${BASE_URL}/waitlist/avg-wait/${activeTenant}`)
      .then(r => { if (!cancelled) setAvgWaitData(r.data); })
      .catch(() => {});

    axios.get(`${BASE_URL}/waitlist/session/${activeTenant}/${sessionId}`)
      .then(r => {
        if (cancelled) return;
        if (r.data && ['waiting', 'pickup-ready'].includes(r.data.status)) {
          setWaitlistEntry(r.data);
          setCounterMode(r.data.mode);
          setRegistrationStep('confirm');
          return;
        }

        return axios.get(`${BASE_URL}/reservations/session/${activeTenant}/${sessionId}`)
          .then(rr => {
            if (cancelled) return;
            if (rr.data && ['pending','confirmed'].includes(rr.data.status)) {
              setWaitlistEntry({ ...rr.data, mode: 'reservation' });
              setCounterMode('reservation');
              setRegistrationStep('confirm');
              return;
            }

            // Never wipe a registration that the customer has already started.
            if (customerInfoDraftRef.current.name || customerInfoDraftRef.current.phone) return;

            try { sessionStorage.removeItem('pratyeksha_session'); } catch {}
            const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            try { sessionStorage.setItem('pratyeksha_session', newId); } catch {}
            setWaitlistEntry(null);
            setCounterMode(null);
            setRegistrationStep('mode');
            customerInfoDraftRef.current = { name: '', phone: '' };
            setCustomerInfo({ name: '', phone: '' });
            setPartySize(1);
            setScheduledPickupTime('');
          })
          .catch(() => {
            if (cancelled || customerInfoDraftRef.current.name || customerInfoDraftRef.current.phone) return;
            try { sessionStorage.removeItem('pratyeksha_session'); } catch {}
            const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            try { sessionStorage.setItem('pratyeksha_session', newId); } catch {}
            setWaitlistEntry(null);
            setCounterMode(null);
            setRegistrationStep('mode');
            customerInfoDraftRef.current = { name: '', phone: '' };
            setCustomerInfo({ name: '', phone: '' });
            setPartySize(1);
            setScheduledPickupTime('');
          });
      })
      .catch(() => {
        if (cancelled || customerInfoDraftRef.current.name || customerInfoDraftRef.current.phone) return;
        try { sessionStorage.removeItem('pratyeksha_session'); } catch {}
        const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        try { sessionStorage.setItem('pratyeksha_session', newId); } catch {}
        setWaitlistEntry(null);
        setCounterMode(null);
        setRegistrationStep('mode');
        customerInfoDraftRef.current = { name: '', phone: '' };
        setCustomerInfo({ name: '', phone: '' });
        setPartySize(1);
        setScheduledPickupTime('');
      });
  }

  return () => { cancelled = true; };
}, [urlTenantId, sessionId]); 

// ── GUEST PRIVACY HELPERS (DPDP) ──
useEffect(() => { if (tenantId) setGuestConsentState(!!getGuestConsent(tenantId)); }, [tenantId]);
const openLegal = (tab = 'privacy') => setLegalSheet({ open: true, tab });
const toggleGuestConsent = (on) => {
  setGuestConsentState(!!on);
  if (on) setGuestConsent(tenantId);
  else { try { localStorage.removeItem(`pratyeksha_consent_${tenantId}`); } catch {} }
};
// Name/mobile are only ever sent to the server once the guest has agreed to the privacy notice.
const upsertGuest = (payload) => {
  const tid = payload?.tenantId || tenantId;
  const consent = getGuestConsent(tid);
  if (!consent) return Promise.resolve(null);
  const phone = String(payload?.phone || '').replace(/\D/g, '').slice(-10);
  return axios.post(`${BASE_URL}/customers/upsert`, { ...payload, consentVersion: consent.version })
    .then(r => { if (r.data?.erasureToken) setGuestToken(tid, phone, r.data.erasureToken); return r; });
};
// Once-per-table-session bookkeeping so a visit, the spend and the dish counts are each recorded exactly once.
const creditKey = () => `pratyeksha_credit_${tenantId}_${tableNumber || 'x'}`;
const getCredit = () => { try { return { visit: false, spend: 0, dishes: false, ...(JSON.parse(sessionStorage.getItem(creditKey()) || '{}')) }; } catch { return { visit: false, spend: 0, dishes: false }; } };
const addCredit = (patch) => { const c = getCredit(); const next = { visit: c.visit || !!patch.visit, spend: c.spend + (Number(patch.spend) || 0), dishes: c.dishes || !!patch.dishes }; try { sessionStorage.setItem(creditKey(), JSON.stringify(next)); } catch {} return next; };
const resetCredit = () => { try { sessionStorage.removeItem(creditKey()); } catch {} };
const forgetGuestIdentity = () => {
  try {
    localStorage.removeItem(`pratyeksha_customer_history_${tenantId}`);
    localStorage.removeItem(`pratyeksha_phone_${tenantId}`);
  } catch {}
  setSavedCustomer(null); setWelcomeCard(null); setWelcomePhone('');
  customerInfoDraftRef.current = { name: '', phone: '' };
  setCustomerInfo({ name: '', phone: '' }); setCustomerPhone('');
  setIdentityEditing(true);
};
const onGuestErased = () => {
  forgetGuestIdentity();
  setGuestConsentState(false);
  resetCredit();
};

// ── RETURNING CUSTOMER HISTORY ──
// Keep the existing backend customer record as the source of truth, while storing
// the last confirmed identity locally so a returning guest can view a bill without
// typing their name/phone again. This is scoped per tenant and never grants ordering.
useEffect(() => {
  if (!tenantId) return;
  try {
    const raw = localStorage.getItem(`pratyeksha_customer_history_${tenantId}`);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const phone = String(parsed?.phone || '').replace(/\D/g, '');
    if (parsed?.name && phone.length === 10) {
      const customer = { name: parsed.name, phone };
      setSavedCustomer(customer);
      setCustomerInfo(prev => (prev.name || prev.phone) ? prev : customer);
      setCustomerPhone(phone);
    }
  } catch {}
}, [tenantId]);

useEffect(() => {
  const phone = String(customerInfo.phone || '').replace(/\D/g, '');
  const name = String(customerInfo.name || '').trim();
  if (!tenantId || !name || phone.length !== 10) return;
  const customer = { name, phone };
  setSavedCustomer(customer);
  setCustomerPhone(phone);
  try { localStorage.setItem(`pratyeksha_customer_history_${tenantId}`, JSON.stringify(customer)); } catch {}
}, [tenantId, customerInfo.name, customerInfo.phone]);

useEffect(() => {
  if (!isBillOpen || !savedCustomer || customerInfo.name || customerInfo.phone) return;
  setCustomerInfo(savedCustomer);
  setCustomerPhone(savedCustomer.phone);
}, [isBillOpen, savedCustomer]);

// A remembered guest is never asked again: if anything cleared the form (e.g. a stale session reset), restore it.
useEffect(() => {
  if (!savedCustomer || identityEditing) return;
  if (customerInfo.name || customerInfo.phone) return;
  setCustomerInfo(savedCustomer);
  setCustomerPhone(savedCustomer.phone);
}, [savedCustomer, identityEditing, customerInfo.name, customerInfo.phone]);

// A guest recognised by mobile number at the table (QR) is already known — remember them so the bill never asks again.
useEffect(() => {
  if (!tenantId || !welcomeCard?.name || !welcomePhone || welcomePhone.length !== 10) return;
  const customer = { name: String(welcomeCard.name).trim(), phone: welcomePhone };
  if (!customer.name || customer.name === 'Guest') return;
  setSavedCustomer(prev => (prev && prev.name === customer.name && prev.phone === customer.phone) ? prev : customer);
  setCustomerInfo(prev => (prev.name || prev.phone) ? prev : customer);
  setCustomerPhone(welcomePhone);
  try { localStorage.setItem(`pratyeksha_customer_history_${tenantId}`, JSON.stringify(customer)); } catch {}
}, [tenantId, welcomeCard?.name, welcomePhone]);

useEffect(() => {
  if (!isBillOpen || customerInfo.phone || !tenantId) return;
  let p = '';
  try { p = localStorage.getItem(`pratyeksha_phone_${tenantId}`) || ''; } catch {}
  if (p.length === 10) setCustomerInfo(prev => prev.phone ? prev : { ...prev, phone: p });
}, [isBillOpen, tenantId]);

useEffect(() => {
  if (!tenantId || !savedCustomer?.phone) return;
  // Existing notification permission is enough to silently refresh the subscription.
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  registerCustomerPushSubscription(savedCustomer.phone);
}, [tenantId, savedCustomer?.phone]);

useEffect(() => {
  if (!tenantId) return;
  axios.get(`${BASE_URL}/announcements/${tenantId}/active`)
    .then(r => {
      if (!r.data?.active) return;
      const ann = r.data.announcement;
      setActiveAnnouncement(ann);
      // Only count as a view once per browser session per announcement
      const seenKey = `ann_seen_${ann._id}`;
      let seen = false;
      try { seen = !!sessionStorage.getItem(seenKey); if (!seen) sessionStorage.setItem(seenKey, '1'); } catch {}
      if (!seen) {
        axios.post(`${BASE_URL}/announcements/${ann._id}/view`, { tenantId: ann.tenantId }).catch(() => {});
      }
    })
    .catch(() => {});
}, [tenantId]);

  // Browser notification for the full-screen banner. It used to run during render, re-firing on every re-render.
  useEffect(() => {
    if (!notificationBanner || !('Notification' in window)) return;
    const isTableBanner = notificationBanner.type === 'table';
    const isResBanner = notificationBanner.type === 'reservation_confirmed';
    const send = () => {
      // The reservation-confirmed banner used to fire the "order is ready" notification.
      safeNotify(
        isResBanner ? 'तुमचे आरक्षण निश्चित झाले! | Reservation confirmed!' : isTableBanner ? 'आपले टेबल तयार आहे! | Your table is ready!' : 'तुमची ऑर्डर तयार आहे! | Your order is ready!',
        {
          body: isResBanner
            ? `Your table at ${notificationBanner.restaurantName} is confirmed.`
            : isTableBanner
            ? `Table ${notificationBanner.tableNumber} at ${notificationBanner.restaurantName} is ready for you.`
            : `Please collect your order at ${notificationBanner.restaurantName}.`,
          event: isResBanner ? 'reservation-confirmed' : isTableBanner ? 'table-ready' : 'pickup-ready',
          vibrate: [300, 100, 300], tag: 'pratyeksha-ready', renotify: true
        }
      );
    };
    try {
      if (Notification.permission === 'granted') send();
      else if (Notification.permission !== 'denied') Notification.requestPermission().then(p => { if (p === 'granted') send(); });
    } catch { /* some mobile browsers throw on new Notification(); the on-screen banner still shows */ }
  }, [notificationBanner]);

  // =========================================================================
  // ── CONDITIONAL RENDER LAYOUTS (MUST ALWAYS GO AFTER ALL HOOK DECLARATIONS) ──
  // =========================================================================

  // 1. Fullscreen Notification Banner Overlay.
// Built here but RETURNED only after the last hook. Returning early skipped ~20 hooks and crashed the app
// ("Rendered fewer hooks than expected") the moment a banner arrived.
const notificationBannerView = !notificationBanner ? null : (() => {
const isTable       = notificationBanner.type === 'table';
const isReservation = notificationBanner.type === 'reservation_confirmed';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0c0c0c',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '40px 24px', textAlign: 'center',
      fontFamily: 'Poppins, sans-serif',
      overflow: 'hidden'
    }}>

      {/* Ambient glow ring */}
      <div style={{
        position: 'absolute',
        width: '320px', height: '320px',
        borderRadius: '50%',
        background: isTable
          ? 'radial-gradient(circle, rgba(211,191,162,0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(180,160,120,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Creative picture for this notification + brand icon (logo on its background) */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '340px', marginBottom: '44px' }}>
        <img
          src={notifImage(isReservation ? 'reservation-confirmed' : isTable ? 'table-ready' : 'pickup-ready')}
          alt=""
          style={{ width: '100%', aspectRatio: '2 / 1', objectFit: 'cover', borderRadius: '20px', border: '1px solid rgba(211,191,162,0.22)', display: 'block' }}
        />
        <img
          src={NOTIF_ICON}
          alt="Pratyeksha"
          style={{ position: 'absolute', left: '50%', bottom: '-24px', transform: 'translateX(-50%)', width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #0c0c0c', boxShadow: '0 4px 18px rgba(0,0,0,0.5)' }}
        />
      </div>

      {/* Marathi headline */}
      <p style={{
        fontSize: '0.58rem', fontWeight: '900', letterSpacing: '3px',
        color: 'rgba(211,191,162,0.62)', textTransform: 'uppercase',
        marginBottom: '12px', margin: '0 0 12px'
      }}>
        {notificationBanner.restaurantName?.toUpperCase()}
      </p>

      <h1 style={{
        fontSize: '1.9rem', fontWeight: '900',
        color: '#d3bfa2',
        marginBottom: '6px', lineHeight: 1.2,
        letterSpacing: '-0.5px'
      }}>
        {isReservation ? 'तुमचे आरक्षण' : isTable ? 'आपले टेबल' : 'तुमची ऑर्डर'}
        <br />
        <span style={{ color: '#fff' }}>
          {isReservation ? 'निश्चित झाले!' : 'तयार आहे!'}
        </span>
      </h1>

      <h2 style={{
        fontSize: '0.9rem', fontWeight: '500',
        color: 'rgba(255,255,255,0.52)',
        marginBottom: '40px', lineHeight: 1.5,
        letterSpacing: '0.2px'
      }}>
        {isReservation ? 'Your reservation is confirmed' : isTable ? 'Your table is ready' : 'Your order is ready for pickup'}
      </h2>

      {/* Detail card */}
      <div style={{
        background: 'rgba(211,191,162,0.05)',
        border: '1px solid rgba(211,191,162,0.12)',
        borderRadius: '20px',
        padding: '22px 32px',
        marginBottom: '36px',
        width: '100%', maxWidth: '320px'
      }}>
        <p style={{
          fontSize: '0.58rem', fontWeight: '900', letterSpacing: '2px',
          color: 'rgba(211,191,162,0.62)', textTransform: 'uppercase',
          marginBottom: '10px', margin: '0 0 10px'
        }}>
          {isReservation ? 'Reservation Time' : isTable ? 'Table Number' : 'Pickup Location'}
        </p>
        <p style={{
          fontSize: isTable ? '2.8rem' : '1.2rem',
          fontWeight: '900', color: '#d3bfa2',
          fontFamily: 'monospace', letterSpacing: isTable ? '-2px' : '0',
          margin: '0 0 6px', lineHeight: 1
        }}>
          {isReservation
            ? (notificationBanner.time ? (() => { const d = new Date(notificationBanner.time); return isNaN(d) ? String(notificationBanner.time) : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }); })() : 'Confirmed')
            : isTable ? `T${notificationBanner.tableNumber}` : 'Counter'}
        </p>
        <p style={{
          fontSize: '0.72rem', color: 'rgba(255,255,255,0.52)',
          margin: 0, fontWeight: '600'
        }}>
          {isReservation
            ? 'वेळेवर या — आम्ही तुमची वाट पाहत आहोत'
            : isTable
            ? `टेबल नंबर ${notificationBanner.tableNumber} वर जा`
            : 'काउंटरवर येऊन ऑर्डर घ्या'}
        </p>
      </div>

      {/* CTA button */}
      <button type="button"
onClick={() => setNotificationBanner(null)}
        style={{
          width: '100%', maxWidth: '320px',
          padding: '18px 40px',
          background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
          color: '#0c0c0c', border: 'none', borderRadius: '16px',
          fontSize: '0.88rem', fontWeight: '900', cursor: 'pointer',
          letterSpacing: '1px', textTransform: 'uppercase',
          boxShadow: '0 8px 32px rgba(211,191,162,0.15)'
        }}
      >
        {isReservation
          ? 'Got it →'
          : isTable
          ? `Go to Table ${notificationBanner.tableNumber} →`
          : "I'm On My Way →"}
      </button>

      {/* Subtext */}
      <p style={{
        marginTop: '16px', fontSize: '0.68rem',
        color: 'rgba(255,255,255,0.52)', fontWeight: '600',
        letterSpacing: '0.3px'
      }}>
        {isReservation
          ? 'See you soon!'
          : isTable
          ? 'Your pre-order is already in the kitchen'
          : 'Please proceed to the counter'}
      </p>

    </div>
  );
})();

  
  // 2. Counter Screen Flow Router Check
  const convertToMrNumber = (number) => {
    if (language === 'en') return number;
    const mrDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return number.toString().split('').map(d => isNaN(d) ? d : mrDigits[d]).join('');
  };

  const alertTimerRef = useRef(null);
  useEffect(() => () => { if (alertTimerRef.current) clearTimeout(alertTimerRef.current); }, []);
  const triggerAlert = (msgKey, type = 'success') => {
    setAlert({ show: true, msg: (t[language] && t[language][msgKey]) || msgKey, type });
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setAlert({ show: false, msg: '', type: 'success' }), 4000);
  };
// ── SMART VOICE: speak dish details ──

// ── Sync voiceLang whenever the user changes the UI language ──
useEffect(() => {
  setVoiceLang(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN');
}, [language]);

// ═══════════════════════════════════════════════════════════════
// PRATYEKSHA SMART DISH VOICE
// Indian English • Hindi • Marathi
// Uses only real menu data — never speaks price.
// ═══════════════════════════════════════════════════════════════

const stopSpeech = () => {
  if (
    typeof window !== 'undefined' &&
    window.speechSynthesis
  ) {
    window.speechSynthesis.cancel();
  }

  setSpeakingItemId(null);
  setVoicePaused(false);
  setCurrentSpeechWordIndex(-1);
  speechRef.current = null;
};

// Keep voice language synchronized with the selected menu language.
useEffect(() => {
  setVoiceLang(
    language === 'mr'
      ? 'mr-IN'
      : language === 'hi'
        ? 'hi-IN'
        : 'en-IN'
  );
}, [language]);

const cleanSentence = (value = '') =>
  String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.]+$/, '');

const getDishName = (item, lang) => {
  if (lang === 'mr-IN') {
    return item.name_mr || item.name;
  }

  // Keep English dish names in Hindi because Indian TTS
  // generally pronounces restaurant dish names more naturally.
  return item.name;
};

const getIngredients = (item, lang) => {
  if (lang === 'mr-IN') {
    return item.ingredients?.mr?.length
      ? item.ingredients.mr.slice(0, 5)
      : item.ingredients?.en?.slice(0, 5) || [];
  }

  if (lang === 'hi-IN') {
    return item.ingredients?.hi?.length
      ? item.ingredients.hi.slice(0, 5)
      : item.ingredients?.en?.slice(0, 5) || [];
  }

  return item.ingredients?.en?.slice(0, 5) || [];
};

// Prefer translated descriptions when the database provides them.
// Falls back safely to the existing English description.
const getDescription = (item, lang) => {
  if (lang === 'mr-IN') {
    return cleanSentence(
      item.description_mr ||
      item.descriptionMarathi ||
      item.description?.mr ||
      item.description
    );
  }

  if (lang === 'hi-IN') {
    return cleanSentence(
      item.description_hi ||
      item.descriptionHindi ||
      item.description?.hi ||
      item.description
    );
  }

  return cleanSentence(item.description);
};

const getSpiceLevel = (item, lang) => {
  const raw = String(item.spicylevel || '').toLowerCase();

  if (lang === 'hi-IN') {
    return {
      high: 'बहुत तीखा',
      medium: 'मध्यम तीखा',
      low: 'हल्का तीखा',
      mild: 'हल्का',
      none: 'बिल्कुल तीखा नहीं'
    }[raw] || item.spicylevel;
  }

  if (lang === 'mr-IN') {
    return {
      high: 'जास्त तिखट',
      medium: 'मध्यम तिखट',
      low: 'कमी तिखट',
      mild: 'सौम्य',
      none: 'अजिबात तिखट नाही'
    }[raw] || item.spicylevel;
  }

  return {
    high: 'high',
    medium: 'medium',
    low: 'low',
    mild: 'mild',
    none: 'not spicy'
  }[raw] || item.spicylevel;
};

// ─────────────────────────────────────────────────────────────
// Find a REAL complementary dish.
//
// Only dishes already present in allMenuItems are considered.
// Menu visibility is respected.
// The current dish itself is excluded.
// ─────────────────────────────────────────────────────────────
const getRecommendedDish = (item) => {
  // Never pair a vegetarian guest's dish (or a veg-only menu) with a non-veg suggestion.
  const wantVeg = filterVegOnly || item.isVeg === true;
  const available = allMenuItems.filter(m =>
    m &&
    m._id !== item._id &&
    m.isAvailable !== false &&
    (!wantVeg || m.isVeg === true)
  );

  if (!available.length) return null;

  const currentCategory = String(item.categoryId || '');

  // Menu items reference their category by `categoryId` (the same field the tabs use). The old lookup only compared
  // `_id` / `id`, so the category name was always empty and every pairing fell through to the generic fallback.
  const catNameOf = (cid) => String(
    categoryList.find(c => String(c.categoryId) === String(cid))?.name ||
    categoryList.find(c => String(c._id) === String(cid))?.name ||
    categoryList.find(c => String(c.id) === String(cid))?.name ||
    ''
  ).toLowerCase();

  // Category-aware combinations.
  // We don't create fake recommendations.
  const currentCategoryName = catNameOf(currentCategory);

  const categoryText = currentCategoryName;

  let preferredCategoryWords = [];

  if (
    categoryText.includes('starter') ||
    categoryText.includes('appetizer')
  ) {
    preferredCategoryWords = ['main course', 'main', 'beverage', 'drink'];
  } else if (
    categoryText.includes('main course') ||
    categoryText.includes('main')
  ) {
    preferredCategoryWords = ['beverage', 'drink', 'dessert'];
  } else if (
    categoryText.includes('dessert')
  ) {
    preferredCategoryWords = ['beverage', 'drink'];
  } else if (
    categoryText.includes('beverage') ||
    categoryText.includes('drink')
  ) {
    preferredCategoryWords = ['dessert', 'starter'];
  }

  const categoryMatch = available.find(m => {
    const cat = catNameOf(m.categoryId);

    return preferredCategoryWords.some(word => cat.includes(word));
  });

  if (categoryMatch) return categoryMatch;

  // Strong fallback: bestseller / chef special.
  return (
    available.find(m =>
      m.isChefSpecial === true ||
      m.isBestSeller === true ||
      m._eng?.quadrant === 'star'
    ) ||
    available[0]
  );
};


const speakDish = (item) => {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    setSpokenText('Voice description is not supported in this browser.');
    return;
  }
 
  // Toggle off if already speaking this dish
  if (speakingItemId === item._id) {
    stopSpeech();
    return;
  }
 
  stopSpeech();
  setSpokenText('');
 
  const recommended = getRecommendedDish(item);
  const lang        = voiceLang;
  const dishName    = getDishName(item, lang);
  const ingredients = getIngredients(item, lang);
  const description = getDescription(item, lang);
  const spice       = getSpiceLevel(item, lang);
  const isBestSeller = item._eng?.quadrant === 'star' || item.isBestSeller === true;
  const isChefSpecial = item.isChefSpecial === true;
  const serves = item.servingSize ? String(item.servingSize) : '';
  const recName = recommended ? getDishName(recommended, lang) : '';
  const restName = restaurantData?.name || 'our restaurant';
 
  // ─────────────────────────────────────────────────────────────────
  // REEL-STYLE INDIAN SCRIPTS
  // Written as a real person would speak — warm, conversational,
  // slightly fast-paced, with natural breathing pauses via commas.
  // Dish names kept as-is so TTS doesn't mangle them.
  // ─────────────────────────────────────────────────────────────────
  const scripts = {
 
    // ── ENGLISH INDIA — warm food-blogger reel tone ──
    'en-IN': () => {
      const hour = new Date().getHours();
      const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const parts = [];
 
      parts.push(`${greet}, and welcome to ${restName}!`);
      parts.push(`Today, let me introduce you to something really special — ${dishName}.`);
 
      if (isBestSeller)
        parts.push(`And honestly? This one is an absolute crowd favourite here. People come back again and again just for this.`);
      else if (isChefSpecial)
        parts.push(`Our chef personally recommends this dish, and trust me — it's made with a lot of love and care.`);
 
      if (item.isVeg !== undefined)
        parts.push(item.isVeg !== false
          ? `It's a beautifully crafted vegetarian dish.`
          : `It's a rich non-vegetarian delicacy.`);
 
      if (serves)
        parts.push(`This portion serves ${serves} people comfortably — perfect for sharing.`);
 
      if (spice)
        parts.push(`The spice level is ${spice}, so it has that perfect kick without being overwhelming.`);
 
      if (ingredients.length)
        parts.push(`It's made with — ${ingredients.join(', ')} — all fresh, all flavourful.`);
 
      if (description)
        parts.push(description);
 
      if (recName)
        parts.push(`For the full experience, pair it with ${recName}. That combination is absolutely chef's kiss!`);
 
      parts.push(`Go ahead, give it a try. We're sure you'll love it.`);
 
      return parts.join('  ');
    },
 
    // ── HINDI — natural desi reel voice ──
    'hi-IN': () => {
      const hour = new Date().getHours();
      const greet = hour < 12 ? 'नमस्ते!' : hour < 17 ? 'नमस्कार!' : 'शुभ संध्या!';
      const parts = [];
 
      parts.push(`${greet}  ${restName} में आपका दिल से स्वागत है।`);
      parts.push(`आज मैं आपको बताने वाला हूँ एक बेहतरीन डिश के बारे में — ${dishName}.`);
 
      if (isBestSeller)
        parts.push(`और सच कहूँ तो, ये हमारे यहाँ की सबसे ज़्यादा पसंद की जाने वाली डिश है। लोग इसके लिए बार-बार आते हैं।`);
      else if (isChefSpecial)
        parts.push(`ये हमारे शेफ की खास पसंद है — बड़े प्यार और मेहनत से बनाई गई।`);
 
      if (item.isVeg !== undefined)
        parts.push(item.isVeg !== false
          ? `ये एक लाजवाब शाकाहारी डिश है।`
          : `ये एक शानदार मांसाहारी व्यंजन है।`);
 
      if (serves)
        parts.push(`इतनी quantity ${serves} लोगों के लिए बिल्कुल सही रहती है।`);
 
      if (spice)
        parts.push(`इसका तीखापन ${spice} है — न ज़्यादा, न कम — बस एकदम सही।`);
 
      if (ingredients.length)
        parts.push(`इसमें डाले जाते हैं — ${ingredients.join(', ')} — सब कुछ एकदम ताज़ा।`);
 
      if (description)
        parts.push(description);
 
      if (recName)
        parts.push(`इसके साथ अगर आप ${recName} भी try करें, तो combination एकदम कमाल रहेगा।`);
 
      parts.push(`तो देर किस बात की? एक बार ज़रूर आज़माएं।`);
 
      return parts.join('  ');
    },
 
    // ── MARATHI — authentic Kolhapuri warmth ──
    'mr-IN': () => {
      const hour = new Date().getHours();
      const greet = hour < 12 ? 'सुप्रभात!' : hour < 17 ? 'नमस्कार!' : 'शुभ संध्याकाळ!';
      const parts = [];
 
      parts.push(`${greet}  ${restName} मध्ये आपले मनापासून स्वागत आहे.`);
      parts.push(`आज मी तुम्हाला एका अप्रतिम पदार्थाबद्दल सांगणार आहे — ${dishName}.`);
 
      if (isBestSeller)
        parts.push(`खरं सांगायचं तर, हा आमच्याकडचा सगळ्यात जास्त आवडणारा पदार्थ आहे. लोक याच्यासाठी परत परत येतात.`);
      else if (isChefSpecial)
        parts.push(`हा आमच्या शेफची खास शिफारस आहे — खूप मेहनत आणि प्रेमाने बनवलेला.`);
 
      if (item.isVeg !== undefined)
        parts.push(item.isVeg !== false
          ? `हा एक सुंदर शाकाहारी पदार्थ आहे.`
          : `हा एक चविष्ट मांसाहारी पदार्थ आहे.`);
 
      if (serves)
        parts.push(`हे ${serves} जणांसाठी एकदम योग्य आहे.`);
 
      if (spice)
        parts.push(`यातला तिखटपणा ${spice} आहे — न जास्त, न कमी — अगदी परफेक्ट.`);
 
      if (ingredients.length)
        parts.push(`यात वापरले जातात — ${ingredients.join(', ')} — सगळं एकदम ताज्या दर्जाचं.`);
 
      if (description)
        parts.push(description);
 
      if (recName)
        parts.push(`याच्यासोबत ${recName} पण नक्की try करा. ही जोडी एकदम जमेल!`);
 
      parts.push(`तर मग उशीर नको — एकदा जरूर चाखून पाहा.`);
 
      return parts.join('  ');
    },
  };
 
  const text = (scripts[lang] || scripts['en-IN'])()
    .replace(/\s+/g, ' ')
    .trim();
 
  if (!text) return;
 
  setSpokenText(text);
 
  const utterance = new SpeechSynthesisUtterance(text);
  setCurrentSpeechWordIndex(0);
 
  // Word boundary for live transcript highlight
  utterance.onboundary = (event) => {
    if (event.name !== 'word') return;
    const beforeWord = text.slice(0, event.charIndex);
    const wordIndex = beforeWord.trim().split(/\s+/).filter(Boolean).length;
    setCurrentSpeechWordIndex(wordIndex);
  };
 
  utterance.lang   = lang;
  utterance.volume = 1;
 
  // ── REEL-STYLE CADENCE per language ──
  // Faster than default but not robotic — sounds like a confident
  // Indian food creator speaking naturally.
  if (lang === 'en-IN') {
    utterance.rate  = 0.92;   // slightly brisk, energetic
    utterance.pitch = 1.08;   // a touch warm/bright
  } else if (lang === 'hi-IN') {
    utterance.rate  = 0.88;   // natural Hindi pace
    utterance.pitch = 1.04;
  } else {
    utterance.rate  = 0.86;   // Marathi is slightly deliberate
    utterance.pitch = 1.02;
  }
 
  // ── BEST INDIAN VOICE SELECTION ──
  // Priority: Google India female → Microsoft India → any India → lang prefix
  const selectVoice = (voices) => {
    if (!voices?.length) return null;
    const lc = lang.split('-')[0]; // 'en' | 'hi' | 'mr'
 
    // 1. Google female India (Chrome — best quality, sounds human)
    const googleFemale = voices.find(v =>
      v.lang === lang &&
      /google/i.test(v.name) &&
      /female|woman|neerja|raveena|heera|swara|lekha/i.test(v.name)
    );
    if (googleFemale) return googleFemale;
 
    // 2. Any Google India voice
    const googleIndia = voices.find(v =>
      v.lang === lang && /google/i.test(v.name)
    );
    if (googleIndia) return googleIndia;
 
    // 3. Microsoft India female (Edge/Windows)
    const msFemale = voices.find(v =>
      v.lang === lang &&
      /microsoft/i.test(v.name) &&
      /neerja|swara|heera|raveena|female|woman/i.test(v.name)
    );
    if (msFemale) return msFemale;
 
    // 4. Any Microsoft India
    const msIndia = voices.find(v =>
      v.lang === lang && /microsoft/i.test(v.name)
    );
    if (msIndia) return msIndia;
 
    // 5. Any voice exactly matching the lang code
    const exactLang = voices.find(v => v.lang === lang);
    if (exactLang) return exactLang;
 
    // 6. Lang prefix + India in name
    const prefixIndia = voices.find(v =>
      v.lang?.startsWith(lc) && /india|indian/i.test(v.name)
    );
    if (prefixIndia) return prefixIndia;
 
    // 7. Any voice with matching language prefix
    return voices.find(v => v.lang?.startsWith(lc)) || null;
  };
 
  let _spoken = false;
  const loadAndSpeak = () => {
    if (_spoken || speechRef.current !== utterance) return; // already started, or the guest picked another dish meanwhile
    _spoken = true;
    const voices = window.speechSynthesis.getVoices();
    const voice  = selectVoice(voices);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };
 
  utterance.onstart = () => {
    setSpeakingItemId(item._id);
    setVoicePaused(false);
  };
 
  // cancel() (called when switching dishes) fires onend/onerror for the OLD utterance AFTER the new one may already have
  // started; unguarded, that cleared the new dish's "speaking" state while its audio kept playing.
  utterance.onend = () => {
    if (speechRef.current && speechRef.current !== utterance) return;
    setSpeakingItemId(null);
    setVoicePaused(false);
    setCurrentSpeechWordIndex(-1);
    speechRef.current = null;
  };
 
  utterance.onerror = (event) => {
    if (speechRef.current && speechRef.current !== utterance) return;
    console.warn('Voice error:', event?.error);
    setSpeakingItemId(null);
    setVoicePaused(false);
    setCurrentSpeechWordIndex(-1);
    speechRef.current = null;
  };
 
  speechRef.current = utterance;
 
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    // Chrome loads voices async — wait for them
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      loadAndSpeak();
    };
    // Safari / some Android WebViews never fire voiceschanged: the dish was silently never read out. Speak with the default voice.
    setTimeout(() => { if (!_spoken) { window.speechSynthesis.onvoiceschanged = null; loadAndSpeak(); } }, 1200);
  } else {
    loadAndSpeak();
  }
};
 

const toggleVoicePause = (e) => {
  e?.stopPropagation();

  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis
  ) return;

  if (!speakingItemId) return;

  if (voicePaused) {
    window.speechSynthesis.resume();
    setVoicePaused(false);
  } else {
    window.speechSynthesis.pause();
    setVoicePaused(true);
  }
};

  const isOnlyVegTenant = restaurantData?.config?.onlyVeg === true;

useEffect(() => {
  if (isOnlyVegTenant) {
    setFilterVegOnly(true);
    return;
  }
  if (!filterVegOnly) {
    const hasNonVegInCategory = allMenuItems.some(i => {
      const matchesCategory = selectedCategoryId === 'all' || i.categoryId === selectedCategoryId;
      return matchesCategory && i.isVeg !== true && i.isAvailable !== false;
    });
    if (!hasNonVegInCategory) {
      setFilterVegOnly(true);
    }
  }
}, [selectedCategoryId, allMenuItems, isOnlyVegTenant, filterVegOnly]);

// 🚀 UNIFIED ENGINE: HANDLES INITIAL HTTP REST CONTENT LOADS & LIVE REAL-TIME SOCKET BROADCASTS
  useEffect(() => {
    if (!tenantId) return;

    // 1. PHASE A: EXECUTE INITIAL REST DATA FETCH ON MOUNT
let _disposedMenu = false;
let _menuReqSeq = 0;
const fetchMenuContent = async () => {
  const mySeq = ++_menuReqSeq;
  try {
    const [res, cat, extras] = await Promise.all([
      axios.get(`${BASE_URL}/tenant/${tenantId}`),
      axios.get(`${BASE_URL}/categories/${tenantId}`),
      axios.get(`${BASE_URL}/extra-items/${tenantId}`).catch(() => ({ data: [] }))
    ]);

    // Try engineered order, fall back to plain menu
    const menuRes = await axios.get(`${BASE_URL}/menu/engineered/${tenantId}`)
      .catch(() => axios.get(`${BASE_URL}/menu/${tenantId}`));

    if (_disposedMenu || mySeq !== _menuReqSeq) return;
    setRestaurantData(res.data);
    setCategoryList(Array.isArray(cat.data) ? cat.data : []);
    setAllMenuItems(Array.isArray(menuRes.data) ? menuRes.data : []);
    setExtraItems(Array.isArray(extras.data) ? extras.data : []);
    // If the browser reports offline but we still got real data back, it came
    // from the service worker's menu cache, not a live network round-trip.
    setServingFromCache(!navigator.onLine);
  } catch (error) {
    console.error("Setup error:", error);
    // Unknown / removed outlet: the API answers 404 { error: 'Tenant not found' }. Previously the guest got an empty menu shell.
    if (!_disposedMenu && error?.response?.status === 404) setSessionBlocked(true);
    // Offline with nothing cached yet for this tenant — surface it plainly
    // instead of leaving the customer on a blank/loading screen forever.
    if (!navigator.onLine) setIsOffline(true);
  } finally {
    if (!_disposedMenu) setIsLoading(false);
  }
};
    fetchMenuContent();

    // 2. PHASE B: SPIN UP LONG-LIVED WEB SOCKET CHANNELS FOR LIVE DATA SYNCING
    const socket = io(SOCKET_BASE_URL, { transports: ['websocket', 'polling'], reconnection: true });
    
    // Join the tenant room on initial connect and every reconnect. Socket.IO rooms are lost on reconnect.
    const joinRestaurant = () => socket.emit("join_restaurant", tenantId);
    socket.on('connect', joinRestaurant);
    if (socket.connected) joinRestaurant();
    // Menu/availability changes missed while offline are never replayed: refetch on RE-connect.
    let _seenConnect = socket.connected;
    socket.on('connect', () => { if (_seenConnect) fetchMenuContent(); _seenConnect = true; });

socket.on("menu_updated", (updatedItem) => {
  if (updatedItem && updatedItem.tenantId === tenantId) {
    // The backend broadcasts a NEWLY created dish (POST /api/menu, menu import) on this same event. The old map() only merged
    // into dishes the guest already had, so a new dish stayed invisible until a manual reload. Append full documents.
    setAllMenuItems((prevItems) => {
      const exists = prevItems.some((item) => String(item._id) === String(updatedItem._id));
      if (exists) return prevItems.map((item) => (String(item._id) === String(updatedItem._id) ? { ...item, ...updatedItem } : item));
      return updatedItem._id && updatedItem.name ? [...prevItems, updatedItem] : prevItems;
    });
    // ── Dish just went out of stock while it might be sitting in someone's cart ──
    if (updatedItem.isAvailable === false) {
      const inCart = Object.entries(cartRef.current).some(([key, qty]) =>
        qty > 0 && (key === updatedItem._id || key.startsWith(`${updatedItem._id}-`))
      );
      if (inCart) {
        setCartStockWarning({ itemId: updatedItem._id, itemName: updatedItem.name });
      }
    }
  }
});  

// ← close menu_updated HERE

// Bulk menu update — fired after bestseller recalculation
socket.on('menu_bulk_updated', (updatedItems) => {
  if (!Array.isArray(updatedItems)) return;
  setAllMenuItems(prev => {
    const map = {};
    updatedItems.forEach(i => { map[i._id] = i; });
    return prev.map(item => map[item._id] ? { ...item, ...map[item._id] } : item);
  });
});

socket.on('menu_item_deleted', ({ itemId }) => {
  if (!itemId) return;
  setAllMenuItems(prev => prev.filter(i => i._id !== itemId && i._id?.toString() !== itemId.toString()));
  // Also remove from cart if customer had added this item
  setCart(prev => {
    const updated = { ...prev };
    // Cart keys are `${_id}-${portion}` — remove any starting with this itemId
    Object.keys(updated).forEach(key => {
      if (key.startsWith(itemId)) delete updated[key];
    });
    return updated;
  });
});
// ── Live extra item stock/availability updates ──
socket.on('extra_item_updated', (updatedItem) => {
  if (updatedItem && updatedItem.tenantId === tenantId) {
    setExtraItems(prev =>
      prev.map(item => item._id === updatedItem._id ? { ...item, ...updatedItem } : item)
    );
  }
});

socket.on('extra_item_out_of_stock', ({ itemId }) => {
  setExtraItems(prev =>
    prev.map(item =>
      item._id === itemId
        ? { ...item, currentStock: 0, isAvailable: false }
        : item
    )
  );
  setExtraItemCart(prev => {
    const next = { ...prev };
    delete next[itemId];
    return next;
  });
});

socket.on('announcement_updated', (data) => {
  if (!data?.announcement) return;
  const ann = data.announcement;
  setActiveAnnouncement(ann);
  setAnnouncementDismissed(false);
  const seenKey = `ann_seen_${ann._id}`;
  let seenAnn = false;
  try { seenAnn = !!sessionStorage.getItem(seenKey); if (!seenAnn) sessionStorage.setItem(seenKey, '1'); } catch {}
  if (!seenAnn) {
    axios.post(`${BASE_URL}/announcements/${ann._id}/view`, { tenantId: ann.tenantId }).catch(() => {});
  }
});

socket.on('announcement_ended', () => {
  setActiveAnnouncement(null);
});
    // ── Live order status updates for customer ──
socket.on('order_voided', ({ orderId } = {}) => {
  if (!orderId) return;
  setLiveOrderStatuses(prev => ({ ...prev, [orderId]: 'voided' }));
});

socket.on("order_status_updated", (data) => {
  if (data.tableNumber?.toString() !== tableNumber?.toString()) return;
  const orderId = data._id || data.orderId;
  if (!orderId) return; // always have orderId from server
  setLiveOrderStatuses(prev => ({ ...prev, [orderId]: data.status }));
  if (data.status === 'ready' || data.status === 'served') setPrepPct(100);
  etaRefreshRef.current?.();
});

socket.on('kds_item_timing_updated', (data) => {
  if (!data || (data.tenantId && String(data.tenantId) !== String(tenantId))) return;
  etaRefreshRef.current?.();
});

    // 3. PHASE C: LIFECYCLE DESTRUCTION CLEANUP
return () => {
  _disposedMenu = true;
  socket.off("menu_updated");
  socket.off('menu_bulk_updated');
  socket.off("extra_item_updated");
  socket.off("extra_item_out_of_stock");
  socket.off("order_status_updated");
  socket.off('kds_item_timing_updated');
  socket.off('order_voided');
  socket.off('announcement_updated');
socket.off('announcement_ended');
socket.off('menu_item_deleted');
  socket.off('connect', joinRestaurant);
  if (window.speechSynthesis) window.speechSynthesis.cancel(); // ← ADD
  socket.disconnect();
};
  }, [tenantId, tableNumber]);

  useEffect(() => { waitlistSocket.connect(); return () => waitlistSocket.disconnect(); }, [waitlistSocket]);

  // ── Dynamic ETA — server-authoritative, refreshable after realtime status changes ──
useEffect(() => {
  if (!hasPlacedInitialOrder || !tenantId || !tableNumber || isCounterScan) {
    etaRefreshRef.current = null;
    return;
  }
  let disposed = false;
  const load = async () => {
    try {
      const r = await axios.get(`${BASE_URL}/orders/eta/${encodeURIComponent(tenantId)}/${encodeURIComponent(tableNumber)}`);
      if (!disposed && r.data) setOrderEta(r.data);
    } catch {
      // Keep the last known ETA visible during transient failures.
    }
  };
  etaRefreshRef.current = load;
  load();
  const iv = setInterval(() => { if (typeof document === 'undefined' || !document.hidden) load(); }, 30000);
  return () => {
    disposed = true;
    if (etaRefreshRef.current === load) etaRefreshRef.current = null;
    clearInterval(iv);
  };
}, [hasPlacedInitialOrder, tenantId, tableNumber, isCounterScan]);


  // ── QR Session Validation — prevents URL injection ──
  // ── Who may order on this table? (this phone = owner / viewer / nobody has ordered yet) ──
  const viewOnly = !isCounterScan && !!tableNumber && tableNumber !== 'Counter' && (tableRole === 'viewer' || tableRole === 'invalid');
  useEffect(() => { viewOnlyRef.current = viewOnly; }, [viewOnly]);
  useEffect(() => {
    if (!tenantId || !tableNumber || tableNumber === 'Counter' || isCounterScan) { setTableRole(null); return; }
    let stop = false;
    const check = () => {
      if (document.hidden) return;
      axios.get(`${BASE_URL}/table-access/${encodeURIComponent(tenantId)}/${encodeURIComponent(tableNumber)}`)
        .then(r => { if (!stop && r.data?.role) setTableRole(r.data.role); })
        .catch(() => {}); // network trouble: keep the last known role
    };
    check();
    const iv = setInterval(check, 12000);
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { stop = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [tenantId, tableNumber, isCounterScan, hasPlacedInitialOrder]);
  useEffect(() => {
    const onLocked = (e) => {
      const d = e.detail || {};
      if (d.code === 'TABLE_QR_INVALID') { setSessionBlocked(true); return; }
      if (!d.soft) { setTableRole('viewer'); setCartRaw({}); }
      triggerAlert(language === 'mr'
        ? 'या टेबलवर दुसऱ्या पाहुण्याने आधीच ऑर्डर दिली आहे. तुम्ही फक्त मेनू पाहू शकता.'
        : 'Another guest at this table has already ordered. You can browse the menu, but only that guest can order.', 'error');
    };
    window.addEventListener('pratyeksha:table-locked', onLocked);
    return () => window.removeEventListener('pratyeksha:table-locked', onLocked);
  });

// Deep link from the discovery page: ?service=pickup | reservation | waitlist starts that flow (only for a fresh visit).
useEffect(() => {
  if (!isCounterScan) return;
  let svc = '';
  try { svc = new URLSearchParams(window.location.search).get('service') || ''; } catch { svc = ''; }
  const mode = { pickup: 'pickup', reservation: 'reservation', waitlist: 'dine-in' }[svc];
  if (!mode) return;
  // Wait a moment so an existing waitlist / pickup entry for this phone can be restored first; only then apply the shortcut.
  const timer = setTimeout(() => {
    if (registrationStep === 'mode' && counterMode === null) { setCounterMode(mode); setRegistrationStep('register'); }
  }, 900);
  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isCounterScan, tenantId]);

// ── Session lifecycle: start on a fresh scan, close at billing, never reopen on refresh / back / forward ──
  const [sessionEnded, setSessionEnded] = useState(null);       // null | 'bill' | 'expired'
  const [sessionClosedLocal, setSessionClosedLocal] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [payInfo, setPayInfo] = useState(null);
  useEffect(() => {
    if (!tenantId || !tableNumber || tableNumber === 'Counter' || isCounterScan) return;
    const key = `${tenantId}|${tableNumber}`;
    if (__sessionBooted.has(key)) return;
    __sessionBooted.add(key);
    (async () => {
      let nav = 'navigate';
      try { nav = performance.getEntriesByType('navigation')[0]?.type || 'navigate'; } catch { /* old browser */ }
      let freshFlag = false;
      try { if (sessionStorage.getItem('pratyeksha_fresh_scan') === '1') { freshFlag = true; sessionStorage.removeItem('pratyeksha_fresh_scan'); } } catch { /* ignore */ }
      const stored = readTSession();
      const decision = decideEntry({ navType: nav, freshFlag, stored, tenantId, tableNumber });
      if (decision !== 'start') {
        // refresh / back / forward: continue the existing session or stay closed. Never start a new one here.
        setLastBill(readLastBill(tenantId, tableNumber));
        if (decision === 'ended-bill') { setSessionEnded('bill'); return; }
        if (decision === 'ended-expired') { setSessionEnded('expired'); return; }
        try { await axios.post(`${BASE_URL}/session/validate`, { tenantId, tableNumber, sessionToken }, { px_silent: true }); }
        catch (e) { if (e?.response?.status === 403 && e.response.data?.code === 'SESSION_ENDED') setSessionEnded('bill'); }
        return;
      }
      // A fresh scan = a new visit.
      try { localStorage.removeItem(BILL_KEY(tenantId, tableNumber)); } catch { /* ignore */ }
      setLastBill(null); setSessionClosedLocal(false); setSessionEnded(null);
      writeTSession(null);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await axios.post(`${BASE_URL}/table-session/start`, { tenantId, tableNumber }, { px_silent: true, px_noSession: true });
          if (r.data?.token) { writeTSession({ tenantId, tableNumber, token: r.data.token }); window.__pxStartFailed = false; return; }
        } catch (e) {
          if (e?.response?.status === 403 && e.response.data?.code === 'TABLE_QR_INVALID') { setSessionBlocked(true); return; }
          if (e?.response?.status && e.response.status < 500) break;       // a definite refusal: do not hammer
        }
        await sleep(1200 * (attempt + 1));
      }
      window.__pxStartFailed = true; // offline at scan time: ordering retries the start once (see the session-ended listener)
    })();
  }, [tenantId, tableNumber, isCounterScan, sessionToken]);

  // Coming back to the page (bfcache restore, switching back from a UPI app): make sure the session is still alive.
  useEffect(() => {
    if (!tenantId || !tableNumber || tableNumber === 'Counter' || isCounterScan) return;
    const recheck = () => {
      const ts = readTSession();
      if (!ts || !ts.token || ts.tenantId !== tenantId) return;
      if (ts.closed) { setSessionClosedLocal(true); return; }
      axios.post(`${BASE_URL}/session/validate`, { tenantId, tableNumber, sessionToken }, { px_silent: true })
        .catch((e) => { if (e?.response?.status === 403 && e.response.data?.code === 'SESSION_ENDED') { writeTSession({ ...ts, closed: true }); setSessionClosedLocal(true); } });
    };
    const onShow = (e) => { if (e.persisted) recheck(); };
    const onVis = () => { if (!document.hidden) recheck(); };
    window.addEventListener('pageshow', onShow);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('pageshow', onShow); document.removeEventListener('visibilitychange', onVis); };
  }, [tenantId, tableNumber, isCounterScan, sessionToken]);

  // Once the bill has been generated, the moment the bill screen is closed the menu is gone (no way back to it).
  useEffect(() => { if (sessionClosedLocal && !isBillOpen) setSessionEnded('bill'); }, [sessionClosedLocal, isBillOpen]);

  // The server refused an order because the session is over (or never started).
  useEffect(() => {
    const onEnded = async (e) => {
      if (window.__pxStartFailed && e?.detail?.code === 'SESSION_REQUIRED' && tenantId && tableNumber) {
        window.__pxStartFailed = false;
        try {
          const r = await axios.post(`${BASE_URL}/table-session/start`, { tenantId, tableNumber }, { px_silent: true, px_noSession: true });
          if (r.data?.token) { writeTSession({ tenantId, tableNumber, token: r.data.token }); triggerAlert(language === 'mr' ? 'कृपया पुन्हा प्रयत्न करा.' : 'Connection restored — please place your order again.', 'error'); return; }
        } catch { /* fall through */ }
      }
      setSessionEnded((prev) => prev || (e?.detail?.code === 'SESSION_ENDED' ? 'bill' : 'expired'));
    };
    window.addEventListener('pratyeksha:session-ended', onEnded);
    return () => window.removeEventListener('pratyeksha:session-ended', onEnded);
  });

  // The restaurant's UPI ID / payee name (public; bank details never leave the server).
  useEffect(() => {
    if (!tenantId) return;
    let alive = true;
    axios.get(`${BASE_URL}/payment-info/${encodeURIComponent(tenantId)}`).then((r) => { if (alive) setPayInfo(r.data || null); }).catch(() => { if (alive) setPayInfo(null); });
    return () => { alive = false; };
  }, [tenantId]);

useEffect(() => {
  if (!tenantId || !tableNumber || tableNumber === 'Counter' || isCounterScan) return;
  setSessionBlocked(false);
  let stale = false; // a slow answer for the previous table/outlet must not blank the page the guest has since moved to
  axios.post(`${BASE_URL}/session/validate`, { tenantId, tableNumber, sessionToken }, { px_noSession: true, px_silent: true })
    .then(r => {
      if (!stale && r.data && r.data.valid === false) setSessionBlocked(true);
    })
    .catch((err) => {
      // The server answers an invalid table/token with HTTP 403 { valid:false }. axios REJECTS on 403, so the .then() above
      // never saw it and a forged / expired QR link was never blocked. Network errors and 5xx stay non-fatal.
      if (!stale && err?.response?.status === 403 && err.response.data?.valid === false) setSessionBlocked(true);
    });
  return () => { stale = true; };
}, [tenantId, tableNumber, isCounterScan, sessionToken]);

  const handleSwipe = (direction) => {
    const categories = ['all', ...categoryList.map(c => c.categoryId)];
    const currentIndex = categories.indexOf(selectedCategoryId);
    if (direction === 'left' && currentIndex < categories.length - 1) setSelectedCategoryId(categories[currentIndex + 1]);
    else if (direction === 'right' && currentIndex > 0) setSelectedCategoryId(categories[currentIndex - 1]);
  };

const sendExtraItemsRequest = async () => {
  const activeItems = Object.entries(extraItemCart).filter(([id, qty]) => qty > 0 && extraItems.some(i => i._id === id));
  if (activeItems.length === 0) return;
  if (extraSendingRef.current) return;
  extraSendingRef.current = true;

  const requestText = activeItems.map(([id, qty]) => {
    const item = extraItems.find(i => i._id === id);
    return `${item?.name} x${qty}`;
  }).join(', ');

  // Build line items for bill tracking
  const extraLineItems = activeItems.map(([id, qty]) => {
    const item = extraItems.find(i => i._id === id);
    return {
      menuItemId:   null,
      extraItemId:  id,
      name:         item?.name || '',
      quantity:     qty,
      portion:      'Single',
      pricePerUnit: item?.price || 0,
      subtotal:     (item?.price || 0) * qty,
      isExtraItem:  true,
      category:     item?.category || 'Extra'
    };
  });

try {
  // Server handles Order creation + stock deduction on the waiter-request "EXTRA ITEMS:" prefix
  const res = await axios.post(`${BASE_URL}/waiter-requests`, {
    tenantId,
    tableNumber,
    serviceRequest: `EXTRA ITEMS: ${requestText}`
  });

  if (res.data?.extraItemsWarning) {
    // Extra items couldn't actually be fulfilled (e.g. ran out of stock) — don't
    // show a false success or add them to the customer's own bill summary.
    triggerAlert('orderError', 'error');
  } else {
    // Local state: add to placedOrders for customer's own bill summary view
    setPlacedOrders(prev => [...prev, ...extraLineItems]);
    triggerAlert('waiterSuccess');
  }
  setExtraItemCart({});
  setIsExtraItemsOpen(false);
} catch {
  triggerAlert('orderError', 'error');
} finally {
  extraSendingRef.current = false;
}
};

// ══════════════════════════════════════════════════════════════════
// UNIFIED PREMIUM TOKEN SYSTEM — v2
// Drop-in replacement for the 3 download functions + helpers
// Paste BEFORE the component's return() statement
// ══════════════════════════════════════════════════════════════════

const genToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const openTokenWindow = (html, filename) => {
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (win) {
    // onload AND the 2 s fallback both called print(): guests got two print dialogs on every token.
    let printed = false;
    const printOnce = () => { if (printed) return; printed = true; try { win.print(); } catch (e) { /* popup closed */ } setTimeout(() => URL.revokeObjectURL(url), 60000); };
    win.onload = () => setTimeout(printOnce, 800);
    setTimeout(() => { if (win && !win.closed) printOnce(); }, 2000);
  } else {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
};

const IC = {
  chair:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>`,
  bag:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  calendar: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  user:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  users:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  phone:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.35 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  clock:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  hourglass:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`,
  check:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  utensils: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
  receipt:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>`,
  note:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  hash:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  mappin:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  gstin:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
};

const ic = (key, color = '#c9a84c', size = 13) =>
  (IC[key] || IC.hash)
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`)
    .replace('stroke="currentColor"', `stroke="${color}"`);

const nowStamp = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata',
 
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true
});

// ── Tenant contact row (phone + address + GSTIN) — used in header ──
// Returns 1-2 clean lines, NO address duplication
const tenantContactLine = (rd) => {
  const parts = [];
  if (rd?.contact)
    parts.push(`<span style="display:inline-flex;align-items:center;gap:4px;">${ic('phone','#bbb',10)} ${escapeHtml(rd.contact)}</span>`);
  const addr = [rd?.address?.city, rd?.address?.state].filter(Boolean).join(', ');
  if (addr)
    parts.push(`<span style="display:inline-flex;align-items:center;gap:4px;">${ic('mappin','#bbb',10)} ${escapeHtml(addr)}</span>`);
  if (rd?.gstin && rd.gstin !== 'GSTIN PENDING')
    parts.push(`<span style="display:inline-flex;align-items:center;gap:4px;">${ic('gstin','#bbb',10)} GSTIN: ${escapeHtml(rd.gstin)}</span>`);
  if (!parts.length) return '';
  return `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:5px;font-size:9px;color:#aaa;font-family:'Courier New',monospace;">
    ${parts.join('')}
  </div>`;
};

const SHARED_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: #ffffff;
    color: #111111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 13px;
  }
  .page {
    width: 100%;
    max-width: 620px;
    margin: 0 auto;
    padding: 28px 36px 32px;
    background: #ffffff;
  }

  .gold-bar {
    height: 4px;
    background: linear-gradient(90deg,#bda88a,#c9a84c,#f0dca0,#c9a84c,#bda88a);
    border-radius: 3px;
  }
  .gold-bar-top    { margin-bottom: 22px; }
  .gold-bar-bottom { margin-top: 22px; }

  /* ── HEADER: 2-column, no city repetition ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 16px;
    margin-bottom: 18px;
    border-bottom: 2px solid #111;
    gap: 16px;
  }
  .mode-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #faf6ec;
    border: 1px solid #e8d8a8;
    border-radius: 99px;
    padding: 4px 12px 4px 8px;
    font-size: 8.5px;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #7a5a20;
    margin-bottom: 8px;
  }
  .rest-name {
    font-size: 26px;
    font-weight: 900;
    color: #0c0c0c;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }
  /* right column — issued time + contact, stacked */
  .header-right {
    text-align: right;
    flex-shrink: 0;
    min-width: 140px;
  }
  .issued-label {
    font-size: 8px; font-weight: bold; letter-spacing: 2px;
    text-transform: uppercase; color: #ccc; margin-bottom: 2px;
  }
  .issued-val { font-size: 10px; color: #999; font-family: 'Courier New', monospace; }
  .contact-right {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    font-size: 9px;
    color: #aaa;
    font-family: 'Courier New', monospace;
  }
  .contact-right span { display: inline-flex; align-items: center; gap: 4px; }

  /* ── HERO ── */
  .hero {
    background: #0c0c0c;
    border-radius: 14px;
    padding: 24px 28px 18px;
    text-align: center;
    margin-bottom: 18px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content:''; position:absolute; top:0; left:10%; right:10%;
    height:2px; background:linear-gradient(90deg,transparent,#c9a84c,transparent);
  }
  .hero-eyebrow {
    font-size: 8.5px; font-weight: bold; letter-spacing: 4px;
    text-transform: uppercase; color: rgba(201,168,76,0.45); margin-bottom: 8px;
  }
  .hero-main {
    font-size: 72px; font-weight: 900; color: #e8d9a8;
    line-height: 1; letter-spacing: -4px; margin-bottom: 4px;
    font-family: Georgia, serif;
  }
  .hero-main.time   { font-size: 54px; letter-spacing: -2px; font-family: 'Courier New', monospace; }
  .hero-main.token-big { font-size: 38px; letter-spacing: 7px; font-family: 'Courier New', monospace; }
  .hero-hash        { color: #7a6a30; }
  .hero-sub         { font-size: 10px; color: rgba(232,217,168,0.4); font-weight: bold; margin-bottom: 14px; }
  .hero-divider     { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 14px; }
  .hero-row {
    display: flex; align-items: stretch;
    justify-content: center; gap: 9px;
  }

  .token-pill {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 9px; padding: 10px 18px; flex: 1;
  }
  .token-pill-label {
    font-size: 7.5px; font-weight: bold; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(201,168,76,0.38); margin-bottom: 4px;
  }
  .token-pill-code {
    font-family: 'Courier New', monospace; font-size: 22px;
    font-weight: 900; color: #e8c96a; letter-spacing: 6px;
  }
  .status-pill {
    border-radius: 9px; padding: 10px 16px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 3px; min-width: 100px;
  }
  .status-pill.confirmed { background: linear-gradient(135deg,#c9a84c,#bda88a); }
  .status-pill.pending   { background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.25); }
  .status-text {
    font-size: 8.5px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;
  }
  .status-pill.confirmed .status-text { color: #0c0c0c; }
  .status-pill.pending   .status-text { color: #c9a84c; }
  .status-icon { display:flex; align-items:center; justify-content:center; margin-bottom:1px; }

  /* ── SECTION HDR ── */
  .sec-hdr {
    display: flex; align-items: center; gap: 7px; margin-bottom: 9px;
  }
  .sec-label {
    font-size: 8.5px; font-weight: bold; letter-spacing: 2px;
    text-transform: uppercase; color: #7a6a30;
  }
  .sec-rule  { flex:1; height:1px; background:#eddfc4; }
  .sec-note  { font-size:9px; color:#bbb; font-style:italic; white-space:nowrap; }

  /* ── DETAIL GRID ── */
  .detail-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px; margin-bottom: 16px;
  }
  .d-cell {
    background: #faf6ec; border: 1px solid #ede0c0;
    border-radius: 9px; padding: 10px 12px;
  }
  .d-label {
    display: flex; align-items: center; gap: 4px;
    font-size: 7.5px; font-weight: bold; letter-spacing: 2px;
    text-transform: uppercase; color: #c0a050; margin-bottom: 4px;
  }
  .d-val { font-size: 13px; font-weight: bold; color: #111; line-height: 1.3; }
  .d-val.mono { font-family: 'Courier New', monospace; font-size: 12px; }
  .d-val small { font-size: 10px; color: #999; font-weight: normal; }

  /* ── SPECIAL REQUEST ── */
  .special {
    background: #faf6ec; border-left: 3px solid #c9a84c;
    border-radius: 0 9px 9px 0; padding: 10px 14px; margin-bottom: 16px;
    font-size: 11px; color: #7a6030; font-style: italic; line-height: 1.6;
    display: flex; align-items: flex-start; gap: 7px;
  }

  /* ── ORDER TABLE ── */
  .order-section { margin-bottom: 16px; }
  .order-table { width:100%; border-collapse:collapse; margin-top:9px; }
  .order-table thead tr { border-bottom: 2px solid #111; }
  .order-table th {
    font-size: 8px; font-weight: bold; letter-spacing: 2px;
    text-transform: uppercase; color: #999; padding: 6px 7px 8px; text-align: left;
  }
  .order-table th:nth-child(2) { text-align:center; }
  .order-table th:last-child   { text-align:right; }
  .order-table td {
    font-size: 12px; padding: 8px 7px; border-bottom: 1px solid #f3ecdd; color: #222;
  }
  .order-table td:nth-child(2) { text-align:center; color:#999; }
  .order-table td:last-child   { text-align:right; font-weight:bold; color:#111; }
  .portion-tag { font-size:9px; color:#c9a84c; font-weight:bold; margin-left:4px; }
  .order-total-row {
    display:flex; justify-content:space-between; align-items:baseline;
    padding: 11px 7px 0; border-top: 2px solid #111; margin-top: 2px;
  }
  .order-total-key { font-size:9px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#999; }
  .order-total-val { font-size:24px; font-weight:900; color:#7a5a20; font-family:Georgia,serif; }

  /* ── TABLE-ONLY ── */
  .table-only {
    background:#faf6ec; border:1px solid #ede0c0; border-radius:11px;
    padding:18px; text-align:center; margin-bottom:16px;
  }
  .table-only-icon {
    width:32px; height:32px; border-radius:50%;
    background:#fff; border:1px solid #e8d8a8;
    display:flex; align-items:center; justify-content:center;
    margin:0 auto 8px;
  }
  .table-only-title { font-size:13px; font-weight:bold; color:#7a5a30; margin-bottom:4px; }
  .table-only-text  { font-size:10.5px; color:#aa9a78; line-height:1.6; }

  /* ── FOOTER ── */
  .footer-rule { height:1px; background:#eeeeee; margin-bottom:11px; }
  .footer {
    display:flex; justify-content:space-between; align-items:center;
  }
  .footer-brand {
    font-size:12px; font-weight:900; color:#c9a84c;
    font-family:Georgia,serif; letter-spacing:1px; display:flex; align-items:center; gap:6px;
  }
  .footer-brand-sub { font-size:8px; color:#ccc; letter-spacing:2px; text-transform:uppercase; font-weight:bold; font-family:Georgia,serif; }
  .footer-date { font-size:9px; color:#ccc; font-family:'Courier New',monospace; }

  @media print {
    html,body { height:auto !important; }
    .page { padding:20px 28px 24px !important; }
    @page { margin:0; size:A4 portrait; }
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  }
`;

// ── Shared footer HTML ──
const footerHTML = () => `
  <div class="footer-rule"></div>
  <div class="footer">
    <div>
      <div class="footer-brand-sub"><img src="${window.location.origin}${PRATYEKSHAA_LOGO}" alt="Pratyeksha" style="width:120px;height:auto;background:#f7f3eb;border-radius:5px;padding:3px 6px;display:block"/></div>
    </div>
    <div class="footer-date">${nowStamp()}</div>
  </div>
  <div class="gold-bar gold-bar-bottom"></div>
`;

// ── Shared right-column header (issued time + contact only — NO address/city) ──
const headerRight = (rd) => {
  const contact = rd?.contact
    ? `<span>${ic('phone','#bbb',10)} ${escapeHtml(rd.contact)}</span>` : '';
  const gstin = (rd?.gstin && rd.gstin !== 'GSTIN PENDING')
    ? `<span>${ic('gstin','#bbb',10)} GSTIN: ${escapeHtml(rd.gstin)}</span>` : '';
  return `
  <div class="header-right">
    <div class="issued-label">Issued</div>
    <div class="issued-val">${nowStamp()}</div>
    ${(contact || gstin) ? `
    <div class="contact-right">
      ${contact}
      ${gstin}
    </div>` : ''}
  </div>`;
};

// ── Shared order table ──
const orderTableHTML = (items, totalAmount) => `
  <table class="order-table">
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
    </thead>
    <tbody>
      ${items.map(i => `
      <tr>
        <td>${escapeHtml(i.name)}${i.portion && i.portion !== 'Single' ? `<span class="portion-tag">(${escapeHtml(i.portion)})</span>` : ''}</td>
        <td>${i.quantity}</td>
        <td>&#8377;${i.subtotal}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="order-total-row">
    <span class="order-total-key">Total Amount</span>
    <span class="order-total-val">&#8377;${(totalAmount || 0).toLocaleString()}</span>
  </div>
`;


// ══════════════════════════════════════════════════════════
// MODE 1 — DINE-IN WAITLIST TOKEN
// ══════════════════════════════════════════════════════════
const downloadWaitlistToken = () => {
  const token    = genToken();
  const entry    = waitlistEntry || {};
  const rd       = restaurantData;
  const pos      = entry.waitlistPosition || 1;
  const estWait  = pos * 20;
  const isConf   = ['confirmed','assigned','seated'].includes(entry.status);
  const hasOrder = (entry.items || []).length > 0;
  // Full address (street + city + state + pincode) — shown ONCE in header left
  const fullAddr = [rd?.address?.street, rd?.address?.city, rd?.address?.state, rd?.address?.pincode].filter(Boolean).join(', ');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Waitlist Token — ${token}</title>
<style>${SHARED_CSS}</style>
</head>
<body><div class="page">

  <div class="gold-bar gold-bar-top"></div>

  <!-- HEADER: left = restaurant identity + full address once, right = issued + phone/gstin -->
  <div class="header">
    <div>
      <div class="mode-chip">${ic('chair','#7a5a20',13)}&nbsp; Dine-In Waitlist</div>
      <div class="rest-name">${escapeHtml(rd?.name || 'Restaurant')}</div>
      ${fullAddr ? `<div style="font-size:9px;color:#999;font-style:italic;margin-top:3px;">${escapeHtml(fullAddr)}</div>` : ''}
    </div>
    ${headerRight(rd)}
  </div>

  <!-- HERO: queue number big, token + status below -->
  <div class="hero">
    <div class="hero-eyebrow">Queue Position</div>
    <div class="hero-main"><span class="hero-hash">#</span>${pos}</div>
    <div class="hero-sub">Estimated wait &nbsp;~${estWait} minutes</div>
    <div class="hero-divider"></div>
    <div class="hero-row">
      <div class="token-pill">
        <div class="token-pill-label">Token ID</div>
        <div class="token-pill-code">${token}</div>
      </div>
      <div class="status-pill ${isConf ? 'confirmed' : 'pending'}">
        <div class="status-icon">${isConf ? ic('check','#0c0c0c',18) : ic('hourglass','#c9a84c',18)}</div>
        <div class="status-text">${isConf ? 'Confirmed' : 'In Queue'}</div>
      </div>
    </div>
  </div>

  <!-- GUEST DETAILS -->
  <div class="sec-hdr">
    ${ic('users','#c9a84c',12)}
    <span class="sec-label">Guest Details</span>
    <div class="sec-rule"></div>
  </div>
  <div class="detail-grid">
    <div class="d-cell">
      <div class="d-label">${ic('user','#c0a050',11)}&nbsp;Name</div>
      <div class="d-val">${escapeHtml(entry.customerName || '—')}</div>
    </div>
    <div class="d-cell">
      <div class="d-label">${ic('users','#c0a050',11)}&nbsp;Party Size</div>
      <div class="d-val">${entry.partySize || 1} <small>${(entry.partySize || 1) === 1 ? 'person' : 'people'}</small></div>
    </div>
    ${entry.customerPhone ? `
    <div class="d-cell">
      <div class="d-label">${ic('phone','#c0a050',11)}&nbsp;Mobile</div>
      <div class="d-val mono">+91 ${escapeHtml(entry.customerPhone)}</div>
    </div>` : ''}
    <div class="d-cell">
      <div class="d-label">${ic('clock','#c0a050',11)}&nbsp;Est. Wait</div>
      <div class="d-val">~${estWait} <small>min</small></div>
    </div>
  </div>

  ${entry.specialRequests ? `
  <div class="special">
    ${ic('note','#c9a84c',13)}&nbsp;<span>"${escapeHtml(entry.specialRequests)}"</span>
  </div>` : ''}

  ${hasOrder ? `
  <div class="order-section">
    <div class="sec-hdr">
      ${ic('utensils','#c9a84c',12)}
      <span class="sec-label">Pre-Order</span>
      <div class="sec-rule"></div>
      <span class="sec-note">fires to kitchen when seated</span>
    </div>
    ${orderTableHTML(entry.items, entry.totalAmount)}
  </div>` : ''}

  ${footerHTML()}
</div></body></html>`;

  openTokenWindow(html, `Waitlist_Token_${token}.pdf`);
};


// ══════════════════════════════════════════════════════════
// MODE 2 — PICKUP / TAKEAWAY TOKEN
// ══════════════════════════════════════════════════════════
const downloadPickupToken = () => {
  const token      = genToken();
  const entry      = waitlistEntry || {};
  const rd         = restaurantData;
  const hasOrder   = (entry.items || []).length > 0;
  const pickupTime = entry.scheduledPickupTime
    ? new Date(entry.scheduledPickupTime).toLocaleTimeString([], { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
    : null;
  const pickupDate = entry.scheduledPickupTime
    ? new Date(entry.scheduledPickupTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })
    : null;
  const fullAddr = [rd?.address?.street, rd?.address?.city, rd?.address?.state, rd?.address?.pincode].filter(Boolean).join(', ');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Pickup Token — ${token}</title>
<style>${SHARED_CSS}</style>
</head>
<body><div class="page">

  <div class="gold-bar gold-bar-top"></div>

  <div class="header">
    <div>
      <div class="mode-chip">${ic('bag','#7a5a20',13)}&nbsp; Pickup &amp; Takeaway</div>
      <div class="rest-name">${escapeHtml(rd?.name || 'Restaurant')}</div>
      ${fullAddr ? `<div style="font-size:9px;color:#999;font-style:italic;margin-top:3px;">${escapeHtml(fullAddr)}</div>` : ''}
    </div>
    ${headerRight(rd)}
  </div>

  <!-- HERO -->
  <div class="hero">
    <div class="hero-eyebrow">${pickupTime ? 'Pickup Slot' : 'Pickup Token'}</div>
    ${pickupTime
      ? `<div class="hero-main time">${pickupTime}</div>
         <div class="hero-sub">${pickupDate || 'Today'}&nbsp;&nbsp;·&nbsp;&nbsp;Counter Collection</div>`
      : `<div class="hero-main token-big">${token}</div>
         <div class="hero-sub">We'll notify you when your order is ready</div>`
    }
    <div class="hero-divider"></div>
    <div class="hero-row">
      ${pickupTime ? `
      <div class="token-pill">
        <div class="token-pill-label">Token ID</div>
        <div class="token-pill-code">${token}</div>
      </div>` : ''}
      <div class="status-pill confirmed">
        <div class="status-icon">${ic('check','#0c0c0c',18)}</div>
        <div class="status-text" style="color:#0c0c0c;">Order Confirmed</div>
      </div>
    </div>
  </div>

  <!-- CUSTOMER -->
  <div class="sec-hdr">
    ${ic('user','#c9a84c',12)}
    <span class="sec-label">Customer Details</span>
    <div class="sec-rule"></div>
  </div>
  <div class="detail-grid">
    <div class="d-cell">
      <div class="d-label">${ic('user','#c0a050',11)}&nbsp;Name</div>
      <div class="d-val">${escapeHtml(entry.customerName || '—')}</div>
    </div>
    ${entry.customerPhone ? `
    <div class="d-cell">
      <div class="d-label">${ic('phone','#c0a050',11)}&nbsp;Mobile</div>
      <div class="d-val mono">+91 ${escapeHtml(entry.customerPhone)}</div>
    </div>` : ''}
    <div class="d-cell">
      <div class="d-label">${ic('mappin','#c0a050',11)}&nbsp;Collection</div>
      <div class="d-val">Counter</div>
    </div>
    ${pickupTime ? `
    <div class="d-cell">
      <div class="d-label">${ic('clock','#c0a050',11)}&nbsp;Pickup Time</div>
      <div class="d-val mono">${pickupTime}${pickupDate ? `&nbsp;<small>· ${pickupDate}</small>` : ''}</div>
    </div>` : ''}
  </div>

  ${entry.specialRequests ? `
  <div class="special">
    ${ic('note','#c9a84c',13)}&nbsp;<span>"${escapeHtml(entry.specialRequests)}"</span>
  </div>` : ''}

  ${hasOrder ? `
  <div class="order-section">
    <div class="sec-hdr">
      ${ic('receipt','#c9a84c',12)}
      <span class="sec-label">Order Summary</span>
      <div class="sec-rule"></div>
    </div>
    ${orderTableHTML(entry.items, entry.totalAmount)}
  </div>` : `
  <div class="table-only">
    <div class="table-only-icon">${ic('bag','#c9a84c',18)}</div>
    <div class="table-only-title">No Pre-Order Placed</div>
    <div class="table-only-text">You may add items at the counter when you arrive.</div>
  </div>`}

  ${footerHTML()}
</div></body></html>`;

  openTokenWindow(html, `Pickup_Token_${token}.pdf`);
};


// ══════════════════════════════════════════════════════════
// MODE 3 — TABLE RESERVATION TOKEN
// Shows ONLY reservation info: date, time, guests, name,
// phone, special requests, pre-order (if any).
// No pickup / dine-in references whatsoever.
// ══════════════════════════════════════════════════════════
const downloadReservationPDF = () => {
  const token       = genToken();
  const entry       = waitlistEntry || {};
  const rd          = restaurantData;
  const hasPreOrder = (entry.items || []).length > 0;
  const isConf      = ['confirmed','seated'].includes(entry.status);
  const resTime     = entry.reservationTime ? new Date(entry.reservationTime) : null;
  const fmtLong     = resTime ? resTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const fmtShort    = resTime ? resTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' }) : '—';
  const fmtTime     = resTime ? resTime.toLocaleTimeString([], { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
  const fmtDay      = resTime ? resTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' }) : '';
  // Use last-6 of DB _id as stable token so it matches the on-screen token
  const tokenId     = entry._id?.slice(-6)?.toUpperCase() || token;
  const fullAddr    = [rd?.address?.street, rd?.address?.city, rd?.address?.state, rd?.address?.pincode].filter(Boolean).join(', ');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Reservation — #${tokenId}</title>
<style>${SHARED_CSS}</style>
</head>
<body><div class="page">

  <div class="gold-bar gold-bar-top"></div>

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="mode-chip">${ic('calendar','#7a5a20',13)}&nbsp; ${hasPreOrder ? 'Reservation + Pre-Order' : 'Table Reservation'}</div>
      <div class="rest-name">${escapeHtml(rd?.name || 'Restaurant')}</div>
      ${fullAddr ? `<div style="font-size:9px;color:#999;font-style:italic;margin-top:3px;">${escapeHtml(fullAddr)}</div>` : ''}
    </div>
    ${headerRight(rd)}
  </div>

  <!-- HERO: reservation TIME is the hero element -->
  <div class="hero">
    <div class="hero-eyebrow">Reservation Time</div>
    <div class="hero-main time">${fmtTime}</div>
    <div class="hero-sub">${fmtLong}</div>
    <div class="hero-divider"></div>
    <div class="hero-row">
      <div class="token-pill">
        <div class="token-pill-label">Booking Token</div>
        <div class="token-pill-code">#${tokenId}</div>
      </div>
      <div class="status-pill ${isConf ? 'confirmed' : 'pending'}">
        <div class="status-icon">${isConf ? ic('check','#0c0c0c',18) : ic('hourglass','#c9a84c',18)}</div>
        <div class="status-text">${isConf ? 'Confirmed' : 'Pending'}</div>
      </div>
    </div>
  </div>

  <!-- RESERVATION DETAILS — all reservation-specific, nothing else -->
  <div class="sec-hdr">
    ${ic('users','#c9a84c',12)}
    <span class="sec-label">Reservation Details</span>
    <div class="sec-rule"></div>
  </div>
  <div class="detail-grid">
    <div class="d-cell">
      <div class="d-label">${ic('user','#c0a050',11)}&nbsp;Guest Name</div>
      <div class="d-val">${escapeHtml(entry.customerName || '—')}</div>
    </div>
    <div class="d-cell">
      <div class="d-label">${ic('users','#c0a050',11)}&nbsp;Party Size</div>
      <div class="d-val">${entry.partySize || 1} <small>${(entry.partySize || 1) === 1 ? 'person' : 'people'}</small></div>
    </div>
    ${entry.customerPhone ? `
    <div class="d-cell">
      <div class="d-label">${ic('phone','#c0a050',11)}&nbsp;Mobile</div>
      <div class="d-val mono">+91 ${escapeHtml(entry.customerPhone)}</div>
    </div>` : ''}
    <div class="d-cell">
      <div class="d-label">${ic('calendar','#c0a050',11)}&nbsp;Date</div>
      <div class="d-val" style="font-size:12px;">${fmtShort} <small>· ${fmtDay}</small></div>
    </div>
    ${entry.tablePreference ? `
    <div class="d-cell">
      <div class="d-label">${ic('hash','#c0a050',11)}&nbsp;Table Pref.</div>
      <div class="d-val" style="color:#7a5a30;">${escapeHtml(entry.tablePreference)}</div>
    </div>` : ''}
    <div class="d-cell">
      <div class="d-label">${ic('clock','#c0a050',11)}&nbsp;Time</div>
      <div class="d-val mono">${fmtTime}</div>
    </div>
  </div>

  ${entry.specialRequests ? `
  <div class="special">
    ${ic('note','#c9a84c',13)}&nbsp;<span>"${escapeHtml(entry.specialRequests)}"</span>
  </div>` : ''}

  <!-- PRE-ORDER (if any) — else table-only message -->
  ${hasPreOrder ? `
  <div class="order-section">
    <div class="sec-hdr">
      ${ic('utensils','#c9a84c',12)}
      <span class="sec-label">Pre-Order Details</span>
      <div class="sec-rule"></div>
    </div>
    ${orderTableHTML(entry.items, entry.totalAmount)}
    <p style="font-size:10px;color:#9a8060;margin-top:8px;text-align:center;font-style:italic;">
      Dishes will be served shortly after you are seated.
    </p>
  </div>` : `
  <div class="table-only">
    <div class="table-only-icon">${ic('chair','#c9a84c',18)}</div>
    <div class="table-only-title">Table Reservation Only</div>
    <div class="table-only-text">
      No pre-order placed. Our team will take your order<br/>once you are comfortably seated.
    </div>
  </div>`}

  ${footerHTML()}
</div></body></html>`;

  openTokenWindow(html, `Reservation_Token_${tokenId}.pdf`);
};

const notifyWaiter = async (serviceType = "Custom") => {
  try {
    let requestText = serviceType;

    if (serviceType === "Custom") {
      const activeCounts = Object.entries(waiterCounts).filter(([_, count]) => count > 0);
      
      if (activeCounts.length === 0) return; 

      // This creates the string: "Spoons: 2, Water Bottle: 1"
      requestText = activeCounts
        .map(([item, count]) => `${t[language][item] || item}: ${count}`)
        .join(", ");
    }

    const payload = { 
      tenantId: tenantId, 
      tableNumber: tableNumber, 
      serviceRequest: requestText // 🚀 FIXED: Must match backend schema key 'serviceRequest'
    };

    // Use BASE_URL from your file
    await axios.post(`${BASE_URL}/waiter-requests`, payload);
    
    triggerAlert("waiterSuccess");
    setIsWaiterModalOpen(false);
    
    // Reset counts (Tissue removed as per your request)
    setWaiterCounts({ spoon: 0, fork: 0, plates: 0, tissue: 0 });
  } catch (error) { 
    console.error("Waiter Request Error:", error.response?.data || error.message);
    triggerAlert("orderError", "error"); 
  }
};
  const updateWaiterCount = (item, delta) => {
    setWaiterCounts(prev => ({ ...prev, [item]: Math.max(0, prev[item] + delta) }));
  };

  const primaryColor = '#d3bfa2'; 
  const secondaryColor = '#1a1a1a'; 
  const cardBg = PX.card;
  const borderColor = 'rgba(211, 191, 162, 0.2)';

  const addToCart = (item, portion) => {
    const cartKey = portion === 'Single' ? item._id : `${item._id}-${portion}`;
    setCart(prev => ({ ...prev, [cartKey]: (prev[cartKey] || 0) + 1 }));
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[cartKey] > 1) newCart[cartKey] -= 1;
      else { 
        delete newCart[cartKey]; 
        const newSuggestions = {...suggestions};
        delete newSuggestions[cartKey];
        setSuggestions(newSuggestions);
      }
      return newCart;
    });
  };

  const totalItemsInCart = Object.values(cart).reduce((a, b) => a + b, 0);

  const getCartTotal = () => {
    return Object.entries(cart).reduce((acc, [key, qty]) => {
      const isMulti = key.includes('-');
      const id = isMulti ? key.split('-')[0] : key;
      const portion = isMulti ? key.split('-')[1] : 'Single';
      const item = allMenuItems.find(i => i._id === id);
      if (!item) return acc;
      const price = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
      return acc + (Number(price) || 0) * qty;
    }, 0);
  };

const welcomeRecsPendingRef = useRef(false);
const lastOrderItemsRef = useRef(null);
const computeWelcomeRecsRef = useRef(null);
computeWelcomeRecsRef.current = (lastOrderItems) => {
  lastOrderItemsRef.current = lastOrderItems;
  if (!allMenuItems.length) return; // retried by the effect below when the menu arrives
  const lastNames = lastOrderItems.map(i => i.name?.toLowerCase().trim());
  const lastCategoryIds = allMenuItems.filter(m => lastNames.includes(m.name?.toLowerCase().trim())).map(m => m.categoryId);
  const recs = allMenuItems
    .filter(m => m.isAvailable !== false && !lastNames.includes(m.name?.toLowerCase().trim()) && (lastCategoryIds.includes(m.categoryId) || m.isBestSeller === true || m.isChefSpecial === true))
    .slice(0, 3)
    .map(m => ({ ...m, matchReason: lastCategoryIds.includes(m.categoryId)
      ? (language === 'mr' ? 'तुमच्या मागील ऑर्डरनुसार' : 'Based on your last order')
      : m.isChefSpecial ? (language === 'mr' ? 'शेफ स्पेशल' : "Chef's pick") : (language === 'mr' ? 'बेस्टसेलर' : 'Bestseller') }));
  welcomeRecsPendingRef.current = false;
  setRecommendedDishes(recs);
};
useEffect(() => {
  if (welcomeRecsPendingRef.current && allMenuItems.length && lastOrderItemsRef.current) computeWelcomeRecsRef.current(lastOrderItemsRef.current);
}, [allMenuItems]);

useEffect(() => {
  // Only for dine-in table scans — not counter mode
  if (!tenantId || tableNumber === 'Counter' || isCounterScan) return;
  if (welcomeDismissed) return;
 
  let savedPhone = null;
  try { savedPhone = localStorage.getItem(`pratyeksha_phone_${tenantId}`); } catch {}
  // A guest already remembered from a previous bill / registration is not asked "Been here before?" again.
  if (!savedPhone) {
    try {
      const h = JSON.parse(localStorage.getItem(`pratyeksha_customer_history_${tenantId}`) || 'null');
      const hp = String(h?.phone || '').replace(/\D/g, '');
      if (h?.name && hp.length === 10) savedPhone = hp;
    } catch {}
  }
 
  if (savedPhone && savedPhone.length === 10) {
    // ── RETURNING CUSTOMER: try to recognize and show full welcome card ──
    setWelcomeLoading(true);
    axios.get(`${BASE_URL}/customers/recognize/${tenantId}/${savedPhone}`)
      .then(r => {
        if (r.data?.found) {
          setWelcomeCard(r.data);
          // ── Compute smart dish recommendations from last order history ──
if (r.data?.lastOrderItems?.length > 0) {
  // The menu usually has NOT finished loading when this response arrives, and this effect's closure only saw the empty
  // first-render menu, so returning customers never got recommendations. Compute from the live menu, and again once it loads.
  welcomeRecsPendingRef.current = true;
  computeWelcomeRecsRef.current && computeWelcomeRecsRef.current(r.data.lastOrderItems);
}
          setWelcomePhone(savedPhone);
        } else {
          // Phone saved locally but not in DB — show phone prompt
          setShowPhonePrompt(true);
        }
      })
      .catch(() => {
        // Network error — still show prompt as fallback
        setShowPhonePrompt(true);
      })
      .finally(() => setWelcomeLoading(false));
  } else {
    // ── NEW CUSTOMER: show phone prompt immediately on scan ──
    // Small delay so menu loads first and feels settled
    const timer = setTimeout(() => {
      setShowPhonePrompt(true);
    }, 1200);
    return () => clearTimeout(timer);
  }
}, [tenantId, tableNumber, isCounterScan, welcomeDismissed]);


const sendBatchToKitchen = async () => {
  // Direct dine-in ordering remains tied to a QR/table session. Directory,
  // notification and install routes never flip this flag on their own.
  if (!isCounterScan && !hasQrSession) {
    triggerAlert('Please scan the restaurant QR code to start table ordering.', 'error');
    return;
  }
  if (isPlacingOrder || placingRef.current) return;
  setIsPlacingOrder(true);      
  try {
    const summary = {};
    Object.entries(cart).forEach(([key, qty]) => {
      const isMulti = key.includes('-');
      const id = isMulti ? key.split('-')[0] : key;
      const portion = isMulti ? key.split('-')[1] : 'Single';
      const item = allMenuItems.find(i => i._id === id);
      if (!item) return;
 
      const summaryKey = `${id}-${portion}`;
      if (!summary[summaryKey]) {
        const unitPrice = Number(portion === 'Half' ? (item.priceHalf || item.price) : (item.priceFull || item.price)) || 0;
summary[summaryKey] = {
  menuItemId:   item._id,
  name:         item.name,
  name_mr:      item.name_mr,
  categoryId:   item.categoryId,      // ← ADD THIS LINE
  quantity:     0,
  portion:      portion,
  pricePerUnit: unitPrice,
  subtotal:     0,
  suggestion:   suggestions[key] || "",
  isVeg:        item.isVeg !== false
};
      }
      summary[summaryKey].quantity += qty;
      summary[summaryKey].subtotal  = summary[summaryKey].quantity * summary[summaryKey].pricePerUnit;
    });
 
    // ── Validate items are still available before sending ──
const unavailableItems = Object.entries(summary)
  .filter(([, item]) => {
    const menuItem = allMenuItems.find(m => m._id === item.menuItemId);
    return menuItem && menuItem.isAvailable === false;
  })
  .map(([, item]) => item.name);

if (unavailableItems.length > 0) {
  triggerAlert(
    `${unavailableItems.join(', ')} ${unavailableItems.length > 1 ? 'are' : 'is'} no longer available. Please remove from cart.`,
    'error'
  );
  setIsPlacingOrder(false);
  return;
}
    const orderItems = Object.values(summary);
    if (orderItems.length === 0) { triggerAlert('orderError', 'error'); return; }

    // ── Editing a just-placed order: replace its dishes instead of creating a second order ──
    if (modifyingOrderId) {
      try {
        const mres = await axios.patch(`${BASE_URL}/orders/${modifyingOrderId}/customer-modify`, { tenantId, items: orderItems });
        const upd = mres.data?.order;
        if (!mres.data?.unchanged && upd) {
          const fresh = (upd.items || []).filter(i => !i.isExtraItem).map(i => ({ ...i, menuItemId: i.menuItemId ? String(i.menuItemId) : null }));
          setModifiable(prev => prev ? { ...prev, items: fresh } : prev);
          setPlacedOrders(prev => [
            ...prev.filter(p => String(p.orderId || '') !== String(modifyingOrderId)),
            ...(upd.items || []).map(i => ({ menuItemId: i.menuItemId || null, name: i.name || '', name_mr: i.name_mr || '', quantity: i.quantity || 1, portion: i.portion || 'Single', pricePerUnit: i.pricePerUnit || 0, subtotal: i.subtotal || 0, isExtraItem: !!i.isExtraItem, extraItemId: i.extraItemId || null, orderId: modifyingOrderId }))
          ]);
          setOrderPlacedAt(Date.now());
          setPrepPct(0);
        }
        triggerAlert(mres.data?.unchanged ? 'No changes to send.' : 'Order updated — the kitchen has been told.');
        setModifyingOrderId(null);
        setCart({}); setSuggestions({}); setRecommendedDishes([]);
        setIsDrawerOpen(false);
        if (!mres.data?.unchanged) showPlacedScreen(15000);
      } catch (merr) {
        const code = merr?.response?.data?.code;
        triggerAlert(merr?.response?.data?.error || 'Could not update the order. Please try again.', 'error');
        if (code === 'MODIFY_LOCKED' || code === 'MODIFY_WINDOW_CLOSED') {
          setModifyingOrderId(null); setModifiable(null); setCart({}); setSuggestions({});
        }
      }
      return;
    }
    const total = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
 
  const taxRate = ((restaurantData?.config?.cgstPercentage ?? 2.5) + (restaurantData?.config?.sgstPercentage ?? 2.5)) / 100;
  const payload = {
    tenantId,
    tableNumber,
    source: isCounterScan ? 'counter-pickup' : 'direct',
    items: orderItems,
    billDetails: {
      itemsTotal: total,
      taxAmount:  Math.round(total * taxRate * 100) / 100,
      grandTotal: Math.round(total * (1 + taxRate) * 100) / 100
    },
    status: "pending",
    paymentStatus: "unpaid"
  };
 
    const orderRes = await axios.post(`${BASE_URL}/orders`, payload);
    const placedOrderId = orderRes.data?.order?._id || orderRes.data?._id;
    if (placedOrderId) {
      setLiveOrderStatuses(prev => ({ ...prev, [placedOrderId]: 'pending' }));
      setOrderPlacedAt(Date.now());
setPrepPct(0);
    }
 
    
    setPlacedOrders(prev => [...prev, ...orderItems.map(i => ({ ...i, orderId: placedOrderId || undefined }))]);
    if (placedOrderId) setModifiable({ orderId: placedOrderId, deadline: Date.now() + (Number(orderRes.data?.modifyWindowMsLeft) || 120000), items: orderItems });
 
    // ── Customer upsert — single declaration, no duplicate ──
    let storedPhone = null;
    try { storedPhone = localStorage.getItem(`pratyeksha_phone_${tenantId}`); } catch {}
    const knownPhone = welcomePhone || storedPhone || savedCustomer?.phone || String(customerInfo.phone || '').replace(/\D/g, '');
    if (knownPhone && knownPhone.length === 10 && getGuestConsent(tenantId)) {
      const visitItems = orderItems.map(i => ({
        menuItemId: i.menuItemId,
        name:       i.name,
        quantity:   i.quantity,
        subtotal:   i.subtotal,
      }));
      const credit = getCredit();
      upsertGuest({
        tenantId,
        name:           customerInfo.name?.trim() || welcomeCard?.name || savedCustomer?.name || '',
        phone:          knownPhone,
        lastOrderItems: visitItems,
        visitAmount:    total,
        incrementVisit: !credit.visit,
      }).then(r => { if (r) addCredit({ visit: true, spend: total, dishes: true }); }).catch(() => {});
    }
 
    triggerAlert("orderSuccess");
    setHasPlacedInitialOrder(true);
    setCart({});
    setSuggestions({});
    setRecommendedDishes([]);
    setIsDrawerOpen(false);
    showPlacedScreen(60000);
 
  } catch (error) {
    console.error(error);
    // The server explains refusals ("<dish> is currently unavailable", "Insufficient stock for …", "Duplicate order detected").
    // Showing only a generic failure made guests retry blindly (and a retry of a duplicate is blocked again).
    const st = error?.response?.status;
    triggerAlert((st === 400 || st === 409) && error.response.data?.error ? error.response.data.error : "orderError", "error");
  }
  finally{
     setIsPlacingOrder(false);    
  }
};
 
const placeWaitlistOrder = async () => {
  if (!customerInfo.name.trim()) return;
  if (String(customerInfo.phone || '').replace(/\D/g, '').length !== 10) { triggerAlert('Please enter a valid 10-digit mobile number.', 'error'); return; }
  if (isPlacingOrder || placingRef.current) return;
  setIsPlacingOrder(true);             // ← ADD
  const summary = {};
  Object.entries(cart).forEach(([key, qty]) => {
    const isMulti = key.includes('-');
    const id = isMulti ? key.split('-')[0] : key;
    const portion = isMulti ? key.split('-')[1] : 'Single';
    const item = allMenuItems.find(i => i._id === id);
    if (!item) return;
    const summaryKey = `${id}-${portion}`;
    if (!summary[summaryKey]) {
      const unitPrice = Number(portion === 'Half' ? (item.priceHalf || item.price) : (item.priceFull || item.price)) || 0;
      summary[summaryKey] = { menuItemId: item._id, name: item.name, quantity: 0, portion, pricePerUnit: unitPrice, subtotal: 0, price: unitPrice };
    }
    summary[summaryKey].quantity += qty;
    summary[summaryKey].subtotal = summary[summaryKey].quantity * summary[summaryKey].pricePerUnit;
  });

  const orderItems = Object.values(summary);
  const total = orderItems.reduce((a, i) => a + i.subtotal, 0);

  try {
const res = await axios.post(`${BASE_URL}/waitlist/${tenantId}`, {
      sessionId,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone?.replace(/\D/g, '') || '',
      partySize,
      mode: counterMode,
      items: orderItems,
      totalAmount: total,
      scheduledPickupTime: scheduledPickupTime || null,
      specialRequests: specialRequests || ''
    });
    setWaitlistEntry(res.data.entry);
    setCart({}); setSuggestions({});setRecommendedDishes([]);
    setRegistrationStep('confirm');
    setIsDrawerOpen(false);
    triggerAlert('orderSuccess');
    setIsPlacingOrder(false); // the order is saved; don't keep the button locked while the guest answers permission prompts below

    // Everything below is best-effort. An exception here used to jump to the catch and show "order error" even though the
    // waitlist entry had just been saved.
    try {
    // ── ADD THIS: upsert customer into CustomerSchema ──
    const phone = customerInfo.phone?.replace(/\D/g, '') || '';
    if (phone.length === 10) {
      upsertGuest({
        tenantId,
        name: customerInfo.name.trim(),
        phone,
        lastVisit: new Date().toISOString(),
        incrementVisit: counterMode === 'pickup',
        lastOrderItems: orderItems.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          subtotal: i.subtotal,
        })),
        visitAmount: total,
      }).catch(() => {});
      await registerCustomerPushSubscription(phone);
    }

    // ── Request push notification permission after order placed ──
const askNotificationPermission = async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      safeNotify(
        counterMode === 'dine-in'
          ? '✓ You\'re in the queue!'
          : '✓ Pickup order placed!',
        {
          body: counterMode === 'dine-in'
            ? `Hi ${customerInfo.name}! We'll notify you when your table is ready.`
            : `Hi ${customerInfo.name}! We'll notify you when your order is ready for pickup.`,
          event: counterMode === 'dine-in' ? 'waitlist-joined' : 'pickup-confirmed',
        }
      );
    }
  } else if (Notification.permission === 'granted') {
    safeNotify(
      counterMode === 'dine-in' ? '✓ Queue confirmed!' : '✓ Pickup confirmed!',
      {
        body: counterMode === 'dine-in'
          ? `Hi ${customerInfo.name}! You're in the queue.`
          : (scheduledPickupTime && !isNaN(new Date(scheduledPickupTime))
              ? `Order placed for pickup at ${new Date(scheduledPickupTime).toLocaleTimeString([],{ timeZone: 'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true})}.`
              : 'Your pickup order has been placed.'),
        event: counterMode === 'dine-in' ? 'waitlist-joined' : 'pickup-confirmed',
      }
    );
  }
};
askNotificationPermission();




    // Subscribe to push after order placed
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const keyRes = await axios.get(`${BASE_URL}/waitlist/vapid-public-key`);
        const vapidKey = keyRes.data?.publicKey;
        if (vapidKey) {
          const reg = await navigator.serviceWorker.register('/sw.js');
          const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
          if (perm === 'granted') {
            function urlBase64ToUint8Array(b) {
              const pad = '='.repeat((4 - b.length % 4) % 4);
              const base64 = (b + pad).replace(/-/g, '+').replace(/_/g, '/');
              const raw = window.atob(base64);
              const arr = new Uint8Array(raw.length);
              for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
              return arr;
            }
            const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
            await axios.patch(`${BASE_URL}/waitlist/session/${tenantId}/${sessionId}/push-subscription`, { subscription: sub.toJSON(), pageUrl: window.location.href });
          }
        }
      } catch (e) { console.warn('Push subscription failed:', e); }
    }
    } catch (postErr) { console.warn('Post-order follow-up failed:', postErr); }
  } catch (err) {
    console.error('Waitlist order error:', err);
    // The API answers precise 400s ("Valid 10-digit phone number required", "scheduledPickupTime is in the past"); the guest only ever saw a generic failure.
    triggerAlert(err?.response?.status === 400 && err.response.data?.error ? err.response.data.error : 'orderError', 'error');
  } finally {
    setIsPlacingOrder(false);           // ← ADD
  }
};

const placeReservation = async () => {
  if (!customerInfo.name.trim() || !customerInfo.phone || !reservationDate || !reservationTime) return;
  if (String(customerInfo.phone || '').replace(/\D/g, '').length !== 10) { triggerAlert('Please enter a valid 10-digit mobile number.', 'error'); return; }

  if (waitlistEntry?._id && waitlistEntry?.mode === 'reservation') {
    setRegistrationStep('confirm');
    setIsDrawerOpen(false);
    return;
  }

  if (isPlacingOrder || placingRef.current) return;
  setIsPlacingOrder(true);

  const summary = {};
  Object.entries(cart).forEach(([key, qty]) => {
    const isMulti = key.includes('-');
    const id = isMulti ? key.split('-')[0] : key;
    const portion = isMulti ? key.split('-')[1] : 'Single';
const item = allMenuItems.find(i => i._id === id || i._id?.toString() === id);
if (!item) return; // ← ADD: skip deleted/missing items
const summaryKey = `${id}-${portion}`;
if (!summary[summaryKey]) {
  const unitPrice = Number(portion === 'Half' ? (item.priceHalf || item.price) : (item.priceFull || item.price)) || 0;
      summary[summaryKey] = { menuItemId: item._id, name: item.name, quantity: 0, portion, pricePerUnit: unitPrice, subtotal: 0, price: unitPrice };
    }
    summary[summaryKey].quantity += qty;
    summary[summaryKey].subtotal = summary[summaryKey].quantity * summary[summaryKey].pricePerUnit;
  });

  const orderItems = Object.values(summary);
  const total = orderItems.reduce((a, i) => a + i.subtotal, 0);
  const [hours, minutes] = reservationTime.split(':').map(Number);
  // Restaurant time is IST. `new Date('YYYY-MM-DD')` is UTC midnight and setHours() uses the DEVICE zone, so the booked
  // time was wrong (even a different day) on any phone outside IST.
  const resDateTime = new Date(`${reservationDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`);

  try {
    // ── Place reservation ──
    const res = await axios.post(`${BASE_URL}/reservations/${tenantId}`, {
      sessionId,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone?.replace(/\D/g, '') || '',
      partySize,
      reservationTime: resDateTime.toISOString(),
      tablePreference,
      specialRequests,
      items: orderItems,
      totalAmount: total,
      status: 'pending'
    });

setWaitlistEntry({ ...res.data.reservation, mode: 'reservation' });
    setCart({}); setSuggestions({});setRecommendedDishes([]);
    setRegistrationStep('confirm');
    setIsDrawerOpen(false);
    triggerAlert('orderSuccess');
    setIsPlacingOrder(false);

    // ── Auto-save / upsert customer in DB with visit count ──
    const phone = customerInfo.phone?.replace(/\D/g, '') || '';
    if (phone.length === 10) {
      upsertGuest({
        tenantId,
        name: customerInfo.name.trim(),
        phone,
        lastVisit: new Date().toISOString(),
      }).catch(() => {}); // silent — don't block UI
    }

    // ── Notification ── (best-effort: a throwing permission prompt must not turn a saved reservation into an error)
    if ('Notification' in window) try {
      const perm = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
      if (perm === 'granted') {
        safeNotify('Reservation Requested!', {
          body: `Hi ${customerInfo.name}! Your table for ${partySize} on ${resDateTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })} at ${resDateTime.toLocaleTimeString([], { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })} is pending confirmation.`,
          event: 'reservation-update',
        });
      }
    } catch { /* notifications unavailable */ }
  } catch (err) {
    console.error(err);
    triggerAlert(err?.response?.status === 400 && err.response.data?.error ? err.response.data.error : 'orderError', 'error');
  } finally {
    setIsPlacingOrder(false);
  }
};

  const calculateGrandTotal = () => {
    const subtotal = placedOrders.reduce((sum, item) => sum + item.subtotal, 0);
    return subtotal; // Assuming direct sum for simplicity as per UI requirement
  };

// 📊 UNIFIED RECEIPT AGGREGATOR
  const receiptData = useMemo(() => {
    if (placedOrders.length === 0) return null;
    
    // Group by ID + Portion to match the onscreen summary
    const map = {};
    placedOrders.forEach(item => {
const key = item.isExtraItem
        ? `extra-${item.extraItemId || item.name}-${item.portion}`
        : `${item.menuItemId}-${item.portion}`;      if (!map[key]) {
        map[key] = { ...item };
      } else {
        map[key].quantity += item.quantity;
        map[key].subtotal += item.subtotal;
      }
    });

    const items = Object.values(map);
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      items,
      total,
      billNo: placedOrders[0]?.billNo || '—', // the real bill number only exists after settlement; '001' was shown on every receipt
      date: new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      time: new Date().toLocaleTimeString([], { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
    };
  }, [placedOrders]);
  
  // 📊 COMPUTED AGGREGATE: Group placed items for the final receipt view
const finalBillItems = useMemo(() => {
    const map = {};
    placedOrders.forEach(item => {
      // Extra items use their own ID as key to prevent merging
      const key = item.isExtraItem
        ? `extra-${item.extraItemId || item.name}-${item.portion}`
        : `${item.menuItemId}-${item.portion}`;
      if (!map[key]) {
        map[key] = { ...item };
      } else {
        map[key].quantity += item.quantity;
        map[key].subtotal += item.subtotal;
      }
    });
    return Object.values(map);
  }, [placedOrders]);


// The amount a guest pays: the SAME formula as the invoice PDF and the server (items ex-tax, CGST + SGST added, 2-decimal rounding).
const payableAmount = useMemo(() => {
  const cgstPct = restaurantData?.config?.cgstPercentage ?? 2.5;
  const sgstPct = restaurantData?.config?.sgstPercentage ?? 2.5;
  const r2 = (n) => Math.round(n * 100) / 100;
  const subtotal = finalBillItems.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const cgst = r2(r2(subtotal) * (cgstPct / 100));
  const sgst = r2(r2(subtotal) * (sgstPct / 100));
  return r2(r2(subtotal) + cgst + sgst);
}, [finalBillItems, restaurantData]);

// Bill generated ⇒ the table session ends (server + this browser). Keeps a small snapshot so an unpaid bill can still be paid
// after a reload, without ever reopening the menu.
const markBillGenerated = () => {
  if (isCounterScan || !tableNumber || tableNumber === 'Counter') return;
  const snap = {
    total: payableAmount, items: finalBillItems.length, name: customerInfo.name, createdAt: Date.now(), claimed: false,
    upi: payInfo && payInfo.enabled ? { upiId: payInfo.upiId, payeeName: payInfo.payeeName } : null,
    restaurant: restaurantData?.name || '',
  };
  try { localStorage.setItem(BILL_KEY(tenantId, tableNumber), JSON.stringify(snap)); } catch { /* storage blocked */ }
  setLastBill(snap);
  const ts = readTSession();
  writeTSession({ ...(ts || { tenantId, tableNumber }), closed: true });   // closed in this browser even if the network call below fails
  setSessionClosedLocal(true);
  (async () => {
    for (let i = 0; i < 3; i++) {
      try { await axios.post(`${BASE_URL}/table-session/close`, { tenantId, tableNumber }, { px_silent: true }); return; }
      catch (e) { const st = e?.response?.status; if (st && st < 500) return; await sleep(1500 * (i + 1)); }
    }
  })();
};
const onUpiClaimed = () => {
  setLastBill((prev) => {
    const n = { ...(prev || {}), claimed: true };
    try { localStorage.setItem(BILL_KEY(tenantId, tableNumber), JSON.stringify(n)); } catch { /* ignore */ }
    return n;
  });
};

const autoDownloadInvoicePDF = useCallback(() => {
  const rd = restaurantData;
  const cgstPct = rd?.config?.cgstPercentage ?? 2.5;
  const sgstPct = rd?.config?.sgstPercentage ?? 2.5;
  const subtotal   = finalBillItems.reduce((s, i) => s + (i.subtotal || 0), 0);
  // Same 2-decimal rounding the server uses at settlement (it never rounds the grand total to a whole rupee), so the
  // customer's invoice matches the operator's bill to the paisa.
  const r2 = (n) => Math.round(n * 100) / 100;
  const escHtml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cgstAmt    = r2(r2(subtotal) * (cgstPct / 100));
  const sgstAmt    = r2(r2(subtotal) * (sgstPct / 100));
  const grandTotal = r2(r2(subtotal) + cgstAmt + sgstAmt);
  const taxableAmt = subtotal; // items are priced ex-tax; tax is added on top

  const addr = [rd?.address?.street, rd?.address?.city, rd?.address?.state, rd?.address?.pincode]
    .filter(Boolean).join(', ');
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata',
   
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  const invoiceNo  = `INV-${Date.now().toString().slice(-8)}`;
  const dateStr    = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata',
    day: 'numeric', month: 'long', year: 'numeric'
  }).toUpperCase();
  const timeStr    = new Date().toLocaleTimeString([], { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

  const itemRows = finalBillItems.map((item, idx) => `
    <tr>
      <td class="desc">
        <span class="item-name">${item.quantity}x ${escHtml(item.name)}${item.portion && item.portion !== 'Single' ? ` (${escHtml(item.portion)})` : ''}${item.isExtraItem ? ' *' : ''}</span>
        <span class="item-rate">@ ₹${item.pricePerUnit} / item</span>
      </td>
      <td class="num">₹${(item.pricePerUnit * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice — ${invoiceNo}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    color: #000;
    background: #fff;
  }
  .page {
    width: 595px;
    margin: 0 auto;
    padding: 40px 44px 48px;
    background: #fff;
  }

  /* ── HEADER ── */
  .top-rule { border-top: 2.5px solid #000; margin-bottom: 0; }

  .header-meta {
    text-align: center;
    padding: 20px 0 16px;
    border-bottom: 1px solid #ccc;
    margin-bottom: 18px;
  }
  .invoice-label {
    font-size: 9px; font-weight: 700; letter-spacing: 4px;
    text-transform: uppercase; color: #888; margin-bottom: 10px;
  }
  .rest-name {
    font-size: 26px; font-weight: 900; color: #000;
    letter-spacing: -0.5px; line-height: 1.15; margin-bottom: 8px;
  }
  .rest-sub {
    font-size: 11px; color: #444; line-height: 1.8;
  }
  .rest-sub strong { font-weight: 800; }

  /* ── BILL META ── */
  .meta-row {
    display: flex; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 14px;
    border-bottom: 2px solid #000; border-top: 2px solid #000;
    padding-top: 12px;
  }
  .meta-left .bill-label { font-size: 10px; color: #888; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 2px; }
  .meta-left .bill-no   { font-size: 16px; font-weight: 900; color: #000; }
  .meta-right { text-align: right; }
  .meta-right .date-val { font-size: 14px; font-weight: 800; color: #000; }
  .meta-right .time-val { font-size: 12px; color: #666; margin-top: 2px; }

  .customer-block {
    font-size: 12px; line-height: 1.7; color: #000;
    padding-bottom: 16px; border-bottom: 1px solid #ccc;
    margin-bottom: 16px;
  }
  .customer-block div { font-weight: 500; }

  /* ── ITEMS TABLE ── */
  table.items { width: 100%; border-collapse: collapse; }
  table.items thead tr {
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }
  table.items th {
    font-size: 9px; font-weight: 800; letter-spacing: 2px;
    text-transform: uppercase; color: #888;
    padding: 8px 6px; text-align: left;
  }
  table.items th.num { text-align: right; }
  table.items td {
    padding: 11px 6px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  .item-name { display: block; font-size: 13px; font-weight: 600; color: #000; }
  .item-rate { display: block; font-size: 10px; color: #999; margin-top: 3px; }
  td.num { text-align: right; font-size: 13px; font-weight: 700; color: #000; white-space: nowrap; }

  /* ── TAX BLOCK ── */
  .tax-block { width: 280px; margin-left: auto; margin-top: 10px; }
  .tax-row {
    display: flex; justify-content: space-between;
    padding: 5px 0; font-size: 12px; color: #444;
    border-bottom: 1px solid #f0f0f0;
  }
  .tax-row.subtotal-row { font-weight: 700; color: #000; }
  .grand-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 12px 0 4px; border-top: 2.5px solid #000; margin-top: 8px;
  }
  .grand-label { font-size: 14px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
  .grand-amt   { font-size: 26px; font-weight: 900; font-family: Arial, sans-serif; }
  .words-note  { text-align: right; font-size: 10px; color: #888; font-style: italic; margin-top: 4px; }
  .gst-note    { text-align: right; font-size: 9px; color: #bbb; margin-top: 3px; }

  /* ── FOOTER ── */
  .footer {
    margin-top: 28px; border-top: 1px solid #ccc;
    padding-top: 14px; display: flex;
    justify-content: space-between; align-items: center;
  }
  .footer-msg   { font-size: 11px; color: #666; font-style: italic; }
  .footer-brand { font-size: 8px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #bbb; }
</style>
</head>
<body>
<div class="page" id="invoice-root">

  <div class="top-rule"></div>

  <!-- RESTAURANT HEADER -->
  <div class="header-meta">
    <div class="invoice-label">Tax Invoice</div>
    <div class="rest-name">${escapeHtml(rd?.name || 'RESTAURANT')}</div>
    <div class="rest-sub">
      ${addr ? `${escapeHtml(addr)}<br/>` : ''}
      ${rd?.contact ? `Tel: ${escapeHtml(rd.contact)}<br/>` : ''}
      ${rd?.gstin && rd.gstin !== 'GSTIN PENDING'
        ? `<strong>GSTIN: ${escapeHtml(rd.gstin)}</strong><br/>`
        : '<strong>GSTIN: GSTIN PENDING</strong><br/>'}
      <span style="font-size:10px;color:#888;">SAC Code: 996331 · GST Rate: ${(cgstPct+sgstPct).toFixed(1)}% (CGST ${cgstPct}% + SGST ${sgstPct}%)</span>
    </div>
  </div>

  <!-- BILL META -->
  <div class="meta-row">
    <div class="meta-left">
      <div class="bill-label">BILL NO.</div>
      <div class="bill-no">#${invoiceNo.replace('INV-','')}</div>
    </div>
    <div class="meta-right">
      <div class="date-val">${dateStr}</div>
      <div class="time-val">${timeStr}</div>
    </div>
  </div>

  <!-- CUSTOMER -->
  <div class="customer-block">
    <div>Customer: ${escapeHtml(customerInfo.name || 'Guest')}</div>
    ${customerInfo.phone ? `<div>Phone: ${escapeHtml(customerInfo.phone)}</div>` : ''}
    <div>Table: ${escapeHtml(tableNumber)}</div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items">
    <thead>
      <tr>
        <th>Item Description</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  ${finalBillItems.some(i => i.isExtraItem) ? `<div style="font-size:9.5px;color:#aaa;margin-top:6px;font-style:italic;">* Extra items ordered at counter</div>` : ''}

  <!-- TAX BREAKDOWN -->
  <div class="tax-block">
    <div class="tax-row subtotal-row">
      <span>Subtotal</span>
      <span>₹${taxableAmt.toFixed(2)}</span>
    </div>
    <div class="tax-row">
      <span>CGST @ ${cgstPct}%</span>
      <span>₹${cgstAmt.toFixed(2)}</span>
    </div>
    <div class="tax-row">
      <span>SGST @ ${sgstPct}%</span>
      <span>₹${sgstAmt.toFixed(2)}</span>
    </div>
    <div class="grand-row">
      <span class="grand-label">Grand Total</span>
      <span class="grand-amt">₹${Number.isInteger(grandTotal) ? grandTotal : grandTotal.toFixed(2)}</span>
    </div>
    <div class="words-note"><em>${numberToWordsClient(Math.round(grandTotal))}</em></div>
    <div class="gst-note">GST @ ${(cgstPct+sgstPct).toFixed(1)}% (CGST ${cgstPct}% + SGST ${sgstPct}%) · SAC 996331</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-msg">Thank you for dining with us! Please visit again.</div>
    <div class="footer-brand"><img src="${window.location.origin}${PRATYEKSHAA_LOGO}" alt="Pratyeksha" style="width:120px;height:auto;background:#f7f3eb;border-radius:5px;padding:3px 6px;display:block"/></div>
  </div>

</div>

<script>
  window.onload = function() {
    var element = document.getElementById('invoice-root');
    var opt = {
      margin:      [8, 8, 8, 8],
      filename:    'TaxInvoice_Table${String(tableNumber).replace(/[^A-Za-z0-9_-]/g, '')}_${invoiceNo}.pdf',
      image:       { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(function() {
      setTimeout(function() { window.close(); }, 90000);
    });
  };
</script>
</body>
</html>`;

  // Open in new tab — html2pdf auto-downloads the PDF then closes
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) triggerAlert('Please allow pop-ups to download your invoice.', 'error'); // a blocked pop-up used to fail silently
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}, [restaurantData, finalBillItems, customerInfo, tableNumber, numberToWordsClient]);

  // Add this useEffect to ask notification permission early, before order is placed
useEffect(() => {
  if (!isCounterScan) return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    // Small delay so page feels settled before asking
    const t = setTimeout(() => {
      Notification.requestPermission();
    }, 2500);
    return () => clearTimeout(t);
  }
}, [isCounterScan]);
const requestFinalBill = async () => {
  if (!customerInfo.name || !customerInfo.phone) { triggerAlert("detailsReq", "error"); return; }
  try { localStorage.setItem(`pratyeksha_customer_history_${tenantId}`, JSON.stringify({ name: customerInfo.name.trim(), phone: customerInfo.phone.replace(/\D/g,'') })); } catch {}
  try {
    setApprovedCustomerBill(null);
    waitlistSocket.emit("request_bill", { tenantId, tableNumber, name: customerInfo.name, phone: customerInfo.phone.replace(/\D/g, '') });

    const visitItems = finalBillItems
      .filter(i => !i.isExtraItem)
      .map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        subtotal: i.subtotal,
      }));

    const visitTotal = finalBillItems.reduce((sum, i) => sum + (i.subtotal || 0), 0);

    // Orders already credited this table's visit, spend and dishes when they were placed — only add what is missing.
    const credit = getCredit();
    const billUpsert = await upsertGuest({
      tenantId,
      name: customerInfo.name.trim(),
      phone: customerInfo.phone.replace(/\D/g, ''),
      lastVisit: new Date().toISOString(),
      ...(credit.dishes ? {} : { lastOrderItems: visitItems }),
      visitAmount: Math.max(0, Math.round((visitTotal - credit.spend) * 100) / 100),
      incrementVisit: !credit.visit,
    });
    if (billUpsert) addCredit({ visit: true, spend: Math.max(0, visitTotal - credit.spend), dishes: true });

    const phoneDigits = customerInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length === 10) {
      await registerCustomerPushSubscription(phoneDigits);
      setTimeout(() => {
        axios.get(`${BASE_URL}/customers/recognize/${tenantId}/${phoneDigits}`)
          .then(r => {
  if (r.data?.found) {
    setWelcomeCard(r.data);
    // ── Compute recommendations ──
    if (r.data?.lastOrderItems?.length > 0) {
      const lastNames = r.data.lastOrderItems.map(i => i.name?.toLowerCase().trim());
      const lastCategoryIds = allMenuItems
        .filter(m => lastNames.includes(m.name?.toLowerCase().trim()))
        .map(m => m.categoryId);
      const recs = allMenuItems
        .filter(m =>
          m.isAvailable !== false &&
          !lastNames.includes(m.name?.toLowerCase().trim()) &&
          (lastCategoryIds.includes(m.categoryId) || m.isBestSeller || m.isChefSpecial)
        )
        .slice(0, 3)
        .map(m => ({
          ...m,
          matchReason: lastCategoryIds.includes(m.categoryId)
            ? 'Based on your last order'
            : m.isChefSpecial ? "Chef's pick" : 'Bestseller'
        }));
      setRecommendedDishes(recs);
    }
  }
})
          .catch(() => {});
      }, 800);
    }

    // ── CLEAR everything after checkout ──
    try {
      localStorage.removeItem(`pratyeksha_placed_${tenantId}_${tableNumber}`);
      localStorage.removeItem(`pratyeksha_cart_${tenantId}_${tableNumber}`);
    } catch { /* storage unavailable */ }
    markBillGenerated();
    setBillRequested(true);
    // placedOrders intentionally NOT cleared here — still needed for the bill summary display
    // They clear when modal closes (see isBillOpen X handler below)

  } catch (error) {
    try {
      localStorage.removeItem(`pratyeksha_placed_${tenantId}_${tableNumber}`);
      localStorage.removeItem(`pratyeksha_cart_${tenantId}_${tableNumber}`);
    } catch { /* storage unavailable */ }
    markBillGenerated();
    setBillRequested(true);
  }
};

  const hasNonVegInView = useMemo(() => {
    if (isOnlyVegTenant) return false;
    return allMenuItems.some(i => i.isVeg !== true && i.isAvailable !== false);
  }, [allMenuItems, isOnlyVegTenant]);


const reservationValid = counterMode !== 'reservation' || (reservationDate && reservationTime);
const ctaEnabled = customerInfo.name.trim() && reservationValid;

// ── Customer Web Push subscription ──
// Uses the server's existing VAPID endpoint and stores the subscription against
// the existing customer record. Push delivery is handled by /sw.js, so it also
// works while the installed PWA is closed.
const registerCustomerPushSubscription = async (phoneOverride) => {
  const phone = String(phoneOverride || customerInfo.phone || '').replace(/\D/g, '');
  if (!tenantId || phone.length !== 10 || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const keyRes = await axios.get(`${BASE_URL}/waitlist/vapid-public-key`);
    const vapidKey = keyRes.data?.publicKey;
    if (!vapidKey) return;
    // navigator.serviceWorker.ready never resolves when no worker is registered (sw.js missing, plain-http dev, blocked).
    // Callers `await` this, so the bill / waitlist confirmation used to hang forever. Give up after 4 s.
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    if (!reg) return;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      if (typeof Notification === 'undefined') return;
      const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (perm !== 'granted') return;
      const pad = '='.repeat((4 - vapidKey.length % 4) % 4);
      const raw = window.atob((vapidKey + pad).replace(/-/g, '+').replace(/_/g, '/'));
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: arr });
    }
    await axios.post(`${BASE_URL}/customers/push-subscription`, { tenantId, phone, subscription: sub.toJSON?.() || sub });
  } catch (err) {
    console.warn('Push subscription failed:', err?.message || err);
  }
};


// ── Persist cart to localStorage so it survives browser close ──
const cartRestoredKeyRef = useRef(null);
useEffect(() => {
  if (!tenantId || !tableNumber || tableNumber === 'Counter' || isCounterScan) return;
  const cartKey = `pratyeksha_cart_${tenantId}_${tableNumber}`;
  // The restore effect below runs AFTER this one on mount: with the initial empty cart this branch removed the saved cart
  // before it could be read, so a reload/browser close always lost the cart. Wait until this key has been restored.
  if (cartRestoredKeyRef.current !== cartKey) return;
  // Storage can throw (Safari private mode / blocked storage / quota): an exception in this effect crashed the whole
  // customer menu the moment an item was added.
  try {
    if (Object.keys(cart).length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } else {
      localStorage.removeItem(cartKey);
    }
  } catch { /* persistence is best-effort */ }
}, [cart, tenantId, tableNumber, isCounterScan]);

// ── Persist placedOrders to localStorage on every change ──
useEffect(() => {
  if (!tenantId || !tableNumber || tableNumber === '' || isCounterScan) return;
  const key = `pratyeksha_placed_${tenantId}_${tableNumber}`;
  // Only ever WRITE here. Removing on an empty list ran on mount (placedOrders starts empty) and erased the saved bill
  // before anything could read it; the explicit clears (bill closed / requested) already remove the key.
  try {
    if (placedOrders.length > 0) localStorage.setItem(key, JSON.stringify(placedOrders));
  } catch { /* persistence is best-effort */ }
}, [placedOrders, tenantId, tableNumber, isCounterScan]);

// ── Restore placedOrders on mount — after tenantId AND tableNumber are both known ──
useEffect(() => {
  // tableNumber is set from URL params — wait until it's a real table (not empty string)
  if (!tenantId || !tableNumber || tableNumber === '' || isCounterScan) return;
// ADD at the top of the useEffect that reads the placed orders key (~line 2349):
const cartKey = `pratyeksha_cart_${tenantId}_${tableNumber}`;
try {
  const savedCart = localStorage.getItem(cartKey);
  if (savedCart) {
    const parsedCart = JSON.parse(savedCart);
    // A hand-edited / corrupted / older-format entry (NaN, 0, negative, string, array) used to be restored as-is and
    // inflated the cart badge and total; keep only positive whole quantities.
    const cleanCart = {};
    if (parsedCart && typeof parsedCart === 'object' && !Array.isArray(parsedCart)) {
      Object.entries(parsedCart).forEach(([k, q]) => { const n = Math.floor(Number(q)); if (k && Number.isFinite(n) && n > 0) cleanCart[k] = n; });
    }
    if (Object.keys(cleanCart).length > 0) {
      setCart(cleanCart);
    }
  }
} catch { /* ignore */ }
cartRestoredKeyRef.current = cartKey; // from now on the persist effect may write this key

}, [tenantId, tableNumber, isCounterScan]); // ← tableNumber in deps ensures it runs after URL param is parsed
// ── Modify window: tick once a second only while a window is open ──
useEffect(() => {
  if (!modifiable) return undefined;
  const id = setInterval(() => {
    const n = Date.now();
    setModifyTick(n);
    if (n >= modifiable.deadline) setModifiable(null);
  }, 1000);
  setModifyTick(Date.now());
  return () => clearInterval(id);
}, [modifiable]);
const modifySecsLeft = modifiable ? Math.max(0, Math.ceil((modifiable.deadline - modifyTick) / 1000)) : 0;
const canModifyOrder = !!modifiable && modifySecsLeft > 0 && (liveOrderStatuses[modifiable.orderId] ?? 'pending') === 'pending';
const modifyClock = `${Math.floor(modifySecsLeft / 60)}:${String(modifySecsLeft % 60).padStart(2, '0')}`;
// Window closed (time up or kitchen moved on) while editing: leave edit mode and drop the pre-filled cart so it can't be re-sent as a new order.
useEffect(() => {
  if (modifyingOrderId && !canModifyOrder) {
    setModifyingOrderId(null);
    setCart({}); setSuggestions({});
    triggerAlert('The 2-minute change window has ended. Please ask the staff for any change.', 'error');
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [canModifyOrder, modifyingOrderId]);

const startModifyOrder = () => {
  if (!canModifyOrder) return;
  const nextCart = {}; const nextSug = {};
  (modifiable.items || []).forEach(i => {
    if (i.isExtraItem || !i.menuItemId) return;
    const key = (i.portion && i.portion !== 'Single') ? `${i.menuItemId}-${i.portion}` : String(i.menuItemId);
    nextCart[key] = (nextCart[key] || 0) + (Number(i.quantity) || 1);
    if (i.suggestion) nextSug[key] = i.suggestion;
  });
  setCart(nextCart); setSuggestions(nextSug);
  setModifyingOrderId(modifiable.orderId);
  setOrderPlacedScreen(false);
  setIsDrawerOpen(true);
};
const cancelModifyEdit = () => { setModifyingOrderId(null); setCart({}); setSuggestions({}); setIsDrawerOpen(false); };
const modifyOrderStrip = canModifyOrder && !modifyingOrderId ? (
  <div style={{ margin: '0 16px 10px', padding: '10px 14px', borderRadius: '14px', border: '1px solid rgba(211,191,162,0.25)', background: 'rgba(211,191,162,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
    <div style={{ fontSize: '0.62rem', color: 'rgba(211,191,162,0.8)', fontWeight: 700, lineHeight: 1.35 }}>
      {language === 'mr' ? 'ऑर्डर बदलायचा आहे?' : 'Changed your mind?'}
      <div style={{ fontSize: '0.55rem', opacity: 0.6, fontFamily: 'monospace' }}>{modifyClock} {language === 'mr' ? 'शिल्लक' : 'left to change'}</div>
    </div>
    <button type="button" onClick={(e) => { e.stopPropagation(); startModifyOrder(); }}
      style={{ background: '#d3bfa2', color: '#0c0c0c', border: 'none', borderRadius: '10px', padding: '9px 14px', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {language === 'mr' ? 'ऑर्डर बदला' : 'MODIFY ORDER'}
    </button>
  </div>
) : null;

useEffect(() => {
  if (!orderPlacedAt || !orderEta?.etaMinutes) return;
  const etaMs = orderEta.etaMinutes * 60 * 1000;
  const tick = () => {
    const elapsed = Date.now() - orderPlacedAt;
    const pct = Math.min(95, Math.round((elapsed / etaMs) * 100)); // cap at 95% — hits 100 only when ready
    setPrepPct(pct);
  };
  tick();
  const interval = setInterval(tick, 10000); // update every 10s
  return () => clearInterval(interval);
}, [orderPlacedAt, orderEta]);

// ── RESTORE placedOrders FROM SERVER on mount (multi-device safe) ──
useEffect(() => {
  if (!tenantId || !tableNumber || tableNumber === '' || tableNumber === 'Counter' || isCounterScan) return;
  
  axios.get(`${BASE_URL}/orders/table/${tenantId}/${tableNumber}`)
    .then(r => {
      if (r.data?.allItems?.length > 0) {
        // Map server items to our placedOrders format
        const serverItems = r.data.allItems.map(item => ({
          menuItemId:   item.menuItemId || null,
          name:         item.name || '',
          name_mr:      item.name_mr || '',
          quantity:     item.quantity || 1,
          portion:      item.portion || 'Single',
          pricePerUnit: item.pricePerUnit || 0,
          subtotal:     item.subtotal || 0,
          isExtraItem:  item.isExtraItem || false,
          extraItemId:  item.extraItemId || null,
          orderId:      item.orderId || undefined,
        }));
        setPlacedOrders(serverItems);
        const restoredOrders = Array.isArray(r.data?.orders) ? r.data.orders : [];
        if (restoredOrders.length) {
          setLiveOrderStatuses(prev => {
            const next = { ...prev };
            restoredOrders.forEach(o => { if (o?._id && o?.status) next[o._id] = o.status; });
            return next;
          });
          const pending = restoredOrders.filter(o => o?.status === 'pending');
          const oldestPending = pending.sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))[0];
          if (oldestPending?.createdAt) setOrderPlacedAt(new Date(oldestPending.createdAt).getTime());
          // Page reloaded inside the 2-minute change window: keep the Modify button available.
          const newestPending = pending.length ? pending[pending.length - 1] : null;
          if (newestPending?.createdAt && newestPending.source !== 'counter-pickup' && (!newestPending.source || newestPending.source === 'direct')) {
            const left = 120000 - (Date.now() - new Date(newestPending.createdAt).getTime());
            if (left > 2000) {
              setModifiable(prev => prev || {
                orderId: String(newestPending._id), deadline: Date.now() + left,
                items: (newestPending.items || []).filter(i => !i.isExtraItem).map(i => ({ ...i, menuItemId: i.menuItemId ? String(i.menuItemId) : null }))
              });
            }
          }
        }
        setHasPlacedInitialOrder(true);
      }
    })
    .catch(() => {
      // Server unreachable: fall back to the bill saved on this device so the guest can still see / request it.
      try {
        const saved = JSON.parse(localStorage.getItem(`pratyeksha_placed_${tenantId}_${tableNumber}`) || '[]');
        if (Array.isArray(saved) && saved.length > 0) {
          const clean = saved
            .filter(i => i && typeof i === 'object' && Number.isFinite(Number(i.subtotal)) && Number(i.quantity) > 0)
            .map(i => ({ ...i, quantity: Number(i.quantity), subtotal: Number(i.subtotal), pricePerUnit: Number(i.pricePerUnit) || 0 }));
          if (clean.length) { setPlacedOrders(prev => (prev.length ? prev : clean)); setHasPlacedInitialOrder(true); }
        }
      } catch { /* ignore */ }
    });
}, [tenantId, tableNumber, isCounterScan]);

// "Goes well with your order" — the same smart pairing strip for QR table ordering, waitlist, pickup and reservations.
useEffect(() => {
  if (!allMenuItems.length) return;
  const cartIds = Object.keys(cart).map(k => k.split('-')[0]);
  if (cartIds.length === 0) { setComboSuggestions([]); setShowComboStrip(false); return; }

  const kindOf = (m) => {
    const c = `${m.categoryId || ''} ${m.category || ''} ${m.name || ''}`.toLowerCase();
    if (/drink|juice|beverage|coffee|tea|shake|lassi|soda|cola|mojito|water|latte|cappuccino|chai/.test(c)) return 'drink';
    if (/dessert|sweet|ice|cake|brownie|pastry|gulab|kulfi|cookie|waffle/.test(c)) return 'dessert';
    if (/snack|starter|fries|sandwich|burger|pizza|roll|momo|pakora|bites|wrap/.test(c)) return 'snack';
    return 'main';
  };
  const inCartSet = new Set(cartIds.map(String));
  const cartItems = cartIds.map(id => allMenuItems.find(m => String(m._id) === String(id))).filter(Boolean);
  if (cartItems.length === 0) { setComboSuggestions([]); setShowComboStrip(false); return; }
  const have = new Set(cartItems.map(kindOf));
  const wantedOrder = ['drink', 'dessert', 'snack'].filter(k => !have.has(k));
  const rank = (m) => {
    const w = wantedOrder.indexOf(kindOf(m));
    return (w === -1 ? 10 : w) - (m.isBestSeller ? 1.5 : 0) - (m.isChefSpecial ? 1 : 0);
  };
  const pool = allMenuItems.filter(m => m.isAvailable !== false && !inCartSet.has(String(m._id)) && Number(m.price || m.priceHalf || m.priceFull) > 0);
  let picks = pool.filter(m => kindOf(m) !== 'main').sort((x, y) => rank(x) - rank(y)).slice(0, 6);
  if (picks.length === 0) picks = pool.filter(m => m.isBestSeller || m.isChefSpecial).slice(0, 6);
  setComboSuggestions(picks);
  setShowComboStrip(picks.length > 0);
}, [cart, allMenuItems]);

// ── Tenant-specific guest services. Defaults stay enabled to preserve every
// existing restaurant workflow unless the tenant explicitly disables a service.
const customerFeatures = restaurantData?.config?.customerFeatures || {};
const featureEnabled = key => customerFeatures[key] !== false;

const legalPhone = (savedCustomer?.phone || String(customerInfo.phone || '').replace(/\D/g, '')).slice(0, 10);
const legalSheetEl = (
  <GuestLegalSheet
    open={legalSheet.open}
    tab={legalSheet.tab}
    onTab={tab => setLegalSheet(prev => ({ ...prev, tab }))}
    onClose={() => setLegalSheet(prev => ({ ...prev, open: false }))}
    language={language}
    tenantId={tenantId}
    tenantName={restaurantData?.name || 'the restaurant'}
    phone={legalPhone.length === 10 ? legalPhone : ''}
    name={customerInfo.name || savedCustomer?.name || ''}
    onErased={onGuestErased}
  />
);

// ── Fullscreen table/order-ready banner — safe to return here: every hook is declared above ──
if (notificationBannerView) return notificationBannerView;

// An unknown / removed outlet (menu API 404) used to be blocked only on the table-QR path; the counter / directory flow
// returned before that check and let a guest register, order and reserve at an outlet that does not exist.
if (sessionBlocked && isCounterScan) {
  return (
    <CustomerShell>
      <div style={{ marginTop: '18vh', maxWidth: '340px' }}>
        <AlertCircle size={34} color="#d3bfa2" />
        <h2 style={{ margin: '16px 0 8px', fontFamily: 'Georgia, serif', fontWeight: 500, color: '#f7f3eb', fontSize: '1.35rem' }}>
          {language === 'mr' ? 'हे रेस्टॉरंट सापडले नाही' : "We couldn't find this restaurant"}
        </h2>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          {language === 'mr' ? 'कृपया लिंक तपासा किंवा रेस्टॉरंटच्या QR कोडमधून पुन्हा उघडा.' : 'Please check the link, or open it again from the restaurant\'s QR code.'}
        </p>
      </div>
    </CustomerShell>
  );
}

// ── COUNTER / DIRECTORY FLOW — early return (all hooks already declared above) ──
if (isCounterScan && registrationStep !== 'menu') {


// ══════════════════════════════════════════
// SCREEN: CONFIRM
// ══════════════════════════════════════════
if (registrationStep === 'confirm' && waitlistEntry) {

  // ── RESERVATION CONFIRM — completely separate screen ──
  if (waitlistEntry.mode === 'reservation') {
    const resTime  = waitlistEntry.reservationTime ? new Date(waitlistEntry.reservationTime) : null;
    const hasItems = waitlistEntry.items?.length > 0;
    const isConf   = waitlistEntry.status === 'confirmed';
    const tokenId  = waitlistEntry._id?.slice(-6)?.toUpperCase() || 'XXXXXX';


    return (
      <CustomerShell centered={false} scrollRef={scrollRef}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: PX.glassBar, backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(211,191,162,0.62)' }}>
            {restaurantData?.name}
          </span>
          <span style={{
            fontSize: '0.52rem', fontWeight: '900', letterSpacing: '1.5px',
            padding: '5px 12px', borderRadius: '24px',
            background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)',
            color: 'rgba(211,191,162,0.62)',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
          }}>
            <CalendarClock size={11} color="rgba(211,191,162,0.4)" />
            {language === 'mr' ? 'बुकिंग' : 'RESERVATION'}
          </span>
        </div>

        <div style={{ padding: '32px 22px 80px', maxWidth: '420px', margin: '0 auto', width: '100%' }}>

          {/* ── HERO ── */}
          <SuccessHero icon={CalendarClock}
            title={language === 'mr' ? 'बुकिंग झाली!' : 'Table Reserved!'}
            subtitle={language === 'mr'
              ? 'तुमची विनंती मिळाली. रेस्टॉरंट लवकरच कन्फर्म करेल.'
              : `We've received your reservation at ${restaurantData?.name}. The restaurant will confirm shortly.`} />

          {/* ── TOKEN CARD ── */}
          <div style={{
            background: '#111', border: '1px solid rgba(211,191,162,0.18)',
            borderRadius: '26px', overflow: 'hidden', marginBottom: '14px', position: 'relative'
          }}>
            {/* Gold shimmer */}
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(211,191,162,0.5),transparent)' }} />
            <div style={{ padding: '26px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.48rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.62)', textTransform: 'uppercase', marginBottom: '12px' }}>
                {language === 'mr' ? 'बुकिंग टोकन' : 'Booking Token'}
              </div>
              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', letterSpacing: '8px', lineHeight: 1, marginBottom: '14px' }}>
                #{tokenId}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 16px', borderRadius: '99px',
                background: isConf ? 'rgba(211,191,162,0.12)' : 'rgba(138,112,77,0.08)',
                border: `1px solid ${isConf ? 'rgba(211,191,162,0.3)' : 'rgba(138,112,77,0.2)'}`,
                marginBottom: '22px'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConf ? '#d3bfa2' : '#8a704d' }} />
                <span style={{ fontSize: '0.58rem', fontWeight: '900', color: isConf ? '#d3bfa2' : '#8a704d', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  {isConf ? (language === 'mr' ? 'कन्फर्म झाले' : 'CONFIRMED') : (language === 'mr' ? 'पेंडिंग' : 'PENDING CONFIRMATION')}
                </span>
              </div>

              {/* Date / Time / Guests row */}
              {resTime && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0', borderTop: '1px solid rgba(211,191,162,0.08)', paddingTop: '18px' }}>
                  {[
                    { icon: <CalendarClock size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />, label: language === 'mr' ? 'तारीख' : 'DATE', val: resTime.toLocaleDateString('en-IN',{ timeZone: 'Asia/Kolkata',weekday:'short',day:'numeric',month:'short'}) },
                    { icon: <Clock3 size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />, label: language === 'mr' ? 'वेळ' : 'TIME', val: resTime.toLocaleTimeString([],{ timeZone: 'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true}) },
                    { icon: <Users size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />, label: language === 'mr' ? 'जण' : 'GUESTS', val: `${waitlistEntry.partySize}` },
                  ].map((r, i, arr) => (
                    <div key={i} style={{
                      flex: 1, textAlign: 'center', padding: '0 6px',
                      borderRight: i < arr.length - 1 ? '1px solid rgba(211,191,162,0.08)' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '5px' }}>
                        {r.icon}
                        <span style={{ fontSize: '0.46rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{r.label}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── GUEST DETAILS ── */}
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.08)', borderRadius: '20px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(211,191,162,0.03)', borderBottom: '1px solid rgba(211,191,162,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.5rem', fontWeight: '900', color: 'rgba(211,191,162,0.62)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {language === 'mr' ? 'तपशील' : 'Reservation Details'}
              </span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: language === 'mr' ? 'नाव' : 'NAME', val: waitlistEntry.customerName, gold: true },
                waitlistEntry.customerPhone && { label: language === 'mr' ? 'मोबाईल' : 'MOBILE', val: `+91 ${waitlistEntry.customerPhone}`, mono: true },
                resTime && { label: language === 'mr' ? 'तारीख' : 'DATE', val: resTime.toLocaleDateString('en-IN',{ timeZone: 'Asia/Kolkata',weekday:'long',day:'numeric',month:'long'}) },
                resTime && { label: language === 'mr' ? 'वेळ' : 'TIME', val: resTime.toLocaleTimeString([],{ timeZone: 'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true}), mono: true },
                { label: language === 'mr' ? 'जण' : 'GUESTS', val: `${waitlistEntry.partySize} ${waitlistEntry.partySize === 1 ? (language === 'mr' ? 'व्यक्ती' : 'person') : (language === 'mr' ? 'जण' : 'people')}` },
                waitlistEntry.specialRequests && { label: language === 'mr' ? 'विशेष' : 'SPECIAL', val: `"${waitlistEntry.specialRequests}"`, italic: true },
              ].filter(Boolean).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700', letterSpacing: '0.5px', flexShrink: 0, textTransform: 'uppercase' }}>{r.label}</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: r.gold ? '800' : '600', color: r.gold ? '#d3bfa2' : 'rgba(255,255,255,0.4)', fontFamily: r.mono ? 'monospace' : 'inherit', fontStyle: r.italic ? 'italic' : 'normal', textAlign: 'right', lineHeight: 1.4 }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── PRE-ORDER SUMMARY — only when items exist ── */}
          {hasItems && (
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.08)', borderRadius: '20px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(211,191,162,0.03)', borderBottom: '1px solid rgba(211,191,162,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UtensilsCrossed size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.5rem', fontWeight: '900', color: 'rgba(211,191,162,0.62)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {language === 'mr' ? 'प्री-ऑर्डर' : 'Pre-Order'}
                </span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {waitlistEntry.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < waitlistEntry.items.length - 1 ? '10px' : '0', marginBottom: i < waitlistEntry.items.length - 1 ? '10px' : '0', borderBottom: i < waitlistEntry.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: '900', fontFamily: 'monospace', color: 'rgba(211,191,162,0.62)', minWidth: '20px' }}>×{item.quantity}</span>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{item.name}</span>
                      {item.portion && item.portion !== 'Single' && (
                        <span style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.62)', fontWeight: '700' }}>{item.portion}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#d3bfa2', fontWeight: '800', fontFamily: 'monospace' }}>₹{item.subtotal}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '10px', borderTop: '1px solid rgba(211,191,162,0.08)' }}>
                  <span style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    {language === 'mr' ? 'एकूण' : 'Total'}
                  </span>
                  <span style={{ fontSize: '1rem', color: '#d3bfa2', fontWeight: '900', fontFamily: 'monospace' }}>₹{waitlistEntry.totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATION PILL ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 15px', marginBottom: '20px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '16px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SpoonForkIcon size={13} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />
            </div>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.65, fontWeight: '500' }}>
              {language === 'mr' ? 'बुकिंग कन्फर्म झाल्यावर सूचना मिळेल.' : "You'll be notified when the restaurant confirms your booking."}
            </p>
          </div>

          {/* ── DOWNLOAD PDF — always shown ── */}
          <button type="button" onClick={downloadReservationPDF} style={{
            width: '100%', padding: '17px',
            background: PX.gold,
            border: 'none', borderRadius: '18px',
            color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
            cursor: 'pointer', marginBottom: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            letterSpacing: '0.5px', textTransform: 'uppercase',
            boxShadow: '0 8px 28px rgba(211,191,162,0.18)'
          }}>
            <ReceiptText size={16} strokeWidth={2} />
            {language === 'mr' ? 'बुकिंग टोकन डाउनलोड करा' : 'Download Booking Token'}
          </button>

{/* ── PRE-ORDER CTA — only when NO items AND user didn't explicitly skip ── */}
{!hasItems && !waitlistEntry._noPreorder && (
  <button type="button" onClick={() => setRegistrationStep('menu')} style={{
    width: '100%', padding: '15px',
    background: 'rgba(211,191,162,0.07)',
    border: '1px solid rgba(211,191,162,0.18)',
    color: '#d3bfa2', borderRadius: '16px',
    fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer',
    marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px'
  }}>
    <UtensilsCrossed size={15} strokeWidth={2.5} />
    {language === 'mr' ? 'आधीच ऑर्डर द्या' : 'Add Pre-Order'}
    <ChevronRight size={15} />
  </button>
)}

          {/* ── CANCEL ── */}
          <button type="button" onClick={() => {
            if (waitlistEntry?._id) axios.delete(`${BASE_URL}/reservations/${waitlistEntry._id}`, { data: { tenantId: waitlistEntry.tenantId } }).catch(() => {});
            try { sessionStorage.removeItem('pratyeksha_session'); } catch {}
            const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            try { sessionStorage.setItem('pratyeksha_session', newId); } catch {}
            setWaitlistEntry(null); setRegistrationStep('mode'); setCounterMode(null);
            customerInfoDraftRef.current = { name: '', phone: '' }; setCustomerInfo({ name: '', phone: '' }); setPartySize(1);
            setReservationDate(''); setReservationTime(''); setSpecialRequests(''); setTablePreference('');
            setCart({}); setSuggestions({});setRecommendedDishes([]);
          }} style={{
            width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.52)', fontSize: '0.68rem', cursor: 'pointer',
            padding: '12px', borderRadius: '11px', fontWeight: '700', letterSpacing: '0.5px', transition: 'all 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.12)'; e.currentTarget.style.color = 'rgba(211,191,162,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; }}
          >
            {language === 'mr' ? 'बुकिंग रद्द करा' : 'Cancel Reservation'}
          </button>
        </div>
      </CustomerShell>
    );
  }

 // ── DINE-IN / PICKUP CONFIRM ──
  const isDineIn = waitlistEntry.mode === 'dine-in';
  const hasItems = waitlistEntry.items?.length > 0;
  const estWait  = (Number(waitlistEntry.waitlistPosition) || 1) * 20;


  return (
    <CustomerShell centered={false} scrollRef={scrollRef}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: PX.glassBar, backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(211,191,162,0.07)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(211,191,162,0.62)' }}>
          {restaurantData?.name}
        </span>
        <span style={{
          fontSize: '0.52rem', fontWeight: '900', letterSpacing: '1.5px',
          padding: '5px 12px', borderRadius: '24px',
          background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)',
          color: 'rgba(211,191,162,0.62)',
          display: 'inline-flex', alignItems: 'center', gap: '6px'
        }}>
          {isDineIn
            ? <><Armchair size={11} color="rgba(211,191,162,0.4)" strokeWidth={1.5} /> {language === 'mr' ? 'वेटलिस्ट' : 'WAITLIST'}</>
            : <><ShoppingBag size={11} color="rgba(211,191,162,0.4)" strokeWidth={1.5} /> {language === 'mr' ? 'पिकअप' : 'PICKUP'}</>
          }
        </span>
      </div>

      <div style={{ padding: '36px 24px 60px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>

        <SuccessHero icon={CheckCircle2}
          title={language === 'mr' ? "तुम्ही रांगेत आहात!" : "You're All Set!"}
          subtitle={language === 'mr' ? 'तुमची माहिती यशस्वीरित्या नोंदवली गेली आहे.' : "Your details are confirmed. Relax — we'll handle the rest."} />

        {/* STATUS CARD */}
        <div style={{
          background: PX.card, border: '1px solid rgba(211,191,162,0.09)',
          borderRadius: '26px', padding: '28px 24px', marginBottom: '14px',
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(211,191,162,0.25),transparent)' }} />

          {isDineIn ? (
            <>
              <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.62)', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px' }}>
                {language === 'mr' ? 'रांगेतील स्थान' : 'Queue Position'}
              </p>
              <div style={{ fontSize: '5rem', fontWeight: '900', color: '#d3bfa2', lineHeight: 1, fontFamily: 'monospace', marginBottom: '16px', letterSpacing: '-4px' }}>
                #{waitlistEntry.waitlistPosition}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '30px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)' }}>
                <Hourglass size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700' }}>
                  {language === 'mr' ? `अंदाजे ~${estWait} मिनिटे` : `~${estWait} min estimated wait`}
                </span>
              </div>
            </>
          ) : waitlistEntry.scheduledPickupTime ? (
            <>
              <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.62)', textTransform: 'uppercase', margin: '0 0 14px' }}>
                {language === 'mr' ? 'पिकअप वेळ' : 'Pickup Time'}
              </p>
              <div style={{ fontSize: '3.6rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', letterSpacing: '-2px', marginBottom: '8px', lineHeight: 1 }}>
                {new Date(waitlistEntry.scheduledPickupTime).toLocaleTimeString([],{ timeZone: 'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true})}
              </div>
              <p style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.52)', fontWeight: '600', margin: 0 }}>
                {language === 'mr' ? 'ठरलेली वेळ' : 'Your scheduled slot'}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.62)', textTransform: 'uppercase', margin: '0 0 14px' }}>
                {language === 'mr' ? 'पिकअप ऑर्डर' : 'Pickup Order'}
              </p>
              <ShoppingBag size={36} color="rgba(211,191,162,0.4)" strokeWidth={1} style={{ marginBottom: '10px' }} />
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.52)', fontWeight: '600', margin: 0 }}>
                {language === 'mr' ? 'ऑर्डर नोंदवली गेली' : 'Order received'}
              </p>
            </>
          )}
        </div>

        {/* CONFIRMATION DETAILS — single card, no duplicate */}
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.1)', borderRadius: '22px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ padding: '12px 18px', background: 'rgba(211,191,162,0.04)', borderBottom: '1px solid rgba(211,191,162,0.07)', display: 'flex', alignItems: 'center', gap: '9px' }}>
            <CheckCircle2 size={13} color="rgba(211,191,162,0.5)" strokeWidth={2} />
            <span style={{ fontSize: '0.52rem', fontWeight: '900', color: 'rgba(211,191,162,0.62)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {language === 'mr' ? 'पुष्टी तपशील' : 'Confirmation Details'}
            </span>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: language === 'mr' ? 'नाव' : 'NAME',   val: waitlistEntry.customerName, gold: true },
              waitlistEntry.customerPhone && { label: language === 'mr' ? 'मोबाईल' : 'MOBILE', val: `+91 ${waitlistEntry.customerPhone}`, mono: true },
              { label: language === 'mr' ? 'प्रकार' : 'TYPE', val: isDineIn ? 'DINE-IN WAITLIST' : 'PICKUP', badge: true },
              isDineIn && { label: language === 'mr' ? 'जण' : 'GUESTS', val: `${waitlistEntry.partySize}` },
              !isDineIn && waitlistEntry.scheduledPickupTime && { label: language === 'mr' ? 'पिकअप वेळ' : 'PICKUP TIME', val: new Date(waitlistEntry.scheduledPickupTime).toLocaleTimeString([],{ timeZone: 'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true}), mono: true, gold: true },
              waitlistEntry.specialRequests && { label: language === 'mr' ? 'विशेष' : 'SPECIAL', val: `"${waitlistEntry.specialRequests}"`, italic: true },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700', letterSpacing: '0.5px' }}>{row.label}</span>
                {row.badge
                  ? <span style={{ fontSize: '0.6rem', fontWeight: '900', padding: '3px 10px', borderRadius: '24px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.18)', color: '#8a704d' }}>{row.val}</span>
                  : <span style={{ fontSize: '0.78rem', fontWeight: row.gold ? '800' : '600', color: row.gold ? '#d3bfa2' : 'rgba(255,255,255,0.4)', fontFamily: row.mono ? 'monospace' : 'inherit', fontStyle: row.italic ? 'italic' : 'normal' }}>{row.val}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* PRE-ORDER SUMMARY — only when items exist */}
        {hasItems && (
          <div style={{ background: '#0c0c0c', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '20px', padding: '18px', marginBottom: '12px' }}>
            <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '2.5px', color: 'rgba(211,191,162,0.62)', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px' }}>
              {language === 'mr' ? 'प्री-ऑर्डर' : 'Pre-Order'}
            </p>
            {waitlistEntry.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < waitlistEntry.items.length - 1 ? '10px' : '0', marginBottom: i < waitlistEntry.items.length - 1 ? '10px' : '0', borderBottom: i < waitlistEntry.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: '900', fontFamily: 'monospace', color: 'rgba(211,191,162,0.62)', minWidth: '18px' }}>×{item.quantity}</span>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{item.name}{item.portion && item.portion !== 'Single' ? ` (${item.portion})` : ''}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#d3bfa2', fontWeight: '800', fontFamily: 'monospace' }}>₹{item.subtotal}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '8px', borderTop: '1px solid rgba(211,191,162,0.07)' }}>
              <span style={{ fontSize: '0.58rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Total</span>
              <span style={{ fontSize: '1rem', color: '#d3bfa2', fontWeight: '900', fontFamily: 'monospace' }}>₹{waitlistEntry.totalAmount}</span>
            </div>
          </div>
        )}

        {/* NOTIFICATION PILL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', marginBottom: '16px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '18px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SpoonForkIcon size={14} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontSize: '0.71rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.65, fontWeight: '500' }}>
            {language === 'mr' ? 'टेबल / ऑर्डर तयार झाल्यावर सूचना मिळेल — पेज बंद केले तरीही.' : "You'll be notified when ready — even if you close this page."}
          </p>
        </div>

<button type="button" onClick={isDineIn ? downloadWaitlistToken : downloadPickupToken} style={{
  width: '100%', padding: '17px',
  background: PX.gold,
  border: 'none', borderRadius: '18px',
  color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
  cursor: 'pointer', marginBottom: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
  letterSpacing: '0.5px', textTransform: 'uppercase',
  boxShadow: '0 8px 28px rgba(211,191,162,0.18)'
}}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0c0c0c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
  {isDineIn
    ? (language === 'mr' ? 'टोकन डाउनलोड करा' : 'Download Waitlist Token')
    : (language === 'mr' ? 'पिकअप टोकन डाउनलोड करा' : 'Download Pickup Token')}
</button>

        {/* Cancel / Leave Queue */}
        <button type="button" onClick={() => {
          axios.delete(`${BASE_URL}/waitlist/session/${tenantId}/${sessionId}`).catch(() => {});
          try { sessionStorage.removeItem('pratyeksha_session'); } catch {}
          const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          try { sessionStorage.setItem('pratyeksha_session', newId); } catch {}
          setWaitlistEntry(null); setRegistrationStep('mode'); setCounterMode(null);
          customerInfoDraftRef.current = { name: '', phone: '' }; setCustomerInfo({ name: '', phone: '' }); setPartySize(1);
          setScheduledPickupTime(''); setReservationDate(''); setReservationTime('');
          setSpecialRequests(''); setTablePreference('');
          setCart({}); setSuggestions({});setRecommendedDishes([]);
        }} style={{
          width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.52)', fontSize: '0.7rem', cursor: 'pointer',
          padding: '13px', borderRadius: '16px', fontWeight: '700', letterSpacing: '0.5px', transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; e.currentTarget.style.color = 'rgba(211,191,162,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; }}
        >
          {language === 'mr' ? 'रद्द करा' : 'Leave Queue'}
        </button>

      </div>

      {/* Reservation pre-order prompt — kept for when user taps ADD PRE-ORDER from reservation confirm */}
      <AnimatePresence>
        {reservationAskOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 40px' }}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              style={{ width: '100%', maxWidth: '400px', background: '#111', border: '1px solid rgba(211,191,162,0.18)', borderRadius: '24px 24px 20px 20px', padding: '32px 24px 28px', margin: '0 16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '18px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <UtensilsCrossed size={22} color="rgba(211,191,162,0.6)" strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                {language === 'mr' ? 'आधीच ऑर्डर देणार का?' : 'Pre-order your meal?'}
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.7, marginBottom: '26px', fontWeight: '500' }}>
                {language === 'mr' ? 'तुम्ही येण्यापूर्वीच ऑर्डर तयार असेल — प्रतीक्षा नाही!' : 'Your food will be ready when you arrive — no waiting!'}
              </p>

              <button type="button" onClick={() => setReservationAskOrder(false)} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', color: 'rgba(255,255,255,0.52)', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; e.currentTarget.style.color = 'rgba(211,191,162,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; }}>
                {language === 'mr' ? 'नाही, नंतर ठरवतो' : "No, I'll decide later"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CustomerShell>
  );
}

  // ══════════════════════════════════════════
  // SCREEN: REGISTER
  // ══════════════════════════════════════════
  if (registrationStep === 'register') {
    const isDineIn = counterMode === 'dine-in';
    const pickupOptions = [];
    // The first slot used to be "now" rounded up, i.e. possibly a minute away or already past by the time the guest tapped
    // Continue — the server then rejected it as "scheduledPickupTime is in the past". Start at least 10 minutes out.
    const base = new Date(Date.now() + 10 * 60000);
    base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15, 0, 0);
    for (let i = 0; i < 12; i++) {
      const slot = new Date(base.getTime() + i * 15 * 60000);
      pickupOptions.push({
        value: slot.toISOString(),
        label: slot.toLocaleTimeString([], { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
      });
    }


    return (
      <CustomerShell centered={false} scrollRef={scrollRef}>
        {/* Sticky top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: PX.glassBar,
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '14px'
        }}>
          <button type="button" onClick={() => setRegistrationStep('mode')} style={{
            width: '36px', height: '36px', borderRadius: '13px',
            background: 'rgba(211,191,162,0.05)',
            border: '1px solid rgba(211,191,162,0.1)',
            color: 'rgba(211,191,162,0.62)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.1)'; }}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <div>
            <div style={{
              fontSize: '0.7rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '0.3px'
            }}>
{counterMode === 'dine-in'
                ? (language === 'mr' ? 'रांगेत नोंदणी' : 'Join Waitlist')
                : counterMode === 'reservation'
                ? (language === 'mr' ? 'टेबल बुकिंग' : 'Reserve a Table')
                : (language === 'mr' ? 'पिकअप ऑर्डर' : 'Schedule Pickup')}
            </div>
            <div style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.62)', marginTop: '2px' }}>
              {restaurantData?.name}
            </div>
          </div>
        </div>

<div style={{ padding: '28px 22px 40px', maxWidth: '440px', margin: '0 auto', width: '100%' }}>
  
          {/* Mode indicator badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '16px 18px', marginBottom: '28px',
            background: PX.card,
            border: '1px solid rgba(211,191,162,0.09)',
            borderRadius: '20px'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '16px', flexShrink: 0,
              background: 'rgba(211,191,162,0.07)',
              border: '1px solid rgba(211,191,162,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
{counterMode === 'dine-in'
                ? <Armchair size={19} color="#d3bfa2" strokeWidth={1.5} />
                : counterMode === 'reservation'
                ? <CalendarClock size={19} color="#d3bfa2" strokeWidth={1.5} />
                : <ShoppingBag size={19} color="#d3bfa2" strokeWidth={1.5} />}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#d3bfa2', marginBottom: '3px' }}>
{counterMode === 'dine-in'
                  ? (language === 'mr' ? 'डाइन-इन वेटलिस्ट' : 'Dine-In Waitlist')
                  : counterMode === 'reservation'
                  ? (language === 'mr' ? 'टेबल बुकिंग' : 'Reserve a Table')
                  : (language === 'mr' ? 'पिकअप ऑर्डर' : 'Pickup Order')}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.52)', fontWeight: '500' }}>
                {isDineIn
                  ? (avgWaitData?.queueLength
                    ? `${avgWaitData.queueLength} ahead · ~${avgWaitData.estimatedWait || 20} min`
                    : 'Live queue tracking')
                  : 'Choose your pickup slot'}
              </div>
            </div>
          </div>

          {/* Name + mobile (hidden for a remembered guest) */}
          <GuestIdentityBlock
            language={language}
            info={customerInfo}
            locked={!!savedCustomer && !identityEditing}
            onForget={forgetGuestIdentity}
            onName={name => { customerInfoDraftRef.current = { ...customerInfoDraftRef.current, name }; setIdentityEditing(true); setCustomerInfo(prev => ({ ...prev, name })); }}
            onPhone={digits => { customerInfoDraftRef.current = { ...customerInfoDraftRef.current, phone: digits }; setIdentityEditing(true); setCustomerInfo(prev => ({ ...prev, phone: digits })); }}
          />

          {/* Party size — dine-in only */}
          {isDineIn && (
            <div style={{ marginBottom: '22px' }}>
              <label style={{
                fontSize: '0.54rem', color: 'rgba(211,191,162,0.62)',
                fontWeight: '900', letterSpacing: '2px',
                display: 'block', marginBottom: '10px', textTransform: 'uppercase'
              }}>
                {language === 'mr' ? 'किती जण?' : 'Party Size'}
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button key={n} type="button" onClick={() => preserveScroll(() => setPartySize(n))} style={{
                    width: '54px', height: '54px', borderRadius: '16px',
                    border: 'none', cursor: 'pointer',
                    fontWeight: '900', fontSize: '1rem',
                    transition: 'all 0.15s',
                    background: partySize === n
                      ? 'linear-gradient(135deg, #d3bfa2, #bda88a)'
                      : '#121212',
                    color: partySize === n ? '#0c0c0c' : 'rgba(255,255,255,0.25)',
                    outline: partySize === n
                      ? 'none'
                      : '1px solid rgba(211,191,162,0.08)',
                    transform: partySize === n ? 'scale(1.05)' : 'scale(1)'
                  }}>
                    {n}{n === 6 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

{/* Pickup time — pickup ONLY, NOT reservation */}
{counterMode === 'pickup' && (
  <div style={{ marginBottom: '22px' }}>
    <label style={{
      fontSize: '0.54rem', color: 'rgba(211,191,162,0.62)',
      fontWeight: '900', letterSpacing: '2px',
      display: 'block', marginBottom: '10px', textTransform: 'uppercase'
    }}>
      {language === 'mr' ? 'पिकअप वेळ' : 'Pickup Time'}
    </label>
    <div style={{ position: 'relative' }}>
      <Clock3 size={14} color="rgba(211,191,162,0.3)" strokeWidth={1.5} style={{
        position: 'absolute', left: '15px', top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none'
      }} />
      <select
        value={scheduledPickupTime}
        onChange={e => setScheduledPickupTime(e.target.value)}
        style={{
          width: '100%', padding: '15px 16px 15px 42px',
          background: PX.card,
          border: '1px solid rgba(211,191,162,0.18)',
          color: scheduledPickupTime ? '#fff' : 'rgba(255,255,255,0.25)',
          borderRadius: '16px', fontSize: '0.9rem',
          outline: 'none', cursor: 'pointer',
          appearance: 'none', boxSizing: 'border-box',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        <option value="">
          {language === 'mr' ? '— वेळ निवडा —' : '— Select a time slot —'}
        </option>
        {pickupOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronRight size={13} color="rgba(211,191,162,0.25)" style={{
        position: 'absolute', right: '14px', top: '50%',
        transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none'
      }} />
    </div>
  </div>
)}

          {/* ── RESERVATION DATE + TIME ── */}
{counterMode === 'reservation' && (
  <>
    {/* Date picker */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.62)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '10px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'तारीख *' : 'Reservation Date *'}
      </label>
      <input
        type="date"
        value={reservationDate}
        min={new Date(Date.now() + 330 * 60000).toISOString().split('T')[0]}
        onChange={e => setReservationDate(e.target.value)}
        style={{
          width: '100%', padding: '15px 16px',
          background: PX.card, border: '1px solid rgba(211,191,162,0.18)',
          color: '#fff', borderRadius: '16px', fontSize: '0.9rem',
          outline: 'none', boxSizing: 'border-box', colorScheme: 'dark',
          fontFamily: 'Poppins, sans-serif', cursor: 'pointer'
        }}
      />
    </div>

    {/* ── MEAL PERIOD + TIME SLOTS ── */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.62)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '12px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'वेळ *' : 'Time Slot *'}
      </label>

      {/* Lunch / Dinner toggle */}
      <div style={{
        display: 'flex', background: PX.card,
        border: '1px solid rgba(211,191,162,0.1)',
        borderRadius: '16px', padding: '4px', gap: '4px',
        marginBottom: '14px'
      }}>
        {[
          { id: 'lunch',  icon: Sun,  label: language === 'mr' ? 'दुपारचे जेवण' : 'Lunch',  sub: '1 PM – 4 PM' },
          { id: 'dinner', icon: Moon, label: language === 'mr' ? 'रात्रीचे जेवण' : 'Dinner', sub: '7 PM – 11 PM' },
        ].map(period => {
          const isActive = (() => {
            if (!reservationTime) return false;
            const h = parseInt(reservationTime.split(':')[0]);
            return period.id === 'lunch' ? (h >= 13 && h <= 16) : (h >= 19 && h <= 23);
          })();
          return (
            <button key={period.id} type="button"
              onClick={() => {
                // Select first slot of the period by default
                setReservationTime(period.id === 'lunch' ? '13:00' : '19:00');
              }}
              style={{
                flex: 1, padding: '11px 8px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                background: isActive ? 'rgba(211,191,162,0.1)' : 'transparent',
                outline: isActive ? '1px solid rgba(211,191,162,0.25)' : '1px solid transparent',
                transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '900', color: isActive ? '#d3bfa2' : 'rgba(255,255,255,0.25)' }}>
                <period.icon size={14} strokeWidth={2} />
                {period.label}
              </span>
              <span style={{ fontSize: '0.52rem', color: isActive ? 'rgba(211,191,162,0.4)' : 'rgba(255,255,255,0.12)', fontWeight: '700' }}>
                {period.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time slots — shown based on period */}
      {(() => {
        const lunchSlots  = ['13:00','13:30','14:00','14:30','15:00','15:30','16:00'];
        const dinnerSlots = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30','23:00'];
        const h = reservationTime ? parseInt(reservationTime.split(':')[0]) : null;
        const isLunch  = h !== null && h >= 13 && h <= 16;
        const isDinner = h !== null && h >= 19;
        let slots = isLunch ? lunchSlots : isDinner ? dinnerSlots : [];

        // A reservation for today can't be for a time that's already passed (or is
        // about to, with no lead time for the kitchen/floor to prepare) — filter
        // those out rather than silently accepting a booking that's already gone.
        const todayStr = new Date(Date.now() + 330 * 60000).toISOString().split('T')[0];
        if (reservationDate === todayStr) {
          const earliestBookable = new Date(Date.now() + 45 * 60000); // 45-min lead time
          slots = slots.filter(slot => {
            const [hr, mn] = slot.split(':').map(Number);
            // Restaurant time is IST: building the slot with local setHours() was wrong on any device outside IST.
            const slotDate = new Date(`${todayStr}T${String(hr).padStart(2,'0')}:${String(mn).padStart(2,'0')}:00+05:30`);
            return slotDate >= earliestBookable;
          });
        }

        const fmt = (slot) => {
          const [hr, mn] = slot.split(':').map(Number);
          const period = hr < 12 ? 'AM' : 'PM';
          const hr12 = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
          return `${hr12}:${mn.toString().padStart(2,'0')} ${period}`;
        };

        if (slots.length === 0) return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '18px', color: 'rgba(255,255,255,0.52)', fontSize: '0.72rem', fontWeight: '600', textAlign: 'center' }}>
            {reservationDate === todayStr && h !== null ? (
              <>
                <Clock3 size={14} />
                {language === 'mr' ? 'आजसाठी ही वेळ संपली आहे — दुसरी निवडा' : "That's passed for today — pick another slot"}
              </>
            ) : (
              <>
                <ArrowUp size={14} />
                {language === 'mr' ? 'वेळ निवडा' : 'Select a meal period above'}
              </>
            )}
          </div>
        );

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px' }}>
            {slots.map(slot => {
              const isSelected = reservationTime === slot;
              return (
                <button key={slot} type="button" onClick={() => preserveScroll(() => setReservationTime(slot))} style={{
                  padding: '11px 4px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                  fontWeight: '900', fontSize: '0.68rem',
                  background: isSelected ? 'linear-gradient(135deg,#d3bfa2,#bda88a)' : '#121212',
                  color: isSelected ? '#0c0c0c' : 'rgba(255,255,255,0.2)',
                  outline: isSelected ? 'none' : '1px solid rgba(211,191,162,0.07)',
                  transition: 'all 0.15s',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)'
                }}>
                  {fmt(slot)}
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>

    {/* Party size for reservation */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.62)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '10px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'किती जण?' : 'Party Size'}
      </label>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button key={n} type="button" onClick={() => preserveScroll(() => setPartySize(n))} style={{
            width: '54px', height: '54px', borderRadius: '16px',
            border: 'none', cursor: 'pointer',
            fontWeight: '900', fontSize: '1rem', transition: 'all 0.15s',
            background: partySize === n ? 'linear-gradient(135deg,#d3bfa2,#bda88a)' : '#121212',
            color: partySize === n ? '#0c0c0c' : 'rgba(255,255,255,0.25)',
            outline: partySize === n ? 'none' : '1px solid rgba(211,191,162,0.08)',
            transform: partySize === n ? 'scale(1.05)' : 'scale(1)'
          }}>
            {n}{n === 6 ? '+' : ''}
          </button>
        ))}
      </div>
    </div>

    {/* Special requests — NO table preference */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.62)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '10px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'विशेष विनंती (ऐच्छिक)' : 'Special Requests (optional)'}
      </label>
      <input
        type="text"
        placeholder={language === 'mr' ? 'उदा. वाढदिवस, ऍलर्जी, उच्च खुर्ची...' : 'e.g. birthday celebration, nut allergy, high chair...'}
        defaultValue={specialRequests}
        onBlur={e => { setSpecialRequests(e.target.value); e.target.style.borderColor = 'rgba(211,191,162,0.12)'; }}
        onFocus={e => e.target.style.borderColor = 'rgba(211,191,162,0.4)'}
        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
        style={{
          width: '100%', padding: '15px 16px',
          background: PX.card, border: '1px solid rgba(211,191,162,0.18)',
          color: '#fff', borderRadius: '16px', fontSize: '0.9rem',
          outline: 'none', boxSizing: 'border-box',
          fontFamily: 'Poppins, sans-serif', transition: 'border-color 0.2s'
        }}
      />
    </div>

    {/* ── INLINE CTA — replaces floating bottom button for reservation ── */}
    {(() => {
      const nameOk  = customerInfo.name.trim().length > 0;
      const phoneOk = customerInfo.phone?.replace(/\D/g,'').length === 10;
      const dateOk  = !!reservationDate;
      const timeOk  = !!reservationTime;
      const allOk   = nameOk && phoneOk && dateOk && timeOk && guestConsent;

      const hint = !nameOk
        ? (language === 'mr' ? 'नाव आवश्यक आहे' : 'Enter your name above')
        : !phoneOk
        ? (language === 'mr' ? '१० अंकी नंबर आवश्यक' : '10-digit number required')
        : !dateOk
        ? (language === 'mr' ? 'तारीख निवडा' : 'Choose a date')
        : !timeOk
        ? (language === 'mr' ? 'वेळ निवडा' : 'Select a time slot')
        : !guestConsent
        ? (language === 'mr' ? 'गोपनीयता संमती आवश्यक' : 'Please accept the privacy notice')
        : null;

      return (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: 14 }}>
            <ConsentCheck checked={guestConsent} onChange={toggleGuestConsent} onOpen={openLegal} language={language} tenantName={restaurantData?.name || 'the restaurant'} />
          </div>
          {hint && (
            <div style={{
              textAlign: 'center', marginBottom: '10px',
              fontSize: '0.6rem', color: 'rgba(211,191,162,0.62)',
              fontWeight: '700', letterSpacing: '0.3px'
            }}>
              {hint}
            </div>
          )}
          <button type="button"
            disabled={!allOk}
            onClick={() => { if (allOk) setReservationAskOrder(true); }}
            style={{
              width: '100%', padding: '17px',
              background: allOk
                ? 'linear-gradient(135deg, #d3bfa2, #bda88a)'
                : 'rgba(211,191,162,0.05)',
              color: allOk ? '#0c0c0c' : 'rgba(211,191,162,0.2)',
              border: allOk ? 'none' : '1px solid rgba(211,191,162,0.08)',
              borderRadius: '18px', fontWeight: '900', fontSize: '0.88rem',
              cursor: allOk ? 'pointer' : 'not-allowed',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px',
              boxShadow: allOk ? '0 8px 24px rgba(211,191,162,0.15)' : 'none'
            }}
          >
            <CalendarClock size={16} strokeWidth={2} />
            {language === 'mr' ? 'बुकिंग पुढे जा' : 'CONTINUE BOOKING'}
            <ChevronRight size={16} />
          </button>
        </div>
      );
    })()}
  </>
)}

{/* Queue info pills — dine-in only */}
          {isDineIn && avgWaitData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {[
                {
                  icon: <UserCheck size={13} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />,
                  label: language === 'mr' ? 'पुढे रांग' : 'Groups Ahead',
                  val: `${avgWaitData.queueLength || 0}`
                },
                {
                  icon: <Hourglass size={13} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />,
                  label: language === 'mr' ? 'अंदाजे वेळ' : 'Est. Wait',
                  val: `~${(avgWaitData.queueLength || 0) * (avgWaitData.avgWait || 20)} min`
                },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#0c0c0c',
                  border: '1px solid rgba(211,191,162,0.07)',
                  borderRadius: '16px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  {s.icon}
                  <div>
                    <div style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── INLINE CTA — dine-in and pickup ── */}
          {counterMode !== 'reservation' && (() => {
            const nameOk  = customerInfo.name.trim().length > 0;
            const phoneOk = customerInfo.phone?.replace(/\D/g,'').length === 10;
            const pickupOk = counterMode !== 'pickup' || !!scheduledPickupTime;
            const allOk   = nameOk && phoneOk && pickupOk && guestConsent;

            const hint = !nameOk
              ? (language === 'mr' ? 'नाव आवश्यक आहे' : 'Enter your name above')
              : !phoneOk
              ? (language === 'mr' ? '१० अंकी नंबर आवश्यक' : '10-digit number required')
              : !pickupOk
              ? (language === 'mr' ? 'पिकअप वेळ निवडा' : 'Select a pickup time')
              : !guestConsent
              ? (language === 'mr' ? 'गोपनीयता संमती आवश्यक' : 'Please accept the privacy notice')
              : null;

            return (
              <div style={{ marginBottom: '40px' }}>
                <div style={{ marginBottom: 14 }}>
                  <ConsentCheck checked={guestConsent} onChange={toggleGuestConsent} onOpen={openLegal} language={language} tenantName={restaurantData?.name || 'the restaurant'} />
                </div>
                {hint && (
                  <div style={{
                    textAlign: 'center', marginBottom: '10px',
                    fontSize: '0.6rem', color: 'rgba(211,191,162,0.62)',
                    fontWeight: '700', letterSpacing: '0.3px'
                  }}>
                    {hint}
                  </div>
                )}
                <button type="button"
                  disabled={!allOk}
                  onClick={() => { if (allOk) setRegistrationStep('menu'); }}
                  style={{
                    width: '100%', padding: '17px',
                    background: allOk
                      ? 'linear-gradient(135deg, #d3bfa2, #bda88a)'
                      : 'rgba(211,191,162,0.05)',
                    color: allOk ? '#0c0c0c' : 'rgba(211,191,162,0.2)',
                    border: allOk ? 'none' : '1px solid rgba(211,191,162,0.08)',
                    borderRadius: '18px', fontWeight: '900', fontSize: '0.88rem',
                    cursor: allOk ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '10px',
                    boxShadow: allOk ? '0 8px 24px rgba(211,191,162,0.15)' : 'none',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  {counterMode === 'dine-in'
                    ? <Armchair size={16} strokeWidth={1.5} />
                    : <ShoppingBag size={16} strokeWidth={1.5} />
                  }
                  {counterMode === 'dine-in'
                    ? (language === 'mr' ? 'मेनू पहा' : 'BROWSE MENU')
                    : (language === 'mr' ? 'मेनू पहा' : 'BROWSE MENU')
                  }
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })()}

        </div>{/* end of padding div */}

        {legalSheetEl}
        {/* ── RESERVATION ORDER PROMPT OVERLAY ── */}
{/* ── RESERVATION: ASK ORDER OVERLAY ── */}
        <AnimatePresence>
          {reservationAskOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 9000,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                padding: '0 0 32px'
              }}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 26 }}
                style={{
                  width: '100%', maxWidth: '420px',
                  background: PX.card,
                  border: '1px solid rgba(211,191,162,0.18)',
                  borderRadius: '24px 24px 20px 20px',
                  overflow: 'hidden', margin: '0 16px'
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '22px 22px 18px',
                  borderBottom: '1px solid rgba(211,191,162,0.07)',
                  background: 'rgba(211,191,162,0.03)'
                }}>
                  <div style={{
                    fontSize: '0.5rem', color: 'rgba(211,191,162,0.62)',
                    fontWeight: '900', letterSpacing: '2.5px',
                    textTransform: 'uppercase', marginBottom: '4px'
                  }}>
                    {restaurantData?.name}
                  </div>

                  {/* Booking summary strip */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '8px', marginTop: '12px'
                  }}>
                    {[
                      { icon: <Users size={10} color="rgba(211,191,162,0.4)" />, label: customerInfo.name, sub: `${partySize} guests` },
                      { icon: <CalendarClock size={10} color="rgba(211,191,162,0.4)" />, label: reservationDate ? new Date(reservationDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }) : '—', sub: (() => { if (!reservationTime) return '—'; const [h,m] = reservationTime.split(':').map(Number); return h < 12 ? `${h}:${m.toString().padStart(2,'0')} AM` : h === 12 ? `12:${m.toString().padStart(2,'0')} PM` : `${h-12}:${m.toString().padStart(2,'0')} PM`; })() },
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: PX.card,
                        border: '1px solid rgba(211,191,162,0.07)',
                        borderRadius: '13px', padding: '10px 12px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        {s.icon}
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#d3bfa2', lineHeight: 1.2 }}>{s.label}</div>
                          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700', marginTop: '2px' }}>{s.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 22px 24px' }}>
                  <h3 style={{
                    fontSize: '1rem', fontWeight: '900', color: '#fff',
                    marginBottom: '6px', letterSpacing: '-0.3px'
                  }}>
                    {language === 'mr' ? 'आधीच जेवण ऑर्डर करायचे का?' : 'Would you like to pre-order?'}
                  </h3>
                  <p style={{
                    fontSize: '0.68rem', color: 'rgba(255,255,255,0.52)',
                    lineHeight: 1.7, marginBottom: '20px', fontWeight: '500'
                  }}>
                    {language === 'mr'
                      ? 'तुम्ही येण्यापूर्वीच जेवण तयार असेल — प्रतीक्षा नाही!'
                      : 'Your food will be ready when you arrive — no waiting at all.'}
                  </p>

                  {/* YES — browse menu */}
                  <button type="button"
                    onClick={() => { setReservationAskOrder(false); setRegistrationStep('menu'); }}
                    style={{
                      width: '100%', padding: '16px',
                      background: PX.gold,
                      border: 'none', borderRadius: '16px',
                      color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
                      cursor: 'pointer', marginBottom: '10px',
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: '0 8px 24px rgba(211,191,162,0.15)'
                    }}
                  >
                    <UtensilsCrossed size={15} strokeWidth={2.5} />
                    {language === 'mr' ? 'हो, मेनू पाहतो' : 'Yes, Pre-Order Now'}
                    <ChevronRight size={15} />
                  </button>

                  {/* NO — just reserve, place with empty items, go to confirm */}
                  <button type="button"
                    onClick={async () => {
                      if (placingRef.current) return; // double-tap guard: a second tap booked the table twice
                      const [hours, minutes] = reservationTime.split(':').map(Number);
                      // Restaurant time is IST. `new Date('YYYY-MM-DD')` + setHours() uses the device zone and booked the wrong
                      // time (even the wrong day) outside IST; placeReservation() already built it this way.
                      const resDateTime = new Date(`${reservationDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`);
                      setIsPlacingOrder(true);
                      try {
                        const res = await axios.post(`${BASE_URL}/reservations/${tenantId}`, {
                          sessionId,
                          customerName: customerInfo.name,
                          customerPhone: customerInfo.phone?.replace(/\D/g,'') || '',
                          partySize,
                          reservationTime: resDateTime.toISOString(),
                          tablePreference,
                          specialRequests,
                          items: [],
                          totalAmount: 0,
                          status: 'pending'
                        });
setWaitlistEntry({ ...res.data.reservation, mode: 'reservation', _noPreorder: true });
setReservationAskOrder(false);
setRegistrationStep('confirm');
// In the "No, just reserve the table" button's onClick, after setRegistrationStep('confirm'):

const phone = customerInfo.phone?.replace(/\D/g, '') || '';
if (phone.length === 10) {
  upsertGuest({
    tenantId,
    name: customerInfo.name.trim(),
    phone,
    lastVisit: new Date().toISOString(),
  }).catch(() => {});
}
                        if ('Notification' in window && Notification.permission === 'granted') {
                          safeNotify('Reservation Requested!', {
                            body: `Hi ${customerInfo.name}! Pending confirmation.`,
                            event: 'reservation-update'
                          });
                        }
                      } catch(err) {
                        console.error(err);
                        triggerAlert(err?.response?.status === 400 && err.response.data?.error ? err.response.data.error : 'orderError','error');
                      } finally {
                        setIsPlacingOrder(false);
                      }
                    }}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'transparent',
                      border: '1px solid rgba(211,191,162,0.1)',
                      borderRadius: '16px', color: 'rgba(255,255,255,0.52)',
                      fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                      transition: 'all 0.15s', letterSpacing: '0.3px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.22)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.52)'; }}
                  >
                    {language === 'mr' ? 'नाही, फक्त टेबल बुक करा' : 'No, just reserve the table'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CustomerShell>
    );
  }      
  // ══════════════════════════════════════════
  // SCREEN: MODE SELECTION
  // ══════════════════════════════════════════
  const occupiedCount = avgWaitData?.tablesOccupied || 0;
  const totalCount    = avgWaitData?.totalTables    || 12;
  const queueLen      = avgWaitData?.queueLength    || 0;
  const estWait       = avgWaitData?.estimatedWait  || 0;
  const freeTables    = totalCount - occupiedCount;
  const isFull        = freeTables <= 0;

  const RING = 2 * Math.PI * 26;
  const freeFrac = Math.max(0, Math.min(1, freeTables / Math.max(1, totalCount)));
  const modeTiles = [
    featureEnabled('waitlist') && {
      key: 'dine-in', icon: Armchair, hero: true,
      title: language === 'mr' ? 'रांगेत नाव नोंदवा' : 'Join Waitlist',
      sub: language === 'mr'
        ? `प्रतीक्षा करताना आधीच ऑर्डर द्या${queueLen > 0 ? ` · ~${estWait} मिनिट` : ''}`
        : `Pre-order while you wait${queueLen > 0 ? ` · ~${estWait} min` : ' · No queue now'}`,
      chip: queueLen > 0 ? `${queueLen} group${queueLen !== 1 ? 's' : ''} ahead` : null,
    },
    featureEnabled('pickup') && {
      key: 'pickup', icon: ShoppingBag,
      title: language === 'mr' ? 'टेकअवे / पिकअप' : 'Takeaway / Pickup',
      sub: language === 'mr' ? 'ऑर्डर द्या, ठरलेल्या वेळी घ्या' : 'Order now, collect at your time',
    },
    featureEnabled('reservation') && {
      key: 'reservation', icon: CalendarClock,
      title: language === 'mr' ? 'टेबल बुकिंग' : 'Reserve a Table',
      sub: language === 'mr' ? 'तारीख व वेळ निवडा · आधीच ऑर्डर द्या' : 'Pick a date & time · Pre-order',
    },
  ].filter(Boolean);

  return (
    <CustomerShell scrollRef={scrollRef}>
      <CustomerRestaurantBadge restaurantName={restaurantData?.name} />

      {/* Live table pulse */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '14px 18px', marginBottom: '22px',
        background: PX.card, border: `1px solid ${PX.line}`, boxShadow: PX.shadow,
        borderRadius: '26px', width: '100%', maxWidth: '400px', boxSizing: 'border-box'
      }}>
        <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
          <svg width="62" height="62" viewBox="0 0 62 62" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="31" cy="31" r="26" fill="none" stroke="rgba(211,191,162,0.12)" strokeWidth="5" />
            <circle cx="31" cy="31" r="26" fill="none" stroke="#d3bfa2" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${freeFrac * RING} ${RING}`} style={{ transition: 'stroke-dasharray 0.8s ease', filter: 'drop-shadow(0 0 6px rgba(211,191,162,0.5))' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PX.serif, fontSize: '1.15rem', fontWeight: 700, color: '#f3e8d2' }}>{Math.max(0, freeTables)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, letterSpacing: '2.4px', color: 'rgba(211,191,162,0.62)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d3bfa2', boxShadow: '0 0 8px rgba(211,191,162,0.8)' }} />
            {language === 'mr' ? 'आत्ता थेट' : 'LIVE NOW'}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#f7f3eb', fontWeight: 800, marginTop: 5 }}>
            {isFull
              ? (language === 'mr' ? `सर्व ${totalCount} टेबल भरलेले` : `All ${totalCount} tables taken`)
              : (language === 'mr' ? `${freeTables} / ${totalCount} टेबल उपलब्ध` : `${freeTables} of ${totalCount} tables free`)}
          </div>
          {isFull && queueLen > 0 && (
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.52)', marginTop: 3 }}>
              {queueLen} group{queueLen !== 1 ? 's' : ''} waiting · ~{estWait} min
            </div>
          )}
        </div>
      </motion.div>

      {/* Mode tiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' }}>
        {modeTiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <motion.button key={tile.key} type="button"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 + i * 0.08, type: 'spring', stiffness: 260, damping: 24 }}
              whileTap={{ scale: 0.975 }} whileHover={{ y: -3 }}
              onClick={() => { setCounterMode(tile.key); setRegistrationStep('register'); }}
              style={{
                position: 'relative', overflow: 'hidden', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#fff',
                padding: '20px 18px', borderRadius: '26px', boxSizing: 'border-box',
                background: tile.hero ? `${PX.goldSoft}, ${PX.card}` : PX.card,
                border: `1px solid ${tile.hero ? 'rgba(211,191,162,0.38)' : PX.line}`,
                boxShadow: tile.hero ? '0 20px 46px rgba(211,191,162,0.12), inset 0 1px 0 rgba(255,255,255,0.08)' : PX.shadow,
                fontFamily: 'inherit'
              }}>
              <div style={{ position: 'absolute', right: -26, top: -26, width: 110, height: 110, borderRadius: '50%', border: '1px solid rgba(211,191,162,0.18)', boxShadow: '0 0 0 14px rgba(211,191,162,0.03)' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '22px', flexShrink: 0,
                  background: tile.hero ? PX.gold : 'rgba(211,191,162,0.08)',
                  border: tile.hero ? 'none' : '1px solid rgba(211,191,162,0.18)',
                  boxShadow: tile.hero ? '0 10px 24px rgba(211,191,162,0.28)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={24} color={tile.hero ? '#14110c' : '#d3bfa2'} strokeWidth={1.7} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: PX.serif, fontSize: '1.12rem', fontWeight: 700, color: '#f7f3eb', letterSpacing: '-0.2px' }}>{tile.title}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginTop: 4 }}>{tile.sub}</div>
                  {tile.chip && (
                    <div style={{ marginTop: 9, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 20, background: 'rgba(211,191,162,0.1)', border: '1px solid rgba(211,191,162,0.22)' }}>
                      <Users size={10} color="#d3bfa2" />
                      <span style={{ fontSize: '0.58rem', color: '#d3bfa2', fontWeight: 800 }}>{tile.chip}</span>
                    </div>
                  )}
                </div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.16)' }}>
                  <ChevronRight size={16} color="#d3bfa2" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Language toggle */}
      <button type="button"
        onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
        style={{
          marginTop: '30px', background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${PX.line}`,
          color: 'rgba(211,191,162,0.7)', padding: '10px 22px',
          borderRadius: '26px', fontSize: '0.68rem', fontWeight: '800',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: '8px', letterSpacing: '0.5px', fontFamily: 'inherit'
        }}
      >
        <Globe2 size={13} strokeWidth={1.6} />
        {language === 'en' ? 'मराठी' : 'English'}
      </button>
      <GuestLegalLinks language={language} onOpen={openLegal} style={{ marginTop: 22, paddingBottom: 18 }} />
      {legalSheetEl}
    </CustomerShell>
  );
} // ← end of if (isCounterScan && registrationStep !== 'menu')



// ── LOADER ──
if (isLoading) return <BrandLoader message={language === 'mr' ? 'मेनू लोड होत आहे' : 'Preparing your menu'} />;

if (sessionEnded && !isCounterScan) {
  return (
    <SessionEndedScreen language={language} reason={sessionEnded} restaurantName={restaurantData?.name || ''} lastBill={lastBill}
      tenantId={tenantId} tableNumber={tableNumber} onClaimed={onUpiClaimed} />
  );
}

if (sessionBlocked) {
  return (
    <CustomerShell>
      <div style={{ marginTop: '18vh', maxWidth: '340px' }}>
        <AlertCircle size={34} color="#d3bfa2" />
        <h2 style={{ margin: '16px 0 8px', fontFamily: 'Georgia, serif', fontWeight: 500, color: '#f7f3eb', fontSize: '1.35rem' }}>
          {language === 'mr' ? 'हा टेबल लिंक वैध नाही' : "This table link isn't valid"}
        </h2>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          {language === 'mr' ? 'कृपया तुमच्या टेबलवरील QR कोड पुन्हा स्कॅन करा किंवा स्टाफला विचारा.' : 'Please scan the QR code on your table again, or ask a member of staff for help.'}
        </p>
      </div>
    </CustomerShell>
  );
}

  return (
    <div style={{...styles.body, backgroundColor: '#0b0b0c', position: 'relative', isolation: 'isolate'}}>
      <div className="px-ambient" style={{ zIndex: -1 }} aria-hidden="true"><div className="px-grain" /></div>
      {legalSheetEl}
      {viewOnly && (
        <div role="status" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000, padding: 'calc(9px + env(safe-area-inset-top, 0px)) 14px 9px', background: 'rgba(20,17,12,0.96)', borderBottom: '1px solid rgba(211,191,162,0.35)', color: '#d3bfa2', fontSize: '0.72rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.4, backdropFilter: 'blur(8px)' }}>
          {language === 'mr'
            ? 'फक्त पाहण्यासाठी — या टेबलवर दुसऱ्या पाहुण्याने ऑर्डर दिली आहे. फक्त तेच ऑर्डर करू शकतात.'
            : 'View only — another guest at this table has ordered. Only that guest can order and be billed.'}
        </div>
      )}

      {/* OFFLINE / SAVED-MENU NOTICE — persistent, not a timed toast */}
      <AnimatePresence>
        {(isOffline || servingFromCache) && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, padding: '7px 14px', background: 'rgba(186,117,23,0.94)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            <WifiOff size={11} color="#0a0a0a" strokeWidth={2.5} />
            <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#0a0a0a' }}>
              {language === 'mr'
                ? 'ऑफलाइन — जतन केलेला मेनू दाखवत आहे'
                : "You're offline — showing the saved menu"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALERTS */}
      <AnimatePresence>
        {alert.show && (
          <motion.div initial={{ y: -100 }} animate={{ y: 24 }} exit={{ y: -100 }} style={styles.globalAlert}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               {alert.type === 'success' ? <CheckCircle2 size={20} color={primaryColor} /> : <AlertCircle size={20} color="#e8b87a" />}
               <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#fff' }}>{alert.msg}</span>
             </div>
             <X size={16} color="#555" onClick={() => setAlert({ ...alert, show: false })} />
          </motion.div>
        )}
      </AnimatePresence>
{/* Counter mode context banner */}
{isCounterScan && registrationStep === 'menu' && (
  <div style={{
    position: 'sticky', top: 0, zIndex: 1000,
    background: 'rgba(14,14,14,0.97)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(211,191,162,0.07)',
  }}>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 18px',
    }}>
      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
          background: 'rgba(211,191,162,0.06)',
          border: '1px solid rgba(211,191,162,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
{counterMode === 'dine-in'
            ? <Armchair size={16} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />
            : counterMode === 'reservation'
            ? <CalendarClock size={16} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />
            : <ShoppingBag size={16} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
{/* RIGHT: back */}

{counterMode === 'dine-in' ? (
  avgWaitData?.queueLength ? (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Hash size={9} color="rgba(211,191,162,0.4)" />
        <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>
          {avgWaitData.queueLength + 1} in queue
        </span>
      </div>
      <span style={{ fontSize: '0.55rem', color: 'rgba(211,191,162,0.62)' }}>·</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Hourglass size={9} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700' }}>
          ~{avgWaitData.estimatedWait || 20} min
        </span>
      </div>
    </>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <UserCheck size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
      <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>Waitlist</span>
    </div>
  )
) : counterMode === 'reservation' ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <CalendarClock size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
    <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>
      {language === 'mr' ? 'बुकिंग' : 'RESERVATION'}
      {reservationDate && reservationTime ? ` · ${new Date(reservationDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${(() => { const [h, m] = reservationTime.split(':').map(Number); return h > 12 ? `${h-12}:${m.toString().padStart(2,'0')} PM` : `${h}:${m.toString().padStart(2,'0')} AM`; })()}` : ''}
    </span>
  </div>
) : scheduledPickupTime ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <Clock3 size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
    <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>
      Pickup {new Date(scheduledPickupTime).toLocaleTimeString([], { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
    </span>
  </div>
) : (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <Package size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
    <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>Pickup Order</span>
  </div>
)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <Users size={9} color="rgba(211,191,162,0.2)" />
            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.52)', fontWeight: '600' }}>
              {customerInfo.name}
              {counterMode === 'dine-in' && partySize > 1 && ` · ${partySize} pax`}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: back */}
      <button type="button"
        onClick={() => setRegistrationStep('register')}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '7px 12px',
          background: 'rgba(211,191,162,0.05)',
          border: '1px solid rgba(211,191,162,0.1)',
          color: 'rgba(211,191,162,0.62)',
          borderRadius: '9px', fontSize: '0.58rem', fontWeight: '900',
          cursor: 'pointer', letterSpacing: '0.5px', flexShrink: 0,
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(211,191,162,0.22)';
          e.currentTarget.style.color = 'rgba(211,191,162,0.7)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(211,191,162,0.1)';
          e.currentTarget.style.color = 'rgba(211,191,162,0.4)';
        }}
      >
        <ArrowLeft size={11} strokeWidth={2} />
        BACK
      </button>
    </div>
  </div>
)}

      <header style={styles.header}>
        <div style={{ position:'absolute', top:'14px', left:'14px', zIndex:6 }}><PwaInstallButton kind="customer" compact /></div>
        <div style={styles.langToggleBox}>
          <button type="button" style={{...styles.langBtn, color: primaryColor, borderColor: borderColor}} onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}>
            <Globe2 size={12} style={{marginRight: '6px'}} /> {language === 'en' ? 'मराठी' : 'English'}
          </button>
        </div>
        
{hasNonVegInView && (
  <div style={{
    position: 'absolute', top: '15px', left: '15px',
    display: 'flex',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '4px',
    gap: '4px',
    zIndex: 5
  }}>
    {/* VEG */}
    <button type="button"
      onClick={() => setFilterVegOnly(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 12px', borderRadius: '16px', border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        outline: filterVegOnly
          ? '1.5px solid rgba(211, 191, 162, 0.2)'
          : '1px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Veg square symbol */}
      <span style={{
        width: '12px', height: '12px', flexShrink: 0,
        border: '2px solid #4a7c3f',
        borderRadius: '2px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#4a7c3f'
        }} />
      </span>
      <span style={{
        fontSize: '0.6rem', fontWeight: '900', letterSpacing: '0.5px',
        color: filterVegOnly ? '#c9a84c' : 'rgba(255,255,255,0.3)'
      }}>
        {language === 'mr' ? 'शाकाहारी' : 'VEG'}
      </span>
    </button>

    {/* NON-VEG */}
    <button type="button"
      onClick={() => setFilterVegOnly(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 12px', borderRadius: '16px', border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        outline: !filterVegOnly
          ? '1.5px solid rgba(211, 191, 162, 0.2)'
          : '1px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Non-veg triangle symbol */}
      <span style={{
        width: '12px', height: '12px', flexShrink: 0,
        border: '2px solid #8a3030',
        borderRadius: '2px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{
          width: 0, height: 0,
          borderLeft: '3.5px solid transparent',
          borderRight: '3.5px solid transparent',
          borderBottom: '6px solid #8a3030'
        }} />
      </span>
      <span style={{
        fontSize: '0.6rem', fontWeight: '900', letterSpacing: '0.5px',
        color: !filterVegOnly ? '#c9a84c' : 'rgba(255,255,255,0.3)'
      }}>
        {language === 'mr' ? 'मांसाहारी' : 'NON-VEG'}
      </span>
    </button>
  </div>
)}
        <h1 style={{...styles.cafeName, background: 'linear-gradient(180deg,#f6ecd7,#d3bfa2 65%,#b99f78)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{restaurantData?.name || 'Restaurant'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '10px 0 4px' }} aria-hidden="true">
          <span style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.6))' }} />
          <Sparkles size={11} color="#d3bfa2" />
          <span style={{ width: 40, height: 1, background: 'linear-gradient(90deg, rgba(211,191,162,0.6), transparent)' }} />
        </div>
        <div style={styles.poweredBy}>{t[language].poweredBy} <img src={PRATYEKSHAA_LOGO} alt="Pratyeksha" style={{ width:86, height:'auto', verticalAlign:'middle', background:'#f7f3eb', borderRadius:5, padding:'2px 4px', margin:'0 3px' }} /> • {t[language].table} {convertToMrNumber(tableNumber)}</div>
        <GuestLegalLinks language={language} onOpen={openLegal} style={{ marginTop: 8 }} />
      </header>
{activeAnnouncement && !announcementDismissed && (() => {
  const typeConfig = {
    offer:    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      ),
      label: 'SPECIAL OFFER',
      accentFg:   '#e8c96a',
      accentMid:  '#c9a84c',
      accentDim:  'rgba(201,168,76,0.18)',
      borderCol:  'rgba(201,168,76,0.35)',
      pillBg:     'rgba(201,168,76,0.12)',
      glowCol:    'rgba(201,168,76,0.12)',
    },
    discount: {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/>
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/>
        </svg>
      ),
      label: 'LIMITED DISCOUNT',
      accentFg:   '#d3bfa2',
      accentMid:  '#bda88a',
      accentDim:  'rgba(211,191,162,0.15)',
      borderCol:  'rgba(211,191,162,0.3)',
      pillBg:     'rgba(211,191,162,0.1)',
      glowCol:    'rgba(211,191,162,0.08)',
    },
    wish: {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      label: 'FROM THE KITCHEN',
      accentFg:   '#e8c96a',
      accentMid:  '#c9a84c',
      accentDim:  'rgba(201,168,76,0.14)',
      borderCol:  'rgba(201,168,76,0.28)',
      pillBg:     'rgba(201,168,76,0.1)',
      glowCol:    'rgba(201,168,76,0.08)',
    },
    announcement: {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 3L9.218 10.083"/>
          <path d="M11.698 20.334L7 17l.001-5.001L22 3"/>
          <path d="M8 11.5V17"/>
          <path d="M2 7l5 3v6l-5 3V7z"/>
        </svg>
      ),
      label: 'ANNOUNCEMENT',
      accentFg:   '#d3bfa2',
      accentMid:  '#bda88a',
      accentDim:  'rgba(211,191,162,0.13)',
      borderCol:  'rgba(211,191,162,0.28)',
      pillBg:     'rgba(211,191,162,0.08)',
      glowCol:    'rgba(211,191,162,0.06)',
    },
  };

  const cfg = typeConfig[activeAnnouncement.type] || typeConfig.announcement;

  return (
    <motion.div
      key={activeAnnouncement._id || activeAnnouncement.title}
      initial={{ opacity: 0, y: -18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={{ margin: '0 16px 16px', position: 'relative' }}
    >
      {/* Outer ambient glow */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: '-1px',
          borderRadius: '22px',
          background: `radial-gradient(ellipse at 50% 0%, ${cfg.glowCol} 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0
        }}
      />

      {/* Main card */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #0f0f0f 0%, #0c0c0c 100%)',
        border: `1px solid ${cfg.borderCol}`,
        borderRadius: '20px',
        overflow: 'hidden',
      }}>

        {/* Top shimmer line */}
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 2 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${cfg.accentFg}, transparent)`,
            zIndex: 2
          }}
        />

        {/* Subtle corner accent */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '80px', height: '80px',
          background: `radial-gradient(circle at top right, ${cfg.accentDim} 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ padding: '14px 16px 14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '13px' }}>

            {/* Icon container — animated ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', inset: '-4px', borderRadius: '16px',
                  border: `1px solid ${cfg.borderCol}`,
                  pointerEvents: 'none'
                }}
              />
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: cfg.accentDim,
                border: `1px solid ${cfg.borderCol}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cfg.accentFg,
                position: 'relative', zIndex: 1,
                boxShadow: `0 4px 16px ${cfg.glowCol}`
              }}>
                {cfg.icon}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Top row — label chip + dismiss */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: cfg.pillBg,
                  border: `1px solid ${cfg.borderCol}`,
                  borderRadius: '20px', padding: '3px 10px'
                }}>
                  {/* Pulsing dot */}
                  <motion.div
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: cfg.accentMid, flexShrink: 0
                    }}
                  />
                  <span style={{
                    fontSize: '0.44rem', fontWeight: '900', letterSpacing: '2px',
                    color: cfg.accentMid, textTransform: 'uppercase'
                  }}>
                    {cfg.label}
                  </span>
                </div>

                <button type="button"
                  onClick={() => setAnnouncementDismissed(true)}
                  style={{
                    width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.52)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.borderCol; e.currentTarget.style.color = cfg.accentFg; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; }}
                >
                  <X size={12} />
                </button>
              </div>

              {activeAnnouncement.imageUrl && (
                <img src={activeAnnouncement.imageUrl} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '12px', marginBottom: '10px', display: 'block' }} />
              )}
              {/* Title */}
              <div style={{
                fontSize: '0.92rem', fontWeight: '900', color: '#fff',
                letterSpacing: '-0.2px', lineHeight: 1.25, marginBottom: '4px'
              }}>
                {activeAnnouncement.title}
              </div>

              {/* Message */}
              <div style={{
                fontSize: '0.72rem', color: 'rgba(255,255,255,0.52)',
                lineHeight: 1.6, fontWeight: '500'
              }}>
                {activeAnnouncement.message}
              </div>

              {/* Discount pill — if applicable */}
              {activeAnnouncement.discountValue && (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 18 }}
                  style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                >
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: cfg.accentDim,
                    border: `1px solid ${cfg.borderCol}`,
                    borderRadius: '10px', padding: '6px 13px',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    {/* Shimmer sweep */}
                    <motion.div
                      animate={{ x: ['-80px', '120px'] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', repeatDelay: 1.5 }}
                      style={{
                        position: 'absolute', top: 0, bottom: 0, width: '40px',
                        background: `linear-gradient(90deg, transparent, ${cfg.accentDim}, transparent)`,
                        pointerEvents: 'none'
                      }}
                    />
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke={cfg.accentFg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span style={{
                      fontSize: '0.82rem', fontWeight: '900',
                      color: cfg.accentFg, fontFamily: 'monospace', letterSpacing: '0.5px'
                    }}>
                      {activeAnnouncement.discountType === 'percent'
                        ? `${activeAnnouncement.discountValue}% OFF`
                        : `₹${activeAnnouncement.discountValue} OFF`}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700' }}>
                    {language === 'mr' ? 'आजच वापरा' : 'TODAY ONLY'}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom strip — restaurant name + timestamp feel */}
          <div style={{
            marginTop: '12px', paddingTop: '10px',
            borderTop: `1px solid rgba(255,255,255,0.04)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '5px',
                background: cfg.accentDim, border: `1px solid ${cfg.borderCol}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke={cfg.accentMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
                  <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700' }}>
                {restaurantData?.name}
              </span>
            </div>
            <span style={{
              fontSize: '0.5rem', color: cfg.accentMid,
              fontWeight: '900', letterSpacing: '1px',
              opacity: 0.6
            }}>
              LIVE
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
})()}

{/* SEARCH BAR */}

<div style={styles.searchWrapper}>
  <div style={{ position: 'relative' }}>
    <div style={styles.searchContainer}>
      <Search size={18} color={primaryColor} />
      <input
        type="text"
        placeholder={t[language].searchPlaceholder}
        style={styles.searchInput}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      {searchQuery.length > 0 && (
        <button type="button"
          onClick={() => setSearchQuery('')}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(211,191,162,0.62)', cursor: 'pointer', padding: '4px',
            display: 'flex', alignItems: 'center'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
 
    {/* ── PREMIUM SEARCH SUGGESTIONS DROPDOWN ── */}
    {globalSearchResults.length > 0 && searchQuery.length >= 2 && (
      <div style={{
        position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 2000,
        background: '#0f0f0f',
        border: '1px solid rgba(211,191,162,0.18)',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(211,191,162,0.06)'
      }}>
        {/* Header strip */}
        <div style={{
          padding: '10px 16px 8px',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Search size={11} color="rgba(211,191,162,0.3)" />
          <span style={{
            fontSize: '0.5rem', fontWeight: '900', letterSpacing: '2px',
            color: 'rgba(211,191,162,0.62)', textTransform: 'uppercase'
          }}>
            {globalSearchResults.length} {language === 'mr' ? 'पदार्थ सापडले' : 'dishes found'}
          </span>
        </div>
 
        {/* Results list */}
        <div style={{ maxHeight: '320px', overflowY: 'auto' }} className="no-scrollbar">
          {globalSearchResults.map((item, idx) => {
            const cat = categoryList.find(c => c.categoryId === item.categoryId);
            const isCurrentCat = item.categoryId === selectedCategoryId;
            const isStar   = item._eng?.quadrant === 'star';
            const isPuzzle = item._eng?.quadrant === 'puzzle';
 
            return (
              <div
                key={item._id}
                onMouseDown={e => {
                  // onMouseDown fires before onBlur — prevents dropdown vanishing before click
                  e.preventDefault();
                  setSelectedCategoryId(item.categoryId);
                  setSearchQuery(item.name); // fill search with dish name to highlight it
                  setTimeout(() => {
                    // Clear search entirely after navigation so dropdown disappears
                    setSearchQuery('');
                    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }, 80);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '13px 16px',
                  borderBottom: idx < globalSearchResults.length - 1
                    ? '1px solid rgba(211,191,162,0.05)'
                    : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(211,191,162,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* FSSAI dot — left edge */}
                <div style={{
                  width: '16px', height: '16px', flexShrink: 0,
                  border: `1.5px solid ${item.isVeg !== false
                    ? 'rgba(201,168,76,0.6)'
                    : 'rgba(201,168,76,0.35)'}`,
                  borderRadius: '3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxSizing: 'border-box'
                }}>
                  {item.isVeg !== false ? (
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'rgba(201,168,76,0.75)'
                    }} />
                  ) : (
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: '3px solid transparent',
                      borderRight: '3px solid transparent',
                      borderBottom: '5px solid rgba(201,168,76,0.55)'
                    }} />
                  )}
                </div>
 
                {/* Text block — LEFT ALIGNED */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  {/* Dish name */}
                  <div style={{
                    fontSize: '0.86rem', fontWeight: '700', color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '3px'
                  }}>
                    {language === 'mr' ? (item.name_mr || item.name) : item.name}
                  </div>
 
                  {/* Category + nav hint */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: '0.56rem', color: 'rgba(211,191,162,0.62)',
                      fontWeight: '700'
                    }}>
                      {language === 'mr' ? (cat?.name_mr || cat?.name) : cat?.name}
                    </span>
                    {!isCurrentCat && (
                      <>
                        <span style={{ color: 'rgba(211,191,162,0.62)', fontSize: '0.5rem' }}>·</span>
                        <span style={{
                          fontSize: '0.52rem',
                          color: 'rgba(201,168,76,0.45)',
                          fontWeight: '800'
                        }}>
                          {language === 'mr' ? 'टॅप करून जा →' : 'tap to navigate →'}
                        </span>
                      </>
                    )}
                    {/* Engineering badge inline */}
{/* ── BESTSELLER — isBestSeller field or star quadrant ── */}
{(isStar || item.isBestSeller === true) && (
  <span style={{
    fontSize: '0.46rem', fontWeight: '900', padding: '1px 6px',
    borderRadius: '3px',
    background: 'rgba(211,191,162,0.08)',
    color: '#d3bfa2',
    border: '1px solid rgba(211,191,162,0.22)',
    display: 'inline-flex', alignItems: 'center', gap: '2px'
  }}>
    <Tag size={7} strokeWidth={2.5} />
    {item.bestsellerRank ? `#${item.bestsellerRank}` : ''} {language === 'mr' ? 'बेस्टसेलर' : 'BESTSELLER'}
  </span>
)}

{/* ── MUST TRY — puzzle quadrant, only when NOT chef special ── */}
{isPuzzle && !isStar && !item.isBestSeller && item.isChefSpecial !== true && (
  <span style={{
    fontSize: '0.46rem', fontWeight: '900', padding: '1px 6px',
    borderRadius: '3px',
    background: 'rgba(189,168,138,0.08)',
    color: '#bda88a',
    border: '1px solid rgba(189,168,138,0.2)',
    display: 'inline-flex', alignItems: 'center', gap: '2px'
  }}>
    <Sparkles size={7} strokeWidth={2.5} />
    {language === 'mr' ? 'नक्की ट्राय करा' : 'MUST TRY'}
  </span>
)}
                  </div>
                </div>
 
                {/* Price — right edge */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '0.88rem', fontWeight: '900', color: '#d3bfa2',
                    fontFamily: 'monospace'
                  }}>
                    ₹{item.priceFull || item.price}
                  </div>
                  {item.priceHalf && (
                    <div style={{
                      fontSize: '0.54rem', color: 'rgba(211,191,162,0.62)',
                      fontWeight: '700', marginTop: '1px'
                    }}>
                      H: ₹{item.priceHalf}
                    </div>
                  )}
                </div>
 
                {/* Arrow chevron */}
                <ChevronRight size={13} color="rgba(211,191,162,0.2)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
 
        {/* Footer — show all */}
        <div
          onMouseDown={e => {
            e.preventDefault();
            setSelectedCategoryId('all');
            setSearchQuery('');
          }}
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(211,191,162,0.07)',
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
            fontSize: '0.58rem', color: 'rgba(211,191,162,0.62)',
            fontWeight: '800', letterSpacing: '0.5px',
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(211,191,162,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(211,191,162,0.62)'}
        >
          <Search size={11} />
          {language === 'mr'
            ? 'सर्व श्रेणींमध्ये पहा'
            : `Show all results across every category`}
        </div>
      </div>
    )}
  </div>
</div>

      {/* CATEGORY NAV */}
      <div style={{...styles.navContainer, backgroundColor: 'rgba(11,11,12,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'}}>
        <nav ref={navRef} style={styles.navScroll} className="no-scrollbar">
          <button type="button" ref={selectedCategoryId === 'all' ? activeTabRef : null} onClick={() => setSelectedCategoryId('all')} style={{...styles.navItem, color: selectedCategoryId === 'all' ? primaryColor : '#888'}}>
            {t[language].all} {selectedCategoryId === 'all' && <motion.div layoutId="underline" style={styles.activeUnderline} />}
          </button>
{categoryList
.filter(cat =>
    cat && cat.categoryId &&
    allMenuItems.some(i =>
      i.categoryId === cat.categoryId &&
      i.isAvailable !== false &&
      (filterVegOnly ? i.isVeg === true : i.isVeg !== true)
    )
  )
.map(cat => (
    <button type="button" key={cat.categoryId} ref={selectedCategoryId === cat.categoryId ? activeTabRef : null} onClick={() => setSelectedCategoryId(cat.categoryId)} style={{...styles.navItem, color: selectedCategoryId === cat.categoryId ? primaryColor : '#888'}}>
      {(language === 'mr' ? (cat.name_mr || cat.name || '') : (cat.name || '')).toUpperCase()} {selectedCategoryId === cat.categoryId && <motion.div layoutId="underline" style={styles.activeUnderline} />}
    </button>
  ))
}
        </nav>
      </div>

      {/* MENU GRID */}
      <motion.div style={styles.contentWrapper} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -50) handleSwipe('left'); if (info.offset.x > 50) handleSwipe('right'); }}>
        <AnimatePresence mode="wait">
          <motion.div key={selectedCategoryId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.menuContainer}>
            {/* ── CATEGORY PERFORMANCE SUMMARY — shown when a specific category is selected ── */}

{selectedCategoryId !== 'all' && !searchQuery && (() => {
  const catItems  = filteredMenuItems;
  const stars     = catItems.filter(i => i._eng?.quadrant === 'star').length;
  const puzzles   = catItems.filter(i => i._eng?.quadrant === 'puzzle').length;
  const totalSold = catItems.reduce((a, i) => a + (i._eng?.qtySold || 0), 0);
  if (totalSold === 0) return null;
 
  return (
    <div style={{
      margin: '0 0 14px',
      padding: '11px 15px',
      background: 'rgba(201,168,76,0.04)',
      border: '1px solid rgba(201,168,76,0.1)',
      borderRadius: '13px',
      display: 'flex', alignItems: 'center', gap: '14px',
      flexWrap: 'wrap'
    }}>
      {/* Left: label + count */}
      <div style={{ flex: 1, minWidth: '100px' }}>
        <div style={{
          fontSize: '0.46rem', color: 'rgba(211,191,162,0.62)',
          fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px'
        }}>
          {language === 'mr' ? 'श्रेणी अंतर्दृष्टी' : 'Category Insights'}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.52)', fontWeight: '600' }}>
          {catItems.length} {language === 'mr' ? 'पदार्थ' : 'dishes'}
          {totalSold > 0 && ` · ${totalSold} ${language === 'mr' ? 'विक्री (३० दिवस)' : 'sold (30 days)'}`}
        </div>
      </div>
 
      {/* Right: badges */}
      <div style={{ display: 'flex', gap: '7px' }}>
        {stars > 0 && (
          <div style={{
            textAlign: 'center', padding: '6px 11px',
            background: 'rgba(201,168,76,0.08)',
            borderRadius: '9px',
            border: '1px solid rgba(201,168,76,0.18)'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#c9a84c', fontFamily: 'monospace', lineHeight: 1 }}>
              {stars}
            </div>
            <div style={{ fontSize: '0.44rem', color: 'rgba(201,168,76,0.45)', fontWeight: '900', letterSpacing: '1px', marginTop: '2px' }}>
              STARS
            </div>
          </div>
        )}
        {puzzles > 0 && (
          <div style={{
            textAlign: 'center', padding: '6px 11px',
            background: 'rgba(189,168,138,0.07)',
            borderRadius: '9px',
            border: '1px solid rgba(189,168,138,0.16)'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#bda88a', fontFamily: 'monospace', lineHeight: 1 }}>
              {puzzles}
            </div>
            <div style={{ fontSize: '0.44rem', color: 'rgba(189,168,138,0.4)', fontWeight: '900', letterSpacing: '1px', marginTop: '2px' }}>
              PICKS
            </div>
          </div>
        )}
      </div>
    </div>
  );
})()}

{filteredMenuItems.map((item) => (
              <div key={item._id} style={{...styles.menuCard, background: cardBg, borderColor: borderColor}}>
<div style={styles.tagContainer}>
  {/* Chef Pick — ONLY when isChefSpecial is explicitly true */}
  {item.isChefSpecial === true && (
    <div style={styles.chefTag}>
      <Sparkles size={10} style={{ marginRight: '4px' }} />
      {language === 'mr' ? 'शेफ पसंती' : 'CHEF PICK'}
    </div>
  )}
</div>
<div style={styles.itemContentLeft}>
<div style={{
  fontSize: '1.05rem', fontWeight: '700', color: '#fff',
  display: 'flex', alignItems: 'center', gap: '6px',
  flexWrap: 'wrap', margin: '0 0 6px'
}}>
  {/* ── FSSAI Veg/Non-veg indicator (only shown when restaurant has both) ── */}
  {hasNonVegInView && !isOnlyVegTenant && (
    <span
      title={item.isVeg !== false ? 'Vegetarian' : 'Non-Vegetarian'}
      style={{
        width: '15px', height: '15px', flexShrink: 0,
        border: `1.5px solid ${item.isVeg !== false
          ? 'rgba(201,168,76,0.65)'
          : 'rgba(201,168,76,0.4)'}`,
        borderRadius: '3px',
        display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', boxSizing: 'border-box'
      }}
    >
      {item.isVeg !== false ? (
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'rgba(201,168,76,0.8)'
        }} />
      ) : (
        <div style={{
          width: 0, height: 0,
          borderLeft: '3px solid transparent',
          borderRight: '3px solid transparent',
          borderBottom: '5.5px solid rgba(201,168,76,0.65)'
        }} />
      )}
    </span>
  )}
 
  {/* Dish name */}
  {language === 'mr' ? item.name_mr : item.name}
 
  {/* ── ENGINEERING BADGE: BESTSELLER (gold) ── */}
{/* ── BESTSELLER badge: isBestSeller field (auto-computed) OR star quadrant ── */}
{(item.isBestSeller === true || item._eng?.quadrant === 'star') && (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '0.48rem', fontWeight: '900', letterSpacing: '0.5px',
    padding: '2px 7px', borderRadius: '4px',
    background: 'rgba(211,191,162,0.1)',
    color: '#d3bfa2',
    border: '1px solid rgba(211,191,162,0.28)'
  }}>
    <Tag size={8} strokeWidth={2.5} />
    {item.bestsellerRank
      ? (language === 'mr' ? `#${item.bestsellerRank} बेस्टसेलर` : `#${item.bestsellerRank} BESTSELLER`)
      : (language === 'mr' ? 'बेस्टसेलर' : 'BESTSELLER')}
  </span>
)}

{/* ── MUST TRY: puzzle quadrant AND isChefSpecial is NOT true ── */}
{item._eng?.quadrant === 'puzzle' && item.isChefSpecial !== true && (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '0.48rem', fontWeight: '900', letterSpacing: '0.5px',
    padding: '2px 7px', borderRadius: '4px',
    background: 'rgba(189,168,138,0.09)',
    color: '#bda88a',
    border: '1px solid rgba(189,168,138,0.22)'
  }}>
    <Sparkles size={8} strokeWidth={2.5} />
    {language === 'mr' ? 'नक्की ट्राय करा' : 'MUST TRY'}
  </span>
)}
  {/* ── SPICE BADGE ── */}
  {item.spicylevel && (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '0.58rem', fontWeight: '900', padding: '2px 7px',
      borderRadius: '4px',
      background: item.spicylevel.toUpperCase() === 'HIGH'
        ? 'rgba(232,170,90,0.14)'
        : 'rgba(211,191,162,0.12)',
      color: item.spicylevel.toUpperCase() === 'HIGH' ? '#e8aa5a' : '#d3bfa2',
      border: `1px solid ${item.spicylevel.toUpperCase() === 'HIGH'
        ? 'rgba(232,170,90,0.35)'
        : 'rgba(211,191,162,0.3)'}`,
      letterSpacing: '0.5px'
    }}>
      <Flame size={9} strokeWidth={2.5} />
      {t[language][`spice${item.spicylevel.charAt(0).toUpperCase() + item.spicylevel.slice(1).toLowerCase()}`] || item.spicylevel.toUpperCase()}
    </span>
  )}
 
  {/* ── SERVES BADGE ── */}
  {item.servingSize > 0 && (
    <span style={{
      fontSize: '0.58rem', fontWeight: '800', padding: '2px 7px',
      borderRadius: '4px',
      background: 'rgba(201,168,76,0.08)',
      color: '#c9a84c',
      border: '1px solid rgba(201,168,76,0.22)',
      letterSpacing: '0.3px',
      display: 'inline-flex', alignItems: 'center', gap: '3px'
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      {language === 'mr' ? `${item.servingSize} जण` : `Serves ${item.servingSize}`}
    </span>
  )}
</div>
  {/* 📋 PREMIUM INGREDIENTS LAYOUT BADGE ARRAYS */}
  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '0.6rem', color: '#555', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {t[language].ingredients}
    </span>
    
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
      {language === 'mr' ? (
        /* 🚀 FIXED: Using bracket notation to safely extract the array from MongoDB object mapping profiles */
        item.ingredients && item.ingredients['mr'] && item.ingredients['mr'].length > 0 ? (
          item.ingredients['mr'].map((ing, idx) => (
            <span key={idx} style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: '4px', color: '#aaa', fontWeight: '500' }}>
              {ing}
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.65rem', color: '#444', fontStyle: 'italic' }}>माहिती उपलब्ध नाही</span>
        )
      ) : (
        /* 🚀 FIXED: Using bracket notation to safely extract the array from MongoDB object mapping profiles */
        item.ingredients && item.ingredients['en'] && item.ingredients['en'].length > 0 ? (
          item.ingredients['en'].map((ing, idx) => (
            <span key={idx} style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: '4px', color: '#aaa', fontWeight: '500' }}>
              {ing}
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.65rem', color: '#444', fontStyle: 'italic' }}>No data provided</span>
        )
      )}
    </div>
  </div>

  <div style={styles.priceContainer}>
    {!item.priceHalf ? (
      <div style={styles.priceRow}>
        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: primaryColor }}>
          ₹{item.priceFull || item.price}
        </div>
        {cart[item._id] ? (
          <div style={styles.counterRowSmall}>
            <button type="button" onClick={() => removeFromCart(item._id)} style={styles.qtyBtnSmall}>-</button>
            <span style={{ fontSize: '0.8rem' }}>{cart[item._id]}</span>
            <button type="button" onClick={() => addToCart(item, 'Single')} style={styles.qtyBtnSmall}>+</button>
          </div>
        ) : (
          <button type="button" onClick={() => addToCart(item, 'Single')} style={styles.addBtnSmall}>{t[language].add}</button>
        )}
      </div>
    ) : (
      <>
        <div style={styles.priceRow}>
          <span style={styles.priceLabel}>
            {t[language].half}: <span style={{ color: primaryColor }}>
              ₹{item.priceHalf}
            </span>
          </span>
          {cart[`${item._id}-Half`] ? (
            <div style={styles.counterRowSmall}>
              <button type="button" onClick={() => removeFromCart(`${item._id}-Half`)} style={styles.qtyBtnSmall}>-</button>
              <span>{cart[`${item._id}-Half`]}</span>
              <button type="button" onClick={() => addToCart(item, 'Half')} style={styles.qtyBtnSmall}>+</button>
            </div>
          ) : (
            <button type="button" onClick={() => addToCart(item, 'Half')} style={styles.addBtnSmall}>{t[language].addHalf}</button>
          )}
        </div>
        <div style={styles.priceRow}>
          <span style={styles.priceLabel}>
            {t[language].full}: <span style={{ color: primaryColor }}>
              ₹{item.priceFull || item.price}
            </span>
          </span>
          {cart[`${item._id}-Full`] ? (
            <div style={styles.counterRowSmall}>
              <button type="button" onClick={() => removeFromCart(`${item._id}-Full`)} style={styles.qtyBtnSmall}>-</button>
              <span>{cart[`${item._id}-Full`]}</span>
              <button type="button" onClick={() => addToCart(item, 'Full')} style={styles.qtyBtnSmall}>+</button>
            </div>
          ) : (
            <button type="button" onClick={() => addToCart(item, 'Full')} style={styles.addBtnSmall}>{t[language].addFull}</button>
          )}
        </div>
      </>
    )}
  </div>
               </div>
                <button type="button" style={{...styles.view3dBtn, background: primaryColor}} onClick={() => setActiveModel(item)}>{t[language].view3d}</button>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>


{/* ── ORDER STATUS BANNER — tap to expand tracking panel ── */}
{hasPlacedInitialOrder && !isCounterScan && Object.keys(liveOrderStatuses).length > 0 && (() => {
  const statuses = Object.values(liveOrderStatuses);
  const hasReady  = statuses.some(s => s === 'ready');
  const hasPending = statuses.some(s => s === 'pending');
  const allServed  = statuses.every(s => s === 'served');
  const activeStatus = hasReady ? 'ready' : hasPending ? 'pending' : 'served';

  const statusMeta = {
    pending: { label: language === 'mr' ? 'किचनमध्ये बनत आहे' : 'In the kitchen', sub: language === 'mr' ? 'थोडा वेळ लागेल' : 'Being prepared now', icon: <Flame size={14} color="#d3bfa2" strokeWidth={1.5} />, pulse: true },
    ready:   { label: language === 'mr' ? 'तयार आहे!' : 'Ready!', sub: language === 'mr' ? 'कृपया घ्या' : 'Please collect your order', icon: <CheckCircle2 size={14} color="#ecd9b0" strokeWidth={2} />, pulse: true },
    served:  { label: language === 'mr' ? 'सर्व्ह केले' : 'All served', sub: language === 'mr' ? 'आनंद घ्या!' : 'Enjoy your meal!', icon: <Sparkles size={14} color="#d3bfa2" strokeWidth={1.5} />, pulse: false },
  };
  const meta = statusMeta[activeStatus];

  return (
    <>
      {modifyOrderStrip}
      {/* STICKY BANNER */}
      <motion.div
        onClick={() => setOrderTrackingPanelOpen(true)}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.985 }}
        style={{
          // Sticky to the bottom of the screen, level with the floating action buttons on the right.
          position: 'fixed', left: '14px', right: '104px',
          bottom: 'calc(30px + env(safe-area-inset-bottom, 0px))', zIndex: 1000,
          background: hasReady
            ? 'linear-gradient(135deg, rgba(48,41,29,0.96), rgba(18,16,12,0.97))'
            : 'linear-gradient(135deg, rgba(26,24,21,0.95), rgba(12,12,12,0.96))',
          border: `1px solid ${hasReady ? 'rgba(236,217,176,0.45)' : 'rgba(211,191,162,0.18)'}`,
          boxShadow: hasReady
            ? '0 10px 30px rgba(0,0,0,0.55), 0 0 22px rgba(236,217,176,0.16)'
            : '0 10px 28px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderRadius: '20px', overflow: 'hidden', cursor: 'pointer'
        }}
      >
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Pulse dot or icon */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: hasReady ? 'rgba(236,217,176,0.1)' : 'rgba(211,191,162,0.06)',
              border: `1px solid ${hasReady ? 'rgba(236,217,176,0.2)' : 'rgba(211,191,162,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {meta.icon}
            </div>
            {meta.pulse && (
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '10px',
                  border: '1px solid rgba(211,191,162,0.35)', pointerEvents: 'none'
                }}
              />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '900', color: hasReady ? '#ecd9b0' : '#d3bfa2', marginBottom: '2px' }}>
              {meta.label}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.52)', fontWeight: '500' }}>
              {meta.sub}
            </div>
          </div>

          {/* Progress mini bar */}
<div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'5px', flexShrink:0, minWidth:'70px' }}>
  {hasPending && orderEta?.etaMinutes ? (
    <>
      <div style={{ width:'100%', height:'4px', background:'rgba(255,255,255,0.07)', borderRadius:'2px', overflow:'hidden' }}>
        <motion.div
          animate={{ width:`${prepPct}%` }}
          transition={{ duration:1, ease:'easeOut' }}
          style={{
            height:'100%', borderRadius:'2px',
            background:'linear-gradient(90deg,rgba(211,191,162,0.3),rgba(211,191,162,0.7))'
          }}
        />
      </div>
      <div style={{ fontSize:'0.5rem', color:'rgba(211,191,162,0.35)', fontWeight:'700', fontFamily:'monospace' }}>
        {prepPct}% · ~{Math.max(0, orderEta.etaMinutes - (orderPlacedAt ? Math.round((Date.now()-orderPlacedAt)/60000) : 0))}m left
      </div>
    </>
  ) : (
    <div style={{ display:'flex', gap:'3px' }}>
      {['pending','ready','served'].map((s,i) => {
        const stepIdx = ['pending','ready','served'].indexOf(activeStatus);
        return (
          <div key={s} style={{
            width:i<=stepIdx?'14px':'5px', height:'5px', borderRadius:'2.5px', transition:'all 0.4s',
            background:i<=stepIdx?(s==='ready'||activeStatus==='ready'?'rgba(236,217,176,0.7)':'rgba(211,191,162,0.5)'):'rgba(255,255,255,0.07)'
          }}/>
        );
      })}
    </div>
  )}
  <div style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.2)', fontWeight:'700', letterSpacing:'0.3px' }}>
    {language==='mr'?'तपशील पहा':'View details'}
  </div>
</div>
        </div>
      </motion.div>

      {/* keeps the last content clear of the sticky bar */}
      <div aria-hidden="true" style={{ height: '110px' }} />
      {/* ── FULL TRACKING PANEL (slide up) ── */}
      <AnimatePresence>
        {orderTrackingPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 7500,
              background: 'rgba(0,0,0,0.88)',
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'center', padding: '0 0 20px',
              fontFamily: 'Poppins, sans-serif'
            }}
            onClick={() => setOrderTrackingPanelOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '440px',
                background: '#0c0c0c',
                border: '1px solid rgba(211,191,162,0.12)',
                borderRadius: '24px 24px 18px 18px',
                overflow: 'hidden', margin: '0 14px'
              }}
            >
              <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(211,191,162,0.5),transparent)' }} />

              {/* Panel header */}
              <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid rgba(211,191,162,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                    {language === 'mr' ? 'ऑर्डर स्थिती' : 'Order Tracking'}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <MapPin size={12} color="rgba(211,191,162,0.5)" strokeWidth={1.5} />
                    {language === 'mr' ? `टेबल ${tableNumber}` : `Table ${tableNumber}`}
                  </div>
                </div>
                <button type="button" onClick={() => setOrderTrackingPanelOpen(false)} style={{
                  width: '30px', height: '30px', borderRadius: '9px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <X size={14} />
                </button>
              </div>

              {/* PIPELINE VISUAL */}
              <div style={{ padding: '20px 18px' }}>
                {/* 3-step timeline */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', position: 'relative' }}>
                  {/* Connecting line behind */}
                  <div style={{ position: 'absolute', top: '18px', left: '10%', right: '10%', height: '1px', background: 'rgba(255,255,255,0.06)', zIndex: 0 }} />
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: activeStatus === 'pending' ? '15%' : activeStatus === 'ready' ? '55%' : '80%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ position: 'absolute', top: '18px', left: '10%', height: '1px', background: 'linear-gradient(90deg,#c9a84c,rgba(211,191,162,0.4))', zIndex: 0 }}
                  />

                  {[
                    { key: 'pending', label: language === 'mr' ? 'ऑर्डर\nमिळाली' : 'Order\nReceived',  icon: <ReceiptText size={16} strokeWidth={1.5} /> },
                    { key: 'pending', label: language === 'mr' ? 'किचनमध्ये\nबनत आहे' : 'In the\nKitchen', icon: <Flame size={16} strokeWidth={1.5} /> },
                    { key: 'ready',   label: language === 'mr' ? 'तयार /\nसर्व्ह' : 'Ready /\nServed',  icon: <CheckCircle2 size={16} strokeWidth={1.5} /> },
                  ].map((step, i) => {
                    const stepIdx = ['pending','ready','served'].indexOf(activeStatus);
                    const reached = i <= stepIdx || (i === 1 && ['pending','ready','served'].includes(activeStatus));
                    const isActive = (i === 0 && activeStatus === 'pending') || (i === 1 && activeStatus === 'pending') || (i === 2 && (activeStatus === 'ready' || activeStatus === 'served'));
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                        <motion.div
                          animate={isActive && activeStatus === 'pending' && i === 1 ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                          style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: reached
                              ? (activeStatus === 'ready' && i === 2 ? 'rgba(211,191,162,0.25)' : 'rgba(211,191,162,0.1)')
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${reached
                              ? (activeStatus === 'ready' && i === 2 ? 'rgba(236,217,176,0.35)' : 'rgba(211,191,162,0.25)')
                              : 'rgba(255,255,255,0.07)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: reached
                              ? (activeStatus === 'ready' && i === 2 ? '#ecd9b0' : '#d3bfa2')
                              : 'rgba(255,255,255,0.15)',
                            transition: 'all 0.4s'
                          }}
                        >
                          {step.icon}
                        </motion.div>
                        <div style={{
                          fontSize: '0.54rem', fontWeight: '700', textAlign: 'center', lineHeight: 1.4,
                          color: reached ? (activeStatus === 'ready' && i === 2 ? '#ecd9b0' : 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.15)',
                          whiteSpace: 'pre-line', transition: 'all 0.4s'
                        }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* INDIVIDUAL ORDER ROWS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {Object.entries(liveOrderStatuses).map(([orderId, status], idx) => {
                    const stepIdx = ['pending','ready','served'].indexOf(status);
                    const statusColor = { pending: '#8a704d', ready: '#ecd9b0', served: '#555' };
                    const statusIcon  = {
                      pending: <Flame size={11} color="#8a704d" strokeWidth={1.5} />,
                      ready:   <CheckCircle2 size={11} color="#ecd9b0" strokeWidth={2} />,
                      served:  <Sparkles size={11} color="#555" strokeWidth={1.5} />
                    };
                    const statusLabel = {
                      pending: language === 'mr' ? 'बनत आहे' : 'Preparing',
                      ready:   language === 'mr' ? 'तयार आहे!' : 'Ready!',
                      served:  language === 'mr' ? 'सर्व्ह केले' : 'Served'
                    };
                    return (
                      <div key={orderId} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 13px',
                        background: status === 'ready' ? 'rgba(211,191,162,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${status === 'ready' ? 'rgba(236,217,176,0.15)' : 'rgba(211,191,162,0.07)'}`,
                        borderRadius: '11px', transition: 'all 0.3s'
                      }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.56rem', fontWeight: '900', color: 'rgba(255,255,255,0.52)', fontFamily: 'monospace'
                        }}>
                          #{idx + 1}
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {statusIcon[status]}
                          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: statusColor[status] || '#555' }}>
                            {statusLabel[status]}
                          </span>
                        </div>
                        {/* Mini progress */}
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {['pending','ready','served'].map((s, i) => (
                            <div key={s} style={{
                              width: i <= stepIdx ? '12px' : '4px', height: '4px', borderRadius: '2px',
                              background: i <= stepIdx
                                ? (s === 'ready' ? 'rgba(236,217,176,0.6)' : 'rgba(211,191,162,0.45)')
                                : 'rgba(255,255,255,0.07)',
                              transition: 'all 0.4s'
                            }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* EST TIME note */}
{/* DYNAMIC ETA */}
{orderEta && Object.values(liveOrderStatuses).some(s => s === 'pending') ? (
  <div style={{
    padding:'12px 14px',
    background:'rgba(211,191,162,0.04)', border:'1px solid rgba(211,191,162,0.1)',
    borderRadius:'11px', textAlign:'center'
  }}>
    <div style={{ color:'rgba(211,191,162,0.35)', fontSize:'0.5rem',
      letterSpacing:'2px', fontWeight:'900', marginBottom:'5px' }}>ESTIMATED ARRIVAL</div>
    <div style={{ color:'#d3bfa2', fontSize:'1.5rem', fontWeight:'900', letterSpacing:'-0.5px' }}>
      {orderEta.etaTime}
    </div>
    <div style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.62rem', marginTop:'3px' }}>
      ~{orderEta.etaMinutes} min · {orderEta.queueLength} order{orderEta.queueLength!==1?'s':''} in kitchen
    </div>
    {orderEta.currentItems?.length > 0 && (
      <div style={{ color:'rgba(255,255,255,0.15)', fontSize:'0.6rem', marginTop:'7px' }}>
        Chef is preparing: {orderEta.currentItems.join(', ')}
      </div>
    )}
  </div>
) : (
  <div style={{
    display:'flex', alignItems:'center', gap:'9px',
    padding:'10px 13px',
    background:'rgba(211,191,162,0.03)', border:'1px solid rgba(211,191,162,0.07)',
    borderRadius:'11px'
  }}>
    <Timer size={13} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />
    <p style={{ margin:0, fontSize:'0.65rem', color:'rgba(255,255,255,0.2)', lineHeight:1.6, fontWeight:'500' }}>
      {activeStatus === 'ready'
        ? (language==='mr' ? 'तुमची ऑर्डर टेबलवर येत आहे.' : 'Your order is on its way to your table.')
        : activeStatus === 'served'
        ? (language==='mr' ? 'आनंद घ्या!' : 'Enjoy your meal!')
        : (language==='mr' ? 'सामान्यत: १५–२५ मिनिटे लागतात.' : 'Typically ready in 15–25 minutes.')}
    </p>
  </div>
)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
})()}
      {/* FABs RIGHT SIDE */}
{/* FABs RIGHT SIDE */}
<div style={styles.rightFabContainer}>
  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.92 }} style={{...styles.fabBase, background: 'linear-gradient(160deg, rgba(40,36,28,0.92), rgba(18,17,15,0.94))', border: '1px solid rgba(211,191,162,0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 0 0 4px rgba(211,191,162,0.06), inset 0 1px 0 rgba(255,255,255,0.08)'}} onClick={() => setIsWaiterModalOpen(true)}>
    <SpoonForkIcon size={24} color="#d3bfa2" strokeWidth={1.8} />
  </motion.div>

  {/* EXTRA ITEMS FAB */}
  {extraItems.filter(i => i.isAvailable).length > 0 && (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      whileTap={{ scale: 0.92 }} style={{...styles.fabBase, background: 'linear-gradient(160deg, rgba(40,36,28,0.92), rgba(18,17,15,0.94))', border: '1px solid rgba(211,191,162,0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 0 0 4px rgba(211,191,162,0.06), inset 0 1px 0 rgba(255,255,255,0.08)'}}
      onClick={() => { setIsExtraItemsOpen(true); setExtraItemCart({}); setActiveExtraCategory('All'); setExtraItemSearchQuery(''); }}
    >
      <ShoppingBag size={22} color="#d3bfa2" strokeWidth={1.8} />
    </motion.div>
  )}

  {(totalItemsInCart > 0 || hasPlacedInitialOrder) && (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.92 }} style={{...styles.fabBase, background: PX.gold, boxShadow: '0 14px 32px rgba(211,191,162,0.38), 0 0 0 4px rgba(211,191,162,0.12), inset 0 1px 0 rgba(255,255,255,0.55)'}} onClick={() => setIsDrawerOpen(true)}>
      <Utensils size={24} color="#14110c" strokeWidth={2.2} />
      {totalItemsInCart > 0 && <span style={styles.fabBadge}>{convertToMrNumber(totalItemsInCart)}</span>}
    </motion.div>
  )}
</div>

      {/* WAITER MODAL */}
      <AnimatePresence>
        {isWaiterModalOpen && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ ...styles.fullscreenModal, isolation: 'isolate' }}>
            <div className="px-ambient" style={{ zIndex: -1 }} aria-hidden="true"><div className="px-grain" /></div>
            <div style={{ ...styles.modalHeader, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: PX.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px rgba(211,191,162,0.25)' }}>
                  <SpoonForkIcon size={22} color="#14110c" strokeWidth={2} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontFamily: PX.serif, fontSize: '1.4rem', fontWeight: 700, color: '#f7f3eb', textAlign: 'left', lineHeight: 1.1 }}>{t[language].callWaiter}</h2>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(211,191,162,0.62)', marginTop: 5, fontWeight: 600 }}>
                    {language === 'mr' ? 'आम्ही तुमच्या टेबलवर आणतो' : "We'll bring it right to your table"}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setIsWaiterModalOpen(false)} aria-label="Close"
                style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${PX.line}`, color: '#d3bfa2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalScrollBody}>
              <div style={styles.waiterCardGrid}>
                {['spoon', 'fork', 'plates', 'tissue'].map((id, i) => {
                  const n = waiterCounts[id] || 0;
                  return (
                    <motion.div key={id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                      style={{ ...styles.waiterCountCard, borderColor: n > 0 ? 'rgba(211,191,162,0.5)' : 'rgba(211,191,162,0.14)', boxShadow: n > 0 ? '0 0 0 4px rgba(211,191,162,0.07), ' + PX.shadow : PX.shadow }}>
                      <div style={{ width: 46, height: 46, borderRadius: 15, background: 'rgba(211,191,162,0.09)', border: `1px solid ${PX.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d3bfa2' }}>
                        {id === 'spoon' && <Utensils size={21} strokeWidth={1.7} />}
                        {id === 'fork' && <UtensilsCrossed size={21} strokeWidth={1.7} />}
                        {id === 'plates' && <Layers size={21} strokeWidth={1.7} />}
                        {id === 'tissue' && <Box size={21} strokeWidth={1.7} />}
                      </div>
                      <p style={styles.waiterLabel}>{t[language][id]}</p>
                      <div style={styles.countControls}>
                        <button type="button" aria-label="Less" style={styles.countBtn} onClick={() => updateWaiterCount(id, -1)}><Minus size={15} /></button>
                        <span style={styles.countDisplay}>{convertToMrNumber(n)}</span>
                        <button type="button" aria-label="More" style={{ ...styles.countBtn, background: PX.gold, color: '#14110c' }} onClick={() => updateWaiterCount(id, 1)}><Plus size={15} /></button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div style={{ padding: '0 22px', maxWidth: 480, margin: '0 auto' }}>
                <button type="button" style={styles.waiterActionRow} onClick={() => notifyWaiter(t.en.clean)}>
                  <span style={styles.waiterActionIcon}><Trash2 size={18} color="#d3bfa2" strokeWidth={1.7} /></span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{t[language].clean}</span>
                  <ChevronRight size={16} color="rgba(211,191,162,0.5)" />
                </button>
                <button type="button" style={styles.waiterActionRow} onClick={() => notifyWaiter(t.en.other)}>
                  <span style={styles.waiterActionIcon}><HelpCircle size={18} color="#d3bfa2" strokeWidth={1.7} /></span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{t[language].other}</span>
                  <ChevronRight size={16} color="rgba(211,191,162,0.5)" />
                </button>
                <button type="button" className="px-gold" style={{ ...styles.kitchenBtn, marginTop: 14, borderRadius: 20, fontSize: '0.86rem', letterSpacing: '0.6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'Poppins, sans-serif' }} onClick={() => notifyWaiter("Custom")}>
                  <SpoonForkIcon size={16} strokeWidth={2.2} /> {t[language].sendRequest}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


{/* EXTRA ITEMS MODAL */}
<AnimatePresence>
  {isExtraItemsOpen && (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      style={{ ...styles.fullscreenModal, zIndex: 5200, background: '#060608', display: 'flex', flexDirection: 'column' }}
    >

      {/* TOP GOLD SHIMMER */}
      <div style={{
        height: '2px', flexShrink: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.15) 20%, rgba(201,168,76,0.7) 50%, rgba(201,168,76,0.15) 80%, transparent 100%)'
      }}/>

      {/* ── HEADER ── */}
      <div style={{
        padding: '16px 18px 14px',
        background: 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(201,168,76,0.08)',
        flexShrink: 0, position: 'relative', overflow: 'hidden'
      }}>
        {/* ambient glow top-right */}
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '160px', height: '100px',
          background: 'radial-gradient(ellipse at top right, rgba(201,168,76,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}/>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Icon tile */}
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))',
              border: '1px solid rgba(201,168,76,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(201,168,76,0.12)'
            }}>
              <ShoppingBag size={20} color="#c9a84c" strokeWidth={1.6}/>
            </div>
            <div>
              <div style={{
                fontSize: '0.42rem', fontWeight: '900', letterSpacing: '2.5px',
                color: 'rgba(201,168,76,0.45)', textTransform: 'uppercase', marginBottom: '3px'
              }}>
                {language === 'mr' ? 'काउंटरवरून मागवा' : 'ORDER FROM COUNTER'}
              </div>
              <h2 style={{
                color: '#d3bfa2', margin: 0,
                fontSize: '1.08rem', fontWeight: '900', letterSpacing: '-0.2px', lineHeight: 1
              }}>
                {language === 'mr' ? 'अतिरिक्त वस्तू' : 'Extra Items'}
              </h2>
              <p style={{
                color: 'rgba(211,191,162,0.62)', fontSize: '0.56rem',
                margin: '4px 0 0', fontWeight: '700', letterSpacing: '0.4px',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(201,168,76,0.35)', display: 'inline-block', flexShrink: 0 }}/>
                {language === 'mr' ? 'थंड पेये · आईस्क्रीम · स्नॅक्स' : 'COLD DRINKS · ICE CREAM · SNACKS & MORE'}
              </p>
            </div>
          </div>

          {/* Cart summary chip — appears when items added */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Object.keys(extraItemCart).length > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 11px',
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: '20px'
                }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#c9a84c,#bda88a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5rem', fontWeight: '900', color: '#000'
                }}>
                  {Object.values(extraItemCart).reduce((a, b) => a + b, 0)}
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: '900', color: '#c9a84c', fontFamily: 'monospace' }}>
                  ₹{Object.entries(extraItemCart).reduce((acc, [id, qty]) => {
                    const item = extraItems.find(i => i._id === id);
                    return acc + (item?.price || 0) * qty;
                  }, 0).toLocaleString()}
                </span>
              </motion.div>
            )}

            {/* Close button */}
            <button type="button"
              onClick={() => {
                setIsExtraItemsOpen(false);
                setExtraItemCart({});
                setExtraItemSearchQuery('');
                setActiveExtraCategory('All');
              }}
              style={{
                width: '36px', height: '36px', borderRadius: '11px', flexShrink: 0,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.52)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(211,191,162,0.3)';
                e.currentTarget.style.color = '#d3bfa2';
                e.currentTarget.style.background = 'rgba(211,191,162,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <X size={15}/>
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ padding: '13px 16px 8px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(211,191,162,0.04)',
          border: '1px solid rgba(211,191,162,0.1)',
          borderRadius: '14px', padding: '11px 14px', gap: '10px',
          transition: 'border-color 0.2s'
        }}>
          <Search size={15} color="rgba(201,168,76,0.4)" strokeWidth={1.8}/>
          <input
            type="text"
            placeholder={language === 'mr' ? 'वस्तू शोधा...' : 'Search drinks, ice cream, snacks...'}
            value={extraItemSearchQuery}
            onChange={e => setExtraItemSearchQuery(e.target.value)}
            style={{
              background: 'none', border: 'none', color: '#fff',
              outline: 'none', fontSize: '0.84rem', width: '100%',
              fontFamily: 'Poppins, sans-serif'
            }}
          />
          {extraItemSearchQuery.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setExtraItemSearchQuery('')}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px', color: 'rgba(211,191,162,0.62)', cursor: 'pointer',
                padding: '3px 7px', display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '0.52rem', fontWeight: '800', flexShrink: 0
              }}
            >
              <X size={10}/> CLEAR
            </motion.button>
          )}
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      {(() => {
        const cats = ['All', ...new Set(extraItems.filter(i => i.isAvailable).map(i => i.category))];
        const catMeta = {
          'All':             { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>, mr: 'सर्व' },
          'Cold Drinks':     { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 2h8l-1 8H9L8 2z"/><path d="M9 10c0 5 6 5 6 10H9c0-5 6-5 6-10"/><path d="M7 22h10"/></svg>, mr: 'थंड पेये' },
          'Ice Cream':       { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 22l4-9H8l4 9z"/><circle cx="12" cy="8" r="5"/></svg>, mr: 'आईस्क्रीम' },
          'Packaged Snacks': { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>, mr: 'स्नॅक्स' },
          'Juices':          { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>, mr: 'ज्यूस' },
          'Mineral Water':   { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>, mr: 'पाणी' },
          'Dairy':           { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 2h8l1 10H7L8 2z"/><path d="M7 12v8a2 2 0 002 2h6a2 2 0 002-2v-8"/></svg>, mr: 'दुग्धजन्य' },
          'Sweets':          { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3"/></svg>, mr: 'मिठाई' },
          'Tobacco':         { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="2" y1="12" x2="22" y2="12"/><path d="M20 8c0-2-1-4-4-4s-4 2-4 4"/></svg>, mr: 'तंबाखू' },
          'Other':           { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>, mr: 'इतर' },
        };
        return (
          <div style={{ overflowX: 'auto', flexShrink: 0 }} className="no-scrollbar">
            <div style={{ display: 'flex', gap: '7px', padding: '2px 16px 12px', minWidth: 'max-content' }}>
              {cats.map(cat => {
                const isActive = activeExtraCategory === cat;
                const meta = catMeta[cat] || catMeta['Other'];
                return (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setActiveExtraCategory(cat)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '7px 13px', borderRadius: '20px', border: 'none',
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      fontSize: '0.62rem', fontWeight: '900', letterSpacing: '0.3px',
                      background: isActive
                        ? 'linear-gradient(135deg, #c9a84c 0%, #bda88a 100%)'
                        : 'rgba(211,191,162,0.05)',
                      color: isActive ? '#0c0c0c' : 'rgba(211,191,162,0.38)',
                      outline: isActive ? 'none' : '1px solid rgba(211,191,162,0.1)',
                      boxShadow: isActive ? '0 4px 16px rgba(201,168,76,0.25)' : 'none',
                      transition: 'all 0.18s',
                    }}
                  >
                    <span style={{ color: isActive ? '#0c0c0c' : 'rgba(211,191,162,0.38)', display: 'flex', flexShrink: 0 }}>
                      {meta.svg}
                    </span>
                    {cat === 'All'
                      ? (language === 'mr' ? meta.mr : 'All')
                      : (language === 'mr' ? (meta.mr || cat) : cat)}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── ITEMS LIST (scrollable body) ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '0' }} className="no-scrollbar">
        {(() => {
          const categoryIconMap = {
            'Cold Drinks':    { icon: GlassWater,  color: '#c9a84c' },
            'Ice Cream':      { icon: IceCream2,   color: '#d3bfa2' },
            'Packaged Snacks':{ icon: Cookie,      color: '#c9a84c' },
            'Juices':         { icon: Apple,       color: '#bda88a' },
            'Mineral Water':  { icon: Droplets,    color: '#d3bfa2' },
            'Dairy':          { icon: Milk,        color: '#e0d8cc' },
            'Sweets':         { icon: Candy,       color: '#c9a84c' },
            'Coffee':         { icon: Coffee,      color: '#bda88a' },
            'Snacks':         { icon: Sandwich,    color: '#c9a84c' },
            'Beverages':      { icon: Wind,        color: '#d3bfa2' },
            'Other':          { icon: Box,         color: '#8a7060' },
          };
          const getCatMeta = (cat) => categoryIconMap[cat] || { icon: Box, color: '#8a7060' };

          const filtered = extraItems.filter(i => {
            if (!i.isAvailable) return false;
            const matchCat = activeExtraCategory === 'All' || i.category === activeExtraCategory;
            const matchSearch = i.name.toLowerCase().includes(extraItemSearchQuery.toLowerCase());
            return matchCat && matchSearch;
          });

          if (filtered.length === 0) return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 24px', gap: '14px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto',
                background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Package size={28} color="rgba(201,168,76,0.2)" strokeWidth={1.4}/>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'rgba(255,255,255,0.52)', marginBottom: '5px', textAlign: 'center' }}>
                  {language === 'mr' ? 'कोणतीही वस्तू सापडली नाही' : 'No items found'}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.52)', fontWeight: '600', textAlign: 'center' }}>
                  {extraItemSearchQuery
                    ? (language === 'mr' ? 'वेगळा शब्द वापरा' : `No results for "${extraItemSearchQuery}"`)
                    : (language === 'mr' ? 'वेगळी श्रेणी निवडा' : 'Try a different category')}
                </div>
              </div>
              {extraItemSearchQuery && (
                <button type="button" onClick={() => setExtraItemSearchQuery('')}
                  style={{ padding: '8px 18px', borderRadius: '20px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: '#c9a84c', fontSize: '0.65rem', fontWeight: '900', cursor: 'pointer' }}>
                  CLEAR SEARCH
                </button>
              )}
            </div>
          );

          // Group by category
          const grouped = {};
          filtered.forEach(item => {
            const cat = item.category || 'Other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
          });

          return (
            <div style={{ padding: '4px 14px 180px' }}>
              {Object.entries(grouped).map(([cat, items]) => {
                const meta = getCatMeta(cat);
                const CatIcon = meta.icon;
                return (
                  <div key={cat} style={{ marginBottom: '28px' }}>

                    {/* ── Category header ── */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '9px',
                      marginBottom: '12px', padding: '0 2px'
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0,
                        background: 'rgba(201,168,76,0.07)',
                        border: '1px solid rgba(201,168,76,0.16)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CatIcon size={13} color="#c9a84c" strokeWidth={1.7}/>
                      </div>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: '900',
                        color: 'rgba(201,168,76,0.5)',
                        letterSpacing: '2px', textTransform: 'uppercase'
                      }}>
                        {language === 'mr'
                          ? ({'Cold Drinks':'थंड पेये','Ice Cream':'आईस्क्रीम','Packaged Snacks':'पॅकेज्ड स्नॅक्स','Juices':'ज्यूस','Mineral Water':'मिनरल वॉटर','Dairy':'दुग्धजन्य','Sweets':'मिठाई','Coffee':'कॉफी','Snacks':'स्नॅक्स','Other':'इतर'}[cat] || cat)
                          : cat}
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(201,168,76,0.1), transparent)' }}/>
                      <span style={{
                        fontSize: '0.48rem', fontWeight: '900',
                        color: 'rgba(211,191,162,0.62)', letterSpacing: '0.8px'
                      }}>
                        {items.length} {language === 'mr' ? 'वस्तू' : 'items'}
                      </span>
                    </div>

                    {/* ── Item cards ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map((item, idx) => {
                        const qty = extraItemCart[item._id] || 0;
                        const threshold = item.lowStockThreshold ?? 5;
                        const isLow = item.currentStock > 0 && item.currentStock <= threshold;
                        const isOut = item.currentStock <= 0;
                        const ItemIcon = getCatMeta(item.category).icon;
                        const stockRemaining = item.currentStock - qty;
                        const almostGone = stockRemaining > 0 && stockRemaining <= 3;

                        return (
                          <motion.div
                            key={item._id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: isOut ? 0.32 : 1, y: 0 }}
                            transition={{ delay: idx * 0.035, type: 'spring', damping: 24 }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              background: qty > 0
                                ? 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.04) 100%)'
                                : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${
                                qty > 0
                                  ? 'rgba(201,168,76,0.25)'
                                  : isLow
                                    ? 'rgba(201,168,76,0.1)'
                                    : 'rgba(211,191,162,0.06)'}`,
                              borderRadius: '16px',
                              padding: '12px 13px',
                              position: 'relative', overflow: 'hidden',
                              transition: 'all 0.22s ease',
                              cursor: isOut ? 'default' : 'pointer'
                            }}
                            onClick={() => {
                              if (isOut) return;
                              if (qty === 0) setExtraItemCart(prev => ({ ...prev, [item._id]: 1 }));
                            }}
                          >
                            {/* Selected shimmer line */}
                            {qty > 0 && (
                              <div style={{
                                position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                                background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)',
                                pointerEvents: 'none'
                              }}/>
                            )}

                            {/* Left glow when selected */}
                            {qty > 0 && (
                              <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                                background: 'linear-gradient(180deg, transparent, rgba(201,168,76,0.6), transparent)',
                                borderRadius: '16px 0 0 16px',
                                pointerEvents: 'none'
                              }}/>
                            )}

                            {/* Icon */}
                            <div style={{
                              width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
                              background: qty > 0
                                ? 'rgba(201,168,76,0.12)'
                                : isOut
                                  ? 'rgba(255,255,255,0.02)'
                                  : 'rgba(211,191,162,0.04)',
                              border: `1px solid ${
                                qty > 0
                                  ? 'rgba(201,168,76,0.28)'
                                  : isOut
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgba(211,191,162,0.08)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.22s'
                            }}>
                              <ItemIcon
                                size={19}
                                color={qty > 0 ? '#c9a84c' : isOut ? 'rgba(211,191,162,0.15)' : 'rgba(211,191,162,0.3)'}
                                strokeWidth={1.5}
                              />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '0.88rem', fontWeight: '700',
                                color: qty > 0 ? '#fff' : isOut ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
                                marginBottom: '4px', lineHeight: 1.2,
                                transition: 'color 0.2s',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {item.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: '0.86rem', fontWeight: '900',
                                  color: qty > 0 ? '#c9a84c' : 'rgba(201,168,76,0.6)',
                                  fontFamily: 'monospace', transition: 'color 0.2s'
                                }}>
                                  ₹{item.price}
                                </span>
                                <span style={{
                                  fontSize: '0.5rem', color: 'rgba(255,255,255,0.52)',
                                  fontWeight: '700'
                                }}>
                                  / {item.unit}
                                </span>

                                {/* OUT OF STOCK badge */}
                                {isOut && (
                                  <span style={{
                                    fontSize: '0.48rem', padding: '2px 7px',
                                    background: 'rgba(211,191,162,0.04)',
                                    color: 'rgba(211,191,162,0.62)',
                                    borderRadius: '5px', fontWeight: '900',
                                    border: '1px solid rgba(211,191,162,0.1)',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {language === 'mr' ? 'उपलब्ध नाही' : 'SOLD OUT'}
                                  </span>
                                )}

                                {/* LOW STOCK badge */}
                                {isLow && !isOut && (
                                  <span style={{
                                    fontSize: '0.48rem', padding: '2px 7px',
                                    background: 'rgba(201,168,76,0.07)',
                                    color: '#c9a84c',
                                    borderRadius: '5px', fontWeight: '900',
                                    border: '1px solid rgba(201,168,76,0.18)',
                                    letterSpacing: '0.3px',
                                    display: 'inline-flex', alignItems: 'center', gap: '3px'
                                  }}>
                                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    {language === 'mr' ? `${item.currentStock} शिल्लक` : `${item.currentStock} left`}
                                  </span>
                                )}

                                {/* Almost gone warning when in cart */}
                                {almostGone && qty > 0 && (
                                  <motion.span
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{
                                      fontSize: '0.46rem', padding: '2px 6px',
                                      background: 'rgba(255,140,0,0.08)',
                                      color: 'rgba(255,140,0,0.8)',
                                      borderRadius: '4px', fontWeight: '900',
                                      border: '1px solid rgba(255,140,0,0.15)'
                                    }}>
                                    {language === 'mr' ? `फक्त ${stockRemaining} शिल्लक` : `only ${stockRemaining} more`}
                                  </motion.span>
                                )}
                              </div>
                            </div>

                            {/* ── ADD / QUANTITY CONTROLS ── */}
                            {isOut ? (
                              <div style={{
                                fontSize: '0.5rem', color: 'rgba(211,191,162,0.62)',
                                fontWeight: '900', letterSpacing: '0.5px',
                                textAlign: 'center', minWidth: '58px'
                              }}>
                                {language === 'mr' ? 'नाही' : 'N/A'}
                              </div>
                            ) : qty === 0 ? (
                              <motion.button
                                whileTap={{ scale: 0.91 }}
                                onClick={e => {
                                  e.stopPropagation();
                                  setExtraItemCart(prev => ({ ...prev, [item._id]: 1 }));
                                }}
                                style={{
                                  padding: '9px 15px', borderRadius: '11px',
                                  border: '1px solid rgba(201,168,76,0.28)',
                                  background: 'rgba(201,168,76,0.06)',
                                  color: '#c9a84c',
                                  fontWeight: '900', fontSize: '0.68rem',
                                  cursor: 'pointer', flexShrink: 0,
                                  letterSpacing: '0.5px',
                                  transition: 'all 0.15s',
                                  fontFamily: 'Poppins, sans-serif',
                                  display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'rgba(201,168,76,0.13)';
                                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
                                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.28)';
                                }}
                              >
                                <Plus size={12} strokeWidth={2.5}/>
                                {language === 'mr' ? 'निवडा' : 'ADD'}
                              </motion.button>
                            ) : (
                              <motion.div
                                initial={{ scale: 0.82, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  display: 'flex', alignItems: 'center',
                                  background: 'rgba(201,168,76,0.09)',
                                  border: '1px solid rgba(201,168,76,0.25)',
                                  borderRadius: '12px', overflow: 'hidden', flexShrink: 0
                                }}
                              >
                                {/* Minus */}
                                <motion.button
                                  whileTap={{ scale: 0.88 }}
                                  onClick={() => setExtraItemCart(prev => {
                                    const n = { ...prev };
                                    if (n[item._id] <= 1) delete n[item._id];
                                    else n[item._id] -= 1;
                                    return n;
                                  })}
                                  style={{
                                    width: '36px', height: '36px', background: 'transparent',
                                    border: 'none', color: '#c9a84c', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.12s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.12)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <Minus size={14} strokeWidth={2.5}/>
                                </motion.button>

                                {/* Count */}
                                <div style={{
                                  minWidth: '30px', textAlign: 'center',
                                  fontSize: '0.92rem', fontWeight: '900',
                                  color: '#fff', fontFamily: 'monospace',
                                  borderLeft: '1px solid rgba(201,168,76,0.15)',
                                  borderRight: '1px solid rgba(201,168,76,0.15)',
                                  lineHeight: '36px', height: '36px', padding: '0 4px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <motion.span
                                    key={qty}
                                    initial={{ scale: 1.3 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 20 }}
                                  >
                                    {qty}
                                  </motion.span>
                                </div>

                                {/* Plus */}
                                <motion.button
                                  whileTap={{ scale: 0.88 }}
                                  onClick={() => {
                                    const current = extraItemCart[item._id] || 0;
                                    if (Number.isFinite(Number(item.currentStock)) && item.currentStock !== null && current >= item.currentStock) return;
                                    setExtraItemCart(prev => ({ ...prev, [item._id]: current + 1 }));
                                  }}
                                  style={{
                                    width: '36px', height: '36px', background: 'transparent',
                                    border: 'none',
                                    color: qty >= item.currentStock ? 'rgba(201,168,76,0.2)' : '#c9a84c',
                                    cursor: qty >= item.currentStock ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.12s'
                                  }}
                                  onMouseEnter={e => { if (qty < item.currentStock) e.currentTarget.style.background = 'rgba(201,168,76,0.12)'; }}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <Plus size={14} strokeWidth={2.5}/>
                                </motion.button>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── STICKY CART FOOTER ── */}
      <AnimatePresence>
        {Object.keys(extraItemCart).length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '16px 16px 40px',
              background: 'linear-gradient(to top, #060608 60%, rgba(6,6,8,0.96) 80%, transparent 100%)',
              backdropFilter: 'blur(16px)',
              flexShrink: 0
            }}
          >
            {/* Selected items preview strip */}
            <div style={{
              display: 'flex', gap: '6px', marginBottom: '12px',
              overflowX: 'auto', paddingBottom: '2px'
            }} className="no-scrollbar">
              {Object.entries(extraItemCart).map(([id, qty]) => {
                const item = extraItems.find(i => i._id === id);
                if (!item) return null;
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '4px 9px',
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.18)',
                    borderRadius: '20px', flexShrink: 0
                  }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: '900', color: '#c9a84c', fontFamily: 'monospace' }}>×{qty}</span>
                    <span style={{ fontSize: '0.58rem', fontWeight: '700', color: 'rgba(211,191,162,0.7)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <button type="button"
                      onClick={() => setExtraItemCart(prev => { const n = { ...prev }; delete n[id]; return n; })}
                      style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,0.4)', cursor: 'pointer', padding: '0', display: 'flex', marginLeft: '2px' }}>
                      <X size={10}/>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Summary row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '12px', padding: '10px 14px',
              background: 'rgba(201,168,76,0.05)',
              border: '1px solid rgba(201,168,76,0.12)',
              borderRadius: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))',
                  border: '1px solid rgba(201,168,76,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: '900', color: '#c9a84c', fontFamily: 'monospace'
                }}>
                  {Object.values(extraItemCart).reduce((a, b) => a + b, 0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.55)' }}>
                    {Object.keys(extraItemCart).length} {language === 'mr' ? 'प्रकार' : 'type'}{Object.keys(extraItemCart).length > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700', letterSpacing: '0.5px' }}>
                    {language === 'mr' ? 'निवडल्या' : 'SELECTED'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '1.08rem', fontWeight: '900',
                  color: '#c9a84c', fontFamily: 'monospace', letterSpacing: '-0.5px'
                }}>
                  ₹{Object.entries(extraItemCart).reduce((acc, [id, qty]) => {
                    const item = extraItems.find(i => i._id === id);
                    return acc + (item?.price || 0) * qty;
                  }, 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.52)', fontWeight: '800', letterSpacing: '0.8px' }}>
                  {language === 'mr' ? 'अंदाजे रक्कम' : 'ESTIMATED TOTAL'}
                </div>
              </div>
            </div>

            {/* CTA button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={sendExtraItemsRequest}
              style={{
                width: '100%', padding: '16px',
                background: 'linear-gradient(135deg, #c9a84c 0%, #bda88a 100%)',
                border: 'none', borderRadius: '15px',
                color: '#0c0c0c', fontWeight: '900', fontSize: '0.9rem',
                cursor: 'pointer', letterSpacing: '0.3px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 8px 32px rgba(201,168,76,0.28), 0 2px 8px rgba(0,0,0,0.4)',
                fontFamily: 'Poppins, sans-serif',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Shimmer sweep */}
              <motion.div
                animate={{ x: ['-100%', '250%'] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', repeatDelay: 1.2 }}
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: '50px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                  pointerEvents: 'none'
                }}
              />
              <SpoonForkIcon size={17} color="#0c0c0c" strokeWidth={2.2}/>
              {language === 'mr' ? 'वेटरला विनंती पाठवा' : 'REQUEST TO WAITER'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c0c0c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )}
</AnimatePresence>

{/* CHECKOUT / BILL SUMMARY PAGE */}
      <AnimatePresence>
        {isBillOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{...styles.fullscreenModal, zIndex: 6000}}>
            <div style={styles.modalHeader}>
              <h2 style={{color: primaryColor}}>{t[language].checkout}</h2>
<X size={30} color={primaryColor} onClick={() => { 
  setIsBillOpen(false); 
  setBillRequested(false); 
  setApprovedCustomerBill(null);
  setShowReviewPage(false);
  // ── Reset everything for next customer ──
  setPlacedOrders([]);
  setHasPlacedInitialOrder(false);
  setCart({});
  setSuggestions({});setRecommendedDishes([]);
  setCustomerInfo({ name: '', phone: '' });
  resetCredit();
  try {
    localStorage.removeItem(`pratyeksha_placed_${tenantId}_${tableNumber}`);
    localStorage.removeItem(`pratyeksha_cart_${tenantId}_${tableNumber}`);
  } catch { /* storage unavailable */ }
}} />            </div>
            
            <div style={styles.modalScrollBody}>
{!billRequested ? (
  <div style={{ padding: '14px 22px 40px', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 26 }}>
      <div style={{ width: 64, height: 64, borderRadius: 22, margin: '0 auto 16px', background: PX.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 36px rgba(211,191,162,0.25), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
        <ReceiptText size={28} color="#14110c" strokeWidth={1.8} />
      </div>
      <h3 style={{ fontFamily: PX.serif, fontSize: '1.55rem', fontWeight: 700, color: '#f7f3eb', margin: '0 0 8px', textAlign: 'center' }}>
        {language === 'mr' ? 'जवळजवळ झाले' : 'Almost done'}
      </h3>
      <p style={{ ...styles.instructionText, margin: 0 }}>
        {savedCustomer && !identityEditing
          ? (language === 'mr' ? 'तुमचे बिल तयार करूया.' : "Let's get your bill ready.")
          : t[language].enterDetails}
      </p>
    </motion.div>

    <GuestIdentityBlock
      language={language}
      info={customerInfo}
      locked={!!savedCustomer && !identityEditing}
      onForget={forgetGuestIdentity}
      onName={name => { customerInfoDraftRef.current = { ...customerInfoDraftRef.current, name }; setIdentityEditing(true); setCustomerInfo(prev => ({ ...prev, name })); }}
      onPhone={digits => { setIdentityEditing(true); setCustomerInfo(prev => ({ ...prev, phone: digits })); }}
    />

    <div style={{ marginBottom: 18 }}>
      <ConsentCheck checked={guestConsent} onChange={toggleGuestConsent} onOpen={openLegal} language={language} tenantName={restaurantData?.name || 'the restaurant'} />
    </div>

    {(() => {
      const ready = customerInfo.name.trim() && customerInfo.phone.length === 10 && guestConsent;
      return (
        <button type="button" className="px-gold" disabled={!ready} onClick={requestFinalBill}
          style={{ width: '100%', padding: '18px', borderRadius: 20, fontWeight: 900, fontSize: '0.88rem', letterSpacing: '0.6px', textTransform: 'uppercase', cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'Poppins, sans-serif' }}>
          <ReceiptText size={17} strokeWidth={2.2} />
          {t[language].generateBill}
          <ChevronRight size={16} />
        </button>
      );
    })()}
    <GuestLegalLinks language={language} onOpen={openLegal} style={{ marginTop: 18 }} />
  </div>

              ) : !approvedCustomerBill ? (
                <div style={{ minHeight:'55vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'32px 24px', color:'#f7f3eb' }}>
                  <div style={{ width:76, height:76, borderRadius:26, display:'grid', placeItems:'center', background:'rgba(211,191,162,.12)', border:'1px solid rgba(211,191,162,.35)', marginBottom:22 }}><ReceiptText size={34} color={PX.gold}/></div>
                  <h2 style={{ fontFamily:PX.serif, fontSize:'1.7rem', margin:'0 0 10px' }}>Your bill is being prepared</h2>
                  <p style={{ maxWidth:320, color:'#c9bba9', lineHeight:1.7, margin:0 }}>The team is reviewing your order and applying any eligible offers. Your final bill will appear here once the operator sends it.</p>
                  <div style={{ marginTop:22, fontSize:'.7rem', letterSpacing:2, color:PX.gold, textTransform:'uppercase' }}>Table {tableNumber} · Awaiting approval</div>
                </div>
              ) : !showReviewPage ? (
                <div style={styles.thankYouWrapperProfessional}>
                   <div style={styles.statusIconWrapper}><CheckCircle2 size={50} color={primaryColor} /></div>
                   <h2 style={styles.professionalTitle}>{t[language].thankYou}</h2>
                   <p style={styles.professionalSubtitle}>{t[language].receiptSent}</p>
                   
                   {/* 📱 ON-SCREEN UI: KEEPS YOUR ORIGINAL DESIGN COMPLETELY UNTOUCHED */}
                   <div style={styles.billBriefCard}>
                      <div style={styles.billBriefHeader}><ReceiptText size={18} /> {t[language].billSummary}</div>
                      
                      <div style={styles.billTableHead}>
                         <span style={{flex: 2, textAlign: 'left'}}>Item</span>
                         <span style={{flex: 0.5, textAlign: 'center'}}>{t[language].qty}</span>
                         <span style={{flex: 1, textAlign: 'right'}}>{t[language].amt}</span>
                      </div>
                      
                      {/* 🚀 FIXED: Maps over the aggregated finalBillItems instead of the raw placedOrders */}
<div style={styles.billTableBody}>
  {(approvedCustomerBill.items || finalBillItems).map((order, idx) => (
    <div key={idx} style={{ ...styles.billTableRow, flexDirection: 'column', alignItems: 'flex-start', gap: '3px', paddingBottom: '10px', borderBottom: '1px solid rgba(211,191,162,0.07)', marginBottom: '4px' }}>
      {/* Row 1: Dish name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
          {language === 'mr' ? (order.name_mr || order.name) : order.name}
          {order.portion && order.portion !== 'Single' && (
            <span style={{ fontSize: '0.62rem', color: primaryColor, marginLeft: '6px', fontWeight: '700' }}>({order.portion})</span>
          )}
          {order.isExtraItem && (
            <span style={{ fontSize: '0.48rem', padding: '2px 5px', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.15)', borderRadius: '4px', color: '#8a704d', fontWeight: '900', letterSpacing: '0.5px', marginLeft: '6px' }}>EXTRA</span>
          )}
        </span>
      </div>
      {/* Row 2: Rate × qty → total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '0.68rem', color: 'rgba(211,191,162,0.62)', fontWeight: '600' }}>
          ₹{convertToMrNumber(order.pricePerUnit)} × {order.quantity}
        </span>
        <span style={{ fontSize: '0.9rem', fontWeight: '900', color: primaryColor }}>
          ₹{convertToMrNumber(order.subtotal)}
        </span>
      </div>
    </div>
  ))}
</div>


{/* Replace existing billTableFooter with this: */}
<div style={styles.billTableFooter}>
  {(() => {
    const rd = restaurantData;
    const cgstPct = rd?.config?.cgstPercentage ?? 2.5;
    const sgstPct = rd?.config?.sgstPercentage ?? 2.5;
    const subtotal = Number(approvedCustomerBill.subtotal ?? finalBillItems.reduce((s, i) => s + (i.subtotal || 0), 0));
    const cgstAmt = Number(approvedCustomerBill.cgst ?? subtotal * (cgstPct / 100));
    const sgstAmt = Number(approvedCustomerBill.sgst ?? subtotal * (sgstPct / 100));
    const grandTotal = Number(approvedCustomerBill.total ?? (subtotal + cgstAmt + sgstAmt));
    const approvedDiscount = Number(approvedCustomerBill.discountAmount || 0);
    return (
      <>
<div style={{ ...styles.billLine, fontSize: '0.78rem', color: '#666' }}>
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ ...styles.billLine, fontSize: '0.78rem', color: '#888' }}>
          <span>CGST @ {cgstPct}%</span>
          <span>₹{cgstAmt.toFixed(2)}</span>
        </div>
        <div style={{ ...styles.billLine, fontSize: '0.78rem', color: '#888', marginBottom: '12px' }}>
          <span>SGST @ {sgstPct}%</span>
          <span>₹{sgstAmt.toFixed(2)}</span>
        </div>
        {approvedDiscount > 0 && <div style={{ ...styles.billLine, fontSize: '0.78rem', color: '#b9d2a0', marginBottom: '12px' }}><span>Approved discount{approvedCustomerBill.discountReason ? ` · ${approvedCustomerBill.discountReason}` : ''}</span><span>−₹{approvedDiscount.toFixed(2)}</span></div>}
<div style={styles.billLineTotal}>
          <span>{t[language].grandTotal}</span>
          <span style={{ color: primaryColor, fontSize: '1.2rem' }}>
            ₹{Number.isInteger(Math.round(grandTotal * 100) / 100) ? Math.round(grandTotal * 100) / 100 : (Math.round(grandTotal * 100) / 100).toFixed(2)}
          </span>
        </div>
      </>
    );
  })()}
</div>
                   </div>

                   {/* ========================================================================= */}
                   {/* 📥 PRINT DOM ENGINE ROOT: AUTO-SIZED & SHIFTED FOR PERFECT 1-PAGE A4 CENTERING */}
                   {/* ========================================================================= */}
                {/* 📥 PRINT DOM ENGINE ROOT: UPDATED WITH AGGREGATED finalBillItems */}
<div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
  <div id="pdf-rendering-frame" style={{ width: '210mm', display: 'flex', justifyContent: 'center', background: '#ffffff', padding: '15mm 0' }}>
    {receiptData && (
      <div id="customer-pdf-invoice" style={{ background: '#ffffff', color: '#000000', padding: '40px 25px', width: '420px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* 1. Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h4 style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#888' }}>TAX INVOICE</h4>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '8px 0', color:"black" }}>{restaurantData?.name || 'Restaurant'}</h1>
          <p style={{ fontSize: '0.7rem', color: '#333', margin: 0 }}>{restaurantData?.address?.street}, {restaurantData?.address?.city}</p>
<p style={{ fontSize: '0.75rem', fontWeight: '800', marginTop: '4px' }}>GSTIN: {restaurantData?.gstin || "GSTIN PENDING"}</p>
          <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '2px' }}>SAC Code: 996331 · GST Rate: {(Number((restaurantData?.config?.cgstPercentage ?? 2.5)) + Number((restaurantData?.config?.sgstPercentage ?? 2.5))).toFixed(1)}% (CGST {(restaurantData?.config?.cgstPercentage ?? 2.5)}% + SGST {(restaurantData?.config?.sgstPercentage ?? 2.5)}%)</p>        </div>

        {/* 2. Bill & Customer Meta Info */}
        <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '10px 0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div><div style={{ fontSize: '0.65rem', color: '#666' }}>BILL NO.</div><div style={{ fontWeight: '900' }}>#{receiptData.billNo}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.8rem', fontWeight: '800' }}>{receiptData.date}</div><div style={{ fontSize: '0.75rem' }}>{receiptData.time}</div></div>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
            <div>Customer: {customerInfo.name || "N/A"}</div>
            <div>Phone: {customerInfo.phone || "N/A"}</div>
            <div>Table: {tableNumber}</div>
          </div>
        </div>

      {/* 3. Aggregated Items (Using finalBillItems for grouping) */}
<div style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: '900', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
     <span>ITEM DESCRIPTION</span>
     <span>TOTAL</span>
  </div>
{finalBillItems.map((order, idx) => (
  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>
        {convertToMrNumber(order.quantity)}x {language === 'mr' ? (order.name_mr || order.name) : order.name}
        {order.isExtraItem ? ' ⬦' : ''}
      </span>
      <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px', fontWeight: '500' }}>
        @ ₹{convertToMrNumber(order.pricePerUnit)} / item
        {order.portion !== 'Single' ? ` (${order.portion})` : ''}
        {order.isExtraItem ? ' · Extra Item' : ''}
      </span>
    </div>
    <b style={{ fontSize: '0.9rem', fontWeight: '900' }}>₹{convertToMrNumber(order.subtotal)}</b>
  </div>
))}
{finalBillItems.some(i => i.isExtraItem) && (
  <div style={{ fontSize: '0.62rem', color: '#999', marginTop: '8px', fontStyle: 'italic' }}>
    ⬦ Extra items ordered separately at counter
  </div>
)}
</div>

{/* 4. Tax & Grand Total Block (To match your uploaded invoice style) */}
{/* Items are priced ex-tax and GST is added on top (same as the bill table, the invoice PDF and the server). This block
    used to treat the item sum as tax-INCLUSIVE, so it showed a smaller subtotal and a grand total with no tax at all. */}
{(() => {
  const cgstPct = restaurantData?.config?.cgstPercentage ?? 2.5;
  const sgstPct = restaurantData?.config?.sgstPercentage ?? 2.5;
  const r2 = (n) => Math.round(n * 100) / 100;
  const sub = r2(calculateGrandTotal());
  const cgstAmt = r2(sub * (cgstPct / 100));
  const sgstAmt = r2(sub * (sgstPct / 100));
  const grand = r2(sub + cgstAmt + sgstAmt);
  return (
    <>
      <div style={{ padding: '15px 0', fontSize: '0.85rem', color: '#000000', borderBottom: '2px solid #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Subtotal</span><span>₹{sub.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>CGST ({cgstPct}%)</span><span>₹{cgstAmt.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST ({sgstPct}%)</span><span>₹{sgstAmt.toFixed(2)}</span></div>
      </div>

      <div style={{ marginTop: '15px', fontWeight: '900', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>GRAND TOTAL</span>
        <span>₹{convertToMrNumber(Number.isInteger(grand) ? grand : grand.toFixed(2))}</span>
      </div>
    </>
  );
})()}
{/* 6. Branding Footer */}
        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.6rem', fontWeight: '900', color: '#888', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
          <img src={PRATYEKSHAA_LOGO} alt="Pratyeksha" style={{ width:130, height:'auto', background:'#f7f3eb', borderRadius:6, padding:'3px 6px' }} />
        </div>
      
      </div>
    )}
  </div>
</div>

                   {/* PAY WITH UPI — opens the guest's UPI app with the exact bill amount */}
                   <div style={{ width: '100%', padding: '0 10px', margin: '0 0 16px', boxSizing: 'border-box' }}>
                     <UpiPay amount={payableAmount} payInfo={payInfo} note={`Bill T${tableNumber}`} language={language}
                       tenantId={tenantId} tableNumber={tableNumber} guestName={customerInfo.name}
                       claimed={!!lastBill?.claimed} onClaimed={onUpiClaimed} />
                   </div>

                   {/* INTERACTIVE CONTROLS CONTAINER ROW */}
                   <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 10px' }}>

                     {/* WHITE — Download Invoice */}
                     <button type="button"
                       onClick={() => autoDownloadInvoicePDF()}
                       style={{
                         width: '100%', padding: '18px', borderRadius: '15px',
                         background: '#ffffff',
                         color: '#0c0c0c', fontWeight: '900', border: '1px solid #e0e0e0',
                         cursor: 'pointer', fontSize: '0.88rem',
                         letterSpacing: '0.5px', textTransform: 'uppercase',
                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                         boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
                       }}
                     >
                       <ReceiptText size={18} color="#0c0c0c" strokeWidth={2.5} />
                       DOWNLOAD TAX INVOICE
                     </button>

                     {/* GOLD — Continue to Feedback */}
                     <button type="button"
                       style={{
                         ...styles.professionalContinueBtn,
                         background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
                         boxShadow: '0 8px 24px rgba(211,191,162,0.2)'
                       }}
                       onClick={() => setShowReviewPage(true)}
                     >
                       {t[language].continue} <ChevronRight size={18} />
                     </button>

                   </div>
                   <GuestLegalLinks language={language} onOpen={openLegal} style={{ marginTop: 22 }} />
                </div>
) : (
  <div style={{
    padding: '0 0 60px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100%'
  }}>

    {/* ── HERO SECTION ── */}
    <div style={{ width: '100%', padding: '56px 28px 34px', textAlign: 'center', position: 'relative' }}>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        style={{ position: 'relative', width: '92px', height: '92px', margin: '0 auto 24px' }}
      >
        <div style={{ position: 'absolute', inset: '-14px', borderRadius: '50%', border: '1px dashed rgba(211,191,162,0.28)', animation: 'pxOrbit 22s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '30px', background: PX.gold, boxShadow: '0 18px 44px rgba(211,191,162,0.28), inset 0 1px 0 rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={38} color="#14110c" strokeWidth={1.6} />
        </div>
      </motion.div>

      <div className="px-rise" style={{ fontSize: '0.56rem', fontWeight: 800, letterSpacing: '4px', color: 'rgba(211,191,162,0.7)', textTransform: 'uppercase', marginBottom: '12px' }}>
        {restaurantData?.name}
      </div>
      <h2 className="px-rise" style={{ fontFamily: PX.serif, fontSize: '2.15rem', fontWeight: 700, color: '#f7f3eb', textAlign: 'center', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.15, animationDelay: '.08s' }}>
        {t[language].visitAgain}
      </h2>
      <div className="px-rise" style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '14px', animationDelay: '.14s' }}>
        {[0,1,2,3,4].map(i => (
          <motion.span key={i} initial={{ opacity: 0, y: 6, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.25 + i * 0.09, type: 'spring', stiffness: 220, damping: 14 }} style={{ display: 'inline-flex' }}>
            <Star size={16} color="#d3bfa2" fill="#d3bfa2" strokeWidth={1.4} />
          </motion.span>
        ))}
      </div>
      <p className="px-rise" style={{ color: 'rgba(247,243,235,0.58)', fontSize: '0.8rem', lineHeight: 1.7, maxWidth: '270px', margin: '0 auto', fontWeight: 500, animationDelay: '.2s' }}>
        {language === 'mr'
          ? 'तुमच्या भेटीबद्दल आभार! पुन्हा भेटू लवकरच.'
          : 'Thank you for dining with us. We hope to see you again soon!'}
      </p>
    </div>

    {/* ── ACTION CARDS ── */}
    <div style={{ width: '100%', maxWidth: '400px', padding: '6px 22px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Google Review */}
      {restaurantData?.googleReview && (
        <motion.a href={restaurantData.googleReview} target="_blank" rel="noreferrer"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 18 }}
          whileTap={{ scale: 0.97 }} whileHover={{ y: -3 }}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', background: PX.card, border: `1px solid ${PX.line}`, borderRadius: '22px', boxShadow: PX.shadow, position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 20px rgba(0,0,0,0.35)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f7f3eb', marginBottom: '3px' }}>{t[language].rateGoogle}</div>
            <div style={{ fontSize: '0.64rem', color: 'rgba(247,243,235,0.5)', fontWeight: 600 }}>
              {language === 'mr' ? 'तुमचा अनुभव शेअर करा' : 'Share your experience'}
            </div>
          </div>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(211,191,162,0.12)', border: `1px solid ${PX.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ChevronRight size={16} color="#d3bfa2" />
          </div>
        </motion.a>
      )}

      {/* Instagram */}
      {(restaurantData?.instagram || restaurantData?.instaId) && (
        <motion.a href={restaurantData.instagram || restaurantData.instaId} target="_blank" rel="noreferrer"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 18 }}
          whileTap={{ scale: 0.97 }} whileHover={{ y: -3 }}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', background: PX.card, border: `1px solid ${PX.line}`, borderRadius: '22px', boxShadow: PX.shadow, position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 20px rgba(131,58,180,0.35)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f7f3eb', marginBottom: '3px' }}>
              {language === 'mr' ? 'इन्स्टाग्रामवर फॉलो करा' : 'Follow us on Instagram'}
            </div>
            <div style={{ fontSize: '0.64rem', color: 'rgba(247,243,235,0.5)', fontWeight: 600 }}>
              {language === 'mr' ? 'नवीन पदार्थ व ऑफर्स मिळवा' : 'Stay updated with our latest dishes'}
            </div>
          </div>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(211,191,162,0.12)', border: `1px solid ${PX.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ChevronRight size={16} color="#d3bfa2" />
          </div>
        </motion.a>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(211,191,162,0.08)', margin: '4px 0' }} />
{/* Close billing */}
      <button type="button"
        style={{
          width: '100%', padding: '17px',
          background: 'rgba(211,191,162,0.07)',
          border: '1px solid rgba(211,191,162,0.22)',
          color: '#d3bfa2', borderRadius: '18px',
          fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer',
          letterSpacing: '0.5px', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(211,191,162,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(211,191,162,0.07)'; }}
        onClick={() => { setIsBillOpen(false); }}
      >
        <X size={15} strokeWidth={2.5} />
        {language === 'mr' ? 'बंद करा' : 'Close'}
      </button>

      <GuestLegalLinks language={language} onOpen={openLegal} style={{ marginTop: 4 }} />
      {/* Powered by */}
      <div style={{ textAlign: 'center', paddingTop: '8px' }}>
        <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.52)', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
          <img src={PRATYEKSHAA_LOGO} alt="Pratyeksha" style={{ width:130, height:'auto', background:'#f7f3eb', borderRadius:6, padding:'3px 6px' }} />
        </span>
      </div>
    </div>
  </div>
)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* CART DRAWER */}
<AnimatePresence>
  {isDrawerOpen && ( 
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={styles.sideDrawer}>
      <div style={styles.drawerHeader}>
        <h2 style={{color: primaryColor}}>{t[language].roundOrder}</h2>
        <X size={30} color={primaryColor} onClick={() => setIsDrawerOpen(false)} />
      </div>

      <div style={styles.drawerContent}>
        {cartStockWarning && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', marginBottom: '14px', borderRadius: '12px', background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.3)' }}>
            <AlertCircle size={16} color="#BA7517" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#BA7517' }}>
                {language === 'mr'
                  ? `"${cartStockWarning.itemName}" आता उपलब्ध नाही`
                  : `"${cartStockWarning.itemName}" just went out of stock`}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(186,117,23,0.75)', marginTop: '2px' }}>
                {language === 'mr' ? 'कृपया ते कार्टमधून काढा.' : 'Please remove it before placing your order.'}
              </div>
            </div>
            <X size={14} color="rgba(186,117,23,0.6)" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setCartStockWarning(null)} />
          </div>
        )}
        {totalItemsInCart > 0 ? (
          Object.entries(cart).map(([key, qty]) => { 
            const isMulti = key.includes('-'); 
            const id = isMulti ? key.split('-')[0] : key; 
            const portion = isMulti ? key.split('-')[1] : ''; 
            const item = allMenuItems.find(i => i._id === id);
            if (!item) return null;
            const isNowUnavailable = item.isAvailable === false;

            return (
              <div key={key} style={{...styles.drawerItemBlock, borderBottom: `1px solid ${borderColor}`, ...(isNowUnavailable ? { background: 'rgba(186,117,23,0.05)', borderRadius: '10px', border: '1px solid rgba(186,117,23,0.2)', padding: '8px' } : {})}}>
                {isNowUnavailable && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.56rem', fontWeight: '800', color: '#BA7517', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    <AlertCircle size={11} /> {language === 'mr' ? 'उपलब्ध नाही' : 'Out of stock'}
                  </div>
                )}
                {/* ── NAME + PORTION + REMOVE ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: '600', color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {language === 'mr' ? item?.name_mr : item?.name}
                    </p>
                    {portion && (
                      <small style={{ color: primaryColor, fontSize: '0.62rem', fontWeight: '700' }}>
                        {t[language][portion.toLowerCase()] || portion}
                      </small>
                    )}
                  </div>

                  {/* Remove button — X icon, gold dim */}
                  <button type="button"
                    onClick={() => {
                      setCart(prev => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                      setSuggestions(prev => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                    style={{
                      background: 'none', border: 'none',
                      color: 'rgba(211,191,162,0.62)',
                      cursor: 'pointer', padding: '4px',
                      display: 'flex', alignItems: 'center',
                      flexShrink: 0, marginLeft: '10px',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(211,191,162,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(211,191,162,0.62)'}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* ── QTY STEPPER ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '10px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: 'rgba(211,191,162,0.05)',
                    border: '1px solid rgba(211,191,162,0.15)',
                    borderRadius: '10px', overflow: 'hidden'
                  }}>
                    {/* MINUS */}
                    <button type="button"
                      onClick={() => {
                        if (qty <= 1) {
                          setCart(prev => { const n = {...prev}; delete n[key]; return n; });
                          setSuggestions(prev => { const n = {...prev}; delete n[key]; return n; });
                        } else {
                          setCart(prev => ({ ...prev, [key]: prev[key] - 1 }));
                        }
                      }}
                      style={{
                        width: '34px', height: '34px',
                        background: 'transparent', border: 'none',
                        color: 'rgba(211,191,162,0.6)',
                        cursor: 'pointer', fontWeight: '900',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#d3bfa2'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(211,191,162,0.6)'}
                    >
                      <Minus size={15} />
                    </button>

                    {/* COUNT */}
                    <div style={{
                      minWidth: '30px', textAlign: 'center',
                      fontSize: '0.9rem', fontWeight: '900',
                      color: '#fff', fontFamily: 'monospace',
                      borderLeft:  '1px solid rgba(211,191,162,0.1)',
                      borderRight: '1px solid rgba(211,191,162,0.1)',
                      lineHeight: '34px', height: '34px',
                      padding: '0 6px'
                    }}>
                      {convertToMrNumber(qty)}
                    </div>

                    {/* PLUS */}
                    <button type="button"
                      onClick={() => setCart(prev => ({ ...prev, [key]: prev[key] + 1 }))}
                      style={{
                        width: '34px', height: '34px',
                        background: 'transparent', border: 'none',
                        color: 'rgba(211,191,162,0.6)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#d3bfa2'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(211,191,162,0.6)'}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                {/* ── SPECIAL INSTRUCTIONS ── */}
                <div style={styles.suggestionInputWrapper}>
                  <StickyNote size={14} style={{ color: primaryColor, opacity: 0.7 }} />
                  <input
                    type="text"
                    placeholder={t[language].notes}
                    style={styles.suggestionInput}
                    value={suggestions[key] || ""}
                    onChange={e => setSuggestions(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>

              </div>
            );
          })
        ) : (
          <p style={{ textAlign: 'center', color: '#555', marginTop: '40px' }}>
            {t[language].emptyRound}
          </p>
        )}
      </div>

      <div style={styles.drawerFooter}>
{showComboStrip && comboSuggestions.length > 0 && (
  <motion.div
    initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
    exit={{ opacity:0, height:0 }}
    style={{ margin:'0 0 12px', overflow:'hidden' }}
  >
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
      <div style={{ fontSize:'0.54rem', fontWeight:800, color:'rgba(211,191,162,0.78)', letterSpacing:'2px', display:'flex', alignItems:'center', gap:'6px', textTransform:'uppercase' }}>
        <Sparkles size={11} color="#d3bfa2" strokeWidth={1.6}/>
        {language==='mr' ? 'यांसोबत छान लागेल' : 'Goes well with your order'}
      </div>
      <button type="button" aria-label="Hide suggestions" onClick={() => setShowComboStrip(false)} style={{ background:'none', border:'none', color:'rgba(247,243,235,0.35)', cursor:'pointer', padding:2, display:'flex' }}>
        <X size={13}/>
      </button>
    </div>
    <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'4px' }} className="no-scrollbar">
      {comboSuggestions.map(item => {
        // Same rules as the dish cards: a dish with a half price is added as Half; every other dish is a single portion whose
        // cart key is the bare id and whose price is priceFull || price. It used to add a "Half" line (at the single price)
        // for Full-only dishes and a `${id}-Single` key for plain dishes, which the menu card then showed as a second line.
        const portion = item.priceHalf ? 'Half' : 'Single';
        const price = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
        const key = portion === 'Single' ? String(item._id) : `${item._id}-${portion}`;
        const inCart = cart[key] > 0;
        const nm = language === 'mr' ? (item.name_mr || item.name) : item.name;
        return (
          <motion.button key={item._id} type="button" whileTap={{ scale:0.95 }}
            onClick={() => {
              if (inCart) return;
              setCart(prev => ({ ...prev, [key]: 1 }));
              triggerAlert(language==='mr' ? `${nm} जोडले` : `${nm} added`, 'success');
            }}
            style={{
              flexShrink:0, padding:'11px 12px 11px 14px', borderRadius:'18px', cursor: inCart ? 'default' : 'pointer',
              background: inCart ? 'rgba(211,191,162,0.14)' : PX.card,
              border:`1px solid ${inCart ? 'rgba(211,191,162,0.45)' : PX.line}`,
              boxShadow: inCart ? 'none' : '0 10px 24px rgba(0,0,0,0.3)',
              display:'flex', alignItems:'center', gap:'10px',
              minWidth:'150px', maxWidth:'190px', fontFamily:'Poppins, sans-serif', textAlign:'left'
            }}
          >
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color: inCart ? '#d3bfa2' : '#f7f3eb', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nm}</div>
              <div style={{ fontSize:'0.66rem', fontWeight:800, color:'rgba(211,191,162,0.8)', marginTop:'3px' }}>₹{convertToMrNumber(price)}</div>
            </div>
            <span style={{ width:'28px', height:'28px', borderRadius:'10px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: inCart ? 'transparent' : PX.gold, color:'#14110c' }}>
              {inCart ? <CheckCircle2 size={17} color="#d3bfa2" /> : <Plus size={15} strokeWidth={2.6} />}
            </span>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
)}

    {cartUnavailableCheck.length > 0 && (
  <motion.div
    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
    style={{
      margin:'0 16px 10px', padding:'10px 14px', borderRadius:'12px',
      background:'rgba(186,117,23,0.08)', border:'1px solid rgba(186,117,23,0.25)',
      borderLeft:'3px solid rgba(186,117,23,0.6)',
      display:'flex', alignItems:'flex-start', gap:'10px'
    }}
  >
    <AlertTriangle size={14} color="#BA7517" strokeWidth={1.8} style={{ flexShrink:0, marginTop:'1px' }}/>
    <div>
      <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#BA7517', marginBottom:'2px' }}>
        {language==='mr' ? 'काही वस्तू आता उपलब्ध नाहीत' : 'Some items are no longer available'}
      </div>
      <div style={{ fontSize:'0.58rem', color:'rgba(186,117,23,0.7)', lineHeight:1.4 }}>
        {cartUnavailableCheck.join(', ')} — {language==='mr' ? 'कृपया काढा' : 'please remove before ordering'}
      </div>
    </div>
  </motion.div>
)}

        {modifyingOrderId && (
          <div style={{ margin: '0 0 10px', padding: '9px 12px', borderRadius: '12px', border: '1px solid rgba(201,150,90,0.4)', background: 'rgba(201,150,90,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontSize: '0.6rem', color: '#e6c08f', fontWeight: 800, lineHeight: 1.35 }}>
              {language === 'mr' ? 'ऑर्डर बदलत आहात' : 'Editing your placed order'} · {modifyClock}
              <br /><span style={{ fontWeight: 600, opacity: 0.8 }}>{language === 'mr' ? 'शेफला "बदललेला ऑर्डर" असे दिसेल' : 'The chef will see it tagged as REPLACED'}</span>
            </span>
            <button type="button" onClick={cancelModifyEdit} style={{ background: 'transparent', border: '1px solid rgba(230,192,143,0.5)', color: '#e6c08f', borderRadius: '8px', padding: '6px 10px', fontSize: '0.55rem', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {language === 'mr' ? 'रद्द करा' : 'KEEP ORIGINAL'}
            </button>
          </div>
        )}
        {totalItemsInCart > 0 && (
<button type="button"
  style={{
    ...styles.kitchenBtn,
    background: isPlacingOrder ? '#555' : PX.gold,
    borderRadius: '20px', letterSpacing: '0.6px', textTransform: 'uppercase', boxShadow: '0 12px 30px rgba(211,191,162,0.22)',
    opacity: isPlacingOrder ? 0.6 : 1,
    pointerEvents: isPlacingOrder ? 'none' : 'auto'
  }}
  disabled={isPlacingOrder}
  onClick={
    isCounterScan
      ? counterMode === 'reservation' ? placeReservation : placeWaitlistOrder
      : sendBatchToKitchen
  }
>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              {isCounterScan && <CheckCircle2 size={16} />}
              {isCounterScan
                ? counterMode === 'dine-in'
                  ? (language === 'mr' ? 'रांगेत ऑर्डर द्या' : 'PLACE WAITLIST ORDER')
                  : counterMode === 'reservation'
                  ? (language === 'mr' ? 'बुकिंग कन्फर्म करा' : 'CONFIRM RESERVATION')
                  : (language === 'mr' ? 'पिकअप ऑर्डर द्या' : 'PLACE PICKUP ORDER')
                : modifyingOrderId
                  ? (language === 'mr' ? 'ऑर्डर अपडेट करा' : 'UPDATE ORDER')
                  : t[language].orderNow}
            </span>
          </button>
        )}
        {!isCounterScan && (
          <button type="button"
            style={styles.billLinkBtn}
            onClick={() => { setIsDrawerOpen(false); setIsBillOpen(true); }}
          >
            {t[language].viewFinalBill}
          </button>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>

      <AnimatePresence>

{activeModel && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22 }}
    style={styles.modalOverlay}
  >
 
    {/* ══════════ STICKY NAV BAR ══════════ */}
    <div style={styles.modalNav}>
      <div style={{ minWidth: 0, flex: 1 }}>
 
        <h2 style={{ ...styles.modalTitle, color: primaryColor }}>
          {language === 'mr'
            ? (activeModel.name_mr || activeModel.name)
            : activeModel.name}
        </h2>
 
        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
 
          {/* Veg / Non-veg */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(211,191,162,0.15)', background: 'rgba(211,191,162,0.05)' }}>
            <Leaf size={9} color="rgba(211,191,162,0.5)" strokeWidth={2} />
            <span style={{ fontSize: '0.47rem', fontWeight: '800', color: 'rgba(211,191,162,0.62)', letterSpacing: '0.5px' }}>
              {activeModel.isVeg !== false ? 'VEG' : 'NON-VEG'}
            </span>
          </div>
 
          {/* Bestseller */}
          {(activeModel.isBestSeller || activeModel._eng?.quadrant === 'star') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(211,191,162,0.2)', background: 'rgba(211,191,162,0.07)' }}>
              <Tag size={9} color="#d3bfa2" strokeWidth={2} />
              <span style={{ fontSize: '0.47rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '0.5px' }}>BESTSELLER</span>
            </div>
          )}
 
          {/* Chef Special */}
          {activeModel.isChefSpecial && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(211,191,162,0.18)', background: 'rgba(211,191,162,0.06)' }}>
              <Utensils size={9} color="#d3bfa2" strokeWidth={2} />
              <span style={{ fontSize: '0.47rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '0.5px' }}>CHEF SPECIAL</span>
            </div>
          )}
 
          {/* Spice */}
          {activeModel.spicylevel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
              <Flame size={9} color="rgba(255,255,255,0.3)" strokeWidth={2} />
              <span style={{ fontSize: '0.47rem', fontWeight: '700', color: 'rgba(255,255,255,0.52)', textTransform: 'capitalize' }}>{activeModel.spicylevel}</span>
            </div>
          )}
 
          {/* Price */}
          {activeModel.price > 0 && (
            <span style={{ fontSize: '0.72rem', fontWeight: '900', color: 'rgba(211,191,162,0.7)', fontFamily: 'monospace', letterSpacing: '-0.5px', marginLeft: '2px' }}>
              ₹{activeModel.priceFull || activeModel.price}
            </span>
          )}
        </div>
      </div>
 
      {/* Close */}
      <button
        type="button"
        aria-label="Close 3D dish view"
        onClick={() => { stopSpeech(); setSpokenText(''); setActiveModel(null); }}
        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: '12px' }}
      >
        <X size={18} color="rgba(255,255,255,0.55)" strokeWidth={2} />
      </button>
    </div>
 
    {/* ══════════ SCROLLABLE CONTENT ══════════ */}
    <div style={styles.modelContainer}>
 
      {/* ── 3D VIEWER (fixed height, allows scroll past it) ── */}
      <div style={styles.dishModelWrapper}>
        {/* bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to top, #080808 0%, transparent 100%)' }} />
        {/* top fade */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30px', zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(5,5,5,0.4) 0%, transparent 100%)' }} />
 
        <model-viewer
          src={activeModel.modelUrl}
          ar ar-modes="webxr scene-viewer quick-look"
          camera-controls auto-rotate
          shadow-intensity="1.2"
          exposure="0.9"
          style={{ width: '100%', height: '100%' }}
        />
 
        {/* Drag hint */}
        <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
          <CircleDot size={9} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
          <span style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.52)', fontWeight: '700', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            {t[language].zoomRotate || 'Drag to rotate · Pinch to zoom'}
          </span>
        </div>
 
        {/* Chef bubble */}
        {activeModel.isChefSpecial === true && (
          <div style={styles.chefContainerAR}>
            <div style={styles.chefFlexWrapper}>
              <div style={styles.chefModelBox}>
                <model-viewer
                  src={activeModel.chefurl} autoplay
                  style={{ width: '130px', height: '220px' }}
                  camera-orbit="10deg 80deg 3m"
                  camera-target="0m 0.8m 0m"
                  interaction-prompt="none"
                  shadow-intensity="0"
                />
              </div>
              <div style={styles.chefBubbleRight}>
                <MessageSquare size={10} style={{ position: 'absolute', top: '12px', left: '-7px', color: 'rgba(211,191,162,0.62)' }} />
                "{activeModel.chefMessage || "My personal favourite — you'll love the flavours."}"
              </div>
            </div>
          </div>
        )}
      </div>
 
      {/* ── SCROLL HINT — nudges user to scroll ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 0 4px', background: '#080808' }}>
        <ChevronDown size={12} color="rgba(211,191,162,0.25)" strokeWidth={2} style={{ animation: 'bounceY 1.4s ease-in-out infinite' }} />
        <span style={{ fontSize: '0.46rem', color: 'rgba(211,191,162,0.62)', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          Scroll for details
        </span>
        <ChevronDown size={12} color="rgba(211,191,162,0.25)" strokeWidth={2} style={{ animation: 'bounceY 1.4s ease-in-out 0.2s infinite' }} />
      </div>
 
      {/* ══════════ DISH INFO CARD ══════════ */}
      <div style={{ background: '#0c0c0c', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
 
        {/* Description */}
        {activeModel.description && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(211,191,162,0.62)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '7px' }}>ABOUT THIS DISH</div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontWeight: '400' }}>
              {activeModel.description}
            </p>
          </div>
        )}
 
        {/* Stats grid */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', flexWrap: 'nowrap' }} className="no-scrollbar">
          {[
            activeModel.isVeg !== undefined && {
              icon: <Leaf size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.8} />,
              label: 'Type',
              value: activeModel.isVeg !== false ? 'Veg' : 'Non-Veg'
            },
            activeModel.servingSize && {
              icon: <Users size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.8} />,
              label: 'Serves',
              value: activeModel.servingSize
            },
            activeModel.spicylevel && {
              icon: <Flame size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.8} />,
              label: 'Spice',
              value: activeModel.spicylevel.charAt(0).toUpperCase() + activeModel.spicylevel.slice(1)
            },
            activeModel.priceHalf > 0 && {
              icon: <Tag size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.8} />,
              label: 'Half',
              value: `₹${activeModel.priceHalf}`
            },
            activeModel.priceFull > 0 && {
              icon: <Tag size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.8} />,
              label: 'Full',
              value: `₹${activeModel.priceFull}`
            },
          ].filter(Boolean).map((stat, i) => (
            <div key={i} style={{ padding: '12px 18px', borderRight: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>{stat.value}</div>
              <div style={{ fontSize: '0.48rem', fontWeight: '700', color: 'rgba(255,255,255,0.52)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
 
        {/* Ingredients */}
        {activeModel.ingredients?.en?.length > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(211,191,162,0.62)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              KEY INGREDIENTS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {(voiceLang === 'mr-IN' && activeModel.ingredients?.mr?.length > 0
                ? activeModel.ingredients.mr
                : activeModel.ingredients.en
              ).slice(0, 6).map((ing, i) => (
                <span key={i} style={{ padding: '3px 9px', borderRadius: '5px', fontSize: '0.6rem', fontWeight: '600', color: 'rgba(211,191,162,0.62)', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)' }}>
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}
 
        {/* ══════════ VOICE PANEL ══════════ */}
        {typeof window !== 'undefined' && window.speechSynthesis && (
          <div style={{ padding: '16px 16px 20px' }}>
 
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: speakingItemId === activeModel._id ? 'rgba(211,191,162,0.12)' : 'rgba(211,191,162,0.06)', border: `1px solid ${speakingItemId === activeModel._id ? 'rgba(211,191,162,0.3)' : 'rgba(211,191,162,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  <Volume2 size={14} color="#d3bfa2" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    HEAR THIS DISH
                  </div>
                  <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.52)', marginTop: '2px', fontWeight: '500' }}>
                    {voiceLang === 'mr-IN'
                      ? 'मराठीत वर्णन ऐका'
                      : voiceLang === 'hi-IN'
                      ? 'हिन्दी में विवरण सुनें'
                      : 'Listen in Indian English'}
                  </div>
                </div>
              </div>
 
              {/* Language selector */}
              <div style={{ display: 'flex', gap: '2px', padding: '3px', borderRadius: '9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { code: 'en-IN', label: 'EN', full: 'English' },
                  { code: 'hi-IN', label: 'HI', full: 'हिन्दी' },
                  { code: 'mr-IN', label: 'MR', full: 'मराठी' },
                ].map(({ code, label, full }) => {
                  const active = voiceLang === code;
                  return (
                    <button key={code} type="button"
                      onClick={() => { if (voiceLang !== code) { stopSpeech(); setSpokenText(''); setVoiceLang(code); } }}
                      style={{ height: '28px', minWidth: '34px', padding: '0 8px', borderRadius: '7px', cursor: 'pointer', outline: 'none', fontFamily: 'Poppins, sans-serif', fontSize: '0.5rem', fontWeight: '900', letterSpacing: '0.3px', border: active ? '1px solid rgba(211,191,162,0.4)' : '1px solid transparent', background: active ? 'rgba(211,191,162,0.14)' : 'transparent', color: active ? '#d3bfa2' : 'rgba(255,255,255,0.25)', transition: 'all 0.15s' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
 
            {/* ── LIVE TRANSCRIPT BOX ── */}
            <div style={{ minHeight: '72px', marginBottom: '13px', padding: '11px 13px', background: speakingItemId === activeModel._id ? 'rgba(211,191,162,0.04)' : 'rgba(211,191,162,0.02)', border: `1px solid ${speakingItemId === activeModel._id ? 'rgba(211,191,162,0.12)' : 'rgba(211,191,162,0.07)'}`, borderRadius: '11px', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
              {/* Subtle shimmer when speaking */}
              {speakingItemId === activeModel._id && (
                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.04), transparent)', animation: 'shimmer 2.5s ease-in-out infinite', pointerEvents: 'none' }} />
              )}
              {speakingItemId === activeModel._id && spokenText ? (
                <p aria-live="polite" style={{ margin: 0, fontSize: '0.63rem', color: 'rgba(211,191,162,0.6)', lineHeight: 1.75, fontWeight: '400', fontStyle: 'normal', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {spokenText.split(/\s+/).map((word, i) => (
                    <span key={i} style={{
                      display: 'inline',
                      color: i === currentSpeechWordIndex
                        ? '#d3bfa2'
                        : i < currentSpeechWordIndex
                          ? 'rgba(211,191,162,0.35)'
                          : 'rgba(211,191,162,0.55)',
                      fontWeight: i === currentSpeechWordIndex ? '700' : '400',
                      transition: 'color 0.15s, font-weight 0.15s',
                    }}>
                      {word}{' '}
                    </span>
                  ))}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.65, fontStyle: 'italic' }}>
                  {voiceLang === 'mr-IN'
                    ? 'खाली दाबा आणि या पदार्थाबद्दल ऐका...'
                    : voiceLang === 'hi-IN'
                    ? 'नीचे दबाएं और इस डिश के बारे में सुनें...'
                    : 'Tap below to hear a full reel-style description...'}
                </p>
              )}
            </div>
 
            {/* ── CONTROLS ── */}
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
 
              {/* Main play/stop button */}
              <button
                type="button"
                aria-label={speakingItemId === activeModel._id ? 'Stop' : 'Hear description'}
                onClick={() => speakDish(activeModel)}
                style={{ flex: 1, height: '48px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', cursor: 'pointer', outline: 'none', fontFamily: 'Poppins, sans-serif', border: `1px solid ${speakingItemId === activeModel._id ? 'rgba(211,191,162,0.45)' : 'rgba(211,191,162,0.22)'}`, background: speakingItemId === activeModel._id ? 'rgba(211,191,162,0.14)' : 'rgba(211,191,162,0.08)', transition: 'all 0.2s' }}
              >
                {speakingItemId === activeModel._id ? (
                  <>
                    {/* Animated waveform */}
                    <div style={{ display: 'flex', gap: '2.5px', alignItems: 'center', height: '18px' }}>
                      {[5, 11, 7, 14, 6, 12, 4, 9, 13, 5].map((h, i) => (
                        <div key={i} style={{ width: '2.5px', borderRadius: '2px', background: '#d3bfa2', height: `${h}px`, animation: `pulse ${0.55 + i * 0.07}s ease-in-out ${i * 0.08}s infinite` }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.58rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '0.8px' }}>
                      {voicePaused ? 'PAUSED' : voiceLang === 'mr-IN' ? 'बोलत आहे...' : voiceLang === 'hi-IN' ? 'बोल रहा है...' : 'PLAYING...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Volume2 size={16} color="#d3bfa2" strokeWidth={1.8} />
                    <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '0.5px' }}>
                      {voiceLang === 'mr-IN' ? 'वर्णन ऐका'
                        : voiceLang === 'hi-IN' ? 'विवरण सुनें'
                        : 'HEAR DESCRIPTION'}
                    </span>
                  </>
                )}
              </button>
 
              {/* Pause/Resume */}
              {speakingItemId === activeModel._id && (
                <button type="button"
                  aria-label={voicePaused ? 'Resume' : 'Pause'}
                  onClick={toggleVoicePause}
                  style={{ width: '48px', height: '48px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.2)', cursor: 'pointer', outline: 'none' }}
                >
                  {voicePaused
                    ? <Play  size={16} color="#d3bfa2" strokeWidth={2} />
                    : <Pause size={16} color="#d3bfa2" strokeWidth={2} />}
                </button>
              )}
 
              {/* Stop */}
              {speakingItemId === activeModel._id && (
                <button type="button" aria-label="Stop"
                  onClick={() => { stopSpeech(); setSpokenText(''); }}
                  style={{ width: '48px', height: '48px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', outline: 'none' }}
                >
                  <X size={16} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                </button>
              )}
            </div>
 
            {/* Status line */}
            {speakingItemId === activeModel._id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(211,191,162,0.7)', flexShrink: 0, animation: 'pulse 0.9s ease-in-out infinite' }} />
                <span style={{ fontSize: '0.48rem', fontWeight: '600', color: 'rgba(211,191,162,0.62)', letterSpacing: '0.2px' }}>
                  {voicePaused
                    ? (voiceLang === 'mr-IN' ? 'थांबवले — पुन्हा सुरू करण्यासाठी दाबा' : voiceLang === 'hi-IN' ? 'रुका हुआ — जारी रखने के लिए दबाएं' : 'Paused — tap play to continue')
                    : (voiceLang === 'mr-IN' ? 'मराठीत बोलत आहे...' : voiceLang === 'hi-IN' ? 'हिन्दी में बोल रहा है...' : 'Speaking in Indian English...')
                  }
                </span>
              </div>
            )}
          </div>
        )}
 
      </div>{/* end dish info card */}
 
    </div>{/* end modelContainer / scroller */}
  </motion.div>
)}
      </AnimatePresence>
<AnimatePresence>
  {welcomeCard && !welcomeDismissed && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', padding: '0 0 20px',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        style={{
          width: '100%', maxWidth: '480px',
          background: 'linear-gradient(180deg, #17140f 0%, #0b0b0c 45%)',
          border: '1px solid rgba(211,191,162,0.2)',
          boxShadow: '0 -24px 60px rgba(0,0,0,0.6)',
          borderRadius: '28px 28px 20px 20px',
          overflow: 'hidden', margin: '0 12px',
          maxHeight: '88vh', overflowY: 'auto'
        }}
        className="no-scrollbar"
      >
        {/* Gold shimmer top line */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.7), transparent)', flexShrink: 0 }} />

        <button type="button" onClick={() => setWelcomeDismissed(true)} style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 2,
          width: '26px', height: '26px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#555', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <X size={13} />
        </button>

        {/* ══════════ TOP STRIP — avatar + greeting + visit badge, horizontal ══════════ */}
        <div style={{
          padding: '18px 50px 16px 18px',
          background: 'linear-gradient(180deg, rgba(211,191,162,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          display: 'flex', alignItems: 'center', gap: '13px'
        }}>
          {/* Avatar */}
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
            background: 'rgba(211,191,162,0.07)',
            border: '1px solid rgba(211,191,162,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {welcomeCard.isLoyal
              ? <Sparkles size={21} color="#d3bfa2" strokeWidth={1.5} />
              : welcomeCard.visitCount >= 2
              ? <UserCheck size={21} color="#d3bfa2" strokeWidth={1.5} />
              : <Users size={21} color="#d3bfa2" strokeWidth={1.5} />}
          </div>

          {/* Greeting */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.46rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
              {welcomeCard.isLoyal ? 'LOYAL GUEST' : welcomeCard.visitCount >= 2 ? 'WELCOME BACK' : 'WELCOME'}
            </div>
            <div style={{ fontFamily: PX.serif, fontSize: '1.05rem', fontWeight: 700, color: '#f7f3eb', letterSpacing: '-0.2px', lineHeight: 1.25 }}>
              {language === 'en'
                ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${welcomeCard.name?.split(' ')[0]}!`
                : `नमस्कार, ${welcomeCard.name?.split(' ')[0]}!`}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.52)', marginTop: '2px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={9} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
              {restaurantData?.name}
            </div>
          </div>

          {/* Visit count badge */}
          {welcomeCard.visitCount > 1 && (
            <div style={{
              flexShrink: 0, textAlign: 'center',
              background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.18)',
              borderRadius: '11px', padding: '8px 12px'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', lineHeight: 1 }}>
                {welcomeCard.visitCount}×
              </div>
              <div style={{ fontSize: '0.42rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '3px' }}>
                {language === 'mr' ? 'भेटी' : 'Visits'}
              </div>
            </div>
          )}
        </div>

        {/* ══════════ BODY ══════════ */}
        <div style={{ padding: '14px 16px 16px' }}>

          {/* ── HORIZONTAL HIGHLIGHT ROW: Top Dish + Last Visit side by side ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '8px', marginBottom: '10px' }}>

            {/* Top Dish — wide cell */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '11px',
              padding: '11px 13px',
              background: 'rgba(211,191,162,0.04)',
              border: '1px solid rgba(211,191,162,0.11)',
              borderRadius: '13px', position: 'relative', overflow: 'hidden', minWidth: 0
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '50px', height: '50px', background: 'radial-gradient(circle, rgba(211,191,162,0.06) 0%, transparent 70%)', borderRadius: '0 13px 0 50px' }} />
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Flame size={15} color="#d3bfa2" strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.44rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {language === 'mr' ? 'सर्वात आवडते' : 'Top Dish'}
                </div>
                {welcomeCard.allDishes?.[0] ? (
                  <>
                    <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#d3bfa2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {welcomeCard.allDishes[0].name}
                    </div>
                    <div style={{ fontSize: '0.54rem', color: 'rgba(211,191,162,0.62)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Hash size={8} color="rgba(211,191,162,0.28)" strokeWidth={1.5} />
                      {language === 'mr' ? `${welcomeCard.allDishes[0].count} वेळा` : `Ordered ${welcomeCard.allDishes[0].count}×`}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.52)' }}>—</div>
                )}
              </div>
            </div>

            {/* Last Visit — narrow cell */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '11px 12px',
              background: '#111', border: '1px solid rgba(211,191,162,0.07)',
              borderRadius: '13px', minWidth: 0
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Timer size={15} color="rgba(211,191,162,0.5)" strokeWidth={1.5} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.52)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {language === 'mr' ? 'शेवटची भेट' : 'Last Visit'}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                  {welcomeCard.lastVisit
                    ? new Date(welcomeCard.lastVisit).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* ── HORIZONTAL SPLIT: Most Ordered (left) + Last Order (right) ── */}
          {(welcomeCard.allDishes?.length > 1 || welcomeCard.lastOrderItems?.length > 0) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: (welcomeCard.allDishes?.length > 1 && welcomeCard.lastOrderItems?.length > 0) ? '1fr 1fr' : '1fr',
              gap: '8px', marginBottom: '10px'
            }}>

              {/* Most Ordered ranked list */}
              {welcomeCard.allDishes?.length > 1 && (
                <div style={{
                  padding: '11px 12px',
                  background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.07)',
                  borderRadius: '13px', minWidth: 0
                }}>
                  <div style={{ fontSize: '0.44rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '9px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Flame size={9} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
                    {language === 'mr' ? 'जास्त ऑर्डर' : 'Most Ordered'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {welcomeCard.allDishes.slice(0, 3).map((dish, i) => {
                      const maxCount = welcomeCard.allDishes[0]?.count || 1;
                      const pct = Math.round((dish.count / maxCount) * 100);
                      const rankColors = ['#d3bfa2', '#a89070', '#8a7060'];
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{
                            width: '15px', height: '15px', borderRadius: '4px', flexShrink: 0,
                            background: i === 0 ? 'rgba(211,191,162,0.1)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${i === 0 ? 'rgba(211,191,162,0.25)' : 'rgba(255,255,255,0.05)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.46rem', fontWeight: '900', fontFamily: 'monospace',
                            color: rankColors[i] || '#555'
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{
                                fontSize: '0.64rem', fontWeight: i === 0 ? '800' : '500',
                                color: i === 0 ? '#d3bfa2' : 'rgba(255,255,255,0.35)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px'
                              }}>
                                {dish.name}
                              </span>
                              <span style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.62)', fontFamily: 'monospace', flexShrink: 0, marginLeft: '4px' }}>
                                {dish.count}×
                              </span>
                            </div>
                            <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: i * 0.1 + 0.3, duration: 0.7, ease: 'easeOut' }}
                                style={{
                                  height: '100%',
                                  background: i === 0 ? 'linear-gradient(90deg,#c9a84c,#d3bfa2)' : `rgba(211,191,162,${0.15 + (0.1 * (3 - i))})`,
                                  borderRadius: '1px'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Last Order list */}
{welcomeCard.lastOrderItems?.length > 0 && (
  <div style={{
    padding: '11px 12px', background: '#0d0d0d',
    border: '1px solid rgba(211,191,162,0.07)',
    borderRadius: '13px', minWidth: 0
  }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'9px' }}>
      <div style={{ fontSize:'0.44rem', color:'rgba(211,191,162,0.22)', fontWeight:'900', letterSpacing:'2px', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'5px' }}>
        <ReceiptText size={9} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
        {language === 'mr' ? 'शेवटची ऑर्डर' : 'Last Order'}
      </div>
      {welcomeCard.lastOrderDate && (
        <div style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.14)', fontWeight:'600' }}>
          {new Date(welcomeCard.lastOrderDate).toLocaleDateString('en-IN',{ timeZone: 'Asia/Kolkata',day:'numeric',month:'short'})}
        </div>
      )}
    </div>

    {/* Item list */}
    <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'10px' }}>
      {welcomeCard.lastOrderItems.slice(0,3).map((item,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'0.56rem', fontWeight:'900', color:'rgba(211,191,162,0.22)', fontFamily:'monospace', minWidth:'16px', flexShrink:0 }}>×{item.quantity}</span>
          <span style={{ fontSize:'0.64rem', color:'rgba(255,255,255,0.32)', fontWeight:'500', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</span>
          {item.subtotal > 0 && (
            <span style={{ fontSize:'0.58rem', color:'rgba(211,191,162,0.28)', fontFamily:'monospace', flexShrink:0 }}>₹{item.subtotal}</span>
          )}
        </div>
      ))}
      {welcomeCard.lastOrderItems.length > 3 && (
        <div style={{ fontSize:'0.52rem', color:'rgba(255,255,255,0.14)', fontWeight:'600' }}>
          +{welcomeCard.lastOrderItems.length - 3} {language==='mr'?'अधिक वस्तू':'more items'}
        </div>
      )}
    </div>

    {/* Order Again button */}
    {(() => {
      // Check how many items from last order are still available
      const available = (welcomeCard.lastOrderItems || []).filter(lastItem => {
        const found = allMenuItems.find(m =>
          m.name?.toLowerCase() === lastItem.name?.toLowerCase() && m.isAvailable
        );
        return !!found;
      });
      if (available.length === 0) return null;

      return (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (reorderConfirmPending) {
              // Confirmed — add to cart
              let addedCount = 0;
              available.forEach(lastItem => {
                const menuItem = allMenuItems.find(m =>
                  m.name?.toLowerCase() === lastItem.name?.toLowerCase() && m.isAvailable
                );
                if (!menuItem) return;
                const portion = lastItem.portion || 'Single';
                const key = `${menuItem._id}-${portion}`;
                setCart(prev => ({ ...prev, [key]: (prev[key] || 0) + (Number(lastItem.quantity) || 1) }));
                addedCount++;
              });
              setReorderConfirmPending(false);
              triggerAlert(
                language === 'mr'
                  ? `${addedCount} वस्तू कार्टमध्ये जोडल्या`
                  : `${addedCount} item${addedCount>1?'s':''} added to cart`,
                'success'
              );
            } else {
              setReorderConfirmPending(true);
              // Auto-reset after 3 seconds if not confirmed
              setTimeout(() => setReorderConfirmPending(false), 3000);
            }
          }}
          style={{
            width:'100%', padding:'9px 12px', borderRadius:'10px',
            background: reorderConfirmPending
              ? 'linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.15))'
              : 'rgba(211,191,162,0.06)',
            border: `1px solid ${reorderConfirmPending ? 'rgba(201,168,76,0.45)' : 'rgba(211,191,162,0.1)'}`,
            color: reorderConfirmPending ? '#c9a84c' : 'rgba(211,191,162,0.45)',
            fontSize:'0.62rem', fontWeight:'900', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
            transition:'all 0.2s', letterSpacing:'0.5px',
            fontFamily:'Poppins, sans-serif'
          }}
        >
          <RefreshCw size={11} strokeWidth={2.2}/>
          {reorderConfirmPending
            ? (language === 'mr' ? 'खात्री करा — पुन्हा टॅप करा' : 'Tap again to confirm')
            : (language === 'mr' ? 'हे सर्व पुन्हा मागवा' : `Order Again (${available.length} item${available.length>1?'s':''})`)}
        </motion.button>
      );
    })()}
  </div>
)}
            </div>
          )}

          {/* ── LOYALTY BADGE — compact horizontal ── */}
          {welcomeCard.isLoyal && (
            <div style={{
              padding: '9px 13px', marginBottom: '10px',
              background: 'rgba(211,191,162,0.04)',
              border: '1px solid rgba(211,191,162,0.12)',
              borderRadius: '11px',
              display: 'flex', alignItems: 'center', gap: '9px'
            }}>
              <Sparkles size={15} color="#d3bfa2" strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#d3bfa2' }}>
                  {language === 'mr' ? "तुम्ही लॉयल गेस्ट आहात!" : "You're a Loyal Guest"}
                </span>
                <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.52)' }}>
                  {language === 'mr'
                    ? `· ${welcomeCard.visitCount} भेटींसाठी आभार`
                    : `· thanks for ${welcomeCard.visitCount} visits`}
                </span>
              </div>
            </div>
          )}

          {!guestConsent && (
            <div style={{ marginBottom: 12 }}>
              <ConsentCheck compact checked={guestConsent} onChange={toggleGuestConsent} onOpen={openLegal} language={language} tenantName={restaurantData?.name || 'the restaurant'} />
            </div>
          )}
          {/* ── CTA ── */}
          <button type="button"
            disabled={!guestConsent}
            onClick={() => { if (!guestConsent) return; try { localStorage.setItem(`pratyeksha_phone_${tenantId}`, welcomePhone); } catch { /* storage unavailable */ } setWelcomeDismissed(true); }}
            style={{
              width: '100%', padding: '14px',
              opacity: guestConsent ? 1 : 0.45,
              background: PX.gold,
              border: 'none', borderRadius: '13px',
              color: '#0c0c0c', fontWeight: '900', fontSize: '0.84rem',
              cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
              boxShadow: '0 8px 24px rgba(211,191,162,0.18)'
            }}
          >
            <Utensils size={14} strokeWidth={2.5} />
            {language === 'mr' ? 'चला ऑर्डर देऊया!' : "LET'S ORDER →"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}


</AnimatePresence>


{/* ── PHONE PROMPT (new customers / unrecognized) ── */}
<AnimatePresence>
  {showPhonePrompt && !welcomeCard && !welcomeDismissed && !isCounterScan && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', padding: '0 0 28px',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: '420px',
          background: 'linear-gradient(180deg, #17140f 0%, #0b0b0c 45%)',
          border: '1px solid rgba(211,191,162,0.2)',
          boxShadow: '0 -24px 60px rgba(0,0,0,0.6)',
          borderRadius: '24px 24px 18px 18px',
          overflow: 'hidden', margin: '0 14px'
        }}
      >
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.4), transparent)' }} />

        <div style={{ padding: '22px 22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px' }}>
                {restaurantData?.name}
              </div>
              <h3 style={{ margin: 0, fontFamily: PX.serif, fontSize: '1.3rem', fontWeight: 700, color: '#f7f3eb', letterSpacing: '-0.2px', textAlign: 'left' }}>
                {language === 'mr' ? 'तुम्ही आधी आलेले आहात का?' : 'Been here before?'}
              </h3>
              <p style={{ margin: '5px 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.6 }}>
                {language === 'mr'
                  ? 'नंबर द्या — शेवटची ऑर्डर दाखवतो!'
                  : 'Enter your number and we\'ll show your last order.'}
              </p>
            </div>
            <button type="button" onClick={() => { setShowPhonePrompt(false); setWelcomeDismissed(true); }} style={{
              width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: '#444', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <X size={14} />
            </button>
          </div>

          {/* Phone input */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'rgba(211,191,162,0.62)', fontWeight: '700', pointerEvents: 'none' }}>+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={welcomePhoneInput}
              onChange={e => setWelcomePhoneInput(e.target.value.replace(/\D/g,'').slice(0,10))}
              style={{
                width: '100%', padding: '14px 16px 14px 52px',
                background: '#111', border: '1px solid rgba(211,191,162,0.15)',
                color: '#fff', borderRadius: '12px', fontSize: '1rem',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'Poppins, sans-serif', letterSpacing: '1.5px',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(211,191,162,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(211,191,162,0.15)'}
              onKeyDown={e => { if (e.key === 'Enter' && welcomePhoneInput.length === 10) document.getElementById('recognize-btn').click(); }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <ConsentCheck compact checked={guestConsent} onChange={toggleGuestConsent} onOpen={openLegal} language={language} tenantName={restaurantData?.name || 'the restaurant'} />
          </div>
          <button type="button"
            id="recognize-btn"
            disabled={welcomePhoneInput.length !== 10 || welcomeLoading || !guestConsent}
            onClick={async () => {
              const phone = welcomePhoneInput;
              try { localStorage.setItem(`pratyeksha_phone_${tenantId}`, phone); } catch { /* storage unavailable (private mode) — the button used to do nothing */ }
              setWelcomeLoading(true);
              try {
                const res = await axios.get(`${BASE_URL}/customers/recognize/${tenantId}/${phone}`);
                if (res.data?.found) {
                  setWelcomePhone(phone);
                  setWelcomeCard(res.data);
                  setShowPhonePrompt(false);
                } else {
                  setShowPhonePrompt(false);
                  setWelcomeDismissed(true);
                }
              } catch {
                setShowPhonePrompt(false);
                setWelcomeDismissed(true);
              } finally { setWelcomeLoading(false); }
            }}
            style={{
              width: '100%', padding: '14px',
              background: (welcomePhoneInput.length === 10 && guestConsent)
                ? 'linear-gradient(135deg,#d3bfa2,#bda88a)'
                : 'rgba(211,191,162,0.05)',
              border: (welcomePhoneInput.length === 10 && guestConsent) ? 'none' : '1px solid rgba(211,191,162,0.1)',
              color: (welcomePhoneInput.length === 10 && guestConsent) ? '#0c0c0c' : 'rgba(211,191,162,0.2)',
              borderRadius: '12px', fontWeight: '900', fontSize: '0.82rem',
              cursor: (welcomePhoneInput.length === 10 && guestConsent) ? 'pointer' : 'not-allowed',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {welcomeLoading
              ? (language === 'mr' ? 'शोधत आहे...' : 'Checking...')
              : (language === 'mr' ? 'तपासा' : 'CHECK MY HISTORY')}
            {!welcomeLoading && <ChevronRight size={15} />}
          </button>

          <button type="button"
            onClick={() => { setShowPhonePrompt(false); setWelcomeDismissed(true); }}
            style={{
              width: '100%', marginTop: '10px', padding: '11px',
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.52)', fontSize: '0.72rem',
              cursor: 'pointer', fontWeight: '700'
            }}
          >
            {language === 'mr' ? 'वगळा' : 'Skip'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

 
<AnimatePresence>
  {orderPlacedScreen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        background: '#080808',
        fontFamily: 'Poppins, sans-serif',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        overflowY: 'auto'
      }}
    >
      {/* ── ANIMATED BACKGROUND ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {/* Radial glow center */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1.2, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, rgba(211,191,162,0.03) 40%, transparent 70%)',
          }}
        />
        {/* Rotating ring 1 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '340px', height: '340px', borderRadius: '50%',
            border: '1px solid rgba(201,168,76,0.06)',
          }}
        />
        {/* Rotating ring 2 — opposite */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 26, ease: 'linear' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '480px', height: '480px', borderRadius: '50%',
            border: '1px dashed rgba(201,168,76,0.04)',
          }}
        />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: [0, 0.5, 0], y: [80, -40, -120] }}
            transition={{ delay: i * 0.3 + 0.4, duration: 3.5, repeat: Infinity, repeatDelay: i * 0.4 }}
            style={{
              position: 'absolute',
              left: `${12 + i * 11}%`,
              bottom: '20%',
              width: i % 3 === 0 ? '4px' : '3px',
              height: i % 3 === 0 ? '4px' : '3px',
              borderRadius: '50%',
              background: i % 2 === 0 ? 'rgba(201,168,76,0.6)' : 'rgba(211,191,162,0.4)',
            }}
          />
        ))}
      </div>
 
      {/* ── CONTENT ── */}
      <div style={{ width: '100%', maxWidth: '420px', padding: '60px 24px 40px', position: 'relative', zIndex: 1 }}>
 
        {/* ── 3D KITCHEN ANIMATION ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
 
          {/* SVG Kitchen Scene */}
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 20px' }}>
 
            {/* Outer glow ring */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: '-10px', borderRadius: '50%',
                border: '1px solid rgba(201,168,76,0.25)',
                background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
              }}
            />
 
            {/* Main circle bg */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'linear-gradient(145deg, #141414, #0c0c0c)',
              border: '1px solid rgba(201,168,76,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Gold shimmer top */}
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)' }} />
 
              {/* Animated SVG — cooking pot with steam */}
              <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
 
                {/* Steam lines — animated */}
                <motion.line x1="38" y1="28" x2="38" y2="12"
                  stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6"
                  animate={{ y1: [28, 22, 28], y2: [12, 6, 12], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
                <motion.line x1="55" y1="22" x2="55" y2="6"
                  stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8"
                  animate={{ y1: [22, 15, 22], y2: [6, -1, 6], opacity: [0.8, 0.1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.3, delay: 0.4, ease: 'easeInOut' }}
                />
                <motion.line x1="72" y1="28" x2="72" y2="12"
                  stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6"
                  animate={{ y1: [28, 22, 28], y2: [12, 6, 12], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: 0.8, ease: 'easeInOut' }}
                />
 
                {/* Pot lid */}
                <motion.ellipse cx="55" cy="38" rx="28" ry="8"
                  fill="#1a1a1a" stroke="#c9a84c" strokeWidth="1.2"
                  animate={{ cy: [38, 36, 38] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                />
                {/* Lid handle */}
                <motion.rect x="49" y="31" width="12" height="6" rx="3"
                  fill="#1a1a1a" stroke="#c9a84c" strokeWidth="1"
                  animate={{ y: [31, 29, 31] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                />
 
                {/* Pot body */}
                <rect x="24" y="44" width="62" height="38" rx="8"
                  fill="#141414" stroke="rgba(201,168,76,0.5)" strokeWidth="1.2"
                />
 
                {/* Pot liquid — bubbling fill */}
                <motion.rect x="26" y="52" width="58" height="28" rx="5"
                  fill="rgba(201,168,76,0.08)"
                  animate={{ height: [28, 30, 28], y: [52, 50, 52] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                />
 
                {/* Bubble dots inside pot */}
                {[[40,64],[55,60],[68,66],[48,70]].map(([cx,cy],i) => (
                  <motion.circle key={i} cx={cx} cy={cy} r="2"
                    fill="rgba(201,168,76,0.4)"
                    animate={{ cy: [cy, cy - 6, cy], opacity: [0.4, 0.1, 0.4], r: [2, 1, 2] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.35, ease: 'easeInOut' }}
                  />
                ))}
 
                {/* Pot handles */}
                <path d="M24 52 Q14 52 14 60 Q14 68 24 68" stroke="rgba(201,168,76,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M86 52 Q96 52 96 60 Q96 68 86 68" stroke="rgba(201,168,76,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
 
                {/* Stove grate */}
                <rect x="18" y="82" width="74" height="6" rx="3"
                  fill="#111" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                />
                {/* Grate lines */}
                {[30,42,55,68,80].map((x,i) => (
                  <line key={i} x1={x} y1="82" x2={x} y2="88"
                    stroke="rgba(255,255,255,0.08)" strokeWidth="1"
                  />
                ))}
                {/* Flame glow under pot */}
                <motion.ellipse cx="55" cy="85" rx="20" ry="4"
                  fill="rgba(201,168,76,0.08)"
                  animate={{ rx: [20, 24, 20], opacity: [0.08, 0.18, 0.08] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                />
 
              </svg>
            </div>
 
            {/* Status dot pulse top-right */}
            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 8px rgba(201,168,76,0.6)' }}
              />
            </div>
          </div>
 
          {/* ── HEADLINE ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div style={{ fontSize: '0.52rem', color: 'rgba(201,168,76,0.45)', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px' }}>
              {language === 'mr' ? 'ऑर्डर पाठवली गेली!' : 'Order Confirmed!'}
            </div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.15, marginBottom: '8px' }}>
              {language === 'mr' ? 'किचनमध्ये जात आहे' : 'Heading to the Kitchen'}
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.7, fontWeight: '500', maxWidth: '280px', margin: '0 auto' }}>
              {language === 'mr'
                ? 'तुमची ऑर्डर आमच्या शेफकडे गेली आहे. थोड्याच वेळात तयार होईल!'
                : "Your order is with our chef. We'll keep you updated every step of the way."}
            </p>
          </motion.div>
        </div>
 
        {/* ── LIVE PIPELINE — 3 steps ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: '#0f0f0f',
            border: '1px solid rgba(211,191,162,0.1)',
            borderRadius: '20px', overflow: 'hidden',
            marginBottom: '16px', position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)' }} />
 
          {/* Steps row */}
          <div style={{ padding: '22px 20px 16px', position: 'relative' }}>
 
            {/* Connecting track */}
            <div style={{ position: 'absolute', top: '40px', left: '15%', right: '15%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            {/* Animated fill */}
            <motion.div
              initial={{ width: '5%' }}
              animate={{ width: '25%' }}
              transition={{ delay: 0.8, duration: 1.4, ease: 'easeOut' }}
              style={{ position: 'absolute', top: '40px', left: '15%', height: '1px', background: 'linear-gradient(90deg,#c9a84c,rgba(201,168,76,0.3))' }}
            />
 
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              {[
                { icon: <CheckCircle2 size={18} color="#c9a84c" strokeWidth={2} />, label: language === 'mr' ? 'ऑर्डर\nमिळाली' : 'Order\nReceived', done: true },
                { icon: <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}><Flame size={18} color="rgba(201,168,76,0.5)" strokeWidth={1.5} /></motion.div>, label: language === 'mr' ? 'किचनमध्ये\nबनत आहे' : 'In the\nKitchen', active: true },
                { icon: <Utensils size={18} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />, label: language === 'mr' ? 'सर्व्ह\nकरणार' : 'Ready to\nServe', done: false },
              ].map((step, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '11px',
                    background: step.done ? 'rgba(201,168,76,0.12)' : step.active ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${step.done ? 'rgba(201,168,76,0.35)' : step.active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {step.icon}
                  </div>
                  <div style={{
                    fontSize: '0.54rem', fontWeight: '700', textAlign: 'center', lineHeight: 1.4,
                    color: step.done ? '#d3bfa2' : step.active ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.15)',
                    whiteSpace: 'pre-line'
                  }}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          {/* Est time strip */}
          <div style={{
            padding: '12px 20px',
            background: 'rgba(201,168,76,0.04)',
            borderTop: '1px solid rgba(201,168,76,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={13} color="rgba(201,168,76,0.45)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.52)', fontWeight: '600' }}>
                {language === 'mr' ? 'अंदाजे तयारीची वेळ' : 'Estimated prep time'}
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace' }}>
              15–25 min
            </span>
          </div>
        </motion.div>
 
        {/* ── TABLE + ORDER COUNT ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}
        >
          {[
            { icon: <MapPin size={14} color="rgba(201,168,76,0.5)" strokeWidth={1.5} />, label: language === 'mr' ? 'टेबल' : 'Your Table', val: tableNumber },
            { icon: <ReceiptText size={14} color="rgba(201,168,76,0.5)" strokeWidth={1.5} />, label: language === 'mr' ? 'ऑर्डर' : 'Round', val: `#${Object.keys(liveOrderStatuses).length}` },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#0c0c0c', border: '1px solid rgba(211,191,162,0.07)',
              borderRadius: '13px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              {s.icon}
              <div>
                <div style={{ fontSize: '0.48rem', color: 'rgba(211,191,162,0.62)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace' }}>
                  {s.val}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
 
        {/* ── DISMISS BUTTON ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {canModifyOrder && (
            <button type="button" onClick={startModifyOrder}
              style={{ width: '100%', padding: '14px', marginBottom: '10px', background: 'transparent', border: '1px solid rgba(211,191,162,0.4)', borderRadius: '13px', color: '#d3bfa2', fontWeight: '900', fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              {language === 'mr' ? 'ऑर्डर बदला' : 'Modify order'} · {modifyClock}
            </button>
          )}
          <button type="button"
            onClick={() => setOrderPlacedScreen(false)}
            style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg,#d3bfa2,#bda88a)',
              border: 'none', borderRadius: '13px',
              color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
              cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
              boxShadow: '0 8px 28px rgba(211,191,162,0.15)', marginBottom: '12px'
            }}
          >
            <Utensils size={15} strokeWidth={2.5} />
            {language === 'mr' ? 'मेनूकडे परत जा' : 'Back to Menu'}
          </button>
 
          {/* Auto-dismiss countdown */}
          <div style={{ textAlign: 'center', fontSize: '0.58rem', color: 'rgba(255,255,255,0.52)', fontWeight: '600' }}>
            {language === 'mr' ? 'काही सेकंदात आपोआप बंद होईल' : 'Auto-closing in a few seconds'}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

<style>{`
  .no-scrollbar::-webkit-scrollbar { display: none; }
  /* No visible scrollbars anywhere in the customer app (scrolling still works) */
  html, body, * { scrollbar-width: none; -ms-overflow-style: none; }
  html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar { width: 0; height: 0; display: none; }
  * { -webkit-tap-highlight-color: transparent; }
  html, body, #root { 
    height: 100%; 
    overflow-x: hidden; 
  },

    @keyframes bounceY {
    0%, 100% { transform: translateY(0px); opacity: 0.25; }
    50%       { transform: translateY(4px); opacity: 0.5;  }
  }
  @keyframes shimmer {
    0%   { left: -100%; }
    100% { left: 160%;  }
  }
  @keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
  @keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`}</style>
</div>
  );
};

const styles = {
body: { 
  minHeight: '100vh', 
  fontFamily: 'Poppins, sans-serif', 
  color: '#fff', 
  overflowX: 'hidden',
  overflowY: 'auto',          // ← ADD THIS
  WebkitOverflowScrolling: 'touch'  // ← ADD THIS for iOS momentum scroll
},

contentWrapper: { 
  touchAction: 'pan-y',       // keep existing
  overflowY: 'visible',       // ← ADD THIS — don't clip children
},  header: { padding: '50px 20px 10px', textAlign: 'center' },
  searchWrapper: { padding: '0 20px 15px' },
  searchContainer: { display: 'flex', alignItems: 'center', background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))', border: '1px solid rgba(211, 191, 162, 0.22)', borderRadius: '20px', padding: '13px 17px', gap: '11px', boxShadow: '0 10px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)' },
  searchInput: { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.9rem' },
  langToggleBox: { position: 'absolute', top: '15px', right: '15px' },
  langBtn: { background: 'rgba(211, 191, 162, 0.05)', border: '1px solid', padding: '6px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center' },
  cafeName: { fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.1, margin: '0 0 2px' },
  poweredBy: { fontSize: '0.6rem', letterSpacing: '3px', marginTop: '5px', opacity: 0.5 },
  navContainer: { position: 'sticky', top: '0', zIndex: 999, borderBottom: '1px solid rgba(211, 191, 162, 0.15)' },
  navScroll: { display: 'flex', overflowX: 'auto', padding: '16px 10px', gap: '20px', whiteSpace: 'nowrap' },
  navItem: { background: 'none', border: 'none', fontWeight: '800', fontSize: '0.72rem', flexShrink: 0, padding: '6px 5px', position: 'relative', outline: 'none' },
  activeUnderline: { position: 'absolute', bottom: '-8px', left: '0', right: '0', height: '3px', background: 'linear-gradient(90deg, #b99f78, #f0e3c8, #b99f78)', borderRadius: '10px', boxShadow: '0 0 12px rgba(211,191,162,0.6)' },
  menuContainer: { padding: '10px 15px 120px', maxWidth: '600px', margin: '0 auto' },
  menuCard: { borderRadius: '28px', padding: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', border: '1px solid', position: 'relative', boxShadow: '0 18px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)' },
  itemContentLeft: { flex: 1, paddingRight: '12px', textAlign: 'left' },
  itemDesc: { fontSize: '0.6rem', color: '#888', lineHeight: '1.4' },
  priceContainer: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: '0.75rem', fontWeight: '600' },
  counterRowSmall: { display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', borderRadius: '10px', background: 'rgba(211, 191, 162, 0.12)', border: '1px solid rgba(211,191,162,0.25)' },
  qtyBtnSmall: { background: 'rgba(211,191,162,0.14)', border: 'none', color: '#d3bfa2', fontWeight: '900', width: '22px', height: '22px', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' },
  addBtnSmall: { background: 'linear-gradient(135deg, #e6d6b8 0%, #d3bfa2 50%, #b99f78 100%)', border: 'none', fontSize: '0.66rem', fontWeight: '900', padding: '9px 20px', borderRadius: '13px', color: '#14110c', letterSpacing: '0.6px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(211,191,162,0.25), inset 0 1px 0 rgba(255,255,255,0.5)' },
  view3dBtn: { color: '#1a1a1a', width: '40px', height: '40px', borderRadius: '50%', border: 'none', fontSize: '0.6rem', fontWeight: '900' },
  rightFabContainer: { position: 'fixed', bottom: '30px', right: '25px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 1000 },
  fabBase: { width: '60px', height: '60px', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  fabBadge: { position: 'absolute', top: '2px', right: '2px', background: '#fff', color: '#000', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.65rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fullscreenModal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0b0b0c', zIndex: 5000, display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: '24px 22px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(211,191,162,0.14)', background: 'rgba(11,11,12,0.7)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', fontFamily: "'Playfair Display', Georgia, serif" },
  modalScrollBody: { flex: 1, overflowY: 'auto', paddingBottom: '50px' },
  waiterCardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '22px', maxWidth: 480, margin: '0 auto' },
  waiterCountCard: { background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018))', borderRadius: '24px', padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(211,191,162,0.14)', transition: 'border-color .2s, box-shadow .2s' },
  waiterLabel: { fontSize: '0.8rem', margin: '12px 0', fontWeight: '700', color: '#f7f3eb' },
  countControls: { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '16px', border: '1px solid rgba(211,191,162,0.1)' },
  countBtn: { width: 32, height: 32, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(211,191,162,0.08)', border: 'none', color: '#d3bfa2', cursor: 'pointer' },
  countDisplay: { fontSize: '1rem', fontWeight: '800', minWidth: '22px', textAlign: 'center', color: '#f7f3eb' },
  waiterActionIcon: { width: 38, height: 38, borderRadius: 13, background: 'rgba(211,191,162,0.09)', border: '1px solid rgba(211,191,162,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  waiterActionRow: { width: '100%', marginBottom: '10px', padding: '15px 16px', borderRadius: '20px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))', border: '1px solid rgba(211,191,162,0.16)', color: '#f7f3eb', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' },
  kitchenBtn: { width: '100%', padding: '19px', borderRadius: '18px', fontWeight: '900', border: 'none', color: '#14110c', cursor: 'pointer' },
  input: { padding: '18px', borderRadius: '15px', background: '#222', border: '1px solid #333', color: '#fff', marginBottom: '15px', outline: 'none' },
  instructionText: { color: 'rgba(247,243,235,0.58)', fontSize: '0.84rem', textAlign: 'center', marginBottom: '20px', lineHeight: 1.6 },
  thankYouWrapperProfessional: { padding: '40px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statusIconWrapper: { width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(211,191,162,0.18), rgba(211,191,162,0.04))', border: '1px solid rgba(211,191,162,0.25)', boxShadow: '0 0 0 10px rgba(211,191,162,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' },
  professionalTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2rem', fontWeight: '700', color: '#f7f3eb', margin: '0 0 10px', textAlign: 'center' },
  professionalSubtitle: { color: 'rgba(247,243,235,0.58)', textAlign: 'center', fontSize: '0.92rem', marginBottom: '36px', maxWidth: '300px', lineHeight: 1.6 },
  billBriefCard: { background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018))', border: '1px solid rgba(211,191,162,0.16)', boxShadow: '0 18px 44px rgba(0,0,0,0.38)', borderRadius: '26px', width: '100%', padding: '22px', marginBottom: '32px', boxSizing: 'border-box' },
  billBriefHeader: { color: '#d3bfa2', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  billTableHead: { display: 'flex', paddingBottom: '10px', borderBottom: '1px solid rgba(211, 191, 162, 0.2)', marginBottom: '15px', fontSize: '0.75rem', fontWeight: '800', color: '#777', textTransform: 'uppercase' },
  billTableBody: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
  billTableRow: { display: 'flex', alignItems: 'center' },
  billTableFooter: { paddingTop: '15px', borderTop: '1px dashed rgba(211, 191, 162, 0.3)' },
  billLineTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800' },
  billLine: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' },
  professionalContinueBtn: { width: '100%', padding: '19px', borderRadius: '20px', background: 'linear-gradient(135deg, #e6d6b8 0%, #d3bfa2 45%, #b99f78 100%)', border: 'none', color: '#14110c', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' },
  googleProfessionalBtn: { width: '100%', padding: '15px 20px', borderRadius: '18px', background: '#fff', display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', color: '#1a1a1a', fontWeight: '700', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' },
  googleIconCircle: { width: '40px', height: '40px', borderRadius: '12px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  professionalMenuBack: { marginTop: '30px', background: 'transparent', border: 'none', color: '#555', fontSize: '0.85rem', textDecoration: 'underline' },
  globalAlert: { position: 'fixed', top: '24px', left: '16px', right: '16px', background: 'rgba(30, 30, 30, 0.98)', padding: '16px', borderRadius: '16px', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid #d3bfa2' },
  tagContainer: { position: 'absolute', top: '10px', right: '10px' },
  chefTag: { background: 'linear-gradient(135deg, #d3bfa2, #b09c7a)', color: '#1a1a1a', padding: '4px 10px', borderRadius: '15px', fontSize: '0.55rem', fontWeight: '900', display: 'flex', alignItems: 'center' },
  loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', fontWeight: 'bold' },
  sideDrawer: { position: 'fixed', top: 0, right: 0, width: '88%', maxWidth: 440, height: '100%', background: 'linear-gradient(180deg, #15120d 0%, #0b0b0c 38%)', borderLeft: '1px solid rgba(211,191,162,0.16)', zIndex: 5500, display: 'flex', flexDirection: 'column', boxShadow: '-18px 0 50px rgba(0,0,0,0.6)' },
  drawerHeader: { padding: '22px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(211,191,162,0.14)', fontFamily: "'Playfair Display', Georgia, serif" },
  drawerContent: { flex: 1, overflowY: 'auto', padding: '20px' },
  drawerItemBlock: { padding: '15px 0' },
  drawerRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  drawerFooter: { padding: '20px', paddingBottom: '40px' },
  billLinkBtn: { background: 'none', border: 'none', color: '#888', marginTop: '15px', width: '100%', fontSize: '0.8rem', textDecoration: 'underline' },
modalOverlay: {
  position: 'fixed', top: 0, left: 0,
  width: '100vw', height: '100vh',
  zIndex: 7000,
  display: 'flex', flexDirection: 'column',
  background: '#050505',
  overflow: 'hidden',          // ← outer shell stays hidden
},
 
// modelContainer is now the ONE scroller — everything below the sticky nav scrolls
modelContainer: {
  flex: 1,
  background: '#080808',
  display: 'flex', flexDirection: 'column',
  overflowY: 'auto', overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  scrollBehavior: 'smooth',
},
 
// 3D viewer box — fixed height that doesn't eat the full screen,
// so content below is naturally reachable on scroll
dishModelWrapper: {
  width: '100%',
  height: '46vmax',
  maxHeight: '52vh',
  minHeight: '240px',
  position: 'relative',
  flexShrink: 0,
  background: 'radial-gradient(ellipse at 50% 60%, #1a1510 0%, #070707 100%)',
},

modalNav: { padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(211,191,162,0.09)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10, background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' },
modalTitle: { margin: 0, fontSize: '1rem', fontWeight: '800' },

chefContainerAR: {
  position: 'absolute', bottom: '110px',
  left: '0', zIndex: 50,
  width: '100%', pointerEvents: 'none'
},
chefFlexWrapper: { display: 'flex', alignItems: 'flex-end' },
chefModelBox:   { flexShrink: 0 },
chefBubbleRight: {
  background: '#1a1a1a',
  color: 'rgba(255,255,255,0.78)',
  padding: '10px 14px',
  borderRadius: '2px 15px 15px 15px',
  fontSize: '0.6rem', fontWeight: '600',
  maxWidth: '130px',
  marginLeft: '-20px', marginBottom: '70px',
  pointerEvents: 'auto',
  border: '1px solid rgba(211,191,162,0.15)',
  lineHeight: 1.5
},
fixedArButtonWrapper: {
  position: 'absolute', bottom: '40px',
  width: '100%', display: 'flex',
  justifyContent: 'center'
},
arCustomBtn: {
  border: 'none', padding: '16px 28px',
  borderRadius: '50px', fontWeight: '900',
  fontSize: '0.75rem', color: '#1a1a1a'
},  suggestionInputWrapper: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '10px', marginTop: '10px' },
  suggestionInput: { background: 'none', border: 'none', color: '#fff', fontSize: '0.75rem', width: '100%', outline: 'none' }
};

export default PratyekshaPremiumMenu;
