import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import '@fontsource/roboto-condensed/700.css';
import { QrCode, Download, Printer, Upload, RefreshCcw, CheckCircle2, AlertTriangle, Loader2, SlidersHorizontal, FileArchive } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { detectTemplate, renderCard, decodeCard, cardFileName } from './qrCompose.js';

// Master Admin ▸ QR Studio: one click makes a print-ready, signed QR card for every table of a restaurant (1..tableCount) plus a counter card ("CT").
// The template is auto-detected (QR placeholder + table-number box), so replacing the template image needs no code change.
const GOLD = '#d3bfa2', GOLD2 = '#8a704d', BG = '#1b1b1e', BG2 = '#232327', BORDER = '#2e2e34', INPUT = '#17171a';
const DEFAULT_TEMPLATE = '/qr-template.png';
const FONT = '"Roboto Condensed", "Arial Narrow", sans-serif';

const loadImage = (src) => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('The template image could not be loaded')); img.src = src; });
const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const toBlob = (canvas) => new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not create the image'))), 'image/png'));
const yieldUi = () => new Promise((r) => setTimeout(r, 0));

const card = { background: BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 };
const label = { fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: GOLD2, textTransform: 'uppercase', marginBottom: 6, display: 'block' };
const input = { width: '100%', boxSizing: 'border-box', background: INPUT, color: '#f1ece2', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 10px', fontSize: 13, outline: 'none' };
const btn = (primary, disabled) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: primary ? 'none' : `1px solid ${BORDER}`, background: primary ? GOLD : BG2, color: primary ? '#14110c' : GOLD, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.4, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 });

