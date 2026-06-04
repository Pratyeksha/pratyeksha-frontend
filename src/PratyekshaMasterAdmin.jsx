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

/* ── Global Styles ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body, html {
    overflow: hidden !important;
    width: 100vw; height: 100vh;
    background: #0a0800;
    font-family: 'DM Sans', sans-serif;
    color: #e8dcc8;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2416; border-radius: 99px; }
  .no-sb::-webkit-scrollbar { display: none; }
  .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
  input, select, textarea { font-family: 'DM Sans', sans-serif; }
  a { text-decoration: none; color: inherit; }

  /* ── Sidebar ── */
  .p-sidebar {
    width: 260px; min-width: 260px; height: 100vh;
    background: #070600;
    border-right: 1px solid #1c1810;
    display: flex; flex-direction: column;
    flex-shrink: 0; overflow: hidden;
    transition: transform 0.28s cubic-bezier(.4,0,.2,1);
    position: relative; z-index: 149;
  }
  .p-sidebar-inner {
    display: flex; flex-direction: column;
    height: 100%; overflow-y: auto; padding: 28px 18px;
  }

  /* ── Mobile topbar ── */
  .p-topbar {
    display: none; position: fixed; top: 0; left: 0; right: 0;
    height: 52px; background: #070600;
    border-bottom: 1px solid #1c1810;
    z-index: 160; align-items: center;
    justify-content: space-between; padding: 0 16px;
  }

  /* ── Backdrop ── */
  .p-backdrop {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.75); z-index: 148;
    backdrop-filter: blur(3px);
  }

  /* ── Input focus ── */
  .p-inp { transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
  .p-inp:focus { border-color: rgba(193,155,90,0.5) !important; box-shadow: 0 0 0 3px rgba(193,155,90,0.06) !important; }

  /* ── Form grid ── */
  .p-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .p-stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
  .p-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* ── Filter bar ── */
  .p-filterbar { display: flex; border-bottom: 1px solid #111008; flex-shrink: 0; background: #070600; overflow-x: auto; }
  .p-filterbar::-webkit-scrollbar { display: none; }

  /* ── Main scroll areas ── */
  .p-scroll { flex: 1; overflow-y: auto; }
  .p-pad { padding: 24px 36px 48px; }
  .p-pad-sm { padding: 16px 18px 40px; }

  /* ── Hover row ── */
  .p-row { transition: background 0.12s; }
  .p-row:hover { background: #0f0d06 !important; }

  /* ── Card hover ── */
  .p-card { transition: border-color 0.18s, box-shadow 0.18s; }
  .p-card:hover { border-color: rgba(193,155,90,0.22) !important; box-shadow: 0 0 0 1px rgba(193,155,90,0.06) !important; }

  /* ── Button hover ── */
  .p-btn-ghost:hover { background: rgba(193,155,90,0.08) !important; color: #c19b5a !important; }

  /* ── Demo card ── */
  .p-demo-card { transition: background 0.12s, border-color 0.12s; cursor: pointer; }
  .p-demo-card:hover { background: #0f0d06 !important; border-color: rgba(193,155,90,0.15) !important; }

  /* ── Animations ── */
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse-gold {
    0%,100% { box-shadow: 0 0 0 0 rgba(193,155,90,0); }
    50% { box-shadow: 0 0 0 6px rgba(193,155,90,0.08); }
  }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .p-stat-grid { grid-template-columns: repeat(2,1fr); }
    .p-chart-grid { grid-template-columns: 1fr; }
    .p-pad { padding: 20px 24px 40px; }
    .p-sidebar { width: 230px; min-width: 230px; }
  }
  @media (max-width: 768px) {
    .p-topbar { display: flex; }
    .p-sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 80vw; max-width: 280px;
      transform: translateX(-100%);
      z-index: 160;
    }
    .p-sidebar.open { transform: translateX(0); }
    .p-backdrop.open { display: block; }
    .p-main { padding-top: 52px !important; }
    .p-stat-grid { grid-template-columns: 1fr 1fr; }
    .p-form-grid { grid-template-columns: 1fr; }
    .p-pad { padding: 16px 16px 40px; }
    .p-chart-grid { grid-template-columns: 1fr; }
    .hide-mob { display: none !important; }
    .p-header { padding: 16px 16px 12px !important; }
    .p-drawer {
      position: fixed !important; inset: 52px 0 0 0 !important;
      width: 100vw !important; max-width: 100vw !important;
      z-index: 170 !important; border-left: none !important;
    }
    .p-demo-list { flex: 1 !important; }
    .p-demo-list.has-detail { display: none !important; }
  }
  @media (max-width: 480px) {
    .p-stat-grid { grid-template-columns: 1fr; }
    .hide-sm { display: none !important; }
    .p-pad { padding: 12px 12px 40px; }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('p-admin-styles')) {
  const s = document.createElement('style');
  s.id = 'p-admin-styles';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const C = {
  bg:        '#0a0800',
  bgDark:    '#070600',
  bgCard:    '#0d0b05',
  bgCard2:   '#100e07',
  border:    '#1c1810',
  borderMid: '#252010',
  gold:      '#c19b5a',
  goldLight: '#d4af7a',
  goldDim:   '#8a6d3a',
  goldFaint: 'rgba(193,155,90,0.08)',
  amber:     '#b87333',
  amberDim:  '#7a4d1e',
  bronze:    '#8B5E3C',
  text:      '#e8dcc8',
  textMid:   '#a0906e',
  textDim:   '#5a4e38',
  textFaint: '#2e2818',
  warning:   '#d4903a',
  danger:    '#c07830',
  success:   '#b89850',
};

/* ─────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────── */

const Pill = ({ children, color = C.gold, bg }) => (
  <span style={{
    fontSize: '0.5rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    background: bg || `rgba(193,155,90,0.1)`,
    color, border: `1px solid ${color}33`,
    letterSpacing: '0.8px', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif'
  }}>
    {children}
  </span>
);

const StatusChip = ({ status }) => {
  const map = {
    'Pending':      { c: C.gold,    bg: 'rgba(193,155,90,0.1)',  label: 'PENDING' },
    'Contacted':    { c: C.amber,   bg: 'rgba(184,115,51,0.1)', label: 'CONTACTED' },
    'Demo Given':   { c: C.textMid, bg: 'rgba(160,144,110,0.08)', label: 'DONE' },
  };
  const s = map[status] || map['Pending'];
  return (
    <span style={{
      fontSize: '0.48rem', fontWeight: 800, padding: '3px 9px', borderRadius: 99,
      background: s.bg, color: s.c, border: `1px solid ${s.c}44`,
      letterSpacing: '1px', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif'
    }}>
      {s.label}
    </span>
  );
};

const ClientStatusDot = ({ client, now }) => {
  if (!client.isActive) return <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.danger, display: 'inline-block', flexShrink: 0 }} />;
  const exp = client.config?.planExpiry;
  if (!exp || new Date(exp) < now) return <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.warning, display: 'inline-block', flexShrink: 0 }} />;
  const soon = new Date(now); soon.setDate(soon.getDate() + 30);
  if (new Date(exp) <= soon) return <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.goldLight, display: 'inline-block', animation: 'pulse-gold 2s infinite', flexShrink: 0 }} />;
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, display: 'inline-block', flexShrink: 0 }} />;
};

