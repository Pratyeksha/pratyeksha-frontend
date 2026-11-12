// Small shared UI kit for the Master Admin growth screens (Sales, Client Success, Plans).
// Uses ONLY the Master Admin theme: dark #141416 surfaces with the two-tone gold #d3bfa2 / #8a704d.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { X, Loader2, RefreshCcw } from 'lucide-react';
import API_BASE_URL from './apiBase.js';

export const K = {
  bg: '#141416', bgDark: '#101012', card: '#1b1b1e', card2: '#232327', input: '#17171a',
  border: '#2e2e34', borderMid: '#3b3b42', gold: '#d3bfa2', gold2: '#8a704d',
  goldFaint: 'rgba(211,191,162,0.07)', goldLine: 'rgba(211,191,162,0.16)',
  text: '#e8e8e8', mid: '#a8a8a8', dim: '#8a8a92', faint: '#6e6e76',
  warn: '#d4903a', danger: '#e29a58', ok: '#ecdcb9',
};
export const SERIF = "'Playfair Display', Georgia, serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";

export const growthApi = (path, opts = {}) =>
  axios({ url: `${API_BASE_URL}/admin/master/growth${path}`, method: opts.method || 'GET', data: opts.body, params: opts.params });
export const errMsg = (e) => e?.response?.data?.error || e?.message || 'Something went wrong';

export const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
export const fmtDT = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—');
export const fmtD = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const ago = (d) => {
  if (!d) return 'never';
  const x = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return x <= 0 ? 'today' : x === 1 ? 'yesterday' : x < 30 ? `${x}d ago` : `${Math.floor(x / 30)}mo ago`;
};
/** value for <input type="datetime-local"> in the viewer's local time */
export const toLocalInput = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
export const waLink = (phone, text = '') => {
  const p = String(phone || '').replace(/\D/g, '').slice(-10);
  return p.length === 10 ? `https://wa.me/91${p}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
};

/** Loads data on mount / when deps change; keeps the old data on screen while refreshing. */
export function useLoad(fn, deps = []) {
  const [state, set] = useState({ data: null, loading: true, error: '' });
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []); // re-arm: StrictMode mounts effects twice
  const run = useCallback(async () => {
    set((s) => ({ ...s, loading: true, error: '' }));
    try { const data = await fn(); if (alive.current) set({ data, loading: false, error: '' }); }
    catch (e) { if (alive.current) set((s) => ({ ...s, loading: false, error: errMsg(e) })); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}

export const card = { background: 'linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.016))', border: `1px solid ${K.goldLine}`, borderRadius: 18, boxShadow: '0 18px 44px -22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' };
export const inputStyle = { width: '100%', boxSizing: 'border-box', background: K.input, border: `1px solid ${K.borderMid}`, color: K.text, borderRadius: 9, padding: '9px 11px', fontSize: 13, outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' };

export function Btn({ children, onClick, kind = 'ghost', small, disabled, busy, type = 'button', title, style }) {
  const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid', borderRadius: 9, cursor: disabled || busy ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', padding: small ? '5px 10px' : '9px 14px', fontSize: small ? 11.5 : 13, opacity: disabled ? 0.5 : 1 };
  const kinds = {
    primary: { background: 'linear-gradient(135deg,#e6d6b8,#d3bfa2)', color: '#14110c', borderColor: K.gold },
    ghost: { background: 'transparent', color: K.gold, borderColor: K.goldLine },
    quiet: { background: 'rgba(255,255,255,0.03)', color: '#e8e2d8', borderColor: K.goldLine },
    danger: { background: 'transparent', color: K.danger, borderColor: 'rgba(226,154,88,0.35)' },
  };
  return <button type={type} title={title} onClick={onClick} disabled={disabled || busy} style={{ ...base, ...kinds[kind], ...style }}>{busy && <Loader2 size={13} className="spin-k" />}{children}</button>;
}

export function Pill({ children, tone = 'gold' }) {
  const t = { gold: [K.gold, K.goldFaint, K.goldLine], dim: [K.mid, 'rgba(255,255,255,0.04)', K.border], warn: [K.warn, 'rgba(212,144,58,0.1)', 'rgba(212,144,58,0.3)'], danger: [K.danger, 'rgba(226,154,88,0.1)', 'rgba(226,154,88,0.32)'], ok: [K.ok, 'rgba(236,220,185,0.08)', 'rgba(236,220,185,0.25)'], bronze: [K.gold2, 'rgba(138,112,77,0.1)', 'rgba(138,112,77,0.3)'] }[tone] || [];
  return <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, padding: '2px 8px', borderRadius: 99, color: t[0], background: t[1], border: `1px solid ${t[2]}`, whiteSpace: 'nowrap' }}>{children}</span>;
}

export function Tile({ label, value, sub, tone }) {
  return (
    <div style={{ ...card, padding: '16px 16px 14px', minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO, color: tone || '#f7f3eb', marginTop: 10, letterSpacing: -0.5, overflowWrap: 'anywhere' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: K.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export function Section({ title, hint, right, children, style }) {
  return (
    <section style={{ ...card, padding: 18, minWidth: 0, ...style }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: K.gold, textTransform: 'uppercase' }}>{title}</div>
            {hint && <div style={{ fontSize: 11, color: K.dim, marginTop: 3 }}>{hint}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export const Empty = ({ text }) => <div style={{ padding: '22px 8px', textAlign: 'center', fontSize: 12.5, color: K.faint }}>{text}</div>;

export function Bar({ value, max, color = K.gold, height = 6 }) {
  const w = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return <div style={{ height, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${w}%`, height: '100%', background: `linear-gradient(90deg, ${K.gold2}, ${color})`, borderRadius: 99, transition: 'width .4s' }} /></div>;
}

