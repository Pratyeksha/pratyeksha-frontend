import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from './apiBase.js';

/* Operator Portal panels: Tables (add/remove), Combos (create/price/publish) and Bill Requests (review → apply offer/discount → Send Bill).
   All calls go through the shared axios instance; operatorAuth.js attaches the signed, tenant-scoped session token. */

const BASE_URL = API_BASE_URL;
const T = { card: '#1b1b1e', card2: '#232327', line: 'rgba(211,191,162,.16)', gold: '#d3bfa2', goldDim: '#8a704d', text: '#ece6da', muted: '#9a9486', sage: '#93ab8d', danger: '#d0806f', input: '#17171a' };
const card = { background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 18 };
const inp = { background: T.input, border: `1px solid ${T.line}`, borderRadius: 10, padding: '10px 12px', color: T.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };
const btn = (primary, disabled, danger) => ({ padding: '9px 15px', borderRadius: 10, border: primary ? 'none' : `1px solid ${danger ? 'rgba(208,128,111,.55)' : T.line}`, background: primary ? 'linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78)' : 'transparent', color: primary ? '#1a1612' : danger ? T.danger : T.gold, fontWeight: 700, fontSize: 12.5, letterSpacing: .3, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1 });
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const errMsg = (e, fb) => e?.response?.data?.error || e?.message || fb;
const Head = ({ title, sub, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
    <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: T.gold }}>{title}</div>{sub && <div style={{ color: T.muted, fontSize: 13, marginTop: 4, maxWidth: 620, lineHeight: 1.55 }}>{sub}</div>}</div>{right}
  </div>
);

/* ───────────────────────── TABLES ───────────────────────── */
export function OperatorTables({ tenantId, notify }) {
  const [rows, setRows] = useState(null);
  const [label, setLabel] = useState('');
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState('');
  const load = useCallback(async () => {
    try { const r = await axios.get(`${BASE_URL}/operator/tables/${tenantId}`); setRows(r.data.tables); try { localStorage.setItem('table_count', String(r.data.tableCount)); } catch { /* ignore */ } }
    catch (e) { notify?.(errMsg(e, 'Could not load tables.'), 'error'); setRows([]); }
  }, [tenantId, notify]);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    setBusy('add');
    try { const r = await axios.post(`${BASE_URL}/operator/tables/${tenantId}`, label.trim() ? { label: label.trim() } : { count: Math.max(1, Math.min(50, Number(count) || 1)) }); notify?.(`Added table${r.data.added.length > 1 ? 's' : ''} ${r.data.added.join(', ')}`); setLabel(''); setCount(1); await load(); }
    catch (e) { notify?.(errMsg(e, 'Could not add the table.'), 'error'); } finally { setBusy(''); }
  };
  const remove = async (n) => {
    setBusy('rm' + n);
    try { await axios.delete(`${BASE_URL}/operator/tables/${tenantId}/${encodeURIComponent(n)}`); notify?.(`Table ${n} removed`); setConfirm(''); await load(); }
    catch (e) { notify?.(errMsg(e, 'Could not remove the table.'), 'error'); setConfirm(''); } finally { setBusy(''); }
  };
  const release = async (n) => {
    setBusy('rl' + n);
    try { await axios.post(`${BASE_URL}/admin/table-lock/release`, { tenantId, tableNumber: n }); notify?.(`Table ${n} unlocked`); await load(); }
    catch (e) { notify?.(errMsg(e, 'Could not unlock the table.'), 'error'); } finally { setBusy(''); }
  };
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 100, width: '100%' }}>
      <Head title="Tables" sub="Add or remove tables as your floor changes. Removing a table switches its printed QR off immediately; a new table needs its own QR poster, which Pratyeksha generates for you in QR Studio." />
      <div style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ flex: '1 1 150px' }}><div style={{ color: T.muted, fontSize: 11.5, marginBottom: 6, letterSpacing: 1 }}>NAME (OPTIONAL)</div><input style={inp} value={label} maxLength={12} onChange={e => setLabel(e.target.value)} placeholder="e.g. 14 or Patio-1" aria-label="Table name" /></div>
        {!label.trim() && <div style={{ width: 110 }}><div style={{ color: T.muted, fontSize: 11.5, marginBottom: 6, letterSpacing: 1 }}>HOW MANY</div><input style={inp} type="number" min={1} max={50} value={count} onChange={e => setCount(e.target.value)} aria-label="Number of tables to add" /></div>}
        <button type="button" style={btn(true, busy === 'add')} disabled={busy === 'add'} onClick={add}>{busy === 'add' ? 'Adding…' : label.trim() ? 'Add table' : `Add ${Math.max(1, Number(count) || 1)} table${(Number(count) || 1) > 1 ? 's' : ''}`}</button>
      </div>
      {rows === null ? <div style={{ color: T.muted }}>Loading tables…</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(168px,1fr))', gap: 12 }}>
          {rows.map(t => (
            <div key={t.tableNumber} style={{ ...card, padding: 14, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: T.gold }}>{t.tableNumber}</div>
                <span style={{ fontSize: 11, color: t.hasOpenOrders ? T.gold : T.muted }}>{t.hasOpenOrders ? 'Open orders' : 'Free'}</span></div>
              {t.locked && <button type="button" style={{ ...btn(false, busy === 'rl' + t.tableNumber), padding: '6px 8px', fontSize: 11 }} onClick={() => release(t.tableNumber)} title="Free this table if the ordering guest lost their phone">Release lock</button>}
              {confirm === t.tableNumber ? (
                <div style={{ display: 'flex', gap: 6 }}><button type="button" style={{ ...btn(false, busy === 'rm' + t.tableNumber, true), padding: '6px 8px', fontSize: 11, flex: 1 }} onClick={() => remove(t.tableNumber)}>Confirm remove</button><button type="button" style={{ ...btn(false), padding: '6px 8px', fontSize: 11 }} onClick={() => setConfirm('')}>Keep</button></div>
              ) : <button type="button" style={{ ...btn(false, t.hasOpenOrders, true), padding: '6px 8px', fontSize: 11 }} disabled={t.hasOpenOrders} title={t.hasOpenOrders ? 'Settle or void its open orders first' : 'Remove this table'} onClick={() => setConfirm(t.tableNumber)}>Remove</button>}
            </div>))}
        </div>)}
    </div>
  );
}

