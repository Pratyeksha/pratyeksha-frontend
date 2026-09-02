import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Timer, Hourglass, BellRing, StickyNote,
  X, Zap, History, LayoutGrid, BarChart3,
  Package, UtensilsCrossed, Clock, CheckSquare,
  Activity, Monitor, Coffee, Layers, Flame, Mic, EyeOff, Sparkles, TrendingUp, WifiOff,
  AlignJustify, Trash2, AlertTriangle, RotateCcw,
  TrendingDown, RefreshCw, Search, ChevronLeft, ChevronRight,
  CheckCircle2, ArrowRight, Scale, FileText, Droplets, FlameKindling
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

/* ─── helpers ─── */
const useWindowSize = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const h = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return size;
};

const useSwipe = (onLeft, onRight) => {
  const tx = useRef(null);
  return {
    onTouchStart: e => { tx.current = e.touches[0].clientX; },
    onTouchEnd:   e => {
      if (tx.current === null) return;
      const diff = tx.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 48) diff > 0 ? onLeft?.() : onRight?.();
      tx.current = null;
    }
  };
};

const getOrderType = order => {
  if (order.source === 'swiggy')          return 'swiggy';
  if (order.source === 'zomato')          return 'zomato';
  if (order.source === 'counter-pickup' || order.source === 'takeaway'
    || order.tableNumber?.toLowerCase() === 'takeaway'
    || order.tableNumber?.toLowerCase() === 'counter')  return 'parcel';
  return 'dine-in'; // waitlist, reservation, direct all → dine-in
};

const fmt = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = n => n.toString().padStart(2,'0');
  return h > 0 ? `${h}h ${p(m)}m` : `${p(m)}:${p(sec)}`;
};

