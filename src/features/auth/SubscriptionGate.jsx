import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { CalendarClock, Phone, Mail, MapPin, MessageCircle, LogOut, RefreshCw, X } from 'lucide-react';
import API_BASE_URL from '../../shared/lib/apiBase.js';
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
const COPPER = '#c9aa88';
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

const ADD_DAYS = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString(); };

const EXPIRED_CSS = `
@keyframes pxx-float{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(28px,-34px,0) scale(1.12)}}
@keyframes pxx-float2{0%,100%{transform:translate3d(0,0,0) scale(1.05)}50%{transform:translate3d(-34px,26px,0) scale(.94)}}
@keyframes pxx-rise{from{opacity:0;transform:translateY(22px) scale(.985)}to{opacity:1;transform:none}}
@keyframes pxx-spin{to{transform:rotate(360deg)}}
@keyframes pxx-spinr{to{transform:rotate(-360deg)}}
@keyframes pxx-pulse{0%{transform:scale(.8);opacity:.55}100%{transform:scale(1.7);opacity:0}}
@keyframes pxx-sand{0%{transform:translateY(-4px);opacity:0}30%{opacity:1}100%{transform:translateY(22px);opacity:0}}
@keyframes pxx-shine{from{transform:translateX(-120%)}to{transform:translateX(220%)}}
@keyframes pxx-draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
@keyframes pxx-dot{0%,100%{box-shadow:0 0 0 0 rgba(201,170,136,.55)}50%{box-shadow:0 0 0 7px rgba(201,170,136,0)}}
.pxx-in{opacity:0;animation:pxx-rise .7s cubic-bezier(.2,.8,.2,1) forwards}
.pxx-row{transition:transform .25s ease,border-color .25s ease,background .25s ease}
.pxx-row:hover{transform:translateY(-2px);border-color:rgba(211,191,162,.45)!important;background:linear-gradient(160deg,rgba(255,255,255,.09),rgba(255,255,255,.03))!important}
.pxx-cta{position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .25s ease}
.pxx-cta:hover{transform:translateY(-2px);box-shadow:0 14px 34px -12px rgba(211,191,162,.65)}
.pxx-cta::after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);animation:pxx-shine 3.2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.pxx-in,.pxx-cta::after,[class^=pxx-],[style*=pxx-]{animation:none!important;opacity:1!important}}
`;

