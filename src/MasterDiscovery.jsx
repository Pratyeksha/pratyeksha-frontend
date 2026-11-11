// Master Admin › Discovery: listing approval, featured placement, offers oversight, discovery analytics,
// cities / areas / cuisines lists and guest reports. Uses ONLY the Master Admin theme.
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Compass } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, MONO, errMsg, fmtD, fmtDT, useLoad, Btn, Pill, Tile, Section, Empty, Field, Modal, ErrorLine, Screen, Table, Bar, inputStyle } from './masterKit.jsx';

const api = (path, opts = {}) => axios({ url: `${API_BASE_URL}/admin/master/discovery${path}`, method: opts.method || 'GET', data: opts.body, params: opts.params });
const TABS = [['approval', 'Listing approval'], ['featured', 'Featured'], ['offers', 'Offers'], ['analytics', 'Analytics'], ['lists', 'Cities & cuisines'], ['reports', 'Reports']];
const stTone = { approved: 'gold', pending: 'warn', hidden: 'dim', rejected: 'dim' };
const REASON = { wrong_info: 'Wrong information', closed: 'Closed / not operating', bad_offer: 'Offer not honoured', inappropriate: 'Inappropriate', other: 'Other' };

/* ───── 48 approval ───── */
function Approval() {
  const { data, error, reload } = useLoad(() => api('/listings').then((r) => r.data));
  const [filter, setFilter] = useState('all'); const [q, setQ] = useState(''); const [sel, setSel] = useState({}); const [m, setM] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const rows = useMemo(() => (data?.rows || []).filter((r) => (filter === 'all' || r.status === filter) && (!q || `${r.name} ${r.tenantId} ${r.area}`.toLowerCase().includes(q.toLowerCase()))), [data, filter, q]);
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const ids = Object.keys(sel).filter((k) => sel[k]);
  const run = async () => {
    setBusy(true); setErr('');
    try {
      if (m.bulk) await api('/listings/bulk', { method: 'POST', body: { status: m.status, tenantIds: ids, note: m.note } });
      else await api(`/listings/${m.row.tenantId}/status`, { method: 'POST', body: { status: m.status, note: m.note } });
      setM(null); setSel({}); reload();
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const quick = async (row, status) => { try { await api(`/listings/${row.tenantId}/status`, { method: 'POST', body: { status, note: '' } }); reload(); } catch (e) { setErr(errMsg(e)); } };
  const c = data.counts;
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
      <Tile label="Live to guests" value={data.rows.filter((r) => r.liveToGuests).length} /><Tile label="Waiting for approval" value={c.pending || 0} tone={c.pending ? 'warn' : undefined} /><Tile label="Hidden" value={(c.hidden || 0) + (c.rejected || 0)} /><Tile label="All outlets" value={data.rows.length} />
    </div>
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 680 }}>{data.requireApproval ? 'New outlets start as “Waiting for approval” and stay out of the guest directory until you approve them.' : 'New outlets are listed automatically. Turn on “approve new listings first” in Settings › Platform defaults if you want to review each one.'} Hiding an outlet only removes it from the guest directory; its own menu link keeps working.</div>
    <ErrorLine text={err} />
    <Section title="Outlets" right={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input aria-label="Search outlets" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, width: 150 }} />
      <select aria-label="Status filter" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...inputStyle, width: 150 }}><option value="all">All</option><option value="pending">Waiting for approval</option><option value="approved">Approved</option><option value="hidden">Hidden</option><option value="rejected">Rejected</option></select></div>}>
      {ids.length > 0 && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '8px 10px', background: K.goldFaint, border: `1px solid ${K.goldLine}`, borderRadius: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: K.gold, fontWeight: 600 }}>{ids.length} selected</span>
        <Btn small onClick={() => { setErr(''); setM({ bulk: true, status: 'approved', note: '' }); }}>Approve</Btn><Btn small kind="danger" onClick={() => { setErr(''); setM({ bulk: true, status: 'hidden', note: '' }); }}>Hide</Btn><Btn small kind="quiet" onClick={() => setSel({})}>Clear</Btn></div>}
      <Table empty="No outlets match." rows={rows.map((r) => ({ ...r, id: r.tenantId }))} cols={[
        { key: 's', render: (r) => <input type="checkbox" aria-label={`Select ${r.name}`} checked={!!sel[r.tenantId]} onChange={(e) => setSel({ ...sel, [r.tenantId]: e.target.checked })} /> },
        { key: 'name', label: 'Outlet', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: K.faint }}>{[r.area, r.city].filter(Boolean).join(', ') || 'No area / city'}</div></div> },
        { key: 'st', label: 'Status', render: (r) => <div><Pill tone={stTone[r.status]}>{r.status === 'pending' ? 'Waiting' : r.status}</Pill>{r.note && <div style={{ fontSize: 10.5, color: K.faint, marginTop: 3, maxWidth: 170 }}>{r.note}</div>}</div> },
        { key: 'live', label: 'Guests see it', render: (r) => (r.liveToGuests ? <Pill tone="gold">Yes</Pill> : <span style={{ color: K.faint, fontSize: 12 }}>{!r.active ? 'Access off' : r.expired ? 'Plan expired' : r.status !== 'approved' ? 'Not approved' : 'Type not listed'}</span>) },
        { key: 'miss', label: 'Missing', render: (r) => (r.missing.length ? <span style={{ fontSize: 11.5, color: K.warn }}>{r.missing.join(', ')}</span> : <span style={{ color: K.faint }}>—</span>) },
        { key: 'a', right: true, render: (r) => <div style={{ display: 'inline-flex', gap: 6 }}>
          {r.status !== 'approved' && <Btn small onClick={() => quick(r, 'approved')}>Approve</Btn>}
          {r.status !== 'hidden' && r.status !== 'rejected' && <Btn small kind="danger" onClick={() => { setErr(''); setM({ row: r, status: r.status === 'pending' ? 'rejected' : 'hidden', note: '' }); }}>{r.status === 'pending' ? 'Reject' : 'Hide'}</Btn>}</div> }]} />
    </Section>
    {m && <Modal title={`${m.status === 'approved' ? 'Approve' : m.status === 'rejected' ? 'Reject' : 'Hide'} ${m.bulk ? `${ids.length} outlets` : m.row.name}`} onClose={() => setM(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      {m.status !== 'approved' && <Field label="Reason (only you see this)"><input value={m.note} onChange={(e) => setM({ ...m, note: e.target.value })} maxLength={300} style={inputStyle} /></Field>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setM(null)}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={run}>Confirm</Btn></div></div></Modal>}
  </>);
}

