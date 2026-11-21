import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, ShoppingCart, Percent, FileSpreadsheet, Gift, BookUser, Star, Loader2, Trash2, Plus, MessageCircle, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../shared/lib/apiBase.js';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const lab = { fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8f8f8f', fontWeight: 800 };
const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: '#070707', border: '1px solid rgba(211,191,162,0.2)', borderRadius: 10, color: '#EFE7D8', fontSize: '0.82rem', outline: 'none' };
const card = { background: 'linear-gradient(160deg,#101010,#0a0a0a)', border: '1px solid rgba(211,191,162,0.12)', borderRadius: 16, padding: 18 };
const btn = (primary) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 15px', borderRadius: 10, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '.04em', border: primary ? '1px solid #d3bfa2' : '1px solid rgba(211,191,162,0.25)', background: primary ? '#d3bfa2' : 'transparent', color: primary ? '#111' : '#d3bfa2' });
const pill = (c) => ({ fontSize: '0.56rem', fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999, color: c, border: `1px solid ${c}55`, background: `${c}18` });
const istToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const addDays = (d, n) => new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const dayName = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const errText = (e) => e?.response?.data?.error || 'Something went wrong. Try again.';

const TABS = [
  { id: 'roster', label: 'Roster & Tips', icon: CalendarDays },
  { id: 'purchasing', label: 'Purchasing', icon: ShoppingCart },
  { id: 'costing', label: 'Food Cost', icon: Percent },
  { id: 'gst', label: 'GST Invoices', icon: FileSpreadsheet },
  { id: 'gift', label: 'Gift Cards & Rewards', icon: Gift },
  { id: 'bookings', label: 'Bookings', icon: BookUser },
  { id: 'reviews', label: 'Guest Reviews', icon: Star },
];

