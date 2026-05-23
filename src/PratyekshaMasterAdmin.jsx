import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, RefreshCcw, Search, TrendingUp, Users, Trophy,
  ShieldCheck, Zap, AlertCircle, Utensils, Coffee,
  CalendarClock, Phone, Mail, MapPin, ChevronRight, CheckCircle2,
  Clock, Layers, X, Menu
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

/* ─────────────────────────────────────────────
   RESPONSIVE CSS — injected once at module level
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body, html {
    overflow: hidden !important;
    margin: 0; padding: 0;
    width: 100vw; height: 100vh;
    background: #000;
    font-family: 'Outfit', sans-serif;
  }
  a { text-decoration: none; }

  .no-sb::-webkit-scrollbar { display: none; }
  .no-sb { -ms-overflow-style: none; scrollbar-width: none; }

  /* ── Sidebar slide-in ── */
  .pma-sidebar {
    width: 280px;
    height: 100vh;
    background: #080808;
    border-right: 1px solid #151515;
    padding: 36px 24px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 149;
    overflow-y: auto;
    transition: transform 0.26s cubic-bezier(.4,0,.2,1);
  }

  /* Mobile topbar */
  .pma-topbar {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 54px;
    background: #080808;
    border-bottom: 1px solid #151515;
    z-index: 160;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
  }

  /* Mobile stat strip (under header in clients view) */
  .pma-mob-stats {
    display: none;
    padding: 10px 14px;
    gap: 8px;
    background: #080808;
    border-bottom: 1px solid #0d0d0d;
    flex-shrink: 0;
  }

  /* Detail drawer — desktop: side panel */
  .pma-drawer {
    width: 340px;
    background: #080808;
    border-left: 1px solid #151515;
    height: 100%;
    flex-shrink: 0;
    overflow: hidden;
  }

  /* hide on mobile */
  .hide-mob  { }
  .hide-sm   { }

  /* ── Filter tab row scrollable ── */
  .pma-filter-row {
    display: flex;
    gap: 0;
    padding: 0 40px;
    border-bottom: 1px solid #111;
    flex-shrink: 0;
    background: #050505;
    overflow-x: auto;
  }
  .pma-filter-row::-webkit-scrollbar { display: none; }

  /* ── Demo list scroll area ── */
  .pma-demo-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 40px 40px;
  }

  /* ── Table wrapper ── */
  .pma-table-wrap {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    padding: 16px 40px 40px;
  }

  /* ── TABLET (≤ 1024px) ── */
  @media (max-width: 1024px) {
    .pma-sidebar { width: 240px; padding: 28px 18px; }
    .pma-table-wrap { padding: 12px 24px 32px; }
    .pma-filter-row { padding: 0 24px; }
    .pma-demo-scroll { padding: 10px 24px 32px; }
    .pma-drawer { width: 300px; }
  }

  /* ── MOBILE (≤ 768px) ── */
  @media (max-width: 768px) {
    /* Show topbar */
    .pma-topbar { display: flex; }

    /* Sidebar: fixed overlay, off-screen by default */
    .pma-sidebar {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: 76vw;
      max-width: 300px;
      padding-top: 20px;
      transform: translateX(-100%);
    }
    .pma-sidebar.open { transform: translateX(0); }

    /* Main feed: push down for topbar */
    .pma-main { padding-top: 54px !important; }

    /* Header inside sections */
    .pma-section-header {
      padding: 16px 16px 12px !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
    }
    .pma-section-header h1 { font-size: 1.25rem !important; }

    /* Search input */
    .pma-search-input { width: 160px !important; }

    /* Mobile stat strip */
    .pma-mob-stats { display: flex; }

    /* Table padding */
    .pma-table-wrap { padding: 10px 14px 28px; }
    .pma-filter-row { padding: 0 14px; }
    .pma-demo-scroll { padding: 10px 14px 28px; }

    /* Drawer: full screen */
    .pma-drawer {
      position: fixed !important;
      inset: 54px 0 0 0 !important;
      width: 100vw !important;
      max-width: 100vw !important;
      z-index: 170 !important;
      border-left: none !important;
    }

    /* Hide less important table cols */
    .hide-mob { display: none !important; }
  }

  /* ── SMALL MOBILE (≤ 480px) ── */
  @media (max-width: 480px) {
    .hide-sm { display: none !important; }
    .pma-search-input { width: 130px !important; }
    .pma-sidebar { width: 85vw; }
  }
