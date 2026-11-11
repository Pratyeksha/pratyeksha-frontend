// Master Admin › Plans & Trials: plan catalogue + per-client plan history, add-ons per tenant, trials with grace and auto-expiry.
import React, { useMemo, useState } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { K, MONO, growthApi, errMsg, inr, fmtD, useLoad, Btn, Pill, Tile, Section, Empty, Field, Modal, ErrorLine, Screen, Table, inputStyle } from './masterKit.jsx';

const TABS = [['plans', 'Plans'], ['addons', 'Add-ons'], ['trials', 'Trials']];
const send = (path, body, method = 'POST') => growthApi(path, { method, body });

/* ───── 37 Plans ───── */
function Plans() {
  const { data, error, reload } = useLoad(() => growthApi('/plans').then((r) => r.data));
  const [form, setForm] = useState(null); const [assign, setAssign] = useState(null); const [err, setErr] = useState(''); const [info, setInfo] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const blank = { name: '', price: '', months: 12, limits: { tables: 0, outlets: 1, staff: 0 }, includes: { feedbackSuite: false, whatsappCampaigns: false }, active: true, note: '' };
  const save = async () => {
    try { const body = { ...form, price: Number(form.price), months: Number(form.months), limits: { tables: Number(form.limits.tables) || 0, outlets: Number(form.limits.outlets) || 1, staff: Number(form.limits.staff) || 0 } }; if (form._id) await send(`/plans/${form._id}`, body, 'PUT'); else await send('/plans', body); setForm(null); setErr(''); reload(); }
    catch (e) { setErr(errMsg(e)); }
  };
  const del = async (p) => { if (!window.confirm(`Delete plan "${p.name}"?`)) return; try { await send(`/plans/${p._id}`, undefined, 'DELETE'); reload(); } catch (e) { setErr(errMsg(e)); } };
  const doAssign = async () => { try { const r = await send('/plans/assign', assign); setInfo(r.data.warning || 'Plan updated.'); setAssign(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <ErrorLine text={err || error} />
    {info && <div role="status" style={{ fontSize: 12.5, color: K.ok }}>{info}</div>}
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 560 }}>Plans are your price list. Assigning one to a client records the change and compares their table count to the plan limit. Limits are shown as warnings; the apps do not block on them yet.</div>
      <div style={{ display: 'flex', gap: 8 }}><Btn onClick={() => { setAssign({ tenantId: '', planId: '', note: '' }); setErr(''); }} disabled={!data.plans.length}>Change a client's plan</Btn><Btn kind="primary" onClick={() => { setForm(blank); setErr(''); }}><Plus size={14} /> New plan</Btn></div>
    </div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>
      {data.plans.length === 0 && <Section><Empty text="No plans yet. Create your first plan (e.g. Standard 12 months)." /></Section>}
      {data.plans.map((p) => (
        <Section key={p._id} style={{ opacity: p.active ? 1 : 0.6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>{!p.active && <Pill tone="dim">inactive</Pill>}</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO, color: K.gold, margin: '8px 0 2px' }}>{inr(p.price)}</div>
          <div style={{ fontSize: 11.5, color: K.dim }}>for {p.months} month{p.months > 1 ? 's' : ''}{p.months > 0 && p.price > 0 ? ` · ${inr(p.price / p.months)}/mo` : ''}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', margin: '10px 0' }}><Pill tone="dim">{p.limits.tables ? `${p.limits.tables} tables` : 'unlimited tables'}</Pill><Pill tone="dim">{p.limits.outlets} outlet{p.limits.outlets > 1 ? 's' : ''}</Pill>{p.limits.staff > 0 && <Pill tone="dim">{p.limits.staff} staff</Pill>}{p.includes.feedbackSuite && <Pill tone="gold">Feedback Suite</Pill>}{p.includes.whatsappCampaigns && <Pill tone="gold">WhatsApp</Pill>}</div>
          {p.note && <div style={{ fontSize: 11.5, color: K.mid, marginBottom: 8 }}>{p.note}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 11.5, color: K.dim }}>{p.clients} client{p.clients === 1 ? '' : 's'}</span><div style={{ display: 'flex', gap: 6 }}><Btn small onClick={() => { setForm({ ...p }); setErr(''); }}>Edit</Btn><button type="button" aria-label={`Delete ${p.name}`} onClick={() => del(p)} style={{ background: 'none', border: 'none', color: K.faint, cursor: 'pointer' }}><Trash2 size={14} /></button></div></div>
        </Section>))}
    </div>
    <Section title="Plan change history" hint="Latest changes across all clients">
      <Table empty="No plan changes recorded." rows={data.history.map((h) => ({ ...h, id: h._id }))} cols={[
        { key: 'name', label: 'Client' }, { key: 'chg', label: 'Change', render: (h) => <span>{h.fromPlan || '—'} <span style={{ color: K.faint }}>→</span> <b style={{ color: K.gold }}>{h.toPlan || '—'}</b></span> },
        { key: 'note', label: 'Note', render: (h) => <span style={{ color: K.mid }}>{h.note || '—'}</span> }, { key: 'at', label: 'When', render: (h) => fmtD(h.at) },
      ]} />
    </Section>
    {form && <Modal title={form._id ? 'Edit plan' : 'New plan'} onClose={() => setForm(null)}>
      <ErrorLine text={err} />
      <div style={{ display: 'grid', gap: 10 }}>
        <Field label="Plan name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} style={inputStyle} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Price ₹"><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} /></Field>
          <Field label="Months"><input type="number" min="1" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} style={inputStyle} /></Field>
          <Field label="Max tables" hint="0 = unlimited"><input type="number" min="0" value={form.limits.tables} onChange={(e) => setForm({ ...form, limits: { ...form.limits, tables: e.target.value } })} style={inputStyle} /></Field>
          <Field label="Max outlets"><input type="number" min="1" value={form.limits.outlets} onChange={(e) => setForm({ ...form, limits: { ...form.limits, outlets: e.target.value } })} style={inputStyle} /></Field>
          <Field label="Max staff" hint="0 = unlimited"><input type="number" min="0" value={form.limits.staff} onChange={(e) => setForm({ ...form, limits: { ...form.limits, staff: e.target.value } })} style={inputStyle} /></Field>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={form.includes.feedbackSuite} onChange={(e) => setForm({ ...form, includes: { feedbackSuite: e.target.checked, whatsappCampaigns: e.target.checked && form.includes.whatsappCampaigns } })} style={{ accentColor: K.gold }} /> Includes Feedback Suite</label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, opacity: form.includes.feedbackSuite ? 1 : 0.5 }}><input type="checkbox" disabled={!form.includes.feedbackSuite} checked={form.includes.whatsappCampaigns} onChange={(e) => setForm({ ...form, includes: { ...form.includes, whatsappCampaigns: e.target.checked } })} style={{ accentColor: K.gold }} /> Includes WhatsApp Campaigns</label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} style={{ accentColor: K.gold }} /> Active (available for new quotes)</label>
        <Field label="Note"><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={300} style={inputStyle} /></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn onClick={() => setForm(null)}>Cancel</Btn><Btn kind="primary" disabled={!form.name.trim() || form.price === ''} onClick={save}>Save plan</Btn></div>
      </div>
    </Modal>}
    {assign && <Modal title="Change a client's plan" onClose={() => setAssign(null)}>
      <ErrorLine text={err} />
      <div style={{ display: 'grid', gap: 10 }}>
        <Field label="Client"><select value={assign.tenantId} onChange={(e) => setAssign({ ...assign, tenantId: e.target.value })} style={inputStyle}><option value="">Choose…</option>{data.clients.map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}{c.planName ? ` (${c.planName})` : ''}</option>)}</select></Field>
        <Field label="New plan"><select value={assign.planId} onChange={(e) => setAssign({ ...assign, planId: e.target.value })} style={inputStyle}><option value="">None</option>{data.plans.filter((p) => p.active).map((p) => <option key={p._id} value={p._id}>{p.name} · {inr(p.price)}</option>)}</select></Field>
        <Field label="Note"><input value={assign.note} onChange={(e) => setAssign({ ...assign, note: e.target.value })} maxLength={200} style={inputStyle} /></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn onClick={() => setAssign(null)}>Cancel</Btn><Btn kind="primary" disabled={!assign.tenantId} onClick={doAssign}>Save</Btn></div>
      </div>
    </Modal>}
  </>);
}

