import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Guest Discovery & Marketing analytics - one screen shared by the Owner app and the Operator portal.
 *
 *   <DiscoveryAnalytics load={(days) => axios.get(...).then(r => r.data)} />
 *
 * `load(days)` must resolve to the report built by the server (GET /api/owner/discovery/:tenantId or
 * /api/operator/discovery/:tenantId). Palette: champagne gold, ivory and warm greys on ink - no green / blue / red.
 * Direction of change is shown with arrows and line styles, never with traffic-light colours.
 */

const P = {
  gold: '#d3bfa2', goldHi: '#ece0c8', goldLo: '#8a704d', ivory: '#f7f3eb',
  line: 'rgba(211,191,162,0.16)', lineStrong: 'rgba(211,191,162,0.36)',
  panel: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.014)), #0a0a0a',
  text: '#f7f3eb', med: 'rgba(247,243,235,0.68)', low: 'rgba(247,243,235,0.42)', faint: 'rgba(247,243,235,0.08)',
};

const CSS = `
.da{color:${P.text};font-family:inherit;display:grid;gap:16px;min-width:0}
.da *{box-sizing:border-box}
.da-card{background:${P.panel};border:1px solid ${P.line};border-radius:18px;padding:18px;min-width:0}
.da-h{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:900;letter-spacing:1.6px;text-transform:uppercase;color:rgba(211,191,162,.8);margin:0 0 14px}
.da-sub{font-size:11.5px;color:${P.low};line-height:1.55}
.da-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.da-grid{display:grid;gap:12px}
.da-kpis{grid-template-columns:repeat(auto-fit,minmax(168px,1fr))}
.da-two{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
.da-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid ${P.line};background:transparent;color:${P.med};border-radius:11px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:border-color .15s,color .15s,background .15s}
.da-btn:hover:not(:disabled){border-color:${P.lineStrong};color:${P.goldHi}}
.da-btn:disabled{opacity:.45;cursor:not-allowed}
.da-btn:focus-visible,.da-pill:focus-visible,.da-tab:focus-visible,.da-chip:focus-visible{outline:2px solid ${P.gold};outline-offset:2px}
.da-pill{border:1px solid ${P.line};background:transparent;color:${P.med};border-radius:100px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}
.da-pill[aria-pressed=true]{background:linear-gradient(135deg,#d3bfa2,#bda88a);color:#0c0c0c;border-color:transparent}
.da-tabs{display:flex;gap:2px;overflow-x:auto;border-bottom:1px solid ${P.line};scrollbar-width:none}
.da-tabs::-webkit-scrollbar{display:none}
.da-tab{flex:0 0 auto;border:0;background:transparent;color:${P.low};padding:11px 16px;font-size:12px;font-weight:900;letter-spacing:.4px;cursor:pointer;font-family:inherit;border-bottom:2px solid transparent;margin-bottom:-1px}
.da-tab[aria-selected=true]{color:${P.gold};border-bottom-color:${P.gold}}
.da-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid ${P.line};background:transparent;color:${P.low};border-radius:100px;padding:5px 11px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit}
.da-chip[aria-pressed=true]{color:${P.goldHi};border-color:${P.lineStrong};background:rgba(211,191,162,.08)}
.da-badge{display:inline-flex;align-items:center;border:1px solid ${P.line};border-radius:100px;padding:2px 9px;font-size:10px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:${P.med};white-space:nowrap}
.da-badge.on{border-color:${P.lineStrong};color:${P.goldHi};background:rgba(211,191,162,.1)}
.da-tbl{width:100%;border-collapse:collapse;font-size:12.5px}
.da-tbl th{text-align:left;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${P.low};font-weight:900;padding:0 10px 10px 0;white-space:nowrap}
.da-tbl td{padding:11px 10px 11px 0;border-top:1px solid ${P.faint};vertical-align:middle}
.da-tbl .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.da-scroll{overflow-x:auto}
.da-bar{height:8px;border-radius:100px;background:${P.faint};overflow:hidden}
.da-bar>i{display:block;height:100%;border-radius:100px;background:linear-gradient(90deg,${P.goldLo},${P.gold})}
.da-sk{position:relative;overflow:hidden;background:rgba(255,255,255,.05);border-radius:8px;flex:0 0 auto}
.da-sk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(100deg,transparent 0%,rgba(211,191,162,.13) 50%,transparent 100%);animation:daSweep 1.6s cubic-bezier(.4,0,.2,1) infinite;animation-delay:var(--d,0s)}
@keyframes daSweep{to{transform:translateX(100%)}}
.da-in{animation:daIn .35s ease both}
@keyframes daIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.da-spin{animation:daSpin .9s linear infinite}
@keyframes daSpin{to{transform:rotate(360deg)}}
.da-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:reduce){.da-sk::after{animation:none;display:none}.da-in{animation:none}.da-spin{animation:none}}
`;

