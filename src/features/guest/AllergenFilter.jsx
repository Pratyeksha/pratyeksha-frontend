import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { ALLERGENS } from '../../shared/lib/allergens.js';

/** Guest: tick the allergens to avoid; dishes tagged with any of them are hidden from the menu. Stored on the device only. */
export default function AllergenFilter({ avoid, onChange, lang = 'en', color = '#d3bfa2' }) {
  const [open, setOpen] = useState(false);
  const mr = lang === 'mr';
  const toggle = (id) => onChange(avoid.includes(id) ? avoid.filter((x) => x !== id) : [...avoid, id]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={mr ? 'ॲलर्जी फिल्टर' : 'Allergy filter'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 99, border: `1px solid ${avoid.length ? color : 'rgba(211,191,162,0.3)'}`, background: avoid.length ? 'rgba(211,191,162,0.16)' : 'transparent', color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        <ShieldAlert size={13} /> {mr ? 'ॲलर्जी' : 'Allergies'}{avoid.length ? ` · ${avoid.length}` : ''}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.25)', borderRadius: '22px 22px 0 0', padding: '20px 18px 24px', color: '#f7f3eb', animation: 'pxx-rise .35s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 16 }}>{mr ? 'तुम्हाला कशाची ॲलर्जी आहे?' : 'Avoid these allergens'}</b>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 0, color: '#b4b4b4', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 12, color: '#a6a6a6', margin: '6px 0 14px', lineHeight: 1.5 }}>{mr ? 'निवडलेले घटक असलेले पदार्थ मेनूमधून लपवले जातील.' : 'Dishes the restaurant has tagged with these will be hidden from the menu. Always tell staff about a serious allergy too.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALLERGENS.map((a) => { const on = avoid.includes(a.id); return (
                <button key={a.id} type="button" onClick={() => toggle(a.id)} aria-pressed={on}
                  style={{ padding: '8px 13px', borderRadius: 99, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${on ? color : 'rgba(211,191,162,0.25)'}`, background: on ? color : 'transparent', color: on ? '#111' : '#e8dfcf' }}>{mr ? a.mr : a.label}</button>
              ); })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button type="button" onClick={() => onChange([])} style={{ flex: 1, padding: 11, borderRadius: 12, border: '1px solid rgba(211,191,162,0.25)', background: 'transparent', color, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{mr ? 'साफ करा' : 'Clear'}</button>
              <button type="button" onClick={() => setOpen(false)} style={{ flex: 2, padding: 11, borderRadius: 12, border: 0, background: color, color: '#111', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{mr ? 'झाले' : 'Done'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
