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
  Package, UserCheck, MinusCircle, PlusCircle,  GlassWater, IceCream2, Cookie, Apple, Milk, Candy, Coffee, Sandwich, Wind, Box,Leaf, Drumstick
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

  const numberToWordsClient = (num) => {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
             'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
             'Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (!num || num === 0) return 'Zero Only';
  if (num.toString().length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
  str += n[5] != 0 ? (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + ' ' : '';
  return str.trim() + ' Only';
};
  // ADD near your other state declarations — generates a random 6-char alphanumeric token
const generateToken = useCallback(() => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars (0,O,I,1)
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}, []);

// Store token per session so it doesn't regenerate on re-render
const [sessionToken] = useState(() => {
  const stored = sessionStorage.getItem('pratyeksha_token');
  if (stored) return stored;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const token = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  sessionStorage.setItem('pratyeksha_token', token);
  return token;
});


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
  const [waiterCounts, setWaiterCounts] = useState({ spoon: 0, fork: 0, plates: 0, tissue: 0 });

  const [hasPlacedInitialOrder, setHasPlacedInitialOrder] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [placedOrders, setPlacedOrders] = useState([]); // To store actual items for bill calculation
  const [liveOrderStatuses, setLiveOrderStatuses] = useState({}); 
  const [orderTrackingPanelOpen, setOrderTrackingPanelOpen] = useState(false);
  const [orderPlacedScreen, setOrderPlacedScreen] = useState(false);

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


const [customerPhone, setCustomerPhone] = useState('');

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

const scrollRef = useRef(null);
const preserveScroll = (fn) => {
  const y = scrollRef.current?.scrollTop || 0;
  fn();
  requestAnimationFrame(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = y;
  });
};

const [searchResultCategory, setSearchResultCategory] = useState(null);
// When user selects a search result from a different category, we jump to it

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
      tissue: "Tissues",
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
      tissue: "टिश्यू",
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

const filteredMenuItems = useMemo(() => {
  return allMenuItems.filter(i => {
    const matchesCategory = selectedCategoryId === 'all' || i.categoryId === selectedCategoryId;
    const nameEn = i.name?.toLowerCase() || '';
    const nameMr = i.name_mr || '';
    const matchesSearch = nameEn.includes(searchQuery.toLowerCase()) || nameMr.includes(searchQuery);
    const matchesVeg = filterVegOnly ? i.isVeg === true : i.isVeg !== true;
    return matchesCategory && matchesSearch && matchesVeg && i.isAvailable !== false;
  });
}, [allMenuItems, selectedCategoryId, searchQuery, filterVegOnly]);

// All matching search results across ALL categories (for search suggestion dropdown)
const globalSearchResults = useMemo(() => {
  if (!searchQuery || searchQuery.length < 2) return [];
  const q = searchQuery.toLowerCase();
  return allMenuItems.filter(i => {
    const matchesVeg = filterVegOnly ? i.isVeg === true : i.isVeg !== true;
    return matchesVeg && i.isAvailable !== false &&
      (i.name?.toLowerCase().includes(q) || (i.name_mr || '').includes(searchQuery));
  }).slice(0, 8);
}, [allMenuItems, searchQuery, filterVegOnly]);

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

// ── Operator manual push → browser notification on customer device ──
waitlistSocket.on('operator_notify', (data) => {
  // Show browser / push notification
  const fireNotification = (title, body, tag) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: tag || 'operator-notify',
        renotify: true,
        vibrate: [200, 100, 200]
      });
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: tag || 'operator-notify',
            renotify: true,
          });
        }
      });
    }
  };

  const { title, body, tag, type } = data;

  // Fire the notification
  fireNotification(
    title || (type === 'waitlist' ? 'Table Almost Ready!' : type === 'pickup' ? 'Pickup Ready!' : 'Reservation Update'),
    body || 'Please check with the staff.',
    tag
  );

  // Also show in-app alert for waitlist type
  if (type === 'waitlist') {
    triggerAlert(body || 'Your table is almost ready — please stay nearby!', 'success');
  }
});

return () => {
  waitlistSocket.off('table_assigned');
  waitlistSocket.off('pickup_ready');
  waitlistSocket.off('position_updated');
  waitlistSocket.off('pickup_reminder');
  waitlistSocket.off('reservation_confirmed');
  waitlistSocket.off('operator_notify');
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
setWaitlistEntry({ ...rr.data, mode: 'reservation' });
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
    const [res, cat, extras] = await Promise.all([
      axios.get(`${BASE_URL}/tenant/${tenantId}`),
      axios.get(`${BASE_URL}/categories/${tenantId}`),
      axios.get(`${BASE_URL}/extra-items/${tenantId}`).catch(() => ({ data: [] }))
    ]);

    // Try engineered order, fall back to plain menu
    const menuRes = await axios.get(`${BASE_URL}/menu/engineered/${tenantId}`)
      .catch(() => axios.get(`${BASE_URL}/menu/${tenantId}`));

    setRestaurantData(res.data);
    setCategoryList(cat.data);
    setAllMenuItems(menuRes.data);
    setExtraItems(extras.data || []);
  } catch (error) {
    console.error("Setup error:", error);
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
// ── Live extra item stock/availability updates ──
socket.on('extra_item_updated', (updatedItem) => {
  if (updatedItem && updatedItem.tenantId === tenantId) {
    setExtraItems(prev =>
      prev.map(item => item._id === updatedItem._id ? { ...item, ...updatedItem } : item)
    );
  }
});

socket.on('extra_item_out_of_stock', ({ itemId }) => {
  setExtraItems(prev =>
    prev.map(item =>
      item._id === itemId
        ? { ...item, currentStock: 0, isAvailable: false }
        : item
    )
  );
  // Remove from cart if customer had it selected
  setExtraItemCart(prev => {
    const next = { ...prev };
    delete next[itemId];
    return next;
  });
});

  
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
      socket.off("extra_item_updated");   // ← ADD
      socket.off("extra_item_out_of_stock"); // ← ADD
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

// ══════════════════════════════════════════════════════════════════
// UNIFIED PREMIUM TOKEN SYSTEM — v2
// Drop-in replacement for the 3 download functions + helpers
// Paste BEFORE the component's return() statement
// ══════════════════════════════════════════════════════════════════

const genToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const openTokenWindow = (html, filename) => {
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (win) {
    win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 800);
    setTimeout(() => {
      if (win && !win.closed) { try { win.print(); } catch(e) {} URL.revokeObjectURL(url); }
    }, 2000);
  } else {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
};

const IC = {
  chair:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>`,
  bag:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  calendar: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  user:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  users:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  phone:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.35 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  clock:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  hourglass:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`,
  check:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  utensils: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
  receipt:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>`,
  note:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  hash:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  mappin:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  gstin:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
};

const ic = (key, color = '#c9a84c', size = 13) =>
  (IC[key] || IC.hash)
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`)
    .replace('stroke="currentColor"', `stroke="${color}"`);

const nowStamp = () => new Date().toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true
});

// ── Tenant contact row (phone + address + GSTIN) — used in header ──
// Returns 1-2 clean lines, NO address duplication
const tenantContactLine = (rd) => {
  const parts = [];
  if (rd?.contact)
    parts.push(`<span style="display:inline-flex;align-items:center;gap:4px;">${ic('phone','#bbb',10)} ${rd.contact}</span>`);
  const addr = [rd?.address?.city, rd?.address?.state].filter(Boolean).join(', ');
  if (addr)
    parts.push(`<span style="display:inline-flex;align-items:center;gap:4px;">${ic('mappin','#bbb',10)} ${addr}</span>`);
  if (rd?.gstin && rd.gstin !== 'GSTIN PENDING')
    parts.push(`<span style="display:inline-flex;align-items:center;gap:4px;">${ic('gstin','#bbb',10)} GSTIN: ${rd.gstin}</span>`);
  if (!parts.length) return '';
  return `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:5px;font-size:9px;color:#aaa;font-family:'Courier New',monospace;">
    ${parts.join('')}
  </div>`;
};

