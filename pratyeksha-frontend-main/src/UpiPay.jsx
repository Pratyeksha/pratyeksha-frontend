import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Copy, Check, CheckCircle2, Loader2, XCircle, HelpCircle } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';
import { buildUpiLink, appsFor, detectPlatform, formatUpiAmount, roundMoney, UPI_ID_RE } from './upi.js';
import { UPI_LOGOS } from './upiLogos.js';

const GOLD = '#d3bfa2';
const T = {
  en: { title: 'Pay with UPI', sub: 'Tap your app. It opens with the amount ready; you only enter your PIN.', other: 'Other UPI app', copy: 'Copy UPI ID', copied: 'Copied',
        noOpen: 'Did not open? Choose “Other UPI app”, or pay this UPI ID manually.', scan: 'Scan with any UPI app on your phone', amount: 'Amount to pay',
        q: 'Did your payment go through?', yes: 'Yes, I paid', no: 'It failed', unsure: 'Not sure', sent: 'Staff have been told. They will confirm your payment.', sending: 'Sending…',
        fail: 'Could not notify staff. Please tell them at the counter.', note: 'Staff confirm every payment before closing your table.',
        whyH: 'What did your UPI app say?', r_limit: 'Limit exceeded', r_declined: 'Declined / bank error', r_noopen: 'The app did not open', r_other: 'Something else',
        h_limit: 'This limit is set by your UPI app, your bank or the restaurant’s UPI account, not by this bill. Try a different UPI app or bank account, or ask staff to take payment at the counter.',
        h_declined: 'Your bank or UPI app declined it. Check your balance and PIN, try again, or use another app or account. Staff can also take payment at the counter.',
        h_noopen: 'Choose “Other UPI app” to pick from the apps on your phone, or copy the UPI ID and pay manually.',
        h_other: 'Please try another UPI app, or ask staff to take payment at the counter.',
        reported: 'Staff have been told about the problem.', tryAgain: 'Try another way', unsureH: 'Check your UPI app’s payment history. If the money left your account, tap “Yes, I paid”.' },
  mr: { title: 'UPI ने पैसे द्या', sub: 'तुमचे अ‍ॅप निवडा. रक्कम तयार उघडते; तुम्ही फक्त PIN टाका.', other: 'इतर UPI अ‍ॅप', copy: 'UPI आयडी कॉपी करा', copied: 'कॉपी झाले',
        noOpen: 'उघडले नाही? “इतर UPI अ‍ॅप” निवडा किंवा हा UPI आयडी वापरून पैसे द्या.', scan: 'तुमच्या फोनवरील कोणत्याही UPI अ‍ॅपने स्कॅन करा', amount: 'भरायची रक्कम',
        q: 'तुमचे पेमेंट झाले का?', yes: 'हो, पैसे दिले', no: 'अयशस्वी झाले', unsure: 'खात्री नाही', sent: 'स्टाफला कळवले आहे. ते तुमचे पेमेंट तपासतील.', sending: 'पाठवत आहे…',
        fail: 'स्टाफला कळवता आले नाही. कृपया काउंटरवर सांगा.', note: 'टेबल बंद करण्यापूर्वी स्टाफ प्रत्येक पेमेंट तपासतात.',
        whyH: 'तुमच्या UPI अ‍ॅपने काय सांगितले?', r_limit: 'मर्यादा ओलांडली', r_declined: 'नाकारले / बँक त्रुटी', r_noopen: 'अ‍ॅप उघडले नाही', r_other: 'दुसरे काही',
        h_limit: 'ही मर्यादा तुमचे UPI अ‍ॅप, तुमची बँक किंवा रेस्टॉरंटचे UPI खाते ठरवते, या बिलाने नाही. दुसरे UPI अ‍ॅप किंवा बँक खाते वापरा, किंवा काउंटरवर पेमेंट घेण्यास स्टाफला सांगा.',
        h_declined: 'तुमच्या बँकेने किंवा UPI अ‍ॅपने नाकारले. शिल्लक आणि PIN तपासा, पुन्हा प्रयत्न करा किंवा दुसरे अ‍ॅप वापरा. स्टाफ काउंटरवरही पेमेंट घेऊ शकतात.',
        h_noopen: '“इतर UPI अ‍ॅप” निवडा किंवा UPI आयडी कॉपी करून स्वतः पैसे द्या.', h_other: 'कृपया दुसरे UPI अ‍ॅप वापरा किंवा काउंटरवर पेमेंट घेण्यास स्टाफला सांगा.',
        reported: 'स्टाफला समस्येची माहिती दिली आहे.', tryAgain: 'दुसरा मार्ग वापरा', unsureH: 'तुमच्या UPI अ‍ॅपचा पेमेंट इतिहास पाहा. पैसे खात्यातून गेले असतील तर “हो, पैसे दिले” दाबा.' },
};

