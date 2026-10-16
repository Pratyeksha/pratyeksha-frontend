import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Coffee, UtensilsCrossed, Search, Bell, ChevronRight, MapPin, Wifi, Sparkles, X, Tag,
  Heart, ScanLine, Shuffle, ShoppingBag, CalendarCheck, Clock, LayoutGrid, RotateCcw,
  Navigation, Map as MapIcon, List as ListIcon, Copy, Share2, Crosshair, ExternalLink, Check, ArrowUp, ArrowUpDown, History, Phone, WifiOff, Leaf, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import PwaInstallButton from './PwaInstallButton.jsx';
import SpoonForkIcon from './SpoonForkIcon.jsx';

import API_BASE_URL from './apiBase.js';

const BASE_URL = API_BASE_URL;
const logo = '/pratyeksha-logo.png';
const GOLD = '#d3bfa2';
const PAGE = 8;
const SORT_KEY = 'px_home_sort';
const SEARCHES_KEY = 'px_home_searches';
/** First word of the guest's remembered name (saved per outlet by the ordering app). Display only; nothing is sent anywhere. */
const readGuestFirstName = () => {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('pratyeksha_customer_history_')) continue;
      const v = JSON.parse(localStorage.getItem(k) || 'null');
      const first = String(v?.name || '').trim().split(/\s+/)[0];
      if (first && first.toLowerCase() !== 'guest') return first.charAt(0).toUpperCase() + first.slice(1);
    }
  } catch { /* storage unavailable */ }
  return '';
};
const FAV_KEY = 'px_home_favs';
const LANG_KEY = 'px_home_lang';
const FILTERS_KEY = 'px_home_filters';
const CACHE_KEY = 'px_home_cache';

/* Marathi / English strings for the directory (the guest's choice is remembered). */
const L = {
  en: {
    morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', search: 'Search', all: 'All', cafe: 'Café', dine: 'Dine',
    pickup: 'Pickup', reservation: 'Reserve', waitlist: 'Waitlist', saved: 'Saved', offers: 'Offers', veg: 'Pure veg', nearMe: 'Near me',
    allAreas: 'All areas', place: 'place', places: 'places', nearest: ' · nearest first', list: 'List', map: 'Map', nothing: 'Nothing found',
    clear: 'Clear filters', retry: 'Retry', more: 'more', recent: 'Recent', clearRecent: 'Clear', saveHint: 'Tap the heart on a place to save it',
    offlineCached: "Couldn't refresh — showing your last saved list", offline: "You're offline", directions: 'Directions', openMenu: 'Open menu', call: 'Call',
    loadFail: 'Unable to load restaurants.', locDenied: 'Allow location access to sort by distance', locTimeout: 'Could not get your location in time — try again',
    locNA: 'Location is not available on this device', locBusy: 'Location unavailable right now', finding: 'Finding you…', inArea: 'in',
    featured: 'Featured', isNew: 'New', featuredRail: 'Featured places', statOffers: 'live offers', statPickup: 'offer pickup', statReserve: 'take reservations',
    howTitle: 'How it works', how1t: 'Find', how1: 'Browse cafés & restaurants near you', how2t: 'Order', how2: 'Scan the table QR to order or reserve — no app to install',
    how3t: 'Enjoy', how3: 'Track your order and ask for the bill from your phone', hide: 'Hide', shareView: 'Share this list', linkCopied: 'Link copied',
    ownerTitle: 'Own a café or restaurant?', ownerBody: 'Get your own QR menu, table ordering, reservations and live offers — listed here for every guest.', ownerBtn: 'Get listed',
    hoursTitle: 'Opening hours', sortRec: 'Recommended', sortAz: 'A – Z', sortOffers: 'Most offers', sortSaved: 'Saved first', sort: 'Sort',
    updated: 'Updated', justNow: 'just now', minAgo: 'min ago', hrAgo: 'h ago', dayAgo: 'd ago', refresh: 'Refresh', refreshing: 'Refreshing…',
    pullHint: 'Pull to refresh', releaseHint: 'Release to refresh', suggestions: 'Suggestions', sugArea: 'Area',
    openNow: 'Open now', closesAt: 'closes', closingSoon: 'Closing soon', closedNow: 'Closed', opensAt: 'opens', tomorrow: 'tomorrow', tempClosed: 'Temporarily closed',
    opensSoon: 'Opens in {n} min', statOpen: 'open now', loadingList: 'Loading restaurants…',
    open24: 'Open 24 hours', monFri: 'Mon–Fri', satSun: 'Sat–Sun', closedOn: 'Closed on', minShort: 'min', days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  mr: {
    morning: 'शुभ प्रभात', afternoon: 'शुभ दुपार', evening: 'शुभ संध्याकाळ', search: 'शोधा', all: 'सर्व', cafe: 'कॅफे', dine: 'डाइन',
    pickup: 'पिकअप', reservation: 'आरक्षण', waitlist: 'प्रतीक्षा', saved: 'आवडते', offers: 'ऑफर्स', veg: 'शुद्ध शाकाहारी', nearMe: 'जवळ',
    allAreas: 'सर्व भाग', place: 'ठिकाण', places: 'ठिकाणे', nearest: ' · सर्वात जवळचे आधी', list: 'यादी', map: 'नकाशा', nothing: 'काहीही सापडले नाही',
    clear: 'फिल्टर काढा', retry: 'पुन्हा प्रयत्न', more: 'आणखी', recent: 'अलीकडील', clearRecent: 'पुसा', saveHint: 'आवडते ठिकाण जतन करण्यासाठी हृदयावर टॅप करा',
    offlineCached: 'रिफ्रेश झाले नाही — शेवटची जतन केलेली यादी दाखवत आहे', offline: 'तुम्ही ऑफलाइन आहात', directions: 'दिशा', openMenu: 'मेनू उघडा', call: 'कॉल',
    loadFail: 'रेस्टॉरंट लोड करता आले नाहीत.', locDenied: 'अंतरानुसार क्रमवारीसाठी लोकेशनची परवानगी द्या', locTimeout: 'लोकेशन वेळेत मिळाले नाही — पुन्हा प्रयत्न करा',
    locNA: 'या डिव्हाइसवर लोकेशन उपलब्ध नाही', locBusy: 'लोकेशन सध्या उपलब्ध नाही', finding: 'तुमचे लोकेशन शोधत आहे…', inArea: 'येथे',
    featured: 'विशेष', isNew: 'नवीन', featuredRail: 'विशेष ठिकाणे', statOffers: 'चालू ऑफर्स', statPickup: 'पिकअप देतात', statReserve: 'आरक्षण घेतात',
    howTitle: 'हे कसे चालते', how1t: 'शोधा', how1: 'तुमच्या जवळची कॅफे आणि रेस्टॉरंट्स पाहा', how2t: 'ऑर्डर करा', how2: 'टेबलचा QR स्कॅन करून ऑर्डर किंवा आरक्षण करा — अ‍ॅप नको',
    how3t: 'आनंद घ्या', how3: 'ऑर्डर ट्रॅक करा आणि फोनवरूनच बिल मागवा', hide: 'लपवा', shareView: 'ही यादी शेअर करा', linkCopied: 'लिंक कॉपी झाली',
    ownerTitle: 'तुमचे कॅफे किंवा रेस्टॉरंट आहे का?', ownerBody: 'स्वतःचा QR मेनू, टेबल ऑर्डरिंग, आरक्षण आणि लाइव्ह ऑफर्स मिळवा — प्रत्येक पाहुण्यासाठी येथे सूचीबद्ध.', ownerBtn: 'सूचीत या',
    hoursTitle: 'वेळ', sortRec: 'शिफारस केलेले', sortAz: 'अ – ज्ञ', sortOffers: 'सर्वाधिक ऑफर्स', sortSaved: 'आवडते आधी', sort: 'क्रमवारी',
    updated: 'अपडेट', justNow: 'आत्ताच', minAgo: 'मि. पूर्वी', hrAgo: 'तासांपूर्वी', dayAgo: 'दिवसांपूर्वी', refresh: 'रिफ्रेश', refreshing: 'रिफ्रेश होत आहे…',
    pullHint: 'रिफ्रेश करण्यासाठी खाली ओढा', releaseHint: 'रिफ्रेश करण्यासाठी सोडा', suggestions: 'सूचना', sugArea: 'भाग',
    openNow: 'आता उघडे', closesAt: 'बंद होईल', closingSoon: 'लवकरच बंद', closedNow: 'बंद', opensAt: 'उघडेल', tomorrow: 'उद्या', tempClosed: 'तात्पुरते बंद',
    opensSoon: '{n} मि. मध्ये उघडेल', statOpen: 'आता उघडे', loadingList: 'रेस्टॉरंट लोड होत आहेत…',
    open24: '२४ तास उघडे', monFri: 'सोम–शुक्र', satSun: 'शनि–रवि', closedOn: 'बंद', minShort: 'मि.', days: ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  },
};
const readJson = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; } catch { return fallback; } };
const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } };
/* Server data is untrusted shape-wise: keep only outlets with an id, drop duplicates, make activeOffers always an array. */
const normalizeTenants = (raw) => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object' || !t.tenantId || seen.has(t.tenantId)) continue;
    seen.add(t.tenantId);
    out.push({ ...t, activeOffers: Array.isArray(t.activeOffers) ? t.activeOffers.filter((o) => o && typeof o === 'object') : [] });
  }
  return out;
};
const RECENT_KEY = 'px_home_recent';
const AREA_KEY = 'px_home_area';

/* localStorage can throw (private mode / blocked) — the page must work without it. */
const readList = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
};
const writeList = (key, list) => { try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignore */ } };

const typeOf = (t) => String(t?.businessType || 'Restaurant').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const isCafe = (t) => typeOf(t) === 'cafe' || /\bcaf[eé]s?\b|\bcoffee\b/i.test(String(t?.name || '')); // word match: "Cafeteria Grill" is not a café
const offerValue = (o) => {
  const v = Number(o?.value);
  if (o?.type === 'percent_off') return Number.isFinite(v) ? `${v}% OFF` : 'OFFER';
  if (o?.type === 'fixed_off') return Number.isFinite(v) ? `₹${v} OFF` : 'OFFER';
  if (o?.type === 'free_item') return `FREE ${o.freeItem || 'ITEM'}`;
  return 'HAPPY HOUR';
};
/* The most attractive live offer of an outlet (largest % off first) - shown as the card headline. */
const offerRank = (o) => (o?.type === 'percent_off' ? Number(o.value) || 0 : o?.type === 'fixed_off' ? 1 : 0.5);
const bestOffer = (t) => {
  const list = Array.isArray(t?.activeOffers) ? t.activeOffers : [];
  return list.length ? list.reduce((m, o) => (offerRank(o) > offerRank(m) ? o : m), list[0]) : null;
};
/* Owner-controlled placement: set `featured: true` on a tenant (or config.featured) to pin it first and show it in the Featured row. */
const isFeatured = (t) => t?.featured === true || t?.config?.featured === true;
const isNew = (t) => {
  const d = new Date(t?.createdAt).getTime();
  return Number.isFinite(d) && d <= Date.now() + 864e5 && Date.now() - d < 30 * 864e5;
};
/* Optional "Own a café or restaurant?" card for owners - set to a WhatsApp / contact link (https:, mailto: or tel:). Empty = hidden. */
const OWNER_CTA_URL = '';
const HOW_KEY = 'px_home_how';