const SHARED_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: #ffffff;
    color: #111111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 13px;
  }
  .page {
    width: 100%;
    max-width: 620px;
    margin: 0 auto;
    padding: 28px 36px 32px;
    background: #ffffff;
  }

  .gold-bar {
    height: 4px;
    background: linear-gradient(90deg,#bda88a,#c9a84c,#f0dca0,#c9a84c,#bda88a);
    border-radius: 3px;
  }
  .gold-bar-top    { margin-bottom: 22px; }
  .gold-bar-bottom { margin-top: 22px; }

  /* ── HEADER: 2-column, no city repetition ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 16px;
    margin-bottom: 18px;
    border-bottom: 2px solid #111;
    gap: 16px;
  }
  .mode-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #faf6ec;
    border: 1px solid #e8d8a8;
    border-radius: 99px;
    padding: 4px 12px 4px 8px;
    font-size: 8.5px;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #7a5a20;
    margin-bottom: 8px;
  }
  .rest-name {
    font-size: 26px;
    font-weight: 900;
    color: #0c0c0c;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }
  /* right column — issued time + contact, stacked */
  .header-right {
    text-align: right;
    flex-shrink: 0;
    min-width: 140px;
  }
  .issued-label {
    font-size: 8px; font-weight: bold; letter-spacing: 2px;
    text-transform: uppercase; color: #ccc; margin-bottom: 2px;
  }
  .issued-val { font-size: 10px; color: #999; font-family: 'Courier New', monospace; }
  .contact-right {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    font-size: 9px;
    color: #aaa;
    font-family: 'Courier New', monospace;
  }
  .contact-right span { display: inline-flex; align-items: center; gap: 4px; }

  /* ── HERO ── */
  .hero {
    background: #0c0c0c;
    border-radius: 14px;
    padding: 24px 28px 18px;
    text-align: center;
    margin-bottom: 18px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content:''; position:absolute; top:0; left:10%; right:10%;
    height:2px; background:linear-gradient(90deg,transparent,#c9a84c,transparent);
  }
  .hero-eyebrow {
    font-size: 8.5px; font-weight: bold; letter-spacing: 4px;
    text-transform: uppercase; color: rgba(201,168,76,0.45); margin-bottom: 8px;
  }
  .hero-main {
    font-size: 72px; font-weight: 900; color: #e8d9a8;
    line-height: 1; letter-spacing: -4px; margin-bottom: 4px;
    font-family: Georgia, serif;
  }
  .hero-main.time   { font-size: 54px; letter-spacing: -2px; font-family: 'Courier New', monospace; }
  .hero-main.token-big { font-size: 38px; letter-spacing: 7px; font-family: 'Courier New', monospace; }
  .hero-hash        { color: #7a6a30; }
  .hero-sub         { font-size: 10px; color: rgba(232,217,168,0.4); font-weight: bold; margin-bottom: 14px; }
  .hero-divider     { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 14px; }
  .hero-row {
    display: flex; align-items: stretch;
    justify-content: center; gap: 9px;
  }

  .token-pill {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 9px; padding: 10px 18px; flex: 1;
  }
  .token-pill-label {
    font-size: 7.5px; font-weight: bold; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(201,168,76,0.38); margin-bottom: 4px;
  }
  .token-pill-code {
    font-family: 'Courier New', monospace; font-size: 22px;
    font-weight: 900; color: #e8c96a; letter-spacing: 6px;
  }
  .status-pill {
    border-radius: 9px; padding: 10px 16px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 3px; min-width: 100px;
  }
  .status-pill.confirmed { background: linear-gradient(135deg,#c9a84c,#bda88a); }
  .status-pill.pending   { background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.25); }
  .status-text {
    font-size: 8.5px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;
  }
  .status-pill.confirmed .status-text { color: #0c0c0c; }
  .status-pill.pending   .status-text { color: #c9a84c; }
  .status-icon { display:flex; align-items:center; justify-content:center; margin-bottom:1px; }

  /* ── SECTION HDR ── */
  .sec-hdr {
    display: flex; align-items: center; gap: 7px; margin-bottom: 9px;
  }
  .sec-label {
    font-size: 8.5px; font-weight: bold; letter-spacing: 2px;
    text-transform: uppercase; color: #7a6a30;
  }
  .sec-rule  { flex:1; height:1px; background:#eddfc4; }
  .sec-note  { font-size:9px; color:#bbb; font-style:italic; white-space:nowrap; }

  /* ── DETAIL GRID ── */
  .detail-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px; margin-bottom: 16px;
  }
  .d-cell {
    background: #faf6ec; border: 1px solid #ede0c0;
    border-radius: 9px; padding: 10px 12px;
  }
  .d-label {
    display: flex; align-items: center; gap: 4px;
    font-size: 7.5px; font-weight: bold; letter-spacing: 2px;
    text-transform: uppercase; color: #c0a050; margin-bottom: 4px;
  }
  .d-val { font-size: 13px; font-weight: bold; color: #111; line-height: 1.3; }
  .d-val.mono { font-family: 'Courier New', monospace; font-size: 12px; }
  .d-val small { font-size: 10px; color: #999; font-weight: normal; }

  /* ── SPECIAL REQUEST ── */
  .special {
    background: #faf6ec; border-left: 3px solid #c9a84c;
    border-radius: 0 9px 9px 0; padding: 10px 14px; margin-bottom: 16px;
    font-size: 11px; color: #7a6030; font-style: italic; line-height: 1.6;
    display: flex; align-items: flex-start; gap: 7px;
  }

  /* ── ORDER TABLE ── */
  .order-section { margin-bottom: 16px; }
  .order-table { width:100%; border-collapse:collapse; margin-top:9px; }
  .order-table thead tr { border-bottom: 2px solid #111; }
  .order-table th {
    font-size: 8px; font-weight: bold; letter-spacing: 2px;
    text-transform: uppercase; color: #999; padding: 6px 7px 8px; text-align: left;
  }
  .order-table th:nth-child(2) { text-align:center; }
  .order-table th:last-child   { text-align:right; }
  .order-table td {
    font-size: 12px; padding: 8px 7px; border-bottom: 1px solid #f3ecdd; color: #222;
  }
  .order-table td:nth-child(2) { text-align:center; color:#999; }
  .order-table td:last-child   { text-align:right; font-weight:bold; color:#111; }
  .portion-tag { font-size:9px; color:#c9a84c; font-weight:bold; margin-left:4px; }
  .order-total-row {
    display:flex; justify-content:space-between; align-items:baseline;
    padding: 11px 7px 0; border-top: 2px solid #111; margin-top: 2px;
  }
  .order-total-key { font-size:9px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#999; }
  .order-total-val { font-size:24px; font-weight:900; color:#7a5a20; font-family:Georgia,serif; }

  /* ── TABLE-ONLY ── */
  .table-only {
    background:#faf6ec; border:1px solid #ede0c0; border-radius:11px;
    padding:18px; text-align:center; margin-bottom:16px;
  }
  .table-only-icon {
    width:32px; height:32px; border-radius:50%;
    background:#fff; border:1px solid #e8d8a8;
    display:flex; align-items:center; justify-content:center;
    margin:0 auto 8px;
  }
  .table-only-title { font-size:13px; font-weight:bold; color:#7a5a30; margin-bottom:4px; }
  .table-only-text  { font-size:10.5px; color:#aa9a78; line-height:1.6; }

  /* ── FOOTER ── */
  .footer-rule { height:1px; background:#eeeeee; margin-bottom:11px; }
  .footer {
    display:flex; justify-content:space-between; align-items:center;
  }
  .footer-brand {
    font-size:12px; font-weight:900; color:#c9a84c;
    font-family:Georgia,serif; letter-spacing:1px; display:flex; align-items:center; gap:6px;
  }
  .footer-brand-sub { font-size:8px; color:#ccc; letter-spacing:2px; text-transform:uppercase; font-weight:bold; font-family:Georgia,serif; }
  .footer-date { font-size:9px; color:#ccc; font-family:'Courier New',monospace; }

  @media print {
    html,body { height:auto !important; }
    .page { padding:20px 28px 24px !important; }
    @page { margin:0; size:A4 portrait; }
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  }
`;

// ── Shared footer HTML ──
const footerHTML = () => `
  <div class="footer-rule"></div>
  <div class="footer">
    <div>
      <div class="footer-brand-sub">Powered by Pratyeksha</div>
    </div>
    <div class="footer-date">${nowStamp()}</div>
  </div>
  <div class="gold-bar gold-bar-bottom"></div>
`;

// ── Shared right-column header (issued time + contact only — NO address/city) ──
const headerRight = (rd) => {
  const contact = rd?.contact
    ? `<span>${ic('phone','#bbb',10)} ${rd.contact}</span>` : '';
  const gstin = (rd?.gstin && rd.gstin !== 'GSTIN PENDING')
    ? `<span>${ic('gstin','#bbb',10)} GSTIN: ${rd.gstin}</span>` : '';
  return `
  <div class="header-right">
    <div class="issued-label">Issued</div>
    <div class="issued-val">${nowStamp()}</div>
    ${(contact || gstin) ? `
    <div class="contact-right">
      ${contact}
      ${gstin}
    </div>` : ''}
  </div>`;
};

// ── Shared order table ──
const orderTableHTML = (items, totalAmount) => `
  <table class="order-table">
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
    </thead>
    <tbody>
      ${items.map(i => `
      <tr>
        <td>${i.name}${i.portion && i.portion !== 'Single' ? `<span class="portion-tag">(${i.portion})</span>` : ''}</td>
        <td>${i.quantity}</td>
        <td>&#8377;${i.subtotal}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="order-total-row">
    <span class="order-total-key">Total Amount</span>
    <span class="order-total-val">&#8377;${(totalAmount || 0).toLocaleString()}</span>
  </div>
`;


// ══════════════════════════════════════════════════════════
// MODE 1 — DINE-IN WAITLIST TOKEN
// ══════════════════════════════════════════════════════════
const downloadWaitlistToken = () => {
  const token    = genToken();
  const entry    = waitlistEntry || {};
  const rd       = restaurantData;
  const pos      = entry.waitlistPosition || 1;
  const estWait  = pos * 20;
  const isConf   = ['confirmed','assigned','seated'].includes(entry.status);
  const hasOrder = (entry.items || []).length > 0;
  // Full address (street + city + state + pincode) — shown ONCE in header left
  const fullAddr = [rd?.address?.street, rd?.address?.city, rd?.address?.state, rd?.address?.pincode].filter(Boolean).join(', ');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Waitlist Token — ${token}</title>
<style>${SHARED_CSS}</style>
</head>
<body><div class="page">

  <div class="gold-bar gold-bar-top"></div>

  <!-- HEADER: left = restaurant identity + full address once, right = issued + phone/gstin -->
  <div class="header">
    <div>
      <div class="mode-chip">${ic('chair','#7a5a20',13)}&nbsp; Dine-In Waitlist</div>
      <div class="rest-name">${rd?.name || 'PRATYEKSHA'}</div>
      ${fullAddr ? `<div style="font-size:9px;color:#999;font-style:italic;margin-top:3px;">${fullAddr}</div>` : ''}
    </div>
    ${headerRight(rd)}
  </div>

  <!-- HERO: queue number big, token + status below -->
  <div class="hero">
    <div class="hero-eyebrow">Queue Position</div>
    <div class="hero-main"><span class="hero-hash">#</span>${pos}</div>
    <div class="hero-sub">Estimated wait &nbsp;~${estWait} minutes</div>
    <div class="hero-divider"></div>
    <div class="hero-row">
      <div class="token-pill">
        <div class="token-pill-label">Token ID</div>
        <div class="token-pill-code">${token}</div>
      </div>
      <div class="status-pill ${isConf ? 'confirmed' : 'pending'}">
        <div class="status-icon">${isConf ? ic('check','#0c0c0c',18) : ic('hourglass','#c9a84c',18)}</div>
        <div class="status-text">${isConf ? 'Confirmed' : 'In Queue'}</div>
      </div>
    </div>
  </div>

  <!-- GUEST DETAILS -->
  <div class="sec-hdr">
    ${ic('users','#c9a84c',12)}
    <span class="sec-label">Guest Details</span>
    <div class="sec-rule"></div>
  </div>
  <div class="detail-grid">
    <div class="d-cell">
      <div class="d-label">${ic('user','#c0a050',11)}&nbsp;Name</div>
      <div class="d-val">${entry.customerName || '—'}</div>
    </div>
    <div class="d-cell">
      <div class="d-label">${ic('users','#c0a050',11)}&nbsp;Party Size</div>
      <div class="d-val">${entry.partySize || 1} <small>${(entry.partySize || 1) === 1 ? 'person' : 'people'}</small></div>
    </div>
    ${entry.customerPhone ? `
    <div class="d-cell">
      <div class="d-label">${ic('phone','#c0a050',11)}&nbsp;Mobile</div>
      <div class="d-val mono">+91 ${entry.customerPhone}</div>
    </div>` : ''}
    <div class="d-cell">
      <div class="d-label">${ic('clock','#c0a050',11)}&nbsp;Est. Wait</div>
      <div class="d-val">~${estWait} <small>min</small></div>
    </div>
  </div>

  ${entry.specialRequests ? `
  <div class="special">
    ${ic('note','#c9a84c',13)}&nbsp;<span>"${entry.specialRequests}"</span>
  </div>` : ''}

  ${hasOrder ? `
  <div class="order-section">
    <div class="sec-hdr">
      ${ic('utensils','#c9a84c',12)}
      <span class="sec-label">Pre-Order</span>
      <div class="sec-rule"></div>
      <span class="sec-note">fires to kitchen when seated</span>
    </div>
    ${orderTableHTML(entry.items, entry.totalAmount)}
  </div>` : ''}

  ${footerHTML()}
</div></body></html>`;

  openTokenWindow(html, `Waitlist_Token_${token}.pdf`);
};


// ══════════════════════════════════════════════════════════
// MODE 2 — PICKUP / TAKEAWAY TOKEN
// ══════════════════════════════════════════════════════════
const downloadPickupToken = () => {
  const token      = genToken();
  const entry      = waitlistEntry || {};
  const rd         = restaurantData;
  const hasOrder   = (entry.items || []).length > 0;
  const pickupTime = entry.scheduledPickupTime
    ? new Date(entry.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : null;
  const pickupDate = entry.scheduledPickupTime
    ? new Date(entry.scheduledPickupTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;
  const fullAddr = [rd?.address?.street, rd?.address?.city, rd?.address?.state, rd?.address?.pincode].filter(Boolean).join(', ');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Pickup Token — ${token}</title>
<style>${SHARED_CSS}</style>
</head>
<body><div class="page">

  <div class="gold-bar gold-bar-top"></div>

  <div class="header">
    <div>
      <div class="mode-chip">${ic('bag','#7a5a20',13)}&nbsp; Pickup &amp; Takeaway</div>
      <div class="rest-name">${rd?.name || 'PRATYEKSHA'}</div>
      ${fullAddr ? `<div style="font-size:9px;color:#999;font-style:italic;margin-top:3px;">${fullAddr}</div>` : ''}
    </div>
    ${headerRight(rd)}
  </div>

  <!-- HERO -->
  <div class="hero">
    <div class="hero-eyebrow">${pickupTime ? 'Pickup Slot' : 'Pickup Token'}</div>
    ${pickupTime
      ? `<div class="hero-main time">${pickupTime}</div>
         <div class="hero-sub">${pickupDate || 'Today'}&nbsp;&nbsp;·&nbsp;&nbsp;Counter Collection</div>`
      : `<div class="hero-main token-big">${token}</div>
         <div class="hero-sub">We'll notify you when your order is ready</div>`
    }
    <div class="hero-divider"></div>
    <div class="hero-row">
      ${pickupTime ? `
      <div class="token-pill">
        <div class="token-pill-label">Token ID</div>
        <div class="token-pill-code">${token}</div>
      </div>` : ''}
      <div class="status-pill confirmed">
        <div class="status-icon">${ic('check','#0c0c0c',18)}</div>
        <div class="status-text" style="color:#0c0c0c;">Order Confirmed</div>
      </div>
    </div>
  </div>

  <!-- CUSTOMER -->
  <div class="sec-hdr">
    ${ic('user','#c9a84c',12)}
    <span class="sec-label">Customer Details</span>
    <div class="sec-rule"></div>
  </div>
  <div class="detail-grid">
    <div class="d-cell">
      <div class="d-label">${ic('user','#c0a050',11)}&nbsp;Name</div>
      <div class="d-val">${entry.customerName || '—'}</div>
    </div>
    ${entry.customerPhone ? `
    <div class="d-cell">
      <div class="d-label">${ic('phone','#c0a050',11)}&nbsp;Mobile</div>
      <div class="d-val mono">+91 ${entry.customerPhone}</div>
    </div>` : ''}
    <div class="d-cell">
      <div class="d-label">${ic('mappin','#c0a050',11)}&nbsp;Collection</div>
      <div class="d-val">Counter</div>
    </div>
    ${pickupTime ? `
    <div class="d-cell">
      <div class="d-label">${ic('clock','#c0a050',11)}&nbsp;Pickup Time</div>
      <div class="d-val mono">${pickupTime}${pickupDate ? `&nbsp;<small>· ${pickupDate}</small>` : ''}</div>
    </div>` : ''}
  </div>

  ${entry.specialRequests ? `
  <div class="special">
    ${ic('note','#c9a84c',13)}&nbsp;<span>"${entry.specialRequests}"</span>
  </div>` : ''}

  ${hasOrder ? `
  <div class="order-section">
    <div class="sec-hdr">
      ${ic('receipt','#c9a84c',12)}
      <span class="sec-label">Order Summary</span>
      <div class="sec-rule"></div>
    </div>
    ${orderTableHTML(entry.items, entry.totalAmount)}
  </div>` : `
  <div class="table-only">
    <div class="table-only-icon">${ic('bag','#c9a84c',18)}</div>
    <div class="table-only-title">No Pre-Order Placed</div>
    <div class="table-only-text">You may add items at the counter when you arrive.</div>
  </div>`}

  ${footerHTML()}
</div></body></html>`;

  openTokenWindow(html, `Pickup_Token_${token}.pdf`);
};


// ══════════════════════════════════════════════════════════
// MODE 3 — TABLE RESERVATION TOKEN
// Shows ONLY reservation info: date, time, guests, name,
// phone, special requests, pre-order (if any).
// No pickup / dine-in references whatsoever.
// ══════════════════════════════════════════════════════════
const downloadReservationPDF = () => {
  const token       = genToken();
  const entry       = waitlistEntry || {};
  const rd          = restaurantData;
  const hasPreOrder = (entry.items || []).length > 0;
  const isConf      = ['confirmed','seated'].includes(entry.status);
  const resTime     = entry.reservationTime ? new Date(entry.reservationTime) : null;
  const fmtLong     = resTime ? resTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const fmtShort    = resTime ? resTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
  const fmtTime     = resTime ? resTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
  const fmtDay      = resTime ? resTime.toLocaleDateString('en-IN', { weekday: 'long' }) : '';
  // Use last-6 of DB _id as stable token so it matches the on-screen token
  const tokenId     = entry._id?.slice(-6)?.toUpperCase() || token;
  const fullAddr    = [rd?.address?.street, rd?.address?.city, rd?.address?.state, rd?.address?.pincode].filter(Boolean).join(', ');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Reservation — #${tokenId}</title>
<style>${SHARED_CSS}</style>
</head>
<body><div class="page">

  <div class="gold-bar gold-bar-top"></div>

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="mode-chip">${ic('calendar','#7a5a20',13)}&nbsp; ${hasPreOrder ? 'Reservation + Pre-Order' : 'Table Reservation'}</div>
      <div class="rest-name">${rd?.name || 'PRATYEKSHA'}</div>
      ${fullAddr ? `<div style="font-size:9px;color:#999;font-style:italic;margin-top:3px;">${fullAddr}</div>` : ''}
    </div>
    ${headerRight(rd)}
  </div>

  <!-- HERO: reservation TIME is the hero element -->
  <div class="hero">
    <div class="hero-eyebrow">Reservation Time</div>
    <div class="hero-main time">${fmtTime}</div>
    <div class="hero-sub">${fmtLong}</div>
    <div class="hero-divider"></div>
    <div class="hero-row">
      <div class="token-pill">
        <div class="token-pill-label">Booking Token</div>
        <div class="token-pill-code">#${tokenId}</div>
      </div>
      <div class="status-pill ${isConf ? 'confirmed' : 'pending'}">
        <div class="status-icon">${isConf ? ic('check','#0c0c0c',18) : ic('hourglass','#c9a84c',18)}</div>
        <div class="status-text">${isConf ? 'Confirmed' : 'Pending'}</div>
      </div>
    </div>
  </div>

  <!-- RESERVATION DETAILS — all reservation-specific, nothing else -->
  <div class="sec-hdr">
    ${ic('users','#c9a84c',12)}
    <span class="sec-label">Reservation Details</span>
    <div class="sec-rule"></div>
  </div>
  <div class="detail-grid">
    <div class="d-cell">
      <div class="d-label">${ic('user','#c0a050',11)}&nbsp;Guest Name</div>
      <div class="d-val">${entry.customerName || '—'}</div>
    </div>
    <div class="d-cell">
      <div class="d-label">${ic('users','#c0a050',11)}&nbsp;Party Size</div>
      <div class="d-val">${entry.partySize || 1} <small>${(entry.partySize || 1) === 1 ? 'person' : 'people'}</small></div>
    </div>
    ${entry.customerPhone ? `
    <div class="d-cell">
      <div class="d-label">${ic('phone','#c0a050',11)}&nbsp;Mobile</div>
      <div class="d-val mono">+91 ${entry.customerPhone}</div>
    </div>` : ''}
    <div class="d-cell">
      <div class="d-label">${ic('calendar','#c0a050',11)}&nbsp;Date</div>
      <div class="d-val" style="font-size:12px;">${fmtShort} <small>· ${fmtDay}</small></div>
    </div>
    ${entry.tablePreference ? `
    <div class="d-cell">
      <div class="d-label">${ic('hash','#c0a050',11)}&nbsp;Table Pref.</div>
      <div class="d-val" style="color:#7a5a30;">${entry.tablePreference}</div>
    </div>` : ''}
    <div class="d-cell">
      <div class="d-label">${ic('clock','#c0a050',11)}&nbsp;Time</div>
      <div class="d-val mono">${fmtTime}</div>
    </div>
  </div>

  ${entry.specialRequests ? `
  <div class="special">
    ${ic('note','#c9a84c',13)}&nbsp;<span>"${entry.specialRequests}"</span>
  </div>` : ''}

  <!-- PRE-ORDER (if any) — else table-only message -->
  ${hasPreOrder ? `
  <div class="order-section">
    <div class="sec-hdr">
      ${ic('utensils','#c9a84c',12)}
      <span class="sec-label">Pre-Order Details</span>
      <div class="sec-rule"></div>
    </div>
    ${orderTableHTML(entry.items, entry.totalAmount)}
    <p style="font-size:10px;color:#9a8060;margin-top:8px;text-align:center;font-style:italic;">
      Dishes will be served shortly after you are seated.
    </p>
  </div>` : `
  <div class="table-only">
    <div class="table-only-icon">${ic('chair','#c9a84c',18)}</div>
    <div class="table-only-title">Table Reservation Only</div>
    <div class="table-only-text">
      No pre-order placed. Our team will take your order<br/>once you are comfortably seated.
    </div>
  </div>`}

  ${footerHTML()}
</div></body></html>`;

  openTokenWindow(html, `Reservation_Token_${tokenId}.pdf`);
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
    setWaiterCounts({ spoon: 0, fork: 0, plates: 0, tissue: 0 });
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
  // Only for dine-in table scans — not counter mode
  if (!tenantId || tableNumber === 'Counter' || isCounterScan) return;
  if (welcomeDismissed) return;
 
  const savedPhone = localStorage.getItem(`pratyeksha_phone_${tenantId}`);
 
  if (savedPhone && savedPhone.length === 10) {
    // ── RETURNING CUSTOMER: try to recognize and show full welcome card ──
    setWelcomeLoading(true);
    axios.get(`${BASE_URL}/customers/recognize/${tenantId}/${savedPhone}`)
      .then(r => {
        if (r.data?.found) {
          setWelcomeCard(r.data);
          setWelcomePhone(savedPhone);
        } else {
          // Phone saved locally but not in DB — show phone prompt
          setShowPhonePrompt(true);
        }
      })
      .catch(() => {
        // Network error — still show prompt as fallback
        setShowPhonePrompt(true);
      })
      .finally(() => setWelcomeLoading(false));
  } else {
    // ── NEW CUSTOMER: show phone prompt immediately on scan ──
    // Small delay so menu loads first and feels settled
    const timer = setTimeout(() => {
      setShowPhonePrompt(true);
    }, 1200);
    return () => clearTimeout(timer);
  }
}, [tenantId, tableNumber, isCounterScan, welcomeDismissed]);


const sendBatchToKitchen = async () => {
  try {
    const summary = {};
    Object.entries(cart).forEach(([key, qty]) => {
      const isMulti = key.includes('-');
      const id = isMulti ? key.split('-')[0] : key;
      const portion = isMulti ? key.split('-')[1] : 'Single';
      const item = allMenuItems.find(i => i._id === id);
      if (!item) return;
 
      const summaryKey = `${id}-${portion}`;
      if (!summary[summaryKey]) {
        const unitPrice = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
        summary[summaryKey] = {
          menuItemId:   item._id,
          name:         item.name,
          name_mr:      item.name_mr,
          quantity:     0,
          portion:      portion,
          pricePerUnit: unitPrice,
          subtotal:     0,
          suggestion:   suggestions[key] || "",
          isVeg:        item.isVeg !== false
        };
      }
      summary[summaryKey].quantity += qty;
      summary[summaryKey].subtotal  = summary[summaryKey].quantity * summary[summaryKey].pricePerUnit;
    });
 
    const orderItems = Object.values(summary);
    const total = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
 
    const payload = {
      tenantId,
      tableNumber,
      items:       orderItems,
      billDetails: { itemsTotal: total, taxAmount: total * 0.05, grandTotal: total * 1.05 },
      status:        "pending",
      paymentStatus: "unpaid",
      createdAt:     new Date().toISOString()
    };
 
    const orderRes = await axios.post(`${BASE_URL}/orders`, payload);
    if (orderRes.data?._id) {
      setLiveOrderStatuses(prev => ({ ...prev, [orderRes.data._id]: 'pending' }));
    }
 
    setPlacedOrders(prev => [...prev, ...orderItems]);
 
    // ── Customer upsert — single declaration, no duplicate ──
    const knownPhone = welcomePhone || localStorage.getItem(`pratyeksha_phone_${tenantId}`);
    if (knownPhone && knownPhone.length === 10) {
      const visitItems = orderItems.map(i => ({
        menuItemId: i.menuItemId,
        name:       i.name,
        quantity:   i.quantity,
        subtotal:   i.subtotal,
      }));
      axios.post(`${BASE_URL}/customers/upsert`, {
        tenantId,
        name:           customerInfo.name?.trim() || welcomeCard?.name || 'Guest',
        phone:          knownPhone,
        lastOrderItems: visitItems,
        visitAmount:    total,
        incrementVisit: false,
      }).catch(() => {});
    }
 
    triggerAlert("orderSuccess");
    setHasPlacedInitialOrder(true);
    setCart({});
    setSuggestions({});
    setIsDrawerOpen(false);
    setOrderPlacedScreen(true);
    setTimeout(() => setOrderPlacedScreen(false), 60000);
 
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

    // ── ADD THIS: upsert customer into CustomerSchema ──
    const phone = customerInfo.phone?.replace(/\D/g, '') || '';
    if (phone.length === 10) {
      axios.post(`${BASE_URL}/customers/upsert`, {
        tenantId,
        name: customerInfo.name.trim(),
        phone,
        lastVisit: new Date().toISOString(),
        lastOrderItems: orderItems.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          subtotal: i.subtotal,
        })),
        visitAmount: total,
      }).catch(() => {});
    }

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
  const [hours, minutes] = reservationTime.split(':').map(Number);
  const resDateTime = new Date(reservationDate);
  resDateTime.setHours(hours, minutes, 0, 0);

  try {
    // ── Place reservation ──
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

setWaitlistEntry({ ...res.data.reservation, mode: 'reservation' });
    setCart({}); setSuggestions({});
    setRegistrationStep('confirm');
    setIsDrawerOpen(false);
    triggerAlert('orderSuccess');

    // ── Auto-save / upsert customer in DB with visit count ──
    const phone = customerInfo.phone?.replace(/\D/g, '') || '';
    if (phone.length === 10) {
      axios.post(`${BASE_URL}/customers/upsert`, {
        tenantId,
        name: customerInfo.name.trim(),
        phone,
        lastVisit: new Date().toISOString(),
      }).catch(() => {}); // silent — don't block UI
    }

    // ── Notification ──
    if ('Notification' in window) {
      const perm = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
      if (perm === 'granted') {
        new Notification('📅 Reservation Requested!', {
          body: `Hi ${customerInfo.name}! Your table for ${partySize} on ${resDateTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at ${resDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} is pending confirmation.`,
          icon: '/logo.png',
        });
      }
    }
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


const autoDownloadInvoicePDF = useCallback(() => {
  const rd = restaurantData;
  const cgstPct = rd?.config?.cgstPercentage ?? 2.5;
  const sgstPct = rd?.config?.sgstPercentage ?? 2.5;
  const subtotal   = finalBillItems.reduce((s, i) => s + (i.subtotal || 0), 0);
  const cgstAmt    = subtotal * (cgstPct / 100);
  const sgstAmt    = subtotal * (sgstPct / 100);
  const grandTotal = Math.round(subtotal + cgstAmt + sgstAmt);
  const taxableAmt = subtotal; // items are priced ex-tax; tax is added on top

  const addr = [rd?.address?.street, rd?.address?.city, rd?.address?.state, rd?.address?.pincode]
    .filter(Boolean).join(', ');
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  const invoiceNo  = `INV-${Date.now().toString().slice(-8)}`;
  const dateStr    = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).toUpperCase();
  const timeStr    = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const itemRows = finalBillItems.map((item, idx) => `
    <tr>
      <td class="desc">
        <span class="item-name">${item.quantity}x ${item.name}${item.portion && item.portion !== 'Single' ? ` (${item.portion})` : ''}${item.isExtraItem ? ' *' : ''}</span>
        <span class="item-rate">@ ₹${item.pricePerUnit} / item</span>
      </td>
      <td class="num">₹${(item.pricePerUnit * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice — ${invoiceNo}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    color: #000;
    background: #fff;
  }
  .page {
    width: 595px;
    margin: 0 auto;
    padding: 40px 44px 48px;
    background: #fff;
  }

  /* ── HEADER ── */
  .top-rule { border-top: 2.5px solid #000; margin-bottom: 0; }

  .header-meta {
    text-align: center;
    padding: 20px 0 16px;
    border-bottom: 1px solid #ccc;
    margin-bottom: 18px;
  }
  .invoice-label {
    font-size: 9px; font-weight: 700; letter-spacing: 4px;
    text-transform: uppercase; color: #888; margin-bottom: 10px;
  }
  .rest-name {
    font-size: 26px; font-weight: 900; color: #000;
    letter-spacing: -0.5px; line-height: 1.15; margin-bottom: 8px;
  }
  .rest-sub {
    font-size: 11px; color: #444; line-height: 1.8;
  }
  .rest-sub strong { font-weight: 800; }

  /* ── BILL META ── */
  .meta-row {
    display: flex; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 14px;
    border-bottom: 2px solid #000; border-top: 2px solid #000;
    padding-top: 12px;
  }
  .meta-left .bill-label { font-size: 10px; color: #888; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 2px; }
  .meta-left .bill-no   { font-size: 16px; font-weight: 900; color: #000; }
  .meta-right { text-align: right; }
  .meta-right .date-val { font-size: 14px; font-weight: 800; color: #000; }
  .meta-right .time-val { font-size: 12px; color: #666; margin-top: 2px; }

  .customer-block {
    font-size: 12px; line-height: 1.7; color: #000;
    padding-bottom: 16px; border-bottom: 1px solid #ccc;
    margin-bottom: 16px;
  }
  .customer-block div { font-weight: 500; }

  /* ── ITEMS TABLE ── */
  table.items { width: 100%; border-collapse: collapse; }
  table.items thead tr {
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }
  table.items th {
    font-size: 9px; font-weight: 800; letter-spacing: 2px;
    text-transform: uppercase; color: #888;
    padding: 8px 6px; text-align: left;
  }
  table.items th.num { text-align: right; }
  table.items td {
    padding: 11px 6px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  .item-name { display: block; font-size: 13px; font-weight: 600; color: #000; }
  .item-rate { display: block; font-size: 10px; color: #999; margin-top: 3px; }
  td.num { text-align: right; font-size: 13px; font-weight: 700; color: #000; white-space: nowrap; }

  /* ── TAX BLOCK ── */
  .tax-block { width: 280px; margin-left: auto; margin-top: 10px; }
  .tax-row {
    display: flex; justify-content: space-between;
    padding: 5px 0; font-size: 12px; color: #444;
    border-bottom: 1px solid #f0f0f0;
  }
  .tax-row.subtotal-row { font-weight: 700; color: #000; }
  .grand-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 12px 0 4px; border-top: 2.5px solid #000; margin-top: 8px;
  }
  .grand-label { font-size: 14px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
  .grand-amt   { font-size: 26px; font-weight: 900; font-family: Arial, sans-serif; }
  .words-note  { text-align: right; font-size: 10px; color: #888; font-style: italic; margin-top: 4px; }
  .gst-note    { text-align: right; font-size: 9px; color: #bbb; margin-top: 3px; }

  /* ── FOOTER ── */
  .footer {
    margin-top: 28px; border-top: 1px solid #ccc;
    padding-top: 14px; display: flex;
    justify-content: space-between; align-items: center;
  }
  .footer-msg   { font-size: 11px; color: #666; font-style: italic; }
  .footer-brand { font-size: 8px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #bbb; }
</style>
</head>
<body>
<div class="page" id="invoice-root">

  <div class="top-rule"></div>

  <!-- RESTAURANT HEADER -->
  <div class="header-meta">
    <div class="invoice-label">Tax Invoice</div>
    <div class="rest-name">${rd?.name || 'RESTAURANT'}</div>
    <div class="rest-sub">
      ${addr ? `${addr}<br/>` : ''}
      ${rd?.contact ? `Tel: ${rd.contact}<br/>` : ''}
      ${rd?.gstin && rd.gstin !== 'GSTIN PENDING'
        ? `<strong>GSTIN: ${rd.gstin}</strong><br/>`
        : '<strong>GSTIN: GSTIN PENDING</strong><br/>'}
      <span style="font-size:10px;color:#888;">SAC Code: 996331 · GST Rate: ${(cgstPct+sgstPct).toFixed(1)}% (CGST ${cgstPct}% + SGST ${sgstPct}%)</span>
    </div>
  </div>

  <!-- BILL META -->
  <div class="meta-row">
    <div class="meta-left">
      <div class="bill-label">BILL NO.</div>
      <div class="bill-no">#${invoiceNo.replace('INV-','')}</div>
    </div>
    <div class="meta-right">
      <div class="date-val">${dateStr}</div>
      <div class="time-val">${timeStr}</div>
    </div>
  </div>

  <!-- CUSTOMER -->
  <div class="customer-block">
    <div>Customer: ${customerInfo.name || 'Guest'}</div>
    ${customerInfo.phone ? `<div>Phone: ${customerInfo.phone}</div>` : ''}
    <div>Table: ${tableNumber}</div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items">
    <thead>
      <tr>
        <th>Item Description</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  ${finalBillItems.some(i => i.isExtraItem) ? `<div style="font-size:9.5px;color:#aaa;margin-top:6px;font-style:italic;">* Extra items ordered at counter</div>` : ''}

  <!-- TAX BREAKDOWN -->
  <div class="tax-block">
    <div class="tax-row subtotal-row">
      <span>Subtotal</span>
      <span>₹${taxableAmt.toFixed(2)}</span>
    </div>
    <div class="tax-row">
      <span>CGST @ ${cgstPct}%</span>
      <span>₹${cgstAmt.toFixed(2)}</span>
    </div>
    <div class="tax-row">
      <span>SGST @ ${sgstPct}%</span>
      <span>₹${sgstAmt.toFixed(2)}</span>
    </div>
    <div class="grand-row">
      <span class="grand-label">Grand Total</span>
      <span class="grand-amt">₹${grandTotal}</span>
    </div>
    <div class="words-note"><em>${numberToWordsClient(grandTotal)}</em></div>
    <div class="gst-note">GST @ ${(cgstPct+sgstPct).toFixed(1)}% (CGST ${cgstPct}% + SGST ${sgstPct}%) · SAC 996331</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-msg">Thank you for dining with us! Please visit again.</div>
    <div class="footer-brand">Powered by Pratyeksha</div>
  </div>

</div>

<script>
  window.onload = function() {
    var element = document.getElementById('invoice-root');
    var opt = {
      margin:      [8, 8, 8, 8],
      filename:    'TaxInvoice_Table${tableNumber}_${invoiceNo}.pdf',
      image:       { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(function() {
      setTimeout(function() { window.close(); }, 90000);
    });
  };
</script>
</body>
</html>`;

  // Open in new tab — html2pdf auto-downloads the PDF then closes
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}, [restaurantData, finalBillItems, customerInfo, tableNumber, numberToWordsClient]);

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

    const visitItems = finalBillItems
      .filter(i => !i.isExtraItem)
      .map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        subtotal: i.subtotal,
      }));

    const visitTotal = finalBillItems.reduce((sum, i) => sum + (i.subtotal || 0), 0);

    await axios.post(`${BASE_URL}/customers/upsert`, {
      tenantId,
      name: customerInfo.name.trim(),
      phone: customerInfo.phone.replace(/\D/g, ''),
      lastVisit: new Date().toISOString(),
      lastOrderItems: visitItems,
      visitAmount: visitTotal,
      incrementVisit: true,
    });

    const phoneDigits = customerInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length === 10) {
      setTimeout(() => {
        axios.get(`${BASE_URL}/customers/recognize/${tenantId}/${phoneDigits}`)
          .then(r => { if (r.data?.found) setWelcomeCard(r.data); })
          .catch(() => {});
      }, 800);
    }

    // ── CLEAR everything after checkout ──
    localStorage.removeItem(`pratyeksha_placed_${tenantId}_${tableNumber}`);
    localStorage.removeItem(`pratyeksha_cart_${tenantId}`);
    setBillRequested(true);
    // placedOrders intentionally NOT cleared here — still needed for the bill summary display
    // They clear when modal closes (see isBillOpen X handler below)

  } catch (error) {
    localStorage.removeItem(`pratyeksha_placed_${tenantId}_${tableNumber}`);
    localStorage.removeItem(`pratyeksha_cart_${tenantId}`);
    setBillRequested(true);
  }
};

  const hasNonVegInView = useMemo(() => {
    if (isOnlyVegTenant) return false;
    return allMenuItems.some(i => i.isVeg !== true && i.isAvailable !== false);
  }, [allMenuItems, isOnlyVegTenant]);


const reservationValid = counterMode !== 'reservation' || (reservationDate && reservationTime);
const ctaEnabled = customerInfo.name.trim() && reservationValid;

// Add this function in your customer menu component:
const registerPushSubscription = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'YOUR_VAPID_PUBLIC_KEY_HERE' // same VAPID key you already use for waitlist notifications
        )
      });
    }
    // Save subscription to backend tied to this customer's phone
    if (customerPhone && sub) {
      await axios.post(`${BASE_URL}/customers/push-subscription`, {
        tenantId,
        phone: customerPhone,
        subscription: sub
      });
    }
  } catch (err) {
    console.log('Push subscription failed:', err.message);
  }
};

// Call it after customer identifies themselves (phone entry or CRM welcome)
useEffect(() => {
  if (customerPhone) registerPushSubscription();
}, [customerPhone]);


// ── Persist cart to localStorage so it survives browser close ──
useEffect(() => {
  if (Object.keys(cart).length > 0) {
    localStorage.setItem(`pratyeksha_cart_${tenantId}`, JSON.stringify(cart));
  } else {
    localStorage.removeItem(`pratyeksha_cart_${tenantId}`);
  }
}, [cart, tenantId]);

// ── Persist placedOrders to localStorage on every change ──
useEffect(() => {
  if (!tenantId || !tableNumber || tableNumber === '' || isCounterScan) return;
  const key = `pratyeksha_placed_${tenantId}_${tableNumber}`;
  if (placedOrders.length > 0) {
    localStorage.setItem(key, JSON.stringify(placedOrders));
  } else {
    localStorage.removeItem(key);
  }
}, [placedOrders, tenantId, tableNumber, isCounterScan]);

// ── Restore placedOrders on mount — after tenantId AND tableNumber are both known ──
useEffect(() => {
  // tableNumber is set from URL params — wait until it's a real table (not empty string)
  if (!tenantId || !tableNumber || tableNumber === '' || isCounterScan) return;
  const key = `pratyeksha_placed_${tenantId}_${tableNumber}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setPlacedOrders(parsed);
        setHasPlacedInitialOrder(true);
      }
    }
  } catch { /* ignore */ }
}, [tenantId, tableNumber, isCounterScan]); // ← tableNumber in deps ensures it runs after URL param is parsed


// ── RESTORE placedOrders FROM SERVER on mount (multi-device safe) ──
useEffect(() => {
  if (!tenantId || !tableNumber || tableNumber === '' || tableNumber === 'Counter' || isCounterScan) return;
  
  axios.get(`${BASE_URL}/orders/table/${tenantId}/${tableNumber}`)
    .then(r => {
      if (r.data?.allItems?.length > 0) {
        // Map server items to our placedOrders format
        const serverItems = r.data.allItems.map(item => ({
          menuItemId:   item.menuItemId || null,
          name:         item.name || '',
          name_mr:      item.name_mr || '',
          quantity:     item.quantity || 1,
          portion:      item.portion || 'Single',
          pricePerUnit: item.pricePerUnit || 0,
          subtotal:     item.subtotal || 0,
          isExtraItem:  item.isExtraItem || false,
          extraItemId:  item.extraItemId || null,
        }));
        setPlacedOrders(serverItems);
        setHasPlacedInitialOrder(true);
      }
    })
    .catch(() => {
      // Silently fall back to localStorage (already handled above)
    });
}, [tenantId, tableNumber, isCounterScan]);
// REPLACE with:
// ── COUNTER SCAN FLOW — early return (all hooks already declared above) ──
if (isCounterScan && registrationStep !== 'menu') {

const Shell = ({ children, centered = true }) => (
  <div ref={scrollRef} style={{    minHeight: '100vh',
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

  // ── RESERVATION CONFIRM — completely separate screen ──
  if (waitlistEntry.mode === 'reservation') {
    const resTime  = waitlistEntry.reservationTime ? new Date(waitlistEntry.reservationTime) : null;
    const hasItems = waitlistEntry.items?.length > 0;
    const isConf   = waitlistEntry.status === 'confirmed';
    const tokenId  = waitlistEntry._id?.slice(-6)?.toUpperCase() || 'XXXXXX';


    return (
      <Shell centered={false}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(14,14,14,0.96)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(211,191,162,0.3)' }}>
            {restaurantData?.name}
          </span>
          <span style={{
            fontSize: '0.52rem', fontWeight: '900', letterSpacing: '1.5px',
            padding: '5px 12px', borderRadius: '20px',
            background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)',
            color: 'rgba(211,191,162,0.4)',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
          }}>
            <CalendarClock size={11} color="rgba(211,191,162,0.4)" />
            {language === 'mr' ? 'बुकिंग' : 'RESERVATION'}
          </span>
        </div>

        <div style={{ padding: '32px 22px 80px', maxWidth: '420px', margin: '0 auto', width: '100%' }}>

          {/* ── HERO ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px'
            }}>
              <CalendarClock size={24} color="rgba(211,191,162,0.8)" strokeWidth={1.5} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.15, marginBottom: '8px' }}>
              {language === 'mr' ? 'बुकिंग झाली!' : 'Table Reserved!'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.76rem', fontWeight: '500', lineHeight: 1.7 }}>
              {language === 'mr'
                ? 'तुमची विनंती मिळाली. रेस्टॉरंट लवकरच कन्फर्म करेल.'
                : `We've received your reservation at ${restaurantData?.name}. The restaurant will confirm shortly.`}
            </p>
          </div>

          {/* ── TOKEN CARD ── */}
          <div style={{
            background: '#111', border: '1px solid rgba(211,191,162,0.12)',
            borderRadius: '22px', overflow: 'hidden', marginBottom: '14px', position: 'relative'
          }}>
            {/* Gold shimmer */}
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(211,191,162,0.5),transparent)' }} />
            <div style={{ padding: '26px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.48rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.25)', textTransform: 'uppercase', marginBottom: '12px' }}>
                {language === 'mr' ? 'बुकिंग टोकन' : 'Booking Token'}
              </div>
              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', letterSpacing: '8px', lineHeight: 1, marginBottom: '14px' }}>
                #{tokenId}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 16px', borderRadius: '99px',
                background: isConf ? 'rgba(211,191,162,0.12)' : 'rgba(138,112,77,0.08)',
                border: `1px solid ${isConf ? 'rgba(211,191,162,0.3)' : 'rgba(138,112,77,0.2)'}`,
                marginBottom: '22px'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConf ? '#d3bfa2' : '#8a704d' }} />
                <span style={{ fontSize: '0.58rem', fontWeight: '900', color: isConf ? '#d3bfa2' : '#8a704d', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  {isConf ? (language === 'mr' ? 'कन्फर्म झाले' : 'CONFIRMED') : (language === 'mr' ? 'पेंडिंग' : 'PENDING CONFIRMATION')}
                </span>
              </div>

              {/* Date / Time / Guests row */}
              {resTime && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0', borderTop: '1px solid rgba(211,191,162,0.08)', paddingTop: '18px' }}>
                  {[
                    { icon: <CalendarClock size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />, label: language === 'mr' ? 'तारीख' : 'DATE', val: resTime.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'}) },
                    { icon: <Clock3 size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />, label: language === 'mr' ? 'वेळ' : 'TIME', val: resTime.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true}) },
                    { icon: <Users size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />, label: language === 'mr' ? 'जण' : 'GUESTS', val: `${waitlistEntry.partySize}` },
                  ].map((r, i, arr) => (
                    <div key={i} style={{
                      flex: 1, textAlign: 'center', padding: '0 6px',
                      borderRight: i < arr.length - 1 ? '1px solid rgba(211,191,162,0.08)' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '5px' }}>
                        {r.icon}
                        <span style={{ fontSize: '0.46rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{r.label}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── GUEST DETAILS ── */}
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.08)', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(211,191,162,0.03)', borderBottom: '1px solid rgba(211,191,162,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.5rem', fontWeight: '900', color: 'rgba(211,191,162,0.35)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {language === 'mr' ? 'तपशील' : 'Reservation Details'}
              </span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: language === 'mr' ? 'नाव' : 'NAME', val: waitlistEntry.customerName, gold: true },
                waitlistEntry.customerPhone && { label: language === 'mr' ? 'मोबाईल' : 'MOBILE', val: `+91 ${waitlistEntry.customerPhone}`, mono: true },
                resTime && { label: language === 'mr' ? 'तारीख' : 'DATE', val: resTime.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}) },
                resTime && { label: language === 'mr' ? 'वेळ' : 'TIME', val: resTime.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true}), mono: true },
                { label: language === 'mr' ? 'जण' : 'GUESTS', val: `${waitlistEntry.partySize} ${waitlistEntry.partySize === 1 ? (language === 'mr' ? 'व्यक्ती' : 'person') : (language === 'mr' ? 'जण' : 'people')}` },
                waitlistEntry.specialRequests && { label: language === 'mr' ? 'विशेष' : 'SPECIAL', val: `"${waitlistEntry.specialRequests}"`, italic: true },
              ].filter(Boolean).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.18)', fontWeight: '700', letterSpacing: '0.5px', flexShrink: 0, textTransform: 'uppercase' }}>{r.label}</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: r.gold ? '800' : '600', color: r.gold ? '#d3bfa2' : 'rgba(255,255,255,0.4)', fontFamily: r.mono ? 'monospace' : 'inherit', fontStyle: r.italic ? 'italic' : 'normal', textAlign: 'right', lineHeight: 1.4 }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── PRE-ORDER SUMMARY — only when items exist ── */}
          {hasItems && (
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.08)', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(211,191,162,0.03)', borderBottom: '1px solid rgba(211,191,162,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UtensilsCrossed size={12} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.5rem', fontWeight: '900', color: 'rgba(211,191,162,0.35)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {language === 'mr' ? 'प्री-ऑर्डर' : 'Pre-Order'}
                </span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {waitlistEntry.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < waitlistEntry.items.length - 1 ? '10px' : '0', marginBottom: i < waitlistEntry.items.length - 1 ? '10px' : '0', borderBottom: i < waitlistEntry.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: '900', fontFamily: 'monospace', color: 'rgba(211,191,162,0.25)', minWidth: '20px' }}>×{item.quantity}</span>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{item.name}</span>
                      {item.portion && item.portion !== 'Single' && (
                        <span style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.3)', fontWeight: '700' }}>{item.portion}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#d3bfa2', fontWeight: '800', fontFamily: 'monospace' }}>₹{item.subtotal}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '10px', borderTop: '1px solid rgba(211,191,162,0.08)' }}>
                  <span style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    {language === 'mr' ? 'एकूण' : 'Total'}
                  </span>
                  <span style={{ fontSize: '1rem', color: '#d3bfa2', fontWeight: '900', fontFamily: 'monospace' }}>₹{waitlistEntry.totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATION PILL ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 15px', marginBottom: '20px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '13px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BellRing size={13} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />
            </div>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.65, fontWeight: '500' }}>
              {language === 'mr' ? 'बुकिंग कन्फर्म झाल्यावर सूचना मिळेल.' : "You'll be notified when the restaurant confirms your booking."}
            </p>
          </div>

          {/* ── DOWNLOAD PDF — always shown ── */}
          <button onClick={downloadReservationPDF} style={{
            width: '100%', padding: '17px',
            background: 'linear-gradient(135deg,#d3bfa2,#bda88a)',
            border: 'none', borderRadius: '14px',
            color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
            cursor: 'pointer', marginBottom: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            letterSpacing: '0.5px', textTransform: 'uppercase',
            boxShadow: '0 8px 28px rgba(211,191,162,0.18)'
          }}>
            <ReceiptText size={16} strokeWidth={2} />
            {language === 'mr' ? 'बुकिंग टोकन डाउनलोड करा' : 'Download Booking Token'}
          </button>

{/* ── PRE-ORDER CTA — only when NO items AND user didn't explicitly skip ── */}
{!hasItems && !waitlistEntry._noPreorder && (
  <button onClick={() => setRegistrationStep('menu')} style={{
    width: '100%', padding: '15px',
    background: 'rgba(211,191,162,0.07)',
    border: '1px solid rgba(211,191,162,0.18)',
    color: '#d3bfa2', borderRadius: '13px',
    fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer',
    marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px'
  }}>
    <UtensilsCrossed size={15} strokeWidth={2.5} />
    {language === 'mr' ? 'आधीच ऑर्डर द्या' : 'Add Pre-Order'}
    <ChevronRight size={15} />
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
        </div>
      </Shell>
    );
  }

 // ── DINE-IN / PICKUP CONFIRM ──
  const isDineIn = waitlistEntry.mode === 'dine-in';
  const hasItems = waitlistEntry.items?.length > 0;
  const estWait  = waitlistEntry.waitlistPosition * 20;


  return (
    <Shell centered={false}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(14,14,14,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(211,191,162,0.07)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(211,191,162,0.3)' }}>
          {restaurantData?.name}
        </span>
        <span style={{
          fontSize: '0.52rem', fontWeight: '900', letterSpacing: '1.5px',
          padding: '5px 12px', borderRadius: '20px',
          background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)',
          color: 'rgba(211,191,162,0.4)',
          display: 'inline-flex', alignItems: 'center', gap: '6px'
        }}>
          {isDineIn
            ? <><Armchair size={11} color="rgba(211,191,162,0.4)" strokeWidth={1.5} /> {language === 'mr' ? 'वेटलिस्ट' : 'WAITLIST'}</>
            : <><ShoppingBag size={11} color="rgba(211,191,162,0.4)" strokeWidth={1.5} /> {language === 'mr' ? 'पिकअप' : 'PICKUP'}</>
          }
        </span>
      </div>

      <div style={{ padding: '36px 24px 60px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>

        {/* Icon + heading */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px'
        }}>
          <CheckCircle2 size={24} color="rgba(211,191,162,0.7)" strokeWidth={1.5} />
        </div>

        <h1 style={{ fontSize: '1.7rem', fontWeight: '900', color: '#fff', marginBottom: '8px', letterSpacing: '-0.6px', lineHeight: 1.15 }}>
          {language === 'mr' ? "तुम्ही रांगेत आहात!" : "You're All Set!"}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.78rem', marginBottom: '28px', fontWeight: '500', lineHeight: 1.7 }}>
          {language === 'mr' ? 'तुमची माहिती यशस्वीरित्या नोंदवली गेली आहे.' : "Your details are confirmed. Relax — we'll handle the rest."}
        </p>

        {/* STATUS CARD */}
        <div style={{
          background: '#121212', border: '1px solid rgba(211,191,162,0.09)',
          borderRadius: '22px', padding: '28px 24px', marginBottom: '14px',
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(211,191,162,0.25),transparent)' }} />

          {isDineIn ? (
            <>
              <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.25)', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px' }}>
                {language === 'mr' ? 'रांगेतील स्थान' : 'Queue Position'}
              </p>
              <div style={{ fontSize: '5rem', fontWeight: '900', color: '#d3bfa2', lineHeight: 1, fontFamily: 'monospace', marginBottom: '16px', letterSpacing: '-4px' }}>
                #{waitlistEntry.waitlistPosition}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '30px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)' }}>
                <Hourglass size={11} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
                  {language === 'mr' ? `अंदाजे ~${estWait} मिनिटे` : `~${estWait} min estimated wait`}
                </span>
              </div>
            </>
          ) : waitlistEntry.scheduledPickupTime ? (
            <>
              <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.25)', textTransform: 'uppercase', margin: '0 0 14px' }}>
                {language === 'mr' ? 'पिकअप वेळ' : 'Pickup Time'}
              </p>
              <div style={{ fontSize: '3.6rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', letterSpacing: '-2px', marginBottom: '8px', lineHeight: 1 }}>
                {new Date(waitlistEntry.scheduledPickupTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true})}
              </div>
              <p style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.18)', fontWeight: '600', margin: 0 }}>
                {language === 'mr' ? 'ठरलेली वेळ' : 'Your scheduled slot'}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.25)', textTransform: 'uppercase', margin: '0 0 14px' }}>
                {language === 'mr' ? 'पिकअप ऑर्डर' : 'Pickup Order'}
              </p>
              <ShoppingBag size={36} color="rgba(211,191,162,0.4)" strokeWidth={1} style={{ marginBottom: '10px' }} />
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600', margin: 0 }}>
                {language === 'mr' ? 'ऑर्डर नोंदवली गेली' : 'Order received'}
              </p>
            </>
          )}
        </div>

        {/* CONFIRMATION DETAILS — single card, no duplicate */}
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.1)', borderRadius: '18px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ padding: '12px 18px', background: 'rgba(211,191,162,0.04)', borderBottom: '1px solid rgba(211,191,162,0.07)', display: 'flex', alignItems: 'center', gap: '9px' }}>
            <CheckCircle2 size={13} color="rgba(211,191,162,0.5)" strokeWidth={2} />
            <span style={{ fontSize: '0.52rem', fontWeight: '900', color: 'rgba(211,191,162,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {language === 'mr' ? 'पुष्टी तपशील' : 'Confirmation Details'}
            </span>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: language === 'mr' ? 'नाव' : 'NAME',   val: waitlistEntry.customerName, gold: true },
              waitlistEntry.customerPhone && { label: language === 'mr' ? 'मोबाईल' : 'MOBILE', val: `+91 ${waitlistEntry.customerPhone}`, mono: true },
              { label: language === 'mr' ? 'प्रकार' : 'TYPE', val: isDineIn ? 'DINE-IN WAITLIST' : 'PICKUP', badge: true },
              isDineIn && { label: language === 'mr' ? 'जण' : 'GUESTS', val: `${waitlistEntry.partySize}` },
              !isDineIn && waitlistEntry.scheduledPickupTime && { label: language === 'mr' ? 'पिकअप वेळ' : 'PICKUP TIME', val: new Date(waitlistEntry.scheduledPickupTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true}), mono: true, gold: true },
              waitlistEntry.specialRequests && { label: language === 'mr' ? 'विशेष' : 'SPECIAL', val: `"${waitlistEntry.specialRequests}"`, italic: true },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.5px' }}>{row.label}</span>
                {row.badge
                  ? <span style={{ fontSize: '0.6rem', fontWeight: '900', padding: '3px 10px', borderRadius: '20px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.12)', color: '#8a704d' }}>{row.val}</span>
                  : <span style={{ fontSize: '0.78rem', fontWeight: row.gold ? '800' : '600', color: row.gold ? '#d3bfa2' : 'rgba(255,255,255,0.4)', fontFamily: row.mono ? 'monospace' : 'inherit', fontStyle: row.italic ? 'italic' : 'normal' }}>{row.val}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* PRE-ORDER SUMMARY — only when items exist */}
        {hasItems && (
          <div style={{ background: '#0c0c0c', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '16px', padding: '18px', marginBottom: '12px' }}>
            <p style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '2.5px', color: 'rgba(211,191,162,0.22)', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px' }}>
              {language === 'mr' ? 'प्री-ऑर्डर' : 'Pre-Order'}
            </p>
            {waitlistEntry.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < waitlistEntry.items.length - 1 ? '10px' : '0', marginBottom: i < waitlistEntry.items.length - 1 ? '10px' : '0', borderBottom: i < waitlistEntry.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: '900', fontFamily: 'monospace', color: 'rgba(211,191,162,0.25)', minWidth: '18px' }}>×{item.quantity}</span>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{item.name}{item.portion && item.portion !== 'Single' ? ` (${item.portion})` : ''}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#d3bfa2', fontWeight: '800', fontFamily: 'monospace' }}>₹{item.subtotal}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '8px', borderTop: '1px solid rgba(211,191,162,0.07)' }}>
              <span style={{ fontSize: '0.58rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Total</span>
              <span style={{ fontSize: '1rem', color: '#d3bfa2', fontWeight: '900', fontFamily: 'monospace' }}>₹{waitlistEntry.totalAmount}</span>
            </div>
          </div>
        )}

        {/* NOTIFICATION PILL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', marginBottom: '16px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '14px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BellRing size={14} color="rgba(211,191,162,0.45)" strokeWidth={1.5} />
          </div>
          <p style={{ margin: 0, fontSize: '0.71rem', color: 'rgba(255,255,255,0.22)', lineHeight: 1.65, fontWeight: '500' }}>
            {language === 'mr' ? 'टेबल / ऑर्डर तयार झाल्यावर सूचना मिळेल — पेज बंद केले तरीही.' : "You'll be notified when ready — even if you close this page."}
          </p>
        </div>

<button onClick={isDineIn ? downloadWaitlistToken : downloadPickupToken} style={{
  width: '100%', padding: '17px',
  background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
  border: 'none', borderRadius: '14px',
  color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
  cursor: 'pointer', marginBottom: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
  letterSpacing: '0.5px', textTransform: 'uppercase',
  boxShadow: '0 8px 28px rgba(211,191,162,0.18)'
}}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0c0c0c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
  {isDineIn
    ? (language === 'mr' ? 'टोकन डाउनलोड करा' : 'Download Waitlist Token')
    : (language === 'mr' ? 'पिकअप टोकन डाउनलोड करा' : 'Download Pickup Token')}
</button>

        {/* Cancel / Leave Queue */}
        <button onClick={() => {
          axios.delete(`${BASE_URL}/waitlist/session/${tenantId}/${sessionId}`).catch(() => {});
          sessionStorage.removeItem('pratyeksha_session');
          const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          sessionStorage.setItem('pratyeksha_session', newId);
          setWaitlistEntry(null); setRegistrationStep('mode'); setCounterMode(null);
          setCustomerInfo({ name: '', phone: '' }); setPartySize(1);
          setScheduledPickupTime(''); setReservationDate(''); setReservationTime('');
          setSpecialRequests(''); setTablePreference('');
          setCart({}); setSuggestions({});
        }} style={{
          width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.18)', fontSize: '0.7rem', cursor: 'pointer',
          padding: '13px', borderRadius: '12px', fontWeight: '700', letterSpacing: '0.5px', transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; e.currentTarget.style.color = 'rgba(211,191,162,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.18)'; }}
        >
          {language === 'mr' ? 'रद्द करा' : 'Leave Queue'}
        </button>

      </div>

      {/* Reservation pre-order prompt — kept for when user taps ADD PRE-ORDER from reservation confirm */}
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

              <button onClick={() => setReservationAskOrder(false)} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '13px', color: 'rgba(255,255,255,0.2)', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; e.currentTarget.style.color = 'rgba(211,191,162,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}>
                {language === 'mr' ? 'नाही, नंतर ठरवतो' : "No, I'll decide later"}
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

