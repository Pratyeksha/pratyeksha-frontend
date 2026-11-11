// Master Admin › Sales: lead assignment, follow-ups, demo scheduler, quotations, lost reasons, duplicates, analytics, targets.
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { TrendingUp, Phone, MessageCircle, CalendarClock, Check, Plus, Search } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, MONO, growthApi, errMsg, inr, fmtDT, fmtD, ago, toLocalInput, waLink, useLoad, useDebounced, Btn, Pill, Tile, Section, Empty, Bar, Field, Modal, ErrorLine, Screen, Table, inputStyle } from './masterKit.jsx';

const TABS = [['assign', 'Assignment'], ['follow', 'Follow-ups'], ['demos', 'Demos'], ['quotes', 'Quotes'], ['lost', 'Lost reasons'], ['dupes', 'Duplicates'], ['analytics', 'Analytics'], ['targets', 'Targets']];
const LOST = ['Price', 'Timing', 'Competitor', 'No response', 'Not a fit', 'Other'];
const post = (path, body, method = 'POST') => growthApi(path, { method, body });

/* Search-as-you-type lead selector (uses the existing CRM list endpoint). */
function LeadPicker({ value, onPick }) {
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [res, setRes] = useState([]);
  useEffect(() => {
    let live = true;
    if (dq.trim().length < 2) { setRes([]); return undefined; }
    axios.get(`${API_BASE_URL}/crm/leads`, { params: { q: dq.trim() } }).then((r) => live && setRes((r.data.leads || []).slice(0, 6))).catch(() => live && setRes([]));
    return () => { live = false; };
  }, [dq]);
  if (value) return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...inputStyle }}><span>{value.businessName} <span style={{ color: K.dim }}>· {value.area || '—'}</span></span><button type="button" onClick={() => onPick(null)} style={{ background: 'none', border: 'none', color: K.gold, cursor: 'pointer', fontSize: 12 }}>change</button></div>;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...inputStyle }}><Search size={13} color={K.dim} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a lead by name or phone" aria-label="Search leads" style={{ background: 'none', border: 'none', outline: 'none', color: K.text, width: '100%', fontSize: 13, fontFamily: 'inherit' }} /></div>
      {res.length > 0 && <div style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, top: '100%', marginTop: 4, background: K.card2, border: `1px solid ${K.borderMid}`, borderRadius: 10, overflow: 'hidden' }}>
        {res.map((l) => <button type="button" key={l._id} onClick={() => { onPick(l); setQ(''); }} className="k-row" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: K.text, padding: '8px 11px', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>{l.businessName} <span style={{ color: K.dim }}>· {l.area || '—'} · {l.status}</span></button>)}
      </div>}
    </div>
  );
}

