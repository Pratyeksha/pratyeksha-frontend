import React, { useEffect, useState, useRef, useMemo } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Timer, Hourglass, BellRing, StickyNote, 
  X, Zap, History, LayoutGrid, BarChart3, 
  Package, UtensilsCrossed, Clock, CheckSquare, 
  Activity, ChevronDown, Monitor, Coffee, Layers, Flame
} from 'lucide-react';

/**
 * 👑 PRATYEKSHA KDS PRO - MAJESTIC GOLD EXECUTIVE EDITION (v13.5)
 * THEME: ROYAL OBSIDIAN & GOLD REFLECTIONS (FULL-SCREEN EXTRA FLUID FRAMEWORK)
 * VOICE: Enhanced with Portion & Full Suggestion Readout
 */

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

const KitchenView = () => {
  const { tenantId } = useParams();
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [recallQueue, setRecallQueue] = useState([]);
  const [isAggregateView, setIsAggregateView] = useState(false);
  
  // 🚀 HARDWARE EXTRA DESKTOP & TABLET FILTER STATE CONTROLLERS
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stationFilter, setStationFilter] = useState('ALL'); // 'ALL' | 'DINEIN' | 'PARCEL'

  const audioPlayer = useRef(null);

  // 🎙️ PREMIUM INDIAN VOICE ENGINE (Portions + Suggestions)
  const speakOrder = (order) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let orderSpeech = `Chef, new ticket for Table ${order.tableNumber}. `;
    
    const itemsSpeech = order.items.map(i => {
      const portionText = (i.portion && i.portion.toLowerCase() !== 'single') ? `${i.portion} ` : "";
      const isTakeawayParcel = order.tableNumber?.toLowerCase() === 'takeaway' || i.isParcel;
      const typeText = isTakeawayParcel ? 'Parcel' : 'Dine in';
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
    
    utterance.rate = 0.82; 
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const fetchActiveOrders = async () => {
    try {
      const [ordersRes, categoriesRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`),
        axios.get(`${BASE_URL}/categories/${tenantId}`).catch(() => ({ data: [] }))
      ]);
      setOrders(ordersRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setCategories(categoriesRes.data || []);
    } catch (err) { console.error("Fetch Error Matrix Caught Exception."); }
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
      const isTakeawayParcel = o.tableNumber?.toLowerCase() === 'takeaway' || i.isParcel;
      const portionSuffix = (i.portion && i.portion.toLowerCase() !== 'single') ? ` (${i.portion})` : "";
      const key = `${i.name}${portionSuffix} ${isTakeawayParcel ? '[P]' : '[D]'}`;
      totals[key] = (totals[key] || 0) + i.quantity;
    }));
    return totals;
  }, [orders]);

  // 🚀 FIXED QUANTITY COMPILER: Aggregates total item counts using strict case-insensitive 'categoryId' lookups
  const categoryPendingCounts = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
      const orderIsTakeawayParcel = order.tableNumber?.toLowerCase() === 'takeaway' || order.items.some(i => i.isParcel);
      if (stationFilter === 'DINEIN' && orderIsTakeawayParcel) return;
      if (stationFilter === 'PARCEL' && !orderIsTakeawayParcel && order.items.every(i => !i.isParcel)) return;

      order.items.forEach(item => {
        if (item.categoryId) {
          const normalizedKey = item.categoryId.toLowerCase().trim();
          counts[normalizedKey] = (counts[normalizedKey] || 0) + (Number(item.quantity) || 0);
        }
      });
    });
    return counts;
  }, [orders, stationFilter]);

  // 🎫 WORKSPACE FILTER TUNER: Maps selection filters precisely with case-insensitive matching rules
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderIsTakeawayParcel = order.tableNumber?.toLowerCase() === 'takeaway' || order.items.some(i => i.isParcel);
      
      // 1. Differentiate by Service Type Tab Filter Context
      if (stationFilter === 'DINEIN' && orderIsTakeawayParcel) return false;
      if (stationFilter === 'PARCEL' && !orderIsTakeawayParcel && order.items.every(i => !i.isParcel)) return false;

      // 2. Differentiate by Selected Left-Sidebar Category ID
      if (selectedCategory !== 'ALL') {
        return order.items.some(item => {
          if (!item.categoryId) return false;
          return item.categoryId.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
        });
      }
      return true;
    });
  }, [orders, stationFilter, selectedCategory]);

  return (
    <div style={styles.kdsContainer}>
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

      {/* --- HUD HEADER PANELS --- */}
      <header style={styles.hudHeader}>
        <div style={styles.brandCluster}>
          <div style={styles.logoBadge}><ChefHat color="#d3bfa2" size={32} /></div>
          <div>
            <h1 style={styles.mainTitle}>PRATYEKSHA / <span style={{ color: '#d3bfa2' }}>KDS GOLD</span></h1>
            <div style={styles.statusLine}><span style={styles.goldPulseDot} /><p style={styles.subTitle}>TITANIUM ENGINE • LIVE SYNC ACTIVE</p></div>
          </div>
        </div>

        <div style={styles.actionCenter}>
          {/* 🚀 SERVICE STATION SEPARATION CAPSULES (GOLD & OBSIDIAN ENFORCED) */}
          <div style={styles.stationCapsule}>
            <button onClick={() => setStationFilter('ALL')} style={stationFilter === 'ALL' ? styles.activeCapsuleBtn : styles.capsuleBtn}>ALL DISPATCH</button>
            <button onClick={() => setStationFilter('DINEIN')} style={stationFilter === 'DINEIN' ? styles.activeCapsuleBtn : styles.capsuleBtn}>DINE-IN</button>
            <button onClick={() => setStationFilter('PARCEL')} style={stationFilter === 'PARCEL' ? styles.activeCapsuleBtn : styles.capsuleBtn}>PARCEL</button>
          </div>

          <button onClick={() => setIsAggregateView(!isAggregateView)} style={styles.utilityBtn}>
            {isAggregateView ? <LayoutGrid size={18} color="#d3bfa2" /> : <BarChart3 size={18} color="#d3bfa2" />}
            <span>{isAggregateView ? "TICKET VIEW" : "PREP SUMMARY"}</span>
          </button>
          
          {recallQueue.length > 0 && (
            <button onClick={handleRecall} style={{...styles.utilityBtn, color: '#f0e6d2'}}>
              <History size={18} color="#d3bfa2" /> RECALL LAST
            </button>
          )}

          <div style={styles.headerStats}>
            <div style={styles.statGroup}><span style={styles.statValue}>{filteredOrders.length}</span><span style={styles.statLabel}>TICKETS</span></div>
            <div style={styles.divider} />
            <div style={styles.timeBox}>
                <Clock size={16} color="#d3bfa2" />
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- SPLIT LAYOUT BODY WRAPPER FRAMEWORK --- */}
      <div style={styles.layoutBodyWrapper}>
        
        {/* --- 🚀 LEFT SIDE CATEGORIES SUMMARY SIDEBAR PANELS --- */}
        <aside style={styles.leftCategorySidebar}>
          <div style={styles.sidebarHeader}>
            <Layers size={14} color="#d3bfa2" />
            <span>KITCHEN PRODUCTION SECTIONS</span>
          </div>

          <div style={styles.sidebarMenuStack} className="no-scrollbar">
            {/* Master Global Dispatch Node */}
            <button 
              onClick={() => setSelectedCategory('ALL')}
              style={selectedCategory === 'ALL' ? styles.activeSidebarNode : styles.sidebarNode}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Coffee size={14} color={selectedCategory === 'ALL' ? '#000' : '#d3bfa2'} />
                <span style={{ fontWeight: '900', fontSize: '0.72rem' }}>ALL DEPLOYMENTS</span>
              </div>
              <span style={{ 
                ...styles.categoryCountBadge, 
                background: selectedCategory === 'ALL' ? '#000' : '#141414',
                color: selectedCategory === 'ALL' ? '#d3bfa2' : '#fff',
                border: selectedCategory === 'ALL' ? '1px solid rgba(211,191,162,0.3)' : '1px solid #1c1c1c'
              }}>
                {orders.reduce((sum, o) => {
                  const orderIsTakeawayParcel = o.tableNumber?.toLowerCase() === 'takeaway' || o.items.some(i => i.isParcel);
                  if (stationFilter === 'DINEIN' && orderIsTakeawayParcel) return sum;
                  if (stationFilter === 'PARCEL' && !orderIsTakeawayParcel && o.items.every(i => !i.isParcel)) return sum;
                  return sum + o.items.reduce((s, i) => s + i.quantity, 0);
                }, 0)}
              </span>
            </button>

            {/* Loop through actual database collection categories cleanly mapped to live totals counters */}
            {categories.map(cat => {
              // 🚀 THE CRITICAL FIX: Enforce uniform lowercase lookup token keys to fix the 00 counting freeze
              const lookupKey = cat.categoryId ? cat.categoryId.toLowerCase().trim() : '';
              const pendingCount = categoryPendingCounts[lookupKey] || 0;
              
              return (
                <button 
                  key={cat._id}
                  onClick={() => setSelectedCategory(lookupKey)}
                  style={selectedCategory === lookupKey ? styles.activeSidebarNode : styles.sidebarNode}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Flame size={14} color={selectedCategory === lookupKey ? '#000' : '#d3bfa2'} />
                    <span style={{ textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold' }}>{cat.name}</span>
                  </div>
                  <span style={{ 
                    ...styles.categoryCountBadge, 
                    background: selectedCategory === lookupKey ? '#000' : '#141414',
                    color: selectedCategory === lookupKey ? '#d3bfa2' : '#888',
                    border: selectedCategory === lookupKey ? '1px solid #d3bfa2' : '1px solid #1c1c1c',
                    fontFamily: 'JetBrains Mono'
                  }}>
                    {pendingCount < 10 ? `0${pendingCount}` : pendingCount}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* --- MAIN TICKET RENDERING REGION --- */}
        <main style={styles.workspace} className="no-scrollbar">
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
                {filteredOrders.map((order, index) => (
                  <KDSOrderCard key={order._id} order={order} isNewest={index === 0} onReady={markAsReady} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* --- SERVICE ALERTS OVERLAYS --- */}
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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=JetBrains+Mono:wght@700&display=swap');
        body { margin: 0; background: #050505; color: #fff; overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #161616; border-radius: 10px; }
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
            borderColor: isNewest ? '#d3bfa2' : '#161616',
            boxShadow: urgencyTier === 'high' ? '0 0 25px rgba(211, 191, 162, 0.12)' : 'none'
        }} 
        style={{...styles.card, background: '#0a0a0a'}}
    >
      {/* CARD RUNNING HIGHLIGHT STRIP */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: urgencyTier === 'low' ? '#1c1c1c' : '#d3bfa2'
      }} />

      <div style={styles.cardHeader}>
        <div>
          <h2 style={styles.tableNum}>
            {/* 🚀 THE FIXED PREMIUM ICON: Replaces the unrefined TAW text display with vector components cleanly */}
            {order.tableNumber?.toLowerCase() === 'takeaway' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#d3bfa2' }}>
                <Package size={24} strokeWidth={2.5} /> PARCEL
              </span>
            ) : `T-${order.tableNumber}`}
          </h2>
          <span style={styles.ticketId}>ID: {order._id.slice(-4).toUpperCase()}</span>
        </div>
        <div style={{...styles.timerBadge, borderColor: urgencyTier !== 'low' ? '#d3bfa2' : '#222'}}>
          <Clock size={16} color={urgencyTier !== 'low' ? '#d3bfa2' : '#555'} />
          <span className="mono" style={{color: '#fff'}}>{formatTime(seconds)}</span>
        </div>
      </div>

      <div style={styles.itemList} className="custom-scroll">
        {order.items.map((item, idx) => {
          // Takeaway origin contexts map item displays straight to parcel states
          const forceParcelMode = order.tableNumber?.toLowerCase() === 'takeaway' || item.isParcel;

          return (
            <div key={idx} onClick={() => setCheckedItems({...checkedItems, [idx]: !checkedItems[idx]})} style={{...styles.itemRow, opacity: checkedItems[idx] ? 0.2 : 1}}>
              <div style={{...styles.qtyBox, background: checkedItems[idx] ? '#000' : '#141414'}}>{item.quantity}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex', alignItems:'center', gap: 8, flexWrap: 'wrap'}}>
                  <span style={{...styles.itemName, textDecoration: checkedItems[idx] ? 'line-through' : 'none'}}>{item.name}</span>
                  {forceParcelMode ? (
                      <div style={styles.parcelBadge}><Package size={10} /> PARCEL</div>
                  ) : (
                      <div style={styles.dineBadge}><UtensilsCrossed size={10} /> DINE-IN</div>
                  )}
                </div>
                <span style={{...styles.portion, color: item.portion?.toLowerCase() === 'half' ? '#d3bfa2' : '#555'}}>
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
          );
        })}
      </div>

      <button 
        style={{...styles.doneBtn, background: urgencyTier === 'high' ? '#d3bfa2' : 'transparent', color: urgencyTier === 'high' ? '#000' : '#d3bfa2', borderColor: '#d3bfa2'}} 
        onClick={() => onReady(order._id)}
      >
        {urgencyTier === 'high' ? "PRIORITY READY" : "COMPLETE TICKET"}
      </button>
    </motion.div>
  );
};

const styles = {
  // 🚀 FIXED: Modified outer padding layout definitions to maximize space and stretch edge-to-edge
  kdsContainer: { width: '100vw', height: '100vh', padding: '20px', background: '#050505', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  hudHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a', padding: '16px 30px', borderRadius: '16px', border: '1px solid #141414', zIndex: 10, flexShrink: 0 },
  brandCluster: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoBadge: { background: '#000', padding: '10px', borderRadius: '12px', border: '1px solid #1c1c1c' },
  mainTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.5px', fontFamily: "'Outfit', sans-serif" },
  statusLine: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
  goldPulseDot: { width: '6px', height: '6px', background: '#d3bfa2', borderRadius: '50%', boxShadow: '0 0 8px #d3bfa2' },
  subTitle: { color: '#444', margin: 0, fontSize: '0.6rem', letterSpacing: '2px', fontWeight: 800 },
  actionCenter: { display: 'flex', alignItems: 'center', gap: '15px' },
  utilityBtn: { background: '#111', border: '1px solid #1a1a1a', color: '#fff', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700 },
  headerStats: { background: '#111', padding: '6px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #1a1a1a' },
  statValue: { color: '#fff', fontSize: '1.3rem', fontWeight: 900, fontFamily: 'JetBrains Mono' },
  statLabel: { color: '#d3bfa2', fontSize: '#0.55rem', fontWeight: 900, marginLeft: '5px' },
  divider: { width: '1px', height: '24px', background: '#1c1c1c' },
  timeBox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#d3bfa2' },
  stationCapsule: { display: 'flex', background: '#000', padding: '3px', borderRadius: '10px', border: '1px solid #151515' },
  capsuleBtn: { padding: '8px 14px', background: 'transparent', border: 'none', color: '#444', fontSize: '#0.65rem', fontWeight: '900', cursor: 'pointer', borderRadius: '8px' },
  activeCapsuleBtn: { padding: '8px 14px', background: 'rgba(211,191,162,0.06)', border: 'none', color: '#d3bfa2', fontSize: '#0.65rem', fontWeight: '900', borderRadius: '8px' },

  /* 👑 STABLE FLUID WIDESCREEN FLEX CONTAINER STRIPS (REMOVES ALL WHITE GAPS OVER LARGE DISPLAYS) */
  layoutBodyWrapper: { display: 'flex', flex: 1, gap: '25px', marginTop: '25px', overflow: 'hidden', width: '100%', alignItems: 'stretch', height: 'calc(100vh - 140px)' },
  
  /* 🚀 OBSIDIAN SIDEBAR DESIGN MAPPED COMPLYING EXCLUSIVELY TO MONOCHROMATIC TONES */
  leftCategorySidebar: { width: '275px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: '16px', display: 'flex', flexDirection: 'column', padding: '20px 15px', boxSizing: 'border-box', flexShrink: 0, height: '100%' },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '900', color: '#444', letterSpacing: '1.5px', marginBottom: '20px', borderBottom: '1px solid #121212', paddingBottom: '12px' },
  sidebarMenuStack: { display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '2px' },
  sidebarNode: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#080808', border: '1px solid #121212', color: '#555', width: '100%', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', transition: 'all 0.15s' },
  activeSidebarNode: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'linear-gradient(135deg, #bda88a, #d3bfa2)', border: '1px solid #d3bfa2', color: '#000', width: '100%', textAlign: 'left', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900' },
  categoryCountBadge: { fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', fontWeight: '900' },

  workspace: { flex: 1, overflowY: 'auto', paddingRight: '4px', height: '100%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px', alignContent: 'flex-start' },
  aggregateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', alignContent: 'flex-start' },
  aggregateCard: { background: '#0a0a0a', padding: '30px 15px', borderRadius: '16px', border: '1px solid #141414', textAlign: 'center' },
  aggregateQty: { fontSize: '3.5rem', fontWeight: 900, color: '#d3bfa2', fontFamily: 'JetBrains Mono', lineHeight: 1 },
  aggregateName: { fontSize: '0.75rem', letterSpacing: '0.5px', color: '#444', marginTop: '12px', fontWeight: 800 },
  
  card: { borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', height: '420px', border: '1px solid #141414', position: 'relative', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  tableNum: { fontSize: '2.2rem', margin: 0, fontWeight: 900, fontFamily: "'Outfit', sans-serif" },
  ticketId: { fontSize: '0.62rem', color: '#333', fontWeight: 800 },
  timerBadge: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 900, padding: '4px 10px', borderRadius: '8px', background: '#000', border: '1px solid' },
  itemList: { flex: 1, overflowY: 'auto' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #121212', cursor: 'pointer' },
  qtyBox: { width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', fontWeight: 900, fontSize: '1rem', color: '#d3bfa2', fontFamily: 'JetBrains Mono' },
  itemName: { fontSize: '0.95rem', fontWeight: 700, color: '#eee' },
  portion: { fontSize: '0.62rem', fontWeight: 900, marginTop: '2px', display: 'block' },
  parcelBadge: { background: 'rgba(211, 191, 162, 0.05)', color: '#d3bfa2', fontSize: '0.52rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(211, 191, 162, 0.15)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 },
  dineBadge: { background: 'rgba(255, 255, 255, 0.02)', color: '#777', fontSize: '0.52rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #161616', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 },
  note: { color: '#8a704d', fontSize: '0.68rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(211, 191, 162, 0.05)', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(211, 191, 162, 0.08)' },
  doneBtn: { width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  waiterLayer: { position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '15px' },
  callStrip: { background: '#d3bfa2', color: '#000', padding: '16px 28px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.9rem', fontWeight: 900, boxShadow: '0 15px 40px rgba(0,0,0,0.6)' },
  callIconBox: { background: 'rgba(0,0,0,0.08)', padding: '8px', borderRadius: '8px' }
};

export default KitchenView;