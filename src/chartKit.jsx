/* Chart kit — dependency-free SVG charts following the Bklit UI patterns:
 *  - colours come from CSS tokens (--chart-1..5, --chart-grid, ...), never hard-coded per chart
 *  - one decorative layer per chart (gradient area OR pattern, never stacked effects)
 *  - enter animation 1100ms, ease cubic-bezier(.85,0,.15,1); bars stagger over ~40%
 *  - pointer AND keyboard inspection (arrow keys), tooltip pill + crosshair
 *  - prefers-reduced-motion respected explicitly (Bklit itself only partly handles it)
 *  - unique gradient/clip ids per instance (SVG ids are document-global)
 *  - status="loading" renders the chart's own skeleton instead of swapping components
 */
/* eslint-disable no-unused-vars -- the project's lint config does not count <motion.x> JSX as a use of `motion` (same false positive exists app-wide) */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './chartKit.css';

const ENTER = 1.1;
const EASE = [0.85, 0, 0.15, 1];
const uid = (raw) => String(raw).replace(/[^a-zA-Z0-9_-]/g, '');

/** Fritsch–Carlson monotone cubic through [x,y] points (same family as d3 curveMonotoneX). */
function monotonePath(pts) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx = []; const m = []; const t = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = pts[i + 1][0] - pts[i][0] || 1e-6;
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i += 1) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i += 1) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i]; const b = t[i + 1] / m[i]; const s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i += 1) {
    const x0 = pts[i][0]; const y0 = pts[i][1]; const x1 = pts[i + 1][0]; const y1 = pts[i + 1][1];
    d += `C${x0 + dx[i] / 3},${y0 + (t[i] * dx[i]) / 3} ${x1 - dx[i] / 3},${y1 - (t[i + 1] * dx[i]) / 3} ${x1},${y1}`;
  }
  return d;
}

function useWidth(ref, fallback = 320) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(Math.max(120, Math.round(el.getBoundingClientRect().width) || fallback));
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.round(e.contentRect.width) || fallback)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallback]);
  return w;
}

const defaultFormat = (v) => Number(v).toLocaleString('en-IN');

/* ── Tooltip pill (HTML so text stays crisp and selectable) ── */
function Pill({ x, w, top = 0, children }) {
  const half = 52;
  const left = Math.min(Math.max(x, half), Math.max(half, w - half));
  return <div className="pxc-pill" style={{ left, top }} role="status">{children}</div>;
}

