/**
 * Shared look + helpers for the Master Admin finance / influencer screens.
 * Same design language as the Tracking tab: gold eyebrow + serif title, glass cards, mono figures, gold-gradient primary button.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from './apiBase.js';

export const GOLD = '#d3bfa2', BRONZE = '#8a704d', COPPER = '#e29a58', SAND = '#b9a27e', TAUPE = '#7d7d85', GREEN = '#8fbf9f';
export const LINE = 'rgba(211,191,162,0.16)';
export const MONO = "'JetBrains Mono', ui-monospace, monospace";
export const SERIF = "'Playfair Display', Georgia, serif";
export const GOLD_GRAD = 'linear-gradient(135deg,#e6d6b8,#d3bfa2)';
export const CARD = { background: 'linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.016))', border: `1px solid ${LINE}`, borderRadius: 18, boxShadow: '0 18px 44px -22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' };
export const ghost = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 11, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.03)', color: '#e8e2d8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit' };
export const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, border: 0, background: GOLD_GRAD, color: '#14110c', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' };
export const dangerBtn = { ...ghost, color: COPPER, borderColor: 'rgba(226,154,88,0.35)' };
export const field = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 11, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.03)', color: '#f1ede4', fontSize: 12.5, fontFamily: 'inherit', colorScheme: 'dark', outline: 'none' };

// ── API ──
export const api = {
  get: (path, params) => axios.get(`${API_BASE_URL}/admin/master/${path}`, { params }).then((r) => r.data),
  post: (path, body) => axios.post(`${API_BASE_URL}/admin/master/${path}`, body).then((r) => r.data),
  put: (path, body) => axios.put(`${API_BASE_URL}/admin/master/${path}`, body).then((r) => r.data),
  patch: (path, body) => axios.patch(`${API_BASE_URL}/admin/master/${path}`, body).then((r) => r.data),
  del: (path) => axios.delete(`${API_BASE_URL}/admin/master/${path}`).then((r) => r.data),
};
export const errMsg = (e) => e?.response?.data?.error || e?.message || 'Something went wrong';

/** Loads `path` (re-runs when `deps` change). Keeps showing the last good data if a refresh fails. */
export function useLoad(path, params, deps = []) {
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const key = JSON.stringify(params || {});
  const reload = useCallback(async () => {
    const mine = ++seq.current; setLoading(true);
    try { const d = await api.get(path, params); if (mine === seq.current) { setData(d); setError(''); } }
    catch (e) { if (mine === seq.current) setError(errMsg(e)); }
    finally { if (mine === seq.current) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);
  useEffect(() => { reload(); }, [reload, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error, loading, reload };
}

// ── formatting ──
export const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
export const inr2 = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—');
export const istToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const istMonth = () => istToday().slice(0, 7);
export const monthLabel = (ym) => { const [y, m] = String(ym).split('-').map(Number); return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`; };
export const waPhone = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? `91${d}` : d; };
export const waLink = (phone, text) => { const n = waPhone(phone); return n.length >= 11 ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null; };

// ── exports (CSV cells starting with = + - @ are neutralised so a hostile client name cannot run as a spreadsheet formula) ──
const safeCell = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
export function downloadXlsx(filename, sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const clean = (rows || []).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, safeCell(v)])));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clean.length ? clean : [{ note: 'No rows' }]), name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

// ── PDF documents (jsPDF's built-in fonts have no ₹, so amounts print as "Rs.") ──
const rs = (n) => `Rs. ${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function pdfHeader(doc, company, title, rightLines) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text(company.name || 'Pratyeksha', 14, 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90);
  const l = [company.address, company.gstin && `GSTIN: ${company.gstin}`, [company.phone, company.email].filter(Boolean).join('  |  ')].filter(Boolean);
  l.forEach((t, i) => doc.text(doc.splitTextToSize(String(t), 110), 14, 26 + i * 5));
  doc.setTextColor(0); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(title, 196, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90);
  rightLines.forEach((t, i) => doc.text(String(t), 196, 27 + i * 5, { align: 'right' })); doc.setTextColor(0);
}
export function receiptPdf(r) {
  const doc = new jsPDF(); pdfHeader(doc, r.company, 'PAYMENT RECEIPT', [`Receipt no: ${r.receiptNo}`, `Date: ${fmtDate(r.payment.paidAt)}`]);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Received from', 14, 62); doc.setFont('helvetica', 'normal');
  [r.client.name, r.client.ownerName && `Attn: ${r.client.ownerName}`, r.client.address, r.client.gstin && `GSTIN: ${r.client.gstin}`, r.client.contact && `Phone: ${r.client.contact}`].filter(Boolean).forEach((t, i) => doc.text(doc.splitTextToSize(String(t), 120), 14, 68 + i * 5));
  const refunded = r.refunds.reduce((a, x) => a + x.amount, 0);
  autoTable(doc, { startY: 100, head: [['Description', 'Mode', 'Period', 'Amount']], body: [[r.payment.kind === 'onboard' ? 'Pratyeksha subscription (onboarding)' : 'Pratyeksha subscription renewal', r.payment.method || '—', r.payment.months ? `${r.payment.months} month${r.payment.months > 1 ? 's' : ''}` : '—', rs(r.payment.amount)]], headStyles: { fillColor: [40, 40, 44] }, columnStyles: { 3: { halign: 'right' } } });
  let y = doc.lastAutoTable.finalY + 8; doc.setFontSize(10);
  if (refunded > 0) { doc.text(`Refunded: ${rs(refunded)}`, 196, y, { align: 'right' }); y += 6; doc.setFont('helvetica', 'bold'); doc.text(`Net received: ${rs(r.payment.amount - refunded)}`, 196, y, { align: 'right' }); }
  else { doc.setFont('helvetica', 'bold'); doc.text(`Total received: ${rs(r.payment.amount)}`, 196, y, { align: 'right' }); }
  if (r.payment.note) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`Note: ${r.payment.note}`, 14, y + 12); }
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(120); doc.text('This is a computer-generated receipt and needs no signature.', 14, 285);
  doc.save(`${r.receiptNo}.pdf`);
}
export function invoicePdf(inv, company) {
  const credit = inv.kind === 'credit_note'; const doc = new jsPDF();
  pdfHeader(doc, company, credit ? 'CREDIT NOTE' : 'TAX INVOICE', [`${credit ? 'Credit note' : 'Invoice'} no: ${inv.number}`, `Date: ${fmtDate(inv.date)}`, inv.dueDate && `Due: ${fmtDate(inv.dueDate)}`, credit && `Against invoice: ${inv.refNumber}`].filter(Boolean));
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(credit ? 'Credited to' : 'Billed to', 14, 66); doc.setFont('helvetica', 'normal');
  [inv.clientName, inv.clientAddress, inv.clientGstin && `GSTIN: ${inv.clientGstin}`, inv.placeOfSupply && `Place of supply: ${inv.placeOfSupply}`].filter(Boolean).forEach((t, i) => doc.text(doc.splitTextToSize(String(t), 120), 14, 72 + i * 5));
  autoTable(doc, { startY: 100, head: [['#', 'Description', 'SAC', 'Qty', 'Rate', 'Amount']], body: inv.lines.map((l, i) => [i + 1, l.description, inv.sac, l.qty, rs(l.rate), rs(l.qty * l.rate)]), headStyles: { fillColor: [40, 40, 44] }, columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } } });
  let y = doc.lastAutoTable.finalY + 8; doc.setFontSize(10); const line = (k, v, bold) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.text(k, 140, y); doc.text(v, 196, y, { align: 'right' }); y += 6; };
  line('Taxable value', rs(inv.taxable)); if (inv.interState) line(`IGST @ ${inv.taxPct}%`, rs(inv.igst)); else { line(`CGST @ ${inv.taxPct / 2}%`, rs(inv.cgst)); line(`SGST @ ${inv.taxPct / 2}%`, rs(inv.sgst)); }
  line(credit ? 'Total credit' : 'Total', rs(inv.total), true);
  y += 6; doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  if (!credit && (company.bankName || company.upi)) { doc.setFont('helvetica', 'bold'); doc.text('Payment details', 14, y); doc.setFont('helvetica', 'normal'); y += 5; [company.bankName && `Bank: ${company.bankName}`, company.accountNo && `A/c: ${company.accountNo}`, company.ifsc && `IFSC: ${company.ifsc}`, company.upi && `UPI: ${company.upi}`].filter(Boolean).forEach((t) => { doc.text(t, 14, y); y += 5; }); }
  if (inv.reason) { doc.text(`Reason: ${inv.reason}`, 14, y + 2); y += 7; }
  if (inv.notes || company.invoiceNote) doc.text(doc.splitTextToSize(String(inv.notes || company.invoiceNote), 180), 14, y + 4);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(120); doc.text('This is a computer-generated document.', 14, 285);
  doc.save(`${inv.number.replace(/\//g, '-')}.pdf`);
}

