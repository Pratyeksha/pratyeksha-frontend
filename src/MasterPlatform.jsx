// Master Admin › Platform: health & API errors (59), realtime & jobs (60), payment failures (61), incidents (62),
// backups (63), storage per client (64), push delivery (65), app versions & installs (66), maintenance mode (67).
// Uses ONLY the Master Admin theme.
import React, { useState } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, MONO, errMsg, fmtD, fmtDT, inr, toLocalInput, useLoad, Btn, Pill, Tile, Section, Empty, Field, Modal, ErrorLine, Screen, Table, Bar, inputStyle } from './masterKit.jsx';

const api = (path, opts = {}) => axios({ url: `${API_BASE_URL}/admin/master/ops${path}`, method: opts.method || 'GET', data: opts.body, params: opts.params });
const TABS = [['health', 'Health'], ['realtime', 'Realtime & jobs'], ['payments', 'Payment failures'], ['incidents', 'Incidents'], ['backups', 'Backups'], ['usage', 'Storage'], ['push', 'Push'], ['apps', 'App versions'], ['maint', 'Maintenance']];
const dur = (s) => (s >= 86400 ? `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h` : s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}m`);
const REASON = { limit: 'UPI limit reached', declined: 'Bank declined', noopen: 'UPI app did not open', other: 'Other' };

function Health() {
  const { data, error, reload } = useLoad(() => api('/health').then((r) => r.data));
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const w = data.last60; const max = Math.max(1, ...data.series.map((s) => s.n));
  const level = !data.db.ok ? 'Database not responding' : w.errorRate >= 5 ? 'Many server errors' : data.process.lagMs > 100 ? 'Server is slow' : 'Healthy';
  return (<>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <div><Pill tone={level === 'Healthy' ? 'gold' : 'warn'}>{level}</Pill> <span style={{ fontSize: 12, color: K.faint, marginLeft: 8 }}>Up {dur(data.uptimeSec)} since {fmtDT(data.startedAt)}</span></div><Btn small kind="quiet" onClick={reload}>Refresh</Btn></div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Tile label="Requests, last hour" value={w.n.toLocaleString('en-IN')} /><Tile label="Server errors (5xx)" value={w.e5} tone={w.e5 ? 'warn' : undefined} sub={`${w.errorRate}% of requests`} /><Tile label="Average speed" value={`${w.avgMs} ms`} />
      <Tile label="Database" value={data.db.ok ? `${data.db.ms} ms` : 'Down'} tone={data.db.ok ? undefined : 'warn'} /><Tile label="Memory" value={`${data.process.rssMb} MB`} sub={`event-loop delay ${data.process.lagMs} ms`} /><Tile label="Last 24 h errors" value={data.last24h.e5} sub={`of ${data.last24h.n.toLocaleString('en-IN')}`} />
    </div>
    <Section title="Requests per minute — last hour" hint="Red marks minutes with server errors">
      <div role="img" aria-label="Requests per minute" style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 80 }}>{data.series.map((s) => <div key={s.min} title={`${s.n} requests, ${s.e5} errors`} style={{ flex: 1, height: `${Math.max(3, (s.n / max) * 100)}%`, background: s.e5 ? K.danger : K.gold, opacity: s.n ? 1 : 0.25, borderRadius: 1 }} />)}</div>
    </Section>
    <Section title="Slowest and most failing endpoints" hint="Since the server last started"><Table empty="No traffic yet." rows={data.routes.map((r) => ({ ...r, id: r.route }))} cols={[{ key: 'route', label: 'Endpoint', render: (r) => <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{r.route}</span> }, { key: 'n', label: 'Calls', right: true }, { key: 'e5', label: 'Errors', right: true, render: (r) => <span style={{ color: r.e5 ? K.danger : K.mid }}>{r.e5}</span> }, { key: 'avgMs', label: 'Avg ms', right: true }, { key: 'maxMs', label: 'Slowest ms', right: true }]} /></Section>
    <Section title="Latest server errors"><Table empty="No server errors since start." rows={data.recent.map((r, i) => ({ ...r, id: i }))} cols={[{ key: 'at', label: 'When', render: (r) => fmtDT(r.at) }, { key: 'route', label: 'Endpoint', render: (r) => <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{r.route}</span> }, { key: 'status', label: 'Status', right: true }, { key: 'ms', label: 'ms', right: true }]} /></Section>
    <div style={{ fontSize: 11, color: K.faint }}>Measured by the server itself, so it records what it served — it cannot notice a total outage. Use an outside uptime check (for example UptimeRobot on /api/health) for that.</div>
  </>);
}

function Realtime() {
  const { data, error, reload } = useLoad(() => api('/realtime').then((r) => r.data));
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  return (<>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Btn small kind="quiet" onClick={reload}>Refresh</Btn></div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><Tile label="Live connections" value={data.connected} /><Tile label="Clients online" value={data.rooms.length} /></div>
    <Section title="Live connections by client" hint="Kitchen screens, operator devices and owner apps currently connected"><Table empty="Nobody is connected right now." rows={data.rooms.map((r) => ({ ...r, id: r.tenantId }))} cols={[{ key: 'name', label: 'Client' }, { key: 'sockets', label: 'Connections', right: true }]} /></Section>
    <Section title="Background jobs" hint="Each job reports in after every run">
      <Table empty="No job has run since the server started." rows={data.jobs.map((j) => ({ ...j, id: j.name }))} cols={[{ key: 'name', label: 'Job', render: (j) => <span style={{ fontFamily: MONO, fontSize: 12 }}>{j.name}</span> }, { key: 'lastAt', label: 'Last run', render: (j) => fmtDT(j.lastAt) }, { key: 'ok', label: 'Result', render: (j) => <Pill tone={j.lastOk ? 'gold' : 'warn'}>{j.lastOk ? 'OK' : 'Failed'}</Pill> }, { key: 'runs', label: 'Runs', right: true }, { key: 'fails', label: 'Failures', right: true }, { key: 'note', label: 'Note' }]} />
      <div style={{ fontSize: 11, color: K.faint, marginTop: 8 }}>Schedule: {data.schedule.map((s) => `${s.name} ${s.every}`).join(' · ')}. Expired-plan clean-up now also runs every 6 hours, not only at server start.</div>
    </Section>
  </>);
}

function Payments() {
  const [days, setDays] = useState(30);
  const { data, error } = useLoad(() => api('/payment-failures', { params: { days } }).then((r) => r.data), [days]);
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const reasons = Object.entries(data.byReason).sort((a, b) => b[1] - a[1]);
  return (<>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ ...inputStyle, width: 140 }}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><Tile label="Failed payments" value={data.total} /><Tile label="Bill value affected" value={inr(data.amount)} /><Tile label="Clients affected" value={data.tenants.length} /></div>
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 640 }}>These are payments a guest reported as failed from the UPI screen. Money moves straight to the restaurant’s UPI, so this shows trouble guests ran into, not gateway data.</div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      <Section title="Why payments failed">{reasons.length === 0 ? <Empty text="No failures reported." /> : reasons.map(([k, v]) => <div key={k} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 36px', gap: 8, alignItems: 'center', margin: '7px 0', fontSize: 12.5 }}><span style={{ color: K.mid }}>{REASON[k] || k}</span><Bar value={v} max={reasons[0][1]} /><span style={{ textAlign: 'right', fontFamily: MONO }}>{v}</span></div>)}</Section>
      <Section title="By client"><Table empty="None." rows={data.tenants.map((t) => ({ ...t, id: t.tenantId }))} cols={[{ key: 'name', label: 'Client' }, { key: 'count', label: 'Failures', right: true }, { key: 'amount', label: 'Value', right: true, render: (t) => inr(t.amount) }]} /></Section>
    </div>
    <Section title="Latest"><Table empty="No failures reported." rows={data.recent.map((r, i) => ({ ...r, id: i }))} cols={[{ key: 'at', label: 'When', render: (r) => fmtDT(r.at) }, { key: 'tenant', label: 'Client' }, { key: 'table', label: 'Table' }, { key: 'amount', label: 'Amount', right: true, render: (r) => inr(r.amount) }, { key: 'reason', label: 'Reason', render: (r) => REASON[r.reason] || r.reason }]} /></Section>
  </>);
}

function Incidents() {
  const { data, error, reload } = useLoad(() => api('/incidents').then((r) => r.data));
  const tenants = useLoad(() => axios.get(`${API_BASE_URL}/admin/master/control/tenants`).then((r) => r.data));
  const [f, setF] = useState(null); const [u, setU] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const act = async (fn) => { try { await fn(); setF(null); setU(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <ErrorLine text={err || error} />
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><div style={{ fontSize: 11.5, color: K.faint, maxWidth: 620 }}>Open incidents also appear as a notice inside the guest and owner apps until you mark them resolved.</div><Btn kind="primary" onClick={() => { setErr(''); setF({ title: '', severity: 'minor', text: '', scope: 'all', tenants: [] }); }}>Log incident</Btn></div>
    {data.length === 0 && <Section><Empty text="No incidents logged." /></Section>}
    {data.map((i) => <Section key={i._id} title={i.title} right={<div style={{ display: 'flex', gap: 6 }}><Pill tone={i.severity === 'minor' ? 'dim' : 'warn'}>{i.severity}</Pill><Pill tone={i.status === 'resolved' ? 'dim' : 'gold'}>{i.status}</Pill></div>}>
      <div style={{ fontSize: 11, color: K.faint, marginBottom: 6 }}>Started {fmtDT(i.startedAt)}{i.resolvedAt ? ` · resolved ${fmtDT(i.resolvedAt)}` : ''} · {i.scope === 'all' ? 'everyone' : `${i.tenants.length} client(s)`}</div>
      {i.updates.map((x, k) => <div key={k} style={{ fontSize: 12.5, padding: '5px 0', borderTop: k ? `1px solid ${K.border}` : 'none' }}><span style={{ color: K.faint, fontSize: 11 }}>{fmtDT(x.at)} · {x.status}</span><div>{x.text}</div></div>)}
      {i.status !== 'resolved' && <div style={{ marginTop: 8 }}><Btn small onClick={() => { setErr(''); setU({ id: i._id, status: i.status, text: '' }); }}>Post update</Btn></div>}</Section>)}
    {f && <Modal title="Log an incident" onClose={() => setF(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="What is happening?"><input value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} style={inputStyle} placeholder="Orders are slow to reach the kitchen" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><Field label="Seriousness"><select value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })} style={inputStyle}><option value="minor">Minor</option><option value="major">Major</option><option value="critical">Critical</option></select></Field>
        <Field label="Who is affected"><select value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} style={inputStyle}><option value="all">Everyone</option><option value="selected">Selected clients</option></select></Field></div>
      {f.scope === 'selected' && <div style={{ maxHeight: 150, overflowY: 'auto', display: 'grid', gap: 5 }}>{(tenants.data?.tenants || []).map((t) => <label key={t.tenantId} style={{ fontSize: 13, display: 'flex', gap: 8 }}><input type="checkbox" checked={f.tenants.includes(t.tenantId)} onChange={(e) => setF({ ...f, tenants: e.target.checked ? [...f.tenants, t.tenantId] : f.tenants.filter((x) => x !== t.tenantId) })} />{t.name}</label>)}</div>}
      <Field label="First update (shown to users)"><textarea rows={3} value={f.text} maxLength={600} onChange={(e) => setF({ ...f, text: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setF(null)}>Cancel</Btn><Btn kind="primary" onClick={() => act(() => api('/incidents', { method: 'POST', body: f }))}>Log</Btn></div></div></Modal>}
    {u && <Modal title="Post an update" onClose={() => setU(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="Status"><select value={u.status} onChange={(e) => setU({ ...u, status: e.target.value })} style={inputStyle}><option value="investigating">Investigating</option><option value="identified">Cause found</option><option value="monitoring">Monitoring</option><option value="resolved">Resolved</option></select></Field>
      <Field label="Update"><textarea rows={3} value={u.text} maxLength={600} onChange={(e) => setU({ ...u, text: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setU(null)}>Cancel</Btn><Btn kind="primary" onClick={() => act(() => api(`/incidents/${u.id}/update`, { method: 'POST', body: u }))}>Post</Btn></div></div></Modal>}
  </>);
}

function Backups() {
  const { data, error, reload } = useLoad(() => api('/backups').then((r) => r.data));
  const [f, setF] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const lv = { ok: ['Backup is recent', 'gold'], warn: ['Backup is getting old', 'warn'], late: ['No backup for 3+ days', 'warn'], none: ['No backup recorded yet', 'warn'] }[data.level];
  const save = async () => { try { await api('/backups', { method: 'POST', body: f }); setF(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><Pill tone={lv[1]}>{lv[0]}</Pill><Btn kind="primary" onClick={() => { setErr(''); setF({ at: toLocalInput(new Date()), kind: 'manual', location: '', sizeMb: '', verified: false, note: '' }); }}>Record a backup</Btn></div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}><Tile label="Last backup" value={data.lastAt ? fmtD(data.lastAt) : '—'} sub={data.ageHours != null ? `${data.ageHours} hours ago` : ''} /><Tile label="Last verified" value={data.lastVerified ? fmtD(data.lastVerified) : '—'} /><Tile label="Last restore test" value={data.lastRestoreTest ? fmtD(data.lastRestoreTest) : 'Never'} tone={data.lastRestoreTest ? undefined : 'warn'} /></div>
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 680 }}>{data.note} A backup you have never restored is only a hope — log a “restore test” after you try one.</div>
    <Section title="Backup log"><Table empty="Nothing recorded." rows={data.rows.map((r) => ({ ...r, id: r._id }))} cols={[{ key: 'at', label: 'When', render: (r) => fmtDT(r.at) }, { key: 'kind', label: 'Type', render: (r) => <Pill tone="dim">{r.kind}</Pill> }, { key: 'location', label: 'Where' }, { key: 'sizeMb', label: 'Size', right: true, render: (r) => (r.sizeMb ? `${r.sizeMb} MB` : '—') }, { key: 'v', label: 'Checked', render: (r) => (r.verified ? <Pill tone="gold">Verified</Pill> : '—') }, { key: 'note', label: 'Note' },
      { key: 'x', right: true, render: (r) => <Btn small kind="quiet" onClick={async () => { await api(`/backups/${r._id}`, { method: 'DELETE' }); reload(); }}>Remove</Btn> }]} /></Section>
    {f && <Modal title="Record a backup" onClose={() => setF(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><Field label="When"><input type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} style={inputStyle} /></Field><Field label="Type"><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} style={inputStyle}><option value="automatic">Automatic (provider)</option><option value="manual">Manual</option><option value="restore-test">Restore test</option></select></Field></div>
      <Field label="Where is it stored?"><input value={f.location} maxLength={120} onChange={(e) => setF({ ...f, location: e.target.value })} style={inputStyle} placeholder="Atlas snapshot / Google Drive" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><Field label="Size (MB)"><input type="number" min="0" value={f.sizeMb} onChange={(e) => setF({ ...f, sizeMb: e.target.value })} style={inputStyle} /></Field><label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, paddingTop: 22 }}><input type="checkbox" checked={f.verified} onChange={(e) => setF({ ...f, verified: e.target.checked })} />I checked it opens</label></div>
      <Field label="Note"><input value={f.note} maxLength={200} onChange={(e) => setF({ ...f, note: e.target.value })} style={inputStyle} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setF(null)}>Cancel</Btn><Btn kind="primary" onClick={save}>Save</Btn></div></div></Modal>}
  </>);
}

function Usage() {
  const [fresh, setFresh] = useState(0);
  const { data, error, loading } = useLoad(() => api('/usage', { params: fresh ? { fresh: 1 } : {} }).then((r) => r.data), [fresh]);
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Counting…" />;
  return (<>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Btn small kind="quiet" onClick={() => setFresh(fresh + 1)}>{loading ? 'Counting…' : 'Recount'}</Btn></div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><Tile label="Estimated data" value={`${data.totalMb} MB`} /><Tile label="Records" value={data.totalDocs.toLocaleString('en-IN')} /><Tile label="Clients" value={data.rows.length} /></div>
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 680 }}>{data.note}</div>
    <Section title="Data per client" hint="Largest first"><Table empty="No data." rows={data.rows.map((r) => ({ ...r, id: r.tenantId }))} cols={[{ key: 'name', label: 'Client' }, { key: 'docs', label: 'Records', right: true, render: (r) => r.docs.toLocaleString('en-IN') }, { key: 'estMb', label: 'Est. MB', right: true }, { key: 'top', label: 'Biggest', render: (r) => <span style={{ fontSize: 11.5, color: K.mid }}>{r.top.join(' · ')}</span> }]} /></Section>
    <Section title="Biggest collections"><Table empty="None." rows={data.collections.map((c) => ({ ...c, id: c.name }))} cols={[{ key: 'name', label: 'Collection' }, { key: 'docs', label: 'Records', right: true, render: (c) => c.docs.toLocaleString('en-IN') }, { key: 'avgBytes', label: 'Avg bytes', right: true }]} /></Section>
  </>);
}

function Push() {
  const [days, setDays] = useState(30);
  const { data, error } = useLoad(() => api('/push', { params: { days } }).then((r) => r.data), [days]);
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const e = data.events || {};
  return (<>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><select aria-label="Period" value={days} onChange={(x) => setDays(Number(x.target.value))} style={{ ...inputStyle, width: 140 }}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}><Tile label="Campaigns sent" value={data.sends} /><Tile label="Devices tried" value={data.devices.toLocaleString('en-IN')} /><Tile label="Accepted" value={data.acceptRate == null ? '—' : `${data.acceptRate}%`} sub={`${data.accepted.toLocaleString('en-IN')} devices`} /><Tile label="Failed" value={data.failed} tone={data.failed ? 'warn' : undefined} /><Tile label="Delivered" value={e.delivered || 0} /><Tile label="Tapped" value={e.clicked || 0} /></div>
    <div style={{ fontSize: 11.5, color: K.faint }}>“Accepted” means the phone’s push service took the message. “Delivered” and “Tapped” come from the device itself and may be lower if the app was never opened afterwards.</div>
    <Section title="By client"><Table empty="No push campaigns in this period." rows={data.tenants.map((t) => ({ ...t, id: t.tenantId }))} cols={[{ key: 'name', label: 'Client' }, { key: 'sends', label: 'Sends', right: true }, { key: 'devices', label: 'Devices', right: true }, { key: 'accepted', label: 'Accepted', right: true }, { key: 'failed', label: 'Failed', right: true, render: (t) => <span style={{ color: t.failed ? K.danger : K.mid }}>{t.failed}</span> }, { key: 'acceptRate', label: 'Rate', right: true, render: (t) => (t.acceptRate == null ? '—' : `${t.acceptRate}%`) }]} /></Section>
    <Section title="Latest campaigns"><Table empty="None." rows={data.recent.map((r, i) => ({ ...r, id: i }))} cols={[{ key: 'at', label: 'Sent', render: (r) => fmtDT(r.at) }, { key: 'tenant', label: 'Client' }, { key: 'title', label: 'Title' }, { key: 'devices', label: 'Devices', right: true }, { key: 'failed', label: 'Failed', right: true }]} /></Section>
  </>);
}

function Apps() {
  const { data, error } = useLoad(() => api('/app-stats', { params: { days: 30 } }).then((r) => r.data));
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const Block = ({ title, rows }) => <Section title={title}>{rows.length === 0 ? <Empty text="No data yet." /> : rows.slice(0, 10).map((r) => <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 44px', gap: 8, alignItems: 'center', margin: '7px 0', fontSize: 12.5 }}><span style={{ color: K.mid, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.key}</span><Bar value={r.count} max={rows[0].count} /><span style={{ textAlign: 'right', fontFamily: MONO }}>{r.count}</span></div>)}</Section>;
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><Tile label="App launches, 30 days" value={data.total.toLocaleString('en-IN')} /><Tile label="Opened as installed app" value={data.installRate == null ? '—' : `${data.installRate}%`} sub={`${data.installed} launches`} /></div>
    <div style={{ fontSize: 11.5, color: K.faint }}>{data.note}</div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}><Block title="Which app" rows={data.apps} /><Block title="Version in use" rows={data.versions} /><Block title="Phone / computer" rows={data.platforms} /></div>
  </>);
}

function Maintenance() {
  const { data, error, reload } = useLoad(() => api('/maintenance').then((r) => r.data));
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false); const [m, setM] = useState(null);
  React.useEffect(() => { if (data && !f) setF({ on: data.on, message: data.message, startsAt: data.startsAt ? toLocalInput(data.startsAt) : '', endsAt: data.endsAt ? toLocalInput(data.endsAt) : '' }); }, [data, f]);
  if (!f) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const save = async (on) => {
    setBusy(true); setM(null);
    try { const r = await api('/maintenance', { method: 'PUT', body: { on, message: f.message, startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null, endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null } }); setF({ ...f, on }); setM({ t: on ? (r.data.note || 'Maintenance is scheduled. Guests and owners see the notice.') : 'Maintenance is off.' }); reload(); }
    catch (e) { setM({ t: errMsg(e), bad: true }); } finally { setBusy(false); }
  };
  return (<>
    {m && <div role={m.bad ? 'alert' : 'status'} style={{ fontSize: 12.5, color: m.bad ? K.danger : K.ok }}>{m.t}</div>}
    <Section title="Planned downtime" hint="Pick a window to announce it in advance. During the window the apps pause and show your message; this Master Admin keeps working.">
      <div style={{ display: 'grid', gap: 10, maxWidth: 560 }}>
        <Field label="Message shown to guests and owners"><textarea rows={3} value={f.message} maxLength={300} onChange={(e) => setF({ ...f, message: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} placeholder="We are upgrading Pratyeksha. Back by 3:30 PM." /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}><Field label="Starts" hint="Leave empty to start now"><input type="datetime-local" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} style={inputStyle} /></Field><Field label="Ends" hint="Leave empty to end when you switch it off"><input type="datetime-local" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} style={inputStyle} /></Field></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Pill tone={f.on ? 'warn' : 'dim'}>{f.on ? 'Switched on' : 'Off'}</Pill><span style={{ flex: 1 }} /><Btn kind="primary" busy={busy} onClick={() => save(true)}>{f.on ? 'Update' : 'Switch on'}</Btn>{f.on && <Btn busy={busy} onClick={() => save(false)}>Switch off</Btn>}</div>
        <div style={{ fontSize: 11, color: K.faint }}>A banner appears up to 2 days before the start. With no start time, the apps pause immediately.</div>
      </div></Section>
  </>);
}

export default function MasterPlatform() {
  const [tab, setTab] = useState('health');
  const view = { health: <Health />, realtime: <Realtime />, payments: <Payments />, incidents: <Incidents />, backups: <Backups />, usage: <Usage />, push: <Push />, apps: <Apps />, maint: <Maintenance /> }[tab];
  return <Screen icon={Activity} title="Platform" subtitle="Server health, realtime, payments, incidents, backups, storage, push, app versions and maintenance" tabs={TABS} tab={tab} onTab={setTab}>{view}</Screen>;
}
