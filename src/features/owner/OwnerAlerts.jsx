/* Owner → Alerts, redesigned.
 * - one unified inbox (stock/revenue/kitchen alerts + platform notices) with source tabs, severity filters, category chips, unread toggle
 * - insight row built from the real alerts: severity mix (Bklit donut), last-7-days activity (Bklit bars), top categories (Bklit ranked bars)
 * - day-grouped timeline feed, optimistic mark-read, swipe-right-to-mark-read on touch (Motion drag), animated enter/exit
 * - mobile-first: single column, scrollable filter rail, 44px targets, safe-area aware
 */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion as Motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react';
import { AlertTriangle, Bell, Info, CheckCheck, Megaphone, BellOff, Inbox, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { BkDonut, BkColumns, BkHBars } from './ownerCharts.jsx';

const GOLD = '#d3bfa2';
const SEV = {
  urgent: { label: 'Urgent', color: 'rgba(214,109,39,0.95)', soft: 'rgba(214,109,39,0.14)', icon: AlertTriangle },
  attention: { label: 'Attention', color: 'rgba(226,154,88,0.95)', soft: 'rgba(226,154,88,0.12)', icon: Bell },
  info: { label: 'Info', color: GOLD, soft: 'rgba(211,191,162,0.12)', icon: Info },
};
const SEV_ORDER = ['urgent', 'attention', 'info'];
const IST = 'Asia/Kolkata';
const EMPTY = new Set();
const dayKey = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: IST });
const dayLabel = (ms, now) => {
  const k = dayKey(ms);
  if (k === dayKey(now)) return 'Today';
  if (k === dayKey(now - 86400000)) return 'Yesterday';
  return new Date(ms).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: IST });
};
const ago = (ms, now) => {
  const m = Math.max(0, Math.round((now - ms) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: IST });
};
const clock = (ms) => new Date(ms).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: IST });

