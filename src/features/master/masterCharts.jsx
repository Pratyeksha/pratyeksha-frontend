/* Master Admin charts — real Bklit components (via ../owner/ownerCharts.jsx) wrapped in the Master Admin glass-card look.
 * Colour tokens come from .bk-scope-ma (shared/ui/bklit.css). Every card handles its own empty state.
 */
import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { BarChart3, ChevronDown } from 'lucide-react';
import { BkArea, BkLine, BkColumns, BkHBars, BkDonut, BkGauge, BkGrouped } from '../owner/ownerCharts.jsx';

const GOLD = '#d3bfa2';
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const maPanel = { background: 'linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.016))', border: '1px solid rgba(211,191,162,0.16)', borderRadius: 18, padding: 18, minWidth: 0, boxShadow: '0 18px 44px -24px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)' };
const maTitle = { fontSize: 10, fontWeight: 800, letterSpacing: 1.6, color: GOLD, textTransform: 'uppercase', marginBottom: 3 };
const maSub = { fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginBottom: 12, lineHeight: 1.5 };

/** Responsive row of chart cards. min(100%, N) keeps cards inside a 320px screen; a lone card is capped. */
export const MaGrid = ({ children, min = 250, mb = 14 }) => {
  const single = React.Children.toArray(children).filter(Boolean).length === 1;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: single ? 'repeat(auto-fit, minmax(min(100%, 280px), 480px))' : `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`, gap: 14, marginBottom: mb }}>{children}</div>
  );
};
export const MaCard = ({ title, sub, right, children, style }) => (
  <Motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} style={{ ...maPanel, ...style }}>
    {(title || right) && (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>{title && <div style={maTitle}>{title}</div>}{sub && <div style={maSub}>{sub}</div>}</div>
        {right}
      </div>
    )}
    {children}
  </Motion.div>
);
const Nothing = ({ text = 'No data yet' }) => <div style={{ padding: '28px 0', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>{text}</div>;

/** Donut + value list. rows: [{label, value}] (zero rows dropped). `bare` renders without the card. */
export const MaDonut = ({ title, sub, rows, centerValue, centerLabel, valueFormat = (v) => v, size = 148, bare = false, right }) => {
  const data = (rows || []).filter((r) => Number(r.value) > 0);
  const total = data.reduce((a, r) => a + Number(r.value), 0);
  const body = total <= 0 ? <Nothing /> : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      <BkDonut rows={data} valueFormat={valueFormat} centerValue={centerValue} centerLabel={centerLabel} size={size} />
      <div style={{ flex: '1 1 140px', minWidth: 130, display: 'grid', gap: 8 }}>
        {data.map((r, i) => (
          <div key={`${r.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, flex: '0 0 auto', background: `var(--chart-${(i % 5) + 1})` }} />
            <span style={{ flex: 1, minWidth: 0, color: 'rgba(255,255,255,0.68)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <span style={{ fontFamily: MONO, color: '#f1ede4', fontWeight: 700 }}>{valueFormat(r.value)}</span>
            <span style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.4)', width: 34, textAlign: 'right' }}>{Math.round((Number(r.value) / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
  return bare ? <div style={{ minWidth: 0 }}>{body}</div> : <MaCard title={title} sub={sub} right={right}>{body}</MaCard>;
};
/** 0-100 dial in a card. */
export const MaGauge = ({ title, sub, value, centerValue, suffix = '%', label, hint }) => (
  <MaCard title={title} sub={sub}>
    <BkGauge value={value} centerValue={centerValue} suffix={suffix} label={label} maxWidth={210} />
    {hint && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>{hint}</div>}
  </MaCard>
);
/** Ranked horizontal bars. rows: [{label, value}] */
export const MaBars = ({ title, sub, rows, valueFormat = (v) => v, nameWidth = 110, right }) => {
  const data = (rows || []).filter((r) => Number(r.value) > 0).slice(0, 7);
  return (
    <MaCard title={title} sub={sub} right={right}>
      {data.length === 0 ? <Nothing /> : <BkHBars rows={data} valueFormat={valueFormat} nameWidth={nameWidth} rowHeight={30} />}
    </MaCard>
  );
};
/** Vertical columns. rows: [{label, value}] */
export const MaColumns = ({ title, sub, rows, valueFormat = (v) => v, label = 'Value', height = 168, highlightLabel, right }) => (
  <MaCard title={title} sub={sub} right={right}>
    {(rows || []).length === 0 || (rows || []).every((r) => !Number(r.value)) ? <Nothing /> : <BkColumns rows={rows} height={height} label={label} valueFormat={valueFormat} highlightLabel={highlightLabel} />}
  </MaCard>
);
/** Two (or more) series side by side. series: [{key, label, color}] ; rows: [{label, [key]: n}] ; `bare` = no card. */
export const MaGrouped = ({ title, sub, rows, series, valueFormat = (v) => v, extraRows, height = 200, right, bare = false }) => {
  const empty = (rows || []).length === 0 || (rows || []).every((r) => series.every((sr) => !Number(r[sr.key])));
  const body = empty ? <Nothing /> : (
    <>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '0 0 6px', fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>
        {series.map((sr) => <span key={sr.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: sr.color }} />{sr.label}</span>)}
      </div>
      <BkGrouped rows={rows} series={series} height={height} valueFormat={valueFormat} extraRows={extraRows} />
    </>
  );
  return bare ? <div style={{ minWidth: 0 }}>{body}</div> : <MaCard title={title} sub={sub} right={right}>{body}</MaCard>;
};
/** Time-series area. data: [{date:'YYYY-MM-DD', [yKey]: n}] */
export const MaArea = ({ title, sub, data, yKey = 'value', label = 'Value', valueFormat = (v) => v, axisFormat, height = 210, right }) => (
  <MaCard title={title} sub={sub} right={right}>
    {(data || []).length < 2 ? <Nothing text="Not enough history yet" /> : <BkArea data={data} yKey={yKey} label={label} valueFormat={valueFormat} axisFormat={axisFormat || valueFormat} height={height} />}
  </MaCard>
);
export const MaLine = ({ title, sub, data, yKey = 'value', label = 'Value', valueFormat = (v) => v, axisFormat, height = 200, right }) => (
  <MaCard title={title} sub={sub} right={right}>
    {(data || []).length < 2 ? <Nothing text="Not enough history yet" /> : <BkLine data={data} yKey={yKey} label={label} valueFormat={valueFormat} axisFormat={axisFormat || valueFormat} height={height} />}
  </MaCard>
);

/** Collapsible insights drawer: open on desktop, closed on phones (so lists stay one tap away). */
export const MaInsights = ({ title = 'Insights', defaultOpen, children }) => {
  const [open, setOpen] = useState(() => defaultOpen ?? (typeof window === 'undefined' ? true : window.innerWidth >= 900));
  return (
    <div style={{ marginBottom: 14 }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 40, padding: '0 2px', background: 'none', border: 0, cursor: 'pointer', color: GOLD, fontFamily: 'inherit', fontSize: 10, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase' }}>
        <BarChart3 size={13} /> {title}
        <ChevronDown size={14} style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <Motion.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: 6 }}>{children}</div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
