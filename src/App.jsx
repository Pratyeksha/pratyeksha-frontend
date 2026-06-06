import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import { 
  CheckCircle2, AlertCircle, Utensils, Info, X, Sparkles, 
  MessageSquare, StickyNote, Flame, Globe2, Timer, Search, BellRing, 
  Droplets, Trash2, HelpCircle, Minus, Plus, ReceiptText, ChevronRight, UtensilsCrossed, Layers, ShoppingBag ,Armchair,
  Clock3, Users, ChevronLeft,
  Hourglass, MapPin, CalendarClock, CircleDot, Hash, ArrowLeft,
  Package, UserCheck, MinusCircle, PlusCircle 
} from 'lucide-react'; 

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

const PratyekshaPremiumMenu = () => {
  const { tenantId: urlTenantId } = useParams();
  const [restaurantData, setRestaurantData] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filterVegOnly, setFilterVegOnly] = useState(true);
  
  const [language, setLanguage] = useState('en'); 
  const [tenantId, setTenantId] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const [activeModel, setActiveModel] = useState(null);
const [cart, setCart] = useState(() => {
  try {
    const saved = localStorage.getItem(`pratyeksha_cart_${urlTenantId}`);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
});  const [suggestions, setSuggestions] = useState({}); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [waiterCounts, setWaiterCounts] = useState({ spoon: 0, fork: 0, plates: 0, water: 0 });

  const [hasPlacedInitialOrder, setHasPlacedInitialOrder] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [placedOrders, setPlacedOrders] = useState([]); // To store actual items for bill calculation
  const [liveOrderStatuses, setLiveOrderStatuses] = useState({}); 
// { orderId: 'pending' | 'ready' | 'served' }

  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' });

const navRef = useRef(null);
const activeTabRef = useRef(null);
const nameInputRef = useRef(null);   // ← ADD
const phoneInputRef = useRef(null);  // ← ADD


const [isExtraItemsOpen, setIsExtraItemsOpen] = useState(false);
const [extraItems, setExtraItems] = useState([]);
const [extraItemsLoading, setExtraItemsLoading] = useState(false);
const [extraItemCart, setExtraItemCart] = useState({}); // { itemId: qty }
const [activeExtraCategory, setActiveExtraCategory] = useState('All');
const [extraItemSearchQuery, setExtraItemSearchQuery] = useState('');

const [reservationDate, setReservationDate] = useState('');
const [reservationTime, setReservationTime] = useState('');
const [specialRequests, setSpecialRequests] = useState('');
const [tablePreference, setTablePreference] = useState('');
const [reservationAskOrder, setReservationAskOrder] = useState(false);
// true = show the "want to pre-order?" prompt after reservation fields filled

// ── COUNTER / WAITLIST MODE ──
const [counterMode, setCounterMode] = useState(null); // null | 'dine-in' | 'pickup'
const [isCounterScan, setIsCounterScan] = useState(false);
// REPLACE the existing sessionId useState:
const [sessionId, setSessionId] = useState(() => {
  // Always generate fresh — session validity checked against backend
  const stored = sessionStorage.getItem('pratyeksha_session');
  if (stored) return stored;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem('pratyeksha_session', id);
  return id;
});



const [welcomeCard, setWelcomeCard]         = useState(null);
// null | { name, lastVisit, lastOrderItems, favDish, visitCount }
const [welcomePhone, setWelcomePhone]       = useState('');
const [welcomePhoneInput, setWelcomePhoneInput] = useState('');
const [welcomeLoading, setWelcomeLoading]   = useState(false);
const [welcomeDismissed, setWelcomeDismissed] = useState(false);
const [showPhonePrompt, setShowPhonePrompt] = useState(false);


const [waitlistEntry, setWaitlistEntry] = useState(null);
const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
const [partySize, setPartySize] = useState(1);
const [scheduledPickupTime, setScheduledPickupTime] = useState('');
const [registrationStep, setRegistrationStep] = useState('mode'); // 'mode' | 'register' | 'menu' | 'confirm'
const [avgWaitData, setAvgWaitData] = useState(null);
const [notificationBanner, setNotificationBanner] = useState(null); // { type: 'table'|'pickup', tableNumber, restaurantName }
const [pushPermissionAsked, setPushPermissionAsked] = useState(false);
const [waitlistSocket] = useState(() => io("https://pratyeksha-backend.onrender.com"));
  const t = {
    en: {
      all: "ALL",
      poweredBy: "Powered by",
      table: "Table",
      chefChoice: "CHEF'S CHOICE",
      add: "ADD",
      addHalf: "ADD HALF",
      addFull: "ADD FULL",
      half: "Half",
      full: "Full",
      view3d: "3D",
      roundOrder: "Round Order",
      emptyRound: "Round is empty.",
      orderNow: "ORDER NOW",
      viewFinalBill: "View Final Bill →",
      checkout: "Checkout",
      enterDetails: "Enter details for your automated digital receipt.",
      fullName: "Full Name",
      mobileNumber: "Mobile Number",
      generateBill: "GENERATE BILL",
      thankYou: "Thank You!",
      receiptSent: "Receipt notification sent. Keep it digital, keep it clean.",
      visitAgain: "Visit us again!",
      rateGoogle: "Rate us on Google",
      backMenu: "BACK TO MENU",
      orderSuccess: "Order sent to kitchen! 👨‍🍳",
      orderError: "Error sending order.",
      detailsReq: "Details required.",
      spiceHigh: "HIGH",
      spiceMed: "MEDIUM",
      spiceLow: "LOW",
      notes: "Less spicy, no onion etc...",
      viewInSpace: "✨ VIEW IN YOUR SPACE",
      zoomRotate: "Pinch to zoom • Drag to rotate",
      searchPlaceholder: "Search dishes...",
      callWaiter: "Request Service",
      waiterSuccess: "Request sent to staff!",
      spoon: "Spoons",
      fork: "Forks",
      plates: "Empty Plates",
      water: "Water Bottle",
      clean: "Clean Table",
      other: "Other Request",
      sendRequest: "SEND REQUEST",
      ingredients: "Ingredients",
      billSummary: "Bill Summary",
      continue: "Continue to Feedback",
      qty: "Qty",
      amt: "Amt",
      grandTotal: "Grand Total"
    },
    mr: {
      all: "सर्व",
      poweredBy: "द्वारे समर्थित",
      table: "टेबल क्रमांक",
      chefChoice: "शेफची पसंती",
      add: "निवडा",
      addHalf: "हाफ घ्या",
      addFull: "फुल घ्या",
      half: "हाफ",
      full: "फुल",
      view3d: "३डी",
      roundOrder: "तुमची ऑर्डर",
      emptyRound: "तुमची ऑर्डर रिकामी आहे.",
      orderNow: "ऑर्डर पाठवा",
      viewFinalBill: "बिलाची माहिती →",
      checkout: "चेकआउट",
      enterDetails: "डिजिटल पावतीसाठी तुमची माहिती भरा.",
      fullName: "पूर्ण नाव",
      mobileNumber: "मोबाईल नंबर",
      generateBill: "बिल मागा",
      thankYou: "धन्यवाद!",
      receiptSent: "बिलाची माहिती पाठवली आहे. कृपया डिजिटल रहा.",
      visitAgain: "पुन्हा नक्की या!",
      rateGoogle: "आम्हाला गुगलवर रेट करा",
      backMenu: "मेनूकडे परत जा",
      orderSuccess: "ऑर्डर किचनमध्ये पाठवली आहे! 👨‍🍳",
      orderError: "ऑर्डर पाठवताना समस्या आली.",
      detailsReq: "माहिती भरणे आवश्यक आहे.",
      spiceHigh: "जास्त तिखट",
      spiceMed: "मध्यम तिखट",
      spiceLow: "कमी तिखट",
      notes: "तुमच्या आवडीनुसार सूचना...",
      viewInSpace: "✨ तुमच्या जागेत पहा",
      zoomRotate: "झूम करण्यासाठी पिंच करा • फिरवण्यासाठी ड्रॅग करा",
      searchPlaceholder: "पदार्थ शोधा...",
      callWaiter: "सेवा विनंती",
      waiterSuccess: "सूचना पाठवण्यात आली आहे!",
      spoon: "चमचे",
      fork: "काटा चमचे",
      plates: "रिकाम्या प्लेट्स",
      water: "पाण्याची बाटली",
      clean: "टेबल साफ करा",
      other: "इतर काही",
      sendRequest: "विनंती पाठवा",
      ingredients: "साहित्य",
      billSummary: "बिलाचा तपशील",
      continue: "पुढे जा",
      qty: "नग",
      amt: "किंमत",
      grandTotal: "एकूण रक्कम"
    }
  };

  // =========================================================================
  // ── HOOK CONFIGURATIONS (ALL HOOKS MUST STAY CONTINUOUSLY AT THE TOP) ──
  // =========================================================================

  const filteredMenuItems = allMenuItems.filter(i => {
    const matchesCategory = selectedCategoryId === 'all' || i.categoryId === selectedCategoryId;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.name_mr && i.name_mr.includes(searchQuery));
    const matchesVeg = filterVegOnly ? i.isVeg === true : i.isVeg !== true;
    return matchesCategory && matchesSearch && matchesVeg && i.isAvailable !== false;
  });

  useEffect(() => {
    if (!isCounterScan || !sessionId) return;
    waitlistSocket.emit('join_session', sessionId);

    waitlistSocket.on('table_assigned', (data) => {
      setNotificationBanner({ type: 'table', tableNumber: data.tableNumber, restaurantName: data.restaurantName });
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    });
    waitlistSocket.on('pickup_ready', (data) => {
      setNotificationBanner({ type: 'pickup', restaurantName: data.restaurantName });
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    });
    waitlistSocket.on('position_updated', (data) => {
      setWaitlistEntry(prev => prev ? { ...prev, waitlistPosition: data.position } : prev);
      setAvgWaitData(prev => prev ? { ...prev, estimatedWait: data.estimatedWait } : prev);
    });
    waitlistSocket.on('pickup_reminder', (data) => {
      triggerAlert(data.restaurantName ? `Your pickup will be ready in ~10 min at ${data.restaurantName}!` : 'Order ready soon!', 'success');
    });

    waitlistSocket.on('reservation_confirmed', (data) => {
  setWaitlistEntry(prev => prev ? { ...prev, status: 'confirmed' } : prev);
  setNotificationBanner({ type: 'reservation_confirmed', restaurantName: data.restaurantName, time: data.reservationTime });
});

    return () => {
      waitlistSocket.off('table_assigned');
      waitlistSocket.off('pickup_ready');
      waitlistSocket.off('position_updated');
      waitlistSocket.off('pickup_reminder');
    };
  }, [isCounterScan, sessionId, waitlistSocket]);

// REPLACE the existing useEffect that has:
// "axios.get(`${BASE_URL}/waitlist/session/${activeTenant}/${sessionId}`)"

useEffect(() => {
  const activeTenant = urlTenantId || 'jay_ambe_fusion';
  setTenantId(activeTenant);
  const params = new URLSearchParams(window.location.search);
  const tableParam = params.get('table');

  if (tableParam) {
    setTableNumber(tableParam);
    setIsCounterScan(false);
  } else {
    setTableNumber('Counter');
    setIsCounterScan(true);

    // Fetch avg wait data
    axios.get(`${BASE_URL}/waitlist/avg-wait/${activeTenant}`)
      .then(r => setAvgWaitData(r.data))
      .catch(() => {});

    // Try to resume existing session
    axios.get(`${BASE_URL}/waitlist/session/${activeTenant}/${sessionId}`)
.then(r => {
  if (r.data && ['waiting', 'pickup-ready'].includes(r.data.status)) {
    setWaitlistEntry(r.data);
    setCounterMode(r.data.mode);
    setRegistrationStep('confirm');
  } else {
    // Also check for active reservation
    axios.get(`${BASE_URL}/reservations/session/${activeTenant}/${sessionId}`)
      .then(rr => {
        if (rr.data && ['pending','confirmed'].includes(rr.data.status)) {
          setWaitlistEntry(rr.data);
          setCounterMode('reservation');
          setRegistrationStep('confirm');
        } else {
          sessionStorage.removeItem('pratyeksha_session');
          const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          sessionStorage.setItem('pratyeksha_session', newId);
          setWaitlistEntry(null); setCounterMode(null); setRegistrationStep('mode');
          setCustomerInfo({ name: '', phone: '' }); setPartySize(1);
          setScheduledPickupTime('');
        }
      })
      .catch(() => {
        sessionStorage.removeItem('pratyeksha_session');
        const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('pratyeksha_session', newId);
        setWaitlistEntry(null); setCounterMode(null); setRegistrationStep('mode');
        setCustomerInfo({ name: '', phone: '' }); setPartySize(1);
        setScheduledPickupTime('');
      });
  }
})
  }
}, [urlTenantId]); 

  // =========================================================================
  // ── CONDITIONAL RENDER LAYOUTS (MUST ALWAYS GO AFTER ALL HOOK DECLARATIONS) ──
  // =========================================================================

  // 1. Fullscreen Notification Banner Overlay
if (notificationBanner) {
const isTable       = notificationBanner.type === 'table';
const isReservation = notificationBanner.type === 'reservation_confirmed';
  // Request notification permission and show browser notification
  const sendBrowserNotification = () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(
        isTable ? 'आपले टेबल तयार आहे! | Your table is ready!' : 'तुमची ऑर्डर तयार आहे! | Your order is ready!',
        {
          body: isTable
            ? `Table ${notificationBanner.tableNumber} at ${notificationBanner.restaurantName} is ready for you.`
            : `Please collect your order at ${notificationBanner.restaurantName}.`,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [300, 100, 300],
          tag: 'pratyeksha-ready',
          renotify: true
        }
      );
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') sendBrowserNotification();
      });
    }
  };
  sendBrowserNotification();

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0c0c0c',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '40px 24px', textAlign: 'center',
      fontFamily: 'Poppins, sans-serif',
      overflow: 'hidden'
    }}>

      {/* Ambient glow ring */}
      <div style={{
        position: 'absolute',
        width: '320px', height: '320px',
        borderRadius: '50%',
        background: isTable
          ? 'radial-gradient(circle, rgba(211,191,162,0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(180,160,120,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Outer ring */}
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        border: '1px solid rgba(211,191,162,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '36px', position: 'relative'
      }}>
        {/* Inner ring */}
        <div style={{
          width: '90px', height: '90px', borderRadius: '50%',
          border: '1px solid rgba(211,191,162,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(211,191,162,0.05)'
        }}>
          <div style={{ fontSize: '36px', lineHeight: 1 }}>
            {isTable ? '🪑' : '🛍️'}
          </div>
        </div>
      </div>

      {/* Marathi headline */}
      <p style={{
        fontSize: '0.58rem', fontWeight: '900', letterSpacing: '3px',
        color: 'rgba(211,191,162,0.4)', textTransform: 'uppercase',
        marginBottom: '12px', margin: '0 0 12px'
      }}>
        {notificationBanner.restaurantName?.toUpperCase()}
      </p>

      <h1 style={{
        fontSize: '1.9rem', fontWeight: '900',
        color: '#d3bfa2',
        marginBottom: '6px', lineHeight: 1.2,
        letterSpacing: '-0.5px'
      }}>
        {isTable ? 'आपले टेबल' : 'तुमची ऑर्डर'}
        <br />
        <span style={{ color: '#fff' }}>
          {isTable ? 'तयार आहे!' : 'तयार आहे!'}
        </span>
      </h1>

      <h2 style={{
        fontSize: '0.9rem', fontWeight: '500',
        color: 'rgba(255,255,255,0.3)',
        marginBottom: '40px', lineHeight: 1.5,
        letterSpacing: '0.2px'
      }}>
        {isTable ? 'Your table is ready' : 'Your order is ready for pickup'}
      </h2>

      {/* Detail card */}
      <div style={{
        background: 'rgba(211,191,162,0.05)',
        border: '1px solid rgba(211,191,162,0.12)',
        borderRadius: '20px',
        padding: '22px 32px',
        marginBottom: '36px',
        width: '100%', maxWidth: '320px'
      }}>
        <p style={{
          fontSize: '0.58rem', fontWeight: '900', letterSpacing: '2px',
          color: 'rgba(211,191,162,0.35)', textTransform: 'uppercase',
          marginBottom: '10px', margin: '0 0 10px'
        }}>
          {isTable ? 'Table Number' : 'Pickup Location'}
        </p>
        <p style={{
          fontSize: isTable ? '2.8rem' : '1.2rem',
          fontWeight: '900', color: '#d3bfa2',
          fontFamily: 'monospace', letterSpacing: isTable ? '-2px' : '0',
          margin: '0 0 6px', lineHeight: 1
        }}>
          {isTable ? `T${notificationBanner.tableNumber}` : 'Counter'}
        </p>
        <p style={{
          fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)',
          margin: 0, fontWeight: '600'
        }}>
          {isTable
            ? `टेबल नंबर ${notificationBanner.tableNumber} वर जा`
            : 'काउंटरवर येऊन ऑर्डर घ्या'}
        </p>
      </div>

      {/* CTA button */}
      <button
onClick={() => {
  const nameVal  = nameInputRef.current?.value?.trim() || customerInfo.name;
  const phoneVal = (phoneInputRef.current?.value || customerInfo.phone || '').replace(/\D/g,'');
  if (nameVal) setCustomerInfo(prev => ({ ...prev, name: nameVal }));
  if (phoneVal) setCustomerInfo(prev => ({ ...prev, phone: phoneVal }));

  const nameOk  = nameVal.length > 0;
  const phoneOk = phoneVal.length === 10;
  const resOk   = counterMode !== 'reservation' || (reservationDate && reservationTime);

  if (!nameOk || !phoneOk || !resOk) return;

  if (counterMode === 'reservation') {
    setReservationAskOrder(true); // ← show the prompt
  } else {
    setRegistrationStep('menu');
  }
}}        style={{
          width: '100%', maxWidth: '320px',
          padding: '18px 40px',
          background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
          color: '#0c0c0c', border: 'none', borderRadius: '16px',
          fontSize: '0.88rem', fontWeight: '900', cursor: 'pointer',
          letterSpacing: '1px', textTransform: 'uppercase',
          boxShadow: '0 8px 32px rgba(211,191,162,0.15)'
        }}
      >
        {isTable
          ? `Go to Table ${notificationBanner.tableNumber} →`
          : "I'm On My Way →"}
      </button>

      {/* Subtext */}
      <p style={{
        marginTop: '16px', fontSize: '0.68rem',
        color: 'rgba(255,255,255,0.15)', fontWeight: '600',
        letterSpacing: '0.3px'
      }}>
        {isTable
          ? 'Your pre-order is already in the kitchen'
          : 'Please proceed to the counter'}
      </p>

    </div>
  );
}

  
  // 2. Counter Screen Flow Router Check
  const convertToMrNumber = (number) => {
    if (language === 'en') return number;
    const mrDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return number.toString().split('').map(d => isNaN(d) ? d : mrDigits[d]).join('');
  };

  const triggerAlert = (msgKey, type = 'success') => {
    setAlert({ show: true, msg: t[language][msgKey] || msgKey, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: 'success' }), 4000);
  };

  const isOnlyVegTenant = restaurantData?.config?.onlyVeg === true;

useEffect(() => {
  if (isOnlyVegTenant) {
    setFilterVegOnly(true);
    return;
  }
  if (!filterVegOnly) {
    const hasNonVegInCategory = allMenuItems.some(i => {
      const matchesCategory = selectedCategoryId === 'all' || i.categoryId === selectedCategoryId;
      return matchesCategory && i.isVeg !== true && i.isAvailable !== false;
    });
    if (!hasNonVegInCategory) {
      setFilterVegOnly(true);
    }
  }
}, [selectedCategoryId, allMenuItems, isOnlyVegTenant]);

