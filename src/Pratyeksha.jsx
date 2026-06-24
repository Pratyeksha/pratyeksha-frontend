import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode, ChefHat, Mic, Layers, Truck, Trash2, Grid3x3, Wallet,
  TrendingUp, Users, Brain, Play, Pause, RotateCcw, ChevronLeft,
  ChevronRight, CheckCircle2, Flame, Package, BellRing, Receipt,
  Star, Clock3, CalendarClock, Award, Sparkles, Smile, Coffee,
  UtensilsCrossed, ShoppingBag, BarChart3, FileText, Zap,
  ArrowRight, Check, AlertCircle, TrendingDown, DollarSign,
  Heart, ThumbsUp, MessageCircle, Phone
} from 'lucide-react';

const G = '#C9A84C';
const GL = '#D3BFA2';
const GD = '#8A704D';
const INK = '#0C0C0C';
const IV = '#FAF6EC';
const DK = '#0D0E11';
const CD = '#13151A';

// ── Character SVG components ──
const CustomerChar = ({ mood = 'happy', size = 80 }) => {
  const colors = { happy: G, confused: '#BA7517', excited: '#4ade80' };
  const c = colors[mood] || G;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Body */}
      <circle cx="40" cy="26" r="14" fill={`${c}25`} stroke={c} strokeWidth="1.5"/>
      {/* Face */}
      <circle cx="36" cy="24" r="2" fill={c}/>
      <circle cx="44" cy="24" r="2" fill={c}/>
      {mood === 'happy' && <path d="M34 30 Q40 35 46 30" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>}
      {mood === 'confused' && <path d="M35 31 Q40 29 45 31" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>}
      {mood === 'excited' && <path d="M33 29 Q40 37 47 29" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>}
      {/* Hair */}
      <path d="M26 22 Q28 12 40 11 Q52 12 54 22" fill={`${c}40`}/>
      {/* Shirt */}
      <path d="M26 40 Q28 36 40 36 Q52 36 54 40 L56 62 L24 62 Z" fill={`${c}15`} stroke={`${c}40`} strokeWidth="1"/>
      {/* Arms */}
      <path d="M26 42 Q18 50 20 58" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M54 42 Q62 50 60 58" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Phone in hand */}
      {mood === 'excited' && (
        <rect x="62" y="50" width="12" height="18" rx="2" fill={`${c}20`} stroke={c} strokeWidth="1"/>
      )}
    </svg>
  );
};

const ChefChar = ({ mood = 'cooking', size = 80 }) => {
  const c = G;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Chef hat */}
      <ellipse cx="40" cy="16" rx="14" ry="5" fill={`${c}30`} stroke={c} strokeWidth="1"/>
      <rect x="28" y="10" width="24" height="14" rx="3" fill={`${c}20`} stroke={c} strokeWidth="1"/>
      <ellipse cx="40" cy="8" rx="10" ry="8" fill={`${c}30`} stroke={c} strokeWidth="1"/>
      {/* Face */}
      <circle cx="40" cy="30" r="12" fill={`${c}20`} stroke={c} strokeWidth="1.5"/>
      <circle cx="36" cy="28" r="1.8" fill={c}/>
      <circle cx="44" cy="28" r="1.8" fill={c}/>
      {mood === 'cooking' && <path d="M35 34 Q40 38 45 34" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>}
      {mood === 'happy' && <path d="M34 34 Q40 40 46 34" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>}
      {/* Apron body */}
      <path d="M28 42 L52 42 L54 70 L26 70 Z" fill={`${c}10`} stroke={`${c}35`} strokeWidth="1"/>
      <rect x="34" y="42" width="12" height="16" rx="2" fill={`${c}20`} stroke={`${c}40`} strokeWidth="1"/>
      {/* Arms */}
      <path d="M28 45 Q16 52 18 62" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M52 45 Q64 52 62 62" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Pan in right hand */}
      <circle cx="66" cy="65" r="6" fill={`${c}25`} stroke={c} strokeWidth="1"/>
      <line x1="62" y1="65" x2="72" y2="65" stroke={c} strokeWidth="1.5"/>
    </svg>
  );
};

const ManagerChar = ({ mood = 'happy', size = 80 }) => {
  const c = mood === 'stressed' ? '#BA7517' : mood === 'happy' ? '#4ade80' : G;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Hair */}
      <path d="M26 26 Q28 14 40 13 Q52 14 54 26" fill={`${c}35`}/>
      {/* Face */}
      <circle cx="40" cy="28" r="14" fill={`${c}20`} stroke={c} strokeWidth="1.5"/>
      <circle cx="35" cy="26" r="2" fill={c}/>
      <circle cx="45" cy="26" r="2" fill={c}/>
      {mood === 'stressed' && <>
        <path d="M35 33 Q40 30 45 33" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M33 20 L36 22" stroke={c} strokeWidth="1.5"/>
        <path d="M47 20 L44 22" stroke={c} strokeWidth="1.5"/>
      </>}
      {mood === 'happy' && <path d="M33 33 Q40 40 47 33" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>}
      {mood === 'neutral' && <path d="M35 33 Q40 35 45 33" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>}
      {/* Shirt/Suit */}
      <path d="M26 42 Q29 38 40 38 Q51 38 54 42 L56 70 L24 70 Z" fill={`${c}15`} stroke={`${c}40`} strokeWidth="1"/>
      <path d="M40 42 L40 60" stroke={`${c}40`} strokeWidth="1" strokeDasharray="2 2"/>
      {/* Tie */}
      <path d="M38 42 L40 55 L42 42" fill={`${c}30`} stroke={c} strokeWidth="0.5"/>
      {/* Arms */}
      <path d="M26 45 Q16 52 20 62" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M54 45 Q64 52 60 62" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Tablet in hand */}
      {mood === 'happy' && <rect x="62" y="52" width="14" height="18" rx="2" fill={`${c}20`} stroke={c} strokeWidth="1"/>}
    </svg>
  );
};

const WaiterChar = ({ size = 80 }) => {
  const c = GL;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Hair */}
      <path d="M28 24 Q30 14 40 13 Q50 14 52 24" fill={`${c}40`}/>
      {/* Face */}
      <circle cx="40" cy="28" r="12" fill={`${c}20`} stroke={c} strokeWidth="1.5"/>
      <circle cx="36" cy="26" r="1.8" fill={c}/>
      <circle cx="44" cy="26" r="1.8" fill={c}/>
      <path d="M35 32 Q40 37 45 32" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Bow tie */}
      <path d="M36 41 L38 43 L36 45 L40 43 L44 45 L42 43 L44 41 L40 43 Z" fill={`${c}50`}/>
      {/* Uniform */}
      <path d="M28 42 Q30 38 40 38 Q50 38 52 42 L54 70 L26 70 Z" fill={`${c}15`} stroke={`${c}40`} strokeWidth="1"/>
      {/* Arms */}
      <path d="M28 44 Q18 50 16 58" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M52 44 Q62 50 64 58" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Tray */}
      <ellipse cx="16" cy="58" rx="10" ry="3" fill={`${c}25`} stroke={c} strokeWidth="1"/>
      <circle cx="14" cy="55" r="3" fill={`${c}40`} stroke={c} strokeWidth="0.5"/>
      <circle cx="18" cy="55" r="2.5" fill={`${c}30`} stroke={c} strokeWidth="0.5"/>
    </svg>
  );
};

