import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode, ChefHat, Mic, Layers, Truck, Trash2, Grid3x3, Wallet,
  TrendingUp, Users, Brain, Play, Pause, RotateCcw, ChevronLeft,
  ChevronRight, CheckCircle2, Flame, Package, BellRing, Receipt,
  Star, Clock3, CalendarClock, Award, Sparkles, UtensilsCrossed,
  ShoppingBag, FileText, Zap, ArrowRight, Check, Heart,
  Volume2, Eye, EyeOff, Pencil, BarChart3, AlertTriangle,
  IndianRupee, RefreshCw, Layers2, Timer, MessageSquare,
  TrendingDown, Activity, Coffee, Smartphone
} from 'lucide-react';

const G   = '#C9A84C';
const GL  = '#D3BFA2';
const GD  = '#8A704D';
const INK = '#0C0C0C';
const IV  = '#FAF6EC';
const DK  = '#0D0E11';
const CD  = '#13151A';
const C2  = '#1A1C23';

// ─────────────────────────── CHARACTERS ───────────────────────────
const CustomerChar = ({ mood = 'happy', size = 80 }) => {
  const c = mood === 'excited' ? '#4ade80' : mood === 'confused' ? '#BA7517' : G;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M26 22 Q28 12 40 11 Q52 12 54 22" fill={`${c}40`}/>
      <circle cx="40" cy="26" r="14" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
      <circle cx="36" cy="24" r="2" fill={c}/><circle cx="44" cy="24" r="2" fill={c}/>
      {mood==='happy'   && <path d="M34 30 Q40 35 46 30" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>}
      {mood==='excited' && <path d="M33 29 Q40 37 47 29" stroke={c} strokeWidth="2"   strokeLinecap="round" fill="none"/>}
      {mood==='confused'&& <path d="M35 31 Q40 29 45 31" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>}
      <path d="M26 40 Q28 36 40 36 Q52 36 54 40 L56 64 L24 64 Z" fill={`${c}14`} stroke={`${c}35`} strokeWidth="1"/>
      <path d="M26 42 Q18 50 20 58" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M54 42 Q62 50 60 58" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
      {mood==='excited' && <rect x="61" y="50" width="12" height="18" rx="2" fill={`${c}20`} stroke={c} strokeWidth="1"/>}
    </svg>
  );
};

const ChefChar = ({ mood = 'cooking', size = 80 }) => {
  const c = G;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <ellipse cx="40" cy="16" rx="14" ry="5" fill={`${c}28`} stroke={c} strokeWidth="1"/>
      <rect x="28" y="10" width="24" height="14" rx="3" fill={`${c}18`} stroke={c} strokeWidth="1"/>
      <ellipse cx="40" cy="8" rx="10" ry="8" fill={`${c}28`} stroke={c} strokeWidth="1"/>
      <circle cx="40" cy="30" r="12" fill={`${c}18`} stroke={c} strokeWidth="1.5"/>
      <circle cx="36" cy="28" r="1.8" fill={c}/><circle cx="44" cy="28" r="1.8" fill={c}/>
      {mood==='cooking' && <path d="M35 34 Q40 38 45 34" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>}
      {mood==='happy'   && <path d="M33 34 Q40 41 47 34" stroke={c} strokeWidth="2"   strokeLinecap="round" fill="none"/>}
      {mood==='speak'   && <ellipse cx="40" cy="35" rx="5" ry="3" fill={`${c}25`} stroke={c} strokeWidth="1"/>}
      <path d="M28 42 L52 42 L54 70 L26 70 Z" fill={`${c}08`} stroke={`${c}30`} strokeWidth="1"/>
      <rect x="34" y="42" width="12" height="16" rx="2" fill={`${c}18`} stroke={`${c}35`} strokeWidth="1"/>
      <path d="M28 45 Q16 52 18 62" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M52 45 Q64 52 62 62" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="66" cy="65" r="6" fill={`${c}22`} stroke={c} strokeWidth="1"/>
      <line x1="62" y1="65" x2="72" y2="65" stroke={c} strokeWidth="1.5"/>
    </svg>
  );
};

const ManagerChar = ({ mood = 'happy', size = 80 }) => {
  const c = mood==='stressed' ? '#BA7517' : mood==='happy' ? '#4ade80' : G;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M26 26 Q28 14 40 13 Q52 14 54 26" fill={`${c}32`}/>
      <circle cx="40" cy="28" r="14" fill={`${c}18`} stroke={c} strokeWidth="1.5"/>
      <circle cx="35" cy="26" r="2" fill={c}/><circle cx="45" cy="26" r="2" fill={c}/>
      {mood==='stressed' && <><path d="M35 33 Q40 30 45 33" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M33 20 L36 22" stroke={c} strokeWidth="1.5"/><path d="M47 20 L44 22" stroke={c} strokeWidth="1.5"/></>}
      {mood==='happy'    && <path d="M33 33 Q40 41 47 33" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>}
      {mood==='neutral'  && <path d="M35 33 Q40 35 45 33" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>}
      <path d="M26 42 Q29 38 40 38 Q51 38 54 42 L56 70 L24 70 Z" fill={`${c}13`} stroke={`${c}35`} strokeWidth="1"/>
      <path d="M40 42 L40 60" stroke={`${c}35`} strokeWidth="1" strokeDasharray="2 2"/>
      <path d="M38 42 L40 55 L42 42" fill={`${c}28`} stroke={c} strokeWidth="0.5"/>
      <path d="M26 45 Q16 52 20 62" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M54 45 Q64 52 60 62" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {mood==='happy' && <rect x="62" y="52" width="14" height="18" rx="2" fill={`${c}18`} stroke={c} strokeWidth="1"/>}
    </svg>
  );
};

const WaiterChar = ({ size = 80 }) => {
  const c = GL;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M28 24 Q30 14 40 13 Q50 14 52 24" fill={`${c}38`}/>
      <circle cx="40" cy="28" r="12" fill={`${c}18`} stroke={c} strokeWidth="1.5"/>
      <circle cx="36" cy="26" r="1.8" fill={c}/><circle cx="44" cy="26" r="1.8" fill={c}/>
      <path d="M35 32 Q40 37 45 32" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M36 41 L38 43 L36 45 L40 43 L44 45 L42 43 L44 41 L40 43 Z" fill={`${c}45`}/>
      <path d="M28 42 Q30 38 40 38 Q50 38 52 42 L54 70 L26 70 Z" fill={`${c}13`} stroke={`${c}35`} strokeWidth="1"/>
      <path d="M28 44 Q18 50 16 58" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M52 44 Q62 50 64 58" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="16" cy="58" rx="10" ry="3" fill={`${c}22`} stroke={c} strokeWidth="1"/>
      <circle cx="14" cy="55" r="3" fill={`${c}38`} stroke={c} strokeWidth="0.5"/>
      <circle cx="18" cy="55" r="2.5" fill={`${c}28`} stroke={c} strokeWidth="0.5"/>
    </svg>
  );
};

// ─────────────────────────── SHARED UI ───────────────────────────
const PhoneMock = ({ children, scale = 1 }) => (
  <div style={{ width: 200*scale, height: 380*scale, background: '#080808', borderRadius: 28*scale, padding: 6*scale, boxShadow: `0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)`, flexShrink: 0 }}>
    <div style={{ width: '100%', height: '100%', background: '#111', borderRadius: 22*scale, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 48, height: 5, background: '#1a1a1a', borderRadius: 3, zIndex: 10 }}/>
      {children}
    </div>
  </div>
);

const Tag = ({ children, color = G }) => (
  <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:`${color}12`, border:`1px solid ${color}30`, borderRadius:20, padding:'4px 10px', fontSize:8.5, fontWeight:700, color, fontFamily:'JetBrains Mono, monospace', letterSpacing:0.5 }}>{children}</div>
);

