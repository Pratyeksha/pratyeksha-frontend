import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ScanLine, Printer } from 'lucide-react';
import UpiPay from './UpiPay.jsx';
import { useBillStatus, BillWaitingScreen, ApprovedBillCard, SettledNote } from './billFlow.jsx';
import { API_BASE_URL } from './apiBase.js';

const GOLD = '#d3bfa2';
const T = {
  en: {
    bill: { h: 'Thank you — your session has ended', p: 'Your bill has been generated, so this table’s menu is now closed.' },
    expired: { h: 'This session has ended', p: 'For your security the menu closes once a visit is over or the page is reopened.' },
    again: 'To order again, please scan the QR code on your table.',
    pdf: 'Save bill as PDF',
  },
  mr: {
    bill: { h: 'धन्यवाद — तुमचे सत्र संपले आहे', p: 'तुमचे बिल तयार झाले आहे, त्यामुळे या टेबलचा मेनू आता बंद आहे.' },
    expired: { h: 'हे सत्र संपले आहे', p: 'सुरक्षिततेसाठी भेट संपल्यावर किंवा पेज पुन्हा उघडल्यावर मेनू बंद होतो.' },
    again: 'पुन्हा ऑर्डर करण्यासाठी कृपया तुमच्या टेबलवरील QR कोड स्कॅन करा.',
    pdf: 'बिल PDF म्हणून सेव्ह करा',
  },
};

/**
 * Shown instead of the menu once the bill is generated (and after refresh / back / forward). The menu is NOT reachable from here.
 * It also restores the guest's bill: waiting for the operator, or the exact approved bill with UPI payment. Read from the server,
 * so it is identical after any refresh or reconnect.
 */
export default function SessionEndedScreen({ language = 'en', reason = 'bill', restaurantName = '', lastBill, tenantId, tableNumber, onClaimed }) {
  const tr = T[language] || T.en;
  const copy = reason === 'bill' ? tr.bill : tr.expired;
  const { request } = useBillStatus({ tenantId, tableNumber, enabled: true });
  const [payInfo, setPayInfo] = useState(null);
  const [claimed, setClaimed] = useState(!!lastBill?.claimed);
  useEffect(() => {
    let alive = true;
    axios.get(`${API_BASE_URL}/payment-info/${encodeURIComponent(tenantId)}`).then((r) => { if (alive) setPayInfo(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [tenantId]);

  if (request && request.status === 'requested') return <BillWaitingScreen language={language} restaurantName={restaurantName} requestedAt={request.requestedAt} />;
  if (request && request.status === 'cancelled') return <BillWaitingScreen language={language} restaurantName={restaurantName} requestedAt={request.requestedAt} cancelled />;

  const bill = request && (request.status === 'sent' || request.status === 'settled') ? request.bill : null;
  const payable = bill && request.status === 'sent' && bill.total > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0c', color: '#f7f3eb', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'calc(40px + env(safe-area-inset-top, 0px)) 22px 40px', boxSizing: 'border-box' }}>
      <style>{`@media print{body *{visibility:hidden}#approved-bill-print,#approved-bill-print *{visibility:visible}#approved-bill-print{position:absolute;left:0;top:0;width:100%;box-shadow:none!important}}`}</style>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <img src="/notification-icon.png" alt="" width={64} height={64} style={{ borderRadius: 18, margin: '0 auto 18px', display: 'block' }} />
        {restaurantName && <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: 4, color: 'rgba(211,191,162,0.7)', textTransform: 'uppercase', marginBottom: 10 }}>{restaurantName}</div>}
        {request && request.status === 'settled'
          ? <div style={{ marginBottom: 20 }}><SettledNote language={language} total={bill?.total} /></div>
          : <><h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: '1.5rem', margin: '0 0 10px', lineHeight: 1.25 }}>{copy.h}</h2>
              <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.62)', fontSize: '0.85rem', lineHeight: 1.6 }}>{copy.p}</p></>}

        {bill && (
          <div style={{ marginBottom: 20 }}>
            <ApprovedBillCard bill={bill} language={language} restaurantName={restaurantName} />
            <button type="button" onClick={() => window.print()} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.35)', background: 'transparent', color: GOLD, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}><Printer size={15} /> {tr.pdf}</button>
          </div>
        )}
        {payable && (
          <div style={{ marginBottom: 22 }}>
            <UpiPay amount={bill.total} payInfo={payInfo} note={`Bill T${tableNumber}`} language={language} tenantId={tenantId} tableNumber={tableNumber} txnSeed={request.id}
              guestName={request.guestName || lastBill?.name} claimed={claimed} onClaimed={() => { setClaimed(true); onClaimed && onClaimed(); }} />
          </div>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(211,191,162,0.3)', background: 'rgba(211,191,162,0.06)', textAlign: 'left' }}>
          <ScanLine size={22} color={GOLD} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#f7f3eb' }}>{tr.again}</span>
        </div>
      </div>
    </div>
  );
}
