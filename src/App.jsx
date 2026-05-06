import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import { 
  CheckCircle2, AlertCircle, Utensils, Info, X, Sparkles, 
  MessageSquare, StickyNote, Flame, Globe2, Timer
} from 'lucide-react'; 

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

const PratyekshaPremiumMenu = () => {
  const { tenantId: urlTenantId } = useParams();
  const [restaurantData, setRestaurantData] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // 🌍 Global Language State
  const [language, setLanguage] = useState('en'); // Default 'en', Switch to 'mr'

  const [tenantId, setTenantId] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const [activeModel, setActiveModel] = useState(null);
  const [cart, setCart] = useState({}); 
  const [suggestions, setSuggestions] = useState({}); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [hasPlacedInitialOrder, setHasPlacedInitialOrder] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  // 📊 Feedback Poll States
  const [showPoll, setShowPoll] = useState(false);
  const [pollSubmitted, setPollSubmitted] = useState(false);

  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' });

  const navRef = useRef(null);
  const activeTabRef = useRef(null);

  // 📝 Translation Dictionary for UI Elements
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
      rateGoogle: "RATE US ON GOOGLE",
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
      itemsInCart: "items in your order",
      pollQuest: "Help our Chef! Which cuisine do you want us to add next?",
      pollThanks: "Feedback received! We value your choice.",
      feedbackTitle: "Wait-Time Survey"
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
      itemsInCart: "तुमच्या ऑर्डरमध्ये पदार्थ",
      pollQuest: "आमच्या शेफला मदत करा! आम्ही पुढे कोणते पदार्थ जोडावेत?",
      pollThanks: "तुमच्या पसंतीबद्दल धन्यवाद!",
      feedbackTitle: "अभिप्राय"
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

  // 📊 Wait-Time Feedback Loop Logic
  useEffect(() => {
    if (hasPlacedInitialOrder && !billRequested && !pollSubmitted) {
      const timer = setTimeout(() => setShowPoll(true), 25000);
      return () => clearTimeout(timer);
    }
  }, [hasPlacedInitialOrder, billRequested, pollSubmitted]);

  const handlePollSubmit = (choice) => {
    setPollSubmitted(true);
    setShowPoll(false);
    triggerAlert("pollThanks");
  };

  useEffect(() => {
    const activeTenant = urlTenantId || 'jay_ambe_fusion';
    setTenantId(activeTenant);
    const params = new URLSearchParams(window.location.search);
    setTableNumber(params.get('table') || 'Takeaway');
  }, [urlTenantId]);

  useEffect(() => {
    const socket = io("https://pratyeksha-backend.onrender.com");
    socket.on("menu_updated", (updatedItem) => {
      setAllMenuItems((prevItems) => prevItems.map((item) => item._id === updatedItem._id ? updatedItem : item));
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (activeTabRef.current && navRef.current) {
      const nav = navRef.current;
      const tab = activeTabRef.current;
      const scrollLeft = tab.offsetLeft - (nav.offsetWidth / 2) + (tab.offsetWidth / 2);
      nav.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!tenantId) return;
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
      } catch (error) { console.error("Fetch Error:", error); } 
      finally { setIsLoading(false); }
    };
    fetchMenuContent();
  }, [tenantId]);

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
      const orderItems = Object.entries(cart).map(([key, qty]) => {
        const isMulti = key.includes('-');
        const id = isMulti ? key.split('-')[0] : key;
        const portion = isMulti ? key.split('-')[1] : 'Single';
        const item = allMenuItems.find(i => i._id === id);
        const price = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
        const itemName = language === 'mr' ? item.name_mr : item.name;
        return { 
          menuItemId: item._id, 
          name: itemName, 
          quantity: qty, 
          portion: portion, 
          pricePerUnit: price, 
          subtotal: (price || 0) * qty,
          suggestion: suggestions[key] || "" 
        };
      });

      const total = getCartTotal();
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
      triggerAlert("orderSuccess");
      setHasPlacedInitialOrder(true);
      setCart({}); 
      setSuggestions({}); 
      setIsDrawerOpen(false);
    } catch (error) { triggerAlert("orderError", "error"); }
  };

  const requestFinalBill = async () => {
    if(!customerInfo.name || !customerInfo.phone) { triggerAlert("detailsReq", "error"); return; }
    try {
        const socket = io("https://pratyeksha-backend.onrender.com");
        socket.emit("request_bill", { tenantId, tableNumber, name: customerInfo.name });
        await axios.post(`${BASE_URL}/customers`, { tenantId, name: customerInfo.name, phone: customerInfo.phone, lastVisit: new Date().toISOString() });
        setBillRequested(true);
    } catch (error) { setBillRequested(true); }
  };

  if (isLoading) return <div style={{...styles.loader, color: primaryColor}}>PRATYEKSHA...</div>;

  return (
    <div style={{...styles.body, backgroundColor: secondaryColor}}>
      
      {/* GLOBAL ALERTS */}
      <AnimatePresence>
        {alert.show && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 24, opacity: 1 }} exit={{ y: -100, opacity: 0 }} style={{...styles.globalAlert, borderLeft: `5px solid ${alert.type === 'success' ? primaryColor : '#ff4444'}`}}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
               {alert.type === 'success' ? <CheckCircle2 size={20} color={primaryColor} /> : <AlertCircle size={20} color="#ff4444" />}
               <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#fff' }}>{alert.msg}</span>
             </div>
             <X size={16} color="#555" onClick={() => setAlert({ ...alert, show: false })} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📊 WAIT-TIME FEEDBACK POLL */}
      <AnimatePresence>
        {showPoll && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={styles.pollOverlay}>
            <div style={styles.pollCard}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                 <Sparkles color={primaryColor} size={20} />
                 <X size={18} color="#888" onClick={() => setShowPoll(false)} />
              </div>
              <p style={styles.pollQuestion}>{t[language].pollQuest}</p>
              <div style={styles.pollGrid}>
                {['Italian', 'Chinese', 'Healthy', 'South Indian'].map(opt => (
                  <button key={opt} onClick={() => handlePollSubmit(opt)} style={styles.pollBtn}>{opt}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={styles.header}>
        {/* Language Toggler */}
        <div style={styles.langToggleBox}>
          <button 
            style={{...styles.langBtn, color: primaryColor, borderColor: borderColor}} 
            onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
          >
            <Globe2 size={12} style={{marginRight: '6px'}} />
            {language === 'en' ? 'मराठी' : 'English'}
          </button>
        </div>

        <h1 style={{...styles.cafeName, color: primaryColor}}>{restaurantData?.name || 'PRATYEKSHA'}</h1>
        <div style={styles.poweredBy}>
          {t[language].poweredBy} <span>PRATYEKSHA</span> • {t[language].table} {convertToMrNumber(tableNumber)}
        </div>
      </header>

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

      {/* MENU ITEMS GRID */}
      <div style={styles.contentWrapper}>
        <AnimatePresence mode="wait">
          <motion.div key={selectedCategoryId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} style={styles.menuContainer}>
            {allMenuItems.filter(i => (selectedCategoryId === 'all' || i.categoryId === selectedCategoryId) && i.isAvailable !== false).map((item) => (
              <div key={item._id} style={{...styles.menuCard, background: cardBg, borderColor: borderColor, position: 'relative'}}>
                
                <div style={styles.tagContainer}>
                  {/* ✨ CHEF'S SPECIAL TAG INTEGRATION */}
                  {item.isChefSpecial === true && (
                      <div style={styles.chefTag}>
                        <Sparkles size={10} style={{marginRight: '4px'}} /> 
                        {t[language].chefChoice}
                      </div>
                  )}
                  {item.spiceLevel && (
                    <div style={{...styles.spiceTag, color: item.spiceLevel.toLowerCase() === 'high' ? '#ff4444' : primaryColor}}>
                      <Flame size={10} style={{marginRight: '4px'}} />
                      {t[language][`spice${item.spiceLevel.charAt(0).toUpperCase() + item.spiceLevel.slice(1).toLowerCase().substring(0,2)}`] || item.spiceLevel.toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={styles.itemContentLeft}>
                  <p style={{...styles.itemTitle, color: '#fff'}}>{language === 'mr' ? item.name_mr : item.name}</p>
                  <p style={styles.itemDesc}>
                    {language === 'mr' 
                      ? (item.ingredients?.mr ? item.ingredients.mr.join(', ') : "")
                      : (item.ingredients?.en ? item.ingredients.en.join(', ') : item.ingredients?.join(', '))}
                  </p>
                  <div style={styles.priceContainer}>
                    {!item.priceHalf ? (
                      <div style={styles.priceRow}>
                        <div style={{fontSize: '1.1rem', fontWeight: '800', color: primaryColor}}>₹{language === 'mr' ? item.price_mr : (item.priceFull || item.price)}</div>
                        {cart[item._id] ? (
                          <div style={styles.counterRowSmall}>
                            <button onClick={() => removeFromCart(item._id)} style={styles.qtyBtnSmall}>-</button>
                            <span>{convertToMrNumber(cart[item._id])}</span>
                            <button onClick={() => addToCart(item, 'Single')} style={styles.qtyBtnSmall}>+</button>
                          </div>
                        ) : ( <button onClick={() => addToCart(item, 'Single')} style={styles.addBtnSmall}>{t[language].add}</button> )}
                      </div>
                    ) : (
                      <>
                        <div style={styles.priceRow}>
                          <div style={styles.priceLabel}>{t[language].half}: <span style={{color: primaryColor}}>₹{language === 'mr' ? item.priceHalf_mr : convertToMrNumber(item.priceHalf)}</span></div>
                          {cart[`${item._id}-Half`] ? ( <div style={styles.counterRowSmall}><button onClick={() => removeFromCart(`${item._id}-Half`)} style={styles.qtyBtnSmall}>-</button><span>{convertToMrNumber(cart[`${item._id}-Half`])}</span><button onClick={() => addToCart(item, 'Half')} style={styles.qtyBtnSmall}>+</button></div> ) : ( <button onClick={() => addToCart(item, 'Half')} style={styles.addBtnSmall}>{t[language].addHalf}</button> )}
                        </div>
                        <div style={styles.priceRow}>
                          <div style={styles.priceLabel}>{t[language].full}: <span style={{color: primaryColor}}>₹{language === 'mr' ? item.priceFull_mr : convertToMrNumber(item.priceFull || item.price)}</span></div>
                          {cart[`${item._id}-Full`] ? ( <div style={styles.counterRowSmall}><button onClick={() => removeFromCart(`${item._id}-Full`)} style={styles.qtyBtnSmall}>-</button><span>{convertToMrNumber(cart[`${item._id}-Full`])}</span><button onClick={() => addToCart(item, 'Full')} style={styles.qtyBtnSmall}>+</button></div> ) : ( <button onClick={() => addToCart(item, 'Full')} style={styles.addBtnSmall}>{t[language].addFull}</button> )}
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
      </div>

      {/* 3D AR MODAL WITH CHEF OVERLAY INTEGRATION */}
      <AnimatePresence>
        {activeModel && ( 
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalOverlay}>
            <div style={{...styles.modalNav, borderColor: borderColor, background: secondaryColor}}>
              <div style={{textAlign: 'left'}}>
                <h2 style={{...styles.modalTitle, color: primaryColor}}>{language === 'mr' ? activeModel.name_mr : activeModel.name}</h2>
                <small style={{color: '#777'}}>{t[language].zoomRotate}</small>
              </div>
              <span style={{...styles.closeModal, color: primaryColor}} onClick={() => setActiveModel(null)}>&times;</span>
            </div>

            <div style={styles.modelContainer}>
              <div style={styles.dishModelWrapper}>
                <model-viewer src={activeModel.modelUrl} ar ar-modes="webxr scene-viewer quick-look" camera-controls auto-rotate shadow-intensity="1" style={{ width: '100%', height: '100%' }} />
              </div>
              
              {/* RESTOREED CHEF AR OVERLAY */}
              {activeModel.isChefSpecial === true && (
                <div style={styles.chefContainerAR}>
                   <div style={styles.chefFlexWrapper}>
                      <div style={styles.chefModelBox}>
                        <model-viewer src={activeModel.chefurl} autoplay style={{ width: '130px', height: '220px' }} camera-orbit="10deg 80deg 3m" camera-target="0m 0.8m 0m" interaction-prompt="none" shadow-intensity="0" />
                      </div>
                      <div style={styles.chefBubbleRight}>
                          <MessageSquare size={12} style={{position: 'absolute', top: '15px', left: '-8px', color: '#fff'}} />
                          "{activeModel.chefMessage || "My personal favorite! You'll love the flavors."}"
                      </div>
                   </div>
                </div>
              )}

              <div style={styles.fixedArButtonWrapper}>
                 <button onClick={() => document.querySelector('model-viewer')?.activateAR()} style={{...styles.arCustomBtn, background: primaryColor}}>
                    {t[language].viewInSpace}
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB LOGIC */}
      {(totalItemsInCart > 0 || hasPlacedInitialOrder) && (
        <motion.div initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} style={styles.circularFab} onClick={() => setIsDrawerOpen(true)}>
          <div style={styles.circularFabInner}>
            <Utensils size={28} color={secondaryColor} strokeWidth={2.5} />
            {totalItemsInCart > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={styles.fabBadgeCircular}>
                {convertToMrNumber(totalItemsInCart)}
              </motion.span>
            )}
          </div>
        </motion.div>
      )}

      {/* CART DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && ( 
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={{...styles.sideDrawer, background: secondaryColor}}>
            <div style={{...styles.drawerHeader, borderColor: borderColor}}>
              <h2 style={{color: primaryColor, margin: 0}}>{t[language].roundOrder}</h2>
              <span style={{color: primaryColor, fontSize: '2rem', cursor: 'pointer'}} onClick={() => setIsDrawerOpen(false)}>&times;</span>
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

      {/* BILL MODAL */}
      <AnimatePresence>
        {isBillOpen && ( 
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{...styles.sideDrawer, background: secondaryColor, width: '100%'}}>
            <div style={styles.modalNav}>
              <h2 style={{color: primaryColor}}>{t[language].checkout}</h2>
              <span style={{color: primaryColor, fontSize: '2rem', cursor: 'pointer'}} onClick={() => { setIsBillOpen(false); setBillRequested(false); }}>&times;</span>
            </div>
            <div style={styles.formContainer}>
              {!billRequested ? (
                <>
                  <p style={{color: '#888', fontSize: '0.8rem', textAlign:'center'}}>{t[language].enterDetails}</p>
                  <input type="text" placeholder={t[language].fullName} style={styles.input} value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} />
                  <input type="tel" placeholder={t[language].mobileNumber} style={styles.input} value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                  <button style={{...styles.kitchenBtn, background: primaryColor}} onClick={requestFinalBill}>{t[language].generateBill}</button>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.thankYouWrapper}>
                  <div style={styles.successCircle}><CheckCircle2 size={40} color={primaryColor} /></div>
                  <h2 style={styles.thankYouTitle}>{t[language].thankYou}</h2>
                  <p style={styles.visitAgainMsg}>{t[language].receiptSent}</p>
                  <button style={styles.backToMenuBtn} onClick={() => { setBillRequested(false); setIsBillOpen(false); }}>{t[language].backMenu}</button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        model-viewer { --progress-bar-color: #d3bfa2; background-color: transparent; outline: none; }
      `}</style>
    </div>
  );
};

const styles = {
  body: { minHeight: '100vh', fontFamily: 'Poppins, sans-serif', color: '#fff', overflowX: 'hidden' },
  header: { padding: '50px 20px 20px', textAlign: 'center', position: 'relative' },
  langToggleBox: { position: 'absolute', top: '15px', right: '15px' },
  langBtn: { background: 'rgba(211, 191, 162, 0.05)', border: '1px solid', padding: '6px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  cafeName: { fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', fontWeight: '800' },
  poweredBy: { fontSize: '0.6rem', letterSpacing: '3px', marginTop: '5px', opacity: 0.5 },
  navContainer: { position: 'sticky', top: '0', zIndex: 999, borderBottom: '1px solid rgba(211, 191, 162, 0.15)' },
  navScroll: { display: 'flex', overflowX: 'auto', padding: '16px 10px', gap: '20px', whiteSpace: 'nowrap' },
  navItem: { background: 'none', border: 'none', fontWeight: '800', fontSize: '0.72rem', flexShrink: 0, padding: '6px 5px', position: 'relative', outline: 'none' },
  activeUnderline: { position: 'absolute', bottom: '-8px', left: '0', right: '0', height: '3px', background: '#d3bfa2', borderRadius: '10px' },
  contentWrapper: { marginTop: '10px' }, 
  menuContainer: { padding: '20px 15px', maxWidth: '600px', margin: '0 auto', paddingBottom: '120px' },
  menuCard: { borderRadius: '24px', padding: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', border: '1px solid', textAlign: 'left', position: 'relative' },
  itemContentLeft: { flex: 1, paddingRight: '12px' },
  itemTitle: { fontSize: '1.05rem', margin: 0, fontWeight: '700' },
  itemDesc: { fontSize: '0.65rem', color: '#888', margin: '5px 0 10px', lineHeight: '1.4' },
  priceContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
  priceLabel: { fontSize: '0.75rem', fontWeight: '600' },
  counterRowSmall: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '8px', background: 'rgba(211, 191, 162, 0.15)' },
  qtyBtnSmall: { background: 'none', border: 'none', color: '#d3bfa2', fontWeight: 'bold' },
  addBtnSmall: { background: 'none', border: '1px solid', fontSize: '0.6rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', color: '#d3bfa2' },
  view3dBtn: { color: '#1a1a1a', width: '40px', height: '40px', borderRadius: '50%', fontWeight: '900', fontSize: '0.6rem', border: 'none', flexShrink: 0 },
  sideDrawer: { position: 'fixed', top: 0, right: 0, width: '85%', height: '100%', zIndex: 2000, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' },
  drawerHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid' },
  drawerContent: { flex: 1, overflowY: 'auto', padding: '20px' },
  drawerItemBlock: { padding: '15px 0' },
  drawerRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  suggestionInputWrapper: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '10px' },
  suggestionInput: { background: 'none', border: 'none', color: '#fff', fontSize: '0.75rem', width: '100%', outline: 'none' },
  drawerFooter: { padding: '20px', paddingBottom: '40px' },
  kitchenBtn: { width: '100%', padding: '18px', borderRadius: '15px', fontWeight: '900', border: 'none', color: '#1a1a1a' },
  billLinkBtn: { background: 'none', border: 'none', color: '#888', marginTop: '15px', width: '100%', fontSize: '0.8rem', textDecoration: 'underline' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 5000, display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' },
  modalNav: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid' },
  modalTitle: { margin: 0, fontSize: '1rem', fontWeight: '800' },
  closeModal: { fontSize: '2rem', cursor: 'pointer', padding: '0 10px' },
  modelContainer: { flex: 1, background: '#111', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
  dishModelWrapper: { width: '100%', height: '50vh', position: 'relative' },
  fixedArButtonWrapper: { position: 'absolute', bottom: '40px', width: '100%', display: 'flex', justifyContent: 'center' },
  arCustomBtn: { border: 'none', padding: '16px 28px', borderRadius: '50px', fontWeight: '900', fontSize: '0.75rem', color: '#1a1a1a' },
  formContainer: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center' },
  input: { padding: '15px', borderRadius: '10px', border: '1px solid #333', background: '#222', color: '#fff', outline: 'none' },
  loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', fontWeight: 'bold' },
  thankYouWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' },
  thankYouTitle: { fontSize: '1.8rem', color: '#fff', marginBottom: '10px', fontWeight: '800' },
  visitAgainMsg: { fontSize: '0.9rem', color: '#888', marginBottom: '20px' },
  backToMenuBtn: { marginTop: '30px', background: 'transparent', border: 'none', color: '#555', textDecoration: 'underline' },
  globalAlert: { position: 'fixed', top: '24px', left: '16px', right: '16px', background: 'rgba(30, 30, 30, 0.98)', padding: '16px', borderRadius: '16px', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)' },
  circularFab: { position: 'fixed', bottom: '30px', right: '25px', width: '65px', height: '65px', zIndex: 1000, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d3bfa2', borderRadius: '50%' },
  fabBadgeCircular: { position: 'absolute', top: '2px', right: '2px', background: '#fff', color: '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '900' },
  tagContainer: { position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' },
  chefTag: { background: 'linear-gradient(135deg, #d3bfa2, #b09c7a)', color: '#1a1a1a', padding: '3px 8px', borderRadius: '15px', fontSize: '0.55rem', fontWeight: '900', display: 'flex', alignItems: 'center' },
  spiceTag: { background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '15px', fontSize: '0.55rem', fontWeight: '900', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  chefContainerAR: { position: 'absolute', bottom: '110px', left: '0', zIndex: 50, width: '100%', pointerEvents: 'none' },
  chefFlexWrapper: { display: 'flex', alignItems: 'flex-end' },
  chefModelBox: { flexShrink: 0 },
  chefBubbleRight: { background: '#fff', color: '#1a1a1a', padding: '10px 14px', borderRadius: '2px 15px 15px 15px', fontSize: '0.6rem', fontWeight: '700', maxWidth: '130px', marginLeft: '-20px', marginBottom: '70px', pointerEvents: 'auto' },
  successCircle: { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(211, 191, 162, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' },
  pollOverlay: { position: 'fixed', bottom: 100, left: 16, right: 16, zIndex: 1500 },
  pollCard: { background: '#1a1a1a', border: '1px solid #d3bfa2', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  pollQuestion: { fontSize: '0.9rem', fontWeight: '700', color: '#fff', margin: '12px 0' },
  pollGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  pollBtn: { background: 'rgba(211, 191, 162, 0.1)', border: '1px solid rgba(211, 191, 162, 0.2)', padding: '10px', borderRadius: '12px', color: '#d3bfa2', fontSize: '0.75rem', fontWeight: '600' }
};

export default PratyekshaPremiumMenu;