// ── Floating speech bubble ──
const Bubble = ({ text, x = 0, y = 0, color = G, align = 'left', delay = 0, show = true }) => {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!show) { setVis(false); return; }
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [show, delay]);
  return (
    <div style={{
      position: 'absolute', left: x, top: y, zIndex: 20,
      opacity: vis ? 1 : 0, transform: vis ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(8px)',
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      maxWidth: 160, background: `${color}18`,
      border: `1px solid ${color}50`, borderRadius: 10,
      padding: '6px 10px', fontSize: 10.5, fontWeight: 700,
      color: color, lineHeight: 1.4, fontFamily: 'Inter, sans-serif',
      backdropFilter: 'blur(4px)'
    }}>
      {text}
    </div>
  );
};

// ── Animated phone mockup ──
const PhoneMock = ({ children, scale = 1 }) => (
  <div style={{
    width: 200 * scale, height: 380 * scale,
    background: '#0a0a0a', borderRadius: 28 * scale,
    padding: 6 * scale, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0
  }}>
    <div style={{
      width: '100%', height: '100%', background: DK,
      borderRadius: 22 * scale, overflow: 'hidden', position: 'relative'
    }}>
      {/* Notch */}
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 50, height: 6, background: '#111', borderRadius: 3, zIndex: 10 }}/>
      {children}
    </div>
  </div>
);

// ── Floating UI element ──
const FloatUI = ({ children, delay = 0, y = 0 }) => {
  const [in_, setIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIn(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      opacity: in_ ? 1 : 0, transform: in_ ? `translateY(${y}px)` : `translateY(${y + 16}px)`,
      transition: 'all 0.5s ease', display: 'contents'
    }}>{children}</div>
  );
};

// ── Pulse ring ──
const PulseRing = ({ color = G, size = 60 }) => (
  <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {[0, 1].map(i => (
      <div key={i} style={{
        position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
        border: `2px solid ${color}`,
        animation: `pulse-ring 1.8s ease-out ${i * 0.6}s infinite`,
        opacity: 0
      }}/>
    ))}
    <style>{`@keyframes pulse-ring { 0%{transform:scale(0.5);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }`}</style>
  </div>
);

// ── Stat card ──
const StatCard = ({ val, label, icon: Icon, color = G, delay = 0 }) => {
  const [in_, setIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIn(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      background: CD, border: `1px solid ${color}30`, borderRadius: 12,
      padding: '10px 12px', opacity: in_ ? 1 : 0,
      transform: in_ ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      borderTop: `2px solid ${color}`, textAlign: 'center'
    }}>
      <Icon size={14} color={color} style={{ marginBottom: 4 }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 18, color, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 9, color: `${GL}60`, marginTop: 3, fontWeight: 600 }}>{label}</div>
    </div>
  );
};

// ══════════════════════════════════════════════
// SCENE DEFINITIONS
// ══════════════════════════════════════════════

const scenes = [
  { id: 0, dur: 4200, label: 'OPEN' },
  { id: 1, dur: 5500, label: 'CUSTOMER SCANS' },
  { id: 2, dur: 5500, label: 'MENU + AR' },
  { id: 3, dur: 5000, label: 'ORDERING' },
  { id: 4, dur: 5000, label: 'LIVE TRACKING' },
  { id: 5, dur: 5500, label: 'WAITLIST' },
  { id: 6, dur: 5000, label: 'LOYALTY + BILL' },
  { id: 7, dur: 5000, label: 'KITCHEN TICKETS' },
  { id: 8, dur: 5000, label: 'VOICE + BATCH' },
  { id: 9, dur: 4800, label: 'WASTAGE LOG' },
  { id: 10, dur: 5500, label: 'FLOOR MAP' },
  { id: 11, dur: 5500, label: 'INVENTORY + MENU' },
  { id: 12, dur: 5500, label: 'AI INSIGHTS' },
  { id: 13, dur: 5000, label: 'HAPPY MANAGER' },
  { id: 14, dur: 5000, label: 'CLOSE' },
];
const TOTAL = scenes.length;

