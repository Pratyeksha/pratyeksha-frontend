import React, { useCallback, useEffect, useMemo, useState } from 'react';

const inp = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.25)', color: 'inherit', fontSize: 13, minWidth: 0, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
const btn = (primary) => ({ padding: '10px 16px', borderRadius: 10, border: primary ? '1px solid #d3bfa2' : '1px solid rgba(255,255,255,0.2)', background: primary ? '#d3bfa2' : 'transparent', color: primary ? '#17120a' : 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit' });
const lab = { fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65, fontWeight: 800, marginBottom: 6, display: 'block' };
const errText = (e) => e?.response?.data?.error || 'Something went wrong. Try again.';
const todayIst = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const blank = { tagline: '', about: '', highlights: [], cuisines: [], priceForTwo: 0, whatsapp: '', instagram: '', special: { title: '', text: '', until: '' }, events: [] };

function Field({ label, hint, children }) { return <label style={{ display: 'block' }}><span style={lab}>{label}</span>{children}{hint && <span style={{ display: 'block', fontSize: 11, opacity: 0.55, marginTop: 5 }}>{hint}</span>}</label>; }

function Funnel({ t }) {
  const steps = [['Seen in the list', t.seen], ['Opened your place', t.opened], ['Called / directions / WhatsApp', t.calls + t.directions + t.whatsapp], ['Claimed a deal', t.claimed], ['Redeemed at your counter', t.redeemed]];
  const max = Math.max(1, ...steps.map((s) => s[1]));
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {steps.map(([l, n], i) => (
        <div key={l}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}><span>{l}</span><b>{n.toLocaleString('en-IN')}</b></div>
          <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}><div style={{ width: `${Math.max(n ? 3 : 0, (n / max) * 100)}%`, height: '100%', borderRadius: 99, background: i >= 3 ? '#34d399' : '#d3bfa2', transition: 'width .5s' }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function OwnerStorefront({ api, tenantId, ChartCard, StatBlock }) {
  const [sf, setSf] = useState(null); const [opts, setOpts] = useState({}); const [msg, setMsg] = useState(null); const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null); const [leads, setLeads] = useState([]); const [days, setDays] = useState(30); const [cuis, setCuis] = useState('');
  const base = `/api/owner`; const t = encodeURIComponent(tenantId);
  const loadStore = useCallback(async () => { try { const r = await api.get(`${base}/storefront/${t}`); setSf({ ...blank, ...r.data.storefront, special: { ...blank.special, ...(r.data.storefront.special || {}) } }); setOpts(r.data.highlightOptions || {}); setCuis((r.data.storefront.cuisines || []).join(', ')); } catch (e) { setSf(blank); setMsg({ ok: false, text: errText(e) }); } }, [api, base, t]);
  const loadStats = useCallback(async () => { try { const [s, l] = await Promise.all([api.get(`${base}/storefront-stats/${t}`, { params: { days } }), api.get(`${base}/deal-claims/${t}`)]); setStats(s.data); setLeads(l.data); } catch { setStats(null); } }, [api, base, t, days]);
  useEffect(() => { const h = setTimeout(loadStore, 0); return () => clearTimeout(h); }, [loadStore]);
  useEffect(() => { const h = setTimeout(loadStats, 0); return () => clearTimeout(h); }, [loadStats]);

  const set = (k, v) => setSf((x) => ({ ...x, [k]: v }));
  const toggleHl = (id) => setSf((x) => ({ ...x, highlights: x.highlights.includes(id) ? x.highlights.filter((h) => h !== id) : x.highlights.length >= 6 ? x.highlights : [...x.highlights, id] }));
  const setEvent = (i, k, v) => setSf((x) => ({ ...x, events: x.events.map((e, j) => (j === i ? { ...e, [k]: v } : e)) }));
  const save = async () => {
    setSaving(true); setMsg(null);
    try { await api.put(`${base}/storefront/${t}`, { ...sf, cuisines: cuis.split(',').map((c) => c.trim()).filter(Boolean), priceForTwo: Number(sf.priceForTwo) || 0 }); setMsg({ ok: true, text: 'Saved. Guests see this on the home page within a minute.' }); await loadStore(); }
    catch (e) { setMsg({ ok: false, text: errText(e) }); } finally { setSaving(false); }
  };
  const csv = async () => { try { const r = await api.get(`${base}/deal-claims/${t}`, { params: { format: 'csv' }, responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = 'deal-leads.csv'; a.click(); URL.revokeObjectURL(a.href); } catch (e) { setMsg({ ok: false, text: errText(e) }); } };
  const completeness = useMemo(() => {
    if (!sf) return 0; const checks = [sf.tagline, sf.about, sf.highlights.length >= 2, cuis.trim(), Number(sf.priceForTwo) > 0, sf.whatsapp, sf.instagram, sf.special.title, sf.events.length];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [sf, cuis]);
  if (!sf) return <div style={{ padding: 30, opacity: 0.6 }}>Loading…</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <ChartCard title="Your storefront on the guest home page" hint="Everything here is shown to guests browsing Pratyeksha. Fill it in to stand out and get claimed deals, calls and walk-ins.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}><div style={{ width: `${completeness}%`, height: '100%', background: completeness === 100 ? '#34d399' : '#d3bfa2', transition: 'width .4s' }} /></div>
          <b style={{ fontSize: 12.5 }}>{completeness}% complete</b>
        </div>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
          <Field label="Tagline" hint={`${sf.tagline.length}/80. One line that makes someone want to walk in.`}><input style={inp} maxLength={80} value={sf.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Slow mornings, strong coffee" /></Field>
          <Field label="Cuisines" hint="Up to 5, separated by commas"><input style={inp} value={cuis} onChange={(e) => setCuis(e.target.value)} placeholder="Kolhapuri, North Indian" /></Field>
          <Field label="Average price for two (₹)"><input style={inp} type="number" min="0" value={sf.priceForTwo || ''} onChange={(e) => set('priceForTwo', e.target.value)} /></Field>
          <Field label="WhatsApp number" hint="Guests can message you in one tap"><input style={inp} inputMode="numeric" value={sf.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="98XXXXXXXX" /></Field>
          <Field label="Instagram"><input style={inp} value={sf.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="yourhandle" /></Field>
        </div>
        <div style={{ marginTop: 14 }}><Field label="About your place" hint={`${sf.about.length}/280`}><textarea style={{ ...inp, minHeight: 74, resize: 'vertical' }} maxLength={280} value={sf.about} onChange={(e) => set('about', e.target.value)} /></Field></div>
        <div style={{ marginTop: 14 }}>
          <span style={lab}>What makes you special <span style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.7 }}>(pick up to 6)</span></span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(opts).map(([id, l]) => { const on = sf.highlights.includes(id); return <button key={id} type="button" aria-pressed={on} onClick={() => toggleHl(id)} style={{ ...btn(on), padding: '8px 13px', fontWeight: 700 }}>{l}</button>; })}
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Today's special" hint="Shown on your tile and in the Happening section until the date you choose. Great for cold-brew-at-₹99 style hooks.">
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          <Field label="Headline"><input style={inp} maxLength={60} value={sf.special.title} onChange={(e) => set('special', { ...sf.special, title: e.target.value })} placeholder="Wood-fired pizza + drink ₹349" /></Field>
          <Field label="Details"><input style={inp} maxLength={160} value={sf.special.text} onChange={(e) => set('special', { ...sf.special, text: e.target.value })} placeholder="Until 6 pm today" /></Field>
          <Field label="Show until"><input style={inp} type="date" min={todayIst()} value={sf.special.until} onChange={(e) => set('special', { ...sf.special, until: e.target.value })} /></Field>
        </div>
        {sf.special.title && <button type="button" style={{ ...btn(), marginTop: 12 }} onClick={() => set('special', { title: '', text: '', until: '' })}>Remove special</button>}
      </ChartCard>

      <ChartCard title="Upcoming events" hint="Live music, quiz nights, tastings. Up to 5. Past events disappear on their own.">
        {sf.events.map((e, i) => (
          <div key={i} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', alignItems: 'end', padding: '12px 0', borderTop: i ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
            <Field label="Event"><input style={inp} maxLength={60} value={e.title} onChange={(x) => setEvent(i, 'title', x.target.value)} /></Field>
            <Field label="Date"><input style={inp} type="date" min={todayIst()} value={e.date} onChange={(x) => setEvent(i, 'date', x.target.value)} /></Field>
            <Field label="Time"><input style={inp} type="time" value={e.time} onChange={(x) => setEvent(i, 'time', x.target.value)} /></Field>
            <Field label="One line"><input style={inp} maxLength={140} value={e.desc} onChange={(x) => setEvent(i, 'desc', x.target.value)} /></Field>
            <button type="button" style={btn()} onClick={() => setSf((x) => ({ ...x, events: x.events.filter((_, j) => j !== i) }))}>Remove</button>
          </div>
        ))}
        {sf.events.length < 5 && <button type="button" style={{ ...btn(), marginTop: 8 }} onClick={() => setSf((x) => ({ ...x, events: [...x.events, { title: '', date: '', time: '', desc: '' }] }))}>+ Add event</button>}
      </ChartCard>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" style={btn(true)} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save storefront'}</button>
        {msg && <span role="status" style={{ fontSize: 12.5, color: msg.ok ? '#34d399' : '#f87171' }}>{msg.text}</span>}
      </div>

      <ChartCard title="What your storefront is bringing in" hint="Only your place, counted anonymously. Deals are created in Offers.">
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[7, 30, 90].map((d) => <button key={d} type="button" style={{ ...btn(days === d), padding: '7px 13px' }} onClick={() => setDays(d)}>{d} days</button>)}
        </div>
        {!stats ? <div style={{ opacity: 0.6, fontSize: 13 }}>No data yet.</div> : (<>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', marginBottom: 18 }}>
            <StatBlock label="DEALS CLAIMED" value={stats.totals.claimed} /><StatBlock label="REDEEMED" value={stats.totals.redeemed} /><StatBlock label="REDEEM RATE" value={`${stats.redeemRate}%`} />
            <StatBlock label="WHATSAPP TAPS" value={stats.totals.whatsapp} /><StatBlock label="SPECIAL / EVENT TAPS" value={stats.totals.specialTaps + stats.totals.eventTaps} />
          </div>
          <Funnel t={stats.totals} />
          {stats.deals.length > 0 && (<div style={{ marginTop: 18 }}><span style={lab}>Deals by claims</span>
            {stats.deals.map((d) => <div key={d.offerId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 13 }}><span>{d.title}</span><span><b>{d.claimed}</b> claimed · <b style={{ color: '#34d399' }}>{d.redeemed}</b> redeemed</span></div>)}</div>)}
          <div style={{ marginTop: 18 }}><span style={lab}>Where guests came from</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{Object.entries(stats.sections).filter(([, n]) => n > 0).map(([k, n]) => <span key={k} style={{ padding: '6px 11px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.15)', fontSize: 12 }}>{{ tonight: 'Happening', deals: 'Deals', tile: 'Place list', detail: 'Place page', featured: 'Featured', map: 'Map' }[k]} · <b>{n}</b></span>)}{Object.values(stats.sections).every((n) => !n) && <span style={{ opacity: 0.6, fontSize: 12.5 }}>Appears once guests tap your specials, events and deals.</span>}</div></div>
        </>)}
      </ChartCard>

      <ChartCard title="Guests who claimed your deals" hint="These guests agreed to share their number with you for the deal. Greet them, honour the code, and invite them back.">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}><button type="button" style={btn()} onClick={csv}>Download leads CSV</button></div>
        {leads.length === 0 ? <div style={{ opacity: 0.6, fontSize: 13 }}>No claims yet. Post a deal in Offers and it appears on the guest home page.</div> : (
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: 'left', opacity: 0.6, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}><th style={{ padding: 8 }}>Guest</th><th>Phone</th><th>Deal</th><th>Code</th><th>Status</th><th>Claimed</th></tr></thead>
            <tbody>{leads.slice(0, 50).map((c) => (<tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}><td style={{ padding: 8 }}>{c.name || '–'}</td><td>{c.phone}</td><td>{c.offerTitle}</td><td style={{ fontFamily: 'monospace' }}>{c.code}</td><td style={{ color: c.status === 'redeemed' ? '#34d399' : c.status === 'expired' ? '#8a8a8a' : '#fbbf24' }}>{c.status}</td><td>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</td></tr>))}</tbody></table></div>)}
      </ChartCard>
    </div>
  );
}
