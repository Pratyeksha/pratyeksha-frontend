import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, RefreshCcw, Search, TrendingUp, Users, Trophy,
  ShieldCheck, Zap, AlertCircle, Utensils, Coffee,
  CalendarClock, Phone, Mail, MapPin, ChevronRight, CheckCircle2,
  Clock, Layers, X, Menu, Plus, Power, RotateCcw, UserPlus,
  IndianRupee, AlertTriangle, Calendar, Store, ChefHat,
  BarChart3, Eye, EyeOff, Copy, Check, Wallet
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

/* ─────────────────────────────────────────
   DESIGN TOKENS
   #d3bfa2 — primary light gold (headings, CTAs, active states)
   #8a704d — secondary dark gold (muted labels, secondary actions)
───────────────────────────────────────── */
const C = {
  /* backgrounds */
  bg:      '#0a0a0a',
  bgDark:  '#060606',
  bgCard:  '#111111',
  bgCard2: '#151515',
  bgInput: '#0d0d0d',

  /* borders */
  border:    '#1e1e1e',
  borderMid: '#252525',

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
  textDim:   '#606060',   /* labels, placeholders */
  textFaint: '#2a2a2a',   /* very dim */

  /* status colors — kept neutral, no gold bleed */
  warning:  '#d4903a',
  danger:   '#c06040',
  success:  '#5a9e6a',
  green:    '#4ade80',
  amber:    '#b87c33',
};