/* ───────────────────────── COMBOS ───────────────────────── */
const blankCombo = { _id: null, name: '', description: '', imageUrl: '', price: '', items: [], isPublished: true };
export function OperatorCombos({ tenantId, menuItems, notify }) {
  const [combos, setCombos] = useState(null);
  const [form, setForm] = useState(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    try { const r = await axios.get(`${BASE_URL}/operator/combos/${tenantId}`); setCombos(r.data.combos); }
    catch (e) { notify?.(errMsg(e, 'Could not load combos.'), 'error'); setCombos([]); }
  }, [tenantId, notify]);
  useEffect(() => { load(); }, [load]);
  const menu = useMemo(() => (menuItems || []).filter(m => m && m._id), [menuItems]);
  const byId = useMemo(() => new Map(menu.map(m => [String(m._id), m])), [menu]);
  const unitOf = (m) => Number(m.price) > 0 ? Number(m.price) : Number(m.priceFull) > 0 ? Number(m.priceFull) : Number(m.priceHalf) || 0;
  const listPrice = useMemo(() => (form?.items || []).reduce((a, i) => a + unitOf(byId.get(String(i.menuItemId)) || {}) * i.quantity, 0), [form, byId]);
  const setQty = (id, d) => setForm(f => ({ ...f, items: f.items.flatMap(i => String(i.menuItemId) === String(id) ? (i.quantity + d <= 0 ? [] : [{ ...i, quantity: Math.min(20, i.quantity + d) }]) : [i]) }));
  const addDish = (m) => setForm(f => f.items.some(i => String(i.menuItemId) === String(m._id)) ? f : { ...f, items: [...f.items, { menuItemId: String(m._id), quantity: 1 }] });
  const save = async () => {
    setBusy('save');
    try {
      const body = { name: form.name, description: form.description, imageUrl: form.imageUrl, price: Number(form.price), items: form.items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })), isPublished: form.isPublished };
      const r = form._id ? await axios.patch(`${BASE_URL}/operator/combos/${tenantId}/${form._id}`, body) : await axios.post(`${BASE_URL}/operator/combos/${tenantId}`, body);
      notify?.(r.data.warning ? `Saved. ${r.data.warning}` : form.isPublished ? 'Combo saved and live for guests' : 'Combo saved as a draft'); setForm(null); await load();
    } catch (e) { notify?.(errMsg(e, 'Could not save the combo.'), 'error'); } finally { setBusy(''); }
  };
  const toggle = async (c) => {
    setBusy('t' + c._id);
    try { await axios.patch(`${BASE_URL}/operator/combos/${tenantId}/${c._id}`, { isPublished: !c.isPublished }); await load(); notify?.(c.isPublished ? 'Combo hidden from guests' : 'Combo published'); }
    catch (e) { notify?.(errMsg(e, 'Could not update the combo.'), 'error'); } finally { setBusy(''); }
  };
  const del = async (c) => {
    if (!window.confirm(`Delete combo "${c.name}"?`)) return; setBusy('d' + c._id);
    try { await axios.delete(`${BASE_URL}/operator/combos/${tenantId}/${c._id}`); await load(); notify?.('Combo deleted'); }
    catch (e) { notify?.(errMsg(e, 'Could not delete the combo.'), 'error'); } finally { setBusy(''); }
  };
  const edit = (c) => setForm({ _id: c._id, name: c.name, description: c.description || '', imageUrl: c.imageUrl || '', price: String(c.price), isPublished: c.isPublished, items: c.items.map(i => ({ menuItemId: String(i.menuItemId), quantity: i.quantity })) });
  const valid = form && form.name.trim().length >= 2 && form.items.length >= 1 && Number.isFinite(Number(form.price)) && form.price !== '' && Number(form.price) >= 0;
  const pickList = menu.filter(m => m.isAvailable !== false && `${m.name}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40);
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 100, width: '100%' }}>
      <Head title="Combos" sub="Bundle dishes into one priced offer. Published combos appear in your customer app and are priced by the server, so guests can never change the price. A combo hides itself while any of its dishes is unavailable."
        right={!form && <button type="button" style={btn(true)} onClick={() => setForm({ ...blankCombo })}>New combo</button>} />
      {form && (
        <div style={{ ...card, display: 'grid', gap: 14, marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, color: T.muted, fontSize: 11.5, letterSpacing: 1 }}>NAME<input style={inp} value={form.name} maxLength={80} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Thali for Two" /></label>
            <label style={{ display: 'grid', gap: 6, color: T.muted, fontSize: 11.5, letterSpacing: 1 }}>COMBO PRICE (₹, BEFORE TAX)<input style={inp} inputMode="decimal" value={form.price} onChange={e => setForm({ ...form, price: e.target.value.replace(/[^0-9.]/g, '') })} placeholder="0" /></label>
          </div>
          <label style={{ display: 'grid', gap: 6, color: T.muted, fontSize: 11.5, letterSpacing: 1 }}>DESCRIPTION (OPTIONAL)<input style={inp} value={form.description} maxLength={300} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <label style={{ display: 'grid', gap: 6, color: T.muted, fontSize: 11.5, letterSpacing: 1 }}>IMAGE LINK (OPTIONAL, https)<input style={inp} value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" /></label>
          <div>
            <div style={{ color: T.muted, fontSize: 11.5, letterSpacing: 1, marginBottom: 8 }}>DISHES IN THIS COMBO</div>
            {form.items.length === 0 ? <div style={{ color: T.muted, fontSize: 13 }}>Pick dishes below.</div> : form.items.map(i => { const m = byId.get(String(i.menuItemId)); return (
              <div key={i.menuItemId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.line}` }}>
                <div style={{ flex: 1, color: T.text, fontSize: 14 }}>{m?.name || 'Unknown dish'}<span style={{ color: T.muted }}> · {inr(unitOf(m || {}))}</span></div>
                <button type="button" aria-label="Decrease" style={{ ...btn(false), padding: '4px 10px' }} onClick={() => setQty(i.menuItemId, -1)}>−</button><span style={{ minWidth: 20, textAlign: 'center', color: T.text }}>{i.quantity}</span><button type="button" aria-label="Increase" style={{ ...btn(false), padding: '4px 10px' }} onClick={() => setQty(i.menuItemId, 1)}>+</button>
              </div>); })}
            <div style={{ marginTop: 10, color: T.muted, fontSize: 13 }}>Bought separately: <b style={{ color: T.text }}>{inr(listPrice)}</b>{Number(form.price) > 0 && listPrice > 0 && <> · {Number(form.price) <= listPrice ? <span style={{ color: T.sage }}>guest saves {inr(listPrice - Number(form.price))}</span> : <span style={{ color: T.danger }}>combo costs {inr(Number(form.price) - listPrice)} more than separate</span>}</>}</div>
          </div>
          <div>
            <input style={inp} value={q} onChange={e => setQ(e.target.value)} placeholder="Search your menu to add dishes…" aria-label="Search dishes" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, maxHeight: 150, overflowY: 'auto' }}>
              {pickList.map(m => { const on = form.items.some(i => String(i.menuItemId) === String(m._id)); return <button key={m._id} type="button" onClick={() => addDish(m)} aria-pressed={on} style={{ padding: '7px 11px', borderRadius: 999, border: `1px solid ${on ? T.gold : T.line}`, background: on ? 'rgba(211,191,162,.14)' : 'transparent', color: on ? T.gold : T.text, fontSize: 12.5, cursor: 'pointer' }}>{m.name}</button>; })}
              {pickList.length === 0 && <span style={{ color: T.muted, fontSize: 13 }}>No available dishes match.</span>}
            </div>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: T.text, fontSize: 13.5 }}><input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} style={{ accentColor: T.gold }} />Publish to customers now</label>
          <div style={{ display: 'flex', gap: 10 }}><button type="button" style={btn(true, !valid || busy === 'save')} disabled={!valid || busy === 'save'} onClick={save}>{busy === 'save' ? 'Saving…' : form._id ? 'Save changes' : 'Create combo'}</button><button type="button" style={btn(false)} onClick={() => setForm(null)}>Cancel</button></div>
        </div>)}
      {combos === null ? <div style={{ color: T.muted }}>Loading combos…</div> : combos.length === 0 && !form ? <div style={{ ...card, color: T.muted, textAlign: 'center' }}>No combos yet. Create your first bundle.</div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {combos.map(c => (
            <div key={c._id} style={{ ...card, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div><div style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>{c.name} <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, marginLeft: 6, background: c.isPublished ? 'rgba(147,171,141,.16)' : 'rgba(154,148,134,.16)', color: c.isPublished ? T.sage : T.muted }}>{c.isPublished ? 'Published' : 'Draft'}</span></div>
                  <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{c.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: T.gold }}>{inr(c.price)}</div>{c.savings > 0 && <div style={{ color: T.sage, fontSize: 12 }}>saves {inr(c.savings)}</div>}</div>
              </div>
              {(c.unavailableItems.length > 0 || c.missingItems.length > 0) && <div style={{ color: T.danger, fontSize: 12.5 }}>{c.missingItems.length ? `Deleted dish: ${c.missingItems.join(', ')}. ` : ''}{c.unavailableItems.length ? `Hidden from guests while unavailable: ${c.unavailableItems.join(', ')}.` : ''}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={btn(false, !!busy)} disabled={!!busy} onClick={() => toggle(c)}>{c.isPublished ? 'Unpublish' : 'Publish'}</button>
                <button type="button" style={btn(false)} onClick={() => edit(c)}>Edit</button>
                <button type="button" style={btn(false, !!busy, true)} disabled={!!busy} onClick={() => del(c)}>Delete</button>
              </div>
            </div>))}
        </div>)}
    </div>
  );
}

