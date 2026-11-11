// Master Admin › Messages (76-79): announcements to clients (scheduling, seen-by), direct messages, templates, delivery log.
// Uses ONLY the Master Admin theme.
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, MONO, errMsg, useLoad, fmtDT, toLocalInput, Btn, Pill, Section, Empty, Field, Modal, ErrorLine, Screen, Table, inputStyle } from './masterKit.jsx';

const ADM = `${API_BASE_URL}/admin/master`;
const api = (m, p, body, params) => axios({ url: `${ADM}${p}`, method: m, data: body, params }).then((r) => r.data);
const useNote = () => { const [m, setM] = useState(null); return [m, (t, bad) => { setM({ t, bad }); if (!bad) setTimeout(() => setM(null), 3500); }]; };
const Note = ({ m }) => (m ? <div role={m.bad ? 'alert' : 'status'} style={{ fontSize: 12.5, color: m.bad ? K.danger : K.ok, marginBottom: 8 }}>{m.t}</div> : null);
const SEV = { info: 'Info', important: 'Important', urgent: 'Urgent' };
const STAT_TONE = { live: 'gold', scheduled: 'warn', ended: 'dim', cancelled: 'dim' };
const clientsHook = () => useLoad(() => api('GET', '/tenants'));
const VARS = ['{{name}}', '{{owner}}', '{{expiry}}', '{{days}}'];