/* ── Loading skeleton: the same geometry as the real list (stats line, count row, 2-up card grid) so nothing jumps when data lands ── */
const SR_ONLY = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };
const Sk = ({ w, h, r = 8, d = 0, style }) => <span className="pxh-sk" style={{ display: 'block', width: w, height: h, borderRadius: r, '--d': `${d}s`, ...style }} />;
function SkeletonCard({ i }) {
  const d = (i % 6) * 0.12;
  return (
    <div className="pxh-card pxh-sk-card pxh-sk-in" style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }} aria-hidden="true">
      <div style={{ padding: '14px 14px 13px' }}>
        <Sk w={52} h={52} r={16} d={d} />
        <Sk w={`${58 + ((i * 13) % 26)}%`} h={14} r={7} d={d} style={{ marginTop: 12, marginBottom: 3 }} />
        <div style={{ marginTop: 4, height: 14, display: 'flex', alignItems: 'center' }}><Sk w={`${34 + ((i * 11) % 22)}%`} h={10} r={5} d={d} /></div>
        <Sk w={78} h={19} r={10} d={d} style={{ marginTop: 8 }} />
        <div style={{ marginTop: 11, minHeight: 24, display: 'flex', alignItems: 'center', gap: 9 }}>
          <Sk w={13} h={13} r={7} d={d} /><Sk w={13} h={13} r={7} d={d} /><Sk w={13} h={13} r={7} d={d} />
        </div>
      </div>
      <span className="pxh-sk" style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', '--d': `${d}s` }} />
    </div>
  );
}
function ListSkeleton({ label }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span style={SR_ONLY}>{label}</span>
      <div aria-hidden="true">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '0 0 12px', minHeight: 40 }}>
          <Sk w={112} h={12} r={6} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sk w={104} h={34} r={13} d={0.1} />
            <Sk w={122} h={40} r={13} d={0.2} />
          </div>
        </div>
        <div className="pxh-grid">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} i={i} />)}</div>
      </div>
    </div>
  );
}

/* Dialog accessibility: move focus into the dialog, keep Tab inside it, and give focus back to the opener on close. */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function useFocusTrap(active, ref) {
  useEffect(() => {
    if (!active) return undefined;
    const opener = document.activeElement;
    const node = ref.current;
    const items = () => (node ? [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0) : []);
    const first = items()[0] || node;
    if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key !== 'Tab' || !node) return;
      const list = items();
      if (!list.length) { e.preventDefault(); node.focus(); return; }
      const a = list[0];
      const z = list[list.length - 1];
      const cur = document.activeElement;
      if (!node.contains(cur)) { e.preventDefault(); a.focus(); }
      else if (e.shiftKey && cur === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && cur === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    };
  }, [active, ref]);
}

/* "Updated 3 min ago" */
const fmtAgo = (ts, tr) => {
  const sec = Math.max(0, (Date.now() - ts) / 1000);
  if (sec < 45) return tr.justNow;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} ${tr.minAgo}`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ${tr.hrAgo}`;
  return `${Math.round(h / 24)} ${tr.dayAgo}`;
};

/* Listing audit (open the page with ?audit=1): what is still missing on an outlet's public listing. Internal tool, English only. */
const listingGaps = (t) => {
  const g = [];
  if (!isCafe(t) && !t?.branding?.logoUrl) g.push('No logo');
  if (!areaOf(t)) g.push('No area');
  if (!String(t?.address?.street || '').trim()) g.push('No street');
  if (!hasCoords(t)) g.push('No map pin');
  if (String(t?.contact || t?.phone || '').replace(/\D/g, '').length < 7) g.push('No phone');
  if (!t?.hours) g.push('Hours hidden');
  return g;
};

/* ── Opening hours. The server sends `hours` only for outlets whose owner turned on "Show on guest directory"; everything is IST. ── */
const toMin = (str) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(str || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h < 24 && mi < 60 ? h * 60 + mi : null;
};
const hoursWindow = (hours, day) => {
  if (Array.isArray(hours?.closedDays) && hours.closedDays.includes(day)) return null;
  const blk = day >= 1 && day <= 5 ? hours?.weekday : hours?.weekend;
  const o = toMin(blk?.open);
  const c = toMin(blk?.close);
  return o == null || c == null ? null : { o, c };
};
/* Returns null when we can't say (no / unreadable hours) - the page never claims "Closed" without data. */
const openStatus = (hours, nowMs = Date.now()) => {
  if (!hours || typeof hours !== 'object') return null;
  if (hours.temporarilyClosed === true) return { state: 'closed', temp: true };
  const ist = new Date(nowMs + 330 * 60000);
  const day = ist.getUTCDay();
  const m = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const week = [0, 1, 2, 3, 4, 5, 6].map((d) => hoursWindow(hours, d));
  if (!week.some(Boolean)) return Array.isArray(hours.closedDays) && hours.closedDays.length >= 7 ? { state: 'closed' } : null;
  const today = week[day];
  const yday = week[(day + 6) % 7];
  if (today) {
    const { o, c } = today;
    if (o === c) return { state: 'open', allDay: true };
    if (o < c && m >= o && m < c) return { state: 'open', closesAt: c, minsLeft: c - m };
    if (o > c && m >= o) return { state: 'open', closesAt: c, minsLeft: 1440 - m + c }; // overnight window that started today
  }
  if (yday && yday.o > yday.c && m < yday.c) return { state: 'open', closesAt: yday.c, minsLeft: yday.c - m }; // yesterday's overnight window still running
  if (today && m < today.o) return { state: 'closed', opensAt: today.o, dayOffset: 0, opensDay: day, minsToOpen: today.o - m };
  for (let d = 1; d <= 7; d++) {
    const w = week[(day + d) % 7];
    if (w) return { state: 'closed', opensAt: w.o, dayOffset: d, opensDay: (day + d) % 7 };
  }
  return { state: 'closed' };
};
const fmtClock = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const statusLabel = (st, tr) => {
  if (!st) return null;
  if (st.state === 'open') {
    if (st.allDay) return { tone: 'open', text: tr.open24 };
    if (st.minsLeft <= 60) return { tone: 'soon', text: `${tr.closingSoon} · ${st.minsLeft} ${tr.minShort}` };
    return { tone: 'open', text: `${tr.openNow} · ${tr.closesAt} ${fmtClock(st.closesAt)}` };
  }
  if (st.temp) return { tone: 'closed', text: tr.tempClosed };
  if (st.opensAt == null) return { tone: 'closed', text: tr.closedNow };
  if (st.dayOffset === 0 && st.minsToOpen > 0 && st.minsToOpen <= 60) return { tone: 'soon', text: tr.opensSoon.replace('{n}', st.minsToOpen) };
  const when = st.dayOffset === 0 ? '' : st.dayOffset === 1 ? `${tr.tomorrow} ` : `${tr.days[st.opensDay]} `;
  return { tone: 'closed', text: `${tr.closedNow} · ${tr.opensAt} ${when}${fmtClock(st.opensAt)}` };
};
const hoursRange = (blk) => {
  const o = toMin(blk?.open);
  const c = toMin(blk?.close);
  return o == null || c == null ? '—' : o === c ? '24 h' : `${fmtClock(o)} – ${fmtClock(c)}`;
};

/* ── Discovery analytics: anonymous events (card seen / menu opened / shared / called / directions / saved) that the server
   turns into per-outlet daily counters for the owner's "Guest Discovery" page. Nothing identifies the guest. ── */
const TRACK_URL = `${BASE_URL}/analytics/events`;
const trackQueue = [];
const trackLast = new Map();
let trackTimer = null;
let trackListening = false;
let trackingOff = false;
const setTrackingOff = (v) => { trackingOff = !!v; };
function flushTrack() {
  if (trackTimer) { clearTimeout(trackTimer); trackTimer = null; }
  while (trackQueue.length) {
    const events = trackQueue.splice(0, 50);
    try { fetch(TRACK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events }), keepalive: true }).catch(() => {}); } catch { /* ignore */ }
  }
}
function track(tenantId, type, src) {
  if (!tenantId || trackingOff || typeof window === 'undefined' || typeof fetch === 'undefined' || navigator.webdriver) return;
  const key = `${tenantId}|${type}`;
  const now = Date.now();
  if (type !== 'impression' && now - (trackLast.get(key) || 0) < 1500) return; // double-tap guard
  trackLast.set(key, now);
  trackQueue.push(src ? { tenantId, type, src } : { tenantId, type });
  if (!trackListening) {
    trackListening = true;
    window.addEventListener('pagehide', flushTrack);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushTrack(); });
  }
  // an "open" is followed by navigation to the menu, so send it straight away instead of waiting for the timer
  if (type === 'open' || trackQueue.length >= 20) flushTrack();
  else if (!trackTimer) trackTimer = setTimeout(flushTrack, 4000);
}
/* An outlet counts as "seen" once per browser session, when at least half its card has been on screen. */
const SEEN_KEY = 'px_home_seen';
const seenIds = (() => { let s; try { s = new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]')); } catch { s = new Set(); } return s; })();
const markSeen = (id) => {
  if (seenIds.has(id)) return false;
  seenIds.add(id);
  try { sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seenIds].slice(-200))); } catch { /* ignore */ }
  return true;
};
let imprObs = null;
const imprRef = (el) => {
  if (!el || trackingOff || typeof IntersectionObserver === 'undefined') return;
  const id = el.getAttribute('data-tid');
  if (!id || seenIds.has(id)) return;
  if (!imprObs) {
    imprObs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        imprObs.unobserve(e.target);
        const tid = e.target.getAttribute('data-tid');
        if (tid && markSeen(tid)) track(tid, 'impression');
      }
    }, { threshold: 0.5 });
  }
  imprObs.observe(el);
};
const URL_KEYS = ['q', 'type', 'service', 'area', 'offers', 'veg', 'open'];

const SERVICES = [
  { id: 'pickup', label: 'Pickup', icon: ShoppingBag },
  { id: 'reservation', label: 'Reserve', icon: CalendarCheck },
  { id: 'waitlist', label: 'Waitlist', icon: Clock },
];


/* ── Location helpers: area filter, Google Maps embed + directions, distance ── */
const areaOf = (t) => String(t?.address?.area || t?.address?.city || '').trim();
const hasCoords = (t) => Number.isFinite(Number(t?.address?.lat)) && Number.isFinite(Number(t?.address?.lng)) && t?.address?.lat !== null && t?.address?.lng !== null && t?.address?.lat !== '';
const addressLine = (t) => [t?.address?.street, t?.address?.area, t?.address?.city, [t?.address?.state, t?.address?.pincode].filter(Boolean).join(' ')].map((x) => String(x || '').trim()).filter(Boolean).join(', ');
const mapQuery = (t) => (hasCoords(t) ? `${Number(t.address.lat)},${Number(t.address.lng)}` : [t?.name, addressLine(t)].filter(Boolean).join(', '));
const embedUrl = (t) => `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(t))}&z=16&output=embed`;
const directionsUrl = (t) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery(t))}&travelmode=driving`;
const openMapUrl = (t) => (t?.address?.mapsUrl && /^https:\/\//i.test(t.address.mapsUrl) ? t.address.mapsUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(t))}`);
const hasPlace = (t) => hasCoords(t) || !!addressLine(t);
const distanceKm = (pos, t) => {
  if (!pos || !hasCoords(t)) return null;
  const R = 6371; const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(Number(t.address.lat) - pos.lat); const dLng = rad(Number(t.address.lng) - pos.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(pos.lat)) * Math.cos(rad(Number(t.address.lat))) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};
const fmtKm = (km) => {
  if (km == null || !Number.isFinite(km)) return '';
  const m = Math.max(50, Math.round(km * 10) * 100); // nearest 100 m, never below 50 m
  if (km < 1 && m < 1000) return `${m} m`; // 0.95-0.999 km used to print "1000 m"
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
};

