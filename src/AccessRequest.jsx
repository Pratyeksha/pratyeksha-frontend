import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, User, Store, Phone, Mail, MapPin, MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { PxCard, PxField, PxButton, PxAlert, PxLink } from './AuthKit.jsx';

/**
 * "Request access" — the sign-up page for staff screens. Operator and Kitchen accounts are issued by Pratyeksha when a
 * restaurant is onboarded, so this sends a request to the Pratyeksha team (it lands in Master Admin › Demos & leads)
 * rather than creating an account on the spot. Spam bots are caught by a hidden honeypot field plus the server's own limits.
 */
export default function AccessRequest({ kind = 'Operator', onBack }) {
  const [f, setF] = useState({ name: '', restaurant: '', phone: '', email: '', city: '', message: '', website: '' });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrs((s) => ({ ...s, [k]: '' })); };

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = 'Enter your name';
    if (f.restaurant.trim().length < 2) x.restaurant = 'Enter your café or restaurant name';
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, ''))) x.phone = 'Enter a valid 10-digit mobile number';
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) x.email = 'Enter a valid email';
    setErrs(x); if (Object.keys(x).length) return;
    setBusy(true); setErr('');
    try {
      await axios.post(`${API_BASE_URL}/demo-request`, {
        name: f.name.trim(), business: f.restaurant.trim(), phone: f.phone.replace(/[\s-]/g, ''), email: f.email.trim(), city: f.city.trim(),
        type: `Access request — ${kind}`, message: (f.message.trim() || `Please set up ${kind.toLowerCase()} access.`), website: f.website,
      }, { timeout: 12000 });
      setDone(true);
    } catch (ex) { setErr(ex?.response?.data?.message || 'Could not send your request. Please try again.'); }
    finally { setBusy(false); }
  };

  if (done) return (
    <PxCard icon={CheckCircle2} title="Request received" subtitle="Thank you. The Pratyeksha team will call or message you shortly to set up your access.">
      <PxButton type="button" onClick={onBack} noIcon>Back to sign in</PxButton>
    </PxCard>
  );

  return (
    <PxCard icon={UserPlus} title="Request access" subtitle={`${kind} accounts are created by Pratyeksha for your café or restaurant. Tell us who you are and we’ll set you up.`}>
      <form onSubmit={submit} noValidate>
        <PxField icon={User} label="Your name" placeholder="Your name" value={f.name} onChange={set('name')} error={errs.name} autoComplete="name" autoFocus />
        <PxField icon={Store} label="Café or restaurant" placeholder="Café or restaurant name" value={f.restaurant} onChange={set('restaurant')} error={errs.restaurant} autoComplete="organization" />
        <PxField icon={Phone} label="Mobile number" placeholder="Mobile number" value={f.phone} onChange={set('phone')} error={errs.phone} inputMode="tel" autoComplete="tel" />
        <PxField icon={Mail} label="Email (optional)" placeholder="Email (optional)" type="email" value={f.email} onChange={set('email')} error={errs.email} autoComplete="email" />
        <PxField icon={MapPin} label="City (optional)" placeholder="City (optional)" value={f.city} onChange={set('city')} autoComplete="address-level2" />
        <PxField icon={MessageSquare} textarea rows={2} label="Message (optional)" placeholder="Anything we should know? (optional)" value={f.message} onChange={set('message')} maxLength={400} style={{ paddingLeft: 46 }} />
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
        <PxAlert>{err}</PxAlert>
        <PxButton type="submit" loading={busy}>{busy ? 'Sending…' : 'Send request'}</PxButton>
      </form>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <PxLink onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} />Back to sign in</PxLink>
      </div>
    </PxCard>
  );
}