export default function QrStudio({ clients = [] }) {
  const [tenantId, setTenantId] = useState('');
  const [scale, setScale] = useState(2);
  const [withCounter, setWithCounter] = useState(true);
  const [template, setTemplate] = useState(null);          // { img, name }
  const [layout, setLayout] = useState(null);
  const [detectErr, setDetectErr] = useState('');
  const [showAdv, setShowAdv] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState([]);              // [{ label, thumb, blob, url, verified }]
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const urlsRef = useRef([]);
  const previewRef = useRef(null);
  const fileRef = useRef(null);

  const tenants = useMemo(() => [...clients].filter((c) => c && c.tenantId).sort((a, b) => String(a.name).localeCompare(String(b.name))), [clients]);
  const selected = tenants.find((t) => t.tenantId === tenantId) || null;

  const analyse = useCallback(async (src, name) => {
    setDetectErr(''); setLayout(null);
    try {
      const img = await loadImage(src);
      const c = makeCanvas(img.naturalWidth, img.naturalHeight); const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
      const found = detectTemplate(cx.getImageData(0, 0, c.width, c.height));
      if (found.error) { setDetectErr(found.error); setTemplate({ img, name }); return; }
      setTemplate({ img: Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight }), name }); setLayout(found);
      if (found.warning) setDetectErr(found.warning);
    } catch (e) { setDetectErr(e.message); }
  }, []);
  useEffect(() => { analyse(DEFAULT_TEMPLATE, 'Built-in template'); }, [analyse]);
  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const onUpload = (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { setDetectErr('Please choose a PNG, JPG or WebP template.'); return; }
    const u = URL.createObjectURL(f); urlsRef.current.push(u); setResults([]); analyse(u, f.name);
  };

  // live preview of the (possibly hand-adjusted) detection boxes on the template
  useEffect(() => {
    const cv = previewRef.current; if (!cv || !template || !layout) return;
    const w = 300, h = Math.round(300 * layout.height / layout.width); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); x.drawImage(template.img, 0, 0, w, h); const k = w / layout.width;
    x.lineWidth = 2; x.strokeStyle = '#4ad37a'; x.strokeRect(layout.qr.x * k, layout.qr.y * k, layout.qr.size * k, layout.qr.size * k);
    if (layout.label) { x.strokeStyle = '#e2b34a'; const g = layout.label.glyph; x.strokeRect(g.x * k, g.y * k, g.w * k, g.h * k); }
  }, [template, layout]);

  const setNum = (path, v) => setLayout((L) => {
    const n = Math.max(0, Math.round(Number(v) || 0)); const next = JSON.parse(JSON.stringify(L));
    if (path[0] === 'qr') next.qr[path[1]] = n; else next.label.glyph[path[1]] = n;
    return next;
  });

  const generate = async () => {
    setError(''); setInfo(''); setResults([]);
    if (!selected) { setError('Choose a restaurant first.'); return; }
    if (!template || !layout) { setError('The template could not be analysed. Upload a template that has a white QR placeholder.'); return; }
    setBusy(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/admin/master/qr-studio/${encodeURIComponent(selected.tenantId)}`);
      const items = data.tables.map((t) => ({ label: t.label, url: t.url }));
      if (withCounter) items.push({ label: data.counter.label, url: data.counter.url });
      if (!items.length) { setError('This restaurant has no tables configured yet.'); setBusy(false); return; }
      if (document.fonts && document.fonts.load) { try { await document.fonts.load(`700 100px ${FONT}`); } catch { /* falls back to Arial Narrow */ } }
      setProgress({ done: 0, total: items.length });
      const out = []; let failed = 0;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const canvas = await renderCard({ createCanvas: makeCanvas, template: template.img, layout, scanUrl: it.url, label: it.label, scale, fontFamily: FONT });
        const verified = decodeCard(canvas, layout, scale) === it.url;          // the printed QR is decoded again and must equal the link
        if (!verified) failed++;
        const blob = await toBlob(canvas);
        const th = makeCanvas(240, Math.round(240 * canvas.height / canvas.width)); th.getContext('2d').drawImage(canvas, 0, 0, th.width, th.height);
        const url = URL.createObjectURL(blob); urlsRef.current.push(url);
        out.push({ label: it.label, thumb: th.toDataURL('image/jpeg', 0.8), blob, url, verified, scanUrl: it.url });
        setProgress({ done: i + 1, total: items.length });
        if (i % 2 === 1) await yieldUi();
      }
      setResults(out);
      setInfo(failed ? '' : `All ${out.length} codes were decoded again after printing onto the template and match their links.`);
      if (failed) setError(`${failed} card(s) did not read back correctly. Increase the output size or check the QR box in "Template regions".`);
    } catch (e) { setError(e?.response?.data?.error || e.message || 'Could not generate the QR codes'); }
    finally { setBusy(false); }
  };

  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  const downloadZip = async () => {
    setBusy(true); setError('');
    try {
      const zip = new JSZip(); const folder = zip.folder(selected.tenantId);
      const rows = ['label,file,scan_url'];
      for (const r of results) { const fn = cardFileName(r.label); folder.file(fn, r.blob); rows.push(`${r.label},${fn},"${r.scanUrl}"`); }
      folder.file('links.csv', rows.join('\n'));
      save(await zip.generateAsync({ type: 'blob', compression: 'STORE' }), `${selected.tenantId}_QR_cards.zip`);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const printAll = () => {
    const w = window.open('', '_blank'); if (!w) { setError('Allow pop-ups to print.'); return; }
    w.document.write(`<!doctype html><title>${selected.name} QR cards</title><style>@page{margin:0}body{margin:0}img{display:block;width:100%;height:auto;page-break-after:always;break-after:page}</style>${results.map((r) => `<img src="${r.url}">`).join('')}`);
    w.document.close(); setTimeout(() => w.print(), 600);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', width: '100%', padding: '24px 20px 40px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <QrCode size={22} color={GOLD} /><h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontWeight: 500, color: '#f7f3eb', fontSize: '1.5rem' }}>QR Studio</h2>
        </div>
        <p style={{ margin: '0 0 18px', color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>
          Pick a restaurant and press <b style={{ color: GOLD }}>Generate QR</b>. You get a signed, print-ready card for every table (from the restaurant’s real table count) and one counter card labelled <b style={{ color: GOLD }}>CT</b>. Each code is decoded again after it is placed on the template, so a card that would not scan is flagged.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={card}>
            <label style={label}>Restaurant</label>
            <select value={tenantId} onChange={(e) => { setTenantId(e.target.value); setResults([]); setInfo(''); setError(''); }} style={input}>
              <option value="">Select a restaurant…</option>
              {tenants.map((t) => <option key={t.tenantId} value={t.tenantId}>{t.name} — {t.tableCount ?? '?'} tables</option>)}
            </select>
            <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ minWidth: 150 }}>
                <label style={label}>Output size</label>
                <select value={scale} onChange={(e) => setScale(Number(e.target.value))} style={input}>
                  <option value={1}>Standard (1024 × 1535)</option>
                  <option value={2}>Print (2048 × 3070)</option>
                  <option value={3}>Large print (3072 × 4605)</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f1ece2', fontSize: 13, paddingBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={withCounter} onChange={(e) => setWithCounter(e.target.checked)} /> Include counter card (CT)
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button type="button" style={btn(true, busy || !selected || !layout)} disabled={busy || !selected || !layout} onClick={generate}>
                {busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <QrCode size={15} />} {busy ? `Generating ${progress.done}/${progress.total}…` : 'Generate QR'}
              </button>
              {results.length > 0 && <>
                <button type="button" style={btn(false, busy)} disabled={busy} onClick={downloadZip}><FileArchive size={15} /> Download all (ZIP)</button>
                <button type="button" style={btn(false, busy)} disabled={busy} onClick={printAll}><Printer size={15} /> Print all</button>
              </>}
            </div>
            {busy && progress.total > 0 && <div style={{ height: 4, background: BORDER, borderRadius: 4, marginTop: 14, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(progress.done / progress.total) * 100}%`, background: GOLD, transition: 'width .2s' }} /></div>}
            {error && <div role="alert" style={{ marginTop: 12, color: '#e0907a', fontSize: 12.5, lineHeight: 1.5, display: 'flex', gap: 8 }}><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} /> {error}</div>}
            {info && <div style={{ marginTop: 12, color: GOLD, fontSize: 12.5, lineHeight: 1.5, display: 'flex', gap: 8 }}><CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 2 }} /> {info}</div>}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...label, marginBottom: 0 }}>Template</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} style={{ display: 'none' }} />
                <button type="button" style={{ ...btn(false), padding: '6px 10px', fontSize: 11 }} onClick={() => fileRef.current && fileRef.current.click()}><Upload size={13} /> Replace</button>
                <button type="button" style={{ ...btn(false), padding: '6px 10px', fontSize: 11 }} onClick={() => { setResults([]); analyse(DEFAULT_TEMPLATE, 'Built-in template'); }}><RefreshCcw size={13} /> Reset</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <canvas ref={previewRef} style={{ width: 120, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#000', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                <div style={{ color: '#f1ece2' }}>{template ? template.name : 'Loading…'}</div>
                {layout && <div>{layout.width} × {layout.height}px</div>}
                <div><span style={{ color: '#4ad37a' }}>■</span> QR placeholder {layout ? `${layout.qr.size}px` : '—'}</div>
                <div><span style={{ color: '#e2b34a' }}>■</span> Table number {layout?.label ? 'found' : 'not found'}</div>
                {detectErr && <div style={{ color: '#e0907a', marginTop: 4 }}>{detectErr}</div>}
              </div>
            </div>
            <button type="button" onClick={() => setShowAdv((v) => !v)} style={{ ...btn(false), marginTop: 14, padding: '7px 10px', fontSize: 11 }}><SlidersHorizontal size={13} /> Template regions</button>
            {showAdv && layout && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[['QR x', ['qr', 'x']], ['QR y', ['qr', 'y']], ['QR size', ['qr', 'size']], ['Corner', ['qr', 'radius']]].map(([t, p]) => (
                  <div key={t}><label style={label}>{t}</label><input type="number" style={input} value={layout.qr[p[1]]} onChange={(e) => setNum(p, e.target.value)} /></div>
                ))}
                {layout.label && [['No. x', ['label', 'x']], ['No. y', ['label', 'y']], ['No. width', ['label', 'w']], ['No. height', ['label', 'h']]].map(([t, p]) => (
                  <div key={t}><label style={label}>{t}</label><input type="number" style={input} value={layout.label.glyph[p[1]]} onChange={(e) => setNum(p, e.target.value)} /></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
            {results.map((r) => (
              <div key={r.label} style={{ ...card, padding: 10 }}>
                <img src={r.thumb} alt={`QR card ${r.label}`} style={{ width: '100%', borderRadius: 6, display: 'block' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>{/^\d+$/.test(r.label) ? `Table ${r.label}` : 'Counter (CT)'}</span>
                  {r.verified ? <CheckCircle2 size={14} color="#4ad37a" title="Scan verified" /> : <AlertTriangle size={14} color="#e0907a" title="Did not read back" />}
                </div>
                <button type="button" onClick={() => save(r.blob, cardFileName(r.label))} style={{ ...btn(false), width: '100%', marginTop: 8, padding: '6px 8px', fontSize: 11 }}><Download size={12} /> PNG</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