/* ───────────────────────── AreaChart ───────────────────────── */
export function AreaChart({
  data = [], height = 168, format = defaultFormat, color = 'var(--chart-1)', rows = 3,
  status = 'ready', ariaLabel = 'Trend chart', animate = true, showLabels = true, className = '',
}) {
  const wrap = useRef(null);
  const w = useWidth(wrap);
  const reduce = useReducedMotion();
  const id = uid(useId());
  const [active, setActive] = useState(null);
  const loading = status === 'loading';
  const m = { t: 18, r: 10, b: showLabels ? 24 : 8, l: 10 };
  const iw = Math.max(10, w - m.l - m.r); const ih = Math.max(10, height - m.t - m.b);
  const values = data.map((d) => Number(d.value) || 0);
  const max = Math.max(1, ...values); const min = Math.min(0, ...values);
  const span = max - min || 1;
  const pts = useMemo(() => data.map((d, i) => [
    m.l + (data.length < 2 ? iw / 2 : (i / (data.length - 1)) * iw),
    m.t + ih - ((Number(d.value) || 0) - min) / span * ih,
  ]), [data, iw, ih, min, span, m.l, m.t]);
  const line = useMemo(() => monotonePath(pts), [pts]);
  const area = pts.length > 1 ? `${line}L${pts[pts.length - 1][0]},${m.t + ih}L${pts[0][0]},${m.t + ih}Z` : '';
  const go = !reduce && animate;

  const onMove = useCallback((e) => {
    if (!data.length || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left - m.l;
    setActive(Math.max(0, Math.min(data.length - 1, Math.round((x / iw) * (data.length - 1)))));
  }, [data.length, iw, m.l]);
  const onKey = (e) => {
    if (!data.length) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => (a == null ? 0 : Math.min(data.length - 1, a + 1))); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => (a == null ? data.length - 1 : Math.max(0, a - 1))); }
    else if (e.key === 'Escape') setActive(null);
  };
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 54))));
  const a = active != null ? pts[active] : null;

  return (
    <div ref={wrap} className={`pxc pxc-area ${className}`} style={{ height }} aria-busy={loading || undefined}
      onPointerMove={onMove} onPointerLeave={() => setActive(null)} onTouchMove={onMove}
      tabIndex={0} role="img" aria-label={`${ariaLabel}. ${data.map((d) => `${d.label}: ${format(d.value)}`).join(', ')}`}
      onKeyDown={onKey} onBlur={() => setActive(null)}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} aria-hidden="true">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`c${id}`}>
            <motion.rect x="0" y="0" height={height} initial={{ width: go ? 0 : w }} animate={{ width: w }}
              transition={{ duration: go ? ENTER : 0, ease: EASE }} />
          </clipPath>
        </defs>
        {Array.from({ length: rows + 1 }, (_, i) => {
          const y = m.t + (ih / rows) * i;
          return <line key={i} x1={m.l} x2={w - m.r} y1={y} y2={y} className={i === rows ? 'pxc-base' : 'pxc-grid'} />;
        })}
        {loading ? (
          <path d={monotonePath(Array.from({ length: 8 }, (_, i) => [m.l + (i / 7) * iw, m.t + ih * (0.55 - Math.sin(i * 0.9) * 0.18)]))}
            className="pxc-ghost" fill="none" />
        ) : (
          <g clipPath={`url(#c${id})`}>
            {area && <path d={area} fill={`url(#g${id})`} />}
            <path d={line} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {a && !loading && (
          <g>
            <line x1={a[0]} x2={a[0]} y1={m.t} y2={m.t + ih} className="pxc-cross" />
            <circle cx={a[0]} cy={a[1]} r="5.5" fill="var(--chart-dot-ring)" />
            <circle cx={a[0]} cy={a[1]} r="3.5" fill={color} />
          </g>
        )}
        {showLabels && !loading && data.map((d, i) => (i % labelEvery === 0 || i === data.length - 1) && (
          <text key={i} x={pts[i][0]} y={height - 7} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="pxc-label">{d.label}</text>
        ))}
      </svg>
      {a && !loading && <Pill x={a[0]} w={w} top={Math.max(0, a[1] - 46)}><small>{data[active].label}</small><b>{format(data[active].value)}</b></Pill>}
    </div>
  );
}

