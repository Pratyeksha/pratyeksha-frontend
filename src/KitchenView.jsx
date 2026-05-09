import React, { useEffect, useState, useRef, useMemo } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Timer, Hourglass, BellRing, StickyNote, 
  X, Zap, History, LayoutGrid, BarChart3, 
  Package, UtensilsCrossed, Clock, CheckSquare, 
  Activity, ChevronDown, Monitor, Coffee
} from 'lucide-react';

/**
 * PRATYEKSHA KDS PRO - EXECUTIVE GOLD EDITION (v10.8)
 * THEME: ROYAL GOLD & OBSIDIAN
 * VOICE: Enhanced with Portion & Full Suggestion Readout
 */

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

const KitchenView = () => {
  const { tenantId } = useParams();
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [recallQueue, setRecallQueue] = useState([]);
  const [isAggregateView, setIsAggregateView] = useState(false);
  const audioPlayer = useRef(null);

  // 🎙️ PREMIUM INDIAN VOICE ENGINE (Portions + Suggestions)
  const speakOrder = (order) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let orderSpeech = `Chef, new ticket for Table ${order.tableNumber}. `;
    
    const itemsSpeech = order.items.map(i => {
      const portionText = (i.portion && i.portion.toLowerCase() !== 'single') ? `${i.portion} ` : "";
      const typeText = i.isParcel ? 'Parcel' : 'Dine in';
      let itemDetail = `${i.quantity} ${portionText}${i.name} ${typeText}`;
      
      // READOUT SUGGESTIONS IF PRESENT
      if (i.suggestion && i.suggestion.trim() !== "") {
        itemDetail += `. Special instruction: ${i.suggestion}`;
      }
      return itemDetail;
    }).join(". ");

    const utterance = new SpeechSynthesisUtterance(orderSpeech + itemsSpeech);
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes('IN')) || voices[0];
    if (indianVoice) utterance.voice = indianVoice;
    
    utterance.rate = 0.82; // Slower rate to ensure suggestions are heard clearly
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const fetchActiveOrders = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`);
      setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) { console.error("Fetch Error"); }
  };

  useEffect(() => {
    if (!tenantId) return;
    fetchActiveOrders();
    
    const socket = io("https://pratyeksha-backend.onrender.com", { transports: ['polling', 'websocket'] });
    socket.emit("join_restaurant", tenantId);

    socket.on("new_order", (newOrder) => {
      if (newOrder.tenantId === tenantId) {
        setOrders(prev => [newOrder, ...prev]);
        audioPlayer.current?.play().catch(() => {});
        speakOrder(newOrder);
      }
    });

    socket.on("waiter_called", (data) => {
      if (data.tenantId === tenantId) setWaiterCalls(prev => [{ id: Date.now(), ...data }, ...prev]);
    });

    return () => socket.disconnect();
  }, [tenantId]);

  const markAsReady = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    setRecallQueue(prev => [order, ...prev].slice(0, 10));
    try {
      await axios.patch(`${BASE_URL}/admin/orders/${orderId}`, { status: 'served' });
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err) { console.error(err); }
  };

  const handleRecall = () => {
    if (recallQueue.length === 0) return;
    const recalled = recallQueue[0];
    setOrders(prev => [recalled, ...prev]);
    setRecallQueue(prev => prev.slice(1));
  };

  const aggregatedTotals = useMemo(() => {
    const totals = {};
    orders.forEach(o => o.items.forEach(i => {
      const portionSuffix = (i.portion && i.portion.toLowerCase() !== 'single') ? ` (${i.portion})` : "";
      const key = `${i.name}${portionSuffix} ${i.isParcel ? '[P]' : '[D]'}`;
      totals[key] = (totals[key] || 0) + i.quantity;
    }));
    return totals;
  }, [orders]);

  return (
    <div style={styles.kdsContainer}>
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

      {/* --- HUD --- */}
      <header style={styles.hudHeader}>
        <div style={styles.brandCluster}>
          <div style={styles.logoBadge}><ChefHat color="#d3bfa2" size={32} /></div>
          <div>
            <h1 style={styles.mainTitle}>PRATYEKSHA / <span style={{ color: '#d3bfa2' }}>KDS GOLD</span></h1>
            <div style={styles.statusLine}><span style={styles.goldPulseDot} /><p style={styles.subTitle}>TITANIUM ENGINE • VOICE ENABLED</p></div>
          </div>
        </div>

        <div style={styles.actionCenter}>
          <button onClick={() => setIsAggregateView(!isAggregateView)} style={styles.utilityBtn}>
            {isAggregateView ? <LayoutGrid size={18} /> : <BarChart3 size={18} />}
            <span>{isAggregateView ? "TICKET VIEW" : "PREP SUMMARY"}</span>
          </button>
          
          {recallQueue.length > 0 && (
            <button onClick={handleRecall} style={{...styles.utilityBtn, color: '#f0e6d2'}}>
              <History size={18} /> RECALL LAST
            </button>
          )}

          <div style={styles.headerStats}>
            <div style={styles.statGroup}><span style={styles.statValue}>{orders.length}</span><span style={styles.statLabel}>TICKETS</span></div>
            <div style={styles.divider} />
            <div style={styles.timeBox}>
                <Clock size={16} color="#d3bfa2" />
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main style={styles.workspace}>
        {isAggregateView ? (
          <div style={styles.aggregateGrid}>
            {Object.entries(aggregatedTotals).map(([name, qty]) => (
              <div key={name} style={styles.aggregateCard}>
                 <div style={styles.aggregateQty}>{qty < 10 ? `0${qty}` : qty}</div>
                 <div style={styles.aggregateName}>{name.toUpperCase()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.grid}>
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => (
                <KDSOrderCard key={order._id} order={order} isNewest={index === 0} onReady={markAsReady} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* --- ALERTS --- */}
      <div style={styles.waiterLayer}>
        <AnimatePresence>
          {waiterCalls.map((call) => (
            <motion.div key={call.id} initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} style={styles.callStrip}>
                <div style={styles.callIconBox}><BellRing size={20} color="#000" /></div>
                <div style={{flex: 1}}><b>TABLE {call.tableNumber}</b>: {call.reason?.toUpperCase()}</div>
                <X size={20} style={{cursor:'pointer'}} onClick={() => setWaiterCalls(prev => prev.filter(c => c.id !== call.id))} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&family=JetBrains+Mono:wght@700&display=swap');
        body { margin: 0; background: #050505; color: #fff; overflow-x: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>
    </div>
  );
};

const KDSOrderCard = ({ order, onReady, isNewest }) => {
  const [seconds, setSeconds] = useState(0);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    const update = () => setSeconds(Math.floor((new Date() - new Date(order.createdAt)) / 1000));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
    return `${pad(m)}:${pad(s)}`;
  };

  const urgencyTier = seconds >= 1200 ? 'high' : seconds >= 600 ? 'medium' : 'low';

  return (
    <motion.div 
        layout 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ 
            opacity: 1, 
            y: 0, 
            borderColor: isNewest ? '#d3bfa2' : urgencyTier === 'high' ? '#f0e6d2' : '#1a1a1a',
            boxShadow: urgencyTier === 'high' ? '0 0 25px rgba(211, 191, 162, 0.1)' : 'none'
        }} 
        style={{...styles.card, background: urgencyTier === 'high' ? 'rgba(211, 191, 162, 0.04)' : '#0d0d0d'}}
    >
      <div style={styles.cardHeader}>
        <div><h2 style={styles.tableNum}>T-{order.tableNumber}</h2><span style={styles.ticketId}>ID: {order._id.slice(-4).toUpperCase()}</span></div>
        <div style={{...styles.timerBadge, borderColor: urgencyTier !== 'low' ? '#d3bfa2' : '#222'}}>
          <Clock size={16} color={urgencyTier !== 'low' ? '#d3bfa2' : '#555'} />
          <span className="mono" style={{color: urgencyTier !== 'low' ? '#fff' : '#888'}}>{formatTime(seconds)}</span>
        </div>
      </div>

      <div style={styles.itemList} className="no-scrollbar">
        {order.items.map((item, idx) => (
          <div key={idx} onClick={() => setCheckedItems({...checkedItems, [idx]: !checkedItems[idx]})} style={{...styles.itemRow, opacity: checkedItems[idx] ? 0.2 : 1}}>
            <div style={{...styles.qtyBox, background: checkedItems[idx] ? '#000' : '#222'}}>{item.quantity}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex', alignItems:'center', gap: 8}}>
                <span style={{...styles.itemName, textDecoration: checkedItems[idx] ? 'line-through' : 'none'}}>{item.name}</span>
                {item.isParcel ? (
                    <div style={styles.parcelBadge}><Package size={10} /> PARCEL</div>
                ) : (
                    <div style={styles.dineBadge}><UtensilsCrossed size={10} /> DINE-IN</div>
                )}
              </div>
              <span style={{...styles.portion, color: item.portion?.toLowerCase() === 'half' ? '#d3bfa2' : '#666'}}>
                {item.portion?.toUpperCase() || 'STANDARD'}
              </span>
              {item.suggestion && (
                <div style={styles.note}>
                  <StickyNote size={10} /> 
                  <span style={{textTransform: 'uppercase'}}>{item.suggestion}</span>
                </div>
              )}
            </div>
            {checkedItems[idx] && <CheckSquare size={18} color="#d3bfa2" />}
          </div>
        ))}
      </div>

      <button 
        style={{...styles.doneBtn, background: urgencyTier === 'high' ? '#d3bfa2' : 'transparent', color: urgencyTier === 'high' ? '#000' : '#d3bfa2'}} 
        onClick={() => onReady(order._id)}
      >
        {urgencyTier === 'high' ? "PRIORITY READY" : "COMPLETE TICKET"}
      </button>
    </motion.div>
  );
};

const styles = {
  kdsContainer: { minHeight: '100vh', padding: '40px', background: '#050505', backgroundImage: 'radial-gradient(circle at top right, #0a0a0a, #050505)' },
  hudHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: '#0d0d0d', padding: '20px 35px', borderRadius: '20px', border: '1px solid rgba(211, 191, 162, 0.1)' },
  brandCluster: { display: 'flex', alignItems: 'center', gap: '25px' },
  logoBadge: { background: '#000', padding: '12px', borderRadius: '15px', border: '1px solid #222', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  mainTitle: { margin: 0, fontSize: '1.6rem', fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif" },
  statusLine: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' },
  goldPulseDot: { width: '8px', height: '8px', background: '#d3bfa2', borderRadius: '50%', boxShadow: '0 0 10px #d3bfa2' },
  subTitle: { color: '#555', margin: 0, fontSize: '0.65rem', letterSpacing: '2px', fontWeight: 800 },
  actionCenter: { display: 'flex', alignItems: 'center', gap: '20px' },
  utilityBtn: { background: '#111', border: '1px solid #222', color: '#fff', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', fontWeight: 700 },
  headerStats: { background: '#111', padding: '8px 25px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #222' },
  statValue: { color: '#fff', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'JetBrains Mono' },
  statLabel: { color: '#d3bfa2', fontSize: '0.55rem', fontWeight: 900, marginLeft: '5px' },
  divider: { width: '1px', height: '30px', background: '#222' },
  timeBox: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 800, color: '#d3bfa2' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '25px' },
  aggregateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
  aggregateCard: { background: '#0d0d0d', padding: '40px 20px', borderRadius: '25px', border: '1px solid #1a1a1a', textAlign: 'center' },
  aggregateQty: { fontSize: '4rem', fontWeight: 900, color: '#d3bfa2', fontFamily: 'JetBrains Mono', lineHeight: 1 },
  aggregateName: { fontSize: '0.8rem', letterSpacing: '1px', color: '#444', marginTop: '15px', fontWeight: 800 },
  card: { borderRadius: '30px', padding: '25px', display: 'flex', flexDirection: 'column', height: '480px', border: '2px solid', position: 'relative', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  tableNum: { fontSize: '3rem', margin: 0, fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif" },
  ticketId: { fontSize: '0.65rem', color: '#333', fontWeight: 800 },
  timerBadge: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 900, padding: '5px 12px', borderRadius: '10px', background: '#000', border: '1px solid' },
  itemList: { flex: 1, overflowY: 'auto' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: '1px solid #151515', cursor: 'pointer' },
  qtyBox: { width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', fontWeight: 900, fontSize: '1.2rem', color: '#d3bfa2', fontFamily: 'JetBrains Mono' },
  itemName: { fontSize: '1.05rem', fontWeight: 700, color: '#eee' },
  portion: { fontSize: '0.65rem', fontWeight: 900, marginTop: '2px', display: 'block' },
  parcelBadge: { background: 'rgba(211, 191, 162, 0.1)', color: '#d3bfa2', fontSize: '0.55rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(211, 191, 162, 0.2)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 },
  dineBadge: { background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '0.55rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 },
  note: { color: '#d3bfa2', fontSize: '0.7rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(211, 191, 162, 0.05)', padding: '6px 10px', borderRadius: '8px' },
  doneBtn: { width: '100%', padding: '18px', borderRadius: '18px', border: '1.5px solid', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', marginTop: '15px', textTransform: 'uppercase', letterSpacing: '1px' },
  waiterLayer: { position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '15px' },
  callStrip: { background: '#d3bfa2', color: '#000', padding: '20px 35px', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '25px', fontSize: '1rem', fontWeight: 900, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' },
  callIconBox: { background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '12px' }
};

export default KitchenView;