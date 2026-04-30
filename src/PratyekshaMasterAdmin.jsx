import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Building2, CreditCard, LayoutGrid, RefreshCcw, 
  Search, TrendingUp, Users, Trophy, DollarSign, 
  ShieldCheck, Zap, AlertCircle, Utensils, Coffee, ArrowRight
} from 'lucide-react';

const LAPTOP_IP = "10.222.134.11"; 
const BASE_URL = `http://${LAPTOP_IP}:5000/api`;

const PratyekshaMasterAdmin = () => {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, activeCount: 0, topClients: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchQuery] = useState("");

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

  const handleActivate = async (id, name) => {
    const amount = prompt(`Enter payment from ${name}:`, "1200");
    if (amount) {
      try {
        await axios.patch(`${BASE_URL}/admin/master/settle-subscription/${id}`, { paidAmount: Number(amount) });
        fetchData();
      } catch (err) { alert("Activation failed."); }
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getStatus = (client) => {
    const expiryDate = client.config?.planExpiry;
    if (!expiryDate) return { label: 'PENDING', color: '#ffcc00' };
    const isExpired = new Date(expiryDate) < new Date();
    return isExpired ? { label: 'PENDING', color: '#ffcc00' } : { label: 'ACTIVE', color: '#d3bfa2' };
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.tenantId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={styles.loader}>ACCESSING PRATYEKSHA MAIN...</div>;

  return (
    <div style={styles.container}>
      {/* LEFT SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logoBlock}>
          <div style={styles.logoCircle}><Zap color="#000" size={18} fill="#000" /></div>
          <h2 style={styles.logoText}>PRATYEKSHA</h2>
        </div>
        
        <div style={styles.intelSection}>
            <p style={styles.intelHeader}>BUSINESS REVENUE</p>
            <div style={styles.mainStat}>
                <small>Total Earnings</small>
                <h2>₹{stats.totalRevenue?.toLocaleString() || 0}</h2>
            </div>
            <div style={styles.miniStats}>
                <div style={styles.miniBox}><Users size={14} color="#d3bfa2" /><span>{stats.activeCount} Active</span></div>
                <div style={styles.miniBox}><TrendingUp size={14} color="#d3bfa2" /><span>{clients.length} Total</span></div>
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

        <button onClick={fetchData} style={styles.refreshBtn}><RefreshCcw size={14} /> REFRESH CORE</button>
      </aside>

      {/* RIGHT MAIN PANEL */}
      <main style={styles.mainFeed}>
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
    position: 'fixed', // Forces zero-gap alignment
    top: 0,
    left: 0
  },
  loader: { height: '100vh', width: '100vw', background: '#000', color: '#d3bfa2', display: 'flex', justifyContent: 'center', alignItems: 'center', letterSpacing: '4px', fontWeight: 900 },
  
  sidebar: { 
    width: '320px', 
    height: '100vh', 
    background: '#080808', 
    borderRight: '1px solid #151515', 
    padding: '40px 30px', 
    display: 'flex', 
    flexDirection: 'column', 
    flexShrink: 0,
    margin: 0 // Explicitly remove any margin
  },
  logoBlock: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '50px' },
  logoCircle: { width: '35px', height: '35px', borderRadius: '10px', background: '#d3bfa2', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: '1.2rem', fontWeight: 900, letterSpacing: '3px', color: '#fff', margin: 0 },
  intelSection: { marginBottom: '30px' },
  intelHeader: { fontSize: '0.6rem', color: '#444', fontWeight: 900, letterSpacing: '2px', marginBottom: '15px' },
  mainStat: { marginBottom: '20px' },
  miniStats: { display: 'flex', gap: '10px' },
  miniBox: { flex: 1, padding: '10px', background: '#0d0d0d', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#888', border: '1px solid #151515' },
  divider: { height: '1px', background: '#151515', margin: '20px 0' },
  subSideTitle: { color: '#d3bfa2', fontSize: '0.75rem', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' },
  topPartnersContainer: { flex: 1, overflowY: 'auto', marginBottom: '20px' },
  topClientRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', background: 'linear-gradient(90deg, #0d0d0d, transparent)', padding: '10px', borderRadius: '8px' },
  rankNum: { fontSize: '0.8rem', fontWeight: 900, color: '#222' },
  topClientName: { fontSize: '0.8rem', fontWeight: 800, color: '#fff' },
  topClientRev: { fontSize: '0.7rem', color: '#444' },
  refreshBtn: { width: '100%', padding: '12px', background: '#000', border: '1px solid #222', color: '#d3bfa2', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 'auto' },

  mainFeed: { 
    width: 'calc(100vw - 320px)',
    display: 'flex', 
    flexDirection: 'column', 
    height: '100vh', 
    overflow: 'hidden',
    margin: 0
  },
  header: { padding: '40px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505', flexShrink: 0 },
  title: { fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-1px' },
  subtitle: { color: '#444', margin: '5px 0 0', fontWeight: 600 },
  searchWrapper: { position: 'relative' },
  searchIcon: { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' },
  searchInput: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '15px 20px 15px 50px', color: '#fff', width: '300px', outline: 'none' },

  tableScrollWrapper: { flex: 1, overflowY: 'auto', padding: '0 50px 40px', width: '100%', overflowX: 'hidden' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', tableLayout: 'fixed' },
  stickyThead: { position: 'sticky', top: 0, zIndex: 10, background: '#050505' },
  theadRow: { textAlign: 'left', color: '#333', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px' },
  tr: { background: '#0a0a0a' },
  
  nameText: { fontWeight: 800, fontSize: '1rem', color: '#fff', paddingTop: '15px 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  idText: { fontSize: '0.7rem', color: '#333', paddingBottom: '15px', fontFamily: 'monospace' },
  typeBox: { display: 'flex', alignItems: 'center', gap: '8px' },
  typeBadge: { color: '#555', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' },
  dateText: { fontSize: '0.9rem', fontWeight: 600, color: '#d3bfa2' },
  statusContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
  revenueText: { fontWeight: 900, color: '#fff', fontSize: '1.1rem' },
  
  settleBtn: { background: 'transparent', border: '1px solid #222', color: '#555', padding: '10px 20px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' },
  activateBtn: { background: '#d3bfa2', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }
};

export default PratyekshaMasterAdmin;