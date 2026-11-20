/* Original generative artwork for the Concierge: champagne-gold foil on black, matching the Pratyeksha home screen.
 * Pure SVG + CSS (no image files, no extra requests, a few kB), so it stays crisp on every screen and costs nothing to load. */
import React, { useId, useMemo } from 'react';

const GOLD = ['#fff3d6', '#e9d6b0', '#d3bfa2', '#a98a5a', '#6e5636'];

/** Foil gradient defs; every instance gets unique ids so several can live on the page. */
function Foil({ id, dir = 'v' }) {
  const [x2, y2] = dir === 'v' ? [0, 1] : [1, 1];
  return (
    <defs>
      <linearGradient id={`${id}f`} x1="0" y1="0" x2={x2} y2={y2}>
        <stop offset="0" stopColor={GOLD[0]} /><stop offset=".35" stopColor={GOLD[2]} /><stop offset=".7" stopColor={GOLD[3]} /><stop offset="1" stopColor={GOLD[4]} />
      </linearGradient>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2a2418" /><stop offset=".5" stopColor="#3a3123" /><stop offset="1" stopColor="#1b170f" />
      </linearGradient>
      <radialGradient id={`${id}g`} cx=".5" cy=".4" r=".6">
        <stop offset="0" stopColor="rgba(233,214,176,.55)" /><stop offset="1" stopColor="rgba(233,214,176,0)" />
      </radialGradient>
    </defs>
  );
}

const Steam = ({ x = 60, y = 30 }) => (
  <g className="pxc-steam" fill="none" stroke="rgba(233,214,176,.7)" strokeWidth="2.2" strokeLinecap="round">
    <path d={`M${x - 14} ${y + 18} q-7 -8 0 -16 t0 -16`} style={{ '--d': '0s' }} />
    <path d={`M${x} ${y + 20} q-7 -8 0 -16 t0 -16`} style={{ '--d': '.5s' }} />
    <path d={`M${x + 14} ${y + 18} q-7 -8 0 -16 t0 -16`} style={{ '--d': '1s' }} />
  </g>
);

const Sparkle = ({ x, y, s = 1, d = 0 }) => (
  <path className="pxc-twinkle" style={{ '--d': `${d}s`, transformOrigin: `${x}px ${y}px` }} fill="#fff3d6" d={`M${x} ${y - 6 * s} Q${x + 1 * s} ${y - 1 * s} ${x + 6 * s} ${y} Q${x + 1 * s} ${y + 1 * s} ${x} ${y + 6 * s} Q${x - 1 * s} ${y + 1 * s} ${x - 6 * s} ${y} Q${x - 1 * s} ${y - 1 * s} ${x} ${y - 6 * s}Z`} />
);

export function CupArt({ size = 96, steam = true }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Foil id={id} />
      <ellipse cx="60" cy="100" rx="42" ry="9" fill={`url(#${id}s)`} stroke={GOLD[3]} strokeWidth=".8" />
      <ellipse cx="60" cy="97" rx="30" ry="6" fill="none" stroke={GOLD[2]} strokeOpacity=".5" />
      <path d="M26 54h68c0 24-9 40-34 40S26 78 26 54z" fill={`url(#${id}f)`} />
      <path d="M94 60c14-2 18 8 10 17-4 5-10 6-16 6" fill="none" stroke={`url(#${id}f)`} strokeWidth="5.5" strokeLinecap="round" />
      <ellipse cx="60" cy="54" rx="34" ry="8" fill="#2b2113" />
      <ellipse cx="60" cy="54" rx="30" ry="6" fill="#6b4a2b" />
      <path d="M60 51c-6 0-9 3-9 5.5S55 60 60 62c5-2 9-3.5 9-5.5S66 51 60 51z" fill="#f1e3c6" opacity=".92" />
      <path d="M33 62c1 14 7 25 18 29" fill="none" stroke="#fff3d6" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" />
      {steam && <Steam x={60} y={22} />}
      <Sparkle x={100} y={22} s={1.1} d={0.2} /><Sparkle x={18} y={36} s={0.8} d={0.9} />
    </svg>
  );
}

