// Small notice strip for planned maintenance and open incidents, plus a once-per-launch version ping
// (feeds Master Admin › Platform › App versions). Renders nothing when there is nothing to say.
import React, { useEffect, useState } from 'react';
import API_BASE_URL from './apiBase.js';
import pkg from '../package.json';

const SKIP = ['master-admin', 'landing'];
const appKind = (p) => (p.startsWith('/operator') ? 'operator' : p.startsWith('/kitchen') ? 'kitchen' : p.startsWith('/owner') ? 'owner' : 'guest');
const platformOf = () => { const u = (navigator.userAgent || '').toLowerCase(); return /android/.test(u) ? 'android' : /iphone|ipad|ipod/.test(u) ? 'ios' : /windows/.test(u) ? 'windows' : /mac/.test(u) ? 'mac' : /linux/.test(u) ? 'linux' : 'other'; };

export default function PlatformNotice() {
  const [s, setS] = useState(null);
  const [hidden, setHidden] = useState(false);
  const first = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean)[0] || '' : '';
  const skip = SKIP.includes(first);
  useEffect(() => {
    if (skip) return undefined;
    let live = true; let timer;
    const pull = () => {
      if (document.hidden) return;
      fetch(`${API_BASE_URL}/public/status`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (live && d) setS(d); }).catch(() => {});
    };
    pull(); timer = window.setInterval(pull, 60000);
    try {
      const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
      fetch(`${API_BASE_URL}/public/app-ping`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app: appKind(window.location.pathname), version: pkg.version || 'web', platform: platformOf(), standalone }) }).catch(() => {});
    } catch { /* stats are optional */ }
    return () => { live = false; window.clearInterval(timer); };
  }, [skip]);
  if (skip || !s || hidden) return null;
  const m = s.maintenance; const inc = s.incidents?.[0];
  if (!m && !inc) return null;
  const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const text = m ? (m.active ? (m.message || 'Pratyeksha is under maintenance. Please check back shortly.') : `Planned maintenance ${when(m.startsAt)}${m.endsAt ? ` – ${when(m.endsAt)}` : ''}. ${m.message || ''}`) : `${inc.title}${inc.latest ? ` — ${inc.latest}` : ''}`;
  return (
    <div role="status" style={{ position: 'relative', width: '100%', boxSizing: 'border-box', zIndex: 99990, background: '#141416', color: '#d3bfa2', borderBottom: '1px solid #8a704d', fontSize: 12.5, padding: '6px 36px 6px 12px', textAlign: 'center', fontFamily: 'system-ui,sans-serif' }}>
      {text}
      <button aria-label="Dismiss notice" onClick={() => setHidden(true)} style={{ position: 'absolute', right: 8, top: 3, background: 'none', border: 'none', color: '#d3bfa2', fontSize: 18, cursor: 'pointer' }}>×</button>
    </div>
  );
}
