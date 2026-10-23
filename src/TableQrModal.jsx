import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Printer, Unlock, Loader2 } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';

// Operator tool: (1) signed QR links — a guest editing ?table= in the address bar invalidates the signature;
// (2) "Release lock" for a table whose ordering guest lost their phone / cleared their browser while still seated.
export default function TableQrModal({ tenantId, onClose, notify }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busyTable, setBusyTable] = useState('');

  useEffect(() => {
    let stop = false;
    axios.get(`${API_BASE_URL}/admin/table-qr/${encodeURIComponent(tenantId)}`)
      .then(r => { if (!stop) setData(r.data); })
      .catch(e => { if (!stop) setErr(e?.response?.data?.error || 'Could not load table links'); });
    return () => { stop = true; };
  }, [tenantId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = useCallback(async (url) => {
    try { await navigator.clipboard.writeText(url); notify && notify('Link copied'); }
    catch { notify && notify('Copy failed — long-press the link instead', 'error'); }
  }, [notify]);

  const release = async (tableNumber) => {
    setBusyTable(tableNumber);
    try {
      const r = await axios.post(`${API_BASE_URL}/admin/table-lock/release`, { tenantId, tableNumber });
      notify && notify(r.data?.released ? `Table ${tableNumber} unlocked — the next guest to order becomes its ordering guest` : `Table ${tableNumber} was not locked`);
    } catch (e) { notify && notify(e?.response?.data?.error || 'Could not release the table', 'error'); }
    finally { setBusyTable(''); }
  };

  const gold = '#d3bfa2';
  return (
    <div role="dialog" aria-modal="true" aria-label="Secure table QR codes" onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} className="tqr-sheet"
        style={{ width: 'min(760px, 100%)', maxHeight: '92vh', overflowY: 'auto', background: '#0f0d0a', border: '1px solid rgba(211,191,162,0.3)', borderRadius: 18, padding: 18, color: '#fff' }}>
        <style>{`@media print{body *{visibility:hidden}.tqr-sheet,.tqr-sheet *{visibility:visible}.tqr-sheet{position:absolute;left:0;top:0;width:100%;max-height:none;background:#fff;color:#000;border:0}.tqr-noprint{display:none!important}.tqr-card{break-inside:avoid;border:1px solid #999!important}}`}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 2, color: gold }}>SECURE TABLE QR CODES</div>
          <div style={{ flex: 1 }} />
          <button type="button" className="tqr-noprint" onClick={() => window.print()} style={btn(gold)}><Printer size={13} /> PRINT</button>
          <button type="button" className="tqr-noprint" onClick={onClose} aria-label="Close" style={{ ...btn(gold), padding: 7 }}><X size={15} /></button>
        </div>
        <p className="tqr-noprint" style={{ margin: '0 0 12px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          Each code is signed for its own table. If a guest edits the table number in the link, it stops working.
          {data && !data.enforced && <> <b style={{ color: gold }}>Signed links are not being enforced yet</b> — print these, then set <code>REQUIRE_SIGNED_TABLE_QR=true</code> on the server so old unsigned codes stop working.</>}
          {data && data.enforced && <> <b style={{ color: gold }}>Enforced:</b> only these signed codes can order.</>}
        </p>
        {err && <div style={{ color: '#c9806a', fontSize: '0.75rem' }}>{err}</div>}
        {!data && !err && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: gold, fontSize: '0.75rem' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</div>}
        {data && data.tables.length === 0 && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>No tables on the floor map yet. Add tables to your floor map first.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12 }}>
          {data && data.tables.map(t => (
            <div key={t.tableNumber} className="tqr-card" style={{ border: '1px solid rgba(211,191,162,0.22)', borderRadius: 14, padding: 12, textAlign: 'center', background: 'rgba(211,191,162,0.04)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: 1.5, color: gold, marginBottom: 8 }}>TABLE {t.tableNumber}</div>
              <div style={{ background: '#fff', padding: 8, borderRadius: 10, display: 'inline-block' }}>
                <QRCodeSVG value={t.url} size={150} level="M" includeMargin={false} />
              </div>
              <div className="tqr-noprint" style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => copy(t.url)} style={btn(gold)}><Copy size={12} /> COPY LINK</button>
                <button type="button" disabled={busyTable === t.tableNumber} onClick={() => release(t.tableNumber)} title="Use only if the ordering guest cannot order any more (lost phone / cleared browser)" style={btn('#c9a35a')}>
                  {busyTable === t.tableNumber ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Unlock size={12} />} RELEASE LOCK
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const btn = (c) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, border: `1px solid ${c}55`, background: `${c}14`, color: c, fontSize: '0.58rem', fontWeight: 900, letterSpacing: 0.6, cursor: 'pointer' });
