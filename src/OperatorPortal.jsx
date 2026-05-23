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
  ChefHat
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

const OperatorLiveTimer = ({ createdAt }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const calc = () => setElapsed(Math.floor((new Date() - new Date(createdAt)) / 60000));
    calc();
    const interval = setInterval(calc, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);
  const getUrgencyColor = () => elapsed >= 15 ? '#d4af37' : '#444';
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

const calculateTenure = (joiningDateString) => {
    if (!joiningDateString) return 'N/A';
    const joinDate = new Date(joiningDateString);
    const now = new Date();
    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    let days = now.getDate() - joinDate.getDate();
    if (days < 0) { months -= 1; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years -= 1; months += 12; }
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
  // ── viewDate drives the month selector in INSIGHTS and month picker in MANAGEMENT
  const [viewDate, setViewDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [checkoutRequests, setCheckoutRequests] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableBill, setTableBill] = useState(null);
  const [discount, setDiscount] = useState(0); 
  const [paymentModes, setPaymentModes] = useState({ cash: 0, upi: 0, card: 0 });
  const [activePaymentType, setActivePaymentType] = useState('full'); 
  const [selectedSingleMode, setSelectedSingleMode] = useState('cash');
  const [waiterRequests, setWaiterRequests] = useState([]);
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
  const [rosterSearchQuery, setRosterSearchQuery] = useState("");
  const [topPerformers, setTopPerformers] = useState([]);
  const [bottomPerformers, setBottomPerformers] = useState([]);
  const [activePriceEditItem, setActivePriceEditItem] = useState(null);
  const [pendingDeleteStaff, setPendingDeleteStaff] = useState(null);
  const [tenantConfig, setTenantConfig] = useState(null);

  // ── These are re-fetched whenever viewDate changes (month selector)
  const [trendsData, setTrendsData] = useState(null);
  const [hourlyAnalytics, setHourlyAnalytics] = useState({ hourly: [], dayOfWeek: [] });
  const [prepTimeData, setPrepTimeData] = useState(null);
  const [profitabilityData, setProfitabilityData] = useState([]);
  const [procurementData, setProcurementData] = useState([]);
  const [staffEfficiency, setStaffEfficiency] = useState([]);
  const [categoryRankings, setCategoryRankings] = useState({});

  const [newInventoryItem, setNewInventoryItem] = useState({ itemName: '', unit: 'gm', currentStock: '', minThreshold: '', costPrice: '' });
  const [activeRecipeItemId, setActiveRecipeItemId] = useState('');
  const [recipeIngredientRows, setRecipeIngredientRows] = useState([{ inventoryId: '', quantityUsed: '' }]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  // ── NEW: recipe search
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  const [isSettling, setIsSettling] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: '', role: 'Waiter', age: '', contact: '', address: '',
    shiftType: 'Day Shift',
    joiningDate: (() => {
      const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })(),
    baseSalary: '', assignedTables: [], cookingRole: '' 
  });

  const [attendanceDate, setAttendanceDate] = useState(() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  });
  // ── attendanceLogs holds MONTHLY logs (for ledger count) + today (for clock-in UI)
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [ledgerSortConfig, setLedgerSortConfig] = useState({ key: 'name', direction: 'asc' });

  const [inventoryLoading, setInventoryLoading] = useState(false);
  // ─────────────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      axios.get(`${BASE_URL}/tenant/${tenantId}`).then(r => setTenantConfig(r.data)).catch(()=>{});
    }
  }, [isAuthenticated, tenantId]);


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

  // ── fetchAnalytics now takes an optional targetMonth (YYYY-MM) so it re-runs when viewDate changes
  const fetchAnalytics = useCallback(async (targetMonthOverride) => {
    try {
      const istNow = new Date(new Date().getTime() + 330*60*1000);
      const todayStr = istNow.toISOString().split('T')[0];

      const [analyticsRes, hourlyRes, trendsRes, prepRes, profitRes, procureRes, staffEffRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/analytics/${tenantId}`),
        axios.get(`${BASE_URL}/admin/analytics/hourly/${tenantId}?date=${todayStr}`),
        axios.get(`${BASE_URL}/admin/analytics/trends/${tenantId}`),
        axios.get(`${BASE_URL}/admin/analytics/preptime/${tenantId}`).catch(() => ({ data: null })),
        axios.get(`${BASE_URL}/admin/analytics/profitability/${tenantId}`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/admin/analytics/procurement/${tenantId}`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/admin/analytics/staff-efficiency/${tenantId}`).catch(() => ({ data: { efficiency: [] } }))
      ]);
      setAnalytics(analyticsRes.data.salesData || []);
      setTopPerformers(analyticsRes.data.topItems || []);
      setBottomPerformers(analyticsRes.data.bottomItems || []);
      setCategoryRankings(analyticsRes.data.categoryRankings || {});
      setHourlyAnalytics({ hourly: hourlyRes.data.hourly || [], dayOfWeek: hourlyRes.data.dayOfWeek || [] });
      setTrendsData(trendsRes.data);
      setPrepTimeData(prepRes.data);
      setProfitabilityData(profitRes.data || []);
      setProcurementData(procureRes.data || []);
      setStaffEfficiency(staffEffRes.data?.efficiency || []);
    } catch (err) { console.error("Analytics fetch error:", err); }
  }, [tenantId]);

const fetchManagementData = useCallback(async () => {
  setInventoryLoading(true);
  try {
    const [invRes, staffRes, menuRes] = await Promise.all([
      axios.get(`${BASE_URL}/inventory/${tenantId}`).catch(() => ({ data: [] })),
      axios.get(`${BASE_URL}/staff/${tenantId}`).catch(() => ({ data: [] })),
      axios.get(`${BASE_URL}/menu/${tenantId}`).catch(() => ({ data: [] }))
    ]);
    setInventory(invRes.data || []);
    setStaff(staffRes.data || []);
    setMenuItems(menuRes.data || []);
  } catch (err) { console.error("Management Sync Error", err); }
  finally { setInventoryLoading(false); }
}, [tenantId]);

  // ── Re-fetch analytics whenever viewDate (month) changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, viewDate, fetchAnalytics]);

  useEffect(() => {
    if (isAuthenticated) {
      socket.emit("join_restaurant", tenantId);
      fetchInitialData();
      fetchManagementData();

      socket.on("whatsapp_qr", (qr) => { setQrCode(qr); setIsBotReady(false); });
      socket.on("whatsapp_ready", () => { setIsBotReady(true); setQrCode(null); showNotif("System Linked", "success"); });
      socket.on("new_order", (order) => { 
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{}); 
        showNotif(`Order Update: Table ${order.tableNumber}`); 
        fetchInitialData(); 
      });
      socket.on("staff_wiped_live", (data) => {
        setStaff(prev => prev.filter(m => m._id !== data.staffId));
        setAttendanceLogs(prev => prev.filter(log => log.staffId !== data.staffId));
        showNotif("Roster sync updated.", "info");
      });
      socket.on("low_stock_alert", (data) => {
        showNotif(`LOW STOCK: ${data.itemName} — only ${data.currentStock}${data.unit} left`, "error");
        setLowStockAlerts(prev => {
          const exists = prev.find(a => a.itemName === data.itemName);
          return exists ? prev : [...prev, data];
        });
        fetchManagementData(); // refresh inventory numbers
      });
      socket.on("new_waiter_request", (request) => {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
        showNotif(`Service Request: Table ${request.tableNumber}`, "info");
        setWaiterRequests(prev => [request, ...prev]);
      });
      socket.on("menu_updated", (updatedItem) => {
        setMenuItems(prev => prev.map(item => item._id === updatedItem._id ? updatedItem : item));
      });
      socket.on("table_occupied_live", (data) => {
        setOrders(prevOrders => {
          const exists = prevOrders.some(o => o.tableNumber === data.tableNumber && o.status === 'pending');
          if (!exists) {
            return [{ _id: `live-stub-${Date.now()}`, tenantId, tableNumber: data.tableNumber, status: 'pending', items: [], createdAt: new Date() }, ...prevOrders];
          }
          return prevOrders;
        });
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
      });
      socket.on("bill_requested", (data) => {
        setCheckoutRequests(prev => [...new Set([...prev, data.tableNumber.toString()])]);
        new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(()=>{});
        showNotif(`Settlement Request: Table ${data.tableNumber}`);
      });
      socket.on("order_status_updated", (data) => {
        if (data && data.status === 'settled') {
          setCheckoutRequests(prev => prev.filter(t => t !== data.tableNumber?.toString()));
        }
        fetchInitialData();
        fetchAnalytics();
      });
    }
    return () => { socket.off(); };
  }, [isAuthenticated, tenantId, socket, fetchInitialData, fetchAnalytics, fetchManagementData]);

  // ── Attendance: fetch monthly logs when management tab opens or viewDate changes
  const fetchAttendanceForDate = useCallback(async (targetDate) => {
    try {
      const res = await axios.get(`${BASE_URL}/staff/attendance/log/${tenantId}/${targetDate}`);
      setAttendanceLogs(prev => {
        // Merge daily logs into existing set without blowing away monthly logs
        const dailyLogs = res.data || [];
        const otherLogs = prev.filter(l => l.date !== targetDate);
        return [...otherLogs, ...dailyLogs];
      });
    } catch (err) { console.error(err); }
  }, [tenantId]);

  useEffect(() => {
    if (activeTab === 'management') {
      const monthPrefix = viewDate.getFullYear() + '-' + String(viewDate.getMonth()+1).padStart(2,'0');
      // Fetch all logs for the selected month (for the ledger count column)
      axios.get(`${BASE_URL}/staff/attendance/log/${tenantId}/${monthPrefix}`)
        .then(r => setAttendanceLogs(r.data || []))
        .catch(()=>{});
      // Also fetch today so clock-in panel is accurate
      fetchAttendanceForDate(attendanceDate);
    }
  }, [activeTab, viewDate, attendanceDate, fetchAttendanceForDate, tenantId]);

  // ─────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────
  const currentMonthAnalytics = useMemo(() => {
    if (!analytics || !Array.isArray(analytics)) return [];
    const monthStr = (viewDate.getMonth()+1).toString().padStart(2,'0');
    const yearStr = viewDate.getFullYear().toString();
    return analytics.filter(d => d._id && d._id.startsWith(`${yearStr}-${monthStr}`));
  }, [analytics, viewDate]);

  const stats = useMemo(() => {
    const revenue = currentMonthAnalytics.reduce((a,b) => a+(b.revenue||0), 0);
    const count   = currentMonthAnalytics.reduce((a,b) => a+(b.count||0), 0);
    // Real loyalty from trendsData
    const loyaltyRate = trendsData?.customers?.total > 0
      ? trendsData.customers.repeatPct
      : 0;
    return { revenue, avg: count > 0 ? (revenue/count).toFixed(0) : 0, loyaltyRate };
  }, [currentMonthAnalytics, trendsData]);

const hudLiveCounterBreakdown = useMemo(() => {
  const fallback = { total: 0, direct: 0, takeaway: 0, online: 0 };
  if (!analytics?.length) return fallback;
  
  // Count ALL entries for today (each settled order = one entry with count:1)
  const todayEntries = analytics.filter(d => d._id === attendanceDate);
  if (!todayEntries.length) return fallback;

  let direct = 0, takeaway = 0, online = 0;
  todayEntries.forEach(entry => {
    const src = (entry.source || 'direct').toLowerCase();
    if (src === 'takeaway') takeaway += (entry.count || 1);
    else if (src === 'zomato' || src === 'swiggy' || src === 'online') online += (entry.count || 1);
    else direct += (entry.count || 1);
  });

  return { total: direct + takeaway + online, direct, takeaway, online };
}, [analytics, attendanceDate]);

  const occupiedTables = useMemo(() => [
    ...new Set(orders.filter(o => ['pending','ready','served'].includes(o.status)).map(o => o.tableNumber.toString()))
  ], [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.status === 'served' || order.status === 'settled') return false;
      const minutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
      if (orderZone === 'delayed') return minutes >= 15;
      if (orderZone === 'fresh')   return minutes < 15;
      return true;
    });
  }, [orders, orderZone]);

  const dailySettlementBreakdown = useMemo(() => {
    let cashSum=0, upiSum=0, cardSum=0;
    if (analytics?.length) {
      analytics.filter(d => d._id === attendanceDate).forEach(r => {
        cashSum += Number(r.cash || 0);
        upiSum  += Number(r.upi  || 0);
        cardSum += Number(r.card || 0);
      });
    }
    return { cash: cashSum, upi: upiSum, card: cardSum, gross: cashSum+upiSum+cardSum };
  }, [analytics, attendanceDate]);

  const advancedStats = useMemo(() => {
    const sources = { direct: 0, zomato: 0, swiggy: 0, takeaway: 0 };
    currentMonthAnalytics.forEach(day => {
      const k = day.source ? day.source.toLowerCase() : 'direct';
      if (sources.hasOwnProperty(k)) sources[k] += Number(day.revenue||0);
      else sources.direct += Number(day.revenue||0);
    });
    return { sources };
  }, [currentMonthAnalytics]);

  const filteredStaff = useMemo(() => {
    let list = staff.filter(m => m.name.toLowerCase().includes(rosterSearchQuery.toLowerCase()));
    if (ledgerSortConfig.key) {
      list.sort((a,b) => {
        let vA = a[ledgerSortConfig.key], vB = b[ledgerSortConfig.key];
        if (ledgerSortConfig.key === 'baseSalary') { vA = Number(a.baseSalary)||0; vB = Number(b.baseSalary)||0; }
        if (ledgerSortConfig.key === 'monthlyAttendance') {
          const p = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
          vA = attendanceLogs.filter(l => (l.staffId===a._id||l.staffId?.toString()===a._id?.toString()) && l.date?.startsWith(p)).length;
          vB = attendanceLogs.filter(l => (l.staffId===b._id||l.staffId?.toString()===b._id?.toString()) && l.date?.startsWith(p)).length;
        }
        if (ledgerSortConfig.key === 'joiningDate') { vA = new Date(a.joiningDate||0).getTime(); vB = new Date(b.joiningDate||0).getTime(); }
        if (vA < vB) return ledgerSortConfig.direction === 'asc' ? -1 : 1;
        if (vA > vB) return ledgerSortConfig.direction === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return list;
  }, [staff, rosterSearchQuery, ledgerSortConfig, attendanceLogs, viewDate]);

  const totalPayrollValue = useMemo(() =>
    filteredStaff.reduce((acc,m) => m.salaryStatus==='Paid' ? acc : acc+(Number(m.baseSalary)||0), 0)
  , [filteredStaff]);

const liveFloorIntelligence = useMemo(() => {
  // Only use TODAY's attendance for live count
  const todayPunches = attendanceLogs.filter(l =>
    l.date === attendanceDate && l.clockIn && !l.clockOut
  );
  const presentIds = todayPunches.map(l => l.staffId?.toString());
  const present = staff.filter(s => presentIds.includes(s._id?.toString()));

  const covered = [...new Set(present.flatMap(s => s.assignedTables || []))]
    .sort((a, b) => Number(a) - Number(b));

  return {
    activeChefs: present.filter(s => s.role === 'Chef').length,
    activeHelpers: present.filter(s => s.role === 'Helper').length,
    activeWaiters: present.filter(s => s.role === 'Waiter').length,
    coveredCount: covered.length,
    coveredList: covered.map(t => `T${t}`).join(', ') || 'NONE'
  };
}, [staff, attendanceLogs, attendanceDate]);

  const insightsData = useMemo(() => {
    const margins = menuItems.map(m => ({
      name: m.name,
      margin: m.price ? (((m.price-(m.costPrice||m.price*0.5))/m.price)*100).toFixed(0) : 0
    })).sort((a,b)=>b.margin-a.margin).slice(0,3);
    const peakHour = hourlyAnalytics.hourly.length
      ? hourlyAnalytics.hourly.reduce((a,b)=>b.orderCount>a.orderCount?b:a, hourlyAnalytics.hourly[0])?.hour || 0
      : 0;
    const digest = `Monthly revenue: ₹${stats.revenue.toLocaleString()}. Peak activity around ${peakHour}:00. ${margins[0]?.name||'Top dish'} leads margins at ${margins[0]?.margin}%.`;
    return { margins, digest };
  }, [menuItems, stats.revenue, hourlyAnalytics]);

  // ─────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────
  const showNotif = (msg, type='success') => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(p=>({...p, show:false})), 4000);
  };

  const requestLedgerSort = (key) => {
    setLedgerSortConfig(prev => ({ key, direction: prev.key===key && prev.direction==='asc' ? 'desc' : 'asc' }));
  };

  const changeMonth = (offset) => {
    setViewDate(prev => { const d=new Date(prev); d.setMonth(d.getMonth()+offset); return d; });
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
    } catch { showNotif("Invalid Credentials", "error"); }
  };

  const handleLogout = () => {
    setConfirmModal({ show:true, title:"Terminate Session", subtitle:"Closing dashboard and clearing cache.",
      onConfirm: ()=>{ localStorage.clear(); window.location.reload(); } });
  };

  const generateBill = async (id) => {
    setSelectedTable(id);
    setDiscount(0);
    setPaymentModes({ cash:0, upi:0, card:0 });
    try {
      const [res, countRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/bill/${tenantId}/${id}`),
        axios.get(`${BASE_URL}/admin/daily-bill-count/${tenantId}`).catch(()=>({ data:{ nextBillNo:1 } }))
      ]);
      const rawItems = res.data.flatMap(o => o.items);
      if (!rawItems.length) { setTableBill(null); return; }
      const aggregated = rawItems.reduce((acc, item) => {
        const ex = acc.find(i => i.name===item.name);
        if (ex) { ex.quantity += Number(item.quantity||1); ex.subtotal += Number(item.subtotal||0); }
        else acc.push({...item, quantity:Number(item.quantity||1), subtotal:Number(item.subtotal||0)});
        return acc;
      }, []);
      setTableBill({
        items: aggregated,
        total: aggregated.reduce((a,i)=>a+i.subtotal, 0),
        billNo: countRes.data.nextBillNo,
        date: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}).toUpperCase(),
        time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true})
      });
    } catch (err) { console.error("Bill Error:", err); }
  };

