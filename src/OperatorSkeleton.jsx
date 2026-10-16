import React from 'react';

/**
 * Premium loading skeletons for the Operator module — same champagne-on-ink shimmer language as the Owner /
 * Kitchen / Admin skeletons, tuned for the Operator's dark surfaces. Geometry mirrors the real content so
 * nothing jumps when data arrives.
 */
const CSS = `
.pop-skel{position:relative;overflow:hidden;border-radius:10px;background:rgba(255,255,255,0.045);}
.pop-skel::after{content:'';position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(100deg,transparent 15%,rgba(236,220,185,0.10) 40%,rgba(236,220,185,0.18) 50%,rgba(236,220,185,0.10) 60%,transparent 85%);
  animation:popShimmer 1.6s cubic-bezier(.4,0,.2,1) infinite;}
@keyframes popShimmer{to{transform:translateX(100%);}}
.pop-skel-card{background:linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012)),#090909;border:1px solid rgba(211,191,162,0.12);border-radius:14px;}
.pop-skel-in{animation:popSkelIn .35s ease both;}
@keyframes popSkelIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){.pop-skel::after{animation:none;opacity:.5;transform:none;}.pop-skel-in{animation:none;}}
`;

export const OperatorSkeletonStyles = () => <style>{CSS}</style>;

export const SkelBox = ({ w = '100%', h = 12, r = 8, style }) => (
  <div className="pop-skel" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />
);

const wrap = (label, children, style) => (
  <div role="status" aria-busy="true" aria-label={label} className="pop-skel-in" style={style}>
    <OperatorSkeletonStyles />
    {children}
  </div>
);

/** Row of KPI tiles. */
export const SkelKpis = ({ count = 4, label = 'Loading' }) => wrap(label, (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, minmax(0,1fr))`, gap: 12 }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="pop-skel-card" style={{ padding: '14px 16px', display: 'flex', gap: 11, alignItems: 'center' }}>
        <SkelBox w={28} h={28} r={7} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <SkelBox w="55%" h={18} />
          <SkelBox w="80%" h={7} />
        </div>
      </div>
    ))}
  </div>
));

/** Stacked list rows (history, campaigns, offers, banners). */
export const SkelRows = ({ count = 4, label = 'Loading', lead = true }) => wrap(label, (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="pop-skel-card" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {lead && <SkelBox w={30} h={30} r={8} />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <SkelBox w={`${38 + (i * 13) % 25}%`} h={13} />
            <SkelBox w={70} h={10} />
          </div>
          <SkelBox w="92%" h={9} />
          <SkelBox w={`${50 + (i * 17) % 30}%`} h={9} />
        </div>
      </div>
    ))}
  </div>
));

/** Card grid (catalog / menu items). */
export const SkelCards = ({ count = 8, label = 'Loading' }) => wrap(label, (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="pop-skel-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SkelBox h={92} r={10} />
        <SkelBox w="70%" h={13} />
        <SkelBox w="40%" h={9} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <SkelBox w={56} h={16} />
          <SkelBox w={64} h={26} r={8} />
        </div>
      </div>
    ))}
  </div>
));

/** Data table with header (customers). */
export const SkelTable = ({ rows = 8, cols = 5, label = 'Loading' }) => wrap(label, (
  <div className="pop-skel-card" style={{ overflow: 'hidden' }}>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: '14px 18px', borderBottom: '1px solid rgba(211,191,162,0.12)', background: '#070707' }}>
      {Array.from({ length: cols }, (_, c) => <SkelBox key={c} w="55%" h={8} />)}
    </div>
    {Array.from({ length: rows }, (_, r) => (
      <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: '15px 18px', borderBottom: r === rows - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
        {Array.from({ length: cols }, (_, c) => <SkelBox key={c} w={c === 0 ? '80%' : `${45 + ((r + c) * 11) % 40}%`} h={c === 0 ? 12 : 10} />)}
      </div>
    ))}
  </div>
));

/** Notification analytics: KPI tiles + funnel + broadcast cards. */
export const SkelAnalytics = () => wrap('Loading analytics', (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="pop-skel-card" style={{ flex: '1 1 130px', minWidth: 120, padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <SkelBox w="60%" h={7} /><SkelBox w="45%" h={22} /><SkelBox w="70%" h={7} />
        </div>
      ))}
    </div>
    <div className="pop-skel-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SkelBox w={180} h={8} />
      {[92, 74, 58, 31].map((w, i) => <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><SkelBox w="40%" h={9} /><SkelBox w={`${w}%`} h={6} r={3} /></div>)}
    </div>
    <SkelRows count={2} lead={false} />
  </div>
));
