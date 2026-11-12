import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Download, FileCheck2, FileText, Plus, ReceiptText, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import pratyekshaLogo from '../assets/pratyeksha-logo.png';

const COMPANY = {
  name: 'Pratyeksha',
  location: 'Kolhapur, Maharashtra, India',
  tagline: 'Digital customer experience & business operations platform',
};

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));

function printDocument(title) {
  const oldTitle = document.title;
  document.title = title;
  window.setTimeout(() => {
    window.print();
    window.setTimeout(() => { document.title = oldTitle; }, 500);
  }, 50);
}

function Documents() {
  const { type = 'home' } = useParams();
  const navigate = useNavigate();

  if (type === 'home') return <DocumentHome />;
  if (type === 'welcome') return <WelcomeDocument onBack={() => navigate('/documents')} />;
  if (type === 'invoice') return <InvoiceDocument onBack={() => navigate('/documents')} />;
  if (type === 'agreement') return <AgreementDocument onBack={() => navigate('/documents')} />;
  return null;
}

function DocumentHeader({ eyebrow, title, subtitle, onBack, action }) {
  return <div className="document-toolbar no-print">
    <button className="document-back" onClick={onBack}><ArrowLeft size={16} /> Documents</button>
    <div className="document-toolbar-title"><span>{eyebrow}</span><strong>{title}</strong><small>{subtitle}</small></div>
    {action || <span />}
  </div>;
}

function PaperHeader({ documentLabel, number }) {
  return <header className="paper-header"><div className="paper-motif" aria-hidden="true"><i /><i /><i /></div>
    <div className="paper-brand">
      <img src={pratyekshaLogo} alt="Pratyeksha logo" />
      <div><span>{COMPANY.tagline}</span><small>{COMPANY.location}</small></div>
    </div>
    <div className="paper-meta"><span>{documentLabel}</span>{number && <strong>{number}</strong>}<small>{COMPANY.location}</small></div>
  </header>;
}

function PaperFooter() {
  return <footer className="paper-footer"><span>{COMPANY.location}</span><span>Prepared with care</span></footer>;
}

function DocumentHome() {
  const navigate = useNavigate();
  const cards = [
    { key: 'welcome', icon: FileText, eyebrow: '01 · CLIENT ONBOARDING', title: 'Welcome Document', text: 'A polished introduction and onboarding note for a new Pratyeksha client.' },
    { key: 'invoice', icon: ReceiptText, eyebrow: '02 · BILLING', title: 'Invoice', text: 'Create a professional invoice with client details, services, quantities, rates and totals.' },
    { key: 'agreement', icon: FileCheck2, eyebrow: '03 · ENGAGEMENT', title: 'Contract & Scope', text: 'A standard project agreement covering scope, responsibilities, commercial terms and acceptance.' },
  ];
  return <main className="documents-shell">
    <div className="documents-ambient no-print" />
    <header className="documents-hero">
      <div className="documents-brand"><img src={pratyekshaLogo} alt="Pratyeksha logo" /><div><span>DOCUMENT STUDIO</span><small>Premium client documentation · {COMPANY.location}</small></div></div>
      <span className="eyebrow"><Sparkles size={13} /> CLIENT DOCUMENTS · KOLHAPUR</span>
      <h1>Business documents, <em>beautifully prepared.</em></h1>
      <p>Three polished documents for client onboarding, billing and project engagement. Each document is designed for professional presentation and A4 PDF export.</p>
    </header>
    <section className="document-card-grid">
      {cards.map(({ key, icon: Icon, eyebrow, title, text }) => <article className="document-choice" key={key}>
        <div className="document-choice-icon"><Icon size={22} /></div>
        <span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p>
        <button className="primary-button" onClick={() => navigate(`/documents/${key}`)}>Open document <ArrowRight size={16} /></button>
      </article>)}
    </section>
  </main>;
}

