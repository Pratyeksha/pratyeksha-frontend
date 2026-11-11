// Master Admin › Support: tickets with SLA timers and escalation (54, 56), communication history (55),
// training tracker (57) and canned replies (58). Uses ONLY the Master Admin theme.
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { LifeBuoy } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, MONO, errMsg, fmtD, fmtDT, useLoad, Btn, Pill, Tile, Section, Empty, Field, Modal, ErrorLine, Screen, Table, inputStyle } from './masterKit.jsx';

const api = (path, opts = {}) => axios({ url: `${API_BASE_URL}/admin/master/ops${path}`, method: opts.method || 'GET', data: opts.body, params: opts.params });
const TABS = [['tickets', 'Tickets'], ['history', 'Communication history'], ['training', 'Training'], ['canned', 'Canned replies']];
const slaTone = { breached: 'warn', 'at-risk': 'gold', ok: 'dim', responded: 'dim', done: 'dim' };
const slaText = (s) => (s.state === 'breached' ? `Late by ${Math.abs(s.hoursLeft)}h` : s.state === 'at-risk' ? `${s.hoursLeft}h left` : s.state === 'ok' ? `${s.hoursLeft}h left` : s.state === 'responded' ? 'Replied' : 'Closed');
const CATS = [['billing', 'Billing'], ['bug', 'Something is broken'], ['howto', 'How do I…'], ['feature', 'Feature request'], ['other', 'Other']];

