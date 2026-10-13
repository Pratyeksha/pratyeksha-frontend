import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { CalendarClock, Phone, Mail, MapPin, MessageCircle, LogOut, RefreshCw, X } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import SupportContact, { SUPPORT } from './SupportContact.jsx';

/* ──────────────────────────────────────────────────────────────────────────
   Subscription enforcement (UI side)
   - SubscriptionGate: blocks a module with a custom "subscription expired" page.
   - RenewalReminder:  banner + popup at 30 / 15 / 10 / 2 days, nagging more often as expiry nears.
   - installSubscriptionInterceptor(): any API answer of 402 SUBSCRIPTION_EXPIRED locks the open module at once.
   Colours stay in the ivory / gold / copper family (no red, green or blue).
   ────────────────────────────────────────────────────────────────────────── */

const GOLD = '#d3bfa2';
const IVORY = '#f7f3eb';
const COPPER = '#e29a58';
const EVENT = 'px-subscription-expired';

export function installSubscriptionInterceptor() {
  if (typeof window === 'undefined' || window.__pxSubInterceptor) return;
  window.__pxSubInterceptor = true;
  axios.interceptors.response.use(
    (r) => r,
    (err) => {
      const d = err?.response?.data;
      if (err?.response?.status === 402 && d?.code === 'SUBSCRIPTION_EXPIRED') {
        window.dispatchEvent(new CustomEvent(EVENT, { detail: d }));
      }
      return Promise.reject(err);
    }
  );
}

async function fetchStatus(tenantId) {
  const r = await axios.get(`${API_BASE_URL}/subscription/${encodeURIComponent(tenantId)}`, { timeout: 12000 });
  return r.data;
}

/** Shared status hook: loads once, then re-checks every 5 minutes and whenever the API reports an expiry. */
export function useSubscription(tenantId) {
  const [status, setStatus] = useState(null);
  const load = useCallback(async () => {
    if (!tenantId) return;
    try { setStatus(await fetchStatus(tenantId)); } catch { /* unknown tenant / offline: never lock on a failed lookup */ }
  }, [tenantId]);
  useEffect(() => {
    load();
    const t = window.setInterval(load, 5 * 60 * 1000);
    const onExpired = () => load();
    window.addEventListener(EVENT, onExpired);
    return () => { window.clearInterval(t); window.removeEventListener(EVENT, onExpired); };
  }, [load]);
  return { status, reload: load };
}

const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };

const shell = { minHeight: '100vh', width: '100%', display: 'grid', placeItems: 'center', padding: 20, boxSizing: 'border-box', background: 'radial-gradient(900px 520px at 50% -10%, rgba(211,191,162,0.12), transparent 60%), radial-gradient(700px 500px at 90% 110%, rgba(226,154,88,0.07), transparent 60%), #060606', color: IVORY, fontFamily: 'Poppins, Inter, system-ui, sans-serif', textAlign: 'center' };
const linkRow = { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 14, border: '1px solid rgba(211,191,162,0.16)', background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))', color: IVORY, textDecoration: 'none', fontSize: 13.5, fontWeight: 600, textAlign: 'left' };
const ico = { width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(211,191,162,0.1)', border: '1px solid rgba(211,191,162,0.22)', color: GOLD };

export function ExpiredPage({ name, planExpiry, logoUrl, onRetry, onSignOut }) {
  const [busy, setBusy] = useState(false);
  const retry = async () => { if (!onRetry) return; setBusy(true); try { await onRetry(); } finally { setBusy(false); } };
  return (
    <div style={shell}>
      <div style={{ width: 460, maxWidth: '100%', borderRadius: 28, border: '1px solid rgba(211,191,162,0.2)', background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.018)), #0a0a0a', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.9)', padding: '34px 26px 26px' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: 20, display: 'grid', placeItems: 'center', background: 'rgba(226,154,88,0.1)', border: '1px solid rgba(226,154,88,0.35)', color: COPPER }}>
          <CalendarClock size={28} />
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2.8, fontWeight: 800, color: GOLD, textTransform: 'uppercase' }}>Subscription ended</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, margin: '10px 0 10px', color: IVORY, lineHeight: 1.15 }}>
          {name ? `${name}’s plan has expired` : 'Your plan has expired'}
        </h1>
        <p style={{ margin: '0 auto 22px', maxWidth: 360, fontSize: 13.5, lineHeight: 1.65, color: 'rgba(247,243,235,0.66)' }}>
          {planExpiry ? `Access ended on ${fmtDate(planExpiry)}. ` : ''}Your menu, orders and data are safe — contact the Pratyeksha team to renew and everything switches back on.
        </p>
        <div style={{ display: 'grid', gap: 9, marginBottom: 18 }}>
          {SUPPORT.phones.map((p) => (
            <a key={p.tel} href={`tel:${p.tel}`} style={linkRow}><span style={ico}><Phone size={16} /></span>Call {p.label}</a>
          ))}
          <a href={`https://wa.me/${SUPPORT.phones[0].tel.replace('+', '')}?text=${encodeURIComponent('Hello Pratyeksha, I would like to renew my subscription.')}`} target="_blank" rel="noreferrer" style={linkRow}><span style={ico}><MessageCircle size={16} /></span>WhatsApp us to renew</a>
          <a href={`mailto:${SUPPORT.email}?subject=${encodeURIComponent('Subscription renewal')}`} style={linkRow}><span style={ico}><Mail size={16} /></span>{SUPPORT.email}</a>
          <div style={{ ...linkRow, cursor: 'default' }}><span style={ico}><MapPin size={16} /></span>{SUPPORT.location}</div>
        </div>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <button type="button" onClick={retry} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.5)', background: 'linear-gradient(135deg, #e6d6b8, #d3bfa2 55%, #b99f78)', color: '#111', fontWeight: 800, fontSize: 12, letterSpacing: 0.6, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1 }}>
              <RefreshCw size={14} /> {busy ? 'Checking…' : 'I’ve renewed — check again'}
            </button>
          )}
          {onSignOut && (
            <button type="button" onClick={onSignOut} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.2)', background: 'transparent', color: GOLD, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              <LogOut size={14} /> Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Wrap any module. Children render until the tenant is known to be expired. */
export function SubscriptionGate({ tenantId, children, onSignOut }) {
  const { status, reload } = useSubscription(tenantId);
  if (status?.state === 'expired') {
    return <ExpiredPage name={status.name} planExpiry={status.planExpiry} logoUrl={status.logoUrl} onRetry={reload} onSignOut={onSignOut} />;
  }
  return children;
}

/* ───────────────────────── renewal reminders ───────────────────────── */

const LEVELS = {
  notice:   { label: 'Renewal reminder', tone: GOLD,   bg: 'rgba(211,191,162,0.07)', border: 'rgba(211,191,162,0.22)', every: 3 * 24 * 3600e3 },
  warning:  { label: 'Plan ending soon', tone: '#e6d6b8', bg: 'rgba(211,191,162,0.11)', border: 'rgba(211,191,162,0.4)',  every: 24 * 3600e3 },
  urgent:   { label: 'Renew now',        tone: COPPER, bg: 'rgba(226,154,88,0.1)',   border: 'rgba(226,154,88,0.42)',  every: 6 * 3600e3 },
  critical: { label: 'Final days',       tone: COPPER, bg: 'rgba(226,154,88,0.16)',  border: 'rgba(226,154,88,0.7)',   every: 3600e3 },
};

const keyFor = (t) => `px_sub_remind_${t}`;
const readSeen = (t) => { try { return JSON.parse(localStorage.getItem(keyFor(t)) || 'null') || {}; } catch { return {}; } };
const writeSeen = (t, v) => { try { localStorage.setItem(keyFor(t), JSON.stringify(v)); } catch { /* storage unavailable */ } };

const message = (s) => {
  const d = s.daysLeft;
  if (d <= 1) return 'Your subscription ends within a day. Renew today to avoid losing access to Operator, KDS, Owner and the customer app.';
  if (d <= 2) return `Only ${d} days left. After that, the customer app, KDS, Operator and Owner apps will lock.`;
  if (d <= 10) return `Your subscription ends in ${d} days (${fmtDate(s.planExpiry)}). Renew now so service is never interrupted.`;
  if (d <= 15) return `Your subscription ends in ${d} days (${fmtDate(s.planExpiry)}). Please plan your renewal.`;
  return `Your subscription ends in ${d} days (${fmtDate(s.planExpiry)}). Contact us any time to renew.`;
};

/**
 * Banner (renders in place) + popup (portal). Popup frequency follows urgency:
 *   ≤30 days every 3 days · ≤15 every day · ≤10 every 6 hours · ≤2 every hour,
 * and it always appears the first time a new milestone (30 / 15 / 10 / 2) is reached.
 */
export function RenewalReminder({ tenantId, style }) {
  const { status } = useSubscription(tenantId);
  const [popup, setPopup] = useState(false);
  const lvl = status && status.state === 'active' ? LEVELS[status.level] : null;

  useEffect(() => {
    if (!lvl || !tenantId) return undefined;
    const check = () => {
      const seen = readSeen(tenantId);
      const due = seen.milestone !== status.milestone || !seen.at || Date.now() - seen.at >= lvl.every;
      if (due) setPopup(true);
    };
    check();
    const t = window.setInterval(check, 60 * 1000);
    return () => window.clearInterval(t);
  }, [tenantId, status?.milestone, status?.level, lvl]);

  if (!lvl) return null;
  const dismiss = () => { writeSeen(tenantId, { milestone: status.milestone, at: Date.now() }); setPopup(false); };
  const crit = status.level === 'critical';

  return (
    <>
      <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', margin: '0 0 12px', borderRadius: 14, border: `1px solid ${lvl.border}`, background: lvl.bg, color: IVORY, fontSize: 12.5, textAlign: 'left', boxShadow: crit ? '0 0 0 1px rgba(226,154,88,0.25), 0 8px 28px -12px rgba(226,154,88,0.45)' : 'none', ...style }}>
        <CalendarClock size={17} color={lvl.tone} style={{ flexShrink: 0 }} />
        <div style={{ flex: '1 1 220px', minWidth: 0, lineHeight: 1.45 }}>
          <b style={{ color: lvl.tone, letterSpacing: 0.4 }}>{lvl.label} · {status.daysLeft} day{status.daysLeft === 1 ? '' : 's'} left</b>
          <span style={{ color: 'rgba(247,243,235,0.7)' }}> — {message(status)}</span>
        </div>
        <div style={{ width: 150, flexShrink: 0, marginLeft: 'auto' }}><SupportContact label="Renew with us" style={{ marginBottom: 0, padding: '8px' }} /></div>
      </div>
      {popup && createPortal(
        <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 100002, background: 'rgba(4,4,4,0.74)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div role="dialog" aria-label="Subscription reminder" onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: '100%', borderRadius: 26, border: `1px solid ${lvl.border}`, background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)), #0a0a0a', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9)', padding: 24, color: IVORY, fontFamily: 'Poppins, Inter, system-ui, sans-serif', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: lvl.bg, border: `1px solid ${lvl.border}`, color: lvl.tone }}><CalendarClock size={20} /></div>
              <button type="button" onClick={dismiss} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(211,191,162,0.2)', background: 'transparent', color: GOLD, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={15} /></button>
            </div>
            <div style={{ fontSize: 10, letterSpacing: 2.4, fontWeight: 800, color: lvl.tone, textTransform: 'uppercase', marginTop: 16 }}>{lvl.label}</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, margin: '6px 0 8px', color: IVORY }}>
              {status.daysLeft} day{status.daysLeft === 1 ? '' : 's'} left
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 13.5, lineHeight: 1.65, color: 'rgba(247,243,235,0.7)' }}>{message(status)}</p>
            <SupportContact label="Contact us to renew" style={{ marginBottom: 10, padding: '12px' }} />
            <button type="button" onClick={dismiss} style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.2)', background: 'transparent', color: 'rgba(247,243,235,0.7)', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Remind me later
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default SubscriptionGate;
