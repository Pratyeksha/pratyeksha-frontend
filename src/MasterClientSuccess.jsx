// Master Admin › Client Success: health, renewals, churn risk, upsell, onboarding, satisfaction, feature requests, monthly reports,
// plus a per-client drawer (timeline, contacts & language, tags & notes, monthly report).
import React, { useEffect, useMemo, useState } from 'react';
import { HeartPulse, Phone, MessageCircle, Plus, Trash2, Check, Copy, Mail, Search } from 'lucide-react';
import { K, MONO, growthApi, errMsg, inr, fmtDT, fmtD, ago, waLink, useLoad, useDebounced, Btn, Pill, Tile, Section, Empty, Bar, Field, Modal, ErrorLine, Screen, Table, inputStyle } from './masterKit.jsx';

const TABS = [['health', 'Health'], ['renewals', 'Renewals'], ['churn', 'Churn risk'], ['upsell', 'Upsell'], ['onboarding', 'Onboarding'], ['nps', 'Satisfaction'], ['features', 'Requests'], ['reports', 'Monthly reports']];
const HEALTH_TONE = { Thriving: 'ok', Steady: 'gold', 'At risk': 'warn', Dormant: 'danger' };
const send = (path, body, method = 'POST') => growthApi(path, { method, body });
const RENEWAL = [['not-contacted', 'Not contacted'], ['contacted', 'Contacted'], ['promised', 'Promised'], ['paid', 'Paid'], ['lost', 'Lost']];
const PRESET_TAGS = ['VIP', 'Payment slow', 'Needs training', 'At risk', 'Referral'];

