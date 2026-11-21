import API_BASE_URL from './apiBase.js';

/** Sends uncaught screen errors to the platform so they show up in Master Admin > Platform > App errors. Capped to 5 per page load. */
let sent = 0;
const seen = new Set();
function report(message, stack) {
  const msg = String(message || '').slice(0, 300);
  if (!msg || sent >= 5 || seen.has(msg) || /ResizeObserver loop|Script error\.?$|Network Error|aborted/i.test(msg)) return;
  seen.add(msg); sent += 1;
  try {
    const body = JSON.stringify({ message: msg, stack: String(stack || '').slice(0, 1500), url: window.location.pathname });
    const url = `${API_BASE_URL}/public/client-error`;
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* reporting must never throw */ }
}
export function installErrorReporter() {
  if (typeof window === 'undefined' || window.__pxErrReporter) return;
  window.__pxErrReporter = true;
  window.addEventListener('error', (e) => report(e.message, e.error?.stack));
  window.addEventListener('unhandledrejection', (e) => report(e.reason?.message || String(e.reason || 'Unhandled rejection'), e.reason?.stack));
}