function useApi(tenantId) {
  const base = `${API_BASE_URL}/admin`; const t = encodeURIComponent(tenantId);
  return useMemo(() => ({
    tenant: tenantId,
    get: (p, params) => axios.get(`${base}/${p}/${t}`, { params }).then((r) => r.data),
    post: (p, body) => axios.post(`${base}/${p}/${t}`, body).then((r) => r.data),
    del: (p) => axios.delete(`${base}/${p}`).then((r) => r.data),
    url: (p, params) => `${base}/${p}/${t}?${new URLSearchParams(params)}`,
  }), [base, t, tenantId]);
}
const Msg = ({ m }) => (m ? <div role="status" style={{ margin: '10px 0', padding: '10px 14px', borderRadius: 10, fontSize: '0.74rem', fontWeight: 700, background: m.ok ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)', color: m.ok ? '#34d399' : '#f87171', border: `1px solid ${m.ok ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}` }}>{m.text}</div> : null);
const Empty = ({ children }) => <div style={{ padding: '26px 10px', textAlign: 'center', color: '#8a8a8a', fontSize: '0.78rem' }}>{children}</div>;
const Load = () => <div style={{ padding: 30, textAlign: 'center', color: '#8a8a8a' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>;
const Field = ({ label, children }) => <label style={{ display: 'block' }}><div style={{ ...lab, marginBottom: 6 }}>{label}</div>{children}</label>;

/* ───────── Roster + tip pool ───────── */
function Roster({ api }) {
  const [from, setFrom] = useState(istToday()); const [d, setD] = useState(null); const [msg, setMsg] = useState(null);
  const [f, setF] = useState({ staffId: '', date: istToday(), start: '10:00', end: '18:00' });
  const [tip, setTip] = useState({ date: istToday(), amount: '', method: 'equal' }); const [pools, setPools] = useState([]);
  const load = useCallback(async () => { try { const [r, p] = await Promise.all([api.get('roster', { from }), api.get('tip-pool')]); setD(r); setPools(p); } catch { setD({ staff: [], shifts: [], weeklyHours: {}, overtime: [] }); } }, [api, from]);
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);
  const run = async (fn, ok) => { setMsg(null); try { await fn(); if (ok) setMsg({ ok: true, text: ok }); await load(); } catch (e) { setMsg({ ok: false, text: errText(e) }); } };
  if (!d) return <Load />;
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  return (<div style={{ display: 'grid', gap: 16 }}>
    <div style={card}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, color: '#EFE7D8' }}>Weekly roster</div>
        <div style={{ display: 'flex', gap: 8 }}><button style={btn()} onClick={() => setFrom(addDays(from, -7))}>← Prev</button><button style={btn()} onClick={() => setFrom(istToday())}>This week</button><button style={btn()} onClick={() => setFrom(addDays(from, 7))}>Next →</button></div>
      </div>
      {d.overtime?.length > 0 && <div style={{ ...pill('#fbbf24'), display: 'inline-flex', gap: 6, marginBottom: 12 }}><AlertTriangle size={11} /> Over 48 hrs: {d.overtime.join(', ')}</div>}
      <div style={{ overflowX: 'auto' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(118px,1fr))', gap: 8, minWidth: 840 }}>
        {days.map((day) => (<div key={day} style={{ background: '#080808', border: '1px solid rgba(211,191,162,.1)', borderRadius: 12, padding: 10, minHeight: 110 }}>
          <div style={{ ...lab, color: day === istToday() ? '#d3bfa2' : '#8f8f8f', marginBottom: 8 }}>{dayName(day)}</div>
          {d.shifts.filter((s) => s.date === day).map((s) => (<div key={s._id} style={{ fontSize: '0.7rem', color: '#EFE7D8', padding: '6px 8px', borderRadius: 8, background: 'rgba(211,191,162,.08)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            <span><b>{s.staffName}</b><br /><span style={{ color: '#a9a9a9' }}>{s.start}–{s.end}</span></span>
            <button aria-label={`Remove shift for ${s.staffName}`} onClick={() => run(() => api.del(`roster/${encodeURIComponent(api.tenant)}/${s._id}`))} style={{ background: 'none', border: 0, color: '#8a8a8a', cursor: 'pointer' }}><Trash2 size={12} /></button></div>))}
        </div>))}
      </div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginTop: 16, alignItems: 'end' }}>
        <Field label="Staff"><select style={inp} value={f.staffId} onChange={(e) => setF({ ...f, staffId: e.target.value })}><option value="">Select…</option>{d.staff.map((s) => <option key={s._id} value={s._id}>{s.name} · {s.role}</option>)}</select></Field>
        <Field label="Date"><input type="date" style={inp} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Start"><input type="time" style={inp} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
        <Field label="End"><input type="time" style={inp} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
        <button style={btn(true)} onClick={() => run(() => api.post('roster', f), 'Shift added')}><Plus size={13} /> Add shift</button>
      </div>
      <Msg m={msg} />
    </div>
    <div style={card}>
      <div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 12 }}>Tip pool</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, alignItems: 'end' }}>
        <Field label="Day"><input type="date" style={inp} value={tip.date} onChange={(e) => setTip({ ...tip, date: e.target.value })} /></Field>
        <Field label="Tips collected (₹)"><input type="number" min="0" style={inp} value={tip.amount} onChange={(e) => setTip({ ...tip, amount: e.target.value })} /></Field>
        <Field label="Split"><select style={inp} value={tip.method} onChange={(e) => setTip({ ...tip, method: e.target.value })}><option value="equal">Equally</option><option value="hours">By hours worked</option></select></Field>
        <button style={btn(true)} onClick={() => run(() => api.post('tip-pool', tip), 'Tip pool split saved')}>Split tips</button>
      </div>
      {pools.slice(0, 4).map((p) => (<div key={p._id} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(211,191,162,.1)' }}>
        <div style={{ fontSize: '0.74rem', color: '#a9a9a9' }}>{p.date} · {money(p.amount)} · {p.method === 'hours' ? 'by hours' : 'equal'}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>{p.allocations.map((a) => <span key={a.staffId} style={pill('#d3bfa2')}>{a.name} {money(a.share)}</span>)}</div></div>))}
    </div>
  </div>);
}