/* ───── 49 featured ───── */
function Featured() {
  const { data, error, reload } = useLoad(() => api('/featured').then((r) => r.data));
  const [f, setF] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const go = async (row, featured, days) => { try { await api(`/featured/${row.tenantId}`, { method: 'POST', body: { featured, days } }); setF(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <ErrorLine text={err || error} />
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 680 }}>Featured outlets are pinned first in the guest directory with a “Featured” ribbon. Give a number of days for a paid placement — it switches itself off on the end date.</div>
    <Section title="Featured placement" hint="Last 30 days of guest attention shown for each outlet">
      <Table empty="No outlets." rows={data.rows.map((r) => ({ ...r, id: r.tenantId }))} cols={[
        { key: 'name', label: 'Outlet', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: K.faint }}>{[r.area, r.city].filter(Boolean).join(', ')}</div></div> },
        { key: 's', label: 'Status', render: (r) => (r.live ? <div><Pill tone="gold">Featured</Pill><div style={{ fontSize: 10.5, color: K.faint, marginTop: 3 }}>{r.until ? `until ${fmtD(r.until)}` : 'no end date'}</div>{!r.visible && <div style={{ fontSize: 10.5, color: K.warn }}>Outlet is not visible</div>}</div> : r.featured && r.until ? <Pill tone="dim">Ended {fmtD(r.until)}</Pill> : <span style={{ color: K.faint }}>—</span>) },
        { key: 'i', label: 'Seen', right: true, render: (r) => <span style={{ fontFamily: MONO }}>{r.impressions}</span> }, { key: 'o', label: 'Opened', right: true, render: (r) => <span style={{ fontFamily: MONO }}>{r.opens}</span> },
        { key: 'a', right: true, render: (r) => <div style={{ display: 'inline-flex', gap: 6 }}><Btn small onClick={() => setF({ row: r, days: 30 })}>{r.live ? 'Change' : 'Feature'}</Btn>{r.live && <Btn small kind="quiet" onClick={() => go(r, false)}>Remove</Btn>}</div> }]} />
    </Section>
    {f && <Modal title={`Feature ${f.row.name}`} onClose={() => setF(null)}><div style={{ display: 'grid', gap: 10 }}>
      <Field label="For how many days?" hint="Leave empty for no end date"><input type="number" min="1" max="730" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} style={inputStyle} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setF(null)}>Cancel</Btn><Btn kind="primary" onClick={() => go(f.row, true, f.days)}>Save</Btn></div></div></Modal>}
  </>);
}

