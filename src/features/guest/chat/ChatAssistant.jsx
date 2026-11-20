/* Pratyeksha Concierge — full-screen chat. Lazy-loaded from CustomerHome, so it costs the home screen nothing until opened.
 * The conversation is answered on-device by chatEngine.js from the live restaurant data the home screen already holds. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, RotateCcw, MapPin, Phone, Navigation, ChevronRight, Copy, Check, Clock, Sparkles, CalendarCheck, ShoppingBag, Armchair, Tag, ThumbsUp, ThumbsDown } from 'lucide-react';
import { createEngine } from './chatEngine.js';
import { ArtTile, Orb, PlaceBanner } from './chatArt.jsx';
import { fx } from '../customerFx.jsx';
import './chat.css';

const STORE_KEY = 'px_chat_v1';
const MAX_MSGS = 40;

const UI = {
  en: {
    title: 'Concierge', online: (n) => `Knows ${n} ${n === 1 ? 'place' : 'places'} · live`, offline: 'Offline · using saved list',
    placeholder: 'Ask for a dish, a café, an offer…', send: 'Send', mic: 'Speak', listening: 'Listening…', close: 'Close chat', clear: 'New chat', lang: 'मराठी',
    openMenu: 'Open menu', reserve: 'Reserve', pickup: 'Pickup', waitlist: 'Waitlist', directions: 'Directions', call: 'Call', more: (n) => `+${n} more`,
    copied: 'Copied', copy: 'Copy code', viewPlace: 'View place', typing: 'Concierge is typing', you: 'You',
    tiles: [
      { k: 'dice', t: 'Surprise me', h: 'A great pick, open now', q: 'surprise me' },
      { k: 'ticket', t: 'Live offers', h: 'Deals & promo codes', q: 'offers' },
      { k: 'clock', t: 'Open now', h: 'Skip the closed doors', q: 'open now' },
      { k: 'pin', t: 'Near me', h: 'Closest first', q: 'near me' },
      { k: 'cup', t: 'Cafés', h: 'Coffee & quick bites', q: 'cafes' },
      { k: 'leaf', t: 'Pure veg', h: '100% vegetarian', q: 'pure veg' },
    ],
    legal: 'Answers come from restaurant-published info. Verify hours before you travel.',
    locBlocked: 'Location unavailable',
    thinking: 'Looking through menus…', today: 'Today', jump: 'Latest', statOpen: 'open now', statOffers: 'live offers', statCafes: 'cafés',
    examples: ['Try “veg biryani near me”', 'Try “cold coffee at a café”', 'Try “which places are open now?”', 'Try “best misal in Shahupuri”', 'Try “any offers today?”'],
  },
  mr: {
    title: 'कन्सिअर्ज', online: (n) => `${n} ठिकाणे माहीत · लाइव्ह`, offline: 'ऑफलाइन · जतन केलेली यादी',
    placeholder: 'डिश, कॅफे, ऑफर विचारा…', send: 'पाठवा', mic: 'बोला', listening: 'ऐकत आहे…', close: 'चॅट बंद करा', clear: 'नवीन चॅट', lang: 'English',
    openMenu: 'मेनू उघडा', reserve: 'आरक्षण', pickup: 'पिकअप', waitlist: 'वेटलिस्ट', directions: 'दिशा', call: 'कॉल', more: (n) => `+${n} आणखी`,
    copied: 'कॉपी केले', copy: 'कोड कॉपी करा', viewPlace: 'ठिकाण पहा', typing: 'कन्सिअर्ज टाइप करत आहे', you: 'तुम्ही',
    tiles: [
      { k: 'dice', t: 'सरप्राईज', h: 'आत्ता उघडे असलेले उत्तम', q: 'सरप्राईज' },
      { k: 'ticket', t: 'चालू ऑफर', h: 'सवलती व कोड', q: 'ऑफर' },
      { k: 'clock', t: 'आत्ता उघडे', h: 'बंद दारे टाळा', q: 'आत्ता उघडे' },
      { k: 'pin', t: 'जवळचे', h: 'जवळचे आधी', q: 'जवळचे' },
      { k: 'cup', t: 'कॅफे', h: 'कॉफी व स्नॅक्स', q: 'कॅफे' },
      { k: 'leaf', t: 'शुद्ध शाकाहारी', h: '१००% शाकाहारी', q: 'शाकाहारी' },
    ],
    legal: 'उत्तरे रेस्टॉरंटने दिलेल्या माहितीवर आधारित. प्रवासापूर्वी वेळा तपासा.',
    locBlocked: 'लोकेशन उपलब्ध नाही',
    thinking: 'मेनू तपासत आहे…', today: 'आज', jump: 'ताजे', statOpen: 'आत्ता उघडे', statOffers: 'चालू ऑफर', statCafes: 'कॅफे',
    examples: ['“जवळची बिर्याणी” विचारा', '“आत्ता उघडे असलेली ठिकाणे” विचारा', '“आजच्या ऑफर” विचारा', '“शाकाहारी कॅफे” विचारा'],
  },
};

function CountUp({ to }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !to) { const id = setTimeout(() => setV(to), 0); return () => clearTimeout(id); }
    let raf; const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 900); setV(Math.round(to * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{v}</>;
}
const fmtTime = (ts) => { try { return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };

const readStore = () => { try { const v = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null'); return v && Array.isArray(v.msgs) ? v : null; } catch { return null; } };
const writeStore = (msgs, memory) => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ msgs: msgs.slice(-MAX_MSGS).map((m) => ({ ...m, fresh: false })), memory })); } catch { /* storage full / blocked */ } };

