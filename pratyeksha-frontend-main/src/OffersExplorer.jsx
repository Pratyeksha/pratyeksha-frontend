import React, { useMemo, useState } from 'react';
import { Tag, Clock, ChevronLeft, ChevronRight, Copy, Check, Search, X, Store, Percent, Gift, BadgeIndianRupee } from 'lucide-react';

const GOLD = '#d3bfa2';
const T = {
  en: { all: 'All', pct: '% off', flat: '₹ off', free: 'Free item', happy: 'Happy hour', ending: 'Ending soon', noMin: 'No minimum bill', live: 'Live now', code: 'Has code',
        sort: 'Sort', best: 'Best value', endingS: 'Ending soon', az: 'A–Z', search: 'Search offers or restaurants', none: 'No offers match these filters', clear: 'Clear filters', count: (n) => `${n} offer${n === 1 ? '' : 's'}`,
        back: 'Back to offers', eligibility: 'Who can use it', applies: 'Applies to', allItems: 'Every dish on the menu', only: (c) => `Dishes in “${c}”`, freeOf: (f) => `One free ${f} with your order`, freeAuto: 'A free item with your order',
        minBill: 'Minimum bill', anyBill: 'No minimum bill', validity: 'Validity', noExpiry: 'No end date', endsIn: (t) => `Ends ${t}`, until: 'Valid until', hhWindow: 'Happy hour', activeNow: 'Active now', starts: (t) => `Starts at ${t}`,
        codeH: 'Promo code', copy: 'Copy code', copied: 'Copied', how: 'How it works', howAuto: 'Order as usual. When your order qualifies, the discount is applied by the restaurant when your bill is prepared.', howCode: 'Tell the staff this code (or enter it when asked). The discount is applied when your bill is prepared, if your order qualifies.',
        view: 'View restaurant', saves: 'Saves', off: 'off', discount: 'Discount', today: 'today', tomorrow: 'tomorrow', days: (d) => `in ${d} days`, hours: (h) => `in ${h} h` },
  mr: { all: 'सर्व', pct: '% सूट', flat: '₹ सूट', free: 'मोफत वस्तू', happy: 'हॅपी अवर', ending: 'लवकरच संपते', noMin: 'किमान बिल नाही', live: 'आता सुरू', code: 'कोड आहे',
        sort: 'क्रम', best: 'सर्वोत्तम', endingS: 'लवकरच संपते', az: 'अ–ज्ञ', search: 'ऑफर्स किंवा रेस्टॉरंट शोधा', none: 'या फिल्टरसाठी ऑफर्स नाहीत', clear: 'फिल्टर काढा', count: (n) => `${n} ऑफर्स`,
        back: 'ऑफर्सकडे परत', eligibility: 'कोण वापरू शकते', applies: 'यावर लागू', allItems: 'मेनूमधील प्रत्येक पदार्थ', only: (c) => `“${c}” मधील पदार्थ`, freeOf: (f) => `तुमच्या ऑर्डरसोबत एक मोफत ${f}`, freeAuto: 'ऑर्डरसोबत एक मोफत वस्तू',
        minBill: 'किमान बिल', anyBill: 'किमान बिल नाही', validity: 'वैधता', noExpiry: 'शेवटची तारीख नाही', endsIn: (t) => `संपते ${t}`, until: 'पर्यंत वैध', hhWindow: 'हॅपी अवर', activeNow: 'आता सुरू', starts: (t) => `${t} ला सुरू`,
        codeH: 'प्रोमो कोड', copy: 'कोड कॉपी करा', copied: 'कॉपी झाले', how: 'कसे चालते', howAuto: 'नेहमीप्रमाणे ऑर्डर करा. ऑर्डर पात्र असल्यास बिल तयार करताना रेस्टॉरंट सवलत लावते.', howCode: 'हा कोड स्टाफला सांगा. ऑर्डर पात्र असल्यास बिल तयार करताना सवलत लागू होते.',
        view: 'रेस्टॉरंट पहा', saves: 'बचत', off: 'सूट', discount: 'सवलत', today: 'आज', tomorrow: 'उद्या', days: (d) => `${d} दिवसांत`, hours: (h) => `${h} तासांत` },
};
const KIND = { percent_off: 'pct', fixed_off: 'flat', free_item: 'free', happy_hour: 'happy' };
const toMin = (hhmm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const istMinutes = (now = new Date()) => ((now.getUTCHours() * 60 + now.getUTCMinutes()) + 330) % 1440;
const hhActive = (o, now = new Date()) => { const a = toMin(o.happyStart), b = toMin(o.happyEnd); if (a === null || b === null || a === b) return false; const t = istMinutes(now); return a < b ? t >= a && t < b : t >= a || t < b; };
const fmt12 = (hhmm) => { const m = toMin(hhmm); if (m === null) return hhmm || '?'; const h = Math.floor(m / 60), mi = m % 60; return `${((h + 11) % 12) + 1}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const headline = (o) => {
  const v = Number(o.value);
  if (o.type === 'percent_off') return Number.isFinite(v) ? `${v}% OFF` : 'OFFER';
  if (o.type === 'fixed_off') return Number.isFinite(v) ? `₹${v} OFF` : 'OFFER';
  if (o.type === 'free_item') return `FREE ${String(o.freeItem || 'ITEM').toUpperCase()}`;
  return Number.isFinite(v) && v > 0 ? `${v}% OFF · HAPPY HOUR` : 'HAPPY HOUR';
};
// comparable "value" for sorting: percent offers first (by %), then flat, then free items, then happy hour without a number
const valueRank = (o) => (o.type === 'percent_off' ? 3000 + Number(o.value || 0) : o.type === 'happy_hour' ? 2500 + Number(o.value || 0) : o.type === 'fixed_off' ? 1000 + Number(o.value || 0) : 500);
const endsInHours = (o, now = Date.now()) => (o.expiresAt ? (new Date(o.expiresAt).getTime() - now) / 3600000 : Infinity);
const remaining = (o, tr, now = Date.now()) => {
  if (!o.expiresAt) return tr.noExpiry;
  const h = endsInHours(o, now);
  if (h <= 0) return '';
  if (h < 24) { const d = new Date(o.expiresAt); const sameDay = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === new Date(now).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); return tr.endsInX ? '' : tr.endsIn(sameDay ? tr.today : tr.hours(Math.max(1, Math.round(h)))); }
  const days = Math.ceil(h / 24);
  return tr.endsIn(days === 1 ? tr.tomorrow : tr.days(days));
};

export default function OffersExplorer({ offers = [], lang = 'en', onOpen, Avatar }) {
  const tr = T[lang] || T.en;
  const [type, setType] = useState('all');
  const [endingSoon, setEndingSoon] = useState(false);
  const [noMin, setNoMin] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [codeOnly, setCodeOnly] = useState(false);
  const [sort, setSort] = useState('best');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(false);
  const now = Date.now();

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = offers.filter((o) => {
      if (type !== 'all' && KIND[o.type] !== type) return false;
      if (endingSoon && !(endsInHours(o, now) <= 48)) return false;
      if (noMin && Number(o.minOrder) > 0) return false;
      if (liveOnly && o.type === 'happy_hour' && !hhActive(o)) return false;
      if (codeOnly && !o.code) return false;
      if (t && !`${o.title || ''} ${o.tenant?.name || ''} ${o.tenant?.address?.area || ''} ${o.freeItem || ''} ${o.categoryName || ''}`.toLowerCase().includes(t)) return false;
      return true;
    });
    if (sort === 'ending') out.sort((a, b) => endsInHours(a, now) - endsInHours(b, now));
    else if (sort === 'az') out.sort((a, b) => String(a.tenant?.name || '').localeCompare(String(b.tenant?.name || '')));
    else out.sort((a, b) => valueRank(b) - valueRank(a));
    return out;
  }, [offers, type, endingSoon, noMin, liveOnly, codeOnly, sort, q, now]);

  const chip = (on) => ({ flex: '0 0 auto', padding: '7px 12px', borderRadius: 999, border: `1px solid ${on ? GOLD : 'rgba(211,191,162,.2)'}`, background: on ? 'rgba(211,191,162,.16)' : 'transparent', color: on ? GOLD : 'rgba(255,255,255,.7)', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' });
  const anyFilter = type !== 'all' || endingSoon || noMin || liveOnly || codeOnly || q;
  const clear = () => { setType('all'); setEndingSoon(false); setNoMin(false); setLiveOnly(false); setCodeOnly(false); setQ(''); };

  if (open) {
    const o = open; const tenant = o.tenant || {};
    const hh = o.type === 'happy_hour';
    const active = hh && hhActive(o);
    const row = (label, value) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '11px 0', borderBottom: '1px solid rgba(211,191,162,.1)', fontSize: 12.5 }}>
        <span style={{ color: 'rgba(255,255,255,.5)' }}>{label}</span><span style={{ color: '#f3eee4', textAlign: 'right', fontWeight: 700 }}>{value}</span>
      </div>
    );
    const applies = o.type === 'free_item' ? (o.freeItem ? tr.freeOf(o.freeItem) : tr.freeAuto) : (o.categoryId ? tr.only(o.categoryName || '—') : tr.allItems);
    return (
      <div>
        <button type="button" onClick={() => setOpen(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, color: GOLD, fontWeight: 800, fontSize: 12, cursor: 'pointer', padding: '4px 0 12px' }}><ChevronLeft size={16} /> {tr.back}</button>
        <div style={{ borderRadius: 20, border: '1px solid rgba(211,191,162,.25)', background: 'linear-gradient(160deg, rgba(211,191,162,.12), rgba(211,191,162,.03))', padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {o.imageUrl && /^https:\/\//i.test(o.imageUrl) ? <img src={o.imageUrl} alt="" width={52} height={52} style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} /> : (Avatar ? <Avatar t={tenant} size={52} radius={14} /> : null)}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.55rem', fontWeight: 600, color: GOLD, lineHeight: 1.1 }}>{headline(o)}</div>
              <div style={{ fontSize: 12.5, color: '#f3eee4', marginTop: 4 }}>{o.title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,.65)' }}><Store size={13} /> {tenant.name || 'Restaurant'}{tenant.address?.area ? ` · ${tenant.address.area}` : ''}</div>
        </div>

        <div style={{ marginTop: 16, fontSize: 10, fontWeight: 900, letterSpacing: 1.6, color: 'rgba(211,191,162,.7)' }}>{tr.eligibility.toUpperCase()}</div>
        {row(tr.applies, applies)}
        {row(tr.minBill, Number(o.minOrder) > 0 ? `₹${Number(o.minOrder)}` : tr.anyBill)}
        {hh && row(tr.hhWindow, <>{fmt12(o.happyStart)} – {fmt12(o.happyEnd)} <span style={{ color: active ? '#7fc79a' : 'rgba(255,255,255,.45)' }}>· {active ? tr.activeNow : tr.starts(fmt12(o.happyStart))}</span></>)}
        <div style={{ marginTop: 16, fontSize: 10, fontWeight: 900, letterSpacing: 1.6, color: 'rgba(211,191,162,.7)' }}>{tr.validity.toUpperCase()}</div>
        {row(tr.validity, o.expiresAt ? <>{tr.until} {new Date(o.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}<span style={{ display: 'block', fontSize: 11, color: GOLD }}>{remaining(o, tr)}</span></> : tr.noExpiry)}
        {o.code && (
          <>
            <div style={{ marginTop: 16, fontSize: 10, fontWeight: 900, letterSpacing: 1.6, color: 'rgba(211,191,162,.7)' }}>{tr.codeH.toUpperCase()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px dashed rgba(211,191,162,.5)', fontFamily: 'monospace', fontSize: 16, letterSpacing: 2, color: GOLD, fontWeight: 800 }}>{String(o.code).toUpperCase()}</div>
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(String(o.code).toUpperCase()); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* blocked */ } }} style={{ ...chip(false), display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 12px' }}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? tr.copied : tr.copy}</button>
            </div>
          </>
        )}
        <div style={{ marginTop: 16, fontSize: 10, fontWeight: 900, letterSpacing: 1.6, color: 'rgba(211,191,162,.7)' }}>{tr.how.toUpperCase()}</div>
        <p style={{ margin: '8px 0 16px', fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,.65)' }}>{o.code ? tr.howCode : tr.howAuto}</p>
        <button type="button" onClick={() => onOpen && onOpen(o)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 0, background: GOLD, color: '#14110c', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{tr.view} <ChevronRight size={16} /></button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={14} color="rgba(211,191,162,.6)" style={{ position: 'absolute', left: 12, top: 13 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr.search} aria-label={tr.search} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 34px 11px 34px', borderRadius: 12, border: '1px solid rgba(211,191,162,.2)', background: 'rgba(255,255,255,.04)', color: '#f3eee4', fontSize: 13, outline: 'none' }} />
        {q && <button type="button" onClick={() => setQ('')} aria-label="Clear" style={{ position: 'absolute', right: 8, top: 8, border: 0, background: 'transparent', color: 'rgba(255,255,255,.5)', cursor: 'pointer', padding: 4, display: 'flex' }}><X size={15} /></button>}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
        {[['all', tr.all], ['pct', tr.pct], ['flat', tr.flat], ['free', tr.free], ['happy', tr.happy]].map(([id, label]) => <button key={id} type="button" onClick={() => setType(id)} style={chip(type === id)}>{label}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }} className="no-scrollbar">
        <button type="button" onClick={() => setEndingSoon((v) => !v)} style={chip(endingSoon)}><Clock size={11} style={{ verticalAlign: -1 }} /> {tr.ending}</button>
        <button type="button" onClick={() => setNoMin((v) => !v)} style={chip(noMin)}>{tr.noMin}</button>
        <button type="button" onClick={() => setLiveOnly((v) => !v)} style={chip(liveOnly)}>{tr.live}</button>
        <button type="button" onClick={() => setCodeOnly((v) => !v)} style={chip(codeOnly)}>{tr.code}</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '2px 0 10px' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{tr.count(list.length)}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{tr.sort}
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ background: '#141414', color: GOLD, border: '1px solid rgba(211,191,162,.25)', borderRadius: 8, padding: '5px 8px', fontSize: 11.5 }}>
            <option value="best">{tr.best}</option><option value="ending">{tr.endingS}</option><option value="az">{tr.az}</option>
          </select>
        </label>
      </div>
      {list.length === 0 ? (
        <div style={{ minHeight: 140, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.5)', fontSize: 12.5, textAlign: 'center' }}>
          {tr.none}{anyFilter && <button type="button" onClick={clear} style={chip(false)}>{tr.clear}</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10 }}>
          {list.map((o, i) => {
            const tenant = o.tenant || {}; const Icon = o.type === 'percent_off' || o.type === 'happy_hour' ? Percent : o.type === 'free_item' ? Gift : BadgeIndianRupee;
            const rem = remaining(o, tr, now);
            return (
              <button type="button" key={`${tenant.tenantId}-${o._id ?? o.title}-${i}`} onClick={() => setOpen(o)} style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, border: '1px solid rgba(211,191,162,.2)', background: 'rgba(255,255,255,.03)', color: 'inherit' }}>
                {Avatar ? <Avatar t={tenant} size={42} radius={12} /> : <Icon size={22} color={GOLD} />}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: .3 }}>{headline(o)}</div>
                  <div style={{ fontSize: 11.5, marginTop: 3, color: 'rgba(255,255,255,.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[o.title, tenant.name].filter(Boolean).join(' · ')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', marginTop: 5, fontSize: 10.5, color: 'rgba(255,255,255,.45)' }}>
                    {Number(o.minOrder) > 0 ? <span>{tr.minBill} ₹{Number(o.minOrder)}</span> : <span>{tr.anyBill}</span>}
                    {rem && <span style={{ color: endsInHours(o, now) <= 48 ? '#e0c48f' : 'inherit' }}>{rem}</span>}
                    {o.type === 'happy_hour' && <span style={{ color: hhActive(o) ? '#7fc79a' : 'inherit' }}>{fmt12(o.happyStart)}–{fmt12(o.happyEnd)}</span>}
                    {o.code && <span><Tag size={9} style={{ verticalAlign: -1 }} /> {String(o.code).toUpperCase()}</span>}
                  </div>
                </div>
                <ChevronRight size={15} color={GOLD} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
