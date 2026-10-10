import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Coffee, UtensilsCrossed, Search, Bell, ChevronRight, MapPin, Wifi, Sparkles, X, Tag,
  Heart, ScanLine, Shuffle, ShoppingBag, CalendarCheck, Clock, LayoutGrid, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import PwaInstallButton from './PwaInstallButton.jsx';

import API_BASE_URL from './apiBase.js';

const BASE_URL = API_BASE_URL;
const logo = '/pratyeksha-logo.png';
const GOLD = '#d3bfa2';
const PAGE = 8;
const FAV_KEY = 'px_home_favs';
const RECENT_KEY = 'px_home_recent';

/* localStorage can throw (private mode / blocked) — the page must work without it. */
const readList = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
};
const writeList = (key, list) => { try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignore */ } };

const typeOf = (t) => String(t?.businessType || 'Restaurant').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const offerValue = (o) => (o.type === 'percent_off' ? `${o.value}% OFF` : o.type === 'fixed_off' ? `₹${o.value} OFF` : o.type === 'free_item' ? `FREE ${o.freeItem || 'ITEM'}` : 'HAPPY HOUR');

const SERVICES = [
  { id: 'pickup', label: 'Pickup', icon: ShoppingBag },
  { id: 'reservation', label: 'Reserve', icon: CalendarCheck },
  { id: 'waitlist', label: 'Waitlist', icon: Clock },
];

const css = `
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
@keyframes pxhShimmer{0%{background-position:-300px 0}100%{background-position:300px 0}}
.pxh-skel{border-radius:20px;height:132px;border:1px solid rgba(211,191,162,.08);background:linear-gradient(90deg,#141414 0%,#1c1c1c 50%,#141414 100%);background-size:600px 100%;animation:pxhShimmer 1.3s linear infinite}
@media(prefers-reduced-motion:reduce){.pxh-skel{animation:none}.pxh-card{transition:none}}
`;