const SpeechBubble = ({ text, color = G, show = true, delay = 0, style = {} }) => {
  const [vis, setVis] = useState(false);
  useEffect(() => { if (!show) { setVis(false); return; } const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [show, delay]);
  return (
    <div style={{ background:`${color}16`, border:`1px solid ${color}45`, borderRadius:12, padding:'7px 12px', fontSize:10, color, fontWeight:700, lineHeight:1.45, opacity: vis?1:0, transform: vis?'scale(1) translateY(0)':'scale(0.85) translateY(6px)', transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)', ...style }}>{text}</div>
  );
};

// ─────────────────────────── SCENES ───────────────────────────

// S0 — OPEN
function S0() {
  const [s, setS] = useState(0);
  useEffect(() => { const t = setInterval(() => setS(x => Math.min(x+1, 5)), 480); return () => clearInterval(t); }, []);
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}07 1px,transparent 1px),linear-gradient(90deg,${G}07 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle,${G}18,transparent 70%)`, top:'45%', left:'50%', transform:'translate(-50%,-50%)' }}/>

      <div style={{ width:82, height:82, borderRadius:22, background:`${G}16`, border:`2px solid ${G}55`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, zIndex:1, opacity:s>=1?1:0, transform:s>=1?'scale(1)':'scale(0.4)', transition:'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <ChefHat size={40} color={G}/>
      </div>

      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:34, color:IV, letterSpacing:5, zIndex:1, opacity:s>=2?1:0, transform:s>=2?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease 0.1s' }}>PRATYEKSHA</div>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8.5, color:`${GL}55`, letterSpacing:3.5, marginTop:5, zIndex:1, opacity:s>=3?1:0, transition:'opacity 0.5s ease 0.2s' }}>VISUALIZE · ORDER · RELISH</div>

      <div style={{ fontFamily:'Playfair Display, serif', fontSize:13, color:`${GL}80`, fontStyle:'italic', marginTop:12, zIndex:1, textAlign:'center', maxWidth:240, lineHeight:1.5, opacity:s>=3?1:0, transition:'opacity 0.6s ease 0.3s' }}>
        "The complete restaurant & Cafe operating<br/>system — customer to kitchen to close."
      </div>

      <div style={{ display:'flex', gap:7, marginTop:18, zIndex:1, opacity:s>=4?1:0, transition:'opacity 0.5s ease 0.35s' }}>
        {[['Customer App', QrCode], ['KDS Kitchen', ChefHat], ['Operator Portal', Grid3x3]].map(([l, Icon]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:5, background:`${G}10`, border:`1px solid ${G}30`, borderRadius:20, padding:'5px 10px' }}>
            <Icon size={10} color={G}/><span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:G, fontWeight:700 }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:2, marginTop:24, zIndex:1, opacity:s>=5?1:0, transition:'opacity 0.6s ease 0.45s' }}>
        <CustomerChar mood="excited" size={58}/>
        <WaiterChar size={58}/>
        <ChefChar mood="cooking" size={58}/>
        <ManagerChar mood="happy" size={58}/>
      </div>

      <div style={{ marginTop:10, zIndex:1, opacity:s>=5?1:0, transition:'opacity 0.5s ease 0.5s', display:'flex', gap:6 }}>
        {['Zero paper', 'Zero confusion', '100% automated'].map(t => (
          <div key={t} style={{ display:'flex', alignItems:'center', gap:4, fontSize:8.5, color:`${GL}60` }}>
            <CheckCircle2 size={10} color={G}/>{t}
          </div>
        ))}
      </div>
    </div>
  );
}

// S1 — CUSTOMER SCANS
function S1() {
  const [s, setS] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=5) clearInterval(t); }, 600); return () => clearInterval(t); }, []);
  return (
    <div style={{ width:'100%', height:'100%', background:`linear-gradient(160deg,#1a1208,${DK})`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:28, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:8, zIndex:1, opacity:s>=1?1:0, transition:'opacity 0.4s' }}>MODULE 01 · CUSTOMER APP</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:22, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:6, zIndex:1, opacity:s>=1?1:0, transform:s>=1?'translateY(0)':'translateY(10px)', transition:'all 0.5s ease' }}>
        Scan. Browse. Order.<br/><span style={{ color:G, fontStyle:'italic' }}>No app. No print. Ever.</span>
      </div>

      <div style={{ display:'flex', alignItems:'flex-end', gap:12, marginTop:8, zIndex:1 }}>
        <div style={{ opacity:s>=2?1:0, transform:s>=2?'translateY(0)':'translateY(16px)', transition:'all 0.5s ease' }}>
          <CustomerChar mood="excited" size={68}/>
        </div>
        <div style={{ opacity:s>=3?1:0, transform:s>=3?'scale(1) rotate(-3deg)':'scale(0.7)', transition:'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <PhoneMock scale={0.76}>
            <div style={{ padding:10, paddingTop:20, height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'#0d0d0d' }}>
              <div style={{ width:88, height:88, background:'#fff', borderRadius:8, padding:8, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                {Array.from({length:49}).map((_,i) => (<div key={i} style={{ background:[0,1,2,3,4,5,6,7,13,14,20,21,22,23,24,25,26,27,28,42,43,44,45,46,47,48].includes(i)?'#000':'transparent', borderRadius:1 }}/>))}
              </div>
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7.5, color:G, letterSpacing:1.5 }}>SCAN TO VIEW MENU</div>
              {s>=4 && <div style={{ display:'flex', alignItems:'center', gap:5, background:`${G}15`, border:`1px solid ${G}40`, borderRadius:20, padding:'4px 10px' }}><CheckCircle2 size={11} color={G}/><span style={{ fontSize:8.5, color:G, fontWeight:800 }}>Menu Opening…</span></div>}
            </div>
          </PhoneMock>
        </div>
      </div>

      <SpeechBubble text='"No app download. No printed menu. Just scan my table QR — full menu opens instantly!"' color={G} show={s>=4} delay={0} style={{ marginTop:10, maxWidth:260 }}/>

      <div style={{ display:'flex', gap:6, marginTop:10, zIndex:1, flexWrap:'wrap', justifyContent:'center', opacity:s>=5?1:0, transition:'opacity 0.5s ease' }}>
        {['No App Download', 'Any Phone Browser', 'EN + मराठी', 'Live Stock'].map(t => <Tag key={t} color={G}>{t}</Tag>)}
      </div>
    </div>
  );
}

// S2 — MENU: BILINGUAL + BADGES + AR
function S2() {
  const [s, setS] = useState(0);
  const [lang, setLang] = useState('en');
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=6) clearInterval(t); }, 540); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setLang(l => l==='en'?'mr':'en'), 1700); return () => clearInterval(t); }, []);
  const dishes = lang==='en'
    ? [{ n:'Tandoor Dum Chat', p:75 },{ n:'Cheese Chat', p:100 },{ n:'Samosa Chat', p:70 }]
    : [{ n:'तंदूर दम चाट', p:75 },{ n:'चीज चाट', p:100 },{ n:'समोसा चाट', p:70 }];
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:26, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:6, zIndex:1 }}>BILINGUAL MENU · BADGES · AR PREVIEW</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:20, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:10, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        See it in <span style={{ color:G, fontStyle:'italic' }}>3D</span> before<br/>you order it.
      </div>

      <div style={{ zIndex:1, opacity:s>=2?1:0, transform:s>=2?'scale(1)':'scale(0.85)', transition:'all 0.5s ease' }}>
        <PhoneMock scale={0.88}>
          <div style={{ padding:'14px 9px 9px', display:'flex', flexDirection:'column', height:'100%', background:'#0d0e11' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
              <div style={{ fontSize:8.5, fontWeight:900, color:G, fontFamily:'Playfair Display, serif' }}>Jay Ambe Multi Fusion</div>
              <div style={{ background:`${G}18`, border:`1px solid ${G}38`, borderRadius:12, padding:'2px 7px', display:'flex', alignItems:'center', gap:3 }}>
                <span style={{ fontSize:7.5, color:G }}>⊕</span>
                <span style={{ fontSize:7.5, color:GL, fontWeight:700 }}>{lang==='en'?'मराठी':'EN'}</span>
              </div>
            </div>
            {/* Category tabs */}
            <div style={{ display:'flex', gap:4, marginBottom:7, overflowX:'auto' }}>
              {['ALL','CHAAT SPECIAL','PURI'].map((c,i) => (
                <div key={c} style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7, fontWeight:700, color:i===0?G:`${GL}45`, borderBottom:i===0?`1.5px solid ${G}`:'none', paddingBottom:3, whiteSpace:'nowrap' }}>{c}</div>
              ))}
            </div>
            {dishes.map((d, i) => (
              <div key={d.n} style={{ background:'#1a1a1a', borderRadius:8, padding:'7px 9px', marginBottom:5, border:`1px solid ${G}18`, position:'relative' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:9.5, color:IV, marginBottom:3 }}>{d.n}</div>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                      <span style={{ background:`${G}18`, border:`1px solid ${G}38`, color:G, fontSize:6.5, fontWeight:800, padding:'1px 5px', borderRadius:4 }}>★ BESTSELLER</span>
                      <span style={{ background:'rgba(100,200,100,0.1)', border:'1px solid rgba(100,200,100,0.3)', color:'#7abf4c', fontSize:6.5, padding:'1px 5px', borderRadius:4 }}>VEG</span>
                      {i===0 && s>=4 && <span style={{ background:`${G}18`, border:`1px solid ${G}35`, color:G, fontSize:6.5, padding:'1px 5px', borderRadius:4 }}>3D AR</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize:10.5, color:G }}>₹{d.p}</div>
                </div>
              </div>
            ))}
          </div>
        </PhoneMock>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:9, zIndex:1 }}>
        <div style={{ opacity:s>=3?1:0, transition:'opacity 0.5s ease' }}><CustomerChar mood="excited" size={52}/></div>
        <SpeechBubble text='"I can see the dish on my table in 3D — before I even order it!"' color={G} show={s>=4} style={{ maxWidth:190 }}/>
      </div>
    </div>
  );
}

