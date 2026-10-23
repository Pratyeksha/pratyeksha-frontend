import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Loader2, X, QrCode, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';

const GOLD = '#c9a486';
const TEMPLATE_URL = '/table-qr-template.png';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the QR template image.'));
    img.src = src;
  });
}
function svgToImage(svg) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not render the QR code.')); };
    img.src = url;
  });
}
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.closePath();
}

export default function TemplateQRGenerator({ client, onClose, flash }) {
  const configuredTableCount = Math.max(1, Number(client?.config?.tableCount || client?.tableCount || 12));
  const [count, setCount] = useState(String(configuredTableCount));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const exportCode = async (code, template, svg) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1535;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
    // Replace only the existing QR artwork, retaining the frame, label and surrounding design.
    ctx.fillStyle = '#fff'; roundedRect(ctx, 316, 675, 384, 384, 20); ctx.fill();
    const qrImage = await svgToImage(svg);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrImage, 333, 692, 350, 350);
    // The label is deliberately redrawn in the template's existing number plaque.
    ctx.fillStyle = '#0b0908';
    ctx.fillRect(808, 694, 127, 116);
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const label = code.label || String(code.tableNumber).padStart(2, '0');
    ctx.font = `700 ${label.length > 3 ? 54 : label.length === 3 ? 68 : 98}px Arial, sans-serif`;
    ctx.fillText(label, 871, 754, 122);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('The browser could not create a PNG image.');
    const a = document.createElement('a');
    const safe = label === 'CT' ? 'Counter' : `Table_${String(code.tableNumber).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    a.href = URL.createObjectURL(blob); a.download = `${safe}.png`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  const generate = async () => {
    if (!client?.tenantId) { setError('Select a tenant before generating QR codes.'); return; }
    const n = configuredTableCount;
    if (!Number.isInteger(n) || n < 1 || n > 300) { setError('Enter a whole number from 1 to 300.'); return; }
    setBusy(true); setError(''); setStatus('Preparing your print-ready QR images…');
    try {
      const { data } = await axios.get(`${API_BASE_URL}/admin/table-qr/${encodeURIComponent(client.tenantId)}?count=${n}`);
      const list = [...(data.tables || []), ...(data.counter ? [data.counter] : [])];
      if (!list.length) throw new Error('No QR codes were returned for this tenant.');
      const template = await loadImage(TEMPLATE_URL);
      for (let i = 0; i < list.length; i++) {
        const code = list[i];
        const node = [...document.querySelectorAll('[data-template-qr]')].find(el => el.dataset.templateQr === `${client.tenantId}:${code.tableNumber}`);
        const svg = node?.querySelector('svg');
        if (!svg) throw new Error(`QR renderer missing for ${code.label || code.tableNumber}.`);
        setStatus(`Generating ${i + 1} of ${list.length}: ${code.label || `Table ${code.tableNumber}`}…`);
        await exportCode(code, template, svg);
        // Let the browser process each download before starting the next.
        await new Promise(resolve => setTimeout(resolve, 180));
      }
      setStatus(`Ready — ${n} table QR images and 1 counter QR generated.`);
      flash?.(`Generated ${n} table QR images + counter QR`);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'QR generation failed.');
    } finally { setBusy(false); }
  };

  const [renderCodes, setRenderCodes] = useState([]);
  const renderQRs = async () => {
    const n = configuredTableCount;
    if (!Number.isInteger(n) || n < 1 || n > 300) { setError('Enter a whole number from 1 to 300.'); return; }
    setBusy(true); setError('');
    try {
      const { data } = await axios.get(`${API_BASE_URL}/admin/table-qr/${encodeURIComponent(client.tenantId)}?count=${n}`);
      setRenderCodes([...(data.tables || []), ...(data.counter ? [data.counter] : [])]);
      // Allow React to mount the hidden QR SVGs before exporting them.
      setStatus('QR links loaded. Preparing image generation…');
      setTimeout(() => { generate(); }, 80);
    } catch (e) { setError(e?.response?.data?.error || 'Could not load signed QR links.'); setBusy(false); }
  };

  return <div role="dialog" aria-modal="true" aria-label="Generate template QR codes" onClick={onClose} style={{ position:'fixed', inset:0, zIndex:100500, background:'rgba(0,0,0,.82)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
    <div onClick={e=>e.stopPropagation()} style={{ width:'min(600px,100%)', maxHeight:'90vh', overflowY:'auto', background:'#15120f', color:'#f7f1e9', border:'1px solid #8a704d', borderRadius:18, padding:22 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}><QrCode size={20} color={GOLD}/><div style={{ flex:1 }}><div style={{ fontSize:16, fontWeight:800 }}>Template QR Studio</div><div style={{ color:'#b9a48d', fontSize:12 }}>{client?.name} · {client?.tenantId}</div></div><button onClick={onClose} aria-label="Close" style={{ background:'transparent', color:'#d3bfa2', border:0, cursor:'pointer' }}><X size={20}/></button></div>
      <p style={{ fontSize:13, lineHeight:1.65, color:'#c7b9a7' }}>Generates signed QR codes only for the selected tenant <b>{client?.tenantId}</b>: one per configured table plus a <b>CT counter QR</b>. No other tenant's table URLs are included. Each image downloads as a separate PNG.</p>
      <label style={{ display:'block', fontSize:12, color:GOLD, marginBottom:6 }}>TABLE COUNT FOR THIS TENANT (CONFIGURED: {configuredTableCount})</label>
      <input type="number" min="1" max="300" value={count} onChange={e=>setCount(e.target.value)} disabled style={{ width:'100%', boxSizing:'border-box', padding:12, borderRadius:10, border:'1px solid #6e5a42', background:'#0b0908', color:'#fff', fontSize:16, marginBottom:12 }}/>
      <button type="button" disabled={busy} onClick={renderQRs} style={{ width:'100%', display:'flex', justifyContent:'center', alignItems:'center', gap:8, padding:13, borderRadius:10, border:0, background:GOLD, color:'#17110b', fontWeight:900, cursor:busy?'wait':'pointer' }}>{busy?<Loader2 size={16}/>:<Download size={16}/>} GENERATE TEMPLATE QR IMAGES</button>
      {status && <div role="status" style={{ display:'flex', gap:8, alignItems:'center', marginTop:12, color:'#d3bfa2', fontSize:12 }}>{!busy&&<CheckCircle2 size={15} />}{status}</div>}
      {error && <div role="alert" style={{ marginTop:12, padding:10, borderRadius:8, background:'rgba(180,70,50,.12)', color:'#f0a28f', fontSize:12 }}>{error}</div>}
      <div style={{ position:'absolute', left:-10000, top:0, width:1, height:1, overflow:'hidden' }} aria-hidden="true">{renderCodes.map(c=><div key={`${client.tenantId}:${c.tableNumber}`} data-template-qr={`${client.tenantId}:${c.tableNumber}`}><QRCodeSVG value={c.url} size={700} level="H" marginSize={0} /></div>)}</div>
    </div>
  </div>;
}
