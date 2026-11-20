/**
 * Second step of every sign-in (platform admin, operator / kitchen, owner app).
 * Rendered by a login screen when the password step answered with { twoFactorRequired | twoFactorSetupRequired, challengeToken }.
 *
 *   <TwoFactorStep challenge={data} apiRoot={API_BASE_URL} onSuccess={(loginBody) => ...} onBack={(message) => ...} />
 *
 *  - twoFactorRequired      -> asks for the 6-digit code (or a recovery code) and signs in
 *  - twoFactorSetupRequired -> mandatory first-time setup: QR code, confirm with a code, show the 10 recovery codes ONCE
 *
 * `onSuccess` receives exactly what the login endpoint used to return ({ token, tenantId, ... }), so each screen keeps its own
 * "what happens after sign-in" code. It runs only after the person confirmed they saved their recovery codes.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Hash, KeyRound, Copy, Download, Check } from 'lucide-react';
import { PxCard, PxField, PxButton, PxAlert, PxLink, PX } from './AuthKit.jsx';

const msg = (ex) => ex?.response?.data?.error || ex?.response?.data?.message
  || (ex?.response ? 'Something went wrong. Please try again.' : 'Cannot reach the server. Check your internet connection.');
const groups = (s) => String(s || '').replace(/(.{4})/g, '$1 ').trim();

export default function TwoFactorStep({ challenge, apiRoot, onSuccess, onBack }) {
  const setupMode = !!challenge.twoFactorSetupRequired;
  const token = challenge.challengeToken;
  const [code, setCode] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState(null);         // { secret, otpauthUri }
  const [loadingSetup, setLoadingSetup] = useState(setupMode);
  const [done, setDone] = useState(null);           // login body + recovery codes, held until the codes are saved
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState('');
  const startedRef = useRef(false);
  const url = (p) => `${String(apiRoot).replace(/\/+$/, '')}/auth/2fa/${p}`;

  const failWith = useCallback((ex) => {
    const d = ex?.response?.data;
    if (d?.code === '2FA_CHALLENGE_INVALID') { onBack?.(d.error); return; }          // expired: back to the password step
    setError(msg(ex) + (d?.attemptsLeft != null && d.attemptsLeft <= 2 ? ` (${d.attemptsLeft} ${d.attemptsLeft === 1 ? 'try' : 'tries'} left)` : ''));
  }, [onBack]);

  // Setup: ask the server for a fresh secret exactly once (a ref guards React StrictMode's double effect).
  useEffect(() => {
    if (!setupMode || startedRef.current) return;
    startedRef.current = true;
    axios.post(url('setup'), { challengeToken: token })
      .then(({ data }) => setSetup(data))
      .catch(failWith)
      .finally(() => setLoadingSetup(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = useCallback(async (e, override) => {
    e?.preventDefault?.();
    if (busy) return;
    const val = typeof override === 'string' ? override : code;
    const digits = val.replace(/\D/g, '');
    if (recoveryMode ? val.replace(/[^A-Za-z0-9]/g, '').length < 10 : digits.length !== 6) return;
    setBusy(true); setError('');
    try {
      if (setupMode) {
        const { data } = await axios.post(url('enable'), { challengeToken: token, code: digits });
        setDone(data);                                                              // show the recovery codes before continuing
      } else {
        const { data } = await axios.post(url('verify'), { challengeToken: token, ...(recoveryMode ? { recoveryCode: val } : { code: digits }) });
        onSuccess(data);
        return;
      }
    } catch (ex) { failWith(ex); setCode(''); }
    setBusy(false);
  }, [busy, code, recoveryMode, setupMode, token, failWith, onSuccess]);       // eslint-disable-line react-hooks/exhaustive-deps

  // Typing the 6th digit submits straight away (no extra tap).
  const onDigits = (v) => { setCode(v); if (v.length === 6 && !busy && (!setupMode || setup)) submit(null, v); };

  const copy = async (what, text) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1800); } catch { /* clipboard unavailable */ } };
  const recovery = done?.twoFactor?.recoveryCodes || [];
  const downloadCodes = () => {
    const body = `Pratyeksha recovery codes for ${challenge.label}\nEach code works once. Keep them somewhere safe.\n\n${recovery.join('\n')}\n`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/plain' })); a.download = 'pratyeksha-recovery-codes.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const box = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(211,191,162,0.22)', borderRadius: 14, padding: 14 };
  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

  /* ── after enrolment: recovery codes, shown once ── */
  if (done) {
    return (
      <PxCard icon={KeyRound} title="Save your recovery codes" subtitle="If you lose your phone, each code signs you in once. They are shown only now.">
        <div style={{ ...box, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 14px', ...mono, fontSize: 14, letterSpacing: 1, color: '#f7f3eb', textAlign: 'center' }} role="list" aria-label="Recovery codes">
          {recovery.map((c) => <div key={c} role="listitem">{c}</div>)}
        </div>
        <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
          <PxButton type="button" ghost noIcon onClick={() => copy('codes', recovery.join('\n'))}>{copied === 'codes' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy all</>}</PxButton>
          <PxButton type="button" ghost noIcon onClick={downloadCodes}><Download size={14} /> Download</PxButton>
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '6px 0 14px', cursor: 'pointer', lineHeight: 1.45 }}>
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: '#d3bfa2', flex: '0 0 auto' }} />
          I have saved these codes somewhere safe.
        </label>
        <PxButton type="button" disabled={!saved} onClick={() => onSuccess(done)}>Continue</PxButton>
      </PxCard>
    );
  }

  /* ── first-time setup ── */
  if (setupMode) {
    return (
      <PxCard icon={ShieldCheck} title="Turn on two-step verification" subtitle={`Required for every sign-in. This protects ${challenge.label}.`}>
        <ol style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)' }}>
          <li>Install an authenticator app (Google Authenticator, Microsoft Authenticator, Authy).</li>
          <li>Scan this QR code, or type the key.</li>
          <li>Enter the 6-digit code it shows.</li>
        </ol>
        <div style={{ ...box, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {loadingSetup && <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Preparing your code…</div>}
          {setup && (
            <>
              <div style={{ background: '#fff', padding: 10, borderRadius: 12, lineHeight: 0 }}><QRCodeSVG value={setup.otpauthUri} size={168} level="M" title="Authenticator QR code" /></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, letterSpacing: 1.2, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>OR TYPE THIS KEY</div>
                <button type="button" onClick={() => copy('key', setup.secret)} style={{ ...mono, background: 'none', border: 0, color: '#f7f3eb', fontSize: 15, letterSpacing: 1.5, cursor: 'pointer', wordBreak: 'break-all' }} aria-label="Copy the setup key">
                  {groups(setup.secret)} {copied === 'key' ? <Check size={14} color={PX?.gold || '#d3bfa2'} /> : <Copy size={13} color="rgba(255,255,255,0.5)" />}
                </button>
              </div>
            </>
          )}
        </div>
        <form onSubmit={submit} noValidate style={{ marginTop: 12 }}>
          <PxField icon={Hash} label="6-digit code" placeholder="123456" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={(e) => onDigits(e.target.value.replace(/\D/g, ''))} />
          <PxAlert>{error}</PxAlert>
          <PxButton type="submit" loading={busy} disabled={busy || !setup || code.length !== 6}>{busy ? 'Checking…' : 'Turn on and continue'}</PxButton>
        </form>
        <div style={{ textAlign: 'center', marginTop: 8 }}><PxLink onClick={() => onBack?.('')}>Back to sign in</PxLink></div>
      </PxCard>
    );
  }

  /* ── every later sign-in ── */
  const ready = recoveryMode ? code.replace(/[^A-Za-z0-9]/g, '').length >= 10 : code.length === 6;
  return (
    <PxCard icon={ShieldCheck} title="Two-step verification" subtitle={recoveryMode ? 'Enter one of your recovery codes.' : `Enter the 6-digit code from your authenticator app for ${challenge.label}.`}>
      <form onSubmit={submit} noValidate>
        {recoveryMode
          ? <PxField icon={KeyRound} label="Recovery code" placeholder="XXXXX-XXXXX" autoCapitalize="characters" autoCorrect="off" spellCheck="false" autoFocus maxLength={12} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          : <PxField icon={Hash} label="Authentication code" placeholder="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={(e) => onDigits(e.target.value.replace(/\D/g, ''))} />}
        <PxAlert>{error}</PxAlert>
        <PxButton type="submit" loading={busy} disabled={busy || !ready}>{busy ? 'Verifying…' : 'Verify and sign in'}</PxButton>
      </form>
      <div style={{ textAlign: 'center', marginTop: 8, display: 'grid', gap: 4 }}>
        <PxLink onClick={() => { setRecoveryMode((v) => !v); setCode(''); setError(''); }}>{recoveryMode ? 'Use my authenticator app instead' : 'Lost your phone? Use a recovery code'}</PxLink>
        <PxLink onClick={() => onBack?.('')}>Back to sign in</PxLink>
      </div>
    </PxCard>
  );
}