/* ───── 50 offers ───── */
function Offers() {
  const { data, error, reload } = useLoad(() => api('/offers').then((r) => r.data));
  const [state, setState] = useState('live'); const [m, setM] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const sm = data.summary; const rows = data.rows.filter((o) => state === 'all' || o.state === state || (state === 'flagged' && o.warn && o.state === 'live'));
  const toggle = async (o, active, reason) => { try { await api(`/offers/${o._id}/toggle`, { method: 'POST', body: { active, reason } }); setM(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const val = (o) => (o.type === 'percent_off' ? `${o.value}% off` : o.type === 'fixed_off' ? `₹${o.value} off` : o.type === 'free_item' ? 'Free item' : 'Happy hour');
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}><Tile label="Live offers" value={sm.live} /><Tile label="Outlets with offers" value={sm.outlets} /><Tile label="Look unusual" value={sm.flagged} tone={sm.flagged ? 'warn' : undefined} /><Tile label="Expired" value={sm.expired} /></div>
    <ErrorLine text={err || error} />
    <Section title="Offers across all outlets" hint="Newest 500. Switching one off hides it from guests immediately; the owner can switch it back on."
      right={<select aria-label="Offer filter" value={state} onChange={(e) => setState(e.target.value)} style={{ ...inputStyle, width: 130 }}><option value="live">Live</option><option value="flagged">Look unusual</option><option value="expired">Expired</option><option value="off">Switched off</option><option value="all">All</option></select>}>
      <Table empty="No offers here." rows={rows.map((o) => ({ ...o, id: o._id }))} cols={[
        { key: 't', label: 'Outlet', render: (o) => o.tenant }, { key: 'title', label: 'Offer', render: (o) => <div><div style={{ fontWeight: 600 }}>{o.title}</div>{o.code && <div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{o.code}</div>}</div> },
        { key: 'v', label: 'Value', render: (o) => <span>{val(o)}{o.minOrder ? <span style={{ color: K.faint }}> · min ₹{o.minOrder}</span> : null}</span> },
        { key: 'e', label: 'Ends', render: (o) => (o.expiresAt ? fmtD(o.expiresAt) : 'No end') },
        { key: 's', label: 'State', render: (o) => <div><Pill tone={o.state === 'live' ? 'gold' : 'dim'}>{o.state}</Pill>{o.warn && o.state === 'live' && <div style={{ fontSize: 10.5, color: K.warn, marginTop: 3 }}>{o.warn}</div>}</div> },
        { key: 'a', right: true, render: (o) => (o.state === 'live' ? <Btn small kind="danger" onClick={() => { setErr(''); setM({ o, reason: '' }); }}>Switch off</Btn> : o.state === 'off' ? <Btn small onClick={() => toggle(o, true)}>Switch on</Btn> : null) }]} />
    </Section>
    {m && <Modal title={`Switch off “${m.o.title}”`} onClose={() => setM(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="Reason (recorded)"><input value={m.reason} maxLength={300} onChange={(e) => setM({ ...m, reason: e.target.value })} style={inputStyle} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setM(null)}>Cancel</Btn><Btn kind="danger" onClick={() => toggle(m.o, false, m.reason)}>Switch off</Btn></div></div></Modal>}
  </>);
}

/* ───── 51 analytics ───── */
function Analytics() {
  const [days, setDays] = useState(30);
  const { data, error } = useLoad(() => api('/analytics', { params: { days } }).then((r) => r.data), [days]);
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const t = data.totals; const p = data.previous; const maxO = Math.max(1, ...data.trend.map((x) => x.opens)); const maxI = Math.max(1, ...data.trend.map((x) => x.impressions));
  const delta = (k) => { const a = t[k] || 0, b = p[k] || 0; if (!b) return a ? 'new' : ''; const d = Math.round(((a - b) / b) * 100); return `${d >= 0 ? '+' : ''}${d}% vs before`; };
  const lift = data.featuredLift;
  return (<>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ ...inputStyle, width: 140 }}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
    <ErrorLine text={error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      {[['impressions', 'Outlets seen'], ['opens', 'Outlets opened'], ['searches', 'Searches'], ['calls', 'Calls'], ['directions', 'Directions'], ['saves', 'Saved']].map(([k, l]) => <Tile key={k} label={l} value={(t[k] || 0).toLocaleString('en-IN')} sub={delta(k)} />)}
    </div>
    <Section title="Daily trend" hint="Taller bar = more guests. Gold = opened, grey = seen">
      <div role="img" aria-label="Daily discovery trend" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 110 }}>
        {data.trend.map((d) => <div key={d.day} title={`${d.day}: seen ${d.impressions}, opened ${d.opens}`} style={{ flex: 1, minWidth: 2, height: '100%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <div style={{ flex: 1, height: `${Math.max(2, (d.impressions / maxI) * 100)}%`, background: K.borderMid, borderRadius: 2 }} /><div style={{ flex: 1, height: `${Math.max(2, (d.opens / maxO) * 100)}%`, background: K.gold, borderRadius: 2 }} /></div>)}
      </div>
    </Section>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      <Section title="Where guests open outlets from">{data.sources.every((s) => !s.opens) ? <Empty text="No data yet." /> : data.sources.filter((s) => s.opens).map((s) => <div key={s.source} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 44px', gap: 8, alignItems: 'center', margin: '7px 0', fontSize: 12.5 }}><span style={{ color: K.mid, textTransform: 'capitalize' }}>{s.source}</span><Bar value={s.opens} max={data.sources[0].opens} /><span style={{ textAlign: 'right', fontFamily: MONO }}>{s.opens}</span></div>)}</Section>
      <Section title="Top areas">{data.areas.length === 0 ? <Empty text="No data yet." /> : data.areas.map((a) => <div key={a.area} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 44px', gap: 8, alignItems: 'center', margin: '7px 0', fontSize: 12.5 }}><span style={{ color: K.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.area}</span><Bar value={a.opens} max={data.areas[0].opens || 1} /><span style={{ textAlign: 'right', fontFamily: MONO }}>{a.opens}</span></div>)}</Section>
    </div>
    {lift.featuredCount > 0 && <Section title="Does Featured help?"><div style={{ fontSize: 13, color: K.mid }}>Featured outlets get <b style={{ color: K.gold }}>{lift.featuredAvgOpens}</b> opens on average, other outlets <b style={{ color: K.text }}>{lift.otherAvgOpens}</b> in this period.</div></Section>}
    <Section title="Most opened outlets"><Table empty="No guest activity yet." rows={data.top.map((r) => ({ ...r, id: r.tenantId }))} cols={[{ key: 'name', label: 'Outlet', render: (r) => <span>{r.name} {r.featured && <Pill tone="gold">Featured</Pill>}</span> }, { key: 'impressions', label: 'Seen', right: true }, { key: 'opens', label: 'Opened', right: true }, { key: 'ctr', label: 'Open rate', right: true, render: (r) => `${r.ctr}%` }, { key: 'calls', label: 'Calls', right: true }, { key: 'saves', label: 'Saved', right: true }]} /></Section>
  </>);
}

/* ───── 52 lists ───── */
function Lists() {
  const { data, error, reload } = useLoad(() => api('/master').then((r) => r.data));
  const [f, setF] = useState({ kind: 'city', name: '', city: '' }); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const add = async (body) => { try { await api('/master', { method: 'POST', body }); setF({ ...f, name: '' }); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const act = async (fn) => { try { await fn(); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const cities = data.items.filter((i) => i.kind === 'city');
  const group = (kind, title) => (
    <Section title={title}>
      {data.items.filter((i) => i.kind === kind).length === 0 && <Empty text="Nothing added yet." />}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {data.items.filter((i) => i.kind === kind).map((i) => <span key={i._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: K.card2, border: `1px solid ${K.border}`, borderRadius: 999, padding: '4px 6px 4px 11px', fontSize: 12.5, opacity: i.active ? 1 : 0.5 }}>
          {i.name}{i.city ? <span style={{ color: K.faint }}> · {i.city}</span> : null}{i.used ? <span style={{ color: K.faint, fontFamily: MONO, fontSize: 10.5 }}>{i.used}</span> : null}
          <button aria-label={`${i.active ? 'Hide' : 'Show'} ${i.name}`} onClick={() => act(() => api(`/master/${i._id}`, { method: 'PUT', body: { active: !i.active } }))} style={{ background: 'none', border: 'none', color: K.gold, cursor: 'pointer', fontSize: 11 }}>{i.active ? 'hide' : 'show'}</button>
          <button aria-label={`Remove ${i.name}`} onClick={() => act(() => api(`/master/${i._id}`, { method: 'DELETE' }))} style={{ background: 'none', border: 'none', color: K.danger, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button></span>)}
      </div>
    </Section>);
  return (<>
    <ErrorLine text={err || error} />
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 680 }}>One tidy list of the cities, areas and cuisines you operate in. Apps can read it from <span style={{ fontFamily: MONO }}>/api/public/discovery-master</span>. The small number on a chip is how many outlets use it today.</div>
    <Section title="Add to a list"><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <Field label="List" style={{ flex: '0 1 140px' }}><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} style={inputStyle}><option value="city">City</option><option value="area">Area</option><option value="cuisine">Cuisine</option></select></Field>
      {f.kind === 'area' && <Field label="City" style={{ flex: '0 1 170px' }}><select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} style={inputStyle}><option value="">Choose…</option>{cities.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}</select></Field>}
      <Field label="Name" style={{ flex: '1 1 180px' }}><input value={f.name} maxLength={60} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add(f)} style={inputStyle} /></Field>
      <Btn kind="primary" onClick={() => add(f)}>Add</Btn></div></Section>
    {data.unlisted.length > 0 && <Section title="In use but not in your list" hint="Tap to add">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{data.unlisted.map((u) => <Btn key={u.kind + u.name} small kind="quiet" onClick={() => (u.kind === 'area' ? setF({ kind: 'area', name: u.name, city: '' }) : add({ kind: u.kind, name: u.name }))}>{u.name} · {u.kind} · {u.count}</Btn>)}</div></Section>}
    {group('city', 'Cities')}{group('area', 'Areas')}{group('cuisine', 'Cuisines / outlet types')}
  </>);
}

/* ───── 53 reports ───── */
function Reports() {
  const [status, setStatus] = useState('open');
  const { data, error, reload } = useLoad(() => api('/reports', { params: { status } }).then((r) => r.data), [status]);
  const [m, setM] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const run = async (r, action, note) => { try { await api(`/reports/${r._id}/resolve`, { method: 'POST', body: { action, note } }); setM(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <ErrorLine text={err || error} />
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 680 }}>Guest reports arrive from <span style={{ fontFamily: MONO }}>POST /api/public/listing-report</span> (5 per hour per device). Several reports for one outlet are a good sign to look closer.</div>
    <Section title={`Reports${data.open ? ` · ${data.open} open` : ''}`} right={<select aria-label="Report status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: 130 }}><option value="open">Open</option><option value="actioned">Actioned</option><option value="dismissed">Dismissed</option><option value="">All</option></select>}>
      <Table empty="No reports." rows={data.rows.map((r) => ({ ...r, id: r._id }))} cols={[
        { key: 'at', label: 'When', render: (r) => fmtDT(r.createdAt) }, { key: 'tenantName', label: 'Outlet', render: (r) => <span>{r.tenantName}{r.sameOutlet > 1 && <span style={{ marginLeft: 6 }}><Pill tone="warn">{r.sameOutlet} reports</Pill></span>}</span> },
        { key: 'reason', label: 'Reason', render: (r) => <div><div>{REASON[r.reason] || r.reason}</div>{r.note && <div style={{ fontSize: 11.5, color: K.mid, maxWidth: 260 }}>{r.note}</div>}</div> },
        { key: 'st', label: 'Status', render: (r) => <Pill tone={r.status === 'open' ? 'warn' : 'dim'}>{r.status}</Pill> },
        { key: 'a', right: true, render: (r) => (r.status === 'open' ? <div style={{ display: 'inline-flex', gap: 6 }}><Btn small kind="quiet" onClick={() => run(r, 'dismiss', '')}>Dismiss</Btn><Btn small kind="danger" onClick={() => { setErr(''); setM({ r, note: '' }); }}>Hide outlet</Btn></div> : null) }]} />
    </Section>
    {m && <Modal title={`Hide ${m.r.tenantName} from guests`} onClose={() => setM(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="Reason (recorded)"><input value={m.note} maxLength={300} onChange={(e) => setM({ ...m, note: e.target.value })} style={inputStyle} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setM(null)}>Cancel</Btn><Btn kind="danger" onClick={() => run(m.r, 'hide', m.note)}>Hide outlet</Btn></div></div></Modal>}
  </>);
}

export default function MasterDiscovery() {
  const [tab, setTab] = useState('approval');
  const view = { approval: <Approval />, featured: <Featured />, offers: <Offers />, analytics: <Analytics />, lists: <Lists />, reports: <Reports /> }[tab];
  return <Screen icon={Compass} title="Discovery" subtitle="Guest directory: approval, featured placement, offers, analytics and reports" tabs={TABS} tab={tab} onTab={setTab}>{view}</Screen>;
}
