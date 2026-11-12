import React, { useRef, useState } from 'react';
import axios from 'axios';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';

// Operator picks a picture for a campaign / offer / announcement.
// The browser shrinks it (max 1000px wide JPEG) before upload so phones on slow data are fine; the server stores it and
// returns a public https URL. That one URL is used on the customer's in-app banner AND as the large picture of the push.
const MAX_W = 1000;
const MAX_BYTES = 650 * 1024; // keep well under the 900 KB server limit (base64 adds ~33 %)

const shrink = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const scale = Math.min(1, MAX_W / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const g = canvas.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); // PNG transparency → white instead of black
      g.drawImage(img, 0, 0, w, h);
      let q = 0.86, out = canvas.toDataURL('image/jpeg', q);
      while (out.length * 0.75 > MAX_BYTES && q > 0.4) { q -= 0.1; out = canvas.toDataURL('image/jpeg', q); }
      URL.revokeObjectURL(url);
      if (out.length * 0.75 > MAX_BYTES) reject(new Error('Image is too detailed — please pick a smaller picture'));
      else resolve(out);
    } catch (e) { URL.revokeObjectURL(url); reject(e); }
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image')); };
  img.src = url;
});

export default function NotifImagePicker({ tenantId, value, onChange, label = 'Image (optional)', hint = 'Shown on the customer banner and in the notification', onError }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const fail = (m) => { setErr(m); if (onError) onError(m); };

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) { fail('Please choose a JPG, PNG or WebP image'); return; }
    if (file.size > 12 * 1024 * 1024) { fail('That image is over 12 MB'); return; }
    setErr(''); setBusy(true);
    try {
      const dataUrl = await shrink(file);
      const r = await axios.post(`${API_BASE_URL}/notification-images/${encodeURIComponent(tenantId)}`, { dataUrl });
      if (!r.data?.url) throw new Error('Upload failed');
      onChange(r.data.url);
    } catch (ex) {
      fail(ex?.response?.data?.error || ex?.message || 'Upload failed');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ fontSize: '0.48rem', color: '#a6a6a6', fontWeight: 900, letterSpacing: '0.8px', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} style={{ display: 'none' }} />
      {value ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(211,191,162,0.25)', background: '#090909' }}>
          <img src={value} alt="Selected" style={{ width: '100%', maxHeight: 170, objectFit: 'cover', display: 'block' }} />
          <button type="button" onClick={() => onChange('')} aria-label="Remove image" title="Remove image"
            style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(211,191,162,0.4)', background: 'rgba(12,12,12,0.85)', color: '#d3bfa2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <X size={15} />
          </button>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => inputRef.current && inputRef.current.click()}
          style={{ width: '100%', padding: '14px 12px', borderRadius: 10, border: '1px dashed rgba(211,191,162,0.35)', background: 'rgba(211,191,162,0.04)', color: '#d3bfa2', cursor: busy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.68rem', fontWeight: 800 }}>
          {busy ? <Loader2 size={15} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <ImagePlus size={15} />}
          {busy ? 'Uploading…' : 'Choose image'}
        </button>
      )}
      <div style={{ fontSize: '0.5rem', color: err ? '#c9806a' : '#777', marginTop: 5 }}>{err || `${hint}. Leave empty to use our default creative.`}</div>
    </div>
  );
}
