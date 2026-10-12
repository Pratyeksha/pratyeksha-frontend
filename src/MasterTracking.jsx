import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import API_BASE_URL from './apiBase.js';
import {
  Radar, RefreshCcw, Download, Search, MapPin, Activity, Store, IndianRupee, Users, HeartPulse,
  CalendarClock, MessageCircle, ChevronDown, ChevronUp, Layers, Target, ArrowUpRight, X,
} from 'lucide-react';

const BASE = API_BASE_URL;
const GOLD = '#d3bfa2', BRONZE = '#8a704d', IVORY = '#efe6d6', COPPER = '#e29a58', SAND = '#b9a27e', TAUPE = '#7d7d85';
const LINE = 'rgba(211,191,162,0.16)';
const CARD = { background: 'linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.016))', border: `1px solid ${LINE}`, borderRadius: 18, boxShadow: '0 18px 44px -22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' };
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Playfair Display', Georgia, serif";
const HEALTH_COLOR = { Thriving: '#ecdcb9', Steady: GOLD, 'At risk': COPPER, Dormant: TAUPE };
const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const compact = (n) => (n >= 1e7 ? `${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n || 0)));
const ago = (iso) => {
  if (!iso) return 'never';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'today'; if (d === 1) return 'yesterday'; if (d < 30) return `${d}d ago`; return `${Math.floor(d / 30)}mo ago`;
};
const keyOf = (city, area) => `${String(city || '').trim().toLowerCase()}|${String(area || '').trim().toLowerCase()}`;
const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const Tile = ({ icon: Icon, label, value, sub, tone = GOLD }) => (
  <div style={{ ...CARD, padding: '16px 16px 14px', minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>
      <Icon size={13} color={tone} /> {label}
    </div>
    <div style={{ marginTop: 10, fontSize: 26, fontWeight: 700, color: '#f7f3eb', fontFamily: MONO, letterSpacing: -0.5 }}>{value}</div>
    {sub && <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{sub}</div>}
  </div>
);

const Section = ({ title, hint, right, children, style }) => (
  <section style={{ ...CARD, padding: 18, minWidth: 0, ...style }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: GOLD, textTransform: 'uppercase' }}>{title}</div>
        {hint && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{hint}</div>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

/* Area chart with hover read-out (pure SVG). */
function TrendChart({ data, field, color = GOLD, fmt = (n) => n }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 190, P = { l: 8, r: 8, t: 14, b: 22 };
  const max = Math.max(1, ...data.map((d) => d[field]));
  const x = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(1, data.length - 1);
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const pts = data.map((d, i) => [x(i), y(d[field])]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const id = `g-${field}`;
  const h = hover != null ? data[hover] : null;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label={`${field} trend`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.round(((e.clientX - r.left) / r.width * W - P.l) / ((W - P.l - P.r) / Math.max(1, data.length - 1))); setHover(Math.min(data.length - 1, Math.max(0, i))); }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.34" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={P.l} x2={W - P.r} y1={P.t + (1 - t) * (H - P.t - P.b)} y2={P.t + (1 - t) * (H - P.t - P.b)} stroke="rgba(255,255,255,0.06)" />)}
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && <><line x1={pts[hover][0]} x2={pts[hover][0]} y1={P.t} y2={H - P.b} stroke="rgba(211,191,162,0.4)" strokeDasharray="3 3" /><circle cx={pts[hover][0]} cy={pts[hover][1]} r="4" fill="#141416" stroke={color} strokeWidth="2" /></>}
        <text x={P.l} y={H - 5} fill="rgba(255,255,255,0.35)" fontSize="10">{data[0]?.date?.slice(5)}</text>
        <text x={W - P.r} y={H - 5} fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="end">{data[data.length - 1]?.date?.slice(5)}</text>
      </svg>
      {h && (
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '6px 10px', borderRadius: 10, background: 'rgba(20,20,22,0.92)', border: `1px solid ${LINE}`, fontSize: 11, color: '#f7f3eb' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{h.date}</span> · <b style={{ fontFamily: MONO, color }}>{fmt(h[field])}</b>
        </div>
      )}
    </div>
  );
}

const Bar = ({ value, max, color = GOLD, height = 7 }) => (
  <div style={{ height, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
    <div style={{ width: `${max ? Math.max(2, Math.min(100, (value / max) * 100)) : 0}%`, height: '100%', background: `linear-gradient(90deg, ${BRONZE}, ${color})`, borderRadius: 99 }} />
  </div>
);

const Pill = ({ children, color = GOLD }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color, background: `${color}1f`, border: `1px solid ${color}44` }}>{children}</span>
);

const Health = ({ score, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 128 }}>
    <div style={{ flex: 1 }}><Bar value={score} max={100} color={HEALTH_COLOR[label]} /></div>
    <span style={{ fontFamily: MONO, fontSize: 11, color: HEALTH_COLOR[label], fontWeight: 700, width: 22, textAlign: 'right' }}>{score}</span>
  </div>
);

const TABS = [['overview', 'Overview', Activity], ['health', 'Tenant health', HeartPulse], ['geo', 'Area intelligence', MapPin], ['renewals', 'Renewals', CalendarClock], ['adoption', 'Adoption', Layers]];

export default function MasterTracking({ onOpenClients, onOpenCrm }) {
  const [data, setData] = useState(null);
  const [areas, setAreas] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState('overview');
  const [q, setQ] = useState('');
  const [label, setLabel] = useState('all');
  const [sort, setSort] = useState({ key: 'health', dir: -1 });
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [t, a] = await Promise.all([
        axios.get(`${BASE}/admin/master/tracking`, { params: { days }, timeout: 30000 }),
        axios.get(`${BASE}/crm/areas`, { timeout: 15000 }).catch(() => ({ data: null })),
      ]);
      setData(t.data); setAreas(a.data);
    } catch (e) { setError(e?.response?.data?.error || 'Could not load tracking data'); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const list = data.tenants.filter((t) => (label === 'all' || t.healthLabel === label) && (!needle || `${t.name} ${t.tenantId} ${t.city} ${t.area} ${t.owner}`.toLowerCase().includes(needle)));
    const v = (t) => (sort.key === 'name' ? t.name.toLowerCase() : sort.key === 'idle' ? (t.idleDays ?? 9999) : sort.key === 'plan' ? (t.daysLeft ?? -9999) : t[sort.key] ?? 0);
    return [...list].sort((a, b) => (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * sort.dir);
  }, [data, q, label, sort]);

  const geoRows = useMemo(() => {
    if (!data) return [];
    const leadMap = new Map((areas?.areas || []).map((a) => [keyOf(a.city, a.area), a]));
    const seen = new Set();
    const out = data.geography.map((g) => {
      const k = keyOf(g.city === 'Unspecified' ? '' : g.city, g.area === '—' ? '' : g.area); seen.add(k);
      const l = leadMap.get(k);
      return { ...g, leads: l?.total || 0, open: l?.open || 0, pipeline: l?.pipelineValue || 0, won: (l?.won || 0) + (l?.live || 0) + (l?.onboarding || 0) };
    });
    for (const a of areas?.areas || []) {
      const k = keyOf(a.city, a.area); if (seen.has(k)) continue;
      out.push({ city: a.city || 'Unspecified', area: a.area || '—', tenants: 0, active: 0, orders: 0, revenue: 0, avgHealth: 0, leads: a.total, open: a.open, pipeline: a.pipelineValue, won: a.won + a.live + a.onboarding });
    }
    return out.sort((a, b) => b.tenants - a.tenants || b.leads - a.leads);
  }, [data, areas]);

  const exportXlsx = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.tenants.map((t) => ({ Tenant: t.name, ID: t.tenantId, City: t.city, Area: t.area, Health: t.health, Status: t.healthLabel, [`Orders (${days}d)`]: t.orders, [`Revenue (${days}d)`]: t.revenue, 'Last order': t.lastOrderAt ? new Date(t.lastOrderAt).toISOString().slice(0, 10) : '', 'Plan days left': t.daysLeft, Guests: t.customers, Staff: t.staff, 'Total paid': t.paid }))), 'Tenants');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(geoRows.map((g) => ({ City: g.city, Area: g.area, Clients: g.tenants, Active: g.active, Orders: g.orders, Revenue: g.revenue, Leads: g.leads, 'Open leads': g.open, 'Pipeline value': g.pipeline }))), 'Areas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.daily), 'Daily');
    XLSX.writeFile(wb, `pratyeksha-tracking-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const th = (key, text, align = 'left') => (
    <th style={{ textAlign: align, padding: '10px 12px', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}
      onClick={() => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'name' ? 1 : -1 }))}>
      {text}{sort.key === key && (sort.dir === -1 ? <ChevronDown size={11} style={{ verticalAlign: -1, marginLeft: 3 }} /> : <ChevronUp size={11} style={{ verticalAlign: -1, marginLeft: 3 }} />)}
    </th>
  );

  const wa = (t, text) => {
    let n = String(t.contact || '').replace(/\D/g, ''); if (n.length === 10) n = `91${n}`;
    return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
  };

  return (
    <div className="p-scroll" style={{ height: '100%', overflowY: 'auto', padding: '26px clamp(14px,2.4vw,34px) 48px', fontFamily: 'Inter, system-ui, sans-serif', color: '#f1ede4', textAlign: 'left' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2.4, color: GOLD, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}><Radar size={13} /> Control tower</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3.2vw,36px)', fontWeight: 700, margin: '8px 0 4px', color: '#f7f3eb', letterSpacing: 0.3, textAlign: 'left' }}>Platform tracking</h1>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{data ? `Live from ${data.totals.tenants} tenants · refreshed ${new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', padding: 3, borderRadius: 12, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.03)' }}>
            {[7, 30, 90].map((d) => <button key={d} type="button" onClick={() => setDays(d)} style={{ border: 0, cursor: 'pointer', padding: '7px 13px', borderRadius: 9, fontSize: 11, fontWeight: 800, background: days === d ? `linear-gradient(135deg,#e6d6b8,${GOLD})` : 'transparent', color: days === d ? '#14110c' : 'rgba(255,255,255,0.6)' }}>{d}d</button>)}
          </div>
          <button type="button" onClick={exportXlsx} disabled={!data} style={ghost}><Download size={13} /> Export</button>
          <button type="button" onClick={load} style={ghost}><RefreshCcw size={13} className={loading ? 'spin' : ''} /> Refresh</button>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 18, paddingBottom: 2 }} className="no-sb" aria-label="Tracking sections">
        {TABS.map(([id, text, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 13, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: `1px solid ${tab === id ? 'rgba(211,191,162,0.5)' : LINE}`, background: tab === id ? 'linear-gradient(135deg, rgba(211,191,162,0.22), rgba(211,191,162,0.06))' : 'transparent', color: tab === id ? '#f7f3eb' : 'rgba(255,255,255,0.55)' }}><Icon size={14} color={tab === id ? GOLD : undefined} /> {text}</button>
        ))}
      </nav>

      {error && <div style={{ ...CARD, padding: 16, borderColor: 'rgba(226,154,88,0.4)', color: COPPER, fontSize: 13, marginBottom: 14 }}>{error} <button type="button" onClick={load} style={{ ...ghost, marginLeft: 10 }}>Retry</button></div>}
      {!data && !error && <div style={{ ...CARD, padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Gathering numbers…</div>}

      {data && tab === 'overview' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
            <Tile icon={Store} label="Tenants" value={data.totals.tenants} sub={`${data.totals.active} on an active plan`} />
            <Tile icon={Activity} label={`Orders · ${days}d`} value={compact(data.totals.orders)} sub="across all outlets" tone={IVORY} />
            <Tile icon={IndianRupee} label={`Billed · ${days}d`} value={`₹${compact(data.totals.revenue)}`} sub="settled bills, tenants’ revenue" tone={SAND} />
            <Tile icon={Users} label="Guests captured" value={compact(data.totals.customers)} sub="consented guest profiles" tone={GOLD} />
            <Tile icon={HeartPulse} label="Avg health" value={data.totals.avgHealth} sub={`${data.totals.dormant} dormant · ${data.totals.atRisk} at risk`} tone={data.totals.avgHealth >= 50 ? IVORY : COPPER} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 14 }}>
            <Section title="Orders per day" hint={`Last ${days} days, IST`}><TrendChart data={data.daily} field="orders" color={GOLD} fmt={(n) => `${n} orders`} /></Section>
            <Section title="Billed per day" hint="Settled bills"><TrendChart data={data.daily} field="revenue" color={SAND} fmt={inr} /></Section>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 14 }}>
            <Section title="Top outlets" hint={`By billed amount · ${days}d`}>
              {[...data.tenants].sort((a, b) => b.revenue - a.revenue).slice(0, 6).map((t, i) => (
                <div key={t.tenantId} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}><span style={{ color: '#f1ede4' }}>{i + 1}. {t.name}</span><span style={{ fontFamily: MONO, color: GOLD }}>{inr(t.revenue)}</span></div>
                  <Bar value={t.revenue} max={Math.max(1, ...data.tenants.map((x) => x.revenue))} />
                </div>
              ))}
              {data.tenants.length === 0 && <Empty text="No tenants yet" />}
            </Section>
            <Section title="Order sources" hint={`${days}d`}>
              {data.sources.length === 0 ? <Empty text="No orders in this window" /> : data.sources.map((s) => (
                <div key={s.source} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, textTransform: 'capitalize' }}><span>{s.source}</span><span style={{ fontFamily: MONO, color: GOLD }}>{s.orders}</span></div>
                  <Bar value={s.orders} max={data.sources[0].orders} color={IVORY} />
                </div>
              ))}
            </Section>
            <Section title="Needs attention" hint="Dormant, at risk or renewing soon">
              {data.tenants.filter((t) => t.healthLabel === 'Dormant' || t.healthLabel === 'At risk' || (t.daysLeft !== null && t.daysLeft > 0 && t.daysLeft <= 14)).slice(0, 7).map((t) => (
                <div key={t.tenantId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div><div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>last order {ago(t.lastOrderAt)}{t.daysLeft !== null && t.daysLeft > 0 && t.daysLeft <= 14 ? ` · plan ${t.daysLeft}d left` : ''}</div></div>
                  <Pill color={HEALTH_COLOR[t.healthLabel]}>{t.healthLabel}</Pill>
                </div>
              ))}
              {data.tenants.every((t) => t.healthLabel !== 'Dormant' && t.healthLabel !== 'At risk') && <Empty text="Everyone looks healthy" />}
            </Section>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Health score = {data.healthFormula}.</div>
        </div>
      )}

      {data && tab === 'health' && (
        <Section title="Tenant health" hint="Click a row for the full picture"
          right={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ ...field, display: 'flex', alignItems: 'center', gap: 7 }}><Search size={13} color="rgba(255,255,255,0.4)" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tenant, city, area" aria-label="Search tenants" style={{ background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 12, width: 170 }} />{q && <button type="button" onClick={() => setQ('')} aria-label="Clear" style={{ background: 'none', border: 0, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={13} /></button>}</div>
            <select value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Health filter" style={{ ...field, cursor: 'pointer' }}><option value="all">All health</option>{Object.keys(HEALTH_COLOR).map((l) => <option key={l} value={l}>{l}</option>)}</select>
          </div>}>
          <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
            <table style={{ width: '100%', minWidth: 860, borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${LINE}` }}>{th('name', 'Tenant')}{th('health', 'Health')}{th('orders', `Orders ${days}d`, 'right')}{th('revenue', 'Billed', 'right')}{th('idle', 'Last order')}{th('plan', 'Plan')}{th('customers', 'Guests', 'right')}</tr></thead>
              <tbody>
                {rows.map((t) => (
                  <React.Fragment key={t.tenantId}>
                    <tr onClick={() => setOpen(open === t.tenantId ? null : t.tenantId)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: open === t.tenantId ? 'rgba(211,191,162,0.06)' : 'transparent' }}>
                      <td style={{ padding: '11px 12px' }}><div style={{ fontWeight: 700, color: '#f7f3eb' }}>{t.name}</div><div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>{[t.area, t.city].filter(Boolean).join(', ') || t.tenantId}</div></td>
                      <td style={{ padding: '11px 12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Health score={t.health} label={t.healthLabel} /><Pill color={HEALTH_COLOR[t.healthLabel]}>{t.healthLabel}</Pill></div></td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: MONO }}>{t.orders}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: MONO, color: GOLD }}>{inr(t.revenue)}</td>
                      <td style={{ padding: '11px 12px', color: t.idleDays !== null && t.idleDays > 7 ? COPPER : 'rgba(255,255,255,0.7)' }}>{ago(t.lastOrderAt)}</td>
                      <td style={{ padding: '11px 12px', color: t.daysLeft === null || t.daysLeft <= 0 ? COPPER : t.daysLeft <= 14 ? SAND : 'rgba(255,255,255,0.7)' }}>{t.daysLeft === null ? 'No plan' : t.daysLeft <= 0 ? `Expired ${Math.abs(t.daysLeft)}d` : `${t.daysLeft}d left`}{!t.isActive && ' · disabled'}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: MONO }}>{t.customers}</td>
                    </tr>
                    {open === t.tenantId && (
                      <tr><td colSpan={7} style={{ padding: '4px 12px 16px', background: 'rgba(211,191,162,0.04)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 8 }}>
                          {[['Orders · 7d', t.orders7d], ['All-time orders', t.totalOrders], ['Staff', t.staff], ['Tables', t.tableCount], ['Total paid to Pratyeksha', inr(t.paid)], ['Onboarded', t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—'], ['Owner', t.owner || '—'], ['Contact', t.contact || '—']].map(([k, v]) => (
                            <div key={k} style={{ padding: '9px 11px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.025)' }}><div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>{k}</div><div style={{ marginTop: 4, fontSize: 13, fontFamily: typeof v === 'number' ? MONO : undefined }}>{v}</div></div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                          {t.products.pratyeksha && <Pill>Pratyeksha</Pill>}{t.products.feedbackSuite && <Pill color={IVORY}>Feedback Suite</Pill>}{t.products.whatsappCampaigns && <Pill color={SAND}>WhatsApp</Pill>}
                          <span style={{ flex: 1 }} />
                          {(t.city || t.area) && <a href={mapsUrl(`${t.name}, ${t.area} ${t.city}`)} target="_blank" rel="noopener noreferrer" style={ghost}><MapPin size={12} /> Map</a>}
                          {wa(t, `Hi ${t.owner || t.name}, quick check-in from Pratyeksha — how is everything going at ${t.name}?`) && <a href={wa(t, `Hi ${t.owner || t.name}, quick check-in from Pratyeksha — how is everything going at ${t.name}?`)} target="_blank" rel="noopener noreferrer" style={ghost}><MessageCircle size={12} /> Check in</a>}
                          <button type="button" onClick={onOpenClients} style={ghost}>Open in clients <ArrowUpRight size={12} /></button>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
                {rows.length === 0 && <tr><td colSpan={7}><Empty text="No tenants match" /></td></tr>}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {data && tab === 'geo' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <Section title="Area intelligence" hint="Clients, orders and Lead CRM pipeline side by side — spot where to sell next"
            right={<button type="button" onClick={onOpenCrm} style={ghost}>Open Lead CRM <ArrowUpRight size={12} /></button>}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 780, borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'left' }}>{['Area', 'Clients', `Orders ${days}d`, 'Billed', 'Avg health', 'Leads', 'Open', 'Pipeline', 'Signal'].map((h, i) => <th key={h} style={{ padding: '10px 12px', fontWeight: 800, textAlign: i ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {geoRows.map((g) => {
                    const signal = g.tenants === 0 && g.open > 0 ? ['Untapped', COPPER] : g.tenants > 0 && g.avgHealth < 40 ? ['Needs care', COPPER] : g.tenants > 0 && g.open > 0 ? ['Growing', '#ecdcb9'] : g.tenants > 0 ? ['Established', GOLD] : ['—', TAUPE];
                    return (
                      <tr key={`${g.city}|${g.area}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '11px 12px' }}><div style={{ fontWeight: 700, color: '#f7f3eb' }}>{g.area}</div><div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>{g.city}</div></td>
                        <td style={num}>{g.tenants}<span style={{ color: 'rgba(255,255,255,0.35)' }}> / {g.active}</span></td>
                        <td style={num}>{g.orders}</td><td style={{ ...num, color: GOLD }}>{inr(g.revenue)}</td>
                        <td style={num}>{g.tenants ? g.avgHealth : '—'}</td><td style={num}>{g.leads}</td><td style={num}>{g.open}</td><td style={num}>{g.pipeline ? inr(g.pipeline) : '—'}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right' }}><Pill color={signal[1]}>{signal[0]}</Pill></td>
                      </tr>
                    );
                  })}
                  {geoRows.length === 0 && <tr><td colSpan={9}><Empty text="Add an area to your clients and leads to see this view" /></td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>Clients column reads “total / active plan”. Untapped = open leads in an area with no client yet.</div>
          </Section>
        </div>
      )}

      {data && tab === 'renewals' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 14 }}>
          {[['Renewing within 30 days', data.renewals.expiring, 'expiring'], ['Expired or no plan', data.renewals.expired, 'expired']].map(([title, list, kind]) => (
            <Section key={kind} title={title} hint={`${list.length} ${list.length === 1 ? 'tenant' : 'tenants'}`}>
              {list.length === 0 ? <Empty text="Nothing here" /> : list.map((t) => {
                const msg = kind === 'expiring' ? `Hi ${t.owner || t.name}, your Pratyeksha plan for ${t.name} renews in ${t.daysLeft} day${t.daysLeft === 1 ? '' : 's'}. Shall we renew it?` : `Hi ${t.owner || t.name}, your Pratyeksha plan for ${t.name} has ended. Would you like to renew?`;
                const link = wa(t, msg);
                return (
                  <div key={t.tenantId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{[t.area, t.city].filter(Boolean).join(', ')} · paid {inr(t.paid)}</div></div>
                    <Pill color={kind === 'expiring' ? (t.daysLeft <= 7 ? COPPER : SAND) : TAUPE}>{t.daysLeft === null ? 'No plan' : kind === 'expiring' ? `${t.daysLeft}d left` : `Ended ${Math.abs(t.daysLeft)}d ago`}</Pill>
                    {link && <a href={link} target="_blank" rel="noopener noreferrer" style={ghost} aria-label={`WhatsApp ${t.name}`}><MessageCircle size={12} /></a>}
                    <button type="button" onClick={onOpenClients} style={ghost}>Renew</button>
                  </div>
                );
              })}
            </Section>
          ))}
        </div>
      )}

      {data && tab === 'adoption' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 14 }}>
          <Section title="Product adoption" hint="Share of tenants on each product">
            {[['Pratyeksha (ordering & kitchen)', data.adoption.pratyeksha, GOLD], ['Feedback Suite', data.adoption.feedbackSuite, IVORY], ['WhatsApp Campaigns', data.adoption.whatsappCampaigns, SAND]].map(([name, n, c]) => (
              <div key={name} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}><span>{name}</span><span style={{ fontFamily: MONO, color: c }}>{n} / {data.totals.tenants} · {data.totals.tenants ? Math.round((n / data.totals.tenants) * 100) : 0}%</span></div>
                <Bar value={n} max={data.totals.tenants} color={c} height={9} />
              </div>
            ))}
          </Section>
          <Section title="Upsell candidates" hint="Healthy tenants not yet on Feedback Suite">
            {data.tenants.filter((t) => !t.products.feedbackSuite && t.health >= 50).slice(0, 8).map((t) => (
              <div key={t.tenantId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                <Target size={13} color={GOLD} /><span style={{ flex: 1 }}>{t.name}</span><span style={{ color: 'rgba(255,255,255,0.45)' }}>{t.orders} orders · {t.customers} guests</span>
              </div>
            ))}
            {data.tenants.filter((t) => !t.products.feedbackSuite && t.health >= 50).length === 0 && <Empty text="No candidates right now" />}
          </Section>
        </div>
      )}
    </div>
  );
}

const Empty = ({ text }) => <div style={{ padding: '22px 8px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>{text}</div>;
const ghost = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 11, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.03)', color: '#e8e2d8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit' };
const field = { padding: '8px 12px', borderRadius: 11, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.03)', color: '#f1ede4', fontSize: 12, fontFamily: 'inherit' };
const num = { padding: '11px 12px', textAlign: 'right', fontFamily: MONO };
