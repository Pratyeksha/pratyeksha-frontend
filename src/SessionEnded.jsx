import React, { useState } from 'react';
import { ScanLine, CheckCircle2 } from 'lucide-react';
import UpiPay from './UpiPay.jsx';

const GOLD = '#d3bfa2';
const T = {
  en: {
    bill: { h: 'Thank you — your session has ended', p: 'Your bill has been generated, so this table’s menu is now closed.' },
    expired: { h: 'This session has ended', p: 'For your security the menu closes once a visit is over or the page is reopened.' },
    again: 'To order again, please scan the QR code on your table.',
    owed: 'Your bill',
  },
  mr: {
    bill: { h: 'धन्यवाद — तुमचे सत्र संपले आहे', p: 'तुमचे बिल तयार झाले आहे, त्यामुळे या टेबलचा मेनू आता बंद आहे.' },
    expired: { h: 'हे सत्र संपले आहे', p: 'सुरक्षिततेसाठी भेट संपल्यावर किंवा पेज पुन्हा उघडल्यावर मेनू बंद होतो.' },
    again: 'पुन्हा ऑर्डर करण्यासाठी कृपया तुमच्या टेबलवरील QR कोड स्कॅन करा.',
    owed: 'तुमचे बिल',
  },
};

/** Shown instead of the menu once the bill is generated (and after refresh / back / forward). The menu is NOT reachable from here. */
export default function SessionEndedScreen({ language = 'en', reason = 'bill', restaurantName = '', lastBill, billStatus, tenantId, tableNumber, onClaimed }) {
  const tr = T[language] || T.en;
  const copy = reason === 'bill' ? tr.bill : tr.expired;
  const [claimed, setClaimed] = useState(!!lastBill?.claimed);
  // An unpaid bill stays payable here for 6 hours (e.g. the tab was reloaded while the guest was in the UPI app).
  // Only the restaurant-APPROVED amount is ever payable (the pre-approval snapshot total is not).
  const st = billStatus?.status;
  const approved = st === 'sent' && billStatus?.bill && !billStatus.paid;
  const amount = approved ? billStatus.bill.grandTotal : 0;
  const payable = !!(approved && amount > 0 && lastBill?.upi && !claimed && !billStatus.claimed && (Date.now() - (lastBill.createdAt || 0) < 6 * 3600 * 1000));
  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0c', color: '#f7f3eb', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'calc(40px + env(safe-area-inset-top, 0px)) 22px 40px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <img src="/notification-icon.png" alt="" width={64} height={64} style={{ borderRadius: 18, margin: '0 auto 18px', display: 'block' }} />
        {restaurantName && <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: 4, color: 'rgba(211,191,162,0.7)', textTransform: 'uppercase', marginBottom: 10 }}>{restaurantName}</div>}
        <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: '1.5rem', margin: '0 0 10px', lineHeight: 1.25 }}>{copy.h}</h2>
        <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.62)', fontSize: '0.85rem', lineHeight: 1.6 }}>{copy.p}</p>

        {payable && (
          <div style={{ marginBottom: 22 }}>
            <UpiPay amount={amount} payInfo={{ enabled: true, ...lastBill.upi }} note={`Bill T${tableNumber}`} language={language}
              tenantId={tenantId} tableNumber={tableNumber} guestName={lastBill.name} claimed={claimed}
              onClaimed={() => { setClaimed(true); onClaimed && onClaimed(); }} />
          </div>
        )}
        {st === 'requested' && <div role="status" style={{ marginBottom: 22, color: GOLD, fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.5 }}>{language === 'mr' ? 'तुमचे बिल तयार होत आहे… हे पान आपोआप अपडेट होईल.' : 'Your bill is being prepared… this page updates by itself.'}</div>}
        {approved && !payable && !claimed && !billStatus.claimed && <div style={{ marginBottom: 22, color: '#f7f3eb', fontSize: '0.9rem' }}>{language === 'mr' ? 'तुमचे बिल' : 'Your bill'}: <b style={{ color: GOLD }}>₹{Number(amount).toFixed(2)}</b><div style={{ color: 'rgba(255,255,255,.55)', fontSize: '0.75rem', marginTop: 4 }}>{language === 'mr' ? 'कृपया काउंटरवर पेमेंट करा.' : 'Please pay at the counter.'}</div></div>}
        {st === 'settled' && <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: GOLD, fontSize: '0.85rem', fontWeight: 800 }}><CheckCircle2 size={18} /> {language === 'mr' ? 'पेमेंट मिळाले — धन्यवाद!' : 'Payment received — thank you!'}{billStatus.paidAmount != null ? ` ₹${Number(billStatus.paidAmount).toFixed(2)}` : ''}</div>}
        {(claimed || billStatus?.claimed) && st === 'sent' && lastBill && (
          <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: GOLD, fontSize: '0.8rem', fontWeight: 800 }}><CheckCircle2 size={16} /> ₹{Number(amount || lastBill.total).toFixed(2)} · {language === 'mr' ? 'रेस्टॉरंट पेमेंटची पुष्टी करेल' : 'the restaurant will confirm your payment'}</div>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(211,191,162,0.3)', background: 'rgba(211,191,162,0.06)', textAlign: 'left' }}>
          <ScanLine size={22} color={GOLD} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#f7f3eb' }}>{tr.again}</span>
        </div>
      </div>
    </div>
  );
}
