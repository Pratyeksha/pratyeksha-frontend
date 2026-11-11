// Master Admin › Reports (80, 81, 82) and QR stands (84). Uses ONLY the Master Admin theme.
import React, { useState } from 'react';
import axios from 'axios';
import { FileBarChart, QrCode } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, MONO, errMsg, useLoad, inr, fmtDT, Btn, Pill, Tile, Section, Empty, Field, Modal, ErrorLine, Screen, Table, Bar, inputStyle } from './masterKit.jsx';

const ADM = `${API_BASE_URL}/admin/master`;
const api = (m, p, body, params) => axios({ url: `${ADM}${p}`, method: m, data: body, params }).then((r) => r.data);
const useNote = () => { const [m, setM] = useState(null); return [m, (t, bad) => { setM({ t, bad }); if (!bad) setTimeout(() => setM(null), 3500); }]; };
const Note = ({ m }) => (m ? <div role={m.bad ? 'alert' : 'status'} style={{ fontSize: 12.5, color: m.bad ? K.danger : K.ok, marginBottom: 8 }}>{m.t}</div> : null);
const istMonth = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);
const monthName = (k) => new Date(`${k}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const CAT = { domain: 'Domain', hosting: 'Hosting', email: 'E-mail', sms_whatsapp: 'SMS / WhatsApp', qr_stands: 'QR stands', payment_gateway: 'Payment gateway', software: 'Software', marketing: 'Marketing', other: 'Other' };

async function download(path, params, fallbackName) {
  const r = await axios.get(`${ADM}${path}`, { params, responseType: 'blob' });
  const cd = r.headers?.['content-disposition'] || ''; const name = /filename="([^"]+)"/.exec(cd)?.[1] || fallbackName;
  const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const delta = (a, b) => (b ? `${a >= b ? '▲' : '▼'} ${Math.abs(Math.round(((a - b) / b) * 100))}% vs last month` : 'no figure for last month');

function printReport(r) {
  const w = window.open('', '_blank'); if (!w) return false;
  const row = (a, b) => `<tr><td>${esc(a)}</td><td class="n">${esc(b)}</td></tr>`;
  const html = `<!doctype html><meta charset="utf-8"><title>Pratyeksha report ${esc(r.month)}</title><style>
  body{font:13px/1.5 system-ui,Segoe UI,Arial,sans-serif;color:#1c1c1c;max-width:760px;margin:28px auto;padding:0 18px}
  h1{font-size:22px;margin:0 0 2px}h2{font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:#8a704d;border-bottom:1px solid #d9cdb8;padding-bottom:4px;margin:22px 0 6px}
  table{width:100%;border-collapse:collapse}td{padding:5px 0;border-bottom:1px solid #eee}td.n{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}.sub{color:#777}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.t{border:1px solid #e3d9c6;border-radius:8px;padding:10px}.t b{display:block;font-size:19px}
  @media print{body{margin:0}}</style>
  <h1>Pratyeksha — monthly report</h1><div class="sub">${esc(monthName(r.month))} · generated ${esc(new Date(r.generatedAt).toLocaleString('en-IN'))}</div>
  <div class="grid" style="margin-top:14px"><div class="t">Collected<b>${esc(inr(r.revenue.collected))}</b><span class="sub">${esc(delta(r.revenue.collected, r.revenue.lastMonth))}</span></div><div class="t">Costs<b>${esc(inr(r.costs.total))}</b><span class="sub">${esc(delta(r.costs.total, r.costs.lastMonth))}</span></div><div class="t">Net<b>${esc(inr(r.net.thisMonth))}</b><span class="sub">last month ${esc(inr(r.net.lastMonth))}</span></div></div>
  <h2>Clients</h2><table>${row('Total clients', r.clients.total)}${row('New this month', r.clients.newThisMonth)}${row('New last month', r.clients.newLastMonth)}${row('Plans that ended this month', r.clients.endedThisMonth)}${row('Active now (incl. ending soon)', r.clients.now.active + r.clients.now.expiring)}${row('Expired now', r.clients.now.expired)}${row('Switched off now', r.clients.now.disabled)}</table>
  <h2>Money</h2><table>${row('Onboarding payments', inr(r.revenue.onboarding))}${row('Renewals', inr(r.revenue.renewals))}${row('Other', inr(r.revenue.other))}${r.costs.byCategory.map((c) => row(`Cost — ${CAT[c.category] || c.category}`, inr(c.amount))).join('')}</table>
  ${r.revenue.top.length ? `<h2>Top paying clients</h2><table>${r.revenue.top.map((c) => row(c.name, inr(c.amount))).join('')}</table>` : ''}
  <h2>Sales, support and usage</h2><table>${row('New leads', r.sales.leads)}${row('Demo requests', r.sales.demoRequests)}${row('Tickets opened', r.support.ticketsOpened)}${row('Tickets resolved', r.support.ticketsResolved)}${row('Incidents', r.support.incidents)}${row('Guest data requests', r.support.guestRequests)}${row('Orders on the platform', r.usage.orders)}</table>
  <p class="sub" style="margin-top:20px">Use your browser’s Print dialog and choose “Save as PDF”.</p><script>setTimeout(function(){window.print()},400)</script>`;
  w.document.open(); w.document.write(html); w.document.close(); return true;
}

function Monthly() {
  const [month, setMonth] = useState(istMonth()); const { data: r, error, loading } = useLoad(() => api('GET', '/reports/monthly', null, { month }), [month]); const [m, note] = useNote(); const [busy, setBusy] = useState(false);
  const csv = async () => { setBusy(true); try { await download('/reports/monthly.csv', { month }, `pratyeksha-report-${month}.csv`); } catch (e) { note(errMsg(e), true); } finally { setBusy(false); } };
  const print = () => { if (!printReport(r)) note('Your browser blocked the pop-up. Allow pop-ups for this site and try again.', true); };
  return (<>
    <Note m={m} /><ErrorLine text={error} />
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>
      <Field label="Month"><input type="month" value={month} max={istMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} style={{ ...inputStyle, width: 170 }} aria-label="Month" /></Field>
      <Btn busy={busy} disabled={!r} onClick={csv}>Download for Excel (CSV)</Btn>
      <Btn kind="primary" disabled={!r} onClick={print}>Print / Save as PDF</Btn>
    </div>
    {loading && !r && <Empty text="Building the report…" />}
    {r && (<>
      <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', marginBottom: 14 }}>
        <Tile label="Collected" value={inr(r.revenue.collected)} sub={delta(r.revenue.collected, r.revenue.lastMonth)} />
        <Tile label="Costs" value={inr(r.costs.total)} sub={delta(r.costs.total, r.costs.lastMonth)} />
        <Tile label="Net" value={inr(r.net.thisMonth)} sub={`last month ${inr(r.net.lastMonth)}`} tone={r.net.thisMonth < 0 ? 'warn' : undefined} />
        <Tile label="New clients" value={r.clients.newThisMonth} sub={`last month ${r.clients.newLastMonth}`} />
      </div>
      <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <Section title="Clients">
          {[['Total clients', r.clients.total], ['Plans that ended this month', r.clients.endedThisMonth], ['Active now (incl. ending soon)', r.clients.now.active + r.clients.now.expiring], ['Expired now', r.clients.now.expired], ['Switched off now', r.clients.now.disabled]].map(([a, b]) => <Line key={a} a={a} b={b} />)}
        </Section>
        <Section title="Money collected">
          {[['Onboarding', inr(r.revenue.onboarding)], ['Renewals', inr(r.revenue.renewals)], ['Other', inr(r.revenue.other)], ['Payments received', r.revenue.payments]].map(([a, b]) => <Line key={a} a={a} b={b} />)}
        </Section>
        <Section title="Costs by category">
          {r.costs.byCategory.length ? r.costs.byCategory.map((c) => <Line key={c.category} a={CAT[c.category] || c.category} b={inr(c.amount)} />) : <Empty text="No costs logged this month." />}
        </Section>
        <Section title="Top paying clients">
          {r.revenue.top.length ? r.revenue.top.map((c) => <Line key={c.tenantId} a={c.name} b={inr(c.amount)} />) : <Empty text="No payments this month." />}
        </Section>
        <Section title="Sales & support">
          {[['New leads', r.sales.leads], ['Demo requests', r.sales.demoRequests], ['Tickets opened', r.support.ticketsOpened], ['Tickets resolved', r.support.ticketsResolved], ['Incidents', r.support.incidents], ['Guest data requests', r.support.guestRequests]].map(([a, b]) => <Line key={a} a={a} b={b} />)}
        </Section>
        <Section title="Usage"><Line a="Orders on the platform" b={r.usage.orders} /></Section>
      </div>
    </>)}
  </>);
}
const Line = ({ a, b }) => <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: `1px solid ${K.border}`, fontSize: 13 }}><span style={{ color: K.mid }}>{a}</span><span style={{ color: K.text, fontFamily: MONO, fontWeight: 600 }}>{b}</span></div>;

/* ───── 82 retention ───── */
function Retention() {
  const { data, error } = useLoad(() => api('GET', '/reports/retention')); const [m, note] = useNote();
  const pct = (c) => (c.eligible ? Math.round((c.kept / c.eligible) * 100) : null);
  const Cell = ({ c }) => { const p = pct(c); return p == null ? <span style={{ color: K.faint }}>too early</span> : <div style={{ minWidth: 110 }}><span style={{ fontFamily: MONO, color: K.text }}>{p}%</span> <span style={{ fontSize: 11, color: K.faint }}>({c.kept}/{c.eligible})</span><Bar value={p} max={100} height={4} /></div>; };
  return (<>
    <Note m={m} /><ErrorLine text={error} />
    {data && (<div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', marginBottom: 14 }}>
      {[['3 months', 'm3'], ['6 months', 'm6'], ['12 months', 'm12']].map(([l, k]) => <Tile key={k} label={`Kept at ${l}`} value={pct(data.overall[k]) == null ? '—' : `${pct(data.overall[k])}%`} sub={`${data.overall[k].kept} of ${data.overall[k].eligible} clients`} />)}
    </div>)}
    <Section title="By joining month" hint={data?.note} right={<Btn small onClick={() => download('/reports/retention.csv', {}, 'pratyeksha-retention.csv').catch((e) => note(errMsg(e), true))}>Download CSV</Btn>}>
      <Table rows={data?.cohorts || []} empty="No clients yet." cols={[
        { key: 'month', label: 'Joined', render: (c) => monthName(c.month) },
        { key: 'joined', label: 'Clients' },
        { key: 'activeNow', label: 'Active now' },
        { key: 'm3', label: 'At 3 months', render: (c) => <Cell c={c.m3} /> },
        { key: 'm6', label: 'At 6 months', render: (c) => <Cell c={c.m6} /> },
        { key: 'm12', label: 'At 12 months', render: (c) => <Cell c={c.m12} /> },
      ]} />
    </Section>
  </>);
}

/* ───── 81 custom export ───── */
function Exports() {
  const ds = useLoad(() => api('GET', '/reports/datasets')); const [key, setKey] = useState('clients'); const [cols, setCols] = useState(null); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [m, note] = useNote(); const [busy, setBusy] = useState(false);
  const cur = (ds.data || []).find((d) => d.key === key); const chosen = cols || (cur ? cur.columns.map((c) => c.key) : []);
  const pick = (k) => { setKey(k); setCols(null); };
  const toggle = (c) => setCols(chosen.includes(c) ? chosen.filter((x) => x !== c) : [...chosen, c]);
  const go = async () => { setBusy(true); try { await download('/reports/export', { dataset: key, columns: chosen.join(','), from: from || undefined, to: to || undefined }, `pratyeksha-${key}.csv`); note('Downloaded.'); } catch (e) { note(e?.response?.data instanceof Blob ? 'Could not export. Try different dates.' : errMsg(e), true); } finally { setBusy(false); } };
  return (<>
    <Note m={m} /><ErrorLine text={ds.error} />
    <Section title="Build an export" hint="Pick what you need, the columns and the dates. You get a CSV that opens in Excel or Google Sheets.">
      <div style={{ display: 'grid', gap: 14, maxWidth: 680 }}>
        <Field label="What to export"><select value={key} onChange={(e) => pick(e.target.value)} style={inputStyle} aria-label="What to export">{(ds.data || []).map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</select></Field>
        {cur && <Field label="Columns"><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>{cur.columns.map((c) => <label key={c.key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: K.mid }}><input type="checkbox" checked={chosen.includes(c.key)} onChange={() => toggle(c.key)} /> {c.label}</label>)}</div></Field>}
        <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
          <Field label="From (optional)"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} aria-label="From date" /></Field>
          <Field label="To (optional)"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} aria-label="To date" /></Field>
        </div>
        <div><Btn kind="primary" busy={busy} disabled={!chosen.length} onClick={go}>Download CSV</Btn></div>
      </div>
    </Section>
  </>);
}

export default function MasterReports() {
  const [tab, setTab] = useState('monthly');
  const tabs = [['monthly', 'Monthly report'], ['retention', 'Retention'], ['export', 'Custom export']];
  const view = { monthly: <Monthly />, retention: <Retention />, export: <Exports /> }[tab];
  return <Screen icon={FileBarChart} title="Reports" subtitle="Monthly summary, client retention and exports" tabs={tabs} tab={tab} onTab={setTab}>{view}</Screen>;
}

/* ───── 84 QR stand inventory ───── */
export function MasterQrStock() {
  const { data, error, reload } = useLoad(() => api('GET', '/qr-stock')); const [form, setForm] = useState(null); const [m, note] = useNote();
  return (<Screen icon={QrCode} title="QR stands" subtitle="Stock of stands and cards, and what each client has" tabs={[['stock', 'Stock & movements']]} tab="stock" onTab={() => {}}>
    <Note m={m} /><ErrorLine text={error} />
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', marginBottom: 14 }}>
      {(data?.items || []).map((i) => <Tile key={i.item} label={i.item} value={i.inStock} sub="in stock" tone={i.inStock <= 5 ? 'warn' : undefined} />)}
      {data && !data.items.length && <Tile label="Nothing recorded" value="—" sub="Add your first purchase" />}
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      <Btn kind="primary" small onClick={() => setForm('purchase')}>Bought stock</Btn><Btn small onClick={() => setForm('issue')}>Give to a client</Btn><Btn small onClick={() => setForm('return')}>Returned</Btn><Btn small onClick={() => setForm('damaged')}>Damaged / lost</Btn><Btn small kind="quiet" onClick={() => setForm('adjust')}>Correct a count</Btn>
    </div>
    <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', alignItems: 'start' }}>
      <Section title="What each client has">
        <Table rows={data?.clients || []} empty="Nothing given out yet." cols={[{ key: 'name', label: 'Client', render: (c) => c.name || c.tenantId }, { key: 'items', label: 'Holding', render: (c) => c.items.map((i) => `${i.qty} × ${i.item}`).join(', ') }]} />
      </Section>
      <Section title="Recent movements">
        <Table rows={data?.moves || []} empty="No movements yet." cols={[
          { key: 'createdAt', label: 'When', render: (x) => fmtDT(x.createdAt) },
          { key: 'kind', label: 'What', render: (x) => <div><div style={{ color: K.text }}>{data.kinds[x.kind]}{x.tenantName ? ` · ${x.tenantName}` : ''}</div><div style={{ fontSize: 11, color: K.faint }}>{x.item}{x.note ? ` — ${x.note}` : ''}</div></div> },
          { key: 'qty', label: 'Qty', right: true, render: (x) => <span style={{ fontFamily: MONO, color: x.qty > 0 ? K.ok : K.warn }}>{x.qty > 0 ? '+' : ''}{x.qty}</span> },
        ]} />
      </Section>
    </div>
    {form && <StockModal kind={form} data={data} onClose={() => setForm(null)} onDone={(t) => { setForm(null); note(t); reload(); }} />}
  </Screen>);
}
function StockModal({ kind, data, onClose, onDone }) {
  const clients = useLoad(() => api('GET', '/tenants')); const TITLE = { purchase: 'Bought stock', issue: 'Give to a client', return: 'Returned by a client', damaged: 'Damaged or lost', adjust: 'Correct a count' };
  const [f, setF] = useState({ item: data?.items?.[0]?.item || data?.suggested?.[0] || '', qty: '', tenantId: '', unitCost: '', vendor: '', note: '', alsoExpense: true }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const names = [...new Set([...(data?.items || []).map((i) => i.item), ...(data?.suggested || [])])];
  const save = async () => { setBusy(true); setErr(''); try { const r = await api('POST', '/qr-stock', { kind, ...f, qty: Number(f.qty), unitCost: Number(f.unitCost) || 0 }); onDone(`Saved. ${f.item}: ${r.inStock} in stock.`); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  return (<Modal title={TITLE[kind]} onClose={onClose}><div style={{ display: 'grid', gap: 12 }}>
    <Field label="Item"><input list="qr-items" value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })} style={inputStyle} aria-label="Item" /><datalist id="qr-items">{names.map((n) => <option key={n} value={n} />)}</datalist></Field>
    <Field label={kind === 'adjust' ? 'Change (use − to remove)' : 'Quantity'}><input inputMode="numeric" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} style={inputStyle} aria-label="Quantity" /></Field>
    {(kind === 'issue' || kind === 'return') && <Field label="Client"><select value={f.tenantId} onChange={(e) => setF({ ...f, tenantId: e.target.value })} style={inputStyle} aria-label="Client"><option value="">Choose…</option>{(clients.data || []).map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Field>}
    {kind === 'purchase' && (<>
      <div className="k-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Field label="Cost per piece (₹)"><input inputMode="decimal" value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: e.target.value })} style={inputStyle} aria-label="Cost per piece" /></Field>
        <Field label="Vendor"><input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} style={inputStyle} /></Field>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: K.mid }}><input type="checkbox" checked={f.alsoExpense} onChange={(e) => setF({ ...f, alsoExpense: e.target.checked })} /> Also add to Operating Costs (QR stands)</label>
    </>)}
    <Field label="Note (optional)"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} style={inputStyle} /></Field>
    <ErrorLine text={err} /><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} disabled={!f.item.trim() || !Number(f.qty)} onClick={save}>Save</Btn></div>
  </div></Modal>);
}