const LeadLine = ({ l, right }) => (
  <div className="k-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: K.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.businessName}</div>
      <div style={{ fontSize: 11, color: K.dim }}>{[l.area, l.status, l.contactName, l.assignedTo && `👤 ${l.assignedTo}`].filter(Boolean).join(' · ')}</div>
    </div>
    {right}
  </div>
);
const Contact = ({ l }) => (<>
  {l.phone && <a href={`tel:${l.phone}`} aria-label={`Call ${l.businessName}`} style={{ color: K.gold, display: 'inline-flex' }}><Phone size={14} /></a>}
  {waLink(l.phone) && <a href={waLink(l.phone)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${l.businessName}`} style={{ color: K.gold, display: 'inline-flex' }}><MessageCircle size={14} /></a>}
</>);

/* ───── 17 Assignment ───── */
function Assignment() {
  const { data, error, reload } = useLoad(() => growthApi('/sales/assignments').then((r) => r.data));
  const [sel, setSel] = useState([]); const [to, setTo] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState(''); const [view, setView] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const assign = async (names) => { setBusy(true); setErr(''); try { await post('/sales/assign', { leadIds: sel, assignedTo: names }); setSel([]); setTo(''); await reload(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  const saveTeam = async (team) => { try { await post('/settings', { team }, 'PUT'); setNewName(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const person = data.owners.find((o) => o.name === view);
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (<>
    <ErrorLine text={err || error} />
    <Section title="Team" hint="Add the people who work leads, then assign below"
      right={<div style={{ display: 'flex', gap: 6 }}><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add team member" aria-label="Team member name" style={{ ...inputStyle, width: 170 }} /><Btn small kind="primary" disabled={!newName.trim()} onClick={() => saveTeam([...data.team, newName.trim()])}><Plus size={12} /> Add</Btn></div>}>
      {data.owners.length === 0 ? <Empty text="No team members yet. Add one to start assigning leads." /> : (
        <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>
          {data.owners.map((o) => (
            <button key={o.name} type="button" onClick={() => setView(view === o.name ? '' : o.name)} style={{ textAlign: 'left', background: view === o.name ? K.goldFaint : K.card2, border: `1px solid ${view === o.name ? K.gold : K.border}`, borderRadius: 12, padding: 12, cursor: 'pointer', color: K.text, fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: 13.5 }}>{o.name}</b>{o.inTeam && data.team.length > 0 && <span role="button" tabIndex={0} aria-label={`Remove ${o.name}`} onClick={(e) => { e.stopPropagation(); saveTeam(data.team.filter((n) => n !== o.name)); }} style={{ color: K.faint, fontSize: 11 }}>remove</span>}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: K.dim }}><span><b style={{ color: K.gold, fontFamily: MONO }}>{o.open}</b> open</span><span><b style={{ color: K.ok, fontFamily: MONO }}>{o.won}</b> won</span>{o.overdue > 0 && <span style={{ color: K.danger }}><b style={{ fontFamily: MONO }}>{o.overdue}</b> overdue</span>}</div>
              <div style={{ fontSize: 11, color: K.faint, marginTop: 4 }}>Pipeline {inr(o.pipelineValue)}</div>
            </button>))}
        </div>)}
    </Section>
    {person && <Section title={`${person.name}'s open leads`} hint={`${person.open} open`}>
      {person.leads.length === 0 ? <Empty text="No open leads." /> : person.leads.map((l) => <LeadLine key={l._id} l={l} right={<>{l.nextFollowUpAt && <Pill tone={new Date(l.nextFollowUpAt) < new Date() ? 'danger' : 'dim'}>{fmtD(l.nextFollowUpAt)}</Pill>}<Contact l={l} /></>} />)}
    </Section>}
    <Section title={`Unassigned leads (${data.unassignedCount})`} hint="Tick leads, choose a person, assign"
      right={<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Assign to" style={{ ...inputStyle, width: 150 }}><option value="">Assign to…</option>{data.owners.map((o) => <option key={o.name}>{o.name}</option>)}</select>
        <Btn small kind="primary" busy={busy} disabled={!sel.length || !to} onClick={() => assign(to)}>Assign {sel.length || ''}</Btn></div>}>
      {data.unassigned.length === 0 ? <Empty text="Every open lead has an owner." /> : data.unassigned.map((l) => (
        <label key={l._id} style={{ display: 'block', cursor: 'pointer' }}><LeadLine l={l} right={<input type="checkbox" checked={sel.includes(l._id)} onChange={() => toggle(l._id)} aria-label={`Select ${l.businessName}`} style={{ accentColor: K.gold, width: 16, height: 16 }} />} /></label>))}
    </Section>
  </>);
}

/* ───── 18 Follow-ups ───── */
function FollowUps() {
  const { data, error, reload } = useLoad(() => growthApi('/sales/followups').then((r) => r.data));
  const [edit, setEdit] = useState(null); const [when, setWhen] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const open = (l) => { setEdit(l); setWhen(toLocalInput(new Date(Date.now() + 86400000))); setNote(''); setErr(''); };
  const save = async (done) => { try { await post(`/sales/followups/${edit._id}`, { nextFollowUpAt: new Date(when).toISOString(), done, note }); setEdit(null); reload(); } catch (e) { setErr(errMsg(e)); } };
  const block = (title, list, tone) => (
    <Section title={`${title} (${list.length})`} style={tone === 'danger' && list.length ? { borderColor: 'rgba(226,154,88,0.35)' } : undefined}>
      {list.length === 0 ? <Empty text="Nothing here." /> : list.map((l) => <LeadLine key={l._id} l={l} right={<><Pill tone={tone}>{fmtDT(l.nextFollowUpAt)}</Pill><Contact l={l} /><Btn small kind="ghost" onClick={() => open(l)}>Done / reschedule</Btn></>} />)}
    </Section>);
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Tile label="Overdue" value={data.overdue.length} tone={data.overdue.length ? K.danger : K.gold} /><Tile label="Due today" value={data.today.length} /><Tile label="Next 7 days" value={data.upcoming.length} /><Tile label="No date set" value={data.noDate} sub="open leads" tone={K.gold2} />
    </div>
    {block('Overdue', data.overdue, 'danger')}{block('Due today', data.today, 'warn')}{block('Coming up', data.upcoming, 'dim')}
    {edit && <Modal title={`Follow-up — ${edit.businessName}`} onClose={() => setEdit(null)}>
      <ErrorLine text={err} />
      <Field label="Next follow-up"><input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={inputStyle} /></Field>
      <Field label="Note" style={{ marginTop: 10 }}><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was discussed?" maxLength={200} style={inputStyle} /></Field>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}><Btn onClick={() => save(false)}>Just reschedule</Btn><Btn kind="primary" onClick={() => save(true)}><Check size={13} /> Done, set next</Btn></div>
    </Modal>}
  </>);
}

