import React, { useState } from 'react';
import { X, ShieldCheck, FileText, UserX, Download } from 'lucide-react';
import { eraseMyData, exportMyData, resolveTenantId } from '../api';

/* DPDP Act: consent text, privacy notice, terms, and self-service access / erasure for feedback guests. */
const GOLD = '#d3bfa2';
const CONTACT = 'hello.pratyeksha@gmail.com';
export const CONSENT_VERSION = '2026-10-11';

const tokenKey = () => `fs_guest_token_${resolveTenantId()}`;
export const saveGuestToken = (mobile, token) => { if (token) { try { localStorage.setItem(tokenKey(), JSON.stringify({ mobile, token })); } catch { /* storage unavailable */ } } };
const readToken = (mobile) => { try { const v = JSON.parse(localStorage.getItem(tokenKey()) || 'null'); return v && v.mobile === mobile ? v.token : ''; } catch { return ''; } };

export function ConsentFields({ consent, onConsent, marketing, onMarketing, onOpen, tenantName }) {
  const box = { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 16, border: '1px solid rgba(211,191,162,0.22)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', fontSize: 13, lineHeight: 1.55 };
  const link = { background: 'none', border: 0, padding: 0, color: GOLD, textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontWeight: 700 };
  return (
    <div style={{ display: 'grid', gap: 10, margin: '6px 0 14px' }}>
      <label style={box}>
        <input type="checkbox" checked={consent} onChange={(e) => onConsent(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: GOLD, flexShrink: 0 }} />
        <span>I agree that <b>{tenantName || 'this restaurant'}</b> may store my name, mobile number and feedback to improve its service. I have read the{' '}
          <button type="button" style={link} onClick={(e) => { e.preventDefault(); onOpen('privacy'); }}>Privacy Notice</button> and{' '}
          <button type="button" style={link} onClick={(e) => { e.preventDefault(); onOpen('terms'); }}>Terms</button>. <small style={{ opacity: .65 }}>(required)</small></span>
      </label>
      <label style={box}>
        <input type="checkbox" checked={marketing} onChange={(e) => onMarketing(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: GOLD, flexShrink: 0 }} />
        <span>Send me offers and updates on WhatsApp. <small style={{ opacity: .65 }}>(optional — you can stop any time)</small></span>
      </label>
    </div>
  );
}

const P = ({ h, children }) => (
  <section style={{ marginBottom: 16, textAlign: 'left' }}>
    <h4 style={{ margin: '0 0 5px', fontSize: 13, color: GOLD }}>{h}</h4>
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, opacity: .78 }}>{children}</p>
  </section>
);