// S3 — ORDER + INSTRUCTIONS + SERVICE
function S3() {
  const [s, setS] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=6) clearInterval(t); }, 650); return () => clearInterval(t); }, []);
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:24, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:6, zIndex:1 }}>ORDERING · INSTRUCTIONS · SERVICE REQUESTS</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:20, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:10, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        Custom <span style={{ color:G, fontStyle:'italic' }}>your way.</span><br/>Anything, anytime.
      </div>

      <div style={{ zIndex:1, opacity:s>=2?1:0, transform:s>=2?'scale(1)':'scale(0.9)', transition:'all 0.5s ease' }}>
        <PhoneMock scale={0.86}>
          <div style={{ padding:'14px 9px', height:'100%', display:'flex', flexDirection:'column', background:'#0d0e11' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontFamily:'Playfair Display, serif', fontSize:11, fontWeight:900, color:G }}>Round Order</span>
              <span style={{ color:`${GL}50`, fontSize:14 }}>×</span>
            </div>
            <div style={{ fontWeight:800, fontSize:10.5, color:IV, marginBottom:7 }}>Cheese Chat</div>
            {/* Qty */}
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
              {['−','2','+'].map((x,i) => (<div key={x} style={{ width:24, height:24, background:i===1?'transparent':'#1a1a1a', border:i===1?'none':`1px solid ${G}35`, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono, monospace', fontWeight:i===1?900:700, fontSize:i===1?13:12, color:i===1?IV:GL }}>{x}</div>))}
            </div>
            {/* Half/Full */}
            {s>=3 && (
              <div style={{ display:'flex', gap:5, marginBottom:8 }}>
                <div style={{ flex:1, background:'#111', color:GL, fontSize:8.5, fontWeight:800, textAlign:'center', padding:'6px', borderRadius:7, border:`1px solid ${G}25` }}>HALF ₹50</div>
                <div style={{ flex:1, background:G, color:INK, fontSize:8.5, fontWeight:900, textAlign:'center', padding:'6px', borderRadius:7 }}>FULL ₹100</div>
              </div>
            )}
            {/* Instructions */}
            <div style={{ background:'#111', borderRadius:7, padding:'6px 9px', marginBottom:8, border:`1px solid ${G}18`, display:'flex', alignItems:'center', gap:5 }}>
              <Pencil size={9} color={GD}/>
              <span style={{ fontSize:9, color:s>=4?G:`${GL}35` }}>{s>=4?'Less spicy, no onion…':'Less spicy, no onion etc…'}</span>
            </div>
            {/* Service requests */}
            {s>=5 && (
              <div style={{ background:`${G}08`, border:`1px solid ${G}20`, borderRadius:8, padding:'7px 9px', marginBottom:8 }}>
                <div style={{ fontSize:7.5, color:`${GL}55`, fontWeight:700, marginBottom:5, letterSpacing:0.8 }}>REQUEST SERVICE</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                  {[['Spoons','🥄'],['Forks','🍴'],['Plates','🍽'],['Tissues','🧻']].map(([n]) => (
                    <div key={n} style={{ background:'#111', borderRadius:6, padding:'4px 6px', fontSize:7.5, color:GL, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:3, border:`1px solid ${GL}12` }}>
                      <UtensilsCrossed size={8} color={G}/>{n}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop:'auto', background:GL, borderRadius:9, padding:'8px', textAlign:'center', fontWeight:900, fontSize:10.5, color:INK, letterSpacing:1 }}>ORDER NOW</div>
          </div>
        </PhoneMock>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:8, zIndex:1, alignItems:'flex-end', opacity:s>=6?1:0, transition:'opacity 0.5s ease' }}>
        <CustomerChar mood="happy" size={46}/>
        <SpeechBubble text='"Staff knows exactly what I want — without talking to anyone."' color={G} show style={{ maxWidth:190 }}/>
      </div>
    </div>
  );
}

// S4 — LIVE ORDER TRACKING
function S4() {
  const [active, setActive] = useState(0);
  const [s, setS] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=4) clearInterval(t); }, 620); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setActive(a => Math.min(a+1,2)), 1100); return () => clearInterval(t); }, []);
  const stages = [{ l:'Order\nReceived', I:Check },{ l:'In the\nKitchen', I:Flame },{ l:'Ready to\nServe', I:UtensilsCrossed }];
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:26, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:6, zIndex:1 }}>ORDER CONFIRMED · LIVE TRACKING</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:21, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:10, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        <span style={{ color:G, fontStyle:'italic' }}>Heading to the Kitchen.</span><br/>Watch it live.
      </div>

      <div style={{ zIndex:1, opacity:s>=2?1:0, transform:s>=2?'scale(1)':'scale(0.9)', transition:'all 0.5s ease' }}>
        <PhoneMock scale={0.86}>
          <div style={{ padding:'14px 9px', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', background:'#0d0e11' }}>
            <div style={{ width:56, height:56, borderRadius:14, background:`${G}15`, border:`1px solid ${G}38`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:7 }}>
              <ChefHat size={26} color={G}/>
            </div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7.5, color:`${G}75`, letterSpacing:2, marginBottom:4 }}>ORDER CONFIRMED!</div>
            <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:13, color:IV, marginBottom:10 }}>Heading to the Kitchen</div>
            <div style={{ width:'100%', background:'#111', borderRadius:10, padding:'9px', marginBottom:8, border:`1px solid ${G}18` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                {stages.map((st,i) => (
                  <React.Fragment key={i}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:i<=active?G:'#222', border:`2px solid ${i<=active?G:'#333'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 4px', transition:'all 0.4s' }}>
                        <st.I size={11} color={i<=active?INK:'#555'}/>
                      </div>
                      <div style={{ fontSize:7, color:i<=active?G:'#444', fontWeight:700, whiteSpace:'pre-line', textAlign:'center' }}>{st.l}</div>
                    </div>
                    {i<stages.length-1 && <div style={{ flex:1, height:2, background:i<active?G:'#1e1e1e', margin:'0 3px', marginBottom:14, transition:'background 0.5s' }}/>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ fontSize:8, color:`${GL}45`, marginBottom:8 }}>Estimated prep time: 15–25 min</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, width:'100%', marginBottom:8 }}>
              {[['YOUR TABLE','7'],['ROUND','#0']].map(([l,v]) => (
                <div key={l} style={{ background:'#111', borderRadius:7, padding:'6px 9px', border:`1px solid ${G}18` }}>
                  <div style={{ fontSize:6.5, color:`${GL}45`, letterSpacing:0.8, marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:13, fontWeight:900, color:G }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:'auto', background:GL, borderRadius:9, padding:'7px', textAlign:'center', fontWeight:900, fontSize:10, color:INK, letterSpacing:1, width:'100%' }}>BACK TO MENU</div>
          </div>
        </PhoneMock>
      </div>

      <div style={{ display:'flex', gap:10, marginTop:9, zIndex:1, alignItems:'flex-end', opacity:s>=3?1:0, transition:'opacity 0.6s ease' }}>
        <CustomerChar mood="happy" size={48}/>
        <SpeechBubble text='"I never have to ask the waiter — I watch it live!"' color={G} show style={{ maxWidth:185 }}/>
        <ChefChar mood="cooking" size={48}/>
      </div>
    </div>
  );
}

// S5 — WAITLIST + PICKUP + RESERVATION
function S5() {
  const [s, setS] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=6) clearInterval(t); }, 620); return () => clearInterval(t); }, []);
  return (
    <div style={{ width:'100%', height:'100%', background:`linear-gradient(160deg,#110d08,${DK})`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:26, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:6, zIndex:1 }}>WAITLIST · PICKUP · RESERVATION</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:20, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:10, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        Queue digitally.<br/><span style={{ color:G, fontStyle:'italic' }}>Get notified. Arrive.</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:7, width:'86%', zIndex:1 }}>
        {[
          { I:Clock3, t:'Digital Waitlist', d:'Join from phone · Live position #3 · ~20 min · Pre-order while waiting', delay:320 },
          { I:ShoppingBag, t:'Scheduled Pickup', d:'Pick a time slot · Order ahead · Skip the queue entirely', delay:520 },
          { I:CalendarClock, t:'Table Reservation', d:'Date, party size, special requests · Pre-order before you arrive', delay:720 },
        ].map((c, i) => (
          <div key={c.t} style={{ background:CD, border:`1px solid ${G}22`, borderRadius:12, padding:'9px 13px', display:'flex', alignItems:'center', gap:9, opacity:s>=2+i*0.5?1:0, transform:s>=2+i*0.5?'translateX(0)':'translateX(-16px)', transition:'all 0.5s ease' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:`${G}13`, border:`1px solid ${G}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><c.I size={14} color={G}/></div>
            <div><div style={{ fontWeight:800, fontSize:10.5, color:IV, marginBottom:2 }}>{c.t}</div><div style={{ fontSize:9, color:`${GL}65` }}>{c.d}</div></div>
          </div>
        ))}
      </div>

      {s>=5 && (
        <div style={{ marginTop:9, width:'86%', background:`${G}13`, border:`1px solid ${G}48`, borderRadius:12, padding:'7px 11px', display:'flex', alignItems:'center', gap:7, zIndex:1, animation:'slideUp 0.4s ease' }}>
          <BellRing size={15} color={G}/>
          <div><div style={{ fontSize:9.5, fontWeight:800, color:G }}>Table Ready!</div><div style={{ fontSize:8, color:`${GL}65` }}>Your table at Jay Ambe · Table 5 · Walk in now</div></div>
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginTop:9, zIndex:1, alignItems:'flex-end', opacity:s>=5?1:0, transition:'opacity 0.5s ease' }}>
        <CustomerChar mood="happy" size={48}/>
        <WaiterChar size={48}/>
        <SpeechBubble text='"No signup sheets. Tables turn faster because orders are in before guests sit."' color={GL} show style={{ maxWidth:185, marginBottom:6 }}/>
      </div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// S6 — LOYALTY + GST INVOICE
function S6() {
  const [s, setS] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=5) clearInterval(t); }, 640); return () => clearInterval(t); }, []);
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:22, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:5, zIndex:1 }}>LOYALTY RECOGNITION · GST INVOICE · GROWTH</div>

      {/* Loyal guest card — exact match to real UI */}
      <div style={{ width:'87%', background:'#111317', border:`1px solid ${G}22`, borderRadius:14, overflow:'hidden', zIndex:1, opacity:s>=1?1:0, transform:s>=1?'scale(1)':'scale(0.95)', transition:'all 0.5s ease', marginBottom:7 }}>
        <div style={{ padding:'9px 11px', borderBottom:`1px solid ${G}09`, display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:`${G}13`, border:`1px solid ${G}28`, display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles size={15} color={G}/></div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:7, fontFamily:'JetBrains Mono, monospace', color:`${GL}45`, letterSpacing:1.5, marginBottom:1 }}>LOYAL GUEST</div>
            <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:13.5, color:IV }}>Good morning, Shree!</div>
          </div>
          <div style={{ background:`${G}10`, border:`1px solid ${G}18`, borderRadius:8, padding:'4px 8px', textAlign:'center' }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:700, fontSize:12, color:IV, lineHeight:1 }}>42×</div>
            <div style={{ fontSize:6, color:`${GL}38`, letterSpacing:0.8 }}>VISITS</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:`1px solid ${G}07` }}>
          <div style={{ padding:'6px 9px', borderRight:`1px solid ${G}07` }}>
            <div style={{ fontSize:6.5, color:`${GL}30`, letterSpacing:0.8, marginBottom:2 }}>TOP DISH</div>
            <div style={{ fontSize:9, fontWeight:800, color:IV }}>Tandoor Dum Chat</div>
            <div style={{ fontSize:7.5, color:`${GL}38` }}># Ordered 133×</div>
          </div>
          <div style={{ padding:'6px 9px' }}>
            <div style={{ fontSize:6.5, color:`${GL}30`, letterSpacing:0.8, marginBottom:2 }}>LAST VISIT</div>
            <div style={{ fontSize:12, fontWeight:800, color:IV }}>21 Jun</div>
          </div>
        </div>
        <div style={{ padding:'5px 11px', display:'flex', alignItems:'center', gap:5 }}>
          <Award size={10} color={G}/><span style={{ fontSize:8, color:`${GL}55` }}>You're a Loyal Guest · thanks for 42 visits</span>
        </div>
        <div style={{ margin:'0 7px 7px', background:GL, borderRadius:7, padding:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
          <UtensilsCrossed size={11} color={INK}/><span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize:8.5, color:INK, letterSpacing:0.8 }}>LET'S ORDER</span><ArrowRight size={11} color={INK}/>
        </div>
      </div>

      {/* GST Bill */}
      {s>=2 && (
        <div style={{ width:'87%', background:CD, border:`1px solid ${G}22`, borderRadius:12, padding:'9px 11px', zIndex:1, animation:'slideUp 0.4s ease', marginBottom:7 }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7.5, color:G, letterSpacing:1, marginBottom:5, textAlign:'center' }}>GST INVOICE — AUTO GENERATED</div>
          {[['Tandoor Dum Chat ×2','₹150'],['Cheese Chat ×1','₹100']].map(([a,b]) => (
            <div key={a} style={{ display:'flex', justifyContent:'space-between', fontSize:8.5, color:`${GL}65`, marginBottom:3 }}><span>{a}</span><span>{b}</span></div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, color:`${GL}45`, marginBottom:5 }}><span>CGST 2.5% + SGST 2.5%</span><span>₹25</span></div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:800, color:G, paddingTop:5, borderTop:`1px solid ${G}18` }}><span>TOTAL</span><span>₹275</span></div>
          <div style={{ fontSize:7, color:`${GL}35`, marginTop:3, textAlign:'center' }}>No printer needed · Download PDF · GSTIN & FSSAI auto-printed</div>
        </div>
      )}

      {/* Growth prompts */}
      {s>=4 && (
        <div style={{ display:'flex', gap:6, zIndex:1, animation:'slideUp 0.4s ease' }}>
          <div style={{ background:`${G}10`, border:`1px solid ${G}28`, borderRadius:20, padding:'5px 10px', display:'flex', alignItems:'center', gap:4, fontSize:8.5, color:G, fontWeight:700 }}>
            <Star size={9} color={G}/>Rate on Google
          </div>
          <div style={{ background:`${G}10`, border:`1px solid ${G}28`, borderRadius:20, padding:'5px 10px', display:'flex', alignItems:'center', gap:4, fontSize:8.5, color:G, fontWeight:700 }}>
            <Heart size={9} color={G}/>Follow Instagram
          </div>
        </div>
      )}
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// S7 — KDS: ORDER SPEAKS + LIVE TICKETS
function S7() {
  const [s, setS] = useState(0);
  const [sec, setSec] = useState(920);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=5) clearInterval(t); }, 680); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setSec(x => x+1), 100); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setSpeaking(p => !p), 1200); return () => clearInterval(t); }, []);
  const fmt = x => `${String(Math.floor(x/60)).padStart(2,'0')}:${String(x%60).padStart(2,'0')}`;
  const urg = sec > 900;
  const tickets = [
    { t:'T-07', items:['2× Paneer BM','1× Dal Tadka ✓','3× Butter Roti'], timer:fmt(sec), urg, sw:false },
    { t:'PARCEL', items:['1× Chicken Biryani','2× Raita'], timer:'07:15', urg:false, sw:false },
    { t:'SWIGGY', items:['1× Veg Thali','2× Masala Chai'], timer:'03:40', urg:false, sw:true },
  ];
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:22, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:5, zIndex:1 }}>MODULE 02 · KITCHEN DISPLAY SYSTEM</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:20, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:8, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        No paper chits.<br/><span style={{ color:G, fontStyle:'italic' }}>System speaks the order aloud.</span>
      </div>

      {/* Voice announcement banner */}
      <div style={{ width:'87%', background:`${G}10`, border:`1px solid ${G}35`, borderRadius:10, padding:'8px 12px', display:'flex', alignItems:'center', gap:9, zIndex:1, marginBottom:8, opacity:s>=2?1:0, transition:'opacity 0.5s ease' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          {speaking && <div style={{ position:'absolute', inset:-5, borderRadius:'50%', border:`1.5px solid ${G}60`, animation:'ping 1s ease infinite' }}/>}
          <div style={{ width:30, height:30, borderRadius:'50%', background:`${G}15`, border:`1px solid ${G}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Volume2 size={14} color={G}/>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:G, fontWeight:700, marginBottom:2 }}>SYSTEM ANNOUNCEMENT</div>
          <div style={{ fontSize:9, color:`${GL}75`, lineHeight:1.4 }}>"New order — Table 7 — 2 Paneer Butter Masala, 3 Butter Roti — Dine-In"</div>
        </div>
      </div>

      {/* Tickets */}
      <div style={{ display:'flex', flexDirection:'column', gap:6, width:'87%', zIndex:1 }}>
        {tickets.map((tk, i) => (
          <div key={tk.t} style={{ background:CD, borderRadius:9, overflow:'hidden', border:`1px solid ${tk.urg?G:tk.sw?'#fc801945':`${G}18`}`, boxShadow:tk.urg?`0 0 14px ${G}28`:'none', opacity:s>=2+i*0.4?1:0, transform:s>=2+i*0.4?'translateX(0)':'translateX(18px)', transition:'all 0.5s ease' }}>
            <div style={{ height:2.5, background:tk.urg?`linear-gradient(90deg,${GD},${G})`:tk.sw?'#fc8019':`${G}28` }}/>
            <div style={{ padding:'5px 9px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:800, fontSize:12, color:tk.sw?'#fc8019':IV }}>{tk.t}</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8.5, fontWeight:700, color:tk.urg?GL:G, background:`${tk.urg?GL:G}12`, border:`1px solid ${tk.urg?GL:G}28`, padding:'2px 6px', borderRadius:5 }}>{tk.timer}{tk.urg?' !':''}</span>
            </div>
            <div style={{ padding:'0 9px 6px', display:'flex', gap:7, flexWrap:'wrap' }}>
              {tk.items.map((it,j) => (<span key={j} style={{ fontSize:8.5, color:it.includes('✓')?`${GL}28`:`${GL}68`, textDecoration:it.includes('✓')?'line-through':'none' }}>{it}</span>))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginTop:9, zIndex:1, opacity:s>=5?1:0, transition:'opacity 0.5s ease' }}>
        <ChefChar mood="speak" size={54}/>
        <SpeechBubble text='"The system announces every new order — I hear it and start cooking instantly."' color={G} show style={{ maxWidth:190, marginBottom:8 }}/>
      </div>
      <style>{`@keyframes ping { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.5);opacity:0} }`}</style>
    </div>
  );
}

// S8 — KDS: MARK DISPATCH + VOICE + BATCH
function S8() {
  const [s, setS] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [crossed, setCrossed] = useState([false,false,false]);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=6) clearInterval(t); }, 660); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setPulse(p=>!p), 900); return () => clearInterval(t); }, []);
  useEffect(() => {
    if(s<3) return;
    const timers = [600,1300,2000].map((d,i) => setTimeout(() => setCrossed(c => { const n=[...c]; n[i]=true; return n; }), d));
    return () => timers.forEach(clearTimeout);
  }, [s]);
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:22, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:6, zIndex:1 }}>MARK DISPATCH · VOICE · BATCH COOKING</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:19, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:10, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        Hands on <span style={{ color:G, fontStyle:'italic' }}>the food.</span><br/>Voice controls the screen.
      </div>

      {/* Per-item tap to cross off */}
      <div style={{ width:'87%', background:CD, border:`1px solid ${G}22`, borderRadius:12, padding:'10px 13px', zIndex:1, marginBottom:8, opacity:s>=2?1:0, transition:'opacity 0.5s ease' }}>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7.5, color:`${GL}45`, letterSpacing:1, marginBottom:7 }}>T-07 · TAP TO CROSS OFF EACH DISH</div>
        {['2× Paneer Butter Masala','3× Butter Roti','1× Dal Tadka'].map((it,i) => (
          <div key={it} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:`1px solid ${G}07`, opacity:s>=3?1:0, transition:'opacity 0.4s ease' }}>
            <div style={{ width:20, height:20, borderRadius:5, border:`1px solid ${crossed[i]?G:`${G}30`}`, background:crossed[i]?G:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.3s' }}>
              {crossed[i] && <Check size={10} color={INK}/>}
            </div>
            <span style={{ fontSize:9.5, color:crossed[i]?`${GL}30`:GL, textDecoration:crossed[i]?'line-through':'none', transition:'all 0.3s' }}>{it}</span>
            {crossed[i] && <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7.5, color:'#4ade80', marginLeft:'auto' }}>✓ done</span>}
          </div>
        ))}
        {crossed.every(Boolean) && (
          <div style={{ marginTop:7, background:`${G}15`, border:`1px solid ${G}40`, borderRadius:8, padding:'6px 10px', textAlign:'center', fontFamily:'JetBrains Mono, monospace', fontSize:9, color:G, fontWeight:700, animation:'slideUp 0.3s ease' }}>DISPATCH NOW →</div>
        )}
      </div>


      {/* Batch aggregate */}
      {s>=5 && (
        <div style={{ width:'87%', background:CD, border:`1px solid ${G}22`, borderRadius:10, padding:'9px 13px', zIndex:1, animation:'slideUp 0.4s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <Layers size={12} color={G}/>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8.5, color:G, fontWeight:700 }}>BATCH VIEW — FIRE ALL AT ONCE</span>
          </div>
          {[['Butter Roti','14×'],['Paneer BM','6×'],['Masala Chai','9×']].map(([n,q]) => (
            <div key={n} style={{ display:'flex', justifyContent:'space-between', padding:'3.5px 0', borderBottom:`1px solid ${G}07` }}>
              <span style={{ fontSize:9.5, color:`${GL}65` }}>{n}</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:800, fontSize:10.5, color:G }}>{q}</span>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes ping { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.5);opacity:0} } @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// S9 — WASTAGE LOG
function S9() {
  const [s, setS] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=5) clearInterval(t); }, 690); return () => clearInterval(t); }, []);
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:24, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:6, zIndex:1 }}>WASTAGE INTELLIGENCE · COST CONTROL</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:20, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:10, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        Every loss, tracked<br/><span style={{ color:G, fontStyle:'italic' }}>down to the rupee.</span>
      </div>

      <div style={{ width:'87%', background:CD, border:`1px solid #f8717128`, borderRadius:13, padding:'11px 13px', zIndex:1, marginBottom:8, opacity:s>=2?1:0, transform:s>=2?'scale(1)':'scale(0.95)', transition:'all 0.5s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:9 }}>
          <Trash2 size={12} color="#f87171"/><span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8.5, fontWeight:800, color:'#f87171', letterSpacing:0.5 }}>NEW WASTAGE ENTRY</span>
        </div>
        {[['Item','Paneer · 0.5 kg'],['Reason','Spoiled / Expired'],['Logged By','Chef Ramesh']].map(([l,v],i) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:5, opacity:s>=3+i*0.4?1:0, transition:'opacity 0.4s ease' }}>
            <span style={{ fontSize:9, color:`${GL}45` }}>{l}</span>
            <span style={{ fontSize:9, fontWeight:700, color:i===1?'#f87171':IV }}>{v}</span>
          </div>
        ))}
        {s>=4 && (
          <div style={{ background:'rgba(248,113,113,0.09)', border:'1px solid rgba(248,113,113,0.28)', borderRadius:9, padding:'9px 11px', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:5, animation:'slideUp 0.4s ease' }}>
            <span style={{ fontSize:8.5, fontWeight:800, color:'#f87171' }}>COST LOSS</span>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize:17, color:'#f87171' }}>₹185.00</span>
          </div>
        )}
      </div>

      {s>=4 && (
        <div style={{ width:'87%', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, zIndex:1, animation:'slideUp 0.4s ease', marginBottom:8 }}>
          {[['₹2,340','Total Lost This Month'],['23','Wastage Entries'],['1.8%','Of Revenue']].map(([v,l]) => (
            <div key={l} style={{ background:CD, border:`1px solid #f8717118`, borderRadius:9, padding:'7px', textAlign:'center' }}>
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize:13, color:'#f87171', lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:7.5, color:`${GL}45`, marginTop:3, lineHeight:1.3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:8, zIndex:1, alignItems:'flex-end', opacity:s>=5?1:0, transition:'opacity 0.5s ease' }}>
        <ChefChar mood="cooking" size={50}/>
        <SpeechBubble text='"I log in 5 seconds. Owner sees the rupee cost instantly — no guessing."' color={G} show style={{ maxWidth:188, marginBottom:7 }}/>
      </div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// S10 — FLOOR MAP + BILLING
function S10() {
  const [s, setS] = useState(0);
  const [blink, setBlink] = useState(false);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=5) clearInterval(t); }, 680); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setBlink(b=>!b), 650); return () => clearInterval(t); }, []);
  const tables = [
    {n:1,s:'free'},{n:2,s:'occ',m:'08:22'},{n:3,s:'hot',m:'14:55'},{n:4,s:'crit',m:'21:30'},
    {n:5,s:'occ',m:'05:10'},{n:6,s:'free'},{n:7,s:'occ',m:'11:33',bell:true},{n:8,s:'free'},
    {n:9,s:'hot',m:'17:42'},{n:10,s:'occ',m:'03:55'},{n:11,s:'free'},{n:12,s:'crit',m:'19:05'},
  ];
  const colors = { free:`${GL}07`, occ:`${G}22`, hot:`${G}48`, crit:`${GL}65` };
  const textC  = { free:`${GL}28`, occ:GL, hot:IV, crit:INK };
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:22, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:5, zIndex:1 }}>MODULE 03 · LIVE FLOOR MAP · 1-TAP BILLING</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:20, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:8, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        See every table.<br/><span style={{ color:G, fontStyle:'italic' }}>Bill in one tap.</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, width:'85%', zIndex:1, marginBottom:8, opacity:s>=2?1:0, transition:'opacity 0.5s ease' }}>
        {tables.map(t => (
          <div key={t.n} style={{ borderRadius:7, background:colors[t.s], border:`1px solid ${t.s==='crit'?blink?GL:`${GL}45`:`${G}22`}`, padding:'5px 3px', textAlign:'center', position:'relative', transition:'border-color 0.3s' }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:800, fontSize:10.5, color:textC[t.s] }}>T{t.n}</div>
            {t.m && <div style={{ fontSize:6.5, color:t.s==='crit'?INK:`${textC[t.s]}75`, marginTop:1 }}>{t.m}</div>}
            {t.bell && <div style={{ position:'absolute', top:-4, right:-4, width:11, height:11, background:G, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}><BellRing size={6} color={INK}/></div>}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', zIndex:1, marginBottom:7, opacity:s>=3?1:0, transition:'opacity 0.5s ease' }}>
        {[['free',`${GL}07`,'Free'],['occ',`${G}22`,'Occupied'],['hot',`${G}48`,'Warm'],['crit',`${GL}65`,'Critical']].map(([k,bg,l]) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:4, fontSize:8 }}>
            <div style={{ width:9, height:9, borderRadius:2, background:bg, border:`1px solid ${G}28` }}/>
            <span style={{ color:`${GL}55` }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Bill preview */}
      {s>=3 && (
        <div style={{ width:'85%', background:CD, border:`1px solid ${G}22`, borderRadius:11, padding:'9px 12px', zIndex:1, animation:'slideUp 0.4s ease', marginBottom:8 }}>
          <div style={{ textAlign:'center', fontFamily:'JetBrains Mono, monospace', fontSize:8.5, color:G, fontWeight:700, marginBottom:8 }}>TABLE 07 — SETTLEMENT</div>
          {[['Paneer BM ×2','₹560'],['Garlic Naan ×3','₹180'],['Thums Up ×2','₹80'],['Discount 10%','-₹82'],['CGST 2.5%','₹18.45'],['SGST 2.5%','₹18.45']].map(([a,b]) => (
            <div key={a} style={{ display:'flex', justifyContent:'space-between', fontSize:8, color:`${GL}55`, padding:'2px 0' }}><span>{a}</span><span>{b}</span></div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:800, color:G, marginTop:6, paddingTop:6, borderTop:`1px solid ${G}18` }}><span>TOTAL</span><span>₹777</span></div>
          <div style={{ display:'flex', gap:5, marginTop:7 }}>
            {['CASH','UPI','SPLIT'].map((x,i) => (<div key={x} style={{ flex:1, textAlign:'center', padding:'5px', borderRadius:7, background:i===1?G:'#111', border:`1px solid ${i===1?G:`${G}28`}`, fontFamily:'JetBrains Mono, monospace', fontSize:8, fontWeight:700, color:i===1?INK:G }}>{x}</div>))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:8, alignItems:'flex-end', zIndex:1, opacity:s>=5?1:0, transition:'opacity 0.5s ease' }}>
        <ManagerChar mood="neutral" size={52}/>
        <SpeechBubble text='"Table 4 critical. Table 7 rang bell. Settle T7 — done in 30 sec."' color={G} show style={{ maxWidth:192, marginBottom:7 }}/>
      </div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// S11 — INVENTORY + AUTO-HIDE MENU + LIVE EDIT
function S11() {
  const [s, setS] = useState(0);
  const [hidden, setHidden] = useState(false);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=6) clearInterval(t); }, 640); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setTimeout(() => setHidden(true), 3000); return () => clearTimeout(t); }, []);
  const items = [
    { n:'Paneer',      pct:78, st:'ok' },
    { n:'Tomatoes',    pct:18, st:'lo' },
    { n:'Fresh Cream', pct:0,  st:'cr' },
    { n:'Basmati Rice',pct:90, st:'ok' },
  ];
  const sC = { ok:G, lo:'#BA7517', cr:'#f87171' };
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:22, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:5, zIndex:1 }}>INVENTORY · AUTO-HIDE MENU · LIVE EDIT</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:19, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:9, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        Stock hits zero?<br/><span style={{ color:G, fontStyle:'italic' }}>Menu auto-hides it.</span>
      </div>

      {/* Stock levels */}
      <div style={{ width:'87%', background:CD, border:`1px solid ${G}22`, borderRadius:13, padding:'10px 13px', zIndex:1, marginBottom:7, opacity:s>=2?1:0, transition:'opacity 0.5s ease' }}>
        <div style={{ fontSize:7.5, fontWeight:700, color:`${GL}45`, letterSpacing:1, marginBottom:7 }}>LIVE STOCK LEVELS · WAC COSTING</div>
        {items.map((it,i) => (
          <div key={it.n} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5, opacity:s>=2+i*0.25?1:0, transition:'opacity 0.4s ease' }}>
            <span style={{ width:70, fontSize:9, color:`${GL}70` }}>{it.n}</span>
            <div style={{ flex:1, height:5, background:'#1a1a1a', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${it.pct}%`, background:sC[it.st], borderRadius:3, transition:'width 1.2s ease' }}/>
            </div>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, fontWeight:700, color:sC[it.st], width:16 }}>{it.st==='ok'?'●':it.st==='lo'?'▲':'!'}</span>
          </div>
        ))}
      </div>

      {/* Auto-hide trigger + menu edit */}
      <div style={{ display:'flex', gap:6, width:'87%', zIndex:1, marginBottom:7, opacity:s>=4?1:0, transition:'opacity 0.5s ease' }}>
        {/* Auto-hide animation */}
        <div style={{ flex:1, background:CD, border:`1px solid #f8717122`, borderRadius:11, padding:'9px 11px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
            {hidden?<EyeOff size={12} color="#f87171"/>:<Eye size={12} color={G}/>}
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:hidden?'#f87171':G, fontWeight:700 }}>{hidden?'AUTO-HIDDEN':'LIVE ON MENU'}</span>
          </div>
          <div style={{ fontSize:9, fontWeight:700, color:IV, marginBottom:3 }}>Paneer Curry</div>
          <div style={{ fontSize:8, color:`${GL}50`, marginBottom:5 }}>Linked: Fresh Cream · Stock: 0</div>
          <div style={{ fontSize:7.5, color:`${GL}40`, lineHeight:1.4 }}>Cream hit zero → dish auto-hidden from every customer phone instantly</div>
        </div>
        {/* Menu edit */}
        <div style={{ flex:1, background:CD, border:`1px solid ${G}22`, borderRadius:11, padding:'9px 11px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
            <Pencil size={11} color={G}/>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:G, fontWeight:700 }}>LIVE MENU EDIT</span>
          </div>
          <div style={{ fontSize:7.5, color:`${GL}45`, lineHeight:1.5 }}>Change price anytime → instantly live on all customer phones. No printing cost. No reprints. Ever.</div>
          <div style={{ marginTop:5, display:'flex', gap:4 }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#f87171', textDecoration:'line-through' }}>₹75</div>
            <ArrowRight size={10} color={G}/>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#4ade80', fontWeight:700 }}>₹85</div>
          </div>
          <div style={{ fontSize:7, color:`${GL}35`, marginTop:3 }}>Saves instantly · All devices</div>
        </div>
      </div>

      {/* Recipe cost */}
      {s>=5 && (
        <div style={{ width:'87%', background:`${G}08`, border:`1px solid ${G}22`, borderRadius:10, padding:'8px 12px', zIndex:1, display:'flex', alignItems:'center', gap:8, animation:'slideUp 0.4s ease' }}>
          <ChefHat size={14} color={G}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:8.5, fontWeight:800, color:IV }}>Recipe Costing — WAC Auto-Update</div>
            <div style={{ fontSize:8, color:`${GL}55` }}>Paneer Curry = ₹46/serving · Real margin: 38.7% · Updates on every restock</div>
          </div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:13, fontWeight:900, color:G }}>₹46</div>
        </div>
      )}

      <div style={{ display:'flex', gap:7, alignItems:'flex-end', marginTop:8, zIndex:1, opacity:s>=6?1:0, transition:'opacity 0.5s ease' }}>
        <ManagerChar mood="neutral" size={50}/>
        <SpeechBubble text='"Cream ran out → dish disappeared from menu automatically. No angry customers."' color={G} show style={{ maxWidth:190, marginBottom:7 }}/>
      </div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// S12 — 60 AI RECOMMENDATIONS + ANALYTICS
