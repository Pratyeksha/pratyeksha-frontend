import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ReceiptText, X, Send, Ban, Tag, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';

const GOLD = '#d3bfa2', GOLD2 = '#8a704d', BG = '#14110c', BORDER = 'rgba(211,191,162,0.28)';
const money = (n) => Number(n || 0).toFixed(2);
const ago = (iso) => { const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000)); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; };
const inp = { background: '#0d0b08', color: '#f7f3eb', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
const btn = (primary, disabled) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', borderRadius: 10, border: primary ? 'none' : `1px solid ${BORDER}`, background: primary ? GOLD : 'transparent', color: primary ? '#14110c' : GOLD, fontWeight: 800, fontSize: 12, letterSpacing: 0.4, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 });

function ReviewModal({ tenantId, request, onClose, onDone, notify }) {
  const [draft, setDraft] = useState(null);
  const [err, setErr] = useState('');
  const [ids, setIds] = useState([]);
  const [promo, setPromo] = useState('');
  const [mType, setMType] = useState('flat');
  const [mValue, setMValue] = useState('');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const base = `${API_BASE_URL}/admin/bill-requests/${encodeURIComponent(tenantId)}/${request.id}`;

  useEffect(() => {
    let alive = true;
    axios.get(`${base}/draft`).then((r) => {
      if (!alive) return;
      const d = r.data; setDraft(d); setPreview({ bill: d.preview, offers: d.offers, pendingOrders: d.pendingOrders });
      const prior = d.request.bill;                                           // re-opening an already sent bill: start from what was sent
      if (prior) { setIds((prior.offers || []).map((o) => o.offerId)); if (prior.manual) { setMType(prior.manual.type); setMValue(String(prior.manual.value)); setNote(prior.manual.note || ''); } }
      else setIds(d.defaultOfferIds || []);
    }).catch((e) => alive && setErr(e?.response?.data?.error || 'Could not load the bill'));
    return () => { alive = false; };
  }, [base]);

  const payload = useCallback(() => ({ appliedOfferIds: ids, promoCode: promo.trim(), manualType: mType, manualValue: Number(mValue) || 0, note }), [ids, promo, mType, mValue, note]);
  // live preview from the server (same calculation as the final send)
  useEffect(() => {
    if (!draft) return undefined;
    const my = ++seq.current;
    const t = setTimeout(() => {
      axios.post(`${base}/preview`, payload()).then((r) => { if (my === seq.current) { setPreview(r.data); setErr(''); } }).catch((e) => { if (my === seq.current) setErr(e?.response?.data?.error || 'Could not calculate the bill'); });
    }, 250);
    return () => clearTimeout(t);
  }, [draft, payload, base]);

  const toggle = (id) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const applyPromo = () => {                                                  // a promo-code offer that becomes eligible is switched on automatically
    axios.post(`${base}/preview`, payload()).then((r) => {
      setPreview(r.data);
      const hit = (r.data.offers || []).filter((o) => o.code && o.eligible && !ids.includes(o.offerId));
      if (hit.length) { setIds((cur) => [...cur, ...hit.map((o) => o.offerId)]); notify && notify(`Promo applied: ${hit[0].title}`); }
      else notify && notify('That code does not apply to this order', 'error');
    }).catch((e) => setErr(e?.response?.data?.error || 'Could not apply the code'));
  };
  const send = async () => {
    if (!preview) return;
    setBusy(true); setErr('');
    try {
      await axios.post(`${base}/send`, { ...payload(), expectedTotal: preview.bill.total });
      notify && notify(`Bill of ₹${money(preview.bill.total)} sent to Table ${request.tableNumber}`);
      onDone();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not send the bill');
      if (e?.response?.data?.code === 'BILL_CHANGED') axios.post(`${base}/preview`, payload()).then((r) => setPreview(r.data)).catch(() => {});
    } finally { setBusy(false); }
  };
  const cancelReq = async () => {
    if (!window.confirm(`Cancel the bill request for Table ${request.tableNumber}? The guest will be asked to speak to staff.`)) return;
    setBusy(true);
    try { await axios.post(`${base}/cancel`); notify && notify('Bill request cancelled'); onDone(); }
    catch (e) { setErr(e?.response?.data?.error || 'Could not cancel'); } finally { setBusy(false); }
  };

  const b = preview?.bill; const offers = preview?.offers || [];
  const row = { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '3px 0' };
  return (
    <div role="dialog" aria-modal="true" aria-label="Review and send bill" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100002, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px,100%)', maxHeight: '94vh', overflowY: 'auto', background: BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 18, color: '#f7f3eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ReceiptText size={20} color={GOLD} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: GOLD }}>REVIEW &amp; SEND BILL</div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Table {request.tableNumber}{request.guestName ? ` · ${request.guestName}` : ''}</div>
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} aria-label="Close" style={{ ...btn(false), padding: 7 }}><X size={16} /></button>
        </div>
        {!draft && !err && <div style={{ padding: 30, textAlign: 'center', color: GOLD }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>}
        {err && <div role="alert" style={{ margin: '10px 0', color: '#e0907a', fontSize: 12.5, display: 'flex', gap: 8 }}><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} /> {err}</div>}
        {draft && b && (
          <>
            {preview.pendingOrders > 0 && <div style={{ margin: '10px 0', padding: '8px 10px', borderRadius: 8, background: 'rgba(224,180,80,0.1)', border: '1px solid rgba(224,180,80,0.4)', color: '#e0c48f', fontSize: 12 }}>⚠ {preview.pendingOrders} order(s) are still being prepared and are NOT on this bill. Wait until they are served, or send now and revise later.</div>}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '8px 12px', margin: '12px 0' }}>
              {b.lines.length === 0 && <div style={{ padding: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>No Ready or Served orders on this table yet.</div>}
              {b.lines.map((l, i) => <div key={i} style={row}><span><b>{l.quantity}×</b> {l.name}{l.portion && l.portion !== 'Single' ? ` (${l.portion})` : ''}{l.comboName ? <i style={{ color: GOLD2 }}> · combo</i> : null}</span><span>{money(l.subtotal)}</span></div>)}
            </div>

            <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.5, color: GOLD2, margin: '14px 0 6px' }}>OFFERS</div>
            {offers.length === 0 && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>This restaurant has no active offers.</div>}
            {offers.map((o) => (
              <label key={o.offerId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 6, borderRadius: 10, border: `1px solid ${o.eligible ? BORDER : 'rgba(255,255,255,0.08)'}`, opacity: o.eligible ? 1 : 0.55, cursor: o.eligible ? 'pointer' : 'default' }}>
                <input type="checkbox" disabled={!o.eligible} checked={o.eligible && ids.includes(o.offerId)} onChange={() => toggle(o.offerId)} />
                <Tag size={14} color={o.eligible ? GOLD : '#777'} />
                <span style={{ flex: 1, fontSize: 13 }}>{o.title}{o.code ? <i style={{ color: GOLD2 }}> · code {o.code}</i> : null}<span style={{ display: 'block', fontSize: 11, color: o.eligible ? '#7fc79a' : 'rgba(255,255,255,0.45)' }}>{o.eligible ? `Saves ₹${money(o.amount)}` : o.reason}</span></span>
              </label>
            ))}
            <div style={{ display: 'flex', gap: 8, margin: '8px 0 4px' }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Promo code (optional)" value={promo} onChange={(e) => setPromo(e.target.value)} />
              <button type="button" style={btn(false, !promo.trim())} disabled={!promo.trim()} onClick={applyPromo}>Apply code</button>
            </div>

            <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.5, color: GOLD2, margin: '14px 0 6px' }}>EXTRA DISCOUNT (OPTIONAL)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select style={inp} value={mType} onChange={(e) => setMType(e.target.value)}><option value="flat">₹ off the bill (incl. tax)</option><option value="percent">% off</option></select>
              <input style={{ ...inp, width: 110 }} type="number" min="0" step="0.01" placeholder="0" value={mValue} onChange={(e) => setMValue(e.target.value)} />
              <input style={{ ...inp, flex: 1, minWidth: 140 }} placeholder="Reason / note (shown to guest)" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', margin: '16px 0', background: 'rgba(211,191,162,0.05)' }}>
              <div style={row}><span>Items total</span><span>₹{money(b.base)}</span></div>
              {b.offers.map((o) => <div key={o.offerId} style={{ ...row, color: '#7fc79a' }}><span>Offer: {o.title}</span><span>−₹{money(o.amount)}</span></div>)}
              {b.manual && b.manual.amount > 0 && <div style={{ ...row, color: '#7fc79a' }}><span>Discount{b.manual.type === 'percent' ? ` (${b.manual.value}%)` : ''}</span><span>−₹{money(b.manual.amount)}</span></div>}
              {b.discountTotal > 0 && <div style={{ ...row, fontWeight: 700 }}><span>Taxable amount</span><span>₹{money(b.subtotal)}</span></div>}
              <div style={{ ...row, color: 'rgba(255,255,255,0.6)' }}><span>CGST @ {b.cgstPct}%</span><span>₹{money(b.cgst)}</span></div>
              <div style={{ ...row, color: 'rgba(255,255,255,0.6)' }}><span>SGST @ {b.sgstPct}%</span><span>₹{money(b.sgst)}</span></div>
              <div style={{ ...row, borderTop: `1px solid ${BORDER}`, marginTop: 6, paddingTop: 10, fontSize: 20, fontWeight: 900, color: GOLD }}><span>Total</span><span>₹{money(b.total)}</span></div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" style={{ ...btn(true, busy || !b.lines.length), flex: 1, minWidth: 180 }} disabled={busy || !b.lines.length} onClick={send}>
                {busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />} {request.status === 'sent' ? 'Send revised bill' : 'Approve & send to guest'}
              </button>
              <button type="button" style={btn(false, busy)} disabled={busy} onClick={cancelReq}><Ban size={14} /> Cancel request</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>The guest sees exactly this bill. When you settle the table, this approved amount is applied automatically.</div>
          </>
        )}
      </div>
    </div>
  );
}

