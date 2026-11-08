// ─────────────────────────────────────────────────────────────────────────────
// Guest-side "feel" layer for the customer home + the table menu (Swiggy / Zomato style micro-interactions).
//
//  • Sounds   – tiny tones synthesised with the Web Audio API (no audio files to host or download).
//  • Haptics  – navigator.vibrate on phones that support it.
//  • Touch    – a soft gold ring where the finger lands, on every button / chip / card.
//  • Cart     – a dot that flies from the "ADD" tap to the cart button, which then bumps.
//  • Success  – confetti when an order is sent.
//
// Everything is switched on/off by one speaker button (<FxSoundToggle />, remembered in localStorage),
// is limited to customer screens (the <html data-customer> flag set in main.jsx), and respects
// prefers-reduced-motion for every animation. Staff screens (kitchen / operator / owner) are untouched.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bug, Sunrise, Sun, Sunset, MoonStar, ArrowUp, WifiOff, Wifi, Moon, Rows3, RotateCcw, Volume2, VolumeX, Type, SlidersHorizontal, Vibrate, Wind, Minus, Plus, MonitorSmartphone, Trash2 } from 'lucide-react';
import './customerFx.css';

const SOUND_KEY = 'pxh_fx_sound';
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const readSoundPref = () => { try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; } };
let soundOn = isBrowser ? readSoundPref() : true;
const HAPTIC_KEY = 'px_fx_haptic';
const MOTION_KEY = 'px_reduce_motion';
const readFlag = (k, dflt) => { try { const v = localStorage.getItem(k); return v === null ? dflt : v === 'on'; } catch { return dflt; } };
let hapticOn = isBrowser ? readFlag(HAPTIC_KEY, true) : true;
const applyMotion = (on) => { try { if (on) document.documentElement.setAttribute('data-reduce-motion', '1'); else document.documentElement.removeAttribute('data-reduce-motion'); } catch { /* no DOM */ } };
if (isBrowser) applyMotion(readFlag(MOTION_KEY, false));
// Low-data mode: on Data Saver or a 2G link, calm the animations automatically (unless the guest chose a motion setting themselves).
if (isBrowser) { try { const cn = navigator.connection; if (cn && (cn.saveData || /(^|-)2g$/.test(cn.effectiveType || '')) && localStorage.getItem(MOTION_KEY) === null) applyMotion(true); } catch { /* ignore */ } }
// A small local error log so a guest can copy diagnostics for support; nothing is sent anywhere.
const ERR_KEY = 'px_err_log';
const logErr = (msg, src) => {
  try {
    const cur = JSON.parse(localStorage.getItem(ERR_KEY) || '[]');
    cur.push({ t: new Date().toISOString(), m: String(msg || '').slice(0, 240), s: String(src || '').slice(0, 120) });
    localStorage.setItem(ERR_KEY, JSON.stringify(cur.slice(-15)));
  } catch { /* blocked */ }
};
if (isBrowser && !window.__pxErrHook) {
  window.__pxErrHook = true;
  window.addEventListener('error', (e) => logErr(e.message, `${(e.filename || '').split('/').pop()}:${e.lineno || ''}`));
  window.addEventListener('unhandledrejection', (e) => logErr(e.reason?.message || e.reason, 'promise'));
}
const copyDiagnostics = async () => {
  let errs = []; try { errs = JSON.parse(localStorage.getItem(ERR_KEY) || '[]'); } catch { /* ignore */ }
  const d = { when: new Date().toISOString(), page: window.location.pathname, ua: navigator.userAgent, screen: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`, online: navigator.onLine, net: navigator.connection?.effectiveType || '', saveData: !!navigator.connection?.saveData, lang: document.documentElement.lang, errors: errs };
  const text = JSON.stringify(d, null, 1);
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
};
const DIM_KEY = 'px_night_dim';
const DENSITY_KEY = 'px_compact';
const applyFlagAttr = (attr, on) => { try { if (on) document.documentElement.setAttribute(attr, '1'); else document.documentElement.removeAttribute(attr); } catch { /* no DOM */ } };
if (isBrowser) { applyFlagAttr('data-dim', readFlag(DIM_KEY, false)); applyFlagAttr('data-compact', readFlag(DENSITY_KEY, false)); }
const listeners = new Set();

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const onCustomerSurface = () => isBrowser && document.documentElement.hasAttribute('data-customer');

// ── audio ───────────────────────────────────────────────────────────────────
let ac = null;
const getAC = () => {
  try {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  } catch { return null; }
};

// One shaped blip: sine/triangle with a fast attack and exponential decay (and optional pitch glide).
const blip = (freq, at, dur, vol = 0.08, { type = 'sine', to = null } = {}) => {
  const c = getAC();
  if (!c) return;
  const t0 = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
};

// A short filtered-noise swish (sheet opening, page change).
const swish = (at = 0, dur = 0.16, vol = 0.05) => {
  const c = getAC();
  if (!c) return;
  const t0 = c.currentTime + at;
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(900, t0);
  f.frequency.exponentialRampToValueAtTime(3200, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start(t0);
};

const SOUNDS = {
  tap: () => blip(1900, 0, 0.035, 0.035, { type: 'triangle' }),
  select: () => { blip(880, 0, 0.06, 0.05); blip(1320, 0.05, 0.07, 0.045); },
  add: () => { blip(520, 0, 0.09, 0.09, { type: 'triangle', to: 780 }); blip(1040, 0.07, 0.12, 0.07); },
  remove: () => blip(620, 0, 0.12, 0.08, { type: 'triangle', to: 330 }),
  like: () => { blip(740, 0, 0.08, 0.07); blip(988, 0.07, 0.08, 0.07); blip(1480, 0.14, 0.16, 0.06); },
  open: () => swish(0, 0.18, 0.05),
  success: () => { [523.3, 659.3, 784, 1046.5].forEach((f, i) => blip(f, i * 0.09, 0.4, 0.075, { type: 'triangle' })); blip(2093, 0.38, 0.5, 0.03); },
  error: () => { blip(220, 0, 0.16, 0.08, { type: 'square' }); blip(165, 0.14, 0.22, 0.08, { type: 'square' }); },
};

const haptic = (pattern) => {
  if (!hapticOn) return; // the vibration switch in the preferences menu
  if (!lastPointer.t) return; // browsers block vibrate() (and log an error) until the guest has tapped the page once
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* unsupported */ }
};

const play = (name) => {
  if (!soundOn || !onCustomerSurface()) return;
  try { SOUNDS[name]?.(); } catch { /* audio blocked */ }
};

// ── visual helpers ──────────────────────────────────────────────────────────
const lastPointer = { x: 0, y: 0, t: 0 };
let overlay = null;
const getOverlay = () => {
  if (!overlay || !overlay.isConnected) {
    overlay = document.createElement('div');
    overlay.className = 'fx-layer';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }
  return overlay;
};

const spawn = (cls, x, y, style = {}, ttl = 700) => {
  const el = document.createElement('span');
  el.className = cls;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  Object.entries(style).forEach(([k, v]) => el.style.setProperty(k, v));
  getOverlay().appendChild(el);
  setTimeout(() => el.remove(), ttl);
  return el;
};

const ring = (x, y) => { if (!reducedMotion()) spawn('fx-ring', x, y, {}, 600); };

const findCart = () => document.querySelector('[data-fx-cart]');

const bumpCart = () => {
  const cart = findCart();
  if (!cart || reducedMotion() || !cart.animate) return;
  cart.animate(
    [{ scale: '1' }, { scale: '1.22' }, { scale: '0.94' }, { scale: '1.06' }, { scale: '1' }],
    { duration: 460, easing: 'cubic-bezier(.3,.7,.4,1)' },
  );
};

// A gold dot that arcs from where the guest tapped to the cart button.
const flyToCart = () => {
  const cart = findCart();
  const fresh = Date.now() - lastPointer.t < 1500;
  if (!cart || !fresh || reducedMotion()) { bumpCart(); return; }
  const r = cart.getBoundingClientRect();
  const tx = r.left + r.width / 2;
  const ty = r.top + r.height / 2;
  const sx = lastPointer.x;
  const sy = lastPointer.y;
  const dot = spawn('fx-dot', sx, sy, {}, 1000);
  if (!dot.animate) { bumpCart(); return; }
  const dx = tx - sx;
  const dy = ty - sy;
  const lift = Math.max(40, Math.min(140, Math.abs(dy) * 0.35));
  const anim = dot.animate(
    [
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.45 - lift}px)) scale(.85)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.35)`, opacity: 0.9, offset: 1 },
    ],
    { duration: 640, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' },
  );
  anim.onfinish = () => { dot.remove(); bumpCart(); };
};