// ── Scene 0: Opening ──
function S0() {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep(s => Math.min(s + 1, 4)), 500); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}08 1px,transparent 1px),linear-gradient(90deg,${G}08 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      {/* Radial glow */}
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle,${G}20,transparent 70%)`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}/>
      {/* Logo icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 20, background: `${G}18`, border: `2px solid ${G}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, zIndex: 1,
        opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        <ChefHat size={38} color={G}/>
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 32, color: IV, letterSpacing: 4, zIndex: 1, opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease 0.1s' }}>PRATYEKSHA</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: `${GL}60`, letterSpacing: 3, marginTop: 6, zIndex: 1, opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}>VISUALIZE · ORDER · RELISH</div>
      {/* 3 module pills */}
      <div style={{ display: 'flex', gap: 8, marginTop: 22, zIndex: 1, opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.5s ease 0.3s' }}>
        {[['Customer App', QrCode], ['Kitchen Display', ChefHat], ['Operator Portal', Grid3x3]].map(([l, Icon]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${G}12`, border: `1px solid ${G}35`, borderRadius: 20, padding: '5px 10px' }}>
            <Icon size={10} color={G}/>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: G, fontWeight: 700 }}>{l}</span>
          </div>
        ))}
      </div>
      {/* Characters row */}
      <div style={{ display: 'flex', gap: 0, marginTop: 28, zIndex: 1, opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.6s ease 0.4s' }}>
        <CustomerChar mood="excited" size={60}/>
        <WaiterChar size={60}/>
        <ChefChar mood="cooking" size={60}/>
        <ManagerChar mood="happy" size={60}/>
      </div>
    </div>
  );
}

// ── Scene 1: Customer Scans ──
function S1() {
  const [step, setStep] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 600); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg,#1a1208,${DK})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 32, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      {/* Module label */}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 10, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.4s' }}>MODULE 01 · CUSTOMER MENU</div>

      {/* Big headline */}
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 22, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 8, zIndex: 1, opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s ease' }}>
        Scan. Browse. Order.<br/><span style={{ color: G, fontStyle: 'italic' }}>No app needed.</span>
      </div>

      {/* Central scene: table with customer + QR */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 10, zIndex: 1, position: 'relative' }}>
        {/* Customer character */}
        <div style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <CustomerChar mood="excited" size={72}/>
        </div>
        {/* Phone with QR */}
        <div style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'scale(1) rotate(-3deg)' : 'scale(0.7)', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <PhoneMock scale={0.78}>
            <div style={{ padding: 10, paddingTop: 20, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {/* QR visual */}
              <div style={{ width: 90, height: 90, background: '#fff', borderRadius: 8, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                {Array.from({length:49}).map((_,i) => (
                  <div key={i} style={{ background: [0,1,2,3,4,5,6,7,13,14,20,21,22,23,24,25,26,27,28,42,43,44,45,46,47,48].includes(i) ? '#000' : 'transparent', borderRadius: 1 }}/>
                ))}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: G, letterSpacing: 1.5 }}>SCAN TO VIEW MENU</div>
              {/* Scan animation */}
              {step >= 4 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${G}15`, border: `1px solid ${G}40`, borderRadius: 20, padding: '5px 12px', animation: 'fadeIn 0.4s ease' }}>
                  <CheckCircle2 size={12} color={G}/>
                  <span style={{ fontSize: 9, color: G, fontWeight: 800 }}>Menu Opening...</span>
                </div>
              )}
            </div>
          </PhoneMock>
        </div>
      </div>

      {/* Speech bubble */}
      <div style={{ marginTop: 12, zIndex: 1, opacity: step >= 4 ? 1 : 0, transform: step >= 4 ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.5s ease' }}>
        <div style={{ background: `${G}15`, border: `1px solid ${G}40`, borderRadius: 12, padding: '8px 16px', fontSize: 11, color: GL, fontWeight: 700, textAlign: 'center', maxWidth: 240 }}>
          "No app! Just scan — and the full menu's open!"
        </div>
      </div>

      {/* Benefit tags */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, zIndex: 1, flexWrap: 'wrap', justifyContent: 'center', opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        {['No Download', 'Opens in Browser', 'EN + मराठी'].map(t => (
          <div key={t} style={{ background: `${G}12`, border: `1px solid ${G}30`, borderRadius: 20, padding: '4px 10px', fontSize: 9, fontWeight: 700, color: G, fontFamily: 'JetBrains Mono, monospace' }}>{t}</div>
        ))}
      </div>
      <style>{`@keyframes fadeIn { from{opacity:0} to{opacity:1} }`}</style>
    </div>
  );
}

// ── Scene 2: Menu + Bestseller + AR ──
function S2() {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('en');
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 6) clearInterval(t); }, 550); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setLang(l => l === 'en' ? 'mr' : 'en'), 1600); return () => clearInterval(t); }, []);
  const dishes = lang === 'en'
    ? ['Tandoor Dum Chat', 'Cheese Chat', 'Samosa Chat']
    : ['तंदूर दम चाट', 'चीज चाट', 'समोसा चाट'];
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 8, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.4s' }}>BILINGUAL MENU + AR PREVIEW</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 12, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        See it in <span style={{ color: G, fontStyle: 'italic' }}>3D</span> before<br/>you order it.
      </div>
      {/* Phone with actual app UI */}
      <div style={{ zIndex: 1, opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'scale(1)' : 'scale(0.85)', transition: 'all 0.5s ease' }}>
        <PhoneMock scale={0.9}>
          <div style={{ padding: '16px 10px 10px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header matching real UI */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: G, fontFamily: 'Playfair Display, serif' }}>Jay Ambe Multi Fusion</div>
              <div style={{ background: `${G}20`, border: `1px solid ${G}40`, borderRadius: 12, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 8, color: G }}>⊕</span>
                <span style={{ fontSize: 8, color: GL, fontWeight: 700 }}>{lang === 'en' ? 'मराठी' : 'EN'}</span>
              </div>
            </div>
            {/* Dishes */}
            {dishes.map((d, i) => (
              <div key={d} style={{ background: '#1a1a1a', borderRadius: 8, padding: '8px 10px', marginBottom: 6, border: `1px solid ${G}20`, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 10, color: IV, marginBottom: 3 }}>{d}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{ background: `${G}20`, border: `1px solid ${G}40`, color: G, fontSize: 7, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>★ BESTSELLER</span>
                      {i === 0 && step >= 4 && <span style={{ background: `${G}20`, border: `1px solid ${G}40`, color: G, fontSize: 7, padding: '1px 5px', borderRadius: 4 }}>3D</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 11, color: G }}>₹{[75, 100, 70][i]}</div>
                </div>
              </div>
            ))}
          </div>
        </PhoneMock>
      </div>
      {/* Customer + AR bubble */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, zIndex: 1 }}>
        <div style={{ opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
          <CustomerChar mood="excited" size={56}/>
        </div>
        <div style={{ opacity: step >= 4 ? 1 : 0, transform: step >= 4 ? 'translateX(0)' : 'translateX(-10px)', transition: 'all 0.5s ease' }}>
          <div style={{ background: `${G}15`, border: `1px solid ${G}40`, borderRadius: 10, padding: '7px 12px', fontSize: 10, color: GL, fontWeight: 700 }}>
            "Wait — I can see the dish<br/>on my table?!"
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scene 3: Ordering Modal (matching real UI) ──
function S3() {
  const [step, setStep] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 700); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 8, zIndex: 1 }}>ORDER YOUR WAY</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: IV, textAlign: 'center', lineHeight: 1.25, marginBottom: 12, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        Custom instructions,<br/><span style={{ color: G, fontStyle: 'italic' }}>right from the table.</span>
      </div>
      {/* Phone showing order modal - matching real screenshot */}
      <div style={{ zIndex: 1, opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'scale(1)' : 'scale(0.9)', transition: 'all 0.5s ease' }}>
        <PhoneMock scale={0.88}>
          <div style={{ padding: '16px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 12, fontWeight: 900, color: G }}>Round Order</span>
              <span style={{ color: `${GL}60`, fontSize: 14 }}>×</span>
            </div>
            {/* Item */}
            <div style={{ fontWeight: 800, fontSize: 11, color: IV, marginBottom: 8 }}>Cheese Chat</div>
            {/* Qty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, background: '#1a1a1a', border: `1px solid ${G}40`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GL, fontSize: 14 }}>−</div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 14, color: IV }}>2</span>
              <div style={{ width: 26, height: 26, background: '#1a1a1a', border: `1px solid ${G}40`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GL, fontSize: 14 }}>+</div>
            </div>
            {/* Instructions input */}
            <div style={{ background: '#111', borderRadius: 8, padding: '7px 10px', marginBottom: 10, border: `1px solid ${G}20`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9 }}>📋</span>
              <span style={{ fontSize: 9.5, color: step >= 3 ? G : `${GL}40` }}>
                {step >= 3 ? 'Less spicy, no onion...' : 'Less spicy, no onion etc...'}
              </span>
            </div>
            {/* Service request section */}
            {step >= 4 && (
              <div style={{ background: `${G}10`, border: `1px solid ${G}25`, borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                <div style={{ fontSize: 8, color: `${GL}60`, fontWeight: 700, marginBottom: 5, letterSpacing: 1 }}>REQUEST SERVICE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {['Spoons', 'Forks', 'Plates', 'Tissues'].map(s => (
                    <div key={s} style={{ background: '#111', borderRadius: 6, padding: '4px 6px', fontSize: 8, color: GL, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <UtensilsCrossed size={8} color={G}/> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* ORDER NOW button */}
            <div style={{ marginTop: 'auto', background: GL, borderRadius: 10, padding: '9px', textAlign: 'center', fontWeight: 900, fontSize: 11, color: INK, letterSpacing: 1 }}>ORDER NOW</div>
          </div>
        </PhoneMock>
      </div>
      {/* Customer + waiter side */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8, zIndex: 1, opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <CustomerChar mood="happy" size={48}/>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 10, padding: '6px 10px', fontSize: 9.5, color: GL, fontWeight: 700 }}>
            "Ordered! Staff will know exactly how I want it."
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scene 4: Live Tracking (matching real UI) ──
function S4() {
  const [active, setActive] = useState(1);
  const [step, setStep] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 4) clearInterval(t); }, 600); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setActive(a => Math.min(a + 1, 3)), 1200); return () => clearInterval(t); }, []);
  const stages = [{ l: 'Order\nReceived', icon: Check }, { l: 'In the\nKitchen', icon: Flame }, { l: 'Ready to\nServe', icon: UtensilsCrossed }];
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 8, zIndex: 1 }}>ORDER CONFIRMED!</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 21, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 14, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        <span style={{ color: G, fontStyle: 'italic' }}>Heading to the Kitchen</span>
      </div>
      {/* Phone matching real order confirmed UI */}
      <div style={{ zIndex: 1, opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'scale(1)' : 'scale(0.9)', transition: 'all 0.5s ease' }}>
        <PhoneMock scale={0.88}>
          <div style={{ padding: '16px 10px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Chef robot icon */}
            <div style={{ width: 60, height: 60, borderRadius: 16, background: `${G}18`, border: `1px solid ${G}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <ChefHat size={28} color={G}/>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${G}80`, letterSpacing: 2, marginBottom: 4 }}>ORDER CONFIRMED!</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 14, color: IV, marginBottom: 4 }}>Heading to the Kitchen</div>
            {/* Progress bar */}
            <div style={{ width: '100%', background: '#111', borderRadius: 12, padding: '10px', marginBottom: 8, border: `1px solid ${G}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {stages.map((s, i) => (
                  <React.Fragment key={i}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= active ? G : '#222', border: `2px solid ${i <= active ? G : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', transition: 'all 0.4s' }}>
                        <s.icon size={12} color={i <= active ? INK : '#444'}/>
                      </div>
                      <div style={{ fontSize: 7.5, color: i <= active ? G : '#444', fontWeight: 700, whiteSpace: 'pre-line', textAlign: 'center' }}>{s.l}</div>
                    </div>
                    {i < stages.length - 1 && <div style={{ flex: 1, height: 2, background: i < active ? G : '#222', margin: '0 3px', marginBottom: 12, transition: 'background 0.5s' }}/>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            {/* Table info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: '100%' }}>
              <div style={{ background: '#111', borderRadius: 8, padding: '7px 10px', border: `1px solid ${G}20` }}>
                <div style={{ fontSize: 7, color: `${GL}50`, letterSpacing: 1, marginBottom: 2 }}>YOUR TABLE</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: G }}>7</div>
              </div>
              <div style={{ background: '#111', borderRadius: 8, padding: '7px 10px', border: `1px solid ${G}20` }}>
                <div style={{ fontSize: 7, color: `${GL}50`, letterSpacing: 1, marginBottom: 2 }}>ROUND</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: G }}>#0</div>
              </div>
            </div>
            <div style={{ marginTop: 'auto', background: GL, borderRadius: 10, padding: '8px', textAlign: 'center', fontWeight: 900, fontSize: 10, color: INK, letterSpacing: 1, width: '100%' }}>BACK TO MENU</div>
          </div>
        </PhoneMock>
      </div>
      {/* Characters */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, zIndex: 1, alignItems: 'flex-end', opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <CustomerChar mood="happy" size={50}/>
        <div style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 10, padding: '7px 12px', fontSize: 10, color: GL, fontWeight: 700, marginBottom: 8 }}>
          "I can see it in the kitchen already!"
        </div>
        <ChefChar mood="cooking" size={50}/>
      </div>
    </div>
  );
}

// ── Scene 5: Waitlist ──
function S5() {
  const [step, setStep] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 650); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg,#110d08,${DK})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 8, zIndex: 1 }}>WAITLIST · PICKUP · RESERVATION</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 12, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        Queue up <span style={{ color: G, fontStyle: 'italic' }}>digitally.</span><br/>Get notified. Arrive.
      </div>
      {/* Three cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '85%', zIndex: 1 }}>
        {[
          { icon: Clock3, t: 'Digital Waitlist', d: '#3 in queue · ~20 min · Notified when table ready', delay: 300 },
          { icon: ShoppingBag, t: 'Scheduled Pickup', d: 'Order ahead, pick your time slot, skip the line', delay: 500 },
          { icon: CalendarClock, t: 'Table Reservation', d: 'Date, party size, pre-order — arrive to your meal', delay: 700 },
        ].map((c, i) => (
          <div key={c.t} style={{
            background: CD, border: `1px solid ${G}25`, borderRadius: 12, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: step >= 2 + i * 0.5 ? 1 : 0,
            transform: step >= 2 + i * 0.5 ? 'translateX(0)' : 'translateX(-16px)',
            transition: 'all 0.5s ease'
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${G}15`, border: `1px solid ${G}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <c.icon size={15} color={G}/>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 11, color: IV, marginBottom: 2 }}>{c.t}</div>
              <div style={{ fontSize: 9.5, color: `${GL}70` }}>{c.d}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Push notification */}
      {step >= 5 && (
        <div style={{ marginTop: 10, width: '85%', background: `${G}15`, border: `1px solid ${G}50`, borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 1, animation: 'slideUp 0.4s ease' }}>
          <BellRing size={16} color={G}/>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: G }}>Table Ready!</div>
            <div style={{ fontSize: 8.5, color: `${GL}70` }}>Your table at Jay Ambe is ready · Table 5</div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, zIndex: 1, opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <CustomerChar mood="happy" size={50}/>
        <WaiterChar size={50}/>
      </div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ── Scene 6: Loyalty + Bill (matching real UI) ──
function S6() {
  const [step, setStep] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 650); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 6, zIndex: 1 }}>LOYALTY + GST INVOICE</div>
      {/* Loyal guest card - exact match to real UI */}
      <div style={{ width: '86%', background: '#111317', border: `1px solid ${G}25`, borderRadius: 14, overflow: 'hidden', zIndex: 1, opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.5s ease', marginBottom: 8 }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${G}10`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${G}15`, border: `1px solid ${G}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color={G}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 7.5, fontFamily: 'JetBrains Mono, monospace', color: `${GL}50`, letterSpacing: 1.5, marginBottom: 1 }}>LOYAL GUEST</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 14, color: IV }}>Good morning, Shree!</div>
          </div>
          <div style={{ background: `${G}12`, border: `1px solid ${G}20`, borderRadius: 8, padding: '4px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: IV, lineHeight: 1 }}>42×</div>
            <div style={{ fontSize: 6.5, color: `${GL}40`, letterSpacing: 0.8 }}>VISITS</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${G}08` }}>
          <div style={{ padding: '7px 10px', borderRight: `1px solid ${G}08` }}>
            <div style={{ fontSize: 7, color: `${GL}35`, letterSpacing: 0.8, marginBottom: 2 }}>TOP DISH</div>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: IV }}>Tandoor Dum Chat</div>
            <div style={{ fontSize: 8, color: `${GL}40` }}># Ordered 133×</div>
          </div>
          <div style={{ padding: '7px 10px' }}>
            <div style={{ fontSize: 7, color: `${GL}35`, letterSpacing: 0.8, marginBottom: 2 }}>LAST VISIT</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: IV }}>21 Jun</div>
          </div>
        </div>
        <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={11} color={G}/>
          <span style={{ fontSize: 8.5, color: `${GL}60` }}>You're a Loyal Guest · thanks for 42 visits</span>
        </div>
        <div style={{ margin: '0 8px 8px', background: GL, borderRadius: 8, padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <UtensilsCrossed size={12} color={INK}/>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 9, color: INK, letterSpacing: 0.8 }}>LET'S ORDER</span>
          <ArrowRight size={12} color={INK}/>
        </div>
      </div>
      {/* Mini bill */}
      {step >= 3 && (
        <div style={{ width: '86%', background: CD, border: `1px solid ${G}25`, borderRadius: 12, padding: '10px 12px', zIndex: 1, animation: 'slideUp 0.4s ease' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: G, letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>GST INVOICE</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: `${GL}70`, marginBottom: 3 }}><span>Tandoor Dum Chat ×2</span><span>₹150</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: `${GL}50`, marginBottom: 6 }}><span>CGST 2.5% + SGST 2.5%</span><span>₹15</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: G, paddingTop: 6, borderTop: `1px solid ${G}20` }}><span>TOTAL</span><span>₹165</span></div>
        </div>
      )}
      {/* Google + Instagram */}
      {step >= 4 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, zIndex: 1, animation: 'slideUp 0.4s ease' }}>
          <div style={{ background: `${G}12`, border: `1px solid ${G}30`, borderRadius: 20, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, color: G, fontWeight: 700 }}>
            <Star size={10} color={G}/> Rate on Google
          </div>
          <div style={{ background: `${G}12`, border: `1px solid ${G}30`, borderRadius: 20, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, color: G, fontWeight: 700 }}>
            ♥ Follow Instagram
          </div>
        </div>
      )}
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ── Scene 7: Kitchen Tickets ──
function S7() {
  const [step, setStep] = useState(0);
  const [sec, setSec] = useState(926);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 4) clearInterval(t); }, 700); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setSec(s => s + 1), 100); return () => clearInterval(t); }, []);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const urgent = sec > 900;
  const tickets = [
    { t: 'T-07', items: ['2× Paneer BM', '1× Dal Tadka ✓', '3× Butter Roti'], timer: fmt(sec), urg: urgent, source: 'DINE-IN' },
    { t: 'PARCEL', items: ['1× Chicken Biryani', '2× Raita'], timer: '07:15', urg: false, source: 'PARCEL' },
    { t: 'SWIGGY', items: ['1× Veg Thali', '2× Chai'], timer: '03:40', urg: false, source: 'SWIGGY', sw: true },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 6, zIndex: 1 }}>MODULE 02 · KITCHEN DISPLAY</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 10, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        No paper chits.<br/><span style={{ color: G, fontStyle: 'italic' }}>Every order, live.</span>
      </div>
      {/* Tickets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '88%', zIndex: 1 }}>
        {tickets.map((tk, i) => (
          <div key={tk.t} style={{
            background: CD, borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${tk.urg ? G : tk.sw ? '#fc801950' : `${G}20`}`,
            boxShadow: tk.urg ? `0 0 16px ${G}30` : 'none',
            opacity: step >= 2 + i * 0.5 ? 1 : 0,
            transform: step >= 2 + i * 0.5 ? 'translateX(0)' : 'translateX(20px)',
            transition: 'all 0.5s ease'
          }}>
            <div style={{ height: 3, background: tk.urg ? `linear-gradient(90deg,${GD},${G})` : tk.sw ? '#fc8019' : `${G}30` }}/>
            <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 13, color: tk.sw ? '#fc8019' : IV }}>{tk.t}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, color: tk.urg ? GL : G, background: `${tk.urg ? GL : G}15`, border: `1px solid ${tk.urg ? GL : G}30`, padding: '2px 7px', borderRadius: 5 }}>{tk.timer}{tk.urg ? ' !' : ''}</span>
            </div>
            <div style={{ padding: '0 10px 7px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tk.items.map((it, j) => (
                <span key={j} style={{ fontSize: 9, color: it.includes('✓') ? `${GL}30` : `${GL}70`, textDecoration: it.includes('✓') ? 'line-through' : 'none' }}>{it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Chef character */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 10, zIndex: 1, opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <ChefChar mood="cooking" size={56}/>
        <div style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 10, padding: '7px 12px', fontSize: 9.5, color: GL, fontWeight: 700, marginBottom: 8 }}>
          "3 orders at once. Zero confusion."
        </div>
      </div>
    </div>
  );
}

