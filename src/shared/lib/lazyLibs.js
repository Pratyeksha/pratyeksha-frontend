/* On-demand loaders for heavy, rarely-used libraries (spreadsheet + PDF export, ZIP, QR decode).
 * Each is fetched the first time it is needed, then served from the module cache, so none of them
 * is part of a portal's initial download. Failed loads are not cached, so a flaky network can retry. */
const once = (load) => {
  let p;
  return () => (p ||= load().catch((e) => { p = undefined; throw e; }));
};

/** SheetJS namespace (utils, read, writeFile). */
export const loadXlsx = once(() => import('xlsx'));

/** { jsPDF, autoTable } — autoTable is the plugin function form (autoTable(doc, opts)). */
export const loadPdf = once(async () => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  return { jsPDF, autoTable };
});

/** JSZip constructor. */
export const loadJsZip = once(async () => (await import('jszip')).default);

/** jsQR decode function (QR verification only). */
export const loadJsQr = once(async () => (await import('jsqr')).default);