const css = `
html,body{scrollbar-width:none;-ms-overflow-style:none}
html::-webkit-scrollbar,body::-webkit-scrollbar,*::-webkit-scrollbar{width:0;height:0;display:none}
.pxh-sort{display:inline-flex;align-items:center;gap:6px;margin-left:auto;margin-right:8px;border:1px solid rgba(211,191,162,.18);border-radius:13px;padding:0 4px 0 10px;background:rgba(255,255,255,.03);color:rgba(211,191,162,.8)}
.pxh-sort select{appearance:none;-webkit-appearance:none;border:0;background:transparent;color:rgba(255,255,255,.7);font-size:11px;font-weight:800;padding:9px 18px 9px 2px;font-family:inherit;cursor:pointer;outline:none}
.pxh-sort select:disabled{opacity:.45;cursor:not-allowed}
.pxh-sort select option{background:#141414;color:#f7f3eb}
.pxh-top{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));width:44px;height:44px;border-radius:50%;border:1px solid rgba(211,191,162,.35);background:linear-gradient(160deg,rgba(255,255,255,.1),rgba(255,255,255,.03)),#121212;color:#d3bfa2;display:grid;place-items:center;cursor:pointer;box-shadow:0 14px 34px rgba(0,0,0,.5);z-index:40;backdrop-filter:blur(10px)}
.pxh-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:4px 8px 10px;margin:-4px -8px -6px}
.pxh-chips::-webkit-scrollbar{display:none}
.pxh-chip{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(211,191,162,.16);background:rgba(255,255,255,.03);color:rgba(255,255,255,.62);border-radius:22px;padding:8px 13px;font-size:11px;font-weight:800;cursor:pointer;transition:all .18s}
.pxh-chip.on{background:linear-gradient(135deg,#d3bfa2,#bda88a);color:#101010;border-color:transparent;box-shadow:0 6px 18px rgba(211,191,162,.18)}
.pxh-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(min-width:720px){.pxh-grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}}
.pxh-card{position:relative;border:1px solid rgba(211,191,162,.13);border-radius:20px;background:linear-gradient(160deg,#171717,#101010);overflow:hidden;transition:transform .2s,border-color .2s,box-shadow .2s}
.pxh-card:hover{transform:translateY(-3px);border-color:rgba(211,191,162,.35);box-shadow:0 14px 34px rgba(0,0,0,.35)}
.pxh-card>button.main{display:block;width:100%;text-align:left;background:none;border:0;color:#fff;cursor:pointer;padding:14px 14px 13px;font-family:inherit}
.pxh-heart{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(211,191,162,.16);background:rgba(10,10,10,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(211,191,162,.6);padding:0;transition:all .18s}
.pxh-heart.on{color:#d3bfa2;border-color:rgba(211,191,162,.5);background:rgba(211,191,162,.14)}
.pxh-rail{display:flex;gap:14px;overflow-x:auto;scrollbar-width:none;padding:2px 1px 6px;-webkit-overflow-scrolling:touch}
.pxh-rail::-webkit-scrollbar{display:none}
.pxh-bubble{flex:0 0 auto;width:64px;display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;color:rgba(255,255,255,.7);cursor:pointer;font-family:inherit;padding:0}
.pxh-ring{width:58px;height:58px;border-radius:50%;padding:2px;background:conic-gradient(from 210deg,#d3bfa2,#8a704d,#d3bfa2);display:flex}
.pxh-ring>div{flex:1;border-radius:50%;background:#f7f3eb;display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid #0e0e0e}
.pxh-areas{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:2px 8px 4px;margin:0 -8px}
.pxh-areas::-webkit-scrollbar{display:none}
.pxh-area{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(211,191,162,.14);background:transparent;color:rgba(255,255,255,.6);border-radius:12px;padding:7px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s}
.pxh-area b{font-size:9.5px;font-weight:900;color:rgba(211,191,162,.7);background:rgba(211,191,162,.1);border-radius:8px;padding:1px 6px}
.pxh-area.on{border-color:rgba(211,191,162,.55);background:rgba(211,191,162,.12);color:#f7f3eb}
.pxh-seg{display:inline-flex;border:1px solid rgba(211,191,162,.18);border-radius:13px;padding:3px;background:rgba(255,255,255,.03)}
.pxh-seg button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:rgba(255,255,255,.55);font-size:11px;font-weight:800;padding:7px 12px;border-radius:10px;cursor:pointer;font-family:inherit}
.pxh-seg button.on{background:linear-gradient(135deg,#d3bfa2,#bda88a);color:#101010}
.pxh-nav{position:absolute;right:10px;bottom:10px;width:32px;height:32px;border-radius:11px;border:1px solid rgba(211,191,162,.25);background:rgba(211,191,162,.1);color:#d3bfa2;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:all .18s}
.pxh-nav:hover{background:rgba(211,191,162,.2)}
.pxh-mapwrap{display:grid;gap:14px;grid-template-columns:1fr}
@media(min-width:860px){.pxh-mapwrap{grid-template-columns:minmax(280px,.8fr) 1.4fr;align-items:start}.pxh-mapwrap .pxh-maplist{max-height:560px;overflow-y:auto}.pxh-mapwrap .pxh-detail{position:sticky;top:14px}}
.pxh-place{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:1px solid rgba(211,191,162,.12);background:linear-gradient(160deg,#171717,#101010);color:#fff;border-radius:16px;padding:11px 12px;cursor:pointer;font-family:inherit;transition:all .18s}
.pxh-place.on{border-color:rgba(211,191,162,.55);background:linear-gradient(160deg,rgba(211,191,162,.14),#121212)}
.pxh-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:13px;padding:11px 15px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;border:1px solid rgba(211,191,162,.26);background:rgba(211,191,162,.07);color:#d3bfa2;text-decoration:none;transition:all .18s}
.pxh-btn.pri{background:linear-gradient(135deg,#e2d3ba,#d3bfa2 55%,#bda88a);color:#101010;border-color:transparent;box-shadow:0 8px 20px -8px rgba(211,191,162,.55)}
.pxh-ribbon{position:absolute;top:0;left:0;z-index:2;pointer-events:none;display:inline-flex;align-items:center;gap:4px;padding:4px 11px 4px 9px;border-radius:0 0 12px 0;font-size:9px;font-weight:900;letter-spacing:1.1px;text-transform:uppercase}
.pxh-ribbon.feat{background:linear-gradient(135deg,#e2d3ba,#bda88a);color:#101010}
.pxh-ribbon.new{background:rgba(122,201,152,.16);color:#8fd6a8;border:1px solid rgba(122,201,152,.28);border-left:0;border-top:0}
.pxh-card.featured{border-color:rgba(211,191,162,.42);box-shadow:0 10px 30px -14px rgba(211,191,162,.35)}
.pxh-offerpill{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:rgba(211,191,162,.12);border:1px solid rgba(211,191,162,.22);color:#d3bfa2;font-size:9.5px;font-weight:900;max-width:100%;overflow:hidden;white-space:nowrap}
.pxh-sec{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:900;letter-spacing:1.6px;text-transform:uppercase;color:rgba(211,191,162,.75);margin:0 0 8px}
.pxh-feat{flex:0 0 auto;width:min(262px,76vw);display:block;text-align:left;border:1px solid rgba(211,191,162,.38);border-radius:20px;background:linear-gradient(150deg,rgba(211,191,162,.18),#121212 64%);color:#fff;padding:14px;cursor:pointer;font-family:inherit;transition:transform .2s,border-color .2s}
.pxh-feat:hover{transform:translateY(-2px);border-color:rgba(211,191,162,.6)}
.pxh-stats{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:10px;font-size:11px;color:rgba(255,255,255,.5)}
.pxh-stats b{color:#d3bfa2;font-weight:900}
.pxh-how{border:1px solid rgba(211,191,162,.14);border-radius:20px;padding:14px;background:rgba(255,255,255,.025)}
.pxh-how-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pxh-how-step{display:flex;flex-direction:column;gap:6px;font-size:10.5px;line-height:1.45;color:rgba(255,255,255,.55)}
.pxh-how-step i{width:30px;height:30px;border-radius:10px;background:rgba(211,191,162,.12);border:1px solid rgba(211,191,162,.22);display:flex;align-items:center;justify-content:center}
.pxh-how-step b{font-size:12px;color:#f7f3eb}
.pxh-share{display:inline-flex;align-items:center;justify-content:center;margin-left:8px;width:24px;height:24px;border-radius:8px;border:1px solid rgba(211,191,162,.18);background:transparent;color:#d3bfa2;cursor:pointer;vertical-align:middle;padding:0}
.pxh-owner{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;border:1px solid rgba(211,191,162,.3);border-radius:22px;padding:18px;background:linear-gradient(135deg,rgba(211,191,162,.15),#121212 72%)}
.pxh-status{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:10px;font-weight:800;overflow:hidden;white-space:nowrap}
.pxh-status i{width:6px;height:6px;border-radius:50%;flex:0 0 auto;background:currentColor}
.pxh-status span{overflow:hidden;text-overflow:ellipsis}
.pxh-status.open{color:#8fd6a8}.pxh-status.soon{color:#f0b450}.pxh-status.closed{color:#e08a8a}
@keyframes pxhSpin{to{transform:rotate(360deg)}}
.pxh-spin{animation:pxhSpin .9s linear infinite}
.pxh-refresh{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:rgba(255,255,255,.45);font-size:11px;font-family:inherit;cursor:pointer;padding:0}
.pxh-refresh:hover:not(:disabled){color:#d3bfa2}
@keyframes pxhShimmer{0%{background-position:-300px 0}100%{background-position:300px 0}}
.pxh-sk{position:relative;overflow:hidden;background:rgba(255,255,255,.05);flex:0 0 auto}
.pxh-sk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(100deg,transparent 0%,rgba(211,191,162,.13) 50%,transparent 100%);animation:pxhSweep 1.6s cubic-bezier(.4,0,.2,1) infinite;animation-delay:var(--d,0s)}
@keyframes pxhSweep{to{transform:translateX(100%)}}
.pxh-card.pxh-sk-card,.pxh-card.pxh-sk-card:hover{transform:none;box-shadow:none;border-color:rgba(211,191,162,.13);pointer-events:none}
.pxh-sk-in{animation:pxhSkIn .35s ease both}
@keyframes pxhSkIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.pxh-spin{animation:none}.pxh-sk::after{animation:none;display:none}.pxh-sk-in{animation:none}.pxh-card{transition:none}}
`;

