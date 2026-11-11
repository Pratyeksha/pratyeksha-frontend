// Master Admin › Team & security (68, 70, 71) and Compliance (72, 73, 74).
// Uses ONLY the Master Admin theme.
import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Users, ShieldCheck } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, MONO, errMsg, useLoad, fmtDT, fmtD, ago, Btn, Pill, Tile, Section, Empty, Field, Modal, ErrorLine, Screen, Table, inputStyle } from './masterKit.jsx';

const ADM = `${API_BASE_URL}/admin/master`;
const api = (m, p, body, params) => axios({ url: `${ADM}${p}`, method: m, data: body, params }).then((r) => r.data);
const ROLE_LABEL = { owner: 'Owner', sales: 'Sales', support: 'Support', finance: 'Finance' };
const ROLE_HINT = { owner: 'Everything, including team and security.', sales: 'Demos, leads, clients, onboarding, plans, documents, QR Studio.', support: 'Clients, tickets, control, discovery, notifications.', finance: 'Finance, operating costs, plans, documents, clients.' };
const useNote = () => { const [m, setM] = useState(null); return [m, (t, bad) => { setM({ t, bad }); if (!bad) setTimeout(() => setM(null), 3000); }]; };
const Note = ({ m }) => (m ? <div role={m.bad ? 'alert' : 'status'} style={{ fontSize: 12.5, color: m.bad ? K.danger : K.ok, marginBottom: 8 }}>{m.t}</div> : null);
const device = (ua) => { const s = String(ua || ''); const b = /Edg\//.test(s) ? 'Edge' : /Chrome\//.test(s) ? 'Chrome' : /Firefox\//.test(s) ? 'Firefox' : /Safari\//.test(s) ? 'Safari' : 'Browser'; const o = /Android/.test(s) ? 'Android' : /iPhone|iPad/.test(s) ? 'iOS' : /Windows/.test(s) ? 'Windows' : /Mac OS/.test(s) ? 'Mac' : /Linux/.test(s) ? 'Linux' : ''; return [b, o].filter(Boolean).join(' on '); };

/* ───── 68 team ───── */
function Users_() {
  const { data, error, reload } = useLoad(() => api('GET', '/team/users'));
  const [edit, setEdit] = useState(null); const [m, note] = useNote();
  const toggle = async (u) => { try { await api('PUT', `/team/users/${u._id}`, { active: !u.active }); note(u.active ? `${u.name} switched off and signed out.` : `${u.name} switched on.`); reload(); } catch (e) { note(errMsg(e), true); } };
  const reset2 = async (u) => { try { await api('PUT', `/team/users/${u._id}`, { reset2fa: true }); note(`Two-factor reset for ${u.name}. They can set it up again.`); reload(); } catch (e) { note(errMsg(e), true); } };
  return (<>
    <Note m={m} /><ErrorLine text={error} />
    <Section title="People who can sign in" hint="Each person sees only the sections their role needs." right={<Btn kind="primary" small onClick={() => setEdit({})}>Add person</Btn>}>
      <Table rows={data?.users || []} empty="No team members yet." cols={[
        { key: 'name', label: 'Name', render: (u) => <div><div style={{ color: K.text, fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{u.username}</div></div> },
        { key: 'role', label: 'Role', render: (u) => <Pill>{ROLE_LABEL[u.role] || u.role}</Pill> },
        { key: 'twoFactor', label: 'Two-factor', render: (u) => (u.twoFactor ? <Pill>On</Pill> : <Pill tone="dim">Off</Pill>) },
        { key: 'lastLoginAt', label: 'Last sign-in', render: (u) => (u.lastLoginAt ? ago(u.lastLoginAt) : 'never') },
        { key: 'active', label: 'Status', render: (u) => (u.active ? <Pill>Active</Pill> : <Pill tone="warn">Off</Pill>) },
        { key: 'x', label: '', right: true, render: (u) => (u.builtin ? <span style={{ fontSize: 11, color: K.faint }}>Server password</span> : (
          <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Btn small kind="quiet" onClick={() => setEdit(u)}>Edit</Btn>
            {u.twoFactor && <Btn small kind="quiet" onClick={() => reset2(u)}>Reset 2FA</Btn>}
            <Btn small kind={u.active ? 'danger' : 'ghost'} onClick={() => toggle(u)}>{u.active ? 'Switch off' : 'Switch on'}</Btn>
          </span>)) },
      ]} />
    </Section>
    <Section title="What each role can open">
      <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        {Object.keys(ROLE_LABEL).map((r) => <div key={r} style={{ padding: 12, borderRadius: 10, border: `1px solid ${K.border}`, background: K.card2 }}><div style={{ color: K.gold, fontWeight: 700, fontSize: 13 }}>{ROLE_LABEL[r]}</div><div style={{ fontSize: 12, color: K.mid, marginTop: 4 }}>{ROLE_HINT[r]}</div></div>)}
      </div>
    </Section>
    {edit && <UserModal u={edit} onClose={() => setEdit(null)} onDone={(t) => { setEdit(null); note(t); reload(); }} />}
  </>);
}
function UserModal({ u, onClose, onDone }) {
  const isNew = !u._id; const [f, setF] = useState({ username: '', name: u.name || '', role: u.role || 'support', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); setErr(''); try { if (isNew) await api('POST', '/team/users', f); else await api('PUT', `/team/users/${u._id}`, { name: f.name, role: f.role, ...(f.password ? { password: f.password } : {}) }); onDone(isNew ? `${f.name} added.` : 'Saved.'); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<Modal title={isNew ? 'Add a team member' : `Edit ${u.name}`} onClose={onClose}>
    <div style={{ display: 'grid', gap: 12 }}>
      {isNew && <Field label="Username" hint="Letters, numbers, dot, dash or underscore"><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} style={inputStyle} autoComplete="off" /></Field>}
      <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inputStyle} /></Field>
      <Field label="Role" hint={ROLE_HINT[f.role]}><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} style={inputStyle}>{Object.keys(ROLE_LABEL).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></Field>
      <Field label={isNew ? 'Password' : 'New password (leave blank to keep)'} hint="At least 10 characters. Changing it signs them out everywhere."><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} style={inputStyle} autoComplete="new-password" /></Field>
      <ErrorLine text={err} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={save}>{isNew ? 'Add' : 'Save'}</Btn></div>
    </div>
  </Modal>);
}

/* ───── 70 my security ───── */
function Security() {
  const me = useLoad(() => api('GET', '/team/me')); const [setup, setSetup] = useState(null); const [code, setCode] = useState(''); const [m, note] = useNote(); const [pw, setPw] = useState({ current: '', next: '' }); const [busy, setBusy] = useState(false);
  const d = me.data;
  const start = async () => { try { setSetup(await api('POST', '/team/2fa/setup')); setCode(''); } catch (e) { note(errMsg(e), true); } };
  const enable = async () => { setBusy(true); try { await api('POST', '/team/2fa/enable', { code }); setSetup(null); note('Two-factor is on. You will be asked for a code at every sign-in.'); me.reload(); } catch (e) { note(errMsg(e), true); } finally { setBusy(false); } };
  const disable = async () => { setBusy(true); try { await api('POST', '/team/2fa/disable', { code }); setCode(''); note('Two-factor is off.'); me.reload(); } catch (e) { note(errMsg(e), true); } finally { setBusy(false); } };
  const change = async () => { setBusy(true); try { await api('POST', '/team/password', pw); setPw({ current: '', next: '' }); note('Password changed.'); } catch (e) { note(errMsg(e), true); } finally { setBusy(false); } };
  if (!d) return me.error ? <ErrorLine text={me.error} /> : <Empty text="Loading…" />;
  return (<>
    <Note m={m} />
    <Section title="Signed in as" hint={`${d.name} · ${ROLE_LABEL[d.role] || d.role}`}><div style={{ fontSize: 12.5, color: K.mid, fontFamily: MONO }}>{d.username}</div></Section>
    <Section title="Two-factor sign-in" hint="A 6-digit code from an authenticator app (Google Authenticator, Authy, Microsoft Authenticator) on top of the password.">
      {d.twoFactor && !setup && (<div style={{ display: 'grid', gap: 10, maxWidth: 320 }}>
        <div><Pill>On</Pill></div>
        <Field label="To switch it off, enter a current code"><input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, fontFamily: MONO, letterSpacing: 3 }} placeholder="123456" /></Field>
        <div><Btn kind="danger" busy={busy} disabled={code.length !== 6} onClick={disable}>Switch off two-factor</Btn></div>
      </div>)}
      {!d.twoFactor && !setup && (<div style={{ display: 'grid', gap: 10 }}><div><Pill tone="dim">Off</Pill></div><div><Btn kind="primary" onClick={start}>Set up two-factor</Btn></div></div>)}
      {setup && (<div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ background: '#fff', padding: 10, borderRadius: 10 }}><QRCodeSVG value={setup.otpauth} size={150} /></div>
        <div style={{ display: 'grid', gap: 10, minWidth: 220, flex: 1, maxWidth: 360 }}>
          <div style={{ fontSize: 12.5, color: K.mid }}>Scan this with your authenticator app, or type this key in:</div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: K.gold, wordBreak: 'break-all', userSelect: 'all' }}>{setup.secret}</div>
          <Field label="Then enter the 6-digit code it shows"><input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, fontFamily: MONO, letterSpacing: 3 }} placeholder="123456" /></Field>
          <div style={{ display: 'flex', gap: 8 }}><Btn onClick={() => setSetup(null)}>Cancel</Btn><Btn kind="primary" busy={busy} disabled={code.length !== 6} onClick={enable}>Turn on</Btn></div>
        </div>
      </div>)}
    </Section>
    <Section title="Password" hint={d.builtin ? 'The owner password is set on the server (MASTER_ADMIN_PASSWORD), not here.' : 'At least 10 characters.'}>
      {!d.builtin && (<div style={{ display: 'grid', gap: 10, maxWidth: 320 }}>
        <Field label="Current password"><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} style={inputStyle} autoComplete="current-password" /></Field>
        <Field label="New password"><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} style={inputStyle} autoComplete="new-password" /></Field>
        <div><Btn kind="primary" busy={busy} disabled={!pw.current || pw.next.length < 10} onClick={change}>Change password</Btn></div>
      </div>)}
    </Section>
  </>);
}

