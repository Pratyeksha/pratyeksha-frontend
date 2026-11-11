// Master Admin › global search (75). Opens with Ctrl/Cmd+K or the Search button; finds clients, tickets, leads,
// demo requests, plans, guest data requests and team members. Uses ONLY the Master Admin theme.
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Search, X } from 'lucide-react';
import API_BASE_URL from './apiBase.js';
import { K, useDebounced } from './masterKit.jsx';

export default function MasterSearch({ open, onClose, onGo }) {
  const [q, setQ] = useState(''); const [groups, setGroups] = useState([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [idx, setIdx] = useState(0); const inp = useRef(null);
  const dq = useDebounced(q.trim(), 250); const seq = useRef(0);
  useEffect(() => { if (open) { setQ(''); setGroups([]); setErr(''); setIdx(0); setTimeout(() => inp.current?.focus(), 30); } }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    if (dq.length < 2) { setGroups([]); setBusy(false); return undefined; }
    const my = ++seq.current; setBusy(true); setErr('');
    axios.get(`${API_BASE_URL}/admin/master/search`, { params: { q: dq } })
      .then((r) => { if (my === seq.current) { setGroups(r.data.groups || []); setIdx(0); } })
      .catch((e) => { if (my === seq.current) setErr(e?.response?.data?.error || 'Search failed'); })
      .finally(() => { if (my === seq.current) setBusy(false); });
    return undefined;
  }, [dq, open]);
  if (!open) return null;
  const flat = groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.title })));
  const go = (it) => { onGo(it.section); onClose(); };
  const key = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(flat.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter' && flat[idx]) go(flat[idx]);
  };
  let n = -1;
  return (
    <div role="dialog" aria-modal="true" aria-label="Search" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,10,0.66)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '10vh 16px 16px' }}>
      <div onKeyDown={key} style={{ width: '100%', maxWidth: 560, background: K.card, border: `1px solid ${K.goldLine}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${K.border}` }}>
          <Search size={16} color={K.gold} />
          <input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients, tickets, leads, requests…" aria-label="Search query" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: K.text, fontSize: 14 }} />
          <button type="button" onClick={onClose} aria-label="Close search" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: K.dim, display: 'grid', placeItems: 'center' }}><X size={16} /></button>
        </div>
        <div style={{ maxHeight: '55vh', overflowY: 'auto', padding: 6 }}>
          {err && <div role="alert" style={{ padding: 12, fontSize: 12.5, color: K.danger }}>{err}</div>}
          {!err && dq.length < 2 && <div style={{ padding: 16, fontSize: 12.5, color: K.faint }}>Type at least 2 letters. Use ↑ ↓ and Enter.</div>}
          {!err && dq.length >= 2 && !busy && flat.length === 0 && <div style={{ padding: 16, fontSize: 12.5, color: K.faint }}>No matches for “{dq}”.</div>}
          {groups.map((g) => (
            <div key={g.title}>
              <div style={{ padding: '8px 10px 4px', fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: K.dim, fontWeight: 700 }}>{g.title}</div>
              {g.items.map((it) => { n += 1; const me = n; const on = me === idx; return (
                <button key={`${g.title}-${it.id}`} type="button" role="option" aria-selected={on} onMouseEnter={() => setIdx(me)} onClick={() => go(it)} style={{ width: '100%', display: 'block', textAlign: 'left', cursor: 'pointer', padding: '8px 10px', borderRadius: 8, border: `1px solid ${on ? K.goldLine : 'transparent'}`, background: on ? K.goldFaint : 'transparent', fontFamily: 'inherit' }}>
                  <div style={{ fontSize: 13, color: K.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</div>
                  {it.sub && <div style={{ fontSize: 11.5, color: K.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.sub}</div>}
                </button>); })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
