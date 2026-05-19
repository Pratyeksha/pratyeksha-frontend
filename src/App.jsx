import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import { 
  CheckCircle2, AlertCircle, Utensils, Info, X, Sparkles, 
  MessageSquare, StickyNote, Flame, Globe2, Timer, Search, BellRing, 
  Droplets, Trash2, HelpCircle, Minus, Plus, ReceiptText, ChevronRight, UtensilsCrossed, Layers
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
  
  const [language, setLanguage] = useState('en'); 
  const [tenantId, setTenantId] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const [activeModel, setActiveModel] = useState(null);
  const [cart, setCart] = useState({}); 
  const [suggestions, setSuggestions] = useState({}); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [waiterCounts, setWaiterCounts] = useState({ spoon: 0, fork: 0, plates: 0, water: 0 });
  
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [hasPlacedInitialOrder, setHasPlacedInitialOrder] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [placedOrders, setPlacedOrders] = useState([]); // To store actual items for bill calculation

  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' });

  const navRef = useRef(null);
  const activeTabRef = useRef(null);

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

  const convertToMrNumber = (number) => {
    if (language === 'en') return number;
    const mrDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return number.toString().split('').map(d => isNaN(d) ? d : mrDigits[d]).join('');
  };

  const triggerAlert = (msgKey, type = 'success') => {
    setAlert({ show: true, msg: t[language][msgKey] || msgKey, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const activeTenant = urlTenantId || 'jay_ambe_fusion';
    setTenantId(activeTenant);
    const params = new URLSearchParams(window.location.search);
    setTableNumber(params.get('table') || 'Takeaway');
  }, [urlTenantId]);

// 🚀 UNIFIED ENGINE: HANDLES INITIAL HTTP REST CONTENT LOADS & LIVE REAL-TIME SOCKET BROADCASTS
  useEffect(() => {
    if (!tenantId) return;

    // 1. PHASE A: EXECUTE INITIAL REST DATA FETCH ON MOUNT
    const fetchMenuContent = async () => {
      try {
        const [res, cat, menu] = await Promise.all([
          axios.get(`${BASE_URL}/tenant/${tenantId}`),
          axios.get(`${BASE_URL}/categories/${tenantId}`),
          axios.get(`${BASE_URL}/menu/${tenantId}`)
        ]);
        setRestaurantData(res.data);
        setCategoryList(cat.data);
        setAllMenuItems(menu.data);
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
            suggestion: suggestions[key] || "" 
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

      await axios.post(`${BASE_URL}/orders`, payload);
      
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
      const key = `${item.menuItemId}-${item.portion}`;
      if (!map[key]) {
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
      const key = `${item.menuItemId}-${item.portion}`;
      if (!map[key]) {
        map[key] = { ...item };
      } else {
        map[key].quantity += item.quantity;
        map[key].subtotal += item.subtotal;
      }
    });
    return Object.values(map);
  }, [placedOrders]);

  const requestFinalBill = async () => {
    if(!customerInfo.name || !customerInfo.phone) { triggerAlert("detailsReq", "error"); return; }
    try {
        const socket = io("https://pratyeksha-backend.onrender.com");
        socket.emit("request_bill", { tenantId, tableNumber, name: customerInfo.name });
        await axios.post(`${BASE_URL}/customers`, { tenantId, name: customerInfo.name, phone: customerInfo.phone, lastVisit: new Date().toISOString() });
        setBillRequested(true);
    } catch (error) { setBillRequested(true); }
  };

  const filteredMenuItems = allMenuItems.filter(i => {
    const matchesCategory = selectedCategoryId === 'all' || i.categoryId === selectedCategoryId;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.name_mr && i.name_mr.includes(searchQuery));
    return matchesCategory && matchesSearch && i.isAvailable !== false;
  });

  if (isLoading) return <div style={{...styles.loader, color: primaryColor}}>PRATYEKSHA...</div>;

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

      <header style={styles.header}>
        <div style={styles.langToggleBox}>
          <button style={{...styles.langBtn, color: primaryColor, borderColor: borderColor}} onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}>
            <Globe2 size={12} style={{marginRight: '6px'}} /> {language === 'en' ? 'मराठी' : 'English'}
          </button>
        </div>
        <h1 style={{...styles.cafeName, color: primaryColor}}>{restaurantData?.name || 'PRATYEKSHA'}</h1>
        <div style={styles.poweredBy}>{t[language].poweredBy} <span>PRATYEKSHA</span> • {t[language].table} {convertToMrNumber(tableNumber)}</div>
      </header>

      {/* SEARCH BAR */}
      <div style={styles.searchWrapper}>
        <div style={styles.searchContainer}>
          <Search size={18} color={primaryColor} />
          <input type="text" placeholder={t[language].searchPlaceholder} style={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* CATEGORY NAV */}
      <div style={{...styles.navContainer, backgroundColor: secondaryColor}}>
        <nav ref={navRef} style={styles.navScroll} className="no-scrollbar">
          <button ref={selectedCategoryId === 'all' ? activeTabRef : null} onClick={() => setSelectedCategoryId('all')} style={{...styles.navItem, color: selectedCategoryId === 'all' ? primaryColor : '#888'}}>
            {t[language].all} {selectedCategoryId === 'all' && <motion.div layoutId="underline" style={styles.activeUnderline} />}
          </button>
          {categoryList.map(cat => (
            <button key={cat.categoryId} ref={selectedCategoryId === cat.categoryId ? activeTabRef : null} onClick={() => setSelectedCategoryId(cat.categoryId)} style={{...styles.navItem, color: selectedCategoryId === cat.categoryId ? primaryColor : '#888'}}>
              {(language === 'mr' ? cat.name_mr : cat.name).toUpperCase()} {selectedCategoryId === cat.categoryId && <motion.div layoutId="underline" style={styles.activeUnderline} />}
            </button>
          ))}
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
  <p style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* FABs RIGHT SIDE */}
      <div style={styles.rightFabContainer}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{...styles.fabBase, background: primaryColor}} onClick={() => setIsWaiterModalOpen(true)}>
          <BellRing size={26} color={secondaryColor} />
        </motion.div>
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
        <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
           <span style={{fontSize: '0.85rem', fontWeight: '700', color: '#fff'}}>
             {order.quantity}x {language === 'mr' ? order.name_mr : order.name}
           </span>
           <span style={{fontSize: '0.65rem', color: primaryColor}}>{order.portion !== 'Single' ? order.portion : ''}</span>
        </div>
        <span style={{flex: 1, textAlign: 'right', fontSize: '0.85rem'}}>₹{convertToMrNumber(order.subtotal)}</span>
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
            {convertToMrNumber(order.quantity)}x {language === 'mr' ? order.name_mr : order.name}
          </span>
          {/* 🚀 PRICE PER UNIT DISPLAYED LIKE YOUR UPLOADED IMAGE */}
          <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px', fontWeight: '500' }}>
            @ ₹{convertToMrNumber(order.pricePerUnit)} {order.portion !== 'Single' ? `(${order.portion})` : ''}
          </span>
       </div>
       <b style={{ fontSize: '0.9rem', fontWeight: '900' }}>₹{convertToMrNumber(order.subtotal)}</b>
    </div>
  ))}
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
              {totalItemsInCart > 0 && <button style={{...styles.kitchenBtn, background: primaryColor}} onClick={sendBatchToKitchen}>{t[language].orderNow}</button>}
              <button style={styles.billLinkBtn} onClick={() => { setIsDrawerOpen(false); setIsBillOpen(true); }}>{t[language].viewFinalBill}</button>
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

      <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } `}</style>
    </div>
  );
};

const styles = {
  body: { minHeight: '100vh', fontFamily: 'Poppins, sans-serif', color: '#fff', overflowX: 'hidden' },
  header: { padding: '50px 20px 10px', textAlign: 'center' },
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
  contentWrapper: { touchAction: 'pan-y' }, 
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