// Signing used by the Pratyeksha backend (qr-security.js). MUST stay byte-identical in behaviour — tests/parity.test.mjs pins it.
import crypto from 'node:crypto';
export const COUNTER_LABEL = 'CT';
export const canonTable = (label) => { const t = String(label ?? '').trim(); return /^(ct|counter)$/i.test(t) ? COUNTER_LABEL : t; };
export const sign = (secret, tenantId, table) => crypto.createHmac('sha256', secret).update(`${String(tenantId).trim()}|${canonTable(table)}`).digest('hex').slice(0, 20);
export const buildUrl = (secret, origin, tenantId, table) => {
  const t = canonTable(table);
  return `${String(origin).replace(/\/$/, '')}/${encodeURIComponent(tenantId)}?table=${encodeURIComponent(t)}&sig=${sign(secret, tenantId, t)}`;
};