/* ───────────── helpers ───────────── */
const n0 = (n) => (Number(n) || 0).toLocaleString('en-IN');
const money = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const pct = (n, d) => (d > 0 ? Math.min(100, Math.round((n / d) * 1000) / 10) : 0);
const hourLabel = (h) => `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
const hourRange = (h) => `${h % 12 || 12}–${(h + 1) % 12 || 12} ${(h + 1) % 24 >= 12 ? 'PM' : 'AM'}`;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KIND = { name: 'Name', area: 'Area', category: 'Category', dish: 'Dish', other: 'Other' };
const SOURCE = { list: 'Browsing the list', featured: 'Featured row', offers: 'Offers row', map: 'Map & details', recent: 'Recently viewed', saved: 'Saved places', surprise: '"Surprise me"', search: 'Search results' };
const fmtDay = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtWhen = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
const offerText = (o) => (o.type === 'percent_off' ? `${o.value}% off` : o.type === 'fixed_off' ? `₹${o.value} off` : o.type === 'free_item' ? `Free ${o.freeItem || 'item'}` : 'Happy hour');
const niceMax = (v) => { if (v <= 4) return 4; const p = 10 ** Math.floor(Math.log10(v)); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };

function Delta({ cur, prev, label = 'vs previous period' }) {
  const c = Number(cur) || 0;
  const p = Number(prev) || 0;
  if (!c && !p) return null;
  if (!p) return <span className="da-badge on" aria-label={`new, ${label}`}>New</span>;
  const ch = Math.round(((c - p) / p) * 100);
  if (ch === 0) return <span className="da-badge" aria-label={`unchanged ${label}`}>■ 0%</span>;
  const up = ch > 0;
  return <span className={`da-badge${up ? ' on' : ''}`} aria-label={`${up ? 'up' : 'down'} ${Math.abs(ch)}% ${label}`}>{up ? '▲' : '▼'} {Math.abs(ch)}%</span>;
}

function Icon({ d, size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}
const I = {
  refresh: 'M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5',
  link: 'M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7',
  download: 'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
};

/* ───────────── building blocks ───────────── */
const Card = ({ title, icon, right, children, style }) => (
  <section className="da-card" style={style}>
    {(title || right) && (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
        <h3 className="da-h" style={{ margin: 0 }}>{icon}{title}</h3>
        {right}
      </div>
    )}
    {children}
  </section>
);

function Kpi({ label, value, sub, cur, prev, hero }) {
  return (
    <div className="da-card da-in" style={{ padding: '15px 16px', minHeight: hero ? 124 : 112, borderColor: hero ? P.lineStrong : P.line, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: 'uppercase', color: P.low }}>{label}</div>
      <div style={{ fontSize: hero ? 30 : 26, fontWeight: 800, fontFamily: 'Georgia, serif', color: hero ? P.goldHi : P.text, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="da-row" style={{ gap: 8, marginTop: 'auto' }}>
        {cur !== undefined && <Delta cur={cur} prev={prev} />}
        {sub && <span className="da-sub">{sub}</span>}
      </div>
    </div>
  );
}

function Empty({ title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 12px' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: P.goldHi }}>{title}</div>
      <div className="da-sub" style={{ marginTop: 8, maxWidth: 440, margin: '8px auto 0' }}>{text}</div>
    </div>
  );
}

/** Horizontal bars: rows = [{ label, value, note }] */
function HBars({ rows, total }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  const sum = total ?? rows.reduce((s, r) => s + r.value, 0);
  return (
    <div style={{ display: 'grid', gap: 13 }}>
      {rows.map(r => (
        <div key={r.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ color: P.med }}>{r.label}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: P.text, fontWeight: 700 }}>{n0(r.value)}<span style={{ color: P.low, fontWeight: 600 }}> · {pct(r.value, sum)}%</span></span>
          </div>
          <div className="da-bar" role="img" aria-label={`${r.label}: ${r.value}`}><i style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

/** Segmented single bar (how guests found you). parts = [{ label, value, tone }] ; tones are gold shades / dashes. */
function Split({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const fills = ['linear-gradient(90deg,#8a704d,#a88a62)', 'linear-gradient(90deg,#d3bfa2,#bda88a)', 'repeating-linear-gradient(135deg,#d3bfa2 0 5px,#8a704d 5px 9px)', 'rgba(247,243,235,0.22)'];
  return (
    <div>
      <div role="img" aria-label={parts.map(p => `${p.label} ${p.value}`).join(', ')} style={{ display: 'flex', height: 14, borderRadius: 100, overflow: 'hidden', background: P.faint, gap: 2 }}>
        {parts.map((p, i) => p.value > 0 && <span key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: fills[i % fills.length] }} />)}
      </div>
      <div className="da-row" style={{ marginTop: 12, gap: '8px 16px' }}>
        {parts.map((p, i) => (
          <span key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: P.med }}>
            <i style={{ width: 12, height: 12, borderRadius: 4, background: fills[i % fills.length], display: 'inline-block' }} />
            {p.label} <b style={{ color: P.text, fontVariantNumeric: 'tabular-nums' }}>{n0(p.value)}</b><span style={{ color: P.low }}>({pct(p.value, total)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Funnel: a list of steps, each narrower than the last. steps = [{ label, value, note }] */
function Funnel({ steps }) {
  const max = Math.max(1, ...steps.map(s => s.value));
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {steps.map((s, i) => (
        <div key={s.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6, gap: 10 }}>
            <span style={{ color: P.med }}>{i + 1}. {s.label}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{n0(s.value)}{s.note && <span style={{ color: P.low, fontWeight: 600 }}> · {s.note}</span>}</span>
          </div>
          <div className="da-bar" style={{ height: 12 }} role="img" aria-label={`${s.label}: ${s.value}`}><i style={{ width: `${Math.max(2, (s.value / max) * 100)}%`, opacity: 1 - i * 0.2 }} /></div>
        </div>
      ))}
    </div>
  );
}

/** Multi-series trend chart in plain SVG with a hover read-out. Series are told apart by line style, not colour. */
const SERIES_DEF = [
  { key: 'impressions', label: 'Seen', stroke: P.gold, width: 2.2, dash: '', area: true },
  { key: 'opens', label: 'Menu opens', stroke: P.ivory, width: 2, dash: '' },
  { key: 'searches', label: 'Search appearances', stroke: P.goldLo, width: 2, dash: '5 5' },
];
function TrendChart({ series, active }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 640, H = 210, padT = 8, padB = 4;
  const defs = SERIES_DEF.filter(d => active.includes(d.key));
  const max = niceMax(Math.max(1, ...series.flatMap(d => defs.map(s => d[s.key] || 0))));
  const x = (i) => (series.length <= 1 ? W / 2 : (i / (series.length - 1)) * W);
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);
  const path = (k) => series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[k] || 0).toFixed(1)}`).join(' ');
  const move = (clientX) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !r.width || !series.length) return;
    setHover(Math.max(0, Math.min(series.length - 1, Math.round(((clientX - r.left) / r.width) * (series.length - 1)))));
  };
  const labelIdx = series.length > 1 ? [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * (series.length - 1))) : [0];
  const hv = hover !== null ? series[hover] : null;
  return (
    <div>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '38px 1fr', gap: 6 }}>
        <div style={{ position: 'relative', height: H, fontSize: 10, color: P.low, fontVariantNumeric: 'tabular-nums' }} aria-hidden="true">
          {[1, 0.5, 0].map(f => <span key={f} style={{ position: 'absolute', right: 0, top: y(max * f) - 6 }}>{n0(Math.round(max * f))}</span>)}
        </div>
        <div style={{ position: 'relative' }}>
          <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} role="img"
            aria-label={`Trend over ${series.length} days`}
            onMouseMove={(e) => move(e.clientX)} onMouseLeave={() => setHover(null)}
            onTouchStart={(e) => move(e.touches[0].clientX)} onTouchMove={(e) => move(e.touches[0].clientX)} onTouchEnd={() => setHover(null)}
            style={{ display: 'block', touchAction: 'pan-y' }}>
            <defs>
              <linearGradient id="daArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={P.gold} stopOpacity="0.30" /><stop offset="100%" stopColor={P.gold} stopOpacity="0" /></linearGradient>
            </defs>
            {[0, 0.5, 1].map(f => <line key={f} x1="0" x2={W} y1={y(max * f)} y2={y(max * f)} stroke="rgba(247,243,235,0.07)" vectorEffect="non-scaling-stroke" strokeDasharray={f === 0 ? '' : '3 5'} />)}
            {defs.some(d => d.area) && series.length > 1 && <path d={`${path('impressions')} L${W} ${H} L0 ${H} Z`} fill="url(#daArea)" />}
            {defs.map(d => <path key={d.key} d={path(d.key)} fill="none" stroke={d.stroke} strokeWidth={d.width} strokeDasharray={d.dash} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
            {hv && <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke={P.gold} strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />}
          </svg>
          {hv && (
            <div role="status" style={{ position: 'absolute', top: 6, left: `${series.length > 1 ? (hover / (series.length - 1)) * 100 : 50}%`, transform: `translateX(${hover > series.length * 0.6 ? '-104%' : '8px'})`, pointerEvents: 'none', background: 'rgba(14,14,14,0.96)', border: `1px solid ${P.lineStrong}`, borderRadius: 12, padding: '8px 11px', fontSize: 11.5, whiteSpace: 'nowrap', zIndex: 2 }}>
              <div style={{ fontWeight: 900, color: P.goldHi, marginBottom: 4 }}>{fmtDay(hv.day)}</div>
              {defs.map(d => <div key={d.key} style={{ color: P.med }}>{d.label}: <b style={{ color: P.text }}>{n0(hv[d.key])}</b></div>)}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '38px 1fr', gap: 6, marginTop: 6 }}>
        <span />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.low }} aria-hidden="true">{labelIdx.map((i, k) => <span key={k}>{series[i] ? fmtDay(series[i].day) : ''}</span>)}</div>
      </div>
    </div>
  );
}

