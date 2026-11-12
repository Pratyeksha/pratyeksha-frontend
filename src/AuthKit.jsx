import React, { useEffect, useId, useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, Home, AlertTriangle, CheckCircle2, Lock, ShieldCheck, Info } from 'lucide-react';
import SpoonForkIcon from './SpoonForkIcon.jsx';

/**
 * Pratyeksha sign-in design kit — the cream & gold look shared by the Operator, Owner, Kitchen (KDS) and Master Admin
 * sign-in, sign-up, request-access and password-recovery pages. Pure CSS/SVG (no photos): fast, sharp on every screen.
 *
 *   <PxAuthShell art={Icon} headline="…" sub="…">        full page: brand panel (desktop) + glass card (children)
 *   <PxCard icon={Icon} title subtitle>                   the glass card itself (also used inside modals)
 *   <PxField icon label type value onChange … />          input with icon, show/hide for passwords, error state
 *   <PxButton / PxGhostButton / PxLink / PxDivider / PxAlert / PxStrength / PxHomeLink / PxSecure>
 */
export const PX = {
  gold: '#9a7539', goldDeep: '#7d5e2c', goldSoft: '#b8924f', ink: '#2a2019', mute: '#7c6c5a', faint: '#a89883',
  line: '#e8dccb', paper: '#fffdf9', danger: '#b4422f', dangerBg: '#fbeae6', ok: '#3f7a4f', okBg: '#e8f3ea',
  serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
  sans: "'Poppins', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

const CSS = `
.pxa-root{position:fixed;inset:0;z-index:30;display:flex;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:${PX.sans};color:${PX.ink};
  background:radial-gradient(1200px 700px at 8% -10%,#fbf3e8 0%,transparent 60%),radial-gradient(900px 700px at 100% 110%,#f0dcc3 0%,transparent 55%),linear-gradient(135deg,#f7eee2 0%,#efe1cf 48%,#f9f1e7 100%);}
.pxa-arc{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;opacity:.9}
.pxa-brand{text-align:left;flex:1.05;display:flex;flex-direction:column;justify-content:safe center;padding:56px 5vw 56px 7vw;position:relative;z-index:1;min-width:0}
.pxa-main{flex:.95;display:flex;align-items:safe center;justify-content:center;padding:32px 24px;position:relative;z-index:1;min-width:0}
.pxa-card{width:100%;max-width:430px;border-radius:28px;padding:34px 32px 26px;background:rgba(255,252,247,.86);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px) saturate(1.2);
  border:1px solid rgba(255,255,255,.85);box-shadow:0 30px 70px -28px rgba(110,78,34,.32),0 2px 0 rgba(255,255,255,.9) inset,0 0 0 1px rgba(184,146,79,.10)}
.pxa-badge{width:64px;height:64px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;color:${PX.gold};
  background:radial-gradient(circle at 30% 25%,#f8ead2,#ecd5b0);box-shadow:0 8px 20px -8px rgba(154,117,57,.5),0 0 0 6px rgba(236,213,176,.28)}
.pxa-in{position:relative}
.pxa-in input,.pxa-in select,.pxa-in textarea{width:100%;box-sizing:border-box;height:52px;border-radius:14px;border:1px solid ${PX.line};background:${PX.paper};color:${PX.ink};font:500 14.5px ${PX.sans};
  padding:0 46px 0 46px;outline:none;transition:border-color .15s,box-shadow .15s,background .15s}
.pxa-in textarea{height:auto;padding:14px 16px;line-height:1.5;resize:vertical}
.pxa-in input::placeholder,.pxa-in textarea::placeholder{color:${PX.faint};font-weight:400}
.pxa-in input:focus,.pxa-in select:focus,.pxa-in textarea:focus{border-color:${PX.goldSoft};box-shadow:0 0 0 4px rgba(184,146,79,.16);background:#fff}
.pxa-in.err input,.pxa-in.err select,.pxa-in.err textarea{border-color:#d8806f;box-shadow:0 0 0 4px rgba(180,66,47,.08)}
.pxa-ico{position:absolute;left:15px;top:0;height:52px;display:grid;place-items:center;color:${PX.goldSoft};pointer-events:none}
.pxa-eye{position:absolute;right:6px;top:6px;width:40px;height:40px;border-radius:10px;border:0;background:transparent;color:${PX.mute};cursor:pointer;display:grid;place-items:center}
.pxa-eye:hover{background:rgba(184,146,79,.12)}
.pxa-btn{width:100%;height:52px;border-radius:14px;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;color:#fff;font:600 15px ${PX.sans};letter-spacing:.2px;
  background:linear-gradient(180deg,#bf9a58 0%,#9a7539 100%);box-shadow:0 12px 24px -10px rgba(122,89,36,.7),0 1px 0 rgba(255,255,255,.35) inset;transition:transform .12s,box-shadow .12s,filter .12s}
.pxa-btn:hover:not(:disabled){filter:brightness(1.05);transform:translateY(-1px)}
.pxa-btn:active:not(:disabled){transform:translateY(0)}
.pxa-btn:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
.pxa-btn.ghost{background:rgba(255,255,255,.55);color:${PX.goldDeep};border:1.5px solid #dcc59d;box-shadow:none}
.pxa-btn.ghost:hover:not(:disabled){background:#fff}
.pxa-link{background:none;border:0;padding:6px 2px;color:${PX.goldDeep};font:600 13px ${PX.sans};cursor:pointer;text-decoration:none}
.pxa-link:hover{text-decoration:underline}
.pxa-btn:focus-visible,.pxa-link:focus-visible,.pxa-eye:focus-visible{outline:3px solid rgba(184,146,79,.5);outline-offset:2px}
.pxa-spin{animation:pxaSpin .9s linear infinite}@keyframes pxaSpin{to{transform:rotate(360deg)}}
.pxa-rise{animation:pxaRise .5s cubic-bezier(.2,.8,.2,1) both}@keyframes pxaRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.pxa-float{animation:pxaFloat 7s ease-in-out infinite}@keyframes pxaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.pxa-mobhead{display:none}
@media (max-width:920px){
  .pxa-root{flex-direction:column}
  .pxa-brand{display:none}
  .pxa-mobhead{display:flex;flex-direction:column;align-items:center;text-align:center;padding:34px 20px 4px;position:relative;z-index:1}
  .pxa-main{padding:16px 16px 40px;align-items:flex-start}
  .pxa-card{padding:28px 22px 22px;border-radius:24px}
}
@media (prefers-reduced-motion:reduce){.pxa-float,.pxa-rise,.pxa-spin{animation:none}}
`;

function Wordmark({ size = 56, center = false }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left' }}>
      <SpoonForkIcon size={size * 0.9} color={PX.goldSoft} style={{ marginBottom: 6, ...(center ? { margin: '0 auto 6px', display: 'block' } : null) }} />
      <div style={{ fontFamily: PX.serif, fontWeight: 600, fontSize: size, lineHeight: 1.05, color: PX.goldDeep, letterSpacing: '-0.5px' }}>Pratyeksha</div>
      <div style={{ marginTop: 10, fontSize: Math.max(10, size * 0.2), letterSpacing: '0.28em', color: PX.mute, fontWeight: 500 }}>VISUALIZE. ORDER. RELISH.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, justifyContent: center ? 'center' : 'flex-start' }} aria-hidden="true">
        <span style={{ width: 46, height: 1, background: 'linear-gradient(90deg,transparent,#c9ac7a)' }} />
        <span style={{ color: PX.goldSoft, fontSize: 11 }}>★</span>
        <span style={{ width: 46, height: 1, background: 'linear-gradient(270deg,transparent,#c9ac7a)' }} />
      </div>
    </div>
  );
}