const shell = { minHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: '28px 16px', boxSizing: 'border-box', background: '#050505', color: IVORY, fontFamily: 'Poppins, Inter, system-ui, sans-serif' };
const linkRow = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(211,191,162,0.16)', background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))', color: IVORY, textDecoration: 'none', fontSize: 13.5, fontWeight: 600, textAlign: 'left' };
const ico = { width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(211,191,162,0.1)', border: '1px solid rgba(211,191,162,0.22)', color: GOLD };

function Step({ done, now, title, text, delay }) {
  return (
    <div className="pxx-in" style={{ display: 'flex', gap: 12, textAlign: 'left', animationDelay: `${delay}s` }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ width: 14, height: 14, borderRadius: 99, marginTop: 3, background: now ? COPPER : done ? GOLD : 'transparent', border: `2px solid ${now || done ? COPPER : 'rgba(211,191,162,0.35)'}`, animation: now ? 'pxx-dot 2s ease-in-out infinite' : 'none' }} />
        <span style={{ flex: 1, width: 2, margin: '4px 0', background: 'linear-gradient(rgba(211,191,162,0.4), rgba(211,191,162,0.08))' }} />
      </div>
      <div style={{ paddingBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: now ? COPPER : IVORY }}>{title}</div>
        <div style={{ fontSize: 12, lineHeight: 1.55, color: 'rgba(247,243,235,0.58)', marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}

export function ExpiredPage({ name, planExpiry, logoUrl, reason, graceDays, graceEndsAt, onRetry, onSignOut }) {
  const paused = reason === 'disabled';
  const [busy, setBusy] = useState(false);
  const retry = async () => { if (!onRetry) return; setBusy(true); try { await onRetry(); } finally { setBusy(false); } };
  const days = Number.isFinite(Number(graceDays)) && graceDays !== null && graceDays !== undefined ? Number(graceDays) : 10;
  const cutoff = graceEndsAt || (planExpiry ? ADD_DAYS(planExpiry, days) : null);
  const who = name || 'Your restaurant';
  const title = paused ? `${who} is paused` : 'Access is switched off';
  const lead = paused
    ? 'The Pratyeksha team has paused this account for now. Nothing has been deleted.'
    : `${who}’s subscription ended${planExpiry ? ` on ${fmtDate(planExpiry)}` : ''}${days ? `, and the ${days}-day grace period that followed${cutoff ? ` finished on ${fmtDate(cutoff)}` : ' has finished'}` : ''}. Because it wasn’t renewed in time, access has been switched off automatically.`;
  const blocked = [
    ['Staff & kitchen sign-in', 'Owner, operator and kitchen screens are locked.'],
    ['Guest ordering', 'The QR menu and online ordering are paused, so guests can’t place orders.'],
    ['Public listing', 'Your restaurant is hidden from the Pratyeksha directory.'],
  ];
  return (
    <div style={shell}>
      <style>{EXPIRED_CSS}</style>
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(211,191,162,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(211,191,162,0.05) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 72%)', WebkitMaskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 72%)' }} />
      <div aria-hidden style={{ position: 'absolute', width: 520, height: 520, left: '-8%', top: '-14%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(211,191,162,0.22), transparent 65%)', filter: 'blur(30px)', animation: 'pxx-float 14s ease-in-out infinite' }} />
      <div aria-hidden style={{ position: 'absolute', width: 460, height: 460, right: '-8%', bottom: '-14%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,120,100,0.2), transparent 65%)', filter: 'blur(34px)', animation: 'pxx-float2 17s ease-in-out infinite' }} />

      <div className="pxx-in" style={{ position: 'relative', width: 520, maxWidth: '100%', borderRadius: 30, border: '1px solid rgba(211,191,162,0.22)', background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)), rgba(10,10,10,0.82)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', boxShadow: '0 50px 120px -30px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08)', padding: '36px 26px 26px', textAlign: 'center' }}>
        {/* animated hourglass emblem */}
        <div style={{ position: 'relative', width: 104, height: 104, margin: '0 auto 20px', display: 'grid', placeItems: 'center' }}>
          <span aria-hidden style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px solid rgba(201,170,136,0.5)', animation: 'pxx-pulse 2.8s ease-out infinite' }} />
          <span aria-hidden style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px solid rgba(201,170,136,0.5)', animation: 'pxx-pulse 2.8s ease-out 1.4s infinite' }} />
          <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px dashed rgba(211,191,162,0.4)', animation: 'pxx-spin 26s linear infinite' }} />
          <span aria-hidden style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '1px solid rgba(211,191,162,0.25)', borderTopColor: COPPER, animation: 'pxx-spinr 7s linear infinite' }} />
          {logoUrl ? (
            <img src={logoUrl} alt="" style={{ width: 54, height: 54, borderRadius: 16, objectFit: 'cover', border: '1px solid rgba(211,191,162,0.4)', filter: 'grayscale(.5)' }} />
          ) : (
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12M6 21h12" /><path pathLength="100" strokeDasharray="100" style={{ animation: 'pxx-draw 1.6s ease forwards' }} d="M7 3c0 5 3 6 5 9-2 3-5 4-5 9M17 3c0 5-3 6-5 9 2 3 5 4 5 9" />
              <path d="M12 16v3" style={{ animation: 'pxx-sand 1.8s ease-in infinite' }} />
            </svg>
          )}
        </div>

        <div style={{ fontSize: 10, letterSpacing: 3, fontWeight: 800, color: COPPER, textTransform: 'uppercase' }}>{paused ? 'Account paused' : 'Subscription ended · grace period over'}</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(27px, 6vw, 34px)', fontWeight: 700, margin: '10px 0 12px', lineHeight: 1.12, background: 'linear-gradient(120deg, #fff8ea, #d3bfa2 55%, #c9aa88)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{title}</h1>
        <p style={{ margin: '0 auto 22px', maxWidth: 410, fontSize: 13.5, lineHeight: 1.7, color: 'rgba(247,243,235,0.72)' }}>{lead}</p>

        {!paused && (
          <div className="pxx-in" style={{ animationDelay: '.15s', textAlign: 'left', padding: '16px 16px 4px', marginBottom: 16, borderRadius: 18, border: '1px solid rgba(211,191,162,0.14)', background: 'rgba(255,255,255,0.025)' }}>
            <Step done title="Plan ended" text={planExpiry ? fmtDate(planExpiry) : 'Your plan reached its end date.'} delay={0.25} />
            {days > 0 && <Step done title={`${days}-day grace period`} text="Everything kept working while renewal reminders were sent to you." delay={0.35} />}
            <Step now title="Access switched off" text={cutoff ? `${fmtDate(cutoff)} — no renewal was received by then.` : 'No renewal was received in time.'} delay={0.45} />
            <Step title="Renew to resume" text="Once the renewal is confirmed, everything switches back on, usually within minutes." delay={0.55} />
          </div>
        )}

        {!paused && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 800, color: GOLD, textTransform: 'uppercase', paddingLeft: 2 }}>What is paused right now</div>
            {blocked.map(([t, d], i) => (
              <div key={t} className="pxx-in pxx-row" style={{ animationDelay: `${0.5 + i * 0.08}s`, padding: '10px 14px', borderRadius: 13, border: '1px solid rgba(211,191,162,0.14)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{t}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(247,243,235,0.56)', marginTop: 1 }}>{d}</div>
              </div>
            ))}
          </div>
        )}

        <div className="pxx-in" style={{ animationDelay: '.7s', display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', padding: '12px 14px', marginBottom: 18, borderRadius: 14, border: '1px solid rgba(211,191,162,0.3)', background: 'linear-gradient(135deg, rgba(211,191,162,0.12), rgba(211,191,162,0.03))' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5L15.5 10" /></svg>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(247,243,235,0.8)' }}><b style={{ color: IVORY }}>Your data is safe.</b> Menu, orders, customers, reports and settings are all kept exactly as they were. Nothing is lost by renewing late.</div>
        </div>

        <div className="pxx-in" style={{ animationDelay: '.75s', display: 'grid', gap: 9, marginBottom: 18 }}>
          <a className="pxx-cta" href={`https://wa.me/${SUPPORT.phones[0].tel.replace('+', '')}?text=${encodeURIComponent(`Hello Pratyeksha, my plan${name ? ` for ${name}` : ''} has ended and I would like to renew my subscription.`)}`} target="_blank" rel="noreferrer" style={{ ...linkRow, justifyContent: 'center', border: '1px solid rgba(211,191,162,0.55)', background: 'linear-gradient(135deg, #e6d6b8, #d3bfa2 55%, #b99f78)', color: '#111', fontWeight: 800 }}>
            <MessageCircle size={17} /> Renew on WhatsApp
          </a>
          {SUPPORT.phones.map((p) => (
            <a key={p.tel} className="pxx-row" href={`tel:${p.tel}`} style={linkRow}><span style={ico}><Phone size={16} /></span>Call {p.label}</a>
          ))}
          <a className="pxx-row" href={`mailto:${SUPPORT.email}?subject=${encodeURIComponent('Subscription renewal')}`} style={linkRow}><span style={ico}><Mail size={16} /></span>{SUPPORT.email}</a>
          <div style={{ ...linkRow, cursor: 'default' }}><span style={ico}><MapPin size={16} /></span>{SUPPORT.location}</div>
        </div>

        <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <button type="button" onClick={retry} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.5)', background: 'rgba(211,191,162,0.1)', color: IVORY, fontWeight: 700, fontSize: 12, letterSpacing: 0.4, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1 }}>
              <RefreshCw size={14} style={busy ? { animation: 'pxx-spin 1s linear infinite' } : undefined} /> {busy ? 'Checking…' : 'I’ve renewed — check again'}
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
  if (status?.blocked) {
    return <ExpiredPage name={status.name} planExpiry={status.planExpiry} logoUrl={status.logoUrl} reason={status.reason} graceDays={status.graceDays} graceEndsAt={status.graceEndsAt} onRetry={reload} onSignOut={onSignOut} />;
  }
  return children;
}

