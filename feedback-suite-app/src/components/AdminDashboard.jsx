import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Coffee,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Download,
  Filter,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  UsersRound,
  X,
  Send,
  RefreshCw,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboard, getFeedback, getCustomers, getCustomerFeedback, exportCustomersExcel } from '../api';
import { useNavigate } from 'react-router-dom';
import pratyekshaLogo from '../assets/pratyeksha-logo.png';

const nav = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'feedback', label: 'All feedback', icon: MessageSquareText },
  { id: 'customers', label: 'Customers', icon: UsersRound },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
];

const scoreKeys = [
  ['foodQuality', 'Food quality'],
  ['taste', 'Taste'],
  ['service', 'Service'],
  ['ambience', 'Ambience'],
];

function avg(ratings) {
  const values = scoreKeys.map(([key]) => Number(ratings?.[key] || 0)).filter(Boolean);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}
function StatCard({ label, value, caption, icon: Icon, tone = '' }) {
  return <div className={`stat-card ${tone}`}><div className="stat-icon"><Icon size={18} /></div><span className="stat-label">{label}</span><strong>{value}</strong><small>{caption}</small></div>;
}
function defaultFilters() { return { q: '', minRating: '', maxRating: '', belowThree: '', revisit: '', dateFrom: '', dateTo: '' }; }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState(defaultFilters());
  const [selected, setSelected] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const token = localStorage.getItem('jayAmbeAdminToken');

  useEffect(() => { if (!token) navigate('/admin/login'); }, [navigate, token]);
  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
    setInstalled(Boolean(standalone));
    const onBeforeInstall = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const onInstalled = () => { setInstallPrompt(null); setInstalled(true); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstall); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  const load = async ({ silent = false } = {}) => {
    if (!token) return;
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const params = { ...filters, limit: 5000 };
      const [dash, feedback] = await Promise.all([
        getDashboard(token, filters),
        getFeedback(token, params),
      ]);
      setDashboard(dash.data);
      setRows(feedback.data.items || []);
      if (active === 'customers') {
        const customerRes = await getCustomers(token, { q: filters.q, dateFrom: filters.dateFrom, dateTo: filters.dateTo, minRating: filters.minRating, maxRating: filters.maxRating, limit: 5000 });
        setCustomers(customerRes.data.items || []);
      }
    } catch (err) {
      if (err?.response?.status === 401) { localStorage.removeItem('jayAmbeAdminToken'); navigate('/admin/login'); }
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [active, filters.dateFrom, filters.dateTo, filters.belowThree, filters.minRating, filters.maxRating, filters.revisit]);
  useEffect(() => {
    if (active !== 'customers' || !token) return;
    getCustomers(token, { q: filters.q, dateFrom: filters.dateFrom, dateTo: filters.dateTo, minRating: filters.minRating, maxRating: filters.maxRating, limit: 5000 })
      .then((res) => setCustomers(res.data.items || []))
      .catch(() => {});
  }, [active, filters.q]);

  const installAdminApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };
  const logout = () => { localStorage.removeItem('jayAmbeAdminToken'); navigate('/admin/login'); };
  const resetFilters = () => setFilters(defaultFilters());

  const filteredRows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesQ = !q || [item.name, item.mobile, item.source, item.likedMost, item.improve, item.comments].some((v) => String(v || '').toLowerCase().includes(q));
      const s = avg(item.ratings);
      const matchesRating = (!filters.minRating || s >= Number(filters.minRating)) && (!filters.maxRating || s <= Number(filters.maxRating));
      const matchesBelow = !filters.belowThree || (filters.belowThree === 'true' && s < 3);
      const matchesRevisit = !filters.revisit || item.revisit === filters.revisit;
      return matchesQ && matchesRating && matchesBelow && matchesRevisit;
    });
  }, [rows, filters]);

  const exportExcel = async () => {
    try {
      const blob = await exportCustomersExcel(token, { q: filters.q, dateFrom: filters.dateFrom, dateTo: filters.dateTo, minRating: filters.minRating, maxRating: filters.maxRating });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `jay-ambe-customers-${new Date().toISOString().slice(0,10)}.xlsx`; a.click(); URL.revokeObjectURL(url);
    } catch { /* keep the dashboard usable even if an export fails */ }
  };

  if (!token) return null;
  return (
    <main className="dashboard-shell">
      <aside className={`dashboard-sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="dashboard-brand"><div className="brand-icon"><Coffee size={20} strokeWidth={1.8} /></div><div><b>JAY AMBE CAFE</b><span>INSIGHT</span></div></div>
        <div className="sidebar-section">
          <span className="sidebar-label">Workspace</span>
          {nav.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-button ${active === id ? 'active' : ''}`} onClick={() => { setActive(id); setMobileNav(false); }}><Icon size={18} />{label}{id === 'feedback' && dashboard?.total ? <em>{dashboard.total}</em> : null}</button>)}
          <button
              className="nav-button campaign-nav"
              onClick={() => {
                // Always invalidate any previous Campaign Studio unlock before opening it.
                sessionStorage.removeItem('jayAmbeCampaignAccessToken');
                navigate('/campaigns', { state: { campaignOpenAt: Date.now() } });
                setMobileNav(false);
              }}
            >
              <Send size={18} />Campaign Studio
            </button>
        </div>
        <div className="sidebar-bottom"><button className="nav-button" onClick={logout}><LogOut size={18} /> Sign out</button><div className="sidebar-powered"><small>POWERED BY</small><img src={pratyekshaLogo} alt="Pratyeksha" style={{ width: 104, maxWidth: '100%', height: 'auto', display: 'block' }} /></div><div className="operator-mini"><ShieldCheck size={16} /><span>Protected operator area</span></div></div>
      </aside>
      {mobileNav && <div className="mobile-overlay" onClick={() => setMobileNav(false)} />}
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div><span className="eyebrow">JAY AMBE CAFE / CUSTOMER VOICE</span><h1>{nav.find((n) => n.id === active)?.label}</h1></div>
          <div className="top-actions">
            {!installed && <button className="ghost-button install-button" onClick={installAdminApp}>Install app</button>}
            <button className="ghost-button export-button" onClick={exportExcel}><Download size={16} /><span>Excel</span></button>
            <button className="ghost-button refresh-button" onClick={() => load({ silent: true })}><RefreshCw size={15} className={refreshing ? 'spin' : ''} /><span>Refresh</span></button>
            <button className="avatar-button" title="Admin"><CircleUserRound size={19} /></button>
          </div>
        </header>
        {loading && !dashboard ? <div className="loading-state">Loading your feedback intelligence…</div> : <>
          {active === 'overview' && <Overview dashboard={dashboard} rows={filteredRows} onSelect={setSelected} installPrompt={installPrompt} installed={installed} onInstall={installAdminApp} />}
          {active === 'feedback' && <FeedbackTab rows={filteredRows} filters={filters} setFilters={setFilters} onSelect={setSelected} onReset={resetFilters} />}
          {active === 'customers' && <CustomersTab customers={customers} onSelect={setSelectedCustomer} filters={filters} setFilters={setFilters} onReset={resetFilters} onExport={exportExcel} />}
          {active === 'insights' && <InsightsTab dashboard={dashboard} rows={rows} />}
        </>}
      </section>
      {selected && <FeedbackDrawer item={selected} onClose={() => setSelected(null)} />}
      {selectedCustomer && <CustomerDrawer customer={selectedCustomer} token={token} onClose={() => setSelectedCustomer(null)} />}
    </main>
  );
}