/* ───────────────────────── BarChart ───────────────────────── */
export function BarChart({
  data = [], height = 150, format = defaultFormat, color = 'var(--chart-1)', radius = 5,
  status = 'ready', ariaLabel = 'Bar chart', animate = true, highlight = null, className = '',
}) {
  const wrap = useRef(null);
  const w = useWidth(wrap);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(null);
  const loading = status === 'loading';
  const m = { t: 16, r: 6, b: 22, l: 6 };
  const iw = w - m.l - m.r; const ih = height - m.t - m.b;
  const n = Math.max(1, data.length);
  const gap = Math.min(10, iw / n * 0.28); const bw = Math.max(4, iw / n - gap);
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const go = !reduce && animate;
  const focus = active ?? highlight;
  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => (a == null ? 0 : Math.min(data.length - 1, a + 1))); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => (a == null ? data.length - 1 : Math.max(0, a - 1))); }
    else if (e.key === 'Escape') setActive(null);
  };
  return (
    <div ref={wrap} className={`pxc pxc-bar ${className}`} style={{ height }} aria-busy={loading || undefined}
      tabIndex={0} role="img" aria-label={`${ariaLabel}. ${data.map((d) => `${d.label}: ${format(d.value)}`).join(', ')}`}
      onKeyDown={onKey} onBlur={() => setActive(null)} onPointerLeave={() => setActive(null)}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} aria-hidden="true">
        <line x1={m.l} x2={w - m.r} y1={m.t + ih} y2={m.t + ih} className="pxc-base" />
        {data.map((d, i) => {
          const h = loading ? ih * (0.35 + ((i * 37) % 50) / 100) : Math.max(3, ((Number(d.value) || 0) / max) * ih);
          const x = m.l + (iw / n) * i + gap / 2;
          const dim = !loading && focus != null && focus !== i;
          return (
            <g key={i} onPointerEnter={() => setActive(i)}>
              <rect x={m.l + (iw / n) * i} y={m.t} width={iw / n} height={ih + 4} fill="transparent" />
              <motion.rect x={x} width={bw} rx={Math.min(radius, bw / 2)} fill={color}
                className={loading ? 'pxc-ghost-fill' : undefined}
                initial={{ y: go ? m.t + ih : m.t + ih - h, height: go ? 0 : h, opacity: 1 }}
                animate={{ y: m.t + ih - h, height: h, opacity: dim ? 0.4 : 1 }}
                transition={{ duration: go ? 0.7 : 0, delay: go ? i * (ENTER * 0.4 / n) : 0, ease: EASE, opacity: { duration: 0.18 } }} />
              {!loading && <text x={x + bw / 2} y={height - 6} textAnchor="middle" className={`pxc-label${focus === i ? ' on' : ''}`}>{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {active != null && !loading && data[active] && (() => {
        const cx = m.l + (iw / n) * active + iw / n / 2;
        const h = ((Number(data[active].value) || 0) / max) * ih;
        return <Pill x={cx} w={w} top={Math.max(0, m.t + ih - h - 48)}><small>{data[active].label}</small><b>{format(data[active].value)}</b></Pill>;
      })()}
    </div>
  );
}

/* ───────────────────────── Sparkline ───────────────────────── */
/** Single element, no children. Hover hands the datum to the caller (like useSparklineHover) — no built-in tooltip. */
export function Sparkline({
  data = [], height = 32, color = 'var(--chart-1)', fill = 'gradient', strokeWidth = 2, endDot = true,
  animate = true, onHover, className = '', ariaLabel = 'Trend',
}) {
  const reduce = useReducedMotion();
  const id = uid(useId());
  const [active, setActive] = useState(null);
  const vals = data.map((d) => (typeof d === 'number' ? d : Number(d?.value) || 0));
  const n = vals.length;
  if (n < 2) return <div className={`pxc-spark ${className}`} style={{ height }} aria-hidden="true" />;
  const lo = Math.min(...vals); const hi = Math.max(...vals); const span = hi - lo || 1;
  const pad = 8;
  const pts = vals.map((v, i) => [(i / (n - 1)) * 100, pad + (100 - pad * 2) * (1 - (v - lo) / span)]);
  const line = monotonePath(pts);
  const go = !reduce && animate;
  const idx = active ?? n - 1;
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))));
    setActive(i); onHover?.(i, data[i]);
  };
  const leave = () => { setActive(null); onHover?.(null, null); };
  return (
    <div className={`pxc-spark ${className}`} style={{ height }} role="img" aria-label={`${ariaLabel}: ${vals.join(', ')}`}
      onPointerMove={move} onPointerLeave={leave}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {fill === 'gradient' && (
          <motion.path d={`${line}L100,100L0,100Z`} fill={`url(#s${id})`}
            initial={{ opacity: go ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: go ? ENTER : 0, ease: EASE }} />
        )}
        <motion.path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke" initial={{ pathLength: go ? 0 : 1 }} animate={{ pathLength: 1 }}
          transition={{ duration: go ? ENTER : 0, ease: EASE }} />
      </svg>
      {(endDot || active != null) && (
        <i className="pxc-spark-dot" style={{ left: `${pts[idx][0]}%`, top: `${pts[idx][1]}%`, background: color }} />
      )}
    </div>
  );
}

