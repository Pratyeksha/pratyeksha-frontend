/**
 * Master Admin → Influencers.
 * A simple payout list (name, contact, amount). The total is counted as MARKETING COST in Operating Costs and in the Finance P&L.
 */
import React, { useState } from 'react';
import { Megaphone, Users, Wallet, CalendarClock, Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import { COPPER, MONO, ghost, primaryBtn, dangerBtn, field, api, errMsg, useLoad, inr, fmtDate, istToday, PageHeader, Tile, Section, Label, DataTable, ErrorBox, Loading, useToast, Pill } from './masterUi.jsx';

const blank = () => ({ name: '', contact: '', amount: '', paidOn: istToday(), note: '' });

export default function MasterInfluencers() {
  const r = useLoad('influencers'); const [form, setForm] = useState(blank()); const [editing, setEditing] = useState(null); const [busy, setBusy] = useState(false); const [toast, toastNode] = useToast();
  const reset = () => { setForm(blank()); setEditing(null); };
  const save = async () => {
    setBusy(true);
    try {
      const body = { ...form, amount: Number(form.amount) };
      if (editing) { await api.put(`influencers/${editing}`, body); toast('Influencer updated'); } else { await api.post('influencers', body); toast(`${form.name.trim()} added`); }
      reset(); r.reload();
    } catch (e) { toast(errMsg(e), 'err'); } finally { setBusy(false); }
  };
  const edit = (x) => { setEditing(x._id); setForm({ name: x.name, contact: x.contact || '', amount: String(x.amount), paidOn: new Date(new Date(x.paidOn).getTime() + 330 * 60000).toISOString().slice(0, 10), note: x.note || '' }); window.scrollTo?.({ top: 0 }); document.getElementById('influencer-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const remove = async (x) => { if (!window.confirm(`Remove ${x.name}? Their ${inr(x.amount)} will no longer count as marketing cost.`)) return; try { await api.del(`influencers/${x._id}`); toast('Removed'); if (editing === x._id) reset(); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } };
  return (
    <div className="p-scroll no-sb" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '26px clamp(14px,2.4vw,34px) 56px', textAlign: 'left', color: '#f1ede4' }}>
      <PageHeader icon={Megaphone} eyebrow="Marketing" title="Influencers" subtitle="Who you have paid to promote Pratyeksha. The total counts as marketing cost." />
      <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
        {r.data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
            <Tile icon={Users} label="Influencers" value={r.data.totals.count} />
            <Tile icon={Wallet} label="Total paid" value={inr(r.data.totals.totalPaid)} sub={`Counted as ${r.data.totals.countedAs.toLowerCase()}`} />
            <Tile icon={CalendarClock} label="Paid this month" value={inr(r.data.totals.thisMonth)} />
          </div>
        )}
        <div id="influencer-form"><Section title={editing ? 'Edit influencer' : 'Add an influencer'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            <Label>Name<input aria-label="Influencer name" style={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Label>
            <Label>Contact number<input aria-label="Influencer contact" inputMode="tel" style={field} placeholder="10-digit mobile" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Label>
            <Label>Amount paid (₹)<input aria-label="Influencer amount" type="number" min="0" step="0.01" style={field} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Label>
            <Label>Paid on<input aria-label="Paid on" type="date" style={field} value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} /></Label>
          </div>
          <div style={{ marginTop: 12 }}><Label>Note (optional)<input aria-label="Influencer note" style={field} placeholder="e.g. Instagram reel, Kolhapur food page" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Label></div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={primaryBtn} disabled={busy} onClick={save}>{editing ? <Save size={13} /> : <Plus size={13} />} {busy ? 'Saving…' : editing ? 'Save changes' : 'Add influencer'}</button>
            {editing && <button type="button" style={ghost} onClick={reset}><X size={13} /> Cancel</button>}
          </div>
        </Section></div>
        <Section title="Influencer list">
          {r.error && !r.data ? <ErrorBox message={r.error} onRetry={r.reload} /> : !r.data ? <Loading /> : (
            <DataTable rowKey={(x) => x._id} empty="No influencers yet. Add the first one above." rows={r.data.rows} cols={[
              { key: 'name', label: 'Name', render: (x) => <div><b>{x.name}</b>{x.note && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{x.note}</div>}</div> },
              { key: 'contact', label: 'Contact', render: (x) => x.contact ? <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{x.contact}</span> : <span style={{ color: 'rgba(255,255,255,0.35)' }}>—</span> },
              { key: 'paidOn', label: 'Paid on', render: (x) => fmtDate(x.paidOn) },
              { key: 'amount', label: 'Amount', align: 'right', render: (x) => <b style={{ fontFamily: MONO }}>{inr(x.amount)}</b> },
              { key: 'cost', label: '', render: () => <Pill color={COPPER}>Marketing</Pill> },
              { key: 'a', label: '', align: 'right', render: (x) => <span style={{ display: 'inline-flex', gap: 6 }}><button type="button" style={ghost} onClick={() => edit(x)} aria-label={`Edit ${x.name}`}><Pencil size={13} /></button><button type="button" style={dangerBtn} onClick={() => remove(x)} aria-label={`Remove ${x.name}`}><Trash2 size={13} /></button></span> }
            ]} />
          )}
        </Section>
      </div>
      {toastNode}
    </div>
  );
}
