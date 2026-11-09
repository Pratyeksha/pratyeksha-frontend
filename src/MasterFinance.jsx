/**
 * Master Admin → Finance. One screen, thirteen tabs, same look as the Tracking tab.
 * Every figure comes from /api/admin/master/finance/* (see master-finance-module.js); nothing is computed twice on the client.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  Wallet, TrendingUp, Receipt, FileText, Landmark, Percent, Ticket, Undo2, Scale, BookOpen, Settings, Download, Plus, Trash2,
  MessageCircle, Gauge, CalendarClock, Building2, CircleDollarSign, Printer, Ban, CheckCircle2, FilePlus2
} from 'lucide-react';
import {
  GOLD, COPPER, GREEN, TAUPE, LINE, MONO, CARD, ghost, primaryBtn, dangerBtn, field, api, errMsg, useLoad, inr, inr2, fmtDate, istToday, istMonth,
  monthLabel, waLink, downloadXlsx, receiptPdf, invoicePdf, PageHeader, Tile, Section, GBar, Pill, Empty, ErrorBox, Loading, Label, DataTable, useToast, Dialog, TabRow
} from './masterUi.jsx';

const TABS = [
  ['overview', 'Overview', Gauge], ['pnl', 'Profit & loss', TrendingUp], ['ledger', 'Payments', Receipt], ['dues', 'Dues', CalendarClock],
  ['invoices', 'Invoices', FileText], ['gst', 'GST', Percent], ['costs', 'Costs & vendors', Landmark], ['forecast', 'Forecast', CircleDollarSign],
  ['coupons', 'Coupons', Ticket], ['refunds', 'Refunds', Undo2], ['profit', 'Per client', Scale], ['cash', 'Cash book', BookOpen], ['company', 'Company', Settings]
];
const grid = (min = 200) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 12 });
const two = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 };

/** Wraps a loaded resource: loading / error / content. */
const Async = ({ r, children }) => (r.data ? children(r.data) : r.error ? <ErrorBox message={r.error} onRetry={r.reload} /> : <Loading />);
const useClients = () => useLoad('tenants');

export default function MasterFinance({ initialTab = 'overview', onOpenExpenses }) {
  const [tab, setTab] = useState(initialTab);
  const [prefillRefund, setPrefillRefund] = useState(null);
  const [toast, toastNode] = useToast();
  const openRefund = (row) => { setPrefillRefund(row); setTab('refunds'); };
  return (
    <div className="p-scroll no-sb" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '26px clamp(14px,2.4vw,34px) 56px', textAlign: 'left', color: '#f1ede4' }}>
      <PageHeader icon={Wallet} eyebrow="Money" title="Finance" subtitle="Revenue, collections, invoices, GST, refunds and cash: every rupee in one place" />
      <div style={{ margin: '16px 0 18px', overflowX: 'auto', paddingBottom: 4 }}><TabRow tabs={TABS} value={tab} onChange={setTab} /></div>
      {tab === 'overview' && <Overview />}
      {tab === 'pnl' && <PnL />}
      {tab === 'ledger' && <Ledger toast={toast} onRefund={openRefund} />}
      {tab === 'dues' && <Dues />}
      {tab === 'invoices' && <Invoices toast={toast} />}
      {tab === 'gst' && <Gst toast={toast} />}
      {tab === 'costs' && <Costs onOpenExpenses={onOpenExpenses} />}
      {tab === 'forecast' && <Forecast />}
      {tab === 'coupons' && <Coupons toast={toast} />}
      {tab === 'refunds' && <Refunds toast={toast} prefill={prefillRefund} clearPrefill={() => setPrefillRefund(null)} />}
      {tab === 'profit' && <Profitability toast={toast} />}
      {tab === 'cash' && <CashBook toast={toast} />}
      {tab === 'company' && <Company toast={toast} />}
      {toastNode}
    </div>
  );
}