/* ───────── Purchasing ───────── */
function Purchasing({ api }) {
  const [pos, setPos] = useState([]); const [led, setLed] = useState({ vendors: [], payments: [] }); const [exp, setExp] = useState([]);
  const [lines, setLines] = useState([]); const [vendor, setVendor] = useState(''); const [msg, setMsg] = useState(null); const [pay, setPay] = useState({ vendorName: '', amount: '', mode: 'cash' });
  const load = useCallback(async () => { try { const [p, l, e] = await Promise.all([api.get('purchase-orders'), api.get('vendor-ledger'), api.get('expiring-stock')]); setPos(p); setLed(l); setExp(e); } catch { setPos([]); } }, [api]);
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);
  const run = async (fn, ok) => { setMsg(null); try { await fn(); setMsg({ ok: true, text: ok }); await load(); } catch (e) { setMsg({ ok: false, text: errText(e) }); } };
  const loadSuggest = async () => { try { const r = await axios.get(`${API_BASE_URL}/admin/purchasing/${encodeURIComponent(api.tenant)}/suggest`); setLines(r.data.items.map((i) => ({ ...i, qty: i.suggestedQty }))); if (r.data.items[0]?.vendorName) setVendor(r.data.items[0].vendorName); if (!r.data.items.length) setMsg({ ok: true, text: 'Nothing is below its minimum level right now.' }); } catch (e) { setMsg({ ok: false, text: errText(e) }); } };
  const total = lines.reduce((n, l) => n + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  return (<div style={{ display: 'grid', gap: 16 }}>
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}><div style={{ fontWeight: 800, color: '#EFE7D8' }}>New purchase order</div><button style={btn()} onClick={loadSuggest}>Fill from low stock</button></div>
      {lines.length === 0 ? <Empty>Use “Fill from low stock” to draft an order for everything running low.</Empty> : (<>
        <Field label="Vendor"><input style={inp} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Supplier name" /></Field>
        {lines.map((l, i) => (<div key={l.inventoryId || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <div style={{ color: '#EFE7D8', fontSize: '0.8rem' }}>{l.name}<div style={{ color: '#8a8a8a', fontSize: '0.64rem' }}>have {l.currentStock ?? '–'} {l.unit}</div></div>
          <input aria-label={`Quantity for ${l.name}`} type="number" min="0" style={inp} value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} />
          <input aria-label={`Unit price for ${l.name}`} type="number" min="0" style={inp} value={l.unitPrice} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value } : x)))} />
          <button aria-label={`Remove ${l.name}`} onClick={() => setLines(lines.filter((_, j) => j !== i))} style={{ background: 'none', border: 0, color: '#8a8a8a', cursor: 'pointer' }}><Trash2 size={14} /></button></div>))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}><b style={{ color: '#d3bfa2' }}>Total {money(total)}</b>
          <button style={btn(true)} onClick={() => run(async () => { await api.post('purchase-orders', { vendorName: vendor, lines }); setLines([]); }, 'Purchase order saved as draft')}>Save order</button></div></>)}
      <Msg m={msg} />
    </div>
    <div style={card}>
      <div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 10 }}>Orders</div>
      {pos.length === 0 ? <Empty>No purchase orders yet.</Empty> : pos.slice(0, 12).map((p) => (<div key={p._id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(211,191,162,.08)' }}>
        <div><b style={{ color: '#EFE7D8' }}>{p.poNo}</b> <span style={{ color: '#a9a9a9', fontSize: '.74rem' }}>· {p.vendorName || 'No vendor'} · {p.lines.length} items · {money(p.total)}</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={pill(p.status === 'received' ? '#34d399' : p.status === 'cancelled' ? '#f87171' : '#fbbf24')}>{p.status}</span>
          {p.status === 'draft' && <button style={btn()} onClick={() => run(() => axios.post(`${API_BASE_URL}/admin/purchase-orders/${encodeURIComponent(api.tenant)}/${p._id}/status`, { action: 'send' }), 'Marked as sent')}>Mark sent</button>}
          {['draft', 'sent'].includes(p.status) && <button style={btn(true)} onClick={() => run(() => axios.post(`${API_BASE_URL}/admin/purchase-orders/${encodeURIComponent(api.tenant)}/${p._id}/status`, { action: 'receive' }), 'Stock received and average cost updated')}>Receive stock</button>}
          {['draft', 'sent'].includes(p.status) && <button style={btn()} onClick={() => run(() => axios.post(`${API_BASE_URL}/admin/purchase-orders/${encodeURIComponent(api.tenant)}/${p._id}/status`, { action: 'cancel' }), 'Order cancelled')}>Cancel</button>}</div></div>))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
      <div style={card}><div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 10 }}>Supplier ledger</div>
        {led.vendors.length === 0 ? <Empty>Receive a purchase order to start the ledger.</Empty> : led.vendors.map((v) => (<div key={v.vendorId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(211,191,162,.08)', fontSize: '.78rem', color: '#cfcfcf' }}><span>{v.vendorName}</span><b style={{ color: v.due > 0 ? '#fbbf24' : '#34d399' }}>{v.due > 0 ? `${money(v.due)} due` : 'Settled'}</b></div>))}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 8, marginTop: 12 }}>
          <input aria-label="Vendor" style={inp} placeholder="Vendor" value={pay.vendorName} onChange={(e) => setPay({ ...pay, vendorName: e.target.value })} />
          <input aria-label="Amount" style={inp} type="number" placeholder="₹" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          <select aria-label="Mode" style={inp} value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank</option><option value="cheque">Cheque</option></select>
          <button style={btn(true)} onClick={() => run(async () => { await axios.post(`${API_BASE_URL}/admin/vendor-ledger/${encodeURIComponent(api.tenant)}/payments`, pay); setPay({ vendorName: '', amount: '', mode: 'cash' }); }, 'Payment recorded')}>Pay</button></div></div>
      <div style={card}><div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 10 }}>Expiring within 7 days</div>
        {exp.length === 0 ? <Empty>Nothing is close to expiry.</Empty> : exp.map((e) => (<div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(211,191,162,.08)', fontSize: '.78rem', color: '#cfcfcf' }}><span>{e.name} · {e.stock} {e.unit}</span><span style={pill(e.daysLeft <= 1 ? '#f87171' : '#fbbf24')}>{e.daysLeft <= 0 ? 'expired' : `${e.daysLeft}d left`} · {money(e.valueAtRisk)}</span></div>))}</div>
    </div>
  </div>);
}

/* ───────── Food cost ───────── */
function Costing({ api }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('recipe-costing').then(setD).catch(() => setD({ dishes: [], avgFoodCostPct: 0, highCount: 0, uncostedMenu: 0 })); }, [api]);
  if (!d) return <Load />;
  const col = { high: '#f87171', watch: '#fbbf24', healthy: '#34d399' };
  return (<div style={card}>
    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 14 }}>
      <div><div style={lab}>Average food cost</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EFE7D8' }}>{d.avgFoodCostPct}%</div></div>
      <div><div style={lab}>Dishes above 40%</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: d.highCount ? '#f87171' : '#34d399' }}>{d.highCount}</div></div>
      <div><div style={lab}>Dishes without a recipe</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EFE7D8' }}>{d.uncostedMenu}</div></div></div>
    {d.dishes.length === 0 ? <Empty>Link recipes (Catalog → Recipes) with ingredient costs to see food cost per dish.</Empty> : (<div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem', color: '#cfcfcf' }}>
      <thead><tr style={{ textAlign: 'left', ...lab }}><th style={{ padding: 8 }}>Dish</th><th>Price</th><th>Cost</th><th>Margin</th><th>Food cost</th><th>Suggested price</th></tr></thead>
      <tbody>{d.dishes.map((r) => (<tr key={r.menuItemId} style={{ borderTop: '1px solid rgba(211,191,162,.08)' }}><td style={{ padding: 8, color: '#EFE7D8' }}>{r.name}{r.missingCosts > 0 && <span title="Some ingredients have no cost yet" style={{ marginLeft: 6, color: '#fbbf24' }}>*</span>}</td><td>{money(r.price)}</td><td>{money(r.cost)}</td><td>{money(r.margin)}</td><td><span style={pill(col[r.status])}>{r.foodCostPct}%</span></td><td>{r.suggestedPrice ? money(r.suggestedPrice) : '–'}</td></tr>))}</tbody></table>
      <div style={{ marginTop: 10, fontSize: '.68rem', color: '#8a8a8a' }}>Suggested price targets a 30% food cost. * means an ingredient has no purchase cost recorded, so the real cost is higher.</div></div>)}
  </div>);
}