function S12() {
  const [s, setS] = useState(0);
  const [score, setScore] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=5) clearInterval(t); }, 680); return () => clearInterval(t); }, []);
  useEffect(() => { let x=0; const t = setInterval(() => { x+=2; setScore(Math.min(x,82)); if(x>=82) clearInterval(t); }, 28); return () => clearInterval(t); }, []);
  const recs = [
    { t:'Wastage on Paneer is 3.2% of revenue — review portion sizes', I:Trash2, c:'#f87171', p:'P1' },
    { t:'GSTR-1 filing due in 4 days — export register now',           I:FileText, c:G,       p:'P1' },
    { t:'Table 7 has slowest dwell time — check service flow',          I:Clock3,  c:'#BA7517',p:'P2' },
    { t:'"Cheese Chat" sells 8× — raise price by ₹15',                 I:TrendingUp,c:'#4ade80',p:'P3'},
  ];
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:20, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:`${GL}45`, letterSpacing:2.5, marginBottom:5, zIndex:1 }}>60 AI RECOMMENDATIONS · ANALYTICS · EXCEL EXPORT</div>

      {/* Health score + headline */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:9, zIndex:1, opacity:s>=1?1:0, transition:'opacity 0.5s ease' }}>
        <div style={{ width:68, height:68, borderRadius:'50%', background:`conic-gradient(${G} ${score*3.6}deg, #1a1a1a 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize:17, color:G, lineHeight:1 }}>{score}</span>
            <span style={{ fontSize:5.5, color:`${GL}45`, letterSpacing:0.5 }}>HEALTH</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:17, color:IV, lineHeight:1.25 }}>Like a business<br/><span style={{ color:G, fontStyle:'italic' }}>analyst, 24/7.</span></div>
          <div style={{ fontSize:8.5, color:`${GL}55`, marginTop:4 }}>60 live recommendations · updates daily</div>
        </div>
      </div>

      {/* Rec cards */}
      <div style={{ width:'87%', display:'flex', flexDirection:'column', gap:5, zIndex:1, marginBottom:7 }}>
        {recs.map((r,i) => (
          <div key={r.t} style={{ background:CD, border:`1px solid ${r.c}28`, borderLeft:`3px solid ${r.c}`, borderRadius:9, padding:'7px 9px', display:'flex', alignItems:'center', gap:7, opacity:s>=2+i*0.4?1:0, transform:s>=2+i*0.4?'translateX(0)':'translateX(-12px)', transition:'all 0.5s ease' }}>
            <div style={{ width:22, height:22, borderRadius:5, background:`${r.c}13`, border:`1px solid ${r.c}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><r.I size={10} color={r.c}/></div>
            <span style={{ fontSize:9, color:`${GL}75`, fontWeight:600, flex:1 }}>{r.t}</span>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7, color:r.c, background:`${r.c}10`, border:`1px solid ${r.c}22`, padding:'2px 5px', borderRadius:4 }}>{r.p}</span>
          </div>
        ))}
      </div>

      {/* Analytics pills */}
      {s>=4 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, width:'87%', zIndex:1, justifyContent:'center', animation:'slideUp 0.4s ease' }}>
          {['Revenue Heatmap','P&L + Break-Even','GST Deadlines','Wastage Cost','Staff Payroll','Menu Matrix','GSTR-1 Export','Inventory WAC'].map(t => <Tag key={t} color={GD}>{t}</Tag>)}
        </div>
      )}

      <div style={{ display:'flex', gap:7, alignItems:'flex-end', marginTop:9, zIndex:1, opacity:s>=5?1:0, transition:'opacity 0.5s ease' }}>
        <ManagerChar mood="neutral" size={50}/>
        <SpeechBubble text='"It tells me what to fix before it becomes a problem. 60 alerts every day."' color={G} show style={{ maxWidth:190, marginBottom:7 }}/>
      </div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// S13 — HAPPY MANAGER
