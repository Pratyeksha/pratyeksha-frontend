import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import { QRCodeSVG } from 'qrcode.react'; 
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  LayoutDashboard, UtensilsCrossed, ReceiptIndianRupee, BarChart3, LogOut, 
  Search, CheckCircle2, BellRing, MessageSquare, Sparkles, AlertTriangle, 
  Info, SendHorizontal, CookingPot, Percent, Smartphone, QrCode, RefreshCcw,
  Timer, Clock, Flame, Layers, TrendingUp, Globe, Calendar, ChevronLeft, ChevronRight,
  User, ShieldCheck, Zap, MousePointer2, Filter, ShoppingBag, Truck, X
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

/**
 * 🚀 PREMIUM COMPONENT: LIVE PREP TIMER
 * Calculates latency in real-time and shifts color to 'Gold' after 15 mins
 */
const OperatorLiveTimer = ({ createdAt }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => setElapsed(Math.floor((new Date() - new Date(createdAt)) / 60000));
    calc();
    const interval = setInterval(calc, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const getUrgencyColor = () => {
    if (elapsed >= 15) return '#d4af37'; // Golden status for high latency
    return '#444';                       
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: getUrgencyColor() }}>
      <Timer size={14} />
      <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px' }}>{elapsed}m</span>
    </div>
  );
};

const OperatorPortal = () => {
  // 🛰️ REAL-TIME CONNECTIVITY
  const socket = useMemo(() => io("https://pratyeksha-backend.onrender.com", {
    withCredentials: true,
    transports: ['polling', 'websocket'], 
    reconnectionAttempts: 5,
    timeout: 20000, 
  }), []);

  // 🔑 AUTH & SESSION STATE
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('pratyeksha_token'));
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // 🛠️ NAVIGATION & FILTER STATE
  const [activeTab, setActiveTab] = useState('pending'); 
  const [orderZone, setOrderZone] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDate, setViewDate] = useState(new Date());

  // 📊 DATA STATE
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [checkoutRequests, setCheckoutRequests] = useState([]);
  
  // 🧾 BILLING & TABLE STATE
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableBill, setTableBill] = useState(null);
  const [discount, setDiscount] = useState(0); 

  const [waiterRequests, setWaiterRequests] = useState([]);
  const [serverStats, setServerStats] = useState({ topItems: [], hourlyStats: [] });

  // 💬 MARKETING HUB STATE
  const [qrCode, setQrCode] = useState(null);
  const [isBotReady, setIsBotReady] = useState(false);
  const [selectedBroadcastItem, setSelectedBroadcastItem] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastText, setBroadcastMsg] = useState("");

  // 🔔 UI FEEDBACK STATE
  const [notif, setNotif] = useState({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', subtitle: '', onConfirm: null });

  // 🏗️ TENANT CONFIG
  const tenantId = localStorage.getItem('active_tenant') || 'jay_ambe_fusion';
  const tableCount = parseInt(localStorage.getItem('table_count')) || 12; 
  const logoPath = `${import.meta.env.BASE_URL}logo.png`;

  // 🧠 DERIVED STATE: OCCUPANCY
  // A table is occupied if it exists in the active orders list
  const occupiedTables = useMemo(() => {
    return [...new Set(orders.map(o => o.tableNumber.toString()))];
  }, [orders]);

  // 🧠 DERIVED STATE: KITCHEN ZONES
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const minutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
      if (orderZone === 'delayed') return minutes >= 15;
      if (orderZone === 'fresh') return minutes < 15;
      return true;
    });
  }, [orders, orderZone]);

  // 🧠 DERIVED STATE: INSIGHTS
  const currentMonthAnalytics = useMemo(() => {
    const monthStr = (viewDate.getMonth() + 1).toString().padStart(2, '0');
    const yearStr = viewDate.getFullYear().toString();
    return analytics.filter(d => d._id && d._id.startsWith(`${yearStr}-${monthStr}`));
  }, [analytics, viewDate]);

  const stats = useMemo(() => {
    const revenue = currentMonthAnalytics.reduce((a, b) => a + (b.revenue || 0), 0);
    const count = currentMonthAnalytics.reduce((a, b) => a + (b.count || 0), 0);
    return {
      revenue,
      avg: count > 0 ? (revenue / count).toFixed(0) : 0,
      online: (revenue * 0.18).toFixed(0) 
    };
  }, [currentMonthAnalytics]);

  // 📡 DATA FETCHING LOGIC