/* Word-by-word reveal for the newest assistant message. */
function Reveal({ text, run, onTick }) {
  const words = useMemo(() => String(text).split(/(\s+)/), [text]);
  const [n, setN] = useState(run ? 0 : words.length);
  useEffect(() => {
    if (!run) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { const id = setTimeout(() => setN(words.length), 0); return () => clearTimeout(id); }
    let i = 0;
    const id = setInterval(() => { i += 2; setN(i); onTick?.(); if (i >= words.length) clearInterval(id); }, 22);
    return () => clearInterval(id);
  }, [run, words, onTick]);
  return <>{words.slice(0, n).join('')}</>;
}

function StatusPill({ t, kit, tr, now }) {
  const l = kit.statusLabel(kit.openStatus(t.hours, now), tr);
  return l ? <span className={`pxc-status ${l.tone}`}><i />{l.text}</span> : null;
}

function PlaceCard({ t, kit, tr, ui, pos, now, why, onOpen, onAsk }) {
  const cafe = kit.isCafe(t);
  const offer = kit.bestOffer(t);
  const km = kit.distanceKm(pos, t);
  const area = kit.areaOf(t);
  return (
    <article className="pxc-card">
      <div className="pxc-bannerwrap">
        <PlaceBanner tenant={t} cafe={cafe} />
        {km != null && <span className="pxc-km"><MapPin size={10} />{kit.fmtKm(km)}</span>}
        {offer && <span className="pxc-ribbon"><Tag size={10} />{kit.offerValue(offer)}</span>}
      </div>
      <div className="pxc-card-body">
        <h4 title={t.name}>{t.name}</h4>
        <div className="pxc-meta">
          <span className="pxc-type">{cafe ? 'Café' : 'Restaurant'}</span>
          {t.config?.onlyVeg === true && <span className="pxc-veg">Veg</span>}
          {area && <span className="pxc-where"><MapPin size={10} />{area}{km != null ? ` · ${kit.fmtKm(km)}` : ''}</span>}
        </div>
        <StatusPill t={t} kit={kit} tr={tr} now={now} />
        {why && <p className="pxc-why">{why}</p>}
        {offer && <span className="pxc-offer"><Tag size={10} />{kit.offerValue(offer)}{offer.title ? ` · ${offer.title}` : ''}</span>}
        <div className="pxc-card-actions">
          <button type="button" className="pxc-btn primary" onClick={() => onOpen(t)}>{ui.openMenu}<ChevronRight size={14} /></button>
          <button type="button" className="pxc-btn ghost" onClick={() => onAsk(t.name)} aria-label={`${t.name}`}><Sparkles size={14} /></button>
        </div>
      </div>
    </article>
  );
}