// ── Scene 8: Voice + Batch ──
function S8() {
  const [step, setStep] = useState(0);
  const [pulse, setPulse] = useState(false);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 700); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setPulse(p => !p), 800); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 8, zIndex: 1 }}>VOICE CONTROL + BATCH COOKING</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 12, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        Hands on the <span style={{ color: G, fontStyle: 'italic' }}>food.</span><br/>Not the screen.
      </div>
      {/* Voice control */}
      <div style={{ width: '86%', background: CD, border: `1px solid ${G}25`, borderRadius: 14, padding: '12px 14px', zIndex: 1, marginBottom: 10, opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            {pulse && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1.5px solid ${G}60`, animation: 'ping 1s ease infinite' }}/>}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${G}18`, border: `1px solid ${G}45`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={16} color={G}/>
            </div>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G, fontWeight: 700 }}>LISTENING...</span>
        </div>
        {[{ en: '"Complete table 7"', mr: '"टेबल सात तयार"' }, { en: '"Recall last"', mr: '"परत आण"' }].map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, opacity: step >= 3 + i * 0.5 ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G, background: `${G}12`, border: `1px solid ${G}25`, padding: '3px 8px', borderRadius: 6 }}>{c.en}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: `${GL}50`, padding: '3px 8px' }}>{c.mr}</span>
          </div>
        ))}
      </div>
      {/* Aggregate view */}
      {step >= 4 && (
        <div style={{ width: '86%', background: CD, border: `1px solid ${G}25`, borderRadius: 12, padding: '10px 14px', zIndex: 1, animation: 'slideUp 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Layers size={13} color={G}/>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: G, fontWeight: 700, letterSpacing: 0.5 }}>AGGREGATE VIEW — BATCH COOK</span>
          </div>
          {[['Butter Roti', '14×'], ['Paneer BM', '6×'], ['Masala Chai', '9×']].map(([n, q]) => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${G}08` }}>
              <span style={{ fontSize: 10, color: `${GL}70` }}>{n}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 11, color: G }}>{q}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, zIndex: 1, alignItems: 'flex-end', opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <ChefChar mood="happy" size={54}/>
        <div style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 10, padding: '7px 12px', fontSize: 9.5, color: GL, fontWeight: 700, marginBottom: 8 }}>
          "Fire 14 rotis at once — perfectly!"
        </div>
      </div>
      <style>{`@keyframes ping { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.5);opacity:0} } @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ── Scene 9: Wastage Log ──
function S9() {
  const [step, setStep] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 700); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 8, zIndex: 1 }}>WASTAGE INTELLIGENCE</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 12, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        Every loss, tracked<br/><span style={{ color: G, fontStyle: 'italic' }}>down to the rupee.</span>
      </div>
      {/* Wastage entry card */}
      <div style={{ width: '86%', background: CD, border: `1px solid #f8717130`, borderRadius: 14, padding: '12px 14px', zIndex: 1, marginBottom: 10, opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Trash2 size={13} color="#f87171"/>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 800, color: '#f87171', letterSpacing: 0.5 }}>NEW WASTAGE ENTRY</span>
        </div>
        {[['Item', 'Paneer · 0.5 kg'], ['Reason', 'Spoiled / Expired']].map(([l, v], i) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, opacity: step >= 3 + i * 0.5 ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <span style={{ fontSize: 9.5, color: `${GL}50` }}>{l}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: i === 1 ? '#f87171' : IV }}>{v}</span>
          </div>
        ))}
        {step >= 4 && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, animation: 'slideUp 0.4s ease' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#f87171' }}>COST LOSS</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 18, color: '#f87171' }}>₹185.00</span>
          </div>
        )}
      </div>
      {/* Monthly summary */}
      {step >= 4 && (
        <div style={{ width: '86%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, zIndex: 1, animation: 'slideUp 0.4s ease' }}>
          {[['₹2,340', 'Total Lost'], ['23', 'Entries'], ['1.8%', 'Of Revenue']].map(([v, l]) => (
            <div key={l} style={{ background: CD, border: `1px solid #f8717120`, borderRadius: 10, padding: '8px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 14, color: '#f87171', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8, color: `${GL}50`, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, zIndex: 1, alignItems: 'flex-end', opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <ChefChar mood="cooking" size={52}/>
        <div style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 10, padding: '7px 12px', fontSize: 9.5, color: GL, fontWeight: 700, marginBottom: 8 }}>
          "Now I know exactly where we're losing money."
        </div>
      </div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ── Scene 10: Floor Map ──
function S10() {
  const [step, setStep] = useState(0);
  const [blink, setBlink] = useState(false);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 700); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setBlink(b => !b), 700); return () => clearInterval(t); }, []);
  const tables = [
    { n:1,s:'free'},{n:2,s:'occ',m:'08:22'},{n:3,s:'hot',m:'14:55'},{n:4,s:'crit',m:'21:30'},
    {n:5,s:'occ',m:'05:10'},{n:6,s:'free'},{n:7,s:'occ',m:'11:33',bell:true},{n:8,s:'free'},
    {n:9,s:'hot',m:'17:42'},{n:10,s:'occ',m:'03:55'},{n:11,s:'free'},{n:12,s:'crit',m:'19:05'},
  ];
  const colors = { free:`${GL}08`, occ:`${G}25`, hot:`${G}50`, crit:`${GL}70` };
  const textC = { free:`${GL}30`, occ:GL, hot:IV, crit:INK };
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 6, zIndex: 1 }}>MODULE 03 · OPERATOR PORTAL</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 10, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        Live Floor Map.<br/><span style={{ color: G, fontStyle: 'italic' }}>One-Tap Billing.</span>
      </div>
      {/* Table grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '84%', zIndex: 1, marginBottom: 10, opacity: step >= 2 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        {tables.map(t => (
          <div key={t.n} style={{ borderRadius: 8, background: colors[t.s], border: `1px solid ${t.s === 'crit' ? blink ? GL : `${GL}50` : `${G}25`}`, padding: '6px 4px', textAlign: 'center', position: 'relative', transition: 'border-color 0.3s' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 11, color: textC[t.s] }}>T{t.n}</div>
            {t.m && <div style={{ fontSize: 7, color: t.s === 'crit' ? INK : `${textC[t.s]}80`, marginTop: 1 }}>{t.m}</div>}
            {t.bell && <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, background: G, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BellRing size={7} color={INK}/></div>}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', zIndex: 1, marginBottom: 8, opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        {[['free','Free'],['occ','Occupied'],['hot','Warm'],['crit','Critical']].map(([s,l]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[s], border: `1px solid ${G}30` }}/>
            <span style={{ color: `${GL}60` }}>{l}</span>
          </div>
        ))}
      </div>
      {/* Manager character */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', zIndex: 1, opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <ManagerChar mood="neutral" size={56}/>
        <div style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 10, padding: '7px 12px', fontSize: 9.5, color: GL, fontWeight: 700, marginBottom: 8 }}>
          "Table 4 is critical —<br/>and table 7 rang the bell."
        </div>
      </div>
    </div>
  );
}