const CSS = `
.pxal{display:grid;gap:14px;min-width:0}
.pxal *{box-sizing:border-box}
.pxal-card{background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.016));border:1px solid rgba(211,191,162,.16);border-radius:18px;
  box-shadow:0 18px 44px -22px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.05)}
.pxal-hero{display:flex;align-items:center;gap:16px;padding:18px 20px;flex-wrap:wrap;position:relative;overflow:hidden}
.pxal-hero::before{content:"";position:absolute;inset:-40% -10% auto auto;width:260px;height:260px;border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,var(--glow,rgba(211,191,162,.16)),transparent)}
.pxal-orb{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;position:relative}
.pxal-orb.live::after{content:"";position:absolute;inset:-5px;border-radius:20px;border:1px solid currentColor;opacity:0;animation:pxalPing 2.4s ease-out infinite}
@keyframes pxalPing{0%{opacity:.5;transform:scale(.85)}100%{opacity:0;transform:scale(1.35)}}
.pxal-h{flex:1 1 220px;min-width:0}
.pxal-h h2{margin:0;font-family:inherit;font-size:19px;font-weight:800;letter-spacing:-.02em;color:#f7f3eb;text-align:left}
.pxal-h p{margin:4px 0 0;font-size:12.5px;color:rgba(255,255,255,.62);line-height:1.5}
.pxal-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:0 16px;border-radius:13px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;
  border:1px solid rgba(211,191,162,.4);background:linear-gradient(135deg,rgba(211,191,162,.2),rgba(211,191,162,.05));color:#f7f3eb;-webkit-tap-highlight-color:transparent}
.pxal-btn:disabled{opacity:.45;cursor:default}
.pxal-btn.ghost{background:transparent;border-color:rgba(211,191,162,.18);color:rgba(255,255,255,.7)}
.pxal-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%}
.pxal-sumi{border-radius:14px;padding:11px 12px;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.06);min-width:0;cursor:pointer;background:rgba(255,255,255,.02);font:inherit;text-align:left;color:inherit}
.pxal-sumi b{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:20px;font-weight:800;line-height:1}
.pxal-sumi span{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55)}
.pxal-sumi.on{border-color:var(--c);background:var(--s)}
.pxal-ins-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;cursor:pointer;background:none;border:0;width:100%;font:inherit;color:inherit;min-height:48px}
.pxal-ins-h h3{margin:0;font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${GOLD};display:flex;align-items:center;gap:8px}
.pxal-ins{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px;padding:0 18px 18px}
.pxal-ins section{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:14px;padding:14px;min-width:0;overflow:hidden}
.pxal-ins h4{margin:0 0 10px;font-family:inherit;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);text-align:left}
.pxal-leg{display:grid;gap:7px;margin-top:12px}
.pxal-leg div{display:flex;align-items:center;gap:8px;font-size:11.5px;color:rgba(255,255,255,.7)}
.pxal-leg i{width:9px;height:9px;border-radius:3px;flex:0 0 auto}
.pxal-leg b{margin-left:auto;font-family:'JetBrains Mono',ui-monospace,monospace;color:#fff}
.pxal-bar{position:sticky;top:-1px;z-index:5;margin:0 -2px;padding:10px 2px 8px;background:linear-gradient(#101012 70%,rgba(16,16,18,0));display:grid;gap:8px}
.pxal-rail{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;padding:2px 2px 4px}
.pxal-rail::-webkit-scrollbar{display:none}
.pxal-chip{position:relative;flex:0 0 auto;scroll-snap-align:start;min-height:40px;padding:0 14px;border-radius:12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;
  border:1px solid rgba(211,191,162,.16);background:transparent;color:rgba(255,255,255,.62);display:inline-flex;align-items:center;gap:7px;-webkit-tap-highlight-color:transparent}
.pxal-chip.on{color:#f7f3eb;border-color:transparent}
.pxal-chip em{font-style:normal;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;opacity:.7}
.pxal-day{display:flex;align-items:center;gap:10px;margin:8px 4px 2px;font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(211,191,162,.75)}
.pxal-day::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(211,191,162,.25),transparent)}
.pxal-item{position:relative;display:flex;gap:12px;padding:14px 14px 14px 16px;border-radius:16px;overflow:hidden;touch-action:pan-y;
  background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(255,255,255,.014));border:1px solid rgba(255,255,255,.07)}
.pxal-item::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--c)}
.pxal-item.read{opacity:.58}
.pxal-ico{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;background:var(--s);color:var(--c)}
.pxal-t{font-size:13px;font-weight:700;color:#f7f3eb;line-height:1.4;overflow-wrap:anywhere}
.pxal-b{font-size:12.5px;color:rgba(255,255,255,.66);margin-top:3px;line-height:1.55;overflow-wrap:anywhere}
.pxal-m{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:10.5px;color:rgba(255,255,255,.5)}
.pxal-tag{padding:3px 8px;border-radius:7px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:rgba(255,255,255,.06);color:rgba(255,255,255,.65)}
.pxal-new{padding:3px 8px;border-radius:7px;font-weight:800;letter-spacing:.08em;background:var(--c);color:#14110b}
.pxal-read{align-self:flex-start;flex:0 0 auto;min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 10px;border-radius:12px;font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(255,255,255,.75);-webkit-tap-highlight-color:transparent}
.pxal-swipe{position:absolute;inset:0;display:flex;align-items:center;padding-left:18px;gap:8px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${GOLD};background:rgba(211,191,162,.1);pointer-events:none}
.pxal-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:44px 20px}
.pxal-empty b{font-size:15px;color:#f7f3eb}.pxal-empty span{font-size:12.5px;color:rgba(255,255,255,.58);max-width:320px;line-height:1.55}
.pxal-hint{display:none;font-size:10.5px;color:rgba(255,255,255,.42);text-align:center;margin-top:2px}
@media (pointer:coarse){.pxal-hint{display:block}}
@media (max-width:560px){
  .pxal-hero{padding:16px 14px}.pxal-h h2{font-size:17px}
  .pxal-hero .pxal-btn{width:100%}
  .pxal-sumi{flex-direction:column;align-items:flex-start;gap:6px;padding:10px}
  .pxal-item{padding:12px 10px 12px 14px;gap:10px}
  .pxal-read span{display:none}
  .pxal-ins{padding:0 12px 14px}
}
@media (prefers-reduced-motion:reduce){.pxal-orb.live::after{animation:none}}
`;