const Avatar = ({ t, size = 50, radius = 15 }) => {
  const type = typeOf(t);
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: '#f7f3eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      {t.branding?.logoUrl
        ? <img src={t.branding.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : type === 'cafe' ? <Coffee size={size * 0.42} color="#8a704d" /> : <UtensilsCrossed size={size * 0.42} color="#8a704d" />}
    </div>
  );
};

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
    return tenants.filter((t) => {
      const type = typeOf(t);
      if (filter === 'cafe' && type !== 'cafe') return false;
      if (filter === 'restaurant' && type === 'cafe') return false;
      if (service && (t.config?.customerFeatures || {})[service] === false) return false;
      if (favOnly && !favs.includes(t.tenantId)) return false;
      return !q || `${t.name} ${t.address?.city || ''}`.toLowerCase().includes(q);
    });
  }, [tenants, filter, service, favOnly, favs, query]);

  // Any filter change goes back to the first page.
  useEffect(() => { setLimit(PAGE); }, [filter, service, favOnly, query]);

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
  const resetFilters = () => { setFilter('all'); setService(null); setFavOnly(false); setQuery(''); };
  const hasFilters = filter !== 'all' || service || favOnly || query;

  return (
    <main style={{ minHeight: '100dvh', background: 'radial-gradient(900px 420px at 50% -10%, rgba(211,191,162,.10), transparent 60%), #0e0e0e', color: '#fff', fontFamily: 'Poppins, sans-serif', textAlign: 'left', boxShadow: '0 0 0 100vmax #0e0e0e', clipPath: 'inset(0 -100vmax)' }}>
      <style>{css}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 28px' }}>

        {/* ── Top bar: install · logo · scan · offers ── */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PwaInstallButton kind="customer" compact />
          <div style={{ background: '#f7f3eb', borderRadius: 12, padding: '5px 9px', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Pratyeksha" style={{ width: 104, height: 'auto', display: 'block' }} />
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
          <div style={{ marginTop: 14, padding: '11px 14px', border: '1px solid rgba(211,191,162,.18)', background: 'rgba(211,191,162,.06)', borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Bell size={15} color={GOLD} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.78)', flex: 1 }}>{notification}</div>
            <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss" style={{ border: 0, background: 'transparent', color: GOLD, cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
          </div>
        )}

        {/* ── Greeting + search ── */}
        <section style={{ padding: '26px 0 14px' }}>
          <h1 style={{ margin: 0, color: '#f7f3eb', textAlign: 'left', fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 'clamp(30px,7vw,46px)', lineHeight: 1.05, letterSpacing: '-.01em' }}>
            {greeting}<span style={{ color: GOLD }}>.</span>
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} color="rgba(211,191,162,.55)" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search restaurants" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 40px 13px 42px', borderRadius: 16, border: '1px solid rgba(211,191,162,.16)', background: 'rgba(255,255,255,.04)', color: '#fff', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
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

        {/* ── Offers rail ── */}
        {offerCards.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <div className="pxh-rail">
              {offerCards.map((offer) => (
                <button type="button" key={`${offer._tenant.tenantId}-${offer._id}`} onClick={() => openTenant(offer._tenant)} style={{ flex: '0 0 auto', minWidth: 214, maxWidth: 250, textAlign: 'left', border: '1px solid rgba(211,191,162,.2)', borderRadius: 16, background: 'linear-gradient(135deg,rgba(211,191,162,.16),rgba(211,191,162,.04) 60%,#121212)', color: '#fff', padding: '12px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}>
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
          {loading ? (
            <div className="pxh-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="pxh-skel" />)}</div>
          ) : loadError ? (
            <div style={{ border: '1px solid rgba(211,191,162,.12)', borderRadius: 20, padding: '38px 20px', textAlign: 'center', background: 'rgba(255,255,255,.02)' }}>
              <Wifi size={22} color={GOLD} />
              <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{loadError}</div>
              <button type="button" onClick={() => load()} style={{ marginTop: 14, border: '1px solid rgba(211,191,162,.28)', background: 'rgba(211,191,162,.08)', color: GOLD, borderRadius: 12, padding: '9px 16px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}><RotateCcw size={13} /> Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ border: '1px solid rgba(211,191,162,.1)', borderRadius: 20, padding: '38px 20px', textAlign: 'center', background: 'rgba(255,255,255,.02)' }}>
              <Sparkles size={22} color={GOLD} />
              <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.55)' }}>{favOnly && !favs.length ? 'Tap the heart on a place to save it' : 'Nothing found'}</div>
              {hasFilters && <button type="button" onClick={resetFilters} style={{ marginTop: 14, border: '1px solid rgba(211,191,162,.28)', background: 'rgba(211,191,162,.08)', color: GOLD, borderRadius: 12, padding: '9px 16px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Clear filters</button>}
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
                          {tenant.address?.city && <><MapPin size={10} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenant.address.city}</span></>}
                        </div>
                        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 9, minHeight: 24 }}>
                          {SERVICES.map(({ id, label, icon: Icon }) => features[id] !== false && <span key={id} title={label} style={{ display: 'flex', color: 'rgba(211,191,162,.65)' }}><Icon size={13} /></span>)}
                          <span style={{ flex: 1 }} />
                          {offers > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, background: 'rgba(211,191,162,.12)', border: '1px solid rgba(211,191,162,.22)', color: GOLD, fontSize: 9.5, fontWeight: 900 }}><Tag size={10} /> {offers}</span>}
                        </div>
                      </button>
                      <button type="button" className={`pxh-heart${isFav ? ' on' : ''}`} onClick={() => toggleFav(tenant.tenantId)} aria-label={isFav ? 'Remove from saved' : 'Save'} aria-pressed={isFav}>
                        <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
              {filtered.length > limit && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" onClick={() => setLimit((n) => n + PAGE)} style={{ border: '1px solid rgba(211,191,162,.24)', background: 'rgba(211,191,162,.07)', color: GOLD, borderRadius: 22, padding: '10px 22px', fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    +{Math.min(PAGE, filtered.length - limit)} more
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* ── All offers ── */}
      <AnimatePresence>
        {showAllOffers && (
          <motion.div role="dialog" aria-modal="true" aria-label="All offers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAllOffers(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,5,.82)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ width: 'min(900px,100%)', maxHeight: '86dvh', overflow: 'hidden', border: '1px solid rgba(211,191,162,.18)', borderBottom: 0, borderRadius: '24px 24px 0 0', background: 'linear-gradient(160deg,#181818,#0d0d0d)', display: 'flex', flexDirection: 'column' }}>
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
                    {allOffers.map((offer) => {
                      const tenant = offer.tenant || {};
                      const value = offer.type === 'happy_hour' ? `${offer.happyStart || '?'}–${offer.happyEnd || '?'}` : offerValue(offer);
                      return (
                        <button type="button" key={`${tenant.tenantId}-${offer._id}`} onClick={() => { setShowAllOffers(false); openTenant(tenant); }} style={{ textAlign: 'left', border: '1px solid rgba(211,191,162,.14)', borderRadius: 16, background: 'linear-gradient(145deg,#191919,#101010)', color: '#fff', padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, fontFamily: 'inherit' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', background: '#f7f3eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {tenant.branding?.logoUrl ? <img src={tenant.branding.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <img src={logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>{value}</div>
                            <div style={{ fontSize: 11, marginTop: 3, color: 'rgba(255,255,255,.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.title} · {tenant.name || 'Restaurant'}</div>
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

const iconBtn = { width: 40, height: 40, borderRadius: 13, border: '1px solid rgba(211,191,162,.18)', background: 'rgba(255,255,255,.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 };

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
        {message && <div style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))', textAlign: 'center', padding: '11px 14px', borderRadius: 14, background: 'rgba(15,15,15,.88)', border: '1px solid rgba(211,191,162,.25)', color: '#fff', fontSize: 12 }}>{message}</div>}
      </div>
    </div>
  );
}
