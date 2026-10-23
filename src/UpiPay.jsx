import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Copy, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';
import { buildUpiLink, appsFor, detectPlatform, formatUpiAmount, roundMoney, UPI_ID_RE } from './upi.js';

const GOLD = '#d3bfa2';
const T = {
  en: { title: 'Pay with UPI', sub: 'Tap your app — the amount opens ready for your PIN.', other: 'Other UPI app', paid: "I've paid", sent: 'Staff have been told — they will confirm your payment.',
        copy: 'Copy UPI ID', copied: 'Copied', noOpen: "Didn't open? Choose “Other UPI app”, or pay this UPI ID manually.", scan: 'Scan with any UPI app on your phone',
        amount: 'Amount to pay', checking: 'Sending…', fail: 'Could not notify staff. Please tell them at the counter.', note: 'Show the payment success screen to staff if asked. A discount applied by staff will be adjusted at the counter.' },
  mr: { title: 'UPI ने पैसे द्या', sub: 'तुमचे अ‍ॅप निवडा — रक्कम PIN साठी तयार उघडेल.', other: 'इतर UPI अ‍ॅप', paid: 'मी पैसे दिले', sent: 'स्टाफला कळवले आहे — ते तुमचे पेमेंट तपासतील.',
        copy: 'UPI आयडी कॉपी करा', copied: 'कॉपी झाले', noOpen: 'उघडले नाही? “इतर UPI अ‍ॅप” निवडा किंवा हा UPI आयडी वापरून पैसे द्या.', scan: 'तुमच्या फोनवरील कोणत्याही UPI अ‍ॅपने स्कॅन करा',
        amount: 'भरायची रक्कम', checking: 'पाठवत आहे…', fail: 'स्टाफला कळवता आले नाही. कृपया काउंटरवर सांगा.', note: 'स्टाफने विचारल्यास पेमेंट यशस्वी स्क्रीन दाखवा. स्टाफने सवलत दिल्यास ती काउंटरवर समायोजित केली जाईल.' },
};

/**
 * Pay-by-UPI block. `payInfo` = { enabled, upiId, payeeName } from the restaurant (set in the Owner app).
 * `onClaimed` is called after the guest says "I've paid" and the operator has been alerted.
 */
export default function UpiPay({ amount, payInfo, note, language = 'en', tenantId, tableNumber, guestName, claimed = false, onClaimed }) {
  const tr = T[language] || T.en;
  const platform = useMemo(() => detectPlatform(), []);
  const [tapped, setTapped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const hintTimer = useRef(null);
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const amt = roundMoney(amount);
  const ready = !!(payInfo && payInfo.enabled && UPI_ID_RE.test(payInfo.upiId || '') && payInfo.payeeName && Number.isFinite(amt) && amt > 0);
  if (!ready) return null;

  const params = { upiId: payInfo.upiId, payeeName: payInfo.payeeName, amount: amt, note };
  let genericLink = '';
  try { genericLink = buildUpiLink('any', params, platform); } catch { return null; }

  const open = (appId) => {
    let link;
    try { link = buildUpiLink(appId, params, platform); } catch { return; }
    setTapped(true); setShowHint(false);
    clearTimeout(hintTimer.current);
    // If the app opened, this page goes to the background. If we are still visible a moment later, the app did not open.
    hintTimer.current = setTimeout(() => { if (!document.hidden) setShowHint(true); }, 2500);
    window.location.href = link;
  };
  const copyId = async () => {
    try { await navigator.clipboard.writeText(payInfo.upiId); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };
  const claim = async () => {
    setBusy(true); setErr('');
    try {
      await axios.post(`${API_BASE_URL}/payments/upi-claim`, { tenantId, tableNumber, amount: amt, name: guestName || '' });
      onClaimed && onClaimed();
    } catch (e) { setErr(e?.response?.data?.error || tr.fail); }
    finally { setBusy(false); }
  };

  const btn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 10px', borderRadius: 14, border: '1px solid rgba(211,191,162,0.35)', background: 'rgba(211,191,162,0.08)', color: '#f7f3eb', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: 16, borderRadius: 18, border: '1px solid rgba(211,191,162,0.3)', background: 'linear-gradient(160deg, rgba(211,191,162,0.1), rgba(211,191,162,0.03))', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.62rem', fontWeight: 900, letterSpacing: 2, color: GOLD, textTransform: 'uppercase' }}><Smartphone size={14} /> {tr.title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, margin: '10px 0 4px' }}>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{tr.amount} · {payInfo.payeeName}</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>₹{formatUpiAmount(amt)}</span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>{tr.sub}</div>

      {platform === 'desktop' ? (
        <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
          <div style={{ display: 'inline-block', background: '#fff', padding: 10, borderRadius: 12 }}><QRCodeSVG value={genericLink} size={168} level="M" /></div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{tr.scan}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {appsFor(platform).map((a) => (
            <button key={a.id} type="button" onClick={() => open(a.id)} style={btn}>{a.label}</button>
          ))}
          <button type="button" onClick={() => open('any')} style={{ ...btn, gridColumn: '1 / -1', background: 'transparent' }}>{tr.other}</button>
        </div>
      )}

      {showHint && <div role="status" style={{ marginTop: 10, fontSize: '0.7rem', color: '#e0c48f', lineHeight: 1.5 }}>{tr.noOpen}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={copyId} style={{ ...btn, padding: '8px 12px', fontSize: '0.68rem', background: 'transparent' }}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? tr.copied : tr.copy}
        </button>
        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>{payInfo.upiId}</span>
      </div>

      {claimed ? (
        <div role="status" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontSize: '0.78rem', fontWeight: 800 }}><CheckCircle2 size={16} /> {tr.sent}</div>
      ) : (
        (tapped || platform === 'desktop') && (
          <button type="button" disabled={busy} onClick={claim} style={{ ...btn, width: '100%', marginTop: 14, background: GOLD, color: '#14110c', border: 'none' }}>
            {busy ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {tr.checking}</> : <><CheckCircle2 size={16} /> {tr.paid}</>}
          </button>
        )
      )}
      {err && <div role="alert" style={{ marginTop: 8, fontSize: '0.7rem', color: '#d9907a' }}>{err}</div>}
      <div style={{ marginTop: 10, fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{tr.note}</div>
    </div>
  );
}