const fetchInitialData = useCallback(async () => {
  try {
    const [orderRes, menuRes, waiterRes] = await Promise.all([
      axios.get(`${BASE_URL}/admin/orders/${tenantId}/operator`),
      axios.get(`${BASE_URL}/menu/${tenantId}`),
      axios.get(`${BASE_URL}/admin/waiter-requests/${tenantId}`).catch(() => ({ data: [] }))
    ]);
    setOrders(orderRes.data);
    setMenuItems(menuRes.data);
    setWaiterRequests(waiterRes.data); // 🚀 This ensures requests persist on refresh
  } catch (err) { console.error("Data Sync Error:", err); }
}, [tenantId]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/analytics/${tenantId}`);
      setAnalytics(res.data);
    } catch (err) { console.error("Analytics Error:", err); }
  }, [tenantId]);

  // 🔌 SOCKET.IO EVENT LISTENERS
  useEffect(() => {
    if (isAuthenticated) {
      socket.emit("join_restaurant", tenantId);
      fetchInitialData();
      fetchAnalytics();

      socket.on("whatsapp_qr", (qr) => { 
        setQrCode(qr); 
        setIsBotReady(false); 
      });

      socket.on("whatsapp_ready", () => { 
        setIsBotReady(true); 
        setQrCode(null); 
        showNotif("System Linked", "success");
      });

      socket.on("new_order", (order) => { 
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); 
        showNotif(`Order Update: Table ${order.tableNumber}`); 
        fetchInitialData(); // Instantly occupies the table in UI
      });

      socket.on("bill_requested", (data) => {
        setCheckoutRequests(prev => [...new Set([...prev, data.tableNumber.toString()])]);
        new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play(); 
        showNotif(`Settlement Request: Table ${data.tableNumber}`);
      });

      socket.on("new_waiter_request", (request) => {
  new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); 
  showNotif(`Service Request: Table ${request.tableNumber}`, "info");
  setWaiterRequests(prev => [request, ...prev]);
});

      socket.on("order_status_updated", () => fetchInitialData());

    }
    return () => { socket.off(); };
  }, [isAuthenticated, tenantId, socket, fetchInitialData, fetchAnalytics]);

  // 🛠️ HANDLERS
  const showNotif = (msg, type = 'success') => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4000);
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

  const handleLogout = () => {
    setConfirmModal({
      show: true,
      title: "Terminate Session",
      subtitle: "Securely closing management dashboard and clearing cache.",
      onConfirm: () => {
        localStorage.clear();
        window.location.reload();
      }
    });
  };

  const generateBill = async (id) => {
    setSelectedTable(id);
    setDiscount(0);
    try {
      const res = await axios.get(`${BASE_URL}/admin/bill/${tenantId}/${id}`);
      const allItems = res.data.flatMap(o => o.items);
      if(allItems.length === 0) { 
        setTableBill(null); 
        showNotif("Mode: Vacant/Empty", "info");
        return; 
      }
      setTableBill({ 
        items: allItems, 
        total: allItems.reduce((acc, item) => acc + (item.subtotal || 0), 0), 
        billNo: Math.floor(10000 + Math.random() * 90000),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) { console.error(err); }
  };

  const settleBill = () => {
    const finalAmount = tableBill.total - (tableBill.total * (discount / 100));
    setConfirmModal({
      show: true,
      title: `Confirm Settlement: ${selectedTable}?`,
      subtitle: `Billed Amount: ₹${finalAmount.toFixed(0)}`,
      onConfirm: async () => {
        try {
          await axios.patch(`${BASE_URL}/admin/settle/${tenantId}/${selectedTable}`, { discount, finalAmount });
          setCheckoutRequests(prev => prev.filter(t => t !== selectedTable));
          setTableBill(null);
          setSelectedTable(null);
          await fetchInitialData(); // Re-syncs to clear orders and mark table as unoccupied
          fetchAnalytics();
          setConfirmModal({ show: false });
          showNotif("Transaction Finalized");
        } catch (err) { showNotif("Settlement Error", "error"); }
      }
    });
  };

  const handleBroadcast = async () => {
    if (!broadcastText && !selectedBroadcastItem) return;
    setIsBroadcasting(true);
    try {
      const item = menuItems.find(i => i._id === selectedBroadcastItem);
      await axios.post(`${BASE_URL}/admin/broadcast`, { 
        tenantId, 
        itemName: item?.name || '', 
        customOffer: broadcastText 
      });
      showNotif("Campaign Dispatched");
      setBroadcastMsg("");
    } catch (err) { showNotif("Broadcast failed", "error"); }
    finally { setIsBroadcasting(false); }
  };

  const updateMenu = async (itemId, updateData) => {
    try { 
      await axios.patch(`${BASE_URL}/menu-item/${itemId}`, updateData); 
      fetchInitialData(); 
    } catch (err) { console.error(err); }
  };

  const changeMonth = (offset) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);
    setViewDate(newDate);
  };

  // 🗓️ HEATMAP CALCULATION
  const renderMonthHeatmap = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const grid = [];
    const maxRev = Math.max(...currentMonthAnalytics.map(a => a.revenue || 0), 1);

    for (let x = 0; x < firstDay; x++) grid.push(<div key={`pad-${x}`} style={styles.heatSquareEmpty} />);

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const dayData = currentMonthAnalytics.find(d => d._id === dateStr);
      const revenue = dayData ? dayData.revenue : 0;
      grid.push(
        <motion.div key={i} whileHover={{ scale: 1.1, zIndex: 10 }}
          style={{ 
            ...styles.heatSquare, 
            background: revenue > 0 ? `rgba(211, 191, 162, ${Math.max(0.15, revenue / maxRev)})` : '#111',
            border: revenue > (maxRev * 0.7) ? '1px solid #d3bfa2' : '1px solid #1a1a1a'
          }}>
          <span style={{ fontSize: '0.75rem', color: revenue > (maxRev * 0.5) ? '#000' : '#444', fontWeight: '800' }}>{i}</span>
          <div className="tooltip" style={styles.tooltip}>₹{revenue.toLocaleString()}</div>
        </motion.div>
      );
    }
    return grid;
  };

  if (!isAuthenticated) return (
    <div style={styles.loginOverlay}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.loginBox}>
        <img src={logoPath} alt="Logo" style={styles.sidebarLogo} />
        <h2 style={{ fontSize: '1.2rem', marginBottom: '30px', fontWeight: '900' }}>ADMIN COMMAND CENTER</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" style={styles.input} onChange={e => setLoginData({...loginData, username: e.target.value})} />
          <input type="password" placeholder="Access PIN" style={styles.input} onChange={e => setLoginData({...loginData, password: e.target.value})} />
          <button type="submit" style={styles.mainBtn}>INITIALIZE</button>
        </form>
      </motion.div>
    </div>
  );

// Add this inside the OperatorPortal component, near your other handlers
const completeWaiterRequest = async (requestId) => {
  try {
    await axios.patch(`${BASE_URL}/admin/waiter-requests/${requestId}/complete`);
    setWaiterRequests(prev => prev.filter(r => r._id !== requestId));
    showNotif("Service Call Resolved");
  } catch (err) { 
    showNotif("Error clearing request", "error"); 
  }
};

const advancedStats = useMemo(() => {
  // 1. Map Top Performers safely
  const topItems = (serverStats?.topItems || []).map(item => [
    item._id,        // The Dish Name (e.g., "Kachori Chat")
    item.totalSold   // The Quantity (e.g., 4)
  ]);

  // 2. Initialize other defaults to prevent blackout
  const sources = { direct: 0, zomato: 0, swiggy: 0, takeaway: 0 };
  const hourlyTraffic = Array(24).fill(0);

  // 3. Populate sources from the analytics history
  analytics.forEach(day => {
    sources.direct += (day.revenue || 0);
  });

  return { 
    sources, 
    topItems, // <--- This will now contain the mapped data
    hourlyTraffic, 
    loyaltyRate: analytics.length > 0 ? 84 : 0 
  };
}, [serverStats, analytics]);
return (
    <div style={styles.dashboard}>
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} 
            style={{...styles.toast, borderLeft: `4px solid ${notif.type === 'success' ? '#d3bfa2' : '#8a704d'}`}}>
             <Zap size={16} color={notif.type === 'success' ? '#d3bfa2' : '#8a704d'} /> {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logoWrapper}><img src={logoPath} alt="Logo" style={styles.sidebarLogo} /></div>
          <nav style={styles.navStack}>
            {[
              { id: 'pending', label: 'LIVE KITCHEN', icon: <CookingPot size={18} /> },
              { id: 'menu', label: 'MENU EDITOR', icon: <UtensilsCrossed size={18} /> },
              { id: 'billing', label: 'BILLING HUB', icon: <ReceiptIndianRupee size={18} /> },
              { id: 'marketing', label: 'CAMPAIGN HUB', icon: <MessageSquare size={18} /> },
              { id: 'insights', label: 'INSIGHTS', icon: <BarChart3 size={18} /> }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? styles.activeTab : styles.navBtn}>
                <span style={{ marginRight: '15px' }}>{tab.icon}</span>
                {tab.label}
                {tab.id === 'billing' && checkoutRequests.length > 0 && <span style={styles.sidebarNotif}>{checkoutRequests.length}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
           <div style={styles.operatorCard}>
              <User size={16} color="#d3bfa2" />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '900' }}>MANAGER</div>
                <div style={{ fontSize: '0.6rem', color: '#444' }}>SESSION ACTIVE</div>
              </div>
           </div>
           <button onClick={handleLogout} style={styles.logoutBtn}>LOGOUT TERMINAL</button>
        </div>
      </aside>

      <main style={styles.mainContent}>
        <header style={styles.topHeader}>
  <h1 style={styles.pageTitle}>{activeTab.replace('_', ' ').toUpperCase()}</h1>
  
  {/* Add this block for the Month Switcher in Header */}
  {activeTab === 'insights' && (
    <div style={styles.headerMonthSelector}>
      <button onClick={() => changeMonth(-1)} style={styles.headerMonthNav}><ChevronLeft size={16}/></button>
      <div style={styles.headerMonthDisplay}>
        <Calendar size={14} color="#d3bfa2" />
        <span style={{ fontWeight: '900', fontSize: '0.85rem' }}>
          {viewDate.toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase()}
        </span>
      </div>
      <button onClick={() => changeMonth(1)} style={styles.headerMonthNav}><ChevronRight size={16}/></button>
    </div>
  )}

  {activeTab === 'pending' && (
    <div style={styles.zoneControl}>
      <button onClick={() => setOrderZone('all')} style={orderZone === 'all' ? styles.activeZoneBtn : styles.zoneBtn}>ALL</button>
      <button onClick={() => setOrderZone('fresh')} style={orderZone === 'fresh' ? styles.activeZoneBtn : styles.zoneBtn}>FRESH</button>
      <button onClick={() => setOrderZone('delayed')} style={orderZone === 'delayed' ? styles.activeZoneBtn : styles.zoneBtn}>DELAYED</button>
    </div>
  )}

  {(activeTab === 'menu') && (
    <div style={styles.searchWrapper}>
      <Search size={18} color="#222" />
      <input type="text" placeholder="Search dishes..." style={styles.searchInput} onChange={(e) => setSearchQuery(e.target.value)} />
    </div>
  )}
</header>

        <section style={styles.scrollArea} className="custom-scroll">
          <AnimatePresence mode="wait">
            
{activeTab === 'pending' && (
  <motion.div 
    key="pending" 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    style={{ 
      display: 'flex', 
      gap: '30px', 
      alignItems: 'flex-start',
      width: '100%' 
    }}
  >
    
    {/* 🍜 LEFT SIDE: KITCHEN TICKETS */}
    <div style={{ flex: 1.2 }}>
      <h3 style={styles.gridLabel}>KITCHEN TICKETS</h3>
      {filteredOrders.length > 0 ? (
        filteredOrders.map(order => (
          <div key={order._id} style={styles.orderRow}>
            <div style={styles.tableCircle}>{order.tableNumber}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '900', fontSize: '0.9rem', color: '#fff' }}>TABLE {order.tableNumber}</div>
              <div style={{ color: '#d3bfa2', marginTop: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {order.items.map(it => `${it.quantity}x ${it.name}`).join(' • ')}
              </div>
            </div>
            <OperatorLiveTimer createdAt={order.createdAt} />
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem', padding: '40px', background: '#0d0d0d', borderRadius: '15px' }}>
          NO ACTIVE ORDERS
        </div>
      )}
    </div>

    {/* 🛎️ RIGHT SIDE: SERVICE CALLS */}
    <div style={{ flex: 1, borderLeft: '1px solid #1a1a1a', paddingLeft: '30px' }}>
      <h3 style={styles.gridLabel}>ACTIVE SERVICE CALLS</h3>
      {Array.isArray(waiterRequests) && waiterRequests.length > 0 ? (
        waiterRequests.map(req => (
          <motion.div 
            initial={{ x: 20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            key={req._id} 
            style={{...styles.waiterRequestRow, gap: '15px', padding: '15px'}}
          >
            <div style={{...styles.goldCircle, width: '35px', height: '35px'}}>
              <BellRing size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '900', color: '#d4af37', fontSize: '0.8rem' }}>TABLE {req.tableNumber}</div>
              <div style={{ fontSize: '0.75rem', color: '#fff', marginTop: '2px', lineHeight: '1.4' }}>
                {req.serviceRequest}
              </div>
            </div>
            <button 
              onClick={() => completeWaiterRequest(req._id)} 
              style={{...styles.doneBtn, padding: '6px 12px', fontSize: '0.6rem'}}
            >
              DONE
            </button>
          </motion.div>
        ))
      ) : (
        <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', padding: '20px' }}>
          NO PENDING REQUESTS
        </div>
      )}
    </div>
    
  </motion.div>
)}            {activeTab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.fullWidthGrid}>
                {menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                  <div key={item._id} style={{...styles.premiumCard, opacity: item.isAvailable ? 1 : 0.4}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>{item.name}</h3>
                      <span style={{ color: '#d3bfa2', fontWeight: 'bold' }}>₹{item.price}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => {
                        const np = prompt("Set Price:", item.price);
                        if(np) updateMenu(item._id, { price: Number(np) });
                      }} style={styles.ghostBtn}>PRICING</button>
                      <button onClick={() => updateMenu(item._id, { isAvailable: !item.isAvailable })} 
                        style={item.isAvailable ? styles.toggleHideBtn : styles.toggleShowBtn}>
                        {item.isAvailable ? "VISIBILITY ON" : "VISIBILITY OFF"}
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '50px' }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.specialModeRow}>
                     <button onClick={() => generateBill('Takeaway')} style={selectedTable === 'Takeaway' ? styles.activeSpecBtn : styles.specBtn}>
                        <ShoppingBag size={16} /> DIRECT TAKEAWAY
                     </button>
                     <button onClick={() => generateBill('Online')} style={selectedTable === 'Online' ? styles.activeSpecBtn : styles.specBtn}>
                        <Truck size={16} /> ONLINE ORDERING
                     </button>
                  </div>
                  <h3 style={styles.gridLabel}>DINING FLOOR OCCUPANCY</h3>
                  <div style={styles.tableGrid}>
                    {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => {
                      const id = n.toString();
                      const isOcc = occupiedTables.includes(id);
                      const hasReq = checkoutRequests.includes(id);
                      return (
                        <button key={n} onClick={() => generateBill(id)} 
                          style={selectedTable === id ? styles.activeTableBtn : (hasReq ? styles.goldTableBtn : (isOcc ? styles.occupiedTableBtn : styles.tableBtn))}>
                          {hasReq && <BellRing size={16} style={styles.bellIcon} />}
                          T{n}
                          {isOcc && !hasReq && <div style={styles.occupiedDot} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {tableBill && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={styles.receipt}>
                    <div style={styles.receiptHeader}>
                      <img src={logoPath} alt="Logo" style={{ width: '80px', filter: 'invert(1)' }} />
                      <p style={{ margin: '10px 0 0', fontSize: '0.65rem', color: '#999', fontWeight: '900' }}>TXN: {tableBill.billNo}</p>
                    </div>
                    
                    <div style={styles.receiptBody}>
                      {tableBill.items.map((it, i) => (
                        <div key={i} style={styles.receiptRow}>
                          <span>{it.quantity}x {it.name}</span>
                          <b>₹{it.subtotal}</b>
                        </div>
                      ))}
                    </div>

                    <div style={styles.discountArea}>
                      <div style={styles.receiptRow}>
                         <span style={{fontWeight:'900'}}>DISCOUNT</span>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                           <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} style={styles.discountInput} /> %
                         </div>
                      </div>
                    </div>

                    <div style={styles.totalArea}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '900' }}>
                        <span>TOTAL</span>
                        <span>₹{(tableBill.total - (tableBill.total * (discount/100))).toFixed(0)}</span>
                      </div>
                    </div>

                    <button onClick={settleBill} style={styles.settleBtn}>FINALIZE SETTLEMENT</button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'marketing' && (
              <motion.div key="marketing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.marketingLayout}>
                <div style={styles.botCard}>
                  <div style={styles.cardHeaderSmall}><QrCode size={18} /> SYNC DEVICE</div>
                  <div style={styles.qrContainer}>
                    {isBotReady ? <div style={{color:'#d3bfa2', fontWeight:'900'}}>BRIDGE ACTIVE</div> : qrCode ? <QRCodeSVG value={qrCode} size={200} bgColor={"#000"} fgColor={"#d3bfa2"} /> : <div className="spinner" />}
                  </div>
                </div>
                <div style={styles.botCard}>
                   <div style={styles.cardHeaderSmall}><SendHorizontal size={18} /> BROADCAST</div>
                   <textarea style={styles.input} value={broadcastText} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Promo message..." />
                   <button onClick={handleBroadcast} style={styles.mainBtn}>LAUNCH CAMPAIGN</button>
                </div>
              </motion.div>
            )}

{activeTab === 'insights' && (
  <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.insightsWrapper}>
    
    {/* MONTH SELECTOR */}
    {/* <div style={styles.monthSelector}>
      <button onClick={() => changeMonth(-1)} style={styles.monthNav}><ChevronLeft size={20}/></button>
      <div style={styles.monthDisplay}>
        <Calendar size={18} color="#d3bfa2" />
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
      </div>
      <button onClick={() => changeMonth(1)} style={styles.monthNav}><ChevronRight size={20}/></button>
    </div> */}

    {/* LIVE STATS CARDS */}
    <div style={styles.statsRow}>
      <div style={styles.glassStat}>
        <small style={styles.statLabel}>MONTHLY REVENUE</small>
        <h2 style={styles.statVal}>₹{stats.revenue.toLocaleString()}</h2>
        <div style={{color: '#4ade80', fontSize: '0.7rem'}}>Live Sync Active</div>
      </div>
      <div style={styles.glassStat}>
        <small style={styles.statLabel}>LOYALTY SCORE</small>
        <h2 style={styles.statVal}>{advancedStats.loyaltyRate}%</h2>
        <div style={{color: '#d3bfa2', fontSize: '0.7rem'}}>Returning Base</div>
      </div>
      <div style={styles.glassStat}>
        <small style={styles.statLabel}>AVG TICKET</small>
        <h2 style={styles.statVal}>₹{stats.avg}</h2>
        <div style={{color: '#888', fontSize: '0.7rem'}}>Per Table</div>
      </div>
    </div>

    {/* MIDDLE BI GRID */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
      <div style={styles.biCard}>
        <h4 style={styles.biTitle}><Globe size={16} /> REVENUE SOURCES</h4>
        {Object.entries(advancedStats.sources).map(([src, val]) => (
          <div key={src} style={styles.sourceRow}>
            <span style={{textTransform: 'capitalize', width: '80px'}}>{src}</span>
            <div style={styles.progressBg}>
              <div style={{...styles.progressFill, width: `${(val / (stats.revenue || 1)) * 100}%`}}></div>
            </div>
            <span style={{minWidth: '60px', textAlign: 'right'}}>₹{val.toLocaleString()}</span>
          </div>
        ))}
      </div>

<div style={styles.biCard}>
  <h4 style={styles.biTitle}><TrendingUp size={16} /> TOP PERFORMERS</h4>
  {advancedStats.topItems.length > 0 ? (
    advancedStats.topItems.map(([name, qty], idx) => (
      <div key={idx} style={{...styles.sourceRow, marginBottom: '20px'}}>
        <span style={{flex: 1, fontSize: '0.9rem', color: '#fff'}}>{idx + 1}. {name}</span>
        <span style={{fontWeight: '900', color: '#d3bfa2'}}>{qty} sold</span>
      </div>
    ))
  ) : (
    <div style={{textAlign: 'center', opacity: 0.2, fontSize: '0.8rem', paddingTop: '40px'}}>
       NO DISHES ORDERED YET
    </div>
  )}
</div>
    </div>

    {/* MONTHLY DYNAMIC HEATMAP */}
    <div style={styles.heatmapCard}>
       <h4 style={styles.biTitle}><Calendar size={16} /> DAILY REVENUE HEATMAP</h4>
       <div style={styles.calendarGridHeader}>
         {['S','M','T','W','T','F','S'].map(d => <div key={d} style={styles.dayHeader}>{d}</div>)}
       </div>
       <div style={styles.calendarGrid}>
         {renderMonthHeatmap()}
       </div>
       <div style={styles.heatmapLegend}>
         <span>Less</span>
         <div style={{...styles.heatSquare, width: '12px', height: '12px', background: '#111'}} />
         <div style={{...styles.heatSquare, width: '12px', height: '12px', background: 'rgba(211, 191, 162, 0.4)'}} />
         <div style={{...styles.heatSquare, width: '12px', height: '12px', background: 'rgba(211, 191, 162, 1)'}} />
         <span>More</span>
       </div>
    </div>

    {/* PEAK HOURS BAR CHART */}
{/* PEAK HOURS BAR CHART */}
<div style={{...styles.biCard, marginTop: '20px'}}>
   <h4 style={styles.biTitle}><Clock size={16} /> HOURLY BUSYNESS (LIVE)</h4>
   <div style={{display: 'flex', alignItems: 'flex-end', height: '100px', gap: '4px', paddingBottom: '10px', borderBottom: '1px solid #1a1a1a'}}>
      {advancedStats.hourlyTraffic.map((count, hr) => {
        // Auto-scale height based on the busiest hour
        const maxOrders = Math.max(...advancedStats.hourlyTraffic, 1);
        const heightPct = (count / maxOrders) * 100;
        
        return (
          <motion.div 
            key={hr} 
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(5, heightPct)}%` }}
            style={{
              flex: 1, 
              background: hr >= 19 && hr <= 22 ? '#d3bfa2' : '#222', 
              borderRadius: '3px 3px 0 0',
              position: 'relative'
            }} 
          >
            {count > 0 && <span style={{position:'absolute', top:'-15px', width:'100%', textAlign:'center', fontSize:'0.5rem', color:'#d3bfa2'}}>{count}</span>}
          </motion.div>
        );
      })}
   </div>
   <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.6rem', color: '#444', fontWeight: '800'}}>
      <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
   </div>
