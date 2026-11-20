import React from 'react';

/* Recognisable payment-app marks, drawn as inline SVG (no network, no tracking, crisp at any size).
   These are simplified renditions of each brand's colours/shape for identification inside our own buttons.
   If you hold the official brand-kit artwork, drop it into UPI_LOGOS below — nothing else needs to change. */
const Tile = ({ bg = '#fff', children, size }) => <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-hidden="true" focusable="false"><rect width="40" height="40" rx="10" fill={bg} />{children}</svg>;

export const UPI_LOGOS = {
  gpay: (size) => (
    <Tile size={size}><g transform="translate(8 8) scale(1)"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" transform="translate(0 0) scale(1)" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></g></Tile>
  ),
  phonepe: (size) => (
    <Tile size={size} bg="#5f259f"><text x="20" y="27" textAnchor="middle" fontSize="19" fontWeight="800" fill="#fff" fontFamily="'Noto Sans Devanagari','Segoe UI',sans-serif">पे</text></Tile>
  ),
  paytm: (size) => (
    <Tile size={size}><text x="20" y="25" textAnchor="middle" fontSize="11.5" fontWeight="800" fontFamily="Arial,Helvetica,sans-serif"><tspan fill="#002970">pay</tspan><tspan fill="#00baf2">tm</tspan></text></Tile>
  ),
  bhim: (size) => (
    <Tile size={size}><text x="20" y="23" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#e8742b" fontFamily="Arial,Helvetica,sans-serif" letterSpacing=".4">BHIM</text><path d="M9 29h22" stroke="#12803c" strokeWidth="2.6" strokeLinecap="round" /></Tile>
  ),
  any: (size) => (
    <Tile size={size} bg="#241f18"><text x="20" y="24" textAnchor="middle" fontSize="12" fontWeight="900" fill="#d3bfa2" fontFamily="Arial,Helvetica,sans-serif" fontStyle="italic">UPI</text><path d="M11 28l5-4M29 28l-5-4" stroke="#e8742b" strokeWidth="2" strokeLinecap="round" /></Tile>
  ),
};
export default function UpiLogo({ id, size = 28 }) { const f = UPI_LOGOS[id] || UPI_LOGOS.any; return f(size); }
