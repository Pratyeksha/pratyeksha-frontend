import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, X, Minus, Plus, Search, Lock, Loader2, Check } from 'lucide-react';

/* Guests can change a waitlist, pickup or reservation until the restaurant acts on it. The server is the authority
   (re-prices every dish, refuses once confirmed); this sheet just makes the change easy and the lock honest. */

const GOLD = '#d3bfa2';
const T = {
  en: { edit: 'Edit booking', hint: 'You can change this until the restaurant confirms it.', locked: 'The restaurant has confirmed this. To change anything, please call them.', title: 'Edit your booking', name: 'Name', phone: 'Mobile', guests: 'Guests', date: 'Date', time: 'Time', pickup: 'Pickup time', notes: 'Notes for the restaurant', dishes: 'Your dishes', none: 'No dishes yet', add: 'Add dishes', search: 'Search the menu', half: 'Half', full: 'Full', save: 'Save changes', saving: 'Saving…', saved: 'Booking updated', cancel: 'Close', total: 'Total', extras: 'Extras are kept as they are', needOne: 'A pickup order needs at least one dish.', nochange: 'No changes to save.', phoneBad: 'Enter a 10-digit mobile number.' },
  mr: { edit: 'बुकिंग बदला', hint: 'रेस्टॉरंट निश्चित करेपर्यंत तुम्ही बदल करू शकता.', locked: 'रेस्टॉरंटने हे निश्चित केले आहे. बदलासाठी कृपया त्यांना फोन करा.', title: 'बुकिंग बदला', name: 'नाव', phone: 'मोबाईल', guests: 'जण', date: 'तारीख', time: 'वेळ', pickup: 'पिकअप वेळ', notes: 'रेस्टॉरंटसाठी सूचना', dishes: 'तुमच्या डिश', none: 'अजून डिश नाहीत', add: 'डिश जोडा', search: 'मेनू शोधा', half: 'हाफ', full: 'फुल', save: 'बदल जतन करा', saving: 'जतन करत आहे…', saved: 'बुकिंग बदलले', cancel: 'बंद करा', total: 'एकूण', extras: 'अतिरिक्त वस्तू तशाच राहतात', needOne: 'पिकअप ऑर्डरसाठी किमान एक डिश हवी.', nochange: 'जतन करण्यासारखे बदल नाहीत.', phoneBad: '१० अंकी मोबाईल नंबर टाका.' },
};
const ist = (iso) => { const d = new Date(new Date(iso).getTime() + 330 * 60000); return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16), local: d.toISOString().slice(0, 16) }; };
const unit = (m, portion) => Number(portion === 'Half' ? (m.priceHalf || m.price) : (m.priceFull || m.price)) || 0;
const keyOf = (i) => `${String(i.menuItemId || i.name)}|${i.portion || 'Single'}`;

/* Is this booking still editable? waitlist/pickup: 'waiting' and not fired; reservation: 'pending'. */
const canEditBooking = (entry, kind) => !!entry && (kind === 'reservation' ? entry.status === 'pending' : entry.status === 'waiting' && !entry.kitchenFired);

