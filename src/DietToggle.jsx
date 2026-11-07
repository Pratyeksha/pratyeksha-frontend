import React, { useEffect, useState } from 'react';
import { fx } from './customerFx.jsx';

const Mark = ({ kind }) => (
  <span className={`dt-mark ${kind}`} aria-hidden="true"><i /></span>
);

/** Veg / Non-veg switch: a sliding gold thumb over a glass pill, FSSAI-style marks, keyboard + screen-reader friendly. */
export default function DietToggle({ vegOnly, onChange, language = 'en' }) {
  const mr = language === 'mr';
  const set = (v) => { if (v !== vegOnly) { onChange(v); fx.select(); } };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); set(true); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); set(false); }
  };
  return (
    <div className={`dt${vegOnly ? ' veg' : ' nonveg'}`} role="radiogroup" aria-label={mr ? 'शाकाहारी किंवा मांसाहारी' : 'Vegetarian or non-vegetarian'} onKeyDown={onKey}>
      <span className="dt-thumb" aria-hidden="true" />
      <button type="button" role="radio" aria-checked={vegOnly} tabIndex={vegOnly ? 0 : -1} className={`dt-opt${vegOnly ? ' on' : ''}`} onClick={() => set(true)}>
        <Mark kind="veg" /><span>{mr ? 'शाकाहारी' : 'VEG'}</span>
      </button>
      <button type="button" role="radio" aria-checked={!vegOnly} tabIndex={!vegOnly ? 0 : -1} className={`dt-opt${!vegOnly ? ' on' : ''}`} onClick={() => set(false)}>
        <Mark kind="nonveg" /><span>{mr ? 'मांसाहारी' : 'NON-VEG'}</span>
      </button>
    </div>
  );
}

/** "At your table · 24 min": calm reassurance for the guest, based on when this table's QR was scanned. */
export function SeatedTimer({ language = 'en' }) {
  const read = () => { try { const t = Number(JSON.parse(sessionStorage.getItem('pratyeksha_qr_session') || '{}').startedAt); return Number.isFinite(t) && t > 0 ? t : 0; } catch { return 0; } };
  const [mins, setMins] = useState(() => { const t = read(); return t ? Math.floor((Date.now() - t) / 60000) : -1; });
  useEffect(() => {
    const tick = () => { if (document.hidden) return; const t = read(); setMins(t ? Math.floor((Date.now() - t) / 60000) : -1); };
    const id = window.setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, []);
  if (mins < 1 || mins > 600) return null;
  const h = Math.floor(mins / 60); const m = mins % 60;
  const txt = h > 0 ? `${h} h ${m} min` : `${mins} min`;
  return <span className="dt-timer">{language === 'mr' ? `तुमच्या टेबलवर · ${txt}` : `At your table · ${txt}`}</span>;
}
