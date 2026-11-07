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
import { ArrowUp, WifiOff, Wifi, Volume2, VolumeX, Type, SlidersHorizontal, Vibrate, Wind, Minus, Plus, MonitorSmartphone, Trash2 } from 'lucide-react';
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
export const fx = {
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
const PRIVATE_KEYS = [/^px_menu_favs_/, /^px_last_meal_/, /^px_menu_recent_/, /^px_menu_diet_/, /^px_last_place$/, /^px_home_recent$/, /^px_home_favs$/];
const clearSavedData = () => { try { Object.keys(localStorage).filter((k) => PRIVATE_KEYS.some((r) => r.test(k))).forEach((k) => localStorage.removeItem(k)); } catch { /* blocked */ } };

export function PrefsMenu({ lang = 'en', size = 16, style }) {
  const mr = lang === 'mr';
  const [open, setOpen] = useState(false);
  const [snd, setSnd] = useState(soundOn);
  const [vib, setVib] = useState(hapticOn);
  const [rm, setRm] = useState(() => readFlag(MOTION_KEY, false));
  const [scale, setScale] = useState(readTextScale);
  const [awake, setAwake] = useState(() => readFlag(AWAKE_KEY, false));
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
  const step = (d) => {
    const i = Math.max(0, Math.min(TEXT_STEPS.length - 1, TEXT_STEPS.indexOf(scale) + d));
    const n = TEXT_STEPS[i]; setScale(n); applyTextScale(n);
    try { localStorage.setItem(TEXT_KEY, String(n)); } catch { /* blocked */ }
  };
  const L = mr
    ? { title: 'माझ्या आवडीनिवडी', sound: 'आवाज', vib: 'कंपन', size: 'अक्षरांचा आकार', motion: 'कमी हालचाल', awake: 'स्क्रीन सुरू ठेवा', clear: 'माझा जतन केलेला डेटा पुसा', clearAsk: 'नक्की पुसायचे?', yes: 'हो, पुसा', no: 'नको', open: 'आवडीनिवडी' }
    : { title: 'My preferences', sound: 'Sounds', vib: 'Vibration', size: 'Text size', motion: 'Reduce motion', awake: 'Keep screen on', clear: 'Clear my saved data', clearAsk: 'Remove favourites and last orders from this phone?', yes: 'Yes, clear', no: 'Cancel', open: 'Preferences' };
  const Row = ({ icon, label, on, set }) => (
    <button type="button" className="fx-pref-row" role="switch" aria-checked={on} onClick={() => set(!on)}>
      <span className="fx-pref-ico">{icon}</span><span className="fx-pref-lbl">{label}</span><span className={`fx-switch${on ? ' on' : ''}`}><i /></span>
    </button>
  );
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
          {canWake && <Row icon={<MonitorSmartphone size={15} />} label={L.awake} on={awake} set={setKeepAwake} />}
          <div className="fx-pref-row static">
            <span className="fx-pref-ico"><Type size={15} /></span><span className="fx-pref-lbl">{L.size}</span>
            <span className="fx-step">
              <button type="button" data-fx="select" onClick={() => step(-1)} disabled={scale === TEXT_STEPS[0]} aria-label="−"><Minus size={13} /></button>
              <b>{scale}%</b>
              <button type="button" data-fx="select" onClick={() => step(1)} disabled={scale === TEXT_STEPS[TEXT_STEPS.length - 1]} aria-label="+"><Plus size={13} /></button>
            </span>
          </div>
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
export function CustomerExtras({ lang = 'en', banner = true }) {
  const mr = lang === 'mr';
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const [back, setBack] = useState(false);
  const [top, setTop] = useState(false);
  useEffect(() => {
    let t = 0;
    const off = () => { window.clearTimeout(t); setBack(false); setOnline(false); };
    const on = () => { setOnline(true); setBack(true); window.clearTimeout(t); t = window.setTimeout(() => setBack(false), 2600); };
    window.addEventListener('offline', off); window.addEventListener('online', on);
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on); window.clearTimeout(t); };
  }, []);
  useEffect(() => {
    let raf = 0;
    const h = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; setTop(window.scrollY > 700); }); };
    h(); window.addEventListener('scroll', h, { passive: true });
    return () => { window.removeEventListener('scroll', h); if (raf) cancelAnimationFrame(raf); };
  }, []);
  if (typeof document === 'undefined') return null;
  const goTop = () => { const calm = document.documentElement.getAttribute('data-reduce-motion') === 'on' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); fx.tap(); };
  return createPortal(
    <>
      {banner && (!online || back) && (
        <div className={`fx-net ${online ? 'ok' : 'bad'}`} role="status" aria-live="polite">
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{online ? (mr ? 'पुन्हा ऑनलाइन' : 'Back online') : (mr ? 'इंटरनेट नाही — तुम्ही ऑफलाइन आहात' : "You're offline — some things may not load")}</span>
        </div>
      )}
      <button type="button" className={`fx-top${top ? ' show' : ''}`} onClick={goTop} aria-label={mr ? 'वर जा' : 'Back to top'} tabIndex={top ? 0 : -1} data-fx="silent"><ArrowUp size={17} /></button>
    </>, document.body);
}

/** "Good evening" by the guest's clock, one quiet line for the header. */
export function TimeGreeting({ lang = 'en', style }) {
  const [h, setH] = useState(() => new Date().getHours());
  useEffect(() => { const id = window.setInterval(() => setH(new Date().getHours()), 300000); return () => window.clearInterval(id); }, []);
  const k = h < 5 ? 'n' : h < 12 ? 'm' : h < 17 ? 'a' : h < 21 ? 'e' : 'n';
  const T = { en: { m: 'Good morning', a: 'Good afternoon', e: 'Good evening', n: 'Late-night cravings?' }, mr: { m: 'शुभ प्रभात', a: 'शुभ दुपार', e: 'शुभ संध्याकाळ', n: 'रात्रीची भूक?' } };
  return <span className="fx-greet" style={style}>{(T[lang] || T.en)[k]}</span>;
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