const CONFETTI_COLORS = ['#d3bfa2', '#f1e3c6', '#c9a84c', '#ffffff', '#8a704d', '#e6c98b'];
const confetti = (x = window.innerWidth / 2, y = window.innerHeight * 0.32, count = 38) => {
  if (reducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const power = 90 + Math.random() * 170;
    spawn('fx-confetti', x, y, {
      '--dx': `${Math.cos(angle) * power}px`,
      '--dy': `${Math.sin(angle) * power - 120}px`,
      '--rot': `${Math.round(Math.random() * 720 - 360)}deg`,
      '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      '--w': `${5 + Math.random() * 5}px`,
      '--h': `${8 + Math.random() * 6}px`,
      '--d': `${0.9 + Math.random() * 0.7}s`,
    }, 1800);
  }
};

const burstHearts = (x, y) => {
  if (reducedMotion()) return;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI / 2) + (Math.random() - 0.5) * 2.2;
    const p = 28 + Math.random() * 34;
    spawn('fx-heart', x, y, { '--dx': `${Math.cos(a) * p}px`, '--dy': `${Math.sin(a) * p}px`, '--s': `${0.7 + Math.random() * 0.7}` }, 900);
  }
};

// ── public API ──────────────────────────────────────────────────────────────
// A small snackbar with one optional action ("Saved to favourites · View"). One at a time, auto-dismisses.
let __toastEl = null; let __toastTimer = 0;
const toast = (text, action) => {
  if (typeof document === 'undefined') return;
  if (__toastEl) { __toastEl.remove(); window.clearTimeout(__toastTimer); }
  const el = document.createElement('div');
  el.className = 'fx-toast'; el.setAttribute('role', 'status');
  const span = document.createElement('span'); span.textContent = text; el.appendChild(span);
  if (action?.label) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = action.label;
    b.addEventListener('click', () => { try { action.onClick?.(); } finally { el.remove(); } });
    el.appendChild(b);
  }
  document.body.appendChild(el); __toastEl = el;
  __toastTimer = window.setTimeout(() => { el.classList.add('out'); window.setTimeout(() => el.remove(), 260); }, 3200);
};