// ═══ 1. Overview ═══
function Overview() {
  const r = useLoad('finance/overview'); const rem = useLoad('finance/recurring-reminders', { days: 14 }); const dues = useLoad('finance/dues');
  return (
    <Async r={r}>{(d) => {
      const maxMrr = Math.max(...d.trend.map((t) => Math.max(t.newMrr, t.churnedMrr)), 1);
      return (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={grid(190)}>
            <Tile icon={Wallet} label="MRR" value={inr(d.mrr)} sub="Monthly recurring revenue" />
            <Tile icon={TrendingUp} label="ARR" value={inr(d.arr)} sub="MRR × 12" />
            <Tile icon={Building2} label="Active clients" value={d.counts.active + d.counts.expiring} sub={`${d.counts.expiring} expiring in 30 days`} />
            <Tile icon={Ban} label="Expired" value={d.counts.expired} sub={`${d.counts.disabled} switched off`} tone={COPPER} />
            <Tile icon={Receipt} label="Collected this month" value={inr(d.collectedThisMonth)} sub={`Last month ${inr(d.collectedLastMonth)}`} />
          </div>
          {(dues.data?.totals.overdueCount > 0 || rem.data?.dueSoonCount > 0) && (
            <div style={{ ...CARD, padding: '12px 16px', borderColor: 'rgba(226,154,88,0.4)', display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5 }}>
              {dues.data?.totals.overdueCount > 0 && <span><b style={{ color: COPPER }}>{dues.data.totals.overdueCount}</b> client{dues.data.totals.overdueCount > 1 ? 's' : ''} overdue, {inr(dues.data.totals.overdue)} to collect</span>}
              {rem.data?.dueSoonCount > 0 && <span><b style={{ color: COPPER }}>{rem.data.dueSoonCount}</b> recurring cost{rem.data.dueSoonCount > 1 ? 's' : ''} due within 14 days</span>}
            </div>
          )}
          <Section title="New vs churned MRR" hint="Last six months">
            <div style={{ display: 'grid', gap: 12 }}>
              {d.trend.map((t) => (
                <div key={t.month} style={{ display: 'grid', gridTemplateColumns: '84px 1fr 1fr 96px', gap: 12, alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{monthLabel(t.month)}</span>
                  <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: 'rgba(255,255,255,0.45)' }}>New</span><span style={{ fontFamily: MONO, color: GOLD }}>{inr(t.newMrr)}</span></div><GBar value={t.newMrr} max={maxMrr} /></div>
                  <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: 'rgba(255,255,255,0.45)' }}>Churned</span><span style={{ fontFamily: MONO, color: COPPER }}>{inr(t.churnedMrr)}</span></div><GBar value={t.churnedMrr} max={maxMrr} color={COPPER} /></div>
                  <span style={{ fontFamily: MONO, textAlign: 'right', color: t.netMrr >= 0 ? GREEN : COPPER }}>{t.netMrr >= 0 ? '+' : '−'}{inr(Math.abs(t.netMrr))}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              <div><b>MRR:</b> {d.definitions.mrr}</div><div><b>New:</b> {d.definitions.newMrr}</div><div><b>Churned:</b> {d.definitions.churnedMrr}</div>
            </div>
          </Section>
        </div>
      );
    }}</Async>
  );
}

// ═══ 2. Profit & loss ═══
function PnL() {
  const [months, setMonths] = useState(12); const r = useLoad('finance/pnl', { months });
  return (
    <Async r={r}>{(d) => (
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={grid(180)}>
          <Tile icon={Wallet} label="Revenue" value={inr(d.totals.revenue)} />
          <Tile icon={Undo2} label="Refunds" value={inr(d.totals.refunds)} tone={COPPER} />
          <Tile icon={Landmark} label="Total costs" value={inr(d.totals.totalCosts)} sub={`Operating ${inr(d.totals.operatingCosts)} · Influencers ${inr(d.totals.influencerCosts)}`} tone={COPPER} />
          <Tile icon={TrendingUp} label="Net profit" value={inr(d.totals.net)} tone={d.totals.net >= 0 ? GREEN : COPPER} />
          <Tile icon={CalendarClock} label="Monthly run-rate" value={inr(d.monthlyRunRate)} sub={`${d.recurringCount} recurring cost${d.recurringCount === 1 ? '' : 's'}`} />
        </div>
        <Section title="Month by month" right={<select aria-label="Months" value={months} onChange={(e) => setMonths(Number(e.target.value))} style={{ ...field, width: 'auto' }}>{[3, 6, 12, 24].map((m) => <option key={m} value={m}>Last {m} months</option>)}</select>}>
          <DataTable rowKey={(m) => m.month} rows={[...d.months].reverse()} cols={[
            { key: 'month', label: 'Month', render: (m) => monthLabel(m.month) },
            { key: 'revenue', label: 'Revenue', align: 'right', render: (m) => <span style={{ fontFamily: MONO }}>{inr(m.revenue)}</span> },
            { key: 'refunds', label: 'Refunds', align: 'right', render: (m) => <span style={{ fontFamily: MONO, color: m.refunds ? COPPER : undefined }}>{inr(m.refunds)}</span> },
            { key: 'operatingCosts', label: 'Operating', align: 'right', render: (m) => <span style={{ fontFamily: MONO }}>{inr(m.operatingCosts)}</span> },
            { key: 'influencerCosts', label: 'Influencers', align: 'right', render: (m) => <span style={{ fontFamily: MONO }}>{inr(m.influencerCosts)}</span> },
            { key: 'net', label: 'Net', align: 'right', render: (m) => <b style={{ fontFamily: MONO, color: m.net >= 0 ? GREEN : COPPER }}>{m.net < 0 ? '−' : ''}{inr(Math.abs(m.net))}</b> }
          ]} />
        </Section>
      </div>
    )}</Async>
  );
}

// ═══ 3. Payment ledger + receipts ═══
function Ledger({ toast, onRefund }) {
  const [f, setF] = useState({ from: '', to: '', method: '', q: '' }); const r = useLoad('finance/ledger', f);
  const receipt = async (row) => { try { receiptPdf(await api.get('finance/receipt', { key: row.paymentKey })); } catch (e) { toast(errMsg(e), 'err'); } };
  const exportIt = (d) => downloadXlsx(`payments-${istToday()}.xlsx`, { Payments: d.rows.map((x) => ({ Date: fmtDate(x.paidAt), Receipt: x.receiptNo, Client: x.clientName, Mode: x.method, Months: x.months, Amount: x.amount, Refunded: x.refunded, Net: x.net, Note: x.note })) });
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Section title="Filter">
        <div style={{ ...two, alignItems: 'end' }}>
          <Label>From<input aria-label="From date" type="date" style={field} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Label>
          <Label>To<input aria-label="To date" type="date" style={field} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Label>
          <Label>Mode<select aria-label="Mode" style={field} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}><option value="">All</option>{['UPI', 'Cash', 'Bank', 'Cheque', 'Card'].map((m) => <option key={m}>{m}</option>)}</select></Label>
          <Label>Search<input aria-label="Search payments" style={field} placeholder="Client, receipt, note…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></Label>
        </div>
      </Section>
      <Async r={r}>{(d) => (
        <>
          <div style={grid(180)}>
            <Tile icon={Receipt} label="Payments" value={d.totals.count} /><Tile icon={Wallet} label="Collected" value={inr(d.totals.amount)} />
            <Tile icon={Undo2} label="Refunded" value={inr(d.totals.refunded)} tone={COPPER} /><Tile icon={TrendingUp} label="Net" value={inr(d.totals.net)} />
          </div>
          <Section title="Subscription payments" hint={Object.entries(d.byMethod).map(([k, v]) => `${k} ${inr(v)}`).join('  ·  ') || undefined} right={<button type="button" style={ghost} onClick={() => exportIt(d)}><Download size={13} /> Excel</button>}>
            <DataTable rowKey={(x) => x.paymentKey} empty="No payments match these filters." rows={d.rows} cols={[
              { key: 'paidAt', label: 'Date', render: (x) => fmtDate(x.paidAt) },
              { key: 'receiptNo', label: 'Receipt', render: (x) => <span style={{ fontFamily: MONO, fontSize: 11 }}>{x.receiptNo}</span> },
              { key: 'clientName', label: 'Client' },
              { key: 'method', label: 'Mode', render: (x) => x.method || '—' },
              { key: 'months', label: 'Months', align: 'right', render: (x) => x.months || '—' },
              { key: 'amount', label: 'Amount', align: 'right', render: (x) => <b style={{ fontFamily: MONO }}>{inr(x.amount)}</b> },
              { key: 'refunded', label: 'Refunded', align: 'right', render: (x) => x.refunded ? <Pill color={COPPER}>−{inr(x.refunded)}</Pill> : '—' },
              { key: 'a', label: '', align: 'right', render: (x) => <span style={{ display: 'inline-flex', gap: 6 }}><button type="button" style={ghost} onClick={() => receipt(x)} aria-label={`Receipt for ${x.clientName}`}><Printer size={13} /> Receipt</button><button type="button" style={ghost} onClick={() => onRefund(x)} aria-label={`Refund ${x.clientName}`}><Undo2 size={13} /></button></span> }
            ]} />
          </Section>
        </>
      )}</Async>
    </div>
  );
}