export function Field({ label, children, hint, style }) {
  return (
    <label style={{ display: 'block', minWidth: 0, ...style }}>
      <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: K.dim, textTransform: 'uppercase', marginBottom: 5 }}>{label}</span>
      {children}
      {hint && <span style={{ display: 'block', fontSize: 10.5, color: K.faint, marginTop: 4 }}>{hint}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children, width = 460 }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ ...card, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', padding: 20, background: '#1b1b1e', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f7f3eb', fontFamily: SERIF }}>{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: K.dim, cursor: 'pointer', padding: 4 }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ErrorLine({ text }) { return text ? <div role="alert" style={{ fontSize: 12, color: K.danger, background: 'rgba(226,154,88,0.08)', border: '1px solid rgba(226,154,88,0.25)', padding: '8px 11px', borderRadius: 9, marginBottom: 10 }}>{text}</div> : null; }

/** Page frame: sticky header + tab row + scrollable body. */
export function Screen({ icon: Icon, eyebrow, title, subtitle, tabs, tab, onTab, onRefresh, loading, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignSelf: 'stretch', width: '100%', minWidth: 0, minHeight: 0, overflow: 'hidden', textAlign: 'left' }}>
      <style>{`.spin-k{animation:kspin 1s linear infinite}@keyframes kspin{to{transform:rotate(360deg)}}.k-tab:focus-visible,.k-row:focus-visible{outline:2px solid ${K.gold};outline-offset:1px}.k-grid{display:grid;gap:12px}.k-row{transition:background .15s}.k-row:hover{background:rgba(211,191,162,0.04)}.k-scroll::-webkit-scrollbar{height:6px;width:8px}.k-scroll::-webkit-scrollbar-thumb{background:#2e2e34;border-radius:9px}`}</style>
      <div className="p-header k-head" style={{ padding: '26px clamp(14px,2.4vw,34px) 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: 2.4, color: K.gold, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>{Icon && <Icon size={13} />} {eyebrow || 'Pratyeksha control'}</div>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3.2vw,36px)', fontWeight: 700, margin: '8px 0 4px', color: '#f7f3eb', letterSpacing: 0.3, lineHeight: 1.15, textAlign: 'left' }}>{title}</h1>
            {subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{subtitle}</div>}
          </div>
          {onRefresh && <Btn kind="quiet" small onClick={onRefresh}><RefreshCcw size={12} className={loading ? 'spin-k' : ''} /> Refresh</Btn>}
        </div>
        {tabs && tabs.length > 0 && <div role="tablist" className="k-scroll no-sb" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {tabs.map(([id, label, n]) => (
            <button key={id} role="tab" aria-selected={tab === id} className="k-tab" onClick={() => onTab(id)} style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', border: `1px solid ${tab === id ? 'rgba(211,191,162,0.5)' : K.goldLine}`, background: tab === id ? 'linear-gradient(135deg, rgba(211,191,162,0.22), rgba(211,191,162,0.06))' : 'transparent', color: tab === id ? '#f7f3eb' : 'rgba(255,255,255,0.55)' }}>
              {label}{n ? <span style={{ fontSize: 10, fontFamily: MONO, color: tab === id ? K.gold : K.faint }}>{n}</span> : null}
            </button>
          ))}
        </div>}
      </div>
      <div className="k-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px clamp(14px,2.4vw,34px) 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 14 }}>{children}</div>
      </div>
    </div>
  );
}

/** Table that scrolls sideways on phones. */
export function Table({ cols, rows, empty = 'Nothing here', onRow }) {
  if (!rows.length) return <Empty text={empty} />;
  return (
    <div className="k-scroll" style={{ overflowX: 'auto', margin: '0 -4px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 520 }}>
        <thead><tr>{cols.map((c) => <th key={c.key} style={{ textAlign: c.right ? 'right' : 'left', padding: '7px 8px', fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.45)', fontWeight: 800, textTransform: 'uppercase', borderBottom: `1px solid ${K.goldLine}`, whiteSpace: 'nowrap' }}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id || r._id || i} className="k-row" onClick={onRow ? () => onRow(r) : undefined} style={{ cursor: onRow ? 'pointer' : 'default', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
            {cols.map((c) => <td key={c.key} style={{ padding: '9px 8px', textAlign: c.right ? 'right' : 'left', color: K.text, verticalAlign: 'middle' }}>{c.render ? c.render(r) : r[c.key]}</td>)}
          </tr>))}
        </tbody>
      </table>
    </div>
  );
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
