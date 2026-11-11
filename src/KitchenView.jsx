/* ─── KITCHEN DISPLAY (KDS) — Pratyeksha "Ink · Glass · Champagne" system ───────────────────────────────
   Same visual language as the Operator Portal and the loading screen:
   ink       #0b0b0c   page          glass   white 6% → 1.6% over #0e0e0f   panels
   champagne #d3bfa2   accents       bronze  #8a704d                        secondary
   cream     #f7f3eb   text          amber   #e29a58                        alerts / overdue
   (Swiggy / Zomato brand colours are kept on purpose; type is Poppins + JetBrains Mono for timers)

   What this screen does
   • Tickets arrive in real time over the socket, and a short safety poll catches anything the socket missed.
   • Every new ticket is announced: a chime, then the details are spoken (table / source, every dish, portion, notes).
     The announcements are automatic. There is no microphone and no tap-to-listen: voice is output only.
   • A speaker button on each ticket repeats its details on demand.
   • Business logic (kds-item timing, dispatch, recall, 86, wastage, auth) is unchanged from the previous screen. */
import React, { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback, useSyncExternalStore } from 'react';
import SupportContact from './SupportContact.jsx';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_BASE_URL, { SOCKET_BASE_URL } from './apiBase.js';
import { OPERATOR_AUTH_EVENT, setKitchenToken, getOperatorToken } from './operatorAuth.js';
import { playAlertSound } from './alertSounds.js';
import PwaInstallButton from './PwaInstallButton.jsx';
import { motion as Motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  ChefHat, Timer, StickyNote, X, Zap, History, LayoutGrid, BarChart3, Package, UtensilsCrossed, Activity, Coffee,
  Layers, Flame, EyeOff, Sparkles, TrendingUp, WifiOff, AlignJustify, Trash2, AlertTriangle, RotateCcw, TrendingDown,
  RefreshCw, Search, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, Scale, PackageX, ShieldAlert, Wrench,
  Volume2, VolumeX, Bike, Check, ArrowUpDown, ChevronDown, Settings, Maximize, Minimize, Siren,
} from 'lucide-react';
import SpoonForkIcon from './SpoonForkIcon.jsx';
const BellRing = SpoonForkIcon; // crossed spoon & fork instead of the bell

const BASE_URL = API_BASE_URL;
// Sliding tickets into place when one leaves costs measuring every ticket on every change: only done while the board is small enough to be cheap.
const LAYOUT_ANIM_MAX = 12;

/* ─── helpers ─── */
const useWheelSideways = ref => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onWheel = e => {
      if (el.scrollWidth <= el.clientWidth + 1 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;   // nothing hidden, or already a sideways gesture
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });
};

// A dialog must take keyboard focus when it opens, keep Tab inside itself (the board behind stays out of reach) and hand focus back when it closes.
const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const useFocusTrap = (ref, active) => {
  useEffect(() => {
    if (!active) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const previous = document.activeElement;
    const items = () => Array.from(el.querySelectorAll(FOCUSABLE)).filter(n => n.offsetParent !== null || n === document.activeElement);
    const first = items()[0];
    if (first) first.focus({ preventScroll: true }); else { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    const onKey = e => {
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) { e.preventDefault(); return; }
      const a = list[0], z = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === a || !el.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && (document.activeElement === z || !el.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); try { if (previous && previous.focus && document.contains(previous)) previous.focus({ preventScroll: true }); } catch { /* ignore */ } };
  }, [ref, active]);
};

const useWindowSize = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    // dragging a window edge fires dozens of resize events a second: re-render at most once per frame, and only if the size really changed
    let raf = 0;
    const h = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; setSize(prev => (prev.w === window.innerWidth && prev.h === window.innerHeight) ? prev : { w: window.innerWidth, h: window.innerHeight }); });
    };
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return size;
};

const useSwipe = (onLeft, onRight) => {
  const tx = useRef(null);
  return {
    onTouchStart: e => { tx.current = e.touches[0].clientX; },
    onTouchEnd: e => {
      if (tx.current === null) return;
      const diff = tx.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 48) { if (diff > 0) onLeft?.(); else onRight?.(); }
      tx.current = null;
    },
  };
};

const getOrderType = order => {
  if (order.source === 'swiggy') return 'swiggy';
  if (order.source === 'zomato') return 'zomato';
  // tableNumber can arrive as a number from some clients: .toLowerCase() on it threw and blanked the whole board.
  const tbl = String(order.tableNumber ?? '').toLowerCase();
  if (order.source === 'counter-pickup' || order.source === 'takeaway' || tbl === 'takeaway' || tbl === 'counter') return 'parcel';
  return 'dine-in'; // waitlist, reservation, direct all → dine-in
};

// "Extra items" are packaged goods that never go to the kitchen.
const isKitchenItem = i => !!i && !i.isExtraItem && i.extraItemId == null;

// Module-level so the (module-level) order card and the board share it: dish checks whose save is still in flight ("orderId-idx" -> {o, i}).
// A refresh that lands in that window used to un-tick the dish the chef had just ticked.
const pendingToggles = new Map();

/* ═══ UNCHANGED DATA KEEPS ITS IDENTITY ═══
   A refresh used to replace every ticket with a brand-new object, so every ticket re-rendered even when nothing had changed. A ticket whose
   data is identical to the one already on screen now keeps the old object, and the board does not re-render at all when nothing changed. */
const sigCache = new WeakMap();
const orderSig = o => { let s = sigCache.get(o); if (s === undefined) { s = JSON.stringify(o); sigCache.set(o, s); } return s; };
const reuseOrders = (prev, next) => {
  const prevById = new Map(prev.map(o => [String(o._id), o]));
  let changed = prev.length !== next.length;
  const out = next.map((o, i) => {
    const old = prevById.get(String(o._id));
    if (old && (old === o || orderSig(old) === orderSig(o))) { if (prev[i] !== old) changed = true; return old; }
    changed = true;
    return o;
  });
  return changed ? out : prev;
};
const sameKeys = (a, b) => { const ka = Object.keys(a); return ka.length === Object.keys(b).length && ka.every(k => k in b); };

// Same rule the order card uses to show/hide a dish (category tab + veg/non-veg mode), so totals built elsewhere match the cards.
const isDishVisible = (item, { selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode }) => {
  if (!isKitchenItem(item)) return false;
  const catId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap?.[item.name?.toLowerCase().trim()] || null;
  if (selectedCategory !== 'ALL' && catId !== String(selectedCategory).toLowerCase().trim()) return false;
  const isVeg = item.isVeg !== undefined ? item.isVeg !== false : (dishToVegMap?.[item.name?.toLowerCase().trim()] !== false);
  return tenantOnlyVeg ? true : isNonVegMode ? !isVeg : isVeg;
};

