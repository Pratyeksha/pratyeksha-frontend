import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Copy, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';
import { buildUpiLink, appsFor, detectPlatform, formatUpiAmount, roundMoney, makeTxnRef, UPI_ID_RE } from './upi.js';
import UpiLogo from './UpiLogos.jsx';

const GOLD = '#d3bfa2';
const T = {
  en: { title: 'Pay with UPI', sub: 'Tap your app — the amount opens ready for your PIN.', other: 'Other UPI app', paid: "I've paid", sent: 'Staff have been told — they will confirm your payment.',
        copy: 'Copy UPI ID', copied: 'Copied', noOpen: "Didn't open? Choose “Other UPI app”, or pay this UPI ID manually.", scan: 'Scan with any UPI app on your phone',
        amount: 'Amount to pay', checking: 'Sending…', fail: 'Could not notify staff. Please tell them at the counter.', note: 'This is the exact amount on your bill. Show the payment success screen to staff if asked.',
        help: 'Payment failed?', helpTitle: 'Declined, or “limit exceeded”?', helpBody: 'That message comes from your UPI app or bank — not from this restaurant. It is usually a daily or per-payment limit, a limit for a new payee, or a restriction on paying individual UPI IDs. Try another UPI app above, or open your UPI app, choose “Pay to UPI ID” and enter the ID and exact amount below, or pay at the counter by cash or card.', copyAmt: 'Copy amount' },
  mr: { title: 'UPI ने पैसे द्या', sub: 'तुमचे अ‍ॅप निवडा — रक्कम PIN साठी तयार उघडेल.', other: 'इतर UPI अ‍ॅप', paid: 'मी पैसे दिले', sent: 'स्टाफला कळवले आहे — ते तुमचे पेमेंट तपासतील.',
        copy: 'UPI आयडी कॉपी करा', copied: 'कॉपी झाले', noOpen: 'उघडले नाही? “इतर UPI अ‍ॅप” निवडा किंवा हा UPI आयडी वापरून पैसे द्या.', scan: 'तुमच्या फोनवरील कोणत्याही UPI अ‍ॅपने स्कॅन करा',
        amount: 'भरायची रक्कम', checking: 'पाठवत आहे…', fail: 'स्टाफला कळवता आले नाही. कृपया काउंटरवर सांगा.', note: 'हीच तुमच्या बिलावरील अचूक रक्कम आहे. विचारल्यास पेमेंट यशस्वी झाल्याचा स्क्रीन कर्मचाऱ्यांना दाखवा.',
        help: 'पेमेंट अयशस्वी?', helpTitle: 'नाकारले गेले किंवा “limit exceeded”?', helpBody: 'हा संदेश तुमच्या UPI अॅप किंवा बँकेकडून येतो, रेस्टॉरंटकडून नाही — सहसा दैनिक किंवा प्रति-व्यवहार मर्यादा, नवीन पेयीसाठी मर्यादा किंवा वैयक्तिक UPI ID वरील निर्बंधामुळे. वरील दुसरे UPI अॅप वापरून पहा, किंवा अॅपमध्ये “UPI ID वर पेमेंट” निवडून खालील ID आणि अचूक रक्कम टाका, किंवा काउंटरवर रोख/कार्डने भरा.', copyAmt: 'रक्कम कॉपी करा' },
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
  const [showHelp, setShowHelp] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);
  const txnRef = useMemo(() => makeTxnRef(tenantId, tableNumber), [tenantId, tableNumber]);   // one reference per bill, stable across taps
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const amt = roundMoney(amount);
  const ready = !!(payInfo && payInfo.enabled && UPI_ID_RE.test(payInfo.upiId || '') && payInfo.payeeName && Number.isFinite(amt) && amt > 0);
  if (!ready) return null;

  const params = { upiId: payInfo.upiId, payeeName: payInfo.payeeName, amount: amt, note, ref: txnRef, merchantCode: payInfo.merchantCode };
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
            <button key={a.id} type="button" onClick={() => open(a.id)} style={btn} aria-label={`${tr.title}: ${a.label}`}><UpiLogo id={a.id} size={26} /> {a.label}</button>
          ))}
          <button type="button" onClick={() => open('any')} style={{ ...btn, gridColumn: '1 / -1', background: 'transparent' }}><UpiLogo id="any" size={26} /> {tr.other}</button>
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
      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => setShowHelp(v => !v)} aria-expanded={showHelp} style={{ background: 'none', border: 'none', padding: 0, color: '#e0c48f', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>{tr.help}</button>
        {showHelp && (
          <div role="note" style={{ marginTop: 8, padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(211,191,162,0.2)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f7f3eb', marginBottom: 6 }}>{tr.helpTitle}</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{tr.helpBody}</div>
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(formatUpiAmount(amt)); setCopiedAmt(true); setTimeout(() => setCopiedAmt(false), 1800); } catch { /* clipboard blocked */ } }} style={{ ...btn, padding: '8px 12px', fontSize: '0.68rem', background: 'transparent', marginTop: 10 }}>{copiedAmt ? <Check size={13} /> : <Copy size={13} />} {copiedAmt ? tr.copied : `${tr.copyAmt} · ${formatUpiAmount(amt)}`}</button>
          </div>)}
      </div>
      {err && <div role="alert" style={{ marginTop: 8, fontSize: '0.7rem', color: '#d9907a' }}>{err}</div>}
      <div style={{ marginTop: 10, fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{tr.note}</div>
    </div>
  );
}