export function PlateArt({ size = 96 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Foil id={id} />
      <ellipse cx="60" cy="96" rx="48" ry="11" fill={`url(#${id}s)`} stroke={GOLD[3]} strokeWidth=".8" />
      <ellipse cx="60" cy="94" rx="36" ry="7.5" fill="none" stroke={GOLD[2]} strokeOpacity=".5" />
      <path d="M20 90C20 56 38 34 60 34s40 22 40 56z" fill={`url(#${id}f)`} />
      <path d="M30 86c0-24 12-40 28-44" fill="none" stroke="#fff3d6" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="30" r="5.5" fill={`url(#${id}f)`} />
      <rect x="14" y="88" width="92" height="5" rx="2.5" fill={`url(#${id}f)`} />
      <Sparkle x={96} y={30} s={1.2} d={0.1} /><Sparkle x={22} y={44} s={0.8} d={0.8} /><Sparkle x={84} y={18} s={0.7} d={1.4} />
    </svg>
  );
}

export function TicketArt({ size = 96 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Foil id={id} dir="d" />
      <g transform="rotate(-10 60 60)">
        <path d="M14 36h92a0 0 0 0 1 0 0v14a10 10 0 0 0 0 20v14H14V70a10 10 0 0 0 0-20z" fill={`url(#${id}f)`} />
        <path d="M78 36v48" stroke="#2b2113" strokeOpacity=".55" strokeWidth="1.6" strokeDasharray="4 4" />
        <g fill="#2b2113"><circle cx="38" cy="52" r="5.5" /><circle cx="56" cy="70" r="5.5" /><path d="M54 49L40 73" stroke="#2b2113" strokeWidth="4" strokeLinecap="round" fill="none" /></g>
        <rect x="86" y="46" width="14" height="4" rx="2" fill="#2b2113" opacity=".6" /><rect x="86" y="56" width="10" height="4" rx="2" fill="#2b2113" opacity=".45" />
      </g>
      <Sparkle x={100} y={26} s={1.2} d={0.3} /><Sparkle x={20} y={96} s={0.9} d={1} />
    </svg>
  );
}

export function PinArt({ size = 96 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Foil id={id} />
      <g fill="none" stroke={GOLD[2]} strokeWidth="1.6"><ellipse className="pxc-ripple" style={{ '--d': '0s' }} cx="60" cy="98" rx="14" ry="5" /><ellipse className="pxc-ripple" style={{ '--d': '.8s' }} cx="60" cy="98" rx="14" ry="5" /></g>
      <path d="M60 14c-19 0-32 14-32 32 0 24 32 52 32 52s32-28 32-52c0-18-13-32-32-32z" fill={`url(#${id}f)`} />
      <circle cx="60" cy="46" r="13" fill="#1b170f" /><circle cx="60" cy="46" r="6" fill="#e9d6b0" />
      <path d="M40 34c4-8 12-12 20-12" fill="none" stroke="#fff3d6" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
      <Sparkle x={98} y={30} s={1} d={0.4} />
    </svg>
  );
}

export function DiceArt({ size = 96 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Foil id={id} dir="d" />
      <g className="pxc-wobble" style={{ transformOrigin: '60px 62px' }}>
        <rect x="26" y="28" width="62" height="62" rx="16" fill={`url(#${id}f)`} transform="rotate(12 57 59)" />
        <g fill="#2b2113" transform="rotate(12 57 59)"><circle cx="43" cy="45" r="5" /><circle cx="57" cy="59" r="5" /><circle cx="71" cy="73" r="5" /><circle cx="71" cy="45" r="5" /><circle cx="43" cy="73" r="5" /></g>
      </g>
      <Sparkle x={98} y={26} s={1.3} d={0.1} /><Sparkle x={18} y={84} s={0.9} d={0.7} /><Sparkle x={92} y={96} s={0.7} d={1.3} />
    </svg>
  );
}

export function LeafArt({ size = 96 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Foil id={id} />
      <path d="M24 92C20 50 50 22 98 22c2 46-22 74-62 74-4 0-8-1-12-4z" fill={`url(#${id}f)`} />
      <path d="M26 94C46 70 66 50 90 30" fill="none" stroke="#2b2113" strokeOpacity=".6" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M52 66l4-18M68 52l2-14M44 78l-12-8" fill="none" stroke="#2b2113" strokeOpacity=".4" strokeWidth="1.8" strokeLinecap="round" />
      <Sparkle x={100} y={86} s={1} d={0.5} />
    </svg>
  );
}

export function ClockArt({ size = 96 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Foil id={id} dir="d" />
      <circle cx="60" cy="60" r="38" fill={`url(#${id}f)`} /><circle cx="60" cy="60" r="31" fill="#1b170f" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x="59" y="32" width="2" height={i % 3 ? 4 : 7} rx="1" fill="#e9d6b0" transform={`rotate(${i * 30} 60 60)`} />)}
      <g className="pxc-hand" style={{ transformOrigin: '60px 60px' }}><rect x="59" y="38" width="2.4" height="23" rx="1.2" fill="#fff3d6" /></g>
      <rect x="59" y="48" width="2.8" height="13" rx="1.4" fill="#d3bfa2" transform="rotate(60 60 60)" /><circle cx="60" cy="60" r="3.4" fill="#d3bfa2" />
      <Sparkle x={100} y={24} s={1} d={0.2} />
    </svg>
  );
}

