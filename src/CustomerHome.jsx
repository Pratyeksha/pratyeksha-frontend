import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Coffee, UtensilsCrossed, Search, Bell, ChevronRight, MapPin, Wifi, Sparkles, X, Tag,
  Heart, ScanLine, Shuffle, ShoppingBag, CalendarCheck, Clock, LayoutGrid, RotateCcw,
  Navigation, Map as MapIcon, List as ListIcon, Copy, Share2, Crosshair, ExternalLink, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import PwaInstallButton from './PwaInstallButton.jsx';

import API_BASE_URL from './apiBase.js';

const BASE_URL = API_BASE_URL;
const logo = '/pratyeksha-logo.png';
const GOLD = '#A77732';
const PAGE = 8;
const FAV_KEY = 'px_home_favs';
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
const isCafe = (t) => typeOf(t) === 'cafe' || /caf[eé]|coffee/i.test(String(t?.name || ''));
const offerValue = (o) => (o.type === 'percent_off' ? `${o.value}% OFF` : o.type === 'fixed_off' ? `₹${o.value} OFF` : o.type === 'free_item' ? `FREE ${o.freeItem || 'ITEM'}` : 'HAPPY HOUR');

const SERVICES = [
  { id: 'pickup', label: 'Pickup', icon: ShoppingBag },
  { id: 'reservation', label: 'Reserve', icon: CalendarCheck },
  { id: 'waitlist', label: 'Waitlist', icon: Clock },
];