function S13() {
  const [s, setS] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=6) clearInterval(t); }, 620); return () => clearInterval(t); }, []);
  const wins = [
    { I:Zap,        t:'Bill settled in 1 tap — table free in 30 sec', c:'#4ade80' },
    { I:TrendingUp, t:'Revenue up 23% · Menu auto-optimized by data',  c:G },
    { I:Heart,      t:'42× loyal customers this month — recognized by phone', c:'#f472b6' },
    { I:RefreshCw,  t:'Inventory auto-deducts · Menu auto-hides sold-out items',c:GL },
    { I:Brain,      t:'60 AI alerts · Never miss a GST deadline again',c:'#818cf8' },
  ];
  return (
    <div style={{ width:'100%', height:'100%', background:`linear-gradient(160deg,#0a1205,${DK})`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:22, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ position:'absolute', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,#4ade8015,transparent 70%)', top:'30%', left:'50%', transform:'translate(-50%,-50%)' }}/>

      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:'#4ade8060', letterSpacing:2.5, marginBottom:5, zIndex:1 }}>STRESS-FREE · GROWTH-READY · FULLY AUTOMATED</div>
      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:21, color:IV, textAlign:'center', lineHeight:1.2, marginBottom:8, zIndex:1, opacity:s>=1?1:0, transition:'all 0.5s ease' }}>
        Close in <span style={{ color:'#4ade80', fontStyle:'italic' }}>30 seconds.</span><br/>Grow every month.
      </div>

      <div style={{ zIndex:1, opacity:s>=2?1:0, transform:s>=2?'scale(1)':'scale(0.8)', transition:'all 0.6s cubic-bezier(0.34,1.56,0.64,1)', marginBottom:8 }}>
        <ManagerChar mood="happy" size={88}/>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6, width:'87%', zIndex:1 }}>
        {wins.map((r,i) => (
          <div key={r.t} style={{ background:`${r.c}09`, border:`1px solid ${r.c}30`, borderRadius:9, padding:'7px 11px', display:'flex', alignItems:'center', gap:7, opacity:s>=3+i*0.45?1:0, transform:s>=3+i*0.45?'translateY(0)':'translateY(8px)', transition:'all 0.5s ease' }}>
            <r.I size={12} color={r.c}/>
            <span style={{ fontSize:9.5, color:`${GL}78`, fontWeight:700 }}>{r.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// S14 — CLOSING
function S14() {
  const [s, setS] = useState(0);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setS(i); if(i>=5) clearInterval(t); }, 580); return () => clearInterval(t); }, []);
  return (
    <div style={{ width:'100%', height:'100%', background:DK, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${G}06 1px,transparent 1px),linear-gradient(90deg,${G}06 1px,transparent 1px)`, backgroundSize:'40px 40px' }}/>
      <div style={{ position:'absolute', width:330, height:330, borderRadius:'50%', background:`radial-gradient(circle,${G}13,transparent 70%)`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}/>

      <div style={{ display:'flex', gap:4, marginBottom:12, zIndex:1, opacity:s>=2?1:0, transform:s>=2?'translateY(0)':'translateY(14px)', transition:'all 0.6s ease' }}>
        <CustomerChar mood="excited" size={56}/>
        <WaiterChar size={56}/>
        <ChefChar mood="happy" size={56}/>
        <ManagerChar mood="happy" size={56}/>
      </div>

      <div style={{ width:72, height:72, borderRadius:20, background:`${G}16`, border:`2px solid ${G}55`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, zIndex:1, opacity:s>=1?1:0, transform:s>=1?'scale(1)':'scale(0.4)', transition:'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <ChefHat size={34} color={G}/>
      </div>

      <div style={{ fontFamily:'Playfair Display, serif', fontWeight:900, fontSize:28, color:IV, letterSpacing:4, zIndex:1, opacity:s>=2?1:0, transition:'all 0.5s ease' }}>PRATYEKSHA</div>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8.5, color:`${GL}50`, letterSpacing:3, marginTop:5, zIndex:1, opacity:s>=3?1:0, transition:'opacity 0.5s ease' }}>VISUALIZE · ORDER · RELISH</div>

      <div style={{ marginTop:14, background:`${G}13`, border:`1px solid ${G}38`, borderRadius:12, padding:'10px 18px', zIndex:1, textAlign:'center', opacity:s>=4?1:0, transition:'opacity 0.5s ease' }}>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:G, fontWeight:800, marginBottom:4 }}>Book your free demo today</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:`${GL}65` }}>Shreeom S. Narkar · 8767622654 / 8605015294</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8.5, color:`${GL}50`, marginTop:2 }}>hello.pratyeksha@gmail.com</div>
        <div style={{ fontSize:7.5, color:`${GL}35`, marginTop:4 }}>Customer App · Kitchen Display · Operator Portal</div>
      </div>

      <div style={{ display:'flex', gap:7, marginTop:11, zIndex:1, opacity:s>=5?1:0, transition:'opacity 0.5s ease' }}>
        {[['Customer App',QrCode],['KDS Kitchen',ChefHat],['Operator Portal',Grid3x3]].map(([l,Icon]) => (
          <div key={l} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:`${G}09`, border:`1px solid ${G}22`, borderRadius:10, padding:'7px 10px', minWidth:78 }}>
            <Icon size={13} color={G}/>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7.5, color:G, textAlign:'center', fontWeight:700 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── SCENE REGISTRY ───────────────────────────
const scenes = [
  { id:0,  dur:4200, label:'PRATYEKSHA' },
  { id:1,  dur:5500, label:'SCAN — NO APP' },
  { id:2,  dur:5500, label:'MENU · AR · BADGES' },
  { id:3,  dur:5200, label:'ORDER · INSTRUCTIONS' },
  { id:4,  dur:5000, label:'LIVE TRACKING' },
  { id:5,  dur:5500, label:'WAITLIST · PICKUP' },
  { id:6,  dur:5500, label:'LOYALTY · GST BILL' },
  { id:7,  dur:5200, label:'KDS · SYSTEM SPEAKS' },
  { id:8,  dur:5200, label:'DISPATCH · VOICE' },
  { id:9,  dur:4800, label:'WASTAGE LOG' },
  { id:10, dur:5500, label:'FLOOR MAP · BILLING' },
  { id:11, dur:5500, label:'AUTO-HIDE · MENU EDIT' },
  { id:12, dur:5500, label:'60 AI RECOMMENDATIONS' },
  { id:13, dur:5000, label:'HAPPY MANAGER' },
  { id:14, dur:5000, label:'BOOK DEMO' },
];
const TOTAL = scenes.length;
const SCENE_COMPS = [S0,S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11,S12,S13,S14];

// ─────────────────────────── PLAYER ───────────────────────────
export default function PratyekshaReel() {
  const [idx, setIdx]       = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const rafRef  = useRef(null);
  const startRef = useRef(null);

  const goTo = useCallback((i) => {
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    setIdx(((i%TOTAL)+TOTAL)%TOTAL);
    setProgress(0);
    startRef.current = null;
  }, []);

  useEffect(() => {
    if(!playing) { if(rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const dur = scenes[idx].dur;
    const tick = (now) => {
      if(!startRef.current) startRef.current = now;
      const p = Math.min(100,((now-startRef.current)/dur)*100);
      setProgress(p);
      if(p>=100) { startRef.current=null; setIdx(i=>(i+1)%TOTAL); }
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [idx, playing]);

  useEffect(() => {
    const h = (e) => {
      if(e.key==='ArrowRight') goTo(idx+1);
      if(e.key==='ArrowLeft')  goTo(idx-1);
      if(e.key===' ')          { e.preventDefault(); setPlaying(p=>!p); }
    };
    window.addEventListener('keydown',h);
    return () => window.removeEventListener('keydown',h);
  }, [idx, goTo]);

  const Scene = SCENE_COMPS[idx];

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif' }}>
      <div style={{
        aspectRatio:'9/16',
        height:'min(100vh, calc(100vw * 16 / 9))',
        width:'min(calc(100vh * 9 / 16), 100vw)',
        maxWidth:430, maxHeight:763,
        position:'relative', background:DK, overflow:'hidden',
        display:'flex', flexDirection:'column',
        boxShadow:'0 0 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)'
      }}>
        {/* Progress bars */}
        <div style={{ display:'flex', gap:2, padding:'9px 9px 5px', flexShrink:0, zIndex:100, position:'absolute', top:0, left:0, right:0 }}>
          {scenes.map((sc,i) => (
            <div key={sc.id} onClick={() => goTo(i)} style={{ flex:1, height:2.5, borderRadius:2, background:'rgba(255,255,255,0.14)', overflow:'hidden', cursor:'pointer' }}>
              <div style={{ height:'100%', background:G, transformOrigin:'left', transform:`scaleX(${i<idx?1:i===idx?progress/100:0})`, transition:i===idx?'none':'transform .1s' }}/>
            </div>
          ))}
        </div>

        {/* Scene */}
        <div style={{ flex:1, position:'relative', marginTop:26, marginBottom:46 }}>
          <Scene key={idx}/>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, padding:'8px 0 10px', flexShrink:0, background:'rgba(0,0,0,0.9)', zIndex:100, position:'absolute', bottom:0, left:0, right:0, backdropFilter:'blur(6px)' }}>
          <button onClick={()=>goTo(0)} style={btnSt}><RotateCcw size={12} color={`${GL}75`}/></button>
          <button onClick={()=>goTo(idx-1)} style={btnSt}><ChevronLeft size={15} color={`${GL}85`}/></button>
          <button onClick={()=>setPlaying(p=>!p)} style={{ ...btnSt, width:42, height:42, background:G, border:'none' }}>
            {playing?<Pause size={16} color={INK}/>:<Play size={16} color={INK}/>}
          </button>
          <button onClick={()=>goTo(idx+1)} style={btnSt}><ChevronRight size={15} color={`${GL}85`}/></button>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7.5, color:`${GL}35`, marginLeft:2 }}>{String(idx+1).padStart(2,'0')}/{String(TOTAL).padStart(2,'0')}</span>
        </div>
      </div>
    </div>
  );
}

const btnSt = {
  width:34, height:34, borderRadius:'50%',
  border:'1px solid rgba(255,255,255,0.11)',
  background:'rgba(255,255,255,0.04)',
  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
};