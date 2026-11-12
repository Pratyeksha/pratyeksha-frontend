import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ReceiptText, CheckCircle2, Hourglass, Sparkles } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';

const GOLD = '#d3bfa2';
const money = (n) => Number(n || 0).toFixed(2);
const same = (a, b) => !!a && !!b && a.id === b.id && a.status === b.status && String(a.sentAt) === String(b.sentAt) && (a.bill?.revision || 0) === (b.bill?.revision || 0);

/**
 * The guest's bill request, kept in sync with the server. Because it is read from the database (bound to this phone),
 * a refresh, a reconnect or a reopened tab shows exactly the same state. Polls fast while waiting for the operator.
 */
export function useBillStatus({ tenantId, tableNumber, enabled, seed = null }) {
  const [request, setRequest] = useState(seed);
  const statusRef = useRef(seed?.status || '');
  useEffect(() => { if (seed) setRequest((r) => (r && r.id === seed.id ? r : seed)); }, [seed]);
  useEffect(() => { statusRef.current = request?.status || ''; }, [request]);
  useEffect(() => {
    if (!enabled || !tenantId || !tableNumber) return undefined;
    let stop = false, timer = null;
    const tick = async () => {
      clearTimeout(timer);
      try {
        const r = await axios.get(`${API_BASE_URL}/bill-requests/status/${encodeURIComponent(tenantId)}/${encodeURIComponent(tableNumber)}`);
        const next = r.data && r.data.request;
        if (!stop && next) setRequest((prev) => (same(prev, next) ? prev : next));
      } catch { /* offline: keep what we have, try again */ }
      if (stop) return;
      const s = statusRef.current;
      if (s === 'settled' || s === 'cancelled') return;                       // nothing more can change
      timer = setTimeout(tick, document.hidden ? 15000 : s === 'requested' || s === '' ? 3000 : 8000);   // while 'sent', still pick up a revised bill
    };
    const onVis = () => { if (!document.hidden) tick(); };
    tick();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', tick);
    return () => { stop = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', tick); };
  }, [enabled, tenantId, tableNumber]);
  return { request };
}

const T = {
  en: { h: 'Preparing your bill', p: 'Our team is reviewing your order and applying any offers you are eligible for. Your final bill appears here the moment it is approved.', keep: 'Please keep this page open. If you refresh, you will come straight back to this screen.',
        s1: 'Bill requested', s2: 'Staff reviewing your order', s3: 'Final bill ready', wait: 'Waiting', cancelledH: 'Please speak to our staff', cancelledP: 'The restaurant needs a moment to prepare your bill. A member of staff will be with you shortly.',
        settledH: 'Payment received', settledP: 'Thank you for dining with us. We hope to see you again soon.' },
  mr: { h: 'तुमचे बिल तयार होत आहे', p: 'आमची टीम तुमची ऑर्डर तपासत आहे आणि तुम्हाला लागू असलेल्या ऑफर्स लावत आहे. अंतिम बिल मंजूर होताच येथे दिसेल.', keep: 'कृपया हे पेज उघडे ठेवा. रिफ्रेश केल्यास तुम्ही थेट याच स्क्रीनवर परत याल.',
        s1: 'बिल मागितले', s2: 'स्टाफ ऑर्डर तपासत आहे', s3: 'अंतिम बिल तयार', wait: 'प्रतीक्षा', cancelledH: 'कृपया आमच्या स्टाफशी बोला', cancelledP: 'रेस्टॉरंटला तुमचे बिल तयार करण्यासाठी थोडा वेळ हवा आहे. आमचा कर्मचारी लवकरच येईल.',
        settledH: 'पेमेंट मिळाले', settledP: 'आमच्यासोबत जेवल्याबद्दल धन्यवाद. पुन्हा भेटूया.' },
};

/** Premium waiting screen shown until the operator approves and sends the bill. No amount is shown: nothing here is final. */
export function BillWaitingScreen({ language = 'en', restaurantName = '', requestedAt, cancelled = false }) {
  const tr = T[language] || T.en;
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const start = requestedAt ? new Date(requestedAt).getTime() : Date.now();
    const tick = () => setSecs(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, [requestedAt]);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(120% 80% at 50% 0%, #1b1710 0%, #0b0b0c 55%)', color: '#f7f3eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(36px + env(safe-area-inset-top, 0px)) 24px 36px', boxSizing: 'border-box' }}>
      <style>{`@keyframes pxbwSpin{to{transform:rotate(360deg)}}@keyframes pxbwPulse{0%,100%{opacity:.45;transform:scale(.96)}50%{opacity:1;transform:scale(1.04)}}@keyframes pxbwFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.pxbw *{animation:none!important}}`}</style>
      <div className="pxbw" style={{ width: '100%', maxWidth: 400, textAlign: 'center', animation: 'pxbwFade .6s ease both' }}>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 28px' }}>
          {!cancelled && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(211,191,162,0.18)', borderTopColor: GOLD, animation: 'pxbwSpin 2.2s linear infinite' }} />}
          <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: cancelled ? 'none' : 'pxbwPulse 2.4s ease-in-out infinite' }}>
            {cancelled ? <Hourglass size={38} color={GOLD} /> : <ReceiptText size={38} color={GOLD} />}
          </div>
        </div>
        {restaurantName && <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: 4, color: 'rgba(211,191,162,0.7)', textTransform: 'uppercase', marginBottom: 12 }}>{restaurantName}</div>}
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: '1.6rem', lineHeight: 1.25, margin: '0 0 12px' }}>{cancelled ? tr.cancelledH : tr.h}</h1>
        <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.62)', fontSize: '0.88rem', lineHeight: 1.65 }}>{cancelled ? tr.cancelledP : tr.p}</p>
        {!cancelled && (
          <>
            <div style={{ textAlign: 'left', padding: '16px 18px', borderRadius: 18, border: '1px solid rgba(211,191,162,0.25)', background: 'rgba(211,191,162,0.05)' }}>
              {[[tr.s1, true], [tr.s2, false], [tr.s3, false]].map(([line, done], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', opacity: done || i === 1 ? 1 : 0.45 }}>
                  {done ? <CheckCircle2 size={18} color={GOLD} /> : i === 1 ? <Sparkles size={18} color={GOLD} style={{ animation: 'pxbwPulse 1.6s ease-in-out infinite' }} /> : <span style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid rgba(211,191,162,0.4)' }} />}
                  <span style={{ fontSize: '0.85rem' }}>{line}</span>
                  {i === 1 && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: GOLD, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>}
                </div>
              ))}
            </div>
            <p style={{ margin: '18px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.74rem', lineHeight: 1.6 }}>{tr.keep}</p>
          </>
        )}
      </div>
    </div>
  );
}

