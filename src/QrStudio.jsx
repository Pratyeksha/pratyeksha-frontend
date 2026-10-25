import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { zipSync, strToU8 } from 'fflate';
import API_BASE_URL from './apiBase.js';
import { renderPoster, withDpi, posterFileName, POSTER } from './qrPoster.js';
import fontUrl from '@fontsource/roboto-condensed/files/roboto-condensed-latin-700-normal.woff2?url';

/* Master Admin → QR Studio
   Generates the signed, tenant-specific table QR posters (+ one counter "CT" poster) on the Pratyeksha template, entirely in
   the browser. The signatures come from the backend (HMAC with the server secret) — this screen never sees the secret.
   Access: the platform master key (MASTER_ADMIN_KEY on the server), kept only in sessionStorage for this tab. */

const BASE_URL = API_BASE_URL;
const KEY_NAME = 'px_master_key';
const P = { bg: '#141416', card: '#1b1b1e', card2: '#232327', line: 'rgba(211,191,162,.16)', gold: '#d3bfa2', goldDim: '#8a704d', text: '#ece6da', muted: '#9a9486', sage: '#93ab8d', danger: '#d0806f' };
const card = { background: P.card, border: `1px solid ${P.line}`, borderRadius: 14, padding: 18 };
const btn = (primary, disabled) => ({ padding: '10px 16px', borderRadius: 10, border: primary ? 'none' : `1px solid ${P.line}`, background: primary ? 'linear-gradient(135deg,#e6d6b8,#d3bfa2 45%,#b99f78)' : 'transparent', color: primary ? '#1a1612' : P.gold, fontWeight: 700, fontSize: 13, letterSpacing: .3, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1 });

