import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Mail, MapPin, LifeBuoy, X, MessageCircle } from 'lucide-react';

/* Pratyeksha support contact — one small button that opens a dark glass card with call / WhatsApp / email / location. */
export const SUPPORT = {
  phones: [{ label: '8767622654', tel: '+918767622654' }, { label: '8605015294', tel: '+918605015294' }],
  email: 'hello.pratyeksha@gmail.com',
  location: 'Kolhapur, Maharashtra',
};

const GOLD = '#d3bfa2';
const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(211,191,162,0.16)', background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))', color: '#f7f3eb', textDecoration: 'none', fontSize: 13, fontWeight: 600, textAlign: 'left' };
const ico = { width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(211,191,162,0.1)', border: '1px solid rgba(211,191,162,0.22)', color: GOLD };

export default function SupportContact({ label = 'Contact Pratyeksha', style }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', marginBottom: 8, borderRadius: 12, cursor: 'pointer', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.16)', color: GOLD, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', fontFamily: 'inherit', ...style }}>
        <LifeBuoy size={13} /> {label}
      </button>
      {open && createPortal(
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100003, background: 'rgba(4,4,4,0.72)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div role="dialog" aria-label="Contact Pratyeksha" onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: '100%', borderRadius: 24, border: '1px solid rgba(211,191,162,0.22)', background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)), #0a0a0a', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.85)', padding: 22, color: '#f7f3eb', fontFamily: 'Poppins, Inter, system-ui, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, letterSpacing: 2.4, fontWeight: 800, color: GOLD, textTransform: 'uppercase' }}>We’re here to help</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, marginTop: 6 }}>Pratyeksha support</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(211,191,162,0.2)', background: 'transparent', color: GOLD, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gap: 9 }}>
              {SUPPORT.phones.map((p) => (
                <div key={p.tel} style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${p.tel}`} style={{ ...row, flex: 1 }}><span style={ico}><Phone size={15} /></span><span>{p.label}<small style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Tap to call</small></span></a>
                  <a href={`https://wa.me/${p.tel.replace('+', '')}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${p.label}`} style={{ ...row, padding: '0 14px', justifyContent: 'center' }}><span style={{ color: GOLD, display: 'grid' }}><MessageCircle size={17} /></span></a>
                </div>
              ))}
              <a href={`mailto:${SUPPORT.email}`} style={row}><span style={ico}><Mail size={15} /></span><span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{SUPPORT.email}<small style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Email us</small></span></a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SUPPORT.location)}`} target="_blank" rel="noopener noreferrer" style={row}><span style={ico}><MapPin size={15} /></span><span>{SUPPORT.location}<small style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Open in Maps</small></span></a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
