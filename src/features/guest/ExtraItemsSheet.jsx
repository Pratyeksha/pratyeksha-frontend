import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlassWater, IceCream2, Cookie, Apple, Droplets, Milk, Candy, Coffee, Sandwich, Wind, Box,
  Search, X, Plus, Minus, ShoppingBag, ChevronUp, Trash2, ArrowRight, LayoutGrid,
} from 'lucide-react';
import { fx } from './customerFx.jsx';
import './ExtraItemsSheet.css';

const CAT_ICON = {
  'Cold Drinks': GlassWater, 'Ice Cream': IceCream2, 'Packaged Snacks': Cookie, Juices: Apple, 'Mineral Water': Droplets,
  Dairy: Milk, Sweets: Candy, Coffee, Snacks: Sandwich, Beverages: Wind, Other: Box,
};
const CAT_MR = {
  All: 'सर्व', 'Cold Drinks': 'थंड पेये', 'Ice Cream': 'आईस्क्रीम', 'Packaged Snacks': 'स्नॅक्स', Juices: 'ज्यूस', 'Mineral Water': 'पाणी',
  Dairy: 'दुग्धजन्य', Sweets: 'मिठाई', Coffee: 'कॉफी', Snacks: 'स्नॅक्स', Other: 'इतर',
};
const L = {
  en: { eyebrow: 'FROM THE COUNTER', title: 'Extra Items', sub: 'Cold drinks, ice cream, snacks & more', search: 'Search drinks, ice cream, snacks…', all: 'All', items: 'items', add: 'Add', soldOut: 'Sold out', left: 'left', onlyMore: 'only {n} more', none: 'No items found', tryCat: 'Try a different category', noRes: 'No results for', clear: 'Clear search', selected: 'selected', total: 'Estimated total', send: 'Request to waiter', sending: 'Sending…', clearAll: 'Clear all', review: 'Review', hide: 'Hide', close: 'Close', loading: 'Loading items…' },
  mr: { eyebrow: 'काउंटरवरून मागवा', title: 'अतिरिक्त वस्तू', sub: 'थंड पेये · आईस्क्रीम · स्नॅक्स', search: 'वस्तू शोधा…', all: 'सर्व', items: 'वस्तू', add: 'निवडा', soldOut: 'उपलब्ध नाही', left: 'शिल्लक', onlyMore: 'फक्त {n} शिल्लक', none: 'कोणतीही वस्तू सापडली नाही', tryCat: 'वेगळी श्रेणी निवडा', noRes: 'यासाठी निकाल नाही', clear: 'शोध साफ करा', selected: 'निवडल्या', total: 'अंदाजे रक्कम', send: 'वेटरला विनंती पाठवा', sending: 'पाठवत आहे…', clearAll: 'सर्व काढा', review: 'पहा', hide: 'लपवा', close: 'बंद करा', loading: 'वस्तू लोड होत आहेत…' },
};
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export default function ExtraItemsSheet({ open, language, items, loading, cart, setCart, category, setCategory, query, setQuery, onClose, onSend }) {
  const tr = L[language === 'mr' ? 'mr' : 'en'];
  const mr = language === 'mr';
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(null);
  const chipsRef = useRef(null);
  const searchRef = useRef(null);

  const available = useMemo(() => items.filter((i) => i.isAvailable), [items]);
  const cats = useMemo(() => ['All', ...new Set(available.map((i) => i.category || 'Other'))], [available]);
  const counts = useMemo(() => {
    const m = { All: available.length };
    available.forEach((i) => { const c = i.category || 'Other'; m[c] = (m[c] || 0) + 1; });
    return m;
  }, [available]);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => available.filter((i) => {
    if (category !== 'All' && (i.category || 'Other') !== category) return false;
    if (!q) return true;
    return String(i.name || '').toLowerCase().includes(q) || String(i.name_mr || '').toLowerCase().includes(q);
  }), [available, category, q]);
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((i) => { const c = i.category || 'Other'; (g[c] = g[c] || []).push(i); });
    return Object.entries(g);
  }, [filtered]);

  const lines = Object.entries(cart).map(([id, qty]) => ({ id, qty, item: items.find((i) => i._id === id) })).filter((l) => l.item && l.qty > 0);
  const totalQty = lines.reduce((a, l) => a + l.qty, 0);
  const totalPrice = lines.reduce((a, l) => a + num(l.item.price) * l.qty, 0);

  useEffect(() => { if (!open) { setExpanded(false); setSending(false); } }, [open]);
  useEffect(() => { if (lines.length === 0) setExpanded(false); }, [lines.length]);
  useEffect(() => {
    // keep the active chip in view
    const el = chipsRef.current?.querySelector('[aria-pressed="true"]');
    el?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [category]);

  const stockOf = (item) => (item.currentStock === null || item.currentStock === undefined ? Infinity : num(item.currentStock));
  const bump = (id) => { setFlash(id); window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 420); };
  const inc = (item) => {
    const cur = cart[item._id] || 0;
    if (cur >= stockOf(item)) { fx.error(); return; }
    setCart((p) => ({ ...p, [item._id]: cur + 1 }));
    cur === 0 ? fx.select() : fx.tap();
    bump(item._id);
  };
  const dec = (item) => {
    setCart((p) => {
      const n = { ...p };
      if ((n[item._id] || 0) <= 1) delete n[item._id]; else n[item._id] -= 1;
      return n;
    });
    fx.remove();
  };
  const nameOf = (i) => (mr && i.name_mr) || i.name;
  const close = () => { fx.tap(); onClose(); };
  const send = async () => {
    if (sending) return;
    setSending(true);
    try { await onSend(); } finally { setSending(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="xt" role="dialog" aria-modal="true" aria-label={tr.title}
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}>
          <div className="xt-glow" aria-hidden="true" />

          <header className="xt-head">
            <div className="xt-head-ico"><ShoppingBag size={20} strokeWidth={1.7} /></div>
            <div className="xt-head-txt">
              <small>{tr.eyebrow}</small>
              <h2>{tr.title}</h2>
              <p>{tr.sub}</p>
            </div>
            <button type="button" className="xt-x" onClick={close} aria-label={tr.close}><X size={17} /></button>
          </header>

          <div className="xt-search">
            <Search size={16} />
            <input ref={searchRef} type="text" inputMode="search" enterKeyHint="search" value={query} placeholder={tr.search}
              onChange={(e) => setQuery(e.target.value)} aria-label={tr.search} />
            {query && <button type="button" onClick={() => { setQuery(''); searchRef.current?.focus(); }} aria-label={tr.clear}><X size={13} /></button>}
          </div>

          <div className="xt-chips no-scrollbar" ref={chipsRef} role="tablist" aria-label="Categories">
            {cats.map((c) => {
              const Ico = c === 'All' ? LayoutGrid : (CAT_ICON[c] || Box);
              const on = category === c;
              return (
                <button key={c} type="button" role="tab" aria-pressed={on} aria-selected={on} className={`xt-chip${on ? ' on' : ''}`}
                  onClick={() => { setCategory(c); fx.tap(); }}>
                  <Ico size={13} strokeWidth={2} />
                  <span>{c === 'All' ? tr.all : (mr ? (CAT_MR[c] || c) : c)}</span>
                  <em>{counts[c] || 0}</em>
                </button>
              );
            })}
          </div>

          <div className="xt-body no-scrollbar">
            {loading && available.length === 0 ? (
              <div className="xt-empty"><div className="xt-spin" /><b>{tr.loading}</b></div>
            ) : filtered.length === 0 ? (
              <div className="xt-empty">
                <div className="xt-empty-ico"><Search size={26} strokeWidth={1.4} /></div>
                <b>{tr.none}</b>
                <span>{q ? `${tr.noRes} “${query}”` : tr.tryCat}</span>
                {q && <button type="button" className="xt-ghost" onClick={() => setQuery('')}>{tr.clear}</button>}
              </div>
            ) : (
              grouped.map(([cat, list]) => {
                const CatIco = CAT_ICON[cat] || Box;
                return (
                  <section key={cat} className="xt-group">
                    <div className="xt-group-h">
                      <span className="xt-group-ico"><CatIco size={14} strokeWidth={1.8} /></span>
                      <b>{mr ? (CAT_MR[cat] || cat) : cat}</b>
                      <i />
                      <small>{list.length} {tr.items}</small>
                    </div>
                    <div className="xt-grid">
                      {list.map((item, idx) => {
                        const qty = cart[item._id] || 0;
                        const stock = stockOf(item);
                        const out = stock <= 0;
                        const th = num(item.lowStockThreshold ?? 5);
                        const low = Number.isFinite(stock) && stock > 0 && stock <= th;
                        const remaining = stock - qty;
                        const almost = Number.isFinite(remaining) && qty > 0 && remaining > 0 && remaining <= 3;
                        const Ico = CAT_ICON[item.category] || Box;
                        const full = qty >= stock;
                        return (
                          <motion.article key={item._id} layout="position"
                            className={`xt-card${qty > 0 ? ' sel' : ''}${out ? ' out' : ''}${flash === item._id ? ' flash' : ''}`}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 8) * 0.04, type: 'spring', damping: 24 }}
                            onClick={() => { if (!out && qty === 0) inc(item); }}>
                            <div className="xt-ico"><Ico size={22} strokeWidth={1.5} />{qty > 0 && <motion.span key={qty} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="xt-count">{qty}</motion.span>}</div>
                            <div className="xt-info">
                              <b>{nameOf(item)}</b>
                              <div className="xt-meta">
                                <span className="xt-price">₹{item.price}</span>
                                {item.unit && <span className="xt-unit">/ {item.unit}</span>}
                                {out && <span className="xt-tag off">{tr.soldOut}</span>}
                                {low && !out && <span className="xt-tag warn">{stock} {tr.left}</span>}
                                {almost && <span className="xt-tag hot">{tr.onlyMore.replace('{n}', remaining)}</span>}
                              </div>
                            </div>
                            {out ? (
                              <span className="xt-na">—</span>
                            ) : qty === 0 ? (
                              <button type="button" className="xt-add" onClick={(e) => { e.stopPropagation(); inc(item); }} aria-label={`${tr.add} ${nameOf(item)}`}>
                                <Plus size={14} strokeWidth={2.6} />{tr.add}
                              </button>
                            ) : (
                              <div className="xt-step" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => dec(item)} aria-label="−"><Minus size={14} strokeWidth={2.6} /></button>
                                <motion.span key={qty} initial={{ scale: 1.35 }} animate={{ scale: 1 }}>{qty}</motion.span>
                                <button type="button" onClick={() => inc(item)} disabled={full} aria-label="+"><Plus size={14} strokeWidth={2.6} /></button>
                              </div>
                            )}
                          </motion.article>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
            <div style={{ height: lines.length ? 230 : 40 }} />
          </div>

          <AnimatePresence>
            {lines.length > 0 && (
              <motion.footer className="xt-foot" initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div className="xt-list no-scrollbar" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      {lines.map(({ id, qty, item }) => (
                        <div key={id} className="xt-line">
                          <span className="xt-line-n">{nameOf(item)}</span>
                          <span className="xt-line-p">₹{num(item.price) * qty}</span>
                          <div className="xt-step sm">
                            <button type="button" onClick={() => dec(item)} aria-label="−"><Minus size={12} strokeWidth={2.6} /></button>
                            <span>{qty}</span>
                            <button type="button" onClick={() => inc(item)} disabled={qty >= stockOf(item)} aria-label="+"><Plus size={12} strokeWidth={2.6} /></button>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="xt-clearall" onClick={() => { setCart({}); fx.remove(); }}><Trash2 size={12} />{tr.clearAll}</button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button type="button" className="xt-sum" onClick={() => { setExpanded((v) => !v); fx.tap(); }} aria-expanded={expanded}>
                  <span className="xt-sum-badge">{totalQty}</span>
                  <span className="xt-sum-txt"><b>{lines.length} {mr ? 'प्रकार' : (lines.length > 1 ? 'types' : 'type')} {tr.selected}</b><small>{expanded ? tr.hide : tr.review}</small></span>
                  <span className="xt-sum-tot"><b>₹{totalPrice.toLocaleString()}</b><small>{tr.total}</small></span>
                  <ChevronUp size={16} className={`xt-chev${expanded ? ' up' : ''}`} />
                </button>
                <button type="button" className="xt-cta" onClick={send} disabled={sending} data-fx="select">
                  <span>{sending ? tr.sending : tr.send}</span><ArrowRight size={17} strokeWidth={2.4} />
                </button>
              </motion.footer>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