let assetsPromise = null;
function loadAssets() {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      const face = new FontFace(POSTER.fontFamily, `url(${fontUrl})`, { weight: '700' });
      await face.load(); document.fonts.add(face);
      const img = new Image(); img.src = '/qr-studio/template.png';
      await img.decode();
      return img;
    })().catch((e) => { assetsPromise = null; throw e; });
  }
  return assetsPromise;
}
const mkCanvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const canvasPng = (c) => new Promise((res, rej) => c.toBlob(async (b) => { try { res(withDpi(new Uint8Array(await b.arrayBuffer()), 300)); } catch (e) { rej(e); } }, 'image/png'));
const save = (bytes, name, type) => { const url = URL.createObjectURL(new Blob([bytes], { type })); const a = Object.assign(document.createElement('a'), { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); };

export default function QrStudio() {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem(KEY_NAME) || ''; } catch { return ''; } });
  const [keyInput, setKeyInput] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [tenants, setTenants] = useState(null);
  const [query, setQuery] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [thumbs, setThumbs] = useState({});
  const [verified, setVerified] = useState({});
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const gen = useRef(0);

  const headers = useMemo(() => ({ 'x-master-key': key }), [key]);
  const signOut = () => { try { sessionStorage.removeItem(KEY_NAME); } catch { /* ignore */ } setKey(''); setTenants(null); setData(null); setTenantId(''); };

  const loadTenants = useCallback(async () => {
    try {
      const r = await axios.get(`${BASE_URL}/master/qr-studio/tenants`, { headers });
      setTenants(r.data.tenants || []); setAuthErr('');
    } catch (e) {
      const d = e?.response?.data;
      if (e?.response?.status === 401 || e?.response?.status === 503) { setAuthErr(d?.error || 'Master key rejected.'); signOut(); }
      else setErr(d?.error || 'Could not load restaurants.');
    }
  }, [headers]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (key) loadTenants(); }, [key, loadTenants]);

  const unlock = (e) => { e.preventDefault(); const k = keyInput.trim(); if (!k) return; try { sessionStorage.setItem(KEY_NAME, k); } catch { /* memory only */ } setKey(k); setKeyInput(''); };

  // Load a tenant's signed links and render low-res previews + a server-side verification for every one.
  useEffect(() => {
    if (!tenantId || !key) return;
    const run = ++gen.current; setData(null); setThumbs({}); setVerified({}); setErr('');
    (async () => {
      try {
        const [r, tpl] = await Promise.all([axios.get(`${BASE_URL}/master/qr-studio/${encodeURIComponent(tenantId)}`, { headers }), loadAssets()]);
        if (run !== gen.current) return;
        setData(r.data);
        const items = [...r.data.tables.map(t => ({ label: t.label, url: t.url })), { label: 'CT', url: r.data.counter.url }];
        for (const it of items) {
          if (run !== gen.current) return;
          const c = renderPoster({ url: it.url, label: it.label, template: tpl, createCanvas: mkCanvas, scale: 0.5 });
          setThumbs(p => ({ ...p, [it.label]: c.toDataURL('image/jpeg', 0.82) }));
          const u = new URL(it.url);
          axios.get(`${BASE_URL}/qr/verify`, { params: { tenantId: u.pathname.slice(1), table: u.searchParams.get('table'), sig: u.searchParams.get('sig') } })
            .then(v => run === gen.current && setVerified(p => ({ ...p, [it.label]: !!v.data?.valid }))).catch(() => run === gen.current && setVerified(p => ({ ...p, [it.label]: false })));
          await new Promise(r2 => setTimeout(r2, 0));
        }
      } catch (e) { if (run === gen.current) setErr(e?.response?.data?.error || e?.message || 'Could not generate QR codes.'); }
    })();
  }, [tenantId, key, headers]);

  const items = useMemo(() => data ? [...data.tables.map(t => ({ label: t.label, url: t.url })), { label: 'CT', url: data.counter.url }] : [], [data]);

  const downloadOne = async (it) => {
    setBusy(it.label);
    try { const tpl = await loadAssets(); const c = renderPoster({ url: it.url, label: it.label, template: tpl, createCanvas: mkCanvas, scale: 2 }); save(await canvasPng(c), posterFileName(it.label), 'image/png'); }
    catch (e) { setErr(e?.message || 'Could not create the image.'); } finally { setBusy(''); }
  };
  const downloadAll = async () => {
    if (!data) return; setBusy('ALL'); setProgress(0); setErr('');
    try {
      const tpl = await loadAssets(); const files = {};
      for (let i = 0; i < items.length; i++) {
        const c = renderPoster({ url: items[i].url, label: items[i].label, template: tpl, createCanvas: mkCanvas, scale: 2 });
        files[posterFileName(items[i].label)] = [await canvasPng(c), { level: 0 }];     // PNG is already compressed
        setProgress(Math.round(((i + 1) / items.length) * 100));
        await new Promise(r => setTimeout(r, 0));
      }
      const csv = ['label,file,url', ...items.map(it => `${it.label},${posterFileName(it.label)},${it.url}`)].join('\n');
      files['manifest.csv'] = [strToU8(csv), { level: 6 }];
      save(zipSync(files), `${data.tenantId}_qr-posters.zip`, 'application/zip');
    } catch (e) { setErr(e?.message || 'Could not build the ZIP.'); } finally { setBusy(''); setProgress(0); }
  };

  const filtered = (tenants || []).filter(t => `${t.name} ${t.tenantId}`.toLowerCase().includes(query.trim().toLowerCase()));
  const allVerified = items.length > 0 && items.every(i => verified[i.label] === true);
  const anyBad = items.some(i => verified[i.label] === false);

  if (!key) return (
    <div style={{ padding: 28, maxWidth: 520, margin: '0 auto' }}>
      <form onSubmit={unlock} style={{ ...card, display: 'grid', gap: 14 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: P.gold }}>QR Studio</div>
        <div style={{ color: P.muted, fontSize: 13, lineHeight: 1.6 }}>Signed QR credentials can be minted for any restaurant, so this tool is protected by the platform master key (<code>MASTER_ADMIN_KEY</code> on the server). It is kept only for this browser tab.</div>
        <input type="password" autoComplete="off" value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="Master key" aria-label="Master key"
          style={{ background: '#17171a', border: `1px solid ${P.line}`, borderRadius: 10, padding: '12px 14px', color: P.text, fontSize: 14, outline: 'none' }} />
        {authErr && <div role="alert" style={{ color: P.danger, fontSize: 13 }}>{authErr}</div>}
        <button type="submit" style={btn(true, !keyInput.trim())} disabled={!keyInput.trim()}>Unlock QR Studio</button>
      </form>
    </div>
  );

  return (
    <div style={{ padding: '22px clamp(14px,3vw,32px) 60px', display: 'grid', gap: 18, maxWidth: 1240, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: P.gold }}>QR Studio</div>
          <div style={{ color: P.muted, fontSize: 13, marginTop: 4 }}>Unique, signed table posters for each restaurant — plus one counter poster (CT). Print-ready PNG, 300 dpi.</div>
        </div>
        <button type="button" onClick={signOut} style={btn(false)}>Lock</button>
      </div>

      <div style={{ ...card, display: 'grid', gap: 12 }}>
        <label style={{ color: P.muted, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }} htmlFor="qs-search">Restaurant</label>
        <input id="qs-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or ID…" style={{ background: '#17171a', border: `1px solid ${P.line}`, borderRadius: 10, padding: '11px 14px', color: P.text, fontSize: 14, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 150, overflowY: 'auto' }}>
          {tenants === null ? <span style={{ color: P.muted, fontSize: 13 }}>Loading restaurants…</span> : filtered.length === 0 ? <span style={{ color: P.muted, fontSize: 13 }}>No restaurants match.</span> : filtered.map(t => (
            <button key={t.tenantId} type="button" onClick={() => setTenantId(t.tenantId)} aria-pressed={tenantId === t.tenantId}
              style={{ padding: '8px 12px', borderRadius: 999, border: `1px solid ${tenantId === t.tenantId ? P.gold : P.line}`, background: tenantId === t.tenantId ? 'rgba(211,191,162,.14)' : 'transparent', color: tenantId === t.tenantId ? P.gold : P.text, fontSize: 13, cursor: 'pointer', opacity: t.isActive ? 1 : .55 }}>
              {t.name} <span style={{ color: P.muted }}>· {t.tableCount} tables{t.isActive ? '' : ' · inactive'}</span>
            </button>))}
        </div>
      </div>

      {err && <div role="alert" style={{ ...card, borderColor: 'rgba(208,128,111,.5)', color: P.danger, fontSize: 13 }}>{err}</div>}

      {tenantId && !data && !err && <div style={{ ...card, color: P.muted, fontSize: 13 }}>Preparing signed QR codes…</div>}

      {data && (
        <>
          <div style={{ ...card, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: P.text, fontWeight: 700, fontSize: 16 }}>{data.name}</div>
              <div style={{ color: P.muted, fontSize: 12.5, marginTop: 4 }}>{data.tables.length} table QR{data.tables.length === 1 ? '' : 's'} + 1 counter QR · points to <span style={{ color: P.gold }}>{data.origin.replace(/^https?:\/\//, '')}</span></div>
              <div style={{ fontSize: 12.5, marginTop: 6, color: anyBad ? P.danger : allVerified ? P.sage : P.muted }} role="status">
                {anyBad ? 'Some codes failed server verification — do not print.' : allVerified ? `✓ All ${items.length} codes verified by the server` : `Verifying with the server… ${Object.keys(verified).length}/${items.length}`}
              </div>
              {!data.enforced && <div style={{ color: P.danger, fontSize: 12.5, marginTop: 6 }}>Server is running with unsigned QR codes allowed (ALLOW_UNSIGNED_TABLE_QR). Tampered links will NOT be rejected until that is turned off.</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {busy === 'ALL' && <span style={{ color: P.muted, fontSize: 12.5 }}>{progress}%</span>}
              <button type="button" onClick={downloadAll} disabled={!!busy || anyBad || Object.keys(thumbs).length < items.length} style={btn(true, !!busy || anyBad || Object.keys(thumbs).length < items.length)}>{busy === 'ALL' ? 'Building ZIP…' : 'Download all (ZIP)'}</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14 }}>
            {[...items].sort((a, b) => (a.label === 'CT') - (b.label === 'CT') ? (a.label === 'CT' ? -1 : 1) : String(a.label).localeCompare(String(b.label), undefined, { numeric: true })).map(it => (
              <div key={it.label} style={{ ...card, padding: 10, display: 'grid', gap: 8 }}>
                <div style={{ aspectRatio: '1024/1535', background: '#0f0f11', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {thumbs[it.label] ? <img src={thumbs[it.label]} alt={`${it.label === 'CT' ? 'Counter' : 'Table ' + it.label} QR poster`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: P.muted, fontSize: 12 }}>Rendering…</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: P.text, fontSize: 13, fontWeight: 700 }}>{it.label === 'CT' ? 'Counter (CT)' : `Table ${it.label}`}</div>
                  <span title={verified[it.label] === undefined ? 'Verifying' : verified[it.label] ? 'Verified by server' : 'Failed verification'} style={{ fontSize: 12, color: verified[it.label] === false ? P.danger : verified[it.label] ? P.sage : P.muted }}>{verified[it.label] === undefined ? '…' : verified[it.label] ? '✓' : '✕'}</span>
                </div>
                <button type="button" onClick={() => downloadOne(it)} disabled={!!busy || !thumbs[it.label]} style={{ ...btn(false, !!busy || !thumbs[it.label]), padding: '8px 10px', fontSize: 12 }}>{busy === it.label ? 'Preparing…' : 'Download PNG'}</button>
              </div>))}
          </div>
        </>
      )}
    </div>
  );
}