function WelcomeDocument({ onBack }) {
  const [client, setClient] = useState('');
  const [contact, setContact] = useState('');
  const [date, setDate] = useState(today());
  return <main className="document-workspace">
    <DocumentHeader eyebrow="01 · CLIENT ONBOARDING" title="Welcome Document" subtitle="A client-ready introduction from Pratyeksha" onBack={onBack} action={<button className="primary-button" onClick={() => printDocument(`Pratyeksha-Welcome-${client || 'Client'}`)}><Download size={16} /> Download PDF</button>} />
    <div className="document-layout">
      <aside className="document-editor no-print">
        <span className="eyebrow">QUICK DETAILS</span><h2>Personalise the document</h2>
        <label className="document-field"><span>Client / business name</span><input value={client} onChange={e => setClient(e.target.value)} placeholder="Enter client or business name" /></label>
        <label className="document-field"><span>Contact person <small>optional</small></span><input value={contact} onChange={e => setContact(e.target.value)} placeholder="Name / role" /></label>
        <label className="document-field"><span>Document date</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <div className="editor-note"><Check size={15} /><span>Use your browser's PDF option after clicking Download PDF. The document is formatted for A4 printing.</span></div>
      </aside>
      <article className="document-paper printable-document">
        <PaperHeader documentLabel="WELCOME DOCUMENT" />
        <section className="welcome-cover"><span className="eyebrow">WELCOME TO Pratyeksha</span><h1>Let's build a <em>better guest experience.</em></h1><p>We are pleased to welcome <strong>{client || 'your business'}</strong> to Pratyeksha.</p><div className="welcome-rule" /></section>
        <section className="paper-section"><span className="eyebrow">A NOTE FROM Pratyeksha</span><h2>Designed around your business.</h2><p>Pratyeksha brings customer feedback, business operations and customer experience into one clear digital workflow. Our goal is to make every interaction easier to understand, easier to manage and more valuable for your team.</p><p>We look forward to working with {client || 'your team'} and creating a practical experience that fits your goals and day-to-day operations.</p></section>
        <section className="welcome-grid"><div><span className="eyebrow">CLIENT</span><strong>{client || '—'}</strong>{contact && <small>{contact}</small>}</div><div><span className="eyebrow">FROM</span><strong>Kolhapur</strong><small>{COMPANY.location}</small></div><div><span className="eyebrow">DATE</span><strong>{date || '—'}</strong></div></section>
        <section className="paper-section welcome-closing"><span className="eyebrow">NEXT STEP</span><h2>A smooth start, with everything in one place.</h2><p>Your project scope, commercial terms and deliverables can be documented separately in the Contract & Scope and Invoice documents.</p></section>
        <PaperFooter />
      </article>
    </div>
  </main>;
}

const emptyItem = () => ({ description: '', qty: 1, rate: 0 });