/* ───── 38 Add-ons ───── */
function Switch({ on, onChange, label, disabled }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)} style={{ width: 38, height: 22, borderRadius: 99, border: `1px solid ${on ? K.gold : K.borderMid}`, background: on ? K.gold : K.card2, position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', padding: 0, opacity: disabled ? 0.5 : 1, transition: 'background .15s' }}><span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: on ? '#141416' : K.mid, transition: 'left .15s' }} /></button>;
}
function Addons() {
  const { data, error, reload } = useLoad(() => growthApi('/addons').then((r) => r.data));
  const [creds, setCreds] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const put = async (id, body) => { try { await send(`/addons/${id}`, body, 'PUT'); setErr(''); setCreds(null); reload(); return true; } catch (e) { setErr(errMsg(e)); return false; } };
  const toggleFS = (c, on) => { if (on) setCreds({ c, wa: false, adminEmail: '', adminPassword: '', campaignPassword: '' }); else if (window.confirm(`Turn OFF Feedback Suite${c.whatsappCampaigns ? ' and WhatsApp Campaigns' : ''} for ${c.name}?`)) put(c.tenantId, { feedbackSuite: false }); };
  const toggleWA = (c, on) => { if (on) setCreds({ c, wa: true, onlyWa: true, campaignPassword: '' }); else put(c.tenantId, { whatsappCampaigns: false }); };
  const sums = { fs: data.clients.filter((c) => c.feedbackSuite).length, wa: data.clients.filter((c) => c.whatsappCampaigns).length };
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><Tile label="Feedback Suite" value={sums.fs} sub="clients on" /><Tile label="WhatsApp Campaigns" value={sums.wa} sub="clients on" /></div>
    <Section title="Add-ons per client" hint="Feedback Suite and WhatsApp Campaigns switch the real products. Kitchen and Combos are tracked flags only. The apps don't read them yet.">
      <Table empty="No clients." rows={data.clients.map((c) => ({ ...c, id: c.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (c) => <div><b>{c.name}</b><div style={{ fontSize: 11, color: K.dim }}>{c.area || '—'}</div></div> },
        { key: 'fs', label: 'Feedback Suite', render: (c) => <Switch on={c.feedbackSuite} label={`Feedback Suite for ${c.name}`} onChange={(v) => toggleFS(c, v)} /> },
        { key: 'wa', label: 'WhatsApp', render: (c) => <Switch on={c.whatsappCampaigns} disabled={!c.feedbackSuite} label={`WhatsApp Campaigns for ${c.name}`} onChange={(v) => toggleWA(c, v)} /> },
        { key: 'k', label: 'Kitchen', render: (c) => <Switch on={c.kitchen} label={`Kitchen for ${c.name}`} onChange={(v) => put(c.tenantId, { kitchen: v })} /> },
        { key: 'cb', label: 'Combos', render: (c) => <Switch on={c.combos} label={`Combos for ${c.name}`} onChange={(v) => put(c.tenantId, { combos: v })} /> },
      ]} />
    </Section>
    {creds && <Modal title={creds.onlyWa ? `WhatsApp Campaigns — ${creds.c.name}` : `Feedback Suite — ${creds.c.name}`} onClose={() => setCreds(null)}>
      <ErrorLine text={err} />
      <div style={{ display: 'grid', gap: 10 }}>
        {!creds.onlyWa && <><Field label="Feedback admin email"><input type="email" value={creds.adminEmail} onChange={(e) => setCreds({ ...creds, adminEmail: e.target.value })} style={inputStyle} /></Field>
          <Field label="Feedback admin password" hint="Min 10 characters. Leave blank to keep the existing one."><input type="password" autoComplete="new-password" value={creds.adminPassword} onChange={(e) => setCreds({ ...creds, adminPassword: e.target.value })} style={inputStyle} /></Field>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={creds.wa} onChange={(e) => setCreds({ ...creds, wa: e.target.checked })} style={{ accentColor: K.gold }} /> Also enable WhatsApp Campaigns</label></>}
        {(creds.onlyWa || creds.wa) && <Field label="Campaign Studio password" hint="Min 10 characters. Leave blank to keep the existing one."><input type="password" autoComplete="new-password" value={creds.campaignPassword} onChange={(e) => setCreds({ ...creds, campaignPassword: e.target.value })} style={inputStyle} /></Field>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn onClick={() => setCreds(null)}>Cancel</Btn><Btn kind="primary" onClick={() => put(creds.c.tenantId, creds.onlyWa ? { whatsappCampaigns: true, campaignPassword: creds.campaignPassword || undefined } : { feedbackSuite: true, whatsappCampaigns: creds.wa, adminEmail: creds.adminEmail || undefined, adminPassword: creds.adminPassword || undefined, campaignPassword: creds.campaignPassword || undefined })}>Turn on</Btn></div>
      </div>
    </Modal>}
  </>);
}

/* ───── 39 Trials ───── */
const TRIAL_TONE = { trial: 'gold', grace: 'warn', converted: 'ok', expired: 'danger' };
const TRIAL_LABEL = { trial: 'On trial', grace: 'Grace period', converted: 'Paid', expired: 'Expired' };
function Trials() {
  const { data, error, reload } = useLoad(() => growthApi('/trials').then((r) => r.data));
  const [form, setForm] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const start = async () => { try { await send('/trials/start', { tenantId: form.tenantId, days: Number(form.days), graceDays: Number(form.graceDays) }); setForm(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const clear = async (id) => { if (!window.confirm('Remove the trial record? The client\'s expiry date stays as it is.')) return; try { await send(`/trials/${id}/end`, {}); reload(); } catch (e) { setErr(errMsg(e)); } };
  const s = data.stats;
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}><Tile label="On trial" value={s.active} /><Tile label="In grace" value={s.grace} tone={K.warn} /><Tile label="Converted" value={s.converted} tone={K.ok} /><Tile label="Expired" value={s.expired} tone={K.danger} /><Tile label="Trial → paid" value={`${s.rate}%`} sub={`${s.decidedRate}% of finished`} /></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 580 }}>Starting a trial sets the client's expiry to trial end + grace days, so the apps lock automatically after the grace period. Recording a payment before then marks the trial as converted.</div>
      <Btn kind="primary" onClick={() => { setForm({ tenantId: '', days: data.defaults.trialDays, graceDays: data.defaults.graceDays }); setErr(''); }}><Plus size={14} /> Start a trial</Btn>
    </div>
    <Section title="Trials">
      <Table empty="No trials yet." rows={data.trials.map((t) => ({ ...t, id: t.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (t) => <div><b>{t.name}</b><div style={{ fontSize: 11, color: K.dim }}>{t.area || '—'}</div></div> },
        { key: 'state', label: 'State', render: (t) => <Pill tone={TRIAL_TONE[t.state]}>{TRIAL_LABEL[t.state]}</Pill> },
        { key: 'endsAt', label: 'Trial ends', render: (t) => <div>{fmtD(t.endsAt)}{t.state === 'trial' && <div style={{ fontSize: 10.5, color: K.faint }}>{t.daysLeft}d left</div>}</div> },
        { key: 'grace', label: 'Grace', render: (t) => <div>{t.graceDays}d<div style={{ fontSize: 10.5, color: t.state === 'grace' ? K.warn : K.faint }}>locks {fmtD(t.hardLockAt)}</div></div> },
        { key: 'o', label: 'Orders', right: true, render: (t) => <span style={{ fontFamily: MONO }}>{t.totalOrders}</span> },
        { key: 'x', label: '', right: true, render: (t) => <button type="button" aria-label={`Remove trial for ${t.name}`} onClick={() => clear(t.tenantId)} style={{ background: 'none', border: 'none', color: K.faint, cursor: 'pointer' }}><Trash2 size={14} /></button> },
      ]} />
    </Section>
    {form && <Modal title="Start a trial" onClose={() => setForm(null)}>
      <ErrorLine text={err} />
      <div style={{ display: 'grid', gap: 10 }}>
        <Field label="Client"><select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} style={inputStyle}><option value="">Choose…</option>{data.eligible.map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Trial length (days)"><input type="number" min="1" max="90" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} style={inputStyle} /></Field>
          <Field label="Grace period (days)"><input type="number" min="0" max="30" value={form.graceDays} onChange={(e) => setForm({ ...form, graceDays: e.target.value })} style={inputStyle} /></Field>
        </div>
        <div style={{ fontSize: 11.5, color: K.dim }}>Apps stay usable for {(Number(form.days) || 0) + (Number(form.graceDays) || 0)} days from today.</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn onClick={() => setForm(null)}>Cancel</Btn><Btn kind="primary" disabled={!form.tenantId} onClick={start}>Start trial</Btn></div>
      </div>
    </Modal>}
  </>);
}

/* defaults live with trials */
function Defaults() {
  const { data, reload } = useLoad(() => growthApi('/settings').then((r) => r.data));
  const [f, setF] = useState(null); const [msg, setMsg] = useState('');
  React.useEffect(() => { if (data && !f) setF({ trialDays: data.trialDays, graceDays: data.graceDays }); }, [data, f]);
  if (!f) return null;
  const save = async () => { try { await send('/settings', { trialDays: Number(f.trialDays), graceDays: Number(f.graceDays) }, 'PUT'); setMsg('Saved'); reload(); } catch (e) { setMsg(errMsg(e)); } };
  return <Section title="Trial defaults" hint="Pre-filled when you start a trial"><div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}><Field label="Trial days" style={{ width: 120 }}><input type="number" min="1" max="90" value={f.trialDays} onChange={(e) => setF({ ...f, trialDays: e.target.value })} style={inputStyle} /></Field><Field label="Grace days" style={{ width: 120 }}><input type="number" min="0" max="30" value={f.graceDays} onChange={(e) => setF({ ...f, graceDays: e.target.value })} style={inputStyle} /></Field><Btn onClick={save}>Save</Btn>{msg && <span role="status" style={{ fontSize: 12, color: K.mid }}>{msg}</span>}</div></Section>;
}

export default function MasterPlans() {
  const [tab, setTab] = useState('plans');
  const view = useMemo(() => ({ plans: <Plans />, addons: <Addons />, trials: <><Trials /><Defaults /></> }[tab]), [tab]);
  return <Screen icon={Layers} title="Plans & Trials" subtitle="Price list, add-ons and free trials with grace period" tabs={TABS} tab={tab} onTab={setTab}>{view}</Screen>;
}