export const fx = {
  toast,
  play,
  tap: () => play('tap'),
  // the cart button mounts on the first add, so give React a moment to render it before aiming at it
  select: () => { play('select'); haptic(10); },
  add: () => { play('add'); haptic(14); setTimeout(flyToCart, 90); },
  remove: () => { play('remove'); haptic(8); },
  success: () => { play('success'); haptic([30, 40, 30, 40, 70]); confetti(); },
  error: () => { play('error'); haptic([60, 40, 60]); },
  open: () => play('open'),
  like: (el) => {
    play('like'); haptic(12);
    const r = el?.getBoundingClientRect?.();
    if (r) burstHearts(r.left + r.width / 2, r.top + r.height / 2);
  },
  isSoundOn: () => soundOn,
  setSound: (on) => {
    soundOn = !!on;
    try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch { /* storage blocked */ }
    listeners.forEach((fn) => fn(soundOn));
    if (soundOn) { getAC(); SOUNDS.select(); }
  },
};

// ── global listeners (installed once) ───────────────────────────────────────
const INTERACTIVE = 'button, [role="button"], a[href], summary, label[for], input[type="checkbox"], input[type="radio"], [data-fx]';
const NO_FX = '[disabled], [aria-disabled="true"], [data-fx="off"], [data-fx="silent"]';

if (isBrowser && !window.__pxhFxInstalled) {
  window.__pxhFxInstalled = true;
  window.addEventListener('pointerdown', (e) => {
    if (!onCustomerSurface()) return;
    lastPointer.x = e.clientX; lastPointer.y = e.clientY; lastPointer.t = Date.now();
    getAC(); // unlock audio inside the gesture
    const el = e.target?.closest?.(INTERACTIVE);
    if (!el || el.matches(NO_FX) || el.closest('[data-fx="off"]')) return;
    const kind = el.getAttribute('data-fx');
    ring(e.clientX, e.clientY);
    if (kind === 'like') return; // the like handler plays its own sound
    play(kind === 'select' ? 'select' : kind === 'open' ? 'open' : 'tap');
    haptic(6);
  }, { passive: true, capture: true });
}