const fmt = s => {
  s = Math.max(0, Math.floor(Number(s) || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = n => n.toString().padStart(2, '0');
  return h > 0 ? `${h}h ${p(m)}m` : `${p(m)}:${p(sec)}`;
};
// Durations written out ("3m 12s"): once it reaches 60 minutes it switches to hours ("1h 05m"). Used for averages and finished-dish times.
const fmtSpan = s => {
  s = Math.max(0, Math.round(Number(s) || 0));
  if (s >= 3600) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}h ${pad2(m)}m`; }
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};
const createdMs = o => new Date(o?.createdAt).getTime() || 0;
const pad2 = n => (n < 10 ? `0${n}` : String(n));

const REASON_OPTIONS = ['Spoiled / Expired', 'Overcooked', 'Dropped / Spilled', 'Excess Prep', 'Customer Return', 'Other'];
const UNIT_OPTIONS = ['kg', 'g', 'litre', 'ml', 'pcs', 'plate', 'portion'];
const STATIONS = [
  { val: 'ALL', lbl: 'ALL', Icon: Layers },
  { val: 'DINEIN', lbl: 'DINE-IN', Icon: UtensilsCrossed },
  { val: 'PARCEL', lbl: 'PARCEL', Icon: Package },
  { val: 'DELIVERY', lbl: 'DELIVERY', Icon: Bike },
];
const EIGHTY_SIX_REASONS = [
  { id: 'ran_out', label: 'Ran Out', icon: PackageX },
  { id: 'quality_issue', label: 'Quality Issue', icon: ShieldAlert },
  { id: 'equipment_failure', label: 'Equipment Failure', icon: Wrench },
];

/* ═══════════════════════════════════════════════════════════════════
   VOICE — output only. A small queue so tickets that arrive together are read one after another, never over each other.
═══════════════════════════════════════════════════════════════════ */
const VOICE_PREF_KEY = 'kds_voice_prefs_v2';
const DEFAULT_VOICE_PREFS = { voice: true, chime: true, dispatchSound: true, overdueAlert: true, repeat: 1, rate: 'normal', volume: 1, voiceName: '' };
const RATE_VALUE = { slow: 0.8, normal: 0.92, fast: 1.06 };
const loadVoicePrefs = () => {
  try { return { ...DEFAULT_VOICE_PREFS, ...JSON.parse(localStorage.getItem(VOICE_PREF_KEY) || '{}') }; } catch { return { ...DEFAULT_VOICE_PREFS }; }
};

/* ═══ DISPLAY SETTINGS (per device) ═══ */
const DISPLAY_KEY = 'kds_display_v1';
const DEFAULT_DISPLAY = { size: 'normal', warnSec: 450, lateSec: 900, keepAwake: true };
const SIZE_ZOOM = { small: 0.82, normal: 1, large: 1.18 };
const WARN_OPTIONS = [['5 min', 300], ['7½ min', 450], ['10 min', 600]];
const LATE_OPTIONS = [['10 min', 600], ['15 min', 900], ['20 min', 1200], ['30 min', 1800]];
const loadDisplay = () => {
  try {
    const d = { ...DEFAULT_DISPLAY, ...JSON.parse(localStorage.getItem(DISPLAY_KEY) || '{}') };
    if (!SIZE_ZOOM[d.size]) d.size = DEFAULT_DISPLAY.size;
    if (!WARN_OPTIONS.some(([, s]) => s === d.warnSec) || !LATE_OPTIONS.some(([, s]) => s === d.lateSec) || d.warnSec >= d.lateSec) { d.warnSec = DEFAULT_DISPLAY.warnSec; d.lateSec = DEFAULT_DISPLAY.lateSec; }
    d.keepAwake = d.keepAwake !== false;
    return d;
  } catch { return { ...DEFAULT_DISPLAY }; }
};

const speechEngine = {
  queue: [], speaking: false, current: null, watchdog: null, voices: [], onState: null, onBlocked: null,
  supported() { return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'; },
  refreshVoices() { try { this.voices = window.speechSynthesis.getVoices() || []; } catch { this.voices = []; } },
  pickVoice(name) {
    if (!this.voices.length) this.refreshVoices();
    const v = this.voices;
    const chosen = name ? v.find(x => x.name === name) : null;
    if (chosen) return chosen;
    return v.find(x => x.lang === 'en-IN') || v.find(x => /^en/i.test(x.lang || '') && /india/i.test(x.name || '')) || v.find(x => /^en/i.test(x.lang || '')) || v[0] || null;
  },
  setSpeaking(on) { this.speaking = on; try { this.onState?.(on); } catch { /* ignore */ } },
  next() {
    clearTimeout(this.watchdog);
    if (!this.queue.length) { this.current = null; this.setSpeaking(false); return; }
    this.setSpeaking(true);
    const utt = this.queue.shift();
    this.current = utt;
    let advanced = false;
    const advance = () => { if (advanced) return; advanced = true; this.next(); };
    utt.onend = advance;
    utt.onerror = e => { if (e && e.error === 'not-allowed') { try { this.onBlocked?.(); } catch { /* ignore */ } } advance(); };
    // Chrome sometimes never fires onend; without this the queue would stay "speaking" forever and later tickets stay silent.
    this.watchdog = setTimeout(() => { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } advance(); }, Math.min(45000, 5000 + String(utt.text || '').length * 120));
    try { window.speechSynthesis.speak(utt); } catch { advance(); }
  },
  stop() {
    this.queue = [];
    clearTimeout(this.watchdog);
    if (this.current) { this.current.onend = null; this.current.onerror = null; this.current = null; }
    try { if (this.supported()) window.speechSynthesis.cancel(); } catch { /* ignore */ }
    this.setSpeaking(false);
  },
  say(text, { repeat = 1, rate = 'normal', interrupt = false, volume = 1, voiceName = '' } = {}) {
    if (!text || !this.supported()) return;
    if (interrupt) this.stop();
    const wasIdle = !this.speaking;
    const voice = this.pickVoice(voiceName);
    for (let i = 0; i < Math.max(1, Math.min(3, repeat)); i++) {
      const u = new SpeechSynthesisUtterance(String(text));
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-IN';
      u.rate = RATE_VALUE[rate] || RATE_VALUE.normal; u.pitch = 1; u.volume = Math.min(1, Math.max(0.1, Number(volume) || 1));
      this.queue.push(u);
    }
    // Chrome drops a speak() that comes straight after cancel(): after an interrupt, start the new text a moment later.
    if (interrupt) { setTimeout(() => { if (!this.speaking && this.queue.length) this.next(); }, 90); return; }
    if (wasIdle && !this.speaking) this.next();
  },
};

// "A3" is read as "A 3", otherwise the voice says "a-three" as one word.
const spokenTable = t => String(t ?? '').replace(/([A-Za-z])(\d)/g, '$1 $2').replace(/(\d)([A-Za-z])/g, '$1 $2');

const spokenWho = order => {
  const otype = getOrderType(order);
  return otype === 'swiggy' ? 'Swiggy delivery order'
    : otype === 'zomato' ? 'Zomato delivery order'
      : otype === 'parcel' ? 'Pickup order'
        : (String(order.tableNumber ?? '').trim() ? `Table ${spokenTable(order.tableNumber)}` : 'Dine in order');
};

// Everything the cook needs to hear: where it is going, then every dish with quantity, portion and notes.
const buildTicketSpeech = (order, { replay = false } = {}) => {
  const otype = getOrderType(order);
  const who = spokenWho(order);
  const items = (order.items || []).filter(isKitchenItem);
  const mode = otype === 'parcel' ? 'parcel' : (otype === 'swiggy' || otype === 'zomato') ? 'delivery' : 'dine in';
  const dishes = items.map(i => {
    const qty = Number(i.quantity) || 1;
    const portion = i.portion && String(i.portion).toLowerCase() !== 'single' && String(i.portion).toLowerCase() !== 'standard' ? `${i.portion} ` : '';
    let d = `${qty} ${portion}${i.name}`;
    if (i.isChefSpecial) d += ', chef special';
    if (i.suggestion && String(i.suggestion).trim()) d += `. Note: ${String(i.suggestion).trim()}`;
    return d;
  });
  const head = replay ? `${who}.` : (otype === 'dine-in' && who.startsWith('Table') ? `New ticket for ${who}.` : `New ${who}.`);
  const count = items.length === 1 ? '1 dish' : `${items.length} dishes`;
  return `${head} ${count}, ${mode}. ${dishes.join('. ')}.`;
};

// What changed in a modified order, and nothing else: { added:[{name,quantity}], qty:[{name,from,to}], removed:[{name,quantity}] }.
const extractModification = data => {
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    added: items.filter(i => i.modChange === 'new').map(i => ({ name: i.name, quantity: Number(i.quantity) || 1 })),
    qty: items.filter(i => i.modChange === 'qty').map(i => ({ name: i.name, from: Number(i.modPrevQty) || 0, to: Number(i.quantity) || 0 })),
    removed: (data?.replacedInfo?.removed || []).map(i => ({ name: i.name, quantity: Number(i.quantity) || 1 })),
  };
};
const modIsEmpty = m => !m || (!m.added.length && !m.qty.length && !m.removed.length);
// "ADDED: 1× Naan · QTY: Dal Fry 1→2 · REMOVED: 1× Roti" — shown on the alert banner and the toast.
const modSummary = m => [
  m.added.length ? `ADDED: ${m.added.map(i => `${i.quantity}× ${i.name}`).join(', ')}` : '',
  m.qty.length ? `QTY: ${m.qty.map(i => `${i.name} ${i.from}→${i.to}`).join(', ')}` : '',
  m.removed.length ? `REMOVED: ${m.removed.map(i => `${i.quantity}× ${i.name}`).join(', ')}` : '',
].filter(Boolean).join(' · ');
// Spoken: "Order modified. Table 5. Added 1 Naan. Dal Fry quantity changed from 1 to 2. Removed 1 Roti."  Only what changed.
const buildModSpeech = (who, m, fallbackNote) => {
  const parts = [];
  if (m.added.length) parts.push(`Added ${m.added.map(i => `${i.quantity} ${i.name}`).join(', ')}`);
  m.qty.forEach(i => parts.push(`${i.name} quantity changed from ${i.from} to ${i.to}`));
  if (m.removed.length) parts.push(`Removed ${m.removed.map(i => `${i.quantity} ${i.name}`).join(', ')}`);
  if (!parts.length && fallbackNote) parts.push(String(fallbackNote));
  return `Order modified. ${who}. ${parts.join('. ')}${parts.length ? '.' : ''}`;
};

// "just now" / "3 min ago" / "1h 05m ago" (computed once when a list opens, never ticking)
const fmtAgo = ms => { const m = Math.max(0, Math.round((Date.now() - (ms || Date.now())) / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)}h ${pad2(m % 60)}m ago`; };
// Numbers shown to cooks: 1000 -> "1000", 0.5 -> "0.5", 1093.5 -> "1093.5" would break a narrow badge, so counts are capped and rounded.
const fmtQty = q => {
  const n = Number(q);
  if (q === undefined || q === null || q === '' || !Number.isFinite(n)) return String(q ?? '1').trim() || '1';
  return Number.isInteger(n) ? String(n) : String(+n.toFixed(1));
};
const fmtPadQty = q => (Number.isInteger(Number(q)) ? pad2(Number(q)) : fmtQty(q));
const fmtCount = n => { const v = Math.round(Number(n) || 0); return v > 999 ? '999+' : pad2(v); };
const sameName = (a, b) => String(a || '').toLowerCase().trim() === String(b || '').toLowerCase().trim();
// A second change to the same ticket must not wipe the first one's highlight (a dish added earlier is still uncooked).
// Keeps the very first "from" quantity and the latest "to"; a dish added then removed (or removed then added back) cancels out.
const mergeModification = (prev, next) => {
  if (!prev) return next;
  const added = prev.added.map(a => ({ ...a }));
  next.added.forEach(a => { const i = added.findIndex(x => sameName(x.name, a.name)); if (i >= 0) added[i].quantity = a.quantity; else added.push({ ...a }); });
  const qty = prev.qty.map(q => ({ ...q }));
  next.qty.forEach(q => { const i = qty.findIndex(x => sameName(x.name, q.name)); if (i >= 0) qty[i].to = q.to; else qty.push({ ...q }); });
  const removed = prev.removed.map(r => ({ ...r }));
  next.removed.forEach(r => { const i = removed.findIndex(x => sameName(x.name, r.name)); if (i >= 0) removed[i].quantity = r.quantity; else removed.push({ ...r }); });
  const gone = n => next.removed.some(r => sameName(r.name, n));
  return {
    added: added.filter(a => !gone(a.name)),
    qty: qty.filter(q => !gone(q.name)),
    removed: removed.filter(r => !next.added.some(a => sameName(a.name, r.name))),
  };
};
// "T-5" / "PARCEL" / "SWIGGY": the shortest name a cook recognises a ticket by.
const shortLabel = o => {
  const t = getOrderType(o);
  return t === 'swiggy' ? 'SWIGGY' : t === 'zomato' ? 'ZOMATO' : t === 'parcel' ? 'PARCEL' : `T-${String(o.tableNumber ?? '').trim() || '?'}`;
};

// Short label for the arrival toast.
const ticketLabel = order => {
  const t = getOrderType(order);
  return t === 'swiggy' ? 'SWIGGY' : t === 'zomato' ? 'ZOMATO' : t === 'parcel' ? 'PARCEL' : (String(order.tableNumber ?? '').trim() ? `TABLE ${order.tableNumber}` : 'DINE-IN');
};

/* ═══════════════════════════════════════════════════════════
   STYLES — one scoped sheet (.kx). Tokens first, then header, rail, tickets, panels, skeletons.
═══════════════════════════════════════════════════════════ */
const KX_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
html,body{margin:0;background:#0b0b0c;overflow:hidden;overscroll-behavior:none}
.kx,.kx *,.kx *::before,.kx *::after{box-sizing:border-box}
.kx{--line:rgba(211,191,162,.16);--line2:rgba(211,191,162,.32);--gold:#d3bfa2;--gold2:#b99f78;--bronze:#8a704d;--cream:#f7f3eb;--mute:#9b978d;--dim:#8e8a80;--amber:#e29a58;--swiggy:#fc8019;--zomato:#e0343f;--veg:#5d9a4e;--nonveg:#c04a4a;
  --glass:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.016));--ease:cubic-bezier(.22,1,.36,1);
  position:fixed;top:0;right:0;bottom:0;left:0;display:flex;flex-direction:column;overflow:hidden;color:var(--cream);
  font-family:Poppins,system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-tap-highlight-color:transparent;
  background:radial-gradient(120% 80% at 50% -10%,#17140f 0%,#0b0b0c 55%,#070708 100%);
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.kx button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.kx button:disabled{cursor:default}
.kx input,.kx select,.kx textarea{font-family:inherit}
.kx .mono{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace}
.kx .no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.kx .no-scrollbar::-webkit-scrollbar{display:none;width:0;height:0}
.kx :focus-visible{outline:2px solid rgba(211,191,162,.65);outline-offset:2px}

/* ── header ── */
.kx-top{display:flex;align-items:center;gap:10px;margin:8px 8px 0;padding:6px 10px;border-radius:16px;flex-shrink:0;z-index:70;position:relative;
  background:var(--glass),#0d0d0e;border:1px solid var(--line);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 18px 40px -22px rgba(0,0,0,.85)}
.kx-brand{display:flex;align-items:center;gap:10px;min-width:0;flex-shrink:0}
.kx-logo{background:var(--cream);border-radius:9px;padding:3px 8px;border:1px solid rgba(211,191,162,.5);box-shadow:0 8px 22px -10px rgba(211,191,162,.45);flex-shrink:0}
.kx-logo-txt{display:block;font:800 .72rem/1.5 Poppins,sans-serif;letter-spacing:.2em;color:#1b1814;white-space:nowrap;font-size:.66rem}
.kx-logo img{display:block;width:88px;height:auto}
.kx-brand-t{display:flex;flex-direction:column;gap:3px;min-width:0}
.kx-kds{display:inline-flex;align-items:center;gap:6px;font-size:.64rem;font-weight:700;letter-spacing:.24em;color:var(--gold);text-transform:uppercase;white-space:nowrap}
.kx-live{display:inline-flex;align-items:center;gap:6px;font-size:.64rem;font-weight:600;letter-spacing:.12em;color:var(--mute);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.kx-dot{position:relative;width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0}
/* the pulse is a ring that grows and fades (transform + opacity only): animating box-shadow repainted the header every frame, forever */
.kx-dot::after{content:'';position:absolute;inset:0;border-radius:50%;background:var(--gold);opacity:0;animation:kxRing 2.2s ease-out infinite}
.kx-live.off{color:var(--amber)} .kx-live.off .kx-dot,.kx-dot.off{background:var(--amber)} .kx-live.off .kx-dot::after,.kx-dot.off::after{animation:none}
.kx-seg{display:flex;padding:2px;gap:2px;border-radius:12px;background:#070708;border:1px solid var(--line);flex-shrink:0}
.kx-seg button{display:inline-flex;align-items:center;gap:7px;padding:5px 10px;border:0;border-radius:10px;background:transparent;color:var(--mute);font-size:.68rem;font-weight:700;letter-spacing:.08em;white-space:nowrap;min-height:34px;transition:all .18s var(--ease)}
.kx-seg button:hover{color:var(--cream)}
.kx-seg button.on{background:linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78);color:#14110c;box-shadow:0 8px 20px -10px rgba(211,191,162,.6)}
.kx-seg button .n{font:700 0.65rem 'JetBrains Mono',monospace;opacity:.8}
.kx-stats{display:flex;gap:6px;margin-left:auto;flex-shrink:0}
.kx-stat{min-width:60px;padding:3px 9px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.03);text-align:center}
.kx-stat b{display:block;font:700 .98rem/1.1 'JetBrains Mono',monospace;color:var(--cream)}
.kx-stat span{display:block;margin-top:1px;font-size:.66rem;letter-spacing:.14em;color:var(--mute);text-transform:uppercase;font-weight:600}
.kx-stat.hot{border-color:var(--line2);background:rgba(211,191,162,.1)} .kx-stat.hot b{color:var(--gold)}
.kx-acts{display:flex;align-items:center;gap:6px;flex-shrink:0}
.kx-ib{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;min-width:36px;padding:0 9px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.03);color:#cfc7b8;font-size:0.65rem;font-weight:700;letter-spacing:.1em;transition:all .18s var(--ease);flex-shrink:0}
.kx-ib:not(:disabled):hover{border-color:var(--line2);color:var(--cream);background:rgba(255,255,255,.06)}
.kx-ib:not(:disabled):active{transform:scale(.96)}
.kx-ib.on{border-color:var(--line2);background:rgba(211,191,162,.13);color:var(--gold)}
.kx-ib.mute{color:var(--dim)}
.kx-badge{position:absolute;top:-6px;right:-6px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:linear-gradient(135deg,#e6d6b8,#b99f78);color:#14110c;font:700 0.65rem/17px 'JetBrains Mono',monospace;text-align:center;font-style:normal}
.kx-eq{display:inline-flex;align-items:flex-end;gap:2px;height:14px}
.kx-eq i{width:3px;border-radius:2px;background:var(--gold);animation:kxEq .9s ease-in-out infinite}
.kx-eq i:nth-child(2){animation-delay:.18s} .kx-eq i:nth-child(3){animation-delay:.36s}
.kx-pop{position:absolute;right:0;top:calc(100% + 10px);width:292px;max-height:calc(100vh - 90px);overflow-y:auto;z-index:70;padding:14px;border-radius:16px;background:var(--glass),#101011;border:1px solid var(--line2);box-shadow:0 30px 70px -20px rgba(0,0,0,.9);display:flex;flex-direction:column;gap:14px}
.kx-pop h4{margin:0;font-size:0.65rem;font-weight:700;letter-spacing:.22em;color:var(--gold);text-transform:uppercase}
.kx-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:.74rem;font-weight:500;color:#d8d1c3}
.kx-row small{display:block;margin-top:2px;font-size:0.65rem;color:var(--mute);font-weight:400}
.kx-sw{position:relative;width:54px;height:32px;border-radius:13px;border:1px solid var(--line);background:#070708;flex-shrink:0;padding:0;transition:all .2s}
.kx-sw::after{content:'';position:absolute;top:4px;left:4px;width:22px;height:22px;border-radius:50%;background:#6f6c64;transition:all .2s var(--ease)}
.kx-sw::before{content:'';position:absolute;inset:-7px -3px}
.kx-sw.on{background:rgba(211,191,162,.25);border-color:var(--line2)} .kx-sw.on::after{left:27px;background:var(--gold)}
.kx-range{width:100%;accent-color:#d3bfa2;height:32px;margin:0}
.kx-rail-f button{font-size:.7rem!important}
.kx-duo{display:flex;gap:4px}
.kx-duo .kx-nav{flex:1;min-width:0}
.kx-duo .kx-nav.sq{flex:0 0 38px;justify-content:center;padding:6px 0}
.kx-mini{display:flex;padding:2px;gap:2px;border-radius:10px;background:#070708;border:1px solid var(--line)}
.kx-mini button{white-space:nowrap;padding:6px 10px;border:0;border-radius:8px;background:transparent;color:var(--mute);font-size:0.65rem;font-weight:700;min-height:36px;min-width:38px}
.kx-mini button.on{background:rgba(211,191,162,.2);color:var(--gold)}
.kx-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:0 14px;border-radius:11px;border:1px solid var(--line2);background:rgba(211,191,162,.1);color:var(--gold);font-size:0.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;transition:all .18s var(--ease)}
.kx-btn:not(:disabled):hover{background:rgba(211,191,162,.18)} .kx-btn:disabled{opacity:.4}
.kx-btn.solid{border:0;background:linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78);color:#14110c;box-shadow:0 12px 28px -12px rgba(211,191,162,.55)}
.kx-btn.warn{border-color:rgba(226,154,88,.5);background:rgba(226,154,88,.12);color:#f0b87c}
.kx-btn.block{width:100%}

/* ── banners: arrivals, alerts, sound unlock ── */
.kx-toasts{position:fixed;top:calc(env(safe-area-inset-top) + 62px);left:50%;transform:translateX(-50%);z-index:60;display:flex;flex-direction:column;gap:8px;width:min(580px,calc(100vw - 24px));pointer-events:none}
.kx-toast{pointer-events:auto;display:flex;align-items:center;gap:10px;padding:8px 11px;border-radius:14px;background:var(--glass),#121110;border:1px solid var(--line2);box-shadow:0 24px 60px -18px rgba(0,0,0,.9),0 0 0 1px rgba(211,191,162,.06);cursor:pointer}
.kx-toast .ic{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;background:rgba(211,191,162,.14);border:1px solid var(--line2);color:var(--gold)}
.kx-toast.cancel{border-color:rgba(226,154,88,.55)} .kx-toast.cancel .ic{background:rgba(226,154,88,.14);border-color:rgba(226,154,88,.45);color:var(--amber)}
.kx-toast b{display:block;font-size:.7rem;font-weight:700;letter-spacing:.06em}
.kx-toast p{margin:1px 0 0;font-size:0.65rem;color:var(--mute);line-height:1.35;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}
.kx-toast b{overflow-wrap:anywhere}
.kx-feed{margin-top:8px;padding-top:8px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
.kx-toast.compact{padding:6px 8px;gap:8px;border-radius:11px;box-shadow:none}
.kx-toast.compact .ic{width:26px;height:26px;border-radius:8px}
.kx-toast.compact b{font-size:0.65rem;letter-spacing:.04em}
.kx-toast.compact p{font-size:0.65rem}
.kx-offline{display:flex;align-items:center;gap:12px;margin:8px 8px 0;padding:7px 11px;border-radius:13px;background:linear-gradient(160deg,rgba(226,154,88,.18),rgba(226,154,88,.06)),#16120e;border:1px solid rgba(226,154,88,.5);flex-shrink:0}
.kx-offline>div{flex:1;min-width:0}
.kx-offline b{display:block;font-size:.66rem;letter-spacing:.12em;color:#f2bd88}
.kx-offline span{display:block;margin-top:2px;font-size:0.65rem;color:#e8b98a;line-height:1.35}
.kx-undo{margin-left:auto;flex-shrink:0;padding:7px 14px;border-radius:9px;border:1px solid var(--line2);background:rgba(211,191,162,.18);color:var(--gold);font-size:0.65rem;font-weight:800;letter-spacing:.14em;min-height:36px}
.kx-undo:hover{background:rgba(211,191,162,.3)}
.kx-rc{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.03);text-align:left;min-height:40px}
.kx-rc:hover{border-color:var(--line2);background:rgba(211,191,162,.08)}
.kx-rc .n{font-weight:800;font-size:.82rem;min-width:54px}
.kx-rc .m{flex:1;font-size:0.65rem;color:var(--mute);min-width:0;overflow-wrap:anywhere}
.kx-rc .go{display:inline-flex;align-items:center;gap:4px;font-size:0.65rem;font-weight:800;letter-spacing:.1em;color:var(--gold)}
.kx-alerts{display:flex;flex-direction:column;gap:6px;margin:8px 8px 0;flex-shrink:0}
.kx-alert{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 11px;border-radius:13px;background:linear-gradient(160deg,rgba(226,154,88,.14),rgba(226,154,88,.05)),#16120e;border:1px solid rgba(226,154,88,.4)}
.kx-alert .l{display:flex;align-items:center;gap:12px;min-width:0}
.kx-alert .ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:rgba(226,154,88,.14);color:var(--amber);flex-shrink:0}
.kx-alert h3{margin:0;font-size:.72rem;font-weight:700;letter-spacing:.04em}
.kx-alert p{margin:2px 0 0;font-size:0.65rem;color:#e8b98a;line-height:1.4}
.kx-unlock{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 16px);transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:10px;padding:11px 18px;border-radius:999px;background:#15120d;border:1px solid var(--line2);color:var(--gold);font-size:.66rem;font-weight:700;letter-spacing:.12em;box-shadow:0 18px 44px rgba(0,0,0,.6);pointer-events:none;animation:kxBreath 2.4s ease-in-out infinite;white-space:nowrap;text-transform:uppercase}

/* ── layout ── */
.kx-body{flex:1;display:flex;gap:8px;padding:8px;min-height:0}
.kx-rail{width:200px;flex-shrink:0;display:flex;flex-direction:column;min-height:0;overflow:hidden;padding:10px 8px;border-radius:16px;background:var(--glass),#0d0d0e;border:1px solid var(--line)}
.kx-rail.drawer{position:fixed;left:0;top:0;bottom:0;z-index:100;width:290px;max-width:88vw;border-radius:0 22px 22px 0;padding-top:calc(env(safe-area-inset-top) + 16px)}
.kx-rail-h{display:flex;align-items:center;gap:8px;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid var(--line);flex-shrink:0}
.kx-rail-h .ic{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:rgba(211,191,162,.1);border:1px solid var(--line2);color:var(--gold)}
.kx-eyebrow{flex:1;font-size:0.65rem;letter-spacing:.26em;font-weight:700;color:var(--gold);opacity:.8;text-transform:uppercase}
.kx-rail-list{display:flex;flex-direction:column;gap:4px;overflow-y:auto;flex:1;min-height:0}
.kx-rail-f{flex-shrink:0;display:flex;flex-direction:column;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)}
.kx-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:34px;padding:6px 8px;border-radius:10px;border:1px solid transparent;background:transparent;color:#bdb6a8;font-size:0.65rem;font-weight:600;letter-spacing:.04em;text-align:left;transition:all .16s var(--ease)}
.kx-nav:hover{background:rgba(255,255,255,.04);color:var(--cream)}
.kx-nav.on{background:rgba(211,191,162,.12);border-color:var(--line2);color:var(--cream);box-shadow:inset 3px 0 0 var(--gold)}
.kx-nav .t{display:flex;align-items:center;gap:9px;min-width:0}
.kx-nav .t span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kx-nav .r{display:flex;align-items:center;gap:6px;flex-shrink:0}
.kx-ct{min-width:28px;padding:2px 8px;border-radius:8px;background:rgba(255,255,255,.07);color:var(--mute);font:700 0.65rem/1.5 'JetBrains Mono',monospace;text-align:center;flex-shrink:0;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kx-ct.hot{background:rgba(211,191,162,.2);color:var(--gold)}
.kx-navrow{display:flex;align-items:center;gap:4px}
.kx-navrow .kx-nav{flex:1;min-width:0;width:auto}
.kx-86{flex-shrink:0;background:transparent;width:36px;height:36px;border-radius:7px;display:grid;place-items:center;border:1px solid var(--line);color:var(--dim);transition:all .16s}
.kx-86:hover{border-color:rgba(226,154,88,.55);color:var(--amber)}
.kx-86.has{width:auto;min-width:36px;padding:0 6px;display:inline-flex;align-items:center;gap:3px;border-color:rgba(226,154,88,.55);color:var(--amber);background:rgba(226,154,88,.1)}
.kx-86 em{font:700 0.65rem 'JetBrains Mono',monospace;font-style:normal}
.kx-vegseg{display:flex;padding:3px;gap:2px;border-radius:13px;background:#070708;border:1px solid var(--line);margin-bottom:10px;flex-shrink:0}
.kx-vegseg button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:6px 4px;border:0;border-radius:9px;background:transparent;color:var(--mute);font-size:0.65rem;font-weight:700;letter-spacing:.06em;min-height:36px}
.kx-vegseg button.on.v{background:rgba(93,154,78,.18);color:#9fcb90} .kx-vegseg button.on.n{background:rgba(192,74,74,.18);color:#e29a9a}
.kx-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:8px}
.kx-ribbon{display:flex;align-items:center;gap:8px;flex-shrink:0;min-height:30px}
.kx-prep{display:flex;align-items:center;gap:8px;overflow-x:auto;min-width:0;flex:1;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent);padding-right:22px}
.kx-prep-l{display:flex;align-items:center;gap:6px;font-size:0.65rem;letter-spacing:.2em;font-weight:700;color:var(--gold);flex-shrink:0;text-transform:uppercase}
.kx-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.035);font-size:0.65rem;font-weight:600;white-space:nowrap;flex-shrink:0;color:#ddd5c6;min-height:34px;max-width:260px;overflow:hidden}
.kx-chip{cursor:pointer;font-family:inherit}
.kx-chip:hover{border-color:var(--line2);color:var(--cream)}
.kx-chip.on{background:rgba(211,191,162,.2);border-color:var(--gold);color:var(--cream)}
.kx-chip b{font:700 .7rem 'JetBrains Mono',monospace;color:var(--gold)}
.kx-chip .nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kx-filterbtn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px;border-radius:9px;border:1px solid var(--line2);background:rgba(211,191,162,.12);font-size:0.65rem;font-weight:700;letter-spacing:.1em;color:var(--gold);flex-shrink:0;white-space:nowrap;text-transform:uppercase}
.kx-filterbtn .slash{display:none}
.kx-filterbtn b{font:700 0.65rem 'JetBrains Mono',monospace;color:var(--cream)}
.kx-filterbtn:hover{background:rgba(211,191,162,.2)}
.kx-latebtn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px;border-radius:9px;border:1px solid rgba(226,154,88,.5);background:rgba(226,154,88,.1);font-size:0.65rem;font-weight:800;letter-spacing:.12em;color:#f0b87c;flex-shrink:0;text-transform:uppercase}
.kx-latebtn b{font:700 0.65rem 'JetBrains Mono',monospace}
.kx-latebtn.on{background:rgba(226,154,88,.28);border-color:var(--amber);color:#ffe2c0}
.kx-sortbtn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px;border-radius:9px;border:1px solid var(--line);background:rgba(255,255,255,.03);font-size:0.65rem;font-weight:700;letter-spacing:.12em;color:var(--mute);flex-shrink:0;text-transform:uppercase}
.kx-sortbtn:hover{color:var(--cream);border-color:var(--line2)}
.kx-search{display:flex;align-items:center;gap:8px;margin:8px 8px 0;padding:7px 12px;border-radius:12px;background:var(--glass),#0d0d0e;border:1px solid var(--line2);flex-shrink:0}
.kx-search input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:var(--cream);font-size:.8rem;min-height:32px}
.kx-search input::placeholder{color:var(--dim)}
.kx-health{border-radius:12px;border:1px solid var(--line);background:var(--glass),#0d0d0e;flex-shrink:0;overflow:hidden}
.kx-health-h{display:flex;align-items:center;gap:8px;width:100%;padding:6px 12px;border:0;background:transparent;text-align:left;min-height:38px;white-space:nowrap}
.kx-health-h .tt{font-size:0.65rem;letter-spacing:.22em;font-weight:700;color:var(--gold);text-transform:uppercase}
.kx-health-h .st{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:0.65rem;font-weight:700;letter-spacing:.08em;color:var(--gold)}
.kx-health-h .st.warn{color:var(--amber)}
.kx-health-b{padding:0 12px 10px;display:flex;flex-direction:column;gap:10px}
.kx-stg{display:grid;gap:8px}
.kx-stg>div{padding:9px 10px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.025)}
.kx-stg>div.bn{border-color:rgba(226,154,88,.4)}
.kx-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:6px}
.kx-bar i{display:block;height:100%;border-radius:2px;background:var(--gold2);transition:width .5s ease}
.kx-bar.bn i{background:var(--amber)}

/* ── board ── */
/* grid-auto-rows:max-content is what stops tickets overlapping: with the default auto rows a ticket (overflow:hidden + max-height) contributed almost no
   height to its row, so the rows collapsed and the next row slid over the ticket above it. */
.kx-grid{position:relative;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:grid;grid-template-columns:repeat(auto-fill,minmax(262px,1fr));grid-auto-rows:max-content;gap:10px;align-content:start;align-items:start;padding:2px 2px 14px}
.kx-grid>*{min-width:0}
.kx-grid .kx-tk{zoom:var(--kx-zoom,1)} /* ticket size setting: Small / Normal / Large */
.kx-center{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:70px 20px}
.kx-center .ic{width:72px;height:72px;border-radius:22px;display:grid;place-items:center;background:var(--glass),#0d0d0e;border:1px solid var(--line);color:var(--dim)}
.kx-center h3{margin:0;font-size:.9rem;font-weight:700;letter-spacing:.26em;color:var(--mute);text-transform:uppercase}
.kx-center p{margin:0;font-size:.7rem;color:var(--dim);font-weight:500;max-width:420px;line-height:1.55;word-break:break-word}
.kx-tk{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:16px;border:1px solid var(--line);background:var(--glass),#0f0e0d;box-shadow:0 16px 32px -24px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,255,255,.05);height:var(--kx-h,auto);max-height:460px;transition:border-color .3s}
.kx-tk::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--rail,rgba(211,191,162,.35));z-index:2}
.kx-tk.med{--rail:var(--gold)}
.kx-tk.high{--rail:var(--amber);border-color:rgba(226,154,88,.55)}
.kx-tk.swiggy{--rail:var(--swiggy)} .kx-tk.zomato{--rail:var(--zomato)}
.kx-tk.fresh{border-color:rgba(230,214,184,.85)}
/* glow = an overlay whose OPACITY pulses (cheap on tablets); animating box-shadow on every ticket repainted the whole board each frame */
.kx-tk::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;z-index:3}
.kx-tk.high::after{box-shadow:inset 0 0 0 1px rgba(226,154,88,.55),inset 0 0 24px rgba(226,154,88,.26);opacity:.65;animation:kxGlow 1.9s ease-in-out 5}
.kx-tk.fresh::after{box-shadow:inset 0 0 0 1px rgba(230,214,184,.9),inset 0 0 28px rgba(230,214,184,.3);animation:kxGlow 1.6s ease-in-out 5}
.kx-tk.fill{max-height:none;height:100%}
.kx-tk-h{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:9px 10px 5px 13px}
.kx-tk-type{display:inline-flex;align-items:center;gap:6px;font-size:.66rem;font-weight:700;letter-spacing:.18em;color:var(--gold);text-transform:uppercase}
.kx-tk-num{margin:2px 0 4px;font-size:1.5rem;font-weight:800;line-height:1.05;letter-spacing:-.02em;overflow-wrap:anywhere;word-break:break-word}
.kx-tk-num.sw{color:var(--swiggy)} .kx-tk-num.zo{color:var(--zomato)}
.kx-tk-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.kx-tag{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:6px;border:1px solid var(--line);background:rgba(255,255,255,.04);font-size:.67rem;font-weight:700;letter-spacing:.1em;color:#cfc7b8;text-transform:uppercase;white-space:nowrap;max-width:100%}
.kx-tag.gold{background:rgba(211,191,162,.16);border-color:var(--line2);color:var(--gold)}
.kx-tag.amber{background:rgba(226,154,88,.16);border-color:rgba(226,154,88,.45);color:#f0b87c}
.kx-tag.sw{color:var(--swiggy);border-color:rgba(252,128,25,.4);background:rgba(252,128,25,.1)}
.kx-tag.zo{color:#ef6a73;border-color:rgba(224,52,63,.4);background:rgba(224,52,63,.1)}
.kx-tag.id{font-family:'JetBrains Mono',monospace;color:var(--mute);letter-spacing:.04em}
.kx-time{position:relative;width:50px;height:50px;flex-shrink:0;display:grid;place-items:center}
.kx-time svg{position:absolute;inset:0;transform:rotate(-90deg)}
.kx-time .tv{position:relative;font:700 .66rem 'JetBrains Mono',monospace;letter-spacing:-.02em;font-size:.7rem}
.kx-time.high .tv{color:var(--amber)} .kx-time.med .tv{color:var(--gold)}
.kx-late{margin-top:2px;display:block;text-align:center;font-size:.66rem;font-weight:800;letter-spacing:.16em;color:var(--amber)}
.kx-strip{margin:0 8px 5px 12px;padding:4px 8px;border-radius:9px;font-size:.68rem;font-weight:600;line-height:1.4;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;overflow-wrap:anywhere}
.kx-strip.sw{background:rgba(252,128,25,.08);border:1px solid rgba(252,128,25,.28);color:#ffa760}
.kx-strip.zo{background:rgba(224,52,63,.08);border:1px solid rgba(224,52,63,.28);color:#f2848b}
.kx-strip.mod{display:block;background:rgba(226,154,88,.1);border:1px solid rgba(226,154,88,.4);color:#f0b87c}
.kx-prog{display:flex;align-items:center;gap:8px;margin:0 10px 5px 13px}
.kx-prog .bar{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}
.kx-prog .bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#b99f78,#e6d6b8);transition:width .4s var(--ease)}
.kx-prog span{font:700 0.65rem 'JetBrains Mono',monospace;color:var(--mute);font-size:.66rem}
.kx-prog span.ok{color:var(--gold)}
.kx-items{display:flex;flex-direction:column;gap:5px;padding:2px 6px 6px 11px;overflow-y:auto;flex:1 1 auto;min-height:0;scrollbar-width:thin;scrollbar-color:rgba(211,191,162,.35) transparent;background:linear-gradient(#0f0e0d 30%,rgba(15,14,13,0)) top/100% 22px no-repeat local,linear-gradient(rgba(15,14,13,0),#0f0e0d 70%) bottom/100% 22px no-repeat local,radial-gradient(farthest-side at 50% 0,rgba(211,191,162,.34),rgba(211,191,162,0)) top/100% 10px no-repeat scroll,radial-gradient(farthest-side at 50% 100%,rgba(211,191,162,.34),rgba(211,191,162,0)) bottom/100% 10px no-repeat scroll;background-color:#0f0e0d}
.kx-items::-webkit-scrollbar{width:4px}.kx-items::-webkit-scrollbar-thumb{background:rgba(211,191,162,.35);border-radius:2px}
.kx-it{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:start;padding:6px 8px;border-radius:11px;flex-shrink:0;background:rgba(255,255,255,.035);border:1px solid rgba(211,191,162,.12);cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;transition:all .16s var(--ease)}
.kx-it:hover{border-color:var(--line2)} .kx-it:active{transform:scale(.99)}
.kx-it.run{background:rgba(211,191,162,.06);border-color:rgba(211,191,162,.3)}
/* a dish the customer added or changed: the only highlighted row on a modified ticket */
.kx-it.mod{background:linear-gradient(160deg,rgba(226,154,88,.2),rgba(226,154,88,.07));border-color:rgba(226,154,88,.75);box-shadow:0 0 0 1px rgba(226,154,88,.25),0 0 18px -6px rgba(226,154,88,.55)}
.kx-it.mod .kx-qty{background:rgba(226,154,88,.2);border-color:rgba(226,154,88,.6);color:#f0b87c}
.kx-it.mod .kx-nm{color:#ffe2c0;font-size:.9rem}
.kx-it.done{background:transparent;opacity:.45}
.kx-qty{min-width:30px;height:30px;padding:0 5px;border-radius:9px;display:grid;place-items:center;font:700 .88rem 'JetBrains Mono',monospace;background:rgba(211,191,162,.14);border:1px solid rgba(211,191,162,.3);color:var(--gold)}
.kx-it.done .kx-qty{background:rgba(255,255,255,.04);border-color:var(--line);color:var(--dim)}
.kx-it-b{min-width:0;overflow-wrap:anywhere}
.kx-nm{display:flex;align-items:center;flex-wrap:wrap;gap:5px;font-size:.84rem;font-weight:600;line-height:1.25;color:var(--cream)}
.kx-it.done .kx-nm{text-decoration:line-through;color:var(--mute)}
.kx-nm .sp{display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:7px;background:rgba(211,191,162,.18);color:var(--gold)}
.kx-sub{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:3px;font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.kx-sub .half{color:var(--gold)}
.kx-tm{display:inline-flex;align-items:center;gap:3px;font:700 .68rem 'JetBrains Mono',monospace;color:var(--gold2);letter-spacing:0;font-size:.68rem;text-transform:none}
.kx-tm.slow::after{content:'\\26A0  SLOW'}  /* drawn by CSS: no extra elements on every dish */
.kx-tm.slow{padding:2px 7px;border-radius:7px;background:rgba(226,154,88,.16);border:1px solid rgba(226,154,88,.45);color:#f0b87c}
.kx-hint{margin-top:3px;font-size:0.65rem;color:var(--dim);font-style:italic}
.kx-note{display:flex;align-items:flex-start;gap:6px;margin-top:5px;padding:4px 7px;border-radius:8px;background:rgba(226,154,88,.12);border:1px solid rgba(226,154,88,.42);color:#f2bd88;font-size:.74rem;font-weight:600;line-height:1.38}
.kx-note svg{flex-shrink:0;margin-top:2px}
.kx-note span{min-width:0;overflow-wrap:anywhere}
.kx-chk{width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(211,191,162,.42);display:grid;place-items:center;color:#14110c;flex-shrink:0;margin-top:3px;transition:all .16s var(--ease)}
.kx-it.done .kx-chk{background:var(--gold);border-color:var(--gold)}
.kx-vd{width:13px;height:13px;border-radius:3px;border:1.6px solid var(--veg);display:inline-grid;place-items:center;flex-shrink:0}
.kx-vd i{width:5px;height:5px;border-radius:50%;background:var(--veg)}
.kx-vd.n{border-color:var(--nonveg)} .kx-vd.n i{border-radius:0;background:transparent;width:0;height:0;border-left:3.5px solid transparent;border-right:3.5px solid transparent;border-bottom:6px solid var(--nonveg)}
.kx-tk-f{display:flex;flex-direction:column;gap:6px;padding:7px 8px 8px 12px;border-top:1px solid rgba(211,191,162,.1);flex-shrink:0}
.kx-tk-f .row{display:flex;gap:6px}
.kx-notebox{display:flex;gap:6px;align-items:flex-start;margin:0 8px 0 12px;padding:6px 9px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--line)}
.kx-notebox textarea{flex:1;background:transparent;border:0;outline:0;resize:none;color:var(--cream);font-size:.7rem;line-height:1.4;min-height:40px}
.kx-sq{width:38px;min-height:38px;border-radius:11px;border:1px solid var(--line);background:rgba(255,255,255,.04);display:grid;place-items:center;color:#cfc7b8;flex-shrink:0;transition:all .16s var(--ease)}
.kx-sq:not(:disabled):hover{border-color:var(--line2);color:var(--gold)} .kx-sq:not(:disabled):active{transform:scale(.95)}
.kx-sq.on{border-color:var(--line2);color:var(--gold);background:rgba(211,191,162,.12)}
.kx-go{flex:1;min-height:38px;padding:0 10px;border-radius:11px;border:0;display:flex;align-items:center;justify-content:center;gap:7px;font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#14110c;background:linear-gradient(135deg,#e6d6b8 0%,#d3bfa2 45%,#b99f78 100%);box-shadow:0 14px 30px -14px rgba(211,191,162,.6),inset 0 1px 0 rgba(255,255,255,.5);transition:transform .16s var(--ease),filter .16s}
.kx-go:not(:disabled):hover{filter:brightness(1.06)} .kx-go:not(:disabled):active{transform:scale(.98)}
.kx-go.late{background:linear-gradient(135deg,#f3c18a,#e29a58 55%,#c97a35);box-shadow:0 14px 30px -14px rgba(226,154,88,.6),inset 0 1px 0 rgba(255,255,255,.4)}

/* ── summary + metrics ── */
.kx-sum{display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:9px}
.kx-sumc{padding:12px 9px 10px;border-radius:14px;text-align:center;background:var(--glass),#0e0e0f;border:1px solid var(--line);border-top:2px solid var(--line2)}
.kx-sumc.p{border-color:var(--line2);border-top-color:var(--gold)}
.kx-sumc b{display:block;font:700 1.8rem/1 'JetBrains Mono',monospace;color:var(--gold);margin-bottom:6px}
.kx-sumc .n{font-size:0.65rem;font-weight:600;color:#d8d1c3;line-height:1.3;margin-bottom:6px;text-transform:uppercase;letter-spacing:.03em;overflow-wrap:anywhere}
.kx-metrics{flex:1;min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 20px;border-radius:24px;background:var(--glass),#0d0d0e;border:1px solid var(--line)}
.kx-metrics h2{margin:0;font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;font-weight:700;letter-spacing:.04em}
.kx-metrics>p{margin:0 0 20px;font-size:.66rem;color:var(--mute);letter-spacing:.06em}
.kx-mtiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px;width:100%;max-width:860px;margin-bottom:18px}
.kx-mt{padding:16px 10px;border-radius:14px;text-align:center;background:#0b0b0c;border:1px solid var(--line);border-top:2px solid var(--gold)}
.kx-mt span{display:block;font-size:0.65rem;letter-spacing:.2em;font-weight:700;color:var(--mute);text-transform:uppercase;margin-bottom:10px}
.kx-mt b{display:block;font:700 1.8rem/1 'JetBrains Mono',monospace;color:var(--gold)} .kx-mt b.sm{font-size:1.3rem;padding:.3rem 0}
.kx-mt small{display:block;margin-top:8px;font-size:0.65rem;color:var(--dim)}

/* ── mobile ── */
.kx-dots{display:flex;justify-content:center;gap:0;flex-wrap:wrap;flex-shrink:0;padding:0 20px}
.kx-dots button{display:inline-flex;align-items:center;justify-content:center;padding:0 4px;height:28px;min-width:20px;border:0;background:none;cursor:pointer}
.kx-dots button::before{content:'';height:6px;width:6px;border-radius:3px;background:#3a3a3a;transition:all .25s}
.kx-dots button.on::before{width:22px;background:var(--gold)}
.kx-dots i{height:6px;width:6px;border-radius:3px;background:#262626;transition:all .25s;cursor:pointer}
.kx-dots i.on{width:22px;background:var(--gold)}
.kx-pager{display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.kx-pager button{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.04);font-size:.7rem;font-weight:700;letter-spacing:.1em}
.kx-pager button:disabled{opacity:.25}
.kx-bnav{display:flex;gap:3px;margin:0 10px 10px;padding:4px;border-radius:20px;background:var(--glass),#0d0d0e;border:1px solid var(--line);flex-shrink:0}
.kx-bnav button{white-space:nowrap;flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;min-height:46px;padding:7px 2px;border:0;border-radius:16px;background:transparent;color:var(--mute);font-size:0.65rem;font-weight:700;letter-spacing:.08em}
.kx-bnav button.on{background:rgba(211,191,162,.16);color:var(--gold)}
.kx-bnav button .n{font:700 0.65rem 'JetBrains Mono',monospace;color:var(--gold)}

/* ── side sheet (wastage) + modal (86) ── */
.kx-scrim{position:fixed;inset:0;background:rgba(4,4,4,.62);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
.kx-sheet{position:fixed;right:0;top:0;bottom:0;z-index:3001;display:flex;flex-direction:column;overflow:hidden;background:var(--glass),#0d0d0e;border-left:1px solid var(--line2);border-radius:24px 0 0 24px}
.kx-sheet-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line);flex-shrink:0}
.kx-sheet-h .t{display:flex;align-items:center;gap:12px}
.kx-sheet-h .ic{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:rgba(211,191,162,.1);border:1px solid var(--line2);color:var(--gold)}
.kx-sheet-h h3{margin:0;font-size:.8rem;font-weight:700;letter-spacing:.08em}
.kx-sheet-h small{display:block;margin-top:3px;font-size:0.65rem;letter-spacing:.18em;color:var(--mute);text-transform:uppercase;font-weight:600}
.kx-tabs{display:flex;border-bottom:1px solid var(--line);flex-shrink:0}
.kx-tabs button{flex:1;padding:10px 0;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--mute);font-size:0.65rem;font-weight:700;letter-spacing:.16em}
.kx-tabs button.on{color:var(--gold);border-bottom-color:var(--gold)}
.kx-card{padding:12px;border-radius:14px;background:#0a0a0b;border:1px solid var(--line);display:flex;flex-direction:column;gap:10px}
.kx-card>.hd{font-size:0.65rem;letter-spacing:.22em;font-weight:700;color:var(--mute);text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid var(--line)}
.kx-lbl{display:block;margin-bottom:6px;font-size:0.65rem;font-weight:700;letter-spacing:.16em;color:var(--mute);text-transform:uppercase}
.kx-in{width:100%;padding:8px 11px;border-radius:10px;border:1px solid var(--line);background:#070708;color:var(--cream);font-size:.76rem;outline:0;transition:border-color .16s,box-shadow .16s}
.kx select.kx-in{background-color:#070708;color:var(--cream);color-scheme:dark}
.kx-in:focus{border-color:var(--line2);box-shadow:0 0 0 4px rgba(211,191,162,.08)}
.kx-in option{background:#0d0d0e;color:var(--cream)}
.kx-pill{padding:7px 12px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--mute);font-size:0.65rem;font-weight:700;min-height:36px}
.kx-pill.on{border-color:var(--line2);background:rgba(211,191,162,.16);color:var(--gold)}
.kx-ent{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:9px 11px;border-radius:12px;background:#0a0a0b;border:1px solid var(--line);border-left:3px solid var(--gold2)}
.kx-modalwrap{position:fixed;inset:0;z-index:3101;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
.kx-modal{margin:auto;display:flex;flex-direction:column;overflow:hidden;border-radius:24px;background:var(--glass),#0f0f10;border:1px solid var(--line2);box-shadow:0 40px 90px -20px rgba(0,0,0,.95)}
.kx-opt{display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;border-radius:11px;border:1px solid var(--line);background:transparent;color:#cfc7b8;font-size:.72rem;font-weight:600;text-align:left;min-height:38px;transition:all .15s}
.kx-opt.on{border-color:var(--line2);background:rgba(211,191,162,.14);color:var(--gold)}
.kx-err{font-size:.7rem;color:#e9a57a;font-weight:600}

/* ── skeleton ── */
.kx-sk{position:relative;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,.055);border-radius:7px}
.kx-sk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(100deg,transparent 15%,rgba(233,220,195,.12) 50%,transparent 85%);animation:kxSweep 1.7s cubic-bezier(.45,0,.25,1) infinite;animation-delay:var(--d,0s)}

/* ── motion ── */
@keyframes kxRing{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(2.7);opacity:0}}
@keyframes kxEq{0%,100%{height:3px}50%{height:14px}}
@keyframes kxBreath{0%,100%{opacity:.75}50%{opacity:1}}
@keyframes kxGlow{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes kxSweep{to{transform:translateX(100%)}}
@keyframes kxSpin{to{transform:rotate(360deg)}}
.kx .spin{animation:kxSpin 1s linear infinite}

/* ── responsive ── */
.kx-mdot{display:none}
@media (max-width:1320px){.kx-stat.opt{display:none}}
@media (max-width:1100px){.kx-stats{display:none}.kx-acts{margin-left:auto}.kx-seg button span.lb{display:none}.kx-seg button{padding:5px 9px}}
@media (max-width:980px){.kx-brand-t{display:none}.kx-hide-md{display:none!important}.kx-toasts{top:calc(env(safe-area-inset-top) + 62px)}}
/* newer-CSS upgrades, only where the browser understands them (older kitchen tablets keep the plain fallbacks above) */
@supports (width:min(1px,2px)){.kx-grid{grid-template-columns:repeat(auto-fill,minmax(min(var(--kx-col,262px),100%),1fr))}.kx-tk{max-height:var(--kx-maxh,min(460px,max(230px,calc(100vh - 175px))))}}
@supports (width:min(1px,2px)) and (height:100dvh){.kx-tk{max-height:var(--kx-maxh,min(460px,max(230px,calc(100dvh - 175px))))}}
@media (max-height:600px){.kx-rail{overflow-y:auto}.kx-rail-list{flex:none;overflow:visible}}
@media (max-height:520px){.kx-health,.kx-ribbon{display:none}.kx-tk{--kx-maxh:max(230px,calc(100vh - 112px))}.kx-top{padding-top:4px;padding-bottom:4px}}
.kx-ib.attn{border-color:rgba(226,154,88,.6);color:var(--amber);background:rgba(226,154,88,.1);animation:kxBreath 2s ease-in-out infinite}
@media (max-width:599px){
  .kx-row.stack{flex-direction:column;align-items:stretch;gap:8px}
  .kx-row.stack .kx-mini{width:100%}
  .kx-row.stack .kx-mini button{flex:1}
  .kx-prep-l{display:none}
  .kx-latebtn .lbl,.kx-sortbtn .lbl,.kx-filterbtn .lbl{display:none}
  .kx-filterbtn .slash{display:inline}
  .kx-latebtn,.kx-sortbtn,.kx-filterbtn{padding:0 9px;gap:4px}
  .kx-health-h .tt{overflow:hidden;text-overflow:ellipsis}
  .kx-health-h .st{min-width:0;overflow:hidden;text-overflow:ellipsis}
  .kx-top{margin:6px 6px 0;padding:5px 7px;gap:6px;border-radius:14px}
  .kx-logo img{width:76px} .kx-acts{gap:4px} .kx-mdot{display:inline-block}
  .kx-ib{height:36px;min-width:36px;padding:0 8px}
  .kx-body{padding:6px;gap:6px} .kx-main{gap:6px}
  .kx-tk{--kx-maxh:none} .kx-tk-num{font-size:1.7rem} .kx-nm{font-size:.94rem} .kx-qty{min-width:34px;height:34px;font-size:1rem} .kx-it{padding:8px 9px} .kx-chk{width:24px;height:24px}
  .kx-go{min-height:44px;font-size:.74rem} .kx-sq{width:44px;min-height:44px}
  .kx-mtiles{grid-template-columns:1fr} .kx-pop{position:fixed;left:8px;right:8px;top:56px;width:auto}
  .kx-toasts{top:calc(env(safe-area-inset-top) + 56px)}
  .kx-unlock{bottom:calc(env(safe-area-inset-bottom) + 76px);white-space:normal;text-align:center;width:calc(100vw - 24px);justify-content:center;border-radius:14px}
  .kx-bnav{margin:0 6px 6px} .kx-bnav button{font-size:.65rem;letter-spacing:0;padding-left:1px;padding-right:1px}
}
@media (max-width:359px){.kx-top{gap:4px;padding:5px;margin:5px 5px 0}.kx-logo{padding:3px 5px}.kx-logo img{width:60px}.kx-logo-txt{letter-spacing:.08em}.kx-ib{min-width:34px;padding:0 6px}.kx-acts{gap:3px}.kx-stat{min-width:46px;padding:3px 6px}.kx-brand{gap:4px}}
/* short phones (e.g. 320x568): the ticket scrolls as a whole and keeps Complete pinned at the bottom, instead of cutting the button off */
@media (max-width:599px) and (max-height:700px){.kx-tk.fill{overflow-y:auto}.kx-tk.fill .kx-items{overflow:visible;flex:none;background:none}.kx-tk.fill .kx-tk-f{position:sticky;bottom:0;z-index:4;background:#0f0e0d}}
@media (prefers-reduced-motion:reduce){.kx *,.kx *::before,.kx *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const KitchenViewInner = () => {
  const { tenantId } = useParams();

  useEffect(() => {
    if (tenantId) {
      try { localStorage.setItem('kitchen_tenant_id', tenantId); } catch { /* storage blocked */ }
    }
  }, [tenantId]);
  const { w } = useWindowSize();

  const isMobile = w < 600;
  const isSmallTablet = w >= 600 && w < 840;
  const isLargeTablet = w >= 840 && w < 1200;
  const isTablet = w >= 600 && w < 1200;

  /* ── state ── */
  const [orders, setOrders] = useState([]);
  const [recallQueue, setRecallQueue] = useState([]);
  const [isAggregateView, setIsAggregateView] = useState(false);
  const [isNonVegMode, setIsNonVegModeState] = useState(() => { try { return localStorage.getItem(`kds_nonveg_${tenantId}`) === '1'; } catch { return false; } });
  const setIsNonVegMode = v => { setIsNonVegModeState(v); try { localStorage.setItem(`kds_nonveg_${tenantId}`, v ? '1' : '0'); } catch { /* ignore */ } };
  const [tenantOnlyVeg, setTenantOnlyVeg] = useState(true);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stationFilter, setStationFilter] = useState('ALL');
  // ticked dishes, kept PER TICKET: { orderId: { dishIndex: true } }. Ticking a dish replaces only that ticket's slice, so only that ticket re-renders.
  const [checkedItemsGlobal, setCheckedItemsGlobal] = useState({});
  const setChecked = useCallback((orderId, idx, value) => {
    const id = String(orderId);
    setCheckedItemsGlobal(prev => {
      const cur = prev[id];
      if (!!(cur && cur[idx]) === !!value) return prev;
      const slice = { ...(cur || {}) };
      if (value) slice[idx] = true; else delete slice[idx];
      const next = { ...prev };
      if (Object.keys(slice).length) next[id] = slice; else delete next[id];
      return next;
    });
  }, []);
  const [interceptedAlerts, setInterceptedAlerts] = useState([]);
  // 'loading' until the first ticket fetch answers; 'error' if it failed. Before this the board showed "KITCHEN CLEAR" while loading.
  const [boardState, setBoardState] = useState('loading');
  const [boardError, setBoardError] = useState(''); // what the server actually answered when the board could not load
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [showMetricsDashboard, setShowMetricsDashboard] = useState(false);
  const [eightySixModal, setEightySixModal] = useState(null); // { categoryKey, categoryName }
  const [selectedDish86, setSelectedDish86] = useState(null);
  const [selectedReason86, setSelectedReason86] = useState('ran_out');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileCardIndex, setMobileCardIndex] = useState(0);
  const [completedTicketsCount, setCompletedTicketsCount] = useState(0);
  const [totalProcessingTime, setTotalProcessingTime] = useState(0);
  const [showWastagePanel, setShowWastagePanel] = useState(false);
  const [wastageTab, setWastageTab] = useState('log');
  const [wastageForm, setWastageForm] = useState({ itemName: '', inventoryId: null, quantity: '', unit: 'kg', reason: 'Spoiled / Expired', loggedBy: '', notes: '' });
  const [wastageSuggestions, setWastageSuggestions] = useState([]);
  const [showWastageSuggest, setShowWastageSuggest] = useState(false);
  const [wastageInventory, setWastageInventory] = useState([]);
  const [wastageLog, setWastageLog] = useState([]);
  const [wastageAnalytics, setWastageAnalytics] = useState(null);
  const [wastageSaving, setWastageSaving] = useState(false);
  const [wastageError, setWastageError] = useState('');
  const [wastageLoading, setWastageLoading] = useState(false);
  const [kitchenHealth, setKitchenHealth] = useState(null);
  const [healthOpen, setHealthOpen] = useState(false);
  const [serverKdsToday, setServerKdsToday] = useState(null); // { count, avgSeconds } from the database
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [processingOrderIds, setProcessingOrderIds] = useState(new Set());
  const [sortOldest, setSortOldest] = useState(() => { try { return localStorage.getItem('kds_sort_oldest') === '1'; } catch { return false; } });

  /* realtime / voice state */
  const [voicePrefs, setVoicePrefs] = useState(loadVoicePrefs);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [display, setDisplay] = useState(loadDisplay);          // ticket size + delayed / overdue limits (this device)
  const [showSettings, setShowSettings] = useState(false);
  const [lateIds, setLateIds] = useState(() => new Set());      // tickets older than the overdue limit
  const [showLateOnly, setShowLateOnly] = useState(false);
  const [dishFilter, setDishFilter] = useState('');            // show only tickets that contain this dish (tap a chip in the prep queue)
  const [showRecall, setShowRecall] = useState(false);
  const [offlineLong, setOfflineLong] = useState(false);        // the live connection has been down for a few seconds
  const [voiceList, setVoiceList] = useState([]);
  const [awakeOn, setAwakeOn] = useState(false);                // the screen wake lock is held
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundMissed, setSoundMissed] = useState(false); // a ticket arrived (or speech was refused) before the browser allowed sound
  const [freshIds, setFreshIds] = useState(() => new Set()); // tickets that arrived in the last few seconds
  const [toasts, setToasts] = useState([]);
  const [modInfo, setModInfo] = useState({});                // orderId -> what the customer changed (highlighted on the ticket until the dish is done)                   // "new ticket" / "cancelled" call-outs

  /* ── refs ── */
  const socketRef = useRef(null);
  const ordersRef = useRef([]);
  const voicePrefsRef = useRef(voicePrefs);
  const abortRef = useRef(null);            // cancels downloads when the screen closes
  const inflightRef = useRef(null);         // the download running right now
  const queuedRef = useRef(null);           // one follow-up download, merged from any requests that arrived meanwhile
  const healthAtRef = useRef({ health: 0, summary: 0 });
  const metaLoadingRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const seenIdsRef = useRef(new Set());      // every ticket this screen has already shown (so a poll never re-announces one)
  const initialLoadRef = useRef(false);
  const dispatchedRef = useRef(new Set());   // tickets dispatched here a moment ago: a slow in-flight fetch must not bring them back
  const reconcileRef = useRef(null);
  const timersRef = useRef([]);
  const confirm86Busy = useRef(false);
  const recentSocketRef = useRef(new Map()); // id -> { order, ts }: tickets the socket delivered in the last 20 s (a slower fetch must not drop them)
  const sortOldestRef = useRef(false);
  const displayRef = useRef(display);
  const recallQueueRef = useRef([]);
  const handleRecallRef = useRef(null);
  const alertedLateRef = useRef(new Set());  // tickets already announced as overdue
  const lateSeededRef = useRef(false);
  const checkLateRef = useRef(null);
  const gridRef = useRef(null);
  const anchorRef = useRef(null);
  const scrollTopRef = useRef(0);         // from scroll events: reading scrollTop directly forces the browser to re-lay-out the whole board          // the ticket at the top of the visible board and how far down it sits
  const audioUnlockedRef = useRef(false);
  const metaLoadedRef = useRef(false);      // categories / menu / tenant have been loaded at least once
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { sortOldestRef.current = sortOldest; }, [sortOldest]);
  useEffect(() => { recallQueueRef.current = recallQueue; }, [recallQueue]);
  // a short connection blip is not worth a banner: only after it has lasted a few seconds
  useEffect(() => {
    if (isOnline) { setOfflineLong(false); return undefined; }
    const t = setTimeout(() => setOfflineLong(true), 4000);
    return () => clearTimeout(t);
  }, [isOnline]);
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); clearTimeout(reconcileRef.current); }, []);
  const later = (fn, ms) => {
    const h = setTimeout(() => { timersRef.current = timersRef.current.filter(x => x !== h); fn(); }, ms);
    timersRef.current.push(h);
    return h;
  };

  /* ── sound / voice setup ──
     Browsers refuse all audio and speech until the page has had one user gesture. On a kiosk/tablet that reloads without a tap
     the announcements would be silently swallowed, so a banner stays up until the first touch; it is the browser's rule, not a mode. */
  const [audioUnlocked, setAudioUnlocked] = useState(() => { try { return navigator.userActivation ? !!navigator.userActivation.hasBeenActive : false; } catch { return false; } });
  useEffect(() => { audioUnlockedRef.current = audioUnlocked; }, [audioUnlocked]);
  useEffect(() => {
    if (audioUnlocked) return undefined;
    const unlock = () => {
      setAudioUnlocked(true); setSoundMissed(false);
      const waiting = ordersRef.current.filter(o => (o.items || []).some(isKitchenItem)).length;
      const p = voicePrefsRef.current;
      if (waiting > 0 && p.voice) speechEngine.say(`Kitchen connected. ${waiting} ${waiting === 1 ? 'ticket' : 'tickets'} waiting.`, { rate: p.rate, volume: p.volume, voiceName: p.voiceName });
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, [audioUnlocked]);

  useEffect(() => {
    speechEngine.onState = setSpeaking;
    speechEngine.onBlocked = () => { setAudioUnlocked(false); setSoundMissed(true); }; // the browser refused to speak: ask for a tap again
    const syncVoices = () => {
      speechEngine.refreshVoices();
      const list = speechEngine.voices.map(v => ({ name: v.name, lang: v.lang }));
      list.sort((a, b) => (/^en/i.test(b.lang) ? 1 : 0) - (/^en/i.test(a.lang) ? 1 : 0) || a.name.localeCompare(b.name));
      setVoiceList(list.slice(0, 60));
    };
    syncVoices();
    try { if (speechEngine.supported()) window.speechSynthesis.onvoiceschanged = syncVoices; } catch { /* ignore */ }
    return () => {
      speechEngine.onState = null; speechEngine.onBlocked = null; speechEngine.stop();
      try { if (speechEngine.supported()) window.speechSynthesis.onvoiceschanged = null; } catch { /* ignore */ }
    };
  }, []);

  const updateVoicePrefs = patch => {
    const next = { ...voicePrefsRef.current, ...patch };
    voicePrefsRef.current = next;
    setVoicePrefs(next);
    try { localStorage.setItem(VOICE_PREF_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  };

  const updateDisplay = patch => {
    const n = { ...displayRef.current, ...patch };
    if (n.warnSec >= n.lateSec) {   // "delayed" must come before "overdue": move the other limit out of the way
      if ('warnSec' in patch) n.lateSec = (LATE_OPTIONS.find(([, s]) => s > n.warnSec) || LATE_OPTIONS[LATE_OPTIONS.length - 1])[1];
      else n.warnSec = ([...WARN_OPTIONS].reverse().find(([, s]) => s < n.lateSec) || WARN_OPTIONS[0])[1];
    }
    displayRef.current = n;
    setDisplay(n);
    try { localStorage.setItem(DISPLAY_KEY, JSON.stringify(n)); } catch { /* storage blocked */ }
  };

  // opts.force: speak even if spoken details are switched off (the speaker button / test). opts.interrupt: cut off what is being said.
  const announce = (text, opts = {}) => {
    const p = voicePrefsRef.current;
    if (!opts.force && !p.voice) return;
    speechEngine.say(text, { repeat: opts.force ? 1 : p.repeat, rate: p.rate, interrupt: !!opts.interrupt, volume: p.volume, voiceName: p.voiceName });
  };
  const speakTicket = order => announce(buildTicketSpeech(order, { replay: true }), { force: true, interrupt: true });
  const speakTicketRef = useRef(speakTicket);
  useEffect(() => { speakTicketRef.current = speakTicket; });
  const onSpeakStable = useCallback(o => speakTicketRef.current(o), []);

  const pushToast = t => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [{ id, ...t }, ...prev].slice(0, 3));
    later(() => setToasts(prev => prev.filter(x => x.id !== id)), t.ttl || 9000);
  };
  const markFresh = id => {
    const k = String(id);
    setFreshIds(prev => new Set(prev).add(k));
    later(() => setFreshIds(prev => { const n = new Set(prev); n.delete(k); return n; }), 14000);
  };

  // One place for "a ticket just reached the kitchen": highlight, call-out card, chime, then the spoken details.
  const arriveTicket = (order, { chime = true } = {}) => {
    if (!audioUnlockedRef.current) setSoundMissed(true);
    markFresh(order._id);
    const kitchenItems = (order.items || []).filter(isKitchenItem);
    pushToast({ kind: 'new', title: `NEW TICKET · ${ticketLabel(order)}`, body: kitchenItems.map(i => `${Number(i.quantity) || 1}× ${i.name}`).join(', ') });
    const otype = getOrderType(order);
    const agg = otype === 'swiggy' || otype === 'zomato';
    const p = voicePrefsRef.current;
    const ring = p.chime && chime;
    if (ring) playAlertSound(agg ? 'aggregator' : 'order');
    later(() => announce(buildTicketSpeech(order)), ring ? (agg ? 1600 : 1100) : 0);
  };

  /* ── data loading ──
     • one download at a time: a request that arrives while another is running is merged into ONE follow-up (a burst of socket events, a
       reconnect and a wake-up used to start three identical downloads together)
     • tickets appear as soon as the order list (and the tiny restaurant record) arrive; the big menu / category lists load beside it
     • kitchen health and today's totals are asked for at most every 30 s / 60 s, not after every single refresh
     • a refresh whose data is identical to what is on screen changes nothing (no re-render) */
  const fetchHealth = ({ summary = false } = {}) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const now = Date.now();
    const last = healthAtRef.current;
    const signal = abortRef.current?.signal;
    if (now - last.health > 30000) {
      last.health = now;
      axios.get(`${BASE_URL}/admin/analytics/kitchen-health/${tenantId}`, { timeout: 12000, signal })
        .then(r => setKitchenHealth(prev => (prev && JSON.stringify(prev) === JSON.stringify(r.data)) ? prev : r.data))
        .catch(() => { /* optional panel */ });
    }
    if (summary || now - last.summary > 60000) {
      last.summary = now;
      axios.get(`${BASE_URL}/admin/kds/today-summary/${tenantId}`, { timeout: 12000, signal })
        .then(s => { if (s.data && Number.isFinite(Number(s.data.count))) setServerKdsToday(prev => (prev && prev.count === s.data.count && prev.avgSeconds === s.data.avgSeconds) ? prev : s.data); })
        .catch(() => { /* falls back to the local counters */ });
    }
  };

  const loadMeta = () => {
    if (metaLoadingRef.current) return;
    metaLoadingRef.current = true;
    const signal = abortRef.current?.signal;
    Promise.all([
      axios.get(`${BASE_URL}/categories/${tenantId}`, { timeout: 8000, signal }),
      axios.get(`${BASE_URL}/menu/${tenantId}`, { timeout: 8000, signal }),
    ]).then(([cat, menu]) => { setCategories(cat.data || []); setMenuItems(menu.data || []); metaLoadedRef.current = true; })
      .catch(() => { /* tried again on the next full refresh */ })
      .finally(() => { metaLoadingRef.current = false; });
  };

  const runFetch = async full => {
    const signal = abortRef.current?.signal;
    try {
      const [ordersRes, tenantRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`, { timeout: 15000, signal }), // a request that never answers used to freeze the whole board on its skeleton forever
        full ? axios.get(`${BASE_URL}/tenant/${tenantId}`, { timeout: 8000, signal }).catch(() => ({ data: null })) : null,
      ]);
      lastFetchAtRef.current = Date.now();
      const incoming = [...(ordersRes.data || [])]
        .filter(o => !dispatchedRef.current.has(String(o._id)))
        .sort((a, b) => createdMs(b) - createdMs(a));
      const incomingIds = new Set(incoming.map(o => String(o._id)));

      // Tickets this screen has never shown (the socket was down, or the tablet was asleep) are announced like any other.
      const firstLoad = !initialLoadRef.current;
      const unseen = incoming.filter(o => !seenIdsRef.current.has(String(o._id)));
      incomingIds.forEach(id => seenIdsRef.current.add(id));
      if (seenIdsRef.current.size > 1500) seenIdsRef.current = new Set(incomingIds); // a long shift must not grow this forever
      initialLoadRef.current = true;
      if (!firstLoad) {
        unseen
          .filter(o => (!o.status || o.status === 'pending') && (o.items || []).some(isKitchenItem))
          .slice(0, 5).reverse().forEach((o, i) => arriveTicket(o, { chime: i === 0 })); // one chime for a whole batch
      }

      // A socket ticket that is newer than this response's snapshot would vanish for a moment: keep it (max 20 s) until the server lists it.
      const nowMs = Date.now();
      const kept = [];
      recentSocketRef.current.forEach((v, id) => {
        if (nowMs - v.ts > 20000) { recentSocketRef.current.delete(id); return; }
        if (!incomingIds.has(id) && !dispatchedRef.current.has(id)) kept.push(v.order);
      });
      const nextOrders = kept.length ? [...kept, ...incoming].sort((a, b) => createdMs(b) - createdMs(a)) : incoming;
      setBoardState('ready'); setBoardError(''); setLastLoadedAt(Date.now());
      setOrders(prev => reuseOrders(prev, nextOrders));
      setModInfo(prev => { const live = new Set(nextOrders.map(o => String(o._id))); const dead = Object.keys(prev).filter(k => !live.has(k)); if (!dead.length) return prev; const n = { ...prev }; dead.forEach(k => delete n[k]); return n; });
      if (tenantRes?.data?.name) setTenantName(tenantRes.data.name);
      if (tenantRes?.data?.config?.onlyVeg !== undefined) setTenantOnlyVeg(tenantRes.data.config.onlyVeg);

      // Rehydrate the ticked dishes from the persisted server state, not only the old local flag.
      // Otherwise a reload/device switch makes completed dishes look unfinished.
      const hydration = {};
      incoming.forEach(o => (o.items || []).forEach((item, idx) => { if (item.isCrossedLocal || item.kdsCompletedAt) (hydration[String(o._id)] ||= {})[idx] = true; }));
      setCheckedItemsGlobal(prev => {
        // Keep the local value of any dish whose save is still in flight; the server does not know about it yet.
        pendingToggles.forEach(({ o, i }) => {
          if (!incomingIds.has(o)) return;
          if (prev[o] && prev[o][i]) (hydration[o] ||= {})[i] = true; else if (hydration[o]) delete hydration[o][i];
        });
        const out = {};
        let changed = false;
        Object.keys(hydration).forEach(id => {
          if (!Object.keys(hydration[id]).length) return;
          if (prev[id] && sameKeys(prev[id], hydration[id])) out[id] = prev[id]; else { out[id] = hydration[id]; changed = true; }
        });
        return (!changed && Object.keys(out).length === Object.keys(prev).length) ? prev : out;
      });
      if (full || !metaLoadedRef.current) loadMeta();
      fetchHealth();
    } catch (err) {
      if (err && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED')) return; // the screen was closed / switched while loading
      console.error('KDS fetch:', err.message);
      const r = err && err.response;
      setBoardError(r ? `Server answered ${r.status}${r.data && r.data.code ? ` (${r.data.code})` : ''}${r.data && r.data.error ? `: ${String(r.data.error).slice(0, 140)}` : ''}` : (err && err.message) || 'No response from the server');
      setBoardState(prev => prev === 'ready' ? prev : 'error');
    }
  };

  const fetchActiveOrders = opts => {
    // ordersOnly: socket-triggered refreshes don't need the restaurant record again (the menu is kept live by socket events).
    const full = !(opts && opts.ordersOnly === true);
    if (inflightRef.current) {
      queuedRef.current = { full: full || !!(queuedRef.current && queuedRef.current.full) };
      return inflightRef.current;
    }
    const run = (async () => {
      try { await runFetch(full); }
      finally {
        inflightRef.current = null;
        const q = queuedRef.current;
        queuedRef.current = null;
        if (q) fetchActiveOrders({ ordersOnly: !q.full });
      }
    })();
    inflightRef.current = run;
    return run;
  };

  const retryBoardLoad = () => { setBoardState('loading'); fetchActiveOrders(); };
  const manualRefresh = async () => { setRefreshing(true); try { await fetchActiveOrders({ ordersOnly: metaLoadedRef.current }); } finally { setRefreshing(false); } };

  /* ── main effect: socket + initial fetch ── */
  useEffect(() => {
    if (!tenantId) { setBoardState('error'); return undefined; }
    seenIdsRef.current = new Set();
    abortRef.current = new AbortController();
    healthAtRef.current = { health: 0, summary: 0 };
    initialLoadRef.current = false;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    // Blocked/throwing storage used to abort this whole effect, so the socket never connected and the KDS stayed empty.
    try {
      const prevDay = localStorage.getItem(`kds_operational_date_${tenantId}`);
      if (prevDay !== today) {
        localStorage.removeItem(`kds_completed_count_${tenantId}`);
        localStorage.removeItem(`kds_processing_time_${tenantId}`);
        localStorage.setItem(`kds_operational_date_${tenantId}`, today);
      }
      const cc = localStorage.getItem(`kds_completed_count_${tenantId}`);
      const ct = localStorage.getItem(`kds_processing_time_${tenantId}`);
      if (cc) setCompletedTicketsCount(parseInt(cc, 10) || 0);
      if (ct) setTotalProcessingTime(parseInt(ct, 10) || 0);
    } catch { /* counters just start from zero */ }
    fetchActiveOrders();

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const socket = io(SOCKET_BASE_URL, { transports: ['polling', 'websocket'], reconnection: true });
    socketRef.current = socket;
    const joinRestaurant = () => socket.emit('join_restaurant', tenantId, getOperatorToken()); // staff room needs the token
    socket.on('connect', joinRestaurant);
    // Tickets/timings that changed while the socket was down are never replayed: resync on reconnect.
    let hasConnectedOnce = false;
    socket.on('connect', () => { if (hasConnectedOnce) fetchActiveOrders({ ordersOnly: metaLoadedRef.current }); hasConnectedOnce = true; });
    socket.on('connect', () => setIsOnline(true));
    if (socket.connected) joinRestaurant();
    socket.on('disconnect', () => setIsOnline(false));

    // The socket payload shows the ticket instantly; a moment later the server copy replaces it (timings, versions, customer details).
    const scheduleReconcile = () => {
      clearTimeout(reconcileRef.current);
      reconcileRef.current = setTimeout(() => fetchActiveOrders({ ordersOnly: true }), 1500);
    };

    socket.on('new_order', newOrder => {
      if (!newOrder || newOrder.tenantId !== tenantId) return;
      const kitchenItems = (newOrder.items || []).filter(isKitchenItem);
      if (!kitchenItems.length) return;
      if (newOrder.status && newOrder.status !== 'pending') return;
      // Keep the FULL items array: kds-item timing calls use the index inside order.items on the
      // server, so stripping extra items here shifted every index and timed/crossed the wrong dish.
      // The card render already skips extra items.
      const cleanOrder = { ...newOrder };
      const id = String(cleanOrder._id);
      const alreadySeen = seenIdsRef.current.has(id);
      seenIdsRef.current.add(id);
      recentSocketRef.current.set(id, { order: cleanOrder, ts: Date.now() });
      setOrders(prev => prev.some(o => String(o._id) === id) ? prev : [cleanOrder, ...prev]);
      if (alreadySeen) return; // a poll already showed and announced it
      setMobileCardIndex(sortOldestRef.current ? 9999 : 0); // jump to the new ticket (clamped to the last one when sorted oldest-first)
      arriveTicket(cleanOrder);
      scheduleReconcile();
    });

    socket.on('kds_item_cross_sync', data => {
      if (data.tenantId !== tenantId) return;
      setOrders(prev => prev.map(o => {
        if (String(o._id) !== String(data.orderId)) return o;
        const items = (o.items || []).map((it, i) => i === data.idx ? { ...it, isCrossedLocal: data.newState } : it);
        return { ...o, items };
      }));
    });

    socket.on('kds_item_timing_updated', data => {
      if (!data || (data.tenantId && data.tenantId !== tenantId)) return;
      const itemIndex = Number(data.itemIndex);
      const itemPatch = data.item || {};
      setOrders(prev => prev.map(o => {
        if (String(o._id) !== String(data.orderId)) return o;
        const items = (o.items || []).map((it, i) => i === itemIndex ? { ...it, ...itemPatch } : it);
        return { ...o, items, ...(data.orderTiming || {}) };
      }));
      setChecked(data.orderId, itemIndex, !!itemPatch.kdsCompletedAt || !!itemPatch.isCrossedLocal);
    });

    socket.on('order_modification_detected', data => {
      if (!data || data.tenantId !== tenantId) return;
      const p = voicePrefsRef.current;
      // Only what changed: new dishes, changed quantities, removed dishes. Nothing from the unchanged part of the order.
      const mod = extractModification(data);
      const orderId = data.orderId ? String(data.orderId) : '';
      if (orderId) {
        if (!modIsEmpty(mod)) setModInfo(prev => ({ ...prev, [orderId]: mergeModification(prev[orderId], mod) }));
        markFresh(orderId); // the ticket glows so the cook finds it
      }
      const summary = modIsEmpty(mod) ? (data.modificationNote ? String(data.modificationNote) : 'Order changed') : modSummary(mod);
      const known = orderId ? ordersRef.current.find(o => String(o._id) === orderId) : null;
      const who = spokenWho(known || { tableNumber: data.tableNumber, source: data.source });
      if (p.chime) playAlertSound('waiter');
      later(() => announce(buildModSpeech(who, mod, data.modificationNote)), p.chime ? 900 : 0);
      // Date.now() alone collided for two alerts in the same millisecond (duplicate React keys), and the list grew without bound.
      setInterceptedAlerts(prev => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...data, modificationNote: summary }, ...prev].slice(0, 25));
      fetchActiveOrders({ ordersOnly: metaLoadedRef.current });
    });

    // A ticket that disappears because the order was cancelled / voided must be said out loud: otherwise the cook keeps making it.
    const removeAndNotify = (orderId, withNotice) => {
      const gone = ordersRef.current.find(o => String(o._id) === String(orderId));
      recentSocketRef.current.delete(String(orderId));
      dispatchedRef.current.add(String(orderId)); // a fetch that was already in flight must not bring it back
      later(() => dispatchedRef.current.delete(String(orderId)), 90000);
      setModInfo(prev => { const k = String(orderId); if (!(k in prev)) return prev; const n = { ...prev }; delete n[k]; return n; });
      setOrders(prev => prev.filter(o => String(o._id) !== String(orderId)));
      if (gone && withNotice) {
        const p = voicePrefsRef.current;
        pushToast({ kind: 'cancel', title: `CANCELLED · ${ticketLabel(gone)}`, body: 'This ticket was cancelled. Stop preparing it.' });
        if (p.chime) playAlertSound('cancelled');
        later(() => announce(`Cancelled. ${spokenWho(gone)} was cancelled. Stop preparing it.`), p.chime ? 1200 : 0);
      }
    };

    // Orders can be advanced by another KDS/operator device. Remove them from
    // this pending queue immediately instead of waiting for a refresh.
    socket.on('order_status_updated', data => {
      if (!data || (data.tenantId && data.tenantId !== tenantId)) return;
      const orderId = data._id || data.orderId;
      if (!orderId) return;
      if (data.status === 'pending') { dispatchedRef.current.delete(String(orderId)); scheduleReconcile(); return; } // recalled on another device: show it again
      if (data.status && data.status !== 'pending') removeAndNotify(orderId, ['cancelled', 'rejected', 'voided'].includes(String(data.status).toLowerCase()));
    });
    socket.on('order_voided', data => {
      if (!data) return;
      const orderId = data.orderId || data._id;
      if (orderId) removeAndNotify(orderId, true);
    });

    // ── Keep menu availability live — an item 86'd or restored from the
    // Operator Portal (or auto-hidden by stock depletion) used to only reach
    // this screen's dish list whenever something else happened to trigger a
    // refetch, so the 86 modal could show stale availability in the meantime. ──
    socket.on('menu_updated', updatedItem => {
      if (!updatedItem || updatedItem.tenantId !== tenantId) return;
      // A dish created after the KDS opened was never added (only existing ones were patched), so it was missing from the 86 list.
      setMenuItems(prev => prev.some(item => item._id === updatedItem._id)
        ? prev.map(item => item._id === updatedItem._id ? { ...item, ...updatedItem } : item)
        : [...prev, updatedItem]);
    });
    socket.on('menu_item_deleted', ({ itemId } = {}) => { if (itemId) setMenuItems(prev => prev.filter(i => String(i._id) !== String(itemId))); });
    socket.on('menu_item_restored', ({ itemId, item } = {}) => { if (itemId && item) setMenuItems(prev => prev.map(i => String(i._id) === String(itemId) ? { ...i, ...item } : i)); });
    socket.on('menu_bulk_updated', items => { if (Array.isArray(items)) setMenuItems(items); });

    // A tablet that slept / lost Wi-Fi can have a socket that is dead without ever firing "disconnect", so tickets sent in
    // the meantime never appeared. Resync when the screen wakes up, and keep a safety net while it is visible:
    // every 10 s while the socket is down, otherwise only when nothing has been fetched for 45 s.
    const onVisible = () => { if (document.visibilityState === 'visible') fetchActiveOrders({ ordersOnly: metaLoadedRef.current }); };
    document.addEventListener('visibilitychange', onVisible);
    const safetyPoll = setInterval(() => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      const age = Date.now() - lastFetchAtRef.current;
      if ((!socket.connected && age > 9000) || age > 45000) fetchActiveOrders({ ordersOnly: metaLoadedRef.current });
    }, 10000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(safetyPoll);
      clearTimeout(reconcileRef.current);
      abortRef.current?.abort(); // stop downloads that nobody is waiting for any more
      ['new_order', 'kds_item_cross_sync', 'kds_item_timing_updated', 'order_modification_detected', 'order_status_updated', 'order_voided', 'menu_updated', 'menu_item_deleted', 'menu_item_restored', 'menu_bulk_updated']
        .forEach(ev => socket.off(ev));
      socket.off('connect', joinRestaurant);
      socket.disconnect();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  /* ── actions ── */
  // Fold the server's authoritative copy of one dish (incl. kdsTimingVersion) back into state. Without this the next tap
  // sent a stale version, got a 409, and the handler reverted the chef's click until a socket event happened to arrive.
  const mergeServerItem = useCallback((orderId, idx, item, orderTiming) => {
    if (!item) return;
    setOrders(prev => prev.map(o => {
      if (String(o._id) !== String(orderId)) return o;
      const items = (o.items || []).map((it, i) => i === idx ? { ...it, ...item } : it);
      return { ...o, items, ...(orderTiming || {}) };
    }));
  }, []);

  const markAsReadyRef = useRef(null);
  const onReadyStable = useCallback(id => markAsReadyRef.current && markAsReadyRef.current(id), []);   // same function every render, so tickets don't re-render because of it
  const markAsReady = async orderId => {
    if (processingOrderIds.has(orderId)) return; // block a double-tap while the request is in flight
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    const idKey = String(orderId);
    if (voicePrefsRef.current.dispatchSound) playAlertSound('pickupReady'); // instant feedback on the tap, before the server answers
    setProcessingOrderIds(prev => new Set(prev).add(orderId));
    setRecallQueue(prev => [{ ...order, _dispatchedAt: Date.now() }, ...prev].slice(0, 10));
    recentSocketRef.current.delete(idKey);
    setModInfo(prev => { if (!(idKey in prev)) return prev; const n = { ...prev }; delete n[idKey]; return n; });
    dispatchedRef.current.add(idKey); // a fetch that was already in flight must not bring this ticket back
    // Do not count client-side ticket age as kitchen prep time. Server timing is
    // authoritative and is what Owner/Operator analytics consume.
    if (mobileCardIndex > 0) setMobileCardIndex(i => i - 1);
    // Remove it from the board immediately — instant feedback, and the card can no
    // longer be tapped again while the save is still in flight. Restore it on failure.
    setOrders(prev => prev.filter(o => o._id !== orderId));
    try {
      const readyRes = await axios.patch(`${BASE_URL}/admin/orders/${orderId}`, { status: 'ready', tenantId });
      later(() => dispatchedRef.current.delete(idKey), 90000);
      // a mis-tap is the most common KDS mistake: for a few seconds the call-out carries an UNDO button (the full list is under Recall)
      pushToast({ kind: 'done', title: `DISPATCHED · ${shortLabel(order)}`, body: 'Mistake? Undo it.', action: { label: 'UNDO', id: idKey }, ttl: 8000 });
      try { localStorage.removeItem(`kds_note_${orderId}`); } catch { /* ignore */ } // the private ticket note is no longer needed
      fetchHealth({ summary: true }); // refresh the database-backed dispatched/avg figures
      const authoritativeSeconds = Number(readyRes.data?.order?.prepTimeSeconds);
      if (Number.isFinite(authoritativeSeconds) && authoritativeSeconds >= 0) {
        // localStorage can throw (private mode / quota). Inside a state updater that crashed the screen, and in this try it
        // wrongly put an already-dispatched ticket back on the board.
        setRecallQueue(prev => prev.map(o => o._id === orderId ? { ...o, _kdsCountedSeconds: authoritativeSeconds } : o));
        setTotalProcessingTime(prev => { const n = prev + authoritativeSeconds; try { localStorage.setItem(`kds_processing_time_${tenantId}`, n); } catch { /* ignore */ } return n; });
        setCompletedTicketsCount(prev => { const n = prev + 1; try { localStorage.setItem(`kds_completed_count_${tenantId}`, n); } catch { /* ignore */ } return n; });
      }
    } catch (err) {
      console.error(err);
      dispatchedRef.current.delete(idKey);
      setRecallQueue(prev => prev.filter(o => o._id !== orderId));
      // The order no longer exists / was voided or settled elsewhere: putting the ticket back left a dead card that could
      // never be dispatched. Anything else (network, 5xx) is restored so the chef can try again.
      if (err?.response?.status === 404 || err?.response?.status === 410) fetchActiveOrders({ ordersOnly: true });
      else setOrders(prev => prev.some(o => o._id === orderId) ? prev : [order, ...prev]);
    } finally {
      setProcessingOrderIds(prev => { const next = new Set(prev); next.delete(orderId); return next; });
    }
  };

  useEffect(() => { markAsReadyRef.current = markAsReady; });

  const handleRecall = async id => {
    const queue = recallQueueRef.current;
    const recalled = id ? queue.find(o => String(o._id) === String(id)) : queue[0];
    if (!recalled) return;
    const drop = () => setRecallQueue(prev => prev.filter(o => o._id !== recalled._id));
    // Persist the recall: it only re-appeared locally, so the order stayed 'ready' on the server and vanished again
    // on the next refresh / on every other device.
    let recallRes;
    try {
      recallRes = await axios.patch(`${BASE_URL}/admin/orders/${recalled._id}`, { status: 'pending', recall: true, tenantId });
    } catch (err) {
      console.error('Recall failed:', err);
      return;
    }
    // The server answers { skipped: true } when the ticket already moved on (served/settled/rejected) or was recalled
    // elsewhere. Putting it back on the board then showed a ticket that is no longer pending.
    if (recallRes?.data?.skipped || recallRes?.data?.order?.status !== 'pending') {
      drop();
      return;
    }
    dispatchedRef.current.delete(String(recalled._id));
    // Use the server's copy, not the snapshot taken when the ticket was dispatched (stale items / crossed state).
    const fresh = recallRes.data.order || recalled;
    setOrders(prev => prev.some(o => String(o._id) === String(recalled._id)) ? prev : [fresh, ...prev]);
    drop();
    setCompletedTicketsCount(prev => { const n = Math.max(0, prev - 1); try { localStorage.setItem(`kds_completed_count_${tenantId}`, n); } catch { /* ignore */ } return n; });
    // The average is total/count, so the recalled ticket's time has to leave the total together with its count.
    const counted = Number(recalled._kdsCountedSeconds);
    if (Number.isFinite(counted) && counted > 0) setTotalProcessingTime(prev => { const n = Math.max(0, prev - counted); try { localStorage.setItem(`kds_processing_time_${tenantId}`, n); } catch { /* ignore */ } return n; });
    fetchHealth({ summary: true }); // the database-backed dispatched / average figures still counted the recalled ticket
  };
  useEffect(() => { handleRecallRef.current = handleRecall; });

  const trigger86 = (categoryKey, categoryName) => {
    setEightySixModal({ categoryKey, categoryName });
    setSelectedDish86(null);
    setSelectedReason86('ran_out');
  };

  // un-86: the dish is back in stock (the same menu call, the other way round)
  const restore86 = async dish => {
    if (!dish || confirm86Busy.current) return;
    confirm86Busy.current = true;
    try {
      await axios.patch(`${BASE_URL}/menu-item/${dish._id}`, { tenantId, isAvailable: true });
      setMenuItems(prev => prev.map(m => m._id === dish._id ? { ...m, isAvailable: true, outOfStockReason: undefined, outOfStockAt: undefined, outOfStockBy: undefined } : m));
    } catch { alert('Could not restore the dish.'); }
    finally { confirm86Busy.current = false; }
  };

  const confirm86 = async () => {
    if (!selectedDish86 || confirm86Busy.current) return; // a double-tap sent the same PATCH twice
    confirm86Busy.current = true;
    try {
      await axios.patch(`${BASE_URL}/menu-item/${selectedDish86._id}`, {
        tenantId,
        isAvailable: false,
        outOfStockReason: selectedReason86,
        outOfStockAt: new Date().toISOString(),
        outOfStockBy: 'Kitchen',
      });
      // the menu list is patched in place (the live menu events do the same for other screens): no need to download it all again
      setMenuItems(prev => prev.map(m => m._id === selectedDish86._id ? { ...m, isAvailable: false, outOfStockReason: selectedReason86 } : m));
      setEightySixModal(null);
      setSelectedDish86(null);
    } catch { alert('Could not update item.'); }
    finally { confirm86Busy.current = false; }
  };

  /* ── derived maps ── */
  const dishToVegMap = useMemo(() => {
    const m = {};
    menuItems.forEach(item => { if (item.name) m[item.name.toLowerCase().trim()] = item.isVeg !== false; });
    return m;
  }, [menuItems]);

  const dishToCategoryMap = useMemo(() => {
    const m = {};
    menuItems.forEach(item => { if (item.name && item.categoryId) m[item.name.toLowerCase().trim()] = item.categoryId.toLowerCase().trim(); });
    return m;
  }, [menuItems]);

  const categoryVegProfile = useMemo(() => {
    const p = {};
    menuItems.forEach(item => {
      const cId = item.categoryId?.toLowerCase().trim();
      if (!cId) return;
      if (!p[cId]) p[cId] = { hasVeg: false, hasNonVeg: false };
      if (item.isVeg !== false) p[cId].hasVeg = true; else p[cId].hasNonVeg = true;
    });
    return p;
  }, [menuItems]);

  // how many dishes are 86'd in each category (shown on the rail's 86 button, so a cook can see it without opening anything)
  const eightySixCounts = useMemo(() => {
    const c = {};
    menuItems.forEach(m => { if (m.isAvailable === false) { const k = (m.categoryId || '').toLowerCase().trim(); if (k) c[k] = (c[k] || 0) + 1; } });
    return c;
  }, [menuItems]);

  const stationMatches = (otype, station) => {
    if (station === 'DINEIN') return otype === 'dine-in';
    if (station === 'PARCEL') return otype === 'parcel';
    if (station === 'DELIVERY') return otype === 'swiggy' || otype === 'zomato';
    return true;
  };

  const stationCounts = useMemo(() => {
    const c = { ALL: 0, DINEIN: 0, PARCEL: 0, DELIVERY: 0 };
    orders.forEach(o => {
      if (!(o.items || []).some(isKitchenItem)) return;
      c.ALL++;
      const t = getOrderType(o);
      if (t === 'dine-in') c.DINEIN++; else if (t === 'parcel') c.PARCEL++; else c.DELIVERY++;
    });
    return c;
  }, [orders]);
  const pendingCount = stationCounts.ALL;

  const categoryPendingCounts = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
      if (!['pending', 'ready'].includes(order.status)) return;
      if (!stationMatches(getOrderType(order), stationFilter)) return;
      (order.items || []).forEach((item, idx) => {
        if (!isKitchenItem(item)) return;
        const fId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || null;
        if (!fId) return;
        const isVeg = item.isVeg !== undefined ? item.isVeg !== false : dishToVegMap[item.name?.toLowerCase().trim()] !== false;
        const matches = isNonVegMode ? !isVeg : isVeg;
        if (matches && !(checkedItemsGlobal[order._id] && checkedItemsGlobal[order._id][idx])) counts[fId] = (counts[fId] || 0) + (Number(item.quantity) || 1);
      });
    });
    return counts;
  }, [orders, stationFilter, dishToCategoryMap, dishToVegMap, checkedItemsGlobal, isNonVegMode]);

  const baseOrders = useMemo(() => {
    const list = orders.filter(order => {
      if (!(order.items || []).some(isKitchenItem)) return false;
      const otype = getOrderType(order);
      if (!stationMatches(otype, stationFilter)) return false;
      if (showLateOnly && lateIds.size > 0 && !lateIds.has(String(order._id))) return false;
      if (isNonVegMode) {
        const hasNV = (order.items || []).some(item => {
          const isVeg = item.isVeg !== undefined ? item.isVeg !== false : dishToVegMap[item.name?.toLowerCase().trim()] !== false;
          return !isVeg;
        });
        if (!hasNV) return false;
      }
      const isAgg = otype === 'swiggy' || otype === 'zomato';
      if (selectedCategory !== 'ALL' && !isAgg) {
        const sel = selectedCategory.toLowerCase().trim();
        const hasMatch = order.items?.some(item => {
          if (!isKitchenItem(item)) return false;
          const cId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || '';
          return cId === sel;
        });
        if (!hasMatch) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTable = order.tableNumber?.toString().toLowerCase().includes(q);
        const matchSource = order.source?.toLowerCase().includes(q);
        const matchItem = order.items?.some(i => i.name?.toLowerCase().includes(q));
        if (!matchTable && !matchSource && !matchItem) return false;
      }
      return true;
    });
    // Always sort by creation time: a recalled ticket is put back at the front and would otherwise sit in the wrong place.
    return [...list].sort((a, b) => sortOldest ? createdMs(a) - createdMs(b) : createdMs(b) - createdMs(a));
  }, [orders, stationFilter, selectedCategory, dishToCategoryMap, dishToVegMap, isNonVegMode, searchQuery, sortOldest, showLateOnly, lateIds]);

  // "show only tickets with this dish": applied on top, so the prep-queue chips themselves keep listing every dish
  const filteredOrders = useMemo(
    () => dishFilter ? baseOrders.filter(o => (o.items || []).some(i => isKitchenItem(i) && sameName(i.name, dishFilter))) : baseOrders,
    [baseOrders, dishFilter]
  );
  const activeFilterCount = (stationFilter !== 'ALL' ? 1 : 0) + (selectedCategory !== 'ALL' ? 1 : 0) + (searchQuery.trim() ? 1 : 0) + (showLateOnly && lateIds.size > 0 ? 1 : 0) + (dishFilter ? 1 : 0);
  const clearFilters = () => { setStationFilter('ALL'); setSelectedCategory('ALL'); setSearchQuery(''); setShowSearch(false); setShowLateOnly(false); setDishFilter(''); setMobileCardIndex(0); };

  const aggregatedTotals = useMemo(() => {
    const totals = {};
    if (!isAggregateView) return totals; // only the batch-summary screen needs this
    // Built from filteredOrders + the card's own visibility rule: it used every order and every dish, so the totals disagreed
    // with the "N tickets" label beside them and with the dishes actually shown on the cards.
    const vis = { selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode };
    filteredOrders.forEach(o => (o.items || []).forEach((i, idx) => {
      if (!isDishVisible(i, vis)) return;
      if (checkedItemsGlobal[o._id] && checkedItemsGlobal[o._id][idx]) return;
      const otype = getOrderType(o);
      const kind = otype === 'parcel' ? 'P' : (otype === 'swiggy' || otype === 'zomato') ? 'S' : 'D';
      const portion = (i.portion && String(i.portion).toLowerCase() !== 'single') ? ` (${i.portion})` : '';
      const key = `${i.name}${portion}__${kind}`;
      totals[key] = (totals[key] || 0) + (Number(i.quantity) || 1);
    }));
    return totals;
  }, [isAggregateView, filteredOrders, checkedItemsGlobal, selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode]);

  const masterPrepMarqueeList = useMemo(() => {
    const m = {};
    const vis = { selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode };
    baseOrders.forEach(o => (o.items || []).forEach((i, idx) => {
      if (!isDishVisible(i, vis)) return;
      if (checkedItemsGlobal[o._id] && checkedItemsGlobal[o._id][idx]) return;
      m[i.name] = (m[i.name] || 0) + (Number(i.quantity) || 1);
    }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [baseOrders, checkedItemsGlobal, selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode]);

  // Prefer the database figures (same on every KDS device and in the Owner app); the localStorage counters stay
  // only as an offline fallback before the first server response.
  const dispatchedToday = serverKdsToday ? serverKdsToday.count : completedTicketsCount;
  const avgClearTime = useMemo(() => {
    const avg = serverKdsToday
      ? serverKdsToday.avgSeconds
      : (completedTicketsCount ? Math.floor(totalProcessingTime / completedTicketsCount) : 0);
    if (!avg) return '—';
    return fmtSpan(avg); // avgSeconds can be fractional (was "3m 12.4285s"); from 60 min it reads in hours ("1h 11m")
  }, [totalProcessingTime, completedTicketsCount, serverKdsToday]);

  const visibleCategories = useMemo(() => {
    return categories.filter(cat => {
      const k = cat.categoryId?.toLowerCase().trim() || '';
      if (!k) return false;
      if (categoryPendingCounts[k] > 0) return true;
      const profile = categoryVegProfile[k];
      if (!profile) return false;
      if (tenantOnlyVeg) return profile.hasVeg;
      return isNonVegMode ? profile.hasNonVeg : profile.hasVeg;
    });
  }, [categories, categoryPendingCounts, categoryVegProfile, tenantOnlyVeg, isNonVegMode]);

  /* ── wastage ── */
  const fetchWastageInventory = useCallback(async () => {
    try { const r = await axios.get(`${BASE_URL}/inventory/${tenantId}`, { timeout: 12000 }); setWastageInventory(r.data || []); } catch { setWastageInventory([]); }
  }, [tenantId]);
  const fetchWastageLog = useCallback(async () => {
    setWastageLoading(true);
    // A failed load used to become an empty list, so the panel claimed "No wastage entries today" and invited duplicate entries.
    try { const r = await axios.get(`${BASE_URL}/wastage/${tenantId}`, { timeout: 12000 }); setWastageLog(Array.isArray(r.data) ? r.data : []); setWastageError(e => e === 'Could not load today\'s entries. Close and reopen this panel to retry.' ? '' : e); }
    catch { setWastageError('Could not load today\'s entries. Close and reopen this panel to retry.'); }
    finally { setWastageLoading(false); }
  }, [tenantId]);
  const fetchWastageAnalytics = useCallback(async () => {
    try { const r = await axios.get(`${BASE_URL}/wastage/analytics/${tenantId}`, { timeout: 12000 }); setWastageAnalytics(r.data || null); } catch { setWastageAnalytics(null); }
  }, [tenantId]);
  useEffect(() => { if (showWastagePanel) { fetchWastageInventory(); fetchWastageLog(); } }, [showWastagePanel, fetchWastageInventory, fetchWastageLog]);
  useEffect(() => { if (showWastagePanel && wastageTab === 'report') fetchWastageAnalytics(); }, [wastageTab, showWastagePanel, fetchWastageAnalytics]);

  const saveWastageEntry = async () => {
    const { itemName, quantity, unit, reason, loggedBy } = wastageForm;
    // "0" is a truthy string and slipped through; the server then refused it and the chef saw nothing happen.
    if (!itemName.trim() || !(Number(quantity) > 0) || !loggedBy.trim()) { setWastageError('Enter an item, a quantity above 0 and your name.'); return; }
    setWastageSaving(true); setWastageError('');
    try {
      await axios.post(`${BASE_URL}/wastage/${tenantId}`, {
        itemName: itemName.trim(), inventoryId: wastageForm.inventoryId || undefined,
        quantity: Number(quantity), unit, reason, loggedBy: loggedBy.trim(), notes: wastageForm.notes || '',
      });
      setWastageForm(p => ({ itemName: '', inventoryId: null, quantity: '', unit: 'kg', reason: 'Spoiled / Expired', loggedBy: p.loggedBy, notes: '' }));
      setWastageSuggestions([]); setShowWastageSuggest(false);
      fetchWastageLog(); fetchWastageInventory();
    } catch (err) { console.error(err.message); setWastageError(err?.response?.data?.error || 'Could not log wastage. Check the connection and try again.'); }
    finally { setWastageSaving(false); }
  };

  const deleteWastageEntry = async id => {
    if (!window.confirm('Remove this wastage entry?')) return;
    try { await axios.delete(`${BASE_URL}/wastage/${tenantId}/${id}`); setWastageLog(prev => prev.filter(e => e._id !== id)); setWastageError(''); }
    catch (err) { setWastageError(err?.response?.data?.error || 'Could not remove the entry. Try again.'); }
  };

  const toggleSort = () => setSortOldest(v => { const n = !v; sortOldestRef.current = n; try { localStorage.setItem('kds_sort_oldest', n ? '1' : '0'); } catch { /* ignore */ } return n; });
  const todayWastageCount = wastageLog.filter(e => new Date(e.loggedAt || e.createdAt).toDateString() === new Date().toDateString()).length;

  /* ── overdue alerts ──
     Every few seconds: which tickets are past the overdue limit (for the LATE filter and metrics), and say it once when a ticket crosses it.
     Tickets that are already overdue when the screen opens (or when the limit is changed) are marked as announced without an alarm. */
  const alertOverdue = (list, lateSec) => {
    const p = voicePrefsRef.current;
    if (!p.overdueAlert) return;
    const mins = Math.round(lateSec / 60);
    const names = list.slice(0, 4);
    const more = list.length - names.length;
    pushToast({ kind: 'late', title: `OVERDUE · ${names.map(shortLabel).join(', ')}${more > 0 ? ` +${more}` : ''}`, body: `Waiting over ${mins} minutes. Please check.` });
    if (p.chime) playAlertSound('expiry');
    later(() => announce(`Overdue. ${names.map(spokenWho).join(', ')}${more > 0 ? ` and ${more} more` : ''}. Waiting over ${mins} minutes.`), p.chime ? 1300 : 0);
  };
  useEffect(() => {
    lateSeededRef.current = false;
    const lateSec = display.lateSec;
    const check = () => {
      const now = Date.now();
      const late = new Set();
      const fresh = [];
      const live = new Set();
      ordersRef.current.forEach(o => {
        if (!(o.items || []).some(isKitchenItem)) return;
        const id = String(o._id);
        live.add(id);
        const age = Math.max(0, (now - createdMs(o)) / 1000);
        if (age >= lateSec) { late.add(id); if (!alertedLateRef.current.has(id)) { alertedLateRef.current.add(id); fresh.push(o); } }
      });
      alertedLateRef.current.forEach(id => { if (!live.has(id)) alertedLateRef.current.delete(id); });
      setLateIds(prev => (prev.size === late.size && [...late].every(x => prev.has(x))) ? prev : late);
      if (!initialLoadRef.current) return;
      if (!lateSeededRef.current) { lateSeededRef.current = true; return; }
      if (fresh.length) alertOverdue(fresh, lateSec);
    };
    checkLateRef.current = check;
    check();
    const t = setInterval(check, 5000);
    return () => { clearInterval(t); checkLateRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display.lateSec]);

  // also whenever the ticket list changes, so the LATE chip shows the moment tickets load (not up to 5 s later)
  useEffect(() => { checkLateRef.current?.(); }, [orders]);

  /* ── keep the screen awake (a sleeping tablet silently misses tickets) ── */
  useEffect(() => {
    if (!display.keepAwake || typeof navigator === 'undefined' || !('wakeLock' in navigator)) { setAwakeOn(false); return undefined; }
    let lock = null;
    let stopped = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (stopped) { try { lock.release(); } catch { /* ignore */ } return; }
        setAwakeOn(true);
        lock.addEventListener?.('release', () => { if (!stopped) setAwakeOn(false); });
      } catch { setAwakeOn(false); }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') acquire(); }; // the lock is dropped whenever the page is hidden
    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => { stopped = true; document.removeEventListener('visibilitychange', onVisible); try { lock?.release(); } catch { /* ignore */ } setAwakeOn(false); };
  }, [display.keepAwake]);

  const fullscreenSupported = typeof document !== 'undefined' && !!document.documentElement?.requestFullscreen;
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* the browser refused (needs a tap, or is not allowed here) */ }
  };

  /* ── keep the board steady ──
     A ticket that arrives (or leaves) above the part of the board you are looking at used to shove everything down or up by a row, so
     the ticket you were about to tap moved under your finger. Remember the first visible ticket and put the scroll back after each change. */
  const captureAnchor = () => {
    const g = gridRef.current;
    if (!g) return;
    const cards = g.querySelectorAll('[data-oid]');
    for (const c of cards) {
      if (c.style.position === 'absolute') continue; // a ticket that is animating out
      if (c.offsetTop + c.offsetHeight > g.scrollTop + 4) { anchorRef.current = { id: c.getAttribute('data-oid'), top: c.offsetTop - g.scrollTop }; return; }
    }
    anchorRef.current = null;
  };
  useLayoutEffect(() => {
    const g = gridRef.current;
    const a = anchorRef.current;
    if (scrollTopRef.current <= 0) { anchorRef.current = null; return; }   // at the top there is nothing to hold steady: no layout reads at all
    if (g && a && g.scrollTop > 0) {
      const el = Array.from(g.querySelectorAll('[data-oid]')).find(c => c.getAttribute('data-oid') === a.id);
      if (el && el.style.position !== 'absolute') {
        const delta = el.offsetTop - g.scrollTop - a.top;
        if (Math.abs(delta) > 1) g.scrollTop += delta;
      }
    }
    captureAnchor();
  }, [orders, stationFilter, selectedCategory, searchQuery, sortOldest, isNonVegMode]);

  // Escape closes whatever is open, topmost first.
  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return;
      if (showSettings) setShowSettings(false);
      else if (eightySixModal) setEightySixModal(null);
      else if (showWastagePanel) setShowWastagePanel(false);
      else if (showRecall) setShowRecall(false);
      else if (showVoiceMenu) setShowVoiceMenu(false);
      else if (sidebarOpen) setSidebarOpen(false);
      else if (showSearch) { setShowSearch(false); setSearchQuery(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings, eightySixModal, showWastagePanel, showRecall, showVoiceMenu, sidebarOpen, showSearch]);

  const prepRowRef = useRef(null);
  useWheelSideways(prepRowRef);

  /* ── dialogs: keyboard focus ── */
  const drawerRef = useRef(null);
  const settingsRef = useRef(null);
  const wastageRef = useRef(null);
  const modal86Ref = useRef(null);
  useFocusTrap(drawerRef, sidebarOpen);
  useFocusTrap(settingsRef, showSettings);
  useFocusTrap(wastageRef, showWastagePanel);
  useFocusTrap(modal86Ref, !!eightySixModal);

  // the browser tab / installed app is named after the restaurant, and shows how many tickets are waiting
  useEffect(() => {
    const prev = document.title;
    document.title = `${pendingCount > 0 ? `(${pendingCount}) ` : ''}Kitchen${tenantName ? ` · ${tenantName}` : ''}`;
    return () => { document.title = prev; };
  }, [pendingCount, tenantName]);

  // switching station or opening the summary must leave the speed-metrics screen, otherwise the tap seems to do nothing
  const selectStation = v => { setStationFilter(v); setShowMetricsDashboard(false); };
  const toggleSummary = () => { setShowMetricsDashboard(false); setIsAggregateView(v => !v); };
  const toggleMetrics = () => { setIsAggregateView(false); setShowMetricsDashboard(v => !v); };

  /* ── breakpoint helpers ── */
  const wide = w >= 1520;                       // only then is there room for the words beside the header icons
  const showDrawerToggle = isMobile || isSmallTablet;
  const showPermanentSide = isLargeTablet || w >= 1200;
  const useCardView = isMobile;
  const safeCardIndex = Math.min(mobileCardIndex, Math.max(0, filteredOrders.length - 1));
  const swipeHandlers = useSwipe(
    () => setMobileCardIndex(i => Math.min(i + 1, filteredOrders.length - 1)),
    () => setMobileCardIndex(i => Math.max(i - 1, 0))
  );
  const zoom = SIZE_ZOOM[display.size] || 1;
  const gridCol = Math.round((isSmallTablet ? 250 : 262) * zoom);
  const cardProps = {
    warnSec: display.warnSec, lateSec: display.lateSec,
    onReady: onReadyStable, dishToCategoryMap, dishToVegMap, selectedCategory, setChecked,
    socketRef, isNonVegMode, tenantOnlyVeg, onItemSynced: mergeServerItem, onSpeak: onSpeakStable,
    layoutAnim: filteredOrders.length <= LAYOUT_ANIM_MAX,
  };

  /* ─── SECTIONS RAIL (permanent on wide screens, drawer on phones / small tablets) ─── */
  const renderRail = (inDrawer = false) => {
    const closeIf = () => { if (inDrawer) setSidebarOpen(false); };
    const allSel = selectedCategory === 'ALL' && !showMetricsDashboard;
    return (
      <>
        <div className="kx-rail-h">
          <div className="ic"><Layers size={15} /></div>
          <span className="kx-eyebrow">Sections</span>
          {inDrawer && <button type="button" className="kx-ib" aria-label="Close" onClick={() => setSidebarOpen(false)} style={{ height: 40, minWidth: 40, padding: 0 }}><X size={15} /></button>}
        </div>

        {!tenantOnlyVeg && (
          <div className="kx-vegseg">
            {[false, true].map(nv => (
              <button type="button" key={String(nv)} className={isNonVegMode === nv ? `on ${nv ? 'n' : 'v'}` : ''}
                onClick={() => { setIsNonVegMode(nv); setSelectedCategory('ALL'); }}>
                <span className={`kx-vd${nv ? ' n' : ''}`}><i /></span>{nv ? 'NON-VEG' : 'VEG'}
              </button>
            ))}
          </div>
        )}

        {boardState === 'loading' && orders.length === 0 ? <KdsSidebarSkeleton /> : (
          <div className="kx-rail-list no-scrollbar">
            <button type="button" className={`kx-nav${allSel ? ' on' : ''}`} onClick={() => { setSelectedCategory('ALL'); setShowMetricsDashboard(false); closeIf(); }}>
              <span className="t"><Coffee size={14} /><span>ALL SECTIONS</span></span>
              <span className="r"><span className={`kx-ct${pendingCount > 0 ? ' hot' : ''}`}>{fmtCount(pendingCount)}</span></span>
            </button>
            {visibleCategories.map(cat => {
              const k = cat.categoryId?.toLowerCase().trim() || '';
              const count = categoryPendingCounts[k] || 0;
              const sel = selectedCategory === k && !showMetricsDashboard;
              return (
                <div className="kx-navrow" key={cat._id}>
                  <button type="button" className={`kx-nav${sel ? ' on' : ''}`} aria-pressed={sel} onClick={() => { setSelectedCategory(k); setShowMetricsDashboard(false); closeIf(); }}>
                    <span className="t"><Flame size={14} color={count > 0 ? '#d3bfa2' : undefined} /><span style={{ textTransform: 'uppercase' }}>{cat.name}</span></span>
                    <span className="r"><span className={`kx-ct${count > 0 ? ' hot' : ''}`}>{fmtCount(count)}</span></span>
                  </button>
                  <button type="button" className={`kx-86${eightySixCounts[k] ? ' has' : ''}`} title={eightySixCounts[k] ? `${eightySixCounts[k]} ${eightySixCounts[k] === 1 ? 'dish is' : 'dishes are'} 86'd in "${cat.name}"` : `86 a dish in "${cat.name}"`} aria-label={eightySixCounts[k] ? `${eightySixCounts[k]} ${eightySixCounts[k] === 1 ? 'dish' : 'dishes'} 86'd in ${cat.name}: manage or 86 another` : `86 a dish in ${cat.name}`}
                    onClick={() => { trigger86(k, cat.name); closeIf(); }}>
                    <EyeOff size={13} />{eightySixCounts[k] ? <em>{eightySixCounts[k]}</em> : null}
                  </button>
                </div>
              );
            })}
            {!inDrawer && showPermanentSide && toasts.length > 0 && (
              <div className="kx-feed" aria-live="assertive">
                <span className="kx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Live</span>
                <AnimatePresence>{toasts.slice(0, 3).map(t => renderToast(t, true))}</AnimatePresence>
              </div>
            )}
          </div>
        )}

        <div className="kx-rail-f">
          <button type="button" className={`kx-nav${showMetricsDashboard ? ' on' : ''}`} onClick={() => { setShowMetricsDashboard(true); closeIf(); }}>
            <span className="t"><TrendingUp size={14} /><span>SPEED LOGS</span></span>
            {dispatchedToday > 0 && <span className="r"><span className="kx-ct hot">{dispatchedToday}</span></span>}
          </button>
          <button type="button" className="kx-nav" onClick={() => { setShowWastagePanel(true); closeIf(); }}>
            <span className="t"><Trash2 size={14} /><span>WASTAGE LOG</span></span>
            {todayWastageCount > 0 && <span className="r"><span className="kx-ct hot">{todayWastageCount}</span></span>}
          </button>
          <button type="button" className="kx-nav" onClick={() => { manualRefresh(); closeIf(); }}>
            <span className="t"><RefreshCw size={14} className={refreshing ? 'spin' : undefined} /><span>REFRESH TICKETS</span></span>
          </button>
          <div className="kx-duo">
            <button type="button" className="kx-nav" onClick={() => { setShowSettings(true); closeIf(); }}>
              <span className="t"><Settings size={14} /><span>DISPLAY &amp; ALERTS</span></span>
            </button>
            {fullscreenSupported && (
              <button type="button" className="kx-nav sq" aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'} title={isFullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            )}
          </div>
          <SupportContact style={{ marginBottom: 2 }} />
          <PwaInstallButton kind="kitchen" compact />
        </div>
      </>
    );
  };

  const renderToast = (t, compact = false) => (
    <Motion.div key={t.id} initial={{ opacity: 0, y: compact ? 8 : -18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`kx-toast${compact ? ' compact' : ''}${t.kind === 'cancel' || t.kind === 'late' ? ' cancel' : ''}`} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
      <div className="ic">{t.kind === 'late' ? <Siren size={15} /> : t.kind === 'cancel' ? <AlertTriangle size={15} /> : t.kind === 'done' ? <CheckCircle2 size={15} /> : <BellRing size={16} color="#d3bfa2" />}</div>
      <div style={{ minWidth: 0, flex: 1 }}><b>{t.title}</b><p>{t.body}</p></div>
      {t.action && <button type="button" className="kx-undo" onClick={e => { e.stopPropagation(); setToasts(prev => prev.filter(x => x.id !== t.id)); handleRecallRef.current?.(t.action.id); }}>{t.action.label}</button>}
    </Motion.div>
  );

  // "nothing to show" has two very different meanings: the kitchen really is clear, or tickets are waiting but the filters hide them
  const noMatch = boardState === 'ready' && filteredOrders.length === 0 && pendingCount > 0;
  const renderEmpty = fill => noMatch ? (
    <div className="kx-center" style={fill ? { flex: 1 } : undefined}>
      <div className="ic"><Search size={30} /></div>
      <h3>No tickets match</h3>
      <p>{pendingCount} {pendingCount === 1 ? 'ticket is' : 'tickets are'} waiting, but your filters hide {pendingCount === 1 ? 'it' : 'them'}.</p>
      <button type="button" className="kx-btn solid" onClick={clearFilters}>Clear filters</button>
    </div>
  ) : (
    <div className="kx-center" style={fill ? { flex: 1 } : undefined}>
      <div className="ic"><ChefHat size={30} /></div>
      <h3>Kitchen clear</h3><p>All tickets dispatched. New ones appear here the moment they are placed.</p>
      <KdsEmptyDetail loaded={orders.length} shown={filteredOrders.length} tenantId={tenantId} at={lastLoadedAt} />
    </div>
  );

  // Enter in any text box of the wastage form saves the entry (when it is complete)
  const wastageEnter = e => { if (e.key === 'Enter' && !wastageDisabled) { e.preventDefault(); saveWastageEntry(); } };
  const wastageDisabled = wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim();
  const dishesOut86 = eightySixModal ? menuItems.filter(m => (m.categoryId || '').toLowerCase().trim() === eightySixModal.categoryKey && m.isAvailable === false) : [];
  const dishesFor86 = eightySixModal ? menuItems.filter(m => (m.categoryId || '').toLowerCase().trim() === eightySixModal.categoryKey && m.isAvailable !== false) : [];

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <MotionConfig reducedMotion="user">
    <div className="kx">
      <style>{KX_CSS}</style>
      {boardState === 'loading' && <span role="status" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Loading kitchen tickets…</span>}

      {!audioUnlocked && soundMissed && (
        <div className="kx-unlock" role="status"><Volume2 size={15} /> Touch the screen once to switch on ticket sounds &amp; voice</div>
      )}

      {/* ── NEW TICKET / CANCELLED CALL-OUTS: floating only on narrow screens; on wide screens they live in the sections rail so they never cover a ticket ── */}
      {!showPermanentSide && (
        <div className="kx-toasts" aria-live="assertive">
          <AnimatePresence>{toasts.slice(0, 2).map(t => renderToast(t))}</AnimatePresence>
        </div>
      )}

      {/* ── SECTIONS DRAWER ── */}
      <AnimatePresence>
        {sidebarOpen && showDrawerToggle && (
          <>
            <Motion.div className="kx-scrim" style={{ zIndex: 90 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />
            <Motion.aside ref={drawerRef} className="kx-rail drawer" role="dialog" aria-modal="true" aria-label="Sections and tools" initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
              {renderRail(true)}
            </Motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════ HEADER ══════════════ */}
      <header className="kx-top">
        <div className="kx-brand">
          {showDrawerToggle && <button type="button" className="kx-ib" aria-label="Open sections" onClick={() => setSidebarOpen(true)}><AlignJustify size={18} /></button>}
          <BrandLogo />
          <div className="kx-brand-t">
            <span className="kx-kds"><ChefHat size={12} /> Kitchen display</span>
            <span className={`kx-live${isOnline && boardState !== 'error' ? '' : ' off'}`}>
              <i className="kx-dot" />
              {boardState === 'error' ? <><WifiOff size={11} /> Can't load tickets</> : isOnline ? (isMobile ? 'Live' : `Live${tenantName ? ` · ${tenantName}` : ''}`) : <><WifiOff size={11} /> Reconnecting…</>}
            </span>
          </div>
        </div>

        {!isMobile && (
          <div className="kx-seg" role="tablist" aria-label="Station">
            {STATIONS.map(s => (
              <button type="button" key={s.val} role="tab" aria-label={s.lbl} aria-selected={stationFilter === s.val} className={stationFilter === s.val ? 'on' : ''} onClick={() => selectStation(s.val)}>
                <s.Icon size={13} /><span className="lb">{s.lbl}</span>{stationCounts[s.val] > 0 && <span className="n">{stationCounts[s.val]}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="kx-stats">
          <div className={`kx-stat${pendingCount > 0 ? ' hot' : ''}`}><b>{pad2(pendingCount)}</b><span>Pending</span></div>
          <div className="kx-stat opt"><b style={{ fontSize: '1rem', paddingTop: 2 }}>{avgClearTime}</b><span>Avg clear</span></div>
          <div className="kx-stat opt"><b>{dispatchedToday}</b><span>Done today</span></div>
        </div>

        <div className="kx-acts">
          {isMobile && (
            <div className={`kx-stat${pendingCount > 0 ? ' hot' : ''}`} style={{ minWidth: 56, padding: '5px 9px' }} title={isOnline ? 'Live' : 'Reconnecting'}>
              <b style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <i className={`kx-dot${isOnline ? '' : ' off'}`} />{pad2(pendingCount)}
              </b>
            </div>
          )}
          <button type="button" aria-label="Search" className={`kx-ib${showSearch ? ' on' : ''}`} onClick={() => setShowSearch(v => !v)}><Search size={16} /></button>
          {!isMobile && (
            <button type="button" aria-label={isAggregateView ? 'Show tickets' : 'Show batch summary'} className={`kx-ib${isAggregateView ? ' on' : ''}`} onClick={toggleSummary}>
              {isAggregateView ? <LayoutGrid size={16} /> : <BarChart3 size={16} />}{wide && <span>{isAggregateView ? 'TICKETS' : 'SUMMARY'}</span>}
            </button>
          )}
          {recallQueue.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button type="button" className={`kx-ib on${showRecall ? ' open' : ''}`} onClick={() => setShowRecall(v => !v)} aria-label="Recall last ticket" aria-expanded={showRecall}
                title={`Recently dispatched: ${recallQueue.length}/10`}>
                <History size={16} />{wide && <span>RECALL {shortLabel(recallQueue[0])}</span>}<em className="kx-badge">{recallQueue.length}</em>
              </button>
              <AnimatePresence>
                {showRecall && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setShowRecall(false)} />
                    <Motion.div className="kx-pop" role="dialog" aria-label="Recently dispatched" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.16 }}>
                      <h4>Recently dispatched</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {recallQueue.map(o => (
                          <button type="button" key={o._id} className="kx-rc" onClick={() => { setShowRecall(false); handleRecall(o._id); }}>
                            <span className="n">{shortLabel(o)}</span>
                            <span className="m">{(o.items || []).filter(isKitchenItem).length} dishes · {fmtAgo(o._dispatchedAt)}</span>
                            <span className="go"><RotateCcw size={12} /> RECALL</span>
                          </button>
                        ))}
                      </div>
                    </Motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
          {!isMobile && (
            <button type="button" aria-label="Wastage log" className={`kx-ib kx-hide-md${showWastagePanel ? ' on' : ''}`} onClick={() => setShowWastagePanel(true)}>
              <Trash2 size={16} />{todayWastageCount > 0 && <em className="kx-badge">{todayWastageCount}</em>}
            </button>
          )}

          {/* Voice announcements: output only, automatic. This is where they are tuned. */}
          <div style={{ position: 'relative' }}>
            <button type="button" aria-label="Voice announcements" title="Voice announcements" aria-expanded={showVoiceMenu} className={`kx-ib${!audioUnlocked ? ' attn' : voicePrefs.voice ? ' on' : ' mute'}`} onClick={() => setShowVoiceMenu(v => !v)}>
              {speaking ? <span className="kx-eq"><i /><i /><i /></span> : voicePrefs.voice ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {wide && <span>{!audioUnlocked ? 'TAP FOR SOUND' : voicePrefs.voice ? 'VOICE ON' : 'VOICE OFF'}</span>}
            </button>
            <AnimatePresence>
              {showVoiceMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setShowVoiceMenu(false)} />
                  <Motion.div className="kx-pop" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.16 }}>
                    <h4>Ticket announcements</h4>
                    {!speechEngine.supported() && <div className="kx-err">This browser cannot speak. Chime and cards still work.</div>}
                    <div className="kx-row"><div>Speak ticket details<small>Table or source, every dish, portion and notes</small></div>
                      <button type="button" role="switch" aria-label="Speak ticket details" aria-checked={voicePrefs.voice} className={`kx-sw${voicePrefs.voice ? ' on' : ''}`} onClick={() => updateVoicePrefs({ voice: !voicePrefs.voice })} /></div>
                    <div className="kx-row"><div>New-ticket chime<small>Different tune for dine-in and delivery</small></div>
                      <button type="button" role="switch" aria-label="New-ticket chime" aria-checked={voicePrefs.chime} className={`kx-sw${voicePrefs.chime ? ' on' : ''}`} onClick={() => updateVoicePrefs({ chime: !voicePrefs.chime })} /></div>
                    <div className="kx-row"><div>Dispatch sound<small>A soft ding when you complete a ticket</small></div>
                      <button type="button" role="switch" aria-label="Dispatch sound" aria-checked={voicePrefs.dispatchSound} className={`kx-sw${voicePrefs.dispatchSound ? ' on' : ''}`} onClick={() => { const on = !voicePrefs.dispatchSound; updateVoicePrefs({ dispatchSound: on }); if (on) playAlertSound('pickupReady'); }} /></div>
                    <div className="kx-row"><span>Repeat</span>
                      <div className="kx-mini">{[1, 2].map(n => <button type="button" key={n} className={voicePrefs.repeat === n ? 'on' : ''} onClick={() => updateVoicePrefs({ repeat: n })}>{n}×</button>)}</div></div>
                    <div className="kx-row"><span>Speed</span>
                      <div className="kx-mini">{[['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']].map(([v, l]) => <button type="button" key={v} className={voicePrefs.rate === v ? 'on' : ''} onClick={() => updateVoicePrefs({ rate: v })}>{l}</button>)}</div></div>
                    <div className="kx-row"><div>Overdue alert<small>Chime + voice when a ticket passes {Math.round(display.lateSec / 60)} min</small></div>
                      <button type="button" role="switch" aria-label="Overdue alert" aria-checked={voicePrefs.overdueAlert} className={`kx-sw${voicePrefs.overdueAlert ? ' on' : ''}`} onClick={() => updateVoicePrefs({ overdueAlert: !voicePrefs.overdueAlert })} /></div>
                    <div><div className="kx-row" style={{ marginBottom: 6 }}><span>Volume</span><span className="mono" style={{ fontSize: '.66rem', color: '#9b978d' }}>{Math.round((voicePrefs.volume || 1) * 100)}%</span></div>
                      <input className="kx-range" type="range" min="30" max="100" step="10" aria-label="Voice volume" value={Math.round((voicePrefs.volume || 1) * 100)} onChange={e => updateVoicePrefs({ volume: Number(e.target.value) / 100 })} /></div>
                    {voiceList.length > 1 && (
                      <div><label className="kx-lbl" htmlFor="kx-voice-pick">Voice</label>
                        <select id="kx-voice-pick" className="kx-in" aria-label="Voice" value={voicePrefs.voiceName || ''} onChange={e => updateVoicePrefs({ voiceName: e.target.value })}>
                          <option value="">Automatic (Indian English)</option>
                          {voiceList.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                        </select></div>
                    )}
                    <button type="button" className="kx-btn block" onClick={() => { if (voicePrefsRef.current.chime) playAlertSound('order'); later(() => announce('New ticket for Table 5. 2 dishes, dine in. 2 Paneer Tikka. 1 half Dal Fry. Note: less spicy.', { force: true, interrupt: true }), 900); }}>
                      <Volume2 size={14} /> Test announcement
                    </button>
                  </Motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {!isMobile && <button type="button" aria-label="Refresh tickets" className="kx-ib kx-hide-md" onClick={manualRefresh}><RefreshCw size={16} className={refreshing ? 'spin' : undefined} /></button>}
        </div>
      </header>

      {/* ── SEARCH ── */}
      <AnimatePresence>
        {showSearch && (
          <Motion.div className="kx-search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <Search size={15} color="#b99f78" />
            <input autoFocus aria-label="Search tickets" type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by table number, source or dish name…" />
            {searchQuery && <button type="button" className="kx-pill" onClick={() => setSearchQuery('')}>CLEAR</button>}
            <button type="button" aria-label="Close search" className="kx-ib" onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ width: 40, minWidth: 40, padding: 0, border: 0, background: 'transparent' }}><X size={16} /></button>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── ORDER CHANGE ALERTS ── */}
      {interceptedAlerts.length > 0 && (
        <div className="kx-alerts">
          <AnimatePresence>
            {/* Only the latest few: an unbounded stack pushed the actual tickets off the screen during a rush. */}
            {interceptedAlerts.slice(0, 3).map(alert => (
              <Motion.div key={alert.id} className="kx-alert" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} style={isMobile ? { flexDirection: 'column', alignItems: 'stretch' } : undefined}>
                <div className="l">
                  <div className="ic"><BellRing size={18} color="#e29a58" /></div>
                  <div style={{ minWidth: 0 }}>
                    <h3>ORDER MODIFIED{alert.tableNumber != null && String(alert.tableNumber) !== '' ? ` — TABLE ${alert.tableNumber}` : ''}</h3>
                    <p>{alert.modificationNote}</p>
                  </div>
                </div>
                <button type="button" className="kx-btn warn" onClick={() => setInterceptedAlerts(prev => prev.filter(a => a.id !== alert.id))}>Acknowledge</button>
              </Motion.div>
            ))}
            {interceptedAlerts.length > 3 && (
              <Motion.div key="alerts-more" className="kx-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '8px 14px' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#f0b87c' }}>+{interceptedAlerts.length - 3} MORE MODIFIED ORDERS</span>
                <button type="button" className="kx-btn warn" style={{ minHeight: 36 }} onClick={() => setInterceptedAlerts([])}>Acknowledge all</button>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── LIVE CONNECTION LOST: said plainly, only after it has lasted a few seconds ── */}
      {offlineLong && boardState !== 'error' && (
        <div className="kx-offline" role="alert">
          <WifiOff size={18} color="#e29a58" />
          <div><b>LIVE CONNECTION LOST</b><span>Tickets on screen may be out of date. Checking for new tickets every few seconds.</span></div>
          <button type="button" className="kx-btn warn" onClick={manualRefresh}>Retry now</button>
        </div>
      )}

      {/* ══════════════ BODY ══════════════ */}
      <div className="kx-body">
        {showPermanentSide && <aside className="kx-rail" style={{ width: isLargeTablet ? 188 : 204 }}>{renderRail(false)}</aside>}

        <main className="kx-main">
          {/* prep queue + sort */}
          {!isAggregateView && !showMetricsDashboard && (masterPrepMarqueeList.length > 0 || filteredOrders.length > 1 || lateIds.size > 0 || activeFilterCount > 0) && (
            <div className="kx-ribbon">
              {masterPrepMarqueeList.length > 0 && (
                <div className="kx-prep no-scrollbar" ref={prepRowRef}>
                  <span className="kx-prep-l"><Activity size={12} /> Prep queue</span>
                  {masterPrepMarqueeList.map(([name, qty]) => (
                    <button type="button" key={name} className={`kx-chip${dishFilter === name ? ' on' : ''}`} aria-pressed={dishFilter === name} title={dishFilter === name ? 'Show all tickets' : `Show only tickets with ${name}`}
                      onClick={() => setDishFilter(f => f === name ? '' : name)}><b>{fmtQty(qty)}×</b><span className="nm">{name}</span></button>
                  ))}
                </div>
              )}
              {activeFilterCount > 0 && (
                <button type="button" className="kx-filterbtn" onClick={clearFilters} title="Show every ticket again" aria-label={`Showing ${filteredOrders.length} of ${pendingCount} tickets. Clear filters`}>
                  <span className="lbl">Showing </span><b>{filteredOrders.length}</b><span className="lbl"> of </span><span className="slash">/</span><b>{pendingCount}</b><span className="lbl"> · CLEAR </span><X size={12} />
                </button>
              )}
              {lateIds.size > 0 && (
                <button type="button" className={`kx-latebtn${showLateOnly ? ' on' : ''}`} aria-pressed={showLateOnly} onClick={() => setShowLateOnly(v => !v)}
                  title={showLateOnly ? 'Show all tickets' : `Show only tickets older than ${Math.round(display.lateSec / 60)} minutes`}>
                  <Siren size={13} /> <span className="lbl">{showLateOnly ? 'Showing late' : 'Late'}</span> <b>{lateIds.size}</b>
                </button>
              )}
              {filteredOrders.length > 1 && (
                <button type="button" className="kx-sortbtn" onClick={toggleSort} aria-label={sortOldest ? 'Sorted oldest first. Switch to newest first' : 'Sorted newest first. Switch to oldest first'}><ArrowUpDown size={14} /><span className="lbl">{sortOldest ? 'Oldest first' : 'Newest first'}</span></button>
              )}
            </div>
          )}

          {/* kitchen health (collapsed by default) */}
          {kitchenHealth?.stations?.length > 0 && !showMetricsDashboard && (
            <div className="kx-health">
              <button type="button" className="kx-health-h" onClick={() => setHealthOpen(v => !v)} aria-expanded={healthOpen}>
                <Activity size={14} color="#d3bfa2" /><span className="tt">Kitchen health</span>
                <span className={`st${kitchenHealth.bottleneck ? ' warn' : ''}`}>
                  {kitchenHealth.bottleneck ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                  {kitchenHealth.bottleneck ? `BOTTLENECK: ${kitchenHealth.bottleneck?.name || kitchenHealth.bottleneck}` : 'ALL STATIONS NORMAL'}
                  <ChevronDown size={14} style={{ transform: healthOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </span>
              </button>
              {healthOpen && (
                <div className="kx-health-b">
                  <div className="kx-stg" style={{ gridTemplateColumns: `repeat(${Math.min(kitchenHealth.stations.slice(0, 5).length, isMobile ? 2 : 5)},1fr)` }}>
                    {kitchenHealth.stations.slice(0, 5).map(s => (
                      <div key={s.name} className={s.isBottleneck ? 'bn' : ''}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: '.68rem', fontWeight: 600, color: s.isBottleneck ? '#e29a58' : '#cfc7b8' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                          <span className="mono">{s.orderCount ?? s.pending ?? 0}</span>
                        </div>
                        <div className={`kx-bar${s.isBottleneck ? ' bn' : ''}`}><i style={{ width: `${Math.min(100, Math.max(0, Math.round(Number(s.loadPct ?? 0) || 0)))}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  {kitchenHealth.recommendation && <div style={{ display: 'flex', gap: 8, fontSize: '.7rem', color: '#bdb6a8', lineHeight: 1.55 }}><Zap size={13} color="#b99f78" style={{ flexShrink: 0, marginTop: 2 }} />{kitchenHealth.recommendation}</div>}
                </div>
              )}
            </div>
          )}

          {/* SPEED METRICS */}
          {showMetricsDashboard && (
            <Motion.div className="kx-metrics" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <TrendingUp size={24} color="#d3bfa2" />
              <h2>Speed metrics</h2>
              <p>Session performance — resets at midnight IST</p>
              <div className="kx-mtiles">
                <div className="kx-mt"><span>Tickets dispatched</span><b>{dispatchedToday}</b><small>today</small></div>
                <div className="kx-mt"><span>Avg clear time</span><b className="sm">{avgClearTime}</b><small>per ticket</small></div>
                <div className="kx-mt"><span>Currently pending</span><b>{pendingCount}</b><small>active tickets</small></div>
                <div className="kx-mt"><span>Late now</span><b style={lateIds.size ? { color: '#e29a58' } : undefined}>{lateIds.size}</b><small>over {Math.round(display.lateSec / 60)} min</small></div>
                <div className="kx-mt"><span>Longest wait</span><OldestWait ordersRef={ordersRef} /><small>oldest ticket</small></div>
              </div>
              <button type="button" className="kx-btn" onClick={() => setShowMetricsDashboard(false)}><ChevronLeft size={15} /> Back to kitchen</button>
            </Motion.div>
          )}

          {/* BATCH PREP SUMMARY */}
          {!showMetricsDashboard && isAggregateView && (
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <BarChart3 size={15} color="#b99f78" />
                <span className="kx-prep-l" style={{ color: '#cfc7b8' }}>Batch prep summary</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: '.68rem', color: '#9b978d' }}>{Object.keys(aggregatedTotals).length} items · {filteredOrders.length} tickets</span>
              </div>
              {Object.keys(aggregatedTotals).length === 0 ? (
                renderEmpty(false)
              ) : (
                <div className="kx-sum">
                  {Object.entries(aggregatedTotals).map(([key, qty]) => {
                    const [namePart, typePart] = key.split('__');
                    const isParcel = typePart === 'P';
                    const isDelivery = typePart === 'S';
                    return (
                      <div key={key} className={`kx-sumc${isParcel ? ' p' : ''}`}>
                        <b>{fmtPadQty(qty)}</b>
                        <div className="n">{namePart}</div>
                        <span className={`kx-tag${isParcel ? ' gold' : isDelivery ? ' amber' : ''}`}>{isParcel ? <Package size={10} /> : isDelivery ? <Bike size={10} /> : <UtensilsCrossed size={10} />}{isParcel ? 'PARCEL' : isDelivery ? 'DELIVERY' : 'DINE-IN'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MOBILE — one ticket at a time, swipe */}
          {!showMetricsDashboard && !isAggregateView && useCardView && (
            boardState === 'loading' && orders.length === 0 ? (
              <div aria-hidden="true" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}><KdsCardSkeleton fill /></div>
              </div>
            ) : boardState === 'error' && orders.length === 0 ? (
              <KdsLoadError onRetry={retryBoardLoad} detail={boardError} />
            ) : filteredOrders.length === 0 ? renderEmpty(true) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden', minHeight: 0 }}>
                {filteredOrders.length <= 14 && <div className="kx-dots" role="tablist" aria-label="Tickets">{filteredOrders.map((o, i) => <button type="button" role="tab" aria-selected={i === safeCardIndex} aria-label={`Ticket ${i + 1} of ${filteredOrders.length}: ${shortLabel(o)}`} key={o._id} className={i === safeCardIndex ? 'on' : ''} onClick={() => setMobileCardIndex(i)} />)}</div>}
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }} {...swipeHandlers}>
                  <AnimatePresence mode="wait">
                    <Motion.div key={filteredOrders[safeCardIndex]?._id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} style={{ height: '100%' }}>
                      {filteredOrders[safeCardIndex] && <KDSOrderCard order={filteredOrders[safeCardIndex]} modInfo={modInfo[String(filteredOrders[safeCardIndex]._id)]} checked={checkedItemsGlobal[String(filteredOrders[safeCardIndex]._id)]} fresh={freshIds.has(String(filteredOrders[safeCardIndex]._id))} fill isMobile {...cardProps} />}
                    </Motion.div>
                  </AnimatePresence>
                </div>
                <div className="kx-pager">
                  <button type="button" onClick={() => setMobileCardIndex(i => Math.max(0, i - 1))} disabled={safeCardIndex === 0}><ChevronLeft size={16} /> PREV</button>
                  <span className="mono" style={{ color: '#9b978d', fontSize: '.76rem', fontWeight: 700 }}>{safeCardIndex + 1} / {filteredOrders.length}</span>
                  <button type="button" onClick={() => setMobileCardIndex(i => Math.min(filteredOrders.length - 1, i + 1))} disabled={safeCardIndex === filteredOrders.length - 1}>NEXT <ChevronRight size={16} /></button>
                </div>
              </div>
            )
          )}

          {/* TABLET / DESKTOP — ticket wall */}
          {!showMetricsDashboard && !isAggregateView && !useCardView && (
            <div className="kx-grid no-scrollbar" ref={gridRef} onScroll={e => { scrollTopRef.current = e.currentTarget.scrollTop; captureAnchor(); }} style={{ '--kx-col': `${gridCol}px`, '--kx-zoom': zoom }}>
              {boardState === 'loading' && orders.length === 0 && Array.from({ length: isTablet ? 4 : 6 }, (_, i) => <KdsCardSkeleton key={`sk-${i}`} index={i} />)}
              {boardState === 'error' && orders.length === 0 && <div style={{ gridColumn: '1/-1', display: 'flex' }}><KdsLoadError onRetry={retryBoardLoad} detail={boardError} /></div>}
              <AnimatePresence mode="popLayout">
                {filteredOrders.map(order => <KDSOrderCard key={order._id} order={order} modInfo={modInfo[String(order._id)]} checked={checkedItemsGlobal[String(order._id)]} fresh={freshIds.has(String(order._id))} isMobile={false} {...cardProps} />)}
              </AnimatePresence>
              {boardState === 'ready' && filteredOrders.length === 0 && renderEmpty(false)}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav className="kx-bnav">
          {STATIONS.map(s => (
            <button type="button" key={s.val} className={stationFilter === s.val ? 'on' : ''} aria-pressed={stationFilter === s.val} onClick={() => selectStation(s.val)}>
              <s.Icon size={17} />{s.lbl}{s.val !== 'ALL' && stationCounts[s.val] > 0 ? <span className="n">{stationCounts[s.val]}</span> : null}
            </button>
          ))}
          <button type="button" className={isAggregateView ? 'on' : ''} aria-pressed={isAggregateView && !showMetricsDashboard} onClick={toggleSummary}><BarChart3 size={17} />SUMMARY</button>
          <button type="button" className={showMetricsDashboard ? 'on' : ''} aria-pressed={showMetricsDashboard} onClick={toggleMetrics}><TrendingUp size={17} />METRICS</button>
        </nav>
      )}

      {/* ── WASTAGE PANEL ── */}
      <AnimatePresence>
        {showWastagePanel && (
          <>
            <Motion.div className="kx-scrim" style={{ zIndex: 3000 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWastagePanel(false)} />
            <Motion.div ref={wastageRef} className="kx-sheet" role="dialog" aria-modal="true" aria-label="Wastage log" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              style={{ width: isMobile ? '100vw' : isTablet ? 390 : 430, borderRadius: isMobile ? 0 : undefined }}>
              <div className="kx-sheet-h">
                <div className="t"><div className="ic"><Trash2 size={17} /></div><div><h3>WASTAGE LOG</h3><small>Spoilage · Overcooked · Dropped · Excess</small></div></div>
                <button type="button" className="kx-ib" aria-label="Close" style={{ height: 40, minWidth: 40, padding: 0 }} onClick={() => setShowWastagePanel(false)}><X size={16} /></button>
              </div>
              <div className="kx-tabs">
                {[['log', 'LOG ENTRY'], ['report', 'MONTHLY REPORT']].map(([t, lbl]) => <button type="button" key={t} className={wastageTab === t ? 'on' : ''} onClick={() => setWastageTab(t)}>{lbl}</button>)}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 18px' }}>
                {wastageTab === 'log' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="kx-card">
                      <div className="hd">New entry</div>
                      <div style={{ position: 'relative' }}>
                        <label className="kx-lbl" htmlFor="kx-w-item">Ingredient *</label>
                        <input id="kx-w-item" autoComplete="off" onKeyDown={wastageEnter} className="kx-in" value={wastageForm.itemName} placeholder="Type ingredient name…"
                          onChange={e => {
                            const v = e.target.value;
                            setWastageForm(p => ({ ...p, itemName: v, inventoryId: null }));
                            if (v.length >= 2) { const m = wastageInventory.filter(i => String(i.itemName || '').toLowerCase().includes(v.toLowerCase())).slice(0, 5); setWastageSuggestions(m); setShowWastageSuggest(true); }
                            else setShowWastageSuggest(false);
                          }}
                          onBlur={() => setTimeout(() => setShowWastageSuggest(false), 150)} />
                        {showWastageSuggest && wastageSuggestions.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#121213', border: '1px solid rgba(211,191,162,.32)', borderRadius: 12, zIndex: 10, overflow: 'hidden', marginTop: 4, boxShadow: '0 16px 40px rgba(0,0,0,.7)' }}>
                            {wastageSuggestions.map(s => (
                              <button type="button" key={s._id} onMouseDown={() => { setWastageForm(p => ({ ...p, itemName: s.itemName, inventoryId: s._id, unit: s.unit || 'kg' })); setShowWastageSuggest(false); }}
                                style={{ width: '100%', padding: '11px 14px', background: 'transparent', border: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.78rem', fontWeight: 600, textAlign: 'left' }}>
                                <span>{s.itemName}</span><span className="mono" style={{ fontSize: '.68rem', color: '#9b978d' }}>{s.currentStock}{s.unit}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label className="kx-lbl" htmlFor="kx-w-qty">Quantity *</label><input id="kx-w-qty" onKeyDown={wastageEnter} inputMode="decimal" className="kx-in" type="number" min="0.01" step="0.01" placeholder="0.00" value={wastageForm.quantity} onChange={e => setWastageForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                        <div><label className="kx-lbl" htmlFor="kx-w-unit">Unit</label><select id="kx-w-unit" className="kx-in" value={wastageForm.unit} onChange={e => setWastageForm(p => ({ ...p, unit: e.target.value }))}>{UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                      </div>
                      <div>
                        <label className="kx-lbl">Reason *</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{REASON_OPTIONS.map(r => <button type="button" key={r} className={`kx-pill${wastageForm.reason === r ? ' on' : ''}`} onClick={() => setWastageForm(p => ({ ...p, reason: r }))}>{r}</button>)}</div>
                      </div>
                      <div><label className="kx-lbl" htmlFor="kx-w-by">Logged by *</label><input id="kx-w-by" onKeyDown={wastageEnter} autoComplete="name" className="kx-in" value={wastageForm.loggedBy} onChange={e => setWastageForm(p => ({ ...p, loggedBy: e.target.value }))} placeholder="Chef / Staff name" /></div>
                      <div><label className="kx-lbl" htmlFor="kx-w-notes">Notes (optional)</label><input id="kx-w-notes" onKeyDown={wastageEnter} className="kx-in" value={wastageForm.notes} onChange={e => setWastageForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any context…" /></div>
                      {wastageError && <div className="kx-err">{wastageError}</div>}
                      <button type="button" className="kx-btn solid block" onClick={saveWastageEntry} disabled={wastageDisabled} style={{ minHeight: 48 }}>
                        {wastageSaving ? <><RotateCcw size={14} className="spin" /> Saving…</> : <><Trash2 size={14} /> Log wastage</>}
                      </button>
                    </div>

                    {wastageLoading ? (
                      <div style={{ textAlign: 'center', padding: 24, color: '#9b978d', fontSize: '.74rem' }}>Loading log…</div>
                    ) : wastageLog.length > 0 ? (
                      <div>
                        <div className="kx-lbl" style={{ marginBottom: 10 }}>Today's entries — {wastageLog.length}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {[...wastageLog].reverse().map(e => (
                            <div key={e._id} className="kx-ent">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontWeight: 600, fontSize: '.84rem' }}>{e.itemName}</span>
                                  <span className="kx-tag gold mono">{e.quantity}{e.unit}</span>
                                  {Number(e.totalCost) > 0 && <span className="mono" style={{ marginLeft: 'auto', fontSize: '.7rem', color: '#d3bfa2', fontWeight: 700 }}>₹{Number(e.totalCost).toFixed(0)}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span className="kx-tag">{e.reason}</span>
                                  <span style={{ fontSize: '.68rem', color: '#9b978d' }}>{e.loggedBy}</span>
                                  {e.notes && <span style={{ fontSize: '.68rem', color: '#8e8a80', fontStyle: 'italic' }}>{e.notes}</span>}
                                </div>
                              </div>
                              <button type="button" aria-label="Remove entry" className="kx-sq" style={{ width: 34, minHeight: 34, borderRadius: 10 }} onClick={() => deleteWastageEntry(e._id)}><X size={13} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px 20px', borderRadius: 16, border: '1px dashed rgba(211,191,162,.2)', fontSize: '.72rem', color: '#6f6c64', fontWeight: 500 }}>No wastage entries today</div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {wastageAnalytics ? (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                          {[
                            { l: 'TOTAL COST', v: `₹${Math.round(wastageAnalytics.totalCost || 0).toLocaleString()}` },
                            { l: 'ENTRIES', v: wastageAnalytics.totalEntries || 0 },
                            { l: 'TOP ITEM', v: wastageAnalytics.topWasted?.[0]?.name || '—' },
                          ].map(s => (
                            <div key={s.l} className="kx-card" style={{ padding: '12px 10px', textAlign: 'center', gap: 6 }}>
                              <div className="kx-lbl" style={{ margin: 0 }}>{s.l}</div>
                              <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#d3bfa2', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        {wastageAnalytics.byReason && Object.keys(wastageAnalytics.byReason).length > 0 && (
                          <div className="kx-card">
                            <div className="hd" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Scale size={12} /> By reason</div>
                            {Object.entries(wastageAnalytics.byReason).sort((a, b) => (Number(b[1]?.cost) || 0) - (Number(a[1]?.cost) || 0)).map(([reason, data]) => {
                              const pct = wastageAnalytics.totalEntries > 0 ? Math.round(((Number(data.count) || 0) / wastageAnalytics.totalEntries) * 100) : 0;
                              return (
                                <div key={reason}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', fontWeight: 600 }}>
                                    <span>{reason}</span>
                                    <span className="mono" style={{ color: '#d3bfa2' }}>{Number(data.cost) > 0 ? `₹${Number(data.cost).toFixed(0)}` : `${Number(data.count) || 0}×`}<span style={{ color: '#6f6c64', marginLeft: 7 }}>{pct}%</span></span>
                                  </div>
                                  <div className="kx-bar"><i style={{ width: `${pct}%` }} /></div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {(wastageAnalytics.dailyTrend || []).length > 0 && (
                          <div className="kx-card">
                            <div className="hd" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><TrendingDown size={12} /> Daily cost trend (30 days)</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 }}>
                              {(() => {
                                const maxC = Math.max(...wastageAnalytics.dailyTrend.map(d => Number(d.cost) || 0), 1);
                                return wastageAnalytics.dailyTrend.map(d => (
                                  <div key={d.date} title={`${d.date}: ₹${(Number(d.cost) || 0).toFixed(0)}`}
                                    style={{ flex: 1, minWidth: 0, height: `${Math.max(8, Math.round(((Number(d.cost) || 0) / maxC) * 100))}%`, background: Number(d.cost) > 0 ? `rgba(211,191,162,${0.25 + ((Number(d.cost) || 0) / maxC) * 0.65})` : 'rgba(255,255,255,.06)', borderRadius: '3px 3px 0 0' }} />
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                        <button type="button" className="kx-btn block" onClick={fetchWastageAnalytics}><RefreshCw size={13} /> Refresh report</button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}><button type="button" className="kx-btn" onClick={fetchWastageAnalytics}>Load monthly report</button></div>
                    )}
                  </div>
                )}
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DISPLAY & ALERTS (saved on this device) ── */}
      <AnimatePresence>
        {showSettings && (
          <>
            <Motion.div className="kx-scrim" style={{ zIndex: 3100 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} />
            <div className="kx-modalwrap" onClick={() => setShowSettings(false)}>
              <Motion.div ref={settingsRef} className="kx-modal" role="dialog" aria-modal="true" aria-label="Display and alerts" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }} style={{ width: isMobile ? '92vw' : 400, maxHeight: 'calc(88vh - 20px)' }}>
                <div className="kx-sheet-h">
                  <div className="t"><div className="ic"><Settings size={15} /></div><div><h3>DISPLAY &amp; ALERTS</h3><small>Saved on this screen only</small></div></div>
                  <button type="button" className="kx-ib" aria-label="Close" style={{ height: 40, minWidth: 40, padding: 0 }} onClick={() => setShowSettings(false)}><X size={15} /></button>
                </div>
                <div style={{ padding: '12px 14px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="kx-row stack"><div>Ticket size<small>Make tickets smaller or larger</small></div>
                    <div className="kx-mini">{[['small', 'Small'], ['normal', 'Normal'], ['large', 'Large']].map(([v, l]) => <button type="button" key={v} className={display.size === v ? 'on' : ''} onClick={() => updateDisplay({ size: v })}>{l}</button>)}</div></div>
                  <div className="kx-row stack"><div>Delayed after<small>Ring turns gold, "DELAYED" shows</small></div>
                    <div className="kx-mini">{WARN_OPTIONS.map(([l, sec]) => <button type="button" key={sec} className={display.warnSec === sec ? 'on' : ''} onClick={() => updateDisplay({ warnSec: sec })}>{l}</button>)}</div></div>
                  <div className="kx-row stack"><div style={{ minWidth: 0 }}>Overdue after<small>Amber glow, alert, late filter</small></div>
                    <div className="kx-mini">{LATE_OPTIONS.map(([l, sec]) => <button type="button" key={sec} className={display.lateSec === sec ? 'on' : ''} onClick={() => updateDisplay({ lateSec: sec })}>{l}</button>)}</div></div>
                  <div className="kx-row"><div>Overdue alert<small>Chime + voice, once per ticket</small></div>
                    <button type="button" role="switch" aria-checked={voicePrefs.overdueAlert} aria-label="Overdue alert" className={`kx-sw${voicePrefs.overdueAlert ? ' on' : ''}`} onClick={() => updateVoicePrefs({ overdueAlert: !voicePrefs.overdueAlert })} /></div>
                  <div className="kx-row"><div>Keep screen awake<small>{!('wakeLock' in navigator) ? 'Not supported by this browser' : display.keepAwake ? (awakeOn ? 'Active: the screen will not sleep' : 'Waiting for the browser to allow it') : 'Screen may sleep and miss tickets'}</small></div>
                    <button type="button" role="switch" aria-checked={display.keepAwake} aria-label="Keep screen awake" className={`kx-sw${display.keepAwake ? ' on' : ''}`} onClick={() => updateDisplay({ keepAwake: !display.keepAwake })} /></div>
                  {fullscreenSupported && (
                    <button type="button" className="kx-btn block" onClick={toggleFullscreen}>{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} {isFullscreen ? 'Exit full screen' : 'Go full screen'}</button>
                  )}
                  <button type="button" className="kx-btn block" onClick={() => { updateDisplay({ ...DEFAULT_DISPLAY }); }} style={{ borderColor: 'rgba(211,191,162,.16)', background: 'transparent', color: '#9b978d' }}>Reset to defaults</button>
                </div>
              </Motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── 86 (OUT OF STOCK) MODAL — pick the dish, pick a reason, hide it with the reason logged ── */}
      <AnimatePresence>
        {eightySixModal && (
          <>
            <Motion.div className="kx-scrim" style={{ zIndex: 3100 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEightySixModal(null)} />
            {/* Centering wrapper must stay transform-free: framer-motion owns the transform on the modal below. */}
            <div className="kx-modalwrap" onClick={() => setEightySixModal(null)}>
              <Motion.div ref={modal86Ref} className="kx-modal" role="dialog" aria-modal="true" aria-label="86 a dish" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }} style={{ width: isMobile ? '92vw' : 380, maxHeight: 'calc(88vh - 40px)' }}>
                <div className="kx-sheet-h">
                  <div className="t"><div className="ic" style={{ background: 'rgba(226,154,88,.12)', borderColor: 'rgba(226,154,88,.4)', color: '#e29a58' }}><PackageX size={17} /></div><div><h3>86 A DISH</h3><small>{eightySixModal.categoryName}</small></div></div>
                  <button type="button" className="kx-ib" aria-label="Close" style={{ height: 40, minWidth: 40, padding: 0 }} onClick={() => setEightySixModal(null)}><X size={16} /></button>
                </div>
                <div style={{ padding: '12px 14px 14px', overflowY: 'auto' }}>
                  <div className="kx-lbl">Which dish?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, maxHeight: 220, overflowY: 'auto' }}>
                    {dishesFor86.map(dish => <button type="button" key={dish._id} className={`kx-opt${selectedDish86?._id === dish._id ? ' on' : ''}`} onClick={() => setSelectedDish86(dish)}>{dish.name}</button>)}
                    {dishesFor86.length === 0 && <div style={{ fontSize: '.7rem', color: '#9b978d', fontStyle: 'italic', padding: '8px 2px' }}>Everything in this category is already 86'd.</div>}
                  </div>
                  {dishesOut86.length > 0 && (
                    <>
                      <div className="kx-lbl">Out of stock — tap to restore</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        {dishesOut86.map(d => (
                          <div key={d._id} className="kx-ent" style={{ alignItems: 'center' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '.8rem' }}>{d.name}</div>
                              {d.outOfStockReason && <div style={{ fontSize: '.68rem', color: '#9b978d', marginTop: 2 }}>{(EIGHTY_SIX_REASONS.find(r => r.id === d.outOfStockReason) || {}).label || d.outOfStockReason}</div>}
                            </div>
                            <button type="button" className="kx-btn" style={{ minHeight: 32, padding: '0 12px' }} onClick={() => restore86(d)}>Restore</button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {selectedDish86 && (
                    <>
                      <div className="kx-lbl">Why?</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                        {EIGHTY_SIX_REASONS.map(r => { const RIcon = r.icon; return <button type="button" key={r.id} className={`kx-opt${selectedReason86 === r.id ? ' on' : ''}`} onClick={() => setSelectedReason86(r.id)}><RIcon size={15} />{r.label}</button>; })}
                      </div>
                      <button type="button" className="kx-btn warn block" style={{ minHeight: 50 }} onClick={confirm86}><EyeOff size={15} /> 86 "{selectedDish86.name}"</button>
                    </>
                  )}
                </div>
              </Motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
};

// If the logo picture cannot be loaded (offline kiosk, missing file) show the name, not a broken-image icon.
const BrandLogo = () => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="kx-logo">
      {failed ? <span className="kx-logo-txt">PRATYEKSHA</span> : <img src="/pratyeksha-logo.png" alt="Pratyeksha" onError={() => setFailed(true)} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   LIVE TIMERS — one shared 1-second clock for the whole screen
   Every ticket used to run two intervals and re-render itself (and its whole dish list) every second. Now the clock ticks once, and
   only the few characters that show a time are rewritten, straight in the DOM. A ticket re-renders only when its own data changes.
═══════════════════════════════════════════════════════════════════ */
const kxClock = {
  subs: new Set(),
  timer: null,
  subscribe(fn) {
    this.subs.add(fn);
    if (!this.timer) this.timer = setInterval(() => { const now = Date.now(); this.subs.forEach(f => f(now)); }, 1000);
    return () => { this.subs.delete(fn); if (!this.subs.size) { clearInterval(this.timer); this.timer = null; } };
  },
};
const subscribeClockStore = cb => kxClock.subscribe(() => cb());
const RING_C = 2 * Math.PI * 19;

// delayed / overdue state of a ticket: re-renders the ticket only at the moment the state CHANGES, not every second
const useUrgency = (startMs, warnSec, lateSec) => useSyncExternalStore(subscribeClockStore, () => {
  const s = (Date.now() - startMs) / 1000;
  return s >= lateSec ? 'high' : s >= warnSec ? 'med' : 'low';
});

const AgeRing = React.memo(function AgeRing({ startMs, lateSec, urgency, ringColor }) {
  const txt = useRef(null);
  const arc = useRef(null);
  useLayoutEffect(() => {
    const paint = now => {
      const s = Math.max(0, Math.floor((now - startMs) / 1000));
      if (txt.current) { txt.current.textContent = fmt(s); txt.current.style.fontSize = s >= 3600 ? '.64rem' : ''; txt.current.style.letterSpacing = s >= 3600 ? '-.04em' : ''; }
      if (arc.current) arc.current.setAttribute('stroke-dasharray', `${Math.min(1, s / lateSec) * RING_C} ${RING_C}`);
    };
    paint(Date.now());
    return kxClock.subscribe(paint);
  }, [startMs, lateSec]);
  return (
    <div className={`kx-time ${urgency}`} role="timer" aria-label="Ticket age">
      <svg viewBox="0 0 44 44" width="50" height="50" aria-hidden="true">
        <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3.5" />
        <circle ref={arc} cx="22" cy="22" r="19" fill="none" stroke={ringColor} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <span className="tv" ref={txt} />
    </div>
  );
});

// the little "0:42" under a dish; turns into a SLOW warning after 5 minutes
const ItemTimer = React.memo(function ItemTimer({ startMs }) {
  const root = useRef(null);
  const txt = useRef(null);
  useLayoutEffect(() => {
    const paint = now => {
      const s = Math.max(0, Math.floor((now - startMs) / 1000));
      if (txt.current) txt.current.textContent = fmt(s);
      if (root.current) root.current.classList.toggle('slow', s >= 300);
    };
    paint(Date.now());
    return kxClock.subscribe(paint);
  }, [startMs]);
  return (
    <span className="kx-tm" ref={root}>
      <Timer size={10} /><span ref={txt} />
    </span>
  );
});

// "Longest wait" tile of the metrics screen
const OldestWait = ({ ordersRef }) => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const paint = now => {
      let oldest = 0;
      ordersRef.current.forEach(o => { if ((o.items || []).some(isKitchenItem)) { const a = (now - createdMs(o)) / 1000; if (a > oldest) oldest = a; } });
      if (ref.current) ref.current.textContent = oldest > 0 ? fmt(oldest) : '—';
    };
    paint(Date.now());
    return kxClock.subscribe(paint);
  }, [ordersRef]);
  return <b className="sm" ref={ref} />;
};

/* ═══════════════════════════════════════════════════════════════════
   TICKET CARD
═══════════════════════════════════════════════════════════════════ */
// forwardRef: <AnimatePresence mode="popLayout"> hands every child a ref to measure it. A plain function component cannot take one
// ("Function components cannot be given refs"), so an exiting ticket could not be measured and the grid jumped when a ticket was dispatched.
// React.memo: every prop is stable (ids, primitives, per-ticket slices), so a ticket re-renders only when ITS data changes.
const KDSOrderCard = React.memo(React.forwardRef(({
  order, onReady, fresh, fill, modInfo, warnSec = 450, lateSec = 900, layoutAnim = true,
  dishToCategoryMap, dishToVegMap,
  selectedCategory, checked, setChecked,
  socketRef, isNonVegMode, tenantOnlyVeg, isMobile,
  onItemSynced, onSpeak,
}, ref) => {
  // KDSOrderCard is defined outside KitchenView, so the route's tenantId is not in scope here.
  const tenantId = order.tenantId;
  const otype = getOrderType(order);
  const isAggOrder = otype === 'swiggy' || otype === 'zomato';
  const isParcelOrder = otype === 'parcel';
  const isChecked = idx => !!(checked && checked[idx]);

  const [showNote, setShowNote] = useState(false);
  // The server has no field for kitchen notes, so this stays on this device. It used to vanish on every refresh / reconnect;
  // keep it per ticket in localStorage (blocked storage just means it is not remembered).
  const noteKey = `kds_note_${order._id}`;
  const [localNote, setLocalNoteState] = useState(() => { try { return localStorage.getItem(`kds_note_${order._id}`) || ''; } catch { return ''; } });
  const setLocalNote = v => { setLocalNoteState(v); try { if (v) localStorage.setItem(noteKey, v); else localStorage.removeItem(noteKey); } catch { /* ignore */ } };

  const createdAtMs = useMemo(() => new Date(order.createdAt).getTime() || Date.now(), [order.createdAt]); // NaN when createdAt is missing/invalid
  const urgency = useUrgency(createdAtMs, warnSec, lateSec);
  const ringColor = urgency === 'high' ? '#e29a58' : urgency === 'med' ? '#d3bfa2' : '#8a704d';

  const kitchenItems = (order.items || []).filter(isKitchenItem);
  const checkedCount = (order.items || []).reduce((n, it, idx) => (isKitchenItem(it) && isChecked(idx)) ? n + 1 : n, 0);
  const totalItems = kitchenItems.length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const allDone = progressPct === 100 && totalItems > 0;

  const toggleItemCrossed = async idx => {
    const key = `${order._id}-${idx}`;
    // A second tap while the first save is in flight carried the same (now stale) version: guaranteed 409 and a flicker.
    if (pendingToggles.has(key)) return;
    const next = !isChecked(idx);
    pendingToggles.set(key, { o: String(order._id), i: idx });
    setChecked(order._id, idx, next);
    socketRef?.current?.emit('kds_item_cross_sync', { orderId: order._id, tenantId: order.tenantId, idx, newState: next });
    try {
      const currentItem = order.items?.[idx] || {};
      const r = await axios.patch(`${BASE_URL}/admin/orders/${order._id}/kds-item`, {
        itemIndex: idx, completed: next, tenantId,
        timingVersion: Number.isInteger(Number(currentItem.kdsTimingVersion)) ? Number(currentItem.kdsTimingVersion) : 0,
      });
      // the server's copy of the dish (timing version, prep seconds) replaces ours
      onItemSynced?.(order._id, idx, r.data?.item, r.data?.order ? { prepTimeSeconds: r.data.order.prepTimeSeconds, prepTimeMinutes: r.data.order.prepTimeMinutes } : null);
    } catch (err) {
      const authoritative = err?.response?.data?.item;
      if (err?.response?.status === 409 && authoritative) {
        onItemSynced?.(order._id, idx, authoritative, null);
        const serverState = !!authoritative.kdsCompletedAt || !!authoritative.isCrossedLocal;
        setChecked(order._id, idx, serverState);
        // Other screens were told `next` before the save; tell them what the server really holds.
        socketRef?.current?.emit('kds_item_cross_sync', { orderId: order._id, tenantId: order.tenantId, idx, newState: serverState });
      } else {
        setChecked(order._id, idx, !next);
        socketRef?.current?.emit('kds_item_cross_sync', { orderId: order._id, tenantId: order.tenantId, idx, newState: !next });
      }
      console.error('KDS item timing save failed:', err?.message || err);
    } finally { pendingToggles.delete(key); }
  };

  // Which dishes did the customer change? The server flags them (item.modChange); the socket event is the fallback by dish name.
  const sameDish = (a, b) => String(a || '').toLowerCase().trim() === String(b || '').toLowerCase().trim();
  const modOf = item => {
    if (item.modChange === 'new' || item.modChange === 'qty') return { kind: item.modChange, from: item.modPrevQty, to: item.quantity };
    const q = modInfo?.qty?.find(m => sameDish(m.name, item.name));
    if (q) return { kind: 'qty', from: q.from, to: q.to };
    if (modInfo?.added?.some(m => sameDish(m.name, item.name))) return { kind: 'new' };
    return null;
  };
  const removedDishes = modInfo?.removed?.length ? modInfo.removed : (order.replacedInfo?.removed || []);
  const isMod = !!order.isModified || !!modInfo;
  const hasNote = kitchenItems.some(i => i.suggestion && String(i.suggestion).trim());

  const sourceLabel = {
    waitlist: 'WAITLIST', reservation: 'RESERVATION', 'counter-pickup': 'PICKUP', takeaway: 'TAKEAWAY', direct: 'DINE-IN', swiggy: 'SWIGGY', zomato: 'ZOMATO',
  }[order.source] || 'DINE-IN';
  const TypeIcon = isAggOrder ? Bike : isParcelOrder ? Package : UtensilsCrossed;
  const typeLabel = isAggOrder ? 'DELIVERY' : isParcelOrder ? 'PARCEL' : 'DINE-IN';
  const numClass = otype === 'swiggy' ? ' sw' : otype === 'zomato' ? ' zo' : '';
  const tableLabel = otype === 'swiggy' ? 'SWIGGY' : otype === 'zomato' ? 'ZOMATO' : isParcelOrder ? 'PARCEL' : `T-${String(order.tableNumber ?? '').trim() || '?'}`;

  return (
    <Motion.article
      ref={ref}
      data-oid={order._id}
      layout={layoutAnim}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`kx-tk ${urgency}${otype === 'swiggy' ? ' swiggy' : otype === 'zomato' ? ' zomato' : ''}${fresh ? ' fresh' : ''}${fill ? ' fill' : ''}`}
    >
      {/* ── HEADER ── */}
      <div className="kx-tk-h">
        <div style={{ minWidth: 0, flex: 1 }}>
          <span className="kx-tk-type"><TypeIcon size={13} /> {typeLabel}</span>
          <div className={`kx-tk-num${numClass}`}>{tableLabel}</div>
          <div className="kx-tk-meta">
            {fresh && !isMod && <span className="kx-tag gold">NEW</span>}
            {isMod && <span className="kx-tag amber">MODIFIED</span>}
            {hasNote && <span className="kx-tag amber">NOTE</span>}
            <span className={`kx-tag${otype === 'swiggy' ? ' sw' : otype === 'zomato' ? ' zo' : ''}`}>{sourceLabel}</span>
            <span className="kx-tag id">#{String(order._id).slice(-4).toUpperCase()}{order.aggregatorOrderId ? ` · ${order.aggregatorOrderId.toString().slice(-6)}` : ''}</span>
          </div>
        </div>
        <div>
          <AgeRing startMs={createdAtMs} lateSec={lateSec} urgency={urgency} ringColor={ringColor} />
          {urgency !== 'low' && <span className="kx-late">{urgency === 'high' ? 'OVERDUE' : 'DELAYED'}</span>}
        </div>
      </div>

      {/* AGGREGATOR STRIP */}
      {isAggOrder && (
        <div className={`kx-strip ${otype === 'zomato' ? 'zo' : 'sw'}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 800, letterSpacing: '.1em' }}><Zap size={12} /> {otype.toUpperCase()} ORDER</span>
          {order.aggregatorCustomer?.name && <span style={{ color: '#cfc7b8' }}>{order.aggregatorCustomer.name}</span>}
          {order.aggregatorRaw?.expectedDeliveryTime && <span className="mono">~{order.aggregatorRaw.expectedDeliveryTime}m</span>}
        </div>
      )}

      {/* MODIFIED STRIP — only what was taken off; added / changed dishes are highlighted in the list below */}
      {isMod && (
        <div className="kx-strip mod">
          <div style={{ fontWeight: 800, letterSpacing: '.08em' }}>⚠ ORDER MODIFIED — CHANGED DISHES ARE MARKED</div>
          {removedDishes.length > 0 && <div style={{ fontWeight: 700, marginTop: 2 }}>Removed: {removedDishes.map(p => `${p.quantity}× ${p.name}`).join(', ')}</div>}
        </div>
      )}

      {/* PREP PROGRESS */}
      {totalItems > 0 && (
        <div className="kx-prog">
          <div className="bar"><i style={{ width: `${progressPct}%` }} /></div>
          <span className={allDone ? 'ok' : ''}>{checkedCount}/{totalItems}</span>
        </div>
      )}

      {/* ── DISHES ── */}
      <div className="kx-items no-scrollbar">
        {(order.items || []).map((item, idx) => {
          if (!isKitchenItem(item)) return null;

          const catId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || null;
          if (selectedCategory !== 'ALL' && catId !== selectedCategory.toLowerCase().trim()) return null;

          const isVeg = item.isVeg !== undefined ? item.isVeg !== false : (dishToVegMap?.[item.name?.toLowerCase().trim()] !== false);
          const modeMatch = tenantOnlyVeg ? true : (isNonVegMode ? !isVeg : isVeg);
          if (!modeMatch) return null;

          const crossed = isChecked(idx);
          // every dish is timed from when the kitchen got the order (or the server's own start time for that dish)
          const itemStartMs = new Date(item.kdsStartedAt || order.kdsStartedAt || order.createdAt).getTime() || createdAtMs;
          const portionTxt = item.portion?.toUpperCase() || 'STANDARD';
          const mod = !crossed ? modOf(item) : null;

          return (
            <div
              key={idx}
              role="button" tabIndex={0} aria-pressed={crossed}
              className={`kx-it${crossed ? ' done' : mod ? ' mod' : ' run'}`}
              onClick={() => toggleItemCrossed(idx)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItemCrossed(idx); } }}
            >
              <div className="kx-qty">{fmtQty(item.quantity)}</div>
              <div className="kx-it-b">
                <div className="kx-nm">
                  {!tenantOnlyVeg && <span className={`kx-vd${isVeg ? '' : ' n'}`}><i /></span>}
                  <span className={item.isChefSpecial && !crossed ? 'sp' : undefined} style={item.isChefSpecial && !crossed ? undefined : { display: 'contents' }}>
                    {item.isChefSpecial && !crossed && <Sparkles size={12} />}{String(item.name || '').trim() || 'Unnamed dish'}
                  </span>
                  {mod && <span className="kx-tag amber">{mod.kind === 'new' ? 'ADDED' : `QTY ${mod.from ?? '?'}→${mod.to ?? fmtQty(item.quantity)}`}</span>}
                </div>
                {!crossed && (
                  <div className="kx-sub">
                    <span className={item.portion?.toLowerCase() === 'half' ? 'half' : undefined}>{portionTxt}</span>
                    <ItemTimer startMs={itemStartMs} />
                  </div>
                )}
                {crossed && item.kdsPrepTimeSeconds != null && <div className="kx-sub"><span className="kx-tm" style={{ color: '#9b978d' }}><Timer size={10} /> Done {fmtSpan(item.kdsPrepTimeSeconds)}</span></div>}
                {item.suggestion && !crossed && <div className="kx-note"><StickyNote size={14} /><span>{item.suggestion}</span></div>}
              </div>
              <div className="kx-chk">{crossed && <Check size={16} strokeWidth={3} />}</div>
            </div>
          );
        })}
      </div>

      {/* CHEF NOTE */}
      {showNote && (
        <div className="kx-notebox">
          <StickyNote size={14} color="#b99f78" style={{ flexShrink: 0, marginTop: 3 }} />
          <textarea rows={2} value={localNote} onChange={e => setLocalNote(e.target.value)} placeholder="Private note for this ticket (shown on this screen only)…" />
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="kx-tk-f">
        <div className="row">
          <button type="button" className={`kx-sq${showNote || localNote ? ' on' : ''}`} aria-label={showNote ? 'Hide note' : 'Add note'} title="Note" onClick={() => setShowNote(v => !v)}><StickyNote size={16} /></button>
          <button type="button" className="kx-sq" aria-label="Read this ticket aloud" title="Read aloud" onClick={() => onSpeak?.(order)}><Volume2 size={17} /></button>
          <button type="button" className={`kx-go${urgency === 'high' ? ' late' : ''}`} onClick={() => onReady(order._id)} style={isMobile ? { minHeight: 46 } : undefined}>
            {urgency === 'high' && <Flame size={15} strokeWidth={2.5} />}
            {urgency === 'high' ? 'Dispatch now' : allDone ? <><CheckCircle2 size={15} /> All ready — dispatch</> : <>Complete ticket <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </Motion.article>
  );
}));
KDSOrderCard.displayName = 'KDSOrderCard';

/* ═══════════════════════════════════════════════════════════
   LOADING / EMPTY / ERROR STATES
═══════════════════════════════════════════════════════════ */
const Sk = ({ w, h, r = 7, style }) => <div className="kx-sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;

/* Same shell as a ticket (header + ring, progress, dish rows, action row) so nothing shifts when data arrives. */
const KdsCardSkeleton = ({ index = 0, fill = false }) => (
  <div aria-hidden="true" className={`kx-tk${fill ? ' fill' : ''}`} style={{ '--d': `${index * 0.14}s`, minHeight: fill ? undefined : 250 }}>
    <div className="kx-tk-h">
      <div style={{ flex: 1 }}>
        <Sk w={64} h={10} r={4} />
        <Sk w={90} h={24} r={7} style={{ margin: '6px 0' }} />
        <div style={{ display: 'flex', gap: 6 }}><Sk w={52} h={16} r={6} /><Sk w={44} h={16} r={6} /></div>
      </div>
      <Sk w={50} h={50} r={25} />
    </div>
    <div style={{ padding: '4px 12px 8px 16px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="kx-it" style={{ cursor: 'default' }}>
          <Sk w={30} h={30} r={9} />
          <div style={{ paddingTop: 3 }}><Sk w={`${58 + ((i * 17 + index * 9) % 30)}%`} h={14} r={4} style={{ marginBottom: 8 }} /><Sk w={`${26 + ((i * 11 + index * 7) % 20)}%`} h={9} r={3} /></div>
          <Sk w={22} h={22} r={11} />
        </div>
      ))}
    </div>
    <div className="kx-tk-f"><div className="row"><Sk w={40} h={40} r={12} /><Sk w={40} h={40} r={12} /><Sk w="100%" h={40} r={12} style={{ flex: 1 }} /></div></div>
  </div>
);

const KdsSidebarSkeleton = () => (
  <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflow: 'hidden' }}>
    {[78, 62, 84, 56, 70, 66].map((w, i) => (
      <div key={i} className="kx-nav" style={{ '--d': `${i * 0.1}s`, cursor: 'default' }}>
        <span className="t"><Sk w={14} h={14} r={4} /><Sk w={Math.round(w * 0.9)} h={10} r={3} /></span>
        <Sk w={28} h={18} r={7} />
      </div>
    ))}
  </div>
);

/* Shown under "KITCHEN CLEAR": says whether nothing arrived, or orders arrived and were hidden (station / veg / category / search filters,
   or tickets that contain only extra items, which never go to the kitchen). Without it both cases look identical. */
const KdsEmptyDetail = ({ loaded, shown, tenantId, at }) => {
  let host = '';
  try { host = new URL(BASE_URL, window.location.origin).host; } catch { host = String(BASE_URL || ''); }
  const hidden = Math.max(0, loaded - shown);
  return (
    <p data-testid="kds-empty-detail" style={{ fontSize: '.7rem', color: '#8e8a80', margin: '4px 0 0', fontWeight: 500, maxWidth: 440, lineHeight: 1.55, wordBreak: 'break-word' }}>
      {`Checked ${at ? `at ${new Date(at).toLocaleTimeString()}` : 'just now'}: ${loaded} pending order${loaded === 1 ? '' : 's'} (${tenantId || '?'} · ${host}).`}
      {hidden > 0 ? ` ${hidden} not shown: ${hidden === 1 ? 'it has' : 'they have'} only packaged extras that never go to the kitchen.` : ''}
    </p>
  );
};

/* First load failed: say so and offer a retry instead of an endless skeleton or a false "KITCHEN CLEAR". */
const KdsLoadError = ({ onRetry, detail }) => (
  <div role="alert" className="kx-center" style={{ flex: 1 }}>
    <div className="ic" style={{ borderColor: 'rgba(226,154,88,.4)', color: '#e29a58' }}><WifiOff size={30} /></div>
    <h3 style={{ color: '#d3bfa2' }}>Couldn't load tickets</h3>
    <p>Check the connection. This screen keeps retrying every few seconds.</p>
    {detail && <p data-testid="kds-error-detail" style={{ color: '#e29a58', fontWeight: 600 }}>{detail}</p>}
    <button type="button" className="kx-btn solid" onClick={onRetry}>Try again</button>
  </div>
);

/* The kitchen screen opens straight from its link, exactly as before. Only if the server answers "sign-in required"
   (REQUIRE_OPERATOR_AUTH is on and this tablet has no valid session) does it show a sign-in form, using the restaurant's
   operator account. The session is stored under its own key and lasts 30 days. */
const KitchenView = () => {
  const { tenantId } = useParams();
  const [needLogin, setNeedLogin] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const onAuth = () => { setNeedLogin(true); setErr(''); };
    window.addEventListener(OPERATOR_AUTH_EVENT, onAuth);
    return () => window.removeEventListener(OPERATOR_AUTH_EVENT, onAuth);
  }, []);
  if (!needLogin) return <KitchenViewInner />;
  const submit = async (e) => {
    e.preventDefault();
    if (busy || !form.username || !form.password) return;
    setBusy(true); setErr('');
    try {
      const { data } = await axios.post(`${BASE_URL}/admin/login`, { username: form.username.trim(), password: form.password });
      if (tenantId && data.tenantId !== tenantId) { setErr('These credentials belong to a different restaurant.'); return; }
      setKitchenToken(data.token);
      setForm({ username: '', password: '' });
      setNeedLogin(false); // remounts the kitchen screen, which now sends the new session
    } catch (ex) {
      const st = ex?.response?.status, d = ex?.response?.data;
      setErr(!st ? 'Cannot reach the server. Check the internet connection.'
        : st === 402 ? (d?.error || 'This subscription has expired.')
          : st === 429 ? (d?.error || 'Too many attempts. Try again in a few minutes.')
            : st === 401 ? 'Incorrect username or password.' : (d?.error || 'Sign-in failed. Please try again.'));
    } finally { setBusy(false); }
  };
  return (
    <div className="kx" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <style>{KX_CSS}</style>
      <form onSubmit={submit} className="kx-modal" style={{ width: '100%', maxWidth: 400, padding: 28, gap: 14 }}>
        <div style={{ alignSelf: 'flex-start' }}><BrandLogo /></div>
        <div className="kx-kds" style={{ marginTop: 6 }}><ChefHat size={13} /> Kitchen display</div>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.6rem', fontWeight: 700 }}>Kitchen sign-in</div>
        <div style={{ fontSize: '.8rem', color: '#9b978d', lineHeight: 1.5 }}>Sign in with the restaurant account to open the kitchen screen on this device.</div>
        <input className="kx-in" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" autoCapitalize="none" autoCorrect="off" autoComplete="username" style={{ padding: '14px 16px', fontSize: '1rem' }} />
        <input className="kx-in" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" autoComplete="current-password" style={{ padding: '14px 16px', fontSize: '1rem' }} />
        {err && <div role="alert" className="kx-err">{err}</div>}
        <button type="submit" className="kx-btn solid block" disabled={busy || !form.username || !form.password} style={{ minHeight: 52 }}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
};

export default KitchenView;