const Logo = ({ id, size = 30 }) => {
  const l = UPI_LOGOS[id];
  if (!l) return <Smartphone size={size - 8} color="#14110c" />;
  return <svg viewBox="0 0 24 24" width={size - 6} height={size - 6} role="img" aria-label={l.title}><path d={l.path} fill={l.hex} /></svg>;
};

/**
 * Pay-by-UPI block. `payInfo` = { enabled, upiId, payeeName, merchant, mcc } from the restaurant (Owner app > Settings).
 * A UPI link cannot report back whether the payment succeeded, so after the guest returns we ASK, and we tell the operator what really
 * happened (paid / failed and why). A genuine provider failure (for example "limit exceeded") is shown and reported, never hidden.
 */
export default function UpiPay({ amount, payInfo, note, language = 'en', tenantId, tableNumber, guestName, claimed = false, onClaimed, txnSeed = 'bill' }) {
  const tr = T[language] || T.en;
  const platform = useMemo(() => detectPlatform(), []);
  const [tapped, setTapped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [step, setStep] = useState('ask');            // ask | failed | unsure | reported
  const [reason, setReason] = useState('');
  const hintTimer = useRef(null);
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const amt = roundMoney(amount);
  const ready = !!(payInfo && payInfo.enabled && UPI_ID_RE.test(payInfo.upiId || '') && payInfo.payeeName && Number.isFinite(amt) && amt > 0);
  if (!ready) return null;

  const merchant = payInfo.merchant === true;
  const paramsFor = () => ({
    upiId: payInfo.upiId, payeeName: payInfo.payeeName, amount: amt, note,
    ...(merchant ? { merchantCode: payInfo.mcc || '5812', txnRef: `PX${String(txnSeed).replace(/[^A-Za-z0-9]/g, '').slice(-10)}${Date.now().toString(36)}`.slice(0, 35) } : {}),
  });
  let genericLink = '';
  try { genericLink = buildUpiLink('any', { ...paramsFor() }, platform); } catch { return null; }

  const open = (appId) => {
    let link;
    try { link = buildUpiLink(appId, paramsFor(), platform); } catch { return; }
    setTapped(true); setShowHint(false); setStep('ask'); setReason('');
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => { if (!document.hidden) setShowHint(true); }, 2500);   // still visible => the app did not open
    window.location.href = link;
  };
  const copyId = async () => { try { await navigator.clipboard.writeText(payInfo.upiId); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* blocked */ } };
  const post = async (path, body) => {
    setBusy(true); setErr('');
    try { await axios.post(`${API_BASE_URL}/payments/${path}`, { tenantId, tableNumber, amount: amt, name: guestName || '', ...body }); return true; }
    catch (e) { setErr(e?.response?.data?.error || tr.fail); return false; }
    finally { setBusy(false); }
  };
  const claim = async () => { if (await post('upi-claim', {})) onClaimed && onClaimed(); };
  const report = async (r) => { setReason(r); if (await post('upi-failed', { reason: r })) setStep('reported'); };

  const tile = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(211,191,162,0.35)', background: 'rgba(211,191,162,0.08)', color: '#f7f3eb', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' };
  const plain = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 10px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.35)', background: 'transparent', color: '#f7f3eb', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' };
  const hint = { h_limit: tr.h_limit, h_declined: tr.h_declined, h_noopen: tr.h_noopen, h_other: tr.h_other };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: 16, borderRadius: 18, border: '1px solid rgba(211,191,162,0.3)', background: 'linear-gradient(160deg, rgba(211,191,162,0.1), rgba(211,191,162,0.03))', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.62rem', fontWeight: 900, letterSpacing: 2, color: GOLD, textTransform: 'uppercase' }}><Smartphone size={14} /> {tr.title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, margin: '10px 0 4px' }}>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{tr.amount} · {payInfo.payeeName}</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>₹{formatUpiAmount(amt)}</span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>{tr.sub}</div>

      {claimed ? (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontSize: '0.8rem', fontWeight: 800 }}><CheckCircle2 size={17} /> {tr.sent}</div>
      ) : (
        <>
          {platform === 'desktop' ? (
            <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
              <div style={{ display: 'inline-block', background: '#fff', padding: 10, borderRadius: 12 }}><QRCodeSVG value={genericLink} size={168} level="M" /></div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{tr.scan}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {appsFor(platform).map((a) => (
                <button key={a.id} type="button" onClick={() => open(a.id)} style={tile} aria-label={`${a.label}`}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Logo id={a.id} /></span>{a.label}
                </button>
              ))}
              <button type="button" onClick={() => open('any')} style={{ ...tile, background: 'transparent' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Smartphone size={18} color="#14110c" /></span>{tr.other}
              </button>
            </div>
          )}
          {showHint && <div role="status" style={{ marginTop: 10, fontSize: '0.7rem', color: '#e0c48f', lineHeight: 1.5 }}>{tr.noOpen}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={copyId} style={{ ...plain, padding: '8px 12px', fontSize: '0.68rem' }}>{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? tr.copied : tr.copy}</button>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>{payInfo.upiId}</span>
          </div>

          {(tapped || platform === 'desktop') && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(211,191,162,0.2)' }}>
              {step === 'ask' && (
                <>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 10 }}>{tr.q}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <button type="button" disabled={busy} onClick={claim} style={{ ...plain, background: GOLD, color: '#14110c', border: 'none', padding: '11px 6px', fontSize: '0.74rem' }}>{busy ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={14} />} {tr.yes}</button>
                    <button type="button" disabled={busy} onClick={() => setStep('failed')} style={{ ...plain, padding: '11px 6px', fontSize: '0.74rem' }}><XCircle size={14} /> {tr.no}</button>
                    <button type="button" disabled={busy} onClick={() => setStep('unsure')} style={{ ...plain, padding: '11px 6px', fontSize: '0.74rem' }}><HelpCircle size={14} /> {tr.unsure}</button>
                  </div>
                </>
              )}
              {step === 'unsure' && (
                <>
                  <div style={{ fontSize: '0.76rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>{tr.unsureH}</div>
                  <button type="button" onClick={() => setStep('ask')} style={plain}>{tr.q}</button>
                </>
              )}
              {step === 'failed' && (
                <>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 10 }}>{tr.whyH}</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {[['limit', tr.r_limit], ['declined', tr.r_declined], ['noopen', tr.r_noopen], ['other', tr.r_other]].map(([id, label]) => (
                      <button key={id} type="button" disabled={busy} onClick={() => report(id)} style={{ ...plain, justifyContent: 'flex-start', padding: '11px 12px' }}>{label}</button>
                    ))}
                  </div>
                </>
              )}
              {step === 'reported' && (
                <>
                  <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontSize: '0.78rem', fontWeight: 800, marginBottom: 8 }}><CheckCircle2 size={16} /> {tr.reported}</div>
                  <div style={{ fontSize: '0.76rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>{hint[`h_${reason}`] || tr.h_other}</div>
                  <button type="button" onClick={() => { setStep('ask'); setTapped(true); }} style={plain}>{tr.tryAgain}</button>
                </>
              )}
              {err && <div role="alert" style={{ marginTop: 8, fontSize: '0.7rem', color: '#d9907a' }}>{err}</div>}
            </div>
          )}
        </>
      )}
      <div style={{ marginTop: 10, fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{tr.note}</div>
    </div>
  );
}