/* ── Location helpers: area filter, Google Maps embed + directions, distance ── */
const areaOf = (t) => String(t?.address?.area || t?.address?.city || 'Kolhapur').trim();
const hasCoords = (t) => Number.isFinite(Number(t?.address?.lat)) && Number.isFinite(Number(t?.address?.lng)) && t?.address?.lat !== null && t?.address?.lng !== null && t?.address?.lat !== '';
const addressLine = (t) => {
  const a = t?.address;
  if (typeof a === 'string') return a.trim();
  return [a?.street, a?.area, a?.city, [a?.state, a?.pincode].filter(Boolean).join(' ')].map((x) => String(x || '').trim()).filter(Boolean).join(', ');
};
const mapQuery = (t) => (hasCoords(t) ? `${Number(t.address.lat)},${Number(t.address.lng)}` : [t?.name, addressLine(t), 'Kolhapur, Maharashtra, India'].filter(Boolean).join(', '));
const cityMapQuery = 'restaurants and cafes in Kolhapur, Maharashtra, India';
const cityEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(cityMapQuery)}&z=13&output=embed`;
const embedUrl = (t) => `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(t))}&z=16&output=embed`;
const directionsUrl = (t) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery(t))}&travelmode=driving`;
const openMapUrl = (t) => (t?.address?.mapsUrl && /^https:\/\//i.test(t.address.mapsUrl) ? t.address.mapsUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(t))}`);
const cityPlacesUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityMapQuery)}`;
const hasPlace = (t) => hasCoords(t) || !!addressLine(t);
const distanceKm = (pos, t) => {
  if (!pos || !hasCoords(t)) return null;
  const R = 6371; const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(Number(t.address.lat) - pos.lat); const dLng = rad(Number(t.address.lng) - pos.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(pos.lat)) * Math.cos(rad(Number(t.address.lat))) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};
const fmtKm = (km) => (km == null ? '' : km < 1 ? `${Math.max(50, Math.round(km * 10) * 100)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`);

const css = `
.pxh-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:4px 8px 10px;margin:-4px -8px -6px}
.pxh-chips::-webkit-scrollbar{display:none}
.pxh-chip{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(167,119,50,.24);background:#FFFFFF;color:#4A463D;border-radius:22px;padding:8px 13px;font-size:11px;font-weight:800;cursor:pointer;transition:all .18s}
.pxh-chip.on{background:linear-gradient(135deg,#A77732,#C8B48D);color:#101010;border-color:transparent;box-shadow:0 6px 18px rgba(167,119,50,.26)}
.pxh-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(min-width:720px){.pxh-grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}}
.pxh-card{position:relative;border:1px solid rgba(167,119,50,.24);border-radius:20px;background:linear-gradient(160deg,#FFFFFF,#F8F3E9);overflow:hidden;transition:transform .2s,border-color .2s,box-shadow .2s}
.pxh-card:hover{transform:translateY(-3px);border-color:rgba(167,119,50,.42);box-shadow:0 14px 34px rgba(0,0,0,.35)}
.pxh-card>button.main{display:block;width:100%;text-align:left;background:none;border:0;color:#24231F;cursor:pointer;padding:14px 14px 13px;font-family:inherit}
.pxh-heart{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(167,119,50,.24);background:rgba(10,10,10,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(211,191,162,.6);padding:0;transition:all .18s}
.pxh-heart.on{color:#A77732;border-color:rgba(211,191,162,.5);background:rgba(167,119,50,.18)}
.pxh-rail{display:flex;gap:14px;overflow-x:auto;scrollbar-width:none;padding:2px 1px 6px;-webkit-overflow-scrolling:touch}
.pxh-rail::-webkit-scrollbar{display:none}
.pxh-bubble{flex:0 0 auto;width:64px;display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;color:#4A463D;cursor:pointer;font-family:inherit;padding:0}
.pxh-ring{width:58px;height:58px;border-radius:50%;padding:2px;background:conic-gradient(from 210deg,#A77732,#8B642C,#A77732);display:flex}
.pxh-ring>div{flex:1;border-radius:50%;background:#FAF6ED;display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid #0e0e0e}
.pxh-areas{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:2px 8px 4px;margin:0 -8px}
.pxh-areas::-webkit-scrollbar{display:none}
.pxh-area{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(167,119,50,.18);background:transparent;color:#4A463D;border-radius:12px;padding:7px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s}
.pxh-area b{font-size:9.5px;font-weight:900;color:rgba(211,191,162,.7);background:rgba(167,119,50,.12);border-radius:8px;padding:1px 6px}
.pxh-area.on{border-color:rgba(167,119,50,.55);background:rgba(167,119,50,.20);color:#FAF6ED}
.pxh-seg{display:inline-flex;border:1px solid rgba(167,119,50,.26);border-radius:13px;padding:3px;background:rgba(255,255,255,.03)}
.pxh-seg button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#5F594E;font-size:11px;font-weight:800;padding:7px 12px;border-radius:10px;cursor:pointer;font-family:inherit}
.pxh-seg button.on{background:linear-gradient(135deg,#A77732,#C8B48D);color:#101010}
.pxh-nav{position:absolute;right:10px;bottom:10px;width:32px;height:32px;border-radius:11px;border:1px solid rgba(167,119,50,.30);background:rgba(167,119,50,.12);color:#A77732;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:all .18s}
.pxh-nav:hover{background:rgba(211,191,162,.2)}
.pxh-mapwrap{display:grid;gap:14px;grid-template-columns:1fr}
@media(min-width:860px){.pxh-mapwrap{grid-template-columns:minmax(280px,.8fr) 1.4fr;align-items:start}.pxh-mapwrap .pxh-maplist{max-height:560px;overflow-y:auto}.pxh-mapwrap .pxh-detail{position:sticky;top:14px}}
.pxh-place{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:1px solid rgba(167,119,50,.20);background:linear-gradient(160deg,#FFFFFF,#F8F3E9);color:#24231F;border-radius:16px;padding:11px 12px;cursor:pointer;font-family:inherit;transition:all .18s}
.pxh-place.on{border-color:rgba(167,119,50,.55);background:linear-gradient(160deg,rgba(167,119,50,.18),#121212)}
.pxh-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:13px;padding:11px 15px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;border:1px solid rgba(211,191,162,.26);background:rgba(167,119,50,.10);color:#A77732;text-decoration:none;transition:all .18s}
.pxh-btn.pri{background:linear-gradient(135deg,#E8D9BF,#A77732 55%,#C8B48D);color:#101010;border-color:transparent;box-shadow:0 8px 20px -8px rgba(167,119,50,.55)}
@keyframes pxhShimmer{0%{background-position:-300px 0}100%{background-position:300px 0}}
.pxh-skel{border-radius:20px;height:132px;border:1px solid rgba(211,191,162,.08);background:linear-gradient(90deg,#F2E8D6 0%,#FFFFFF 50%,#F2E8D6 100%);background-size:600px 100%;animation:pxhShimmer 1.3s linear infinite}
@media(prefers-reduced-motion:reduce){.pxh-skel{animation:none}.pxh-card{transition:none}}
/* PRATYEKSHa editorial light palette — styling only; application logic is unchanged. */
.pxh-chips .pxh-chip{background:#fff;color:#454136;border-color:#DCCDB4}
.pxh-chips .pxh-chip.on{background:linear-gradient(135deg,#B38A4A,#D8BD8C);color:#1E211A}
.pxh-card{background:linear-gradient(160deg,#FFFFFF,#F8F3E9);border-color:#E0D3BD;box-shadow:0 8px 26px rgba(45,36,20,.06)}
.pxh-card>button.main{color:#24231F}
.pxh-heart{background:rgba(250,246,237,.94);border-color:#DCCDB4;color:#8B642C}
.pxh-bubble{color:#454136}
.pxh-ring{background:conic-gradient(from 210deg,#B38A4A,#8B642C,#D8BD8C)}
.pxh-ring>div{background:#FAF6ED;border-color:#FAF6ED}
.pxh-area{background:#fff;color:#454136;border-color:#DCCDB4}
.pxh-area b{color:#765522;background:#F2E8D6}
.pxh-area.on{background:linear-gradient(135deg,#B38A4A,#D8BD8C);color:#20170C;border-color:#8B642C}
.pxh-seg{background:#F2E8D6;border-color:#DCCDB4}
.pxh-seg button{color:#514B40}
.pxh-seg button.on{background:linear-gradient(135deg,#B38A4A,#D8BD8C);color:#1E211A}
.pxh-nav{background:#F2E8D6;color:#765522;border-color:#DCCDB4}
.pxh-place{background:linear-gradient(160deg,#FFFFFF,#F8F3E9);color:#24231F;border-color:#E0D3BD}
.pxh-place.on{background:#F2E8D6;border-color:#B38A4A}
.pxh-btn{background:#F2E8D6;color:#765522;border-color:#D7C5A7}
.pxh-btn.pri{background:linear-gradient(135deg,#B38A4A,#D8BD8C);color:#1E211A}
.pxh-skel{border-color:#E0D3BD;background:linear-gradient(90deg,#F2E8D6 0%,#FFFFFF 50%,#F2E8D6 100%)}
main[style*="radial-gradient"]{background-color:#FAF6ED!important;color:#24231F!important}
main[style*="radial-gradient"] input,main[style*="radial-gradient"] select,main[style*="radial-gradient"] textarea{background:#FFFFFF!important;color:#24231F!important;border-color:#DCCDB4!important}
main[style*="radial-gradient"] input::placeholder,main[style*="radial-gradient"] textarea::placeholder{color:#746D5D!important;opacity:1}
main[style*="radial-gradient"] [style*="color: rgba(255,255,255"],main[style*="radial-gradient"] [style*="color: 'rgba(255,255,255"]{color:#5F594E!important}
main[style*="radial-gradient"] [style*="background: 'linear-gradient(160deg,#171717"],main[style*="radial-gradient"] [style*="background: 'linear-gradient(145deg,#191919"]{background:linear-gradient(160deg,#FFFFFF,#F8F3E9)!important;color:#24231F!important;border-color:#E0D3BD!important}

/* High-contrast beige + gold correction: no green; keep every label readable. */
.pxh-area.on{background:linear-gradient(135deg,#B38A4A,#D8BD8C)!important;color:#20170C!important;border-color:#8B642C!important}
.pxh-area.on b{background:#FAF6ED!important;color:#5A3B12!important}
.pxh-chip,.pxh-chips .pxh-chip{background:#FFFFFF!important;color:#30271B!important;border-color:#C8B48D!important}
.pxh-chip.on,.pxh-chips .pxh-chip.on{background:linear-gradient(135deg,#A77732,#D8BD8C)!important;color:#17120A!important;border-color:#8B642C!important}
.pxh-seg button{color:#4A3924!important}
.pxh-seg button.on{background:linear-gradient(135deg,#A77732,#D8BD8C)!important;color:#17120A!important}
.pxh-btn{background:#F2E8D6!important;color:#654515!important;border-color:#BDA477!important}
.pxh-btn.pri{background:linear-gradient(135deg,#A77732,#D8BD8C)!important;color:#17120A!important}
.pxh-nav{background:#F2E8D6!important;color:#654515!important}
.pxh-place.on{background:linear-gradient(135deg,#F2E8D6,#E8D4B0)!important;color:#24231F!important;border-color:#A77732!important}
.pxh-card,.pxh-detail,.pxh-place{color:#24231F}
.pxh-card button.main,.pxh-card button.main *,.pxh-place *{text-shadow:none}
.pxh-card button.main{color:#24231F!important}
.pxh-card button.main p,.pxh-card button.main span,.pxh-card button.main small,.pxh-card button.main strong{color:inherit}
.pxh-bubble{color:#30271B!important}
.pxh-area{background:#FFFFFF!important;color:#403323!important;border-color:#DCCDB4!important}
.pxh-area b{color:#654515!important;background:#F2E8D6!important}
.pxh-heart{background:#FAF6ED!important;color:#765522!important}
.pxh-heart.on{background:#F2E8D6!important;color:#8B642C!important}
.pxh-btn:focus-visible,.pxh-chip:focus-visible,.pxh-area:focus-visible,.pxh-seg button:focus-visible{outline:3px solid #8B642C!important;outline-offset:2px}

/* FINAL VISIBILITY OVERRIDE — force readable ink text across the light customer UI. */
main[style*="radial-gradient"] { color:#242018!important; }
main[style*="radial-gradient"] h1,
main[style*="radial-gradient"] h2,
main[style*="radial-gradient"] h3,
main[style*="radial-gradient"] h4,
main[style*="radial-gradient"] p,
main[style*="radial-gradient"] span,
main[style*="radial-gradient"] label,
main[style*="radial-gradient"] small,
main[style*="radial-gradient"] strong,
main[style*="radial-gradient"] b,
main[style*="radial-gradient"] em,
main[style*="radial-gradient"] li,
main[style*="radial-gradient"] dt,
main[style*="radial-gradient"] dd,
main[style*="radial-gradient"] a,
main[style*="radial-gradient"] button,
main[style*="radial-gradient"] [role="button"],
main[style*="radial-gradient"] [class*="text-"] {
  color:#292319!important;
  -webkit-text-fill-color:#292319!important;
  text-shadow:none!important;
}
main[style*="radial-gradient"] [style*="background: '#0"],
main[style*="radial-gradient"] [style*='background: "#0'],
main[style*="radial-gradient"] [style*="background: 'linear-gradient(160deg,#171717"],
main[style*="radial-gradient"] [style*="background: 'linear-gradient(145deg,#191919"] {
  background:linear-gradient(145deg,#FFFFFF,#F2E8D6)!important;
  color:#292319!important;
  border-color:#DCCDB4!important;
}
main[style*="radial-gradient"] input,
main[style*="radial-gradient"] textarea,
main[style*="radial-gradient"] select {
  color:#292319!important;
  -webkit-text-fill-color:#292319!important;
  background:#FFFFFF!important;
  border-color:#C8B48D!important;
}
main[style*="radial-gradient"] input::placeholder,
main[style*="radial-gradient"] textarea::placeholder {
  color:#746D5D!important;
  -webkit-text-fill-color:#746D5D!important;
  opacity:1!important;
}
main[style*="radial-gradient"] .pxh-chip.on,
main[style*="radial-gradient"] .pxh-area.on,
main[style*="radial-gradient"] .pxh-seg button.on,
main[style*="radial-gradient"] .pxh-btn.pri {
  color:#20170C!important;
  -webkit-text-fill-color:#20170C!important;
}

/* Premium finishing pass — consistent editorial surfaces and readable text. */
.pxh-chips{padding-bottom:12px}
.pxh-chip{box-shadow:0 2px 8px rgba(80,55,20,.04);font-size:12px;min-height:38px}
.pxh-chip.on{box-shadow:0 4px 12px rgba(139,100,44,.18)}
.pxh-card{border-radius:22px;box-shadow:0 8px 24px rgba(66,47,20,.07)}
.pxh-card:hover{box-shadow:0 14px 32px rgba(66,47,20,.12)}
.pxh-area{min-height:36px;box-shadow:0 2px 8px rgba(80,55,20,.035)}
.pxh-btn{min-height:42px;box-shadow:0 2px 8px rgba(80,55,20,.04)}
.pxh-btn.pri{box-shadow:0 5px 14px rgba(139,100,44,.22)}
.pxh-seg{background:#F2E8D6;border-color:#DCCDB4}
.pxh-card,.pxh-place,.pxh-btn,.pxh-chip,.pxh-area{transition:background-color .18s ease,border-color .18s ease,box-shadow .18s ease,transform .18s ease}
main[style*="radial-gradient"]{background:radial-gradient(900px 420px at 50% -10%,rgba(179,138,74,.12),transparent 60%),#FAF6ED!important}
main[style*="radial-gradient"] input{box-shadow:inset 0 1px 2px rgba(60,40,15,.025)}
main[style*="radial-gradient"] input:focus{border-color:#A77732!important;box-shadow:0 0 0 3px rgba(167,119,50,.14)!important}
main[style*="radial-gradient"] button:focus-visible{outline:3px solid rgba(167,119,50,.55)!important;outline-offset:2px}
@media(max-width:380px){.pxh-card{border-radius:17px}.pxh-chip{padding:8px 10px}.pxh-grid{gap:9px}}
@media(prefers-reduced-motion:reduce){.pxh-card,.pxh-place,.pxh-btn,.pxh-chip,.pxh-area{transition:none!important}}

/* Deep contrast audit: explicitly map text to readable ink on light surfaces. */
main[style*="radial-gradient"] {
  color:#292319!important;
  --px-text-primary:#292319;
  --px-text-secondary:#514637;
  --px-text-muted:#6B5D4A;
}
main[style*="radial-gradient"] h1,
main[style*="radial-gradient"] h2,
main[style*="radial-gradient"] h3,
main[style*="radial-gradient"] h4,
main[style*="radial-gradient"] h5,
main[style*="radial-gradient"] h6,
main[style*="radial-gradient"] p,
main[style*="radial-gradient"] span,
main[style*="radial-gradient"] label,
main[style*="radial-gradient"] small,
main[style*="radial-gradient"] strong,
main[style*="radial-gradient"] b,
main[style*="radial-gradient"] em,
main[style*="radial-gradient"] li,
main[style*="radial-gradient"] a,
main[style*="radial-gradient"] button,
main[style*="radial-gradient"] summary,
main[style*="radial-gradient"] [role="button"],
main[style*="radial-gradient"] [aria-label],
main[style*="radial-gradient"] [class*="muted"],
main[style*="radial-gradient"] [class*="subtitle"],
main[style*="radial-gradient"] [class*="caption"] {
  color:#292319!important;
  -webkit-text-fill-color:#292319!important;
  text-shadow:none!important;
}
main[style*="radial-gradient"] input,
main[style*="radial-gradient"] textarea,
main[style*="radial-gradient"] select {
  color:#292319!important;
  -webkit-text-fill-color:#292319!important;
  background-color:#FFFFFF!important;
  caret-color:#8B642C!important;
  border-color:#C8B48D!important;
}
main[style*="radial-gradient"] input::placeholder,
main[style*="radial-gradient"] textarea::placeholder {
  color:#6B5D4A!important;
  -webkit-text-fill-color:#6B5D4A!important;
  opacity:1!important;
}
/* Keep icons legible without changing their actions. */
main[style*="radial-gradient"] svg { opacity:1; }
main[style*="radial-gradient"] .pxh-chip,
main[style*="radial-gradient"] .pxh-area,
main[style*="radial-gradient"] .pxh-seg button,
main[style*="radial-gradient"] .pxh-btn,
main[style*="radial-gradient"] .pxh-place,
main[style*="radial-gradient"] .pxh-card button.main {
  color:#292319!important;
  -webkit-text-fill-color:#292319!important;
}
main[style*="radial-gradient"] .pxh-chip.on,
main[style*="radial-gradient"] .pxh-area.on,
main[style*="radial-gradient"] .pxh-seg button.on,
main[style*="radial-gradient"] .pxh-btn.pri {
  background:linear-gradient(135deg,#B38A4A,#D8BD8C)!important;
  color:#20170C!important;
  -webkit-text-fill-color:#20170C!important;
}
/* Small metadata is muted brown, never pale cream on white. */
main[style*="radial-gradient"] .pxh-card small,
main[style*="radial-gradient"] .pxh-card p,
main[style*="radial-gradient"] .pxh-card span,
main[style*="radial-gradient"] .pxh-place small {
  color:#514637!important;
  -webkit-text-fill-color:#514637!important;
}


/* CREATIVE PREMIUM PASS — refined editorial layout, warm metallic accents, and tactile interactions. */
main[style*="radial-gradient"] > div{isolation:isolate}
main[style*="radial-gradient"] header{position:relative;z-index:2}
main[style*="radial-gradient"] header button{box-shadow:0 5px 16px rgba(67,47,20,.08);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
main[style*="radial-gradient"] header button:hover{transform:translateY(-2px);box-shadow:0 9px 22px rgba(67,47,20,.13)}
main[style*="radial-gradient"] section{animation:pxhRiseIn .42s ease both}
main[style*="radial-gradient"] section:nth-of-type(2){animation-delay:.04s}
main[style*="radial-gradient"] section:nth-of-type(3){animation-delay:.08s}
.pxh-card{border-radius:22px!important;background:linear-gradient(145deg,#FFFDF9 0%,#F8F0E3 100%)!important;border-color:#E2D1B4!important;box-shadow:0 7px 22px rgba(67,47,20,.075),inset 0 1px 0 rgba(255,255,255,.9)!important}
.pxh-card:hover{transform:translateY(-4px)!important;box-shadow:0 16px 32px rgba(67,47,20,.14)!important;border-color:#C8A66C!important}
.pxh-card>button.main{padding:15px!important}
.pxh-rail>button:not(.pxh-bubble){border-radius:19px!important;min-height:76px;box-shadow:0 7px 20px rgba(67,47,20,.075)!important;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease!important;position:relative;overflow:hidden}
.pxh-rail>button:not(.pxh-bubble)::before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:linear-gradient(180deg,#D8BD8C,#A77732);opacity:.9}
.pxh-rail>button:not(.pxh-bubble):hover{transform:translateY(-3px);box-shadow:0 13px 26px rgba(67,47,20,.13)!important;border-color:#B38A4A!important}
.pxh-ring{box-shadow:0 4px 12px rgba(139,100,44,.15)}
.pxh-bubble:hover .pxh-ring{transform:scale(1.04);transition:transform .2s ease}
.pxh-bubble>span:last-child{color:#403323!important}
.pxh-chip,.pxh-area,.pxh-seg{backdrop-filter:blur(8px)}
.pxh-chip:hover,.pxh-area:hover{transform:translateY(-1px);border-color:#B38A4A!important}
.pxh-btn:hover{transform:translateY(-1px);box-shadow:0 7px 18px rgba(67,47,20,.12)}
.pxh-place:hover{transform:translateY(-1px);border-color:#B38A4A!important;box-shadow:0 6px 18px rgba(67,47,20,.08)}
.pxh-heart{box-shadow:0 3px 10px rgba(40,28,10,.08)}
@keyframes pxhRiseIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:480px){
  .pxh-grid{gap:10px}
  .pxh-card{border-radius:18px!important}
  .pxh-card>button.main{padding:12px!important}
  .pxh-rail>button:not(.pxh-bubble){min-width:205px!important}
}
@media(prefers-reduced-motion:reduce){
  main[style*="radial-gradient"] section{animation:none!important}
  .pxh-card,.pxh-rail>button,.pxh-bubble .pxh-ring,.pxh-chip,.pxh-area,.pxh-btn,.pxh-place{transition:none!important}
}

`;

const Avatar = ({ t, size = 50, radius = 15 }) => {
  // Every café gets the coffee mark (consistent, instantly recognisable); other places show their logo.
  if (isCafe(t)) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(145deg,#FAF6ED,#F2E8D6)', boxShadow: 'inset 0 0 0 1px rgba(138,112,77,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Coffee size={size * 0.46} color="#8B642C" strokeWidth={1.8} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: '#FAF6ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      {t.branding?.logoUrl
        ? <img src={t.branding.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <UtensilsCrossed size={size * 0.42} color="#8B642C" />}
    </div>
  );
};

/* Map + navigate card for one outlet (used in the Map view and in the quick sheet). */
function PlaceDetail({ t, pos, onOrder }) {
  const [note, setNote] = useState('');
  const km = distanceKm(pos, t);
  const flash = (m) => { setNote(m); window.setTimeout(() => setNote(''), 2200); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${t.name}${addressLine(t) ? ', ' + addressLine(t) : ''}`); flash('Address copied'); }
    catch { flash('Copy not available'); }
  };
  const share = async () => {
    const data = { title: t.name, text: `${t.name}${addressLine(t) ? ' — ' + addressLine(t) : ''}`, url: openMapUrl(t) };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(`${data.text}\n${data.url}`); flash('Link copied'); }
    } catch { /* cancelled */ }
  };
  const placeable = hasPlace(t);
  const mapSrc = placeable ? embedUrl(t) : cityEmbedUrl;
  return (
    <div className="pxh-detail" style={{ border: '1px solid rgba(167,119,50,.26)', borderRadius: 22, overflow: 'hidden', background: 'linear-gradient(160deg,#FFFFFF,#F8F3E9)' }}>
      <div style={{ position: 'relative', height: 'clamp(210px,38vw,300px)', background: 'linear-gradient(145deg,#1b1b1b,#121212)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#514637', background: 'rgba(250,246,237,.94)', border: '1px solid #DCCDB4', borderRadius: 12, padding: '8px 12px', fontSize: 11, fontWeight: 800, pointerEvents: 'none' }}>
          <MapPin size={22} />{placeable ? 'Loading map…' : 'Showing Kolhapur area map'}
        </div>
        <iframe key={`${t.tenantId}-${placeable ? 'place' : 'city'}`} title={placeable ? `Map of ${t.name}` : 'Restaurants and cafes in Kolhapur'} src={mapSrc} loading="eager" referrerPolicy="no-referrer-when-downgrade" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, filter: 'saturate(.9) contrast(1.02)' }} />
        {km != null && <span style={{ position: 'absolute', left: 12, top: 12, padding: '5px 10px', borderRadius: 10, background: 'rgba(12,12,12,.82)', border: '1px solid rgba(211,191,162,.3)', color: GOLD, fontSize: 11, fontWeight: 900, backdropFilter: 'blur(6px)' }}>{fmtKm(km)} away</span>}
      </div>
      <div style={{ padding: '16px 16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar t={t} size={46} radius={14} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#292319', fontFamily: 'Georgia, serif' }}>{t.name}</div>
            {areaOf(t) && <div style={{ fontSize: 11, color: '#514637', fontWeight: 700, marginTop: 2 }}>{areaOf(t)}</div>}
          </div>
        </div>
        {(addressLine(t) || t.address?.landmark) && (
          <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.55, color: '#514637' }}>
            {addressLine(t)}
            {t.address?.landmark && <div style={{ marginTop: 3, color: '#6B5D4A' }}>Near {t.address.landmark}</div>}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 14 }}>
          {placeable && <a className="pxh-btn pri" href={directionsUrl(t)} target="_blank" rel="noopener noreferrer" style={{ flex: '1 1 140px' }}><Navigation size={14} /> Directions</a>}
          {onOrder && <button type="button" className="pxh-btn" onClick={() => onOrder(t)} style={{ flex: '1 1 110px' }}>Open menu <ChevronRight size={14} /></button>}
        </div>
        {placeable && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
            <a className="pxh-btn" href={openMapUrl(t)} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', fontSize: 11 }}><ExternalLink size={12} /> Google Maps</a>
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
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [service, setService] = useState(null);
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [notification, setNotification] = useState(null);
  const [favs, setFavs] = useState(() => readList(FAV_KEY));
  const [recent, setRecent] = useState(() => readList(RECENT_KEY));
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [allOffers, setAllOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [area, setArea] = useState(() => { try { return localStorage.getItem(AREA_KEY) || 'all'; } catch { return 'all'; } });
  const [view, setView] = useState('list');
  const [pos, setPos] = useState(null);
  const [nearMe, setNearMe] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');
  const [mapId, setMapId] = useState(null);
  const [sheetTenant, setSheetTenant] = useState(null);

  const canLocate = typeof navigator !== 'undefined' && !!navigator.geolocation;
  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

  const load = useCallback((signal) => {
    setLoading(true);
    setLoadError('');
    return axios.get(`${BASE_URL}/tenants/active`, { timeout: 10000, headers: { 'Cache-Control': 'no-cache' }, signal })
      .then((res) => setTenants(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setTenants([]);
        setLoadError(err?.response?.data?.error || 'Unable to load restaurants.');
      })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const loadAllOffers = async () => {
    if (offersLoading) return;
    setShowAllOffers(true);
    setOffersLoading(true);
    setOffersError('');
    try {
      const res = await axios.get(`${BASE_URL}/offers/current/all?limit=500`, { timeout: 10000 });
      setAllOffers(Array.isArray(res.data?.offers) ? res.data.offers : []);
    } catch (err) {
      setAllOffers([]);
      setOffersError(err?.response?.data?.error || 'Unable to load offers.');
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tenantId = params.get('tenantId');
    if (params.get('notification') === '1' && tenantId) {
      const tenant = tenants.find((t) => t.tenantId === tenantId);
      setNotification(tenant ? `Update from ${tenant.name}` : 'You have a restaurant update');
    }
  }, [location.search, tenants]);

  const openTenant = (tenant) => {
    // Directory selection is not a QR/table scan, so no table number is attached.
    if (!tenant?.tenantId) return;
    const next = [tenant.tenantId, ...recent.filter((id) => id !== tenant.tenantId)].slice(0, 8);
    setRecent(next);
    writeList(RECENT_KEY, next);
    navigate(`/${encodeURIComponent(tenant.tenantId)}?entry=home`);
  };

  const toggleFav = (id) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
    setFavs(next);
    writeList(FAV_KEY, next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tenants.filter((t) => {
      const cafe = isCafe(t);
      if (filter === 'cafe' && !cafe) return false;
      if (filter === 'restaurant' && cafe) return false;
      if (service && (t.config?.customerFeatures || {})[service] === false) return false;
      if (favOnly && !favs.includes(t.tenantId)) return false;
      if (area !== 'all' && areaOf(t).toLowerCase() !== area) return false;
      return !q || `${t.name} ${t.address?.area || ''} ${t.address?.city || ''} ${t.address?.landmark || ''} ${t.address?.street || ''}`.toLowerCase().includes(q);
    });
    if (nearMe && pos) list.sort((a, b) => (distanceKm(pos, a) ?? 1e9) - (distanceKm(pos, b) ?? 1e9));
    return list;
  }, [tenants, filter, service, favOnly, favs, query, area, nearMe, pos]);

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
      if (q && !`${t.name} ${t.address?.area || ''} ${t.address?.city || ''}`.toLowerCase().includes(q)) continue;
      const k = a.toLowerCase(); const cur = counts.get(k) || { key: k, label: a, n: 0 };
      cur.n += 1; counts.set(k, cur);
    }
    const list = [...counts.values()].sort((x, y) => y.n - x.n || x.label.localeCompare(y.label));
    if (area !== 'all' && !counts.has(area)) list.unshift({ key: area, label: area.replace(/\b\w/g, (c) => c.toUpperCase()), n: 0 });
    return list;
  }, [tenants, filter, service, favOnly, favs, query, area]);

  const chooseArea = (key) => { setArea(key); try { localStorage.setItem(AREA_KEY, key); } catch { /* ignore */ } };

  const toggleNear = () => {
    if (nearMe) { setNearMe(false); setGeoMsg(''); return; }
    if (!navigator.geolocation) { setGeoMsg('Location is not available on this device'); return; }
    setGeoMsg('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setNearMe(true); setGeoMsg(''); },
      () => setGeoMsg('Allow location access to sort by distance'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    );
  };

  // Any filter change goes back to the first page.
  useEffect(() => { setLimit(PAGE); }, [filter, service, favOnly, query, area, nearMe]);

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

  const surprise = () => {
    if (!filtered.length) return;
    openTenant(filtered[Math.floor(Math.random() * filtered.length)]);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const visible = filtered.slice(0, limit);
  const resetFilters = () => { setFilter('all'); setService(null); setFavOnly(false); setQuery(''); chooseArea('all'); };
  const hasFilters = filter !== 'all' || service || favOnly || query || area !== 'all';

  return (
    <main style={{ minHeight: '100dvh', background: 'radial-gradient(900px 420px at 50% -10%, rgba(167,119,50,.10), transparent 60%), #FAF6ED', color: '#24231F', fontFamily: 'Poppins, sans-serif', textAlign: 'left', boxShadow: '0 0 0 100vmax #0e0e0e', clipPath: 'inset(0 -100vmax)' }}>
      <style>{css}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 28px' }}>

        {/* ── Top bar: install · logo · scan · offers ── */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PwaInstallButton kind="customer" compact />
          <div style={{ background: '#FAF6ED', borderRadius: 14, padding: '7px 11px', display: 'flex', alignItems: 'center', border: '1px solid #E4D5BC', boxShadow: '0 3px 12px rgba(80,55,20,.06)' }}>
            <img src={logo} alt="Pratyeksha" style={{ width: 'clamp(124px, 34vw, 148px)', height: 'auto', display: 'block' }} />
          </div>
          <div style={{ flex: 1 }} />
          {canScan && (
            <button type="button" onClick={() => setScanning(true)} aria-label="Scan table QR" style={iconBtn}><ScanLine size={18} color={GOLD} /></button>
          )}
          <button type="button" onClick={loadAllOffers} aria-label="All offers" style={{ ...iconBtn, position: 'relative' }}>
            <Tag size={17} color={GOLD} />
            {totalOffers > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 9, background: GOLD, color: '#101010', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalOffers > 99 ? '99+' : totalOffers}</span>}
          </button>
        </header>

        {notification && (
          <div style={{ marginTop: 14, padding: '11px 14px', border: '1px solid rgba(167,119,50,.26)', background: 'rgba(211,191,162,.06)', borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Bell size={15} color={GOLD} />
            <div style={{ fontSize: 12, color: '#403323', flex: 1 }}>{notification}</div>
            <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss" style={{ border: 0, background: 'transparent', color: GOLD, cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
          </div>
        )}

        {/* ── Greeting + search ── */}
        <section style={{ padding: '26px 0 14px' }}>
          <h1 style={{ margin: 0, color: '#292319', textAlign: 'left', fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 'clamp(32px,8vw,48px)', lineHeight: 1.05, letterSpacing: '-.01em' }}>
            {greeting}<span style={{ color: GOLD }}>.</span>
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} color="rgba(167,119,50,.55)" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search restaurants" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 40px 13px 42px', borderRadius: 16, border: '1px solid rgba(167,119,50,.24)', background: '#FFFFFF', color: '#292319', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', color: 'rgba(255,255,255,.4)', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={15} /></button>}
            </div>
            <button type="button" onClick={surprise} disabled={!filtered.length} aria-label="Surprise me" title="Surprise me" style={{ ...iconBtn, width: 48, height: 48, borderRadius: 16, opacity: filtered.length ? 1 : .4 }}><Shuffle size={18} color={GOLD} /></button>
          </div>
        </section>

        {/* ── Filter chips (single scrollable row) ── */}
        <div className="pxh-chips" role="toolbar" aria-label="Filters">
          <button type="button" className={`pxh-chip${filter === 'all' && !service && !favOnly ? ' on' : ''}`} onClick={resetFilters}><LayoutGrid size={13} /> All</button>
          <button type="button" className={`pxh-chip${filter === 'cafe' ? ' on' : ''}`} onClick={() => setFilter(filter === 'cafe' ? 'all' : 'cafe')}><Coffee size={13} /> Café</button>
          <button type="button" className={`pxh-chip${filter === 'restaurant' ? ' on' : ''}`} onClick={() => setFilter(filter === 'restaurant' ? 'all' : 'restaurant')}><UtensilsCrossed size={13} /> Dine</button>
          {SERVICES.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} className={`pxh-chip${service === id ? ' on' : ''}`} onClick={() => setService(service === id ? null : id)}><Icon size={13} /> {label}</button>
          ))}
          <button type="button" className={`pxh-chip${favOnly ? ' on' : ''}`} onClick={() => setFavOnly(!favOnly)}><Heart size={13} fill={favOnly ? 'currentColor' : 'none'} /> Saved</button>
        </div>

        {/* ── Area filter + Near me ── */}
        {(areaChips.length > 0 || canLocate) && (
          <div style={{ marginTop: 10 }}>
            <div className="pxh-areas" role="toolbar" aria-label="Areas">
              {canLocate && (
                <button type="button" className={`pxh-area${nearMe ? ' on' : ''}`} onClick={toggleNear} aria-pressed={nearMe}><Crosshair size={12} /> Near me</button>
              )}
              {areaChips.length > 0 && <button type="button" className={`pxh-area${area === 'all' ? ' on' : ''}`} onClick={() => chooseArea('all')}><MapPin size={12} /> All areas</button>}
              {areaChips.map((a) => (
                <button type="button" key={a.key} className={`pxh-area${area === a.key ? ' on' : ''}`} onClick={() => chooseArea(area === a.key ? 'all' : a.key)}>{a.label} <b>{a.n}</b></button>
              ))}
            </div>
            {geoMsg && <div role="status" style={{ marginTop: 6, fontSize: 11, color: 'rgba(211,191,162,.75)' }}>{geoMsg}</div>}
          </div>
        )}

        {/* ── Offers rail ── */}
        {offerCards.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <div className="pxh-rail">
              {offerCards.map((offer) => (
                <button type="button" key={`${offer._tenant.tenantId}-${offer._id}`} onClick={() => openTenant(offer._tenant)} style={{ flex: '0 0 auto', minWidth: 214, maxWidth: 250, textAlign: 'left', border: '1px solid #D8C5A7', borderRadius: 16, background: 'linear-gradient(135deg,#FFFDF8 0%,#F5EBDD 100%)', color: '#292319', boxShadow: '0 5px 18px rgba(69,48,20,.07)', padding: '12px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}>
                  <Avatar t={offer._tenant} size={38} radius={11} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#76501C', letterSpacing: .3 }}>{offerValue(offer)}</div>
                    <div style={{ marginTop: 2, fontSize: 11, color: '#514637', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer._tenant.name}</div>
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
                <button type="button" key={t.tenantId} className="pxh-bubble" onClick={() => openTenant(t)}>
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
              <div style={{ fontSize: 12, color: '#292319', fontWeight: 800, letterSpacing: .3, background: '#F2E8D6', border: '1px solid #D9C5A4', borderRadius: 999, padding: '7px 10px' }}>
                {filtered.length} {filtered.length === 1 ? 'place' : 'places'}{area !== 'all' && areaChips.find((a) => a.key === area) ? ` in ${areaChips.find((a) => a.key === area).label}` : ''}{nearMe ? ' · nearest first' : ''}
              </div>
              <div className="pxh-seg" role="tablist" aria-label="View">
                <button type="button" role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><ListIcon size={13} /> List</button>
                <button type="button" role="tab" aria-selected={view === 'map'} className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}><MapIcon size={13} /> Map</button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="pxh-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="pxh-skel" />)}</div>
          ) : loadError ? (
            <div style={{ border: '1px solid rgba(167,119,50,.20)', borderRadius: 20, padding: '38px 20px', textAlign: 'center', background: 'rgba(255,255,255,.02)' }}>
              <Wifi size={22} color={GOLD} />
              <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{loadError}</div>
              <button type="button" onClick={() => load()} style={{ marginTop: 14, border: '1px solid rgba(211,191,162,.28)', background: 'rgba(211,191,162,.08)', color: GOLD, borderRadius: 12, padding: '9px 16px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}><RotateCcw size={13} /> Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ border: '1px solid #E0D3BD', borderRadius: 20, padding: 14, textAlign: 'center', background: '#FFFFFF' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#292319', margin: '4px 0 10px' }}>Explore places in Kolhapur</div>
              <div style={{ borderRadius: 16, overflow: 'hidden', height: 'clamp(250px,55vw,390px)', border: '1px solid #DCCDB4', position: 'relative' }}>
                <iframe title="Restaurants and cafes in Kolhapur" src={cityEmbedUrl} loading="eager" referrerPolicy="no-referrer-when-downgrade" allowFullScreen style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
              </div>
              <div style={{ color: '#514637', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>No active PRATYEKSHa-listed places match these filters. The map below shows restaurants and cafés around Kolhapur.</div>
              <a className="pxh-btn pri" href={cityPlacesUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12, width: '100%', boxSizing: 'border-box' }}><ExternalLink size={14} /> Explore places on Google Maps</a>
              {hasFilters && <button type="button" onClick={resetFilters} style={{ marginTop: 12, border: '1px solid #D7C5A7', background: '#F2E8D6', color: '#292319', borderRadius: 12, padding: '9px 16px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Clear filters</button>}
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
                          <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, color: '#514637', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{areaOf(t) || 'Location not added'}</span>
                        </span>
                        {km != null && <span style={{ fontSize: 10.5, fontWeight: 900, color: GOLD }}>{fmtKm(km)}</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ order: 1 }}><PlaceDetail t={mapTenant} pos={pos} onOrder={openTenant} /></div>
              </div>
            ) : (
            <>
              <div className="pxh-grid">
                {visible.map((tenant, i) => {
                  const features = tenant.config?.customerFeatures || {};
                  const isFav = favs.includes(tenant.tenantId);
                  const offers = Array.isArray(tenant.activeOffers) ? tenant.activeOffers.length : 0;
                  return (
                    <motion.div key={tenant.tenantId} className="pxh-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.25 }} whileTap={{ scale: 0.985 }}>
                      <button type="button" className="main" onClick={() => openTenant(tenant)} aria-label={`Open ${tenant.name}`}>
                        <Avatar t={tenant} size={52} radius={16} />
                        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenant.name}</div>
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'rgba(255,255,255,.38)', minHeight: 14 }}>
                          {areaOf(tenant) && <><MapPin size={10} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{areaOf(tenant)}{distanceKm(pos, tenant) != null ? ` · ${fmtKm(distanceKm(pos, tenant))}` : ''}</span></>}
                        </div>
                        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 9, minHeight: 24, paddingRight: hasPlace(tenant) ? 36 : 0 }}>
                          {SERVICES.map(({ id, label, icon: Icon }) => features[id] !== false && <span key={id} title={label} style={{ display: 'flex', color: 'rgba(211,191,162,.65)' }}><Icon size={13} /></span>)}
                          <span style={{ flex: 1 }} />
                          {offers > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, background: 'rgba(167,119,50,.20)', border: '1px solid rgba(211,191,162,.22)', color: GOLD, fontSize: 9.5, fontWeight: 900 }}><Tag size={10} /> {offers}</span>}
                        </div>
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
              {filtered.length > limit && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" onClick={() => setLimit((n) => n + PAGE)} style={{ border: '1px solid rgba(211,191,162,.24)', background: 'rgba(167,119,50,.10)', color: GOLD, borderRadius: 22, padding: '10px 22px', fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    +{Math.min(PAGE, filtered.length - limit)} more
                  </button>
                </div>
              )}
            </>
            )
          )}
        </section>
      </div>

      {/* ── Map & directions sheet ── */}
      <AnimatePresence>
        {sheetTenant && (
          <motion.div role="dialog" aria-modal="true" aria-label={`Map of ${sheetTenant.name}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheetTenant(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,5,.82)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,100%)', maxHeight: '92dvh', overflowY: 'auto', borderRadius: '24px 24px 0 0', position: 'relative' }}>
              <button type="button" onClick={() => setSheetTenant(null)} aria-label="Close" style={{ ...iconBtn, position: 'absolute', top: 12, right: 12, zIndex: 3, width: 34, height: 34, background: 'rgba(12,12,12,.8)' }}><X size={16} color={GOLD} /></button>
              <PlaceDetail t={sheetTenant} pos={pos} onOrder={(t) => { setSheetTenant(null); openTenant(t); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All offers ── */}
      <AnimatePresence>
        {showAllOffers && (
          <motion.div role="dialog" aria-modal="true" aria-label="All offers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAllOffers(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,5,.82)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ width: 'min(900px,100%)', maxHeight: '86dvh', overflow: 'hidden', border: '1px solid rgba(167,119,50,.26)', borderBottom: 0, borderRadius: '24px 24px 0 0', background: 'linear-gradient(160deg,#FFFCF6,#F2E8D6)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(167,119,50,.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#76501C', fontSize: 11, letterSpacing: 2.2, fontWeight: 900 }}><Tag size={14} /> OFFERS</div>
                <button type="button" onClick={() => setShowAllOffers(false)} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 11, border: '1px solid rgba(167,119,50,.24)', background: 'rgba(255,255,255,.03)', color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>
              <div style={{ overflowY: 'auto', padding: 14, WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}>
                {offersLoading ? (
                  <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#514637', fontSize: 12 }}>Loading…</div>
                ) : offersError ? (
                  <div style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A3025', fontSize: 12, textAlign: 'center' }}>{offersError}</div>
                ) : allOffers.length === 0 ? (
                  <div style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#514637', fontSize: 12 }}>No offers right now</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>
                    {allOffers.map((offer) => {
                      const tenant = offer.tenant || {};
                      const value = offer.type === 'happy_hour' ? `${offer.happyStart || '?'}–${offer.happyEnd || '?'}` : offerValue(offer);
                      return (
                        <button type="button" key={`${tenant.tenantId}-${offer._id}`} onClick={() => { setShowAllOffers(false); openTenant(tenant); }} style={{ textAlign: 'left', border: '1px solid #D8C5A7', borderRadius: 16, background: 'linear-gradient(145deg,#FFFDF8,#F3E7D3)', color: '#292319', boxShadow: '0 5px 18px rgba(69,48,20,.06)', padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, fontFamily: 'inherit' }}>
                          <Avatar t={tenant} size={40} radius={12} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#76501C' }}>{value}</div>
                            <div style={{ fontSize: 11, marginTop: 3, color: '#514637', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.title} · {tenant.name || 'Restaurant'}</div>
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
    </main>
  );
}

const iconBtn = { width: 40, height: 40, borderRadius: 13, border: '1px solid rgba(167,119,50,.26)', background: 'rgba(255,255,255,.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

/* ── In-app table QR scanner (BarcodeDetector). Only same-origin links are followed. ── */
function QrScanner({ onClose, onPath }) {
  const videoRef = useRef(null);
  const [message, setMessage] = useState('');
  const onPathRef = useRef(onPath);
  onPathRef.current = onPath;

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
        if (!video) return;
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
    <div role="dialog" aria-modal="true" aria-label="Scan table QR" style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#050505', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 12px', color: GOLD, fontSize: 11, letterSpacing: 2.2, fontWeight: 900 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ScanLine size={15} /> SCAN TABLE QR</span>
        <button type="button" onClick={onClose} aria-label="Close scanner" style={{ ...iconBtn, width: 36, height: 36 }}><X size={16} color={GOLD} /></button>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 'min(64vw,260px)', aspectRatio: '1', borderRadius: 26, border: `2px solid ${GOLD}`, boxShadow: '0 0 0 100vmax rgba(5,5,5,.55)' }} />
        </div>
        {message && <div style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))', textAlign: 'center', padding: '11px 14px', borderRadius: 14, background: 'rgba(15,15,15,.88)', border: '1px solid rgba(167,119,50,.30)', color: '#FAF6ED', fontSize: 12 }}>{message}</div>}
      </div>
    </div>
  );
}
