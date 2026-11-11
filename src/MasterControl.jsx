// Master Admin › Client Control: access (suspend / enable / extend), bulk actions, feature flags, view-as-client,
// outlet & table limits, setup health, links, data export & offboarding, and the audit log.
// Uses ONLY the Master Admin theme (dark surfaces, two-tone gold).
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, MONO, errMsg, fmtD, fmtDT, useLoad, useDebounced, Btn, Pill, Tile, Section, Empty, Field, Modal, ErrorLine, Screen, Table, inputStyle } from './masterKit.jsx';

const api = (path, opts = {}) => axios({ url: `${API_BASE_URL}/admin/master/control${path}`, method: opts.method || 'GET', data: opts.body, params: opts.params, responseType: opts.responseType });
const TABS = [['access', 'Access'], ['flags', 'Feature flags'], ['viewas', 'View as client'], ['limits', 'Limits'], ['health', 'Setup health'], ['links', 'Links'], ['export', 'Export & offboarding'], ['audit', 'Audit log']];
const tone = (s) => (s === 'active' ? 'gold' : s === 'expired' ? 'warn' : 'dim');
const statusLabel = (s) => ({ active: 'Active', suspended: 'Suspended', expired: 'Expired', inactive: 'Inactive' }[s] || s);
const copy = async (text) => { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } };

function download(blob, name) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ───── 40 access + 44 bulk ───── */
function Access() {
  const { data, error, reload } = useLoad(() => api('/tenants').then((r) => r.data));
  const log = useLoad(() => api('/access-log', { params: { limit: 30 } }).then((r) => r.data));
  const [q, setQ] = useState(''); const [filter, setFilter] = useState('all'); const [sel, setSel] = useState({});
  const [modal, setModal] = useState(null); const [err, setErr] = useState(''); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false);
  const rows = useMemo(() => (data?.tenants || []).filter((t) => (filter === 'all' || t.status === filter) && (!q || `${t.name} ${t.tenantId} ${t.owner}`.toLowerCase().includes(q.toLowerCase()))), [data, q, filter]);
  const ids = Object.keys(sel).filter((k) => sel[k]);
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const counts = data.tenants.reduce((a, t) => ({ ...a, [t.status]: (a[t.status] || 0) + 1 }), {});
  const run = async () => {
    setBusy(true); setErr('');
    try {
      let r;
      if (modal.bulk) r = await api('/bulk', { method: 'POST', body: { ...modal.form, action: modal.action, tenantIds: ids } });
      else r = await api(`/tenants/${modal.tenant.tenantId}/access`, { method: 'POST', body: { ...modal.form, action: modal.action } });
      const d = r.data;
      setInfo(modal.bulk ? `Done for ${d.done} client(s).${d.failed?.length ? ` Skipped ${d.failed.length}: ${d.failed.map((f) => `${f.name} (${f.error})`).join('; ')}` : ''}` : 'Saved. The change is recorded in the access log.');
      setModal(null); setSel({}); reload(); log.reload();
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const open = (action, tenant, bulk) => { setErr(''); setInfo(''); setModal({ action, tenant, bulk, form: { reason: '', days: 30, tag: '', title: '', message: '', severity: 'info' } }); };
  const set = (k, v) => setModal((m) => ({ ...m, form: { ...m.form, [k]: v } }));
  const needsReason = modal && ['suspend', 'enable', 'extend'].includes(modal.action);
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
      <Tile label="Active" value={counts.active || 0} /><Tile label="Suspended" value={counts.suspended || 0} tone={counts.suspended ? 'warn' : undefined} />
      <Tile label="Expired" value={counts.expired || 0} tone={counts.expired ? 'warn' : undefined} /><Tile label="All clients" value={data.tenants.length} />
    </div>
    {info && <div role="status" style={{ fontSize: 12.5, color: K.ok }}>{info}</div>}
    <Section title="Clients" hint="Every suspend, enable or extension needs a reason and is recorded."
      right={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input aria-label="Search clients" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, width: 160 }} />
        <select aria-label="Status filter" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...inputStyle, width: 130 }}>
          <option value="all">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="expired">Expired</option>
        </select></div>}>
      {ids.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '8px 10px', background: K.goldFaint, border: `1px solid ${K.goldLine}`, borderRadius: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12.5, color: K.gold, fontWeight: 600 }}>{ids.length} selected</span>
          <Btn small onClick={() => open('extend', null, true)}>Extend</Btn><Btn small onClick={() => open('notify', null, true)}>Send notice</Btn><Btn small onClick={() => open('tag', null, true)}>Add tag</Btn>
          <Btn small kind="danger" onClick={() => open('suspend', null, true)}>Suspend</Btn><Btn small onClick={() => open('enable', null, true)}>Enable</Btn>
          <Btn small kind="quiet" onClick={() => setSel({})}>Clear</Btn>
        </div>)}
      <Table empty="No clients match." rows={rows.map((t) => ({ ...t, id: t.tenantId }))} cols={[
        { key: 'sel', render: (t) => <input type="checkbox" aria-label={`Select ${t.name}`} checked={!!sel[t.tenantId]} onChange={(e) => setSel({ ...sel, [t.tenantId]: e.target.checked })} /> },
        { key: 'name', label: 'Client', render: (t) => <div><div style={{ fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{t.tenantId}</div></div> },
        { key: 'status', label: 'Status', render: (t) => <div><Pill tone={tone(t.status)}>{statusLabel(t.status)}</Pill>{t.reason && t.status !== 'active' && <div style={{ fontSize: 10.5, color: K.faint, marginTop: 3, maxWidth: 190 }}>{t.reason}</div>}</div> },
        { key: 'end', label: 'Plan ends', render: (t) => <span style={{ color: t.daysLeft != null && t.daysLeft < 0 ? K.danger : K.mid }}>{fmtD(t.planExpiry)}{t.daysLeft != null && <span style={{ color: K.faint }}> · {t.daysLeft < 0 ? `${-t.daysLeft}d over` : `${t.daysLeft}d`}</span>}</span> },
        { key: 'tags', label: 'Tags', render: (t) => <span>{(t.tags || []).slice(0, 3).map((x) => <span key={x} style={{ marginRight: 4 }}><Pill tone="dim">{x}</Pill></span>)}{(t.tags || []).length > 3 && <span title={t.tags.slice(3).join(', ')} style={{ fontSize: 11, color: K.faint }}>+{t.tags.length - 3}</span>}</span> },
        { key: 'act', label: '', right: true, render: (t) => <div style={{ display: 'inline-flex', gap: 6 }}>
          <Btn small onClick={() => open('extend', t)}>Extend</Btn>
          {t.status === 'suspended' || t.status === 'inactive' ? <Btn small onClick={() => open('enable', t)}>Enable</Btn> : <Btn small kind="danger" onClick={() => open('suspend', t)}>Suspend</Btn>}</div> },
      ]} />
    </Section>
    <Section title="Recent access changes">
      <Table empty="No changes yet." rows={(log.data || []).map((l) => ({ ...l, id: l._id }))} cols={[
        { key: 'at', label: 'When', render: (l) => fmtDT(l.createdAt) }, { key: 'name', label: 'Client', render: (l) => (l.tenantId === '*' ? 'Several clients' : l.name) },
        { key: 'action', label: 'Action', render: (l) => <Pill tone="dim">{l.action}</Pill> }, { key: 'reason', label: 'Reason' }, { key: 'actor', label: 'By' }]} />
    </Section>
    {modal && (
      <Modal title={`${{ suspend: 'Suspend', enable: 'Enable', extend: 'Extend', notify: 'Send notice to', tag: 'Tag' }[modal.action]} ${modal.bulk ? `${ids.length} clients` : modal.tenant.name}`} onClose={() => setModal(null)}>
        <ErrorLine text={err} />
        <div style={{ display: 'grid', gap: 10 }}>
          {modal.action === 'extend' && <Field label="Extend by (days)"><input type="number" min="1" max="730" value={modal.form.days} onChange={(e) => set('days', e.target.value)} style={inputStyle} /></Field>}
          {modal.action === 'tag' && <Field label="Tag"><input value={modal.form.tag} onChange={(e) => set('tag', e.target.value)} maxLength={30} style={inputStyle} placeholder="e.g. kolhapur-pilot" /></Field>}
          {modal.action === 'notify' && <>
            <Field label="Title"><input value={modal.form.title} onChange={(e) => set('title', e.target.value)} maxLength={100} style={inputStyle} /></Field>
            <Field label="Message"><textarea value={modal.form.message} onChange={(e) => set('message', e.target.value)} maxLength={600} rows={4} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
            <Field label="Importance"><select value={modal.form.severity} onChange={(e) => set('severity', e.target.value)} style={inputStyle}><option value="info">Info</option><option value="important">Important</option><option value="urgent">Urgent</option></select></Field></>}
          {needsReason && <Field label="Reason (recorded)"><input value={modal.form.reason} onChange={(e) => set('reason', e.target.value)} maxLength={300} style={inputStyle} placeholder="e.g. Payment received by UPI" /></Field>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setModal(null)}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={run}>Confirm</Btn></div>
        </div>
      </Modal>)}
  </>);
}

