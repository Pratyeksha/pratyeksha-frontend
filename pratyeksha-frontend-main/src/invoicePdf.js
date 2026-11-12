// Starts the PDF download inside the tax-invoice window that App.jsx opens (a blob: page).
//
// The invoice page used to contain an inline <script> that called html2pdf() on load. A blob: page inherits the app's
// Content-Security-Policy, which forbids inline scripts, so the trigger lives here instead and runs from the opener.
// The page still loads the html2pdf library itself from its own <script src> (allowed by the policy's script-src).
export function startInvoicePdf(win, filename) {
  if (!win) return () => {};
  let started = false;
  let tries = 0;
  let timer = null;
  const options = {
    margin: [8, 8, 8, 8],
    filename,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // true = finished (started, or the window is gone); false = the page / library is not ready yet
  const tryStart = () => {
    if (started) return true;
    let root = null;
    let lib = null;
    try {
      if (win.closed) return true;
      root = win.document.getElementById('invoice-root');
      lib = win.html2pdf;
    } catch { return true; } // window navigated away or closed
    if (!root || typeof lib !== 'function') return false;
    started = true;
    Promise.resolve(lib().set(options).from(root).save())
      .then(() => setTimeout(() => { try { win.close(); } catch { /* already closed */ } }, 90000))
      .catch(() => {});
    return true;
  };

  // Retry for about 20 s: the library comes from a CDN and may arrive after the page's load event.
  const poll = () => {
    if (tryStart()) return;
    if (++tries > 80) return;
    timer = setTimeout(poll, 250);
  };
  try { win.addEventListener('load', poll); } catch { /* cross-origin / closed window */ }
  poll();
  return () => clearTimeout(timer);
}