/* ───────────────────────── renewal reminders ───────────────────────── */

const LEVELS = {
  notice:   { label: 'Renewal reminder', tone: GOLD,   bg: 'rgba(211,191,162,0.07)', border: 'rgba(211,191,162,0.22)', every: 3 * 24 * 3600e3 },
  warning:  { label: 'Plan ending soon', tone: '#e6d6b8', bg: 'rgba(211,191,162,0.11)', border: 'rgba(211,191,162,0.4)',  every: 24 * 3600e3 },
  urgent:   { label: 'Renew now',        tone: COPPER, bg: 'rgba(201,170,136,0.1)',   border: 'rgba(201,170,136,0.42)',  every: 6 * 3600e3 },
  grace:    { label: 'Plan ended — grace period', tone: COPPER, bg: 'rgba(201,120,100,0.14)', border: 'rgba(201,120,100,0.7)', every: 2 * 3600e3 },
  critical: { label: 'Final days',       tone: COPPER, bg: 'rgba(201,170,136,0.16)',  border: 'rgba(201,170,136,0.7)',   every: 3600e3 },
};

const keyFor = (t) => `px_sub_remind_${t}`;
const readSeen = (t) => { try { return JSON.parse(localStorage.getItem(keyFor(t)) || 'null') || {}; } catch { return {}; } };
const writeSeen = (t, v) => { try { localStorage.setItem(keyFor(t), JSON.stringify(v)); } catch { /* storage unavailable */ } };