function InvoiceDocument({ onBack }) {
  const [form, setForm] = useState({ invoiceNo: `PRX-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`, date: today(), dueDate: today(), clientName: '', contact: '', address: '', gstin: '', email: '', phone: '', notes: 'Thank you for choosing Pratyeksha.' });
  const [items, setItems] = useState([emptyItem()]);
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0), [items]);
  const updateItem = (index, key, value) => setItems(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const total = subtotal;
  return <main className="document-workspace">
    <DocumentHeader eyebrow="02 · BILLING" title="Invoice" subtitle="Create, review and save a client invoice as PDF" onBack={onBack} action={<button className="primary-button" onClick={() => printDocument(`Pratyeksha-Invoice-${form.invoiceNo || 'Invoice'}`)}><Download size={16} /> Download PDF</button>} />
    <div className="document-layout invoice-layout">
      <aside className="document-editor no-print">
        <span className="eyebrow">INVOICE DETAILS</span><h2>Client & services</h2>
        <div className="editor-grid-two"><label className="document-field"><span>Invoice no.</span><input value={form.invoiceNo} onChange={e => update('invoiceNo', e.target.value)} /></label><label className="document-field"><span>Invoice date</span><input type="date" value={form.date} onChange={e => update('date', e.target.value)} /></label></div>
        <div className="editor-grid-two"><label className="document-field"><span>Due date</span><input type="date" value={form.dueDate} onChange={e => update('dueDate', e.target.value)} /></label><label className="document-field"><span>GSTIN <small>optional</small></span><input value={form.gstin} onChange={e => update('gstin', e.target.value)} placeholder="GSTIN" /></label></div>
        <label className="document-field"><span>Client / business name</span><input value={form.clientName} onChange={e => update('clientName', e.target.value)} /></label>
        <label className="document-field"><span>Contact person <small>optional</small></span><input value={form.contact} onChange={e => update('contact', e.target.value)} /></label>
        <label className="document-field"><span>Client address</span><textarea value={form.address} onChange={e => update('address', e.target.value)} placeholder="Address, city, state, PIN" /></label>
        <div className="editor-grid-two"><label className="document-field"><span>Email <small>optional</small></span><input type="email" value={form.email} onChange={e => update('email', e.target.value)} /></label><label className="document-field"><span>Phone <small>optional</small></span><input value={form.phone} onChange={e => update('phone', e.target.value)} /></label></div>
        <div className="service-editor"><div className="service-editor-head"><span className="eyebrow">SERVICES</span><button className="secondary-button compact-button" onClick={() => setItems(prev => [...prev, emptyItem()])}><Plus size={14} /> Add service</button></div>{items.map((item, index) => <div className="service-row" key={index}><input placeholder="Service / deliverable" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} /><input aria-label="Quantity" type="number" min="0" step="1" value={item.qty} onChange={e => updateItem(index, 'qty', e.target.value)} /><input aria-label="Rate" type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} /><button className="icon-button" disabled={items.length === 1} onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}><Trash2 size={15} /></button></div>)}</div>
        <label className="document-field"><span>Notes / payment terms</span><textarea value={form.notes} onChange={e => update('notes', e.target.value)} /></label>
      </aside>
      <article className="document-paper printable-document invoice-paper">
        <PaperHeader documentLabel="INVOICE" number={form.invoiceNo} />
        <section className="invoice-intro"><div><span className="eyebrow">BILL TO</span><h1>{form.clientName || 'Client name'}</h1><p>{form.contact}</p><p>{form.address || 'Client address'}</p>{form.email && <p>{form.email}</p>}{form.phone && <p>{form.phone}</p>}{form.gstin && <p>GSTIN: {form.gstin}</p>}</div><div className="invoice-dates"><div><span>Invoice date</span><strong>{form.date || '—'}</strong></div><div><span>Due date</span><strong>{form.dueDate || '—'}</strong></div></div></section>
        <table className="invoice-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td>{item.description || 'Service / deliverable'}</td><td>{item.qty || 0}</td><td>{money(item.rate)}</td><td>{money(Number(item.qty || 0) * Number(item.rate || 0))}</td></tr>)}</tbody></table>
        <section className="invoice-summary"><div className="invoice-note"><span className="eyebrow">NOTES</span><p>{form.notes || '—'}</p></div><div className="invoice-total"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="grand-total"><span>Total due</span><strong>{money(total)}</strong></div></div></section>
        <section className="invoice-sign"><div><span className="eyebrow">ISSUED BY</span><strong>Authorised representative</strong><small>{COMPANY.location}</small></div><div><span className="eyebrow">AUTHORISED SIGNATURE</span><div className="signature-line" /></div></section>
        <PaperFooter />
      </article>
    </div>
  </main>;
}

