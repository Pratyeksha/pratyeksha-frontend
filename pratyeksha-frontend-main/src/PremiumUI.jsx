import React from 'react';
import './premium.css';

export const LOGO = '/pratyeksha-logo.png';

/** Full-screen branded loading screen. `inline` renders it in normal flow instead of fixed. */
export function BrandLoader({ message = 'Setting the table', inline = false }) {
  return (
    <div className={`px-loader${inline ? ' inline' : ''}`} role="status" aria-live="polite" aria-label="Loading">
      <div className="px-grain" />
      <div className="halo" />
      <div className="stage">
        <span className="ring slow" />
        <span className="ring" />
        <div className="card"><img src={LOGO} alt="Pratyeksha" /></div>
        <span className="spark" style={{ top: -8, right: 24, animationDelay: '.2s' }} />
        <span className="spark" style={{ bottom: -4, left: 18, animationDelay: '1.1s', width: 7, height: 7 }} />
        <span className="spark" style={{ top: 34, left: -12, animationDelay: '1.8s', width: 6, height: 6 }} />
      </div>
      <div className="bar"><i /></div>
      <div className="msg">{message}</div>
    </div>
  );
}

/** Soft animated background that sits behind a screen's content. */
export function AmbientBackdrop() {
  return <div className="px-ambient" aria-hidden="true"><div className="px-grain" /></div>;
}
