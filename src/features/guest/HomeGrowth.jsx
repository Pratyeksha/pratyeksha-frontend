import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Tag, X, Check, Copy, MessageCircle, AtSign, CalendarDays, Sparkles, ChevronRight, Loader2, Ticket, TrendingUp, Users, BarChart3, Zap } from 'lucide-react';
import API_BASE_URL from '../../shared/lib/apiBase.js';
import { trackSF } from './homeData.js';
import './home-v3.css';

const fmtDate = (d) => { try { return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; } };
const isToday = (d) => d === new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

/* ── tile extras: tagline, highlights, price, today's special ── */
export function TileExtras({ store, labels }) {
  if (!store) return null;
  const chips = (store.highlights || []).slice(0, 2);
  const bits = [];
  if (store.priceForTwo > 0) bits.push(`₹${store.priceForTwo} for two`);
  if (store.cuisines?.length) bits.push(store.cuisines.slice(0, 2).join(' · '));
  return (
    <>
      {store.tagline && <div className="pxg-tag">{store.tagline}</div>}
      {bits.length > 0 && <div className="pxg-bits">{bits.join('  ·  ')}</div>}
      {chips.length > 0 && <div className="pxg-chips">{chips.map((h) => <span key={h}>{labels[h] || h}</span>)}</div>}
      {store.special && <div className="pxg-special"><Zap size={10} /> <b>{store.special.title}</b></div>}
    </>
  );
}