const Avatar = ({ t, size = 50, radius = 15 }) => {
  const [imgBroken, setImgBroken] = useState(false);
  // Every café gets the coffee mark (consistent, instantly recognisable); other places show their logo.
  if (isCafe(t)) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(145deg,#f7f3eb,#e9dfcc)', boxShadow: 'inset 0 0 0 1px rgba(138,112,77,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Coffee size={size * 0.46} color="#8a704d" strokeWidth={1.8} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: '#f7f3eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      {t.branding?.logoUrl && !imgBroken
        ? <img src={t.branding.logoUrl} alt="" onError={() => setImgBroken(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <UtensilsCrossed size={size * 0.42} color="#8a704d" />}
    </div>
  );
};

/* Map + navigate card for one outlet (used in the Map view and in the quick sheet). */
function PlaceDetail({ t, pos, onOrder, tr }) {
  const [note, setNote] = useState('');
  const km = distanceKm(pos, t);
  const flashTimer = useRef(null);
  useEffect(() => () => { if (flashTimer.current) window.clearTimeout(flashTimer.current); }, []);
  const flash = (m) => {
    setNote(m);
    if (flashTimer.current) window.clearTimeout(flashTimer.current); // a second tap used to be wiped by the first timer
    flashTimer.current = window.setTimeout(() => setNote(''), 2200);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${t.name}${addressLine(t) ? ', ' + addressLine(t) : ''}`); flash('Address copied'); }
    catch { flash('Copy not available'); }
  };
  const share = async () => {
    const data = { title: t.name, text: `${t.name}${addressLine(t) ? ' — ' + addressLine(t) : ''}`, url: openMapUrl(t) };
    try {
      if (navigator.share) { await navigator.share(data); track(t.tenantId, 'share'); }
      else { await navigator.clipboard.writeText(`${data.text}\n${data.url}`); flash('Link copied'); track(t.tenantId, 'share'); }
    } catch { /* cancelled */ }
  };
  const placeable = hasPlace(t);
  const rawPhone = String(t?.contact || t?.phone || '').trim();
  const callHref = rawPhone.replace(/\D/g, '').length >= 7 ? `tel:${rawPhone.replace(/[^\d+]/g, '')}` : '';
  return (
    <div className="pxh-detail" style={{ border: '1px solid rgba(211,191,162,.18)', borderRadius: 22, overflow: 'hidden', background: 'linear-gradient(160deg,#181818,#0f0f0f)' }}>
      <div style={{ position: 'relative', height: 'clamp(210px,38vw,300px)', background: 'linear-gradient(145deg,#1b1b1b,#121212)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(211,191,162,.45)', fontSize: 11 }}>
          <MapPin size={26} />{placeable ? 'Loading map…' : 'Location not added yet'}
        </div>
        {placeable && (
          <iframe key={t.tenantId} title={`Map of ${t.name}`} src={embedUrl(t)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, filter: 'saturate(.85) contrast(1.02)' }} />
        )}
        {km != null && <span style={{ position: 'absolute', left: 12, top: 12, padding: '5px 10px', borderRadius: 10, background: 'rgba(12,12,12,.82)', border: '1px solid rgba(211,191,162,.3)', color: GOLD, fontSize: 11, fontWeight: 900, backdropFilter: 'blur(6px)' }}>{fmtKm(km)} away</span>}
      </div>
      <div style={{ padding: '16px 16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar t={t} size={46} radius={14} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f7f3eb', fontFamily: 'Georgia, serif' }}>{t.name}</div>
            {areaOf(t) && <div style={{ fontSize: 11, color: 'rgba(211,191,162,.8)', fontWeight: 700, marginTop: 2 }}>{areaOf(t)}</div>}
          </div>
        </div>
        {(addressLine(t) || t.address?.landmark) && (
          <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,.62)' }}>
            {addressLine(t)}
            {t.address?.landmark && <div style={{ marginTop: 3, color: 'rgba(211,191,162,.7)' }}>Near {t.address.landmark}</div>}
          </div>
        )}
        {t.hours && (() => {
          const lab = statusLabel(openStatus(t.hours), tr);
          const off = Array.isArray(t.hours.closedDays) ? t.hours.closedDays.filter((d) => d >= 0 && d <= 6) : [];
          return (
            <div style={{ marginTop: 12, padding: '11px 12px', borderRadius: 14, border: '1px solid rgba(211,191,162,.14)', background: 'rgba(255,255,255,.025)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(211,191,162,.75)' }}><Clock size={12} /> {tr.hoursTitle || 'Hours'}</div>
              {lab && <div className={`pxh-status ${lab.tone}`} style={{ fontSize: 12, marginTop: 8 }}><i /><span>{lab.text}</span></div>}
              <div style={{ marginTop: 8, display: 'grid', gap: 4, fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span>{tr.monFri}</span><span>{hoursRange(t.hours.weekday)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span>{tr.satSun}</span><span>{hoursRange(t.hours.weekend)}</span></div>
                {off.length > 0 && <div style={{ color: '#e08a8a' }}>{tr.closedOn}: {off.map((d) => tr.days[d]).join(', ')}</div>}
              </div>
            </div>
          );
        })()}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 14 }}>
          {placeable && <a className="pxh-btn pri" href={directionsUrl(t)} target="_blank" rel="noopener noreferrer" onClick={() => track(t.tenantId, 'directions')} style={{ flex: '1 1 140px' }}><Navigation size={14} /> {tr.directions}</a>}
          {onOrder && <button type="button" className="pxh-btn" onClick={() => onOrder(t)} style={{ flex: '1 1 110px' }}>{tr.openMenu} <ChevronRight size={14} /></button>}
          {callHref && <a className="pxh-btn" href={callHref} onClick={() => track(t.tenantId, 'call')} style={{ flex: '1 1 90px' }}><Phone size={14} /> {tr.call}</a>}
        </div>
        {placeable && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
            <a className="pxh-btn" href={openMapUrl(t)} target="_blank" rel="noopener noreferrer" onClick={() => track(t.tenantId, 'directions')} style={{ padding: '8px 12px', fontSize: 11 }}><ExternalLink size={12} /> Google Maps</a>
            <button type="button" className="pxh-btn" onClick={copy} style={{ padding: '8px 12px', fontSize: 11 }}><Copy size={12} /> Copy</button>
            <button type="button" className="pxh-btn" onClick={share} style={{ padding: '8px 12px', fontSize: 11 }}><Share2 size={12} /> Share</button>
            {note && <span role="status" style={{ alignSelf: 'center', fontSize: 11, color: GOLD, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} />{note}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerHome() {
  const navigate = useNavigate();
  const location = useLocation();
  // Last good list is cached: the page paints instantly, refreshes in the background, and still works offline.
  const [tenants, setTenants] = useState(() => normalizeTenants(readJson(CACHE_KEY, null)?.list));
  const [loading, setLoading] = useState(() => normalizeTenants(readJson(CACHE_KEY, null)?.list).length === 0);
  const [loadError, setLoadError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [fresh, setFresh] = useState(false); // true once the list has come from the network in this visit
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const [lang, setLang] = useState(() => { try { return localStorage.getItem(LANG_KEY) === 'mr' ? 'mr' : 'en'; } catch { return 'en'; } });
  const tr = L[lang];
  // A shared link (?type=cafe&service=pickup&area=rajarampuri&offers=1&q=...) opens exactly that view; otherwise the guest's saved filters apply.
  const [init] = useState(() => {
    let qp; try { qp = new URLSearchParams(location.search); } catch { qp = new URLSearchParams(); }
    const urlView = URL_KEYS.some((k) => qp.has(k));
    // ?notrack=1 (staff / owners checking their own listing) stops this browser from counting; ?notrack=0 turns counting back on. Audit mode never counts.
    try { if (qp.get('notrack') === '1') localStorage.setItem('px_notrack', '1'); else if (qp.get('notrack') === '0') localStorage.removeItem('px_notrack'); } catch { /* ignore */ }
    let muted = false; try { muted = localStorage.getItem('px_notrack') === '1'; } catch { /* ignore */ }
    setTrackingOff(muted || qp.get('audit') === '1');
    const sf = urlView ? {} : readJson(FILTERS_KEY, {});
    const type = urlView ? qp.get('type') : sf?.filter;
    const svc = urlView ? qp.get('service') : sf?.service;
    let storedArea = 'all'; try { storedArea = localStorage.getItem(AREA_KEY) || 'all'; } catch { /* ignore */ }
    return {
      urlView,
      filter: ['all', 'cafe', 'restaurant'].includes(type) ? type : 'all',
      service: ['pickup', 'reservation', 'waitlist'].includes(svc) ? svc : null,
      favOnly: !urlView && sf?.favOnly === true,
      offersOnly: urlView ? qp.get('offers') === '1' : sf?.offersOnly === true,
      vegOnly: urlView ? qp.get('veg') === '1' : sf?.vegOnly === true,
      openOnly: urlView ? qp.get('open') === '1' : sf?.openOnly === true,
      query: urlView ? String(qp.get('q') || '').slice(0, 60) : '',
      audit: qp.get('audit') === '1',
      area: urlView ? String(qp.get('area') || 'all').trim().toLowerCase().slice(0, 60) || 'all' : storedArea,
    };
  });
  const [filter, setFilter] = useState(init.filter);
  const [service, setService] = useState(init.service);
  const [favOnly, setFavOnly] = useState(init.favOnly);
  const [offersOnly, setOffersOnly] = useState(init.offersOnly);
  const [vegOnly, setVegOnly] = useState(init.vegOnly);
  const [openOnly, setOpenOnly] = useState(init.openOnly);
  const [query, setQuery] = useState(init.query);
  const [limit, setLimit] = useState(PAGE);
  const [notification, setNotification] = useState(null);
  const [favs, setFavs] = useState(() => readList(FAV_KEY));
  const [recent, setRecent] = useState(() => readList(RECENT_KEY));
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [allOffers, setAllOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [area, setArea] = useState(init.area);
  const [view, setView] = useState('list');
  const [sort, setSort] = useState(() => { try { return localStorage.getItem(SORT_KEY) || 'recommended'; } catch { return 'recommended'; } });
  const [guestName] = useState(readGuestFirstName);
  const [showTop, setShowTop] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searches, setSearches] = useState(() => readList(SEARCHES_KEY));
  const [pos, setPos] = useState(null);
  const [nearMe, setNearMe] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');
  const [mapId, setMapId] = useState(null);
  const [sheetTenant, setSheetTenant] = useState(null);
  const [howHidden, setHowHidden] = useState(() => { try { return localStorage.getItem(HOW_KEY) === '1'; } catch { return false; } });
  const [linkMsg, setLinkMsg] = useState('');
  const linkTimer = useRef(null);
  const auditTimer = useRef(null);
  useEffect(() => () => { clearTimeout(linkTimer.current); clearTimeout(auditTimer.current); }, []);
  const [updatedAt, setUpdatedAt] = useState(() => { const t = readJson(CACHE_KEY, null)?.t; return Number.isFinite(t) ? t : null; });
  const [, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pull, setPull] = useState(0);
  const [sugIdx, setSugIdx] = useState(-1);
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [auditMsg, setAuditMsg] = useState('');
  const refreshingRef = useRef(false);
  const pullRef = useRef(0);
  const dialogOpenRef = useRef(false);
  // keep the "Updated … ago" label fresh
  useEffect(() => { const id = setInterval(() => setTick((n) => n + 1), 30000); return () => clearInterval(id); }, []);

  const canLocate = typeof navigator !== 'undefined' && !!navigator.geolocation;
  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const hadCache = useRef(tenants.length > 0);

  const load = useCallback((signal, silent = false) => {
    if (!silent) { setLoading(true); setLoadError(''); }
    return axios.get(`${BASE_URL}/tenants/active`, { timeout: 10000, headers: { 'Cache-Control': 'no-cache' }, signal })
      .then((res) => {
        if (!alive.current) return;
        const list = normalizeTenants(res.data);
        setTenants(list);
        setFromCache(false);
        setFresh(true);
        setLoadError('');
        const now = Date.now();
        writeJson(CACHE_KEY, { t: now, list });
        setUpdatedAt(now);
      })
      .catch((err) => {
        if (axios.isCancel(err) || !alive.current) return;
        const raw = readJson(CACHE_KEY, null);
        const cached = normalizeTenants(raw?.list);
        if (cached.length) { setTenants(cached); setFromCache(true); setLoadError(''); if (Number.isFinite(raw?.t)) setUpdatedAt(raw.t); return; }
        if (!silent) { setTenants([]); setLoadError(err?.response?.data?.error || ''); }
      })
      .finally(() => { if (!signal?.aborted && alive.current) setLoading(false); });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal, hadCache.current);
    return () => ctrl.abort();
  }, [load]);

  // Refresh when the guest comes back to the tab or the connection returns (at most once a minute), and track online state.
  useEffect(() => {
    let last = Date.now();
    const refresh = () => { if (document.hidden || Date.now() - last < 60000) return; last = Date.now(); load(undefined, true); };
    const goOnline = () => { setOnline(true); last = Date.now(); load(undefined, true); };
    const goOffline = () => setOnline(false);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [load]);

  // Remember the guest's filters between visits.
  // (a visit through a shared link doesn't overwrite the guest's own saved filters)
  useEffect(() => { if (!init.urlView) writeJson(FILTERS_KEY, { filter, service, favOnly, offersOnly, vegOnly, openOnly }); }, [init.urlView, filter, service, favOnly, offersOnly, vegOnly, openOnly]);
  // Manual refresh (button + pull-down on touch screens).
  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try { await load(undefined, true); } finally {
      refreshingRef.current = false;
      if (alive.current) setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    let startY = null;
    let startX = 0;
    const clear = () => { startY = null; if (pullRef.current) { pullRef.current = 0; setPull(0); } };
    const onStart = (e) => {
      if (e.touches.length !== 1 || window.scrollY > 0 || dialogOpenRef.current || refreshingRef.current) { startY = null; return; }
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };
    const onMove = (e) => {
      if (startY == null) return;
      const dy = e.touches[0].clientY - startY;
      const dx = Math.abs(e.touches[0].clientX - startX);
      if (dy <= 0 || dx > dy || window.scrollY > 0) { if (pullRef.current) { pullRef.current = 0; setPull(0); } return; }
      const p = Math.min(1, dy / 90);
      if (p >= 1 ? pullRef.current < 1 : Math.abs(p - pullRef.current) > 0.04) { pullRef.current = p; setPull(p); }
    };
    const onEnd = () => { const ready = pullRef.current >= 1; clear(); if (ready) refresh(); };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', clear, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', clear);
    };
  }, [refresh]);

  const chooseLang = (next) => { setLang(next); try { localStorage.setItem(LANG_KEY, next); } catch { /* ignore */ } };

  const offersReq = useRef(0);
  const loadAllOffers = async () => {
    // The sheet must open even if a previous request is still running: closing it mid-load and tapping the tag again used
    // to do nothing at all (the early return came before setShowAllOffers(true)).
    setShowAllOffers(true);
    const reqId = (offersReq.current += 1);
    setOffersLoading(true);
    setOffersError('');
    try {
      const res = await axios.get(`${BASE_URL}/offers/current/all?limit=500`, { timeout: 10000 });
      if (reqId !== offersReq.current) return;
      setAllOffers(Array.isArray(res.data?.offers) ? res.data.offers : []);
    } catch (err) {
      if (reqId !== offersReq.current) return;
      setAllOffers([]);
      setOffersError(err?.response?.data?.error || 'Unable to load offers.');
    } finally {
      if (reqId === offersReq.current) setOffersLoading(false);
    }
  };

  // A dismissed banner used to come straight back whenever the restaurant list reloaded (Retry, refresh). Remember the dismissal
  // for the current link; a new notification link shows again.
  const dismissedNote = useRef('');
  const viewedPx = useRef('');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tenantId = params.get('tenantId');
    if (params.get('notification') === '1' && tenantId) {
      if (dismissedNote.current === location.search) return;
      // Report "viewed" once per opened notification link (analytics: reach -> delivered -> clicked -> viewed).
      const px = params.get('px');
      if (px && px.includes(':') && viewedPx.current !== px) {
        viewedPx.current = px;
        const [kind, ...rest] = px.split(':');
        const visitor = (() => { try { let v = localStorage.getItem('px_visitor'); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('px_visitor', v); } return v; } catch { return ''; } })();
        const send = (endpoint) => axios.post(`${API_BASE_URL}/push-track`, { tenantId, kind, refId: rest.join(':'), event: 'viewed', endpoint, visitor }).catch(() => {});
        (async () => {
          let endpoint = '';
          try { const reg = await navigator.serviceWorker?.getRegistration?.(); endpoint = (await reg?.pushManager?.getSubscription?.())?.endpoint || ''; } catch { /* anonymous visitor id is used instead */ }
          send(endpoint);
        })();
      }
      const tenant = tenants.find((t) => t.tenantId === tenantId);
      setNotification(tenant ? `Update from ${tenant.name}` : 'You have a restaurant update');
    }
  }, [location.search, tenants]);

  const openTenant = (tenant, src = 'list') => {
    // Directory selection is not a QR/table scan, so no table number is attached.
    if (!tenant?.tenantId) return;
    track(tenant.tenantId, 'open', src);
    setRecent((prev) => {
      const next = [tenant.tenantId, ...prev.filter((id) => id !== tenant.tenantId)].slice(0, 8);
      writeList(RECENT_KEY, next);
      return next;
    });
    navigate(`/${encodeURIComponent(tenant.tenantId)}?entry=home`);
  };

  const toggleFav = (id) => {
    if (!favs.includes(id)) track(id, 'save');
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      writeList(FAV_KEY, next);
      return next;
    });
  };

  const minuteKey = Math.floor(Date.now() / 60000); // re-evaluates "Open now" every minute (the page re-renders every 30 s)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tenants.filter((t) => {
      const cafe = isCafe(t);
      if (filter === 'cafe' && !cafe) return false;
      if (filter === 'restaurant' && cafe) return false;
      if (service && (t.config?.customerFeatures || {})[service] === false) return false;
      if (favOnly && !favs.includes(t.tenantId)) return false;
      if (offersOnly && !(t.activeOffers || []).length) return false;
      if (vegOnly && t.config?.onlyVeg !== true) return false;
      if (init.audit && incompleteOnly && !listingGaps(t).length) return false;
      if (openOnly && openStatus(t.hours, minuteKey * 60000)?.state !== 'open') return false;
      if (area !== 'all' && areaOf(t).toLowerCase() !== area) return false;
      return !q || `${t.name} ${t.address?.area || ''} ${t.address?.city || ''} ${t.address?.landmark || ''} ${t.address?.street || ''}`.toLowerCase().includes(q);
    });
    if (nearMe && pos) list.sort((a, b) => (distanceKm(pos, a) ?? 1e9) - (distanceKm(pos, b) ?? 1e9));
    else if (sort === 'az') list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    else if (sort === 'offers') list.sort((a, b) => (b.activeOffers?.length || 0) - (a.activeOffers?.length || 0));
    else if (sort === 'saved') list.sort((a, b) => Number(favs.includes(b.tenantId)) - Number(favs.includes(a.tenantId)));
    else {
      // recommended: featured placements first, then outlets that are open (or have no hours on file) before ones known to be closed
      const closedRank = (t) => (openStatus(t.hours, minuteKey * 60000)?.state === 'closed' ? 1 : 0);
      list.sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)) || closedRank(a) - closedRank(b));
    }
    return list;
  }, [tenants, filter, service, favOnly, offersOnly, vegOnly, incompleteOnly, init.audit, openOnly, minuteKey, favs, query, area, nearMe, pos, sort]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const chooseSort = (v) => { setSort(v); try { localStorage.setItem(SORT_KEY, v); } catch { /* ignore */ } };
  const rememberSearch = (term) => {
    const t = String(term || '').trim();
    if (t.length < 2) return;
    const next = [t, ...searches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    setSearches(next); writeList(SEARCHES_KEY, next);
  };

  // Autocomplete: places whose name matches, then areas (names that start with the text come first).
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const places = [];
    const areas = new Map();
    for (const t of tenants) {
      const name = String(t.name || '').trim();
      const ln = name.toLowerCase();
      if (name && ln.includes(q) && ln !== q) places.push({ kind: 'place', text: name, sub: areaOf(t), cafe: isCafe(t), rank: ln.startsWith(q) ? 0 : 1 });
      const a = areaOf(t);
      const la = a.toLowerCase();
      if (a && la.includes(q) && la !== q && !areas.has(la)) areas.set(la, { kind: 'area', text: a, rank: la.startsWith(q) ? 0 : 1 });
    }
    const byRank = (x, y) => x.rank - y.rank || x.text.localeCompare(y.text);
    return [...places.sort(byRank).slice(0, 5), ...[...areas.values()].sort(byRank).slice(0, 3)];
  }, [tenants, query]);
  const showSug = searchOpen && query.trim().length > 0 && suggestions.length > 0;
  const pickSuggestion = (text) => { setQuery(text); rememberSearch(text); setSearchOpen(false); setSugIdx(-1); };

  // Area chips are built from the real outlets (counts respect the other filters, not the area itself).
  const areaChips = useMemo(() => {
    const q = query.trim().toLowerCase();
    const counts = new Map();
    for (const t of tenants) {
      const a = areaOf(t); if (!a) continue;
      const cafe = isCafe(t);
      if (filter === 'cafe' && !cafe) continue;
      if (filter === 'restaurant' && cafe) continue;
      if (service && (t.config?.customerFeatures || {})[service] === false) continue;
      if (favOnly && !favs.includes(t.tenantId)) continue;
      if (offersOnly && !(t.activeOffers || []).length) continue;
      if (vegOnly && t.config?.onlyVeg !== true) continue;
      if (init.audit && incompleteOnly && !listingGaps(t).length) continue;
      if (openOnly && openStatus(t.hours, minuteKey * 60000)?.state !== 'open') continue;
      if (q && !`${t.name} ${t.address?.area || ''} ${t.address?.city || ''} ${t.address?.landmark || ''} ${t.address?.street || ''}`.toLowerCase().includes(q)) continue;
      const k = a.toLowerCase(); const cur = counts.get(k) || { key: k, label: a, n: 0 };
      cur.n += 1; counts.set(k, cur);
    }
    const list = [...counts.values()].sort((x, y) => y.n - x.n || x.label.localeCompare(y.label));
    if (area !== 'all' && !counts.has(area)) list.unshift({ key: area, label: area.replace(/\b\w/g, (c) => c.toUpperCase()), n: 0 });
    return list;
  }, [tenants, filter, service, favOnly, offersOnly, vegOnly, incompleteOnly, init.audit, openOnly, minuteKey, favs, query, area]);

  const chooseArea = (key) => { setArea(key); try { localStorage.setItem(AREA_KEY, key); } catch { /* ignore */ } };

  const geoReq = useRef(0);
  const toggleNear = () => {
    if (nearMe || geoMsg === L.en.finding || geoMsg === L.mr.finding) { geoReq.current += 1; setNearMe(false); setGeoMsg(''); return; }
    if (!navigator.geolocation) { setGeoMsg(tr.locNA); return; }
    setGeoMsg(tr.finding);
    const reqId = (geoReq.current += 1);
    navigator.geolocation.getCurrentPosition(
      (p) => { if (reqId !== geoReq.current) return; setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setNearMe(true); setGeoMsg(''); },
      (err) => { if (reqId === geoReq.current) setGeoMsg(err?.code === 1 ? tr.locDenied : err?.code === 3 ? tr.locTimeout : tr.locBusy); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    );
  };

  // Any filter change goes back to the first page.
  useEffect(() => { setLimit(PAGE); }, [filter, service, favOnly, offersOnly, vegOnly, openOnly, incompleteOnly, query, area, nearMe, sort]);

  // Map view keeps a valid selection as filters change.
  const mapTenant = useMemo(() => filtered.find((t) => t.tenantId === mapId) || filtered[0] || null, [filtered, mapId]);

  const byId = useMemo(() => new Map(tenants.map((t) => [t.tenantId, t])), [tenants]);
  const jumpBack = useMemo(() => {
    const ids = [...recent, ...favs.filter((id) => !recent.includes(id))];
    return ids.map((id) => byId.get(id)).filter(Boolean).slice(0, 10);
  }, [recent, favs, byId]);

  const offerCards = useMemo(
    () => filtered.flatMap((t) => (t.activeOffers || []).map((o) => ({ ...o, _tenant: t }))).slice(0, 12),
    [filtered]
  );
  const totalOffers = useMemo(() => tenants.reduce((n, t) => n + (Array.isArray(t.activeOffers) ? t.activeOffers.length : 0), 0), [tenants]);

  const featuredList = useMemo(() => tenants.filter(isFeatured), [tenants]);
  const stats = useMemo(() => ({
    pickup: tenants.filter((t) => t.config?.customerFeatures?.pickup !== false).length,
    reserve: tenants.filter((t) => t.config?.customerFeatures?.reservation !== false).length,
  }), [tenants]);
  // Hidden when every outlet is flagged pure-veg (the schema default is true, so the flag may simply never have been set) - a filter that keeps everything is noise and could mislabel non-veg places.
  const anyVeg = useMemo(() => tenants.some((t) => t.config?.onlyVeg === true) && tenants.some((t) => t.config?.onlyVeg !== true), [tenants]);
  const anyHours = useMemo(() => tenants.some((t) => openStatus(t.hours, minuteKey * 60000)), [tenants, minuteKey]);
  const openCount = useMemo(() => tenants.filter((t) => openStatus(t.hours, minuteKey * 60000)?.state === 'open').length, [tenants, minuteKey]);
  // A saved Offers / Pure-veg filter that no longer matches anything would show an empty list with no visible chip to turn off.
  useEffect(() => {
    // Only judge a saved filter against live data: an older cached list (no hours / offers yet) must not wipe the guest's choice.
    if (loading || !fresh || !tenants.length) return;
    if (offersOnly && totalOffers === 0) setOffersOnly(false);
    if (vegOnly && !anyVeg) setVegOnly(false);
    if (openOnly && !anyHours) setOpenOnly(false);
  }, [loading, fresh, tenants.length, offersOnly, vegOnly, openOnly, totalOffers, anyVeg, anyHours]);

  const surprise = () => {
    if (!filtered.length) return;
    openTenant(filtered[Math.floor(Math.random() * filtered.length)], 'surprise');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? tr.morning : hour < 17 ? tr.afternoon : tr.evening;
  const greetingLine = guestName ? `${greeting}, ${guestName}` : greeting;
  const visible = filtered.slice(0, limit);
  const resetFilters = () => { setFilter('all'); setService(null); setFavOnly(false); setOffersOnly(false); setVegOnly(false); setOpenOnly(false); setIncompleteOnly(false); setQuery(''); chooseArea('all'); };
  const hasFilters = filter !== 'all' || service || favOnly || offersOnly || vegOnly || openOnly || incompleteOnly || query || area !== 'all';
  const hasMore = filtered.length > limit;
  const showFeatured = !loading && !hasFilters && view === 'list' && featuredList.length > 0;
  const showHow = !howHidden && !loading && tenants.length > 0 && !hasFilters && !recent.length && !favs.length;
  const hideHow = () => { setHowHidden(true); try { localStorage.setItem(HOW_KEY, '1'); } catch { /* ignore */ } };
  const ownerCtaOk = /^(https?:|mailto:|tel:)/i.test(OWNER_CTA_URL);
  const auditRows = useMemo(() => (init.audit ? tenants.map((t) => ({ name: t.name || t.tenantId, gaps: listingGaps(t) })).filter((r) => r.gaps.length) : []), [init.audit, tenants]);
  const copyAudit = async () => {
    const text = auditRows.length ? auditRows.map((r) => `${r.name} — ${r.gaps.join(', ')}`).join('\n') : 'All listings are complete';
    try {
      await navigator.clipboard.writeText(text);
      setAuditMsg('Report copied');
    } catch { setAuditMsg('Copy not available'); }
    clearTimeout(auditTimer.current);
    auditTimer.current = setTimeout(() => setAuditMsg(''), 2200);
  };

  // Link to exactly this filtered view - owners share it on Instagram / WhatsApp, guests land on the same list.
  const viewLink = () => {
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim().slice(0, 60));
    if (filter !== 'all') p.set('type', filter);
    if (service) p.set('service', service);
    if (area !== 'all') p.set('area', area);
    if (offersOnly) p.set('offers', '1');
    if (vegOnly) p.set('veg', '1');
    if (openOnly) p.set('open', '1');
    const qs = p.toString();
    return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
  };
  const shareView = async () => {
    const url = viewLink();
    try {
      if (navigator.share) { await navigator.share({ title: 'Pratyeksha', url }); return; }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setLinkMsg(tr.linkCopied);
        clearTimeout(linkTimer.current);
        linkTimer.current = setTimeout(() => setLinkMsg(''), 2200);
      }
    } catch { /* cancelled or blocked - nothing to do */ }
  };

  // Infinite scroll: load the next page when the sentinel nears the viewport (the "+N more" button stays as a fallback).
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) setLimit((n) => n + PAGE); }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, limit, view, loading]);

  // Dialogs: Escape closes them and the page behind stops scrolling.
  const dialogOpen = !!sheetTenant || showAllOffers || scanning;
  useEffect(() => {
    if (!dialogOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') { setSheetTenant(null); setShowAllOffers(false); setScanning(false); } };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [dialogOpen]);
  dialogOpenRef.current = dialogOpen;
  const sheetRef = useRef(null);
  const offersRef = useRef(null);
  useFocusTrap(!!sheetTenant, sheetRef);
  useFocusTrap(showAllOffers, offersRef);

  return (
    <main style={{ minHeight: '100dvh', background: 'radial-gradient(900px 420px at 50% -10%, rgba(211,191,162,.10), transparent 60%), #0e0e0e', color: '#fff', fontFamily: 'Poppins, sans-serif', textAlign: 'left', boxShadow: '0 0 0 100vmax #0e0e0e', clipPath: 'inset(0 -100vmax)' }}>
      <style>{css}</style>
      {(pull > 0 || refreshing) && (
        <div aria-hidden="true" style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 10px)', left: '50%', zIndex: 1200, pointerEvents: 'none', transform: `translate(-50%, ${refreshing ? 0 : Math.round(pull * 22) - 22}px)`, opacity: refreshing ? 1 : pull, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 20, background: 'rgba(20,20,20,.94)', border: '1px solid rgba(211,191,162,.3)', color: GOLD, fontSize: 11, fontWeight: 800 }}>
          <RotateCcw size={13} className={refreshing ? 'pxh-spin' : undefined} style={refreshing ? undefined : { transform: `rotate(${Math.round(pull * 270)}deg)` }} />
          {refreshing ? tr.refreshing : pull >= 1 ? tr.releaseHint : tr.pullHint}
        </div>
      )}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 28px' }}>

        {/* ── Top bar: install · logo · scan · offers ── */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PwaInstallButton kind="customer" compact />
          <div style={{ background: '#f7f3eb', borderRadius: 12, padding: '5px 9px', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Pratyeksha" style={{ width: 132, height: 'auto', display: 'block' }} />
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => chooseLang(lang === 'en' ? 'mr' : 'en')} aria-label={lang === 'en' ? 'मराठी' : 'English'} style={{ ...iconBtn, width: 'auto', padding: '0 12px', color: GOLD, fontSize: 11, fontWeight: 900, fontFamily: 'inherit' }}>{lang === 'en' ? 'मराठी' : 'EN'}</button>
          {canScan && (
            <button type="button" onClick={() => setScanning(true)} aria-label="Scan table QR" style={iconBtn}><ScanLine size={18} color={GOLD} /></button>
          )}
          <button type="button" onClick={loadAllOffers} aria-label="All offers" style={{ ...iconBtn, position: 'relative' }}>
            <Tag size={17} color={GOLD} />
            {totalOffers > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 9, background: GOLD, color: '#101010', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalOffers > 99 ? '99+' : totalOffers}</span>}
          </button>
        </header>

        {(fromCache || !online) && (
          <div role="status" style={{ marginTop: 14, padding: '9px 14px', border: '1px solid rgba(211,191,162,.18)', background: 'rgba(211,191,162,.05)', borderRadius: 14, display: 'flex', gap: 9, alignItems: 'center', fontSize: 11.5, color: 'rgba(255,255,255,.7)' }}>
            <WifiOff size={14} color={GOLD} /> {fromCache ? tr.offlineCached : tr.offline}
          </div>
        )}

        {notification && (
          <div style={{ marginTop: 14, padding: '11px 14px', border: '1px solid rgba(211,191,162,.18)', background: 'rgba(211,191,162,.06)', borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <SpoonForkIcon size={16} color={GOLD} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.78)', flex: 1 }}>{notification}</div>
            <button type="button" onClick={() => { dismissedNote.current = location.search; setNotification(null); }} aria-label="Dismiss" style={{ border: 0, background: 'transparent', color: GOLD, cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
          </div>
        )}

        {/* ── Greeting + search ── */}
        <section style={{ padding: '26px 0 14px' }}>
          <h1 style={{ margin: 0, color: '#f7f3eb', textAlign: 'left', fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 'clamp(30px,7vw,46px)', lineHeight: 1.05, letterSpacing: '-.01em' }}>
            {greetingLine}<span style={{ color: GOLD }}>.</span>
          </h1>
          {loading && (
            <div className="pxh-stats" aria-hidden="true" style={{ alignItems: 'center', height: 15 }}>
              <Sk w={64} h={11} r={6} /><Sk w={84} h={11} r={6} d={0.1} /><Sk w={96} h={11} r={6} d={0.2} />
            </div>
          )}
          {!loading && tenants.length > 0 && (
            <div className="pxh-stats" aria-label="Summary">
              <span><b>{tenants.length}</b> {tenants.length === 1 ? tr.place : tr.places}</span>
              {openCount > 0 && <span><b>{openCount}</b> {tr.statOpen}</span>}
              {totalOffers > 0 && <span><b>{totalOffers}</b> {tr.statOffers}</span>}
              {stats.pickup > 0 && <span><b>{stats.pickup}</b> {tr.statPickup}</span>}
              {stats.reserve > 0 && <span><b>{stats.reserve}</b> {tr.statReserve}</span>}
              <button type="button" className="pxh-refresh" onClick={refresh} disabled={refreshing} aria-label={tr.refresh} title={tr.refresh}>
                <RotateCcw size={11} className={refreshing ? 'pxh-spin' : undefined} /> {refreshing ? tr.refreshing : updatedAt ? `${tr.updated} ${fmtAgo(updatedAt, tr)}` : tr.refresh}
              </button>
            </div>
          )}
          {init.audit && !loading && tenants.length > 0 && (
            <div role="region" aria-label="Listing audit" style={{ marginTop: 12, padding: '10px 12px', border: '1px solid rgba(240,180,80,.4)', background: 'rgba(240,180,80,.08)', borderRadius: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 11.5, color: 'rgba(255,255,255,.8)' }}>
              <b style={{ color: '#f0b450' }}>Audit mode</b>
              <span>{auditRows.length} of {tenants.length} listings incomplete</span>
              <span style={{ flex: 1 }} />
              <button type="button" className={`pxh-area${incompleteOnly ? ' on' : ''}`} aria-pressed={incompleteOnly} onClick={() => setIncompleteOnly(!incompleteOnly)}>{incompleteOnly ? 'Show all' : 'Only incomplete'}</button>
              <button type="button" className="pxh-area" onClick={copyAudit}>Copy report</button>
              {auditMsg && <span role="status" style={{ color: '#f0b450' }}>{auditMsg}</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} color="rgba(211,191,162,.55)" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={query} onFocus={() => setSearchOpen(true)} onBlur={() => { rememberSearch(query); setTimeout(() => setSearchOpen(false), 150); }} onKeyDown={(e) => {
                if (e.key === 'ArrowDown' && showSug) { e.preventDefault(); setSugIdx((i) => (i + 1) % suggestions.length); }
                else if (e.key === 'ArrowUp' && showSug) { e.preventDefault(); setSugIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1)); }
                else if (e.key === 'Escape' && showSug) { e.preventDefault(); setSearchOpen(false); setSugIdx(-1); }
                else if (e.key === 'Enter') {
                  if (showSug && sugIdx >= 0 && suggestions[sugIdx]) { e.preventDefault(); pickSuggestion(suggestions[sugIdx].text); } else rememberSearch(query);
                  e.currentTarget.blur();
                }
              }} onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); setSugIdx(-1); }} placeholder={tr.search} aria-label={tr.search}
                role="combobox" aria-expanded={showSug} aria-controls="pxh-sug" aria-autocomplete="list" aria-activedescendant={showSug && sugIdx >= 0 ? `pxh-sug-${sugIdx}` : undefined} style={{ width: '100%', boxSizing: 'border-box', padding: '13px 40px 13px 42px', borderRadius: 16, border: '1px solid rgba(211,191,162,.16)', background: 'rgba(255,255,255,.04)', color: '#fff', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', color: 'rgba(255,255,255,.4)', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={15} /></button>}
              {showSug && (
                <div id="pxh-sug" role="listbox" aria-label={tr.suggestions} style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)', zIndex: 30, borderRadius: 16, border: '1px solid rgba(211,191,162,.22)', background: '#141414', boxShadow: '0 18px 40px rgba(0,0,0,.55)', overflow: 'hidden' }}>
                  {suggestions.map((sg, i) => (
                    <button type="button" role="option" id={`pxh-sug-${i}`} key={`${sg.kind}-${sg.text}`} aria-selected={i === sugIdx} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setSugIdx(i)} onClick={() => pickSuggestion(sg.text)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 14px', border: 0, background: i === sugIdx ? 'rgba(211,191,162,.12)' : 'transparent', color: '#f7f3eb', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {sg.kind === 'area' ? <MapPin size={14} color={GOLD} /> : sg.cafe ? <Coffee size={14} color={GOLD} /> : <UtensilsCrossed size={14} color={GOLD} />}
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sg.text}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', flex: '0 0 auto' }}>{sg.kind === 'area' ? tr.sugArea : sg.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={surprise} disabled={!filtered.length} aria-label="Surprise me" title="Surprise me" style={{ ...iconBtn, width: 48, height: 48, borderRadius: 16, opacity: filtered.length ? 1 : .4 }}><Shuffle size={18} color={GOLD} /></button>
          </div>
        </section>

        {searchOpen && !query && searches.length > 0 && (
          <div className="pxh-areas" role="list" aria-label="Recent searches" style={{ marginTop: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', flex: '0 0 auto' }}><History size={12} /> {tr.recent}</span>
            {searches.map((t) => (
              <button type="button" key={t} role="listitem" className="pxh-area" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQuery(t); setSearchOpen(false); }}>{t}</button>
            ))}
            <button type="button" className="pxh-area" onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearches([]); writeList(SEARCHES_KEY, []); }} aria-label={tr.clearRecent}><X size={11} /> {tr.clearRecent}</button>
          </div>
        )}

        {/* ── Filter chips (single scrollable row) ── */}
        <div className="pxh-chips" role="toolbar" aria-label="Filters">
          <button type="button" className={`pxh-chip${filter === 'all' && !service && !favOnly && !offersOnly && !vegOnly && !openOnly ? ' on' : ''}`} onClick={resetFilters}><LayoutGrid size={13} /> {tr.all}</button>
          <button type="button" className={`pxh-chip${filter === 'cafe' ? ' on' : ''}`} onClick={() => setFilter(filter === 'cafe' ? 'all' : 'cafe')}><Coffee size={13} /> {tr.cafe}</button>
          <button type="button" className={`pxh-chip${filter === 'restaurant' ? ' on' : ''}`} onClick={() => setFilter(filter === 'restaurant' ? 'all' : 'restaurant')}><UtensilsCrossed size={13} /> {tr.dine}</button>
          {SERVICES.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} className={`pxh-chip${service === id ? ' on' : ''}`} onClick={() => setService(service === id ? null : id)}><Icon size={13} /> {tr[id] || label}</button>
          ))}
          <button type="button" className={`pxh-chip${favOnly ? ' on' : ''}`} onClick={() => setFavOnly(!favOnly)}><Heart size={13} fill={favOnly ? 'currentColor' : 'none'} /> {tr.saved}</button>
          {anyHours && <button type="button" className={`pxh-chip${openOnly ? ' on' : ''}`} aria-pressed={openOnly} onClick={() => setOpenOnly(!openOnly)}><Clock size={13} /> {tr.openNow}</button>}
          {totalOffers > 0 && <button type="button" className={`pxh-chip${offersOnly ? ' on' : ''}`} aria-pressed={offersOnly} onClick={() => setOffersOnly(!offersOnly)}><Tag size={13} /> {tr.offers}</button>}
          {anyVeg && <button type="button" className={`pxh-chip${vegOnly ? ' on' : ''}`} aria-pressed={vegOnly} onClick={() => setVegOnly(!vegOnly)}><Leaf size={13} /> {tr.veg}</button>}
        </div>

        {/* ── Area filter + Near me ── */}
        {(areaChips.length > 0 || canLocate) && (
          <div style={{ marginTop: 10 }}>
            <div className="pxh-areas" role="toolbar" aria-label="Areas">
              {canLocate && (
                <button type="button" className={`pxh-area${nearMe ? ' on' : ''}`} onClick={toggleNear} aria-pressed={nearMe}><Crosshair size={12} /> {tr.nearMe}</button>
              )}
              {areaChips.length > 0 && <button type="button" className={`pxh-area${area === 'all' ? ' on' : ''}`} onClick={() => chooseArea('all')}><MapPin size={12} /> {tr.allAreas}</button>}
              {areaChips.map((a) => (
                <button type="button" key={a.key} className={`pxh-area${area === a.key ? ' on' : ''}`} onClick={() => chooseArea(area === a.key ? 'all' : a.key)}>{a.label} <b>{a.n}</b></button>
              ))}
            </div>
            {geoMsg && <div role="status" style={{ marginTop: 6, fontSize: 11, color: 'rgba(211,191,162,.75)' }}>{geoMsg}</div>}
          </div>
        )}

        {/* ── Featured placements ── */}
        {showFeatured && (
          <section style={{ marginTop: 18 }} aria-label={tr.featuredRail}>
            <div className="pxh-sec"><Star size={12} fill="currentColor" /> {tr.featuredRail}</div>
            <div className="pxh-rail">
              {featuredList.slice(0, 10).map((t) => {
                const best = bestOffer(t);
                const km = distanceKm(pos, t);
                return (
                  <button type="button" key={t.tenantId} className="pxh-feat" ref={imprRef} data-tid={t.tenantId} onClick={() => openTenant(t, 'featured')} aria-label={`Open ${t.name}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar t={t} size={46} radius={14} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                        <div style={{ marginTop: 3, fontSize: 10.5, color: 'rgba(255,255,255,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[areaOf(t), km != null ? fmtKm(km) : ''].filter(Boolean).join(' · ')}</div>
                        {(() => { const l = statusLabel(openStatus(t.hours), tr); return l ? <div className={`pxh-status ${l.tone}`}><i /><span>{l.text}</span></div> : null; })()}
                      </div>
                    </div>
                    <div style={{ marginTop: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {best && <span className="pxh-offerpill"><Tag size={10} /> {offerValue(best)}</span>}
                      <span style={{ flex: 1 }} />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 900, color: GOLD }}>{tr.openMenu} <ChevronRight size={13} /></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── How it works (first-time guests only) ── */}
        {showHow && (
          <section style={{ marginTop: 18 }} aria-label={tr.howTitle}>
            <div className="pxh-how">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="pxh-sec" style={{ margin: 0 }}><Sparkles size={12} /> {tr.howTitle}</div>
                <button type="button" onClick={hideHow} aria-label={tr.hide} style={{ border: 0, background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={12} /> {tr.hide}</button>
              </div>
              <div className="pxh-how-grid">
                <div className="pxh-how-step"><i><Search size={14} color={GOLD} /></i><b>{tr.how1t}</b><span>{tr.how1}</span></div>
                <div className="pxh-how-step"><i><ShoppingBag size={14} color={GOLD} /></i><b>{tr.how2t}</b><span>{tr.how2}</span></div>
                <div className="pxh-how-step"><i><Sparkles size={14} color={GOLD} /></i><b>{tr.how3t}</b><span>{tr.how3}</span></div>
              </div>
            </div>
          </section>
        )}

        {/* ── Offers rail ── */}
        {offerCards.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <div className="pxh-rail">
              {offerCards.map((offer) => (
                <button type="button" key={`${offer._tenant.tenantId}-${offer._id ?? offer.title ?? ''}-${offer.type}-${offer.value ?? ''}`} onClick={() => openTenant(offer._tenant, 'offers')} style={{ flex: '0 0 auto', minWidth: 214, maxWidth: 250, textAlign: 'left', border: '1px solid rgba(211,191,162,.2)', borderRadius: 16, background: 'linear-gradient(135deg,rgba(211,191,162,.16),rgba(211,191,162,.04) 60%,#121212)', color: '#fff', padding: '12px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}>
                  <Avatar t={offer._tenant} size={38} radius={11} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: GOLD, letterSpacing: .3 }}>{offerValue(offer)}</div>
                    <div style={{ marginTop: 2, fontSize: 11, color: 'rgba(255,255,255,.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer._tenant.name}</div>
                  </div>
                  <ChevronRight size={14} color={GOLD} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Jump back in (recent + saved) ── */}
        {jumpBack.length > 0 && !loading && (
          <section style={{ marginTop: 14 }}>
            <div className="pxh-rail">
              {jumpBack.map((t) => (
                <button type="button" key={t.tenantId} className="pxh-bubble" onClick={() => openTenant(t, favs.includes(t.tenantId) && !recent.includes(t.tenantId) ? 'saved' : 'recent')}>
                  <span className="pxh-ring"><div><Avatar t={t} size={50} radius={25} /></div></span>
                  <span style={{ fontSize: 10, fontWeight: 700, width: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Restaurants ── */}
        <section style={{ marginTop: 14 }}>
          {!loading && !loadError && filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '0 0 12px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 700, letterSpacing: .3 }}>
                {filtered.length} {filtered.length === 1 ? tr.place : tr.places}{area !== 'all' && areaChips.find((a) => a.key === area) ? ` ${tr.inArea} ${areaChips.find((a) => a.key === area).label}` : ''}{nearMe ? tr.nearest : ''}
                <button type="button" className="pxh-share" onClick={shareView} aria-label={tr.shareView} title={tr.shareView}><Share2 size={12} /></button>
                {linkMsg && <span role="status" style={{ marginLeft: 8, color: GOLD }}>{linkMsg}</span>}
              </div>
              <label className="pxh-sort" title={tr.sort}>
                <ArrowUpDown size={12} />
                <select aria-label={tr.sort} value={nearMe ? 'recommended' : sort} disabled={nearMe} onChange={(e) => chooseSort(e.target.value)}>
                  <option value="recommended">{tr.sortRec}</option>
                  <option value="az">{tr.sortAz}</option>
                  <option value="offers">{tr.sortOffers}</option>
                  <option value="saved">{tr.sortSaved}</option>
                </select>
              </label>
              <div className="pxh-seg" role="tablist" aria-label="View">
                <button type="button" role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><ListIcon size={13} /> {tr.list}</button>
                <button type="button" role="tab" aria-selected={view === 'map'} className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}><MapIcon size={13} /> {tr.map}</button>
              </div>
            </div>
          )}
          {loading ? (
            <ListSkeleton label={tr.loadingList} />
          ) : loadError ? (
            <div style={{ border: '1px solid rgba(211,191,162,.12)', borderRadius: 20, padding: '38px 20px', textAlign: 'center', background: 'rgba(255,255,255,.02)' }}>
              <Wifi size={22} color={GOLD} />
              <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{loadError || (online ? tr.loadFail : tr.offline)}</div>
              <button type="button" onClick={() => load()} style={{ marginTop: 14, border: '1px solid rgba(211,191,162,.28)', background: 'rgba(211,191,162,.08)', color: GOLD, borderRadius: 12, padding: '9px 16px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}><RotateCcw size={13} /> {tr.retry}</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ border: '1px solid rgba(211,191,162,.1)', borderRadius: 20, padding: '38px 20px', textAlign: 'center', background: 'rgba(255,255,255,.02)' }}>
              <Sparkles size={22} color={GOLD} />
              <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.55)' }}>{favOnly && !favs.length ? tr.saveHint : tr.nothing}</div>
              {hasFilters && <button type="button" onClick={resetFilters} style={{ marginTop: 14, border: '1px solid rgba(211,191,162,.28)', background: 'rgba(211,191,162,.08)', color: GOLD, borderRadius: 12, padding: '9px 16px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{tr.clear}</button>}
            </div>
          ) : (
            view === 'map' && mapTenant ? (
              <div className="pxh-mapwrap">
                <div className="pxh-maplist" style={{ display: 'grid', gap: 9, alignContent: 'start', order: 2 }}>
                  {filtered.map((t) => {
                    const km = distanceKm(pos, t);
                    return (
                      <button type="button" key={t.tenantId} className={`pxh-place${mapTenant.tenantId === t.tenantId ? ' on' : ''}`} onClick={() => setMapId(t.tenantId)} aria-pressed={mapTenant.tenantId === t.tenantId}>
                        <Avatar t={t} size={40} radius={12} />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ display: 'block', fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                          <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, color: 'rgba(255,255,255,.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{areaOf(t) || 'Location not added'}</span>
                        </span>
                        {km != null && <span style={{ fontSize: 10.5, fontWeight: 900, color: GOLD }}>{fmtKm(km)}</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ order: 1 }}><PlaceDetail key={mapTenant.tenantId} t={mapTenant} pos={pos} onOrder={(x) => openTenant(x, 'map')} tr={tr} /></div>
              </div>
            ) : (
            <>
              <div className="pxh-grid">
                {visible.map((tenant, i) => {
                  const features = tenant.config?.customerFeatures || {};
                  const isFav = favs.includes(tenant.tenantId);
                  const offers = Array.isArray(tenant.activeOffers) ? tenant.activeOffers.length : 0;
                  const best = bestOffer(tenant);
                  const featured = isFeatured(tenant);
                  const badge = featured ? 'feat' : isNew(tenant) ? 'new' : '';
                  const gaps = init.audit ? listingGaps(tenant) : [];
                  const st = statusLabel(openStatus(tenant.hours), tr);
                  return (
                    <motion.div key={tenant.tenantId} className={`pxh-card${featured ? ' featured' : ''}`} ref={imprRef} data-tid={tenant.tenantId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.25 }} whileTap={{ scale: 0.985 }}>
                      {badge && <span className={`pxh-ribbon ${badge}`}>{badge === 'feat' ? <><Star size={9} fill="currentColor" /> {tr.featured}</> : tr.isNew}</span>}
                      <button type="button" className="main" onClick={() => openTenant(tenant)} aria-label={`Open ${tenant.name}`} style={badge ? { paddingTop: 30 } : undefined}>
                        <Avatar t={tenant} size={52} radius={16} />
                        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenant.name}</div>
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'rgba(255,255,255,.38)', minHeight: 14 }}>
                          {areaOf(tenant) && <><MapPin size={10} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{areaOf(tenant)}{distanceKm(pos, tenant) != null ? ` · ${fmtKm(distanceKm(pos, tenant))}` : ''}</span></>}
                        </div>
                        {st && <div className={`pxh-status ${st.tone}`}><i /><span>{st.text}</span></div>}
                        {best && <div style={{ marginTop: 8 }}><span className="pxh-offerpill"><Tag size={10} /> {offerValue(best)}{offers > 1 ? ` +${offers - 1}` : ''}</span></div>}
                        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 9, minHeight: 24, paddingRight: hasPlace(tenant) ? 36 : 0 }}>
                          {SERVICES.map(({ id, label, icon: Icon }) => features[id] !== false && <span key={id} title={label} style={{ display: 'flex', color: 'rgba(211,191,162,.65)' }}><Icon size={13} /></span>)}
                          <span style={{ flex: 1 }} />
                        </div>
                        {init.audit && (
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {gaps.length === 0
                              ? <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 8, background: 'rgba(122,201,152,.14)', color: '#8fd6a8' }}>✓ Complete</span>
                              : gaps.map((g) => <span key={g} style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 8, background: 'rgba(240,180,80,.14)', color: '#f0b450' }}>{g}</span>)}
                          </div>
                        )}
                      </button>
                      {hasPlace(tenant) && (
                        <button type="button" className="pxh-nav" onClick={() => setSheetTenant(tenant)} aria-label={`Map and directions for ${tenant.name}`}><Navigation size={14} /></button>
                      )}
                      <button type="button" className={`pxh-heart${isFav ? ' on' : ''}`} onClick={() => toggleFav(tenant.tenantId)} aria-label={isFav ? 'Remove from saved' : 'Save'} aria-pressed={isFav}>
                        <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
              {hasMore && <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" onClick={() => setLimit((n) => n + PAGE)} style={{ border: '1px solid rgba(211,191,162,.24)', background: 'rgba(211,191,162,.07)', color: GOLD, borderRadius: 22, padding: '10px 22px', fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    +{Math.min(PAGE, filtered.length - limit)} {tr.more}
                  </button>
                </div>
              )}
            </>
            )
          )}
        </section>

        {/* ── For owners: turn every guest visit into a listing enquiry ── */}
        {ownerCtaOk && !loading && (
          <section style={{ marginTop: 28 }} aria-label={tr.ownerTitle}>
            <div className="pxh-owner">
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#f7f3eb' }}>{tr.ownerTitle}</div>
                <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,.6)' }}>{tr.ownerBody}</div>
              </div>
              <a className="pxh-btn pri" href={OWNER_CTA_URL} target="_blank" rel="noopener noreferrer">{tr.ownerBtn} <ChevronRight size={14} /></a>
            </div>
          </section>
        )}
      </div>

      {/* ── Map & directions sheet ── */}
      <AnimatePresence>
        {sheetTenant && (
          <motion.div role="dialog" aria-modal="true" aria-label={`Map of ${sheetTenant.name}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheetTenant(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,5,.82)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} ref={sheetRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} style={{ outline: 'none', width: 'min(560px,100%)', maxHeight: '92dvh', overflowY: 'auto', borderRadius: '24px 24px 0 0', position: 'relative' }}>
              <button type="button" onClick={() => setSheetTenant(null)} aria-label="Close" style={{ ...iconBtn, position: 'absolute', top: 12, right: 12, zIndex: 3, width: 34, height: 34, background: 'rgba(12,12,12,.8)' }}><X size={16} color={GOLD} /></button>
              <PlaceDetail t={sheetTenant} pos={pos} tr={tr} onOrder={(t) => { setSheetTenant(null); openTenant(t, 'map'); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All offers ── */}
      <AnimatePresence>
        {showAllOffers && (
          <motion.div role="dialog" aria-modal="true" aria-label="All offers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAllOffers(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,5,.82)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} ref={offersRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} style={{ outline: 'none', width: 'min(900px,100%)', maxHeight: '86dvh', overflow: 'hidden', border: '1px solid rgba(211,191,162,.18)', borderBottom: 0, borderRadius: '24px 24px 0 0', background: 'linear-gradient(160deg,#181818,#0d0d0d)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(211,191,162,.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontSize: 11, letterSpacing: 2.2, fontWeight: 900 }}><Tag size={14} /> OFFERS</div>
                <button type="button" onClick={() => setShowAllOffers(false)} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 11, border: '1px solid rgba(211,191,162,.16)', background: 'rgba(255,255,255,.03)', color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>
              <div style={{ overflowY: 'auto', padding: 14, WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}>
                {offersLoading ? (
                  <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.38)', fontSize: 12 }}>Loading…</div>
                ) : offersError ? (
                  <div style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.48)', fontSize: 12, textAlign: 'center' }}>{offersError}</div>
                ) : allOffers.length === 0 ? (
                  <div style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.38)', fontSize: 12 }}>No offers right now</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>
                    {allOffers.map((offer, i) => {
                      const tenant = offer.tenant || {};
                      const value = offer.type === 'happy_hour' ? `${offer.happyStart || '?'}–${offer.happyEnd || '?'}` : offerValue(offer);
                      return (
                        <button type="button" key={`${tenant.tenantId}-${offer._id ?? offer.title ?? ''}-${i}`} onClick={() => { setShowAllOffers(false); openTenant(tenant, 'offers'); }} style={{ textAlign: 'left', border: '1px solid rgba(211,191,162,.14)', borderRadius: 16, background: 'linear-gradient(145deg,#191919,#101010)', color: '#fff', padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, fontFamily: 'inherit' }}>
                          <Avatar t={tenant} size={40} radius={12} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>{value}</div>
                            <div style={{ fontSize: 11, marginTop: 3, color: 'rgba(255,255,255,.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[offer.title, tenant.name || 'Restaurant'].filter(Boolean).join(' · ')}</div>
                          </div>
                          <ChevronRight size={15} color={GOLD} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {scanning && <QrScanner onClose={() => setScanning(false)} onPath={(path) => { setScanning(false); navigate(path); }} />}
      {showTop && (
        <button type="button" className="pxh-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><ArrowUp size={18} /></button>
      )}
    </main>
  );
}

const iconBtn = { width: 40, height: 40, borderRadius: 13, border: '1px solid rgba(211,191,162,.18)', background: 'rgba(255,255,255,.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

/* ── In-app table QR scanner (BarcodeDetector). Only same-origin links are followed. ── */
function QrScanner({ onClose, onPath }) {
  const videoRef = useRef(null);
  const [message, setMessage] = useState('');
  const onPathRef = useRef(onPath);
  onPathRef.current = onPath;
  const dlgRef = useRef(null);
  useFocusTrap(true, dlgRef);

  useEffect(() => {
    let stream = null;
    let timer = null;
    let alive = true;
    let busy = false;
    let lastBad = '';
    (async () => {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        const video = videoRef.current;
        if (!video) { stream.getTracks().forEach((t) => t.stop()); return; } // camera light used to stay on
        video.srcObject = stream;
        await video.play().catch(() => {});
        timer = window.setInterval(async () => {
          if (busy || !video.videoWidth) return;
          busy = true;
          try {
            const codes = await detector.detect(video);
            const raw = codes?.[0]?.rawValue;
            if (raw && alive) {
              let target = null;
              try {
                const u = new URL(raw, window.location.origin);
                if (u.origin === window.location.origin) target = `${u.pathname}${u.search}${u.hash}`;
              } catch { /* not a URL */ }
              if (target) { alive = false; onPathRef.current(target); }
              else if (raw !== lastBad) { lastBad = raw; setMessage('Not a Pratyeksha table code'); }
            }
          } catch { /* transient decode error */ }
          busy = false;
        }, 350);
      } catch (err) {
        if (alive) setMessage(err?.name === 'NotAllowedError' ? 'Allow camera access to scan' : 'Camera unavailable');
      }
    })();
    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div ref={dlgRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Scan table QR" style={{ outline: 'none', position: 'fixed', inset: 0, zIndex: 1100, background: '#050505', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 12px', color: GOLD, fontSize: 11, letterSpacing: 2.2, fontWeight: 900 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ScanLine size={15} /> SCAN TABLE QR</span>
        <button type="button" onClick={onClose} aria-label="Close scanner" style={{ ...iconBtn, width: 36, height: 36 }}><X size={16} color={GOLD} /></button>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 'min(64vw,260px)', aspectRatio: '1', borderRadius: 26, border: `2px solid ${GOLD}`, boxShadow: '0 0 0 100vmax rgba(5,5,5,.55)' }} />
        </div>
        {message && <div style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))', textAlign: 'center', padding: '11px 14px', borderRadius: 14, background: 'rgba(15,15,15,.88)', border: '1px solid rgba(211,191,162,.25)', color: '#fff', fontSize: 12 }}>{message}</div>}
      </div>
    </div>
  );
}