function CoffeeMark() { return <span className="coffee-mark"><span>J</span></span>; }

function Overview({ dashboard, rows, onSelect, installPrompt, installed, onInstall }) {
  const ratingData = scoreKeys.map(([key, label]) => ({ name: label, score: Number(dashboard?.categoryAverages?.[key] || 0) }));
  return <div className="dashboard-content">
    <div className="welcome-banner"><div><span className="eyebrow">THE PULSE OF YOUR CAFE</span><h2>Small comments. <em>Big signals.</em></h2><p>One customer can visit many times. Every visit is counted; customer profiles stay unique by mobile number.</p></div><div className="banner-orbit"><HeartHandshake size={42} strokeWidth={1.2} /></div></div>
    {dashboard && <div className="admin-app-banner"><div className="admin-app-banner-icon"><UsersRound size={20} /></div><div><strong>{dashboard.uniqueCustomers ?? 0} unique customers · {dashboard.total ?? 0} feedback responses</strong><span>Repeat visits stay in feedback history while one customer record is maintained for campaigns and retention.</span></div>{installPrompt && !installed ? <button className="primary-button compact-button" onClick={onInstall}>Install app</button> : installed ? <span className="installed-badge">Installed</span> : null}</div>}
    <div className="stats-grid">
      <StatCard label="Total feedback" value={dashboard?.total ?? 0} caption="Every submitted response" icon={MessageSquareText} />
      <StatCard label="Unique customers" value={dashboard?.uniqueCustomers ?? 0} caption="One record per mobile" icon={UsersRound} />
      <StatCard label="Repeat customers" value={dashboard?.repeatCustomerCount ?? 0} caption="More than one response" icon={TrendingUp} />
      <StatCard label="Below 3★" value={dashboard?.feedbackBelowThree ?? 0} caption="Needs attention" icon={Star} tone="stat-alert" />
    </div>
    <div className="dashboard-grid two-col">
      <div className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">PERFORMANCE</span><h3>Experience by dimension</h3></div><span className="panel-chip">/ 5</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={290}><BarChart data={ratingData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}><CartesianGrid vertical={false} stroke="#e7e0d4" /><XAxis dataKey="name" tick={{ fontSize: 11, fill: '#766f66' }} axisLine={false} tickLine={false} /><YAxis domain={[0,5]} tick={{ fontSize: 11, fill: '#766f66' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7e0d4' }} /><Bar dataKey="score" radius={[8,8,2,2]} fill="#71806b" /></BarChart></ResponsiveContainer></div></div>
      <div className="panel source-panel"><div className="panel-head"><div><span className="eyebrow">DISCOVERY</span><h3>How guests found you</h3></div></div><div className="source-list">{(dashboard?.sources || []).slice(0,6).map((item)=><div className="source-row" key={item.label}><div><span>{item.label}</span><small>{item.count} responses</small></div><strong>{item.percent}%</strong><div className="mini-bar"><span style={{width:`${item.percent}%`}} /></div></div>)}{!dashboard?.sources?.length && <Empty text="Source data will appear after the first responses." />}</div></div>
    </div>
    <div className="panel recent-panel"><div className="panel-head"><div><span className="eyebrow">RECENT VOICES</span><h3>Latest guest feedback</h3></div><span className="panel-chip">{rows.length} loaded</span></div><FeedbackTable rows={rows.slice(0,8)} onSelect={onSelect} /></div>
  </div>;
}