const settleBill = () => {
    if (isSettling) return; // Guard here too
    const finalAmt = Math.round(tableBill.total - (tableBill.total * (discount / 100)));
    if (activePaymentType === 'split') {
        const total = Number(paymentModes.cash || 0) + Number(paymentModes.upi || 0) + Number(paymentModes.card || 0);
        if (Math.abs(total - finalAmt) > 1) { showNotif(`Mismatch: ₹${total} vs ₹${finalAmt}`, "error"); return; }
    }
    setConfirmModal({
        show: true, title: 'Finalize Table Settlement?',
        subtitle: `Total: ₹${finalAmt} | Mode: ${activePaymentType.toUpperCase()}`,
        onConfirm: handleFinalSettle
    });
};

    useEffect(() => {
  if (activeTab === 'inventory' || activeTab === 'recipes') {
    fetchManagementData();
  }
}, [activeTab, fetchManagementData]);


const handleFinalSettle = async () => {
    // 🔒 PREVENT DOUBLE-FIRE: Guard against multiple clicks
    if (isSettling) return;
    setIsSettling(true);
    
    const finalAmt = Math.round(tableBill.total - (tableBill.total * (discount / 100)));
    const paymentMethodDetails = activePaymentType === 'split'
        ? { type: 'split', breakdown: { cash: Number(paymentModes.cash || 0), upi: Number(paymentModes.upi || 0), card: Number(paymentModes.card || 0) } }
        : { type: 'full', method: selectedSingleMode };
    
    // Close modal immediately to prevent re-trigger
    setConfirmModal({ show: false, title: '', subtitle: '', onConfirm: null });
    
    try {
        const res = await axios.patch(`${BASE_URL}/admin/settle/${tenantId}/${selectedTable}`, {
            discount, finalAmount: finalAmt, paymentMethods: paymentMethodDetails, customerPhone: ""
        });
        
        if (res.data?.duplicate) {
            showNotif(`Already settled — Invoice #${res.data.billNo}`, "info");
            setTableBill(null);
            setSelectedTable(null);
            await fetchInitialData();
            await fetchAnalytics();
            return;
        }
        
        if (res.data?.billNo) {
            setTableBill(p => ({ ...p, billNo: res.data.billNo }));
            showNotif(`Invoice #${res.data.billNo} Generated`, "success");
            
            // Immediately remove from local state so table goes dark NOW
            setOrders(prev => prev.filter(o =>
                !(o.tableNumber === selectedTable)
            ));
            
            // Delay cleanup to show success briefly
            setTimeout(async () => {
                setTableBill(null);
                setSelectedTable(null);
                setPaymentModes({ cash: 0, upi: 0, card: 0 });
                setActivePaymentType('full');
                await fetchInitialData();
                await fetchAnalytics();
                fetchManagementData();
            }, 1500);
        }
    } catch (err) {
        showNotif("Failed to save to database", "error");
    } finally {
        setIsSettling(false);
    }
};
  const updateMenu = async (itemId, updateData) => {
    try {
      const res = await axios.patch(`${BASE_URL}/menu-item/${itemId}`, updateData);
      socket.emit("menu_change_detected", { tenantId, itemId, updateData:res.data });
      fetchInitialData();
      showNotif("Price/Visibility Synced Live");
    } catch { showNotif("Sync Failed","error"); }
  };

  const completeWaiterRequest = async (requestId) => {
    try {
      await axios.patch(`${BASE_URL}/admin/waiter-requests/${requestId}/complete`);
      setWaiterRequests(prev=>prev.filter(r=>r._id!==requestId));
      showNotif("Service Call Resolved");
    } catch { showNotif("Error clearing request","error"); }
  };

  const handleBroadcast = async () => {
    if (!broadcastText && !selectedBroadcastItem) return;
    setIsBroadcasting(true);
    try {
      const item = menuItems.find(i=>i._id===selectedBroadcastItem);
      await axios.post(`${BASE_URL}/admin/broadcast`,{tenantId, itemName:item?.name||'', customOffer:broadcastText});
      showNotif("Campaign Dispatched"); setBroadcastMsg("");
    } catch { showNotif("Broadcast failed","error"); }
    finally { setIsBroadcasting(false); }
  };

 const exportToExcel = useCallback((type = 'daily') => {
    import('xlsx').then(XLSX => {
        const wb = XLSX.utils.book_new();

        if (type === 'inventory') {
            const invRows = inventory.map(item => ({
                'Ingredient': item.itemName,
                'Unit': item.unit,
                'Current Stock': item.currentStock,
                'Min Threshold': item.minThreshold,
                'Cost Price (₹/unit)': item.costPrice,
                'Stock Value (₹)': Math.round(item.currentStock * item.costPrice),
                'Status': item.currentStock <= item.minThreshold ? 'LOW STOCK' : 'OK',
            }));
            const ws = XLSX.utils.json_to_sheet(invRows);
            ws['!cols'] = [20,10,14,14,18,16,12].map(w => ({ wch: w }));
            XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
            XLSX.writeFile(wb, `Pratyeksha_Inventory_${attendanceDate}.xlsx`);
            showNotif("Inventory report exported");
            return;
        }

        const now = new Date();
        const istNow = new Date(now.getTime() + 330 * 60 * 1000);
        const todayStr = istNow.toISOString().split('T')[0];
        const currMonthPrefix = todayStr.slice(0, 7);

        let filteredData = analytics;
        if (type === 'daily') {
            filteredData = analytics.filter(d => d._id === todayStr);
        } else if (type === 'weekly') {
            const weekAgo = new Date(istNow.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            filteredData = analytics.filter(d => d._id >= weekAgo && d._id <= todayStr);
        } else if (type === 'monthly') {
            filteredData = analytics.filter(d => d._id?.startsWith(currMonthPrefix));
        }

        // ── Sheet 1: Revenue breakdown ──
        const revRows = filteredData.map(d => ({
            'Date': d._id,
            'Revenue (₹)': d.revenue || 0,
            'Orders': d.count || 0,
            'Avg Order (₹)': d.count > 0 ? Math.round((d.revenue || 0) / d.count) : 0,
            'Cash (₹)': d.cash || 0,
            'UPI (₹)': d.upi || 0,
            'Card (₹)': d.card || 0,
            'Source': d.source || 'direct'
        }));
        const revWs = XLSX.utils.json_to_sheet(revRows);
        revWs['!cols'] = [12,14,8,14,12,12,12,10].map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, revWs, 'Revenue');

        // ── Sheet 2: Top dishes ──
        if (topPerformers.length > 0) {
            const dishRows = topPerformers.map((d, i) => ({
                'Rank': i + 1,
                'Dish Name': d.name,
                'Units Sold': d.sold,
                'Category': d.category || '—'
            }));
            const dishWs = XLSX.utils.json_to_sheet(dishRows);
            XLSX.utils.book_append_sheet(wb, dishWs, 'Top Dishes');
        }

        // ── Sheet 3: Profitability ──
        if (profitabilityData.length > 0) {
            const profRows = profitabilityData.map(d => ({
                'Dish': d.name,
                'Selling Price (₹)': d.sellingPrice,
                'Ingredient Cost (₹)': d.ingredientCost,
                'Profit (₹)': d.profit,
                'Margin %': d.marginPct,
                'Recipe Linked': d.hasRecipe ? 'Yes' : 'No (estimated)'
            }));
            const profWs = XLSX.utils.json_to_sheet(profRows);
            XLSX.utils.book_append_sheet(wb, profWs, 'Profitability');
        }

        // ── Sheet 4: Inventory status ──
        if (inventory.length > 0) {
            const invRows = inventory.map(item => ({
                'Ingredient': item.itemName,
                'Unit': item.unit,
                'Current Stock': item.currentStock,
                'Min Threshold': item.minThreshold,
                'Cost (₹)': item.costPrice,
                'Stock Value (₹)': Math.round(item.currentStock * item.costPrice),
                'Status': item.currentStock <= item.minThreshold ? 'LOW STOCK' : 'OK'
            }));
            const invWs = XLSX.utils.json_to_sheet(invRows);
            XLSX.utils.book_append_sheet(wb, invWs, 'Inventory');
        }

        // ── Sheet 5: Staff efficiency ──
        if (staffEfficiency.length > 0) {
            const staffRows = staffEfficiency.map(s => ({
                'Name': s.name,
                'Role': s.role,
                'Days Present': s.daysPresent,
                'Hours Logged': s.totalHours,
                'Base Salary (₹)': s.baseSalary,
                'Salary Status': s.salaryStatus,
                'Rev Attributed (₹)': s.revenueAttributed,
                'Rev/Hour (₹)': s.revenuePerHour
            }));
            const staffWs = XLSX.utils.json_to_sheet(staffRows);
            XLSX.utils.book_append_sheet(wb, staffWs, 'Staff Efficiency');
        }

        // ── Sheet 6: Summary ──
        const totalRev = filteredData.reduce((a, b) => a + (b.revenue || 0), 0);
        const totalOrders = filteredData.reduce((a, b) => a + (b.count || 0), 0);
        const totalCash = filteredData.reduce((a, b) => a + (b.cash || 0), 0);
        const totalUPI = filteredData.reduce((a, b) => a + (b.upi || 0), 0);
        const totalCard = filteredData.reduce((a, b) => a + (b.card || 0), 0);
        const summaryRows = [
            { Metric: 'Period', Value: type.toUpperCase() },
            { Metric: 'Total Revenue (₹)', Value: totalRev },
            { Metric: 'Total Orders', Value: totalOrders },
            { Metric: 'Avg Order Value (₹)', Value: totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0 },
            { Metric: 'Cash Collections (₹)', Value: totalCash },
            { Metric: 'UPI Collections (₹)', Value: totalUPI },
            { Metric: 'Card Collections (₹)', Value: totalCard },
            { Metric: 'Total Inventory Value (₹)', Value: inventory.reduce((a, i) => a + Math.round(i.currentStock * i.costPrice), 0) },
            { Metric: 'Restaurant', Value: tenantConfig?.name || tenantId },
            { Metric: 'Generated At', Value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
        ];
        const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
        summaryWs['!cols'] = [30, 30].map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        XLSX.writeFile(wb, `Pratyeksha_${tenantConfig?.name || 'Report'}_${type}_${todayStr}.xlsx`);
        showNotif(`${type.toUpperCase()} report exported — ${Object.keys(wb.Sheets).length} sheets`);
    }).catch(err => { console.error(err); showNotif("Export failed — check xlsx install", "error"); });
}, [analytics, inventory, topPerformers, profitabilityData, staffEfficiency, attendanceDate, tenantConfig, tenantId]);

  const renderMonthHeatmap = () => {
    const year=viewDate.getFullYear(), month=viewDate.getMonth();
    const daysInMonth=new Date(year,month+1,0).getDate(), firstDay=new Date(year,month,1).getDay();
    const maxRev=Math.max(...currentMonthAnalytics.map(a=>a.revenue||0),1);
    const grid=[];
    for(let x=0;x<firstDay;x++) grid.push(<div key={`p${x}`} style={styles.heatSquareEmpty}/>);
    for(let i=1;i<=daysInMonth;i++){
      const dateStr=`${year}-${(month+1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`;
      const rev=(currentMonthAnalytics.find(d=>d._id===dateStr)||{}).revenue||0;
      grid.push(
        <motion.div key={i} whileHover={{scale:1.1,zIndex:10}} style={{
          ...styles.heatSquare,
          background:rev>0?`rgba(211,191,162,${Math.max(0.15,rev/maxRev)})`:'#111',
          border:rev>(maxRev*0.7)?'1px solid #d3bfa2':'1px solid #1a1a1a'
        }}>
          <span style={{fontSize:'0.75rem',color:rev>(maxRev*0.5)?'#000':'#444',fontWeight:'800'}}>{i}</span>
        </motion.div>
      );
    }
    return grid;
  };

  // ─────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────
  if (!isAuthenticated) return (
    <div style={styles.loginOverlay}>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} style={styles.loginBox}>
        <img src={logoPath} alt="Logo" style={styles.sidebarLogo}/>
        <h2 style={{fontSize:'1.2rem',marginBottom:'30px',fontWeight:'900'}}>ADMIN COMMAND CENTER</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" style={styles.input} onChange={e=>setLoginData({...loginData,username:e.target.value})}/>
          <input type="password" placeholder="Access PIN" style={styles.input} onChange={e=>setLoginData({...loginData,password:e.target.value})}/>
          <button type="submit" style={styles.mainBtn}>INITIALIZE</button>
        </form>
      </motion.div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  // MAIN RENDER — NOTE: ALL tab panels are siblings under <section>,
  // NOT nested inside modal AnimatePresence blocks
  // ─────────────────────────────────────────────────────
  return (
    <div style={styles.dashboard}>
      {/* TOAST */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
            style={{...styles.toast, borderLeft:`4px solid ${notif.type==='success'?'#d3bfa2':'#8a704d'}`}}>
            <Zap size={16} color={notif.type==='success'?'#d3bfa2':'#8a704d'}/> {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop} className="sidebar-nav">
          <div style={styles.logoWrapper}><img src={logoPath} alt="Logo" style={styles.sidebarLogo}/></div>
          <nav style={styles.navStack}>
            {[
              {id:'pending',  label:'LIVE KITCHEN',  icon:<CookingPot size={18}/>},
              {id:'menu',     label:'MENU EDITOR',   icon:<UtensilsCrossed size={18}/>},
              {id:'billing',  label:'BILLING HUB',   icon:<ReceiptIndianRupee size={18}/>},
              {id:'marketing',label:'CAMPAIGN HUB',  icon:<MessageSquare size={18}/>},
              {id:'insights', label:'INSIGHTS',      icon:<BarChart3 size={18}/>},
              {id:'management',label:'MANAGEMENT',   icon:<ShieldCheck size={18}/>},
              {id:'inventory',label:'INVENTORY',     icon:<Layers size={18}/>},
              {id:'recipes',  label:'RECIPES',       icon:<ChefHat size={18}/>},
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                style={activeTab===tab.id?styles.activeTab:styles.navBtn}>
                <span style={{marginRight:'15px'}}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
          <div style={styles.operatorCard}><User size={16} color="#d3bfa2"/><div><div style={{fontSize:'0.75rem',fontWeight:'900'}}>MANAGER</div><div style={{fontSize:'0.6rem',color:'#444'}}>SESSION ACTIVE</div></div></div>
          <button onClick={handleLogout} style={styles.logoutBtn}>LOGOUT TERMINAL</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={styles.mainContent}>
        <header style={styles.topHeader}>
          <div><h1 style={styles.pageTitle}>{activeTab.replace('_',' ').toUpperCase()}</h1></div>
          {/* ── Billing HUD ── */}
          {activeTab==='billing' && (
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={styles.hudCountersRow}>
              {[
                {label:"TODAY'S INVOICES", val:hudLiveCounterBreakdown.total, color:'#d3bfa2'},
                {label:"DINE-IN SETTLED",  val:hudLiveCounterBreakdown.direct},
                {label:"TAKEAWAY SETTLED", val:hudLiveCounterBreakdown.takeaway},
                {label:"ONLINE SETTLED",   val:hudLiveCounterBreakdown.online},
              ].map((s,i)=>(
                <div key={i} style={{...styles.hudStatBox, borderLeft:i>0?'1px solid #1c1f26':'none'}}>
                  <small style={{...styles.hudStatLabel, color:i===0?'#bda88a':undefined}}>{s.label}</small>
                  <div style={{...styles.hudStatValue,color:s.color||'#fff'}} className="mono">
                    {s.val<10?`0${s.val}`:s.val}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          {/* ── Insights month selector ── */}
          {activeTab==='insights' && (
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={styles.headerMonthSelector}>
                <button onClick={()=>changeMonth(-1)} style={styles.headerMonthNav}><ChevronLeft size={16}/></button>
                <div style={styles.headerMonthDisplay}>
                  <Calendar size={14} color="#d3bfa2"/>
                  <span style={{fontWeight:'900',fontSize:'0.85rem'}}>
                    {viewDate.toLocaleString('default',{month:'short',year:'numeric'}).toUpperCase()}
                  </span>
                </div>
                <button onClick={()=>changeMonth(1)} style={styles.headerMonthNav}><ChevronRight size={16}/></button>
              </div>
              {['daily','weekly','monthly'].map(p=>(
                <button key={p} onClick={()=>exportToExcel(p)}
                  style={{padding:'6px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555',borderRadius:'8px',fontSize:'0.6rem',fontWeight:'900',cursor:'pointer'}}>
                  {p.toUpperCase()} XLS
                </button>
              ))}
            </div>
          )}
          {activeTab==='pending' && (
            <div style={styles.zoneControl}>
              {['all','fresh','delayed'].map(z=>(
                <button key={z} onClick={()=>setOrderZone(z)} style={orderZone===z?styles.activeZoneBtn:styles.zoneBtn}>
                  {z.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          {activeTab==='menu' && tenantConfig && (
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <span style={{fontSize:'0.65rem',color:'#555',fontWeight:'900'}}>AUTO-HIDE ON LOW STOCK</span>
              <button onClick={async()=>{
                const nv=!tenantConfig.config?.autoHideDishesOnLowStock;
                await axios.patch(`${BASE_URL}/tenant/config/${tenantId}`,{key:'autoHideDishesOnLowStock',value:nv});
                setTenantConfig(p=>({...p,config:{...p.config,autoHideDishesOnLowStock:nv}}));
                showNotif(`Auto-hide ${nv?'enabled':'disabled'}`);
              }} style={{padding:'6px 14px',borderRadius:'8px',border:'none',fontSize:'0.65rem',fontWeight:'900',cursor:'pointer',
                background:tenantConfig.config?.autoHideDishesOnLowStock?'#d3bfa2':'#1a1a1a',
                color:tenantConfig.config?.autoHideDishesOnLowStock?'#000':'#444'}}>
                {tenantConfig.config?.autoHideDishesOnLowStock?'ON':'OFF'}
              </button>
            </div>
          )}
        </header>

        {/* ════════════════════════════════════════════════
            SCROLL AREA — all tab content lives here, 
            NOT inside any modal/AnimatePresence wrapper
            ════════════════════════════════════════════════ */}
        <section style={styles.scrollArea} className="custom-scroll">

          {/* ── PENDING ── */}
          {activeTab==='pending' && (
            <motion.div key="pending" initial={{opacity:0}} animate={{opacity:1}}
              style={{display:'flex',gap:'30px',alignItems:'flex-start',width:'100%'}}>
              <div style={{flex:1.2}}>
                <h3 style={styles.gridLabel}>KITCHEN TICKETS</h3>
                {filteredOrders.length>0 ? filteredOrders.map(order=>(
                  <div key={order._id} style={styles.orderRow}>
                    <div style={styles.tableCircle}>{order.tableNumber}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'900',fontSize:'0.9rem',color:'#fff'}}>TABLE {order.tableNumber}</div>
                      <div style={{color:'#d3bfa2',marginTop:'5px',fontSize:'0.8rem',fontWeight:'bold'}}>
                        {order.items.map(it=>`${it.quantity}x ${it.name}`).join(' • ')}
                      </div>
                    </div>
                    <OperatorLiveTimer createdAt={order.createdAt}/>
                  </div>
                )) : (
                  <div style={{textAlign:'center',opacity:0.5,fontSize:'0.8rem',padding:'40px',background:'#0d0d0d',borderRadius:'15px'}}>NO ACTIVE ORDERS</div>
                )}
              </div>
              <div style={{flex:1,borderLeft:'1px solid #1a1a1a',paddingLeft:'30px'}}>
                <h3 style={styles.gridLabel}>ACTIVE SERVICE CALLS</h3>
                {waiterRequests.length>0 ? waiterRequests.map(req=>(
                  <motion.div initial={{x:20,opacity:0}} animate={{x:0,opacity:1}} key={req._id}
                    style={{...styles.waiterRequestRow,gap:'15px',padding:'15px'}}>
                    <div style={{...styles.goldCircle,width:'35px',height:'35px'}}><BellRing size={16}/></div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'900',color:'#d4af37',fontSize:'0.8rem'}}>TABLE {req.tableNumber}</div>
                      <div style={{fontSize:'0.75rem',color:'#fff',marginTop:'2px'}}>{req.serviceRequest}</div>
                    </div>
                    <button onClick={()=>completeWaiterRequest(req._id)} style={{...styles.doneBtn,padding:'6px 12px',fontSize:'0.6rem'}}>DONE</button>
                  </motion.div>
                )) : (
                  <div style={{textAlign:'center',opacity:0.3,fontSize:'0.7rem',padding:'20px'}}>NO PENDING REQUESTS</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── MENU ── */}
          {activeTab==='menu' && (
            <motion.div key="menu" initial={{opacity:0}} animate={{opacity:1}} style={styles.fullWidthGrid}>
              {menuItems.filter(i=>i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item=>(
                <div key={item._id} style={{...styles.premiumCard,opacity:item.isAvailable?1:0.4}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px'}}>
                    <h3 style={{margin:0,fontSize:'1rem',fontWeight:'900'}}>{item.name}</h3>
                    <span style={{color:'#d3bfa2',fontWeight:'bold'}}>₹{item.price}</span>
                  </div>
                  <div style={{display:'flex',gap:'10px'}}>
                    <button onClick={()=>setActivePriceEditItem(item)} style={styles.ghostBtn}>PRICING</button>
                    <button onClick={()=>updateMenu(item._id,{isAvailable:!item.isAvailable})}
                      style={item.isAvailable?styles.toggleHideBtn:styles.toggleShowBtn}>
                      {item.isAvailable?"VISIBILITY ON":"VISIBILITY OFF"}
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── BILLING ── */}
          {activeTab==='billing' && (
            <motion.div key="billing" initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',gap:'50px'}}>
              <div style={{flex:1}}>
                <div style={styles.specialModeRow}>
                  <button onClick={()=>generateBill('Takeaway')} style={selectedTable==='Takeaway'?styles.activeSpecBtn:styles.specBtn}><ShoppingBag size={16}/> DIRECT TAKEAWAY</button>
                  <button onClick={()=>generateBill('Online')} style={selectedTable==='Online'?styles.activeSpecBtn:styles.specBtn}><Truck size={16}/> ONLINE ORDERING</button>
                </div>
                <h3 style={styles.gridLabel}>DINING FLOOR OCCUPANCY</h3>
                <div style={styles.tableGrid}>
                  {Array.from({length:tableCount},(_,i)=>i+1).map(n=>{
                    const id=n.toString(), isOcc=occupiedTables.includes(id),
                      hasChk=checkoutRequests.includes(id), isSel=selectedTable===id;
                    return (
                      <button key={n} onClick={()=>generateBill(id)} style={{
                        ...styles.tableBtn, transition:'all 0.2s ease',
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px',
                        background:isSel?'#d3bfa2':hasChk?'rgba(211,191,162,0.15)':isOcc?'#111111':'#0d0d0d',
                        color:isSel?'#000':hasChk?'#d3bfa2':isOcc?'rgba(211,191,162,0.6)':'#333',
                        border:isSel?'1px solid #d3bfa2':hasChk?'1px dashed #d3bfa2':isOcc?'1px solid rgba(211,191,162,0.25)':'1px solid #151515'
                      }}>
                        {hasChk && <motion.div animate={{scale:[1,1.1,1]}} transition={{repeat:Infinity,duration:2}}><BellRing size={16} style={{color:'#d3bfa2'}}/></motion.div>}
                        <span style={{fontSize:'1.05rem',fontWeight:'900'}}>T{n}</span>
                        {isOcc&&!hasChk&&!isSel&&<div style={{width:'5px',height:'5px',background:'#8a704d',borderRadius:'50%'}}/>}
                      </button>
                    );
                  })}
                </div>
                <div style={{...styles.biCard,marginTop:'25px',borderTop:'2px solid #d3bfa2',background:'#090909',padding:'20px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'15px',textAlign:'center'}}>
                    {[['DAILY CASH PORTFOLIO',dailySettlementBreakdown.cash],['DAILY UPI INSTANT NET',dailySettlementBreakdown.upi],['DAILY CARD CAPTURES',dailySettlementBreakdown.card]].map(([label,val])=>(
                      <div key={label}><small style={{...styles.statLabel,color:'#666',letterSpacing:'0.5px'}}>{label}</small>
                      <div style={{fontSize:'1.15rem',fontWeight:'900',color:'#fff',marginTop:'4px'}}>₹{val.toLocaleString()}</div></div>
                    ))}
                    <div style={{borderLeft:'1px solid #151515',paddingLeft:'15px'}}>
                      <small style={{...styles.statLabel,color:'#d3bfa2',fontWeight:'900'}}>DAILY GROSS SETTLED</small>
                      <div style={{fontSize:'1.35rem',fontWeight:'900',color:'#d3bfa2',marginTop:'2px'}}>₹{dailySettlementBreakdown.gross.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
              {tableBill && (
                <motion.div initial={{x:20,opacity:0}} animate={{x:0,opacity:1}} style={styles.receipt}>
                  <div style={{textAlign:'center',marginBottom:'20px'}}>
                    <h4 style={{margin:0,fontSize:'0.7rem',letterSpacing:'2px',fontWeight:'800'}}>TAX INVOICE</h4>
                    <h1 style={{margin:'5px 0',fontSize:'1.7rem',fontWeight:'900',textTransform:'uppercase'}}>
                      {tenantConfig?.name||tenantId.split('_').join(' ')}
                    </h1>
                    <p style={{fontSize:'0.65rem',fontWeight:'700',color:'#444',margin:'0 0 5px'}}>
                      {tenantConfig?.address?`${tenantConfig.address.street}, ${tenantConfig.address.city}`:"Address Loading..."}
                    </p>
                    <p style={{fontSize:'0.7rem',fontWeight:'800'}}>GSTIN: {tenantConfig?.gstin||"27AABCU1234F1Z5"}</p>
                  </div>
                  <div style={{borderTop:'2px solid #000',borderBottom:'2px solid #000',padding:'8px 0',display:'flex',justifyContent:'space-between'}}>
                    <div><div style={{fontSize:'0.6rem',fontWeight:'900',color:'#666'}}>BILL NO.</div><div style={{fontSize:'1.1rem',fontWeight:'900'}}>#{tableBill.billNo}</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontSize:'0.75rem',fontWeight:'800'}}>{tableBill.date}</div><div style={{fontSize:'0.7rem'}}>{tableBill.time}</div></div>
                  </div>
                  <div style={{padding:'10px 0'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.6rem',fontWeight:'900',color:'#888',marginBottom:'10px'}}><span>ITEM DESCRIPTION</span><span>TOTAL</span></div>
                    {tableBill.items.map((it,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:'10px',fontSize:'0.85rem'}}>
                        <span style={{fontWeight:'700'}}>{it.quantity}x {it.name}<br/><small style={{color:'#999'}}>@ ₹{it.pricePerUnit||(it.subtotal/it.quantity).toFixed(0)}</small></span>
                        <b>₹{it.subtotal}</b>
                      </div>
                    ))}
                  </div>
                  <div style={{borderTop:'1px solid #eee',paddingTop:'15px',fontSize:'0.8rem'}}>
                    <div style={styles.receiptRow}><span>Subtotal</span><span>₹{(tableBill.total/1.05).toFixed(2)}</span></div>
                    <div style={styles.receiptRow}><span>CGST (2.5%)</span><span>₹{(tableBill.total*0.025).toFixed(2)}</span></div>
                    <div style={styles.receiptRow}><span>SGST (2.5%)</span><span>₹{(tableBill.total*0.025).toFixed(2)}</span></div>
                    <p style={{fontSize:'0.6rem',fontStyle:'italic',marginTop:'8px',fontWeight:'700',color:'#666'}}>
                      Rupees: {numberToWords(Math.round(tableBill.total-(tableBill.total*(discount/100))))}
                    </p>
                  </div>
                  <div style={{borderTop:'1px dashed #ddd',marginTop:'15px',paddingTop:'15px'}}>
                    <div style={styles.receiptRow}>
                      <span style={{fontWeight:'900'}}>DISCOUNT %</span>
                      <input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} style={styles.discountInput}/>
                    </div>
                  </div>
                  <div style={{margin:'20px 0'}}>
                    <div style={{display:'flex',gap:'5px',marginBottom:'20px',background:'#f5f5f5',padding:'4px',borderRadius:'10px'}}>
                      <button onClick={()=>setActivePaymentType('full')} style={activePaymentType==='full'?styles.activeMiniTab:styles.miniTab}>SINGLE MODE</button>
                      <button onClick={()=>setActivePaymentType('split')} style={activePaymentType==='split'?styles.activeMiniTab:styles.miniTab}>SPLIT BILL</button>
                    </div>
                    {activePaymentType==='split' ? (
                      <div style={{display:'flex',flexDirection:'column',gap:'15px'}}>
                        {[['CASH',<Banknote size={14}/>,'cash'],['UPI',<Smartphone size={14}/>,'upi'],['CARD',<CreditCard size={14}/>,'card']].map(([lbl,ico,key])=>(
                          <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'0.75rem',fontWeight:'900',color:'#555'}}>{ico} {lbl}</div>
                            <input type="number" placeholder="₹0" style={styles.billInput} value={paymentModes[key]} onChange={e=>setPaymentModes({...paymentModes,[key]:e.target.value})}/>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
                        {['cash','upi','card'].map(m=>(
                          <button key={m} onClick={()=>setSelectedSingleMode(m)} style={selectedSingleMode===m?styles.activeModeBtn:styles.modeBtn}>
                            {m==='cash'&&<Banknote size={16}/>}{m==='upi'&&<Smartphone size={16}/>}{m==='card'&&<CreditCard size={16}/>}
                            {m.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{borderTop:'2px solid #000',paddingTop:'15px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'1.5rem',fontWeight:'900'}}>
                      <span>GRAND TOTAL</span>
                      <span>₹{Math.round(tableBill.total-(tableBill.total*(discount/100)))}</span>
                    </div>
                    <div style={{fontSize:'0.6rem',fontWeight:'800',color:'#888',textAlign:'right',marginTop:'5px'}}>
                      MODE: {activePaymentType==='split'?'SPLIT PAYMENT':selectedSingleMode.toUpperCase()}
                    </div>
                  </div>
<button 
    onClick={settleBill} 
    style={{
        ...styles.settleBtn, marginTop: '20px',
        opacity: isSettling ? 0.5 : 1,
        cursor: isSettling ? 'not-allowed' : 'pointer'
    }}
    disabled={isSettling}
>
    {isSettling ? 'PROCESSING...' : 'FINALIZE SETTLEMENT'}
</button>                  <div style={{textAlign:'center',marginTop:'20px',fontSize:'0.6rem',fontWeight:'900',color:'#ccc',letterSpacing:'1px'}}>POWERED BY PRATYEKSHA</div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── MARKETING ── */}
          {activeTab==='marketing' && (
            <motion.div key="marketing" initial={{opacity:0}} animate={{opacity:1}} style={styles.marketingLayout}>
              <div style={styles.botCard}>
                <div style={styles.cardHeaderSmall}><QrCode size={18}/> SYNC DEVICE</div>
                <div style={styles.qrContainer}>
                  {isBotReady?<div style={{color:'#d3bfa2',fontWeight:'900'}}>BRIDGE ACTIVE</div>:qrCode?<QRCodeSVG value={qrCode} size={200} bgColor="#000" fgColor="#d3bfa2"/>:<div className="spinner"/>}
                </div>
              </div>
              <div style={styles.botCard}>
                <div style={styles.cardHeaderSmall}><SendHorizontal size={18}/> BROADCAST</div>
                <textarea style={styles.input} value={broadcastText} onChange={e=>setBroadcastMsg(e.target.value)} placeholder="Promo message..."/>
                <button onClick={handleBroadcast} style={styles.mainBtn}>LAUNCH CAMPAIGN</button>
              </div>
            </motion.div>
          )}

          {/* ── INSIGHTS ── */}
          {activeTab==='insights' && (
            <motion.div key="insights" initial={{opacity:0}} animate={{opacity:1}} style={styles.insightsWrapper}>
              {/* KPIs */}
              <div style={styles.statsRow}>
                <div style={styles.glassStat}>
                  <small style={styles.statLabel}>MONTHLY REVENUE</small>
                  <h2 style={styles.statVal}>₹{stats.revenue.toLocaleString()}</h2>
                  <div style={{color:'#4ade80',fontSize:'0.7rem'}}>
                    {viewDate.toLocaleString('default',{month:'long',year:'numeric'})}
                  </div>
                </div>
                <div style={styles.glassStat}>
                  <small style={styles.statLabel}>LOYALTY SCORE</small>
                  <h2 style={styles.statVal}>{stats.loyaltyRate}%</h2>
                  <div style={{color:'#d3bfa2',fontSize:'0.7rem'}}>
                    {trendsData?.customers?.repeat||0} repeat / {trendsData?.customers?.total||0} total
                  </div>
                </div>
                <div style={styles.glassStat}>
                  <small style={styles.statLabel}>AVG TICKET</small>
                  <h2 style={styles.statVal}>₹{stats.avg}</h2>
                  <div style={{color:'#888',fontSize:'0.7rem'}}>Per Table</div>
                </div>
              </div>

              {/* DIGEST */}
              <div style={{...styles.biCard,marginBottom:'20px',borderLeft:'4px solid #d3bfa2'}}>
                <h4 style={styles.biTitle}><Sparkles size={16}/> SMART DIGEST</h4>
                <p style={{fontSize:'0.9rem',color:'#fff',fontWeight:'500'}}>{insightsData.digest}</p>
              </div>

              {/* HOURLY + DOW */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>
                <div style={styles.biCard}>
  <h4 style={styles.biTitle}><Timer size={16}/> PEAK HOUR INTENSITY</h4>
  {hourlyAnalytics.hourly.length > 0 ? (() => {
    const maxO = Math.max(...hourlyAnalytics.hourly.map(d => d.orderCount), 1);
    const maxR = Math.max(...hourlyAnalytics.hourly.map(d => d.revenue), 1);
    const peak = hourlyAnalytics.hourly.reduce((a, b) => b.orderCount > a.orderCount ? b : a, hourlyAnalytics.hourly[0]);
    const total = hourlyAnalytics.hourly.reduce((a, b) => a + b.orderCount, 0);
    const totalRev = hourlyAnalytics.hourly.reduce((a, b) => a + b.revenue, 0);
    const fmt = h => h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`;
    const col = c => { const r = c / maxO; return r === 0 ? '#111' : r < 0.25 ? '#2a1f0a' : r < 0.5 ? '#633806' : r < 0.75 ? '#BA7517' : '#d3bfa2'; };
    
    // Dead hours = hours with 0 orders during operating window (8am-11pm)
    const operatingHours = hourlyAnalytics.hourly.filter(h => h.hour >= 8 && h.hour <= 23);
    const deadHours = operatingHours.filter(h => h.orderCount === 0);
    const slowHours = operatingHours.filter(h => h.orderCount > 0 && h.orderCount < (maxO * 0.25));
    const avgRevenuePerHour = total > 0 ? Math.round(totalRev / operatingHours.filter(h => h.orderCount > 0).length) : 0;
    const peakRevenue = hourlyAnalytics.hourly.find(h => h.hour === peak?.hour)?.revenue || 0;

    return (
      <>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { l: 'TOTAL TODAY', v: total + ' orders' },
            { l: 'PEAK HOUR', v: fmt(peak?.hour || 0) },
            { l: 'PEAK ORDERS', v: peak?.orderCount || 0 }
          ].map(s => (
            <div key={s.l} style={{ background: '#050505', padding: '10px', borderRadius: '10px', border: '1px solid #111' }}>
              <small style={{ fontSize: '0.55rem', color: '#444', fontWeight: '900', display: 'block' }}>{s.l}</small>
              <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#d3bfa2', marginTop: '3px' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Revenue KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { l: 'PEAK HR REVENUE', v: `₹${peakRevenue.toLocaleString()}` },
            { l: 'AVG REV/ACTIVE HR', v: `₹${avgRevenuePerHour.toLocaleString()}` },
            { l: 'DEAD HOURS (8a-11p)', v: deadHours.length + ' hrs', c: deadHours.length > 4 ? '#BA7517' : '#4ade80' }
          ].map(s => (
            <div key={s.l} style={{ background: '#050505', padding: '10px', borderRadius: '10px', border: '1px solid #111' }}>
              <small style={{ fontSize: '0.55rem', color: '#444', fontWeight: '900', display: 'block' }}>{s.l}</small>
              <div style={{ fontSize: '0.9rem', fontWeight: '900', color: s.c || '#fff', marginTop: '3px' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Bar chart — dual layer: orders + revenue */}
        <div style={{ position: 'relative', height: '80px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
            {hourlyAnalytics.hourly.map(d => (
              <div key={d.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div title={`${fmt(d.hour)}: ${d.orderCount} orders · ₹${d.revenue}`}
                  style={{ width: '100%', height: `${Math.max(3, Math.round((d.orderCount / maxO) * 100))}%`, background: col(d.orderCount), borderRadius: '3px 3px 0 0', position: 'relative', minWidth: 0 }}>
                  {d.hour === peak?.hour && (
                    <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.5rem', color: '#d3bfa2', fontWeight: '900', whiteSpace: 'nowrap' }}>PEAK</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hour labels — only show every 3 hours */}
        <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
          {hourlyAnalytics.hourly.map(d => (
            <div key={d.hour} style={{ flex: 1, textAlign: 'center', fontSize: '0.45rem', color: d.hour % 3 === 0 ? '#333' : 'transparent', minWidth: 0 }}>
              {fmt(d.hour)}
            </div>
          ))}
        </div>

        {/* Insight callouts */}
        {slowHours.length > 0 && (
          <div style={{ background: 'rgba(186,117,23,0.05)', border: '1px solid rgba(186,117,23,0.15)', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' }}>
            <div style={{ fontSize: '0.6rem', color: '#BA7517', fontWeight: '900', marginBottom: '4px' }}>⚡ SLOW HOUR OPPORTUNITIES</div>
            <div style={{ fontSize: '0.65rem', color: '#666' }}>
              {slowHours.slice(0, 3).map(h => fmt(h.hour)).join(', ')} — consider happy hour promos or staff reallocation
            </div>
          </div>
        )}
      </>
    );
  })() : <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.75rem', paddingTop: '40px' }}>NO ORDERS TODAY</div>}
</div>
                <div style={styles.biCard}>
  <h4 style={styles.biTitle}><Calendar size={16}/> WEEKLY PERFORMANCE</h4>
  {hourlyAnalytics.dayOfWeek.length > 0 ? (() => {
    const maxR = Math.max(...hourlyAnalytics.dayOfWeek.map(d => d.revenue), 1);
    const peak = hourlyAnalytics.dayOfWeek.reduce((a, b) => b.revenue > a.revenue ? b : a, hourlyAnalytics.dayOfWeek[0]);
    const weak = hourlyAnalytics.dayOfWeek.reduce((a, b) => b.revenue < a.revenue ? b : a, hourlyAnalytics.dayOfWeek[0]);
    const totalWeekRev = hourlyAnalytics.dayOfWeek.reduce((a, b) => a + b.revenue, 0);
    const activeDays = hourlyAnalytics.dayOfWeek.filter(d => d.orders > 0).length;
    const avgPerActiveDay = activeDays > 0 ? Math.round(totalWeekRev / activeDays) : 0;
    const weekendDays = hourlyAnalytics.dayOfWeek.filter(d => ['Sat', 'Sun'].includes(d.day));
    const weekdayDays = hourlyAnalytics.dayOfWeek.filter(d => !['Sat', 'Sun'].includes(d.day));
    const weekendRev = weekendDays.reduce((a, b) => a + b.revenue, 0);
    const weekdayRev = weekdayDays.reduce((a, b) => a + b.revenue, 0);

    return (
      <>
        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { l: 'BEST DAY', v: peak.day, sub: `₹${peak.revenue.toLocaleString()}`, c: '#d3bfa2' },
            { l: 'AVG/ACTIVE DAY', v: `₹${avgPerActiveDay.toLocaleString()}`, sub: `${activeDays} active days` },
            { l: 'SLOWEST DAY', v: weak.day, sub: `₹${weak.revenue.toLocaleString()}`, c: '#633806' }
          ].map(s => (
            <div key={s.l} style={{ background: '#050505', padding: '10px', borderRadius: '10px', border: '1px solid #111' }}>
              <small style={{ fontSize: '0.55rem', color: '#444', fontWeight: '900', display: 'block' }}>{s.l}</small>
              <div style={{ fontSize: '0.9rem', fontWeight: '900', color: s.c || '#fff', marginTop: '3px' }}>{s.v}</div>
              <div style={{ fontSize: '0.6rem', color: '#444', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Day bars */}
        {hourlyAnalytics.dayOfWeek.map(d => {
          const isPk = d.day === peak.day, isWk = d.day === weak.day && d.revenue < peak.revenue;
          const avgOrder = d.orders > 0 ? Math.round(d.revenue / d.orders) : 0;
          return (
            <div key={d.day} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ width: '32px', fontSize: '0.7rem', color: isPk ? '#d3bfa2' : isWk ? '#633806' : '#555', fontWeight: '800' }}>{d.day}</span>
                <div style={{ flex: 1, height: '8px', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((d.revenue / maxR) * 100)}%`, background: isPk ? '#d3bfa2' : isWk ? '#633806' : '#8a704d', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#fff', minWidth: '70px', textAlign: 'right' }}>₹{d.revenue.toLocaleString()}</span>
              </div>
              {/* Sub-row: orders + avg */}
              <div style={{ display: 'flex', paddingLeft: '42px', gap: '16px' }}>
                <span style={{ fontSize: '0.58rem', color: '#333' }}>{d.orders || 0} orders</span>
                {avgOrder > 0 && <span style={{ fontSize: '0.58rem', color: '#333' }}>avg ₹{avgOrder}</span>}
                {isPk && <span style={{ fontSize: '0.58rem', color: '#d3bfa2', fontWeight: '900' }}>▲ BEST</span>}
                {isWk && d.revenue > 0 && <span style={{ fontSize: '0.58rem', color: '#633806', fontWeight: '900' }}>▼ LOWEST</span>}
              </div>
            </div>
          );
        })}

        {/* Weekend vs Weekday split */}
        <div style={{ borderTop: '1px solid #111', paddingTop: '12px', marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { l: 'WEEKDAY TOTAL', v: `₹${weekdayRev.toLocaleString()}`, pct: totalWeekRev > 0 ? Math.round((weekdayRev / totalWeekRev) * 100) : 0 },
            { l: 'WEEKEND TOTAL', v: `₹${weekendRev.toLocaleString()}`, pct: totalWeekRev > 0 ? Math.round((weekendRev / totalWeekRev) * 100) : 0 }
          ].map(s => (
            <div key={s.l} style={{ background: '#050505', padding: '8px 10px', borderRadius: '8px', border: '1px solid #111' }}>
              <small style={{ fontSize: '0.55rem', color: '#444', fontWeight: '900', display: 'block' }}>{s.l}</small>
              <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{s.v}</div>
              <div style={{ fontSize: '0.6rem', color: '#555', marginTop: '1px' }}>{s.pct}% of week</div>
            </div>
          ))}
        </div>
      </>
    );
  })() : <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.75rem', paddingTop: '40px' }}>NO DATA YET</div>}
</div>
              </div>

              {/* TABLE PERF + DWELL */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>
                <div style={styles.biCard}>
                  <h4 style={styles.biTitle}><Layers size={16}/> TABLE PERFORMANCE</h4>
                  {trendsData?.tables?.performance?.length>0 ? trendsData.tables.performance.slice(0,5).map(t=>{
                    const mx=trendsData.tables.performance[0]?.revenue||1;
                    return (
                      <div key={t.table} style={{padding:'10px 0',borderBottom:'1px solid #111'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px'}}>
                          <span style={{color:'#fff',fontWeight:'900',fontSize:'0.8rem'}}>Table {t.table}</span>
                          <span style={{color:'#d3bfa2',fontWeight:'900',fontSize:'0.8rem'}}>₹{t.revenue.toLocaleString()}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <div style={{flex:1,height:'4px',background:'#111',borderRadius:'2px',overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${Math.round((t.revenue/mx)*100)}%`,background:'#8a704d'}}/>
                          </div>
                          <span style={{fontSize:'0.65rem',color:'#555'}}>{t.turns} turns</span>
                        </div>
                      </div>
                    );
                  }) : <div style={{textAlign:'center',opacity:0.3,fontSize:'0.75rem',paddingTop:'30px'}}>NO DATA YET</div>}
                </div>
                <div style={styles.biCard}>
                  <h4 style={styles.biTitle}><Timer size={16}/> AVG DWELL TIME</h4>
                  {trendsData?.tables ? (
                    [{label:'AVG DWELL',val:trendsData.tables.overallAvgDwell>0?`${trendsData.tables.overallAvgDwell} min`:'—'},
                     {label:'FASTEST',val:trendsData.tables.fastest?`T${trendsData.tables.fastest.table} · ${trendsData.tables.fastest.avgDwell}m`:'—'},
                     {label:'SLOWEST',val:trendsData.tables.slowest?`T${trendsData.tables.slowest.table} · ${trendsData.tables.slowest.avgDwell}m`:'—'}
                    ].map(s=>(
                      <div key={s.label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #111'}}>
                        <small style={{fontSize:'0.62rem',color:'#555',fontWeight:'900'}}>{s.label}</small>
                        <span style={{fontSize:'0.8rem',fontWeight:'900',color:'#fff'}}>{s.val}</span>
                      </div>
                    ))
                  ) : <div style={{opacity:0.3,fontSize:'0.75rem',paddingTop:'30px',textAlign:'center'}}>NO DATA</div>}
                </div>
              </div>

              {/* PREP TIME + STOCK ALERTS */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>
                <div style={styles.biCard}>
                  <h4 style={styles.biTitle}><Clock size={16}/> KITCHEN PREP TIME</h4>
                  {prepTimeData?.totalTracked>0 ? (
                    <>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'16px'}}>
                        {[{l:'AVG PREP',v:`${prepTimeData.avgPrepTime} min`},{l:'DELAYED >15m',v:prepTimeData.delayedCount,c:prepTimeData.delayedPct>20?'#E24B4A':'#d3bfa2'},{l:'DELAY RATE',v:`${prepTimeData.delayedPct}%`,c:prepTimeData.delayedPct>20?'#E24B4A':'#4ade80'}].map(s=>(
                          <div key={s.l} style={{background:'#050505',padding:'10px',borderRadius:'10px',border:'1px solid #111'}}>
                            <small style={{fontSize:'0.55rem',color:'#444',fontWeight:'900',display:'block'}}>{s.l}</small>
                            <div style={{fontSize:'0.9rem',fontWeight:'900',color:s.c||'#d3bfa2',marginTop:'3px'}}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <div style={{textAlign:'center',opacity:0.3,fontSize:'0.75rem',paddingTop:'30px'}}>PREP TRACKING STARTS WHEN KDS MARKS READY</div>}
                </div>
                <div style={{...styles.biCard,borderLeft:lowStockAlerts.length>0?'4px solid #E24B4A':'1px solid #1a1a1a'}}>
                  <h4 style={styles.biTitle}><AlertTriangle size={16} color={lowStockAlerts.length>0?'#E24B4A':'#444'}/> LIVE STOCK ALERTS</h4>
                  {lowStockAlerts.length>0 ? lowStockAlerts.map((a,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #111'}}>
                      <div>
                        <div style={{fontSize:'0.8rem',fontWeight:'900',color:'#fff'}}>{a.itemName}</div>
                        <small style={{fontSize:'0.6rem',color:'#E24B4A'}}>Only {a.currentStock}{a.unit} left · Min: {a.minThreshold}{a.unit}</small>
                      </div>
                      <button onClick={()=>setLowStockAlerts(p=>p.filter((_,ix)=>ix!==i))}
                        style={{background:'transparent',border:'1px solid #222',color:'#444',padding:'4px 10px',borderRadius:'6px',fontSize:'0.6rem',cursor:'pointer'}}>
                        DISMISS
                      </button>
                    </div>
                  )) : <div style={{textAlign:'center',opacity:0.3,fontSize:'0.75rem',paddingTop:'30px'}}>ALL STOCK LEVELS HEALTHY</div>}
                </div>
              </div>

              {/* PROFITABILITY + REVENUE TREND */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>
                <div style={styles.biCard}>
  <h4 style={styles.biTitle}><Percent size={16}/> DISH PROFITABILITY — RECIPE COSTING</h4>
  {profitabilityData.length > 0 ? (
    <>
      {/* Summary bar */}
      {(() => {
        const withRecipe = profitabilityData.filter(d => d.hasRecipe);
        const totalGrossProfit = profitabilityData.reduce((a, b) => a + (b.grossProfit || 0), 0);
        const totalRevenue = profitabilityData.reduce((a, b) => a + (b.totalRevenue || 0), 0);
        const totalCost = profitabilityData.reduce((a, b) => a + (b.totalIngredientCost || 0), 0);
        const overallMargin = totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px', padding: '12px', background: '#050505', borderRadius: '10px', border: '1px solid #111' }}>
            {[
              { l: 'TOTAL REVENUE', v: `₹${totalRevenue.toLocaleString()}` },
              { l: 'INGREDIENT COST', v: `₹${totalCost.toLocaleString()}`, c: '#BA7517' },
              { l: 'GROSS PROFIT', v: `₹${totalGrossProfit.toLocaleString()}`, c: overallMargin > 50 ? '#4ade80' : '#d3bfa2' }
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <small style={{ fontSize: '0.55rem', color: '#444', fontWeight: '900', display: 'block' }}>{s.l}</small>
                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: s.c || '#fff', marginTop: '3px' }}>{s.v}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Per-dish breakdown */}
      {profitabilityData.slice(0, 8).map((d, idx) => (
        <div key={d._id} style={{ padding: '10px 0', borderBottom: '1px solid #111' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.6rem', color: '#333', fontWeight: '900', minWidth: '16px' }}>#{idx + 1}</span>
              <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '700' }}>{d.name}</span>
              {!d.hasRecipe && <span style={{ fontSize: '0.5rem', padding: '1px 5px', background: 'rgba(138,112,77,0.1)', color: '#555', borderRadius: '3px', border: '1px solid #1a1a1a' }}>NO RECIPE</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#555' }}>{d.totalQtySold || 0} sold</span>
              <span style={{ fontWeight: '900', fontSize: '0.78rem', color: d.grossProfit > 0 ? '#d3bfa2' : '#BA7517' }}>
                {d.realizedMarginPct ?? d.marginPct}%
              </span>
            </div>
          </div>

          {/* Progress bar — margin */}
          <div style={{ height: '3px', background: '#111', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, d.marginPct))}%`, background: d.grossProfit < 0 ? '#633806' : d.marginPct > 60 ? '#4ade80' : '#8a704d' }} />
          </div>

          {/* Cost breakdown row */}
          {d.hasRecipe && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.6rem', color: '#444' }}>Sell ₹{d.sellingPrice}</span>
              <span style={{ fontSize: '0.6rem', color: '#BA7517' }}>Cost ₹{d.ingredientCostPerServing}</span>
              <span style={{ fontSize: '0.6rem', color: '#555' }}>→ ₹{d.profit}/serving</span>
              {d.totalQtySold > 0 && (
                <span style={{ fontSize: '0.6rem', color: d.grossProfit > 0 ? '#4ade80' : '#BA7517', fontWeight: '900' }}>
                  Total P&L: ₹{d.grossProfit?.toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Ingredient pills — top 3 */}
          {d.ingredientBreakdown?.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
              {d.ingredientBreakdown.slice(0, 3).map((ing, i) => (
                <span key={i} style={{ fontSize: '0.5rem', padding: '2px 6px', background: '#080808', border: '1px solid #151515', borderRadius: '4px', color: '#444' }}>
                  {ing.name} {ing.qty}{ing.unit} = ₹{ing.lineCost}
                </span>
              ))}
              {d.ingredientBreakdown.length > 3 && (
                <span style={{ fontSize: '0.5rem', color: '#333' }}>+{d.ingredientBreakdown.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  ) : <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.75rem', paddingTop: '30px' }}>LINK RECIPES TO COMPUTE MARGINS</div>}
</div>
                <div style={styles.biCard}>
                  <h4 style={styles.biTitle}><TrendingUp size={16}/> REVENUE TREND</h4>
                  {trendsData?.revenue ? (()=>{
                    const {current,previous,growthPct}=trendsData.revenue;
                    const isPos=growthPct!==null&&Number(growthPct)>=0;
                    return (<>
                      <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #111'}}>
                        <span style={{fontSize:'0.75rem',color:'#888'}}>This month</span><span style={{fontWeight:'900',color:'#fff'}}>₹{current.toLocaleString()}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #111'}}>
                        <span style={{fontSize:'0.75rem',color:'#888'}}>Last month</span><span style={{fontWeight:'900',color:'#555'}}>₹{previous.toLocaleString()}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0'}}>
                        <span style={{fontSize:'0.75rem',color:'#888'}}>Growth</span>
                        {growthPct!==null ? (
                          <span style={{fontSize:'0.85rem',fontWeight:'900',padding:'4px 10px',borderRadius:'6px',
                            background:isPos?'rgba(29,158,117,0.1)':'rgba(226,75,74,0.1)',color:isPos?'#1D9E75':'#E24B4A'}}>
                            {isPos?'+':''}{growthPct}% {isPos?'↑':'↓'}
                          </span>
                        ) : <span style={{fontSize:'0.75rem',color:'#555'}}>No previous data</span>}
                      </div>
                    </>);
                  })() : <div style={{textAlign:'center',opacity:0.3,fontSize:'0.75rem',paddingTop:'30px'}}>NO DATA YET</div>}
                </div>
              </div>

              {/* CUSTOMER + REVENUE SOURCES */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>
                <div style={styles.biCard}>
                  <h4 style={styles.biTitle}><User size={16}/> REPEAT VS NEW CUSTOMERS</h4>
                  {trendsData?.customers?.total>0 ? (<>
                    <div style={{display:'flex',height:'8px',borderRadius:'4px',overflow:'hidden',marginBottom:'16px'}}>
                      <div style={{width:`${trendsData.customers.repeatPct}%`,background:'#d3bfa2',transition:'width 0.8s ease'}}/>
                      <div style={{flex:1,background:'#1a1a1a'}}/>
                    </div>
                    {[
                      {l:'TOTAL CUSTOMERS',v:trendsData.customers.total,c:'#fff'},
                      {l:'REPEAT VISITORS',v:`${trendsData.customers.repeat} (${trendsData.customers.repeatPct}%)`,c:'#d3bfa2'},
                      {l:'NEW CUSTOMERS',v:trendsData.customers.new,c:'#888'},
                      {l:'AVG VISITS',v:trendsData.customers.avgVisits+'x',c:'#fff'},
                    ].map(s=>(
                      <div key={s.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #111'}}>
                        <small style={{fontSize:'0.62rem',color:'#555',fontWeight:'900'}}>{s.l}</small>
                        <span style={{fontSize:'0.8rem',fontWeight:'900',color:s.c}}>{s.v}</span>
                      </div>
                    ))}
                  </>) : <div style={{textAlign:'center',padding:'20px',fontSize:'0.75rem',color:'#444'}}>Start capturing customer phone numbers at billing to unlock retention metrics.</div>}
                </div>
                <div style={styles.biCard}>
                  <h4 style={styles.biTitle}><Globe size={16}/> REVENUE SOURCES</h4>
                  {Object.entries(advancedStats.sources).map(([src,val])=>(
                    <div key={src} style={styles.sourceRow}>
                      <span style={{textTransform:'capitalize',width:'80px'}}>{src}</span>
                      <div style={styles.progressBg}><div style={{...styles.progressFill,width:`${(val/(stats.revenue||1))*100}%`}}/></div>
                      <span style={{minWidth:'60px',textAlign:'right'}}>₹{val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CATEGORY RANKINGS */}
{/* CATEGORY RANKINGS — with top AND bottom dishes */}
{Object.keys(categoryRankings).length > 0 && (
  <div style={{ ...styles.biCard, marginBottom: '20px', borderTop: '2px solid #d3bfa2' }}>
    <h4 style={styles.biTitle}><Layers size={16} /> CATEGORY PERFORMANCE SEGMENTATION</h4>
    <p style={{ fontSize: '0.72rem', color: '#555', marginTop: '-15px', marginBottom: '20px' }}>
      Sales velocity by category — top performers and underperforming items for the selected period.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
      {Object.entries(categoryRankings).map(([cat, m]) => (
        <div key={cat} style={{
          background: '#050505', border: '1px solid #111',
          padding: '18px', borderRadius: '14px'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #111', paddingBottom: '10px' }}>
            <span style={{ fontWeight: '900', fontSize: '0.82rem', color: '#d3bfa2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {cat.replace('cat_', '').replace('CAT_', '')}
            </span>
            <span style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(211,191,162,0.06)', color: '#888', fontWeight: '800', border: '1px solid #1a1a1a' }}>
              {m.totalSoldInCategory} units
            </span>
          </div>

          {/* TOP 3 */}
          <div style={{ marginBottom: '12px' }}>
            <small style={{ fontSize: '0.58rem', color: '#d3bfa2', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              ▲ Top Performers
            </small>
            {(m.topDishes || []).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid #0d0d0d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.6rem', color: '#8a704d', fontWeight: '900', minWidth: '14px' }}>#{i + 1}</span>
                  <span style={{ color: '#fff', fontWeight: '700' }}>{d.name}</span>
                </div>
                <span style={{ color: '#d3bfa2', fontWeight: '900', fontSize: '0.72rem' }}>{d.sold} sold</span>
              </div>
            ))}
          </div>

          {/* BOTTOM 3 */}
          <div>
            <small style={{ fontSize: '0.58rem', color: '#555', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              ▼ Needs Attention
            </small>
            {(m.bottomDishes || []).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', padding: '4px 0', borderBottom: '1px solid #0a0a0a' }}>
                <span style={{ color: '#444', fontWeight: '600' }}>• {d.name}</span>
                <span style={{ color: '#333', fontWeight: '700', fontSize: '0.68rem' }}>{d.sold} sold</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}              {/* HEATMAP */}
              <div style={styles.heatmapCard}>
                <h4 style={styles.biTitle}><Calendar size={16}/> DAILY REVENUE HEATMAP — {viewDate.toLocaleString('default',{month:'long',year:'numeric'})}</h4>
                <div style={styles.calendarGridHeader}>{['S','M','T','W','T','F','S'].map((d,i)=><div key={i} style={styles.dayHeader}>{d}</div>)}</div>
                <div style={styles.calendarGrid}>{renderMonthHeatmap()}</div>
                <div style={styles.heatmapLegend}>
                  <span>Less</span>
                  <div style={{...styles.heatSquare,width:'12px',height:'12px',background:'#111'}}/>
                  <div style={{...styles.heatSquare,width:'12px',height:'12px',background:'rgba(211,191,162,0.4)'}}/>
                  <div style={{...styles.heatSquare,width:'12px',height:'12px',background:'rgba(211,191,162,1)'}}/>
                  <span>More</span>
                </div>
              </div>

              {/* STAFF EFFICIENCY */}
              {staffEfficiency.length>0 && (
                <div style={{...styles.biCard,marginTop:'20px',marginBottom:'20px'}}>
                  <h4 style={styles.biTitle}><Zap size={16}/> STAFF EFFICIENCY — REVENUE PER HOUR</h4>
                  <div style={{overflowX:'auto'}} className="custom-scroll">
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{fontSize:'0.6rem',color:'#555',borderBottom:'1px solid #121212',textTransform:'uppercase',letterSpacing:'0.8px'}}>
                          {['Name','Role','Days Present','Hours','Rev/Hour','Salary','Status'].map(h=>(
                            <th key={h} style={{padding:'0 12px 12px 0',textAlign:'left'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {staffEfficiency.map(s=>(
                          <tr key={s._id} style={{borderBottom:'1px solid #090909',fontSize:'0.78rem'}}>
                            <td style={{padding:'12px 12px 12px 0',fontWeight:'900',color:'#fff'}}>{s.name}</td>
                            <td style={{color:'#555',fontWeight:'800'}}>{s.role}</td>
                            <td style={{color:'#d3bfa2',fontWeight:'900'}}>{s.daysPresent}d</td>
                            <td style={{color:'#888'}}>{s.totalHours}h</td>
                            <td style={{fontWeight:'900',color:s.revenuePerHour>0?'#d3bfa2':'#333'}}>{s.revenuePerHour>0?`₹${s.revenuePerHour.toLocaleString()}`:'—'}</td>
                            <td style={{color:'#fff'}}>₹{s.baseSalary.toLocaleString()}</td>
                            <td><span style={{fontSize:'0.6rem',padding:'2px 8px',borderRadius:'4px',fontWeight:'900',
                              background:s.salaryStatus==='Paid'?'rgba(211,191,162,0.08)':'rgba(138,112,77,0.1)',
                              color:s.salaryStatus==='Paid'?'#d3bfa2':'#8a704d'}}>{s.salaryStatus?.toUpperCase()}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── MANAGEMENT ── */}
          {activeTab==='management' && (
            <motion.div key="management" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
              style={{display:'flex',flexDirection:'column',gap:'40px',paddingBottom:'100px',width:'100%'}}>
              {/* workforce register + attendance — keeping existing implementation, condensed */}
              <div style={{...styles.biCard,borderTop:'3px solid #d3bfa2'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                  <User size={20} color="#d3bfa2"/>
                  <h4 style={{...styles.biTitle,margin:0,color:'#fff',fontSize:'1rem'}}>WORKFORCE REGISTER TERMINAL</h4>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px',alignItems:'end',padding:'0 10px'}}>
                  {[{l:'FULL NAME',k:'name',p:'John Doe',t:'text'},{l:'AGE',k:'age',p:'25',t:'number'},{l:'CONTACT',k:'contact',p:'9876543210',t:'text'},{l:'SALARY(₹)',k:'baseSalary',p:'25000',t:'number'}].map(f=>(
                    <div key={f.k}>
                      <label style={{...styles.statLabel,color:'#888',marginBottom:'8px',display:'block'}}>{f.l}</label>
                      <input type={f.t} placeholder={f.p} style={{...styles.input,marginBottom:0,background:'#000',borderColor:'#151515',fontSize:'0.8rem'}}
                        value={newStaff[f.k]} onChange={e=>setNewStaff({...newStaff,[f.k]:e.target.value})}/>
                    </div>
                  ))}
                  <div>
                    <label style={{...styles.statLabel,color:'#888',marginBottom:'8px',display:'block'}}>ROLE</label>
                    <select style={{...styles.input,marginBottom:0,background:'#000',borderColor:'#151515',fontSize:'0.8rem',cursor:'pointer'}}
                      value={newStaff.role} onChange={e=>setNewStaff({...newStaff,role:e.target.value,assignedTables:[]})}>
                      {['Waiter','Chef','Manager','Cashier','Helper'].map(r=><option key={r} value={r}>{r.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{...styles.statLabel,color:'#888',marginBottom:'8px',display:'block'}}>SHIFT</label>
                    <select style={{...styles.input,marginBottom:0,background:'#000',borderColor:'#151515',cursor:'pointer'}}
                      value={newStaff.shiftType} onChange={e=>setNewStaff({...newStaff,shiftType:e.target.value})}>
                      <option value="Day Shift">DAY SHIFT</option>
                      <option value="Night Shift">NIGHT SHIFT</option>
                      <option value="Both Shifts">BOTH SHIFTS</option>
                    </select>
                  </div>
                  <div>
                    <label style={{...styles.statLabel,color:'#888',marginBottom:'8px',display:'block'}}>JOINING DATE</label>
                    <input type="date" style={{...styles.input,marginBottom:0,colorScheme:'dark',background:'#000',borderColor:'#151515',cursor:'pointer'}}
                      value={newStaff.joiningDate} onChange={e=>setNewStaff({...newStaff,joiningDate:e.target.value})}/>
                  </div>
                </div>
                {newStaff.role==='Waiter' && (
                  <div style={{marginTop:'20px',background:'#080808',padding:'16px',borderRadius:'12px',border:'1px solid #121212'}}>
                    <label style={{...styles.statLabel,color:'#888',marginBottom:'10px',display:'block'}}>TABLE ASSIGNMENTS</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                      {Array.from({length:tableCount},(_,i)=>(i+1).toString()).map(t=>{
                        const isSel=newStaff.assignedTables.includes(t);
                        return (
                          <button key={t} type="button" onClick={()=>setNewStaff({...newStaff,assignedTables:isSel?newStaff.assignedTables.filter(x=>x!==t):[...newStaff.assignedTables,t]})}
                            style={{padding:'8px 16px',borderRadius:'8px',border:'none',fontSize:'0.7rem',fontWeight:'800',cursor:'pointer',
                              background:isSel?'linear-gradient(135deg,#8a704d,#d3bfa2)':'#111',color:isSel?'#000':'#555'}}>T{t}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* After role select, inside the grid */}
{newStaff.role === 'Chef' && (
  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
    style={{ gridColumn: 'span 2' }}>
    <label style={{ ...styles.statLabel, color: '#d3bfa2', marginBottom: '8px', display: 'block', fontWeight: '800' }}>
      CUISINE SPECIALIZATION — SELECT CATEGORIES
    </label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#000', padding: '14px', borderRadius: '12px', border: '1px solid #1a1a1a', minHeight: '54px' }}>
      {[...new Set(menuItems.map(item => item.categoryId))].filter(Boolean).map(catId => {
        const currentSel = newStaff.cookingRole ? newStaff.cookingRole.split(', ') : [];
        const isChecked = currentSel.includes(catId);
        // Clean display name
        const displayName = catId.replace(/^cat_/i, '').replace(/_/g, ' ');
        return (
          <button key={catId} type="button" onClick={() => {
            const updated = isChecked
              ? currentSel.filter(c => c !== catId)
              : [...currentSel, catId];
            setNewStaff({ ...newStaff, cookingRole: updated.join(', ') });
          }} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900',
            border: isChecked ? 'none' : '1px solid #222', cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: isChecked ? '#d3bfa2' : '#0d0d0d',
            color: isChecked ? '#000' : '#555'
          }}>
            {displayName.toUpperCase()}
          </button>
        );
      })}
      {menuItems.length === 0 && (
        <span style={{ fontSize: '0.7rem', color: '#333' }}>Loading categories...</span>
      )}
    </div>
    {newStaff.cookingRole && (
      <div style={{ fontSize: '0.62rem', color: '#8a704d', marginTop: '6px', fontWeight: '700' }}>
        Selected: {newStaff.cookingRole.split(', ').map(c => c.replace(/^cat_/i, '').replace(/_/g, ' ')).join(' • ').toUpperCase()}
      </div>
    )}
  </motion.div>
)}
                <div style={{marginTop:'20px',display:'flex',gap:'16px',padding:'0 10px'}}>
                  <input type="text" placeholder="Residential address" style={{...styles.input,marginBottom:0,background:'#000',borderColor:'#151515',flex:1}}
                    value={newStaff.address} onChange={e=>setNewStaff({...newStaff,address:e.target.value})}/>
                  <button onClick={async()=>{
                    if(!newStaff.name||!newStaff.contact||!newStaff.baseSalary) return showNotif("Fill all required fields","error");
                    try {
                      const res=await axios.post(`${BASE_URL}/staff/register`,{...newStaff,tenantId,age:Number(newStaff.age),baseSalary:Number(newStaff.baseSalary)});
                      if(newStaff.role==='Waiter'&&newStaff.assignedTables.length>0)
                        await axios.put(`${BASE_URL}/staff/floor-map`,{tenantId,staffId:res.data.member._id,assignedTables:newStaff.assignedTables});
                      showNotif(`${newStaff.name} enrolled`,"success");
                      setNewStaff({name:'',role:'Waiter',age:'',contact:'',address:'',shiftType:'Day Shift',joiningDate:new Date().toISOString().split('T')[0],baseSalary:'',assignedTables:[],cookingRole:''});
                      fetchManagementData();
                    } catch { showNotif("Failed to enroll","error"); }
                  }} style={{...styles.mainBtn,width:'200px',background:'linear-gradient(135deg,#d3bfa2,#bda88a)'}}>AUTHORIZE ROSTER</button>
                </div>
              </div>

              {/* LIVE FLOOR HUD */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'25px'}}>
                <div style={{...styles.biCard,borderLeft:'4px solid #d3bfa2',padding:'24px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                    <div style={{background:'rgba(211,191,162,0.06)',padding:'12px',borderRadius:'12px',color:'#d3bfa2',border:'1px solid rgba(211,191,162,0.1)'}}><ChefHat size={22}/></div>
                    <div>
                      <small style={{color:'#444',fontWeight:'900',fontSize:'0.65rem',letterSpacing:'1px',textTransform:'uppercase'}}>PRODUCTION CAPACITY</small>
                      <div style={{fontSize:'1.6rem',fontWeight:'900',color:'#fff',marginTop:'4px'}}>{liveFloorIntelligence.activeChefs} Chefs • {liveFloorIntelligence.activeHelpers} Helpers</div>
                    </div>
                  </div>
                </div>
                <div style={{...styles.biCard,borderLeft:'4px solid #8a704d',padding:'24px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                    <div style={{background:'rgba(138,112,77,0.06)',padding:'12px',borderRadius:'12px',color:'#8a704d',border:'1px solid rgba(138,112,77,0.1)'}}><MousePointer2 size={22}/></div>
                    <div>
                      <small style={{color:'#444',fontWeight:'900',fontSize:'0.65rem',letterSpacing:'1px',textTransform:'uppercase'}}>FLOORGRID COVERAGE</small>
                      <div style={{fontSize:'1.6rem',fontWeight:'900',color:'#fff',marginTop:'4px'}}>{liveFloorIntelligence.coveredCount} <span style={{fontSize:'0.8rem',color:'#444'}}>OF {tableCount} TABLES</span></div>
                      <div style={{fontSize:'0.65rem',color:'#8a704d',fontWeight:'bold',marginTop:'4px'}}>{liveFloorIntelligence.coveredList}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROSTER LEDGER */}
              <div style={{...styles.biCard,width:'100%'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'25px',gap:'20px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <Layers size={18} color="#d3bfa2"/>
                    <h4 style={{...styles.biTitle,margin:0,color:'#fff',fontSize:'0.95rem'}}>ROSTER REGISTRY</h4>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{...styles.searchWrapper,padding:'8px 14px',background:'#000',border:'1px solid #121212',borderRadius:'8px',marginBottom:0}}>
                      <Search size={14} color="#444"/>
                      <input type="text" placeholder="Filter by name..." style={{...styles.searchInput,width:'180px',fontSize:'0.75rem',color:'#fff'}}
                        value={rosterSearchQuery} onChange={e=>setRosterSearchQuery(e.target.value)}/>
                    </div>
                    {/* Month selector for attendance column */}
                    <div style={styles.headerMonthSelector}>
                      <button onClick={()=>changeMonth(-1)} style={styles.headerMonthNav}><ChevronLeft size={14}/></button>
                      <span style={{fontSize:'0.75rem',fontWeight:'900',color:'#d3bfa2',minWidth:'80px',textAlign:'center'}}>
                        {viewDate.toLocaleString('default',{month:'short',year:'numeric'}).toUpperCase()}
                      </span>
                      <button onClick={()=>changeMonth(1)} style={styles.headerMonthNav}><ChevronRight size={14}/></button>
                    </div>
                  </div>
                </div>
                <div style={{overflowX:'auto'}} className="custom-scroll">
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{textAlign:'left',fontSize:'0.65rem',color:'#555',borderBottom:'1px solid #121212',textTransform:'uppercase',letterSpacing:'0.8px'}}>
                        {[['name','Staff'],['','Assignments'],['','Shift'],['monthlyAttendance','Attendance',true],['joiningDate','Tenure'],['baseSalary','Salary'],['','Payroll'],['','Action']].map(([k,l,c],i)=>(
                          <th key={i} onClick={k?()=>requestLedgerSort(k):undefined}
                            style={{padding:i===0?'0 0 15px 12px':'0 0 15px 0',cursor:k?'pointer':'default',
                              color:ledgerSortConfig.key===k?'#d3bfa2':'#555',
                              textAlign:c?'center':'left'}}>
                            {l} {ledgerSortConfig.key===k&&(ledgerSortConfig.direction==='asc'?'▲':'▼')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.length>0 ? ['Chef','Waiter','Manager','Cashier','Helper'].map(role=>{
                        const bucket=filteredStaff.filter(m=>(m.role||'Helper')===role);
                        if(!bucket.length) return null;
                        return (
                          <React.Fragment key={role}>
                            <tr><td colSpan="8" style={{padding:'10px 12px',background:'#090909',borderBottom:'1px solid #111'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <span style={{width:'4px',height:'12px',background:'#d3bfa2',borderRadius:'2px'}}/>
                                <span style={{fontSize:'0.68rem',fontWeight:'900',color:'#d3bfa2',letterSpacing:'1.2px',textTransform:'uppercase'}}>{role}S ({bucket.length})</span>
                              </div>
                            </td></tr>
                            {bucket.map(m=>{
                              const prefix=viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
                              const days=attendanceLogs.filter(l=>(l.staffId===m._id||l.staffId?.toString()===m._id?.toString())&&l.date?.startsWith(prefix)).length;
                              const pureName=m.name.includes(' (')?m.name.split(' (')[0]:m.name;
                              return (
                                <tr key={m._id} style={{borderBottom:'1px solid #090909',fontSize:'0.8rem'}}>
                                  <td style={{padding:'16px 12px'}}>
                                    <b style={{color:'#fff'}}>{pureName}</b>
                                    <span style={{fontSize:'0.65rem',color:'#666',display:'block',marginTop:'2px'}}>{m.role.toUpperCase()} {m.age?`• ${m.age}y`:''}</span>
                                  </td>
                                  <td>
                                    {m.role==='Waiter'&&m.assignedTables?.length>0 ? (
                                      <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                                        {m.assignedTables.map(t=><span key={t} style={{fontSize:'0.62rem',padding:'2px 6px',background:'#111',border:'1px solid #161616',borderRadius:'4px',color:'#aaa'}}>T{t}</span>)}
                                      </div>
                                    ) : <span style={{fontSize:'0.65rem',color:'#333',fontStyle:'italic'}}>—</span>}
                                  </td>
                                  <td><span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'0.7rem',fontWeight:'800',color:m.shiftType==='Night Shift'?'#8a704d':'#d3bfa2'}}><Clock size={11}/>{m.shiftType?.toUpperCase()}</span></td>
                                  <td style={{textAlign:'center'}}>
                                    <span style={{padding:'4px 10px',borderRadius:'12px',background:'rgba(211,191,162,0.03)',border:'1px solid rgba(211,191,162,0.08)',fontSize:'0.75rem',fontWeight:'800',color:'#fff'}}>
                                      {days} <span style={{color:'#444',fontSize:'0.6rem'}}>DAYS</span>
                                    </span>
                                  </td>
                                  <td style={{fontSize:'0.75rem',color:'#888'}}>{calculateTenure(m.joiningDate)}</td>
                                  <td style={{fontWeight:'800',color:'#fff'}}>₹{Number(m.baseSalary).toLocaleString()}<small style={{color:'#444',fontSize:'0.6rem'}}>/mo</small></td>
                                  <td>
                                    <select value={m.salaryStatus||'Unpaid'} onChange={async e=>{
                                      await axios.patch(`${BASE_URL}/staff/salary-status/${m._id}`,{salaryStatus:e.target.value});
                                      fetchManagementData(); showNotif(`${pureName} payroll updated`);
                                    }} style={{background:'#000',color:m.salaryStatus==='Paid'?'#d3bfa2':'#444',border:m.salaryStatus==='Paid'?'1px solid rgba(211,191,162,0.25)':'1px solid #151515',padding:'6px 10px',borderRadius:'6px',fontSize:'0.65rem',fontWeight:'900',outline:'none',cursor:'pointer'}}>
                                      <option value="Unpaid">UNPAID</option>
                                      <option value="Paid">PAID</option>
                                    </select>
                                  </td>
                                  <td style={{textAlign:'right',paddingRight:'12px'}}>
                                    <button onClick={()=>setPendingDeleteStaff(m)}
                                      style={{background:'transparent',border:'1px solid #151515',color:'#444',padding:'6px 14px',borderRadius:'6px',fontSize:'0.65rem',fontWeight:'800',cursor:'pointer'}}
                                      onMouseEnter={e=>{e.currentTarget.style.color='#ff4d4d';e.currentTarget.style.borderColor='rgba(255,77,77,0.3)';}}
                                      onMouseLeave={e=>{e.currentTarget.style.color='#444';e.currentTarget.style.borderColor='#151515';}}>
                                      WIPE
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      }) : (
                        <tr><td colSpan="8" style={{textAlign:'center',padding:'40px',color:'#444',fontSize:'0.75rem'}}>NO STAFF RECORDS FOUND</td></tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{background:'#050505',borderTop:'2px solid #111'}}>
                        <td colSpan="4" style={{padding:0}}/>
                        <td style={{padding:'18px 12px',textAlign:'right',fontSize:'0.7rem',fontWeight:'900',color:'#8a704d',textTransform:'uppercase'}}>AGGREGATED PAYROLL:</td>
                        <td style={{padding:'18px 10px',fontWeight:'900',color:'#d3bfa2',fontSize:'0.9rem'}}>₹{totalPayrollValue.toLocaleString()}</td>
                        <td style={{padding:0}}/><td style={{padding:0}}/>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ATTENDANCE PANEL */}
              <div style={{...styles.biCard,width:'100%',background:'#0d0d0d'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'20px',marginBottom:'20px'}}>
                  <div>
                    <h4 style={{...styles.biTitle,marginBottom:'4px',color:'#fff'}}><Calendar size={14} color="#8a704d"/> ATTENDANCE TRACKER</h4>
                    <p style={{fontSize:'0.68rem',color:'#555',margin:0}}>Clock-in / clock-out for: {attendanceDate}</p>
                  </div>
                  <input type="date" value={attendanceDate} onChange={e=>{setAttendanceDate(e.target.value);fetchAttendanceForDate(e.target.value);}}
                    style={{...styles.input,colorScheme:'dark',border:'1px solid #181818',background:'#000',fontSize:'0.75rem',padding:'8px 12px',width:'160px',marginBottom:0,cursor:'pointer'}}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                  {['Chef','Waiter','Manager','Cashier','Helper'].map(role=>{
                    const roleStaff=staff.filter(m=>(m.role||'Helper')===role);
                    if(!roleStaff.length) return null;
                    return (
                      <div key={role} style={{border:'1px solid #121212',padding:'16px',borderRadius:'12px',background:'#090909'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',borderBottom:'1px solid #151515',paddingBottom:'8px'}}>
                          <Clock size={12} color="#8a704d"/>
                          <span style={{fontSize:'0.68rem',fontWeight:'900',color:'#888',textTransform:'uppercase',letterSpacing:'0.8px'}}>{role}S ({roleStaff.length})</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'12px'}}>
                          {roleStaff.map(m=>{
                            // Find today's log specifically (not the merged monthly set)
                            const log=attendanceLogs.find(l=>l.date===attendanceDate&&(l.staffId===m._id||l.staffId?.toString()===m._id?.toString()));
                            const isClockedIn=!!log&&!log.clockOut, isEnded=!!log&&!!log.clockOut;
                            const name=m.name.includes(' (')?m.name.split(' (')[0]:m.name;
                            return (
                              <div key={m._id} style={{display:'flex',justifyContent:'space-between',padding:'12px',borderRadius:'10px',background:'#050505',border:isClockedIn?'1px solid rgba(211,191,162,0.2)':'1px solid #111',alignItems:'center'}}>
                                <div>
                                  <div style={{fontSize:'0.8rem',fontWeight:'800',color:'#fff'}}>{name}</div>
                                  <small style={{color:isClockedIn?'#d3bfa2':'#444',fontSize:'0.65rem',fontWeight:'700',display:'block',marginTop:'2px'}}>
                                    {isEnded?`CLOSED (~${log.totalWorkingHours}h)`:isClockedIn?'ON DUTY':'NOT PUNCHED'}
                                  </small>
                                </div>
                                <button onClick={async()=>{
                                  if(!log) await axios.post(`${BASE_URL}/staff/attendance/clock-in`,{tenantId,staffId:m._id});
                                  else if(isClockedIn) await axios.patch(`${BASE_URL}/staff/attendance/clock-out/${log._id}`);
                                  fetchAttendanceForDate(attendanceDate);
                                }} disabled={isEnded}
                                  style={{background:isEnded?'#111':isClockedIn?'rgba(138,112,77,0.08)':'#d3bfa2',
                                    color:isEnded?'#333':isClockedIn?'#8a704d':'#000',
                                    border:isClockedIn?'1px solid rgba(138,112,77,0.2)':'none',
                                    padding:'8px 14px',borderRadius:'8px',fontSize:'0.65rem',fontWeight:'900',cursor:isEnded?'default':'pointer'}}>
                                  {isEnded?'DONE':isClockedIn?'CLOCK OUT':'CLOCK IN'}
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
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              INVENTORY — standalone, NOT inside any modal
              ════════════════════════════════════════════ */}
          {activeTab==='inventory' && (
            <motion.div key="inventory" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}
              style={{display:'flex',flexDirection:'column',gap:'25px',paddingBottom:'100px',width:'100%',maxWidth:'1100px',margin:'0 auto'}}>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:'20px',borderBottom:'1px solid #151515'}}>
                <div>
                  <h2 style={{margin:0,fontSize:'1.1rem',fontWeight:'900',color:'#fff'}}>INGREDIENT REGISTER</h2>
                  <p style={{margin:'4px 0 0',fontSize:'0.7rem',color:'#555'}}>Manage stock, costs and thresholds. Same-name items are merged automatically (case-insensitive).</p>
                </div>
                <button onClick={()=>exportToExcel('inventory')}
                  style={{padding:'10px 18px',background:'transparent',border:'1px solid rgba(211,191,162,0.25)',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.65rem',fontWeight:'900',cursor:'pointer'}}>
                  EXPORT XLS
                </button>
              </div>

              {/* ADD FORM */}
              <div style={{...styles.biCard,padding:'20px 25px'}}>
                <h4 style={{...styles.biTitle,marginBottom:'16px',color:'#d3bfa2'}}>ADD / RESTOCK INGREDIENT</h4>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr auto',gap:'12px',alignItems:'flex-end'}}>
                  {[{l:'NAME',k:'itemName',p:'e.g. Tomato',t:'text'},{l:'STOCK',k:'currentStock',p:'500',t:'number'},{l:'MIN THRESHOLD',k:'minThreshold',p:'100',t:'number'},{l:'COST (₹/unit)',k:'costPrice',p:'2.50',t:'number'}].map(f=>(
                    <div key={f.k}>
                      <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>{f.l}</label>
                      <input type={f.t} placeholder={f.p}
                        style={{width:'100%',padding:'10px 12px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}
                        value={newInventoryItem[f.k]} onChange={e=>setNewInventoryItem({...newInventoryItem,[f.k]:e.target.value})}/>
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'6px',textTransform:'uppercase'}}>UNIT</label>
                    <select style={{width:'100%',padding:'10px 12px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',cursor:'pointer'}}
                      value={newInventoryItem.unit} onChange={e=>setNewInventoryItem({...newInventoryItem,unit:e.target.value})}>
                      {['gm','kg','ml','l','pcs'].map(u=><option key={u} value={u}>{u.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:'0.55rem',color:'transparent',display:'block',marginBottom:'6px'}}>_</label>
                    <button onClick={async()=>{
                      if(!newInventoryItem.itemName?.trim()||!newInventoryItem.currentStock) return showNotif("Name and stock are required","error");
                      try {
                        const res=await axios.post(`${BASE_URL}/inventory/${tenantId}`,{
                          ...newInventoryItem,
                          currentStock:Number(newInventoryItem.currentStock),
                          minThreshold:Number(newInventoryItem.minThreshold)||0,
                          costPrice:Number(newInventoryItem.costPrice)||0
                        });
                        showNotif(res.data.merged?`${newInventoryItem.itemName} stock merged (+${newInventoryItem.currentStock})`:`${newInventoryItem.itemName} added`);
                        setNewInventoryItem({itemName:'',unit:'gm',currentStock:'',minThreshold:'',costPrice:''});
                        // ── Immediately refresh so the item appears in the ledger below
                        fetchManagementData();
                      } catch { showNotif("Failed to add ingredient","error"); }
                    }} style={{padding:'10px 20px',background:'linear-gradient(135deg,#d3bfa2,#bda88a)',color:'#000',border:'none',borderRadius:'8px',fontWeight:'900',fontSize:'0.75rem',cursor:'pointer',whiteSpace:'nowrap'}}>
                      + ADD
                    </button>
                  </div>
                </div>
              </div>

              {/* LEDGER TABLE */}
              <div style={styles.biCard}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                  <h4 style={{...styles.biTitle,margin:0,color:'#fff',fontSize:'0.85rem'}}>
                    CURRENT STOCK LEDGER <span style={{color:'#555',fontWeight:'500'}}>({inventory.filter(i=>i.itemName?.toLowerCase().includes(inventorySearchQuery.toLowerCase())).length} items)</span>
                  </h4>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#000',border:'1px solid #121212',borderRadius:'8px',padding:'8px 14px'}}>
                    <Search size={13} color="#444"/>
                    <input type="text" placeholder="Search ingredient..." value={inventorySearchQuery}
                      onChange={e=>setInventorySearchQuery(e.target.value)}
                      style={{background:'transparent',border:'none',color:'#fff',outline:'none',fontSize:'0.75rem',width:'140px'}}/>
                  </div>
                </div>
                {inventory.length===0 ? (
                  <div style={{textAlign:'center',padding:'50px',color:'#333',fontSize:'0.8rem',fontWeight:'700'}}>
                    NO INGREDIENTS ADDED YET — USE THE FORM ABOVE TO ADD YOUR FIRST ITEM
                  </div>
                ) : (
                  <div style={{overflowX:'auto'}} className="custom-scroll">
                    <table style={{width:'100%',borderCollapse:'collapse',minWidth:'700px'}}>
                      <thead>
{/* Replace the thead tr in the inventory table */}
<tr style={{ fontSize: '0.58rem', color: '#444', borderBottom: '1px solid #1a1a1a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
    {['Ingredient', 'Unit', 'Current Stock', 'Min Threshold ✎', 'Cost/Unit ✎', 'Stock Value', 'Status', 'Action'].map(h => (
        <th key={h} style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>{h}</th>
    ))}
</tr>
                      </thead>
                      <tbody>
                        {inventory.filter(i => i.itemName?.toLowerCase().includes(inventorySearchQuery.toLowerCase())).map(item => {
    const isLow = item.currentStock <= item.minThreshold;
    const sv = Math.round(item.currentStock * item.costPrice);
    return (
        <tr key={item._id} style={{ borderBottom: '1px solid #0d0d0d' }}>
            <td style={{ padding: '14px 16px 14px 0', fontWeight: '900', color: '#fff', fontSize: '0.82rem' }}>{item.itemName}</td>
            <td style={{ color: '#555', fontSize: '0.75rem', fontWeight: '800', paddingRight: '16px' }}>{item.unit}</td>

            {/* Current Stock — editable, updates stock only */}
            <td style={{ paddingRight: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="number"
                        key={`${item._id}-stock-${item.currentStock}`}
                        defaultValue={Math.max(0, item.currentStock)}
                        style={{ width: '80px', background: '#000', border: `1px solid ${item.currentStock < 0 ? 'rgba(186,117,23,0.4)' : '#1a1a1a'}`, color: item.currentStock < 0 ? '#BA7517' : '#d3bfa2', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '900', outline: 'none' }}
                        onBlur={async e => {
                            const val = Number(e.target.value);
                            await axios.patch(`${BASE_URL}/inventory/item/${item._id}`, { currentStock: val });
                            fetchManagementData();
                            showNotif(`${item.itemName} stock → ${val} ${item.unit}`);
                        }} />
                    {item.currentStock < 0 && <span title="Stock depleted" style={{ fontSize: '0.7rem', color: '#BA7517' }}>⚠</span>}
                </div>
            </td>

            {/* Min Threshold — separately editable, calls config route */}
            <td style={{ paddingRight: '16px' }}>
                <input type="number"
                    key={`${item._id}-thresh-${item.minThreshold}`}
                    defaultValue={item.minThreshold}
                    title="Edit min threshold — click away to save"
                    style={{ width: '70px', background: '#000', border: '1px solid #1a1a1a', color: '#888', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', outline: 'none' }}
                    onBlur={async e => {
                        const val = Number(e.target.value);
                        if (val === item.minThreshold) return; // no change
                        await axios.patch(`${BASE_URL}/inventory/item/${item._id}/config`, { minThreshold: val });
                        fetchManagementData();
                        showNotif(`${item.itemName} threshold → ${val} ${item.unit}`);
                    }} />
            </td>

            {/* Cost Price — separately editable, calls config route */}
            <td style={{ paddingRight: '16px' }}>
                <input type="number"
                    key={`${item._id}-cost-${item.costPrice}`}
                    defaultValue={item.costPrice}
                    step="0.01"
                    title="Edit cost per unit — click away to save"
                    style={{ width: '70px', background: '#000', border: '1px solid #1a1a1a', color: '#666', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', outline: 'none' }}
                    onBlur={async e => {
                        const val = Number(e.target.value);
                        if (val === item.costPrice) return; // no change
                        await axios.patch(`${BASE_URL}/inventory/item/${item._id}/config`, { costPrice: val });
                        fetchManagementData();
                        showNotif(`${item.itemName} cost → ₹${val}/${item.unit}`);
                    }} />
            </td>

            <td style={{ color: sv >= 0 ? '#d3bfa2' : '#8a704d', fontWeight: '900', fontSize: '0.82rem', paddingRight: '16px' }}>
                ₹{Math.abs(sv).toLocaleString()}{sv < 0 ? ' ⚠' : ''}
            </td>
            <td style={{ paddingRight: '16px' }}>
                <span style={{ fontSize: '0.58rem', padding: '3px 8px', borderRadius: '4px', fontWeight: '900', background: isLow ? 'rgba(138,112,77,0.12)' : 'rgba(211,191,162,0.04)', color: isLow ? '#BA7517' : '#444', border: `1px solid ${isLow ? 'rgba(186,117,23,0.25)' : '#1a1a1a'}` }}>
                    {isLow ? 'LOW STOCK' : 'OK'}
                </span>
            </td>
            <td>
                <button onClick={() => setConfirmModal({ show: true, title: `Remove ${item.itemName}?`, subtitle: 'Permanently delete this ingredient.', onConfirm: async () => { await axios.delete(`${BASE_URL}/inventory/item/${item._id}`); fetchManagementData(); showNotif(`${item.itemName} removed`); } })}
                    style={{ background: 'transparent', border: '1px solid #1a1a1a', color: '#444', padding: '5px 12px', borderRadius: '6px', fontSize: '0.6rem', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#BA7517'; e.currentTarget.style.borderColor = 'rgba(186,117,23,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = '#1a1a1a'; }}>
                    REMOVE
                </button>
            </td>
        </tr>
    );
})}
                      </tbody>
                      <tfoot>
                        <tr style={{borderTop:'2px solid #1a1a1a'}}>
                          <td colSpan="5" style={{padding:'14px 0',fontSize:'0.65rem',color:'#8a704d',fontWeight:'900',textTransform:'uppercase'}}>TOTAL STOCK VALUE</td>
                          <td style={{padding:'14px 0',fontWeight:'900',color:'#d3bfa2',fontSize:'0.95rem'}}>
                            ₹{inventory.reduce((a,i)=>a+Math.max(0,Math.round(i.currentStock*i.costPrice)),0).toLocaleString()}
                          </td>
                          <td colSpan="2"/>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* PROCUREMENT PREDICTOR */}
              {procurementData.length>0 && (
                <div style={{...styles.biCard,borderLeft:'4px solid #8a704d'}}>
                  <h4 style={styles.biTitle}><Truck size={16}/> PROCUREMENT PREDICTOR</h4>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'12px'}}>
                    {procurementData.slice(0,9).map(item=>{
                      const isUrg=item.daysRemaining!==null&&item.daysRemaining<=3;
                      const isWrn=item.daysRemaining!==null&&item.daysRemaining<=7;
                      return (
                        <div key={item._id} style={{background:'#050505',border:`1px solid ${isUrg?'rgba(138,112,77,0.35)':'#111'}`,padding:'14px',borderRadius:'12px'}}>
                          <div style={{fontWeight:'900',color:'#fff',fontSize:'0.8rem',marginBottom:'8px'}}>{item.itemName}</div>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                            <span style={{fontSize:'0.62rem',color:'#444'}}>{item.currentStock} {item.unit} left</span>
                            {item.daysRemaining!==null ? (
                              <span style={{fontSize:'0.65rem',fontWeight:'900',padding:'2px 8px',borderRadius:'4px',
                                background:isUrg?'rgba(138,112,77,0.15)':'rgba(211,191,162,0.04)',
                                color:isUrg?'#BA7517':isWrn?'#d3bfa2':'#555'}}>
                                {item.daysRemaining}d left
                              </span>
                            ) : <span style={{fontSize:'0.6rem',color:'#333'}}>No usage data</span>}
                          </div>
                          <div style={{height:'3px',background:'#111',borderRadius:'2px',overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${Math.min(100,item.daysRemaining!==null?Math.round((item.daysRemaining/30)*100):100)}%`,background:isUrg?'#8a704d':'#2a2a2a',borderRadius:'2px'}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              RECIPES — standalone, NOT inside any modal
              ════════════════════════════════════════════ */}
          {activeTab==='recipes' && (
            <motion.div key="recipes" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}
              style={{display:'flex',flexDirection:'column',gap:'25px',paddingBottom:'100px',width:'100%',maxWidth:'1100px',margin:'0 auto'}}>

              <div style={{paddingBottom:'20px',borderBottom:'1px solid #151515'}}>
                <h2 style={{margin:0,fontSize:'1.1rem',fontWeight:'900',color:'#fff'}}>RECIPE ENGINE</h2>
                <p style={{margin:'4px 0 0',fontSize:'0.7rem',color:'#555'}}>
                  Link each dish to ingredients + quantities per serving. Powers auto stock deduction and profitability.
                </p>
              </div>

              {/* BUILDER */}
              <div style={{...styles.biCard,borderTop:'3px solid #d3bfa2'}}>
                <h4 style={{...styles.biTitle,color:'#fff'}}><ChefHat size={18} color="#d3bfa2"/> RECIPE BUILDER — LINK DISH → INGREDIENTS</h4>
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'30px'}}>
                  <div>
                    <label style={{...styles.statLabel,color:'#888',display:'block',marginBottom:'8px'}}>SELECT MENU ITEM</label>
                    <select style={{...styles.input,marginBottom:0,background:'#000',borderColor:'#151515',cursor:'pointer'}}
                      value={activeRecipeItemId}
                      onChange={async e=>{
                        setActiveRecipeItemId(e.target.value);
                        if(e.target.value){
                          const res=await axios.get(`${BASE_URL}/recipes/${tenantId}`);
                          const ex=res.data.find(r=>r.menuItemId?.toString()===e.target.value);
                          setRecipeIngredientRows(ex?ex.ingredients.map(i=>({inventoryId:i.inventoryId?._id||i.inventoryId,quantityUsed:i.quantityUsed})):[{inventoryId:'',quantityUsed:''}]);
                        }
                      }}>
                      <option value="">-- Select a dish --</option>
                      {menuItems.map(m=><option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                    {activeRecipeItemId && (
                      <div style={{marginTop:'12px',padding:'12px',background:'#050505',border:'1px solid #111',borderRadius:'8px'}}>
                        <small style={{fontSize:'0.6rem',color:'#555',fontWeight:'800',display:'block',marginBottom:'6px'}}>SELECTED DISH INFO</small>
                        {(()=>{const m=menuItems.find(x=>x._id===activeRecipeItemId); return m?(<>
                          <div style={{fontSize:'0.85rem',fontWeight:'900',color:'#fff'}}>{m.name}</div>
                          <div style={{fontSize:'0.75rem',color:'#d3bfa2',marginTop:'4px'}}>₹{m.price}</div>
                          <div style={{fontSize:'0.65rem',color:'#555',marginTop:'2px'}}>{m.categoryId||'General'}</div>
                        </>):null;})()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{...styles.statLabel,color:'#888',display:'block',marginBottom:'8px'}}>INGREDIENTS PER SERVING</label>
                    {recipeIngredientRows.map((row,idx)=>(
                      <div key={idx} style={{display:'flex',gap:'10px',marginBottom:'10px',alignItems:'center'}}>
                        <select style={{flex:2,...styles.input,marginBottom:0,background:'#000',borderColor:'#151515',fontSize:'0.8rem',cursor:'pointer'}}
                          value={row.inventoryId}
                          onChange={e=>{const u=[...recipeIngredientRows];u[idx].inventoryId=e.target.value;setRecipeIngredientRows(u);}}>
                          <option value="">-- Select ingredient --</option>
                          {inventory.map(i=><option key={i._id} value={i._id}>{i.itemName} ({i.unit})</option>)}
                        </select>
                        <input type="number" placeholder="Qty" style={{flex:1,...styles.input,marginBottom:0,background:'#000',borderColor:'#151515',fontSize:'0.8rem'}}
                          value={row.quantityUsed} onChange={e=>{const u=[...recipeIngredientRows];u[idx].quantityUsed=e.target.value;setRecipeIngredientRows(u);}}/>
                        <button onClick={()=>setRecipeIngredientRows(p=>p.filter((_,i)=>i!==idx))}
                          style={{background:'transparent',border:'1px solid #222',color:'#444',padding:'8px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'0.7rem'}}>✕</button>
                      </div>
                    ))}
                    <div style={{display:'flex',gap:'12px',marginTop:'10px'}}>
                      <button onClick={()=>setRecipeIngredientRows(p=>[...p,{inventoryId:'',quantityUsed:''}])}
                        style={{...styles.ghostBtn,flex:1}}>+ ADD INGREDIENT</button>
                      <button onClick={async()=>{
                        if(!activeRecipeItemId) return showNotif("Select a menu item first","error");
                        const valid=recipeIngredientRows.filter(r=>r.inventoryId&&r.quantityUsed);
                        if(!valid.length) return showNotif("Add at least one ingredient","error");
                        try {
                          await axios.post(`${BASE_URL}/recipes/save`,{tenantId,menuItemId:activeRecipeItemId,
                            ingredients:valid.map(r=>({inventoryId:r.inventoryId,quantityUsed:Number(r.quantityUsed)}))});
                          showNotif("Recipe saved ✓");
                          fetchAnalytics();
                        } catch { showNotif("Failed to save recipe","error"); }
                      }} style={{...styles.mainBtn,flex:2,background:'linear-gradient(135deg,#d3bfa2,#bda88a)'}}>SAVE RECIPE</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECIPE CARDS */}
              <div style={styles.biCard}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                  <h4 style={{...styles.biTitle,margin:0,color:'#fff'}}>CONFIGURED RECIPES ({menuItems.length} dishes)</h4>
                  {/* ── Recipe search ── */}
                  <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#000',border:'1px solid #121212',borderRadius:'8px',padding:'8px 14px'}}>
                    <Search size={13} color="#444"/>
                    <input type="text" placeholder="Search dish..." value={recipeSearchQuery}
                      onChange={e=>setRecipeSearchQuery(e.target.value)}
                      style={{background:'transparent',border:'none',color:'#fff',outline:'none',fontSize:'0.75rem',width:'130px'}}/>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'15px'}}>
                  {menuItems.filter(m=>m.name.toLowerCase().includes(recipeSearchQuery.toLowerCase())).map(dish=>(
                    <div key={dish._id}
                      style={{background:'#050505',border:`1px solid ${activeRecipeItemId===dish._id?'rgba(211,191,162,0.4)':'#111'}`,
                        padding:'16px',borderRadius:'12px',cursor:'pointer',
                        transition:'border-color 0.2s'}}
                      onClick={async()=>{
                        setActiveRecipeItemId(dish._id);
                        const res=await axios.get(`${BASE_URL}/recipes/${tenantId}`);
                        const ex=res.data.find(r=>r.menuItemId?.toString()===dish._id.toString());
                        setRecipeIngredientRows(ex?ex.ingredients.map(i=>({inventoryId:i.inventoryId?._id||i.inventoryId,quantityUsed:i.quantityUsed})):[{inventoryId:'',quantityUsed:''}]);
                        // scroll to builder
                        window.scrollTo({top:0,behavior:'smooth'});
                      }}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                        <span style={{fontWeight:'900',color:'#fff',fontSize:'0.85rem'}}>{dish.name}</span>
                        <span style={{fontSize:'0.6rem',padding:'2px 8px',borderRadius:'4px',background:'rgba(211,191,162,0.05)',color:'#555',border:'1px solid #111'}}>₹{dish.price}</span>
                      </div>
                      <div style={{fontSize:'0.65rem',color:'#444',fontStyle:'italic'}}>
                        {activeRecipeItemId===dish._id?'✓ Currently editing':'Click to edit recipe →'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </section>{/* end scrollArea */}
      </main>

      {/* ════════════════════════════════════════════
          MODALS — rendered at root level, always correct position
          ════════════════════════════════════════════ */}

      {/* CONFIRM MODAL */}
      <AnimatePresence>
        {confirmModal.show && (
          <div style={styles.modalBackdrop}>
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} style={styles.confirmBox}>
              <h3 style={{color:'#fff',margin:'0 0 10px',fontSize:'1.1rem',fontWeight:'900'}}>{confirmModal.title}</h3>
              <p style={{color:'#666',fontSize:'0.85rem',marginBottom:'25px',lineHeight:'1.5'}}>{confirmModal.subtitle}</p>
              <div style={{display:'flex',gap:'12px'}}>
                <button onClick={()=>setConfirmModal({show:false,title:'',subtitle:'',onConfirm:null})} style={styles.cancelBtn}>CANCEL</button>
                <button onClick={()=>{if(confirmModal.onConfirm)confirmModal.onConfirm();setConfirmModal({show:false,title:'',subtitle:'',onConfirm:null});}} style={styles.confirmBtn}>CONFIRM</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRICE EDIT MODAL */}
      <AnimatePresence>
        {activePriceEditItem && (
          <div style={styles.modalBackdrop}>
            <motion.div initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
              style={{...styles.confirmBox,width:'420px',textAlign:'left'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
                <UtensilsCrossed size={20} color="#d3bfa2"/>
                <h3 style={{color:'#fff',margin:0,fontSize:'1.1rem',fontWeight:'900'}}>EDIT PRICING</h3>
              </div>
              <p style={{color:'#666',fontSize:'0.8rem',marginTop:'-10px',marginBottom:'20px'}}>
                Modifying: <b>{activePriceEditItem.name}</b>
              </p>
              {!activePriceEditItem.priceHalf ? (
                <div style={{marginBottom:'20px'}}>
                  <label style={{...styles.statLabel,color:'#888',display:'block',marginBottom:'8px'}}>PRICE (₹)</label>
                  <input type="number" style={{...styles.input,marginBottom:0,background:'#000',borderColor:'#222'}}
                    value={activePriceEditItem.price||''} onChange={e=>setActivePriceEditItem({...activePriceEditItem,price:Number(e.target.value)})}/>
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px',marginBottom:'20px'}}>
                  {[['HALF (₹)','priceHalf'],['FULL (₹)','priceFull']].map(([l,k])=>(
                    <div key={k}>
                      <label style={{...styles.statLabel,color:'#888',display:'block',marginBottom:'8px'}}>{l}</label>
                      <input type="number" style={{...styles.input,marginBottom:0,background:'#000',borderColor:'#222'}}
                        value={activePriceEditItem[k]||''} onChange={e=>setActivePriceEditItem({...activePriceEditItem,[k]:Number(e.target.value),price:k==='priceFull'?Number(e.target.value):activePriceEditItem.price})}/>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:'flex',gap:'12px',marginTop:'30px'}}>
                <button onClick={()=>setActivePriceEditItem(null)} style={styles.cancelBtn}>ABORT</button>
                <button onClick={()=>{
                  const payload=activePriceEditItem.priceHalf
                    ?{priceHalf:activePriceEditItem.priceHalf,priceFull:activePriceEditItem.priceFull,price:activePriceEditItem.priceFull}
                    :{price:activePriceEditItem.price};
                  updateMenu(activePriceEditItem._id,payload);
                  setActivePriceEditItem(null);
                }} style={styles.confirmBtn}>SAVE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE STAFF MODAL */}
      <AnimatePresence>
        {pendingDeleteStaff && (
          <div style={styles.modalBackdrop}>
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} style={styles.confirmBox}>
              <div style={{display:'flex',justifyContent:'center',color:'#ff4d4d',marginBottom:'15px'}}><AlertTriangle size={32}/></div>
              <h3 style={{color:'#fff',margin:'0 0 10px',fontSize:'1.1rem',fontWeight:'900'}}>PERMANENT WIPEOUT</h3>
              <p style={{color:'#666',fontSize:'0.85rem',marginBottom:'25px',lineHeight:'1.5'}}>
                Delete <b style={{color:'#fff'}}>{pendingDeleteStaff.name.split(' (')[0]}</b> and all their records?
              </p>
              <div style={{display:'flex',gap:'12px'}}>
                <button onClick={()=>setPendingDeleteStaff(null)} style={styles.cancelBtn}>ABORT</button>
                <button onClick={async()=>{
                  try {
                    await axios.delete(`${BASE_URL}/staff/remove/${pendingDeleteStaff._id}`);
                    setStaff(p=>p.filter(m=>m._id!==pendingDeleteStaff._id));
                    setAttendanceLogs(p=>p.filter(l=>l.staffId!==pendingDeleteStaff._id));
                    showNotif(`${pendingDeleteStaff.name.split(' (')[0]} removed`,"info");
                    fetchManagementData();
                  } catch { showNotif("Delete failed","error"); }
                  finally { setPendingDeleteStaff(null); }
                }} style={{...styles.confirmBtn,background:'#ff4d4d',color:'#fff'}}>PURGE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

<style>{`
  /* Scrollbars */
  .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  
  /* Sidebar nav */
  .sidebar-nav::-webkit-scrollbar { width: 2px; }
  .sidebar-nav::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
  .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
  
  /* Spinner */
  .spinner { border: 3px solid #111; border-top: 3px solid #d3bfa2; border-radius: 50%; width: 32px; height: 32px; animation: spin 0.8s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  
  /* Table rows */
  tr:hover td { background: rgba(255,255,255,0.01); }
  
  /* Nav button hover */
  button[style*="transparent"]:hover { opacity: 0.8; }
  
  /* Mono font for numbers */
  .mono { font-family: 'JetBrains Mono', 'Courier New', monospace; }
`}</style>
    </div>
  );
};

const styles = {
  dashboard:{display:'flex',width:'100vw',height:'100vh',background:'#050505',color:'#fff',position:'fixed',top:0,left:0,fontFamily:"'Inter', sans-serif"},
  sidebar:{width:'280px',background:'#080808',display:'flex',flexDirection:'column',borderRight:'1px solid #151515'},
  sidebarTop:{padding:'40px 25px',flex:1,overflowY:'auto'},
  logoWrapper:{marginBottom:'40px',paddingLeft:'10px'},
  sidebarLogo:{width:'140px',filter:'brightness(1.5)'},
  navStack:{display:'flex',flexDirection:'column',gap:'8px'},
  navBtn:{padding:'14px 20px',background:'transparent',border:'none',color:'#444',textAlign:'left',cursor:'pointer',borderRadius:'12px',fontWeight:'bold',fontSize:'0.78rem',display:'flex',alignItems:'center',transition:'0.3s'},
  activeTab:{padding:'14px 20px',background:'#111',border:'1px solid #222',color:'#d3bfa2',textAlign:'left',borderRadius:'12px',fontWeight:'900',fontSize:'0.78rem',display:'flex',alignItems:'center'},
  sidebarBottom:{padding:'25px',borderTop:'1px solid #151515'},
  operatorCard:{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',padding:'15px',background:'#0d0d0d',borderRadius:'12px',border:'1px solid #1a1a1a'},
  logoutBtn:{padding:'15px',width:'100%',background:'transparent',border:'1px solid #222',color:'#333',borderRadius:'10px',fontSize:'0.7rem',fontWeight:'900',cursor:'pointer'},
  mainContent:{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'},
  topHeader:{height:'100px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 50px',background:'#080808',borderBottom:'1px solid #151515',flexShrink:0},
  pageTitle:{fontSize:'1.2rem',fontWeight:'900',letterSpacing:'1px'},
  zoneControl:{display:'flex',gap:'10px',background:'#000',padding:'5px',borderRadius:'12px',border:'1px solid #1a1a1a'},
  zoneBtn:{padding:'8px 18px',background:'transparent',border:'none',color:'#333',fontSize:'0.7rem',fontWeight:'bold',cursor:'pointer'},
  activeZoneBtn:{padding:'8px 18px',background:'#d3bfa215',border:'none',color:'#d3bfa2',fontSize:'0.7rem',fontWeight:'900',borderRadius:'8px'},
  searchWrapper:{position:'relative',background:'#0d0d0d',padding:'10px 20px',borderRadius:'30px',border:'1px solid #1a1a1a',display:'flex',alignItems:'center',gap:'10px'},
  searchInput:{background:'transparent',border:'none',color:'#fff',outline:'none',width:'220px',fontSize:'0.8rem'},
  // ── KEY FIX: scrollArea fills remaining height and scrolls independently
  scrollArea:{flex:1,padding:'40px 50px',overflowY:'auto',overflowX:'hidden'},
  orderRow:{display:'flex',alignItems:'center',gap:'25px',background:'#0d0d0d',padding:'25px',borderRadius:'20px',border:'1px solid #1a1a1a',marginBottom:'15px'},
  tableCircle:{width:'45px',height:'45px',background:'#111',borderRadius:'12px',border:'1px solid #222',display:'flex',alignItems:'center',justifyContent:'center',color:'#d3bfa2',fontSize:'1.1rem',fontWeight:'900'},
  tableGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'},
  tableBtn:{padding:'30px',background:'#0d0d0d',border:'1px solid #151515',color:'#222',borderRadius:'15px',fontWeight:'900',cursor:'pointer',position:'relative'},
  receipt:{width:'450px',background:'#fff',color:'#000',padding:'50px',borderRadius:'2px',boxShadow:'0 30px 90px rgba(0,0,0,0.6)',margin:'0 auto',flexShrink:0,maxHeight:'calc(100vh - 200px)',overflowY:'auto'},
  receiptRow:{display:'flex',justifyContent:'space-between',marginBottom:'12px',fontSize:'0.9rem'},
  discountInput:{width:'50px',padding:'8px',border:'1px solid #ddd',textAlign:'center',borderRadius:'4px',fontWeight:'bold'},
  settleBtn:{width:'100%',padding:'20px',background:'#000',color:'#fff',border:'none',fontWeight:'900',letterSpacing:'1px',cursor:'pointer'},
  insightsWrapper:{maxWidth:'1000px',margin:'0 auto'},
  statsRow:{display:'flex',gap:'20px',marginBottom:'40px'},
  glassStat:{flex:1,padding:'30px',background:'#0d0d0d',borderRadius:'24px',border:'1px solid #1a1a1a'},
  statLabel:{color:'#333',fontWeight:'bold',fontSize:'0.65rem'},
  statVal:{fontSize:'2rem',fontWeight:'900',margin:'8px 0 0'},
  heatmapCard:{background:'#080808',padding:'40px',borderRadius:'30px',border:'1px solid #1a1a1a'},
  calendarGridHeader:{display:'grid',gridTemplateColumns:'repeat(7,1fr)',textAlign:'center',marginBottom:'25px'},
  dayHeader:{fontSize:'0.6rem',fontWeight:'900',color:'#222',letterSpacing:'1px'},
  calendarGrid:{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'10px'},
  heatSquare:{height:'70px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',cursor:'pointer',transition:'0.2s'},
  heatSquareEmpty:{height:'70px'},
  heatmapLegend:{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginTop:'40px',fontSize:'0.6rem',fontWeight:'bold'},
  marketingLayout:{display:'flex',gap:'30px',justifyContent:'center'},
  botCard:{background:'#0d0d0d',padding:'40px',borderRadius:'30px',border:'1px solid #1a1a1a',width:'100%',maxWidth:'450px',textAlign:'center'},
  cardHeaderSmall:{display:'flex',alignItems:'center',gap:'10px',justifyContent:'center',marginBottom:'20px',fontWeight:'900',fontSize:'0.8rem',color:'#d3bfa2'},
  qrContainer:{marginTop:'30px',padding:'30px',background:'#fff',borderRadius:'20px',display:'inline-block'},
  loginOverlay:{width:'100vw',height:'100vh',background:'#000',display:'flex',justifyContent:'center',alignItems:'center'},
  loginBox:{width:'450px',background:'#080808',padding:'60px',borderRadius:'40px',textAlign:'center',border:'1px solid #1a1a1a'},
  input:{width:'100%',padding:'18px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'14px',marginBottom:'20px',fontSize:'0.85rem',outline:'none',boxSizing:'border-box'},
  mainBtn:{width:'100%',padding:'20px',background:'#d3bfa2',color:'#000',border:'none',borderRadius:'14px',fontWeight:'900',cursor:'pointer'},
  toast:{position:'fixed',bottom:'40px',right:'40px',background:'#111',padding:'18px 30px',borderRadius:'16px',border:'1px solid #222',display:'flex',alignItems:'center',gap:'15px',zIndex:9999,fontWeight:'900',fontSize:'0.85rem',color:'#d3bfa2'},
  modalBackdrop:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.95)',backdropFilter:'blur(10px)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:9000},
  confirmBox:{width:'380px',background:'#0d0d0d',padding:'50px',borderRadius:'35px',textAlign:'center',border:'1px solid #1a1a1a'},
  confirmBtn:{flex:1,padding:'18px',background:'#d3bfa2',color:'#000',border:'none',borderRadius:'12px',fontWeight:'900',cursor:'pointer'},
  cancelBtn:{flex:1,padding:'18px',background:'#111',color:'#444',border:'none',borderRadius:'12px',fontWeight:'bold',cursor:'pointer'},
  premiumCard:{background:'#0d0d0d',padding:'30px',borderRadius:'24px',border:'1px solid #1a1a1a'},
  ghostBtn:{flex:1,padding:'12px',background:'transparent',border:'1px solid #222',color:'#444',borderRadius:'10px',fontSize:'0.7rem',fontWeight:'bold',cursor:'pointer'},
  toggleShowBtn:{flex:1,padding:'12px',background:'#d3bfa2',color:'#000',border:'none',borderRadius:'10px',fontWeight:'900',fontSize:'0.7rem',cursor:'pointer'},
  toggleHideBtn:{flex:1,padding:'12px',background:'#1a1a1a',color:'#333',border:'none',borderRadius:'10px',fontWeight:'900',fontSize:'0.7rem',cursor:'pointer'},
  fullWidthGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'25px'},
  gridLabel:{color:'#222',fontSize:'0.7rem',fontWeight:'900',marginBottom:'20px',letterSpacing:'1.5px'},
  specialModeRow:{display:'flex',gap:'15px',marginBottom:'30px'},
  specBtn:{flex:1,padding:'18px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#333',borderRadius:'15px',fontWeight:'900',display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',fontSize:'0.8rem',cursor:'pointer'},
  activeSpecBtn:{flex:1,padding:'18px',background:'#d3bfa2',border:'none',color:'#000',borderRadius:'15px',fontWeight:'900',display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',fontSize:'0.8rem',cursor:'pointer'},
  waiterRequestRow:{display:'flex',alignItems:'center',gap:'20px',background:'#111',padding:'15px 20px',borderRadius:'15px',border:'1px solid #d4af37',marginBottom:'12px'},
  goldCircle:{width:'40px',height:'40px',background:'#d4af3715',borderRadius:'10px',border:'1px solid #d4af37',display:'flex',alignItems:'center',justifyContent:'center',color:'#d4af37'},
  doneBtn:{background:'#d3bfa2',color:'#000',border:'none',padding:'8px 15px',borderRadius:'8px',fontWeight:'900',fontSize:'0.7rem',cursor:'pointer'},
  biCard:{background:'#0d0d0d',padding:'25px',borderRadius:'20px',border:'1px solid #1a1a1a'},
  biTitle:{fontSize:'0.75rem',fontWeight:'900',color:'#444',marginBottom:'20px',display:'flex',alignItems:'center',gap:'10px',letterSpacing:'1px'},
  sourceRow:{display:'flex',alignItems:'center',gap:'15px',marginBottom:'12px',fontSize:'0.8rem',color:'#999'},
  progressBg:{flex:1,height:'6px',background:'#111',borderRadius:'10px',overflow:'hidden'},
  progressFill:{height:'100%',background:'linear-gradient(90deg,#8a704d,#d3bfa2)',borderRadius:'10px'},
  headerMonthSelector:{display:'flex',alignItems:'center',gap:'12px',background:'#000',padding:'5px 15px',borderRadius:'12px',border:'1px solid #1a1a1a'},
  headerMonthNav:{background:'transparent',border:'none',color:'#444',cursor:'pointer',display:'flex',alignItems:'center'},
  headerMonthDisplay:{display:'flex',alignItems:'center',gap:'8px',minWidth:'100px',justifyContent:'center'},
  miniTab:{flex:1,padding:'10px',border:'none',background:'transparent',fontSize:'0.7rem',fontWeight:'900',cursor:'pointer',color:'#888',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'},
  activeMiniTab:{flex:1,padding:'10px',border:'none',background:'#fff',borderRadius:'8px',fontSize:'0.7rem',fontWeight:'900',boxShadow:'0 4px 12px rgba(0,0,0,0.08)',color:'#000',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'},
  billInput:{width:'100px',padding:'10px',border:'1px solid #eee',background:'#fafafa',borderRadius:'8px',textAlign:'right',fontWeight:'900',color:'#000',outline:'none'},
  modeBtn:{padding:'15px 5px',background:'#f9f9f9',border:'1px solid #eee',borderRadius:'12px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',fontSize:'0.65rem',fontWeight:'900',color:'#999',cursor:'pointer'},
  activeModeBtn:{padding:'15px 5px',background:'#000',border:'1px solid #000',borderRadius:'12px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',fontSize:'0.65rem',fontWeight:'900',color:'#fff',cursor:'pointer'},
  hudCountersRow:{display:'flex',alignItems:'center',gap:'0',background:'#0a0a0c',padding:'8px 0',borderRadius:'12px',border:'1px solid #16181f',marginRight:'20px',boxShadow:'inset 0 2px 8px rgba(0,0,0,0.8)'},
  hudStatBox:{padding:'4px 18px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minWidth:'110px'},
  hudStatLabel:{fontSize:'0.58rem',fontWeight:'800',color:'#4e5361',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'4px',textAlign:'center'},
  hudStatValue:{fontSize:'1.4rem',fontWeight:'900',fontFamily:'JetBrains Mono, monospace',color:'#ffffff',lineHeight:'1.1',letterSpacing:'-0.5px'},
sidebarTop: { 
  padding: '30px 20px', 
  flex: 1, 
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#222 transparent'
},

};

export default OperatorPortal;