function PlaceDetail({ t, kit, tr, ui, pos, now, onOpen }) {
  const cafe = kit.isCafe(t);
  const km = kit.distanceKm(pos, t);
  const phone = String(t.contact || t.phone || '').trim();
  const callHref = phone.replace(/\D/g, '').length >= 7 ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';
  const f = t.config?.customerFeatures || {};
  const addr = kit.addressLine(t);
  const offers = (t.activeOffers || []).slice(0, 2);
  return (
    <article className="pxc-detail">
      <PlaceBanner tenant={t} cafe={cafe} height={118} />
      <div className="pxc-detail-body">
        <div className="pxc-detail-head">
          <h4>{t.name}</h4>
          <StatusPill t={t} kit={kit} tr={tr} now={now} />
        </div>
        {addr && <p className="pxc-addr"><MapPin size={12} />{addr}{km != null ? ` · ${kit.fmtKm(km)}` : ''}</p>}
        {t.hours && <p className="pxc-addr"><Clock size={12} />{tr.monFri} {kit.hoursRange(t.hours.weekday)} · {tr.satSun} {kit.hoursRange(t.hours.weekend)}</p>}
        {offers.map((o, i) => <span key={i} className="pxc-offer wide"><Tag size={11} />{kit.offerValue(o)}{o.title ? ` · ${o.title}` : ''}</span>)}
        <div className="pxc-chiprow">
          {f.reservation !== false && <button type="button" className="pxc-mini" onClick={() => onOpen(t, 'reservation')}><CalendarCheck size={12} />{ui.reserve}</button>}
          {f.pickup !== false && <button type="button" className="pxc-mini" onClick={() => onOpen(t, 'pickup')}><ShoppingBag size={12} />{ui.pickup}</button>}
          {f.waitlist !== false && <button type="button" className="pxc-mini" onClick={() => onOpen(t, 'waitlist')}><Armchair size={12} />{ui.waitlist}</button>}
        </div>
        <div className="pxc-card-actions">
          <button type="button" className="pxc-btn primary" onClick={() => onOpen(t)}>{ui.openMenu}<ChevronRight size={14} /></button>
          {kit.hasPlace?.(t) && <a className="pxc-btn ghost" href={kit.directionsUrl(t)} target="_blank" rel="noopener noreferrer" aria-label={ui.directions}><Navigation size={14} /></a>}
          {callHref && <a className="pxc-btn ghost" href={callHref} aria-label={ui.call}><Phone size={14} /></a>}
        </div>
      </div>
    </article>
  );
}

function OfferTicket({ item, t, kit, tr, ui, onOpen }) {
  const [done, setDone] = useState(false);
  const code = item.offer?.code ? String(item.offer.code).toUpperCase() : '';
  const copy = async () => { try { await navigator.clipboard.writeText(code); setDone(true); fx.tap?.(); setTimeout(() => setDone(false), 1600); } catch { /* clipboard blocked */ } };
  const terms = kit.offerTerms(item.offer, tr);
  return (
    <div className="pxc-ticket">
      <div className="pxc-ticket-val"><b>{kit.offerValue(item.offer)}</b></div>
      <div className="pxc-ticket-main">
        <strong>{item.offer.title || t.name}</strong>
        <span>{t.name}</span>
        {terms && <small>{terms}</small>}
        <div className="pxc-ticket-act">
          <button type="button" className="pxc-mini gold" onClick={() => onOpen(t)}>{ui.viewPlace}</button>
          {code && <button type="button" className="pxc-mini" onClick={copy}>{done ? <Check size={12} /> : <Copy size={12} />}{done ? ui.copied : code}</button>}
        </div>
      </div>
    </div>
  );
}