export const SettledNote = ({ language = 'en', total }) => {
  const tr = T[language] || T.en;
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <CheckCircle2 size={40} color={GOLD} />
      <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', margin: '10px 0 6px' }}>{tr.settledH}</div>
      {total != null && <div style={{ color: GOLD, fontWeight: 800 }}>₹{money(total)}</div>}
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: 6 }}>{tr.settledP}</div>
    </div>
  );
};

/** The exact bill the operator approved: items, offers, discount, taxes, total. Light card so it prints / saves to PDF cleanly. */
export function ApprovedBillCard({ bill, language = 'en', restaurantName = '', id = 'approved-bill-print' }) {
  if (!bill) return null;
  const mr = language === 'mr';
  const row = { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.84rem', marginBottom: 7 };
  return (
    <div id={id} style={{ background: '#fffdf8', color: '#14110c', borderRadius: 18, padding: '22px 20px', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', textAlign: 'left' }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: 3, color: '#8a704d' }}>{mr ? 'अंतिम बिल' : 'FINAL BILL'}</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: 700, marginTop: 4 }}>{restaurantName || bill.restaurant || ''}</div>
        <div style={{ fontSize: '0.7rem', color: '#6b6258', marginTop: 2 }}>{mr ? 'टेबल' : 'Table'} {bill.tableNumber}{bill.approvedAt ? ` · ${new Date(bill.approvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}</div>
      </div>
      <div style={{ borderTop: '1px solid #e4dccf', borderBottom: '1px solid #e4dccf', padding: '12px 0', marginBottom: 12 }}>
        {bill.lines.map((l, i) => (
          <div key={i} style={{ ...row, marginBottom: 9 }}>
            <span style={{ minWidth: 0 }}>
              <b>{l.quantity}×</b> {mr ? (l.name_mr || l.name) : l.name}{l.portion && l.portion !== 'Single' ? ` (${l.portion})` : ''}
              {l.comboName ? <span style={{ display: 'block', fontSize: '0.64rem', color: '#8a704d' }}>{mr ? 'कॉम्बो' : 'Combo'}: {l.comboName}</span> : null}
            </span>
            <b style={{ flexShrink: 0 }}>{money(l.subtotal)}</b>
          </div>
        ))}
      </div>
      <div style={row}><span>{mr ? 'वस्तूंची एकूण किंमत' : 'Items total'}</span><span>{money(bill.base)}</span></div>
      {(bill.offers || []).map((o, i) => <div key={i} style={{ ...row, color: '#2f7a46' }}><span>{mr ? 'ऑफर' : 'Offer'}: {o.title}</span><span>−{money(o.amount)}</span></div>)}
      {bill.manual && bill.manual.amount > 0 && <div style={{ ...row, color: '#2f7a46' }}><span>{mr ? 'सवलत' : 'Discount'}{bill.manual.type === 'percent' ? ` (${bill.manual.value}%)` : ''}{bill.manual.note ? ` – ${bill.manual.note}` : ''}</span><span>−{money(bill.manual.amount)}</span></div>}
      {bill.discountTotal > 0 && <div style={{ ...row, fontWeight: 700 }}><span>{mr ? 'करपात्र रक्कम' : 'Taxable amount'}</span><span>{money(bill.subtotal)}</span></div>}
      <div style={{ ...row, color: '#6b6258' }}><span>CGST @ {bill.cgstPct}%</span><span>{money(bill.cgst)}</span></div>
      <div style={{ ...row, color: '#6b6258' }}><span>SGST @ {bill.sgstPct}%</span><span>{money(bill.sgst)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '2px solid #14110c', paddingTop: 12, marginTop: 8 }}>
        <span style={{ fontWeight: 800, letterSpacing: 1 }}>{mr ? 'एकूण' : 'GRAND TOTAL'}</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>₹{money(bill.total)}</span>
      </div>
    </div>
  );
}
