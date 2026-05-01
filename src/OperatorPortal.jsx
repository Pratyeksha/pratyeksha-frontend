import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react'; 
import { 
  LayoutDashboard, UtensilsCrossed, ReceiptIndianRupee, BarChart3, LogOut, 
  Search, CheckCircle2, BellRing, MessageSquare, Sparkles, AlertTriangle, 
  Info, SendHorizontal, CookingPot, Percent 
} from 'lucide-react';

const LAPTOP_IP = "10.222.134.11";
const BASE_URL = `http://${LAPTOP_IP}:5000/api`;

const OperatorPortal = () => {
  // Move socket inside to prevent connection leaks
  const socket = useMemo(() => io(`http://${LAPTOP_IP}:5000`), []);

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('pratyeksha_token'));
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('pending'); 
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableBill, setTableBill] = useState(null);
  const [checkoutRequests, setCheckoutRequests] = useState([]);
  const [whatsappQr, setWhatsappQr] = useState(null);
  const [isBotReady, setIsBotReady] = useState(false);
  const [discount, setDiscount] = useState(0); 

  const [selectedBroadcastItem, setSelectedBroadcastItem] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [notif, setNotif] = useState({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', subtitle: '', onConfirm: null });

  const tenantId = localStorage.getItem('active_tenant') || 'jay_ambe_fusion';
  const tableCount = parseInt(localStorage.getItem('table_count')) || 12; 
  const logoPath = `${import.meta.env.BASE_URL}logo.png`;

  const showNotif = (msg, type = 'success') => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 3000);
  };

  const getFormattedDate = () => {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    return `${getOrdinal(day)} ${month} ${year}`;
  };

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, '');
  };

  const handleLogout = () => {
    setConfirmModal({
      show: true,
      title: "Logout Session?",
      subtitle: "Are you sure you want to end your current session?",
      onConfirm: () => {
        localStorage.clear();
        setIsAuthenticated(false);
        window.location.reload(); 
      }
    });
  };

  // --- CORE DATA FETCHING ---
  const fetchInitialData = async () => {
    try {
      const [orderRes, menuRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/operator`),
        axios.get(`${BASE_URL}/menu/${tenantId}`)
      ]);
      setOrders(orderRes.data);
      setMenuItems(menuRes.data);
    } catch (err) { console.error(err); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/analytics/${tenantId}`);
      setAnalytics(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (isAuthenticated) {
      socket.emit("join_restaurant", tenantId);
      fetchInitialData();
      fetchAnalytics();

      socket.on("new_order", (order) => {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
        showNotif(`New Order Received for Table ${order.tableNumber}`);
        fetchInitialData();
      });

      socket.on("order_status_updated", () => fetchInitialData());

      socket.on("bill_requested", (data) => {
        setCheckoutRequests(prev => [...new Set([...prev, data.tableNumber])]);
        new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play();
        showNotif(`Bill requested: Table ${data.tableNumber}`, 'warning');
      });

      socket.on("whatsapp_qr", (qr) => setWhatsappQr(qr));
      socket.on("whatsapp_ready", () => {
        setIsBotReady(true);
        setWhatsappQr(null);
      });
    }
    return () => {
        socket.off("new_order");
        socket.off("order_status_updated");
        socket.off("bill_requested");
        socket.off("whatsapp_qr");
        socket.off("whatsapp_ready");
    };
  }, [isAuthenticated, tenantId, socket]);

  // --- MARKETING LOGIC ---
  const handleBroadcast = async (customOffer = '') => {
    if (!selectedBroadcastItem && !customOffer) return showNotif("Select a dish or enter a message", "error");
    setIsBroadcasting(true);
    try {
        const item = menuItems.find(i => i._id === selectedBroadcastItem);
        await axios.post(`${BASE_URL}/admin/broadcast`, { 
            tenantId, 
            itemName: item?.name || '', 
            customOffer: customOffer 
        });
        showNotif("Global Broadcast Launched!");
    } catch (err) { 
        showNotif("Broadcast failed", "error"); 
    } finally { 
        setIsBroadcasting(false); 
    }
  };

  // --- BILLING LOGIC ---
  const generateBill = async (tableNum) => {
    setSelectedTable(tableNum);
    setDiscount(0);
    try {
      const res = await axios.get(`${BASE_URL}/admin/bill/${tenantId}/${tableNum}`);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayStats = analytics.find(a => a._id === todayStr);
      const currentBillCount = (todayStats?.count || 0) + 1;
      const allItems = res.data.flatMap(o => o.items);
      if(allItems.length === 0) {
        showNotif("No served items for this table.", "error");
        setTableBill(null);
        return;
      }
      const grandTotal = allItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
      setTableBill({ items: allItems, total: grandTotal, billNo: currentBillCount, date: getFormattedDate(), time: getFormattedTime() });
    } catch (err) { console.error(err); }
  };

  const settleBill = () => {
    const finalAmount = tableBill.total - (tableBill.total * (discount / 100));
    setConfirmModal({
      show: true,
      title: `Settle Table ${selectedTable}?`,
      subtitle: `Final Amount after ${discount}% discount: ₹${finalAmount.toFixed(2)}`,
      onConfirm: async () => {
        try {
          await axios.patch(`${BASE_URL}/admin/settle/${tenantId}/${selectedTable}`, {
              discount: discount,
              finalAmount: finalAmount
          });
          setCheckoutRequests(prev => prev.filter(t => t !== selectedTable));
          setTableBill(null);
          setSelectedTable(null);
          fetchInitialData();
          fetchAnalytics();
          showNotif("Table Settled Successfully");
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) { showNotif("Settlement failed", "error"); }
      }
    });
  };

  // --- MENU LOGIC ---
  const updateMenu = async (itemId, updateData) => {
    try {
      await axios.patch(`${BASE_URL}/menu-item/${itemId}`, updateData);
      fetchInitialData();
    } catch (err) { console.error(err); }
  };

  const editPortionPrice = (item, type) => {
    const isHalf = type === 'Half';
    const currentPrice = isHalf ? item.priceHalf : (item.priceFull || item.price);
    const newPrice = prompt(`Update ${type} price for ${item.name}:`, currentPrice);
    if (newPrice && !isNaN(newPrice)) {
      const updateData = isHalf ? { priceHalf: Number(newPrice) } : (item.priceFull ? { priceFull: Number(newPrice) } : { price: Number(newPrice) });
      updateMenu(item._id, updateData);
    }
  };

  // --- HEATMAP RENDER ---
  const renderDetailedHeatmap = () => {
    const grid = [];
    for (let i = 1; i <= 31; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const dayData = analytics.find(d => d._id && d._id.endsWith(`-${dayStr}`));
      const revenue = dayData ? dayData.revenue : 0;
      grid.push(
        <motion.div key={i} whileHover={{ scale: 1.1, zIndex: 2 }} className="heat-square"
          style={{ 
            ...styles.heatSquare, 
            background: revenue > 0 ? `rgba(211, 191, 162, ${Math.min(revenue / 8000, 1)})` : '#111', 
            border: revenue > 4000 ? '1px solid #d3bfa2' : '1px solid #222' 
          }} >
          <span style={{ fontSize: '0.6rem', color: revenue > 0 ? '#000' : '#444', fontWeight: 'bold' }}>{i}</span>
          <div className="tooltip" style={styles.tooltip}>
            {dayData ? `Date: ${dayData._id}` : `Day ${i}`}<br/>Revenue: ₹{revenue}
          </div>
        </motion.div>
      );
    }
    return grid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/admin/login`, loginData);
      localStorage.setItem('pratyeksha_token', res.data.token);
      localStorage.setItem('active_tenant', res.data.tenantId);
      localStorage.setItem('table_count', res.data.tableCount); 
      setIsAuthenticated(true);
      window.location.reload(); 
    } catch (err) { showNotif("Invalid Credentials", "error"); }
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.loginOverlay}>
        <motion.form initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.loginBox} onSubmit={handleLogin}>
          <img src={logoPath} alt="Logo" style={styles.loginLogo} />
          <h2 style={styles.loginTitle}>Admin Portal</h2>
          <input type="text" placeholder="Username" style={styles.input} value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} />
          <input type="password" placeholder="Password" style={styles.input} value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
          <button type="submit" style={styles.mainBtn}>ENTER DASHBOARD</button>
        </motion.form>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} style={{...styles.toast, borderRight: `5px solid ${notif.type === 'success' ? '#d3bfa2' : '#ff4444'}`}}>
             <Info size={18} style={{marginRight: '10px'}} /> {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal.show && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.modalBackdrop}>
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={styles.confirmBox}>
                <div style={styles.iconCircle}><AlertTriangle size={24} color="#d3bfa2" /></div>
                <h3 style={{margin: '0 0 8px', color: '#fff'}}>{confirmModal.title}</h3>
                <p style={{margin: '0 0 24px', color: '#888', fontSize: '0.85rem'}}>{confirmModal.subtitle}</p>
                <div style={{display: 'flex', gap: '10px', width: '100%'}}>
                   <button onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))} style={styles.cancelBtn}>Cancel</button>
                   <button onClick={confirmModal.onConfirm} style={styles.confirmBtn}>Confirm</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside style={styles.sidebar}>
        <LayoutGroup>
          <div style={styles.sidebarTop}>
            <div style={styles.logoWrapper}><img src={logoPath} alt="Logo" style={styles.sidebarLogo} /></div>
            <nav style={styles.navStack}>
              {[
                { id: 'pending', label: 'Live Kitchen', icon: <CookingPot size={20} /> },
                { id: 'menu', label: 'Menu Editor', icon: <UtensilsCrossed size={20} /> },
                { id: 'billing', label: 'Billing Hub', icon: <ReceiptIndianRupee size={20} /> },
                { id: 'marketing', label: 'Marketing Hub', icon: <MessageSquare size={20} /> },
                { id: 'insights', label: 'Insights', icon: <BarChart3 size={20} /> }
              ].map((tab) => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'insights') fetchAnalytics(); if (tab.id === 'pending') fetchInitialData(); }} style={activeTab === tab.id ? styles.activeTab : styles.navBtn}>
                  <span style={{ zIndex: 2, marginRight: '12px', display: 'flex' }}>{tab.icon}</span>
                  <span style={{ zIndex: 2 }}>{tab.label}</span>
                  {tab.id === 'billing' && checkoutRequests.length > 0 && <span style={styles.sidebarNotif}>{checkoutRequests.length}</span>}
                  {tab.id === 'pending' && orders.length > 0 && <span style={{...styles.sidebarNotif, background: '#00ff64'}}>{orders.length}</span>}
                  {activeTab === tab.id && <motion.div layoutId="active-bg" style={styles.activeBackground} />}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={18} style={{ marginRight: '12px' }} />Logout Session</button>
        </LayoutGroup>
      </aside>

      <main style={styles.mainContent}>
        <header style={styles.topHeader}>
          <h1 style={styles.pageTitle}>{activeTab === 'pending' ? 'INCOMING CUSTOMER ORDERS' : activeTab.toUpperCase()}</h1>
          {activeTab === 'menu' && (
             <div style={styles.searchWrapper}>
                <Search size={18} style={styles.searchIcon} />
                <input type="text" placeholder="Filter dishes..." style={styles.searchInput} onChange={(e) => setSearchQuery(e.target.value)} />
             </div>
          )}
        </header>

        <section style={styles.scrollArea} className="custom-scroll">
          <AnimatePresence mode='wait'>
            {activeTab === 'marketing' ? (
                <motion.div key="marketing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{display:'flex', flexDirection:'column', gap:'30px', alignItems:'center'}}>
                    <div style={styles.botCard}>
                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'10px'}}>
                            <Sparkles size={24} color="#d3bfa2" />
                            <h3 style={{margin:0}}>Smart Retention Bot</h3>
                        </div>
                        <div style={styles.qrContainer}>
                            {isBotReady ? ( <div style={styles.statusBox}><div style={styles.pulseGreen} /><span style={{color: '#00ff64', fontWeight: 'bold'}}>SYSTEM LIVE</span></div> ) : whatsappQr ? (
                                <div style={styles.qrWrapper}><QRCodeSVG value={whatsappQr} size={250} /><p style={{marginTop: '15px', color: '#d3bfa2'}}>Scan to Sync Business WhatsApp</p></div>
                            ) : ( <div style={styles.loaderBox}><div className="spinner" /><p>Connecting to Pratyeksha Cloud...</p></div> )}
                        </div>
                    </div>

                    <div style={{...styles.botCard, border: '1px solid #d3bfa222', background: 'linear-gradient(145deg, #111, #0a0a0a)'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
                            <SendHorizontal size={20} color="#d3bfa2" />
                            <h3 style={{margin:0}}>Global Broadcast Center</h3>
                        </div>
                        
                        <div style={{marginBottom: '20px', textAlign: 'left'}}>
                            <label style={{fontSize: '0.7rem', color: '#666'}}>FEATURE A NEW DISH</label>
                            <select value={selectedBroadcastItem} onChange={(e) => setSelectedBroadcastItem(e.target.value)} style={styles.broadcastSelect}>
                                <option value="">Select...</option>
                                {menuItems.map(item => (<option key={item._id} value={item._id}>{item.name}</option>))}
                            </select>
                        </div>

                        <div style={{marginBottom: '20px', textAlign: 'left'}}>
                            <label style={{fontSize: '0.7rem', color: '#666'}}>OR SEND CUSTOM ANNOUNCEMENT</label>
                            <textarea 
                                placeholder="Example: 20% discount tonight! or We are open for New Year's Eve!"
                                style={{...styles.broadcastSelect, height: '80px', paddingTop: '10px'}}
                                id="customBroadcastText"
                            />
                        </div>

                        <button onClick={() => handleBroadcast(document.getElementById('customBroadcastText').value)} disabled={isBroadcasting} style={styles.mainBtn}>
                            {isBroadcasting ? "SENDING..." : "LAUNCH BROADCAST TO ALL CUSTOMERS"}
                        </button>
                    </div>
                </motion.div>
            ) : activeTab === 'insights' ? (
              <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.insightsWrapper}>
                 <div style={styles.statsRow}>
                   <div style={styles.glassStat}>
                     <small>Monthly Revenue</small>
                     <h2>₹{analytics.reduce((a, b) => a + (b.revenue || 0), 0).toLocaleString()}</h2>
                   </div>
                   <div style={styles.glassStat}>
                     <small>Avg. Order Value</small>
                     <h2>₹{analytics.length > 0 ? (analytics.reduce((a, b) => a + (b.revenue || 0), 0) / analytics.reduce((a, b) => a + (b.count || 1), 0)).toFixed(0) : 0}</h2>
                   </div>
                 </div>
                 <div style={styles.heatmapHeader}><h3 style={{color: '#fff', margin: 0, textAlign: 'center'}}>Daily Performance Heatmap</h3></div>
                 <div style={styles.heatmapGrid}>{renderDetailedHeatmap()}</div>
              </motion.div>
            ) : activeTab === 'menu' ? (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.fullWidthGrid}>
                {menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => {
                    const hasPortions = !!item.priceHalf;
                    return (
                      <div key={item._id} style={{...styles.premiumCard, borderLeft: `4px solid ${item.isAvailable ? '#d3bfa2' : '#333'}`, opacity: item.isAvailable ? 1 : 0.5}}>
                        <div style={styles.cardHeader}><h3 style={styles.itemName}>{item.name}</h3><div style={styles.itemPrice}>{hasPortions ? `H:₹${item.priceHalf} | F:₹${item.priceFull || item.price}` : `₹${item.price}`}</div></div>
                        <div style={styles.cardFooter}>
                          {!hasPortions ? (<button onClick={() => editPortionPrice(item, 'Single')} style={styles.ghostBtn}>Price</button>) : (<><button onClick={() => editPortionPrice(item, 'Half')} style={styles.ghostBtn}>Half</button><button onClick={() => editPortionPrice(item, 'Full')} style={styles.ghostBtn}>Full</button></>)}
                          <button onClick={() => updateMenu(item._id, {isAvailable: !item.isAvailable})} style={item.isAvailable ? styles.toggleHideBtn : styles.toggleShowBtn}>{item.isAvailable ? "HIDE" : "SHOW"}</button>
                        </div>
                      </div>
                    );
                  })}
              </motion.div>
            ) : activeTab === 'billing' ? (
              <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{display:'flex', gap:'50px', width: '100%'}}>
                <div style={{flex:1}}>
                  <h3 style={{marginBottom: '20px', color: '#888'}}>Select Table</h3>
                  <div style={styles.tableGrid}>
                    {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => {
                      const isReq = checkoutRequests.includes(n.toString());
                      return (
                        <button key={n} onClick={() => generateBill(n.toString())} 
                           style={
                             selectedTable === n.toString() ? styles.activeTableBtn : 
                             (isReq ? styles.goldTableBtn : styles.tableBtn)
                           }>
                          Table {n} {isReq && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><BellRing size={16} style={{marginTop: '5px'}}/></motion.div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {tableBill && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={styles.receipt}>
                    <div style={styles.receiptHeader}><img src={logoPath} alt="Logo" style={{width: '80px', filter: 'invert(1)'}} /><p style={{color:'#666', fontSize: '0.8rem', marginTop: '5px'}}>Jay Ambe Multi Fusion</p></div>
                    <div style={styles.billMetaContainer}><div style={{color:'#000', fontSize: '0.85rem'}}><strong>Bill No: #{tableBill.billNo}</strong><br/><strong>Table: {selectedTable}</strong></div><div style={{color:'#666', fontSize: '0.75rem', textAlign: 'right'}}><span>{tableBill.date}</span><br/><span>{tableBill.time}</span></div></div>
                    <div style={{minHeight: '200px', borderTop: '1px solid #eee', paddingTop: '15px'}}>{tableBill.items.map((it, i) => (<div key={i} style={styles.receiptRow}><span>{it.quantity}x {it.name} {it.portion !== 'Single' && <small>({it.portion})</small>}</span><span style={{fontWeight: '700'}}>₹{it.subtotal}</span></div>))}</div>
                    
                    <div style={styles.discountWrapper}>
                        <div style={styles.receiptRow}>
                            <span style={{display:'flex', alignItems:'center', gap:'5px'}}><Percent size={14} /> Applied Discount</span>
                            <div style={{display:'flex', alignItems:'center'}}>
                                <input type="number" value={discount} onChange={(e) => setDiscount(Math.min(100, Math.max(0, e.target.value)))} style={styles.discountInput} />
                                <span style={{fontWeight:'700'}}>%</span>
                            </div>
                        </div>
                    </div>

                    <div style={{borderTop: '2px solid #000', paddingTop: '15px'}}>
                        <h3 style={{color:'#000', display:'flex', justifyContent:'space-between', margin:0}}>
                            Grand Total: 
                            <span>₹{(tableBill.total - (tableBill.total * (discount/100))).toFixed(2)}</span>
                        </h3>
                    </div>
                    <button onClick={settleBill} style={styles.settleBtn}>PAID & CLEAR</button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.orderContainer}>
                {orders.length === 0 ? (
                  <div style={{textAlign: 'center', marginTop: '100px', opacity: 0.5}}>
                    <CookingPot size={48} style={{marginBottom: '20px'}} />
                    <p>No new orders right now.</p>
                  </div>
                ) : orders.map(order => (
                    <motion.div layout initial={{opacity: 0}} animate={{opacity: 1}} key={order._id} style={styles.orderRow}>
                      <div style={styles.orderInfo}>
                        <div style={{...styles.tableCircle, background: '#222', color: '#d3bfa2'}}>{order.tableNumber}</div>
                        <div>
                          <h4 style={{margin:0}}>Table {order.tableNumber}</h4>
                          <div style={{marginTop:'5px', color: '#d3bfa2'}}>
                             {order.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                          </div>
                        </div>
                      </div>
                      <div style={{color: '#d3bfa2', fontWeight: 'bold', fontSize: '0.8rem'}}>PENDING</div>
                    </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; } 
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .heat-square:hover .tooltip { visibility: visible; opacity: 1; transform: translateY(-5px); }
        .spinner { border: 4px solid rgba(211, 191, 162, 0.1); border-top: 4px solid #d3bfa2; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  broadcastSelect: { width: '100%', padding: '15px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', color: '#fff', marginBottom: '10px', outline: 'none' },
  dashboard: { display: 'flex', width: '100vw', height: '100vh', background: '#0a0a0a', color: '#fff', position: 'fixed', top: 0, left: 0, overflow: 'hidden' },
  sidebar: { width: '280px', height: '100vh', background: '#0d0d0d', padding: '40px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #1a1a1a' },
  logoWrapper: { marginBottom: '48px', paddingLeft: '12px' },
  sidebarLogo: { width: '150px' },
  navStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  navBtn: { position: 'relative', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', borderRadius: '12px', fontWeight: '600', fontSize: '0.9rem' },
  activeTab: { position: 'relative', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'transparent', border: 'none', color: '#d3bfa2', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' },
  activeBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(211, 191, 162, 0.08)', borderRadius: '12px', zIndex: 1, border: '1px solid rgba(211, 191, 162, 0.1)' },
  sidebarNotif: { position: 'absolute', right: '15px', background: '#d3bfa2', color: '#000', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', zIndex: 5 },
  logoutBtn: { display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: '0.2s', borderTop: '1px solid #1a1a1a', paddingTop: '24px' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a' },
  topHeader: { padding: '30px 40px', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { margin: 0, fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '15px', color: '#444' },
  searchInput: { padding: '12px 20px 12px 45px', background: '#161616', border: '1px solid #222', borderRadius: '12px', color: '#fff', width: '300px', outline: 'none' },
  scrollArea: { flex: 1, padding: '40px', overflowY: 'auto' },
  insightsWrapper: { maxWidth: '900px' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
  glassStat: { flex: 1, padding: '25px', background: '#111', borderRadius: '20px', border: '1px solid #1a1a1a' },
  heatmapHeader: { marginBottom: '20px', background: '#111', padding: '15px', borderRadius: '12px', border: '1px solid #1a1a1a' },
  heatmapGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' },
  heatSquare: { height: '60px', borderRadius: '8px', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tooltip: { position: 'absolute', bottom: '110%', background: '#fff', color: '#000', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', visibility: 'hidden', opacity: 0, transition: '0.3s', zIndex: 10, whiteSpace: 'nowrap' },
  fullWidthGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  premiumCard: { background: '#111', borderRadius: '16px', padding: '25px', border: '1px solid #1a1a1a' },
  cardHeader: { display: 'flex', justifyContent: 'space-between' },
  itemName: { margin: 0, fontSize: '1.1rem' },
  itemPrice: { color: '#d3bfa2', fontWeight: 'bold' },
  cardFooter: { display: 'flex', gap: '10px' },
  ghostBtn: { flex: 1, padding: '10px', background: 'transparent', border: '1px solid #333', color: '#fff', borderRadius: '8px', fontSize: '0.75rem' },
  toggleHideBtn: { flex: 1, padding: '10px', background: '#333', color: '#fff', borderRadius: '8px', fontWeight: 'bold' },
  toggleShowBtn: { flex: 1, padding: '10px', background: '#d3bfa2', color: '#000', borderRadius: '8px', fontWeight: 'bold' },
  orderRow: { background: '#111', padding: '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', border: '1px solid #1a1a1a' },
  tableCircle: { width: '45px', height: '45px', borderRadius: '12px', background: '#222', color: '#d3bfa2', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', marginRight: '20px' },
  orderInfo: { display: 'flex', alignItems: 'center' },
  tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' },
  tableBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '12px' },
  activeTableBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: '#d3bfa2', color: '#000', fontWeight: 'bold', borderRadius: '12px', border: 'none' },
  goldTableBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: '#111', border: '2px solid #d3bfa2', color: '#d3bfa2', borderRadius: '12px', boxShadow: '0 0 15px rgba(211,191,162,0.3)' },
  receipt: { width: '380px', background: '#fff', color: '#000', padding: '40px', borderRadius: '4px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', height: 'fit-content' },
  receiptHeader: { borderBottom: '2px dashed #ccc', paddingBottom: '10px', marginBottom: '15px', textAlign:'center' },
  billMetaContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
  receiptRow: { display: 'flex', justifyContent: 'space-between', color:'#333', marginBottom:'10px', fontSize: '0.95rem' },
  discountWrapper: { borderTop: '1px solid #eee', padding: '15px 0', margin: '15px 0' },
  discountInput: { width: '50px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px', marginLeft: '5px', fontWeight: '700' },
  settleBtn: { width: '100%', marginTop: '30px', padding: '18px', background: '#000', color: '#fff', fontWeight: '900', borderRadius: '8px', border: 'none' },
  loginOverlay: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' },
  loginBox: { background: '#0d0d0d', padding: '50px', borderRadius: '30px', border: '1px solid #1a1a1a', width: '420px', textAlign: 'center' },
  loginLogo: { width: '130px', marginBottom: '20px' },
  loginTitle: { margin: '10px 0 30px', fontSize: '2rem', color: '#fff' },
  input: { width: '100%', padding: '15px', marginBottom: '15px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: '#fff' },
  mainBtn: { width: '100%', padding: '16px', background: '#d3bfa2', color: '#000', fontWeight: '900', borderRadius: '12px', border: 'none', cursor: 'pointer' },
  botCard: { background: '#111', padding: '40px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', maxWidth: '600px', width: '100%' },
  qrContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' },
  qrWrapper: { padding: '20px', background: '#fff', borderRadius: '20px', boxShadow: '0 0 40px rgba(0,0,0,0.5)' },
  statusBox: { display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,255,100,0.05)', padding: '20px 40px', borderRadius: '50px', border: '1px solid rgba(0,255,100,0.2)' },
  pulseGreen: { width: '12px', height: '12px', background: '#00ff64', borderRadius: '50%', boxShadow: '0 0 15px #00ff64' },
  loaderBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' },
  toast: { position: 'fixed', bottom: '30px', right: '30px', background: '#1a1a1a', border: '1px solid #333', padding: '15px 25px', borderRadius: '12px', zIndex: 10000, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: '600' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 11000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' },
  confirmBox: { background: '#111', padding: '32px', borderRadius: '24px', width: '380px', textAlign: 'center', border: '1px solid #222', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' },
  iconCircle: { width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(211, 191, 162, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  cancelBtn: { flex: 1, padding: '14px', background: '#222', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: '14px', background: '#d3bfa2', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800' }
};

export default OperatorPortal;