function Steps({ title, steps }) {
  return (
    <div className="pxc-steps">
      {title && <h5>{title}</h5>}
      <ol>
        {steps.map(([h, p], i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i, type: 'spring', stiffness: 260, damping: 24 }}>
            <span className="pxc-num">{i + 1}</span><div><b>{h}</b><p>{p}</p></div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

export default function ChatAssistant({ tenants, menu, pos: posProp, lang, kit, favs, guestName, online = true, onClose, onOpenTenant, onShown, onLang, onPos }) {
  const ui = UI[lang === 'mr' ? 'mr' : 'en'];
  const tr = kit.L[lang === 'mr' ? 'mr' : 'en'];
  const engine = useMemo(() => createEngine(kit), [kit]);
  const byId = useMemo(() => new Map(tenants.map((t) => [t.tenantId, t])), [tenants]);

  const [saved] = useState(readStore);
  const idRef = useRef(saved ? saved.msgs.length + 1 : 1);
  const [msgs, setMsgs] = useState(saved?.msgs || []);
  const [memory, setMemory] = useState(saved?.memory || {});
  const [typing, setTyping] = useState(false);
  const [suggest, setSuggest] = useState(null);
  const [text, setText] = useState('');
  const [pos, setPos] = useState(posProp || null);
  const [listening, setListening] = useState(false);
  const [away, setAway] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [phIdx, setPhIdx] = useState(0);
  const [now] = useState(() => Date.now());
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const stick = useRef(true);
  const timers = useRef([]);
  const memRef = useRef(memory);
  useEffect(() => { memRef.current = memory; }, [memory]);
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

  const welcome = useMemo(() => engine.welcome({ lang, name: guestName, now }), [engine, lang, guestName, now]);
  const empty = msgs.length === 0;
  const heroStats = useMemo(() => {
    const n = now;
    const open = tenants.filter((t) => kit.statusLabel(kit.openStatus(t.hours, n), kit.L[lang === 'mr' ? 'mr' : 'en'])?.tone === 'open').length;
    return { open, offers: tenants.filter((t) => kit.bestOffer(t)).length, cafes: tenants.filter((t) => kit.isCafe(t)).length };
  }, [tenants, kit, lang, now]);
  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => i + 1), 3600);
    return () => clearInterval(id);
  }, []);

  const toBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);
  useEffect(() => { toBottom(true); }, [msgs.length, typing, toBottom]);
  useEffect(() => { toBottom(false); }, [toBottom]);
  useEffect(() => { writeStore(msgs, memory); }, [msgs, memory]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // Keep the composer above the on-screen keyboard (iOS/Android visual viewport).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const root = scrollRef.current?.closest('.pxc-root');
    const fit = () => { if (root) root.style.setProperty('--pxc-h', `${Math.round(vv.height)}px`); toBottom(false); };
    fit();
    vv.addEventListener('resize', fit);
    return () => vv.removeEventListener('resize', fit);
  }, [toBottom]);

  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) inputRef.current?.focus({ preventScroll: true });
  }, []);

  const push = useCallback((m) => { const msg = { id: idRef.current++, ts: Date.now(), ...m }; setMsgs((prev) => [...prev, msg].slice(-MAX_MSGS)); return msg; }, []);

  const answer = useCallback((q, mem, p) => {
    let out;
    try { out = engine.reply(q, { tenants, menu, pos: p, lang, name: guestName, favs, now: Date.now() }, mem); } catch { out = { blocks: [{ t: 'text', text: lang === 'mr' ? 'काहीतरी चुकले. पुन्हा प्रयत्न करा.' : 'Something went wrong. Please try again.' }], suggest: [], memory: mem }; }
    return out;
  }, [engine, tenants, menu, lang, guestName, favs]);

  const requestLocation = useCallback((pendingText, mem) => new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (g) => { const p = { lat: g.coords.latitude, lng: g.coords.longitude }; setPos(p); onPos?.(p); resolve(p); },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 120000 }
    );
    void pendingText; void mem;
  }), [onPos]);

  const deliver = useCallback((out) => {
    push({ role: 'bot', blocks: out.blocks, fresh: true });
    try { const ids = [...new Set((out.blocks || []).flatMap((b) => (b.ids ? b.ids.slice(0, 6) : b.id ? [b.id] : [])))]; if (ids.length) onShown?.(ids); } catch { /* ignore */ }
    setMemory(out.memory || {});
    setSuggest(out.suggest || []);
    setTyping(false);
  }, [push, onShown]);

  const send = useCallback((raw) => {
    const q = String(raw ?? text).trim();
    if (!q || typing) return;
    fx.tap?.();
    setText('');
    stick.current = true;
    push({ role: 'user', text: q });
    setSuggest(null);
    setTyping(true);
    const delay = 380 + Math.min(q.length * 9, 520);
    const id = setTimeout(async () => {
      const mem = memRef.current;
      let out = answer(q, mem, posRef.current);
      if (out.wantsLocation) {
        deliver(out);
        setTyping(true);
        const p = await requestLocation(q, mem);
        const again = p
          ? answer(q, { ...out.memory, pending: '' }, p)
          : { blocks: [{ t: 'text', text: engine.dict[lang === 'mr' ? 'mr' : 'en'].locDenied }], suggest: out.suggest, memory: { ...out.memory, pending: '' } };
        if (!p) {
          const fallback = answer(q.replace(/near ?me|nearby|nearest|closest|जवळ\S*/gi, '').trim() || 'surprise me', { ...out.memory, pending: '' }, null);
          again.blocks = [...again.blocks, ...fallback.blocks.filter((b) => b.t !== 'text' || fallback.blocks.length === 1)];
          again.suggest = fallback.suggest;
        }
        const id2 = setTimeout(() => deliver(again), 420);
        timers.current.push(id2);
        return;
      }
      deliver(out);
    }, delay);
    timers.current.push(id);
  }, [text, typing, push, answer, deliver, requestLocation, engine, lang]);

  const rate = useCallback((id, v) => { setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, fb: m.fb === v ? null : v } : m))); fx.tap?.(); }, []);
  const copyMsg = useCallback(async (m) => {
    const txt = (m.blocks || []).filter((b) => b.t === 'text').map((b) => b.text).join('\n');
    try { await navigator.clipboard.writeText(txt); setCopiedId(m.id); fx.tap?.(); setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1500); } catch { /* clipboard blocked */ }
  }, []);

  const clearChat = () => {
    timers.current.forEach(clearTimeout);
    setMsgs([]); setMemory({}); setSuggest(null); setTyping(false); stick.current = true;
    try { sessionStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    fx.tap?.();
  };

  const speechCtor = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const startVoice = () => {
    if (!speechCtor || listening) return;
    try {
      const rec = new speechCtor();
      rec.lang = lang === 'mr' ? 'mr-IN' : 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = (e) => { const s = e.results?.[0]?.[0]?.transcript; if (s) send(s.replace(/[.!?]+$/, '')); };
      rec.onend = () => setListening(false); rec.onerror = () => setListening(false);
      setListening(true); rec.start();
    } catch { setListening(false); }
  };

  const onScroll = () => { const el = scrollRef.current; if (!el) return; const gap = el.scrollHeight - el.scrollTop - el.clientHeight; stick.current = gap < 90; setAway(gap > 220); };
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
    if (e.key === 'Escape') onClose();
  };
  const grow = (el) => { if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 112)}px`; };
  useEffect(() => { if (!text) grow(inputRef.current); }, [text]);

  const lastBotId = [...msgs].reverse().find((m) => m.role === 'bot')?.id;
  const open = (t, service) => { onOpenTenant(t, 'chat', service); };

  const renderBlock = (b, i, m) => {
    if (b.t === 'text') return <p key={i} className="pxc-text"><Reveal text={b.text} run={m.fresh && m.id === lastBotId} onTick={toBottom} /></p>;
    if (b.t === 'steps') return <Steps key={i} title={b.title} steps={b.steps} />;
    if (b.t === 'place') { const t = byId.get(b.id); return t ? <PlaceDetail key={i} t={t} kit={kit} tr={tr} ui={ui} pos={pos} now={now} onOpen={open} /> : null; }
    if (b.t === 'places') {
      const list = b.ids.map((id) => byId.get(id)).filter(Boolean);
      return (
        <div key={i} className="pxc-rail" role="list">
          {list.map((t, k) => (
            <motion.div role="listitem" key={t.tenantId} className="pxc-rail-item" initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.07 * k, type: 'spring', stiffness: 240, damping: 22 }}>
              <PlaceCard t={t} kit={kit} tr={tr} ui={ui} pos={pos} now={now} why={b.why?.[t.tenantId]} onOpen={open} onAsk={(n) => send(`tell me about ${n}`)} />
            </motion.div>
          ))}
          {b.more > 0 && <button type="button" className="pxc-more" onClick={() => send('more')}><span>{ui.more(b.more)}</span><ChevronRight size={16} /></button>}
        </div>
      );
    }
    if (b.t === 'offers') {
      return (
        <div key={i} className="pxc-tickets">
          {b.items.map((it, k) => { const t = byId.get(it.id); return t ? (
            <motion.div key={`${it.id}-${k}`} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * k, type: 'spring', stiffness: 250, damping: 24 }}>
              <OfferTicket item={it} t={t} kit={kit} tr={tr} ui={ui} onOpen={open} />
            </motion.div>
          ) : null; })}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div className="pxc-root" role="dialog" aria-modal="true" aria-label={ui.title} data-customer
      initial={{ opacity: 0, y: 36, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 28 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
      <div className="pxc-aurora" aria-hidden="true"><i /><i /><i /></div>

      <header className="pxc-head">
        <button type="button" className="pxc-icon" onClick={onClose} aria-label={ui.close}><X size={18} /></button>
        <Orb size={38} busy={typing} />
        <div className="pxc-title">
          <strong>{ui.title}</strong>
          <span><i className={online ? 'on' : 'off'} />{online ? ui.online(tenants.length) : ui.offline}</span>
        </div>
        <button type="button" className="pxc-icon wide" onClick={() => onLang(lang === 'mr' ? 'en' : 'mr')} aria-label={ui.lang}>{ui.lang}</button>
        <button type="button" className="pxc-icon" onClick={clearChat} aria-label={ui.clear} disabled={empty}><RotateCcw size={16} /></button>
      </header>

      <div className="pxc-scroll" ref={scrollRef} onScroll={onScroll} role="log" aria-live="polite" aria-relevant="additions">
        <div className="pxc-col">
          <AnimatePresence initial={false}>
            {empty && (
              <motion.section key="hero" className="pxc-hero" exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.25 }}>
                <motion.div className="pxc-hero-orb" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}><Orb size={96} /></motion.div>
                <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>{welcome.text.split('!')[0]}!</motion.h2>
                <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>{welcome.text.split('!').slice(1).join('!').trim()}</motion.p>
                <motion.div className="pxc-stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  {[[heroStats.open, ui.statOpen, 'live'], [heroStats.offers, ui.statOffers, ''], [heroStats.cafes, ui.statCafes, '']].filter(([v]) => v > 0).map(([v, l, c]) => (
                    <span key={l} className={`pxc-stat ${c}`}><b><CountUp to={v} /></b>{l}</span>
                  ))}
                </motion.div>
                <div className="pxc-tiles">
                  {ui.tiles.map((tile, i) => (
                    <motion.button type="button" key={tile.k} className="pxc-tile" onClick={() => send(tile.q)}
                      initial={{ opacity: 0, y: 22, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3 + i * 0.07, type: 'spring', stiffness: 230, damping: 20 }} whileTap={{ scale: 0.96 }}>
                      <ArtTile kind={tile.k} size={52} />
                      <span><b>{tile.t}</b><small>{tile.h}</small></span>
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {msgs.length > 0 && <div className="pxc-day"><span>{ui.today}</span></div>}
          {msgs.map((m, idx) => (
            <motion.div key={m.id} className={`pxc-msg ${m.role}`} initial={m.fresh || m.role === 'user' ? { opacity: 0, y: 14, scale: 0.98 } : false} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
              {m.role === 'bot' && (msgs[idx - 1]?.role !== 'bot') && <span className="pxc-av"><Orb size={26} /></span>}
              {m.role === 'bot' && msgs[idx - 1]?.role === 'bot' && <span className="pxc-av ghost" />}
              <div className="pxc-bubble">
                {m.role === 'user' ? <p className="pxc-text">{m.text}</p> : m.blocks.map((b, i) => renderBlock(b, i, m))}
                {m.ts && <time className="pxc-time" dateTime={new Date(m.ts).toISOString()}>{fmtTime(m.ts)}</time>}
                {m.role === 'bot' && m.blocks?.some((b) => b.t === 'text') && (
                  <div className="pxc-actions" role="group" aria-label="Message actions">
                    <button type="button" onClick={() => copyMsg(m)} aria-label={ui.copied}>{copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}</button>
                    <button type="button" className={m.fb === 'up' ? 'on' : ''} onClick={() => rate(m.id, 'up')} aria-pressed={m.fb === 'up'} aria-label="Helpful"><ThumbsUp size={12} /></button>
                    <button type="button" className={m.fb === 'down' ? 'on down' : ''} onClick={() => rate(m.id, 'down')} aria-pressed={m.fb === 'down'} aria-label="Not helpful"><ThumbsDown size={12} /></button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {typing && (
            <motion.div className="pxc-msg bot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} aria-label={ui.typing}>
              <span className="pxc-av"><Orb size={26} busy /></span>
              <div className="pxc-bubble typing"><i /><i /><i /><span className="pxc-think">{ui.thinking}</span></div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {away && !empty && (
          <motion.button key="jump" type="button" className="pxc-jump" onClick={() => { stick.current = true; toBottom(); }} initial={{ opacity: 0, y: 12, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}>
            <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />{ui.jump}
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="pxc-foot">
        <AnimatePresence>
          {!typing && (suggest?.length || empty === false) && (suggest || []).length > 0 && (
            <motion.div key="chips" className="pxc-chips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
              {suggest.map((s, i) => (
                <motion.button type="button" key={s.label} className="pxc-chip" onClick={() => send(s.send)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>{s.label}</motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <form className="pxc-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
          {!text && !listening && <span className="pxc-ph" aria-hidden="true"><span key={phIdx % (ui.examples.length + 1)}>{(phIdx % (ui.examples.length + 1)) === 0 ? ui.placeholder : ui.examples[(phIdx % (ui.examples.length + 1)) - 1]}</span></span>}
          <textarea ref={inputRef} rows={1} value={text} maxLength={300} placeholder={listening ? ui.listening : (text ? '' : ' ')} aria-label={ui.placeholder}
            onChange={(e) => { setText(e.target.value); grow(e.target); }} onKeyDown={onKey} enterKeyHint="send" autoComplete="off" autoCorrect="off" />
          {speechCtor && !text && <button type="button" className={`pxc-roundbtn${listening ? ' live' : ''}`} onClick={startVoice} aria-label={ui.mic}><Mic size={18} /></button>}
          <AnimatePresence>
            {text.trim() && (
              <motion.button key="send" type="submit" className="pxc-roundbtn gold" aria-label={ui.send} disabled={typing}
                initial={{ scale: 0.4, opacity: 0, rotate: -40 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}><Send size={17} /></motion.button>
            )}
          </AnimatePresence>
        </form>
        <p className="pxc-legal">{ui.legal}</p>
      </footer>
    </motion.div>
  );
}
