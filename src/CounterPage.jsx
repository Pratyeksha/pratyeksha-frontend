import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import { BellRing, X, Clock, Users, ShoppingBag, UtensilsCrossed, CheckCircle2, Minus, Plus } from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

// ── urlBase64ToUint8Array helper for push subscription
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

const CounterPage = () => {
  const { tenantId } = useParams(); // ← multi-tenant via URL param

  const [restaurantData, setRestaurantData] = useState(null);
  const [avgWait, setAvgWait] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Screen flow: 'push-prompt' → 'mode' → 'register' → 'menu' → 'waiting'
  const [screen, setScreen] = useState('push-prompt');
  const [mode, setMode] = useState(null); // 'dine-in' | 'pickup'

  const [pushGranted, setPushGranted] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [pickupTime, setPickupTime] = useState('');

  const [entry, setEntry] = useState(null); // WaitlistEntry from backend
  const [notificationBanner, setNotificationBanner] = useState(null); // { type: 'table'|'pickup', tableNumber?, restaurantName }

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const socket = useMemo(() => io("https://pratyeksha-backend.onrender.com", {
    withCredentials: true, transports: ['polling', 'websocket']
  }), []);

  // ── Fetch restaurant info + avg wait on mount
  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      axios.get(`${BASE_URL}/tenant/${tenantId}`),
      axios.get(`${BASE_URL}/menu/${tenantId}`),
      axios.get(`${BASE_URL}/categories/${tenantId}`),
      axios.get(`${BASE_URL}/waitlist/avg-wait/${tenantId}`).catch(() => ({ data: null }))
    ]).then(([tRes, mRes, cRes, wRes]) => {
      setRestaurantData(tRes.data);
      setMenuItems(mRes.data || []);
      setCategories(cRes.data || []);
      setAvgWait(wRes.data);
    }).finally(() => setIsLoading(false));
  }, [tenantId]);

  // ── Socket: join session room + listen for events
  useEffect(() => {
    socket.emit('join_session', sessionId);

    socket.on('table_assigned', (data) => {
      setNotificationBanner({ type: 'table', tableNumber: data.tableNumber, restaurantName: data.restaurantName });
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    });

    socket.on('pickup_ready', (data) => {
      setNotificationBanner({ type: 'pickup', restaurantName: data.restaurantName });
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    });

    socket.on('position_updated', (data) => {
      setEntry(prev => prev ? { ...prev, waitlistPosition: data.position, estimatedWait: data.estimatedWait } : prev);
    });

    return () => { socket.off('table_assigned'); socket.off('pickup_ready'); socket.off('position_updated'); socket.disconnect(); };
  }, [sessionId, socket]);

  // ── Push subscription
  const subscribeToPush = async (entryId) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const keyRes = await axios.get(`${BASE_URL}/waitlist/vapid-public-key`);
      const vapidKey = keyRes.data?.publicKey;
      if (!vapidKey) return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      await axios.patch(`${BASE_URL}/waitlist/session/${tenantId}/${sessionId}/push-subscription`, {
        subscription: subscription.toJSON(),
        pageUrl: window.location.href
      });
    } catch (err) { console.error('Push subscription failed:', err); }
  };

  const handlePushPrompt = async (allow) => {
    if (allow) {
      setPushGranted(true);
      if ('Notification' in window) await Notification.requestPermission();
    }
    setScreen('mode');
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setScreen('register');
  };

  const handleRegister = () => {
    if (!customerName.trim()) return;
    setScreen('menu');
  };

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((acc, [key, qty]) => {
      const [id, portion] = key.split('|');
      const item = menuItems.find(i => i._id === id);
      const price = portion === 'Half' ? item?.priceHalf : (item?.priceFull || item?.price || 0);
      return acc + (price * qty);
    }, 0);
  }, [cart, menuItems]);

  const cartItems = useMemo(() => {
    return Object.entries(cart).filter(([, qty]) => qty > 0).map(([key, qty]) => {
      const [id, portion] = key.split('|');
      const item = menuItems.find(i => i._id === id);
      const price = portion === 'Half' ? item?.priceHalf : (item?.priceFull || item?.price || 0);
      return {
        menuItemId: id, name: item?.name, quantity: qty,
        portion: portion || 'Single', pricePerUnit: price, subtotal: price * qty
      };
    });
  }, [cart, menuItems]);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        sessionId, customerName, partySize, mode,
        items: cartItems, totalAmount: cartTotal,
        scheduledPickupTime: mode === 'pickup' && pickupTime
          ? new Date(`${new Date().toDateString()} ${pickupTime}`).toISOString()
          : null
      };
      const res = await axios.post(`${BASE_URL}/waitlist/${tenantId}`, payload);
      setEntry(res.data.entry);
      await subscribeToPush(res.data.entry._id);
      setScreen('waiting');
    } catch (err) {
      console.error('Place order error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const gold = '#d3bfa2';
  const dark = '#1a1a1a';

  if (isLoading) return (
    <div style={{ height: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: gold, fontFamily: 'sans-serif', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '3px' }}>
      PRATYEKSHA
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: dark, color: '#fff', fontFamily: "'Inter', sans-serif", overflowY: 'auto' }}>

      {/* ── FULL-SCREEN NOTIFICATION BANNER ── */}
      <AnimatePresence>
        {notificationBanner && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ position: 'fixed', inset: 0, background: notificationBanner.type === 'table' ? '#0a1f0a' : '#0a0f1f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>
              {notificationBanner.type === 'table' ? '🎉' : '✅'}
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: gold, marginBottom: '8px', lineHeight: 1.3 }}>
              {notificationBanner.type === 'table' ? 'आपले टेबल तयार आहे!' : 'तुमची ऑर्डर तयार आहे!'}
            </h1>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#888', marginBottom: '32px', lineHeight: 1.4 }}>
              {notificationBanner.type === 'table' ? 'Your table is ready!' : 'Your order is ready for pickup!'}
            </h2>
            <p style={{ fontSize: '1rem', color: gold, marginBottom: '6px', fontWeight: '700' }}>
              {notificationBanner.type === 'table' ? `टेबल नंबर ${notificationBanner.tableNumber} वर जा` : 'काउंटरवर येऊन ऑर्डर घ्या'}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '40px' }}>
              {notificationBanner.type === 'table' ? `Please proceed to Table ${notificationBanner.tableNumber}` : 'Please collect your order at the counter'}
            </p>
            <button onClick={() => setNotificationBanner(null)}
              style={{ padding: '16px 40px', background: `linear-gradient(135deg, ${gold}, #bda88a)`, color: '#000', border: 'none', borderRadius: '14px', fontSize: '1rem', fontWeight: '900', cursor: 'pointer' }}>
              {notificationBanner.type === 'table' ? "टेबलकडे जा · Go to Table →" : "येतो · I'm On My Way →"}
            </button>
            <p style={{ position: 'absolute', bottom: '24px', fontSize: '0.7rem', color: '#333', letterSpacing: '1px', fontWeight: '900' }}>
              {notificationBanner.restaurantName?.toUpperCase()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div style={{ padding: '40px 24px 20px', textAlign: 'center', borderBottom: '1px solid rgba(211,191,162,0.08)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: gold, margin: 0 }}>{restaurantData?.name || 'Restaurant'}</h1>
        <p style={{ fontSize: '0.65rem', color: '#444', marginTop: '6px', letterSpacing: '2px', fontWeight: '700' }}>COUNTER · WAITLIST & PICKUP</p>
        {avgWait && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.15)', borderRadius: '20px', padding: '6px 16px', marginTop: '10px' }}>
            <Clock size={13} color={gold} />
            <span style={{ fontSize: '0.68rem', color: '#888', fontWeight: '700' }}>
              Est. wait <span style={{ color: gold }}>{avgWait.avgWait} min</span> · {avgWait.tablesOccupied}/{avgWait.totalTables} tables occupied
            </span>
          </div>
        )}
      </div>

      {/* ── SCREEN: PUSH PROMPT ── */}
      {screen === 'push-prompt' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '24px' }}>🔔</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>
            सूचना मिळवण्यास परवानगी द्या
          </h2>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#888', marginBottom: '16px' }}>Allow Notifications</h3>
          <p style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.7, marginBottom: '8px', maxWidth: '300px' }}>
            जेव्हा तुमचे टेबल / ऑर्डर तयार होईल तेव्हा आम्ही तुम्हाला सूचना पाठवू.
          </p>
          <p style={{ fontSize: '0.75rem', color: '#444', lineHeight: 1.6, marginBottom: '40px', maxWidth: '300px' }}>
            We'll notify you when your table or order is ready — even if you close this page.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
            <button onClick={() => handlePushPrompt(true)}
              style={{ padding: '18px', background: `linear-gradient(135deg, ${gold}, #bda88a)`, color: '#000', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer' }}>
              परवानगी द्या · ALLOW
            </button>
            <button onClick={() => handlePushPrompt(false)}
              style={{ padding: '16px', background: 'transparent', color: '#444', border: '1px solid #2a2a2a', borderRadius: '14px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
              नंतर · NOT NOW
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SCREEN: MODE SELECTION ── */}
      {screen === 'mode' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '40px 24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', marginBottom: '8px', textAlign: 'center' }}>
            आज काय करायचे आहे?
          </h2>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#555', marginBottom: '32px', fontWeight: '700' }}>
            WHAT BRINGS YOU IN TODAY?
          </p>

          {avgWait && (
            <div style={{ background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#BA7517', fontWeight: '800' }}>
                {avgWait.tablesOccupied >= avgWait.totalTables
                  ? `All ${avgWait.totalTables} tables occupied · Est. wait ~${avgWait.avgWait} min`
                  : `${avgWait.totalTables - avgWait.tablesOccupied} tables available right now`}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* DINE-IN WAITLIST */}
            <button onClick={() => handleModeSelect('dine-in')}
              style={{ padding: '28px 24px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.2)', borderRadius: '20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UtensilsCrossed size={24} color={gold} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>🪑 JOIN WAITLIST</div>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#888', marginBottom: '3px' }}>रांगेत नाव नोंदवा</div>
                <div style={{ fontSize: '0.68rem', color: '#555', fontWeight: '600' }}>
                  Pre-order while you wait · Estimated {avgWait?.avgWait || '~20'} min
                </div>
              </div>
            </button>

            {/* PICKUP / TAKEAWAY */}
            <button onClick={() => handleModeSelect('pickup')}
              style={{ padding: '28px 24px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.2)', borderRadius: '20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingBag size={24} color={gold} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>🛍️ ORDER PICKUP</div>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#888', marginBottom: '3px' }}>टेकअवे / पिकअप ऑर्डर</div>
                <div style={{ fontSize: '0.68rem', color: '#555', fontWeight: '600' }}>
                  Order now, pick up at your time · No wait needed
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SCREEN: REGISTER ── */}
      {screen === 'register' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '40px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <button onClick={() => setScreen('mode')} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#555', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem' }}>
              ← BACK
            </button>
            <h2 style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', margin: 0 }}>
              {mode === 'dine-in' ? '🪑 JOIN WAITLIST' : '🛍️ SCHEDULE PICKUP'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: '0.58rem', color: '#555', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                तुमचे नाव · Your Name *
              </label>
              <input type="text" placeholder="e.g. Rajesh Patil" value={customerName} onChange={e => setCustomerName(e.target.value)}
                style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(211,191,162,0.2)', color: '#fff', borderRadius: '14px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Party size — dine-in only */}
            {mode === 'dine-in' && (
              <div>
                <label style={{ fontSize: '0.58rem', color: '#555', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>
                  किती जण आहात? · Party Size
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button key={n} onClick={() => setPartySize(n)}
                      style={{ width: '52px', height: '52px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', background: partySize === n ? gold : 'rgba(255,255,255,0.04)', color: partySize === n ? '#000' : '#666', outline: partySize === n ? 'none' : '1px solid rgba(211,191,162,0.1)' }}>
                      {n}{n === 6 ? '+' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pickup time — pickup only */}
            {mode === 'pickup' && (
              <div>
                <label style={{ fontSize: '0.58rem', color: '#555', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  पिकअपची वेळ · Pickup Time *
                </label>
                <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)}
                  style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(211,191,162,0.2)', color: '#fff', borderRadius: '14px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
              </div>
            )}

            <button onClick={handleRegister} disabled={!customerName.trim() || (mode === 'pickup' && !pickupTime)}
              style={{ padding: '18px', background: customerName.trim() ? `linear-gradient(135deg, ${gold}, #bda88a)` : '#222', color: customerName.trim() ? '#000' : '#444', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '0.95rem', cursor: customerName.trim() ? 'pointer' : 'not-allowed', marginTop: '8px' }}>
              CONTINUE TO MENU →
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SCREEN: MINI MENU ── */}
      {screen === 'menu' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 0 120px' }}>
          {/* Status bar */}
          <div style={{ padding: '14px 24px', background: 'rgba(211,191,162,0.04)', borderBottom: '1px solid rgba(211,191,162,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
            <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: '700' }}>
              {mode === 'dine-in'
                ? `🪑 ${customerName} · ${partySize} person${partySize > 1 ? 's' : ''} · Pre-order while you wait`
                : `🛍️ ${customerName} · Pickup at ${pickupTime}`}
            </span>
          </div>

          <div style={{ padding: '16px 20px 8px' }}>
            <p style={{ fontSize: '0.72rem', color: '#555', fontWeight: '700', margin: '0 0 16px', letterSpacing: '0.5px' }}>
              BROWSE MENU — Add items to pre-order
            </p>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '8px', padding: '0 20px 14px', overflowX: 'auto' }} className="no-scrollbar">
            {categories.map(cat => {
              const hasItems = menuItems.some(i => i.categoryId === cat.categoryId && i.isAvailable !== false);
              if (!hasItems) return null;
              return (
                <button key={cat.categoryId}
                  style={{ padding: '7px 16px', borderRadius: '20px', border: '1px solid rgba(211,191,162,0.15)', background: 'rgba(211,191,162,0.04)', color: '#666', fontSize: '0.65rem', fontWeight: '900', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Menu items */}
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {menuItems.filter(i => i.isAvailable !== false).map(item => {
              const singleKey = `${item._id}|Single`;
              const halfKey = `${item._id}|Half`;
              const fullKey = `${item._id}|Full`;
              return (
                <div key={item._id}
                  style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(211,191,162,0.08)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    {/* Veg/non-veg dot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                      <span style={{ width: '12px', height: '12px', border: `2px solid ${item.isVeg !== false ? '#4a7c3f' : '#8a3030'}`, borderRadius: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.isVeg !== false ? '#4a7c3f' : '#8a3030' }} />
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{item.name}</span>
                    </div>
                    {!item.priceHalf ? (
                      <span style={{ fontSize: '0.78rem', color: gold, fontWeight: '800' }}>₹{item.price}</span>
                    ) : (
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>
                        Half ₹{item.priceHalf} · Full ₹{item.priceFull || item.price}
                      </div>
                    )}
                  </div>

                  {/* Add/counter */}
                  {!item.priceHalf ? (
                    cart[singleKey] > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(211,191,162,0.1)', padding: '6px 12px', borderRadius: '10px' }}>
                        <button onClick={() => setCart(p => { const n = { ...p }; if (n[singleKey] <= 1) delete n[singleKey]; else n[singleKey]--; return n; })} style={{ background: 'none', border: 'none', color: gold, cursor: 'pointer', fontSize: '1.1rem', fontWeight: '900' }}>−</button>
                        <span style={{ color: '#fff', fontWeight: '900', minWidth: '16px', textAlign: 'center' }}>{cart[singleKey]}</span>
                        <button onClick={() => setCart(p => ({ ...p, [singleKey]: (p[singleKey] || 0) + 1 }))} style={{ background: 'none', border: 'none', color: gold, cursor: 'pointer', fontSize: '1.1rem', fontWeight: '900' }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => setCart(p => ({ ...p, [singleKey]: 1 }))}
                        style={{ padding: '8px 16px', border: `1px solid ${gold}`, background: 'transparent', color: gold, borderRadius: '10px', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>
                        ADD
                      </button>
                    )
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                      {[{ key: halfKey, label: 'H' }, { key: fullKey, label: 'F' }].map(({ key: k, label }) => (
                        cart[k] > 0 ? (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(211,191,162,0.1)', padding: '5px 10px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.58rem', color: '#666', fontWeight: '900' }}>{label}</span>
                            <button onClick={() => setCart(p => { const n = { ...p }; if (n[k] <= 1) delete n[k]; else n[k]--; return n; })} style={{ background: 'none', border: 'none', color: gold, cursor: 'pointer', fontSize: '1rem' }}>−</button>
                            <span style={{ color: '#fff', fontWeight: '900', fontSize: '0.85rem' }}>{cart[k]}</span>
                            <button onClick={() => setCart(p => ({ ...p, [k]: (p[k] || 0) + 1 }))} style={{ background: 'none', border: 'none', color: gold, cursor: 'pointer', fontSize: '1rem' }}>+</button>
                          </div>
                        ) : (
                          <button key={k} onClick={() => setCart(p => ({ ...p, [k]: 1 }))}
                            style={{ padding: '5px 12px', border: '1px solid rgba(211,191,162,0.2)', background: 'transparent', color: '#666', borderRadius: '7px', fontWeight: '900', fontSize: '0.62rem', cursor: 'pointer' }}>
                            {label === 'H' ? 'HALF' : 'FULL'}
                          </button>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky bottom — Place order */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 34px', background: `linear-gradient(to top, ${dark} 80%, transparent)` }}>
            {cartItems.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.7rem', color: '#555', fontWeight: '700' }}>
                  {cartItems.reduce((a, i) => a + i.quantity, 0)} items
                </span>
                <span style={{ fontSize: '0.78rem', color: gold, fontWeight: '900' }}>
                  ₹{cartTotal}
                </span>
              </div>
            )}
            <button onClick={handlePlaceOrder} disabled={submitting}
              style={{ width: '100%', padding: '18px', background: `linear-gradient(135deg, ${gold}, #bda88a)`, color: '#000', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'PLACING ORDER...' : cartItems.length > 0 ? `PLACE ORDER · ₹${cartTotal} →` : mode === 'dine-in' ? 'JOIN WAITLIST (NO PRE-ORDER)' : 'CONFIRM PICKUP SLOT →'}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SCREEN: WAITING / CONFIRMATION ── */}
      {screen === 'waiting' && entry && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: gold, marginBottom: '6px' }}>
            {mode === 'dine-in' ? 'ऑर्डर दिली गेली!' : 'ऑर्डर नोंदवली गेली!'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '32px' }}>
            {mode === 'dine-in' ? 'Order placed!' : 'Pickup confirmed!'}
          </p>

          {/* Queue/pickup info card */}
          <div style={{ background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.15)', borderRadius: '20px', padding: '28px', marginBottom: '24px', textAlign: 'left' }}>
            {mode === 'dine-in' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#555', fontWeight: '900', textTransform: 'uppercase' }}>Queue Position</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '900', color: gold }}>#{entry.waitlistPosition}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#555', fontWeight: '900', textTransform: 'uppercase' }}>Estimated Wait</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fff' }}>~{avgWait?.avgWait || 20} minutes</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.65rem', color: '#555', fontWeight: '900', textTransform: 'uppercase' }}>Pickup Time</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '900', color: gold }}>{pickupTime}</span>
              </div>
            )}

            {/* Pre-ordered items */}
            {cartItems.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(211,191,162,0.1)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px' }}>YOUR PRE-ORDER</div>
                {cartItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px', fontSize: '0.8rem' }}>
                    <span style={{ color: '#888' }}>{item.quantity}x {item.name}{item.portion !== 'Single' ? ` (${item.portion})` : ''}</span>
                    <span style={{ color: gold, fontWeight: '800' }}>₹{item.subtotal}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(211,191,162,0.08)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff' }}>Total</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '900', color: gold }}>₹{cartTotal}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notification reminder */}
          <div style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.12)', borderRadius: '12px', padding: '14px 18px', textAlign: 'left', marginBottom: '28px' }}>
            <div style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: '800', marginBottom: '4px' }}>🔔 NOTIFICATIONS ACTIVE</div>
            <div style={{ fontSize: '0.65rem', color: '#555', lineHeight: 1.6 }}>
              जेव्हा {mode === 'dine-in' ? 'टेबल तयार होईल' : 'ऑर्डर तयार होईल'} तेव्हा तुम्हाला सूचना मिळेल — जरी हे पेज बंद केले तरी.
            </div>
            <div style={{ fontSize: '0.62rem', color: '#444', marginTop: '4px' }}>
              You'll be notified when your {mode === 'dine-in' ? 'table is ready' : 'order is ready'} — even if you close this page.
            </div>
          </div>
        </motion.div>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default CounterPage;