/* ───── 70/71 sessions + sign-in history ───── */
function Sessions({ isOwner }) {
  const [all, setAll] = useState(false); const s = useLoad(() => api('GET', '/team/sessions', null, all ? { all: 1 } : undefined), [all]); const [onlyFailed, setOnlyFailed] = useState(false);
  const h = useLoad(() => api('GET', '/team/logins', null, onlyFailed ? { failed: 1 } : undefined), [onlyFailed]); const [m, note] = useNote();
  const revoke = async (x) => { try { const r = await api('POST', `/team/sessions/${x.sid}/revoke`); note(r.self ? 'Signed out.' : 'Session signed out.'); if (r.self) setTimeout(() => window.location.reload(), 600); else s.reload(); } catch (e) { note(errMsg(e), true); } };
  const others = async () => { try { const r = await api('POST', '/team/sessions/revoke-others'); note(`${r.count} other session${r.count === 1 ? '' : 's'} signed out.`); s.reload(); } catch (e) { note(errMsg(e), true); } };
  return (<>
    <Note m={m} />
    <Section title="Where you are signed in" hint="A session ends after 12 hours, or when you sign it out here." right={<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {isOwner && <label style={{ fontSize: 12, color: K.mid, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Everyone</label>}
      <Btn small onClick={others}>Sign out my other sessions</Btn></span>}>
      <ErrorLine text={s.error} />
      <Table rows={s.data || []} empty="No active sessions." cols={[
        { key: 'name', label: 'Who', render: (x) => <div><div style={{ color: K.text, fontWeight: 600 }}>{x.name || x.username}{x.current && <> <Pill>This device</Pill></>}</div><div style={{ fontSize: 11, color: K.faint }}>{ROLE_LABEL[x.role] || x.role}</div></div> },
        { key: 'ua', label: 'Device', render: (x) => device(x.ua) },
        { key: 'ip', label: 'IP', render: (x) => <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{x.ip}</span> },
        { key: 'createdAt', label: 'Signed in', render: (x) => fmtDT(x.createdAt) },
        { key: 'lastSeenAt', label: 'Last active', render: (x) => fmtDT(x.lastSeenAt) },
        { key: 'x', label: '', right: true, render: (x) => <Btn small kind="danger" onClick={() => revoke(x)}>{x.current ? 'Sign out' : 'Revoke'}</Btn> },
      ]} />
    </Section>
    <Section title="Sign-in history" hint={h.data ? `${h.data.failed24h} failed attempt${h.data.failed24h === 1 ? '' : 's'} in the last 24 hours` : ''} right={<label style={{ fontSize: 12, color: K.mid, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)} /> Failed only</label>}>
      <ErrorLine text={h.error} />
      <Table rows={h.data?.rows || []} empty="No sign-ins recorded yet." cols={[
        { key: 'createdAt', label: 'When', render: (x) => fmtDT(x.createdAt) },
        { key: 'username', label: 'User', render: (x) => <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{x.username || '—'}</span> },
        { key: 'ok', label: 'Result', render: (x) => (x.ok ? <Pill>Signed in</Pill> : <Pill tone="warn">Failed</Pill>) },
        { key: 'reason', label: 'Detail' },
        { key: 'ip', label: 'IP', render: (x) => <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{x.ip}</span> },
        { key: 'ua', label: 'Device', render: (x) => device(x.ua) },
      ]} />
    </Section>
  </>);
}

export default function MasterTeam({ isOwner = true }) {
  const [tab, setTab] = useState(isOwner ? 'team' : 'security');
  const tabs = isOwner ? [['team', 'Team'], ['security', 'My security'], ['sessions', 'Sessions & sign-ins']] : [['security', 'My security'], ['sessions', 'My sessions']];
  const view = { team: <Users_ />, security: <Security />, sessions: <Sessions isOwner={isOwner} /> }[tab];
  return <Screen icon={Users} title="Team & security" subtitle="Who can sign in, what they can open, and where they are signed in" tabs={tabs} tab={tab} onTab={setTab}>{view}</Screen>;
}

/* ───── 72 guest data requests ───── */
const STATUS = { new: 'New', verifying: 'Verifying', in_progress: 'In progress', done: 'Done', rejected: 'Rejected' };
const TYPE = { access: 'Copy of data', erase: 'Erase', correct: 'Correct' };
function Requests() {
  const [open, setOpen] = useState(true); const { data, error, reload } = useLoad(() => api('GET', '/dsr', null, open ? { status: 'open' } : undefined), [open]); const [sel, setSel] = useState(null); const [adding, setAdding] = useState(false);
  return (<>
    <ErrorLine text={error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 14 }}>
      <Tile label="Open" value={data?.open ?? '—'} /><Tile label="Overdue (30 days)" value={data?.overdue ?? '—'} tone={data?.overdue ? 'warn' : undefined} />
    </div>
    <Section title="Requests from guests" hint="Guests can ask for a copy, correction or erasure of their data. Reply within 30 days." right={<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><label style={{ fontSize: 12, color: K.mid, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} /> Open only</label><Btn small kind="primary" onClick={() => setAdding(true)}>Log a request</Btn></span>}>
      <Table rows={data?.rows || []} onRow={setSel} empty="No requests." cols={[
        { key: 'ref', label: 'Ref', render: (d) => <span style={{ fontFamily: MONO }}>{d.ref}</span> },
        { key: 'type', label: 'Asks for', render: (d) => TYPE[d.type] || d.type },
        { key: 'name', label: 'Guest', render: (d) => <div><div style={{ color: K.text }}>{d.name || '—'}</div><div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{d.phone || d.email}</div></div> },
        { key: 'status', label: 'Status', render: (d) => <Pill tone={d.overdue ? 'warn' : ['done', 'rejected'].includes(d.status) ? 'dim' : 'gold'}>{STATUS[d.status] || d.status}</Pill> },
        { key: 'dueAt', label: 'Due', render: (d) => (['done', 'rejected'].includes(d.status) ? '—' : d.overdue ? <span style={{ color: K.warn }}>Overdue</span> : `${d.daysLeft} days`) },
      ]} />
    </Section>
    {sel && <RequestModal id={sel._id} first={sel} onClose={() => setSel(null)} onChanged={reload} />}
    {adding && <AddRequest onClose={() => setAdding(false)} onDone={() => { setAdding(false); reload(); }} />}
  </>);
}
function AddRequest({ onClose, onDone }) {
  const [f, setF] = useState({ type: 'access', name: '', phone: '', email: '', tenantId: '', details: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); setErr(''); try { await api('POST', '/dsr', f); onDone(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<Modal title="Log a guest request" onClose={onClose}><div style={{ display: 'grid', gap: 12 }}>
    <Field label="Asks for"><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} style={inputStyle}>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
    <Field label="Guest name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inputStyle} /></Field>
    <Field label="Mobile number" hint="Records are matched on the last 10 digits"><input inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} style={inputStyle} /></Field>
    <Field label="Email (optional)"><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={inputStyle} /></Field>
    <Field label="Restaurant ID (optional)" hint="Limit the search to one restaurant"><input value={f.tenantId} onChange={(e) => setF({ ...f, tenantId: e.target.value })} style={inputStyle} /></Field>
    <ErrorLine text={err} /><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={save}>Log request</Btn></div>
  </div></Modal>);
}
function RequestModal({ id, first, onClose, onChanged }) {
  const [d, setD] = useState(first); const [prev, setPrev] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(''); const [note, setNote] = useState(''); const [confirm, setConfirm] = useState(''); const [ok, setOk] = useState('');
  const run = async (k, fn) => { setBusy(k); setErr(''); setOk(''); try { await fn(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(''); } };
  const download = async () => run('export', async () => { const r = await axios.post(`${ADM}/dsr/${id}/export`, {}, { responseType: 'blob' }); const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = `${d.ref}-export.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); setOk('Export downloaded. Share it only with the person who asked, after you have checked who they are.'); });
  const update = (body) => run('upd', async () => { const r = await api('PUT', `/dsr/${id}`, body); setD(r); setNote(''); onChanged(); });
  const done = ['done', 'rejected'].includes(d.status);
  return (<Modal title={`${d.ref} · ${TYPE[d.type] || d.type}`} onClose={onClose} width={560}><div style={{ display: 'grid', gap: 12 }}>
    <div style={{ fontSize: 12.5, color: K.mid }}>{d.name || 'Guest'} · <span style={{ fontFamily: MONO }}>{d.phone || d.email}</span>{d.tenantId ? ` · ${d.tenantId}` : ''}</div>
    {d.details && <div style={{ fontSize: 12.5, color: K.text, background: K.card2, padding: 10, borderRadius: 8 }}>{d.details}</div>}
    <div style={{ fontSize: 12, color: K.faint }}>Check the guest is who they say they are (for example, message them on the same number) before sharing or erasing anything.</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Btn small busy={busy === 'prev'} onClick={() => run('prev', async () => setPrev(await api('POST', `/dsr/${id}/preview`)))}>Find their records</Btn>
      <Btn small busy={busy === 'export'} onClick={download}>Download copy (JSON)</Btn>
      {STATUS && ['verifying', 'in_progress'].map((s) => d.status !== s && !done && <Btn key={s} small kind="quiet" onClick={() => update({ status: s })}>Mark {STATUS[s].toLowerCase()}</Btn>)}
      {!done && <Btn small kind="quiet" onClick={() => update({ status: 'rejected', note: note || 'Rejected' })}>Reject</Btn>}
    </div>
    {prev && <div style={{ fontSize: 12.5, color: K.text, background: K.card2, padding: 10, borderRadius: 8 }}>{prev.total ? prev.matches.map((x) => `${x.model}: ${x.count}`).join(' · ') : 'No records found for this number.'}</div>}
    {d.type === 'erase' && !done && (<div style={{ border: `1px solid ${K.goldLine}`, borderRadius: 10, padding: 12, display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12.5, color: K.mid }}>Erasing replaces their name, mobile, email and push subscription with blanks. Order totals stay for tax records, without personal details. This cannot be undone.</div>
      <Field label="Type ERASE to confirm"><input value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} /></Field>
      <div><Btn kind="danger" disabled={confirm !== 'ERASE'} busy={busy === 'erase'} onClick={() => run('erase', async () => { await api('POST', `/dsr/${id}/erase`, { confirm }); setD(await api('PUT', `/dsr/${id}`, {})); setConfirm(''); setOk('Personal details erased.'); onChanged(); })}>Erase their data</Btn></div>
    </div>)}
    {ok && <div role="status" style={{ fontSize: 12.5, color: K.ok }}>{ok}</div>}<ErrorLine text={err} />
    {d.result && <div style={{ fontSize: 12, color: K.mid }}>{d.result}</div>}
    <Field label="Add a note"><div style={{ display: 'flex', gap: 8 }}><input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} /><Btn disabled={!note.trim()} onClick={() => update({ note })}>Add</Btn></div></Field>
    {!done && <div><Btn kind="primary" onClick={() => update({ status: 'done', note: note || undefined })}>Mark as done</Btn></div>}
    {(d.notes || []).length > 0 && <div style={{ display: 'grid', gap: 4 }}>{d.notes.map((n, i) => <div key={i} style={{ fontSize: 11.5, color: K.mid }}>{fmtDT(n.at)} · {n.by}: {n.text}</div>)}</div>}
  </div></Modal>);
}

/* ───── 73 terms ───── */
function Terms() {
  const { data, error, reload } = useLoad(() => api('GET', '/terms')); const [pub, setPub] = useState(false); const [acc, setAcc] = useState(null);
  const rows = data?.rows || []; const cur = data?.current;
  return (<>
    <ErrorLine text={error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 14 }}>
      <Tile label="Current version" value={cur ? `v${cur.version}` : '—'} /><Tile label="Accepted" value={cur ? rows.filter((r) => r.upToDate).length : '—'} /><Tile label="Not yet" value={cur ? rows.filter((r) => !r.upToDate).length : '—'} tone={cur && rows.some((r) => !r.upToDate) ? 'warn' : undefined} />
    </div>
    <Section title="Terms of service" hint={cur ? `${cur.title} — published ${fmtD(cur.createdAt)}. Publishing a new version asks everyone to accept again.` : 'Nothing published yet.'} right={<Btn small kind="primary" onClick={() => setPub(true)}>{cur ? 'Publish new version' : 'Publish terms'}</Btn>}>
      {cur && <div style={{ fontSize: 12.5, color: K.mid, whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto', background: K.card2, padding: 12, borderRadius: 8 }}>{cur.body}</div>}
    </Section>
    <Section title="Who accepted" hint="Clients accept inside their own app. You can also record a signed copy or message.">
      <Table rows={rows} empty="No clients." cols={[
        { key: 'name', label: 'Client', render: (r) => <div><div style={{ color: K.text, fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{r.tenantId}</div></div> },
        { key: 'upToDate', label: 'Current version', render: (r) => (r.upToDate ? <Pill>Accepted</Pill> : <Pill tone="warn">Pending</Pill>) },
        { key: 'acceptedVersion', label: 'Last accepted', render: (r) => (r.acceptedVersion ? `v${r.acceptedVersion}` : 'never') },
        { key: 'at', label: 'When', render: (r) => (r.at ? `${fmtD(r.at)}${r.how === 'manual' ? ' (recorded by us)' : ''}` : '—') },
        { key: 'x', label: '', right: true, render: (r) => !r.upToDate && cur && <Btn small kind="quiet" onClick={() => setAcc(r)}>Record acceptance</Btn> },
      ]} />
    </Section>
    {pub && <PublishTerms onClose={() => setPub(false)} onDone={() => { setPub(false); reload(); }} />}
    {acc && <AcceptModal r={acc} onClose={() => setAcc(null)} onDone={() => { setAcc(null); reload(); }} />}
  </>);
}
function PublishTerms({ onClose, onDone }) {
  const [f, setF] = useState({ title: 'Terms of Service', body: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); setErr(''); try { await api('POST', '/terms', f); onDone(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<Modal title="Publish terms" onClose={onClose} width={580}><div style={{ display: 'grid', gap: 12 }}>
    <Field label="Title"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={inputStyle} /></Field>
    <Field label="Full text" hint="Have a lawyer review this wording before you publish."><textarea rows={10} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
    <ErrorLine text={err} /><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={save}>Publish</Btn></div>
  </div></Modal>);
}
function AcceptModal({ r, onClose, onDone }) {
  const [note, setNote] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); setErr(''); try { await api('POST', `/terms/${r.tenantId}/accept`, { note }); onDone(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<Modal title={`Record acceptance — ${r.name}`} onClose={onClose}><div style={{ display: 'grid', gap: 12 }}>
    <Field label="How did they accept?" hint="For example: signed copy on WhatsApp, 4 Nov"><input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} /></Field>
    <ErrorLine text={err} /><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={save}>Save</Btn></div>
  </div></Modal>);
}

/* ───── 74 credits ───── */
function Credits() {
  const { data, error, reload } = useLoad(() => api('GET', '/credits')); const [sel, setSel] = useState(null);
  return (<>
    <ErrorLine text={error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 14 }}>
      <Tile label="Credits held by clients" value={data?.totalBalance ?? '—'} /><Tile label="Running low" value={data?.low ?? '—'} tone={data?.low ? 'warn' : undefined} />
    </div>
    <Section title="Messaging credits per client" hint={data?.note}>
      <Table rows={data?.rows || []} onRow={setSel} empty="No clients." cols={[
        { key: 'name', label: 'Client', render: (r) => <div><div style={{ color: K.text, fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: K.faint, fontFamily: MONO }}>{r.tenantId}</div></div> },
        { key: 'balance', label: 'Balance', render: (r) => <span style={{ fontFamily: MONO, color: r.low ? K.warn : K.text }}>{r.balance}</span> },
        { key: 'used30', label: 'Used (30 days)', render: (r) => r.used30 },
        { key: 'low', label: '', render: (r) => (r.low ? <Pill tone="warn">Low</Pill> : null) },
      ]} />
    </Section>
    {sel && <CreditModal r={sel} onClose={() => setSel(null)} onDone={() => { setSel(null); reload(); }} />}
  </>);
}
function CreditModal({ r, onClose, onDone }) {
  const ledger = useLoad(() => api('GET', `/credits/${r.tenantId}/ledger`)); const [f, setF] = useState({ delta: '', reason: '', lowAt: r.lowAt }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); setErr(''); try { await api('POST', `/credits/${r.tenantId}`, { delta: Number(f.delta), reason: f.reason, lowAt: Number(f.lowAt) }); onDone(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<Modal title={`Credits — ${r.name}`} onClose={onClose} width={520}><div style={{ display: 'grid', gap: 12 }}>
    <div style={{ fontSize: 13, color: K.mid }}>Balance: <span style={{ fontFamily: MONO, color: K.gold }}>{r.balance}</span></div>
    <Field label="Add or remove credits" hint="Use a minus sign to remove, for example -20"><input inputMode="numeric" value={f.delta} onChange={(e) => setF({ ...f, delta: e.target.value })} style={inputStyle} /></Field>
    <Field label="Reason"><input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} style={inputStyle} placeholder="Paid ₹500 pack" /></Field>
    <Field label="Warn when balance is at or below"><input inputMode="numeric" value={f.lowAt} onChange={(e) => setF({ ...f, lowAt: e.target.value })} style={inputStyle} /></Field>
    <ErrorLine text={err} /><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} disabled={!Number(f.delta)} onClick={save}>Save</Btn></div>
    {(ledger.data || []).length > 0 && <div style={{ display: 'grid', gap: 3, maxHeight: 140, overflow: 'auto' }}>{ledger.data.map((l) => <div key={l._id} style={{ fontSize: 11.5, color: K.mid }}>{fmtDT(l.createdAt)} · <span style={{ fontFamily: MONO, color: l.delta > 0 ? K.ok : K.warn }}>{l.delta > 0 ? '+' : ''}{l.delta}</span> → {l.balanceAfter} · {l.reason}</div>)}</div>}
  </div></Modal>);
}

export function MasterCompliance() {
  const [tab, setTab] = useState('requests');
  const tabs = [['requests', 'Guest data requests'], ['terms', 'Terms acceptance'], ['credits', 'Messaging credits']];
  const view = { requests: <Requests />, terms: <Terms />, credits: <Credits /> }[tab];
  return <Screen icon={ShieldCheck} title="Compliance" subtitle="Guest privacy requests, terms acceptance and messaging credits" tabs={tabs} tab={tab} onTab={setTab}>{view}</Screen>;
}
