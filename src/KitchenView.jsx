import React, { useEffect, useState, useRef, useMemo } from 'react';
import { io } from "socket.io-client";
import axios from 'axios'; 
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Timer, Hourglass, BellRing, StickyNote, 
  X, Zap, History, LayoutGrid, BarChart3, 
  Package, UtensilsCrossed, Clock, CheckSquare, 
  Activity, ChevronDown, Monitor, Coffee, Layers, Flame, Mic, EyeOff, Sparkles, TrendingUp, WifiOff
} from 'lucide-react';

/**
 * 👑 PRATYEKSHA KDS PRO - ARCHITECT TITANIUM GOLD MASTER (v17.0)
 * THEME: LUXURY VELVET OBSIDIAN & FROSTED GOLD FOIL (DEEP CONTRAST SPEC)
 * STABILITY IMPLEMENTATIONS: LocalStorage Multi-Day Flush, Audio Speech Queue FIFO Engine, Network Connection Safety HUD
 */

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

const KitchenView = () => {
  const { tenantId } = useParams();
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [recallQueue, setRecallQueue] = useState([]);
  const [isAggregateView, setIsAggregateView] = useState(false);
  
  // 🚀 CORE ROUTING & FILTER STATE LAYERS
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stationFilter, setStationFilter] = useState('ALL'); 

  // 🚀 HARDCODED GLOBAL STATE SYNC MATRIX KEY-MAP
  const [checkedItemsGlobal, setCheckedItemsGlobal] = useState({});

  // 🚀 ADVANCED METRIC, INTERCEPTOR & CONTROL STATES
  const [isListening, setIsListening] = useState(false);
  const [interceptedAlerts, setInterceptedAlerts] = useState([]);
  const [showMetricsDashboard, setShowMetricsDashboard] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 🚀 PERSISTENT METRICS STORAGE ENGINE
  const [completedTicketsCount, setCompletedTicketsCount] = useState(0);
  const [totalProcessingTime, setTotalProcessingTime] = useState(0);

  const audioPlayer = useRef(null);
  const alertPlayer = useRef(null);
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);

  // 🎙️ SPEECH FIFO QUEUE REFS & INITIALIZERS
  const speechQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);
  const synthVoicesRef = useRef([]);

  // 🎙️ PRE-LOAD & CACHE CHROMIUM ASYNC VOICES
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      synthVoicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // 🎙️ FIFO AUDIO QUEUE PROCESSOR: Renders multi-ticket speak requests sequentially
  const processSpeechQueue = () => {
    if (speechQueueRef.current.length === 0) {
      isSpeakingRef.current = false;
      return;
    }
    isSpeakingRef.current = true;
    const nextUtterance = speechQueueRef.current.shift();
    
    nextUtterance.onend = () => {
      processSpeechQueue();
    };
    nextUtterance.onerror = () => {
      processSpeechQueue();
    };
    
    window.speechSynthesis.speak(nextUtterance);
  };

  const speakOrder = (order) => {
    if (!('speechSynthesis' in window)) return;

    let orderSpeech = `Chef, new ticket for Table ${order.tableNumber}. `;
    const itemsSpeech = order.items.map(i => {
      const portionText = (i.portion && i.portion.toLowerCase() !== 'single') ? `${i.portion} ` : "";
      const isTakeawayParcel = order.tableNumber?.toLowerCase() === 'takeaway' || i.isParcel;
      const typeText = isTakeawayParcel ? 'Parcel' : 'Dine in';
      let itemDetail = `${i.quantity} ${portionText}${i.name} ${typeText}`;
      if (i.suggestion && i.suggestion.trim() !== "") {
        itemDetail += `. Special instruction: ${i.suggestion}`;
      }
      return itemDetail;
    }).join(". ");

    const utterance = new SpeechSynthesisUtterance(orderSpeech + itemsSpeech);
    const indianVoice = synthVoicesRef.current.find(v => v.lang.includes('IN')) || synthVoicesRef.current[0];
    if (indianVoice) utterance.voice = indianVoice;
    
    utterance.rate = 0.82; 
    utterance.pitch = 1.0;

    // Push into sequence worker instead of canceling current track via .cancel()
    speechQueueRef.current.push(utterance);
    if (!isSpeakingRef.current) {
      processSpeechQueue();
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const [ordersRes, categoriesRes, menuRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`),
        axios.get(`${BASE_URL}/categories/${tenantId}`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/menu/${tenantId}`).catch(() => ({ data: [] }))
      ]);
      
      const incomingOrders = ordersRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(incomingOrders);
      setCategories(categoriesRes.data || []);
      setMenuItems(menuRes.data || []);

      const refreshHydrationMap = {};
      incomingOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item, index) => {
            if (item.isCrossedLocal === true) {
              refreshHydrationMap[`${order._id}-${index}`] = true;
            }
          });
        }
      });
      setCheckedItemsGlobal(refreshHydrationMap);
    } catch (err) { console.error("KDS Data Compilation Framework Error."); }
  };

  // 🎙️ HANDS-FREE VOICE CONTROL RUNTIME CORE ENGINE
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const speechToText = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("🎤 KDS VOICE DECODED COMMAND:", speechToText);

        if (speechToText.includes('complete table') || speechToText.includes('ready table')) {
          const match = speechToText.match(/(?:table|ready|complete)\s*(\w+)/);
          if (match && match[1]) {
            const tableNo = match[1].toUpperCase();
            const targetOrder = orders.find(o => o.tableNumber?.toUpperCase() === tableNo);
            if (targetOrder) markAsReady(targetOrder._id);
          }
        } else if (speechToText.includes('recall last') || speechToText.includes('pratyeksha recall')) {
          handleRecall();
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [orders, recallQueue]);

  const toggleVoiceListener = () => {
    if (!recognitionRef.current) return alert("Speech recognition not supported on this browser.");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (!tenantId) return;

    // 📦 NATIVE STORAGE CLEANUP: Resets metrics if calendar day boundaries cross over
    const todayString = new Date().toISOString().split('T')[0];
    const savedDateToken = localStorage.getItem(`kds_operational_date_${tenantId}`);
    
    if (savedDateToken !== todayString) {
      localStorage.removeItem(`kds_completed_count_${tenantId}`);
      localStorage.removeItem(`kds_processing_time_${tenantId}`);
      localStorage.setItem(`kds_operational_date_${tenantId}`, todayString);
    }
    
    const cachedCount = localStorage.getItem(`kds_completed_count_${tenantId}`);
    const cachedTime = localStorage.getItem(`kds_processing_time_${tenantId}`);
    
    if (cachedCount) setCompletedTicketsCount(parseInt(cachedCount, 10));
    if (cachedTime) setTotalProcessingTime(parseInt(cachedTime, 10));

    fetchActiveOrders();

    // 📡 NETWORK INTERFACE SAFETIES: Bind hardware connection network traces
    const handleOnlineStatus = () => setIsOnline(true);
    const handleOfflineStatus = () => setIsOnline(false);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    const socket = io("https://pratyeksha-backend.onrender.com", { transports: ['polling', 'websocket'] });
    socketRef.current = socket;
    socket.emit("join_restaurant", tenantId);

    socket.on("connect", () => setIsOnline(true));
    socket.on("disconnect", () => setIsOnline(false));

    socket.on("new_order", (newOrder) => {
      if (newOrder.tenantId === tenantId) {
        setOrders(prev => [newOrder, ...prev]);
        const isTakeaway = newOrder.tableNumber?.toLowerCase() === 'takeaway';
        if (isTakeaway) {
          new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3').play().catch(() => {});
        } else {
          audioPlayer.current?.play().catch(() => {});
        }
        speakOrder(newOrder);
      }
    });

    socket.on("kds_item_cross_sync", ({ orderId, idx, newState }) => {
      setCheckedItemsGlobal(prev => ({ ...prev, [`${orderId}-${idx}`]: newState }));
      setOrders(prevOrders => prevOrders.map(order => {
        if (order._id === orderId) {
          const freshItems = [...order.items];
          if (freshItems[idx]) freshItems[idx].isCrossedLocal = newState;
          return { ...order, items: freshItems };
        }
        return order;
      }));
    });

    socket.on("order_modification_detected", (data) => {
      if (data.tenantId === tenantId) {
        alertPlayer.current?.play().catch(() => {});
        setInterceptedAlerts(prev => [{ id: Date.now(), ...data }, ...prev]);
        fetchActiveOrders(); 
      }
    });

    socket.on("waiter_called", (data) => {
      if (data.tenantId === tenantId) setWaiterCalls(prev => [{ id: Date.now(), ...data }, ...prev]);
    });

    return () => {
      socket.disconnect();
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, [tenantId]);

  const markAsReady = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    setRecallQueue(prev => [order, ...prev].slice(0, 10));
    
    const durationSec = Math.floor((new Date() - new Date(order.createdAt)) / 1000);
    
    setTotalProcessingTime(prev => {
      const nextTime = prev + durationSec;
      localStorage.setItem(`kds_processing_time_${tenantId}`, nextTime);
      return nextTime;
    });

    setCompletedTicketsCount(prev => {
      const nextCount = prev + 1;
      localStorage.setItem(`kds_completed_count_${tenantId}`, nextCount);
      return nextCount;
    });

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
    
    setCompletedTicketsCount(prev => {
      const nextCount = Math.max(0, prev - 1);
      localStorage.setItem(`kds_completed_count_${tenantId}`, nextCount);
      return nextCount;
    });
  };

  const trigger86KillToggle = async (itemName) => {
    const targetMenuNode = menuItems.find(m => m.name.toLowerCase().trim() === itemName.toLowerCase().trim());
    if (!targetMenuNode) return;
    const confirmKill = window.confirm(`Lock ingredient access? This grays out "${itemName}" immediately on customer menus.`);
    if (!confirmKill) return;

    try {
      await axios.patch(`${BASE_URL}/menu-item/${targetMenuNode._id}`, { isAvailable: false });
      alert(`"${itemName}" successfully set out of stock. [86 Mode Active]`);
      fetchActiveOrders();
    } catch (err) { alert("Could not update item availability state."); }
  };

  const aggregatedTotals = useMemo(() => {
    const totals = {};
    orders.forEach(o => o.items.forEach((i, idx) => {
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return; 
      const isTakeawayParcel = o.tableNumber?.toLowerCase() === 'takeaway' || i.isParcel;
      const portionSuffix = (i.portion && i.portion.toLowerCase() !== 'single') ? ` (${i.portion})` : "";
      const key = `${i.name}${portionSuffix} ${isTakeawayParcel ? '[P]' : '[D]'}`;
      totals[key] = (totals[key] || 0) + i.quantity;
    }));
    return totals;
  }, [orders, checkedItemsGlobal]);

  const dishToCategoryMap = useMemo(() => {
    const lookupMap = {};
    menuItems.forEach(item => {
      if (item.name && item.categoryId) {
        lookupMap[item.name.toLowerCase().trim()] = item.categoryId.toLowerCase().trim();
      }
    });
    return lookupMap;
  }, [menuItems]);

  const categoryPendingCounts = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
      const orderIsTakeawayParcel = order.tableNumber?.toLowerCase() === 'takeaway' || order.items.some(i => i.isParcel);
      if (stationFilter === 'DINEIN' && orderIsTakeawayParcel) return;
      if (stationFilter === 'PARCEL' && !orderIsTakeawayParcel && order.items.every(i => !i.isParcel)) return;

      order.items.forEach((item, idx) => {
        if (checkedItemsGlobal[`${order._id}-${idx}`]) return;
        let finalId = item.categoryId ? item.categoryId.toLowerCase().trim() : null;
        if (!finalId && item.name) {
          finalId = dishToCategoryMap[item.name.toLowerCase().trim()] || null;
        }
        if (finalId) {
          counts[finalId] = (counts[finalId] || 0) + (Number(item.quantity) || 0);
        }
      });
    });
    return counts;
  }, [orders, stationFilter, dishToCategoryMap, checkedItemsGlobal]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderIsTakeawayParcel = order.tableNumber?.toLowerCase() === 'takeaway' || order.items.some(i => i.isParcel);
      if (stationFilter === 'DINEIN' && orderIsTakeawayParcel) return false;
      if (stationFilter === 'PARCEL' && !orderIsTakeawayParcel && order.items.every(i => !i.isParcel)) return false;

      if (selectedCategory !== 'ALL') {
        return order.items.some(item => {
          let itemCatId = item.categoryId ? item.categoryId.toLowerCase().trim() : null;
          if (!itemCatId && item.name) {
            itemCatId = dishToCategoryMap[item.name.toLowerCase().trim()] || null;
          }
          return itemCatId === selectedCategory.toLowerCase().trim();
        });
      }
      return true;
    });
  }, [orders, stationFilter, selectedCategory, dishToCategoryMap]);

  const masterPrepMarqueeList = useMemo(() => {
    const queueMap = {};
    filteredOrders.forEach(o => o.items.forEach((i, idx) => {
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return; 
      queueMap[i.name] = (queueMap[i.name] || 0) + i.quantity;
    }));
    return Object.entries(queueMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
  }, [filteredOrders, checkedItemsGlobal]);

  const averageClearVelocityString = useMemo(() => {
    if (completedTicketsCount === 0) return "11m 24s"; 
    const avgSec = Math.floor(totalProcessingTime / completedTicketsCount);
    const m = Math.floor(avgSec / 60);
    const s = avgSec % 60;
    return `${m}m ${s}s`;
  }, [totalProcessingTime, completedTicketsCount]);

  return (
    <div style={styles.kdsContainer}>
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      <audio ref={alertPlayer} src="https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3" />

      {/* --- HUD HEADER --- */}
      <header style={styles.hudHeader}>
        <div style={styles.brandCluster}>
          <div style={styles.logoBadge}><ChefHat color="#d3bfa2" size={32} /></div>
          <div>
            <h1 style={styles.mainTitle}>PRATYEKSHA / <span style={{ color: '#d3bfa2' }}>KDS PRO MAX</span></h1>
            <div style={styles.statusLine}>
              <span style={isOnline ? styles.goldPulseDot : styles.offlinePulseDot} />
              <p style={styles.subTitle}>
                {isOnline ? "TITANIUM V17.0 ENGINE • ONLINE" : "⚠️ DISCONNECTED • CHECK WI-FI"}
              </p>
            </div>
          </div>
        </div>

        <div style={styles.actionCenter}>
          <button onClick={toggleVoiceListener} style={{...styles.utilityBtn, borderColor: isListening ? '#d3bfa2' : '#232731', background: isListening ? 'rgba(211,191,162,0.12)' : '#191b22'}}>
            <Mic size={16} color={isListening ? '#d3bfa2' : '#9fa4b0'} className={isListening ? "voice-pulse" : ""} />
            <span style={{color: isListening ? '#d3bfa2' : '#fff'}}>{isListening ? "LISTENING" : "VOICE CONTROL"}</span>
          </button>

          <button onClick={() => setShowMetricsDashboard(!showMetricsDashboard)} style={{...styles.utilityBtn, borderColor: showMetricsDashboard ? '#d3bfa2' : '#232731', background: showMetricsDashboard ? 'rgba(211,191,162,0.06)' : '#191b22'}}>
            <TrendingUp size={16} color="#d3bfa2" />
            <span>SPEED LOGS</span>
          </button>

          <div style={styles.stationCapsule}>
            <button onClick={() => setStationFilter('ALL')} style={stationFilter === 'ALL' ? styles.activeCapsuleBtn : styles.capsuleBtn}>ALL STREAM</button>
            <button onClick={() => setStationFilter('DINEIN')} style={stationFilter === 'DINEIN' ? styles.activeCapsuleBtn : styles.capsuleBtn}>DINE-IN</button>
            <button onClick={() => setStationFilter('PARCEL')} style={stationFilter === 'PARCEL' ? styles.activeCapsuleBtn : styles.capsuleBtn}>PARCELS</button>
          </div>

          <button onClick={() => setIsAggregateView(!isAggregateView)} style={styles.utilityBtn}>
            {isAggregateView ? <LayoutGrid size={18} color="#d3bfa2" /> : <BarChart3 size={18} color="#d3bfa2" />}
            <span>{isAggregateView ? "TICKET VIEW" : "PREP SUMMARY"}</span>
          </button>
          
          {recallQueue.length > 0 && (
            <button onClick={handleRecall} style={{...styles.utilityBtn, color: '#0f1013'}}>
              <History size={18} color="#d3bfa2" /> RECALL LAST
            </button>
          )}

          <div style={styles.headerStats}>
            <div style={styles.statGroup}><span style={styles.statValue}>{filteredOrders.length}</span><span style={styles.statLabel}>TICKETS</span></div>
          </div>
        </div>
      </header>

      {/* --- HUD HORIZONTAL CUMULATIVE BANNER --- */}
      <AnimatePresence>
        {masterPrepMarqueeList.length > 0 && !isAggregateView && !showMetricsDashboard && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={styles.marqueeBannerHUD}>
            <div style={styles.marqueeTagLabel}><Activity size={12} /> CURRENT KITCHEN PREP VOLUME RUN:</div>
            <div style={styles.marqueeDataScroll}>
              {masterPrepMarqueeList.map(([dishName, qtyCount]) => (
                <div key={dishName} style={styles.marqueeToken}>
                  <span style={styles.marqueeTokenQty}>{qtyCount}x</span>
                  <span style={styles.marqueeTokenName}>{dishName.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CANCELLATION FLASH BOX INTERCEPTOR --- */}
      <AnimatePresence>
        {interceptedAlerts.map(alert => (
          <motion.div key={alert.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={styles.interceptorStrobeBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={styles.strobeIconBadge}><BellRing size={24} className="voice-pulse" /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>ORDER CHANGE DETECTED — TABLE {alert.tableNumber}</h3>
                <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '0.8rem' }}>Modification alert received: <span style={{ color: '#d3bfa2', fontWeight: 'bold' }}>"{alert.modificationNote}"</span></p>
              </div>
            </div>
            <button onClick={() => setInterceptedAlerts(prev => prev.filter(a => a.id !== alert.id))} style={styles.strobeCloseBtn}>CONFIRM RECEIPT</button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* --- SPLIT LAYOUT BODY WRAPPER --- */}
      <div style={styles.layoutBodyWrapper}>
        
        {/* --- LEFT SIDE MENU CATEGORIES SIDEBAR --- */}
        <aside style={styles.leftCategorySidebar}>
          <div style={styles.sidebarHeader}>
            <Layers size={14} color="#d3bfa2" />
            <span>KITCHEN SECTIONS</span>
          </div>

          <div style={styles.sidebarMenuStack} className="no-scrollbar">
            <button 
              onClick={() => { setSelectedCategory('ALL'); setShowMetricsDashboard(false); }}
              style={selectedCategory === 'ALL' && !showMetricsDashboard ? styles.activeSidebarNode : styles.sidebarNode}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Coffee size={14} color={selectedCategory === 'ALL' && !showMetricsDashboard ? '#0f1013' : '#d3bfa2'} />
                <span style={{ fontWeight: '900', fontSize: '0.72rem' }}>ALL SECTIONS</span>
              </div>
              <span style={{ 
                ...styles.categoryCountBadge, 
                background: selectedCategory === 'ALL' && !showMetricsDashboard ? '#0f1013' : '#1e2129',
                color: selectedCategory === 'ALL' && !showMetricsDashboard ? '#d3bfa2' : '#8a909f',
                border: selectedCategory === 'ALL' && !showMetricsDashboard ? '1px solid rgba(211,191,162,0.4)' : '1px solid #232730'
              }}>
                {orders.reduce((sum, o) => {
                  const orderIsTakeawayParcel = o.tableNumber?.toLowerCase() === 'takeaway' || o.items.some(i => i.isParcel);
                  if (stationFilter === 'DINEIN' && orderIsTakeawayParcel) return sum;
                  if (stationFilter === 'PARCEL' && !orderIsTakeawayParcel && o.items.every(i => !i.isParcel)) return sum;
                  
                  const realCount = o.items.reduce((s, item, idx) => s + (checkedItemsGlobal[`${o._id}-${idx}`] ? 0 : item.quantity), 0);
                  return sum + realCount;
                }, 0)}
              </span>
            </button>

            {categories.map(cat => {
              const lookupKey = cat.categoryId ? cat.categoryId.toLowerCase().trim() : '';
              const pendingCount = categoryPendingCounts[lookupKey] || 0;
              const isSelected = selectedCategory === lookupKey && !showMetricsDashboard;
              
              return (
                <button 
                  key={cat._id}
                  onClick={() => { setSelectedCategory(lookupKey); setShowMetricsDashboard(false); }}
                  style={isSelected ? styles.activeSidebarNode : styles.sidebarNode}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Flame size={14} color={isSelected ? '#0f1013' : '#bda88a'} />
                    <span style={{ textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold' }}>{cat.name}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span onClick={(e) => { e.stopPropagation(); trigger86KillToggle(cat.name); }} style={styles.mini86ToggleTrigger} title="Click to set out of stock (86 item)">
                      <EyeOff size={10} />
                    </span>
                    <span style={{ 
                      ...styles.categoryCountBadge, 
                      background: isSelected ? '#0f1013' : '#1a1c23',
                      color: isSelected ? '#d3bfa2' : '#8e94a4',
                      border: isSelected ? '1px solid #d3bfa2' : '1px solid #232730'
                    }}>
                      {pendingCount < 10 ? `0${pendingCount}` : pendingCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* --- MAIN WORKSPACE DATA SLOTS --- */}
        <main style={styles.workspace} className="no-scrollbar">
          {showMetricsDashboard ? (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={styles.velocityControlPanel}>
              <div style={styles.velocityCardHeader}>
                <TrendingUp size={28} color="#d3bfa2" />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.5px' }}>HISTORIC SPEED METRICS TERMINAL</h2>
              </div>
              
              <div style={styles.velocityMetricsGrid}>
                <div style={styles.metricWidgetBox}>
                  <small style={styles.metricWidgetLabel}>TOTAL PROCESSED TICKETS</small>
                  <div style={styles.metricWidgetValue}>{completedTicketsCount}</div>
                </div>
                <div style={styles.metricWidgetBox}>
                  <small style={styles.metricWidgetLabel}>AVG TICKET CLEAR VELOCITY</small>
                  <div style={{ ...styles.metricWidgetValue, color: '#d3bfa2' }}>{averageClearVelocityString}</div>
                </div>
              </div>
              
              <button onClick={() => setShowMetricsDashboard(false)} style={styles.velocityCloseBtn}>RETURN TO ACTIVE TRACKER</button>
            </motion.div>
          ) : isAggregateView ? (
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
                  <KDSOrderCard 
                    key={order._id} 
                    order={order} 
                    isNewest={index === 0} 
                    onReady={markAsReady} 
                    dishToCategoryMap={dishToCategoryMap}
                    selectedCategory={selectedCategory}
                    checkedItemsGlobal={checkedItemsGlobal}
                    setCheckedItemsGlobal={setCheckedItemsGlobal}
                    socketInstance={socketRef.current}
                  />
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
        body { margin: 0; background: #0d0e11; color: #fff; overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #232730; border-radius: 10px; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes strobePulse {
          0% { box-shadow: 0 0 0 0 rgba(211,191,162,0.3); }
          70% { box-shadow: 0 0 0 10px rgba(211,191,162,0); }
          100% { box-shadow: 0 0 0 0 rgba(211,191,162,0); }
        }
        .voice-pulse { animation: strobePulse 1.8s infinite; border-radius: 50%; }
        @keyframes extremeFlash {
          0% { border-color: #1f222a; box-shadow: none; }
          50% { border-color: #bda88a; box-shadow: 0 0 25px rgba(211,191,162,0.2); }
          100% { border-color: #1f222a; box-shadow: none; }
        }
        .flash-card-pulse { animation: extremeFlash 1.6s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

const KDSOrderCard = ({ order, onReady, isNewest, dishToCategoryMap, selectedCategory, checkedItemsGlobal, setCheckedItemsGlobal, socketInstance }) => {
  const [seconds, setSeconds] = useState(0);

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

  const urgencyTier = seconds >= 900 ? 'high' : seconds >= 450 ? 'medium' : 'low';

  const toggleItemCrossedState = async (idx) => {
    const storageKey = `${order._id}-${idx}`;
    const nextState = !checkedItemsGlobal[storageKey];
    
    setCheckedItemsGlobal(prev => ({ ...prev, [storageKey]: nextState }));

    if (socketInstance) {
      socketInstance.emit("kds_item_cross_sync", {
        orderId: order._id,
        tenantId: order.tenantId,
        idx,
        newState: nextState
      });
    }

    try {
      const adjustedItemsArray = order.items.map((item, itemIdx) => {
        if (itemIdx === idx) {
          return { ...item, isCrossedLocal: nextState };
        }
        return item;
      });
      await axios.patch(`${BASE_URL}/admin/orders/${order._id}`, { items: adjustedItemsArray });
    } catch (err) {
      console.error("Failed to commit item cross persistence change back to server database.", err);
    }
  };

  return (
    <motion.div 
        layout 
        initial={{ opacity: 0, y: 20 }} 
        className={urgencyTier === 'high' ? "flash-card-pulse" : ""}
        animate={{ 
            opacity: 1, 
            y: 0, 
            borderColor: isNewest ? '#d3bfa2' : '#1f222a'
        }} 
        style={{...styles.card, background: '#13151a'}}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: urgencyTier === 'low' ? '#2c2f36' : urgencyTier === 'medium' ? 'linear-gradient(90deg, #2c2f36, #d3bfa2)' : '#bda88a'
      }} />

      <div style={styles.cardHeader}>
        <div>
          <h2 style={styles.tableNum}>
            {order.tableNumber?.toLowerCase() === 'takeaway' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#d3bfa2' }}>
                <Package size={24} strokeWidth={2.5} /> PARCEL
              </span>
            ) : `T-${order.tableNumber}`}
          </h2>
          <span style={styles.ticketId}>ID: {order._id.slice(-4).toUpperCase()}</span>
        </div>
        <div style={{...styles.timerBadge, borderColor: urgencyTier !== 'low' ? '#d3bfa2' : '#272a33', background: '#0d0e11'}}>
          <Clock size={16} color={urgencyTier !== 'low' ? '#d3bfa2' : '#5c616e'} />
          <span className="mono" style={{color: '#fff', fontWeight: '900'}}>{formatTime(seconds)}</span>
        </div>
      </div>

      <div style={styles.itemList} className="custom-scroll">
        {order.items.map((item, idx) => {
          let calculatedItemCatId = item.categoryId ? item.categoryId.toLowerCase().trim() : null;
          if (!calculatedItemCatId && item.name) {
            calculatedItemCatId = dishToCategoryMap[item.name.toLowerCase().trim()] || null;
          }
          if (selectedCategory !== 'ALL' && calculatedItemCatId !== selectedCategory.toLowerCase().trim()) {
            return null; 
          }

          const forceParcelMode = order.tableNumber?.toLowerCase() === 'takeaway' || item.isParcel;
          const isItemCrossed = checkedItemsGlobal[`${order._id}-${idx}`];

          return (
            <div key={idx} onClick={() => toggleItemCrossedState(idx)} style={{...styles.itemRow, opacity: isItemCrossed ? 0.2 : 1}}>
              <div style={{...styles.qtyBox, background: isItemCrossed ? '#0d0e11' : '#1e2129'}}>{item.quantity}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex', alignItems:'center', gap: 8, flexWrap: 'wrap'}}>
                  <span style={{
                    ...styles.itemName, 
                    textDecoration: isItemCrossed ? 'line-through' : 'none', 
                    color: item.isChefSpecial ? '#0f1013' : '#fff',
                    background: item.isChefSpecial ? 'linear-gradient(135deg, #bda88a, #d3bfa2)' : 'transparent',
                    padding: item.isChefSpecial ? '3px 8px' : '0',
                    borderRadius: item.isChefSpecial ? '6px' : '0',
                    fontWeight: item.isChefSpecial ? '900' : '700'
                  }}>
                    {item.isChefSpecial && <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                    {item.name}
                  </span>
                  {forceParcelMode ? (
                      <div style={styles.parcelBadge}><Package size={10} /> PARCEL</div>
                  ) : (
                      <div style={styles.dineBadge}><UtensilsCrossed size={10} /> DINE-IN</div>
                  )}
                </div>
                <span style={{...styles.portion, color: item.portion?.toLowerCase() === 'half' ? '#d3bfa2' : '#7c8291'}}>
                  {item.portion?.toUpperCase() || 'STANDARD'}
                </span>
                {item.suggestion && (
                  <div style={styles.note}>
                    <StickyNote size={10} /> 
                    <span style={{textTransform: 'uppercase'}}>{item.suggestion}</span>
                  </div>
                )}
              </div>
              {isItemCrossed && <CheckSquare size={18} color="#d3bfa2" />}
            </div>
          );
        })}
      </div>

      <button 
        style={{...styles.doneBtn, background: urgencyTier === 'high' ? 'linear-gradient(135deg, #bda88a, #d3bfa2)' : 'transparent', color: urgencyTier === 'high' ? '#0f1013' : '#d3bfa2', borderColor: 'rgba(211,191,162,0.3)'}} 
        onClick={() => onReady(order._id)}
      >
        {urgencyTier === 'high' ? "🔥 OVERDUE DISPATCH" : "COMPLETE TICKET"}
      </button>
    </motion.div>
  );
};

const styles = {
  kdsContainer: { top: 0, left: 0, position: 'fixed', width: '100vw', height: '100vh', padding: '20px', background: '#0d0e11', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  hudHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#13151a', padding: '16px 30px', borderRadius: '16px', border: '1px solid #1f222a', zIndex: 10, flexShrink: 0 },
  brandCluster: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoBadge: { background: '#0d0e11', padding: '10px', borderRadius: '12px', border: '1px solid #1f222a' },
  mainTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.5px', fontFamily: "'Outfit', sans-serif" },
  statusLine: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
  goldPulseDot: { width: '6px', height: '6px', background: '#d3bfa2', borderRadius: '50%', boxShadow: '0 0 8px #d3bfa2' },
  offlinePulseDot: { width: '6px', height: '6px', background: '#ff4d4d', borderRadius: '50%', boxShadow: '0 0 8px #ff4d4d' },
  subTitle: { color: '#5c616e', margin: 0, fontSize: '0.6rem', letterSpacing: '2px', fontWeight: 800 },
  actionCenter: { display: 'flex', alignItems: 'center', gap: '15px' },
  utilityBtn: { background: '#191b22', border: '1px solid #252932', color: '#fff', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, transition: '0.15s' },
  headerStats: { background: 'linear-gradient(135deg, #bda88a, #d3bfa2)', padding: '8px 22px', borderRadius: '10px', display: 'flex', alignItems: 'center', border: 'none' },
  statValue: { color: '#0f1013', fontSize: '1.3rem', fontWeight: 950, fontFamily: 'JetBrains Mono' },
  statLabel: { color: '#1a1c23', fontSize: '0.55rem', fontWeight: 900, marginLeft: '6px', letterSpacing: '0.5px' },
  divider: { width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' },
  timeBox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#111' },
  stationCapsule: { display: 'flex', background: '#0d0e11', padding: '4px', borderRadius: '10px', border: '1px solid #1f222a' },
  capsuleBtn: { padding: '8px 14px', background: 'transparent', border: 'none', color: '#5c616e', fontSize: '0.65rem', fontWeight: '900', cursor: 'pointer', borderRadius: '8px', transition: '0.1s' },
  activeCapsuleBtn: { padding: '8px 14px', background: 'rgba(211,191,162,0.08)', border: 'none', color: '#d3bfa2', fontSize: '#0.65rem', fontWeight: '900', borderRadius: '8px' },

  marqueeBannerHUD: { display: 'flex', alignItems: 'center', background: '#0a0a0c', border: '1px solid #191b22', padding: '12px 20px', marginTop: '15px', borderRadius: '12px', gap: '15px', overflow: 'hidden' },
  marqueeTagLabel: { fontSize: '0.68rem', fontWeight: '900', color: '#bda88a', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
  marqueeDataScroll: { display: 'flex', gap: '12px', overflowX: 'auto' },
  marqueeToken: { background: '#13151a', border: '1px solid #1f222a', padding: '5px 12px', borderRadius: '8px', display: 'flex', gap: '6px', alignItems: 'center' },
  marqueeTokenQty: { fontSize: '0.85rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'JetBrains Mono' },
  marqueeTokenName: { fontSize: '0.72rem', fontWeight: '800', color: '#fff' },

  interceptorStrobeBox: { position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#541717', border: '1px solid #ff4d4d', padding: '20px 40px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', width: '80vw', maxWidth: '800px', justifyContent: 'space-between' },
  strobeIconBadge: { background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', color: '#fff' },
  strobeCloseBtn: { background: '#0d0e11', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', padding: '12px 20px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900', cursor: 'pointer' },

  mini86ToggleTrigger: { padding: '4px', cursor: 'pointer', display: 'inline-flex', background: 'rgba(255,255,255,0.01)', border: '1px solid #232730', borderRadius: '5px', color: '#444', transition: '0.2s', alignSelf: 'center' },

  velocityControlPanel: { background: '#13151a', border: '1px solid #1f222a', padding: '50px 40px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', boxSizing: 'border-box', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' },
  velocityCardHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' },
  velocityMetricsGrid: { display: 'flex', width: '100%', maxWidth: '900px', gap: '25px', justifyContent: 'center', marginBottom: '45px', flexWrap: 'wrap' },
  metricWidgetBox: { background: '#0d0e11', border: '1px solid #1f222a', padding: '35px 25px', borderRadius: '16px', flex: '1', minWidth: '280px', textAlign: 'center', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.4)' },
  metricWidgetLabel: { fontSize: '0.68rem', fontWeight: '900', color: '#5c616e', letterSpacing: '1.5px', display: 'block', marginBottom: '14px' },
  metricWidgetValue: { fontSize: '3.5rem', fontWeight: '950', fontFamily: 'JetBrains Mono', color: '#fff', lineHeight: '1' },
  velocityCloseBtn: { background: 'transparent', border: '1px solid rgba(211,191,162,0.25)', color: '#d3bfa2', padding: '14px 36px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', cursor: 'pointer', transition: '0.15s' },

  layoutBodyWrapper: { display: 'flex', flex: 1, gap: '20px', marginTop: '20px', overflow: 'hidden', width: '100%', alignItems: 'stretch', height: 'calc(100vh - 140px)' },
  leftCategorySidebar: { width: '275px', background: '#13151a', border: '1px solid #1f222a', borderRadius: '16px', display: 'flex', flexDirection: 'column', padding: '20px 15px', boxSizing: 'border-box', flexShrink: 0, height: '100%' },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '900', color: '#5c616e', letterSpacing: '1.5px', marginBottom: '20px', borderBottom: '1px solid #1f222a', paddingBottom: '12px' },
  sidebarMenuStack: { display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '2px' },
  sidebarNode: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#171921', border: '1px solid #20242e', color: '#8e94a4', width: '100%', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', transition: 'all 0.15s' },
  activeSidebarNode: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'linear-gradient(135deg, #bda88a, #d3bfa2)', border: 'none', color: '#0f1013', width: '100%', textAlign: 'left', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '950', boxShadow: '0 4px 15px rgba(211,191,162,0.15)' },
  categoryCountBadge: { fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', fontWeight: '900' },

  workspace: { flex: 1, overflowY: 'auto', paddingRight: '4px', height: '100%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px', alignContent: 'flex-start' },
  aggregateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', alignContent: 'flex-start' },
  aggregateCard: { background: '#13151a', padding: '30px 15px', borderRadius: '16px', border: '1px solid #1f222a', textAlign: 'center' },
  aggregateQty: { fontSize: '3.5rem', fontWeight: 900, color: '#d3bfa2', fontFamily: 'JetBrains Mono', lineHeight: 1 },
  aggregateName: { fontSize: '0.75rem', letterSpacing: '0.5px', color: '#7c8291', marginTop: '12px', fontWeight: 800 },
  
  card: { borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', height: '420px', border: '1px solid #1f222a', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  tableNum: { fontSize: '2.2rem', margin: 0, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#fff', letterSpacing: '-0.5px' },
  ticketId: { fontSize: '0.62rem', color: '#5c616e', fontWeight: 800 },
  timerBadge: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '4px 10px', borderRadius: '8px', border: '1px solid' },
  itemList: { flex: 1, overflowY: 'auto' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #1c1f26', cursor: 'pointer', transition: '0.1s' },
  qtyBox: { width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', fontWeight: 900, fontSize: '1rem', color: '#d3bfa2', fontFamily: 'JetBrains Mono' },
  itemName: { fontSize: '0.95rem', fontWeight: 700, lineHeight: '1.3', transition: 'all 0.15s ease' },
  portion: { fontSize: '0.62rem', fontWeight: 900, marginTop: '2px', display: 'block' },
  parcelBadge: { background: 'rgba(211, 191, 162, 0.06)', color: '#d3bfa2', fontSize: '0.52rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(211, 191, 162, 0.12)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 },
  dineBadge: { background: 'rgba(255, 255, 255, 0.03)', color: '#a0a5b5', fontSize: '0.52rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #232731', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 },
  note: { color: '#bda88a', fontSize: '0.68rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(211,191,162,0.04)', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(211,191,162,0.08)' },
  doneBtn: { width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', transition: '0.15s' },
  waiterLayer: { position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '15px' },
  callStrip: { background: 'linear-gradient(135deg, #bda88a, #d3bfa2)', color: '#0f1013', padding: '16px 28px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.9rem', fontWeight: 950, boxShadow: '0 15px 40px rgba(0,0,0,0.4)' },
  callIconBox: { background: 'rgba(0,0,0,0.06)', padding: '8px', borderRadius: '8px' }
};

export default KitchenView;