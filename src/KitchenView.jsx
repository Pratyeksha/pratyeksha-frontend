/* ─── THEME: Charcoal · Glass · Champagne Gold (shared with App.jsx / Operator) ───
   warm white  #f7f3eb   page background
   white       #0d0d0d   header, sidebar, tickets, panels
   charcoal    #f7f3eb   text, overdue emphasis
   beige       #E4D9C6   borders, soft fills
   sage green  #d3bfa2   accents, active states, buttons
   (Swiggy / Zomato brand colours and alert red are kept on purpose) */
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import SupportContact from './SupportContact.jsx';
import { io } from "socket.io-client";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_BASE_URL, { SOCKET_BASE_URL } from './apiBase.js';
import PwaInstallButton from './PwaInstallButton.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Timer,  StickyNote, X, Zap, History, LayoutGrid, BarChart3, Package, UtensilsCrossed, Clock, CheckSquare, Activity, Monitor, Coffee, Layers, Flame, Mic, EyeOff, Sparkles, TrendingUp, WifiOff, AlignJustify, Trash2, AlertTriangle, RotateCcw, TrendingDown, RefreshCw, Search, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, Scale, PackageX, ShieldAlert, Wrench } from 'lucide-react';
import SpoonForkIcon from './SpoonForkIcon.jsx';
const BellRing = SpoonForkIcon; // crossed spoon & fork instead of the bell

const BASE_URL = API_BASE_URL;

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
  // tableNumber can arrive as a number from some clients: .toLowerCase() on it threw and blanked the whole board.
  const tbl = String(order.tableNumber ?? '').toLowerCase();
  if (order.source === 'counter-pickup' || order.source === 'takeaway'
    || tbl === 'takeaway'
    || tbl === 'counter')  return 'parcel';
  return 'dine-in'; // waitlist, reservation, direct all → dine-in
};

// Module-level so the (module-level) order card and the board share it: keys of dish checks whose save is still in flight.
// A refresh that lands in that window used to un-tick the dish the chef had just ticked.
const pendingToggleKeys = new Set();

// Same rule the order card uses to show/hide a dish (category tab + veg/non-veg mode), so totals built elsewhere match the cards.
const isDishVisible = (item, { selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode }) => {
  if (!item || item.isExtraItem || item.extraItemId != null) return false;
  const catId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap?.[item.name?.toLowerCase().trim()] || null;
  if (selectedCategory !== 'ALL' && catId !== String(selectedCategory).toLowerCase().trim()) return false;
  const isVeg = item.isVeg !== undefined ? item.isVeg !== false : (dishToVegMap?.[item.name?.toLowerCase().trim()] !== false);
  return tenantOnlyVeg ? true : isNonVegMode ? !isVeg : isVeg;
};

