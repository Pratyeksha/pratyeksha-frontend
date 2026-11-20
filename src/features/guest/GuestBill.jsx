import React from 'react';
import { Clock3, CheckCircle2 } from 'lucide-react';

/* Guest-side bill status: shows what the restaurant has actually approved. Nothing here is computed on the phone —
   every number is the server's approved bill (items, discount, CGST/SGST, total) or the authoritative paid state. */
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const GOLD = '#8a704d';

export default function GuestBillTotals({ status, language = 'en' }) {
  const mr = language === 'mr';
  const s = status?.status;
  if (s === 'requested' || !status || s === 'none') {
    return (
      <div role="status" aria-live="polite" style={{ padding: '18px 14px', margin: '14px 0', borderRadius: 12, background: '#faf6ee', border: '1px dashed #cdb892', color: '#3b3226', textAlign: 'center' }}>
        <Clock3 size={22} color={GOLD} style={{ marginBottom: 6 }} />
        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{mr ? 'बिल तयार होत आहे' : 'Your bill is being prepared'}</div>
        <div style={{ fontSize: '0.78rem', marginTop: 4, color: '#6b5d47', lineHeight: 1.5 }}>{mr ? 'रेस्टॉरंट ऑफर्स आणि कर तपासून बिल पाठवेल. हे पान आपोआप अपडेट होईल.' : 'The restaurant is applying any offers and taxes. This page updates by itself the moment your bill is ready.'}</div>
      </div>
    );
  }
  const b = status.bill;
  if (!b) return null;
  return (
    <>
      <div style={{ padding: '15px 0', fontSize: '0.85rem', color: '#000', borderBottom: '2px solid #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>{mr ? 'वस्तूंची एकूण रक्कम' : 'Items'}</span><span>{inr(b.baseSubtotal)}</span></div>
        {b.discount && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#2f6b3a', fontWeight: 700 }}><span>{mr ? 'सवलत' : 'Discount'} · {b.discount.title || b.discount.reason}</span><span>− {inr(b.discount.amountExTax)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Subtotal</span><span>{inr(b.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>CGST ({b.cgstPct}%)</span><span>{inr(b.cgst)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST ({b.sgstPct}%)</span><span>{inr(b.sgst)}</span></div>
      </div>
      <div style={{ marginTop: 15, fontWeight: 900, fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}><span>{status.paid ? (mr ? 'भरलेली रक्कम' : 'PAID') : 'GRAND TOTAL'}</span><span>{inr(status.paid && status.paidAmount != null ? status.paidAmount : b.grandTotal)}</span></div>
      {status.paid && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#2f6b3a', fontWeight: 800, fontSize: '0.85rem' }}><CheckCircle2 size={18} /> {mr ? 'पेमेंट मिळाले — धन्यवाद!' : 'Payment received by the restaurant — thank you!'}{status.billNo ? ` · Bill #${status.billNo}` : ''}</div>}
    </>
  );
}
