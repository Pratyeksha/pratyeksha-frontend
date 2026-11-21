import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Gift, X, Star, Loader2, Copy, Check } from 'lucide-react';
import { API_BASE_URL } from '../../shared/lib/apiBase.js';

const T = {
  en: { perks: 'My perks', title: 'Your rewards', phone: 'Mobile number', check: 'Check', points: 'points', visits: 'visits', next: (n, t) => `Spend ₹${n} more to reach ${t}`, redeem: 'Get code', code: 'Show this code to the staff when you pay', birthday: 'Birthday (so we can surprise you)', save: 'Save', saved: 'Saved', gift: 'Gift card balance', giftPh: 'GC-XXXXXXXX', none: 'No visits found for this number yet. Your points start with your first bill.', rate: 'How was your meal?', thanks: 'Thank you for your feedback!', google: 'Share it on Google', tell: 'Tell us what we could do better (optional)', send: 'Send', later: 'Not now', needMore: 'Not enough points yet' },
  mr: { perks: 'माझे फायदे', title: 'तुमचे रिवॉर्ड्स', phone: 'मोबाईल नंबर', check: 'तपासा', points: 'पॉइंट्स', visits: 'भेटी', next: (n, t) => `${t} साठी आणखी ₹${n} खर्च करा`, redeem: 'कोड मिळवा', code: 'बिल भरताना हा कोड स्टाफला दाखवा', birthday: 'वाढदिवस (आश्चर्य देण्यासाठी)', save: 'सेव्ह', saved: 'सेव्ह झाले', gift: 'गिफ्ट कार्ड शिल्लक', giftPh: 'GC-XXXXXXXX', none: 'या नंबरवर अजून भेटी नाहीत. पहिल्या बिलापासून पॉइंट्स सुरू होतील.', rate: 'जेवण कसे वाटले?', thanks: 'तुमच्या अभिप्रायाबद्दल धन्यवाद!', google: 'Google वर शेअर करा', tell: 'आम्ही काय सुधारू शकतो ते सांगा (ऐच्छिक)', send: 'पाठवा', later: 'नंतर', needMore: 'अजून पुरेसे पॉइंट्स नाहीत' },
};
const err = (e) => e?.response?.data?.error || 'Something went wrong. Try again.';
const phoneOk = (p) => /^\d{10}$/.test(p);