const field = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', borderRadius: 12, border: '1px solid rgba(211,191,162,0.2)', background: 'rgba(255,255,255,0.04)', color: '#f7f3eb', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };
const lab = { display: 'block', margin: '14px 0 6px', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(211,191,162,0.7)' };
const stepBtn = { width: 30, height: 30, borderRadius: 9, border: '1px solid rgba(211,191,162,0.25)', background: 'rgba(211,191,162,0.08)', color: GOLD, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 };

export default function EditBooking({ entry, kind, tenantId, sessionId, menuItems, language = 'en', baseUrl, onSaved }) {
  const t = T[language === 'mr' ? 'mr' : 'en'];
  const [open, setOpen] = useState(false);
  const editable = canEditBooking(entry, kind);
  if (!entry) return null;
  if (!editable) {
    if (['cancelled', 'no-show'].includes(entry.status)) return null;
    return <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', margin: '0 0 12px', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', fontSize: '0.74rem', lineHeight: 1.55 }}><Lock size={14} style={{ flexShrink: 0, marginTop: 2 }} />{t.locked}</div>;
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{ width: '100%', padding: '15px', marginBottom: 6, borderRadius: 16, border: '1px solid rgba(211,191,162,0.28)', background: 'rgba(211,191,162,0.07)', color: GOLD, fontWeight: 900, fontSize: '0.82rem', letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}><Pencil size={15} strokeWidth={2.4} />{t.edit}</button>
      <div style={{ margin: '0 4px 12px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{t.hint}</div>
      {open && <Sheet entry={entry} kind={kind} tenantId={tenantId} sessionId={sessionId} menuItems={menuItems} t={t} baseUrl={baseUrl} onSaved={(e) => { onSaved?.(e); setOpen(false); }} onClose={() => setOpen(false)} />}
    </>
  );
}

function Sheet({ entry, kind, tenantId, sessionId, menuItems, t, baseUrl, onSaved, onClose }) {
  const isRes = kind === 'reservation';
  const start = useMemo(() => {
    const when = isRes ? ist(entry.reservationTime) : entry.scheduledPickupTime ? ist(entry.scheduledPickupTime) : null;
    return { name: entry.customerName || '', phone: entry.customerPhone || '', party: Number(entry.partySize) || 1, date: when?.date || '', time: when?.time || '', local: when?.local || '', notes: entry.specialRequests || '', items: (entry.items || []).map((i) => ({ ...i })) };
  }, [entry, isRes]);
  const [name, setName] = useState(start.name); const [phone, setPhone] = useState(start.phone); const [party, setParty] = useState(start.party);
  const [date, setDate] = useState(start.date); const [time, setTime] = useState(start.time); const [local, setLocal] = useState(start.local);
  const [notes, setNotes] = useState(start.notes); const [items, setItems] = useState(start.items);
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const dishes = items.filter((i) => !i.isExtraItem && !i.extraItemId);
  const extras = items.filter((i) => i.isExtraItem || i.extraItemId);
  const menuById = useMemo(() => new Map((menuItems || []).map((m) => [String(m._id), m])), [menuItems]);
  const total = items.reduce((a, i) => { const m = menuById.get(String(i.menuItemId)); return a + (i.isExtraItem || !m ? Number(i.subtotal) || (Number(i.pricePerUnit) || 0) * i.quantity : unit(m, i.portion) * i.quantity); }, 0);
  const bump = (k, d) => setItems((arr) => arr.flatMap((i) => (keyOf(i) !== k || i.isExtraItem ? [i] : (i.quantity + d <= 0 ? [] : [{ ...i, quantity: Math.min(99, i.quantity + d) }]))));
  const addDish = (m, portion) => setItems((arr) => {
    const k = `${m._id}|${portion}`; const has = arr.find((i) => keyOf(i) === k && !i.isExtraItem);
    if (has) return arr.map((i) => (i === has ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i));
    return [...arr, { menuItemId: m._id, name: m.name, quantity: 1, portion, pricePerUnit: unit(m, portion), subtotal: unit(m, portion) }];
  });
  const results = useMemo(() => {
    const s = q.trim().toLowerCase(); if (!s) return [];
    return (menuItems || []).filter((m) => m.isAvailable !== false && (`${m.name} ${m.name_mr || ''}`).toLowerCase().includes(s)).slice(0, 12);
  }, [q, menuItems]);

  const save = async () => {
    setErr('');
    const body = {};
    if (name.trim() !== start.name) { if (!name.trim()) return setErr('—'); body.customerName = name.trim(); }
    const ph = phone.replace(/\D/g, '').slice(-10);
    if (ph !== String(start.phone || '').replace(/\D/g, '').slice(-10)) { if (ph.length !== 10) return setErr(t.phoneBad); body.customerPhone = ph; }
    if (kind !== 'pickup' && Number(party) !== start.party) body.partySize = Number(party);
    if (isRes && (date !== start.date || time !== start.time)) { if (!date || !time) return setErr(t.date); body.reservationTime = new Date(`${date}T${time}:00+05:30`).toISOString(); }
    if (kind === 'pickup' && local !== start.local) body.scheduledPickupTime = local || null;
    if (notes.trim() !== (start.notes || '').trim()) body.specialRequests = notes.trim();
    const sig = (arr) => arr.map((i) => `${keyOf(i)}x${i.quantity}`).sort().join(',');
    if (sig(items) !== sig(start.items)) {
      if (kind === 'pickup' && !items.length) return setErr(t.needOne);
      body.items = items.map((i) => ({ menuItemId: i.menuItemId, name: i.name, quantity: i.quantity, portion: i.portion || 'Single', ...(i.isExtraItem || i.extraItemId ? { isExtraItem: true, extraItemId: i.extraItemId } : {}) }));
    }
    if (!Object.keys(body).length) return setErr(t.nochange);
    setBusy(true);
    try {
      const url = isRes ? `${baseUrl}/reservations/session/${encodeURIComponent(tenantId)}/${encodeURIComponent(sessionId)}/edit` : `${baseUrl}/waitlist/session/${encodeURIComponent(tenantId)}/${encodeURIComponent(sessionId)}/edit`;
      const r = await axios.patch(url, body, { timeout: 12000 });
      onSaved({ ...(isRes ? r.data.reservation : r.data.entry), mode: isRes ? 'reservation' : (r.data.entry?.mode) });
    } catch (e) { setErr(e?.response?.data?.error || 'Could not update. Please try again.'); setBusy(false); }
  };

  return (
    <div role="presentation" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10060, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{'@keyframes pxeSpin{to{transform:rotate(360deg)}}'}</style>
      <div role="dialog" aria-modal="true" aria-label={t.title} onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 520, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '24px 20px calc(20px + env(safe-area-inset-bottom,0px))', borderRadius: '24px 24px 0 0', background: '#0f0d0a', border: '1px solid rgba(211,191,162,0.25)', borderBottom: 0, color: '#f7f3eb', fontFamily: 'inherit' }}>
        <button type="button" onClick={onClose} aria-label={t.cancel} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.07)', color: '#cfc6b6', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={18} /></button>
        <div style={{ fontSize: '1.35rem', fontFamily: 'Georgia,serif', color: '#e8d5b0', marginBottom: 2 }}>{t.title}</div>
        <label style={lab}>{t.name}<input style={field} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></label>
        <label style={lab}>{t.phone}<input style={field} inputMode="numeric" value={phone} maxLength={14} onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))} /></label>
        {kind !== 'pickup' && <label style={lab}>{t.guests}<input style={field} type="number" min="1" max="100" value={party} onChange={(e) => setParty(e.target.value)} /></label>}
        {isRes && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><label style={lab}>{t.date}<input style={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label style={lab}>{t.time}<input style={field} type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label></div>}
        {kind === 'pickup' && <label style={lab}>{t.pickup}<input style={field} type="datetime-local" value={local} onChange={(e) => setLocal(e.target.value)} /></label>}
        <label style={lab}>{t.notes}<textarea style={{ ...field, minHeight: 64, resize: 'vertical' }} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>

        <span style={lab}>{t.dishes}</span>
        {dishes.length === 0 && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{t.none}</div>}
        {dishes.map((i) => (
          <div key={keyOf(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid rgba(211,191,162,0.1)' }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: '0.86rem' }}>{i.name}{i.portion && i.portion !== 'Single' ? <em style={{ opacity: 0.6, fontStyle: 'normal' }}> · {i.portion}</em> : null}</div>
            <button type="button" style={stepBtn} aria-label="Less" onClick={() => bump(keyOf(i), -1)}><Minus size={14} /></button>
            <b style={{ minWidth: 20, textAlign: 'center' }}>{i.quantity}</b>
            <button type="button" style={stepBtn} aria-label="More" onClick={() => bump(keyOf(i), 1)}><Plus size={14} /></button>
          </div>
        ))}
        {extras.length > 0 && <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>{t.extras}: {extras.map((e) => `${e.name} ×${e.quantity}`).join(', ')}</div>}

        <div style={{ position: 'relative', marginTop: 14 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 14, opacity: 0.55 }} />
          <input style={{ ...field, paddingLeft: 36 }} placeholder={t.add + ' · ' + t.search} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {results.map((m) => (
          <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderTop: '1px solid rgba(211,191,162,0.08)' }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: '0.83rem' }}>{m.name}<div style={{ fontSize: '0.68rem', opacity: 0.55 }}>₹{unit(m, 'Full')}</div></div>
            {Number(m.priceHalf) > 0 && Number(m.priceFull) > 0
              ? (<><button type="button" style={{ ...stepBtn, width: 'auto', padding: '0 10px', fontSize: '0.7rem', fontWeight: 800 }} onClick={() => addDish(m, 'Half')}>{t.half} ₹{unit(m, 'Half')}</button><button type="button" style={{ ...stepBtn, width: 'auto', padding: '0 10px', fontSize: '0.7rem', fontWeight: 800 }} onClick={() => addDish(m, 'Full')}>{t.full} ₹{unit(m, 'Full')}</button></>)
              : <button type="button" style={stepBtn} aria-label={`Add ${m.name}`} onClick={() => addDish(m, 'Single')}><Plus size={14} /></button>}
          </div>
        ))}

        {dishes.length + extras.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(211,191,162,0.18)', fontSize: '0.9rem' }}><span style={{ opacity: 0.65 }}>{t.total}</span><b style={{ color: GOLD, fontFamily: 'monospace' }}>₹{Math.round(total * 100) / 100}</b></div>}
        {err && <div role="alert" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(248,113,113,0.12)', color: '#f9a8a8', fontSize: '0.78rem' }}>{err}</div>}
        <button type="button" disabled={busy} onClick={save} style={{ width: '100%', marginTop: 16, padding: '16px', borderRadius: 14, border: 0, background: 'linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78)', color: '#0c0c0c', fontWeight: 900, fontSize: '0.86rem', letterSpacing: '0.5px', textTransform: 'uppercase', cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{busy ? <><Loader2 size={16} style={{ animation: 'pxeSpin .8s linear infinite' }} />{t.saving}</> : <><Check size={16} />{t.save}</>}</button>
      </div>
    </div>
  );
}