/* ───── 41 feature flags ───── */
function Flags() {
  const { data, error, reload } = useLoad(() => api('/flags').then((r) => r.data));
  const [form, setForm] = useState(null); const [pick, setPick] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const act = async (fn) => { try { await fn(); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const create = () => act(async () => { await api('/flags', { method: 'POST', body: form }); setForm(null); });
  const setMode = (f, mode) => act(() => api(`/flags/${f.key}`, { method: 'PUT', body: { mode } }));
  const del = (f) => { if (window.confirm(`Delete flag "${f.key}"?`)) act(() => api(`/flags/${f.key}`, { method: 'DELETE' })); };
  const saveSel = () => act(async () => { await api(`/flags/${pick.key}`, { method: 'PUT', body: { mode: 'selected', tenants: pick.tenants } }); setPick(null); });
  return (<>
    <ErrorLine text={err || error} />
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 560 }}>Switch a new feature on for everyone, off, or only for selected clients. Apps read the flags from <span style={{ fontFamily: MONO }}>/api/public/feature-flags/&lt;tenant&gt;</span>.</div>
      <Btn kind="primary" onClick={() => { setErr(''); setForm({ key: '', label: '', description: '' }); }}>New flag</Btn>
    </div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
      {!data.flags.length && <Section><Empty text="No flags yet. Create one when you want to roll a feature out gradually." /></Section>}
      {data.flags.map((f) => (
        <Section key={f.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div><div style={{ fontWeight: 700 }}>{f.label}</div><div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{f.key}</div></div>
            <Pill tone={f.mode === 'off' ? 'dim' : 'gold'}>{f.mode === 'selected' ? `${f.tenants.length} clients` : f.mode === 'all' ? 'On for all' : 'Off'}</Pill></div>
          {f.description && <div style={{ fontSize: 12, color: K.mid, margin: '8px 0' }}>{f.description}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <Btn small kind={f.mode === 'off' ? 'primary' : 'ghost'} onClick={() => setMode(f, 'off')}>Off</Btn>
            <Btn small kind={f.mode === 'all' ? 'primary' : 'ghost'} onClick={() => setMode(f, 'all')}>All</Btn>
            <Btn small kind={f.mode === 'selected' ? 'primary' : 'ghost'} onClick={() => setPick({ key: f.key, label: f.label, tenants: [...f.tenants] })}>Selected…</Btn>
            <Btn small kind="danger" onClick={() => del(f)}>Delete</Btn>
          </div>
        </Section>))}
    </div>
    {form && <Modal title="New feature flag" onClose={() => setForm(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="Key" hint="lowercase, numbers and _"><input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} style={inputStyle} placeholder="kitchen_display" /></Field>
      <Field label="Name"><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={inputStyle} /></Field>
      <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setForm(null)}>Cancel</Btn><Btn kind="primary" onClick={create}>Create</Btn></div></div></Modal>}
    {pick && <Modal title={`Clients for “${pick.label}”`} onClose={() => setPick(null)}><ErrorLine text={err} />
      <div style={{ maxHeight: 300, overflowY: 'auto', display: 'grid', gap: 6 }}>
        {data.tenants.map((t) => <label key={t.tenantId} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <input type="checkbox" checked={pick.tenants.includes(t.tenantId)} onChange={(e) => setPick({ ...pick, tenants: e.target.checked ? [...pick.tenants, t.tenantId] : pick.tenants.filter((x) => x !== t.tenantId) })} />{t.name}</label>)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}><Btn kind="quiet" onClick={() => setPick(null)}>Cancel</Btn><Btn kind="primary" onClick={saveSel}>Save</Btn></div></Modal>}
  </>);
}

/* ───── 42 view as client ───── */
function ViewAs() {
  const t = useLoad(() => api('/tenants').then((r) => r.data));
  const log = useLoad(() => api('/view-as-log').then((r) => r.data));
  const [target, setTarget] = useState(null); const [reason, setReason] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [q, setQ] = useState('');
  if (!t.data) return t.error ? <ErrorLine text={t.error} /> : <Empty text="Loading…" />;
  const go = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api(`/tenants/${target.tenantId}/view-as`, { method: 'POST', body: { reason } });
      const w = window.open(`${window.location.origin}${r.data.path}`, '_blank'); // (not 'noopener': that always returns null, so a blocked pop-up could not be told apart)
      try { if (w) w.opener = null; } catch { /* ignore */ }
      if (!w) setErr('Your browser blocked the new tab. Allow pop-ups for this site and try again — a log entry was already saved.');
      else { setTarget(null); setReason(''); }
      log.reload();
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const rows = t.data.tenants.filter((x) => !q || `${x.name} ${x.tenantId}`.toLowerCase().includes(q.toLowerCase()));
  return (<>
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 640 }}>Opens the client’s Owner app in a new tab for 30 minutes, so you can see exactly what they see while helping them. A reason is required and every use is logged. You never see or change their password.</div>
    <Section title="Choose a client" right={<input aria-label="Search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, width: 170 }} />}>
      <Table empty="No clients." rows={rows.map((x) => ({ ...x, id: x.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (x) => <div><div style={{ fontWeight: 600 }}>{x.name}</div><div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{x.tenantId}</div></div> },
        { key: 'status', label: 'Status', render: (x) => <Pill tone={tone(x.status)}>{statusLabel(x.status)}</Pill> },
        { key: 'a', right: true, render: (x) => <Btn small onClick={() => { setErr(''); setTarget(x); }}>View as client</Btn> }]} />
    </Section>
    <Section title="Support view log" hint="Latest 100 uses">
      <Table empty="Not used yet." rows={(log.data || []).map((l) => ({ ...l, id: l._id }))} cols={[
        { key: 'at', label: 'When', render: (l) => fmtDT(l.createdAt) }, { key: 'tenantName', label: 'Client' }, { key: 'reason', label: 'Reason' }, { key: 'actor', label: 'By' }]} />
    </Section>
    {target && <Modal title={`View as ${target.name}`} onClose={() => setTarget(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="Reason (recorded)"><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} style={inputStyle} placeholder="e.g. Owner cannot find the QR download" /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setTarget(null)}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={go}>Open owner app</Btn></div></div></Modal>}
  </>);
}

/* ───── 43 limits ───── */
function Limits() {
  const { data, error, reload } = useLoad(() => api('/limits').then((r) => r.data));
  const [edit, setEdit] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const save = async () => { try { await api(`/limits/${edit.tenantId}`, { method: 'PUT', body: edit }); setEdit(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const lim = (n) => (n ? n : '∞');
  return (<>
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 640 }}>Limits come from the client’s plan unless you set a custom one here. Table limits are enforced when the owner adds tables; outlet and staff limits are recorded for your reference. 0 means unlimited.</div>
    <Section title="Table, outlet & staff limits">
      <Table empty="No clients." rows={data.rows.map((r) => ({ ...r, id: r.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{r.tenantId}</div></div> },
        { key: 't', label: 'Tables used', render: (r) => <span style={{ color: r.over ? K.danger : K.text, fontFamily: MONO }}>{r.tableCount} / {lim(r.effective.tables)}</span> },
        { key: 'o', label: 'Outlets', render: (r) => <span style={{ fontFamily: MONO }}>{lim(r.effective.outlets)}</span> },
        { key: 's', label: 'Staff', render: (r) => <span style={{ fontFamily: MONO }}>{lim(r.effective.staff)}</span> },
        { key: 'src', label: 'Source', render: (r) => <Pill tone={r.effective.source === 'override' ? 'gold' : 'dim'}>{r.effective.source === 'override' ? 'Custom' : r.effective.source ? 'Plan' : 'None'}</Pill> },
        { key: 'a', right: true, render: (r) => <Btn small onClick={() => { setErr(''); setEdit({ tenantId: r.tenantId, name: r.name, maxTables: r.override?.maxTables || 0, maxOutlets: r.override?.maxOutlets || 0, maxStaff: r.override?.maxStaff || 0, note: r.override?.note || '' }); }}>Set limit</Btn> }]} />
    </Section>
    {edit && <Modal title={`Limits for ${edit.name}`} onClose={() => setEdit(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[['maxTables', 'Tables'], ['maxOutlets', 'Outlets'], ['maxStaff', 'Staff']].map(([k, l]) => <Field key={k} label={l}><input type="number" min="0" max="1000" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} style={inputStyle} /></Field>)}
      </div>
      <Field label="Note" hint="Set all three to 0 to go back to the plan’s limits."><input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} maxLength={200} style={inputStyle} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setEdit(null)}>Cancel</Btn><Btn kind="primary" onClick={save}>Save</Btn></div></div></Modal>}
  </>);
}

/* ───── 45 setup health ───── */
function Health() {
  const { data, error } = useLoad(() => api('/setup-health').then((r) => r.data));
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const sevTone = { high: 'warn', med: 'gold', low: 'dim' };
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Tile label="Active clients" value={data.total} /><Tile label="Fully set up" value={data.clean} /><Tile label="Need attention" value={data.rows.length} tone={data.rows.length ? 'warn' : undefined} />
    </div>
    {Object.keys(data.byIssue).length > 0 && <Section title="Most common gaps"><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{Object.entries(data.byIssue).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Pill key={k} tone="dim">{k} · {v}</Pill>)}</div></Section>}
    <Section title="Clients with setup gaps" hint="Worst first — fix these before guests notice">
      <Table empty="Every active client is fully set up." rows={data.rows.map((r) => ({ ...r, id: r.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: K.faint }}>{r.ageDays}d since onboarding</div></div> },
        { key: 'i', label: 'Missing', render: (r) => <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{r.issues.map((i) => <Pill key={i.key} tone={sevTone[i.severity]}>{i.label}</Pill>)}</div> }]} />
    </Section>
  </>);
}

