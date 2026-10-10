import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { loginAdmin } from '../api';
import { useTenantName } from '../brand';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const tenantName = useTenantName();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

        <div className="auth-safe">
          <ShieldCheck size={16} />
          <span>Private operator area · Protected API</span>
        </div>
      </section>
    </main>
  );
}
