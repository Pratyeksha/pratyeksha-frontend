import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, Clock3, Tag, Receipt, UtensilsCrossed } from 'lucide-react';

/* Offer details bottom sheet for the guest directory. Everything shown comes from the offer the server published for that
   restaurant (value, minimum bill, code, expiry, happy-hour window, category scope, free item). */
const GOLD = '#d3bfa2';
const T = {
  en: { valueOff: (v) => `${v}% OFF`, flat: (v) => `₹${v} OFF`, free: (n) => `FREE ${n || 'ITEM'}`, happy: 'HAPPY HOUR', min: 'Minimum bill', validTill: 'Valid till', code: 'Offer code', hh: 'Happy hour', scope: 'Applies to', scopeCat: 'Selected menu category', scopeAll: 'Entire bill', free2: 'You get', how: 'How to redeem', howBody: 'Order from your table’s QR code. When you ask for the bill, the restaurant applies this offer if your order qualifies — you’ll see the exact discount on your bill before you pay.', view: 'View menu', copy: 'Copy code', copied: 'Copied', close: 'Close', endsToday: 'Ends today', endsIn: (d) => `Ends in ${d} day${d > 1 ? 's' : ''}`, noExpiry: 'No end date' },
  mr: { valueOff: (v) => `${v}% सूट`, flat: (v) => `₹${v} सूट`, free: (n) => `मोफत ${n || 'पदार्थ'}`, happy: 'हॅपी अवर', min: 'किमान बिल', validTill: 'पर्यंत वैध', code: 'ऑफर कोड', hh: 'हॅपी अवर', scope: 'लागू', scopeCat: 'निवडक मेनू विभाग', scopeAll: 'संपूर्ण बिल', free2: 'तुम्हाला मिळेल', how: 'कसे वापरावे', howBody: 'तुमच्या टेबलवरील QR कोडने ऑर्डर करा. बिल मागितल्यावर तुमची ऑर्डर पात्र असल्यास रेस्टॉरंट ही ऑफर लावेल — पैसे देण्यापूर्वी बिलावर अचूक सूट दिसेल.', view: 'मेनू पहा', copy: 'कोड कॉपी करा', copied: 'कॉपी झाले', close: 'बंद करा', endsToday: 'आज संपते', endsIn: (d) => `${d} दिवसांत संपते`, noExpiry: 'अंतिम तारीख नाही' },
};
export const offerHeadline = (o, lang = 'en') => {
  const t = T[lang] || T.en;
  if (o?.type === 'percent_off') return t.valueOff(Number(o.value) || 0);
  if (o?.type === 'fixed_off') return t.flat(Number(o.value) || 0);
  if (o?.type === 'free_item') return t.free(o.freeItem);
  return t.happy;
};
const daysLeft = (d) => Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);

export default function OfferSheet({ offer, lang = 'en', onClose, onView }) {
  const t = T[lang] || T.en; const ref = useRef(null); const [copied, setCopied] = useState(false);
  useEffect(() => {
    const prev = document.activeElement; ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey); const ov = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ov; try { prev?.focus?.(); } catch { /* ignore */ } };
  }, [onClose]);
  if (!offer) return null;
  const tenant = offer._tenant || {}; const exp = offer.expiresAt ? new Date(offer.expiresAt) : null; const left = exp && !Number.isNaN(exp.getTime()) ? daysLeft(exp) : null;
  const rows = [];
  if (Number(offer.minOrder) > 0) rows.push([<Receipt size={15} key="i" />, t.min, `₹${Number(offer.minOrder)}`]);
  if (offer.type === 'happy_hour' && offer.happyStart && offer.happyEnd) rows.push([<Clock3 size={15} key="i" />, t.hh, `${offer.happyStart} – ${offer.happyEnd}`]);
  rows.push([<UtensilsCrossed size={15} key="i" />, t.scope, offer.categoryId ? t.scopeCat : t.scopeAll]);
  if (offer.type === 'free_item' && offer.freeItem) rows.push([<Tag size={15} key="i" />, t.free2, offer.freeItem]);
  if (exp && left !== null) rows.push([<Clock3 size={15} key="i" />, t.validTill, `${exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })} · ${left <= 0 ? t.endsToday : t.endsIn(left)}`]);
  else rows.push([<Clock3 size={15} key="i" />, t.validTill, t.noExpiry]);
  const copy = async () => { try { await navigator.clipboard.writeText(String(offer.code).toUpperCase()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ } };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.62)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${offerHeadline(offer, lang)} — ${tenant.name || ''}`} onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 520, maxHeight: '88dvh', overflowY: 'auto', outline: 'none', background: 'linear-gradient(180deg,#1b1813,#0e0e0f)', border: '1px solid rgba(211,191,162,.28)', borderBottom: 'none', borderRadius: '24px 24px 0 0', padding: '22px 22px calc(22px + env(safe-area-inset-bottom,0px))', color: '#f4efe6', boxShadow: '0 -20px 60px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 600, color: GOLD, letterSpacing: .5, lineHeight: 1.1 }}>{offerHeadline(offer, lang)}</div>
            <div style={{ marginTop: 6, fontSize: 14, color: 'rgba(244,239,230,.75)' }}>{offer.title ? `${offer.title} · ` : ''}{tenant.name}{tenant.address?.area ? ` · ${tenant.address.area}` : ''}</div>
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} style={{ background: 'rgba(255,255,255,.06)', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', flexShrink: 0 }}><X size={16} /></button>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
          {rows.map(([icon, k, v], i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 13px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(211,191,162,.12)' }}><span style={{ color: GOLD, display: 'flex' }}>{icon}</span><span style={{ color: 'rgba(244,239,230,.6)', fontSize: 12.5, minWidth: 96 }}>{k}</span><span style={{ fontSize: 13.5, fontWeight: 600 }}>{v}</span></div>)}
          {offer.code && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px dashed rgba(211,191,162,.5)', background: 'rgba(211,191,162,.07)' }}>
            <div><div style={{ fontSize: 11, color: 'rgba(244,239,230,.55)', letterSpacing: 1.4 }}>{t.code.toUpperCase()}</div><div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: GOLD, letterSpacing: 2 }}>{String(offer.code).toUpperCase()}</div></div>
            <button type="button" onClick={copy} style={{ border: '1px solid rgba(211,191,162,.4)', background: 'transparent', color: GOLD, borderRadius: 10, padding: '8px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center' }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? t.copied : t.copy}</button></div>}
        </div>
        <div style={{ marginTop: 16, fontSize: 12.5, lineHeight: 1.65, color: 'rgba(244,239,230,.62)' }}><b style={{ color: 'rgba(244,239,230,.85)' }}>{t.how}.</b> {t.howBody}</div>
        <button type="button" onClick={() => onView(offer)} style={{ marginTop: 18, width: '100%', padding: '14px 18px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, letterSpacing: .4, color: '#1a1612', background: 'linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78)' }}>{t.view}</button>
      </div>
    </div>
  );
}