// ── UI: the speaker toggle ──────────────────────────────────────────────────
// Text size: scales every rem-based size on guest pages (100% -> 112% -> 125%). Remembered on this device.
const TEXT_KEY = 'px_text_scale';
const TEXT_STEPS = [100, 112, 125];
const readTextScale = () => { try { const v = Number(localStorage.getItem(TEXT_KEY)); return TEXT_STEPS.includes(v) ? v : 100; } catch { return 100; } };
const applyTextScale = (v) => { try { document.documentElement.style.fontSize = v === 100 ? '' : `${v}%`; } catch { /* no DOM */ } };
if (typeof document !== 'undefined') applyTextScale(readTextScale());

export function TextSizeToggle({ size = 16, style, lang = 'en' }) {
  const mr = lang === 'mr';
  const [v, setV] = useState(readTextScale);
  const next = () => {
    const n = TEXT_STEPS[(TEXT_STEPS.indexOf(v) + 1) % TEXT_STEPS.length];
    setV(n); applyTextScale(n);
    try { localStorage.setItem(TEXT_KEY, String(n)); } catch { /* storage blocked */ }
  };
  const label = mr ? `अक्षरांचा आकार ${v}%` : `Text size ${v}%`;
  return (
    <button type="button" className="fx-sound-btn fx-text-btn" data-fx="select" aria-label={label} title={label} onClick={next} style={style}>
      <Type size={size} strokeWidth={2} />
      {v !== 100 && <i className="fx-text-dot" aria-hidden="true" />}
    </button>
  );
}

/** One small button that opens the guest's preferences: sound, vibration, text size, reduced motion. */
// Keep the screen on (Screen Wake Lock) so the guest can watch their order status without the phone locking.
const AWAKE_KEY = 'px_keep_awake';
let wakeLock = null;
const holdAwake = async () => {
  try { if (navigator.wakeLock && !document.hidden) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener?.('release', () => { wakeLock = null; }); } } catch { /* denied or unsupported */ }
};
const releaseAwake = async () => { try { await wakeLock?.release(); } catch { /* none */ } wakeLock = null; };
const PRIVATE_KEYS = [/^px_menu_favs_/, /^px_last_meal_/, /^px_menu_recent_/, /^px_menu_diet_/, /^px_menu_sort_/, /^px_err_log$/, /^px_menu_offline_/, /^px_last_place$/, /^px_home_recent$/, /^px_home_favs$/];
const clearSavedData = () => { try { Object.keys(localStorage).filter((k) => PRIVATE_KEYS.some((r) => r.test(k))).forEach((k) => localStorage.removeItem(k)); } catch { /* blocked */ } };

// Defined at module level: when it lived inside PrefsMenu it was re-created on every render, so a toggled switch lost keyboard focus.
function Row({ icon, label, on, set }) {
  return (
    <button type="button" className="fx-pref-row" role="switch" aria-checked={on} onClick={() => set(!on)}>
      <span className="fx-pref-ico">{icon}</span><span className="fx-pref-lbl">{label}</span><span className={`fx-switch${on ? ' on' : ''}`}><i /></span>
    </button>
  );
}