/* ───────── GST ───────── */
function Gst({ api }) {
  const [r, setR] = useState({ from: addDays(istToday(), -30), to: istToday() }); const [d, setD] = useState(null); const [msg, setMsg] = useState(null);
  const load = useCallback(async () => { setMsg(null); try { setD(await api.get('gst-invoices', r)); } catch (e) { setMsg({ ok: false, text: errText(e) }); } }, [api, r]);
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const csv = async () => { try { const res = await axios.get(api.url('gst-invoices', { ...r, format: 'csv' }), { responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(res.data); a.download = `gst-${r.from}-to-${r.to}.csv`; a.click(); URL.revokeObjectURL(a.href); } catch (e) { setMsg({ ok: false, text: errText(e) }); } };
  return (<div style={card}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, alignItems: 'end' }}>
      <Field label="From"><input type="date" style={inp} value={r.from} onChange={(e) => setR({ ...r, from: e.target.value })} /></Field>
      <Field label="To"><input type="date" style={inp} value={r.to} onChange={(e) => setR({ ...r, to: e.target.value })} /></Field>
      <button style={btn(true)} onClick={load}>Show</button><button style={btn()} onClick={csv}><Download size={13} /> CSV for accountant</button></div>
    <Msg m={msg} />
    {d && (<><div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', margin: '16px 0' }}>
      {[['Invoices', d.totals.invoices], ['Credit notes', d.totals.creditNotes], ['Taxable', money(d.totals.taxable)], ['CGST', money(d.totals.cgst)], ['SGST', money(d.totals.sgst)], ['Net total', money(d.totals.total)]].map(([k, v]) => <div key={k}><div style={lab}>{k}</div><div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#EFE7D8' }}>{v}</div></div>)}</div>
      {d.invoices.length + d.creditNotes.length === 0 ? <Empty>No invoices in this range.</Empty> : (<div style={{ overflowX: 'auto', maxHeight: 360 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.74rem', color: '#cfcfcf' }}>
        <thead><tr style={{ textAlign: 'left', ...lab }}><th style={{ padding: 8 }}>Invoice</th><th>Date</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total</th></tr></thead>
        <tbody>{[...d.invoices, ...d.creditNotes].slice(0, 300).map((i, k) => (<tr key={k} style={{ borderTop: '1px solid rgba(211,191,162,.08)', color: i.creditNote ? '#f87171' : undefined }}><td style={{ padding: 8 }}>{i.creditNote ? 'CN ' : ''}{i.invoiceNo}</td><td>{i.date}</td><td>{money(i.taxable)}</td><td>{money(i.cgst)}</td><td>{money(i.sgst)}</td><td>{money(i.total)}</td></tr>))}</tbody></table></div>)}
      {!d.gstin || /PENDING/i.test(d.gstin) ? <div style={{ marginTop: 10, ...pill('#fbbf24') }}>Add your GSTIN in settings so invoices are compliant</div> : null}</>)}
  </div>);
}

/* ───────── Gift cards + reward codes ───────── */
function GiftCards({ api }) {
  const [rows, setRows] = useState(null); const [f, setF] = useState({ amount: '', recipientName: '', recipientPhone: '', buyerName: '' }); const [rd, setRd] = useState({ code: '', amount: '' }); const [rc, setRc] = useState(''); const [dc, setDc] = useState(''); const [msg, setMsg] = useState(null);
  const load = useCallback(() => api.get('gift-cards').then(setRows).catch(() => setRows([])), [api]); useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);
  const run = async (fn, ok) => { setMsg(null); try { const r = await fn(); setMsg({ ok: true, text: typeof ok === 'function' ? ok(r) : ok }); await load(); } catch (e) { setMsg({ ok: false, text: errText(e) }); } };
  return (<div style={{ display: 'grid', gap: 16 }}>
    <div style={card}><div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 12 }}>Issue a gift card</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, alignItems: 'end' }}>
        <Field label="Amount (₹)"><input type="number" style={inp} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Buyer"><input style={inp} value={f.buyerName} onChange={(e) => setF({ ...f, buyerName: e.target.value })} /></Field>
        <Field label="Recipient"><input style={inp} value={f.recipientName} onChange={(e) => setF({ ...f, recipientName: e.target.value })} /></Field>
        <Field label="Recipient phone"><input style={inp} inputMode="numeric" value={f.recipientPhone} onChange={(e) => setF({ ...f, recipientPhone: e.target.value })} /></Field>
        <button style={btn(true)} onClick={() => run(() => api.post('gift-cards', f), (r) => `Card ${r.code} issued for ${money(r.amount)}`)}>Issue card</button></div></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
      <div style={card}><div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 10 }}>Redeem gift card at the counter</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 8 }}><input aria-label="Card code" style={inp} placeholder="GC-XXXXXXXX" value={rd.code} onChange={(e) => setRd({ ...rd, code: e.target.value })} /><input aria-label="Bill amount" style={inp} type="number" placeholder="Bill ₹" value={rd.amount} onChange={(e) => setRd({ ...rd, amount: e.target.value })} />
          <button style={btn(true)} onClick={() => run(() => axios.post(`${API_BASE_URL}/admin/gift-cards/${encodeURIComponent(api.tenant)}/redeem`, rd).then((r) => r.data), (r) => `Applied ${money(r.applied)}. Balance ${money(r.balance)}${r.remainingToPay > 0 ? `. Collect ${money(r.remainingToPay)} more` : ''}`)}>Redeem</button></div></div>
      <div style={card}><div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 10 }}>Apply guest reward code</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}><input aria-label="Reward code" style={inp} placeholder="RW-XXXXXXXX" value={rc} onChange={(e) => setRc(e.target.value)} />
          <button style={btn(true)} onClick={() => run(() => axios.post(`${API_BASE_URL}/admin/loyalty-code/${encodeURIComponent(api.tenant)}/redeem`, { code: rc }).then((r) => r.data), (r) => `Valid. Give ₹${r.value} off this bill`)}>Apply</button></div>
        <div style={{ fontSize: '.68rem', color: '#8a8a8a', marginTop: 8 }}>Each code works once, so it cannot be reused on another bill.</div></div>
      <div style={card}><div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 10 }}>Redeem guest deal code</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}><input aria-label="Deal code" style={inp} placeholder="Code shown on the guest's phone" value={dc} onChange={(e) => setDc(e.target.value)} />
          <button style={btn(true)} onClick={() => run(() => axios.post(`${API_BASE_URL}/admin/deal-claims/${encodeURIComponent(api.tenant)}/redeem`, { code: dc }).then((r) => r.data), (r) => `Valid${r.offerTitle ? `: ${r.offerTitle}` : ''}. Apply the deal to this bill`)}>Redeem</button></div>
        <div style={{ fontSize: '.68rem', color: '#8a8a8a', marginTop: 8 }}>Guests claim deals on the home page. Each code works once and expires on its date.</div></div></div>
    <Msg m={msg} />
    <div style={card}><div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 10 }}>Issued cards</div>
      {!rows ? <Load /> : rows.length === 0 ? <Empty>No gift cards issued yet.</Empty> : rows.slice(0, 30).map((c) => (<div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '9px 0', borderTop: '1px solid rgba(211,191,162,.08)', fontSize: '.78rem', color: '#cfcfcf', flexWrap: 'wrap' }}><span><b style={{ color: '#EFE7D8', fontFamily: 'monospace' }}>{c.code}</b> {c.recipientName && `· ${c.recipientName}`}</span><span>{money(c.balance)} / {money(c.amount)} <span style={pill(c.status === 'active' ? '#34d399' : '#8a8a8a')}>{c.status}</span></span></div>))}</div>
  </div>);
}

