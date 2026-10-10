import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Download, FileCheck2, FileText, Plus, ReceiptText, Trash2, Layers, MessageCircle, MessagesSquare, UtensilsCrossed } from 'lucide-react';
import './pratyeksha-docs.css';

/* ─────────────────────────────────────────────────────────────
   Pratyeksha Document Studio — lives inside Master Admin.
   One place to prepare the Welcome note, Invoice and Contract & Scope
   for either product (or a bundle) and for any onboarded client.
   Same white paper theme as the original Feedback Suite documents.
───────────────────────────────────────────────────────────── */

const LOGO = '/pratyeksha-logo.png';
const COMPANY = { name: 'Pratyeksha', location: 'Kolhapur, Maharashtra, India' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const istToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const fmtDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '—';
};
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => Math.max(0, Number(v) || 0);
const money = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v || 0));

/* What each product actually contains — drives every document's wording. */
const MODULES = {
  pratyeksha: [
    'QR table ordering with a live digital menu',
    'Kitchen display and live order flow',
    'Operator portal — billing, tables, inventory and staff',
    'Owner app with live revenue and performance insights',
    'Reservations, waitlist and pickup for guests',
    'Offers and loyalty inside the customer app',
  ],
  feedbackSuite: [
    'QR feedback form for your guests',
    'Private admin dashboard — ratings, trends and customer voice',
    'Customer contact book with visit history',
    'Excel export of feedback and customers',
    'Your own isolated workspace and admin login',
  ],
  whatsappCampaigns: [
    'Campaign Studio with its own separate password',
    'Audience filters by rating, date and visits',
    'Scheduled sending with send results',
    'Permission-first — opted-out guests are always skipped',
  ],
};

const DOC_TABS = [
  { id: 'welcome', label: 'Welcome', icon: FileText },
  { id: 'invoice', label: 'Invoice', icon: ReceiptText },
  { id: 'agreement', label: 'Contract & Scope', icon: FileCheck2 },
];