// 🚀 UNIFIED ENGINE: HANDLES INITIAL HTTP REST CONTENT LOADS & LIVE REAL-TIME SOCKET BROADCASTS
  useEffect(() => {
    if (!tenantId) return;

    // 1. PHASE A: EXECUTE INITIAL REST DATA FETCH ON MOUNT
const fetchMenuContent = async () => {
  try {
    const [res, cat, menu, extras] = await Promise.all([
      axios.get(`${BASE_URL}/tenant/${tenantId}`),
      axios.get(`${BASE_URL}/categories/${tenantId}`),
      axios.get(`${BASE_URL}/menu/${tenantId}`),
      axios.get(`${BASE_URL}/extra-items/${tenantId}`).catch(() => ({ data: [] }))  // ← ADD THIS
    ]);
    setRestaurantData(res.data);
    setCategoryList(cat.data);
    setAllMenuItems(menu.data);
    setExtraItems(extras.data || []);  // ← ADD THIS
  } catch (error) {
    console.error("Initial Setup Sync Error:", error);
  } finally {
    setIsLoading(false);
  }
};
    fetchMenuContent();

    // 2. PHASE B: SPIN UP LONG-LIVED WEB SOCKET CHANNELS FOR LIVE DATA SYNCING
    const socket = io("https://pratyeksha-backend.onrender.com");
    
    // Join the unique restaurant multi-tenant data stream room footprint
    socket.emit("join_restaurant", tenantId);

    // Watch for immediate operator modifications (Visibility / Pricing shifts)
    socket.on("menu_updated", (updatedItem) => {
      if (updatedItem && updatedItem.tenantId === tenantId) {
        setAllMenuItems((prevItems) =>
          prevItems.map((item) =>
            item._id === updatedItem._id ? { ...item, ...updatedItem } : item
          )
        );
      }
  
    });

    // ── Live order status updates for customer ──
socket.on("order_status_updated", (data) => {
  if (data.tableNumber?.toString() === tableNumber?.toString()) {
    setLiveOrderStatuses(prev => ({ ...prev, [data.orderId]: data.status }));
    if (data.status === 'ready') {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      triggerAlert('🍽️ Your order is ready! Please collect.', 'success');
    }
  }
});

    // 3. PHASE C: LIFECYCLE DESTRUCTION CLEANUP
    return () => {
      socket.off("menu_updated");
      socket.disconnect();
    };
  }, [tenantId, language]);

  const handleSwipe = (direction) => {
    const categories = ['all', ...categoryList.map(c => c.categoryId)];
    const currentIndex = categories.indexOf(selectedCategoryId);
    if (direction === 'left' && currentIndex < categories.length - 1) setSelectedCategoryId(categories[currentIndex + 1]);
    else if (direction === 'right' && currentIndex > 0) setSelectedCategoryId(categories[currentIndex - 1]);
  };

const sendExtraItemsRequest = async () => {
  const activeItems = Object.entries(extraItemCart).filter(([, qty]) => qty > 0);
  if (activeItems.length === 0) return;

  const requestText = activeItems.map(([id, qty]) => {
    const item = extraItems.find(i => i._id === id);
    return `${item?.name} x${qty}`;
  }).join(', ');

  // Build line items for bill tracking
  const extraLineItems = activeItems.map(([id, qty]) => {
    const item = extraItems.find(i => i._id === id);
    return {
      menuItemId:   null,
      extraItemId:  id,
      name:         item?.name || '',
      quantity:     qty,
      portion:      'Single',
      pricePerUnit: item?.price || 0,
      subtotal:     (item?.price || 0) * qty,
      isExtraItem:  true,
      category:     item?.category || 'Extra'
    };
  });

  try {
    await axios.post(`${BASE_URL}/waiter-requests`, {
      tenantId,
      tableNumber,
      serviceRequest: `EXTRA ITEMS: ${requestText}`
    });

    // ── ADD TO placedOrders so it appears in bill ──
    setPlacedOrders(prev => [...prev, ...extraLineItems]);

    triggerAlert('waiterSuccess');
    setExtraItemCart({});
    setIsExtraItemsOpen(false);
  } catch {
    triggerAlert('orderError', 'error');
  }
};

const notifyWaiter = async (serviceType = "Custom") => {
  try {
    let requestText = serviceType;

    if (serviceType === "Custom") {
      const activeCounts = Object.entries(waiterCounts).filter(([_, count]) => count > 0);
      
      if (activeCounts.length === 0) return; 

      // This creates the string: "Spoons: 2, Water Bottle: 1"
      requestText = activeCounts
        .map(([item, count]) => `${t[language][item] || item}: ${count}`)
        .join(", ");
    }

    const payload = { 
      tenantId: tenantId, 
      tableNumber: tableNumber, 
      serviceRequest: requestText // 🚀 FIXED: Must match backend schema key 'serviceRequest'
    };

    // Use BASE_URL from your file
    await axios.post(`${BASE_URL}/waiter-requests`, payload);
    
    triggerAlert("waiterSuccess");
    setIsWaiterModalOpen(false);
    
    // Reset counts (Tissue removed as per your request)
    setWaiterCounts({ spoon: 0, fork: 0, plates: 0, water: 0 });
  } catch (error) { 
    console.error("Waiter Request Error:", error.response?.data || error.message);
    triggerAlert("orderError", "error"); 
  }
};
  const updateWaiterCount = (item, delta) => {
    setWaiterCounts(prev => ({ ...prev, [item]: Math.max(0, prev[item] + delta) }));
  };

  const primaryColor = '#d3bfa2'; 
  const secondaryColor = '#1a1a1a'; 
  const cardBg = 'rgba(211, 191, 162, 0.08)';
  const borderColor = 'rgba(211, 191, 162, 0.2)';

  const addToCart = (item, portion) => {
    const cartKey = portion === 'Single' ? item._id : `${item._id}-${portion}`;
    setCart(prev => ({ ...prev, [cartKey]: (prev[cartKey] || 0) + 1 }));
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[cartKey] > 1) newCart[cartKey] -= 1;
      else { 
        delete newCart[cartKey]; 
        const newSuggestions = {...suggestions};
        delete newSuggestions[cartKey];
        setSuggestions(newSuggestions);
      }
      return newCart;
    });
  };

  const totalItemsInCart = Object.values(cart).reduce((a, b) => a + b, 0);

  const getCartTotal = () => {
    return Object.entries(cart).reduce((acc, [key, qty]) => {
      const isMulti = key.includes('-');
      const id = isMulti ? key.split('-')[0] : key;
      const portion = isMulti ? key.split('-')[1] : 'Single';
      const item = allMenuItems.find(i => i._id === id);
      const price = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
      return acc + (price || 0) * qty;
    }, 0);
  };
useEffect(() => {
  // Only for table scans — not counter mode
  if (!tenantId || tableNumber === 'Counter' || isCounterScan) return;
  if (welcomeDismissed) return;

  const savedPhone = localStorage.getItem(`pratyeksha_phone_${tenantId}`);

  if (savedPhone && savedPhone.length === 10) {
    // Auto-recognize silently — no prompt needed
    setWelcomeLoading(true);
    axios.get(`${BASE_URL}/customers/recognize/${tenantId}/${savedPhone}`)
      .then(r => {
        if (r.data?.found) {
          setWelcomeCard(r.data);
          setWelcomePhone(savedPhone);
        } else {
          // Phone saved but customer not in DB — show input after delay
          const timer = setTimeout(() => setShowPhonePrompt(true), 1800);
          return () => clearTimeout(timer);
        }
      })
      .catch(() => {
        const timer = setTimeout(() => setShowPhonePrompt(true), 1800);
        return () => clearTimeout(timer);
      })
      .finally(() => setWelcomeLoading(false));
  } else {
    // No saved phone — show prompt after brief delay so menu loads first
    const timer = setTimeout(() => setShowPhonePrompt(true), 1500);
    return () => clearTimeout(timer);
  }
}, [tenantId, tableNumber, isCounterScan, welcomeDismissed]);


  
const sendBatchToKitchen = async () => {
    try {
      // 🚀 AGGREGATE CART ITEMS: Group by ID and Portion
      const summary = {};
      Object.entries(cart).forEach(([key, qty]) => {
        const isMulti = key.includes('-');
        const id = isMulti ? key.split('-')[0] : key;
        const portion = isMulti ? key.split('-')[1] : 'Single';
        const item = allMenuItems.find(i => i._id === id);
        
        const summaryKey = `${id}-${portion}`;
        if (!summary[summaryKey]) {
          const unitPrice = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
          summary[summaryKey] = { 
            menuItemId: item._id, 
            name: item.name, 
            name_mr: item.name_mr,
            quantity: 0, 
            portion: portion, 
            pricePerUnit: unitPrice, 
            subtotal: 0,
            suggestion: suggestions[key] || "",
            isVeg: item.isVeg !== false   // ← ADD THIS
          };
        }
        summary[summaryKey].quantity += qty;
        summary[summaryKey].subtotal = summary[summaryKey].quantity * summary[summaryKey].pricePerUnit;
      });

      const orderItems = Object.values(summary);
      const total = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
      
      const payload = { 
        tenantId, 
        tableNumber, 
        items: orderItems, 
        billDetails: { itemsTotal: total, taxAmount: total * 0.05, grandTotal: total * 1.05 }, 
        status: "pending", 
        paymentStatus: "unpaid", 
        createdAt: new Date().toISOString() 
      };

const orderRes = await axios.post(`${BASE_URL}/orders`, payload);
// ── Track this order for live status ──
if (orderRes.data?._id) {
  setLiveOrderStatuses(prev => ({ ...prev, [orderRes.data._id]: 'pending' }));
}      
      // Update placedOrders with the aggregated view for the receipt
      setPlacedOrders(prev => [...prev, ...orderItems]); 
      triggerAlert("orderSuccess");
      setHasPlacedInitialOrder(true);
      setCart({}); 
      setSuggestions({}); 
      setIsDrawerOpen(false);
    } catch (error) { 
      console.error(error);
      triggerAlert("orderError", "error"); 
    }
  };

  const placeWaitlistOrder = async () => {
  if (!customerInfo.name.trim()) return;
  const summary = {};
  Object.entries(cart).forEach(([key, qty]) => {
    const isMulti = key.includes('-');
    const id = isMulti ? key.split('-')[0] : key;
    const portion = isMulti ? key.split('-')[1] : 'Single';
    const item = allMenuItems.find(i => i._id === id);
    const summaryKey = `${id}-${portion}`;
    if (!summary[summaryKey]) {
      const unitPrice = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
      summary[summaryKey] = { menuItemId: item._id, name: item.name, quantity: 0, portion, pricePerUnit: unitPrice, subtotal: 0, price: unitPrice };
    }
    summary[summaryKey].quantity += qty;
    summary[summaryKey].subtotal = summary[summaryKey].quantity * summary[summaryKey].pricePerUnit;
  });

  const orderItems = Object.values(summary);
  const total = orderItems.reduce((a, i) => a + i.subtotal, 0);

  try {
const res = await axios.post(`${BASE_URL}/waitlist/${tenantId}`, {
  sessionId,
  customerName: customerInfo.name,
  customerPhone: customerInfo.phone?.replace(/\D/g, '') || '',
  partySize,
  mode: counterMode,
  items: orderItems,
  totalAmount: total,
  scheduledPickupTime: scheduledPickupTime || null,
  specialRequests: specialRequests || ''
});
    setWaitlistEntry(res.data.entry);
    setCart({}); setSuggestions({});
    setRegistrationStep('confirm');
    setIsDrawerOpen(false);
    triggerAlert('orderSuccess');

    // ── Request push notification permission after order placed ──
const askNotificationPermission = async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification(
        counterMode === 'dine-in'
          ? '✓ You\'re in the queue!'
          : '✓ Pickup order placed!',
        {
          body: counterMode === 'dine-in'
            ? `Hi ${customerInfo.name}! We'll notify you when your table is ready.`
            : `Hi ${customerInfo.name}! We'll notify you when your order is ready for pickup.`,
          icon: '/logo.png',
          badge: '/logo.png',
        }
      );
    }
  } else if (Notification.permission === 'granted') {
    new Notification(
      counterMode === 'dine-in' ? '✓ Queue confirmed!' : '✓ Pickup confirmed!',
      {
        body: counterMode === 'dine-in'
          ? `Hi ${customerInfo.name}! You're in the queue.`
          : `Order placed for pickup at ${new Date(scheduledPickupTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true})}.`,
        icon: '/logo.png',
      }
    );
  }
};
askNotificationPermission();




    // Subscribe to push after order placed
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const keyRes = await axios.get(`${BASE_URL}/waitlist/vapid-public-key`);
        const vapidKey = keyRes.data?.publicKey;
        if (vapidKey) {
          const reg = await navigator.serviceWorker.register('/sw.js');
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            function urlBase64ToUint8Array(b) {
              const pad = '='.repeat((4 - b.length % 4) % 4);
              const base64 = (b + pad).replace(/-/g, '+').replace(/_/g, '/');
              const raw = window.atob(base64);
              const arr = new Uint8Array(raw.length);
              for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
              return arr;
            }
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
            await axios.patch(`${BASE_URL}/waitlist/session/${tenantId}/${sessionId}/push-subscription`, { subscription: sub.toJSON(), pageUrl: window.location.href });
          }
        }
      } catch (e) { console.warn('Push subscription failed:', e); }
    }
  } catch (err) {
    console.error(err);
    triggerAlert('orderError', 'error');
  }
};

const placeReservation = async () => {
if (!customerInfo.name.trim() || !customerInfo.phone || !reservationDate || !reservationTime) return;
  
  // If reservation already placed, just go to confirm
  if (waitlistEntry?._id && waitlistEntry?.mode === 'reservation') {
    setRegistrationStep('confirm');
    setIsDrawerOpen(false);
    return;
  }
  const summary = {};
  Object.entries(cart).forEach(([key, qty]) => {
    const isMulti = key.includes('-');
    const id = isMulti ? key.split('-')[0] : key;
    const portion = isMulti ? key.split('-')[1] : 'Single';
    const item = allMenuItems.find(i => i._id === id);
    const summaryKey = `${id}-${portion}`;
    if (!summary[summaryKey]) {
      const unitPrice = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
      summary[summaryKey] = { menuItemId: item._id, name: item.name, quantity: 0, portion, pricePerUnit: unitPrice, subtotal: 0, price: unitPrice };
    }
    summary[summaryKey].quantity += qty;
    summary[summaryKey].subtotal = summary[summaryKey].quantity * summary[summaryKey].pricePerUnit;
  });

  const orderItems = Object.values(summary);
  const total = orderItems.reduce((a, i) => a + i.subtotal, 0);

  // Build ISO datetime from date + time
  const [hours, minutes] = reservationTime.split(':').map(Number);
  const resDateTime = new Date(reservationDate);
  resDateTime.setHours(hours, minutes, 0, 0);

  try {
const res = await axios.post(`${BASE_URL}/reservations/${tenantId}`, {
  sessionId,
  customerName: customerInfo.name,
  customerPhone: customerInfo.phone?.replace(/\D/g, '') || '',
  partySize,
  reservationTime: resDateTime.toISOString(),
  tablePreference,
  specialRequests,
  items: orderItems,
  totalAmount: total,
  status: 'pending'
});

    setWaitlistEntry(res.data.reservation);
    setCart({}); setSuggestions({});
    setRegistrationStep('confirm');
    // ── Notification for reservation ──
const askResNotification = async () => {
  if (!('Notification' in window)) return;
  const perm = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;
  if (perm === 'granted') {
    new Notification('📅 Reservation Requested!', {
      body: `Hi ${customerInfo.name}! Your table for ${partySize} on ${new Date(resDateTime).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} at ${new Date(resDateTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true})} is pending confirmation.`,
      icon: '/logo.png',
    });
  }
};
askResNotification();
    setIsDrawerOpen(false);
    triggerAlert('orderSuccess');
  } catch (err) {
    console.error(err);
    triggerAlert('orderError', 'error');
  }
};

  const calculateGrandTotal = () => {
    const subtotal = placedOrders.reduce((sum, item) => sum + item.subtotal, 0);
    return subtotal; // Assuming direct sum for simplicity as per UI requirement
  };

// 📊 UNIFIED RECEIPT AGGREGATOR
  const receiptData = useMemo(() => {
    if (placedOrders.length === 0) return null;
    
    // Group by ID + Portion to match the onscreen summary
    const map = {};
    placedOrders.forEach(item => {
const key = item.isExtraItem
        ? `extra-${item.extraItemId || item.name}-${item.portion}`
        : `${item.menuItemId}-${item.portion}`;      if (!map[key]) {
        map[key] = { ...item };
      } else {
        map[key].quantity += item.quantity;
        map[key].subtotal += item.subtotal;
      }
    });

    const items = Object.values(map);
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      items,
      total,
      billNo: placedOrders[0]?.billNo || '001',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  }, [placedOrders]);
  
  // 📊 COMPUTED AGGREGATE: Group placed items for the final receipt view
const finalBillItems = useMemo(() => {
    const map = {};
    placedOrders.forEach(item => {
      // Extra items use their own ID as key to prevent merging
      const key = item.isExtraItem
        ? `extra-${item.extraItemId || item.name}-${item.portion}`
        : `${item.menuItemId}-${item.portion}`;
      if (!map[key]) {
        map[key] = { ...item };
      } else {
        map[key].quantity += item.quantity;
        map[key].subtotal += item.subtotal;
      }
    });
    return Object.values(map);
  }, [placedOrders]);

  // Add this useEffect to ask notification permission early, before order is placed
useEffect(() => {
  if (!isCounterScan) return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    // Small delay so page feels settled before asking
    const t = setTimeout(() => {
      Notification.requestPermission();
    }, 2500);
    return () => clearTimeout(t);
  }
}, [isCounterScan]);

const requestFinalBill = async () => {
  if (!customerInfo.name || !customerInfo.phone) { triggerAlert("detailsReq", "error"); return; }
  try {
    const socket = io("https://pratyeksha-backend.onrender.com");
    socket.emit("request_bill", { tenantId, tableNumber, name: customerInfo.name });
    await axios.post(`${BASE_URL}/customers`, {
      tenantId, name: customerInfo.name, phone: customerInfo.phone,
      lastVisit: new Date().toISOString()
    });
    // ── Clear stored bill on checkout ──
sessionStorage.removeItem(`pratyeksha_placed_${tenantId}_${sessionId}`);
    setBillRequested(true);
  } catch (error) {
sessionStorage.removeItem(`pratyeksha_placed_${tenantId}_${sessionId}`);
    setBillRequested(true);
  }
};

  const hasNonVegInView = useMemo(() => {
    if (isOnlyVegTenant) return false;
    return allMenuItems.some(i => i.isVeg !== true && i.isAvailable !== false);
  }, [allMenuItems, isOnlyVegTenant]);



const reservationValid = counterMode !== 'reservation' || (reservationDate && reservationTime);
const ctaEnabled = customerInfo.name.trim() && reservationValid;


// ── Persist cart to localStorage so it survives browser close ──
useEffect(() => {
  if (Object.keys(cart).length > 0) {
    localStorage.setItem(`pratyeksha_cart_${tenantId}`, JSON.stringify(cart));
  } else {
    localStorage.removeItem(`pratyeksha_cart_${tenantId}`);
  }
}, [cart, tenantId]);

// ── Persist placedOrders to sessionStorage (survives refresh, cleared on tab close) ──
useEffect(() => {
  if (!tenantId) return;
  const key = `pratyeksha_placed_${tenantId}_${sessionId}`;
  if (placedOrders.length > 0) {
    sessionStorage.setItem(key, JSON.stringify(placedOrders));
  } else {
    sessionStorage.removeItem(key);
  }
}, [placedOrders, tenantId, sessionId]);

// ── Restore placedOrders on mount (after refresh, same session) ──
useEffect(() => {
  if (!tenantId || !sessionId) return;
  const key = `pratyeksha_placed_${tenantId}_${sessionId}`;
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setPlacedOrders(parsed);
        setHasPlacedInitialOrder(true);
      }
    }
  } catch { /* ignore */ }
}, [tenantId, sessionId]);
// REPLACE with:
// ── COUNTER SCAN FLOW — early return (all hooks already declared above) ──
if (isCounterScan && registrationStep !== 'menu') {

const Shell = ({ children, centered = true }) => (
  <div style={{
    minHeight: '100vh',
    height: '100vh',           // ← lock to viewport height
    overflowY: 'auto',         // ← THIS is what enables scroll
    WebkitOverflowScrolling: 'touch', // ← iOS momentum scroll
    background: '#0e0e0e', color: '#fff',
    fontFamily: 'Poppins, sans-serif',
    display: 'flex', flexDirection: 'column',
    alignItems: centered ? 'center' : 'stretch',
    justifyContent: centered ? 'flex-start' : 'flex-start', // ← never 'center' (breaks scroll)
    padding: centered ? '48px 24px' : '0',
    boxSizing: 'border-box',
  }}>
    {children}
  </div>
);
  const RestaurantBadge = () => (
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '16px',
        background: 'rgba(211,191,162,0.07)',
        border: '1px solid rgba(211,191,162,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 0 0 8px rgba(211,191,162,0.03)'
      }}>
        <UtensilsCrossed size={22} color="#d3bfa2" strokeWidth={1.5} />
      </div>
      <h1 style={{
        fontSize: '1.35rem', fontWeight: '900', color: '#d3bfa2',
        margin: '0 0 6px', letterSpacing: '-0.4px'
      }}>
        {restaurantData?.name || 'PRATYEKSHA'}
      </h1>
      <div style={{
        fontSize: '0.52rem', letterSpacing: '3.5px',
        color: 'rgba(211,191,162,0.2)', textTransform: 'uppercase', fontWeight: '800'
      }}>
        POWERED BY PRATYEKSHA
      </div>
    </div>
  );