/* ───── 46 links ───── */
function Links() {
  const { data, error } = useLoad(() => api('/links').then((r) => r.data));
  const [q, setQ] = useState(''); const [done, setDone] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const abs = (p, u) => u || `${window.location.origin}${p}`;
  const c = async (text, id) => { setDone((await copy(text)) ? id : ''); setTimeout(() => setDone(''), 1500); };
  const rows = data.rows.filter((r) => !q || `${r.name} ${r.tenantId}`.toLowerCase().includes(q.toLowerCase()));
  return (<>
    {!data.origin && <div style={{ fontSize: 11.5, color: K.faint }}>Tip: set PUBLIC_APP_URL on the server to show your live domain here; until then links use this page’s address.</div>}
    <Section title="Client links" right={<input aria-label="Search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, width: 170 }} />}>
      <Table empty="No clients." rows={rows.map((r) => ({ ...r, id: r.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.name}</div><Pill tone={tone(r.status)}>{statusLabel(r.status)}</Pill></div> },
        { key: 'g', label: 'Guest link', render: (r) => <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ fontFamily: MONO, fontSize: 11, color: K.mid, wordBreak: 'break-all' }}>{r.guestPath}</span><Btn small kind="quiet" onClick={() => c(abs(r.guestPath, r.guestUrl), r.tenantId + 'g')}>{done === r.tenantId + 'g' ? 'Copied' : 'Copy'}</Btn></div> },
        { key: 'o', label: 'Owner link', render: (r) => <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ fontFamily: MONO, fontSize: 11, color: K.mid, wordBreak: 'break-all' }}>{r.ownerPath}</span><Btn small kind="quiet" onClick={() => c(abs(r.ownerPath, r.ownerUrl), r.tenantId + 'o')}>{done === r.tenantId + 'o' ? 'Copied' : 'Copy'}</Btn></div> }]} />
    </Section>
  </>);
}