// ── layout primitives ──
export const PageHeader = ({ icon: Icon, eyebrow, title, subtitle, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: 2.4, color: GOLD, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>{Icon && <Icon size={13} />} {eyebrow}</div>
      <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3.2vw,36px)', fontWeight: 700, margin: '8px 0 4px', color: '#f7f3eb', letterSpacing: 0.3, lineHeight: 1.15, textAlign: 'left' }}>{title}</h1>
      {subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{subtitle}</div>}
    </div>
    {children && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>}
  </div>
);
export const Tile = ({ icon: Icon, label, value, sub, tone = GOLD }) => (
  <div style={{ ...CARD, padding: '16px 16px 14px', minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>{Icon && <Icon size={13} color={tone} />} {label}</div>
    <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700, color: '#f7f3eb', fontFamily: MONO, letterSpacing: -0.5, overflowWrap: 'anywhere' }}>{value}</div>
    {sub && <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{sub}</div>}
  </div>
);
export const Section = ({ title, hint, right, children, style }) => (
  <section style={{ ...CARD, padding: 18, minWidth: 0, ...style }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
      <div><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: GOLD, textTransform: 'uppercase' }}>{title}</div>{hint && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{hint}</div>}</div>
      {right}
    </div>
    {children}
  </section>
);
export const GBar = ({ value, max, color = GOLD, height = 7 }) => (
  <div style={{ height, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
    <div style={{ width: `${max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0}%`, height: '100%', background: `linear-gradient(90deg, ${BRONZE}, ${color})`, borderRadius: 99 }} />
  </div>
);
export const Pill = ({ children, color = GOLD }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color, background: `${color}1f`, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>{children}</span>
);
export const Empty = ({ children }) => <div style={{ padding: '26px 8px', textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>{children}</div>;
export const ErrorBox = ({ message, onRetry }) => (
  <div role="alert" style={{ ...CARD, padding: 16, borderColor: 'rgba(226,154,88,0.4)', color: COPPER, fontSize: 12.5, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
    <span style={{ flex: 1 }}>{message}</span>{onRetry && <button type="button" style={ghost} onClick={onRetry}>Retry</button>}
  </div>
);
export const Loading = () => <div style={{ padding: 28, textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>Loading…</div>;
export const Label = ({ children, hint, style }) => (
  <label style={{ display: 'block', minWidth: 0, ...style }}>
    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.62)', marginBottom: 6 }}>{children}</span>
    {hint && <span style={{ display: 'block', fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: -2, marginBottom: 6 }}>{hint}</span>}
  </label>
);

/** Data table in the Tracking style. cols: [{ key, label, align, render(row) }] */
export function DataTable({ cols, rows, empty = 'Nothing here yet.', rowKey }) {
  if (!rows?.length) return <Empty>{empty}</Empty>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 560 }}>
        <thead><tr style={{ borderBottom: `1px solid ${LINE}` }}>{cols.map((c) => <th key={c.key} style={{ textAlign: c.align || 'left', padding: '10px 12px', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontWeight: 800, whiteSpace: 'nowrap' }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? rowKey(r) : i} className="p-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {cols.map((c) => <td key={c.key} style={{ padding: '11px 12px', textAlign: c.align || 'left', verticalAlign: 'middle', color: '#f1ede4' }}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Small toast hook: one message at a time, auto-clears, never leaks a timer. */
export function useToast() {
  const [toast, setToast] = useState(null); const t = useRef(null);
  const show = useCallback((message, tone = 'ok') => { setToast({ message, tone }); clearTimeout(t.current); t.current = setTimeout(() => setToast(null), 3600); }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  const node = toast ? (
    <div role="status" aria-live="polite" style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 400, padding: '11px 18px', borderRadius: 13, background: '#1f1f23', border: `1px solid ${toast.tone === 'err' ? 'rgba(226,154,88,0.5)' : 'rgba(211,191,162,0.4)'}`, color: toast.tone === 'err' ? COPPER : '#f1ede4', fontSize: 12.5, fontWeight: 600, boxShadow: '0 18px 40px -12px rgba(0,0,0,0.7)', maxWidth: '90vw' }}>{toast.message}</div>
  ) : null;
  return [show, node];
}

/** Simple modal: closes on Escape and on a click that starts AND ends on the backdrop (so selecting text never discards a form). */
export function Dialog({ title, onClose, children, width = 460 }) {
  const down = useRef(false);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose?.(); }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      onMouseDown={(e) => { down.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (down.current && e.target === e.currentTarget) onClose?.(); down.current = false; }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 22, borderRadius: 18, background: 'linear-gradient(160deg, #26262a, #1a1a1d)', border: '1px solid rgba(211,191,162,0.26)', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.7)', color: '#f1ede4', textAlign: 'left' }}>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: '#f7f3eb', marginBottom: 14 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

/** Pill-style tab row (same look as the Tracking tab's section tabs). */
export const TabRow = ({ tabs, value, onChange }) => (
  <div role="tablist" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {tabs.map(([id, label, Icon]) => {
      const on = value === id;
      return (
        <button key={id} type="button" role="tab" aria-selected={on} onClick={() => onChange(id)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          border: `1px solid ${on ? 'rgba(211,191,162,0.5)' : LINE}`, background: on ? 'linear-gradient(135deg, rgba(211,191,162,0.22), rgba(211,191,162,0.06))' : 'transparent', color: on ? '#f7f3eb' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap'
        }}>{Icon && <Icon size={14} color={on ? GOLD : undefined} />}{label}</button>
      );
    })}
  </div>
);
