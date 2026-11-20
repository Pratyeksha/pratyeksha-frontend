import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../shared/lib/apiBase.js';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const lab = { fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8f8f8f', fontWeight: 800 };
const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: '#070707', border: '1px solid rgba(211,191,162,0.2)', borderRadius: 10, color: '#ECDCB9', fontFamily: 'monospace', fontSize: 14, outline: 'none' };

/** Saves the counted drawer as the day's official close (float, cash paid out, reason for any gap) and lists recent closes. */
export default function DayCloseSaver({ tenantId, date, counted, actor }) {
  const base = `${API_BASE_URL}/admin/day-close/${encodeURIComponent(tenantId)}`;
  const [pre, setPre] = useState(null);
  const [hist, setHist] = useState({ rows: [], totals: null });
  const [float, setFloat] = useState('');
  const [out, setOut] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    if (!date) return;
    try {
      const [p, h] = await Promise.all([axios.get(`${base}/preview`, { params: { date } }), axios.get(base, { params: { limit: 7 } })]);
      setPre(p.data); setHist(h.data);
      setFloat((cur) => (cur === '' ? String(p.data.existing?.openingFloat ?? p.data.suggestedFloat ?? 0) : cur));
      if (p.data.existing) { setOut(String(p.data.existing.cashPaidOut || '')); setNote(p.data.existing.note || ''); }
    } catch { setPre(null); }
  }, [base, date]);
  useEffect(() => { load(); }, [load]);

  const f = Number(float) || 0, o = Number(out) || 0, c = counted === '' || counted == null ? null : Number(counted);
  const expected = pre ? Math.round((f + pre.cashSales - o) * 100) / 100 : null;
  const variance = c === null || expected === null ? null : Math.round((c - expected) * 100) / 100;
  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await axios.post(base, { date, openingFloat: f, cashPaidOut: o, countedCash: c, note, closedBy: actor || 'Manager' });
      setMsg({ ok: true, text: 'Day closed and saved. The owner can see it.' }); await load();
    } catch (e) { setMsg({ ok: false, text: e?.response?.data?.error || 'Could not save the close. Try again.' }); }
    finally { setBusy(false); }
  };

  if (!pre) return null;
  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(211,191,162,0.12)' }}>
      <div style={lab}>Close this day officially</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <label><span style={lab}>Opening float</span><input type="number" min="0" value={float} onChange={(e) => setFloat(e.target.value)} style={inp} /></label>
        <label><span style={lab}>Cash paid out</span><input type="number" min="0" placeholder="0" value={out} onChange={(e) => setOut(e.target.value)} style={inp} /></label>
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#b4b4b4' }}>
        <span>Expected in drawer = float + cash sales − paid out</span><b style={{ fontFamily: 'monospace', color: '#ECDCB9' }}>{money(expected)}</b>
      </div>
      {variance !== null && Math.abs(variance) > 0.5 && (
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={`Why is the drawer ${variance < 0 ? 'short' : 'over'} by ${money(Math.abs(variance))}? (required)`} style={{ ...inp, marginTop: 10, minHeight: 58, fontFamily: 'inherit', fontSize: 12.5, resize: 'vertical' }} />
      )}
      <button type="button" disabled={busy || c === null} onClick={save}
        style={{ marginTop: 12, width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(211,191,162,0.5)', background: 'linear-gradient(135deg,#e6d6b8,#d3bfa2 55%,#b99f78)', color: '#111', fontWeight: 900, fontSize: 12, letterSpacing: 1, cursor: c === null ? 'not-allowed' : 'pointer', opacity: busy || c === null ? 0.55 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {busy ? <Loader2 size={15} className="spin" /> : <Lock size={15} />} {pre.existing ? 'UPDATE SAVED CLOSE' : 'CLOSE & SAVE DAY'}
      </button>
      {c === null && <div style={{ marginTop: 6, fontSize: 11, color: '#8a8a8a' }}>Enter the cash counted above first.</div>}
      {msg && <div role="status" style={{ marginTop: 8, fontSize: 12, color: msg.ok ? '#d3bfa2' : '#e29a58', display: 'flex', gap: 6, alignItems: 'center' }}>{msg.ok && <CheckCircle2 size={14} />}{msg.text}</div>}

      {hist.rows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={lab}>Recent closes{hist.totals?.flagged ? ` · ${hist.totals.flagged} with a gap` : ''}</div>
          {hist.rows.map((r) => (
            <div key={r.date} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#b4b4b4' }} title={r.note || ''}>
              <span>{r.date} · {r.closedBy}</span><span style={{ fontFamily: 'monospace' }}>{money(r.countedCash)}</span>
              <b style={{ fontFamily: 'monospace', color: Math.abs(r.variance) < 0.5 ? '#d3bfa2' : '#e29a58' }}>{Math.abs(r.variance) < 0.5 ? 'OK' : `${r.variance > 0 ? '+' : '−'}${money(Math.abs(r.variance))}`}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