/** Floating "Bills" pill + list. Loads from the database, so requests survive refresh / reconnects. */
export default function BillRequestsPanel({ tenantId, socket, notify }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(null);
  const [, tick] = useState(0);
  const load = useCallback(() => {
    axios.get(`${API_BASE_URL}/admin/bill-requests/${encodeURIComponent(tenantId)}`).then((r) => setList(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [tenantId]);
  useEffect(() => {
    load();
    const evs = ['bill_request_created', 'bill_request_updated', 'bill_sent'];
    evs.forEach((e) => socket.on(e, load));
    socket.on('connect', load);                                             // after a reconnect, fetch what was missed
    const iv = setInterval(load, 30000);
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => { evs.forEach((e) => socket.off(e, load)); socket.off('connect', load); clearInterval(iv); clearInterval(t); };
  }, [socket, load]);

  const waiting = list.filter((r) => r.status === 'requested').length;
  return (
    <>
      {list.length > 0 && (
        <div style={{ position: 'fixed', left: 14, bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))', zIndex: 99990 }}>
          {open && (
            <div style={{ marginBottom: 10, width: 'min(340px, calc(100vw - 28px))', background: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 10, boxShadow: '0 18px 50px rgba(0,0,0,0.6)', maxHeight: '60vh', overflowY: 'auto' }}>
              {list.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderBottom: `1px solid rgba(211,191,162,0.12)` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f7f3eb' }}>Table {r.tableNumber}{r.guestName ? <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}> · {r.guestName}</span> : null}</div>
                    <div style={{ fontSize: 11, color: r.status === 'requested' ? '#e0c48f' : '#7fc79a', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {r.status === 'requested' ? `Waiting ${ago(r.requestedAt)}` : <><CheckCircle2 size={12} /> Sent ₹{money(r.bill?.total)} · awaiting payment</>}
                    </div>
                  </div>
                  <button type="button" style={btn(r.status === 'requested')} onClick={() => { setReview(r); setOpen(false); }}>{r.status === 'requested' ? 'Review' : 'Revise'}</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Bill requests"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 999, border: `1px solid ${BORDER}`, background: waiting ? GOLD : BG, color: waiting ? '#14110c' : GOLD, fontWeight: 900, fontSize: 12.5, letterSpacing: 0.5, cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <ReceiptText size={16} /> Bills ({list.length}){waiting ? ` · ${waiting} waiting` : ''}
          </button>
        </div>
      )}
      {review && <ReviewModal tenantId={tenantId} request={review} notify={notify} onClose={() => setReview(null)} onDone={() => { setReview(null); load(); }} />}
    </>
  );
}