`;

/* ─────────────────────────────────────────────
   INJECT GLOBAL CSS once
───────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('pma-styles')) {
  const s = document.createElement('style');
  s.id = 'pma-styles';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────────── */
const Divider = () => <div style={{ height: 1, background: '#151515', margin: '16px 0' }} />;

const StatusBadge = ({ status }) => {
  const map = {
    Pending:      { bg: 'rgba(201,169,110,0.08)', color: '#d3bfa2', border: 'rgba(201,169,110,0.2)' },
    Contacted:    { bg: 'rgba(255,255,255,0.04)', color: '#fff',    border: 'rgba(255,255,255,0.12)' },
    'Demo Given': { bg: 'rgba(255,255,255,0.02)', color: '#555',    border: '#1a1a1a' },
  };
  const st = map[status] || map.Pending;
  return (
    <span style={{
      fontSize: '0.54rem', fontWeight: 900, padding: '2px 8px', borderRadius: '20px',
      background: st.bg, color: st.color, border: `1px solid ${st.border}`,
      letterSpacing: '0.5px', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {status?.toUpperCase()}
    </span>
  );
};

const MetaChip = ({ icon: Icon, label, className = '' }) => (
  <div className={className} style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '0.68rem', color: '#555', fontWeight: 600,
  }}>
    <Icon size={10} color="#555" />
    <span>{label}</span>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function PratyekshaMasterAdmin() {
  const [activeSection, setActiveSection] = useState('clients');
  const [clients,       setClients]       = useState([]);
  const [stats,         setStats]         = useState({ totalRevenue: 0, activeCount: 0, topClients: [] });
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  const [demoRequests,  setDemoRequests]  = useState([]);
  const [demoLoading,   setDemoLoading]   = useState(false);
  const [demoFilter,    setDemoFilter]    = useState('all');
  const [demoSearch,    setDemoSearch]    = useState('');
  const [selectedDemo,  setSelectedDemo]  = useState(null);

  /* ── fetchers ── */
  const fetchData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/master/tenants`),
        axios.get(`${BASE_URL}/admin/master/analytics`),
      ]);
      setClients(cRes.data);
      setStats(sRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDemos = async () => {
    setDemoLoading(true);
    try {
      const r = await axios.get(`${BASE_URL}/admin/master/demo-requests`);
      setDemoRequests(r.data || []);
    } catch (e) { console.error(e); }
    finally { setDemoLoading(false); }
  };

  useEffect(() => { fetchData(); fetchDemos(); }, []);

  /* ── helpers ── */
  const getClientStatus = (c) => {
    const exp = c.config?.planExpiry;
    if (!exp || new Date(exp) < new Date()) return { label: 'PENDING', color: '#ffcc00' };
    return { label: 'ACTIVE', color: '#d3bfa2' };
  };

  const handleActivate = async (id, name) => {
    const amt = prompt(`Enter payment from ${name}:`, '1200');
    if (!amt) return;
    try {
      await axios.patch(`${BASE_URL}/admin/master/settle-subscription/${id}`, { paidAmount: Number(amt) });
      fetchData();
    } catch { alert('Activation failed.'); }
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

  /* ── derived ── */
  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tenantId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const demoCounts = {
    all:          demoRequests.length,
    Pending:      demoRequests.filter(r => r.status === 'Pending').length,
    Contacted:    demoRequests.filter(r => r.status === 'Contacted').length,
    'Demo Given': demoRequests.filter(r => r.status === 'Demo Given').length,
  };

  const filteredDemos = demoRequests.filter(r => {
    const okFilter = demoFilter === 'all' || r.status === demoFilter;
    const okSearch = !demoSearch ||
      r.name?.toLowerCase().includes(demoSearch.toLowerCase()) ||
      r.restaurant?.toLowerCase().includes(demoSearch.toLowerCase()) ||
      r.phone?.includes(demoSearch) ||
      r.city?.toLowerCase().includes(demoSearch.toLowerCase());
    return okFilter && okSearch;
  });

  /* ── loader ── */
  if (loading) return (
    <div style={{
      height: '100vh', width: '100vw', background: '#000', color: '#d3bfa2',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      letterSpacing: '4px', fontWeight: 900, fontSize: '0.8rem',
      fontFamily: "'Outfit', sans-serif",
    }}>
      ACCESSING PRATYEKSHA MAIN...
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div style={{
      display: 'flex', width: '100vw', height: '100vh',
      background: '#050505', color: '#fff',
      fontFamily: "'Outfit', sans-serif",
      overflow: 'hidden', position: 'fixed', top: 0, left: 0,
    }}>

      {/* ── MOBILE TOPBAR ── */}
      <div className="pma-topbar">
        <button onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center' }}>
          <Menu size={20} color="#d3bfa2" />
        </button>
        <span style={{ fontSize: '0.82rem', fontWeight: 900, letterSpacing: '3px', color: '#d3bfa2' }}>
          PRATYEKSHA
        </span>
        <button onClick={refresh}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center' }}>
          <RefreshCcw size={16} color="#d3bfa2" />
        </button>
      </div>

      {/* ── BACKDROP ── */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          zIndex: 148, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* ════════════ SIDEBAR ════════════ */}
      <aside className={`pma-sidebar no-sb${sidebarOpen ? ' open' : ''}`}>

        {/* close btn visible on mobile */}
        <button onClick={() => setSidebarOpen(false)} style={{
          display: 'none', background: 'none', border: 'none', cursor: 'pointer',
          alignSelf: 'flex-end', marginBottom: 12, padding: 4,
          // shown via inline style trick
          ...(typeof window !== 'undefined' && window.innerWidth <= 768
            ? { display: 'flex' } : {}),
        }}>
          <X size={18} color="#555" />
        </button>

        {/* logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: '#d3bfa2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Zap color="#000" size={17} fill="#000" />
          </div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '3px', color: '#fff', margin: 0 }}>
            PRATYEKSHA
          </h2>
        </div>

        {/* Revenue block */}
        <p style={{ fontSize: '0.56rem', color: '#333', fontWeight: 900, letterSpacing: '2px', margin: '0 0 10px' }}>
          BUSINESS REVENUE
        </p>
        <small style={{ color: '#444', fontSize: '0.63rem' }}>Total Earnings</small>
        <h2 style={{ margin: '4px 0 14px', fontSize: '1.55rem', fontWeight: 900, color: '#d3bfa2' }}>
          ₹{stats.totalRevenue?.toLocaleString() || 0}
        </h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          {[
            { icon: <Users size={13} color="#d3bfa2" />, label: `${stats.activeCount} Active` },
            { icon: <TrendingUp size={13} color="#d3bfa2" />, label: `${clients.length} Total` },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              flex: 1, padding: '8px', background: '#0d0d0d', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.64rem', color: '#888', border: '1px solid #151515',
            }}>
              {icon}{label}
            </div>
          ))}
        </div>

        <Divider />

        {/* Navigation */}
        <p style={{ fontSize: '0.56rem', color: '#333', fontWeight: 900, letterSpacing: '2px', margin: '0 0 10px' }}>
          NAVIGATION
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {[
            { id: 'clients', label: 'CLIENT PARTNERS', icon: <Building2 size={13} />, count: clients.length },
            { id: 'demos',   label: 'DEMO REQUESTS',   icon: <CalendarClock size={13} />, count: demoCounts.Pending, highlight: demoCounts.Pending > 0 },
          ].map(({ id, label, icon, count, highlight }) => (
            <button key={id} onClick={() => navTo(id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
              fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.5px',
              transition: 'all 0.15s', width: '100%', textAlign: 'left',
              background: activeSection === id ? 'rgba(211,191,162,0.08)' : 'transparent',
              color:      activeSection === id ? '#d3bfa2' : '#444',
              border:     activeSection === id ? '1px solid rgba(211,191,162,0.18)' : '1px solid transparent',
            }}>
              {icon}
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{
                fontSize: '0.54rem', fontWeight: 900, padding: '1px 7px',
                borderRadius: 10, flexShrink: 0,
                background: highlight ? 'rgba(211,191,162,0.15)' : '#111',
                color: highlight ? '#d3bfa2' : '#333',
              }}>{count}</span>
            </button>
          ))}
        </div>

        <Divider />

        {/* Top clients */}
        <h4 style={{ color: '#d3bfa2', fontSize: '0.68rem', fontWeight: 900, marginBottom: 14, display: 'flex', alignItems: 'center' }}>
          <Trophy size={13} style={{ marginRight: 7 }} /> HIGH BENEFICIARIES
        </h4>
        <div className="no-sb" style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
          {stats.topClients?.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
              background: 'linear-gradient(90deg,#0d0d0d,transparent)',
              padding: '8px 10px', borderRadius: 8,
            }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#222' }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fff' }}>{c.name?.split(' ')[0]}</div>
                <div style={{ fontSize: '0.64rem', color: '#444' }}>₹{c.revenue}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={refresh} style={{
          width: '100%', padding: '11px', background: '#000', border: '1px solid #1a1a1a',
          color: '#d3bfa2', borderRadius: 8, fontSize: '0.6rem', fontWeight: 900,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, marginTop: 'auto', flexShrink: 0, fontFamily: "'Outfit', sans-serif",
        }}>
          <RefreshCcw size={13} /> REFRESH CORE
        </button>
      </aside>

      {/* ════════════ MAIN AREA ════════════ */}
      <main className="pma-main" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden', minWidth: 0,
      }}>

        {/* ══ CLIENTS SECTION ══ */}
        {activeSection === 'clients' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Header */}
            <header className="pma-section-header" style={{
              padding: '26px 40px 18px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: '#050505', flexShrink: 0,
              borderBottom: '1px solid #0d0d0d', flexWrap: 'wrap', gap: 10,
            }}>
              <div>
                <h1 style={{ fontSize: '1.55rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                  System Control
                </h1>
                <p style={{ color: '#333', margin: '4px 0 0', fontWeight: 600, fontSize: '0.74rem' }}>
                  Full lifecycle management.
                </p>
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Search size={13} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="pma-search-input"
                  placeholder="Search partners..."
                  style={{
                    background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 10,
                    padding: '10px 14px 10px 38px', color: '#fff', width: 210, outline: 'none',
                    fontSize: '0.76rem', fontFamily: "'Outfit', sans-serif",
                  }}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </header>

            {/* Mobile stats strip */}
            <div className="pma-mob-stats">
              {[
                { val: clients.length,                           lbl: 'Total Clients' },
                { val: stats.activeCount,                        lbl: 'Active' },
                { val: `₹${((stats.totalRevenue||0)/1000).toFixed(0)}k`, lbl: 'Revenue' },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{
                  flex: 1, background: '#0d0d0d', border: '1px solid #151515',
                  borderRadius: 10, padding: '10px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#d3bfa2' }}>{val}</span>
                  <span style={{ fontSize: '0.54rem', color: '#555', fontWeight: 700, textTransform: 'uppercase' }}>{lbl}</span>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="pma-table-wrap no-sb">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', minWidth: 380 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#050505' }}>
                  <tr style={{ textAlign: 'left', color: '#333', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    <th style={{ paddingLeft: 20, paddingBottom: 8 }}>PARTNER</th>
                    <th className="hide-mob" style={{ paddingBottom: 8 }}>CATEGORY</th>
                    <th className="hide-mob" style={{ paddingBottom: 8 }}>EXPIRY</th>
                    <th style={{ paddingBottom: 8 }}>STATUS</th>
                    <th className="hide-mob" style={{ paddingBottom: 8 }}>COLLECTED</th>
                    <th style={{ textAlign: 'right', paddingRight: 20, paddingBottom: 8 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const st = getClientStatus(client);
                    return (
                      <motion.tr layout key={client._id} style={{ background: '#0a0a0a' }}>
                        <td style={{ paddingLeft: 20, paddingTop: 13, paddingBottom: 13 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>
                            {client.name}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: '#2a2a2a', fontFamily: 'monospace' }}>
                            {client.tenantId}
                          </div>
                        </td>
                        <td className="hide-mob">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {client.businessType === 'Cafe'
                              ? <Coffee size={11} color="#888" />
                              : <Utensils size={11} color="#888" />}
                            <span style={{ color: '#555', fontSize: '0.58rem', fontWeight: 900 }}>
                              {client.businessType?.toUpperCase() || 'RESTAURANT'}
                            </span>
                          </div>
                        </td>
                        <td className="hide-mob">
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d3bfa2', whiteSpace: 'nowrap' }}>
                            {client.config?.planExpiry
                              ? new Date(client.config.planExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'NOT SET'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: st.color }}>
                            {st.label === 'ACTIVE'
                              ? <ShieldCheck size={11} />
                              : <AlertCircle size={11} />}
                            <span style={{ fontWeight: 900, fontSize: '0.6rem' }}>{st.label}</span>
                          </div>
                        </td>
                        <td className="hide-mob" style={{ fontWeight: 900, color: '#fff', fontSize: '0.88rem' }}>
                          ₹{client.totalPaidAmount || 0}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 20 }}>
                          <button
                            onClick={() => handleActivate(client._id, client.name)}
                            style={{
                              padding: '7px 13px', borderRadius: 7,
                              fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer',
                              whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif",
                              ...(st.label === 'PENDING'
                                ? { background: '#d3bfa2', border: 'none', color: '#000' }
                                : { background: 'transparent', border: '1px solid #1a1a1a', color: '#444' }),
                            }}
                          >
                            {st.label === 'PENDING' ? 'ACTIVATE' : 'RENEW'}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ DEMO REQUESTS SECTION ══ */}
        {activeSection === 'demos' && (
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>

            {/* List panel — hidden on mobile when drawer is open */}
            <div style={{
              flex: 1, display: selectedDemo ? 'none' : 'flex',
              flexDirection: 'column', overflow: 'hidden',
            }}
              /* On desktop always show */
              className="pma-demo-list-panel"
            >
              {/* Header */}
              <header className="pma-section-header" style={{
                padding: '26px 40px 18px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: '#050505', flexShrink: 0,
                borderBottom: '1px solid #0d0d0d', flexWrap: 'wrap', gap: 10,
              }}>
                <div>
                  <h1 style={{ fontSize: '1.55rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                    Demo Requests
                  </h1>
                  <p style={{ color: '#333', margin: '4px 0 0', fontWeight: 600, fontSize: '0.74rem' }}>
                    {demoCounts.Pending} pending · {demoCounts.Contacted} contacted · {demoCounts['Demo Given']} done
                  </p>
                </div>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Search size={13} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    className="pma-search-input"
                    placeholder="Search..."
                    value={demoSearch}
                    onChange={e => setDemoSearch(e.target.value)}
                    style={{
                      background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 10,
                      padding: '10px 14px 10px 38px', color: '#fff', width: 210, outline: 'none',
                      fontSize: '0.76rem', fontFamily: "'Outfit', sans-serif",
                    }}
                  />
                </div>
              </header>

              {/* Filter tabs */}
              <div className="pma-filter-row no-sb">
                {['all', 'Pending', 'Contacted', 'Demo Given'].map(f => (
                  <button key={f} onClick={() => setDemoFilter(f)} style={{
                    padding: '11px 14px', background: 'transparent', border: 'none',
                    cursor: 'pointer', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.5px',
                    display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    color:        demoFilter === f ? '#d3bfa2' : '#444',
                    borderBottom: demoFilter === f ? '2px solid #d3bfa2' : '2px solid transparent',
                    background:   demoFilter === f ? 'rgba(211,191,162,0.06)' : 'transparent',
                    fontFamily: "'Outfit', sans-serif",
                  }}>
                    {f === 'all' ? 'ALL' : f === 'Demo Given' ? 'DONE' : f.toUpperCase()}
                    <span style={{
                      marginLeft: 6, fontSize: '0.56rem', fontWeight: 900,
                      padding: '1px 6px', borderRadius: 10,
                      background: demoFilter === f ? 'rgba(211,191,162,0.15)' : '#111',
                      color: demoFilter === f ? '#d3bfa2' : '#333',
                    }}>
                      {f === 'all' ? demoCounts.all : demoCounts[f] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Demo cards */}
              <div className="pma-demo-scroll no-sb">
                {demoLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#333', fontSize: '0.78rem', fontWeight: 700 }}>
                    LOADING REQUESTS...
                  </div>
                ) : filteredDemos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#222', fontSize: '0.78rem', fontWeight: 700 }}>
                    NO REQUESTS FOUND
                  </div>
                ) : filteredDemos.map((req) => {
                  const isSelected = selectedDemo?._id === req._id;
                  return (
                    <motion.div
                      key={req._id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedDemo(isSelected ? null : req)}
                      style={{
                        padding: '15px 16px', borderRadius: 12, marginBottom: 8,
                        border: '1px solid #111', transition: 'all 0.15s', cursor: 'pointer',
                        background: isSelected ? 'rgba(211,191,162,0.05)' : '#0a0a0a',
                        borderLeft: isSelected ? '3px solid #d3bfa2' : '3px solid transparent',
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff' }}>{req.name}</span>
                            <StatusBadge status={req.status} />
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#8a704d', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {req.restaurant}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8, flexShrink: 0 }}>
                          {req.status !== 'Demo Given' && (
                            <button
                              onClick={e => { e.stopPropagation(); markDone(req._id); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 9px', background: 'rgba(211,191,162,0.06)',
                                border: '1px solid rgba(211,191,162,0.18)', color: '#d3bfa2',
                                borderRadius: 6, fontSize: '0.54rem', fontWeight: 900,
                                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif",
                              }}
                            >
                              <CheckCircle2 size={11} /> DONE
                            </button>
                          )}
                          <ChevronRight size={14} color={isSelected ? '#d3bfa2' : '#333'} />
                        </div>
                      </div>
                      {/* Meta row */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <MetaChip icon={Phone} label={req.phone} />
                        {req.city  && <MetaChip icon={MapPin} label={req.city} />}
                        {req.type  && <MetaChip icon={Utensils} label={req.type} className="hide-mob" />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.66rem', color: '#333', fontWeight: 600, marginLeft: 'auto' }}>
                          <Clock size={10} color="#333" />
                          {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── DETAIL DRAWER ── */}
            <AnimatePresence>
              {selectedDemo && (
                <motion.div
                  className="pma-drawer"
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                >
                  <div className="no-sb" style={{ padding: '22px 20px', height: '100%', overflowY: 'auto' }}>

                    {/* Drawer header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.54rem', color: '#555', fontWeight: 900, letterSpacing: '2px', marginBottom: 5 }}>
                          DEMO REQUEST DETAIL
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#fff' }}>
                          {selectedDemo.name}
                        </h3>
                        <div style={{ fontSize: '0.76rem', color: '#8a704d', fontWeight: 700, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedDemo.restaurant}
                        </div>
                      </div>
                      <button onClick={() => setSelectedDemo(null)} style={{
                        background: '#111', border: '1px solid #1a1a1a', color: '#555',
                        padding: 7, borderRadius: 8, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', flexShrink: 0,
                      }}>
                        <X size={15} />
                      </button>
                    </div>

                    {/* Status picker */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '0.54rem', color: '#444', fontWeight: 900, letterSpacing: '1.5px', marginBottom: 9 }}>
                        CURRENT STATUS
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['Pending', 'Contacted', 'Demo Given'].map(s => {
                          const map = {
                            Pending:      { bg: 'rgba(201,169,110,0.08)', color: '#d3bfa2', border: 'rgba(201,169,110,0.2)' },
                            Contacted:    { bg: 'rgba(255,255,255,0.04)', color: '#fff',    border: 'rgba(255,255,255,0.12)' },
                            'Demo Given': { bg: 'rgba(255,255,255,0.02)', color: '#555',    border: '#1a1a1a' },
                          };
                          const st = map[s];
                          const isActive = selectedDemo.status === s;
                          return (
                            <button key={s} onClick={() => updateStatus(selectedDemo._id, s)} style={{
                              flex: 1, padding: '8px 4px', borderRadius: 8,
                              border: `1px solid ${isActive ? st.border : '#1a1a1a'}`,
                              background: isActive ? st.bg : 'transparent',
                              color: isActive ? st.color : '#333',
                              fontSize: '0.52rem', fontWeight: 900, cursor: 'pointer',
                              transition: 'all 0.15s', fontFamily: "'Outfit', sans-serif",
                            }}>
                              {s.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Divider />

                    {/* Contact info */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '0.54rem', color: '#444', fontWeight: 900, letterSpacing: '1.5px', marginBottom: 12 }}>
                        CONTACT INFORMATION
                      </div>
                      {[
                        { icon: <Phone size={13} color="#8a704d" />, label: 'MOBILE', val: selectedDemo.phone, href: `tel:${selectedDemo.phone}`, link: true },
                        selectedDemo.email && { icon: <Mail size={13} color="#8a704d" />, label: 'EMAIL', val: selectedDemo.email, href: `mailto:${selectedDemo.email}`, link: true },
                        selectedDemo.city && { icon: <MapPin size={13} color="#8a704d" />, label: 'CITY', val: selectedDemo.city },
                      ].filter(Boolean).map(row => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
                          {row.icon}
                          <div>
                            <div style={{ fontSize: '0.5rem', color: '#444', fontWeight: 900, letterSpacing: '1px', marginBottom: 3 }}>{row.label}</div>
                            {row.link
                              ? <a href={row.href} style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d3bfa2' }}>{row.val}</a>
                              : <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{row.val}</div>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Divider />

                    {/* Establishment profile */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '0.54rem', color: '#444', fontWeight: 900, letterSpacing: '1.5px', marginBottom: 12 }}>
                        ESTABLISHMENT PROFILE
                      </div>
                      {[
                        { label: 'NAME',    value: selectedDemo.restaurant },
                        { label: 'TYPE',    value: selectedDemo.type || '—' },
                        { label: 'TABLES',  value: selectedDemo.tables || '—' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #0d0d0d' }}>
                          <span style={{ fontSize: '0.58rem', color: '#444', fontWeight: 900 }}>{row.label}</span>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fff', textAlign: 'right', maxWidth: '58%', wordBreak: 'break-word' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <Divider />

                    {/* Timeline */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: '0.54rem', color: '#444', fontWeight: 900, letterSpacing: '1.5px', marginBottom: 10 }}>
                        TIMELINE
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0' }}>
                        <span style={{ fontSize: '0.58rem', color: '#444', fontWeight: 900 }}>SUBMITTED</span>
                        <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: 700 }}>
                          {new Date(selectedDemo.createdAt).toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    {selectedDemo.status !== 'Demo Given' ? (
                      <button onClick={() => markDone(selectedDemo._id)} style={{
                        width: '100%', padding: '13px', background: '#d3bfa2', color: '#000',
                        border: 'none', borderRadius: 10, fontSize: '0.74rem', fontWeight: 900,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 7, marginBottom: 10, fontFamily: "'Outfit', sans-serif",
                      }}>
                        <CheckCircle2 size={14} /> MARK DEMO COMPLETE
                      </button>
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a',
                        borderRadius: 10, fontSize: '0.66rem', fontWeight: 900, color: '#8a704d',
                        marginBottom: 10, letterSpacing: '1px',
                      }}>
                        <CheckCircle2 size={13} color="#8a704d" /> DEMO COMPLETED
                      </div>
                    )}

                    <a href={`tel:${selectedDemo.phone}`} style={{
                      width: '100%', padding: '12px', background: 'transparent', color: '#d3bfa2',
                      border: '1px solid rgba(211,191,162,0.2)', borderRadius: 10,
                      fontSize: '0.7rem', fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                      <Phone size={13} /> CALL NOW
                    </a>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </main>

      {/* ── Extra responsive CSS ── */}
      <style>{`
        /* Desktop: demo list always visible, drawer as side panel */
        @media (min-width: 769px) {
          .pma-demo-list-panel { display: flex !important; }
          .pma-drawer { position: relative !important; }
        }
        /* Mobile: topbar always shows */
        @media (max-width: 768px) {
          .pma-topbar { display: flex !important; }
          .pma-sidebar-close { display: flex !important; }
        }
      `}</style>

    </div>
  );
}