/* Owner → Kitchen performance, redesigned for density.
 * - one command card: Bklit gauge + four target-checked metrics + trend chips (replaces the score card AND the 4 KPI tiles)
 * - live tickets as compact tiles: SLA ring per ticket, dish-progress segments, oldest first, SLA split bar, filters, show-more
 * - prep-time trend (Bklit bars) next to slowest dishes as inline bars (replaces chart + duplicate table)
 * - mobile-first: 2-up ticket tiles at 360px, no fixed heights around charts, nothing clipped
 */
import React, { useMemo, useState } from 'react';
import { motion as Motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react';
import { Timer, ChefHat, PackageX, CheckCircle2, ArrowDownRight, ArrowUpRight, Flame, ChevronDown } from 'lucide-react';
import { BkGauge, BkColumns } from './ownerCharts.jsx';

const GOLD = '#d3bfa2';
const AMBER = 'rgba(226,154,88,0.95)';
const ORANGE = 'rgba(214,109,39,0.95)';
const ageTone = (m) => (m >= 15 ? { c: ORANGE, s: 'rgba(214,109,39,0.14)', k: 'late' } : m > 10 ? { c: AMBER, s: 'rgba(226,154,88,0.12)', k: 'watch' } : { c: GOLD, s: 'rgba(211,191,162,0.1)', k: 'ok' });
const flagTone = (f) => (f === 'Flag' ? ORANGE : f === 'Watch' ? AMBER : GOLD);
const SLA_MAX = 20; // ring is full at 20 min

const CSS = `
.pxk{display:grid;gap:14px;min-width:0}.pxk *{box-sizing:border-box}
.pxk-card{background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.016));border:1px solid rgba(211,191,162,.16);border-radius:18px;
  box-shadow:0 18px 44px -22px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.05);min-width:0}
.pxk-hero{display:grid;grid-template-columns:minmax(150px,200px) 1fr;gap:6px 18px;padding:16px 18px;align-items:center}
.pxk-gauge{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.pxk-verdict{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:4px 10px;border-radius:8px}
.pxk-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;min-width:0}
.pxk-m{border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.025);border-radius:13px;padding:10px 11px;min-width:0}
.pxk-m small{display:flex;align-items:center;gap:6px;font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pxk-m small i{width:6px;height:6px;border-radius:50%;flex:0 0 auto}
.pxk-m b{display:block;margin-top:5px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:19px;font-weight:800;color:#f7f3eb;line-height:1.1;white-space:nowrap}
.pxk-m span{display:block;margin-top:3px;font-size:10px;color:rgba(255,255,255,.45)}
.pxk-trend{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.pxk-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:10px;font-size:11px;color:rgba(255,255,255,.7);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);white-space:nowrap}
.pxk-chip b{font-family:'JetBrains Mono',ui-monospace,monospace;color:#f7f3eb}
.pxk-hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 16px 6px}
.pxk-hd h3{margin:0;font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${GOLD};display:flex;align-items:center;gap:8px}
.pxk-live{width:8px;height:8px;border-radius:50%;background:${GOLD};position:relative;flex:0 0 auto}
.pxk-live::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid ${GOLD};opacity:0;animation:pxkPing 2s ease-out infinite}
@keyframes pxkPing{0%{opacity:.6;transform:scale(.6)}100%{opacity:0;transform:scale(1.5)}}
.pxk-sum{margin-left:auto;font-size:11px;color:rgba(255,255,255,.55);white-space:nowrap}
.pxk-sla{display:flex;height:7px;border-radius:6px;overflow:hidden;margin:6px 16px 0;background:rgba(255,255,255,.06);gap:2px}
.pxk-sla i{display:block;height:100%;min-width:0}
.pxk-rail{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:10px 16px 4px;-webkit-overflow-scrolling:touch}
.pxk-rail::-webkit-scrollbar{display:none}
.pxk-pill{position:relative;flex:0 0 auto;min-height:36px;padding:0 13px;border-radius:11px;font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap;
  border:1px solid rgba(211,191,162,.16);background:transparent;color:rgba(255,255,255,.62);display:inline-flex;align-items:center;gap:6px;-webkit-tap-highlight-color:transparent}
.pxk-pill.on{color:#f7f3eb;border-color:transparent}.pxk-pill em{font-style:normal;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;opacity:.7}
.pxk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr));gap:8px;padding:8px 16px 14px}
.pxk-tile{position:relative;border-radius:14px;padding:10px 11px 10px;background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(255,255,255,.014));border:1px solid var(--bd);min-width:0;overflow:hidden}
.pxk-tile::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--c)}
.pxk-tile.ready{box-shadow:0 0 0 1px rgba(211,191,162,.4) inset,0 10px 26px -14px rgba(211,191,162,.4)}
.pxk-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.pxk-tbl{font-size:13px;font-weight:800;color:#f7f3eb;letter-spacing:-.01em;white-space:nowrap}
.pxk-tbl small{display:block;font-size:9px;letter-spacing:.12em;font-weight:800;color:var(--c);text-transform:uppercase;margin-top:1px}
.pxk-ring{position:relative;width:38px;height:38px;flex:0 0 auto}
.pxk-ring svg{display:block;transform:rotate(-90deg)}
.pxk-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px;font-weight:800;color:#f7f3eb}
.pxk-items{margin-top:7px;font-size:11px;line-height:1.4;color:rgba(255,255,255,.66);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;min-height:30px}
.pxk-segs{display:flex;gap:3px;margin-top:8px}
.pxk-segs i{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.1);min-width:0}
.pxk-segs i.d{background:${GOLD}}.pxk-segs i.s{background:${AMBER}}
.pxk-st{margin-top:5px;font-size:10px;color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pxk-more{display:flex;justify-content:center;padding:0 16px 14px}
.pxk-btn{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 16px;border-radius:12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;color:rgba(255,255,255,.75);
  border:1px solid rgba(211,191,162,.22);background:rgba(255,255,255,.03);-webkit-tap-highlight-color:transparent}
.pxk-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px}
.pxk-pad{padding:0 16px 16px}
.pxk-sub{padding:0 16px;margin:-2px 0 8px;font-size:11px;color:rgba(255,255,255,.45)}
.pxk-dish{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px;align-items:center;padding:8px 0;border-top:1px solid rgba(255,255,255,.05)}
.pxk-dish:first-child{border-top:0}
.pxk-dish span{font-size:12.5px;font-weight:600;color:#f7f3eb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pxk-dish em{font-style:normal;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px;color:rgba(255,255,255,.8);white-space:nowrap}
.pxk-bar{grid-column:1/-1;height:5px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden}
.pxk-bar i{display:block;height:100%;border-radius:3px;transform-origin:0 50%}
.pxk-flag{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:6px;margin-left:8px;vertical-align:1px}
.pxk-86{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 16px}
.pxk-86 div{display:flex;flex-direction:column;gap:2px;padding:8px 11px;border-radius:12px;background:rgba(214,109,39,.08);border:1px solid rgba(214,109,39,.25);min-width:0;max-width:100%}
.pxk-86 b{font-size:12px;color:#f7f3eb;overflow-wrap:anywhere}.pxk-86 span{font-size:10.5px;color:rgba(255,255,255,.55)}
.pxk-empty{display:flex;align-items:center;gap:10px;padding:14px 16px 18px;font-size:12.5px;color:rgba(255,255,255,.62)}
@media (max-width:760px){.pxk-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){
  .pxk-hero{grid-template-columns:1fr;padding:14px}
  .pxk-grid{grid-template-columns:repeat(2,minmax(0,1fr));padding:8px 12px 12px;gap:7px}
  .pxk-hd{padding:12px 12px 4px}.pxk-sla{margin:6px 12px 0}.pxk-rail{padding:10px 12px 4px}
  .pxk-pad,.pxk-sub,.pxk-86,.pxk-more{padding-left:12px;padding-right:12px}
  .pxk-sum{margin-left:0;flex-basis:100%}
}
@media (prefers-reduced-motion:reduce){.pxk-live::after{animation:none}}
`;

const AgeRing = ({ minutes, color, reduce }) => {
  const r = 15; const pct = Math.min(1, Math.max(0.04, minutes / SLA_MAX));
  return (
    <div className="pxk-ring" role="img" aria-label={`${minutes} minutes open`}>
      <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
        <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="4" />
        <Motion.circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" initial={{ pathLength: reduce ? pct : 0 }} animate={{ pathLength: pct }} transition={{ duration: reduce ? 0 : 0.9, ease: [0.85, 0, 0.15, 1] }} />
      </svg>
      <b>{minutes}</b>
    </div>
  );
};

const Pill = () => <Motion.span layoutId="pxk-pill" aria-hidden="true" transition={{ type: 'spring', stiffness: 500, damping: 38 }} style={{ position: 'absolute', inset: 0, borderRadius: 11, border: '1px solid rgba(211,191,162,.5)', background: 'linear-gradient(135deg,rgba(211,191,162,.22),rgba(211,191,162,.06))' }} />;

export default function KitchenView({ data }) {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const tickets = useMemo(() => [...(data.liveTickets || [])].sort((a, b) => (b.ageMinutes || 0) - (a.ageMinutes || 0)), [data.liveTickets]);
  const late = tickets.filter((t) => t.ageMinutes >= 15).length;
  const watch = tickets.filter((t) => t.ageMinutes > 10 && t.ageMinutes < 15).length;
  const ok = tickets.length - late - watch;
  const ready = tickets.filter((t) => t.status === 'ready').length;
  const shown = tickets.filter((t) => (filter === 'late' ? t.ageMinutes >= 15 : filter === 'ready' ? t.status === 'ready' : true));
  const LIMIT = 8; const visible = showAll ? shown : shown.slice(0, LIMIT);

  const score = Number(data.score) || 0;
  const verdict = score >= 80 ? { t: 'Excellent', c: GOLD, s: 'rgba(211,191,162,.14)' } : score >= 60 ? { t: 'Good', c: AMBER, s: 'rgba(226,154,88,.14)' } : { t: 'Needs attention', c: ORANGE, s: 'rgba(214,109,39,.16)' };
  const metrics = [
    { l: 'Avg prep', v: `${data.avgPrepTime}m`, pass: data.avgPrepTime < 15, t: 'target < 15 min' },
    { l: 'Delayed', v: data.delayedTickets, pass: data.delayedTickets < 5, t: 'target < 5' },
    { l: 'Rejection', v: `${data.rejectionRate}%`, pass: data.rejectionRate === 0, t: 'target 0%' },
    { l: 'Wastage', v: `\u20B9${Number(data.wastageCost || 0).toLocaleString('en-IN')}`, pass: data.wastageCost < 1000, t: 'target < \u20B91,000' },
  ];
  const tr = data.trends || {};
  const diff = Number(tr.yesterdayAvg) - Number(tr.todayAvg);
  const faster = diff > 0; const flat = !Number.isFinite(diff) || diff === 0;
  const dishes = (data.slowestDishes || []).slice(0, 6);
  const maxDish = Math.max(1, ...dishes.map((d) => Number(d.avgTime) || 0));

  return (
    <LayoutGroup>
      <style>{CSS}</style>
      <div className="pxk">
        {/* COMMAND CARD */}
        <div className="pxk-card pxk-hero">
          <div className="pxk-gauge">
            <BkGauge value={score} centerValue={score} suffix="" label="OUT OF 100" maxWidth={190} />
            <span className="pxk-verdict" style={{ color: verdict.c, background: verdict.s }}>{verdict.t}</span>
          </div>
          <div className="pxk-metrics">
            {metrics.map((m) => (
              <div className="pxk-m" key={m.l}>
                <small><i style={{ background: m.pass ? GOLD : ORANGE }} />{m.l}</small>
                <b style={{ color: m.pass ? '#f7f3eb' : ORANGE }}>{m.v}</b>
                <span>{m.t}</span>
              </div>
            ))}
          </div>
          <div className="pxk-trend">
            <span className="pxk-chip"><Timer size={13} color={GOLD} />Today <b>{tr.todayAvg}m</b>
              {!flat && <span style={{ display: 'inline-flex', alignItems: 'center', color: faster ? GOLD : ORANGE }}>{faster ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{Math.abs(diff).toFixed(1).replace(/\.0$/, '')}m vs yesterday</span>}
            </span>
            <span className="pxk-chip">Yesterday <b>{tr.yesterdayAvg}m</b></span>
            <span className="pxk-chip">Week avg <b>{tr.weekAvg}m</b></span>
            <span className="pxk-chip">Best <b>{tr.best}m</b></span>
            <span className="pxk-chip">Worst <b>{tr.worst}m</b></span>
          </div>
        </div>

        {/* LIVE TICKETS */}
        <div className="pxk-card" style={{ overflow: 'hidden' }}>
          <div className="pxk-hd">
            <h3><span className="pxk-live" />Live tickets</h3>
            <span className="pxk-sum">{tickets.length === 0 ? 'Kitchen is clear' : `${tickets.length} open${late ? ` \u00B7 ${late} late` : ''}${ready ? ` \u00B7 ${ready} ready` : ''}`}</span>
          </div>
          {tickets.length === 0 ? (
            <div className="pxk-empty"><CheckCircle2 size={20} color={GOLD} />No open tickets right now. New orders appear here the moment they reach the kitchen.</div>
          ) : (
            <>
              <div className="pxk-sla" role="img" aria-label={`${ok} on time, ${watch} watch, ${late} late`}>
                {ok > 0 && <Motion.i style={{ flex: ok, background: GOLD, originX: 0 }} initial={{ scaleX: reduce ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6 }} />}
                {watch > 0 && <Motion.i style={{ flex: watch, background: AMBER, originX: 0 }} initial={{ scaleX: reduce ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.05 }} />}
                {late > 0 && <Motion.i style={{ flex: late, background: ORANGE, originX: 0 }} initial={{ scaleX: reduce ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.1 }} />}
              </div>
              <div className="pxk-rail" role="tablist" aria-label="Ticket filter">
                {[['all', 'All', tickets.length], ['late', 'Late', late], ['ready', 'Ready', ready]].map(([k, l, n]) => (
                  <button type="button" role="tab" aria-selected={filter === k} key={k} className={`pxk-pill${filter === k ? ' on' : ''}`} onClick={() => { setFilter(k); setShowAll(false); }}>
                    {filter === k && <Pill />}<span style={{ position: 'relative' }}>{l}</span><em style={{ position: 'relative' }}>{n}</em>
                  </button>
                ))}
              </div>
              {shown.length === 0 ? (
                <div className="pxk-empty"><CheckCircle2 size={18} color={GOLD} />Nothing {filter === 'late' ? 'is running late' : 'is waiting for pickup'} right now.</div>
              ) : (
                <div className="pxk-grid">
                  <AnimatePresence initial={false} mode="popLayout">
                    {visible.map((t) => {
                      const tone = ageTone(t.ageMinutes); const isReady = t.status === 'ready';
                      const total = Math.min(8, Math.max(0, t.itemsTotal || 0)); const done = Math.min(total, t.itemsDone || 0); const started = Math.min(total - done, t.itemsStarted || 0);
                      const items = t.items || [];
                      return (
                        <Motion.div key={`${t.tableNumber}:${items.join('|')}`} layout={!reduce} initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          className={`pxk-tile${isReady ? ' ready' : ''}`} style={{ '--c': tone.c, '--bd': tone.k === 'late' ? 'rgba(214,109,39,.4)' : 'rgba(255,255,255,.07)' }}>
                          <div className="pxk-top">
                            <div className="pxk-tbl">Table {t.tableNumber}<small>{isReady ? 'Ready' : tone.k === 'late' ? 'Late' : tone.k === 'watch' ? 'Watch' : 'Cooking'}</small></div>
                            <AgeRing minutes={t.ageMinutes} color={tone.c} reduce={reduce} />
                          </div>
                          <div className="pxk-items" title={items.join(', ')}>{items.slice(0, 2).join(', ')}{items.length > 2 ? ` +${items.length - 2}` : ''}</div>
                          {total > 0 && (
                            <>
                              <div className="pxk-segs" aria-hidden="true">{Array.from({ length: total }, (_, i) => <i key={i} className={i < done ? 'd' : i < done + started ? 's' : ''} />)}</div>
                              <div className="pxk-st">{isReady ? `Waiting ${t.waitingMinutes || 0}m` : `${t.itemsDone || 0}/${t.itemsTotal} done${t.itemsStarted ? ` \u00B7 ${t.itemsStarted} cooking` : ''}`}</div>
                            </>
                          )}
                        </Motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
              {shown.length > LIMIT && (
                <div className="pxk-more"><button type="button" className="pxk-btn" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
                  {showAll ? 'Show fewer' : `Show all ${shown.length}`}<ChevronDown size={15} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button></div>
              )}
            </>
          )}
        </div>

        {/* TREND + SLOWEST */}
        <div className="pxk-two">
          <div className="pxk-card">
            <div className="pxk-hd"><h3><Timer size={13} />Prep time trend</h3></div>
            <div className="pxk-sub">Average minutes per ticket</div>
            <div className="pxk-pad">
              <BkColumns height={170} valueFormat={(v) => `${v}m`} highlightLabel="Today" rows={[
                { label: 'Yesterday', value: tr.yesterdayAvg }, { label: 'Today', value: tr.todayAvg }, { label: 'Week avg', value: tr.weekAvg }, { label: 'Best', value: tr.best }, { label: 'Worst', value: tr.worst },
              ]} />
            </div>
          </div>
          <div className="pxk-card">
            <div className="pxk-hd"><h3><ChefHat size={13} />Slowest dishes</h3></div>
            <div className="pxk-sub">Average prep time today</div>
            {dishes.length === 0 ? <div className="pxk-empty"><ChefHat size={18} color={GOLD} />No prep-time data yet today.</div> : (
              <div className="pxk-pad">
                {dishes.map((d, i) => (
                  <div className="pxk-dish" key={`${d.name}-${i}`}>
                    <span title={d.name}>{d.name}{d.flag && d.flag !== 'OK' && <b className="pxk-flag" style={{ color: flagTone(d.flag), background: 'rgba(255,255,255,.05)' }}>{d.flag}</b>}</span>
                    <em>{d.avgTime}m</em>
                    <div className="pxk-bar"><Motion.i style={{ width: `${Math.max(4, ((Number(d.avgTime) || 0) / maxDish) * 100)}%`, background: flagTone(d.flag) }} initial={{ scaleX: reduce ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : i * 0.06, ease: [0.85, 0, 0.15, 1] }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 86'd */}
        {(data.eightySixedToday || []).length > 0 && (
          <div className="pxk-card">
            <div className="pxk-hd"><h3><PackageX size={13} />86&rsquo;d today</h3><span className="pxk-sum">{data.eightySixedToday.length} {data.eightySixedToday.length === 1 ? 'item' : 'items'} unavailable</span></div>
            <div className="pxk-86">{data.eightySixedToday.map((e, i) => <div key={i}><b>{e.name}</b><span>{e.reason}{e.time ? ` \u00B7 ${e.time}` : ''}</span></div>)}</div>
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