// ═══ 4. Collections & dues ═══
function Dues() {
  const r = useLoad('finance/dues');
  const text = (row, company) => {
    const who = row.ownerName || row.clientName;
    const when = row.bucket === 'overdue' ? `expired ${row.daysOverdue} day${row.daysOverdue > 1 ? 's' : ''} ago (on ${fmtDate(row.planExpiry)})` : `expires on ${fmtDate(row.planExpiry)}`;
    return `Hi ${who}, this is ${company || 'Pratyeksha'}. Your Pratyeksha subscription for ${row.clientName} ${when}.${row.amountKnown ? ` The renewal amount is ${inr(row.expectedAmount)}.` : ''} Please renew so your restaurant keeps running without interruption. Thank you!`;
  };
  const tone = { overdue: COPPER, due_soon: GOLD, upcoming: TAUPE }; const label = { overdue: 'Overdue', due_soon: 'Due in 7 days', upcoming: 'Due in 30 days' };
  return (
    <Async r={r}>{(d) => (
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={grid(190)}>
          <Tile icon={Ban} label="Overdue" value={inr(d.totals.overdue)} sub={`${d.totals.overdueCount} client${d.totals.overdueCount === 1 ? '' : 's'}`} tone={COPPER} />
          <Tile icon={CalendarClock} label="Due within 7 days" value={inr(d.totals.dueSoon)} />
          <Tile icon={CalendarClock} label="Due within 30 days" value={inr(d.totals.upcoming)} sub="After the next 7 days" />
        </div>
        <Section title="Pending and overdue renewals" hint="Amount = the client's last payment. Tap the button to open WhatsApp with the reminder ready to send.">
          <DataTable rowKey={(x) => x.tenantId} empty="Nobody owes a renewal right now." rows={d.rows} cols={[
            { key: 'clientName', label: 'Client', render: (x) => <div><b>{x.clientName}</b><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{x.contact || 'No phone on file'}</div></div> },
            { key: 'bucket', label: 'Status', render: (x) => <Pill color={tone[x.bucket]}>{label[x.bucket]}</Pill> },
            { key: 'planExpiry', label: 'Plan end', render: (x) => <div>{fmtDate(x.planExpiry)}<div style={{ fontSize: 11, color: x.bucket === 'overdue' ? COPPER : 'rgba(255,255,255,0.45)' }}>{x.bucket === 'overdue' ? `${x.daysOverdue}d overdue` : `${x.daysLeft}d left`}</div></div> },
            { key: 'expectedAmount', label: 'Expected', align: 'right', render: (x) => x.amountKnown ? <b style={{ fontFamily: MONO }}>{inr(x.expectedAmount)}</b> : <span style={{ color: 'rgba(255,255,255,0.4)' }}>No past payment</span> },
            { key: 'a', label: '', align: 'right', render: (x) => { const link = waLink(x.contact, text(x, d.companyName)); return link ? <a href={link} target="_blank" rel="noopener noreferrer" style={{ ...primaryBtn, textDecoration: 'none' }}><MessageCircle size={13} /> Remind</a> : <button type="button" disabled style={{ ...ghost, opacity: 0.45, cursor: 'not-allowed' }} title="No valid phone number for this client">Remind</button>; } }
          ]} />
        </Section>
      </div>
    )}</Async>
  );
}