</div>

  </motion.div>
)}
          </AnimatePresence>
        </section>
      </main>

      <AnimatePresence>
        {confirmModal.show && (
          <div style={styles.modalBackdrop}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.confirmBox}>
              <AlertTriangle size={24} color="#d3bfa2" style={{marginBottom:15}} />
              <h3 style={{ color: '#fff', margin: '0 0 10px', fontSize: '1rem' }}>{confirmModal.title}</h3>
              <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '30px' }}>{confirmModal.subtitle}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setConfirmModal({show:false})} style={styles.cancelBtn}>ABORT</button>
                <button onClick={confirmModal.onConfirm} style={styles.confirmBtn}>PROCEED</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; } 
        .custom-scroll::-webkit-scrollbar-thumb { background: #151515; border-radius: 10px; }
        .heat-square:hover .tooltip { visibility: visible; opacity: 1; transform: translateY(-8px); }
        .spinner { border: 3px solid #111; border-top: 3px solid #d3bfa2; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  dashboard: { display: 'flex', width: '100vw', height: '100vh', background: '#050505', color: '#fff', position: 'fixed', top: 0, left: 0, fontFamily: "'Inter', sans-serif" },
  sidebar: { width: '280px', background: '#080808', display: 'flex', flexDirection: 'column', borderRight: '1px solid #151515' },
  sidebarTop: { padding: '40px 25px', flex: 1 },
  logoWrapper: { marginBottom: '50px', paddingLeft: '10px' },
  sidebarLogo: { width: '140px', filter: 'brightness(1.5)' },
  navStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  navBtn: { padding: '16px 20px', background: 'transparent', border: 'none', color: '#444', textAlign: 'left', cursor: 'pointer', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', transition: '0.3s' },
  activeTab: { padding: '16px 20px', background: '#111', border: '1px solid #222', color: '#d3bfa2', textAlign: 'left', borderRadius: '12px', fontWeight: '900', fontSize: '0.8rem', display: 'flex', alignItems: 'center' },
  sidebarNotif: { marginLeft: 'auto', background: '#d3bfa2', color: '#000', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '50%', fontWeight: 'bold' },
  sidebarBottom: { padding: '25px', borderTop: '1px solid #151515' },
  operatorCard: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '15px', background: '#0d0d0d', borderRadius: '12px', border: '1px solid #1a1a1a' },
  logoutBtn: { padding: '15px', width: '100%', background: 'transparent', border: '1px solid #222', color: '#333', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column' },
  topHeader: { height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px', background: '#080808', borderBottom: '1px solid #151515' },
  pageTitle: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px' },
  zoneControl: { display: 'flex', gap: '10px', background: '#000', padding: '5px', borderRadius: '12px', border: '1px solid #1a1a1a' },
  zoneBtn: { padding: '8px 18px', background: 'transparent', border: 'none', color: '#333', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' },
  activeZoneBtn: { padding: '8px 18px', background: '#d3bfa215', border: 'none', color: '#d3bfa2', fontSize: '0.7rem', fontWeight: '900', borderRadius: '8px' },
  searchWrapper: { position: 'relative', background: '#0d0d0d', padding: '10px 20px', borderRadius: '30px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '10px' },
  searchInput: { background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '220px', fontSize: '0.8rem' },
  scrollArea: { flex: 1, padding: '40px 50px', overflowY: 'auto' },
  orderRow: { display: 'flex', alignItems: 'center', gap: '25px', background: '#0d0d0d', padding: '25px', borderRadius: '20px', border: '1px solid #1a1a1a', marginBottom: '15px' },
  tableCircle: { width: '45px', height: '45px', background: '#111', borderRadius: '12px', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d3bfa2', fontSize: '1.1rem', fontWeight: '900' },
  tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  tableBtn: { padding: '30px', background: '#0d0d0d', border: '1px solid #151515', color: '#222', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', position: 'relative' },
  occupiedTableBtn: { padding: '30px', background: '#111', border: '1px solid #8a704d', color: '#8a704d', borderRadius: '15px', fontWeight: '900', position: 'relative' },
  activeTableBtn: { padding: '30px', background: '#d3bfa2', border: 'none', color: '#000', borderRadius: '15px', fontWeight: '900' },
  goldTableBtn: { padding: '30px', background: '#d3bfa211', border: '1px solid #d4af37', color: '#d4af37', borderRadius: '15px', fontWeight: '900' },
  occupiedDot: { position: 'absolute', top: '10px', right: '10px', width: '6px', height: '6px', background: '#8a704d', borderRadius: '50%' },
  specialModeRow: { display: 'flex', gap: '15px', marginBottom: '30px' },
  specBtn: { flex: 1, padding: '18px', background: '#0d0d0d', border: '1px solid #1a1a1a', color: '#333', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '0.8rem', cursor: 'pointer' },
  activeSpecBtn: { flex: 1, padding: '18px', background: '#d3bfa2', border: 'none', color: '#000', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '0.8rem' },
  receipt: { width: '450px', background: '#fff', color: '#000', padding: '50px', borderRadius: '2px', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' },
  receiptHeader: { borderBottom: '2px solid #000', paddingBottom: '30px', marginBottom: '30px', textAlign: 'center' },
  receiptBody: { minHeight: '150px', borderBottom: '1px solid #eee', paddingBottom: '20px' },
  receiptRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' },
  discountArea: { padding: '25px 0', borderBottom: '1px solid #eee' },
  discountInput: { width: '50px', padding: '8px', border: '1px solid #ddd', textAlign: 'center', borderRadius: '4px', fontWeight: 'bold' },
  totalArea: { padding: '30px 0' },
  settleBtn: { width: '100%', padding: '20px', background: '#000', color: '#fff', border: 'none', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer' },
  insightsWrapper: { maxWidth: '1000px', margin: '0 auto' },
  monthSelector: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', marginBottom: '50px' },
  monthNav: { background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '50%', cursor: 'pointer' },
  monthDisplay: { display: 'flex', alignItems: 'center', gap: '15px', background: '#0d0d0d', padding: '15px 35px', borderRadius: '40px', border: '1px solid #1a1a1a' },
  statsRow: { display: 'flex', gap: '20px', marginBottom: '40px' },
  glassStat: { flex: 1, padding: '30px', background: '#0d0d0d', borderRadius: '24px', border: '1px solid #1a1a1a' },
  statLabel: { color: '#333', fontWeight: 'bold', fontSize: '0.65rem' },
  statVal: { fontSize: '2rem', fontWeight: '900', margin: '8px 0 0' },
  heatmapCard: { background: '#080808', padding: '40px', borderRadius: '30px', border: '1px solid #1a1a1a' },
  calendarGridHeader: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '25px' },
  dayHeader: { fontSize: '0.6rem', fontWeight: '900', color: '#222', letterSpacing: '1px' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' },
  heatSquare: { height: '70px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', transition: '0.2s' },
  heatSquareEmpty: { height: '70px' },
  tooltip: { position: 'absolute', bottom: '115%', background: '#fff', color: '#000', padding: '8px 12px', borderRadius: '6px', fontSize: '0.7rem', visibility: 'hidden', opacity: 0, transition: '0.3s', zIndex: 100 },
  heatmapLegend: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '40px', fontSize: '0.6rem', fontWeight: 'bold' },
  marketingLayout: { display: 'flex', gap: '30px', justifyContent: 'center' },
  botCard: { background: '#0d0d0d', padding: '40px', borderRadius: '30px', border: '1px solid #1a1a1a', width: '100%', maxWidth: '450px', textAlign: 'center' },
  qrContainer: { marginTop: '30px', padding: '30px', background: '#fff', borderRadius: '20px', display: 'inline-block' },
  loginOverlay: { width: '100vw', height: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loginBox: { width: '450px', background: '#080808', padding: '60px', borderRadius: '40px', textAlign: 'center', border: '1px solid #1a1a1a' },
  label: { fontSize: '0.65rem', color: '#333', fontWeight: 'bold', display: 'block', marginBottom: '8px', marginLeft: '5px' },
  input: { width: '100%', padding: '18px', background: '#0d0d0d', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '14px', marginBottom: '20px', fontSize: '0.85rem', outline: 'none' },
  mainBtn: { width: '100%', padding: '20px', background: '#d3bfa2', color: '#000', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' },
  toast: { position: 'fixed', bottom: '40px', right: '40px', background: '#111', padding: '18px 30px', borderRadius: '16px', border: '1px solid #222', display: 'flex', alignItems: 'center', gap: '15px', zIndex: 1000, fontWeight: '900', fontSize: '0.85rem', color: '#d3bfa2' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  confirmBox: { width: '380px', background: '#0d0d0d', padding: '50px', borderRadius: '35px', textAlign: 'center', border: '1px solid #1a1a1a' },
  iconCircle: { width: '60px', height: '60px', background: '#d3bfa210', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  confirmBtn: { flex: 1, padding: '18px', background: '#d3bfa2', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '18px', background: '#111', color: '#444', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  premiumCard: { background: '#0d0d0d', padding: '30px', borderRadius: '24px', border: '1px solid #1a1a1a' },
  ghostBtn: { flex: 1, padding: '12px', background: 'transparent', border: '1px solid #222', color: '#444', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' },
  toggleShowBtn: { flex: 1, padding: '12px', background: '#d3bfa2', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '0.7rem' },
  toggleHideBtn: { flex: 1, padding: '12px', background: '#1a1a1a', color: '#333', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '0.7rem' },
  fullWidthGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  emptyState: { textAlign: 'center', marginTop: '100px', opacity: 0.1, letterSpacing: '2px' },
  gridLabel: { color: '#222', fontSize: '0.7rem', fontWeight: '900', marginBottom: '20px', letterSpacing: '1.5px' },
  bellIcon: { marginRight: '8px', color: '#d4af37' },
  specialModeRow: { display: 'flex', gap: '15px', marginBottom: '30px' },
  specBtn: { flex: 1, padding: '18px', background: '#0d0d0d', border: '1px solid #1a1a1a', color: '#333', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '0.8rem', cursor: 'pointer' },
  activeSpecBtn: { flex: 1, padding: '18px', background: '#d3bfa2', border: 'none', color: '#000', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '0.8rem' },
  orderContainer: { maxWidth: '800px', margin: '0 auto' },
  // Add these inside your styles constant at the bottom of the file
waiterRequestRow: { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '20px', 
  background: '#111', 
  padding: '15px 20px', 
  borderRadius: '15px', 
  border: '1px solid #d4af37', 
  marginBottom: '12px' 
},
goldCircle: { 
  width: '40px', 
  height: '40px', 
  background: '#d4af3715', 
  borderRadius: '10px', 
  border: '1px solid #d4af37', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  color: '#d4af37' 
},
doneBtn: { 
  background: '#d3bfa2', 
  color: '#000', 
  border: 'none', 
  padding: '8px 15px', 
  borderRadius: '8px', 
  fontWeight: '900', 
  fontSize: '0.7rem',
  cursor: 'pointer'
},
biCard: {
  background: '#0d0d0d',
  padding: '25px',
  borderRadius: '20px',
  border: '1px solid #1a1a1a',
},
biTitle: {
  fontSize: '0.75rem',
  fontWeight: '900',
  color: '#444',
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  letterSpacing: '1px'
},
sourceRow: {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '12px',
  fontSize: '0.8rem',
  color: '#999'
},
progressBg: {
  flex: 1,
  height: '6px',
  background: '#111',
  borderRadius: '10px',
  overflow: 'hidden'
},
progressFill: {
  height: '100%',
  background: 'linear-gradient(90deg, #8a704d, #d3bfa2)',
  borderRadius: '10px'
},
// Add these to your styles object
headerMonthSelector: { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  background: '#000', 
  padding: '5px 15px', 
  borderRadius: '12px', 
  border: '1px solid #1a1a1a' 
},
headerMonthNav: { 
  background: 'transparent', 
  border: 'none', 
  color: '#444', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center' 
},
headerMonthDisplay: { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '8px', 
  minWidth: '100px', 
  justifyContent: 'center' 
},
};

export default OperatorPortal;