/* ── Global CSS ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body, html {
    overflow: hidden !important;
    width: 100vw; height: 100vh;
    background: #0a0a0a;
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
    width: 248px; min-width: 248px; height: 100vh;
    background: #060606; border-right: 1px solid #1a1a1a;
    display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
    transition: transform 0.26s cubic-bezier(.4,0,.2,1);
    position: relative; z-index: 149;
  }
  .p-sidebar-inner { display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding: 22px 14px; }

  .p-topbar {
    display: none; position: fixed; top: 0; left: 0; right: 0;
    height: 50px; background: #060606; border-bottom: 1px solid #1a1a1a;
    z-index: 160; align-items: center; justify-content: space-between; padding: 0 14px;
  }
  .p-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 148; }

  /* Input focus — light gold ring */
  .p-inp { transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
  .p-inp:focus {
    border-color: rgba(211,191,162,0.45) !important;
    box-shadow: 0 0 0 3px rgba(211,191,162,0.06) !important;
  }

  .p-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .p-stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
  .p-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .p-filterbar { display: flex; border-bottom: 1px solid #1a1a1a; flex-shrink: 0; background: #060606; overflow-x: auto; }
  .p-filterbar::-webkit-scrollbar { display: none; }
  .p-scroll { flex: 1; overflow-y: auto; }
  .p-pad { padding: 24px 32px 48px; }

  .p-row { transition: background 0.1s; }
  .p-row:hover { background: #141414 !important; }

  /* Card hover — light gold border */
  .p-card { transition: border-color 0.18s; }
  .p-card:hover { border-color: rgba(211,191,162,0.22) !important; }

  .p-demo-card { transition: background 0.1s, border-color 0.1s; cursor: pointer; }
  .p-demo-card:hover { background: #141414 !important; }

  /* Nav hover — subtle light gold tint */
  .p-nav-item:hover { background: rgba(211,191,162,0.04) !important; color: #d3bfa2 !important; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pulse-slow { 0%,100% { opacity:1; } 50% { opacity:0.45; } }

  @media (max-width: 1100px) {
    .p-stat-grid { grid-template-columns: repeat(2,1fr); }
    .p-chart-grid { grid-template-columns: 1fr; }
    .p-pad { padding: 20px 20px 40px; }
    .p-sidebar { width: 220px; min-width: 220px; }
  }
  @media (max-width: 768px) {
    .p-topbar { display: flex; }
    .p-sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 80vw; max-width: 260px;
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

if (typeof document !== 'undefined' && !document.getElementById('p-admin-styles')) {
  const s = document.createElement('style');
  s.id = 'p-admin-styles';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
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
    'Demo Given': { color: '#606060', bg: 'rgba(96,96,96,0.07)',    border: 'rgba(96,96,96,0.16)',   label: 'Done' },
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
const ClientStatusDot = ({ client, now }) => {
  const base = { width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0 };
  if (!client.isActive) return <span style={{ ...base, background: C.danger }} />;
  const exp = client.config?.planExpiry;
  if (!exp || new Date(exp) < now) return <span style={{ ...base, background: C.warning }} />;
  const soon = new Date(now); soon.setDate(soon.getDate() + 30);
  /* expiring soon → dark amber pulse */
  if (new Date(exp) <= soon) return <span style={{ ...base, background: '#8a704d', animation: 'pulse-slow 2s infinite' }} />;
  /* active → light gold */
  return <span style={{ ...base, background: '#d3bfa2' }} />;
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

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function PratyekshaMasterAdmin() {
  const [activeSection, setActiveSection] = useState('demos');
  const [clients,       setClients]       = useState([]);
  const [stats,         setStats]         = useState({ totalRevenue:0, activeCount:0, expiredCount:0, disabledCount:0, expiringSoon:0, topClients:[], totalClients:0 });
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
    street:'', city:'', state:'', pincode:'',
    tableCount:'12', taxPercentage:'5',
    username:'', password:'', confirmPassword:'',
    planMonths:'12', paidAmount:'', googleReview:'', instaId:''
  });
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(null);
  const [onboardError,   setOnboardError]   = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [copied,         setCopied]         = useState('');

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
    } catch(e){ console.error(e); }
    finally{ setLoading(false); }
  }, []);

  const fetchDemos = useCallback(async () => {
    setDemoLoading(true);
    try {
      const r = await axios.get(`${BASE_URL}/admin/master/demo-requests`);
      setDemoRequests(r.data || []);
    } catch(e){ console.error(e); }
    finally{ setDemoLoading(false); }
  }, []);

  useEffect(() => { fetchData(); fetchDemos(); }, []);

  /* ── helpers ── */
  const getClientStatus = (c) => {
    if (!c.isActive) return { label: 'Disabled', color: C.danger };
    const exp = c.config?.planExpiry;
    if (!exp || new Date(exp) < now) return { label: 'Expired', color: C.warning };
    const soon = new Date(now); soon.setDate(soon.getDate() + 30);
    /* expiring soon → dark amber */
    if (new Date(exp) <= soon) return { label: 'Expiring', color: '#8a704d' };
    /* fully active → light gold */
    return { label: 'Active', color: '#d3bfa2' };
  };

  const getDaysLeft = (c) => {
    const exp = c.config?.planExpiry;
    if (!exp) return null;
    return Math.ceil((new Date(exp) - now) / (1000*60*60*24));
  };

  const handleRenew = async (client) => {
    const months = prompt(`Renew "${client.name}" — plan months:`, '12');
    if (!months) return;
    const amt = prompt(`Amount received (₹):`, '1200');
    if (!amt) return;
    try {
      await axios.patch(`${BASE_URL}/admin/master/renew-subscription/${client._id}`, { planMonths:Number(months), paidAmount:Number(amt) });
      fetchData();
    } catch { alert('Renewal failed.'); }
  };

  const handleToggle = async (client) => {
    if (!window.confirm(`${client.isActive ? 'DISABLE' : 'ENABLE'} account for "${client.name}"?`)) return;
    try {
      await axios.patch(`${BASE_URL}/admin/master/toggle-tenant/${client._id}`);
      fetchData();
    } catch { alert('Toggle failed.'); }
  };

  const markDone = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/demo-requests/${id}`);
      setDemoRequests(p => p.map(r => r._id===id ? {...r, status:'Demo Given'} : r));
      if (selectedDemo?._id===id) setSelectedDemo(p => ({...p, status:'Demo Given'}));
    } catch(e){ console.error(e); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/demo-requests/${id}`, { status });
      setDemoRequests(p => p.map(r => r._id===id ? {...r, status} : r));
      if (selectedDemo?._id===id) setSelectedDemo(p => ({...p, status}));
    } catch(e){ console.error(e); }
  };

  const navTo = (sec) => { setActiveSection(sec); setSidebarOpen(false); setSelectedDemo(null); };
  const refresh = () => { fetchData(); fetchDemos(); };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(key);
    setTimeout(()=>setCopied(''), 2000);
  };

  /* ── onboard ── */
  const handleOnboard = async () => {
    if (!onboarding.name || !onboarding.username || !onboarding.password) {
      setOnboardError('Restaurant name, username and password are required.'); return;
    }
    if (onboarding.password !== onboarding.confirmPassword) {
      setOnboardError('Passwords do not match.'); return;
    }
    if (onboarding.password.length < 6) {
      setOnboardError('Password must be at least 6 characters.'); return;
    }
    setOnboardLoading(true); setOnboardError('');
    try {
      const res = await axios.post(`${BASE_URL}/admin/master/onboard`, {
        ...onboarding,
        tableCount:Number(onboarding.tableCount),
        taxPercentage:Number(onboarding.taxPercentage),
        planMonths:Number(onboarding.planMonths),
        paidAmount:Number(onboarding.paidAmount),
      });
      setOnboardSuccess({ tenantId:res.data.tenantId, username:onboarding.username, password:onboarding.password, name:onboarding.name });
      setOnboarding({ name:'', businessType:'Restaurant', ownerName:'', contact:'', gstin:'', street:'', city:'', state:'', pincode:'', tableCount:'12', taxPercentage:'5', username:'', password:'', confirmPassword:'', planMonths:'12', paidAmount:'', googleReview:'', instaId:'' });
      fetchData();
    } catch(err) {
      setOnboardError(err.response?.data?.error || 'Onboarding failed.');
    } finally{ setOnboardLoading(false); }
  };

  /* ── derived ── */
  const filteredClients = clients
    .filter(c => {
      if (clientFilter==='active')   return c.isActive && c.config?.planExpiry && new Date(c.config.planExpiry) > now;
      if (clientFilter==='expired')  return c.isActive && (!c.config?.planExpiry || new Date(c.config.planExpiry) <= now);
      if (clientFilter==='disabled') return !c.isActive;
      return true;
    })
    .filter(c => !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tenantId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
      r.phone?.includes(demoSearch) ||
      r.city?.toLowerCase().includes(demoSearch.toLowerCase());
    return okFilter && okSearch;
  });

  /* ── loader ── */
  if (loading) return (
    <div style={{ height:'100vh', background:C.bgDark, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:`1.5px solid ${C.border}`, borderTopColor:'#d3bfa2', animation:'spin 0.9s linear infinite' }} />
      <div style={{ fontSize:11, fontWeight:500, letterSpacing:'2px', color:C.textDim }}>PRATYEKSHA</div>
    </div>
  );

  /* ── nav item ──
     active:  light gold text + left border + faint bg
     inactive: dim text
  */
  const NavItem = ({ id, label, icon:Icon, count, urgent }) => {
    const isActive = activeSection===id;
    return (
      <button onClick={()=>navTo(id)} className="p-nav-item" style={{
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
    <div style={{ display:'flex', width:'100vw', height:'100vh', background:C.bg, color:C.text, overflow:'hidden', position:'fixed', top:0, left:0 }}>

      {/* Mobile topbar */}
      <div className="p-topbar">
        <button onClick={()=>setSidebarOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:6, display:'flex', color:C.textMid }}>
          <Menu size={18} />
        </button>
        {/* brand name in light gold */}
        <span style={{ fontSize:13, fontWeight:600, color:'#d3bfa2', letterSpacing:'0.5px' }}>Pratyeksha</span>
        <button onClick={refresh} style={{ background:'none', border:'none', cursor:'pointer', padding:6, display:'flex', color:C.textDim }}>
          <RefreshCcw size={15} />
        </button>
      </div>

      <div className={`p-backdrop${sidebarOpen ? ' open' : ''}`} onClick={()=>setSidebarOpen(false)} />

      {/* ════════ SIDEBAR ════════ */}
      <aside className={`p-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="p-sidebar-inner no-sb">

          {/* Brand — icon bg is light gold, text is near-white */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28, paddingBottom:18, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'#d3bfa2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Zap size={15} color="#0a0a0a" fill="#0a0a0a" />
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
            <div style={{ fontSize:10, color:C.textDim, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:6 }}>Total Revenue</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#d3bfa2', lineHeight:1, marginBottom:12, fontFamily:'JetBrains Mono, monospace' }}>
              ₹{(stats.totalRevenue||0).toLocaleString()}
            </div>
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
          <div style={{ fontSize:10, color:C.textFaint, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:6, paddingLeft:10 }}>Navigation</div>
          <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:16 }}>
            <NavItem id="demos"     label="Demo Requests"   icon={CalendarClock} count={demoCounts.Pending} urgent />
            <NavItem id="dashboard" label="Dashboard"       icon={BarChart3} />
            <NavItem id="clients"   label="Client Partners" icon={Building2} count={clients.length} />
            <NavItem id="onboard"   label="Onboard Client"  icon={UserPlus} />
          </div>

          <Div />

          {/* Top clients */}
          <div style={{ fontSize:10, color:C.textFaint, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, paddingLeft:4, display:'flex', alignItems:'center', gap:5 }}>
            <Trophy size={10} color={C.textFaint} /> Top Clients
          </div>
          <div className="no-sb" style={{ flex:1, overflowY:'auto' }}>
            {(stats.topClients||[]).map((c,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, padding:'7px 8px', borderRadius:7, background:C.bgCard }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.textFaint, width:14 }}>{i+1}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  {/* revenue in dark amber — readable, not overpowering */}
                  <div style={{ fontSize:11, color:'#8a704d', fontWeight:600, fontFamily:'JetBrains Mono, monospace' }}>₹{(c.revenue||0).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <Div />
          <button onClick={refresh} style={{
            width:'100%', padding:'9px', background:C.bgCard, border:`1px solid ${C.border}`,
            color:C.textDim, borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            <RefreshCcw size={12} /> Refresh
          </button>
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
                  <button key={f.id} onClick={()=>setDemoFilter(f.id)} style={filterTab(demoFilter===f.id)}>
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
                  <div style={{ textAlign:'center', padding:'60px 0', color:C.textDim }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', border:`1.5px solid ${C.border}`, borderTopColor:'#d3bfa2', animation:'spin 0.9s linear infinite', margin:'0 auto 10px' }} />
                    <div style={{ fontSize:12 }}>Loading…</div>
                  </div>
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
                            <button onClick={e=>{ e.stopPropagation(); markDone(req._id); }} style={{
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
                          {new Date(req.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
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
                      <button onClick={()=>setSelectedDemo(null)} style={{ background:C.bgCard, border:`1px solid ${C.border}`, color:C.textDim, padding:7, borderRadius:7, cursor:'pointer', display:'flex' }}>
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
                            <button key={s} onClick={()=>updateStatus(selectedDemo._id, s)} style={{
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
                        <span style={{ fontSize:12, color:C.textDim }}>{new Date(selectedDemo.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
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
                        padding:'12px', background:'#d3bfa2', borderRadius:9, fontSize:13, fontWeight:600, color:'#0a0a0a',
                      }}>
                        <Phone size={13} /> Call Now
                      </a>
                      <button onClick={()=>{ setOnboarding(p=>({...p, name:selectedDemo.restaurant||'', contact:selectedDemo.phone||'', tableCount:selectedDemo.tables||'12'})); navTo('onboard'); }} style={{
                        padding:'11px', background:'rgba(138,112,77,0.07)',
                        border:`1px solid rgba(138,112,77,0.25)`, color:'#8a704d',
                        borderRadius:9, fontSize:13, fontWeight:500, cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                      }}>
                        <UserPlus size={13} /> Onboard This Client
                      </button>
                      {selectedDemo.status!=='Demo Given' && (
                        <button onClick={()=>markDone(selectedDemo._id)} style={{
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
                <button onClick={()=>navTo('onboard')} style={{
                  display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
                  background:'#d3bfa2', color:'#0a0a0a', border:'none', borderRadius:9,
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
              <div className="p-stat-grid" style={{ marginBottom:20 }}>
                {[
                  { icon:IndianRupee, label:'Total Revenue', val:`₹${(stats.totalRevenue||0).toLocaleString()}`, sub:'All time',        accent:'#d3bfa2' },
                  { icon:ShieldCheck, label:'Active',        val:stats.activeCount  ||0,                         sub:'Live subscriptions', accent:'#d3bfa2' },
                  { icon:AlertTriangle,label:'Expired',      val:stats.expiredCount ||0,                         sub:'Need renewal',    accent:C.warning },
                  { icon:Calendar,    label:'Expiring Soon', val:stats.expiringSoon ||0,                         sub:'Within 30 days',  accent:'#8a704d' },
                ].map(k => (
                  <div key={k.label} className="p-card" style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 16px' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${k.accent}14`, border:`1px solid ${k.accent}22`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                      <k.icon size={15} color={k.accent} strokeWidth={1.5} />
                    </div>
                    <div style={{ fontSize:11, color:C.textDim, fontWeight:500, marginBottom:4 }}>{k.label}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:k.accent, lineHeight:1, marginBottom:3, fontFamily:'JetBrains Mono, monospace' }}>{k.val}</div>
                    <div style={{ fontSize:11, color:C.textDim }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Warning banner */}
              {(stats.expiringSoon||0)>0 && (
                <div style={{ background:'rgba(138,112,77,0.05)', border:`1px solid rgba(138,112,77,0.22)`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <AlertCircle size={16} color='#8a704d' strokeWidth={1.5} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{stats.expiringSoon} subscription{stats.expiringSoon>1?'s':''} expiring within 30 days</div>
                    <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>Reach out proactively before expiry</div>
                  </div>
                  <button onClick={()=>{ setClientFilter('active'); navTo('clients'); }} style={{
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
                  {clients.sort((a,b)=>(b.totalPaidAmount||0)-(a.totalPaidAmount||0)).slice(0,6).map((c,i) => (
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
                          width:`${Math.min(100,((c.totalPaidAmount||0)/Math.max(clients[0]?.totalPaidAmount||1,1))*100)}%` }} />
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
                    <button onClick={()=>navTo('onboard')} style={{
                      flex:1, padding:'10px', background:'#d3bfa2', border:'none', color:'#0a0a0a',
                      borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    }}>
                      <UserPlus size={12} /> Onboard
                    </button>
                    {/* secondary: dark amber outline */}
                    <button onClick={()=>navTo('clients')} style={{
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
                  <button onClick={()=>navTo('onboard')} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'9px 14px',
                    background:'#d3bfa2', border:'none', color:'#0a0a0a',
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
                { id:'active',   label:'Active',   count:stats.activeCount  ||0 },
                { id:'expired',  label:'Expired',  count:stats.expiredCount ||0 },
                { id:'disabled', label:'Disabled', count:stats.disabledCount||0 },
              ].map(f => (
                <button key={f.id} onClick={()=>setClientFilter(f.id)} style={filterTab(clientFilter===f.id)}>
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
                            <ClientStatusDot client={client} now={now} />
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
                            {client.config?.planExpiry ? new Date(client.config.planExpiry).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                          </div>
                          {dl!==null && (
                            <div style={{ fontSize:11, fontWeight:500, marginTop:2, color: dl<=0?C.danger:dl<=30?'#8a704d':C.textDim }}>
                              {dl<=0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`}
                            </div>
                          )}
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
                            <button onClick={()=>handleToggle(client)} style={{
                              padding:'5px 10px', borderRadius:7, fontSize:12, fontWeight:500,
                              cursor:'pointer', background:'transparent',
                              border:`1px solid ${client.isActive ? `${C.danger}35` : 'rgba(211,191,162,0.25)'}`,
                              color: client.isActive ? C.danger : '#d3bfa2',
                              display:'flex', alignItems:'center', gap:4,
                            }}>
                              <Power size={10} />
                              <span className="hide-sm">{client.isActive ? 'Disable' : 'Enable'}</span>
                            </button>
                            <button onClick={()=>handleRenew(client)} style={{
                              padding:'5px 11px', borderRadius:7, fontSize:12, fontWeight:600,
                              cursor:'pointer', whiteSpace:'nowrap',
                              /* expired/disabled → solid light gold; active → dark amber outline */
                              background: (st.label==='Expired'||st.label==='Disabled') ? '#d3bfa2' : 'transparent',
                              border: (st.label==='Expired'||st.label==='Disabled') ? 'none' : `1px solid rgba(138,112,77,0.3)`,
                              color: (st.label==='Expired'||st.label==='Disabled') ? '#0a0a0a' : '#8a704d',
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
                      <button onClick={()=>setOnboardSuccess(null)} style={{ background:C.bgCard, border:`1px solid ${C.border}`, color:C.textDim, padding:7, borderRadius:7, cursor:'pointer', display:'flex' }}>
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
                            <button onClick={()=>copyText(r.val, r.key)} style={{ background:'transparent', border:'none', cursor:'pointer', flexShrink:0, color: copied===r.key ? '#d3bfa2' : C.textDim }}>
                              {copied===r.key ? <Check size={13}/> : <Copy size={13}/>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color:C.textDim, display:'flex', alignItems:'center', gap:6 }}>
                      <AlertCircle size={11}/> Save credentials — password cannot be recovered after closing.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {onboardError && (
                <div style={{ background:'rgba(192,96,64,0.06)', border:`1px solid rgba(192,96,64,0.2)`, borderRadius:9, padding:'11px 14px', marginBottom:18, fontSize:13, color:C.danger, display:'flex', alignItems:'center', gap:8 }}>
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
                    <LabeledInput label="Google Review Link">
                      <input className="p-inp" style={inp} placeholder="https://g.page/..." value={onboarding.googleReview} onChange={e=>setOnboarding(p=>({...p,googleReview:e.target.value}))} />
                    </LabeledInput>
                    <LabeledInput label="Instagram Handle">
                      <input className="p-inp" style={inp} placeholder="@jayambefusion" value={onboarding.instaId} onChange={e=>setOnboarding(p=>({...p,instaId:e.target.value}))} />
                    </LabeledInput>
                  </div>
                </div>

                {/* Submit — primary: light gold solid; secondary: ghost */}
                <div style={{ display:'flex', gap:10, paddingBottom:20 }}>
                  <button onClick={handleOnboard} disabled={onboardLoading} style={{
                    flex:2, padding:'13px', borderRadius:10, border:'none',
                    background: onboardLoading ? C.bgCard2 : '#d3bfa2',
                    color: onboardLoading ? C.textDim : '#0a0a0a',
                    cursor: onboardLoading ? 'not-allowed' : 'pointer',
                    fontSize:14, fontWeight:600,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  }}>
                    {onboardLoading
                      ? <><RefreshCcw size={14} style={{ animation:'spin 0.9s linear infinite' }}/> Onboarding…</>
                      : <><UserPlus size={14}/> Onboard Client &amp; Generate Access</>
                    }
                  </button>
                  <button onClick={()=>setOnboarding({ name:'', businessType:'Restaurant', ownerName:'', contact:'', gstin:'', street:'', city:'', state:'', pincode:'', tableCount:'12', taxPercentage:'5', username:'', password:'', confirmPassword:'', planMonths:'12', paidAmount:'', googleReview:'', instaId:'' })}
                    style={{ flex:1, padding:'13px', background:'transparent', border:`1px solid ${C.border}`, color:C.textDim, borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer' }}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}