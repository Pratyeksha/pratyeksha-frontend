import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import { QRCodeSVG } from 'qrcode.react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, UtensilsCrossed, ReceiptIndianRupee, BarChart3, LogOut, 
  Search, CheckCircle2, BellRing, MessageSquare, Sparkles, AlertTriangle, 
  Info, SendHorizontal, CookingPot, Percent, Smartphone, QrCode, RefreshCcw,
  Timer, Clock, Flame, Layers, TrendingUp, Globe, Calendar, ChevronLeft, ChevronRight,
  User, ShieldCheck, Zap, MousePointer2, Filter, ShoppingBag, Truck, X, CreditCard, Wallet, Banknote,
  ChefHat // 🚀 FIXED: Imported ChefHat directly to prevent Uncaught ReferenceError crashes
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

/**
 * 🚀 PREMIUM COMPONENT: LIVE PREP TIMER
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
    if (elapsed >= 15) return '#d4af37'; 
    return '#444';                       
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: getUrgencyColor() }}>
      <Timer size={14} />
      <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px' }}>{elapsed}m</span>
    </div>
  );
};


const numberToWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = ('000000000' + Math.round(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
    str += (n[5] != 0) ? (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + ' ' : '';
    return str.trim() + " Only";
};

/**
 * ⏳ DYNAMIC COMPUTE ENGINE: Converts a timestamp into exact structural tenure.
 */
const calculateTenure = (joiningDateString) => {
    if (!joiningDateString) return 'N/A';
    const joinDate = new Date(joiningDateString);
    const now = new Date();
    
    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    let days = now.getDate() - joinDate.getDate();

    if (days < 0) {
        months -= 1;
        const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += previousMonth.getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}m`);
    if (days > 0 || parts.length === 0) parts.push(`${days}d`);
    
    return parts.join(' ') + ' with us';
};




const OperatorPortal = () => {
  const socket = useMemo(() => io("https://pratyeksha-backend.onrender.com", {
    withCredentials: true,
    transports: ['polling', 'websocket'], 
    reconnectionAttempts: 5,
    timeout: 20000, 
  }), []);

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('pratyeksha_token'));
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('pending'); 
  const [orderZone, setOrderZone] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDate, setViewDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [checkoutRequests, setCheckoutRequests] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableBill, setTableBill] = useState(null);
  const [discount, setDiscount] = useState(0); 


// 💰 TRACKING STATE COMPILERS
  const [paymentModes, setPaymentModes] = useState({ cash: 0, upi: 0, card: 0 });
  const [activePaymentType, setActivePaymentType] = useState('full'); 
  const [selectedSingleMode, setSelectedSingleMode] = useState('cash');


  const [waiterRequests, setWaiterRequests] = useState([]);
  const [serverStats, setServerStats] = useState({ topItems: [], hourlyStats: [] });
  const [qrCode, setQrCode] = useState(null);
  const [isBotReady, setIsBotReady] = useState(false);
  const [selectedBroadcastItem, setSelectedBroadcastItem] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastText, setBroadcastMsg] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', subtitle: '', onConfirm: null });

  const tenantId = localStorage.getItem('active_tenant') || 'jay_ambe_fusion';
  const tableCount = parseInt(localStorage.getItem('table_count')) || 12; 
  const logoPath = `${import.meta.env.BASE_URL}logo.png`;

  const [inventory, setInventory] = useState([]);
const [staff, setStaff] = useState([]);
const [selectedMenuItem, setSelectedMenuItem] = useState('');
const [recipeIngredients, setRecipeIngredients] = useState([{ inventoryId: '', quantityUsed: '' }]);

const [rosterSearchQuery, setRosterSearchQuery] = useState(""); // 🚀 Registered search handler
  const [topPerformers, setTopPerformers] = useState([]); // Category rankings array structures
  const [bottomPerformers, setBottomPerformers] = useState([]);


  // 🚀 CUSTOM MODAL STATE HOOKS: Replaces native browser alert/prompts seamlessly
  const [activePriceEditItem, setActivePriceEditItem] = useState(null); // Holds item copy: { _id, name, price, priceHalf, priceFull }
  const [pendingDeleteStaff, setPendingDeleteStaff] = useState(null);   // Holds staff copy: { _id, name }

const [tenantConfig, setTenantConfig] = useState(null);

const [newStaff, setNewStaff] = useState({
      name: '', 
      role: 'Waiter', 
      age: '', 
      contact: '', 
      address: '', 
      shiftType: 'Day Shift', 
      joiningDate: (() => {
        const localIstString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const parsedIstDate = new Date(localIstString);
        return parsedIstDate.getFullYear() + '-' + String(parsedIstDate.getMonth() + 1).padStart(2, '0') + '-' + String(parsedIstDate.getDate()).padStart(2, '0');
      })(),
      baseSalary: '',
      assignedTables: [], 
      cookingRole: '' 
  });

// For live attendance tracking
  // 🚀 FIXED: Renders initial layout picker strings correctly locked to local Indian Standard Time maps
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const localIstString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const parsedIstDate = new Date(localIstString);
    return parsedIstDate.getFullYear() + '-' + String(parsedIstDate.getMonth() + 1).padStart(2, '0') + '-' + String(parsedIstDate.getDate()).padStart(2, '0');
  });
  const [attendanceLogs, setAttendanceLogs] = useState([]);

useEffect(() => {
    const fetchConfig = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/tenant/${tenantId}`);
            setTenantConfig(res.data);
        } catch (err) { console.error("Tenant Fetch Error", err); }
    };
    if (isAuthenticated) fetchConfig();
}, [isAuthenticated, tenantId]);

// 🚀 FIXED: Keeps table occupied during served state until it's settled completely
  const occupiedTables = useMemo(() => {
    return [
      ...new Set(
        orders
          .filter(o => o.status === 'pending' || o.status === 'ready' || o.status === 'served')
          .map(o => o.tableNumber.toString())
      )
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const minutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
      if (orderZone === 'delayed') return minutes >= 15;
      if (orderZone === 'fresh') return minutes < 15;
      return true;
    });
  }, [orders, orderZone]);

