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
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import SupportContact from './SupportContact.jsx';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_BASE_URL, { SOCKET_BASE_URL } from './apiBase.js';
import { OPERATOR_AUTH_EVENT, setKitchenToken, getOperatorToken } from './operatorAuth.js';
import { playAlertSound } from './alertSounds.js';
import PwaInstallButton from './PwaInstallButton.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Timer, StickyNote, X, Zap, History, LayoutGrid, BarChart3, Package, UtensilsCrossed, Activity, Coffee,
  Layers, Flame, EyeOff, Sparkles, TrendingUp, WifiOff, AlignJustify, Trash2, AlertTriangle, RotateCcw, TrendingDown,
  RefreshCw, Search, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, Scale, PackageX, ShieldAlert, Wrench,
  Volume2, VolumeX, Bike, Check, ArrowUpDown, ChevronDown,
} from 'lucide-react';
import SpoonForkIcon from './SpoonForkIcon.jsx';
const BellRing = SpoonForkIcon; // crossed spoon & fork instead of the bell

const BASE_URL = API_BASE_URL;

/* ─── helpers ─── */
const useWindowSize = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const h = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
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

// Module-level so the (module-level) order card and the board share it: keys of dish checks whose save is still in flight.
// A refresh that lands in that window used to un-tick the dish the chef had just ticked.
const pendingToggleKeys = new Set();

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
const DEFAULT_VOICE_PREFS = { voice: true, chime: true, repeat: 1, rate: 'normal' };
const RATE_VALUE = { slow: 0.8, normal: 0.92, fast: 1.06 };
const loadVoicePrefs = () => {
  try { return { ...DEFAULT_VOICE_PREFS, ...JSON.parse(localStorage.getItem(VOICE_PREF_KEY) || '{}') }; } catch { return { ...DEFAULT_VOICE_PREFS }; }
};