/* ───── 19 Demos ───── */
const STATUS_TONE = { scheduled: 'gold', done: 'ok', 'no-show': 'danger', cancelled: 'dim' };
function Demos() {
  const { data, error, reload } = useLoad(() => growthApi('/sales/demos').then((r) => r.data));
  const reqs = useLoad(() => growthApi('/sales/demo-requests').then((r) => r.data));
  const team = useLoad(() => growthApi('/settings').then((r) => r.data));
  const blank = { lead: null, name: '', phone: '', at: toLocalInput(new Date(Date.now() + 86400000)), owner: '', mode: 'On-site', notes: '' };
  const [form, setForm] = useState(null); const [resch, setResch] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const create = async (force) => {
    try { await post('/sales/demos', { leadId: form.lead?._id, name: form.name, phone: form.phone, at: new Date(form.at).toISOString(), owner: form.owner, mode: form.mode, notes: form.notes, force }); setForm(null); reload(); reqs.reload(); }
    catch (e) { if (e.response?.status === 409 && window.confirm(`${errMsg(e)}. Book anyway?`)) return create(true); setErr(errMsg(e)); }
  };
  const act = async (id, body) => { try { await post(`/sales/demos/${id}`, body, 'PATCH'); reload(); } catch (e) { setErr(errMsg(e)); } };
  const row = (d, main) => (
    <div key={d._id} className="k-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
      <div style={{ width: 118, flexShrink: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: K.gold, fontFamily: MONO }}>{fmtDT(d.at)}</div>{d.rescheduledCount > 0 && <div style={{ fontSize: 10, color: K.faint }}>moved {d.rescheduledCount}×</div>}</div>
      <div style={{ flex: 1, minWidth: 150 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div><div style={{ fontSize: 11, color: K.dim }}>{[d.mode, d.owner && `👤 ${d.owner}`, d.notes].filter(Boolean).join(' · ')}</div></div>
      {main}
    </div>);
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Tile label="Upcoming" value={data.upcoming.length} /><Tile label="Need an outcome" value={data.needsOutcome.length} tone={data.needsOutcome.length ? K.warn : K.gold} /><Tile label="Done (30d)" value={data.stats.done} tone={K.ok} /><Tile label="No-show rate" value={`${data.stats.noShowRate}%`} sub={`${data.stats.noShow} no-shows`} tone={K.gold2} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Btn kind="primary" onClick={() => { setForm(blank); setErr(''); }}><CalendarClock size={14} /> Schedule a demo</Btn></div>
    {data.needsOutcome.length > 0 && <Section title="Did these happen?" hint="Past demos still marked scheduled">{data.needsOutcome.map((d) => row(d, <div style={{ display: 'flex', gap: 6 }}><Btn small kind="primary" onClick={() => act(d._id, { status: 'done' })}>Done</Btn><Btn small kind="danger" onClick={() => act(d._id, { status: 'no-show' })}>No-show</Btn><Btn small onClick={() => setResch({ d, at: toLocalInput(new Date(Date.now() + 86400000)), why: '' })}>Reschedule</Btn></div>))}</Section>}
    <Section title="Upcoming demos" hint="The team is reminded an hour before">
      {data.upcoming.length === 0 ? <Empty text="No demos booked." /> : data.upcoming.map((d) => row(d, <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{d.phone && <a href={waLink(d.phone, `Hi ${d.name}, confirming our Pratyeksha demo on ${fmtDT(d.at)}.`)} target="_blank" rel="noreferrer" aria-label="WhatsApp confirm" style={{ color: K.gold, display: 'inline-flex', alignItems: 'center' }}><MessageCircle size={14} /></a>}<Btn small onClick={() => setResch({ d, at: toLocalInput(d.at), why: '' })}>Reschedule</Btn><Btn small kind="primary" onClick={() => act(d._id, { status: 'done' })}>Done</Btn><Btn small kind="danger" onClick={() => act(d._id, { status: 'no-show' })}>No-show</Btn><Btn small kind="quiet" onClick={() => act(d._id, { status: 'cancelled' })}>Cancel</Btn></div>))}
    </Section>
    {reqs.data?.length > 0 && <Section title="Website demo requests waiting" hint="Book these so none are forgotten">{reqs.data.map((r) => (
      <div key={r._id} className="k-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{r.restaurant}</div><div style={{ fontSize: 11, color: K.dim }}>{r.name} · {r.phone} · {r.city || '—'}</div></div>
        <Btn small onClick={() => { setForm({ ...blank, name: r.restaurant, phone: r.phone }); setErr(''); }}>Schedule</Btn></div>))}</Section>}
    <Section title="Recent outcomes">{data.past.length === 0 ? <Empty text="Nothing yet." /> : data.past.slice(0, 15).map((d) => row(d, <Pill tone={STATUS_TONE[d.status]}>{d.status}</Pill>))}</Section>
    {form && <Modal title="Schedule a demo" onClose={() => setForm(null)}>
      <ErrorLine text={err} />
      <div style={{ display: 'grid', gap: 10 }}>
        <Field label="Lead (optional)"><LeadPicker value={form.lead} onPick={(l) => setForm({ ...form, lead: l, name: l ? l.businessName : form.name, phone: l?.phone || form.phone })} /></Field>
        <Field label="Business name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} maxLength={120} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Date & time"><input type="datetime-local" value={form.at} onChange={(e) => setForm({ ...form, at: e.target.value })} style={inputStyle} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} inputMode="tel" /></Field>
          <Field label="Run by"><select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} style={inputStyle}><option value="">Anyone</option>{(team.data?.team || []).map((n) => <option key={n}>{n}</option>)}</select></Field>
          <Field label="Mode"><select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} style={inputStyle}><option>On-site</option><option>Video call</option><option>Phone</option></select></Field>
        </div>
        <Field label="Notes"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={inputStyle} maxLength={500} /></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn onClick={() => setForm(null)}>Cancel</Btn><Btn kind="primary" disabled={!form.name.trim()} onClick={() => create(false)}>Book demo</Btn></div>
      </div>
    </Modal>}
    {resch && <Modal title={`Reschedule — ${resch.d.name}`} onClose={() => setResch(null)}>
      <Field label="New date & time"><input type="datetime-local" value={resch.at} onChange={(e) => setResch({ ...resch, at: e.target.value })} style={inputStyle} /></Field>
      <Field label="Reason" style={{ marginTop: 10 }}><input value={resch.why} onChange={(e) => setResch({ ...resch, why: e.target.value })} style={inputStyle} maxLength={200} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}><Btn onClick={() => setResch(null)}>Cancel</Btn><Btn kind="primary" onClick={async () => { await act(resch.d._id, { at: new Date(resch.at).toISOString(), why: resch.why }); setResch(null); }}>Save</Btn></div>
    </Modal>}
  </>);
}

