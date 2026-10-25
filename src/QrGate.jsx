import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from './apiBase.js';
import { BrandLoader } from './PremiumUI.jsx';

/* Customer-app QR gate.
   A table or counter QR carries a credential signed by the server. Before the menu renders we ask the backend whether the
   credential really belongs to THIS restaurant and THIS table. Edited tenant / table / signature → premium error screen.
   Plain restaurant links (directory, bookmarks, legacy counter posters) carry no table parameters and pass straight through. */

const BASE_URL = API_BASE_URL;
const TABLE_PARAMS = ['table', 'sig', 'qr', 'tenantId'];
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function verify(tenantId, params) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {                      // the API may be waking up (cold start): retry before giving up
    try {
      const r = await axios.get(`${BASE_URL}/qr/verify`, { params: { tenantId, table: params.get('table') || '', sig: params.get('sig') || '', qr: params.get('qr') || '' }, timeout: 15000 });
      return r.data;
    } catch (e) { lastErr = e; await wait(900 * (attempt + 1)); }
  }
  throw lastErr;
}

const COPY = {
  SIGNATURE: { t: 'This QR link can’t be trusted', d: 'The link was changed, or it isn’t one issued for this restaurant. For your security we don’t open modified table links.', mr: 'ही लिंक बदलली गेली आहे किंवा या रेस्टॉरंटची नाही. कृपया तुमच्या टेबलवरील QR कोड पुन्हा स्कॅन करा.' },
  MISSING: { t: 'This QR link is incomplete', d: 'The table details are missing from the link. Please scan the QR code on your table again.', mr: 'लिंक अपूर्ण आहे. कृपया टेबलवरील QR कोड पुन्हा स्कॅन करा.' },
  TABLE_REMOVED: { t: 'This table is no longer active', d: 'The restaurant has changed its seating. Please ask a team member for the current QR code.', mr: 'हे टेबल आता उपलब्ध नाही. कृपया कर्मचाऱ्यांकडून नवीन QR कोड घ्या.' },
  INACTIVE: { t: 'This restaurant isn’t taking orders', d: 'It’s temporarily unavailable on Pratyeksha. Please speak to the restaurant team.', mr: 'हे रेस्टॉरंट सध्या ऑर्डर घेत नाही. कृपया रेस्टॉरंटच्या कर्मचाऱ्यांशी बोला.' },
  NETWORK: { t: 'We couldn’t verify this QR', d: 'Please check your connection and try again.', mr: 'कृपया तुमचे इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.' },
};

export function QrInvalidScreen({ reason = 'SIGNATURE', onRetry }) {
  const c = COPY[reason] || COPY.SIGNATURE;
  const isNet = reason === 'NETWORK';
  return (
    <main role="alert" aria-live="assertive" style={{ minHeight: '100dvh', background: 'radial-gradient(120% 80% at 50% -10%, #221d15 0%, #0b0b0c 55%)', color: '#f4efe6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(28px + env(safe-area-inset-top, 0px)) 24px calc(28px + env(safe-area-inset-bottom, 0px))', fontFamily: '"Segoe UI", system-ui, sans-serif', boxSizing: 'border-box' }}>
      <section style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div aria-hidden="true" style={{ width: 92, height: 92, margin: '0 auto 26px', borderRadius: '50%', border: '1px solid rgba(211,191,162,.35)', background: 'radial-gradient(circle at 50% 35%, rgba(211,191,162,.16), rgba(211,191,162,.02) 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 8px rgba(211,191,162,.04), 0 18px 50px rgba(0,0,0,.55)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d3bfa2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6L12 3z" /><path d="M12 8.5v4.2" /><circle cx="12" cy="15.6" r=".6" fill="#d3bfa2" /></svg>
        </div>
        <div style={{ letterSpacing: 5, fontSize: 10.5, color: '#8a704d', textTransform: 'uppercase', marginBottom: 14 }}>Pratyeksha · Secure QR</div>
        <h1 style={{ margin: '0 0 12px', fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 500, fontSize: '1.65rem', lineHeight: 1.25, color: '#f7f3eb' }}>{c.t}</h1>
        <div aria-hidden="true" style={{ width: 54, height: 1, margin: '0 auto 16px', background: 'linear-gradient(90deg, transparent, #d3bfa2, transparent)' }} />
        <p style={{ margin: '0 0 10px', color: 'rgba(244,239,230,.72)', fontSize: '.95rem', lineHeight: 1.65 }}>{c.d}</p>
        <p lang="mr" style={{ margin: '0 0 28px', color: 'rgba(244,239,230,.5)', fontSize: '.85rem', lineHeight: 1.7 }}>{c.mr}</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {isNet && onRetry && <button type="button" onClick={onRetry} style={{ padding: '14px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, letterSpacing: .4, fontSize: '.92rem', color: '#1a1612', background: 'linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78)' }}>Try again</button>}
          <a href="/" style={{ padding: '14px 18px', borderRadius: 12, textDecoration: 'none', fontWeight: 600, letterSpacing: .4, fontSize: '.92rem', color: '#d3bfa2', border: '1px solid rgba(211,191,162,.35)' }}>Browse restaurants</a>
        </div>
        <p style={{ marginTop: 26, fontSize: 11.5, color: 'rgba(244,239,230,.32)' }}>Your order and payment details are safe — nothing was opened.</p>
      </section>
    </main>
  );
}

export default function QrGate({ children }) {
  const { tenantId } = useParams();
  const search = useLocation().search;
  const params = new URLSearchParams(search);
  const hasCredentialParams = TABLE_PARAMS.some(k => params.has(k));
  // `?tenantId=` inside a link must agree with the path — a mismatch is a tampering attempt, not a typo.
  const tenantParamMismatch = params.has('tenantId') && params.get('tenantId') !== tenantId;
  const [state, setState] = useState(hasCredentialParams ? { phase: 'checking' } : { phase: 'ok' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!hasCredentialParams) { setState({ phase: 'ok' }); return undefined; }
    if (tenantParamMismatch || !params.get('table')) { setState({ phase: 'bad', reason: tenantParamMismatch ? 'SIGNATURE' : 'MISSING' }); return undefined; }
    let alive = true; setState({ phase: 'checking' });
    verify(tenantId, params)
      .then(d => alive && setState(d?.valid ? { phase: 'ok' } : { phase: 'bad', reason: d?.reason || 'SIGNATURE' }))
      .catch(() => alive && setState({ phase: 'bad', reason: 'NETWORK' }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, search, nonce]);

  if (state.phase === 'checking') return <div style={{ minHeight: '100dvh', background: '#0b0b0c' }}><BrandLoader message="Verifying your table…" /></div>;
  if (state.phase === 'bad') return <QrInvalidScreen reason={state.reason} onRetry={() => setNonce(n => n + 1)} />;
  return children;
}