const speechEngine = {
  queue: [], speaking: false, current: null, watchdog: null, voices: [], onState: null, onBlocked: null,
  supported() { return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'; },
  refreshVoices() { try { this.voices = window.speechSynthesis.getVoices() || []; } catch { this.voices = []; } },
  pickVoice() {
    if (!this.voices.length) this.refreshVoices();
    const v = this.voices;
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
  say(text, { repeat = 1, rate = 'normal', interrupt = false } = {}) {
    if (!text || !this.supported()) return;
    if (interrupt) this.stop();
    const wasIdle = !this.speaking;
    const voice = this.pickVoice();
    for (let i = 0; i < Math.max(1, Math.min(3, repeat)); i++) {
      const u = new SpeechSynthesisUtterance(String(text));
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-IN';
      u.rate = RATE_VALUE[rate] || RATE_VALUE.normal; u.pitch = 1; u.volume = 1;
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
        : `Table ${spokenTable(order.tableNumber)}`;
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
  const head = replay ? `${who}.` : (otype === 'dine-in' ? `New ticket for ${who}.` : `New ${who}.`);
  const count = items.length === 1 ? '1 dish' : `${items.length} dishes`;
  return `${head} ${count}, ${mode}. ${dishes.join('. ')}.`;
};

// Short label for the arrival toast.
const ticketLabel = order => {
  const t = getOrderType(order);
  return t === 'swiggy' ? 'SWIGGY' : t === 'zomato' ? 'ZOMATO' : t === 'parcel' ? 'PARCEL' : `TABLE ${order.tableNumber}`;
};

/* ═══════════════════════════════════════════════════════════
   STYLES — one scoped sheet (.kx). Tokens first, then header, rail, tickets, panels, skeletons.
═══════════════════════════════════════════════════════════ */
const KX_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
html,body{margin:0;background:#0b0b0c;overflow:hidden;overscroll-behavior:none}
.kx,.kx *,.kx *::before,.kx *::after{box-sizing:border-box}
.kx{--line:rgba(211,191,162,.16);--line2:rgba(211,191,162,.32);--gold:#d3bfa2;--gold2:#b99f78;--bronze:#8a704d;--cream:#f7f3eb;--mute:#9b978d;--dim:#6f6c64;--amber:#e29a58;--swiggy:#fc8019;--zomato:#e0343f;--veg:#5d9a4e;--nonveg:#c04a4a;
  --glass:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.016));--ease:cubic-bezier(.22,1,.36,1);
  position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden;color:var(--cream);
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
.kx-top{display:flex;align-items:center;gap:12px;margin:10px 10px 0;padding:9px 12px;border-radius:20px;flex-shrink:0;z-index:70;position:relative;
  background:var(--glass),#0d0d0e;border:1px solid var(--line);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 18px 40px -22px rgba(0,0,0,.85)}
.kx-brand{display:flex;align-items:center;gap:10px;min-width:0;flex-shrink:0}
.kx-logo{background:var(--cream);border-radius:11px;padding:4px 9px;border:1px solid rgba(211,191,162,.5);box-shadow:0 8px 22px -10px rgba(211,191,162,.45);flex-shrink:0}
.kx-logo img{display:block;width:112px;height:auto}
.kx-brand-t{display:flex;flex-direction:column;gap:3px;min-width:0}
.kx-kds{display:inline-flex;align-items:center;gap:6px;font-size:.58rem;font-weight:700;letter-spacing:.26em;color:var(--gold);text-transform:uppercase;white-space:nowrap}
.kx-live{display:inline-flex;align-items:center;gap:7px;font-size:.58rem;font-weight:600;letter-spacing:.14em;color:var(--mute);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.kx-dot{width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0;animation:kxPing 2.2s ease-out infinite}
.kx-live.off{color:var(--amber)} .kx-live.off .kx-dot{background:var(--amber);animation:none}
.kx-seg{display:flex;padding:3px;gap:2px;border-radius:14px;background:#070708;border:1px solid var(--line);flex-shrink:0}
.kx-seg button{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border:0;border-radius:11px;background:transparent;color:var(--mute);font-size:.62rem;font-weight:700;letter-spacing:.1em;white-space:nowrap;min-height:36px;transition:all .18s var(--ease)}
.kx-seg button:hover{color:var(--cream)}
.kx-seg button.on{background:linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78);color:#14110c;box-shadow:0 8px 20px -10px rgba(211,191,162,.6)}
.kx-seg button .n{font:700 .62rem 'JetBrains Mono',monospace;opacity:.8}
.kx-stats{display:flex;gap:6px;margin-left:auto;flex-shrink:0}
.kx-stat{min-width:78px;padding:6px 12px;border-radius:13px;border:1px solid var(--line);background:rgba(255,255,255,.03);text-align:center}
.kx-stat b{display:block;font:700 1.2rem/1.05 'JetBrains Mono',monospace;color:var(--cream)}
.kx-stat span{display:block;margin-top:3px;font-size:.48rem;letter-spacing:.18em;color:var(--mute);text-transform:uppercase;font-weight:600}
.kx-stat.hot{border-color:var(--line2);background:rgba(211,191,162,.1)} .kx-stat.hot b{color:var(--gold)}
.kx-acts{display:flex;align-items:center;gap:6px;flex-shrink:0}
.kx-ib{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:42px;min-width:42px;padding:0 12px;border-radius:13px;border:1px solid var(--line);background:rgba(255,255,255,.03);color:#cfc7b8;font-size:.6rem;font-weight:700;letter-spacing:.1em;transition:all .18s var(--ease);flex-shrink:0}
.kx-ib:not(:disabled):hover{border-color:var(--line2);color:var(--cream);background:rgba(255,255,255,.06)}
.kx-ib:not(:disabled):active{transform:scale(.96)}
.kx-ib.on{border-color:var(--line2);background:rgba(211,191,162,.13);color:var(--gold)}
.kx-ib.mute{color:var(--dim)}
.kx-badge{position:absolute;top:-6px;right:-6px;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:linear-gradient(135deg,#e6d6b8,#b99f78);color:#14110c;font:700 .58rem/19px 'JetBrains Mono',monospace;text-align:center;font-style:normal}
.kx-eq{display:inline-flex;align-items:flex-end;gap:2px;height:14px}
.kx-eq i{width:3px;border-radius:2px;background:var(--gold);animation:kxEq .9s ease-in-out infinite}
.kx-eq i:nth-child(2){animation-delay:.18s} .kx-eq i:nth-child(3){animation-delay:.36s}
.kx-pop{position:absolute;right:0;top:calc(100% + 10px);width:310px;z-index:70;padding:16px;border-radius:20px;background:var(--glass),#101011;border:1px solid var(--line2);box-shadow:0 30px 70px -20px rgba(0,0,0,.9);display:flex;flex-direction:column;gap:14px}
.kx-pop h4{margin:0;font-size:.62rem;font-weight:700;letter-spacing:.22em;color:var(--gold);text-transform:uppercase}
.kx-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:.74rem;font-weight:500;color:#d8d1c3}
.kx-row small{display:block;margin-top:2px;font-size:.6rem;color:var(--mute);font-weight:400}
.kx-sw{position:relative;width:46px;height:26px;border-radius:13px;border:1px solid var(--line);background:#070708;flex-shrink:0;padding:0;transition:all .2s}
.kx-sw::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#6f6c64;transition:all .2s var(--ease)}
.kx-sw.on{background:rgba(211,191,162,.25);border-color:var(--line2)} .kx-sw.on::after{left:23px;background:var(--gold)}
.kx-mini{display:flex;padding:2px;gap:2px;border-radius:10px;background:#070708;border:1px solid var(--line)}
.kx-mini button{padding:6px 10px;border:0;border-radius:8px;background:transparent;color:var(--mute);font-size:.62rem;font-weight:700;min-height:30px}
.kx-mini button.on{background:rgba(211,191,162,.2);color:var(--gold)}
.kx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 18px;border-radius:13px;border:1px solid var(--line2);background:rgba(211,191,162,.1);color:var(--gold);font-size:.66rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;transition:all .18s var(--ease)}
.kx-btn:not(:disabled):hover{background:rgba(211,191,162,.18)} .kx-btn:disabled{opacity:.4}
.kx-btn.solid{border:0;background:linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78);color:#14110c;box-shadow:0 12px 28px -12px rgba(211,191,162,.55)}
.kx-btn.warn{border-color:rgba(226,154,88,.5);background:rgba(226,154,88,.12);color:#f0b87c}
.kx-btn.block{width:100%}

/* ── banners: arrivals, alerts, sound unlock ── */
.kx-toasts{position:fixed;top:calc(env(safe-area-inset-top) + 82px);left:50%;transform:translateX(-50%);z-index:60;display:flex;flex-direction:column;gap:8px;width:min(580px,calc(100vw - 24px));pointer-events:none}
.kx-toast{pointer-events:auto;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:var(--glass),#121110;border:1px solid var(--line2);box-shadow:0 24px 60px -18px rgba(0,0,0,.9),0 0 0 1px rgba(211,191,162,.06);cursor:pointer}
.kx-toast .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;background:rgba(211,191,162,.14);border:1px solid var(--line2);color:var(--gold)}
.kx-toast.cancel{border-color:rgba(226,154,88,.55)} .kx-toast.cancel .ic{background:rgba(226,154,88,.14);border-color:rgba(226,154,88,.45);color:var(--amber)}
.kx-toast b{display:block;font-size:.78rem;font-weight:700;letter-spacing:.06em}
.kx-toast p{margin:2px 0 0;font-size:.68rem;color:var(--mute);line-height:1.35;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.kx-alerts{display:flex;flex-direction:column;gap:8px;margin:10px 10px 0;flex-shrink:0}
.kx-alert{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:16px;background:linear-gradient(160deg,rgba(226,154,88,.14),rgba(226,154,88,.05)),#16120e;border:1px solid rgba(226,154,88,.4)}
.kx-alert .l{display:flex;align-items:center;gap:12px;min-width:0}
.kx-alert .ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:rgba(226,154,88,.14);color:var(--amber);flex-shrink:0}
.kx-alert h3{margin:0;font-size:.82rem;font-weight:700;letter-spacing:.04em}
.kx-alert p{margin:3px 0 0;font-size:.7rem;color:#e8b98a;line-height:1.4}
.kx-unlock{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 16px);transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:10px;padding:11px 18px;border-radius:999px;background:#15120d;border:1px solid var(--line2);color:var(--gold);font-size:.66rem;font-weight:700;letter-spacing:.12em;box-shadow:0 18px 44px rgba(0,0,0,.6);pointer-events:none;animation:kxBreath 2.4s ease-in-out infinite;white-space:nowrap;text-transform:uppercase}

/* ── layout ── */
.kx-body{flex:1;display:flex;gap:10px;padding:10px;min-height:0}
.kx-rail{width:240px;flex-shrink:0;display:flex;flex-direction:column;min-height:0;padding:14px 12px;border-radius:20px;background:var(--glass),#0d0d0e;border:1px solid var(--line)}
.kx-rail.drawer{position:fixed;left:0;top:0;bottom:0;z-index:100;width:290px;max-width:88vw;border-radius:0 22px 22px 0;padding-top:calc(env(safe-area-inset-top) + 16px)}
.kx-rail-h{display:flex;align-items:center;gap:9px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--line);flex-shrink:0}
.kx-rail-h .ic{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(211,191,162,.1);border:1px solid var(--line2);color:var(--gold)}
.kx-eyebrow{flex:1;font-size:.58rem;letter-spacing:.26em;font-weight:700;color:var(--gold);opacity:.8;text-transform:uppercase}
.kx-rail-list{display:flex;flex-direction:column;gap:4px;overflow-y:auto;flex:1;min-height:0}
.kx-rail-f{flex-shrink:0;display:flex;flex-direction:column;gap:6px;margin-top:10px;padding-top:12px;border-top:1px solid var(--line)}
.kx-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;padding:9px 11px;border-radius:13px;border:1px solid transparent;background:transparent;color:#bdb6a8;font-size:.7rem;font-weight:600;letter-spacing:.04em;text-align:left;transition:all .16s var(--ease)}
.kx-nav:hover{background:rgba(255,255,255,.04);color:var(--cream)}
.kx-nav.on{background:rgba(211,191,162,.12);border-color:var(--line2);color:var(--cream);box-shadow:inset 3px 0 0 var(--gold)}
.kx-nav .t{display:flex;align-items:center;gap:9px;min-width:0}
.kx-nav .t span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kx-nav .r{display:flex;align-items:center;gap:6px;flex-shrink:0}
.kx-ct{min-width:28px;padding:2px 8px;border-radius:8px;background:rgba(255,255,255,.07);color:var(--mute);font:700 .64rem/1.5 'JetBrains Mono',monospace;text-align:center}
.kx-ct.hot{background:rgba(211,191,162,.2);color:var(--gold)}
.kx-86{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;border:1px solid var(--line);color:var(--dim);transition:all .16s}
.kx-86:hover{border-color:rgba(226,154,88,.55);color:var(--amber)}
.kx-vegseg{display:flex;padding:3px;gap:2px;border-radius:13px;background:#070708;border:1px solid var(--line);margin-bottom:10px;flex-shrink:0}
.kx-vegseg button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:8px 4px;border:0;border-radius:10px;background:transparent;color:var(--mute);font-size:.62rem;font-weight:700;letter-spacing:.08em;min-height:36px}
.kx-vegseg button.on.v{background:rgba(93,154,78,.18);color:#9fcb90} .kx-vegseg button.on.n{background:rgba(192,74,74,.18);color:#e29a9a}
.kx-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:10px}
.kx-ribbon{display:flex;align-items:center;gap:10px;flex-shrink:0;min-height:38px}
.kx-prep{display:flex;align-items:center;gap:8px;overflow-x:auto;min-width:0;flex:1}
.kx-prep-l{display:flex;align-items:center;gap:6px;font-size:.55rem;letter-spacing:.2em;font-weight:700;color:var(--gold);flex-shrink:0;text-transform:uppercase}
.kx-chip{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.035);font-size:.68rem;font-weight:600;white-space:nowrap;flex-shrink:0;color:#ddd5c6}
.kx-chip b{font:700 .78rem 'JetBrains Mono',monospace;color:var(--gold)}
.kx-sortbtn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:11px;border:1px solid var(--line);background:rgba(255,255,255,.03);font-size:.58rem;font-weight:700;letter-spacing:.12em;color:var(--mute);flex-shrink:0;text-transform:uppercase}
.kx-sortbtn:hover{color:var(--cream);border-color:var(--line2)}
.kx-search{display:flex;align-items:center;gap:10px;margin:10px 10px 0;padding:10px 14px;border-radius:15px;background:var(--glass),#0d0d0e;border:1px solid var(--line2);flex-shrink:0}
.kx-search input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:var(--cream);font-size:.86rem}
.kx-search input::placeholder{color:var(--dim)}
.kx-recall{display:flex;align-items:center;gap:9px;padding:7px 12px;border-radius:13px;border:1px solid var(--line);background:rgba(255,255,255,.025);flex-shrink:0;overflow:hidden}
.kx-recall .l{display:flex;align-items:center;gap:6px;font-size:.54rem;letter-spacing:.18em;font-weight:700;color:var(--mute);flex-shrink:0;text-transform:uppercase}
.kx-health{border-radius:16px;border:1px solid var(--line);background:var(--glass),#0d0d0e;flex-shrink:0;overflow:hidden}
.kx-health-h{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:0;background:transparent;text-align:left}
.kx-health-h .tt{font-size:.58rem;letter-spacing:.22em;font-weight:700;color:var(--gold);text-transform:uppercase}
.kx-health-h .st{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:.6rem;font-weight:700;letter-spacing:.08em;color:var(--gold)}
.kx-health-h .st.warn{color:var(--amber)}
.kx-health-b{padding:0 14px 14px;display:flex;flex-direction:column;gap:10px}
.kx-stg{display:grid;gap:8px}
.kx-stg>div{padding:9px 10px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.025)}
.kx-stg>div.bn{border-color:rgba(226,154,88,.4)}
.kx-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:6px}
.kx-bar i{display:block;height:100%;border-radius:2px;background:var(--gold2);transition:width .5s ease}
.kx-bar.bn i{background:var(--amber)}

/* ── board ── */
.kx-grid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--kx-col,320px),1fr));gap:14px;align-content:start;align-items:start;padding:2px 2px 18px}
.kx-center{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:70px 20px}
.kx-center .ic{width:72px;height:72px;border-radius:22px;display:grid;place-items:center;background:var(--glass),#0d0d0e;border:1px solid var(--line);color:var(--dim)}
.kx-center h3{margin:0;font-size:.9rem;font-weight:700;letter-spacing:.26em;color:var(--mute);text-transform:uppercase}
.kx-center p{margin:0;font-size:.7rem;color:var(--dim);font-weight:500;max-width:420px;line-height:1.55;word-break:break-word}
.kx-tk{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:22px;border:1px solid var(--line);background:var(--glass),#0f0e0d;box-shadow:0 22px 44px -28px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,255,255,.05);max-height:min(640px,calc(100dvh - 200px));transition:border-color .3s}
.kx-tk::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--rail,rgba(211,191,162,.35));z-index:2}
.kx-tk.med{--rail:var(--gold)}
.kx-tk.high{--rail:var(--amber);border-color:rgba(226,154,88,.55);animation:kxUrgent 1.9s ease-in-out infinite}
.kx-tk.swiggy{--rail:var(--swiggy)} .kx-tk.zomato{--rail:var(--zomato)}
.kx-tk.fresh{border-color:rgba(230,214,184,.85);animation:kxFresh 1.6s ease-in-out 5}
.kx-tk.fill{max-height:none;height:100%}
.kx-tk-h{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:14px 14px 8px 20px}
.kx-tk-type{display:inline-flex;align-items:center;gap:7px;font-size:.55rem;font-weight:700;letter-spacing:.2em;color:var(--gold);text-transform:uppercase}
.kx-tk-num{margin:5px 0 7px;font-size:2.2rem;font-weight:800;line-height:1;letter-spacing:-.02em}
.kx-tk-num.sw{color:var(--swiggy)} .kx-tk-num.zo{color:var(--zomato)}
.kx-tk-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.kx-tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:7px;border:1px solid var(--line);background:rgba(255,255,255,.04);font-size:.52rem;font-weight:700;letter-spacing:.1em;color:#cfc7b8;text-transform:uppercase;white-space:nowrap}
.kx-tag.gold{background:rgba(211,191,162,.16);border-color:var(--line2);color:var(--gold)}
.kx-tag.amber{background:rgba(226,154,88,.16);border-color:rgba(226,154,88,.45);color:#f0b87c}
.kx-tag.sw{color:var(--swiggy);border-color:rgba(252,128,25,.4);background:rgba(252,128,25,.1)}
.kx-tag.zo{color:#ef6a73;border-color:rgba(224,52,63,.4);background:rgba(224,52,63,.1)}
.kx-tag.id{font-family:'JetBrains Mono',monospace;color:var(--mute);letter-spacing:.04em}
.kx-time{position:relative;width:66px;height:66px;flex-shrink:0;display:grid;place-items:center}
.kx-time svg{position:absolute;inset:0;transform:rotate(-90deg)}
.kx-time .tv{position:relative;font:700 .8rem 'JetBrains Mono',monospace;letter-spacing:-.02em}
.kx-time.high .tv{color:var(--amber)} .kx-time.med .tv{color:var(--gold)}
.kx-late{margin-top:4px;display:block;text-align:center;font-size:.46rem;font-weight:800;letter-spacing:.16em;color:var(--amber)}
.kx-strip{margin:0 12px 8px 18px;padding:7px 10px;border-radius:11px;font-size:.62rem;font-weight:600;line-height:1.4;display:flex;align-items:center;justify-content:space-between;gap:8px}
.kx-strip.sw{background:rgba(252,128,25,.08);border:1px solid rgba(252,128,25,.28);color:#ffa760}
.kx-strip.zo{background:rgba(224,52,63,.08);border:1px solid rgba(224,52,63,.28);color:#f2848b}
.kx-strip.mod{display:block;background:rgba(226,154,88,.1);border:1px solid rgba(226,154,88,.4);color:#f0b87c}
.kx-prog{display:flex;align-items:center;gap:10px;margin:0 14px 8px 20px}
.kx-prog .bar{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden}
.kx-prog .bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#b99f78,#e6d6b8);transition:width .4s var(--ease)}
.kx-prog span{font:700 .62rem 'JetBrains Mono',monospace;color:var(--mute)}
.kx-prog span.ok{color:var(--gold)}
.kx-items{display:flex;flex-direction:column;gap:7px;padding:4px 12px 8px 16px;overflow-y:auto;flex:1;min-height:0}
.kx-it{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;padding:11px 12px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(211,191,162,.12);cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;transition:all .16s var(--ease)}
.kx-it:hover{border-color:var(--line2)} .kx-it:active{transform:scale(.99)}
.kx-it.run{background:rgba(211,191,162,.06);border-color:rgba(211,191,162,.3)}
.kx-it.done{background:transparent;opacity:.45}
.kx-qty{min-width:40px;height:40px;padding:0 6px;border-radius:12px;display:grid;place-items:center;font:700 1.15rem 'JetBrains Mono',monospace;background:rgba(211,191,162,.14);border:1px solid rgba(211,191,162,.3);color:var(--gold)}
.kx-it.done .kx-qty{background:rgba(255,255,255,.04);border-color:var(--line);color:var(--dim)}
.kx-it-b{min-width:0}
.kx-nm{display:flex;align-items:center;flex-wrap:wrap;gap:7px;font-size:1.02rem;font-weight:600;line-height:1.28;color:var(--cream)}
.kx-it.done .kx-nm{text-decoration:line-through;color:var(--mute)}
.kx-nm .sp{display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:7px;background:rgba(211,191,162,.18);color:var(--gold)}
.kx-sub{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:5px;font-size:.6rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.kx-sub .half{color:var(--gold)}
.kx-tm{display:inline-flex;align-items:center;gap:4px;font:700 .62rem 'JetBrains Mono',monospace;color:var(--gold2);letter-spacing:0}
.kx-tm.slow{padding:2px 7px;border-radius:7px;background:rgba(226,154,88,.16);border:1px solid rgba(226,154,88,.45);color:#f0b87c}
.kx-hint{margin-top:5px;font-size:.54rem;color:var(--dim);font-style:italic}
.kx-note{display:flex;align-items:flex-start;gap:8px;margin-top:8px;padding:8px 10px;border-radius:11px;background:rgba(226,154,88,.12);border:1px solid rgba(226,154,88,.42);color:#f2bd88;font-size:.76rem;font-weight:600;line-height:1.38}
.kx-note svg{flex-shrink:0;margin-top:2px}
.kx-chk{width:28px;height:28px;border-radius:50%;border:1.5px solid rgba(211,191,162,.42);display:grid;place-items:center;color:#14110c;flex-shrink:0;margin-top:5px;transition:all .16s var(--ease)}
.kx-it.done .kx-chk{background:var(--gold);border-color:var(--gold)}
.kx-vd{width:13px;height:13px;border-radius:3px;border:1.6px solid var(--veg);display:inline-grid;place-items:center;flex-shrink:0}
.kx-vd i{width:5px;height:5px;border-radius:50%;background:var(--veg)}
.kx-vd.n{border-color:var(--nonveg)} .kx-vd.n i{border-radius:0;background:transparent;width:0;height:0;border-left:3.5px solid transparent;border-right:3.5px solid transparent;border-bottom:6px solid var(--nonveg)}
.kx-tk-f{display:flex;flex-direction:column;gap:8px;padding:10px 12px 12px 16px;border-top:1px solid rgba(211,191,162,.1);flex-shrink:0}
.kx-tk-f .row{display:flex;gap:8px}
.kx-notebox{display:flex;gap:8px;align-items:flex-start;margin:0 12px 0 16px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line)}
.kx-notebox textarea{flex:1;background:transparent;border:0;outline:0;resize:none;color:var(--cream);font-size:.78rem;line-height:1.5;min-height:52px}
.kx-sq{width:50px;min-height:50px;border-radius:15px;border:1px solid var(--line);background:rgba(255,255,255,.04);display:grid;place-items:center;color:#cfc7b8;flex-shrink:0;transition:all .16s var(--ease)}
.kx-sq:not(:disabled):hover{border-color:var(--line2);color:var(--gold)} .kx-sq:not(:disabled):active{transform:scale(.95)}
.kx-sq.on{border-color:var(--line2);color:var(--gold);background:rgba(211,191,162,.12)}
.kx-go{flex:1;min-height:50px;padding:0 14px;border-radius:15px;border:0;display:flex;align-items:center;justify-content:center;gap:9px;font-size:.78rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#14110c;background:linear-gradient(135deg,#e6d6b8 0%,#d3bfa2 45%,#b99f78 100%);box-shadow:0 14px 30px -14px rgba(211,191,162,.6),inset 0 1px 0 rgba(255,255,255,.5);transition:transform .16s var(--ease),filter .16s}
.kx-go:not(:disabled):hover{filter:brightness(1.06)} .kx-go:not(:disabled):active{transform:scale(.98)}
.kx-go.late{background:linear-gradient(135deg,#f3c18a,#e29a58 55%,#c97a35);box-shadow:0 14px 30px -14px rgba(226,154,88,.6),inset 0 1px 0 rgba(255,255,255,.4)}

/* ── summary + metrics ── */
.kx-sum{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px}
.kx-sumc{padding:18px 12px 14px;border-radius:18px;text-align:center;background:var(--glass),#0e0e0f;border:1px solid var(--line);border-top:2px solid var(--line2)}
.kx-sumc.p{border-color:var(--line2);border-top-color:var(--gold)}
.kx-sumc b{display:block;font:700 2.6rem/1 'JetBrains Mono',monospace;color:var(--gold);margin-bottom:9px}
.kx-sumc .n{font-size:.7rem;font-weight:600;color:#d8d1c3;line-height:1.35;margin-bottom:9px;text-transform:uppercase;letter-spacing:.03em}
.kx-metrics{flex:1;min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 20px;border-radius:24px;background:var(--glass),#0d0d0e;border:1px solid var(--line)}
.kx-metrics h2{margin:0;font-family:'Playfair Display',Georgia,serif;font-size:1.5rem;font-weight:700;letter-spacing:.04em}
.kx-metrics>p{margin:0 0 20px;font-size:.66rem;color:var(--mute);letter-spacing:.06em}
.kx-mtiles{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%;max-width:640px;margin-bottom:22px}
.kx-mt{padding:22px 14px;border-radius:18px;text-align:center;background:#0b0b0c;border:1px solid var(--line);border-top:2px solid var(--gold)}
.kx-mt span{display:block;font-size:.5rem;letter-spacing:.2em;font-weight:700;color:var(--mute);text-transform:uppercase;margin-bottom:10px}
.kx-mt b{display:block;font:700 2.4rem/1 'JetBrains Mono',monospace;color:var(--gold)} .kx-mt b.sm{font-size:1.6rem;padding:.3rem 0}
.kx-mt small{display:block;margin-top:8px;font-size:.6rem;color:var(--dim)}

/* ── mobile ── */
.kx-dots{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;flex-shrink:0;padding:0 20px}
.kx-dots i{height:6px;width:6px;border-radius:3px;background:#262626;transition:all .25s;cursor:pointer}
.kx-dots i.on{width:22px;background:var(--gold)}
.kx-pager{display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.kx-pager button{display:inline-flex;align-items:center;gap:6px;min-height:46px;padding:0 16px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.04);font-size:.7rem;font-weight:700;letter-spacing:.1em}
.kx-pager button:disabled{opacity:.25}
.kx-bnav{display:flex;gap:3px;margin:0 10px 10px;padding:4px;border-radius:20px;background:var(--glass),#0d0d0e;border:1px solid var(--line);flex-shrink:0}
.kx-bnav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;min-height:54px;padding:7px 2px;border:0;border-radius:16px;background:transparent;color:var(--mute);font-size:.5rem;font-weight:700;letter-spacing:.08em}
.kx-bnav button.on{background:rgba(211,191,162,.16);color:var(--gold)}
.kx-bnav button .n{font:700 .5rem 'JetBrains Mono',monospace;color:var(--gold)}

/* ── side sheet (wastage) + modal (86) ── */
.kx-scrim{position:fixed;inset:0;background:rgba(4,4,4,.62);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
.kx-sheet{position:fixed;right:0;top:0;bottom:0;z-index:3001;display:flex;flex-direction:column;overflow:hidden;background:var(--glass),#0d0d0e;border-left:1px solid var(--line2);border-radius:24px 0 0 24px}
.kx-sheet-h{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px;border-bottom:1px solid var(--line);flex-shrink:0}
.kx-sheet-h .t{display:flex;align-items:center;gap:12px}
.kx-sheet-h .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(211,191,162,.1);border:1px solid var(--line2);color:var(--gold)}
.kx-sheet-h h3{margin:0;font-size:.9rem;font-weight:700;letter-spacing:.08em}
.kx-sheet-h small{display:block;margin-top:3px;font-size:.52rem;letter-spacing:.18em;color:var(--mute);text-transform:uppercase;font-weight:600}
.kx-tabs{display:flex;border-bottom:1px solid var(--line);flex-shrink:0}
.kx-tabs button{flex:1;padding:14px 0;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--mute);font-size:.6rem;font-weight:700;letter-spacing:.16em}
.kx-tabs button.on{color:var(--gold);border-bottom-color:var(--gold)}
.kx-card{padding:16px;border-radius:18px;background:#0a0a0b;border:1px solid var(--line);display:flex;flex-direction:column;gap:12px}
.kx-card>.hd{font-size:.56rem;letter-spacing:.22em;font-weight:700;color:var(--mute);text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid var(--line)}
.kx-lbl{display:block;margin-bottom:6px;font-size:.54rem;font-weight:700;letter-spacing:.16em;color:var(--mute);text-transform:uppercase}
.kx-in{width:100%;padding:11px 13px;border-radius:12px;border:1px solid var(--line);background:#070708;color:var(--cream);font-size:.84rem;outline:0;transition:border-color .16s,box-shadow .16s}
.kx-in:focus{border-color:var(--line2);box-shadow:0 0 0 4px rgba(211,191,162,.08)}
.kx-in option{background:#0d0d0e;color:var(--cream)}
.kx-pill{padding:7px 12px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--mute);font-size:.62rem;font-weight:700;min-height:34px}
.kx-pill.on{border-color:var(--line2);background:rgba(211,191,162,.16);color:var(--gold)}
.kx-ent{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:14px;background:#0a0a0b;border:1px solid var(--line);border-left:3px solid var(--gold2)}
.kx-modalwrap{position:fixed;inset:0;z-index:3101;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
.kx-modal{margin:auto;display:flex;flex-direction:column;overflow:hidden;border-radius:24px;background:var(--glass),#0f0f10;border:1px solid var(--line2);box-shadow:0 40px 90px -20px rgba(0,0,0,.95)}
.kx-opt{display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;border-radius:13px;border:1px solid var(--line);background:transparent;color:#cfc7b8;font-size:.78rem;font-weight:600;text-align:left;min-height:46px;transition:all .15s}
.kx-opt.on{border-color:var(--line2);background:rgba(211,191,162,.14);color:var(--gold)}
.kx-err{font-size:.7rem;color:#e9a57a;font-weight:600}

/* ── skeleton ── */
.kx-sk{position:relative;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,.055);border-radius:7px}
.kx-sk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(100deg,transparent 15%,rgba(233,220,195,.12) 50%,transparent 85%);animation:kxSweep 1.7s cubic-bezier(.45,0,.25,1) infinite;animation-delay:var(--d,0s)}

/* ── motion ── */
@keyframes kxPing{0%{box-shadow:0 0 0 0 rgba(211,191,162,.55)}70%,100%{box-shadow:0 0 0 8px rgba(211,191,162,0)}}
@keyframes kxEq{0%,100%{height:3px}50%{height:14px}}
@keyframes kxBreath{0%,100%{opacity:.75}50%{opacity:1}}
@keyframes kxUrgent{0%,100%{box-shadow:0 22px 44px -28px rgba(0,0,0,.95),0 0 0 0 rgba(226,154,88,0)}50%{box-shadow:0 22px 44px -28px rgba(0,0,0,.95),0 0 26px 0 rgba(226,154,88,.3)}}
@keyframes kxFresh{0%,100%{box-shadow:0 22px 44px -28px rgba(0,0,0,.95),0 0 0 0 rgba(230,214,184,0)}50%{box-shadow:0 22px 44px -28px rgba(0,0,0,.95),0 0 32px 2px rgba(230,214,184,.38)}}
@keyframes kxSweep{to{transform:translateX(100%)}}
@keyframes kxSpin{to{transform:rotate(360deg)}}
.kx .spin{animation:kxSpin 1s linear infinite}

/* ── responsive ── */
.kx-mdot{display:none}
@media (max-width:1180px){.kx-stat.opt{display:none}.kx-logo img{width:96px}}
@media (max-width:1100px){.kx-stats{display:none}.kx-acts{margin-left:auto}.kx-seg button span.lb{display:none}.kx-seg button{padding:8px 11px}}
@media (max-width:980px){.kx-brand-t{display:none}.kx-hide-md{display:none!important}.kx-toasts{top:calc(env(safe-area-inset-top) + 76px)}}
@media (max-width:599px){
  .kx-top{margin:8px 8px 0;padding:8px 9px;gap:8px;border-radius:18px}
  .kx-logo img{width:84px} .kx-acts{gap:5px} .kx-mdot{display:inline-block}
  .kx-ib{height:40px;min-width:40px;padding:0 10px}
  .kx-body{padding:8px;gap:8px} .kx-main{gap:8px}
  .kx-tk-num{font-size:2.3rem} .kx-nm{font-size:1.08rem}
  .kx-go{min-height:54px;font-size:.84rem}
  .kx-mtiles{grid-template-columns:1fr} .kx-pop{position:fixed;left:10px;right:10px;top:68px;width:auto}
  .kx-toasts{top:calc(env(safe-area-inset-top) + 68px)}
  .kx-bnav{margin:0 8px 8px} .kx-bnav button{font-size:.46rem;letter-spacing:.04em}
}
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
  const [isNonVegMode, setIsNonVegMode] = useState(false);
  const [tenantOnlyVeg, setTenantOnlyVeg] = useState(true);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [checkedItemsGlobal, setCheckedItemsGlobal] = useState({});
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
  const [itemFinalTimes, setItemFinalTimes] = useState({});
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
  const [freshIds, setFreshIds] = useState(() => new Set()); // tickets that arrived in the last few seconds
  const [toasts, setToasts] = useState([]);                   // "new ticket" / "cancelled" call-outs

  /* ── refs ── */
  const socketRef = useRef(null);
  const ordersRef = useRef([]);
  const voicePrefsRef = useRef(voicePrefs);
  const fetchSeqRef = useRef(0);
  const lastFetchAtRef = useRef(0);
  const seenIdsRef = useRef(new Set());      // every ticket this screen has already shown (so a poll never re-announces one)
  const initialLoadRef = useRef(false);
  const dispatchedRef = useRef(new Set());   // tickets dispatched here a moment ago: a slow in-flight fetch must not bring them back
  const reconcileRef = useRef(null);
  const timersRef = useRef([]);
  const confirm86Busy = useRef(false);
  const metaLoadedRef = useRef(false);      // categories / menu / tenant have been loaded at least once
  useEffect(() => { ordersRef.current = orders; }, [orders]);
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
  useEffect(() => {
    if (audioUnlocked) return undefined;
    const unlock = () => {
      setAudioUnlocked(true);
      const waiting = ordersRef.current.filter(o => (o.items || []).some(isKitchenItem)).length;
      const p = voicePrefsRef.current;
      if (waiting > 0 && p.voice) speechEngine.say(`Kitchen connected. ${waiting} ${waiting === 1 ? 'ticket' : 'tickets'} waiting.`, { rate: p.rate });
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, [audioUnlocked]);

  useEffect(() => {
    speechEngine.onState = setSpeaking;
    speechEngine.onBlocked = () => setAudioUnlocked(false); // the browser refused to speak: ask for a tap again
    speechEngine.refreshVoices();
    try { if (speechEngine.supported()) window.speechSynthesis.onvoiceschanged = () => speechEngine.refreshVoices(); } catch { /* ignore */ }
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

  // opts.force: speak even if spoken details are switched off (the speaker button / test). opts.interrupt: cut off what is being said.
  const announce = (text, opts = {}) => {
    const p = voicePrefsRef.current;
    if (!opts.force && !p.voice) return;
    speechEngine.say(text, { repeat: opts.force ? 1 : p.repeat, rate: p.rate, interrupt: !!opts.interrupt });
  };
  const speakTicket = order => announce(buildTicketSpeech(order, { replay: true }), { force: true, interrupt: true });

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
  const arriveTicket = order => {
    markFresh(order._id);
    const kitchenItems = (order.items || []).filter(isKitchenItem);
    pushToast({ kind: 'new', title: `NEW TICKET · ${ticketLabel(order)}`, body: kitchenItems.map(i => `${Number(i.quantity) || 1}× ${i.name}`).join(', ') });
    const otype = getOrderType(order);
    const agg = otype === 'swiggy' || otype === 'zomato';
    const p = voicePrefsRef.current;
    if (p.chime) playAlertSound(agg ? 'aggregator' : 'order');
    later(() => announce(buildTicketSpeech(order)), p.chime ? (agg ? 1600 : 1100) : 0);
  };

  const fetchHealth = async () => {
    try {
      const r = await axios.get(`${BASE_URL}/admin/analytics/kitchen-health/${tenantId}`, { timeout: 12000 });
      setKitchenHealth(r.data);
    } catch { /* optional panel */ }
    try {
      const s = await axios.get(`${BASE_URL}/admin/kds/today-summary/${tenantId}`, { timeout: 12000 });
      if (s.data && Number.isFinite(Number(s.data.count))) setServerKdsToday(s.data);
    } catch { /* falls back to the local counters */ }
  };

  const fetchActiveOrders = async (opts) => {
    // ordersOnly: socket-triggered refreshes don't need categories/menu/tenant again (the menu is kept live by socket events).
    const ordersOnly = !!(opts && opts.ordersOnly === true);
    // Several refreshes can overlap (socket events, reconnect, the 86 button). A slow older response used to land last and
    // overwrite newer data, bringing back tickets that had already been dispatched.
    const seq = ++fetchSeqRef.current;
    try {
      const [ordersRes, catRes, menuRes, tenantRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`, { timeout: 15000 }), // a request that never answers used to freeze the whole board on its skeleton forever
        ordersOnly ? null : axios.get(`${BASE_URL}/categories/${tenantId}`, { timeout: 8000 }).catch(() => ({ data: [] })),
        ordersOnly ? null : axios.get(`${BASE_URL}/menu/${tenantId}`, { timeout: 8000 }).catch(() => ({ data: [] })),
        ordersOnly ? null : axios.get(`${BASE_URL}/tenant/${tenantId}`, { timeout: 8000 }).catch(() => ({ data: null })),
      ]);
      if (seq !== fetchSeqRef.current) return; // a newer refresh has been started: drop this stale answer
      lastFetchAtRef.current = Date.now();
      const incoming = [...(ordersRes.data || [])]
        .filter(o => !dispatchedRef.current.has(String(o._id)))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Tickets this screen has never shown (the socket was down, or the tablet was asleep) are announced like any other.
      const firstLoad = !initialLoadRef.current;
      const unseen = incoming.filter(o => !seenIdsRef.current.has(String(o._id)));
      incoming.forEach(o => seenIdsRef.current.add(String(o._id)));
      initialLoadRef.current = true;
      if (!firstLoad) {
        unseen
          .filter(o => (!o.status || o.status === 'pending') && (o.items || []).some(isKitchenItem))
          .slice(0, 5).reverse().forEach(arriveTicket);
      }

      setBoardState('ready'); setBoardError(''); setLastLoadedAt(Date.now());
      setOrders(incoming);
      if (!ordersOnly) metaLoadedRef.current = true;
      if (catRes) setCategories(catRes.data || []);
      if (menuRes) setMenuItems(menuRes.data || []);
      if (tenantRes?.data?.name) setTenantName(tenantRes.data.name);
      if (tenantRes?.data?.config?.onlyVeg !== undefined) setTenantOnlyVeg(tenantRes.data.config.onlyVeg);
      const hydrationMap = {};
      incoming.forEach(o => o.items?.forEach((item, idx) => {
        // Rehydrate from the persisted server state, not only the old local flag.
        // Otherwise a reload/device switch makes completed dishes look unfinished.
        if (item.isCrossedLocal || item.kdsCompletedAt) hydrationMap[`${o._id}-${idx}`] = true;
      }));
      setCheckedItemsGlobal(prev => {
        // Keep the local value of any dish whose save is still in flight; the server does not know about it yet.
        const merged = { ...hydrationMap };
        pendingToggleKeys.forEach(k => { if (k in prev) merged[k] = prev[k]; else delete merged[k]; });
        return merged;
      });
      fetchHealth();
    } catch (err) {
      console.error('KDS fetch:', err.message);
      const r = err && err.response;
      setBoardError(r ? `Server answered ${r.status}${r.data && r.data.code ? ` (${r.data.code})` : ''}${r.data && r.data.error ? `: ${String(r.data.error).slice(0, 140)}` : ''}` : (err && err.message) || 'No response from the server');
      setBoardState(prev => prev === 'ready' ? prev : 'error');
    }
  };

  const retryBoardLoad = () => { setBoardState('loading'); fetchActiveOrders(); };
  const manualRefresh = async () => { setRefreshing(true); try { await fetchActiveOrders({ ordersOnly: metaLoadedRef.current }); } finally { setRefreshing(false); } };

  /* ── main effect: socket + initial fetch ── */
  useEffect(() => {
    if (!tenantId) { setBoardState('error'); return undefined; }
    seenIdsRef.current = new Set();
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
      setOrders(prev => prev.some(o => String(o._id) === id) ? prev : [cleanOrder, ...prev]);
      if (alreadySeen) return; // a poll already showed and announced it
      setMobileCardIndex(0);
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
      const key = `${data.orderId}-${itemIndex}`;
      setCheckedItemsGlobal(prev => ({ ...prev, [key]: !!itemPatch.kdsCompletedAt || !!itemPatch.isCrossedLocal }));
      if (itemPatch.kdsPrepTimeSeconds != null) {
        setItemFinalTimes(prev => ({ ...prev, [`${data.orderId}-${itemIndex}`]: Number(itemPatch.kdsPrepTimeSeconds) }));
      }
    });

    socket.on('order_modification_detected', data => {
      if (!data || data.tenantId !== tenantId) return;
      const p = voicePrefsRef.current;
      if (p.chime) playAlertSound('waiter');
      let note = data.modificationNote;
      let spoken = note ? String(note) : 'The order was changed';
      if (data.replaced) {
        // Customer changed the order inside the 2-minute window: spell out what changed for the chef.
        const added = (data.items || []).filter(i => i.modChange === 'new');
        const qtyChanged = (data.items || []).filter(i => i.modChange === 'qty');
        const removed = data.replacedInfo?.removed || [];
        const parts = [];
        const sp = [];
        if (added.length) { parts.push(`ADDED: ${added.map(i => `${i.quantity}× ${i.name}`).join(', ')}`); sp.push(`Added ${added.map(i => `${i.quantity} ${i.name}`).join(', ')}`); }
        if (qtyChanged.length) { parts.push(`QTY: ${qtyChanged.map(i => `${i.name} ${i.modPrevQty}→${i.quantity}`).join(', ')}`); sp.push(`Quantity changed. ${qtyChanged.map(i => `${i.name} from ${i.modPrevQty} to ${i.quantity}`).join(', ')}`); }
        if (removed.length) { parts.push(`REMOVED: ${removed.map(i => `${i.quantity}× ${i.name}`).join(', ')}`); sp.push(`Removed ${removed.map(i => `${i.quantity} ${i.name}`).join(', ')}`); }
        note = `Customer REPLACED the order${parts.length ? ' — ' + parts.join(' · ') : ''}`;
        spoken = `The customer replaced the order. ${sp.join('. ')}`;
        if (data.orderId) {
          const prefix = `${data.orderId}-`;
          setItemFinalTimes(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(prefix))));
        }
      }
      const where = data.tableNumber != null && String(data.tableNumber) !== '' ? `Table ${spokenTable(data.tableNumber)}` : 'An order';
      later(() => announce(`Order change. ${where}. ${spoken}.`), p.chime ? 900 : 0);
      // Date.now() alone collided for two alerts in the same millisecond (duplicate React keys), and the list grew without bound.
      setInterceptedAlerts(prev => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...data, modificationNote: note }, ...prev].slice(0, 25));
      fetchActiveOrders({ ordersOnly: true });
    });

    // A ticket that disappears because the order was cancelled / voided must be said out loud: otherwise the cook keeps making it.
    const removeAndNotify = (orderId, withNotice) => {
      const gone = ordersRef.current.find(o => String(o._id) === String(orderId));
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

  const markAsReady = async orderId => {
    if (processingOrderIds.has(orderId)) return; // block a double-tap while the request is in flight
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    const idKey = String(orderId);
    setProcessingOrderIds(prev => new Set(prev).add(orderId));
    setRecallQueue(prev => [order, ...prev].slice(0, 10));
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
      fetchHealth(); // refresh the database-backed dispatched/avg figures
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

  const handleRecall = async () => {
    if (!recallQueue.length) return;
    const recalled = recallQueue[0];
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
      setRecallQueue(prev => prev.slice(1));
      return;
    }
    dispatchedRef.current.delete(String(recalled._id));
    // Use the server's copy, not the snapshot taken when the ticket was dispatched (stale items / crossed state).
    const fresh = recallRes.data.order || recalled;
    setOrders(prev => prev.some(o => String(o._id) === String(recalled._id)) ? prev : [fresh, ...prev]);
    setRecallQueue(prev => prev.slice(1));
    setCompletedTicketsCount(prev => { const n = Math.max(0, prev - 1); try { localStorage.setItem(`kds_completed_count_${tenantId}`, n); } catch { /* ignore */ } return n; });
    // The average is total/count, so the recalled ticket's time has to leave the total together with its count.
    const counted = Number(recalled._kdsCountedSeconds);
    if (Number.isFinite(counted) && counted > 0) setTotalProcessingTime(prev => { const n = Math.max(0, prev - counted); try { localStorage.setItem(`kds_processing_time_${tenantId}`, n); } catch { /* ignore */ } return n; });
    fetchHealth(); // the database-backed dispatched / average figures still counted the recalled ticket
  };

  const trigger86 = (categoryKey, categoryName) => {
    setEightySixModal({ categoryKey, categoryName });
    setSelectedDish86(null);
    setSelectedReason86('ran_out');
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
      setEightySixModal(null);
      setSelectedDish86(null);
      fetchActiveOrders();
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
        if (matches && !checkedItemsGlobal[`${order._id}-${idx}`]) counts[fId] = (counts[fId] || 0) + (Number(item.quantity) || 1);
      });
    });
    return counts;
  }, [orders, stationFilter, dishToCategoryMap, dishToVegMap, checkedItemsGlobal, isNonVegMode]);

  const filteredOrders = useMemo(() => {
    const list = orders.filter(order => {
      if (!(order.items || []).some(isKitchenItem)) return false;
      const otype = getOrderType(order);
      if (!stationMatches(otype, stationFilter)) return false;
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
    return sortOldest ? [...list].reverse() : list; // `orders` is kept newest-first
  }, [orders, stationFilter, selectedCategory, dishToCategoryMap, dishToVegMap, isNonVegMode, searchQuery, sortOldest]);

  const aggregatedTotals = useMemo(() => {
    const totals = {};
    // Built from filteredOrders + the card's own visibility rule: it used every order and every dish, so the totals disagreed
    // with the "N tickets" label beside them and with the dishes actually shown on the cards.
    const vis = { selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode };
    filteredOrders.forEach(o => (o.items || []).forEach((i, idx) => {
      if (!isDishVisible(i, vis)) return;
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
      const otype = getOrderType(o);
      const isP = otype === 'parcel';
      const portion = (i.portion && String(i.portion).toLowerCase() !== 'single') ? ` (${i.portion})` : '';
      const key = `${i.name}${portion}__${isP ? 'P' : 'D'}`;
      totals[key] = (totals[key] || 0) + (Number(i.quantity) || 1);
    }));
    return totals;
  }, [filteredOrders, checkedItemsGlobal, selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode]);

  const masterPrepMarqueeList = useMemo(() => {
    const m = {};
    const vis = { selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode };
    filteredOrders.forEach(o => (o.items || []).forEach((i, idx) => {
      if (!isDishVisible(i, vis)) return;
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
      m[i.name] = (m[i.name] || 0) + (Number(i.quantity) || 1);
    }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filteredOrders, checkedItemsGlobal, selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode]);

  // Prefer the database figures (same on every KDS device and in the Owner app); the localStorage counters stay
  // only as an offline fallback before the first server response.
  const dispatchedToday = serverKdsToday ? serverKdsToday.count : completedTicketsCount;
  const avgClearTime = useMemo(() => {
    const avg = serverKdsToday
      ? serverKdsToday.avgSeconds
      : (completedTicketsCount ? Math.floor(totalProcessingTime / completedTicketsCount) : 0);
    if (!avg) return '—';
    const a = Math.round(Number(avg));
    return `${Math.floor(a / 60)}m ${a % 60}s`; // avgSeconds can be fractional: "3m 12.4285s" was shown
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

  const toggleSort = () => setSortOldest(v => { const n = !v; try { localStorage.setItem('kds_sort_oldest', n ? '1' : '0'); } catch { /* ignore */ } return n; });
  const todayWastageCount = wastageLog.filter(e => new Date(e.loggedAt || e.createdAt).toDateString() === new Date().toDateString()).length;

  /* ── breakpoint helpers ── */
  const showDrawerToggle = isMobile || isSmallTablet;
  const showPermanentSide = isLargeTablet || w >= 1200;
  const useCardView = isMobile;
  const safeCardIndex = Math.min(mobileCardIndex, Math.max(0, filteredOrders.length - 1));
  const swipeHandlers = useSwipe(
    () => setMobileCardIndex(i => Math.min(i + 1, filteredOrders.length - 1)),
    () => setMobileCardIndex(i => Math.max(i - 1, 0))
  );
  const gridCol = isSmallTablet ? 280 : 320;
  const cardProps = {
    onReady: markAsReady, dishToCategoryMap, dishToVegMap, selectedCategory, checkedItemsGlobal, setCheckedItemsGlobal,
    socketInstance: socketRef.current, isNonVegMode, tenantOnlyVeg, itemFinalTimes, setItemFinalTimes, onItemSynced: mergeServerItem, onSpeak: speakTicket,
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
          {inDrawer && <button type="button" className="kx-ib" aria-label="Close" onClick={() => setSidebarOpen(false)} style={{ height: 36, minWidth: 36, padding: 0 }}><X size={15} /></button>}
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
              <span className="r"><span className={`kx-ct${pendingCount > 0 ? ' hot' : ''}`}>{pad2(pendingCount)}</span></span>
            </button>
            {visibleCategories.map(cat => {
              const k = cat.categoryId?.toLowerCase().trim() || '';
              const count = categoryPendingCounts[k] || 0;
              const sel = selectedCategory === k && !showMetricsDashboard;
              return (
                <button type="button" key={cat._id} className={`kx-nav${sel ? ' on' : ''}`} onClick={() => { setSelectedCategory(k); setShowMetricsDashboard(false); closeIf(); }}>
                  <span className="t"><Flame size={14} color={count > 0 ? '#d3bfa2' : undefined} /><span style={{ textTransform: 'uppercase' }}>{cat.name}</span></span>
                  <span className="r">
                    <span role="button" tabIndex={0} className="kx-86" title={`86 a dish in "${cat.name}"`} aria-label={`86 a dish in ${cat.name}`}
                      onClick={e => { e.stopPropagation(); trigger86(k, cat.name); }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); trigger86(k, cat.name); } }}>
                      <EyeOff size={12} />
                    </span>
                    <span className={`kx-ct${count > 0 ? ' hot' : ''}`}>{pad2(count)}</span>
                  </span>
                </button>
              );
            })}
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
          <SupportContact style={{ marginBottom: 2 }} />
          <PwaInstallButton kind="kitchen" compact />
        </div>
      </>
    );
  };

  const wastageDisabled = wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim();
  const dishesFor86 = eightySixModal ? menuItems.filter(m => (m.categoryId || '').toLowerCase().trim() === eightySixModal.categoryKey && m.isAvailable !== false) : [];

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="kx">
      <style>{KX_CSS}</style>
      {boardState === 'loading' && <span role="status" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Loading kitchen tickets…</span>}

      {!audioUnlocked && (
        <div className="kx-unlock" role="status"><Volume2 size={15} /> Touch the screen once to switch on ticket sounds &amp; voice</div>
      )}

      {/* ── NEW TICKET / CANCELLED CALL-OUTS ── */}
      <div className="kx-toasts" aria-live="assertive">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`kx-toast${t.kind === 'cancel' ? ' cancel' : ''}`} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
              <div className="ic">{t.kind === 'cancel' ? <AlertTriangle size={19} /> : <BellRing size={20} color="#d3bfa2" />}</div>
              <div style={{ minWidth: 0 }}><b>{t.title}</b><p>{t.body}</p></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── SECTIONS DRAWER ── */}
      <AnimatePresence>
        {sidebarOpen && showDrawerToggle && (
          <>
            <motion.div className="kx-scrim" style={{ zIndex: 90 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />
            <motion.aside className="kx-rail drawer" initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
              {renderRail(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════ HEADER ══════════════ */}
      <header className="kx-top">
        <div className="kx-brand">
          {showDrawerToggle && <button type="button" className="kx-ib" aria-label="Open sections" onClick={() => setSidebarOpen(true)}><AlignJustify size={18} /></button>}
          <div className="kx-logo"><img src="/pratyeksha-logo.png" alt="Pratyeksha" /></div>
          <div className="kx-brand-t">
            <span className="kx-kds"><ChefHat size={12} /> Kitchen display</span>
            <span className={`kx-live${isOnline ? '' : ' off'}`}>
              <i className="kx-dot" />
              {isOnline ? (isMobile ? 'Live' : `Live${tenantName ? ` · ${tenantName}` : ''}`) : <><WifiOff size={11} /> Reconnecting…</>}
            </span>
          </div>
        </div>

        {!isMobile && (
          <div className="kx-seg" role="tablist" aria-label="Station">
            {STATIONS.map(s => (
              <button type="button" key={s.val} role="tab" aria-selected={stationFilter === s.val} className={stationFilter === s.val ? 'on' : ''} onClick={() => setStationFilter(s.val)}>
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
                <i className="kx-dot" style={isOnline ? undefined : { background: '#e29a58', animation: 'none' }} />{pad2(pendingCount)}
              </b>
            </div>
          )}
          <button type="button" aria-label="Search" className={`kx-ib${showSearch ? ' on' : ''}`} onClick={() => setShowSearch(v => !v)}><Search size={16} /></button>
          {!isMobile && (
            <button type="button" className={`kx-ib${isAggregateView ? ' on' : ''}`} onClick={() => setIsAggregateView(v => !v)}>
              {isAggregateView ? <LayoutGrid size={16} /> : <BarChart3 size={16} />}{!isTablet && <span>{isAggregateView ? 'TICKETS' : 'SUMMARY'}</span>}
            </button>
          )}
          {recallQueue.length > 0 && (
            <button type="button" className="kx-ib on" onClick={handleRecall} aria-label="Recall last ticket">
              <History size={16} />{!isMobile && !isTablet && <span>RECALL</span>}<em className="kx-badge">{recallQueue.length}</em>
            </button>
          )}
          {!isMobile && (
            <button type="button" aria-label="Wastage log" className={`kx-ib kx-hide-md${showWastagePanel ? ' on' : ''}`} onClick={() => setShowWastagePanel(true)}>
              <Trash2 size={16} />{todayWastageCount > 0 && <em className="kx-badge">{todayWastageCount}</em>}
            </button>
          )}

          {/* Voice announcements: output only, automatic. This is where they are tuned. */}
          <div style={{ position: 'relative' }}>
            <button type="button" aria-label="Voice announcements" aria-expanded={showVoiceMenu} className={`kx-ib${voicePrefs.voice ? ' on' : ' mute'}`} onClick={() => setShowVoiceMenu(v => !v)}>
              {speaking ? <span className="kx-eq"><i /><i /><i /></span> : voicePrefs.voice ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {!isMobile && !isTablet && <span>{voicePrefs.voice ? 'VOICE ON' : 'VOICE OFF'}</span>}
            </button>
            <AnimatePresence>
              {showVoiceMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setShowVoiceMenu(false)} />
                  <motion.div className="kx-pop" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.16 }}>
                    <h4>Ticket announcements</h4>
                    {!speechEngine.supported() && <div className="kx-err">This browser cannot speak. Chime and cards still work.</div>}
                    <div className="kx-row"><div>Speak ticket details<small>Table or source, every dish, portion and notes</small></div>
                      <button type="button" role="switch" aria-checked={voicePrefs.voice} className={`kx-sw${voicePrefs.voice ? ' on' : ''}`} onClick={() => updateVoicePrefs({ voice: !voicePrefs.voice })} /></div>
                    <div className="kx-row"><div>New-ticket chime<small>Different tune for dine-in and delivery</small></div>
                      <button type="button" role="switch" aria-checked={voicePrefs.chime} className={`kx-sw${voicePrefs.chime ? ' on' : ''}`} onClick={() => updateVoicePrefs({ chime: !voicePrefs.chime })} /></div>
                    <div className="kx-row"><span>Repeat</span>
                      <div className="kx-mini">{[1, 2].map(n => <button type="button" key={n} className={voicePrefs.repeat === n ? 'on' : ''} onClick={() => updateVoicePrefs({ repeat: n })}>{n}×</button>)}</div></div>
                    <div className="kx-row"><span>Speed</span>
                      <div className="kx-mini">{[['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']].map(([v, l]) => <button type="button" key={v} className={voicePrefs.rate === v ? 'on' : ''} onClick={() => updateVoicePrefs({ rate: v })}>{l}</button>)}</div></div>
                    <button type="button" className="kx-btn block" onClick={() => { if (voicePrefsRef.current.chime) playAlertSound('order'); later(() => announce('New ticket. Table 5. 2 dishes, dine in. 2 Paneer Tikka. 1 half Dal Fry. Note: less spicy.', { force: true, interrupt: true }), 900); }}>
                      <Volume2 size={14} /> Test announcement
                    </button>
                  </motion.div>
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
          <motion.div className="kx-search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <Search size={15} color="#b99f78" />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by table number, source or dish name…" />
            {searchQuery && <button type="button" className="kx-pill" onClick={() => setSearchQuery('')}>CLEAR</button>}
            <button type="button" aria-label="Close search" onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ background: 'transparent', border: 0, color: '#9b978d', display: 'flex' }}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ORDER CHANGE ALERTS ── */}
      {interceptedAlerts.length > 0 && (
        <div className="kx-alerts">
          <AnimatePresence>
            {/* Only the latest few: an unbounded stack pushed the actual tickets off the screen during a rush. */}
            {interceptedAlerts.slice(0, 3).map(alert => (
              <motion.div key={alert.id} className="kx-alert" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} style={isMobile ? { flexDirection: 'column', alignItems: 'stretch' } : undefined}>
                <div className="l">
                  <div className="ic"><BellRing size={18} color="#e29a58" /></div>
                  <div style={{ minWidth: 0 }}>
                    <h3>ORDER CHANGE{alert.tableNumber != null && String(alert.tableNumber) !== '' ? ` — TABLE ${alert.tableNumber}` : ''}</h3>
                    <p>{alert.modificationNote}</p>
                  </div>
                </div>
                <button type="button" className="kx-btn warn" onClick={() => setInterceptedAlerts(prev => prev.filter(a => a.id !== alert.id))}>Acknowledge</button>
              </motion.div>
            ))}
            {interceptedAlerts.length > 3 && (
              <motion.div key="alerts-more" className="kx-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '8px 14px' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#f0b87c' }}>+{interceptedAlerts.length - 3} MORE ORDER CHANGES</span>
                <button type="button" className="kx-btn warn" style={{ minHeight: 36 }} onClick={() => setInterceptedAlerts([])}>Acknowledge all</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════ BODY ══════════════ */}
      <div className="kx-body">
        {showPermanentSide && <aside className="kx-rail" style={{ width: isLargeTablet ? 214 : 240 }}>{renderRail(false)}</aside>}

        <main className="kx-main">
          {/* prep queue + sort */}
          {!isAggregateView && !showMetricsDashboard && (masterPrepMarqueeList.length > 0 || filteredOrders.length > 1) && (
            <div className="kx-ribbon">
              {masterPrepMarqueeList.length > 0 && (
                <div className="kx-prep no-scrollbar">
                  <span className="kx-prep-l"><Activity size={12} /> Prep queue</span>
                  {masterPrepMarqueeList.map(([name, qty]) => <span key={name} className="kx-chip"><b>{qty}×</b>{name}</span>)}
                </div>
              )}
              {filteredOrders.length > 1 && (
                <button type="button" className="kx-sortbtn" onClick={toggleSort} style={{ marginLeft: 'auto' }}><ArrowUpDown size={13} />{sortOldest ? 'Oldest first' : 'Newest first'}</button>
              )}
            </div>
          )}

          {/* recall strip */}
          {recallQueue.length > 0 && (
            <div className="kx-recall">
              <span className="l"><History size={12} /> Recall {recallQueue.length}/10</span>
              <div className="kx-prep no-scrollbar">
                {recallQueue.map((o, i) => <span key={o._id || i} className={`kx-tag${i === 0 ? ' gold' : ''}`} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{getOrderType(o) === 'parcel' ? 'PARCEL' : `T-${o.tableNumber}`} · {o.items?.length}</span>)}
              </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: '.64rem', fontWeight: 600, color: s.isBottleneck ? '#e29a58' : '#cfc7b8' }}>
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
            <motion.div className="kx-metrics" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <TrendingUp size={24} color="#d3bfa2" />
              <h2>Speed metrics</h2>
              <p>Session performance — resets at midnight IST</p>
              <div className="kx-mtiles">
                <div className="kx-mt"><span>Tickets dispatched</span><b>{dispatchedToday}</b><small>today</small></div>
                <div className="kx-mt"><span>Avg clear time</span><b className="sm">{avgClearTime}</b><small>per ticket</small></div>
                <div className="kx-mt"><span>Currently pending</span><b>{pendingCount}</b><small>active tickets</small></div>
              </div>
              <button type="button" className="kx-btn" onClick={() => setShowMetricsDashboard(false)}><ChevronLeft size={15} /> Back to kitchen</button>
            </motion.div>
          )}

          {/* BATCH PREP SUMMARY */}
          {!showMetricsDashboard && isAggregateView && (
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <BarChart3 size={15} color="#b99f78" />
                <span className="kx-prep-l" style={{ color: '#cfc7b8' }}>Batch prep summary</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: '.64rem', color: '#9b978d' }}>{Object.keys(aggregatedTotals).length} items · {filteredOrders.length} tickets</span>
              </div>
              {Object.keys(aggregatedTotals).length === 0 ? (
                <div className="kx-center"><div className="ic"><ChefHat size={32} /></div><h3>Kitchen clear</h3></div>
              ) : (
                <div className="kx-sum">
                  {Object.entries(aggregatedTotals).map(([key, qty]) => {
                    const [namePart, typePart] = key.split('__');
                    const isParcel = typePart === 'P';
                    return (
                      <div key={key} className={`kx-sumc${isParcel ? ' p' : ''}`}>
                        <b>{pad2(qty)}</b>
                        <div className="n">{namePart}</div>
                        <span className={`kx-tag${isParcel ? ' gold' : ''}`}>{isParcel ? <Package size={10} /> : <UtensilsCrossed size={10} />}{isParcel ? 'PARCEL' : 'DINE-IN'}</span>
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
            ) : filteredOrders.length === 0 ? (
              <div className="kx-center" style={{ flex: 1 }}>
                <div className="ic"><ChefHat size={30} /></div>
                <h3>Kitchen clear</h3><p>Waiting for the next ticket…</p>
                <KdsEmptyDetail loaded={orders.length} shown={filteredOrders.length} tenantId={tenantId} at={lastLoadedAt} />
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden', minHeight: 0 }}>
                <div className="kx-dots">{filteredOrders.map((o, i) => <i key={o._id} className={i === safeCardIndex ? 'on' : ''} onClick={() => setMobileCardIndex(i)} />)}</div>
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }} {...swipeHandlers}>
                  <AnimatePresence mode="wait">
                    <motion.div key={filteredOrders[safeCardIndex]?._id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} style={{ height: '100%' }}>
                      {filteredOrders[safeCardIndex] && <KDSOrderCard order={filteredOrders[safeCardIndex]} fresh={freshIds.has(String(filteredOrders[safeCardIndex]._id))} fill isMobile {...cardProps} />}
                    </motion.div>
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
            <div className="kx-grid no-scrollbar" style={{ '--kx-col': `${gridCol}px` }}>
              {boardState === 'loading' && orders.length === 0 && Array.from({ length: isTablet ? 4 : 6 }, (_, i) => <KdsCardSkeleton key={`sk-${i}`} index={i} />)}
              {boardState === 'error' && orders.length === 0 && <div style={{ gridColumn: '1/-1', display: 'flex' }}><KdsLoadError onRetry={retryBoardLoad} detail={boardError} /></div>}
              <AnimatePresence mode="popLayout">
                {filteredOrders.map(order => <KDSOrderCard key={order._id} order={order} fresh={freshIds.has(String(order._id))} isMobile={false} {...cardProps} />)}
              </AnimatePresence>
              {boardState === 'ready' && filteredOrders.length === 0 && (
                <div className="kx-center">
                  <div className="ic"><ChefHat size={32} /></div>
                  <h3>Kitchen clear</h3><p>All tickets dispatched. New ones appear here the moment they are placed.</p>
                  <KdsEmptyDetail loaded={orders.length} shown={filteredOrders.length} tenantId={tenantId} at={lastLoadedAt} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav className="kx-bnav">
          {STATIONS.map(s => (
            <button type="button" key={s.val} className={stationFilter === s.val ? 'on' : ''} onClick={() => setStationFilter(s.val)}>
              <s.Icon size={17} />{s.lbl}{s.val !== 'ALL' && stationCounts[s.val] > 0 ? <span className="n">{stationCounts[s.val]}</span> : null}
            </button>
          ))}
          <button type="button" className={isAggregateView ? 'on' : ''} onClick={() => { setShowMetricsDashboard(false); setIsAggregateView(v => !v); }}><BarChart3 size={17} />SUMMARY</button>
          <button type="button" className={showMetricsDashboard ? 'on' : ''} onClick={() => setShowMetricsDashboard(v => !v)}><TrendingUp size={17} />METRICS</button>
        </nav>
      )}

      {/* ── WASTAGE PANEL ── */}
      <AnimatePresence>
        {showWastagePanel && (
          <>
            <motion.div className="kx-scrim" style={{ zIndex: 3000 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWastagePanel(false)} />
            <motion.div className="kx-sheet" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              style={{ width: isMobile ? '100vw' : isTablet ? 430 : 500, borderRadius: isMobile ? 0 : undefined }}>
              <div className="kx-sheet-h">
                <div className="t"><div className="ic"><Trash2 size={17} /></div><div><h3>WASTAGE LOG</h3><small>Spoilage · Overcooked · Dropped · Excess</small></div></div>
                <button type="button" className="kx-ib" aria-label="Close" style={{ height: 38, minWidth: 38, padding: 0 }} onClick={() => setShowWastagePanel(false)}><X size={16} /></button>
              </div>
              <div className="kx-tabs">
                {[['log', 'LOG ENTRY'], ['report', 'MONTHLY REPORT']].map(([t, lbl]) => <button type="button" key={t} className={wastageTab === t ? 'on' : ''} onClick={() => setWastageTab(t)}>{lbl}</button>)}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
                {wastageTab === 'log' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="kx-card">
                      <div className="hd">New entry</div>
                      <div style={{ position: 'relative' }}>
                        <label className="kx-lbl">Ingredient *</label>
                        <input className="kx-in" value={wastageForm.itemName} placeholder="Type ingredient name…"
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
                                <span>{s.itemName}</span><span className="mono" style={{ fontSize: '.62rem', color: '#9b978d' }}>{s.currentStock}{s.unit}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label className="kx-lbl">Quantity *</label><input className="kx-in" type="number" min="0.01" step="0.01" placeholder="0.00" value={wastageForm.quantity} onChange={e => setWastageForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                        <div><label className="kx-lbl">Unit</label><select className="kx-in" value={wastageForm.unit} onChange={e => setWastageForm(p => ({ ...p, unit: e.target.value }))}>{UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                      </div>
                      <div>
                        <label className="kx-lbl">Reason *</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{REASON_OPTIONS.map(r => <button type="button" key={r} className={`kx-pill${wastageForm.reason === r ? ' on' : ''}`} onClick={() => setWastageForm(p => ({ ...p, reason: r }))}>{r}</button>)}</div>
                      </div>
                      <div><label className="kx-lbl">Logged by *</label><input className="kx-in" value={wastageForm.loggedBy} onChange={e => setWastageForm(p => ({ ...p, loggedBy: e.target.value }))} placeholder="Chef / Staff name" /></div>
                      <div><label className="kx-lbl">Notes (optional)</label><input className="kx-in" value={wastageForm.notes} onChange={e => setWastageForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any context…" /></div>
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
                                  <span style={{ fontSize: '.62rem', color: '#9b978d' }}>{e.loggedBy}</span>
                                  {e.notes && <span style={{ fontSize: '.62rem', color: '#6f6c64', fontStyle: 'italic' }}>{e.notes}</span>}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 86 (OUT OF STOCK) MODAL — pick the dish, pick a reason, hide it with the reason logged ── */}
      <AnimatePresence>
        {eightySixModal && (
          <>
            <motion.div className="kx-scrim" style={{ zIndex: 3100 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEightySixModal(null)} />
            {/* Centering wrapper must stay transform-free: framer-motion owns the transform on the modal below. */}
            <div className="kx-modalwrap" onClick={() => setEightySixModal(null)}>
              <motion.div className="kx-modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }} style={{ width: isMobile ? '92vw' : 440, maxHeight: 'calc(88vh - 40px)' }}>
                <div className="kx-sheet-h">
                  <div className="t"><div className="ic" style={{ background: 'rgba(226,154,88,.12)', borderColor: 'rgba(226,154,88,.4)', color: '#e29a58' }}><PackageX size={17} /></div><div><h3>86 A DISH</h3><small>{eightySixModal.categoryName}</small></div></div>
                  <button type="button" className="kx-ib" aria-label="Close" style={{ height: 38, minWidth: 38, padding: 0 }} onClick={() => setEightySixModal(null)}><X size={16} /></button>
                </div>
                <div style={{ padding: '16px 20px 20px', overflowY: 'auto' }}>
                  <div className="kx-lbl">Which dish?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, maxHeight: 220, overflowY: 'auto' }}>
                    {dishesFor86.map(dish => <button type="button" key={dish._id} className={`kx-opt${selectedDish86?._id === dish._id ? ' on' : ''}`} onClick={() => setSelectedDish86(dish)}>{dish.name}</button>)}
                    {dishesFor86.length === 0 && <div style={{ fontSize: '.7rem', color: '#9b978d', fontStyle: 'italic', padding: '8px 2px' }}>Everything in this category is already 86'd.</div>}
                  </div>
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
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   TICKET CARD
═══════════════════════════════════════════════════════════════════ */
// forwardRef: <AnimatePresence mode="popLayout"> hands every child a ref to measure it. A plain function component cannot take one
// ("Function components cannot be given refs"), so an exiting ticket could not be measured and the grid jumped when a ticket was dispatched.
const KDSOrderCard = React.forwardRef(({
  order, onReady, fresh, fill,
  dishToCategoryMap, dishToVegMap,
  selectedCategory, checkedItemsGlobal, setCheckedItemsGlobal,
  socketInstance, isNonVegMode, tenantOnlyVeg, isMobile,
  itemFinalTimes, setItemFinalTimes, onItemSynced, onSpeak,
}, ref) => {
  // KDSOrderCard is defined outside KitchenView, so the route's tenantId is not in scope here.
  const tenantId = order.tenantId;
  const otype = getOrderType(order);
  const isAggOrder = otype === 'swiggy' || otype === 'zomato';
  const isParcelOrder = otype === 'parcel';

  const [seconds, setSeconds] = useState(0);
  const [itemStartTimes, setItemStartTimes] = useState({});
  const [itemElapsed, setItemElapsed] = useState({});
  const [showNote, setShowNote] = useState(false);
  // The server has no field for kitchen notes, so this stays on this device. It used to vanish on every refresh / reconnect;
  // keep it per ticket in localStorage (blocked storage just means it is not remembered).
  const noteKey = `kds_note_${order._id}`;
  const [localNote, setLocalNoteState] = useState(() => { try { return localStorage.getItem(`kds_note_${order._id}`) || ''; } catch { return ''; } });
  const setLocalNote = v => { setLocalNoteState(v); try { if (v) localStorage.setItem(noteKey, v); else localStorage.removeItem(noteKey); } catch { /* ignore */ } };

  /* The customer replaced the dishes: per-dish local timers are keyed by line index and would now point at different dishes */
  useEffect(() => {
    setItemStartTimes({});
    setItemElapsed({});
  }, [order.modifiedAt]);

  /* live second counter */
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - new Date(order.createdAt)) / 1000) || 0)); // NaN when createdAt is missing/invalid
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  /* Server-authoritative item timers. The browser only renders elapsed time. */
  useEffect(() => {
    const starts = {};
    const finals = {};
    (order.items || []).forEach((item, idx) => {
      if (!isKitchenItem(item)) return;
      const start = item.kdsStartedAt || order.kdsStartedAt || order.createdAt;
      if (start && !item.kdsCompletedAt && !item.isCrossedLocal) starts[idx] = new Date(start).getTime();
      if (item.kdsPrepTimeSeconds != null) finals[`${order._id}-${idx}`] = Number(item.kdsPrepTimeSeconds);
    });
    setItemStartTimes(starts);
    setItemFinalTimes(prev => ({ ...prev, ...finals }));
  }, [order._id, order.items, order.kdsStartedAt, order.createdAt, setItemFinalTimes]);

  /* item-level cook timers */
  useEffect(() => {
    if (Object.keys(itemStartTimes).length === 0) { setItemElapsed(prev => (Object.keys(prev).length ? {} : prev)); return undefined; }
    const t = setInterval(() => {
      setItemElapsed(() => {
        const u = {};
        Object.entries(itemStartTimes).forEach(([idx, startMs]) => {
          u[idx] = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        });
        return u;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [itemStartTimes]);

  const urgency = seconds >= 900 ? 'high' : seconds >= 450 ? 'med' : 'low';
  const ringColor = urgency === 'high' ? '#e29a58' : urgency === 'med' ? '#d3bfa2' : '#8a704d';

  const kitchenItems = (order.items || []).filter(isKitchenItem);
  const checkedCount = (order.items || []).reduce((n, it, idx) => (isKitchenItem(it) && checkedItemsGlobal[`${order._id}-${idx}`]) ? n + 1 : n, 0);
  const totalItems = kitchenItems.length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const allDone = progressPct === 100 && totalItems > 0;

  const toggleItemCrossed = async idx => {
    const key = `${order._id}-${idx}`;
    // A second tap while the first save is in flight carried the same (now stale) version: guaranteed 409 and a flicker.
    if (pendingToggleKeys.has(key)) return;
    const next = !checkedItemsGlobal[key];
    pendingToggleKeys.add(key);
    const startMs = itemStartTimes[idx] || new Date(order.items?.[idx]?.kdsStartedAt || order.kdsStartedAt || order.createdAt).getTime();
    setItemStartTimes(prev => ({ ...prev, [idx]: startMs }));
    setCheckedItemsGlobal(prev => ({ ...prev, [key]: next }));
    socketInstance?.emit('kds_item_cross_sync', { orderId: order._id, tenantId: order.tenantId, idx, newState: next });
    try {
      const currentItem = order.items?.[idx] || {};
      const r = await axios.patch(`${BASE_URL}/admin/orders/${order._id}/kds-item`, {
        itemIndex: idx, completed: next, tenantId,
        timingVersion: Number.isInteger(Number(currentItem.kdsTimingVersion)) ? Number(currentItem.kdsTimingVersion) : 0,
      });
      onItemSynced?.(order._id, idx, r.data?.item, r.data?.order ? { prepTimeSeconds: r.data.order.prepTimeSeconds, prepTimeMinutes: r.data.order.prepTimeMinutes } : null);
      if (next && r.data?.item?.kdsPrepTimeSeconds != null) {
        setItemFinalTimes(prev => ({ ...prev, [`${order._id}-${idx}`]: Number(r.data.item.kdsPrepTimeSeconds) }));
        setItemStartTimes(prev => ({ ...prev, [idx]: new Date(r.data.item.kdsStartedAt || startMs).getTime() }));
      }
    } catch (err) {
      const authoritative = err?.response?.data?.item;
      if (err?.response?.status === 409 && authoritative) {
        onItemSynced?.(order._id, idx, authoritative, null);
        setCheckedItemsGlobal(prev => ({ ...prev, [key]: !!authoritative.kdsCompletedAt || !!authoritative.isCrossedLocal }));
        if (authoritative.kdsPrepTimeSeconds != null) {
          setItemFinalTimes(prev => ({ ...prev, [key]: Number(authoritative.kdsPrepTimeSeconds) }));
        }
        setItemStartTimes(prev => ({ ...prev, [idx]: authoritative.kdsStartedAt ? new Date(authoritative.kdsStartedAt).getTime() : startMs }));
        // Other screens were told `next` before the save; tell them what the server really holds.
        socketInstance?.emit('kds_item_cross_sync', { orderId: order._id, tenantId: order.tenantId, idx, newState: !!authoritative.kdsCompletedAt || !!authoritative.isCrossedLocal });
      } else {
        setCheckedItemsGlobal(prev => ({ ...prev, [key]: !next }));
        socketInstance?.emit('kds_item_cross_sync', { orderId: order._id, tenantId: order.tenantId, idx, newState: !next });
      }
      console.error('KDS item timing save failed:', err?.message || err);
    } finally { pendingToggleKeys.delete(key); }
  };

  // Touch long-press: iOS/iPadOS never fires `contextmenu` on a long-press, so the cook timer could not be started on an iPad.
  const lpTimerRef = useRef(null);
  const lpFiredRef = useRef(false);
  const lastStartRef = useRef({});
  useEffect(() => () => clearTimeout(lpTimerRef.current), []);
  const startItemTimer = async (idx, e) => {
    e?.preventDefault?.();
    const key = `${order._id}-${idx}`;
    if (itemStartTimes[idx] || checkedItemsGlobal[key]) return;
    // Long-press and contextmenu can both fire for one gesture on Android, and state has not updated between them.
    if (lastStartRef.current[key] && Date.now() - lastStartRef.current[key] < 1500) return;
    lastStartRef.current[key] = Date.now();
    // Persist the actual cook-start moment. The local clock remains immediate
    // feedback, while the server becomes the source of truth for analytics.
    const now = Date.now();
    setItemStartTimes(p => ({ ...p, [idx]: now }));
    try {
      const currentItem = order.items?.[idx] || {};
      const sr = await axios.patch(`${BASE_URL}/admin/orders/${order._id}/kds-item`, {
        itemIndex: idx, action: 'start', tenantId,
        timingVersion: Number.isInteger(Number(currentItem.kdsTimingVersion)) ? Number(currentItem.kdsTimingVersion) : 0,
      });
      onItemSynced?.(order._id, idx, sr.data?.item, null);
    } catch (err) {
      if (err?.response?.status === 409 && err.response.data?.item) onItemSynced?.(order._id, idx, err.response.data.item, null);
      setItemStartTimes(p => { const n = { ...p }; delete n[idx]; return n; });
      console.error('KDS item start save failed:', err?.message || err);
    }
  };

  const sourceLabel = {
    waitlist: 'WAITLIST', reservation: 'RESERVATION', 'counter-pickup': 'PICKUP', takeaway: 'TAKEAWAY', direct: 'DINE-IN', swiggy: 'SWIGGY', zomato: 'ZOMATO',
  }[order.source] || 'DINE-IN';
  const TypeIcon = isAggOrder ? Bike : isParcelOrder ? Package : UtensilsCrossed;
  const typeLabel = isAggOrder ? 'DELIVERY' : isParcelOrder ? 'PARCEL' : 'DINE-IN';
  const numClass = otype === 'swiggy' ? ' sw' : otype === 'zomato' ? ' zo' : '';
  const tableLabel = otype === 'swiggy' ? 'SWIGGY' : otype === 'zomato' ? 'ZOMATO' : isParcelOrder ? 'PARCEL' : `T-${order.tableNumber}`;
  const firstOpenIdx = (order.items || []).findIndex((it, i) => isKitchenItem(it) && !checkedItemsGlobal[`${order._id}-${i}`]);
  const circ = 2 * Math.PI * 19;

  return (
    <motion.article
      ref={ref}
      layout
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
            {fresh && <span className="kx-tag gold">NEW</span>}
            {order.isModified && <span className="kx-tag amber">REPLACED</span>}
            <span className={`kx-tag${otype === 'swiggy' ? ' sw' : otype === 'zomato' ? ' zo' : ''}`}>{sourceLabel}</span>
            <span className="kx-tag id">#{String(order._id).slice(-4).toUpperCase()}{order.aggregatorOrderId ? ` · ${order.aggregatorOrderId.toString().slice(-6)}` : ''}</span>
          </div>
        </div>
        <div>
          <div className={`kx-time ${urgency}`} aria-label={`Ticket age ${fmt(seconds)}`}>
            <svg viewBox="0 0 44 44" width="66" height="66" aria-hidden="true">
              <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3.5" />
              <circle cx="22" cy="22" r="19" fill="none" stroke={ringColor} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${Math.min(1, seconds / 900) * circ} ${circ}`} />
            </svg>
            <span className="tv">{fmt(seconds)}</span>
          </div>
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

      {/* REPLACED STRIP — what the customer changed */}
      {order.isModified && (
        <div className="kx-strip mod">
          <div style={{ fontWeight: 800, letterSpacing: '.08em' }}>⚠ ORDER REPLACED BY CUSTOMER</div>
          {(order.replacedInfo?.previousItems || []).length > 0 && <div style={{ fontWeight: 500 }}>Was: {order.replacedInfo.previousItems.map(p => `${p.quantity}× ${p.name}`).join(', ')}</div>}
          {(order.replacedInfo?.removed || []).length > 0 && <div style={{ fontWeight: 700 }}>Removed: {order.replacedInfo.removed.map(p => `${p.quantity}× ${p.name}`).join(', ')}</div>}
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

          const crossed = !!checkedItemsGlobal[`${order._id}-${idx}`];
          const hasStarted = !!itemStartTimes[idx] || !!item.kdsStartedAt;
          const elapsedSecs = Math.max(0, Math.round(item.kdsCompletedAt && item.kdsPrepTimeSeconds != null ? Number(item.kdsPrepTimeSeconds) : (itemElapsed[idx] || 0)));
          const isSlow = hasStarted && !crossed && elapsedSecs >= 300;
          const finalSecs = Math.max(0, Math.round(Number(itemFinalTimes?.[`${order._id}-${idx}`] ?? elapsedSecs) || 0)); // fractional server seconds rendered as "3m 12.4285s"
          const portionTxt = item.portion?.toUpperCase() || 'STANDARD';

          return (
            <div
              key={idx}
              role="button" tabIndex={0} aria-pressed={crossed}
              className={`kx-it${crossed ? ' done' : hasStarted ? ' run' : ''}`}
              onClick={() => { if (lpFiredRef.current) { lpFiredRef.current = false; return; } toggleItemCrossed(idx); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItemCrossed(idx); } }}
              onContextMenu={e => startItemTimer(idx, e)}
              onTouchStart={() => { lpFiredRef.current = false; clearTimeout(lpTimerRef.current); lpTimerRef.current = setTimeout(() => { lpFiredRef.current = true; startItemTimer(idx, null); }, 550); }}
              onTouchEnd={() => clearTimeout(lpTimerRef.current)}
              onTouchMove={() => clearTimeout(lpTimerRef.current)}
              onTouchCancel={() => clearTimeout(lpTimerRef.current)}
            >
              <div className="kx-qty">{item.quantity}</div>
              <div className="kx-it-b">
                <div className="kx-nm">
                  {!tenantOnlyVeg && <span className={`kx-vd${isVeg ? '' : ' n'}`}><i /></span>}
                  <span className={item.isChefSpecial && !crossed ? 'sp' : undefined} style={item.isChefSpecial && !crossed ? undefined : { display: 'contents' }}>
                    {item.isChefSpecial && !crossed && <Sparkles size={12} />}{item.name}
                  </span>
                  {item.modChange && !crossed && <span className="kx-tag amber">{item.modChange === 'new' ? 'NEW' : `QTY ${item.modPrevQty}→${item.quantity}`}</span>}
                </div>
                {!crossed && (
                  <div className="kx-sub">
                    <span className={item.portion?.toLowerCase() === 'half' ? 'half' : undefined}>{portionTxt}</span>
                    {hasStarted && (
                      <span className={`kx-tm${isSlow ? ' slow' : ''}`}>
                        <Timer size={11} />{`${Math.floor(elapsedSecs / 60)}:${(elapsedSecs % 60).toString().padStart(2, '0')}`}
                        {isSlow && <><AlertTriangle size={10} strokeWidth={2.5} /> SLOW</>}
                      </span>
                    )}
                  </div>
                )}
                {crossed && hasStarted && <div className="kx-sub"><span className="kx-tm" style={{ color: '#9b978d' }}><Timer size={11} /> Done {Math.floor(finalSecs / 60)}m {finalSecs % 60}s</span></div>}
                {!hasStarted && !crossed && idx === firstOpenIdx && <div className="kx-hint">Hold to start cook timer</div>}
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
          <button type="button" className={`kx-sq${showNote || localNote ? ' on' : ''}`} aria-label={showNote ? 'Hide note' : 'Add note'} title="Note" onClick={() => setShowNote(v => !v)}><StickyNote size={18} /></button>
          <button type="button" className="kx-sq" aria-label="Read this ticket aloud" title="Read aloud" onClick={() => onSpeak?.(order)}><Volume2 size={19} /></button>
          <button type="button" className={`kx-go${urgency === 'high' ? ' late' : ''}`} onClick={() => onReady(order._id)} style={isMobile ? { minHeight: 54 } : undefined}>
            {urgency === 'high' && <Flame size={15} strokeWidth={2.5} />}
            {urgency === 'high' ? 'Overdue — dispatch' : allDone ? <><CheckCircle2 size={15} /> All ready — dispatch</> : <>Complete ticket <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </motion.article>
  );
});
KDSOrderCard.displayName = 'KDSOrderCard';

/* ═══════════════════════════════════════════════════════════
   LOADING / EMPTY / ERROR STATES
═══════════════════════════════════════════════════════════ */
const Sk = ({ w, h, r = 7, style }) => <div className="kx-sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;

/* Same shell as a ticket (header + ring, progress, dish rows, action row) so nothing shifts when data arrives. */
const KdsCardSkeleton = ({ index = 0, fill = false }) => (
  <div aria-hidden="true" className={`kx-tk${fill ? ' fill' : ''}`} style={{ '--d': `${index * 0.14}s`, minHeight: fill ? undefined : 360 }}>
    <div className="kx-tk-h">
      <div style={{ flex: 1 }}>
        <Sk w={64} h={10} r={4} />
        <Sk w={110} h={34} r={9} style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', gap: 6 }}><Sk w={52} h={16} r={6} /><Sk w={44} h={16} r={6} /></div>
      </div>
      <Sk w={66} h={66} r={33} />
    </div>
    <div style={{ padding: '4px 12px 8px 16px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="kx-it" style={{ cursor: 'default' }}>
          <Sk w={40} h={40} r={12} />
          <div style={{ paddingTop: 3 }}><Sk w={`${58 + ((i * 17 + index * 9) % 30)}%`} h={14} r={4} style={{ marginBottom: 8 }} /><Sk w={`${26 + ((i * 11 + index * 7) % 20)}%`} h={9} r={3} /></div>
          <Sk w={28} h={28} r={14} />
        </div>
      ))}
    </div>
    <div className="kx-tk-f"><div className="row"><Sk w={50} h={50} r={15} /><Sk w={50} h={50} r={15} /><Sk w="100%" h={50} r={15} style={{ flex: 1 }} /></div></div>
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
    <p data-testid="kds-empty-detail" style={{ fontSize: '.62rem', color: '#6f6c64', margin: '4px 0 0', fontWeight: 500, maxWidth: 440, lineHeight: 1.55, wordBreak: 'break-word' }}>
      {`Loaded ${loaded} pending order${loaded === 1 ? '' : 's'} for "${tenantId || '?'}" from ${host}${at ? ` at ${new Date(at).toLocaleTimeString()}` : ''}.`}
      {hidden > 0 ? ` ${hidden} hidden by the station / veg / category / search filter or because ${hidden === 1 ? 'it has' : 'they have'} only extra items.` : (loaded === 0 ? ' Nothing is waiting in the kitchen.' : '')}
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
        <div className="kx-logo" style={{ alignSelf: 'flex-start' }}><img src="/pratyeksha-logo.png" alt="Pratyeksha" /></div>
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