// ══════════════════════════════════════════
  // SCREEN: CONFIRM
  // ══════════════════════════════════════════
  if (registrationStep === 'confirm' && waitlistEntry) {
    const isDineIn = waitlistEntry.mode === 'dine-in';
    const hasItems = waitlistEntry.items?.length > 0;
    const estWait  = waitlistEntry.waitlistPosition * 20;

    return (
      <Shell centered={false}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(14,14,14,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: '0.52rem', fontWeight: '900',
            letterSpacing: '2.5px', textTransform: 'uppercase',
            color: 'rgba(211,191,162,0.3)'
          }}>
            {restaurantData?.name}
          </span>
          {/* CODE 1 — mode badge */}
          <span style={{
            fontSize: '0.52rem', fontWeight: '900', letterSpacing: '1.5px',
            padding: '5px 12px', borderRadius: '20px',
            background: 'rgba(211,191,162,0.05)',
            border: '1px solid rgba(211,191,162,0.1)',
            color: 'rgba(211,191,162,0.4)',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
          }}>
            {waitlistEntry?.mode === 'dine-in'
              ? <><Armchair size={11} color="rgba(211,191,162,0.4)" /> {language === 'mr' ? 'वेटलिस्ट' : 'WAITLIST'}</>
              : waitlistEntry?.mode === 'reservation'
              ? <><CalendarClock size={11} color="rgba(211,191,162,0.4)" /> {language === 'mr' ? 'बुकिंग' : 'RESERVATION'}</>
              : <><ShoppingBag size={11} color="rgba(211,191,162,0.4)" /> {language === 'mr' ? 'पिकअप' : 'PICKUP'}</>
            }
          </span>
        </div>

        <div style={{ padding: '36px 24px 80px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>

          {/* Icon + heading */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(211,191,162,0.06)',
            border: '1px solid rgba(211,191,162,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '22px'
          }}>
            <CheckCircle2 size={24} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />
          </div>

          <h1 style={{
            fontSize: '1.7rem', fontWeight: '900', color: '#fff',
            marginBottom: '8px', letterSpacing: '-0.6px', lineHeight: 1.15
          }}>
            {language === 'mr' ? "तुम्ही\nरांगेत आहात!" : "You're\nAll Set!"}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.22)', fontSize: '0.78rem',
            marginBottom: '32px', fontWeight: '500', lineHeight: 1.7
          }}>
            {language === 'mr'
              ? 'तुमची माहिती यशस्वीरित्या नोंदवली गेली आहे.'
              : 'Your details are confirmed. Relax — we\'ll handle the rest.'}
          </p>

          {/* STATUS CARD */}
          <div style={{
            background: '#121212',
            border: '1px solid rgba(211,191,162,0.09)',
            borderRadius: '22px', padding: '30px 24px',
            marginBottom: '12px', textAlign: 'center',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.25), transparent)'
            }} />

            {isDineIn ? (
              <>
                <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.25)', textTransform: 'uppercase', marginBottom: '16px' }}>
                  {language === 'mr' ? 'रांगेतील स्थान' : 'Queue Position'}
                </p>
                <div style={{ fontSize: '5.5rem', fontWeight: '900', color: '#d3bfa2', lineHeight: 1, fontFamily: 'monospace', marginBottom: '18px', letterSpacing: '-6px' }}>
                  #{waitlistEntry.waitlistPosition}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '30px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)' }}>
                  <Hourglass size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
                    {language === 'mr' ? `अंदाजे ~${estWait} मिनिटे` : `~${estWait} min estimated`}
                  </span>
                </div>
              </>
            ) : waitlistEntry.mode === 'reservation' ? (
              <>
                <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.25)', textTransform: 'uppercase', marginBottom: '16px' }}>
                  {language === 'mr' ? 'बुकिंग वेळ' : 'Reservation'}
                </p>
                <div style={{ fontSize: '3rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', letterSpacing: '-2px', marginBottom: '8px', lineHeight: 1 }}>
                  {new Date(waitlistEntry.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '10px' }}>
                  {new Date(waitlistEntry.reservationTime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 16px', borderRadius: '20px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)' }}>
                  <Users size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
                    {waitlistEntry.partySize} {language === 'mr' ? 'जण' : 'guests'}
                  </span>
                </div>
                {waitlistEntry.specialRequests && (
                  <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                    "{waitlistEntry.specialRequests}"
                  </div>
                )}
                <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', background: waitlistEntry.status === 'confirmed' ? 'rgba(211,191,162,0.08)' : 'rgba(138,112,77,0.08)', border: `1px solid ${waitlistEntry.status === 'confirmed' ? 'rgba(211,191,162,0.2)' : 'rgba(138,112,77,0.2)'}` }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: '900', color: waitlistEntry.status === 'confirmed' ? '#d3bfa2' : '#8a704d', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {waitlistEntry.status === 'confirmed' ? '✓ CONFIRMED' : '⏳ PENDING CONFIRMATION'}
                  </span>
                </div>
              </>
            ) : waitlistEntry.scheduledPickupTime ? (
              <>
                <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.25)', textTransform: 'uppercase', marginBottom: '16px' }}>
                  {language === 'mr' ? 'पिकअप वेळ' : 'Pickup Time'}
                </p>
                <div style={{ fontSize: '3.8rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', letterSpacing: '-2px', marginBottom: '10px', lineHeight: 1 }}>
                  {new Date(waitlistEntry.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.18)', fontWeight: '600' }}>
                  {language === 'mr' ? 'ठरलेली वेळ' : 'Your scheduled slot'}
                </p>
              </>
            ) : null}
          </div>

          {/* Confirmation receipt card */}
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.1)', borderRadius: '18px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ padding: '14px 18px', background: 'rgba(211,191,162,0.04)', borderBottom: '1px solid rgba(211,191,162,0.07)', display: 'flex', alignItems: 'center', gap: '9px' }}>
              <CheckCircle2 size={13} color="rgba(211,191,162,0.5)" strokeWidth={2} />
              <span style={{ fontSize: '0.52rem', fontWeight: '900', color: 'rgba(211,191,162,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {language === 'mr' ? 'पुष्टी तपशील' : 'Confirmation Details'}
              </span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: language === 'mr' ? 'नाव' : 'NAME', val: waitlistEntry.customerName, color: '#d3bfa2' },
                waitlistEntry.customerPhone && { label: language === 'mr' ? 'मोबाईल' : 'MOBILE', val: `+91 ${waitlistEntry.customerPhone}`, color: 'rgba(255,255,255,0.4)', mono: true },
                { label: language === 'mr' ? 'प्रकार' : 'TYPE', val: waitlistEntry.mode === 'dine-in' ? 'DINE-IN WAITLIST' : waitlistEntry.mode === 'reservation' ? 'RESERVATION' : 'PICKUP', badge: true },
                waitlistEntry.partySize > 1 && { label: language === 'mr' ? 'जण' : 'GUESTS', val: waitlistEntry.partySize, color: 'rgba(255,255,255,0.4)' },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.5px' }}>{row.label}</span>
                  {row.badge
                    ? <span style={{ fontSize: '0.6rem', fontWeight: '900', padding: '3px 10px', borderRadius: '20px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.12)', color: '#8a704d' }}>{row.val}</span>
                    : <span style={{ fontSize: '0.78rem', fontWeight: row.mono ? '700' : '800', color: row.color, fontFamily: row.mono ? 'monospace' : 'inherit' }}>{row.val}</span>
                  }
                </div>
              ))}
              {(waitlistEntry.specialRequests || waitlistEntry.tablePreference) && (
                <div style={{ marginTop: '4px', padding: '10px 12px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '10px' }}>
                  {waitlistEntry.tablePreference && <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginBottom: waitlistEntry.specialRequests ? '5px' : '0' }}><span style={{ color: 'rgba(211,191,162,0.3)', fontWeight: '700' }}>{language === 'mr' ? 'टेबल: ' : 'Pref: '}</span>{waitlistEntry.tablePreference}</div>}
                  {waitlistEntry.specialRequests && <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>"{waitlistEntry.specialRequests}"</div>}
                </div>
              )}
            </div>
          </div>

          {/* Notification pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', marginBottom: '12px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BellRing size={14} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />
            </div>
            <p style={{ margin: 0, fontSize: '0.71rem', color: 'rgba(255,255,255,0.22)', lineHeight: 1.65, fontWeight: '500' }}>
              {language === 'mr' ? 'टेबल / ऑर्डर तयार झाल्यावर सूचना मिळेल — पेज बंद केले तरीही.' : "You'll be notified when ready — even if you close this page."}
            </p>
          </div>

          {/* Pre-order summary */}
          {hasItems && (
            <div style={{ background: '#0c0c0c', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
              <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '2.5px', color: 'rgba(211,191,162,0.22)', textTransform: 'uppercase', marginBottom: '16px' }}>
                {language === 'mr' ? 'प्री-ऑर्डर' : 'Pre-Order'}
              </p>
              {waitlistEntry.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < waitlistEntry.items.length - 1 ? '12px' : '0', marginBottom: i < waitlistEntry.items.length - 1 ? '12px' : '0', borderBottom: i < waitlistEntry.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: '900', fontFamily: 'monospace', color: 'rgba(211,191,162,0.25)', minWidth: '18px' }}>×{item.quantity}</span>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#d3bfa2', fontWeight: '800', fontFamily: 'monospace' }}>₹{item.subtotal}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', marginTop: '8px', borderTop: '1px solid rgba(211,191,162,0.07)' }}>
                <span style={{ fontSize: '0.58rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Total</span>
                <span style={{ fontSize: '1rem', color: '#d3bfa2', fontWeight: '900', fontFamily: 'monospace' }}>₹{waitlistEntry.totalAmount}</span>
              </div>
            </div>
          )}

          {/* ── ORDER CONFIRMATION RECEIPT ── */}
<div style={{
  background: '#0a0a0a',
  border: '1px solid rgba(211,191,162,0.1)',
  borderRadius: '18px',
  overflow: 'hidden',
  marginBottom: '12px'
}}>
  {/* Receipt header */}
  <div style={{
    padding: '14px 18px',
    background: 'rgba(211,191,162,0.04)',
    borderBottom: '1px solid rgba(211,191,162,0.07)',
    display: 'flex', alignItems: 'center', gap: '9px'
  }}>
    <CheckCircle2 size={13} color="rgba(211,191,162,0.5)" strokeWidth={2} />
    <span style={{
      fontSize: '0.52rem', fontWeight: '900', color: 'rgba(211,191,162,0.4)',
      letterSpacing: '2px', textTransform: 'uppercase'
    }}>
      {language === 'mr' ? 'पुष्टी तपशील' : 'Confirmation Details'}
    </span>
  </div>

  {/* Receipt body */}
  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

    {/* Name */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.5px' }}>
        {language === 'mr' ? 'नाव' : 'NAME'}
      </span>
      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#d3bfa2' }}>
        {waitlistEntry.customerName}
      </span>
    </div>

    {/* Phone */}
    {waitlistEntry.customerPhone && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.5px' }}>
          {language === 'mr' ? 'मोबाईल' : 'MOBILE'}
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
          +91 {waitlistEntry.customerPhone}
        </span>
      </div>
    )}

    {/* Mode */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.5px' }}>
        {language === 'mr' ? 'प्रकार' : 'TYPE'}
      </span>
      <span style={{
        fontSize: '0.6rem', fontWeight: '900', padding: '3px 10px',
        borderRadius: '20px', letterSpacing: '0.5px',
        background: 'rgba(211,191,162,0.06)',
        border: '1px solid rgba(211,191,162,0.12)',
        color: '#8a704d'
      }}>
        {waitlistEntry.mode === 'dine-in' ? 'DINE-IN WAITLIST'
          : waitlistEntry.mode === 'reservation' ? 'RESERVATION'
          : 'PICKUP'}
      </span>
    </div>

    {/* Party size */}
    {waitlistEntry.partySize > 1 && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.5px' }}>
          {language === 'mr' ? 'जण' : 'GUESTS'}
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'rgba(255,255,255,0.4)' }}>
          {waitlistEntry.partySize}
        </span>
      </div>
    )}

    {/* Pickup time (pickup only) */}
    {waitlistEntry.mode === 'pickup' && waitlistEntry.scheduledPickupTime && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.5px' }}>
          {language === 'mr' ? 'पिकअप वेळ' : 'PICKUP TIME'}
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#d3bfa2', fontFamily: 'monospace' }}>
          {new Date(waitlistEntry.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      </div>
    )}

    {/* Reservation time */}
{waitlistEntry?.mode === 'reservation' && (() => {
  const resTime  = waitlistEntry.reservationTime ? new Date(waitlistEntry.reservationTime) : null;
  const hasItems = waitlistEntry.items?.length > 0;
  const isConf   = waitlistEntry.status === 'confirmed';
 
  // ── booking token (short ID from _id last 6 chars) ──
  const tokenId  = waitlistEntry._id?.slice(-6)?.toUpperCase() || 'XXXXXX';
 
  // ── PDF generator ──
  const downloadReservationPDF = () => {
    import('html2pdf.js').then(html2pdf => {
      const el = document.getElementById('reservation-pdf-frame');
      if (!el) return;
      html2pdf.default().set({
        margin: [0,0,0,0],
        filename: `Reservation_${tokenId}_${restaurantData?.name?.replace(/\s+/g,'_') || 'Pratyeksha'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, backgroundColor: '#ffffff', useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
      }).from(el).save();
    });
  };
 
  return (
    <div style={{ padding: '28px 22px 100px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
 
      {/* ── STATUS ICON ── */}
      <div style={{
        width: '58px', height: '58px', borderRadius: '18px',
        background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
      }}>
        <CalendarClock size={26} color="rgba(211,191,162,0.8)" strokeWidth={1.5} />
      </div>
 
      {/* ── HEADLINE ── */}
      <h1 style={{ fontSize: '1.65rem', fontWeight: '900', color: '#fff', marginBottom: '6px', letterSpacing: '-0.6px', lineHeight: 1.15 }}>
        {language === 'mr' ? 'बुकिंग\nझाली आहे!' : 'Table\nReserved!'}
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.76rem', marginBottom: '24px', fontWeight: '500', lineHeight: 1.7 }}>
        {language === 'mr' ? 'रेस्टॉरंट लवकरच कन्फर्म करेल.' : "We've received your request. The restaurant will confirm shortly."}
      </p>
 
      {/* ── STATUS + TOKEN CARD ── */}
      <div style={{
        background: '#111', border: '1px solid rgba(211,191,162,0.1)',
        borderRadius: '20px', overflow: 'hidden', marginBottom: '12px',
        position: 'relative'
      }}>
        {/* Top shimmer */}
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.3), transparent)' }} />
 
        <div style={{ padding: '24px', textAlign: 'center' }}>
          {/* Token */}
          <div style={{ fontSize: '0.48rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.25)', textTransform: 'uppercase', marginBottom: '10px' }}>
            {language === 'mr' ? 'बुकिंग टोकन' : 'Booking Token'}
          </div>
          <div style={{ fontSize: '2.6rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', letterSpacing: '6px', lineHeight: 1, marginBottom: '14px' }}>
            #{tokenId}
          </div>
 
          {/* Status pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 16px', borderRadius: '20px',
            background: isConf ? 'rgba(211,191,162,0.1)' : 'rgba(138,112,77,0.08)',
            border: `1px solid ${isConf ? 'rgba(211,191,162,0.25)' : 'rgba(138,112,77,0.18)'}`,
            marginBottom: '20px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConf ? '#d3bfa2' : '#8a704d', flexShrink: 0 }} />
            <span style={{ fontSize: '0.58rem', fontWeight: '900', color: isConf ? '#d3bfa2' : '#8a704d', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {isConf ? (language === 'mr' ? 'कन्फर्म झाले' : 'CONFIRMED') : (language === 'mr' ? 'पेंडिंग' : 'PENDING CONFIRMATION')}
            </span>
          </div>
 
          {/* Date/time/guests row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', flexWrap: 'wrap' }}>
            {resTime && [
              { icon: <CalendarClock size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />, val: resTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
              { icon: <Clock3 size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />, val: resTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) },
              { icon: <Users size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />, val: `${waitlistEntry.partySize} ${language === 'mr' ? 'जण' : 'guests'}` },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {r.icon}
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: '700' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* ── DETAILS CARD ── */}
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.08)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ padding: '12px 16px', background: 'rgba(211,191,162,0.03)', borderBottom: '1px solid rgba(211,191,162,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
          <span style={{ fontSize: '0.5rem', fontWeight: '900', color: 'rgba(211,191,162,0.35)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {language === 'mr' ? 'पुष्टी तपशील' : 'Confirmation Details'}
          </span>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: language === 'mr' ? 'नाव' : 'NAME', val: waitlistEntry.customerName, gold: true },
            waitlistEntry.customerPhone && { label: language === 'mr' ? 'मोबाईल' : 'MOBILE', val: `+91 ${waitlistEntry.customerPhone}`, mono: true },
            tablePreference && { label: language === 'mr' ? 'टेबल प्राधान्य' : 'TABLE PREF', val: tablePreference },
            specialRequests && { label: language === 'mr' ? 'विशेष' : 'SPECIAL', val: `"${specialRequests}"`, italic: true },
          ].filter(Boolean).map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.18)', fontWeight: '700', letterSpacing: '0.5px', flexShrink: 0 }}>{r.label}</span>
              <span style={{ fontSize: '0.74rem', fontWeight: r.gold ? '800' : '600', color: r.gold ? '#d3bfa2' : 'rgba(255,255,255,0.35)', fontFamily: r.mono ? 'monospace' : 'inherit', fontStyle: r.italic ? 'italic' : 'normal', textAlign: 'right' }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
 
      {/* ── PRE-ORDER SUMMARY (if any) ── */}
      {hasItems && (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.48rem', fontWeight: '900', letterSpacing: '2.5px', color: 'rgba(211,191,162,0.2)', textTransform: 'uppercase', marginBottom: '12px' }}>
            {language === 'mr' ? 'प्री-ऑर्डर' : 'Pre-Order'}
          </div>
          {waitlistEntry.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < waitlistEntry.items.length - 1 ? '9px' : '0', paddingBottom: i < waitlistEntry.items.length - 1 ? '9px' : '0', borderBottom: i < waitlistEntry.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: '900', color: 'rgba(211,191,162,0.22)', fontFamily: 'monospace' }}>×{item.quantity}</span>
                <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>{item.name}</span>
              </div>
              <span style={{ fontSize: '0.76rem', color: '#d3bfa2', fontWeight: '800', fontFamily: 'monospace' }}>₹{item.subtotal}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '8px', borderTop: '1px solid rgba(211,191,162,0.07)' }}>
            <span style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.22)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Total</span>
            <span style={{ fontSize: '0.9rem', color: '#d3bfa2', fontWeight: '900', fontFamily: 'monospace' }}>₹{waitlistEntry.totalAmount}</span>
          </div>
        </div>
      )}
 
      {/* ── NOTIFICATION PILL ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '13px 15px', marginBottom: '16px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '13px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BellRing size={13} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
        </div>
        <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.65, fontWeight: '500' }}>
          {language === 'mr' ? 'बुकिंग कन्फर्म झाल्यावर सूचना मिळेल.' : "You'll be notified when the restaurant confirms your booking."}
        </p>
      </div>
 
      {/* ── DOWNLOAD PDF BUTTON ── */}
      <button
        onClick={downloadReservationPDF}
        style={{
          width: '100%', padding: '16px',
          background: '#111', border: '1px solid rgba(211,191,162,0.2)',
          borderRadius: '14px', color: '#d3bfa2',
          fontWeight: '900', fontSize: '0.8rem',
          cursor: 'pointer', marginBottom: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          letterSpacing: '0.5px', transition: 'all 0.15s',
          textTransform: 'uppercase'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(211,191,162,0.06)'; e.currentTarget.style.borderColor = 'rgba(211,191,162,0.35)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.borderColor = 'rgba(211,191,162,0.2)'; }}
      >
        <ReceiptText size={16} color="#d3bfa2" strokeWidth={1.5} />
        {language === 'mr' ? 'बुकिंग टोकन PDF डाउनलोड करा' : 'Download Booking Token PDF'}
      </button>
 
      {/* ── PRE-ORDER CTA (if no items yet) ── */}
      {!hasItems && (
        <button onClick={() => setRegistrationStep('menu')} style={{
          width: '100%', padding: '15px',
          background: 'linear-gradient(135deg,#d3bfa2,#bda88a)',
          color: '#0c0c0c', border: 'none', borderRadius: '13px',
          fontWeight: '900', fontSize: '0.8rem', cursor: 'pointer',
          marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          <UtensilsCrossed size={14} strokeWidth={2.5} />
          {language === 'mr' ? 'आधीच ऑर्डर द्या' : 'Add Pre-Order'}
          <ChevronRight size={14} />
        </button>
      )}
 
      {/* ── CANCEL ── */}
      <button onClick={() => {
        if (waitlistEntry?._id) axios.delete(`${BASE_URL}/reservations/${waitlistEntry._id}`).catch(() => {});
        sessionStorage.removeItem('pratyeksha_session');
        const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('pratyeksha_session', newId);
        setWaitlistEntry(null); setRegistrationStep('mode'); setCounterMode(null);
        setCustomerInfo({ name: '', phone: '' }); setPartySize(1);
        setReservationDate(''); setReservationTime(''); setSpecialRequests(''); setTablePreference('');
        setCart({}); setSuggestions({});
      }} style={{
        width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.15)', fontSize: '0.68rem', cursor: 'pointer',
        padding: '12px', borderRadius: '11px', fontWeight: '700', letterSpacing: '0.5px', transition: 'all 0.15s'
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.12)'; e.currentTarget.style.color = 'rgba(211,191,162,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.15)'; }}
      >
        {language === 'mr' ? 'बुकिंग रद्द करा' : 'Cancel Reservation'}
      </button>
 
      {/* ══ HIDDEN PDF FRAME — A5 portrait ══ */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1, left: 0, top: 0 }}>
        <div id="reservation-pdf-frame" style={{ width: '148mm', background: '#ffffff', padding: '18mm 16mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", color: '#000' }}>
 
          {/* PDF Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #111' }}>
            <div style={{ fontSize: '7px', fontWeight: '900', letterSpacing: '3px', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>RESERVATION TOKEN</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#000', letterSpacing: '-0.5px', marginBottom: '2px' }}>{restaurantData?.name || 'PRATYEKSHA'}</div>
            {restaurantData?.address?.city && (
              <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{restaurantData.address.street}, {restaurantData.address.city}</div>
            )}
          </div>
 
          {/* Token */}
          <div style={{ textAlign: 'center', margin: '20px 0', padding: '16px', background: '#f8f8f8', borderRadius: '10px', border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '8px', fontWeight: '900', letterSpacing: '2px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>BOOKING TOKEN</div>
            <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '8px', color: '#111', fontFamily: 'monospace' }}>#{tokenId}</div>
            <div style={{ marginTop: '10px', display: 'inline-block', padding: '4px 14px', borderRadius: '20px', background: isConf ? '#111' : '#e8e0d0', color: isConf ? '#fff' : '#5a4a2a', fontSize: '7px', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {isConf ? '✓ CONFIRMED' : '⏳ PENDING CONFIRMATION'}
            </div>
          </div>
 
          {/* Details table */}
          <div style={{ marginBottom: '18px' }}>
            {[
              { label: 'Guest Name',   val: waitlistEntry.customerName },
              { label: 'Mobile',       val: waitlistEntry.customerPhone ? `+91 ${waitlistEntry.customerPhone}` : '—' },
              { label: 'Date',         val: resTime ? resTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Time',         val: resTime ? resTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—' },
              { label: 'Party Size',   val: `${waitlistEntry.partySize} Guest${waitlistEntry.partySize !== 1 ? 's' : ''}` },
              tablePreference && { label: 'Table Preference', val: tablePreference },
              specialRequests && { label: 'Special Requests', val: specialRequests },
            ].filter(Boolean).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.label}</span>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#111', textAlign: 'right', maxWidth: '60%' }}>{r.val}</span>
              </div>
            ))}
          </div>
 
          {/* Pre-order section */}
          {hasItems && (
            <div style={{ marginBottom: '18px', padding: '12px', background: '#f8f8f8', borderRadius: '8px' }}>
              <div style={{ fontSize: '7px', fontWeight: '900', letterSpacing: '2px', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>PRE-ORDER ITEMS</div>
              {waitlistEntry.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '9px', color: '#333' }}>{item.quantity}× {item.name}</span>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: '#111' }}>₹{item.subtotal}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '6px', borderTop: '1px solid #e0e0e0' }}>
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#111', textTransform: 'uppercase' }}>Total</span>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#111' }}>₹{waitlistEntry.totalAmount}</span>
              </div>
            </div>
          )}
 
          {/* Instructions */}
          <div style={{ padding: '10px 12px', background: '#f0ece6', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '7px', fontWeight: '900', letterSpacing: '1.5px', color: '#8a6a3a', textTransform: 'uppercase', marginBottom: '5px' }}>IMPORTANT</div>
            <div style={{ fontSize: '8px', color: '#5a4a2a', lineHeight: 1.6 }}>
              • Please show this token at the reception on arrival.<br/>
              • Arrive 5–10 minutes before your reservation time.<br/>
              • For changes, please contact the restaurant directly.
            </div>
          </div>
 
          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '7px', color: '#aaa', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>
              POWERED BY PRATYEKSHA
            </div>
            <div style={{ fontSize: '7px', color: '#ccc', marginTop: '4px' }}>
              Generated: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
        </div>
      </div>
 
    </div>
  );
})()}

    {/* Special requests */}
    {(waitlistEntry.specialRequests || waitlistEntry.tablePreference) && (
      <div style={{
        marginTop: '4px', padding: '10px 12px',
        background: 'rgba(211,191,162,0.03)',
        border: '1px solid rgba(211,191,162,0.07)',
        borderRadius: '10px'
      }}>
        {waitlistEntry.tablePreference && (
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginBottom: waitlistEntry.specialRequests ? '5px' : '0' }}>
            <span style={{ color: 'rgba(211,191,162,0.3)', fontWeight: '700' }}>
              {language === 'mr' ? 'टेबल: ' : 'Pref: '}
            </span>
            {waitlistEntry.tablePreference}
          </div>
        )}
        {waitlistEntry.specialRequests && (
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
            "{waitlistEntry.specialRequests}"
          </div>
        )}
      </div>
    )}

    {/* Status badge */}
    <div style={{
      marginTop: '4px',
      display: 'flex', justifyContent: 'center',
      padding: '10px',
      background: waitlistEntry.status === 'confirmed'
        ? 'rgba(211,191,162,0.06)'
        : 'rgba(138,112,77,0.05)',
      border: `1px solid ${waitlistEntry.status === 'confirmed'
        ? 'rgba(211,191,162,0.15)'
        : 'rgba(138,112,77,0.1)'}`,
      borderRadius: '10px'
    }}>
      <span style={{
        fontSize: '0.6rem', fontWeight: '900', letterSpacing: '1px',
        color: waitlistEntry.status === 'confirmed' ? '#d3bfa2' : '#8a704d',
        textTransform: 'uppercase'
      }}>
        {waitlistEntry.status === 'confirmed'
          ? (language === 'mr' ? '✓ कन्फर्म झाले' : '✓ CONFIRMED')
          : (language === 'mr' ? '⏳ प्रतीक्षा — रेस्टॉरंट लवकरच कन्फर्म करेल' : '⏳ PENDING — Restaurant will confirm shortly')}
      </span>
    </div>
  </div>
</div>

          {/* Add pre-order CTA — CODE 4 onClick */}
          {!hasItems && (
            <button onClick={() => {
              if (counterMode === 'reservation') {
                setReservationAskOrder(true);
              } else {
                setRegistrationStep('menu');
              }
            }} style={{
              width: '100%', padding: '17px',
              background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
              color: '#0c0c0c', border: 'none', borderRadius: '14px',
              fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer',
              marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px'
            }}>
              <UtensilsCrossed size={15} strokeWidth={2.5} />
              {language === 'mr' ? 'आधीच ऑर्डर द्या' : 'Add Pre-Order'}
              <ChevronRight size={15} />
            </button>
          )}

          {/* Cancel — CODE 3 onClick */}
          <button onClick={() => {
            if (counterMode === 'reservation' && waitlistEntry?._id) {
              axios.delete(`${BASE_URL}/reservations/${waitlistEntry._id}`).catch(() => {});
            } else {
              axios.delete(`${BASE_URL}/waitlist/session/${tenantId}/${sessionId}`).catch(() => {});
            }
            sessionStorage.removeItem('pratyeksha_session');
            const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            sessionStorage.setItem('pratyeksha_session', newId);
            setWaitlistEntry(null); setRegistrationStep('mode'); setCounterMode(null);
            setCustomerInfo({ name: '', phone: '' }); setPartySize(1);
            setScheduledPickupTime(''); setReservationDate(''); setReservationTime('');
            setSpecialRequests(''); setTablePreference('');
            setCart({}); setSuggestions({});
          }} style={{
            width: '100%', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.18)',
            fontSize: '0.7rem', cursor: 'pointer',
            padding: '13px', borderRadius: '12px',
            fontWeight: '700', letterSpacing: '0.5px', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; e.currentTarget.style.color = 'rgba(211,191,162,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.18)'; }}
          >
            {language === 'mr' ? 'रद्द करा' : 'Leave Queue'}
          </button>
        </div>

        {/* Reservation pre-order prompt overlay */}
        <AnimatePresence>
          {reservationAskOrder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 40px' }}>
              <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                style={{ width: '100%', maxWidth: '400px', background: '#111', border: '1px solid rgba(211,191,162,0.12)', borderRadius: '24px 24px 20px 20px', padding: '32px 24px 28px', margin: '0 16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <UtensilsCrossed size={22} color="rgba(211,191,162,0.6)" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                  {language === 'mr' ? 'आधीच ऑर्डर देणार का?' : 'Pre-order your meal?'}
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.7, marginBottom: '26px', fontWeight: '500' }}>
                  {language === 'mr' ? 'तुम्ही येण्यापूर्वीच ऑर्डर तयार असेल — प्रतीक्षा नाही!' : 'Your food will be ready when you arrive — no waiting!'}
                </p>
                <button onClick={() => { setReservationAskOrder(false); setRegistrationStep('menu'); }} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#d3bfa2,#bda88a)', border: 'none', borderRadius: '13px', color: '#0c0c0c', fontWeight: '900', fontSize: '0.88rem', cursor: 'pointer', marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <UtensilsCrossed size={16} strokeWidth={2.5} />
                  {language === 'mr' ? 'हो, मेनू पाहतो' : 'Yes, Browse Menu'}
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => setReservationAskOrder(false)} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '13px', color: 'rgba(255,255,255,0.2)', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; e.currentTarget.style.color = 'rgba(211,191,162,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}>
                  {language === 'mr' ? 'नाही, नंतर ठरवतो' : "No, I'll decide at the restaurant"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Shell>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: REGISTER
  // ══════════════════════════════════════════
  if (registrationStep === 'register') {
    const isDineIn = counterMode === 'dine-in';
    const pickupOptions = [];
    const base = new Date();
    base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15, 0, 0);
    for (let i = 0; i < 12; i++) {
      const slot = new Date(base.getTime() + i * 15 * 60000);
      pickupOptions.push({
        value: slot.toISOString(),
        label: slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      });
    }


    return (
      <Shell centered={false}>
        {/* Sticky top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(14,14,14,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '14px'
        }}>
          <button onClick={() => setRegistrationStep('mode')} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(211,191,162,0.05)',
            border: '1px solid rgba(211,191,162,0.1)',
            color: 'rgba(211,191,162,0.5)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.1)'; }}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <div>
            <div style={{
              fontSize: '0.7rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '0.3px'
            }}>
{counterMode === 'dine-in'
                ? (language === 'mr' ? 'रांगेत नोंदणी' : 'Join Waitlist')
                : counterMode === 'reservation'
                ? (language === 'mr' ? 'टेबल बुकिंग' : 'Reserve a Table')
                : (language === 'mr' ? 'पिकअप ऑर्डर' : 'Schedule Pickup')}
            </div>
            <div style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.25)', marginTop: '2px' }}>
              {restaurantData?.name}
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 22px 80px', maxWidth: '440px', margin: '0 auto', width: '100%' }}>

          {/* Mode indicator badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '16px 18px', marginBottom: '28px',
            background: '#121212',
            border: '1px solid rgba(211,191,162,0.09)',
            borderRadius: '16px'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
              background: 'rgba(211,191,162,0.07)',
              border: '1px solid rgba(211,191,162,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
{counterMode === 'dine-in'
                ? <Armchair size={19} color="#d3bfa2" strokeWidth={1.5} />
                : counterMode === 'reservation'
                ? <CalendarClock size={19} color="#d3bfa2" strokeWidth={1.5} />
                : <ShoppingBag size={19} color="#d3bfa2" strokeWidth={1.5} />}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#d3bfa2', marginBottom: '3px' }}>
{counterMode === 'dine-in'
                  ? (language === 'mr' ? 'डाइन-इन वेटलिस्ट' : 'Dine-In Waitlist')
                  : counterMode === 'reservation'
                  ? (language === 'mr' ? 'टेबल बुकिंग' : 'Reserve a Table')
                  : (language === 'mr' ? 'पिकअप ऑर्डर' : 'Pickup Order')}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', fontWeight: '500' }}>
                {isDineIn
                  ? (avgWaitData?.queueLength
                    ? `${avgWaitData.queueLength} ahead · ~${avgWaitData.estimatedWait || 20} min`
                    : 'Live queue tracking')
                  : 'Choose your pickup slot'}
              </div>
            </div>
          </div>

          {/* Name field */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{
              fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
              fontWeight: '900', letterSpacing: '2px',
              display: 'block', marginBottom: '10px', textTransform: 'uppercase'
            }}>
              {language === 'mr' ? 'तुमचे नाव *' : 'Your Name *'}
            </label>
            <input
  type="text"
  placeholder={language === 'mr' ? 'उदा. राज शर्मा' : 'e.g. Raj Sharma'}
  defaultValue={customerInfo.name}
  onInput={e => { /* nothing — allow free typing */ }}
  onBlur={e => {
    setCustomerInfo(prev => ({ ...prev, name: e.target.value.trim() }));
    e.target.style.borderColor = 'rgba(211,191,162,0.12)';
  }}
  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
  onFocus={e => e.target.style.borderColor = 'rgba(211,191,162,0.4)'}
  autoComplete="name"
  style={{
    width: '100%', padding: '15px 16px',
    background: '#121212', border: '1px solid rgba(211,191,162,0.12)',
    color: '#fff', borderRadius: '12px', fontSize: '1rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    fontFamily: 'Poppins, sans-serif'
  }}
/>
          </div>

          {/* ── CONTACT (all modes in old block) ── */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{
              fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
              fontWeight: '900', letterSpacing: '2px',
              display: 'block', marginBottom: '10px', textTransform: 'uppercase'
            }}>
              {language === 'mr' ? '१० अंकी मोबाईल नंबर *' : '10-Digit Mobile Number *'}
            </label>
            <div style={{ position: 'relative' }}>
  <span style={{
    position: 'absolute', left: '14px', top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.85rem', color: 'rgba(211,191,162,0.4)',
    fontWeight: '700', pointerEvents: 'none'
  }}>+91</span>
  <input
    type="tel"
    inputMode="numeric"
    maxLength={10}
    placeholder="9876543210"
    defaultValue={customerInfo.phone}
    onInput={e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    }}
    onBlur={e => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
      setCustomerInfo(prev => ({ ...prev, phone: digits }));
      e.target.style.borderColor = 'rgba(211,191,162,0.12)';
    }}
    onFocus={e => e.target.style.borderColor = 'rgba(211,191,162,0.4)'}
    autoComplete="tel"
    style={{
      width: '100%', padding: '15px 16px 15px 52px',
      background: '#121212', border: '1px solid rgba(211,191,162,0.12)',
      color: '#fff', borderRadius: '12px', fontSize: '1rem',
      outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
      fontFamily: 'Poppins, sans-serif', letterSpacing: '1.5px'
    }}
  />
</div>
            {customerInfo.phone?.length > 0 && customerInfo.phone?.length !== 10 && (
              <div style={{ fontSize: '0.6rem', color: '#BA7517', marginTop: '5px', fontWeight: '700' }}>
                {10 - (customerInfo.phone?.length || 0)} more digits needed
              </div>
            )}
          </div>

          {/* Party size — dine-in only */}
          {isDineIn && (
            <div style={{ marginBottom: '22px' }}>
              <label style={{
                fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
                fontWeight: '900', letterSpacing: '2px',
                display: 'block', marginBottom: '10px', textTransform: 'uppercase'
              }}>
                {language === 'mr' ? 'किती जण?' : 'Party Size'}
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button key={n} type="button" onClick={() => setPartySize(n)} style={{
                    width: '54px', height: '54px', borderRadius: '13px',
                    border: 'none', cursor: 'pointer',
                    fontWeight: '900', fontSize: '1rem',
                    transition: 'all 0.15s',
                    background: partySize === n
                      ? 'linear-gradient(135deg, #d3bfa2, #bda88a)'
                      : '#121212',
                    color: partySize === n ? '#0c0c0c' : 'rgba(255,255,255,0.25)',
                    outline: partySize === n
                      ? 'none'
                      : '1px solid rgba(211,191,162,0.08)',
                    transform: partySize === n ? 'scale(1.05)' : 'scale(1)'
                  }}>
                    {n}{n === 6 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pickup time — pickup only */}
          {!isDineIn && (
            <div style={{ marginBottom: '22px' }}>
              <label style={{
                fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
                fontWeight: '900', letterSpacing: '2px',
                display: 'block', marginBottom: '10px', textTransform: 'uppercase'
              }}>
                {language === 'mr' ? 'पिकअप वेळ' : 'Pickup Time'}
              </label>
              <div style={{ position: 'relative' }}>
                <Clock3 size={14} color="rgba(211,191,162,0.3)" strokeWidth={1.5} style={{
                  position: 'absolute', left: '15px', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none'
                }} />
                <select
                  value={scheduledPickupTime}
                  onChange={e => setScheduledPickupTime(e.target.value)}
                  style={{
                    width: '100%', padding: '15px 16px 15px 42px',
                    background: '#121212',
                    border: '1px solid rgba(211,191,162,0.12)',
                    color: scheduledPickupTime ? '#fff' : 'rgba(255,255,255,0.25)',
                    borderRadius: '12px', fontSize: '0.9rem',
                    outline: 'none', cursor: 'pointer',
                    appearance: 'none', boxSizing: 'border-box',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  <option value="">
                    {language === 'mr' ? '— वेळ निवडा —' : '— Select a time slot —'}
                  </option>
                  {pickupOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronRight size={13} color="rgba(211,191,162,0.25)" style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none'
                }} />
              </div>
            </div>
          )}

          {/* ── RESERVATION DATE + TIME ── */}
{counterMode === 'reservation' && (
  <>
    {/* Date picker */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '10px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'तारीख *' : 'Reservation Date *'}
      </label>
      <input
        type="date"
        value={reservationDate}
        min={new Date().toISOString().split('T')[0]}
        onChange={e => setReservationDate(e.target.value)}
        style={{
          width: '100%', padding: '15px 16px',
          background: '#121212', border: '1px solid rgba(211,191,162,0.12)',
          color: '#fff', borderRadius: '12px', fontSize: '0.9rem',
          outline: 'none', boxSizing: 'border-box', colorScheme: 'dark',
          fontFamily: 'Poppins, sans-serif', cursor: 'pointer'
        }}
      />
    </div>

    {/* Time slots */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '10px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'वेळ *' : 'Time Slot *'}
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {['11:00', '12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '20:30', '21:00'].map(slot => {
          const [h, m] = slot.split(':').map(Number);
          const label = h < 12 ? `${h}:${m.toString().padStart(2,'0')} AM` : h === 12 ? `12:${m.toString().padStart(2,'0')} PM` : `${h-12}:${m.toString().padStart(2,'0')} PM`;
          const isSelected = reservationTime === slot;
          return (
            <button key={slot} type="button" onClick={() => setReservationTime(slot)} style={{
              padding: '11px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: '900', fontSize: '0.72rem',
              background: isSelected ? 'linear-gradient(135deg,#d3bfa2,#bda88a)' : '#121212',
              color: isSelected ? '#0c0c0c' : 'rgba(255,255,255,0.2)',
              outline: isSelected ? 'none' : '1px solid rgba(211,191,162,0.08)',
              transition: 'all 0.15s',
              transform: isSelected ? 'scale(1.04)' : 'scale(1)'
            }}>
              {label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Party size for reservation */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '10px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'किती जण?' : 'Party Size'}
      </label>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button key={n} type="button" onClick={() => setPartySize(n)} style={{
            width: '54px', height: '54px', borderRadius: '13px',
            border: 'none', cursor: 'pointer',
            fontWeight: '900', fontSize: '1rem', transition: 'all 0.15s',
            background: partySize === n ? 'linear-gradient(135deg,#d3bfa2,#bda88a)' : '#121212',
            color: partySize === n ? '#0c0c0c' : 'rgba(255,255,255,0.25)',
            outline: partySize === n ? 'none' : '1px solid rgba(211,191,162,0.08)',
            transform: partySize === n ? 'scale(1.05)' : 'scale(1)'
          }}>
            {n}{n === 6 ? '+' : ''}
          </button>
        ))}
      </div>
    </div>

    {/* Table preference */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '10px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'टेबल प्राधान्य (ऐच्छिक)' : 'Table Preference (optional)'}
      </label>
<input
  type="text"
  placeholder={language === 'mr' ? 'उदा. खिडकीजवळ, शांत कोपरा' : 'e.g. window seat, quiet corner, table 4'}
  defaultValue={tablePreference}
  onBlur={e => {
    setTablePreference(e.target.value);
    e.target.style.borderColor = 'rgba(211,191,162,0.12)';
  }}
  onFocus={e => e.target.style.borderColor = 'rgba(211,191,162,0.4)'}
  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
  style={{
    width: '100%', padding: '15px 16px',
    background: '#121212', border: '1px solid rgba(211,191,162,0.12)',
    color: '#fff', borderRadius: '12px', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Poppins, sans-serif', transition: 'border-color 0.2s'
  }}
/>
    </div>

    {/* Special requests */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '10px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'विशेष विनंती (ऐच्छिक)' : 'Special Requests (optional)'}
      </label>
<input
  type="text"
  placeholder={language === 'mr' ? 'उदा. वाढदिवस, ऍलर्जी...' : 'e.g. birthday celebration, nut allergy, high chair...'}
  defaultValue={specialRequests}
  onBlur={e => {
    setSpecialRequests(e.target.value);
    e.target.style.borderColor = 'rgba(211,191,162,0.12)';
  }}
  onFocus={e => e.target.style.borderColor = 'rgba(211,191,162,0.4)'}
  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
  style={{
    width: '100%', padding: '15px 16px',
    background: '#121212', border: '1px solid rgba(211,191,162,0.12)',
    color: '#fff', borderRadius: '12px', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Poppins, sans-serif', transition: 'border-color 0.2s'
  }}
/>
    </div>
  </>
)}

          {/* Queue info pills — dine-in only */}
          {isDineIn && avgWaitData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {[
                {
                  icon: <UserCheck size={13} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />,
                  label: language === 'mr' ? 'पुढे रांग' : 'Groups Ahead',
                  val: `${avgWaitData.queueLength || 0}`
                },
                {
                  icon: <Hourglass size={13} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />,
                  label: language === 'mr' ? 'अंदाजे वेळ' : 'Est. Wait',
                  val: `~${(avgWaitData.queueLength || 0) * (avgWaitData.avgWait || 20)} min`
                },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#0c0c0c',
                  border: '1px solid rgba(211,191,162,0.07)',
                  borderRadius: '12px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  {s.icon}
                  <div>
                    <div style={{
                      fontSize: '0.5rem', color: 'rgba(211,191,162,0.2)',
                      fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>{s.label}</div>
                    <div style={{
                      fontSize: '0.88rem', fontWeight: '900',
                      color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace'
                    }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
 </div>{/* end of padding div */}

        {/* Sticky footer button — always visible */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'linear-gradient(to top, #0e0e0e 70%, transparent)',
          padding: '16px 22px 36px',
          pointerEvents: 'none'
        }}>
          {(() => {
            const nameOk  = customerInfo.name.trim().length > 0;
            const phoneOk = customerInfo.phone?.replace(/\D/g,'').length === 10;
            const dateOk  = counterMode !== 'reservation' || reservationDate;
            const timeOk  = counterMode !== 'reservation' || reservationTime;
            const allOk   = nameOk && phoneOk && dateOk && timeOk;

            // Hint text
            const hint = !nameOk
              ? (language === 'mr' ? 'नाव आवश्यक आहे' : 'Enter your name')
              : !phoneOk
              ? (language === 'mr' ? '१० अंकी नंबर आवश्यक' : '10-digit number required')
              : !dateOk
              ? (language === 'mr' ? 'तारीख निवडा' : 'Choose a date')
              : !timeOk
              ? (language === 'mr' ? 'वेळ निवडा' : 'Choose a time slot')
              : null;

            return (
              <div style={{ pointerEvents: 'all' }}>
                {hint && (
                  <div style={{
                    textAlign: 'center', marginBottom: '10px',
                    fontSize: '0.6rem', color: 'rgba(211,191,162,0.3)',
                    fontWeight: '700', letterSpacing: '0.3px'
                  }}>
                    {hint}
                  </div>
                )}
                <button
                  disabled={!allOk}
                  onClick={() => {
                    if (!allOk) return;
                    if (counterMode === 'reservation') {
                      setReservationAskOrder(true);
                    } else {
                      setRegistrationStep('menu');
                    }
                  }}
                  style={{
                    width: '100%', padding: '17px',
                    background: allOk
                      ? 'linear-gradient(135deg, #d3bfa2, #bda88a)'
                      : 'rgba(211,191,162,0.06)',
                    color: allOk ? '#0c0c0c' : 'rgba(211,191,162,0.2)',
                    border: allOk ? 'none' : '1px solid rgba(211,191,162,0.1)',
                    borderRadius: '14px', fontWeight: '900', fontSize: '0.88rem',
                    cursor: allOk ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '10px',
                    boxShadow: allOk ? '0 8px 24px rgba(211,191,162,0.15)' : 'none'
                  }}
                >
                  {counterMode === 'reservation'
                    ? <CalendarClock size={16} strokeWidth={2} />
                    : <UtensilsCrossed size={16} strokeWidth={2.5} />
                  }
                  {counterMode === 'dine-in'
                    ? (language === 'mr' ? 'मेनू पहा' : 'BROWSE MENU')
                    : counterMode === 'reservation'
                    ? (language === 'mr' ? 'बुकिंग पुढे जा' : 'CONTINUE BOOKING')
                    : (language === 'mr' ? 'मेनू पहा' : 'BROWSE MENU')
                  }
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })()}
        </div>

        {/* ── RESERVATION ORDER PROMPT OVERLAY ── */}
<AnimatePresence>
  {reservationAskOrder && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 0 32px'
      }}
    >
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        style={{
          width: '100%', maxWidth: '440px',
          background: '#0d0d0d',
          border: '1px solid rgba(211,191,162,0.14)',
          borderRadius: '28px 28px 22px 22px',
          overflow: 'hidden',
          margin: '0 16px'
        }}
      >
        {/* ── BOOKING SUMMARY HEADER ── */}
        <div style={{
          padding: '24px 24px 20px',
          background: 'linear-gradient(180deg, rgba(211,191,162,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(211,191,162,0.07)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '13px',
              background: 'rgba(211,191,162,0.08)',
              border: '1px solid rgba(211,191,162,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <CalendarClock size={21} color="#d3bfa2" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: '0.52rem', color: 'rgba(211,191,162,0.3)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>
                {language === 'mr' ? 'बुकिंग तपशील' : 'Booking Summary'}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.2px' }}>
                {restaurantData?.name}
              </div>
            </div>
          </div>
 
          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
            {[
              { icon: <Users size={11} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />, label: language === 'mr' ? 'नाव' : 'Name', val: customerInfo.name || '—' },
              { icon: <Users size={11} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />, label: language === 'mr' ? 'जण' : 'Guests', val: `${partySize} ${language === 'mr' ? 'जण' : 'people'}` },
              { icon: <CalendarClock size={11} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />, label: language === 'mr' ? 'तारीख' : 'Date', val: reservationDate ? new Date(reservationDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' }) : '—' },
              { icon: <Clock3 size={11} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />, label: language === 'mr' ? 'वेळ' : 'Time', val: (() => { if (!reservationTime) return '—'; const [h, m] = reservationTime.split(':').map(Number); return h < 12 ? `${h}:${m.toString().padStart(2,'0')} AM` : h === 12 ? `12:${m.toString().padStart(2,'0')} PM` : `${h-12}:${m.toString().padStart(2,'0')} PM`; })() },
              ...(customerInfo.phone ? [{ icon: <Hash size={11} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />, label: language === 'mr' ? 'मोबाईल' : 'Mobile', val: `+91 ${customerInfo.phone}` }] : []),
              ...(tablePreference ? [{ icon: <MapPin size={11} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />, label: language === 'mr' ? 'टेबल' : 'Pref', val: tablePreference }] : []),
            ].map((s, i) => (
              <div key={i} style={{
                background: '#111', border: '1px solid rgba(211,191,162,0.07)',
                borderRadius: '11px', padding: '11px 13px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  {s.icon}
                  <span style={{ fontSize: '0.46rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#d3bfa2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.val}</div>
              </div>
            ))}
          </div>
 
          {specialRequests ? (
            <div style={{ marginTop: '10px', padding: '10px 13px', background: '#111', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.46rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                {language === 'mr' ? 'विशेष विनंती' : 'Special Request'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>"{specialRequests}"</div>
            </div>
          ) : null}
        </div>
 
        {/* ── QUESTION + CTAs ── */}
        <div style={{ padding: '20px 22px 24px' }}>
          <h3 style={{ fontSize: '0.96rem', fontWeight: '900', color: '#fff', marginBottom: '5px', letterSpacing: '-0.3px' }}>
            {language === 'mr' ? 'आधीच ऑर्डर देणार का?' : 'Would you like to pre-order?'}
          </h3>
          <p style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.65, marginBottom: '18px', fontWeight: '500' }}>
            {language === 'mr'
              ? 'तुम्ही येण्यापूर्वीच जेवण तयार असेल — वाट पहायला नको!'
              : 'Your food will be ready when you arrive — no waiting!'}
          </p>
 
          {/* YES — browse menu */}
          <button
            onClick={() => { setReservationAskOrder(false); setRegistrationStep('menu'); }}
            style={{
              width: '100%', padding: '15px',
              background: 'linear-gradient(135deg,#d3bfa2,#bda88a)',
              border: 'none', borderRadius: '13px',
              color: '#0c0c0c', fontWeight: '900', fontSize: '0.84rem',
              cursor: 'pointer', marginBottom: '9px',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
              boxShadow: '0 6px 20px rgba(211,191,162,0.18)'
            }}
          >
            <UtensilsCrossed size={15} strokeWidth={2.5} />
            {language === 'mr' ? 'हो, मेनू पाहतो' : 'Yes, Browse Menu'}
            <ChevronRight size={15} />
          </button>
 
          {/* NO — place reservation only */}
          <button
            onClick={async () => {
              setReservationAskOrder(false);
              const [hours, minutes] = reservationTime.split(':').map(Number);
              const resDateTime = new Date(reservationDate + 'T00:00:00');
              resDateTime.setHours(hours, minutes, 0, 0);
              try {
                const res = await axios.post(`${BASE_URL}/reservations/${tenantId}`, {
                  sessionId,
                  customerName: customerInfo.name,
                  customerPhone: customerInfo.phone?.replace(/\D/g, '') || '',
                  partySize,
                  reservationTime: resDateTime.toISOString(),
                  tablePreference, specialRequests,
                  items: [], totalAmount: 0, status: 'pending'
                });
                setWaitlistEntry(res.data.reservation);
                setRegistrationStep('confirm');
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('📅 Reservation Requested!', {
                    body: `Hi ${customerInfo.name}! Table for ${partySize} on ${resDateTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at ${resDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} is pending.`,
                    icon: '/logo.png',
                  });
                }
              } catch (err) { console.error(err); triggerAlert('orderError', 'error'); }
            }}
            style={{
              width: '100%', padding: '14px',
              background: 'rgba(211,191,162,0.04)',
              border: '1px solid rgba(211,191,162,0.1)',
              borderRadius: '13px', color: 'rgba(255,255,255,0.3)',
              fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer',
              transition: 'all 0.15s', letterSpacing: '0.3px'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
          >
            {language === 'mr' ? 'नाही, फक्त बुकिंग करा' : "No, Just Reserve the Table"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
      </Shell>
    );
  }      
  // ══════════════════════════════════════════
  // SCREEN: MODE SELECTION
  // ══════════════════════════════════════════
  const occupiedCount = avgWaitData?.tablesOccupied || 0;
  const totalCount    = avgWaitData?.totalTables    || 12;
  const queueLen      = avgWaitData?.queueLength    || 0;
  const estWait       = avgWaitData?.estimatedWait  || 0;
  const freeTables    = totalCount - occupiedCount;
  const isFull        = freeTables <= 0;

  return (
    <Shell>
      <RestaurantBadge />

      {/* Occupancy strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '13px 18px', marginBottom: '28px',
        background: '#121212',
        border: '1px solid rgba(211,191,162,0.09)',
        borderRadius: '16px', width: '100%', maxWidth: '400px'
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
          background: isFull ? 'rgba(211,191,162,0.4)' : 'rgba(211,191,162,0.7)',
          boxShadow: isFull
            ? '0 0 6px rgba(211,191,162,0.15)'
            : '0 0 8px rgba(211,191,162,0.35)'
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.74rem', color: isFull ? 'rgba(211,191,162,0.6)' : 'rgba(211,191,162,0.85)', fontWeight: '800' }}>
            {isFull
              ? (language === 'mr' ? `सर्व ${totalCount} टेबल भरलेले` : `All ${totalCount} tables occupied`)
              : (language === 'mr' ? `${freeTables} टेबल उपलब्ध` : `${freeTables} of ${totalCount} tables free`)}
          </div>
          {isFull && queueLen > 0 && (
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
              {queueLen} group{queueLen !== 1 ? 's' : ''} waiting · ~{estWait} min
            </div>
          )}
        </div>
        {/* Occupancy bar */}
        <div style={{
          width: '56px', height: '3px',
          background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0
        }}>
          <div style={{
            height: '100%',
            width: `${(occupiedCount / totalCount) * 100}%`,
            background: 'rgba(211,191,162,0.5)',
            borderRadius: '2px', transition: 'width 0.6s ease'
          }} />
        </div>
      </div>

      {/* Mode cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' }}>

        {/* WAITLIST card */}
        <button
          onClick={() => { setCounterMode('dine-in'); setRegistrationStep('register'); }}
          style={{
            background: '#121212',
            border: '1px solid rgba(211,191,162,0.12)',
            borderRadius: '22px', padding: '22px 20px',
            textAlign: 'left', cursor: 'pointer',
            color: '#fff', transition: 'all 0.18s', width: '100%',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#161616';
            e.currentTarget.style.borderColor = 'rgba(211,191,162,0.22)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#121212';
            e.currentTarget.style.borderColor = 'rgba(211,191,162,0.12)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '15px', flexShrink: 0,
              background: 'rgba(211,191,162,0.07)',
              border: '1px solid rgba(211,191,162,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Armchair size={22} color="#d3bfa2" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.9rem', fontWeight: '900', color: '#d3bfa2',
                marginBottom: '6px', letterSpacing: '-0.1px'
              }}>
                {language === 'mr' ? 'रांगेत नाव नोंदवा' : 'Join Waitlist'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
                {language === 'mr'
                  ? `प्रतीक्षा करताना आधीच ऑर्डर द्या${queueLen > 0 ? ` · ~${estWait} मिनिट` : ''}`
                  : `Pre-order while you wait${queueLen > 0 ? ` · ~${estWait} min` : ' · No queue now'}`}
              </div>
              {queueLen > 0 && (
                <div style={{
                  marginTop: '12px', display: 'inline-flex',
                  alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '20px',
                  background: 'rgba(211,191,162,0.05)',
                  border: '1px solid rgba(211,191,162,0.1)'
                }}>
                  <Users size={10} color="rgba(211,191,162,0.35)" />
                  <span style={{ fontSize: '0.58rem', color: 'rgba(211,191,162,0.45)', fontWeight: '800' }}>
                    {queueLen} group{queueLen !== 1 ? 's' : ''} ahead
                  </span>
                </div>
              )}
            </div>
            <ChevronRight size={16} color="rgba(211,191,162,0.2)" style={{ marginTop: '4px', flexShrink: 0 }} />
          </div>
        </button>

        {/* PICKUP card */}
        <button
          onClick={() => { setCounterMode('pickup'); setRegistrationStep('register'); }}
          style={{
            background: '#0f0f0f',
            border: '1px solid rgba(211,191,162,0.08)',
            borderRadius: '22px', padding: '22px 20px',
            textAlign: 'left', cursor: 'pointer',
            color: '#fff', transition: 'all 0.18s', width: '100%',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#141414';
            e.currentTarget.style.borderColor = 'rgba(211,191,162,0.16)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#0f0f0f';
            e.currentTarget.style.borderColor = 'rgba(211,191,162,0.08)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '15px', flexShrink: 0,
              background: 'rgba(211,191,162,0.05)',
              border: '1px solid rgba(211,191,162,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShoppingBag size={22} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.9rem', fontWeight: '900',
                color: 'rgba(211,191,162,0.75)',
                marginBottom: '6px', letterSpacing: '-0.1px'
              }}>
                {language === 'mr' ? 'टेकअवे / पिकअप' : 'Takeaway / Pickup'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                {language === 'mr'
                  ? 'ऑर्डर द्या, ठरलेल्या वेळी घ्या · प्रतीक्षा नाही'
                  : 'Order now, collect at your time · Skip the queue'}
              </div>
            </div>
            <ChevronRight size={16} color="rgba(211,191,162,0.15)" style={{ marginTop: '4px', flexShrink: 0 }} />
          </div>
        </button>

        {/* RESERVATION card */}
<button
  onClick={() => { setCounterMode('reservation'); setRegistrationStep('register'); }}
  style={{
    background: '#0f0f0f',
    border: '1px solid rgba(211,191,162,0.07)',
    borderRadius: '22px', padding: '22px 20px',
    textAlign: 'left', cursor: 'pointer',
    color: '#fff', transition: 'all 0.18s', width: '100%',
  }}
  onMouseEnter={e => { e.currentTarget.style.background = '#141414'; e.currentTarget.style.borderColor = 'rgba(211,191,162,0.14)'; }}
  onMouseLeave={e => { e.currentTarget.style.background = '#0f0f0f'; e.currentTarget.style.borderColor = 'rgba(211,191,162,0.07)'; }}
>
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
    <div style={{
      width: '52px', height: '52px', borderRadius: '15px', flexShrink: 0,
      background: 'rgba(211,191,162,0.04)',
      border: '1px solid rgba(211,191,162,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <CalendarClock size={22} color="rgba(211,191,162,0.55)" strokeWidth={1.5} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.9rem', fontWeight: '900', color: 'rgba(211,191,162,0.65)', marginBottom: '6px' }}>
        {language === 'mr' ? 'टेबल बुकिंग' : 'Reserve a Table'}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
        {language === 'mr'
          ? 'आगाऊ बुकिंग करा · तारीख व वेळ निवडा · आधीच ऑर्डर द्या'
          : 'Book in advance · Choose date & time · Pre-order your meal'}
      </div>
    </div>
    <ChevronRight size={16} color="rgba(211,191,162,0.12)" style={{ marginTop: '4px', flexShrink: 0 }} />
  </div>
</button>

      </div>

      {/* Language toggle */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
        style={{
          marginTop: '32px', background: 'transparent',
          border: '1px solid rgba(211,191,162,0.08)',
          color: 'rgba(211,191,162,0.25)', padding: '9px 22px',
          borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: '7px', transition: 'all 0.15s', letterSpacing: '0.5px'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(211,191,162,0.2)';
          e.currentTarget.style.color = 'rgba(211,191,162,0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(211,191,162,0.08)';
          e.currentTarget.style.color = 'rgba(211,191,162,0.25)';
        }}
      >
        <Globe2 size={13} strokeWidth={1.5} />
        {language === 'en' ? 'मराठी' : 'English'}
      </button>
    </Shell>
  );
} // ← end of if (isCounterScan && registrationStep !== 'menu')



// ── LOADER ──
if (isLoading) return <div style={{ ...styles.loader, color: primaryColor }}>PRATYEKSHA...</div>;

  return (
    <div style={{...styles.body, backgroundColor: secondaryColor}}>
      
      {/* ALERTS */}
      <AnimatePresence>
        {alert.show && (
          <motion.div initial={{ y: -100 }} animate={{ y: 24 }} exit={{ y: -100 }} style={styles.globalAlert}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               {alert.type === 'success' ? <CheckCircle2 size={20} color={primaryColor} /> : <AlertCircle size={20} color="#ff4444" />}
               <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#fff' }}>{alert.msg}</span>
             </div>
             <X size={16} color="#555" onClick={() => setAlert({ ...alert, show: false })} />
          </motion.div>
        )}
      </AnimatePresence>
{/* Counter mode context banner */}
{isCounterScan && registrationStep === 'menu' && (
  <div style={{
    position: 'sticky', top: 0, zIndex: 1000,
    background: 'rgba(14,14,14,0.97)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(211,191,162,0.07)',
  }}>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 18px',
    }}>
      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
          background: 'rgba(211,191,162,0.06)',
          border: '1px solid rgba(211,191,162,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
{counterMode === 'dine-in'
            ? <Armchair size={16} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />
            : counterMode === 'reservation'
            ? <CalendarClock size={16} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />
            : <ShoppingBag size={16} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
            {counterMode === 'dine-in' ? (
              avgWaitData?.queueLength ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hash size={9} color="rgba(211,191,162,0.4)" />
                    <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>
                      {avgWaitData.queueLength + 1} in queue
                    </span>
                  </div>
                  <span style={{ fontSize: '0.55rem', color: 'rgba(211,191,162,0.15)' }}>·</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hourglass size={9} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
                      ~{avgWaitData.estimatedWait || 20} min
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <UserCheck size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
                  <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>Waitlist</span>
                </div>
              )
            )  : counterMode === 'reservation' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CalendarClock size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>
                  {reservationDate ? `${new Date(reservationDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · ${reservationTime}` : 'Reservation'}
                </span>
              </div>
            ) : scheduledPickupTime ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock3 size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>
                  Pickup {new Date(scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Package size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>Pickup Order</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <Users size={9} color="rgba(211,191,162,0.2)" />
            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>
              {customerInfo.name}
              {counterMode === 'dine-in' && partySize > 1 && ` · ${partySize} pax`}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: back */}
      <button
        onClick={() => setRegistrationStep('register')}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '7px 12px',
          background: 'rgba(211,191,162,0.05)',
          border: '1px solid rgba(211,191,162,0.1)',
          color: 'rgba(211,191,162,0.4)',
          borderRadius: '9px', fontSize: '0.58rem', fontWeight: '900',
          cursor: 'pointer', letterSpacing: '0.5px', flexShrink: 0,
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(211,191,162,0.22)';
          e.currentTarget.style.color = 'rgba(211,191,162,0.7)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(211,191,162,0.1)';
          e.currentTarget.style.color = 'rgba(211,191,162,0.4)';
        }}
      >
        <ArrowLeft size={11} strokeWidth={2} />
        BACK
      </button>
    </div>
  </div>
)}

      <header style={styles.header}>
        <div style={styles.langToggleBox}>
          <button style={{...styles.langBtn, color: primaryColor, borderColor: borderColor}} onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}>
            <Globe2 size={12} style={{marginRight: '6px'}} /> {language === 'en' ? 'मराठी' : 'English'}
          </button>
        </div>
        <h1 style={{...styles.cafeName, color: primaryColor}}>{restaurantData?.name || 'PRATYEKSHA'}</h1>
        <div style={styles.poweredBy}>{t[language].poweredBy} <span>PRATYEKSHA</span> • {t[language].table} {convertToMrNumber(tableNumber)}</div>
      </header>

{/* SEARCH BAR + VEG FILTER */}
<div style={styles.searchWrapper}>

  <div style={styles.searchContainer}>
    <Search size={18} color={primaryColor} />
    <input type="text" placeholder={t[language].searchPlaceholder} style={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
  </div>
</div>

{/* VEG / NON-VEG MODE SWITCHER — only show when non-veg items exist in current view */}
{hasNonVegInView && (
  <div style={{
    display: 'flex',
    margin: '0 20px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(211,191,162,0.12)',
    borderRadius: '14px',
    padding: '5px',
    gap: '5px'
  }}>
    {/* VEG button */}
    <button
      onClick={() => setFilterVegOnly(true)}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: filterVegOnly ? 'rgba(74,124,63,0.15)' : 'transparent',
        outline: filterVegOnly ? '1px solid rgba(74,124,63,0.4)' : '1px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Veg symbol */}
      <div style={{
        width: '16px', height: '16px',
        border: '2px solid #4a7c3f', borderRadius: '3px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4a7c3f' }} />
      </div>
      <span style={{
        fontSize: '0.72rem', fontWeight: '900', letterSpacing: '0.5px',
        color: filterVegOnly ? '#d3bfa2' : '#666'
      }}>
        {language === 'mr' ? 'शाकाहारी' : 'VEG'}
      </span>
    </button>

    {/* NON-VEG button */}
    <button
      onClick={() => setFilterVegOnly(false)}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: !filterVegOnly ? 'rgba(138,48,48,0.12)' : 'transparent',
        outline: !filterVegOnly ? '1px solid rgba(138,48,48,0.4)' : '1px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Non-veg symbol — triangle */}
      <div style={{
        width: '16px', height: '16px',
        border: '2px solid #8a3030', borderRadius: '3px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <div style={{
          width: 0, height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: '7px solid #8a3030'
        }} />
      </div>
      <span style={{
        fontSize: '0.72rem', fontWeight: '900', letterSpacing: '0.5px',
        color: !filterVegOnly ? '#d3bfa2' : '#666'
      }}>
        {language === 'mr' ? 'मांसाहारी' : 'NON-VEG'}
      </span>
    </button>
  </div>
)}

      {/* CATEGORY NAV */}
      <div style={{...styles.navContainer, backgroundColor: secondaryColor}}>
        <nav ref={navRef} style={styles.navScroll} className="no-scrollbar">
          <button ref={selectedCategoryId === 'all' ? activeTabRef : null} onClick={() => setSelectedCategoryId('all')} style={{...styles.navItem, color: selectedCategoryId === 'all' ? primaryColor : '#888'}}>
            {t[language].all} {selectedCategoryId === 'all' && <motion.div layoutId="underline" style={styles.activeUnderline} />}
          </button>
{categoryList
  .filter(cat =>
    allMenuItems.some(i =>
      i.categoryId === cat.categoryId &&
      i.isAvailable !== false &&
      (filterVegOnly ? i.isVeg === true : i.isVeg !== true)
    )
  )
  .map(cat => (
    <button key={cat.categoryId} ref={selectedCategoryId === cat.categoryId ? activeTabRef : null} onClick={() => setSelectedCategoryId(cat.categoryId)} style={{...styles.navItem, color: selectedCategoryId === cat.categoryId ? primaryColor : '#888'}}>
      {(language === 'mr' ? cat.name_mr : cat.name).toUpperCase()} {selectedCategoryId === cat.categoryId && <motion.div layoutId="underline" style={styles.activeUnderline} />}
    </button>
  ))
}
        </nav>
      </div>

      {/* MENU GRID */}
      <motion.div style={styles.contentWrapper} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -50) handleSwipe('left'); if (info.offset.x > 50) handleSwipe('right'); }}>
        <AnimatePresence mode="wait">
          <motion.div key={selectedCategoryId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.menuContainer}>
            {filteredMenuItems.map((item) => (
              <div key={item._id} style={{...styles.menuCard, background: cardBg, borderColor: borderColor}}>
                <div style={styles.tagContainer}>
                  {item.isChefSpecial === true && <div style={styles.chefTag}><Sparkles size={10} style={{marginRight: '4px'}} /> {t[language].chefChoice}</div>}
                </div>
<div style={styles.itemContentLeft}>
  <p style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
  {/* VEG / NON-VEG INDICATOR */}
  <span title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'} style={{
    width: '14px', height: '14px', border: `2px solid ${item.isVeg !== false ? '#4a7c3f' : '#8a3030'}`,
    borderRadius: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
  }}>
    <span style={{
      width: '6px', height: '6px', borderRadius: '50%',
      background: item.isVeg !== false ? '#4a7c3f' : '#8a3030'
    }} />
  </span>

  {language === 'mr' ? item.name_mr : item.name}
  
  {/* 🌶️ DYNAMIC SPICY LEVEL HIGHLIGHT INDICATOR */}
  {item.spicylevel && (
    <span style={{
      fontSize: '0.58rem',
      fontWeight: '900',
      padding: '2px 6px',
      borderRadius: '4px',
      background: item.spicylevel.toUpperCase() === 'HIGH' ? 'rgba(255,77,77,0.15)' : 'rgba(211,191,162,0.15)',
      color: item.spicylevel.toUpperCase() === 'HIGH' ? '#ff4d4d' : '#d3bfa2',
      border: item.spicylevel.toUpperCase() === 'HIGH' ? '1px solid rgba(255,77,77,0.3)' : '1px solid rgba(211,191,162,0.3)',
      letterSpacing: '0.5px'
    }}>
      🔥 {t[language][`spice${item.spicylevel.charAt(0).toUpperCase() + item.spicylevel.slice(1).toLowerCase()}`] || item.spicylevel.toUpperCase()}
    </span>
  )}
</p>
  {/* 📋 PREMIUM INGREDIENTS LAYOUT BADGE ARRAYS */}
  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '0.6rem', color: '#555', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {t[language].ingredients}
    </span>
    
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
      {language === 'mr' ? (
        /* 🚀 FIXED: Using bracket notation to safely extract the array from MongoDB object mapping profiles */
        item.ingredients && item.ingredients['mr'] && item.ingredients['mr'].length > 0 ? (
          item.ingredients['mr'].map((ing, idx) => (
            <span key={idx} style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: '4px', color: '#aaa', fontWeight: '500' }}>
              {ing}
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.65rem', color: '#444', fontStyle: 'italic' }}>माहिती उपलब्ध नाही</span>
        )
      ) : (
        /* 🚀 FIXED: Using bracket notation to safely extract the array from MongoDB object mapping profiles */
        item.ingredients && item.ingredients['en'] && item.ingredients['en'].length > 0 ? (
          item.ingredients['en'].map((ing, idx) => (
            <span key={idx} style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: '4px', color: '#aaa', fontWeight: '500' }}>
              {ing}
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.65rem', color: '#444', fontStyle: 'italic' }}>No data provided</span>
        )
      )}
    </div>
  </div>

  <div style={styles.priceContainer}>
    {!item.priceHalf ? (
      <div style={styles.priceRow}>
        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: primaryColor }}>
          ₹{item.priceFull || item.price}
        </div>
        {cart[item._id] ? (
          <div style={styles.counterRowSmall}>
            <button onClick={() => removeFromCart(item._id)} style={styles.qtyBtnSmall}>-</button>
            <span style={{ fontSize: '0.8rem' }}>{cart[item._id]}</span>
            <button onClick={() => addToCart(item, 'Single')} style={styles.qtyBtnSmall}>+</button>
          </div>
        ) : (
          <button onClick={() => addToCart(item, 'Single')} style={styles.addBtnSmall}>{t[language].add}</button>
        )}
      </div>
    ) : (
      <>
        <div style={styles.priceRow}>
          <span style={styles.priceLabel}>
            {t[language].half}: <span style={{ color: primaryColor }}>
              ₹{item.priceHalf}
            </span>
          </span>
          {cart[`${item._id}-Half`] ? (
            <div style={styles.counterRowSmall}>
              <button onClick={() => removeFromCart(`${item._id}-Half`)} style={styles.qtyBtnSmall}>-</button>
              <span>{cart[`${item._id}-Half`]}</span>
              <button onClick={() => addToCart(item, 'Half')} style={styles.qtyBtnSmall}>+</button>
            </div>
          ) : (
            <button onClick={() => addToCart(item, 'Half')} style={styles.addBtnSmall}>{t[language].addHalf}</button>
          )}
        </div>
        <div style={styles.priceRow}>
          <span style={styles.priceLabel}>
            {t[language].full}: <span style={{ color: primaryColor }}>
              ₹{item.priceFull || item.price}
            </span>
          </span>
          {cart[`${item._id}-Full`] ? (
            <div style={styles.counterRowSmall}>
              <button onClick={() => removeFromCart(`${item._id}-Full`)} style={styles.qtyBtnSmall}>-</button>
              <span>{cart[`${item._id}-Full`]}</span>
              <button onClick={() => addToCart(item, 'Full')} style={styles.qtyBtnSmall}>+</button>
            </div>
          ) : (
            <button onClick={() => addToCart(item, 'Full')} style={styles.addBtnSmall}>{t[language].addFull}</button>
          )}
        </div>
      </>
    )}
  </div>
               </div>
                <button style={{...styles.view3dBtn, background: primaryColor}} onClick={() => setActiveModel(item)}>{t[language].view3d}</button>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

{/* ── ORDER STATUS BANNER ── */}
{hasPlacedInitialOrder && !isCounterScan && Object.keys(liveOrderStatuses).length > 0 && (
  <div style={{
    margin: '0 20px 12px',
    background: '#0c0c0c',
    border: '1px solid rgba(211,191,162,0.1)',
    borderRadius: '16px',
    overflow: 'hidden'
  }}>
    <div style={{
      padding: '10px 16px',
      background: 'rgba(211,191,162,0.04)',
      borderBottom: '1px solid rgba(211,191,162,0.08)',
      fontSize: '0.52rem', fontWeight: '900',
      color: 'rgba(211,191,162,0.35)',
      letterSpacing: '2px', textTransform: 'uppercase'
    }}>
      ORDER STATUS — TABLE {tableNumber}
    </div>
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Object.entries(liveOrderStatuses).map(([orderId, status]) => {
        const steps = ['pending', 'ready', 'served'];
        const stepIdx = steps.indexOf(status);
        const labels = { pending: 'In Kitchen 🍳', ready: 'Ready! 🍽️', served: 'Served ✓' };
        const colors = { pending: '#8a704d', ready: '#d3bfa2', served: '#555' };
        return (
          <div key={orderId} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              fontSize: '0.7rem', fontWeight: '900',
              color: colors[status] || '#555',
              padding: '4px 10px',
              background: `rgba(211,191,162,${stepIdx === 1 ? '0.1' : '0.04'})`,
              border: `1px solid rgba(211,191,162,${stepIdx === 1 ? '0.25' : '0.08'})`,
              borderRadius: '20px'
            }}>
              {labels[status] || status}
            </div>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {steps.map((s, i) => (
                <div key={s} style={{
                  width: i <= stepIdx ? '18px' : '6px',
                  height: '6px', borderRadius: '3px',
                  background: i <= stepIdx ? 'rgba(211,191,162,0.6)' : 'rgba(211,191,162,0.1)',
                  transition: 'all 0.4s ease'
                }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
      {/* FABs RIGHT SIDE */}
{/* FABs RIGHT SIDE */}
<div style={styles.rightFabContainer}>
  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{...styles.fabBase, background: primaryColor}} onClick={() => setIsWaiterModalOpen(true)}>
    <BellRing size={26} color={secondaryColor} />
  </motion.div>

  {/* EXTRA ITEMS FAB */}
  {extraItems.filter(i => i.isAvailable).length > 0 && (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      style={{...styles.fabBase, background: primaryColor}}
      onClick={() => { setIsExtraItemsOpen(true); setExtraItemCart({}); setActiveExtraCategory('All'); setExtraItemSearchQuery(''); }}
    >
      <ShoppingBag size={24} color={secondaryColor} strokeWidth={2.5} />
    </motion.div>
  )}

  {(totalItemsInCart > 0 || hasPlacedInitialOrder) && (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{...styles.fabBase, background: primaryColor}} onClick={() => setIsDrawerOpen(true)}>
      <Utensils size={26} color={secondaryColor} strokeWidth={2.5} />
      {totalItemsInCart > 0 && <span style={styles.fabBadge}>{convertToMrNumber(totalItemsInCart)}</span>}
    </motion.div>
  )}
</div>

      {/* WAITER MODAL */}
      <AnimatePresence>
        {isWaiterModalOpen && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={styles.fullscreenModal}>
            <div style={styles.modalHeader}>
              <h2 style={{color: primaryColor}}>{t[language].callWaiter}</h2>
              <X size={30} color={primaryColor} onClick={() => setIsWaiterModalOpen(false)} />
            </div>
            <div style={styles.modalScrollBody}>
              <div style={styles.waiterCardGrid}>
              {['spoon', 'fork', 'plates', 'water'].map(id => (
  <div key={id} style={styles.waiterCountCard}>
    <div style={{ color: primaryColor }}>
      {/* UPDATED ICON LOGIC */}
      {id === 'spoon' && <Utensils size={24} />}
      {id === 'fork' && <UtensilsCrossed size={24} />}
      {id === 'plates' && <Layers size={24} />}
      {id === 'water' && <Droplets size={24} />}
    </div>
    <p style={styles.waiterLabel}>{t[language][id]}</p>
                    <div style={styles.countControls}>
                      <button style={styles.countBtn} onClick={() => updateWaiterCount(id, -1)}><Minus size={16}/></button>
                      <span style={styles.countDisplay}>{convertToMrNumber(waiterCounts[id])}</span>
                      <button style={styles.countBtn} onClick={() => updateWaiterCount(id, 1)}><Plus size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 25px' }}>
                <button style={styles.waiterActionRow} onClick={() => notifyWaiter(t.en.clean)}><Trash2 size={20} color={primaryColor}/> <span>{t[language].clean}</span></button>
                <button style={styles.waiterActionRow} onClick={() => notifyWaiter(t.en.other)}><HelpCircle size={20} color={primaryColor}/> <span>{t[language].other}</span></button>
                <button style={{...styles.kitchenBtn, background: primaryColor, marginTop: '20px'}} onClick={() => notifyWaiter("Custom")}>{t[language].sendRequest}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXTRA ITEMS MODAL */}
<AnimatePresence>
  {isExtraItemsOpen && (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'tween', duration: 0.28 }}
      style={{ ...styles.fullscreenModal, zIndex: 5200 }}
    >
      {/* HEADER */}
      <div style={styles.modalHeader}>
        <div>
          <h2 style={{ color: primaryColor, margin: 0, fontSize: '1.2rem' }}>
            {language === 'mr' ? 'अतिरिक्त वस्तू' : 'Extra Items'}
          </h2>
          <p style={{ color: '#555', fontSize: '0.65rem', margin: '4px 0 0', fontWeight: '700', letterSpacing: '0.5px' }}>
            {language === 'mr' ? 'थंड पेये, आईस्क्रीम आणि इतर' : 'COLD DRINKS · ICE CREAM · SNACKS & MORE'}
          </p>
        </div>
        <X size={28} color={primaryColor} onClick={() => setIsExtraItemsOpen(false)} />
      </div>

      <div style={styles.modalScrollBody}>

        {/* SEARCH */}
        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.15)', borderRadius: '12px', padding: '10px 14px', gap: '10px' }}>
            <Search size={16} color={primaryColor} />
            <input
              type="text"
              placeholder={language === 'mr' ? 'वस्तू शोधा...' : 'Search items...'}
              value={extraItemSearchQuery}
              onChange={e => setExtraItemSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem', width: '100%' }}
            />
          </div>
        </div>

        {/* CATEGORY PILLS */}
        {(() => {
          const cats = ['All', ...new Set(extraItems.filter(i => i.isAvailable).map(i => i.category))];
          return (
            <div style={{ display: 'flex', gap: '8px', padding: '8px 20px 14px', overflowX: 'auto' }} className="no-scrollbar">
              {cats.map(cat => (
                <button key={cat} onClick={() => setActiveExtraCategory(cat)} style={{
                  padding: '7px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontSize: '0.65rem', fontWeight: '900', whiteSpace: 'nowrap', flexShrink: 0,
                  background: activeExtraCategory === cat ? primaryColor : 'rgba(211,191,162,0.06)',
                  color: activeExtraCategory === cat ? '#1a1a1a' : '#555',
                  outline: activeExtraCategory === cat ? 'none' : '1px solid rgba(211,191,162,0.12)',
                  transition: 'all 0.15s'
                }}>
                  {cat === 'All' ? (language === 'mr' ? 'सर्व' : 'ALL') : cat}
                </button>
              ))}
            </div>
          );
        })()}

        {/* ITEMS LIST */}
        {(() => {
          const categoryEmojis = {
            'Cold Drinks': '🥤', 'Ice Cream': '🍦', 'Packaged Snacks': '🍟',
            'Juices': '🧃', 'Mineral Water': '💧',
            'Dairy': '🥛', 'Sweets': '🍬', 'Other': '📦'
          };

          const filtered = extraItems.filter(i => {
            if (!i.isAvailable) return false;
            const matchCat = activeExtraCategory === 'All' || i.category === activeExtraCategory;
            const matchSearch = i.name.toLowerCase().includes(extraItemSearchQuery.toLowerCase());
            return matchCat && matchSearch;
          });

          if (filtered.length === 0) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#333' }}>
              <ShoppingBag size={32} color="#2a2a2a" style={{ marginBottom: '14px' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                {language === 'mr' ? 'कोणतीही वस्तू सापडली नाही' : 'No items found'}
              </div>
            </div>
          );

          // Group by category
          const grouped = {};
          filtered.forEach(item => {
            const cat = item.category || 'Other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
          });

          return (
            <div style={{ padding: '0 16px 120px' }}>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: '28px' }}>
                  {/* Category label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
                    <span style={{ fontSize: '1rem' }}>{categoryEmojis[cat] || '📦'}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{cat}</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(211,191,162,0.08)' }} />
                  </div>

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map(item => {
                      const qty = extraItemCart[item._id] || 0;
                      const isLow = item.currentStock > 0 && item.currentStock <= 5;
                      const isOut = item.currentStock <= 0;
                      return (
                        <motion.div
                          key={item._id}
                          layout
                          style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            background: qty > 0 ? 'rgba(211,191,162,0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${qty > 0 ? 'rgba(211,191,162,0.25)' : 'rgba(211,191,162,0.07)'}`,
                            borderRadius: '16px', padding: '14px 16px',
                            opacity: isOut ? 0.4 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Emoji icon */}
                          <div style={{
                            width: '46px', height: '46px', borderRadius: '12px',
                            background: 'rgba(211,191,162,0.06)',
                            border: '1px solid rgba(211,191,162,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', flexShrink: 0
                          }}>
                            {categoryEmojis[item.category] || '📦'}
                          </div>

                          {/* Name + price */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff', marginBottom: '2px', lineHeight: '1.3' }}>
                              {item.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: primaryColor }}>
                                ₹{item.price}
                              </span>
                              <span style={{ fontSize: '0.58rem', color: '#444', fontWeight: '700' }}>
                                / {item.unit}
                              </span>
                              {isOut && (
                                <span style={{ fontSize: '0.55rem', padding: '2px 7px', background: 'rgba(192,57,43,0.12)', color: '#c0392b', borderRadius: '4px', fontWeight: '900', border: '1px solid rgba(192,57,43,0.25)' }}>
                                  {language === 'mr' ? 'उपलब्ध नाही' : 'OUT OF STOCK'}
                                </span>
                              )}
                              {isLow && !isOut && (
                                <span style={{ fontSize: '0.55rem', padding: '2px 7px', background: 'rgba(186,117,23,0.1)', color: '#BA7517', borderRadius: '4px', fontWeight: '900', border: '1px solid rgba(186,117,23,0.2)' }}>
                                  {language === 'mr' ? `फक्त ${item.currentStock} शिल्लक` : `Only ${item.currentStock} left`}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: '0.62rem', color: '#444', marginTop: '3px', lineHeight: '1.3' }}>
                                {item.description}
                              </div>
                            )}
                          </div>

                          {/* Counter / Add button */}
                          {isOut ? (
                            <div style={{ width: '80px', textAlign: 'center', fontSize: '0.6rem', color: '#333', fontWeight: '900' }}>
                              {language === 'mr' ? 'उपलब्ध नाही' : 'UNAVAILABLE'}
                            </div>
                          ) : qty === 0 ? (
                            <button
                              onClick={() => setExtraItemCart(prev => ({ ...prev, [item._id]: 1 }))}
                              style={{
                                padding: '9px 18px', borderRadius: '10px', border: `1px solid ${primaryColor}`,
                                background: 'transparent', color: primaryColor, fontWeight: '900',
                                fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0,
                                transition: 'all 0.15s'
                              }}
                            >
                              {language === 'mr' ? 'निवडा' : 'ADD'}
                            </button>
                          ) : (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              background: 'rgba(211,191,162,0.12)', padding: '6px 10px',
                              borderRadius: '10px', flexShrink: 0
                            }}>
                              <button
                                onClick={() => setExtraItemCart(prev => {
                                  const newCart = { ...prev };
                                  if (newCart[item._id] <= 1) delete newCart[item._id];
                                  else newCart[item._id] -= 1;
                                  return newCart;
                                })}
                                style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                              >
                                <Minus size={16} />
                              </button>
                              <span style={{ fontSize: '0.95rem', fontWeight: '900', color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                                {qty}
                              </span>
                              <button
                                onClick={() => setExtraItemCart(prev => ({ ...prev, [item._id]: (prev[item._id] || 0) + 1 }))}
                                style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* STICKY FOOTER — shows only when items selected */}
      <AnimatePresence>
        {Object.keys(extraItemCart).length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '16px 20px 34px',
              background: 'linear-gradient(to top, #1a1a1a 80%, transparent)',
              borderTop: '1px solid rgba(211,191,162,0.08)'
            }}
          >
            {/* Order summary line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: '800' }}>
                {Object.values(extraItemCart).reduce((a, b) => a + b, 0)} {language === 'mr' ? 'वस्तू निवडल्या' : 'items selected'}
              </div>
              <div style={{ fontSize: '0.78rem', color: primaryColor, fontWeight: '900' }}>
                {language === 'mr' ? 'अंदाजे' : 'Est.'} ₹{Object.entries(extraItemCart).reduce((acc, [id, qty]) => {
                  const item = extraItems.find(i => i._id === id);
                  return acc + (item?.price || 0) * qty;
                }, 0).toLocaleString()}
              </div>
            </div>

            <button
              onClick={sendExtraItemsRequest}
              style={{
                width: '100%', padding: '18px',
                background: `linear-gradient(135deg, ${primaryColor}, #bda88a)`,
                border: 'none', borderRadius: '16px',
                color: '#1a1a1a', fontWeight: '900', fontSize: '0.95rem',
                cursor: 'pointer', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 8px 24px rgba(211,191,162,0.2)'
              }}
            >
              <BellRing size={18} color="#1a1a1a" />
              {language === 'mr' ? 'वेटरला विनंती पाठवा' : 'REQUEST TO WAITER'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )}
</AnimatePresence>

      {/* CHECKOUT / BILL SUMMARY PAGE */}
{/* CHECKOUT / BILL SUMMARY PAGE */}
      <AnimatePresence>
        {isBillOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{...styles.fullscreenModal, zIndex: 6000}}>
            <div style={styles.modalHeader}>
              <h2 style={{color: primaryColor}}>{t[language].checkout}</h2>
              <X size={30} color={primaryColor} onClick={() => { setIsBillOpen(false); setBillRequested(false); setShowReviewPage(false); }} />
            </div>
            
            <div style={styles.modalScrollBody}>
              {!billRequested ? (
                <div style={styles.formContainer}>
                   <p style={styles.instructionText}>{t[language].enterDetails}</p>
                   <input type="text" placeholder={t[language].fullName} style={styles.input} value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} />
                   <input type="tel" placeholder={t[language].mobileNumber} style={styles.input} value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                   <button style={{...styles.kitchenBtn, background: primaryColor}} onClick={requestFinalBill}>{t[language].generateBill}</button>
                </div>
              ) : !showReviewPage ? (
                <div style={styles.thankYouWrapperProfessional}>
                   <div style={styles.statusIconWrapper}><CheckCircle2 size={50} color={primaryColor} /></div>
                   <h2 style={styles.professionalTitle}>{t[language].thankYou}</h2>
                   <p style={styles.professionalSubtitle}>{t[language].receiptSent}</p>
                   
                   {/* 📱 ON-SCREEN UI: KEEPS YOUR ORIGINAL DESIGN COMPLETELY UNTOUCHED */}
                   <div style={styles.billBriefCard}>
                      <div style={styles.billBriefHeader}><ReceiptText size={18} /> {t[language].billSummary}</div>
                      
                      <div style={styles.billTableHead}>
                         <span style={{flex: 2}}>Item</span>
                         <span style={{flex: 0.5, textAlign: 'center'}}>{t[language].qty}</span>
                         <span style={{flex: 1, textAlign: 'right'}}>{t[language].amt}</span>
                      </div>
                      
                      {/* 🚀 FIXED: Maps over the aggregated finalBillItems instead of the raw placedOrders */}
<div style={styles.billTableBody}>
  {finalBillItems.map((order, idx) => (
    <div key={idx} style={styles.billTableRow}>
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {order.quantity}x {language === 'mr' ? (order.name_mr || order.name) : order.name}
          {order.isExtraItem && (
            <span style={{
              fontSize: '0.48rem', padding: '2px 5px',
              background: 'rgba(211,191,162,0.08)',
              border: '1px solid rgba(211,191,162,0.15)',
              borderRadius: '4px', color: '#8a704d',
              fontWeight: '900', letterSpacing: '0.5px'
            }}>EXTRA</span>
          )}
        </span>
        <span style={{ fontSize: '0.65rem', color: primaryColor }}>
          {order.portion !== 'Single' ? order.portion : ''}
          {order.isExtraItem ? ` · ₹${order.pricePerUnit} each` : ''}
        </span>
      </div>
      <span style={{ flex: 1, textAlign: 'right', fontSize: '0.85rem' }}>
        ₹{convertToMrNumber(order.subtotal)}
      </span>
    </div>
  ))}
</div>
                      <div style={styles.billTableFooter}>
                         <div style={styles.billLineTotal}>
                            <span>{t[language].grandTotal}</span>
                            <span style={{color: primaryColor, fontSize: '1.2rem'}}>₹{convertToMrNumber(calculateGrandTotal())}</span>
                         </div>
                      </div>
                   </div>

                   {/* ========================================================================= */}
                   {/* 📥 PRINT DOM ENGINE ROOT: AUTO-SIZED & SHIFTED FOR PERFECT 1-PAGE A4 CENTERING */}
                   {/* ========================================================================= */}
                {/* 📥 PRINT DOM ENGINE ROOT: UPDATED WITH AGGREGATED finalBillItems */}
<div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
  <div id="pdf-rendering-frame" style={{ width: '210mm', display: 'flex', justifyContent: 'center', background: '#ffffff', padding: '15mm 0' }}>
    {receiptData && (
      <div id="customer-pdf-invoice" style={{ background: '#ffffff', color: '#000000', padding: '40px 25px', width: '420px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* 1. Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h4 style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#888' }}>TAX INVOICE</h4>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '8px 0', color:"black" }}>{restaurantData?.name || 'PRATYEKSHA'}</h1>
          <p style={{ fontSize: '0.7rem', color: '#333', margin: 0 }}>{restaurantData?.address?.street}, {restaurantData?.address?.city}</p>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', marginTop: '4px' }}>GSTIN: {restaurantData?.gstin || "GSTIN PENDING"}</p>
        </div>

        {/* 2. Bill & Customer Meta Info */}
        <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '10px 0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div><div style={{ fontSize: '0.65rem', color: '#666' }}>BILL NO.</div><div style={{ fontWeight: '900' }}>#{receiptData.billNo}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.8rem', fontWeight: '800' }}>{receiptData.date}</div><div style={{ fontSize: '0.75rem' }}>{receiptData.time}</div></div>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
            <div>Customer: {customerInfo.name || "N/A"}</div>
            <div>Phone: {customerInfo.phone || "N/A"}</div>
            <div>Table: {tableNumber}</div>
          </div>
        </div>

      {/* 3. Aggregated Items (Using finalBillItems for grouping) */}
<div style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: '900', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
     <span>ITEM DESCRIPTION</span>
     <span>TOTAL</span>
  </div>
{finalBillItems.map((order, idx) => (
  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>
        {convertToMrNumber(order.quantity)}x {language === 'mr' ? (order.name_mr || order.name) : order.name}
        {order.isExtraItem ? ' ⬦' : ''}
      </span>
      <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px', fontWeight: '500' }}>
        @ ₹{convertToMrNumber(order.pricePerUnit)}
        {order.portion !== 'Single' ? ` (${order.portion})` : ''}
        {order.isExtraItem ? ' · Extra Item' : ''}
      </span>
    </div>
    <b style={{ fontSize: '0.9rem', fontWeight: '900' }}>₹{convertToMrNumber(order.subtotal)}</b>
  </div>
))}
{/* Extra items footnote in PDF */}
{finalBillItems.some(i => i.isExtraItem) && (
  <div style={{ fontSize: '0.62rem', color: '#999', marginTop: '8px', fontStyle: 'italic' }}>
    ⬦ Extra items ordered separately at counter
  </div>
)}
</div>

{/* 4. Tax & Grand Total Block (To match your uploaded invoice style) */}
<div style={{ padding: '15px 0', fontSize: '0.85rem', color: '#000000', borderBottom: '2px solid #000' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Subtotal</span><span>₹{(calculateGrandTotal() / 1.05).toFixed(2)}</span></div>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>CGST (2.5%)</span><span>₹{(calculateGrandTotal() * 0.025).toFixed(2)}</span></div>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST (2.5%)</span><span>₹{(calculateGrandTotal() * 0.025).toFixed(2)}</span></div>
</div>

<div style={{ marginTop: '15px', fontWeight: '900', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
  <span>GRAND TOTAL</span>
  <span>₹{convertToMrNumber(calculateGrandTotal())}</span>
</div>
{/* 6. Branding Footer */}
        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.6rem', fontWeight: '900', color: '#888', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
          POWERED BY PRATYEKSHA
        </div>
      
      </div>
    )}
  </div>
</div>

                   {/* INTERACTIVE CONTROLS CONTAINER ROW */}
                   <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 10px' }}>
                      <button 
                        style={{ width: '100%', padding: '18px', borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)', color: '#000000', fontWeight: '900', border: '1px solid #e2e2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                        onClick={() => {
                          import('html2pdf.js').then((html2pdf) => {
                            const element = document.getElementById('pdf-rendering-frame');
                            const opt = {
                              margin:       [0, 0, 0, 0],
                              filename:     `TaxInvoice_Table_${tableNumber}.pdf`,
                              image:        { type: 'jpeg', quality: 1.0 },
                              html2canvas:  { scale: 3, backgroundColor: '#ffffff', useCORS: true, logging: false },
                              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                            };
                            html2pdf.default().set(opt).from(element).save();
                          });
                        }}
                      >
                        <ReceiptText size={18} color="#000000" strokeWidth={2.5} /> 
                        <span>DOWNLOAD TAX INVOICE PDF</span>
                      </button>

                      <button style={styles.professionalContinueBtn} onClick={() => setShowReviewPage(true)}>
                         {t[language].continue} <ChevronRight size={18} />
                      </button>
                   </div>
                </div>
              ) : (
                <div style={styles.thankYouWrapperProfessional}>
                   <div style={styles.statusIconWrapper}><Sparkles size={50} color={primaryColor} /></div>
                   <h2 style={styles.professionalTitle}>{t[language].visitAgain}</h2>
                   <p style={styles.professionalSubtitle}>We hope you enjoyed our service! Help us grow by rating us.</p>
                   
                   {restaurantData?.googleReview && (
                      <a href={restaurantData.googleReview} target="_blank" rel="noreferrer" style={styles.googleProfessionalBtn}>
                        <div style={styles.googleIconCircle}>
                           <svg width="22" height="22" viewBox="0 0 24 24" fill="#4285F4">
                             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                           </svg>
                        </div>
                        <span style={{flex: 1, textAlign: 'center'}}>{t[language].rateGoogle}</span>
                        <ChevronRight size={18} color="#888" />
                      </a>
                   )}
                   <button style={styles.professionalMenuBack} onClick={() => { setBillRequested(false); setIsBillOpen(false); setShowReviewPage(false); }}>
                      {t[language].backMenu}
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* CART DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && ( 
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={styles.sideDrawer}>
            <div style={styles.drawerHeader}>
              <h2 style={{color: primaryColor}}>{t[language].roundOrder}</h2>
              <X size={30} color={primaryColor} onClick={() => setIsDrawerOpen(false)} />
            </div>
            <div style={styles.drawerContent}>
              {totalItemsInCart > 0 ? (
                Object.entries(cart).map(([key, qty]) => { 
                  const isMulti = key.includes('-'); 
                  const id = isMulti ? key.split('-')[0] : key; 
                  const portion = isMulti ? key.split('-')[1] : ''; 
                  const item = allMenuItems.find(i => i._id === id); 
                  return (
                    <div key={key} style={{...styles.drawerItemBlock, borderBottom: `1px solid ${borderColor}`}}>
                      <div style={styles.drawerRow}>
                        <div style={{textAlign:'left'}}>
                          <p style={{margin:0, fontWeight:'600', color: '#fff'}}>{language === 'mr' ? item?.name_mr : item?.name}</p>
                          {portion && <small style={{color: primaryColor}}>{t[language][portion.toLowerCase()] || portion}</small>}
                        </div>
                        <span style={{fontWeight:'700', color: primaryColor}}>x{convertToMrNumber(qty)}</span>
                      </div>
                      <div style={styles.suggestionInputWrapper}>
                        <StickyNote size={14} style={{color: primaryColor, opacity: 0.7}} />
                        <input type="text" placeholder={t[language].notes} style={styles.suggestionInput} value={suggestions[key] || ""} onChange={(e) => setSuggestions(prev => ({ ...prev, [key]: e.target.value }))} />
                      </div>
                    </div>
                  );
                })
              ) : ( <p style={{textAlign:'center', color:'#555', marginTop:'40px'}}>{t[language].emptyRound}</p> )}
            </div>

<div style={styles.drawerFooter}>
  {totalItemsInCart > 0 && (
    <button style={{...styles.kitchenBtn, background: primaryColor}}
onClick={isCounterScan
  ? counterMode === 'reservation' ? placeReservation : placeWaitlistOrder
  : sendBatchToKitchen}>
  {isCounterScan
    ? counterMode === 'dine-in'
      ? (language === 'mr' ? 'रांगेत ऑर्डर द्या ✓' : 'PLACE WAITLIST ORDER ✓')
      : counterMode === 'reservation'
      ? (language === 'mr' ? 'बुकिंग कन्फर्म करा ✓' : 'CONFIRM RESERVATION ✓')
      : (language === 'mr' ? 'पिकअप ऑर्डर द्या ✓' : 'PLACE PICKUP ORDER ✓')
    : t[language].orderNow}
    </button>
  )}
  {!isCounterScan && (
    <button style={styles.billLinkBtn} onClick={() => { setIsDrawerOpen(false); setIsBillOpen(true); }}>
      {t[language].viewFinalBill}
    </button>
  )}
</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModel && ( 
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalOverlay}>
            <div style={styles.modalNav}>
              <div style={{textAlign: 'left'}}><h2 style={{...styles.modalTitle, color: primaryColor}}>{language === 'mr' ? activeModel.name_mr : activeModel.name}</h2><small style={{color: '#777'}}>{t[language].zoomRotate}</small></div>
              <X size={30} color={primaryColor} onClick={() => setActiveModel(null)} />
            </div>
            <div style={styles.modelContainer}>
              <div style={styles.dishModelWrapper}><model-viewer src={activeModel.modelUrl} ar ar-modes="webxr scene-viewer quick-look" camera-controls auto-rotate shadow-intensity="1" style={{ width: '100%', height: '100%' }} /></div>
              {activeModel.isChefSpecial === true && (
                <div style={styles.chefContainerAR}>
                   <div style={styles.chefFlexWrapper}><div style={styles.chefModelBox}><model-viewer src={activeModel.chefurl} autoplay style={{ width: '130px', height: '220px' }} camera-orbit="10deg 80deg 3m" camera-target="0m 0.8m 0m" interaction-prompt="none" shadow-intensity="0" /></div><div style={styles.chefBubbleRight}><MessageSquare size={12} style={{position: 'absolute', top: '15px', left: '-8px', color: '#fff'}} />"{activeModel.chefMessage || "My personal favorite! You'll love the flavors."}"</div></div>
                </div>
              )}
              <div style={styles.fixedArButtonWrapper}><button onClick={() => document.querySelector('model-viewer')?.activateAR()} style={{...styles.arCustomBtn, background: primaryColor}}>{t[language].viewInSpace}</button></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
<AnimatePresence>
  {welcomeCard && !welcomeDismissed && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', padding: '0 0 20px',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        style={{
          width: '100%', maxWidth: '440px',
          background: '#0c0c0c',
          border: '1px solid rgba(211,191,162,0.15)',
          borderRadius: '28px 28px 20px 20px',
          overflow: 'hidden', margin: '0 12px',
          maxHeight: '88vh', overflowY: 'auto'
        }}
        className="no-scrollbar"
      >
        {/* Gold shimmer top line */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.7), transparent)', flexShrink: 0 }} />

        {/* HERO HEADER */}
        <div style={{
          padding: '22px 22px 18px',
          background: 'linear-gradient(180deg, rgba(211,191,162,0.07) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          position: 'relative'
        }}>
          {/* Dismiss button */}
          <button onClick={() => setWelcomeDismissed(true)} style={{
            position: 'absolute', top: '18px', right: '18px',
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#555', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginRight: '36px' }}>
            {/* Avatar with loyalty tier */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '18px',
                background: 'rgba(211,191,162,0.08)',
                border: '1px solid rgba(211,191,162,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                {welcomeCard.isLoyal ? '🏅' : welcomeCard.visitCount >= 2 ? '⭐' : '👋'}
              </div>
              {/* Visit count badge */}
              {welcomeCard.visitCount > 1 && (
                <div style={{
                  position: 'absolute', bottom: '-6px', right: '-6px',
                  background: 'rgba(211,191,162,0.9)',
                  color: '#000', fontSize: '0.5rem', fontWeight: '900',
                  padding: '2px 6px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.2)'
                }}>
                  {welcomeCard.visitCount}×
                </div>
              )}
            </div>

            {/* Greeting */}
            <div>
              <div style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.35)', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                {welcomeCard.isLoyal ? 'LOYAL GUEST 🏅' : welcomeCard.visitCount >= 2 ? 'WELCOME BACK!' : 'WELCOME'}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {language === 'en' ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ` : 'नमस्कार, '}
                {welcomeCard.name?.split(' ')[0]}!
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: '3px', fontWeight: '500' }}>
                {restaurantData?.name}
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '18px 20px 20px' }}>

          {/* ── STATS ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {[
              {
                icon: '🍽️',
                label: language === 'mr' ? 'भेटी' : 'Visits',
                val: welcomeCard.visitCount || 1,
                mono: true
              },
              {
                icon: '💰',
                label: language === 'mr' ? 'एकूण खर्च' : 'Total Spent',
                val: welcomeCard.totalSpend > 0 ? `₹${welcomeCard.totalSpend.toLocaleString()}` : '—',
                gold: true
              },
              {
                icon: '📅',
                label: language === 'mr' ? 'शेवटची भेट' : 'Last Visit',
                val: welcomeCard.lastVisit
                  ? new Date(welcomeCard.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : '—',
                small: true
              }
            ].map((s, i) => (
              <div key={i} style={{
                background: '#111', border: '1px solid rgba(211,191,162,0.07)',
                borderRadius: '12px', padding: '12px 10px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1rem', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{
                  fontSize: s.small ? '0.76rem' : s.mono ? '1.1rem' : '0.88rem',
                  fontWeight: '900', color: s.gold ? '#d3bfa2' : '#fff',
                  fontFamily: s.mono ? 'monospace' : 'inherit',
                  lineHeight: 1.1, marginBottom: '4px'
                }}>
                  {s.val}
                </div>
                <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── ALL-TIME FAVOURITE DISH ── */}
          {welcomeCard.favDish && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '13px 15px', marginBottom: '10px',
              background: 'rgba(211,191,162,0.05)',
              border: '1px solid rgba(211,191,162,0.12)',
              borderRadius: '14px', position: 'relative', overflow: 'hidden'
            }}>
              {/* Glow accent */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(211,191,162,0.07) 0%, transparent 70%)', borderRadius: '0 14px 0 60px' }} />
              <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>🌟</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.48rem', color: 'rgba(211,191,162,0.35)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {language === 'mr' ? 'आवडता पदार्थ' : 'All-Time Favourite'}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#d3bfa2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {welcomeCard.favDish.name}
                </div>
                {welcomeCard.favDish.count > 1 && (
                  <div style={{ fontSize: '0.58rem', color: 'rgba(211,191,162,0.3)', marginTop: '2px' }}>
                    {language === 'mr' ? `${welcomeCard.favDish.count} वेळा ऑर्डर केले` : `Ordered ${welcomeCard.favDish.count} times`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TOP DISHES (all-time) ── */}
          {welcomeCard.allDishes?.length > 1 && (
            <div style={{
              padding: '13px 15px', marginBottom: '10px',
              background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.07)',
              borderRadius: '14px'
            }}>
              <div style={{ fontSize: '0.48rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={10} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
                {language === 'mr' ? 'तुमचे सर्वात जास्त ऑर्डर' : 'Your Most Ordered'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {welcomeCard.allDishes.slice(0, 4).map((dish, i) => {
                  const maxCount = welcomeCard.allDishes[0]?.count || 1;
                  const pct = Math.round((dish.count / maxCount) * 100);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '16px', fontSize: '0.6rem', color: 'rgba(211,191,162,0.2)', fontFamily: 'monospace', fontWeight: '900', textAlign: 'right', flexShrink: 0 }}>
                        #{i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.72rem', color: i === 0 ? '#d3bfa2' : 'rgba(255,255,255,0.4)', fontWeight: i === 0 ? '800' : '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                            {dish.name}
                          </span>
                          <span style={{ fontSize: '0.58rem', color: 'rgba(211,191,162,0.3)', fontFamily: 'monospace', flexShrink: 0, marginLeft: '6px' }}>
                            {dish.count}×
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? 'rgba(211,191,162,0.6)' : 'rgba(211,191,162,0.2)', borderRadius: '1px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── LAST ORDER ── */}
          {welcomeCard.lastOrderItems?.length > 0 && (
            <div style={{
              padding: '13px 15px', marginBottom: '14px',
              background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.07)',
              borderRadius: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.48rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Timer size={10} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
                  {language === 'mr' ? 'शेवटची ऑर्डर' : 'Last Order'}
                </div>
                {welcomeCard.lastOrderDate && (
                  <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.15)', fontWeight: '600' }}>
                    {new Date(welcomeCard.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {welcomeCard.lastOrderItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: '900', color: 'rgba(211,191,162,0.25)', fontFamily: 'monospace', minWidth: '20px' }}>
                      ×{item.quantity}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                    {item.subtotal > 0 && (
                      <span style={{ fontSize: '0.66rem', color: 'rgba(211,191,162,0.3)', fontFamily: 'monospace', flexShrink: 0 }}>
                        ₹{item.subtotal}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LOYALTY MESSAGE ── */}
          {welcomeCard.isLoyal && (
            <div style={{
              padding: '12px 15px', marginBottom: '14px',
              background: 'rgba(211,191,162,0.04)',
              border: '1px solid rgba(211,191,162,0.12)',
              borderRadius: '12px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>🏅</div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#d3bfa2', marginBottom: '3px' }}>
                {language === 'mr' ? 'तुम्ही लॉयल गेस्ट आहात!' : "You're a Loyal Guest!"}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>
                {language === 'mr'
                  ? `${welcomeCard.visitCount} भेटींसाठी धन्यवाद — तुम्ही आमच्यासाठी खास आहात.`
                  : `Thank you for your ${welcomeCard.visitCount} visits — you're special to us.`}
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <button
            onClick={() => {
              localStorage.setItem(`pratyeksha_phone_${tenantId}`, welcomePhone);
              setWelcomeDismissed(true);
            }}
            style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
              border: 'none', borderRadius: '14px',
              color: '#0c0c0c', fontWeight: '900', fontSize: '0.88rem',
              cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 8px 24px rgba(211,191,162,0.18)'
            }}
          >
            <Utensils size={15} strokeWidth={2.5} />
            {language === 'mr' ? 'चला ऑर्डर देऊया!' : "LET'S ORDER →"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


{/* ── PHONE PROMPT (new customers / unrecognized) ── */}
<AnimatePresence>
  {showPhonePrompt && !welcomeCard && !welcomeDismissed && !isCounterScan && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', padding: '0 0 28px',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: '420px',
          background: '#0d0d0d',
          border: '1px solid rgba(211,191,162,0.12)',
          borderRadius: '24px 24px 18px 18px',
          overflow: 'hidden', margin: '0 14px'
        }}
      >
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.4), transparent)' }} />

        <div style={{ padding: '22px 22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.3)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px' }}>
                {restaurantData?.name}
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.3px' }}>
                {language === 'mr' ? 'तुम्ही आधी आलेले आहात का?' : 'Been here before?'}
              </h3>
              <p style={{ margin: '5px 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                {language === 'mr'
                  ? 'नंबर द्या — शेवटची ऑर्डर दाखवतो!'
                  : 'Enter your number and we\'ll show your last order.'}
              </p>
            </div>
            <button onClick={() => { setShowPhonePrompt(false); setWelcomeDismissed(true); }} style={{
              width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: '#444', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <X size={14} />
            </button>
          </div>

          {/* Phone input */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'rgba(211,191,162,0.4)', fontWeight: '700', pointerEvents: 'none' }}>+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={welcomePhoneInput}
              onInput={e => setWelcomePhoneInput(e.target.value.replace(/\D/g,'').slice(0,10))}
              style={{
                width: '100%', padding: '14px 16px 14px 52px',
                background: '#111', border: '1px solid rgba(211,191,162,0.15)',
                color: '#fff', borderRadius: '12px', fontSize: '1rem',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'Poppins, sans-serif', letterSpacing: '1.5px',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(211,191,162,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(211,191,162,0.15)'}
              onKeyDown={e => { if (e.key === 'Enter' && welcomePhoneInput.length === 10) document.getElementById('recognize-btn').click(); }}
              autoFocus
            />
          </div>

          <button
            id="recognize-btn"
            disabled={welcomePhoneInput.length !== 10 || welcomeLoading}
            onClick={async () => {
              const phone = welcomePhoneInput;
              localStorage.setItem(`pratyeksha_phone_${tenantId}`, phone);
              setWelcomeLoading(true);
              try {
                const res = await axios.get(`${BASE_URL}/customers/recognize/${tenantId}/${phone}`);
                if (res.data?.found) {
                  setWelcomePhone(phone);
                  setWelcomeCard(res.data);
                  setShowPhonePrompt(false);
                } else {
                  // New customer — just dismiss
                  setShowPhonePrompt(false);
                  setWelcomeDismissed(true);
                }
              } catch {
                setShowPhonePrompt(false);
                setWelcomeDismissed(true);
              } finally { setWelcomeLoading(false); }
            }}
            style={{
              width: '100%', padding: '14px',
              background: welcomePhoneInput.length === 10
                ? 'linear-gradient(135deg,#d3bfa2,#bda88a)'
                : 'rgba(211,191,162,0.05)',
              border: welcomePhoneInput.length === 10 ? 'none' : '1px solid rgba(211,191,162,0.1)',
              color: welcomePhoneInput.length === 10 ? '#0c0c0c' : 'rgba(211,191,162,0.2)',
              borderRadius: '12px', fontWeight: '900', fontSize: '0.82rem',
              cursor: welcomePhoneInput.length === 10 ? 'pointer' : 'not-allowed',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {welcomeLoading
              ? (language === 'mr' ? 'शोधत आहे...' : 'Checking...')
              : (language === 'mr' ? 'तपासा' : 'CHECK MY HISTORY')}
            {!welcomeLoading && <ChevronRight size={15} />}
          </button>

          <button
            onClick={() => { setShowPhonePrompt(false); setWelcomeDismissed(true); }}
            style={{
              width: '100%', marginTop: '10px', padding: '11px',
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.15)', fontSize: '0.72rem',
              cursor: 'pointer', fontWeight: '700'
            }}
          >
            {language === 'mr' ? 'वगळा' : 'Skip'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


<style>{`
  .no-scrollbar::-webkit-scrollbar { display: none; }
  * { -webkit-tap-highlight-color: transparent; }
  html, body, #root { 
    height: 100%; 
    overflow-x: hidden; 
  }
`}</style>
</div>
  );
};

const styles = {
body: { 
  minHeight: '100vh', 
  fontFamily: 'Poppins, sans-serif', 
  color: '#fff', 
  overflowX: 'hidden',
  overflowY: 'auto',          // ← ADD THIS
  WebkitOverflowScrolling: 'touch'  // ← ADD THIS for iOS momentum scroll
},
contentWrapper: { 
  touchAction: 'pan-y',       // keep existing
  overflowY: 'visible',       // ← ADD THIS — don't clip children
},  header: { padding: '50px 20px 10px', textAlign: 'center' },
  searchWrapper: { padding: '0 20px 15px' },
  searchContainer: { display: 'flex', alignItems: 'center', background: 'rgba(211, 191, 162, 0.05)', border: '1px solid rgba(211, 191, 162, 0.2)', borderRadius: '15px', padding: '12px 15px', gap: '10px' },
  searchInput: { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.9rem' },
  langToggleBox: { position: 'absolute', top: '15px', right: '15px' },
  langBtn: { background: 'rgba(211, 191, 162, 0.05)', border: '1px solid', padding: '6px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center' },
  cafeName: { fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', fontWeight: '800' },
  poweredBy: { fontSize: '0.6rem', letterSpacing: '3px', marginTop: '5px', opacity: 0.5 },
  navContainer: { position: 'sticky', top: '0', zIndex: 999, borderBottom: '1px solid rgba(211, 191, 162, 0.15)' },
  navScroll: { display: 'flex', overflowX: 'auto', padding: '16px 10px', gap: '20px', whiteSpace: 'nowrap' },
  navItem: { background: 'none', border: 'none', fontWeight: '800', fontSize: '0.72rem', flexShrink: 0, padding: '6px 5px', position: 'relative', outline: 'none' },
  activeUnderline: { position: 'absolute', bottom: '-8px', left: '0', right: '0', height: '3px', background: '#d3bfa2', borderRadius: '10px' },
  menuContainer: { padding: '10px 15px 120px', maxWidth: '600px', margin: '0 auto' },
  menuCard: { borderRadius: '24px', padding: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', border: '1px solid', position: 'relative' },
  itemContentLeft: { flex: 1, paddingRight: '12px', textAlign: 'left' },
  itemDesc: { fontSize: '0.6rem', color: '#888', lineHeight: '1.4' },
  priceContainer: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: '0.75rem', fontWeight: '600' },
  counterRowSmall: { display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px', borderRadius: '8px', background: 'rgba(211, 191, 162, 0.15)' },
  qtyBtnSmall: { background: 'none', border: 'none', color: '#d3bfa2', fontWeight: 'bold' },
  addBtnSmall: { background: 'none', border: '1px solid', fontSize: '0.6rem', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', color: '#d3bfa2' },
  view3dBtn: { color: '#1a1a1a', width: '40px', height: '40px', borderRadius: '50%', border: 'none', fontSize: '0.6rem', fontWeight: '900' },
  rightFabContainer: { position: 'fixed', bottom: '30px', right: '25px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 1000 },
  fabBase: { width: '65px', height: '65px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  fabBadge: { position: 'absolute', top: '2px', right: '2px', background: '#fff', color: '#000', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.65rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fullscreenModal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#1a1a1a', zIndex: 5000, display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(211, 191, 162, 0.1)' },
  modalScrollBody: { flex: 1, overflowY: 'auto', paddingBottom: '50px' },
  waiterCardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '25px' },
  waiterCountCard: { background: 'rgba(211, 191, 162, 0.05)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(211, 191, 162, 0.1)' },
  waiterLabel: { fontSize: '0.8rem', margin: '10px 0', fontWeight: '600' },
  countControls: { display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '5px 10px', borderRadius: '12px' },
  countBtn: { background: 'none', border: 'none', color: '#d3bfa2' },
  countDisplay: { fontSize: '1rem', fontWeight: '800', minWidth: '20px', textAlign: 'center' },
  waiterActionRow: { width: '100%', marginBottom: '10px', padding: '18px', borderRadius: '15px', background: 'rgba(211, 191, 162, 0.05)', border: '1px solid rgba(211, 191, 162, 0.2)', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '600' },
  kitchenBtn: { width: '100%', padding: '20px', borderRadius: '15px', fontWeight: '900', border: 'none', color: '#1a1a1a' },
  input: { padding: '18px', borderRadius: '15px', background: '#222', border: '1px solid #333', color: '#fff', marginBottom: '15px', outline: 'none' },
  instructionText: { color: '#888', fontSize: '0.85rem', textAlign: 'center', marginBottom: '20px' },
  thankYouWrapperProfessional: { padding: '40px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statusIconWrapper: { width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(211, 191, 162, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' },
  professionalTitle: { fontSize: '2rem', fontWeight: '800', color: '#fff', margin: '0 0 10px' },
  professionalSubtitle: { color: '#888', textAlign: 'center', fontSize: '0.95rem', marginBottom: '40px', maxWidth: '300px' },
  billBriefCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(211, 191, 162, 0.1)', borderRadius: '20px', width: '100%', padding: '20px', marginBottom: '40px' },
  billBriefHeader: { color: '#d3bfa2', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  billTableHead: { display: 'flex', paddingBottom: '10px', borderBottom: '1px solid rgba(211, 191, 162, 0.2)', marginBottom: '15px', fontSize: '0.75rem', fontWeight: '800', color: '#777', textTransform: 'uppercase' },
  billTableBody: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
  billTableRow: { display: 'flex', alignItems: 'center' },
  billTableFooter: { paddingTop: '15px', borderTop: '1px dashed rgba(211, 191, 162, 0.3)' },
  billLineTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800' },
  billLine: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' },
  professionalContinueBtn: { width: '100%', padding: '20px', borderRadius: '18px', background: '#d3bfa2', border: 'none', color: '#1a1a1a', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  googleProfessionalBtn: { width: '100%', padding: '15px 20px', borderRadius: '18px', background: '#fff', display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', color: '#1a1a1a', fontWeight: '700', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' },
  googleIconCircle: { width: '40px', height: '40px', borderRadius: '12px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  professionalMenuBack: { marginTop: '30px', background: 'transparent', border: 'none', color: '#555', fontSize: '0.85rem', textDecoration: 'underline' },
  globalAlert: { position: 'fixed', top: '24px', left: '16px', right: '16px', background: 'rgba(30, 30, 30, 0.98)', padding: '16px', borderRadius: '16px', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid #d3bfa2' },
  tagContainer: { position: 'absolute', top: '10px', right: '10px' },
  chefTag: { background: 'linear-gradient(135deg, #d3bfa2, #b09c7a)', color: '#1a1a1a', padding: '4px 10px', borderRadius: '15px', fontSize: '0.55rem', fontWeight: '900', display: 'flex', alignItems: 'center' },
  loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', fontWeight: 'bold' },
  sideDrawer: { position: 'fixed', top: 0, right: 0, width: '85%', height: '100%', background: '#1a1a1a', zIndex: 5500, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' },
  drawerHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(211, 191, 162, 0.1)' },
  drawerContent: { flex: 1, overflowY: 'auto', padding: '20px' },
  drawerItemBlock: { padding: '15px 0' },
  drawerRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  drawerFooter: { padding: '20px', paddingBottom: '40px' },
  billLinkBtn: { background: 'none', border: 'none', color: '#888', marginTop: '15px', width: '100%', fontSize: '0.8rem', textDecoration: 'underline' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 7000, display: 'flex', flexDirection: 'column', background: '#000' },
  modalNav: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(211, 191, 162, 0.1)' },
  modalTitle: { margin: 0, fontSize: '1rem', fontWeight: '800' },
  modelContainer: { flex: 1, background: '#111', display: 'flex', flexDirection: 'column', position: 'relative' },
  dishModelWrapper: { width: '100%', height: '50vh', position: 'relative' },
  chefContainerAR: { position: 'absolute', bottom: '110px', left: '0', zIndex: 50, width: '100%', pointerEvents: 'none' },
  chefFlexWrapper: { display: 'flex', alignItems: 'flex-end' },
  chefModelBox: { flexShrink: 0 },
  chefBubbleRight: { background: '#fff', color: '#1a1a1a', padding: '10px 14px', borderRadius: '2px 15px 15px 15px', fontSize: '0.6rem', fontWeight: '700', maxWidth: '130px', marginLeft: '-20px', marginBottom: '70px', pointerEvents: 'auto' },
  fixedArButtonWrapper: { position: 'absolute', bottom: '40px', width: '100%', display: 'flex', justifyContent: 'center' },
  arCustomBtn: { border: 'none', padding: '16px 28px', borderRadius: '50px', fontWeight: '900', fontSize: '0.75rem', color: '#1a1a1a' },
  formContainer: { padding: '20px', display: 'flex', flexDirection: 'column' },
  suggestionInputWrapper: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '10px', marginTop: '10px' },
  suggestionInput: { background: 'none', border: 'none', color: '#fff', fontSize: '0.75rem', width: '100%', outline: 'none' }
};

export default PratyekshaPremiumMenu;