/* ───── tickets ───── */
function Tickets() {
  const [status, setStatus] = useState('active');
  const list = useLoad(() => api('/tickets', { params: { status } }).then((r) => r.data), [status]);
  const tenants = useLoad(() => axios.get(`${API_BASE_URL}/admin/master/control/tenants`).then((r) => r.data));
  const [open, setOpen] = useState(null); const [form, setForm] = useState(null); const [err, setErr] = useState('');
  if (!list.data) return list.error ? <ErrorLine text={list.error} /> : <Empty text="Loading…" />;
  const sm = list.data.summary;
  const create = async () => { try { await api('/tickets', { method: 'POST', body: form }); setForm(null); setErr(''); list.reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
      <Tile label="Open tickets" value={sm.open} /><Tile label="Past deadline" value={sm.breached} tone={sm.breached ? 'warn' : undefined} /><Tile label="Close to deadline" value={sm.atRisk} /><Tile label="Avg first reply" value={sm.avgFirstResponseHours == null ? '—' : `${sm.avgFirstResponseHours}h`} />
    </div>
    <Section title="Support tickets" hint="A ticket not answered in time is marked late and escalated automatically. Owners can raise tickets from their app."
      right={<div style={{ display: 'flex', gap: 8 }}><select aria-label="Ticket filter" value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: 130 }}><option value="active">Open</option><option value="resolved">Resolved</option><option value="closed">Closed</option><option value="all">All</option></select><Btn kind="primary" small onClick={() => { setErr(''); setForm({ tenantId: '', subject: '', category: 'other', priority: 'normal', text: '' }); }}>New ticket</Btn></div>}>
      <ErrorLine text={err} />
      <Table empty="No tickets here." rows={list.data.rows.map((t) => ({ ...t, id: t._id }))} cols={[
        { key: 'n', label: 'Ticket', render: (t) => <div><div style={{ fontFamily: MONO, fontSize: 11.5, color: K.gold }}>{t.number}</div><div style={{ fontWeight: 600 }}>{t.subject}</div><div style={{ fontSize: 11, color: K.faint }}>{t.tenantName || 'No client'} · {fmtDT(t.createdAt)}</div></div> },
        { key: 'p', label: 'Priority', render: (t) => <Pill tone={t.priority === 'urgent' || t.priority === 'high' ? 'gold' : 'dim'}>{t.priority}</Pill> },
        { key: 's', label: 'Status', render: (t) => <div><Pill tone={t.status === 'open' ? 'warn' : 'dim'}>{t.status}</Pill>{t.escalatedAt && ['open', 'pending'].includes(t.status) && <div style={{ fontSize: 10.5, color: K.warn, marginTop: 3 }}>Escalated</div>}</div> },
        { key: 'sla', label: 'Reply deadline', render: (t) => <Pill tone={slaTone[t.sla.state]}>{slaText(t.sla)}</Pill> },
        { key: 'a', right: true, render: (t) => <Btn small onClick={() => setOpen(t._id)}>Open</Btn> }]} />
    </Section>
    {form && <Modal title="New ticket" onClose={() => setForm(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="Client"><select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} style={inputStyle}><option value="">Not linked to a client</option>{(tenants.data?.tenants || []).map((t) => <option key={t.tenantId} value={t.tenantId}>{t.name}</option>)}</select></Field>
      <Field label="Subject"><input value={form.subject} maxLength={140} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={inputStyle} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Type"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></Field></div>
      <Field label="What did the client say?"><textarea rows={4} value={form.text} maxLength={2000} onChange={(e) => setForm({ ...form, text: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setForm(null)}>Cancel</Btn><Btn kind="primary" onClick={create}>Create</Btn></div></div></Modal>}
    {open && <TicketView id={open} onClose={() => { setOpen(null); list.reload(); }} />}
  </>);
}

function TicketView({ id, onClose }) {
  const { data, error, reload } = useLoad(() => api(`/tickets/${id}`).then((r) => r.data));
  const canned = useLoad(() => api('/canned').then((r) => r.data));
  const [text, setText] = useState(''); const [note, setNote] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const act = async (fn) => { setBusy(true); try { await fn(); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (
    <Modal title={data ? `${data.number} · ${data.subject}` : 'Ticket'} onClose={onClose} width={660}>
      <ErrorLine text={err || error} />
      {!data ? <Empty text="Loading…" /> : (<div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Pill tone="dim">{data.tenantName || 'No client'}</Pill><Pill tone={slaTone[data.sla.state]}>{slaText({ ...data.sla, hoursLeft: Math.round(((new Date(data.sla.due) - Date.now()) / 3600000) * 10) / 10 })}</Pill>
          <select aria-label="Status" value={data.status} onChange={(e) => act(() => api(`/tickets/${id}`, { method: 'PUT', body: { status: e.target.value } }))} style={{ ...inputStyle, width: 120 }}><option value="open">Open</option><option value="pending">Waiting on client</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
          <select aria-label="Priority" value={data.priority} onChange={(e) => act(() => api(`/tickets/${id}`, { method: 'PUT', body: { priority: e.target.value } }))} style={{ ...inputStyle, width: 110 }}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
        </div>
        <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {(data.messages || []).length === 0 && <Empty text="No messages yet." />}
          {(data.messages || []).map((m, i) => <div key={i} style={{ padding: '9px 12px', borderRadius: 10, background: m.from === 'client' ? K.card2 : m.from === 'note' ? K.goldFaint : 'transparent', border: `1px solid ${m.from === 'note' ? K.goldLine : K.border}` }}>
            <div style={{ fontSize: 10.5, color: K.faint, marginBottom: 3 }}>{m.from === 'client' ? 'Client' : m.from === 'note' ? 'Private note' : 'Reply'} · {m.by} · {fmtDT(m.at)}</div><div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{m.text}</div></div>)}
        </div>
        <Field label={note ? 'Private note (client never sees it)' : 'Reply'}>
          <textarea rows={3} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select aria-label="Insert canned reply" value="" onChange={(e) => { const c = (canned.data || []).find((x) => x._id === e.target.value); if (c) setText((t) => (t ? t + '\n' : '') + c.body); }} style={{ ...inputStyle, width: 190 }}><option value="">Insert canned reply…</option>{(canned.data || []).map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}</select>
          <label style={{ fontSize: 12.5, color: K.mid, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={note} onChange={(e) => setNote(e.target.checked)} />Private note</label>
          <span style={{ flex: 1 }} /><Btn kind="primary" busy={busy} onClick={() => act(async () => { await api(`/tickets/${id}/reply`, { method: 'POST', body: { text, note } }); setText(''); })}>{note ? 'Save note' : 'Send reply'}</Btn>
        </div>
        <div style={{ fontSize: 11, color: K.faint }}>A reply is saved here and shown to the owner in their app ticket list. Send it on WhatsApp or email yourself if you need it sooner.</div>
      </div>)}
    </Modal>);
}

/* ───── 55 history ───── */
function History() {
  const t = useLoad(() => axios.get(`${API_BASE_URL}/admin/master/control/tenants`).then((r) => r.data));
  const [pick, setPick] = useState('');
  const h = useLoad(() => (pick ? api(`/history/${pick}`).then((r) => r.data) : Promise.resolve(null)), [pick]);
  const KIND = { ticket: 'Ticket', reply: 'Reply', 'client-message': 'Client', notice: 'Notice', note: 'Note', whatsapp: 'WhatsApp', email: 'Email', sms: 'SMS' };
  return (<>
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 640 }}>Everything we have said to a client and everything they have said to us — tickets, notices, sent messages and your notes — newest first.</div>
    <Section title="Client"><select aria-label="Client" value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...inputStyle, maxWidth: 320 }}><option value="">Choose a client…</option>{(t.data?.tenants || []).map((x) => <option key={x.tenantId} value={x.tenantId}>{x.name}</option>)}</select></Section>
    {pick && <Section title="Timeline"><ErrorLine text={h.error} />
      {!h.data ? <Empty text="Loading…" /> : h.data.length === 0 ? <Empty text="No communication recorded yet." /> : <div style={{ display: 'grid', gap: 8 }}>
        {h.data.map((e, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 10, padding: '8px 0', borderBottom: `1px solid ${K.border}` }}>
          <div><Pill tone={e.kind === 'client-message' ? 'gold' : 'dim'}>{KIND[e.kind] || e.kind}</Pill><div style={{ fontSize: 10.5, color: K.faint, marginTop: 4 }}>{fmtDT(e.at)}</div></div>
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>{e.detail && <div style={{ fontSize: 12.5, color: K.mid, whiteSpace: 'pre-wrap' }}>{e.detail}</div>}<div style={{ fontSize: 10.5, color: K.faint }}>{e.by}</div></div></div>)}</div>}
    </Section>}
  </>);
}

/* ───── 57 training ───── */
function Training() {
  const { data, error, reload } = useLoad(() => api('/training').then((r) => r.data));
  const sla = useLoad(() => api('/sla').then((r) => r.data));
  const [err, setErr] = useState(''); const [edit, setEdit] = useState(null); const [q, setQ] = useState(''); const [ov, setOv] = useState({});
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const toggle = async (row, c) => {
    const k = `${row.tenantId}|${c.topic}`; const want = !(k in ov ? ov[k] : c.done); setOv((o) => ({ ...o, [k]: want })); // tick instantly, confirm with the server
    try { await api(`/training/${row.tenantId}`, { method: 'PUT', body: { topic: c.topic, done: want } }); setErr(''); await reload(); setOv((o) => { const n = { ...o }; delete n[k]; return n; }); }
    catch (e) { setErr(errMsg(e)); setOv((o) => { const n = { ...o }; delete n[k]; return n; }); }
  };
  const saveSla = async () => { try { await api('/sla', { method: 'PUT', body: { sla: edit.sla, topics: edit.topics.split(',').map((x) => x.trim()).filter(Boolean) } }); setEdit(null); setErr(''); reload(); sla.reload(); } catch (e) { setErr(errMsg(e)); } };
  const rows = data.rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  return (<>
    <ErrorLine text={err} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><Tile label="Fully trained" value={`${data.fullyTrained} / ${data.rows.length}`} /><Tile label="Topics" value={data.topics.length} /></div>
    <Section title="Training checklist" hint="Tick a topic once you have taught it to the client’s team. Least-trained clients come first."
      right={<div style={{ display: 'flex', gap: 8 }}><input aria-label="Search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, width: 140 }} /><Btn small kind="quiet" onClick={() => setEdit({ topics: data.topics.join(', '), sla: { ...(sla.data?.sla || { urgent: 4, high: 8, normal: 24, low: 72 }) } })}>Topics & reply times</Btn></div>}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead><tr><th style={{ textAlign: 'left', padding: '6px 8px', color: K.faint, fontSize: 11 }}>CLIENT</th>{data.topics.map((t) => <th key={t} style={{ padding: '6px 8px', color: K.faint, fontSize: 10.5, fontWeight: 600 }}>{t}</th>)}<th style={{ padding: '6px 8px', color: K.faint, fontSize: 11 }}>DONE</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.tenantId} style={{ borderTop: `1px solid ${K.border}` }}>
            <td style={{ padding: '8px', fontWeight: 600 }}>{r.name}</td>
            {r.cells.map((c) => <td key={c.topic} style={{ textAlign: 'center', padding: 8 }}><input type="checkbox" aria-label={`${r.name}: ${c.topic}`} title={c.done ? `${fmtD(c.at)} by ${c.by}` : ''} checked={`${r.tenantId}|${c.topic}` in ov ? ov[`${r.tenantId}|${c.topic}`] : c.done} onChange={() => toggle(r, c)} /></td>)}
            <td style={{ textAlign: 'center', fontFamily: MONO, color: r.doneCount === data.topics.length ? K.gold : K.mid }}>{r.cells.filter((c) => (`${r.tenantId}|${c.topic}` in ov ? ov[`${r.tenantId}|${c.topic}`] : c.done)).length}/{data.topics.length}</td></tr>)}
            {rows.length === 0 && <tr><td colSpan={data.topics.length + 2}><Empty text="No clients." /></td></tr>}</tbody>
        </table></div>
    </Section>
    {edit && <Modal title="Topics & reply deadlines" onClose={() => setEdit(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="Training topics" hint="Separate with commas"><textarea rows={3} value={edit.topics} onChange={(e) => setEdit({ ...edit, topics: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <div style={{ fontSize: 12, color: K.mid }}>Hours allowed for the first reply to a ticket:</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>{['urgent', 'high', 'normal', 'low'].map((k) => <Field key={k} label={k}><input type="number" min="1" max="720" value={edit.sla[k]} onChange={(e) => setEdit({ ...edit, sla: { ...edit.sla, [k]: e.target.value } })} style={inputStyle} /></Field>)}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setEdit(null)}>Cancel</Btn><Btn kind="primary" onClick={saveSla}>Save</Btn></div></div></Modal>}
  </>);
}

/* ───── 58 canned replies ───── */
function Canned() {
  const { data, error, reload } = useLoad(() => api('/canned').then((r) => r.data));
  const [f, setF] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const save = async () => { try { if (f._id) await api(`/canned/${f._id}`, { method: 'PUT', body: f }); else await api('/canned', { method: 'POST', body: f }); setF(null); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const del = async (c) => { if (!window.confirm(`Delete “${c.title}”?`)) return; try { await api(`/canned/${c._id}`, { method: 'DELETE' }); reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <ErrorLine text={err || error} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><div style={{ fontSize: 11.5, color: K.faint }}>Ready-made answers for the questions you get again and again. Insert one from any ticket reply.</div><Btn kind="primary" onClick={() => { setErr(''); setF({ title: '', body: '', category: 'general' }); }}>New reply</Btn></div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
      {data.length === 0 && <Section><Empty text="No canned replies yet." /></Section>}
      {data.map((c) => <Section key={c._id}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div style={{ fontWeight: 700 }}>{c.title}</div><Pill tone="dim">{c.category}</Pill></div>
        <div style={{ fontSize: 12.5, color: K.mid, margin: '8px 0', whiteSpace: 'pre-wrap' }}>{c.body}</div>
        <div style={{ display: 'flex', gap: 6 }}><Btn small onClick={() => { setErr(''); setF({ ...c }); }}>Edit</Btn><Btn small kind="danger" onClick={() => del(c)}>Delete</Btn></div></Section>)}
    </div>
    {f && <Modal title={f._id ? 'Edit reply' : 'New canned reply'} onClose={() => setF(null)}><ErrorLine text={err} /><div style={{ display: 'grid', gap: 10 }}>
      <Field label="Title"><input value={f.title} maxLength={80} onChange={(e) => setF({ ...f, title: e.target.value })} style={inputStyle} /></Field>
      <Field label="Group"><input value={f.category} maxLength={30} onChange={(e) => setF({ ...f, category: e.target.value })} style={inputStyle} /></Field>
      <Field label="Reply"><textarea rows={5} value={f.body} maxLength={1500} onChange={(e) => setF({ ...f, body: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn kind="quiet" onClick={() => setF(null)}>Cancel</Btn><Btn kind="primary" onClick={save}>Save</Btn></div></div></Modal>}
  </>);
}

export default function MasterSupport() {
  const [tab, setTab] = useState('tickets');
  const view = { tickets: <Tickets />, history: <History />, training: <Training />, canned: <Canned /> }[tab];
  return <Screen icon={LifeBuoy} title="Support" subtitle="Tickets, reply deadlines, communication history, training and canned replies" tabs={TABS} tab={tab} onTab={setTab}>{view}</Screen>;
}