/** Soft concentric rings + the module's icon: a calm illustration that replaces a photo. */
function Art({ Icon }) {
  return (
    <div className="pxa-float" aria-hidden="true" style={{ position: 'relative', width: 260, height: 260, marginTop: 40 }}>
      {[260, 200, 140].map((d, i) => (
        <div key={d} style={{ position: 'absolute', inset: (260 - d) / 2, borderRadius: '50%', border: `1px solid rgba(184,146,79,${0.16 + i * 0.1})`, background: i === 2 ? 'radial-gradient(circle at 30% 25%,rgba(255,255,255,.85),rgba(236,213,176,.55))' : 'transparent' }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: PX.gold }}>{Icon ? <Icon size={58} strokeWidth={1.3} /> : null}</div>
      <span style={{ position: 'absolute', top: 18, right: 34, width: 10, height: 10, borderRadius: '50%', background: '#d9bd8a' }} />
      <span style={{ position: 'absolute', bottom: 30, left: 16, width: 7, height: 7, borderRadius: '50%', background: '#e7d1ab' }} />
    </div>
  );
}

export function PxAuthShell({ art, headline, sub, children }) {
  return (
    <div className="pxa-root">
      <style>{CSS}</style>
      <svg className="pxa-arc" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-50 640 C 260 520, 330 150, 640 60 S 960 -20 1100 -60" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="2" />
        <path d="M-50 700 C 320 600, 420 220, 700 110 S 980 20 1100 -10" fill="none" stroke="rgba(184,146,79,.14)" strokeWidth="1.5" />
      </svg>
      <section className="pxa-brand" aria-hidden={false}>
        <Wordmark size={64} />
        <h2 style={{ margin: '40px 0 8px', fontFamily: PX.serif, fontWeight: 500, fontSize: 'clamp(26px,2.6vw,38px)', lineHeight: 1.18, color: PX.ink, maxWidth: 420 }}>{headline}</h2>
        {sub && <p style={{ margin: 0, fontSize: 15, color: PX.mute, maxWidth: 380, lineHeight: 1.6 }}>{sub}</p>}
        <Art Icon={art} />
      </section>
      <div className="pxa-mobhead"><Wordmark size={40} center /></div>
      <main className="pxa-main">{children}</main>
    </div>
  );
}

export function PxCard({ icon: Icon, title, subtitle, children, footer, style }) {
  return (
    <div className="pxa-card pxa-rise" style={style}>
      {Icon && <div className="pxa-badge"><Icon size={28} strokeWidth={1.6} /></div>}
      {title && <h1 style={{ margin: 0, textAlign: 'center', fontFamily: PX.sans, fontSize: 24, fontWeight: 600, color: PX.ink, letterSpacing: '-0.3px' }}>{title}</h1>}
      {subtitle && <p style={{ margin: '6px 0 22px', textAlign: 'center', fontSize: 13.5, color: PX.mute, lineHeight: 1.55 }}>{subtitle}</p>}
      {children}
      {footer}
    </div>
  );
}

export function PxField({ icon: Icon, label, type = 'text', value, onChange, placeholder, error, hint, onBlur, textarea, select, children, ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  const Tag = textarea ? 'textarea' : select ? 'select' : 'input';
  return (
    <div style={{ marginBottom: 12 }}>
      <div className={`pxa-in${error ? ' err' : ''}`}>
        {Icon && <span className="pxa-ico"><Icon size={18} strokeWidth={1.7} /></span>}
        <Tag id={id} aria-label={label || placeholder} aria-invalid={!!error} aria-describedby={error ? id + 'e' : hint ? id + 'h' : undefined}
          {...(textarea || select ? {} : { type: isPw && show ? 'text' : type })} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder}
          style={!Icon ? { paddingLeft: 16 } : undefined} {...rest}>{children}</Tag>
        {isPw && (
          <button type="button" className="pxa-eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? <div id={id + 'e'} role="alert" style={{ fontSize: 12, color: PX.danger, margin: '5px 4px 0' }}>{error}</div>
        : hint ? <div id={id + 'h'} style={{ fontSize: 11.5, color: PX.faint, margin: '5px 4px 0' }}>{hint}</div> : null}
    </div>
  );
}

export function PxButton({ children, loading, icon: Icon = ArrowRight, noIcon, ghost, ...rest }) {
  return (
    <button className={`pxa-btn${ghost ? ' ghost' : ''}`} {...rest} disabled={rest.disabled || loading}>
      {loading ? <Loader2 size={18} className="pxa-spin" /> : null}
      <span>{children}</span>
      {!loading && !noIcon && Icon ? <Icon size={18} strokeWidth={2} /> : null}
    </button>
  );
}

export const PxLink = ({ children, ...rest }) => <button type="button" className="pxa-link" {...rest}>{children}</button>;

export function PxDivider({ text = 'or' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: PX.faint, fontSize: 12 }} aria-hidden="true">
      <span style={{ flex: 1, height: 1, background: PX.line }} />{text}<span style={{ flex: 1, height: 1, background: PX.line }} />
    </div>
  );
}

export function PxAlert({ kind = 'error', children }) {
  if (!children) return null;
  const ok = kind === 'ok', info = kind === 'info';
  const Ico = ok ? CheckCircle2 : info ? Info : AlertTriangle;
  return (
    <div role={ok || info ? 'status' : 'alert'} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', margin: '4px 0 14px', padding: '10px 12px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.5,
      background: ok ? PX.okBg : info ? '#f6efe2' : PX.dangerBg, color: ok ? PX.ok : info ? PX.goldDeep : PX.danger, border: `1px solid ${ok ? '#cfe5d3' : info ? '#eadbbd' : '#f1cdc5'}` }}>
      <Ico size={15} style={{ flexShrink: 0, marginTop: 2 }} /><div>{children}</div>
    </div>
  );
}