export function PerksButton({ tenantId, lang = 'en', color = '#d3bfa2', phone: phone0 = '', avoid = [] }) {
  const t = T[lang] || T.en; const [open, setOpen] = useState(false);
  return (<>
    <button type="button" onClick={() => setOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 99, border: '1px solid rgba(211,191,162,0.35)', background: 'transparent', color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><Gift size={13} /> {t.perks}</button>
    {open && <PerksSheet tenantId={tenantId} lang={lang} color={color} phone0={phone0} avoid={avoid} onClose={() => setOpen(false)} />}
  </>);
}

function PerksSheet({ tenantId, lang, color, phone0, avoid, onClose }) {
  const t = T[lang] || T.en; const base = `${API_BASE_URL}/guest`; const tid = encodeURIComponent(tenantId);
  const [phone, setPhone] = useState(() => { try { return phone0 || localStorage.getItem('px_guest_phone') || ''; } catch { return phone0 || ''; } });
  const [d, setD] = useState(null); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
  const [bd, setBd] = useState(''); const [code, setCode] = useState(''); const [gc, setGc] = useState(''); const [gcRes, setGcRes] = useState(null); const [copied, setCopied] = useState('');
  const look = useCallback(async (p) => {
    if (!phoneOk(p)) { setMsg({ ok: false, text: lang === 'mr' ? '१० अंकी नंबर टाका' : 'Enter a 10-digit number' }); return; }
    setBusy(true); setMsg(null);
    try { const r = await axios.get(`${base}/loyalty/${tid}`, { params: { phone: p } }); setD(r.data); try { localStorage.setItem('px_guest_phone', p); } catch { /* private mode */ } const pr = await axios.get(`${base}/profile/${tid}`, { params: { phone: p } }); setBd(pr.data.birthday || ''); }
    catch (e) { setMsg({ ok: false, text: err(e) }); } finally { setBusy(false); }
  }, [base, tid, lang]);
  useEffect(() => { if (phoneOk(phone)) { const h = setTimeout(() => look(phone), 0); return () => clearTimeout(h); } return undefined; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const redeem = async (rewardId) => { setMsg(null); try { const r = await axios.post(`${base}/loyalty/${tid}/redeem`, { phone, rewardId }); setCode(r.data.code); await look(phone); } catch (e) { setMsg({ ok: false, text: err(e) }); } };
  const saveProfile = async () => { setMsg(null); try { await axios.put(`${base}/profile/${tid}`, { phone, birthday: bd.length === 10 ? bd.slice(5) : bd, allergens: avoid, lang }); setMsg({ ok: true, text: t.saved }); } catch (e) { setMsg({ ok: false, text: err(e) }); } };
  const checkGc = async () => { setGcRes(null); try { const r = await axios.get(`${base}/gift-card/${encodeURIComponent(gc.trim())}`); setGcRes({ ok: true, text: `₹${r.data.balance} · ${r.data.status}` }); } catch (e) { setGcRes({ ok: false, text: err(e) }); } };
  const copy = (c) => { try { navigator.clipboard?.writeText(c); setCopied(c); setTimeout(() => setCopied(''), 1500); } catch { /* clipboard blocked */ } };
  const inp = { padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(211,191,162,0.25)', background: '#070707', color: '#EFE7D8', fontSize: 14, minWidth: 0, fontFamily: 'inherit' };
  const btn = { padding: '11px 16px', borderRadius: 10, border: 0, background: color, color: '#111', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
  return (
    <div role="dialog" aria-modal="true" aria-label={t.title} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', background: '#0d0d0d', border: '1px solid rgba(211,191,162,.25)', borderRadius: '20px 20px 0 0', padding: 20, color: '#EFE7D8', fontFamily: 'Poppins, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: 17 }}>{t.title}</b><button type="button" aria-label="Close" onClick={onClose} style={{ background: 'none', border: 0, color: '#b4b4b4', cursor: 'pointer' }}><X size={20} /></button></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><input aria-label={t.phone} inputMode="numeric" maxLength={10} style={{ ...inp, flex: 1 }} placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} /><button type="button" style={btn} onClick={() => look(phone)}>{busy ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : t.check}</button></div>
        {msg && <div role="status" style={{ marginTop: 10, fontSize: 12.5, color: msg.ok ? '#34d399' : '#f87171' }}>{msg.text}</div>}
        {d && !d.found && <p style={{ fontSize: 13, color: '#a6a6a6', marginTop: 14 }}>{t.none}</p>}
        {d?.found && (<>
          <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: 'linear-gradient(135deg,#2b2417,#14110b)', border: '1px solid rgba(211,191,162,.3)' }}>
            <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color }}>{d.tier}</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 2 }}>{d.balance} <span style={{ fontSize: 13, fontWeight: 600, color: '#a6a6a6' }}>{t.points}</span></div>
            <div style={{ fontSize: 12, color: '#a6a6a6' }}>{d.visits} {t.visits}{d.nextTier ? ` · ${t.next(d.nextTier.needs, d.nextTier.name)}` : ''}</div>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {d.rewards.map((r) => (<div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(211,191,162,.15)' }}>
              <span style={{ fontSize: 13 }}>{r.label}<div style={{ fontSize: 11, color: '#8a8a8a' }}>{r.points} {t.points}</div></span>
              <button type="button" disabled={d.balance < r.points} onClick={() => redeem(r.id)} style={{ ...btn, padding: '8px 13px', opacity: d.balance < r.points ? 0.35 : 1, cursor: d.balance < r.points ? 'not-allowed' : 'pointer' }}>{t.redeem}</button></div>))}
          </div>
          {[...(code ? [{ code }] : []), ...(d.openCodes || []).filter((c) => c.code !== code)].map((c) => (<div key={c.code} style={{ marginTop: 10, padding: 12, borderRadius: 12, background: 'rgba(52,211,153,.08)', border: '1px dashed rgba(52,211,153,.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><b style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: 1 }}>{c.code}</b><div style={{ fontSize: 11, color: '#8fd19e' }}>{t.code}</div></div>
            <button type="button" aria-label="Copy code" onClick={() => copy(c.code)} style={{ background: 'none', border: 0, color: '#8fd19e', cursor: 'pointer' }}>{copied === c.code ? <Check size={18} /> : <Copy size={18} />}</button></div>))}
          <div style={{ marginTop: 18 }}><div style={{ fontSize: 12, color: '#a6a6a6', marginBottom: 6 }}>{t.birthday}</div>
            <div style={{ display: 'flex', gap: 8 }}><input aria-label={t.birthday} type="date" style={{ ...inp, flex: 1 }} value={bd.length === 5 ? `2000-${bd}` : bd} onChange={(e) => setBd(e.target.value)} /><button type="button" style={btn} onClick={saveProfile}>{t.save}</button></div></div>
        </>)}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(211,191,162,.12)' }}><div style={{ fontSize: 12, color: '#a6a6a6', marginBottom: 6 }}>{t.gift}</div>
          <div style={{ display: 'flex', gap: 8 }}><input aria-label={t.gift} style={{ ...inp, flex: 1, textTransform: 'uppercase' }} placeholder={t.giftPh} value={gc} onChange={(e) => setGc(e.target.value)} /><button type="button" style={btn} onClick={checkGc}>{t.check}</button></div>
          {gcRes && <div role="status" style={{ marginTop: 8, fontSize: 13, color: gcRes.ok ? '#34d399' : '#f87171' }}>{gcRes.text}</div>}</div>
      </div>
    </div>
  );
}

/** Shown once everything on the table is served. 4-5 stars -> invite to Google; 1-3 -> private note to the owner. */
export function ReviewPrompt({ tenantId, orderId, phone = '', name = '', lang = 'en', color = '#d3bfa2' }) {
  const t = T[lang] || T.en; const key = `px_reviewed_${tenantId}_${orderId || 'x'}`;
  const [gone, setGone] = useState(() => { try { return !!localStorage.getItem(key); } catch { return false; } });
  const [stars, setStars] = useState(0); const [text, setText] = useState(''); const [res, setRes] = useState(null); const [busy, setBusy] = useState(false); const [e, setE] = useState('');
  if (gone) return null;
  const done = () => { try { localStorage.setItem(key, '1'); } catch { /* private mode */ } };
  const send = async () => { setBusy(true); setE(''); try { const r = await axios.post(`${API_BASE_URL}/guest/review/${encodeURIComponent(tenantId)}`, { rating: stars, comment: text, orderId, phone, name }); setRes(r.data); done(); } catch (x) { if (x?.response?.status === 409) { done(); setGone(true); } else setE(err(x)); } finally { setBusy(false); } };
  return (
    <div role="group" aria-label={t.rate} style={{ position: 'fixed', left: 14, right: 104, bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', zIndex: 1001, padding: 14, borderRadius: 16, background: 'rgba(18,16,12,.97)', border: '1px solid rgba(211,191,162,.3)', boxShadow: '0 12px 34px rgba(0,0,0,.55)', color: '#EFE7D8', fontFamily: 'Poppins, sans-serif' }}>
      {res ? (<div style={{ fontSize: 13 }}>{t.thanks}{res.googleUrl && <a href={res.googleUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 8, color, fontWeight: 800 }}>{t.google} →</a>}</div>) : (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: 13 }}>{t.rate}</b><button type="button" onClick={() => { done(); setGone(true); }} style={{ background: 'none', border: 0, color: '#8a8a8a', fontSize: 11, cursor: 'pointer' }}>{t.later}</button></div>
        <div style={{ display: 'flex', gap: 4, margin: '8px 0' }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setStars(n)} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2 }}><Star size={26} fill={n <= stars ? '#fbbf24' : 'none'} color={n <= stars ? '#fbbf24' : '#666'} /></button>)}</div>
        {stars > 0 && stars <= 3 && <textarea aria-label={t.tell} placeholder={t.tell} value={text} onChange={(x) => setText(x.target.value)} maxLength={600} rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: 8, borderRadius: 8, border: '1px solid rgba(211,191,162,.25)', background: '#070707', color: '#EFE7D8', fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }} />}
        {e && <div role="alert" style={{ color: '#f87171', fontSize: 12, marginBottom: 6 }}>{e}</div>}
        {stars > 0 && <button type="button" disabled={busy} onClick={send} style={{ padding: '9px 16px', borderRadius: 10, border: 0, background: color, color: '#111', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>{t.send}</button>}
      </>)}
    </div>
  );
}
