/* ─── THEME: Warm White · White · Charcoal · Beige · Sage Green ───
   warm white  #F7F3EB   page background
   white       #FFFFFF   header, sidebar, tickets, panels
   charcoal    #2E3134   text, overdue emphasis
   beige       #E4D9C6   borders, soft fills
   sage green  #6B7F5F   accents, active states, buttons
   (Swiggy / Zomato brand colours and alert red are kept on purpose) */
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
  CheckCircle2, ArrowRight, Scale, FileText, Droplets, FlameKindling,
  PackageX, ShieldAlert, Wrench
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
  const [eightySixModal, setEightySixModal] = useState(null); // { categoryKey, categoryName }
  const [selectedDish86, setSelectedDish86] = useState(null);
  const [selectedReason86, setSelectedReason86] = useState('ran_out');
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

    // ── Keep menu availability live — an item 86'd or restored from the
    // Operator Portal (or auto-hidden by stock depletion) used to only reach
    // this screen's dish list whenever something else happened to trigger a
    // refetch, so the 86 modal could show stale availability in the meantime. ──
    socket.on('menu_updated', updatedItem => {
      if (!updatedItem || updatedItem.tenantId !== tenantId) return;
      setMenuItems(prev => prev.map(item =>
        item._id === updatedItem._id ? { ...item, ...updatedItem } : item
      ));
    });

    return () => {
      ['new_order','kds_item_cross_sync','order_modification_detected','menu_updated']
        .forEach(ev => socket.off(ev));
      socket.disconnect();
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [tenantId]);

  /* ── actions ── */
  const [processingOrderIds, setProcessingOrderIds] = useState(new Set());
  const markAsReady = async orderId => {
    if (processingOrderIds.has(orderId)) return; // block a double-tap while the request is in flight
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    setProcessingOrderIds(prev => new Set(prev).add(orderId));
    setRecallQueue(prev => [order, ...prev].slice(0, 10));
    const dur = Math.floor((Date.now() - new Date(order.createdAt)) / 1000);
    setTotalProcessingTime(prev  => { const n = prev + dur;  localStorage.setItem(`kds_processing_time_${tenantId}`, n); return n; });
    setCompletedTicketsCount(prev => { const n = prev + 1;   localStorage.setItem(`kds_completed_count_${tenantId}`, n); return n; });
    if (mobileCardIndex > 0) setMobileCardIndex(i => i - 1);
    // Remove it from the board immediately — instant feedback, and the card can no
    // longer be tapped again while the save is still in flight. Restore it on failure.
    setOrders(prev => prev.filter(o => o._id !== orderId));
    try {
      await axios.patch(`${BASE_URL}/admin/orders/${orderId}`, { status: 'served' });
    } catch (err) {
      console.error(err);
      setOrders(prev => prev.some(o => o._id === orderId) ? prev : [order, ...prev]);
      setRecallQueue(prev => prev.filter(o => o._id !== orderId));
      setCompletedTicketsCount(prev => Math.max(0, prev - 1));
    } finally {
      setProcessingOrderIds(prev => { const next = new Set(prev); next.delete(orderId); return next; });
    }
  };

  const handleRecall = () => {
    if (!recallQueue.length) return;
    setOrders(prev => [recallQueue[0], ...prev]);
    setRecallQueue(prev => prev.slice(1));
    setCompletedTicketsCount(prev => { const n = Math.max(0,prev-1); localStorage.setItem(`kds_completed_count_${tenantId}`,n); return n; });
  };

  const trigger86 = (categoryKey, categoryName) => {
    setEightySixModal({ categoryKey, categoryName });
    setSelectedDish86(null);
    setSelectedReason86('ran_out');
  };

  const confirm86 = async () => {
    if (!selectedDish86) return;
    try {
      await axios.patch(`${BASE_URL}/menu-item/${selectedDish86._id}`, {
        isAvailable: false,
        outOfStockReason: selectedReason86,
        outOfStockAt: new Date().toISOString(),
        outOfStockBy: 'Kitchen'
      });
      setEightySixModal(null);
      setSelectedDish86(null);
      fetchActiveOrders();
    } catch { alert('Could not update item.'); }
  };

  const EIGHTY_SIX_REASONS = [
    { id: 'ran_out',            label: 'Ran Out',           icon: PackageX },
    { id: 'quality_issue',      label: 'Quality Issue',     icon: ShieldAlert },
    { id: 'equipment_failure',  label: 'Equipment Failure', icon: Wrench },
  ];

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
totals[key] = (totals[key]||0) + (Number(i.quantity)||1);
    }));
    return totals;
  }, [orders, checkedItemsGlobal]);

  const masterPrepMarqueeList = useMemo(() => {
    const m = {};
    filteredOrders.forEach(o => o.items.filter(i => !i.isExtraItem && i.extraItemId == null).forEach((i,idx) => {
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
m[i.name] = (m[i.name]||0) + (Number(i.quantity)||1);
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
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:14, borderBottom:'1px solid rgba(196,178,148,0.28)', marginBottom:14, flexShrink:0 }}>
        <div style={rs.sidebarHeaderIcon}><Layers size={14} color="#56684c" /></div>
        <span style={{ fontSize:'0.56rem', fontWeight:900, color:'rgba(107,127,95,0.59)', letterSpacing:'2.5px', flex:1, textTransform:'uppercase' }}>STATIONS</span>
        {inDrawer && (
          <button onClick={() => setSidebarOpen(false)} style={{ background:'rgba(196,178,148,0.16)', border:'1px solid rgba(196,178,148,0.4)', color:'#8b8e88', cursor:'pointer', padding:'7px', borderRadius:8, display:'flex', alignItems:'center', transition:'all 0.15s' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* veg / non-veg toggle */}
      {!tenantOnlyVeg && (
        <div style={{ display:'flex', background:'#f1ebdf', borderRadius:9, border:'1px solid rgba(196,178,148,0.28)', padding:3, marginBottom:10, flexShrink:0 }}>
          {[false,true].map(nv => (
            <button key={String(nv)} onClick={() => { setIsNonVegMode(nv); setSelectedCategory('ALL'); }}
              style={{ flex:1, padding:'7px 4px', borderRadius:7, border:'none', cursor:'pointer', fontSize:'0.58rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.15s',
                background: isNonVegMode===nv ? (nv ? 'rgba(163,59,59,0.12)' : 'rgba(74,124,63,0.16)') : 'transparent',
                color: isNonVegMode===nv ? (nv ? '#a33b3b' : '#3f6b37') : '#7d8079' }}>
              <div style={{ width:10, height:10, border:`1.5px solid ${isNonVegMode===nv ? (nv?'#a33b3b':'#3f6b37') : '#8f928a'}`, borderRadius:nv?2:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {nv ? <div style={{ width:0, height:0, borderLeft:'2.5px solid transparent', borderRight:'2.5px solid transparent', borderBottom:`4.5px solid ${isNonVegMode?'#a33b3b':'#8f928a'}` }} />
                    : <div style={{ width:4, height:4, borderRadius:'50%', background:!isNonVegMode?'#3f6b37':'#8f928a' }} />}
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
                <Coffee size={12} color={sel?'#ffffff':'#8b8e88'} />
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
                <Flame size={12} color={sel?'#ffffff':count>0?'#6e8062':'#8f928a'} style={{ flexShrink:0 }} />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textTransform:'uppercase', fontSize:'0.62rem' }}>{cat.name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                <span title={`86 a dish in "${cat.name}"`} onClick={e => { e.stopPropagation(); trigger86(k, cat.name); }}
                  style={{ width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(196,178,148,0.12)', border:'1px solid rgba(196,178,148,0.28)', borderRadius:4, cursor:'pointer', color:'#8f928a', transition:'0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(107,127,95,0.45)'; e.currentTarget.style.color='#56684c'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(196,178,148,0.28)'; e.currentTarget.style.color='#8f928a'; }}>
                  <EyeOff size={9} />
                </span>
                <span style={{ ...rs.countChip(sel, count>0), minWidth:22, textAlign:'center' }}>{count<10?`0${count}`:count}</span>
              </div>
            </button>
          );
        })}

        {/* Speed Logs node */}
        <div style={{ marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(196,178,148,0.24)', display:'flex', flexDirection:'column', gap:4 }}>
          <button onClick={() => { setShowMetricsDashboard(true); setSidebarOpen(false); }} style={{ ...rs.sidebarBtn(showMetricsDashboard), justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <TrendingUp size={12} color={showMetricsDashboard?'#ffffff':'#8b8e88'} />
              SPEED LOGS
            </div>
            {completedTicketsCount > 0 && (
              <span style={{ ...rs.countChip(showMetricsDashboard, true) }}>{completedTicketsCount}</span>
            )}
          </button>
          {/* Refresh */}
          <button onClick={fetchActiveOrders} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 10px', borderRadius:9, border:'1px solid rgba(196,178,148,0.28)', background:'transparent', color:'#8f928a', cursor:'pointer', fontSize:'0.6rem', fontWeight:900, width:'100%', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#56684c'; e.currentTarget.style.borderColor='rgba(107,127,95,0.38)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='#8f928a'; e.currentTarget.style.borderColor='rgba(196,178,148,0.28)'; }}>
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
              style={{ position:'fixed', inset:0, background:'rgba(46,49,52,0.42)', zIndex:90, backdropFilter:'blur(3px)' }} />
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
              <AlignJustify size={18} color="#56684c" />
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:isMobile?28:34, height:isMobile?28:34, borderRadius:10, background:'rgba(196,178,148,0.24)', border:'1px solid rgba(196,178,148,0.56)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ChefHat size={isMobile?15:18} color="#56684c" />
            </div>
            <div>
              <h1 style={{ margin:0, fontWeight:900, letterSpacing:'3px', fontSize:isMobile?'0.8rem':isTablet?'0.85rem':'0.92rem', color:'#2e3134', fontFamily:"'Outfit',sans-serif", lineHeight:1.1 }}>
                PRATYEKSHA <span style={{ color:'rgba(107,127,95,0.59)', fontWeight:600, letterSpacing:'1px', fontSize:'0.6em' }}>KDS</span>
              </h1>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                <span style={isOnline ? rs.dotGold : rs.dotRed} />
                <span style={{ color:'#8a8d85', fontSize:'0.5rem', fontWeight:900, letterSpacing:'1.5px' }}>
                  {isOnline
                    ? (isMobile ? 'LIVE' : tenantName ? tenantName.toUpperCase() : 'KITCHEN — ONLINE')
                    : <span style={{ color:'#c25b4e', display:'inline-flex', alignItems:'center', gap:3 }}><WifiOff size={9} /> DISCONNECTED</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: action cluster */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, overflowX:'auto', scrollbarWidth:'none', msOverflowStyle:'none' }}>

          {/* Station filter — tablet/desktop */}
          {!isMobile && (
            <div style={{ display:'flex', background:'#f1ebdf', padding:3, borderRadius:9, border:'1px solid rgba(196,178,148,0.32)', flexShrink:0 }}>
              {[
                { val:'ALL',    lbl:'ALL',      icon:<Monitor size={11} /> },
                { val:'DINEIN', lbl:'DINE-IN',  icon:<UtensilsCrossed size={11} /> },
                { val:'PARCEL', lbl:'PARCEL',   icon:<Package size={11} /> },
              ].map(s => (
                <button key={s.val} onClick={() => setStationFilter(s.val)} style={{ padding:'6px 11px', background: stationFilter===s.val ? 'rgba(196,178,148,0.4)' : 'transparent', border:'none', color: stationFilter===s.val ? '#56684c' : '#7d8079', fontSize:'0.58rem', fontWeight:900, cursor:'pointer', borderRadius:7, display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap', transition:'all 0.15s' }}>
                  <span style={{ color: stationFilter===s.val ? '#56684c' : '#8f928a' }}>{s.icon}</span>
                  {s.lbl}
                </button>
              ))}
            </div>
          )}

          {/* Search toggle */}
          <button onClick={() => setShowSearch(v => !v)} style={{ ...rs.utilBtn, borderColor: showSearch ? 'rgba(107,127,95,0.52)' : 'rgba(196,178,148,0.32)', background: showSearch ? 'rgba(196,178,148,0.28)' : '#faf7f1' }}>
            <Search size={14} color={showSearch?'#56684c':'#8b8e88'} />
          </button>

          {/* Voice */}
          <button onClick={toggleVoice} className={isListening ? 'voice-pulse' : ''} style={{ ...rs.utilBtn, borderColor: isListening ? 'rgba(107,127,95,0.73)' : 'rgba(196,178,148,0.32)', background: isListening ? 'rgba(196,178,148,0.4)' : '#faf7f1' }}>
            <Mic size={14} color={isListening?'#56684c':'#8b8e88'} />
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: isListening?'#56684c':'#8b8e88' }}>{isListening ? 'LIVE' : 'VOICE'}</span>}
          </button>

          {/* Aggregate toggle */}
          <button onClick={() => setIsAggregateView(v => !v)} style={{ ...rs.utilBtn, background: isAggregateView ? 'rgba(196,178,148,0.28)' : '#faf7f1', borderColor: isAggregateView ? 'rgba(107,127,95,0.52)' : 'rgba(196,178,148,0.32)' }}>
            {isAggregateView ? <LayoutGrid size={14} color="#56684c" /> : <BarChart3 size={14} color="#8b8e88" />}
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: isAggregateView?'#56684c':'#8b8e88' }}>{isAggregateView ? 'TICKETS' : 'SUMMARY'}</span>}
          </button>

          {/* Recall */}
          {recallQueue.length > 0 && (
            <button onClick={handleRecall} style={{ ...rs.utilBtn, borderColor:'rgba(107,127,95,0.45)', background:'rgba(196,178,148,0.2)', position:'relative' }}>
              <History size={14} color="#56684c" />
              {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color:'#56684c' }}>RECALL</span>}
              <div style={{ position:'absolute', top:-6, right:-6, width:16, height:16, borderRadius:'50%', background:'linear-gradient(135deg,#71856a,#586b4f)', color:'#ffffff', fontSize:'0.48rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace' }}>{recallQueue.length}</div>
            </button>
          )}

          {/* Wastage */}
          <button onClick={() => setShowWastagePanel(true)} style={{ ...rs.utilBtn, borderColor: showWastagePanel ? 'rgba(107,127,95,0.52)' : 'rgba(196,178,148,0.32)', background: showWastagePanel ? 'rgba(196,178,148,0.28)' : '#faf7f1', position:'relative' }}>
            <Trash2 size={14} color={showWastagePanel?'#56684c':'#8b8e88'} />
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: showWastagePanel?'#56684c':'#8b8e88' }}>WASTAGE</span>}
            {wastageLog.filter(e => new Date(e.loggedAt||e.createdAt).toDateString()===new Date().toDateString()).length > 0 && (
              <div style={{ position:'absolute', top:-5, right:-5, width:14, height:14, borderRadius:'50%', background:'rgba(107,127,95,1)', color:'#ffffff', fontSize:'0.44rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {wastageLog.filter(e => new Date(e.loggedAt||e.createdAt).toDateString()===new Date().toDateString()).length}
              </div>
            )}
          </button>

          {/* Ticket count pill */}
          <div style={{ background: filteredOrders.length>0 ? 'linear-gradient(135deg,#71856a,#586b4f)' : '#faf7f1', padding:'7px 13px', borderRadius:10, display:'flex', alignItems:'center', gap:6, flexShrink:0, border: filteredOrders.length===0 ? '1px solid rgba(196,178,148,0.32)' : 'none', minHeight:38 }}>
            <span style={{ color: filteredOrders.length>0 ? '#ffffff' : '#9ea098', fontSize:'1.05rem', fontWeight:950, fontFamily:'JetBrains Mono, monospace', lineHeight:1 }}>{filteredOrders.length<10?`0${filteredOrders.length}`:filteredOrders.length}</span>
            {!isMobile && <span style={{ color: filteredOrders.length>0 ? '#ffffff' : '#9ea098', fontSize:'0.5rem', fontWeight:900, letterSpacing:'0.5px' }}>TICKETS</span>}
          </div>
        </div>
      </header>

      {/* ── SEARCH BAR ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
            style={{ display:'flex', alignItems:'center', gap:9, background:'#ffffff', border:'1px solid rgba(196,178,148,0.4)', borderRadius:11, padding:'9px 14px', flexShrink:0 }}>
            <Search size={13} color="#8c7d64" />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by table number, source, or dish name…" style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#2e3134', fontSize:'0.82rem', fontFamily:"'Outfit',sans-serif" }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background:'rgba(196,178,148,0.24)', border:'1px solid rgba(196,178,148,0.48)', color:'#6c6f6f', borderRadius:6, cursor:'pointer', padding:'4px 8px', display:'flex', alignItems:'center', gap:4, fontSize:'0.58rem', fontWeight:900 }}>
                <X size={11} /> CLEAR
              </button>
            )}
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ background:'transparent', border:'none', color:'#8f928a', cursor:'pointer', display:'flex', alignItems:'center' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREP MARQUEE ── */}
      <AnimatePresence>
        {masterPrepMarqueeList.length > 0 && !isAggregateView && !showMetricsDashboard && (
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ display:'flex', alignItems:'center', background:'#f1ebdf', border:'1px solid rgba(196,178,148,0.28)', padding:'7px 14px', borderRadius:10, gap:10, overflow:'hidden', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.52rem', fontWeight:900, color:'#8c7d64', letterSpacing:'1.5px', flexShrink:0 }}>
              <Activity size={10} /> PREP QUEUE
            </div>
            <div style={{ width:'1px', height:'14px', background:'rgba(196,178,148,0.4)', flexShrink:0 }} />
            <div style={{ display:'flex', gap:7, overflowX:'auto' }} className="no-scrollbar">
              {masterPrepMarqueeList.map(([name,qty]) => (
                <div key={name} style={{ background:'#faf7f1', border:'1px solid rgba(196,178,148,0.4)', padding:'3px 10px', borderRadius:6, display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                  <span style={{ color:'#56684c', fontWeight:900, fontFamily:'monospace', fontSize:'0.72rem' }}>{qty}×</span>
                  <span style={{ fontSize:'0.65rem', fontWeight:800, color:'#4a4d4f', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.3px' }}>{name}</span>
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
            style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(196,178,148,0.08)', border:'1px solid rgba(196,178,148,0.28)', borderRadius:9, padding:'6px 13px', flexShrink:0, overflow:'hidden' }}>
            <History size={10} color="rgba(107,127,95,0.45)" />
            <span style={{ fontSize:'0.5rem', color:'rgba(107,127,95,0.45)', fontWeight:900, letterSpacing:'1px', flexShrink:0 }}>RECALL ({recallQueue.length}/10)</span>
            <div style={{ display:'flex', gap:5, overflowX:'auto' }} className="no-scrollbar">
              {recallQueue.map((o,i) => (
                <span key={i} style={{ fontSize:'0.56rem', fontWeight:900, padding:'2px 8px', borderRadius:5, background: i===0 ? 'rgba(196,178,148,0.4)' : '#f7f3eb', border:`1px solid ${i===0?'rgba(107,127,95,0.38)':'#e4d9c6'}`, color: i===0?'#56684c':'#8a8d85', whiteSpace:'nowrap', flexShrink:0, fontFamily:'monospace' }}>
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
            style={{ background:'#fdf0ec', border:'1px solid rgba(181,72,60,0.3)', padding: isMobile ? '12px 14px' : '13px 20px', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection: isMobile ? 'column' : 'row', gap:12, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ background:'rgba(181,72,60,0.10)', padding:9, borderRadius:9, flexShrink:0 }}><BellRing size={17} color="#b5483c" /></div>
              <div>
                <h3 style={{ margin:0, fontSize: isMobile ? '0.82rem' : '0.95rem', fontWeight:900, color:'#2e3134' }}>ORDER CHANGE — TABLE {alert.tableNumber}</h3>
                <p style={{ margin:'3px 0 0', color:'#6b6e70', fontSize:'0.65rem' }}>
                  Modification: <span style={{ color:'#9a3f35', fontWeight:700 }}>"{alert.modificationNote}"</span>
                </p>
              </div>
            </div>
            <button onClick={() => setInterceptedAlerts(prev => prev.filter(a => a.id !== alert.id))}
              style={{ background:'#ffffff', border:'1px solid rgba(181,72,60,0.3)', color:'#b5483c', padding:'9px 16px', borderRadius:8, fontSize:'0.66rem', fontWeight:900, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s' }}>
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
            <div style={{ background:'#ffffff', border:'1px solid rgba(196,178,148,0.28)', borderRadius:13, padding:'13px 15px', flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <Activity size={12} color="#56684c" />
                  <span style={{ color:'rgba(107,127,95,0.8)', fontSize:'0.53rem', fontWeight:900, letterSpacing:'2px', textTransform:'uppercase' }}>KITCHEN HEALTH</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, background: kitchenHealth.bottleneck ? 'rgba(181,72,60,0.08)' : 'rgba(196,178,148,0.16)', border:`1px solid ${kitchenHealth.bottleneck ? 'rgba(181,72,60,0.2)' : 'rgba(196,178,148,0.32)'}` }}>
                  {kitchenHealth.bottleneck ? <AlertTriangle size={9} color="#b5483c" /> : <CheckCircle2 size={9} color="#56684c" />}
                  <span style={{ fontSize:'0.5rem', fontWeight:900, color: kitchenHealth.bottleneck ? '#b5483c' : '#8c7d64', letterSpacing:'0.5px' }}>
                    {kitchenHealth.bottleneck ? `BOTTLENECK: ${kitchenHealth.bottleneck}` : 'ALL STATIONS NORMAL'}
                  </span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(kitchenHealth.stations.slice(0,5).length, isMobile?2:5)},1fr)`, gap:8 }}>
                {kitchenHealth.stations.slice(0,5).map(s => (
                  <div key={s.name} style={{ background:'#faf7f1', border:`1px solid ${s.isBottleneck ? 'rgba(181,72,60,0.2)' : 'rgba(196,178,148,0.24)'}`, borderRadius:8, padding:'9px 10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:'0.55rem', color: s.isBottleneck ? '#b5483c' : '#75786f', fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, marginRight:4 }}>{s.name}</span>
                      <span style={{ fontSize:'0.54rem', fontFamily:'monospace', fontWeight:900, color: s.isBottleneck ? '#b5483c' : '#8f918c', flexShrink:0 }}>{s.pending}</span>
                    </div>
                    <div style={{ height:3, background:'rgba(196,178,148,0.24)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100, Math.round((s.pending/Math.max(s.pending,5))*100))}%`, background: s.isBottleneck ? '#b5483c' : 'rgba(107,127,95,0.66)', borderRadius:2, transition:'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
              {kitchenHealth.recommendation && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:7, marginTop:10, padding:'8px 11px', background:'rgba(196,178,148,0.12)', border:'1px solid rgba(196,178,148,0.24)', borderRadius:8 }}>
                  <Zap size={11} color="#8c7d64" style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ fontSize:'0.6rem', color:'#8b8e88', lineHeight:1.55 }}>{kitchenHealth.recommendation}</span>
                </div>
              )}
            </div>
          )}

          {/* SPEED METRICS PANEL */}
          {showMetricsDashboard && (
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
              style={{ background:'#ffffff', border:'1px solid rgba(196,178,148,0.32)', borderRadius:16, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding: isMobile ? '36px 20px' : '52px 30px', minHeight:300 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <TrendingUp size={22} color="#56684c" />
                <h2 style={{ margin:0, fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight:900, letterSpacing:'3px', color:'#2e3134', textTransform:'uppercase' }}>Speed Metrics</h2>
              </div>
              <p style={{ color:'#a0a299', fontSize:'0.6rem', marginBottom:32, letterSpacing:'0.5px', textAlign:'center' }}>Session performance — resets at midnight IST</p>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14, width:'100%', maxWidth:520, marginBottom:28 }}>
                {[
                  { label:'TICKETS DISPATCHED', value:completedTicketsCount, sub:'today', big:true },
                  { label:'AVG CLEAR TIME',      value:avgClearTime,          sub:'per ticket', big:false },
                  { label:'CURRENTLY PENDING',   value:filteredOrders.length, sub:'active tickets', big:true },
                ].map(s => (
                  <div key={s.label} style={{ background:'#faf7f1', border:'1px solid rgba(196,178,148,0.32)', borderTop:'2px solid rgba(107,127,95,0.31)', padding:'22px 20px', borderRadius:13, textAlign:'center' }}>
                    <div style={{ fontSize:'0.5rem', fontWeight:900, color:'#8a8d85', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>{s.label}</div>
                    <div style={{ fontSize: s.big ? '2.8rem' : '1.8rem', fontWeight:950, color:'#56684c', fontFamily:'JetBrains Mono, monospace', lineHeight:1, marginBottom:6 }}>{s.value}</div>
                    <div style={{ fontSize:'0.58rem', color:'#a0a299', fontWeight:700 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowMetricsDashboard(false)}
                style={{ background:'transparent', border:'1px solid rgba(107,127,95,0.38)', color:'#56684c', padding:'11px 28px', borderRadius:10, fontSize:'0.7rem', fontWeight:900, cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ChevronLeft size={13} /> BACK TO KITCHEN</span>
              </button>
            </motion.div>
          )}

          {/* AGGREGATE SUMMARY */}
          {!showMetricsDashboard && isAggregateView && (
            <div style={{ flex:1, overflowY:'auto' }} className="no-scrollbar">
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <BarChart3 size={14} color="#8c7d64" />
                <span style={{ fontSize:'0.57rem', fontWeight:900, color:'#7d8079', letterSpacing:'2px', textTransform:'uppercase' }}>BATCH PREP SUMMARY</span>
                <span style={{ marginLeft:'auto', fontSize:'0.54rem', color:'#a0a299', fontFamily:'monospace' }}>
                  {Object.keys(aggregatedTotals).length} items · {filteredOrders.length} tickets
                </span>
              </div>
              {Object.keys(aggregatedTotals).length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:12 }}>
                  <ChefHat size={32} color="#cfc7b6" />
                  <p style={{ color:'#a0a299', fontWeight:900, fontSize:'0.82rem', letterSpacing:'2px', margin:0 }}>KITCHEN CLEAR</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'140px':'160px'}, 1fr))`, gap: isMobile ? 10 : 13 }}>
                  {Object.entries(aggregatedTotals).map(([key, qty]) => {
                    const [namePart, typePart] = key.split('__');
                    const isParcel = typePart === 'P';
                    return (
                      <div key={key} style={{ background:'#ffffff', border:`1px solid ${isParcel?'rgba(196,178,148,0.56)':'rgba(196,178,148,0.28)'}`, borderTop:`2px solid ${isParcel?'rgba(107,127,95,0.73)':'rgba(107,127,95,0.31)'}`, borderRadius:13, padding: isMobile ? '16px 12px' : '20px 14px', textAlign:'center' }}>
                        <div style={{ fontSize: isMobile ? '2.4rem' : '2.8rem', fontWeight:900, color:'#56684c', fontFamily:'JetBrains Mono, monospace', lineHeight:1, marginBottom:8 }}>{qty<10?`0${qty}`:qty}</div>
                        <div style={{ fontSize: isMobile ? '0.62rem' : '0.67rem', color:'#6c6f6f', fontWeight:800, textTransform:'uppercase', lineHeight:1.4, marginBottom:7 }}>{namePart}</div>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.47rem', fontWeight:900, padding:'2px 7px', borderRadius:5, background: isParcel ? 'rgba(196,178,148,0.32)' : 'rgba(60,50,35,0.04)', color: isParcel ? '#56684c' : '#7d8079', border:`1px solid ${isParcel?'rgba(107,127,95,0.31)':'rgba(196,178,148,0.16)'}` }}>
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
                <div style={{ width:64, height:64, borderRadius:18, background:'#ffffff', border:'1px solid rgba(196,178,148,0.24)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChefHat size={30} color="#cfc7b6" /></div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontWeight:900, color:'#a0a299', fontSize:'0.85rem', letterSpacing:'2px', margin:'0 0 4px' }}>KITCHEN CLEAR</p>
                  <p style={{ fontSize:'0.6rem', color:'#a8aaa1', margin:0, fontWeight:700 }}>Waiting for next order…</p>
                </div>
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, overflow:'hidden' }}>
                {/* Dot nav */}
                <div style={{ display:'flex', justifyContent:'center', gap:5, flexShrink:0, flexWrap:'wrap', padding:'0 20px' }}>
                  {filteredOrders.map((_,i) => (
                    <div key={i} onClick={() => setMobileCardIndex(i)} style={{ width: i===safeCardIndex ? 20 : 6, height:6, borderRadius:3, background: i===safeCardIndex ? '#56684c' : '#ddd3c0', transition:'all 0.25s', cursor:'pointer' }} />
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
                  <span style={{ color:'#7d8079', fontSize:'0.7rem', fontWeight:900, fontFamily:'monospace' }}>{safeCardIndex+1} / {filteredOrders.length}</span>
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
                  <div style={{ width:64, height:64, borderRadius:18, background:'#ffffff', border:'1px solid rgba(196,178,148,0.24)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChefHat size={30} color="#cfc7b6" /></div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontWeight:900, color:'#a0a299', fontSize:'0.85rem', letterSpacing:'2px', margin:'0 0 4px' }}>KITCHEN CLEAR</p>
                    <p style={{ fontSize:'0.6rem', color:'#a8aaa1', margin:0, fontWeight:700 }}>All tickets dispatched</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav style={{ display:'flex', background:'#ffffff', border:'1px solid rgba(196,178,148,0.28)', borderRadius:14, padding:'3px', flexShrink:0, gap:2 }}>
          {[
            { val:'ALL',    lbl:'ALL',     icon:<Monitor size={16} /> },
            { val:'DINEIN', lbl:'DINE-IN', icon:<UtensilsCrossed size={16} /> },
            { val:'PARCEL', lbl:'PARCEL',  icon:<Package size={16} /> },
          ].map(s => (
            <button key={s.val} onClick={() => setStationFilter(s.val)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: stationFilter===s.val ? 'rgba(196,178,148,0.32)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: stationFilter===s.val ? '#56684c' : '#8f928a', transition:'all 0.15s' }}>
              {s.icon}
              <span style={{ fontSize:'0.48rem', fontWeight:900, letterSpacing:'0.3px' }}>{s.lbl}</span>
              {s.val !== 'ALL' && (() => {
                const c = filteredOrders.filter(o => {
                  const t = getOrderType(o);
                  return s.val==='DINEIN' ? t==='dine-in' : t==='parcel';
                }).length;
                return c > 0 ? <span style={{ fontSize:'0.44rem', fontFamily:'monospace', fontWeight:900, color:'#8c7d64' }}>{c}</span> : null;
              })()}
            </button>
          ))}
          <button onClick={() => setIsAggregateView(v => !v)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: isAggregateView ? 'rgba(196,178,148,0.32)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: isAggregateView ? '#56684c' : '#8f928a', transition:'all 0.15s' }}>
            <BarChart3 size={16} />
            <span style={{ fontSize:'0.48rem', fontWeight:900 }}>SUMMARY</span>
          </button>
          <button onClick={() => setShowMetricsDashboard(v => !v)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: showMetricsDashboard ? 'rgba(196,178,148,0.32)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: showMetricsDashboard ? '#56684c' : '#8f928a', transition:'all 0.15s' }}>
            <TrendingUp size={16} />
            <span style={{ fontSize:'0.48rem', fontWeight:900 }}>METRICS</span>
          </button>
        </nav>
      )}

      {/* WASTAGE PANEL */}
      <AnimatePresence>
        {showWastagePanel && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:0.4 }} exit={{ opacity:0 }}
              onClick={() => setShowWastagePanel(false)}
              style={{ position:'fixed', inset:0, background:'#2e3134', zIndex:3000, backdropFilter:'blur(4px)' }} />
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:32 }}
              style={{ position:'fixed', right:0, top:0, bottom:0, width: isMobile ? '100vw' : isTablet ? 420 : 500, background:'#ffffff', borderLeft:'1px solid rgba(196,178,148,0.32)', borderRadius: isMobile ? 0 : '16px 0 0 16px', zIndex:3001, display:'flex', flexDirection:'column', overflow:'hidden' }}>

              {/* Panel header */}
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(196,178,148,0.24)', background:'#ffffff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(196,178,148,0.2)', border:'1px solid rgba(196,178,148,0.48)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Trash2 size={16} color="#56684c" />
                  </div>
                  <div>
                    <div style={{ fontWeight:900, fontSize:'0.88rem', color:'#2e3134', letterSpacing:0.3 }}>WASTAGE LOG</div>
                    <div style={{ fontSize:'0.5rem', color:'#8a8d85', fontWeight:900, letterSpacing:'1.5px', marginTop:2, textTransform:'uppercase' }}>Spoilage · Overcooked · Dropped · Excess</div>
                  </div>
                </div>
                <button onClick={() => setShowWastagePanel(false)} style={{ background:'#f7f3eb', border:'1px solid rgba(196,178,148,0.4)', color:'#8f918c', padding:8, borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', background:'#ffffff', borderBottom:'1px solid rgba(196,178,148,0.24)', flexShrink:0 }}>
                {[['log','LOG ENTRY'],['report','MONTHLY REPORT']].map(([t,lbl]) => (
                  <button key={t} onClick={() => setWastageTab(t)} style={{ flex:1, padding:'12px 0', background:'transparent', border:'none', cursor:'pointer', fontSize:'0.58rem', fontWeight:900, letterSpacing:'1px', color: wastageTab===t ? '#56684c' : '#8a8d85', borderBottom:`2px solid ${wastageTab===t ? 'rgba(107,127,95,0.8)' : 'transparent'}`, transition:'all 0.15s' }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Panel body */}
              <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }} className="custom-scroll">
                {wastageTab === 'log' ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {/* NEW ENTRY FORM */}
                    <div style={{ background:'#f7f3eb', border:'1px solid rgba(196,178,148,0.32)', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
                      <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#7d8079', letterSpacing:'2px', textTransform:'uppercase', paddingBottom:10, borderBottom:'1px solid rgba(196,178,148,0.2)' }}>NEW ENTRY</div>

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
                          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#ffffff', border:'1px solid rgba(196,178,148,0.48)', borderRadius:9, zIndex:10, overflow:'hidden', marginTop:2, boxShadow:'0 8px 24px rgba(60,50,35,0.16)' }}>
                            {wastageSuggestions.map(s => (
                              <button key={s._id} onMouseDown={() => { setWastageForm(p => ({ ...p, itemName:s.itemName, inventoryId:s._id, unit:s.unit||'kg' })); setShowWastageSuggest(false); }}
                                style={{ width:'100%', padding:'10px 14px', background:'transparent', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', color:'#4a4d4f', fontSize:'0.75rem', fontWeight:700, textAlign:'left', transition:'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(196,178,148,0.24)'}
                                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                <span>{s.itemName}</span>
                                <span style={{ fontSize:'0.58rem', color:'#7d8079', fontFamily:'monospace' }}>{s.currentStock}{s.unit}</span>
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
                              style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${wastageForm.reason===r?'rgba(107,127,95,0.59)':'rgba(196,178,148,0.32)'}`, background: wastageForm.reason===r ? 'rgba(196,178,148,0.4)' : 'transparent', color: wastageForm.reason===r ? '#56684c' : '#7d8079', fontSize:'0.58rem', fontWeight:900, cursor:'pointer', transition:'all 0.15s' }}>
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
                        style={{ padding:'12px', borderRadius:11, border:'none', background: (wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()) ? '#f7f3eb' : 'linear-gradient(135deg,#71856a,#586b4f)', color: (wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()) ? '#8a8d85' : '#ffffff', fontWeight:900, fontSize:'0.72rem', cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6, minHeight:46 }}>
                        {wastageSaving ? <><RotateCcw size={13} style={{ animation:'spin 1s linear infinite' }} /> SAVING…</> : <><Trash2 size={13} /> LOG WASTAGE</>}
                      </button>
                    </div>

                    {/* LOG LIST */}
                    {wastageLoading ? (
                      <div style={{ textAlign:'center', padding:'24px', color:'#8a8d85', fontSize:'0.7rem' }}>Loading log…</div>
                    ) : wastageLog.length > 0 ? (
                      <div>
                        <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#8a8d85', letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>TODAY'S ENTRIES — {wastageLog.length}</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {[...wastageLog].reverse().map(e => (
                            <div key={e._id} style={{ background:'#f7f3eb', border:'1px solid rgba(196,178,148,0.24)', borderLeft:'3px solid rgba(107,127,95,0.31)', borderRadius:10, padding:'11px 14px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                                  <span style={{ fontWeight:800, fontSize:'0.76rem', color:'#4a4d4f' }}>{e.itemName}</span>
                                  <span style={{ fontSize:'0.52rem', fontFamily:'monospace', color:'#8c7d64', fontWeight:900, padding:'1px 5px', borderRadius:4, background:'rgba(140,125,100,0.12)', border:'1px solid rgba(140,125,100,0.3)' }}>{e.quantity}{e.unit}</span>
                                  {e.costLoss > 0 && <span style={{ fontSize:'0.54rem', color:'#56684c', fontFamily:'monospace', marginLeft:'auto', fontWeight:900 }}>₹{e.costLoss.toFixed(0)}</span>}
                                </div>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  <span style={{ fontSize:'0.5rem', padding:'1px 6px', borderRadius:4, background:'rgba(196,178,148,0.16)', color:'#8b8e88', border:'1px solid rgba(196,178,148,0.28)', fontWeight:700 }}>{e.reason}</span>
                                  <span style={{ fontSize:'0.5rem', color:'#8a8d85', fontWeight:700 }}>{e.loggedBy}</span>
                                  {e.notes && <span style={{ fontSize:'0.5rem', color:'#a0a299', fontStyle:'italic' }}>{e.notes}</span>}
                                </div>
                              </div>
                              <button onClick={() => deleteWastageEntry(e._id)} style={{ background:'transparent', border:'1px solid rgba(196,178,148,0.24)', color:'#8a8d85', padding:'5px', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.15s', flexShrink:0 }}
                                onMouseEnter={ev => { ev.currentTarget.style.borderColor='rgba(107,127,95,0.38)'; ev.currentTarget.style.color='#56684c'; }}
                                onMouseLeave={ev => { ev.currentTarget.style.borderColor='rgba(196,178,148,0.24)'; ev.currentTarget.style.color='#8a8d85'; }}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign:'center', padding:'30px 20px', background:'#f7f3eb', borderRadius:12, border:'1px dashed rgba(196,178,148,0.24)' }}>
                        <div style={{ fontSize:'0.64rem', color:'#a0a299', fontWeight:700 }}>No wastage entries today</div>
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
                            <div key={s.l} style={{ background:'#f7f3eb', border:'1px solid rgba(196,178,148,0.28)', borderRadius:11, padding:'12px 10px', textAlign:'center' }}>
                              <div style={{ fontSize:'0.48rem', color:'#8a8d85', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>{s.l}</div>
                              <div style={{ fontSize:'1.05rem', fontWeight:900, color:'#56684c', fontFamily:'monospace' }}>{s.v}</div>
                            </div>
                          ))}
                        </div>

                        {wastageAnalytics.byReason && Object.keys(wastageAnalytics.byReason).length > 0 && (
                          <div style={{ background:'#f7f3eb', border:'1px solid rgba(196,178,148,0.28)', borderRadius:12, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#8a8d85', letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:14, paddingBottom:10, borderBottom:'1px solid rgba(196,178,148,0.2)', display:'flex', alignItems:'center', gap:6 }}>
                              <Scale size={11} color="#7d8079" /> BY REASON
                            </div>
                            {Object.entries(wastageAnalytics.byReason).sort((a,b) => b[1].cost - a[1].cost).map(([reason, data]) => {
                              const pct = wastageAnalytics.totalEntries > 0 ? Math.round((data.count/wastageAnalytics.totalEntries)*100) : 0;
                              return (
                                <div key={reason} style={{ marginBottom:10 }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                                    <span style={{ fontSize:'0.64rem', fontWeight:800, color:'#6c6f6f' }}>{reason}</span>
                                    <span style={{ fontSize:'0.62rem', fontWeight:900, color:'#56684c', fontFamily:'monospace' }}>
                                      {data.cost > 0 ? `₹${data.cost.toFixed(0)}` : `${data.count}×`}
                                      <span style={{ color:'#8a8d85', fontWeight:600, marginLeft:6 }}>{pct}%</span>
                                    </span>
                                  </div>
                                  <div style={{ height:4, background:'rgba(196,178,148,0.2)', borderRadius:2, overflow:'hidden' }}>
                                    <div style={{ height:'100%', width:`${pct}%`, background:'rgba(107,127,95,0.52)', borderRadius:2, transition:'width 0.6s ease' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(wastageAnalytics.dailyTrend||[]).length > 0 && (
                          <div style={{ background:'#f7f3eb', border:'1px solid rgba(196,178,148,0.28)', borderRadius:12, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#8a8d85', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                              <TrendingDown size={11} color="#8c7d64" /> DAILY COST TREND (30 days)
                            </div>
                            <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:52 }}>
                              {(() => {
                                const maxC = Math.max(...wastageAnalytics.dailyTrend.map(d => d.cost), 1);
                                return wastageAnalytics.dailyTrend.map(d => (
                                  <div key={d.date} title={`${d.date}: ₹${d.cost.toFixed(0)}`}
                                    style={{ flex:1, minWidth:0, height:`${Math.max(8, Math.round((d.cost/maxC)*100))}%`, background: d.cost>0 ? `rgba(107,127,95,${0.25+(d.cost/maxC)*0.6})` : '#eee6d6', borderRadius:'3px 3px 0 0', transition:'height 0.4s ease' }} />
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        <button onClick={fetchWastageAnalytics} style={{ padding:'11px', background:'transparent', border:'1px solid rgba(196,178,148,0.48)', color:'#8c7d64', borderRadius:10, fontSize:'0.64rem', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                          <RefreshCw size={12} /> REFRESH REPORT
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign:'center', padding:'40px 20px' }}>
                        <button onClick={fetchWastageAnalytics} style={{ padding:'10px 22px', background:'rgba(196,178,148,0.2)', border:'1px solid rgba(196,178,148,0.48)', color:'#8c7d64', borderRadius:9, fontSize:'0.65rem', fontWeight:900, cursor:'pointer' }}>LOAD MONTHLY REPORT</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 86 (OUT OF STOCK) MODAL — pick the dish, pick a reason, hide it with the reason logged */}
      <AnimatePresence>
        {eightySixModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              onClick={() => setEightySixModal(null)}
              style={{ position: 'fixed', inset: 0, background: '#2e3134', zIndex: 3100, backdropFilter: 'blur(4px)' }} />
            {/* Centering + scroll wrapper — must stay transform-free: framer-motion owns
                the transform on the modal below via animate={{scale,y}}, and mixing that
                with a manual translate(-50%,-50%) here made the centering offset get
                silently dropped, which is why this used to open off-screen at the bottom. */}
            <div onClick={() => setEightySixModal(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 3101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{ width: isMobile ? '92vw' : 420, maxHeight: 'calc(82vh - 40px)', background: '#ffffff', border: '1px solid rgba(196,178,148,0.48)', borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 'auto', boxShadow: '0 30px 80px rgba(60,50,35,0.24)' }}>

              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(196,178,148,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(46,49,52,0.1)', border: '1px solid rgba(46,49,52,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PackageX size={15} color="#2e3134" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#2e3134' }}>86 A DISH</div>
                    <div style={{ fontSize: '0.5rem', color: '#8a8d85', fontWeight: 800, letterSpacing: '0.5px', marginTop: 2, textTransform: 'uppercase' }}>{eightySixModal.categoryName}</div>
                  </div>
                </div>
                <button onClick={() => setEightySixModal(null)} style={{ background: '#f7f3eb', border: '1px solid rgba(196,178,148,0.4)', color: '#8f918c', padding: 7, borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.56rem', fontWeight: 900, color: '#8a8d85', letterSpacing: '1px', marginBottom: 9, textTransform: 'uppercase' }}>Which dish?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, maxHeight: 200, overflowY: 'auto' }}>
                  {menuItems.filter(m => (m.categoryId || '').toLowerCase().trim() === eightySixModal.categoryKey && m.isAvailable !== false).map(dish => (
                    <button key={dish._id} onClick={() => setSelectedDish86(dish)}
                      style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, color: selectedDish86?._id === dish._id ? '#56684c' : '#6c6f6f', background: selectedDish86?._id === dish._id ? 'rgba(196,178,148,0.36)' : 'transparent', border: `1px solid ${selectedDish86?._id === dish._id ? 'rgba(107,127,95,0.59)' : 'rgba(196,178,148,0.28)'}`, transition: 'all 0.15s' }}>
                      {dish.name}
                    </button>
                  ))}
                  {menuItems.filter(m => (m.categoryId || '').toLowerCase().trim() === eightySixModal.categoryKey && m.isAvailable !== false).length === 0 && (
                    <div style={{ fontSize: '0.62rem', color: '#8f928a', fontStyle: 'italic', padding: '8px 2px' }}>Everything in this category is already 86'd.</div>
                  )}
                </div>

                {selectedDish86 && (
                  <>
                    <div style={{ fontSize: '0.56rem', fontWeight: 900, color: '#8a8d85', letterSpacing: '1px', marginBottom: 9, textTransform: 'uppercase' }}>Why?</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                      {EIGHTY_SIX_REASONS.map(r => {
                        const RIcon = r.icon;
                        const active = selectedReason86 === r.id;
                        return (
                          <button key={r.id} onClick={() => setSelectedReason86(r.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, color: active ? '#56684c' : '#6c6f6f', background: active ? 'rgba(196,178,148,0.36)' : 'transparent', border: `1px solid ${active ? 'rgba(107,127,95,0.59)' : 'rgba(196,178,148,0.28)'}`, transition: 'all 0.15s' }}>
                            <RIcon size={13} />
                            {r.label}
                          </button>
                        );
                      })}
                    </div>

                    <button onClick={confirm86}
                      style={{ width: '100%', padding: '13px 0', borderRadius: 11, border: '1px solid rgba(46,49,52,0.4)', background: 'rgba(46,49,52,0.14)', color: '#2e3134', fontWeight: 900, fontSize: '0.68rem', letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <EyeOff size={14} /> 86 "{selectedDish86.name}"
                    </button>
                  </>
                )}
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=JetBrains+Mono:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #f7f3eb; color: #2e3134; overflow: hidden; font-family: 'Outfit', sans-serif; -webkit-tap-highlight-color: transparent; }
        button { font-family: 'Outfit', sans-serif; }
        input, select, textarea { font-family: 'Outfit', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(196,178,148,0.48); border-radius: 10px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes strobePulse { 0% { box-shadow: 0 0 0 0 rgba(107,127,95,0.73); } 70% { box-shadow: 0 0 0 10px rgba(196,178,148,0); } 100% { box-shadow: 0 0 0 0 rgba(196,178,148,0); } }
        .voice-pulse { animation: strobePulse 1.8s infinite; border-radius: 9px; }
        @keyframes urgentPulse { 0%,100% { border-color: rgba(46,49,52,0.25); box-shadow: none; } 50% { border-color: rgba(46,49,52,0.75); box-shadow: 0 0 18px rgba(46,49,52,0.12); } }
        .flash-card-pulse { animation: urgentPulse 1.8s ease-in-out infinite; }
        @keyframes newOrder { 0% { transform: scale(0.97); box-shadow: 0 0 0 0 rgba(107,127,95,0.59); } 50% { transform: scale(1); box-shadow: 0 0 20px 4px rgba(196,178,148,0.48); } 100% { transform: scale(1); box-shadow: none; } }
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
    high:     'rgba(107,127,95,1)',
    medium:   'rgba(140,125,100,0.83)',
    low:      'rgba(196,178,148,0.4)',
  };
  const topBarColor = isAggOrder
    ? accentColor[otype]
    : urgency === 'high'
      ? 'linear-gradient(90deg,#2e3134,#6b7f5f)'
      : urgency === 'medium'
        ? 'rgba(140,125,100,0.75)'
        : 'rgba(196,178,148,0.32)';

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
    : isParcelOrder ? <span style={{ color:'#6e8062' }}>PARCEL</span>
    : <span style={{ color:'#2e3134' }}>T-{order.tableNumber}</span>;

  const sourceMeta = {
    waitlist:        { label:'WAITLIST',   color:'#8c7d64', bg:'rgba(140,125,100,0.12)', border:'rgba(140,125,100,0.33)' },
    reservation:     { label:'RESERVATION',color:'#6e8062', bg:'rgba(107,127,95,0.16)',border:'rgba(107,127,95,0.44)' },
    'counter-pickup':{ label:'PICKUP',     color:'#56684c', bg:'rgba(196,178,148,0.28)',border:'rgba(107,127,95,0.38)' },
    swiggy:          { label:'SWIGGY',     color:'#fc8019', bg:'rgba(252,128,25,0.1)',  border:'rgba(252,128,25,0.3)' },
    zomato:          { label:'ZOMATO',     color:'#cb202d', bg:'rgba(203,32,45,0.1)',   border:'rgba(203,32,45,0.3)' },
    takeaway:        { label:'TAKEAWAY',   color:'#6e8062', bg:'rgba(107,127,95,0.16)',border:'rgba(107,127,95,0.4)' },
    direct:          { label:'DINE-IN',    color:'#7d8079', bg:'rgba(196,178,148,0.12)',border:'rgba(196,178,148,0.28)' },
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
        border: `1px solid ${isAggOrder ? accentColor[otype]+'40' : isNewest ? 'rgba(107,127,95,0.41)' : 'rgba(196,178,148,0.28)'}`,
        position:'relative', overflow:'hidden',
        background:'#ffffff',
        boxShadow: isAggOrder ? `0 0 28px ${accentColor[otype]}14` : isNewest ? '0 0 22px rgba(196,178,148,0.2)' : '0 4px 18px rgba(60,50,35,0.11)',
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
              <span style={{ fontSize:'0.45rem', fontWeight:900, padding:'2px 7px', borderRadius:5, background:'rgba(196,178,148,0.4)', color:'#56684c', border:'1px solid rgba(107,127,95,0.41)', letterSpacing:'0.5px', flexShrink:0 }}>NEW</span>
            )}
          </div>
          {/* Source + order ID row */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.47rem', fontWeight:900, padding:'2px 6px', borderRadius:4, letterSpacing:'0.5px', textTransform:'uppercase', background:sm.bg, color:sm.color, border:`1px solid ${sm.border}` }}>
              {sm.label}
            </span>
            <span style={{ fontSize:'0.48rem', color:'#8a8d85', fontFamily:'monospace', fontWeight:900 }}>
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
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:9, border:`1.5px solid ${urgency==='high' ? '#2e3134' : urgency==='medium' ? 'rgba(107,127,95,0.52)' : 'rgba(196,178,148,0.32)'}`, background: urgency==='high' ? 'rgba(46,49,52,0.16)' : urgency==='medium' ? 'rgba(196,178,148,0.24)' : '#ffffff' }}>
            <Clock size={12} color={urgency==='high'?'#2e3134':urgency==='medium'?'#6e8062':'#8f928a'} />
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize: isMobile?'0.88rem':'0.92rem', color:urgency==='high'?'#2e3134':urgency==='medium'?'#8c7d64':'#8b8e88', letterSpacing:'-0.3px' }}>
              {fmt(seconds)}
            </span>
          </div>
          {urgency !== 'low' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize:'0.43rem', fontWeight:900, color: urgency==='high' ? 'rgba(107,127,95,0.87)' : 'rgba(140,125,100,0.83)', letterSpacing:'0.5px', textTransform:'uppercase' }}>
              {urgency==='high' && <Zap size={8} />} {urgency==='high' ? 'OVERDUE' : 'DELAYED'}
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
            <span style={{ fontSize:'0.6rem', color:'#6b6e70', fontWeight:700 }}>{order.aggregatorCustomer.name}</span>
          )}
          {order.aggregatorRaw?.expectedDeliveryTime && (
            <span style={{ fontSize:'0.52rem', color:'rgba(107,127,95,0.59)', fontFamily:'monospace' }}>
              ~{order.aggregatorRaw.expectedDeliveryTime}m
            </span>
          )}
        </div>
      )}

      {/* PREP PROGRESS BAR */}
      {totalItems > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:'0.47rem', color:'#8a8d85', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.8px' }}>PREP PROGRESS</span>
            <span style={{ fontSize:'0.52rem', fontWeight:900, color: allDone ? '#56684c' : '#8f928a', fontFamily:'monospace' }}>{checkedCount}/{totalItems}</span>
          </div>
          <div style={{ height:3, background:'rgba(196,178,148,0.2)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background: allDone ? 'linear-gradient(90deg,#9aad8c,#5f7354)' : urgency==='high' ? 'rgba(107,127,95,0.8)' : 'rgba(107,127,95,0.38)', borderRadius:2, transition:'width 0.4s ease' }} />
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
              ? { label:'PARCEL',  color:'#6e8062', bg:'rgba(107,127,95,0.14)', border:'rgba(107,127,95,0.36)', icon:<Package size={9}/> }
              : { label:'DINE-IN', color:'#7d8079', bg:'rgba(60,50,35,0.04)', border:'rgba(196,178,148,0.2)', icon:<UtensilsCrossed size={9}/> };

          return (
            <div
              key={idx}
              onClick={() => toggleItemCrossed(idx)}
              onContextMenu={e => startItemTimer(idx, e)}
              style={{
                display:'flex', alignItems:'flex-start', gap:10,
                padding: isMobile?'10px 11px':'11px 12px',
                borderRadius:10,
                background: crossed ? '#f7f3eb' : hasStarted ? '#eef2e8' : '#fbf8f2',
                border: `1px solid ${crossed ? 'rgba(196,178,148,0.16)' : hasStarted ? 'rgba(196,178,148,0.56)' : 'rgba(196,178,148,0.24)'}`,
                borderLeft: `3px solid ${crossed ? 'rgba(196,178,148,0.16)' : hasStarted ? 'rgba(107,127,95,0.66)' : 'rgba(196,178,148,0.32)'}`,
                cursor:'pointer', transition:'all 0.15s', userSelect:'none',
                opacity: crossed ? 0.5 : 1,
              }}>

              {/* Qty badge */}
              <div style={{ width:28, height:28, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize:'0.85rem', background: crossed ? 'rgba(196,178,148,0.12)' : 'rgba(196,178,148,0.36)', border:`1px solid ${crossed?'rgba(196,178,148,0.16)':'rgba(107,127,95,0.31)'}`, color: crossed ? '#8a8d85' : '#56684c' }}>
                {item.quantity}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                {/* Name row */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                  <span style={{ fontSize: isMobile?'0.86rem':isTablet?'0.83rem':'0.9rem', fontWeight:700, lineHeight:1.25, textDecoration: crossed ? 'line-through' : 'none', color: crossed ? '#8a8d85' : item.isChefSpecial ? '#ffffff' : '#2e3134', background: item.isChefSpecial && !crossed ? 'linear-gradient(135deg,#71856a,#586b4f)' : 'transparent', padding: item.isChefSpecial && !crossed ? '1px 6px' : 0, borderRadius: item.isChefSpecial ? 4 : 0 }}>
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
                  <div style={{ fontSize:'0.58rem', fontWeight:900, color: item.portion?.toLowerCase()==='half' ? '#56684c' : '#7d8079', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.3px' }}>
                    {item.portion?.toUpperCase() || 'STANDARD'}
                  </div>
                )}

                {/* Cook timer */}
                {hasStarted && !crossed && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:2, fontSize:'0.52rem', fontWeight:900, color: isSlow ? '#56684c' : 'rgba(107,127,95,0.52)', background: isSlow ? 'rgba(196,178,148,0.28)' : 'transparent', padding: isSlow ? '2px 6px' : 0, borderRadius:4, border: isSlow ? '1px solid rgba(107,127,95,0.31)' : 'none', fontFamily:'monospace' }}>
                    <Timer size={9} />
                    {`${Math.floor(elapsedSecs/60)}:${(elapsedSecs%60).toString().padStart(2,'0')}`}
                    {isSlow && <span style={{ display:'inline-flex', alignItems:'center', gap:2, fontSize:'0.44rem' }}><AlertTriangle size={8} strokeWidth={2.5} /> SLOW</span>}
                  </div>
                )}

                {/* Done time */}
                {crossed && hasStarted && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:2, fontSize:'0.52rem', color:'#8a8d85', fontFamily:'monospace', fontWeight:900 }}>
                    <Timer size={9} /> Done {Math.floor(finalSecs/60)}m {finalSecs%60}s
                  </div>
                )}

                {/* Long-press hint — only on first unchecked */}
                {!hasStarted && !crossed && idx === order.items.findIndex(i => !checkedItemsGlobal[`${order._id}-${order.items.indexOf(i)}`] && !i.isExtraItem && i.extraItemId == null) && (
                  <div style={{ fontSize:'0.46rem', color:'rgba(107,127,95,0.31)', marginTop:2, fontStyle:'italic' }}>Hold to start cook timer</div>
                )}

                {/* Suggestion note */}
                {item.suggestion && !crossed && (
                  <div style={{ display:'flex', alignItems:'flex-start', gap:5, marginTop:5, padding:'5px 8px', borderRadius:7, background:'rgba(196,178,148,0.16)', border:'1px solid rgba(196,178,148,0.32)' }}>
                    <StickyNote size={9} color="#8c7d64" style={{ flexShrink:0, marginTop:1 }} />
                    <span style={{ fontSize:'0.6rem', color:'#6e8062', fontWeight:700, textTransform:'uppercase', lineHeight:1.4 }}>{item.suggestion}</span>
                  </div>
                )}
              </div>

              {/* Cross indicator */}
              {crossed && <CheckSquare size={16} color="rgba(107,127,95,0.52)" style={{ flexShrink:0, marginTop:2 }} />}
            </div>
          );
        })}
      </div>

      {/* CHEF NOTE PANEL */}
      {showNote && (
        <div style={{ marginTop:8, background:'rgba(196,178,148,0.16)', border:'1px solid rgba(196,178,148,0.4)', borderRadius:9, padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-start' }}>
          <StickyNote size={12} color="#8c7d64" style={{ flexShrink:0, marginTop:2 }} />
          <textarea value={localNote} onChange={e => setLocalNote(e.target.value)} placeholder="Add a kitchen note for this ticket…"
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#6e8062', fontSize:'0.72rem', resize:'none', fontFamily:"'Outfit', sans-serif", lineHeight:1.5, minHeight:52 }} rows={2} />
        </div>
      )}

      {/* BOTTOM ACTIONS */}
      <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:10, flexShrink:0 }}>
        {/* Note toggle — small secondary action */}
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={() => setShowNote(v => !v)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', background:'transparent', border:'1px solid rgba(196,178,148,0.28)', color:'#7d8079', borderRadius:7, fontSize:'0.5rem', fontWeight:900, cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(107,127,95,0.41)'; e.currentTarget.style.color='#56684c'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(196,178,148,0.28)'; e.currentTarget.style.color='#7d8079'; }}>
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
            border: allDone ? 'none' : `1px solid ${urgency==='high' ? 'rgba(107,127,95,0.66)' : 'rgba(107,127,95,0.31)'}`,
            fontWeight:900,
            fontSize: isMobile?'0.86rem':isTablet?'0.75rem':'0.78rem',
            cursor:'pointer',
            textTransform:'uppercase', letterSpacing:'0.8px',
            transition:'all 0.2s',
            background: urgency==='high'
              ? '#2e3134'
              : allDone
                ? 'rgba(107,127,95,0.16)'
                : 'transparent',
            color: urgency==='high' ? '#ffffff' : '#56684c',
            minHeight: isMobile?50:44,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
          {urgency === 'high' && <Flame size={14} color="#ffffff" strokeWidth={2.5} />}
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
    background:'#f7f3eb', padding:'10px', gap:8,
    overflow:'hidden',
  },
  header: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    background:'#ffffff', padding:'9px 13px',
    borderRadius:13, border:'1px solid rgba(196,178,148,0.28)',
    flexShrink:0, zIndex:10, gap:8, minHeight:52,
    overflowX:'hidden',
  },
  iconBtn: {
    background:'#faf7f1', border:'1px solid rgba(196,178,148,0.4)',
    padding:'8px', borderRadius:9, cursor:'pointer',
    display:'flex', alignItems:'center', flexShrink:0,
    transition:'all 0.15s',
  },
  utilBtn: {
    background:'#faf7f1', border:'1px solid rgba(196,178,148,0.32)',
    color:'#2e3134', padding:'7px 11px', borderRadius:9,
    cursor:'pointer', display:'flex', alignItems:'center',
    gap:5, transition:'all 0.15s', flexShrink:0, minHeight:36,
  },
  dotGold: {
    width:5, height:5, background:'#56684c', borderRadius:'50%',
    boxShadow:'0 0 7px rgba(107,127,95,1)', flexShrink:0,
  },
  dotRed: {
    width:5, height:5, background:'#c25b4e', borderRadius:'50%',
    boxShadow:'0 0 7px rgba(194,91,78,0.49)', flexShrink:0,
  },
  body: { display:'flex', flex:1, gap:10, overflow:'hidden', minHeight:0 },
  sidebar: {
    background:'#ffffff', border:'1px solid rgba(196,178,148,0.28)',
    borderRadius:13, display:'flex', flexDirection:'column',
    padding:'15px 12px', flexShrink:0, height:'100%', overflowY:'auto',
  },
  sidebarHeaderIcon: {
    width:28, height:28, borderRadius:8,
    background:'rgba(196,178,148,0.2)', border:'1px solid rgba(196,178,148,0.48)',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  },
  sidebarBtn: (active) => ({
    display:'flex', alignItems:'center', padding:'10px 10px',
    borderRadius:9, border: active ? 'none' : '1px solid rgba(196,178,148,0.28)',
    background: active ? 'linear-gradient(135deg,#71856a,#586b4f)' : 'rgba(196,178,148,0.08)',
    color: active ? '#ffffff' : '#6c6f6f',
    cursor:'pointer', fontSize:'0.64rem', fontWeight: active ? 900 : 800,
    width:'100%', textAlign:'left', transition:'all 0.15s',
    letterSpacing:'0.3px', minHeight:40, gap:0,
    boxShadow: active ? '0 4px 12px rgba(107,127,95,0.28)' : 'none',
  }),
  countChip: (active, hasItems) => ({
    fontSize:'0.54rem', fontFamily:'monospace', padding:'1px 6px',
    borderRadius:5, fontWeight:900,
    background: active ? 'rgba(255,255,255,0.22)' : hasItems ? 'rgba(196,178,148,0.32)' : 'rgba(196,178,148,0.12)',
    color: active ? '#ffffff' : hasItems ? '#56684c' : '#8a8d85',
    border: active ? 'none' : hasItems ? '1px solid rgba(107,127,95,0.31)' : '1px solid rgba(196,178,148,0.2)',
  }),
  workspace: {
    flex:1, overflowY:'auto', minWidth:0,
  },
  navBtn: {
    display:'flex', alignItems:'center', gap:5,
    background:'#ffffff', border:'1px solid rgba(196,178,148,0.4)',
    color:'#56684c', padding:'10px 14px', borderRadius:9,
    cursor:'pointer', fontSize:'0.7rem', fontWeight:800, minHeight:44,
    transition:'all 0.15s',
  },
};

const wInput = {
  width:'100%', padding:'10px 12px',
  background:'#f7f3eb', border:'1px solid rgba(196,178,148,0.4)',
  color:'#2e3134', borderRadius:9, fontSize:'0.8rem',
  outline:'none', boxSizing:'border-box',
  fontFamily:"'Outfit', sans-serif",
  transition:'border-color 0.15s',
};

const wFormLabel = {
  display:'block', fontSize:'0.5rem', color:'#8a8d85',
  fontWeight:900, letterSpacing:'1.2px', marginBottom:6,
  textTransform:'uppercase',
};

export default KitchenView;