export function ScanArt({ size = 96 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <Foil id={id} dir="d" />
      <g fill="none" stroke={`url(#${id}f)`} strokeWidth="6" strokeLinecap="round"><path d="M22 44V26a4 4 0 0 1 4-4h18" /><path d="M76 22h18a4 4 0 0 1 4 4v18" /><path d="M98 76v18a4 4 0 0 1-4 4H76" /><path d="M44 98H26a4 4 0 0 1-4-4V76" /></g>
      <g fill="#e9d6b0"><rect x="38" y="38" width="16" height="16" rx="3" /><rect x="66" y="38" width="16" height="16" rx="3" /><rect x="38" y="66" width="16" height="16" rx="3" /><rect x="66" y="66" width="7" height="7" rx="1.5" /><rect x="75" y="75" width="7" height="7" rx="1.5" /></g>
      <rect className="pxc-scanline" x="24" y="58" width="72" height="3" rx="1.5" fill="#fff3d6" />
    </svg>
  );
}

const ART = { cup: CupArt, plate: PlateArt, ticket: TicketArt, pin: PinArt, dice: DiceArt, leaf: LeafArt, clock: ClockArt, scan: ScanArt };
/** Prompt-tile illustration: foil art on a glass tile with a soft golden glow. */
export function ArtTile({ kind, size = 56 }) {
  const C = ART[kind] || CupArt;
  return <span className="pxc-arttile" style={{ width: size, height: size }}><span className="pxc-arttile-glow" /><C size={size * 0.9} /></span>;
}

/** The assistant's avatar: a living gold orb. */
export function Orb({ size = 40, busy = false }) {
  const id = useId().replace(/:/g, '');
  return (
    <span className={`pxc-orb${busy ? ' busy' : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 64 64">
        <defs>
          <radialGradient id={`${id}o`} cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#fff6e0" /><stop offset=".35" stopColor="#e2cba2" /><stop offset=".75" stopColor="#a98a5a" /><stop offset="1" stopColor="#4e3c22" /></radialGradient>
        </defs>
        <circle className="pxc-orb-ring" cx="32" cy="32" r="29" fill="none" stroke="rgba(233,214,176,.55)" strokeWidth="1" strokeDasharray="3 7" />
        <circle cx="32" cy="32" r="22" fill={`url(#${id}o)`} />
        <ellipse cx="25" cy="22" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-28 25 22)" />
        <path d="M32 20l2.6 7.4L42 30l-7.4 2.6L32 40l-2.6-7.4L22 30l7.4-2.6z" fill="#2b2113" opacity=".75" />
      </svg>
    </span>
  );
}

/* Four champagne / bronze / ember / sage-gold palettes, chosen per outlet so cards feel individual but always on-theme. */
const PALETTES = [
  ['#3a2f1d', '#17130b', '#d3bfa2'],
  ['#3d281b', '#150e09', '#e0a574'],
  ['#2e2a1c', '#100f09', '#c9c58f'],
  ['#33261f', '#120d0c', '#d9b08c'],
];
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); };

/** Banner artwork for a restaurant card: the outlet's own logo when it has one, otherwise cup / plate art on a unique gold-dark backdrop. */
export function PlaceBanner({ tenant, cafe, height = 92 }) {
  const h = useMemo(() => hash(String(tenant?.tenantId || tenant?.name || 'x')), [tenant]);
  const [a, b, c] = PALETTES[h % PALETTES.length];
  const logo = tenant?.branding?.logoUrl;
  const Art = cafe ? CupArt : PlateArt;
  const ang = 120 + (h % 7) * 12;
  return (
    <div className="pxc-banner" style={{ height, background: `radial-gradient(120% 140% at ${20 + (h % 50)}% -10%, ${c}33, transparent 55%), linear-gradient(${ang}deg, ${a}, ${b})` }}>
      <svg className="pxc-banner-dots" width="100%" height="100%" aria-hidden="true"><defs><pattern id={`d${h}`} width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill={c} opacity=".18" /></pattern></defs><rect width="100%" height="100%" fill={`url(#d${h})`} /></svg>
      <span className="pxc-banner-art"><Art size={height * 0.95} steam={false} /></span>
      {logo ? <img className="pxc-banner-logo" src={logo} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null}
    </div>
  );
}
