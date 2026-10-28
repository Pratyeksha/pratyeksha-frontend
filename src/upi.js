// ─────────────────────────────────────────────────────────────────────────────
// UPI deep links. Opening one of these in a UPI app shows the payee and the EXACT amount, ready for the customer's PIN.
// Spec: https://www.npci.org.in/ (UPI Linking Specification) — pa = payee VPA, pn = payee name, am = amount, cu = currency, tn = note.
// ─────────────────────────────────────────────────────────────────────────────
export const UPI_ID_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

export const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
// UPI wants a plain decimal with at most 2 places, no thousands separators, no currency symbol.
export const formatUpiAmount = (n) => roundMoney(n).toFixed(2);

const cleanNote = (v) => String(v ?? '').replace(/[^A-Za-z0-9 .\-_/#]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
const cleanName = (v) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);

/** Query string for the payment. Throws on anything that would make a UPI app reject or mis-show the payment. */
export function upiQuery({ upiId, payeeName, amount, note, merchantCode = '', txnRef = '' }) {
  const vpa = String(upiId || '').trim();
  if (!UPI_ID_RE.test(vpa)) throw new Error('Invalid UPI ID');
  const amt = roundMoney(amount);
  if (!Number.isFinite(amt) || amt <= 0) throw new Error('Invalid amount');
  if (amt > 200000) throw new Error('Amount is above the UPI limit');
  const pn = cleanName(payeeName);
  if (!pn) throw new Error('Missing payee name');
  const pairs = [
    ['pa', encodeURIComponent(vpa).replace(/%40/g, '@')],
    ['pn', encodeURIComponent(pn)],
  ];
  // Business (merchant) UPI IDs are expected to carry a merchant category code and a transaction reference. Personal IDs must NOT:
  // adding them to a personal VPA makes some apps refuse the payment.
  const mc = String(merchantCode || '').trim();
  if (mc) { if (!/^\d{4}$/.test(mc)) throw new Error('Invalid merchant code'); pairs.push(['mc', mc]); }
  const tr = String(txnRef || '').trim();
  if (tr) { if (!/^[A-Za-z0-9]{1,35}$/.test(tr)) throw new Error('Invalid transaction reference'); pairs.push(['tr', tr]); }
  pairs.push(['am', formatUpiAmount(amt)], ['cu', 'INR']);
  const tn = cleanNote(note);
  if (tn) pairs.push(['tn', encodeURIComponent(tn)]);
  return pairs.map(([k, v]) => `${k}=${v}`).join('&');
}

export const UPI_APPS = [
  { id: 'gpay',    label: 'Google Pay', android: 'com.google.android.apps.nbu.paisa.user', ios: 'gpay://upi/pay' },
  { id: 'phonepe', label: 'PhonePe',    android: 'com.phonepe.app',                        ios: 'phonepe://pay' },
  { id: 'paytm',   label: 'Paytm',      android: 'net.one97.paytm',                        ios: 'paytmmp://pay' },
];

export const detectPlatform = (ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) => {
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  // iPadOS 13+ reports itself as a Mac with touch support
  if (typeof navigator !== 'undefined' && /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  return 'desktop';
};

/** The link that opens a specific UPI app (or the system chooser for 'any') with the amount filled in. */
export function buildUpiLink(appId, params, platform = detectPlatform()) {
  const q = upiQuery(params);
  const generic = `upi://pay?${q}`;
  if (appId === 'any' || platform === 'desktop') return generic;
  const app = UPI_APPS.find((a) => a.id === appId);
  if (!app) return generic;
  if (platform === 'android') return `intent://pay?${q}#Intent;scheme=upi;package=${app.android};end`;
  return app.ios ? `${app.ios}?${q}` : generic;
}

/** Apps worth showing as buttons on this device. */
export const appsFor = (platform = detectPlatform()) => (platform === 'ios' ? UPI_APPS.filter((a) => a.ios) : UPI_APPS);