<div style={{ padding: '28px 22px 40px', maxWidth: '440px', margin: '0 auto', width: '100%' }}>
  
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
                  <button key={n} type="button" onClick={() => preserveScroll(() => setPartySize(n))} style={{
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

{/* Pickup time — pickup ONLY, NOT reservation */}
{counterMode === 'pickup' && (
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

    {/* ── MEAL PERIOD + TIME SLOTS ── */}
    <div style={{ marginBottom: '22px' }}>
      <label style={{
        fontSize: '0.54rem', color: 'rgba(211,191,162,0.35)',
        fontWeight: '900', letterSpacing: '2px',
        display: 'block', marginBottom: '12px', textTransform: 'uppercase'
      }}>
        {language === 'mr' ? 'वेळ *' : 'Time Slot *'}
      </label>

      {/* Lunch / Dinner toggle */}
      <div style={{
        display: 'flex', background: '#0d0d0d',
        border: '1px solid rgba(211,191,162,0.1)',
        borderRadius: '12px', padding: '4px', gap: '4px',
        marginBottom: '14px'
      }}>
        {[
          { id: 'lunch',  label: language === 'mr' ? '🌞  दुपारचे जेवण' : '🌞  Lunch',  sub: '1 PM – 4 PM' },
          { id: 'dinner', label: language === 'mr' ? '🌙  रात्रीचे जेवण' : '🌙  Dinner', sub: '7 PM – 11 PM' },
        ].map(period => {
          const isActive = (() => {
            if (!reservationTime) return false;
            const h = parseInt(reservationTime.split(':')[0]);
            return period.id === 'lunch' ? (h >= 13 && h <= 16) : (h >= 19 && h <= 23);
          })();
          return (
            <button key={period.id} type="button"
              onClick={() => {
                // Select first slot of the period by default
                setReservationTime(period.id === 'lunch' ? '13:00' : '19:00');
              }}
              style={{
                flex: 1, padding: '11px 8px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                background: isActive ? 'rgba(211,191,162,0.1)' : 'transparent',
                outline: isActive ? '1px solid rgba(211,191,162,0.25)' : '1px solid transparent',
                transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: '900', color: isActive ? '#d3bfa2' : 'rgba(255,255,255,0.25)' }}>
                {period.label}
              </span>
              <span style={{ fontSize: '0.52rem', color: isActive ? 'rgba(211,191,162,0.4)' : 'rgba(255,255,255,0.12)', fontWeight: '700' }}>
                {period.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time slots — shown based on period */}
      {(() => {
        const lunchSlots  = ['13:00','13:30','14:00','14:30','15:00','15:30','16:00'];
        const dinnerSlots = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30','23:00'];
        const h = reservationTime ? parseInt(reservationTime.split(':')[0]) : null;
        const isLunch  = h !== null && h >= 13 && h <= 16;
        const isDinner = h !== null && h >= 19;
        const slots = isLunch ? lunchSlots : isDinner ? dinnerSlots : [];

        const fmt = (slot) => {
          const [hr, mn] = slot.split(':').map(Number);
          const period = hr < 12 ? 'AM' : 'PM';
          const hr12 = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
          return `${hr12}:${mn.toString().padStart(2,'0')} ${period}`;
        };

        if (slots.length === 0) return (
          <div style={{ textAlign: 'center', padding: '18px', color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontWeight: '600' }}>
            {language === 'mr' ? '↑ वेळ निवडा' : '↑ Select a meal period above'}
          </div>
        );

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px' }}>
            {slots.map(slot => {
              const isSelected = reservationTime === slot;
              return (
                <button key={slot} type="button" onClick={() => preserveScroll(() => setReservationTime(slot))} style={{
                  padding: '11px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontWeight: '900', fontSize: '0.68rem',
                  background: isSelected ? 'linear-gradient(135deg,#d3bfa2,#bda88a)' : '#121212',
                  color: isSelected ? '#0c0c0c' : 'rgba(255,255,255,0.2)',
                  outline: isSelected ? 'none' : '1px solid rgba(211,191,162,0.07)',
                  transition: 'all 0.15s',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)'
                }}>
                  {fmt(slot)}
                </button>
              );
            })}
          </div>
        );
      })()}
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
          <button key={n} type="button" onClick={() => preserveScroll(() => setPartySize(n))} style={{
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

    {/* Special requests — NO table preference */}
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
        placeholder={language === 'mr' ? 'उदा. वाढदिवस, ऍलर्जी, उच्च खुर्ची...' : 'e.g. birthday celebration, nut allergy, high chair...'}
        defaultValue={specialRequests}
        onBlur={e => { setSpecialRequests(e.target.value); e.target.style.borderColor = 'rgba(211,191,162,0.12)'; }}
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

    {/* ── INLINE CTA — replaces floating bottom button for reservation ── */}
    {(() => {
      const nameOk  = customerInfo.name.trim().length > 0;
      const phoneOk = customerInfo.phone?.replace(/\D/g,'').length === 10;
      const dateOk  = !!reservationDate;
      const timeOk  = !!reservationTime;
      const allOk   = nameOk && phoneOk && dateOk && timeOk;

      const hint = !nameOk
        ? (language === 'mr' ? 'नाव आवश्यक आहे' : 'Enter your name above')
        : !phoneOk
        ? (language === 'mr' ? '१० अंकी नंबर आवश्यक' : '10-digit number required')
        : !dateOk
        ? (language === 'mr' ? 'तारीख निवडा' : 'Choose a date')
        : !timeOk
        ? (language === 'mr' ? 'वेळ निवडा' : 'Select a time slot')
        : null;

      return (
        <div style={{ marginBottom: '40px' }}>
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
            onClick={() => { if (allOk) setReservationAskOrder(true); }}
            style={{
              width: '100%', padding: '17px',
              background: allOk
                ? 'linear-gradient(135deg, #d3bfa2, #bda88a)'
                : 'rgba(211,191,162,0.05)',
              color: allOk ? '#0c0c0c' : 'rgba(211,191,162,0.2)',
              border: allOk ? 'none' : '1px solid rgba(211,191,162,0.08)',
              borderRadius: '14px', fontWeight: '900', fontSize: '0.88rem',
              cursor: allOk ? 'pointer' : 'not-allowed',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px',
              boxShadow: allOk ? '0 8px 24px rgba(211,191,162,0.15)' : 'none'
            }}
          >
            <CalendarClock size={16} strokeWidth={2} />
            {language === 'mr' ? 'बुकिंग पुढे जा' : 'CONTINUE BOOKING'}
            <ChevronRight size={16} />
          </button>
        </div>
      );
    })()}
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
                    <div style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.2)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── INLINE CTA — dine-in and pickup ── */}
          {counterMode !== 'reservation' && (() => {
            const nameOk  = customerInfo.name.trim().length > 0;
            const phoneOk = customerInfo.phone?.replace(/\D/g,'').length === 10;
            const pickupOk = counterMode !== 'pickup' || !!scheduledPickupTime;
            const allOk   = nameOk && phoneOk && pickupOk;

            const hint = !nameOk
              ? (language === 'mr' ? 'नाव आवश्यक आहे' : 'Enter your name above')
              : !phoneOk
              ? (language === 'mr' ? '१० अंकी नंबर आवश्यक' : '10-digit number required')
              : !pickupOk
              ? (language === 'mr' ? 'पिकअप वेळ निवडा' : 'Select a pickup time')
              : null;

            return (
              <div style={{ marginBottom: '40px' }}>
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
                  onClick={() => { if (allOk) setRegistrationStep('menu'); }}
                  style={{
                    width: '100%', padding: '17px',
                    background: allOk
                      ? 'linear-gradient(135deg, #d3bfa2, #bda88a)'
                      : 'rgba(211,191,162,0.05)',
                    color: allOk ? '#0c0c0c' : 'rgba(211,191,162,0.2)',
                    border: allOk ? 'none' : '1px solid rgba(211,191,162,0.08)',
                    borderRadius: '14px', fontWeight: '900', fontSize: '0.88rem',
                    cursor: allOk ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '10px',
                    boxShadow: allOk ? '0 8px 24px rgba(211,191,162,0.15)' : 'none',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  {counterMode === 'dine-in'
                    ? <Armchair size={16} strokeWidth={1.5} />
                    : <ShoppingBag size={16} strokeWidth={1.5} />
                  }
                  {counterMode === 'dine-in'
                    ? (language === 'mr' ? 'मेनू पहा' : 'BROWSE MENU')
                    : (language === 'mr' ? 'मेनू पहा' : 'BROWSE MENU')
                  }
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })()}

        </div>{/* end of padding div */}

        {/* ── RESERVATION ORDER PROMPT OVERLAY ── */}
{/* ── RESERVATION: ASK ORDER OVERLAY ── */}
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
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 26 }}
                style={{
                  width: '100%', maxWidth: '420px',
                  background: '#0f0f0f',
                  border: '1px solid rgba(211,191,162,0.12)',
                  borderRadius: '24px 24px 20px 20px',
                  overflow: 'hidden', margin: '0 16px'
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '22px 22px 18px',
                  borderBottom: '1px solid rgba(211,191,162,0.07)',
                  background: 'rgba(211,191,162,0.03)'
                }}>
                  <div style={{
                    fontSize: '0.5rem', color: 'rgba(211,191,162,0.3)',
                    fontWeight: '900', letterSpacing: '2.5px',
                    textTransform: 'uppercase', marginBottom: '4px'
                  }}>
                    {restaurantData?.name}
                  </div>

                  {/* Booking summary strip */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '8px', marginTop: '12px'
                  }}>
                    {[
                      { icon: <Users size={10} color="rgba(211,191,162,0.4)" />, label: customerInfo.name, sub: `${partySize} guests` },
                      { icon: <CalendarClock size={10} color="rgba(211,191,162,0.4)" />, label: reservationDate ? new Date(reservationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', sub: (() => { if (!reservationTime) return '—'; const [h,m] = reservationTime.split(':').map(Number); return h < 12 ? `${h}:${m.toString().padStart(2,'0')} AM` : h === 12 ? `12:${m.toString().padStart(2,'0')} PM` : `${h-12}:${m.toString().padStart(2,'0')} PM`; })() },
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: '#141414',
                        border: '1px solid rgba(211,191,162,0.07)',
                        borderRadius: '10px', padding: '10px 12px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        {s.icon}
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#d3bfa2', lineHeight: 1.2 }}>{s.label}</div>
                          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', marginTop: '2px' }}>{s.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 22px 24px' }}>
                  <h3 style={{
                    fontSize: '1rem', fontWeight: '900', color: '#fff',
                    marginBottom: '6px', letterSpacing: '-0.3px'
                  }}>
                    {language === 'mr' ? 'आधीच जेवण ऑर्डर करायचे का?' : 'Would you like to pre-order?'}
                  </h3>
                  <p style={{
                    fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)',
                    lineHeight: 1.7, marginBottom: '20px', fontWeight: '500'
                  }}>
                    {language === 'mr'
                      ? 'तुम्ही येण्यापूर्वीच जेवण तयार असेल — प्रतीक्षा नाही!'
                      : 'Your food will be ready when you arrive — no waiting at all.'}
                  </p>

                  {/* YES — browse menu */}
                  <button
                    onClick={() => { setReservationAskOrder(false); setRegistrationStep('menu'); }}
                    style={{
                      width: '100%', padding: '16px',
                      background: 'linear-gradient(135deg,#d3bfa2,#bda88a)',
                      border: 'none', borderRadius: '13px',
                      color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
                      cursor: 'pointer', marginBottom: '10px',
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: '0 8px 24px rgba(211,191,162,0.15)'
                    }}
                  >
                    <UtensilsCrossed size={15} strokeWidth={2.5} />
                    {language === 'mr' ? 'हो, मेनू पाहतो' : 'Yes, Pre-Order Now'}
                    <ChevronRight size={15} />
                  </button>

                  {/* NO — just reserve, place with empty items, go to confirm */}
                  <button
                    onClick={async () => {
                      const [hours, minutes] = reservationTime.split(':').map(Number);
                      const resDateTime = new Date(reservationDate);
                      resDateTime.setHours(hours, minutes, 0, 0);
                      try {
                        const res = await axios.post(`${BASE_URL}/reservations/${tenantId}`, {
                          sessionId,
                          customerName: customerInfo.name,
                          customerPhone: customerInfo.phone?.replace(/\D/g,'') || '',
                          partySize,
                          reservationTime: resDateTime.toISOString(),
                          tablePreference,
                          specialRequests,
                          items: [],
                          totalAmount: 0,
                          status: 'pending'
                        });
setWaitlistEntry({ ...res.data.reservation, mode: 'reservation', _noPreorder: true });
setReservationAskOrder(false);
setRegistrationStep('confirm');
// In the "No, just reserve the table" button's onClick, after setRegistrationStep('confirm'):

const phone = customerInfo.phone?.replace(/\D/g, '') || '';
if (phone.length === 10) {
  axios.post(`${BASE_URL}/customers/upsert`, {
    tenantId,
    name: customerInfo.name.trim(),
    phone,
    lastVisit: new Date().toISOString(),
  }).catch(() => {});
}
                        if ('Notification' in window && Notification.permission === 'granted') {
                          new Notification('📅 Reservation Requested!', {
                            body: `Hi ${customerInfo.name}! Pending confirmation.`,
                            icon: '/logo.png'
                          });
                        }
                      } catch(err) {
                        console.error(err);
                        triggerAlert('orderError','error');
                      }
                    }}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'transparent',
                      border: '1px solid rgba(211,191,162,0.1)',
                      borderRadius: '13px', color: 'rgba(255,255,255,0.25)',
                      fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                      transition: 'all 0.15s', letterSpacing: '0.3px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.22)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(211,191,162,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.25)'; }}
                  >
                    {language === 'mr' ? 'नाही, फक्त टेबल बुक करा' : 'No, just reserve the table'}
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
{/* RIGHT: back */}

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
) : counterMode === 'reservation' ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <CalendarClock size={10} color="rgba(211,191,162,0.4)" strokeWidth={1.5} />
    <span style={{ fontSize: '0.66rem', fontWeight: '900', color: '#d3bfa2' }}>
      {language === 'mr' ? 'बुकिंग' : 'RESERVATION'}
      {reservationDate && reservationTime ? ` · ${new Date(reservationDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${(() => { const [h, m] = reservationTime.split(':').map(Number); return h > 12 ? `${h-12}:${m.toString().padStart(2,'0')} PM` : `${h}:${m.toString().padStart(2,'0')} AM`; })()}` : ''}
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
        
{hasNonVegInView && (
  <div style={{
    position: 'absolute', top: '15px', left: '15px',
    display: 'flex',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '4px',
    gap: '4px',
    zIndex: 5
  }}>
    {/* VEG */}
    <button
      onClick={() => setFilterVegOnly(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 12px', borderRadius: '16px', border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        outline: filterVegOnly
          ? '1.5px solid rgba(211, 191, 162, 0.2)'
          : '1px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Veg square symbol */}
      <span style={{
        width: '12px', height: '12px', flexShrink: 0,
        border: '2px solid #4a7c3f',
        borderRadius: '2px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#4a7c3f'
        }} />
      </span>
      <span style={{
        fontSize: '0.6rem', fontWeight: '900', letterSpacing: '0.5px',
        color: filterVegOnly ? '#c9a84c' : 'rgba(255,255,255,0.3)'
      }}>
        {language === 'mr' ? 'शाकाहारी' : 'VEG'}
      </span>
    </button>

    {/* NON-VEG */}
    <button
      onClick={() => setFilterVegOnly(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 12px', borderRadius: '16px', border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        outline: !filterVegOnly
          ? '1.5px solid rgba(211, 191, 162, 0.2)'
          : '1px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Non-veg triangle symbol */}
      <span style={{
        width: '12px', height: '12px', flexShrink: 0,
        border: '2px solid #8a3030',
        borderRadius: '2px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{
          width: 0, height: 0,
          borderLeft: '3.5px solid transparent',
          borderRight: '3.5px solid transparent',
          borderBottom: '6px solid #8a3030'
        }} />
      </span>
      <span style={{
        fontSize: '0.6rem', fontWeight: '900', letterSpacing: '0.5px',
        color: !filterVegOnly ? '#c9a84c' : 'rgba(255,255,255,0.3)'
      }}>
        {language === 'mr' ? 'मांसाहारी' : 'NON-VEG'}
      </span>
    </button>
  </div>
)}
        <h1 style={{...styles.cafeName, color: primaryColor}}>{restaurantData?.name || 'PRATYEKSHA'}</h1>
        <div style={styles.poweredBy}>{t[language].poweredBy} <span>PRATYEKSHA</span> • {t[language].table} {convertToMrNumber(tableNumber)}</div>
      </header>

{/* SEARCH BAR */}

<div style={styles.searchWrapper}>
  <div style={{ position: 'relative' }}>
    <div style={styles.searchContainer}>
      <Search size={18} color={primaryColor} />
      <input
        type="text"
        placeholder={t[language].searchPlaceholder}
        style={styles.searchInput}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      {searchQuery.length > 0 && (
        <button
          onClick={() => setSearchQuery('')}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(211,191,162,0.4)', cursor: 'pointer', padding: '4px',
            display: 'flex', alignItems: 'center'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
 
    {/* ── PREMIUM SEARCH SUGGESTIONS DROPDOWN ── */}
    {globalSearchResults.length > 0 && searchQuery.length >= 2 && (
      <div style={{
        position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 2000,
        background: '#0f0f0f',
        border: '1px solid rgba(211,191,162,0.18)',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(211,191,162,0.06)'
      }}>
        {/* Header strip */}
        <div style={{
          padding: '10px 16px 8px',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Search size={11} color="rgba(211,191,162,0.3)" />
          <span style={{
            fontSize: '0.5rem', fontWeight: '900', letterSpacing: '2px',
            color: 'rgba(211,191,162,0.28)', textTransform: 'uppercase'
          }}>
            {globalSearchResults.length} {language === 'mr' ? 'पदार्थ सापडले' : 'dishes found'}
          </span>
        </div>
 
        {/* Results list */}
        <div style={{ maxHeight: '320px', overflowY: 'auto' }} className="no-scrollbar">
          {globalSearchResults.map((item, idx) => {
            const cat = categoryList.find(c => c.categoryId === item.categoryId);
            const isCurrentCat = item.categoryId === selectedCategoryId;
            const isStar   = item._eng?.quadrant === 'star';
            const isPuzzle = item._eng?.quadrant === 'puzzle';
 
            return (
              <div
                key={item._id}
                onMouseDown={e => {
                  // onMouseDown fires before onBlur — prevents dropdown vanishing before click
                  e.preventDefault();
                  setSelectedCategoryId(item.categoryId);
                  setSearchQuery(item.name); // fill search with dish name to highlight it
                  setTimeout(() => {
                    // Clear search entirely after navigation so dropdown disappears
                    setSearchQuery('');
                    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }, 80);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '13px 16px',
                  borderBottom: idx < globalSearchResults.length - 1
                    ? '1px solid rgba(211,191,162,0.05)'
                    : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(211,191,162,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* FSSAI dot — left edge */}
                <div style={{
                  width: '16px', height: '16px', flexShrink: 0,
                  border: `1.5px solid ${item.isVeg !== false
                    ? 'rgba(201,168,76,0.6)'
                    : 'rgba(201,168,76,0.35)'}`,
                  borderRadius: '3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxSizing: 'border-box'
                }}>
                  {item.isVeg !== false ? (
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'rgba(201,168,76,0.75)'
                    }} />
                  ) : (
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: '3px solid transparent',
                      borderRight: '3px solid transparent',
                      borderBottom: '5px solid rgba(201,168,76,0.55)'
                    }} />
                  )}
                </div>
 
                {/* Text block — LEFT ALIGNED */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  {/* Dish name */}
                  <div style={{
                    fontSize: '0.86rem', fontWeight: '700', color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '3px'
                  }}>
                    {language === 'mr' ? (item.name_mr || item.name) : item.name}
                  </div>
 
                  {/* Category + nav hint */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: '0.56rem', color: 'rgba(211,191,162,0.35)',
                      fontWeight: '700'
                    }}>
                      {language === 'mr' ? (cat?.name_mr || cat?.name) : cat?.name}
                    </span>
                    {!isCurrentCat && (
                      <>
                        <span style={{ color: 'rgba(211,191,162,0.15)', fontSize: '0.5rem' }}>·</span>
                        <span style={{
                          fontSize: '0.52rem',
                          color: 'rgba(201,168,76,0.45)',
                          fontWeight: '800'
                        }}>
                          {language === 'mr' ? 'टॅप करून जा →' : 'tap to navigate →'}
                        </span>
                      </>
                    )}
                    {/* Engineering badge inline */}
                    {isStar && (
                      <span style={{
                        fontSize: '0.48rem', fontWeight: '900', padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'rgba(201,168,76,0.1)',
                        color: '#c9a84c',
                        border: '1px solid rgba(201,168,76,0.25)'
                      }}>★ BESTSELLER</span>
                    )}
                    {isPuzzle && !isStar && (
                      <span style={{
                        fontSize: '0.48rem', fontWeight: '900', padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'rgba(189,168,138,0.1)',
                        color: '#bda88a',
                        border: '1px solid rgba(189,168,138,0.22)'
                      }}>✦ CHEF PICK</span>
                    )}
                  </div>
                </div>
 
                {/* Price — right edge */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '0.88rem', fontWeight: '900', color: '#d3bfa2',
                    fontFamily: 'monospace'
                  }}>
                    ₹{item.priceFull || item.price}
                  </div>
                  {item.priceHalf && (
                    <div style={{
                      fontSize: '0.54rem', color: 'rgba(211,191,162,0.3)',
                      fontWeight: '700', marginTop: '1px'
                    }}>
                      H: ₹{item.priceHalf}
                    </div>
                  )}
                </div>
 
                {/* Arrow chevron */}
                <ChevronRight size={13} color="rgba(211,191,162,0.2)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
 
        {/* Footer — show all */}
        <div
          onMouseDown={e => {
            e.preventDefault();
            setSelectedCategoryId('all');
            setSearchQuery('');
          }}
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(211,191,162,0.07)',
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
            fontSize: '0.58rem', color: 'rgba(211,191,162,0.3)',
            fontWeight: '800', letterSpacing: '0.5px',
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(211,191,162,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(211,191,162,0.3)'}
        >
          <Search size={11} />
          {language === 'mr'
            ? 'सर्व श्रेणींमध्ये पहा'
            : `Show all results across every category`}
        </div>
      </div>
    )}
  </div>
</div>

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
            {/* ── CATEGORY PERFORMANCE SUMMARY — shown when a specific category is selected ── */}

{selectedCategoryId !== 'all' && !searchQuery && (() => {
  const catItems  = filteredMenuItems;
  const stars     = catItems.filter(i => i._eng?.quadrant === 'star').length;
  const puzzles   = catItems.filter(i => i._eng?.quadrant === 'puzzle').length;
  const totalSold = catItems.reduce((a, i) => a + (i._eng?.qtySold || 0), 0);
  if (totalSold === 0) return null;
 
  return (
    <div style={{
      margin: '0 0 14px',
      padding: '11px 15px',
      background: 'rgba(201,168,76,0.04)',
      border: '1px solid rgba(201,168,76,0.1)',
      borderRadius: '13px',
      display: 'flex', alignItems: 'center', gap: '14px',
      flexWrap: 'wrap'
    }}>
      {/* Left: label + count */}
      <div style={{ flex: 1, minWidth: '100px' }}>
        <div style={{
          fontSize: '0.46rem', color: 'rgba(211,191,162,0.28)',
          fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px'
        }}>
          {language === 'mr' ? 'श्रेणी अंतर्दृष्टी' : 'Category Insights'}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>
          {catItems.length} {language === 'mr' ? 'पदार्थ' : 'dishes'}
          {totalSold > 0 && ` · ${totalSold} ${language === 'mr' ? 'विक्री (३० दिवस)' : 'sold (30 days)'}`}
        </div>
      </div>
 
      {/* Right: badges */}
      <div style={{ display: 'flex', gap: '7px' }}>
        {stars > 0 && (
          <div style={{
            textAlign: 'center', padding: '6px 11px',
            background: 'rgba(201,168,76,0.08)',
            borderRadius: '9px',
            border: '1px solid rgba(201,168,76,0.18)'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#c9a84c', fontFamily: 'monospace', lineHeight: 1 }}>
              {stars}
            </div>
            <div style={{ fontSize: '0.44rem', color: 'rgba(201,168,76,0.45)', fontWeight: '900', letterSpacing: '1px', marginTop: '2px' }}>
              STARS
            </div>
          </div>
        )}
        {puzzles > 0 && (
          <div style={{
            textAlign: 'center', padding: '6px 11px',
            background: 'rgba(189,168,138,0.07)',
            borderRadius: '9px',
            border: '1px solid rgba(189,168,138,0.16)'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#bda88a', fontFamily: 'monospace', lineHeight: 1 }}>
              {puzzles}
            </div>
            <div style={{ fontSize: '0.44rem', color: 'rgba(189,168,138,0.4)', fontWeight: '900', letterSpacing: '1px', marginTop: '2px' }}>
              PICKS
            </div>
          </div>
        )}
      </div>
    </div>
  );
})()}

{filteredMenuItems.map((item) => (
              <div key={item._id} style={{...styles.menuCard, background: cardBg, borderColor: borderColor}}>
    <div style={styles.tagContainer}>
      {item.isChefSpecial === true && (
        <div style={styles.chefTag}>
          <Sparkles size={10} style={{marginRight: '4px'}} /> {t[language].chefChoice}
        </div>
      )}
    </div>
<div style={styles.itemContentLeft}>
<p style={{
  fontSize: '1.05rem', fontWeight: '700', color: '#fff',
  display: 'flex', alignItems: 'center', gap: '6px',
  flexWrap: 'wrap', margin: '0 0 6px'
}}>
  {/* ── FSSAI Veg/Non-veg indicator (only shown when restaurant has both) ── */}
  {hasNonVegInView && !isOnlyVegTenant && (
    <span
      title={item.isVeg !== false ? 'Vegetarian' : 'Non-Vegetarian'}
      style={{
        width: '15px', height: '15px', flexShrink: 0,
        border: `1.5px solid ${item.isVeg !== false
          ? 'rgba(201,168,76,0.65)'
          : 'rgba(201,168,76,0.4)'}`,
        borderRadius: '3px',
        display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', boxSizing: 'border-box'
      }}
    >
      {item.isVeg !== false ? (
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'rgba(201,168,76,0.8)'
        }} />
      ) : (
        <div style={{
          width: 0, height: 0,
          borderLeft: '3px solid transparent',
          borderRight: '3px solid transparent',
          borderBottom: '5.5px solid rgba(201,168,76,0.65)'
        }} />
      )}
    </span>
  )}
 
  {/* Dish name */}
  {language === 'mr' ? item.name_mr : item.name}
 
  {/* ── ENGINEERING BADGE: BESTSELLER (gold) ── */}
  {item._eng?.quadrant === 'star' && (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '0.5rem', fontWeight: '900', letterSpacing: '0.5px',
      padding: '2px 7px', borderRadius: '4px',
      background: 'rgba(201,168,76,0.12)',
      color: '#c9a84c',
      border: '1px solid rgba(201,168,76,0.3)'
    }}>
      ★ {language === 'mr' ? 'बेस्टसेलर' : 'BESTSELLER'}
    </span>
  )}
 
  {/* ── ENGINEERING BADGE: CHEF RECOMMENDS (warm amber — NO green) ── */}
  {item._eng?.quadrant === 'puzzle' && (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '0.5rem', fontWeight: '900', letterSpacing: '0.5px',
      padding: '2px 7px', borderRadius: '4px',
      background: 'rgba(189,168,138,0.12)',
      color: '#bda88a',
      border: '1px solid rgba(189,168,138,0.28)'
    }}>
      ✦ {language === 'mr' ? 'शेफ पसंती' : 'CHEF PICK'}
    </span>
  )}
 
  {/* ── SPICE BADGE ── */}
  {item.spicylevel && (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '0.58rem', fontWeight: '900', padding: '2px 7px',
      borderRadius: '4px',
      background: item.spicylevel.toUpperCase() === 'HIGH'
        ? 'rgba(232,170,90,0.14)'
        : 'rgba(211,191,162,0.12)',
      color: item.spicylevel.toUpperCase() === 'HIGH' ? '#e8aa5a' : '#d3bfa2',
      border: `1px solid ${item.spicylevel.toUpperCase() === 'HIGH'
        ? 'rgba(232,170,90,0.35)'
        : 'rgba(211,191,162,0.3)'}`,
      letterSpacing: '0.5px'
    }}>
      <Flame size={9} strokeWidth={2.5} />
      {t[language][`spice${item.spicylevel.charAt(0).toUpperCase() + item.spicylevel.slice(1).toLowerCase()}`] || item.spicylevel.toUpperCase()}
    </span>
  )}
 
  {/* ── SERVES BADGE ── */}
  {item.servingSize > 0 && (
    <span style={{
      fontSize: '0.58rem', fontWeight: '800', padding: '2px 7px',
      borderRadius: '4px',
      background: 'rgba(201,168,76,0.08)',
      color: '#c9a84c',
      border: '1px solid rgba(201,168,76,0.22)',
      letterSpacing: '0.3px',
      display: 'inline-flex', alignItems: 'center', gap: '3px'
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      {language === 'mr' ? `${item.servingSize} जण` : `Serves ${item.servingSize}`}
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


{/* ── ORDER STATUS BANNER — tap to expand tracking panel ── */}
{hasPlacedInitialOrder && !isCounterScan && Object.keys(liveOrderStatuses).length > 0 && (() => {
  const statuses = Object.values(liveOrderStatuses);
  const hasReady  = statuses.some(s => s === 'ready');
  const hasPending = statuses.some(s => s === 'pending');
  const allServed  = statuses.every(s => s === 'served');
  const activeStatus = hasReady ? 'ready' : hasPending ? 'pending' : 'served';

  const statusMeta = {
    pending: { label: language === 'mr' ? 'किचनमध्ये बनत आहे' : 'In the kitchen', sub: language === 'mr' ? 'थोडा वेळ लागेल' : 'Being prepared now', icon: <Flame size={14} color="#d3bfa2" strokeWidth={1.5} />, pulse: true },
    ready:   { label: language === 'mr' ? 'तयार आहे!' : 'Ready!', sub: language === 'mr' ? 'कृपया घ्या' : 'Please collect your order', icon: <CheckCircle2 size={14} color="#6dba96" strokeWidth={2} />, pulse: false },
    served:  { label: language === 'mr' ? 'सर्व्ह केले' : 'All served', sub: language === 'mr' ? 'आनंद घ्या!' : 'Enjoy your meal!', icon: <Sparkles size={14} color="#d3bfa2" strokeWidth={1.5} />, pulse: false },
  };
  const meta = statusMeta[activeStatus];

  return (
    <>
      {/* STICKY BANNER */}
      <motion.div
        onClick={() => setOrderTrackingPanelOpen(true)}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          margin: '0 16px 12px',
          background: hasReady ? 'rgba(45,106,79,0.12)' : '#0c0c0c',
          border: `1px solid ${hasReady ? 'rgba(109,186,150,0.3)' : 'rgba(211,191,162,0.1)'}`,
          borderRadius: '16px', overflow: 'hidden', cursor: 'pointer'
        }}
      >
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Pulse dot or icon */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: hasReady ? 'rgba(109,186,150,0.1)' : 'rgba(211,191,162,0.06)',
              border: `1px solid ${hasReady ? 'rgba(109,186,150,0.2)' : 'rgba(211,191,162,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {meta.icon}
            </div>
            {meta.pulse && (
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '10px',
                  border: '1px solid rgba(211,191,162,0.35)', pointerEvents: 'none'
                }}
              />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '900', color: hasReady ? '#6dba96' : '#d3bfa2', marginBottom: '2px' }}>
              {meta.label}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.22)', fontWeight: '500' }}>
              {meta.sub}
            </div>
          </div>

          {/* Progress mini bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              {['pending','ready','served'].map((s, i) => {
                const stepIdx = ['pending','ready','served'].indexOf(activeStatus);
                return (
                  <div key={s} style={{
                    width: i <= stepIdx ? '14px' : '5px', height: '5px',
                    borderRadius: '2.5px', transition: 'all 0.4s',
                    background: i <= stepIdx
                      ? (s === 'ready' || activeStatus === 'ready' ? 'rgba(109,186,150,0.7)' : 'rgba(211,191,162,0.5)')
                      : 'rgba(255,255,255,0.07)'
                  }} />
                );
              })}
            </div>
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700', letterSpacing: '0.3px' }}>
              {language === 'mr' ? 'तपशील पहा' : 'View details'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── FULL TRACKING PANEL (slide up) ── */}
      <AnimatePresence>
        {orderTrackingPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 7500,
              background: 'rgba(0,0,0,0.88)',
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'center', padding: '0 0 20px',
              fontFamily: 'Poppins, sans-serif'
            }}
            onClick={() => setOrderTrackingPanelOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '440px',
                background: '#0c0c0c',
                border: '1px solid rgba(211,191,162,0.12)',
                borderRadius: '24px 24px 18px 18px',
                overflow: 'hidden', margin: '0 14px'
              }}
            >
              <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(211,191,162,0.5),transparent)' }} />

              {/* Panel header */}
              <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid rgba(211,191,162,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.3)', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                    {language === 'mr' ? 'ऑर्डर स्थिती' : 'Order Tracking'}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <MapPin size={12} color="rgba(211,191,162,0.5)" strokeWidth={1.5} />
                    {language === 'mr' ? `टेबल ${tableNumber}` : `Table ${tableNumber}`}
                  </div>
                </div>
                <button onClick={() => setOrderTrackingPanelOpen(false)} style={{
                  width: '30px', height: '30px', borderRadius: '9px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <X size={14} />
                </button>
              </div>

              {/* PIPELINE VISUAL */}
              <div style={{ padding: '20px 18px' }}>
                {/* 3-step timeline */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', position: 'relative' }}>
                  {/* Connecting line behind */}
                  <div style={{ position: 'absolute', top: '18px', left: '10%', right: '10%', height: '1px', background: 'rgba(255,255,255,0.06)', zIndex: 0 }} />
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: activeStatus === 'pending' ? '15%' : activeStatus === 'ready' ? '55%' : '80%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ position: 'absolute', top: '18px', left: '10%', height: '1px', background: 'linear-gradient(90deg,#c9a84c,rgba(211,191,162,0.4))', zIndex: 0 }}
                  />

                  {[
                    { key: 'pending', label: language === 'mr' ? 'ऑर्डर\nमिळाली' : 'Order\nReceived',  icon: <ReceiptText size={16} strokeWidth={1.5} /> },
                    { key: 'pending', label: language === 'mr' ? 'किचनमध्ये\nबनत आहे' : 'In the\nKitchen', icon: <Flame size={16} strokeWidth={1.5} /> },
                    { key: 'ready',   label: language === 'mr' ? 'तयार /\nसर्व्ह' : 'Ready /\nServed',  icon: <CheckCircle2 size={16} strokeWidth={1.5} /> },
                  ].map((step, i) => {
                    const stepIdx = ['pending','ready','served'].indexOf(activeStatus);
                    const reached = i <= stepIdx || (i === 1 && ['pending','ready','served'].includes(activeStatus));
                    const isActive = (i === 0 && activeStatus === 'pending') || (i === 1 && activeStatus === 'pending') || (i === 2 && (activeStatus === 'ready' || activeStatus === 'served'));
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                        <motion.div
                          animate={isActive && activeStatus === 'pending' && i === 1 ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                          style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: reached
                              ? (activeStatus === 'ready' && i === 2 ? 'rgba(45,106,79,0.25)' : 'rgba(211,191,162,0.1)')
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${reached
                              ? (activeStatus === 'ready' && i === 2 ? 'rgba(109,186,150,0.35)' : 'rgba(211,191,162,0.25)')
                              : 'rgba(255,255,255,0.07)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: reached
                              ? (activeStatus === 'ready' && i === 2 ? '#6dba96' : '#d3bfa2')
                              : 'rgba(255,255,255,0.15)',
                            transition: 'all 0.4s'
                          }}
                        >
                          {step.icon}
                        </motion.div>
                        <div style={{
                          fontSize: '0.54rem', fontWeight: '700', textAlign: 'center', lineHeight: 1.4,
                          color: reached ? (activeStatus === 'ready' && i === 2 ? '#6dba96' : 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.15)',
                          whiteSpace: 'pre-line', transition: 'all 0.4s'
                        }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* INDIVIDUAL ORDER ROWS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {Object.entries(liveOrderStatuses).map(([orderId, status], idx) => {
                    const stepIdx = ['pending','ready','served'].indexOf(status);
                    const statusColor = { pending: '#8a704d', ready: '#6dba96', served: '#555' };
                    const statusIcon  = {
                      pending: <Flame size={11} color="#8a704d" strokeWidth={1.5} />,
                      ready:   <CheckCircle2 size={11} color="#6dba96" strokeWidth={2} />,
                      served:  <Sparkles size={11} color="#555" strokeWidth={1.5} />
                    };
                    const statusLabel = {
                      pending: language === 'mr' ? 'बनत आहे' : 'Preparing',
                      ready:   language === 'mr' ? 'तयार आहे!' : 'Ready!',
                      served:  language === 'mr' ? 'सर्व्ह केले' : 'Served'
                    };
                    return (
                      <div key={orderId} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 13px',
                        background: status === 'ready' ? 'rgba(45,106,79,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${status === 'ready' ? 'rgba(109,186,150,0.15)' : 'rgba(211,191,162,0.07)'}`,
                        borderRadius: '11px', transition: 'all 0.3s'
                      }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.56rem', fontWeight: '900', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace'
                        }}>
                          #{idx + 1}
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {statusIcon[status]}
                          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: statusColor[status] || '#555' }}>
                            {statusLabel[status]}
                          </span>
                        </div>
                        {/* Mini progress */}
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {['pending','ready','served'].map((s, i) => (
                            <div key={s} style={{
                              width: i <= stepIdx ? '12px' : '4px', height: '4px', borderRadius: '2px',
                              background: i <= stepIdx
                                ? (s === 'ready' ? 'rgba(109,186,150,0.6)' : 'rgba(211,191,162,0.45)')
                                : 'rgba(255,255,255,0.07)',
                              transition: 'all 0.4s'
                            }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* EST TIME note */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '10px 13px',
                  background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)',
                  borderRadius: '11px'
                }}>
                  <Timer size={13} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />
                  <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, fontWeight: '500' }}>
                    {activeStatus === 'ready'
                      ? (language === 'mr' ? 'तुमची ऑर्डर टेबलवर येत आहे.' : 'Your order is on its way to your table.')
                      : activeStatus === 'served'
                      ? (language === 'mr' ? 'आनंद घ्या!' : 'Enjoy your meal!')
                      : (language === 'mr' ? 'सामान्यत: १५–२५ मिनिटे लागतात.' : 'Typically ready in 15–25 minutes.')}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
})()}
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
              {['spoon', 'fork', 'plates', 'tissue'].map(id => (
  <div key={id} style={styles.waiterCountCard}>
    <div style={{ color: primaryColor }}>
      {/* UPDATED ICON LOGIC */}
      {id === 'spoon' && <Utensils size={24} />}
      {id === 'fork' && <UtensilsCrossed size={24} />}
      {id === 'plates' && <Layers size={24} />}
      {id === 'tissue' && <Box size={24} />}
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
<X size={28} color={primaryColor} onClick={() => {
  setIsExtraItemsOpen(false);
  setExtraItemCart({});
  setExtraItemSearchQuery('');
  setActiveExtraCategory('All');
}} />      </div>

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
const categoryIconMap = {
            'Cold Drinks':    { icon: GlassWater,  color: '#6ba3d6' },
            'Ice Cream':      { icon: IceCream2,   color: '#f0c0c0' },
            'Packaged Snacks':{ icon: Cookie,      color: '#c9a84c' },
            'Juices':         { icon: Apple,       color: '#8bc34a' },
            'Mineral Water':  { icon: Droplets,    color: '#64b5f6' },
            'Dairy':          { icon: Milk,        color: '#e0d8cc' },
            'Sweets':         { icon: Candy,       color: '#f48fb1' },
            'Coffee':         { icon: Coffee,      color: '#a1887f' },
            'Snacks':         { icon: Sandwich,    color: '#ffb74d' },
            'Beverages':      { icon: Wind,        color: '#80cbc4' },
            'Other':          { icon: Box,         color: '#9e9e9e' },
          };
          const getCatMeta = (cat) => categoryIconMap[cat] || { icon: Box, color: '#9e9e9e' };

          const filtered = extraItems.filter(i => {
            if (!i.isAvailable) return false;
            const matchCat = activeExtraCategory === 'All' || i.category === activeExtraCategory;
            const matchSearch = i.name.toLowerCase().includes(extraItemSearchQuery.toLowerCase());
            return matchCat && matchSearch;
          });

          if (filtered.length === 0) return (
<div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 14px',
                background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Package size={24} color="rgba(211,191,162,0.2)" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#333' }}>
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
                  {(() => {
                    const meta = getCatMeta(cat);
                    const CatIcon = meta.icon;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0,
                          background: `${meta.color}18`,
                          border: `1px solid ${meta.color}35`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <CatIcon size={13} color={meta.color} strokeWidth={1.8} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{cat}</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(211,191,162,0.08)' }} />
                      </div>
                    );
                  })()}

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map(item => {
                      const qty = extraItemCart[item._id] || 0;
const threshold = item.lowStockThreshold ?? 5;
const isLow = item.currentStock > 0 && item.currentStock <= threshold;
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
{/* Category icon */}
                          {(() => {
                            const meta = getCatMeta(item.category);
                            const ItemIcon = meta.icon;
                            return (
                              <div style={{
                                width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                                background: `${meta.color}12`,
                                border: `1px solid ${meta.color}28`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <ItemIcon size={20} color={meta.color} strokeWidth={1.5} />
                              </div>
                            );
                          })()}

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
    disabled={isOut}
    onClick={() => {
      if (isOut) return;
      setExtraItemCart(prev => ({ ...prev, [item._id]: 1 }));
    }}
    style={{
      padding: '9px 18px', borderRadius: '10px',
      border: `1px solid ${isOut ? '#333' : primaryColor}`,
      background: 'transparent',
      color: isOut ? '#333' : primaryColor,
      fontWeight: '900', fontSize: '0.72rem',
      cursor: isOut ? 'not-allowed' : 'pointer',
      flexShrink: 0, transition: 'all 0.15s',
      opacity: isOut ? 0.4 : 1
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
<X size={30} color={primaryColor} onClick={() => { 
  setIsBillOpen(false); 
  setBillRequested(false); 
  setShowReviewPage(false);
  // ── Reset everything for next customer ──
  setPlacedOrders([]);
  setHasPlacedInitialOrder(false);
  setCart({});
  setSuggestions({});
  setCustomerInfo({ name: '', phone: '' });
  localStorage.removeItem(`pratyeksha_placed_${tenantId}_${tableNumber}`);
  localStorage.removeItem(`pratyeksha_cart_${tenantId}`);
}} />            </div>
            
            <div style={styles.modalScrollBody}>
{!billRequested ? (
  <div style={styles.formContainer}>
    <p style={styles.instructionText}>{t[language].enterDetails}</p>

    {/* Name field */}
    <input
      type="text"
      placeholder={t[language].fullName}
      style={styles.input}
      value={customerInfo.name}
      onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
    />

    {/* Phone — 10-digit enforced */}
    <div style={{ position: 'relative', marginBottom: '15px' }}>
      <span style={{
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
        fontSize: '0.9rem', color: 'rgba(211,191,162,0.5)', fontWeight: '700', pointerEvents: 'none'
      }}>+91</span>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit mobile number"
        style={{
          ...styles.input,
          marginBottom: 0,
          paddingLeft: '52px',
          letterSpacing: '1.5px',
          width: '100%', boxSizing: 'border-box'
        }}
        value={customerInfo.phone}
        onInput={e => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
          setCustomerInfo(prev => ({ ...prev, phone: digits }));
        }}
      />
    </div>

    {/* Inline hint */}
    {customerInfo.phone.length > 0 && customerInfo.phone.length !== 10 && (
      <div style={{ fontSize: '0.62rem', color: '#BA7517', marginBottom: '10px', fontWeight: '700', textAlign: 'center' }}>
        {10 - customerInfo.phone.length} more digits needed
      </div>
    )}

    <button
      disabled={!customerInfo.name.trim() || customerInfo.phone.length !== 10}
      style={{
        ...styles.kitchenBtn,
        background: (customerInfo.name.trim() && customerInfo.phone.length === 10)
          ? primaryColor : 'rgba(211,191,162,0.1)',
        color: (customerInfo.name.trim() && customerInfo.phone.length === 10)
          ? '#1a1a1a' : 'rgba(211,191,162,0.2)',
        cursor: (customerInfo.name.trim() && customerInfo.phone.length === 10)
          ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s'
      }}
      onClick={requestFinalBill}
    >
      {t[language].generateBill}
    </button>
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
    <div key={idx} style={{ ...styles.billTableRow, flexDirection: 'column', alignItems: 'flex-start', gap: '3px', paddingBottom: '10px', borderBottom: '1px solid rgba(211,191,162,0.07)', marginBottom: '4px' }}>
      {/* Row 1: Dish name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
          {language === 'mr' ? (order.name_mr || order.name) : order.name}
          {order.portion && order.portion !== 'Single' && (
            <span style={{ fontSize: '0.62rem', color: primaryColor, marginLeft: '6px', fontWeight: '700' }}>({order.portion})</span>
          )}
          {order.isExtraItem && (
            <span style={{ fontSize: '0.48rem', padding: '2px 5px', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.15)', borderRadius: '4px', color: '#8a704d', fontWeight: '900', letterSpacing: '0.5px', marginLeft: '6px' }}>EXTRA</span>
          )}
        </span>
      </div>
      {/* Row 2: Rate × qty → total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '0.68rem', color: 'rgba(211,191,162,0.45)', fontWeight: '600' }}>
          ₹{convertToMrNumber(order.pricePerUnit)} × {order.quantity}
        </span>
        <span style={{ fontSize: '0.9rem', fontWeight: '900', color: primaryColor }}>
          ₹{convertToMrNumber(order.subtotal)}
        </span>
      </div>
    </div>
  ))}
</div>


{/* Replace existing billTableFooter with this: */}
<div style={styles.billTableFooter}>
  {(() => {
    const rd = restaurantData;
    const cgstPct = rd?.config?.cgstPercentage ?? 2.5;
    const sgstPct = rd?.config?.sgstPercentage ?? 2.5;
    const subtotal = finalBillItems.reduce((s, i) => s + (i.subtotal || 0), 0);
    const cgstAmt = subtotal * (cgstPct / 100);
    const sgstAmt = subtotal * (sgstPct / 100);
    const grandTotal = subtotal + cgstAmt + sgstAmt;
    return (
      <>
<div style={{ ...styles.billLine, fontSize: '0.78rem', color: '#666' }}>
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ ...styles.billLine, fontSize: '0.78rem', color: '#888' }}>
          <span>CGST @ {cgstPct}%</span>
          <span>₹{cgstAmt.toFixed(2)}</span>
        </div>
        <div style={{ ...styles.billLine, fontSize: '0.78rem', color: '#888', marginBottom: '12px' }}>
          <span>SGST @ {sgstPct}%</span>
          <span>₹{sgstAmt.toFixed(2)}</span>
        </div>
<div style={styles.billLineTotal}>
          <span>{t[language].grandTotal}</span>
          <span style={{ color: primaryColor, fontSize: '1.2rem' }}>
            ₹{Math.round(grandTotal)}
          </span>
        </div>
      </>
    );
  })()}
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
          <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '2px' }}>SAC Code: 996331 · GST Rate: 5% (CGST 2.5% + SGST 2.5%)</p>        </div>

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
        @ ₹{convertToMrNumber(order.pricePerUnit)} / item
        {order.portion !== 'Single' ? ` (${order.portion})` : ''}
        {order.isExtraItem ? ' · Extra Item' : ''}
      </span>
    </div>
    <b style={{ fontSize: '0.9rem', fontWeight: '900' }}>₹{convertToMrNumber(order.subtotal)}</b>
  </div>
))}
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

                     {/* WHITE — Download Invoice */}
                     <button
                       onClick={() => autoDownloadInvoicePDF()}
                       style={{
                         width: '100%', padding: '18px', borderRadius: '15px',
                         background: '#ffffff',
                         color: '#0c0c0c', fontWeight: '900', border: '1px solid #e0e0e0',
                         cursor: 'pointer', fontSize: '0.88rem',
                         letterSpacing: '0.5px', textTransform: 'uppercase',
                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                         boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
                       }}
                     >
                       <ReceiptText size={18} color="#0c0c0c" strokeWidth={2.5} />
                       DOWNLOAD TAX INVOICE
                     </button>

                     {/* GOLD — Continue to Feedback */}
                     <button
                       style={{
                         ...styles.professionalContinueBtn,
                         background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
                         boxShadow: '0 8px 24px rgba(211,191,162,0.2)'
                       }}
                       onClick={() => setShowReviewPage(true)}
                     >
                       {t[language].continue} <ChevronRight size={18} />
                     </button>

                   </div>
                </div>
) : (
  <div style={{
    padding: '0 0 60px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100%'
  }}>

    {/* ── HERO SECTION ── */}
    <div style={{
      width: '100%', padding: '52px 28px 40px',
      background: 'linear-gradient(180deg, rgba(211,191,162,0.07) 0%, transparent 100%)',
      borderBottom: '1px solid rgba(211,191,162,0.08)',
      textAlign: 'center'
    }}>
      {/* Animated sparkle icon */}
      <motion.div
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        style={{
          width: '72px', height: '72px', borderRadius: '22px',
          background: 'rgba(211,191,162,0.07)',
          border: '1px solid rgba(211,191,162,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 22px',
          boxShadow: '0 0 0 8px rgba(211,191,162,0.04), 0 0 0 16px rgba(211,191,162,0.02)'
        }}
      >
        <Sparkles size={32} color="#d3bfa2" strokeWidth={1.5} />
      </motion.div>

      <div style={{ fontSize: '0.5rem', fontWeight: '900', letterSpacing: '3px', color: 'rgba(211,191,162,0.35)', textTransform: 'uppercase', marginBottom: '10px' }}>
        {restaurantData?.name}
      </div>
      <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', margin: '0 0 10px', letterSpacing: '-0.6px', lineHeight: 1.15 }}>
        {t[language].visitAgain}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', lineHeight: 1.8, maxWidth: '280px', margin: '0 auto', fontWeight: '500' }}>
        {language === 'mr'
          ? 'तुमच्या भेटीबद्दल आभार! पुन्हा भेटू लवकरच.'
          : 'Thank you for dining with us. We hope to see you again soon!'}
      </p>
    </div>

    {/* ── ACTION CARDS ── */}
    <div style={{ width: '100%', maxWidth: '400px', padding: '28px 22px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Google Review */}
      {restaurantData?.googleReview && (
        <a href={restaurantData.googleReview} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '18px 20px',
            background: '#fff',
            borderRadius: '18px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)'; }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px',
              background: '#f8f9fa', border: '1px solid #eee',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111', marginBottom: '2px' }}>{t[language].rateGoogle}</div>
              <div style={{ fontSize: '0.62rem', color: '#888', fontWeight: '600' }}>
                {language === 'mr' ? 'तुमचा अनुभव शेअर करा' : 'Share your experience'}
              </div>
            </div>
            <ChevronRight size={18} color="#ccc" />
          </div>
        </a>
      )}

      {/* Instagram */}

          {(restaurantData?.instagram || restaurantData?.instaId) && (
            <a href={restaurantData.instagram || restaurantData.instaId} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>                   <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
            borderRadius: '18px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(131,58,180,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(131,58,180,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(131,58,180,0.3)'; }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              {/* Instagram icon SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                {language === 'mr' ? 'इन्स्टाग्रामवर फॉलो करा' : 'Follow us on Instagram'}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                {language === 'mr' ? 'नवीन पदार्थ व ऑफर्स मिळवा' : 'Stay updated with our latest dishes'}
              </div>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
          </div>
        </a>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(211,191,162,0.08)', margin: '4px 0' }} />
{/* Close billing */}
      <button
        style={{
          width: '100%', padding: '17px',
          background: 'rgba(211,191,162,0.07)',
          border: '1px solid rgba(211,191,162,0.18)',
          color: '#d3bfa2', borderRadius: '14px',
          fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer',
          letterSpacing: '0.5px', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(211,191,162,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(211,191,162,0.07)'; }}
        onClick={() => { setIsBillOpen(false); }}
      >
        <X size={15} strokeWidth={2.5} />
        {language === 'mr' ? 'बंद करा' : 'Close'}
      </button>

      {/* Powered by */}
      <div style={{ textAlign: 'center', paddingTop: '8px' }}>
        <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.1)', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
          POWERED BY PRATYEKSHA
        </span>
      </div>
    </div>
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
            if (!item) return null;

            return (
              <div key={key} style={{...styles.drawerItemBlock, borderBottom: `1px solid ${borderColor}`}}>

                {/* ── NAME + PORTION + REMOVE ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: '600', color: '#fff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {language === 'mr' ? item?.name_mr : item?.name}
                    </p>
                    {portion && (
                      <small style={{ color: primaryColor, fontSize: '0.62rem', fontWeight: '700' }}>
                        {t[language][portion.toLowerCase()] || portion}
                      </small>
                    )}
                  </div>

                  {/* Remove button — X icon, gold dim */}
                  <button
                    onClick={() => {
                      setCart(prev => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                      setSuggestions(prev => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                    style={{
                      background: 'none', border: 'none',
                      color: 'rgba(211,191,162,0.25)',
                      cursor: 'pointer', padding: '4px',
                      display: 'flex', alignItems: 'center',
                      flexShrink: 0, marginLeft: '10px',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(211,191,162,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(211,191,162,0.25)'}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* ── QTY STEPPER ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '10px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: 'rgba(211,191,162,0.05)',
                    border: '1px solid rgba(211,191,162,0.15)',
                    borderRadius: '10px', overflow: 'hidden'
                  }}>
                    {/* MINUS */}
                    <button
                      onClick={() => {
                        if (qty <= 1) {
                          setCart(prev => { const n = {...prev}; delete n[key]; return n; });
                          setSuggestions(prev => { const n = {...prev}; delete n[key]; return n; });
                        } else {
                          setCart(prev => ({ ...prev, [key]: prev[key] - 1 }));
                        }
                      }}
                      style={{
                        width: '34px', height: '34px',
                        background: 'transparent', border: 'none',
                        color: 'rgba(211,191,162,0.6)',
                        cursor: 'pointer', fontWeight: '900',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#d3bfa2'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(211,191,162,0.6)'}
                    >
                      <Minus size={15} />
                    </button>

                    {/* COUNT */}
                    <div style={{
                      minWidth: '30px', textAlign: 'center',
                      fontSize: '0.9rem', fontWeight: '900',
                      color: '#fff', fontFamily: 'monospace',
                      borderLeft:  '1px solid rgba(211,191,162,0.1)',
                      borderRight: '1px solid rgba(211,191,162,0.1)',
                      lineHeight: '34px', height: '34px',
                      padding: '0 6px'
                    }}>
                      {convertToMrNumber(qty)}
                    </div>

                    {/* PLUS */}
                    <button
                      onClick={() => setCart(prev => ({ ...prev, [key]: prev[key] + 1 }))}
                      style={{
                        width: '34px', height: '34px',
                        background: 'transparent', border: 'none',
                        color: 'rgba(211,191,162,0.6)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#d3bfa2'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(211,191,162,0.6)'}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                {/* ── SPECIAL INSTRUCTIONS ── */}
                <div style={styles.suggestionInputWrapper}>
                  <StickyNote size={14} style={{ color: primaryColor, opacity: 0.7 }} />
                  <input
                    type="text"
                    placeholder={t[language].notes}
                    style={styles.suggestionInput}
                    value={suggestions[key] || ""}
                    onChange={e => setSuggestions(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>

              </div>
            );
          })
        ) : (
          <p style={{ textAlign: 'center', color: '#555', marginTop: '40px' }}>
            {t[language].emptyRound}
          </p>
        )}
      </div>

      <div style={styles.drawerFooter}>
        {totalItemsInCart > 0 && (
          <button
            style={{ ...styles.kitchenBtn, background: primaryColor }}
            onClick={
              isCounterScan
                ? counterMode === 'reservation' ? placeReservation : placeWaitlistOrder
                : sendBatchToKitchen
            }
          >
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
          <button
            style={styles.billLinkBtn}
            onClick={() => { setIsDrawerOpen(false); setIsBillOpen(true); }}
          >
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
        background: 'rgba(0,0,0,0.92)',
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
          width: '100%', maxWidth: '480px',
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

        <button onClick={() => setWelcomeDismissed(true)} style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 2,
          width: '26px', height: '26px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#555', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <X size={13} />
        </button>

        {/* ══════════ TOP STRIP — avatar + greeting + visit badge, horizontal ══════════ */}
        <div style={{
          padding: '18px 50px 16px 18px',
          background: 'linear-gradient(180deg, rgba(211,191,162,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(211,191,162,0.07)',
          display: 'flex', alignItems: 'center', gap: '13px'
        }}>
          {/* Avatar */}
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
            background: 'rgba(211,191,162,0.07)',
            border: '1px solid rgba(211,191,162,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {welcomeCard.isLoyal
              ? <Sparkles size={21} color="#d3bfa2" strokeWidth={1.5} />
              : welcomeCard.visitCount >= 2
              ? <UserCheck size={21} color="#d3bfa2" strokeWidth={1.5} />
              : <Users size={21} color="#d3bfa2" strokeWidth={1.5} />}
          </div>

          {/* Greeting */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.46rem', color: 'rgba(211,191,162,0.35)', fontWeight: '900', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
              {welcomeCard.isLoyal ? 'LOYAL GUEST' : welcomeCard.visitCount >= 2 ? 'WELCOME BACK' : 'WELCOME'}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '-0.3px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {language === 'en'
                ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${welcomeCard.name?.split(' ')[0]}!`
                : `नमस्कार, ${welcomeCard.name?.split(' ')[0]}!`}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.18)', marginTop: '2px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={9} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
              {restaurantData?.name}
            </div>
          </div>

          {/* Visit count badge */}
          {welcomeCard.visitCount > 1 && (
            <div style={{
              flexShrink: 0, textAlign: 'center',
              background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.18)',
              borderRadius: '11px', padding: '8px 12px'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', lineHeight: 1 }}>
                {welcomeCard.visitCount}×
              </div>
              <div style={{ fontSize: '0.42rem', color: 'rgba(211,191,162,0.3)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '3px' }}>
                {language === 'mr' ? 'भेटी' : 'Visits'}
              </div>
            </div>
          )}
        </div>

        {/* ══════════ BODY ══════════ */}
        <div style={{ padding: '14px 16px 16px' }}>

          {/* ── HORIZONTAL HIGHLIGHT ROW: Top Dish + Last Visit side by side ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '8px', marginBottom: '10px' }}>

            {/* Top Dish — wide cell */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '11px',
              padding: '11px 13px',
              background: 'rgba(211,191,162,0.04)',
              border: '1px solid rgba(211,191,162,0.11)',
              borderRadius: '13px', position: 'relative', overflow: 'hidden', minWidth: 0
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '50px', height: '50px', background: 'radial-gradient(circle, rgba(211,191,162,0.06) 0%, transparent 70%)', borderRadius: '0 13px 0 50px' }} />
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Flame size={15} color="#d3bfa2" strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.44rem', color: 'rgba(211,191,162,0.3)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {language === 'mr' ? 'सर्वात आवडते' : 'Top Dish'}
                </div>
                {welcomeCard.allDishes?.[0] ? (
                  <>
                    <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#d3bfa2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {welcomeCard.allDishes[0].name}
                    </div>
                    <div style={{ fontSize: '0.54rem', color: 'rgba(211,191,162,0.28)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Hash size={8} color="rgba(211,191,162,0.28)" strokeWidth={1.5} />
                      {language === 'mr' ? `${welcomeCard.allDishes[0].count} वेळा` : `Ordered ${welcomeCard.allDishes[0].count}×`}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)' }}>—</div>
                )}
              </div>
            </div>

            {/* Last Visit — narrow cell */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '11px 12px',
              background: '#111', border: '1px solid rgba(211,191,162,0.07)',
              borderRadius: '13px', minWidth: 0
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Timer size={15} color="rgba(211,191,162,0.5)" strokeWidth={1.5} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.2)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {language === 'mr' ? 'शेवटची भेट' : 'Last Visit'}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                  {welcomeCard.lastVisit
                    ? new Date(welcomeCard.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* ── HORIZONTAL SPLIT: Most Ordered (left) + Last Order (right) ── */}
          {(welcomeCard.allDishes?.length > 1 || welcomeCard.lastOrderItems?.length > 0) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: (welcomeCard.allDishes?.length > 1 && welcomeCard.lastOrderItems?.length > 0) ? '1fr 1fr' : '1fr',
              gap: '8px', marginBottom: '10px'
            }}>

              {/* Most Ordered ranked list */}
              {welcomeCard.allDishes?.length > 1 && (
                <div style={{
                  padding: '11px 12px',
                  background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.07)',
                  borderRadius: '13px', minWidth: 0
                }}>
                  <div style={{ fontSize: '0.44rem', color: 'rgba(211,191,162,0.22)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '9px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Flame size={9} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
                    {language === 'mr' ? 'जास्त ऑर्डर' : 'Most Ordered'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {welcomeCard.allDishes.slice(0, 3).map((dish, i) => {
                      const maxCount = welcomeCard.allDishes[0]?.count || 1;
                      const pct = Math.round((dish.count / maxCount) * 100);
                      const rankColors = ['#d3bfa2', '#a89070', '#8a7060'];
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{
                            width: '15px', height: '15px', borderRadius: '4px', flexShrink: 0,
                            background: i === 0 ? 'rgba(211,191,162,0.1)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${i === 0 ? 'rgba(211,191,162,0.25)' : 'rgba(255,255,255,0.05)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.46rem', fontWeight: '900', fontFamily: 'monospace',
                            color: rankColors[i] || '#555'
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{
                                fontSize: '0.64rem', fontWeight: i === 0 ? '800' : '500',
                                color: i === 0 ? '#d3bfa2' : 'rgba(255,255,255,0.35)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px'
                              }}>
                                {dish.name}
                              </span>
                              <span style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.28)', fontFamily: 'monospace', flexShrink: 0, marginLeft: '4px' }}>
                                {dish.count}×
                              </span>
                            </div>
                            <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: i * 0.1 + 0.3, duration: 0.7, ease: 'easeOut' }}
                                style={{
                                  height: '100%',
                                  background: i === 0 ? 'linear-gradient(90deg,#c9a84c,#d3bfa2)' : `rgba(211,191,162,${0.15 + (0.1 * (3 - i))})`,
                                  borderRadius: '1px'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Last Order list */}
              {welcomeCard.lastOrderItems?.length > 0 && (
                <div style={{
                  padding: '11px 12px',
                  background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.07)',
                  borderRadius: '13px', minWidth: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '9px' }}>
                    <div style={{ fontSize: '0.44rem', color: 'rgba(211,191,162,0.22)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ReceiptText size={9} color="rgba(211,191,162,0.3)" strokeWidth={1.5} />
                      {language === 'mr' ? 'शेवटची ऑर्डर' : 'Last Order'}
                    </div>
                    {welcomeCard.lastOrderDate && (
                      <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.14)', fontWeight: '600' }}>
                        {new Date(welcomeCard.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {welcomeCard.lastOrderItems.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.56rem', fontWeight: '900', color: 'rgba(211,191,162,0.22)', fontFamily: 'monospace', minWidth: '16px', flexShrink: 0 }}>
                          ×{item.quantity}
                        </span>
                        <span style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.32)', fontWeight: '500', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        {item.subtotal > 0 && (
                          <span style={{ fontSize: '0.58rem', color: 'rgba(211,191,162,0.28)', fontFamily: 'monospace', flexShrink: 0 }}>
                            ₹{item.subtotal}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LOYALTY BADGE — compact horizontal ── */}
          {welcomeCard.isLoyal && (
            <div style={{
              padding: '9px 13px', marginBottom: '10px',
              background: 'rgba(211,191,162,0.04)',
              border: '1px solid rgba(211,191,162,0.12)',
              borderRadius: '11px',
              display: 'flex', alignItems: 'center', gap: '9px'
            }}>
              <Sparkles size={15} color="#d3bfa2" strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#d3bfa2' }}>
                  {language === 'mr' ? "तुम्ही लॉयल गेस्ट आहात!" : "You're a Loyal Guest"}
                </span>
                <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.18)' }}>
                  {language === 'mr'
                    ? `· ${welcomeCard.visitCount} भेटींसाठी आभार`
                    : `· thanks for ${welcomeCard.visitCount} visits`}
                </span>
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <button
            onClick={() => { localStorage.setItem(`pratyeksha_phone_${tenantId}`, welcomePhone); setWelcomeDismissed(true); }}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
              border: 'none', borderRadius: '13px',
              color: '#0c0c0c', fontWeight: '900', fontSize: '0.84rem',
              cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
              boxShadow: '0 8px 24px rgba(211,191,162,0.18)'
            }}
          >
            <Utensils size={14} strokeWidth={2.5} />
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

 
<AnimatePresence>
  {orderPlacedScreen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        background: '#080808',
        fontFamily: 'Poppins, sans-serif',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        overflowY: 'auto'
      }}
    >
      {/* ── ANIMATED BACKGROUND ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {/* Radial glow center */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1.2, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, rgba(211,191,162,0.03) 40%, transparent 70%)',
          }}
        />
        {/* Rotating ring 1 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '340px', height: '340px', borderRadius: '50%',
            border: '1px solid rgba(201,168,76,0.06)',
          }}
        />
        {/* Rotating ring 2 — opposite */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 26, ease: 'linear' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '480px', height: '480px', borderRadius: '50%',
            border: '1px dashed rgba(201,168,76,0.04)',
          }}
        />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: [0, 0.5, 0], y: [80, -40, -120] }}
            transition={{ delay: i * 0.3 + 0.4, duration: 3.5, repeat: Infinity, repeatDelay: i * 0.4 }}
            style={{
              position: 'absolute',
              left: `${12 + i * 11}%`,
              bottom: '20%',
              width: i % 3 === 0 ? '4px' : '3px',
              height: i % 3 === 0 ? '4px' : '3px',
              borderRadius: '50%',
              background: i % 2 === 0 ? 'rgba(201,168,76,0.6)' : 'rgba(211,191,162,0.4)',
            }}
          />
        ))}
      </div>
 
      {/* ── CONTENT ── */}
      <div style={{ width: '100%', maxWidth: '420px', padding: '60px 24px 40px', position: 'relative', zIndex: 1 }}>
 
        {/* ── 3D KITCHEN ANIMATION ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
 
          {/* SVG Kitchen Scene */}
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 20px' }}>
 
            {/* Outer glow ring */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: '-10px', borderRadius: '50%',
                border: '1px solid rgba(201,168,76,0.25)',
                background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
              }}
            />
 
            {/* Main circle bg */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'linear-gradient(145deg, #141414, #0c0c0c)',
              border: '1px solid rgba(201,168,76,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Gold shimmer top */}
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)' }} />
 
              {/* Animated SVG — cooking pot with steam */}
              <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
 
                {/* Steam lines — animated */}
                <motion.line x1="38" y1="28" x2="38" y2="12"
                  stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6"
                  animate={{ y1: [28, 22, 28], y2: [12, 6, 12], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
                <motion.line x1="55" y1="22" x2="55" y2="6"
                  stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8"
                  animate={{ y1: [22, 15, 22], y2: [6, -1, 6], opacity: [0.8, 0.1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.3, delay: 0.4, ease: 'easeInOut' }}
                />
                <motion.line x1="72" y1="28" x2="72" y2="12"
                  stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6"
                  animate={{ y1: [28, 22, 28], y2: [12, 6, 12], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: 0.8, ease: 'easeInOut' }}
                />
 
                {/* Pot lid */}
                <motion.ellipse cx="55" cy="38" rx="28" ry="8"
                  fill="#1a1a1a" stroke="#c9a84c" strokeWidth="1.2"
                  animate={{ cy: [38, 36, 38] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                />
                {/* Lid handle */}
                <motion.rect x="49" y="31" width="12" height="6" rx="3"
                  fill="#1a1a1a" stroke="#c9a84c" strokeWidth="1"
                  animate={{ y: [31, 29, 31] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                />
 
                {/* Pot body */}
                <rect x="24" y="44" width="62" height="38" rx="8"
                  fill="#141414" stroke="rgba(201,168,76,0.5)" strokeWidth="1.2"
                />
 
                {/* Pot liquid — bubbling fill */}
                <motion.rect x="26" y="52" width="58" height="28" rx="5"
                  fill="rgba(201,168,76,0.08)"
                  animate={{ height: [28, 30, 28], y: [52, 50, 52] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                />
 
                {/* Bubble dots inside pot */}
                {[[40,64],[55,60],[68,66],[48,70]].map(([cx,cy],i) => (
                  <motion.circle key={i} cx={cx} cy={cy} r="2"
                    fill="rgba(201,168,76,0.4)"
                    animate={{ cy: [cy, cy - 6, cy], opacity: [0.4, 0.1, 0.4], r: [2, 1, 2] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.35, ease: 'easeInOut' }}
                  />
                ))}
 
                {/* Pot handles */}
                <path d="M24 52 Q14 52 14 60 Q14 68 24 68" stroke="rgba(201,168,76,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M86 52 Q96 52 96 60 Q96 68 86 68" stroke="rgba(201,168,76,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
 
                {/* Stove grate */}
                <rect x="18" y="82" width="74" height="6" rx="3"
                  fill="#111" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                />
                {/* Grate lines */}
                {[30,42,55,68,80].map((x,i) => (
                  <line key={i} x1={x} y1="82" x2={x} y2="88"
                    stroke="rgba(255,255,255,0.08)" strokeWidth="1"
                  />
                ))}
                {/* Flame glow under pot */}
                <motion.ellipse cx="55" cy="85" rx="20" ry="4"
                  fill="rgba(201,168,76,0.08)"
                  animate={{ rx: [20, 24, 20], opacity: [0.08, 0.18, 0.08] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                />
 
              </svg>
            </div>
 
            {/* Status dot pulse top-right */}
            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 8px rgba(201,168,76,0.6)' }}
              />
            </div>
          </div>
 
          {/* ── HEADLINE ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div style={{ fontSize: '0.52rem', color: 'rgba(201,168,76,0.45)', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px' }}>
              {language === 'mr' ? 'ऑर्डर पाठवली गेली!' : 'Order Confirmed!'}
            </div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.15, marginBottom: '8px' }}>
              {language === 'mr' ? 'किचनमध्ये जात आहे' : 'Heading to the Kitchen'}
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.7, fontWeight: '500', maxWidth: '280px', margin: '0 auto' }}>
              {language === 'mr'
                ? 'तुमची ऑर्डर आमच्या शेफकडे गेली आहे. थोड्याच वेळात तयार होईल!'
                : "Your order is with our chef. We'll keep you updated every step of the way."}
            </p>
          </motion.div>
        </div>
 
        {/* ── LIVE PIPELINE — 3 steps ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: '#0f0f0f',
            border: '1px solid rgba(211,191,162,0.1)',
            borderRadius: '20px', overflow: 'hidden',
            marginBottom: '16px', position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)' }} />
 
          {/* Steps row */}
          <div style={{ padding: '22px 20px 16px', position: 'relative' }}>
 
            {/* Connecting track */}
            <div style={{ position: 'absolute', top: '40px', left: '15%', right: '15%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            {/* Animated fill */}
            <motion.div
              initial={{ width: '5%' }}
              animate={{ width: '25%' }}
              transition={{ delay: 0.8, duration: 1.4, ease: 'easeOut' }}
              style={{ position: 'absolute', top: '40px', left: '15%', height: '1px', background: 'linear-gradient(90deg,#c9a84c,rgba(201,168,76,0.3))' }}
            />
 
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              {[
                { icon: <CheckCircle2 size={18} color="#c9a84c" strokeWidth={2} />, label: language === 'mr' ? 'ऑर्डर\nमिळाली' : 'Order\nReceived', done: true },
                { icon: <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}><Flame size={18} color="rgba(201,168,76,0.5)" strokeWidth={1.5} /></motion.div>, label: language === 'mr' ? 'किचनमध्ये\nबनत आहे' : 'In the\nKitchen', active: true },
                { icon: <Utensils size={18} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />, label: language === 'mr' ? 'सर्व्ह\nकरणार' : 'Ready to\nServe', done: false },
              ].map((step, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '11px',
                    background: step.done ? 'rgba(201,168,76,0.12)' : step.active ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${step.done ? 'rgba(201,168,76,0.35)' : step.active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {step.icon}
                  </div>
                  <div style={{
                    fontSize: '0.54rem', fontWeight: '700', textAlign: 'center', lineHeight: 1.4,
                    color: step.done ? '#d3bfa2' : step.active ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.15)',
                    whiteSpace: 'pre-line'
                  }}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          {/* Est time strip */}
          <div style={{
            padding: '12px 20px',
            background: 'rgba(201,168,76,0.04)',
            borderTop: '1px solid rgba(201,168,76,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={13} color="rgba(201,168,76,0.45)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>
                {language === 'mr' ? 'अंदाजे तयारीची वेळ' : 'Estimated prep time'}
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace' }}>
              15–25 min
            </span>
          </div>
        </motion.div>
 
        {/* ── TABLE + ORDER COUNT ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}
        >
          {[
            { icon: <MapPin size={14} color="rgba(201,168,76,0.5)" strokeWidth={1.5} />, label: language === 'mr' ? 'टेबल' : 'Your Table', val: tableNumber },
            { icon: <ReceiptText size={14} color="rgba(201,168,76,0.5)" strokeWidth={1.5} />, label: language === 'mr' ? 'ऑर्डर' : 'Round', val: `#${Object.keys(liveOrderStatuses).length}` },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#0c0c0c', border: '1px solid rgba(211,191,162,0.07)',
              borderRadius: '13px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              {s.icon}
              <div>
                <div style={{ fontSize: '0.48rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace' }}>
                  {s.val}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
 
        {/* ── DISMISS BUTTON ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <button
            onClick={() => setOrderPlacedScreen(false)}
            style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg,#d3bfa2,#bda88a)',
              border: 'none', borderRadius: '13px',
              color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
              cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
              boxShadow: '0 8px 28px rgba(211,191,162,0.15)', marginBottom: '12px'
            }}
          >
            <Utensils size={15} strokeWidth={2.5} />
            {language === 'mr' ? 'मेनूकडे परत जा' : 'Back to Menu'}
          </button>
 
          {/* Auto-dismiss countdown */}
          <div style={{ textAlign: 'center', fontSize: '0.58rem', color: 'rgba(255,255,255,0.12)', fontWeight: '600' }}>
            {language === 'mr' ? 'काही सेकंदात आपोआप बंद होईल' : 'Auto-closing in a few seconds'}
          </div>
        </motion.div>
      </div>
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

header: { padding: '50px 20px 10px', textAlign: 'center', position: 'relative' },
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