/* ───────── Bookings: no-show + WhatsApp reminders ───────── */
function Bookings({ api }) {
  const [rows, setRows] = useState(null); const [msg, setMsg] = useState(null); const [now] = useState(() => Date.now());
  const load = useCallback(() => api.get('reservation-reminders').then(setRows).catch(() => setRows([])), [api]); useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);
  const noShow = async (id) => { setMsg(null); try { await axios.post(`${API_BASE_URL}/admin/reservation-noshow/${encodeURIComponent(api.tenant)}/${id}`); setMsg({ ok: true, text: 'Marked as no-show' }); load(); } catch (e) { setMsg({ ok: false, text: errText(e) }); } };
  return (<div style={card}><div style={{ fontWeight: 800, color: '#EFE7D8', marginBottom: 4 }}>Upcoming and due bookings</div><div style={{ fontSize: '.7rem', color: '#8a8a8a', marginBottom: 12 }}>Next 36 hours. “Remind” opens WhatsApp with a ready message to send.</div><Msg m={msg} />
    {!rows ? <Load /> : rows.length === 0 ? <Empty>No bookings in the next 36 hours.</Empty> : rows.map((r) => { const late = new Date(r.at).getTime() < now - 15 * 60000; return (<div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '11px 0', borderTop: '1px solid rgba(211,191,162,.08)' }}>
      <div><b style={{ color: '#EFE7D8' }}>{r.name}</b> <span style={{ color: '#a9a9a9', fontSize: '.74rem' }}>· {r.partySize ? `${r.partySize} guests · ` : ''}{new Date(r.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span> <span style={pill(r.status === 'confirmed' ? '#34d399' : '#fbbf24')}>{r.status}</span></div>
      <div style={{ display: 'flex', gap: 8 }}>{r.waLink && <a href={r.waLink} target="_blank" rel="noopener noreferrer" style={{ ...btn(), textDecoration: 'none' }}><MessageCircle size={13} /> Remind</a>}{late && <button style={{ ...btn(), color: '#f87171', borderColor: 'rgba(248,113,113,.4)' }} onClick={() => noShow(r.id)}>Mark no-show</button>}</div></div>); })}</div>);
}