/* ───── client drawer: 31 timeline, 34 contacts, 36 tags/notes, 35 report ───── */
function ClientDrawer({ tenantId, onClose, onChanged }) {
  const prof = useLoad(() => growthApi(`/clients/${tenantId}/profile`).then((r) => r.data), [tenantId]);
  const tl = useLoad(() => growthApi(`/clients/${tenantId}/timeline`).then((r) => r.data), [tenantId]);
  const [tab, setTab] = useState('timeline'); const [err, setErr] = useState('');
  const [note, setNote] = useState({ kind: 'note', text: '' });
  const [meta, setMeta] = useState(null); const [saved, setSaved] = useState(false);
  useEffect(() => { if (prof.data && !meta) setMeta(prof.data.meta); }, [prof.data, meta]);
  const c = prof.data?.client;
  const addNote = async () => { try { await send(`/clients/${tenantId}/timeline`, note); setNote({ ...note, text: '' }); tl.reload(); } catch (e) { setErr(errMsg(e)); } };
  const delNote = async (id) => { try { await send(`/clients/timeline/${id}`, undefined, 'DELETE'); tl.reload(); } catch (e) { setErr(errMsg(e)); } };
  const saveMeta = async () => {
    try { await send(`/clients/${tenantId}/meta`, { tags: meta.tags, notes: meta.notes, language: meta.language, contacts: meta.contacts }, 'PUT'); setErr(''); setSaved(true); setTimeout(() => setSaved(false), 1800); onChanged?.(); }
    catch (e) { setErr(errMsg(e)); }
  };
  const toggleTag = (t) => setMeta((m) => ({ ...m, tags: m.tags.some((x) => x.toLowerCase() === t.toLowerCase()) ? m.tags.filter((x) => x.toLowerCase() !== t.toLowerCase()) : [...m.tags, t] }));
  const [newTag, setNewTag] = useState('');
  return (
    <Modal title={c ? c.name : 'Client'} onClose={onClose} width={640}>
      <ErrorLine text={err || prof.error} />
      {c && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <Pill tone={HEALTH_TONE[c.health]}>{c.health} · {c.score}</Pill>
        <Pill tone="dim">{c.area || c.city || '—'}</Pill>
        <Pill tone={c.daysLeft !== null && c.daysLeft <= 30 ? 'warn' : 'dim'}>{c.planExpiry ? (c.daysLeft > 0 ? `${c.daysLeft}d left` : 'expired') : 'no expiry'}</Pill>
        <span style={{ fontSize: 11.5, color: K.dim }}>{c.orders30d} orders (30d) · last order {ago(c.lastOrderAt)} · last login {ago(c.lastLoginAt)}</span>
      </div>}
      <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${K.border}`, marginBottom: 12 }}>
        {[['timeline', 'Timeline'], ['contacts', 'Contacts'], ['tags', 'Tags & notes'], ['report', 'Monthly report']].map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === id ? K.gold : 'transparent'}`, color: tab === id ? K.gold : K.dim, padding: '8px 11px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>)}
      </div>
      {tab === 'timeline' && (<>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <select value={note.kind} onChange={(e) => setNote({ ...note, kind: e.target.value })} aria-label="Entry type" style={{ ...inputStyle, width: 110 }}>{['note', 'call', 'meeting', 'issue', 'other'].map((k) => <option key={k}>{k}</option>)}</select>
          <input value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && note.text.trim() && addNote()} placeholder="Log a call, note or issue…" maxLength={500} aria-label="Timeline entry" style={{ ...inputStyle, flex: '1 1 200px', width: 'auto' }} />
          <Btn kind="primary" disabled={!note.text.trim()} onClick={addNote}><Plus size={13} /> Add</Btn>
        </div>
        {!tl.data ? <Empty text={tl.loading ? 'Loading…' : 'Could not load'} /> : tl.data.events.map((e, i) => (
          <div key={e.id || i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: { payment: K.ok, issue: K.danger, plan: K.gold2, call: K.gold }[e.kind] || K.faint, marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, color: K.text, wordBreak: 'break-word' }}>{e.text}</div><div style={{ fontSize: 10.5, color: K.faint, marginTop: 2 }}>{fmtDT(e.at)} · {e.kind}{e.actor ? ` · ${e.actor}` : ''}</div></div>
            {e.manual && <button type="button" aria-label="Delete entry" onClick={() => delNote(e.id)} style={{ background: 'none', border: 'none', color: K.faint, cursor: 'pointer' }}><Trash2 size={13} /></button>}
          </div>))}
      </>)}
      {tab === 'contacts' && meta && (<div style={{ display: 'grid', gap: 10 }}>
        {meta.contacts.map((ct, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr auto', gap: 6 }}>
            <select value={ct.role} onChange={(e) => setMeta({ ...meta, contacts: meta.contacts.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })} aria-label="Role" style={inputStyle}>{['Owner', 'Manager', 'Accountant', 'Other'].map((r) => <option key={r}>{r}</option>)}</select>
            <input value={ct.name || ''} placeholder="Name" aria-label="Name" onChange={(e) => setMeta({ ...meta, contacts: meta.contacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} style={inputStyle} />
            <input value={ct.phone || ''} placeholder="10-digit phone" inputMode="tel" aria-label="Phone" onChange={(e) => setMeta({ ...meta, contacts: meta.contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)) })} style={inputStyle} />
            <button type="button" aria-label="Remove contact" onClick={() => setMeta({ ...meta, contacts: meta.contacts.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', color: K.faint, cursor: 'pointer' }}><Trash2 size={14} /></button>
          </div>))}
        {meta.contacts.length < 8 && <Btn small onClick={() => setMeta({ ...meta, contacts: [...meta.contacts, { role: meta.contacts.length ? 'Manager' : 'Owner', name: '', phone: '' }] })}><Plus size={12} /> Add contact</Btn>}
        <Field label="Preferred language for messages & reports"><div style={{ display: 'flex', gap: 6 }}>{[['en', 'English'], ['mr', 'मराठी (Marathi)']].map(([v, l]) => <button key={v} type="button" aria-pressed={meta.language === v} onClick={() => setMeta({ ...meta, language: v })} style={{ padding: '7px 14px', borderRadius: 99, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', background: meta.language === v ? K.gold : 'transparent', color: meta.language === v ? '#141416' : K.mid, border: `1px solid ${meta.language === v ? K.gold : K.borderMid}` }}>{l}</button>)}</div></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>{saved && <span style={{ color: K.ok, fontSize: 12 }}><Check size={12} /> Saved</span>}<Btn kind="primary" onClick={saveMeta}>Save contacts</Btn></div>
      </div>)}
      {tab === 'tags' && meta && (<div style={{ display: 'grid', gap: 12 }}>
        <Field label="Tags"><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[...new Set([...PRESET_TAGS, ...meta.tags])].map((t) => { const on = meta.tags.some((x) => x.toLowerCase() === t.toLowerCase()); return <button key={t} type="button" aria-pressed={on} onClick={() => toggleTag(t)} style={{ padding: '5px 11px', borderRadius: 99, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: on ? K.gold : 'transparent', color: on ? '#141416' : K.mid, border: `1px solid ${on ? K.gold : K.borderMid}` }}>{t}</button>; })}
          <span style={{ display: 'inline-flex', gap: 4 }}><input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTag.trim()) { toggleTag(newTag.trim()); setNewTag(''); } }} placeholder="New tag" aria-label="New tag" maxLength={30} style={{ ...inputStyle, width: 110, padding: '5px 9px' }} /></span>
        </div></Field>
        <Field label="Internal notes (never shown to the client)"><textarea value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} rows={5} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>{saved && <span style={{ color: K.ok, fontSize: 12 }}><Check size={12} /> Saved</span>}<Btn kind="primary" onClick={saveMeta}>Save tags & notes</Btn></div>
      </div>)}
      {tab === 'report' && <ReportPanel tenantId={tenantId} />}
    </Modal>
  );
}