function MyData({ tenantName, onErased }) {
  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(false);
  const ok = /^\d{10}$/.test(mobile);
  const btn = { padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(211,191,162,0.35)', background: 'rgba(211,191,162,0.08)', color: GOLD, fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: 13 };
  const card = { padding: 15, borderRadius: 16, border: '1px solid rgba(211,191,162,0.18)', marginBottom: 12, textAlign: 'left' };
  const download = async () => {
    setBusy('dl'); setMsg('');
    try {
      const { data } = await exportMyData({ mobile, token: readToken(mobile) });
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'my-feedback-data.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setMsg('Your data file has been downloaded.');
    } catch (e) { setMsg(e?.response?.data?.message || 'Could not prepare your data right now.'); }
    finally { setBusy(''); }
  };
  const erase = async () => {
    setBusy('del'); setMsg('');
    try {
      const { data } = await eraseMyData({ mobile, token: readToken(mobile) });
      try { localStorage.removeItem(tokenKey()); } catch { /* ignore */ }
      setMsg(data.erased ? 'Done — your details and feedback have been deleted.' : `Request received. Marketing messages have stopped and ${tenantName || 'the restaurant'} will verify and delete your data.`);
      setConfirm(false);
      onErased && onErased();
    } catch (e) { setMsg(e?.response?.data?.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(''); }
  };
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, letterSpacing: 2, fontWeight: 700, opacity: .7, margin: '0 0 8px', textAlign: 'left', textTransform: 'uppercase' }}>Mobile number you used</label>
      <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit mobile number" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 14, border: '1px solid rgba(211,191,162,0.25)', background: 'rgba(255,255,255,0.04)', color: 'inherit', fontSize: 15, marginBottom: 14 }} />
      <div style={card}><b style={{ fontSize: 13 }}><Download size={14} style={{ verticalAlign: -2 }} /> Download my data</b><p style={{ fontSize: 12, opacity: .65, margin: '6px 0 10px' }}>A copy of your profile and the feedback you gave.</p><button type="button" style={{ ...btn, opacity: ok ? 1 : .45 }} disabled={!ok || !!busy} onClick={download}>{busy === 'dl' ? 'Preparing…' : 'Download (.json)'}</button></div>
      <div style={card}><b style={{ fontSize: 13 }}><UserX size={14} style={{ verticalAlign: -2 }} /> Delete my data &amp; withdraw consent</b><p style={{ fontSize: 12, opacity: .65, margin: '6px 0 10px' }}>Removes your name, number and every feedback you gave, and stops WhatsApp messages.</p>
        {!confirm ? <button type="button" style={{ ...btn, opacity: ok ? 1 : .45 }} disabled={!ok || !!busy} onClick={() => setConfirm(true)}>Delete my data</button>
          : <div style={{ display: 'flex', gap: 8 }}><button type="button" disabled={!!busy} onClick={erase} style={{ ...btn, background: GOLD, color: '#14110c', border: 0 }}>{busy === 'del' ? 'Deleting…' : 'Yes, delete permanently'}</button><button type="button" style={btn} onClick={() => setConfirm(false)}>Keep</button></div>}
      </div>
      {msg && <div role="status" style={{ padding: '11px 13px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.6, background: 'rgba(211,191,162,0.1)', border: '1px solid rgba(211,191,162,0.25)', color: GOLD, textAlign: 'left' }}>{msg}</div>}
      <p style={{ fontSize: 11.5, opacity: .55, lineHeight: 1.6, textAlign: 'left' }}>If this device can't prove the number is yours, we stop all marketing to it immediately and ask {tenantName || 'the restaurant'} to verify before deleting.</p>
    </div>
  );
}

export default function PrivacySheet({ open, tab, onTab, onClose, tenantName }) {
  if (!open) return null;
  const name = tenantName || 'the restaurant';
  const tabs = [['privacy', 'Privacy', ShieldCheck], ['terms', 'Terms', FileText], ['data', 'My data', UserX]];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#17140f,#0b0b0c 40%)', color: '#f7f3eb', border: '1px solid rgba(211,191,162,.2)', borderBottom: 0, borderRadius: '26px 26px 0 0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}><div style={{ fontSize: 10, letterSpacing: 3, opacity: .6, textTransform: 'uppercase' }}>{name}</div><div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontWeight: 700 }}>Your privacy</div></div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid rgba(211,191,162,.2)', background: 'transparent', color: GOLD, cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '4px 20px 12px' }}>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => onTab(id)} style={{ flex: 1, padding: '9px 6px', borderRadius: 13, border: '1px solid rgba(211,191,162,.2)', background: tab === id ? GOLD : 'transparent', color: tab === id ? '#14110c' : '#f7f3eb', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon size={13} />{label}</button>
          ))}
        </div>
        <div style={{ overflowY: 'auto', padding: '6px 20px 26px' }}>
          {tab === 'privacy' && (<>
            <P h="01 · What we collect">Your name, 10-digit mobile number, your ratings and comments, and whether you want WhatsApp offers.</P>
            <P h="02 · Why">To understand and improve {name}'s food and service, link your visits together, and — only if you tick the optional box — send you offers on WhatsApp.</P>
            <P h="03 · Who sees it">Only {name} and Pratyeksha (the software provider acting for them). We never sell your data.</P>
            <P h="04 · How long">Until you ask us to delete it. You can also stop WhatsApp offers at any time.</P>
            <P h="05 · Your rights">Access or download your data, correct it, withdraw consent and have it erased — from the "My data" tab. Grievances: {CONTACT}.</P>
            <P h="06 · Children">This form is not meant for children under 18 without a parent or guardian's consent.</P>
          </>)}
          {tab === 'terms' && (<>
            <P h="01 · Using this form">Give honest feedback and a correct mobile number. Do not post abusive or unlawful content.</P>
            <P h="02 · Your feedback">You allow {name} to use your feedback to improve its service. It is not a complaint-resolution service.</P>
            <P h="03 · Messages">WhatsApp offers are sent only if you opted in, and you can opt out any time.</P>
            <P h="04 · Law">These terms follow Indian law. Questions: {CONTACT}.</P>
          </>)}
          {tab === 'data' && <MyData tenantName={name} />}
        </div>
      </div>
    </div>
  );
}
