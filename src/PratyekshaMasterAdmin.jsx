import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, CreditCard, LayoutGrid, RefreshCcw, 
  Search, TrendingUp, Users, Trophy, DollarSign, 
  ShieldCheck, Zap, AlertCircle, Utensils, Coffee, ArrowRight,
  CalendarClock, Phone, Mail, MapPin, ChevronRight, CheckCircle2,
  Clock, Layers, Filter, X
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

const PratyekshaMasterAdmin = () => {
  const [activeSection, setActiveSection] = useState('clients'); // 'clients' | 'demos'
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, activeCount: 0, topClients: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchQuery] = useState("");

  // Demo requests state
  const [demoRequests, setDemoRequests] = useState([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoFilter, setDemoFilter] = useState('all'); // 'all' | 'Pending' | 'Contacted' | 'Demo Given'
  const [demoSearch, setDemoSearch] = useState('');
  const [selectedDemo, setSelectedDemo] = useState(null); // for detail drawer

  const fetchData = async () => {
    try {
      const [clientRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/master/tenants`),
        axios.get(`${BASE_URL}/admin/master/analytics`)
      ]);
      setClients(clientRes.data);
      setStats(statsRes.data);
    } catch (err) { 
      console.error("Database Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchDemoRequests = async () => {
    setDemoLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/master/demo-requests`);
      setDemoRequests(res.data || []);
    } catch (err) {
      console.error("Demo requests fetch error:", err);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleActivate = async (id, name) => {
    const amount = prompt(`Enter payment from ${name}:`, "1200");
    if (amount) {
      try {
        await axios.patch(`${BASE_URL}/admin/master/settle-subscription/${id}`, { paidAmount: Number(amount) });
        fetchData();
      } catch (err) { alert("Activation failed."); }
    }
  };

  const markDemoComplete = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/demo-requests/${id}`);
      setDemoRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'Demo Given' } : r));
      if (selectedDemo?._id === id) setSelectedDemo(prev => ({ ...prev, status: 'Demo Given' }));
    } catch (err) {
      console.error("Mark complete failed:", err);
    }
  };

  const updateDemoStatus = async (id, status) => {
    try {
      await axios.patch(`${BASE_URL}/admin/master/demo-requests/${id}`, { status });
      setDemoRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      if (selectedDemo?._id === id) setSelectedDemo(prev => ({ ...prev, status }));
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchDemoRequests();
  }, []);

  const getStatus = (client) => {
    const expiryDate = client.config?.planExpiry;
    if (!expiryDate) return { label: 'PENDING', color: '#ffcc00' };
    const isExpired = new Date(expiryDate) < new Date();
    return isExpired ? { label: 'PENDING', color: '#ffcc00' } : { label: 'ACTIVE', color: '#d3bfa2' };
  };

  const getDemoStatusStyle = (status) => {
    switch(status) {
      case 'Pending':    return { bg: 'rgba(201,169,110,0.08)', color: '#d3bfa2', border: 'rgba(201,169,110,0.2)' };
      case 'Contacted':  return { bg: 'rgba(255,255,255,0.04)', color: '#fff', border: 'rgba(255,255,255,0.12)' };
      case 'Demo Given': return { bg: 'rgba(255,255,255,0.02)', color: '#555', border: '#1a1a1a' };
      default:           return { bg: 'rgba(201,169,110,0.08)', color: '#d3bfa2', border: 'rgba(201,169,110,0.2)' };
    }
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.tenantId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDemos = demoRequests.filter(r => {
    const matchesFilter = demoFilter === 'all' || r.status === demoFilter;
    const matchesSearch = !demoSearch || 
      r.name?.toLowerCase().includes(demoSearch.toLowerCase()) ||
      r.restaurant?.toLowerCase().includes(demoSearch.toLowerCase()) ||
      r.phone?.includes(demoSearch) ||
      r.city?.toLowerCase().includes(demoSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const demoCounts = {
    all: demoRequests.length,
    Pending: demoRequests.filter(r => r.status === 'Pending').length,
    Contacted: demoRequests.filter(r => r.status === 'Contacted').length,
    'Demo Given': demoRequests.filter(r => r.status === 'Demo Given').length,
  };

  if (loading) return <div style={styles.loader}>ACCESSING PRATYEKSHA MAIN...</div>;

  return (
    <div style={styles.container}>

      {/* ═══════════ LEFT SIDEBAR ═══════════ */}
      <aside style={styles.sidebar}>
        <div style={styles.logoBlock}>
          <div style={styles.logoCircle}><Zap color="#000" size={18} fill="#000" /></div>
          <h2 style={styles.logoText}>PRATYEKSHA</h2>
        </div>
        
        <div style={styles.intelSection}>
          <p style={styles.intelHeader}>BUSINESS REVENUE</p>
          <div style={styles.mainStat}>
            <small style={{ color: '#444', fontSize: '0.65rem' }}>Total Earnings</small>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 900, color: '#d3bfa2' }}>
              ₹{stats.totalRevenue?.toLocaleString() || 0}
            </h2>
          </div>
          <div style={styles.miniStats}>
            <div style={styles.miniBox}><Users size={14} color="#d3bfa2" /><span>{stats.activeCount} Active</span></div>
            <div style={styles.miniBox}><TrendingUp size={14} color="#d3bfa2" /><span>{clients.length} Total</span></div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* NAV */}
        <div style={{ marginBottom: '24px' }}>
          <p style={styles.intelHeader}>NAVIGATION</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => setActiveSection('clients')}
              style={{
                ...styles.navBtn,
                background: activeSection === 'clients' ? 'rgba(211,191,162,0.08)' : 'transparent',
                color: activeSection === 'clients' ? '#d3bfa2' : '#444',
                border: activeSection === 'clients' ? '1px solid rgba(211,191,162,0.18)' : '1px solid transparent',
              }}
            >
              <Building2 size={14} />
              <span>CLIENT PARTNERS</span>
              <span style={styles.navCount}>{clients.length}</span>
            </button>
            <button 
              onClick={() => setActiveSection('demos')}
              style={{
                ...styles.navBtn,
                background: activeSection === 'demos' ? 'rgba(211,191,162,0.08)' : 'transparent',
                color: activeSection === 'demos' ? '#d3bfa2' : '#444',
                border: activeSection === 'demos' ? '1px solid rgba(211,191,162,0.18)' : '1px solid transparent',
              }}
            >
              <CalendarClock size={14} />
              <span>DEMO REQUESTS</span>
              {demoCounts.Pending > 0 && (
                <span style={{ ...styles.navCount, background: 'rgba(211,191,162,0.15)', color: '#d3bfa2' }}>
                  {demoCounts.Pending}
                </span>
              )}
            </button>
          </div>
        </div>

        <div style={styles.divider} />

        <h4 style={styles.subSideTitle}><Trophy size={14} style={{marginRight: 8}} /> High Beneficiaries</h4>
        <div style={styles.topPartnersContainer} className="no-scrollbar">
          {stats.topClients?.map((c, i) => (
            <div key={i} style={styles.topClientRow}>
              <div style={styles.rankNum}>{i+1}</div>
              <div style={{flex: 1}}>
                <div style={styles.topClientName}>{c.name?.split(' ')[0]}</div>
                <div style={styles.topClientRev}>₹{c.revenue}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => { fetchData(); fetchDemoRequests(); }} style={styles.refreshBtn}>
          <RefreshCcw size={14} /> REFRESH CORE
        </button>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <main style={styles.mainFeed}>

        {/* ── CLIENTS SECTION ── */}
        {activeSection === 'clients' && (
          <>
            <header style={styles.header}>
              <div>
                <h1 style={styles.title}>System Control</h1>
                <p style={styles.subtitle}>Full screen lifecycle management.</p>
              </div>
              <div style={styles.searchWrapper}>
                <Search size={16} color="#555" style={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search partners..." 
                  style={styles.searchInput} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
              </div>
            </header>

            <div style={styles.tableScrollWrapper} className="no-scrollbar">
              <table style={styles.table}>
                <thead style={styles.stickyThead}>
                  <tr style={styles.theadRow}>
                    <th style={{paddingLeft: '25px', width: '30%'}}>PARTNER ENTITY</th>
                    <th style={{width: '15%'}}>CATEGORY</th>
                    <th style={{width: '15%'}}>EXPIRY DATE</th>
                    <th style={{width: '15%'}}>AUTO-STATUS</th>
                    <th style={{width: '10%'}}>COLLECTED</th>
                    <th style={{textAlign: 'right', paddingRight: '25px', width: '15%'}}>MANAGEMENT</th>
                  </tr>
                </thead>
                <tbody style={styles.tbody}>
                  {filteredClients.map((client) => {
                    const statusInfo = getStatus(client);
                    const isCafe = client.businessType === 'Cafe';
                    return (
                      <motion.tr layout key={client._id} style={styles.tr}>
                        <td style={{paddingLeft: '25px'}}>
                          <div style={styles.nameText}>{client.name}</div>
                          <div style={styles.idText}>ID: {client.tenantId}</div>
                        </td>
                        <td>
                          <div style={styles.typeBox}>
                            {isCafe ? <Coffee size={12} color="#888" /> : <Utensils size={12} color="#888" />}
                            <span style={styles.typeBadge}>{client.businessType?.toUpperCase() || 'RESTAURANT'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={styles.dateText}>
                            {client.config?.planExpiry ? new Date(client.config.planExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT SET'}
                          </div>
                        </td>
                        <td>
                          <div style={{...styles.statusContainer, color: statusInfo.color}}>
                            {statusInfo.label === 'ACTIVE' ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                            <span style={{fontWeight: 900, fontSize: '0.7rem'}}>{statusInfo.label}</span>
                          </div>
                        </td>
                        <td style={styles.revenueText}>₹{client.totalPaidAmount || 0}</td>
                        <td style={{textAlign: 'right', paddingRight: '25px'}}>
                          <button 
                            onClick={() => handleActivate(client._id, client.name)} 
                            style={statusInfo.label === 'PENDING' ? styles.activateBtn : styles.settleBtn}
                          >
                            {statusInfo.label === 'PENDING' ? 'ACTIVATE' : 'RENEW'}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── DEMO REQUESTS SECTION ── */}
        {activeSection === 'demos' && (
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

            {/* DEMO LIST PANEL */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <header style={styles.header}>
                <div>
                  <h1 style={styles.title}>Demo Requests</h1>
                  <p style={styles.subtitle}>
                    {demoCounts.Pending} pending · {demoCounts.Contacted} contacted · {demoCounts['Demo Given']} completed
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={styles.searchWrapper}>
                    <Search size={16} color="#555" style={styles.searchIcon} />
                    <input 
                      type="text" 
                      placeholder="Search requests..." 
                      style={styles.searchInput} 
                      value={demoSearch}
                      onChange={(e) => setDemoSearch(e.target.value)} 
                    />
                  </div>
                </div>
              </header>

              {/* FILTER TABS */}
              <div style={styles.filterTabsRow}>
                {['all', 'Pending', 'Contacted', 'Demo Given'].map(f => (
                  <button
                    key={f}
                    onClick={() => setDemoFilter(f)}
                    style={{
                      ...styles.filterTab,
                      background: demoFilter === f ? 'rgba(211,191,162,0.1)' : 'transparent',
                      color: demoFilter === f ? '#d3bfa2' : '#444',
                      borderBottom: demoFilter === f ? '2px solid #d3bfa2' : '2px solid transparent',
                    }}
                  >
                    {f === 'all' ? 'ALL' : f.toUpperCase()}
                    <span style={{
                      marginLeft: '8px', fontSize: '0.6rem', fontWeight: 900,
                      padding: '1px 7px', borderRadius: '10px',
                      background: demoFilter === f ? 'rgba(211,191,162,0.15)' : '#111',
                      color: demoFilter === f ? '#d3bfa2' : '#333',
                    }}>
                      {f === 'all' ? demoCounts.all : demoCounts[f] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* DEMO LIST */}
              <div style={styles.demoListScroll} className="no-scrollbar">
                {demoLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#333', fontSize: '0.8rem' }}>
                    LOADING REQUESTS...
                  </div>
                ) : filteredDemos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#222', fontSize: '0.8rem', fontWeight: 700 }}>
                    NO REQUESTS FOUND
                  </div>
                ) : (
                  filteredDemos.map((req) => {
                    const statusStyle = getDemoStatusStyle(req.status);
                    const isSelected = selectedDemo?._id === req._id;
                    return (
                      <motion.div
                        key={req._id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedDemo(isSelected ? null : req)}
                        style={{
                          ...styles.demoCard,
                          background: isSelected ? 'rgba(211,191,162,0.05)' : '#0a0a0a',
                          borderLeft: isSelected ? '3px solid #d3bfa2' : '3px solid transparent',
                          cursor: 'pointer',
                        }}
                      >
                        {/* TOP ROW */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>{req.name}</span>
                              <span style={{
                                fontSize: '0.58rem', fontWeight: 900, padding: '2px 9px', borderRadius: '20px',
                                background: statusStyle.bg, color: statusStyle.color,
                                border: `1px solid ${statusStyle.border}`, letterSpacing: '0.5px'
                              }}>
                                {req.status?.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#8a704d', fontWeight: 700 }}>{req.restaurant}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {req.status !== 'Demo Given' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markDemoComplete(req._id); }}
                                style={styles.markDoneBtn}
                                title="Mark as Demo Given"
                              >
                                <CheckCircle2 size={13} /> DONE
                              </button>
                            )}
                            <ChevronRight size={16} color={isSelected ? '#d3bfa2' : '#333'} />
                          </div>
                        </div>

                        {/* META ROW */}
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                          <div style={styles.demoMetaItem}>
                            <Phone size={11} color="#555" />
                            <span>{req.phone}</span>
                          </div>
                          {req.city && (
                            <div style={styles.demoMetaItem}>
                              <MapPin size={11} color="#555" />
                              <span>{req.city}</span>
                            </div>
                          )}
                          {req.type && (
                            <div style={styles.demoMetaItem}>
                              <Utensils size={11} color="#555" />
                              <span>{req.type}</span>
                            </div>
                          )}
                          {req.tables && (
                            <div style={styles.demoMetaItem}>
                              <Layers size={11} color="#555" />
                              <span>{req.tables} tables</span>
                            </div>
                          )}
                          <div style={{ ...styles.demoMetaItem, marginLeft: 'auto' }}>
                            <Clock size={11} color="#333" />
                            <span style={{ color: '#333' }}>
                              {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* DETAIL DRAWER */}
            <AnimatePresence>
              {selectedDemo && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '360px', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={styles.detailDrawer}
                >
                  <div style={{ padding: '30px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }} className="no-scrollbar">
                    
                    {/* DRAWER HEADER */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, letterSpacing: '2px', marginBottom: '6px' }}>DEMO REQUEST DETAIL</div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{selectedDemo.name}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#8a704d', fontWeight: 700, marginTop: '3px' }}>{selectedDemo.restaurant}</div>
                      </div>
                      <button onClick={() => setSelectedDemo(null)} style={styles.drawerClose}>
                        <X size={16} />
                      </button>
                    </div>

                    {/* STATUS BADGE */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '10px' }}>CURRENT STATUS</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['Pending', 'Contacted', 'Demo Given'].map(s => {
                          const st = getDemoStatusStyle(s);
                          const isActive = selectedDemo.status === s;
                          return (
                            <button key={s} onClick={() => updateDemoStatus(selectedDemo._id, s)} style={{
                              flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1px solid ${isActive ? st.border : '#1a1a1a'}`,
                              background: isActive ? st.bg : 'transparent', color: isActive ? st.color : '#333',
                              fontSize: '0.58rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.15s'
                            }}>
                              {s.toUpperCase().replace(' ', '\n')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={styles.drawerDivider} />

                    {/* CONTACT INFO */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '14px' }}>CONTACT INFORMATION</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={styles.detailRow}>
                          <Phone size={14} color="#8a704d" />
                          <div>
                            <div style={styles.detailLabel}>MOBILE</div>
                            <a href={`tel:${selectedDemo.phone}`} style={styles.detailValue}>{selectedDemo.phone}</a>
                          </div>
                        </div>
                        {selectedDemo.email && (
                          <div style={styles.detailRow}>
                            <Mail size={14} color="#8a704d" />
                            <div>
                              <div style={styles.detailLabel}>EMAIL</div>
                              <a href={`mailto:${selectedDemo.email}`} style={styles.detailValue}>{selectedDemo.email}</a>
                            </div>
                          </div>
                        )}
                        {selectedDemo.city && (
                          <div style={styles.detailRow}>
                            <MapPin size={14} color="#8a704d" />
                            <div>
                              <div style={styles.detailLabel}>CITY</div>
                              <div style={styles.detailValuePlain}>{selectedDemo.city}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={styles.drawerDivider} />

                    {/* ESTABLISHMENT INFO */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '14px' }}>ESTABLISHMENT PROFILE</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { label: 'ESTABLISHMENT', value: selectedDemo.restaurant },
                          { label: 'TYPE', value: selectedDemo.type || '—' },
                          { label: 'TABLES / COUNTERS', value: selectedDemo.tables || '—' },
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0d0d0d' }}>
                            <span style={{ fontSize: '0.62rem', color: '#444', fontWeight: 900 }}>{row.label}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={styles.drawerDivider} />

                    {/* TIMESTAMPS */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '14px' }}>REQUEST TIMELINE</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                        <span style={{ fontSize: '0.62rem', color: '#444', fontWeight: 900 }}>SUBMITTED</span>
                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>
                          {new Date(selectedDemo.createdAt).toLocaleString('en-GB', { 
                            day: '2-digit', month: 'short', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    {selectedDemo.status !== 'Demo Given' && (
                      <button 
                        onClick={() => markDemoComplete(selectedDemo._id)}
                        style={styles.drawerDoneBtn}
                      >
                        <CheckCircle2 size={15} /> MARK DEMO COMPLETE
                      </button>
                    )}

                    {selectedDemo.status === 'Demo Given' && (
                      <div style={styles.drawerCompletedBadge}>
                        <CheckCircle2 size={14} color="#8a704d" />
                        <span>DEMO COMPLETED</span>
                      </div>
                    )}

                    {/* QUICK CALL BUTTON */}
                    <a href={`tel:${selectedDemo.phone}`} style={styles.drawerCallBtn}>
                      <Phone size={14} /> CALL NOW
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        * { box-sizing: border-box; }
        body, html { 
          overflow: hidden !important; 
          margin: 0; 
          padding: 0; 
          width: 100vw; 
          height: 100vh; 
          background: #000;
        }
        a { text-decoration: none; }
      `}</style>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', 
    width: '100vw', 
    height: '100vh', 
    background: '#050505', 
    color: '#fff', 
    fontFamily: "'Outfit', sans-serif", 
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0
  },
  loader: { 
    height: '100vh', width: '100vw', background: '#000', color: '#d3bfa2', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', 
    letterSpacing: '4px', fontWeight: 900 
  },
  
  // ── SIDEBAR ──
  sidebar: { 
    width: '280px', 
    height: '100vh', 
    background: '#080808', 
    borderRight: '1px solid #151515', 
    padding: '36px 24px', 
    display: 'flex', 
    flexDirection: 'column', 
    flexShrink: 0,
  },
  logoBlock: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
  logoCircle: { width: '35px', height: '35px', borderRadius: '10px', background: '#d3bfa2', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: '1.1rem', fontWeight: 900, letterSpacing: '3px', color: '#fff', margin: 0 },
  intelSection: { marginBottom: '24px' },
  intelHeader: { fontSize: '0.58rem', color: '#333', fontWeight: 900, letterSpacing: '2px', marginBottom: '12px', margin: '0 0 12px 0' },
  mainStat: { marginBottom: '16px' },
  miniStats: { display: 'flex', gap: '8px' },
  miniBox: { flex: 1, padding: '9px', background: '#0d0d0d', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.68rem', color: '#888', border: '1px solid #151515' },
  divider: { height: '1px', background: '#151515', margin: '18px 0' },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 14px', borderRadius: '10px', cursor: 'pointer',
    fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.5px',
    transition: 'all 0.15s', width: '100%', textAlign: 'left',
  },
  navCount: { 
    marginLeft: 'auto', fontSize: '0.58rem', fontWeight: 900,
    padding: '1px 7px', borderRadius: '10px', background: '#111', color: '#333'
  },
  subSideTitle: { color: '#d3bfa2', fontSize: '0.72rem', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' },
  topPartnersContainer: { flex: 1, overflowY: 'auto', marginBottom: '16px' },
  topClientRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', background: 'linear-gradient(90deg, #0d0d0d, transparent)', padding: '9px 10px', borderRadius: '8px' },
  rankNum: { fontSize: '0.78rem', fontWeight: 900, color: '#222' },
  topClientName: { fontSize: '0.78rem', fontWeight: 800, color: '#fff' },
  topClientRev: { fontSize: '0.68rem', color: '#444' },
  refreshBtn: { width: '100%', padding: '12px', background: '#000', border: '1px solid #1a1a1a', color: '#d3bfa2', borderRadius: '8px', fontSize: '0.62rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 'auto' },

  // ── MAIN PANEL ──
  mainFeed: { 
    width: 'calc(100vw - 280px)',
    display: 'flex', 
    flexDirection: 'column', 
    height: '100vh', 
    overflow: 'hidden',
  },
  header: { padding: '36px 50px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505', flexShrink: 0, borderBottom: '1px solid #0d0d0d' },
  title: { fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' },
  subtitle: { color: '#333', margin: '5px 0 0', fontWeight: 600, fontSize: '0.8rem' },
  searchWrapper: { position: 'relative' },
  searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' },
  searchInput: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '13px 18px 13px 46px', color: '#fff', width: '280px', outline: 'none', fontSize: '0.82rem' },

  // ── CLIENTS TABLE ──
  tableScrollWrapper: { flex: 1, overflowY: 'auto', padding: '20px 50px 40px', width: '100%', overflowX: 'hidden' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', tableLayout: 'fixed' },
  stickyThead: { position: 'sticky', top: 0, zIndex: 10, background: '#050505' },
  theadRow: { textAlign: 'left', color: '#333', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '2px' },
  tbody: {},
  tr: { background: '#0a0a0a' },
  nameText: { fontWeight: 800, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingTop: '14px' },
  idText: { fontSize: '0.68rem', color: '#2a2a2a', paddingBottom: '14px', fontFamily: 'monospace' },
  typeBox: { display: 'flex', alignItems: 'center', gap: '8px' },
  typeBadge: { color: '#555', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '1px' },
  dateText: { fontSize: '0.85rem', fontWeight: 600, color: '#d3bfa2' },
  statusContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
  revenueText: { fontWeight: 900, color: '#fff', fontSize: '1rem' },
  settleBtn: { background: 'transparent', border: '1px solid #1a1a1a', color: '#444', padding: '9px 18px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 900, cursor: 'pointer' },
  activateBtn: { background: '#d3bfa2', border: 'none', color: '#000', padding: '9px 18px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 900, cursor: 'pointer' },

  // ── DEMO LIST ──
  filterTabsRow: { 
    display: 'flex', gap: '0', padding: '0 50px', 
    borderBottom: '1px solid #111', flexShrink: 0, background: '#050505'
  },
  filterTab: { 
    padding: '14px 20px', background: 'transparent', border: 'none', 
    cursor: 'pointer', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.5px',
    display: 'flex', alignItems: 'center', transition: 'all 0.15s',
  },
  demoListScroll: { flex: 1, overflowY: 'auto', padding: '16px 50px 40px' },
  demoCard: {
    padding: '18px 20px', borderRadius: '14px', marginBottom: '10px',
    border: '1px solid #111', transition: 'all 0.15s',
    borderLeft: '3px solid transparent',
  },
  demoMetaItem: { 
    display: 'flex', alignItems: 'center', gap: '6px', 
    fontSize: '0.72rem', color: '#555', fontWeight: 600 
  },
  markDoneBtn: { 
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', background: 'rgba(211,191,162,0.06)', 
    border: '1px solid rgba(211,191,162,0.18)', color: '#d3bfa2',
    borderRadius: '7px', fontSize: '0.58rem', fontWeight: 900, cursor: 'pointer',
    letterSpacing: '0.5px', whiteSpace: 'nowrap', transition: 'all 0.15s'
  },

  // ── DETAIL DRAWER ──
  detailDrawer: {
    background: '#080808', borderLeft: '1px solid #151515', 
    height: '100%', flexShrink: 0, overflow: 'hidden',
  },
  drawerClose: { 
    background: '#111', border: '1px solid #1a1a1a', color: '#555', 
    padding: '7px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
  },
  drawerDivider: { height: '1px', background: '#111', margin: '20px 0' },
  detailRow: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '4px 0' },
  detailLabel: { fontSize: '0.54rem', color: '#444', fontWeight: 900, letterSpacing: '1px', marginBottom: '3px' },
  detailValue: { fontSize: '0.82rem', fontWeight: 700, color: '#d3bfa2' },
  detailValuePlain: { fontSize: '0.82rem', fontWeight: 700, color: '#fff' },
  drawerDoneBtn: { 
    width: '100%', padding: '14px', background: '#d3bfa2', color: '#000',
    border: 'none', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 900, 
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    marginBottom: '10px', letterSpacing: '0.3px'
  },
  drawerCallBtn: { 
    width: '100%', padding: '13px', background: 'transparent', color: '#d3bfa2',
    border: '1px solid rgba(211,191,162,0.2)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.3px'
  },
  drawerCompletedBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '13px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a',
    borderRadius: '10px', fontSize: '0.72rem', fontWeight: 900, color: '#8a704d',
    marginBottom: '10px', letterSpacing: '1px'
  }
};

export default PratyekshaMasterAdmin;