/* ───── 47 export & offboarding ───── */
function ExportTab() {
  const t = useLoad(() => api('/tenants').then((r) => r.data));
  const off = useLoad(() => api('/offboarding').then((r) => r.data));
  const [pick, setPick] = useState(''); const [csv, setCsv] = useState(null); const [err, setErr] = useState(''); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(''); const [form, setForm] = useState(null);
  if (!t.data) return t.error ? <ErrorLine text={t.error} /> : <Empty text="Loading…" />;
  const fetchBlob = async (path, params, name) => { const r = await api(path, { params, responseType: 'blob' }); download(r.data, name); };
  const wrapRun = async (key, fn) => { setBusy(key); setErr(''); setInfo(''); try { await fn(); } catch (e) { let m = errMsg(e); try { if (e?.response?.data instanceof Blob) m = JSON.parse(await e.response.data.text()).error || m; } catch {} setErr(m); } finally { setBusy(''); } };
  const tn = t.data.tenants.find((x) => x.tenantId === pick);
  const loadCsv = () => wrapRun('list', async () => setCsv((await api(`/tenants/${pick}/export`, { params: { format: 'csv' } })).data.collections));
  const offboard = () => wrapRun('off', async () => { const r = await api(`/tenants/${form.tenantId}/offboard`, { method: 'POST', body: form }); setInfo(r.data.note); setForm(null); off.reload(); t.reload(); });
  return (<>
    <ErrorLine text={err} />{info && <div role="status" style={{ fontSize: 12.5, color: K.ok }}>{info}</div>}
    <Section title="Export a client’s data" hint="Passwords, tokens and hashes are always removed.">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="Client" style={{ flex: '1 1 220px' }}><select value={pick} onChange={(e) => { setPick(e.target.value); setCsv(null); }} style={inputStyle}><option value="">Select…</option>{t.data.tenants.map((x) => <option key={x.tenantId} value={x.tenantId}>{x.name}</option>)}</select></Field>
        <Btn disabled={!pick} busy={busy === 'json'} onClick={() => wrapRun('json', () => fetchBlob(`/tenants/${pick}/export`, { format: 'json' }, `${pick}-export.json`))}>Download everything (JSON)</Btn>
        <Btn disabled={!pick} busy={busy === 'list'} kind="quiet" onClick={loadCsv}>Choose CSV tables</Btn>
      </div>
      {csv && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        {!csv.length && <Empty text="This client has no data yet." />}
        {csv.map((c) => <Btn key={c.name} small kind="ghost" busy={busy === c.name} onClick={() => wrapRun(c.name, () => fetchBlob(`/tenants/${pick}/export`, { format: 'csv', collection: c.name }, `${pick}-${c.name}.csv`))}>{c.name} · {c.count}</Btn>)}</div>}
      {tn && <div style={{ marginTop: 14 }}><Btn kind="danger" onClick={() => setForm({ tenantId: pick, name: tn.name, reason: '', keepDays: 30 })}>Start offboarding {tn.name}…</Btn></div>}
    </Section>
    <Section title="Offboarding" hint="Access is switched off and data is kept until you remove the client from the Dashboard.">
      <Table empty="No clients being offboarded." rows={(off.data || []).map((o) => ({ ...o, id: o.tenantId }))} cols={[
        { key: 'name', label: 'Client' }, { key: 'reason', label: 'Reason' }, { key: 'p', label: 'Keep data until', render: (o) => fmtD(o.purgeAfter) },
        { key: 'e', label: 'Exported', render: (o) => (o.exportedAt ? fmtD(o.exportedAt) : <Pill tone="warn">Not yet</Pill>) },
        { key: 'a', right: true, render: (o) => <Btn small kind="quiet" onClick={() => wrapRun('x' + o.tenantId, async () => { await api(`/offboarding/${o.tenantId}`, { method: 'DELETE' }); off.reload(); })}>Dismiss</Btn> }]} />
    </Section>
    {form && <Modal title={`Offboard ${form.name}`} onClose={() => setForm(null)}><div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, color: K.mid }}>This suspends access now. Nothing is deleted. Download the export first.</div>
      <Field label="Reason (recorded)"><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={inputStyle} maxLength={300} /></Field>
      <Field label="Keep data for (days)"><input type="number" min="7" max="365" value={form.keepDays} onChange={(e) => setForm({ ...form, keepDays: e.target.value })} style={inputStyle} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setForm(null)}>Cancel</Btn><Btn kind="danger" busy={busy === 'off'} onClick={offboard}>Offboard</Btn></div></div></Modal>}
  </>);
}

