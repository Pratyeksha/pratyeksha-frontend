import React, { useState } from 'react';
import { User, Lock, ChefHat, UserPlus } from 'lucide-react';
import { PxAuthShell, PxCard, PxField, PxButton, PxDivider, PxAlert, PxHomeLink, PxSecure } from './AuthKit.jsx';
import { ForgotLink } from './ForgotPassword.jsx';
import AccessRequest from './AccessRequest.jsx';

/**
 * Sign-in page for restaurant staff screens — Operator ("Admin Command Center") and Kitchen Display (KDS).
 * Both sign in with the restaurant's operator account against POST /api/admin/login; this component owns the form,
 * the error display, the forgot-PIN flow and the request-access sign-up page. The caller owns what a successful
 * sign-in does:   onLogin({ username, password })  →  resolve normally on success, or throw an Error whose message is shown.
 */
const COPY = {
  operator: {
    art: User, icon: User, title: 'Operator Access', subtitle: 'Sign in to manage operations',
    headline: 'Smart Operations. Seamless Service.', sub: 'for your Café & Restaurant',
    user: 'Username or Staff ID', pass: 'Access PIN', forgot: 'Forgot PIN?', kind: 'Operator',
  },
  kds: {
    art: ChefHat, icon: ChefHat, title: 'KDS Login', subtitle: 'Access kitchen orders',
    headline: 'Kitchen Display System', sub: 'Cook Smart. Serve Faster.',
    user: 'Username', pass: 'Password', forgot: 'Forgot password?', kind: 'Kitchen display',
  },
};

export default function StaffLogin({ variant = 'operator', onLogin, onHome }) {
  const c = COPY[variant] || COPY.operator;
  const [view, setView] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) { setError(`Enter your ${c.user.toLowerCase()} and ${c.pass.toLowerCase()}`); return; }
    setBusy(true); setError('');
    try { await onLogin({ username: username.trim(), password }); }
    catch (err) { setError(err?.message || 'Could not sign in. Please try again.'); setBusy(false); }
    // on success the caller reloads / switches screen, so the busy state is left as is
  };

  return (
    <PxAuthShell art={c.art} headline={c.headline} sub={c.sub}>
      {view === 'request' ? <AccessRequest kind={c.kind} onBack={() => setView('login')} /> : (
        <PxCard icon={c.icon} title={c.title} subtitle={c.subtitle}>
          <form onSubmit={submit} noValidate>
            <PxField icon={User} label={c.user} placeholder={c.user} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
            <PxField icon={Lock} type="password" label={c.pass} placeholder={c.pass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <PxAlert>{error}</PxAlert>
            <PxButton type="submit" loading={busy}>{busy ? 'Signing in…' : 'Sign In'}</PxButton>
          </form>
          <div style={{ textAlign: 'center', marginTop: 10 }}><ForgotLink scope="operator" label={c.forgot} defaultUsername={username} /></div>
          <PxDivider />
          <PxButton type="button" ghost icon={UserPlus} onClick={() => { setError(''); setView('request'); }}>Request Access</PxButton>
          <PxHomeLink onClick={onHome} />
          <PxSecure />
        </PxCard>
      )}
    </PxAuthShell>
  );
}