function AgreementDocument({ onBack }) {
  const [client, setClient] = useState('');
  const [project, setProject] = useState('Customer Feedback & Experience System');
  const [effective, setEffective] = useState(today());
  return <main className="document-workspace">
    <DocumentHeader eyebrow="03 · ENGAGEMENT" title="Contract & Scope" subtitle="Standard project agreement template" onBack={onBack} action={<button className="primary-button" onClick={() => printDocument(`Pratyeksha-Agreement-${client || 'Client'}`)}><Download size={16} /> Download PDF</button>} />
    <div className="document-layout">
      <aside className="document-editor no-print"><span className="eyebrow">AGREEMENT DETAILS</span><h2>Project information</h2><label className="document-field"><span>Client / business name</span><input value={client} onChange={e => setClient(e.target.value)} placeholder="Enter client or business name" /></label><label className="document-field"><span>Project / service title</span><input value={project} onChange={e => setProject(e.target.value)} /></label><label className="document-field"><span>Effective date</span><input type="date" value={effective} onChange={e => setEffective(e.target.value)} /></label><div className="editor-note"><Check size={15} /><span>This is a standard scope template. Final commercial, legal and project-specific terms should be reviewed and agreed by both parties.</span></div></aside>
      <article className="document-paper printable-document agreement-paper">
        <PaperHeader documentLabel="CONTRACT & SCOPE / AGREEMENT" />
        <section className="agreement-title"><span className="eyebrow">PROJECT AGREEMENT</span><h1>{project || 'Project / Service Title'}</h1><p>Between <strong>{COMPANY.name}</strong>, Kolhapur, Maharashtra, India, and <strong>{client || 'Client'}</strong>.</p><div className="agreement-date">Effective date: <strong>{effective || '—'}</strong></div></section>
        <AgreementSection n="01" title="Purpose">This agreement records the intended scope and working understanding for the services described in this document. The parties may use the accompanying invoice or commercial document for agreed fees and payment details.</AgreementSection>
        <AgreementSection n="02" title="Scope of services"><ul><li>Planning and implementation of the agreed digital solution and related customer experience workflows.</li><li>Configuration of the features and screens specifically agreed for the project.</li><li>Reasonable testing and delivery of the agreed project scope.</li><li>Project-specific deliverables, timelines and integrations are subject to the final agreed scope.</li></ul></AgreementSection>
        <AgreementSection n="03" title="Client responsibilities"><ul><li>Provide accurate business information, content, branding assets and access required for implementation.</li><li>Review deliverables and provide timely feedback or approvals.</li><li>Provide any third-party accounts, credentials or approvals that are required for integrations.</li></ul></AgreementSection>
        <AgreementSection n="04" title="Fees & payment">Fees, taxes, payment milestones and any recurring charges will be as stated in the applicable invoice or commercial proposal agreed by both parties. Work outside the agreed scope may require a separate estimate or written approval.</AgreementSection>
        <AgreementSection n="05" title="Changes & additional work">Any material change to the agreed scope, features, integrations or deliverables should be documented and approved before implementation. Additional work may affect the timeline and commercial terms.</AgreementSection>
        <AgreementSection n="06" title="Confidentiality & access">Both parties should handle confidential business information, credentials and customer information responsibly and only use such information for the agreed project purposes. Access credentials should not be shared beyond authorised persons.</AgreementSection>
        <AgreementSection n="07" title="Delivery & acceptance">The project will be reviewed against the agreed scope. Minor revisions that fall within the agreed scope may be incorporated during the review process. New requirements outside the agreed scope are treated as changes.</AgreementSection>
        <AgreementSection n="08" title="Term & termination">The project term and any termination or cancellation conditions should follow the commercial agreement between the parties. Outstanding approved charges for work already completed remain payable according to the agreed terms.</AgreementSection>
        <section className="signature-grid"><div><span className="eyebrow">FOR PROVIDER</span><div className="signature-line" /><strong>Authorised representative</strong><small>{COMPANY.location}</small></div><div><span className="eyebrow">FOR CLIENT</span><div className="signature-line" /><strong>{client || 'Authorised representative'}</strong><small>Client acceptance</small></div></section>
        <PaperFooter />
      </article>
    </div>
  </main>;
}

function AgreementSection({ n, title, children }) {
  return <section className="agreement-section"><div className="agreement-index">{n}</div><div><span className="eyebrow">SECTION {n}</span><h2>{title}</h2><div className="agreement-copy">{children}</div></div></section>;
}

export default Documents;
