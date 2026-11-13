/* Owner charts — real Bklit UI components (vendored from the Bklit registry into src/components/charts).
 * Thin wrappers that keep the Owner app's existing helper signatures, so call sites stay unchanged.
 * Follows the Bklit skill: compose under one root, Grid → series → axes → tooltip, tokens not hex (see bklit.css),
 * one chart per card, status="loading" for skeleton state, reduced motion gated by <OwnerMotion>.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AreaChart, Area } from '@/components/charts/area-chart';
import { LineChart, Line } from '@/components/charts/line-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { Bar } from '@/components/charts/bar';
import { BarXAxis } from '@/components/charts/bar-x-axis';
import { BarYAxis } from '@/components/charts/bar-y-axis';
import { PieChart } from '@/components/charts/pie-chart';
import { PieSlice } from '@/components/charts/pie-slice';
import { PieCenter } from '@/components/charts/pie-center';
import { BarSparkline, AreaSparkline } from '@/components/charts/sparkline';
import { Gauge } from '@/components/charts/gauge';
import { RingChart } from '@/components/charts/ring-chart';
import { Ring } from '@/components/charts/ring';
import { RingCenter } from '@/components/charts/ring-center';

import { Grid } from '@/components/charts/grid';
import { XAxis } from '@/components/charts/x-axis';
import { YAxis } from '@/components/charts/y-axis';
import { ChartTooltip } from '@/components/charts/tooltip';

const VIZ = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
/** 'YYYY-MM-DD' → local Date (avoids the UTC day-shift of new Date('2026-11-12')). */
const toDate = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v ?? ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
};
const sized = (height) => ({ height, width: '100%' });
/** Centre-of-ring text must fit the hole: shrink long figures, ellipsise long labels (hover swaps in slice names). */
const fitFont = (txt, base) => { const n = String(txt ?? '').length; return n <= 5 ? base : n <= 8 ? Math.round(base * 0.82) : Math.round(base * 0.68); };
const centreLabel = (txt, maxW) => (txt ? <div style={{ fontSize: 9, letterSpacing: 0.8, fontWeight: 800, color: 'rgba(255,255,255,.52)', marginTop: 2, maxWidth: maxW, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px auto 0' }}>{String(txt).toUpperCase()}</div> : null);

/** Daily trend as an area (revenue). data: [{date:'YYYY-MM-DD', [yKey]: number}] */
export function BkArea({ data = [], yKey = 'revenue', label = 'Revenue', valueFormat, axisFormat, height = 220, status = 'ready' }) {
  const rows = useMemo(() => data.map((d) => ({ ...d, date: toDate(d.date) })), [data]);
  return (
    <div style={sized(height)}>
      <AreaChart data={rows} aspectRatio="auto" className="h-full w-full" margin={{ top: 16, right: 12, bottom: 28, left: 52 }} status={status}>
        <Grid horizontal numTicksRows={4} />
        <Area dataKey={yKey} fill="var(--chart-1)" stroke="var(--chart-1)" strokeWidth={2} fadeEdges="left" />
        <XAxis />
        <YAxis numTicks={4} formatValue={axisFormat} />
        <ChartTooltip rows={(p) => [{ color: 'var(--chart-1)', label, value: valueFormat(p[yKey]) }]} />
      </AreaChart>
    </div>
  );
}

/** Daily trend as a line (profit). */
export function BkLine({ data = [], yKey = 'profit', label = 'Profit', valueFormat, axisFormat, height = 200, status = 'ready' }) {
  const rows = useMemo(() => data.map((d) => ({ ...d, date: toDate(d.date) })), [data]);
  return (
    <div style={sized(height)}>
      <LineChart data={rows} aspectRatio="auto" className="h-full w-full" margin={{ top: 16, right: 12, bottom: 28, left: 52 }} status={status}>
        <Grid horizontal numTicksRows={4} />
        <Line dataKey={yKey} stroke="var(--chart-1)" strokeWidth={2} />
        <XAxis />
        <YAxis numTicks={4} formatValue={axisFormat} />
        <ChartTooltip rows={(p) => [{ color: 'var(--chart-1)', label, value: valueFormat(p[yKey]) }]} />
      </LineChart>
    </div>
  );
}

/** Vertical columns. `highlightLabel` is done with two stacked series (Bklit's Bar has no per-bar colour). */
export function BkColumns({ rows = [], valueFormat = (v) => v, height = 200, color = 'var(--chart-1)', highlightLabel, label = 'Value' }) {
  const data = useMemo(() => rows.map((r) => {
    const hi = highlightLabel != null && r.label === highlightLabel;
    return { label: r.label, base: hi ? 0 : r.value, hi: hi ? r.value : 0, total: r.value };
  }), [rows, highlightLabel]);
  const split = highlightLabel != null;
  return (
    <div style={sized(height)}>
      <BarChart data={data} xDataKey="label" aspectRatio="auto" className="h-full w-full" stacked={split} stackGap={0} margin={{ top: 12, right: 8, bottom: 28, left: 8 }}>
        <Grid horizontal numTicksRows={4} />
        <Bar dataKey={split ? 'base' : 'total'} fill={split ? 'var(--chart-4)' : color} lineCap={4} />
        {split && <Bar dataKey="hi" fill="var(--chart-1)" lineCap={4} />}
        <BarXAxis />
        <ChartTooltip showCrosshair={false} rows={(p) => [{ color: split && Number(p.hi) > 0 ? 'var(--chart-1)' : (split ? 'var(--chart-4)' : color), label, value: valueFormat(p.total) }]} />
      </BarChart>
    </div>
  );
}

/** Horizontal ranked bars with the value printed at the end of each bar.
 *  Name column and value gutter adapt to the card width and the longest formatted value, so text never collides. */
export function BkHBars({ rows = [], valueFormat = (v) => v, color = 'var(--chart-1)', rowHeight = 30, nameWidth = 112 }) {
  const wrap = useRef(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = wrap.current; if (!el) return undefined;
    const set = () => setW(Math.round(el.getBoundingClientRect().width) || 320);
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect();
  }, []);
  const height = Math.max(120, rows.length * rowHeight + 28);
  const valueGutter = Math.min(96, 14 + 7 * Math.max(2, ...rows.map((r) => String(valueFormat(r.value)).length)));
  const nameCol = Math.round(Math.min(nameWidth, Math.max(64, (w - valueGutter) * 0.42)));
  const maxChars = Math.max(6, Math.floor(nameCol / 6.4));
  const data = useMemo(() => rows.map((r) => ({ label: String(r.label).length > maxChars ? `${String(r.label).slice(0, maxChars - 1)}…` : r.label, value: r.value })), [rows, maxChars]);
  return (
    <div ref={wrap} style={sized(height)}>
      <BarChart data={data} xDataKey="label" orientation="horizontal" aspectRatio="auto" className="h-full w-full" margin={{ top: 4, right: valueGutter, bottom: 4, left: nameCol }}>
        <Bar dataKey="value" fill={color} lineCap={4} showValue valueLabelFormatter={valueFormat} />
        <BarYAxis />
        <ChartTooltip showCrosshair={false} rows={(p) => [{ color, label: 'Value', value: valueFormat(p.value) }]} />
      </BarChart>
    </div>
  );
}

/** Donut. Centre shows the total (or a custom value); hovering a slice swaps in that slice. */
export function BkDonut({ rows = [], valueFormat = (v) => v, centerValue, centerLabel, size = 176 }) {
  const data = useMemo(() => rows.map((r, i) => ({ label: r.label, value: Number(r.value) || 0, color: r.color || VIZ[i % VIZ.length] })), [rows]);
  return (
    <div style={{ width: size, height: size, flex: '0 0 auto', margin: '0 auto' }}>
      <PieChart data={data} size={size} innerRadius={Math.round(size * 0.34)} padAngle={0.035} cornerRadius={4}>
        {data.map((d, i) => <PieSlice key={`${d.label}-${i}`} index={i} />)}
        <PieCenter defaultLabel={centerLabel}>
          {({ value, label, isHovered }) => {
            const big = isHovered ? valueFormat(value) : (centerValue ?? valueFormat(value));
            return (
              <div style={{ textAlign: 'center', lineHeight: 1.1, maxWidth: Math.round(size * 0.6) }}>
                <div className="pown-mono" style={{ fontSize: fitFont(big, 17), fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{big}</div>
                {centreLabel(isHovered ? label : centerLabel, Math.round(size * 0.6))}
              </div>
            );
          }}
        </PieCenter>
      </PieChart>
    </div>
  );
}

/** Hourly sparkline-style bars. Sparklines have no built-in tooltip by design → readout line driven by onHoverChange. */
export function BkMiniBars({ data = [], dataKey = 'value', xKey = 'x', height = 64, color = 'var(--chart-1)', valueFormat = (v) => v, hoverLabel = (d) => d }) {
  const [hover, setHover] = useState(null);
  const shown = hover ?? null;
  return (
    <div>
      {height >= 100 && (
        <div className="pown-mono" style={{ minHeight: 18, marginBottom: 6, fontSize: 11, color: 'rgba(255,255,255,.62)' }}>
          {shown ? <><span style={{ color: '#fff', fontWeight: 700 }}>{valueFormat(shown[dataKey])}</span> · {hoverLabel(shown[xKey])}</> : null}
        </div>
      )}
      <BarSparkline data={data} dataKey={dataKey} height={height} color={color} barGap={3} barRadius={3} crosshair={false}
        onHoverChange={(_i, d) => setHover(d)} aria-label="Revenue by hour" />
    </div>
  );
}

/* ── Gauge / rings / sparklines (real Bklit Gauge, RingChart, AreaSparkline) ── */

/** 0–100 dial. Bklit's Gauge derives its own height from its width (21:16), so we cap the WIDTH only; a fixed-height
 *  box here made the dial spill over the card heading and hint text. minWidth={0} lets it shrink on phones. */
export function BkGauge({ value = 0, centerValue, suffix = '%', label, maxWidth = 220 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const shown = centerValue ?? Math.round(v);
  return (
    <div style={{ width: '100%', maxWidth, margin: '0 auto', padding: '4px 6px 0', minWidth: 0 }} role="img" aria-label={`${label || 'Gauge'}: ${shown}${suffix}`}>
      <Gauge minWidth={0} value={v} centerValue={Number(shown) || 0} suffix={suffix} defaultLabel={label} totalNotches={56} notchLengthPercent={55} glow />
    </div>
  );
}

/** Concentric progress rings. items: [{label, value, max, color}] */
export function BkRings({ items = [], size = 168, centerLabel, formatCenter }) {
  const data = useMemo(() => items.map((r, i) => ({ label: r.label, value: Number(r.value) || 0, maxValue: Math.max(1, Number(r.max) || 1), color: r.color || VIZ[i % VIZ.length] })), [items]);
  return (
    <div style={{ width: size, height: size, flex: '0 0 auto', margin: '0 auto' }}>
      <RingChart data={data} size={size} strokeWidth={9} ringGap={5}>
        {data.map((d, i) => <Ring key={`${d.label}-${i}`} index={i} />)}
        <RingCenter defaultLabel={centerLabel}>
          {({ value, label, isHovered }) => {
            const big = formatCenter ? formatCenter(value, isHovered) : value;
            return (
              <div style={{ textAlign: 'center', lineHeight: 1.1, maxWidth: Math.round(size * 0.36) }}>
                <div className="pown-mono" style={{ fontSize: fitFont(big, 16), fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{big}</div>
                {centreLabel(isHovered ? label : centerLabel, Math.round(size * 0.36))}
              </div>
            );
          }}
        </RingCenter>
      </RingChart>
    </div>
  );
}

/** Small trend line for KPI tiles. data: [{value}] — interactive hover is handled by Bklit. */
export function BkSpark({ data = [], dataKey = 'value', height = 34, color = 'var(--chart-1)' }) {
  if (!data || data.length < 2) return null;
  return <AreaSparkline data={data} dataKey={dataKey} height={height} color={color} fill="gradient" crosshair={false} aria-label="Trend" />;
}
