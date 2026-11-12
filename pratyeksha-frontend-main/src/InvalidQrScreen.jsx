import React from 'react';
import { RefreshCw } from 'lucide-react';

const GOLD = '#d3bfa2';
const T = {
  en: {
    invalid: { h: 'This QR code can’t be verified', p: 'The link was changed, or it isn’t an original Pratyeksha table code. To keep every table’s order and bill safe, the menu stays closed.' },
    offline: { h: 'We couldn’t verify your table', p: 'Please check your internet connection and try again. Your menu opens as soon as the QR code is confirmed.' },
    stepsH: 'To continue', s1: 'Scan the QR code placed on your table', s2: 'Use it exactly as printed — please don’t edit or copy the link', s3: 'Need a hand? Any member of our staff will help',
    retry: 'Try again', tag: 'Visualize. Order. Relish.',
  },
  mr: {
    invalid: { h: 'हा QR कोड पडताळता आला नाही', p: 'लिंक बदलली गेली आहे किंवा हा मूळ प्रत्यक्ष टेबल कोड नाही. प्रत्येक टेबलची ऑर्डर आणि बिल सुरक्षित ठेवण्यासाठी मेनू बंद आहे.' },
    offline: { h: 'तुमचे टेबल पडताळता आले नाही', p: 'कृपया इंटरनेट कनेक्शन तपासून पुन्हा प्रयत्न करा. QR कोड पडताळल्यावर मेनू लगेच उघडेल.' },
    stepsH: 'पुढे जाण्यासाठी', s1: 'तुमच्या टेबलवरील QR कोड स्कॅन करा', s2: 'तो जसा छापला आहे तसाच वापरा — लिंक बदलू किंवा कॉपी करू नका', s3: 'मदत हवी असल्यास आमचा कोणताही कर्मचारी मदत करेल',
    retry: 'पुन्हा प्रयत्न करा', tag: 'Visualize. Order. Relish.',
  },
};

/** Premium "this scan is not valid" screen: shown when the QR credentials fail backend verification (edited tenant / table / signature). */
export default function InvalidQrScreen({ language = 'en', variant = 'invalid', restaurantName = '', onRetry }) {
  const tr = T[language] || T.en;
  const copy = variant === 'offline' ? tr.offline : tr.invalid;
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(120% 80% at 50% 0%, #1b1710 0%, #0b0b0c 55%)', color: '#f7f3eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(36px + env(safe-area-inset-top, 0px)) 24px calc(36px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes pxqrFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes pxqrScan { 0% { transform: translateY(-34px); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translateY(34px); opacity: 0 } }
        @keyframes pxqrFade { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @media (prefers-reduced-motion: reduce) { .pxqr-anim, .pxqr-anim * { animation: none !important } }
      `}</style>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(211,191,162,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px', maskImage: 'radial-gradient(70% 60% at 50% 40%, #000, transparent)', WebkitMaskImage: 'radial-gradient(70% 60% at 50% 40%, #000, transparent)' }} />

      <div className="pxqr-anim" style={{ position: 'relative', width: '100%', maxWidth: 400, textAlign: 'center', animation: 'pxqrFade .6s ease both' }}>
        <div style={{ animation: 'pxqrFloat 5s ease-in-out infinite', width: 132, height: 132, margin: '0 auto 26px', position: 'relative' }}>
          <svg viewBox="0 0 132 132" width="132" height="132" role="img" aria-label="Invalid QR code">
            <defs>
              <linearGradient id="pxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e6d5b8" /><stop offset="1" stopColor="#a8875a" /></linearGradient>
            </defs>
            <rect x="6" y="6" width="120" height="120" rx="28" fill="rgba(211,191,162,0.06)" stroke="rgba(211,191,162,0.35)" />
            {/* QR corner brackets */}
            {[[24, 24, 1, 1], [108, 24, -1, 1], [24, 108, 1, -1], [108, 108, -1, -1]].map(([x, y, dx, dy], i) => (
              <path key={i} d={`M${x} ${y + dy * 18} V${y} H${x + dx * 18}`} fill="none" stroke="url(#pxg)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {/* a few broken QR modules */}
            {[[46, 46], [58, 46], [70, 58], [46, 70], [82, 46], [82, 82], [58, 82]].map(([x, y], i) => <rect key={i} x={x} y={y} width="9" height="9" rx="2" fill="rgba(211,191,162,0.32)" />)}
            {/* crossed-out marker */}
            <circle cx="66" cy="66" r="25" fill="#0b0b0c" stroke="url(#pxg)" strokeWidth="3.5" />
            <path d="M55 55 L77 77 M77 55 L55 77" stroke="url(#pxg)" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', left: 22, right: 22, top: 66, height: 2, background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.9), transparent)', animation: 'pxqrScan 3.2s ease-in-out infinite' }} />
        </div>

        {restaurantName && <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: 4, color: 'rgba(211,191,162,0.7)', textTransform: 'uppercase', marginBottom: 12 }}>{restaurantName}</div>}
        <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 500, fontSize: '1.6rem', lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.2px' }}>{copy.h}</h1>
        <p style={{ margin: '0 0 26px', color: 'rgba(255,255,255,0.62)', fontSize: '0.88rem', lineHeight: 1.65 }}>{copy.p}</p>

        {variant === 'offline' ? (
          <button type="button" onClick={onRetry || (() => window.location.reload())}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 14, border: 'none', background: GOLD, color: '#14110c', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
            <RefreshCw size={16} /> {tr.retry}
          </button>
        ) : (
          <div style={{ textAlign: 'left', padding: '18px 18px 8px', borderRadius: 18, border: '1px solid rgba(211,191,162,0.25)', background: 'rgba(211,191,162,0.05)' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: 2.5, color: GOLD, textTransform: 'uppercase', marginBottom: 12 }}>{tr.stepsH}</div>
            {[tr.s1, tr.s2, tr.s3].map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(211,191,162,0.45)', color: GOLD, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#f1ece2' }}>{line}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.8 }}>
          <img src="/notification-icon.png" alt="" width={26} height={26} style={{ borderRadius: 8 }} />
          <span style={{ fontSize: '0.62rem', letterSpacing: 3, color: 'rgba(211,191,162,0.8)', textTransform: 'uppercase' }}>{tr.tag}</span>
        </div>
      </div>
    </div>
  );
}