export function PxHomeLink({ onClick }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 8 }}>
      <button type="button" className="pxa-link" onClick={onClick || (() => { window.location.href = '/'; })} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: PX.ink, fontWeight: 500 }}>
        <Home size={15} />Back to Home
      </button>
    </div>
  );
}

export function PxSecure({ text = 'Encrypted sign-in · your session is protected' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 11, color: PX.faint }}>
      <Lock size={11} />{text}
    </div>
  );
}

/** 0–4 strength for a new password; mirrors the server rule (8+ chars, letters AND numbers). */
export function passwordIssues(pw) {
  if (pw.length < 8) return 'Use at least 8 characters';
  if (!/[a-z]/i.test(pw) || !/\d/.test(pw)) return 'Include both letters and numbers';
  return '';
}
export function PxStrength({ value }) {
  if (!value) return null;
  let s = 0;
  if (value.length >= 8) s++; if (value.length >= 12) s++;
  if (/[a-z]/i.test(value) && /\d/.test(value)) s++;
  if (/[^a-z0-9]/i.test(value) && /[A-Z]/.test(value)) s++;
  const label = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][s];
  const col = ['#c4543f', '#d8803a', '#c9a43c', '#7da04a', '#3f7a4f'][s];
  return (
    <div style={{ margin: '-4px 2px 12px' }} aria-live="polite">
      <div style={{ display: 'flex', gap: 4 }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 3, background: i < s ? col : PX.line, transition: 'background .2s' }} />)}</div>
      <div style={{ fontSize: 11.5, color: col, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export { ShieldCheck as PxShield };