function LegendChips({ active, onToggle }) {
  return (
    <div className="da-row" style={{ gap: 8 }}>
      {SERIES_DEF.map(d => (
        <button key={d.key} type="button" className="da-chip" aria-pressed={active.includes(d.key)} onClick={() => onToggle(d.key)}>
          <svg width="22" height="8" aria-hidden="true"><line x1="1" x2="21" y1="4" y2="4" stroke={d.stroke} strokeWidth="2.4" strokeDasharray={d.dash} strokeLinecap="round" /></svg>
          {d.label}
        </button>
      ))}
    </div>
  );
}

/** 24-cell hour-of-day strip; intensity = share of the busiest hour. */
function HeatStrip({ values, unit }) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0,1fr))', gap: 3 }} role="list" aria-label={`${unit} by hour of day`}>
        {values.map((v, h) => (
          <div key={h} role="listitem" title={`${hourRange(h)}: ${n0(v)} ${unit}`} aria-label={`${hourRange(h)}: ${v} ${unit}`}
            style={{ height: 46, borderRadius: 6, background: v ? `rgba(211,191,162,${0.12 + 0.82 * (v / max)})` : P.faint, border: v === max && v > 0 ? `1px solid ${P.goldHi}` : '1px solid transparent' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0,1fr))', gap: 3, marginTop: 6, fontSize: 9.5, color: P.low }} aria-hidden="true">
        {values.map((_, h) => <span key={h} style={{ textAlign: 'center', visibility: h % 3 === 0 ? 'visible' : 'hidden' }}>{h % 12 || 12}{h < 12 ? 'a' : 'p'}</span>)}
      </div>
    </div>
  );
}

function WeekBars({ seen, opens }) {
  const max = Math.max(1, ...seen, ...opens);
  const peak = opens.indexOf(Math.max(...opens));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 10, alignItems: 'end', height: 150 }} role="list" aria-label="Activity by weekday">
      {DOW.map((d, i) => (
        <div key={d} role="listitem" aria-label={`${d}: ${seen[i]} seen, ${opens[i]} opens`} style={{ display: 'grid', gap: 6, justifyItems: 'center', height: '100%', gridTemplateRows: '1fr auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', justifyContent: 'center' }}>
            <span title={`${n0(seen[i])} seen`} style={{ width: '38%', maxWidth: 16, height: `${Math.max(3, (seen[i] / max) * 112)}px`, borderRadius: '5px 5px 0 0', border: `1px solid ${P.lineStrong}`, background: 'transparent' }} />
            <span title={`${n0(opens[i])} opens`} style={{ width: '38%', maxWidth: 16, height: `${Math.max(3, (opens[i] / max) * 112)}px`, borderRadius: '5px 5px 0 0', background: i === peak && opens[i] > 0 ? `linear-gradient(180deg,${P.goldHi},${P.gold})` : 'linear-gradient(180deg,#a88a62,#8a704d)' }} />
          </div>
          <span style={{ fontSize: 11, color: i === peak && opens[i] > 0 ? P.goldHi : P.low, fontWeight: i === peak ? 900 : 600 }}>{d}</span>
        </div>
      ))}
    </div>
  );
}