/* ───── 20 Quotes ───── */
function Quotes() {
  const { data, error, reload } = useLoad(() => growthApi('/sales/quotes').then((r) => r.data));
  const plans = useLoad(() => growthApi('/plans').then((r) => r.data));
  const [form, setForm] = useState(null); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const openForm = () => { setErr(''); setForm({ lead: null, party: '', plan: '', amount: '', months: 12, discount: 0, validUntil: toLocalInput(new Date(Date.now() + 14 * 86400000)).slice(0, 10), note: '' }); };
  const pickPlan = (id) => { const p = (plans.data?.plans || []).find((x) => x._id === id); setForm((f) => ({ ...f, plan: p ? p.name : '', amount: p ? p.price : f.amount, months: p ? p.months : f.months })); };
  const create = async () => { try { await post('/sales/quotes', { leadId: form.lead?._id, party: form.party, plan: form.plan, amount: Number(form.amount), months: Number(form.months), discount: Number(form.discount) || 0, validUntil: new Date(form.validUntil + 'T23:59:00').toISOString(), note: form.note }); setForm(null); reload(); } catch (e) { setErr(errMsg(e)); } };
  const setStatus = async (q, status) => { try { await post(`/sales/quotes/${q._id}`, { status }, 'PATCH'); reload(); } catch (e) { setErr(errMsg(e)); } };
  const s = data.stats;
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Tile label="Open quotes" value={s.open} sub={inr(s.openValue)} /><Tile label="Accepted" value={s.accepted} sub={inr(s.wonValue)} tone={K.ok} /><Tile label="Rejected" value={s.rejected} tone={K.danger} /><Tile label="Accept rate" value={`${s.acceptRate}%`} tone={K.gold2} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Btn kind="primary" onClick={openForm}><Plus size={14} /> New quotation</Btn></div>
    <Section title="Quotations">
      <Table empty="No quotations yet." rows={data.quotes} cols={[
        { key: 'number', label: 'No.', render: (q) => <span style={{ fontFamily: MONO, color: K.gold }}>{q.number}</span> },
        { key: 'party', label: 'For', render: (q) => <div><div style={{ fontWeight: 600 }}>{q.party}</div><div style={{ fontSize: 11, color: K.dim }}>{q.plan} · {q.months} mo</div></div> },
        { key: 'amount', label: 'Amount', right: true, render: (q) => <span style={{ fontFamily: MONO }}>{inr(q.amount - q.discount)}{q.discount > 0 && <span style={{ display: 'block', fontSize: 10, color: K.faint }}>−{inr(q.discount)}</span>}</span> },
        { key: 'validUntil', label: 'Valid till', render: (q) => <span style={{ color: q.expired ? K.danger : K.mid }}>{fmtD(q.validUntil)}</span> },
        { key: 'status', label: 'Status', render: (q) => <Pill tone={q.expired ? 'danger' : { accepted: 'ok', rejected: 'danger', sent: 'gold', draft: 'dim' }[q.status]}>{q.expired ? 'expired' : q.status}</Pill> },
        { key: 'act', label: '', right: true, render: (q) => (q.status === 'sent' || q.status === 'draft') ? <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}><Btn small kind="primary" onClick={() => setStatus(q, 'accepted')}>Accepted</Btn><Btn small kind="danger" onClick={() => setStatus(q, 'rejected')}>Rejected</Btn></div> : null },
      ]} />
    </Section>
    {form && <Modal title="New quotation" onClose={() => setForm(null)}>
      <ErrorLine text={err} />
      <div style={{ display: 'grid', gap: 10 }}>
        <Field label="Lead"><LeadPicker value={form.lead} onPick={(l) => setForm({ ...form, lead: l, party: l ? l.businessName : form.party })} /></Field>
        {!form.lead && <Field label="Or business name"><input value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} style={inputStyle} /></Field>}
        <Field label="Plan" hint={(plans.data?.plans || []).length ? 'Pick a saved plan to fill price and months' : 'Create plans in Plans & Trials to pick from a list'}>
          <div style={{ display: 'flex', gap: 6 }}>{(plans.data?.plans || []).length > 0 && <select onChange={(e) => pickPlan(e.target.value)} defaultValue="" style={{ ...inputStyle, width: 150 }} aria-label="Saved plan"><option value="">Saved plan…</option>{plans.data.plans.filter((p) => p.active).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>}<input value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} placeholder="Plan name" style={inputStyle} /></div></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Amount ₹"><input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></Field>
          <Field label="Discount ₹"><input type="number" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} style={inputStyle} /></Field>
          <Field label="Months"><input type="number" min="1" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} style={inputStyle} /></Field>
        </div>
        <Field label="Valid until"><input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} style={inputStyle} /></Field>
        <Field label="Note"><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={inputStyle} maxLength={400} /></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Btn onClick={() => setForm(null)}>Cancel</Btn><Btn kind="primary" disabled={!form.plan || form.amount === ''} onClick={create}>Create quote</Btn></div>
      </div>
    </Modal>}
  </>);
}