export function PrefsMenu({ lang = 'en', size = 16, style }) {
  const mr = lang === 'mr';
  const [open, setOpen] = useState(false);
  const [snd, setSnd] = useState(soundOn);
  const [vib, setVib] = useState(hapticOn);
  const [rm, setRm] = useState(() => readFlag(MOTION_KEY, false));
  const [scale, setScale] = useState(readTextScale);
  const [awake, setAwake] = useState(() => readFlag(AWAKE_KEY, false));
  const [dim, setDim] = useState(() => readFlag(DIM_KEY, false));
  const [compact, setCompact] = useState(() => readFlag(DENSITY_KEY, false));
  const [confirmClear, setConfirmClear] = useState(false);
  const canWake = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const box = React.useRef(null);
  useEffect(() => { const fn = (v) => setSnd(v); listeners.add(fn); return () => { listeners.delete(fn); }; }, []);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  useEffect(() => {
    if (!awake || !canWake) return undefined;
    holdAwake();
    const again = () => { if (!document.hidden && !wakeLock) holdAwake(); };
    document.addEventListener('visibilitychange', again);
    return () => { document.removeEventListener('visibilitychange', again); releaseAwake(); };
  }, [awake, canWake]);
  const setKeepAwake = (on) => { setAwake(on); try { localStorage.setItem(AWAKE_KEY, on ? 'on' : 'off'); } catch { /* blocked */ } };
  const setVibration = (on) => { hapticOn = on; setVib(on); try { localStorage.setItem(HAPTIC_KEY, on ? 'on' : 'off'); } catch { /* blocked */ } if (on && navigator.vibrate && lastPointer.t) { try { navigator.vibrate(18); } catch { /* unsupported */ } } };
  const setMotion = (on) => { setRm(on); applyMotion(on); try { localStorage.setItem(MOTION_KEY, on ? 'on' : 'off'); } catch { /* blocked */ } };
  const setDimmer = (on) => { setDim(on); applyFlagAttr('data-dim', on); try { localStorage.setItem(DIM_KEY, on ? 'on' : 'off'); } catch { /* blocked */ } };
  const setDense = (on) => { setCompact(on); applyFlagAttr('data-compact', on); try { localStorage.setItem(DENSITY_KEY, on ? 'on' : 'off'); } catch { /* blocked */ } };
  const resetPrefs = () => {
    fx.setSound(true); setVibration(true); setMotion(false); setDimmer(false); setDense(false); setKeepAwake(false);
    setScale(100); applyTextScale(100); try { localStorage.setItem(TEXT_KEY, '100'); } catch { /* blocked */ }
  };
  const step = (d) => {
    const i = Math.max(0, Math.min(TEXT_STEPS.length - 1, TEXT_STEPS.indexOf(scale) + d));
    const n = TEXT_STEPS[i]; setScale(n); applyTextScale(n);
    try { localStorage.setItem(TEXT_KEY, String(n)); } catch { /* blocked */ }
  };
  const L = mr
    ? { title: 'माझ्या आवडीनिवडी', sound: 'आवाज', vib: 'कंपन', size: 'अक्षरांचा आकार', motion: 'कमी हालचाल', awake: 'स्क्रीन सुरू ठेवा', dim: 'रात्री मंद प्रकाश', diag: 'सपोर्टसाठी माहिती कॉपी करा', copied: 'कॉपी झाले', copyFail: 'कॉपी होऊ शकले नाही', dense: 'कॉम्पॅक्ट यादी', reset: 'डीफॉल्ट सेटिंग्ज', clear: 'माझा जतन केलेला डेटा पुसा', clearAsk: 'नक्की पुसायचे?', yes: 'हो, पुसा', no: 'नको', open: 'आवडीनिवडी' }
    : { title: 'My preferences', sound: 'Sounds', vib: 'Vibration', size: 'Text size', motion: 'Reduce motion', awake: 'Keep screen on', dim: 'Night dim', diag: 'Copy info for support', copied: 'Copied', copyFail: "Couldn't copy", dense: 'Compact list', reset: 'Reset to defaults', clear: 'Clear my saved data', clearAsk: 'Remove favourites and last orders from this phone?', yes: 'Yes, clear', no: 'Cancel', open: 'Preferences' };
  return (
    <div className="fx-prefs" ref={box}>
      <button type="button" className="fx-sound-btn" data-fx="off" aria-haspopup="dialog" aria-expanded={open} aria-label={L.open} title={L.open} style={style} onClick={() => setOpen((v) => !v)}>
        <SlidersHorizontal size={size} strokeWidth={2} />
      </button>
      {open && (
        <div className="fx-pref-pop" role="dialog" aria-label={L.title}>
          <div className="fx-pref-h">{L.title}</div>
          <Row icon={snd ? <Volume2 size={15} /> : <VolumeX size={15} />} label={L.sound} on={snd} set={(v) => fx.setSound(v)} />
          <Row icon={<Vibrate size={15} />} label={L.vib} on={vib} set={setVibration} />
          <Row icon={<Wind size={15} />} label={L.motion} on={rm} set={setMotion} />
          <Row icon={<Moon size={15} />} label={L.dim} on={dim} set={setDimmer} />
          <Row icon={<Rows3 size={15} />} label={L.dense} on={compact} set={setDense} />
          {canWake && <Row icon={<MonitorSmartphone size={15} />} label={L.awake} on={awake} set={setKeepAwake} />}
          <div className="fx-pref-row static">
            <span className="fx-pref-ico"><Type size={15} /></span><span className="fx-pref-lbl">{L.size}</span>
            <span className="fx-step">
              <button type="button" data-fx="select" onClick={() => step(-1)} disabled={scale === TEXT_STEPS[0]} aria-label="−"><Minus size={13} /></button>
              <b>{scale}%</b>
              <button type="button" data-fx="select" onClick={() => step(1)} disabled={scale === TEXT_STEPS[TEXT_STEPS.length - 1]} aria-label="+"><Plus size={13} /></button>
            </span>
          </div>
          <button type="button" className="fx-pref-clear fx-pref-reset" onClick={async () => { const ok = await copyDiagnostics(); fx.toast(ok ? L.copied : L.copyFail); }}><Bug size={13} />{L.diag}</button>
          <button type="button" className="fx-pref-clear fx-pref-reset" onClick={resetPrefs}><RotateCcw size={13} />{L.reset}</button>
          {!confirmClear ? (
            <button type="button" className="fx-pref-clear" onClick={() => setConfirmClear(true)}><Trash2 size={13} />{L.clear}</button>
          ) : (
            <div className="fx-pref-confirm" role="alertdialog" aria-label={L.clearAsk}>
              <p>{L.clearAsk}</p>
              <div><button type="button" onClick={() => setConfirmClear(false)}>{L.no}</button><button type="button" className="danger" onClick={() => { clearSavedData(); window.location.reload(); }}>{L.yes}</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Small guest-side niceties, mounted once per page: an offline / back-online banner and a back-to-top button. */
export function CustomerExtras({ lang = 'en', banner = true, topButton = true }) {
  const mr = lang === 'mr';
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const [back, setBack] = useState(false);
  const [top, setTop] = useState(false);
  const bar = React.useRef(null);
  useEffect(() => {
    let t = 0;
    const off = () => { window.clearTimeout(t); setBack(false); setOnline(false); };
    const on = () => { setOnline(true); setBack(true); window.clearTimeout(t); t = window.setTimeout(() => setBack(false), 2600); };
    window.addEventListener('offline', off); window.addEventListener('online', on);
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on); window.clearTimeout(t); };
  }, []);
  useEffect(() => {
    let raf = 0;
    const h = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; setTop(window.scrollY > 700); const d = document.documentElement; const max = d.scrollHeight - window.innerHeight; if (bar.current) bar.current.style.transform = `scaleX(${max > 300 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`; }); };
    h(); window.addEventListener('scroll', h, { passive: true });
    return () => { window.removeEventListener('scroll', h); if (raf) cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    const key = (e) => {
      const el = document.activeElement; const tag = el?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable;
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !document.querySelector('[role="dialog"], [aria-modal="true"]')) {
        const q = document.querySelector('input[type="text"], input[type="search"]');
        if (q) { e.preventDefault(); q.focus(); q.scrollIntoView({ block: 'center', behavior: 'auto' }); }
      } else if (e.key === 'Escape' && tag === 'INPUT' && (el.type === 'text' || el.type === 'search') && el.value) {
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (set) { set.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })); }
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    // Paused tabs shouldn't keep animating glows and orbs in the background (battery + memory).
    const vis = () => { try { if (document.hidden) document.documentElement.setAttribute('data-hidden', '1'); else document.documentElement.removeAttribute('data-hidden'); } catch { /* no DOM */ } };
    document.addEventListener('visibilitychange', vis); vis();
    const calm = () => document.documentElement.hasAttribute('data-reduce-motion') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const puff = (cls, x, y, html, ms) => {
      const el = document.createElement('div');
      el.className = cls; el.style.left = `${x}px`; el.style.top = `${y}px`; if (html) el.innerHTML = html; el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el); window.setTimeout(() => el.remove(), ms);
    };
    // A soft ring where a finger lands, and double-tap on a dish to save it (like a photo app).
    let last = { t: 0, x: 0, y: 0 };
    const down = (e) => {
      if (calm() || e.button > 0) return;
      if (e.target.closest?.('button, a, [role="button"], .px-dish, label, summary')) puff('fx-ring', e.clientX, e.clientY, '', 620);
    };
    const up = (e) => {
      const card = e.target.closest?.('.px-dish');
      if (!card || e.target.closest('button, a, input, textarea, select, label, summary, [role="button"]')) return;
      const now = Date.now();
      const near = Math.hypot(e.clientX - last.x, e.clientY - last.y) < 36;
      if (now - last.t < 320 && near) {
        const heart = card.querySelector('.px-heart:not(.px-share)');
        if (heart) {
          if (!heart.classList.contains('on')) heart.click();
          if (!calm()) puff('fx-bigheart', e.clientX, e.clientY, '<svg viewBox="0 0 24 24" width="64" height="64"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1 4.6 2.6C12 6 13.6 5 15.6 5 19 5 21.1 8.4 21.600 11.8 19.500 16.4 12 21 12 21z" fill="#e8a39a" stroke="#fff" stroke-opacity=".5"/></svg>', 900);
        }
        last = { t: 0, x: 0, y: 0 };
      } else last = { t: now, x: e.clientX, y: e.clientY };
    };
    // Gentle nudge: after ~25 s of nothing, the "Surprise me" chip does one little wiggle.
    let idleT = 0;
    const arm = () => {
      window.clearTimeout(idleT);
      idleT = window.setTimeout(() => {
        if (calm() || document.hidden) return;
        const chip = document.querySelector('.qf-surprise');
        if (chip && !document.querySelector('.fx-pop')) { chip.classList.add('fx-wiggle'); window.setTimeout(() => chip.classList.remove('fx-wiggle'), 1400); }
      }, 25000);
    };
    arm();
    ['pointerdown', 'keydown', 'scroll'].forEach((ev) => window.addEventListener(ev, arm, { passive: true, capture: true }));
    document.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointerup', up, { passive: true });
    return () => { window.clearTimeout(idleT); ['pointerdown', 'keydown', 'scroll'].forEach((ev) => window.removeEventListener(ev, arm, true)); document.removeEventListener('visibilitychange', vis); document.removeEventListener('pointerdown', down); document.removeEventListener('pointerup', up); };
  }, []);
  if (typeof document === 'undefined') return null;
  const goTop = () => { const calm = document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); fx.tap(); };
  return createPortal(
    <>
      {banner && (!online || back) && (
        <div className={`fx-net ${online ? 'ok' : 'bad'}`} role="status" aria-live="polite">
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{online ? (mr ? 'पुन्हा ऑनलाइन' : 'Back online') : (mr ? 'इंटरनेट नाही — तुम्ही ऑफलाइन आहात' : "You're offline — some things may not load")}</span>
        </div>
      )}
      <div className="fx-progress" aria-hidden="true"><i ref={bar} /></div>
      {topButton && <button type="button" className={`fx-top${top ? ' show' : ''}`} onClick={goTop} aria-label={mr ? 'वर जा' : 'Back to top'} tabIndex={top ? 0 : -1} data-fx="silent"><ArrowUp size={17} /></button>}
    </>, document.body);
}