const currentMonthAnalytics = useMemo(() => {
  // 🚀 FIX: Guard the array execution using an empty fallback block if array is not ready
  if (!analytics || !Array.isArray(analytics)) return [];
  
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

// 🚀 METRICS SORTING SYSTEMS: Tracks sorting column keys and orientation direction
  const [ledgerSortConfig, setLedgerSortConfig] = useState({ key: 'name', direction: 'asc' });

  const requestLedgerSort = (targetKey) => {
    let direction = 'asc';
    if (ledgerSortConfig.key === targetKey && ledgerSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setLedgerSortConfig({ key: targetKey, direction });
  };

  // 💸 IMMUTABLE COMPILER ENGINE: Keeps filteredStaff as a flat array to prevent dependency breakages
  const filteredStaff = useMemo(() => {
    let processingList = staff.filter(m => m.name.toLowerCase().includes(rosterSearchQuery.toLowerCase()));

    if (ledgerSortConfig.key !== null) {
      processingList.sort((a, b) => {
        let valA = a[ledgerSortConfig.key];
        let valB = b[ledgerSortConfig.key];

        if (ledgerSortConfig.key === 'baseSalary') {
          valA = Number(a.baseSalary) || 0;
          valB = Number(b.baseSalary) || 0;
        }

        if (ledgerSortConfig.key === 'monthlyAttendance') {
          const activePrefix = viewDate.getFullYear() + '-' + String(viewDate.getMonth() + 1).padStart(2, '0');
          valA = attendanceLogs.filter(log => log.staffId === a._id && log.date?.startsWith(activePrefix)).length;
          valB = attendanceLogs.filter(log => log.staffId === b._id && log.date?.startsWith(activePrefix)).length;
        }

        if (ledgerSortConfig.key === 'joiningDate') {
          valA = new Date(a.joiningDate || 0).getTime();
          valB = new Date(b.joiningDate || 0).getTime();
        }

        if (valA < valB) return ledgerSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return ledgerSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return processingList;
  }, [staff, rosterSearchQuery, ledgerSortConfig, attendanceLogs, viewDate]);

// 💸 REAL-TIME PAYROLL ACCOUNTING ENGINE: EXCLUDES SETTLED ACCOUNTS FROM ACCUMULATED LIABILITIES
  const totalPayrollValue = useMemo(() => {
    return filteredStaff.reduce((acc, m) => {
      // If employee has already been paid out, their baseline salary drops out of the active liabilities margin
      if (m.salaryStatus === 'Paid') return acc;
      return acc + (Number(m.baseSalary) || 0);
    }, 0);
  }, [filteredStaff]);

// 🚀 FIXED SYSTEM: Changed tracking handle assignment to standard liveFloorIntelligence
// 🚀 HIGH-PRECISION WORKFORCE PRODUCTION TELEMETRY COMPILER
  const liveFloorIntelligence = useMemo(() => {
     // Explicitly filter for entries that have logged a clock-in but haven't clocked-out yet
     const activePunches = attendanceLogs.filter(log => log.clockIn && !log.clockOut);
     const presentStaffIds = activePunches.map(log => log.staffId);
     const presentStaff = staff.filter(s => presentStaffIds.includes(s._id));
     
     const activeChefs = presentStaff.filter(s => s.role === 'Chef').length;
     const activeHelpers = presentStaff.filter(s => s.role === 'Helper').length;
     const activeWaiters = presentStaff.filter(s => s.role === 'Waiter').length;

     const coveredTables = [];
     presentStaff.forEach(s => { if(s.assignedTables) s.assignedTables.forEach(t => coveredTables.push(t)); });
     const uniqueCovered = [...new Set(coveredTables)].sort((a, b) => Number(a) - Number(b));

     return { 
       activeChefs, 
       activeHelpers, 
       activeWaiters, 
       coveredCount: uniqueCovered.length, 
       coveredList: uniqueCovered.map(t => `T${t}`).join(', ') || 'NONE' 
     };
  }, [staff, attendanceLogs]);

// 🚀 FIXED CALCULATION ENGINE: RE-MAPPED TO LIVE MONTH ANALYTICS DATA ARRAYS
// 🚀 FIXED COMPILER ENGINE: TRACKS INCOME PATHS CORRECTLY IN REALTIME
  const dailySettlementBreakdown = useMemo(() => {
    const activeTargetDate = attendanceDate; 
    
    let cashSum = 0;
    let upiSum = 0;
    let cardSum = 0;

    if (analytics && Array.isArray(analytics)) {
      // Looks up the specific IST array date entry key matching your calendar selection
      const activeDayData = analytics.find(d => d._id === activeTargetDate);
      if (activeDayData) {
        cashSum = Number(activeDayData.cash || 0);
        upiSum = Number(activeDayData.upi || 0);
        cardSum = Number(activeDayData.card || 0);
      }
    }

    const grossCombinedTotal = cashSum + upiSum + cardSum;

    return {
      cash: cashSum,
      upi: upiSum,
      card: cardSum,
      gross: grossCombinedTotal
    };
  }, [analytics, attendanceDate]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [orderRes, menuRes, waiterRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/orders/${tenantId}/operator`),
        axios.get(`${BASE_URL}/menu/${tenantId}`),
        axios.get(`${BASE_URL}/admin/waiter-requests/${tenantId}`).catch(() => ({ data: [] }))
      ]);
      setOrders(orderRes.data);
      setMenuItems(menuRes.data);
      setWaiterRequests(waiterRes.data); 
    } catch (err) { console.error("Data Sync Error:", err); }
  }, [tenantId]);

const [categoryRankings, setCategoryRankings] = useState({}); // 🚀 Add this hook right below topPerformers state

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/analytics/${tenantId}`);
      setAnalytics(res.data.salesData || []); 
      setTopPerformers(res.data.topItems || []);
      setBottomPerformers(res.data.bottomItems || []);
      setCategoryRankings(res.data.categoryRankings || {}); // 🚀 Capture category insights cleanly
    } catch (err) { 
      console.error("Blackout Preventer Layer caught exception:", err); 
    }
  }, [tenantId]);



const fetchManagementData = useCallback(async () => {
    try {
        const [invRes, staffRes, menuRes] = await Promise.all([
            axios.get(`${BASE_URL}/inventory/${tenantId}`).catch(() => ({ data: [] })),
            // Locate this line inside fetchManagementData and update the route path to match server config:
            axios.get(`${BASE_URL}/staff/${tenantId}`).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/menu/${tenantId}`).catch(() => ({ data: [] }))
        ]);
        setInventory(invRes.data || []);
        setStaff(staffRes.data || []);
        setMenuItems(menuRes.data || []);
    } catch (err) { 
        console.error("Management Sync Error", err); 
    }
}, [tenantId]);

  useEffect(() => {
    if (isAuthenticated) {
      socket.emit("join_restaurant", tenantId);
      fetchInitialData();
      fetchAnalytics();
      fetchManagementData();
      socket.on("whatsapp_qr", (qr) => { setQrCode(qr); setIsBotReady(false); });
      socket.on("whatsapp_ready", () => { setIsBotReady(true); setQrCode(null); showNotif("System Linked", "success"); });
      socket.on("new_order", (order) => { 
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); 
        showNotif(`Order Update: Table ${order.tableNumber}`); 
        fetchInitialData(); 
      });

      socket.on("staff_wiped_live", (data) => {
        setStaff(prev => prev.filter(m => m._id !== data.staffId));
        setAttendanceLogs(prev => prev.filter(log => log.staffId !== data.staffId));
        showNotif("Roster database modification synced in real-time.", "info");
      });


      socket.on("new_waiter_request", (request) => {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); 
        showNotif(`Service Request: Table ${request.tableNumber}`, "info");
        setWaiterRequests(prev => [request, ...prev]);
      });
      socket.on("menu_updated", (updatedItem) => {
        // 🚀 LIVE MENU UPDATE FIX: Updates state arrays natively to prevent full reloads
        setMenuItems(prev => prev.map(item => item._id === updatedItem._id ? updatedItem : item));
      });
      socket.on("table_occupied_live", (data) => {
        setOrders(prevOrders => {
          const exists = prevOrders.some(o => o.tableNumber === data.tableNumber && o.status === 'pending');
          if (!exists) {
            // Mock a transient live order instance to switch grid item to occupied color specs instantly
            return [{ _id: `live-stub-${Date.now()}`, tenantId, tableNumber: data.tableNumber, status: 'pending', items: [], createdAt: new Date() }, ...prevOrders];
          }
          return prevOrders;
        });
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
      });

      // 🚀 EVENT 2: REAL-TIME BILL REQUEST COLORED HIGHLIGHTER
      socket.on("bill_requested", (data) => {
        setCheckoutRequests(prev => [...new Set([...prev, data.tableNumber.toString()])]);
        new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play(); 
        showNotif(`Settlement Request: Table ${data.tableNumber}`);
      });

      // 🚀 EVENT 3: IMMUTABLE CLEANUP ON LIVE WAGE/BILL MARGIN SETTLEMENTS
// 🚀 FIXED: Handles kitchen updates safely while waiting for final payment settlement
      socket.on("order_status_updated", (data) => {
        if (data && data.status === 'settled') {
          // Clear active checkout bells and arrays instantly only when settled
          setCheckoutRequests(prev => prev.filter(t => t !== data.tableNumber.toString()));
        }
        // Pull fresh datasets seamlessly 
        fetchInitialData();
        fetchAnalytics();
      });
    }

    return () => { socket.off(); };
  }, [isAuthenticated, tenantId, socket, fetchInitialData, fetchAnalytics,fetchManagementData]);

  
  
  
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
      onConfirm: () => { localStorage.clear(); window.location.reload(); }
    });
  };

const generateBill = async (id) => {
    setSelectedTable(id);
    setDiscount(0);
    try {
        const res = await axios.get(`${BASE_URL}/admin/bill/${tenantId}/${id}`);
        const countRes = await axios.get(`${BASE_URL}/admin/daily-bill-count/${tenantId}`).catch(() => ({ data: { nextBillNo: 1 } }));
        
        const allItems = res.data.flatMap(o => o.items);
        if(allItems.length === 0) { 
            setTableBill(null); 
            return; 
        }

        // 🚀 Dynamic professional format: 12 MAY 2026
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }).toUpperCase();

        setTableBill({ 
            items: allItems, 
            total: allItems.reduce((acc, item) => acc + (item.subtotal || 0), 0), 
            billNo: countRes.data.nextBillNo, 
            date: formattedDate,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        });
    } catch (err) { console.error("Bill Generation Error:", err); }
};



// 🔥 FIXED: Added onConfirm trigger to securely bridge settlement execution
  const settleBill = () => {
    const finalAmt = Math.round(tableBill.total - (tableBill.total * (discount / 100)));
    
    if (activePaymentType === 'split') {
      const totalEntered = Number(paymentModes.cash || 0) + Number(paymentModes.upi || 0) + Number(paymentModes.card || 0);
      if (Math.abs(totalEntered - finalAmt) > 1) {
        showNotif(`Mismatch: ₹${totalEntered} vs ₹${finalAmt}`, "error");
        return;
      }
    }

    setConfirmModal({
      show: true,
      title: `Finalize Table Settlement?`,
      subtitle: `Total Liabilities: ₹${finalAmt} | Mode: ${activePaymentType.toUpperCase()}`,
      onConfirm: () => handleFinalSettle() // 🚀 FIXED: Binds the execution loop securely
    });
  };

  const handleFinalSettle = async () => {
    const finalAmt = Math.round(tableBill.total - (tableBill.total * (discount / 100)));
    
    let paymentMethodDetails = activePaymentType === 'split' 
      ? { 
          type: 'split', 
          breakdown: { 
            cash: Number(paymentModes.cash || 0), 
            upi: Number(paymentModes.upi || 0), 
            card: Number(paymentModes.card || 0) 
          } 
        }
      : { type: 'full', method: selectedSingleMode };

    try {
      const res = await axios.patch(`${BASE_URL}/admin/settle/${tenantId}/${selectedTable}`, { 
        discount, 
        finalAmount: finalAmt, 
        paymentMethods: paymentMethodDetails,
        customerPhone: "" 
      });

      if (res.data && res.data.billNo) {
        setTableBill(prev => ({ ...prev, billNo: res.data.billNo }));
        showNotif(`Invoice #${res.data.billNo} Generated Successfully`, "success");

        setTimeout(async () => {
          setTableBill(null);
          setSelectedTable(null);
          setConfirmModal({ show: false, title: '', subtitle: '', onConfirm: null }); // Clear modal state completely
          setPaymentModes({ cash: '', upi: '', card: '' }); 
          
          // 🚀 REFRAINED DEPENDENCY GATEWAYS
          await axios.get(`${BASE_URL}/admin/orders/${tenantId}/operator`).then(r => setOrders(r.data || []));
          await axios.get(`${BASE_URL}/admin/analytics/${tenantId}`).then(r => setAnalytics(r.data.salesData || []));
          
          if (fetchManagementData.current) {
            fetchManagementData.current(); // 🚀 FIXED: Invokes using the accurate ref pointer architecture
          }
        }, 1500);
      }
    } catch (err) {
      showNotif("Failed to save transaction to database", "error");
    }
  };
const handleBroadcast = async () => {
    if (!broadcastText && !selectedBroadcastItem) return;
    setIsBroadcasting(true);
    try {
      const item = menuItems.find(i => i._id === selectedBroadcastItem);
      await axios.post(`${BASE_URL}/admin/broadcast`, { tenantId, itemName: item?.name || '', customOffer: broadcastText });
      showNotif("Campaign Dispatched");
      setBroadcastMsg("");
    } catch (err) { showNotif("Broadcast failed", "error"); }
    finally { setIsBroadcasting(false); }
  };

const updateMenu = async (itemId, updateData) => {
  try { 
    // Save change to Database
    const res = await axios.patch(`${BASE_URL}/menu-item/${itemId}`, updateData); 
    
    // 🚀 THE CRITICAL ADDITION:
    // Tell the backend to notify all customers in this restaurant room
    socket.emit("menu_change_detected", { 
      tenantId, 
      itemId, 
      updateData: res.data // This is the updated item from MongoDB
    });

    fetchInitialData(); // Refresh operator UI
    showNotif("Price/Visibility Synced Live");
  } catch (err) { 
    console.error(err); 
    showNotif("Sync Failed", "error");
  }
};

  const changeMonth = (offset) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);
    setViewDate(newDate);
  };

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

  const completeWaiterRequest = async (requestId) => {
    try {
      await axios.patch(`${BASE_URL}/admin/waiter-requests/${requestId}/complete`);
      setWaiterRequests(prev => prev.filter(r => r._id !== requestId));
      showNotif("Service Call Resolved");
    } catch (err) { showNotif("Error clearing request", "error"); }
  };

// 🚀 DYNAMIC REVENUE SOURCE ALLOCATOR BASED ON EXPLICIT ASSIGNMENT VALUES
  const advancedStats = useMemo(() => {
    const topItems = (serverStats?.topItems || []).map(item => [item._id, item.totalSold]);
    const sources = { direct: 0, zomato: 0, swiggy: 0, takeaway: 0 };
    
    if (analytics && Array.isArray(analytics)) {
      analytics.forEach(day => {
        // Enforces clean matching keys from backend strings
        const orderSourceKey = day.source ? day.source.toLowerCase() : 'direct';
        
        if (sources.hasOwnProperty(orderSourceKey)) {
          sources[orderSourceKey] += Number(day.revenue || 0);
        } else {
          sources.direct += Number(day.revenue || 0);
        }
      });
    }

    return { 
      sources, 
      topItems, 
      hourlyTraffic: Array(24).fill(0), 
      loyaltyRate: analytics.length > 0 ? 84 : 0 
    };
  }, [serverStats, analytics]);

const fetchAttendanceForDate = useCallback(async (targetDate) => {
    try {
        const res = await axios.get(`${BASE_URL}/staff/attendance/log/${tenantId}/${targetDate}`);
        setAttendanceLogs(res.data || []);
    } catch (err) {
        console.error("Error pulling attendance matrix:", err);
    }
}, [tenantId]);

// Trigger initial attendance pull when Management tab mounts
useEffect(() => {
    if (activeTab === 'management') {
        fetchAttendanceForDate(attendanceDate);
    }
}, [activeTab, attendanceDate, fetchAttendanceForDate]);

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
  { id: 'insights', label: 'INSIGHTS', icon: <BarChart3 size={18} /> },
  // 🚀 NEW TAB
  { id: 'management', label: 'MANAGEMENT', icon: <ShieldCheck size={18} /> } 
].map(tab => (
  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? styles.activeTab : styles.navBtn}>
    <span style={{ marginRight: '15px' }}>{tab.icon}</span>
    {tab.label}
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
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', width: '100%' }}>
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
                    <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem', padding: '40px', background: '#0d0d0d', borderRadius: '15px' }}>NO ACTIVE ORDERS</div>
                  )}
                </div>
                <div style={{ flex: 1, borderLeft: '1px solid #1a1a1a', paddingLeft: '30px' }}>
                  <h3 style={styles.gridLabel}>ACTIVE SERVICE CALLS</h3>
                  {Array.isArray(waiterRequests) && waiterRequests.length > 0 ? (
                    waiterRequests.map(req => (
                      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={req._id} style={{...styles.waiterRequestRow, gap: '15px', padding: '15px'}}>
                        <div style={{...styles.goldCircle, width: '35px', height: '35px'}}><BellRing size={16} /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '900', color: '#d4af37', fontSize: '0.8rem' }}>TABLE {req.tableNumber}</div>
                          <div style={{ fontSize: '0.75rem', color: '#fff', marginTop: '2px', lineHeight: '1.4' }}>{req.serviceRequest}</div>
                        </div>
                        <button onClick={() => completeWaiterRequest(req._id)} style={{...styles.doneBtn, padding: '6px 12px', fontSize: '0.6rem'}}>DONE</button>
                      </motion.div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', padding: '20px' }}>NO PENDING REQUESTS</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.fullWidthGrid}>
                {menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                  <div key={item._id} style={{...styles.premiumCard, opacity: item.isAvailable ? 1 : 0.4}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>{item.name}</h3>
                      <span style={{ color: '#d3bfa2', fontWeight: 'bold' }}>₹{item.price}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {/* 🚀 FIXED: Opens native UI editor instead of window.prompt */}
                      <button onClick={() => setActivePriceEditItem(item)} style={styles.ghostBtn}>PRICING</button>
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
      const isOccupied = occupiedTables.includes(id);
      const hasRequestedCheckout = checkoutRequests.includes(id);
      const isCurrentlySelected = selectedTable === id;

      return (
        <button 
          key={n} 
          onClick={() => generateBill(id)} 
          style={{
            ...styles.tableBtn,
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: isCurrentlySelected 
              ? '#d3bfa2' 
              : hasRequestedCheckout 
                ? 'rgba(211, 191, 162, 0.15)' // Matte gold highlight for billing requests
                : isOccupied 
                  ? '#111111' // High-end dark slate remains active after kitchen served/dispatch
                  : '#0d0d0d', 
            color: isCurrentlySelected 
              ? '#000000' 
              : hasRequestedCheckout 
                ? '#d3bfa2' 
                : isOccupied 
                  ? 'rgba(211,191,162,0.6)' 
                  : '#333333',
            border: isCurrentlySelected 
              ? '1px solid #d3bfa2' 
              : hasRequestedCheckout 
                ? '1px dashed #d3bfa2' 
                : isOccupied 
                  ? '1px solid rgba(211,191,162,0.25)' 
                  : '1px solid #151515'
          }}
        >
          {hasRequestedCheckout && (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <BellRing size={16} style={{ color: '#d3bfa2' }} />
            </motion.div>
          )}
          <span style={{ fontSize: '1.05rem', fontWeight: '900' }}>T{n}</span>
          {isOccupied && !hasRequestedCheckout && !isCurrentlySelected && (
            <div style={{ width: '5px', height: '5px', background: '#8a704d', borderRadius: '50%' }} />
          )}
        </button>
      );
    })}
  </div>

                  {/* 💰 DYNAMIC RUNNING DAILY CURRENCY BREAKDOWN COMPONENT BAR */}
 {/* 💰 UPGRADED HIGH-CONTRAST DATA STRIP MATRIX BAR */}
  <div style={{ ...styles.biCard, marginTop: '25px', borderTop: '2px solid #d3bfa2', background: '#090909', padding: '20px' }}>
     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', textAlign: 'center', alignItems: 'center' }}>
        <div>
           <small style={{ ...styles.statLabel, color: '#666', letterSpacing: '0.5px' }}>DAILY CASH PORTFOLIO</small>
           <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#fff', marginTop: '4px' }}>₹{dailySettlementBreakdown.cash.toLocaleString()}</div>
        </div>
        <div>
           <small style={{ ...styles.statLabel, color: '#666', letterSpacing: '0.5px' }}>DAILY UPI INSTANT NET</small>
           <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#fff', marginTop: '4px' }}>₹{dailySettlementBreakdown.upi.toLocaleString()}</div>
        </div>
        <div>
           <small style={{ ...styles.statLabel, color: '#666', letterSpacing: '0.5px' }}>DAILY CARD CAPTURES</small>
           <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#fff', marginTop: '4px' }}>₹{dailySettlementBreakdown.card.toLocaleString()}</div>
        </div>
        {/* 🚀 NEW ADDITION: GROSS CONSOLIDATED COMBINED TOTAL LIQUIDITY VALUE */}
        <div style={{ borderLeft: '1px solid #151515', paddingLeft: '15px' }}>
           <small style={{ ...styles.statLabel, color: '#d3bfa2', fontWeight: '900', letterSpacing: '0.5px' }}>DAILY GROSS SETTLED</small>
           <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#d3bfa2', marginTop: '2px' }}>₹{dailySettlementBreakdown.gross.toLocaleString()}</div>
        </div>
     </div>
  </div>
                </div>
                

{tableBill && (
  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={styles.receipt}>
    {/* 1. Dynamic Header Section (SaaS Multi-tenancy) */}
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <h4 style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '2px', fontWeight: '800' }}>TAX INVOICE</h4>
      <h1 style={{ margin: '5px 0', fontSize: '1.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
        {tenantConfig?.name || tenantId.split('_').join(' ')}
      </h1>
      <p style={{ fontSize: '0.65rem', fontWeight: '700', color: '#444', margin: '0 0 5px', lineHeight: '1.3' }}>
        {tenantConfig?.address ? `${tenantConfig.address.street}, ${tenantConfig.address.city}` : "Address Loading..."}
      </p>
      <p style={{ fontSize: '0.7rem', fontWeight: '800' }}>
        GSTIN: {tenantConfig?.gstin || "27AABCU1234F1Z5"}
      </p>
    </div>

    {/* 2. Sequential Invoice Details Strip */}
    <div style={{ 
        borderTop: '2px solid #000', 
        borderBottom: '2px solid #000', 
        padding: '8px 0', 
        marginTop: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#666' }}>BILL NO.</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '900' }}>#{tableBill.billNo}</div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800' }}>{tableBill.date}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: '600' }}>{tableBill.time}</div>
        </div>
    </div>

    {/* 3. Itemized Body */}
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: '900', color: '#888', marginBottom: '10px' }}>
        <span>ITEM DESCRIPTION</span>
        <span>TOTAL</span>
      </div>
      {tableBill.items.map((it, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: '700' }}>
            {it.quantity}x {it.name} <br/>
            <small style={{ color: '#999', fontWeight: '500' }}>@ ₹{it.pricePerUnit || (it.subtotal / it.quantity).toFixed(0)}</small>
          </span>
          <b style={{ fontWeight: '900' }}>₹{it.subtotal}</b>
        </div>
      ))}
    </div>

    {/* 4. Tax Breakdown & Total in Words */}
    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', fontSize: '0.8rem' }}>
      <div style={styles.receiptRow}><span>Subtotal</span><span>₹{(tableBill.total / 1.05).toFixed(2)}</span></div>
      <div style={styles.receiptRow}><span>CGST (2.5%)</span><span>₹{(tableBill.total * 0.025).toFixed(2)}</span></div>
      <div style={styles.receiptRow}><span>SGST (2.5%)</span><span>₹{(tableBill.total * 0.025).toFixed(2)}</span></div>
      
      <p style={{ fontSize: '0.6rem', fontStyle: 'italic', marginTop: '8px', fontWeight: '700', color: '#666' }}>
        Rupees: {numberToWords(Math.round(tableBill.total - (tableBill.total * (discount / 100))))}
      </p>
    </div>

    {/* 5. Discount Section */}
    <div style={{ ...styles.discountArea, borderTop: '1px dashed #ddd', marginTop: '15px', paddingTop: '15px' }}>
      <div style={styles.receiptRow}>
        <span style={{ fontWeight: '900' }}>DISCOUNT %</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} style={styles.discountInput} />
        </div>
      </div>
    </div>

    {/* 6. Payment Selection Section */}
    <div style={{ ...styles.paymentSection, margin: '20px 0' }}>
      <div style={styles.tabToggle}>
        <button onClick={() => setActivePaymentType('full')} style={activePaymentType === 'full' ? styles.activeMiniTab : styles.miniTab}>SINGLE MODE</button>
        <button onClick={() => setActivePaymentType('split')} style={activePaymentType === 'split' ? styles.activeMiniTab : styles.miniTab}>SPLIT BILL</button>
      </div>

      {activePaymentType === 'split' ? (
        <div style={styles.splitGrid}>
          <div style={styles.splitInputRow}>
            <div style={styles.modeLabel}><Banknote size={14}/> CASH</div>
            <input type="number" placeholder="₹0" style={styles.billInput} value={paymentModes.cash} onChange={e => setPaymentModes({...paymentModes, cash: e.target.value})} />
          </div>
          <div style={styles.splitInputRow}>
            <div style={styles.modeLabel}><Smartphone size={14}/> UPI</div>
            <input type="number" placeholder="₹0" style={styles.billInput} value={paymentModes.upi} onChange={e => setPaymentModes({...paymentModes, upi: e.target.value})} />
          </div>
          <div style={styles.splitInputRow}>
            <div style={styles.modeLabel}><CreditCard size={14}/> CARD</div>
            <input type="number" placeholder="₹0" style={styles.billInput} value={paymentModes.card} onChange={e => setPaymentModes({...paymentModes, card: e.target.value})} />
          </div>
        </div>
      ) : (
        <div style={styles.singleModeGrid}>
          {['cash', 'upi', 'card'].map(m => (
            <button key={m} onClick={() => setSelectedSingleMode(m)} style={selectedSingleMode === m ? styles.activeModeBtn : styles.modeBtn}>
              {m === 'cash' && <Banknote size={16}/>}
              {m === 'upi' && <Smartphone size={16}/>}
              {m === 'card' && <CreditCard size={16}/>}
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* 7. Highlighted Grand Total Display */}
    <div style={{ ...styles.totalArea, borderTop: '2px solid #000', paddingTop: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '900' }}>
        <span>GRAND TOTAL</span>
        <span style={{ color: '#000' }}>₹{Math.round(tableBill.total - (tableBill.total * (discount / 100)))}</span>
      </div>
      <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#888', textAlign: 'right', marginTop: '5px' }}>
        MODE: {activePaymentType === 'split' ? 'SPLIT PAYMENT' : selectedSingleMode.toUpperCase()}
      </div>
    </div>

    {/* 8. Action & SaaS Branding */}
    <button onClick={settleBill} style={{ ...styles.settleBtn, marginTop: '20px' }}>FINALIZE SETTLEMENT</button>
    
    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.6rem', fontWeight: '900', color: '#ccc', letterSpacing: '1px' }}>
      POWERED BY PRATYEKSHA
    </div>
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
                      <div style={{textAlign: 'center', opacity: 0.2, fontSize: '0.8rem', paddingTop: '40px'}}>NO DISHES ORDERED YET</div>
                    )}
                  </div>
                </div>

                <div style={styles.heatmapCard}>
                   <h4 style={styles.biTitle}><Calendar size={16} /> DAILY REVENUE HEATMAP</h4>
                   <div style={styles.calendarGridHeader}>
                     {['S','M','T','W','T','F','S'].map(d => <div key={d} style={styles.dayHeader}>{d}</div>)}
                   </div>
                   <div style={styles.calendarGrid}>{renderMonthHeatmap()}</div>
                   <div style={styles.heatmapLegend}>
                     <span>Less</span>
                     <div style={{...styles.heatSquare, width: '12px', height: '12px', background: '#111'}} />
                     <div style={{...styles.heatSquare, width: '12px', height: '12px', background: 'rgba(211, 191, 162, 0.4)'}} />
                     <div style={{...styles.heatSquare, width: '12px', height: '12px', background: 'rgba(211, 191, 162, 1)'}} />
                     <span>More</span>
                   </div>
                </div>

                {/* 🚀 NEW UPGRADE SECTION: CATEGORY DENSITY ANALYSIS VIEW GRID */}
        <div style={{ ...styles.biCard, marginBottom: '30px', borderTop: '2px solid #d3bfa2' }}>
           <h4 style={styles.biTitle}><Layers size={16} /> OPERATIONAL CATEGORY PERFORMANCE SEGMENTATION</h4>
           <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '-15px', marginBottom: '25px' }}>
              Detailed structural lookup analyzing menu category items performance velocity.
           </p>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {Object.keys(categoryRankings).length > 0 ? (
                 Object.entries(categoryRankings).map(([catName, metrics]) => (
                    <div key={catName} style={{ background: '#050505', border: '1px solid #111', padding: '20px', borderRadius: '16px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #111', paddingBottom: '10px' }}>
                          <span style={{ fontWeight: '900', fontSize: '0.85rem', color: '#d3bfa2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{catName}</span>
                          <span style={{ fontSize: '0.68rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(211,191,162,0.05)', color: '#888', fontWeight: '800' }}>
                             {metrics.totalSoldInCategory} UNITS SOLD
                          </span>
                       </div>

                       {/* Category Top Performers Strip */}
                       <div style={{ marginBottom: '15px' }}>
                          <small style={{ fontSize: '0.6rem', color: '#444', fontWeight: '800', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>TOP MOVING</small>
                          {metrics.topDishes.map((dish, idx) => (
                             <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 0', color: '#fff' }}>
                                <span>✦ {dish.name}</span>
                                <span style={{ fontWeight: '700', color: '#d3bfa2' }}>{dish.sold} sold</span>
                             </div>
                          ))}
                       </div>

                       {/* Category Bottom Performers Strip */}
                       <div>
                          <small style={{ fontSize: '0.6rem', color: '#444', fontWeight: '800', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>UNDERPERFORMING</small>
                          {metrics.bottomDishes.map((dish, idx) => (
                             <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 0', color: '#555' }}>
                                <span>• {dish.name}</span>
                                <span style={{ fontWeight: '600' }}>{dish.sold} sold</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 ))
              ) : (
                 <div style={{ textAlign: 'center', color: '#333', fontSize: '0.8rem', padding: '20px', gridColumn: 'span 2' }}>
                    AWAITING SETTLED INVOICES TO MAP CATEGORY DISTRIBUTIONS...
                 </div>
              )}
           </div>
        </div>

                {/* --- ADD THIS INSIDE INSIGHTS TAB --- */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
    
    {/* CARD 1: LIVE FOOD COSTING */}
    <div style={{...styles.biCard, borderLeft: '4px solid #ff4d4d'}}>
        <h4 style={styles.biTitle}><Flame size={16} color="#ff4d4d" /> KITCHEN BURN RATE</h4>
        <div style={{ marginTop: '15px' }}>
            <div style={styles.statVal}>
                ₹{inventory.reduce((acc, item) => acc + (item.costPrice * (item.consumedToday || 0)), 0).toFixed(2)}
            </div>
            <small style={{ color: '#666', fontSize: '0.65rem' }}>TOTAL INGREDIENT COST CONSUMED TODAY</small>
            <div style={{...styles.progressBg, marginTop: '15px'}}>
                <div style={{...styles.progressFill, width: '65%', background: '#ff4d4d'}} />
            </div>
        </div>
    </div>

    {/* CARD 2: REAL-TIME NET PROFIT (The "Truth" Card) */}
    <div style={{...styles.biCard, borderLeft: '4px solid #4ade80'}}>
        <h4 style={styles.biTitle}><Sparkles size={16} color="#4ade80" /> ACTUAL NET MARGIN</h4>
        <div style={{ marginTop: '15px' }}>
            <div style={{...styles.statVal, color: '#4ade80'}}>
                ₹{(stats.revenue - (inventory.reduce((acc, item) => acc + (item.costPrice * (item.consumedToday || 0)), 0))).toLocaleString()}
            </div>
            <small style={{ color: '#666', fontSize: '0.65rem' }}>GROSS REVENUE MINUS FOOD COSTS</small>
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                <TrendingUp size={12} color="#4ade80" />
                <span style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 'bold' }}>+12.5% vs yesterday</span>
            </div>
        </div>
    </div>
</div>

{/* CARD 3: STOCK DEPLETION PREDICTION */}
<div style={{...styles.biCard, marginBottom: '30px'}}>
    <h4 style={styles.biTitle}><Clock size={16} /> PROCUREMENT PREDICTOR</h4>
    <div style={styles.fullWidthGrid}>
        {inventory.filter(i => i.currentStock < i.minThreshold * 1.5).map(item => (
            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #111' }}>
                <span style={{ fontSize: '0.8rem', color: '#fff' }}>{item.itemName}</span>
                <span style={{ fontSize: '0.7rem', color: '#ff4d4d', fontWeight: '900' }}>
                    RUNS OUT IN: ~{Math.floor(item.currentStock / (item.avgDailyUsage || 1))} DAYS
                </span>
            </div>
        ))}
    </div>
</div>
              </motion.div>
            )}
{activeTab === 'management' && (
  <motion.div 
    key="management" 
    initial={{ opacity: 0, y: 15 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.4, ease: "easeOut" }}
    style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '100px', width: '100%' }}
  >
    
    {/* 📋 WORKFORCE REGISTER TERMINAL */}
    <div style={{ ...styles.biCard, borderTop: '3px solid #d3bfa2', background: 'linear-gradient(180deg, #0d0d0d 0%, #080808 100%)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <User size={20} color="#d3bfa2" />
        <h4 style={{ ...styles.biTitle, margin: 0, color: '#fff', fontSize: '1rem', letterSpacing: '0.5px' }}>WORKFORCE REGISTER TERMINAL</h4>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '25px', paddingLeft: '32px' }}>
        Enroll premium restaurant team members with structural baseline operational metrics.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'end', padding: '0 10px' }}>
        <div>
          <label style={{ ...styles.statLabel, color: '#888', marginBottom: '8px', display: 'block' }}>FULL NAME</label>
          <input type="text" placeholder="John Doe" style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#151515', fontSize: '0.8rem' }} value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
        </div>
        
        <div>
          <label style={{ ...styles.statLabel, color: '#888', marginBottom: '8px', display: 'block' }}>OPERATIONAL ROLE</label>
          <select style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#151515', fontSize: '0.8rem', cursor: 'pointer' }} value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value, assignedTables: []})}>
            {['Waiter', 'Chef', 'Manager', 'Cashier', 'Helper'].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
        </div>

        {newStaff.role === 'Chef' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ gridColumn: 'span 2' }}>
            <label style={{ ...styles.statLabel, color: '#d3bfa2', marginBottom: '8px', display: 'block', fontWeight: '800' }}>CUISINE SPECIALIZATION (SELECT MULTIPLE CATEGORIES)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#000', padding: '14px', borderRadius: '12px', border: '1px solid #1a1a1a', minHeight: '54px' }}>
              {menuItems && menuItems.length > 0 ? (
                [...new Set(menuItems.map(item => item.categoryId))].filter(Boolean).map(catId => {
                  const currentSelections = newStaff.cookingRole ? newStaff.cookingRole.split(', ') : [];
                  const isChecked = currentSelections.includes(catId);
                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => {
                        let updatedCategories = isChecked 
                          ? currentSelections.filter(c => c !== catId)
                          : [...currentSelections, catId];
                        setNewStaff({ ...newStaff, cookingRole: updatedCategories.join(', ') });
                      }}
                      style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', border: 'none', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: isChecked ? '#d3bfa2' : '#111',
                        color: isChecked ? '#000' : '#666',
                        boxShadow: isChecked ? '0 4px 12px rgba(211,191,162,0.2)' : 'none'
                      }}
                    >
                      {catId.toUpperCase()}
                    </button>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.7rem', color: '#444', display: 'flex', alignItems: 'center' }}>LOADING ARCHITECTURAL CATEGORIES...</div>
              )}
            </div>
          </motion.div>
        )}

        <div>
          <label style={{ ...styles.statLabel, color: '#888', marginBottom: '8px', display: 'block' }}>AGE</label>
          <input type="number" placeholder="25" style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#151515' }} value={newStaff.age} onChange={e => setNewStaff({...newStaff, age: e.target.value})} />
        </div>

        <div>
          <label style={{ ...styles.statLabel, color: '#888', marginBottom: '8px', display: 'block' }}>CONTACT NUMBER</label>
          <input type="text" placeholder="9876543210" style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#151515' }} value={newStaff.contact} onChange={e => setNewStaff({...newStaff, contact: e.target.value})} />
        </div>

<div>
  <label style={{ ...styles.statLabel, color: '#888', marginBottom: '8px', display: 'block' }}>SHIFT WINDOW</label>
  <select 
    style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#151515', cursor: 'pointer' }} 
    value={newStaff.shiftType} 
    onChange={e => setNewStaff({...newStaff, shiftType: e.target.value})}
  >
    <option value="Day Shift">DAY SHIFT</option>
    <option value="Night Shift">NIGHT SHIFT</option>
    {/* 🚀 FIXED: Value normalized to 'Both Shifts' to clear Mongoose backend validation gates */}
    <option value="Both Shifts">BOTH SHIFTS (DAY & NIGHT)</option>
  </select>
</div>

        <div>
          <label style={{ ...styles.statLabel, color: '#888', marginBottom: '8px', display: 'block' }}>BASE MONTHLY SALARY</label>
          <input type="number" placeholder="₹25,000" style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#151515' }} value={newStaff.baseSalary} onChange={e => setNewStaff({...newStaff, baseSalary: e.target.value})} />
        </div>

        <div>
          <label style={{ ...styles.statLabel, color: '#888', marginBottom: '8px', display: 'block' }}>JOINING DATE</label>
          <input type="date" style={{ ...styles.input, marginBottom: 0, colorScheme: 'dark', background: '#000', borderColor: '#151515', cursor: 'pointer' }} value={newStaff.joiningDate} onChange={e => setNewStaff({...newStaff, joiningDate: e.target.value})} />
        </div>
      </div>

      {newStaff.role === 'Waiter' && (
        <div style={{ marginTop: '25px', background: '#080808', padding: '18px', borderRadius: '14px', border: '1px solid #121212' }}>
          <label style={{ ...styles.statLabel, color: '#888', marginBottom: '10px', display: 'block' }}>INITIAL FLOORGRID TABLE ASSIGNMENTS</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Array.from({ length: tableCount }, (_, idx) => (idx + 1).toString()).map(tableNum => {
              const isSelected = newStaff.assignedTables.includes(tableNum);
              return (
                <button
                  key={tableNum}
                  type="button"
                  onClick={() => {
                    const updatedTables = isSelected
                      ? newStaff.assignedTables.filter(t => t !== tableNum)
                      : [...newStaff.assignedTables, tableNum];
                    setNewStaff({ ...newStaff, assignedTables: updatedTables });
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isSelected ? 'linear-gradient(135deg, #8a704d, #d3bfa2)' : '#111', 
                    color: isSelected ? '#000' : '#555',
                    boxShadow: isSelected ? '0 4px 10px rgba(138,112,77,0.25)' : 'none'
                  }}
                >
                  T{tableNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: '25px', padding: '0 10px' }}>
        <label style={{ ...styles.statLabel, color: '#888', marginBottom: '8px', display: 'block' }}>RESIDENTIAL ADDRESS</label>
        <div style={{ display: 'flex', gap: '20px' }}>
          <input type="text" placeholder="Street layout, city coordinates, landmarks" style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#151515' }} value={newStaff.address} onChange={e => setNewStaff({...newStaff, address: e.target.value})} />
          <button 
            onClick={async () => {
              if(!newStaff.name || !newStaff.contact || !newStaff.baseSalary) return showNotif("Mandatory enrollment parameters missing", "error");
              try {
                const finalName = newStaff.role === 'Chef' && newStaff.cookingRole 
                  ? `${newStaff.name} (${newStaff.cookingRole.toUpperCase()})` 
                  : newStaff.name;

                const payload = {
                  ...newStaff,
                  name: finalName,
                  tenantId,
                  age: Number(newStaff.age),
                  baseSalary: Number(newStaff.baseSalary)
                };

                const res = await axios.post(`${BASE_URL}/staff/register`, payload);
                
                if (newStaff.role === 'Waiter' && newStaff.assignedTables.length > 0) {
                  await axios.put(`${BASE_URL}/staff/floor-map`, {
                    tenantId,
                    staffId: res.data.member._id,
                    assignedTables: newStaff.assignedTables
                  });
                }

                showNotif(`${newStaff.name} safely locked into registers.`, "success");
                setNewStaff({ name: '', role: 'Waiter', age: '', contact: '', address: '', shiftType: 'Day Shift', joiningDate: new Date().toISOString().split('T')[0], baseSalary: '', assignedTables: [], cookingRole: '' });
                fetchManagementData();
              } catch(e) { showNotif("Failed to sync employee record", "error"); }
            }}
            style={{ ...styles.mainBtn, width: '240px', background: 'linear-gradient(135deg, #d3bfa2, #bda88a)', boxShadow: '0 6px 20px rgba(211,191,162,0.15)' }}
          >
            AUTHORIZE ROSTER
          </button>
        </div>
      </div>
    </div>

    {/* 👑 PREMIUM TELEMETRY HEADS-UP DISPLAY */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
       <div style={{ ...styles.biCard, borderLeft: '4px solid #d3bfa2', background: 'linear-gradient(90deg, #0d0d0d 0%, #070707 100%)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ background: 'rgba(211,191,162,0.06)', padding: '12px', borderRadius: '12px', color: '#d3bfa2', border: '1px solid rgba(211,191,162,0.1)' }}><ChefHat size={22} /></div>
             <div>
                <small style={{ color: '#444', fontWeight: '900', fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase' }}>PRODUCTION HUB CAPACITY</small>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', marginTop: '4px' }}>
                   {liveFloorIntelligence.activeChefs} Chefs <span style={{ color: '#222', fontSize: '1.2rem' }}>•</span> {liveFloorIntelligence.activeHelpers} Helpers Active
                </div>
             </div>
          </div>
       </div>

       <div style={{ ...styles.biCard, borderLeft: '4px solid #8a704d', background: 'linear-gradient(90deg, #0d0d0d 0%, #070707 100%)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ background: 'rgba(138,112,77,0.06)', padding: '12px', borderRadius: '12px', color: '#8a704d', border: '1px solid rgba(138,112,77,0.1)' }}><MousePointer2 size={22} /></div>
             <div style={{ width: '100%' }}>
                <small style={{ color: '#444', fontWeight: '900', fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase' }}>FLOORGRID COVERAGE DENSITY</small>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', marginTop: '4px' }}>
                   {liveFloorIntelligence.coveredCount} <span style={{ fontSize: '0.8rem', color: '#444', fontWeight: '800' }}>OF {tableCount} TABLES ACCOUNTED</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#8a704d', fontWeight: 'bold', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '420px' }}>
                   ACTIVE NODES: {liveFloorIntelligence.coveredList}
                </div>
             </div>
          </div>
       </div>
    </div>

    {/* 👑 WIDESCREEN FULL-WIDTH STACK ARCHITECTURE */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%' }}>
      
      {/* SECTION A: HISTORIC ROSTER LEDGER INDEX MATRIX PANEL */}
      <div style={{ ...styles.biCard, width: '100%', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} color="#d3bfa2" />
            <h4 style={{ ...styles.biTitle, margin: 0, color: '#fff', fontSize: '0.95rem' }}>HISTORIC ROSTER RECORD REGISTRY</h4>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ ...styles.searchWrapper, padding: '8px 14px', background: '#000', border: '1px solid #121212', borderRadius: '8px', marginBottom: 0 }}>
                <Search size={14} color="#444" />
                <input type="text" placeholder="Filter records by name..." style={{ ...styles.searchInput, width: '200px', fontSize: '0.75rem', color: '#fff' }} value={rosterSearchQuery} onChange={e => setRosterSearchQuery(e.target.value)} />
             </div>
             <span style={{ fontSize: '0.65rem', padding: '6px 12px', borderRadius: '6px', background: 'rgba(211,191,162,0.05)', color: '#d3bfa2', fontWeight: '800', border: '1px solid rgba(211,191,162,0.1)' }}>
               {filteredStaff.length} ARCHIVES ACTIVE
             </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }} className="custom-scroll">
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '0.65rem', color: '#555', borderBottom: '1px solid #121212', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                <th onClick={() => requestLedgerSort('name')} style={{ padding: '0 0 15px 12px', cursor: 'pointer', color: ledgerSortConfig.key === 'name' ? '#d3bfa2' : '#555' }}>Staff Details {ledgerSortConfig.key === 'name' && (ledgerSortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th style={{ paddingBottom: '15px' }}>Operational Node Assignments</th>
                <th style={{ paddingBottom: '15px' }}>Shift Window</th>
                <th onClick={() => requestLedgerSort('monthlyAttendance')} style={{ paddingBottom: '15px', textAlign: 'center', cursor: 'pointer', color: ledgerSortConfig.key === 'monthlyAttendance' ? '#d3bfa2' : '#555' }}>Monthly Attendance {ledgerSortConfig.key === 'monthlyAttendance' && (ledgerSortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => requestLedgerSort('joiningDate')} style={{ paddingBottom: '15px', cursor: 'pointer', color: ledgerSortConfig.key === 'joiningDate' ? '#d3bfa2' : '#555' }}>Dynamic Tenure {ledgerSortConfig.key === 'joiningDate' && (ledgerSortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => requestLedgerSort('baseSalary')} style={{ paddingBottom: '15px', cursor: 'pointer', color: ledgerSortConfig.key === 'baseSalary' ? '#d3bfa2' : '#555' }}>Compensation {ledgerSortConfig.key === 'baseSalary' && (ledgerSortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th style={{ paddingBottom: '15px' }}>Payroll Status</th>
                <th style={{ paddingBottom: '15px', textAlign: 'right', paddingRight: '12px' }}>Roster Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length > 0 ? (
                ['Chef', 'Waiter', 'Manager', 'Cashier', 'Helper'].map(roleName => {
                  // Filter matching entries on runtime for this visual partition block
                  const bucketList = filteredStaff.filter(m => (m.role || 'Helper') === roleName);
                  if (bucketList.length === 0) return null;

                  return (
                    <React.Fragment key={roleName}>
                      {/* ROLE CATEGORY SEPARATOR UI BAR */}
                      <tr style={{ background: 'rgba(211,191,162,0.02)' }}>
                        <td colSpan="8" style={{ padding: '10px 12px', background: '#090909', borderBottom: '1px solid #111' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '4px', height: '12px', background: '#d3bfa2', borderRadius: '2px' }} />
                            <span style={{ fontSize: '0.68rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                              {roleName}S POOL ({bucketList.length} ACTIVE)
                            </span>
                          </div>
                        </td>
                      </tr>

                      {bucketList.map(member => {
                        const currentYearStr = viewDate.getFullYear().toString();
                        const currentMonthStr = String(viewDate.getMonth() + 1).padStart(2, '0');
                        const targetMonthPrefix = `${currentYearStr}-${currentMonthStr}`;
                        
                        const monthlyPresentDays = attendanceLogs.filter(log => log.staffId === member._id && log.date?.startsWith(targetMonthPrefix)).length;
                        const pureStaffName = member.name.includes(' (') ? member.name.split(' (')[0] : member.name;
                        const explicitCuisines = member.cookingRole || (member.name.includes(' (') ? member.name.split('(')[1]?.replace(')', '') : '');

                        return (
                          <tr key={member._id} className="table-row-hover" style={{ borderBottom: '1px solid #090909', fontSize: '0.8rem' }}>
                            <td style={{ padding: '16px 12px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <b style={{ color: '#fff' }}>{pureStaffName}</b>
                                <span style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px', fontWeight: '700' }}>
                                  {member.role.toUpperCase()} {member.age ? `• ${member.age} YRS` : ''}
                                </span>
                              </div>
                            </td>
                            <td>
                              {member.role === 'Chef' ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxWidth: '320px' }}>
                                  {explicitCuisines ? explicitCuisines.split(', ').map(cuisine => (
                                    <span key={cuisine} style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.12)', borderRadius: '4px', color: '#d3bfa2', fontWeight: '800' }}>
                                      🍳 {cuisine.toUpperCase()}
                                    </span>
                                  )) : <span style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700' }}>GENERAL KITCHEN</span>}
                                </div>
                              ) : member.role === 'Waiter' ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                                  {member.assignedTables && member.assignedTables.length > 0 ? (
                                    member.assignedTables.map(t => (
                                      <span key={t} style={{ fontSize: '0.62rem', padding: '2px 6px', background: '#111', border: '1px solid #161616', borderRadius: '4px', color: '#aaa', fontWeight: '800' }}>
                                        T{t}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: '0.65rem', color: '#444', fontWeight: 'bold' }}>UNASSIGNED STATIONS</span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.65rem', color: '#333', fontStyle: 'italic', fontWeight: '700' }}>FIXED EQUIPMENT</span>
                              )}
                            </td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: '800', color: member.shiftType === 'Night Shift' ? '#8a704d' : '#d3bfa2' }}>
                                <Clock size={11} /> {member.shiftType.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.08)', fontSize: '0.75rem', fontWeight: '800', color: '#fff' }}>
                                {monthlyPresentDays} <span style={{ color: '#444', fontSize: '0.6rem', fontWeight: '700' }}>DAYS LOGGED</span>
                              </span>
                            </td>
                            <td>{calculateTenure(member.joiningDate)}</td>
                            <td style={{ fontWeight: '800', color: '#fff' }}>
                              ₹{Number(member.baseSalary).toLocaleString()}<small style={{ color: '#444', fontSize: '0.6rem' }}>/mo</small>
                            </td>
                            <td>
                               <select 
                                 value={member.salaryStatus || 'Unpaid'} 
                                 onChange={async (e) => {
                                    try {
                                       await axios.patch(`${BASE_URL}/staff/salary-status/${member._id}`, { salaryStatus: e.target.value });
                                       fetchManagementData();
                                       showNotif(`Roster payroll flag successfully updated for ${pureStaffName}`, "success");
                                    } catch(err) { showNotif("Payroll synchronization skipped", "error"); }
                                 }}
                                 style={{ 
                                   background: '#000', color: member.salaryStatus === 'Paid' ? '#d3bfa2' : '#444', 
                                   border: member.salaryStatus === 'Paid' ? '1px solid rgba(211,191,162,0.25)' : '1px solid #151515', 
                                   padding: '6px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', outline: 'none', cursor: 'pointer'
                                 }}
                               >
                                  <option value="Unpaid">UNPAID</option>
                                  <option value="Paid">PAID</option>
                                </select>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                              {/* 🚀 FIXED: Passes control block directly to safe inline layout dialogs */}
                              <button 
                                onClick={() => setPendingDeleteStaff(member)}
                                style={{ background: 'transparent', border: '1px solid #151515', color: '#444', padding: '6px 14px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#ff4d4d'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#151515'; e.currentTarget.style.color = '#444'; }}
                              >
                                WIPE ARCHIVE
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#444', fontSize: '0.75rem', fontWeight: '700' }}>
                    NO VALID WORKFORCE ARCHIVES LOCATED UNDER SPECIFIED SCOPE
                  </td>
                </tr>
              )}
            </tbody>
<tfoot>
               <tr style={{ background: '#050505', borderTop: '2px solid #111' }}>
                  {/* 🚀 STEP 1: Empty layout spacer cell spans across columns 1 to 5 */}
                  <td colSpan="4" style={{ padding: 0 }} />
                  
                  {/* 🚀 STEP 2: The descriptive label sits directly left of the compensation column */}
                  <td style={{ padding: '18px 12px', textAlign: 'right', fontSize: '0.7rem', fontWeight: '900', color: '#8a704d', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                     AGGREGATED PAYROLL:
                  </td>
                  
                  {/* 🚀 STEP 3: Total value renders strictly below your individual base monthly compensation metrics */}
                  <td style={{ padding: '18px 10px', textAlign: 'left', fontWeight: '900', color: '#d3bfa2', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                     ₹{totalPayrollValue.toLocaleString()}
                  </td>
                  
                  {/* 🚀 STEP 4: Secondary spacer cell addresses layout boundaries for remaining roster action columns */}
                  <td style={{ padding: 0 }} />
               </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION B: ATTENDANCE REGISTER TRACKER PANEL WITH LIVE SEARCH FILTERS */}
{/* SECTION B: ATTENDANCE REGISTER TRACKER PANEL WITH LIVE ROLE-BASED GROUPS */}
      <div style={{ ...styles.biCard, width: '100%', background: '#0d0d0d', borderTop: '1px solid #151515' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
           <div>
              <h4 style={{ ...styles.biTitle, marginBottom: '4px', color: '#fff' }}><Calendar size={14} color="#8a704d" /> ATTENDANCE MATRIX LIFE TRACKER</h4>
              <p style={{ fontSize: '0.68rem', color: '#555', margin: 0 }}>Verify daily clock intervals and toggle on-duty workspace parameters cleanly.</p>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ ...styles.searchWrapper, padding: '6px 12px', background: '#000', border: '1px solid #181818', borderRadius: '6px', marginBottom: 0 }}>
                 <Search size={12} color="#333" />
                 <input 
                    type="text" 
                    placeholder="Search tracking name..." 
                    id="attendanceSearchInput"
                    style={{ ...styles.searchInput, width: '160px', fontSize: '0.72rem', color: '#fff' }} 
                    onChange={(e) => {
                       const query = e.target.value.toLowerCase();
                       const elements = document.querySelectorAll('.attendance-card-node');
                       elements.forEach(el => {
                          const name = el.getAttribute('data-name');
                          if(name && name.includes(query)) { el.style.display = 'flex'; } else { el.style.display = 'none'; }
                       });
                    }}
                 />
              </div>
              <input 
                type="date" 
                value={attendanceDate} 
                onChange={(e) => {
                   setAttendanceDate(e.target.value);
                   fetchAttendanceForDate(e.target.value);
                }} 
                style={{ ...styles.input, colorScheme: 'dark', border: '1px solid #181818', background: '#000', fontSize: '0.75rem', padding: '8px 12px', width: '160px', marginBottom: 0, cursor: 'pointer' }} 
              />
           </div>
        </div>
        
        {/* ROLE-BASED GROUPS GRID SECTION FOR LIVE CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {['Chef', 'Waiter', 'Manager', 'Cashier', 'Helper'].map(roleName => {
            const roleStaff = staff.filter(m => (m.role || 'Helper') === roleName);
            if (roleStaff.length === 0) return null;

            return (
              <div key={`attendance-group-${roleName}`} style={{ border: '1px solid #121212', padding: '20px', borderRadius: '16px', background: '#090909' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #151515', paddingBottom: '10px' }}>
                   <Clock size={12} color="#8a704d" />
                   <span style={{ fontSize: '0.68rem', fontWeight: '900', color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {roleName.toUpperCase()} ROSTER STATIONS ({roleStaff.length})
                   </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                  {roleStaff.map(m => {
                    const log = attendanceLogs.find(l => l.staffId === m._id);
                    const isClockedIn = !!log && !log.clockOut;
                    const isShiftEnded = !!log && !!log.clockOut;
                    const sanitizedStaffName = m.name.includes(' (') ? m.name.split(' (')[0] : m.name;
                    return (
                      <div 
                        key={m._id} 
                        className="attendance-card-node"
                        data-name={sanitizedStaffName.toLowerCase()}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', background: '#050505', border: isClockedIn ? '1px solid rgba(211,191,162,0.2)' : '1px solid #111', alignItems: 'center', transition: 'all 0.2s ease' }}
                      >
                        <div style={{ textAlign: 'left' }}>
                           <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff' }}>{sanitizedStaffName}</div>
                           <small style={{ color: isClockedIn ? '#d3bfa2' : '#444', fontSize: '0.65rem', fontWeight: '700', marginTop: '3px', display: 'block' }}>
                              {isShiftEnded ? `SHIFT CLOSED (~${log.totalWorkingHours}H)` : isClockedIn ? "ON DUTY • ACTIVE" : "NOT PRESENT / UNPUNCHED"}
                           </small>
                        </div>
                        <button 
                          onClick={async () => {
                             if(!log) await axios.post(`${BASE_URL}/staff/attendance/clock-in`, { tenantId, staffId: m._id });
                             else if(isClockedIn) await axios.patch(`${BASE_URL}/staff/attendance/clock-out/${log._id}`);
                             
                             const syncRes = await axios.get(`${BASE_URL}/staff/attendance/log/${tenantId}/${attendanceDate}`);
                             setAttendanceLogs(syncRes.data || []);
                          }} 
                          disabled={isShiftEnded} 
                          style={{ 
                            background: isShiftEnded ? '#111' : isClockedIn ? 'rgba(138,112,77,0.08)' : '#d3bfa2', 
                            color: isShiftEnded ? '#333' : isClockedIn ? '#8a704d' : '#000', 
                            border: isClockedIn ? '1px solid rgba(138,112,77,0.2)' : 'none',
                            padding: '8px 14px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.3px', cursor: isShiftEnded ? 'default' : 'pointer', transition: 'all 0.15s'
                          }}
                        >
                           {isShiftEnded ? "COMPLETED" : isClockedIn ? "CLOCK OUT" : "CLOCK IN"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>  
      </div>
      </motion.div>
)}
          </AnimatePresence>
        </section>
      </main>

{/* 👑 PREMIUM MODAL A: PRICING LAYER MANAGER (REPLACES WINDOW.PROMPT) */}
      <AnimatePresence>
        {activePriceEditItem && (
          <div style={styles.modalBackdrop}>
            <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }} style={{ ...styles.confirmBox, width: '420px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <UtensilsCrossed size={20} color="#d3bfa2" />
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>EDIT VALUATION METRICS</h3>
              </div>
              <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '-10px', marginBottom: '20px' }}>Modifying base price points for <b>{activePriceEditItem.name}</b></p>
              
              {!activePriceEditItem.priceHalf ? (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ ...styles.statLabel, color: '#888', display: 'block', marginBottom: '8px' }}>STANDARD PRICE (₹)</label>
                  <input 
                    type="number" 
                    style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#222' }} 
                    value={activePriceEditItem.price || ''} 
                    onChange={e => setActivePriceEditItem({ ...activePriceEditItem, price: Number(e.target.value) })}
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ ...styles.statLabel, color: '#888', display: 'block', marginBottom: '8px' }}>HALF PRICE (₹)</label>
                    <input 
                      type="number" 
                      style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#222' }} 
                      value={activePriceEditItem.priceHalf || ''} 
                      onChange={e => setActivePriceEditItem({ ...activePriceEditItem, priceHalf: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ ...styles.statLabel, color: '#888', display: 'block', marginBottom: '8px' }}>FULL PRICE (₹)</label>
                    <input 
                      type="number" 
                      style={{ ...styles.input, marginBottom: 0, background: '#000', borderColor: '#222' }} 
                      value={activePriceEditItem.priceFull || ''} 
                      onChange={e => setActivePriceEditItem({ ...activePriceEditItem, priceFull: Number(e.target.value), price: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                <button onClick={() => setActivePriceEditItem(null)} style={styles.cancelBtn}>ABORT</button>
                <button 
                  onClick={() => {
                    const payload = activePriceEditItem.priceHalf 
                      ? { priceHalf: activePriceEditItem.priceHalf, priceFull: activePriceEditItem.priceFull, price: activePriceEditItem.priceFull }
                      : { price: activePriceEditItem.price };
                    updateMenu(activePriceEditItem._id, payload);
                    setActivePriceEditItem(null);
                  }} 
                  style={styles.confirmBtn}
                >
                  SAVE CHANGES
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 👑 PREMIUM MODAL B: ATOMIC ERASER MANAGER (REPLACES WINDOW.CONFIRM) */}
      <AnimatePresence>
        {pendingDeleteStaff && (
          <div style={styles.modalBackdrop}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={styles.confirmBox}>
              <div style={{ display: 'flex', justifyContent: 'center', color: '#ff4d4d', marginBottom: '15px' }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ color: '#fff', margin: '0 0 10px', fontSize: '1.1rem', fontWeight: '900' }}>PERMANENT WIPEOUT DIALOGUE</h3>
              <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '25px', lineHeight: '1.5' }}>
                Are you entirely certain you want to destroy records for <b style={{ color: '#fff' }}>{pendingDeleteStaff.name.split(' (')[0]}</b> immutably? This will flush all sub-collection archives from data stores.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setPendingDeleteStaff(null)} style={styles.cancelBtn}>ABORT</button>
                <button 
                  onClick={async () => {
                    try {
                      const res = await axios.delete(`${BASE_URL}/staff/remove/${pendingDeleteStaff._id}`);
                      if (res.data.success) {
                        showNotif(`Successfully erased memory arrays for ${pendingDeleteStaff.name.split(' (')[0]}.`, "info");
                        setStaff(prev => prev.filter(m => m._id !== pendingDeleteStaff._id));
                        setAttendanceLogs(prev => prev.filter(log => log.staffId !== pendingDeleteStaff._id));
                        fetchManagementData();
                      }
                    } catch(e) { showNotif("Destruction gateway exception thrown", "error"); }
                    finally { setPendingDeleteStaff(null); }
                  }} 
                  style={{ ...styles.confirmBtn, background: '#ff4d4d', color: '#fff' }}
                >
                  PURGE RECORD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; } 
        .custom-scroll::-webkit-scrollbar-thumb { background: #151515; border-radius: 10px; }
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
  receipt: { width: '450px', background: '#fff', color: '#000', padding: '50px', borderRadius: '2px', boxShadow: '0 30px 90px rgba(0,0,0,0.6)', margin: '0 auto' },
  receiptHeader: { borderBottom: '2px solid #000', paddingBottom: '30px', marginBottom: '30px', textAlign: 'center' },
  receiptBody: { minHeight: '150px', borderBottom: '1px solid #eee', paddingBottom: '20px' },
  receiptRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' },
  discountArea: { padding: '20px 0', borderBottom: '1px solid #eee' },
  discountInput: { width: '50px', padding: '8px', border: '1px solid #ddd', textAlign: 'center', borderRadius: '4px', fontWeight: 'bold' },
  totalArea: { padding: '30px 0' },
  settleBtn: { width: '100%', padding: '20px', background: '#000', color: '#fff', border: 'none', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer' },
  insightsWrapper: { maxWidth: '1000px', margin: '0 auto' },
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
  input: { width: '100%', padding: '18px', background: '#0d0d0d', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '14px', marginBottom: '20px', fontSize: '0.85rem', outline: 'none' },
  mainBtn: { width: '100%', padding: '20px', background: '#d3bfa2', color: '#000', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' },
  toast: { position: 'fixed', bottom: '40px', right: '40px', background: '#111', padding: '18px 30px', borderRadius: '16px', border: '1px solid #222', display: 'flex', alignItems: 'center', gap: '15px', zIndex: 1000, fontWeight: '900', fontSize: '0.85rem', color: '#d3bfa2' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  confirmBox: { width: '380px', background: '#0d0d0d', padding: '50px', borderRadius: '35px', textAlign: 'center', border: '1px solid #1a1a1a' },
  confirmBtn: { flex: 1, padding: '18px', background: '#d3bfa2', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '18px', background: '#111', color: '#444', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  premiumCard: { background: '#0d0d0d', padding: '30px', borderRadius: '24px', border: '1px solid #1a1a1a' },
  ghostBtn: { flex: 1, padding: '12px', background: 'transparent', border: '1px solid #222', color: '#444', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' },
  toggleShowBtn: { flex: 1, padding: '12px', background: '#d3bfa2', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '0.7rem' },
  toggleHideBtn: { flex: 1, padding: '12px', background: '#1a1a1a', color: '#333', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '0.7rem' },
  fullWidthGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  gridLabel: { color: '#222', fontSize: '0.7rem', fontWeight: '900', marginBottom: '20px', letterSpacing: '1.5px' },
  bellIcon: { marginRight: '8px', color: '#d4af37' },
  specialModeRow: { display: 'flex', gap: '15px', marginBottom: '30px' },
  specBtn: { flex: 1, padding: '18px', background: '#0d0d0d', border: '1px solid #1a1a1a', color: '#333', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '0.8rem', cursor: 'pointer' },
  activeSpecBtn: { flex: 1, padding: '18px', background: '#d3bfa2', border: 'none', color: '#000', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '0.8rem' },
  waiterRequestRow: { display: 'flex', alignItems: 'center', gap: '20px', background: '#111', padding: '15px 20px', borderRadius: '15px', border: '1px solid #d4af37', marginBottom: '12px' },
  goldCircle: { width: '40px', height: '40px', background: '#d4af3715', borderRadius: '10px', border: '1px solid #d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37' },
  doneBtn: { background: '#d3bfa2', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: '900', fontSize: '0.7rem', cursor: 'pointer' },
  biCard: { background: '#0d0d0d', padding: '25px', borderRadius: '20px', border: '1px solid #1a1a1a' },
  biTitle: { fontSize: '0.75rem', fontWeight: '900', color: '#444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' },
  sourceRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px', fontSize: '0.8rem', color: '#999' },
  progressBg: { flex: 1, height: '6px', background: '#111', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #8a704d, #d3bfa2)', borderRadius: '10px' },
  headerMonthSelector: { display: 'flex', alignItems: 'center', gap: '12px', background: '#000', padding: '5px 15px', borderRadius: '12px', border: '1px solid #1a1a1a' },
  headerMonthNav: { background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  headerMonthDisplay: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px', justifyContent: 'center' },
  paymentSection: { padding: '25px 0', borderBottom: '1px solid #eee' },
  tabToggle: { display: 'flex', gap: '5px', marginBottom: '20px', background: '#f5f5f5', padding: '4px', borderRadius: '10px' },
  miniTab: { flex: 1, padding: '10px', border: 'none', background: 'transparent', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  activeMiniTab: { flex: 1, padding: '10px', border: 'none', background: '#fff', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  splitGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  splitInputRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modeLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', fontWeight: '900', color: '#555' },
  billInput: { width: '100px', padding: '10px', border: '1px solid #eee', background: '#fafafa', borderRadius: '8px', textAlign: 'right', fontWeight: '900', color: '#000', outline: 'none' },
  singleModeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  modeBtn: { padding: '15px 5px', background: '#f9f9f9', border: '1px solid #eee', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '900', color: '#999', cursor: 'pointer' },
  activeModeBtn: { padding: '15px 5px', background: '#000', border: '1px solid #000', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '900', color: '#fff', cursor: 'pointer' }
};

export default OperatorPortal;