/* ───────────────────────── BILL REQUESTS ───────────────────────── */
export function OperatorBillRequests({ tenantId, notify, onGoBilling }) {
  const [list, setList] = useState(null);
  const [sel, setSel] = useState(null);                 // request id under review
  const [review, setReview] = useState(null);
  const [choice, setChoice] = useState('none');         // 'none' | offerId | 'manual'
  const [man, setMan] = useState({ type: 'percent', value: '', reason: '' });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const seq = useRef(0);
  const loadList = useCallback(async () => {
    try { const r = await axios.get(`${BASE_URL}/operator/bill-requests/${tenantId}`); setList(r.data.requests); }
    catch (e) { if (e?.response?.status !== 401) notify?.(errMsg(e, 'Could not load bill requests.'), 'error'); setList(l => l || []); }
  }, [tenantId, notify]);
  useEffect(() => { loadList(); const t = setInterval(loadList, 5000); return () => clearInterval(t); }, [loadList]);

  const discountBody = useMemo(() => choice === 'none' ? null : choice === 'manual' ? (Number(man.value) > 0 ? { source: 'manual', type: man.type, value: Number(man.value), reason: man.reason } : null) : { source: 'offer', offerId: choice }, [choice, man]);
  const doReview = useCallback(async (id, body) => {
    const my = ++seq.current;
    try { const r = await axios.post(`${BASE_URL}/operator/bill-requests/${tenantId}/${id}/review`, { discount: body }); if (my === seq.current) { setReview(r.data); setMsg(''); } }
    catch (e) { if (my === seq.current) { setMsg(errMsg(e, 'Could not load the bill.')); if (e?.response?.status === 409 || e?.response?.status === 404) { setSel(null); loadList(); } } }
  }, [tenantId, loadList]);
  useEffect(() => { if (!sel) { setReview(null); return; } const t = setTimeout(() => doReview(sel, discountBody), 250); return () => clearTimeout(t); }, [sel, discountBody, doReview]);
  const open = (id) => { setSel(id); setChoice('none'); setMan({ type: 'percent', value: '', reason: '' }); setReview(null); setMsg(''); };

  const send = async () => {
    setBusy('send');
    try {
      const r = await axios.post(`${BASE_URL}/operator/bill-requests/${tenantId}/${sel}/send`, { discount: discountBody, expectedBaseSubtotal: review.baseSubtotal });
      notify?.(`Bill sent to Table ${review.tableNumber} · ${inr(r.data.approved.grandTotal)}`); await loadList(); await doReview(sel, discountBody);
    } catch (e) { const d = e?.response?.data; setMsg(d?.error || 'Could not send the bill.'); if (d?.code === 'ORDERS_CHANGED') doReview(sel, discountBody); } finally { setBusy(''); }
  };
  const cancel = async () => {
    if (!window.confirm('Cancel this bill request?')) return; setBusy('cancel');
    try { await axios.post(`${BASE_URL}/operator/bill-requests/${tenantId}/${sel}/cancel`); setSel(null); await loadList(); } catch (e) { setMsg(errMsg(e, 'Could not cancel.')); } finally { setBusy(''); }
  };
  const p = review?.preview;
  const manualInvalid = choice === 'manual' && Number(man.value) > 0 && !man.reason.trim();
  const canSend = !!review && !!p && !review.discountError && review.pendingOrders === 0 && !manualInvalid && busy !== 'send';

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 100, width: '100%' }}>
      <Head title="Bill requests" sub="Guests ask for the bill from their table. Review the order, apply an eligible offer or a discount, then send — the guest sees exactly the bill you approve." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,300px) 1fr', gap: 16, alignItems: 'start' }} className="px-billreq-grid">
        <div style={{ display: 'grid', gap: 10 }}>
          {list === null ? <div style={{ color: T.muted }}>Loading…</div> : list.length === 0 ? <div style={{ ...card, color: T.muted, fontSize: 13, textAlign: 'center' }}>No open bill requests.</div> : list.map(b => (
            <button key={b.id} type="button" onClick={() => open(b.id)} aria-pressed={sel === b.id} style={{ ...card, textAlign: 'left', cursor: 'pointer', borderColor: sel === b.id ? T.gold : T.line, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: T.gold }}>Table {b.tableNumber}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: b.status === 'sent' ? 'rgba(147,171,141,.16)' : 'rgba(211,191,162,.14)', color: b.status === 'sent' ? T.sage : T.gold }}>{b.status === 'sent' ? 'Bill sent' : 'Needs review'}</span></div>
              <div style={{ color: T.muted, fontSize: 12.5, marginTop: 6 }}>{b.guestName ? `${b.guestName} · ` : ''}{new Date(b.requestedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}{b.grandTotal != null ? ` · ${inr(b.grandTotal)}` : ''}</div>
              {b.claimed && <div style={{ color: b.claimed.stale ? T.danger : T.gold, fontSize: 12, marginTop: 6 }}>{b.claimed.stale ? 'Guest tapped “I’ve paid” for an older bill' : 'Guest says they paid — confirm in Billing Hub'}</div>}
            </button>))}
        </div>
        <div>
          {!sel ? <div style={{ ...card, color: T.muted, textAlign: 'center', padding: 40 }}>Select a request to review its bill.</div> : !review ? <div style={{ ...card, color: T.muted }}>{msg || 'Loading bill…'}</div> : (
            <div style={{ ...card, display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}><div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: T.gold }}>Table {review.tableNumber}{review.joinedTables.length > 1 ? ` + ${review.joinedTables.filter(t => t !== review.tableNumber).join(', ')}` : ''}</div>
                {review.status === 'sent' && <div style={{ color: T.sage, fontSize: 13 }}>Sent{review.sent ? ` · ${inr(review.sent.grandTotal)}` : ''} (v{review.version}) — you can re-send after changes</div>}</div>
              {review.pendingOrders > 0 && <div role="alert" style={{ color: T.danger, fontSize: 13 }}>{review.pendingOrders} order{review.pendingOrders > 1 ? 's are' : ' is'} still being prepared. Mark them ready/served before sending the bill.</div>}
              <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead><tr style={{ color: T.muted, textAlign: 'left', fontSize: 11.5, letterSpacing: 1 }}><th style={{ padding: '6px 0' }}>ITEM</th><th style={{ textAlign: 'right' }}>QTY</th><th style={{ textAlign: 'right' }}>AMOUNT</th></tr></thead>
                <tbody>{review.items.map((l, i) => <tr key={i} style={{ borderTop: `1px solid ${T.line}`, color: T.text }}><td style={{ padding: '8px 0' }}>{l.name}{l.portion && l.portion !== 'Combo' ? <span style={{ color: T.muted }}> · {l.portion}</span> : l.isCombo ? <span style={{ color: T.gold }}> · Combo</span> : null}</td><td style={{ textAlign: 'right' }}>{l.quantity}</td><td style={{ textAlign: 'right' }}>{inr(l.subtotal)}</td></tr>)}</tbody></table></div>

              <div>
                <div style={{ color: T.muted, fontSize: 11.5, letterSpacing: 1, marginBottom: 8 }}>OFFER / DISCOUNT</div>
                <div style={{ display: 'grid', gap: 8 }} role="radiogroup" aria-label="Offer or discount">
                  <Opt checked={choice === 'none'} onChange={() => setChoice('none')} title="No discount" />
                  {review.eligibleOffers.map(o => <Opt key={o.offerId} checked={choice === o.offerId} onChange={() => setChoice(o.offerId)} title={o.title} right={o.discountExTax > 0 ? `− ${inr(o.discountExTax)}` : 'Free item'} sub={o.note || (o.code ? `Code ${o.code}` : '')} />)}
                  <Opt checked={choice === 'manual'} onChange={() => setChoice('manual')} title="Manual discount" sub="Needs a reason (kept in the audit log)" />
                  {choice === 'manual' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 8 }}>
                      <select style={inp} value={man.type} onChange={e => setMan({ ...man, type: e.target.value })} aria-label="Discount type"><option value="percent">% off</option><option value="flat">₹ off</option></select>
                      <input style={inp} inputMode="decimal" value={man.value} onChange={e => setMan({ ...man, value: e.target.value.replace(/[^0-9.]/g, '') })} placeholder={man.type === 'percent' ? 'e.g. 10' : 'e.g. 50'} aria-label="Discount value" />
                      <input style={{ ...inp, gridColumn: '1 / -1' }} value={man.reason} maxLength={200} onChange={e => setMan({ ...man, reason: e.target.value })} placeholder="Reason (e.g. birthday, service recovery)" aria-label="Reason" />
                    </div>)}
                  {review.discountError && <div role="alert" style={{ color: T.danger, fontSize: 13 }}>{review.discountError}</div>}
                </div>
                {review.ineligibleOffers.length > 0 && <details style={{ marginTop: 10, color: T.muted, fontSize: 12.5 }}><summary style={{ cursor: 'pointer' }}>{review.ineligibleOffers.length} offer{review.ineligibleOffers.length > 1 ? 's' : ''} not applicable</summary><ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>{review.ineligibleOffers.map(o => <li key={o.offerId}>{o.title} — {o.reason}</li>)}</ul></details>}
              </div>

              {p && (
                <div style={{ background: T.card2, borderRadius: 12, padding: 14, display: 'grid', gap: 6, fontSize: 14, color: T.text }}>
                  <Line l="Items" v={inr(p.baseSubtotal)} />
                  {p.discount && <Line l={`Discount · ${p.discount.title || p.discount.reason}`} v={`− ${inr(p.discount.amountExTax)}`} c={T.sage} />}
                  <Line l="Subtotal" v={inr(p.subtotal)} />
                  <Line l={`CGST ${p.cgstPct}%`} v={inr(p.cgst)} muted /><Line l={`SGST ${p.sgstPct}%`} v={inr(p.sgst)} muted />
                  <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 8, marginTop: 4 }}><Line l="Total payable" v={inr(p.grandTotal)} big /></div>
                </div>)}
              {msg && <div role="alert" style={{ color: T.danger, fontSize: 13 }}>{msg}</div>}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" style={btn(true, !canSend)} disabled={!canSend} onClick={send}>{busy === 'send' ? 'Sending…' : review.status === 'sent' ? 'Re-send bill' : 'Send bill'}</button>
                {review.status === 'sent' && onGoBilling && <button type="button" style={btn(false)} onClick={() => onGoBilling(review.tableNumber)}>Open Billing Hub to settle</button>}
                <button type="button" style={btn(false, busy === 'cancel', true)} disabled={busy === 'cancel'} onClick={cancel}>Cancel request</button>
              </div>
            </div>)}
        </div>
      </div>
      <style>{`@media (max-width: 760px){ .px-billreq-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
const Opt = ({ checked, onChange, title, right, sub }) => (
  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, border: `1px solid ${checked ? T.gold : T.line}`, background: checked ? 'rgba(211,191,162,.08)' : 'transparent', cursor: 'pointer' }}>
    <input type="radio" checked={checked} onChange={onChange} style={{ accentColor: T.gold, marginTop: 3 }} />
    <span style={{ flex: 1 }}><span style={{ color: T.text, fontSize: 14 }}>{title}</span>{sub ? <span style={{ display: 'block', color: T.muted, fontSize: 12, marginTop: 2 }}>{sub}</span> : null}</span>
    {right && <span style={{ color: T.sage, fontSize: 13.5, fontWeight: 700 }}>{right}</span>}
  </label>
);
const Line = ({ l, v, muted, big, c }) => <div style={{ display: 'flex', justifyContent: 'space-between', color: c || (muted ? T.muted : T.text), fontSize: big ? 18 : 14, fontWeight: big ? 800 : 400, fontFamily: big ? 'Georgia, serif' : undefined }}><span>{l}</span><span>{v}</span></div>;
