import React, { useEffect, useState, useRef, useMemo,useCallback  } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Timer, Hourglass, BellRing, StickyNote,
  X, Zap, History, LayoutGrid, BarChart3,
  Package, UtensilsCrossed, Clock, CheckSquare,
  Activity, Monitor, Coffee, Layers, Flame, Mic, EyeOff, Sparkles, TrendingUp, WifiOff,
  Menu, ChevronLeft, ChevronRight, AlignJustify,  Trash2, FlameKindling, AlertTriangle, Droplets,
  Scale, RotateCcw, FileText, ChevronDown,
  TrendingDown, BadgeAlert, RefreshCw, IndianRupee,
  Search
 
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

/* ─────────────────────────────────────────────────────────────
   RESPONSIVE BREAKPOINTS
───────────────────────────────────────────────────────────── */
const useWindowSize = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
};

/* ─────────────────────────────────────────────────────────────
   SWIPE HOOK for mobile card navigation
───────────────────────────────────────────────────────────── */
const useSwipe = (onLeft, onRight) => {
  const touchStart = useRef(null);
  return {
    onTouchStart: (e) => { touchStart.current = e.touches[0].clientX; },
    onTouchEnd: (e) => {
      if (touchStart.current === null) return;
      const diff = touchStart.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? onLeft?.() : onRight?.();
      touchStart.current = null;
    }
  };
};

/* ═══════════════════════════════════════════════════════════
   MAIN KITCHEN VIEW
═══════════════════════════════════════════════════════════ */
const KitchenView = () => {
  const { tenantId } = useParams();
  const { w, h } = useWindowSize();

  // Breakpoints — phone < 600, small tablet 600-839, large tablet 840-1199, desktop >= 1200
  const isMobile      = w < 600;
  const isSmallTablet = w >= 600  && w < 840;
  const isLargeTablet = w >= 840  && w < 1200;
  const isTablet      = w >= 600  && w < 1200;
  const isDesktop     = w >= 1200;

  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [recallQueue, setRecallQueue] = useState([]);
  const [isAggregateView, setIsAggregateView] = useState(false);
  const [isNonVegMode, setIsNonVegMode] = useState(false);
  const [tenantOnlyVeg, setTenantOnlyVeg] = useState(true);

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stationFilter, setStationFilter] = useState('ALL');

  const [checkedItemsGlobal, setCheckedItemsGlobal] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [interceptedAlerts, setInterceptedAlerts] = useState([]);
  const [showMetricsDashboard, setShowMetricsDashboard] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);


  // Drawer state — used on both mobile and tablet
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileCardIndex, setMobileCardIndex] = useState(0);

  const [completedTicketsCount, setCompletedTicketsCount] = useState(0);
  const [totalProcessingTime, setTotalProcessingTime] = useState(0);

const [showWastagePanel, setShowWastagePanel]   = useState(false);
const [wastageTab,       setWastageTab]         = useState('log');   // 'log' | 'report'
const [wastageForm,      setWastageForm]        = useState({
  itemName: '', inventoryId: null, quantity: '', unit: 'kg',
  reason: 'Spoiled / Expired', loggedBy: '', notes: ''
});
const [wastageSuggestions,  setWastageSuggestions]  = useState([]);
const [showWastageSuggest,  setShowWastageSuggest]  = useState(false);
const [wastageInventory,    setWastageInventory]     = useState([]);   // full inventory list
const [wastageLog,          setWastageLog]           = useState([]);   // today's DB entries
const [wastageAnalytics,    setWastageAnalytics]     = useState(null); // monthly analytics
const [wastageSaving,       setWastageSaving]        = useState(false);
const [wastageLoading,      setWastageLoading]       = useState(false);

const [itemFinalTimes, setItemFinalTimes] = useState({}); // { idx: seconds }

  const audioPlayer   = useRef(null);
  const alertPlayer   = useRef(null);
  const recognitionRef = useRef(null);
  const socketRef     = useRef(null);
  const speechQueueRef = useRef([]);
  const isSpeakingRef  = useRef(false);
  const synthVoicesRef = useRef([]);

  /* ── dish veg map ── */
  const dishToVegMap = useMemo(() => {
    const map = {};
    menuItems.forEach(item => {
      if (item.name) map[item.name.toLowerCase().trim()] = item.isVeg !== false;
    });
    return map;
  }, [menuItems]);

  /* ── speech ── */
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => { synthVoicesRef.current = window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const processSpeechQueue = () => {
    if (speechQueueRef.current.length === 0) { isSpeakingRef.current = false; return; }
    isSpeakingRef.current = true;
    const next = speechQueueRef.current.shift();
    next.onend = next.onerror = processSpeechQueue;
    window.speechSynthesis.speak(next);
  };

  const speakOrder = (order) => {
    if (!('speechSynthesis' in window)) return;
    let text = `Chef, new ticket for Table ${order.tableNumber}. `;
    text += order.items.map(i => {
      const portion = (i.portion && i.portion.toLowerCase() !== 'single') ? `${i.portion} ` : "";
      const type = (order.tableNumber?.toLowerCase() === 'takeaway' || i.isParcel) ? 'Parcel' : 'Dine in';
      let d = `${i.quantity} ${portion}${i.name} ${type}`;
      if (i.suggestion?.trim()) d += `. Special instruction: ${i.suggestion}`;
      return d;
    }).join(". ");
    const utt = new SpeechSynthesisUtterance(text);
    const voice = synthVoicesRef.current.find(v => v.lang.includes('IN')) || synthVoicesRef.current[0];
    if (voice) utt.voice = voice;
    utt.rate = 0.82; utt.pitch = 1.0;
    speechQueueRef.current.push(utt);
    if (!isSpeakingRef.current) processSpeechQueue();
  };

  /* ── fetch ── */
  const fetchActiveOrders = async () => {
    try {
      const [ordersRes, categoriesRes, menuRes, tenantRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`),
        axios.get(`${BASE_URL}/categories/${tenantId}`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/menu/${tenantId}`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/tenant/${tenantId}`).catch(() => ({ data: null }))
      ]);
      const incoming = ordersRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(incoming);
      setCategories(categoriesRes.data || []);
      setMenuItems(menuRes.data || []);
      if (tenantRes.data?.config?.onlyVeg !== undefined) setTenantOnlyVeg(tenantRes.data.config.onlyVeg);
      const hydrationMap = {};
      incoming.forEach(o => o.items?.forEach((item, idx) => {
        if (item.isCrossedLocal) hydrationMap[`${o._id}-${idx}`] = true;
      }));
      setCheckedItemsGlobal(hydrationMap);
    } catch (err) { console.error("KDS fetch error"); }
  };

  /* ── voice control ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = false; rec.lang = 'mr-IN';
rec.onresult = (e) => {
  const txt = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();

  // ── TABLE COMPLETE — English + Marathi ──
  const isCompleteCmd =
    txt.includes('complete table') ||
    txt.includes('ready table') ||
    txt.includes('टेबल तयार') ||      // Marathi: "table ready"
    txt.includes('तयार टेबल') ||
    txt.includes('पूर्ण टेबल') ||     // Marathi: "complete table"
    txt.includes('आर्डर तयार');       // Marathi: "order ready"

  if (isCompleteCmd) {
    // Extract table number — handle English digits and Marathi words
    const marathiNums = {
      'एक':1,'दोन':2,'तीन':3,'चार':4,'पाच':5,
      'सहा':6,'सात':7,'आठ':8,'नऊ':9,'दहा':10,
      'अकरा':11,'बारा':12,'तेरा':13,'चौदा':14,'पंधरा':15
    };
    let tableNum = null;
    // Check Marathi number words
    Object.entries(marathiNums).forEach(([word, num]) => {
      if (txt.includes(word)) tableNum = num.toString();
    });
    // Fallback to English digits
    if (!tableNum) {
      const match = txt.match(/(?:table|ready|complete|तयार|पूर्ण)\s*(\w+)/);
      if (match?.[1]) tableNum = match[1].toUpperCase();
    }
    if (tableNum) {
      const o = orders.find(x => x.tableNumber?.toString().toUpperCase() === tableNum.toString().toUpperCase());
      if (o) markAsReady(o._id);
    }
  }

  // ── RECALL — English + Marathi ──
  if (
    txt.includes('recall last') ||
    txt.includes('pratyeksha recall') ||
    txt.includes('परत आण') ||         // Marathi: "bring back"
    txt.includes('रिकॉल')             // Marathi transliteration
  ) {
    handleRecall();
  }

  // ── AGGREGATE VIEW TOGGLE ──
  if (
    txt.includes('show summary') ||
    txt.includes('aggregate view') ||
    txt.includes('सारांश दाखवा')      // Marathi: "show summary"
  ) {
    setIsAggregateView(v => !v);
  }
};

// ── Set recognition language to support both EN and MR ──
rec.lang = 'hi-IN'; // Marathi — also recognizes Hindi + English numbers
    rec.onerror = rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [orders, recallQueue]);

  const toggleVoiceListener = () => {
    if (!recognitionRef.current) return alert("Speech recognition not supported.");
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  /* ── init ── */
  useEffect(() => {
    if (!tenantId) return;
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`kds_operational_date_${tenantId}`);
    if (saved !== today) {
      localStorage.removeItem(`kds_completed_count_${tenantId}`);
      localStorage.removeItem(`kds_processing_time_${tenantId}`);
      localStorage.setItem(`kds_operational_date_${tenantId}`, today);
    }
    const cc = localStorage.getItem(`kds_completed_count_${tenantId}`);
    const ct = localStorage.getItem(`kds_processing_time_${tenantId}`);
    if (cc) setCompletedTicketsCount(parseInt(cc, 10));
    if (ct) setTotalProcessingTime(parseInt(ct, 10));

    fetchActiveOrders();

    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    const socket = io("https://pratyeksha-backend.onrender.com", { transports: ['polling', 'websocket'] });
    socketRef.current = socket;
    socket.emit("join_restaurant", tenantId);
    socket.on("connect",    () => setIsOnline(true));
    socket.on("disconnect", () => setIsOnline(false));

    socket.on("new_order", (newOrder) => {
      if (newOrder.tenantId !== tenantId) return;
      setOrders(prev => [newOrder, ...prev]);
      setMobileCardIndex(0);
      const isTakeaway = newOrder.tableNumber?.toLowerCase() === 'takeaway';
      if (isTakeaway) new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3').play().catch(() => {});
      else audioPlayer.current?.play().catch(() => {});
      speakOrder(newOrder);
    });

    socket.on("kds_item_cross_sync", ({ orderId, idx, newState }) => {
      setCheckedItemsGlobal(prev => ({ ...prev, [`${orderId}-${idx}`]: newState }));
      setOrders(prev => prev.map(o => {
        if (o._id !== orderId) return o;
        const items = [...o.items];
        if (items[idx]) items[idx].isCrossedLocal = newState;
        return { ...o, items };
      }));
    });

    socket.on("order_modification_detected", (data) => {
      if (data.tenantId !== tenantId) return;
      alertPlayer.current?.play().catch(() => {});
      setInterceptedAlerts(prev => [{ id: Date.now(), ...data }, ...prev]);
      fetchActiveOrders();
    });

    socket.on("waiter_called", (data) => {
      if (data.tenantId === tenantId) setWaiterCalls(prev => [{ id: Date.now(), ...data }, ...prev]);
    });

return () => {
  socket.off("new_order");
  socket.off("kds_item_cross_sync");
  socket.off("order_modification_detected");
  socket.off("waiter_called");
  socket.off("order_status_updated"); // ← ADD THIS
  socket.disconnect();
  window.removeEventListener('online', onOnline);
  window.removeEventListener('offline', onOffline);
};
  }, [tenantId]);

  /* ── actions ── */
  const markAsReady = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    setRecallQueue(prev => [order, ...prev].slice(0, 10));
    const dur = Math.floor((new Date() - new Date(order.createdAt)) / 1000);
    setTotalProcessingTime(prev => { const n = prev + dur; localStorage.setItem(`kds_processing_time_${tenantId}`, n); return n; });
    setCompletedTicketsCount(prev => { const n = prev + 1; localStorage.setItem(`kds_completed_count_${tenantId}`, n); return n; });
    if (mobileCardIndex > 0) setMobileCardIndex(i => i - 1);
    try {
      await axios.patch(`${BASE_URL}/admin/orders/${orderId}`, { status: 'served' });
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err) { console.error(err); }
  };



  const handleRecall = () => {
    if (!recallQueue.length) return;
    setOrders(prev => [recallQueue[0], ...prev]);
    setRecallQueue(prev => prev.slice(1));
    setCompletedTicketsCount(prev => { const n = Math.max(0, prev - 1); localStorage.setItem(`kds_completed_count_${tenantId}`, n); return n; });
  };

  const trigger86KillToggle = async (itemName) => {
    const node = menuItems.find(m => m.name.toLowerCase().trim() === itemName.toLowerCase().trim());
    if (!node) return;
    if (!window.confirm(`Lock "${itemName}" on customer menus?`)) return;
    try {
      await axios.patch(`${BASE_URL}/menu-item/${node._id}`, { isAvailable: false });
      alert(`"${itemName}" set out of stock. [86 Active]`);
      fetchActiveOrders();
    } catch { alert("Could not update item."); }
  };

  /* ── computed ── */
  const dishToCategoryMap = useMemo(() => {
    const m = {};
    menuItems.forEach(item => { if (item.name && item.categoryId) m[item.name.toLowerCase().trim()] = item.categoryId.toLowerCase().trim(); });
    return m;
  }, [menuItems]);

  const categoryVegProfile = useMemo(() => {
    const p = {};
    menuItems.forEach(item => {
      const cId = item.categoryId?.toLowerCase().trim();
      if (!cId) return;
      if (!p[cId]) p[cId] = { hasVeg: false, hasNonVeg: false };
      if (item.isVeg !== false) p[cId].hasVeg = true;
      else p[cId].hasNonVeg = true;
    });
    return p;
  }, [menuItems]);

  const categoryPendingCounts = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
      const isTakeaway = order.tableNumber?.toLowerCase() === 'takeaway' || order.items.some(i => i.isParcel);
      if (stationFilter === 'DINEIN' && isTakeaway) return;
      if (stationFilter === 'PARCEL' && !isTakeaway && order.items.every(i => !i.isParcel)) return;
      order.items.forEach((item, idx) => {
        if (checkedItemsGlobal[`${order._id}-${idx}`]) return;
        let fId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || null;
        const isVeg = item.isVeg !== undefined ? item.isVeg !== false : dishToVegMap[item.name?.toLowerCase().trim()] !== false;
        const matches = isNonVegMode ? !isVeg : isVeg;
        if (fId && matches) counts[fId] = (counts[fId] || 0) + (Number(item.quantity) || 0);
      });
    });
    return counts;
  }, [orders, stationFilter, dishToCategoryMap, dishToVegMap, checkedItemsGlobal, isNonVegMode]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const isTakeaway = order.tableNumber?.toLowerCase() === 'takeaway' || order.items.some(i => i.isParcel);
      if (stationFilter === 'DINEIN' && isTakeaway) return false;
      if (stationFilter === 'PARCEL' && !isTakeaway && order.items.every(i => !i.isParcel)) return false;
      if (isNonVegMode) {
        const hasNV = order.items.some(item => {
          const v = item.isVeg !== undefined ? item.isVeg !== false : dishToVegMap[item.name?.toLowerCase().trim()] !== false;
          return !v;
        });
        if (!hasNV) return false;
      }
      if (selectedCategory !== 'ALL') {
        return order.items.some(item => {
          let cId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || null;
          return cId === selectedCategory.toLowerCase().trim();
        });
      }
      return true;
    });
}, [orders, stationFilter, selectedCategory, dishToCategoryMap, dishToVegMap, isNonVegMode]);

  // Fetch today's wastage from DB
const fetchWastageLog = useCallback(async () => {
  if (!tenantId) return;
  setWastageLoading(true);
  try {
    const res = await axios.get(`${BASE_URL}/wastage/${tenantId}`);
    setWastageLog(res.data || []);
  } catch { setWastageLog([]); }
  finally { setWastageLoading(false); }
}, [tenantId]);
 
// Fetch monthly analytics
const fetchWastageAnalytics = useCallback(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/wastage/analytics/${tenantId}`);
    setWastageAnalytics(res.data || null);
  } catch { setWastageAnalytics(null); }
}, [tenantId]);
 