const fmt = s => {
  s = Math.max(0, Math.floor(Number(s) || 0));
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

  useEffect(() => {
    if (tenantId) {
      try { localStorage.setItem('kitchen_tenant_id', tenantId); } catch {}
    }
  }, [tenantId]);
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
  // 'loading' until the first ticket fetch answers; 'error' if it failed. Before this the board showed "KITCHEN CLEAR" while loading.
  const [boardState, setBoardState] = useState('loading');
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
  const [wastageError,         setWastageError]         = useState('');
  const [wastageLoading,       setWastageLoading]       = useState(false);
  const [kitchenHealth,        setKitchenHealth]        = useState(null);
  const [serverKdsToday,       setServerKdsToday]       = useState(null); // { count, avgSeconds } from the database
  const [itemFinalTimes,       setItemFinalTimes]       = useState({});
  const [searchQuery,          setSearchQuery]          = useState('');
  const [showSearch,           setShowSearch]           = useState(false);
  const [tenantName,           setTenantName]           = useState('');

  /* ── refs ── */
  const audioPlayer    = useRef(null);
  const alertPlayer    = useRef(null);
  // Browsers refuse all audio and speech until the page has had a user gesture. On a kiosk/tablet that reloads without a tap,
  // every alert was silently swallowed by `play().catch(() => {})` and the kitchen never knew. Show a prompt until the first tap.
  const [audioUnlocked, setAudioUnlocked] = useState(() => { try { return navigator.userActivation ? !!navigator.userActivation.hasBeenActive : false; } catch { return false; } });
  useEffect(() => {
    if (audioUnlocked) return undefined;
    const unlock = () => setAudioUnlocked(true);
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, [audioUnlocked]);
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

  const speechWatchdogRef = useRef(null);
  const processSpeechQueue = () => {
    clearTimeout(speechWatchdogRef.current);
    if (!speechQueueRef.current.length) { isSpeakingRef.current = false; return; }
    isSpeakingRef.current = true;
    const next = speechQueueRef.current.shift();
    let advanced = false;
    const advance = () => { if (advanced) return; advanced = true; processSpeechQueue(); };
    next.onend = next.onerror = advance;
    // Some browsers (notably Chrome) sometimes never fire onend. isSpeakingRef then stayed true forever and every
    // later ticket was queued but never announced. The watchdog moves the queue along regardless.
    speechWatchdogRef.current = setTimeout(() => { try { window.speechSynthesis.cancel(); } catch {} advance(); }, Math.min(30000, 4000 + String(next.text || '').length * 110));
    try { window.speechSynthesis.speak(next); } catch { advance(); }
  };

  const speakOrder = order => {
    if (!('speechSynthesis' in window)) return;
    const otype = getOrderType(order);
    let text = otype === 'swiggy' ? 'Chef, new Swiggy order. '
             : otype === 'zomato' ? 'Chef, new Zomato order. '
             : otype === 'parcel' ? 'Chef, new pickup order. '
             : `Chef, new ticket for Table ${order.tableNumber}. `;
    text += (order.items || []).filter(i => !i.isExtraItem && i.extraItemId == null).map(i => {
      const portion = (i.portion && String(i.portion).toLowerCase() !== 'single') ? `${i.portion} ` : '';
      const tag = otype === 'parcel' ? 'Parcel' : 'Dine in';
      let d = `${i.quantity} ${portion}${i.name} ${tag}`;
      if (i.suggestion?.trim()) d += `. Note: ${i.suggestion}`;
      return d;
    }).join('. ');
    const utt = new SpeechSynthesisUtterance(text);
    const voices = synthVoicesRef.current;
    const v = voices.find(v => v.lang === 'en-IN')
           || voices.find(v => String(v.lang || '').startsWith('en') && String(v.name || '').toLowerCase().includes('india'))
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
    try {
      const s = await axios.get(`${BASE_URL}/admin/kds/today-summary/${tenantId}`);
      if (s.data && Number.isFinite(Number(s.data.count))) setServerKdsToday(s.data);
    } catch {}
  };

  const fetchSeqRef = useRef(0);
  const fetchActiveOrders = async (opts) => {
    // ordersOnly: socket-triggered refreshes don't need categories/menu/tenant again (the menu is kept live by socket events).
    const ordersOnly = opts && opts.ordersOnly === true;
    // Several refreshes can overlap (socket events, reconnect, the 86 button). A slow older response used to land last and
    // overwrite newer data, bringing back tickets that had already been dispatched.
    const seq = ++fetchSeqRef.current;
    try {
      const [ordersRes, catRes, menuRes, tenantRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/kitchen`),
        ordersOnly ? null : axios.get(`${BASE_URL}/categories/${tenantId}`).catch(() => ({ data: [] })),
        ordersOnly ? null : axios.get(`${BASE_URL}/menu/${tenantId}`).catch(() => ({ data: [] })),
        ordersOnly ? null : axios.get(`${BASE_URL}/tenant/${tenantId}`).catch(() => ({ data: null })),
      ]);
      if (seq !== fetchSeqRef.current) return; // a newer refresh has been started: drop this stale answer
      const incoming = [...(ordersRes.data || [])].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBoardState('ready');
      setOrders(incoming);
      if (catRes)  setCategories(catRes.data  || []);
      if (menuRes) setMenuItems(menuRes.data  || []);
      if (tenantRes?.data?.name)                              setTenantName(tenantRes.data.name);
      if (tenantRes?.data?.config?.onlyVeg !== undefined)     setTenantOnlyVeg(tenantRes.data.config.onlyVeg);
      const hydrationMap = {};
      incoming.forEach(o => o.items?.forEach((item,idx) => {
        // Rehydrate from the persisted server state, not only the old local flag.
        // Otherwise a reload/device switch makes completed dishes look unfinished.
        if (item.isCrossedLocal || item.kdsCompletedAt) hydrationMap[`${o._id}-${idx}`] = true;
      }));
      setCheckedItemsGlobal(prev => {
        // Keep the local value of any dish whose save is still in flight; the server does not know about it yet.
        const merged = { ...hydrationMap };
        pendingToggleKeys.forEach(k => { if (k in prev) merged[k] = prev[k]; else delete merged[k]; });
        return merged;
      });
      fetchHealth();
    } catch (err) { console.error('KDS fetch:', err.message); setBoardState(prev => prev === 'ready' ? prev : 'error'); }
  };

  const retryBoardLoad = () => { setBoardState('loading'); fetchActiveOrders(); };

  /* ── voice recognition ── */
  const voiceHandlerRef = useRef(() => {});
  const wantListeningRef = useRef(false);
  const handleVoiceResult = e => {
    const txt = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
    const hasTableWord = txt.includes('table') || txt.includes('टेबल');
    const hasDoneWord  = /ready|complete|तयार|पूर्ण/.test(txt);
    // "टेबल पाच तयार" (natural Marathi order) matched none of the fixed two-word phrases, so it was ignored.
    const isCompleteCmd = (hasTableWord && hasDoneWord) || txt.includes('आर्डर तयार');
    if (isCompleteCmd) {
      // "ready table 5" / "complete table 5": the old regex took the word "table" itself as the table number, so the most
      // natural English commands never matched an order. Strip the command words first, then read what is left.
      const numWords = {
        one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',
        'एक':'1','दोन':'2','तीन':'3','चार':'4','पाच':'5','सहा':'6','सात':'7','आठ':'8','नऊ':'9','दहा':'10',
        'दो':'2','पांच':'5','छह':'6','नौ':'9','दस':'10'
      };
      const left = txt.replace(/complete|ready|table|order|तयार|पूर्ण|आर्डर|ऑर्डर|टेबल|नंबर|number/giu, ' ');
      const tokens = left.match(/[\p{L}\p{M}\p{N}]+/gu) || []; // \p{M}: Devanagari vowel signs, or "दहा" splits into "दह" + "ा"
      let tNum = null;
      for (const tok of tokens) { const t = tok.toLowerCase(); if (numWords[t]) { tNum = numWords[t]; break; } if (/^[a-z]?\d+[a-z]?$/i.test(t)) { tNum = t.toUpperCase(); break; } }
      if (tNum) { const o = orders.find(x => String(x.tableNumber ?? '').toUpperCase() === String(tNum).toUpperCase()); if (o) markAsReady(o._id); }
    }
    if (txt.includes('recall last') || txt.includes('परत आण')) handleRecall();
    if (txt.includes('show summary') || txt.includes('सारांश')) setIsAggregateView(v => !v);
  };
  voiceHandlerRef.current = handleVoiceResult; // always the latest closure (orders, recall queue)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    // One recognizer for the lifetime of the screen. It used to be re-created on every orders/recallQueue change while the
    // previous one kept listening, so a spoken "recall last" ran once per leaked recognizer (several tickets recalled) and
    // Stop only reached the newest instance. The latest closure is read through a ref instead.
    if (recognitionRef.current) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = false; rec.lang = 'hi-IN';
    rec.onresult = e => voiceHandlerRef.current(e);
    // The browser ends continuous recognition after a stretch of silence. The mic indicator then flipped to "off" on its own
    // (or stayed "on" while nothing listened). Restart while the chef still wants it; stop for good if the mic is blocked.
    rec.onerror = (e) => { if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) { wantListeningRef.current = false; setIsListening(false); } };
    rec.onend = () => {
      if (wantListeningRef.current) setTimeout(() => { if (wantListeningRef.current) { try { rec.start(); } catch { /* already running */ } } }, 300);
      else setIsListening(false);
    };
    recognitionRef.current = rec;
    return () => { wantListeningRef.current = false; try { rec.abort(); } catch {} recognitionRef.current = null; }; // leaving the KDS left the mic recognizer running
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return alert('Speech recognition not supported.');
    if (isListening) { wantListeningRef.current = false; try { recognitionRef.current.stop(); } catch {} setIsListening(false); }
    else             { wantListeningRef.current = true; try { recognitionRef.current.start(); } catch { /* already running */ } setIsListening(true); }
  };

  /* ── main effect: socket + initial fetch ── */
  useEffect(() => {
    if (!tenantId) { setBoardState('error'); return undefined; }
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    // Blocked/throwing storage used to abort this whole effect, so the socket never connected and the KDS stayed empty.
    try {
      const prevDay = localStorage.getItem(`kds_operational_date_${tenantId}`);
      if (prevDay !== today) {
        localStorage.removeItem(`kds_completed_count_${tenantId}`);
        localStorage.removeItem(`kds_processing_time_${tenantId}`);
        localStorage.setItem(`kds_operational_date_${tenantId}`, today);
      }
      const cc = localStorage.getItem(`kds_completed_count_${tenantId}`);
      const ct = localStorage.getItem(`kds_processing_time_${tenantId}`);
      if (cc) setCompletedTicketsCount(parseInt(cc, 10) || 0);
      if (ct) setTotalProcessingTime(parseInt(ct, 10) || 0);
    } catch { /* counters just start from zero */ }
    fetchActiveOrders();

    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    const socket = io(SOCKET_BASE_URL, { transports: ['polling','websocket'], reconnection: true });
    socketRef.current = socket;
    const joinRestaurant = () => socket.emit('join_restaurant', tenantId);
    socket.on('connect', joinRestaurant);
    // Tickets/timings that changed while the socket was down are never replayed: resync on reconnect.
    let hasConnectedOnce = false;
    socket.on('connect', () => { if (hasConnectedOnce) fetchActiveOrders(); hasConnectedOnce = true; });
    socket.on('connect',    () => setIsOnline(true));
    if (socket.connected) joinRestaurant();
    socket.on('disconnect', () => setIsOnline(false));

    socket.on('new_order', newOrder => {
      if (newOrder.tenantId !== tenantId) return;
      const kitchenItems = (newOrder.items || []).filter(i => !i.isExtraItem && i.extraItemId == null);
      if (!kitchenItems.length) return;
      if (newOrder.status && newOrder.status !== 'pending') return;
      // Keep the FULL items array: kds-item timing calls use the index inside order.items on the
      // server, so stripping extra items here shifted every index and timed/crossed the wrong dish.
      // The card render already skips extra items.
      const cleanOrder = { ...newOrder };
      setOrders(prev => prev.some(o => String(o._id) === String(cleanOrder._id)) ? prev : [cleanOrder, ...prev]);
      setMobileCardIndex(0);
      const otype = getOrderType(cleanOrder);
      if (otype === 'swiggy' || otype === 'zomato')
        playCachedSound('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      else audioPlayer.current?.play().catch(() => {});
      speakOrder(cleanOrder);
    });

    socket.on('kds_item_cross_sync', data => {
      if (data.tenantId !== tenantId) return;
      setOrders(prev => prev.map(o => {
        if (String(o._id) !== String(data.orderId)) return o;
        const items = (o.items || []).map((it,i) => i === data.idx ? { ...it, isCrossedLocal: data.newState } : it);
        return { ...o, items };
      }));
    });

    socket.on('kds_item_timing_updated', data => {
      if (!data || data.tenantId && data.tenantId !== tenantId) return;
      const itemIndex = Number(data.itemIndex);
      const itemPatch = data.item || {};
      setOrders(prev => prev.map(o => {
        if (String(o._id) !== String(data.orderId)) return o;
        const items = (o.items || []).map((it,i) => i === itemIndex ? { ...it, ...itemPatch } : it);
        return { ...o, items, ...(data.orderTiming || {}) };
      }));
      const key = `${data.orderId}-${itemIndex}`;
      setCheckedItemsGlobal(prev => ({ ...prev, [key]: !!itemPatch.kdsCompletedAt || !!itemPatch.isCrossedLocal }));
      if (itemPatch.kdsPrepTimeSeconds != null) {
        setItemFinalTimes(prev => ({ ...prev, [`${data.orderId}-${itemIndex}`]: Number(itemPatch.kdsPrepTimeSeconds) }));
      }
    });

    socket.on('order_modification_detected', data => {
      if (data.tenantId !== tenantId) return;
      alertPlayer.current?.play().catch(() => {});
      let note = data.modificationNote;
      if (data.replaced) {
        // Customer changed the order inside the 2-minute window: spell out what changed for the chef.
        const added = (data.items || []).filter(i => i.modChange === 'new').map(i => `${i.quantity}× ${i.name}`);
        const qtyChanged = (data.items || []).filter(i => i.modChange === 'qty').map(i => `${i.name} ${i.modPrevQty}→${i.quantity}`);
        const removed = (data.replacedInfo?.removed || []).map(i => `${i.quantity}× ${i.name}`);
        const parts = [];
        if (added.length) parts.push(`ADDED: ${added.join(', ')}`);
        if (qtyChanged.length) parts.push(`QTY: ${qtyChanged.join(', ')}`);
        if (removed.length) parts.push(`REMOVED: ${removed.join(', ')}`);
        note = `Customer REPLACED the order${parts.length ? ' — ' + parts.join(' · ') : ''}`;
        if (data.orderId) {
          const prefix = `${data.orderId}-`;
          setItemFinalTimes(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(prefix))));
        }
      }
      // Date.now() alone collided for two alerts in the same millisecond (duplicate React keys), and the list grew without bound.
      setInterceptedAlerts(prev => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...data, modificationNote: note }, ...prev].slice(0, 25));
      fetchActiveOrders({ ordersOnly: true });
    });

    // Orders can be advanced by another KDS/operator device. Remove them from
    // this pending queue immediately instead of waiting for a refresh.
    socket.on('order_status_updated', data => {
      if (!data || data.tenantId && data.tenantId !== tenantId) return;
      const orderId = data._id || data.orderId;
      if (!orderId) return;
      if (data.status && data.status !== 'pending') {
        setOrders(prev => prev.filter(o => String(o._id) !== String(orderId)));
      }
    });
    socket.on('order_voided', data => {
      if (!data) return;
      const orderId = data.orderId || data._id;
      if (orderId) setOrders(prev => prev.filter(o => String(o._id) !== String(orderId)));
    });

    // ── Keep menu availability live — an item 86'd or restored from the
    // Operator Portal (or auto-hidden by stock depletion) used to only reach
    // this screen's dish list whenever something else happened to trigger a
    // refetch, so the 86 modal could show stale availability in the meantime. ──
    socket.on('menu_updated', updatedItem => {
      if (!updatedItem || updatedItem.tenantId !== tenantId) return;
      // A dish created after the KDS opened was never added (only existing ones were patched), so it was missing from the 86 list.
      setMenuItems(prev => prev.some(item => item._id === updatedItem._id)
        ? prev.map(item => item._id === updatedItem._id ? { ...item, ...updatedItem } : item)
        : [...prev, updatedItem]);
    });
    socket.on('menu_item_deleted', ({ itemId } = {}) => { if (itemId) setMenuItems(prev => prev.filter(i => String(i._id) !== String(itemId))); });
    socket.on('menu_item_restored', ({ itemId, item } = {}) => { if (itemId && item) setMenuItems(prev => prev.map(i => String(i._id) === String(itemId) ? { ...i, ...item } : i)); });
    socket.on('menu_bulk_updated', items => { if (Array.isArray(items)) setMenuItems(items); });

    // A tablet that slept / lost Wi-Fi can have a socket that is dead without ever firing "disconnect", so tickets sent in
    // the meantime never appeared. Resync when the screen wakes up, and as a slow safety net while it is visible.
    const onVisible = () => { if (document.visibilityState === 'visible') fetchActiveOrders({ ordersOnly: true }); };
    document.addEventListener('visibilitychange', onVisible);
    const safetyPoll = setInterval(() => { if (document.visibilityState === 'visible' && navigator.onLine) fetchActiveOrders({ ordersOnly: true }); }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(safetyPoll);
      ['new_order','kds_item_cross_sync','kds_item_timing_updated','order_modification_detected','order_status_updated','order_voided','menu_updated','menu_item_deleted','menu_item_restored','menu_bulk_updated']
        .forEach(ev => socket.off(ev));
      socket.off('connect', joinRestaurant);
      socket.disconnect();
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [tenantId]);

  /* ── actions ── */
  const [processingOrderIds, setProcessingOrderIds] = useState(new Set());
  // Fold the server's authoritative copy of one dish (incl. kdsTimingVersion) back into state. Without this the next tap
  // sent a stale version, got a 409, and the handler reverted the chef's click until a socket event happened to arrive.
  const mergeServerItem = useCallback((orderId, idx, item, orderTiming) => {
    if (!item) return;
    setOrders(prev => prev.map(o => {
      if (String(o._id) !== String(orderId)) return o;
      const items = (o.items || []).map((it, i) => i === idx ? { ...it, ...item } : it);
      return { ...o, items, ...(orderTiming || {}) };
    }));
  }, []);

  const markAsReady = async orderId => {
    if (processingOrderIds.has(orderId)) return; // block a double-tap while the request is in flight
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    setProcessingOrderIds(prev => new Set(prev).add(orderId));
    setRecallQueue(prev => [order, ...prev].slice(0, 10));
    // Do not count client-side ticket age as kitchen prep time. Server timing is
    // authoritative and is what Owner/Operator analytics consume.
    if (mobileCardIndex > 0) setMobileCardIndex(i => i - 1);
    // Remove it from the board immediately — instant feedback, and the card can no
    // longer be tapped again while the save is still in flight. Restore it on failure.
    setOrders(prev => prev.filter(o => o._id !== orderId));
    try {
      const readyRes = await axios.patch(`${BASE_URL}/admin/orders/${orderId}`, { status: 'ready', tenantId });
      fetchHealth(); // refresh the database-backed dispatched/avg figures
      const authoritativeSeconds = Number(readyRes.data?.order?.prepTimeSeconds);
      if (Number.isFinite(authoritativeSeconds) && authoritativeSeconds >= 0) {
        // localStorage can throw (private mode / quota). Inside a state updater that crashed the screen, and in this try it
        // wrongly put an already-dispatched ticket back on the board.
        setRecallQueue(prev => prev.map(o => o._id === orderId ? { ...o, _kdsCountedSeconds: authoritativeSeconds } : o));
        setTotalProcessingTime(prev => { const n = prev + authoritativeSeconds; try { localStorage.setItem(`kds_processing_time_${tenantId}`, n); } catch {} return n; });
        setCompletedTicketsCount(prev => { const n = prev + 1; try { localStorage.setItem(`kds_completed_count_${tenantId}`, n); } catch {} return n; });
      }
    } catch (err) {
      console.error(err);
      setRecallQueue(prev => prev.filter(o => o._id !== orderId));
      // The order no longer exists / was voided or settled elsewhere: putting the ticket back left a dead card that could
      // never be dispatched. Anything else (network, 5xx) is restored so the chef can try again.
      if (err?.response?.status === 404 || err?.response?.status === 410) fetchActiveOrders({ ordersOnly: true });
      else setOrders(prev => prev.some(o => o._id === orderId) ? prev : [order, ...prev]);
    } finally {
      setProcessingOrderIds(prev => { const next = new Set(prev); next.delete(orderId); return next; });
    }
  };

  const handleRecall = async () => {
    if (!recallQueue.length) return;
    const recalled = recallQueue[0];
    // Persist the recall: it only re-appeared locally, so the order stayed 'ready' on the server and vanished again
    // on the next refresh / on every other device.
    let recallRes;
    try {
      recallRes = await axios.patch(`${BASE_URL}/admin/orders/${recalled._id}`, { status: 'pending', recall: true, tenantId });
    } catch (err) {
      console.error('Recall failed:', err);
      return;
    }
    // The server answers { skipped: true } when the ticket already moved on (served/settled/rejected) or was recalled
    // elsewhere. Putting it back on the board then showed a ticket that is no longer pending.
    if (recallRes?.data?.skipped || recallRes?.data?.order?.status !== 'pending') {
      setRecallQueue(prev => prev.slice(1));
      return;
    }
    // Use the server's copy, not the snapshot taken when the ticket was dispatched (stale items / crossed state).
    const fresh = recallRes.data.order || recalled;
    setOrders(prev => prev.some(o => String(o._id) === String(recalled._id)) ? prev : [fresh, ...prev]);
    setRecallQueue(prev => prev.slice(1));
    setCompletedTicketsCount(prev => { const n = Math.max(0,prev-1); try { localStorage.setItem(`kds_completed_count_${tenantId}`,n); } catch {} return n; });
    // The average is total/count, so the recalled ticket's time has to leave the total together with its count.
    const counted = Number(recalled._kdsCountedSeconds);
    if (Number.isFinite(counted) && counted > 0) setTotalProcessingTime(prev => { const n = Math.max(0, prev - counted); try { localStorage.setItem(`kds_processing_time_${tenantId}`, n); } catch {} return n; });
    fetchHealth(); // the database-backed dispatched / average figures still counted the recalled ticket
  };

  const trigger86 = (categoryKey, categoryName) => {
    setEightySixModal({ categoryKey, categoryName });
    setSelectedDish86(null);
    setSelectedReason86('ran_out');
  };

  const confirm86Busy = useRef(false);
  const confirm86 = async () => {
    if (!selectedDish86 || confirm86Busy.current) return; // a double-tap sent the same PATCH twice
    confirm86Busy.current = true;
    try {
      await axios.patch(`${BASE_URL}/menu-item/${selectedDish86._id}`, {
        tenantId,
        isAvailable: false,
        outOfStockReason: selectedReason86,
        outOfStockAt: new Date().toISOString(),
        outOfStockBy: 'Kitchen'
      });
      setEightySixModal(null);
      setSelectedDish86(null);
      fetchActiveOrders();
    } catch { alert('Could not update item.'); }
    finally { confirm86Busy.current = false; }
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
      (order.items || []).forEach((item,idx) => {
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
        const hasNV = (order.items || []).some(item => {
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
    // Built from filteredOrders + the card's own visibility rule: it used every order and every dish, so the totals disagreed
    // with the "N tickets" label beside them and with the dishes actually shown on the cards.
    const vis = { selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode };
    filteredOrders.forEach(o => (o.items || []).forEach((i,idx) => {
      if (!isDishVisible(i, vis)) return;
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
      const otype = getOrderType(o);
      const isP = otype === 'parcel';
      const portion = (i.portion && String(i.portion).toLowerCase() !== 'single') ? ` (${i.portion})` : '';
      const key = `${i.name}${portion}__${isP ? 'P' : 'D'}`;
totals[key] = (totals[key]||0) + (Number(i.quantity)||1);
    }));
    return totals;
  }, [filteredOrders, checkedItemsGlobal, selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode]);

  const masterPrepMarqueeList = useMemo(() => {
    const m = {};
    const vis = { selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode };
    filteredOrders.forEach(o => (o.items || []).forEach((i,idx) => {
      if (!isDishVisible(i, vis)) return;
      if (checkedItemsGlobal[`${o._id}-${idx}`]) return;
m[i.name] = (m[i.name]||0) + (Number(i.quantity)||1);
    }));
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,7);
  }, [filteredOrders, checkedItemsGlobal, selectedCategory, dishToCategoryMap, dishToVegMap, tenantOnlyVeg, isNonVegMode]);

  // Prefer the database figures (same on every KDS device and in the Owner app); the localStorage counters stay
  // only as an offline fallback before the first server response.
  const dispatchedToday = serverKdsToday ? serverKdsToday.count : completedTicketsCount;
  const avgClearTime = useMemo(() => {
    const avg = serverKdsToday
      ? serverKdsToday.avgSeconds
      : (completedTicketsCount ? Math.floor(totalProcessingTime / completedTicketsCount) : 0);
    if (!avg) return '—';
    const a = Math.round(Number(avg));
    return `${Math.floor(a/60)}m ${a%60}s`; // avgSeconds can be fractional: "3m 12.4285s" was shown
  }, [totalProcessingTime, completedTicketsCount, serverKdsToday]);

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
    // A failed load used to become an empty list, so the panel claimed "No wastage entries today" and invited duplicate entries.
    try { const r = await axios.get(`${BASE_URL}/wastage/${tenantId}`); setWastageLog(Array.isArray(r.data) ? r.data : []); setWastageError(e => e === 'Could not load today\'s entries. Close and reopen this panel to retry.' ? '' : e); }
    catch { setWastageError('Could not load today\'s entries. Close and reopen this panel to retry.'); }
    finally { setWastageLoading(false); }
  }, [tenantId]);
  const fetchWastageAnalytics = useCallback(async () => {
    try { const r = await axios.get(`${BASE_URL}/wastage/analytics/${tenantId}`); setWastageAnalytics(r.data||null); } catch { setWastageAnalytics(null); }
  }, [tenantId]);
  useEffect(() => { if (showWastagePanel) { fetchWastageInventory(); fetchWastageLog(); } }, [showWastagePanel]);
  useEffect(() => { if (showWastagePanel && wastageTab==='report') fetchWastageAnalytics(); }, [wastageTab, showWastagePanel]);

  const saveWastageEntry = async () => {
    const { itemName,quantity,unit,reason,loggedBy } = wastageForm;
    // "0" is a truthy string and slipped through; the server then refused it and the chef saw nothing happen.
    if (!itemName.trim() || !(Number(quantity) > 0) || !loggedBy.trim()) { setWastageError('Enter an item, a quantity above 0 and your name.'); return; }
    setWastageSaving(true); setWastageError('');
    try {
      await axios.post(`${BASE_URL}/wastage/${tenantId}`, {
        itemName: itemName.trim(), inventoryId: wastageForm.inventoryId||undefined,
        quantity: Number(quantity), unit, reason, loggedBy: loggedBy.trim(), notes: wastageForm.notes||''
      });
      setWastageForm(p => ({ itemName:'', inventoryId:null, quantity:'', unit:'kg', reason:'Spoiled / Expired', loggedBy:p.loggedBy, notes:'' }));
      setWastageSuggestions([]); setShowWastageSuggest(false);
      fetchWastageLog(); fetchWastageInventory();
    } catch (err) { console.error(err.message); setWastageError(err?.response?.data?.error || 'Could not log wastage. Check the connection and try again.'); }
    finally { setWastageSaving(false); }
  };

  const deleteWastageEntry = async id => {
    if (!window.confirm('Remove this wastage entry?')) return;
    try { await axios.delete(`${BASE_URL}/wastage/${tenantId}/${id}`); setWastageLog(prev => prev.filter(e => e._id !== id)); setWastageError(''); }
    catch (err) { setWastageError(err?.response?.data?.error || 'Could not remove the entry. Try again.'); }
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
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.116)', marginBottom:14, flexShrink:0 }}>
        <div style={rs.sidebarHeaderIcon}><Layers size={14} color="#cfcac0" /></div>
        <span style={{ fontSize:'0.56rem', fontWeight:900, color:'rgba(211,191,162,0.59)', letterSpacing:'2.5px', flex:1, textTransform:'uppercase' }}>STATIONS</span>
        {inDrawer && (
          <button type="button" onClick={() => setSidebarOpen(false)} style={{ background:'rgba(255,255,255,0.066)', border:'1px solid rgba(255,255,255,0.165)', color:'#a2a2a2', cursor:'pointer', padding:'7px', borderRadius:8, display:'flex', alignItems:'center', transition:'all 0.15s' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* veg / non-veg toggle */}
      {!tenantOnlyVeg && (
        <div style={{ display:'flex', background:'#171717', borderRadius:9, border:'1px solid rgba(255,255,255,0.116)', padding:3, marginBottom:10, flexShrink:0 }}>
          {[false,true].map(nv => (
            <button type="button" key={String(nv)} onClick={() => { setIsNonVegMode(nv); setSelectedCategory('ALL'); }}
              style={{ flex:1, padding:'7px 4px', borderRadius:7, border:'none', cursor:'pointer', fontSize:'0.58rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.15s',
                background: isNonVegMode===nv ? (nv ? 'rgba(163,59,59,0.12)' : 'rgba(74,124,63,0.16)') : 'transparent',
                color: isNonVegMode===nv ? (nv ? '#a33b3b' : '#3f6b37') : '#a6a6a6' }}>
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
      {boardState === 'loading' ? <KdsSidebarSkeleton /> : (
      <div style={{ display:'flex', flexDirection:'column', gap:4, overflowY:'auto', flex:1 }} className="no-scrollbar">
        {/* ALL */}
        {(() => {
          const sel = selectedCategory === 'ALL' && !showMetricsDashboard;
          const total = orders.filter(o => ['pending','ready'].includes(o.status)).length;
          return (
            <button type="button" onClick={() => { setSelectedCategory('ALL'); setShowMetricsDashboard(false); setSidebarOpen(false); }} style={{ ...rs.sidebarBtn(sel), justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Coffee size={12} color={sel?'#f7f3eb':'#a2a2a2'} />
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
            <button type="button" key={cat._id} onClick={() => { setSelectedCategory(k); setShowMetricsDashboard(false); setSidebarOpen(false); }} style={{ ...rs.sidebarBtn(sel), justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                <Flame size={12} color={sel?'#f7f3eb':count>0?'#cfcac0':'#9a9a9a'} style={{ flexShrink:0 }} />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textTransform:'uppercase', fontSize:'0.62rem' }}>{cat.name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                <span title={`86 a dish in "${cat.name}"`} onClick={e => { e.stopPropagation(); trigger86(k, cat.name); }}
                  style={{ width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.116)', borderRadius:4, cursor:'pointer', color:'#9a9a9a', transition:'0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.45)'; e.currentTarget.style.color='#cfcac0'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.116)'; e.currentTarget.style.color='#9a9a9a'; }}>
                  <EyeOff size={9} />
                </span>
                <span style={{ ...rs.countChip(sel, count>0), minWidth:22, textAlign:'center' }}>{count<10?`0${count}`:count}</span>
              </div>
            </button>
          );
        })}

        {/* Speed Logs node */}
        <div style={{ marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.099)', display:'flex', flexDirection:'column', gap:4 }}>
          <button type="button" onClick={() => { setShowMetricsDashboard(true); setSidebarOpen(false); }} style={{ ...rs.sidebarBtn(showMetricsDashboard), justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <TrendingUp size={12} color={showMetricsDashboard?'#f7f3eb':'#a2a2a2'} />
              SPEED LOGS
            </div>
            {dispatchedToday > 0 && (
              <span style={{ ...rs.countChip(showMetricsDashboard, true) }}>{dispatchedToday}</span>
            )}
          </button>
          {/* Refresh */}
          <button type="button" onClick={fetchActiveOrders} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 10px', borderRadius:9, border:'1px solid rgba(255,255,255,0.116)', background:'transparent', color:'#9a9a9a', cursor:'pointer', fontSize:'0.6rem', fontWeight:900, width:'100%', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#cfcac0'; e.currentTarget.style.borderColor='rgba(255,255,255,0.209)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='#9a9a9a'; e.currentTarget.style.borderColor='rgba(255,255,255,0.116)'; }}>
            <RefreshCw size={12} /> REFRESH ORDERS
          </button>
        </div>
      </div>
      )}
      <div style={{ paddingTop:10, marginTop:10, borderTop:'1px solid rgba(255,255,255,0.099)', flexShrink:0 }}>
        <SupportContact style={{ marginBottom: 8 }} />
        <PwaInstallButton kind="kitchen" compact light />
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div style={rs.root}>
      {boardState === 'loading' && <KdsSkeletonCss />}
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      <audio ref={alertPlayer} src="https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3"  preload="auto" />
      {!audioUnlocked && (
        <div style={{ position:'fixed', left:'50%', bottom:16, transform:'translateX(-50%)', zIndex:4000, padding:'9px 16px', borderRadius:99, background:'#17120c', color:'#f1e3c4', border:'1px solid rgba(233,220,195,0.5)', fontSize:'0.66rem', fontWeight:900, letterSpacing:'0.6px', boxShadow:'0 8px 28px rgba(0,0,0,0.55)', pointerEvents:'none' }}>
          🔇 TAP ANYWHERE TO ENABLE ORDER SOUNDS &amp; VOICE
        </div>
      )}

      {/* ── DRAWER OVERLAY ── */}
      <AnimatePresence>
        {sidebarOpen && showDrawerToggle && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position:'fixed', inset:0, background:'rgba(8,8,10,0.714)', zIndex:90, backdropFilter:'blur(3px)' }} />
            <motion.aside initial={{ x:-310 }} animate={{ x:0 }} exit={{ x:-310 }}
              transition={{ type:'spring', stiffness:320, damping:32 }}
              style={{ ...rs.sidebar, position:'fixed', left:0, top:0, bottom:0, width: isSmallTablet?290:270, borderRadius:'0 16px 16px 0', zIndex:100, padding:'18px 14px' }}>
              {SidebarContent({ inDrawer: true })}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════ HEADER ══════════════ */}
      <header style={rs.header}>
        {/* Left: menu + brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {showDrawerToggle && (
            <button type="button" onClick={() => setSidebarOpen(true)} style={rs.iconBtn}>
              <AlignJustify size={18} color="#cfcac0" />
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:isMobile?28:34, height:isMobile?28:34, borderRadius:10, background:'rgba(255,255,255,0.099)', border:'1px solid rgba(211,191,162,0.42)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ChefHat size={isMobile?15:18} color="#cfcac0" />
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ background:'#f7f3eb', borderRadius:9, padding:'3px 7px', border:'1px solid rgba(211,191,162,0.5)', boxShadow:'0 6px 18px -8px rgba(211,191,162,0.4)' }}>
                  <img src="/pratyeksha-logo.png" alt="Pratyeksha" style={{ width:isMobile?105:130, height:'auto', display:'block' }} />
                </div>
                <span style={{ color:'rgba(211,191,162,0.75)', fontWeight:800, letterSpacing:'1.5px', fontSize:'0.62rem' }}>KDS</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                <span style={isOnline ? rs.dotGold : rs.dotRed} />
                <span style={{ color:'#9a9a9a', fontSize:'0.5rem', fontWeight:900, letterSpacing:'1.5px' }}>
                  {isOnline
                    ? (isMobile ? 'LIVE' : tenantName ? tenantName.toUpperCase() : 'KITCHEN — ONLINE')
                    : <span style={{ color:'#e29a58', display:'inline-flex', alignItems:'center', gap:3 }}><WifiOff size={9} /> DISCONNECTED</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: action cluster */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, overflowX:'auto', scrollbarWidth:'none', msOverflowStyle:'none' }}>

          {/* Station filter — tablet/desktop */}
          {!isMobile && (
            <div style={{ display:'flex', background:'#171717', padding:3, borderRadius:9, border:'1px solid rgba(255,255,255,0.132)', flexShrink:0 }}>
              {[
                { val:'ALL',    lbl:'ALL',      icon:<Monitor size={11} /> },
                { val:'DINEIN', lbl:'DINE-IN',  icon:<UtensilsCrossed size={11} /> },
                { val:'PARCEL', lbl:'PARCEL',   icon:<Package size={11} /> },
              ].map(s => (
                <button type="button" key={s.val} onClick={() => setStationFilter(s.val)} style={{ padding:'6px 11px', background: stationFilter===s.val ? 'rgba(255,255,255,0.165)' : 'transparent', border:'none', color: stationFilter===s.val ? '#cfcac0' : '#a6a6a6', fontSize:'0.58rem', fontWeight:900, cursor:'pointer', borderRadius:7, display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap', transition:'all 0.15s' }}>
                  <span style={{ color: stationFilter===s.val ? '#cfcac0' : '#9a9a9a' }}>{s.icon}</span>
                  {s.lbl}
                </button>
              ))}
            </div>
          )}

          {/* Search toggle */}
          <button type="button" onClick={() => setShowSearch(v => !v)} style={{ ...rs.utilBtn, borderColor: showSearch ? 'rgba(211,191,162,0.52)' : 'rgba(255,255,255,0.132)', background: showSearch ? 'rgba(255,255,255,0.116)' : '#121212' }}>
            <Search size={14} color={showSearch?'#cfcac0':'#a2a2a2'} />
          </button>

          {/* Voice */}
          <button type="button" onClick={toggleVoice} className={isListening ? 'voice-pulse' : ''} style={{ ...rs.utilBtn, borderColor: isListening ? 'rgba(211,191,162,0.73)' : 'rgba(255,255,255,0.132)', background: isListening ? 'rgba(255,255,255,0.165)' : '#121212' }}>
            <Mic size={14} color={isListening?'#cfcac0':'#a2a2a2'} />
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: isListening?'#cfcac0':'#a2a2a2' }}>{isListening ? 'LIVE' : 'VOICE'}</span>}
          </button>

          {/* Aggregate toggle */}
          <button type="button" onClick={() => setIsAggregateView(v => !v)} style={{ ...rs.utilBtn, background: isAggregateView ? 'rgba(255,255,255,0.116)' : '#121212', borderColor: isAggregateView ? 'rgba(211,191,162,0.52)' : 'rgba(255,255,255,0.132)' }}>
            {isAggregateView ? <LayoutGrid size={14} color="#cfcac0" /> : <BarChart3 size={14} color="#a2a2a2" />}
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: isAggregateView?'#cfcac0':'#a2a2a2' }}>{isAggregateView ? 'TICKETS' : 'SUMMARY'}</span>}
          </button>

          {/* Recall */}
          {recallQueue.length > 0 && (
            <button type="button" onClick={handleRecall} style={{ ...rs.utilBtn, borderColor:'rgba(211,191,162,0.45)', background:'rgba(255,255,255,0.083)', position:'relative' }}>
              <History size={14} color="#cfcac0" />
              {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color:'#cfcac0' }}>RECALL</span>}
              <div style={{ position:'absolute', top:-6, right:-6, width:16, height:16, borderRadius:'50%', background:'linear-gradient(135deg,#d3bfa2,#b99f78)', color:'#0c0c0c', fontSize:'0.48rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace' }}>{recallQueue.length}</div>
            </button>
          )}

          {/* Wastage */}
          <button type="button" onClick={() => setShowWastagePanel(true)} style={{ ...rs.utilBtn, borderColor: showWastagePanel ? 'rgba(211,191,162,0.52)' : 'rgba(255,255,255,0.132)', background: showWastagePanel ? 'rgba(255,255,255,0.116)' : '#121212', position:'relative' }}>
            <Trash2 size={14} color={showWastagePanel?'#cfcac0':'#a2a2a2'} />
            {!isMobile && <span style={{ fontSize:'0.58rem', fontWeight:900, color: showWastagePanel?'#cfcac0':'#a2a2a2' }}>WASTAGE</span>}
            {wastageLog.filter(e => new Date(e.loggedAt||e.createdAt).toDateString()===new Date().toDateString()).length > 0 && (
              <div style={{ position:'absolute', top:-5, right:-5, width:14, height:14, borderRadius:'50%', background:'rgba(211,191,162,1.0)', color:'#0c0c0c', fontSize:'0.44rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {wastageLog.filter(e => new Date(e.loggedAt||e.createdAt).toDateString()===new Date().toDateString()).length}
              </div>
            )}
          </button>


          {/* Ticket count pill */}
          <div style={{ background: filteredOrders.length>0 ? 'linear-gradient(135deg,#d3bfa2,#b99f78)' : '#171717', padding:'7px 13px', borderRadius:10, display:'flex', alignItems:'center', gap:6, flexShrink:0, border: filteredOrders.length===0 ? '1px solid rgba(211,191,162,0.24)' : 'none', minHeight:38 }}>
            <span style={{ color: filteredOrders.length>0 ? '#0c0c0c' : '#8c8c8c', fontSize:'1.05rem', fontWeight:950, fontFamily:'JetBrains Mono, monospace', lineHeight:1 }}>{filteredOrders.length<10?`0${filteredOrders.length}`:filteredOrders.length}</span>
            {!isMobile && <span style={{ color: filteredOrders.length>0 ? '#0c0c0c' : '#8c8c8c', fontSize:'0.5rem', fontWeight:900, letterSpacing:'0.5px' }}>TICKETS</span>}
          </div>
        </div>
      </header>

      {/* ── SEARCH BAR ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
            style={{ display:'flex', alignItems:'center', gap:9, background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.165)', borderRadius:11, padding:'9px 14px', flexShrink:0 }}>
            <Search size={13} color="#b9a27e" />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by table number, source, or dish name…" style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#f7f3eb', fontSize:'0.82rem', fontFamily:"'Outfit',sans-serif" }} />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} style={{ background:'rgba(255,255,255,0.099)', border:'1px solid rgba(255,255,255,0.198)', color:'#a6a6a6', borderRadius:6, cursor:'pointer', padding:'4px 8px', display:'flex', alignItems:'center', gap:4, fontSize:'0.58rem', fontWeight:900 }}>
                <X size={11} /> CLEAR
              </button>
            )}
            <button type="button" onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ background:'transparent', border:'none', color:'#9a9a9a', cursor:'pointer', display:'flex', alignItems:'center' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREP MARQUEE ── */}
      <AnimatePresence>
        {masterPrepMarqueeList.length > 0 && !isAggregateView && !showMetricsDashboard && (
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ display:'flex', alignItems:'center', background:'#171717', border:'1px solid rgba(255,255,255,0.116)', padding:'7px 14px', borderRadius:10, gap:10, overflow:'hidden', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.52rem', fontWeight:900, color:'#b9a27e', letterSpacing:'1.5px', flexShrink:0 }}>
              <Activity size={10} /> PREP QUEUE
            </div>
            <div style={{ width:'1px', height:'14px', background:'rgba(255,255,255,0.165)', flexShrink:0 }} />
            <div style={{ display:'flex', gap:7, overflowX:'auto' }} className="no-scrollbar">
              {masterPrepMarqueeList.map(([name,qty]) => (
                <div key={name} style={{ background:'#121212', border:'1px solid rgba(255,255,255,0.165)', padding:'3px 10px', borderRadius:6, display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                  <span style={{ color:'#cfcac0', fontWeight:900, fontFamily:'monospace', fontSize:'0.72rem' }}>{qty}×</span>
                  <span style={{ fontSize:'0.65rem', fontWeight:800, color:'#cfc7b8', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.3px' }}>{name}</span>
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
            style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.033)', border:'1px solid rgba(255,255,255,0.116)', borderRadius:9, padding:'6px 13px', flexShrink:0, overflow:'hidden' }}>
            <History size={10} color="rgba(211,191,162,0.45)" />
            <span style={{ fontSize:'0.5rem', color:'rgba(211,191,162,0.45)', fontWeight:900, letterSpacing:'1px', flexShrink:0 }}>RECALL ({recallQueue.length}/10)</span>
            <div style={{ display:'flex', gap:5, overflowX:'auto' }} className="no-scrollbar">
              {recallQueue.map((o,i) => (
                <span key={i} style={{ fontSize:'0.56rem', fontWeight:900, padding:'2px 8px', borderRadius:5, background: i===0 ? 'rgba(255,255,255,0.165)' : '#080808', border:`1px solid ${i===0?'rgba(255,255,255,0.209)':'rgba(255,255,255,0.11)'}`, color: i===0?'#cfcac0':'#9a9a9a', whiteSpace:'nowrap', flexShrink:0, fontFamily:'monospace' }}>
                  {getOrderType(o)==='parcel' ? 'PARCEL' : `T-${o.tableNumber}`} · {o.items?.length}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODIFICATION ALERTS ── */}
      <AnimatePresence>
        {/* Only the latest few: an unbounded stack pushed the actual tickets off the screen during a rush. */}
        {interceptedAlerts.slice(0, 3).map(alert => (
          <motion.div key={alert.id} initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ opacity:0 }}
            style={{ background:'#2b2219', border:'1px solid rgba(226,154,88,0.3)', padding: isMobile ? '12px 14px' : '13px 20px', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection: isMobile ? 'column' : 'row', gap:12, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ background:'rgba(226,154,88,0.1)', padding:9, borderRadius:9, flexShrink:0 }}><BellRing size={17} color="#e29a58" /></div>
              <div>
                <h3 style={{ margin:0, fontSize: isMobile ? '0.82rem' : '0.95rem', fontWeight:900, color:'#f7f3eb' }}>ORDER CHANGE — TABLE {alert.tableNumber}</h3>
                <p style={{ margin:'3px 0 0', color:'#a6a6a6', fontSize:'0.65rem' }}>
                  Modification: <span style={{ color:'#d08a4a', fontWeight:700 }}>"{alert.modificationNote}"</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setInterceptedAlerts(prev => prev.filter(a => a.id !== alert.id))}
              style={{ background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(226,154,88,0.3)', color:'#e29a58', padding:'9px 16px', borderRadius:8, fontSize:'0.66rem', fontWeight:900, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s' }}>
              ACKNOWLEDGE
            </button>
          </motion.div>
        ))}
        {interceptedAlerts.length > 3 && (
          <motion.div key="alerts-more" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'8px 14px', borderRadius:10, background:'#2b2219', border:'1px solid rgba(226,154,88,0.3)', color:'#d08a4a', fontSize:'0.64rem', fontWeight:900 }}>
            <span>+{interceptedAlerts.length - 3} MORE ORDER CHANGES</span>
            <button type="button" onClick={() => setInterceptedAlerts([])} style={{ background:'transparent', border:'1px solid rgba(226,154,88,0.4)', color:'#e29a58', padding:'5px 12px', borderRadius:7, fontSize:'0.6rem', fontWeight:900, cursor:'pointer' }}>ACKNOWLEDGE ALL</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ BODY ══════════════ */}
      <div style={rs.body}>
        {/* PERMANENT SIDEBAR */}
        {showPermanentSide && (
          <aside style={{ ...rs.sidebar, width: isLargeTablet ? 210 : 240 }}>
            {SidebarContent({})}
          </aside>
        )}

        {/* MAIN WORKSPACE */}
        <main style={{ ...rs.workspace, display:'flex', flexDirection:'column', gap:12 }} className="no-scrollbar">

          {/* KITCHEN HEALTH */}
          {kitchenHealth?.stations?.length > 0 && !showMetricsDashboard && (
            <div style={{ background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.116)', borderRadius:13, padding:'13px 15px', flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <Activity size={12} color="#cfcac0" />
                  <span style={{ color:'rgba(211,191,162,0.8)', fontSize:'0.53rem', fontWeight:900, letterSpacing:'2px', textTransform:'uppercase' }}>KITCHEN HEALTH</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, background: kitchenHealth.bottleneck ? 'rgba(226,154,88,0.08)' : 'rgba(255,255,255,0.066)', border:`1px solid ${kitchenHealth.bottleneck ? 'rgba(226,154,88,0.2)' : 'rgba(247,243,235,0.264)'}` }}>
                  {kitchenHealth.bottleneck ? <AlertTriangle size={9} color="#e29a58" /> : <CheckCircle2 size={9} color="#cfcac0" />}
                  <span style={{ fontSize:'0.5rem', fontWeight:900, color: kitchenHealth.bottleneck ? '#e29a58' : '#b9a27e', letterSpacing:'0.5px' }}>
                    {kitchenHealth.bottleneck ? `BOTTLENECK: ${kitchenHealth.bottleneck?.name || kitchenHealth.bottleneck}` : 'ALL STATIONS NORMAL'}
                  </span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(kitchenHealth.stations.slice(0,5).length, isMobile?2:5)},1fr)`, gap:8 }}>
                {kitchenHealth.stations.slice(0,5).map(s => (
                  <div key={s.name} style={{ background:'#121212', border:`1px solid ${s.isBottleneck ? 'rgba(226,154,88,0.2)' : 'rgba(255,255,255,0.099)'}`, borderRadius:8, padding:'9px 10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:'0.55rem', color: s.isBottleneck ? '#e29a58' : '#a6a6a6', fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, marginRight:4 }}>{s.name}</span>
                      <span style={{ fontSize:'0.54rem', fontFamily:'monospace', fontWeight:900, color: s.isBottleneck ? '#e29a58' : '#9a9a9a', flexShrink:0 }}>{s.orderCount ?? s.pending ?? 0}</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.099)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100, Math.max(0, Math.round(Number(s.loadPct ?? 0) || 0)))}%`, background: s.isBottleneck ? '#e29a58' : 'rgba(211,191,162,0.66)', borderRadius:2, transition:'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
              {kitchenHealth.recommendation && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:7, marginTop:10, padding:'8px 11px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.099)', borderRadius:8 }}>
                  <Zap size={11} color="#b9a27e" style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ fontSize:'0.6rem', color:'#a2a2a2', lineHeight:1.55 }}>{kitchenHealth.recommendation}</span>
                </div>
              )}
            </div>
          )}

          {/* SPEED METRICS PANEL */}
          {showMetricsDashboard && (
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
              style={{ background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.132)', borderRadius:16, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding: isMobile ? '36px 20px' : '52px 30px', minHeight:300 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <TrendingUp size={22} color="#cfcac0" />
                <h2 style={{ margin:0, fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight:900, letterSpacing:'3px', color:'#f7f3eb', textTransform:'uppercase' }}>Speed Metrics</h2>
              </div>
              <p style={{ color:'#8c8c8c', fontSize:'0.6rem', marginBottom:32, letterSpacing:'0.5px', textAlign:'center' }}>Session performance — resets at midnight IST</p>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14, width:'100%', maxWidth:520, marginBottom:28 }}>
                {[
                  { label:'TICKETS DISPATCHED', value:dispatchedToday, sub:'today', big:true },
                  { label:'AVG CLEAR TIME',      value:avgClearTime,          sub:'per ticket', big:false },
                  { label:'CURRENTLY PENDING',   value:orders.filter(o => (o.items || []).some(i => !i.isExtraItem && i.extraItemId == null)).length, sub:'active tickets', big:true },
                ].map(s => (
                  <div key={s.label} style={{ background:'#121212', border:'1px solid rgba(255,255,255,0.132)', borderTop:'2px solid rgba(255,255,255,0.171)', padding:'22px 20px', borderRadius:13, textAlign:'center' }}>
                    <div style={{ fontSize:'0.5rem', fontWeight:900, color:'#9a9a9a', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>{s.label}</div>
                    <div style={{ fontSize: s.big ? '2.8rem' : '1.8rem', fontWeight:950, color:'#cfcac0', fontFamily:'JetBrains Mono, monospace', lineHeight:1, marginBottom:6 }}>{s.value}</div>
                    <div style={{ fontSize:'0.58rem', color:'#8c8c8c', fontWeight:700 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setShowMetricsDashboard(false)}
                style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.209)', color:'#cfcac0', padding:'11px 28px', borderRadius:10, fontSize:'0.7rem', fontWeight:900, cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ChevronLeft size={13} /> BACK TO KITCHEN</span>
              </button>
            </motion.div>
          )}

          {/* AGGREGATE SUMMARY */}
          {!showMetricsDashboard && isAggregateView && (
            <div style={{ flex:1, overflowY:'auto' }} className="no-scrollbar">
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <BarChart3 size={14} color="#b9a27e" />
                <span style={{ fontSize:'0.57rem', fontWeight:900, color:'#a6a6a6', letterSpacing:'2px', textTransform:'uppercase' }}>BATCH PREP SUMMARY</span>
                <span style={{ marginLeft:'auto', fontSize:'0.54rem', color:'#8c8c8c', fontFamily:'monospace' }}>
                  {Object.keys(aggregatedTotals).length} items · {filteredOrders.length} tickets
                </span>
              </div>
              {Object.keys(aggregatedTotals).length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:12 }}>
                  <ChefHat size={32} color="#707070" />
                  <p style={{ color:'#8c8c8c', fontWeight:900, fontSize:'0.82rem', letterSpacing:'2px', margin:0 }}>KITCHEN CLEAR</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'140px':'160px'}, 1fr))`, gap: isMobile ? 10 : 13 }}>
                  {Object.entries(aggregatedTotals).map(([key, qty]) => {
                    const [namePart, typePart] = key.split('__');
                    const isParcel = typePart === 'P';
                    return (
                      <div key={key} style={{ background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:`1px solid ${isParcel?'rgba(211,191,162,0.42)':'rgba(255,255,255,0.116)'}`, borderTop:`2px solid ${isParcel?'rgba(211,191,162,0.73)':'rgba(255,255,255,0.171)'}`, borderRadius:13, padding: isMobile ? '16px 12px' : '20px 14px', textAlign:'center' }}>
                        <div style={{ fontSize: isMobile ? '2.4rem' : '2.8rem', fontWeight:900, color:'#cfcac0', fontFamily:'JetBrains Mono, monospace', lineHeight:1, marginBottom:8 }}>{qty<10?`0${qty}`:qty}</div>
                        <div style={{ fontSize: isMobile ? '0.62rem' : '0.67rem', color:'#a6a6a6', fontWeight:800, textTransform:'uppercase', lineHeight:1.4, marginBottom:7 }}>{namePart}</div>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.47rem', fontWeight:900, padding:'2px 7px', borderRadius:5, background: isParcel ? 'rgba(255,255,255,0.132)' : 'rgba(255,255,255,0.017)', color: isParcel ? '#cfcac0' : '#a6a6a6', border:`1px solid ${isParcel?'rgba(255,255,255,0.171)':'rgba(255,255,255,0.066)'}` }}>
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
            boardState === 'loading' ? (
              <div aria-hidden="true" style={{ flex:1, display:'flex', flexDirection:'column', gap:10, overflow:'hidden' }}>
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:5, flexShrink:0, padding:'0 20px' }}>
                  <Sk w={20} h={6} r={3} style={{ background:'rgba(211,191,162,0.25)' }} />
                  {[0,1,2,3].map(i => <Sk key={i} w={6} h={6} r={3} />)}
                </div>
                <div style={{ flex:1, overflow:'hidden' }}><KdsCardSkeleton isMobile /></div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                  <Sk w={84} h={36} r={10} /><Sk w={40} h={10} r={4} /><Sk w={84} h={36} r={10} />
                </div>
              </div>
            ) : boardState === 'error' && orders.length === 0 ? (
              <KdsLoadError onRetry={retryBoardLoad} />
            ) : filteredOrders.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
                <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.099)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChefHat size={30} color="#707070" /></div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontWeight:900, color:'#8c8c8c', fontSize:'0.85rem', letterSpacing:'2px', margin:'0 0 4px' }}>KITCHEN CLEAR</p>
                  <p style={{ fontSize:'0.6rem', color:'#8c8c8c', margin:0, fontWeight:700 }}>Waiting for next order…</p>
                </div>
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, overflow:'hidden' }}>
                {/* Dot nav */}
                <div style={{ display:'flex', justifyContent:'center', gap:5, flexShrink:0, flexWrap:'wrap', padding:'0 20px' }}>
                  {filteredOrders.map((_,i) => (
                    <div key={i} onClick={() => setMobileCardIndex(i)} style={{ width: i===safeCardIndex ? 20 : 6, height:6, borderRadius:3, background: i===safeCardIndex ? '#d3bfa2' : '#202020', transition:'all 0.25s', cursor:'pointer' }} />
                  ))}
                </div>
                {/* Card */}
                <div style={{ flex:1, overflow:'hidden' }} {...swipeHandlers}>
                  <AnimatePresence mode="wait">
                    <motion.div key={filteredOrders[safeCardIndex]?._id} initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-50 }} style={{ height:'100%' }}>
                      {filteredOrders[safeCardIndex] && (
                        <KDSOrderCard order={filteredOrders[safeCardIndex]} isNewest={safeCardIndex===0} onReady={markAsReady} dishToCategoryMap={dishToCategoryMap} dishToVegMap={dishToVegMap} selectedCategory={selectedCategory} checkedItemsGlobal={checkedItemsGlobal} setCheckedItemsGlobal={setCheckedItemsGlobal} socketInstance={socketRef.current} isNonVegMode={isNonVegMode} tenantOnlyVeg={tenantOnlyVeg} isMobile={true} isTablet={false} itemFinalTimes={itemFinalTimes} setItemFinalTimes={setItemFinalTimes} onItemSynced={mergeServerItem} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Prev/Next */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                  <button type="button" onClick={() => setMobileCardIndex(i => Math.max(0,i-1))} disabled={safeCardIndex===0} style={{ ...rs.navBtn, opacity: safeCardIndex===0 ? 0.25 : 1 }}><ChevronLeft size={16} /> PREV</button>
                  <span style={{ color:'#a6a6a6', fontSize:'0.7rem', fontWeight:900, fontFamily:'monospace' }}>{safeCardIndex+1} / {filteredOrders.length}</span>
                  <button type="button" onClick={() => setMobileCardIndex(i => Math.min(filteredOrders.length-1,i+1))} disabled={safeCardIndex===filteredOrders.length-1} style={{ ...rs.navBtn, opacity: safeCardIndex===filteredOrders.length-1 ? 0.25 : 1 }}>NEXT <ChevronRight size={16} /></button>
                </div>
              </div>
            )
          )}

          {/* TABLET/DESKTOP GRID */}
          {!showMetricsDashboard && !isAggregateView && !useCardView && (
            <div style={{ flex:1, overflowY:'auto', display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isSmallTablet?'240px':'300px'},1fr))`, gap: isTablet ? 12 : 16, alignContent:'flex-start' }} className="no-scrollbar">
              {boardState === 'loading' && Array.from({ length: isTablet ? 4 : 6 }, (_, i) => <KdsCardSkeleton key={`sk-${i}`} index={i} isTablet={isTablet} />)}
              {boardState === 'error' && orders.length === 0 && <div style={{ gridColumn:'1/-1', display:'flex' }}><KdsLoadError onRetry={retryBoardLoad} /></div>}
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order,i) => (
                  <KDSOrderCard key={order._id} order={order} isNewest={i===0} onReady={markAsReady} dishToCategoryMap={dishToCategoryMap} dishToVegMap={dishToVegMap} selectedCategory={selectedCategory} checkedItemsGlobal={checkedItemsGlobal} setCheckedItemsGlobal={setCheckedItemsGlobal} socketInstance={socketRef.current} isNonVegMode={isNonVegMode} tenantOnlyVeg={tenantOnlyVeg} isMobile={false} isTablet={isTablet} itemFinalTimes={itemFinalTimes} setItemFinalTimes={setItemFinalTimes} onItemSynced={mergeServerItem} />
                ))}
              </AnimatePresence>
              {boardState === 'ready' && filteredOrders.length === 0 && (
                <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:14 }}>
                  <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.099)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChefHat size={30} color="#707070" /></div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontWeight:900, color:'#8c8c8c', fontSize:'0.85rem', letterSpacing:'2px', margin:'0 0 4px' }}>KITCHEN CLEAR</p>
                    <p style={{ fontSize:'0.6rem', color:'#8c8c8c', margin:0, fontWeight:700 }}>All tickets dispatched</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav style={{ display:'flex', background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.116)', borderRadius:14, padding:'3px', flexShrink:0, gap:2 }}>
          {[
            { val:'ALL',    lbl:'ALL',     icon:<Monitor size={16} /> },
            { val:'DINEIN', lbl:'DINE-IN', icon:<UtensilsCrossed size={16} /> },
            { val:'PARCEL', lbl:'PARCEL',  icon:<Package size={16} /> },
          ].map(s => (
            <button type="button" key={s.val} onClick={() => setStationFilter(s.val)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: stationFilter===s.val ? 'rgba(255,255,255,0.132)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: stationFilter===s.val ? '#cfcac0' : '#9a9a9a', transition:'all 0.15s' }}>
              {s.icon}
              <span style={{ fontSize:'0.48rem', fontWeight:900, letterSpacing:'0.3px' }}>{s.lbl}</span>
              {s.val !== 'ALL' && (() => {
                // Count from every ticket, not filteredOrders (already narrowed by the active station, so the other badge always read 0).
                const c = orders.filter(o => {
                  if (!(o.items || []).some(i => !i.isExtraItem && i.extraItemId == null)) return false;
                  const t = getOrderType(o);
                  return s.val==='DINEIN' ? t==='dine-in' : t==='parcel';
                }).length;
                return c > 0 ? <span style={{ fontSize:'0.44rem', fontFamily:'monospace', fontWeight:900, color:'#b9a27e' }}>{c}</span> : null;
              })()}
            </button>
          ))}
          <button type="button" onClick={() => setIsAggregateView(v => !v)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: isAggregateView ? 'rgba(255,255,255,0.132)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: isAggregateView ? '#cfcac0' : '#9a9a9a', transition:'all 0.15s' }}>
            <BarChart3 size={16} />
            <span style={{ fontSize:'0.48rem', fontWeight:900 }}>SUMMARY</span>
          </button>
          <button type="button" onClick={() => setShowMetricsDashboard(v => !v)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 3px', background: showMetricsDashboard ? 'rgba(255,255,255,0.132)' : 'transparent', border:'none', cursor:'pointer', borderRadius:11, gap:3, minHeight:50, color: showMetricsDashboard ? '#cfcac0' : '#9a9a9a', transition:'all 0.15s' }}>
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
              style={{ position:'fixed', inset:0, background:'#050505', zIndex:3000, backdropFilter:'blur(4px)' }} />
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:32 }}
              style={{ position:'fixed', right:0, top:0, bottom:0, width: isMobile ? '100vw' : isTablet ? 420 : 500, background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', borderLeft:'1px solid rgba(255,255,255,0.132)', borderRadius: isMobile ? 0 : '16px 0 0 16px', zIndex:3001, display:'flex', flexDirection:'column', overflow:'hidden' }}>

              {/* Panel header */}
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.099)', background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.083)', border:'1px solid rgba(255,255,255,0.198)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Trash2 size={16} color="#cfcac0" />
                  </div>
                  <div>
                    <div style={{ fontWeight:900, fontSize:'0.88rem', color:'#f7f3eb', letterSpacing:0.3 }}>WASTAGE LOG</div>
                    <div style={{ fontSize:'0.5rem', color:'#9a9a9a', fontWeight:900, letterSpacing:'1.5px', marginTop:2, textTransform:'uppercase' }}>Spoilage · Overcooked · Dropped · Excess</div>
                  </div>
                </div>
                <button type="button" onClick={() => setShowWastagePanel(false)} style={{ background:'#080808', border:'1px solid rgba(255,255,255,0.165)', color:'#9a9a9a', padding:8, borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', borderBottom:'1px solid rgba(255,255,255,0.099)', flexShrink:0 }}>
                {[['log','LOG ENTRY'],['report','MONTHLY REPORT']].map(([t,lbl]) => (
                  <button type="button" key={t} onClick={() => setWastageTab(t)} style={{ flex:1, padding:'12px 0', background:'transparent', border:'none', cursor:'pointer', fontSize:'0.58rem', fontWeight:900, letterSpacing:'1px', color: wastageTab===t ? '#cfcac0' : '#9a9a9a', borderBottom:`2px solid ${wastageTab===t ? 'rgba(211,191,162,0.8)' : 'transparent'}`, transition:'all 0.15s' }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Panel body */}
              <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }} className="custom-scroll">
                {wastageTab === 'log' ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {/* NEW ENTRY FORM */}
                    <div style={{ background:'#080808', border:'1px solid rgba(255,255,255,0.132)', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
                      <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#a6a6a6', letterSpacing:'2px', textTransform:'uppercase', paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.083)' }}>NEW ENTRY</div>

                      {/* item name */}
                      <div style={{ position:'relative' }}>
                        <label style={wFormLabel}>INGREDIENT *</label>
                        <input value={wastageForm.itemName}
                          onChange={e => {
                            const v = e.target.value;
                            setWastageForm(p => ({ ...p, itemName:v, inventoryId:null }));
                            if (v.length >= 2) { const m = wastageInventory.filter(i => String(i.itemName || '').toLowerCase().includes(v.toLowerCase())).slice(0,5); setWastageSuggestions(m); setShowWastageSuggest(true); }
                            else setShowWastageSuggest(false);
                          }}
                          onBlur={() => setTimeout(() => setShowWastageSuggest(false), 150)}
                          placeholder="Type ingredient name…" style={wInput} />
                        {showWastageSuggest && wastageSuggestions.length > 0 && (
                          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.198)', borderRadius:9, zIndex:10, overflow:'hidden', marginTop:2, boxShadow:'0 8px 24px rgba(255,255,255,0.066)' }}>
                            {wastageSuggestions.map(s => (
                              <button type="button" key={s._id} onMouseDown={() => { setWastageForm(p => ({ ...p, itemName:s.itemName, inventoryId:s._id, unit:s.unit||'kg' })); setShowWastageSuggest(false); }}
                                style={{ width:'100%', padding:'10px 14px', background:'transparent', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', color:'#cfc7b8', fontSize:'0.75rem', fontWeight:700, textAlign:'left', transition:'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.099)'}
                                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                <span>{s.itemName}</span>
                                <span style={{ fontSize:'0.58rem', color:'#a6a6a6', fontFamily:'monospace' }}>{s.currentStock}{s.unit}</span>
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
                            <button type="button" key={r} onClick={() => setWastageForm(p => ({ ...p, reason:r }))}
                              style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${wastageForm.reason===r?'rgba(211,191,162,0.59)':'rgba(255,255,255,0.132)'}`, background: wastageForm.reason===r ? 'rgba(255,255,255,0.165)' : 'transparent', color: wastageForm.reason===r ? '#cfcac0' : '#a6a6a6', fontSize:'0.58rem', fontWeight:900, cursor:'pointer', transition:'all 0.15s' }}>
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
                      {wastageError && <div style={{ fontSize:'0.62rem', color:'#d98b8b', fontWeight:700, marginBottom:8 }}>{wastageError}</div>}
                      <button type="button" onClick={saveWastageEntry} disabled={wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()}
                        style={{ padding:'12px', borderRadius:11, border:'none', background: (wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()) ? '#171717' : 'linear-gradient(160deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))', color: (wastageSaving || !wastageForm.itemName.trim() || !wastageForm.quantity || !wastageForm.loggedBy.trim()) ? '#9a9a9a' : '#f7f3eb', fontWeight:900, fontSize:'0.72rem', cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6, minHeight:46 }}>
                        {wastageSaving ? <><RotateCcw size={13} style={{ animation:'spin 1s linear infinite' }} /> SAVING…</> : <><Trash2 size={13} /> LOG WASTAGE</>}
                      </button>
                    </div>

                    {/* LOG LIST */}
                    {wastageLoading ? (
                      <div style={{ textAlign:'center', padding:'24px', color:'#9a9a9a', fontSize:'0.7rem' }}>Loading log…</div>
                    ) : wastageLog.length > 0 ? (
                      <div>
                        <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#9a9a9a', letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>TODAY'S ENTRIES — {wastageLog.length}</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {[...wastageLog].reverse().map(e => (
                            <div key={e._id} style={{ background:'#080808', border:'1px solid rgba(255,255,255,0.099)', borderLeft:'3px solid rgba(255,255,255,0.171)', borderRadius:10, padding:'11px 14px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                                  <span style={{ fontWeight:800, fontSize:'0.76rem', color:'#cfc7b8' }}>{e.itemName}</span>
                                  <span style={{ fontSize:'0.52rem', fontFamily:'monospace', color:'#b9a27e', fontWeight:900, padding:'1px 5px', borderRadius:4, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.124)' }}>{e.quantity}{e.unit}</span>
                                  {Number(e.totalCost) > 0 && <span style={{ fontSize:'0.54rem', color:'#cfcac0', fontFamily:'monospace', marginLeft:'auto', fontWeight:900 }}>₹{Number(e.totalCost).toFixed(0)}</span>}
                                </div>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  <span style={{ fontSize:'0.5rem', padding:'1px 6px', borderRadius:4, background:'rgba(255,255,255,0.066)', color:'#a2a2a2', border:'1px solid rgba(255,255,255,0.116)', fontWeight:700 }}>{e.reason}</span>
                                  <span style={{ fontSize:'0.5rem', color:'#9a9a9a', fontWeight:700 }}>{e.loggedBy}</span>
                                  {e.notes && <span style={{ fontSize:'0.5rem', color:'#8c8c8c', fontStyle:'italic' }}>{e.notes}</span>}
                                </div>
                              </div>
                              <button type="button" onClick={() => deleteWastageEntry(e._id)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.099)', color:'#9a9a9a', padding:'5px', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.15s', flexShrink:0 }}
                                onMouseEnter={ev => { ev.currentTarget.style.borderColor='rgba(255,255,255,0.209)'; ev.currentTarget.style.color='#cfcac0'; }}
                                onMouseLeave={ev => { ev.currentTarget.style.borderColor='rgba(255,255,255,0.099)'; ev.currentTarget.style.color='#9a9a9a'; }}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign:'center', padding:'30px 20px', background:'#080808', borderRadius:12, border:'1px dashed rgba(255,255,255,0.099)' }}>
                        <div style={{ fontSize:'0.64rem', color:'#8c8c8c', fontWeight:700 }}>No wastage entries today</div>
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
                            <div key={s.l} style={{ background:'#080808', border:'1px solid rgba(255,255,255,0.116)', borderRadius:11, padding:'12px 10px', textAlign:'center' }}>
                              <div style={{ fontSize:'0.48rem', color:'#9a9a9a', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>{s.l}</div>
                              <div style={{ fontSize:'1.05rem', fontWeight:900, color:'#cfcac0', fontFamily:'monospace' }}>{s.v}</div>
                            </div>
                          ))}
                        </div>

                        {wastageAnalytics.byReason && Object.keys(wastageAnalytics.byReason).length > 0 && (
                          <div style={{ background:'#080808', border:'1px solid rgba(255,255,255,0.116)', borderRadius:12, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#9a9a9a', letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:14, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.083)', display:'flex', alignItems:'center', gap:6 }}>
                              <Scale size={11} color="#a6a6a6" /> BY REASON
                            </div>
                            {Object.entries(wastageAnalytics.byReason).sort((a,b) => (Number(b[1]?.cost) || 0) - (Number(a[1]?.cost) || 0)).map(([reason, data]) => {
                              const pct = wastageAnalytics.totalEntries > 0 ? Math.round(((Number(data.count) || 0)/wastageAnalytics.totalEntries)*100) : 0;
                              return (
                                <div key={reason} style={{ marginBottom:10 }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                                    <span style={{ fontSize:'0.64rem', fontWeight:800, color:'#a6a6a6' }}>{reason}</span>
                                    <span style={{ fontSize:'0.62rem', fontWeight:900, color:'#cfcac0', fontFamily:'monospace' }}>
                                      {Number(data.cost) > 0 ? `₹${Number(data.cost).toFixed(0)}` : `${Number(data.count) || 0}×`}
                                      <span style={{ color:'#9a9a9a', fontWeight:600, marginLeft:6 }}>{pct}%</span>
                                    </span>
                                  </div>
                                  <div style={{ height:4, background:'rgba(255,255,255,0.083)', borderRadius:2, overflow:'hidden' }}>
                                    <div style={{ height:'100%', width:`${pct}%`, background:'rgba(211,191,162,0.52)', borderRadius:2, transition:'width 0.6s ease' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(wastageAnalytics.dailyTrend||[]).length > 0 && (
                          <div style={{ background:'#080808', border:'1px solid rgba(255,255,255,0.116)', borderRadius:12, padding:'14px 16px' }}>
                            <div style={{ fontSize:'0.52rem', fontWeight:900, color:'#9a9a9a', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                              <TrendingDown size={11} color="#b9a27e" /> DAILY COST TREND (30 days)
                            </div>
                            <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:52 }}>
                              {(() => {
                                const maxC = Math.max(...wastageAnalytics.dailyTrend.map(d => Number(d.cost) || 0), 1);
                                return wastageAnalytics.dailyTrend.map(d => (
                                  <div key={d.date} title={`${d.date}: ₹${(Number(d.cost) || 0).toFixed(0)}`}
                                    style={{ flex:1, minWidth:0, height:`${Math.max(8, Math.round(((Number(d.cost) || 0)/maxC)*100))}%`, background: Number(d.cost)>0 ? `rgba(107,127,95,${0.25+((Number(d.cost) || 0)/maxC)*0.6})` : '#eee6d6', borderRadius:'3px 3px 0 0', transition:'height 0.4s ease' }} />
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        <button type="button" onClick={fetchWastageAnalytics} style={{ padding:'11px', background:'transparent', border:'1px solid rgba(255,255,255,0.198)', color:'#b9a27e', borderRadius:10, fontSize:'0.64rem', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                          <RefreshCw size={12} /> REFRESH REPORT
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign:'center', padding:'40px 20px' }}>
                        <button type="button" onClick={fetchWastageAnalytics} style={{ padding:'10px 22px', background:'rgba(255,255,255,0.083)', border:'1px solid rgba(255,255,255,0.198)', color:'#b9a27e', borderRadius:9, fontSize:'0.65rem', fontWeight:900, cursor:'pointer' }}>LOAD MONTHLY REPORT</button>
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
              style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 3100, backdropFilter: 'blur(4px)' }} />
            {/* Centering + scroll wrapper — must stay transform-free: framer-motion owns
                the transform on the modal below via animate={{scale,y}}, and mixing that
                with a manual translate(-50%,-50%) here made the centering offset get
                silently dropped, which is why this used to open off-screen at the bottom. */}
            <div onClick={() => setEightySixModal(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 3101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{ width: isMobile ? '92vw' : 420, maxHeight: 'calc(82vh - 40px)', background: 'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border: '1px solid rgba(255,255,255,0.198)', borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 'auto', boxShadow: '0 30px 80px rgba(255,255,255,0.099)' }}>

              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.132)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(226,154,88,0.12)', border: '1px solid rgba(226,154,88,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PackageX size={15} color="#f7f3eb" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#f7f3eb' }}>86 A DISH</div>
                    <div style={{ fontSize: '0.5rem', color: '#9a9a9a', fontWeight: 800, letterSpacing: '0.5px', marginTop: 2, textTransform: 'uppercase' }}>{eightySixModal.categoryName}</div>
                  </div>
                </div>
                <button type="button" onClick={() => setEightySixModal(null)} style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.165)', color: '#9a9a9a', padding: 7, borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.56rem', fontWeight: 900, color: '#9a9a9a', letterSpacing: '1px', marginBottom: 9, textTransform: 'uppercase' }}>Which dish?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, maxHeight: 200, overflowY: 'auto' }}>
                  {menuItems.filter(m => (m.categoryId || '').toLowerCase().trim() === eightySixModal.categoryKey && m.isAvailable !== false).map(dish => (
                    <button type="button" key={dish._id} onClick={() => setSelectedDish86(dish)}
                      style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, color: selectedDish86?._id === dish._id ? '#cfcac0' : '#a6a6a6', background: selectedDish86?._id === dish._id ? 'rgba(255,255,255,0.149)' : 'transparent', border: `1px solid ${selectedDish86?._id === dish._id ? 'rgba(211,191,162,0.59)' : 'rgba(247,243,235,0.231)'}`, transition: 'all 0.15s' }}>
                      {dish.name}
                    </button>
                  ))}
                  {menuItems.filter(m => (m.categoryId || '').toLowerCase().trim() === eightySixModal.categoryKey && m.isAvailable !== false).length === 0 && (
                    <div style={{ fontSize: '0.62rem', color: '#9a9a9a', fontStyle: 'italic', padding: '8px 2px' }}>Everything in this category is already 86'd.</div>
                  )}
                </div>

                {selectedDish86 && (
                  <>
                    <div style={{ fontSize: '0.56rem', fontWeight: 900, color: '#9a9a9a', letterSpacing: '1px', marginBottom: 9, textTransform: 'uppercase' }}>Why?</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                      {EIGHTY_SIX_REASONS.map(r => {
                        const RIcon = r.icon;
                        const active = selectedReason86 === r.id;
                        return (
                          <button type="button" key={r.id} onClick={() => setSelectedReason86(r.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, color: active ? '#cfcac0' : '#a6a6a6', background: active ? 'rgba(255,255,255,0.149)' : 'transparent', border: `1px solid ${active ? 'rgba(211,191,162,0.59)' : 'rgba(255,255,255,0.116)'}`, transition: 'all 0.15s' }}>
                            <RIcon size={13} />
                            {r.label}
                          </button>
                        );
                      })}
                    </div>

                    <button type="button" onClick={confirm86}
                      style={{ width: '100%', padding: '13px 0', borderRadius: 11, border: '1px solid rgba(226,154,88,0.5)', background: 'rgba(226,154,88,0.12)', color: '#f7f3eb', fontWeight: 900, fontSize: '0.68rem', letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
        body { margin: 0; background: #080808; color: #f7f3eb; overflow: hidden; font-family: 'Outfit', sans-serif; -webkit-tap-highlight-color: transparent; }
        button { font-family: 'Outfit', sans-serif; }
        input, select, textarea { font-family: 'Outfit', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.198); border-radius: 10px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes strobePulse { 0% { box-shadow: 0 0 0 0 rgba(211,191,162,0.73); } 70% { box-shadow: 0 0 0 10px rgba(255,255,255,0.0); } 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0); } }
        .voice-pulse { animation: strobePulse 1.8s infinite; border-radius: 9px; }
        @keyframes urgentPulse { 0%,100% { border-color: rgba(226,154,88,0.45); box-shadow: 0 0 0 0 rgba(226,154,88,0); } 50% { border-color: rgba(226,154,88,1); box-shadow: 0 0 22px rgba(226,154,88,0.28); } }
        .flash-card-pulse { animation: urgentPulse 1.8s ease-in-out infinite; }
        @keyframes newOrder { 0% { transform: scale(0.97); box-shadow: 0 0 0 0 rgba(211,191,162,0.59); } 50% { transform: scale(1); box-shadow: 0 0 20px 4px rgba(255,255,255,0.198); } 100% { transform: scale(1); box-shadow: none; } }
        .new-order-flash { animation: newOrder 0.6s ease forwards; }
        @keyframes kdsRise { from { opacity: 0; transform: translateY(10px) scale(0.985); } to { opacity: 1; transform: none; } }
        @keyframes kdsSheen { 0% { background-position: -140% 0; } 100% { background-position: 240% 0; } }
        @keyframes kdsGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0); } 50% { box-shadow: 0 0 26px -4px rgba(255,255,255,0.193); } }
        main > div > div, section > div > div { animation: kdsRise .45s cubic-bezier(.22,1,.36,1) both; }
        button { transition: transform .18s cubic-bezier(.22,1,.36,1), filter .18s, box-shadow .18s, border-color .18s, background .18s; }
        button:not(:disabled):hover { transform: translateY(-1px); filter: brightness(1.08); }
        button:not(:disabled):active { transform: translateY(0) scale(0.98); }
        input:focus, textarea:focus, select:focus { border-color: rgba(211,191,162,0.6) !important; box-shadow: 0 0 0 4px rgba(255,255,255,0.055) !important; outline: none; }
        ::selection { background: rgba(255,255,255,0.193); }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
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
  itemFinalTimes, setItemFinalTimes, onItemSynced
}) => {
  // KDSOrderCard is defined outside KitchenView, so the route's tenantId is not in scope here.
  const tenantId     = order.tenantId;
  const otype        = getOrderType(order);
  const isAggOrder   = otype === 'swiggy' || otype === 'zomato';
  const isParcelOrder = otype === 'parcel';

  const [seconds,       setSeconds]       = useState(0);
  const [itemStartTimes,setItemStartTimes]= useState({});
  const [itemElapsed,   setItemElapsed]   = useState({});
  const [showNote,      setShowNote]      = useState(false);
  // The server has no field for kitchen notes, so this stays on this device. It used to vanish on every refresh / reconnect;
  // keep it per ticket in localStorage (blocked storage just means it is not remembered).
  const noteKey = `kds_note_${order._id}`;
  const [localNote,     setLocalNoteState] = useState(() => { try { return localStorage.getItem(`kds_note_${order._id}`) || ''; } catch { return ''; } });
  const setLocalNote = v => { setLocalNoteState(v); try { v ? localStorage.setItem(noteKey, v) : localStorage.removeItem(noteKey); } catch {} };

  /* The customer replaced the dishes: per-dish local timers are keyed by line index and would now point at different dishes */
  useEffect(() => {
    setItemStartTimes({});
    setItemElapsed({});
  }, [order.modifiedAt]);

  /* live second counter */
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - new Date(order.createdAt)) / 1000) || 0)); // NaN when createdAt is missing/invalid
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  /* Server-authoritative item timers. The browser only renders elapsed time. */
  useEffect(() => {
    const starts = {};
    const finals = {};
    (order.items || []).forEach((item, idx) => {
      if (item.isExtraItem || item.extraItemId != null) return;
      const start = item.kdsStartedAt || order.kdsStartedAt || order.createdAt;
      if (start && !item.kdsCompletedAt && !item.isCrossedLocal) starts[idx] = new Date(start).getTime();
      if (item.kdsPrepTimeSeconds != null) finals[`${order._id}-${idx}`] = Number(item.kdsPrepTimeSeconds);
    });
    setItemStartTimes(starts);
    setItemFinalTimes(prev => ({ ...prev, ...finals }));
  }, [order._id, order.items, order.kdsStartedAt, order.createdAt, setItemFinalTimes]);

  /* item-level cook timers */
  useEffect(() => {
    if (Object.keys(itemStartTimes).length === 0) { setItemElapsed(prev => (Object.keys(prev).length ? {} : prev)); return undefined; }
    const t = setInterval(() => {
      setItemElapsed(prev => {
        const u = {};
        Object.entries(itemStartTimes).forEach(([idx, startMs]) => {
          u[idx] = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
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
    high:     'rgba(211,191,162,1.0)',
    medium:   'rgba(211,191,162,0.622)',
    low:      'rgba(247,243,235,0.33)',
  };
  const topBarColor = isAggOrder
    ? accentColor[otype]
    : urgency === 'high'
      ? 'linear-gradient(90deg,#f7f3eb,#cfcac0)'
      : urgency === 'medium'
        ? 'rgba(211,191,162,0.562)'
        : 'rgba(247,243,235,0.264)';

  const kitchenItems = (order.items || []).filter(i => !i.isExtraItem && i.extraItemId == null);
  const checkedCount  = (order.items || []).reduce((n, it, idx) => (!it.isExtraItem && it.extraItemId == null && checkedItemsGlobal[`${order._id}-${idx}`]) ? n + 1 : n, 0);
  const totalItems    = kitchenItems.length;
  const progressPct   = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const allDone       = progressPct === 100 && totalItems > 0;

  const toggleItemCrossed = async idx => {
    const key  = `${order._id}-${idx}`;
    // A second tap while the first save is in flight carried the same (now stale) version: guaranteed 409 and a flicker.
    if (pendingToggleKeys.has(key)) return;
    const next = !checkedItemsGlobal[key];
    pendingToggleKeys.add(key);
    const startMs = itemStartTimes[idx] || new Date(order.items?.[idx]?.kdsStartedAt || order.kdsStartedAt || order.createdAt).getTime();
    setItemStartTimes(prev => ({ ...prev, [idx]: startMs }));
    setCheckedItemsGlobal(prev => ({ ...prev, [key]: next }));
    socketInstance?.emit('kds_item_cross_sync', { orderId:order._id, tenantId:order.tenantId, idx, newState:next });
    try {
      const currentItem = order.items?.[idx] || {};
      const r = await axios.patch(`${BASE_URL}/admin/orders/${order._id}/kds-item`, {
        itemIndex: idx, completed: next, tenantId,
        timingVersion: Number.isInteger(Number(currentItem.kdsTimingVersion)) ? Number(currentItem.kdsTimingVersion) : 0
      });
      onItemSynced?.(order._id, idx, r.data?.item, r.data?.order ? { prepTimeSeconds: r.data.order.prepTimeSeconds, prepTimeMinutes: r.data.order.prepTimeMinutes } : null);
      if (next && r.data?.item?.kdsPrepTimeSeconds != null) {
        setItemFinalTimes(prev => ({ ...prev, [`${order._id}-${idx}`]: Number(r.data.item.kdsPrepTimeSeconds) }));
        setItemStartTimes(prev => ({ ...prev, [idx]: new Date(r.data.item.kdsStartedAt || startMs).getTime() }));
      }
    } catch (err) {
      const authoritative = err?.response?.data?.item;
      if (err?.response?.status === 409 && authoritative) {
        onItemSynced?.(order._id, idx, authoritative, null);
        setCheckedItemsGlobal(prev => ({ ...prev, [key]: !!authoritative.kdsCompletedAt || !!authoritative.isCrossedLocal }));
        if (authoritative.kdsPrepTimeSeconds != null) {
          setItemFinalTimes(prev => ({ ...prev, [key]: Number(authoritative.kdsPrepTimeSeconds) }));
        }
        setItemStartTimes(prev => ({ ...prev, [idx]: authoritative.kdsStartedAt ? new Date(authoritative.kdsStartedAt).getTime() : startMs }));
        // Other screens were told `next` before the save; tell them what the server really holds.
        socketInstance?.emit('kds_item_cross_sync', { orderId:order._id, tenantId:order.tenantId, idx, newState: !!authoritative.kdsCompletedAt || !!authoritative.isCrossedLocal });
      } else {
        setCheckedItemsGlobal(prev => ({ ...prev, [key]: !next }));
        socketInstance?.emit('kds_item_cross_sync', { orderId:order._id, tenantId:order.tenantId, idx, newState: !next });
      }
      console.error('KDS item timing save failed:', err?.message || err);
    } finally { pendingToggleKeys.delete(key); }
  };

  // Touch long-press: iOS/iPadOS never fires `contextmenu` on a long-press, so the cook timer could not be started on an iPad.
  const lpTimerRef = useRef(null);
  const lpFiredRef = useRef(false);
  const lastStartRef = useRef({});
  useEffect(() => () => clearTimeout(lpTimerRef.current), []);
  const startItemTimer = async (idx, e) => {
    e?.preventDefault?.();
    const key = `${order._id}-${idx}`;
    if (itemStartTimes[idx] || checkedItemsGlobal[key]) return;
    // Long-press and contextmenu can both fire for one gesture on Android, and state has not updated between them.
    if (lastStartRef.current[key] && Date.now() - lastStartRef.current[key] < 1500) return;
    lastStartRef.current[key] = Date.now();
    // Persist the actual cook-start moment. The local clock remains immediate
    // feedback, while the server becomes the source of truth for analytics.
    const now = Date.now();
    setItemStartTimes(p => ({ ...p, [idx]: now }));
    try {
      const currentItem = order.items?.[idx] || {};
      const sr = await axios.patch(`${BASE_URL}/admin/orders/${order._id}/kds-item`, {
        itemIndex: idx, action: 'start', tenantId,
        timingVersion: Number.isInteger(Number(currentItem.kdsTimingVersion)) ? Number(currentItem.kdsTimingVersion) : 0
      });
      onItemSynced?.(order._id, idx, sr.data?.item, null);
    } catch (err) {
      if (err?.response?.status === 409 && err.response.data?.item) onItemSynced?.(order._id, idx, err.response.data.item, null);
      setItemStartTimes(p => { const n = { ...p }; delete n[idx]; return n; });
      console.error('KDS item start save failed:', err?.message || err);
    }
  };

  /* Header label */
  const tableLabel = otype === 'swiggy' ? <span style={{ color:'#fc8019' }}>SWIGGY</span>
    : otype === 'zomato'  ? <span style={{ color:'#cb202d' }}>ZOMATO</span>
    : isParcelOrder ? <span style={{ color:'#17120c' }}>PARCEL</span>
    : <span style={{ color:'#17120c' }}>T-{order.tableNumber}</span>;

  const sourceMeta = {
    waitlist: { label:'WAITLIST', color:'#3a3225', bg:'rgba(23,18,12,0.08)', border:'rgba(23,18,12,0.2)' },
    reservation: { label:'RESERVATION', color:'#3a3225', bg:'rgba(23,18,12,0.08)', border:'rgba(23,18,12,0.2)' },
    'counter-pickup': { label:'PICKUP', color:'#3a3225', bg:'rgba(23,18,12,0.08)', border:'rgba(23,18,12,0.2)' },
    swiggy:          { label:'SWIGGY',     color:'#fc8019', bg:'rgba(252,128,25,0.1)',  border:'rgba(252,128,25,0.3)' },
    zomato:          { label:'ZOMATO',     color:'#cb202d', bg:'rgba(203,32,45,0.1)',   border:'rgba(203,32,45,0.3)' },
    takeaway: { label:'TAKEAWAY', color:'#3a3225', bg:'rgba(23,18,12,0.08)', border:'rgba(23,18,12,0.2)' },
    direct: { label:'DINE-IN', color:'#3a3225', bg:'rgba(23,18,12,0.08)', border:'rgba(23,18,12,0.2)' },
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
        border: `1px solid ${isAggOrder ? accentColor[otype]+'40' : isNewest ? 'rgba(233,220,195,0.55)' : 'rgba(233,220,195,0.2)'}`,
        position:'relative', overflow:'hidden',
        background:'linear-gradient(160deg, rgba(233,220,195,0.06), rgba(233,220,195,0.015)), #0c0a08',
        boxShadow: isAggOrder ? `0 0 28px ${accentColor[otype]}14` : isNewest ? '0 0 22px rgba(247,243,235,0.165)' : '0 4px 18px rgba(247,243,235,0.091)',
        transition:'border-color 0.3s',
      }}>

      {/* TOP URGENCY BAR */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:topBarColor, flexShrink:0 }} />

      {/* ── CARD HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', margin:(isMobile||isTablet)?'-14px -14px 12px':'-16px -16px 12px', padding:(isMobile||isTablet)?'17px 14px 12px':'19px 16px 13px', gap:8, background:'linear-gradient(135deg, #f1e8d4 0%, #e6d9bd 55%, #dccdad 100%)', borderBottom:'1px solid rgba(23,18,12,0.12)', color:'#17120c' }}>
        {/* Left — table / platform */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <h2 style={{ fontSize: isMobile?'1.7rem':isTablet?'1.6rem':'1.9rem', margin:0, fontWeight:900, lineHeight:1, letterSpacing:'-0.5px', color:'#17120c' }}>
              {tableLabel}
            </h2>
            {isNewest && (
              <span style={{ fontSize:'0.45rem', fontWeight:900, padding:'2px 7px', borderRadius:5, background:'#17120c', color:'#ecdcb9', border:'1px solid #17120c', letterSpacing:'0.5px', flexShrink:0 }}>NEW</span>
            )}
            {order.isModified && (
              <span style={{ fontSize:'0.45rem', fontWeight:900, padding:'2px 7px', borderRadius:5, background:'#e29a58', color:'#f7f3eb', letterSpacing:'0.5px', flexShrink:0 }}>REPLACED</span>
            )}
          </div>
          {/* Source + order ID row */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.47rem', fontWeight:900, padding:'2px 6px', borderRadius:4, letterSpacing:'0.5px', textTransform:'uppercase', background:sm.bg, color:sm.color, border:`1px solid ${sm.border}` }}>
              {sm.label}
            </span>
            <span style={{ fontSize:'0.48rem', color:'#6f624c', fontFamily:'monospace', fontWeight:900 }}>
              #{String(order._id).slice(-4).toUpperCase()}
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
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:9, border:`1.5px solid ${urgency==='high' ? '#17120c' : urgency==='medium' ? '#8a704d' : 'rgba(23,18,12,0.28)'}`, background: urgency==='high' ? '#17120c' : urgency==='medium' ? 'rgba(138,112,77,0.14)' : 'rgba(23,18,12,0.06)' }}>
            <Clock size={12} color={urgency==='high'?'#e29a58':urgency==='medium'?'#6b5334':'#4a3f2e'} />
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize: isMobile?'0.88rem':'0.92rem', color:urgency==='high'?'#f1e3c4':urgency==='medium'?'#5c4527':'#2c2418', letterSpacing:'-0.3px' }}>
              {fmt(seconds)}
            </span>
          </div>
          {urgency !== 'low' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize:'0.43rem', fontWeight:900, color: urgency==='high' ? '#8a4f12' : '#6b5334', letterSpacing:'0.5px', textTransform:'uppercase' }}>
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
            <span style={{ fontSize:'0.6rem', color:'#a6a6a6', fontWeight:700 }}>{order.aggregatorCustomer.name}</span>
          )}
          {order.aggregatorRaw?.expectedDeliveryTime && (
            <span style={{ fontSize:'0.52rem', color:'rgba(211,191,162,0.59)', fontFamily:'monospace' }}>
              ~{order.aggregatorRaw.expectedDeliveryTime}m
            </span>
          )}
        </div>
      )}

      {/* REPLACED STRIP — what the customer changed */}
      {order.isModified && (
        <div style={{ marginBottom:10, padding:'6px 10px', borderRadius:8, background:'rgba(226,154,88,0.08)', border:'1px solid rgba(226,154,88,0.3)', fontSize:'0.55rem', color:'#d08a4a', fontWeight:700, lineHeight:1.4 }}>
          <div style={{ fontWeight:900, letterSpacing:'0.6px' }}>⚠ ORDER REPLACED BY CUSTOMER</div>
          {(order.replacedInfo?.previousItems || []).length > 0 && (
            <div style={{ fontWeight:600, opacity:0.9 }}>Was: {(order.replacedInfo.previousItems).map(p => `${p.quantity}× ${p.name}`).join(', ')}</div>
          )}
          {(order.replacedInfo?.removed || []).length > 0 && (
            <div style={{ fontWeight:800 }}>Removed: {(order.replacedInfo.removed).map(p => `${p.quantity}× ${p.name}`).join(', ')}</div>
          )}
        </div>
      )}

      {/* PREP PROGRESS BAR */}
      {totalItems > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:'0.47rem', color:'#9a9a9a', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.8px' }}>PREP PROGRESS</span>
            <span style={{ fontSize:'0.52rem', fontWeight:900, color: allDone ? '#cfcac0' : '#9a9a9a', fontFamily:'monospace' }}>{checkedCount}/{totalItems}</span>
          </div>
          <div style={{ height:3, background:'rgba(255,255,255,0.083)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background: allDone ? 'linear-gradient(90deg,#e6d6b8,#b99f78)' : urgency==='high' ? 'rgba(211,191,162,0.8)' : 'rgba(247,243,235,0.418)', borderRadius:2, transition:'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* ITEM LIST */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }} className="custom-scroll">
        {(order.items || []).map((item, idx) => {
          if (item.isExtraItem || item.extraItemId != null) return null;

          let catId = item.categoryId?.toLowerCase().trim() || dishToCategoryMap[item.name?.toLowerCase().trim()] || null;
          if (selectedCategory !== 'ALL' && catId !== selectedCategory.toLowerCase().trim()) return null;

          const isVeg = item.isVeg !== undefined
            ? item.isVeg !== false
            : (dishToVegMap?.[item.name?.toLowerCase().trim()] !== false);
          const modeMatch = tenantOnlyVeg ? true : isNonVegMode ? !isVeg : isVeg;
          if (!modeMatch) return null;

          const crossed      = !!checkedItemsGlobal[`${order._id}-${idx}`];
          const hasStarted   = !!itemStartTimes[idx] || !!item.kdsStartedAt;
          const elapsedSecs  = Math.max(0, Math.round(item.kdsCompletedAt && item.kdsPrepTimeSeconds != null ? Number(item.kdsPrepTimeSeconds) : (itemElapsed[idx] || 0)));
          const isSlow       = hasStarted && !crossed && elapsedSecs >= 300;
          const finalSecs    = Math.max(0, Math.round(Number(itemFinalTimes?.[`${order._id}-${idx}`] ?? elapsedSecs) || 0)); // fractional server seconds rendered as "3m 12.4285s"

          /* Per-item source tag */
          const itemTag = isAggOrder
            ? { label: otype.toUpperCase(), color: accentColor[otype], bg:`${accentColor[otype]}10`, border:`${accentColor[otype]}30`, icon:<Zap size={9}/> }
            : isParcelOrder
              ? { label:'PARCEL',  color:'#cfcac0', bg:'rgba(247,243,235,0.154)', border:'rgba(255,255,255,0.198)', icon:<Package size={9}/> }
              : { label:'DINE-IN', color:'#a6a6a6', bg:'rgba(247,243,235,0.033)', border:'rgba(255,255,255,0.083)', icon:<UtensilsCrossed size={9}/> };

          return (
            <div
              key={idx}
              onClick={() => { if (lpFiredRef.current) { lpFiredRef.current = false; return; } toggleItemCrossed(idx); }}
              onContextMenu={e => startItemTimer(idx, e)}
              onTouchStart={() => { lpFiredRef.current = false; clearTimeout(lpTimerRef.current); lpTimerRef.current = setTimeout(() => { lpFiredRef.current = true; startItemTimer(idx, null); }, 550); }}
              onTouchEnd={() => clearTimeout(lpTimerRef.current)}
              onTouchMove={() => clearTimeout(lpTimerRef.current)}
              onTouchCancel={() => clearTimeout(lpTimerRef.current)}
              style={{
                display:'flex', alignItems:'flex-start', gap:10,
                padding: isMobile?'10px 11px':'11px 12px',
                borderRadius:10,
                background: crossed ? '#080808' : hasStarted ? '#101010' : '#0d0d0d',
                border: `1px solid ${crossed ? 'rgba(255,255,255,0.066)' : hasStarted ? 'rgba(211,191,162,0.42)' : 'rgba(247,243,235,0.198)'}`,
                borderLeft: `3px solid ${crossed ? 'rgba(255,255,255,0.066)' : hasStarted ? 'rgba(211,191,162,0.66)' : 'rgba(247,243,235,0.264)'}`,
                cursor:'pointer', transition:'all 0.15s', userSelect:'none',
                opacity: crossed ? 0.5 : 1,
              }}>

              {/* Qty badge */}
              <div style={{ width:28, height:28, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono, monospace', fontWeight:900, fontSize:'0.85rem', background: crossed ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.149)', border:`1px solid ${crossed?'rgba(255,255,255,0.066)':'rgba(255,255,255,0.171)'}`, color: crossed ? '#9a9a9a' : '#cfcac0' }}>
                {item.quantity}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                {/* Name row */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                  <span style={{ fontSize: isMobile?'0.86rem':isTablet?'0.83rem':'0.9rem', fontWeight:700, lineHeight:1.25, textDecoration: crossed ? 'line-through' : 'none', color: crossed ? '#9a9a9a' : item.isChefSpecial ? '#f7f3eb' : '#f7f3eb', background: item.isChefSpecial && !crossed ? 'linear-gradient(160deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))' : 'transparent', padding: item.isChefSpecial && !crossed ? '1px 6px' : 0, borderRadius: item.isChefSpecial ? 4 : 0 }}>
                    {item.isChefSpecial && !crossed && <Sparkles size={10} style={{ display:'inline', marginRight:3 }} />}
                    {item.name}
                  </span>
                  {item.modChange && !crossed && (
                    <span style={{ fontSize:'0.43rem', fontWeight:900, padding:'1px 6px', borderRadius:4, background:'#e29a58', color:'#f7f3eb', letterSpacing:'0.4px', flexShrink:0 }}>
                      {item.modChange === 'new' ? 'NEW' : `QTY ${item.modPrevQty}→${item.quantity}`}
                    </span>
                  )}

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
                  <div style={{ fontSize:'0.58rem', fontWeight:900, color: item.portion?.toLowerCase()==='half' ? '#cfcac0' : '#a6a6a6', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.3px' }}>
                    {item.portion?.toUpperCase() || 'STANDARD'}
                  </div>
                )}

                {/* Cook timer */}
                {hasStarted && !crossed && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:2, fontSize:'0.52rem', fontWeight:900, color: isSlow ? '#cfcac0' : 'rgba(211,191,162,0.52)', background: isSlow ? 'rgba(255,255,255,0.116)' : 'transparent', padding: isSlow ? '2px 6px' : 0, borderRadius:4, border: isSlow ? '1px solid rgba(255,255,255,0.171)' : 'none', fontFamily:'monospace' }}>
                    <Timer size={9} />
                    {`${Math.floor(elapsedSecs/60)}:${(elapsedSecs%60).toString().padStart(2,'0')}`}
                    {isSlow && <span style={{ display:'inline-flex', alignItems:'center', gap:2, fontSize:'0.44rem' }}><AlertTriangle size={8} strokeWidth={2.5} /> SLOW</span>}
                  </div>
                )}

                {/* Done time */}
                {crossed && hasStarted && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:2, fontSize:'0.52rem', color:'#9a9a9a', fontFamily:'monospace', fontWeight:900 }}>
                    <Timer size={9} /> Done {Math.floor(finalSecs/60)}m {finalSecs%60}s
                  </div>
                )}

                {/* Long-press hint — only on first unchecked */}
                {!hasStarted && !crossed && idx === order.items.findIndex(i => !checkedItemsGlobal[`${order._id}-${order.items.indexOf(i)}`] && !i.isExtraItem && i.extraItemId == null) && (
                  <div style={{ fontSize:'0.46rem', color:'rgba(247,243,235,0.341)', marginTop:2, fontStyle:'italic' }}>Hold to start cook timer</div>
                )}

                {/* Suggestion note */}
                {item.suggestion && !crossed && (
                  <div style={{ display:'flex', alignItems:'flex-start', gap:5, marginTop:5, padding:'5px 8px', borderRadius:7, background:'rgba(255,255,255,0.066)', border:'1px solid rgba(255,255,255,0.132)' }}>
                    <StickyNote size={9} color="#b9a27e" style={{ flexShrink:0, marginTop:1 }} />
                    <span style={{ fontSize:'0.6rem', color:'#cfcac0', fontWeight:700, textTransform:'uppercase', lineHeight:1.4 }}>{item.suggestion}</span>
                  </div>
                )}
              </div>

              {/* Cross indicator */}
              {crossed && <CheckSquare size={16} color="rgba(211,191,162,0.52)" style={{ flexShrink:0, marginTop:2 }} />}
            </div>
          );
        })}
      </div>

      {/* CHEF NOTE PANEL */}
      {showNote && (
        <div style={{ marginTop:8, background:'rgba(255,255,255,0.066)', border:'1px solid rgba(255,255,255,0.165)', borderRadius:9, padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-start' }}>
          <StickyNote size={12} color="#b9a27e" style={{ flexShrink:0, marginTop:2 }} />
          <textarea value={localNote} onChange={e => setLocalNote(e.target.value)} placeholder="Private note for this ticket (shown on this screen only)…"
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#cfcac0', fontSize:'0.72rem', resize:'none', fontFamily:"'Outfit', sans-serif", lineHeight:1.5, minHeight:52 }} rows={2} />
        </div>
      )}

      {/* BOTTOM ACTIONS */}
      <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:10, flexShrink:0 }}>
        {/* Note toggle — small secondary action */}
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button type="button" onClick={() => setShowNote(v => !v)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', background:'transparent', border:'1px solid rgba(255,255,255,0.116)', color:'#a6a6a6', borderRadius:7, fontSize:'0.5rem', fontWeight:900, cursor:'pointer', letterSpacing:'0.5px', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.41)'; e.currentTarget.style.color='#cfcac0'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.116)'; e.currentTarget.style.color='#a6a6a6'; }}>
            <StickyNote size={10} /> {showNote ? 'HIDE NOTE' : 'ADD NOTE'}
          </button>
        </div>

        {/* DISPATCH BUTTON */}
        <button type="button"
          onClick={() => onReady(order._id)}
          style={{
            width:'100%',
            padding: isMobile?'15px':isTablet?'13px':'14px',
            borderRadius:12,
            border: urgency==='high' ? '1px solid #e29a58' : '1px solid rgba(233,220,195,0.55)',
            fontWeight:900,
            fontSize: isMobile?'0.86rem':isTablet?'0.75rem':'0.78rem',
            cursor:'pointer',
            textTransform:'uppercase', letterSpacing:'0.8px',
            transition:'all 0.2s',
            background: urgency==='high'
              ? '#17120c'
              : 'linear-gradient(135deg, #f1e8d4, #e3d5b8 55%, #d6c5a0)',
            boxShadow: allDone ? '0 8px 22px -8px rgba(233,220,195,0.55)' : 'none',
            color: urgency==='high' ? '#f1e3c4' : '#17120c',
            minHeight: isMobile?50:44,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
          {urgency === 'high' && <Flame size={14} color="#e29a58" strokeWidth={2.5} />}
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
    background:'radial-gradient(ellipse 900px 520px at 12% -6%, rgba(233,220,195,0.07), transparent 60%), radial-gradient(ellipse 760px 480px at 100% 0%, rgba(233,220,195,0.06), transparent 55%), radial-gradient(ellipse 1100px 700px at 50% 112%, rgba(233,220,195,0.05), transparent 60%), #080706', padding:'12px', gap:10,
    overflow:'hidden',
  },
  header: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    background:'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', padding:'9px 13px',
    borderRadius:18, border:'1px solid rgba(255,255,255,0.11)', boxShadow:'0 18px 44px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
    flexShrink:0, zIndex:10, gap:8, minHeight:52,
    overflowX:'hidden',
  },
  iconBtn: {
    background:'#121212', border:'1px solid rgba(255,255,255,0.165)',
    padding:'8px', borderRadius:9, cursor:'pointer',
    display:'flex', alignItems:'center', flexShrink:0,
    transition:'all 0.15s',
  },
  utilBtn: {
    background:'#121212', border:'1px solid rgba(255,255,255,0.132)',
    color:'#f7f3eb', padding:'7px 11px', borderRadius:9,
    cursor:'pointer', display:'flex', alignItems:'center',
    gap:5, transition:'all 0.15s', flexShrink:0, minHeight:36,
  },
  dotGold: {
    width:5, height:5, background:'#d3bfa2', borderRadius:'50%',
    boxShadow:'0 0 7px rgba(211,191,162,1.0)', flexShrink:0,
  },
  dotRed: {
    width:5, height:5, background:'#e29a58', borderRadius:'50%',
    boxShadow:'0 0 7px rgba(226,154,88,0.49)', flexShrink:0,
  },
  body: { display:'flex', flex:1, gap:10, overflow:'hidden', minHeight:0 },
  sidebar: {
    background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.116)',
    borderRadius:13, display:'flex', flexDirection:'column',
    padding:'15px 12px', flexShrink:0, height:'100%', overflowY:'auto',
  },
  sidebarHeaderIcon: {
    width:28, height:28, borderRadius:8,
    background:'rgba(255,255,255,0.083)', border:'1px solid rgba(255,255,255,0.198)',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  },
  sidebarBtn: (active) => ({
    display:'flex', alignItems:'center', padding:'10px 10px',
    borderRadius:9, border: active ? 'none' : '1px solid rgba(255,255,255,0.116)',
    background: active ? 'linear-gradient(160deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))' : 'rgba(255,255,255,0.033)',
    color: active ? '#f7f3eb' : '#a6a6a6',
    cursor:'pointer', fontSize:'0.64rem', fontWeight: active ? 900 : 800,
    width:'100%', textAlign:'left', transition:'all 0.15s',
    letterSpacing:'0.3px', minHeight:40, gap:0,
    boxShadow: active ? '0 4px 12px rgba(255,255,255,0.154)' : 'none',
  }),
  countChip: (active, hasItems) => ({
    fontSize:'0.54rem', fontFamily:'monospace', padding:'1px 6px',
    borderRadius:5, fontWeight:900,
    background: active ? 'rgba(255,255,255,0.22)' : hasItems ? 'rgba(255,255,255,0.132)' : 'rgba(247,243,235,0.099)',
    color: active ? '#f7f3eb' : hasItems ? '#cfcac0' : '#9a9a9a',
    border: active ? 'none' : hasItems ? '1px solid rgba(255,255,255,0.171)' : '1px solid rgba(247,243,235,0.165)',
  }),
  workspace: {
    flex:1, overflowY:'auto', minWidth:0,
  },
  navBtn: {
    display:'flex', alignItems:'center', gap:5,
    background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(255,255,255,0.165)',
    color:'#cfcac0', padding:'10px 14px', borderRadius:9,
    cursor:'pointer', fontSize:'0.7rem', fontWeight:800, minHeight:44,
    transition:'all 0.15s',
  },
};

const wInput = {
  width:'100%', padding:'10px 12px',
  background:'#080808', border:'1px solid rgba(255,255,255,0.165)',
  color:'#f7f3eb', borderRadius:9, fontSize:'0.8rem',
  outline:'none', boxSizing:'border-box',
  fontFamily:"'Outfit', sans-serif",
  transition:'border-color 0.15s',
};

const wFormLabel = {
  display:'block', fontSize:'0.5rem', color:'#9a9a9a',
  fontWeight:900, letterSpacing:'1.2px', marginBottom:6,
  textTransform:'uppercase',
};


/* ═══════════════════════════════════════════════════════════
   LOADING SKELETONS — mirror the real KDS geometry (ticket card, sidebar list) so nothing shifts when data arrives.
   One calm sweep, staggered across the cards; motion is switched off for prefers-reduced-motion.
═══════════════════════════════════════════════════════════ */
const KDS_SKELETON_CSS = `
.kdsk{position:relative;overflow:hidden;background:rgba(255,255,255,0.055);border-radius:6px;flex-shrink:0}
.kdsk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(100deg,transparent 15%,rgba(233,220,195,0.11) 50%,transparent 85%);
  animation:kdsk-sweep 1.7s cubic-bezier(.45,0,.25,1) infinite;animation-delay:var(--kdsk-d,0s)}
.kdsk-ink{background:rgba(23,18,12,0.12)}
.kdsk-ink::after{background:linear-gradient(100deg,transparent 15%,rgba(255,255,255,0.42) 50%,transparent 85%)}
@keyframes kdsk-sweep{to{transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.kdsk::after{animation:none;opacity:0}}
`;

const KdsSkeletonCss = () => (
  <>
    <style>{KDS_SKELETON_CSS}</style>
    <span role="status" style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(0 0 0 0)', whiteSpace:'nowrap' }}>Loading kitchen tickets…</span>
  </>
);

const Sk = ({ w, h, r = 6, ink = false, style }) => (
  <div className={`kdsk${ink ? ' kdsk-ink' : ''}`} style={{ width:w, height:h, borderRadius:r, ...style }} />
);

/* One ticket: same shell, cream header band, progress row, dish rows and dispatch button as KDSOrderCard. */
const KdsCardSkeleton = ({ index = 0, isMobile = false, isTablet = false }) => {
  const pad = (isMobile || isTablet) ? 14 : 16;
  const rows = isMobile ? 5 : isTablet ? 3 : 4;
  return (
    <div aria-hidden="true" style={{
      '--kdsk-d': `${index * 0.14}s`,
      borderRadius:16, padding:pad, display:'flex', flexDirection:'column', boxSizing:'border-box',
      height: isMobile ? '100%' : isTablet ? 390 : 420,
      border:'1px solid rgba(233,220,195,0.2)', position:'relative', overflow:'hidden',
      background:'linear-gradient(160deg, rgba(233,220,195,0.06), rgba(233,220,195,0.015)), #0c0a08',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'rgba(233,220,195,0.22)' }} />

      {/* header band */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8,
        margin:`-${pad}px -${pad}px 12px`, padding: pad === 14 ? '17px 14px 12px' : '19px 16px 13px',
        background:'linear-gradient(135deg, #f1e8d4 0%, #e6d9bd 55%, #dccdad 100%)', borderBottom:'1px solid rgba(23,18,12,0.12)' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <Sk ink w={isMobile ? 64 : 78} h={isMobile ? 27 : 30} r={7} style={{ marginBottom:5 }} />
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <Sk ink w={46} h={15} r={4} />
            <Sk ink w={34} h={11} r={4} />
          </div>
        </div>
        <Sk ink w={80} h={31} r={9} />
      </div>

      {/* prep progress */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <Sk w={70} h={8} r={3} />
          <Sk w={24} h={8} r={3} />
        </div>
        <Sk w="100%" h={3} r={2} />
      </div>

      {/* dish rows */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', gap:4 }}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'flex-start', gap:10, padding: isMobile ? '10px 11px' : '11px 12px',
            borderRadius:10, background:'#0d0d0d', border:'1px solid rgba(247,243,235,0.07)', borderLeft:'3px solid rgba(247,243,235,0.12)',
          }}>
            <Sk w={28} h={28} r={7} />
            <div style={{ flex:1, minWidth:0, paddingTop:2 }}>
              <Sk w={`${58 + ((i * 17 + index * 9) % 30)}%`} h={13} r={4} style={{ marginBottom:7 }} />
              <Sk w={`${26 + ((i * 11 + index * 7) % 20)}%`} h={8} r={3} />
            </div>
          </div>
        ))}
      </div>

      {/* bottom actions */}
      <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:10, flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'flex-end' }}><Sk w={70} h={22} r={7} /></div>
        <Sk w="100%" h={isMobile ? 50 : 44} r={12} style={{ background:'rgba(233,220,195,0.09)', border:'1px solid rgba(233,220,195,0.16)' }} />
      </div>
    </div>
  );
};

/* Sidebar station list: ALL + category rows, same 40px buttons as rs.sidebarBtn. */
const KdsSidebarSkeleton = () => (
  <div aria-hidden="true" style={{ display:'flex', flexDirection:'column', gap:4, flex:1, overflow:'hidden' }}>
    {[78, 62, 84, 56, 70, 66].map((w, i) => (
      <div key={i} style={{ '--kdsk-d': `${i * 0.1}s`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 10px', minHeight:40,
        borderRadius:9, border:'1px solid rgba(255,255,255,0.116)', background:'rgba(255,255,255,0.033)', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Sk w={12} h={12} r={4} />
          <Sk w={Math.round(w * 0.9)} h={9} r={3} />
        </div>
        <Sk w={24} h={16} r={6} />
      </div>
    ))}
  </div>
);

/* First load failed: say so and offer a retry instead of an endless skeleton or a false "KITCHEN CLEAR". */
const KdsLoadError = ({ onRetry }) => (
  <div role="alert" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:14 }}>
    <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(160deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02)), #090909', border:'1px solid rgba(226,154,88,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <WifiOff size={28} color="#e29a58" />
    </div>
    <div style={{ textAlign:'center' }}>
      <p style={{ fontWeight:900, color:'#cfcac0', fontSize:'0.85rem', letterSpacing:'2px', margin:'0 0 4px' }}>COULDN'T LOAD TICKETS</p>
      <p style={{ fontSize:'0.62rem', color:'#8c8c8c', margin:0, fontWeight:700 }}>Check the connection. This screen keeps retrying every minute.</p>
    </div>
    <button type="button" onClick={onRetry} style={{ padding:'10px 22px', borderRadius:10, border:'1px solid rgba(233,220,195,0.55)', background:'linear-gradient(135deg, #f1e8d4, #e3d5b8 55%, #d6c5a0)', color:'#17120c', fontWeight:900, fontSize:'0.7rem', letterSpacing:'0.8px', cursor:'pointer' }}>TRY AGAIN</button>
  </div>
);

// One cached <audio> per URL: `new Audio(url).play()` on every socket event re-requested the file and leaked a node each time.
const __sfxCache = {};
const playCachedSound = (url) => {
  try {
    const a = __sfxCache[url] || (__sfxCache[url] = new Audio(url));
    a.currentTime = 0;
    const p = a.play(); if (p && p.catch) p.catch(() => {});
  } catch { /* autoplay blocked / unsupported */ }
};
export default KitchenView;