/* ───── 21 Lost reasons ───── */
function Lost() {
  const { data, error, reload } = useLoad(() => growthApi('/sales/lost').then((r) => r.data));
  const [form, setForm] = useState({ lead: null, category: 'Price', detail: '' }); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const save = async () => { try { await post(`/sales/lost/${form.lead._id}`, { category: form.category, detail: form.detail }); setForm({ lead: null, category: 'Price', detail: '' }); reload(); } catch (e) { setErr(errMsg(e)); } };
  const max = Math.max(1, ...data.summary.map((s) => s.count));
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      <Section title="Why we lose deals" hint={`${data.total} lost leads`}>
        {data.summary.length === 0 ? <Empty text="No lost leads yet." /> : data.summary.map((s) => (
          <div key={s.reason} style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}><span>{s.reason}</span><span style={{ fontFamily: MONO, color: K.gold }}>{s.count} · {s.pct}%</span></div><Bar value={s.count} max={max} /></div>))}
      </Section>
      <Section title="Mark a lead as lost" hint="Pick the lead and the main reason">
        <div style={{ display: 'grid', gap: 10 }}>
          <LeadPicker value={form.lead} onPick={(l) => setForm({ ...form, lead: l })} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{LOST.map((c) => <button key={c} type="button" onClick={() => setForm({ ...form, category: c })} aria-pressed={form.category === c} style={{ padding: '6px 11px', borderRadius: 99, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', background: form.category === c ? K.gold : 'transparent', color: form.category === c ? '#141416' : K.mid, border: `1px solid ${form.category === c ? K.gold : K.borderMid}`, fontWeight: 600 }}>{c}</button>)}</div>
          <input value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Detail (optional) e.g. wanted ₹6k/yr" maxLength={200} style={inputStyle} />
          <Btn kind="primary" disabled={!form.lead} onClick={save}>Mark lost</Btn>
        </div>
      </Section>
    </div>
    <Section title="Lost leads"><Table empty="Nothing lost yet." rows={data.leads.slice(0, 100)} cols={[
      { key: 'businessName', label: 'Lead', render: (l) => <div><b>{l.businessName}</b><div style={{ fontSize: 11, color: K.dim }}>{l.area || '—'}{l.source ? ` · ${l.source}` : ''}</div></div> },
      { key: 'category', label: 'Reason', render: (l) => <Pill tone="bronze">{l.category}</Pill> },
      { key: 'lostReason', label: 'Detail', render: (l) => <span style={{ color: K.mid }}>{l.lostReason || '—'}</span> },
      { key: 'updatedAt', label: 'When', render: (l) => ago(l.updatedAt) },
    ]} /></Section>
  </>);
}

/* ───── 22 Duplicates ───── */
function Dupes() {
  const [q, setQ] = useState({ name: '', phone: '' }); const [res, setRes] = useState(null); const [scan, setScan] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const check = async () => { setBusy(true); setErr(''); try { setRes((await growthApi('/sales/duplicates/check', { params: q })).data); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  const runScan = async () => { setBusy(true); setErr(''); try { setScan((await growthApi('/sales/duplicates/scan')).data); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<>
    <ErrorLine text={err} />
    <Section title="Check before adding" hint="Matches phone numbers (any format) and restaurant names across leads, clients and website demo requests">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={q.name} onChange={(e) => setQ({ ...q, name: e.target.value })} placeholder="Restaurant name" aria-label="Restaurant name" style={{ ...inputStyle, flex: '1 1 200px', width: 'auto' }} />
        <input value={q.phone} onChange={(e) => setQ({ ...q, phone: e.target.value })} placeholder="Phone" inputMode="tel" aria-label="Phone" style={{ ...inputStyle, flex: '1 1 150px', width: 'auto' }} />
        <Btn kind="primary" busy={busy} disabled={!q.name.trim() && !q.phone.trim()} onClick={check}>Check</Btn>
      </div>
      {res && (res.duplicate ? <div style={{ marginTop: 12 }}><Pill tone="warn">Already exists</Pill>{res.matches.map((m) => <div key={m.type + m.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12.5 }}><b>{m.label}</b> <Pill tone="dim">{m.type}</Pill><div style={{ fontSize: 11, color: K.dim }}>{m.reason} · {m.detail}</div></div>)}</div> : <div style={{ marginTop: 12, fontSize: 12.5, color: K.ok }}>No match found. Safe to add.</div>)}
    </Section>
    <Section title="Scan existing leads" hint="Finds leads sharing a phone number or name" right={<Btn kind="ghost" busy={busy} onClick={runScan}>Scan now</Btn>}>
      {!scan ? <Empty text="Run a scan to look for duplicates." /> : scan.groups.length === 0 ? <Empty text={`No duplicates in ${scan.scanned} leads.`} /> : scan.groups.map((g, i) => (
        <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><Pill tone="warn">{g.reason}</Pill>{g.leads.map((l) => <div key={l._id} style={{ fontSize: 12.5, marginTop: 6 }}>{l.businessName} <span style={{ color: K.dim }}>· {l.phone || '—'} · {l.area || '—'} · {l.status}</span></div>)}</div>))}
    </Section>
    <div style={{ fontSize: 11.5, color: K.faint }}>Tip: the same check also runs inside the Lead CRM add-lead form.</div>
  </>);
}

/* ───── 23 + 24 Analytics ───── */
function Analytics() {
  const { data, error } = useLoad(() => growthApi('/sales/analytics').then((r) => r.data));
  const trials = useLoad(() => growthApi('/trials').then((r) => r.data));
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const t = data.totals, ts = trials.data?.stats;
  const maxF = Math.max(1, ...data.funnel.map((f) => f.count));
  const rows = (list) => list.slice(0, 12).map((s) => (
    <div key={s.name} style={{ marginBottom: 11 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{s.name}</span><span style={{ fontFamily: MONO, color: K.gold, whiteSpace: 'nowrap' }}>{s.leads} leads · {s.won} won · {s.rate}%</span></div><Bar value={s.won} max={Math.max(1, s.leads)} /></div>));
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Tile label="Leads" value={t.leads} /><Tile label="Won" value={t.won} tone={K.ok} /><Tile label="Conversion" value={`${t.conversion}%`} /><Tile label="Avg days to win" value={t.avgDaysToWin ?? '—'} tone={K.gold2} />
      <Tile label="Demo → client" value={`${data.demoToClient.rate}%`} sub={`${data.demoToClient.converted} of ${data.demoToClient.demosDone} demos`} />
      <Tile label="Trial → paid" value={ts ? `${ts.rate}%` : '—'} sub={ts ? `${ts.converted} of ${ts.total} trials` : ''} />
    </div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      <Section title="Funnel">{data.funnel.map((f) => <div key={f.status} style={{ marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}><span>{f.status}</span><span style={{ fontFamily: MONO, color: K.gold }}>{f.count}</span></div><Bar value={f.count} max={maxF} color={f.status === 'Lost' ? K.danger : K.gold} /></div>)}</Section>
      <Section title="By lead source" hint="Which channels actually convert">{data.bySource.length ? rows(data.bySource) : <Empty text="No data yet." />}</Section>
      <Section title="By area" hint="Leads, won and conversion per area">{data.byArea.length ? rows(data.byArea) : <Empty text="No data yet." />}</Section>
      <Section title="Trial to paid" hint="Trials that became paying clients">
        {ts ? (<div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
          {[['Running', ts.active], ['In grace period', ts.grace], ['Converted to paid', ts.converted], ['Expired without paying', ts.expired]].map(([l, v]) => <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: K.mid }}>{l}</span><b style={{ fontFamily: MONO, color: K.gold }}>{v}</b></div>)}
          <div style={{ fontSize: 11, color: K.faint, marginTop: 4 }}>Of trials that finished, {ts.decidedRate}% paid. Start trials in Plans & Trials.</div></div>) : <Empty text="No trials recorded yet." />}
      </Section>
    </div>
    <Section title="Leads vs wins by month"><div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 130 }}>
      {data.monthly.map((m) => { const mx = Math.max(1, ...data.monthly.map((x) => x.leads)); return (<div key={m.month} style={{ flex: 1, textAlign: 'center', minWidth: 0 }}><div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 100, justifyContent: 'center' }}><div title={`${m.leads} leads`} style={{ width: '38%', height: `${(m.leads / mx) * 100}%`, background: K.gold, borderRadius: '4px 4px 0 0', minHeight: 2 }} /><div title={`${m.won} won`} style={{ width: '38%', height: `${(m.won / mx) * 100}%`, background: K.gold2, borderRadius: '4px 4px 0 0', minHeight: 2 }} /></div><div style={{ fontSize: 10, color: K.faint, marginTop: 6 }}>{m.month.slice(5)}</div></div>); })}
    </div><div style={{ fontSize: 11, color: K.dim, marginTop: 8 }}><span style={{ color: K.gold }}>■</span> leads &nbsp; <span style={{ color: K.gold2 }}>■</span> won</div></Section>
  </>);
}