/* ── the claim sheet: a phone number turns into a code, and a lead for the owner ── */
export function ClaimSheet({ offer, tenant, offerLabel, src = 'deals', onClose }) {
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem('px_guest_phone') || ''; } catch { return ''; } });
  const [name, setName] = useState(() => { try { return localStorage.getItem('px_guest_name') || ''; } catch { return ''; } });
  const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [res, setRes] = useState(null); const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', k); ref.current?.focus(); return () => document.removeEventListener('keydown', k); }, [onClose]);
  useEffect(() => { trackSF(tenant.tenantId, 'deal_view', src); }, [tenant.tenantId, src]);
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    const p = phone.replace(/\D/g, '').slice(-10);
    if (p.length !== 10) return setErr('Enter your 10-digit mobile number');
    if (!consent) return setErr('Please tick the box so the restaurant can honour your deal');
    setBusy(true); setErr('');
    try {
      const r = await axios.post(`${API_BASE_URL}/public/offer-claims`, { tenantId: tenant.tenantId, offerId: offer._id, phone: p, name, consent: true, src }, { timeout: 10000 });
      try { localStorage.setItem('px_guest_phone', p); localStorage.setItem('px_guest_name', name); } catch { /* private mode */ }
      setRes(r.data);
    } catch (x) { setErr(x?.response?.data?.error || 'Could not claim this deal. Please try again.'); } finally { setBusy(false); }
  };
  const copy = () => { try { navigator.clipboard?.writeText(res.code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* blocked */ } };
  const until = res?.expiresAt ? new Date(res.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
  return (
    <div className="pxg-scrim" onClick={onClose} role="presentation">
      <div className="pxg-sheet" role="dialog" aria-modal="true" aria-label={`Claim ${offer.title || 'deal'}`} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pxg-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {res ? (
          <div className="pxg-ticket">
            <div className="pxg-tk-top"><Ticket size={16} /> Your deal is ready</div>
            <div className="pxg-tk-offer">{offerLabel(offer)}</div>
            <div className="pxg-tk-rest">{res.restaurant}</div>
            <div className="pxg-tk-code"><span>{res.code}</span><button type="button" onClick={copy} aria-label="Copy code">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
            <p className="pxg-tk-note">Show this code to the staff when you pay.{until ? ` Valid until ${until}.` : ''}</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="pxg-eyebrow"><Tag size={12} /> Claim this deal</div>
            <h3 className="pxg-h">{offerLabel(offer)}</h3>
            <div className="pxg-sub">at {tenant.name}</div>
            <label>Your name <i>(optional)</i><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" /></label>
            <label>Mobile number<input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))} inputMode="numeric" autoComplete="tel" maxLength={14} /></label>
            <label className="pxg-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>I agree to share my name and number with {tenant.name} so they can honour this deal and contact me about it.</span></label>
            {err && <div className="pxg-err" role="alert">{err}</div>}
            <button type="submit" className="pxg-go" disabled={busy}>{busy ? <Loader2 size={16} className="pxg-spin" /> : 'Get my code'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Deals: every live offer, with a claim button ── */
export function DealsSection({ offers, offerLabel, offerTerms, onOpenPlace, Avatar }) {
  const [claim, setClaim] = useState(null);
  const seen = useRef(new Set());
  if (!offers.length) return null;
  const shown = offers.slice(0, 12);
  return (
    <section className="pxg-sec" id="pxg-deals" aria-label="Deals you can claim">
      <div className="pxg-sec-head"><div><div className="pxg-kick"><Tag size={11} /> Deals</div><h2>Claim a deal, then just show up.</h2></div></div>
      <div className="pxg-rail">
        {shown.map((o) => {
          const key = `${o._tenant.tenantId}-${o._id}`;
          return (
            <article className="pxg-deal" key={key} ref={(el) => { if (el && !seen.current.has(key)) { seen.current.add(key); } }}>
              <div className="pxg-deal-top">
                {o.imageUrl && /^https:\/\//i.test(o.imageUrl) ? <img src={o.imageUrl} alt="" loading="lazy" width={44} height={44} /> : <Avatar t={o._tenant} size={44} radius={13} />}
                <div className="pxg-deal-rest"><b>{o._tenant.name}</b>{o._tenant.address?.area ? <span>{o._tenant.address.area}</span> : null}</div>
              </div>
              <div className="pxg-deal-val">{offerLabel(o)}</div>
              {o.title && o.title.toUpperCase() !== offerLabel(o) && <div className="pxg-deal-title">{o.title}</div>}
              {offerTerms(o) && <div className="pxg-deal-terms">{offerTerms(o)}</div>}
              <div className="pxg-deal-cta">
                <button type="button" className="pxg-claim" disabled={!o._id} onClick={() => { trackSF(o._tenant.tenantId, 'deal_tap', 'deals'); setClaim(o); }}>Claim deal</button>
                <button type="button" className="pxg-ghost" onClick={() => onOpenPlace(o._tenant)} aria-label={`View ${o._tenant.name}`}><ChevronRight size={16} /></button>
              </div>
            </article>
          );
        })}
      </div>
      {claim && <ClaimSheet offer={claim} tenant={claim._tenant} offerLabel={offerLabel} onClose={() => setClaim(null)} />}
    </section>
  );
}

/* ── Tonight: specials and events owners posted ── */
export function TonightSection({ tenants, stores, onOpenPlace, Avatar }) {
  const items = [];
  for (const t of tenants) {
    const s = stores[t.tenantId]; if (!s) continue;
    if (s.special) items.push({ kind: 'special', t, title: s.special.title, text: s.special.text, when: 'Today' });
    for (const e of (s.events || []).slice(0, 2)) items.push({ kind: 'event', t, title: e.title, text: e.desc, when: `${isToday(e.date) ? 'Today' : fmtDate(e.date)}${e.time ? ` · ${e.time}` : ''}`, date: e.date });
  }
  if (!items.length) return null;
  items.sort((a, b) => (a.kind === b.kind ? (a.date || '').localeCompare(b.date || '') : a.kind === 'special' ? -1 : 1));
  return (
    <section className="pxg-sec" id="pxg-happening" aria-label="Happening now and soon">
      <div className="pxg-sec-head"><div><div className="pxg-kick"><Sparkles size={11} /> Happening</div><h2>Specials and events near you.</h2></div></div>
      <div className="pxg-rail">
        {items.slice(0, 14).map((it, i) => (
          <button type="button" key={`${it.t.tenantId}-${i}`} className={`pxg-tonight ${it.kind}`} onClick={() => { trackSF(it.t.tenantId, it.kind, 'tonight'); onOpenPlace(it.t); }}>
            <span className="pxg-when">{it.kind === 'special' ? <Zap size={11} /> : <CalendarDays size={11} />} {it.when}</span>
            <span className="pxg-tn-title">{it.title}</span>
            {it.text && <span className="pxg-tn-text">{it.text}</span>}
            <span className="pxg-tn-rest"><Avatar t={it.t} size={22} radius={7} /> {it.t.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── place detail: about, highlights, special, events, deals, WhatsApp, Instagram ── */
export function DetailExtras({ t, store, labels, offers, offerLabel, offerTerms }) {
  const [claim, setClaim] = useState(null);
  const hasAny = store || offers.length;
  if (!hasAny) return null;
  const wa = store?.whatsapp ? `https://wa.me/91${store.whatsapp}?text=${encodeURIComponent(`Hi ${t.name}, I found you on Pratyeksha.`)}` : '';
  return (
    <div className="pxg-detail">
      {store?.about && <p className="pxg-about">{store.about}</p>}
      {store?.highlights?.length > 0 && <div className="pxg-chips big">{store.highlights.map((h) => <span key={h}>{labels[h] || h}</span>)}</div>}
      {store?.special && <div className="pxg-special-card"><div className="pxg-kick"><Zap size={11} /> Today's special</div><b>{store.special.title}</b>{store.special.text && <span>{store.special.text}</span>}</div>}
      {offers.length > 0 && (
        <div className="pxg-d-block"><div className="pxg-kick"><Tag size={11} /> Deals here</div>
          {offers.slice(0, 4).map((o) => (
            <div className="pxg-d-deal" key={o._id || o.title}>
              <div><b>{offerLabel(o)}</b>{offerTerms(o) && <span>{offerTerms(o)}</span>}</div>
              <button type="button" className="pxg-claim sm" disabled={!o._id} onClick={() => { trackSF(t.tenantId, 'deal_tap', 'detail'); setClaim(o); }}>Claim</button>
            </div>
          ))}
        </div>
      )}
      {store?.events?.length > 0 && (
        <div className="pxg-d-block"><div className="pxg-kick"><CalendarDays size={11} /> Coming up</div>
          {store.events.map((e) => <div className="pxg-d-event" key={`${e.date}-${e.title}`} onClick={() => trackSF(t.tenantId, 'event', 'detail')}><span className="pxg-d-date">{isToday(e.date) ? 'Today' : fmtDate(e.date)}{e.time ? ` · ${e.time}` : ''}</span><b>{e.title}</b>{e.desc && <span>{e.desc}</span>}</div>)}
        </div>
      )}
      {(wa || store?.instagram) && (
        <div className="pxg-d-links">
          {wa && <a className="pxg-link wa" href={wa} target="_blank" rel="noopener noreferrer" onClick={() => trackSF(t.tenantId, 'whatsapp', 'detail')}><MessageCircle size={14} /> WhatsApp</a>}
          {store.instagram && <a className="pxg-link" href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer" onClick={() => trackSF(t.tenantId, 'instagram', 'detail')}><AtSign size={14} /> @{store.instagram}</a>}
        </div>
      )}
      {claim && <ClaimSheet offer={claim} tenant={t} offerLabel={offerLabel} src="detail" onClose={() => setClaim(null)} />}
    </div>
  );
}

/* ── desktop hero panel: what is on today, so the right half of the page earns its space ── */
export function HeroPanel({ deals, stores, tenants }) {
  const [today] = useState(() => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10));
  let specials = 0, events = 0;
  for (const t of tenants) { const st = stores[t.tenantId]; if (!st) continue; if (st.special) specials += 1; events += (st.events || []).filter((e) => e.date >= today).length; }
  const rows = [[deals, 'live deals to claim'], [specials, "today's specials"], [events, 'upcoming events']].filter(([n]) => n > 0);
  if (!rows.length) return null;
  return (
    <aside className="pxg-panel" aria-label="Today on Pratyeksha">
      <div className="pxg-kick"><Sparkles size={11} /> Today on Pratyeksha</div>
      <div className="pxg-panel-rows">{rows.map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}</div>
    </aside>
  );
}

/* ── highlight filter row ── */
export function HighlightFilter({ labels, stores, tenants, value, onChange }) {
  const counts = {};
  for (const t of tenants) for (const h of stores[t.tenantId]?.highlights || []) counts[h] = (counts[h] || 0) + 1;
  const ids = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 10);
  if (!ids.length) return null;
  return (
    <div className="pxg-hl" role="toolbar" aria-label="Filter by what the place offers">
      {ids.map((id) => <button type="button" key={id} aria-pressed={value.includes(id)} className={value.includes(id) ? 'on' : ''} onClick={() => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])}>{labels[id] || id}<em>{counts[id]}</em></button>)}
    </div>
  );
}

/* ── for owners: why being listed brings guests ── */
export function OwnerPitch({ stats, href, ctaLabel = 'Get my place listed' }) {
  const strong = stats && (stats.guestOpens7d >= 50 || stats.dealsClaimed30d >= 10);
  const nums = [];
  if (stats) {
    if (stats.places > 0) nums.push([stats.places, 'places listed']);
    if (stats.guestOpens7d >= 50) nums.push([stats.guestOpens7d, 'guest visits to listings this week']);
    if (stats.guestActions7d >= 10) nums.push([stats.guestActions7d, 'calls and direction taps this week']);
    if (stats.dealsClaimed30d >= 5) nums.push([stats.dealsClaimed30d, 'deals claimed this month']);
  }
  return (
    <section className="pxg-owner" aria-label="For restaurant and cafe owners">
      <div className="pxg-owner-in">
        <div className="pxg-kick gold"><TrendingUp size={11} /> For restaurant and cafe owners</div>
        <h2>Let hungry guests find <em>your</em> place first.</h2>
        <p>Every guest on this page is already looking for somewhere to eat. Get listed and you also get the tools to turn a look into a table.</p>
        <div className="pxg-owner-grid">
          <div><Users size={18} /><b>Be found</b><span>A tile with your photo, hours, area and what makes you special, plus a Featured spot for launches.</span></div>
          <div><Ticket size={18} /><b>Win guests with deals</b><span>Post a deal and guests claim it with their number. You get a consented lead and a code to honour at the counter.</span></div>
          <div><BarChart3 size={18} /><b>See what works</b><span>Views, taps, calls, directions, claims and redemptions for your place only, in your owner dashboard.</span></div>
        </div>
        {nums.length > 0 && strong && <div className="pxg-owner-nums">{nums.map(([n, l]) => <div key={l}><b>{Number(n).toLocaleString('en-IN')}</b><span>{l}</span></div>)}</div>}
        <a className="pxg-owner-cta" href={href} target="_blank" rel="noopener noreferrer">{ctaLabel} <ChevronRight size={16} /></a>
      </div>
    </section>
  );
}

