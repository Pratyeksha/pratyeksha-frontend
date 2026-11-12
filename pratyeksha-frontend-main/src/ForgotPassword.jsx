import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { KeyRound, X, Mail, Eye, EyeOff, Phone } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { SUPPORT } from './SupportContact.jsx';

/* Forgot-password flow shared by Operator/KDS (PIN) and Owner (password).
   1) enter username -> a 6-digit code is emailed to the outlet's recovery email
   2) enter the code + a new password -> saved, then the user signs in normally. */

const GOLD = '#d3bfa2';
const IVORY = '#f7f3eb';
const COPPER = '#e29a58';
const input = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.22)', background: 'rgba(255,255,255,0.04)', color: IVORY, fontSize: 14, outline: 'none', fontFamily: 'inherit', marginBottom: 10, textAlign: 'left' };
const primary = { width: '100%', padding: '13px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.5)', background: 'linear-gradient(135deg, #e6d6b8, #d3bfa2 55%, #b99f78)', color: '#111', fontWeight: 800, fontSize: 12.5, letterSpacing: 0.8, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' };

export function ForgotLink({ scope, tenantId, defaultUsername, label = 'Forgot password?', style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{ background: 'transparent', border: 0, color: GOLD, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'inherit', padding: 6, ...style }}>{label}</button>
      {open && <ForgotPassword scope={scope} tenantId={tenantId} defaultUsername={defaultUsername} onClose={() => setOpen(false)} />}
    </>
  );
}

export default function ForgotPassword({ scope, tenantId, defaultUsername = '', onClose }) {
  const isOwner = scope === 'owner';
  const noun = scope === 'operator' ? 'PIN' : 'password';
  const min = scope === 'owner' ? 6 : 4;
  const [step, setStep] = useState('ask'); // ask → code → done | contact
  const [username, setUsername] = useState(defaultUsername);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = async (e) => {
    e?.preventDefault();
    if (!username.trim()) { setErr('Enter your username'); return; }
    setBusy(true); setErr('');
    try {
      const r = await axios.post(`${API_BASE_URL}/auth/forgot`, { scope, tenantId, username: username.trim() });
      if (r.data?.noEmail) { setStep('contact'); return; }
      setHint(r.data?.hint || '');
      setStep('code');
    } catch (ex) {
      const d = ex?.response?.data;
      if (d?.support) setStep('contact'); else setErr(d?.error || 'Could not send the code. Please try again.');
    } finally { setBusy(false); }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) { setErr('Enter the 6-digit code from your email'); return; }
    if (pw.length < min) { setErr(`New ${noun} must be at least ${min} characters`); return; }
    setBusy(true); setErr('');
    try {
      await axios.post(`${API_BASE_URL}/auth/reset`, { scope, tenantId, username: username.trim(), code: code.trim(), newPassword: pw });
      setStep('done');
    } catch (ex) { setErr(ex?.response?.data?.error || 'Could not reset. Please try again.'); }
    finally { setBusy(false); }
  };

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100004, background: 'rgba(4,4,4,0.78)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div role="dialog" aria-label="Reset password" onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: '100%', borderRadius: 26, border: '1px solid rgba(211,191,162,0.22)', background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)), #0a0a0a', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9)', padding: 24, color: IVORY, fontFamily: 'Poppins, Inter, system-ui, sans-serif', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(211,191,162,0.1)', border: '1px solid rgba(211,191,162,0.25)', color: GOLD }}><KeyRound size={19} /></div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(211,191,162,0.2)', background: 'transparent', color: GOLD, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={15} /></button>
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 25, fontWeight: 700, marginBottom: 4, color: IVORY }}>
          {step === 'done' ? `${noun === 'PIN' ? 'PIN' : 'Password'} updated` : `Reset your ${noun}`}
        </div>

        {step === 'ask' && (
          <form onSubmit={send}>
            <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: 'rgba(247,243,235,0.65)' }}>Enter your username. We’ll email a 6-digit code to the recovery email saved for this outlet.</p>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" autoFocus autoCapitalize="none" autoCorrect="off" spellCheck="false" style={input} />
            {err && <div style={{ color: COPPER, fontSize: 12.5, margin: '0 0 10px' }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ ...primary, opacity: busy ? 0.7 : 1 }}>{busy ? 'Sending…' : 'Email me a code'}</button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={reset}>
            <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: 'rgba(247,243,235,0.65)' }}>
              {hint ? <>If the details matched, a code was sent to <b style={{ color: IVORY }}>{hint}</b>.</> : 'If the details matched an account, a code was emailed to its recovery address.'} It stays valid for 10 minutes.
            </p>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" inputMode="numeric" autoComplete="one-time-code" autoFocus style={{ ...input, letterSpacing: 6, fontWeight: 700, fontSize: 18, textAlign: 'center' }} />
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder={`New ${noun}`} autoComplete="new-password" style={{ ...input, paddingRight: 42 }} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label="Show or hide" style={{ position: 'absolute', right: 8, top: 7, background: 'transparent', border: 0, color: GOLD, cursor: 'pointer', padding: 6 }}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {err && <div style={{ color: COPPER, fontSize: 12.5, margin: '0 0 10px' }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ ...primary, opacity: busy ? 0.7 : 1 }}>{busy ? 'Saving…' : `Save new ${noun}`}</button>
            <button type="button" onClick={send} disabled={busy} style={{ width: '100%', marginTop: 8, background: 'transparent', border: 0, color: GOLD, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', padding: 8 }}>Send the code again</button>
          </form>
        )}

        {step === 'done' && (
          <div>
            <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: 'rgba(247,243,235,0.65)' }}>Your new {noun} is saved. Sign in with it now.</p>
            <button type="button" onClick={onClose} style={primary}>Back to sign in</button>
          </div>
        )}

        {step === 'contact' && (
          <div>
            <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: 'rgba(247,243,235,0.65)' }}>No recovery email is saved for this outlet yet, so we can’t email a code. Please contact the Pratyeksha team and we’ll reset it for you.</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {SUPPORT.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.16)', color: IVORY, textDecoration: 'none', fontSize: 13.5, fontWeight: 600 }}><Phone size={15} color={GOLD} />{p.label}</a>)}
              <a href={`mailto:${SUPPORT.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.16)', color: IVORY, textDecoration: 'none', fontSize: 13.5, fontWeight: 600 }}><Mail size={15} color={GOLD} />{SUPPORT.email}</a>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