/* ───── 25 Targets ───── */
function Targets() {
  const { data, error, reload } = useLoad(() => growthApi('/sales/targets').then((r) => r.data));
  const [f, setF] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { if (data && !f) setF({ newClients: data.target.newClients, revenue: data.target.revenue }); }, [data, f]);
  if (!data || !f) return <ErrorLine text={error} />;
  const save = async () => { try { await post('/sales/targets', { month: data.month, newClients: Number(f.newClients) || 0, revenue: Number(f.revenue) || 0 }, 'PUT'); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const meter = (label, actual, target, pct, money) => (
    <Section title={label}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 30, fontWeight: 700, fontFamily: MONO, color: K.gold }}>{money ? inr(actual) : actual}</span><span style={{ color: K.dim, fontSize: 13 }}>of {target > 0 ? (money ? inr(target) : target) : 'no target set'}</span></div>
      <div style={{ margin: '12px 0 6px' }}><Bar value={actual} max={target} height={9} color={pct >= 100 ? K.ok : K.gold} /></div>
      <div style={{ fontSize: 11.5, color: K.dim }}>{pct == null ? 'Set a target below.' : `${pct}% of target · ${data.elapsedPct}% of the month gone`}{pct != null && pct < data.elapsedPct - 15 && <span style={{ color: K.warn }}> · behind pace</span>}</div>
    </Section>);
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      {meter(`New clients — ${data.month}`, data.actual.newClients, data.target.newClients, data.progress.clients, false)}
      {meter(`Revenue collected — ${data.month}`, data.actual.revenue, data.target.revenue, data.progress.revenue, true)}
    </div>
    <Section title="Set this month's targets" hint="New clients are counted from tenant creation date; revenue from recorded subscription payments">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="New clients" style={{ width: 140 }}><input type="number" min="0" value={f.newClients} onChange={(e) => setF({ ...f, newClients: e.target.value })} style={inputStyle} /></Field>
        <Field label="Revenue ₹" style={{ width: 180 }}><input type="number" min="0" value={f.revenue} onChange={(e) => setF({ ...f, revenue: e.target.value })} style={inputStyle} /></Field>
        <Btn kind="primary" onClick={save}>Save targets</Btn>
      </div>
    </Section>
    <Section title="Last 6 months"><Table rows={data.history.map((h) => ({ ...h, id: h.month }))} cols={[
      { key: 'month', label: 'Month' },
      { key: 'clients', label: 'New clients', right: true, render: (h) => <span style={{ fontFamily: MONO }}>{h.newClients} / {h.targetClients || '—'}</span> },
      { key: 'rev', label: 'Revenue', right: true, render: (h) => <span style={{ fontFamily: MONO }}>{inr(h.revenue)} / {h.targetRevenue ? inr(h.targetRevenue) : '—'}</span> },
      { key: 'hit', label: '', right: true, render: (h) => (h.targetClients || h.targetRevenue) ? <Pill tone={(!h.targetClients || h.newClients >= h.targetClients) && (!h.targetRevenue || h.revenue >= h.targetRevenue) ? 'ok' : 'dim'}>{(!h.targetClients || h.newClients >= h.targetClients) && (!h.targetRevenue || h.revenue >= h.targetRevenue) ? 'hit' : 'missed'}</Pill> : null },
    ]} /></Section>
  </>);
}

export default function MasterSales() {
  const [tab, setTab] = useState('assign');
  const view = useMemo(() => ({ assign: <Assignment />, follow: <FollowUps />, demos: <Demos />, quotes: <Quotes />, lost: <Lost />, dupes: <Dupes />, analytics: <Analytics />, targets: <Targets /> }[tab]), [tab]);
  return <Screen icon={TrendingUp} title="Sales" subtitle="Assignments, follow-ups, demos, quotes and targets" tabs={TABS} tab={tab} onTab={setTab}>{view}</Screen>;
}
