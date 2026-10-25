// Server-render each new/changed screen with realistic props to catch runtime errors that a bundler build cannot.
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const load = (p) => vite.ssrLoadModule(p);
const results = []; const ok = (n, html0, must = []) => { const html = String(html0).replace(/<!-- -->/g, ''); for (const m of must) if (!html.includes(m)) throw new Error(`${n}: missing "${m}"`); results.push(`✓ ${n} (${html.length} chars)`); };
try {
  const gate = await load('/src/QrGate.jsx');
  for (const reason of ['SIGNATURE', 'MISSING', 'TABLE_REMOVED', 'INACTIVE', 'NETWORK']) ok(`QrInvalidScreen ${reason}`, renderToString(React.createElement(gate.QrInvalidScreen, { reason, onRetry: () => {} })), ['Secure QR', 'Browse restaurants']);
  const bill = (await load('/src/GuestBill.jsx')).default;
  ok('GuestBill requested', renderToString(React.createElement(bill, { status: { status: 'requested' } })), ['being prepared']);
  const sent = { status: 'sent', paid: false, bill: { baseSubtotal: 500, discount: { title: '10% off', amountExTax: 50 }, subtotal: 450, cgstPct: 2.5, sgstPct: 2.5, cgst: 11.25, sgst: 11.25, grandTotal: 472.5 } };
  ok('GuestBill sent', renderToString(React.createElement(bill, { status: sent })), ['472.50', '10% off', 'CGST (2.5%)']);
  ok('GuestBill paid', renderToString(React.createElement(bill, { status: { ...sent, status: 'settled', paid: true, paidAmount: 472.5, billNo: 7 } })), ['PAID', 'Bill #7']);
  const sheet = (await load('/src/OfferSheet.jsx')).default;
  ok('OfferSheet', renderToString(React.createElement(sheet, { offer: { type: 'percent_off', value: 15, minOrder: 400, code: 'SAVE15', expiresAt: new Date(Date.now() + 3 * 864e5).toISOString(), title: 'Monsoon', _tenant: { name: 'Cafe One', address: { area: 'Rajarampuri' } } }, lang: 'en', onClose() {}, onView() {} })), ['15% OFF', 'SAVE15', '₹400', 'Cafe One']);
  const logos = (await load('/src/UpiLogos.jsx')).default;
  for (const id of ['gpay', 'phonepe', 'paytm', 'bhim', 'any']) ok(`UpiLogo ${id}`, renderToString(React.createElement(logos, { id })), ['<svg']);
  const oc = await load('/src/OperatorCommerce.jsx');
  ok('OperatorTables', renderToString(React.createElement(oc.OperatorTables, { tenantId: 't' })), ['Tables']);
  ok('OperatorCombos', renderToString(React.createElement(oc.OperatorCombos, { tenantId: 't', menuItems: [] })), ['Combos']);
  ok('OperatorBillRequests', renderToString(React.createElement(oc.OperatorBillRequests, { tenantId: 't' })), ['Bill requests']);
  const qs = (await load('/src/QrStudio.jsx')).default;
  ok('QrStudio (locked)', renderToString(React.createElement(qs)), ['Unlock QR Studio']);
  const ga = React.createElement(MemoryRouter, { initialEntries: ['/cafe?table=3&sig=abc'] }, React.createElement(Routes, null, React.createElement(Route, { path: '/:tenantId', element: React.createElement(gate.default, null, React.createElement('div', null, 'APP')) })));
  ok('QrGate shows verifying (not the app) for a table link', renderToString(ga).replace('APP', 'APP'), []);
  if (renderToString(ga).includes('>APP<')) throw new Error('QrGate rendered the app before verification');
  const rec = await load('/src/recommend.js'); ok('recommend.js', JSON.stringify(rec.recommendForCart({ cart: {}, allMenuItems: [], categories: [] })), ['[]']);
  console.log(results.join('\n')); console.log('\nrender smoke: all passed');
} catch (e) { console.error(results.join('\n')); console.error('\nFAILED:', e.stack || e); process.exitCode = 1; }
await vite.close();