/* ───── 35 report (used in drawer and the Reports tab) ───── */
function monthOptions() { const out = []; let y = new Date().getFullYear(), m = new Date().getMonth() + 1; for (let i = 0; i < 6; i++) { out.push(`${y}-${String(m).padStart(2, '0')}`); m -= 1; if (m === 0) { m = 12; y -= 1; } } return out; }
function ReportPanel({ tenantId }) {
  const [month, setMonth] = useState(() => monthOptions()[1]);
  const { data, error, loading } = useLoad(() => growthApi(`/clients/${tenantId}/report`, { params: { month } }).then((r) => r.data), [tenantId, month]);
  const [msg, setMsg] = useState(''); const [text, setText] = useState('');
  useEffect(() => { if (data) setText(data.text); }, [data]);
  const log = (via) => send(`/clients/${tenantId}/report/log`, { month, via }).catch(() => {});
  const copy = async () => { try { await navigator.clipboard.writeText(text); setMsg('Copied'); } catch { setMsg('Copy failed — select the text manually'); } };
  const email = async () => { try { const r = await send(`/clients/${tenantId}/report/email`, { month }); setMsg(`Emailed to ${r.data.to}`); } catch (e) { setMsg(errMsg(e)); } };
  const wa = data?.phone ? `https://wa.me/${data.phone}?text=${encodeURIComponent(text)}` : '';
  return (<div style={{ display: 'grid', gap: 10 }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" style={{ ...inputStyle, width: 140 }}>{monthOptions().map((m) => <option key={m}>{m}</option>)}</select>
      {data && <Pill tone="dim">{data.language === 'mr' ? 'Marathi' : 'English'}</Pill>}
    </div>
    <ErrorLine text={error} />
    {data && (<>
      <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))' }}><Tile label="Orders" value={data.data.orders} /><Tile label="Bills" value={data.data.bills} /><Tile label="Billed" value={inr(data.data.revenue)} /><Tile label="Avg bill" value={inr(data.data.avgBill)} /></div>
      <Field label="Message (you can edit before sending)"><textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} /></Field>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {wa ? <a href={wa} target="_blank" rel="noreferrer" onClick={() => log('WhatsApp')} style={{ textDecoration: 'none' }}><Btn kind="primary"><MessageCircle size={13} /> Send on WhatsApp</Btn></a> : <Pill tone="warn">No 10-digit phone on file</Pill>}
        <Btn onClick={email} disabled={!data.email} title={data.email ? '' : 'No email on record'}><Mail size={13} /> Email</Btn>
        <Btn onClick={copy}><Copy size={13} /> Copy</Btn>
      </div>
      {msg && <div role="status" style={{ fontSize: 12, color: K.mid }}>{msg}</div>}
      {loading && <div style={{ fontSize: 11, color: K.faint }}>Refreshing…</div>}
    </>)}
  </div>);
}