// Fetch inventory for autocomplete (once)
const fetchWastageInventory = useCallback(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/inventory/${tenantId}`);
    setWastageInventory(res.data || []);
  } catch { setWastageInventory([]); }
}, [tenantId]);
 
// Save wastage entry to DB
const saveWastageEntry = async () => {
  const { itemName, quantity, unit, reason, loggedBy } = wastageForm;
  if (!itemName.trim() || !quantity || !loggedBy.trim()) return;
  setWastageSaving(true);
  try {
    await axios.post(`${BASE_URL}/wastage/${tenantId}`, {
      itemName:    wastageForm.itemName.trim(),
      inventoryId: wastageForm.inventoryId || undefined,
      quantity:    Number(wastageForm.quantity),
      unit:        wastageForm.unit,
      reason:      wastageForm.reason,
      loggedBy:    wastageForm.loggedBy.trim(),
      notes:       wastageForm.notes || '',
    });
    setWastageForm(p => ({
      itemName: '', inventoryId: null, quantity: '', unit: 'kg',
      reason: 'Spoiled / Expired', loggedBy: p.loggedBy, notes: ''
    }));
    setWastageSuggestions([]);
    fetchWastageLog();
    // refresh inventory too (stock was deducted)
    fetchWastageInventory();
  } catch (err) {
    console.error('Wastage save error:', err.message);
  } finally { setWastageSaving(false); }
};
 
// Delete entry (re-credits inventory on backend)
const deleteWastageEntry = async (entryId) => {
  try {
    await axios.delete(`${BASE_URL}/wastage/${tenantId}/${entryId}`);
    setWastageLog(prev => prev.filter(e => e._id !== entryId));
  } catch { }
};

 
// ── 4. ADD THIS useEffect inside KitchenView to load when panel opens ──

useEffect(() => {
  if (showWastagePanel) {
    fetchWastageInventory();
    fetchWastageLog();
    if (wastageTab === 'report') fetchWastageAnalytics();
  }
}, [showWastagePanel, fetchWastageInventory, fetchWastageLog, fetchWastageAnalytics]);


useEffect(() => {
  if (showWastagePanel && wastageTab === 'report') fetchWastageAnalytics();
}, [wastageTab, showWastagePanel, fetchWastageAnalytics]);


  const aggregatedTotals = useMemo(() => {
    const totals = {};
    orders.forEach(o => o.items.forEach((i, idx) => {
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
      const parcel = o.tableNumber?.toLowerCase() === 'takeaway' || i.isParcel;
      const portion = (i.portion && i.portion.toLowerCase() !== 'single') ? ` (${i.portion})` : "";
      const key = `${i.name}${portion} ${parcel ? '[P]' : '[D]'}`;
      totals[key] = (totals[key] || 0) + i.quantity;
    }));
    return totals;
  }, [orders, checkedItemsGlobal]);

  const masterPrepMarqueeList = useMemo(() => {
    const m = {};
    filteredOrders.forEach(o => o.items.forEach((i, idx) => {
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
      m[i.name] = (m[i.name] || 0) + i.quantity;
    }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredOrders, checkedItemsGlobal]);

  const averageClearVelocityString = useMemo(() => {
    if (!completedTicketsCount) return "—";
    const avg = Math.floor(totalProcessingTime / completedTicketsCount);
    return `${Math.floor(avg / 60)}m ${avg % 60}s`;
  }, [totalProcessingTime, completedTicketsCount]);

  /* ── safe card index (mobile) ── */
  const safeCardIndex = Math.min(mobileCardIndex, Math.max(0, filteredOrders.length - 1));
  const swipeHandlers = useSwipe(
    () => setMobileCardIndex(i => Math.min(i + 1, filteredOrders.length - 1)),
    () => setMobileCardIndex(i => Math.max(i - 1, 0))
  );

  /* ── visible category list ── */
  const visibleCategories = categories.filter(cat => {
    const k = cat.categoryId?.toLowerCase().trim() || '';
    const p = categoryVegProfile[k];
    if (!p) return false;
    if (tenantOnlyVeg) return p.hasVeg;
    return isNonVegMode ? p.hasNonVeg : p.hasVeg;
  });

  /* ─────────────────────────────────────
     DERIVED LAYOUT FLAGS
  ───────────────────────────────────── */
  // Show drawer on mobile + small tablet; sidebar always visible on large tablet + desktop
  const showDrawerToggle  = isMobile || isSmallTablet;
  const showPermanentSide = isLargeTablet || isDesktop;
  // On mobile use swipe-card view; tablet & desktop use grid
  const useCardView       = isMobile;
  // Bottom nav only on mobile
  const showBottomNav     = isMobile;
  // Station capsule in header: hidden on mobile (in bottom nav), shown on all tablets and desktop
  const showStationHeader = !isMobile;

  /* ──────────────────────────────────────────────────────────────
     SIDEBAR CONTENT (shared between drawer and permanent sidebar)
  ────────────────────────────────────────────────────────────── */
  const SidebarContent = ({ inDrawer = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={rs.sidebarHeader}>
        <Layers size={14} color="#d3bfa2" />
        <span>KITCHEN SECTIONS</span>
        {inDrawer && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Veg / Non-veg toggle */}
      {!tenantOnlyVeg && (
        <div style={rs.vegToggleWrap}>
          {[false, true].map(nv => (
            <button
              key={String(nv)}
              onClick={() => { setIsNonVegMode(nv); setSelectedCategory('ALL'); }}
              style={{ ...rs.vegBtn, ...(isNonVegMode === nv ? (nv ? rs.vegBtnActiveNV : rs.vegBtnActiveV) : {}) }}>
              <div style={{
                width: 12, height: 12,
                border: `2px solid ${isNonVegMode === nv ? (nv ? '#e07070' : '#7ec87a') : '#444'}`,
                borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {nv
                  ? <div style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: `5px solid ${isNonVegMode ? '#e07070' : '#444'}` }} />
                  : <div style={{ width: 5, height: 5, borderRadius: '50%', background: !isNonVegMode ? '#7ec87a' : '#444' }} />
                }
              </div>
              {nv ? 'NON-VEG' : 'VEG'}
            </button>
          ))}
        </div>
      )}

      {/* Category list */}
      <div style={rs.sidebarStack} className="no-scrollbar">
        <button
          onClick={() => { setSelectedCategory('ALL'); setShowMetricsDashboard(false); setSidebarOpen(false); }}
          style={selectedCategory === 'ALL' && !showMetricsDashboard ? rs.activeSidebarNode : rs.sidebarNode}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Coffee size={14} color={selectedCategory === 'ALL' && !showMetricsDashboard ? '#0f1013' : '#d3bfa2'} />
            <span>ALL SECTIONS</span>
          </div>
          <span style={{
            ...rs.countBadge,
            background: selectedCategory === 'ALL' && !showMetricsDashboard ? '#0f1013' : '#1e2129',
            color: selectedCategory === 'ALL' && !showMetricsDashboard ? '#d3bfa2' : '#8a909f'
          }}>
            {Object.values(categoryPendingCounts).reduce((a, b) => a + b, 0)}
          </span>
        </button>

        {visibleCategories.map(cat => {
          const k   = cat.categoryId?.toLowerCase().trim() || '';
          const count = categoryPendingCounts[k] || 0;
          const sel = selectedCategory === k && !showMetricsDashboard;
          return (
            <button
              key={cat._id}
              onClick={() => { setSelectedCategory(k); setShowMetricsDashboard(false); setSidebarOpen(false); }}
              style={sel ? rs.activeSidebarNode : rs.sidebarNode}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Flame size={14} color={sel ? '#0f1013' : '#bda88a'} />
                <span style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>{cat.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  onClick={(e) => { e.stopPropagation(); trigger86KillToggle(cat.name); }}
                  style={rs.mini86}
                  title="86 item">
                  <EyeOff size={10} />
                </span>
                <span style={{
                  ...rs.countBadge,
                  background: sel ? '#0f1013' : '#1a1c23',
                  color: sel ? '#d3bfa2' : '#8e94a4',
                  border: sel ? '1px solid #d3bfa2' : '1px solid #232730'
                }}>
                  {count < 10 ? `0${count}` : count}
                </span>
              </div>
            </button>
          );
        })}

        {/* Metrics shortcut */}
        <button
          onClick={() => { setShowMetricsDashboard(true); setSidebarOpen(false); }}
          style={{ ...rs.sidebarNode, marginTop: 'auto', borderTop: '1px solid #1f222a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={14} color="#d3bfa2" />
            <span>SPEED LOGS</span>
          </div>
        </button>
      </div>
    </div>
  );

  /* ──────────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────────── */
  return (
    <div style={rs.root}>
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      <audio ref={alertPlayer} src="https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3" />

      {/* ── DRAWER OVERLAY (mobile + small tablet) ── */}
      <AnimatePresence>
        {sidebarOpen && showDrawerToggle && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 90 }} />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                ...rs.sidebar,
                position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
                borderRadius: '0 16px 16px 0',
                // Wider drawer on tablet so text doesn't cramp
                width: isSmallTablet ? 280 : 260,
              }}>
              <SidebarContent inDrawer />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header style={rs.header}>
        <div style={rs.brandCluster}>
          {/* Hamburger on mobile + small tablet */}
          {showDrawerToggle && (
            <button onClick={() => setSidebarOpen(true)} style={rs.iconBtn}>
              <AlignJustify size={20} color="#d3bfa2" />
            </button>
          )}
          <div style={rs.logoBadge}>
            <ChefHat color="#d3bfa2" size={isMobile ? 20 : isTablet ? 24 : 30} />
          </div>
          <div>
            <h1 style={{
              ...rs.mainTitle,
              fontSize: isMobile ? '0.8rem' : isSmallTablet ? '0.9rem' : isLargeTablet ? '1rem' : '1.15rem'
            }}>
              PRATYEKSHA
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={isOnline ? rs.dotGold : rs.dotRed} />
              {!isMobile && (
                <p style={rs.subTitle}>
                  {isOnline
                    ? isSmallTablet ? "ONLINE" : "TITANIUM V17.0 • ONLINE"
: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><WifiOff size={11} color="#ff4d4d" /> DISCONNECTED</span>}                </p>
              )}
            </div>
          </div>
        </div>

        <div style={rs.actionCenter}>
          {/* Station pills — visible on tablet + desktop */}
          {showStationHeader && (
            <div style={rs.stationCapsule}>
              {['ALL', 'DINEIN', 'PARCEL'].map(s => (
                <button key={s} onClick={() => setStationFilter(s)}
                  style={stationFilter === s ? rs.capsuleActive : rs.capsule}>
                  {s === 'ALL' ? 'ALL' : s === 'DINEIN' ? 'DINE-IN' : 'PARCELS'}
                </button>
              ))}
            </div>
          )}

          {/* Voice */}
          <button
            onClick={toggleVoiceListener}
            style={{ ...rs.utilBtn, borderColor: isListening ? '#d3bfa2' : '#252932', background: isListening ? 'rgba(211,191,162,0.12)' : '#191b22' }}>
            <Mic size={15} color={isListening ? '#d3bfa2' : '#9fa4b0'} />
{!isMobile && (
  <span style={{ color: isListening ? '#d3bfa2' : '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
    {isListening ? "LIVE — EN/MR" : "VOICE"}
  </span>
)}
          </button>

          {/* Aggregate toggle */}
          <button onClick={() => setIsAggregateView(v => !v)} style={rs.utilBtn}>
            {isAggregateView ? <LayoutGrid size={16} color="#d3bfa2" /> : <BarChart3 size={16} color="#d3bfa2" />}
            {!isMobile && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                {isAggregateView ? "TICKETS" : "SUMMARY"}
              </span>
            )}
          </button>

{recallQueue.length > 0 && (
  <button onClick={handleRecall} style={{
    ...rs.utilBtn,
    border: '1px solid rgba(211,191,162,0.3)',
    background: 'rgba(211,191,162,0.06)',
    position: 'relative'
  }}>
    <History size={16} color="#d3bfa2" />
    {!isMobile && (
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d3bfa2' }}>RECALL</span>
    )}
    {/* Count badge */}
    <div style={{
      position: 'absolute', top: '-6px', right: '-6px',
      width: '18px', height: '18px', borderRadius: '50%',
      background: 'linear-gradient(135deg,#d3bfa2,#bda88a)',
      color: '#0f1013', fontSize: '0.55rem', fontWeight: '900',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', lineHeight: 1
    }}>
      {recallQueue.length}
    </div>
  </button>
)}

{/* Wastage button */}
<button
  onClick={() => setShowWastagePanel(true)}
  style={{
    ...rs.utilBtn,
    borderColor: showWastagePanel ? 'rgba(211,191,162,0.4)' : '#252932',
    background: showWastagePanel ? 'rgba(211,191,162,0.08)' : '#191b22',
    position: 'relative'
  }}>
<Trash2 size={15} color="#d3bfa2" />
  {!isMobile && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d3bfa2' }}>WASTAGE</span>}
  {wastageLog.filter(e =>
  new Date(e.loggedAt || e.createdAt).toDateString() === new Date().toDateString()
).length > 0 && (
    <div style={{
      position: 'absolute', top: -6, right: -6,
      width: 16, height: 16, borderRadius: '50%',
      background: '#ff4d4d', color: '#fff',
      fontSize: '0.48rem', fontWeight: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
{wastageLog.filter(e => new Date(e.loggedAt || e.createdAt).toDateString() === new Date().toDateString()).length}
    </div>
  )}
</button>
          {/* Ticket count badge */}
          <div style={rs.ticketBadge}>
            <span style={rs.ticketNum}>{filteredOrders.length}</span>
            {!isMobile && (
              <span style={{ color: '#1a1c23', fontSize: '0.55rem', fontWeight: 900, marginLeft: 5 }}>
                TICKETS
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── MARQUEE BANNER ── */}
      <AnimatePresence>
        {masterPrepMarqueeList.length > 0 && !isAggregateView && !showMetricsDashboard && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={rs.marquee}>
            <div style={rs.marqueeLabel}><Activity size={11} /> PREP QUEUE:</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }} className="no-scrollbar">
              {masterPrepMarqueeList.map(([name, qty]) => (
                <div key={name} style={rs.marqueeToken}>
                  <span style={{ color: '#d3bfa2', fontWeight: 900, fontFamily: 'monospace' }}>{qty}×</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{name.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RECALL QUEUE PREVIEW ── */}
<AnimatePresence>
  {recallQueue.length > 0 && (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(211,191,162,0.04)',
        border: '1px solid rgba(211,191,162,0.1)',
        borderRadius: 9, padding: '6px 12px', flexShrink: 0, overflow: 'hidden'
      }}>
      <History size={11} color="rgba(211,191,162,0.4)" />
      <span style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.35)', fontWeight: 900, letterSpacing: '1px', flexShrink: 0 }}>
        RECALL ({recallQueue.length}/10):
      </span>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }} className="no-scrollbar">
        {recallQueue.map((o, i) => (
          <span key={i} style={{
            fontSize: '0.58rem', fontWeight: 900,
            padding: '2px 8px', borderRadius: 5,
            background: i === 0 ? 'rgba(211,191,162,0.12)' : '#0d0e11',
            border: `1px solid ${i === 0 ? 'rgba(211,191,162,0.25)' : '#1f222a'}`,
            color: i === 0 ? '#d3bfa2' : '#4a4f5c',
            whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'monospace'
          }}>
            T-{o.tableNumber} · {o.items?.length} items
          </span>
        ))}
      </div>
      <span style={{ fontSize: '0.52rem', color: 'rgba(211,191,162,0.2)', flexShrink: 0 }}>
        ← NEXT
      </span>
    </motion.div>
  )}
</AnimatePresence>

      {/* ── MODIFICATION ALERTS ── */}
      <AnimatePresence>
        {interceptedAlerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            style={{ ...rs.alertBox, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 10 }}>
                <BellRing size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: isMobile ? '0.85rem' : '1.1rem', fontWeight: 900 }}>
                  ORDER CHANGE — TABLE {alert.tableNumber}
                </h3>
                <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '0.72rem' }}>
                  <span style={{ color: '#d3bfa2', fontWeight: 'bold' }}>"{alert.modificationNote}"</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setInterceptedAlerts(prev => prev.filter(a => a.id !== alert.id))}
              style={{ background: '#0d0e11', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', padding: '10px 18px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              CONFIRM RECEIPT
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── BODY ── */}
      <div style={rs.body}>

        {/* Permanent sidebar — large tablet + desktop */}
        {showPermanentSide && (
          <aside style={{
            ...rs.sidebar,
            // Narrower on large tablet to leave more room for cards
            width: isLargeTablet ? 210 : 250,
          }}>
            <SidebarContent />
          </aside>
        )}

        {/* Main workspace */}
        <main style={rs.workspace} className="no-scrollbar">

          {/* ── METRICS PANEL ── */}
          {showMetricsDashboard ? (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={rs.metricsPanel}>
              <TrendingUp size={36} color="#d3bfa2" />
              <h2 style={{ margin: '16px 0 0', fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 900 }}>
                SPEED METRICS
              </h2>
              <div style={{
                display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
                marginTop: 30, width: '100%', maxWidth: 700
              }}>
                {[
                  { label: 'TICKETS PROCESSED', value: completedTicketsCount, color: '#fff' },
                  { label: 'AVG CLEAR TIME', value: averageClearVelocityString, color: '#d3bfa2' }
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ ...rs.metricBox, minWidth: isMobile ? 140 : 240 }}>
                    <small style={{ fontSize: '0.65rem', fontWeight: 900, color: '#5c616e', letterSpacing: '1.5px', display: 'block', marginBottom: 12 }}>
                      {label}
                    </small>
                    <div style={{ fontSize: isMobile ? '2.2rem' : isTablet ? '2.8rem' : '3.5rem', fontWeight: 950, color, fontFamily: 'monospace', lineHeight: 1 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowMetricsDashboard(false)} style={rs.metricClose}>
                BACK TO TRACKER
              </button>
            </motion.div>

          /* ── AGGREGATE SUMMARY ── */
          ) : isAggregateView ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, 1fr)'
                : isSmallTablet
                ? 'repeat(3, 1fr)'
                : isLargeTablet
                ? 'repeat(4, 1fr)'
                : 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: isMobile ? 10 : 14
            }}>
              {Object.entries(aggregatedTotals).map(([name, qty]) => (
                <div key={name} style={rs.aggCard}>
                  <div style={{ fontSize: isMobile ? '2.2rem' : isTablet ? '2.8rem' : '3.2rem', fontWeight: 900, color: '#d3bfa2', fontFamily: 'monospace', lineHeight: 1 }}>
                    {qty < 10 ? `0${qty}` : qty}
                  </div>
                  <div style={{ fontSize: isMobile ? '0.65rem' : '0.72rem', color: '#7c8291', marginTop: 10, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.3 }}>
                    {name}
                  </div>
                </div>
              ))}
            </div>

          /* ── MOBILE SINGLE CARD SWIPE VIEW ── */
          ) : useCardView ? (
            filteredOrders.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#333', gap: 12 }}>
                <ChefHat size={48} color="#232731" />
                <p style={{ fontWeight: 800, color: '#3a3e4a', fontSize: '0.9rem', letterSpacing: 1 }}>KITCHEN CLEAR</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
                {/* Progress dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                  {filteredOrders.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setMobileCardIndex(i)}
                      style={{
                        width: i === safeCardIndex ? 20 : 7, height: 7, borderRadius: 4,
                        background: i === safeCardIndex ? '#d3bfa2' : '#252932',
                        transition: 'all 0.25s', cursor: 'pointer'
                      }} />
                  ))}
                </div>
                {/* Swipeable card */}
                <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }} {...swipeHandlers}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={filteredOrders[safeCardIndex]?._id}
                      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
                      style={{ height: '100%' }}>
                      {filteredOrders[safeCardIndex] && (
                        <KDSOrderCard
                          order={filteredOrders[safeCardIndex]}
                          isNewest={safeCardIndex === 0}
                          onReady={markAsReady}
                          dishToCategoryMap={dishToCategoryMap}
                          dishToVegMap={dishToVegMap}
                          selectedCategory={selectedCategory}
                          checkedItemsGlobal={checkedItemsGlobal}
                          setCheckedItemsGlobal={setCheckedItemsGlobal}
                          socketInstance={socketRef.current}
                          isNonVegMode={isNonVegMode}
                          tenantOnlyVeg={tenantOnlyVeg}
                          isMobile={true}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Prev / Next */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    onClick={() => setMobileCardIndex(i => Math.max(0, i - 1))}
                    disabled={safeCardIndex === 0}
                    style={{ ...rs.navBtn, opacity: safeCardIndex === 0 ? 0.3 : 1 }}>
                    <ChevronLeft size={18} /> PREV
                  </button>
                  <span style={{ color: '#5c616e', fontSize: '0.75rem', fontWeight: 800 }}>
                    {safeCardIndex + 1} / {filteredOrders.length}
                  </span>
                  <button
                    onClick={() => setMobileCardIndex(i => Math.min(filteredOrders.length - 1, i + 1))}
                    disabled={safeCardIndex === filteredOrders.length - 1}
                    style={{ ...rs.navBtn, opacity: safeCardIndex === filteredOrders.length - 1 ? 0.3 : 1 }}>
                    NEXT <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )

          /* ── TABLET + DESKTOP GRID ── */
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isSmallTablet
                ? 'repeat(auto-fill, minmax(260px, 1fr))'
                : isLargeTablet
                ? 'repeat(auto-fill, minmax(270px, 1fr))'
                : 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: isTablet ? 14 : 18,
              alignContent: 'flex-start'
            }}>
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order, i) => (
                  <KDSOrderCard
                    key={order._id}
                    order={order}
                    isNewest={i === 0}
                    onReady={markAsReady}
                    dishToCategoryMap={dishToCategoryMap}
                    dishToVegMap={dishToVegMap}
                    selectedCategory={selectedCategory}
                    checkedItemsGlobal={checkedItemsGlobal}
                    setCheckedItemsGlobal={setCheckedItemsGlobal}
                    socketInstance={socketRef.current}
                    isNonVegMode={isNonVegMode}
                    tenantOnlyVeg={tenantOnlyVeg}
                    isMobile={false}
                    isTablet={isTablet}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {showBottomNav && (
        <nav style={rs.mobileBottomBar}>
          {['ALL', 'DINEIN', 'PARCEL'].map(s => (
            <button key={s} onClick={() => setStationFilter(s)}
              style={{
                ...rs.bottomBarBtn,
                color: stationFilter === s ? '#d3bfa2' : '#4a4f5c',
                borderTop: stationFilter === s ? '2px solid #d3bfa2' : '2px solid transparent'
              }}>
              {s === 'ALL' ? <Monitor size={18} /> : s === 'DINEIN' ? <UtensilsCrossed size={18} /> : <Package size={18} />}
              <span style={{ fontSize: '0.55rem', fontWeight: 800, marginTop: 2 }}>
                {s === 'ALL' ? 'ALL' : s === 'DINEIN' ? 'DINE-IN' : 'PARCEL'}
              </span>
            </button>
          ))}
          <button
            onClick={() => setIsAggregateView(v => !v)}
            style={{
              ...rs.bottomBarBtn,
              color: isAggregateView ? '#d3bfa2' : '#4a4f5c',
              borderTop: isAggregateView ? '2px solid #d3bfa2' : '2px solid transparent'
            }}>
            <BarChart3 size={18} />
            <span style={{ fontSize: '0.55rem', fontWeight: 800, marginTop: 2 }}>SUMMARY</span>
          </button>
          <button
            onClick={() => setShowMetricsDashboard(v => !v)}
            style={{
              ...rs.bottomBarBtn,
              color: showMetricsDashboard ? '#d3bfa2' : '#4a4f5c',
              borderTop: showMetricsDashboard ? '2px solid #d3bfa2' : '2px solid transparent'
            }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: '0.55rem', fontWeight: 800, marginTop: 2 }}>METRICS</span>
          </button>
        </nav>
      )}
{/* ── WASTAGE & SPOILAGE PANEL ── */}
<AnimatePresence>
  {showWastagePanel && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} exit={{ opacity: 0 }}
        onClick={() => setShowWastagePanel(false)}
        style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 3000 }}
      />
 
      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0,
          width: isMobile ? '100vw' : isTablet ? 420 : 500,
          background: '#0d0e11',
          borderLeft: '1px solid #1f222a',
          borderRadius: isMobile ? 0 : '20px 0 0 20px',
          zIndex: 3001, display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        {/* ── PANEL HEADER ── */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid #1a1c23',
          background: '#0a0b0e', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Trash2 size={17} color="#f87171" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#fff', letterSpacing: 0.3 }}>
                WASTAGE LOG
              </div>
              <div style={{ fontSize: '0.56rem', color: '#3a3e4a', fontWeight: 800, letterSpacing: 1.5, marginTop: 1 }}>
                SPOILAGE · OVERCOOKED · DROPPED · EXCESS PREP
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowWastagePanel(false)}
            style={{
              background: '#13151a', border: '1px solid #252932',
              color: '#5c616e', padding: 8, borderRadius: 9,
              cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}>
            <X size={17} />
          </button>
        </div>
 
        {/* ── TAB SWITCHER ── */}
        <div style={{
          display: 'flex', background: '#0a0b0e',
          borderBottom: '1px solid #1a1c23', flexShrink: 0
        }}>
          {[
            { id: 'log',    label: 'LOG ENTRY',      icon: <FileText size={13} /> },
            { id: 'report', label: 'MONTHLY REPORT', icon: <TrendingDown size={13} /> },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => setWastageTab(tab.id)}
              style={{
                flex: 1, padding: '11px 8px', border: 'none', cursor: 'pointer',
                background: 'transparent',
                borderBottom: wastageTab === tab.id ? '2px solid #d3bfa2' : '2px solid transparent',
                color: wastageTab === tab.id ? '#d3bfa2' : '#3a3e4a',
                fontSize: '0.6rem', fontWeight: 900, letterSpacing: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s'
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
 
        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 24px' }} className="custom-scroll">
 
          {/* ══════════════ LOG ENTRY TAB ══════════════ */}
          {wastageTab === 'log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
 
              {/* ENTRY FORM */}
              <div style={{
                background: '#0a0b0e', border: '1px solid #1f222a',
                borderRadius: 14, padding: '16px 16px 18px'
              }}>
                <div style={{
                  fontSize: '0.58rem', color: '#3a3e4a', fontWeight: 900,
                  letterSpacing: 1.5, marginBottom: 14,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <BadgeAlert size={12} color="#d3bfa2" />
                  NEW ENTRY
                </div>
 
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 
                  {/* ── ITEM NAME with inventory autocomplete ── */}
                  <div style={{ position: 'relative' }}>
                    <label style={wFormLabel}>
                      <Package size={11} style={{ display: 'inline', marginRight: 4 }} />
                      INGREDIENT NAME
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Search size={13} color="#3a3e4a" style={{
                        position: 'absolute', left: 10, top: '50%',
                        transform: 'translateY(-50%)', pointerEvents: 'none'
                      }} />
                      <input
                        type="text"
                        placeholder="e.g. Paneer, Tomato, Dal..."
                        value={wastageForm.itemName}
                        onChange={e => {
                          const val = e.target.value;
                          setWastageForm(p => ({ ...p, itemName: val, inventoryId: null }));
                          if (val.trim().length >= 1) {
                            const matches = wastageInventory.filter(i =>
                              i.itemName.toLowerCase().includes(val.toLowerCase())
                            );
                            setWastageSuggestions(matches.slice(0, 6));
                            setShowWastageSuggest(matches.length > 0);
                          } else {
                            setShowWastageSuggest(false);
                            setWastageSuggestions([]);
                          }
                        }}
                        onBlur={() => setTimeout(() => setShowWastageSuggest(false), 200)}
                        onFocus={() => {
                          if (wastageForm.itemName.trim().length >= 1 && wastageSuggestions.length > 0)
                            setShowWastageSuggest(true);
                        }}
                        style={{ ...wInput, paddingLeft: 32 }}
                      />
                    </div>
 
                    {/* Inventory suggestions dropdown */}
                    {showWastageSuggest && wastageSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        zIndex: 999, background: '#13151a',
                        border: '1px solid rgba(211,191,162,0.2)',
                        borderRadius: 10, marginTop: 4,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)', overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '6px 10px', fontSize: '0.52rem',
                          color: '#3a3e4a', fontWeight: 900, letterSpacing: 1,
                          borderBottom: '1px solid #1f222a'
                        }}>
                          FROM INVENTORY — CLICK TO LINK
                        </div>
                        {wastageSuggestions.map(item => {
                          const wac = item.weightedAvgCost || item.costPrice || 0;
                          const isLow = item.currentStock <= item.minThreshold;
                          return (
                            <div key={item._id}
                              onMouseDown={() => {
                                setWastageForm(p => ({
                                  ...p,
                                  itemName: item.itemName,
                                  inventoryId: item._id,
                                  unit: item.unit
                                }));
                                setShowWastageSuggest(false);
                                setWastageSuggestions([]);
                              }}
                              style={{
                                padding: '10px 12px', cursor: 'pointer',
                                borderBottom: '1px solid #111',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                transition: 'background 0.1s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(211,191,162,0.05)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                                  {item.itemName}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#3a3e4a', marginTop: 2 }}>
                                  {item.currentStock} {item.unit} in stock
                                  {wac > 0 && (
                                    <span style={{ color: '#5c616e', marginLeft: 6 }}>
                                      · WAC ₹{wac.toFixed(2)}/{item.unit}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span style={{
                                fontSize: '0.52rem', fontWeight: 900, padding: '2px 7px',
                                borderRadius: 5,
                                background: isLow ? 'rgba(239,68,68,0.1)' : 'rgba(211,191,162,0.06)',
                                border: `1px solid ${isLow ? 'rgba(239,68,68,0.25)' : '#1f222a'}`,
                                color: isLow ? '#f87171' : '#3a3e4a'
                              }}>
                                {isLow ? 'LOW' : 'OK'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
 
                  {/* ── QUANTITY + UNIT ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={wFormLabel}>
                        <Scale size={11} style={{ display: 'inline', marginRight: 4 }} />
                        QUANTITY
                      </label>
                      <input
                        type="number" min="0" step="0.1"
                        placeholder="e.g. 2.5"
                        value={wastageForm.quantity}
                        onChange={e => setWastageForm(p => ({ ...p, quantity: e.target.value }))}
                        style={wInput}
                      />
                    </div>
                    <div>
                      <label style={wFormLabel}>UNIT</label>
                      <select
                        value={wastageForm.unit}
                        onChange={e => setWastageForm(p => ({ ...p, unit: e.target.value }))}
                        style={{ ...wInput, appearance: 'none', cursor: 'pointer' }}>
                        {['kg','gm','litre','ml','pieces','portions','dozen'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
 
                  {/* ── REASON PILLS ── */}
                  <div>
                    <label style={wFormLabel}>
                      <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} />
                      REASON
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                      {[
                        { val: 'Spoiled / Expired',  icon: <Droplets size={13} />,      color: '#f87171' },
                        { val: 'Overcooked',          icon: <FlameKindling size={13} />, color: '#fb923c' },
                        { val: 'Dropped / Spilled',   icon: <AlertTriangle size={13} />, color: '#fbbf24' },
                        { val: 'Excess Prep',         icon: <Scale size={13} />,         color: '#a78bfa' },
                        { val: 'Customer Return',     icon: <RotateCcw size={13} />,     color: '#60a5fa' },
                        { val: 'Other',               icon: <FileText size={13} />,      color: '#9ca3af' },
                      ].map(r => {
                        const sel = wastageForm.reason === r.val;
                        return (
                          <button key={r.val} type="button"
                            onClick={() => setWastageForm(p => ({ ...p, reason: r.val }))}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 7,
                              padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
                              border: `1px solid ${sel ? r.color + '55' : '#1f222a'}`,
                              background: sel ? r.color + '14' : '#13151a',
                              color: sel ? r.color : '#3a3e4a',
                              fontSize: '0.62rem', fontWeight: sel ? 900 : 700,
                              transition: 'all 0.12s', textAlign: 'left'
                            }}>
                            <span style={{ color: sel ? r.color : '#2a2e38', flexShrink: 0 }}>{r.icon}</span>
                            <span style={{ lineHeight: 1.3 }}>{r.val}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
 
                  {/* ── LOGGED BY ── */}
                  <div>
                    <label style={wFormLabel}>LOGGED BY</label>
                    <input
                      type="text"
                      placeholder="Chef name"
                      value={wastageForm.loggedBy}
                      onChange={e => setWastageForm(p => ({ ...p, loggedBy: e.target.value }))}
                      style={wInput}
                    />
                  </div>
 
                  {/* ── NOTES ── */}
                  <div>
                    <label style={wFormLabel}>
                      NOTES <span style={{ color: '#2a2e38', fontWeight: 600 }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Found mold on delivery batch"
                      value={wastageForm.notes}
                      onChange={e => setWastageForm(p => ({ ...p, notes: e.target.value }))}
                      style={wInput}
                    />
                  </div>
 
                  {/* WAC COST PREVIEW — only when linked to inventory */}
                  {wastageForm.inventoryId && wastageForm.quantity && (() => {
                    const inv = wastageInventory.find(i => i._id === wastageForm.inventoryId);
                    if (!inv) return null;
                    const wac  = inv.weightedAvgCost || inv.costPrice || 0;
                    const cost = Math.round(Number(wastageForm.quantity) * wac * 100) / 100;
                    if (cost <= 0) return null;
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: 8, padding: '8px 12px'
                      }}>
                        <IndianRupee size={13} color="#f87171" />
                        <div>
                          <span style={{ fontSize: '0.6rem', color: '#3a3e4a', fontWeight: 800 }}>
                            ESTIMATED COST LOSS:&nbsp;
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#f87171' }}>
                            ₹{cost.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '0.58rem', color: '#2a2e38', marginLeft: 6 }}>
                            ({wastageForm.quantity} {wastageForm.unit} × ₹{wac.toFixed(2)} WAC)
                          </span>
                        </div>
                      </div>
                    );
                  })()}
 
                  {/* ── SUBMIT ── */}
                  <button
                    onClick={saveWastageEntry}
                    disabled={wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()}
                    style={{
                      width: '100%', padding: '13px',
                      borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontWeight: 900, fontSize: '0.78rem', letterSpacing: 0.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      transition: 'all 0.15s',
                      background: (wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim())
                        ? '#13151a'
                        : 'linear-gradient(135deg,#c94f4f,#e05e5e)',
                      color: (wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim())
                        ? '#2a2e38'
                        : '#fff',
                    }}>
                    {wastageSaving
                      ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> SAVING...</>
                      : <><Trash2 size={14} /> LOG WASTAGE ENTRY</>
                    }
                  </button>
                </div>
              </div>
 
              {/* ── TODAY'S ENTRIES (from DB) ── */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 10
                }}>
                  <div style={{
                    fontSize: '0.58rem', color: '#3a3e4a', fontWeight: 900,
                    letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <FileText size={12} color="#d3bfa2" />
                    TODAY'S ENTRIES ({wastageLog.length})
                  </div>
                  <button onClick={fetchWastageLog} style={{
                    background: 'transparent', border: '1px solid #1f222a',
                    color: '#3a3e4a', padding: '4px 8px', borderRadius: 7,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.58rem', fontWeight: 800
                  }}>
                    <RefreshCw size={11} /> REFRESH
                  </button>
                </div>
 
                {wastageLoading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#2a2e38', fontSize: '0.75rem' }}>
                    Loading...
                  </div>
                ) : wastageLog.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '36px 0',
                    color: '#2a2e38', fontSize: '0.75rem', fontWeight: 700,
                    background: '#0a0b0e', borderRadius: 12, border: '1px dashed #1a1c23'
                  }}>
                    <Trash2 size={22} color="#1a1c23" style={{ display: 'block', margin: '0 auto 10px' }} />
                    No wastage logged today
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {wastageLog.map(entry => {
                      const reasonColors = {
                        'Spoiled / Expired': '#f87171', 'Overcooked': '#fb923c',
                        'Dropped / Spilled': '#fbbf24', 'Excess Prep': '#a78bfa',
                        'Customer Return': '#60a5fa',   'Other': '#9ca3af',
                      };
                      const rc = reasonColors[entry.reason] || '#9ca3af';
                      return (
                        <motion.div key={entry._id}
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                          style={{
                            background: '#0a0b0e', border: '1px solid #1a1c23',
                            borderLeft: `3px solid ${rc}66`,
                            borderRadius: 11, padding: '12px 13px',
                            display: 'flex', alignItems: 'flex-start',
                            justifyContent: 'space-between', gap: 10
                          }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#fff' }}>
                                {entry.itemName}
                              </span>
                              <span style={{
                                background: '#13151a', border: '1px solid #252932',
                                padding: '2px 8px', borderRadius: 5,
                                fontSize: '0.6rem', fontWeight: 900, color: '#d3bfa2', fontFamily: 'monospace'
                              }}>
                                {entry.quantity} {entry.unit}
                              </span>
                              <span style={{
                                background: rc + '14', border: `1px solid ${rc}33`,
                                padding: '2px 8px', borderRadius: 5,
                                fontSize: '0.58rem', fontWeight: 900,
                                color: rc, textTransform: 'uppercase', letterSpacing: 0.5
                              }}>
                                {entry.reason}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              {entry.totalCost > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', color: '#f87171', fontWeight: 800 }}>
                                  <IndianRupee size={10} /> {entry.totalCost.toFixed(2)} lost
                                </span>
                              )}
                              <span style={{ fontSize: '0.58rem', color: '#3a3e4a', fontWeight: 700 }}>
                                by {entry.loggedBy}
                              </span>
                              <span style={{ fontSize: '0.56rem', color: '#2a2e38' }}>
                                {new Date(entry.loggedAt || entry.createdAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                                })}
                              </span>
                            </div>
                            {entry.notes && (
                              <div style={{ fontSize: '0.6rem', color: '#2a2e38', marginTop: 5, fontStyle: 'italic' }}>
                                "{entry.notes}"
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteWastageEntry(entry._id)}
                            style={{ background: 'none', border: 'none', color: '#252932', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                            onMouseLeave={e => e.currentTarget.style.color = '#252932'}
                            title="Delete & restore stock">
                            <X size={14} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
 
          {/* ══════════════ MONTHLY REPORT TAB ══════════════ */}
          {wastageTab === 'report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!wastageAnalytics ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#2a2e38', fontSize: '0.75rem' }}>
                  <RefreshCw size={20} color="#1a1c23" style={{ display: 'block', margin: '0 auto 10px' }} />
                  Loading report...
                </div>
              ) : (
                <>
                  {/* KPI STRIP */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'TOTAL COST LOST', value: `₹${(wastageAnalytics.totalCost || 0).toLocaleString()}`, color: '#f87171', icon: <IndianRupee size={16} /> },
                      { label: 'ENTRIES THIS MONTH', value: wastageAnalytics.totalEntries || 0, color: '#d3bfa2', icon: <FileText size={16} /> },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: '#0a0b0e', border: '1px solid #1f222a',
                        borderTop: `2px solid ${s.color}44`, borderRadius: 12, padding: '14px 13px'
                      }}>
                        <div style={{ color: s.color, opacity: 0.5, marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color, fontFamily: 'monospace', lineHeight: 1, marginBottom: 4 }}>
                          {s.value}
                        </div>
                        <div style={{ fontSize: '0.5rem', color: '#2a2e38', fontWeight: 900, letterSpacing: 1 }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
 
                  {/* TOP WASTED ITEMS */}
                  {(wastageAnalytics.topWasted || []).length > 0 && (
                    <div style={{ background: '#0a0b0e', border: '1px solid #1f222a', borderRadius: 13, padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.58rem', fontWeight: 900, color: '#3a3e4a', letterSpacing: 1.5, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #1a1c23' }}>
                        <TrendingDown size={13} color="#f87171" /> TOP WASTED INGREDIENTS
                      </div>
                      {wastageAnalytics.topWasted.map((item, i) => (
                        <div key={item.name} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 0',
                          borderBottom: i < wastageAnalytics.topWasted.length - 1 ? '1px solid #13151a' : 'none'
                        }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                            background: i === 0 ? 'rgba(248,113,113,0.12)' : '#13151a',
                            border: `1px solid ${i === 0 ? 'rgba(248,113,113,0.25)' : '#1f222a'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: 900,
                            color: i === 0 ? '#f87171' : '#3a3e4a', fontFamily: 'monospace'
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c8ccd6' }}>{item.name}</div>
                            <div style={{ fontSize: '0.58rem', color: '#2a2e38', marginTop: 1 }}>
                              {item.count} {item.count === 1 ? 'entry' : 'entries'}
                              {item.qty > 0 && ` · ${item.qty} units`}
                            </div>
                          </div>
                          <div style={{
                            background: i === 0 ? 'rgba(248,113,113,0.1)' : '#13151a',
                            border: `1px solid ${i === 0 ? 'rgba(248,113,113,0.2)' : '#1f222a'}`,
                            padding: '3px 9px', borderRadius: 6,
                            fontSize: '0.65rem', fontWeight: 900,
                            color: i === 0 ? '#f87171' : '#3a3e4a', fontFamily: 'monospace'
                          }}>
                            {item.cost > 0 ? `₹${item.cost.toFixed(0)}` : `×${item.count}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
 
                  {/* BY REASON */}
                  {Object.keys(wastageAnalytics.byReason || {}).length > 0 && (
                    <div style={{ background: '#0a0b0e', border: '1px solid #1f222a', borderRadius: 13, padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.58rem', fontWeight: 900, color: '#3a3e4a', letterSpacing: 1.5, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #1a1c23' }}>
                        <AlertTriangle size={13} color="#fbbf24" /> BY REASON
                      </div>
                      {Object.entries(wastageAnalytics.byReason)
                        .sort((a, b) => b[1].cost - a[1].cost)
                        .map(([reason, data]) => {
                          const total = wastageAnalytics.totalEntries || 1;
                          const pct   = Math.round((data.count / total) * 100);
                          const reasonColors = {
                            'Spoiled / Expired': '#f87171', 'Overcooked': '#fb923c',
                            'Dropped / Spilled': '#fbbf24', 'Excess Prep': '#a78bfa',
                            'Customer Return': '#60a5fa', 'Other': '#9ca3af',
                          };
                          const rc = reasonColors[reason] || '#9ca3af';
                          return (
                            <div key={reason} style={{ marginBottom: 11 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#8a8f9f', display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: rc, flexShrink: 0, display: 'inline-block' }} />
                                  {reason}
                                </span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: rc, fontFamily: 'monospace' }}>
                                  {data.cost > 0 ? `₹${data.cost.toFixed(0)}` : `${data.count}×`}
                                  <span style={{ color: '#2a2e38', fontWeight: 600, marginLeft: 5 }}>{pct}%</span>
                                </span>
                              </div>
                              <div style={{ height: 4, background: '#13151a', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: rc + '80', borderRadius: 2, transition: 'width 0.6s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
 
                  {/* DAILY SPARKLINE */}
                  {(wastageAnalytics.dailyTrend || []).length > 0 && (
                    <div style={{ background: '#0a0b0e', border: '1px solid #1f222a', borderRadius: 13, padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.58rem', fontWeight: 900, color: '#3a3e4a', letterSpacing: 1.5, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #1a1c23' }}>
                        <TrendingDown size={13} color="#f87171" /> DAILY COST TREND
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
                        {(() => {
                          const maxCost = Math.max(...wastageAnalytics.dailyTrend.map(d => d.cost), 1);
                          return wastageAnalytics.dailyTrend.map((d) => (
                            <div key={d.date}
                              title={`${d.date}: ₹${d.cost.toFixed(0)} · ${d.count} entries`}
                              style={{
                                flex: 1, minWidth: 0,
                                height: `${Math.max(8, Math.round((d.cost / maxCost) * 100))}%`,
                                background: d.cost > 0 ? `rgba(248,113,113,${0.3 + (d.cost / maxCost) * 0.5})` : '#13151a',
                                borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease'
                              }}
                            />
                          ));
                        })()}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                        <span style={{ fontSize: '0.5rem', color: '#1f222a' }}>
                          {wastageAnalytics.dailyTrend[0]?.date?.slice(8)}
                        </span>
                        <span style={{ fontSize: '0.5rem', color: '#1f222a' }}>
                          {wastageAnalytics.dailyTrend[wastageAnalytics.dailyTrend.length - 1]?.date?.slice(8)}
                        </span>
                      </div>
                    </div>
                  )}
 
                  <button onClick={fetchWastageAnalytics} style={{
                    width: '100%', padding: '11px', background: 'transparent',
                    border: '1px solid rgba(211,191,162,0.15)', color: '#d3bfa2',
                    borderRadius: 9, fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>
                    <RefreshCw size={13} /> REFRESH REPORT
                  </button>
                </>
              )}
            </div>
          )}
 
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
 

      {/* ── WAITER CALLS ── */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 80 : 30,
        right: isMobile ? 12 : isTablet ? 16 : 30,
        zIndex: 2000,
        display: 'flex', flexDirection: 'column', gap: 12,
        maxWidth: isMobile ? 'calc(100vw - 24px)' : isTablet ? 320 : 400
      }}>
        <AnimatePresence>
          {waiterCalls.map(call => (
            <motion.div
              key={call.id}
              initial={{ x: 200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 200, opacity: 0 }}
              style={{
                background: 'linear-gradient(135deg,#bda88a,#d3bfa2)', color: '#0f1013',
                padding: isMobile ? '12px 16px' : '14px 24px',
                borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14,
                fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 950,
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)'
              }}>
              <div style={{ background: 'rgba(0,0,0,0.07)', padding: 8, borderRadius: 8 }}>
                <BellRing size={18} color="#000" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>TABLE {call.tableNumber}</b>: {call.reason?.toUpperCase()}
              </div>
              <X
                size={18}
                style={{ cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setWaiterCalls(prev => prev.filter(c => c.id !== call.id))} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=JetBrains+Mono:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
          body {
          margin: 0;
          background: #0d0e11;
          color: #fff;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        button { font-family: 'Outfit', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #232730; border-radius: 10px; }
        @keyframes strobePulse {
          0%   { box-shadow: 0 0 0 0 rgba(211,191,162,0.3); }
          70%  { box-shadow: 0 0 0 8px rgba(211,191,162,0); }
          100% { box-shadow: 0 0 0 0 rgba(211,191,162,0); }
        }
        .voice-pulse { animation: strobePulse 1.8s infinite; border-radius: 50%; }
        @keyframes extremeFlash {
          0%,100% { border-color: #1f222a; box-shadow: none; }
          50%      { border-color: #bda88a; box-shadow: 0 0 20px rgba(211,191,162,0.2); }
        }
        .flash-card-pulse { animation: extremeFlash 1.6s infinite ease-in-out; }

        /* Tablet: prevent header overflow */
        @media (min-width: 600px) and (max-width: 839px) {
          .kds-header-actions { flex-wrap: nowrap; overflow-x: auto; }
        }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   KDS ORDER CARD
═══════════════════════════════════════════════════════════ */
const KDSOrderCard = ({
  order, onReady, isNewest, dishToCategoryMap, dishToVegMap,
  selectedCategory, checkedItemsGlobal, setCheckedItemsGlobal,
  socketInstance, isNonVegMode, tenantOnlyVeg, isMobile, isTablet = false
}) => {
  const [seconds, setSeconds] = useState(0);
  
const [itemStartTimes, setItemStartTimes] = useState({}); 
// { idx: timestamp } — when chef tapped the item (started cooking)
const [itemElapsed, setItemElapsed] = useState({});

useEffect(() => {
  const t = setInterval(() => {
    setItemElapsed(prev => {
      const updated = {};
      Object.entries(itemStartTimes).forEach(([idx, startMs]) => {
        updated[idx] = Math.floor((Date.now() - startMs) / 1000);
      });
      return updated;
    });
  }, 1000);
  return () => clearInterval(t);
}, [itemStartTimes]);

  useEffect(() => {
    const update = () => setSeconds(Math.floor((new Date() - new Date(order.createdAt)) / 1000));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  const formatTime = (s) => {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const p   = n => n.toString().padStart(2, '0');
    return h > 0 ? `${h}h ${p(m)}m ${p(sec)}s` : `${p(m)}:${p(sec)}`;
  };

  const urgency = seconds >= 900 ? 'high' : seconds >= 450 ? 'medium' : 'low';

const toggleItemCrossed = async (idx) => {
  const key  = `${order._id}-${idx}`;
  const next = !checkedItemsGlobal[key];

  // Capture final elapsed when crossing OFF → ON
  if (next && itemStartTimes[idx]) {
    const finalSecs = Math.floor((Date.now() - itemStartTimes[idx]) / 1000);
    setItemFinalTimes(prev => ({ ...prev, [idx]: finalSecs }));
  }

  setCheckedItemsGlobal(prev => ({ ...prev, [key]: next }));
      socketInstance?.emit("kds_item_cross_sync", {
      orderId: order._id, tenantId: order.tenantId, idx, newState: next
    });
    try {
      const items = order.items.map((item, i) => i === idx ? { ...item, isCrossedLocal: next } : item);
      await axios.patch(`${BASE_URL}/admin/orders/${order._id}`, { items });
    } catch { }
  };

  // Card height: mobile fills full flex, tablet is slightly shorter than desktop
  const cardHeight = isMobile ? '100%' : isTablet ? 400 : 420;

  const cardStyle = {
    borderRadius: 18,
    padding: isMobile ? '16px' : isTablet ? '16px' : '20px',
    display: 'flex', flexDirection: 'column',
    height: cardHeight,
    border: `1px solid ${isNewest ? '#d3bfa2' : '#1f222a'}`,
    position: 'relative', overflow: 'hidden',
    background: '#13151a',
    boxShadow: isNewest ? '0 0 30px rgba(211,191,162,0.06)' : '0 4px 15px rgba(0,0,0,0.2)',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={urgency === 'high' ? 'flash-card-pulse' : ''}
      style={cardStyle}>

      {/* Urgency bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: urgency === 'low' ? '#1f222a' : urgency === 'medium' ? 'linear-gradient(90deg,#1f222a,#d3bfa2)' : '#d3bfa2'
      }} />

      {/* Card header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.8rem' : isTablet ? '1.8rem' : '2.1rem',
            margin: 0, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1
          }}>
            {order.tableNumber?.toLowerCase() === 'takeaway'
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#d3bfa2' }}>
                  <Package size={isMobile ? 20 : 22} /> PARCEL
                </span>
              : `T-${order.tableNumber}`
            }
          </h2>
          <span style={{ fontSize: '0.6rem', color: '#5c616e', fontWeight: 800 }}>
            ID: {order._id.slice(-4).toUpperCase()}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '4px 10px', borderRadius: 8,
          border: `1px solid ${urgency !== 'low' ? '#d3bfa2' : '#272a33'}`,
          background: '#0d0e11'
        }}>
          <Clock size={14} color={urgency !== 'low' ? '#d3bfa2' : '#5c616e'} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 900,
            fontSize: isMobile ? '0.9rem' : isTablet ? '0.88rem' : '1rem',
            color: urgency === 'high' ? '#d3bfa2' : '#fff'
          }}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Item list */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
        {order.items.map((item, idx) => {
          let catId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || null;
          const isVeg = item.isVeg !== undefined
            ? item.isVeg !== false
            : (dishToVegMap?.[item.name?.toLowerCase().trim()] !== false);

          if (selectedCategory !== 'ALL' && catId !== selectedCategory.toLowerCase().trim()) return null;

          const modeMatch = tenantOnlyVeg ? true : isNonVegMode ? !isVeg : isVeg;
          const crossed   = checkedItemsGlobal[`${order._id}-${idx}`];
const forceParcel =
  order.tableNumber?.toLowerCase() === 'takeaway' ||
  order.tableNumber?.toLowerCase() === 'counter' ||
  order.source === 'counter-pickup' ||
  order.source === 'takeaway' ||
  order.source === 'waitlist' ||        // waitlist pickup assigned to counter
  item.isParcel === true;
 
          if (!modeMatch) return (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0', borderBottom: '1px solid #1c1f26',
              opacity: crossed ? 0.06 : 0.2, pointerEvents: 'none', filter: 'grayscale(1)'
            }}>
              <div style={{
                width: 28, height: 28,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                borderRadius: 7, fontWeight: 900, color: '#d3bfa2',
                background: '#0d0e11', fontFamily: 'monospace', flexShrink: 0
              }}>{item.quantity}</div>
              <span style={{ fontSize: '0.82rem', color: '#444', fontWeight: 600 }}>{item.name}</span>
            </div>
          );

          return (
            <div
              key={idx}
onClick={() => {
  toggleItemCrossed(idx);
  // ── Start item timer on first tap (begin cooking) ──
  if (!checkedItemsGlobal[`${order._id}-${idx}`] && !itemStartTimes[idx]) {
    setItemStartTimes(prev => ({ ...prev, [idx]: Date.now() }));
  }
}}              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 0', borderBottom: '1px solid #1c1f26',
                cursor: 'pointer', opacity: crossed ? 0.2 : 1,
                transition: '0.15s', WebkitTapHighlightColor: 'transparent'
              }}>
              <div style={{
                width: 28, height: 28,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                borderRadius: 7,
                background: crossed ? '#0d0e11' : '#1e2129',
                fontWeight: 900, color: '#d3bfa2', flexShrink: 0, fontFamily: 'monospace'
              }}>
                {item.quantity}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: isMobile ? '0.88rem' : isTablet ? '0.86rem' : '0.95rem',
                    fontWeight: 700, lineHeight: 1.3,
                    textDecoration: crossed ? 'line-through' : 'none',
                    color: item.isChefSpecial ? '#0f1013' : '#fff',
                    background: item.isChefSpecial ? 'linear-gradient(135deg,#bda88a,#d3bfa2)' : 'transparent',
                    padding: item.isChefSpecial ? '2px 7px' : 0,
                    borderRadius: item.isChefSpecial ? 5 : 0
                  }}>
                    {item.isChefSpecial && <Sparkles size={11} style={{ display: 'inline', marginRight: 3 }} />}
                    {item.name}
                  </span>
                  {!tenantOnlyVeg && (
                    <div style={{
                      width: 10, height: 10,
                      border: `1.5px solid ${isVeg ? '#4a7c3f' : '#8a3030'}`,
                      borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {isVeg
                        ? <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4a7c3f' }} />
                        : <div style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '4px solid #8a3030' }} />
                      }
                    </div>
                  )}
                  <div style={{
                    background: forceParcel ? 'rgba(211,191,162,0.06)' : 'rgba(255,255,255,0.03)',
                    color: forceParcel ? '#d3bfa2' : '#a0a5b5',
                    fontSize: '0.5rem', padding: '2px 5px', borderRadius: 4,
                    border: `1px solid ${forceParcel ? 'rgba(211,191,162,0.12)' : '#232731'}`,
                    fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2
                  }}>
                    {forceParcel ? <Package size={9} /> : <UtensilsCrossed size={9} />}
                    {forceParcel ? 'PARCEL' : 'DINE-IN'}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 900,
                  color: item.portion?.toLowerCase() === 'half' ? '#d3bfa2' : '#7c8291',
                  display: 'block', marginTop: 2
                }}>
                  {item.portion?.toUpperCase() || 'STANDARD'}
                </span>

                {/* ── ITEM-LEVEL COOK TIMER ── */}
{itemStartTimes[idx] && !checkedItemsGlobal[`${order._id}-${idx}`] && (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    marginTop: 4,
    fontSize: '0.55rem', fontWeight: 900,
    color: (itemElapsed[idx]||0) >= 300 ? '#d3bfa2' : 'rgba(211,191,162,0.4)',
    background: (itemElapsed[idx]||0) >= 300 ? 'rgba(211,191,162,0.08)' : 'transparent',
    padding: (itemElapsed[idx]||0) >= 300 ? '2px 6px' : '0',
    borderRadius: 4,
    border: (itemElapsed[idx]||0) >= 300 ? '1px solid rgba(211,191,162,0.2)' : 'none',
    fontFamily: 'monospace'
  }}>
    <Timer size={9} />
    {(() => {
      const s = itemElapsed[idx] || 0;
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2,'0')}`;
    })()}
{(itemElapsed[idx]||0) >= 300 && (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.48rem', letterSpacing: '0.5px' }}>
        <AlertTriangle size={8} strokeWidth={2.5} /> SLOW
      </span>
    )}
  </div>
)}
{checkedItemsGlobal[`${order._id}-${idx}`] && itemStartTimes[idx] && (() => {
  const s = itemFinalTimes[idx] ?? (itemElapsed[idx] || 0);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
      fontSize: '0.55rem', fontWeight: 900, color: '#555', fontFamily: 'monospace' }}>
      <Timer size={9} />
      Done in {Math.floor(s / 60)}m {s % 60}s
    </div>
  );
})()}
                {item.suggestion && (
                  <div style={{
                    color: '#bda88a', fontSize: '0.62rem', marginTop: 4,
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(211,191,162,0.04)', padding: '4px 8px',
                    borderRadius: 6, border: '1px solid rgba(211,191,162,0.08)'
                  }}>
                    <StickyNote size={9} />
                    <span style={{ textTransform: 'uppercase' }}>{item.suggestion}</span>
                  </div>
                )}

                
              </div>
              {crossed && <CheckSquare size={16} color="#d3bfa2" style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>

      {/* Done button */}
      <button
        onClick={() => onReady(order._id)}
        style={{
          width: '100%',
          padding: isMobile ? '16px' : isTablet ? '13px' : '14px',
          borderRadius: 12,
          border: '1px solid rgba(211,191,162,0.3)',
          fontWeight: 900,
          fontSize: isMobile ? '0.9rem' : isTablet ? '0.78rem' : '0.8rem',
          cursor: 'pointer', marginTop: 12,
          textTransform: 'uppercase', letterSpacing: '0.5px', transition: '0.15s',
          background: urgency === 'high' ? 'linear-gradient(135deg,#bda88a,#d3bfa2)' : 'transparent',
          color: urgency === 'high' ? '#0f1013' : '#d3bfa2',
          minHeight: 48
        }}>
<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          {urgency === 'high' && <Flame size={15} color="#0f1013" strokeWidth={2.5} />}
          {urgency === 'high' ? 'OVERDUE — DISPATCH NOW' : 'COMPLETE TICKET'}
        </span>
              </button>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────
   STYLE TOKENS
   All values are static — breakpoint-dependent values are
   applied inline in JSX using isMobile / isTablet flags.
───────────────────────────────────────────────────────────── */
const rs = {
  /* shell */
  root: {
    position: 'fixed', inset: 0,
    display: 'flex', flexDirection: 'column',
    background: '#0d0e11', padding: '10px', gap: 8,
    overflow: 'hidden'
  },

  /* header */
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#13151a', padding: '10px 14px',
    borderRadius: 12, border: '1px solid #1f222a',
    flexShrink: 0, zIndex: 10, gap: 8,
    /* Allow scrolling on very narrow tablets without wrapping */
    overflowX: 'hidden',
    minHeight: 52,
  },
  brandCluster: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  logoBadge: {
    background: '#0d0e11', padding: '7px', borderRadius: 9,
    border: '1px solid #1f222a', flexShrink: 0
  },
  mainTitle: { margin: 0, fontWeight: 900, letterSpacing: '0.5px', fontFamily: "'Outfit', sans-serif" },
  dotGold: { width: 6, height: 6, background: '#d3bfa2', borderRadius: '50%', boxShadow: '0 0 8px #d3bfa2', flexShrink: 0 },
  dotRed:  { width: 6, height: 6, background: '#ff4d4d', borderRadius: '50%', boxShadow: '0 0 8px #ff4d4d', flexShrink: 0 },
  subTitle: { color: '#5c616e', margin: 0, fontSize: '0.56rem', letterSpacing: '2px', fontWeight: 800 },

  actionCenter: {
    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
    overflowX: 'auto', /* allow scroll when many buttons on small tablet */
    /* hide native scrollbar */
    msOverflowStyle: 'none', scrollbarWidth: 'none',
  },
  utilBtn: {
    background: '#191b22', border: '1px solid #252932', color: '#fff',
    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 5, transition: '0.15s',
    flexShrink: 0, minHeight: 38,
  },
  iconBtn: {
    background: '#191b22', border: '1px solid #252932', padding: '8px',
    borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0
  },
  ticketBadge: {
    background: 'linear-gradient(135deg,#bda88a,#d3bfa2)',
    padding: '6px 12px', borderRadius: 8,
    display: 'flex', alignItems: 'center', flexShrink: 0, minHeight: 38, justifyContent: 'center'
  },
  ticketNum: { color: '#0f1013', fontSize: '1.1rem', fontWeight: 950, fontFamily: 'JetBrains Mono, monospace' },

  stationCapsule: {
    display: 'flex', background: '#0d0e11', padding: 3, borderRadius: 9, border: '1px solid #1f222a'
  },
  capsule: {
    padding: '6px 10px', background: 'transparent', border: 'none',
    color: '#5c616e', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer',
    borderRadius: 7, whiteSpace: 'nowrap'
  },
  capsuleActive: {
    padding: '6px 10px', background: 'rgba(211,191,162,0.08)', border: 'none',
    color: '#d3bfa2', fontSize: '0.6rem', fontWeight: 900,
    borderRadius: 7, whiteSpace: 'nowrap'
  },

  /* marquee */
  marquee: {
    display: 'flex', alignItems: 'center',
    background: '#0a0a0c', border: '1px solid #191b22',
    padding: '8px 14px', borderRadius: 9, gap: 10, overflow: 'hidden', flexShrink: 0
  },
  marqueeLabel: {
    fontSize: '0.6rem', fontWeight: 900, color: '#bda88a', letterSpacing: '1px',
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0
  },
  marqueeToken: {
    background: '#13151a', border: '1px solid #1f222a',
    padding: '3px 9px', borderRadius: 6, display: 'flex', gap: 5, alignItems: 'center'
  },

  /* alerts */
  alertBox: {
    background: '#541717', border: '1px solid #ff4d4d',
    padding: '14px 20px', borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)', flexShrink: 0
  },

  /* body */
  body: { display: 'flex', flex: 1, gap: 12, overflow: 'hidden', minHeight: 0 },

  /* sidebar (permanent) */
  sidebar: {
    background: '#13151a', border: '1px solid #1f222a',
    borderRadius: 12, display: 'flex', flexDirection: 'column',
    padding: '14px 10px', flexShrink: 0, height: '100%', overflowY: 'auto'
  },
  sidebarHeader: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontSize: '0.6rem', fontWeight: 900, color: '#5c616e', letterSpacing: '1.5px',
    marginBottom: 12, borderBottom: '1px solid #1f222a', paddingBottom: 10
  },
  sidebarStack: { display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1 },
  sidebarNode: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 10px', background: '#171921', border: '1px solid #20242e',
    color: '#8e94a4', width: '100%', textAlign: 'left',
    borderRadius: 8, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
    transition: 'all 0.15s', minHeight: 44
  },
  activeSidebarNode: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 10px', background: 'linear-gradient(135deg,#bda88a,#d3bfa2)',
    border: 'none', color: '#0f1013', width: '100%', textAlign: 'left',
    borderRadius: 8, fontSize: '0.7rem', fontWeight: 950,
    boxShadow: '0 4px 12px rgba(211,191,162,0.12)', minHeight: 44
  },
  countBadge: { fontSize: '0.6rem', padding: '3px 6px', borderRadius: 5, fontWeight: 900, border: '1px solid #232730' },
  mini86: {
    padding: '3px', cursor: 'pointer', display: 'inline-flex',
    background: 'rgba(255,255,255,0.01)', border: '1px solid #232730',
    borderRadius: 5, color: '#444', transition: '0.2s'
  },
  vegToggleWrap: {
    display: 'flex', background: '#0d0e11', borderRadius: 8,
    border: '1px solid #1f222a', padding: 3, marginBottom: 10, flexShrink: 0
  },
  vegBtn: {
    flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 5, background: 'transparent', color: '#555', transition: 'all 0.15s'
  },
  vegBtnActiveV:  { background: 'linear-gradient(135deg,#2a4a28,#3a6435)', color: '#7ec87a' },
  vegBtnActiveNV: { background: 'rgba(138,48,48,0.35)', color: '#e07070' },

  /* workspace */
  workspace: { flex: 1, overflowY: 'auto', minWidth: 0 },

  /* metrics */
  metricsPanel: {
    background: '#13151a', border: '1px solid #1f222a',
    padding: '36px 16px', borderRadius: 16,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100%'
  },
  metricBox: {
    background: '#0d0e11', border: '1px solid #1f222a',
    padding: '24px 16px', borderRadius: 12, flex: 1, textAlign: 'center'
  },
  metricClose: {
    marginTop: 28, background: 'transparent',
    border: '1px solid rgba(211,191,162,0.25)', color: '#d3bfa2',
    padding: '11px 26px', borderRadius: 9, fontSize: '0.76rem', fontWeight: 900,
    cursor: 'pointer', minHeight: 44
  },

  /* aggregate */
  aggCard: {
    background: '#13151a', padding: '20px 14px', borderRadius: 12,
    border: '1px solid #1f222a', textAlign: 'center'
  },

  /* mobile bottom bar */
  mobileBottomBar: {
    display: 'flex', background: '#13151a', border: '1px solid #1f222a',
    borderRadius: 12, padding: '3px', flexShrink: 0, gap: 2
  },
  bottomBarBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '9px 3px', background: 'transparent', border: 'none',
    cursor: 'pointer', transition: '0.15s', borderRadius: 9, gap: 2, minHeight: 50
  },

  /* mobile nav buttons */
  navBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: '#191b22', border: '1px solid #252932', color: '#d3bfa2',
    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
    fontSize: '0.72rem', fontWeight: 800, minHeight: 44
  },
};

const wInput = {
  width: '100%', padding: '10px 11px',
  background: '#13151a', border: '1px solid #252932',
  color: '#fff', borderRadius: 9, fontSize: '0.82rem',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Outfit', sans-serif"
};
 
const wFormLabel = {
  display: 'block', fontSize: '0.55rem', color: '#3a3e4a',
  fontWeight: 900, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase'
};

export default KitchenView;