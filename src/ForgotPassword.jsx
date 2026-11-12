import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { KeyRound, X, Mail, Phone, User, Lock, Hash, CheckCircle2 } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { SUPPORT } from './SupportContact.jsx';
import { PxCard, PxField, PxButton, PxAlert, PxLink, PxStrength, passwordIssues, PX } from './AuthKit.jsx';

/* Forgot-password flow shared by Operator/KDS (PIN) and Owner (password).
   1) enter username (owner: username or recovery email) -> a 6-digit code is emailed to the outlet's recovery email
   2) enter the code + a new password -> saved, every older session is signed out, then the user signs in normally. */

export function ForgotLink({ scope, tenantId, defaultUsername, label = 'Forgot password?', style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PxLink onClick={() => setOpen(true)} style={style}>{label}</PxLink>
      {open && <ForgotPassword scope={scope} tenantId={tenantId} defaultUsername={defaultUsername} onClose={() => setOpen(false)} />}
    </>
  );
}

export default function ForgotPassword({ scope, tenantId, defaultUsername = '', onClose }) {
  const isOwner = scope === 'owner';
  const noun = scope === 'operator' ? 'PIN' : 'password';
  const min = isOwner ? 8 : 4;
  const [step, setStep] = useState('ask'); // ask → code → done | contact
  const [username, setUsername] = useState(defaultUsername);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [cool, setCool] = useState(0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);

  const send = async (e) => {
    e?.preventDefault();
    if (!username.trim()) { setErr(isOwner ? 'Enter your username or email' : 'Enter your username'); return; }
    setBusy(true); setErr('');
    try {
      const r = await axios.post(`${API_BASE_URL}/auth/forgot`, { scope, tenantId, username: username.trim() });
      if (r.data?.noEmail) { setStep('contact'); return; }
      setHint(r.data?.hint || '');
      setStep('code'); setCool(30);
    } catch (ex) {
      const d = ex?.response?.data;
      if (d?.support) setStep('contact'); else setErr(d?.error || 'Could not send the code. Please try again.');
    } finally { setBusy(false); }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) { setErr('Enter the 6-digit code from your email'); return; }
    if (isOwner) { const why = passwordIssues(pw); if (why) { setErr(why); return; } }
    else if (pw.length < min) { setErr(`New ${noun} must be at least ${min} characters`); return; }
    setBusy(true); setErr('');
    try {
      await axios.post(`${API_BASE_URL}/auth/reset`, { scope, tenantId, username: username.trim(), code: code.trim(), newPassword: pw });
      setStep('done');
    } catch (ex) { setErr(ex?.response?.data?.error || 'Could not reset. Please try again.'); }
    finally { setBusy(false); }
  };

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100004, background: 'rgba(60,44,26,0.42)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 16, overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={`Reset ${noun}`} onClick={(e) => e.stopPropagation()} style={{ width: 430, maxWidth: '100%', position: 'relative', fontFamily: PX.sans }}>
        <PxCard icon={step === 'done' ? CheckCircle2 : KeyRound}
          title={step === 'done' ? `${noun === 'PIN' ? 'PIN' : 'Password'} updated` : `Reset your ${noun}`}
          subtitle={step === 'ask' ? `Enter your ${isOwner ? 'username or recovery email' : 'username'}. We’ll email a 6-digit code to the recovery email saved for this outlet.`
            : step === 'code' ? (hint ? `If the details matched, a code was sent to ${hint}. It stays valid for 10 minutes.` : 'If the details matched an account, a code was emailed to its recovery address. It stays valid for 10 minutes.')
            : step === 'done' ? `Your new ${noun} is saved and every older session was signed out. Sign in with it now.`
            : 'No recovery email is saved for this outlet yet, so we can’t email a code. Please contact Pratyeksha support to reset it.'}>
          <button type="button" onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 10, border: `1px solid ${PX.line}`, background: 'rgba(255,255,255,.7)', color: PX.mute, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={16} /></button>

          {step === 'ask' && (
            <form onSubmit={send} noValidate>
              <PxField icon={isOwner ? Mail : User} label="Username" placeholder={isOwner ? 'Username or email' : 'Username or Staff ID'} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoCapitalize="none" autoCorrect="off" spellCheck="false" autoComplete="username" />
              <PxAlert>{err}</PxAlert>
              <PxButton type="submit" loading={busy}>{busy ? 'Sending…' : 'Email me a code'}</PxButton>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={reset} noValidate>
              <PxField icon={Hash} label="6-digit code" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus />
              <PxField icon={Lock} type="password" label={`New ${noun}`} placeholder={`New ${noun}`} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" hint={isOwner ? 'At least 8 characters, with letters and numbers.' : undefined} />
              {isOwner && <PxStrength value={pw} />}
              <PxAlert>{err}</PxAlert>
              <PxButton type="submit" loading={busy} icon={CheckCircle2}>{busy ? 'Saving…' : `Save new ${noun}`}</PxButton>
              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <PxLink onClick={send} disabled={busy || cool > 0} style={{ opacity: cool > 0 ? 0.55 : 1 }}>{cool > 0 ? `Send a new code in ${cool}s` : 'Send a new code'}</PxLink>
              </div>
            </form>
          )}

          {step === 'done' && <PxButton type="button" onClick={onClose} noIcon>Back to sign in</PxButton>}

          {step === 'contact' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {SUPPORT.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderRadius: 14, border: `1px solid ${PX.line}`, background: PX.paper, color: PX.ink, textDecoration: 'none', fontSize: 13.5, fontWeight: 500 }}><Phone size={16} color={PX.goldSoft} />{p.label || p.tel}</a>)}
              <a href={`mailto:${SUPPORT.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderRadius: 14, border: `1px solid ${PX.line}`, background: PX.paper, color: PX.ink, textDecoration: 'none', fontSize: 13.5, fontWeight: 500 }}><Mail size={16} color={PX.goldSoft} />{SUPPORT.email}</a>
            </div>
          )}
        </PxCard>
      </div>
    </div>,
    document.body
  );
}