function FilterBar({ filters, setFilters, onReset, customers = false, onExport }) {
  return <div className="panel toolbar-panel deep-filter-panel">
    <div className="search-field"><Search size={17} /><input placeholder={customers ? 'Search customer name or mobile…' : 'Search guest, mobile, source or comment…'} value={filters.q} onChange={(e)=>setFilters(f=>({...f,q:e.target.value}))} /></div>
    <label className="filter-field"><span>From</span><input type="date" value={filters.dateFrom} onChange={(e)=>setFilters(f=>({...f,dateFrom:e.target.value}))} /></label>
    <label className="filter-field"><span>To</span><input type="date" value={filters.dateTo} onChange={(e)=>setFilters(f=>({...f,dateTo:e.target.value}))} /></label>
    <select value={filters.minRating} onChange={(e)=>setFilters(f=>({...f,minRating:e.target.value}))}><option value="">Min rating</option><option value="4">4★+</option><option value="3">3★+</option><option value="2">2★+</option></select>
    <select value={filters.maxRating} onChange={(e)=>setFilters(f=>({...f,maxRating:e.target.value}))}><option value="">Max rating</option><option value="2">2★ or less</option><option value="3">3★ or less</option><option value="4">4★ or less</option></select>
    {!customers && <select value={filters.belowThree} onChange={(e)=>setFilters(f=>({...f,belowThree:e.target.value}))}><option value="">All experience</option><option value="true">Below 3★ only</option></select>}
    {!customers && <select value={filters.revisit} onChange={(e)=>setFilters(f=>({...f,revisit:e.target.value}))}><option value="">All revisit intent</option><option value="Yes, definitely">Would return</option><option value="Maybe">Maybe</option><option value="Not this time">Not this time</option></select>}
    <div className="filter-actions"><button className="ghost-button" onClick={onReset}><Filter size={15}/> Reset</button>{customers && <button className="ghost-button export-button" onClick={onExport}><Download size={15}/> Excel</button>}</div>
  </div>;
}