/* ───── announcements ───── */
function Announcements() {
  const list = useLoad(() => api('GET', '/comms/announcements')); const tpls = useLoad(() => api('GET', '/comms/templates')); const clients = clientsHook(); const [m, note] = useNote();
  const blank = { title: '', message: '', severity: 'info', target: 'all', tenantIds: [], audience: ['owner', 'operator'], when: 'now', scheduledAt: '', expiresAt: '' };
  const [f, setF] = useState(blank); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [open, setOpen] = useState(null); const [pick, setPick] = useState('');
  const useTpl = (id) => { const t = (tpls.data || []).find((x) => x._id === id); if (t) setF((p) => ({ ...p, title: t.title || p.title, message: t.body })); };
  const toggleId = (id) => setF((p) => ({ ...p, tenantIds: p.tenantIds.includes(id) ? p.tenantIds.filter((x) => x !== id) : [...p.tenantIds, id] }));
  const toggleAud = (a) => setF((p) => ({ ...p, audience: p.audience.includes(a) ? p.audience.filter((x) => x !== a) : [...p.audience, a] }));
  const send = async () => {
    setBusy(true); setErr('');
    try {
      const body = { title: f.title, message: f.message, severity: f.severity, target: f.target, tenantIds: f.tenantIds, audience: f.audience, scheduledAt: f.when === 'later' && f.scheduledAt ? new Date(f.scheduledAt).toISOString() : undefined, expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : undefined };
      if (f.when === 'later' && !f.scheduledAt) throw new Error('Pick the date and time to send');
      const r = await api('POST', '/comms/announcements', body); setF(blank); setPick(''); note(r.scheduled ? `Scheduled for ${r.count} client${r.count === 1 ? '' : 's'}.` : `Sent to ${r.count} client${r.count === 1 ? '' : 's'}.`); list.reload();
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const cancel = async (a) => { try { await api('DELETE', `/comms/announcements/${a._id}`); note('Cancelled.'); list.reload(); } catch (e) { note(errMsg(e), true); } };
  const ok = f.title.trim().length >= 3 && f.message.trim().length >= 5 && f.audience.length > 0 && (f.target !== 'selected' || f.tenantIds.length > 0);
  return (<>
    <Note m={m} />
    <Section title="New announcement" hint="Appears inside the owner and operator apps. Choose who, and when.">
      <div style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
        <Field label="Start from a template"><select value={pick} onChange={(e) => { setPick(e.target.value); useTpl(e.target.value); }} style={inputStyle}><option value="">— none —</option>{(tpls.data || []).filter((t) => t.channel === 'inapp').map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></Field>
        <Field label="Title"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={inputStyle} maxLength={120} /></Field>
        <Field label="Message"><textarea rows={4} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} maxLength={1500} /></Field>
        <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <Field label="Importance"><select value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })} style={inputStyle}>{Object.entries(SEV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Send to"><select value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} style={inputStyle} aria-label="Send to"><option value="all">All active clients</option><option value="expiring">Plans ending in 30 days</option><option value="selected">Choose clients…</option></select></Field>
          <Field label="Shown in"><div style={{ display: 'flex', gap: 14, paddingTop: 8, fontSize: 13, color: K.mid }}>{[['owner', 'Owner app'], ['operator', 'Operator app']].map(([k, l]) => <label key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={f.audience.includes(k)} onChange={() => toggleAud(k)} /> {l}</label>)}</div></Field>
        </div>
        {f.target === 'selected' && <div style={{ border: `1px solid ${K.border}`, borderRadius: 10, padding: 8, maxHeight: 170, overflow: 'auto', display: 'grid', gap: 4 }}>
          {(clients.data || []).map((c) => <label key={c.tenantId} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: K.text }}><input type="checkbox" checked={f.tenantIds.includes(c.tenantId)} onChange={() => toggleId(c.tenantId)} /> {c.name} <span style={{ color: K.faint, fontFamily: MONO, fontSize: 11 }}>{c.tenantId}</span></label>)}
          {!(clients.data || []).length && <Empty text="No clients yet." />}
        </div>}
        <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <Field label="When"><select value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })} style={inputStyle} aria-label="When"><option value="now">Send now</option><option value="later">Schedule for later</option></select></Field>
          {f.when === 'later' && <Field label="Send at"><input type="datetime-local" value={f.scheduledAt} min={toLocalInput(new Date())} onChange={(e) => setF({ ...f, scheduledAt: e.target.value })} style={inputStyle} aria-label="Send at" /></Field>}
          <Field label="Hide after (optional)"><input type="datetime-local" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} style={inputStyle} aria-label="Hide after" /></Field>
        </div>
        <ErrorLine text={err} />
        <div><Btn kind="primary" busy={busy} disabled={!ok} onClick={send}>{f.when === 'later' ? 'Schedule' : 'Send now'}</Btn></div>
      </div>
    </Section>
    <Section title="Sent & scheduled" hint="“Seen” counts owners who opened the notification in their app.">
      <ErrorLine text={list.error} />
      <Table rows={list.data || []} onRow={setOpen} empty="No announcements yet." cols={[
        { key: 'title', label: 'Announcement', render: (a) => <div><div style={{ color: K.text, fontWeight: 600 }}>{a.title}</div><div style={{ fontSize: 11, color: K.faint }}>{SEV[a.severity]} · {a.target === 'all' ? 'All clients' : a.target === 'expiring' ? 'Plans ending soon' : 'Chosen clients'}</div></div> },
        { key: 'scheduledAt', label: 'Goes out', render: (a) => fmtDT(a.scheduledAt) },
        { key: 'status', label: 'Status', render: (a) => <Pill tone={STAT_TONE[a.status]}>{a.status === 'live' ? 'Live' : a.status === 'scheduled' ? 'Scheduled' : a.status === 'ended' ? 'Ended' : 'Cancelled'}</Pill> },
        { key: 'seen', label: 'Seen by', render: (a) => (a.status === 'cancelled' ? '—' : a.ownerOnlySeen ? `${a.seen} of ${a.total}` : 'Not tracked') },
        { key: 'x', label: '', right: true, render: (a) => (a.status === 'scheduled' ? <Btn small kind="danger" onClick={(e) => { e?.stopPropagation?.(); cancel(a); }}>Cancel</Btn> : null) },
      ]} />
    </Section>
    {open && <AnnModal id={open._id} onClose={() => setOpen(null)} />}
  </>);
}
function AnnModal({ id, onClose }) {
  const d = useLoad(() => api('GET', `/comms/announcements/${id}`)); const a = d.data;
  return (<Modal title={a?.title || 'Announcement'} onClose={onClose} width={520}>
    <ErrorLine text={d.error} />
    {a && (<div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 13, color: K.mid, whiteSpace: 'pre-wrap' }}>{a.message}</div>
      <div style={{ fontSize: 12, color: K.faint }}>Sent by {a.createdBy} · {fmtDT(a.scheduledAt)}{a.expiresAt ? ` · hides ${fmtDT(a.expiresAt)}` : ''}</div>
      <div style={{ display: 'grid', gap: 4, maxHeight: 260, overflow: 'auto' }}>
        {a.rows.map((r) => <div key={r.tenantId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: K.text, padding: '6px 8px', borderRadius: 8, background: K.card2 }}><span>{r.name}</span>{r.seen ? <Pill>Seen</Pill> : <Pill tone="dim">Not yet</Pill>}</div>)}
      </div>
    </div>)}
  </Modal>);
}