function printDocument(title) {
  const oldTitle = document.title;
  document.title = title;
  document.body.classList.add('pxd-printing');
  document.documentElement.classList.add('pxd-printing');
  const cleanup = () => {
    document.body.classList.remove('pxd-printing');
    document.documentElement.classList.remove('pxd-printing');
    document.title = oldTitle;
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.setTimeout(() => {
    window.print();
    // Browsers that don't block on print (mobile) never fire afterprint in time.
    window.setTimeout(() => { if (document.body.classList.contains('pxd-printing')) cleanup(); }, 1200);
  }, 60);
}

const joinAddress = (a) => [a?.street, a?.city, a?.state, a?.pincode].filter(Boolean).join(', ');

export default function MasterDocuments({ clients = [], focusClientId = null, onFocusHandled }) {
  const [doc, setDoc] = useState('welcome');
  const [product, setProduct] = useState('pratyeksha'); // 'pratyeksha' | 'feedback' | 'bundle'
  const [whatsapp, setWhatsapp] = useState(false);
  const [clientKey, setClientKey] = useState('');
  const [f, setF] = useState({
    clientName: '', contact: '', address: '', gstin: '', email: '', phone: '',
    date: istToday(), dueDate: istToday(), status: 'Due', gstPct: '0', months: '12',
    notes: 'Thank you for choosing Pratyeksha.',
  });
  const [invoiceNoOverride, setInvoiceNoOverride] = useState(null);
  const [projectOverride, setProjectOverride] = useState(null);
  const [effective, setEffective] = useState(istToday());
  const [invoiceSeq] = useState(() => String(Date.now()).slice(-5));
  const [itemsTouched, setItemsTouched] = useState(false);

  const hasPrx = product !== 'feedback';
  const hasFb = product !== 'pratyeksha';
  const hasWa = hasFb && whatsapp;
  const months = Math.max(1, Math.round(Number(f.months) || 12));

  const update = (key, value) => setF((prev) => ({ ...prev, [key]: value }));

  const defaultItems = useMemo(() => {
    const rows = [];
    if (hasPrx) rows.push({ description: `Pratyeksha restaurant platform — ${months}-month subscription`, qty: 1, rate: 0 });
    if (hasFb) rows.push({ description: `Feedback Suite — ${months}-month subscription`, qty: 1, rate: 0 });
    if (hasWa) rows.push({ description: `WhatsApp Campaign Studio add-on — ${months}-month subscription`, qty: 1, rate: 0 });
    return rows;
  }, [hasPrx, hasFb, hasWa, months]);

  const [items, setItems] = useState(defaultItems);
  useEffect(() => { if (!itemsTouched) setItems(defaultItems); }, [defaultItems, itemsTouched]);

  const updateItem = (index, key, value) => { setItemsTouched(true); setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it))); };
  const addItem = () => { setItemsTouched(true); setItems((prev) => [...prev, { description: '', qty: 1, rate: 0 }]); };
  const removeItem = (index) => { setItemsTouched(true); setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)); };
  const resetItems = () => { setItemsTouched(false); setItems(defaultItems); };

  /* Pick an onboarded client → fill details and match the product to what they subscribed to. */
  const pickClient = (key) => {
    setClientKey(key);
    const c = clients.find((x) => String(x._id || x.tenantId) === String(key));
    if (!c) return;
    const p = c.config?.products || {};
    const prx = p.pratyeksha !== false;
    const fb = p.feedbackSuite === true;
    setProduct(prx && fb ? 'bundle' : fb ? 'feedback' : 'pratyeksha');
    setWhatsapp(fb && p.whatsappCampaigns === true);
    setItemsTouched(false);
    setInvoiceNoOverride(null);
    setProjectOverride(null);
    setF((prev) => ({
      ...prev,
      clientName: c.name || '',
      contact: c.ownerName || '',
      address: joinAddress(c.address),
      gstin: c.gstin && !/pending/i.test(c.gstin) ? c.gstin : '',
      phone: c.contact || c.serviceContact || '',
      email: '',
    }));
  };

  useEffect(() => {
    if (!focusClientId) return;
    pickClient(focusClientId);
    if (onFocusHandled) onFocusHandled();
  }, [focusClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedClient = useMemo(() => clients.find((x) => String(x._id || x.tenantId) === String(clientKey)) || null, [clients, clientKey]);

  const productName = hasPrx && hasFb ? 'Pratyeksha + Feedback Suite' : hasFb ? 'Feedback Suite' : 'Pratyeksha';
  const tagline = hasPrx && hasFb
    ? 'Restaurant operations, guest feedback & WhatsApp campaigns'
    : hasFb ? 'Guest feedback & WhatsApp campaigns' : 'Restaurant & café operations platform';
  const prefix = hasPrx && hasFb ? 'PXB' : hasFb ? 'FBS' : 'PRX';
  const invoiceNo = invoiceNoOverride ?? `${prefix}-${new Date().getFullYear()}-${invoiceSeq}`;
  const defaultProject = hasPrx && hasFb
    ? `Pratyeksha Platform & Feedback Suite${hasWa ? ' with WhatsApp Campaigns' : ''}`
    : hasFb ? `Feedback Suite${hasWa ? ' with WhatsApp Campaigns' : ''}` : 'Pratyeksha Restaurant Platform';
  const project = projectOverride ?? defaultProject;
  const modules = [
    ...(hasPrx ? MODULES.pratyeksha : []),
    ...(hasFb ? MODULES.feedbackSuite : []),
    ...(hasWa ? MODULES.whatsappCampaigns : []),
  ];

  const subtotal = round2(items.reduce((s, it) => s + num(it.qty) * num(it.rate), 0));
  const gstPct = Math.min(100, num(f.gstPct));
  const gstAmt = round2(subtotal * gstPct / 100);
  const total = round2(subtotal + gstAmt);

  const clientLabel = f.clientName || 'Client';
  const fileTitle = `${COMPANY.name}-${doc === 'invoice' ? `Invoice-${invoiceNo}` : doc === 'agreement' ? 'Agreement' : 'Welcome'}-${clientLabel}`.replace(/[^\w.-]+/g, '-');

  /* ─── The paper (rendered on screen AND in the print portal so printing never depends on the admin layout) ─── */
  const header = (label, number) => (
    <header className="paper-header">
      <div className="paper-motif" aria-hidden="true"><i /><i /><i /></div>
      <div className="paper-brand">
        <img src={LOGO} alt="Pratyeksha logo" />
        <div><span>{productName}</span><small>{tagline}</small></div>
      </div>
      <div className="paper-meta"><span>{label}</span>{number && <strong>{number}</strong>}<small>{COMPANY.location}</small></div>
    </header>
  );
  const footer = <footer className="paper-footer"><span>{COMPANY.location}</span><span>Prepared with care</span></footer>;

  let paper = null;
  if (doc === 'welcome') {
    paper = (
      <article className="document-paper printable-document">
        {header('WELCOME DOCUMENT')}
        <section className="welcome-cover">
          <span className="eyebrow">WELCOME TO {productName.toUpperCase()}</span>
          <h1>Let's build a <em>better guest experience.</em></h1>
          <p>We are pleased to welcome <strong>{f.clientName || 'your business'}</strong> to {productName}.</p>
          <div className="welcome-rule" />
        </section>
        <section className="paper-section">
          <span className="eyebrow">WHAT YOU GET</span>
          <h2>Everything included in your plan.</h2>
          <ul className="pxd-modules">{modules.map((m) => <li key={m}>{m}</li>)}</ul>
        </section>
        <section className="welcome-grid">
          <div><span className="eyebrow">CLIENT</span><strong>{f.clientName || '—'}</strong>{f.contact && <small>{f.contact}</small>}</div>
          <div><span className="eyebrow">FROM</span><strong>Kolhapur</strong><small>{COMPANY.location}</small></div>
          <div><span className="eyebrow">DATE</span><strong>{fmtDate(f.date)}</strong></div>
        </section>
        <section className="paper-section welcome-closing">
          <span className="eyebrow">NEXT STEP</span>
          <h2>A smooth start, with everything in one place.</h2>
          <p>Your scope, commercial terms and billing are documented separately in the Contract &amp; Scope and Invoice documents. We look forward to working with {f.clientName || 'your team'}.</p>
        </section>
        {footer}
      </article>
    );
  } else if (doc === 'invoice') {
    paper = (
      <article className="document-paper printable-document invoice-paper">
        {header('INVOICE', invoiceNo)}
        <section className="invoice-intro">
          <div>
            <span className="eyebrow">BILL TO</span>
            <h1>{f.clientName || 'Client name'}</h1>
            {f.contact && <p>{f.contact}</p>}
            <p>{f.address || 'Client address'}</p>
            {f.email && <p>{f.email}</p>}
            {f.phone && <p>{f.phone}</p>}
            {f.gstin && <p>GSTIN: {f.gstin}</p>}
          </div>
          <div className="invoice-dates">
            <div><span>Invoice date</span><strong>{fmtDate(f.date)}</strong></div>
            <div><span>Due date</span><strong>{fmtDate(f.dueDate)}</strong></div>
            <div><span>Status</span><strong>{f.status === 'Paid' ? 'PAID' : 'PAYMENT DUE'}</strong></div>
          </div>
        </section>
        <table className="invoice-table">
          <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}><td>{it.description || 'Service / deliverable'}</td><td>{num(it.qty)}</td><td>{money(num(it.rate))}</td><td>{money(round2(num(it.qty) * num(it.rate)))}</td></tr>
            ))}
          </tbody>
        </table>
        <section className="invoice-summary">
          <div className="invoice-note"><span className="eyebrow">NOTES</span><p>{f.notes || '—'}</p></div>
          <div className="invoice-total">
            <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            {gstPct > 0 && <div><span>GST ({gstPct}%)</span><strong>{money(gstAmt)}</strong></div>}
            <div className="grand-total"><span>{f.status === 'Paid' ? 'Total paid' : 'Total due'}</span><strong>{money(total)}</strong></div>
          </div>
        </section>
        <section className="invoice-sign">
          <div><span className="eyebrow">ISSUED BY</span><strong>Authorised representative</strong><small>{COMPANY.location}</small></div>
          <div><span className="eyebrow">AUTHORISED SIGNATURE</span><div className="signature-line" /></div>
        </section>
        {footer}
      </article>
    );
  } else {
    const sections = [
      ['Purpose', <>This agreement records the intended scope and working understanding for the services described in this document. The accompanying invoice states the agreed fees and payment details.</>],
      ['Scope of services', <ul>{modules.map((m) => <li key={m}>{m}</li>)}<li>Configuration of the features agreed for {f.clientName || 'the client'} and reasonable testing before go-live.</li></ul>],
      ['Subscription term', <>The subscription runs for {months} month{months === 1 ? '' : 's'} from the effective date and can be renewed. Active modules follow the products listed in this document.</>],
      ['Client responsibilities', <ul><li>Provide accurate business information, menu content, branding assets and access required for setup.</li><li>Review deliverables and provide timely feedback or approvals.</li><li>Provide any third-party accounts or approvals needed for integrations{hasWa ? ', including WhatsApp Business access' : ''}.</li></ul>],
      ['Fees & payment', <>Fees, taxes and payment milestones are as stated in the applicable invoice. Work outside the agreed scope may require a separate estimate or written approval.</>],
      ['Confidentiality & access', <>Both parties handle business information, credentials and customer data responsibly and only for the agreed purpose.{hasFb ? ' Each client workspace is isolated from every other client.' : ''} Access credentials must not be shared beyond authorised persons.</>],
      ...(hasWa ? [['Messaging & consent', <>WhatsApp campaigns are sent only to guests who may be contacted. The client is responsible for lawful consent, and guests who opt out are excluded from campaigns.</>]] : []),
      ['Changes, delivery & termination', <>Material changes to scope are documented and approved before work starts. Cancellation conditions follow the commercial agreement between the parties; approved charges for completed work remain payable.</>],
    ];
    paper = (
      <article className="document-paper printable-document agreement-paper">
        {header('CONTRACT & SCOPE / AGREEMENT')}
        <section className="agreement-title">
          <span className="eyebrow">PROJECT AGREEMENT</span>
          <h1>{project || 'Project / Service Title'}</h1>
          <p>Between <strong>{COMPANY.name}</strong>, Kolhapur, Maharashtra, India, and <strong>{f.clientName || 'Client'}</strong>.</p>
          <div className="agreement-date">Effective date: <strong>{fmtDate(effective)}</strong></div>
        </section>
        {sections.map(([title, body], i) => {
          const n = String(i + 1).padStart(2, '0');
          return (
            <section className="agreement-section" key={title}>
              <div className="agreement-index">{n}</div>
              <div><span className="eyebrow">SECTION {n}</span><h2>{title}</h2><div className="agreement-copy">{body}</div></div>
            </section>
          );
        })}
        <section className="signature-grid">
          <div><span className="eyebrow">FOR PROVIDER</span><div className="signature-line" /><strong>Authorised representative</strong><small>{COMPANY.location}</small></div>
          <div><span className="eyebrow">FOR CLIENT</span><div className="signature-line" /><strong>{f.clientName || 'Authorised representative'}</strong><small>Client acceptance</small></div>
        </section>
        {footer}
      </article>
    );
  }

  const planExpiry = selectedClient?.config?.planExpiry ? new Date(selectedClient.config.planExpiry) : null;
  const expiryText = planExpiry && !Number.isNaN(planExpiry.getTime()) ? fmtDate(new Date(planExpiry.getTime() + 330 * 60000).toISOString().slice(0, 10)) : null;

  return (
    <div className="pxd pxd-studio">
      <div className="pxd-bar no-print">
        <div className="pxd-title"><span>DOCUMENT STUDIO</span><strong>Client documents</strong></div>
        <div className="pxd-seg" role="tablist" aria-label="Product">
          <button type="button" className={product === 'pratyeksha' ? 'on' : ''} onClick={() => { setProduct('pratyeksha'); setWhatsapp(false); }}><UtensilsCrossed size={13} /> Pratyeksha</button>
          <button type="button" className={product === 'feedback' ? 'on' : ''} onClick={() => setProduct('feedback')}><MessagesSquare size={13} /> Feedback Suite</button>
          <button type="button" className={product === 'bundle' ? 'on' : ''} onClick={() => setProduct('bundle')}><Layers size={13} /> Both</button>
        </div>
        <select className="pxd-pick" value={clientKey} onChange={(e) => (e.target.value ? pickClient(e.target.value) : setClientKey(''))} aria-label="Pick an onboarded client">
          <option value="">Custom client…</option>
          {clients.map((c) => <option key={c._id || c.tenantId} value={c._id || c.tenantId}>{c.name} · {c.tenantId}</option>)}
        </select>
        <button type="button" className="primary-button" onClick={() => printDocument(fileTitle)}><Download size={15} /> Download PDF</button>
      </div>

      <div className="pxd-doc-tabs no-print">
        {DOC_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={doc === id ? 'on' : ''} onClick={() => setDoc(id)}><Icon size={14} /> {label}</button>
        ))}
      </div>

      {hasFb && (
        <div className="pxd-subbar no-print">
          <span className="lbl">ADD-ON</span>
          <label className={`pxd-chip${whatsapp ? ' on' : ''}`}>
            <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />
            <MessageCircle size={13} /> WhatsApp Campaigns
          </label>
        </div>
      )}

      <div className="document-layout">
        <aside className="document-editor no-print">
          <span className="eyebrow">{doc === 'invoice' ? 'INVOICE DETAILS' : doc === 'agreement' ? 'AGREEMENT DETAILS' : 'QUICK DETAILS'}</span>
          <h2>{doc === 'invoice' ? 'Client & services' : doc === 'agreement' ? 'Project information' : 'Personalise'}</h2>

          <label className="document-field"><span>Client / business name</span><input value={f.clientName} onChange={(e) => update('clientName', e.target.value)} placeholder="Enter client or business name" /></label>
          <label className="document-field"><span>Contact person <small>optional</small></span><input value={f.contact} onChange={(e) => update('contact', e.target.value)} placeholder="Name / role" /></label>
          <div className="editor-grid-two">
            <label className="document-field"><span>Document date</span><input type="date" value={f.date} onChange={(e) => update('date', e.target.value)} /></label>
            <label className="document-field"><span>Plan (months)</span><input type="number" min="1" step="1" value={f.months} onChange={(e) => update('months', e.target.value)} /></label>
          </div>

          {doc === 'invoice' && (
            <>
              <div className="editor-grid-two">
                <label className="document-field"><span>Invoice no.</span><input value={invoiceNo} onChange={(e) => setInvoiceNoOverride(e.target.value)} /></label>
                <label className="document-field"><span>Due date</span><input type="date" value={f.dueDate} onChange={(e) => update('dueDate', e.target.value)} /></label>
              </div>
              <div className="editor-grid-two">
                <label className="document-field"><span>GSTIN <small>optional</small></span><input value={f.gstin} onChange={(e) => update('gstin', e.target.value)} placeholder="GSTIN" /></label>
                <label className="document-field"><span>GST % <small>0 = none</small></span><input type="number" min="0" max="100" step="0.01" value={f.gstPct} onChange={(e) => update('gstPct', e.target.value)} /></label>
              </div>
              <label className="document-field"><span>Payment status</span>
                <select value={f.status} onChange={(e) => update('status', e.target.value)}>
                  <option value="Due">Payment due</option><option value="Paid">Paid</option>
                </select>
              </label>
              <label className="document-field"><span>Client address</span><textarea value={f.address} onChange={(e) => update('address', e.target.value)} placeholder="Address, city, state, PIN" /></label>
              <div className="editor-grid-two">
                <label className="document-field"><span>Email <small>optional</small></span><input type="email" value={f.email} onChange={(e) => update('email', e.target.value)} /></label>
                <label className="document-field"><span>Phone <small>optional</small></span><input value={f.phone} onChange={(e) => update('phone', e.target.value)} /></label>
              </div>
              <div className="service-editor">
                <div className="service-editor-head">
                  <span className="eyebrow">SERVICES</span>
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    {itemsTouched && <button type="button" className="secondary-button compact-button" onClick={resetItems}>Reset</button>}
                    <button type="button" className="secondary-button compact-button" onClick={addItem}><Plus size={14} /> Add</button>
                  </span>
                </div>
                {items.map((it, i) => (
                  <div className="service-row" key={i}>
                    <input placeholder="Service / deliverable" value={it.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                    <input aria-label="Quantity" type="number" min="0" step="1" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
                    <input aria-label="Rate" type="number" min="0" step="0.01" value={it.rate} onChange={(e) => updateItem(i, 'rate', e.target.value)} />
                    <button type="button" className="icon-button" disabled={items.length === 1} onClick={() => removeItem(i)} aria-label="Remove service"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <label className="document-field"><span>Notes / payment terms</span><textarea value={f.notes} onChange={(e) => update('notes', e.target.value)} /></label>
            </>
          )}

          {doc === 'agreement' && (
            <>
              <label className="document-field"><span>Project / service title</span><input value={project} onChange={(e) => setProjectOverride(e.target.value)} /></label>
              <label className="document-field"><span>Effective date</span><input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} /></label>
            </>
          )}

          {selectedClient && (
            <div className="editor-note">
              <Check size={15} />
              <span>
                {selectedClient.name} subscribes to: {[selectedClient.config?.products?.pratyeksha !== false && 'Pratyeksha', selectedClient.config?.products?.feedbackSuite === true && 'Feedback Suite', selectedClient.config?.products?.whatsappCampaigns === true && 'WhatsApp Campaigns'].filter(Boolean).join(', ') || 'Pratyeksha'}.
                {expiryText ? ` Plan valid until ${expiryText}.` : ''}
              </span>
            </div>
          )}
          <div className="editor-note"><Check size={15} /><span>Click Download PDF and choose “Save as PDF” in the print dialog. Documents are formatted for A4.</span></div>
        </aside>
        {paper}
      </div>

      {createPortal(<div className="pxd pxd-print-root" aria-hidden="true">{paper}</div>, document.body)}
    </div>
  );
}
