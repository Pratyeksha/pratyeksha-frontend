import React, { useEffect, useState, useRef } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Timer, Hourglass, BellRing, StickyNote, ChevronDown } from 'lucide-react';

const KitchenView = () => {
  const { tenantId } = useParams();
  const [orders, setOrders] = useState([]);
  
  const BASE_URL = "https://pratyeksha-backend.onrender.com/api";
  const audioPlayer = useRef(null);

  const markAsReady = async (orderId) => {
    try {
      await axios.patch(`${BASE_URL}/admin/orders/${orderId}`, {
        status: 'served'
      });
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err) {
      console.error("Dispatch Error:", err);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`);
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
    } catch (err) { console.error("Fetch Error:", err); }
  };

  useEffect(() => {
    if (!tenantId) return;
    fetchActiveOrders();
    
    const socket = io("https://pratyeksha-backend.onrender.com", {
        transports: ['polling', 'websocket']
    });
    socket.emit("join_restaurant", tenantId);

    socket.on("new_order", (newOrder) => {
      if (newOrder.tenantId === tenantId) {
        setOrders(prev => [newOrder, ...prev]);
        audioPlayer.current?.play().catch(() => { });
      }
    });

    socket.on("order_status_updated", (updatedOrder) => {
      if (updatedOrder.status !== 'pending') setOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
    });

    return () => socket.disconnect();
  }, [tenantId]);

  return (
    <div style={styles.kdsContainer}>
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

      <header style={styles.kdsHeader}>
        <div style={styles.headerBrand}>
          <motion.div whileHover={{ rotate: 15 }} style={styles.logoBadge}>
            <ChefHat color="#d3bfa2" size={28} />
          </motion.div>
          <div>
            <h1 style={styles.mainTitle}>PRODUCTION / <span style={{ color: '#d3bfa2' }}>FLOW</span></h1>
            <div style={styles.statusLine}>
              <span style={styles.pulseDot} />
              <p style={styles.subTitle}>OPERATIONAL COMMAND CENTER</p>
            </div>
          </div>
        </div>

        <div style={styles.headerStats}>
          <div style={styles.statGroup}>
            <span style={styles.statLabel}>ACTIVE TICKETS</span>
            <span style={styles.statValue}>{orders.length}</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.timeGroup}>
            <span style={styles.statLabel}>SYSTEM CLOCK</span>
            <span style={styles.statValue}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      <div style={styles.grid}>
        <AnimatePresence mode="popLayout">
          {orders.map((order, index) => (
            <KDSOrderCard
              key={order._id}
              order={order}
              isNewest={index === 0}
              onReady={markAsReady}
            />
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Cinzel:wght@700&display=swap');
        body { margin: 0; background: #050505; overflow-x: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .order-card-glow { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
};

const KDSOrderCard = ({ order, onReady, isNewest }) => {
  const [elapsed, setElapsed] = useState(0);
  const listRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const calc = () => setElapsed(Math.floor((new Date() - new Date(order.createdAt)) / 60000));
    calc();
    const timer = setInterval(calc, 30000); 
    return () => clearInterval(timer);
  }, [order.createdAt]);

  useEffect(() => {
    if (listRef.current) {
      setHasOverflow(listRef.current.scrollHeight > listRef.current.clientHeight);
    }
  }, [order.items]);

  // 🚀 Feature: Dynamic Shading Logic
  const getVisualState = () => {
    if (elapsed >= 15) return { 
        border: 'rgba(211, 191, 162, 0.9)', 
        glow: '0 0 25px rgba(211, 191, 162, 0.25)', 
        bg: 'rgba(211, 191, 162, 0.08)', 
        icon: '#fff',
        label: 'CRITICAL'
    };
    if (elapsed >= 10) return { 
        border: 'rgba(211, 191, 162, 0.5)', 
        glow: '0 0 15px rgba(211, 191, 162, 0.1)', 
        bg: 'rgba(211, 191, 162, 0.03)', 
        icon: '#d3bfa2',
        label: 'WARNING'
    };
    return { 
        border: 'rgba(255, 255, 255, 0.05)', 
        glow: 'none', 
        bg: '#111', 
        icon: '#555',
        label: 'STABLE'
    };
  };

  const state = getVisualState();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{
        opacity: 1, y: 0, scale: 1,
        borderColor: isNewest ? '#d3bfa2' : state.border
      }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
      className="order-card-glow"
      style={{
        ...styles.card,
        boxShadow: state.glow,
        backgroundColor: state.bg
      }}>

      {isNewest && (
        <div style={styles.newRibbon}>
          <BellRing size={12} style={{ marginRight: 6 }} /> NEW ARRIVAL
        </div>
      )}

      <div style={styles.cardHeader}>
        <div>
          <span style={styles.tableLabel}>TABLE</span>
          <h2 style={styles.tableNum}>{order.tableNumber}</h2>
        </div>
        <div style={{ ...styles.timerBadge, borderColor: state.border }}>
          {state.label === 'CRITICAL' ? <Hourglass size={14} color="#d3bfa2" /> : <Timer size={14} color={state.icon} />}
          <span style={{ color: state.label === 'STABLE' ? '#777' : '#fff', fontWeight: 'bold' }}>{elapsed}m</span>
        </div>
      </div>

      <div ref={listRef} style={styles.itemList} className="no-scrollbar">
        {order.items.map((item, idx) => (
          <div key={idx} style={styles.itemRow}>
            <div style={{...styles.qtyIndicator, borderColor: state.border}}>{item.quantity}</div>
            <div style={{ flex: 1 }}>
              <span style={styles.itemName}>{item.name}</span>
              <span style={styles.portionText}>{item.portion !== 'Single' ? item.portion.toUpperCase() : 'STANDARD'}</span>
              {item.suggestion && (
                <div style={styles.suggestionBox}>
                  <StickyNote size={12} style={{ marginRight: 6, color: '#d3bfa2' }} />
                  <span>{item.suggestion.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasOverflow && (
        <div style={styles.moreIndicator}>
          <ChevronDown size={14} color="#d3bfa2" />
          <span style={{ marginLeft: 5 }}>SCROLL FOR MORE</span>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        style={{...styles.doneBtn, borderColor: state.border}}
        onClick={() => onReady(order._id)}
      >
        {state.label === 'CRITICAL' ? 'PRIORITY DISPATCH' : 'DISPATCH TICKET'}
      </motion.button>
    </motion.div>
  );
};

const styles = {
  kdsContainer: { backgroundColor: '#050505', minHeight: '100vh', padding: '50px 40px', fontFamily: "'Outfit', sans-serif", backgroundImage: 'radial-gradient(circle at top right, #0a0a0a, #050505)' },
  kdsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '30px' },
  headerBrand: { display: 'flex', alignItems: 'center', gap: '25px' },
  logoBadge: { background: '#0d0d0d', padding: '15px', borderRadius: '20px', border: '1px solid rgba(211, 191, 162, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' },
  mainTitle: { color: '#fff', margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '4px', fontFamily: "'Cinzel', serif" },
  statusLine: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' },
  pulseDot: { width: '6px', height: '6px', backgroundColor: '#d3bfa2', borderRadius: '50%', boxShadow: '0 0 12px #d3bfa2' },
  subTitle: { color: '#444', margin: 0, fontSize: '0.7rem', letterSpacing: '3px', fontWeight: 600 },
  headerStats: { display: 'flex', alignItems: 'center', gap: '40px', background: '#0d0d0d', padding: '12px 30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' },
  statGroup: { textAlign: 'center' },
  divider: { width: '1px', height: '30px', background: 'rgba(255,255,255,0.05)' },
  statLabel: { display: 'block', color: '#444', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '4px' },
  statValue: { color: '#fff', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '1px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' },
  card: { borderRadius: '28px', padding: '28px', display: 'flex', flexDirection: 'column', height: '420px', border: '1px solid', position: 'relative', overflow: 'hidden' },
  newRibbon: { position: 'absolute', top: 0, left: 0, right: 0, background: '#d3bfa2', color: '#000', fontSize: '0.65rem', fontWeight: 900, textAlign: 'center', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '1px', zIndex: 10 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', marginTop: '10px' },
  tableLabel: { color: '#d3bfa2', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '2px' },
  tableNum: { color: '#fff', fontSize: '2.4rem', fontWeight: 800, margin: 0, fontFamily: "'Cinzel', serif", lineHeight: 1 },
  timerBadge: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem', fontWeight: 700 },
  itemList: { flex: 1, overflowY: 'auto', paddingRight: '5px', margin: '10px 0' },
  itemRow: { display: 'flex', gap: '20px', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  qtyIndicator: { width: '32px', height: '32px', background: 'rgba(211, 191, 162, 0.05)', border: '1px solid', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '10px', fontWeight: 800, fontSize: '1rem', flexShrink: 0 },
  itemName: { color: '#eee', fontSize: '1.05rem', fontWeight: 600, display: 'block' },
  portionText: { color: '#555', fontSize: '0.7rem', fontWeight: 700, marginTop: '4px', display: 'block' },
  suggestionBox: { color: '#d3bfa2', fontSize: '0.75rem', display: 'flex', alignItems: 'center', marginTop: '12px', background: 'rgba(211, 191, 162, 0.1)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(211, 191, 162, 0.15)', fontWeight: '600' },
  moreIndicator: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d3bfa2', fontSize: '0.6rem', fontWeight: 900, padding: '6px 0', marginBottom: '10px' },
  doneBtn: { width: '100%', padding: '18px', borderRadius: '18px', border: '1px solid rgba(211, 191, 162, 0.3)', backgroundColor: 'transparent', color: '#d3bfa2', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '5px', letterSpacing: '2px', textTransform: 'uppercase' }
};

export default KitchenView;