function FeedbackTab({ rows, filters, setFilters, onSelect, onReset }) {
  return <div className="dashboard-content"><FilterBar filters={filters} setFilters={setFilters} onReset={onReset} /><div className="panel"><div className="panel-head"><div><span className="eyebrow">FEEDBACK LIBRARY</span><h3>{rows.length} responses</h3></div><span className="panel-chip">Below 3★ are highlighted</span></div><FeedbackTable rows={rows} onSelect={onSelect} showCount /></div></div>;
}

function CustomersTab({ customers, onSelect, filters, setFilters, onReset, onExport }) {
  return <div className="dashboard-content"><FilterBar customers filters={filters} setFilters={setFilters} onReset={onReset} onExport={onExport} /><div className="panel"><div className="panel-head"><div><span className="eyebrow">UNIQUE CUSTOMER DIRECTORY</span><h3>{customers.length} customer profiles</h3></div><span className="panel-chip">Phone-number deduplicated</span></div><div className="customer-grid">{customers.map((c)=><article className="customer-card customer-card-rich" key={c._id} onClick={()=>onSelect(c)}><div className="customer-avatar">{(c.name||'G').slice(0,1).toUpperCase()}</div><div><strong>{c.name||'Guest'}</strong><span>{c.mobile}</span><small>{c.feedbackCount||0} feedback · Last {formatDate(c.lastFeedbackAt)}</small></div><div className="customer-score"><Star size={14} fill="currentColor" /> {Number(c.averageRating||0).toFixed(1)}</div></article>)}{!customers.length && <Empty text="No unique customers match these filters."/>}</div></div></div>;
}