/* ───────────────────────── RingGauge ───────────────────────── */
/** value is always 0–100. Children render in the centre. */
export function RingGauge({ value = 0, size = 76, stroke = 8, color = 'var(--chart-1)', animate = true, children, ariaLabel = 'Progress', className = '' }) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - stroke) / 2; const go = !reduce && animate;
  return (
    <div className={`pxc-ring ${className}`} style={{ width: size, height: size }} role="img" aria-label={`${ariaLabel}: ${Math.round(v)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="pxc-track" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ pathLength: go ? 0 : v / 100 }} animate={{ pathLength: v / 100 }}
          transition={{ duration: go ? ENTER : 0, ease: EASE }} />
      </svg>
      <div className="pxc-ring-c">{children}</div>
    </div>
  );
}

/* ───────────────────────── DonutRing ───────────────────────── */
export function DonutRing({ segments = [], size = 96, thickness = 12, padAngle = 0.035, animate = true, children, ariaLabel = 'Breakdown', className = '' }) {
  const reduce = useReducedMotion();
  const [hot, setHot] = useState(null);
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const r = (size - thickness) / 2; const go = !reduce && animate;
  const fracs = segments.map((s) => (total ? (Number(s.value) || 0) / total : 0));
  const arcs = segments.map((s, i) => {
    const before = fracs.slice(0, i).reduce((a, b) => a + b, 0);
    return { ...s, i, len: Math.max(0, fracs[i] - padAngle), off: -(before + padAngle / 2), frac: fracs[i] };
  });
  return (
    <div className={`pxc-ring ${className}`} style={{ width: size, height: size }} role="img"
      aria-label={`${ariaLabel}: ${segments.map((s) => `${s.label} ${Math.round(total ? (s.value / total) * 100 : 0)}%`).join(', ')}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="pxc-track" strokeWidth={thickness} />
        {arcs.map((a) => a.len > 0 && (
          <motion.circle key={a.i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={a.color} pathLength={1}
            strokeDashoffset={a.off} onPointerEnter={() => setHot(a.i)} onPointerLeave={() => setHot(null)}
            initial={{ strokeDasharray: go ? '0 1' : `${a.len} ${1 - a.len}` }}
            animate={{ strokeDasharray: `${a.len} ${1 - a.len}`, strokeWidth: hot === a.i ? thickness + 3 : thickness, opacity: hot != null && hot !== a.i ? 0.45 : 1 }}
            transition={{ strokeDasharray: { duration: go ? ENTER : 0, ease: EASE, delay: go ? a.i * 0.08 : 0 }, strokeWidth: { duration: 0.15 }, opacity: { duration: 0.15 } }} />
        ))}
      </svg>
      <div className="pxc-ring-c">{children}</div>
    </div>
  );
}

/* ───────────────────────── Legend ───────────────────────── */
export function ChartLegend({ items = [], className = '' }) {
  return (
    <ul className={`pxc-legend ${className}`}>
      {items.map((it) => (
        <li key={it.label}><i style={{ background: it.color }} /><span>{it.label}</span>{it.value != null && <b>{it.value}</b>}</li>
      ))}
    </ul>
  );
}

/* ───────────────────────── TimelineStrip ───────────────────────── */
/** A 24-hour strip. segments = [{from, to}] in minutes (0–1440; overnight windows pre-split by the caller). */
export function TimelineStrip({ segments = [], nowMin = null, color = 'var(--chart-1)', ticks = ['12a', '6a', '12p', '6p', '12a'], ariaLabel = 'Hours', className = '' }) {
  const reduce = useReducedMotion();
  return (
    <div className={`pxc-tl ${className}`} role="img" aria-label={ariaLabel}>
      <div className="pxc-tl-track">
        {segments.map((s, i) => (
          <motion.i key={i} style={{ left: `${(s.from / 1440) * 100}%`, width: `${((s.to - s.from) / 1440) * 100}%`, background: color, originX: 0 }}
            initial={{ scaleX: reduce ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.8, ease: EASE, delay: reduce ? 0 : i * 0.08 }} />
        ))}
        {nowMin != null && <span className="pxc-tl-now" style={{ left: `${(nowMin / 1440) * 100}%` }} />}
      </div>
      <div className="pxc-tl-ticks" aria-hidden="true">{ticks.map((t, i) => <span key={`${t}${i}`}>{t}</span>)}</div>
    </div>
  );
}