/** "Good evening" by the guest's clock, one quiet line for the header. */
export function TimeGreeting({ lang = 'en', style, name = '' }) {
  const [h, setH] = useState(() => new Date().getHours());
  useEffect(() => { const id = window.setInterval(() => setH(new Date().getHours()), 300000); return () => window.clearInterval(id); }, []);
  const k = h < 5 ? 'n' : h < 12 ? 'm' : h < 17 ? 'a' : h < 21 ? 'e' : 'n';
  const T = { en: { m: 'Good morning', a: 'Good afternoon', e: 'Good evening', n: 'Late-night cravings?' }, mr: { m: 'शुभ प्रभात', a: 'शुभ दुपार', e: 'शुभ संध्याकाळ', n: 'रात्रीची भूक?' } };
  const Ico = k === 'm' ? Sunrise : k === 'a' ? Sun : k === 'e' ? Sunset : MoonStar;
  return <span className="fx-greet" style={style}><Ico size={13} className="fx-greet-i" aria-hidden="true" />{(T[lang] || T.en)[k]}{name && k !== 'n' ? `, ${name}` : ''}</span>;
}

export function FxSoundToggle({ size = 16, style, lang = 'en' }) {
  const mr = lang === 'mr';
  const [on, setOn] = useState(soundOn);
  useEffect(() => { const fn = (v) => setOn(v); listeners.add(fn); return () => { listeners.delete(fn); }; }, []);
  return (
    <button
      type="button"
      className="fx-sound-btn"
      data-fx="off"
      aria-pressed={on}
      aria-label={mr ? (on ? 'आवाज बंद करा' : 'आवाज सुरू करा') : (on ? 'Turn sounds off' : 'Turn sounds on')}
      title={mr ? (on ? 'आवाज सुरू' : 'आवाज बंद') : (on ? 'Sounds on' : 'Sounds off')}
      onClick={() => fx.setSound(!on)}
      style={style}
    >
      {on ? <Volume2 size={size} strokeWidth={2} /> : <VolumeX size={size} strokeWidth={2} />}
    </button>
  );
}

export default fx;