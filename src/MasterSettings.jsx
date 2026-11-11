// Master Admin › Settings: company profile (85), document templates (86) and platform defaults (87).
// Uses ONLY the Master Admin theme.
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings2 } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, growthApi, errMsg, useLoad, Btn, Section, Empty, Field, ErrorLine, Screen, inputStyle } from './masterKit.jsx';

const TABS = [['company', 'Company profile'], ['templates', 'Document templates'], ['defaults', 'Platform defaults']];
const ADM = `${API_BASE_URL}/admin/master`;

function useSaved() { const [m, setM] = useState(null); const show = (t, bad) => { setM({ t, bad }); if (!bad) setTimeout(() => setM(null), 2500); }; return [m, show]; }
const Note = ({ m }) => (m ? <div role={m.bad ? 'alert' : 'status'} style={{ fontSize: 12.5, color: m.bad ? K.danger : K.ok }}>{m.t}</div> : null);

/* ───── 85 company profile ───── */
function Company() {
  const { data, error } = useLoad(() => axios.get(`${ADM}/finance/company`).then((r) => r.data));
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false); const [m, show] = useSaved();
  useEffect(() => { if (data && !f) setF({ ...data }); }, [data, f]);
  if (!f) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { setBusy(true); try { const r = await axios.put(`${ADM}/finance/company`, f); setF({ ...r.data }); show('Company profile saved. New invoices and documents use it.'); } catch (e) { show(errMsg(e), true); } finally { setBusy(false); } };
  const T = (k, label, extra = {}) => <Field label={label} {...extra}><input value={f[k] ?? ''} onChange={set(k)} style={inputStyle} /></Field>;
  return (<>
    <Note m={m} />
    <Section title="Your business details" hint="Printed on invoices, agreements and welcome notes.">
      <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
        {T('name', 'Business name')}{T('gstin', 'GSTIN', { hint: '15 characters, or leave blank' })}{T('phone', 'Phone')}{T('email', 'Email')}{T('state', 'State')}
        <Field label="Address"><textarea value={f.address ?? ''} onChange={set('address')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      </div>
    </Section>
    <Section title="Bank & UPI for payments" hint="Shown on invoices so clients know where to pay.">
      <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>{T('bankName', 'Bank name')}{T('accountNo', 'Account number')}{T('ifsc', 'IFSC')}{T('upi', 'UPI ID')}</div>
    </Section>
    <div><Btn kind="primary" busy={busy} onClick={save}>Save company profile</Btn></div>
  </>);
}