/* ───── 26 + 36 Health ───── */
function Health({ open }) {
  const [tag, setTag] = useState(''); const [label, setLabel] = useState('all'); const [q, setQ] = useState('');
  const { data, error } = useLoad(() => growthApi('/clients/overview', { params: { tag: tag || undefined } }).then((r) => r.data), [tag]);
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const list = data.clients.filter((c) => (label === 'all' || c.health === label) && (!q || `${c.name} ${c.area} ${c.owner}`.toLowerCase().includes(q.toLowerCase())));
  return (<>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      {Object.entries(data.counts).map(([k, v]) => <button key={k} type="button" onClick={() => setLabel(label === k ? 'all' : k)} aria-pressed={label === k} style={{ all: 'unset', cursor: 'pointer', display: 'block' }}><div style={{ outline: label === k ? `2px solid ${K.gold}` : 'none', borderRadius: 14 }}><Tile label={k} value={v} tone={{ Thriving: K.ok, Steady: K.gold, 'At risk': K.warn, Dormant: K.danger }[k]} sub={`${data.total ? Math.round((v / data.total) * 100) : 0}% of clients`} /></div></button>)}
    </div>
    <Section title="Clients" hint="Click a row for timeline, contacts, tags and the monthly report"
      right={<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...inputStyle, width: 170 }}><Search size={13} color={K.dim} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search clients" style={{ background: 'none', border: 'none', outline: 'none', color: K.text, width: '100%', fontSize: 13, fontFamily: 'inherit' }} /></div>
        <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Filter by tag" style={{ ...inputStyle, width: 140 }}><option value="">All tags</option>{data.tags.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.count})</option>)}</select></div>}>
      <Table onRow={(c) => open(c.tenantId)} empty="No clients match." rows={list.map((c) => ({ ...c, id: c.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (c) => <div><b>{c.name}</b><div style={{ fontSize: 11, color: K.dim }}>{c.area || c.city || '—'}</div></div> },
        { key: 'health', label: 'Health', render: (c) => <Pill tone={HEALTH_TONE[c.health]}>{c.health} · {c.score}</Pill> },
        { key: 'o', label: 'Orders 30d', right: true, render: (c) => <span style={{ fontFamily: MONO }}>{c.orders30d}</span> },
        { key: 'l', label: 'Last order', render: (c) => <span style={{ color: K.mid }}>{ago(c.lastOrderAt)}</span> },
        { key: 'd', label: 'Plan ends', render: (c) => c.daysLeft === null ? '—' : <span style={{ color: c.daysLeft <= 7 ? K.danger : K.mid }}>{c.daysLeft > 0 ? `${c.daysLeft}d` : 'expired'}</span> },
        { key: 't', label: 'Tags', render: (c) => <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{c.tags.map((t) => <Pill key={t} tone="bronze">{t}</Pill>)}</div> },
      ]} />
    </Section>
    <div style={{ fontSize: 11, color: K.faint }}>Health score = last order (40) + 7-day volume (25) + subscription (25) + setup (10). Thriving ≥ 75, Steady ≥ 50, At risk ≥ 25.</div>
  </>);
}

