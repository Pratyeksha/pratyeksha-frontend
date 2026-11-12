import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Minus, Trash2, Pencil, X, Search, Loader2, AlertTriangle, Layers } from 'lucide-react';
import { API_BASE_URL } from './apiBase.js';

const GOLD = '#d3bfa2', GOLD2 = '#8a704d', BG = '#14110c', BORDER = 'rgba(211,191,162,0.25)';
const money = (n) => Number(n || 0).toFixed(2).replace(/\.00$/, '');
const inp = { background: '#0d0b08', color: '#f7f3eb', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', width: '100%' };
const btn = (primary, disabled) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, border: primary ? 'none' : `1px solid ${BORDER}`, background: primary ? GOLD : 'transparent', color: primary ? '#14110c' : GOLD, fontWeight: 800, fontSize: 12, letterSpacing: 0.4, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 });
const unitPrice = (m, portion) => Number(portion === 'Half' ? m.priceHalf : portion === 'Full' ? (m.priceFull || m.price) : (m.price || m.priceFull)) || 0;
const portionsOf = (m) => [...(m.priceHalf ? ['Half'] : []), ...((m.priceFull && m.price && m.priceFull !== m.price) || (m.priceFull && m.priceHalf) ? ['Full'] : [])];

function Editor({ tenantId, menuItems, combo, onClose, onSaved }) {
  const [name, setName] = useState(combo?.name || '');
  const [desc, setDesc] = useState(combo?.description || '');
  const [price, setPrice] = useState(combo ? String(combo.price) : '');
  const [lines, setLines] = useState(() => (combo?.items || []).map((i) => ({ menuItemId: i.menuItemId, portion: i.portion || '', quantity: i.quantity })));
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const byId = useMemo(() => new Map(menuItems.map((m) => [String(m._id), m])), [menuItems]);
  const normal = useMemo(() => lines.reduce((s, l) => { const m = byId.get(String(l.menuItemId)); return s + (m ? unitPrice(m, l.portion) * l.quantity : 0); }, 0), [lines, byId]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return menuItems.filter((m) => m.isAvailable !== false && (!t || String(m.name).toLowerCase().includes(t))).slice(0, 8);
  }, [menuItems, q]);
  const add = (m) => setLines((cur) => {
    const portion = portionsOf(m)[0] || '';
    const hit = cur.find((l) => String(l.menuItemId) === String(m._id) && l.portion === portion);
    return hit ? cur.map((l) => (l === hit ? { ...l, quantity: Math.min(10, l.quantity + 1) } : l)) : [...cur, { menuItemId: String(m._id), portion, quantity: 1 }];
  });
  const patchLine = (i, p) => setLines((cur) => cur.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const num = Number(price);
  const tooHigh = lines.length > 0 && Number.isFinite(num) && num >= normal && normal > 0;
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { name, description: desc, price: num, items: lines };
      if (combo) await axios.patch(`${API_BASE_URL}/admin/combos/${encodeURIComponent(tenantId)}/${combo._id}`, body);
      else await axios.post(`${API_BASE_URL}/admin/combos/${encodeURIComponent(tenantId)}`, body);
      onSaved();
    } catch (e) { setErr(e?.response?.data?.error || 'Could not save the combo'); } finally { setBusy(false); }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Combo editor" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100003, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(680px,100%)', maxHeight: '94vh', overflowY: 'auto', background: BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 18, color: '#f7f3eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: GOLD }}>{combo ? 'EDIT COMBO' : 'NEW COMBO'}</div><div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} aria-label="Close" style={{ ...btn(false), padding: 7 }}><X size={16} /></button>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <input style={inp} placeholder="Combo name, e.g. Thali for Two" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          <input style={inp} placeholder="Short description (optional)" maxLength={200} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.5, color: GOLD2, margin: '16px 0 6px' }}>DISHES IN THIS COMBO</div>
        {lines.length === 0 && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Search below and tap a dish to add it.</div>}
        {lines.map((l, i) => {
          const m = byId.get(String(l.menuItemId)); const ps = m ? portionsOf(m) : [];
          return (
            <div key={`${l.menuItemId}-${l.portion}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 6, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{m ? m.name : 'Removed dish'}<span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>₹{m ? money(unitPrice(m, l.portion)) : 0} each</span></div>
              {ps.length > 0 && <select value={l.portion} onChange={(e) => patchLine(i, { portion: e.target.value })} style={{ ...inp, width: 90, padding: '6px' }}><option value="">Regular</option>{ps.map((p) => <option key={p} value={p}>{p}</option>)}</select>}
              <button type="button" aria-label="Fewer" style={{ ...btn(false), padding: 6 }} onClick={() => patchLine(i, { quantity: Math.max(1, l.quantity - 1) })}><Minus size={13} /></button>
              <span style={{ width: 18, textAlign: 'center', fontWeight: 800 }}>{l.quantity}</span>
              <button type="button" aria-label="More" style={{ ...btn(false), padding: 6 }} onClick={() => patchLine(i, { quantity: Math.min(10, l.quantity + 1) })}><Plus size={13} /></button>
              <button type="button" aria-label="Remove dish" style={{ ...btn(false), padding: 6, color: '#e0907a' }} onClick={() => setLines((c) => c.filter((_, k) => k !== i))}><Trash2 size={13} /></button>
            </div>
          );
        })}
        <div style={{ position: 'relative', marginTop: 8 }}>
          <Search size={14} color={GOLD2} style={{ position: 'absolute', left: 10, top: 12 }} />
          <input style={{ ...inp, paddingLeft: 32 }} placeholder="Search your menu…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {results.map((m) => <button key={m._id} type="button" onClick={() => add(m)} style={{ ...btn(false), padding: '6px 10px', fontSize: 11.5 }}><Plus size={12} /> {m.name} · ₹{money(m.price || m.priceFull || m.priceHalf)}</button>)}
          {results.length === 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>No dishes match.</span>}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', margin: '16px 0 4px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}><div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.5, color: GOLD2, marginBottom: 6 }}>COMBO PRICE (₹)</div><input style={inp} type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', paddingBottom: 10 }}>Dishes normally cost <b style={{ color: GOLD }}>₹{money(normal)}</b>{Number.isFinite(num) && num > 0 && num < normal ? <> · guests save <b style={{ color: '#7fc79a' }}>₹{money(normal - num)}</b></> : null}</div>
        </div>
        {tooHigh && <div style={{ fontSize: 12, color: '#e0c48f' }}>The combo price must be lower than the dishes’ normal total (₹{money(normal)}).</div>}
        {err && <div role="alert" style={{ marginTop: 10, color: '#e0907a', fontSize: 12.5, display: 'flex', gap: 8 }}><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} /> {err}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" style={{ ...btn(true, busy || !lines.length || tooHigh), flex: 1 }} disabled={busy || !lines.length || tooHigh} onClick={save}>{busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null} {combo ? 'Save changes' : 'Create combo'}</button>
          <button type="button" style={btn(false)} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/** Operator ▸ Marketing ▸ Combos: bundles of existing dishes at a special price, shown to guests in the menu app. */
export default function ComboBuilder({ tenantId, menuItems = [], notify }) {
  const [combos, setCombos] = useState(null);
  const [edit, setEdit] = useState(undefined);       // undefined = closed, null = new, object = editing
  const load = useCallback(() => { axios.get(`${API_BASE_URL}/admin/combos/${encodeURIComponent(tenantId)}`).then((r) => setCombos(Array.isArray(r.data) ? r.data : [])).catch(() => setCombos([])); }, [tenantId]);
  useEffect(() => { load(); }, [load]);
  const toggle = async (c) => { try { await axios.patch(`${API_BASE_URL}/admin/combos/${encodeURIComponent(tenantId)}/${c._id}`, { isActive: !c.isActive }); load(); } catch (e) { notify && notify(e?.response?.data?.error || 'Could not update', 'error'); } };
  const del = async (c) => {
    if (!window.confirm(`Delete the combo “${c.name}”? Guests will no longer see it.`)) return;
    try { await axios.delete(`${API_BASE_URL}/admin/combos/${encodeURIComponent(tenantId)}/${c._id}`); notify && notify('Combo deleted'); load(); } catch (e) { notify && notify(e?.response?.data?.error || 'Could not delete', 'error'); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Layers size={18} color={GOLD} /><div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: GOLD }}>COMBOS</div>
        <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)', minWidth: 200 }}>Bundle dishes you already sell at a special price. Active combos appear in a “Combos” section of the guest menu.</div>
        <button type="button" style={btn(true)} onClick={() => setEdit(null)}><Plus size={14} /> New combo</button>
      </div>
      {combos === null && <Loader2 size={20} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />}
      {combos && combos.length === 0 && <div style={{ padding: 24, textAlign: 'center', border: `1px dashed ${BORDER}`, borderRadius: 14, color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>No combos yet. Create one to boost your average order value.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
        {(combos || []).map((c) => (
          <div key={c._id} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, background: 'rgba(211,191,162,0.04)', opacity: c.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#f7f3eb' }}>{c.name}</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: GOLD, cursor: 'pointer' }}><input type="checkbox" checked={c.isActive} onChange={() => toggle(c)} /> {c.isActive ? 'On' : 'Off'}</label>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '6px 0', lineHeight: 1.5 }}>{c.items.map((i) => `${i.quantity}× ${i.name}`).join(' + ')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: GOLD }}>₹{money(c.price)}</span>
              <span style={{ fontSize: 12, textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)' }}>₹{money(c.originalPrice)}</span>
              {c.savings > 0 && <span style={{ fontSize: 11, color: '#7fc79a' }}>save ₹{money(c.savings)}</span>}
            </div>
            {!c.available && c.isActive && <div style={{ marginTop: 8, fontSize: 11.5, color: '#e0c48f', display: 'flex', gap: 6 }}><AlertTriangle size={13} style={{ flexShrink: 0 }} /> Hidden from guests: a dish in this combo is unavailable.</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" style={{ ...btn(false), flex: 1 }} onClick={() => setEdit(c)}><Pencil size={13} /> Edit</button>
              <button type="button" style={{ ...btn(false), color: '#e0907a' }} onClick={() => del(c)} aria-label={`Delete ${c.name}`}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
      {edit !== undefined && <Editor tenantId={tenantId} menuItems={menuItems} combo={edit} onClose={() => setEdit(undefined)} onSaved={() => { setEdit(undefined); notify && notify('Combo saved'); load(); }} />}
    </div>
  );
}