/* ───── 86 document templates ───── */
const TPL_LABELS = {
  welcomeHeadline: ['Welcome note — headline (put *stars* around the part to show in italics)', 1], welcomeClosingTitle: ['Welcome note — closing title', 1], welcomeClosingText: ['Welcome note — closing paragraph', 3],
  invoiceDefaultNote: ['Invoice — default note', 2], agreementPurpose: ['Agreement — Purpose', 4], agreementFees: ['Agreement — Fees & payment', 4], agreementTermination: ['Agreement — Changes, delivery & termination', 4],
};
function Templates() {
  const { data, error, reload } = useLoad(() => axios.get(`${ADM}/control/doc-templates`).then((r) => r.data));
  const [v, setV] = useState(null); const [busy, setBusy] = useState(false); const [m, show] = useSaved();
  useEffect(() => { if (data && !v) setV({ ...data.templates }); }, [data, v]);
  if (!v) return error ? <ErrorLine text={error} /> : <Empty text="Loading…" />;
  const save = async (next) => {
    setBusy(true);
    try { const r = await axios.put(`${ADM}/control/doc-templates`, { templates: next || v }); setV({ ...r.data.templates }); show('Saved. Open Documents to see the new wording.'); reload(); }
    catch (e) { show(errMsg(e), true); } finally { setBusy(false); }
  };
  const reset = (k) => { const next = { ...v, [k]: data.defaults[k] }; setV(next); save({ [k]: data.defaults[k] }); };
  return (<>
    <Note m={m} />
    <div style={{ fontSize: 11.5, color: K.faint, maxWidth: 640 }}>Edit the standard wording used in the Welcome note, Invoice and Agreement. Write <span style={{ fontFamily: 'monospace', color: K.gold }}>{'{client}'}</span> where the client’s name should appear. Prices, dates and scope come from the document form, not from here.</div>
    {Object.entries(TPL_LABELS).map(([k, [label, rows]]) => (
      <Section key={k} title={label} right={v[k] !== data.defaults[k] ? <Btn small kind="quiet" onClick={() => reset(k)}>Reset to standard</Btn> : null}>
        {rows === 1 ? <input value={v[k]} maxLength={1500} onChange={(e) => setV({ ...v, [k]: e.target.value })} style={inputStyle} aria-label={label} />
          : <textarea value={v[k]} maxLength={1500} rows={rows} onChange={(e) => setV({ ...v, [k]: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} aria-label={label} />}
        <div style={{ fontSize: 10.5, color: K.faint, marginTop: 4, textAlign: 'right' }}>{v[k].length}/1500</div>
      </Section>))}
    <div><Btn kind="primary" busy={busy} onClick={() => save()}>Save wording</Btn></div>
  </>);
}

/* ───── 87 platform defaults ───── */
function Defaults() {
  const s = useLoad(() => growthApi('/settings').then((r) => r.data));
  const p = useLoad(() => growthApi('/plans').then((r) => r.data));
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false); const [m, show] = useSaved();
  useEffect(() => { if (s.data && !f) setF({ defaultPlanId: s.data.defaultPlanId || '', trialDays: s.data.trialDays, graceDays: s.data.graceDays, gstRate: s.data.gstRate, paymentTermsDays: s.data.paymentTermsDays, renewalReminderDays: s.data.renewalReminderDays, requireListingApproval: !!s.data.requireListingApproval }); }, [s.data, f]);
  if (!f) return s.error ? <ErrorLine text={s.error} /> : <Empty text="Loading…" />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    try {
      const body = { ...f }; ['trialDays', 'graceDays', 'gstRate', 'paymentTermsDays', 'renewalReminderDays'].forEach((k) => { body[k] = Number(body[k]); });
      await growthApi('/settings', { method: 'PUT', body });
      // Keep invoices in step with the GST rate.
      try { const c = (await axios.get(`${ADM}/finance/company`)).data; if (Number(c.defaultTaxPct) !== body.gstRate && body.gstRate <= 28) await axios.put(`${ADM}/finance/company`, { ...c, defaultTaxPct: body.gstRate }); } catch { /* invoice default is optional */ }
      s.reload(); show('Defaults saved.');
    } catch (e) { show(errMsg(e), true); } finally { setBusy(false); }
  };
  const N = (k, label, hint, max) => <Field label={label} hint={hint}><input type="number" min="0" max={max} value={f[k]} onChange={set(k)} style={inputStyle} /></Field>;
  return (<>
    <Note m={m} />
    <Section title="New clients & billing" hint="Starting values — you can still change them per client.">
      <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <Field label="Default plan" hint="Used for new clients with no plan chosen"><select value={f.defaultPlanId} onChange={set('defaultPlanId')} style={inputStyle}><option value="">None</option>{(p.data?.plans || []).filter((x) => x.active).map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}</select></Field>
        {N('trialDays', 'Free trial length (days)', '1 to 90', 90)}{N('graceDays', 'Grace after trial (days)', '0 to 30', 30)}
        {N('gstRate', 'GST rate (%)', 'Also sets the invoice default', 28)}{N('paymentTermsDays', 'Payment terms (days)', 'Invoice due date', 120)}{N('renewalReminderDays', 'Renewal reminder (days before)', 'Shown in Client Success', 120)}
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: K.mid, marginTop: 14 }}><input type="checkbox" checked={!!f.requireListingApproval} onChange={(e) => setF({ ...f, requireListingApproval: e.target.checked })} />Approve new listings first — new outlets stay out of the guest directory until you approve them (Discovery › Listing approval)</label>
    </Section>
    <div><Btn kind="primary" busy={busy} onClick={save}>Save defaults</Btn></div>
  </>);
}

export default function MasterSettings() {
  const [tab, setTab] = useState('company');
  const view = { company: <Company />, templates: <Templates />, defaults: <Defaults /> }[tab];
  return <Screen icon={Settings2} title="Settings" subtitle="Company profile, document wording and platform defaults" tabs={TABS} tab={tab} onTab={setTab}>{view}</Screen>;
}