/* ───── 27 Renewals ───── */
function Renewals({ open }) {
  const [days, setDays] = useState(30);
  const { data, error, reload } = useLoad(() => growthApi('/clients/renewals', { params: { days } }).then((r) => r.data), [days]);
  const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const set = async (id, renewalStatus) => { try { await send(`/clients/${id}/meta`, { renewalStatus }, 'PUT'); reload(); } catch (e) { setErr(errMsg(e)); } };
  const s = data.stats;
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}><Tile label={`Expiring ≤ ${days}d`} value={s.expiring} /><Tile label="Expired (30d)" value={s.expired} tone={s.expired ? K.danger : K.gold} /><Tile label="Not contacted" value={s.notContacted} tone={K.warn} /><Tile label="Promised" value={s.promised} /><Tile label="Paid" value={s.paid} tone={K.ok} /></div>
    <Section title="Renewal follow-up" right={<select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Window" style={{ ...inputStyle, width: 130 }}>{[30, 60, 90].map((d) => <option key={d} value={d}>Next {d} days</option>)}</select>}>
      <Table empty="No renewals due in this window." onRow={(r) => open(r.tenantId)} rows={data.items.map((r) => ({ ...r, id: r.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (r) => <div><b>{r.name}</b><div style={{ fontSize: 11, color: K.dim }}>{r.owner || '—'}{r.contact ? ` · ${r.contact}` : ''}</div></div> },
        { key: 'daysLeft', label: 'Expires', render: (r) => <div><Pill tone={r.expired ? 'danger' : r.daysLeft <= 7 ? 'warn' : 'dim'}>{r.expired ? `expired ${-r.daysLeft}d ago` : `${r.daysLeft}d left`}</Pill><div style={{ fontSize: 10.5, color: K.faint, marginTop: 3 }}>{fmtD(r.planExpiry)}</div></div> },
        { key: 'health', label: 'Health', render: (r) => <Pill tone={HEALTH_TONE[r.health]}>{r.health}</Pill> },
        { key: 'st', label: 'Status', render: (r) => <select value={r.renewalStatus} onClick={(e) => e.stopPropagation()} onChange={(e) => set(r.tenantId, e.target.value)} aria-label={`Renewal status for ${r.name}`} style={{ ...inputStyle, width: 130, padding: '5px 8px' }}>{RENEWAL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> },
        { key: 'c', label: '', right: true, render: (r) => <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{r.contact && <a href={`tel:${r.contact}`} aria-label="Call" style={{ color: K.gold }}><Phone size={14} /></a>}{waLink(r.contact, `Hi ${r.owner || ''}, your Pratyeksha plan for ${r.name} ${r.expired ? 'has expired' : `ends on ${fmtD(r.planExpiry)}`}. Shall we renew?`) && <a href={waLink(r.contact, `Hi ${r.owner || ''}, your Pratyeksha plan for ${r.name} ${r.expired ? 'has expired' : `ends on ${fmtD(r.planExpiry)}`}. Shall we renew?`)} target="_blank" rel="noreferrer" aria-label="WhatsApp" style={{ color: K.gold }}><MessageCircle size={14} /></a>}</div> },
      ]} />
    </Section>
  </>);
}

/* ───── 28 Churn ───── */
function Churn({ open }) {
  const set = useLoad(() => growthApi('/settings').then((r) => r.data));
  const [od, setOd] = useState(null); const [ld, setLd] = useState(null);
  useEffect(() => { if (set.data && od === null) { setOd(set.data.churnOrderDays); setLd(set.data.churnLoginDays); } }, [set.data, od]);
  const dOd = useDebounced(od, 500), dLd = useDebounced(ld, 500);
  const { data, error } = useLoad(() => (dOd && dLd ? growthApi('/clients/churn', { params: { orderDays: dOd, loginDays: dLd } }).then((r) => r.data) : Promise.resolve(null)), [dOd, dLd]);
  const saveDefault = () => send('/settings', { churnOrderDays: od, churnLoginDays: ld }, 'PUT').catch(() => {});
  return (<>
    <Section title="Alert thresholds" hint="Active clients with no orders or no login for this many days"
      right={<Btn small onClick={saveDefault}>Save as default</Btn>}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Field label="No orders for (days)" style={{ width: 160 }}><input type="number" min="1" max="90" value={od ?? ''} onChange={(e) => setOd(Math.max(1, Number(e.target.value) || 1))} style={inputStyle} /></Field>
        <Field label="No login for (days)" style={{ width: 160 }}><input type="number" min="1" max="120" value={ld ?? ''} onChange={(e) => setLd(Math.max(1, Number(e.target.value) || 1))} style={inputStyle} /></Field>
      </div>
    </Section>
    <ErrorLine text={error} />
    {data && (<Section title={`At risk of churning (${data.items.length})`} hint={data.trackedLogins < data.totalActive ? `Login tracking has seen ${data.trackedLogins} of ${data.totalActive} active clients so far — a client only gets a login date after their next owner/operator sign-in.` : undefined}>
      <Table onRow={(r) => open(r.tenantId)} empty="No client crosses these thresholds." rows={data.items.map((r) => ({ ...r, id: r.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (r) => <div><b>{r.name}</b><div style={{ fontSize: 11, color: K.dim }}>{r.area || '—'}</div></div> },
        { key: 'o', label: 'Last order', render: (r) => r.neverOrdered ? <Pill tone="danger">never ordered</Pill> : <span style={{ color: r.noOrders ? K.danger : K.mid }}>{r.idleOrderDays}d ago</span> },
        { key: 'l', label: 'Last login', render: (r) => r.loginUnknown ? <span style={{ color: K.faint }}>not tracked yet</span> : <span style={{ color: r.noLogin ? K.danger : K.mid }}>{r.idleLoginDays}d ago</span> },
        { key: 'h', label: 'Health', render: (r) => <Pill tone={HEALTH_TONE[r.health]}>{r.health}</Pill> },
        { key: 'c', label: '', right: true, render: (r) => <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{r.contact && <a href={`tel:${r.contact}`} aria-label="Call" style={{ color: K.gold }}><Phone size={14} /></a>}{waLink(r.contact) && <a href={waLink(r.contact)} target="_blank" rel="noreferrer" aria-label="WhatsApp" style={{ color: K.gold }}><MessageCircle size={14} /></a>}</div> },
      ]} /></Section>)}
  </>);
}

/* ───── 29 Upsell ───── */
function Upsell({ open }) {
  const { data, error } = useLoad(() => growthApi('/clients/upsell').then((r) => r.data));
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  return (<>
    <Tile label="Upsell candidates" value={data.items.length} sub={`of ${data.healthyTotal} healthy clients (score ≥ 60)`} />
    <Section title="Healthy clients missing an add-on" hint="Good fit to pitch Feedback Suite or WhatsApp Campaigns">
      <Table onRow={(r) => open(r.tenantId)} empty="No candidates right now." rows={data.items.map((r) => ({ ...r, id: r.tenantId }))} cols={[
        { key: 'name', label: 'Client', render: (r) => <div><b>{r.name}</b><div style={{ fontSize: 11, color: K.dim }}>{r.area || '—'}</div></div> },
        { key: 's', label: 'Health', render: (r) => <Pill tone={HEALTH_TONE[r.health]}>{r.health} · {r.score}</Pill> },
        { key: 'o', label: 'Orders 30d', right: true, render: (r) => <span style={{ fontFamily: MONO }}>{r.orders30d}</span> },
        { key: 'm', label: 'Pitch', render: (r) => <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{r.missing.map((m) => <Pill key={m} tone="gold">{m}</Pill>)}</div> },
        { key: 'c', label: '', right: true, render: (r) => <div onClick={(e) => e.stopPropagation()}>{waLink(r.contact, `Hi ${r.owner || ''}, ${r.name} is doing great on Pratyeksha! Would you like to try ${r.missing[0]}?`) && <a href={waLink(r.contact, `Hi ${r.owner || ''}, ${r.name} is doing great on Pratyeksha! Would you like to try ${r.missing[0]}?`)} target="_blank" rel="noreferrer" aria-label="WhatsApp" style={{ color: K.gold }}><MessageCircle size={14} /></a>}</div> },
      ]} /></Section>
  </>);
}

/* ───── 30 Onboarding ───── */
function Onboarding({ open }) {
  const { data, error, reload } = useLoad(() => growthApi('/clients/onboarding').then((r) => r.data));
  const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const flipQr = async (c, done) => { try { await send(`/clients/${c.tenantId}/meta`, { qrPrinted: done }, 'PUT'); reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><Tile label="Fully set up" value={`${data.complete}/${data.items.length}`} tone={K.ok} /><Tile label="Average progress" value={`${data.avgPct}%`} /></div>
    <Section title="Setup progress" hint="Menu, tables, UPI and first order are detected automatically. QR printed is ticked by you.">
      {data.items.length === 0 ? <Empty text="No clients yet." /> : data.items.map((c) => (
        <div key={c.tenantId} className="k-row" style={{ padding: '12px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <button type="button" onClick={() => open(c.tenantId)} style={{ background: 'none', border: 'none', color: K.text, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit', textAlign: 'left' }}>{c.name} <span style={{ color: K.faint, fontWeight: 400, fontSize: 11 }}>· {c.ageDays}d old</span></button>
            <span style={{ fontFamily: MONO, fontSize: 12, color: c.pct === 100 ? K.ok : K.gold }}>{c.done}/{c.total}</span>
          </div>
          <Bar value={c.done} max={c.total} color={c.pct === 100 ? K.ok : K.gold} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
            {c.steps.map((s) => s.auto
              ? <Pill key={s.key} tone={s.done ? 'ok' : 'dim'}>{s.done ? '✓' : '○'} {s.label}</Pill>
              : <button key={s.key} type="button" onClick={() => flipQr(c, !s.done)} aria-pressed={s.done} style={{ all: 'unset', cursor: 'pointer' }}><Pill tone={s.done ? 'ok' : 'warn'}>{s.done ? '✓' : '○'} {s.label} · tap to {s.done ? 'undo' : 'tick'}</Pill></button>)}
          </div>
        </div>))}
    </Section>
  </>);
}

/* ───── 32 Satisfaction ───── */
function Satisfaction() {
  const { data, error, reload } = useLoad(() => growthApi('/clients/satisfaction').then((r) => r.data));
  const clients = useLoad(() => growthApi('/clients/overview').then((r) => r.data.clients));
  const [f, setF] = useState({ tenantId: '', kind: 'nps', score: 9, comment: '' }); const [err, setErr] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const add = async () => { try { await send('/clients/satisfaction', { ...f, score: Number(f.score) }); setF({ ...f, comment: '' }); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const del = async (id) => { try { await send(`/clients/satisfaction/${id}`, undefined, 'DELETE'); reload(); } catch (e) { setErr(errMsg(e)); } };
  const max = f.kind === 'nps' ? 10 : 5, min = f.kind === 'nps' ? 0 : 1;
  return (<>
    <ErrorLine text={err || error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Tile label="NPS" value={data.nps ?? '—'} sub={`${data.npsResponses} responses`} /><Tile label="Promoters" value={data.promoters} tone={K.ok} sub="9–10" /><Tile label="Passives" value={data.passives} sub="7–8" /><Tile label="Detractors" value={data.detractors} tone={data.detractors ? K.danger : K.gold} sub="0–6" /><Tile label="Avg rating" value={data.avgStars ?? '—'} sub={`${data.starResponses} star ratings`} />
    </div>
    <Section title="Record a response" hint="Ask the owner on a call or WhatsApp — “How likely are you to recommend Pratyeksha? (0–10)” — and log it here">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="Client" style={{ flex: '1 1 180px' }}><select value={f.tenantId} onChange={(e) => setF({ ...f, tenantId: e.target.value })} style={inputStyle}><option value="">Choose…</option>{(clients.data || []).map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Field>
        <Field label="Type" style={{ width: 120 }}><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value, score: e.target.value === 'nps' ? 9 : 5 })} style={inputStyle}><option value="nps">NPS (0–10)</option><option value="stars">Stars (1–5)</option></select></Field>
        <Field label="Score" style={{ width: 90 }}><input type="number" min={min} max={max} value={f.score} onChange={(e) => setF({ ...f, score: e.target.value })} style={inputStyle} /></Field>
        <Field label="Comment" style={{ flex: '2 1 200px' }}><input value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} maxLength={400} style={inputStyle} /></Field>
        <Btn kind="primary" disabled={!f.tenantId} onClick={add}>Save</Btn>
      </div>
    </Section>
    {data.detractorsList.length > 0 && <Section title="Detractors to call back" style={{ borderColor: 'rgba(226,154,88,0.3)' }}>{data.detractorsList.map((d) => <div key={d._id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}><b>{d.name}</b> <Pill tone="danger">{d.score}/10</Pill> <span style={{ color: K.dim }}>{d.comment}</span></div>)}</Section>}
    <Section title="Recent responses"><Table empty="No responses yet." rows={data.responses.map((r) => ({ ...r, id: r._id }))} cols={[
      { key: 'name', label: 'Client' }, { key: 'score', label: 'Score', render: (r) => <Pill tone={r.kind === 'nps' ? (r.score >= 9 ? 'ok' : r.score >= 7 ? 'gold' : 'danger') : 'gold'}>{r.kind === 'nps' ? `${r.score}/10` : `${r.score}★`}</Pill> },
      { key: 'comment', label: 'Comment', render: (r) => <span style={{ color: K.mid }}>{r.comment || '—'}</span> }, { key: 'at', label: 'When', render: (r) => fmtD(r.at) },
      { key: 'x', label: '', right: true, render: (r) => <button type="button" aria-label="Delete" onClick={() => del(r._id)} style={{ background: 'none', border: 'none', color: K.faint, cursor: 'pointer' }}><Trash2 size={13} /></button> },
    ]} /></Section>
  </>);
}

/* ───── 33 Feature requests ───── */
const FSTATUS = ['new', 'planned', 'building', 'shipped', 'declined'];
function Features() {
  const { data, error, reload } = useLoad(() => growthApi('/clients/features').then((r) => r.data));
  const [f, setF] = useState({ title: '', tenantId: '', detail: '' }); const [err, setErr] = useState(''); const [info, setInfo] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const add = async () => { try { const r = await send('/clients/features', f); setInfo(r.data.merged ? 'A request with this title already exists — your client was added as a voter.' : ''); setF({ title: '', tenantId: f.tenantId, detail: '' }); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const vote = async (id, tenantId) => { if (!tenantId) { setErr('Choose the client who is voting in the form above first.'); return; } try { await send(`/clients/features/${id}/vote`, { tenantId }); setErr(''); reload(); } catch (e) { setErr(errMsg(e)); } };
  const patch = async (id, body) => { try { await send(`/clients/features/${id}`, body, 'PATCH'); reload(); } catch (e) { setErr(errMsg(e)); } };
  const del = async (id) => { if (!window.confirm('Delete this request?')) return; try { await send(`/clients/features/${id}`, undefined, 'DELETE'); reload(); } catch (e) { setErr(errMsg(e)); } };
  return (<>
    <ErrorLine text={err || error} />
    <Section title="Log a suggestion" hint="Choose the client, then add their idea. Duplicate titles are merged into one request with another vote.">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="Client" style={{ flex: '1 1 170px' }}><select value={f.tenantId} onChange={(e) => setF({ ...f, tenantId: e.target.value })} style={inputStyle}><option value="">Choose…</option>{data.clients.map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Field>
        <Field label="Request" style={{ flex: '2 1 220px' }}><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={140} style={inputStyle} /></Field>
        <Btn kind="primary" disabled={!f.title.trim() || !f.tenantId} onClick={add}><Plus size={13} /> Add</Btn>
      </div>
      {info && <div role="status" style={{ fontSize: 12, color: K.ok, marginTop: 8 }}>{info}</div>}
    </Section>
    <Section title="Requests, most voted first">
      {data.features.length === 0 ? <Empty text="No requests yet." /> : data.features.map((r) => (
        <div key={r._id} className="k-row" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '11px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => vote(r._id, f.tenantId)} title={f.tenantId ? 'Toggle this client’s vote' : 'Choose a client above to vote for them'} style={{ background: K.goldFaint, border: `1px solid ${K.goldLine}`, borderRadius: 10, color: K.gold, padding: '6px 11px', cursor: 'pointer', minWidth: 52, fontFamily: 'inherit' }}><div style={{ fontSize: 17, fontWeight: 700, fontFamily: MONO }}>{r.votes}</div><div style={{ fontSize: 9, letterSpacing: 1 }}>VOTES</div></button>
          <div style={{ flex: 1, minWidth: 180 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.title}</div><div style={{ fontSize: 11, color: K.dim }}>by {r.requester || '—'}{r.voterNames.length > 1 ? ` · +${r.voterNames.length - 1}: ${r.voterNames.slice(1, 4).join(', ')}${r.voterNames.length > 4 ? '…' : ''}` : ''}</div></div>
          <select value={r.status} onChange={(e) => patch(r._id, { status: e.target.value })} aria-label="Status" style={{ ...inputStyle, width: 120 }}>{FSTATUS.map((s) => <option key={s}>{s}</option>)}</select>
          <button type="button" aria-label="Delete request" onClick={() => del(r._id)} style={{ background: 'none', border: 'none', color: K.faint, cursor: 'pointer' }}><Trash2 size={14} /></button>
        </div>))}
    </Section>
  </>);
}

/* ───── 35 Reports tab ───── */
function Reports() {
  const { data, error } = useLoad(() => growthApi('/clients/overview').then((r) => r.data));
  const [id, setId] = useState('');
  if (!data) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  return (<Section title="Monthly client report" hint="Orders, bills and top dishes for last month, written in the client’s preferred language, sent with one tap">
    <Field label="Client" style={{ maxWidth: 340, marginBottom: 14 }}><select value={id} onChange={(e) => setId(e.target.value)} style={inputStyle}><option value="">Choose a client…</option>{data.clients.map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Field>
    {id ? <ReportPanel key={id} tenantId={id} /> : <Empty text="Pick a client to preview their report." />}
  </Section>);
}

export default function MasterClientSuccess() {
  const [tab, setTab] = useState('health'); const [drawer, setDrawer] = useState(''); const [rev, setRev] = useState(0);
  const open = (id) => setDrawer(id);
  const view = useMemo(() => ({ health: <Health key={rev} open={open} />, renewals: <Renewals key={rev} open={open} />, churn: <Churn open={open} />, upsell: <Upsell open={open} />, onboarding: <Onboarding open={open} />, nps: <Satisfaction />, features: <Features />, reports: <Reports /> }[tab]), [tab, rev]);
  return (<Screen icon={HeartPulse} title="Client Success" subtitle="Health, renewals, churn risk and everything about each client" tabs={TABS} tab={tab} onTab={setTab}>
    {view}
    {drawer && <ClientDrawer key={drawer} tenantId={drawer} onClose={() => setDrawer('')} onChanged={() => setRev((r) => r + 1)} />}
  </Screen>);
}