function Skeleton() {
  const Sk = ({ w = '100%', h = 12, r = 8, d = 0, style }) => <span className="da-sk" style={{ display: 'block', width: w, height: h, borderRadius: r, '--d': `${d}s`, ...style }} />;
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="da" data-testid="da-skeleton">
      <span className="da-vh">Loading analytics…</span>
      <div aria-hidden="true" style={{ display: 'grid', gap: 16 }}>
        <div className="da-grid da-kpis">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="da-card da-in" style={{ minHeight: i === 0 ? 124 : 112, padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 11, animationDelay: `${i * 0.04}s` }}>
              <Sk w={i === 0 ? 110 : 84} h={10} d={i * 0.06} />
              <Sk w={i === 0 ? '58%' : '46%'} h={i === 0 ? 30 : 26} r={8} d={i * 0.06} />
              <div className="da-row" style={{ gap: 8, marginTop: 'auto' }}><Sk w={48} h={18} r={100} d={i * 0.06} /><Sk w={74} h={10} d={i * 0.06} /></div>
            </div>
          ))}
        </div>
        <div className="da-card">
          <div className="da-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}><Sk w={150} h={12} /><div className="da-row"><Sk w={64} h={24} r={100} /><Sk w={78} h={24} r={100} /><Sk w={64} h={24} r={100} /></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '38px 1fr', gap: 6 }}>
            <div style={{ display: 'grid', alignContent: 'space-between', height: 210 }}><Sk w={28} h={9} /><Sk w={20} h={9} /><Sk w={8} h={9} /></div>
            <div style={{ height: 210, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {[34, 46, 40, 58, 52, 70, 62, 78, 66, 84, 72, 60, 74, 88, 80, 68, 76, 92, 84, 70, 62, 78, 66, 56, 72, 64, 52, 60, 48, 56].map((h, i) => <Sk key={i} w="100%" h={`${h}%`} r={4} d={(i % 10) * 0.08} style={{ flex: 1 }} />)}
            </div>
          </div>
        </div>
        <div className="da-grid da-two">
          {[0, 1].map(c => (
            <div key={c} className="da-card">
              <Sk w={130} h={12} style={{ marginBottom: 18 }} />
              <div style={{ display: 'grid', gap: 15 }}>{[88, 64, 46, 30].map((w, i) => <div key={i}><div className="da-row" style={{ justifyContent: 'space-between', marginBottom: 7 }}><Sk w={96} h={10} /><Sk w={54} h={10} /></div><Sk w={`${w}%`} h={8} r={100} /></div>)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────── tabs ───────────── */
function OverviewTab({ d, series, active, setActive }) {
  const c = d.current, p = d.previous;
  const srcRows = Object.entries(d.openSources || {}).map(([k, v]) => ({ label: SOURCE[k] || k, value: v })).filter(r => r.value > 0).sort((a, b) => b.value - a.value);
  const toggle = (k) => setActive(a => (a.includes(k) ? (a.length > 1 ? a.filter(x => x !== k) : a) : [...a, k]));
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="da-grid da-kpis">
        <Kpi hero label="Times you were seen" value={n0(c.impressions)} cur={c.impressions} prev={p.impressions} sub="card on screen" />
        <Kpi label="Menu opens" value={n0(c.opens)} cur={c.opens} prev={p.opens} sub="tapped through" />
        <Kpi label="Open rate" value={`${d.funnel.openRate}%`} sub={p.impressions > 0 ? `was ${d.funnel.prevOpenRate}%` : 'of views opened'} />
        <Kpi label="Search appearances" value={n0(c.searches)} cur={c.searches} prev={p.searches} sub="shown in a search" />
        <Kpi label="Searched by name" value={n0(c.searchName)} cur={c.searchName} prev={p.searchName} sub="knew you already" />
        <Kpi label="Guest actions" value={n0(d.actions.total)} cur={d.actions.total} prev={d.funnel.prevActions} sub="calls, maps, shares, saves" />
      </div>

      <Card title="Trend" right={<LegendChips active={active} onToggle={toggle} />}>
        <TrendChart series={series} active={active} />
        {d.peakDay && <div className="da-sub" style={{ marginTop: 12 }}>Busiest day for menu opens: <b style={{ color: P.goldHi }}>{d.peakDay.name}</b> ({n0(d.peakDay.opens)} opens).</div>}
      </Card>

      <div className="da-grid da-two">
        <Card title="Guest journey"><Funnel steps={[
          { label: 'Saw your card', value: d.funnel.seen },
          { label: 'Opened your menu', value: d.funnel.opened, note: `${d.funnel.openRate}% of views` },
          { label: 'Took an action', value: d.funnel.acted, note: `${d.funnel.actionRate}% of opens` },
        ]} /></Card>
        <Card title="Where opens came from">
          {srcRows.length ? <HBars rows={srcRows} /> : <Empty title="No opens yet" text="When guests open your menu from the directory, the route they took shows here." />}
        </Card>
      </div>

      <Card title="What guests did">
        <div className="da-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
          {[['Calls', 'calls'], ['Directions', 'directions'], ['Shares', 'shares'], ['Saved', 'saves']].map(([l, k]) => (
            <div key={k} style={{ border: `1px solid ${P.line}`, borderRadius: 14, padding: '13px 14px', display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.3, textTransform: 'uppercase', color: P.low }}>{l}</span>
              <span style={{ fontSize: 24, fontFamily: 'Georgia, serif', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{n0(c[k])}</span>
              <Delta cur={c[k]} prev={p[k]} />
            </div>
          ))}
        </div>
        <div className="da-sub" style={{ marginTop: 12 }}>Anonymous counts only - each card is counted once per guest session; no names, numbers or devices are stored.</div>
      </Card>
    </div>
  );
}

function SearchTab({ d }) {
  const s = d.search, c = d.current, p = d.previous;
  const empty = !s.appeared && !s.topTerms.length;
  if (empty) {
    return (
      <Card title="Directory searches">
        <Empty title="No searches have surfaced you yet" text="Guests can search the directory by restaurant, area, menu category and dish. Every search that shows your outlet is counted here, together with the phrase used. Complete your menu (categories and dishes) to appear for more of them." />
      </Card>
    );
  }
  const f = s.byFound;
  const nameShare = pct(f.name, s.appeared), menuShare = pct(f.menu, s.appeared);
  const insight = [];
  if (s.appeared >= 10 && nameShare >= 25) insight.push(`${nameShare}% of the searches that showed you were for your name - guests already know your brand.`);
  if (s.appeared >= 10 && menuShare >= 25) insight.push(`${menuShare}% found you through your menu (category or dish). Keeping dishes and categories up to date feeds this directly.`);
  if (s.appeared >= 10 && s.ctr < 15) insight.push(`Only ${s.ctr}% of searches that showed you led to an open. A live offer and a complete listing make your result more tempting.`);
  if (s.rising.length) insight.push(`Rising phrases: ${s.rising.map(r => `"${r.term}"`).join(', ')}.`);
  const kinds = Object.entries(s.termsByKind).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="da-grid da-kpis">
        <Kpi hero label="Search appearances" value={n0(s.appeared)} cur={s.appeared} prev={s.previous} sub="times a search showed you" />
        <Kpi label="Typed your name" value={n0(f.name)} cur={c.searchName} prev={p.searchName} sub="brand searches" />
        <Kpi label="Found by menu" value={n0(f.menu)} cur={c.searchMenu} prev={p.searchMenu} sub="category or dish" />
        <Kpi label="Found by area" value={n0(f.area)} cur={c.searchArea} prev={p.searchArea} sub="street, area, landmark" />
        <Kpi label="Opened from search" value={n0(s.opens)} cur={s.opens} prev={s.prevOpens} sub={`${s.ctr}% of appearances`} />
        <Kpi label="Different phrases" value={n0(s.uniqueTerms)} sub="distinct searches" />
      </div>

      <div className="da-grid da-two">
        <Card title="How guests found you">
          <Split parts={[{ label: 'Your name', value: f.name }, { label: 'Menu', value: f.menu }, { label: 'Area', value: f.area }, { label: 'Other', value: f.other }]} />
        </Card>
        <Card title="What they typed">
          {kinds.length ? <HBars rows={kinds.map(([k, v]) => ({ label: KIND[k] || k, value: v }))} /> : <Empty title="No phrases yet" text="Phrases appear after guests search." />}
        </Card>
      </div>

      {insight.length > 0 && (
        <Card title="What this tells you">
          <div style={{ display: 'grid', gap: 9 }}>{insight.map(t => <div key={t} style={{ fontSize: 12.5, color: P.med, lineHeight: 1.6 }}>◆ {t}</div>)}</div>
        </Card>
      )}

      <Card title="Search phrases" right={<span className="da-sub">top {s.topTerms.length}</span>}>
        <div className="da-scroll">
          <table className="da-tbl">
            <thead><tr><th>Phrase</th><th>Type</th><th className="num">Shown</th><th className="num">Opened</th><th style={{ minWidth: 120 }}>Open rate</th><th className="num">vs before</th></tr></thead>
            <tbody>
              {s.topTerms.map(t => (
                <tr key={t.term}>
                  <td style={{ fontWeight: 700, color: P.text }}>{t.term}</td>
                  <td><span className="da-badge">{KIND[t.kind] || 'Other'}</span></td>
                  <td className="num">{n0(t.seen)}</td>
                  <td className="num">{n0(t.opens)}</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="da-bar" style={{ flex: 1, minWidth: 60 }}><i style={{ width: `${t.ctr}%` }} /></div><span style={{ fontSize: 11.5, color: P.med, fontVariantNumeric: 'tabular-nums', minWidth: 38, textAlign: 'right' }}>{t.ctr}%</span></div></td>
                  <td className="num"><Delta cur={t.seen} prev={t.prevSeen} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MarketingTab({ d }) {
  const m = d.marketing, push = m.push.summary;
  const periodDays = d.range.days;
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="da-grid da-kpis">
        <Kpi hero label="Offer taps" value={n0(m.offers.taps)} sub={`last ${periodDays} days`} />
        <Kpi label="Offer redemptions" value={n0(m.offers.redemptions)} sub="all time" />
        <Kpi label="Discount given" value={money(m.offers.discountGiven)} sub="all time" />
        <Kpi label="Campaigns sent" value={n0(m.campaigns.sent)} sub={`${n0(m.campaigns.peopleMessaged)} people · ${periodDays} d`} />
        <Kpi label="Banner views" value={n0(m.banners.views)} sub="all time" />
        <Kpi label="Push click rate" value={push ? `${push.ctr}%` : '—'} sub={push ? `${n0(push.clicked)} of ${n0(push.delivered)} delivered` : 'no pushes yet'} />
      </div>

      <Card title="Offers" right={<span className="da-sub">{m.offers.active} live · {m.offers.total} total</span>}>
        {m.offers.items.length === 0 ? <Empty title="No offers yet" text="Create an offer in Marketing > Offers. Guests can tap it from the directory's Offers row and you will see taps and redemptions here." /> : (
          <div className="da-scroll">
            <table className="da-tbl">
              <thead><tr><th>Offer</th><th>Status</th><th className="num">Taps ({periodDays} d)</th><th className="num">vs before</th><th className="num">Redeemed</th><th className="num">Discount given</th></tr></thead>
              <tbody>
                {m.offers.items.map(o => (
                  <tr key={o.id}>
                    <td><div style={{ fontWeight: 700 }}>{o.title}</div><div className="da-sub">{offerText(o)}{o.code ? ` · code ${o.code}` : ''}</div></td>
                    <td><span className={`da-badge${o.isActive ? ' on' : ''}`}>{o.isActive ? 'Live' : 'Ended'}</span></td>
                    <td className="num">{n0(o.taps)}</td>
                    <td className="num"><Delta cur={o.taps} prev={o.tapsPrev} /></td>
                    <td className="num">{n0(o.redemptions)}</td>
                    <td className="num">{money(o.discountGiven)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="da-sub" style={{ marginTop: 12 }}>Taps are counted on the guest directory only. Redemptions and discount are lifetime totals recorded when the offer is applied to a bill.</div>
      </Card>

      <div className="da-grid da-two">
        <Card title="Menu banners" right={<span className="da-sub">{m.banners.active} live</span>}>
          {m.banners.items.length === 0 ? <Empty title="No banners" text="Banners shown on your menu appear here with their views." /> : (
            <div style={{ display: 'grid', gap: 12 }}>
              {m.banners.items.slice(0, 6).map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div><div className="da-sub">ends {fmtWhen(b.expiresAt)}</div></div>
                  <div className="da-row" style={{ gap: 8, flex: '0 0 auto' }}><span className={`da-badge${b.isActive ? ' on' : ''}`}>{b.isActive ? 'Live' : 'Ended'}</span><b style={{ fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'right' }}>{n0(b.views)}</b></div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Campaigns" right={<span className="da-sub">{m.campaigns.scheduled} scheduled · {m.campaigns.drafts} drafts</span>}>
          {m.campaigns.items.length === 0 ? <Empty title="No campaigns" text="Campaigns you send to customers are listed here." /> : (
            <div style={{ display: 'grid', gap: 12 }}>
              {m.campaigns.items.slice(0, 6).map(x => (
                <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.title}</div><div className="da-sub">{x.segment} · {x.status === 'sent' ? fmtWhen(x.sentAt) : x.status === 'scheduled' ? `on ${fmtWhen(x.scheduledAt)}` : 'not sent'}</div></div>
                  <div className="da-row" style={{ gap: 8, flex: '0 0 auto' }}><span className={`da-badge${x.status === 'sent' ? ' on' : ''}`}>{x.status}</span><b style={{ fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'right' }}>{n0(x.sentCount)}</b></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Push notifications" right={<span className="da-sub">last {periodDays} days</span>}>
        {!push || !push.broadcasts ? <Empty title="No push broadcasts" text="Offers, campaigns and banners sent as push notifications show their reach and click rate here." /> : (
          <div style={{ display: 'grid', gap: 18 }}>
            <Funnel steps={[
              { label: 'Devices reached', value: push.devicesReached },
              { label: 'Delivered', value: push.delivered, note: `${push.deliveredRate}% of reached` },
              { label: 'Clicked', value: push.clicked, note: `${push.ctr}% of delivered` },
            ]} />
            <div className="da-sub">Reached = devices the push service accepted · Delivered = unique devices that received it · Clicked = unique devices that tapped. {n0(push.dismissed)} dismissed, {n0(push.viewedInApp)} viewed in the app.</div>
            {m.push.items.length > 0 && (
              <div className="da-scroll">
                <table className="da-tbl">
                  <thead><tr><th>Broadcast</th><th>Kind</th><th className="num">Reached</th><th className="num">Delivered</th><th className="num">Clicked</th><th className="num">CTR</th></tr></thead>
                  <tbody>{m.push.items.map(i => <tr key={`${i.kind}:${i.refId}`}><td style={{ fontWeight: 700 }}>{i.title || '—'}</td><td><span className="da-badge">{i.kind}</span></td><td className="num">{n0(i.devicesReached)}</td><td className="num">{n0(i.delivered)}</td><td className="num">{n0(i.clicked)}</td><td className="num">{i.ctr}%</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function TimingTab({ d }) {
  const [metric, setMetric] = useState('opens');
  const t = d.timing;
  const vals = metric === 'opens' ? t.hourOpens : t.hourSeen;
  const top = vals.map((v, h) => ({ v, h })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="Hour of day" right={<div className="da-row" style={{ gap: 6 }}>
        <button type="button" className="da-chip" aria-pressed={metric === 'opens'} onClick={() => setMetric('opens')}>Menu opens</button>
        <button type="button" className="da-chip" aria-pressed={metric === 'seen'} onClick={() => setMetric('seen')}>Seen</button>
      </div>}>
        {!t.hasHourly ? <Empty title="Hourly pattern is still building" text="Time-of-day data is collected from the day this feature went live. Check back after a few days of guest activity." /> : (
          <>
            <HeatStrip values={vals} unit={metric === 'opens' ? 'opens' : 'views'} />
            {top.length > 0 && <div className="da-sub" style={{ marginTop: 14 }}>Busiest {metric === 'opens' ? 'menu-opening' : 'viewing'} hours (IST): {top.map(x => <b key={x.h} style={{ color: P.goldHi, marginRight: 10 }}>{hourRange(x.h)} ({n0(x.v)})</b>)}</div>}
          </>
        )}
      </Card>
      <Card title="Day of week" right={<span className="da-sub">outlined = seen · filled = opens</span>}>
        {d.current.impressions + d.current.opens === 0 ? <Empty title="No activity in this period" text="Weekday patterns appear once guests have browsed the directory." /> : <WeekBars seen={t.dowSeen} opens={t.dowOpens} />}
        {d.peakDay && <div className="da-sub" style={{ marginTop: 12 }}>Your strongest day is <b style={{ color: P.goldHi }}>{d.peakDay.name}</b>. Schedule offers and campaigns a few hours ahead of it.</div>}
      </Card>
    </div>
  );
}

function ListingTab({ d, onFix, canFix }) {
  const { score, checks, menuSearch } = d.listing;
  const R = 44, C = 2 * Math.PI * R;
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="da-grid da-two">
        <Card title="Listing health">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`Listing health ${score} percent`}>
              <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(247,243,235,0.09)" strokeWidth="9" />
              <circle cx="56" cy="56" r={R} fill="none" stroke={P.gold} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(score / 100) * C} ${C}`} transform="rotate(-90 56 56)" />
              <text x="56" y="62" textAnchor="middle" fontSize="24" fontWeight="800" fill={P.goldHi} fontFamily="Georgia, serif">{score}%</text>
            </svg>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: P.goldHi }}>{score >= 90 ? 'Fully ready for guests' : score >= 60 ? 'Looking good' : 'Needs attention'}</div>
              <div className="da-sub" style={{ marginTop: 6 }}>{checks.filter(c => c.ok).length} of {checks.length} checks complete. A complete listing is opened more often and found by more searches.</div>
            </div>
          </div>
        </Card>
        <Card title="Menu search coverage">
          <div className="da-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[['Categories', menuSearch.categories], ['Available dishes', menuSearch.dishes]].map(([l, v]) => (
              <div key={l} style={{ border: `1px solid ${P.line}`, borderRadius: 14, padding: '13px 14px', display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.3, textTransform: 'uppercase', color: P.low }}>{l}</span>
                <span style={{ fontSize: 24, fontFamily: 'Georgia, serif', fontWeight: 800 }}>{n0(v)}</span>
              </div>
            ))}
          </div>
          <div className="da-sub" style={{ marginTop: 12 }}>Guests search the directory by category and dish. Up to 30 categories and 60 dishes per outlet are searchable, best sellers first.</div>
        </Card>
      </div>
      <Card title="Checklist">
        <div style={{ display: 'grid', gap: 14 }}>
          {checks.map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: c.ok ? 'linear-gradient(135deg,#d3bfa2,#bda88a)' : 'transparent', color: '#0c0c0c', border: c.ok ? 'none' : `1.5px dashed ${P.lineStrong}`, marginTop: 1 }}>{c.ok ? '✓' : ''}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.ok ? P.med : P.text }}>{c.label}<span className="da-vh">{c.ok ? ' complete' : ' needs attention'}</span></div>
                {!c.ok && <div className="da-sub" style={{ marginTop: 3 }}>{c.hint}</div>}
              </div>
              {!c.ok && onFix && (!canFix || canFix(c.key)) && <button type="button" className="da-btn" style={{ padding: '6px 11px' }} onClick={() => onFix(c.key)}>Fix</button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ───────────── main ───────────── */
const TABS = [['overview', 'Overview'], ['search', 'Searches'], ['marketing', 'Marketing'], ['timing', 'Timing'], ['listing', 'Listing']];

export default function DiscoveryAnalytics({ load, onFixListing, canFix, previewUrl = '/?notrack=1', initialTab = 'overview', refreshMs = 120000 }) {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState(['impressions', 'opens', 'searches']);
  const [toast, setToast] = useState('');
  const seq = useRef(0);
  const toastTimer = useRef(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(toastTimer.current); }; }, []);
  const flash = (m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => alive.current && setToast(''), 3000); };

  const run = useCallback(async (silent) => {
    const my = ++seq.current;
    if (silent) setRefreshing(true); else { setLoading(true); setError(''); }
    try {
      const r = await load(days);
      if (my !== seq.current || !alive.current) return;
      setData(r); setError('');
    } catch (e) {
      if (my !== seq.current || !alive.current) return;
      if (!silent) setError(e?.response?.data?.error || e?.message || 'Could not load analytics');
    } finally {
      if (my === seq.current && alive.current) { setLoading(false); setRefreshing(false); }
    }
  }, [load, days]);
  useEffect(() => { run(false); }, [run]);
  useEffect(() => {
    if (!refreshMs) return undefined;
    const id = setInterval(() => { if (!document.hidden) run(true); }, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, run]);

  const copyLink = async () => {
    const link = `${window.location.origin}/?q=${encodeURIComponent(data?.tenantName || '')}`;
    try { await navigator.clipboard.writeText(link); flash('Listing link copied'); } catch { flash(link); }
  };
  const downloadCsv = () => {
    if (!data) return;
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Daily activity'], ['Date', 'Seen', 'Menu opens', 'Search appearances', 'Guest actions'], ...data.series.map(r => [r.day, r.impressions, r.opens, r.searches, r.actions]),
      [], ['Search phrases'], ['Phrase', 'Type', 'Shown', 'Opened', 'Open rate %'], ...data.search.topTerms.map(t => [t.term, t.kind, t.seen, t.opens, t.ctr]),
      [], ['Offers'], ['Offer', 'Status', 'Taps in period', 'Redeemed (all time)', 'Discount given (all time)'], ...data.marketing.offers.items.map(o => [o.title, o.isActive ? 'Live' : 'Ended', o.taps, o.redemptions, o.discountGiven])];
    const blob = new Blob([rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `guest-discovery_${data.range.from}_${data.range.to}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const onTabKey = (e) => {
    const i = TABS.findIndex(([k]) => k === tab);
    if (e.key === 'ArrowRight') setTab(TABS[(i + 1) % TABS.length][0]);
    else if (e.key === 'ArrowLeft') setTab(TABS[(i + TABS.length - 1) % TABS.length][0]);
  };
  const updated = useMemo(() => (data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''), [data]);

  return (
    <div className="da">
      <style>{CSS}</style>
      <div className="da-row" style={{ justifyContent: 'space-between' }}>
        <div className="da-row" role="group" aria-label="Date range" style={{ gap: 6 }}>
          {[7, 30, 90].map(d => <button key={d} type="button" className="da-pill" aria-pressed={days === d} onClick={() => setDays(d)}>{d} days</button>)}
        </div>
        <div className="da-row" style={{ gap: 8 }}>
          {updated && <span className="da-sub">Updated {updated}</span>}
          <button type="button" className="da-btn" onClick={() => run(true)} disabled={refreshing || loading} aria-label="Refresh"><span className={refreshing ? 'da-spin' : ''} style={{ display: 'inline-flex' }}><Icon d={I.refresh} /></span> Refresh</button>
          <button type="button" className="da-btn" onClick={copyLink} disabled={!data}><Icon d={I.link} /> Copy listing link</button>
          <button type="button" className="da-btn" onClick={downloadCsv} disabled={!data || !data.hasAnyData}><Icon d={I.download} /> Download CSV</button>
          {previewUrl && <button type="button" className="da-btn" onClick={() => window.open(previewUrl, '_blank', 'noopener')}><Icon d={I.eye} /> Preview directory</button>}
        </div>
      </div>
      {toast && <div role="status" className="da-badge on" style={{ justifySelf: 'start', padding: '6px 12px', fontSize: 11 }}>{toast}</div>}

      {loading && !data ? <Skeleton /> : error && !data ? (
        <div className="da-card" role="alert"><Empty title="Couldn't load analytics" text={error} /><div style={{ textAlign: 'center' }}><button type="button" className="da-btn" onClick={() => run(false)}>Try again</button></div></div>
      ) : data && (
        <>
          {data.featured && <div><span className="da-badge on">★ Featured placement active</span></div>}
          <div className="da-tabs" role="tablist" aria-label="Analytics sections" onKeyDown={onTabKey}>
            {TABS.map(([k, label]) => <button key={k} type="button" role="tab" id={`da-tab-${k}`} aria-selected={tab === k} aria-controls={`da-panel-${k}`} tabIndex={tab === k ? 0 : -1} className="da-tab" onClick={() => setTab(k)}>{label}</button>)}
          </div>
          {loading && <Skeleton />}
          <div role="tabpanel" id={`da-panel-${tab}`} aria-labelledby={`da-tab-${tab}`} hidden={loading} className="da-in" key={`${tab}-${days}`}>
            {!data.hasAnyData && tab !== 'listing' && tab !== 'marketing' ? (
              <Card><Empty title="No guest activity recorded yet" text="Counting starts as guests browse the directory. Share your listing link to get the first visits, and check the Listing tab to make sure your outlet is ready for them." /></Card>
            ) : tab === 'overview' ? <OverviewTab d={data} series={data.series} active={active} setActive={setActive} />
              : tab === 'search' ? <SearchTab d={data} />
              : tab === 'marketing' ? <MarketingTab d={data} />
              : tab === 'timing' ? <TimingTab d={data} />
              : <ListingTab d={data} onFix={onFixListing} canFix={canFix} />}
          </div>
        </>
      )}
    </div>
  );
}