/* ───── 69 audit log ───── */
function Audit() {
  const [f, setF] = useState({ actor: '', failed: false, q: '', from: '', to: '' });
  const dq = useDebounced(f.q);
  const { data, error, loading, reload } = useLoad(() => api('/audit', { params: { actor: f.actor || undefined, failed: f.failed ? 1 : undefined, q: dq || undefined, from: f.from || undefined, to: f.to || undefined, limit: 300 } }).then((r) => r.data), [f.actor, f.failed, dq, f.from, f.to]);
  return (<>
    <ErrorLine text={error} />
    <Section title="Everything done in Master Admin" hint="Each change request is recorded with who, what and when. Passwords and tokens are never stored."
      right={<Btn small kind="quiet" onClick={reload}>{loading ? 'Loading…' : 'Refresh'}</Btn>}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'flex-end' }}>
        <Field label="Who" style={{ flex: '0 1 150px' }}><select value={f.actor} onChange={(e) => setF({ ...f, actor: e.target.value })} style={inputStyle}><option value="">Anyone</option>{(data?.actors || []).map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>
        <Field label="Path contains" style={{ flex: '1 1 150px' }}><input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} style={inputStyle} placeholder="plans, tenants…" /></Field>
        <Field label="From" style={{ flex: '0 1 150px' }}><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} style={inputStyle} /></Field>
        <Field label="To" style={{ flex: '0 1 150px' }}><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} style={inputStyle} /></Field>
        <label style={{ fontSize: 12.5, color: K.mid, display: 'flex', gap: 6, alignItems: 'center', paddingBottom: 9 }}><input type="checkbox" checked={f.failed} onChange={(e) => setF({ ...f, failed: e.target.checked })} />Failed only</label>
      </div>
      <Table empty="No entries match." rows={(data?.rows || []).map((r) => ({ ...r, id: r._id }))} cols={[
        { key: 'at', label: 'When', render: (r) => fmtDT(r.createdAt) }, { key: 'actor', label: 'Who' },
        { key: 'm', label: 'Action', render: (r) => <span><Pill tone="dim">{r.method}</Pill> <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{r.path}</span></span> },
        { key: 'status', label: 'Result', render: (r) => <Pill tone={r.status >= 400 ? 'warn' : 'gold'}>{r.status}</Pill> }, { key: 'ip', label: 'IP', render: (r) => <span style={{ fontFamily: MONO, fontSize: 11, color: K.faint }}>{r.ip || '—'}</span> }]} />
    </Section>
  </>);
}

export default function MasterControl() {
  const [tab, setTab] = useState('access');
  const view = { access: <Access />, flags: <Flags />, viewas: <ViewAs />, limits: <Limits />, health: <Health />, links: <Links />, export: <ExportTab />, audit: <Audit /> }[tab];
  return <Screen icon={ShieldCheck} title="Client Control" subtitle="Access, feature flags, support view, limits, setup health and audit" tabs={TABS} tab={tab} onTab={setTab}>{view}</Screen>;
}