// ── Scene 11: Inventory + Menu ──
function S11() {
  const [step, setStep] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 700); return () => clearInterval(t); }, []);
  const items = [
    { n: 'Paneer', pct: 75, s: 'ok' },
    { n: 'Tomatoes', pct: 22, s: 'lo' },
    { n: 'Fresh Cream', pct: 8, s: 'cr' },
    { n: 'Basmati Rice', pct: 90, s: 'ok' },
  ];
  const sC = { ok: G, lo: '#BA7517', cr: '#f87171' };
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 6, zIndex: 1 }}>INVENTORY · RECIPES · MENU CONTROL</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 20, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 10, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        Real cost.<br/><span style={{ color: G, fontStyle: 'italic' }}>Real margin. Always.</span>
      </div>
      {/* Inventory */}
      <div style={{ width: '86%', background: CD, border: `1px solid ${G}25`, borderRadius: 14, padding: '12px 14px', zIndex: 1, marginBottom: 8, opacity: step >= 2 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: `${GL}50`, letterSpacing: 1, marginBottom: 8 }}>LIVE STOCK LEVELS</div>
        {items.map((it, i) => (
          <div key={it.n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, opacity: step >= 2 + i * 0.3 ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <span style={{ width: 68, fontSize: 9.5, color: `${GL}75` }}>{it.n}</span>
            <div style={{ flex: 1, height: 5, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${it.pct}%`, background: sC[it.s], borderRadius: 3, transition: 'width 1s ease' }}/>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 700, color: sC[it.s], width: 20 }}>{it.s === 'ok' ? '●' : it.s === 'lo' ? '▲' : '!'}</span>
          </div>
        ))}
      </div>
      {/* Recipe costing + Menu toggle */}
      <div style={{ display: 'flex', gap: 7, width: '86%', zIndex: 1, opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <div style={{ flex: 1, background: CD, border: `1px solid ${G}25`, borderRadius: 12, padding: '10px 12px' }}>
          <ChefHat size={13} color={G} style={{ marginBottom: 5 }}/>
          <div style={{ fontSize: 9, fontWeight: 800, color: IV, marginBottom: 3 }}>Recipe Cost</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 15, color: G }}>₹46</div>
          <div style={{ fontSize: 8, color: `${GL}50` }}>per serving · WAC</div>
        </div>
        <div style={{ flex: 1, background: CD, border: `1px solid ${G}25`, borderRadius: 12, padding: '10px 12px' }}>
          <Grid3x3 size={13} color={G} style={{ marginBottom: 5 }}/>
          <div style={{ fontSize: 9, fontWeight: 800, color: IV, marginBottom: 3 }}>Menu Toggle</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 13, color: '#4ade80' }}>LIVE</div>
          <div style={{ fontSize: 8, color: `${GL}50` }}>all devices instantly</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, zIndex: 1, alignItems: 'flex-end', opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <ManagerChar mood="neutral" size={52}/>
        <div style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 10, padding: '7px 12px', fontSize: 9.5, color: GL, fontWeight: 700, marginBottom: 8 }}>
          "Tomatoes low — hide those dishes now."
        </div>
      </div>
    </div>
  );
}

// ── Scene 12: 60 AI Recommendations ──
function S12() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 700); return () => clearInterval(t); }, []);
  useEffect(() => { let s = 0; const t = setInterval(() => { s += 2; setScore(Math.min(s, 82)); if (s >= 82) clearInterval(t); }, 30); return () => clearInterval(t); }, []);
  const recs = [
    { t: 'Wastage on Paneer is 3.2% — review portions', icon: Trash2, c: '#f87171', p: 1 },
    { t: 'GSTR-1 filing due in 4 days — export now', icon: FileText, c: G, p: 1 },
    { t: 'Table 7 has slowest avg dwell time', icon: Clock3, c: '#BA7517', p: 2 },
    { t: '"Cheese Chat" sells 8× — it\'s underpriced', icon: TrendingUp, c: '#4ade80', p: 3 },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 22, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}50`, letterSpacing: 2.5, marginBottom: 6, zIndex: 1 }}>60 AI BUSINESS RECOMMENDATIONS</div>
      {/* Health score dial */}
      <div style={{ zIndex: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', background: `conic-gradient(${G} ${score * 3.6}deg, #1a1a1a 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 18, color: G, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 6, color: `${GL}50`, letterSpacing: 0.5 }}>HEALTH</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 17, color: IV, lineHeight: 1.2 }}>Like a business<br/><span style={{ color: G, fontStyle: 'italic' }}>analyst, 24/7.</span></div>
        </div>
      </div>
      {/* Recommendation cards */}
      <div style={{ width: '86%', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1 }}>
        {recs.map((r, i) => (
          <div key={r.t} style={{
            background: CD, border: `1px solid ${r.c}30`, borderLeft: `3px solid ${r.c}`,
            borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
            opacity: step >= 2 + i * 0.4 ? 1 : 0,
            transform: step >= 2 + i * 0.4 ? 'translateX(0)' : 'translateX(-12px)',
            transition: 'all 0.5s ease'
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `${r.c}15`, border: `1px solid ${r.c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <r.icon size={11} color={r.c}/>
            </div>
            <span style={{ fontSize: 9.5, color: `${GL}80`, fontWeight: 600, flex: 1 }}>{r.t}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5, color: r.c, background: `${r.c}12`, border: `1px solid ${r.c}25`, padding: '2px 5px', borderRadius: 4 }}>P{r.p}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, zIndex: 1, alignItems: 'flex-end', opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <ManagerChar mood="neutral" size={50}/>
        <div style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 10, padding: '7px 12px', fontSize: 9.5, color: GL, fontWeight: 700, marginBottom: 6 }}>
          "It tells me what to fix before it becomes a problem."
        </div>
      </div>
    </div>
  );
}

// ── Scene 13: Happy Manager ──
function S13() {
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 650); return () => clearInterval(t); }, []);
  useEffect(() => { let c = 0; const t = setInterval(() => { c++; setCount(c); if (c >= 8) clearInterval(t); }, 200); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg,#0a1205,${DK})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      {/* Glow behind manager */}
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,#4ade8020,transparent 70%)`, top: '35%', left: '50%', transform: 'translate(-50%,-50%)' }}/>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `#4ade8070`, letterSpacing: 2.5, marginBottom: 6, zIndex: 1 }}>STRESS-FREE · GROWTH-READY</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 21, color: IV, textAlign: 'center', lineHeight: 1.2, marginBottom: 10, zIndex: 1, opacity: step >= 1 ? 1 : 0, transition: 'all 0.5s ease' }}>
        Close in <span style={{ color: '#4ade80', fontStyle: 'italic' }}>30 seconds.</span><br/>Grow every month.
      </div>
      {/* Big manager */}
      <div style={{ zIndex: 1, opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'scale(1)' : 'scale(0.8)', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)', marginBottom: 10 }}>
        <ManagerChar mood="happy" size={90}/>
      </div>
      {/* Floating win tags */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '86%', zIndex: 1 }}>
        {[
          { icon: Zap, t: 'Bill settled in 1 tap — table free in 30 sec', c: '#4ade80', delay: 2 },
          { icon: TrendingUp, t: 'Revenue up 23% · menu optimized by AI', c: G, delay: 3 },
          { icon: Heart, t: '42× returning loyal customers this month', c: '#f472b6', delay: 4 },
          { icon: Brain, t: '60 smart alerts — never miss a deadline', c: GL, delay: 5 },
        ].map((r, i) => (
          <div key={r.t} style={{
            background: `${r.c}10`, border: `1px solid ${r.c}35`, borderRadius: 10,
            padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
            opacity: step >= r.delay ? 1 : 0,
            transform: step >= r.delay ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.5s ease'
          }}>
            <r.icon size={13} color={r.c}/>
            <span style={{ fontSize: 9.5, color: `${GL}80`, fontWeight: 700 }}>{r.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scene 14: Closing ──
function S14() {
  const [step, setStep] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setStep(i); if (i >= 5) clearInterval(t); }, 600); return () => clearInterval(t); }, []);
  return (
    <div style={{ width: '100%', height: '100%', background: DK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle,${G}15,transparent 70%)`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}/>
      {/* All characters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, zIndex: 1, opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'translateY(0)' : 'translateY(14px)', transition: 'all 0.6s ease' }}>
        <CustomerChar mood="excited" size={58}/>
        <WaiterChar size={58}/>
        <ChefChar mood="happy" size={58}/>
        <ManagerChar mood="happy" size={58}/>
      </div>
      <div style={{ width: 70, height: 70, borderRadius: 18, background: `${G}18`, border: `2px solid ${G}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, zIndex: 1, opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'scale(1)' : 'scale(0.5)', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <ChefHat size={32} color={G}/>
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 26, color: IV, letterSpacing: 3, zIndex: 1, opacity: step >= 2 ? 1 : 0, transition: 'all 0.5s ease' }}>PRATYEKSHA</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: `${GL}55`, letterSpacing: 2.5, marginTop: 6, zIndex: 1, opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }}>VISUALIZE · ORDER · RELISH</div>
      <div style={{ marginTop: 16, background: `${G}15`, border: `1px solid ${G}40`, borderRadius: 12, padding: '10px 18px', zIndex: 1, textAlign: 'center', opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: G, fontWeight: 800, marginBottom: 4 }}>Book your free demo</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: `${GL}70` }}>Shreeom · 8767622654 / 8605015294</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, color: `${GL}55`, marginTop: 2 }}>hello.pratyeksha@gmail.com</div>
      </div>
      {/* Three module summary */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, zIndex: 1, opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        {[['QrCode', 'Customer App', QrCode], ['ChefHat', 'KDS Kitchen', ChefHat], ['Grid3x3', 'Operator Portal', Grid3x3]].map(([k, l, Icon]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: `${G}10`, border: `1px solid ${G}25`, borderRadius: 10, padding: '7px 10px', minWidth: 75 }}>
            <Icon size={14} color={G}/>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5, color: G, textAlign: 'center', fontWeight: 700 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCENE_COMPS = [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14];

// ══════════════════════════════════════════════
// MAIN REEL PLAYER
// ══════════════════════════════════════════════
export default function PratyekshaReel() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const goTo = useCallback((i) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIdx(((i % TOTAL) + TOTAL) % TOTAL);
    setProgress(0);
    startRef.current = null;
  }, []);

  useEffect(() => {
    if (!playing) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const dur = scenes[idx].dur;
    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const p = Math.min(100, ((now - startRef.current) / dur) * 100);
      setProgress(p);
      if (p >= 100) { startRef.current = null; setIdx(i => (i + 1) % TOTAL); }
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [idx, playing]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight') goTo(idx + 1);
      if (e.key === 'ArrowLeft') goTo(idx - 1);
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [idx, goTo]);

  const Scene = SCENE_COMPS[idx];

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* 9:16 container */}
      <div style={{
        width: 'min(100vh * 9/16, 100vw)',
        height: 'min(100vw * 16/9, 100vh)',
        aspectRatio: '9/16',
        maxWidth: '420px',
        maxHeight: '746px',
        position: 'relative',
        background: DK,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 80px rgba(0,0,0,0.8)'
      }}>
        {/* Progress bars */}
        <div style={{ display: 'flex', gap: 2, padding: '10px 10px 6px', flexShrink: 0, zIndex: 100, position: 'absolute', top: 0, left: 0, right: 0 }}>
          {scenes.map((s, i) => (
            <div key={s.id} onClick={() => goTo(i)} style={{ flex: 1, height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{
                height: '100%', background: G, transformOrigin: 'left',
                transform: `scaleX(${i < idx ? 1 : i === idx ? progress / 100 : 0})`,
                transition: i === idx ? 'none' : 'transform .1s'
              }}/>
            </div>
          ))}
        </div>

        {/* Scene area */}
        <div style={{ flex: 1, position: 'relative', marginTop: 28 }}>
          <Scene key={idx}/>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 0 12px', flexShrink: 0, background: '#000', zIndex: 100, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <button onClick={() => goTo(0)} style={btn}><RotateCcw size={13} color={`${GL}80`}/></button>
          <button onClick={() => goTo(idx - 1)} style={btn}><ChevronLeft size={16} color={`${GL}90`}/></button>
          <button onClick={() => setPlaying(p => !p)} style={{ ...btn, width: 40, height: 40, background: G, border: 'none' }}>
            {playing ? <Pause size={17} color={INK}/> : <Play size={17} color={INK}/>}
          </button>
          <button onClick={() => goTo(idx + 1)} style={btn}><ChevronRight size={16} color={`${GL}90`}/></button>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: `${GL}40` }}>{String(idx+1).padStart(2,'0')}/{String(TOTAL).padStart(2,'0')}</span>
        </div>
      </div>
    </div>
  );
}

const btn = {
  width: 32, height: 32, borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};