const LabeledInput = ({ label, required, hint, children }) => (
  <div>
    <label style={{
      display: 'block', marginBottom: 7,
      fontSize: '0.54rem', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
      color: required ? C.gold : C.textDim, fontFamily: 'Syne, sans-serif'
    }}>
      {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: '0.55rem', color: C.textFaint, marginTop: 5 }}>{hint}</div>}
  </div>
);

const inp = {
  width: '100%', padding: '11px 14px',
  background: '#0a0800', border: `1px solid ${C.borderMid}`,
  color: C.text, borderRadius: 10, fontSize: '0.82rem',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'DM Sans, sans-serif',
};

const SectionDivider = () => (
  <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.borderMid}, transparent)`, margin: '18px 0' }} />
);

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export default function PratyekshaMasterAdmin() {
  // Default to demos tab on first load
  const [activeSection, setActiveSection] = useState('demos');
  const [clients,       setClients]       = useState([]);
  const [stats,         setStats]         = useState({ totalRevenue: 0, activeCount: 0, expiredCount: 0, disabledCount: 0, expiringSoon: 0, topClients: [], totalClients: 0 });
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [clientFilter,  setClientFilter]  = useState('all');

  const [demoRequests,  setDemoRequests]  = useState([]);
  const [demoLoading,   setDemoLoading]   = useState(false);
  const [demoFilter,    setDemoFilter]    = useState('Pending');
  const [demoSearch,    setDemoSearch]    = useState('');
  const [selectedDemo,  setSelectedDemo]  = useState(null);

  const [onboarding, setOnboarding] = useState({
    name: '', businessType: 'Restaurant', ownerName: '', contact: '', gstin: '',
    street: '', city: '', state: '', pincode: '',
    tableCount: '12', taxPercentage: '5',
    username: '', password: '', confirmPassword: '',
    planMonths: '12', paidAmount: '', googleReview: '', instaId: ''
  });
  const [onboardLoading,  setOnboardLoading]  = useState(false);
  const [onboardSuccess,  setOnboardSuccess]  = useState(null);
  const [onboardError,    setOnboardError]    = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [copied,          setCopied]          = useState('');

  const now = new Date();

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/master/tenants`),
        axios.get(`${BASE_URL}/admin/master/analytics`),
      ]);
      setClients(cRes.data || []);
      setStats(sRes.data || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchDemos = useCallback(async () => {
    setDemoLoading(true);
    try {
      const r = await axios.get(`${BASE_URL}/admin/master/demo-requests`);
      setDemoRequests(r.data || []);
    } catch (e) { console.error(e); }
    finally { setDemoLoading(false); }
  }, []);

  useEffect(() => { fetchData(); fetchDemos(); }, []);

  /* ── Helpers ── */
  const getClientStatus = (c) => {
    if (!c.isActive) return { label: 'DISABLED', color: C.danger };
    const exp = c.config?.planExpiry;
    if (!exp || new Date(exp) < now) return { label: 'EXPIRED', color: C.warning };
    const soon = new Date(now); soon.setDate(soon.getDate() + 30);
    if (new Date(exp) <= soon) return { label: 'EXPIRING', color: C.goldLight };
    return { label: 'ACTIVE', color: C.gold };
  };

  const getDaysLeft = (c) => {
    const exp = c.config?.planExpiry;
    if (!exp) return null;
    return Math.ceil((new Date(exp) - now) / (1000 * 60 * 60 * 24));
  };

  const handleRenew = async (client) => {
    const months = prompt(`Renew "${client.name}" — plan months:`, '12');
    if (!months) return;
    const amt = prompt(`Amount received from ${client.name} (₹):`, '1200');
    if (!amt) return;
    try {
      await axios.patch(`${BASE_URL}/admin/master/renew-subscription/${client._id}`, { planMonths: Number(months), paidAmount: Number(amt) });
      fetchData();
    } catch { alert('Renewal failed.'); }
  };

  const handleToggle = async (client) => {
    const action = client.isActive ? 'disable' : 're-enable';
    if (!window.confirm(`${action.toUpperCase()} account for "${client.name}"?`)) return;
    try {
      await axios.patch(`${BASE_URL}/admin/master/toggle-tenant/${client._id}`);
      fetchData();
    } catch { alert('Toggle failed.'); }
  };

  const markDone = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/demo-requests/${id}`);
      setDemoRequests(p => p.map(r => r._id === id ? { ...r, status: 'Demo Given' } : r));
      if (selectedDemo?._id === id) setSelectedDemo(p => ({ ...p, status: 'Demo Given' }));
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/demo-requests/${id}`, { status });
      setDemoRequests(p => p.map(r => r._id === id ? { ...r, status } : r));
      if (selectedDemo?._id === id) setSelectedDemo(p => ({ ...p, status }));
    } catch (e) { console.error(e); }
  };

  const navTo = (sec) => { setActiveSection(sec); setSidebarOpen(false); setSelectedDemo(null); };
  const refresh = () => { fetchData(); fetchDemos(); };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  /* ── Onboard ── */
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
        tableCount: Number(onboarding.tableCount),
        taxPercentage: Number(onboarding.taxPercentage),
        planMonths: Number(onboarding.planMonths),
        paidAmount: Number(onboarding.paidAmount),
      });
      setOnboardSuccess({ tenantId: res.data.tenantId, username: onboarding.username, password: onboarding.password, name: onboarding.name });
      setOnboarding({ name: '', businessType: 'Restaurant', ownerName: '', contact: '', gstin: '', street: '', city: '', state: '', pincode: '', tableCount: '12', taxPercentage: '5', username: '', password: '', confirmPassword: '', planMonths: '12', paidAmount: '', googleReview: '', instaId: '' });
      fetchData();
    } catch (err) {
      setOnboardError(err.response?.data?.error || 'Onboarding failed.');
    } finally { setOnboardLoading(false); }
  };

  /* ── Derived ── */
  const filteredClients = clients
    .filter(c => {
      if (clientFilter === 'active')   return c.isActive && c.config?.planExpiry && new Date(c.config.planExpiry) > now;
      if (clientFilter === 'expired')  return c.isActive && (!c.config?.planExpiry || new Date(c.config.planExpiry) <= now);
      if (clientFilter === 'disabled') return !c.isActive;
      return true;
    })
    .filter(c => !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.tenantId?.toLowerCase().includes(searchTerm.toLowerCase()) || c.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()));

  const demoCounts = {
    all:          demoRequests.length,
    Pending:      demoRequests.filter(r => r.status === 'Pending').length,
    Contacted:    demoRequests.filter(r => r.status === 'Contacted').length,
    'Demo Given': demoRequests.filter(r => r.status === 'Demo Given').length,
  };

  const filteredDemos = demoRequests.filter(r => {
    const okFilter = demoFilter === 'all' || r.status === demoFilter;
    const okSearch = !demoSearch || r.name?.toLowerCase().includes(demoSearch.toLowerCase()) || r.restaurant?.toLowerCase().includes(demoSearch.toLowerCase()) || r.phone?.includes(demoSearch) || r.city?.toLowerCase().includes(demoSearch.toLowerCase());
    return okFilter && okSearch;
  });

  /* ── Loader ── */
  if (loading) return (
    <div style={{ height: '100vh', background: C.bgDark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${C.borderMid}`, borderTopColor: C.gold, animation: 'spin 0.9s linear infinite' }} />
      <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '4px', color: C.textDim, fontFamily: 'Syne, sans-serif' }}>PRATYEKSHA MAIN</div>
    </div>
  );

  const NavItem = ({ id, label, icon: Icon, count, urgent }) => {
    const isActive = activeSection === id;
    return (
      <button onClick={() => navTo(id)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: 'none',
        background: isActive ? C.goldFaint : 'transparent',
        color: isActive ? C.gold : C.textDim,
        fontSize: '0.66rem', fontWeight: isActive ? 700 : 500, letterSpacing: '0.3px',
        fontFamily: 'Syne, sans-serif', textAlign: 'left',
        outline: isActive ? `1px solid rgba(193,155,90,0.15)` : '1px solid transparent',
        transition: 'all 0.15s',
      }}>
        <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
        <span style={{ flex: 1 }}>{label}</span>
        {count !== undefined && count > 0 && (
          <span style={{
            fontSize: '0.5rem', fontWeight: 800, padding: '1px 6px', borderRadius: 99,
            background: urgent ? `rgba(193,155,90,0.2)` : C.textFaint,
            color: urgent ? C.gold : C.textDim, fontFamily: 'Syne, sans-serif'
          }}>{count}</span>
        )}
      </button>
    );
  };

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: C.bg, color: C.text, overflow: 'hidden', position: 'fixed', top: 0, left: 0, fontFamily: 'DM Sans, sans-serif' }}>

      {/* Mobile topbar */}
      <div className="p-topbar">
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', color: C.gold }}>
          <Menu size={20} />
        </button>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '3px', color: C.gold, fontFamily: 'Syne, sans-serif' }}>PRATYEKSHA</span>
        <button onClick={refresh} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', color: C.textDim }}>
          <RefreshCcw size={16} />
        </button>
      </div>

      {/* Backdrop */}
      <div className={`p-backdrop${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ════════ SIDEBAR ════════ */}
      <aside className={`p-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="p-sidebar-inner no-sb">

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${C.borderMid}` }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `linear-gradient(135deg, ${C.amber}, ${C.gold})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Zap size={15} color="#000" fill="#000" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2.5px', color: C.text, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>PRATYEKSHA</div>
              <div style={{ fontSize: '0.5rem', color: C.textDim, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginTop: 2 }}>CONTROL CENTRE</div>
            </div>
          </div>

          {/* Revenue metric */}
          <div style={{ marginBottom: 24, padding: '16px', background: C.bgCard, border: `1px solid ${C.borderMid}`, borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRadius: '0 12px 0 60px', background: `rgba(193,155,90,0.04)` }} />
            <div style={{ fontSize: '0.5rem', color: C.textDim, fontWeight: 700, letterSpacing: '2px', marginBottom: 8, fontFamily: 'Syne, sans-serif' }}>TOTAL REVENUE</div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: C.gold, fontFamily: 'Syne, sans-serif', lineHeight: 1, marginBottom: 10 }}>
              ₹{(stats.totalRevenue || 0).toLocaleString()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { val: stats.activeCount || 0, lbl: 'Active', c: C.gold },
                { val: stats.expiredCount || 0, lbl: 'Expired', c: C.warning },
                { val: stats.disabledCount || 0, lbl: 'Disabled', c: C.danger },
                { val: stats.totalClients || 0, lbl: 'Total', c: C.textMid },
              ].map(s => (
                <div key={s.lbl} style={{ background: C.bgDark, padding: '7px 9px', borderRadius: 7, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: s.c, lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: '0.48rem', color: C.textDim, fontWeight: 600, marginTop: 3, letterSpacing: '0.5px' }}>{s.lbl.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div style={{ fontSize: '0.48rem', color: C.textFaint, fontWeight: 700, letterSpacing: '2.5px', marginBottom: 8, paddingLeft: 12, fontFamily: 'Syne, sans-serif' }}>NAVIGATION</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 20 }}>
            <NavItem id="demos"     label="Demo Requests"   icon={CalendarClock} count={demoCounts.Pending} urgent />
            <NavItem id="dashboard" label="Dashboard"       icon={BarChart3} />
            <NavItem id="clients"   label="Client Partners" icon={Building2} count={clients.length} />
            <NavItem id="onboard"   label="Onboard Client"  icon={UserPlus} />
          </div>

          <SectionDivider />

          {/* Top clients */}
          <div style={{ fontSize: '0.48rem', color: C.textFaint, fontWeight: 700, letterSpacing: '2.5px', marginBottom: 12, paddingLeft: 4, fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={10} color={C.textDim} /> HIGH BENEFICIARIES
          </div>
          <div className="no-sb" style={{ flex: 1, overflowY: 'auto' }}>
            {(stats.topClients || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '7px 10px', borderRadius: 8, background: C.bgCard }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: C.textFaint, fontFamily: 'Syne, sans-serif', width: 14 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: '0.58rem', color: C.goldDim, fontWeight: 600 }}>₹{(c.revenue || 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <SectionDivider />
          <button onClick={refresh} style={{
            width: '100%', padding: '10px', background: C.bgCard, border: `1px solid ${C.borderMid}`,
            color: C.textDim, borderRadius: 10, fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
          }}>
            <RefreshCcw size={12} /> REFRESH
          </button>
        </div>
      </aside>

      {/* ════════ MAIN ════════ */}
      <main className="p-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>

        {/* ══ DEMO REQUESTS ══ */}
        {activeSection === 'demos' && (
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>

            {/* List panel */}
            <div className={`p-demo-list${selectedDemo ? ' has-detail' : ''}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

              {/* Header */}
              <div className="p-header" style={{ padding: '22px 36px 16px', background: C.bgDark, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.5rem', color: C.textDim, fontWeight: 700, letterSpacing: '3px', fontFamily: 'Syne, sans-serif', marginBottom: 5 }}>INBOUND PIPELINE</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text, letterSpacing: '-0.5px', lineHeight: 1 }}>Demo Requests</h1>
                    <div style={{ fontSize: '0.66rem', color: C.textDim, marginTop: 5 }}>
                      <span style={{ color: C.gold, fontWeight: 700 }}>{demoCounts.Pending}</span> pending · {demoCounts.Contacted} contacted · {demoCounts['Demo Given']} completed
                    </div>
                  </div>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={13} color={C.textDim} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input className="p-inp" placeholder="Search requests…" value={demoSearch}
                      onChange={e => setDemoSearch(e.target.value)}
                      style={{ ...inp, paddingLeft: 38, width: 200, borderRadius: 10, fontSize: '0.76rem' }} />
                  </div>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="p-filterbar" style={{ padding: '0 36px' }}>
                {[
                  { id: 'all', label: 'ALL', count: demoCounts.all },
                  { id: 'Pending', label: 'PENDING', count: demoCounts.Pending, urgent: true },
                  { id: 'Contacted', label: 'CONTACTED', count: demoCounts.Contacted },
                  { id: 'Demo Given', label: 'DONE', count: demoCounts['Demo Given'] },
                ].map(f => (
                  <button key={f.id} onClick={() => setDemoFilter(f.id)} style={{
                    padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: '0.58rem', fontWeight: 700, letterSpacing: '1px', whiteSpace: 'nowrap', flexShrink: 0,
                    color: demoFilter === f.id ? C.gold : C.textDim,
                    borderBottom: `2px solid ${demoFilter === f.id ? C.gold : 'transparent'}`,
                    fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 7,
                    transition: 'all 0.15s',
                  }}>
                    {f.label}
                    {f.count > 0 && (
                      <span style={{
                        fontSize: '0.5rem', fontWeight: 800, padding: '1px 7px', borderRadius: 99,
                        background: demoFilter === f.id ? 'rgba(193,155,90,0.15)' : C.bgCard,
                        color: demoFilter === f.id ? C.gold : C.textDim,
                        border: `1px solid ${demoFilter === f.id ? 'rgba(193,155,90,0.3)' : C.border}`,
                        fontFamily: 'Syne, sans-serif'
                      }}>{f.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="p-scroll no-sb" style={{ padding: '16px 36px 40px' }}>
                {demoLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: C.textFaint }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${C.borderMid}`, borderTopColor: C.gold, animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '2px', fontFamily: 'Syne, sans-serif' }}>LOADING</div>
                  </div>
                ) : filteredDemos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 0', color: C.textFaint }}>
                    <CalendarClock size={32} color={C.borderMid} style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>NO REQUESTS FOUND</div>
                  </div>
                ) : filteredDemos.map(req => {
                  const isSelected = selectedDemo?._id === req._id;
                  return (
                    <motion.div key={req._id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="p-demo-card"
                      onClick={() => setSelectedDemo(isSelected ? null : req)}
                      style={{
                        padding: '16px 18px', borderRadius: 14, marginBottom: 8,
                        background: isSelected ? C.bgCard2 : C.bgCard,
                        border: `1px solid ${isSelected ? 'rgba(193,155,90,0.25)' : C.border}`,
                        borderLeft: `3px solid ${isSelected ? C.gold : 'transparent'}`,
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: C.text }}>{req.name}</span>
                            <StatusChip status={req.status} />
                          </div>
                          <div style={{ fontSize: '0.72rem', color: C.goldDim, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {req.restaurant}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                          {req.status !== 'Demo Given' && (
                            <button onClick={e => { e.stopPropagation(); markDone(req._id); }} style={{
                              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                              background: C.goldFaint, border: `1px solid rgba(193,155,90,0.2)`,
                              color: C.gold, borderRadius: 7, fontSize: '0.52rem', fontWeight: 700,
                              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif',
                            }}>
                              <CheckCircle2 size={11} /> DONE
                            </button>
                          )}
                          <ChevronRight size={14} color={isSelected ? C.gold : C.textDim} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.64rem', color: C.textDim }}>
                          <Phone size={10} color={C.textDim} strokeWidth={1.5} />
                          {req.phone}
                        </div>
                        {req.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.64rem', color: C.textDim }} className="hide-mob">
                            <MapPin size={10} color={C.textDim} strokeWidth={1.5} />
                            {req.city}
                          </div>
                        )}
                        {req.type && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.64rem', color: C.textDim }} className="hide-mob">
                            <Utensils size={10} color={C.textDim} strokeWidth={1.5} />
                            {req.type}
                          </div>
                        )}
                        <div style={{ marginLeft: 'auto', fontSize: '0.6rem', color: C.textFaint, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={9} color={C.textFaint} strokeWidth={1.5} />
                          {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
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
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ width: 340, background: C.bgDark, borderLeft: `1px solid ${C.border}`, height: '100%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <div className="no-sb" style={{ height: '100%', overflowY: 'auto', padding: '24px 22px' }}>

                    {/* Drawer header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: '0.48rem', color: C.textDim, fontWeight: 700, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>DEMO DETAIL</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, fontFamily: 'Syne, sans-serif' }}>{selectedDemo.name}</div>
                        <div style={{ fontSize: '0.72rem', color: C.goldDim, marginTop: 3 }}>{selectedDemo.restaurant}</div>
                      </div>
                      <button onClick={() => setSelectedDemo(null)} style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.textDim, padding: 7, borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                        <X size={14} />
                      </button>
                    </div>

                    {/* Status updater */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: '0.48rem', color: C.textDim, fontWeight: 700, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 10 }}>UPDATE STATUS</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                        {['Pending', 'Contacted', 'Demo Given'].map(s => {
                          const isActive = selectedDemo.status === s;
                          const colors = { 'Pending': C.gold, 'Contacted': C.amber, 'Demo Given': C.textMid };
                          const c = colors[s];
                          return (
                            <button key={s} onClick={() => updateStatus(selectedDemo._id, s)} style={{
                              padding: '8px 4px', borderRadius: 9, border: `1px solid ${isActive ? c + '44' : C.border}`,
                              background: isActive ? `${c}12` : 'transparent',
                              color: isActive ? c : C.textDim,
                              fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer',
                              fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', transition: 'all 0.15s',
                            }}>
                              {s === 'Demo Given' ? 'DONE' : s.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <SectionDivider />

                    {/* Contact section */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: '0.48rem', color: C.textDim, fontWeight: 700, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 14 }}>CONTACT</div>
                      {[
                        { icon: Phone, label: 'MOBILE', val: selectedDemo.phone, href: `tel:${selectedDemo.phone}` },
                        selectedDemo.email && { icon: Mail, label: 'EMAIL', val: selectedDemo.email, href: `mailto:${selectedDemo.email}` },
                        selectedDemo.city && { icon: MapPin, label: 'CITY', val: selectedDemo.city },
                      ].filter(Boolean).map(row => (
                        <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.bgCard, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <row.icon size={12} color={C.goldDim} strokeWidth={1.5} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.46rem', color: C.textDim, fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>{row.label}</div>
                            {row.href
                              ? <a href={row.href} style={{ fontSize: '0.78rem', fontWeight: 600, color: C.gold }}>{row.val}</a>
                              : <div style={{ fontSize: '0.78rem', fontWeight: 600, color: C.text }}>{row.val}</div>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                    <SectionDivider />

                    {/* Establishment */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: '0.48rem', color: C.textDim, fontWeight: 700, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 14 }}>ESTABLISHMENT</div>
                      {[
                        { l: 'NAME',   v: selectedDemo.restaurant },
                        { l: 'TYPE',   v: selectedDemo.type   || '—' },
                        { l: 'TABLES', v: selectedDemo.tables || '—' },
                      ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '0.55rem', color: C.textDim, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{r.l}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: C.text }}>{r.v}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0' }}>
                        <span style={{ fontSize: '0.55rem', color: C.textDim, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>SUBMITTED</span>
                        <span style={{ fontSize: '0.68rem', color: C.textMid }}>
                          {new Date(selectedDemo.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <SectionDivider />

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <a href={`tel:${selectedDemo.phone}`} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '13px', background: `linear-gradient(135deg, ${C.amber}, ${C.gold})`,
                        borderRadius: 11, fontSize: '0.68rem', fontWeight: 800,
                        color: '#000', fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
                      }}>
                        <Phone size={13} /> CALL NOW
                      </a>
                      <button onClick={() => {
                        setOnboarding(p => ({ ...p, name: selectedDemo.restaurant || '', contact: selectedDemo.phone || '', tableCount: selectedDemo.tables || '12' }));
                        navTo('onboard');
                      }} style={{
                        padding: '12px', background: C.goldFaint,
                        border: `1px solid rgba(193,155,90,0.2)`, color: C.gold,
                        borderRadius: 11, fontSize: '0.66rem', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 7, fontFamily: 'Syne, sans-serif',
                      }}>
                        <UserPlus size={13} /> ONBOARD THIS CLIENT
                      </button>
                      {selectedDemo.status !== 'Demo Given' && (
                        <button onClick={() => markDone(selectedDemo._id)} style={{
                          padding: '12px', background: C.bgCard,
                          border: `1px solid ${C.border}`, color: C.textMid,
                          borderRadius: 11, fontSize: '0.66rem', fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: 7, fontFamily: 'Syne, sans-serif',
                        }}>
                          <CheckCircle2 size={13} /> MARK DEMO DONE
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
        {activeSection === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="p-header" style={{ padding: '22px 36px 16px', background: C.bgDark, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.5rem', color: C.textDim, fontWeight: 700, letterSpacing: '3px', fontFamily: 'Syne, sans-serif', marginBottom: 5 }}>OVERVIEW</div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text, letterSpacing: '-0.5px', lineHeight: 1 }}>Dashboard</h1>
                </div>
                <button onClick={() => navTo('onboard')} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                  background: `linear-gradient(135deg, ${C.amber}, ${C.gold})`,
                  color: '#000', border: 'none', borderRadius: 11, fontSize: '0.66rem',
                  fontWeight: 800, cursor: 'pointer', fontFamily: 'Syne, sans-serif', letterSpacing: '0.3px',
                }}>
                  <UserPlus size={13} /> ONBOARD CLIENT
                </button>
              </div>
            </div>

            <div className="p-scroll no-sb p-pad">

              {/* KPI grid */}
              <div className="p-stat-grid" style={{ marginBottom: 24 }}>
                {[
                  { icon: IndianRupee, label: 'TOTAL REVENUE', val: `₹${(stats.totalRevenue || 0).toLocaleString()}`, sub: 'All time', accent: C.gold },
                  { icon: ShieldCheck, label: 'ACTIVE',        val: stats.activeCount || 0,   sub: 'Live subscriptions', accent: C.gold },
                  { icon: AlertTriangle, label: 'EXPIRED',     val: stats.expiredCount || 0,  sub: 'Need renewal',      accent: C.warning },
                  { icon: Calendar,    label: 'EXPIRING SOON', val: stats.expiringSoon || 0,  sub: 'Within 30 days',    accent: C.amber },
                ].map(k => (
                  <div key={k.label} className="p-card" style={{
                    background: C.bgCard, border: `1px solid ${C.border}`,
                    borderTop: `2px solid ${k.accent}30`,
                    borderRadius: 16, padding: '20px 18px', position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 50, height: 50, borderRadius: '0 16px 0 50px', background: `${k.accent}06` }} />
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${k.accent}12`, border: `1px solid ${k.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      <k.icon size={17} color={k.accent} strokeWidth={1.5} />
                    </div>
                    <div style={{ fontSize: '0.5rem', color: C.textDim, fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: k.accent, fontFamily: 'Syne, sans-serif', lineHeight: 1, marginBottom: 4 }}>{k.val}</div>
                    <div style={{ fontSize: '0.58rem', color: C.textDim }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Expiry warning */}
              {(stats.expiringSoon || 0) > 0 && (
                <div style={{
                  background: 'rgba(184,115,51,0.06)', border: `1px solid rgba(184,115,51,0.2)`,
                  borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center',
                  gap: 14, marginBottom: 20
                }}>
                  <AlertCircle size={17} color={C.amber} strokeWidth={1.5} />
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: C.amber, fontFamily: 'Syne, sans-serif' }}>
                      {stats.expiringSoon} subscription{stats.expiringSoon > 1 ? 's' : ''} expiring within 30 days
                    </div>
                    <div style={{ fontSize: '0.62rem', color: C.textDim, marginTop: 3 }}>Reach out proactively before expiry</div>
                  </div>
                  <button onClick={() => { setClientFilter('active'); navTo('clients'); }} style={{
                    marginLeft: 'auto', padding: '7px 14px',
                    background: 'rgba(184,115,51,0.1)', border: `1px solid rgba(184,115,51,0.25)`,
                    color: C.amber, borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif', flexShrink: 0,
                  }}>
                    VIEW →
                  </button>
                </div>
              )}

              {/* Charts */}
              <div className="p-chart-grid">

                {/* Top earners */}
                <div className="p-card" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <Trophy size={14} color={C.goldDim} strokeWidth={1.5} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.textDim, letterSpacing: '1.5px', fontFamily: 'Syne, sans-serif' }}>TOP REVENUE CLIENTS</span>
                  </div>
                  {clients.sort((a, b) => (b.totalPaidAmount || 0) - (a.totalPaidAmount || 0)).slice(0, 6).map((c, i) => (
                    <div key={c._id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.6rem', color: C.textFaint, fontFamily: 'Syne, sans-serif', minWidth: 14 }}>#{i + 1}</span>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: C.text }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.gold }}>₹{(c.totalPaidAmount || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ height: 3, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          width: `${Math.min(100, ((c.totalPaidAmount || 0) / Math.max(clients[0]?.totalPaidAmount || 1, 1)) * 100)}%`,
                          background: `linear-gradient(90deg, ${C.amber}, ${C.gold})`,
                          transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status breakdown + quick actions */}
                <div className="p-card" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <BarChart3 size={14} color={C.goldDim} strokeWidth={1.5} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.textDim, letterSpacing: '1.5px', fontFamily: 'Syne, sans-serif' }}>SUBSCRIPTION HEALTH</span>
                  </div>
                  {[
                    { label: 'ACTIVE',   val: stats.activeCount   || 0, c: C.gold,    pct: ((stats.activeCount   || 0) / Math.max(stats.totalClients || 1, 1)) * 100 },
                    { label: 'EXPIRED',  val: stats.expiredCount  || 0, c: C.warning, pct: ((stats.expiredCount  || 0) / Math.max(stats.totalClients || 1, 1)) * 100 },
                    { label: 'DISABLED', val: stats.disabledCount || 0, c: C.danger,  pct: ((stats.disabledCount || 0) / Math.max(stats.totalClients || 1, 1)) * 100 },
                  ].map(s => (
                    <div key={s.label} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.58rem', color: s.c, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '1px' }}>{s.label}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.text }}>{s.val} <span style={{ color: C.textDim, fontSize: '0.58rem' }}>({Math.round(s.pct)}%)</span></span>
                      </div>
                      <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s.pct}%`, background: s.c, borderRadius: 99, transition: 'width 0.8s ease', opacity: 0.8 }} />
                      </div>
                    </div>
                  ))}
                  <SectionDivider />
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button onClick={() => navTo('onboard')} style={{
                      flex: 1, padding: '11px', background: `linear-gradient(135deg, ${C.amber}, ${C.gold})`,
                      border: 'none', color: '#000', borderRadius: 10, fontSize: '0.62rem',
                      fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6, fontFamily: 'Syne, sans-serif',
                    }}>
                      <UserPlus size={12} /> ONBOARD
                    </button>
                    <button onClick={() => navTo('clients')} style={{
                      flex: 1, padding: '11px', background: 'transparent',
                      border: `1px solid rgba(193,155,90,0.2)`, color: C.gold,
                      borderRadius: 10, fontSize: '0.62rem', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6, fontFamily: 'Syne, sans-serif',
                    }}>
                      <Building2 size={12} /> CLIENTS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ CLIENTS ══ */}
        {activeSection === 'clients' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="p-header" style={{ padding: '22px 36px 16px', background: C.bgDark, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.5rem', color: C.textDim, fontWeight: 700, letterSpacing: '3px', fontFamily: 'Syne, sans-serif', marginBottom: 5 }}>ACCOUNTS</div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text, letterSpacing: '-0.5px', lineHeight: 1 }}>Client Partners</h1>
                  <div style={{ fontSize: '0.66rem', color: C.textDim, marginTop: 5 }}>{filteredClients.length} of {clients.length} shown</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} color={C.textDim} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input className="p-inp" placeholder="Search…" value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{ ...inp, paddingLeft: 38, width: 190, borderRadius: 10, fontSize: '0.76rem' }} />
                  </div>
                  <button onClick={() => navTo('onboard')} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px',
                    background: `linear-gradient(135deg, ${C.amber}, ${C.gold})`,
                    border: 'none', color: '#000', borderRadius: 10, fontSize: '0.62rem',
                    fontWeight: 800, cursor: 'pointer', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap',
                  }}>
                    <Plus size={12} /> NEW CLIENT
                  </button>
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="p-filterbar" style={{ padding: '0 36px' }}>
              {[
                { id: 'all', label: 'ALL', count: clients.length },
                { id: 'active', label: 'ACTIVE', count: stats.activeCount || 0 },
                { id: 'expired', label: 'EXPIRED', count: stats.expiredCount || 0 },
                { id: 'disabled', label: 'DISABLED', count: stats.disabledCount || 0 },
              ].map(f => (
                <button key={f.id} onClick={() => setClientFilter(f.id)} style={{
                  padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '1px', whiteSpace: 'nowrap', flexShrink: 0,
                  color: clientFilter === f.id ? C.gold : C.textDim,
                  borderBottom: `2px solid ${clientFilter === f.id ? C.gold : 'transparent'}`,
                  fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'all 0.15s',
                }}>
                  {f.label}
                  <span style={{
                    fontSize: '0.5rem', fontWeight: 800, padding: '1px 7px', borderRadius: 99,
                    background: clientFilter === f.id ? 'rgba(193,155,90,0.15)' : C.bgCard,
                    color: clientFilter === f.id ? C.gold : C.textDim,
                    border: `1px solid ${clientFilter === f.id ? 'rgba(193,155,90,0.3)' : C.border}`,
                    fontFamily: 'Syne, sans-serif',
                  }}>{f.count}</span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="p-scroll no-sb" style={{ padding: '16px 36px 40px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px', minWidth: 480 }}>
                <thead>
                  <tr style={{ fontSize: '0.5rem', color: C.textDim, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'Syne, sans-serif' }}>
                    <th style={{ paddingLeft: 16, paddingBottom: 8, textAlign: 'left', fontWeight: 700 }}>PARTNER</th>
                    <th className="hide-mob" style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 700 }}>TYPE</th>
                    <th className="hide-mob" style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 700 }}>EXPIRY</th>
                    <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 700 }}>STATUS</th>
                    <th className="hide-mob" style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 700 }}>REVENUE</th>
                    <th style={{ paddingBottom: 8, textAlign: 'right', paddingRight: 12, fontWeight: 700 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => {
                    const st = getClientStatus(client);
                    const dl = getDaysLeft(client);
                    return (
                      <motion.tr layout key={client._id} className="p-row" style={{ background: C.bgCard }}>
                        <td style={{ paddingLeft: 16, paddingTop: 13, paddingBottom: 13, borderRadius: '12px 0 0 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ClientStatusDot client={client} now={now} />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{client.name}</div>
                              <div style={{ fontSize: '0.56rem', color: C.textFaint, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{client.tenantId}</div>
                              {client.address?.city && (
                                <div style={{ fontSize: '0.56rem', color: C.textDim, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <MapPin size={8} color={C.textDim} strokeWidth={1.5} />{client.address.city}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hide-mob">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {client.businessType === 'Cafe' ? <Coffee size={11} color={C.textDim} strokeWidth={1.5} /> : <Utensils size={11} color={C.textDim} strokeWidth={1.5} />}
                            <span style={{ color: C.textDim, fontSize: '0.6rem', fontWeight: 600 }}>{(client.businessType || 'Restaurant').toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="hide-mob">
                          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: C.text }}>
                            {client.config?.planExpiry ? new Date(client.config.planExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </div>
                          {dl !== null && (
                            <div style={{ fontSize: '0.58rem', fontWeight: 600, marginTop: 2, color: dl <= 0 ? C.danger : dl <= 30 ? C.warning : C.textDim }}>
                              {dl <= 0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.52rem', fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                            background: `${st.color}12`, color: st.color, border: `1px solid ${st.color}33`,
                            fontFamily: 'Syne, sans-serif', letterSpacing: '0.8px'
                          }}>{st.label}</span>
                        </td>
                        <td className="hide-mob">
                          <span style={{ fontWeight: 700, color: C.gold, fontSize: '0.84rem' }}>₹{(client.totalPaidAmount || 0).toLocaleString()}</span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 12, borderRadius: '0 12px 12px 0' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button onClick={() => handleToggle(client)} style={{
                              padding: '6px 10px', borderRadius: 8, fontSize: '0.56rem', fontWeight: 700,
                              cursor: 'pointer', background: 'transparent',
                              border: `1px solid ${client.isActive ? `${C.danger}44` : `${C.gold}44`}`,
                              color: client.isActive ? C.danger : C.gold,
                              fontFamily: 'Syne, sans-serif',
                              display: 'flex', alignItems: 'center', gap: 5,
                            }}>
                              <Power size={10} />
                              <span className="hide-sm">{client.isActive ? 'DISABLE' : 'ENABLE'}</span>
                            </button>
                            <button onClick={() => handleRenew(client)} style={{
                              padding: '6px 12px', borderRadius: 8, fontSize: '0.58rem', fontWeight: 700,
                              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif',
                              background: st.label === 'EXPIRED' || st.label === 'DISABLED' ? `linear-gradient(135deg, ${C.amber}, ${C.gold})` : 'transparent',
                              border: st.label === 'EXPIRED' || st.label === 'DISABLED' ? 'none' : `1px solid ${C.border}`,
                              color: st.label === 'EXPIRED' || st.label === 'DISABLED' ? '#000' : C.textDim,
                            }}>
                              {st.label === 'ACTIVE' || st.label === 'EXPIRING' ? 'RENEW' : 'ACTIVATE'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredClients.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: C.textFaint }}>
                  <Building2 size={32} color={C.border} style={{ marginBottom: 14 }} />
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>NO CLIENTS FOUND</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ONBOARD ══ */}
        {activeSection === 'onboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="p-header" style={{ padding: '22px 36px 16px', background: C.bgDark, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ fontSize: '0.5rem', color: C.textDim, fontWeight: 700, letterSpacing: '3px', fontFamily: 'Syne, sans-serif', marginBottom: 5 }}>NEW CLIENT</div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text, letterSpacing: '-0.5px', lineHeight: 1 }}>Client Onboarding</h1>
              <div style={{ fontSize: '0.66rem', color: C.textDim, marginTop: 5 }}>Register a restaurant or café on Pratyeksha</div>
            </div>

            <div className="p-scroll no-sb p-pad">

              {/* Success */}
              <AnimatePresence>
                {onboardSuccess && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      background: `rgba(193,155,90,0.06)`, border: `1px solid rgba(193,155,90,0.25)`,
                      borderRadius: 16, padding: '20px 22px', marginBottom: 28
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: '0.52rem', color: C.gold, fontWeight: 800, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 5 }}>CLIENT ONBOARDED ✓</div>
                        <div style={{ fontSize: '0.96rem', fontWeight: 700, color: C.text }}>{onboardSuccess.name}</div>
                      </div>
                      <button onClick={() => setOnboardSuccess(null)} style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.textDim, padding: 7, borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                        <X size={13} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 14 }}>
                      {[
                        { lbl: 'TENANT ID', val: onboardSuccess.tenantId, key: 'tid' },
                        { lbl: 'USERNAME',  val: onboardSuccess.username,  key: 'usr' },
                        { lbl: 'PASSWORD',  val: onboardSuccess.password,  key: 'pwd' },
                      ].map(r => (
                        <div key={r.key} style={{ background: C.bgDark, border: `1px solid rgba(193,155,90,0.15)`, borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontSize: '0.48rem', color: C.gold, fontWeight: 800, letterSpacing: '1.5px', fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>{r.lbl}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <code style={{ fontSize: '0.78rem', color: C.text, fontFamily: 'monospace', wordBreak: 'break-all' }}>{r.val}</code>
                            <button onClick={() => copyText(r.val, r.key)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, color: copied === r.key ? C.gold : C.textDim }}>
                              {copied === r.key ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: C.textDim, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={11} color={C.textDim} /> Save credentials — password cannot be recovered after closing.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {onboardError && (
                <div style={{ background: `rgba(192,120,48,0.08)`, border: `1px solid rgba(192,120,48,0.25)`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.72rem', color: C.danger, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} color={C.danger} /> {onboardError}
                </div>
              )}

              <div style={{ display: 'grid', gap: 20, maxWidth: 880 }}>

                {/* Business Info */}
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.gold}30`, borderRadius: 16, padding: '22px 22px' }}>
                  <div style={{ fontSize: '0.58rem', fontWeight: 800, color: C.gold, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Store size={13} color={C.gold} /> BUSINESS INFORMATION
                  </div>
                  <div className="p-form-grid">
                    <LabeledInput label="Restaurant / Café Name" required>
                      <input className="p-inp" style={inp} placeholder="Jay Ambe Fusion" value={onboarding.name} onChange={e => setOnboarding(p => ({ ...p, name: e.target.value }))} />
                    </LabeledInput>
                    <LabeledInput label="Business Type" required>
                      <select className="p-inp" style={{ ...inp, cursor: 'pointer' }} value={onboarding.businessType} onChange={e => setOnboarding(p => ({ ...p, businessType: e.target.value }))}>
                        <option>Restaurant</option>
                        <option>Cafe</option>
                        <option>Hotel</option>
                      </select>
                    </LabeledInput>
                    <LabeledInput label="Owner Name">
                      <input className="p-inp" style={inp} placeholder="Full name" value={onboarding.ownerName} onChange={e => setOnboarding(p => ({ ...p, ownerName: e.target.value }))} />
                    </LabeledInput>
                    <LabeledInput label="Contact Number">
                      <input className="p-inp" style={inp} placeholder="10-digit mobile" value={onboarding.contact} onChange={e => setOnboarding(p => ({ ...p, contact: e.target.value }))} />
                    </LabeledInput>
                    <LabeledInput label="GSTIN">
                      <input className="p-inp" style={inp} placeholder="27AABCU1234F1Z5" value={onboarding.gstin} onChange={e => setOnboarding(p => ({ ...p, gstin: e.target.value }))} />
                    </LabeledInput>
                    <LabeledInput label="Number of Tables">
                      <input className="p-inp" style={inp} type="number" placeholder="12" value={onboarding.tableCount} onChange={e => setOnboarding(p => ({ ...p, tableCount: e.target.value }))} />
                    </LabeledInput>
                  </div>
                </div>

                {/* Address */}
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 22px' }}>
                  <div style={{ fontSize: '0.58rem', fontWeight: 800, color: C.textDim, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={13} /> ADDRESS
                  </div>
                  <div className="p-form-grid">
                    <div style={{ gridColumn: 'span 2' }}>
                      <LabeledInput label="Street Address">
                        <input className="p-inp" style={inp} placeholder="Shop no., Street name" value={onboarding.street} onChange={e => setOnboarding(p => ({ ...p, street: e.target.value }))} />
                      </LabeledInput>
                    </div>
                    <LabeledInput label="City">
                      <input className="p-inp" style={inp} placeholder="Kolhapur" value={onboarding.city} onChange={e => setOnboarding(p => ({ ...p, city: e.target.value }))} />
                    </LabeledInput>
                    <LabeledInput label="State">
                      <input className="p-inp" style={inp} placeholder="Maharashtra" value={onboarding.state} onChange={e => setOnboarding(p => ({ ...p, state: e.target.value }))} />
                    </LabeledInput>
                    <LabeledInput label="Pincode">
                      <input className="p-inp" style={inp} placeholder="416001" value={onboarding.pincode} onChange={e => setOnboarding(p => ({ ...p, pincode: e.target.value }))} />
                    </LabeledInput>
                    <LabeledInput label="Tax Percentage (%)">
                      <input className="p-inp" style={inp} type="number" placeholder="5" value={onboarding.taxPercentage} onChange={e => setOnboarding(p => ({ ...p, taxPercentage: e.target.value }))} />
                    </LabeledInput>
                  </div>
                </div>

                {/* Credentials */}
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 22px' }}>
                  <div style={{ fontSize: '0.58rem', fontWeight: 800, color: C.textDim, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={13} /> ADMIN CREDENTIALS
                  </div>
                  <div className="p-form-grid">
                    <LabeledInput label="Username" required hint="Used to login to operator portal">
                      <input className="p-inp" style={inp} placeholder="jay_ambe_admin" value={onboarding.username} onChange={e => setOnboarding(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '_') }))} />
                    </LabeledInput>
                    <LabeledInput label="Password" required>
                      <div style={{ position: 'relative' }}>
                        <input className="p-inp" style={{ ...inp, paddingRight: 44 }} type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={onboarding.password} onChange={e => setOnboarding(p => ({ ...p, password: e.target.value }))} />
                        <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: C.textDim }}>
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </LabeledInput>
                    <LabeledInput label="Confirm Password" required>
                      <input className="p-inp" style={{ ...inp, borderColor: onboarding.confirmPassword && onboarding.password !== onboarding.confirmPassword ? `${C.danger}55` : C.borderMid }} type="password" placeholder="Re-enter password" value={onboarding.confirmPassword} onChange={e => setOnboarding(p => ({ ...p, confirmPassword: e.target.value }))} />
                    </LabeledInput>
                  </div>
                </div>

                {/* Subscription & Payment */}
                <div style={{ background: C.bgCard, border: `1px solid rgba(193,155,90,0.15)`, borderTop: `2px solid ${C.amber}33`, borderRadius: 16, padding: '22px 22px' }}>
                  <div style={{ fontSize: '0.58rem', fontWeight: 800, color: C.gold, letterSpacing: '2px', fontFamily: 'Syne, sans-serif', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wallet size={13} color={C.gold} /> SUBSCRIPTION & PAYMENT
                  </div>
                  <div style={{ fontSize: '0.62rem', color: C.textDim, marginBottom: 18 }}>Collect via GPay manually and record below.</div>
                  <div className="p-form-grid">
                    <LabeledInput label="Plan Duration" required>
                      <select className="p-inp" style={{ ...inp, cursor: 'pointer' }} value={onboarding.planMonths} onChange={e => setOnboarding(p => ({ ...p, planMonths: e.target.value }))}>
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year (12 Months)</option>
                      </select>
                    </LabeledInput>
                    <LabeledInput label="Amount Received (₹)" hint="Enter 0 if not yet collected">
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textDim, fontSize: '0.82rem', fontWeight: 700 }}>₹</span>
                        <input className="p-inp" style={{ ...inp, paddingLeft: 26 }} type="number" placeholder="1200" value={onboarding.paidAmount} onChange={e => setOnboarding(p => ({ ...p, paidAmount: e.target.value }))} />
                      </div>
                    </LabeledInput>
                    <LabeledInput label="Google Review Link">
                      <input className="p-inp" style={inp} placeholder="https://g.page/..." value={onboarding.googleReview} onChange={e => setOnboarding(p => ({ ...p, googleReview: e.target.value }))} />
                    </LabeledInput>
                    <LabeledInput label="Instagram Handle">
                      <input className="p-inp" style={inp} placeholder="@jayambefusion" value={onboarding.instaId} onChange={e => setOnboarding(p => ({ ...p, instaId: e.target.value }))} />
                    </LabeledInput>
                  </div>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: 12, paddingBottom: 20 }}>
                  <button onClick={handleOnboard} disabled={onboardLoading} style={{
                    flex: 2, padding: '15px', borderRadius: 12, border: 'none', fontFamily: 'Syne, sans-serif',
                    background: onboardLoading ? C.bgCard : `linear-gradient(135deg, ${C.amber}, ${C.gold})`,
                    color: onboardLoading ? C.textDim : '#000',
                    cursor: onboardLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.5px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}>
                    {onboardLoading
                      ? <><RefreshCcw size={14} style={{ animation: 'spin 0.9s linear infinite' }} /> ONBOARDING…</>
                      : <><UserPlus size={14} /> ONBOARD CLIENT &amp; GENERATE ACCESS</>
                    }
                  </button>
                  <button onClick={() => setOnboarding({ name: '', businessType: 'Restaurant', ownerName: '', contact: '', gstin: '', street: '', city: '', state: '', pincode: '', tableCount: '12', taxPercentage: '5', username: '', password: '', confirmPassword: '', planMonths: '12', paidAmount: '', googleReview: '', instaId: '' })}
                    style={{ flex: 1, padding: '15px', background: 'transparent', border: `1px solid ${C.borderMid}`, color: C.textDim, borderRadius: 12, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                    CLEAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (min-width: 769px) {
          .p-demo-list { display: flex !important; }
          .p-drawer { position: relative !important; flex-shrink: 0 !important; }
        }
      `}</style>
    </div>
  );
}