function InsightsTab({ dashboard, rows }) {
  const sentiment=[{name:'Would return',value:rows.filter(r=>r.revisit==='Yes, definitely').length},{name:'Maybe',value:rows.filter(r=>r.revisit==='Maybe').length},{name:'Not this time',value:rows.filter(r=>r.revisit==='Not this time').length}];
  const colors=['#71806b','#b29a76','#8b6b60'];
  const below=rows.filter(r=>avg(r.ratings)<3).length;
  return <div className="dashboard-content"><div className="stats-grid"><StatCard label="Average experience" value={dashboard?.averageRating ? `${dashboard.averageRating}/5` : '—'} caption="Across all dimensions" icon={Star}/><StatCard label="Would return" value={`${dashboard?.revisitRate??0}%`} caption="Yes / definitely" icon={TrendingUp}/><StatCard label="Low-score feedback" value={below} caption="Below 3★ in current data" icon={MessageSquareText} tone="stat-alert"/><StatCard label="Unique customers" value={dashboard?.uniqueCustomers??0} caption="Campaign-ready profiles" icon={UsersRound}/></div><div className="insight-grid"><div className="panel"><div className="panel-head"><div><span className="eyebrow">RETENTION SIGNAL</span><h3>Return intent</h3></div></div><div className="donut-wrap"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={sentiment} dataKey="value" nameKey="name" innerRadius={65} outerRadius={90} paddingAngle={4}>{sentiment.map((_,i)=><Cell key={i} fill={colors[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{dashboard?.revisitRate??0}%</strong><span>would return</span></div></div><div className="legend-list">{sentiment.map((item,i)=><div key={item.name}><span><i style={{background:colors[i]}}/>{item.name}</span><b>{item.value}</b></div>)}</div></div><div className="panel"><div className="panel-head"><div><span className="eyebrow">OPERATOR SIGNALS</span><h3>What deserves attention</h3></div></div><div className="signal-list">{scoreKeys.map(([key,label])=>({key,label,score:Number(dashboard?.categoryAverages?.[key]||0)})).sort((a,b)=>a.score-b.score).map(item=><div className="signal-row" key={item.key}><div><span>{item.label}</span><strong>{item.score.toFixed(1)}</strong></div><div className="signal-track"><span style={{width:`${item.score/5*100}%`}}/></div></div>)}</div><div className="insight-note"><TrendingUp size={18}/><span>Use the date filters and the Below 3★ filter together to isolate operational issues and follow-up opportunities.</span></div></div></div></div>;
}

function FeedbackTable({ rows, onSelect, showCount=false }) {
  if (!rows.length) return <Empty text="No feedback matches these filters."/>;
  return <div className="table-wrap"><table className="feedback-table"><thead><tr><th>#</th><th>Guest</th><th>Experience</th><th>Revisit</th><th>Source</th><th>Date</th><th /></tr></thead><tbody>{rows.map((r,i)=>{const low=avg(r.ratings)<3;return <tr key={r._id} className={low?'low-rating-row':''} onClick={()=>onSelect(r)}><td>{showCount ? i+1 : '•'}</td><td><div className="guest-cell"><span className="guest-dot">{(r.name||'A').slice(0,1).toUpperCase()}</span><div><b>{r.name||'Anonymous guest'}</b><small>{r.mobile||'Contact not shared'}{r.customer?.feedbackCount>1 ? ` · ${r.customer.feedbackCount} total` : ''}</small></div></div></td><td><span className={`score-pill ${low?'low-score-pill':''}`}><Star size={13} fill="currentColor"/> {avg(r.ratings).toFixed(1)}</span></td><td><span className={`revisit-pill ${r.revisit==='Yes, definitely'?'positive':r.revisit==='Not this time'?'negative':''}`}>{r.revisit||'—'}</span></td><td>{r.source||'—'}</td><td>{formatDate(r.createdAt)}</td><td><ChevronRight size={17}/></td></tr>})}</tbody></table></div>;
}

function FeedbackDrawer({ item, onClose }) {
  return <div className="drawer-overlay" onClick={onClose}><aside className="feedback-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">FEEDBACK DETAIL</span><h2>{item.name||'Anonymous guest'}</h2><p>{formatDate(item.createdAt)} · {item.source||'Source not shared'}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className="drawer-body"><div className={`drawer-score ${avg(item.ratings)<3?'low-drawer-score':''}`}><strong>{avg(item.ratings).toFixed(1)}</strong><span>overall experience</span></div><div className="drawer-ratings">{scoreKeys.map(([key,label])=><div key={key}><span>{label}</span><b>{item.ratings?.[key]||0}/5</b></div>)}</div><div className="quote-block"><span>Liked most</span><p>{item.likedMost||'No comment shared.'}</p></div><div className="quote-block"><span>Could improve</span><p>{item.improve||'No improvement note shared.'}</p></div><div className="quote-block"><span>Additional comments</span><p>{item.comments||'No additional comment.'}</p></div><div className="drawer-meta"><span>Return intent</span><b>{item.revisit||'Not answered'}</b></div>{item.mobile&&<div className="drawer-meta"><span>Mobile</span><b>{item.mobile}</b></div>}</div></aside></div>;
}

function CustomerDrawer({ customer, token, onClose }) {
  const [history,setHistory]=useState([]);
  const [profile,setProfile]=useState(customer);
  useEffect(()=>{getCustomerFeedback(token,customer._id).then(r=>setHistory(r.data.items||[])).catch(()=>{});},[customer._id,token]);
  return <div className="drawer-overlay" onClick={onClose}><aside className="feedback-drawer customer-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">CUSTOMER PROFILE</span><h2>{customer.name}</h2><p>{customer.mobile} · {customer.feedbackCount||0} feedback responses</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></div><div className="drawer-body"><div className="customer-profile-hero"><div className="customer-avatar large">{(customer.name||'G').slice(0,1).toUpperCase()}</div><div><strong>{Number(customer.averageRating||0).toFixed(1)}/5</strong><span>lifetime average</span></div></div><div className="history-title"><span className="eyebrow">FEEDBACK HISTORY</span><h3>Every visit stays here</h3></div><div className="customer-history">{history.map((item)=><button key={item._id} onClick={()=>{}} className={`history-item ${avg(item.ratings)<3?'low-history':''}`}><span>{formatDate(item.createdAt)}</span><b>{avg(item.ratings).toFixed(1)}★</b><small>{item.revisit||'—'} · {item.source||'Source not shared'}</small></button>)}{!history.length&&<Empty text="No feedback history found."/>}</div></div></aside></div>;
}

function Empty({ text }) { return <div className="empty-state"><MessageSquareText size={20}/><span>{text}</span></div>; }
