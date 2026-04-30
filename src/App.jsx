import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import { CheckCircle2, AlertCircle, Utensils, Info, X, Sparkles, MessageSquare, StickyNote, Flame } from 'lucide-react'; 

const PratyekshaPremiumMenu = () => {
  const { tenantId: urlTenantId } = useParams();
  const [restaurantData, setRestaurantData] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
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

  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' });

  const navRef = useRef(null);
  const activeTabRef = useRef(null);

  const LAPTOP_IP = "10.222.134.11"; 
  const BASE_URL = `http://${LAPTOP_IP}:5000/api`;

  const triggerAlert = (msg, type = 'success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const activeTenant = urlTenantId || 'jay_ambe_fusion';
    setTenantId(activeTenant);
    const params = new URLSearchParams(window.location.search);
    setTableNumber(params.get('table') || 'Takeaway');
  }, [urlTenantId]);

  useEffect(() => {
    const socket = io(`http://${LAPTOP_IP}:5000`);
    socket.on("menu_updated", (updatedItem) => {
      setAllMenuItems((prevItems) => prevItems.map((item) => item._id === updatedItem._id ? updatedItem : item));
    });
    return () => socket.disconnect();
  }, [LAPTOP_IP]);

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
  }, [tenantId, BASE_URL]);

  const handleSwipe = (direction) => {
    const allCatIds = ['all', ...categoryList.map(c => c.categoryId)];
    const currentIndex = allCatIds.indexOf(selectedCategoryId);
    if (direction === 'left' && currentIndex < allCatIds.length - 1) setSelectedCategoryId(allCatIds[currentIndex + 1]);
    else if (direction === 'right' && currentIndex > 0) setSelectedCategoryId(allCatIds[currentIndex - 1]);
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

  const handleSuggestionChange = (cartKey, value) => {
    setSuggestions(prev => ({ ...prev, [cartKey]: value }));
  };

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

  const totalItemsInCart = Object.values(cart).reduce((a, b) => a + b, 0);

  const sendBatchToKitchen = async () => {
    try {
      const orderItems = Object.entries(cart).map(([key, qty]) => {
        const isMulti = key.includes('-');
        const id = isMulti ? key.split('-')[0] : key;
        const portion = isMulti ? key.split('-')[1] : 'Single';
        const item = allMenuItems.find(i => i._id === id);
        const price = portion === 'Half' ? item.priceHalf : (item.priceFull || item.price);
        
        return { 
          menuItemId: item._id, 
          name: item.name, 
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
      triggerAlert("Order sent to kitchen! 👨‍🍳");
      setHasPlacedInitialOrder(true);
      setCart({}); 
      setSuggestions({}); 
      setIsDrawerOpen(false);
    } catch (error) { 
        triggerAlert("Error sending order.", "error"); 
    }
  };

  const requestFinalBill = async () => {
    if(!customerInfo.name || !customerInfo.phone) { triggerAlert("Details required.", "error"); return; }
    try {
        const socket = io(`http://${LAPTOP_IP}:5000`);
        socket.emit("request_bill", { tenantId, tableNumber, name: customerInfo.name });
        await axios.post(`${BASE_URL}/customers`, { tenantId, name: customerInfo.name, phone: customerInfo.phone, lastVisit: new Date().toISOString() });
        setBillRequested(true);
    } catch (error) { setBillRequested(true); }
  };

  if (isLoading) return <div style={{...styles.loader, color: primaryColor}}>PRATYEKSHA...</div>;

  return (
    <div style={{...styles.body, backgroundColor: secondaryColor}}>
      
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

      <header style={styles.header}>
        <h1 style={{...styles.cafeName, color: primaryColor}}>{restaurantData?.name || 'PRATYEKSHA'}</h1>
        <div style={styles.poweredBy}>Powered by <span>PRATYEKSHA</span> • Table {tableNumber}</div>
      </header>

      <div style={{...styles.navContainer, backgroundColor: secondaryColor}}>
        <nav ref={navRef} style={styles.navScroll} className="no-scrollbar">
          <button ref={selectedCategoryId === 'all' ? activeTabRef : null} onClick={() => setSelectedCategoryId('all')} style={{...styles.navItem, color: selectedCategoryId === 'all' ? primaryColor : '#888'}}>
            ALL {selectedCategoryId === 'all' && <motion.div layoutId="underline" style={styles.activeUnderline} />}
          </button>
          {categoryList.map(cat => (
            <button key={cat.categoryId} ref={selectedCategoryId === cat.categoryId ? activeTabRef : null} onClick={() => setSelectedCategoryId(cat.categoryId)} style={{...styles.navItem, color: selectedCategoryId === cat.categoryId ? primaryColor : '#888'}}>
              {cat.name.toUpperCase()} {selectedCategoryId === cat.categoryId && <motion.div layoutId="underline" style={styles.activeUnderline} />}
            </button>
          ))}
        </nav>
      </div>

      <div style={styles.contentWrapper}>
        <AnimatePresence mode="wait">
          <motion.div key={selectedCategoryId} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15} onDragEnd={(e, { offset }) => { const swipeThreshold = 60; if (offset.x < -swipeThreshold) handleSwipe('left'); else if (offset.x > swipeThreshold) handleSwipe('right'); }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} style={styles.menuContainer} >
            {allMenuItems.filter(i => (selectedCategoryId === 'all' || i.categoryId === selectedCategoryId) && i.isAvailable !== false).map((item) => (
              <div key={item._id} style={{...styles.menuCard, background: cardBg, borderColor: borderColor, position: 'relative'}}>
                
                <div style={styles.tagContainer}>
                  {item.isChefSpecial && (
                      <div style={styles.chefTag}>
                        <Sparkles size={10} style={{marginRight: '4px'}} /> 
                        CHEF'S CHOICE
                      </div>
                  )}

                  {/* 🚀 New Spice Level Logic: Shows only if the field exists in DB */}
                  {item.spiceLevel && (
                    <div style={{...styles.spiceTag, color: item.spiceLevel.toLowerCase() === 'high' ? '#ff4444' : primaryColor}}>
                      <Flame size={10} style={{marginRight: '4px'}} />
                      {item.spiceLevel.toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={styles.itemContentLeft}>
                  <p style={{...styles.itemTitle, color: '#fff'}}>{item.name}</p>
                  <p style={styles.itemDesc}>{item.ingredients?.join(', ')}</p>
                  <div style={styles.priceContainer}>
                    {!item.priceHalf ? (
                      <div style={styles.priceRow}>
                        <div style={{fontSize: '1.1rem', fontWeight: '800', color: primaryColor}}>₹{item.priceFull || item.price}</div>
                        {cart[item._id] ? (
                          <div style={styles.counterRowSmall}>
                            <button onClick={() => removeFromCart(item._id)} style={styles.qtyBtnSmall}>-</button>
                            <span>{cart[item._id]}</span>
                            <button onClick={() => addToCart(item, 'Single')} style={styles.qtyBtnSmall}>+</button>
                          </div>
                        ) : ( <button onClick={() => addToCart(item, 'Single')} style={styles.addBtnSmall}>ADD</button> )}
                      </div>
                    ) : (
                      <>
                        <div style={styles.priceRow}>
                          <div style={styles.priceLabel}>Half: <span style={{color: primaryColor}}>₹{item.priceHalf}</span></div>
                          {cart[`${item._id}-Half`] ? ( <div style={styles.counterRowSmall}><button onClick={() => removeFromCart(`${item._id}-Half`)} style={styles.qtyBtnSmall}>-</button><span>{cart[`${item._id}-Half`]}</span><button onClick={() => addToCart(item, 'Half')} style={styles.qtyBtnSmall}>+</button></div> ) : ( <button onClick={() => addToCart(item, 'Half')} style={styles.addBtnSmall}>ADD HALF</button> )}
                        </div>
                        <div style={styles.priceRow}>
                          <div style={styles.priceLabel}>Full: <span style={{color: primaryColor}}>₹{item.priceFull || item.price}</span></div>
                          {cart[`${item._id}-Full`] ? ( <div style={styles.counterRowSmall}><button onClick={() => removeFromCart(`${item._id}-Full`)} style={styles.qtyBtnSmall}>-</button><span>{cart[`${item._id}-Full`]}</span><button onClick={() => addToCart(item, 'Full')} style={styles.qtyBtnSmall}>+</button></div> ) : ( <button onClick={() => addToCart(item, 'Full')} style={styles.addBtnSmall}>ADD FULL</button> )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button style={{...styles.view3dBtn, background: primaryColor}} onClick={() => setActiveModel(item)}>3D</button>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isDrawerOpen && ( 
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={{...styles.sideDrawer, background: secondaryColor}}>
            <div style={{...styles.drawerHeader, borderColor: borderColor}}>
              <h2 style={{color: primaryColor, margin: 0}}>Round Order</h2>
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
                          <p style={{margin:0, fontWeight:'600', color: '#fff'}}>{item?.name}</p>
                          {portion && <small style={{color: primaryColor}}>{portion}</small>}
                        </div>
                        <span style={{fontWeight:'700', color: primaryColor}}>x{qty}</span>
                      </div>
                      
                      <div style={styles.suggestionInputWrapper}>
                        <StickyNote size={14} style={{color: primaryColor, opacity: 0.7}} />
                        <input 
                          type="text" 
                          placeholder="Less spicy, no onion etc..." 
                          style={styles.suggestionInput}
                          value={suggestions[key] || ""}
                          onChange={(e) => handleSuggestionChange(key, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })
              ) : ( 
                <p style={{textAlign:'center', color:'#555', marginTop:'40px'}}>Round is empty.</p> 
              )}
            </div>
            <div style={styles.drawerFooter}>
              {totalItemsInCart > 0 && <button style={{...styles.kitchenBtn, background: primaryColor}} onClick={sendBatchToKitchen}>ORDER NOW</button>}
              <button style={styles.billLinkBtn} onClick={() => { setIsDrawerOpen(false); setIsBillOpen(true); }}>View Final Bill →</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModel && ( 
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalOverlay}>
            <div style={{...styles.modalNav, borderColor: borderColor, background: secondaryColor}}>
              <div style={{textAlign: 'left'}}>
                <h2 style={{...styles.modalTitle, color: primaryColor}}>{activeModel.name}</h2>
                <small style={{color: '#777'}}>Pinch to zoom • Drag to rotate</small>
              </div>
              <span style={{...styles.closeModal, color: primaryColor}} onClick={() => setActiveModel(null)}>&times;</span>
            </div>

            <div style={styles.modelContainer}>
              <div style={styles.dishModelWrapper}>
                <model-viewer 
                  src={activeModel.modelUrl} 
                  ar ar-modes="webxr scene-viewer quick-look" 
                  camera-controls auto-rotate shadow-intensity="1" 
                  environment-image="neutral" exposure="1" 
                  style={{ width: '100%', height: '100%' }}
                >
                  <button slot="ar-button" style={{...styles.arCustomBtn, background: primaryColor}}>✨ VIEW IN YOUR SPACE</button>
                </model-viewer>
              </div>

              {activeModel.isChefSpecial && (
                <div style={styles.chefContainerAR}>
                   <div style={styles.chefFlexWrapper}>
                      <div style={styles.chefModelBox}>
                        <model-viewer 
                          src={activeModel.chefurl} 
                          autoplay 
                          style={{ width: '180px', height: '320px' }} 
                          camera-orbit="10deg 80deg 3m"
                          camera-target="0m 1m 0m"
                          interaction-prompt="none"
                        />
                      </div>
                      <div style={styles.chefBubbleRight}>
                          <MessageSquare size={12} style={{position: 'absolute', top: '15px', left: '-8px', color: '#fff'}} />
                          "{activeModel.chefMessage || "My personal favorite! You'll love the flavors."}"
                      </div>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{isBillOpen && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{...styles.sideDrawer, background: secondaryColor, width: '100%'}}><div style={styles.modalNav}><h2 style={{color: primaryColor}}>Checkout Table {tableNumber}</h2><span style={{color: primaryColor, fontSize: '2rem'}} onClick={() => { setIsBillOpen(false); setBillRequested(false); }}>&times;</span></div><div style={styles.formContainer}>{!billRequested ? (<><p style={{color: '#888', fontSize: '0.8rem', textAlign:'center'}}>Enter details for your automated digital receipt.</p><input type="text" placeholder="Full Name" style={styles.input} value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} /><input type="tel" placeholder="Mobile Number" style={styles.input} value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} /><button style={{...styles.kitchenBtn, background: primaryColor}} onClick={requestFinalBill}>GENERATE BILL</button></>) : (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.thankYouWrapper}><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} style={styles.successCircle}><CheckCircle2 size={40} color={primaryColor} /></motion.div><h2 style={styles.thankYouTitle}>Thank You!</h2><p style={styles.visitAgainMsg}>Receipt notification sent. Keep it digital, keep it clean.</p><div style={styles.divider} /><div style={styles.checkoutInfoCard}><p style={styles.waiterAlert}>Bill notification sent</p><p style={styles.tableLabel}>Visit us again!</p></div><div style={styles.premiumReviewBox}><p style={styles.reviewPrompt}>"Your feedback helps us grow."</p><motion.a href={`https://www.google.com/search?q=${encodeURIComponent((restaurantData?.name || 'Jay Ambe Multi Fusion') + ' google review link')}`} target="_blank" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={styles.premiumGoogleBtn}><img src="https://www.gstatic.com/images/branding/product/2x/gsa_64dp.png" alt="Google" style={{ width: 22, marginRight: 12 }} />RATE US ON GOOGLE</motion.a></div><button style={styles.backToMenuBtn} onClick={() => { setBillRequested(false); setIsBillOpen(false); }}>BACK TO MENU</button></motion.div>)}</div></motion.div>)}</AnimatePresence>

      {(totalItemsInCart > 0 || hasPlacedInitialOrder) && (
        <motion.div 
          initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={styles.circularFab} 
          onClick={() => setIsDrawerOpen(true)}
        >
          <div style={styles.circularFabInner}>
            <Utensils size={28} color={secondaryColor} strokeWidth={2.5} />
            {totalItemsInCart > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={styles.fabBadgeCircular}>
                {totalItemsInCart}
              </motion.span>
            )}
          </div>
          <div style={styles.fabGlowEffect} />
        </motion.div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const styles = {
  body: { minHeight: '100vh', fontFamily: 'Poppins, sans-serif', color: '#fff', overflowX: 'hidden' },
  header: { padding: '50px 20px 20px', textAlign: 'center' },
  cafeName: { fontSize: '1.8rem', fontFamily: 'Playfair Display, serif', fontWeight: '800' },
  poweredBy: { fontSize: '0.6rem', letterSpacing: '4px', marginTop: '5px', opacity: 0.5 },
  navContainer: { position: 'sticky', top: '0', zIndex: 999, backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(211, 191, 162, 0.15)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  navScroll: { display: 'flex', overflowX: 'auto', padding: '16px 10px', gap: '20px', scrollBehavior: 'smooth', whiteSpace: 'nowrap' },
  navItem: { background: 'none', border: 'none', fontWeight: '800', fontSize: '0.72rem', flexShrink: 0, padding: '6px 5px', position: 'relative', outline: 'none' },
  activeUnderline: { position: 'absolute', bottom: '-8px', left: '0', right: '0', height: '3px', background: '#d3bfa2', borderRadius: '10px', boxShadow: '0 0 10px rgba(211, 191, 162, 0.4)' },
  contentWrapper: { marginTop: '10px' }, 
  menuContainer: { padding: '20px 15px', maxWidth: '600px', margin: '0 auto', paddingBottom: '120px', minHeight: '85vh', touchAction: 'pan-y' },
  menuCard: { borderRadius: '28px', padding: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', border: '1px solid', textAlign: 'left' },
  itemContentLeft: { flex: 1, paddingRight: '15px' },
  itemTitle: { fontSize: '1.15rem', margin: 0, fontFamily: 'Playfair Display, serif', fontWeight: '700' },
  itemDesc: { fontSize: '0.7rem', color: '#888', margin: '5px 0 12px' },
  priceContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
  priceLabel: { fontSize: '0.85rem', fontWeight: '600' },
  counterRowSmall: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '8px', background: 'rgba(211, 191, 162, 0.15)' },
  qtyBtnSmall: { background: 'none', border: 'none', color: '#d3bfa2', fontWeight: 'bold' },
  addBtnSmall: { background: 'none', border: '1px solid', fontSize: '0.65rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px', color: '#d3bfa2', borderColor: '#d3bfa2' },
  view3dBtn: { color: '#1a1a1a', width: '45px', height: '45px', borderRadius: '50%', fontWeight: '900', fontSize: '0.6rem', border: 'none', flexShrink: 0 },
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
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5000, display: 'flex', flexDirection: 'column', background: '#000' },
  modalNav: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid' },
  modalTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '800' },
  closeModal: { fontSize: '2.5rem', cursor: 'pointer', padding: '0 10px' },
  modelContainer: { flex: 1, background: '#111', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', position: 'relative' },
  dishModelWrapper: { width: '100%', height: '50vh', marginTop: '10px' },
  arCustomBtn: { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', border: 'none', padding: '15px 25px', borderRadius: '50px', fontWeight: '900', fontSize: '0.75rem', color: '#1a1a1a', zIndex: 6000 },
  formContainer: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center' },
  input: { padding: '15px', borderRadius: '10px', border: '1px solid #333', background: '#222', color: '#fff', outline: 'none' },
  loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  thankYouWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' },
  successCircle: { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(211, 191, 162, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(211, 191, 162, 0.3)' },
  thankYouTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#fff', marginBottom: '10px', fontWeight: '800' },
  visitAgainMsg: { fontSize: '0.9rem', color: '#888', lineHeight: '1.6', marginBottom: '20px' },
  divider: { width: '40px', height: '2px', background: '#d3bfa2', margin: '10px 0 30px', opacity: 0.5 },
  checkoutInfoCard: { background: '#111', padding: '20px 40px', borderRadius: '16px', border: '1px solid #222', marginBottom: '40px' },
  waiterAlert: { fontSize: '0.7rem', color: '#d3bfa2', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 },
  tableLabel: { fontSize: '1.1rem', fontWeight: '900', color: '#fff', marginTop: '5px' },
  premiumReviewBox: { width: '100%', maxWidth: '350px', padding: '25px', background: 'linear-gradient(145deg, #161616, #0d0d0d)', borderRadius: '24px', border: '1px solid rgba(211, 191, 162, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  reviewPrompt: { fontStyle: 'italic', color: '#aaa', fontSize: '0.8rem', marginBottom: '20px' },
  premiumGoogleBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#000', padding: '16px', borderRadius: '14px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px' },
  backToMenuBtn: { marginTop: '30px', background: 'transparent', border: 'none', color: '#555', fontSize: '0.7rem', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', letterSpacing: '1px' },
  globalAlert: { position: 'fixed', top: '0px', left: '16px', right: '16px', background: 'rgba(30, 30, 30, 0.96)', backdropFilter: 'blur(12px)', padding: '16px 18px', borderRadius: '16px', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' },
  circularFab: { position: 'fixed', bottom: '30px', right: '25px', width: '75px', height: '75px', zIndex: 1000, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  circularFabInner: { width: '100%', height: '100%', background: '#d3bfa2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.4), inset 0 2px 2px rgba(255,255,255,0.5)', border: '1.5px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 2 },
  fabBadgeCircular: { position: 'absolute', top: '2px', right: '2px', background: '#fff', color: '#000', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '900', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', border: '1.5px solid #d3bfa2' },
  fabGlowEffect: { position: 'absolute', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(211,191,162,0.25) 0%, rgba(211,191,162,0) 70%)', zIndex: 1, borderRadius: '50%' },
  
  // 🚀 Spice Tag Styles
  tagContainer: {
    position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10
  },
  chefTag: {
    background: 'linear-gradient(135deg, #d3bfa2, #b09c7a)', color: '#1a1a1a', padding: '4px 10px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: '900', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  },
  spiceTag: {
    background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: '900', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)'
  },

  chefContainerAR: { position: 'absolute', bottom: '60px', left: '10px', zIndex: 100, width: '100%' },
  chefFlexWrapper: { display: 'flex', alignItems: 'center', gap: '0px' },
  chefModelBox: { flexShrink: 0 },
  chefBubbleRight: { background: '#fff', color: '#1a1a1a', padding: '12px 16px', borderRadius: '2px 18px 18px 18px', fontSize: '0.7rem', fontWeight: '700', maxWidth: '170px', textAlign: 'left', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', position: 'relative', border: '1px solid rgba(211, 191, 162, 0.4)', marginLeft: '-35px', marginTop: '-80px' }
};

export default PratyekshaPremiumMenu;