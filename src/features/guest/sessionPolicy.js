// Decides what the customer app does when a table page loads. Kept as a pure function so every case can be tested.
//   navType   : performance navigation type of this page load ('navigate' | 'reload' | 'back_forward' | 'prerender')
//   freshFlag : true when the in-app QR scanner just opened this table (a single-page navigation, so navType is stale)
//   stored    : the session saved in this browser tab ({ tenantId, tableNumber, token?, closed? }) or null
// Returns: 'start' (new visit: ask the server for a new session) | 'validate' (resume the live session) |
//          'ended-bill' (bill already generated: menu stays closed) | 'ended-expired' (no live session: menu stays closed)
export function decideEntry({ navType, freshFlag, stored, tenantId, tableNumber }) {
  const fresh = navType === 'navigate' || navType === 'prerender' || !!freshFlag;
  if (fresh) return 'start';                       // scanning the QR (or typing the link) is how a new session begins
  const same = !!(stored && stored.token && stored.tenantId === tenantId && String(stored.tableNumber) === String(tableNumber));
  if (!same) return stored && stored.closed ? 'ended-bill' : 'ended-expired';
  if (stored.closed) return 'ended-bill';
  return 'validate';
}