const Pill = ({ id }) => <Motion.span layoutId={`pxal-pill-${id}`} aria-hidden="true" transition={{ type: 'spring', stiffness: 500, damping: 38 }} style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid rgba(211,191,162,.5)', background: 'linear-gradient(135deg,rgba(211,191,162,.22),rgba(211,191,162,.06))' }} />;

const Swipeable = ({ children, onSwipe, disabled }) => {
  const reduce = useReducedMotion();
  if (disabled || reduce) return children;
  return (
    <Motion.div drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0, right: 0.5 }} style={{ position: 'relative', touchAction: 'pan-y' }}
      onDragEnd={(_, info) => { if (info.offset.x > 88 || info.velocity.x > 520) onSwipe(); }}>
      {children}
    </Motion.div>
  );
};

export default function AlertsView({ alerts = [], notifs = [], onReadAlert, onReadNotif, live }) {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState('all');
  const [sev, setSev] = useState('all');
  const [cat, setCat] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [readState, setReadState] = useState({ sig: '', keys: new Set() });
  const [insOpen, setInsOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 760));
  const [busyAll, setBusyAll] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);
  const sig = useMemo(() => `${alerts.map((a) => `${a._id}${a.isRead ? 1 : 0}`).join('|')}#${notifs.map((n) => `${n._id}${n.isRead ? 1 : 0}`).join('|')}`, [alerts, notifs]);
  const localRead = readState.sig === sig ? readState.keys : EMPTY;

  const items = useMemo(() => {
    const a = alerts.map((x) => ({ key: `a:${x._id}`, id: x._id, src: 'alert', sev: SEV[x.severity] ? x.severity : 'info', title: x.message, body: '', cat: x.category || 'General', at: new Date(x.createdAt).getTime(), read: !!x.isRead }));
    const n = notifs.map((x) => ({ key: `n:${x._id}`, id: x._id, src: 'platform', sev: x.severity === 'important' ? 'attention' : (SEV[x.severity] ? x.severity : 'info'), title: x.title, body: x.message, cat: 'Pratyeksha', at: new Date(x.createdAt).getTime(), read: !!x.isRead }));
    return [...a, ...n].map((i) => ({ ...i, read: i.read || localRead.has(i.key) })).sort((p, q) => q.at - p.at);
  }, [alerts, notifs, localRead]);

  const unread = items.filter((i) => !i.read);
  const sevCount = useMemo(() => SEV_ORDER.reduce((o, k) => ({ ...o, [k]: items.filter((i) => i.sev === k && !i.read).length }), {}), [items]);
  const cats = useMemo(() => {
    const m = new Map(); items.forEach((i) => m.set(i.cat, (m.get(i.cat) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const view = useMemo(() => items.filter((i) => (tab === 'all' || (tab === 'alerts' ? i.src === 'alert' : i.src === 'platform')) && (sev === 'all' || i.sev === sev) && (cat === 'all' || i.cat === cat) && (!unreadOnly || !i.read)), [items, tab, sev, cat, unreadOnly]);
  const groups = useMemo(() => {
    const g = []; view.forEach((i) => { const l = dayLabel(i.at, now); const last = g[g.length - 1]; if (last && last.label === l) last.rows.push(i); else g.push({ label: l, rows: [i] }); });
    return g;
  }, [view, now]);

  const markRead = useCallback((i) => {
    setReadState((st) => ({ sig, keys: new Set(st.sig === sig ? st.keys : []).add(i.key) }));
    (i.src === 'alert' ? onReadAlert : onReadNotif)?.(i.id);
  }, [onReadAlert, onReadNotif, sig]);
  const markAll = async () => {
    setBusyAll(true);
    const targets = unread; setReadState((st) => { const n = new Set(st.sig === sig ? st.keys : []); targets.forEach((t) => n.add(t.key)); return { sig, keys: n }; });
    await Promise.allSettled(targets.map((t) => (t.src === 'alert' ? onReadAlert : onReadNotif)?.(t.id)));
    setBusyAll(false);
  };

  /* insight data (all real, derived from the inbox) */
  const mix = SEV_ORDER.map((k) => ({ label: SEV[k].label, value: items.filter((i) => i.sev === k).length, color: SEV[k].color })).filter((r) => r.value > 0);
  const week = useMemo(() => Array.from({ length: 7 }, (_, d) => {
    const ms = now - (6 - d) * 86400000;
    return { label: new Date(ms).toLocaleDateString('en-IN', { weekday: 'short', timeZone: IST }), value: items.filter((i) => dayKey(i.at) === dayKey(ms)).length };
  }), [items, now]);
  const topCats = cats.slice(0, 5).map(([label, value]) => ({ label, value }));

  const urgentN = sevCount.urgent; const attnN = sevCount.attention;
  const tone = urgentN > 0 ? SEV.urgent : attnN > 0 ? SEV.attention : SEV.info;
  const headline = urgentN > 0 ? `${urgentN} urgent ${urgentN === 1 ? 'alert needs' : 'alerts need'} you` : attnN > 0 ? `${attnN} ${attnN === 1 ? 'item needs' : 'items need'} attention` : unread.length > 0 ? `${unread.length} unread ${unread.length === 1 ? 'update' : 'updates'}` : 'All clear';
  const sub = items.length === 0 ? 'Stock, revenue and kitchen alerts will appear here in real time.' : unread.length === 0 ? 'You are fully caught up. We will notify you the moment something changes.' : `${unread.length} unread of ${items.length} · newest ${ago(items[0].at, now)}`;
  const filtersOn = tab !== 'all' || sev !== 'all' || cat !== 'all' || unreadOnly;
  const reset = () => { setTab('all'); setSev('all'); setCat('all'); setUnreadOnly(false); };
  return (
    <LayoutGroup>
      <style>{CSS}</style>
      <div className="pxal">
        {/* HERO */}
        <div className="pxal-card pxal-hero" style={{ '--glow': tone.soft }}>
          <div className={`pxal-orb${urgentN > 0 || live ? ' live' : ''}`} style={{ background: tone.soft, color: tone.color }}>
            {items.length === 0 ? <BellOff size={24} /> : <tone.icon size={24} />}
          </div>
          <div className="pxal-h"><h2>{headline}</h2><p>{sub}</p></div>
          <button type="button" className="pxal-btn" onClick={markAll} disabled={unread.length === 0 || busyAll}><CheckCheck size={16} />Mark all read{unread.length > 0 ? ` (${unread.length})` : ''}</button>
          <div className="pxal-sum">
            {SEV_ORDER.map((k) => (
              <button type="button" key={k} className={`pxal-sumi${sev === k ? ' on' : ''}`} style={{ '--c': SEV[k].color, '--s': SEV[k].soft }} aria-pressed={sev === k} onClick={() => setSev(sev === k ? 'all' : k)}>
                <b style={{ color: SEV[k].color }}>{sevCount[k]}</b><span>{SEV[k].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* INSIGHTS */}
        {items.length > 0 && (
          <div className="pxal-card">
            <button type="button" className="pxal-ins-h" aria-expanded={insOpen} onClick={() => setInsOpen((v) => !v)}>
              <h3><SlidersHorizontal size={13} />Alert insights</h3>
              <ChevronDown size={18} style={{ transition: 'transform .25s', transform: insOpen ? 'rotate(180deg)' : 'none', color: 'rgba(255,255,255,.6)' }} />
            </button>
            <AnimatePresence initial={false}>
              {insOpen && (
                <Motion.div key="ins" initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
                  <div className="pxal-ins">
                    <section>
                      <h4>Severity mix</h4>
                      <BkDonut rows={mix} centerValue={items.length} centerLabel="ALERTS" size={150} />
                      <div className="pxal-leg">{mix.map((m) => <div key={m.label}><i style={{ background: m.color }} />{m.label}<b>{m.value}</b></div>)}</div>
                    </section>
                    <section>
                      <h4>Last 7 days</h4>
                      <BkColumns rows={week} height={170} valueFormat={(v) => `${v} ${v === 1 ? 'alert' : 'alerts'}`} />
                    </section>
                    <section>
                      <h4>Top categories</h4>
                      <BkHBars rows={topCats} valueFormat={(v) => String(v)} rowHeight={32} nameWidth={92} />
                    </section>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* FILTERS */}
        {items.length > 0 && (
          <div className="pxal-bar" role="toolbar" aria-label="Alert filters">
            <div className="pxal-rail" role="tablist" aria-label="Source">
              {[['all', 'All', items.length], ['alerts', 'Alerts', items.filter((i) => i.src === 'alert').length], ['platform', 'From Pratyeksha', items.filter((i) => i.src === 'platform').length]].map(([k, l, n]) => (
                <button type="button" role="tab" aria-selected={tab === k} key={k} className={`pxal-chip${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>
                  {tab === k && <Pill id="tab" />}<span style={{ position: 'relative' }}>{l}</span><em style={{ position: 'relative' }}>{n}</em>
                </button>
              ))}
              <button type="button" className={`pxal-chip${unreadOnly ? ' on' : ''}`} aria-pressed={unreadOnly} onClick={() => setUnreadOnly((v) => !v)}>
                {unreadOnly && <Pill id="unread" />}<span style={{ position: 'relative' }}>Unread only</span>
              </button>
            </div>
            {cats.length > 1 && (
              <div className="pxal-rail" aria-label="Category">
                {[['all', items.length], ...cats].map(([k, n]) => (
                  <button type="button" key={k} className={`pxal-chip${cat === k ? ' on' : ''}`} aria-pressed={cat === k} onClick={() => setCat(k)} style={{ minHeight: 36, fontSize: 11.5 }}>
                    {cat === k && <Pill id="cat" />}<span style={{ position: 'relative' }}>{k === 'all' ? 'All categories' : k}</span><em style={{ position: 'relative' }}>{n}</em>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEED */}
        {items.length === 0 ? (
          <div className="pxal-card pxal-empty"><div className="pxal-orb" style={{ background: SEV.info.soft, color: GOLD }}><Inbox size={26} /></div><b>No alerts yet</b><span>You’ll see low stock, revenue dips and kitchen delays here the moment they happen.</span></div>
        ) : view.length === 0 ? (
          <div className="pxal-card pxal-empty"><div className="pxal-orb" style={{ background: SEV.info.soft, color: GOLD }}><CheckCheck size={26} /></div><b>Nothing matches these filters</b><span>Try a different severity or category, or clear the filters to see everything.</span>{filtersOn && <button type="button" className="pxal-btn ghost" onClick={reset}>Clear filters</button>}</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {unread.length > 0 && <div className="pxal-hint">Swipe an alert right to mark it read</div>}
            {groups.map((g) => (
              <div key={g.label} style={{ display: 'grid', gap: 8 }}>
                <div className="pxal-day">{g.label}</div>
                <AnimatePresence initial={false} mode="popLayout">
                  {g.rows.map((i) => {
                    const m = SEV[i.sev]; const fresh = !i.read && now - i.at < 15 * 60000;
                    return (
                      <Motion.div key={i.key} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: 0.18 } }} transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.8 }}>
                        <Swipeable disabled={i.read} onSwipe={() => markRead(i)}>
                          <article className={`pxal-item${i.read ? ' read' : ''}`} style={{ '--c': m.color, '--s': m.soft }}>
                            <div className="pxal-ico">{i.src === 'platform' ? <Megaphone size={18} /> : <m.icon size={18} />}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="pxal-t">{i.title}</div>
                              {i.body && <div className="pxal-b">{i.body}</div>}
                              <div className="pxal-m">
                                {fresh && <span className="pxal-new">NEW</span>}
                                <span className="pxal-tag">{m.label}</span><span className="pxal-tag">{i.cat}</span>
                                <time dateTime={new Date(i.at).toISOString()} title={clock(i.at)}>{ago(i.at, now)}</time>
                              </div>
                            </div>
                            {!i.read && <button type="button" className="pxal-read" onClick={() => markRead(i)} aria-label={`Mark read: ${i.title}`}><CheckCheck size={15} /><span>Mark read</span></button>}
                          </article>
                        </Swipeable>
                      </Motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
