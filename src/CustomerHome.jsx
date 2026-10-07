import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Coffee, UtensilsCrossed, Search, Bell, ChevronRight, MapPin, Wifi, Sparkles, ArrowUpRight, X, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import PwaInstallButton from './PwaInstallButton.jsx';

import API_BASE_URL from './apiBase.js';

const BASE_URL = API_BASE_URL;
const logo = '/pratyeksha-logo.png';

export default function CustomerHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [allOffers, setAllOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError('');
    axios.get(`${BASE_URL}/tenants/active`, { timeout: 10000, headers: { 'Cache-Control': 'no-cache' } })
      .then(res => {
        if (!alive) return;
        setTenants(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        if (!alive) return;
        setTenants([]);
        setLoadError(err?.response?.data?.error || 'Unable to load active restaurants. Check the server connection and try again.');
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

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
      setOffersError(err?.response?.data?.error || 'Unable to load current offers.');
    } finally {
      setOffersLoading(false);
    }
  };

  const retryLoad = () => {
    setLoading(true);
    setLoadError('');
    axios.get(`${BASE_URL}/tenants/active`, { timeout: 10000, headers: { 'Cache-Control': 'no-cache' } })
      .then(res => setTenants(Array.isArray(res.data) ? res.data : []))
      .catch(err => { setTenants([]); setLoadError(err?.response?.data?.error || 'Unable to load active restaurants.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tenantId = params.get('tenantId');
    if (params.get('notification') === '1' && tenantId) {
      const tenant = tenants.find(t => t.tenantId === tenantId);
      setNotification(tenant ? `You have an update from ${tenant.name}.` : 'You have a restaurant update waiting.');
    }
  }, [location.search, tenants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter(t => {
      const type = String(t.businessType || 'Restaurant').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const typeOk = filter === 'all' || (filter === 'cafe' ? type === 'cafe' : type === 'restaurant');
      const textOk = !q || `${t.name} ${t.address?.city || ''}`.toLowerCase().includes(q);
      return typeOk && textOk;
    });
  }, [tenants, filter, query]);

  const openTenant = tenant => {
    // No table number is intentionally attached here. This is a directory selection,
    // not a QR/table scan, so it cannot silently turn the installed PWA into a dine-in order session.
    if (!tenant?.tenantId) return;
    navigate(`/${encodeURIComponent(tenant.tenantId)}?entry=home`);
  };

  return (
    <main style={{ minHeight:'100vh', background:'#0e0e0e', color:'#fff', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'22px 20px 48px' }}>
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, paddingBottom:24, borderBottom:'1px solid rgba(211,191,162,.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
            <div style={{ background:'#f7f3eb', borderRadius:14, padding:'7px 10px', display:'flex', alignItems:'center' }}>
              <img src={logo} alt="Pratyeksha" style={{ width:150, height:'auto', display:'block' }} />
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:10, letterSpacing:2.2, color:'rgba(211,191,162,.45)', fontWeight:800 }}>RESTAURANT EXPERIENCE</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.55)', marginTop:4 }}>Discover a restaurant, then choose its available guest services.</div>
            </div>
          </div>
          <PwaInstallButton kind="customer" compact />
        </header>

        {notification && (
          <div style={{ marginTop:18, padding:'13px 15px', border:'1px solid rgba(211,191,162,.18)', background:'rgba(211,191,162,.06)', borderRadius:14, display:'flex', gap:10, alignItems:'center' }}>
            <Bell size={16} color="#d3bfa2" />
            <div style={{ fontSize:12, color:'rgba(255,255,255,.75)', flex:1 }}>{notification}</div>
            <button type="button" onClick={() => setNotification(null)} style={{ border:0, background:'transparent', color:'#d3bfa2', cursor:'pointer', fontSize:11, fontWeight:800 }}>DISMISS</button>
          </div>
        )}

        <section style={{ padding:'46px 0 28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:20, alignItems:'end', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:2.5, color:'#d3bfa2', fontWeight:900, marginBottom:9 }}>CHOOSE YOUR DESTINATION</div>
              <h1 style={{ margin:0, fontFamily:'Georgia, serif', fontWeight:500, fontSize:'clamp(30px,5vw,52px)', lineHeight:1.05 }}>Where would you like to dine?</h1>
              <p style={{ margin:'12px 0 0', color:'rgba(255,255,255,.42)', fontSize:13, lineHeight:1.7, maxWidth:620 }}>
                Scan a restaurant QR code to open its table menu and order. From the installed app, choose a restaurant below to view only the guest services that restaurant has enabled.
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:7, color:'rgba(255,255,255,.35)', fontSize:10, fontWeight:800, letterSpacing:1 }}><Wifi size={13} /> LIVE DIRECTORY</div>
          </div>
        </section>

        {filtered.some(t => Array.isArray(t.activeOffers) && t.activeOffers.length > 0) && (
          <section style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                <div style={{ width:30, height:30, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(211,191,162,.09)', border:'1px solid rgba(211,191,162,.16)', flexShrink:0 }}>
                  <Sparkles size={14} color="#d3bfa2" />
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:10, letterSpacing:2, color:'#d3bfa2', fontWeight:900 }}>CURRENT OFFERS</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>Live promotions from our active restaurants.</div>
                </div>
              </div>
              <button type="button" onClick={loadAllOffers} style={{ border:'1px solid rgba(211,191,162,.24)', background:'linear-gradient(135deg,rgba(211,191,162,.16),rgba(211,191,162,.05))', color:'#d3bfa2', borderRadius:20, padding:'8px 12px', cursor:'pointer', fontSize:9, fontWeight:900, letterSpacing:.8, display:'inline-flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
                SEE ALL OFFERS <ArrowUpRight size={12} />
              </button>
            </div>
            <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:7, scrollbarWidth:'thin', WebkitOverflowScrolling:'touch' }}>
              {filtered.flatMap(t => (t.activeOffers || []).map(offer => ({ ...offer, _tenant:t }))).slice(0,12).map(offer => (
                <button type="button" key={`${offer._tenant.tenantId}-${offer._id}`} onClick={() => openTenant(offer._tenant)} style={{ minWidth:250, maxWidth:290, textAlign:'left', border:'1px solid rgba(211,191,162,.14)', borderRadius:15, background:'linear-gradient(145deg,#171717,#111)', color:'#fff', padding:'14px', cursor:'pointer', display:'flex', alignItems:'center', gap:11, flexShrink:0 }}>
                  <div style={{ width:38, height:38, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'rgba(211,191,162,.08)', border:'1px solid rgba(211,191,162,.14)' }}>
                    <Tag size={15} color="#d3bfa2" />
                  </div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{offer.title}</div>
                    <div style={{ marginTop:4, fontSize:10, color:'rgba(255,255,255,.42)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {offer._tenant.name} · {offer.type==='percent_off' ? `${offer.value}% OFF` : offer.type==='fixed_off' ? `₹${offer.value} OFF` : offer.type==='free_item' ? `FREE ${offer.freeItem || 'ITEM'}` : 'HAPPY HOUR'}
                    </div>
                  </div>
                  <ChevronRight size={14} color="#d3bfa2" />
                </button>
              ))}
            </div>
          </section>
        )}

        {showAllOffers && (
          <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(5,5,5,.82)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:18 }}>
            <div style={{ width:'min(1100px,100%)', maxHeight:'88vh', overflow:'hidden', border:'1px solid rgba(211,191,162,.18)', borderRadius:24, background:'linear-gradient(145deg,#181818,#0d0d0d)', boxShadow:'0 30px 80px rgba(0,0,0,.45)', display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:15, padding:'20px 22px', borderBottom:'1px solid rgba(211,191,162,.1)' }}>
                <div>
                  <div style={{ fontSize:10, letterSpacing:2.4, color:'#d3bfa2', fontWeight:900 }}>ALL CURRENT OFFERS</div>
                  <div style={{ marginTop:5, color:'rgba(255,255,255,.45)', fontSize:12 }}>Discover live offers across our active cafés and restaurants.</div>
                </div>
                <button type="button" onClick={() => setShowAllOffers(false)} aria-label="Close offers" style={{ width:36, height:36, borderRadius:12, border:'1px solid rgba(211,191,162,.16)', background:'rgba(255,255,255,.03)', color:'#d3bfa2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
              </div>
              <div style={{ overflowY:'auto', padding:18, WebkitOverflowScrolling:'touch' }}>
                {offersLoading ? (
                  <div style={{ minHeight:220, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.38)', fontSize:12 }}>Loading current offers…</div>
                ) : offersError ? (
                  <div style={{ minHeight:180, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.48)', fontSize:12, textAlign:'center' }}>{offersError}</div>
                ) : allOffers.length === 0 ? (
                  <div style={{ minHeight:180, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.38)', fontSize:12 }}>No current offers are available right now.</div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))', gap:12 }}>
                    {allOffers.map(offer => {
                      const tenant = offer.tenant || {};
                      const value = offer.type==='percent_off' ? `${offer.value}% OFF` : offer.type==='fixed_off' ? `₹${offer.value} OFF` : offer.type==='free_item' ? `FREE ${offer.freeItem || 'ITEM'}` : `${offer.happyStart || '?'}–${offer.happyEnd || '?'}`;
                      return (
                        <button type="button" key={`${tenant.tenantId}-${offer._id}`} onClick={() => { setShowAllOffers(false); openTenant(tenant); }} style={{ textAlign:'left', border:'1px solid rgba(211,191,162,.14)', borderRadius:18, background:'linear-gradient(145deg,#191919,#101010)', color:'#fff', padding:16, cursor:'pointer', minHeight:140 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:38, height:38, borderRadius:12, overflow:'hidden', background:'#f7f3eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              {tenant.branding?.logoUrl ? <img src={tenant.branding.logoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <img src={logo} alt="" style={{ width:27, height:27, objectFit:'contain' }} />}
                            </div>
                            <div style={{ minWidth:0, flex:1 }}>
                              <div style={{ fontSize:10, color:'#d3bfa2', fontWeight:900, letterSpacing:.8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tenant.name || 'Restaurant'}</div>
                              <div style={{ fontSize:14, fontWeight:900, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{offer.title}</div>
                            </div>
                          </div>
                          <div style={{ marginTop:18, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                            <span style={{ padding:'6px 9px', borderRadius:8, background:'rgba(211,191,162,.09)', border:'1px solid rgba(211,191,162,.14)', color:'#d3bfa2', fontSize:10, fontWeight:900 }}>{value}</span>
                            <ChevronRight size={15} color="#d3bfa2" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {[
            ['all','All'], ['cafe','Café'], ['restaurant','Restaurant']
          ].map(([id,label]) => (
            <button type="button" key={id} onClick={() => setFilter(id)} style={{ border:'1px solid rgba(211,191,162,.16)', background:filter===id?'linear-gradient(135deg,#d3bfa2,#bda88a)':'rgba(255,255,255,.02)', color:filter===id?'#101010':'rgba(255,255,255,.55)', borderRadius:22, padding:'9px 16px', cursor:'pointer', fontWeight:900, fontSize:11 }}>
              {label}
            </button>
          ))}
          <div style={{ flex:1, minWidth:220, position:'relative' }}>
            <Search size={15} color="rgba(255,255,255,.25)" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search restaurants or cafés…" style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px 10px 38px', borderRadius:22, border:'1px solid rgba(211,191,162,.12)', background:'rgba(255,255,255,.025)', color:'#fff', outline:'none', fontSize:11 }} />
          </div>
        </div>

        {loading ? (
          <div style={{ minHeight:280, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.3)', fontSize:12 }}>Loading active restaurants…</div>
        ) : loadError ? (
          <div style={{ border:'1px solid rgba(211,191,162,.1)', borderRadius:20, padding:48, textAlign:'center', background:'rgba(255,255,255,.02)' }}>
            <Wifi size={22} color="#d3bfa2" />
            <div style={{ marginTop:12, fontSize:14, fontWeight:800 }}>Couldn’t load active restaurants</div>
            <div style={{ marginTop:6, fontSize:11, color:'rgba(255,255,255,.45)', lineHeight:1.6 }}>{loadError}</div>
            <button type="button" onClick={retryLoad} style={{ marginTop:16, border:'1px solid rgba(211,191,162,.25)', background:'rgba(211,191,162,.08)', color:'#d3bfa2', borderRadius:12, padding:'9px 14px', fontWeight:900, cursor:'pointer' }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ border:'1px solid rgba(211,191,162,.1)', borderRadius:20, padding:48, textAlign:'center', background:'rgba(255,255,255,.02)' }}>
            <Sparkles size={22} color="#d3bfa2" />
            <div style={{ marginTop:12, fontSize:14, fontWeight:800 }}>No active {filter === 'all' ? 'restaurants' : filter === 'cafe' ? 'cafés' : 'restaurants'} found</div>
            <div style={{ marginTop:6, fontSize:11, color:'rgba(255,255,255,.35)' }}>Try another filter or search term.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:14 }}>
            {filtered.map(tenant => {
              const type = String(tenant.businessType || 'Restaurant').toLowerCase();
              const features = tenant.config?.customerFeatures || {};
              const options = [features.waitlist !== false && 'Waitlist', features.reservation !== false && 'Reservation', features.pickup !== false && 'Pickup'].filter(Boolean);
              return (
                <motion.button key={tenant.tenantId} onClick={() => openTenant(tenant)} whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 360, damping: 24 }} style={{ textAlign:'left', padding:0, overflow:'hidden', border:'1px solid rgba(211,191,162,.12)', borderRadius:20, background:'#121212', color:'#fff', cursor:'pointer', transition:'transform .22s ease,border-color .22s ease,box-shadow .22s ease' }} onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor='rgba(211,191,162,.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='rgba(211,191,162,.12)'; }}>
                  <div style={{ padding:'18px 18px 14px', display:'flex', gap:13, alignItems:'center' }}>
                    <div style={{ width:50, height:50, borderRadius:15, background:'#f7f3eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                      {tenant.branding?.logoUrl ? <img src={tenant.branding.logoUrl} alt={tenant.name || 'Restaurant logo'} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : type === 'cafe' ? <Coffee size={21} color="#6b7f5f" /> : <UtensilsCrossed size={21} color="#6b7f5f" />}
                    </div>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:900, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tenant.name}</div>
                      <div style={{ marginTop:4, fontSize:9, fontWeight:900, letterSpacing:1.3, color:'#d3bfa2', textTransform:'uppercase' }}>{type === 'cafe' ? 'Café' : 'Restaurant'}</div>
                    </div>
                    <ChevronRight size={17} color="rgba(211,191,162,.35)" />
                  </div>
                  <div style={{ borderTop:'1px solid rgba(255,255,255,.05)', padding:'13px 18px 16px' }}>
                    {tenant.address?.city && <div style={{ display:'flex', alignItems:'center', gap:5, color:'rgba(255,255,255,.3)', fontSize:10, marginBottom:10 }}><MapPin size={11}/> {tenant.address.city}</div>}
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {options.map(option => <span key={option} style={{ border:'1px solid rgba(211,191,162,.12)', color:'rgba(211,191,162,.6)', borderRadius:14, padding:'5px 8px', fontSize:8, fontWeight:900, letterSpacing:.5 }}>{option}</span>)}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <footer style={{ marginTop:44, paddingTop:18, borderTop:'1px solid rgba(211,191,162,.08)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <img src={logo} alt="Pratyeksha" style={{ width:115, height:'auto', background:'#f7f3eb', borderRadius:8, padding:'4px 7px' }} />
          <div style={{ fontSize:10, color:'rgba(255,255,255,.25)' }}>QR scan = table ordering session · Directory = restaurant discovery</div>
        </footer>
      </div>
    </main>
  );
}