// ═══ 5. Invoices & credit notes ═══
const blankInvoice = () => ({ tenantId: '', clientName: '', clientGstin: '', clientAddress: '', placeOfSupply: '', date: istToday(), dueDate: '', taxPct: '', interState: false, notes: '', lines: [{ description: 'Pratyeksha subscription', qty: 1, rate: '' }] });
function Invoices({ toast }) {
  const [filters, setFilters] = useState({ kind: '', status: '', q: '' }); const r = useLoad('finance/invoices', filters); const company = useLoad('finance/company'); const clients = useClients();
  const [form, setForm] = useState(null); const [saving, setSaving] = useState(false); const [credit, setCredit] = useState(null);
  const taxPct = form?.taxPct === '' || form?.taxPct === undefined ? Number(company.data?.defaultTaxPct ?? 18) : Number(form.taxPct);
  const preview = useMemo(() => {
    if (!form) return null; const taxable = form.lines.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0); const tax = Math.round(taxable * taxPct) / 100;
    return { taxable, tax, total: taxable + tax };
  }, [form, taxPct]);
  const pick = (id) => { const t = clients.data?.find((c) => c.tenantId === id); setForm((f) => ({ ...f, tenantId: id, clientName: t ? t.name : f.clientName, clientGstin: t?.gstin || f.clientGstin, clientAddress: t ? [t.address?.street, t.address?.area, t.address?.city, t.address?.state, t.address?.pincode].filter(Boolean).join(', ') : f.clientAddress, placeOfSupply: t?.address?.state || f.placeOfSupply })); };
  const setLine = (i, k, v) => setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));
  const save = async () => {
    setSaving(true);
    try { const inv = await api.post('finance/invoices', { ...form, taxPct: form.taxPct === '' ? undefined : Number(form.taxPct), lines: form.lines.map((l) => ({ ...l, qty: Number(l.qty), rate: Number(l.rate) })) }); toast(`Invoice ${inv.number} created`); setForm(null); r.reload(); }
    catch (e) { toast(errMsg(e), 'err'); } finally { setSaving(false); }
  };
  const setStatus = async (inv, status) => { try { await api.patch(`finance/invoices/${inv._id}/status`, { status }); toast(`${inv.number} marked ${status}`); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } };
  const pdf = (inv) => { if (!company.data) { toast('Company details are still loading. Try again in a moment.', 'err'); return; } invoicePdf(inv, company.data); };
  const stTone = { issued: GOLD, paid: GREEN, void: TAUPE };
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Section title="Invoices and credit notes" hint="Numbers run automatically (PX/26-27/0001) and restart each April." right={<button type="button" style={primaryBtn} onClick={() => setForm(blankInvoice())}><FilePlus2 size={13} /> New invoice</button>}>
        <div style={{ ...two, marginBottom: 12 }}>
          <select aria-label="Kind" style={field} value={filters.kind} onChange={(e) => setFilters({ ...filters, kind: e.target.value })}><option value="">Invoices and credit notes</option><option value="invoice">Invoices</option><option value="credit_note">Credit notes</option></select>
          <select aria-label="Status" style={field} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Any status</option><option value="issued">Issued</option><option value="paid">Paid</option><option value="void">Void</option></select>
          <input aria-label="Search invoices" style={field} placeholder="Number or client…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
        <Async r={r}>{(d) => (
          <DataTable rowKey={(x) => x._id} empty="No documents yet. Create the first invoice." rows={d.rows} cols={[
            { key: 'number', label: 'Number', render: (x) => <div><span style={{ fontFamily: MONO, fontSize: 11.5 }}>{x.number}</span>{x.kind === 'credit_note' && <div style={{ fontSize: 10.5, color: COPPER }}>Credit note · against {x.refNumber}</div>}</div> },
            { key: 'date', label: 'Date', render: (x) => fmtDate(x.date) },
            { key: 'clientName', label: 'Client' },
            { key: 'taxable', label: 'Taxable', align: 'right', render: (x) => <span style={{ fontFamily: MONO }}>{inr2(x.taxable)}</span> },
            { key: 'total', label: 'Total', align: 'right', render: (x) => <b style={{ fontFamily: MONO, color: x.kind === 'credit_note' ? COPPER : undefined }}>{x.kind === 'credit_note' ? '−' : ''}{inr2(x.total)}</b> },
            { key: 'status', label: 'Status', render: (x) => <Pill color={stTone[x.status]}>{x.status}</Pill> },
            { key: 'a', label: '', align: 'right', render: (x) => (
              <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button type="button" style={ghost} onClick={() => pdf(x)} aria-label={`PDF for ${x.number}`}><Download size={13} /> PDF</button>
                {x.status !== 'void' && x.kind === 'invoice' && <button type="button" style={ghost} onClick={() => setCredit({ inv: x, amount: '', reason: '' })}>Credit note</button>}
                {x.status === 'issued' && <button type="button" style={ghost} onClick={() => setStatus(x, 'paid')}><CheckCircle2 size={13} /> Paid</button>}
                {x.status !== 'void' && <button type="button" style={dangerBtn} onClick={() => { if (window.confirm(`Void ${x.number}? A voided document cannot be changed again.`)) setStatus(x, 'void'); }}>Void</button>}
              </span>
            ) }
          ]} />
        )}</Async>
      </Section>

      {form && (
        <Dialog title="New invoice" width={720} onClose={() => !saving && setForm(null)}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={two}>
              <Label>Client<select aria-label="Client" style={field} value={form.tenantId} onChange={(e) => pick(e.target.value)}><option value="">Other / not a client…</option>{(clients.data || []).map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Label>
              <Label>Billed to (name)<input aria-label="Billed to" style={field} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></Label>
              <Label>Client GSTIN<input aria-label="Client GSTIN" style={field} placeholder="27AABCU1234F1Z5" value={form.clientGstin} onChange={(e) => setForm({ ...form, clientGstin: e.target.value.toUpperCase() })} /></Label>
              <Label>Place of supply<input aria-label="Place of supply" style={field} placeholder="Maharashtra" value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} /></Label>
            </div>
            <Label>Address<input aria-label="Address" style={field} value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} /></Label>
            <div style={two}>
              <Label>Invoice date<input aria-label="Invoice date" type="date" style={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Label>
              <Label>Due date<input aria-label="Due date" type="date" style={field} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Label>
              <Label hint={`Blank = company default (${company.data?.defaultTaxPct ?? 18}%)`}>GST %<input aria-label="GST percent" type="number" min="0" max="28" step="0.5" style={field} value={form.taxPct} onChange={(e) => setForm({ ...form, taxPct: e.target.value })} /></Label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, alignSelf: 'center' }}><input type="checkbox" style={{ accentColor: GOLD }} checked={form.interState} onChange={(e) => setForm({ ...form, interState: e.target.checked })} /> Inter-state (IGST)</label>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: GOLD, textTransform: 'uppercase', marginBottom: 8 }}>Line items</div>
              {form.lines.map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 34px', gap: 8, marginBottom: 8 }}>
                  <input aria-label={`Line ${i + 1} description`} style={field} placeholder="Description" value={l.description} onChange={(e) => setLine(i, 'description', e.target.value)} />
                  <input aria-label={`Line ${i + 1} quantity`} type="number" min="0" style={field} value={l.qty} onChange={(e) => setLine(i, 'qty', e.target.value)} />
                  <input aria-label={`Line ${i + 1} rate`} type="number" min="0" step="0.01" style={field} placeholder="Rate" value={l.rate} onChange={(e) => setLine(i, 'rate', e.target.value)} />
                  <button type="button" style={{ ...ghost, padding: 0, justifyContent: 'center' }} aria-label={`Remove line ${i + 1}`} disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((_, j) => j !== i) })}><Trash2 size={13} /></button>
                </div>
              ))}
              <button type="button" style={ghost} onClick={() => setForm({ ...form, lines: [...form.lines, { description: '', qty: 1, rate: '' }] })}><Plus size={13} /> Add line</button>
            </div>
            <Label>Notes<input aria-label="Notes" style={field} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Label>
            <div style={{ ...CARD, padding: 12, fontFamily: MONO, fontSize: 12.5, display: 'grid', gap: 4 }} aria-label="Invoice totals">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Taxable value</span><span>{inr2(preview.taxable)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{form.interState ? `IGST @ ${taxPct}%` : `CGST + SGST @ ${taxPct}%`}</span><span>{inr2(preview.tax)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: GOLD }}><span>Total</span><span>{inr2(preview.total)}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button type="button" style={ghost} onClick={() => setForm(null)} disabled={saving}>Cancel</button><button type="button" style={primaryBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Create invoice'}</button></div>
          </div>
        </Dialog>
      )}
      {credit && (
        <Dialog title={`Credit note against ${credit.inv.number}`} onClose={() => setCredit(null)}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Invoice taxable value: <b style={{ fontFamily: MONO }}>{inr2(credit.inv.taxable)}</b>. Enter the amount to credit before GST.</div>
            <Label>Amount to credit (before GST)<input aria-label="Credit amount" type="number" min="0" step="0.01" style={field} value={credit.amount} onChange={(e) => setCredit({ ...credit, amount: e.target.value })} /></Label>
            <Label>Reason<input aria-label="Credit reason" style={field} value={credit.reason} onChange={(e) => setCredit({ ...credit, reason: e.target.value })} /></Label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button type="button" style={ghost} onClick={() => setCredit(null)}>Cancel</button>
              <button type="button" style={primaryBtn} onClick={async () => { try { const cn = await api.post(`finance/invoices/${credit.inv._id}/credit-note`, { amount: Number(credit.amount), reason: credit.reason }); toast(`Credit note ${cn.number} created`); setCredit(null); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } }}>Create credit note</button></div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ═══ 6. GST ═══
function Gst({ toast }) {
  const [months, setMonths] = useState(12); const r = useLoad('finance/gst', { months });
  const saveInput = async (month, value) => { try { await api.put('finance/gst/input-credit', { month, amount: Number(value) }); toast(`Input credit saved for ${monthLabel(month)}`); r.reload(); } catch (e) { toast(errMsg(e), 'err'); r.reload(); } };
  const exportIt = (d) => downloadXlsx(`gst-${istMonth()}.xlsx`, {
    Summary: d.months.map((m) => ({ Month: monthLabel(m.month), Taxable: m.taxable, CGST: m.cgst, SGST: m.sgst, IGST: m.igst, 'Tax collected': m.collected, 'Input credit': m.inputCredit, 'Net payable': m.payable, Invoices: m.invoices, 'Credit notes': m.creditNotes })),
    Register: d.register.map((x) => ({ Number: x.number, Type: x.kind === 'credit_note' ? 'Credit note' : 'Invoice', Date: x.date, Client: x.clientName, GSTIN: x.gstin, 'Place of supply': x.placeOfSupply, SAC: x.sac, 'GST %': x.taxPct, Taxable: x.taxable, CGST: x.cgst, SGST: x.sgst, IGST: x.igst, Total: x.total, 'Against invoice': x.refNumber }))
  });
  return (
    <Async r={r}>{(d) => (
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={grid(190)}>
          <Tile icon={Percent} label="Taxable value" value={inr(d.totals.taxable)} sub="Invoices minus credit notes" /><Tile icon={Wallet} label="GST collected" value={inr(d.totals.collected)} />
          <Tile icon={Landmark} label="Input credit" value={inr(d.totals.inputCredit)} /><Tile icon={Scale} label="Net payable" value={inr(d.totals.payable)} tone={COPPER} />
        </div>
        <Section title="Monthly GST" hint="Void invoices are left out. Type the input tax credit you can claim for a month and press Enter or leave the box." right={<span style={{ display: 'inline-flex', gap: 8 }}>
          <select aria-label="Months" value={months} onChange={(e) => setMonths(Number(e.target.value))} style={{ ...field, width: 'auto' }}>{[3, 6, 12, 24].map((m) => <option key={m} value={m}>Last {m} months</option>)}</select>
          <button type="button" style={primaryBtn} onClick={() => exportIt(d)}><Download size={13} /> Export for CA</button></span>}>
          <DataTable rowKey={(m) => m.month} rows={[...d.months].reverse()} cols={[
            { key: 'month', label: 'Month', render: (m) => monthLabel(m.month) },
            { key: 'taxable', label: 'Taxable', align: 'right', render: (m) => <span style={{ fontFamily: MONO }}>{inr2(m.taxable)}</span> },
            { key: 'cgst', label: 'CGST', align: 'right', render: (m) => <span style={{ fontFamily: MONO }}>{inr2(m.cgst)}</span> },
            { key: 'sgst', label: 'SGST', align: 'right', render: (m) => <span style={{ fontFamily: MONO }}>{inr2(m.sgst)}</span> },
            { key: 'igst', label: 'IGST', align: 'right', render: (m) => <span style={{ fontFamily: MONO }}>{inr2(m.igst)}</span> },
            { key: 'collected', label: 'Collected', align: 'right', render: (m) => <b style={{ fontFamily: MONO }}>{inr2(m.collected)}</b> },
            { key: 'input', label: 'Input credit', align: 'right', render: (m) => <input aria-label={`Input credit ${m.month}`} type="number" min="0" step="0.01" defaultValue={m.inputCredit} key={`${m.month}-${m.inputCredit}`} style={{ ...field, width: 110, textAlign: 'right', padding: '6px 8px' }} onBlur={(e) => { if (Number(e.target.value) !== m.inputCredit) saveInput(m.month, e.target.value); }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} /> },
            { key: 'payable', label: 'Payable', align: 'right', render: (m) => <b style={{ fontFamily: MONO, color: m.payable > 0 ? COPPER : GREEN }}>{inr2(m.payable)}</b> }
          ]} />
        </Section>
      </div>
    )}</Async>
  );
}

// ═══ 7. Costs & vendors ═══
function Costs({ onOpenExpenses }) {
  // a full year ahead, so yearly renewals (domain, SSL) show up too
  const rem = useLoad('finance/recurring-reminders', { days: 400 }); const ven = useLoad('finance/vendors');

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Section title="Recurring cost reminders" hint="Next payment date for every recurring cost, so a domain or hosting renewal is never missed." right={onOpenExpenses && <button type="button" style={ghost} onClick={onOpenExpenses}><Plus size={13} /> Add or edit costs</button>}>
        <Async r={rem}>{(d) => (
          <>
            {d.dueSoonCount > 0 && <div style={{ marginBottom: 12 }}><Pill color={COPPER}>{d.dueSoonCount} due within 14 days</Pill></div>}
            <DataTable rowKey={(x) => x.expenseId} empty="No recurring costs yet. Mark a cost as recurring in Operating Costs and its next payment date shows here." rows={d.rows} cols={[
              { key: 'label', label: 'Cost', render: (x) => <div><b>{x.label}</b><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{x.vendor || 'No vendor'} · {x.interval}</div></div> },
              { key: 'nextDue', label: 'Next due', render: (x) => <div>{fmtDate(x.nextDue)}<div style={{ fontSize: 11, color: x.dueSoon ? COPPER : 'rgba(255,255,255,0.45)' }}>{x.daysUntil === 0 ? 'Today' : `in ${x.daysUntil} day${x.daysUntil === 1 ? '' : 's'}`}</div></div> },
              { key: 'amount', label: 'Amount', align: 'right', render: (x) => <b style={{ fontFamily: MONO }}>{inr(x.amount)}</b> },
              { key: 'dueSoon', label: '', align: 'right', render: (x) => x.dueSoon ? <Pill color={COPPER}>Due soon</Pill> : null }
            ]} />
            {d.rows.length > 0 && <div style={{ marginTop: 10, fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>Total coming up: <b style={{ fontFamily: MONO }}>{inr(d.upcomingTotal)}</b></div>}
          </>
        )}</Async>
      </Section>
      <Section title="Vendors" hint="Everything you have paid, grouped by vendor">
        <Async r={ven}>{(d) => (
          <DataTable rowKey={(x) => x.vendor} empty="No costs logged yet." rows={d.rows} cols={[
            { key: 'vendor', label: 'Vendor', render: (x) => <b>{x.vendor}</b> }, { key: 'categories', label: 'Categories', render: (x) => x.categories.join(', ') },
            { key: 'count', label: 'Payments', align: 'right' }, { key: 'lastPaid', label: 'Last paid', render: (x) => fmtDate(x.lastPaid) },
            { key: 'total', label: 'Total', align: 'right', render: (x) => <b style={{ fontFamily: MONO }}>{inr(x.total)}</b> }
          ]} />
        )}</Async>
      </Section>
    </div>
  );
}

// ═══ 8. Forecast ═══
function Forecast() {
  const [months, setMonths] = useState(3); const r = useLoad('finance/forecast', { months });
  return (
    <Async r={r}>{(d) => (
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={grid(190)}>
          <Tile icon={TrendingUp} label="Best case" value={inr(d.totals.best)} sub={`All ${d.totals.renewals} renewals pay`} tone={GREEN} />
          <Tile icon={Scale} label="Worst case" value={inr(d.totals.worst)} sub="At-risk clients leave" tone={COPPER} />
          <Tile icon={Ban} label="At risk" value={inr(d.totals.atRiskAmount)} sub={`${d.totals.atRiskCount} client${d.totals.atRiskCount === 1 ? '' : 's'}`} tone={COPPER} />
        </div>
        <Section title="By month" hint={d.assumption} right={<select aria-label="Horizon" value={months} onChange={(e) => setMonths(Number(e.target.value))} style={{ ...field, width: 'auto' }}>{[1, 3, 6, 12].map((m) => <option key={m} value={m}>Next {m} month{m > 1 ? 's' : ''}</option>)}</select>}>
          <DataTable rowKey={(m) => m.month} rows={d.byMonth} cols={[
            { key: 'month', label: 'Month', render: (m) => monthLabel(m.month) }, { key: 'renewals', label: 'Renewals', align: 'right' },
            { key: 'best', label: 'Best case', align: 'right', render: (m) => <span style={{ fontFamily: MONO, color: GREEN }}>{inr(m.best)}</span> },
            { key: 'worst', label: 'Worst case', align: 'right', render: (m) => <span style={{ fontFamily: MONO, color: COPPER }}>{inr(m.worst)}</span> }
          ]} />
        </Section>
        <Section title="Renewals in this window">
          <DataTable rowKey={(x) => x.tenantId} empty="No renewals fall in this window." rows={d.rows} cols={[
            { key: 'clientName', label: 'Client', render: (x) => <b>{x.clientName}</b> }, { key: 'planExpiry', label: 'Renews on', render: (x) => fmtDate(x.planExpiry) },
            { key: 'expectedAmount', label: 'Expected', align: 'right', render: (x) => x.amountKnown ? <span style={{ fontFamily: MONO }}>{inr(x.expectedAmount)}</span> : <span style={{ color: 'rgba(255,255,255,0.4)' }}>No past payment</span> },
            { key: 'atRisk', label: 'Risk', render: (x) => x.atRisk ? <Pill color={COPPER}>{x.riskReason}</Pill> : <Pill color={GREEN}>Healthy</Pill> }
          ]} />
        </Section>
      </div>
    )}</Async>
  );
}

// ═══ 9. Coupons ═══
const blankCoupon = () => ({ code: '', type: 'percent', value: '', appliesTo: 'any', maxUses: '0', validTill: '', approvedBy: '', note: '' });
function Coupons({ toast }) {
  const r = useLoad('finance/coupons'); const clients = useClients(); const [form, setForm] = useState(blankCoupon()); const [busy, setBusy] = useState(false); const [redeem, setRedeem] = useState(null);
  const create = async () => { setBusy(true); try { await api.post('finance/coupons', { ...form, value: Number(form.value), maxUses: Number(form.maxUses || 0) }); toast(`Coupon ${form.code.toUpperCase().replace(/\s+/g, '')} created`); setForm(blankCoupon()); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } finally { setBusy(false); } };
  const toggle = async (c) => { try { await api.patch(`finance/coupons/${c._id}`, { active: !c.active }); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } };
  const remove = async (c) => { if (!window.confirm(`Delete coupon ${c.code}?`)) return; try { await api.del(`finance/coupons/${c._id}`); toast('Coupon deleted'); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } };
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Section title="New discount" hint="Every discount records who approved it.">
        <div style={two}>
          <Label>Code<input aria-label="Coupon code" style={field} placeholder="DIWALI10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Label>
          <Label>Type<select aria-label="Coupon type" style={field} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percent">Percent off</option><option value="flat">Flat ₹ off</option></select></Label>
          <Label>{form.type === 'percent' ? 'Percent' : 'Amount (₹)'}<input aria-label="Coupon value" type="number" min="0" style={field} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Label>
          <Label>Applies to<select aria-label="Applies to" style={field} value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}><option value="any">Any payment</option><option value="plan">New plan</option><option value="renewal">Renewal</option></select></Label>
          <Label hint="0 = unlimited">Max uses<input aria-label="Max uses" type="number" min="0" style={field} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></Label>
          <Label>Valid till<input aria-label="Valid till" type="date" style={field} value={form.validTill} onChange={(e) => setForm({ ...form, validTill: e.target.value })} /></Label>
          <Label>Approved by<input aria-label="Approved by" style={field} placeholder="Who approved it?" value={form.approvedBy} onChange={(e) => setForm({ ...form, approvedBy: e.target.value })} /></Label>
          <Label>Note<input aria-label="Coupon note" style={field} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Label>
        </div>
        <div style={{ marginTop: 12 }}><button type="button" style={primaryBtn} disabled={busy} onClick={create}><Plus size={13} /> {busy ? 'Saving…' : 'Create coupon'}</button></div>
      </Section>
      <Section title="Coupons and uses">
        <Async r={r}>{(d) => (
          <DataTable rowKey={(c) => c._id} empty="No coupons yet." rows={d.rows} cols={[
            { key: 'code', label: 'Code', render: (c) => <div><b style={{ fontFamily: MONO }}>{c.code}</b><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Approved by {c.approvedBy}</div></div> },
            { key: 'value', label: 'Discount', render: (c) => c.type === 'percent' ? `${c.value}% off` : `${inr(c.value)} off` },
            { key: 'appliesTo', label: 'Applies to', render: (c) => c.appliesTo },
            { key: 'uses', label: 'Used', align: 'right', render: (c) => `${c.uses}${c.maxUses ? ` / ${c.maxUses}` : ''}` },
            { key: 'totalOff', label: 'Given', align: 'right', render: (c) => <span style={{ fontFamily: MONO }}>{inr(c.totalOff)}</span> },
            { key: 'state', label: 'State', render: (c) => c.expired ? <Pill color={TAUPE}>Expired</Pill> : c.exhausted ? <Pill color={TAUPE}>Used up</Pill> : c.active ? <Pill color={GREEN}>Active</Pill> : <Pill color={TAUPE}>Off</Pill> },
            { key: 'a', label: '', align: 'right', render: (c) => (
              <span style={{ display: 'inline-flex', gap: 6 }}>
                <button type="button" style={ghost} onClick={() => setRedeem({ c, tenantId: '', baseAmount: '', note: '' })}>Redeem</button>
                <button type="button" style={ghost} onClick={() => toggle(c)}>{c.active ? 'Switch off' : 'Switch on'}</button>
                {c.uses === 0 && <button type="button" style={dangerBtn} onClick={() => remove(c)} aria-label={`Delete ${c.code}`}><Trash2 size={13} /></button>}
              </span>
            ) }
          ]} />
        )}</Async>
      </Section>
      {redeem && (
        <Dialog title={`Redeem ${redeem.c.code}`} onClose={() => setRedeem(null)}>
          <div style={{ display: 'grid', gap: 12 }}>
            <Label>Client<select aria-label="Redeem client" style={field} value={redeem.tenantId} onChange={(e) => setRedeem({ ...redeem, tenantId: e.target.value })}><option value="">Pick a client…</option>{(clients.data || []).map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Label>
            <Label>Amount the discount applies to (₹)<input aria-label="Base amount" type="number" min="0" style={field} value={redeem.baseAmount} onChange={(e) => setRedeem({ ...redeem, baseAmount: e.target.value })} /></Label>
            <Label>Note<input aria-label="Redeem note" style={field} value={redeem.note} onChange={(e) => setRedeem({ ...redeem, note: e.target.value })} /></Label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button type="button" style={ghost} onClick={() => setRedeem(null)}>Cancel</button>
              <button type="button" style={primaryBtn} onClick={async () => { try { const x = await api.post(`finance/coupons/${redeem.c._id}/redeem`, { tenantId: redeem.tenantId, baseAmount: Number(redeem.baseAmount), note: redeem.note }); toast(`Discount ${inr(x.amountOff)}. Client pays ${inr(x.payable)}.`); setRedeem(null); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } }}>Apply discount</button></div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ═══ 10. Refunds ═══
function Refunds({ toast, prefill, clearPrefill }) {
  const r = useLoad('finance/refunds'); const clients = useClients();
  const [form, setForm] = useState(() => ({ tenantId: prefill?.tenantId || '', paymentKey: prefill?.paymentKey || '', amount: '', reason: '', date: istToday() })); const [busy, setBusy] = useState(false);
  const pays = useLoad('finance/ledger', form.tenantId ? { tenantId: form.tenantId } : { tenantId: '__none__' }, [form.tenantId]);
  React.useEffect(() => { if (prefill) clearPrefill(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = pays.data?.rows.find((p) => p.paymentKey === form.paymentKey);
  const submit = async () => {
    setBusy(true);
    try { await api.post('finance/refunds', { ...form, amount: Number(form.amount) }); toast('Refund recorded'); setForm({ tenantId: '', paymentKey: '', amount: '', reason: '', date: istToday() }); r.reload(); pays.reload(); }
    catch (e) { toast(errMsg(e), 'err'); } finally { setBusy(false); }
  };
  const remove = async (x) => { if (!window.confirm('Delete this refund record? Do this only to correct a mistake.')) return; try { await api.del(`finance/refunds/${x._id}`); toast('Refund removed'); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } };
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Section title="Record a refund" hint="It is shown against the original payment in Payments and comes off revenue in P&L.">
        <div style={two}>
          <Label>Client<select aria-label="Refund client" style={field} value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value, paymentKey: '' })}><option value="">Pick a client…</option>{(clients.data || []).map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Label>
          <Label hint="Optional">Against payment<select aria-label="Against payment" style={field} value={form.paymentKey} onChange={(e) => setForm({ ...form, paymentKey: e.target.value })} disabled={!form.tenantId}><option value="">Not linked to one payment</option>{(pays.data?.rows || []).map((p) => <option key={p.paymentKey} value={p.paymentKey}>{fmtDate(p.paidAt)} · {inr(p.amount)}{p.refunded ? ` (refunded ${inr(p.refunded)})` : ''}</option>)}</select></Label>
          <Label hint={chosen ? `Up to ${inr(chosen.net)} left on this payment` : undefined}>Amount (₹)<input aria-label="Refund amount" type="number" min="0" style={field} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Label>
          <Label>Date<input aria-label="Refund date" type="date" style={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Label>
        </div>
        <div style={{ marginTop: 12 }}><Label>Reason<input aria-label="Refund reason" style={field} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Label></div>
        <div style={{ marginTop: 12 }}><button type="button" style={primaryBtn} disabled={busy} onClick={submit}><Undo2 size={13} /> {busy ? 'Saving…' : 'Record refund'}</button></div>
      </Section>
      <Section title="Refund history" hint={r.data ? `Total refunded ${inr(r.data.total)}` : undefined}>
        <Async r={r}>{(d) => (
          <DataTable rowKey={(x) => x._id} empty="No refunds recorded." rows={d.rows} cols={[
            { key: 'date', label: 'Date', render: (x) => fmtDate(x.date) }, { key: 'clientName', label: 'Client' }, { key: 'reason', label: 'Reason' },
            { key: 'amount', label: 'Amount', align: 'right', render: (x) => <b style={{ fontFamily: MONO, color: COPPER }}>{inr(x.amount)}</b> },
            { key: 'a', label: '', align: 'right', render: (x) => <button type="button" style={dangerBtn} onClick={() => remove(x)} aria-label="Delete refund"><Trash2 size={13} /></button> }
          ]} />
        )}</Async>
      </Section>
    </div>
  );
}

// ═══ 11. Per-client profitability ═══
function Profitability({ toast }) {
  const [range, setRange] = useState({ from: '', to: '' }); const r = useLoad('finance/profitability', range); const clients = useClients(); const costs = useLoad('finance/client-costs');
  const [form, setForm] = useState({ tenantId: '', kind: 'sms', amount: '', date: istToday(), note: '' }); const [busy, setBusy] = useState(false);
  const add = async () => { setBusy(true); try { await api.post('finance/client-costs', { ...form, amount: Number(form.amount) }); toast('Cost added'); setForm({ ...form, amount: '', note: '' }); r.reload(); costs.reload(); } catch (e) { toast(errMsg(e), 'err'); } finally { setBusy(false); } };
  const name = (id) => clients.data?.find((c) => c.tenantId === id)?.name || id;
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Async r={r}>{(d) => (
        <>
          <div style={grid(190)}>
            <Tile icon={Wallet} label="Revenue" value={inr(d.totals.revenue)} /><Tile icon={Landmark} label="Client costs" value={inr(d.totals.costs)} tone={COPPER} />
            <Tile icon={TrendingUp} label="Profit" value={inr(d.totals.profit)} tone={d.totals.profit >= 0 ? GREEN : COPPER} /><Tile icon={Ban} label="Losing money" value={d.totals.losingCount} sub="Clients who cost more than they pay" tone={COPPER} />
          </div>
          <Section title="Profit by client" hint="Revenue minus refunds minus the SMS, hosting and support cost you logged for that client. Worst first." right={<span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
            <input aria-label="From date" type="date" style={{ ...field, width: 'auto' }} value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /><input aria-label="To date" type="date" style={{ ...field, width: 'auto' }} value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></span>}>
            <DataTable rowKey={(x) => x.tenantId} empty="No revenue or costs in this period." rows={d.rows} cols={[
              { key: 'clientName', label: 'Client', render: (x) => <div><b>{x.clientName}</b>{x.losing && <div><Pill color={COPPER}>Costs more than they pay</Pill></div>}</div> },
              { key: 'revenue', label: 'Revenue', align: 'right', render: (x) => <span style={{ fontFamily: MONO }}>{inr(x.revenue)}</span> },
              { key: 'refunded', label: 'Refunds', align: 'right', render: (x) => <span style={{ fontFamily: MONO }}>{inr(x.refunded)}</span> },
              { key: 'costs', label: 'Costs', align: 'right', render: (x) => <span style={{ fontFamily: MONO }} title={Object.entries(x.costKinds).map(([k, v]) => `${k}: ${inr(v)}`).join(', ')}>{inr(x.costs)}</span> },
              { key: 'profit', label: 'Profit', align: 'right', render: (x) => <b style={{ fontFamily: MONO, color: x.profit >= 0 ? GREEN : COPPER }}>{x.profit < 0 ? '−' : ''}{inr(Math.abs(x.profit))}</b> },
              { key: 'margin', label: 'Margin', align: 'right', render: (x) => x.margin === null ? '—' : `${x.margin}%` }
            ]} />
          </Section>
        </>
      )}</Async>
      <Section title="Log a client cost" hint="SMS and WhatsApp credits, hosting share, support or training time: anything you spent on one client.">
        <div style={two}>
          <Label>Client<select aria-label="Cost client" style={field} value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}><option value="">Pick a client…</option>{(clients.data || []).map((c) => <option key={c.tenantId} value={c.tenantId}>{c.name}</option>)}</select></Label>
          <Label>Kind<select aria-label="Cost kind" style={field} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="sms">SMS / WhatsApp</option><option value="hosting">Hosting</option><option value="support">Support</option><option value="other">Other</option></select></Label>
          <Label>Amount (₹)<input aria-label="Cost amount" type="number" min="0" style={field} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Label>
          <Label>Date<input aria-label="Cost date" type="date" style={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Label>
        </div>
        <div style={{ marginTop: 12 }}><Label>Note<input aria-label="Cost note" style={field} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Label></div>
        <div style={{ marginTop: 12 }}><button type="button" style={primaryBtn} disabled={busy} onClick={add}><Plus size={13} /> {busy ? 'Saving…' : 'Add cost'}</button></div>
        {costs.data?.rows.length > 0 && <div style={{ marginTop: 16 }}><DataTable rowKey={(x) => x._id} rows={costs.data.rows.slice(0, 20)} cols={[
          { key: 'date', label: 'Date', render: (x) => fmtDate(x.date) }, { key: 'tenantId', label: 'Client', render: (x) => name(x.tenantId) }, { key: 'kind', label: 'Kind' }, { key: 'note', label: 'Note' },
          { key: 'amount', label: 'Amount', align: 'right', render: (x) => <span style={{ fontFamily: MONO }}>{inr(x.amount)}</span> },
          { key: 'a', label: '', align: 'right', render: (x) => <button type="button" style={dangerBtn} aria-label="Delete cost" onClick={async () => { try { await api.del(`finance/client-costs/${x._id}`); r.reload(); costs.reload(); } catch (e) { toast(errMsg(e), 'err'); } }}><Trash2 size={13} /></button> }
        ]} /></div>}
      </Section>
    </div>
  );
}

// ═══ 12. Cash book ═══
function CashBook({ toast }) {
  const [month, setMonth] = useState(istMonth()); const r = useLoad('finance/cashbook', { month });
  const [form, setForm] = useState({ direction: 'in', mode: 'upi', amount: '', date: istToday(), party: '', ref: '', note: '' }); const [busy, setBusy] = useState(false); const [opening, setOpening] = useState(null);
  const add = async () => { setBusy(true); try { await api.post('finance/cashbook', { ...form, amount: Number(form.amount) }); toast('Entry added'); setForm({ ...form, amount: '', party: '', ref: '', note: '' }); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } finally { setBusy(false); } };
  const remove = async (x) => { if (!window.confirm('Delete this cash book entry?')) return; try { await api.del(`finance/cashbook/${x._id}`); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } };
  const MODES = [['bank', 'Bank'], ['upi', 'UPI'], ['cash', 'Cash']];
  const saveOpening = async () => { try { await api.put('finance/cashbook/opening', { bank: Number(opening.bank), upi: Number(opening.upi), cash: Number(opening.cash) }); toast('Opening balances saved'); setOpening(null); r.reload(); } catch (e) { toast(errMsg(e), 'err'); } };
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Async r={r}>{(d) => (
        <>
          <Section title="Monthly closing" right={<span style={{ display: 'inline-flex', gap: 8 }}><input aria-label="Month" type="month" style={{ ...field, width: 'auto' }} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /><button type="button" style={ghost} onClick={() => setOpening({ ...d.openingBalances })}>Opening balances</button></span>}>
            <DataTable rowKey={(m) => m.k} rows={[...MODES.map(([k, label]) => ({ k, label, o: d.opening[k], i: d.moneyIn[k], u: d.moneyOut[k], c: d.closing[k] })), { k: 'total', label: 'Total', o: d.totals.opening, i: d.totals.moneyIn, u: d.totals.moneyOut, c: d.totals.closing }]} cols={[
              { key: 'label', label: 'Account', render: (m) => m.k === 'total' ? <b>{m.label}</b> : m.label },
              { key: 'o', label: 'Opening', align: 'right', render: (m) => <span style={{ fontFamily: MONO }}>{inr2(m.o)}</span> },
              { key: 'i', label: 'Money in', align: 'right', render: (m) => <span style={{ fontFamily: MONO, color: GREEN }}>{inr2(m.i)}</span> },
              { key: 'u', label: 'Money out', align: 'right', render: (m) => <span style={{ fontFamily: MONO, color: COPPER }}>{inr2(m.u)}</span> },
              { key: 'c', label: 'Closing', align: 'right', render: (m) => <b style={{ fontFamily: MONO, color: m.k === 'total' ? GOLD : undefined }}>{inr2(m.c)}</b> }
            ]} />
          </Section>
          <Section title={`Entries for ${monthLabel(month)}`}>
            <DataTable rowKey={(x) => x._id} empty="No entries this month." rows={d.entries} cols={[
              { key: 'date', label: 'Date', render: (x) => fmtDate(x.date) }, { key: 'party', label: 'Party / note', render: (x) => <div>{x.party || '—'}{(x.note || x.ref) && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{[x.ref, x.note].filter(Boolean).join(' · ')}</div>}</div> },
              { key: 'mode', label: 'Account', render: (x) => x.mode.toUpperCase() },
              { key: 'amount', label: 'Amount', align: 'right', render: (x) => <b style={{ fontFamily: MONO, color: x.direction === 'in' ? GREEN : COPPER }}>{x.direction === 'in' ? '+' : '−'}{inr2(x.amount)}</b> },
              { key: 'a', label: '', align: 'right', render: (x) => <button type="button" style={dangerBtn} onClick={() => remove(x)} aria-label="Delete entry"><Trash2 size={13} /></button> }
            ]} />
          </Section>
          {opening && (
            <Dialog title="Opening balances" onClose={() => setOpening(null)}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>What you had in each account before the first entry in this book.</div>
                {MODES.map(([k, label]) => <Label key={k}>{label}<input aria-label={`Opening ${label}`} type="number" step="0.01" style={field} value={opening[k]} onChange={(e) => setOpening({ ...opening, [k]: e.target.value })} /></Label>)}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button type="button" style={ghost} onClick={() => setOpening(null)}>Cancel</button><button type="button" style={primaryBtn} onClick={saveOpening}>Save</button></div>
              </div>
            </Dialog>
          )}
        </>
      )}</Async>
      <Section title="Add an entry">
        <div style={two}>
          <Label>Direction<select aria-label="Direction" style={field} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option value="in">Money in</option><option value="out">Money out</option></select></Label>
          <Label>Account<select aria-label="Account" style={field} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>{MODES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Label>
          <Label>Amount (₹)<input aria-label="Entry amount" type="number" min="0" step="0.01" style={field} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Label>
          <Label>Date<input aria-label="Entry date" type="date" style={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Label>
          <Label>Party<input aria-label="Party" style={field} value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} /></Label>
          <Label>Reference<input aria-label="Reference" style={field} value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} /></Label>
        </div>
        <div style={{ marginTop: 12 }}><Label>Note<input aria-label="Entry note" style={field} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Label></div>
        <div style={{ marginTop: 12 }}><button type="button" style={primaryBtn} disabled={busy} onClick={add}><Plus size={13} /> {busy ? 'Saving…' : 'Add entry'}</button></div>
      </Section>
    </div>
  );
}

// ═══ Company profile (printed on invoices, receipts and agreements) ═══
function Company({ toast }) {
  const r = useLoad('finance/company'); const [form, setForm] = useState(null); const [busy, setBusy] = useState(false);
  const f = form || r.data; const set = (k, v) => setForm({ ...(form || r.data), [k]: v });
  const save = async () => { setBusy(true); try { const d = await api.put('finance/company', { ...f, defaultTaxPct: Number(f.defaultTaxPct) }); setForm(null); toast('Company details saved'); r.reload(); return d; } catch (e) { toast(errMsg(e), 'err'); } finally { setBusy(false); } };
  if (!f) return r.error ? <ErrorBox message={r.error} onRetry={r.reload} /> : <Loading />;
  const inp = (k, label, extra = {}) => <Label key={k}>{label}<input aria-label={label} style={field} value={f[k] ?? ''} onChange={(e) => set(k, e.target.value)} {...extra} /></Label>;
  return (
    <Section title="Company profile" hint="Printed on invoices, credit notes and receipts. The GST rate is the default for new invoices.">
      <div style={two}>
        {inp('name', 'Business name')}{inp('gstin', 'GSTIN', { placeholder: '27AABCU1234F1Z5' })}{inp('state', 'State')}{inp('phone', 'Phone')}{inp('email', 'Email')}
        <Label>Default GST %<input aria-label="Default GST percent" type="number" min="0" max="28" step="0.5" style={field} value={f.defaultTaxPct} onChange={(e) => set('defaultTaxPct', e.target.value)} /></Label>
        {inp('bankName', 'Bank name')}{inp('accountNo', 'Account number')}{inp('ifsc', 'IFSC')}{inp('upi', 'UPI ID')}
      </div>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>{inp('address', 'Address')}{inp('invoiceNote', 'Footer note on invoices')}</div>
      <div style={{ marginTop: 14 }}><button type="button" style={primaryBtn} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save company details'}</button></div>
    </Section>
  );
}
