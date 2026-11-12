import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { loginAdmin, forgotAdminPassword, resetAdminPassword } from '../api';
import { useTenantName } from '../brand';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const tenantName = useTenantName();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // login | ask | code | done
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await loginAdmin({ email, password });
      localStorage.setItem('jayAmbeAdminToken', data.token);
      navigate('/admin');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async (event) => {
    event?.preventDefault();
    setLoading(true); setError(''); setInfo('');
    try {
      const { data } = await forgotAdminPassword({ username: email.trim() });
      if (data?.noEmail) setError(data.message);
      else { setInfo(data?.hint ? `If the email matched, a code was sent to ${data.hint}. It is valid for 10 minutes.` : 'If the email matched an account, a code was sent. It is valid for 10 minutes.'); setMode('code'); }
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not send the code. Please try again.');
    } finally { setLoading(false); }
  };

  const saveNew = async (event) => {
    event.preventDefault();
    if (newPassword.length < 10) { setError('New password must be at least 10 characters.'); return; }
    setLoading(true); setError('');
    try {
      await resetAdminPassword({ username: email.trim(), code: code.trim(), newPassword });
      setMode('done'); setPassword('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not reset the password. Please try again.');
    } finally { setLoading(false); }
  };

  if (mode !== 'login') {
    return (
      <main className="admin-auth">
        <div className="auth-glow" />
        <section className="auth-card">
          <div className="auth-mark"><LockKeyhole size={22} /></div>
          <span className="eyebrow">{(tenantName || 'Guest feedback').toUpperCase()} / INSIGHT</span>
          <h1>{mode === 'done' ? 'Password updated.' : 'Reset your password.'}</h1>
          {mode === 'ask' && (
            <form onSubmit={sendCode}>
              <p>Enter your admin email and we will send a 6-digit code to it.</p>
              <label className="field"><span>Admin email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              {error && <div className="form-error">{error}</div>}
              <button className="primary-button auth-submit" disabled={loading}>{loading ? 'Sending…' : 'Email me a code'} <ArrowRight size={17} /></button>
            </form>
          )}
          {mode === 'code' && (
            <form onSubmit={saveNew}>
              <p>{info}</p>
              <label className="field"><span>6-digit code</span><input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required /></label>
              <label className="field"><span>New password (10+ characters)</span><input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></label>
              {error && <div className="form-error">{error}</div>}
              <button className="primary-button auth-submit" disabled={loading}>{loading ? 'Saving…' : 'Save new password'} <ArrowRight size={17} /></button>
              <button type="button" className="auth-link" onClick={sendCode} disabled={loading} style={{ background: 'none', border: 0, color: 'inherit', textDecoration: 'underline', marginTop: 12, cursor: 'pointer' }}>Send the code again</button>
            </form>
          )}
          {mode === 'done' && (
            <div><p>Your new password is saved. Sign in with it now.</p></div>
          )}
          <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }} style={{ background: 'none', border: 0, color: 'inherit', textDecoration: 'underline', marginTop: 14, cursor: 'pointer' }}>Back to sign in</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-auth">
      <div className="auth-glow" />
      <section className="auth-card">
        <div className="auth-mark"><LockKeyhole size={22} /></div>
        <span className="eyebrow">{(tenantName || 'Guest feedback').toUpperCase()} / INSIGHT</span>
        <h1>Welcome back.</h1>
        <p>Sign in to review what your guests are telling you.</p>

        <form onSubmit={submit}>
          <label className="field">
            <span>Admin email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Open dashboard'} <ArrowRight size={17} />
          </button>
        </form>
        <button type="button" onClick={() => { setMode('ask'); setError(''); }} style={{ background: 'none', border: 0, color: 'inherit', textDecoration: 'underline', margin: '12px auto 0', display: 'block', cursor: 'pointer', opacity: 0.85 }}>Forgot password?</button>

        <div className="auth-safe">
          <ShieldCheck size={16} />
          <span>Private operator area · Protected API</span>
        </div>
      </section>
    </main>
  );
}