const message = (s) => {
  if (s.level === 'grace') {
    const g = s.graceDaysLeft;
    return `Your plan ended on ${fmtDate(s.planExpiry)}. Everything still works for ${g} more day${g === 1 ? '' : 's'}; on ${fmtDate(s.graceEndsAt)} the customer app, KDS, Operator and Owner apps will be switched off unless you renew.`;
  }
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
  const lvl = status && !status.blocked ? LEVELS[status.level] : null;

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
  const crit = status.level === 'critical' || status.level === 'grace';

  return (
    <>
      <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', margin: '0 0 12px', borderRadius: 14, border: `1px solid ${lvl.border}`, background: lvl.bg, color: IVORY, fontSize: 12.5, textAlign: 'left', boxShadow: crit ? '0 0 0 1px rgba(201,170,136,0.25), 0 8px 28px -12px rgba(201,170,136,0.45)' : 'none', ...style }}>
        <CalendarClock size={17} color={lvl.tone} style={{ flexShrink: 0 }} />
        <div style={{ flex: '1 1 220px', minWidth: 0, lineHeight: 1.45 }}>
          <b style={{ color: lvl.tone, letterSpacing: 0.4 }}>{lvl.label} · {status.level === 'grace' ? `${status.graceDaysLeft} day${status.graceDaysLeft === 1 ? '' : 's'} until access is off` : `${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'} left`}</b>
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
              {status.level === 'grace' ? `${status.graceDaysLeft} day${status.graceDaysLeft === 1 ? '' : 's'} until access is off` : `${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'} left`}
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