const REASON_OPTIONS = ['Spoiled / Expired','Overcooked','Dropped / Spilled','Excess Prep','Customer Return','Other'];
const UNIT_OPTIONS   = ['kg','g','litre','ml','pcs','plate','portion'];

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const KitchenView = () => {
  const { tenantId } = useParams();
  const { w }        = useWindowSize();

  const isMobile      = w < 600;
  const isSmallTablet = w >= 600  && w < 840;
  const isLargeTablet = w >= 840  && w < 1200;
  const isTablet      = w >= 600  && w < 1200;
  const isDesktop     = w >= 1200;

  /* ── state ── */
  const [orders,               setOrders]               = useState([]);
  const [waiterCalls,          setWaiterCalls]          = useState([]);
  const [recallQueue,          setRecallQueue]          = useState([]);
  const [isAggregateView,      setIsAggregateView]      = useState(false);
  const [isNonVegMode,         setIsNonVegMode]         = useState(false);
  const [tenantOnlyVeg,        setTenantOnlyVeg]        = useState(true);
  const [categories,           setCategories]           = useState([]);
  const [menuItems,            setMenuItems]            = useState([]);
  const [selectedCategory,     setSelectedCategory]     = useState('ALL');
  const [stationFilter,        setStationFilter]        = useState('ALL');
  const [checkedItemsGlobal,   setCheckedItemsGlobal]   = useState({});
  const [isListening,          setIsListening]          = useState(false);
  const [interceptedAlerts,    setInterceptedAlerts]    = useState([]);
  const [showMetricsDashboard, setShowMetricsDashboard] = useState(false);
  const [isOnline,             setIsOnline]             = useState(navigator.onLine);
  const [sidebarOpen,          setSidebarOpen]          = useState(false);
  const [mobileCardIndex,      setMobileCardIndex]      = useState(0);
  const [completedTicketsCount,setCompletedTicketsCount]= useState(0);
  const [totalProcessingTime,  setTotalProcessingTime]  = useState(0);
  const [showWastagePanel,     setShowWastagePanel]     = useState(false);
  const [wastageTab,           setWastageTab]           = useState('log');
  const [wastageForm,          setWastageForm]          = useState({ itemName:'', inventoryId:null, quantity:'', unit:'kg', reason:'Spoiled / Expired', loggedBy:'', notes:'' });
  const [wastageSuggestions,   setWastageSuggestions]   = useState([]);
  const [showWastageSuggest,   setShowWastageSuggest]   = useState(false);
  const [wastageInventory,     setWastageInventory]     = useState([]);
  const [wastageLog,           setWastageLog]           = useState([]);
  const [wastageAnalytics,     setWastageAnalytics]     = useState(null);
  const [wastageSaving,        setWastageSaving]        = useState(false);
  const [wastageLoading,       setWastageLoading]       = useState(false);
  const [kitchenHealth,        setKitchenHealth]        = useState(null);
  const [itemFinalTimes,       setItemFinalTimes]       = useState({});
  const [searchQuery,          setSearchQuery]          = useState('');
  const [showSearch,           setShowSearch]           = useState(false);
  const [waiterCallTimer,      setWaiterCallTimer]      = useState({});
  const [tenantName,           setTenantName]           = useState('');

  /* ── refs ── */
  const audioPlayer    = useRef(null);
  const alertPlayer    = useRef(null);
  const recognitionRef = useRef(null);
  const socketRef      = useRef(null);
  const speechQueueRef = useRef([]);
  const isSpeakingRef  = useRef(false);
  const synthVoicesRef = useRef([]);

  /* ── voice setup ── */
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => { synthVoicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const processSpeechQueue = () => {
    if (!speechQueueRef.current.length) { isSpeakingRef.current = false; return; }
    isSpeakingRef.current = true;
    const next = speechQueueRef.current.shift();
    next.onend = next.onerror = processSpeechQueue;
    window.speechSynthesis.speak(next);
  };

  const speakOrder = order => {
    if (!('speechSynthesis' in window)) return;
    const otype = getOrderType(order);
    let text = otype === 'swiggy' ? 'Chef, new Swiggy order. '
             : otype === 'zomato' ? 'Chef, new Zomato order. '
             : otype === 'parcel' ? 'Chef, new pickup order. '
             : `Chef, new ticket for Table ${order.tableNumber}. `;
    text += order.items.filter(i => !i.isExtraItem && i.extraItemId == null).map(i => {
      const portion = (i.portion && i.portion.toLowerCase() !== 'single') ? `${i.portion} ` : '';
      const tag = otype === 'parcel' ? 'Parcel' : 'Dine in';
      let d = `${i.quantity} ${portion}${i.name} ${tag}`;
      if (i.suggestion?.trim()) d += `. Note: ${i.suggestion}`;
      return d;
    }).join('. ');
    const utt = new SpeechSynthesisUtterance(text);
    const voices = synthVoicesRef.current;
    const v = voices.find(v => v.lang === 'en-IN')
           || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('india'))
           || voices[0];
    if (v) utt.voice = v;
    utt.rate = 0.88; utt.pitch = 1.02;
    speechQueueRef.current.push(utt);
    if (!isSpeakingRef.current) processSpeechQueue();
  };

  const fetchHealth = async () => {
    try {
      const r = await axios.get(`${BASE_URL}/admin/analytics/kitchen-health/${tenantId}`);
      setKitchenHealth(r.data);
    } catch {}
  };

  const fetchActiveOrders = async () => {
    try {
      const [ordersRes, catRes, menuRes, tenantRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`),
        axios.get(`${BASE_URL}/categories/${tenantId}`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/menu/${tenantId}`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/tenant/${tenantId}`).catch(() => ({ data: null })),
      ]);
      const incoming = (ordersRes.data || []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(incoming);
      setCategories(catRes.data  || []);
      setMenuItems(menuRes.data  || []);
      if (tenantRes.data?.name)                              setTenantName(tenantRes.data.name);
      if (tenantRes.data?.config?.onlyVeg !== undefined)     setTenantOnlyVeg(tenantRes.data.config.onlyVeg);
      const hydrationMap = {};
      incoming.forEach(o => o.items?.forEach((item,idx) => { if (item.isCrossedLocal) hydrationMap[`${o._id}-${idx}`] = true; }));
      setCheckedItemsGlobal(hydrationMap);
      fetchHealth();
    } catch (err) { console.error('KDS fetch:', err.message); }
  };

  /* ── voice recognition ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = false; rec.lang = 'hi-IN';
    rec.onresult = e => {
      const txt = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      const isCompleteCmd = txt.includes('complete table') || txt.includes('ready table')
        || txt.includes('टेबल तयार') || txt.includes('तयार टेबल')
        || txt.includes('पूर्ण टेबल') || txt.includes('आर्डर तयार');
      if (isCompleteCmd) {
        const mNums = { 'एक':1,'दोन':2,'तीन':3,'चार':4,'पाच':5,'सहा':6,'सात':7,'आठ':8,'नऊ':9,'दहा':10 };
        let tNum = null;
        Object.entries(mNums).forEach(([w,n]) => { if (txt.includes(w)) tNum = n.toString(); });
        if (!tNum) { const m = txt.match(/(?:table|ready|complete|तयार|पूर्ण)\s*(\w+)/); if (m?.[1]) tNum = m[1].toUpperCase(); }
        if (tNum) { const o = orders.find(x => x.tableNumber?.toString().toUpperCase() === tNum.toUpperCase()); if (o) markAsReady(o._id); }
      }
      if (txt.includes('recall last') || txt.includes('परत आण')) handleRecall();
      if (txt.includes('show summary') || txt.includes('सारांश')) setIsAggregateView(v => !v);
    };
    rec.onerror = rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [orders, recallQueue]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return alert('Speech recognition not supported.');
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else             { recognitionRef.current.start(); setIsListening(true); }
  };

  /* ── main effect: socket + initial fetch ── */
  useEffect(() => {
    if (!tenantId) return;
    const today = new Date().toISOString().split('T')[0];
    const prevDay = localStorage.getItem(`kds_operational_date_${tenantId}`);
    if (prevDay !== today) {
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

    const socket = io('https://pratyeksha-backend.onrender.com', { transports: ['polling','websocket'] });
    socketRef.current = socket;
    socket.emit('join_restaurant', tenantId);
    socket.on('connect',    () => setIsOnline(true));
    socket.on('disconnect', () => setIsOnline(false));

    socket.on('new_order', newOrder => {
      if (newOrder.tenantId !== tenantId) return;
      const kitchenItems = (newOrder.items || []).filter(i => !i.isExtraItem && i.extraItemId == null);
      if (!kitchenItems.length) return;
      const allExtra = kitchenItems.every(i => i.isExtraItem === true || i.extraItemId != null);
      if (allExtra) return;
      const cleanOrder = { ...newOrder, items: kitchenItems };
      setOrders(prev => [cleanOrder, ...prev]);
      setMobileCardIndex(0);
      const otype = getOrderType(cleanOrder);
      if (otype === 'swiggy' || otype === 'zomato')
        new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
      else audioPlayer.current?.play().catch(() => {});
      speakOrder(cleanOrder);
    });

    socket.on('kds_item_cross_sync', data => {
      if (data.tenantId !== tenantId) return;
      setOrders(prev => prev.map(o => {
        if (o._id !== data.orderId) return o;
        const items = o.items.map((it,i) => i === data.idx ? { ...it, isCrossedLocal: data.newState } : it);
        return { ...o, items };
      }));
    });

    socket.on('order_modification_detected', data => {
      if (data.tenantId !== tenantId) return;
      alertPlayer.current?.play().catch(() => {});
      setInterceptedAlerts(prev => [{ id: Date.now(), ...data }, ...prev]);
      fetchActiveOrders();
    });

    socket.on('waiter_called', data => {
      if (data.tenantId === tenantId) {
        const id = Date.now();
        setWaiterCalls(prev => [{ id, ...data }, ...prev]);
        // auto-dismiss after 60s
        setTimeout(() => setWaiterCalls(prev => prev.filter(c => c.id !== id)), 60000);
      }
    });

    socket.on('new_waiter_request', data => {
      if (data.tenantId === tenantId) {
        const id = Date.now();
        setWaiterCalls(prev => [{ id, ...data }, ...prev]);
        setTimeout(() => setWaiterCalls(prev => prev.filter(c => c.id !== id)), 60000);
      }
    });

    return () => {
      ['new_order','kds_item_cross_sync','order_modification_detected','waiter_called','new_waiter_request']
        .forEach(ev => socket.off(ev));
      socket.disconnect();
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [tenantId]);

  /* ── actions ── */
  const markAsReady = async orderId => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    setRecallQueue(prev => [order, ...prev].slice(0, 10));
    const dur = Math.floor((Date.now() - new Date(order.createdAt)) / 1000);
    setTotalProcessingTime(prev  => { const n = prev + dur;  localStorage.setItem(`kds_processing_time_${tenantId}`, n); return n; });
    setCompletedTicketsCount(prev => { const n = prev + 1;   localStorage.setItem(`kds_completed_count_${tenantId}`, n); return n; });
    if (mobileCardIndex > 0) setMobileCardIndex(i => i - 1);
    try {
      await axios.patch(`${BASE_URL}/admin/orders/${orderId}`, { status: 'ready' });
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err) { console.error(err); }
  };

  const handleRecall = () => {
    if (!recallQueue.length) return;
    setOrders(prev => [recallQueue[0], ...prev]);
    setRecallQueue(prev => prev.slice(1));
    setCompletedTicketsCount(prev => { const n = Math.max(0,prev-1); localStorage.setItem(`kds_completed_count_${tenantId}`,n); return n; });
  };

  const trigger86 = async itemName => {
    const node = menuItems.find(m => m.name.toLowerCase().trim() === itemName.toLowerCase().trim());
    if (!node) return;
    if (!window.confirm(`86 "${itemName}" on customer menus?`)) return;
    try {
      await axios.patch(`${BASE_URL}/menu-item/${node._id}`, { isAvailable: false });
      alert(`"${itemName}" — 86 Active on customer menus.`);
      fetchActiveOrders();
    } catch { alert('Could not update item.'); }
  };

  /* ── derived maps ── */
  const dishToVegMap = useMemo(() => {
    const m = {};
    menuItems.forEach(item => { if (item.name) m[item.name.toLowerCase().trim()] = item.isVeg !== false; });
    return m;
  }, [menuItems]);

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
      if (!p[cId]) p[cId] = { hasVeg:false, hasNonVeg:false };
      if (item.isVeg !== false) p[cId].hasVeg = true; else p[cId].hasNonVeg = true;
    });
    return p;
  }, [menuItems]);

  const categoryPendingCounts = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
      if (!['pending','ready'].includes(order.status)) return;
      const otype = getOrderType(order);
      if (stationFilter === 'DINEIN'  && otype !== 'dine-in') return;
      if (stationFilter === 'PARCEL'  && otype !== 'parcel')  return;
      order.items.forEach((item,idx) => {
        if (item.isExtraItem || item.extraItemId != null) return;
        const fId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || null;
        if (!fId) return;
        const isVeg = item.isVeg !== undefined ? item.isVeg !== false : dishToVegMap[item.name?.toLowerCase().trim()] !== false;
        const matches = isNonVegMode ? !isVeg : isVeg;
        if (matches && !checkedItemsGlobal[`${order._id}-${idx}`]) counts[fId] = (counts[fId]||0) + (Number(item.quantity)||1);
      });
    });
    return counts;
  }, [orders, stationFilter, dishToCategoryMap, dishToVegMap, checkedItemsGlobal, isNonVegMode]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const hasKitchenItems = order.items?.some(i => !i.isExtraItem && i.extraItemId == null);
      if (!hasKitchenItems) return false;
      const otype = getOrderType(order);
      if (stationFilter === 'DINEIN' && otype !== 'dine-in') return false;
      if (stationFilter === 'PARCEL' && otype !== 'parcel')  return false;
      if (isNonVegMode) {
        const hasNV = order.items.some(item => {
          const isVeg = item.isVeg !== undefined ? item.isVeg !== false : dishToVegMap[item.name?.toLowerCase().trim()] !== false;
          return !isVeg;
        });
        if (!hasNV) return false;
      }
      const isAgg = otype === 'swiggy' || otype === 'zomato';
      if (selectedCategory !== 'ALL' && !isAgg) {
        const sel = selectedCategory.toLowerCase().trim();
        const hasMatch = order.items?.some(item => {
          if (item.isExtraItem || item.extraItemId != null) return false;
          const cId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || '';
          return cId === sel;
        });
        if (!hasMatch) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTable  = order.tableNumber?.toString().toLowerCase().includes(q);
        const matchSource = order.source?.toLowerCase().includes(q);
        const matchItem   = order.items?.some(i => i.name?.toLowerCase().includes(q));
        if (!matchTable && !matchSource && !matchItem) return false;
      }
      return true;
    });
  }, [orders, stationFilter, selectedCategory, dishToCategoryMap, dishToVegMap, isNonVegMode, searchQuery]);

  const aggregatedTotals = useMemo(() => {
    const totals = {};
    orders.forEach(o => o.items.filter(i => !i.isExtraItem && i.extraItemId == null).forEach((i,idx) => {
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
      const otype = getOrderType(o);
      const isP = otype === 'parcel';
      const portion = (i.portion && i.portion.toLowerCase() !== 'single') ? ` (${i.portion})` : '';
      const key = `${i.name}${portion}__${isP ? 'P' : 'D'}`;
      totals[key] = (totals[key]||0) + i.quantity;
    }));
    return totals;
  }, [orders, checkedItemsGlobal]);

  const masterPrepMarqueeList = useMemo(() => {
    const m = {};
    filteredOrders.forEach(o => o.items.filter(i => !i.isExtraItem && i.extraItemId == null).forEach((i,idx) => {
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
      m[i.name] = (m[i.name]||0) + i.quantity;
    }));
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,7);
  }, [filteredOrders, checkedItemsGlobal]);

  const avgClearTime = useMemo(() => {
    if (!completedTicketsCount) return '—';
    const avg = Math.floor(totalProcessingTime / completedTicketsCount);
    return `${Math.floor(avg/60)}m ${avg%60}s`;
  }, [totalProcessingTime, completedTicketsCount]);

  const visibleCategories = useMemo(() => {
    return categories.filter(cat => {
      const k = cat.categoryId?.toLowerCase().trim() || '';
      if (!k) return false;
      if (categoryPendingCounts[k] > 0) return true;
      const profile = categoryVegProfile[k];
      if (!profile) return false;
      if (tenantOnlyVeg) return profile.hasVeg;
      return isNonVegMode ? profile.hasNonVeg : profile.hasVeg;
    });
  }, [categories, categoryPendingCounts, categoryVegProfile, tenantOnlyVeg, isNonVegMode]);

  /* ── wastage ── */
  const fetchWastageInventory = useCallback(async () => {
    try { const r = await axios.get(`${BASE_URL}/inventory/${tenantId}`); setWastageInventory(r.data||[]); } catch { setWastageInventory([]); }
  }, [tenantId]);
  const fetchWastageLog = useCallback(async () => {
    setWastageLoading(true);
    try { const r = await axios.get(`${BASE_URL}/wastage/${tenantId}`); setWastageLog(r.data||[]); } catch { setWastageLog([]); } finally { setWastageLoading(false); }
  }, [tenantId]);
  const fetchWastageAnalytics = useCallback(async () => {
    try { const r = await axios.get(`${BASE_URL}/wastage/analytics/${tenantId}`); setWastageAnalytics(r.data||null); } catch { setWastageAnalytics(null); }
  }, [tenantId]);
  useEffect(() => { if (showWastagePanel) { fetchWastageInventory(); fetchWastageLog(); if (wastageTab==='report') fetchWastageAnalytics(); } }, [showWastagePanel]);
  useEffect(() => { if (showWastagePanel && wastageTab==='report') fetchWastageAnalytics(); }, [wastageTab, showWastagePanel]);

  const saveWastageEntry = async () => {
    const { itemName,quantity,unit,reason,loggedBy } = wastageForm;
    if (!itemName.trim() || !quantity || !loggedBy.trim()) return;
    setWastageSaving(true);
    try {
      await axios.post(`${BASE_URL}/wastage/${tenantId}`, {
        itemName: itemName.trim(), inventoryId: wastageForm.inventoryId||undefined,
        quantity: Number(quantity), unit, reason, loggedBy: loggedBy.trim(), notes: wastageForm.notes||''
      });
      setWastageForm(p => ({ itemName:'', inventoryId:null, quantity:'', unit:'kg', reason:'Spoiled / Expired', loggedBy:p.loggedBy, notes:'' }));
      setWastageSuggestions([]); setShowWastageSuggest(false);
      fetchWastageLog(); fetchWastageInventory();
    } catch (err) { console.error(err.message); }
    finally { setWastageSaving(false); }
  };

  const deleteWastageEntry = async id => {
    try { await axios.delete(`${BASE_URL}/wastage/${tenantId}/${id}`); setWastageLog(prev => prev.filter(e => e._id !== id)); } catch {}
  };

  /* ── breakpoint helpers ── */
  const showDrawerToggle  = isMobile || isSmallTablet;
  const showPermanentSide = isLargeTablet || isDesktop;
  const useCardView       = isMobile;
  const safeCardIndex     = Math.min(mobileCardIndex, Math.max(0, filteredOrders.length - 1));
  const swipeHandlers     = useSwipe(
    () => setMobileCardIndex(i => Math.min(i + 1, filteredOrders.length - 1)),
    () => setMobileCardIndex(i => Math.max(i - 1, 0))
  );

  const gridCols = isMobile ? 1 : isSmallTablet ? 2 : isLargeTablet ? 3 : 3;

  /* ─── SIDEBAR CONTENT ─────────────────────────────────────────── */
  const SidebarContent = ({ inDrawer = false }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:0 }}>
      {/* top */}
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:14, borderBottom:'1px solid rgba(211,191,162,0.07)', marginBottom:14, flexShrink:0 }}>
        <div style={rs.sidebarHeaderIcon}><Layers size={14} color="#d3bfa2" /></div>
        <span style={{ fontSize:'0.56rem', fontWeight:900, color:'rgba(211,191,162,0.35)', letterSpacing:'2.5px', flex:1, textTransform:'uppercase' }}>STATIONS</span>
        {inDrawer && (
          <button onClick={() => setSidebarOpen(false)} style={{ background:'rgba(211,191,162,0.04)', border:'1px solid rgba(211,191,162,0.1)', color:'#555', cursor:'pointer', padding:'7px', borderRadius:8, display:'flex', alignItems:'center', transition:'all 0.15s' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* veg / non-veg toggle */}
      {!tenantOnlyVeg && (
        <div style={{ display:'flex', background:'#070709', borderRadius:9, border:'1px solid rgba(211,191,162,0.07)', padding:3, marginBottom:10, flexShrink:0 }}>
          {[false,true].map(nv => (
            <button key={String(nv)} onClick={() => { setIsNonVegMode(nv); setSelectedCategory('ALL'); }}
              style={{ flex:1, padding:'7px 4px', borderRadius:7, border:'none', cursor:'pointer', fontSize:'0.58rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.15s',
                background: isNonVegMode===nv ? (nv ? 'rgba(138,48,48,0.3)' : 'rgba(42,74,40,0.35)') : 'transparent',
                color: isNonVegMode===nv ? (nv ? '#e07070' : '#7ec87a') : '#3a3e4a' }}>
              <div style={{ width:10, height:10, border:`1.5px solid ${isNonVegMode===nv ? (nv?'#e07070':'#7ec87a') : '#333'}`, borderRadius:nv?2:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {nv ? <div style={{ width:0, height:0, borderLeft:'2.5px solid transparent', borderRight:'2.5px solid transparent', borderBottom:`4.5px solid ${isNonVegMode?'#e07070':'#333'}` }} />
                    : <div style={{ width:4, height:4, borderRadius:'50%', background:!isNonVegMode?'#7ec87a':'#333' }} />}
              </div>
              {nv ? 'NON-VEG' : 'VEG'}
            </button>
          ))}
        </div>
      )}

      {/* section list */}
      <div style={{ display:'flex', flexDirection:'column', gap:4, overflowY:'auto', flex:1 }} className="no-scrollbar">
        {/* ALL */}
        {(() => {
          const sel = selectedCategory === 'ALL' && !showMetricsDashboard;
          const total = orders.filter(o => ['pending','ready'].includes(o.status)).length;
          return (
            <button onClick={() => { setSelectedCategory('ALL'); setShowMetricsDashboard(false); setSidebarOpen(false); }} style={{ ...rs.sidebarBtn(sel), justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Coffee size={12} color={sel?'#0f1013':'#555'} />
                <span>ALL SECTIONS</span>
              </div>
              <span style={{ ...rs.countChip(sel, total>0), minWidth:24, textAlign:'center' }}>{total<10?`0${total}`:total}</span>
            </button>
          );
        })()}

        {visibleCategories.map(cat => {
          const k = cat.categoryId?.toLowerCase().trim() || '';
          const count = categoryPendingCounts[k] || 0;
          const sel = selectedCategory === k && !showMetricsDashboard;
          return (
            <button key={cat._id} onClick={() => { setSelectedCategory(k); setShowMetricsDashboard(false); setSidebarOpen(false); }} style={{ ...rs.sidebarBtn(sel), justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                <Flame size={12} color={sel?'#0f1013':count>0?'#bda88a':'#333'} style={{ flexShrink:0 }} />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textTransform:'uppercase', fontSize:'0.62rem' }}>{cat.name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                <span title={`86 "${cat.name}"`} onClick={e => { e.stopPropagation(); trigger86(cat.name); }}
                  style={{ width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(211,191,162,0.03)', border:'1px solid rgba(211,191,162,0.07)', borderRadius:4, cursor:'pointer', color:'#333', transition:'0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.25)'; e.currentTarget.style.color='#d3bfa2'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.07)'; e.currentTarget.style.color='#333'; }}>
                  <EyeOff size={9} />
                </span>
                <span style={{ ...rs.countChip(sel, count>0), minWidth:22, textAlign:'center' }}>{count<10?`0${count}`:count}</span>
              </div>
            </button>
          );
        })}

        {/* Speed Logs node */}
        <div style={{ marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(211,191,162,0.06)', display:'flex', flexDirection:'column', gap:4 }}>
          <button onClick={() => { setShowMetricsDashboard(true); setSidebarOpen(false); }} style={{ ...rs.sidebarBtn(showMetricsDashboard), justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <TrendingUp size={12} color={showMetricsDashboard?'#0f1013':'#555'} />
              SPEED LOGS
            </div>
            {completedTicketsCount > 0 && (
              <span style={{ ...rs.countChip(showMetricsDashboard, true) }}>{completedTicketsCount}</span>
            )}
          </button>
          {/* Refresh */}
          <button onClick={fetchActiveOrders} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 10px', borderRadius:9, border:'1px solid rgba(211,191,162,0.07)', background:'transparent', color:'#333', cursor:'pointer', fontSize:'0.6rem', fontWeight:900, width:'100%', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#d3bfa2'; e.currentTarget.style.borderColor='rgba(211,191,162,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='#333'; e.currentTarget.style.borderColor='rgba(211,191,162,0.07)'; }}>
            <RefreshCw size={12} /> REFRESH ORDERS
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div style={rs.root}>
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      <audio ref={alertPlayer} src="https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3"  preload="auto" />

      {/* ── DRAWER OVERLAY ── */}
      <AnimatePresence>
        {sidebarOpen && showDrawerToggle && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:90, backdropFilter:'blur(3px)' }} />
            <motion.aside initial={{ x:-310 }} animate={{ x:0 }} exit={{ x:-310 }}
              transition={{ type:'spring', stiffness:320, damping:32 }}
              style={{ ...rs.sidebar, position:'fixed', left:0, top:0, bottom:0, width: isSmallTablet?290:270, borderRadius:'0 16px 16px 0', zIndex:100, padding:'18px 14px' }}>
              <SidebarContent inDrawer />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════ HEADER ══════════════ */}
      <header style={rs.header}>
        {/* Left: menu + brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {showDrawerToggle && (
            <button onClick={() => setSidebarOpen(true)} style={rs.iconBtn}>
              <AlignJustify size={18} color="#d3bfa2" />
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:isMobile?28:34, height:isMobile?28:34, borderRadius:10, background:'rgba(211,191,162,0.06)', border:'1px solid rgba(211,191,162,0.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ChefHat size={isMobile?15:18} color="#d3bfa2" />
            </div>
            <div>
              <h1 style={{ margin:0, fontWeight:900, letterSpacing:'3px', fontSize:isMobile?'0.8rem':isTablet?'0.85rem':'0.92rem', color:'#fff', fontFamily:"'Outfit',sans-serif", lineHeight:1.1 }}>
                PRATYEKSHA <span style={{ color:'rgba(211,191,162,0.35)', fontWeight:600, letterSpacing:'1px', fontSize:'0.6em' }}>KDS</span>
              </h1>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                <span style={isOnline ? rs.dotGold : rs.dotRed} />
                <span style={{ color:'#2a2e38', fontSize:'0.5rem', fontWeight:900, letterSpacing:'1.5px' }}>
                  {isOnline
                    ? (isMobile ? 'LIVE' : tenantName ? tenantName.toUpperCase() : 'KITCHEN — ONLINE')
                    : <span style={{ color:'#ff4d4d', display:'inline-flex', alignItems:'center', gap:3 }}><WifiOff size={9} /> DISCONNECTED</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: action cluster */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, overflowX:'auto', scrollbarWidth:'none', msOverflowStyle:'none' }}>

          {/* Station filter — tablet/desktop */}
          {!isMobile && (
            <div style={{ display:'flex', background:'#070709', padding:3, borderRadius:9, border:'1px solid rgba(211,191,162,0.08)', flexShrink:0 }}>
              {[
                { val:'ALL',    lbl:'ALL',      icon:<Monitor size={11} /> },
                { val:'DINEIN', lbl:'DINE-IN',  icon:<UtensilsCrossed size={11} /> },
                { val:'PARCEL', lbl:'PARCEL',   icon:<Package size={11} /> },
              ].map(s => (
                <button key={s.val} onClick={() => setStationFilter(s.val)} style={{ padding:'6px 11px', background: stationFilter===s.val ? 'rgba(211,191,162,0.1)' : 'transparent', border:'none', color: stationFilter===s.val ? '#d3bfa2' : '#3a3e4a', fontSize:'0.58rem', fontWeight:900, cursor:'pointer', borderRadius:7, display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap', transition:'all 0.15s' }}>
                  <span style={{ color: stationFilter===s.val ? '#d3bfa2' : '#333' }}>{s.icon}</span>
                  {s.lbl}
                </button>
              ))}
            </div>
          )}

          {/* Search toggle */}
          <button onClick={() => setShowSearch(v => !v)} style={{ ...rs.utilBtn, borderColor: showSearch ? 'rgba(211,191,162,0.3)' : 'rgba(211,191,162,0.08)', background: showSearch ? 'rgba(211,191,162,0.07)' : '#0a0a0c' }}>
            <Search size={14} color={showSearch?'#d3bfa2':'#555'} />
          </button>

          {/* Voice */}
          <button onClick={toggleVoice} className={isListening ? 'voice-pulse' : ''} style={{ ...rs.utilBtn, borderColor: isListening ? 'rgba(211,191,162,0.45)' : 'rgba(211,191,162,0.08)', background: isListening ? 'rgba(211,191,162,0.1)' : '#0a0a0c' }}>
            <Mic size={14} color={isListening?'#d3bfa2':'#555'} />
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: isListening?'#d3bfa2':'#555' }}>{isListening ? 'LIVE' : 'VOICE'}</span>}
          </button>

          {/* Aggregate toggle */}
          <button onClick={() => setIsAggregateView(v => !v)} style={{ ...rs.utilBtn, background: isAggregateView ? 'rgba(211,191,162,0.07)' : '#0a0a0c', borderColor: isAggregateView ? 'rgba(211,191,162,0.3)' : 'rgba(211,191,162,0.08)' }}>
            {isAggregateView ? <LayoutGrid size={14} color="#d3bfa2" /> : <BarChart3 size={14} color="#555" />}
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: isAggregateView?'#d3bfa2':'#555' }}>{isAggregateView ? 'TICKETS' : 'SUMMARY'}</span>}
          </button>

          {/* Recall */}
          {recallQueue.length > 0 && (
            <button onClick={handleRecall} style={{ ...rs.utilBtn, borderColor:'rgba(211,191,162,0.25)', background:'rgba(211,191,162,0.05)', position:'relative' }}>
              <History size={14} color="#d3bfa2" />
              {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color:'#d3bfa2' }}>RECALL</span>}
              <div style={{ position:'absolute', top:-6, right:-6, width:16, height:16, borderRadius:'50%', background:'linear-gradient(135deg,#bda88a,#d3bfa2)', color:'#0f1013', fontSize:'0.48rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace' }}>{recallQueue.length}</div>
            </button>
          )}

          {/* Wastage */}
          <button onClick={() => setShowWastagePanel(true)} style={{ ...rs.utilBtn, borderColor: showWastagePanel ? 'rgba(211,191,162,0.3)' : 'rgba(211,191,162,0.08)', background: showWastagePanel ? 'rgba(211,191,162,0.07)' : '#0a0a0c', position:'relative' }}>
            <Trash2 size={14} color={showWastagePanel?'#d3bfa2':'#555'} />
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: showWastagePanel?'#d3bfa2':'#555' }}>WASTAGE</span>}
            {wastageLog.filter(e => new Date(e.loggedAt||e.createdAt).toDateString()===new Date().toDateString()).length > 0 && (
              <div style={{ position:'absolute', top:-5, right:-5, width:14, height:14, borderRadius:'50%', background:'rgba(211,191,162,0.8)', color:'#0f1013', fontSize:'0.44rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {wastageLog.filter(e => new Date(e.loggedAt||e.createdAt).toDateString()===new Date().toDateString()).length}
              </div>
            )}
          </button>

          {/* Ticket count pill */}
          <div style={{ background: filteredOrders.length>0 ? 'linear-gradient(135deg,#bda88a,#d3bfa2)' : '#0a0a0c', padding:'7px 13px', borderRadius:10, display:'flex', alignItems:'center', gap:6, flexShrink:0, border: filteredOrders.length===0 ? '1px solid rgba(211,191,162,0.08)' : 'none', minHeight:38 }}>
            <span style={{ color: filteredOrders.length>0 ? '#0f1013' : '#222', fontSize:'1.05rem', fontWeight:950, fontFamily:'JetBrains Mono, monospace', lineHeight:1 }}>{filteredOrders.length<10?`0${filteredOrders.length}`:filteredOrders.length}</span>
            {!isMobile && <span style={{ color: filteredOrders.length>0 ? '#0f1013' : '#222', fontSize:'0.5rem', fontWeight:900, letterSpacing:'0.5px' }}>TICKETS</span>}
          </div>
        </div>
      </header>

      {/* ── SEARCH BAR ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
            style={{ display:'flex', alignItems:'center', gap:9, background:'#080809', border:'1px solid rgba(211,191,162,0.1)', borderRadius:11, padding:'9px 14px', flexShrink:0 }}>
            <Search size={13} color="#8a704d" />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by table number, source, or dish name…" style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e8e0d0', fontSize:'0.82rem', fontFamily:"'Outfit',sans-serif" }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background:'rgba(211,191,162,0.06)', border:'1px solid rgba(211,191,162,0.12)', color:'#888', borderRadius:6, cursor:'pointer', padding:'4px 8px', display:'flex', alignItems:'center', gap:4, fontSize:'0.58rem', fontWeight:900 }}>
                <X size={11} /> CLEAR
              </button>
            )}
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ background:'transparent', border:'none', color:'#333', cursor:'pointer', display:'flex', alignItems:'center' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREP MARQUEE ── */}
      <AnimatePresence>
        {masterPrepMarqueeList.length > 0 && !isAggregateView && !showMetricsDashboard && (
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ display:'flex', alignItems:'center', background:'#070709', border:'1px solid rgba(211,191,162,0.07)', padding:'7px 14px', borderRadius:10, gap:10, overflow:'hidden', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.52rem', fontWeight:900, color:'#8a704d', letterSpacing:'1.5px', flexShrink:0 }}>
              <Activity size={10} /> PREP QUEUE
            </div>
            <div style={{ width:'1px', height:'14px', background:'rgba(211,191,162,0.1)', flexShrink:0 }} />
            <div style={{ display:'flex', gap:7, overflowX:'auto' }} className="no-scrollbar">
              {masterPrepMarqueeList.map(([name,qty]) => (
                <div key={name} style={{ background:'#0a0a0c', border:'1px solid rgba(211,191,162,0.1)', padding:'3px 10px', borderRadius:6, display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                  <span style={{ color:'#d3bfa2', fontWeight:900, fontFamily:'monospace', fontSize:'0.72rem' }}>{qty}×</span>
                  <span style={{ fontSize:'0.65rem', fontWeight:800, color:'#c8c0b0', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.3px' }}>{name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RECALL STRIP ── */}
      <AnimatePresence>
        {recallQueue.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(211,191,162,0.02)', border:'1px solid rgba(211,191,162,0.07)', borderRadius:9, padding:'6px 13px', flexShrink:0, overflow:'hidden' }}>
            <History size={10} color="rgba(211,191,162,0.25)" />
            <span style={{ fontSize:'0.5rem', color:'rgba(211,191,162,0.25)', fontWeight:900, letterSpacing:'1px', flexShrink:0 }}>RECALL ({recallQueue.length}/10)</span>
            <div style={{ display:'flex', gap:5, overflowX:'auto' }} className="no-scrollbar">
              {recallQueue.map((o,i) => (
                <span key={i} style={{ fontSize:'0.56rem', fontWeight:900, padding:'2px 8px', borderRadius:5, background: i===0 ? 'rgba(211,191,162,0.1)' : '#0d0e11', border:`1px solid ${i===0?'rgba(211,191,162,0.2)':'#111'}`, color: i===0?'#d3bfa2':'#2a2a2a', whiteSpace:'nowrap', flexShrink:0, fontFamily:'monospace' }}>
                  {getOrderType(o)==='parcel' ? 'PARCEL' : `T-${o.tableNumber}`} · {o.items?.length}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODIFICATION ALERTS ── */}
      <AnimatePresence>
        {interceptedAlerts.map(alert => (
          <motion.div key={alert.id} initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ opacity:0 }}
            style={{ background:'rgba(100,20,20,0.95)', border:'1px solid rgba(248,113,113,0.3)', padding: isMobile ? '12px 14px' : '13px 20px', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection: isMobile ? 'column' : 'row', gap:12, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ background:'rgba(0,0,0,0.2)', padding:9, borderRadius:9, flexShrink:0 }}><BellRing size={17} color="#f87171" /></div>
              <div>
                <h3 style={{ margin:0, fontSize: isMobile ? '0.82rem' : '0.95rem', fontWeight:900, color:'#fff' }}>ORDER CHANGE — TABLE {alert.tableNumber}</h3>
                <p style={{ margin:'3px 0 0', color:'rgba(255,255,255,0.45)', fontSize:'0.65rem' }}>
                  Modification: <span style={{ color:'#ffb3b3', fontWeight:700 }}>"{alert.modificationNote}"</span>
                </p>
              </div>
            </div>
            <button onClick={() => setInterceptedAlerts(prev => prev.filter(a => a.id !== alert.id))}
              style={{ background:'rgba(0,0,0,0.25)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', padding:'9px 16px', borderRadius:8, fontSize:'0.66rem', fontWeight:900, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s' }}>
              ACKNOWLEDGE
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ══════════════ BODY ══════════════ */}
      <div style={rs.body}>
        {/* PERMANENT SIDEBAR */}
        {showPermanentSide && (
          <aside style={{ ...rs.sidebar, width: isLargeTablet ? 210 : 240 }}>
            <SidebarContent />
          </aside>
        )}

        {/* MAIN WORKSPACE */}
        <main style={{ ...rs.workspace, display:'flex', flexDirection:'column', gap:12 }} className="no-scrollbar">

          {/* KITCHEN HEALTH */}
          {kitchenHealth?.stations?.length > 0 && !showMetricsDashboard && (
            <div style={{ background:'#080809', border:'1px solid rgba(211,191,162,0.07)', borderRadius:13, padding:'13px 15px', flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <Activity size={12} color="#d3bfa2" />
                  <span style={{ color:'rgba(211,191,162,0.5)', fontSize:'0.53rem', fontWeight:900, letterSpacing:'2px', textTransform:'uppercase' }}>KITCHEN HEALTH</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, background: kitchenHealth.bottleneck ? 'rgba(248,113,113,0.08)' : 'rgba(211,191,162,0.04)', border:`1px solid ${kitchenHealth.bottleneck ? 'rgba(248,113,113,0.2)' : 'rgba(211,191,162,0.08)'}` }}>
                  {kitchenHealth.bottleneck ? <AlertTriangle size={9} color="#f87171" /> : <CheckCircle2 size={9} color="#d3bfa2" />}
                  <span style={{ fontSize:'0.5rem', fontWeight:900, color: kitchenHealth.bottleneck ? '#f87171' : '#8a704d', letterSpacing:'0.5px' }}>
                    {kitchenHealth.bottleneck ? `BOTTLENECK: ${kitchenHealth.bottleneck}` : 'ALL STATIONS NORMAL'}
                  </span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(kitchenHealth.stations.slice(0,5).length, isMobile?2:5)},1fr)`, gap:8 }}>
                {kitchenHealth.stations.slice(0,5).map(s => (
                  <div key={s.name} style={{ background:'#0a0a0c', border:`1px solid ${s.isBottleneck ? 'rgba(248,113,113,0.2)' : 'rgba(211,191,162,0.06)'}`, borderRadius:8, padding:'9px 10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:'0.55rem', color: s.isBottleneck ? '#f87171' : '#777', fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, marginRight:4 }}>{s.name}</span>
                      <span style={{ fontSize:'0.54rem', fontFamily:'monospace', fontWeight:900, color: s.isBottleneck ? '#f87171' : '#444', flexShrink:0 }}>{s.pending}</span>
                    </div>
                    <div style={{ height:3, background:'rgba(211,191,162,0.06)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100, Math.round((s.pending/Math.max(s.pending,5))*100))}%`, background: s.isBottleneck ? '#f87171' : 'rgba(211,191,162,0.4)', borderRadius:2, transition:'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
              {kitchenHealth.recommendation && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:7, marginTop:10, padding:'8px 11px', background:'rgba(211,191,162,0.03)', border:'1px solid rgba(211,191,162,0.06)', borderRadius:8 }}>
                  <Zap size={11} color="#8a704d" style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ fontSize:'0.6rem', color:'#555', lineHeight:1.55 }}>{kitchenHealth.recommendation}</span>
                </div>
              )}
            </div>
          )}

          {/* SPEED METRICS PANEL */}
          {showMetricsDashboard && (
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
              style={{ background:'#080809', border:'1px solid rgba(211,191,162,0.08)', borderRadius:16, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding: isMobile ? '36px 20px' : '52px 30px', minHeight:300 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <TrendingUp size={22} color="#d3bfa2" />
                <h2 style={{ margin:0, fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight:900, letterSpacing:'3px', color:'#fff', textTransform:'uppercase' }}>Speed Metrics</h2>
              </div>
              <p style={{ color:'#1e2028', fontSize:'0.6rem', marginBottom:32, letterSpacing:'0.5px', textAlign:'center' }}>Session performance — resets at midnight IST</p>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14, width:'100%', maxWidth:520, marginBottom:28 }}>
                {[
                  { label:'TICKETS DISPATCHED', value:completedTicketsCount, sub:'today', big:true },
                  { label:'AVG CLEAR TIME',      value:avgClearTime,          sub:'per ticket', big:false },
                  { label:'CURRENTLY PENDING',   value:filteredOrders.length, sub:'active tickets', big:true },
                  { label:'WAITER CALLS',         value:waiterCalls.length,    sub:'pending', big:true },
                ].map(s => (
                  <div key={s.label} style={{ background:'#0a0a0c', border:'1px solid rgba(211,191,162,0.08)', borderTop:'2px solid rgba(211,191,162,0.15)', padding:'22px 20px', borderRadius:13, textAlign:'center' }}>
                    <div style={{ fontSize:'0.5rem', fontWeight:900, color:'#2a2a2a', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>{s.label}</div>
                    <div style={{ fontSize: s.big ? '2.8rem' : '1.8rem', fontWeight:950, color:'#d3bfa2', fontFamily:'JetBrains Mono, monospace', lineHeight:1, marginBottom:6 }}>{s.value}</div>
                    <div style={{ fontSize:'0.58rem', color:'#1e2028', fontWeight:700 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowMetricsDashboard(false)}
                style={{ background:'transparent', border:'1px solid rgba(211,191,162,0.2)', color:'#d3bfa2', padding:'11px 28px', borderRadius:10, fontSize:'0.7rem', fontWeight:900, cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s' }}>
                ← BACK TO KITCHEN
              </button>
            </motion.div>
          )}

          {/* AGGREGATE SUMMARY */}
          {!showMetricsDashboard && isAggregateView && (
            <div style={{ flex:1, overflowY:'auto' }} className="no-scrollbar">
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <BarChart3 size={14} color="#8a704d" />
                <span style={{ fontSize:'0.57rem', fontWeight:900, color:'#3a3e4a', letterSpacing:'2px', textTransform:'uppercase' }}>BATCH PREP SUMMARY</span>
                <span style={{ marginLeft:'auto', fontSize:'0.54rem', color:'#1e2028', fontFamily:'monospace' }}>
                  {Object.keys(aggregatedTotals).length} items · {filteredOrders.length} tickets
                </span>
              </div>
              {Object.keys(aggregatedTotals).length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:12 }}>
                  <ChefHat size={32} color="#1a1c23" />
                  <p style={{ color:'#1e2028', fontWeight:900, fontSize:'0.82rem', letterSpacing:'2px', margin:0 }}>KITCHEN CLEAR</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'140px':'160px'}, 1fr))`, gap: isMobile ? 10 : 13 }}>
                  {Object.entries(aggregatedTotals).map(([key, qty]) => {
                    const [namePart, typePart] = key.split('__');
                    const isParcel = typePart === 'P';
                    return (
                      <div key={key} style={{ background:'#080809', border:`1px solid ${isParcel?'rgba(211,191,162,0.14)':'rgba(211,191,162,0.07)'}`, borderTop:`2px solid ${isParcel?'rgba(211,191,162,0.45)':'rgba(211,191,162,0.15)'}`, borderRadius:13, padding: isMobile ? '16px 12px' : '20px 14px', textAlign:'center' }}>
                        <div style={{ fontSize: isMobile ? '2.4rem' : '2.8rem', fontWeight:900, color:'#d3bfa2', fontFamily:'JetBrains Mono, monospace', lineHeight:1, marginBottom:8 }}>{qty<10?`0${qty}`:qty}</div>
                        <div style={{ fontSize: isMobile ? '0.62rem' : '0.67rem', color:'#888', fontWeight:800, textTransform:'uppercase', lineHeight:1.4, marginBottom:7 }}>{namePart}</div>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.47rem', fontWeight:900, padding:'2px 7px', borderRadius:5, background: isParcel ? 'rgba(211,191,162,0.08)' : 'rgba(255,255,255,0.03)', color: isParcel ? '#d3bfa2' : '#3a3e4a', border:`1px solid ${isParcel?'rgba(211,191,162,0.15)':'rgba(211,191,162,0.04)'}` }}>
                          {isParcel ? <Package size={8} /> : <UtensilsCrossed size={8} />}
                          {isParcel ? 'PARCEL' : 'DINE-IN'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MOBILE SWIPE CARDS */}
          {!showMetricsDashboard && !isAggregateView && useCardView && (
            filteredOrders.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
                <div style={{ width:64, height:64, borderRadius:18, background:'#080809', border:'1px solid rgba(211,191,162,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChefHat size={30} color="#1a1c23" /></div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontWeight:900, color:'#1e2028', fontSize:'0.85rem', letterSpacing:'2px', margin:'0 0 4px' }}>KITCHEN CLEAR</p>
                  <p style={{ fontSize:'0.6rem', color:'#111', margin:0, fontWeight:700 }}>Waiting for next order…</p>
                </div>
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, overflow:'hidden' }}>
                {/* Dot nav */}
                <div style={{ display:'flex', justifyContent:'center', gap:5, flexShrink:0, flexWrap:'wrap', padding:'0 20px' }}>
                  {filteredOrders.map((_,i) => (
                    <div key={i} onClick={() => setMobileCardIndex(i)} style={{ width: i===safeCardIndex ? 20 : 6, height:6, borderRadius:3, background: i===safeCardIndex ? '#d3bfa2' : '#1f222a', transition:'all 0.25s', cursor:'pointer' }} />
                  ))}
                </div>
                {/* Card */}
                <div style={{ flex:1, overflow:'hidden' }} {...swipeHandlers}>
                  <AnimatePresence mode="wait">
                    <motion.div key={filteredOrders[safeCardIndex]?._id} initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-50 }} style={{ height:'100%' }}>
                      {filteredOrders[safeCardIndex] && (
                        <KDSOrderCard order={filteredOrders[safeCardIndex]} isNewest={safeCardIndex===0} onReady={markAsReady} dishToCategoryMap={dishToCategoryMap} dishToVegMap={dishToVegMap} selectedCategory={selectedCategory} checkedItemsGlobal={checkedItemsGlobal} setCheckedItemsGlobal={setCheckedItemsGlobal} socketInstance={socketRef.current} isNonVegMode={isNonVegMode} tenantOnlyVeg={tenantOnlyVeg} isMobile={true} isTablet={false} itemFinalTimes={itemFinalTimes} setItemFinalTimes={setItemFinalTimes} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Prev/Next */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                  <button onClick={() => setMobileCardIndex(i => Math.max(0,i-1))} disabled={safeCardIndex===0} style={{ ...rs.navBtn, opacity: safeCardIndex===0 ? 0.25 : 1 }}><ChevronLeft size={16} /> PREV</button>
                  <span style={{ color:'#3a3e4a', fontSize:'0.7rem', fontWeight:900, fontFamily:'monospace' }}>{safeCardIndex+1} / {filteredOrders.length}</span>
                  <button onClick={() => setMobileCardIndex(i => Math.min(filteredOrders.length-1,i+1))} disabled={safeCardIndex===filteredOrders.length-1} style={{ ...rs.navBtn, opacity: safeCardIndex===filteredOrders.length-1 ? 0.25 : 1 }}>NEXT <ChevronRight size={16} /></button>
                </div>
              </div>
            )
          )}

          {/* TABLET/DESKTOP GRID */}
          {!showMetricsDashboard && !isAggregateView && !useCardView && (
            <div style={{ flex:1, overflowY:'auto', display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isSmallTablet?'240px':'300px'},1fr))`, gap: isTablet ? 12 : 16, alignContent:'flex-start' }} className="no-scrollbar">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order,i) => (
                  <KDSOrderCard key={order._id} order={order} isNewest={i===0} onReady={markAsReady} dishToCategoryMap={dishToCategoryMap} dishToVegMap={dishToVegMap} selectedCategory={selectedCategory} checkedItemsGlobal={checkedItemsGlobal} setCheckedItemsGlobal={setCheckedItemsGlobal} socketInstance={socketRef.current} isNonVegMode={isNonVegMode} tenantOnlyVeg={tenantOnlyVeg} isMobile={false} isTablet={isTablet} itemFinalTimes={itemFinalTimes} setItemFinalTimes={setItemFinalTimes} />
                ))}
              </AnimatePresence>
              {filteredOrders.length === 0 && (
                <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:14 }}>
                  <div style={{ width:64, height:64, borderRadius:18, background:'#080809', border:'1px solid rgba(211,191,162,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChefHat size={30} color="#1a1c23" /></div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontWeight:900, color:'#1e2028', fontSize:'0.85rem', letterSpacing:'2px', margin:'0 0 4px' }}>KITCHEN CLEAR</p>
                    <p style={{ fontSize:'0.6rem', color:'#111', margin:0, fontWeight:700 }}>All tickets dispatched</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav style={{ display:'flex', background:'#080809', border:'1px solid rgba(211,191,162,0.07)', borderRadius:14, padding:'3px', flexShrink:0, gap:2 }}>
          {[
            { val:'ALL',    lbl:'ALL',     icon:<Monitor size={16} /> },
            { val:'DINEIN', lbl:'DINE-IN', icon:<UtensilsCrossed size={16} /> },
            { val:'PARCEL', lbl:'PARCEL',  icon:<Package size={16} /> },
          ].map(s => (
            <button key={s.val} onClick={() => setStationFilter(s.val)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: stationFilter===s.val ? 'rgba(211,191,162,0.08)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: stationFilter===s.val ? '#d3bfa2' : '#333', transition:'all 0.15s' }}>
              {s.icon}
              <span style={{ fontSize:'0.48rem', fontWeight:900, letterSpacing:'0.3px' }}>{s.lbl}</span>
              {s.val !== 'ALL' && (() => {
                const c = filteredOrders.filter(o => {
                  const t = getOrderType(o);
                  return s.val==='DINEIN' ? t==='dine-in' : t==='parcel';
                }).length;
                return c > 0 ? <span style={{ fontSize:'0.44rem', fontFamily:'monospace', fontWeight:900, color:'#8a704d' }}>{c}</span> : null;
              })()}
            </button>
          ))}
          <button onClick={() => setIsAggregateView(v => !v)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: isAggregateView ? 'rgba(211,191,162,0.08)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: isAggregateView ? '#d3bfa2' : '#333', transition:'all 0.15s' }}>
            <BarChart3 size={16} />
            <span style={{ fontSize:'0.48rem', fontWeight:900 }}>SUMMARY</span>
          </button>
          <button onClick={() => setShowMetricsDashboard(v => !v)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: showMetricsDashboard ? 'rgba(211,191,162,0.08)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: showMetricsDashboard ? '#d3bfa2' : '#333', transition:'all 0.15s' }}>
            <TrendingUp size={16} />
            <span style={{ fontSize:'0.48rem', fontWeight:900 }}>METRICS</span>
          </button>
        </nav>
      )}

      {/* WASTAGE PANEL */}
      <AnimatePresence>
        {showWastagePanel && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:0.7 }} exit={{ opacity:0 }}
              onClick={() => setShowWastagePanel(false)}
              style={{ position:'fixed', inset:0, background:'#000', zIndex:3000, backdropFilter:'blur(4px)' }} />
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:32 }}
              style={{ position:'fixed', right:0, top:0, bottom:0, width: isMobile ? '100vw' : isTablet ? 420 : 500, background:'#0a0b0e', borderLeft:'1px solid rgba(211,191,162,0.08)', borderRadius: isMobile ? 0 : '16px 0 0 16px', zIndex:3001, display:'flex', flexDirection:'column', overflow:'hidden' }}>

              {/* Panel header */}
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(211,191,162,0.06)', background:'#080809', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(211,191,162,0.05)', border:'1px solid rgba(211,191,162,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Trash2 size={16} color="#d3bfa2" />
                  </div>
                  <div>
                    <div style={{ fontWeight:900, fontSize:'0.88rem', color:'#fff', letterSpacing:0.3 }}>WASTAGE LOG</div>
                    <div style={{ fontSize:'0.5rem', color:'#2a2e38', fontWeight:900, letterSpacing:'1.5px', marginTop:2, textTransform:'uppercase' }}>Spoilage · Overcooked · Dropped · Excess</div>
                  </div>
                </div>
                <button onClick={() => setShowWastagePanel(false)} style={{ background:'#0d0e11', border:'1px solid rgba(211,191,162,0.1)', color:'#444', padding:8, borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', background:'#080809', borderBottom:'1px solid rgba(211,191,162,0.06)', flexShrink:0 }}>
                {[['log','LOG ENTRY'],['report','MONTHLY REPORT']].map(([t,lbl]) => (
                  <button key={t} onClick={() => setWastageTab(t)} style={{ flex:1, padding:'12px 0', background:'transparent', border:'none', cursor:'pointer', fontSize:'0.58rem', fontWeight:900, letterSpacing:'1px', color: wastageTab===t ? '#d3bfa2' : '#2a2e38', borderBottom:`2px solid ${wastageTab===t ? 'rgba(211,191,162,0.5)' : 'transparent'}`, transition:'all 0.15s' }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Panel body */}
              <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }} className="custom-scroll">
                {wastageTab === 'log' ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {/* NEW ENTRY FORM */}
                    <div style={{ background:'#0d0e11', border:'1px solid rgba(211,191,162,0.08)', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
                      <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#3a3e4a', letterSpacing:'2px', textTransform:'uppercase', paddingBottom:10, borderBottom:'1px solid rgba(211,191,162,0.05)' }}>NEW ENTRY</div>

                      {/* item name */}
                      <div style={{ position:'relative' }}>
                        <label style={wFormLabel}>INGREDIENT *</label>
                        <input value={wastageForm.itemName}
                          onChange={e => {
                            const v = e.target.value;
                            setWastageForm(p => ({ ...p, itemName:v, inventoryId:null }));
                            if (v.length >= 2) { const m = wastageInventory.filter(i => i.itemName.toLowerCase().includes(v.toLowerCase())).slice(0,5); setWastageSuggestions(m); setShowWastageSuggest(true); }
                            else setShowWastageSuggest(false);
                          }}
                          onBlur={() => setTimeout(() => setShowWastageSuggest(false), 150)}
                          placeholder="Type ingredient name…" style={wInput} />
                        {showWastageSuggest && wastageSuggestions.length > 0 && (
                          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#13151a', border:'1px solid rgba(211,191,162,0.12)', borderRadius:9, zIndex:10, overflow:'hidden', marginTop:2, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
                            {wastageSuggestions.map(s => (
                              <button key={s._id} onMouseDown={() => { setWastageForm(p => ({ ...p, itemName:s.itemName, inventoryId:s._id, unit:s.unit||'kg' })); setShowWastageSuggest(false); }}
                                style={{ width:'100%', padding:'10px 14px', background:'transparent', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', color:'#c8c0b0', fontSize:'0.75rem', fontWeight:700, textAlign:'left', transition:'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(211,191,162,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                <span>{s.itemName}</span>
                                <span style={{ fontSize:'0.58rem', color:'#3a3e4a', fontFamily:'monospace' }}>{s.currentStock}{s.unit}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* qty + unit */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div>
                          <label style={wFormLabel}>QUANTITY *</label>
                          <input type="number" min="0.01" step="0.01" placeholder="0.00" value={wastageForm.quantity} onChange={e => setWastageForm(p => ({ ...p, quantity:e.target.value }))} style={wInput} />
                        </div>
                        <div>
                          <label style={wFormLabel}>UNIT</label>
                          <select value={wastageForm.unit} onChange={e => setWastageForm(p => ({ ...p, unit:e.target.value }))} style={wInput}>
                            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* reason chips */}
                      <div>
                        <label style={wFormLabel}>REASON *</label>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {REASON_OPTIONS.map(r => (
                            <button key={r} onClick={() => setWastageForm(p => ({ ...p, reason:r }))}
                              style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${wastageForm.reason===r?'rgba(211,191,162,0.35)':'rgba(211,191,162,0.08)'}`, background: wastageForm.reason===r ? 'rgba(211,191,162,0.1)' : 'transparent', color: wastageForm.reason===r ? '#d3bfa2' : '#3a3e4a', fontSize:'0.58rem', fontWeight:900, cursor:'pointer', transition:'all 0.15s' }}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* logged by */}
                      <div>
                        <label style={wFormLabel}>LOGGED BY *</label>
                        <input value={wastageForm.loggedBy} onChange={e => setWastageForm(p => ({ ...p, loggedBy:e.target.value }))} placeholder="Chef / Staff name" style={wInput} />
                      </div>

                      {/* notes */}
                      <div>
                        <label style={wFormLabel}>NOTES (optional)</label>
                        <input value={wastageForm.notes} onChange={e => setWastageForm(p => ({ ...p, notes:e.target.value }))} placeholder="Any context…" style={wInput} />
                      </div>

                      {/* save button */}
                      <button onClick={saveWastageEntry} disabled={wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()}
                        style={{ padding:'12px', borderRadius:11, border:'none', background: (wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()) ? '#0d0e11' : 'linear-gradient(135deg,#bda88a,#d3bfa2)', color: (wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()) ? '#2a2e38' : '#0f1013', fontWeight:900, fontSize:'0.72rem', cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6, minHeight:46 }}>
                        {wastageSaving ? <><RotateCcw size={13} style={{ animation:'spin 1s linear infinite' }} /> SAVING…</> : <><Trash2 size={13} /> LOG WASTAGE</>}
                      </button>
                    </div>

                    {/* LOG LIST */}
                    {wastageLoading ? (
                      <div style={{ textAlign:'center', padding:'24px', color:'#2a2e38', fontSize:'0.7rem' }}>Loading log…</div>
                    ) : wastageLog.length > 0 ? (
                      <div>
                        <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#2a2e38', letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>TODAY'S ENTRIES — {wastageLog.length}</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {[...wastageLog].reverse().map(e => (
                            <div key={e._id} style={{ background:'#0d0e11', border:'1px solid rgba(211,191,162,0.06)', borderLeft:'3px solid rgba(211,191,162,0.15)', borderRadius:10, padding:'11px 14px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                                  <span style={{ fontWeight:800, fontSize:'0.76rem', color:'#c8c0b0' }}>{e.itemName}</span>
                                  <span style={{ fontSize:'0.52rem', fontFamily:'monospace', color:'#8a704d', fontWeight:900, padding:'1px 5px', borderRadius:4, background:'rgba(138,112,77,0.08)', border:'1px solid rgba(138,112,77,0.2)' }}>{e.quantity}{e.unit}</span>
                                  {e.costLoss > 0 && <span style={{ fontSize:'0.54rem', color:'#d3bfa2', fontFamily:'monospace', marginLeft:'auto', fontWeight:900 }}>₹{e.costLoss.toFixed(0)}</span>}
                                </div>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  <span style={{ fontSize:'0.5rem', padding:'1px 6px', borderRadius:4, background:'rgba(211,191,162,0.04)', color:'#555', border:'1px solid rgba(211,191,162,0.07)', fontWeight:700 }}>{e.reason}</span>
                                  <span style={{ fontSize:'0.5rem', color:'#2a2e38', fontWeight:700 }}>{e.loggedBy}</span>
                                  {e.notes && <span style={{ fontSize:'0.5rem', color:'#1e2028', fontStyle:'italic' }}>{e.notes}</span>}
                                </div>
                              </div>
                              <button onClick={() => deleteWastageEntry(e._id)} style={{ background:'transparent', border:'1px solid rgba(211,191,162,0.06)', color:'#2a2e38', padding:'5px', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.15s', flexShrink:0 }}
                                onMouseEnter={ev => { ev.currentTarget.style.borderColor='rgba(211,191,162,0.2)'; ev.currentTarget.style.color='#d3bfa2'; }}
                                onMouseLeave={ev => { ev.currentTarget.style.borderColor='rgba(211,191,162,0.06)'; ev.currentTarget.style.color='#2a2e38'; }}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign:'center', padding:'30px 20px', background:'#0d0e11', borderRadius:12, border:'1px dashed rgba(211,191,162,0.06)' }}>
                        <div style={{ fontSize:'0.64rem', color:'#1e2028', fontWeight:700 }}>No wastage entries today</div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* REPORT TAB */
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {wastageAnalytics ? (
                      <>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                          {[
                            { l:'TOTAL COST', v:`₹${Math.round(wastageAnalytics.totalCost||0).toLocaleString()}` },
                            { l:'ENTRIES',   v:wastageAnalytics.totalEntries||0 },
                            { l:'TOP ITEM',  v:wastageAnalytics.topWasted?.[0]?.name||'—' },
                          ].map(s => (
                            <div key={s.l} style={{ background:'#0d0e11', border:'1px solid rgba(211,191,162,0.07)', borderRadius:11, padding:'12px 10px', textAlign:'center' }}>
                              <div style={{ fontSize:'0.48rem', color:'#2a2e38', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>{s.l}</div>
                              <div style={{ fontSize:'1.05rem', fontWeight:900, color:'#d3bfa2', fontFamily:'monospace' }}>{s.v}</div>
                            </div>
                          ))}
                        </div>

                        {wastageAnalytics.byReason && Object.keys(wastageAnalytics.byReason).length > 0 && (
                          <div style={{ background:'#0d0e11', border:'1px solid rgba(211,191,162,0.07)', borderRadius:12, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#2a2e38', letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:14, paddingBottom:10, borderBottom:'1px solid rgba(211,191,162,0.05)', display:'flex', alignItems:'center', gap:6 }}>
                              <Scale size={11} color="#3a3e4a" /> BY REASON
                            </div>
                            {Object.entries(wastageAnalytics.byReason).sort((a,b) => b[1].cost - a[1].cost).map(([reason, data]) => {
                              const pct = wastageAnalytics.totalEntries > 0 ? Math.round((data.count/wastageAnalytics.totalEntries)*100) : 0;
                              return (
                                <div key={reason} style={{ marginBottom:10 }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                                    <span style={{ fontSize:'0.64rem', fontWeight:800, color:'#888' }}>{reason}</span>
                                    <span style={{ fontSize:'0.62rem', fontWeight:900, color:'#d3bfa2', fontFamily:'monospace' }}>
                                      {data.cost > 0 ? `₹${data.cost.toFixed(0)}` : `${data.count}×`}
                                      <span style={{ color:'#2a2e38', fontWeight:600, marginLeft:6 }}>{pct}%</span>
                                    </span>
                                  </div>
                                  <div style={{ height:4, background:'rgba(211,191,162,0.05)', borderRadius:2, overflow:'hidden' }}>
                                    <div style={{ height:'100%', width:`${pct}%`, background:'rgba(211,191,162,0.3)', borderRadius:2, transition:'width 0.6s ease' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(wastageAnalytics.dailyTrend||[]).length > 0 && (
                          <div style={{ background:'#0d0e11', border:'1px solid rgba(211,191,162,0.07)', borderRadius:12, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#2a2e38', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                              <TrendingDown size={11} color="#8a704d" /> DAILY COST TREND (30 days)
                            </div>
                            <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:52 }}>
                              {(() => {
                                const maxC = Math.max(...wastageAnalytics.dailyTrend.map(d => d.cost), 1);
                                return wastageAnalytics.dailyTrend.map(d => (
                                  <div key={d.date} title={`${d.date}: ₹${d.cost.toFixed(0)}`}
                                    style={{ flex:1, minWidth:0, height:`${Math.max(8, Math.round((d.cost/maxC)*100))}%`, background: d.cost>0 ? `rgba(211,191,162,${0.12+(d.cost/maxC)*0.6})` : '#0d0e11', borderRadius:'3px 3px 0 0', transition:'height 0.4s ease' }} />
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        <button onClick={fetchWastageAnalytics} style={{ padding:'11px', background:'transparent', border:'1px solid rgba(211,191,162,0.12)', color:'#8a704d', borderRadius:10, fontSize:'0.64rem', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                          <RefreshCw size={12} /> REFRESH REPORT
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign:'center', padding:'40px 20px' }}>
                        <button onClick={fetchWastageAnalytics} style={{ padding:'10px 22px', background:'rgba(211,191,162,0.05)', border:'1px solid rgba(211,191,162,0.12)', color:'#8a704d', borderRadius:9, fontSize:'0.65rem', fontWeight:900, cursor:'pointer' }}>LOAD MONTHLY REPORT</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* WAITER CALL TOASTS */}
      <div style={{ position:'fixed', bottom: isMobile ? 78 : 24, right: isMobile ? 12 : 24, zIndex:2000, display:'flex', flexDirection:'column', gap:9, maxWidth: isMobile ? 'calc(100vw - 24px)' : 370 }}>
        <AnimatePresence>
          {waiterCalls.map(call => (
            <motion.div key={call.id} initial={{ x:200, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:200, opacity:0 }}
              style={{ background:'#d3bfa2', color:'#0f1013', padding: isMobile ? '12px 15px' : '13px 18px', borderRadius:13, display:'flex', alignItems:'center', gap:12, boxShadow:'0 12px 40px rgba(0,0,0,0.55)' }}>
              <div style={{ background:'rgba(0,0,0,0.1)', padding:8, borderRadius:8, flexShrink:0 }}>
                <BellRing size={16} color="#0f1013" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:900, fontSize: isMobile ? '0.82rem' : '0.88rem', letterSpacing:'0.3px' }}>TABLE {call.tableNumber}</div>
                <div style={{ fontSize:'0.62rem', opacity:0.55, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textTransform:'uppercase' }}>{call.reason || call.serviceRequest || 'Service required'}</div>
              </div>
              <X size={16} style={{ cursor:'pointer', opacity:0.45, flexShrink:0 }} onClick={() => setWaiterCalls(prev => prev.filter(c => c.id !== call.id))} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=JetBrains+Mono:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #0d0e11; color: #fff; overflow: hidden; font-family: 'Outfit', sans-serif; -webkit-tap-highlight-color: transparent; }
        button { font-family: 'Outfit', sans-serif; }
        input, select, textarea { font-family: 'Outfit', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(211,191,162,0.12); border-radius: 10px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes strobePulse { 0% { box-shadow: 0 0 0 0 rgba(211,191,162,0.45); } 70% { box-shadow: 0 0 0 10px rgba(211,191,162,0); } 100% { box-shadow: 0 0 0 0 rgba(211,191,162,0); } }
        .voice-pulse { animation: strobePulse 1.8s infinite; border-radius: 9px; }
        @keyframes urgentPulse { 0%,100% { border-color: rgba(211,191,162,0.16); box-shadow: none; } 50% { border-color: rgba(211,191,162,0.5); box-shadow: 0 0 22px rgba(211,191,162,0.1); } }
        .flash-card-pulse { animation: urgentPulse 1.8s ease-in-out infinite; }
        @keyframes newOrder { 0% { transform: scale(0.97); box-shadow: 0 0 0 0 rgba(211,191,162,0.35); } 50% { transform: scale(1); box-shadow: 0 0 20px 4px rgba(211,191,162,0.12); } 100% { transform: scale(1); box-shadow: none; } }
        .new-order-flash { animation: newOrder 0.6s ease forwards; }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   KDS ORDER CARD COMPONENT
═══════════════════════════════════════════════════════════════════ */
const KDSOrderCard = ({
  order, onReady, isNewest,
  dishToCategoryMap, dishToVegMap,
  selectedCategory, checkedItemsGlobal, setCheckedItemsGlobal,
  socketInstance, isNonVegMode, tenantOnlyVeg,
  isMobile, isTablet,
  itemFinalTimes, setItemFinalTimes
}) => {
  const otype        = getOrderType(order);
  const isAggOrder   = otype === 'swiggy' || otype === 'zomato';
  const isParcelOrder = otype === 'parcel';

  const [seconds,       setSeconds]       = useState(0);
  const [itemStartTimes,setItemStartTimes]= useState({});
  const [itemElapsed,   setItemElapsed]   = useState({});
  const [showNote,      setShowNote]      = useState(false);
  const [localNote,     setLocalNote]     = useState('');

  /* live second counter */
  useEffect(() => {
    const tick = () => setSeconds(Math.floor((Date.now() - new Date(order.createdAt)) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  /* item-level cook timers */
  useEffect(() => {
    const t = setInterval(() => {
      setItemElapsed(prev => {
        const u = {};
        Object.entries(itemStartTimes).forEach(([idx, startMs]) => {
          u[idx] = Math.floor((Date.now() - startMs) / 1000);
        });
        return u;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [itemStartTimes]);

  const urgency = seconds >= 900 ? 'high' : seconds >= 450 ? 'medium' : 'low';

  const accentColor = {
    swiggy:   '#fc8019',
    zomato:   '#cb202d',
    high:     'rgba(211,191,162,0.8)',
    medium:   'rgba(138,112,77,0.55)',
    low:      'rgba(211,191,162,0.1)',
  };
  const topBarColor = isAggOrder
    ? accentColor[otype]
    : urgency === 'high'
      ? 'linear-gradient(90deg,#8a704d,#d3bfa2)'
      : urgency === 'medium'
        ? 'rgba(138,112,77,0.5)'
        : 'rgba(211,191,162,0.08)';

  const kitchenItems = (order.items || []).filter(i => !i.isExtraItem && i.extraItemId == null);
  const checkedCount  = kitchenItems.filter((_,idx) => checkedItemsGlobal[`${order._id}-${idx}`]).length;
  const totalItems    = kitchenItems.length;
  const progressPct   = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const allDone       = progressPct === 100 && totalItems > 0;

  const toggleItemCrossed = async idx => {
    const key  = `${order._id}-${idx}`;
    const next = !checkedItemsGlobal[key];
    if (next && itemStartTimes[idx]) {
      const s = Math.floor((Date.now() - itemStartTimes[idx]) / 1000);
      setItemFinalTimes(prev => ({ ...prev, [idx]: s }));
    }
    if (!next && !itemStartTimes[idx]) {
      setItemStartTimes(p => ({ ...p, [idx]: Date.now() }));
    }
    setCheckedItemsGlobal(prev => ({ ...prev, [key]: next }));
    socketInstance?.emit('kds_item_cross_sync', { orderId:order._id, tenantId:order.tenantId, idx, newState:next });
    try {
      const items = order.items.map((it,i) => i===idx ? { ...it, isCrossedLocal:next } : it);
      await axios.patch(`${BASE_URL}/admin/orders/${order._id}`, { items });
    } catch {}
  };

  const startItemTimer = (idx, e) => {
    e.preventDefault();
    if (!itemStartTimes[idx] && !checkedItemsGlobal[`${order._id}-${idx}`]) {
      setItemStartTimes(p => ({ ...p, [idx]: Date.now() }));
    }
  };

  /* Header label */
  const tableLabel = otype === 'swiggy' ? <span style={{ color:'#fc8019' }}>SWIGGY</span>
    : otype === 'zomato'  ? <span style={{ color:'#cb202d' }}>ZOMATO</span>
    : isParcelOrder ? <span style={{ color:'#bda88a' }}>PARCEL</span>
    : <span style={{ color:'#fff' }}>T-{order.tableNumber}</span>;

  const sourceMeta = {
    waitlist:        { label:'WAITLIST',   color:'#8a704d', bg:'rgba(138,112,77,0.08)', border:'rgba(138,112,77,0.22)' },
    reservation:     { label:'RESERVATION',color:'#bda88a', bg:'rgba(189,168,138,0.08)',border:'rgba(189,168,138,0.22)' },
    'counter-pickup':{ label:'PICKUP',     color:'#d3bfa2', bg:'rgba(211,191,162,0.07)',border:'rgba(211,191,162,0.2)' },
    swiggy:          { label:'SWIGGY',     color:'#fc8019', bg:'rgba(252,128,25,0.1)',  border:'rgba(252,128,25,0.3)' },
    zomato:          { label:'ZOMATO',     color:'#cb202d', bg:'rgba(203,32,45,0.1)',   border:'rgba(203,32,45,0.3)' },
    takeaway:        { label:'TAKEAWAY',   color:'#bda88a', bg:'rgba(189,168,138,0.08)',border:'rgba(189,168,138,0.2)' },
    direct:          { label:'DINE-IN',    color:'#3a3e4a', bg:'rgba(211,191,162,0.03)',border:'rgba(211,191,162,0.07)' },
  };
  const sm = sourceMeta[order.source] || sourceMeta.direct;

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:16, scale:0.98 }}
      animate={{ opacity:1, y:0,  scale:1 }}
      exit={{ opacity:0, scale:0.96 }}
      className={urgency === 'high' ? 'flash-card-pulse' : isNewest ? 'new-order-flash' : ''}
      style={{
        borderRadius:16,
        padding: isMobile ? '14px' : isTablet ? '14px' : '16px',
        display:'flex', flexDirection:'column',
        height: isMobile ? '100%' : isTablet ? 390 : 420,
        border: `1px solid ${isAggOrder ? accentColor[otype]+'40' : isNewest ? 'rgba(211,191,162,0.22)' : 'rgba(211,191,162,0.07)'}`,
        position:'relative', overflow:'hidden',
        background:'#0d0f14',
        boxShadow: isAggOrder ? `0 0 28px ${accentColor[otype]}14` : isNewest ? '0 0 22px rgba(211,191,162,0.05)' : '0 4px 18px rgba(0,0,0,0.28)',
        transition:'border-color 0.3s',
      }}>

      {/* TOP URGENCY BAR */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:topBarColor, flexShrink:0 }} />

      {/* ── CARD HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, gap:8 }}>
        {/* Left — table / platform */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <h2 style={{ fontSize: isMobile?'1.7rem':isTablet?'1.6rem':'1.9rem', margin:0, fontWeight:900, lineHeight:1, letterSpacing:'-0.5px' }}>
              {tableLabel}
            </h2>
            {isNewest && (
              <span style={{ fontSize:'0.45rem', fontWeight:900, padding:'2px 7px', borderRadius:5, background:'rgba(211,191,162,0.1)', color:'#d3bfa2', border:'1px solid rgba(211,191,162,0.22)', letterSpacing:'0.5px', flexShrink:0 }}>NEW</span>
            )}
          </div>
          {/* Source + order ID row */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.47rem', fontWeight:900, padding:'2px 6px', borderRadius:4, letterSpacing:'0.5px', textTransform:'uppercase', background:sm.bg, color:sm.color, border:`1px solid ${sm.border}` }}>
              {sm.label}
            </span>
            <span style={{ fontSize:'0.48rem', color:'#2a2e38', fontFamily:'monospace', fontWeight:900 }}>
              #{order._id.slice(-4).toUpperCase()}
            </span>
            {order.aggregatorOrderId && (
              <span style={{ fontSize:'0.48rem', color: accentColor[otype]+'99', fontFamily:'monospace' }}>
                ·{order.aggregatorOrderId.toString().slice(-6)}
              </span>
            )}
          </div>
        </div>

        {/* Right — timer */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:9, border:`1px solid ${urgency!=='low' ? accentColor[urgency+'_border']||'rgba(211,191,162,0.25)' : 'rgba(211,191,162,0.08)'}`, background: urgency==='high' ? 'rgba(211,191,162,0.07)' : '#080809' }}>
            <Clock size={12} color={urgency==='high'?'#d3bfa2':urgency==='medium'?'#bda88a':'#333'} />
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize: isMobile?'0.88rem':'0.92rem', color:urgency==='high'?'#d3bfa2':urgency==='medium'?'#8a704d':'#555', letterSpacing:'-0.3px' }}>
              {fmt(seconds)}
            </span>
          </div>
          {urgency !== 'low' && (
            <span style={{ fontSize:'0.43rem', fontWeight:900, color: urgency==='high' ? 'rgba(211,191,162,0.55)' : 'rgba(138,112,77,0.55)', letterSpacing:'0.5px', textTransform:'uppercase' }}>
              {urgency==='high' ? '⚡ OVERDUE' : 'DELAYED'}
            </span>
          )}
        </div>
      </div>

      {/* AGGREGATOR CUSTOMER STRIP */}
      {isAggOrder && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'6px 10px', borderRadius:8, background: otype==='zomato' ? 'rgba(203,32,45,0.07)' : 'rgba(252,128,25,0.07)', border:`1px solid ${otype==='zomato'?'rgba(203,32,45,0.2)':'rgba(252,128,25,0.2)'}` }}>
          <span style={{ fontSize:'0.52rem', fontWeight:900, letterSpacing:'0.8px', color:accentColor[otype], display:'flex', alignItems:'center', gap:4 }}>
            <Zap size={10} /> {otype.toUpperCase()} ORDER
          </span>
          {order.aggregatorCustomer?.name && (
            <span style={{ fontSize:'0.6rem', color:'#8a8f9f', fontWeight:700 }}>{order.aggregatorCustomer.name}</span>
          )}
          {order.aggregatorRaw?.expectedDeliveryTime && (
            <span style={{ fontSize:'0.52rem', color:'rgba(211,191,162,0.35)', fontFamily:'monospace' }}>
              ~{order.aggregatorRaw.expectedDeliveryTime}m
            </span>
          )}
        </div>
      )}

      {/* PREP PROGRESS BAR */}
      {totalItems > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:'0.47rem', color:'#2a2e38', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.8px' }}>PREP PROGRESS</span>
            <span style={{ fontSize:'0.52rem', fontWeight:900, color: allDone ? '#d3bfa2' : '#333', fontFamily:'monospace' }}>{checkedCount}/{totalItems}</span>
          </div>
          <div style={{ height:3, background:'rgba(211,191,162,0.05)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background: allDone ? 'linear-gradient(90deg,#8a704d,#d3bfa2)' : urgency==='high' ? 'rgba(211,191,162,0.5)' : 'rgba(211,191,162,0.2)', borderRadius:2, transition:'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* ITEM LIST */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }} className="custom-scroll">
        {order.items.map((item, idx) => {
          if (item.isExtraItem || item.extraItemId != null) return null;

          let catId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || null;
          if (selectedCategory !== 'ALL' && catId !== selectedCategory.toLowerCase().trim()) return null;

          const isVeg = item.isVeg !== undefined
            ? item.isVeg !== false
            : (dishToVegMap?.[item.name?.toLowerCase().trim()] !== false);
          const modeMatch = tenantOnlyVeg ? true : isNonVegMode ? !isVeg : isVeg;
          if (!modeMatch) return null;

          const crossed      = !!checkedItemsGlobal[`${order._id}-${idx}`];
          const hasStarted   = !!itemStartTimes[idx];
          const elapsedSecs  = itemElapsed[idx] || 0;
          const isSlow       = hasStarted && !crossed && elapsedSecs >= 300;
          const finalSecs    = itemFinalTimes?.[idx] ?? elapsedSecs;

          /* Per-item source tag */
          const itemTag = isAggOrder
            ? { label: otype.toUpperCase(), color: accentColor[otype], bg:`${accentColor[otype]}10`, border:`${accentColor[otype]}30`, icon:<Zap size={9}/> }
            : isParcelOrder
              ? { label:'PARCEL',  color:'#bda88a', bg:'rgba(189,168,138,0.07)', border:'rgba(189,168,138,0.18)', icon:<Package size={9}/> }
              : { label:'DINE-IN', color:'#3a3e4a', bg:'rgba(255,255,255,0.02)', border:'rgba(211,191,162,0.05)', icon:<UtensilsCrossed size={9}/> };

          return (
            <div
              key={idx}
              onClick={() => toggleItemCrossed(idx)}
              onContextMenu={e => startItemTimer(idx, e)}
              style={{
                display:'flex', alignItems:'flex-start', gap:10,
                padding: isMobile?'10px 11px':'11px 12px',
                borderRadius:10,
                background: crossed ? 'rgba(211,191,162,0.02)' : hasStarted ? '#0a0b0e' : '#080809',
                border: `1px solid ${crossed ? 'rgba(211,191,162,0.04)' : hasStarted ? 'rgba(211,191,162,0.14)' : 'rgba(211,191,162,0.06)'}`,
                borderLeft: `3px solid ${crossed ? 'rgba(211,191,162,0.04)' : hasStarted ? 'rgba(211,191,162,0.4)' : 'rgba(211,191,162,0.08)'}`,
                cursor:'pointer', transition:'all 0.15s', userSelect:'none',
                opacity: crossed ? 0.5 : 1,
              }}>

              {/* Qty badge */}
              <div style={{ width:28, height:28, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize:'0.85rem', background: crossed ? 'rgba(211,191,162,0.03)' : 'rgba(211,191,162,0.09)', border:`1px solid ${crossed?'rgba(211,191,162,0.04)':'rgba(211,191,162,0.15)'}`, color: crossed ? '#2a2e38' : '#d3bfa2' }}>
                {item.quantity}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                {/* Name row */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                  <span style={{ fontSize: isMobile?'0.86rem':isTablet?'0.83rem':'0.9rem', fontWeight:700, lineHeight:1.25, textDecoration: crossed ? 'line-through' : 'none', color: crossed ? '#2a2e38' : item.isChefSpecial ? '#0f1013' : '#e8e0d0', background: item.isChefSpecial && !crossed ? 'linear-gradient(135deg,#bda88a,#d3bfa2)' : 'transparent', padding: item.isChefSpecial && !crossed ? '1px 6px' : 0, borderRadius: item.isChefSpecial ? 4 : 0 }}>
                    {item.isChefSpecial && !crossed && <Sparkles size={10} style={{ display:'inline', marginRight:3 }} />}
                    {item.name}
                  </span>

                  {/* Veg/NonVeg dot */}
                  {!tenantOnlyVeg && !crossed && (
                    <div style={{ width:10, height:10, border:`1.5px solid ${isVeg?'#4a7c3f':'#8a3030'}`, borderRadius: isVeg?'50%':2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isVeg
                        ? <div style={{ width:4, height:4, borderRadius:'50%', background:'#4a7c3f' }} />
                        : <div style={{ width:0, height:0, borderLeft:'2.5px solid transparent', borderRight:'2.5px solid transparent', borderBottom:'4px solid #8a3030' }} />}
                    </div>
                  )}

                  {/* Source tag */}
                  {!crossed && (
                    <div style={{ fontSize:'0.46rem', padding:'1px 5px', borderRadius:4, background:itemTag.bg, color:itemTag.color, border:`1px solid ${itemTag.border}`, fontWeight:900, display:'inline-flex', alignItems:'center', gap:2 }}>
                      {itemTag.icon} {itemTag.label}
                    </div>
                  )}
                </div>

                {/* Portion */}
                {!crossed && (
                  <div style={{ fontSize:'0.58rem', fontWeight:900, color: item.portion?.toLowerCase()==='half' ? '#d3bfa2' : '#3a3e4a', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.3px' }}>
                    {item.portion?.toUpperCase() || 'STANDARD'}
                  </div>
                )}

                {/* Cook timer */}
                {hasStarted && !crossed && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:2, fontSize:'0.52rem', fontWeight:900, color: isSlow ? '#d3bfa2' : 'rgba(211,191,162,0.3)', background: isSlow ? 'rgba(211,191,162,0.07)' : 'transparent', padding: isSlow ? '2px 6px' : 0, borderRadius:4, border: isSlow ? '1px solid rgba(211,191,162,0.15)' : 'none', fontFamily:'monospace' }}>
                    <Timer size={9} />
                    {`${Math.floor(elapsedSecs/60)}:${(elapsedSecs%60).toString().padStart(2,'0')}`}
                    {isSlow && <span style={{ display:'inline-flex', alignItems:'center', gap:2, fontSize:'0.44rem' }}><AlertTriangle size={8} strokeWidth={2.5} /> SLOW</span>}
                  </div>
                )}

                {/* Done time */}
                {crossed && hasStarted && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:2, fontSize:'0.52rem', color:'#2a2e38', fontFamily:'monospace', fontWeight:900 }}>
                    <Timer size={9} /> Done {Math.floor(finalSecs/60)}m {finalSecs%60}s
                  </div>
                )}

                {/* Long-press hint — only on first unchecked */}
                {!hasStarted && !crossed && idx === order.items.findIndex(i => !checkedItemsGlobal[`${order._id}-${order.items.indexOf(i)}`] && !i.isExtraItem && i.extraItemId == null) && (
                  <div style={{ fontSize:'0.46rem', color:'rgba(211,191,162,0.15)', marginTop:2, fontStyle:'italic' }}>Hold to start cook timer</div>
                )}

                {/* Suggestion note */}
                {item.suggestion && !crossed && (
                  <div style={{ display:'flex', alignItems:'flex-start', gap:5, marginTop:5, padding:'5px 8px', borderRadius:7, background:'rgba(211,191,162,0.04)', border:'1px solid rgba(211,191,162,0.08)' }}>
                    <StickyNote size={9} color="#8a704d" style={{ flexShrink:0, marginTop:1 }} />
                    <span style={{ fontSize:'0.6rem', color:'#bda88a', fontWeight:700, textTransform:'uppercase', lineHeight:1.4 }}>{item.suggestion}</span>
                  </div>
                )}
              </div>

              {/* Cross indicator */}
              {crossed && <CheckSquare size={16} color="rgba(211,191,162,0.3)" style={{ flexShrink:0, marginTop:2 }} />}
            </div>
          );
        })}
      </div>

      {/* CHEF NOTE PANEL */}
      {showNote && (
        <div style={{ marginTop:8, background:'rgba(211,191,162,0.04)', border:'1px solid rgba(211,191,162,0.1)', borderRadius:9, padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-start' }}>
          <StickyNote size={12} color="#8a704d" style={{ flexShrink:0, marginTop:2 }} />
          <textarea value={localNote} onChange={e => setLocalNote(e.target.value)} placeholder="Add a kitchen note for this ticket…"
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#bda88a', fontSize:'0.72rem', resize:'none', fontFamily:"'Outfit', sans-serif", lineHeight:1.5, minHeight:52 }} rows={2} />
        </div>
      )}

      {/* BOTTOM ACTIONS */}
      <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:10, flexShrink:0 }}>
        {/* Note toggle — small secondary action */}
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={() => setShowNote(v => !v)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', background:'transparent', border:'1px solid rgba(211,191,162,0.07)', color:'#3a3e4a', borderRadius:7, fontSize:'0.5rem', fontWeight:900, cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.22)'; e.currentTarget.style.color='#d3bfa2'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.07)'; e.currentTarget.style.color='#3a3e4a'; }}>
            <StickyNote size={10} /> {showNote ? 'HIDE NOTE' : 'ADD NOTE'}
          </button>
        </div>

        {/* DISPATCH BUTTON */}
        <button
          onClick={() => onReady(order._id)}
          style={{
            width:'100%',
            padding: isMobile?'15px':isTablet?'13px':'14px',
            borderRadius:12,
            border: allDone ? 'none' : `1px solid ${urgency==='high' ? 'rgba(211,191,162,0.4)' : 'rgba(211,191,162,0.15)'}`,
            fontWeight:900,
            fontSize: isMobile?'0.86rem':isTablet?'0.75rem':'0.78rem',
            cursor:'pointer',
            textTransform:'uppercase', letterSpacing:'0.8px',
            transition:'all 0.2s',
            background: urgency==='high'
              ? 'linear-gradient(135deg,#bda88a,#d3bfa2)'
              : allDone
                ? 'rgba(211,191,162,0.1)'
                : 'transparent',
            color: urgency==='high' ? '#0f1013' : '#d3bfa2',
            minHeight: isMobile?50:44,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
          {urgency === 'high' && <Flame size={14} color="#0f1013" strokeWidth={2.5} />}
          {urgency === 'high'
            ? 'OVERDUE — DISPATCH NOW'
            : allDone
              ? <><CheckCircle2 size={14} /> ALL READY — DISPATCH</>
              : <>COMPLETE TICKET <ArrowRight size={13} /></>}
        </button>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────
   STYLE TOKENS
───────────────────────────────────────────────────────────── */
const rs = {
  root: {
    position:'fixed', inset:0,
    display:'flex', flexDirection:'column',
    background:'#0d0e11', padding:'10px', gap:8,
    overflow:'hidden',
  },
  header: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    background:'#080809', padding:'9px 13px',
    borderRadius:13, border:'1px solid rgba(211,191,162,0.07)',
    flexShrink:0, zIndex:10, gap:8, minHeight:52,
    overflowX:'hidden',
  },
  iconBtn: {
    background:'#0a0a0c', border:'1px solid rgba(211,191,162,0.1)',
    padding:'8px', borderRadius:9, cursor:'pointer',
    display:'flex', alignItems:'center', flexShrink:0,
    transition:'all 0.15s',
  },
  utilBtn: {
    background:'#0a0a0c', border:'1px solid rgba(211,191,162,0.08)',
    color:'#fff', padding:'7px 11px', borderRadius:9,
    cursor:'pointer', display:'flex', alignItems:'center',
    gap:5, transition:'all 0.15s', flexShrink:0, minHeight:36,
  },
  dotGold: {
    width:5, height:5, background:'#d3bfa2', borderRadius:'50%',
    boxShadow:'0 0 7px rgba(211,191,162,0.7)', flexShrink:0,
  },
  dotRed: {
    width:5, height:5, background:'#ff4d4d', borderRadius:'50%',
    boxShadow:'0 0 7px rgba(255,77,77,0.7)', flexShrink:0,
  },
  body: { display:'flex', flex:1, gap:10, overflow:'hidden', minHeight:0 },
  sidebar: {
    background:'#080809', border:'1px solid rgba(211,191,162,0.07)',
    borderRadius:13, display:'flex', flexDirection:'column',
    padding:'15px 12px', flexShrink:0, height:'100%', overflowY:'auto',
  },
  sidebarHeaderIcon: {
    width:28, height:28, borderRadius:8,
    background:'rgba(211,191,162,0.05)', border:'1px solid rgba(211,191,162,0.12)',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  },
  sidebarBtn: (active) => ({
    display:'flex', alignItems:'center', padding:'10px 10px',
    borderRadius:9, border: active ? 'none' : '1px solid rgba(211,191,162,0.07)',
    background: active ? 'linear-gradient(135deg,#bda88a,#d3bfa2)' : 'rgba(211,191,162,0.02)',
    color: active ? '#0f1013' : '#888',
    cursor:'pointer', fontSize:'0.64rem', fontWeight: active ? 900 : 800,
    width:'100%', textAlign:'left', transition:'all 0.15s',
    letterSpacing:'0.3px', minHeight:40, gap:0,
    boxShadow: active ? '0 4px 12px rgba(211,191,162,0.12)' : 'none',
  }),
  countChip: (active, hasItems) => ({
    fontSize:'0.54rem', fontFamily:'monospace', padding:'1px 6px',
    borderRadius:5, fontWeight:900,
    background: active ? 'rgba(0,0,0,0.15)' : hasItems ? 'rgba(211,191,162,0.08)' : 'rgba(211,191,162,0.03)',
    color: active ? '#0f1013' : hasItems ? '#d3bfa2' : '#2a2e38',
    border: active ? 'none' : hasItems ? '1px solid rgba(211,191,162,0.15)' : '1px solid rgba(211,191,162,0.05)',
  }),
  workspace: {
    flex:1, overflowY:'auto', minWidth:0,
  },
  navBtn: {
    display:'flex', alignItems:'center', gap:5,
    background:'#080809', border:'1px solid rgba(211,191,162,0.1)',
    color:'#d3bfa2', padding:'10px 14px', borderRadius:9,
    cursor:'pointer', fontSize:'0.7rem', fontWeight:800, minHeight:44,
    transition:'all 0.15s',
  },
};

const wInput = {
  width:'100%', padding:'10px 12px',
  background:'#0d0e11', border:'1px solid rgba(211,191,162,0.1)',
  color:'#e8e0d0', borderRadius:9, fontSize:'0.8rem',
  outline:'none', boxSizing:'border-box',
  fontFamily:"'Outfit', sans-serif",
  transition:'border-color 0.15s',
};

const wFormLabel = {
  display:'block', fontSize:'0.5rem', color:'#2a2e38',
  fontWeight:900, letterSpacing:'1.2px', marginBottom:6,
  textTransform:'uppercase',
};

export default KitchenView;