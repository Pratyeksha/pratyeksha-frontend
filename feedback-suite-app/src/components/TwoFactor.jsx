import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowRight, ShieldCheck, Copy, Download, Check } from 'lucide-react';
import { twoFactorSetup, twoFactorEnable, twoFactorVerify } from '../api';

// Second step of the Feedback Suite admin sign-in: authenticator code (every time) or the mandatory first-time setup.
// onSuccess receives the login body ({ token, tenantId }) once the code was accepted (and recovery codes saved, when enrolling).
const msg = (ex) => ex?.response?.data?.error || ex?.response?.data?.message || (ex?.response ? 'Something went wrong. Please try again.' : 'Cannot reach the server. Check your connection.');

export default function TwoFactor({ challenge, onSuccess, onBack }) {
  const setupMode = !!challenge.twoFactorSetupRequired;
  const [code, setCode] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState(null);
  const [done, setDone] = useState(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  const fail = (ex) => { const d = ex?.response?.data; if (d?.code === '2FA_CHALLENGE_INVALID') { onBack(d.error); return; } setError(msg(ex) + (d?.attemptsLeft != null && d.attemptsLeft <= 2 ? ` (${d.attemptsLeft} left)` : '')); };
  useEffect(() => {
    if (!setupMode || started.current) return;
    started.current = true;
    twoFactorSetup(challenge.challengeToken).then(({ data }) => setSetup(data)).catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const digits = code.replace(/\D/g, '');
  const ready = recoveryMode ? code.replace(/[^A-Za-z0-9]/g, '').length >= 10 : digits.length === 6;
  const submit = async (e) => {
    e?.preventDefault();
    if (busy || !ready) return;
    setBusy(true); setError('');
    try {
      if (setupMode) { const { data } = await twoFactorEnable(challenge.challengeToken, digits); setDone(data); }
      else { const { data } = await twoFactorVerify(challenge.challengeToken, recoveryMode ? { recoveryCode: code } : { code: digits }); onSuccess(data); return; }
    } catch (ex) { fail(ex); setCode(''); }
    setBusy(false);
  };
  useEffect(() => { if (!recoveryMode && !done && digits.length === 6 && !busy && (!setupMode || setup)) submit(); }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const codes = done?.twoFactor?.recoveryCodes || [];
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* unavailable */ } };
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`Recovery codes for ${challenge.label}\nEach code works once.\n\n${codes.join('\n')}\n`], { type: 'text/plain' })); a.download = 'recovery-codes.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const mono = { fontFamily: 'ui-monospace, Menlo, monospace' };

  return (
    <main className="admin-auth">
      <div className="auth-glow" />
      <section className="auth-card">
        <div className="auth-mark"><ShieldCheck size={22} /></div>
        {done ? (
          <>
            <h1>Save your recovery codes.</h1>
            <p>If you lose your phone, each code signs you in once. They are shown only now.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 14px', ...mono, textAlign: 'center', margin: '14px 0' }}>{codes.map((c) => <div key={c}>{c}</div>)}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <button type="button" className="primary-button" onClick={() => copy(codes.join('\n'))}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy all</>}</button>
              <button type="button" className="primary-button" onClick={download}><Download size={15} /> Download</button>
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '8px 0 14px', cursor: 'pointer' }}><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} style={{ marginTop: 4 }} /> I have saved these codes somewhere safe.</label>
            <button type="button" className="primary-button auth-submit" disabled={!saved} onClick={() => onSuccess(done)}>Continue <ArrowRight size={17} /></button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1>{setupMode ? 'Turn on two-step verification.' : 'Two-step verification.'}</h1>
            {setupMode ? (
              <>
                <p>Required for every sign-in. Scan the QR code with Google Authenticator, Microsoft Authenticator or Authy, then enter the 6-digit code.</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '12px 0' }}>
                  {!setup && !error && <span>Preparing your code…</span>}
                  {setup && <><div style={{ background: '#fff', padding: 10, borderRadius: 12, lineHeight: 0 }}><QRCodeSVG value={setup.otpauthUri} size={168} level="M" /></div>
                    <button type="button" onClick={() => copy(setup.secret)} style={{ ...mono, background: 'none', border: 0, color: 'inherit', cursor: 'pointer', wordBreak: 'break-all' }}>{setup.secret.replace(/(.{4})/g, '$1 ').trim()}</button></>}
                </div>
              </>
            ) : <p>{recoveryMode ? 'Enter one of your recovery codes.' : `Enter the 6-digit code from your authenticator app for ${challenge.label}.`}</p>}
            <label className="field"><span>{recoveryMode ? 'Recovery code' : '6-digit code'}</span>
              <input value={code} autoFocus inputMode={recoveryMode ? 'text' : 'numeric'} autoComplete="one-time-code" maxLength={recoveryMode ? 12 : 6}
                onChange={(e) => setCode(recoveryMode ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))} /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button auth-submit" disabled={busy || !ready || (setupMode && !setup)}>{busy ? 'Checking…' : setupMode ? 'Turn on and continue' : 'Verify and sign in'} <ArrowRight size={17} /></button>
            {!setupMode && <p style={{ textAlign: 'center' }}><button type="button" className="link-button" onClick={() => { setRecoveryMode((v) => !v); setCode(''); setError(''); }}>{recoveryMode ? 'Use my authenticator app instead' : 'Lost your phone? Use a recovery code'}</button></p>}
            <p style={{ textAlign: 'center' }}><button type="button" className="link-button" onClick={() => onBack('')}>Back to sign in</button></p>
          </form>
        )}
      </section>
    </main>
  );
}