/* ───── direct message ───── */
function Direct() {
  const clients = clientsHook(); const tpls = useLoad(() => api('GET', '/comms/templates')); const ch = useLoad(() => api('GET', '/comms/channels'));
  const [f, setF] = useState({ tenantId: '', channel: 'whatsapp', templateId: '', subject: '', body: '', to: '' }); const [busy, setBusy] = useState(false); const [m, note] = useNote(); const [missing, setMissing] = useState([]);
  useEffect(() => { if (!f.tenantId || !f.templateId) return; api('GET', '/comms/render', null, { tenantId: f.tenantId, templateId: f.templateId }).then((r) => { setF((p) => ({ ...p, subject: r.title, body: r.body, to: p.channel === 'email' ? r.email || p.to : p.to })); setMissing(r.missing); }).catch((e) => note(errMsg(e), true)); /* eslint-disable-next-line */ }, [f.tenantId, f.templateId]);
  const send = async () => { setBusy(true); try { const r = await api('POST', '/comms/send', f); if (r.url) window.open(r.url, '_blank'); note(r.note || 'Done.'); } catch (e) { note(errMsg(e), true); } finally { setBusy(false); } };
  return (<>
    <Note m={m} />
    <Section title="Message one client" hint="WhatsApp opens with your text ready to send. E-mail goes out from the server when it is set up.">
      <div style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
        <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <Field label="Client"><select value={f.tenantId} onChange={(e) => setF({ ...f, tenantId: e.target.value })} style={inputStyle} aria-label="Client"><option value="">Choose…</option>{(clients.data || []).map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Field>
          <Field label="Channel"><select value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })} style={inputStyle} aria-label="Channel"><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option></select></Field>
          <Field label="Template"><select value={f.templateId} onChange={(e) => setF({ ...f, templateId: e.target.value })} style={inputStyle} aria-label="Template"><option value="">— none —</option>{(tpls.data || []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></Field>
        </div>
        {f.channel === 'email' && (<>
          {ch.data && !ch.data.email && <div style={{ fontSize: 12.5, color: K.warn }}>E-mail is not set up on the server yet (SMTP_HOST, SMTP_USER, SMTP_PASS). Use WhatsApp, or set those and restart.</div>}
          <Field label="To"><input value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} style={inputStyle} placeholder="Leave empty to use the client's saved e-mail" /></Field>
          <Field label="Subject"><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} style={inputStyle} /></Field>
        </>)}
        <Field label="Message" hint={missing.length ? `Not filled in for this client: ${missing.join(', ')}` : `You can use ${VARS.join(' ')} in templates`}><textarea rows={6} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} aria-label="Message" /></Field>
        <div><Btn kind="primary" busy={busy} disabled={!f.tenantId || f.body.trim().length < 3} onClick={send}>{f.channel === 'whatsapp' ? 'Open in WhatsApp' : 'Send e-mail'}</Btn></div>
      </div>
    </Section>
  </>);
}

