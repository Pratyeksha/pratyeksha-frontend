/* Owner charts — real Bklit UI components (vendored from the Bklit registry into src/components/charts).
 * Thin wrappers that keep the Owner app's existing helper signatures, so call sites stay unchanged.
 * Follows the Bklit skill: compose under one root, Grid → series → axes → tooltip, tokens not hex (see bklit.css),
 * one chart per card, status="loading" for skeleton state, reduced motion gated by <OwnerMotion>.
 */
import React, { useMemo, useState } from 'react';
import { AreaChart, Area } from '@/components/charts/area-chart';
import { LineChart, Line } from '@/components/charts/line-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { Bar } from '@/components/charts/bar';
import { BarXAxis } from '@/components/charts/bar-x-axis';
import { BarYAxis } from '@/components/charts/bar-y-axis';
import { PieChart } from '@/components/charts/pie-chart';
import { PieSlice } from '@/components/charts/pie-slice';
import { PieCenter } from '@/components/charts/pie-center';
import { BarSparkline } from '@/components/charts/sparkline';
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
export function BkColumns({ rows = [], valueFormat = (v) => v, height = 200, color = 'var(--chart-1)', highlightLabel }) {
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
        <ChartTooltip showCrosshair={false} rows={(p) => [{ color: split && Number(p.hi) > 0 ? 'var(--chart-1)' : (split ? 'var(--chart-4)' : color), label: 'Value', value: valueFormat(p.total) }]} />
      </BarChart>
    </div>
  );
}

/** Horizontal ranked bars with the value printed at the end of each bar. */
export function BkHBars({ rows = [], valueFormat = (v) => v, color = 'var(--chart-1)', rowHeight = 30, nameWidth = 112 }) {
  const height = Math.max(120, rows.length * rowHeight + 28);
  const data = useMemo(() => rows.map((r) => ({ label: r.label, value: r.value })), [rows]);
  return (
    <div style={sized(height)}>
      <BarChart data={data} xDataKey="label" orientation="horizontal" aspectRatio="auto" className="h-full w-full" margin={{ top: 4, right: 56, bottom: 4, left: nameWidth }}>
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
          {({ value, label, isHovered }) => (
            <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
              <div className="pown-mono" style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{isHovered ? valueFormat(value) : (centerValue ?? valueFormat(value))}</div>
              {(isHovered ? label : centerLabel) && <div style={{ fontSize: 9.5, letterSpacing: 1, fontWeight: 800, color: 'rgba(255,255,255,.52)', marginTop: 2 }}>{String(isHovered ? label : centerLabel).toUpperCase()}</div>}
            </div>
          )}
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