/* ───────── Reviews ───────── */
function Reviews({ api }) {
  const [d, setD] = useState(null);
  const load = useCallback(() => api.get('guest-reviews').then(setD).catch(() => setD({ reviews: [], avg: 0, total: 0, unhandled: 0 })), [api]); useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);
  if (!d) return <Load />;
  return (<div style={card}><div style={{ display: 'flex', gap: 24, marginBottom: 12 }}><div><div style={lab}>Average</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EFE7D8' }}>{d.avg || '–'}★</div></div><div><div style={lab}>Needs a reply</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: d.unhandled ? '#f87171' : '#34d399' }}>{d.unhandled}</div></div></div>
    {d.reviews.length === 0 ? <Empty>No guest reviews yet. Guests are asked after their meal.</Empty> : d.reviews.slice(0, 40).map((r) => (<div key={r._id} style={{ padding: '11px 0', borderTop: '1px solid rgba(211,191,162,.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><span style={{ color: '#fbbf24' }}>{'★'.repeat(r.rating)}<span style={{ color: '#444' }}>{'★'.repeat(5 - r.rating)}</span> <span style={{ color: '#a9a9a9', fontSize: '.72rem' }}>{r.name || 'Guest'}{r.phone ? ` · ${r.phone}` : ''}</span></span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={pill(r.routed === 'public' ? '#34d399' : '#f87171')}>{r.routed === 'public' ? 'sent to Google' : 'private'}</span>{r.routed === 'private' && !r.handled && <button style={btn()} onClick={() => axios.post(`${API_BASE_URL}/admin/guest-reviews/${encodeURIComponent(api.tenant)}/${r._id}/handled`).then(load)}><CheckCircle2 size={12} /> Handled</button>}</span></div>
      {r.comment && <div style={{ color: '#cfcfcf', fontSize: '.8rem', marginTop: 6 }}>{r.comment}</div>}</div>))}</div>);
}

export default function OpsSuite({ tenantId }) {
  const [tab, setTab] = useState('roster'); const api = useApi(tenantId);
  const View = { roster: Roster, purchasing: Purchasing, costing: Costing, gst: Gst, gift: GiftCards, bookings: Bookings, reviews: Reviews }[tab];
  return (<div style={{ paddingBottom: 80 }}>
    <div style={{ marginBottom: 16 }}><div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#EFE7D8' }}>Ops Suite</div><div style={{ fontSize: '.74rem', color: '#8a8a8a' }}>Roster, purchasing, food cost, GST, gift cards, bookings and guest feedback in one place.</div></div>
    <div role="tablist" aria-label="Ops Suite sections" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, scrollbarWidth: 'none' }}>
      {TABS.map((t) => { const on = tab === t.id; const I = t.icon; return (<button key={t.id} role="tab" aria-selected={on} onClick={() => setTab(t.id)} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 15px', borderRadius: 12, cursor: 'pointer', fontSize: '.7rem', fontWeight: 800, border: `1px solid ${on ? 'rgba(211,191,162,.4)' : 'rgba(211,191,162,.1)'}`, background: on ? 'rgba(211,191,162,.14)' : 'transparent', color: on ? '#f7f3eb' : '#969696' }}><I size={14} />{t.label}</button>); })}
    </div>
    <View api={api} />
  </div>);
}