/* ───── templates ───── */
function Templates() {
  const { data, error, reload } = useLoad(() => api('GET', '/comms/templates')); const [edit, setEdit] = useState(null); const [m, note] = useNote();
  const del = async (t) => { try { await api('DELETE', `/comms/templates/${t._id}`); note('Template deleted.'); reload(); } catch (e) { note(errMsg(e), true); } };
  const CH = { inapp: 'In-app', whatsapp: 'WhatsApp', email: 'E-mail' };
  return (<>
    <Note m={m} /><ErrorLine text={error} />
    <Section title="Message templates" hint={`Reusable wording. Placeholders: ${VARS.join('  ')} are filled in for each client.`} right={<Btn small kind="primary" onClick={() => setEdit({})}>New template</Btn>}>
      <Table rows={data || []} empty="No templates." cols={[
        { key: 'name', label: 'Name', render: (t) => <div><div style={{ color: K.text, fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: 11.5, color: K.faint, maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.body}</div></div> },
        { key: 'channel', label: 'For', render: (t) => <Pill tone="dim">{CH[t.channel] || t.channel}</Pill> },
        { key: 'category', label: 'Group' },
        { key: 'x', label: '', right: true, render: (t) => <span style={{ display: 'inline-flex', gap: 6 }}><Btn small kind="quiet" onClick={() => setEdit(t)}>Edit</Btn><Btn small kind="danger" onClick={() => del(t)}>Delete</Btn></span> },
      ]} />
    </Section>
    {edit && <TplModal t={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); note('Saved.'); reload(); }} />}
  </>);
}
function TplModal({ t, onClose, onDone }) {
  const [f, setF] = useState({ name: t.name || '', channel: t.channel || 'inapp', title: t.title || '', body: t.body || '', category: t.category || 'general' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); setErr(''); try { if (t._id) await api('PUT', `/comms/templates/${t._id}`, f); else await api('POST', '/comms/templates', f); onDone(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<Modal title={t._id ? 'Edit template' : 'New template'} onClose={onClose} width={540}><div style={{ display: 'grid', gap: 12 }}>
    <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inputStyle} /></Field>
    <div className="k-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <Field label="Meant for"><select value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })} style={inputStyle}><option value="inapp">In-app announcement</option><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option></select></Field>
      <Field label="Group"><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} style={inputStyle} /></Field>
    </div>
    <Field label="Title / subject"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={inputStyle} /></Field>
    <Field label="Text" hint={`Placeholders: ${VARS.join('  ')}`}><textarea rows={6} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
    <ErrorLine text={err} /><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={save}>Save</Btn></div>
  </div></Modal>);
}

/* ───── delivery log ───── */
function DeliveryLog() {
  const [channel, setChannel] = useState(''); const [status, setStatus] = useState(''); const { data, error } = useLoad(() => api('GET', '/comms/log', null, { channel: channel || undefined, status: status || undefined }), [channel, status]);
  const tone = (s) => (s === 'failed' ? 'warn' : s === 'scheduled' || s === 'cancelled' ? 'dim' : 'gold');
  return (<>
    <ErrorLine text={error} />
    <Section title="Delivery log" hint={data ? `${data.failed7d} failed in the last 7 days. WhatsApp is recorded as “handed over” because WhatsApp does not report back.` : ''} right={<span style={{ display: 'inline-flex', gap: 8 }}>
      <select value={channel} onChange={(e) => setChannel(e.target.value)} style={{ ...inputStyle, width: 'auto' }} aria-label="Channel filter"><option value="">All channels</option><option value="in-app">In-app</option><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option></select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: 'auto' }} aria-label="Status filter"><option value="">Any status</option><option value="delivered">Delivered</option><option value="scheduled">Scheduled</option><option value="sent">Sent</option><option value="handed-over">Handed over</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></span>}>
      <Table rows={data?.rows || []} empty="Nothing sent yet." cols={[
        { key: 'at', label: 'When', render: (r) => fmtDT(r.at) },
        { key: 'tenantName', label: 'Client', render: (r) => r.tenantName || '—' },
        { key: 'channel', label: 'Channel' },
        { key: 'subject', label: 'Message', render: (r) => <div><div style={{ color: K.text }}>{r.subject || r.kind}</div><div style={{ fontSize: 11.5, color: K.faint, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.status === 'failed' ? r.error : r.preview}</div></div> },
        { key: 'status', label: 'Status', render: (r) => <Pill tone={tone(r.status)}>{r.status}</Pill> },
        { key: 'by', label: 'By' },
      ]} />
    </Section>
  </>);
}

export default function MasterComms() {
  const [tab, setTab] = useState('ann');
  const tabs = [['ann', 'Announcements'], ['direct', 'Message a client'], ['tpl', 'Templates'], ['log', 'Delivery log']];
  const view = { ann: <Announcements />, direct: <Direct />, tpl: <Templates />, log: <DeliveryLog /> }[tab];
  return <Screen icon={MessageSquare} title="Messages" subtitle="Announcements, messages to clients, templates and what was sent" tabs={tabs} tab={tab} onTab={setTab}>{view}</Screen>;
}
