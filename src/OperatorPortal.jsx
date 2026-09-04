import React, { useEffect, useState, useMemo, useCallback,useRef  } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, ReceiptIndianRupee, BarChart3,ClipboardList, FileClock, SquarePen, Boxes, ClipboardPenLine,
FileX2, UserRoundCog, WalletCards, CalendarCog, Target, GitCompareArrows, Minus, ArrowUpRight,UserRound ,EyeOff ,
  Search, CheckCircle2, BellRing, MessageSquare, Sparkles, AlertTriangle, 
  SendHorizontal, CookingPot, Percent, Smartphone, QrCode,
  Timer, Clock, Layers, TrendingUp, Globe, Calendar, ChevronLeft, ChevronRight,
  User, ShieldCheck, Zap, MousePointer2, ShoppingBag, Truck, X, CreditCard, Banknote,
  ChefHat,Users, Clock3, UserCheck, PackageCheck, Hourglass, AlertOctagon,
  Store, RefreshCw, Hash, TableProperties, ArrowRightCircle, CircleDot,  Droplets, IceCream, Package2, Citrus, 
  Droplet, Wind, Milk, Candy, Box,CalendarClock ,StickyNote, Star, Repeat, Puzzle, XCircle, Award,
  ArrowUp, ArrowDown, Lightbulb, Activity, ClipboardCheck,Wallet ,FileText,Trash2 ,TrendingDown,ReceiptText,AlignJustify,Package,
  MessageCircle, ThumbsUp, ThumbsDown, Send, Tag, Gift, Megaphone,BadgeCheck, Crown, UserX, UserPlus, PhoneCall,AlertCircle,BarChart2 ,Bell , Eye,
  ShoppingCart, Copy,Flame 
} from 'lucide-react';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

const getTimeRemaining = (expiresAt) => {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return null;
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs >= 24) {
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}h`;
  }
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

// ADD near the top of OperatorPortal.jsx, after imports:
axios.interceptors.response.use(
  res => res,
  async (error) => {
    const config = error.config;
    const isRetryable = error.response?.status === 503 || error.code === 'ERR_NETWORK';
    if (isRetryable && !config._retried) {
      config._retried = true;
      await new Promise(r => setTimeout(r, 1500));
      return axios(config);
    }
    return Promise.reject(error);
  }
);


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

const playSFX = (type = 'default') => {
  const sounds = {
    waitlist:    'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',  // chime
    pickup:      'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',  // bell
    reservation: 'https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3',  // soft ping
    default:     'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  };
  new Audio(sounds[type] || sounds.default).play().catch(() => {});
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

const formatDuration = (totalMinutes) => {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const AnnouncementPreviewCard = ({ data }) => {
  const colorMap = {
    gold:  { bg: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.04))', border: 'rgba(201,168,76,0.35)', text: '#e8c96a' },
    green: { bg: 'linear-gradient(135deg, rgba(138,154,126,0.15), rgba(138,154,126,0.04))', border: 'rgba(138,154,126,0.35)', text: '#a8c090' },
    rose:  { bg: 'linear-gradient(135deg, rgba(196,138,138,0.15), rgba(196,138,138,0.04))', border: 'rgba(196,138,138,0.35)', text: '#d4a0a0' },
    blue:  { bg: 'linear-gradient(135deg, rgba(106,142,168,0.15), rgba(106,142,168,0.04))', border: 'rgba(106,142,168,0.35)', text: '#9ec0d8' },
  };
  const c = colorMap[data.accentColor] || colorMap.gold;
  const IconComp = data.type === 'offer' ? Tag : data.type === 'discount' ? Percent : data.type === 'wish' ? Sparkles : Megaphone;

  return (
    <div style={{
      background: '#000', borderRadius: '16px', padding: '4px',
      border: '1px solid #1a1a1a'
    }}>
      <div style={{
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: '13px',
        padding: '16px 18px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: `linear-gradient(90deg,transparent,${c.text},transparent)` }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <IconComp size={16} color={c.text} strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: '900', color: '#fff', marginBottom: '4px', lineHeight: 1.3 }}>
              {data.title || 'Your headline appears here'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              {data.message || 'Your message appears here'}
            </div>
            {data.discountValue && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '9px',
                padding: '4px 11px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.08)', border: `1px solid ${c.border}`
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '900', color: c.text, fontFamily: 'monospace' }}>
                  {data.discountType === 'percent' ? `${data.discountValue}% OFF` : `₹${data.discountValue} OFF`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
const [notif, setNotif] = useState({ show: false, msg: '', type: 'success', subtype: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', subtitle: '', onConfirm: null });
  const [wipingStaffId, setWipingStaffId] = useState(null); 

const [ingredientAlerts, setIngredientAlerts] = useState([]);
  const [isDownloadingAllBills, setIsDownloadingAllBills] = useState(false);

  // ── EXTRA ITEMS (Cold drinks, Ice creams, etc.)
const [extraItems, setExtraItems] = useState([]);
const [extraItemsLoading, setExtraItemsLoading] = useState(false);
// Replace existing newExtraItem state:
const [newExtraItem, setNewExtraItem] = useState({
  name: '', category: 'Cold Drinks', price: '', costPrice: '', // ← ADD costPrice
  unit: 'piece', currentStock: '', description: '', isAvailable: true, image: ''
});
const [extraRestockModal, setExtraRestockModal] = useState(null); // { item, qty }
const [extraRestockQty, setExtraRestockQty] = useState('');

const categoryIcons = {
  'Cold Drinks':     <Droplets   size={13} color="#d3bfa2" />,
  'Ice Cream':       <IceCream   size={13} color="#d3bfa2" />,
  'Packaged Snacks': <Package2   size={13} color="#d3bfa2" />,
  'Juices':          <Citrus     size={13} color="#d3bfa2" />,
  'Mineral Water':   <Droplet    size={13} color="#d3bfa2" />,
  'Tobacco':         <Wind       size={13} color="#d3bfa2" />,
  'Dairy':           <Milk       size={13} color="#d3bfa2" />,
  'Sweets':          <Candy      size={13} color="#d3bfa2" />,
  'Other':           <Box        size={13} color="#d3bfa2" />,
};

const categoryIconsLg = {
  'Cold Drinks':     <Droplets   size={16} color="#d3bfa2" />,
  'Ice Cream':       <IceCream   size={16} color="#d3bfa2" />,
  'Packaged Snacks': <Package2   size={16} color="#d3bfa2" />,
  'Juices':          <Citrus     size={16} color="#d3bfa2" />,
  'Mineral Water':   <Droplet    size={16} color="#d3bfa2" />,
  'Tobacco':         <Wind       size={16} color="#d3bfa2" />,
  'Dairy':           <Milk       size={16} color="#d3bfa2" />,
  'Sweets':          <Candy      size={16} color="#d3bfa2" />,
  'Other':           <Box        size={16} color="#d3bfa2" />,
};


const [extraItemsInBill, setExtraItemsInBill] = useState([]);
const [showExtraItemPicker, setShowExtraItemPicker] = useState(false);
const [extraItemPickerSearch, setExtraItemPickerSearch] = useState('');

const [editDishModal, setEditDishModal] = useState(null); // holds the dish being edited
const [editDishData, setEditDishData] = useState({});

const [recipes, setRecipes] = useState([]);

const [extraItemSearchQuery, setExtraItemSearchQuery] = useState('');
const [extraItemEditModal, setExtraItemEditModal] = useState(null);
const [extraItemEditData, setExtraItemEditData] = useState({});
const [activeExtraCategory, setActiveExtraCategory] = useState('All');

const [aggregatorConfig, setAggregatorConfig] = useState({ swiggy: { enabled: false }, zomato: { enabled: false } });
const [sessionAlerts, setSessionAlerts] = useState([]); // [{ platform, message }]
const [showAggregatorSettings, setShowAggregatorSettings] = useState(false);
const [aggregatorEditData, setAggregatorEditData] = useState({ swiggy: {}, zomato: {} });
const [incomingAggregatorOrders, setIncomingAggregatorOrders] = useState([]); // queue of orders awaiting accept/reject
const [activeAggregatorPopup, setActiveAggregatorPopup] = useState(null);     // the one currently shown

// ── Customer Intelligence ──
const [customerDir, setCustomerDir]           = useState({ customers: [], summary: {} });
const [customerSegFilter, setCustomerSegFilter] = useState('all');
const [customerSearch, setCustomerSearch]     = useState('');
const [customerLoading, setCustomerLoading]   = useState(false);
const [customerProfile, setCustomerProfile]   = useState(null); // drawer
  const [purchaseOrderModal, setPurchaseOrderModal] = useState(null);
 
// ── Marketing ──
const [offers, setOffers]                     = useState([]);
const [campaigns, setCampaigns]               = useState([]);
const [marketingSubTab, setMarketingSubTab] = useState('offers');
const [announcements, setAnnouncements] = useState([]);
const [newAnnouncement, setNewAnnouncement] = useState({
  title: '', message: '', type: 'offer', accentColor: 'gold', icon: 'tag',
  discountValue: '', discountType: 'percent',
  startDate: '', startTime: '',       // ← NEW: scheduled start
  expiryDate: '', expiryTime: ''
});
const [newOffer, setNewOffer]                 = useState({
  title: '', type: 'percent_off', value: '', freeItem: '',
  minOrder: '', categoryId: '', happyStart: '', happyEnd: '', expiresAt: ''
});
const [newCampaign, setNewCampaign]           = useState({
  title: '', body: '', segment: 'all', customPhones: ''
});
const [campaignSending, setCampaignSending]   = useState(false);

const [feedbackData, setFeedbackData] = useState({ feedback: [], summary: { total: 0, unread: 0, avgRating: 0 } });
const [feedbackLoading, setFeedbackLoading] = useState(false);
const [feedbackNoteModal, setFeedbackNoteModal] = useState(null);
const [feedbackNoteText, setFeedbackNoteText] = useState('');
const [feedbackMonth, setFeedbackMonth]   = useState(() => {
  const d = new Date(new Date().getTime() + 330*60*1000);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
});
 
  // ── IST today string — used for billing HUD and daily breakdowns
const istTodayStr = useMemo(() => {
  return new Date(new Date().getTime() + 330*60*1000).toISOString().split('T')[0];
}, []);

  const tenantId = localStorage.getItem('active_tenant') || 'jay_ambe_fusion';
  const logoPath = `${import.meta.env.BASE_URL}logo.png`;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rosterSearchQuery, setRosterSearchQuery] = useState("");
  const [topPerformers, setTopPerformers] = useState([]);
  const [bottomPerformers, setBottomPerformers] = useState([]);
  const [activePriceEditItem, setActivePriceEditItem] = useState(null);
  const [pendingDeleteStaff, setPendingDeleteStaff] = useState(null);
  const [tenantConfig, setTenantConfig] = useState(null);

  const [queueSearch, setQueueSearch] = useState('');
  const [pickupPaymentModal, setPickupPaymentModal] = useState(null); // { entry } | null
const [pickupPaymentMethod, setPickupPaymentMethod] = useState('cash');
  const [wastageAnalytics, setWastageAnalytics] = useState(null);

  // ── These are re-fetched whenever viewDate changes (month selector)
  const [trendsData, setTrendsData] = useState(null);
  const [hourlyAnalytics, setHourlyAnalytics] = useState({ hourly: [], dayOfWeek: [] });
  const [prepTimeData, setPrepTimeData] = useState(null);
  const [profitabilityData, setProfitabilityData] = useState([]);
  const [procurementData, setProcurementData] = useState([]);
  const [staffEfficiency, setStaffEfficiency] = useState([]);
  const [categoryRankings, setCategoryRankings] = useState({});

const [newInventoryItem, setNewInventoryItem] = useState({ itemName: '', unit: 'gm', currentStock: '', minThreshold: '', costPrice: '', purchasePrice: '', vendor: '' });  const [activeRecipeItemId, setActiveRecipeItemId] = useState('');
  const [recipeIngredientRows, setRecipeIngredientRows] = useState([{ inventoryId: '', quantityUsed: '' }]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  // ── NEW: recipe search
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  const [isSettling, setIsSettling] = useState(false);

  const [inventorySuggestions, setInventorySuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
// ADD after: const [showSuggestions, setShowSuggestions] = useState(false);
const [purchaseHistoryItem, setPurchaseHistoryItem] = useState(null); // drawer
const [purchaseHistoryData, setPurchaseHistoryData] = useState(null);
const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
const [selectedExistingItem, setSelectedExistingItem] = useState(null);

const [monthlySalaryRecords, setMonthlySalaryRecords] = useState([]); // per-month records
const [salaryEditModal, setSalaryEditModal] = useState(null); // { staffId, name, currentSalary }
const [salaryEditValue, setSalaryEditValue] = useState('');
const [salaryEditPassword, setSalaryEditPassword] = useState('');
const tableCount = parseInt(localStorage.getItem('table_count')) || 12;

const [extraAnalytics, setExtraAnalytics] = useState(null);
const [extraAnalyticsLoading, setExtraAnalyticsLoading] = useState(false);

  // ── attendanceLogs holds MONTHLY logs (for ledger count) + today (for clock-in UI)
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [ledgerSortConfig, setLedgerSortConfig] = useState({ key: 'name', direction: 'asc' });
  
const [showAddDishModal, setShowAddDishModal] = useState(false);
const [newDish, setNewDish] = useState({
  name: '', name_mr: '', categoryId: '', price: '', priceHalf: '', priceFull: '',
  isVeg: false, isChefSpecial: false, isAvailable: true,
  ingredients: { en: '', mr: '' }, spicylevel: '', tags: ''
});
const [pendingDeleteDish, setPendingDeleteDish] = useState(null);
const [categories, setCategories] = useState([]);
const [auditLogs, setAuditLogs] = useState([]);
  const occupiedTables = useMemo(() => [
    ...new Set(orders.filter(o => ['pending','ready','served'].includes(o.status)).map(o => o.tableNumber.toString()))
  ], [orders]);
// ── OPERATOR ASSISTANT ──
const [assistMessages, setAssistMessages] = useState([
  { role: 'system', text: 'Hello. Ask me anything about your restaurant — orders, revenue, stock, staff, or menu performance.', ts: new Date() }
]);
const [assistInput,    setAssistInput]    = useState('');
const [assistLoading,  setAssistLoading]  = useState(false);
const assistEndRef = useRef(null);
const [assistFilterCat, setAssistFilterCat] = useState('ALL');
const [waitlistAnalytics, setWaitlistAnalytics] = useState(null);
const [aggregatorAnalytics, setAggregatorAnalytics] = useState(null);

const [aiBrain, setAiBrain] = useState(null);

const fetchAiBrain = useCallback(async () => {
  try {
    const r = await axios.get(`${BASE_URL}/admin/analytics/ai-brain/${tenantId}`);
    setAiBrain(r.data);
  } catch { /* non-fatal */ }
}, [tenantId]);

const fetchAuditLogs = useCallback(async () => {
  try {
const r = await axios.get(`${BASE_URL}/admin/audit/${tenantId}?limit=200`);

setAuditLogs(r.data);
  } catch {}
}, [tenantId]);



const [menuVegFilter, setMenuVegFilter] = useState('all'); // 'all' | 'veg' | 'nonveg'
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


  const [inventoryLoading, setInventoryLoading] = useState(false);
  // ─────────────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ─────────────────────────────────────────────────────

const [assignTableModal, setAssignTableModal] = useState(null);
const [waitlistEntries,  setWaitlistEntries]  = useState([]);
const [pickupEntries,    setPickupEntries]     = useState([]);
const [reservationEntries, setReservationEntries] = useState([]);
const [avgWaitData,      setAvgWaitData]       = useState(null);
const [queueTab,         setQueueTab]          = useState('waitlist');
const [reservationViewDate, setReservationViewDate] = useState(() => {
  const d = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
  return d.toISOString().split('T')[0];
});
const [reservationEditModal, setReservationEditModal] = useState(null);


// ═══════════════════════════════════════════════════════════════
// ADD THIS HOOK near the top of OperatorPortal, after your
// existing state declarations (around line where acknowledgedTables is defined)
// ═══════════════════════════════════════════════════════════════

// Tracks the oldest active order's createdAt per table
// Shape: { "3": Date, "7": Date, ... }
const [tableTimerStartMap, setTableTimerStartMap] = useState({});
// Elapsed minutes per table — updated every 30s by a single interval
const [tableElapsedMap, setTableElapsedMap] = useState({});

// Rebuild tableTimerStartMap whenever orders list changes
useEffect(() => {
  const map = {};
  orders.forEach(order => {
    if (!['pending', 'ready', 'served'].includes(order.status)) return;
    const tbl = order.tableNumber?.toString();
    if (!tbl) return;
    const t = new Date(order.createdAt).getTime();
    if (!map[tbl] || t < map[tbl]) map[tbl] = t; // keep oldest
  });
  setTableTimerStartMap(map);
}, [orders]);

// Single interval that recalculates ALL elapsed times every 30s
useEffect(() => {
  const calc = () => {
    const now = Date.now();
    const elapsed = {};
    Object.entries(tableTimerStartMap).forEach(([tbl, startMs]) => {
      elapsed[tbl] = Math.floor((now - startMs) / 60000);
    });
    setTableElapsedMap(elapsed);
  };
  calc(); // immediate first calc
  const id = setInterval(calc, 30000);
  return () => clearInterval(id);
}, [tableTimerStartMap]);

// ── HELPER — formats minutes into display string ──────────────
const formatTableTimer = (mins) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ── HELPER — returns timer colour from the gold/amber palette only ──
// No red, green, blue anywhere.
const getTimerStyle = (mins) => {
  if (mins >= 30) return { color: '#d3bfa2', fontWeight: '900' };  // gold primary — critical age
  if (mins >= 15) return { color: '#BA7517', fontWeight: '800' };  // amber warning
  if (mins >= 5)  return { color: '#8a704d', fontWeight: '700' };  // gold-deep — warming up
  return { color: '#444',    fontWeight: '600' };                  // muted — fresh
};

const fetchCounterQueue = useCallback(async () => {
  try {
    const [qRes, aRes, rRes] = await Promise.all([
      axios.get(`${BASE_URL}/waitlist/${tenantId}`),
      axios.get(`${BASE_URL}/waitlist/avg-wait/${tenantId}`),
      axios.get(`${BASE_URL}/reservations/${tenantId}?date=${reservationViewDate}`)
        .catch(() => ({ data: [] }))
    ]);
    const allWaitlist = qRes.data.waitlist || [];
    const allPickup   = qRes.data.pickupQueue || [];
    setWaitlistEntries(
      allWaitlist.filter(e =>
        !['assigned','seated','settled','no-show','completed'].includes(e.status)
      )
    );
    setPickupEntries(
      allPickup.filter(e =>
        !['settled','completed','cancelled'].includes(e.status)
      )
    );
    setReservationEntries(rRes.data || []);
    setAvgWaitData(aRes.data);
  } catch { }
}, [tenantId, reservationViewDate]);

const fetchAnnouncements = useCallback(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/announcements/${tenantId}`);
    setAnnouncements(res.data || []);
  } catch { setAnnouncements([]); }
}, [tenantId]);


// Fetch wastage analytics for current month
const fetchWastageAnalytics = useCallback(async () => {
  try {
    const month = viewDate.getFullYear() + '-' + String(viewDate.getMonth() + 1).padStart(2, '0');
    const res = await axios.get(`${BASE_URL}/wastage/analytics/${tenantId}?month=${month}`);
    setWastageAnalytics(res.data);
  } catch (err) {
    console.error('Wastage analytics fetch failed:', err.message);
    setWastageAnalytics({ totalCost: 0, totalEntries: 0, byReason: {}, topWasted: [], dailyTrend: [], monthLabel: '' });
  }
}, [tenantId, viewDate]);

// // Add this right after your existing waitlistEntries state
// useEffect(() => {
//   setWaitlistEntries(prev => 
//     prev.filter(e => e.status === 'waiting' || e.status === 'pending')
//   );
// }, [waitlistEntries.length]);


const fetchExtraAnalytics = useCallback(async () => {
  setExtraAnalyticsLoading(true);
  try {
    const res = await axios.get(`${BASE_URL}/extra-items/analytics/${tenantId}`);
    setExtraAnalytics(res.data || null);
  } catch { setExtraAnalytics(null); }
  finally { setExtraAnalyticsLoading(false); }
}, [tenantId]);


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
      fetchCounterQueue();
    } catch (err) { console.error("Data Sync Error:", err); }
  }, [tenantId, fetchCounterQueue]);


  const fetchAggregatorConfig = useCallback(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/tenant/aggregator-config/${tenantId}`);
    setAggregatorConfig(res.data);
    setAggregatorEditData(res.data);
  } catch { /* silent */ }
}, [tenantId]);

// REPLACE fetchAnalytics entirely:
 
const fetchAnalytics = useCallback(async () => {
  try {
    const istNow = new Date(new Date().getTime() + 330*60*1000);
    const todayStr = istNow.toISOString().split('T')[0];
    const selectedMonthStr = viewDate.getFullYear() + '-' + String(viewDate.getMonth()+1).padStart(2,'0');
 
    // Check if viewDate is the current month — hourly only makes sense for today
    const isCurrentMonth =
      viewDate.getFullYear() === istNow.getFullYear() &&
      viewDate.getMonth()    === istNow.getMonth();
 
    // For past months, use the last day of that month as the "date" for hourly
    const hourlyDate = isCurrentMonth
      ? todayStr
      : `${selectedMonthStr}-01`; // will return minimal data for past months (expected)
 
const results = await Promise.allSettled([
      axios.get(`${BASE_URL}/admin/analytics/${tenantId}?month=${selectedMonthStr}`),
      axios.get(`${BASE_URL}/admin/analytics/hourly/${tenantId}?date=${hourlyDate}&month=${selectedMonthStr}`),
      axios.get(`${BASE_URL}/admin/analytics/trends/${tenantId}?month=${selectedMonthStr}`),
      axios.get(`${BASE_URL}/admin/analytics/preptime/${tenantId}?month=${selectedMonthStr}`),
      axios.get(`${BASE_URL}/admin/analytics/profitability/${tenantId}?month=${selectedMonthStr}`),
      axios.get(`${BASE_URL}/admin/analytics/procurement/${tenantId}`),
      axios.get(`${BASE_URL}/admin/analytics/staff-efficiency/${tenantId}?month=${selectedMonthStr}`),
      axios.get(`${BASE_URL}/admin/analytics/waitlist/${tenantId}?month=${selectedMonthStr}`),
      axios.get(`${BASE_URL}/wastage/analytics/${tenantId}?month=${selectedMonthStr}`),
      axios.get(`${BASE_URL}/extra-items/analytics/${tenantId}`),
      // ── NEW: swiggy/zomato aggregator analytics ──
      axios.get(`${BASE_URL}/admin/analytics/aggregator/${tenantId}?month=${selectedMonthStr}`),
    ]);
 
    const [
      analyticsRes, hourlyRes, trendsRes, prepRes,
      profitRes, procureRes, staffEffRes, waitlistRes,
      wastageRes, extraRes, aggregatorRes
    ] = results;
 
    const val = (r, fallback) => r.status === 'fulfilled' ? r.value.data : fallback;
 
    setAnalytics(val(analyticsRes, { salesData: [] }).salesData || []);
    setTopPerformers(val(analyticsRes, { topItems: [] }).topItems || []);
    setBottomPerformers(val(analyticsRes, { bottomItems: [] }).bottomItems || []);
    setCategoryRankings(val(analyticsRes, { categoryRankings: {} }).categoryRankings || {});
    setHourlyAnalytics({
      hourly:    val(hourlyRes, { hourly: [] }).hourly    || [],
      dayOfWeek: val(hourlyRes, { dayOfWeek: [] }).dayOfWeek || []
    });
    setTrendsData(val(trendsRes, null));
    setPrepTimeData(val(prepRes, null));
    setProfitabilityData(val(profitRes, []));
    setProcurementData(val(procureRes, []));
    setStaffEfficiency(val(staffEffRes, { efficiency: [] }).efficiency || []);
 
    const waitlistData = val(waitlistRes, null);
    setWaitlistAnalytics(waitlistData);
 
    // ── NEW: set wastage and extra analytics from combined fetch ──
 setWastageAnalytics(val(wastageRes, null));
    setExtraAnalytics(val(extraRes, null));
    setAggregatorAnalytics(val(aggregatorRes, { enabled: false, swiggy: null, zomato: null }));
 
  } catch (err) { console.error("Analytics fetch error:", err); }
}, [tenantId, viewDate]); 

const fetchMonthlySalary = useCallback(async (monthStr) => {
  try {
    const res = await axios.get(`${BASE_URL}/staff/salary/${tenantId}/${monthStr}`);
    setMonthlySalaryRecords(res.data || []);
  } catch { setMonthlySalaryRecords([]); }
}, [tenantId]);

const fetchManagementData = useCallback(async () => {
  setInventoryLoading(true);
  try {
    const [invRes, staffRes, menuRes, catRes] = await Promise.all([
      axios.get(`${BASE_URL}/inventory/${tenantId}`).catch(() => ({ data: [] })),
      axios.get(`${BASE_URL}/staff/${tenantId}`).catch(() => ({ data: [] })),
      axios.get(`${BASE_URL}/menu/${tenantId}`).catch(() => ({ data: [] })),
      axios.get(`${BASE_URL}/categories/${tenantId}`).catch(() => ({ data: [] }))
    ]);
    // ADD after the existing Promise.all in fetchManagementData:
const tenantRes = await axios.get(`${BASE_URL}/tenant/${tenantId}`).catch(() => ({ data: null }));
if (tenantRes.data) setTenantConfig(tenantRes.data);
    setInventory(invRes.data || []);
    setStaff(staffRes.data || []);
    setMenuItems(menuRes.data || []);
    setCategories(catRes.data || []);
    // ← ENSURE THIS IS HERE:
    const monthPrefix = viewDate.getFullYear() + '-' + String(viewDate.getMonth() + 1).padStart(2, '0');
    fetchMonthlySalary(monthPrefix);
    fetchCounterQueue ();
  } catch (err) { console.error("Management Sync Error", err); }
  finally { setInventoryLoading(false); }
}, [tenantId, viewDate, fetchMonthlySalary,fetchCounterQueue ]);


// ADD after fetchManagementData:
const fetchPurchaseHistory = useCallback(async (itemId) => {
    setPurchaseHistoryLoading(true);
    try {
        const res = await axios.get(`${BASE_URL}/inventory/item/${itemId}/history`);
        setPurchaseHistoryData(res.data);
    } catch { setPurchaseHistoryData(null); }
    finally { setPurchaseHistoryLoading(false); }
}, []);

const fetchExtraItems = useCallback(async () => {
  setExtraItemsLoading(true);
  try {
    const res = await axios.get(`${BASE_URL}/extra-items/${tenantId}`);
    setExtraItems(res.data || []);
  } catch { setExtraItems([]); }
  finally { setExtraItemsLoading(false); }
}, [tenantId]);


const deductExtraItemStock = useCallback(async (itemId, qty) => {
  try {
    await axios.patch(`${BASE_URL}/extra-items/item/${itemId}/restock`, { 
      addQty: -Math.abs(qty)  // negative qty = deduction
    });
  } catch (err) {
    console.error('Extra item stock deduction failed:', err);
  }
}, []);

useEffect(() => {
  if (!isAuthenticated) return;
  const monthPrefix = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
  fetchMonthlySalary(monthPrefix);
}, [isAuthenticated, viewDate, fetchMonthlySalary]);

useEffect(() => {
  if (isAuthenticated) {
    fetchAnalytics();
    fetchExtraAnalytics();   // ← ADD THIS LINE
        fetchAiBrain();
fetchAuditLogs();
    const monthPrefix = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
    if (activeTab === 'management') fetchMonthlySalary(monthPrefix);
  }
}, [isAuthenticated, viewDate, fetchAnalytics, fetchMonthlySalary, fetchExtraAnalytics]);

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
      socket.on('ingredient_out_of_stock', (data) => {
    setIngredientAlerts(prev => {
        // Deduplicate: if same ingredient already has an active alert, replace it
        const filtered = prev.filter(a => a.ingredientName !== data.ingredientName);
        return [
            {
                id:             `${data.ingredientName}-${Date.now()}`,
                ingredientName: data.ingredientName,
                affectedDishes: data.affectedDishes || [],
                dishCount:      data.dishCount || 0,
                autoHidden:     data.autoHidden || false,
                alertAt:        data.alertAt || new Date().toISOString(),
                dismissed:      false,
            },
            ...filtered,
        ].slice(0, 10); // keep at most 10 active alerts
    });
 
    // Auto-dismiss after 60 seconds so the screen doesn't fill up
    setTimeout(() => {
        setIngredientAlerts(prev => prev.filter(a => a.ingredientName !== data.ingredientName));
    }, 60000);
});
      socket.on("new_waiter_request", (request) => {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
        showNotif(`Service Request: Table ${request.tableNumber}`, "info");
        setWaiterRequests(prev => [request, ...prev]);
      });
socket.on("menu_updated", (updatedItem) => {
  if (!updatedItem) return;
  setMenuItems(prev => {
    const exists = prev.some(i => i._id === updatedItem._id);
    if (exists) {
      return prev.map(item => item._id === updatedItem._id ? updatedItem : item);
    }
    return [...prev, updatedItem];
  });
}); 
socket.on('menu_item_restored', ({ itemId, item }) => {
  setMenuItems(prev =>
    prev.map(i => i._id === itemId ? { ...i, ...item } : i)
  );
});
socket.on("table_occupied_live", (data) => {
    setOrders(prevOrders => {
        const exists = prevOrders.some(
            o => o.tableNumber === data.tableNumber && o.status === 'pending'
        );
        if (!exists) {
            return [{
                _id: `live-stub-${Date.now()}`,
                tenantId,
                tableNumber: data.tableNumber,
                status: 'pending',
                items: [],
                createdAt: new Date()
            }, ...prevOrders];
        }
        return prevOrders;
    });
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
});

// ← FIXED: moved OUT of table_occupied_live, now a separate top-level listener:
socket.on('low_rating_alert', (data) => {
    new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
    showNotif(
        `⚠ Low rating (${data.rating}★) from Table ${data.tableNumber} — check Feedback tab`,
        'error'
    );
});

      socket.on("menu_item_deleted", ({ itemId }) => {
  setMenuItems(prev => prev.filter(m => m._id !== itemId));
  showNotif("Menu item removed by operator", "info");
});

socket.on('new_waitlist_entry', (data) => {
  fetchCounterQueue();
  playSFX('waitlist');
  showNotif(
    `New walk-in — ${data?.customerName || 'Guest'} · Party of ${data?.partySize || '?'}`,
    'info', 'waitlist'
  );
});

socket.on('new_reservation', (data) => {
  fetchCounterQueue();
  playSFX('reservation');
  showNotif(
    `Reservation — ${data?.customerName || 'Guest'} · ${data?.partySize || '?'} pax · ${
      data?.reservationTime
        ? new Date(data.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        : ''
    }`,
    'info', 'reservation'
  );
});

socket.on('reservation_updated', () => fetchCounterQueue());

socket.on('waitlist_cancelled', (data) => {
  fetchCounterQueue();
  showNotif(
    `Waitlist cancelled — ${data?.customerName || 'Guest'}`,
    'error', 'waitlist'
  );
});

socket.on('waitlist_assigned', (data) => {
  fetchCounterQueue();
  fetchInitialData();
  showNotif(
    `Table assigned — ${data?.customerName || 'Guest'} → T${data?.tableNumber || '?'}`,
    'success', 'waitlist'
  );
});

socket.on('waitlist_updated', () => fetchCounterQueue());

socket.on('pickup_ready', (data) => {
  fetchCounterQueue();
  playSFX('pickup');
  showNotif(
    `Pickup ready — ${data?.customerName || 'Customer'} · ₹${data?.totalAmount?.toLocaleString() || '?'}`,
    'success', 'pickup'
  );
});

      socket.on("bill_requested", (data) => {
        setCheckoutRequests(prev => [...new Set([...prev, data.tableNumber.toString()])]);
        new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(()=>{});
        showNotif(`Settlement Request: Table ${data.tableNumber}`);
      });
socket.on("order_status_updated", (data) => {
  if (data && data.status === 'settled') {
    setCheckoutRequests(prev => prev.filter(t => t !== data.tableNumber?.toString()));
    fetchInitialData();
    fetchAnalytics();
  } else if (['pending', 'ready', 'served'].includes(data?.status)) {
    // Only refresh orders list — skip analytics
    fetchInitialData();
  }
});
// ── New aggregator order arrives — fires the center-screen popup, NOT the pending list ──
      socket.on('aggregator_order_incoming', (data) => {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
        setIncomingAggregatorOrders(prev => {
          const exists = prev.find(o => o._id === data._id);
          return exists ? prev : [...prev, data];
        });
        setActiveAggregatorPopup(prev => prev || data); // show immediately if nothing else is showing
      });

      // ── Operator (possibly on another device/tab) already decided — clear it everywhere ──
      socket.on('aggregator_order_decided', ({ orderId }) => {
        setIncomingAggregatorOrders(prev => prev.filter(o => o._id !== orderId));
        setActiveAggregatorPopup(prev => (prev?._id === orderId ? null : prev));
      });

socket.on('aggregator_session_expired', (data) => {
  setSessionAlerts(prev => {
    if (prev.find(a => a.platform === data.platform)) return prev;
    return [...prev, data];
  });
  new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
  showNotif(data.message, 'error');
});

socket.on('aggregator_session_restored', (data) => {
  setSessionAlerts(prev => prev.filter(a => a.platform !== data.platform));
  showNotif(`${data.platform.toUpperCase()} session restored`, 'success');
});
    }
    return () => { socket.off(); };
}, [isAuthenticated, tenantId, socket, fetchInitialData, fetchAnalytics, fetchManagementData, fetchCounterQueue]);
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
    const monthPrefix = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
    axios.get(`${BASE_URL}/staff/attendance/log/${tenantId}/${monthPrefix}`)
      .then(r => setAttendanceLogs(r.data || []))
      .catch(()=>{});
    fetchAttendanceForDate(attendanceDate);
    fetchMonthlySalary(monthPrefix); // ← ADD THIS
  }
}, [activeTab, viewDate, attendanceDate, fetchAttendanceForDate, fetchMonthlySalary, tenantId]);

const fetchCustomerDir = useCallback(async (seg = 'all', search = '') => {
  setCustomerLoading(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/customers/directory/${tenantId}?segment=${seg}&search=${search}&limit=300`
    );
    setCustomerDir(res.data || { customers: [], summary: {} });
  } catch { setCustomerDir({ customers: [], summary: {} }); }
  finally { setCustomerLoading(false); }
}, [tenantId]);
 
const fetchCustomerProfile = useCallback(async (phone) => {
  try {
    const res = await axios.get(`${BASE_URL}/customers/profile/${tenantId}/${phone}`);
    setCustomerProfile(res.data);
  } catch { setCustomerProfile(null); }
}, [tenantId]);
 
const fetchFeedback = useCallback(async () => {
  setFeedbackLoading(true);
  try {
    const monthStr = viewDate.getFullYear() + '-' + String(viewDate.getMonth() + 1).padStart(2, '0');
    const res = await axios.get(`${BASE_URL}/feedback/${tenantId}?month=${monthStr}&limit=100`);
    setFeedbackData(res.data || { feedback: [], summary: {} });
  } catch { setFeedbackData({ feedback: [], summary: {} }); }
  finally { setFeedbackLoading(false); }
}, [tenantId, viewDate]);
 
const fetchOffers = useCallback(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/offers/${tenantId}`);
    setOffers(res.data || []);
  } catch { setOffers([]); }
}, [tenantId]);
 
const fetchCampaigns = useCallback(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/campaigns/${tenantId}`);
    setCampaigns(res.data || []);
  } catch { setCampaigns([]); }
}, [tenantId]);


const handleAggregatorAccept = async (order, prepTime = 30) => {
  try {
    await axios.patch(`${BASE_URL}/admin/orders/${order._id}/aggregator-decision`, {
      decision: 'accept',
      prepTime
    });
    showNotif(`${order.platform?.toUpperCase() || 'Aggregator'} order accepted — sent to kitchen`, 'success');
    setIncomingAggregatorOrders(prev => prev.filter(o => o._id !== order._id));
    setActiveAggregatorPopup(null);
    fetchInitialData(); // refresh pending/KDS list immediately
  } catch (err) {
    showNotif(err.response?.data?.error || 'Failed to accept order', 'error');
  }
};

const handleAggregatorReject = async (order) => {
  try {
    await axios.patch(`${BASE_URL}/admin/orders/${order._id}/aggregator-decision`, {
      decision: 'reject'
    });
    showNotif(`${order.platform?.toUpperCase() || 'Aggregator'} order rejected`, 'info');
    setIncomingAggregatorOrders(prev => prev.filter(o => o._id !== order._id));
    setActiveAggregatorPopup(null);
  } catch (err) {
    showNotif(err.response?.data?.error || 'Failed to reject order', 'error');
  }
};

// When the active popup is dismissed, show the next queued one if any
useEffect(() => {
  if (!activeAggregatorPopup && incomingAggregatorOrders.length > 0) {
    setActiveAggregatorPopup(incomingAggregatorOrders[0]);
  }
}, [activeAggregatorPopup, incomingAggregatorOrders]);

  // ─────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────
const currentMonthAnalytics = useMemo(() => {
  if (!analytics || !Array.isArray(analytics)) return [];
  const monthStr = (viewDate.getMonth()+1).toString().padStart(2,'0');
  const yearStr = viewDate.getFullYear().toString();
  return analytics.filter(d => d._id && d._id.startsWith(`${yearStr}-${monthStr}`));
}, [analytics, viewDate]);

const purchaseRecommendations = useMemo(() => {
  if (!procurementData?.length) return [];
  return procurementData
    .filter(item => item.daysRemaining !== null && item.daysRemaining <= 4)
    .map(item => {
      const targetDays = 14;
      const recommended = Math.ceil((item.avgDailyUsage || 0) * targetDays);
      const wac = item.weightedAvgCost || item.costPrice || 0;
      return {
        ...item,
        recommendedQty: recommended,
        estimatedCost:  Math.round(recommended * wac),
        urgency: item.daysRemaining <= 1 ? 'critical' : item.daysRemaining <= 2 ? 'high' : 'medium'
      };
    })
    .sort((a, b) => (a.daysRemaining||99) - (b.daysRemaining||99));
}, [procurementData]);

  const stats = useMemo(() => {
    const revenue = currentMonthAnalytics.reduce((a,b) => a+(b.revenue||0), 0);
    const count   = currentMonthAnalytics.reduce((a,b) => a+(b.count||0), 0);
    // Real loyalty from trendsData
    const loyaltyRate = trendsData?.customers?.total > 0
      ? trendsData.customers.repeatPct
      : 0;
    return { revenue, avg: count > 0 ? (revenue/count).toFixed(0) : 0, loyaltyRate };
  }, [currentMonthAnalytics, trendsData]);


  const canonicalMonthRevenue = stats.revenue;


  // ── SINGLE CANONICAL REVENUE SOURCE for all insights sections ──
// Always reads from settled invoices in analytics (same as stats.revenue)
const insightsRevenue = useMemo(() => {
  const rev   = currentMonthAnalytics.reduce((a, b) => a + (b.revenue || 0), 0);
  const count = currentMonthAnalytics.reduce((a, b) => a + (b.count  || 0), 0);
  const gst   = rev > 0 ? rev / (1 + ((tenantConfig?.config?.cgstPercentage ?? 2.5) + (tenantConfig?.config?.sgstPercentage ?? 2.5)) / 100) : 0;
  const taxable = rev - gst;
  return {
    gross:    Math.round(rev),
    count,
    taxable:  Math.round(taxable),
    gst:      Math.round(rev - taxable),
    avg:      count > 0 ? Math.round(rev / count) : 0,
    period:   `${viewDate.toLocaleString('en-IN', { month: 'long' })} ${viewDate.getFullYear()}`
  };
}, [currentMonthAnalytics, tenantConfig, viewDate]);


const hudLiveCounterBreakdown = useMemo(() => {
  const fallback = { total: 0, direct: 0, takeaway: 0, online: 0 };
  if (!analytics?.length) return fallback;
 
  const istNow = new Date(new Date().getTime() + 330*60*1000);
  const isCurrentMonth =
    viewDate.getFullYear() === istNow.getFullYear() &&
    viewDate.getMonth()    === istNow.getMonth();
 
  // For current month: show today's live invoice count (original behaviour)
  // For past months: show total for the selected month
  const entriesToSum = isCurrentMonth
    ? analytics.filter(d => d._id === istTodayStr)
    : currentMonthAnalytics;
 
  if (!entriesToSum.length) return fallback;
let direct = 0, takeaway = 0, online = 0, pickup = 0, reservation = 0, waitlist = 0;
entriesToSum.forEach(entry => {
  const src = (entry.source || 'direct').toLowerCase();
  if      (src === 'takeaway')                      takeaway    += (entry.count || 1);
  else if (src === 'zomato' || src === 'swiggy')    online      += (entry.count || 1);
  else if (src === 'counter-pickup')                pickup      += (entry.count || 1);
  else if (src === 'reservation')                   reservation += (entry.count || 1);
  else if (src === 'waitlist')                      waitlist    += (entry.count || 1);
  else                                              direct      += (entry.count || 1);
});
return { total: direct + takeaway + online + pickup + reservation + waitlist, direct, takeaway, online, pickup, reservation, waitlist };
}, [analytics, istTodayStr, viewDate, currentMonthAnalytics]);



const filteredOrders = useMemo(() => {
  return orders.filter(order => {
    // 'served' and 'settled' never appear in the live orders panel
    if (order.status === 'served' || order.status === 'settled') return false;
    // 'ready' orders: show in a separate "READY" section — exclude from pending list
    if (order.status === 'ready') return false;
    if (order.source === 'counter-pickup') return false;
    const minutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
    if (orderZone === 'delayed') return minutes >= 15;
    if (orderZone === 'fresh')   return minutes < 15;
    return true;
  });
}, [orders, orderZone]);

// Separate list: orders marked READY by kitchen — awaiting waiter to serve
const readyOrders = useMemo(() => (
  orders.filter(o => o.status === 'ready')
), [orders]);

const dailySettlementBreakdown = useMemo(() => {
  let cashSum=0, upiSum=0, cardSum=0;
  if (analytics?.length) {
    const istNow = new Date(new Date().getTime() + 330*60*1000);
    const isCurrentMonth =
      viewDate.getFullYear() === istNow.getFullYear() &&
      viewDate.getMonth()    === istNow.getMonth();
 
    const entriesToSum = isCurrentMonth
      ? analytics.filter(d => d._id === istTodayStr)
      : currentMonthAnalytics;
 
    entriesToSum.forEach(r => {
      cashSum += Number(r.cash || 0);
      upiSum  += Number(r.upi  || 0);
      cardSum += Number(r.card || 0);
    });
  }
  return { cash: cashSum, upi: upiSum, card: cardSum, gross: cashSum+upiSum+cardSum };
}, [analytics, istTodayStr, viewDate, currentMonthAnalytics]);

// ── OPERATOR ASSISTANT: answer from real data ──
const handleAssistQuery = useCallback(async (question) => {
  const q = (question || assistInput).trim();
  if (!q) return;

  setAssistMessages(prev => [...prev, { role: 'user', text: q, ts: new Date() }]);
  setAssistInput('');
  setAssistLoading(true);

  try {
    const nowIST    = new Date(new Date().getTime() + 330 * 60000);
    const todayKey  = nowIST.toISOString().split('T')[0];
    const monthStr  = todayKey.slice(0, 7);

    // ── Pre-compute all context values ──
    const todayData    = analytics.filter(d => d._id === todayKey);
    const todayRev     = todayData.reduce((a, b) => a + (b.revenue || 0), 0);
    const todayCount   = todayData.reduce((a, b) => a + (b.count   || 0), 0);

    const monthData    = analytics.filter(d => d._id?.startsWith(monthStr));
    const monthRev     = monthData.reduce((a, b) => a + (b.revenue || 0), 0);
    const monthOrders  = monthData.reduce((a, b) => a + (b.count   || 0), 0);
    const avgOrder     = monthOrders > 0 ? Math.round(monthRev / monthOrders) : 0;

    // Week revenue (last 7 days)
    const weekRev = analytics
      .filter(d => {
        if (!d._id) return false;
        const diff = (new Date(todayKey) - new Date(d._id)) / 86400000;
        return diff >= 0 && diff < 7;
      })
      .reduce((a, b) => a + (b.revenue || 0), 0);

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const readyOrders   = orders.filter(o => o.status === 'ready');
    const servedOrders  = orders.filter(o => o.status === 'served');

    const lowStockItems    = (procurementData || []).filter(p => p.daysRemaining !== null && p.daysRemaining <= 3);
    const criticalStock    = (procurementData || []).filter(p => p.daysRemaining !== null && p.daysRemaining <= 1);
    const outOfStockItems  = (procurementData || []).filter(p => p.daysRemaining === 0);

    const sortedByQty     = [...(profitabilityData || [])].sort((a, b) => (b.totalQtySold || 0) - (a.totalQtySold || 0));
    const sortedByMargin  = [...(profitabilityData || [])].sort((a, b) => (b.marginPct    || 0) - (a.marginPct    || 0));
    const sortedByRev     = [...(profitabilityData || [])].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    const topDish         = sortedByQty[0];
    const bestMarginDish  = sortedByMargin[0];
    const topRevDish      = sortedByRev[0];
    const avgMarginAll    = profitabilityData?.length
      ? (profitabilityData.reduce((a, b) => a + (b.marginPct || 0), 0) / profitabilityData.length).toFixed(1)
      : null;

    const hiddenDishes    = menuItems.filter(m => m.isAvailable === false);
    const totalDishes     = menuItems.length;

    const pendingRequests = (waiterRequests || []).filter(w => w.status === 'pending');
    const occ             = occupiedTables?.length || 0;

    const extraLow        = (extraItems || []).filter(e => e.currentStock <= (e.lowStockThreshold || 5));
    const extraOos        = (extraItems || []).filter(e => e.currentStock <= 0);

    const payToday        = dailySettlementBreakdown;

    const qL = q.toLowerCase();
    let answer = '';

    // ── 25 intent handlers ──

    // 1. Today's revenue
    if ((qL.includes('revenue') || qL.includes('earning') || qL.includes('sale')) && qL.includes('today')) {
      answer = todayRev > 0
        ? `Today's revenue is ₹${todayRev.toLocaleString()} from ${todayCount} settled order${todayCount !== 1 ? 's' : ''}.\nPayment split — Cash: ₹${payToday.cash.toLocaleString()}, UPI: ₹${payToday.upi.toLocaleString()}, Card: ₹${payToday.card.toLocaleString()}.`
        : 'No settled orders recorded for today yet.';

    // 2. Monthly revenue
    } else if ((qL.includes('revenue') || qL.includes('earning')) && (qL.includes('month') || qL.includes('monthly'))) {
      answer = `This month (${monthStr}): ₹${monthRev.toLocaleString()} across ${monthOrders} orders.\nAverage order value: ₹${avgOrder.toLocaleString()}.`;

    // 3. Weekly revenue
    } else if ((qL.includes('revenue') || qL.includes('earning')) && (qL.includes('week') || qL.includes('weekly'))) {
      answer = `Revenue over the last 7 days: ₹${weekRev.toLocaleString()}.`;

    // 4. Pending / live orders
    } else if (qL.includes('pending') || (qL.includes('live') && qL.includes('order')) || qL.includes('kitchen now')) {
      const tableList = [...new Set(pendingOrders.map(o => `Table ${o.tableNumber}`))].slice(0, 5).join(', ');
      answer = `Right now: ${pendingOrders.length} pending, ${readyOrders.length} ready to serve, ${servedOrders.length} served.\n${tableList ? `Active tables: ${tableList}${pendingOrders.length > 5 ? ' and more.' : '.'}` : ''}`;

    // 5. Occupied tables
    } else if (qL.includes('table') || qL.includes('occupied') || qL.includes('how many table')) {
      answer = `${occ} table${occ !== 1 ? 's' : ''} currently occupied out of your floor map total.`;

    // 6. Low stock
    } else if (qL.includes('low stock') || qL.includes('running out') || qL.includes('stock alert')) {
      if (lowStockItems.length === 0) {
        answer = 'All inventory items have sufficient stock for the next 3+ days.';
      } else {
        const list = lowStockItems.slice(0, 5).map(i => `${i.itemName} — ${i.daysRemaining}d left`).join('\n');
        answer = `${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} running low:\n${list}`;
      }

    // 7. Out of stock / critical
    } else if (qL.includes('out of stock') || qL.includes('critical stock') || qL.includes('zero stock')) {
      if (outOfStockItems.length === 0) {
        answer = 'No ingredients are out of stock.';
      } else {
        answer = `${outOfStockItems.length} item${outOfStockItems.length > 1 ? 's' : ''} out of stock: ${outOfStockItems.map(i => i.itemName).join(', ')}.`;
      }

    // 8. Best selling dish
    } else if (qL.includes('best sell') || qL.includes('top dish') || qL.includes('most order') || qL.includes('popular')) {
      if (!topDish) {
        answer = 'No sales data yet. Map recipes to see profitability and sales rankings.';
      } else {
        answer = `Best-selling: "${topDish.name}" with ${topDish.totalQtySold} units sold.\nTop by revenue: "${topRevDish?.name}" generating ₹${(topRevDish?.totalRevenue || 0).toLocaleString()}.`;
      }

    // 9. Profit margin
    } else if (qL.includes('margin') || qL.includes('profit') || qL.includes('most profit')) {
      if (!bestMarginDish) {
        answer = 'Recipe data not mapped yet. Add ingredient recipes to see dish profitability.';
      } else {
        answer = `Highest-margin dish: "${bestMarginDish.name}" at ${bestMarginDish.marginPct}% margin.\nOverall average food margin: ${avgMarginAll}%.`;
      }

    // 10. Average order value
    } else if (qL.includes('average') || qL.includes('avg order') || qL.includes('order value')) {
      answer = monthOrders > 0
        ? `Average order value this month: ₹${avgOrder}.\nBased on ${monthOrders} orders totalling ₹${monthRev.toLocaleString()}.`
        : 'No order data this month yet.';

    // 11. Staff attendance
    } else if ((qL.includes('staff') || qL.includes('attendance')) && !qL.includes('salary')) {
      const presentToday = (staff || []).filter(s => {
        const log = (attendanceLogs || []).find(l => l.staffId === s._id && l.date === todayKey);
        return log?.status === 'present';
      });
      answer = `Staff today: ${presentToday.length} present out of ${staff?.length || 0} total.\n${
        presentToday.length > 0 ? `Present: ${presentToday.slice(0, 5).map(s => s.name).join(', ')}${presentToday.length > 5 ? ' and more.' : '.'}` : 'No staff marked present yet.'
      }`;

    // 12. Salary query
    } else if (qL.includes('salary') || qL.includes('payroll') || qL.includes('pay')) {
      const thisMonthSalary = (staff || []).reduce((a, s) => a + (s.salary || 0), 0);
      answer = `Total monthly payroll across ${staff?.length || 0} staff members: ₹${thisMonthSalary.toLocaleString()}.`;

    // 13. Service / waiter requests
    } else if (qL.includes('waiter') || qL.includes('service request') || qL.includes('request') || qL.includes('call')) {
      answer = pendingRequests.length > 0
        ? `${pendingRequests.length} pending service request${pendingRequests.length > 1 ? 's' : ''}: ${pendingRequests.slice(0, 3).map(w => `Table ${w.tableNumber} — ${w.serviceRequest?.slice(0, 30)}`).join('; ')}.`
        : 'No pending service requests right now.';

    // 14. Invoice / bills today
    } else if (qL.includes('invoice') || qL.includes('bill') || qL.includes('settled today')) {
      answer = todayCount > 0
        ? `${todayCount} bill${todayCount !== 1 ? 's' : ''} settled today totalling ₹${todayRev.toLocaleString()}.\nCash: ₹${payToday.cash.toLocaleString()} · UPI: ₹${payToday.upi.toLocaleString()} · Card: ₹${payToday.card.toLocaleString()}.`
        : 'No bills settled today yet.';

    // 15. Payment split
    } else if (qL.includes('payment') || qL.includes('cash') || qL.includes('upi') || qL.includes('card')) {
      answer = `Today's payment split:\nCash: ₹${payToday.cash.toLocaleString()}\nUPI: ₹${payToday.upi.toLocaleString()}\nCard: ₹${payToday.card.toLocaleString()}\nTotal: ₹${payToday.gross.toLocaleString()}.`;

    // 16. Hidden menu items
    } else if ((qL.includes('hidden') || qL.includes('unavailable') || qL.includes('disabled')) && qL.includes('dish') || qL.includes('hidden menu')) {
      answer = hiddenDishes.length > 0
        ? `${hiddenDishes.length} of ${totalDishes} dishes currently hidden: ${hiddenDishes.slice(0, 5).map(d => d.name).join(', ')}${hiddenDishes.length > 5 ? ' and more.' : '.'}`
        : `All ${totalDishes} menu items are currently visible and active.`;

    // 17. Wastage
    } else if (qL.includes('wastage') || qL.includes('waste') || qL.includes('spoil')) {
      try {
        const wData = await axios.get(`${BASE_URL}/admin/wastage/${tenantId}?period=today`).catch(() => ({ data: [] }));
        const wArr   = Array.isArray(wData.data) ? wData.data : [];
        const wCost  = wArr.reduce((a, w) => a + (w.cost || 0), 0);
        answer = wArr.length > 0
          ? `${wArr.length} wastage entries today with a total cost of ₹${wCost.toLocaleString()}.`
          : 'No wastage recorded today.';
      } catch {
        answer = 'Unable to fetch wastage data right now.';
      }

    // 18. Extra items / beverages stock
    } else if (qL.includes('extra item') || qL.includes('beverage') || qL.includes('cold drink') || qL.includes('bottle')) {
      answer = `Extra items: ${extraItems?.length || 0} total.\n${
        extraOos.length > 0 ? `Out of stock: ${extraOos.map(e => e.name).join(', ')}.\n` : ''
      }${
        extraLow.length > 0 ? `Low stock: ${extraLow.filter(e => e.currentStock > 0).map(e => `${e.name} (${e.currentStock} left)`).join(', ')}.` : 'All extra items sufficiently stocked.'
      }`;

    // 19. Slow / dead dishes
    } else if (qL.includes('slow') || qL.includes('dead dish') || qL.includes('not selling') || qL.includes('remove dish')) {
      const slowDishes = sortedByQty.slice(-4).filter(d => (d.totalQtySold || 0) < 5);
      answer = slowDishes.length > 0
        ? `Slow-moving dishes (low sales): ${slowDishes.map(d => `${d.name} — ${d.totalQtySold || 0} sold`).join(', ')}.`
        : 'All dishes have reasonable sales volume.';

    // 20. Procurement / what to buy
    } else if (qL.includes('procure') || qL.includes('purchase') || qL.includes('buy') || qL.includes('restock')) {
      if (lowStockItems.length === 0) {
        answer = 'No procurement needed in the next 3 days based on current stock and usage.';
      } else {
        const list = lowStockItems.slice(0, 5).map(i => `${i.itemName} — buy ~${Math.ceil((i.avgDailyUsage || 1) * 14)} ${i.unit}`).join('\n');
        answer = `Recommended purchases (14-day supply):\n${list}`;
      }

    // 21. Peak hour / busy time
    } else if (qL.includes('peak') || qL.includes('busy') || qL.includes('rush') || qL.includes('when is')) {
      const hourMap = {};
      orders.forEach(o => {
        if (!o.createdAt) return;
        const h = new Date(new Date(o.createdAt).getTime() + 330 * 60000).getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      });
      const peak = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
      answer = peak
        ? `Today's busiest hour so far: ${Number(peak[0]) % 12 || 12}:00 ${Number(peak[0]) < 12 ? 'AM' : 'PM'} with ${peak[1]} order${peak[1] > 1 ? 's' : ''}.`
        : 'Insufficient order data to calculate peak hour today.';

    // 22. Inventory total value
    } else if (qL.includes('inventory value') || qL.includes('stock value') || qL.includes('total stock worth')) {
      const invTotal = (procurementData || []).reduce((a, p) => a + ((p.currentStock || 0) * (p.weightedAvgCost || p.costPrice || 0)), 0);
      answer = `Estimated current inventory value: ₹${Math.round(invTotal).toLocaleString()} based on weighted average cost.`;

    // 23. Menu count / items
    } else if (qL.includes('how many dish') || qL.includes('menu item') || qL.includes('total dish') || qL.includes('menu count')) {
      const vegCount    = menuItems.filter(m => m.isVeg !== false && m.isAvailable !== false).length;
      const nonVegCount = menuItems.filter(m => m.isVeg === false && m.isAvailable !== false).length;
      answer = `Menu has ${totalDishes} items total.\nActive: ${menuItems.filter(m => m.isAvailable !== false).length} · Hidden: ${hiddenDishes.length}.\nVeg: ${vegCount} · Non-veg: ${nonVegCount}.`;

    // 24. Extra items revenue
    } else if (qL.includes('extra revenue') || qL.includes('beverage revenue') || qL.includes('extra item revenue')) {
      const extraRev = extraAnalytics?.totalRevenue || 0;
      answer = extraRev > 0
        ? `Extra items (beverages/snacks) have generated ₹${extraRev.toLocaleString()} in revenue with ${extraAnalytics?.totalSold || 0} units sold this period.`
        : 'No extra item revenue data available for this period.';

    // 25. How is the restaurant doing / summary
    } else if (qL.includes('summary') || qL.includes('how is') || qL.includes('overview') || qL.includes('status')) {
      answer = [
        `Restaurant at a glance:`,
        `Revenue today: ₹${todayRev.toLocaleString()} · Month: ₹${monthRev.toLocaleString()}`,
        `Orders: ${pendingOrders.length} pending · ${occ} tables occupied`,
        `Stock alerts: ${lowStockItems.length} items low`,
        `Service requests: ${pendingRequests.length} pending`,
        `Menu: ${totalDishes - hiddenDishes.length} active dishes`,
      ].join('\n');

    } else {
      answer = [
        'I can help with:',
        'Revenue — today / weekly / monthly / payment split',
        'Orders — pending, ready, served, live tables',
        'Inventory — low stock, out of stock, total value, procurement',
        'Menu — best sellers, margins, slow items, hidden dishes',
        'Staff — attendance, payroll',
        'Extras — beverages stock, revenue',
        'Wastage — today\'s entries and cost',
        'Try: "today\'s revenue", "low stock items", "best selling dish", "staff attendance today"'
      ].join('\n');
    }

    setAssistMessages(prev => [...prev, { role: 'assistant', text: answer, ts: new Date() }]);
  } catch {
    setAssistMessages(prev => [...prev, { role: 'assistant', text: 'Unable to fetch data right now. Please try again in a moment.', ts: new Date() }]);
  } finally {
    setAssistLoading(false);
    setTimeout(() => assistEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
  }
}, [assistInput, analytics, orders, procurementData, profitabilityData, staff, attendanceLogs,
    occupiedTables, waiterRequests, menuItems, extraItems, extraAnalytics, extraAnalytics,
    dailySettlementBreakdown, tenantId, viewDate]);


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


// Replace existing totalPayrollValue useMemo
const totalPayrollValue = useMemo(() => {
  const monthStr = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
  
  return filteredStaff.reduce((acc, m) => {
    const monthRec = monthlySalaryRecords.find(r =>
      r.staffId?.toString() === m._id?.toString() && r.monthStr === monthStr
    );
    const status  = monthRec?.status  || 'Unpaid';
    const salary  = monthRec?.baseSalary || m.baseSalary;
    return status === 'Paid' ? acc : acc + (Number(salary) || 0);
  }, 0);
}, [filteredStaff, monthlySalaryRecords, viewDate]);

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
const margins = menuItems.map(m => {
  // Try to get real margin from profitabilityData first
  const profRow = profitabilityData.find(p => p.name === m.name || p.menuItemId === m._id);
  if (profRow?.marginPct != null) return { name: m.name, margin: profRow.marginPct.toFixed(0) };
  // Fall back to costPrice only if explicitly set — never fabricate 50%
  if (m.costPrice && m.price) {
    return { name: m.name, margin: (((m.price - m.costPrice) / m.price) * 100).toFixed(0) };
  }
  return { name: m.name, margin: 0 };
}).sort((a, b) => b.margin - a.margin).slice(0, 3);
    const peakHour = hourlyAnalytics.hourly.length
      ? hourlyAnalytics.hourly.reduce((a,b)=>b.orderCount>a.orderCount?b:a, hourlyAnalytics.hourly[0])?.hour || 0
      : 0;
    const digest = `Monthly revenue: ₹${stats.revenue.toLocaleString()}. Peak activity around ${peakHour}:00. ${margins[0]?.name||'Top dish'} leads margins at ${margins[0]?.margin}%.`;
    return { margins, digest };
  }, [menuItems, stats.revenue, hourlyAnalytics]);

  const hotDishes = useMemo(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const recentOrders = orders.filter(o =>
    new Date(o.createdAt).getTime() > twoHoursAgo &&
    ['pending','ready','served','settled'].includes(o.status)
  );
  const countMap = {};
  recentOrders.forEach(o => {
    (o.items || []).forEach(it => {
      countMap[it.name] = (countMap[it.name] || 0) + (Number(it.quantity) || 1);
    });
  });
  // Return set of dish names ordered 3+ times in last 2h
  return new Set(Object.entries(countMap).filter(([,v]) => v >= 3).map(([k]) => k));
}, [orders]);

  // ─────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────
const showNotif = useCallback((msg, type = 'success', subtype = '') => {
  setNotif({ show: true, msg, type, subtype });
  setTimeout(() => setNotif(p => ({ ...p, show: false })), 5000);
}, []);

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
  setPaymentModes({ cash: 0, upi: 0, card: 0 });
  try {
    const [res, countRes, tenantRes] = await Promise.all([
      axios.get(`${BASE_URL}/admin/bill/${tenantId}/${id}`),
      axios.get(`${BASE_URL}/admin/daily-bill-count/${tenantId}`).catch(() => ({ data: { nextBillNo: 1 } })),
      axios.get(`${BASE_URL}/tenant/${tenantId}`).catch(() => ({ data: null }))
    ]);

    // Always refresh tenantConfig so cgst/sgst/address are fresh
    if (tenantRes.data) setTenantConfig(tenantRes.data);
    const freshTenant = tenantRes.data || tenantConfig;

    const rawItems = res.data.flatMap(o => o.items);
    if (!rawItems.length) { setTableBill(null); return; }

    const aggregated = rawItems.reduce((acc, item) => {
      const portionKey = item.portion || 'Single';
      const ex = acc.find(i => i.name === item.name && (i.portion || 'Single') === portionKey);
      if (ex) {
        ex.quantity += Number(item.quantity || 1);
        ex.subtotal += Number(item.subtotal || 0);
      } else {
acc.push({
  ...item,
  quantity: Number(item.quantity || 1),
  subtotal: Number(item.subtotal || 0),
});
      }
      return acc;
    }, []);

    aggregated.forEach(item => {
  item.pricePerUnit = item.quantity > 0
    ? Math.round((item.subtotal / item.quantity) * 100) / 100
    : 0;
});

    // Use tenant-stored cgst/sgst percentages
    const cgstPct  = (freshTenant?.config?.cgstPercentage ?? 2.5) / 100;
    const sgstPct  = (freshTenant?.config?.sgstPercentage ?? 2.5) / 100;
    const totalTaxPct = cgstPct + sgstPct;

    const subtotal   = aggregated.reduce((a, i) => a + i.subtotal, 0);
    const cgst       = Math.round(subtotal * cgstPct * 100) / 100;
    const sgst       = Math.round(subtotal * sgstPct * 100) / 100;
    const grandTotal = subtotal + cgst + sgst;

    setTableBill({
      items:         aggregated,
      subtotal,
      cgst,
      sgst,
      cgstPct:       (cgstPct * 100).toFixed(1),
      sgstPct:       (sgstPct * 100).toFixed(1),
      total:         grandTotal,
      billNo:        countRes.data.nextBillNo,
      totalBillCount: (freshTenant?.totalBillCount || 0) + 1,
      fssaiNumber:   freshTenant?.fssaiNumber || '',
      address:       freshTenant?.address
                       ? `${freshTenant.address.street}, ${freshTenant.address.city}, ${freshTenant.address.state} - ${freshTenant.address.pincode}`
                       : '',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    });
  } catch (err) {
    console.error('Bill Error:', err);
    setSelectedTable(null);
  }
};

const generateOnlineBill = async () => {
  setSelectedTable('Online');
  setDiscount(0);
  setPaymentModes({ cash: 0, upi: 0, card: 0 });
  try {
    const [res, countRes, tenantRes] = await Promise.all([
      axios.get(`${BASE_URL}/admin/bills/${tenantId}/today`),
      axios.get(`${BASE_URL}/admin/daily-bill-count/${tenantId}`).catch(() => ({ data: { nextBillNo: 1 } })),
      axios.get(`${BASE_URL}/tenant/${tenantId}`).catch(() => ({ data: null }))
    ]);

    if (tenantRes.data) setTenantConfig(tenantRes.data);
    const freshTenant = tenantRes.data || tenantConfig;

    // Only today's Swiggy/Zomato settled invoices
    const onlineBills = (res.data?.bills || []).filter(b => b.isAggregator);
    if (onlineBills.length === 0) { setTableBill(null); return; }

    // Aggregate line items across all online orders for the on-screen summary view
    const aggregated = [];
    onlineBills.forEach(b => {
      (b.items || []).forEach(item => {
        const portionKey = item.portion || 'Single';
        const ex = aggregated.find(i => i.name === item.name && (i.portion || 'Single') === portionKey);
        if (ex) {
          ex.quantity += Number(item.quantity || 1);
          ex.subtotal += Number(item.subtotal || 0);
        } else {
          aggregated.push({ ...item, quantity: Number(item.quantity || 1), subtotal: Number(item.subtotal || 0) });
        }
      });
    });

    const cgstPct = (freshTenant?.config?.cgstPercentage ?? 2.5) / 100;
    const sgstPct = (freshTenant?.config?.sgstPercentage ?? 2.5) / 100;
    const subtotal = aggregated.reduce((a, i) => a + i.subtotal, 0);
    const cgst = Math.round(subtotal * cgstPct * 100) / 100;
    const sgst = Math.round(subtotal * sgstPct * 100) / 100;
    const grandTotal = onlineBills.reduce((a, b) => a + (Number(b.grandTotal) || 0), 0);

    setTableBill({
      items: aggregated,
      subtotal,
      cgst,
      sgst,
      cgstPct: (cgstPct * 100).toFixed(1),
      sgstPct: (sgstPct * 100).toFixed(1),
      total: grandTotal,
      billNo: countRes.data.nextBillNo,
      totalBillCount: (freshTenant?.totalBillCount || 0) + 1,
      fssaiNumber: freshTenant?.fssaiNumber || '',
      address: freshTenant?.address
        ? `${freshTenant.address.street}, ${freshTenant.address.city}, ${freshTenant.address.state} - ${freshTenant.address.pincode}`
        : '',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      isOnlineSummary: true,
      orderCount: onlineBills.length
    });
  } catch (err) {
    console.error('Online Bill Error:', err);
    setSelectedTable(null);
  }
};

const settleBill = () => {
    if (isSettling) return; // Guard here too
const discountFactor = 1 - (discount / 100);
const discountedSub  = Math.round(tableBill.subtotal * discountFactor * 100) / 100;
const cgstPct        = parseFloat(tableBill.cgstPct) / 100;
const sgstPct        = parseFloat(tableBill.sgstPct) / 100;
const finalAmt       = Math.round(discountedSub + discountedSub * cgstPct + discountedSub * sgstPct);

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

const fetchRecipes = useCallback(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/recipes/${tenantId}`);
    setRecipes(res.data || []);
  } catch { setRecipes([]); }
}, [tenantId]);

useEffect(() => {
    if (activeTab === 'billing' || activeTab === 'reservations') fetchCounterQueue();
    if (activeTab === 'inventory' || activeTab === 'recipes') fetchManagementData();
    if (activeTab === 'customers') fetchCustomerDir(customerSegFilter, customerSearch);
    if (activeTab === 'feedback') fetchFeedback();
    if (activeTab === 'marketing') { fetchOffers(); fetchCampaigns(); fetchAnnouncements(); }
    if (activeTab === 'extras') fetchExtraItems();
    if (activeTab === 'insights') fetchAnalytics();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'recipes') fetchRecipes();
}, [
    activeTab,
    fetchManagementData,
    fetchExtraItems,
    fetchCounterQueue,
    fetchAnalytics,
    // ← FIXED: added missing deps
    fetchCustomerDir,
    fetchFeedback,
    fetchOffers,
    fetchCampaigns,
    fetchAnnouncements,
    fetchRecipes,
    customerSegFilter,
    customerSearch,
]);
 
 // ── EXTRA ITEMS: realtime stock sync, low-stock sound alert, auto-hide on zero ──
useEffect(() => {
  if (!socket) return;

  const lowStockAudio = new Audio('/sounds/low-stock-alert.mp3'); // place file in /public/sounds/
  const outOfStockAudio = new Audio('/sounds/out-of-stock-alert.mp3');

  const handleItemUpdated = (updatedItem) => {
    setExtraItems(prev =>
      prev.map(i => (i._id === updatedItem._id ? updatedItem : i))
    );
  };

  const handleLowStock = (data) => {
    lowStockAudio.play().catch(() => {}); // browsers may block autoplay until first user interaction
    showNotif(`⚠ LOW STOCK: ${data.name} — only ${data.currentStock} ${data.unit}s left`, 'warning');
  };

  const handleOutOfStock = (data) => {
    outOfStockAudio.play().catch(() => {});
    showNotif(`🚫 ${data.name} is OUT OF STOCK — auto-hidden from menu`, 'error');
  };

  const handleBackInStock = (data) => {
    showNotif(`✅ ${data.name} restocked — back on menu`, 'success');
  };

  socket.on('extra_item_updated', handleItemUpdated);
  socket.on('extra_item_low_stock', handleLowStock);
  socket.on('extra_item_out_of_stock', handleOutOfStock);
  socket.on('extra_item_back_in_stock', handleBackInStock);

  return () => {
    socket.off('extra_item_updated', handleItemUpdated);
    socket.off('extra_item_low_stock', handleLowStock);
    socket.off('extra_item_out_of_stock', handleOutOfStock);
    socket.off('extra_item_back_in_stock', handleBackInStock);
  };
}, [socket, showNotif]);

useEffect(() => {
  if (activeTab === 'pending') fetchCounterQueue();
}, [activeTab, fetchCounterQueue]);

const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px',
    margin: '36px 0 16px', paddingBottom: '12px',
    borderBottom: '1px solid rgba(211,191,162,0.12)'
  }}>
    <div style={{
      width: '34px', height: '34px', borderRadius: '10px',
      background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#d3bfa2'
    }}>{icon}</div>
    <div>
      <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2.5px', textTransform: 'uppercase' }}>{title}</h3>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.62rem', color: '#444', fontWeight: '600' }}>{subtitle}</p>}
    </div>
  </div>
);


const RecommendationCard = ({ rec, urgent = false, positive = false }) => (
  <div style={{
    background: urgent ? 'rgba(211,191,162,0.04)' : '#0d0d0d',
    border: `1px solid ${urgent ? 'rgba(211,191,162,0.2)' : 'rgba(211,191,162,0.07)'}`,
    borderLeft: `3px solid ${rec.color}`,
    borderRadius: '14px', padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: '12px'
  }}>
    {/* Top row: icon + category + title */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
        background: `${rec.color}15`, border: `1px solid ${rec.color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: rec.color
      }}>
        {rec.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.5rem', fontWeight: '900', letterSpacing: '1.5px',
          color: rec.color, textTransform: 'uppercase', marginBottom: '4px'
        }}>
          {rec.category}
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', lineHeight: 1.35 }}>
          {rec.title}
        </div>
      </div>
    </div>

    {/* Stat highlight — the one number that matters */}
    {rec.stat && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        background: '#000', borderRadius: '10px', padding: '12px 14px',
        border: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{
          fontSize: '1.6rem', fontWeight: '900', color: rec.color,
          fontFamily: 'monospace', lineHeight: 1, flexShrink: 0
        }}>
          {rec.stat.value}
        </div>
        <div style={{ fontSize: '0.6rem', color: '#666', fontWeight: '700', lineHeight: 1.4 }}>
          {rec.stat.label}
        </div>
        {rec.stat.bar !== undefined && (
          <div style={{ marginLeft: 'auto', width: '70px', flexShrink: 0 }}>
            <div style={{ height: '5px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, rec.stat.bar)}%`,
                background: rec.color, borderRadius: '3px'
              }} />
            </div>
          </div>
        )}
      </div>
    )}

    {/* Action — one line, imperative */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ArrowUp size={11} color={rec.color} style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />
      <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: '600', lineHeight: 1.4 }}>
        {rec.tag}
      </span>
    </div>
  </div>
);
// ── ADD with your other fetch functions ──


// ── ADD in your useEffect that responds to tab changes ──
useEffect(() => {
  if (activeTab === 'recipes') {
    fetchRecipes();
  }
}, [activeTab, fetchRecipes]);

const handleFinalSettle = async () => {
    // 🔒 PREVENT DOUBLE-FIRE: Guard against multiple clicks
    if (isSettling) return;
    setIsSettling(true);
    
const discountFactor  = 1 - (discount / 100);
const discountedSub   = Math.round(tableBill.subtotal * discountFactor * 100) / 100;
const cgstPct         = parseFloat(tableBill.cgstPct) / 100;  // e.g. 2.5% → 0.025
const sgstPct         = parseFloat(tableBill.sgstPct) / 100;
const discountedCgst  = Math.round(discountedSub * cgstPct * 100) / 100;
const discountedSgst  = Math.round(discountedSub * sgstPct * 100) / 100;
const finalAmt        = Math.round(discountedSub + discountedCgst + discountedSgst);

const paymentMethodDetails = activePaymentType === 'split'
        ? { type: 'split', breakdown: { cash: Number(paymentModes.cash || 0), upi: Number(paymentModes.upi || 0), card: Number(paymentModes.card || 0) } }
        : { type: 'full', method: selectedSingleMode };
    
    // Close modal immediately to prevent re-trigger
    setConfirmModal({ show: false, title: '', subtitle: '', onConfirm: null });
    
    try {
const res = await axios.patch(`${BASE_URL}/admin/settle/${tenantId}/${selectedTable}`, {
    discount,
    finalAmount:    finalAmt,
    paymentMethods: paymentMethodDetails,
    customerPhone:  "",
    subtotal:       discountedSub,      // ← discounted subtotal
    cgst:           discountedCgst,     // ← CGST on discounted amount
    sgst:           discountedSgst,     // ← SGST on discounted amount
});
        
        // ── Deduct extra items from stock on settlement ──


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
const [acknowledgedTables, setAcknowledgedTables] = useState({});
  const getTableMood = useCallback((tableId) => {
  const tableOrders = orders.filter(o =>
    o.tableNumber === tableId.toString() &&
    ['pending','ready'].includes(o.status)
  );
  if (!tableOrders.length) return null;
  const oldest = Math.min(...tableOrders.map(o => new Date(o.createdAt).getTime()));
  const mins = (Date.now() - oldest) / 60000;
  if (mins < 10) return { level: 'fresh',   color: 'rgba(211,191,162,0.12)', pulse: false };
  if (mins < 20) return { level: 'warm',    color: 'rgba(186,117,23,0.25)',  pulse: false };
  if (mins < 30) return { level: 'hot',     color: 'rgba(186,117,23,0.45)',  pulse: true  };
  return           { level: 'critical', color: 'rgba(138,48,48,0.35)',  pulse: true  };
}, [orders]);


const [ordersData, setOrdersData] = useState([]);

useEffect(() => {
  if (!tenantId) return;
  axios.get(`${BASE_URL}/orders/${tenantId}?limit=1000`)
    .then(r => {
      console.log('[ordersData] fetched:', r.data?.length, 'orders');
      setOrdersData(r.data || []);
    })
    .catch(err => {
      console.error('[ordersData] fetch failed:', err.response?.status, err.message);
      setOrdersData([]);
    });
}, [tenantId]);
const fetchIncomingAggregatorOrders = useCallback(async () => {
  try {
    const res = await axios.get(`${BASE_URL}/admin/orders/${tenantId}/aggregator-incoming`);
    const list = (res.data || []).map(order => ({
      _id: order._id,
      platform: order.source,
      orderId: order.aggregatorOrderId,
      customerName: order.aggregatorCustomer?.name || 'Online Customer',
      customerPhone: order.aggregatorCustomer?.phone || '',
      items: order.items || [],
      grandTotal: order.billDetails?.grandTotal || 0,
      createdAt: order.createdAt
    }));
    setIncomingAggregatorOrders(list);
    if (list.length > 0 && !activeAggregatorPopup) {
      setActiveAggregatorPopup(list[0]);
    }
  } catch { /* silent */ }
}, [tenantId, activeAggregatorPopup]);


useEffect(() => {
  if (isAuthenticated) {
    fetchIncomingAggregatorOrders();
  }
}, [isAuthenticated, fetchIncomingAggregatorOrders]);




const SEG_META = {
  all:       { label:'All',      color:'#d3bfa2', bg:'rgba(211,191,162,0.1)'  },
  new:       { label:'New',      color:'#8a9a7e', bg:'rgba(138,154,126,0.12)' },
  regular:   { label:'Regular',  color:'#8a704d', bg:'rgba(138,112,77,0.12)'  },
  loyal:     { label:'Loyal',    color:'#C9A84C', bg:'rgba(201,168,76,0.12)'  },
  'at-risk': { label:'At-Risk',  color:'#BA7517', bg:'rgba(186,117,23,0.12)'  },
  champion:  { label:'Champion', color:'#d3bfa2', bg:'rgba(211,191,162,0.15)' },
};

const SEG_ICONS_COMPONENT = {
  new:       <UserCheck  size={12}/>,
  regular:   <User       size={12}/>,
  loyal:     <Star       size={12}/>,
  'at-risk': <AlertCircle size={12}/>,
  champion:  <Crown      size={12}/>,
};

const _cgstPct = (tenantConfig?.config?.cgstPercentage ?? 2.5) / 100;   // e.g. 0.025
const _sgstPct = (tenantConfig?.config?.sgstPercentage ?? 2.5) / 100;
const _totalGstPct = _cgstPct + _sgstPct;                                 // e.g. 0.05

const exportToExcel = useCallback((type = 'daily') => {
  import('xlsx').then(XLSX => {
    const wb = XLSX.utils.book_new();

    // ── STYLE HELPERS ── (unchanged)
    const GOLD  = 'C8A951';
    const DARK  = '1A1A1A';
    const MID   = '2A2A2A';
    const WHITE = 'FFFFFF';
    const GREEN = '1D9E75';
    const RED   = 'C0392B';
    const AMBER = 'BA7517';
    const BLUE  = '2980B9';
    const PINK  = 'F87171';

    const hdrStyle = (bgHex = DARK, fgHex = GOLD, bold = true, sz = 10) => ({
      font: { name: 'Arial', bold, sz, color: { rgb: fgHex } },
      fill: { patternType: 'solid', fgColor: { rgb: bgHex } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: { bottom: { style: 'medium', color: { rgb: GOLD } } }
    });

    const cellStyle = (bold = false, fgHex = WHITE, bgHex = '111111', align = 'left') => ({
      font: { name: 'Arial', bold, sz: 9, color: { rgb: fgHex } },
      fill: { patternType: 'solid', fgColor: { rgb: bgHex } },
      alignment: { horizontal: align, vertical: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: '222222' } } }
    });

    const numFmt = (bold = false, color = WHITE) => ({
      font: { name: 'Arial', bold, sz: 9, color: { rgb: color } },
      fill: { patternType: 'solid', fgColor: { rgb: '111111' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: '222222' } } },
      numFmt: '#,##0'
    });

    const titleStyle = () => ({
      font: { name: 'Arial', bold: true, sz: 14, color: { rgb: GOLD } },
      fill: { patternType: 'solid', fgColor: { rgb: '050505' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    });

    const subStyle = () => ({
      font: { name: 'Arial', bold: false, sz: 9, color: { rgb: '666666' } },
      fill: { patternType: 'solid', fgColor: { rgb: '050505' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    });

    const kpiStyle = (color = GOLD) => ({
      font: { name: 'Arial', bold: true, sz: 16, color: { rgb: color } },
      fill: { patternType: 'solid', fgColor: { rgb: '0D0D0D' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: { style: 'medium', color: { rgb: color } }, bottom: { style: 'thin', color: { rgb: '1A1A1A' } }, left: { style: 'thin', color: { rgb: '1A1A1A' } }, right: { style: 'thin', color: { rgb: '1A1A1A' } } }
    });

    const kpiLabelStyle = () => ({
      font: { name: 'Arial', bold: true, sz: 7, color: { rgb: '666666' } },
      fill: { patternType: 'solid', fgColor: { rgb: '0D0D0D' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: { style: 'thin', color: { rgb: '1A1A1A' } }, bottom: { style: 'medium', color: { rgb: GOLD } }, left: { style: 'thin', color: { rgb: '1A1A1A' } }, right: { style: 'thin', color: { rgb: '1A1A1A' } } }
    });

    const statusStyle = (isPaid) => ({
      font: { name: 'Arial', bold: true, sz: 8, color: { rgb: isPaid ? GREEN : AMBER } },
      fill: { patternType: 'solid', fgColor: { rgb: isPaid ? '0A1F17' : '1A1208' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: '222222' } } }
    });

    const styleCell = (ws, addr, style) => {
      if (!ws[addr]) ws[addr] = { v: ws[addr]?.v ?? '', t: 's' };
      ws[addr].s = style;
    };

    const addTitleBlock = (ws, title, subtitle, reportDate) => {
      const r0 = [title, '', '', '', '', '', '', ''];
      const r1 = [subtitle, '', '', '', '', '', '', ''];
      const r2 = [`Report Period: ${reportDate} · Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, '', '', '', '', '', '', ''];
      const r3 = new Array(8).fill('');
      XLSX.utils.sheet_add_aoa(ws, [r0, r1, r2, r3], { origin: 'A1' });
      styleCell(ws, 'A1', titleStyle());
      styleCell(ws, 'A2', subStyle());
      styleCell(ws, 'A3', subStyle());
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }
      );
    };

    const istNow = new Date(new Date().getTime() + 330 * 60 * 1000);
    const todayStr = istNow.toISOString().split('T')[0];
    const exportMonthStr = viewDate.getFullYear() + '-' + String(viewDate.getMonth() + 1).padStart(2, '0');

    // ── INVENTORY ONLY EXPORT ── (unchanged)
    if (type === 'inventory') {
      const ws = {};
      const totalValue = inventory.reduce((a, i) => a + Math.max(0, Math.round(i.currentStock * i.costPrice)), 0);
      const lowItems = inventory.filter(i => i.currentStock <= i.minThreshold).length;

      addTitleBlock(ws, `${tenantConfig?.name || tenantId} — INVENTORY REGISTER`, 'Full ingredient ledger with WAC, stock value, and status', todayStr);

      const kpiData = [
        ['TOTAL ITEMS', 'TOTAL VALUE', 'LOW STOCK', 'HEALTHY'],
        [inventory.length, `₹${totalValue.toLocaleString()}`, lowItems, inventory.length - lowItems]
      ];
      XLSX.utils.sheet_add_aoa(ws, kpiData, { origin: 'A5' });
      ['A5', 'C5', 'E5', 'G5'].forEach(addr => styleCell(ws, addr, kpiLabelStyle()));
      ws['A6'] = { v: inventory.length, t: 'n', s: kpiStyle(GOLD) };
      ws['C6'] = { v: `₹${totalValue.toLocaleString()}`, t: 's', s: kpiStyle(GREEN) };
      ws['E6'] = { v: lowItems, t: 'n', s: kpiStyle(lowItems > 0 ? RED : GREEN) };
      ws['G6'] = { v: inventory.length - lowItems, t: 'n', s: kpiStyle(GREEN) };
      [['A5','B5'],['C5','D5'],['E5','F5'],['G5','H5'],['A6','B6'],['C6','D6'],['E6','F6'],['G6','H6']].forEach(([s,e]) => {
        if (!ws['!merges']) ws['!merges'] = [];
        const sr = parseInt(s[1])-1, sc = s.charCodeAt(0)-65, er = parseInt(e[1])-1, ec = e.charCodeAt(0)-65;
        ws['!merges'].push({ s:{r:sr,c:sc}, e:{r:er,c:ec} });
      });

      const headers = ['Ingredient','Unit','Current Stock','Min Threshold','WAC (₹/unit)','Last Buy (₹)','Stock Value (₹)','Status','Drift'];
      XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A8' });
      headers.forEach((_, ci) => { const addr = XLSX.utils.encode_cell({r:7,c:ci}); styleCell(ws, addr, hdrStyle()); });

      inventory.forEach((item, ri) => {
        const row = ri + 9;
        const isLow = item.currentStock <= item.minThreshold;
        const wac = item.weightedAvgCost || item.costPrice || 0;
        const last = item.lastPurchasePrice || wac;
        const drift = wac > 0 ? ((last-wac)/wac*100).toFixed(1) : '—';
        const driftNum = wac > 0 ? (last-wac)/wac*100 : 0;
        const stockVal = Math.max(0, Math.round(item.currentStock * wac));
        const altBg = ri%2===0 ? '0D0D0D' : '111111';
        const rowData = [item.itemName, item.unit, item.currentStock, item.minThreshold, wac.toFixed(2), last.toFixed(2), stockVal, isLow ? '⚠ LOW STOCK' : '✓ OK', drift!=='—'?`${driftNum>0?'+':''}${drift}%`:'—'];
        rowData.forEach((val, ci) => {
          const addr = XLSX.utils.encode_cell({r:row-1,c:ci});
          if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(true,WHITE,altBg)};
          else if (ci===1) ws[addr]={v:val,t:'s',s:cellStyle(false,'888888',altBg,'center')};
          else if ([2,3].includes(ci)) ws[addr]={v:val,t:'n',s:{...numFmt(false,isLow&&ci===2?'E74C3C':GOLD),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if ([4,5].includes(ci)) ws[addr]={v:val,t:'s',s:cellStyle(false,'888888',altBg,'right')};
          else if (ci===6) ws[addr]={v:val,t:'n',s:{...numFmt(true,GREEN),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===7) ws[addr]={v:val,t:'s',s:statusStyle(!isLow)};
          else ws[addr]={v:val,t:'s',s:cellStyle(false,driftNum>25?RED:driftNum>10?AMBER:GREEN,altBg,'center')};
        });
      });

      const footerRow = inventory.length + 9;
      const footerData = ['TOTAL STOCK VALUE','','','','','',`₹${totalValue.toLocaleString()}`,'',''];
      XLSX.utils.sheet_add_aoa(ws, [footerData], { origin: `A${footerRow}` });
      footerData.forEach((_,ci) => { const addr = XLSX.utils.encode_cell({r:footerRow-1,c:ci}); styleCell(ws,addr,ci===0?hdrStyle(DARK,GOLD,true,9):ci===6?hdrStyle('0A2A1A',GREEN,true,10):hdrStyle()); });
      if (!ws['!merges']) ws['!merges']=[];
      ws['!merges'].push({s:{r:footerRow-1,c:0},e:{r:footerRow-1,c:5}});
      ws['!merges'].push({s:{r:footerRow-1,c:6},e:{r:footerRow-1,c:8}});
      ws['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:footerRow,c:8}});
      ws['!cols'] = [24,8,14,14,14,14,16,12,10].map(w=>({wch:w}));
      ws['!rows'] = [{hpt:28},{hpt:14},{hpt:14},{hpt:8},{hpt:20},{hpt:28},{hpt:8},{hpt:20}];
      XLSX.utils.book_append_sheet(wb, ws, '📦 Inventory');
      XLSX.writeFile(wb, `Pratyeksha_Inventory_${todayStr}.xlsx`);
      showNotif('Inventory report exported — premium format');
      return;
    }

    // ── FILTER DATA BY PERIOD ──
    let filteredData = analytics;
    let periodLabel = '';
    if (type==='daily') {
      filteredData = analytics.filter(d=>d._id===todayStr);
      periodLabel = `Daily · ${todayStr}`;
    } else if (type==='weekly') {
      const weekAgo = new Date(istNow.getTime()-7*24*60*60*1000).toISOString().split('T')[0];
      filteredData = analytics.filter(d=>d._id>=weekAgo&&d._id<=todayStr);
      periodLabel = `Weekly · ${weekAgo} to ${todayStr}`;
    } else if (type==='monthly') {
      filteredData = analytics.filter(d=>d._id?.startsWith(exportMonthStr));
      periodLabel = `Monthly · ${viewDate.toLocaleString('default',{month:'long',year:'numeric'})}`;
    } else if (type === 'annual') {
      const year = viewDate.getFullYear();
      filteredData = analytics.filter(d => d._id?.startsWith(`${year}-`));
      periodLabel = `Annual · FY ${year}-${String(year + 1).slice(2)}`;
    }

    const totalRev       = filteredData.reduce((a,b)=>a+(b.revenue||0),0);
    const totalOrders    = filteredData.reduce((a,b)=>a+(b.count||0),0);
    const totalCash      = filteredData.reduce((a,b)=>a+(b.cash||0),0);
    const totalUPI       = filteredData.reduce((a,b)=>a+(b.upi||0),0);
    const totalCard      = filteredData.reduce((a,b)=>a+(b.card||0),0);
    const avgOrder       = totalOrders>0 ? Math.round(totalRev/totalOrders) : 0;
    const totalInvValue  = inventory.reduce((a,i)=>a+Math.max(0,Math.round(i.currentStock*i.costPrice)),0);
    const totalGrossProfit = profitabilityData.reduce((a,b)=>a+(b.grossProfit||0),0);
    const overallMargin  = totalRev>0 ? Math.round((totalGrossProfit/totalRev)*100) : 0;
    const totalIngredientCost = profitabilityData.reduce((a,b)=>a+(b.totalIngredientCost||0),0);

    // ══════════════════════════════════
    // SHEET 1: EXECUTIVE DASHBOARD (unchanged)
    // ══════════════════════════════════
    {
      const ws = {};
      addTitleBlock(ws, `${tenantConfig?.name||tenantId} — EXECUTIVE DASHBOARD`, `Performance summary for ${periodLabel}`, todayStr);

      const kpiLabels = ['TOTAL REVENUE','TOTAL ORDERS','AVG ORDER VALUE','GROSS MARGIN'];
      const kpiValues = [`₹${totalRev.toLocaleString()}`,totalOrders,`₹${avgOrder.toLocaleString()}`,`${overallMargin}%`];
      const kpiColors = [GREEN,GOLD,BLUE,overallMargin>40?GREEN:AMBER];
      kpiLabels.forEach((label,i)=>{
        const col = String.fromCharCode(65+i*2);
        ws[`${col}5`]={v:label,t:'s',s:kpiLabelStyle()};
        ws[`${col}6`]={v:kpiValues[i],t:'s',s:kpiStyle(kpiColors[i])};
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:4,c:i*2},e:{r:4,c:i*2+1}});
        ws['!merges'].push({s:{r:5,c:i*2},e:{r:5,c:i*2+1}});
      });

      const payRow = [
        ['PAYMENT BREAKDOWN','','','','','','',''],
        ['Mode','Amount (₹)','% of Revenue','','CHANNEL BREAKDOWN','','',''],
        ['💵 Cash',totalCash,totalRev>0?`${Math.round((totalCash/totalRev)*100)}%`:'0%','','Dine-In','','',''],
        ['📱 UPI', totalUPI,totalRev>0?`${Math.round((totalUPI/totalRev)*100)}%`:'0%','','Takeaway','','',''],
        ['💳 Card',totalCard,totalRev>0?`${Math.round((totalCard/totalRev)*100)}%`:'0%','','Online','','',''],
      ];
      XLSX.utils.sheet_add_aoa(ws, payRow, { origin: 'A8' });
      styleCell(ws,'A8',hdrStyle());
      if (!ws['!merges']) ws['!merges']=[];
      ws['!merges'].push({s:{r:7,c:0},e:{r:7,c:7}});
      ['A9','B9','C9'].forEach(addr=>styleCell(ws,addr,hdrStyle(MID,GOLD)));

      const maxRev = Math.max(...filteredData.map(d=>d.revenue||0),1);
      const trendHeaders = ['Date','Revenue (₹)','Orders','Avg (₹)','Cash','UPI','Card','Bar Chart'];
      XLSX.utils.sheet_add_aoa(ws,[[''],['DAILY REVENUE BREAKDOWN','','','','','','','']],{origin:'A14'});
      styleCell(ws,'A15',hdrStyle());
      if (!ws['!merges']) ws['!merges']=[];
      ws['!merges'].push({s:{r:14,c:0},e:{r:14,c:7}});
      XLSX.utils.sheet_add_aoa(ws,[trendHeaders],{origin:'A16'});
      trendHeaders.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:15,c:ci}),hdrStyle()));

      filteredData.forEach((d,ri)=>{
        const barLen = Math.round((d.revenue/maxRev)*20);
        const bar = '█'.repeat(barLen)+'░'.repeat(20-barLen);
        const avg = d.count>0?Math.round(d.revenue/d.count):0;
        const altBg = ri%2===0?'0D0D0D':'111111';
        const row = [d._id,d.revenue||0,d.count||0,avg,d.cash||0,d.upi||0,d.card||0,bar];
        row.forEach((val,ci)=>{
          const addr = XLSX.utils.encode_cell({r:16+ri,c:ci});
          if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(false,'888888',altBg)};
          else if (ci===7) ws[addr]={v:val,t:'s',s:{...cellStyle(false,GOLD,altBg),font:{name:'Consolas',sz:7,color:{rgb:GOLD}}}};
          else ws[addr]={v:val,t:'n',s:{...numFmt(false,ci===1?GREEN:WHITE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
        });
      });

      const sfRow = filteredData.length+17;
      const sfData = ['TOTALS / AVERAGES',totalRev,totalOrders,avgOrder,totalCash,totalUPI,totalCard,''];
      XLSX.utils.sheet_add_aoa(ws,[sfData],{origin:`A${sfRow}`});
      sfData.forEach((val,ci)=>{
        const addr = XLSX.utils.encode_cell({r:sfRow-1,c:ci});
        ws[addr]={v:val,t:ci===0?'s':'n',s:ci===0?hdrStyle(DARK,GOLD,true):{...numFmt(true,GREEN),fill:{patternType:'solid',fgColor:{rgb:DARK}}}};
      });

      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:sfRow+2,c:7}});
      ws['!cols']=[16,14,10,12,12,12,12,22].map(w=>({wch:w}));
      ws['!rows']=[{hpt:30},{hpt:14},{hpt:12},{hpt:8},{hpt:22},{hpt:30}];
      XLSX.utils.book_append_sheet(wb, ws, '📊 Dashboard');
    }

    // ══════════════════════════════════
    // SHEET 2: PROFITABILITY MATRIX (unchanged)
    // ══════════════════════════════════
    if (profitabilityData.length > 0) {
      const ws = {};
      addTitleBlock(ws, `${tenantConfig?.name||tenantId} — DISH PROFITABILITY MATRIX`, 'Menu Engineering: Stars, Plowhorses, Puzzles & Dogs', periodLabel);

      const avgSold = profitabilityData.reduce((a,b)=>a+(b.totalQtySold||0),0)/profitabilityData.length;
      const avgMargin = profitabilityData.reduce((a,b)=>a+(b.marginPct||0),0)/profitabilityData.length;
      const classify = (d) => {
        const highSales=(d.totalQtySold||0)>=avgSold, highMargin=(d.marginPct||0)>=avgMargin;
        if (highSales&&highMargin) return {label:'⭐ STAR',color:GREEN};
        if (highSales&&!highMargin) return {label:'🐄 PLOWHORSE',color:BLUE};
        if (!highSales&&highMargin) return {label:'❓ PUZZLE',color:AMBER};
        return {label:'🐕 DOG',color:RED};
      };

      const starCount = profitabilityData.filter(d=>classify(d).label.includes('STAR')).length;
      const phCount   = profitabilityData.filter(d=>classify(d).label.includes('PLOWHORSE')).length;
      const dogCount  = profitabilityData.filter(d=>classify(d).label.includes('DOG')).length;
      const kpiLabels = ['AVG MARGIN','STARS','PLOWHORSES','DOGS'];
      const kpiValues = [`${Math.round(avgMargin)}%`,starCount,phCount,dogCount];
      const kpiColors = [overallMargin>40?GREEN:AMBER,GREEN,BLUE,RED];
      kpiLabels.forEach((label,i)=>{
        const col=String.fromCharCode(65+i*2);
        ws[`${col}5`]={v:label,t:'s',s:kpiLabelStyle()};
        ws[`${col}6`]={v:kpiValues[i],t:'s',s:kpiStyle(kpiColors[i])};
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:4,c:i*2},e:{r:4,c:i*2+1}});
        ws['!merges'].push({s:{r:5,c:i*2},e:{r:5,c:i*2+1}});
      });

      const headers = ['Rank','Dish Name','Category','Selling ₹','Cost ₹/serving','Margin %','Qty Sold','Total Revenue','Total Cost','Gross Profit','P&L','Recipe','Segment'];
      XLSX.utils.sheet_add_aoa(ws,[[''],headers],{origin:'A8'});
      headers.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:8,c:ci}),hdrStyle()));

      profitabilityData.forEach((d,ri)=>{
        const cls=classify(d), altBg=ri%2===0?'0D0D0D':'111111';
        const profitColor=(d.grossProfit||0)>0?GREEN:RED;
        const marginColor=(d.marginPct||0)>50?GREEN:(d.marginPct||0)>30?GOLD:RED;
        const row=[ri+1,d.name,(d.category||'').replace('cat_','').replace(/_/g,' '),d.sellingPrice||0,d.ingredientCostPerServing||0,d.marginPct||0,d.totalQtySold||0,d.totalRevenue||0,Math.round(d.totalIngredientCost||0),Math.round(d.grossProfit||0),(d.grossProfit||0)>0?'PROFIT':'LOSS',d.hasRecipe?'LINKED':'ESTIMATE',cls.label];
        row.forEach((val,ci)=>{
          const addr=XLSX.utils.encode_cell({r:9+ri,c:ci});
          if (ci===0) ws[addr]={v:val,t:'n',s:cellStyle(false,'555555',altBg,'center')};
          else if (ci===1) ws[addr]={v:val,t:'s',s:cellStyle(true,WHITE,altBg)};
          else if (ci===2) ws[addr]={v:val,t:'s',s:cellStyle(false,'666666',altBg)};
          else if ([3,4].includes(ci)) ws[addr]={v:val,t:'n',s:{...numFmt(false,ci===4?AMBER:WHITE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===5) ws[addr]={v:`${val}%`,t:'s',s:cellStyle(true,marginColor,altBg,'center')};
          else if ([6,7,8,9].includes(ci)) ws[addr]={v:val,t:'n',s:{...numFmt(ci===9,ci===9?profitColor:ci===7?GREEN:WHITE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===10) ws[addr]={v:val,t:'s',s:statusStyle(val==='PROFIT')};
          else if (ci===11) ws[addr]={v:val,t:'s',s:cellStyle(false,d.hasRecipe?GREEN:AMBER,altBg,'center')};
          else ws[addr]={v:val,t:'s',s:{...cellStyle(true,cls.color,altBg,'center'),font:{name:'Arial',bold:true,sz:8,color:{rgb:cls.color}}}};
        });
      });

      const lastRow=profitabilityData.length+10;
      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:lastRow,c:12}});
      ws['!cols']=[6,22,14,10,14,10,10,14,12,14,10,10,14].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '💰 Profitability');
    }

    // ══════════════════════════════════
    // SHEET 3: TOP DISHES (unchanged)
    // ══════════════════════════════════
    if (topPerformers.length > 0) {
      const ws = {};
      addTitleBlock(ws,`${tenantConfig?.name||tenantId} — DISH PERFORMANCE`,'Top and bottom performing menu items',periodLabel);
      const maxSold=Math.max(...topPerformers.map(d=>d.sold||0),1);
      const headers=['Rank','Dish Name','Category','Units Sold','Performance Bar','Contribution'];
      XLSX.utils.sheet_add_aoa(ws,[[''],[''],headers],{origin:'A5'});
      headers.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:6,c:ci}),hdrStyle()));
      const totalSold=topPerformers.reduce((a,b)=>a+(b.sold||0),0);
      topPerformers.forEach((d,ri)=>{
        const barLen=Math.round((d.sold/maxSold)*25);
        const bar='█'.repeat(barLen)+'░'.repeat(25-barLen);
        const pct=totalSold>0?`${Math.round((d.sold/totalSold)*100)}%`:'—';
        const altBg=ri%2===0?'0D0D0D':'111111';
        const medal=ri===0?'🥇':ri===1?'🥈':ri===2?'🥉':`#${ri+1}`;
        const row=[medal,d.name,(d.category||'').replace('cat_','').replace(/_/g,' '),d.sold||0,bar,pct];
        row.forEach((val,ci)=>{
          const addr=XLSX.utils.encode_cell({r:7+ri,c:ci});
          if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(true,GOLD,altBg,'center')};
          else if (ci===1) ws[addr]={v:val,t:'s',s:cellStyle(true,WHITE,altBg)};
          else if (ci===2) ws[addr]={v:val,t:'s',s:cellStyle(false,'666666',altBg)};
          else if (ci===3) ws[addr]={v:val,t:'n',s:{...numFmt(true,GREEN),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===4) ws[addr]={v:val,t:'s',s:{font:{name:'Consolas',sz:7,color:{rgb:GOLD}},fill:{patternType:'solid',fgColor:{rgb:altBg}},alignment:{horizontal:'left',vertical:'center'}}};
          else ws[addr]={v:val,t:'s',s:cellStyle(false,GREEN,altBg,'center')};
        });
      });
      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:topPerformers.length+8,c:5}});
      ws['!cols']=[8,26,16,12,28,12].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '🍽️ Top Dishes');
    }

    // ══════════════════════════════════
    // SHEET 4: ★ NEW — P&L + BREAK-EVEN
    // ══════════════════════════════════
    if (profitabilityData.length > 0) {
      const ws = {};
      addTitleBlock(ws, `${tenantConfig?.name||tenantId} — P&L & BREAK-EVEN`, `Financial health summary for ${periodLabel}`, todayStr);

      const monthStr = exportMonthStr;
      const monthlyPayroll = staffEfficiency.reduce((a,s)=>{
        const rec = monthlySalaryRecords.find(r=>r.staffId?.toString()===s._id?.toString()&&r.monthStr===monthStr);
        return a+(Number(rec?.baseSalary||s.baseSalary)||0);
      },0);
      const extraRev    = extraAnalytics?.totalRevenue||0;
      const extraCost   = extraAnalytics?.totalCost||0;
const totalRevPL = canonicalMonthRevenue + (extraAnalytics?.totalRevenue || 0);
      const ingCostPL   = totalIngredientCost+extraCost;
      const grossPL     = totalRevPL-ingCostPL;
      const netPL       = grossPL-monthlyPayroll;
      const netMarginPct = totalRevPL>0?Math.round((netPL/totalRevPL)*100):0;
      const foodCostPct  = totalRevPL>0?(ingCostPL/totalRevPL):0.3;
      const contribPct   = 1-foodCostPct;
      const breakEvenRev = contribPct>0?monthlyPayroll/contribPct:0;
      const daysInMonth  = new Date(viewDate.getFullYear(),viewDate.getMonth()+1,0).getDate();
      const breakEvenDay = breakEvenRev/daysInMonth;
      const progressPct  = breakEvenRev>0?Math.min(100,Math.round((totalRevPL/breakEvenRev)*100)):0;
      const totalCovers  = trendsData?.customers?.total||0;
      const costPerCover = totalCovers>0?Math.round(ingCostPL/totalCovers):0;

      // KPIs
      const kpiLabels=['TOTAL REVENUE','GROSS PROFIT','NET PROFIT','NET MARGIN'];
      const kpiValues=[`₹${totalRevPL.toLocaleString()}`,`₹${grossPL.toLocaleString()}`,`₹${netPL.toLocaleString()}`,`${netMarginPct}%`];
      const kpiColors=[GREEN,GOLD,netPL>=0?GREEN:RED,netMarginPct>15?GREEN:netMarginPct>5?AMBER:RED];
      kpiLabels.forEach((label,i)=>{
        const col=String.fromCharCode(65+i*2);
        ws[`${col}5`]={v:label,t:'s',s:kpiLabelStyle()};
        ws[`${col}6`]={v:kpiValues[i],t:'s',s:kpiStyle(kpiColors[i])};
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:4,c:i*2},e:{r:4,c:i*2+1}});
        ws['!merges'].push({s:{r:5,c:i*2},e:{r:5,c:i*2+1}});
      });

      // P&L table
      const plData = [
        ['P&L STATEMENT',''],
        ['LINE ITEM','AMOUNT (₹)'],
        ['Total Revenue (Menu + Extras)',totalRevPL],
        ['(-) Ingredient Cost',ingCostPL],
        ['= Gross Profit',grossPL],
        ['(-) Staff Payroll',monthlyPayroll],
        ['= Net Profit',netPL],
        ['',''],
        ['Net Margin %',`${netMarginPct}%`],
        ['Food Cost % of Revenue',`${Math.round(foodCostPct*100)}%`],
        ['Cost Per Cover',`₹${costPerCover}`],
      ];
      XLSX.utils.sheet_add_aoa(ws,plData,{origin:'A8'});
      styleCell(ws,'A8',hdrStyle(DARK,GOLD,true,11));
      if (!ws['!merges']) ws['!merges']=[];
      ws['!merges'].push({s:{r:7,c:0},e:{r:7,c:1}});
      styleCell(ws,'A9',hdrStyle(MID,GOLD));
      styleCell(ws,'B9',hdrStyle(MID,GOLD));
      plData.slice(2).forEach((row,ri)=>{
        const r=10+ri;
        const isTotal=row[0].startsWith('=');
        const isDed=row[0].startsWith('(-)');
        const altBg=ri%2===0?'0D0D0D':'111111';
        const aAddr=`A${r}`, bAddr=`B${r}`;
        ws[aAddr]={v:row[0],t:'s',s:cellStyle(isTotal,isTotal?GOLD:isDed?AMBER:WHITE,isTotal?DARK:altBg)};
        if (typeof row[1]==='number') {
          ws[bAddr]={v:row[1],t:'n',s:{...numFmt(isTotal,isTotal?GOLD:isDed?AMBER:netPL>=0?GREEN:RED),fill:{patternType:'solid',fgColor:{rgb:isTotal?DARK:altBg}}}};
        } else {
          ws[bAddr]={v:row[1],t:'s',s:cellStyle(isTotal,isTotal?GOLD:WHITE,isTotal?DARK:altBg,'right')};
        }
      });

      // Break-even section
      const beStart=10+plData.slice(2).length+2;
      const beData=[
        ['BREAK-EVEN ANALYSIS',''],
        ['Monthly Payroll (Fixed Cost)',monthlyPayroll],
        ['Contribution Margin %',`${Math.round(contribPct*100)}%`],
        ['Break-Even Revenue Needed',Math.round(breakEvenRev)],
        ['Break-Even Per Day',Math.round(breakEvenDay)],
        ['Actual Revenue This Month',totalRevPL],
        ['Break-Even Progress',`${progressPct}%`],
        ['Status',progressPct>=100?'✓ ACHIEVED':'⚠ IN PROGRESS'],
      ];
      XLSX.utils.sheet_add_aoa(ws,beData,{origin:`A${beStart}`});
      styleCell(ws,`A${beStart}`,hdrStyle(DARK,BLUE,true,11));
      if (!ws['!merges']) ws['!merges']=[];
      ws['!merges'].push({s:{r:beStart-1,c:0},e:{r:beStart-1,c:1}});
      beData.slice(1).forEach((row,ri)=>{
        const r=beStart+1+ri;
        const altBg=ri%2===0?'0D0D0D':'111111';
        ws[`A${r}`]={v:row[0],t:'s',s:cellStyle(false,'888888',altBg)};
        if (typeof row[1]==='number') {
          ws[`B${r}`]={v:row[1],t:'n',s:{...numFmt(true,GOLD),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
        } else {
          const isAchieved=row[1]==='✓ ACHIEVED';
          ws[`B${r}`]={v:row[1],t:'s',s:cellStyle(true,isAchieved?GREEN:AMBER,altBg,'right')};
        }
      });

      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:beStart+beData.length+2,c:7}});
      ws['!cols']=[32,20,12,12,12,12,12,12].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '📈 P&L & Break-Even');
    }

    // ══════════════════════════════════
    // SHEET 5: ★ NEW — WASTAGE LOG
    // ══════════════════════════════════
    if (wastageAnalytics && (wastageAnalytics.totalEntries||0) > 0) {
      const ws = {};
      addTitleBlock(ws,`${tenantConfig?.name||tenantId} — WASTAGE COST INTELLIGENCE`,`Kitchen wastage log — ${wastageAnalytics.monthLabel||periodLabel}`,todayStr);

      const totalRevForWaste = profitabilityData.reduce((a,b)=>a+(b.totalRevenue||0),0)+(extraAnalytics?.totalRevenue||0);
      const wastagePct = totalRevForWaste>0?((wastageAnalytics.totalCost||0)/totalRevForWaste*100).toFixed(1):0;

      const kpiLabels=['TOTAL COST LOST','ENTRIES LOGGED','WASTAGE % OF REV','TOP WASTED'];
      const topWastedItem=(wastageAnalytics.topWasted||[])[0]?.name||'—';
      const kpiValues=[`₹${(wastageAnalytics.totalCost||0).toLocaleString()}`,wastageAnalytics.totalEntries||0,`${wastagePct}%`,topWastedItem];
      const kpiColors=[PINK,GOLD,Number(wastagePct)>3?PINK:Number(wastagePct)>1?AMBER:GREEN,AMBER];
      kpiLabels.forEach((label,i)=>{
        const col=String.fromCharCode(65+i*2);
        ws[`${col}5`]={v:label,t:'s',s:kpiLabelStyle()};
        ws[`${col}6`]={v:kpiValues[i],t:'s',s:kpiStyle(kpiColors[i])};
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:4,c:i*2},e:{r:4,c:i*2+1}});
        ws['!merges'].push({s:{r:5,c:i*2},e:{r:5,c:i*2+1}});
      });

      // Top wasted items table
      XLSX.utils.sheet_add_aoa(ws,[[''],['TOP WASTED INGREDIENTS','','','']],{origin:'A8'});
      styleCell(ws,'A9',hdrStyle(DARK,PINK,true,10));
      if (!ws['!merges']) ws['!merges']=[];
      ws['!merges'].push({s:{r:8,c:0},e:{r:8,c:3}});
      const wasteHeaders=['Rank','Ingredient','Entries','Cost Lost (₹)'];
      XLSX.utils.sheet_add_aoa(ws,[wasteHeaders],{origin:'A10'});
      wasteHeaders.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:9,c:ci}),hdrStyle(MID,PINK)));
      (wastageAnalytics.topWasted||[]).forEach((item,ri)=>{
        const altBg=ri%2===0?'0D0D0D':'111111';
        const row=[ri+1,item.name,item.count,item.cost||0];
        row.forEach((val,ci)=>{
          const addr=XLSX.utils.encode_cell({r:10+ri,c:ci});
          if (ci===0) ws[addr]={v:val,t:'n',s:cellStyle(false,'555555',altBg,'center')};
          else if (ci===1) ws[addr]={v:val,t:'s',s:cellStyle(ri===0,ri===0?PINK:WHITE,altBg)};
          else if (ci===2) ws[addr]={v:val,t:'n',s:{...numFmt(false,GOLD),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else ws[addr]={v:val,t:'n',s:{...numFmt(true,ri===0?PINK:WHITE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
        });
      });

      // By reason breakdown
      const byReasonStart=(wastageAnalytics.topWasted||[]).length+12;
      XLSX.utils.sheet_add_aoa(ws,[[''],['WASTAGE BY REASON','','','']],{origin:`A${byReasonStart}`});
      styleCell(ws,`A${byReasonStart+1}`,hdrStyle(DARK,AMBER,true,10));
      if (!ws['!merges']) ws['!merges']=[];
      ws['!merges'].push({s:{r:byReasonStart,c:0},e:{r:byReasonStart,c:3}});
      const reasonHeaders=['Reason','Entries','% of Total','Cost Lost (₹)'];
      XLSX.utils.sheet_add_aoa(ws,[reasonHeaders],{origin:`A${byReasonStart+2}`});
      reasonHeaders.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:byReasonStart+1,c:ci}),hdrStyle(MID,AMBER)));
      const totalEntries=wastageAnalytics.totalEntries||1;
      Object.entries(wastageAnalytics.byReason||{}).sort((a,b)=>b[1].cost-a[1].cost).forEach(([reason,data],ri)=>{
        const altBg=ri%2===0?'0D0D0D':'111111';
        const pct=Math.round((data.count/totalEntries)*100);
        const row=[reason,data.count,`${pct}%`,data.cost||0];
        row.forEach((val,ci)=>{
          const addr=XLSX.utils.encode_cell({r:byReasonStart+2+ri,c:ci});
          if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(false,WHITE,altBg)};
          else if (ci===1) ws[addr]={v:val,t:'n',s:{...numFmt(false,GOLD),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===2) ws[addr]={v:val,t:'s',s:cellStyle(false,AMBER,altBg,'center')};
          else ws[addr]={v:val,t:'n',s:{...numFmt(true,PINK),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
        });
      });

      // Daily trend
      const dailyStart=byReasonStart+2+Object.keys(wastageAnalytics.byReason||{}).length+2;
      if ((wastageAnalytics.dailyTrend||[]).length>0) {
        XLSX.utils.sheet_add_aoa(ws,[[''],['DAILY WASTAGE COST TREND','','','']],{origin:`A${dailyStart}`});
        styleCell(ws,`A${dailyStart+1}`,hdrStyle(DARK,PINK,true,10));
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:dailyStart,c:0},e:{r:dailyStart,c:3}});
        const dtHeaders=['Date','Entries','Cost (₹)','Trend Bar'];
        XLSX.utils.sheet_add_aoa(ws,[dtHeaders],{origin:`A${dailyStart+2}`});
        dtHeaders.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:dailyStart+1,c:ci}),hdrStyle(MID,PINK)));
        const maxCost=Math.max(...wastageAnalytics.dailyTrend.map(d=>d.cost),1);
        wastageAnalytics.dailyTrend.forEach((d,ri)=>{
          const altBg=ri%2===0?'0D0D0D':'111111';
          const barLen=Math.round((d.cost/maxCost)*20);
          const bar='█'.repeat(barLen)+'░'.repeat(20-barLen);
          const row=[d.date,d.count,d.cost,bar];
          row.forEach((val,ci)=>{
            const addr=XLSX.utils.encode_cell({r:dailyStart+2+ri,c:ci});
            if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(false,'888888',altBg)};
            else if (ci===1) ws[addr]={v:val,t:'n',s:{...numFmt(false,GOLD),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
            else if (ci===2) ws[addr]={v:val,t:'n',s:{...numFmt(true,d.cost>0?PINK:GREEN),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
            else ws[addr]={v:val,t:'s',s:{font:{name:'Consolas',sz:7,color:{rgb:PINK}},fill:{patternType:'solid',fgColor:{rgb:altBg}},alignment:{horizontal:'left',vertical:'center'}}};
          });
        });
      }

      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:dailyStart+2+(wastageAnalytics.dailyTrend||[]).length+4,c:7}});
      ws['!cols']=[26,12,12,22,12,12,12,12].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '🗑️ Wastage');
    }

    // ══════════════════════════════════
    // SHEET 6: ★ NEW — EXTRA ITEMS
    // ══════════════════════════════════
    if (extraAnalytics && (extraAnalytics.totalSold||0) > 0) {
      const ws = {};
      addTitleBlock(ws,`${tenantConfig?.name||tenantId} — EXTRA ITEMS REVENUE`,'Supplementary catalog — cold drinks, snacks, ice cream, etc.',periodLabel);

      const kpiLabels=['TOTAL REVENUE','TOTAL COST','GROSS PROFIT','UNITS SOLD'];
      const kpiValues=[`₹${(extraAnalytics.totalRevenue||0).toLocaleString()}`,`₹${(extraAnalytics.totalCost||0).toLocaleString()}`,`₹${(extraAnalytics.totalProfit||0).toLocaleString()}`,extraAnalytics.totalSold||0];
      const kpiColors=[GREEN,AMBER,(extraAnalytics.totalProfit||0)>0?GREEN:RED,GOLD];
      kpiLabels.forEach((label,i)=>{
        const col=String.fromCharCode(65+i*2);
        ws[`${col}5`]={v:label,t:'s',s:kpiLabelStyle()};
        ws[`${col}6`]={v:kpiValues[i],t:'s',s:kpiStyle(kpiColors[i])};
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:4,c:i*2},e:{r:4,c:i*2+1}});
        ws['!merges'].push({s:{r:5,c:i*2},e:{r:5,c:i*2+1}});
      });

      const headers=['Item','Category','Sell ₹','Margin %','Units Sold','Revenue (₹)','Cost (₹)','Profit (₹)','P&L'];
      XLSX.utils.sheet_add_aoa(ws,[[''],headers],{origin:'A8'});
      headers.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:8,c:ci}),hdrStyle()));

      const sortedExtras=(extraAnalytics.items||[]).filter(i=>i.totalSold>0).sort((a,b)=>b.profit-a.profit);
      sortedExtras.forEach((item,ri)=>{
        const altBg=ri%2===0?'0D0D0D':'111111';
        const profitColor=(item.profit||0)>0?GREEN:RED;
        const marginColor=(item.margin||0)>40?GREEN:AMBER;
        const row=[item.name,item.category,item.price,`${item.margin||0}%`,item.totalSold,item.revenue||0,Math.round((item.revenue||0)-(item.profit||0)),item.profit||0,(item.profit||0)>0?'PROFIT':'LOSS'];
        row.forEach((val,ci)=>{
          const addr=XLSX.utils.encode_cell({r:9+ri,c:ci});
          if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(true,WHITE,altBg)};
          else if (ci===1) ws[addr]={v:val,t:'s',s:cellStyle(false,'666666',altBg)};
          else if (ci===2) ws[addr]={v:val,t:'n',s:{...numFmt(false,GOLD),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===3) ws[addr]={v:val,t:'s',s:cellStyle(true,marginColor,altBg,'center')};
          else if (ci===4) ws[addr]={v:val,t:'n',s:{...numFmt(false,WHITE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if ([5,6,7].includes(ci)) ws[addr]={v:val,t:'n',s:{...numFmt(ci===7,ci===7?profitColor:ci===5?GREEN:AMBER),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else ws[addr]={v:val,t:'s',s:statusStyle(val==='PROFIT')};
        });
      });

      // Totals row
      const totRow=sortedExtras.length+10;
      const totData=['TOTALS','','',' ',sortedExtras.reduce((a,i)=>a+i.totalSold,0),extraAnalytics.totalRevenue||0,Math.round((extraAnalytics.totalRevenue||0)-(extraAnalytics.totalProfit||0)),extraAnalytics.totalProfit||0,''];
      XLSX.utils.sheet_add_aoa(ws,[totData],{origin:`A${totRow}`});
      totData.forEach((val,ci)=>{
        const addr=XLSX.utils.encode_cell({r:totRow-1,c:ci});
        ws[addr]={v:val,t:ci===0?'s':typeof val==='number'?'n':'s',s:ci===0?hdrStyle(DARK,GOLD,true):{...numFmt(true,ci===7?(extraAnalytics.totalProfit||0)>0?GREEN:RED:GREEN),fill:{patternType:'solid',fgColor:{rgb:DARK}}}};
      });

      // Category breakdown
      if (Object.keys(extraAnalytics.byCategory||{}).length>1) {
        const catStart=totRow+2;
        XLSX.utils.sheet_add_aoa(ws,[['CATEGORY BREAKDOWN','','','']],{origin:`A${catStart}`});
        styleCell(ws,`A${catStart}`,hdrStyle(DARK,GOLD,true,10));
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:catStart-1,c:0},e:{r:catStart-1,c:3}});
        const catHeaders=['Category','Units Sold','Revenue (₹)','Profit (₹)'];
        XLSX.utils.sheet_add_aoa(ws,[catHeaders],{origin:`A${catStart+1}`});
        catHeaders.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:catStart,c:ci}),hdrStyle(MID,GOLD)));
        Object.entries(extraAnalytics.byCategory).forEach(([cat,data],ri)=>{
          const altBg=ri%2===0?'0D0D0D':'111111';
          const row=[cat,data.sold,data.revenue||0,data.profit||0];
          row.forEach((val,ci)=>{
            const addr=XLSX.utils.encode_cell({r:catStart+1+ri,c:ci});
            if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(true,GOLD,altBg)};
            else ws[addr]={v:val,t:'n',s:{...numFmt(ci===3,(data.profit||0)>0?GREEN:AMBER),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          });
        });
      }

      // Dead stock callout
      const deadExtras=(extraAnalytics.items||[]).filter(i=>!i.totalSold||i.totalSold===0);
      if (deadExtras.length>0) {
        const deadStart=totRow+Object.keys(extraAnalytics.byCategory||{}).length+5;
        XLSX.utils.sheet_add_aoa(ws,[[`DEAD STOCK — ${deadExtras.length} ITEMS WITH ZERO SALES`,'','','']],{origin:`A${deadStart}`});
        styleCell(ws,`A${deadStart}`,hdrStyle(DARK,RED,true,10));
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:deadStart-1,c:0},e:{r:deadStart-1,c:3}});
        XLSX.utils.sheet_add_aoa(ws,[['Item Name','Category','Sell ₹','']],{origin:`A${deadStart+1}`});
        deadExtras.forEach((item,ri)=>{
          const altBg=ri%2===0?'0D0D0D':'111111';
          XLSX.utils.sheet_add_aoa(ws,[[item.name,item.category||'—',item.price||0,'']],{origin:`A${deadStart+2+ri}`});
          ['A','B','C'].forEach((col,ci)=>styleCell(ws,`${col}${deadStart+2+ri}`,ci===2?{...numFmt(false,RED),fill:{patternType:'solid',fgColor:{rgb:altBg}}}:cellStyle(false,ci===0?WHITE:'666666',altBg)));
        });
      }

      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:totRow+50,c:8}});
      ws['!cols']=[24,16,10,12,12,14,12,14,10].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '🛒 Extra Items');
    }

    // ══════════════════════════════════
    // SHEET 7: ★ NEW — WAITLIST & COUNTER
    // ══════════════════════════════════
    if (waitlistAnalytics) {
      const ws = {};
      addTitleBlock(ws,`${tenantConfig?.name||tenantId} — WAITLIST & COUNTER ANALYTICS`,`Counter queue performance — ${waitlistAnalytics.month?.monthLabel||periodLabel}`,todayStr);

      const m=waitlistAnalytics.month||{};
      const kpiLabels=['CONVERSION RATE','AVG WAIT TIME','PRE-ORDER REVENUE','NOTIF DELIVERED'];
      const kpiValues=[`${m.conversionPct||0}%`,`${m.avgWaitMin||0} min`,`₹${(m.preOrderRevenue||0).toLocaleString()}`,`${m.notifDeliveredPct||0}%`];
      const kpiColors=[
        (m.conversionPct||0)>70?GREEN:(m.conversionPct||0)>50?GOLD:AMBER,
        (m.avgWaitMin||0)<15?GREEN:(m.avgWaitMin||0)<25?GOLD:RED,
        GREEN, BLUE
      ];
      kpiLabels.forEach((label,i)=>{
        const col=String.fromCharCode(65+i*2);
        ws[`${col}5`]={v:label,t:'s',s:kpiLabelStyle()};
        ws[`${col}6`]={v:kpiValues[i],t:'s',s:kpiStyle(kpiColors[i])};
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:4,c:i*2},e:{r:4,c:i*2+1}});
        ws['!merges'].push({s:{r:5,c:i*2},e:{r:5,c:i*2+1}});
      });

      // Summary table
      const total=m.total||0;
      const walked=Math.max(0,total-((m.seated||0)+(m.pickupSettled||0)));
      const noShowPct=total>0?Math.round((walked/total)*100):0;
      const summaryData=[
        ['MONTHLY SUMMARY',''],
        ['Total Groups',m.total||0],
        ['Dine-In Waitlist',m.dineIn||0],
        ['Pickup / Takeaway',m.pickup||0],
        ['Seated (Dine-In)',m.seated||0],
        ['Pickup Settled',m.pickupSettled||0],
        ['No-Show / Walk-Away',walked],
        ['No-Show Rate',`${noShowPct}%`],
        ['Repeat Waitlist Customers',m.repeatGroups||0],
        ['Pre-Order Revenue',`₹${(m.preOrderRevenue||0).toLocaleString()}`],
        ['Avg Wait Time',`${m.avgWaitMin||0} min`],
        ['Conversion Rate',`${m.conversionPct||0}%`],
        ['Notif Delivered',`${m.notifDeliveredPct||0}%`],
      ];
      XLSX.utils.sheet_add_aoa(ws,summaryData,{origin:'A8'});
      styleCell(ws,'A8',hdrStyle(DARK,GOLD,true,10));
      styleCell(ws,'B8',hdrStyle(DARK,GOLD,true,10));
      summaryData.slice(1).forEach((row,ri)=>{
        const r=9+ri, altBg=ri%2===0?'0D0D0D':'111111';
        ws[`A${r}`]={v:row[0],t:'s',s:cellStyle(false,'888888',altBg)};
        const isRed=row[0].includes('No-Show')&&noShowPct>20;
        const isGreen=row[0]==='Conversion Rate'&&(m.conversionPct||0)>70;
        ws[`B${r}`]={v:row[1],t:typeof row[1]==='number'?'n':'s',s:cellStyle(true,isRed?RED:isGreen?GREEN:WHITE,altBg,'right')};
      });

      // Today's stats
      const todayStart=8+summaryData.length+1;
      const t2=waitlistAnalytics.today||{};
      const todayData=[
        ['TODAY\'S COUNTER',''],
        ['Groups Today',t2.total||0],
        ['Seated Today',t2.seated||0],
        ['Pickup Today',t2.pickup||0],
        ['Still Waiting',t2.waiting||0],
        ['Walk-Aways / No-Show',t2.walked||0],
      ];
      XLSX.utils.sheet_add_aoa(ws,todayData,{origin:`A${todayStart}`});
      styleCell(ws,`A${todayStart}`,hdrStyle(DARK,BLUE,true,10));
      styleCell(ws,`B${todayStart}`,hdrStyle(DARK,BLUE,true,10));
      todayData.slice(1).forEach((row,ri)=>{
        const r=todayStart+1+ri, altBg=ri%2===0?'0D0D0D':'111111';
        ws[`A${r}`]={v:row[0],t:'s',s:cellStyle(false,'888888',altBg)};
        ws[`B${r}`]={v:row[1],t:'n',s:{...numFmt(true,row[0].includes('No-Show')&&(t2.walked||0)>0?RED:GREEN),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
      });

      // Party size distribution
      if (Object.keys(m.partySizes||{}).length>0) {
        const psStart=todayStart+todayData.length+1;
        XLSX.utils.sheet_add_aoa(ws,[['PARTY SIZE DISTRIBUTION','','']],{origin:`A${psStart}`});
        styleCell(ws,`A${psStart}`,hdrStyle(DARK,GOLD,true,10));
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:psStart-1,c:0},e:{r:psStart-1,c:2}});
        XLSX.utils.sheet_add_aoa(ws,[['Party Size','Groups','% of Total']],{origin:`A${psStart+1}`});
        ['A','B','C'].forEach((col,ci)=>styleCell(ws,`${col}${psStart+1}`,hdrStyle(MID,GOLD)));
        const totalGroups=Object.values(m.partySizes||{}).reduce((a,b)=>a+b,0)||1;
        Object.entries(m.partySizes||{}).forEach(([size,count],ri)=>{
          const altBg=ri%2===0?'0D0D0D':'111111';
          const pct=Math.round((count/totalGroups)*100);
          ws[`A${psStart+2+ri}`]={v:size,t:'s',s:cellStyle(false,GOLD,altBg,'center')};
          ws[`B${psStart+2+ri}`]={v:count,t:'n',s:{...numFmt(true,WHITE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          ws[`C${psStart+2+ri}`]={v:`${pct}%`,t:'s',s:cellStyle(false,AMBER,altBg,'center')};
        });
      }

      // Daily footfall trend
      if ((waitlistAnalytics.dailyTrend||[]).length>0) {
        const ftStart=todayStart+todayData.length+Object.keys(m.partySizes||{}).length+4;
        XLSX.utils.sheet_add_aoa(ws,[['DAILY FOOTFALL TREND','','','','']],{origin:`A${ftStart}`});
        styleCell(ws,`A${ftStart}`,hdrStyle(DARK,GOLD,true,10));
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:ftStart-1,c:0},e:{r:ftStart-1,c:4}});
        const ftHeaders=['Date','Total Groups','Seated','Pickup','Walk-Aways'];
        XLSX.utils.sheet_add_aoa(ws,[ftHeaders],{origin:`A${ftStart+1}`});
        ftHeaders.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:ftStart,c:ci}),hdrStyle(MID,GOLD)));
        waitlistAnalytics.dailyTrend.forEach((d,ri)=>{
          const altBg=ri%2===0?'0D0D0D':'111111';
          const row=[d.date,d.total,d.seated,d.pickup,d.walked];
          row.forEach((val,ci)=>{
            const addr=XLSX.utils.encode_cell({r:ftStart+1+ri,c:ci});
            if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(false,'888888',altBg)};
            else ws[addr]={v:val,t:'n',s:{...numFmt(false,ci===4?(d.walked||0)>0?RED:GREEN:WHITE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          });
        });
      }

      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:500,c:7}});
      ws['!cols']=[28,14,14,14,14,14,14,14].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '🔢 Waitlist & Counter');
    }

    // ══════════════════════════════════
    // SHEET 8: STAFF EFFICIENCY (was Sheet 4)
    // ══════════════════════════════════
    if (staffEfficiency.length > 0) {
      const ws = {};
      const monthStr = exportMonthStr;
      addTitleBlock(ws,`${tenantConfig?.name||tenantId} — STAFF PERFORMANCE`,`Workforce analytics for ${viewDate.toLocaleString('default',{month:'long',year:'numeric'})}`,todayStr);

      const totalHrAll=staffEfficiency.reduce((a,s)=>a+(s.totalHours||0),0);
      const paidCount=staffEfficiency.filter(s=>{const rec=monthlySalaryRecords.find(r=>r.staffId?.toString()===s._id?.toString()&&r.monthStr===monthStr);return (rec?.status||s.salaryStatus)==='Paid';}).length;
      const pendingPayroll=filteredStaff.reduce((acc,m)=>{const rec=monthlySalaryRecords.find(r=>r.staffId?.toString()===m._id?.toString()&&r.monthStr===monthStr);return (rec?.status||'Unpaid')==='Paid'?acc:acc+(Number(rec?.baseSalary||m.baseSalary)||0);},0);

      const kpiLabels=['TOTAL STAFF','TOTAL HOURS','SALARY PAID','PENDING PAYROLL'];
      const kpiValues=[staffEfficiency.length,`${totalHrAll.toFixed(1)}h`,paidCount,`₹${pendingPayroll.toLocaleString()}`];
      const kpiCols=[GREEN,BLUE,GREEN,pendingPayroll>0?AMBER:GREEN];
      kpiLabels.forEach((label,i)=>{
        const col=String.fromCharCode(65+i*2);
        ws[`${col}5`]={v:label,t:'s',s:kpiLabelStyle()};
        ws[`${col}6`]={v:kpiValues[i],t:'s',s:kpiStyle(kpiCols[i])};
        if (!ws['!merges']) ws['!merges']=[];
        ws['!merges'].push({s:{r:4,c:i*2},e:{r:4,c:i*2+1}});
        ws['!merges'].push({s:{r:5,c:i*2},e:{r:5,c:i*2+1}});
      });

      const headers=['Name','Role','Shift','Days Present','Hours Logged','Rev/Hour (₹)','Base Salary (₹)','Salary Status','Efficiency Score'];
      XLSX.utils.sheet_add_aoa(ws,[[''],headers],{origin:'A8'});
      headers.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:8,c:ci}),hdrStyle()));

      staffEfficiency.forEach((s,ri)=>{
        const rec=monthlySalaryRecords.find(r=>r.staffId?.toString()===s._id?.toString()&&r.monthStr===monthStr);
        const salStatus=rec?.status||s.salaryStatus||'Unpaid';
        const isPaid=salStatus==='Paid';
        const effScore=s.totalHours>0?Math.min(100,Math.round((s.daysPresent/26)*100)):0;
        const altBg=ri%2===0?'0D0D0D':'111111';
        const row=[s.name,s.role,s.shiftType||'Day Shift',s.daysPresent,s.totalHours,s.revenuePerHour,rec?.baseSalary||s.baseSalary,salStatus,`${effScore}%`];
        row.forEach((val,ci)=>{
          const addr=XLSX.utils.encode_cell({r:9+ri,c:ci});
          if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(true,WHITE,altBg)};
          else if (ci===1) ws[addr]={v:val,t:'s',s:cellStyle(false,GOLD,altBg)};
          else if (ci===2) ws[addr]={v:val,t:'s',s:cellStyle(false,'666666',altBg,'center')};
          else if (ci===3) ws[addr]={v:val,t:'n',s:{...numFmt(true,s.daysPresent>=20?GREEN:s.daysPresent>=10?AMBER:RED),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===4) ws[addr]={v:val,t:'n',s:{...numFmt(false,BLUE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===5) ws[addr]={v:val,t:'n',s:{...numFmt(true,val>0?GREEN:'444444'),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===6) ws[addr]={v:val,t:'n',s:{...numFmt(false,WHITE),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if (ci===7) ws[addr]={v:val,t:'s',s:statusStyle(isPaid)};
          else ws[addr]={v:val,t:'s',s:cellStyle(true,effScore>=80?GREEN:effScore>=50?GOLD:RED,altBg,'center')};
        });
      });

      const lastRow=staffEfficiency.length+10;
      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:lastRow,c:8}});
      ws['!cols']=[20,12,12,12,12,14,14,14,14].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '👥 Staff');
    }

    // INSERT DIRECTLY ABOVE IT:
    // ══════════════════════════════════
    // SHEET ★ — AGGREGATOR REVENUE (Swiggy/Zomato) — only if enabled
    // ══════════════════════════════════
    if (aggregatorAnalytics?.enabled && (aggregatorAnalytics.swiggy || aggregatorAnalytics.zomato)) {
      const ws = {};
      addTitleBlock(ws, `${tenantConfig?.name || tenantId} — AGGREGATOR REVENUE`, `Swiggy & Zomato orders via Dyno — ${periodLabel}`, todayStr);

      const combinedRev = aggregatorAnalytics.combinedRevenue || 0;
      const swiggyRev = aggregatorAnalytics.swiggy?.revenue || 0;
      const zomatoRev = aggregatorAnalytics.zomato?.revenue || 0;

      const kpiLabels = ['COMBINED REVENUE', 'SWIGGY ORDERS', 'ZOMATO ORDERS', 'COMBINED ORDERS'];
      const kpiValues = [
        `₹${combinedRev.toLocaleString()}`,
        aggregatorAnalytics.swiggy?.orderCount || 0,
        aggregatorAnalytics.zomato?.orderCount || 0,
        (aggregatorAnalytics.swiggy?.orderCount || 0) + (aggregatorAnalytics.zomato?.orderCount || 0)
      ];
      const kpiColors = [GREEN, 'F97316', 'EF4444', GOLD];
      kpiLabels.forEach((label, i) => {
        const col = String.fromCharCode(65 + i * 2);
        ws[`${col}5`] = { v: label, t: 's', s: kpiLabelStyle() };
        ws[`${col}6`] = { v: kpiValues[i], t: typeof kpiValues[i] === 'number' ? 'n' : 's', s: kpiStyle(kpiColors[i]) };
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 4, c: i * 2 }, e: { r: 4, c: i * 2 + 1 } });
        ws['!merges'].push({ s: { r: 5, c: i * 2 }, e: { r: 5, c: i * 2 + 1 } });
      });

      let cursorRow = 9;

      // Per-platform summary block
      const platforms = [
        { key: 'swiggy', label: 'SWIGGY', color: 'F97316', data: aggregatorAnalytics.swiggy },
        { key: 'zomato', label: 'ZOMATO', color: 'EF4444', data: aggregatorAnalytics.zomato },
      ].filter(p => p.data);

      platforms.forEach(p => {
        XLSX.utils.sheet_add_aoa(ws, [[`${p.label} SUMMARY`, '', '', '']], { origin: `A${cursorRow}` });
        styleCell(ws, `A${cursorRow}`, hdrStyle(DARK, p.color, true, 11));
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: cursorRow - 1, c: 0 }, e: { r: cursorRow - 1, c: 3 } });
        cursorRow += 1;

        const rows = [
          ['Total Revenue', `₹${(p.data.revenue || 0).toLocaleString()}`],
          ['Total Orders', p.data.orderCount || 0],
          ['Avg Order Value', `₹${p.data.avgOrderValue || 0}`],
          ['Rejected Orders', p.data.rejectedCount || 0],
        ];
        rows.forEach((row, ri) => {
          const r = cursorRow + ri;
          const altBg = ri % 2 === 0 ? '0D0D0D' : '111111';
          ws[`A${r}`] = { v: row[0], t: 's', s: cellStyle(false, '888888', altBg) };
          ws[`B${r}`] = { v: row[1], t: typeof row[1] === 'number' ? 'n' : 's', s: cellStyle(true, p.color, altBg, 'right') };
        });
        cursorRow += rows.length + 1;

        // Top items for this platform
        if ((p.data.topItems || []).length > 0) {
          XLSX.utils.sheet_add_aoa(ws, [['Top Item', 'Qty Sold', 'Revenue (₹)', '']], { origin: `A${cursorRow}` });
          ['A', 'B', 'C'].forEach(col => styleCell(ws, `${col}${cursorRow}`, hdrStyle(MID, p.color)));
          cursorRow += 1;
          p.data.topItems.forEach((it, ri) => {
            const altBg = ri % 2 === 0 ? '0D0D0D' : '111111';
            ws[`A${cursorRow}`] = { v: it.name, t: 's', s: cellStyle(true, WHITE, altBg) };
            ws[`B${cursorRow}`] = { v: it.qty, t: 'n', s: { ...numFmt(false, GOLD), fill: { patternType: 'solid', fgColor: { rgb: altBg } } } };
            ws[`C${cursorRow}`] = { v: Math.round(it.revenue), t: 'n', s: { ...numFmt(true, GREEN), fill: { patternType: 'solid', fgColor: { rgb: altBg } } } };
            cursorRow += 1;
          });
        }
        cursorRow += 2;
      });

      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: cursorRow + 2, c: 7 } });
      ws['!cols'] = [26, 16, 16, 14, 14, 14, 14, 14].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, '🛵 Aggregators');
    }
    // ══════════════════════════════════
    // SHEET 9: INVENTORY SNAPSHOT (was Sheet 5)
    // ══════════════════════════════════
    if (inventory.length > 0) {
      const ws = {};
      addTitleBlock(ws,`${tenantConfig?.name||tenantId} — INVENTORY SNAPSHOT`,'Current stock levels and WAC at time of export',todayStr);
      const headers=['Ingredient','Unit','Stock','Threshold','WAC (₹)','Last Buy (₹)','Value (₹)','Status'];
      XLSX.utils.sheet_add_aoa(ws,[[''],headers],{origin:'A5'});
      headers.forEach((_,ci)=>styleCell(ws,XLSX.utils.encode_cell({r:5,c:ci}),hdrStyle()));
      inventory.forEach((item,ri)=>{
        const isLow=item.currentStock<=item.minThreshold;
        const wac=item.weightedAvgCost||item.costPrice||0;
        const last=item.lastPurchasePrice||wac;
        const altBg=ri%2===0?'0D0D0D':'111111';
        const row=[item.itemName,item.unit,item.currentStock,item.minThreshold,wac.toFixed(2),last.toFixed(2),Math.max(0,Math.round(item.currentStock*wac)),isLow?'⚠ LOW':'✓ OK'];
        row.forEach((val,ci)=>{
          const addr=XLSX.utils.encode_cell({r:6+ri,c:ci});
          if (ci===0) ws[addr]={v:val,t:'s',s:cellStyle(true,WHITE,altBg)};
          else if (ci===1) ws[addr]={v:val,t:'s',s:cellStyle(false,'666666',altBg,'center')};
          else if ([2,3].includes(ci)) ws[addr]={v:val,t:'n',s:{...numFmt(false,ci===2&&isLow?RED:GOLD),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else if ([4,5].includes(ci)) ws[addr]={v:val,t:'s',s:cellStyle(false,'888888',altBg,'right')};
          else if (ci===6) ws[addr]={v:val,t:'n',s:{...numFmt(true,GREEN),fill:{patternType:'solid',fgColor:{rgb:altBg}}}};
          else ws[addr]={v:val,t:'s',s:statusStyle(!isLow)};
        });
      });
      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:inventory.length+7,c:7}});
      ws['!cols']=[22,8,12,12,12,12,14,12].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '📦 Stock');
    }


    // ══════════════════════════════════
    // SHEET 10: ★ GST INVOICE REGISTER
    // Required for GSTR-1 filing
    // ══════════════════════════════════
    {
      const ws = {};
      addTitleBlock(
        ws,
        `${tenantConfig?.name || tenantId} — GST INVOICE REGISTER`,
        `All tax invoices for ${periodLabel} · SAC 996331 · GST @ 5%`,
        todayStr
      );

      // KPIs
      const gstTotalRev   = filteredData.reduce((a, b) => a + (b.revenue || 0), 0);
const gstTaxable    = gstTotalRev / (1 + _totalGstPct);
const gstCGST       = gstTaxable * _cgstPct;
const gstSGST       = gstTaxable * _sgstPct;
      const gstTotalTax   = gstCGST + gstSGST;

      const kpiLabels = ['TAXABLE VALUE', 'CGST @ 2.5%', 'SGST @ 2.5%', 'TOTAL GST'];
      const kpiValues = [
        `₹${Math.round(gstTaxable).toLocaleString()}`,
        `₹${Math.round(gstCGST).toLocaleString()}`,
        `₹${Math.round(gstSGST).toLocaleString()}`,
        `₹${Math.round(gstTotalTax).toLocaleString()}`
      ];
      const kpiColors = [WHITE, GOLD, GOLD, GREEN];
      kpiLabels.forEach((label, i) => {
        const col = String.fromCharCode(65 + i * 2);
        ws[`${col}5`] = { v: label, t: 's', s: kpiLabelStyle() };
        ws[`${col}6`] = { v: kpiValues[i], t: 's', s: kpiStyle(kpiColors[i]) };
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 4, c: i * 2 }, e: { r: 4, c: i * 2 + 1 } });
        ws['!merges'].push({ s: { r: 5, c: i * 2 }, e: { r: 5, c: i * 2 + 1 } });
      });

      // Invoice summary by date (B2C aggregate — suitable for GSTR-3B)
      const headers = [
        'Date', 'Bill Count', 'Gross Revenue (₹)',
        'Taxable Value (₹)', 'CGST 2.5% (₹)', 'SGST 2.5% (₹)',
        'Total Tax (₹)', 'Cash (₹)', 'UPI (₹)', 'Card (₹)'
      ];
      XLSX.utils.sheet_add_aoa(ws, [[''], ['B2C OUTWARD SUPPLY SUMMARY (GSTR-3B TABLE 3.1)','','','','','','','','',''], headers], { origin: 'A8' });
      styleCell(ws, 'A9', hdrStyle(DARK, GOLD, true, 10));
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 8, c: 0 }, e: { r: 8, c: 9 } });
      headers.forEach((_, ci) => styleCell(ws, XLSX.utils.encode_cell({ r: 9, c: ci }), hdrStyle()));

      filteredData.forEach((d, ri) => {
const taxable  = (d.revenue || 0) / (1 + _totalGstPct);
const cgst     = taxable * _cgstPct;
const sgst     = taxable * _sgstPct;
        const altBg    = ri % 2 === 0 ? '0D0D0D' : '111111';
        const row = [
          d._id,
          d.count || 0,
          d.revenue || 0,
          Math.round(taxable),
          Math.round(cgst),
          Math.round(sgst),
          Math.round(cgst + sgst),
          d.cash || 0,
          d.upi || 0,
          d.card || 0
        ];
        row.forEach((val, ci) => {
          const addr = XLSX.utils.encode_cell({ r: 10 + ri, c: ci });
          if (ci === 0) ws[addr] = { v: val, t: 's', s: cellStyle(false, '888888', altBg) };
          else ws[addr] = { v: val, t: 'n', s: { ...numFmt(false, ci === 6 ? GREEN : ci >= 7 ? GOLD : WHITE), fill: { patternType: 'solid', fgColor: { rgb: altBg } } } };
        });
      });

      // Totals row
      const totRow = filteredData.length + 11;
      const totData = [
        'PERIOD TOTALS',
        filteredData.reduce((a, b) => a + (b.count || 0), 0),
        gstTotalRev,
        Math.round(gstTaxable),
        Math.round(gstCGST),
        Math.round(gstSGST),
        Math.round(gstTotalTax),
        filteredData.reduce((a, b) => a + (b.cash || 0), 0),
        filteredData.reduce((a, b) => a + (b.upi || 0), 0),
        filteredData.reduce((a, b) => a + (b.card || 0), 0),
      ];
      XLSX.utils.sheet_add_aoa(ws, [totData], { origin: `A${totRow}` });
      totData.forEach((val, ci) => {
        const addr = XLSX.utils.encode_cell({ r: totRow - 1, c: ci });
        ws[addr] = {
          v: val, t: ci === 0 ? 's' : 'n',
          s: ci === 0
            ? hdrStyle(DARK, GOLD, true)
            : { ...numFmt(true, ci === 6 ? GREEN : GOLD), fill: { patternType: 'solid', fgColor: { rgb: DARK } } }
        };
      });

      // GSTR-3B Ready Summary block
      const gstrStart = totRow + 3;
      const gstrData = [
        ['GSTR-3B READY SUMMARY (Table 3.1a)', ''],
        ['Nature of Supply', 'B2C (Intra-State Restaurant Services)'],
        ['SAC Code', '996331'],
        ['GST Rate', '5% (Composition or Regular)'],
        ['Total Taxable Value (₹)', Math.round(gstTaxable)],
        ['Total CGST (₹)', Math.round(gstCGST)],
        ['Total SGST (₹)', Math.round(gstSGST)],
        ['Total Tax Liability (₹)', Math.round(gstTotalTax)],
        ['Gross Revenue incl. Tax (₹)', Math.round(gstTotalRev)],
        ['Period', periodLabel],
        ['GSTIN', tenantConfig?.gstin || 'PENDING'],
        ['', ''],
        ['NOTE', 'This register is for reference. File via GST portal or CA verification.'],
      ];
      XLSX.utils.sheet_add_aoa(ws, gstrData, { origin: `A${gstrStart}` });
      styleCell(ws, `A${gstrStart}`, hdrStyle(DARK, GREEN, true, 11));
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: gstrStart - 1, c: 0 }, e: { r: gstrStart - 1, c: 1 } });
      gstrData.slice(1).forEach((row, ri) => {
        const r = gstrStart + 1 + ri;
        const altBg = ri % 2 === 0 ? '0D0D0D' : '111111';
        ws[`A${r}`] = { v: row[0], t: 's', s: cellStyle(false, '888888', altBg) };
        ws[`B${r}`] = {
          v: row[1], t: typeof row[1] === 'number' ? 'n' : 's',
          s: typeof row[1] === 'number'
            ? { ...numFmt(true, GREEN), fill: { patternType: 'solid', fgColor: { rgb: altBg } } }
            : cellStyle(true, row[0] === 'NOTE' ? AMBER : WHITE, altBg, 'right')
        };
      });

// ── HSN / SAC SUMMARY BLOCK ──
      const hsnStart = gstrStart + gstrData.length + 3;
      const hsnData = [
        ['HSN / SAC SUMMARY (GSTR-1 TABLE 12)', '', '', '', '', ''],
        ['SAC Code', 'Description', 'UQC', 'Total Qty', 'Taxable Value (₹)', 'IGST', 'CGST (₹)', 'SGST (₹)', 'Total Tax (₹)'],
        ['996331', 'Restaurant Services — Dine-In & Takeaway', 'NA', filteredData.reduce((a, b) => a + (b.count || 0), 0), Math.round(gstTaxable), 0, Math.round(gstCGST), Math.round(gstSGST), Math.round(gstTotalTax)],
      ];
      XLSX.utils.sheet_add_aoa(ws, hsnData, { origin: `A${hsnStart}` });
      styleCell(ws, `A${hsnStart}`, hdrStyle(DARK, BLUE, true, 11));
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: hsnStart - 1, c: 0 }, e: { r: hsnStart - 1, c: 8 } });
      // header row
      hsnData[1].forEach((_, ci) => {
        styleCell(ws, XLSX.utils.encode_cell({ r: hsnStart, c: ci }), hdrStyle(MID, BLUE));
      });
      // data row
      hsnData[2].forEach((val, ci) => {
        const addr = XLSX.utils.encode_cell({ r: hsnStart + 1, c: ci });
        if (ci === 0 || ci === 1 || ci === 2) {
          ws[addr] = { v: val, t: 's', s: cellStyle(true, ci === 0 ? GOLD : ci === 2 ? '666666' : WHITE, '0D0D0D') };
        } else {
          ws[addr] = { v: val, t: 'n', s: { ...numFmt(true, ci === 5 ? '444444' : ci >= 6 ? GREEN : WHITE), fill: { patternType: 'solid', fgColor: { rgb: '0D0D0D' } } } };
        }
      });

      // ── PAYMENT RECONCILIATION FOOTER ──
      const payRecStart = hsnStart + 5;
      const cashTotal = filteredData.reduce((a, b) => a + (b.cash || 0), 0);
      const upiTotal  = filteredData.reduce((a, b) => a + (b.upi || 0), 0);
      const cardTotal = filteredData.reduce((a, b) => a + (b.card || 0), 0);
      const paySum    = cashTotal + upiTotal + cardTotal;
      const payDiff   = Math.round(gstTotalRev) - paySum;
      const isBalanced = payDiff === 0;

      const payRecData = [
        ['PAYMENT MODE RECONCILIATION', ''],
        ['Cash Collected (₹)', cashTotal],
        ['UPI Collected (₹)', upiTotal],
        ['Card Collected (₹)', cardTotal],
        ['─────────────────', '─────────────'],
        ['Total Collected (₹)', paySum],
        ['Gross Revenue (₹)', Math.round(gstTotalRev)],
        ['Difference (₹)', payDiff],
        ['Status', isBalanced ? '✓ BALANCED — No discrepancy' : `⚠ MISMATCH — ₹${Math.abs(payDiff)} unaccounted`],
      ];
      XLSX.utils.sheet_add_aoa(ws, payRecData, { origin: `A${payRecStart}` });
      styleCell(ws, `A${payRecStart}`, hdrStyle(DARK, isBalanced ? GREEN : AMBER, true, 11));
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: payRecStart - 1, c: 0 }, e: { r: payRecStart - 1, c: 1 } });
      payRecData.slice(1).forEach((row, ri) => {
        const r = payRecStart + 1 + ri;
        const altBg = ri % 2 === 0 ? '0D0D0D' : '111111';
        const isDivider = row[0].startsWith('─');
        const isStatus  = row[0] === 'Status';
        const isDiff    = row[0].startsWith('Difference');
        ws[`A${r}`] = {
          v: row[0], t: 's',
          s: isDivider
            ? cellStyle(false, '333333', '0A0A0A')
            : cellStyle(false, isDiff ? (isBalanced ? GREEN : AMBER) : '888888', altBg)
        };
        if (isDivider) {
          ws[`B${r}`] = { v: row[1], t: 's', s: cellStyle(false, '333333', '0A0A0A') };
        } else if (isStatus) {
          ws[`B${r}`] = { v: row[1], t: 's', s: cellStyle(true, isBalanced ? GREEN : AMBER, altBg, 'right') };
        } else {
          ws[`B${r}`] = {
            v: row[1], t: 'n',
            s: {
              ...numFmt(
                row[0].includes('Total') || isDiff,
                isDiff ? (isBalanced ? GREEN : AMBER) : row[0].includes('Total') ? GOLD : WHITE
              ),
              fill: { patternType: 'solid', fgColor: { rgb: altBg } }
            }
          };
        }
      });

      const finalGSTRow = payRecStart + payRecData.length + 2;
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: finalGSTRow, c: 9 } });
      ws['!cols'] = [28, 14, 16, 14, 14, 14, 14, 14, 14, 14].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, '🧾 GST Register');
    }

    // ══════════════════════════════════
    // SHEET 11: INVOICE REGISTER
    // Individual bill-level detail for GSTR-1
    // Pass ordersData prop to enable this sheet
    // ══════════════════════════════════
{
  const ws = {};
  addTitleBlock(
    ws,
    `${tenantConfig?.name || tenantId} — INVOICE REGISTER`,
    `Individual bill-level detail for ${periodLabel} · Required for GSTR-1`,
    todayStr
  );

  if (!ordersData || ordersData.length === 0) {
    ws['A5'] = { v: 'NO ORDER DATA AVAILABLE', t: 's', s: cellStyle(true, 'C0392B', '1A1208') };
    ws['A6'] = { v: 'Check that /orders/:tenantId endpoint is returning data, and that ordersData state is populated before export.', t: 's', s: cellStyle(false, '888888', '0A0A0A') };
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 7, c: 13 } });
    ws['!cols'] = [14, 12, 12, 10, 18, 14, 30, 14, 14, 12, 12, 12, 12, 12].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, '🧾 Invoice Register');
  } else {
    // KPIs
const invTotal    = ordersData.filter(o => o.billDetails?.isSettlementAnchor === true).length;
const invRevTotal = ordersData
  .filter(o => o.billDetails?.isSettlementAnchor === true)
  .reduce((a, b) => a + (b.billDetails?.grandTotal || 0), 0);    
const invTaxable  = invRevTotal / (1 + _totalGstPct);
const invCGST     = invTaxable * _cgstPct;
const invSGST     = invTaxable * _sgstPct;

    const kpiLabels = ['TOTAL INVOICES', 'GROSS REVENUE', 'TOTAL CGST', 'TOTAL SGST'];
    const kpiValues = [
      invTotal,
      `₹${Math.round(invRevTotal).toLocaleString()}`,
      `₹${Math.round(invCGST).toLocaleString()}`,
      `₹${Math.round(invSGST).toLocaleString()}`
    ];
    const kpiColors = [GOLD, GREEN, GOLD, GOLD];
    kpiLabels.forEach((label, i) => {
      const col = String.fromCharCode(65 + i * 2);
      ws[`${col}5`] = { v: label, t: 's', s: kpiLabelStyle() };
      ws[`${col}6`] = { v: kpiValues[i], t: typeof kpiValues[i] === 'number' ? 'n' : 's', s: kpiStyle(kpiColors[i]) };
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 4, c: i * 2 }, e: { r: 4, c: i * 2 + 1 } });
      ws['!merges'].push({ s: { r: 5, c: i * 2 }, e: { r: 5, c: i * 2 + 1 } });
    });

    const headers = [
      'Invoice No', 'Date', 'Time (IST)', 'Table No',
      'Customer Name', 'Phone',
      'Items (Summary)', 'Gross Amount (₹)',
      'Taxable Value (₹)', 'CGST 2.5% (₹)', 'SGST 2.5% (₹)',
      'Total Tax (₹)', 'Payment Mode', 'Status'
    ];
    XLSX.utils.sheet_add_aoa(ws, [[''], ['BILL-LEVEL INVOICE DETAIL', '', '', '', '', '', '', '', '', '', '', '', '', ''], headers], { origin: 'A8' });
    styleCell(ws, 'A9', hdrStyle(DARK, GOLD, true, 10));
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 8, c: 0 }, e: { r: 8, c: 13 } });
    headers.forEach((_, ci) => styleCell(ws, XLSX.utils.encode_cell({ r: 9, c: ci }), hdrStyle()));

const periodOrders = ordersData.filter(order => {
  if (order.billDetails?.isSettlementAnchor !== true) return false; // ← one row per bill, not per order
  const d = new Date(order.createdAt);
  const dateStr = d.toISOString().split('T')[0];
  if (type === 'daily')   return dateStr === todayStr;
  if (type === 'weekly') {
    const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return dateStr >= weekAgo && dateStr <= todayStr;
  }
  if (type === 'monthly') return dateStr.startsWith(exportMonthStr);
  if (type === 'annual')  return dateStr.startsWith(`${viewDate.getFullYear()}-`);
  return true;
});

    periodOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    periodOrders.forEach((order, ri) => {
      const createdAt  = new Date(order.createdAt);
      const dateStr    = createdAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr    = createdAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const gross      = order.billDetails?.grandTotal || order.billDetails?.itemsTotal || 0;
const taxable    = gross / (1 + _totalGstPct);
const cgst       = taxable * _cgstPct;
const sgst       = taxable * _sgstPct;
      const itemSummary = (order.items || [])
        .slice(0, 3)
        .map(i => `${i.name}×${i.quantity}`)
        .join(', ') + ((order.items || []).length > 3 ? ` +${order.items.length - 3} more` : '');
      const payMode    = order.paymentMode || (order.billDetails?.cash > 0 ? 'Cash' : order.billDetails?.upi > 0 ? 'UPI' : 'Card') || '—';
      const isPaid     = order.paymentStatus === 'paid' || order.paymentStatus === 'Paid' || order.status === 'settled';
      const invoiceNo  = `INV-${String(ri + 1).padStart(4, '0')}`;
      const altBg      = ri % 2 === 0 ? '0D0D0D' : '111111';

      const row = [
        invoiceNo, dateStr, timeStr, order.tableNumber || '—',
        order.customerName || order.billDetails?.name || 'Guest',
        order.customerPhone || order.billDetails?.phone || '—',
        itemSummary || '—',
        Math.round(gross), Math.round(taxable), Math.round(cgst), Math.round(sgst),
        Math.round(cgst + sgst), payMode, isPaid ? '✓ PAID' : '⏳ PENDING'
      ];

      row.forEach((val, ci) => {
        const addr = XLSX.utils.encode_cell({ r: 10 + ri, c: ci });
        if (ci === 0) ws[addr] = { v: val, t: 's', s: cellStyle(true, GOLD, altBg) };
        else if ([1, 2].includes(ci)) ws[addr] = { v: val, t: 's', s: cellStyle(false, '888888', altBg, 'center') };
        else if (ci === 3) ws[addr] = { v: val, t: 's', s: cellStyle(true, WHITE, altBg, 'center') };
        else if ([4, 5].includes(ci)) ws[addr] = { v: val, t: 's', s: cellStyle(false, ci === 4 ? WHITE : '666666', altBg) };
        else if (ci === 6) ws[addr] = { v: val, t: 's', s: cellStyle(false, '666666', altBg) };
        else if ([7, 8].includes(ci)) ws[addr] = { v: val, t: 'n', s: { ...numFmt(true, ci === 7 ? GREEN : WHITE), fill: { patternType: 'solid', fgColor: { rgb: altBg } } } };
        else if ([9, 10, 11].includes(ci)) ws[addr] = { v: val, t: 'n', s: { ...numFmt(false, GOLD), fill: { patternType: 'solid', fgColor: { rgb: altBg } } } };
        else if (ci === 12) ws[addr] = { v: val, t: 's', s: cellStyle(false, BLUE, altBg, 'center') };
        else ws[addr] = { v: val, t: 's', s: statusStyle(isPaid) };
      });
    });

    const invTotRow = periodOrders.length + 11;
    const invTotData = [
      'PERIOD TOTALS', '', '', '', '', '',
      `${periodOrders.length} invoices`,
      Math.round(invRevTotal), Math.round(invTaxable), Math.round(invCGST), Math.round(invSGST),
      Math.round(invCGST + invSGST), '', ''
    ];
    XLSX.utils.sheet_add_aoa(ws, [invTotData], { origin: `A${invTotRow}` });
    invTotData.forEach((val, ci) => {
      const addr = XLSX.utils.encode_cell({ r: invTotRow - 1, c: ci });
      ws[addr] = {
        v: val, t: typeof val === 'number' ? 'n' : 's',
        s: ci === 0
          ? hdrStyle(DARK, GOLD, true)
          : typeof val === 'number'
          ? { ...numFmt(true, ci === 7 ? GREEN : ci >= 8 ? GOLD : WHITE), fill: { patternType: 'solid', fgColor: { rgb: DARK } } }
          : hdrStyle(DARK, ci === 6 ? GOLD : '333333')
      };
    });

    const noteRow = invTotRow + 2;
    ws[`A${noteRow}`] = { v: 'GSTR-1 NOTE', t: 's', s: cellStyle(true, AMBER, '0A0A0A') };
    ws[`B${noteRow}`] = { v: 'All supplies are B2C (Intra-State). No B2B invoices. SAC: 996331. File GSTR-1 by 11th of following month.', t: 's', s: cellStyle(false, '888888', '0A0A0A') };
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: noteRow - 1, c: 1 }, e: { r: noteRow - 1, c: 13 } });

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: noteRow + 2, c: 13 } });
    ws['!cols'] = [14, 12, 12, 10, 18, 14, 30, 14, 14, 12, 12, 12, 12, 12].map(w => ({ wch: w }));
    ws['!rows'] = [{ hpt: 30 }, { hpt: 14 }, { hpt: 12 }, { hpt: 8 }, { hpt: 22 }, { hpt: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, '🧾 Invoice Register');
  }
}
    // ══════════════════════════════════
    // SHEET 10: SUMMARY (updated with new metrics)
    // ══════════════════════════════════
    {
      const ws = {};
      addTitleBlock(ws,`${tenantConfig?.name||tenantId} — REPORT SUMMARY`,`Complete overview for ${periodLabel}`,todayStr);
      const extraRev=extraAnalytics?.totalRevenue||0;
      const extraProfit=extraAnalytics?.totalProfit||0;
      const wastageCost=wastageAnalytics?.totalCost||0;
      const monthStr=exportMonthStr;
      const monthlyPayroll=staffEfficiency.reduce((a,s)=>{const rec=monthlySalaryRecords.find(r=>r.staffId?.toString()===s._id?.toString()&&r.monthStr===monthStr);return a+(Number(rec?.baseSalary||s.baseSalary)||0);},0);
      const m=waitlistAnalytics?.month||{};

      const summaryData=[
        ['',''],
        ['FINANCIAL SUMMARY',''],
        ['Period',periodLabel],
        ['Total Revenue (₹)',totalRev],
        ['Extra Items Revenue (₹)',extraRev],
        ['Total Orders',totalOrders],
        ['Avg Order Value (₹)',avgOrder],
        ['Gross Profit (₹)',totalGrossProfit+extraProfit],
        ['Overall Margin',`${overallMargin}%`],
        ['Wastage Cost Lost (₹)',wastageCost],
        ['',''],
        ['PAYMENT BREAKDOWN',''],
        ['Cash Collections (₹)',totalCash],
        ['UPI Collections (₹)',totalUPI],
        ['Card Collections (₹)',totalCard],
        ['',''],
        ['WAITLIST & COUNTER',''],
        ['Total Groups This Month',m.total||0],
        ['Conversion Rate',`${m.conversionPct||0}%`],
        ['Avg Wait Time',`${m.avgWaitMin||0} min`],
        ['No-Show Rate',`${m.total>0?Math.round((Math.max(0,m.total-(m.seated||0)-(m.pickupSettled||0))/m.total)*100):0}%`],
        ['Pre-Order Revenue (₹)',m.preOrderRevenue||0],
        ['',''],
        ['INVENTORY SUMMARY',''],
        ['Total Ingredients',inventory.length],
        ['Low Stock Items',inventory.filter(i=>i.currentStock<=i.minThreshold).length],
        ['Total Inventory Value (₹)',inventory.reduce((a,i)=>a+Math.max(0,Math.round(i.currentStock*(i.weightedAvgCost||i.costPrice||0))),0)],
        ['',''],
        ['STAFF SUMMARY',''],
        ['Total Staff',staff.length],
        ['Active This Month',staffEfficiency.filter(s=>s.daysPresent>0).length],
        ['Total Hours Logged',staffEfficiency.reduce((a,s)=>a+(s.totalHours||0),0).toFixed(1)],
        ['Monthly Payroll (₹)',monthlyPayroll],
        ['',''],
        ['REPORT METADATA',''],
        ['Restaurant',tenantConfig?.name||tenantId],
        ['Generated At (IST)',new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})],
        ['Generated By','PRATYEKSHA RESTAURANT OS'],
      ];

      XLSX.utils.sheet_add_aoa(ws,summaryData,{origin:'A5'});
      const sectionHeaders=['FINANCIAL SUMMARY','PAYMENT BREAKDOWN','WAITLIST & COUNTER','INVENTORY SUMMARY','STAFF SUMMARY','REPORT METADATA'];
      summaryData.forEach((row,ri)=>{
        const addr=`A${ri+5}`;
        if (sectionHeaders.includes(row[0])) {
          styleCell(ws,addr,hdrStyle(DARK,GOLD));
          if (!ws['!merges']) ws['!merges']=[];
          ws['!merges'].push({s:{r:ri+4,c:0},e:{r:ri+4,c:1}});
        } else if (row[0]&&row[1]!=='') {
          styleCell(ws,addr,cellStyle(false,'888888'));
          const valAddr=`B${ri+5}`;
          styleCell(ws,valAddr,typeof row[1]==='number'?numFmt(true,WHITE):cellStyle(true,WHITE,'111111','right'));
        }
      });

      ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:summaryData.length+6,c:1}});
      ws['!cols']=[30,28].map(w=>({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws, '📋 Summary');
    }

    const filename=`Pratyeksha_${tenantConfig?.name||'Report'}_${type}_${type==='monthly'?exportMonthStr:todayStr}.xlsx`;
    XLSX.writeFile(wb,filename);
    showNotif(`${type.toUpperCase()} report exported — ${Object.keys(wb.Sheets).length} sheets`);

  }).catch(err=>{ console.error(err); showNotif('Export failed — check xlsx install','error'); });
},[analytics,inventory,topPerformers,profitabilityData,staffEfficiency,staff,filteredStaff,monthlySalaryRecords,attendanceDate,tenantConfig,tenantId,viewDate,showNotif,extraAnalytics,wastageAnalytics,waitlistAnalytics,trendsData,hourlyAnalytics,ordersData,aggregatorAnalytics]);


const downloadAllTodaysInvoices = useCallback(async () => {
  setIsDownloadingAllBills(true);
  try {
    const res = await axios.get(`${BASE_URL}/admin/bills/${tenantId}/today`);
    const bills = res.data?.bills || [];

    console.log('[downloadAllTodaysInvoices] bills fetched:', bills.length, bills);

    if (bills.length === 0) {
      showNotif('No settled invoices found for today', 'info');
      setIsDownloadingAllBills(false);
      return;
    }

    // ── Builds ONE invoice's inner HTML (no page-break styling — each is captured separately) ──
    const buildInvoiceHTML = (bill) => {
      const itemRows = (bill.items || []).map(it => {
        const unitPrice = it.pricePerUnit
          ? Number(it.pricePerUnit).toFixed(0)
          : (it.quantity > 0 ? (it.subtotal / it.quantity).toFixed(0) : '—');
        return `
          <div style="display:flex;justify-content:space-between;margin-bottom:9px;font-size:14px;">
            <span style="font-weight:700;">
              ${it.quantity}x ${it.name}${it.portion && it.portion !== 'Single' ? ` <span style="font-size:11px;color:#999;">(${it.portion})</span>` : ''}
              <br/><span style="color:#999;font-size:11px;">@ ₹${unitPrice}</span>
            </span>
            <b>₹${Number(it.subtotal || 0).toFixed(2)}</b>
          </div>
        `;
      }).join('');

      const paymentMode = bill.paymentDetails?.method === 'split'
        ? 'SPLIT PAYMENT'
        : (bill.paymentDetails?.method || '—').toUpperCase();

      const sourceTag = bill.isAggregator
        ? `<span style="background:${bill.aggregatorPlatform === 'zomato' ? '#cb202d' : '#fc8019'};color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:900;letter-spacing:0.5px;margin-left:8px;">${(bill.aggregatorPlatform || '').toUpperCase()}</span>`
        : '';

      const settledDate = bill.settledAt ? new Date(bill.settledAt) : new Date();
      const dateStr = isNaN(settledDate.getTime())
        ? '—'
        : settledDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      const timeStr = isNaN(settledDate.getTime())
        ? '—'
        : settledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      const grandTotal = Math.round(bill.grandTotal || 0);
      const tableOrCustomerLabel = bill.isAggregator ? 'CUSTOMER' : 'TABLE';
      const tableOrCustomerValue = bill.isAggregator ? (bill.customerName || 'Online') : (bill.tableNumber || '—');

      return `
        <div style="width:794px;background:#ffffff;padding:68px;font-family:Arial,sans-serif;color:#000000;box-sizing:border-box;">

          <div style="text-align:center;margin-bottom:16px;">
            <h4 style="margin:0;font-size:10px;letter-spacing:2px;font-weight:800;color:#888;">TAX INVOICE${sourceTag}</h4>
            <h1 style="margin:5px 0;color:#555;font-size:26px;font-weight:900;text-transform:uppercase;">${bill.businessName || ''}</h1>
            <p style="font-size:10px;color:#555;margin:0 0 3px;font-weight:600;">${bill.address || 'Address not configured'}</p>
            <p style="font-size:11px;font-weight:800;margin:2px 0;">GSTIN: ${bill.gstin || '—'}</p>
            ${bill.fssaiNumber ? `<p style="font-size:10px;font-weight:700;margin:2px 0;color:#666;">FSSAI: ${bill.fssaiNumber}</p>` : ''}
          </div>

          <div style="border-top:2px solid #000;border-bottom:2px solid #000;padding:8px 0;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div>
              <div style="font-size:9px;font-weight:900;color:#888;letter-spacing:1px;">BILL NO. (TODAY)</div>
              <div style="font-size:18px;font-weight:900;">#${bill.billNo ?? '—'}</div>
              <div style="font-size:9px;color:#aaa;margin-top:2px;">Total #${bill.totalBillCount ?? '—'}</div>
            </div>
            <div>
              <div style="font-size:9px;font-weight:900;color:#888;letter-spacing:1px;">${tableOrCustomerLabel}</div>
              <div style="font-size:18px;font-weight:900;">${tableOrCustomerValue}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px;font-weight:800;">${dateStr}</div>
              <div style="font-size:11px;color:#666;">${timeStr}</div>
            </div>
          </div>

          <div style="padding:6px 0;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-weight:900;color:#888;margin-bottom:8px;letter-spacing:0.5px;">
              <span>ITEM DESCRIPTION</span><span>TOTAL</span>
            </div>
            ${itemRows}
          </div>

          <div style="border-top:1px solid #eee;padding-top:12px;font-size:13px;">
            <div style="display:flex;justify-content:space-between;padding:4px 0;">
              <span>Subtotal (excl. tax)</span><span>₹${Number(bill.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;">
              <span>CGST @ ${bill.cgstPct ?? '—'}%</span><span>₹${Number(bill.cgst || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;">
              <span>SGST @ ${bill.sgstPct ?? '—'}%</span><span>₹${Number(bill.sgst || 0).toFixed(2)}</span>
            </div>
            <p style="font-size:9px;font-style:italic;margin-top:8px;font-weight:700;color:#888;">${bill.totalInWords || ''}</p>
          </div>

          <div style="border-top:2px solid #000;padding-top:14px;margin-top:14px;">
            <div style="display:flex;justify-content:space-between;font-size:22px;font-weight:900;">
              <span>GRAND TOTAL</span>
              <span>₹${grandTotal}</span>
            </div>
            <div style="font-size:9px;font-weight:800;color:#888;text-align:right;margin-top:4px;">
              MODE: ${paymentMode}
            </div>
          </div>

          <div style="text-align:center;margin-top:24px;font-size:9px;font-weight:900;color:#ccc;letter-spacing:1px;">
            POWERED BY PRATYEKSHA
          </div>
        </div>
      `;
    };

    // ── Dynamically import both libs we need: html2canvas (for the actual capture) + jsPDF (for page assembly) ──
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({ unit: 'px', format: 'a4', orientation: 'portrait' });
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    // ── Single off-screen render host — reused per bill so memory stays low ──
    const renderHost = document.createElement('div');
    renderHost.style.cssText = `
      position: fixed;
      top: 0;
      left: -9999px;
      width: 794px;
      background: #ffffff;
    `;
    document.body.appendChild(renderHost);

    for (let i = 0; i < bills.length; i++) {
      renderHost.innerHTML = buildInvoiceHTML(bills[i]);

      // Force reflow + wait for paint before capturing
      renderHost.getBoundingClientRect();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const targetEl = renderHost.firstElementChild;
      console.log(`[downloadAllTodaysInvoices] bill ${i + 1}/${bills.length} render size:`, targetEl.scrollWidth, 'x', targetEl.scrollHeight);

      if (targetEl.scrollHeight < 50) {
        console.error(`[downloadAllTodaysInvoices] bill ${i + 1} failed to render — skipping`);
        continue;
      }

      const canvas = await html2canvas(targetEl, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: true,
        width: targetEl.scrollWidth,
        height: targetEl.scrollHeight,
        windowWidth: targetEl.scrollWidth,
        windowHeight: targetEl.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // Scale the captured image to fit the PDF page width, preserving aspect ratio
      const imgWidth = pdfPageWidth;
      const imgHeight = (canvas.height * pdfPageWidth) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }

    document.body.removeChild(renderHost);

    const todayStr = new Date(new Date().getTime() + 330 * 60 * 1000).toISOString().split('T')[0];
    pdf.save(`Pratyeksha_All_Invoices_${todayStr}.pdf`);

    showNotif(`${bills.length} invoice${bills.length !== 1 ? 's' : ''} downloaded`, 'success');
  } catch (err) {
    console.error('Download all invoices error:', err);
    showNotif('Failed to generate invoice PDF', 'error');
  } finally {
    setIsDownloadingAllBills(false);
  }
}, [tenantId, showNotif]);

const generateSalarySlip = useCallback((member) => {
  const monthPrefix = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
  const monthName = viewDate.toLocaleString('default',{month:'long',year:'numeric'});
  // Use monthly salary record if available (captures salary as it was that month)
const monthRec = monthlySalaryRecords.find(r =>
  r.staffId?.toString() === member._id?.toString() && r.monthStr === monthPrefix
);
const salaryForSlip = monthRec?.baseSalary || Number(member.baseSalary);
  const daysPresent = attendanceLogs.filter(l =>
    (l.staffId===member._id || l.staffId?.toString()===member._id?.toString()) &&
    l.date?.startsWith(monthPrefix)
  ).length;
  const workingDays = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate();
const dailyRate = Math.round(salaryForSlip / workingDays);

  const absences = Math.max(0, workingDays - daysPresent);
const deductions = absences * dailyRate;
const netPay = salaryForSlip - deductions;
  const pureName = member.name.includes(' (') ? member.name.split(' (')[0] : member.name;

  const slipHTML = `
    <div id="salary-slip-frame" style="width:210mm;min-height:148mm;background:#fff;padding:20mm;font-family:Arial,sans-serif;color:#000;box-sizing:border-box;">
      <div style="border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:1.2rem;font-weight:900;text-transform:uppercase;">${tenantConfig?.name || tenantId}</div>
          <div style="font-size:0.7rem;color:#555;margin-top:4px;">${tenantConfig?.address?.street||''}, ${tenantConfig?.address?.city||''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.65rem;font-weight:800;color:#555;letter-spacing:1px;">SALARY SLIP</div>
          <div style="font-size:0.85rem;font-weight:900;margin-top:4px;">${monthName.toUpperCase()}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;padding:12px;background:#f9f9f9;border-radius:6px;">
        ${[
          ['Employee Name', pureName],
          ['Role', member.role],
          ['Contact', member.contact],
          ['Joining Date', member.joiningDate ? new Date(member.joiningDate).toLocaleDateString('en-GB') : '—'],
          ['Shift Type', member.shiftType],
          ['Employee ID', member._id.toString().slice(-6).toUpperCase()]
        ].map(([k,v]) => `
          <div>
            <div style="font-size:0.58rem;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${k}</div>
            <div style="font-size:0.82rem;font-weight:800;margin-top:2px;">${v}</div>
          </div>
        `).join('')}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#000;color:#fff;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;">
            <th style="padding:8px 12px;text-align:left;">Description</th>
            <th style="padding:8px 12px;text-align:right;">Days</th>
            <th style="padding:8px 12px;text-align:right;">Rate (₹/day)</th>
            <th style="padding:8px 12px;text-align:right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody style="font-size:0.78rem;">
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 12px;">Basic Salary</td>
            <td style="padding:10px 12px;text-align:right;">${workingDays}</td>
            <td style="padding:10px 12px;text-align:right;">₹${dailyRate.toLocaleString()}</td>
            <td style="padding:10px 12px;text-align:right;">₹${salaryForSlip.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 12px;">Days Present</td>
            <td style="padding:10px 12px;text-align:right;">${daysPresent}</td>
            <td style="padding:10px 12px;text-align:right;">—</td>
            <td style="padding:10px 12px;text-align:right;color:#555;">—</td>
          </tr>
          ${deductions > 0 ? `
          <tr style="border-bottom:1px solid #eee;color:#a33;">
            <td style="padding:10px 12px;">Absent Deduction (${absences} day${absences>1?'s':''})</td>
            <td style="padding:10px 12px;text-align:right;">${absences}</td>
            <td style="padding:10px 12px;text-align:right;">₹${dailyRate.toLocaleString()}</td>
            <td style="padding:10px 12px;text-align:right;">- ₹${deductions.toLocaleString()}</td>
          </tr>` : ''}
        </tbody>
        <tfoot>
          <tr style="background:#000;color:#fff;font-weight:900;font-size:0.85rem;">
            <td colspan="3" style="padding:12px;">NET PAYABLE</td>
            <td style="padding:12px;text-align:right;">₹${netPay.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;padding-top:16px;border-top:1px dashed #ccc;">
        <div>
          <div style="font-size:0.6rem;color:#888;margin-bottom:24px;">Employee Signature</div>
          <div style="border-top:1px solid #000;padding-top:4px;font-size:0.6rem;color:#888;">${pureName}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.6rem;color:#888;margin-bottom:24px;">Authorized Signatory</div>
          <div style="border-top:1px solid #000;padding-top:4px;font-size:0.6rem;color:#888;">${tenantConfig?.name || ''}</div>
        </div>
      </div>

      <div style="text-align:center;margin-top:16px;font-size:0.55rem;color:#aaa;border-top:1px solid #eee;padding-top:8px;">
        Generated by PRATYEKSHA · ${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}
      </div>
    </div>
  `;

  // Mount hidden, export, unmount
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
  container.innerHTML = slipHTML;
  document.body.appendChild(container);

  import('html2pdf.js').then(html2pdf => {
    const el = container.querySelector('#salary-slip-frame');
    html2pdf.default().set({
      margin: 0,
      filename: `SalarySlip_${pureName.replace(/\s/g,'_')}_${monthName.replace(/\s/g,'_')}.pdf`,
      image: { type:'jpeg', quality:1.0 },
      html2canvas: { scale:3, backgroundColor:'#ffffff', useCORS:true },
      jsPDF: { unit:'mm', format:'a5', orientation:'landscape' }
    }).from(el).save().then(() => {
      document.body.removeChild(container);
      showNotif(`Salary slip generated for ${pureName}`);
    });
  });
}, [viewDate, attendanceLogs, tenantConfig, tenantId]);

const renderMonthHeatmap = () => {
  const year=viewDate.getFullYear(), month=viewDate.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate(), firstDay=new Date(year,month,1).getDay();
  const maxRev=Math.max(...currentMonthAnalytics.map(a=>a.revenue||0),1);

  // ── Breakeven: estimate daily ingredient cost from profitabilityData
const totalRevenueAllTime = canonicalMonthRevenue;
  const totalCostAllTime = profitabilityData.reduce((a,b) => a+(b.totalIngredientCost||0), 0);
  const costRatio = totalRevenueAllTime > 0 ? totalCostAllTime / totalRevenueAllTime : 0.4;

  const grid=[];
  for(let x=0;x<firstDay;x++) grid.push(<div key={`p${x}`} style={styles.heatSquareEmpty}/>);
  for(let i=1;i<=daysInMonth;i++){
    const dateStr=`${year}-${(month+1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`;
    const dayData = currentMonthAnalytics.find(d=>d._id===dateStr);
    const rev = dayData?.revenue || 0;
    const estimatedCost = rev * costRatio;
    const isProfitable = rev > 0 && rev > estimatedCost;
    const isBreakeven  = rev > 0 && !isProfitable;

    grid.push(
      <motion.div key={i} whileHover={{scale:1.1,zIndex:10}}
        title={rev > 0 ? `₹${rev.toLocaleString()} revenue · Est. cost ₹${Math.round(estimatedCost).toLocaleString()} · ${isProfitable?'PROFITABLE':'BREAK-EVEN'}` : 'No revenue'}
        style={{
          ...styles.heatSquare,
          background: rev > 0
            ? isProfitable
              ? `rgba(211,191,162,${Math.max(0.2, rev/maxRev)})`
              : 'rgba(138,112,77,0.2)'
            : '#111',
          border: isProfitable && rev>(maxRev*0.7)
            ? '1px solid #d3bfa2'
            : isBreakeven
              ? '1px solid rgba(138,112,77,0.4)'
              : '1px solid #1a1a1a',
          position:'relative'
        }}>
        <span style={{fontSize:'0.75rem',color:rev>(maxRev*0.5)?'#000':'#444',fontWeight:'800'}}>{i}</span>
        {/* Breakeven indicator dot */}
        {isBreakeven && (
          <div style={{
            position:'absolute',bottom:'4px',right:'4px',
            width:'4px',height:'4px',borderRadius:'50%',
            background:'#8a704d'
          }}/>
        )}
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
{/* TOAST */}
<AnimatePresence>
  {notif.show && (() => {
    const iconMap = {
      waitlist:    <Users size={15} />,
      pickup:      <ShoppingBag size={15} />,
      reservation: <CalendarClock size={15} />,
    };
    const colorMap = {
      success: '#d3bfa2',
      error:   '#8a3030',
      info:    '#8a704d',
    };
    const bgMap = {
      waitlist:    'rgba(211,191,162,0.06)',
      pickup:      'rgba(138,112,77,0.08)',
      reservation: 'rgba(201,168,76,0.07)',
    };
    const accentColor = colorMap[notif.type] || '#d3bfa2';
    const icon = iconMap[notif.subtype] || <Zap size={15} />;
    const subtypeLabel = {
      waitlist:    'WALK-IN',
      pickup:      'PICKUP',
      reservation: 'RESERVATION',
    }[notif.subtype];

    return (
      <motion.div
        initial={{ x: 340, opacity: 0, scale: 0.96 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: 340, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          ...styles.toast,
          borderLeft: `3px solid ${accentColor}`,
          background: bgMap[notif.subtype] || 'rgba(13,13,13,0.97)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', gap: '3px',
          padding: '12px 16px', minWidth: '260px', maxWidth: '340px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: accentColor, flexShrink: 0 }}>{icon}</span>
          {subtypeLabel && (
            <span style={{
              fontSize: '0.48rem', fontWeight: '900', letterSpacing: '1.5px',
              color: accentColor, opacity: 0.7,
              background: `${accentColor}18`,
              padding: '2px 7px', borderRadius: '4px'
            }}>
              {subtypeLabel}
            </span>
          )}
        </div>
        <div style={{
          fontSize: '0.72rem', fontWeight: '700', color: '#fff',
          lineHeight: 1.4, paddingLeft: '23px'
        }}>
          {notif.msg}
        </div>
      </motion.div>
    );
  })()}
</AnimatePresence>

 
{/* MOBILE OVERLAY BACKDROP */}
{sidebarOpen && (
  <div
    onClick={() => setSidebarOpen(false)}
    style={{
      display: 'none',
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 8999,
    }}
    className="p-mob-backdrop"
  />
)}
 
<aside style={styles.sidebar} className={`p-sidebar ${sidebarOpen ? 'p-sidebar-open' : ''}`}>
 
  {/* ── Logo / Brand block ── */}
  <div style={{
    padding:'28px 22px 20px',
    borderBottom:'1px solid rgba(211,191,162,0.06)',
    flexShrink:0
  }}>
    {/* Logo row */}
    <div style={{display:'flex',alignItems:'center',gap:'11px',marginBottom:'18px'}}>
      <div style={{
        width:'36px',height:'36px',borderRadius:'10px',flexShrink:0,
        background:'linear-gradient(135deg,rgba(211,191,162,0.15),rgba(138,112,77,0.08))',
        border:'1px solid rgba(211,191,162,0.18)',
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'0 4px 16px rgba(0,0,0,0.4)'
      }}>
        <img src={logoPath} alt="P" style={{width:'22px',height:'22px',objectFit:'contain',filter:'brightness(1.4)'}} className="p-sidebar-logo-wrap"/>
      </div>
      <div>
        <div style={{fontSize:'0.78rem',fontWeight:'900',color:'#d3bfa2',letterSpacing:'1.5px',lineHeight:1}}>PRATYEKSHA</div>
        <div style={{fontSize:'0.5rem',color:'#333',fontWeight:'700',letterSpacing:'1px',marginTop:'3px'}}>OPERATOR TERMINAL</div>
      </div>
    </div>
 
  </div>
 
  {/* ── Navigation ── */}
  <div style={{...styles.sidebarTop,padding:'14px 14px',flex:1}} className="p-sidebar-top">
    {/* Section labels + nav items */}
    {[
      {
        section: 'OPERATIONS',
        items: [
          {id:'pending',      label:'Live Kitchen',    icon:<CookingPot size={16}/>,   badge: orders.filter(o=>o.status==='pending').length},
          {id:'billing',      label:'Billing Hub',     icon:<ReceiptIndianRupee size={16}/>, badge: null},
          {id:'menu',         label:'Menu Editor',     icon:<UtensilsCrossed size={16}/>, badge: menuItems.filter(i=>!i.isAvailable).length > 0 ? menuItems.filter(i=>!i.isAvailable).length : null},
        ]
      },
      {
        section: 'INTELLIGENCE',
        items: [
          {id:'insights',     label:'Insights',        icon:<BarChart3 size={16}/>,    badge: null},
          {id:'intelligence', label:'AI Intelligence', icon:<Sparkles size={16}/>,     badge: null},
          {id:'assist',       label:'Assist',          icon:<MessageSquare size={16}/>, badge: null},
          {id:'audit',        label:'Audit',           icon:<ShieldCheck size={16}/>,  badge: null},
        ]
      },
      {
        section: 'CATALOG',
        items: [
          {id:'inventory',    label:'Inventory',       icon:<Layers size={16}/>,       badge: (procurementData||[]).filter(p=>p.daysRemaining!==null&&p.daysRemaining<=2).length || null},
          {id:'extras',       label:'Extra Items',     icon:<ShoppingBag size={16}/>,  badge: null},
          {id:'recipes',      label:'Recipes',         icon:<ChefHat size={16}/>,      badge: null},
        ]
      },
      {
        section: 'PEOPLE & GROWTH',
        items: [
          {id:'management',   label:'Management',      icon:<UserRoundCog size={16}/>, badge: null},
          {id:'customers',    label:'Customers',       icon:<Users size={16}/>,        badge: null},
          {id:'marketing',    label:'Marketing',       icon:<Megaphone size={16}/>,    badge: announcements.filter(a=>a.isActive&&new Date(a.expiresAt)>new Date()).length || null},
          // {id:'feedback',     label:'Feedback',        icon:<MessageCircle size={16}/>,badge: (feedbackData?.summary?.unread ?? 0) > 0 ? feedbackData.summary.unread : null},
        ]
      },
    ].map(({section,items})=>(
      <div key={section} style={{marginBottom:'6px'}}>
        {/* Section label */}
        <div style={{
          fontSize:'0.44rem',color:'#272727',fontWeight:'900',
          letterSpacing:'1.8px',padding:'10px 8px 6px',
          textTransform:'uppercase'
        }}>{section}</div>
        {/* Items */}
        <nav style={{display:'flex',flexDirection:'column',gap:'2px'}}>
          {items.map(tab=>{
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={()=>{setActiveTab(tab.id);setSidebarOpen(false);}}
                className="p-nav-btn"
                title={tab.label}
                style={{
                  display:'flex',alignItems:'center',gap:'10px',
                  padding:'9px 10px',borderRadius:'9px',cursor:'pointer',
                  background: isActive ? 'rgba(211,191,162,0.09)' : 'transparent',
                  border: isActive ? '1px solid rgba(211,191,162,0.18)' : '1px solid transparent',
                  color: isActive ? '#d3bfa2' : '#2e2e2e',
                  transition:'all 0.15s',
                  position:'relative',
                  textAlign:'left',
                }}
                onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.color='#555';}}}
                onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#2e2e2e';}}}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div style={{
                    position:'absolute',left:0,top:'20%',bottom:'20%',
                    width:'2px',borderRadius:'2px',
                    background:'linear-gradient(180deg,transparent,#d3bfa2,transparent)'
                  }}/>
                )}
                <span style={{
                  flexShrink:0,
                  color: isActive ? '#d3bfa2' : '#2a2a2a',
                  transition:'color 0.15s'
                }}>{tab.icon}</span>
                <span className="p-nav-label" style={{
                  fontSize:'0.7rem',fontWeight: isActive ? '900' : '700',
                  flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'
                }}>{tab.label}</span>
                {/* Badge */}
                {tab.badge !== null && tab.badge > 0 && (
                  <span style={{
                    fontSize:'0.48rem',fontWeight:'900',minWidth:'18px',height:'18px',
                    borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',
                    padding:'0 4px',flexShrink:0,fontFamily:'monospace',
                    background: isActive ? 'rgba(211,191,162,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#d3bfa2' : '#3a3a3a',
                    border: isActive ? '1px solid rgba(211,191,162,0.2)' : '1px solid rgba(255,255,255,0.06)'
                  }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    ))}
  </div>
 
  {/* ── Bottom operator card ── */}
  <div style={{
    padding:'16px',borderTop:'1px solid rgba(211,191,162,0.06)',
    flexShrink:0
  }} className="p-sidebar-bottom">
    <div style={{
      display:'flex',alignItems:'center',gap:'11px',
      padding:'12px 13px',borderRadius:'11px',marginBottom:'10px',
      background:'rgba(211,191,162,0.04)',
      border:'1px solid rgba(211,191,162,0.09)'
    }} className="p-op-card">
      <div style={{
        width:'32px',height:'32px',borderRadius:'9px',flexShrink:0,
        background:'linear-gradient(135deg,rgba(211,191,162,0.15),rgba(138,112,77,0.08))',
        border:'1px solid rgba(211,191,162,0.2)',
        display:'flex',alignItems:'center',justifyContent:'center'
      }}>
        <User size={14} color="#d3bfa2"/>
      </div>
      <div className="p-op-text" style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'0.68rem',fontWeight:'900',color:'#d3bfa2',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>MANAGER</div>
        <div style={{fontSize:'0.52rem',color:'#2a2a2a',fontWeight:'700',marginTop:'1px'}}>Session active</div>
      </div>
    </div>
    <button onClick={handleLogout} className="p-logout-btn" style={{
      width:'100%',padding:'10px',background:'transparent',
      border:'1px solid rgba(255,255,255,0.05)',color:'#252525',
      borderRadius:'9px',fontSize:'0.6rem',fontWeight:'900',cursor:'pointer',
      letterSpacing:'1px',transition:'all 0.15s'
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(211,191,162,0.15)';e.currentTarget.style.color='#555';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.05)';e.currentTarget.style.color='#252525';}}>
      SIGN OUT
    </button>
  </div>
</aside>


<main style={styles.mainContent}>
<header style={styles.topHeader} className="p-top-header">
 
  {/* Hamburger */}
  <button className="p-hamburger" onClick={()=>setSidebarOpen(true)} style={{
    display:'none',background:'transparent',border:'1px solid #1a1a1a',color:'#d3bfa2',
    width:'36px',height:'36px',borderRadius:'9px',cursor:'pointer',
    alignItems:'center',justifyContent:'center',flexShrink:0
  }} aria-label="Open menu">
    <AlignJustify size={16} color="#d3bfa2"/>
  </button>
 
  {/* Page title block */}
  <div className="p-header-left" style={{display:'flex',alignItems:'center',gap:'14px',minWidth:0}}>
    {/* Icon for active tab */}
    <div style={{
      width:'36px',height:'36px',borderRadius:'10px',flexShrink:0,
      background:'rgba(211,191,162,0.06)',border:'1px solid rgba(211,191,162,0.12)',
      display:'flex',alignItems:'center',justifyContent:'center'
    }}>
      {activeTab==='pending'     ? <CookingPot size={16} color="#d3bfa2"/> :
       activeTab==='billing'     ? <ReceiptIndianRupee size={16} color="#d3bfa2"/> :
       activeTab==='menu'        ? <UtensilsCrossed size={16} color="#d3bfa2"/> :
       activeTab==='insights'    ? <BarChart3 size={16} color="#d3bfa2"/> :
       activeTab==='intelligence'? <Sparkles size={16} color="#d3bfa2"/> :
       activeTab==='assist'      ? <MessageSquare size={16} color="#d3bfa2"/> :
       activeTab==='audit'       ? <ShieldCheck size={16} color="#d3bfa2"/> :
       activeTab==='management'  ? <UserRoundCog size={16} color="#d3bfa2"/> :
       activeTab==='inventory'   ? <Layers size={16} color="#d3bfa2"/> :
       activeTab==='extras'      ? <ShoppingBag size={16} color="#d3bfa2"/> :
       activeTab==='recipes'     ? <ChefHat size={16} color="#d3bfa2"/> :
       activeTab==='customers'   ? <Users size={16} color="#d3bfa2"/> :
       activeTab==='marketing'   ? <Megaphone size={16} color="#d3bfa2"/> :
       activeTab==='feedback'    ? <MessageCircle size={16} color="#d3bfa2"/> :
       <BarChart3 size={16} color="#d3bfa2"/>}
    </div>
    <div>
      <h1 style={{...styles.pageTitle,fontSize:'0.95rem',margin:0,letterSpacing:'2px',lineHeight:1}} className="p-page-title">
        {activeTab==='pending'?'LIVE KITCHEN':
         activeTab==='billing'?'BILLING HUB':
         activeTab==='menu'?'MENU EDITOR':
         activeTab==='insights'?'INSIGHTS':
         activeTab==='intelligence'?'AI INTELLIGENCE':
         activeTab==='assist'?'OPERATOR ASSIST':
         activeTab==='audit'?'AUDIT LOG':
         activeTab==='management'?'MANAGEMENT':
         activeTab==='inventory'?'INVENTORY':
         activeTab==='extras'?'EXTRA ITEMS':
         activeTab==='recipes'?'RECIPES':
         activeTab==='customers'?'CUSTOMERS':
         activeTab==='marketing'?'MARKETING':
         activeTab==='feedback'?'FEEDBACK':
         activeTab.replace('_',' ').toUpperCase()}
      </h1>
      <div style={{fontSize:'0.5rem',color:'#2a2a2a',fontWeight:'700',marginTop:'3px',letterSpacing:'0.5px'}}>
        {activeTab==='pending'?'Live orders · KDS · Table floor':
         activeTab==='billing'?'Settle bills · Invoices · Payment breakdown':
         activeTab==='menu'?'Dish catalog · Availability · Pricing':
         activeTab==='insights'?'Revenue · Analytics · Trends':
         activeTab==='intelligence'?'AI recommendations · Business intelligence':
         activeTab==='assist'?'Ask anything about your restaurant data':
         activeTab==='audit'?'Order history · Settlement log':
         activeTab==='management'?'Staff roster · Attendance · Payroll':
         activeTab==='inventory'?'Stock levels · Procurement · Wastage':
         activeTab==='extras'?'Beverages · Snacks · Retail catalog':
         activeTab==='recipes'?'Recipe costing · Ingredient mapping':
         activeTab==='customers'?'CRM · Segments · Visit history':
         activeTab==='marketing'?'Announcements · Offers · Campaigns':
         activeTab==='feedback'?'Customer reviews · NPS · Ratings':
         ''}
      </div>
    </div>
  </div>
 
  {/* ── BILLING header controls ── */}
  {activeTab==='billing' && (
    <>
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
        style={styles.hudCountersRow} className="p-hud">
        {[
          {label:(()=>{const istNow=new Date(new Date().getTime()+330*60*1000);const isCurrentMonth=viewDate.getFullYear()===istNow.getFullYear()&&viewDate.getMonth()===istNow.getMonth();return isCurrentMonth?"TODAY'S BILLS":"MONTH BILLS";})(),val:hudLiveCounterBreakdown.total,color:'#d3bfa2'},
          {label:'DINE-IN',  val:hudLiveCounterBreakdown.direct},
          {label:'TAKEAWAY', val:hudLiveCounterBreakdown.takeaway},
          {label:'ONLINE',   val:hudLiveCounterBreakdown.online},
        ].map((s,i)=>(
          <div key={i} style={{...styles.hudStatBox,borderLeft:i>0?'1px solid #1c1f26':'none'}}>
            <small style={{...styles.hudStatLabel,color:i===0?'#bda88a':undefined}}>{s.label}</small>
            <div style={{...styles.hudStatValue,color:s.color||'#fff'}} className="mono">
              {typeof s.val==='number'?(s.val<10?`0${s.val}`:s.val):s.val}
            </div>
          </div>
        ))}
      </motion.div>
      <button onClick={downloadAllTodaysInvoices} disabled={isDownloadingAllBills} style={{
        marginLeft:'10px',padding:'9px 16px',
        background:isDownloadingAllBills?'#0d0d0d':'linear-gradient(135deg,#d3bfa2,#bda88a)',
        border:'none',color:isDownloadingAllBills?'#444':'#000',
        borderRadius:'8px',fontSize:'0.6rem',fontWeight:'900',
        cursor:isDownloadingAllBills?'not-allowed':'pointer',
        display:'flex',alignItems:'center',gap:'6px',flexShrink:0
      }}>
        <FileText size={13}/>
        {isDownloadingAllBills?'GENERATING…':"DOWNLOAD INVOICES"}
      </button>
    </>
  )}
 
  {/* ── INSIGHTS header controls ── */}
  {activeTab==='insights' && (
    <div style={{display:'flex',alignItems:'center',gap:'10px',marginLeft:'auto'}} className="p-insights-header">
      <div style={{...styles.headerMonthSelector,borderRadius:'9px',padding:'5px 12px'}}>
        <button onClick={()=>changeMonth(-1)} style={styles.headerMonthNav}><ChevronLeft size={14}/></button>
        <div style={{...styles.headerMonthDisplay,gap:'6px'}}>
          <Calendar size={12} color="#8a704d"/>
          <span style={{fontWeight:'900',fontSize:'0.78rem',color:'#d3bfa2'}}>
            {viewDate.toLocaleString('default',{month:'short',year:'numeric'}).toUpperCase()}
          </span>
        </div>
        <button onClick={()=>changeMonth(1)} style={styles.headerMonthNav}><ChevronRight size={14}/></button>
      </div>
      {['daily','weekly','monthly','annual'].map(p=>(
        <button key={p} onClick={()=>exportToExcel(p)} className="p-xls-btn"
          style={{padding:'7px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#444',borderRadius:'8px',fontSize:'0.58rem',fontWeight:'900',cursor:'pointer',transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(211,191,162,0.2)';e.currentTarget.style.color='#d3bfa2';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a1a';e.currentTarget.style.color='#444';}}>
          {p.toUpperCase()} XLS
        </button>
      ))}
    </div>
  )}
 
  {/* ── INVENTORY header controls ── */}
  {activeTab==='inventory' && (
    <div style={{marginLeft:'auto',display:'flex',gap:'8px',alignItems:'center'}}>
      <button onClick={()=>exportToExcel('inventory')}
        style={{padding:'9px 16px',background:'transparent',border:'1px solid rgba(211,191,162,0.2)',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.62rem',fontWeight:'900',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',transition:'all 0.15s'}}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(211,191,162,0.07)';}}
        onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
        <FileText size={13}/> EXPORT XLS
      </button>
    </div>
  )}
 
  {/* ── MANAGEMENT header controls ── */}
  {activeTab==='management' && (
    <div style={{marginLeft:'auto',display:'flex',gap:'8px',alignItems:'center'}}>
      <div style={{...styles.headerMonthSelector,borderRadius:'9px',padding:'5px 12px'}}>
        <button onClick={()=>changeMonth(-1)} style={styles.headerMonthNav}><ChevronLeft size={14}/></button>
        <span style={{fontSize:'0.72rem',fontWeight:'900',color:'#d3bfa2',minWidth:'80px',textAlign:'center'}}>
          {viewDate.toLocaleString('default',{month:'short',year:'numeric'}).toUpperCase()}
        </span>
        <button onClick={()=>changeMonth(1)} style={styles.headerMonthNav}><ChevronRight size={14}/></button>
      </div>
    </div>
  )}
 
  {/* ── EXTRAS header controls ── */}
  {activeTab==='extras' && (
    <div style={{marginLeft:'auto',display:'flex',gap:'10px',alignItems:'center'}} className="p-extras-kpi">
      {[
        {l:'TOTAL',v:extraItems.length,c:'#d3bfa2'},
        {l:'AVAILABLE',v:extraItems.filter(i=>i.isAvailable).length,c:'#4ade80'},
        {l:'STOCK VALUE',v:`₹${extraItems.reduce((a,i)=>a+Math.round(i.currentStock*i.price),0).toLocaleString()}`,c:'#d3bfa2'},
      ].map((s,i)=>(
        <div key={i} style={{
          textAlign:'center',padding:'8px 16px',
          background:'rgba(211,191,162,0.04)',
          border:'1px solid rgba(211,191,162,0.1)',borderRadius:'9px'
        }}>
          <div style={{fontSize:'1.05rem',fontWeight:'900',color:s.c,fontFamily:'monospace'}}>{s.v}</div>
          <div style={{fontSize:'0.46rem',color:'#333',fontWeight:'900',marginTop:'2px',letterSpacing:'0.8px'}}>{s.l}</div>
        </div>
      ))}
    </div>
  )}
 
  {/* ── MENU header controls ── */}
  {activeTab==='menu' && (
    <div style={{display:'flex',alignItems:'center',gap:'10px',marginLeft:'auto'}} className="p-menu-header-actions">
      <div style={{display:'flex',background:'#000',border:'1px solid #1a1a1a',borderRadius:'9px',padding:'3px',gap:'3px'}}>
        {[{val:'all',label:'ALL'},{val:'veg',label:'VEG'},{val:'nonveg',label:'NON-VEG'}].map(f=>(
          <button key={f.val} onClick={()=>setMenuVegFilter(f.val)} style={{
            padding:'6px 12px',border:'none',borderRadius:'6px',cursor:'pointer',
            fontSize:'0.6rem',fontWeight:'900',transition:'all 0.15s',
            background:menuVegFilter===f.val?'#d3bfa2':'transparent',
            color:menuVegFilter===f.val?'#000':'#444'
          }}>
            {f.val==='veg'&&<span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}><span style={{width:'7px',height:'7px',borderRadius:'50%',background:menuVegFilter==='veg'?'#4a7c3f':'#555',display:'inline-block'}}/>VEG</span>}
            {f.val==='nonveg'&&<span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}><span style={{width:0,height:0,borderLeft:'3px solid transparent',borderRight:'3px solid transparent',borderBottom:`6px solid ${menuVegFilter==='nonveg'?'#8a3030':'#555'}`,display:'inline-block'}}/>NON-VEG</span>}
            {f.val==='all'&&'ALL'}
          </button>
        ))}
      </div>
      <button onClick={async()=>{try{await axios.post(`${BASE_URL}/admin/recalculate-bestsellers/${tenantId}`);await fetchInitialData();showNotif('Bestsellers recalculated');}catch{showNotif('Failed','error');}}}
        style={{display:'flex',alignItems:'center',gap:'5px',padding:'7px 13px',borderRadius:'8px',cursor:'pointer',background:'rgba(211,191,162,0.06)',border:'1px solid rgba(211,191,162,0.15)',color:'#d3bfa2',fontSize:'0.58rem',fontWeight:'900',outline:'none',fontFamily:'inherit',transition:'all 0.15s'}}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(211,191,162,0.12)';}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(211,191,162,0.06)';}}>
        <Tag size={11}/> REFRESH BESTSELLERS
      </button>
      {tenantConfig&&(
        <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',background:'#000',border:`1px solid ${tenantConfig.config?.autoHideDishesOnLowStock?'rgba(211,191,162,0.22)':'#1a1a1a'}`,borderRadius:'9px',transition:'all 0.2s'}} className="p-autohide-toggle">
          <Layers size={12} color={tenantConfig.config?.autoHideDishesOnLowStock?'#d3bfa2':'#333'}/>
          <span style={{fontSize:'0.58rem',fontWeight:'900',color:tenantConfig.config?.autoHideDishesOnLowStock?'#d3bfa2':'#333'}} className="p-autohide-label">AUTO-HIDE</span>
          <button type="button" onClick={async()=>{const nv=!tenantConfig.config?.autoHideDishesOnLowStock;await axios.patch(`${BASE_URL}/tenant/config/${tenantId}`,{key:'autoHideDishesOnLowStock',value:nv});setTenantConfig(p=>({...p,config:{...p.config,autoHideDishesOnLowStock:nv}}));showNotif(`Auto-hide ${nv?'enabled':'disabled'}`);}}
            style={{width:'36px',height:'19px',borderRadius:'10px',border:'none',cursor:'pointer',position:'relative',flexShrink:0,transition:'background 0.2s',background:tenantConfig.config?.autoHideDishesOnLowStock?'#d3bfa2':'#1a1a1a'}}>
            <div style={{position:'absolute',top:'3px',left:tenantConfig.config?.autoHideDishesOnLowStock?'19px':'3px',width:'13px',height:'13px',borderRadius:'50%',background:tenantConfig.config?.autoHideDishesOnLowStock?'#0c0c0c':'#444',transition:'left 0.2s'}}/>
          </button>
        </div>
      )}
    </div>
  )}
 
  {/* ── MARKETING header controls ── */}
  {activeTab==='marketing' && (
    <div style={{marginLeft:'auto',display:'flex',gap:'8px',alignItems:'center'}}>
      {announcements.some(a=>a.isActive&&new Date(a.expiresAt)>new Date())&&(
        <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'20px',background:'rgba(74,222,128,0.05)',border:'1px solid rgba(74,222,128,0.18)'}}>
          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 6px rgba(74,222,128,0.5)',animation:'moodPulse 2s ease-in-out infinite'}}/>
          <span style={{fontSize:'0.55rem',color:'#4ade80',fontWeight:'900',letterSpacing:'1px'}}>BANNER LIVE</span>
        </div>
      )}
      {/* Sub-tab pills */}
      {['announcements','offers','campaigns'].map(st=>(
        <button key={st} onClick={()=>setMarketingSubTab(st)}
          style={{
            padding:'7px 14px',borderRadius:'8px',cursor:'pointer',
            fontSize:'0.6rem',fontWeight:'900',letterSpacing:'0.5px',
            border:marketingSubTab===st?'none':'1px solid #1a1a1a',
            background:marketingSubTab===st?'linear-gradient(135deg,#d3bfa2,#bda88a)':'#0d0d0d',
            color:marketingSubTab===st?'#000':'#333',
            transition:'all 0.15s',textTransform:'uppercase'
          }}>
          {st==='announcements'?'Menu Banners':st==='offers'?'Offers':st==='campaigns'?'Campaigns':''}
        </button>
      ))}
    </div>
  )}
 
</header>
  
{ingredientAlerts.filter(a => !a.dismissed).length > 0 && (
    <div style={{
        display: 'flex', flexDirection: 'column', gap: '8px',
        marginBottom: '20px', position: 'relative', zIndex: 50
    }}>
        {ingredientAlerts.filter(a => !a.dismissed).map(alert => (
            <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                style={{
                    background: '#0d0a07',
                    border: '1px solid rgba(186,117,23,0.5)',
                    borderLeft: '4px solid #BA7517',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    boxShadow: '0 4px 24px rgba(186,117,23,0.12)',
                }}
            >
                {/* Icon */}
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(186,117,23,0.15)', border: '1px solid rgba(186,117,23,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <AlertTriangle size={17} color="#BA7517"/>
                </div>
 
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Headline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '900', color: '#fff', fontSize: '0.88rem' }}>
                            {alert.ingredientName} ran out
                        </span>
                        <span style={{
                            fontSize: '0.52rem', fontWeight: '900', padding: '2px 8px', borderRadius: '20px',
                            background: 'rgba(186,117,23,0.15)', color: '#BA7517',
                            border: '1px solid rgba(186,117,23,0.3)', letterSpacing: '0.8px'
                        }}>
                            {alert.dishCount} {alert.dishCount === 1 ? 'DISH' : 'DISHES'} {alert.autoHidden ? 'AUTO-HIDDEN' : 'AFFECTED'}
                        </span>
                    </div>
 
                    {/* Summary line */}
                    <div style={{ fontSize: '0.78rem', color: '#8a8f9f', marginBottom: '8px', lineHeight: 1.4 }}>
                        {alert.autoHidden ? (
                            <>
                                <span style={{ color: '#d3bfa2' }}>{alert.affectedDishes.join(', ')}</span>
                                {' '}— removed from customer menu automatically.
                            </>
                        ) : (
                            <>
                                Linked to{' '}
                                <span style={{ color: '#d3bfa2' }}>{alert.affectedDishes.join(', ')}</span>
                                {' '}— still visible on menu (auto-hide is off).
                            </>
                        )}
                    </div>
 
                    {/* Dish chips */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {alert.affectedDishes.map((dish, i) => (
                            <span key={i} style={{
                                fontSize: '0.62rem', fontWeight: '700',
                                padding: '3px 9px', borderRadius: '5px',
                                background: 'rgba(186,117,23,0.08)',
                                border: '1px solid rgba(186,117,23,0.2)',
                                color: '#8a704d'
                            }}>
                                {dish}
                            </span>
                        ))}
                    </div>
 
                    {/* Action hints */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Restock shortcut */}
                        <button
                            onClick={() => {
                                // Jump to inventory tab and pre-fill the item name
                                setActiveTab('inventory');
                                setNewInventoryItem(p => ({ ...p, itemName: alert.ingredientName }));
                                // Pre-select the existing item for restock
                                const existing = inventory.find(i =>
                                    i.itemName.toLowerCase() === alert.ingredientName.toLowerCase()
                                );
                                if (existing) setSelectedExistingItem(existing);
                                setIngredientAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a));
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '5px 12px', borderRadius: '6px',
                                background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.2)',
                                color: '#d3bfa2', cursor: 'pointer',
                                fontSize: '0.62rem', fontWeight: '900', letterSpacing: '0.5px'
                            }}
                        >
                            <Package size={10}/> RESTOCK NOW
                        </button>
 
                        {/* Re-enable dishes if not auto-hidden */}
                        {!alert.autoHidden && (
                            <span style={{ fontSize: '0.6rem', color: '#444', fontStyle: 'italic' }}>
                                Dishes still showing — turn on auto-hide in Settings to hide them automatically
                            </span>
                        )}
 
                        {/* Time */}
                        <span style={{ fontSize: '0.58rem', color: '#333', marginLeft: 'auto' }}>
                            {new Date(alert.alertAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
 
                {/* Dismiss */}
                <button
                    onClick={() => setIngredientAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a))}
                    style={{
                        background: 'transparent', border: 'none', color: '#444',
                        cursor: 'pointer', padding: '2px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Dismiss alert"
                >
                    <X size={14}/>
                </button>
            </motion.div>
        ))}
    </div>
)}

        {/* ════════════════════════════════════════════════
            SCROLL AREA — all tab content lives here, 
            NOT inside any modal/AnimatePresence wrapper
            ════════════════════════════════════════════════ */}
        <section style={styles.scrollArea} className="custom-scroll">

{activeTab === 'pending' && (
  
// ═══════════════════════════════════════════════════════════════════════
// PENDING TAB — COMPLETE UI ENHANCEMENT
// Replace the entire block from:
//   <motion.div key="pending" ...>
// to the closing:
//   </motion.div>  (before {/* ── MENU ── */})
//
// ALL logic, state, handlers, API calls unchanged.
// Only JSX and style improvements.
// ═══════════════════════════════════════════════════════════════════════

<motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
  style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>

  {/* ══════════════════════════════════════════════════
      ROW 1 — KITCHEN TICKETS + SERVICE CALLS
  ══════════════════════════════════════════════════ */}
  <div style={{
    display: 'grid', gridTemplateColumns: '1.4fr 1px 1fr',
    background: '#080809', borderRadius: '18px',
    border: '1px solid rgba(211,191,162,0.07)', overflow: 'hidden'
  }} className="p-kds-row">

    {/* ── KITCHEN TICKETS ── */}
    <div style={{ display: 'flex', flexDirection: 'column', padding: '18px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexShrink: 0 }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChefHat size={13} color="#d3bfa2" />
        </div>
        <span style={{ fontSize: '0.58rem', fontWeight: '900', color: '#666', letterSpacing: '2.5px', textTransform: 'uppercase', flex: 1 }}>Kitchen Tickets</span>
        <div style={{
          fontSize: '0.6rem', fontWeight: '900', minWidth: '24px', height: '24px',
          borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: filteredOrders.length > 0 ? 'rgba(211,191,162,0.1)' : '#0d0d0d',
          color: filteredOrders.length > 0 ? '#d3bfa2' : '#222',
          border: filteredOrders.length > 0 ? '1px solid rgba(211,191,162,0.2)' : '1px solid #141414',
          fontFamily: 'monospace'
        }}>
          {filteredOrders.length}
        </div>
      </div>

      {/* Ticket list */}
      <div style={{ overflowY: 'auto', maxHeight: '340px', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }} className="custom-scroll kds-scroll">
        {filteredOrders.length > 0 ? filteredOrders.map(order => {
          const mins = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
          const tier = mins >= 20 ? 'over' : mins >= 10 ? 'warn' : 'ok';
          const accentColor = tier === 'over' ? 'rgba(211,191,162,0.7)' : tier === 'warn' ? 'rgba(138,112,77,0.5)' : 'rgba(211,191,162,0.12)';

          // Source label
          const SRC = {
            swiggy: { label: 'SWIGGY', color: '#fc8019', bg: 'rgba(252,128,25,0.1)', border: 'rgba(252,128,25,0.25)' },
            zomato: { label: 'ZOMATO', color: '#cb202d', bg: 'rgba(203,32,45,0.1)', border: 'rgba(203,32,45,0.25)' },
            waitlist: { label: 'WAITLIST', color: '#8a704d', bg: 'rgba(138,112,77,0.08)', border: 'rgba(138,112,77,0.2)' },
            reservation: { label: 'RESV', color: '#8a704d', bg: 'rgba(138,112,77,0.08)', border: 'rgba(138,112,77,0.2)' },
            'counter-pickup': { label: 'PICKUP', color: '#bda88a', bg: 'rgba(189,168,138,0.08)', border: 'rgba(189,168,138,0.2)' },
            takeaway: { label: 'PARCEL', color: '#bda88a', bg: 'rgba(189,168,138,0.08)', border: 'rgba(189,168,138,0.2)' },
          };
          const srcMeta = SRC[order.source];

          const isParcel = order.source === 'counter-pickup' || order.source === 'takeaway' || order.tableNumber?.toLowerCase() === 'takeaway';
          const tableLabel = isParcel ? 'PRCEL' : (order.source === 'swiggy' || order.source === 'zomato') ? order.source.slice(0,3).toUpperCase() : `T${order.tableNumber}`;

          const items = (order.items || []).filter(i => !i.isExtraItem && i.extraItemId == null);

          return (
            <div key={order._id} style={{
              display: 'flex', alignItems: 'stretch', gap: '0',
              background: tier === 'over' ? 'rgba(211,191,162,0.025)' : '#0a0a0a',
              borderRadius: '11px',
              border: `1px solid ${tier === 'over' ? 'rgba(211,191,162,0.14)' : '#111'}`,
              overflow: 'hidden', flexShrink: 0,
              transition: 'border-color 0.2s'
            }}>
              {/* Left accent bar */}
              <div style={{ width: '3px', background: accentColor, flexShrink: 0 }} />

              {/* Table badge */}
              <div style={{
                width: '44px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#070709', borderRight: '1px solid #111',
                fontFamily: 'monospace', fontWeight: '900',
                fontSize: tableLabel.length > 3 ? '0.52rem' : '0.78rem',
                color: tier === 'over' ? '#d3bfa2' : '#666',
                padding: '10px 4px'
              }}>
                {tableLabel}
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '10px 12px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {srcMeta && (
                    <span style={{ fontSize: '0.44rem', fontWeight: '900', padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.5px', background: srcMeta.bg, color: srcMeta.color, border: `1px solid ${srcMeta.border}`, textTransform: 'uppercase' }}>
                      {srcMeta.label}
                    </span>
                  )}
                  <span style={{ fontSize: '0.58rem', color: '#333', fontFamily: 'monospace' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ fontSize: '0.64rem', color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                  {items.map(it => `${it.quantity}× ${it.name}`).join(' · ')}
                </div>
                {items.some(it => it.suggestion?.trim()) && (
                  <div style={{ fontSize: '0.54rem', color: '#5a4a30', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {items.find(it => it.suggestion?.trim())?.suggestion}
                  </div>
                )}
              </div>

              {/* Timer */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', gap: '3px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Timer size={11} color={tier === 'over' ? '#d3bfa2' : tier === 'warn' ? '#8a704d' : '#333'} />
                  <span style={{ fontSize: '0.72rem', fontWeight: '900', color: tier === 'over' ? '#d3bfa2' : tier === 'warn' ? '#8a704d' : '#333', fontFamily: 'monospace' }}>{mins}m</span>
                </div>
                {tier !== 'ok' && (
                  <span style={{ fontSize: '0.42rem', fontWeight: '900', letterSpacing: '0.8px', color: tier === 'over' ? 'rgba(211,191,162,0.5)' : 'rgba(138,112,77,0.5)', textTransform: 'uppercase' }}>
                    {tier === 'over' ? 'OVERDUE' : 'DELAYED'}
                  </span>
                )}
              </div>
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', padding: '44px 20px', background: '#050506', borderRadius: '12px', border: '1px dashed rgba(211,191,162,0.06)' }}>
            <ChefHat size={22} color="#1a1a1a" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '0.62rem', color: '#222', fontWeight: '700', letterSpacing: '0.5px' }}>Kitchen is clear</div>
          </div>
        )}
      </div>
    </div>

    {/* ── DIVIDER ── */}
    <div style={{ background: 'linear-gradient(180deg,transparent,rgba(211,191,162,0.07) 20%,rgba(211,191,162,0.07) 80%,transparent)', width: '1px' }} className="p-service-divider" />

    {/* ── SERVICE CALLS ── */}
    <div style={{ display: 'flex', flexDirection: 'column', padding: '18px 20px' }} className="p-service-col">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexShrink: 0 }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: waiterRequests.length > 0 ? 'rgba(211,191,162,0.06)' : 'rgba(255,255,255,0.02)', border: waiterRequests.length > 0 ? '1px solid rgba(211,191,162,0.15)' : '1px solid #151515', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BellRing size={13} color={waiterRequests.length > 0 ? '#d3bfa2' : '#1e1e1e'} />
        </div>
        <span style={{ fontSize: '0.58rem', fontWeight: '900', color: waiterRequests.length > 0 ? '#666' : '#1e1e1e', letterSpacing: '2.5px', textTransform: 'uppercase', flex: 1 }}>Service Calls</span>
        {waiterRequests.length > 0 && (
          <div style={{ fontSize: '0.6rem', fontWeight: '900', minWidth: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(211,191,162,0.1)', color: '#d3bfa2', border: '1px solid rgba(211,191,162,0.2)', fontFamily: 'monospace' }}>
            {waiterRequests.length}
          </div>
        )}
      </div>

      <div style={{ overflowY: 'auto', maxHeight: '340px', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }} className="custom-scroll">
        {waiterRequests.length > 0 ? [...waiterRequests].reverse().map(req => (
          <motion.div initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={req._id}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0a0a0a', padding: '11px 13px', borderRadius: '11px', border: '1px solid rgba(211,191,162,0.08)', borderLeft: '3px solid rgba(211,191,162,0.25)', flexShrink: 0 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BellRing size={11} color="#8a704d" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '900', color: '#d3bfa2', fontSize: '0.7rem', marginBottom: '2px', fontFamily: 'monospace' }}>T-{req.tableNumber}</div>
              <div style={{ fontSize: '0.6rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.serviceRequest}</div>
            </div>
            <button onClick={() => completeWaiterRequest(req._id)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(211,191,162,0.15)', color: '#8a704d', borderRadius: '7px', fontSize: '0.52rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px', flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(211,191,162,0.08)'; e.currentTarget.style.color = '#d3bfa2'; e.currentTarget.style.borderColor = 'rgba(211,191,162,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8a704d'; e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; }}>
              DONE
            </button>
          </motion.div>
        )) : (
          <div style={{ textAlign: 'center', padding: '44px 20px', background: '#050506', borderRadius: '12px', border: '1px dashed rgba(211,191,162,0.06)' }}>
            <BellRing size={20} color="#1a1a1a" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.6rem', color: '#1e1e1e', fontWeight: '700', letterSpacing: '0.5px' }}>No pending calls</div>
          </div>
        )}
      </div>
    </div>
  </div>


  {/* ══════════════════════════════════════════════════
      ROW 2 — COUNTER QUEUE PANEL
  ══════════════════════════════════════════════════ */}
  <div style={{ background: '#080809', borderRadius: '18px', border: '1px solid rgba(211,191,162,0.07)', overflow: 'hidden' }}>

    {/* Panel header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(211,191,162,0.05)', background: '#0a0a0c' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={14} color="#d3bfa2" />
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '1px' }}>COUNTER QUEUE</div>
          <div style={{ fontSize: '0.52rem', color: '#2a2a2a', fontWeight: '700', marginTop: '2px', letterSpacing: '0.5px' }}>Waitlist · Pickup · Reservations</div>
        </div>
        {/* Queue count chips */}
        <div style={{ display: 'flex', gap: '5px', marginLeft: '4px' }}>
          {[
            { icon: <UserCheck size={9} />, count: waitlistEntries.length, label: 'waiting' },
            { icon: <ShoppingBag size={9} />, count: pickupEntries.length, label: 'pickup' },
            { icon: <CalendarClock size={9} />, count: reservationEntries.filter(r => r.status === 'pending').length, label: 'pending' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 9px', background: s.count > 0 ? 'rgba(211,191,162,0.05)' : '#0d0d0d', border: s.count > 0 ? '1px solid rgba(211,191,162,0.12)' : '1px solid #141414', borderRadius: '20px' }}>
              <span style={{ color: s.count > 0 ? '#8a704d' : '#1e1e1e' }}>{s.icon}</span>
              <span style={{ fontSize: '0.52rem', fontWeight: '900', color: s.count > 0 ? '#8a704d' : '#1e1e1e', fontFamily: 'monospace' }}>{s.count} {s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {avgWaitData && (
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { label: 'AVG WAIT', val: `${avgWaitData.avgWait || 0}m`, icon: <Clock3 size={9} color="#2a2a2a" /> },
              { label: 'TABLES', val: `${avgWaitData.tablesOccupied}/${avgWaitData.totalTables}`, icon: <CircleDot size={9} color="#2a2a2a" /> },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginBottom: '2px' }}>
                  {s.icon}
                  <span style={{ fontSize: '0.44rem', color: '#2a2a2a', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#555', fontFamily: 'monospace' }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}
        <button onClick={fetchCounterQueue} style={{ width: '28px', height: '28px', background: 'transparent', border: '1px solid #1a1a1a', color: '#333', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#d3bfa2'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#333'; }}>
          <RefreshCw size={12} />
        </button>
      </div>
    </div>

    {/* Tab bar + Search */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', background: '#080809', borderBottom: '1px solid rgba(211,191,162,0.04)' }}>
      <div style={{ display: 'flex' }}>
        {[
          { id: 'waitlist',     label: 'DINE-IN',      icon: <UserCheck size={11} />,    count: waitlistEntries.length },
          { id: 'pickup',       label: 'PICKUP',        icon: <ShoppingBag size={11} />,  count: pickupEntries.length },
          { id: 'reservations', label: 'RESERVATIONS',  icon: <CalendarClock size={11} />, count: reservationEntries.filter(r => r.status === 'pending').length },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setQueueTab(tab.id); setQueueSearch(''); }} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '12px 14px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: '0.56rem', fontWeight: '900', letterSpacing: '1px',
            color: queueTab === tab.id ? '#d3bfa2' : '#2a2a2a',
            borderBottom: `2px solid ${queueTab === tab.id ? 'rgba(211,191,162,0.5)' : 'transparent'}`,
            transition: 'all 0.15s', marginBottom: '-1px'
          }}>
            <span style={{ color: queueTab === tab.id ? '#8a704d' : '#1a1a1a' }}>{tab.icon}</span>
            {tab.label}
            <span style={{ fontSize: '0.48rem', padding: '1px 5px', borderRadius: '8px', fontWeight: '900', fontFamily: 'monospace', background: tab.count > 0 ? (queueTab === tab.id ? 'rgba(211,191,162,0.1)' : 'rgba(211,191,162,0.03)') : '#0d0d0d', color: tab.count > 0 ? (queueTab === tab.id ? '#d3bfa2' : '#333') : '#1a1a1a', border: tab.count > 0 ? '1px solid rgba(211,191,162,0.08)' : '1px solid #111' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#040405', border: '1px solid #141414', borderRadius: '8px', padding: '6px 11px', margin: '7px 0' }}>
        <Search size={10} color="#2a2a2a" />
        <input type="text" placeholder="Search name..." value={queueSearch} onChange={e => setQueueSearch(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: '#c8c0b0', outline: 'none', fontSize: '0.64rem', width: '130px' }} />
        {queueSearch && (
          <button onClick={() => setQueueSearch('')} style={{ background: 'transparent', border: 'none', color: '#2a2a2a', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={10} />
          </button>
        )}
      </div>
    </div>

    {/* Queue content */}
    <div style={{ padding: '16px 20px 20px' }}>

      {/* ══ DINE-IN WAITLIST ══ */}
      {queueTab === 'waitlist' && (() => {
        const filtered = waitlistEntries.filter(e => !queueSearch || e.customerName?.toLowerCase().includes(queueSearch.toLowerCase()));
        return filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: '#0a0a0a', border: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <UserCheck size={18} color="#1a1a1a" />
            </div>
            <div style={{ fontSize: '0.68rem', color: '#1e1e1e', fontWeight: '700', letterSpacing: '0.3px' }}>
              {queueSearch ? `No results for "${queueSearch}"` : 'No one in the waitlist'}
            </div>
            <div style={{ fontSize: '0.56rem', color: '#141414', marginTop: '5px' }}>
              {!queueSearch && 'Customers joining from the counter page appear here'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }} className="p-queue-grid">
            {filtered.map(entry => {
              const waitMins = Math.floor((Date.now() - new Date(entry.createdAt)) / 60000);
              const urgency = waitMins > 60 ? 'critical' : waitMins > 30 ? 'high' : waitMins > 15 ? 'medium' : 'low';
              const accentTop = { critical: 'rgba(211,191,162,0.55)', high: 'rgba(138,112,77,0.45)', medium: 'rgba(106,90,58,0.3)', low: 'rgba(211,191,162,0.08)' }[urgency];
              const accentText = { critical: '#d3bfa2', high: '#8a704d', medium: '#6a5a3a', low: '#3a3228' }[urgency];

              return (
                <div key={entry._id} style={{ background: '#0a0a0c', borderRadius: '14px', border: `1px solid ${urgency === 'critical' ? 'rgba(211,191,162,0.12)' : '#101010'}`, borderTop: `2px solid ${accentTop}`, overflow: 'hidden' }}>

                  {/* Card header */}
                  <div style={{ padding: '13px 15px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Position badge */}
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(211,191,162,0.04)', border: `1px solid ${accentTop}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: '900', color: accentText, fontFamily: 'monospace' }}>#{entry.waitlistPosition}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '0.84rem', color: '#e8e0d0', letterSpacing: '0.2px' }}>{entry.customerName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <Users size={9} color="#333" />
                          <span style={{ fontSize: '0.56rem', color: '#444', fontWeight: '700', fontFamily: 'monospace' }}>{entry.partySize} pax</span>
                          {entry.customerPhone && <span style={{ fontSize: '0.54rem', color: '#2a2a2a', fontFamily: 'monospace' }}>{entry.customerPhone}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Wait timer pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '7px', background: urgency === 'critical' ? 'rgba(211,191,162,0.06)' : '#0d0d0d', border: `1px solid ${urgency !== 'low' ? accentTop : '#111'}`, flexShrink: 0 }}>
                      <Hourglass size={9} color={accentText} />
                      <span style={{ fontSize: '0.66rem', fontWeight: '900', color: accentText, fontFamily: 'monospace' }}>{formatDuration(waitMins)}</span>
                    </div>
                  </div>

                  {/* Pre-order items */}
                  {entry.items?.length > 0 && (
                    <div style={{ margin: '0 15px 10px', padding: '8px 10px', background: '#060608', borderRadius: '9px', border: '1px solid rgba(211,191,162,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <UtensilsCrossed size={8} color="#2a2a2a" />
                        <span style={{ fontSize: '0.46rem', color: '#2a2a2a', fontWeight: '900', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Pre-order</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: '900', color: '#8a704d', fontFamily: 'monospace' }}>₹{entry.totalAmount?.toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.61rem', color: '#555', lineHeight: 1.55 }}>
                        {entry.items.slice(0, 3).map(it => `${it.quantity}× ${it.name}`).join(' · ')}
                        {entry.items.length > 3 && <span style={{ color: '#2a2a2a' }}> +{entry.items.length - 3}</span>}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ padding: '0 15px 14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setAssignTableModal(entry)} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#d3bfa2,#bda88a)', color: '#000', fontWeight: '900', fontSize: '0.58rem', cursor: 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <TableProperties size={11} /> ASSIGN TABLE
                      </button>
                      <button onClick={() => setConfirmModal({ show: true, title: `No-Show — ${entry.customerName}?`, subtitle: `Mark as no-show and remove from queue.`, onConfirm: async () => { await axios.patch(`${BASE_URL}/waitlist/${entry._id}`, { status: 'no-show' }); fetchCounterQueue(); showNotif(`${entry.customerName} — marked no-show`); } })}
                        style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'transparent', border: '1px solid #1a1a1a', color: '#2a2a2a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.2)'; e.currentTarget.style.color = '#8a704d'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#2a2a2a'; }}>
                        <UserX size={12} />
                      </button>
                    </div>
                    {/* Re-notify */}
                    <button onClick={async () => { try { await axios.post(`${BASE_URL}/waitlist/${entry._id}/notify`, { title: 'Almost ready!', body: `Hi ${entry.customerName}! Your table will be ready soon. Please stay nearby.` }); showNotif(`${entry.customerName} — notified`); } catch { showNotif('Notification failed', 'error'); } }}
                      style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid rgba(211,191,162,0.07)', color: '#2a2a2a', borderRadius: '8px', fontSize: '0.54rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.2)'; e.currentTarget.style.color = '#8a704d'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.07)'; e.currentTarget.style.color = '#2a2a2a'; }}>
                      <BellRing size={10} /> NOTIFY CUSTOMER
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ══ PICKUP QUEUE ══ */}
      {queueTab === 'pickup' && (() => {
        const filtered = pickupEntries.filter(e => !queueSearch || e.customerName?.toLowerCase().includes(queueSearch.toLowerCase()));
        return filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: '#0a0a0a', border: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <ShoppingBag size={18} color="#1a1a1a" />
            </div>
            <div style={{ fontSize: '0.68rem', color: '#1e1e1e', fontWeight: '700' }}>
              {queueSearch ? `No results for "${queueSearch}"` : 'No pickup orders'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(entry => {
              const isKitchenFired = entry.kitchenFired;
              const isReady = entry.status === 'pickup-ready';

              // Step indicator
              const step = !isKitchenFired ? 0 : !isReady ? 1 : 2;
              const stepLabels = ['Awaiting Kitchen', 'Preparing', 'Ready for Pickup'];
              const stepColors = ['rgba(211,191,162,0.2)', 'rgba(138,112,77,0.5)', 'rgba(211,191,162,0.8)'];

              return (
                <div key={entry._id} style={{ background: '#0a0a0c', borderRadius: '14px', border: `1px solid ${isReady ? 'rgba(211,191,162,0.2)' : '#101010'}`, borderLeft: `3px solid ${stepColors[step]}`, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Customer info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ShoppingBag size={11} color="#8a704d" />
                        </div>
                        <span style={{ fontWeight: '900', fontSize: '0.84rem', color: '#e8e0d0' }}>{entry.customerName}</span>
                        {entry.customerPhone && <span style={{ fontSize: '0.56rem', color: '#333', fontFamily: 'monospace' }}>{entry.customerPhone}</span>}
                      </div>

                      {/* Items */}
                      {entry.items?.length > 0 && (
                        <div style={{ fontSize: '0.6rem', color: '#555', lineHeight: 1.55, marginBottom: '8px', paddingLeft: '34px' }}>
                          {entry.items.slice(0, 3).map(it => `${it.quantity}× ${it.name}`).join(' · ')}
                          {entry.items.length > 3 && <span style={{ color: '#2a2a2a' }}> +{entry.items.length - 3}</span>}
                        </div>
                      )}

                      {/* Step progress */}
                      <div style={{ display: 'flex', gap: '4px', paddingLeft: '34px', marginBottom: '10px' }}>
                        {stepLabels.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i <= step ? stepColors[step] : '#1a1a1a', transition: 'background 0.3s', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.44rem', fontWeight: '900', color: i === step ? '#8a704d' : i < step ? '#333' : '#1a1a1a', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s}</span>
                            {i < 2 && <div style={{ width: '12px', height: '1px', background: i < step ? 'rgba(211,191,162,0.2)' : '#111', marginLeft: '2px' }} />}
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '34px' }}>
                        {/* Step 1 — Send to Kitchen */}
                        {!isKitchenFired && (
                          <button onClick={async () => {
                            try {
                              const orderItems = (entry.items || []).map(i => ({ menuItemId: i.menuItemId || null, name: i.name, quantity: Number(i.quantity) || 1, portion: i.portion || 'Single', pricePerUnit: Number(i.price || i.pricePerUnit) || 0, subtotal: Number(i.subtotal) || 0, suggestion: '' }));
                              const itemsTotal = orderItems.reduce((a, i) => a + i.subtotal, 0);
                              await axios.post(`${BASE_URL}/orders`, { tenantId, tableNumber: 'Counter', items: orderItems, source: 'counter-pickup', sessionId: entry.sessionId, waitlistId: entry._id, status: 'pending', billDetails: { itemsTotal, grandTotal: itemsTotal } });
                              await axios.patch(`${BASE_URL}/waitlist/${entry._id}/kitchen-fired`);
                              fetchCounterQueue(); fetchInitialData();
                              showNotif(`${entry.customerName} — ticket sent to kitchen`, 'success');
                            } catch (err) { showNotif(err.response?.data?.error || 'Failed', 'error'); }
                          }} style={{ padding: '9px 14px', borderRadius: '9px', background: 'rgba(138,112,77,0.07)', border: '1px solid rgba(138,112,77,0.22)', color: '#8a704d', fontWeight: '900', fontSize: '0.6rem', cursor: 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(138,112,77,0.14)'; e.currentTarget.style.color = '#d3bfa2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(138,112,77,0.07)'; e.currentTarget.style.color = '#8a704d'; }}>
                            <ChefHat size={12} /> SEND TO KITCHEN
                          </button>
                        )}
                        {/* Step 2 — Mark ready */}
                        {isKitchenFired && !isReady && (
                          <button onClick={async () => { await axios.patch(`${BASE_URL}/waitlist/${entry._id}/pickup-ready`); fetchCounterQueue(); showNotif(`${entry.customerName} — customer notified, pickup ready`); }}
                            style={{ padding: '9px 14px', borderRadius: '9px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.18)', color: '#d3bfa2', fontWeight: '900', fontSize: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(211,191,162,0.12)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(211,191,162,0.06)'; }}>
                            <PackageCheck size={12} /> MARK READY — NOTIFY CUSTOMER
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount + settle */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.46rem', color: '#2a2a2a', fontWeight: '900', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '3px' }}>AMOUNT</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace' }}>₹{entry.totalAmount?.toLocaleString()}</div>
                      </div>
                      <button onClick={() => {
  setPickupPaymentMethod('cash');
  setPickupPaymentModal(entry);
}}
                        disabled={!isKitchenFired}
                        style={{ padding: '8px 14px', borderRadius: '9px', background: isReady ? 'linear-gradient(135deg,#d3bfa2,#bda88a)' : isKitchenFired ? 'rgba(211,191,162,0.05)' : '#0d0d0d', border: isReady ? 'none' : isKitchenFired ? '1px solid rgba(211,191,162,0.15)' : '1px solid #111', color: isReady ? '#000' : isKitchenFired ? '#8a704d' : '#1e1e1e', fontWeight: '900', fontSize: '0.58rem', cursor: isKitchenFired ? 'pointer' : 'not-allowed', opacity: !isKitchenFired ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
                        <Store size={11} /> SETTLE
                      </button>
                      {/* Cancel */}
                      {!['served','settled','cancelled'].includes(entry.status) && (
                        <button onClick={() => setConfirmModal({ show: true, title: `Cancel Pickup — ${entry.customerName}?`, subtitle: `This will remove the order.`, onConfirm: async () => { await axios.delete(`${BASE_URL}/waitlist/${entry._id}`); fetchCounterQueue(); showNotif(`${entry.customerName} — cancelled`); } })}
                          style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #111', color: '#1e1e1e', borderRadius: '7px', fontSize: '0.5rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; e.currentTarget.style.color = '#8a704d'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#1e1e1e'; }}>
                          <X size={9} /> CANCEL
                        </button>
                      )}
                      {isReady && (
                        <button onClick={async () => { try { await axios.post(`${BASE_URL}/waitlist/${entry._id}/notify`, { title: 'Your pickup order is ready!', body: `Hi ${entry.customerName}! Please collect your order from the counter.`, tag: 'pickup-ready-reminder' }); showNotif(`${entry.customerName} — re-notified`); } catch { showNotif('Notification failed', 'error'); } }}
                          style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(211,191,162,0.1)', color: 'rgba(211,191,162,0.4)', borderRadius: '7px', fontSize: '0.5rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#d3bfa2'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.1)'; e.currentTarget.style.color = 'rgba(211,191,162,0.4)'; }}>
                          <BellRing size={9} /> RE-NOTIFY
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

{/* ══ PICKUP PAYMENT MODAL ══ */}
{pickupPaymentModal && (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px'
  }} onClick={() => setPickupPaymentModal(null)}>
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: '#0a0a0a', border: '1px solid rgba(211,191,162,0.2)',
        borderRadius: '18px', padding: '24px', width: '100%', maxWidth: '380px'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2px', marginBottom: '4px' }}>
          SETTLE PICKUP ORDER
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#fff' }}>
          {pickupPaymentModal.customerName}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
          {pickupPaymentModal.items?.length || 0} items
        </div>
      </div>

      {/* Amount */}
      <div style={{
        padding: '14px 16px', background: 'rgba(211,191,162,0.05)',
        border: '1px solid rgba(211,191,162,0.15)', borderRadius: '12px',
        marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>AMOUNT TO COLLECT</span>
        <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace' }}>
          ₹{pickupPaymentModal.totalAmount?.toLocaleString()}
        </span>
      </div>

      {/* Payment method selector */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginBottom: '10px' }}>
          PAYMENT METHOD
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { value: 'cash', label: 'Cash',  icon: <Banknote size={14} strokeWidth={1.8} /> },
            { value: 'upi',  label: 'UPI',   icon: <Smartphone size={14} strokeWidth={1.8} /> },
            { value: 'card', label: 'Card',  icon: <CreditCard size={14} strokeWidth={1.8} /> },
          ].map(({ value, label, icon }) => {
            const active = pickupPaymentMethod === value;
            return (
              <button
                key={value}
                onClick={() => setPickupPaymentMethod(value)}
                style={{
                  padding: '12px 8px',
                  borderRadius: '10px',
                  border: `1px solid ${active ? 'rgba(211,191,162,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  background: active ? 'rgba(211,191,162,0.12)' : 'rgba(255,255,255,0.02)',
                  color: active ? '#d3bfa2' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', outline: 'none',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                {icon}
                <span style={{ fontSize: '0.58rem', fontWeight: '900', letterSpacing: '0.5px' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setPickupPaymentModal(null)}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', fontWeight: '800',
            cursor: 'pointer', outline: 'none', fontFamily: 'Poppins, sans-serif'
          }}
        >
          CANCEL
        </button>
        <button
          onClick={async () => {
            try {
              await axios.patch(
                `${BASE_URL}/waitlist/${pickupPaymentModal._id}/settle`,
                { paymentMethod: pickupPaymentMethod, finalAmount: pickupPaymentModal.totalAmount }
              );
              setPickupPaymentModal(null);
              fetchCounterQueue();
              fetchAnalytics();
              showNotif(`${pickupPaymentModal.customerName} — settled via ${pickupPaymentMethod.toUpperCase()}`);
            } catch (err) {
              showNotif(err.response?.data?.error || 'Settlement failed', 'error');
            }
          }}
          style={{
            flex: 2, padding: '12px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #d3bfa2, #bda88a)',
            border: 'none', color: '#0a0a0a',
            fontSize: '0.62rem', fontWeight: '900', letterSpacing: '1px',
            cursor: 'pointer', outline: 'none',
            fontFamily: 'Poppins, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Store size={13} strokeWidth={2} />
          CONFIRM SETTLEMENT
        </button>
      </div>
    </div>
  </div>
)}

      {/* ══ RESERVATIONS ══ */}
      {queueTab === 'reservations' && (() => {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Date nav + stats */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                {[
                  { onClick: () => { const d = new Date(reservationViewDate); d.setDate(d.getDate() - 1); setReservationViewDate(d.toISOString().split('T')[0]); }, icon: <ChevronLeft size={13} /> },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.onClick} style={{ width: '30px', height: '30px', background: 'transparent', border: '1px solid #1a1a1a', color: '#444', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#d3bfa2'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#444'; }}>
                    {btn.icon}
                  </button>
                ))}
                <div style={{ padding: '7px 16px', background: '#040405', border: '1px solid #161616', borderRadius: '9px', fontSize: '0.7rem', fontWeight: '900', color: '#d3bfa2', minWidth: '140px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {new Date(reservationViewDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <button onClick={() => { const d = new Date(reservationViewDate); d.setDate(d.getDate() + 1); setReservationViewDate(d.toISOString().split('T')[0]); }} style={{ width: '30px', height: '30px', background: 'transparent', border: '1px solid #1a1a1a', color: '#444', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#d3bfa2'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#444'; }}>
                  <ChevronRight size={13} />
                </button>
                <button onClick={() => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })); setReservationViewDate(d.toISOString().split('T')[0]); }} style={{ padding: '7px 12px', background: 'transparent', border: '1px solid rgba(211,191,162,0.12)', color: '#8a704d', borderRadius: '8px', fontSize: '0.56rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.12)'; }}>
                  TODAY
                </button>
                <button onClick={() => fetchCounterQueue()} style={{ width: '30px', height: '30px', background: 'transparent', border: '1px solid #1a1a1a', color: '#333', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#d3bfa2'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#333'; }}>
                  <RefreshCw size={11} />
                </button>
              </div>

              {/* Stats pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: 'TOTAL', val: reservationEntries.length, c: '#d3bfa2' },
                  { label: 'CONFIRMED', val: reservationEntries.filter(r => r.status === 'confirmed').length, c: '#8a704d' },
                  { label: 'PENDING', val: reservationEntries.filter(r => r.status === 'pending').length, c: '#555' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '7px 12px', background: '#0a0a0c', border: '1px solid rgba(211,191,162,0.06)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: s.c, fontFamily: 'monospace', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: '0.46rem', color: '#2a2a2a', fontWeight: '900', marginTop: '3px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reservation list */}
            {reservationEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 20px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: '#0a0a0a', border: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CalendarClock size={18} color="#1a1a1a" />
                </div>
                <div style={{ fontSize: '0.68rem', color: '#1e1e1e', fontWeight: '700' }}>No reservations for this date</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...reservationEntries].sort((a, b) => new Date(a.reservationTime) - new Date(b.reservationTime)).map(entry => {
                  const resTime = new Date(entry.reservationTime);
                  const now = new Date();
                  const minsUntil = Math.round((resTime - now) / 60000);
                  const isUpcoming = minsUntil > 0 && minsUntil <= 60;
                  const isOverdue = minsUntil < -15 && entry.status !== 'seated' && entry.status !== 'cancelled';
                  const isDone = ['seated', 'cancelled', 'no-show'].includes(entry.status);

                  const statusMeta = {
                    pending:   { color: '#8a704d', label: 'PENDING',   accent: 'rgba(138,112,77,0.35)' },
                    confirmed: { color: '#d3bfa2', label: 'CONFIRMED', accent: 'rgba(211,191,162,0.5)' },
                    seated:    { color: '#444',    label: 'SEATED',    accent: '#1a1a1a' },
                    cancelled: { color: '#2a2a2a', label: 'CANCELLED', accent: '#111' },
                    'no-show': { color: '#2a2a2a', label: 'NO-SHOW',   accent: '#111' },
                  };
                  const sm = statusMeta[entry.status] || statusMeta.pending;

                  return (
                    <div key={entry._id} style={{ background: isDone ? '#080809' : isOverdue ? 'rgba(211,191,162,0.02)' : '#0a0a0c', border: `1px solid ${isOverdue ? 'rgba(211,191,162,0.15)' : isDone ? '#0d0d0d' : 'rgba(211,191,162,0.07)'}`, borderLeft: `3px solid ${isUpcoming ? 'rgba(211,191,162,0.6)' : sm.accent}`, borderRadius: '13px', overflow: 'hidden', opacity: isDone ? 0.45 : 1, transition: 'opacity 0.2s' }}>
                      <div style={{ padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

                        {/* Time + info */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                          {/* Time block */}
                          <div style={{ textAlign: 'center', padding: '8px 12px', background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.08)', borderRadius: '10px', flexShrink: 0, minWidth: '64px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', lineHeight: 1 }}>
                              {resTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                            {isUpcoming && <div style={{ fontSize: '0.44rem', color: '#8a704d', fontWeight: '900', marginTop: '4px', letterSpacing: '0.5px' }}>in {minsUntil}m</div>}
                            {isOverdue && <div style={{ fontSize: '0.44rem', color: '#8a704d', fontWeight: '900', marginTop: '4px', letterSpacing: '0.5px' }}>{Math.abs(minsUntil)}m ago</div>}
                          </div>

                          {/* Guest details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '900', fontSize: '0.85rem', color: '#e8e0d0', marginBottom: '4px' }}>{entry.customerName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={9} color="#333" />
                                <span style={{ fontSize: '0.58rem', color: '#444', fontWeight: '700', fontFamily: 'monospace' }}>{entry.partySize} pax</span>
                              </div>
                              {entry.customerPhone && <span style={{ fontSize: '0.56rem', color: '#2a2a2a', fontFamily: 'monospace' }}>{entry.customerPhone}</span>}
                              {entry.tablePreference && (
                                <span style={{ fontSize: '0.52rem', padding: '1px 6px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.1)', borderRadius: '4px', color: '#8a704d', fontWeight: '800' }}>T-{entry.tablePreference}</span>
                              )}
                            </div>
                            {entry.specialRequests && (
                              <div style={{ fontSize: '0.56rem', color: '#444', fontStyle: 'italic', background: '#060608', padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(211,191,162,0.04)', marginBottom: '6px' }}>
                                "{entry.specialRequests}"
                              </div>
                            )}
                            {entry.items?.length > 0 && (
                              <div style={{ fontSize: '0.56rem', color: '#555' }}>
                                Pre-order: {entry.items.slice(0, 2).map(it => `${it.quantity}× ${it.name}`).join(' · ')}{entry.items.length > 2 ? ` +${entry.items.length - 2}` : ''}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: status + actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '7px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.5rem', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', background: `${sm.color}15`, color: sm.color, border: `1px solid ${sm.color}30`, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                            {sm.label}
                          </span>

                          {/* Action row */}
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {/* Confirm */}
                            {entry.status === 'pending' && (
                              <button onClick={async () => { await axios.patch(`${BASE_URL}/reservations/${entry._id}`, { status: 'confirmed' }); fetchCounterQueue(); showNotif(`${entry.customerName} — confirmed`); }}
                                style={{ padding: '6px 11px', background: 'linear-gradient(135deg,#d3bfa2,#bda88a)', border: 'none', color: '#000', borderRadius: '7px', fontSize: '0.54rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.3px' }}>
                                CONFIRM
                              </button>
                            )}
                            {/* Seat */}
                            {entry.status === 'confirmed' && (
                              <button onClick={() => setAssignTableModal({ ...entry, _fromReservation: true })}
                                style={{ padding: '6px 11px', background: 'linear-gradient(135deg,#d3bfa2,#bda88a)', border: 'none', color: '#000', borderRadius: '7px', fontSize: '0.54rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <TableProperties size={10} /> SEAT
                              </button>
                            )}
                            {/* Change table */}
                            {entry.status === 'seated' && (
                              <button onClick={() => setAssignTableModal({ ...entry, _fromReservation: true })}
                                style={{ padding: '5px 9px', background: 'transparent', border: '1px solid #1a1a1a', color: '#444', borderRadius: '7px', fontSize: '0.52rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#d3bfa2'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#444'; }}>
                                <TableProperties size={9} /> CHANGE T
                              </button>
                            )}
                            {/* Edit */}
                            <button onClick={() => setReservationEditModal(entry)}
                              style={{ width: '28px', height: '28px', background: 'transparent', border: '1px solid #1a1a1a', color: '#444', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#d3bfa2'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#444'; }}>
                              <SquarePen size={11} />
                            </button>
                            {/* No-show */}
                            {['pending', 'confirmed'].includes(entry.status) && (
                              <button onClick={() => setConfirmModal({ show: true, title: `No-Show — ${entry.customerName}?`, subtitle: 'Mark this reservation as no-show and free the slot.', onConfirm: async () => { await axios.patch(`${BASE_URL}/reservations/${entry._id}`, { status: 'no-show' }); fetchCounterQueue(); showNotif(`${entry.customerName} — marked no-show`); } })}
                                style={{ width: '28px', height: '28px', background: 'transparent', border: '1px solid #1a1a1a', color: '#2a2a2a', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.2)'; e.currentTarget.style.color = '#8a704d'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#2a2a2a'; }}>
                                <UserX size={11} />
                              </button>
                            )}
                          </div>

                          {/* Cancel + Notify — stacked */}
                          {['pending', 'confirmed'].includes(entry.status) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                              <button onClick={() => setConfirmModal({ show: true, title: `Cancel Reservation — ${entry.customerName}?`, subtitle: `${entry.partySize} pax · ${resTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} · Cannot be undone.`, onConfirm: async () => { try { await axios.patch(`${BASE_URL}/reservations/${entry._id}`, { status: 'cancelled' }); fetchCounterQueue(); showNotif(`${entry.customerName} — reservation cancelled`); } catch (err) { showNotif(err.response?.data?.error || 'Cancel failed', 'error'); } } })}
                                style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #111', color: '#1e1e1e', borderRadius: '7px', fontSize: '0.5rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.15)'; e.currentTarget.style.color = '#8a704d'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#1e1e1e'; }}>
                                <X size={9} /> CANCEL
                              </button>
                              <button onClick={async () => { try { const fmtTime = resTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }); const fmtDate = resTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); await axios.post(`${BASE_URL}/reservations/${entry._id}/notify`, { title: entry.status === 'confirmed' ? 'Reservation Confirmed!' : 'Reservation Update', body: entry.status === 'confirmed' ? `Hi ${entry.customerName}! Your table for ${entry.partySize} is confirmed for ${fmtDate} at ${fmtTime}.` : `Hi ${entry.customerName}! Your reservation for ${fmtDate} at ${fmtTime} is being processed.`, tag: 'reservation-notify' }); showNotif(`${entry.customerName} — notified`, 'success'); } catch { showNotif('Notification failed', 'error'); } }}
                                style={{ padding: '5px 10px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.08)', color: 'rgba(211,191,162,0.35)', borderRadius: '7px', fontSize: '0.5rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.22)'; e.currentTarget.style.color = '#d3bfa2'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.08)'; e.currentTarget.style.color = 'rgba(211,191,162,0.35)'; }}>
                                <BellRing size={9} /> {entry.status === 'confirmed' ? 'NOTIFY CONFIRMED' : 'NOTIFY UPDATE'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

    </div>
  </div>

</motion.div>
)}
 

{/* ── MENU ── */}
{activeTab === 'menu' && (
  <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

    {/* ── INGREDIENT OUT-OF-STOCK ALERTS (real-time banner) ── */}
    <AnimatePresence>
      {ingredientAlerts.filter(a => !a.dismissed).map(alert => (
        <motion.div key={alert.id}
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          style={{
            background: 'rgba(186,117,23,0.08)',
            border: '1px solid rgba(186,117,23,0.3)',
            borderLeft: '3px solid #BA7517',
            borderRadius: '12px', padding: '14px 18px',
            display: 'flex', alignItems: 'flex-start', gap: '14px'
          }}
        >
          <AlertTriangle size={16} color="#BA7517" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#d3bfa2', marginBottom: '4px' }}>
              {alert.ingredientName} is out of stock
            </div>
            <div style={{ fontSize: '0.68rem', color: '#8a704d', lineHeight: 1.5 }}>
              {alert.autoHidden
                ? `${alert.dishCount} dish${alert.dishCount > 1 ? 'es' : ''} auto-hidden from menu: ${alert.affectedDishes.join(', ')}`
                : `${alert.dishCount} dish${alert.dishCount > 1 ? 'es' : ''} may be affected: ${alert.affectedDishes.join(', ')} — hide manually if needed`
              }
            </div>
          </div>
          <button
            onClick={() => setIngredientAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a))}
            style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>

    {/* ── EDIT DISH MODAL ── */}
    <AnimatePresence>
      {editDishModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setEditDishModal(null); }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            style={{ background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.15)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '580px', maxHeight: '88vh', overflowY: 'auto' }}
            className="custom-scroll"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#d3bfa2' }}>EDIT DISH</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.65rem', color: '#444', fontWeight: '600' }}>{editDishModal.name}</p>
              </div>
              <button onClick={() => setEditDishModal(null)} style={{ background: 'transparent', border: '1px solid #1a1a1a', color: '#555', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '10px' }}>DISH NAMES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[{ key: 'name', label: 'English Name' }, { key: 'name_mr', label: 'Marathi Name' }].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: '0.58rem', color: '#444', marginBottom: '5px', fontWeight: '700' }}>{f.label}</div>
                    <input value={editDishData[f.key] ?? ''} onChange={e => setEditDishData(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', padding: '9px 12px', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '10px' }}>PRICING</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[{ key: 'price', label: 'Base Price (₹)' }, { key: 'priceHalf', label: 'Half Price (₹)' }, { key: 'priceFull', label: 'Full Price (₹)' }].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: '0.58rem', color: '#444', marginBottom: '5px', fontWeight: '700' }}>{f.label}</div>
                    <input type="number" value={editDishData[f.key] ?? ''} onChange={e => setEditDishData(p => ({ ...p, [f.key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                      style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#d3bfa2', borderRadius: '8px', padding: '9px 12px', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box', fontWeight: '900' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '10px' }}>CLASSIFICATION</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.58rem', color: '#444', marginBottom: '5px', fontWeight: '700' }}>Category</div>
                  <select value={editDishData.categoryId ?? ''} onChange={e => setEditDishData(p => ({ ...p, categoryId: e.target.value }))}
                    style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', padding: '9px 12px', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">— Select —</option>
                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '0.58rem', color: '#444', marginBottom: '5px', fontWeight: '700' }}>Spice Level</div>
                  <select value={editDishData.spicylevel ?? ''} onChange={e => setEditDishData(p => ({ ...p, spicylevel: e.target.value }))}
                    style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', padding: '9px 12px', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">None</option>
                    <option value="low">🌶 Low</option>
                    <option value="medium">🌶🌶 Medium</option>
                    <option value="high">🌶🌶🌶 High</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '0.58rem', color: '#444', marginBottom: '5px', fontWeight: '700' }}>Serving Size (pax)</div>
                  <input type="number" min="1" value={editDishData.servingSize ?? 1} onChange={e => setEditDishData(p => ({ ...p, servingSize: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', padding: '9px 12px', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '10px' }}>FLAGS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[{ key: 'isVeg', label: 'Vegetarian', onColor: '#4a7c3f' }, { key: 'isAvailable', label: 'Available', onColor: '#d3bfa2' }, { key: 'isChefSpecial', label: "Chef's Special", onColor: '#c9a84c' }].map(f => {
                  const isOn = !!editDishData[f.key];
                  return (
                    <div key={f.key} onClick={() => setEditDishData(p => ({ ...p, [f.key]: !p[f.key] }))}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isOn ? `${f.onColor}12` : '#111', border: `1px solid ${isOn ? `${f.onColor}40` : '#1a1a1a'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: isOn ? f.onColor : '#444' }}>{f.label}</span>
                      <div style={{ width: '32px', height: '17px', borderRadius: '9px', position: 'relative', background: isOn ? f.onColor : '#222', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: '3px', left: isOn ? '17px' : '3px', width: '11px', height: '11px', borderRadius: '50%', background: isOn ? '#000' : '#555', transition: 'left 0.2s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '10px' }}>TAGS <span style={{ color: '#333', fontWeight: '600' }}>(comma separated)</span></div>
              <input value={Array.isArray(editDishData.tags) ? editDishData.tags.join(', ') : (editDishData.tags ?? '')}
                onChange={e => setEditDishData(p => ({ ...p, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                placeholder="e.g. popular, must-try, spicy"
                style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', padding: '9px 12px', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} />
              {Array.isArray(editDishData.tags) && editDishData.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {editDishData.tags.map((tag, ti) => (
                    <span key={ti} style={{ fontSize: '0.6rem', padding: '3px 10px', background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.15)', borderRadius: '6px', color: '#8a704d', fontWeight: '700' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '10px' }}>INGREDIENTS DESCRIPTION</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[{ key: 'ingredients_en', label: 'English', field: 'en' }, { key: 'ingredients_mr', label: 'Marathi', field: 'mr' }].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: '0.58rem', color: '#444', marginBottom: '5px', fontWeight: '700' }}>{f.label}</div>
                    <textarea rows={2}
                      value={Array.isArray(editDishData.ingredients?.[f.field]) ? editDishData.ingredients[f.field].join(', ') : (editDishData.ingredients?.[f.field] ?? '')}
                      onChange={e => setEditDishData(p => ({ ...p, ingredients: { ...(p.ingredients || {}), [f.field]: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                      placeholder="e.g. Paneer, Tomato, Spices"
                      style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#888', borderRadius: '8px', padding: '9px 12px', fontSize: '0.72rem', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '10px' }}>CHEF MESSAGE <span style={{ color: '#333', fontWeight: '600' }}>(shown on menu card)</span></div>
              <textarea rows={2} value={editDishData.chefMessage ?? ''} onChange={e => setEditDishData(p => ({ ...p, chefMessage: e.target.value }))}
                placeholder="This is my personal favorite! You'll love the flavors."
                style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#666', borderRadius: '8px', padding: '9px 12px', fontSize: '0.72rem', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={async () => {
                try {
                  const payload = { ...editDishData };
                  if (payload.priceHalf === '') delete payload.priceHalf;
                  if (payload.priceFull === '') delete payload.priceFull;
                  // Clear auto-hide flag if operator is manually restoring
                  if (payload.isAvailable) payload._autoHiddenByIngredient = null;
                  const res = await axios.patch(`${BASE_URL}/menu-item/${editDishModal._id}`, payload);
                  socket.emit('menu_change_detected', { tenantId, itemId: editDishModal._id, updateData: res.data });
                  setMenuItems(prev => prev.map(i => i._id === editDishModal._id ? res.data : i));
                  showNotif(`${editDishData.name || editDishModal.name} — updated`);
                  setEditDishModal(null);
                } catch { showNotif('Update failed', 'error'); }
              }} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#d3bfa2,#bda88a)', border: 'none', color: '#000', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px' }}>
                SAVE CHANGES
              </button>
              <button onClick={() => setEditDishModal(null)} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #1a1a1a', color: '#555', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}>
                CANCEL
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── MENU TOOLBAR ── */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 20px', borderBottom: '1px solid #151515', gap: '12px', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>MENU REGISTRY</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#555' }}>
          {menuItems.length} dishes · {menuItems.filter(i => i.isAvailable).length} available · {menuItems.filter(i => !i.isAvailable).length} hidden
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* AUTO-HIDE TOGGLE */}
        {tenantConfig && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: '#000', border: `1px solid ${tenantConfig.config?.autoHideDishesOnLowStock ? 'rgba(211,191,162,0.3)' : '#1a1a1a'}`, borderRadius: '10px', transition: 'all 0.2s' }}>
            <Layers size={13} color={tenantConfig.config?.autoHideDishesOnLowStock ? '#d3bfa2' : '#444'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: '900', letterSpacing: '0.5px', color: tenantConfig.config?.autoHideDishesOnLowStock ? '#d3bfa2' : '#444' }}>AUTO-HIDE ON STOCK OUT</span>
              <span style={{ fontSize: '0.52rem', color: '#333', fontWeight: '600' }}>{tenantConfig.config?.autoHideDishesOnLowStock ? 'Hides when ingredients hit zero' : 'Stays visible regardless of stock'}</span>
            </div>
            <button type="button" onClick={async () => {
              const nv = !tenantConfig.config?.autoHideDishesOnLowStock;
              await axios.patch(`${BASE_URL}/tenant/config/${tenantId}`, { key: 'autoHideDishesOnLowStock', value: nv });
              setTenantConfig(p => ({ ...p, config: { ...p.config, autoHideDishesOnLowStock: nv } }));
              showNotif(`Auto-hide ${nv ? 'enabled' : 'disabled'}`);
            }} style={{ width: '42px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.25s', background: tenantConfig.config?.autoHideDishesOnLowStock ? '#d3bfa2' : '#1a1a1a' }}>
              <div style={{ position: 'absolute', top: '4px', left: tenantConfig.config?.autoHideDishesOnLowStock ? '22px' : '4px', width: '14px', height: '14px', borderRadius: '50%', background: tenantConfig.config?.autoHideDishesOnLowStock ? '#0c0c0c' : '#444', transition: 'left 0.25s' }} />
            </button>
          </div>
        )}

        {/* SEARCH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#000', border: '1px solid #121212', borderRadius: '8px', padding: '8px 14px' }}>
          <Search size={13} color="#444" />
          <input type="text" placeholder="Search dishes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.75rem', width: '160px' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>}
        </div>

        {/* ADD DISH */}
        <button onClick={() => setShowAddDishModal(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#d3bfa2,#bda88a)', border: 'none', color: '#000', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px', flexShrink: 0 }}>
          <UtensilsCrossed size={14} /> + ADD DISH
        </button>
      </div>
    </div>

    {/* ── CATEGORY SECTIONS with per-category hide/show ── */}
    {(() => {
      // Group dishes by category, then render one collapsible section per category
      const filtered = menuItems.filter(i => {
        if (!i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (menuVegFilter === 'veg') return i.isVeg === true;
        if (menuVegFilter === 'nonveg') return i.isVeg === false;
        return true;
      });

      // Build category groups — uncategorised goes under "Other"
      const catMap = {};
      filtered.forEach(item => {
        const catKey = item.categoryId || '__uncategorised__';
        if (!catMap[catKey]) catMap[catKey] = [];
        catMap[catKey].push(item);
      });

      const catOrder = categories.map(c => c.categoryId);
      const sortedCatKeys = [
        ...catOrder.filter(k => catMap[k]),
        ...Object.keys(catMap).filter(k => !catOrder.includes(k))
      ];

      if (sortedCatKeys.length === 0) {
        return (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: '#0d0d0d', borderRadius: '20px', border: '1px dashed #1a1a1a' }}>
            <UtensilsCrossed size={32} color="#222" style={{ marginBottom: '16px' }} />
            <div style={{ color: '#333', fontSize: '0.85rem', fontWeight: '700' }}>
              {searchQuery ? `NO DISHES MATCH "${searchQuery.toUpperCase()}"` : 'NO DISHES YET'}
            </div>
            <div style={{ color: '#222', fontSize: '0.7rem', marginTop: '8px' }}>{!searchQuery && 'Click + ADD DISH to register your first menu item'}</div>
          </div>
        );
      }

      return sortedCatKeys.map(catKey => {
        const catItems = catMap[catKey] || [];
        const catName = catKey === '__uncategorised__'
          ? 'Uncategorised'
          : (categories.find(c => c.categoryId === catKey)?.name || catKey.replace(/^cat_/i, '').replace(/_/g, ' '));
        const allHidden  = catItems.every(i => !i.isAvailable);
        const someHidden = catItems.some(i => !i.isAvailable);
        const availableCount = catItems.filter(i => i.isAvailable).length;

        return (
          <div key={catKey} style={{ marginBottom: '8px' }}>
            {/* Category header row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px', marginBottom: '10px',
              background: '#080808', borderRadius: '10px',
              border: '1px solid #151515'
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#d3bfa2', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  {catName}
                </span>
                <span style={{
                  fontSize: '0.52rem', fontWeight: '900', padding: '2px 8px', borderRadius: '8px',
                  background: allHidden ? 'rgba(186,117,23,0.1)' : 'rgba(211,191,162,0.07)',
                  color: allHidden ? '#BA7517' : '#555',
                  border: `1px solid ${allHidden ? 'rgba(186,117,23,0.2)' : '#1a1a1a'}`
                }}>
                  {availableCount}/{catItems.length} available
                </span>
                {someHidden && !allHidden && (
                  <span style={{ fontSize: '0.5rem', color: '#BA7517', fontWeight: '700' }}>
                    · some hidden
                  </span>
                )}
              </div>
              {/* Category-level HIDE ALL / SHOW ALL */}
              <button
                onClick={async () => {
                  const newVal = allHidden; // if all hidden → show all; else → hide all
                  try {
                    await Promise.all(catItems.map(item =>
                      axios.patch(`${BASE_URL}/menu-item/${item._id}`, { isAvailable: newVal, _autoHiddenByIngredient: null })
                    ));
                    setMenuItems(prev => prev.map(i =>
                      catItems.find(c => c._id === i._id)
                        ? { ...i, isAvailable: newVal, _autoHiddenByIngredient: null }
                        : i
                    ));
                    // Emit each update so customer menus sync instantly
                    catItems.forEach(item => {
                      socket.emit('menu_change_detected', { tenantId, itemId: item._id, updateData: { ...item, isAvailable: newVal } });
                    });
                    showNotif(`${catName} — all ${newVal ? 'shown' : 'hidden'}`);
                  } catch { showNotif('Category update failed', 'error'); }
                }}
                style={{
                  padding: '6px 14px', borderRadius: '7px', cursor: 'pointer',
                  fontSize: '0.6rem', fontWeight: '900',
                  background: allHidden ? 'rgba(211,191,162,0.08)' : 'rgba(186,117,23,0.07)',
                  border: allHidden ? '1px solid rgba(211,191,162,0.2)' : '1px solid rgba(186,117,23,0.2)',
                  color: allHidden ? '#d3bfa2' : '#BA7517',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  transition: 'all 0.15s'
                }}
              >
                {allHidden ? <><CheckCircle2 size={10}/> SHOW ALL</> : <><X size={10}/> HIDE ALL</>}
              </button>
            </div>

            {/* Dish grid for this category */}
            <div style={styles.fullWidthGrid}>
              {catItems.map(item => (
                <div key={item._id} style={{
                  ...styles.premiumCard,
                  opacity: item.isAvailable ? 1 : 0.5,
                  position: 'relative',
                  borderTop: `2px solid ${
                    item._autoHiddenByIngredient ? 'rgba(186,117,23,0.5)' :
                    item.isAvailable ? '#1a1a1a' : '#0d0d0d'
                  }`,
                  transition: 'all 0.2s ease'
                }}>
                  {/* AVAILABILITY DOT */}
                  <div style={{ position: 'absolute', top: '14px', right: '14px', width: '7px', height: '7px', borderRadius: '50%', background: item.isAvailable ? '#d3bfa2' : '#333', boxShadow: item.isAvailable ? '0 0 6px rgba(211,191,162,0.4)' : 'none' }} />

                  {/* AUTO-HIDDEN BADGE */}
                  {item._autoHiddenByIngredient && !item.isAvailable && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(186,117,23,0.15)', border: '1px solid rgba(186,117,23,0.35)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.48rem', fontWeight: '900', color: '#BA7517', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <AlertTriangle size={9}/> STOCK OUT
                    </div>
                  )}

                  {/* HOT BADGE */}
                  {hotDishes.has(item.name) && item.isAvailable && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(186,117,23,0.15)', border: '1px solid rgba(186,117,23,0.4)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.52rem', fontWeight: '900', color: '#BA7517', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🔥 HOT
                    </div>
                  )}

                  {/* DISH NAME */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', paddingRight: '20px', paddingTop: item._autoHiddenByIngredient || hotDishes.has(item.name) ? '20px' : '0' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span title={item.isVeg !== false ? 'Vegetarian' : 'Non-Vegetarian'} style={{ width: '13px', height: '13px', border: `2px solid ${item.isVeg !== false ? '#4a7c3f' : '#8a3030'}`, borderRadius: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.isVeg !== false
                            ? <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4a7c3f' }} />
                            : <span style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '5px solid #8a3030' }} />}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900', color: item.isAvailable ? '#fff' : '#666', lineHeight: '1.3' }}>{item.name}</h3>
                      </div>
                      {item.name_mr && <div style={{ fontSize: '0.65rem', color: '#444', marginTop: '3px', fontWeight: '600' }}>{item.name_mr}</div>}
                      {item.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
                          {item.tags.slice(0, 2).map((tag, ti) => (
                            <span key={ti} style={{ fontSize: '0.52rem', padding: '1px 7px', background: 'rgba(211,191,162,0.05)', border: '1px solid #1a1a1a', borderRadius: '4px', color: '#555', fontWeight: '700' }}>{tag}</span>
                          ))}
                          {item.tags.length > 2 && <span style={{ fontSize: '0.52rem', color: '#333' }}>+{item.tags.length - 2}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRICE ROW */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {item.priceHalf ? (
                      <>
                        <span style={{ fontSize: '0.72rem', padding: '3px 10px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#d3bfa2', fontWeight: '800' }}>H ₹{item.priceHalf}</span>
                        <span style={{ fontSize: '0.72rem', padding: '3px 10px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#d3bfa2', fontWeight: '800' }}>F ₹{item.priceFull || item.price}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.72rem', padding: '3px 10px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#d3bfa2', fontWeight: '800' }}>₹{item.price}</span>
                    )}
                    {item.isChefSpecial && (
                      <span style={{ fontSize: '0.62rem', padding: '3px 10px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.2)', borderRadius: '6px', color: '#d3bfa2', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={9} /> CHEF'S
                      </span>
                    )}
                    {item.spicylevel && (
                      <span style={{ fontSize: '0.58rem', padding: '2px 7px', background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.15)', borderRadius: '5px', color: '#8a704d', fontWeight: '700' }}>
                        {'🌶'.repeat(item.spicylevel === 'low' ? 1 : item.spicylevel === 'medium' ? 2 : 3)}
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <button onClick={() => {
                      setEditDishModal(item);
                      setEditDishData({ name: item.name, name_mr: item.name_mr || '', price: item.price || '', priceHalf: item.priceHalf || '', priceFull: item.priceFull || '', categoryId: item.categoryId || '', spicylevel: item.spicylevel || '', servingSize: item.servingSize || 1, isVeg: item.isVeg !== false, isAvailable: item.isAvailable !== false, isChefSpecial: item.isChefSpecial || false, tags: item.tags || [], ingredients: item.ingredients || { en: [], mr: [] }, chefMessage: item.chefMessage || '' });
                    }} style={{ width: '100%', padding: '9px', background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.12)', color: '#8a704d', borderRadius: '9px', fontSize: '0.65rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.3)'; e.currentTarget.style.color = '#d3bfa2'; e.currentTarget.style.background = 'rgba(211,191,162,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.12)'; e.currentTarget.style.color = '#8a704d'; e.currentTarget.style.background = 'rgba(211,191,162,0.04)'; }}
                    >
                      ✎ EDIT ALL DETAILS
                    </button>
                    <div style={{ display: 'flex', gap: '7px' }}>
                      <button onClick={async () => {
                        const newVal = !item.isAvailable;
                        await updateMenu(item._id, { isAvailable: newVal, _autoHiddenByIngredient: null });
                        // Clear the local auto-hidden flag immediately for instant feedback
                        setMenuItems(prev => prev.map(i => i._id === item._id ? { ...i, isAvailable: newVal, _autoHiddenByIngredient: null } : i));
                      }} style={{ flex: 1, padding: '9px 8px', background: item.isAvailable ? '#111' : 'rgba(211,191,162,0.06)', border: item.isAvailable ? '1px solid #1a1a1a' : '1px solid rgba(211,191,162,0.2)', color: item.isAvailable ? '#444' : '#d3bfa2', borderRadius: '9px', fontSize: '0.62rem', fontWeight: '900', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {item.isAvailable ? 'HIDE' : 'SHOW'}
                      </button>
                      <button onClick={() => setPendingDeleteDish(item)} style={{ width: '36px', height: '36px', background: 'transparent', border: '1px solid #1a1a1a', color: '#333', borderRadius: '9px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.25)'; e.currentTarget.style.color = '#8a704d'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#333'; }}
                        title="Remove dish">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      });
    })()}
  </motion.div>
)}

{activeTab === 'customers' && (
  <motion.div key="customers" initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',flexDirection:'column',gap:'20px'}}>

    {/* ── SUMMARY STRIP ── */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px'}}>
      {[
        { label:'TOTAL CUSTOMERS', val: customerDir.summary?.total    || 0, color:'#d3bfa2' },
        { label:'NEW',             val: customerDir.summary?.new      || 0, color:'#8a9a7e' },
        { label:'REGULAR',         val: customerDir.summary?.regular  || 0, color:'#8a704d' },
        { label:'LOYAL',           val: customerDir.summary?.loyal    || 0, color:'#C9A84C' },
        { label:'AT-RISK',         val: customerDir.summary?.atRisk   || 0, color:'#BA7517' },
        { label:'CHAMPION',        val: customerDir.summary?.champion || 0, color:'#d3bfa2' },
      ].map(({label,val,color}) => (
        <div key={label} style={{
          background:'#0d0d0d', border:'1px solid #1c1f26',
          borderTop:`2px solid ${color}`, borderRadius:'12px',
          padding:'14px 14px 12px'
        }}>
          <div style={{fontSize:'1.4rem',fontWeight:'900',color,fontFamily:'monospace'}}>{val}</div>
          <div style={{fontSize:'0.5rem',color:'#555',fontWeight:'900',letterSpacing:'1px',marginTop:'4px'}}>{label}</div>
        </div>
      ))}
    </div>

    {/* ── LIFETIME REVENUE ── */}
    <div style={{
      background:'#090909', border:'1px solid rgba(211,191,162,0.15)',
      borderRadius:'12px', padding:'16px 20px',
      display:'flex', alignItems:'center', justifyContent:'space-between'
    }}>
      <div>
        <div style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'2px',marginBottom:'4px'}}>LIFETIME CUSTOMER REVENUE</div>
        <div style={{fontSize:'2rem',fontWeight:'900',color:'#d3bfa2',fontFamily:'monospace'}}>
          ₹{(customerDir.summary?.totalRevenue || 0).toLocaleString()}
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontSize:'0.58rem',color:'#444',fontStyle:'italic'}}>
          Avg ₹{customerDir.summary?.total > 0 ? Math.round((customerDir.summary?.totalRevenue||0)/customerDir.summary.total).toLocaleString() : 0} per customer
        </div>
        <button
          onClick={() => fetchCustomerDir(customerSegFilter, customerSearch)}
          style={{
            marginTop:'8px', display:'flex', alignItems:'center', gap:'6px',
            background:'transparent', border:'1px solid rgba(211,191,162,0.2)',
            color:'#d3bfa2', padding:'6px 12px', borderRadius:'8px',
            cursor:'pointer', fontSize:'0.62rem', fontWeight:'900'
          }}
        >
          <RefreshCw size={12}/> REFRESH
        </button>
      </div>
    </div>

    {/* ── SEGMENT PILLS + SEARCH ── */}
    <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
      {Object.entries(SEG_META).map(([seg, meta]) => (
        <button
          key={seg}
          onClick={() => { setCustomerSegFilter(seg); fetchCustomerDir(seg, customerSearch); }}
          style={{
            display:'flex', alignItems:'center', gap:'5px',
            padding:'7px 14px', borderRadius:'20px', border:'none',
            cursor:'pointer', fontWeight:'900', fontSize:'0.62rem',
            letterSpacing:'1px', textTransform:'uppercase', transition:'all 0.15s',
            background: customerSegFilter === seg ? meta.color : '#13151a',
            color:      customerSegFilter === seg ? '#0d0d0d'  : meta.color,
            boxShadow:  customerSegFilter === seg ? `0 0 12px ${meta.color}40` : 'none',
          }}
        >
          {seg !== 'all' && SEG_ICONS_COMPONENT[seg]}
          {meta.label}
        </button>
      ))}
      {/* Search */}
      <div style={{flex:1, position:'relative', minWidth:'200px'}}>
        <Search size={13} color="#555" style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)'}}/>
        <input
          value={customerSearch}
          onChange={e => { setCustomerSearch(e.target.value); fetchCustomerDir(customerSegFilter, e.target.value); }}
          placeholder="Search name or phone..."
          style={{
            width:'100%', padding:'9px 12px 9px 34px',
            background:'#13151a', border:'1px solid #252932',
            borderRadius:'8px', color:'#fff', fontSize:'0.78rem', outline:'none'
          }}
        />
      </div>
    </div>

    {/* ── CUSTOMER TABLE ── */}
    {customerLoading ? (
      <div style={{textAlign:'center',padding:'48px',color:'#333',fontSize:'0.78rem'}}>Loading customers...</div>
    ) : (
      <div style={{background:'#0d0d0d',border:'1px solid #1c1f26',borderRadius:'14px',overflow:'hidden'}}>
        {/* Header */}
        <div style={{
          display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr 1fr',
          padding:'10px 16px', borderBottom:'1px solid #1c1f26', background:'#090909'
        }}>
          {['CUSTOMER','SEGMENT','VISITS','TOTAL SPENT','AVG ORDER','LAST SEEN','TOP DISH'].map(h => (
            <div key={h} style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'1.5px'}}>{h}</div>
          ))}
        </div>
        {/* Rows */}
        <div style={{maxHeight:'480px',overflowY:'auto'}} className="custom-scroll">
          {(customerDir.customers || []).length === 0 ? (
            <div style={{padding:'48px',textAlign:'center',color:'#333',fontSize:'0.78rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
              <Users size={32} color="#1a1c23"/>
              No customers found
            </div>
          ) : (customerDir.customers || []).map((c, i) => {
            const meta = SEG_META[c.segment] || SEG_META.regular;
            return (
              <div
                key={c._id}
                onClick={() => fetchCustomerProfile(c.phone)}
                style={{
                  display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 1fr 1fr 1fr',
                  padding:'12px 16px', cursor:'pointer',
                  borderBottom:'1px solid rgba(255,255,255,0.03)',
                  transition:'background 0.15s',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(211,191,162,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
              >
                {/* Name + phone */}
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',fontWeight:'800',fontSize:'0.82rem',color:'#fff'}}>
                    {c.segment === 'champion' && <Crown size={12} color="#C9A84C"/>}
                    {c.name}
                  </div>
                  <div style={{fontSize:'0.6rem',color:'#555',marginTop:'2px',fontFamily:'monospace'}}>{c.phone}</div>
                </div>
                {/* Segment */}
                <div style={{display:'flex',alignItems:'center'}}>
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:'4px',
                    fontSize:'0.52rem', fontWeight:'900', padding:'3px 9px',
                    borderRadius:'10px', background:meta.bg, color:meta.color,
                    border:`1px solid ${meta.color}33`, letterSpacing:'0.5px'
                  }}>
                    {SEG_ICONS_COMPONENT[c.segment]}
                    {meta.label}
                  </span>
                </div>
                {/* Visits */}
                <div style={{display:'flex',alignItems:'center'}}>
                  <span style={{fontSize:'0.88rem',fontWeight:'800',color:'#d3bfa2',fontFamily:'monospace'}}>{c.visitCount}</span>
                </div>
                {/* Spend */}
                <div style={{display:'flex',alignItems:'center'}}>
                  <span style={{fontSize:'0.88rem',fontWeight:'800',color:'#d3bfa2',fontFamily:'monospace'}}>₹{c.totalSpend?.toLocaleString()}</span>
                </div>
                {/* Avg */}
                <div style={{display:'flex',alignItems:'center'}}>
                  <span style={{fontSize:'0.82rem',color:'#8a704d',fontFamily:'monospace'}}>₹{c.avgOrderValue?.toLocaleString()}</span>
                </div>
                {/* Last seen */}
                <div style={{display:'flex',alignItems:'center'}}>
                  <span style={{fontSize:'0.72rem',color:c.daysSinceVisit > 21 ? '#BA7517' : '#666'}}>
                    {c.daysSinceVisit > 365 ? 'Long ago' : `${c.daysSinceVisit}d ago`}
                  </span>
                </div>
                {/* Top dish */}
                <div style={{display:'flex',alignItems:'center',overflow:'hidden'}}>
                  <span style={{fontSize:'0.68rem',color:'#666',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.topDish || '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* ── CUSTOMER PROFILE DRAWER ── */}
    <AnimatePresence>
      {customerProfile && (
        <>
          <motion.div
            initial={{opacity:0}} animate={{opacity:0.6}} exit={{opacity:0}}
            onClick={() => setCustomerProfile(null)}
            style={{position:'fixed',inset:0,background:'#000',zIndex:3000}}
          />
          <motion.div
            initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
            transition={{type:'spring',stiffness:300,damping:32}}
            style={{
              position:'fixed',right:0,top:0,bottom:0,width:'420px',
              background:'#0d0e11', border:'1px solid #1f222a',
              borderRadius:'20px 0 0 20px', zIndex:3001,
              display:'flex', flexDirection:'column', overflow:'hidden'
            }}
          >
            {/* Drawer header */}
            <div style={{padding:'20px 24px',borderBottom:'1px solid #1a1c23',background:'#0a0b0e'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:'1.1rem',fontWeight:'900',color:'#fff'}}>
                    {customerProfile.customer?.name || 'Guest'}
                  </div>
                  <div style={{fontSize:'0.68rem',color:'#555',fontFamily:'monospace',marginTop:'3px'}}>
                    {customerProfile.customer?.phone}
                  </div>
                  {customerProfile.customer?.segment && (
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:'4px', marginTop:'6px',
                      fontSize:'0.52rem', fontWeight:'900', padding:'3px 9px', borderRadius:'10px',
                      background: SEG_META[customerProfile.customer.segment]?.bg || SEG_META.regular.bg,
                      color:      SEG_META[customerProfile.customer.segment]?.color || SEG_META.regular.color,
                      border:`1px solid ${SEG_META[customerProfile.customer.segment]?.color || '#8a704d'}33`
                    }}>
                      {SEG_ICONS_COMPONENT[customerProfile.customer.segment]}
                      {SEG_META[customerProfile.customer.segment]?.label || 'Regular'}
                    </span>
                  )}
                </div>
                <button onClick={() => setCustomerProfile(null)} style={{
                  background:'#13151a', border:'1px solid #252932',
                  color:'#555', padding:'8px', borderRadius:'9px', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  <X size={16}/>
                </button>
              </div>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}} className="custom-scroll">
              {/* Stats grid */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'20px'}}>
                {[
                  { label:'Total Visits',  val: customerProfile.customer?.visitCount || 0 },
                  { label:'Total Spent',   val: `₹${(customerProfile.customer?.totalSpend||0).toLocaleString()}` },
                  { label:'Avg Order',     val: `₹${customerProfile.avgOrderValue?.toLocaleString() || 0}` },
                  { label:'Last Seen',     val: `${customerProfile.daysSinceVisit || '—'}d ago` },
                ].map(({label,val}) => (
                  <div key={label} style={{background:'#13151a',border:'1px solid #1f222a',borderRadius:'10px',padding:'14px'}}>
                    <div style={{fontSize:'1.2rem',fontWeight:'900',color:'#d3bfa2',fontFamily:'monospace'}}>{val}</div>
                    <div style={{fontSize:'0.52rem',color:'#444',fontWeight:'900',letterSpacing:'1px',marginTop:'4px'}}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Dish preferences */}
              {(customerProfile.allDishes || []).length > 0 && (
                <div style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'2px',marginBottom:'10px'}}>DISH PREFERENCES</div>
                  {customerProfile.allDishes.slice(0,5).map((d, i) => (
                    <div key={d.name} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'9px 0', borderBottom:'1px solid #13151a'
                    }}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <span style={{
                          width:'22px', height:'22px', borderRadius:'6px',
                          background: i === 0 ? 'rgba(201,168,76,0.15)' : '#13151a',
                          border:`1px solid ${i === 0 ? 'rgba(201,168,76,0.3)' : '#1f222a'}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'0.55rem', fontWeight:'900',
                          color: i === 0 ? '#C9A84C' : '#444', fontFamily:'monospace'
                        }}>{i + 1}</span>
                        <span style={{fontSize:'0.8rem',color:'#c8ccd6'}}>{d.name}</span>
                      </div>
                      <span style={{fontSize:'0.65rem',color:'#8a704d',fontFamily:'monospace'}}>{d.count}×</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent orders */}
              {(customerProfile.recentOrders || []).length > 0 && (
                <div>
                  <div style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'2px',marginBottom:'10px'}}>RECENT ORDERS</div>
                  {customerProfile.recentOrders.slice(0,5).map((o) => (
                    <div key={o._id} style={{
                      background:'#13151a', border:'1px solid #1f222a',
                      borderRadius:'10px', padding:'12px 14px', marginBottom:'8px',
                      display:'flex', justifyContent:'space-between', alignItems:'center'
                    }}>
                      <div>
                        <div style={{fontSize:'0.72rem',color:'#d3bfa2',fontWeight:'800'}}>
                          Table {o.tableNumber} · {o.items?.length || 0} items
                        </div>
                        <div style={{fontSize:'0.6rem',color:'#444',marginTop:'3px'}}>
                          {new Date(o.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div style={{fontFamily:'monospace',fontWeight:'900',color:'#d3bfa2',fontSize:'0.88rem'}}>
                        ₹{(o.billDetails?.grandTotal || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </motion.div>
)}


{activeTab === 'marketing' && (
<motion.div key="marketing" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
  style={{display:'flex',flexDirection:'column',gap:'0px',paddingBottom:'80px'}}>
 
  {/* ── SUB-TAB SWITCHER ── */}
  <div style={{
    display:'flex',alignItems:'center',gap:'0px',
    padding:'20px 0 0',marginBottom:'24px',
    borderBottom:'1px solid #111'
  }}>
    {[
      {id:'announcements', label:'Menu Banners',  icon:<Megaphone size={13}/>,
        badge: announcements.filter(a=>a.isActive&&new Date(a.expiresAt)>new Date()).length },
      {id:'offers',        label:'Offers',        icon:<Tag size={13}/>,
        badge: (Array.isArray(offers)?offers:[]).filter(o=>o.isActive).length },
      {id:'campaigns',     label:'Campaigns',     icon:<Send size={13}/>,
        badge: null },
    ].map(st=>{
      const isActive = marketingSubTab === st.id;
      return (
        <button key={st.id} onClick={()=>setMarketingSubTab(st.id)}
          style={{
            display:'flex',alignItems:'center',gap:'7px',
            padding:'10px 20px',
            background:'transparent',border:'none',
            borderBottom: isActive ? '2px solid #d3bfa2' : '2px solid transparent',
            color: isActive ? '#d3bfa2' : '#333',
            fontSize:'0.68rem',fontWeight:'900',cursor:'pointer',
            letterSpacing:'0.5px',transition:'all 0.15s',
            marginBottom:'-1px'
          }}>
          <span style={{color: isActive?'#d3bfa2':'#2a2a2a'}}>{st.icon}</span>
          {st.label}
          {st.badge > 0 && (
            <span style={{
              fontSize:'0.5rem',fontWeight:'900',
              padding:'1px 6px',borderRadius:'8px',
              background: isActive?'rgba(211,191,162,0.15)':'rgba(255,255,255,0.04)',
              color: isActive?'#d3bfa2':'#2a2a2a',
              border:`1px solid ${isActive?'rgba(211,191,162,0.25)':'rgba(255,255,255,0.06)'}`,
              fontFamily:'monospace'
            }}>{st.badge}</span>
          )}
        </button>
      );
    })}
 
    {/* Right side: live status pill */}
    <div style={{marginLeft:'auto',display:'flex',gap:'8px',alignItems:'center'}}>
      {announcements.some(a=>a.isActive&&new Date(a.expiresAt)>new Date()) && (
        <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'5px 12px',borderRadius:'20px',background:'rgba(74,222,128,0.05)',border:'1px solid rgba(74,222,128,0.2)'}}>
          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 6px rgba(74,222,128,0.6)',animation:'moodPulse 2s ease-in-out infinite'}}/>
          <span style={{fontSize:'0.54rem',fontWeight:'900',color:'#4ade80',letterSpacing:'1px'}}>BANNER LIVE ON MENU</span>
        </div>
      )}
      {announcements.filter(a=>!a.isActive&&a.startsAt&&new Date(a.startsAt)>new Date()).length > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'5px 12px',borderRadius:'20px',background:'rgba(186,117,23,0.06)',border:'1px solid rgba(186,117,23,0.2)'}}>
          <Clock size={9} color="#BA7517"/>
          <span style={{fontSize:'0.54rem',fontWeight:'900',color:'#BA7517',letterSpacing:'1px'}}>
            {announcements.filter(a=>!a.isActive&&a.startsAt&&new Date(a.startsAt)>new Date()).length} SCHEDULED
          </span>
        </div>
      )}
    </div>
  </div>
 
  {/* ══════════════════════════════════════════════════
      SUB-TAB: ANNOUNCEMENTS (MENU BANNERS)
  ══════════════════════════════════════════════════ */}
  {marketingSubTab === 'announcements' && (
  <motion.div key="ann-tab" initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',flexDirection:'column',gap:'20px'}}>
 
    {/* KPI row */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
      {[
        {l:'Total Banners', v:announcements.length,                                                                          c:'#d3bfa2', icon:<Megaphone size={13}/>},
        {l:'Live Now',      v:announcements.filter(a=>a.isActive&&new Date(a.expiresAt)>new Date()).length,                  c:'#4ade80', icon:<Zap size={13}/>},
        {l:'Scheduled',     v:announcements.filter(a=>!a.isActive&&a.startsAt&&new Date(a.startsAt)>new Date()).length,      c:'#BA7517', icon:<Clock size={13}/>},
        {l:'Total Views',   v:announcements.reduce((acc,x)=>acc+(x.viewCount||0),0),                                        c:'#8a704d', icon:<Eye size={13}/>},
      ].map((s,i)=>(
        <div key={i} style={{background:'#080808',border:'1px solid #161616',borderTop:`2px solid ${s.c}20`,borderRadius:'13px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'11px'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'7px',flexShrink:0,background:`${s.c}0d`,border:`1px solid ${s.c}1a`,display:'flex',alignItems:'center',justifyContent:'center',color:s.c}}>{s.icon}</div>
          <div>
            <div style={{fontSize:'1.3rem',fontWeight:'900',color:s.c,fontFamily:'monospace',lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:'0.48rem',color:'#333',fontWeight:'900',letterSpacing:'1px',marginTop:'3px',textTransform:'uppercase'}}>{s.l}</div>
          </div>
        </div>
      ))}
    </div>
 
    {/* Two-column layout */}
    <div style={{display:'grid',gridTemplateColumns:'390px 1fr',gap:'22px',alignItems:'start'}}>
 
      {/* ── COMPOSE FORM ── */}
      <div style={{background:'#080808',border:'1px solid #161616',borderRadius:'16px',overflow:'hidden',position:'sticky',top:'20px'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #111',background:'#060606'}}>
          <div style={{fontSize:'0.58rem',color:'#d3bfa2',fontWeight:'900',letterSpacing:'2px'}}>COMPOSE BANNER</div>
          <div style={{fontSize:'0.54rem',color:'#2a2a2a',marginTop:'2px'}}>Shown on every customer's QR menu in real-time</div>
        </div>
        <div style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:'13px'}}>
 
          {/* Type picker */}
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'1.5px',marginBottom:'7px',textTransform:'uppercase'}}>Banner Type</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
              {[
                {id:'offer',        label:'Offer',        icon:<Tag size={12}/>},
                {id:'discount',     label:'Discount',     icon:<Percent size={12}/>},
                {id:'wish',         label:'Festive Wish', icon:<Sparkles size={12}/>},
                {id:'announcement', label:'Notice',       icon:<Megaphone size={12}/>},
              ].map(opt=>(
                <button key={opt.id} onClick={()=>setNewAnnouncement(p=>({...p,type:opt.id}))}
                  style={{
                    display:'flex',alignItems:'center',gap:'7px',padding:'9px 10px',
                    borderRadius:'8px',cursor:'pointer',transition:'all 0.15s',
                    border:newAnnouncement.type===opt.id?'1px solid rgba(211,191,162,0.3)':'1px solid #1a1a1a',
                    background:newAnnouncement.type===opt.id?'rgba(211,191,162,0.07)':'#0d0d0d',
                    color:newAnnouncement.type===opt.id?'#d3bfa2':'#444',
                    fontSize:'0.65rem',fontWeight:'800'
                  }}>
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>
          </div>
 
          {/* Headline */}
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'1.5px',marginBottom:'6px',display:'flex',justifyContent:'space-between',textTransform:'uppercase'}}>
              <span>Headline *</span><span style={{color:'#2a2a2a'}}>{newAnnouncement.title.length}/60</span>
            </div>
            <input value={newAnnouncement.title}
              onChange={e=>setNewAnnouncement(p=>({...p,title:e.target.value}))}
              placeholder="e.g. Weekend Special — 20% Off"
              maxLength={60}
              style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1e1e1e',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',fontWeight:'700',boxSizing:'border-box'}}/>
          </div>
 
          {/* Message */}
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'1.5px',marginBottom:'6px',display:'flex',justifyContent:'space-between',textTransform:'uppercase'}}>
              <span>Message *</span><span style={{color:'#2a2a2a'}}>{newAnnouncement.message.length}/140</span>
            </div>
            <textarea value={newAnnouncement.message}
              onChange={e=>setNewAnnouncement(p=>({...p,message:e.target.value}))}
              placeholder="e.g. Enjoy 20% off on all main course dishes this weekend!"
              rows={3} maxLength={140}
              style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1e1e1e',color:'#fff',borderRadius:'8px',fontSize:'0.78rem',outline:'none',resize:'vertical',fontFamily:'inherit',lineHeight:1.5,boxSizing:'border-box'}}/>
          </div>
 
          {/* Discount fields */}
          {(newAnnouncement.type==='offer'||newAnnouncement.type==='discount') && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <div>
                <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'1.5px',marginBottom:'6px',textTransform:'uppercase'}}>Value (optional)</div>
                <input type="number" value={newAnnouncement.discountValue}
                  onChange={e=>setNewAnnouncement(p=>({...p,discountValue:e.target.value}))}
                  placeholder="e.g. 20"
                  style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1e1e1e',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.9rem',fontWeight:'900',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'1.5px',marginBottom:'6px',textTransform:'uppercase'}}>Unit</div>
                <select value={newAnnouncement.discountType}
                  onChange={e=>setNewAnnouncement(p=>({...p,discountType:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1e1e1e',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',cursor:'pointer',appearance:'none'}}>
                  <option value="percent">% Off</option>
                  <option value="fixed">₹ Off</option>
                </select>
              </div>
            </div>
          )}
 
          {/* Scheduled start */}
          <div style={{background:'rgba(186,117,23,0.04)',border:'1px solid rgba(186,117,23,0.12)',borderRadius:'10px',padding:'12px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <div style={{fontSize:'0.48rem',color:'#BA7517',fontWeight:'900',letterSpacing:'1.5px',display:'flex',alignItems:'center',gap:'5px',textTransform:'uppercase'}}>
                <Clock size={9}/> Goes Live At
                <span style={{color:'#444',fontWeight:'600',marginLeft:'3px'}}>(blank = now)</span>
              </div>
              {(newAnnouncement.startDate||newAnnouncement.startTime) && (
                <button onClick={()=>setNewAnnouncement(p=>({...p,startDate:'',startTime:''}))}
                  style={{fontSize:'0.48rem',color:'#444',background:'transparent',border:'none',cursor:'pointer',fontWeight:'800'}}>CLEAR</button>
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
              <input type="date" value={newAnnouncement.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e=>setNewAnnouncement(p=>({...p,startDate:e.target.value}))}
                style={{width:'100%',padding:'8px 10px',background:'#0d0d0d',border:'1px solid #1e1e1e',color:'#fff',borderRadius:'7px',fontSize:'0.72rem',outline:'none',colorScheme:'dark',boxSizing:'border-box'}}/>
              <input type="time" value={newAnnouncement.startTime}
                onChange={e=>setNewAnnouncement(p=>({...p,startTime:e.target.value}))}
                style={{width:'100%',padding:'8px 10px',background:'#0d0d0d',border:'1px solid #1e1e1e',color:'#fff',borderRadius:'7px',fontSize:'0.72rem',outline:'none',colorScheme:'dark',boxSizing:'border-box'}}/>
            </div>
            {/* Quick presets */}
            <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
              {[
                {label:'Tonight 7PM',fn:()=>{const d=new Date();d.setHours(19,0,0,0);return d;}},
                {label:'Tomorrow 12PM',fn:()=>{const d=new Date();d.setDate(d.getDate()+1);d.setHours(12,0,0,0);return d;}},
                {label:'Fri 7PM',fn:()=>{const d=new Date();const df=(5-d.getDay()+7)%7||7;d.setDate(d.getDate()+df);d.setHours(19,0,0,0);return d;}},
                {label:'Sat 12PM',fn:()=>{const d=new Date();const ds=(6-d.getDay()+7)%7||7;d.setDate(d.getDate()+ds);d.setHours(12,0,0,0);return d;}},
              ].map(p=>(
                <button key={p.label} onClick={()=>{const d=p.fn();setNewAnnouncement(prev=>({...prev,startDate:d.toISOString().split('T')[0],startTime:d.toTimeString().slice(0,5)}));}}
                  style={{padding:'3px 8px',borderRadius:'5px',border:'1px solid rgba(186,117,23,0.2)',background:'rgba(186,117,23,0.06)',color:'#BA7517',fontSize:'0.52rem',fontWeight:'800',cursor:'pointer'}}>{p.label}</button>
              ))}
            </div>
            {newAnnouncement.startDate && newAnnouncement.startTime && (
              <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'5px',padding:'5px 9px',borderRadius:'6px',background:'rgba(186,117,23,0.07)',border:'1px solid rgba(186,117,23,0.15)'}}>
                <Clock size={9} color="#BA7517"/>
                <span style={{fontSize:'0.56rem',color:'#BA7517',fontWeight:'800'}}>
                  Goes live: {new Date(`${newAnnouncement.startDate}T${newAnnouncement.startTime}:00`).toLocaleString('en-IN',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:true})}
                </span>
              </div>
            )}
          </div>
 
          {/* Expiry */}
          <div style={{background:'rgba(211,191,162,0.03)',border:'1px solid rgba(211,191,162,0.09)',borderRadius:'10px',padding:'12px'}}>
            <div style={{fontSize:'0.48rem',color:'#8a704d',fontWeight:'900',letterSpacing:'1.5px',display:'flex',alignItems:'center',gap:'5px',marginBottom:'8px',textTransform:'uppercase'}}>
              <Clock size={9}/> Expires At <span style={{color:'#444',fontWeight:'600',marginLeft:'3px'}}>(required)</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
              <input type="date" value={newAnnouncement.expiryDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e=>setNewAnnouncement(p=>({...p,expiryDate:e.target.value}))}
                style={{width:'100%',padding:'8px 10px',background:'#0d0d0d',border:'1px solid #1e1e1e',color:'#fff',borderRadius:'7px',fontSize:'0.72rem',outline:'none',colorScheme:'dark',boxSizing:'border-box'}}/>
              <input type="time" value={newAnnouncement.expiryTime}
                onChange={e=>setNewAnnouncement(p=>({...p,expiryTime:e.target.value}))}
                style={{width:'100%',padding:'8px 10px',background:'#0d0d0d',border:'1px solid #1e1e1e',color:'#fff',borderRadius:'7px',fontSize:'0.72rem',outline:'none',colorScheme:'dark',boxSizing:'border-box'}}/>
            </div>
            <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
              {[
                {label:'Tonight 11PM',fn:()=>{const d=new Date();d.setHours(23,59,0,0);return d;}},
                {label:'+24h',fn:()=>new Date(Date.now()+86400000)},
                {label:'+3 days',fn:()=>new Date(Date.now()+3*86400000)},
                {label:'+7 days',fn:()=>new Date(Date.now()+7*86400000)},
              ].map(p=>(
                <button key={p.label} onClick={()=>{const d=p.fn();setNewAnnouncement(prev=>({...prev,expiryDate:d.toISOString().split('T')[0],expiryTime:d.toTimeString().slice(0,5)}));}}
                  style={{padding:'3px 8px',borderRadius:'5px',border:'1px solid #1e1e1e',background:'transparent',color:'#8a704d',fontSize:'0.52rem',fontWeight:'800',cursor:'pointer'}}>{p.label}</button>
              ))}
            </div>
          </div>
 
          {/* Live preview */}
          {(newAnnouncement.title||newAnnouncement.message) && (
            <div style={{background:'#0a0a0a',border:'1px solid #141414',borderRadius:'10px',padding:'12px'}}>
              <div style={{fontSize:'0.48rem',color:'#333',fontWeight:'900',letterSpacing:'1.5px',marginBottom:'9px',textTransform:'uppercase'}}>Customer Preview</div>
              <div style={{background:'#13151a',borderRadius:'9px',padding:'13px',borderLeft:'3px solid #C9A84C',display:'flex',alignItems:'flex-start',gap:'11px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'7px',flexShrink:0,background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {newAnnouncement.type==='offer'?<Tag size={14} color="#C9A84C"/>:newAnnouncement.type==='discount'?<Percent size={14} color="#C9A84C"/>:newAnnouncement.type==='wish'?<Sparkles size={14} color="#C9A84C"/>:<Megaphone size={14} color="#C9A84C"/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'0.82rem',fontWeight:'800',color:'#fff',marginBottom:'3px'}}>{newAnnouncement.title||'Your headline'}</div>
                  <div style={{fontSize:'0.68rem',color:'#888',lineHeight:1.5}}>{newAnnouncement.message||'Your message'}</div>
                  {newAnnouncement.discountValue && newAnnouncement.type!=='wish' && (
                    <div style={{marginTop:'7px',display:'inline-flex',padding:'2px 9px',borderRadius:'5px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)'}}>
                      <span style={{fontSize:'0.65rem',fontWeight:'900',color:'#C9A84C'}}>{newAnnouncement.discountValue}{newAnnouncement.discountType==='percent'?'%':'₹'} OFF</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
 
          {/* Publish button */}
          <button
            onClick={async()=>{
              if(!newAnnouncement.title||!newAnnouncement.message||!newAnnouncement.expiryDate||!newAnnouncement.expiryTime){
                showNotif('Headline, message and expiry are required','error');return;
              }
              const expiresAt=new Date(`${newAnnouncement.expiryDate}T${newAnnouncement.expiryTime}:00`);
              if(expiresAt<=new Date()){showNotif('Expiry must be in the future','error');return;}
              let startsAt=null;
              if(newAnnouncement.startDate&&newAnnouncement.startTime){
                startsAt=new Date(`${newAnnouncement.startDate}T${newAnnouncement.startTime}:00`);
                if(startsAt>=expiresAt){showNotif('Start time must be before expiry time','error');return;}
              }
              const isScheduled=startsAt&&startsAt>new Date();
              try{
                await axios.post(`${BASE_URL}/announcements/${tenantId}`,{
                  title:newAnnouncement.title,
                  message:newAnnouncement.message,
                  type:newAnnouncement.type,
                  accentColor:newAnnouncement.accentColor||'gold',
                  icon:newAnnouncement.icon||'tag',
                  discountValue:newAnnouncement.discountValue||null,
                  discountType:newAnnouncement.discountType||null,
                  expiresAt:expiresAt.toISOString(),
                  startsAt:startsAt?startsAt.toISOString():new Date().toISOString(),
                  isActive:!isScheduled,
                });
                showNotif(isScheduled
                  ?`Scheduled for ${startsAt.toLocaleString('en-IN',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:true})} ✓`
                  :'Live on customer menu now ✓');
                setNewAnnouncement({title:'',message:'',type:'offer',accentColor:'gold',icon:'tag',discountValue:'',discountType:'percent',startDate:'',startTime:'',expiryDate:'',expiryTime:''});
                fetchAnnouncements();
              }catch(err){showNotif(err.response?.data?.error||'Failed to publish','error');}
            }}
            disabled={!newAnnouncement.title||!newAnnouncement.message}
            style={{
              padding:'12px',borderRadius:'9px',border:'none',
              background:(newAnnouncement.title&&newAnnouncement.message)
                ?(newAnnouncement.startDate?'linear-gradient(135deg,#8a5c0a,#BA7517)':'linear-gradient(135deg,#bda88a,#d3bfa2)')
                :'#111',
              color:(newAnnouncement.title&&newAnnouncement.message)?'#000':'#2a2a2a',
              fontWeight:'900',fontSize:'0.72rem',letterSpacing:'0.5px',
              cursor:(newAnnouncement.title&&newAnnouncement.message)?'pointer':'not-allowed',
              display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',transition:'all 0.2s'
            }}>
            {newAnnouncement.startDate
              ?<><Clock size={12}/> SCHEDULE ANNOUNCEMENT</>
              :<><Send size={12}/> PUBLISH TO CUSTOMER MENU</>}
          </button>
        </div>
      </div>
 
      {/* ── ANNOUNCEMENTS LIST ── */}
      <div style={{display:'flex',flexDirection:'column',gap:'9px'}}>
        {announcements.length===0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'14px',padding:'70px 20px',border:'1px dashed #141414',borderRadius:'14px',color:'#1e1e1e'}}>
            <Megaphone size={30} color="#141414"/>
            <div>
              <div style={{fontSize:'0.78rem',fontWeight:'700',color:'#1e1e1e',textAlign:'center'}}>No banners yet</div>
              <div style={{fontSize:'0.62rem',color:'#141414',textAlign:'center',marginTop:'4px'}}>Compose on the left · publish instantly or schedule</div>
            </div>
          </div>
        ) : announcements.map(a=>{
          const now=new Date();
          const isScheduled=!a.isActive&&a.startsAt&&new Date(a.startsAt)>now;
          const isLive=a.isActive&&new Date(a.expiresAt)>now;
          const isEnded=!isLive&&!isScheduled;
          const timeLeft=isLive?getTimeRemaining(a.expiresAt):null;
          const timeUntil=isScheduled?getTimeRemaining(a.startsAt):null;
 
          return (
            <motion.div key={a._id} initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}}
              style={{
                background:isLive?'rgba(211,191,162,0.025)':isScheduled?'rgba(186,117,23,0.03)':'#080808',
                border:`1px solid ${isLive?'rgba(211,191,162,0.15)':isScheduled?'rgba(186,117,23,0.15)':'#111'}`,
                borderLeft:`3px solid ${isLive?'rgba(211,191,162,0.45)':isScheduled?'rgba(186,117,23,0.45)':'#1a1a1a'}`,
                borderRadius:'13px',padding:'16px 18px',
                opacity:isEnded?0.42:1,transition:'all 0.2s'
              }}>
              {isLive&&<div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(211,191,162,0.3),transparent)'}}/>}
 
              <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
                <div style={{width:'34px',height:'34px',borderRadius:'8px',flexShrink:0,background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.14)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {a.type==='offer'?<Tag size={14} color="#C9A84C"/>:a.type==='discount'?<Percent size={14} color="#C9A84C"/>:a.type==='wish'?<Sparkles size={14} color="#C9A84C"/>:<Megaphone size={14} color="#C9A84C"/>}
                </div>
 
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'4px',flexWrap:'wrap'}}>
                    <span style={{fontWeight:'800',color:'#e8e4de',fontSize:'0.82rem'}}>{a.title}</span>
                    {isLive&&<span style={{fontSize:'0.46rem',fontWeight:'900',padding:'2px 7px',borderRadius:'10px',background:'rgba(74,222,128,0.07)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.18)',letterSpacing:'1px'}}>● LIVE</span>}
                    {isScheduled&&<span style={{fontSize:'0.46rem',fontWeight:'900',padding:'2px 7px',borderRadius:'10px',background:'rgba(186,117,23,0.07)',color:'#BA7517',border:'1px solid rgba(186,117,23,0.18)',letterSpacing:'1px'}}>◷ SCHEDULED</span>}
                    {isEnded&&<span style={{fontSize:'0.46rem',fontWeight:'900',padding:'2px 7px',borderRadius:'10px',background:'rgba(255,255,255,0.02)',color:'#2a2a2a',border:'1px solid rgba(255,255,255,0.04)',letterSpacing:'1px'}}>ENDED</span>}
                  </div>
                  <div style={{fontSize:'0.7rem',color:'#555',lineHeight:1.5,marginBottom:'8px'}}>{a.message}</div>
                  <div style={{display:'flex',gap:'10px',flexWrap:'wrap',fontSize:'0.56rem',color:'#333',alignItems:'center'}}>
                    {a.discountValue&&(
                      <span style={{padding:'2px 8px',borderRadius:'4px',background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.13)',color:'#C9A84C',fontWeight:'900',fontFamily:'monospace'}}>
                        {a.discountValue}{a.discountType==='percent'?'%':'₹'} OFF
                      </span>
                    )}
                    {isScheduled&&timeUntil&&<span style={{color:'#BA7517',fontWeight:'700',display:'flex',alignItems:'center',gap:'3px'}}><Clock size={8}/>starts in {timeUntil} · {new Date(a.startsAt).toLocaleString('en-IN',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:true})}</span>}
                    {isLive&&timeLeft&&<span style={{color:'#8a704d',fontWeight:'700',display:'flex',alignItems:'center',gap:'3px'}}><Clock size={8}/>ends in {timeLeft}</span>}
                    {isEnded&&<span style={{display:'flex',alignItems:'center',gap:'3px'}}><Clock size={8}/>ended {new Date(a.expiresAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>}
                    <span style={{display:'flex',alignItems:'center',gap:'3px'}}><Eye size={8}/>{a.viewCount||0} views</span>
                  </div>
                </div>
 
                {/* Actions */}
                <div style={{display:'flex',flexDirection:'column',gap:'5px',flexShrink:0,alignItems:'flex-end'}}>
                  <div style={{display:'flex',gap:'5px'}}>
                    {isLive&&(
                      <button onClick={()=>setConfirmModal({show:true,title:'End this announcement?',subtitle:'Removed from customer menu immediately.',onConfirm:async()=>{try{await axios.patch(`${BASE_URL}/announcements/${a._id}`,{isActive:false});fetchAnnouncements();showNotif('Announcement ended');}catch{showNotif('Failed','error');}}})}
                        style={{padding:'5px 10px',borderRadius:'6px',cursor:'pointer',border:'1px solid rgba(186,117,23,0.22)',background:'rgba(186,117,23,0.06)',color:'#BA7517',fontSize:'0.56rem',fontWeight:'900',display:'flex',alignItems:'center',gap:'4px'}}>
                        <Zap size={8}/> END
                      </button>
                    )}
                    {isScheduled&&(
                      <button onClick={()=>setConfirmModal({show:true,title:'Cancel this scheduled announcement?',subtitle:'It will not go live.',onConfirm:async()=>{try{await axios.delete(`${BASE_URL}/announcements/${a._id}`);fetchAnnouncements();showNotif('Schedule cancelled');}catch{showNotif('Failed','error');}}})}
                        style={{padding:'5px 10px',borderRadius:'6px',cursor:'pointer',border:'1px solid #1e1e1e',background:'transparent',color:'#444',fontSize:'0.56rem',fontWeight:'900',display:'flex',alignItems:'center',gap:'4px'}}>
                        <X size={8}/> CANCEL
                      </button>
                    )}
                    {isEnded&&(
                      <button onClick={()=>setConfirmModal({show:true,title:'Delete announcement?',subtitle:'This cannot be undone.',onConfirm:async()=>{try{await axios.delete(`${BASE_URL}/announcements/${a._id}`);fetchAnnouncements();}catch{}}})}
                        style={{width:'26px',height:'26px',padding:0,borderRadius:'6px',cursor:'pointer',background:'transparent',border:'1px solid #1a1a1a',color:'#2a2a2a',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={10}/></button>
                    )}
                  </div>
                  {isEnded&&(
                    <button onClick={()=>{
                      setNewAnnouncement({
                        title:a.title,message:a.message,type:a.type,
                        accentColor:a.accentColor||'gold',icon:a.icon||'tag',
                        discountValue:a.discountValue?String(a.discountValue):'',
                        discountType:a.discountType||'percent',
                        startDate:'',startTime:'',expiryDate:'',expiryTime:''
                      });
                      window.scrollTo({top:0,behavior:'smooth'});
                      showNotif('Pre-filled · set a new expiry and publish');
                    }} style={{padding:'5px 10px',borderRadius:'6px',cursor:'pointer',border:'1px solid rgba(211,191,162,0.16)',background:'rgba(211,191,162,0.04)',color:'#d3bfa2',fontSize:'0.56rem',fontWeight:'900',display:'flex',alignItems:'center',gap:'4px',transition:'all 0.15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='rgba(211,191,162,0.09)';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='rgba(211,191,162,0.04)';}}>
                      <RefreshCw size={8}/> RELAUNCH
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </motion.div>
  )}
 
  {/* ══════════════════════════════════════════════════
      SUB-TAB: OFFERS
  ══════════════════════════════════════════════════ */}
  {marketingSubTab === 'offers' && (
  <motion.div key="offers-tab" initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',flexDirection:'column',gap:'20px'}}>
 
    {/* KPI */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
      {[
        {l:'Total Offers',  v:(Array.isArray(offers)?offers:[]).length,                                       c:'#d3bfa2', icon:<Tag size={13}/>},
        {l:'Active',        v:(Array.isArray(offers)?offers:[]).filter(o=>o.isActive).length,                 c:'#4ade80', icon:<CheckCircle2 size={13}/>},
        {l:'Percent Off',   v:(Array.isArray(offers)?offers:[]).filter(o=>o.type==='percent_off').length,     c:'#BA7517', icon:<Percent size={13}/>},
        {l:'Total Redeemed',v:(Array.isArray(offers)?offers:[]).reduce((a,o)=>a+(o.usageCount||0),0),         c:'#8a704d', icon:<ShoppingCart size={13}/>},
      ].map((s,i)=>(
        <div key={i} style={{background:'#080808',border:'1px solid #161616',borderTop:`2px solid ${s.c}20`,borderRadius:'13px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'11px'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'7px',flexShrink:0,background:`${s.c}0d`,border:`1px solid ${s.c}1a`,display:'flex',alignItems:'center',justifyContent:'center',color:s.c}}>{s.icon}</div>
          <div>
            <div style={{fontSize:'1.3rem',fontWeight:'900',color:s.c,fontFamily:'monospace',lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:'0.48rem',color:'#333',fontWeight:'900',letterSpacing:'1px',marginTop:'3px',textTransform:'uppercase'}}>{s.l}</div>
          </div>
        </div>
      ))}
    </div>
 
    {/* Create offer form */}
    <div style={{background:'#080808',border:'1px solid #161616',borderRadius:'16px',overflow:'hidden'}}>
      <div style={{padding:'15px 20px',borderBottom:'1px solid #111',background:'#060606',display:'flex',alignItems:'center',gap:'9px'}}>
        <Tag size={13} color="#d3bfa2"/>
        <div>
          <div style={{fontSize:'0.58rem',color:'#d3bfa2',fontWeight:'900',letterSpacing:'2px'}}>CREATE OFFER</div>
          <div style={{fontSize:'0.52rem',color:'#2a2a2a',marginTop:'1px'}}>Coupon codes, happy hours, discounts — trackable usage</div>
        </div>
      </div>
      <div style={{padding:'18px 20px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px',marginBottom:'12px'}}>
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Offer Title *</div>
            <input type="text" placeholder="e.g. Happy Hour Special"
              value={newOffer.title} onChange={e=>setNewOffer(p=>({...p,title:e.target.value}))}
              style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Coupon Code</div>
            <input type="text" placeholder="e.g. HAPPY20 (optional)"
              value={newOffer.code||''} onChange={e=>setNewOffer(p=>({...p,code:e.target.value.toUpperCase()}))}
              style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#C9A84C',borderRadius:'8px',fontSize:'0.8rem',fontWeight:'900',outline:'none',boxSizing:'border-box',fontFamily:'monospace'}}/>
          </div>
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Type</div>
            <select value={newOffer.type} onChange={e=>setNewOffer(p=>({...p,type:e.target.value}))}
              style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',cursor:'pointer'}}>
              <option value="percent_off">% Off</option>
              <option value="fixed_off">₹ Off</option>
              <option value="free_item">Free Item</option>
              <option value="happy_hour">Happy Hour</option>
            </select>
          </div>
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>
              {newOffer.type==='free_item'?'Free Item Name':newOffer.type==='happy_hour'?'Happy Hour Start':'Value'}
            </div>
            {newOffer.type==='free_item'?(
              <input type="text" placeholder="e.g. Masala Papad"
                value={newOffer.freeItem} onChange={e=>setNewOffer(p=>({...p,freeItem:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}/>
            ):(
              <input type={newOffer.type==='happy_hour'?'time':'number'} placeholder="e.g. 20"
                value={newOffer.type==='happy_hour'?newOffer.happyStart:newOffer.value}
                onChange={e=>setNewOffer(p=>({...p,[newOffer.type==='happy_hour'?'happyStart':'value']:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.9rem',fontWeight:'900',outline:'none',boxSizing:'border-box',colorScheme:'dark'}}/>
            )}
          </div>
          {newOffer.type==='happy_hour'&&(
            <div>
              <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Happy Hour End</div>
              <input type="time" value={newOffer.happyEnd} onChange={e=>setNewOffer(p=>({...p,happyEnd:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.9rem',fontWeight:'900',outline:'none',boxSizing:'border-box',colorScheme:'dark'}}/>
            </div>
          )}
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Min Order (₹)</div>
            <input type="number" placeholder="0 = no min"
              value={newOffer.minOrder} onChange={e=>setNewOffer(p=>({...p,minOrder:e.target.value}))}
              style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div>
            <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Expires At (optional)</div>
            <input type="date" value={newOffer.expiresAt} min={new Date().toISOString().split('T')[0]}
              onChange={e=>setNewOffer(p=>({...p,expiresAt:e.target.value}))}
              style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',boxSizing:'border-box',colorScheme:'dark'}}/>
          </div>
        </div>
        <button onClick={async()=>{
          if(!newOffer.title?.trim()){showNotif('Offer title is required','error');return;}
          try{
            const payload={
              title:newOffer.title.trim(),
              type:newOffer.type,
              value:Number(newOffer.value)||0,
              freeItem:newOffer.freeItem?.trim()||undefined,
              code:newOffer.code?.trim()||undefined,
              minOrder:Number(newOffer.minOrder)||0,
              happyStart:newOffer.happyStart||undefined,
              happyEnd:newOffer.happyEnd||undefined,
              expiresAt:newOffer.expiresAt?new Date(newOffer.expiresAt).toISOString():undefined,
              isActive:true
            };
            await axios.post(`${BASE_URL}/offers/${tenantId}`,payload);
            setNewOffer({title:'',type:'percent_off',value:'',freeItem:'',code:'',minOrder:'',categoryId:'',happyStart:'',happyEnd:'',expiresAt:''});
            showNotif(`Offer "${payload.title}" created`);
            fetchOffers();
          }catch(err){showNotif(err.response?.data?.error||'Failed to create offer','error');}
        }} style={{padding:'10px 24px',background:'linear-gradient(135deg,#d3bfa2,#bda88a)',border:'none',color:'#000',borderRadius:'8px',fontWeight:'900',fontSize:'0.7rem',cursor:'pointer',letterSpacing:'0.5px',display:'flex',alignItems:'center',gap:'6px'}}>
          <Tag size={12}/> CREATE OFFER
        </button>
      </div>
    </div>
 
    {/* Offers grid */}
    {(Array.isArray(offers)?offers:[]).length===0?(
      <div style={{textAlign:'center',padding:'50px',background:'#080808',borderRadius:'13px',border:'1px dashed #141414'}}>
        <Tag size={26} color="#141414" style={{marginBottom:'12px'}}/>
        <div style={{color:'#1e1e1e',fontSize:'0.78rem',fontWeight:'700'}}>No offers yet — create one above</div>
      </div>
    ):(
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'13px'}}>
        {(Array.isArray(offers)?offers:[]).map(offer=>(
          <div key={offer._id} style={{
            background:'#080808',
            border:`1px solid ${offer.isActive?'rgba(74,222,128,0.1)':'#111'}`,
            borderTop:`2px solid ${offer.isActive?'rgba(74,222,128,0.28)':'#1a1a1a'}`,
            borderRadius:'13px',padding:'17px',opacity:offer.isActive?1:0.5,transition:'all 0.2s'
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
              <div>
                <div style={{fontSize:'0.85rem',fontWeight:'900',color:'#fff',marginBottom:'4px'}}>{offer.title}</div>
                {offer.code&&(
                  <span style={{fontSize:'0.62rem',fontWeight:'900',padding:'2px 9px',borderRadius:'5px',background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.15)',color:'#C9A84C',fontFamily:'monospace'}}>{offer.code}</span>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'3px 8px',borderRadius:'6px',background:offer.isActive?'rgba(74,222,128,0.05)':'rgba(255,255,255,0.02)',border:`1px solid ${offer.isActive?'rgba(74,222,128,0.14)':'rgba(255,255,255,0.04)'}`}}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:offer.isActive?'#4ade80':'#2a2a2a'}}/>
                <span style={{fontSize:'0.48rem',fontWeight:'900',color:offer.isActive?'#4ade80':'#2a2a2a'}}>{offer.isActive?'ACTIVE':'PAUSED'}</span>
              </div>
            </div>
 
            <div style={{display:'flex',gap:'7px',marginBottom:'12px',flexWrap:'wrap',alignItems:'center'}}>
              <span style={{fontSize:'0.72rem',fontWeight:'900',color:'#d3bfa2',padding:'4px 10px',background:'rgba(211,191,162,0.06)',border:'1px solid rgba(211,191,162,0.12)',borderRadius:'6px',fontFamily:'monospace'}}>
                {offer.type==='percent_off'?`${offer.value}% OFF`:offer.type==='fixed_off'?`₹${offer.value} OFF`:offer.type==='free_item'?`FREE: ${offer.freeItem||'Item'}`:`${offer.happyStart||'?'}–${offer.happyEnd||'?'}`}
              </span>
              {offer.minOrder>0&&<span style={{fontSize:'0.58rem',color:'#444'}}>min ₹{offer.minOrder}</span>}
              {offer.usageCount>0&&(
                <span style={{fontSize:'0.58rem',color:'#555',display:'flex',alignItems:'center',gap:'3px'}}><ShoppingCart size={9}/>{offer.usageCount} used</span>
              )}
              {offer.expiresAt&&(
                <span style={{fontSize:'0.56rem',color:new Date(offer.expiresAt)<new Date()?'#c0392b':'#555',display:'flex',alignItems:'center',gap:'3px'}}>
                  <Clock size={8}/>{new Date(offer.expiresAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                </span>
              )}
            </div>
 
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={async()=>{
                try{
                  await axios.patch(`${BASE_URL}/offers/${tenantId}/${offer._id}`,{isActive:!offer.isActive});
                  fetchOffers();
                  showNotif(`"${offer.title}" ${!offer.isActive?'activated':'paused'}`);
                }catch{showNotif('Update failed','error');}
              }} style={{flex:1,padding:'8px',background:offer.isActive?'#0d0d0d':'rgba(74,222,128,0.05)',border:offer.isActive?'1px solid #1a1a1a':'1px solid rgba(74,222,128,0.16)',color:offer.isActive?'#444':'#4ade80',borderRadius:'7px',fontSize:'0.6rem',fontWeight:'900',cursor:'pointer',transition:'all 0.15s'}}>
                {offer.isActive?'PAUSE':'ACTIVATE'}
              </button>
              <button onClick={()=>setConfirmModal({show:true,title:`Delete "${offer.title}"?`,subtitle:'This cannot be undone.',onConfirm:async()=>{try{await axios.delete(`${BASE_URL}/offers/${tenantId}/${offer._id}`);fetchOffers();showNotif(`"${offer.title}" deleted`);}catch{showNotif('Delete failed','error');}}})}
                style={{width:'34px',height:'34px',background:'transparent',border:'1px solid #1a1a1a',color:'#2a2a2a',borderRadius:'7px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(192,57,43,0.25)';e.currentTarget.style.color='#c0392b';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a1a';e.currentTarget.style.color='#2a2a2a';}}>✕</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </motion.div>
  )}
 
  {/* ══════════════════════════════════════════════════
      SUB-TAB: CAMPAIGNS
  ══════════════════════════════════════════════════ */}
  {marketingSubTab === 'campaigns' && (
  <motion.div key="campaigns-tab" initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',flexDirection:'column',gap:'20px'}}>
 
    {/* KPI */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
      {[
        {l:'Campaigns Sent', v:(Array.isArray(campaigns)?campaigns:[]).length,                                       c:'#d3bfa2', icon:<Send size={13}/>},
        {l:'Total Reached',  v:(Array.isArray(campaigns)?campaigns:[]).reduce((a,c)=>a+(c.sentCount||0),0),          c:'#4ade80', icon:<Users size={13}/>},
        {l:'Avg Reach',      v:(Array.isArray(campaigns)?campaigns:[]).length>0?Math.round((Array.isArray(campaigns)?campaigns:[]).reduce((a,c)=>a+(c.sentCount||0),0)/(Array.isArray(campaigns)?campaigns:[]).length):0, c:'#8a704d', icon:<BarChart2 size={13}/>},
      ].map((s,i)=>(
        <div key={i} style={{background:'#080808',border:'1px solid #161616',borderTop:`2px solid ${s.c}20`,borderRadius:'13px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'11px'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'7px',flexShrink:0,background:`${s.c}0d`,border:`1px solid ${s.c}1a`,display:'flex',alignItems:'center',justifyContent:'center',color:s.c}}>{s.icon}</div>
          <div>
            <div style={{fontSize:'1.3rem',fontWeight:'900',color:s.c,fontFamily:'monospace',lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:'0.48rem',color:'#333',fontWeight:'900',letterSpacing:'1px',marginTop:'3px',textTransform:'uppercase'}}>{s.l}</div>
          </div>
        </div>
      ))}
    </div>
 
    {/* Send campaign */}
    <div style={{background:'#080808',border:'1px solid #161616',borderRadius:'16px',overflow:'hidden'}}>
      <div style={{padding:'15px 20px',borderBottom:'1px solid #111',background:'#060606',display:'flex',alignItems:'center',gap:'9px'}}>
        <Send size={13} color="#d3bfa2"/>
        <div>
          <div style={{fontSize:'0.58rem',color:'#d3bfa2',fontWeight:'900',letterSpacing:'2px'}}>SEND PUSH CAMPAIGN</div>
          <div style={{fontSize:'0.52rem',color:'#2a2a2a',marginTop:'1px'}}>Push notification to customer segments who opted in</div>
        </div>
      </div>
      <div style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:'14px'}}>
 
        {/* Segment selector */}
        <div>
          <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'8px',textTransform:'uppercase'}}>Target Segment</div>
          <div style={{display:'flex',gap:'7px',flexWrap:'wrap'}}>
            {[
              {id:'all',     label:'All Customers',    icon:<Users size={11}/>,       desc:'Everyone who opted in'},
              {id:'loyal',   label:'Loyal',            icon:<Star size={11}/>,        desc:'6+ visits'},
              {id:'at-risk', label:'At Risk',          icon:<AlertTriangle size={11}/>,desc:'No visit in 30 days'},
              {id:'new',     label:'New',              icon:<UserPlus size={11}/>,    desc:'1–2 visits'},
            ].map(seg=>{
              const isActive=newCampaign.segment===seg.id;
              return(
                <button key={seg.id} onClick={()=>setNewCampaign(p=>({...p,segment:seg.id}))}
                  title={seg.desc}
                  style={{
                    display:'flex',alignItems:'center',gap:'6px',
                    padding:'8px 14px',borderRadius:'8px',cursor:'pointer',
                    border:isActive?'none':'1px solid #1a1a1a',
                    background:isActive?'linear-gradient(135deg,#d3bfa2,#bda88a)':'#0d0d0d',
                    color:isActive?'#000':'#444',fontSize:'0.65rem',fontWeight:'900',transition:'all 0.15s'
                  }}>
                  {seg.icon}{seg.label}
                </button>
              );
            })}
          </div>
        </div>
 
        {/* Title */}
        <div>
          <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Notification Title *</div>
          <input type="text" placeholder="e.g. Weekend Special 🎉"
            value={newCampaign.title} onChange={e=>setNewCampaign(p=>({...p,title:e.target.value}))}
            style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',fontWeight:'700',outline:'none',boxSizing:'border-box'}}/>
        </div>
 
        {/* Body */}
        <div>
          <div style={{fontSize:'0.48rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',display:'flex',justifyContent:'space-between',textTransform:'uppercase'}}>
            <span>Message *</span><span style={{color:'#2a2a2a'}}>{newCampaign.body.length}/200</span>
          </div>
          <textarea rows={3} maxLength={200}
            placeholder="e.g. 20% off your next visit this weekend. Show this notification to our staff."
            value={newCampaign.body} onChange={e=>setNewCampaign(p=>({...p,body:e.target.value}))}
            style={{width:'100%',padding:'9px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.78rem',outline:'none',resize:'vertical',fontFamily:'inherit',lineHeight:1.5,boxSizing:'border-box'}}/>
        </div>
 
        {/* Preview */}
        {(newCampaign.title||newCampaign.body)&&(
          <div style={{background:'#0a0a0a',border:'1px solid #141414',borderRadius:'10px',padding:'12px'}}>
            <div style={{fontSize:'0.46rem',color:'#2a2a2a',fontWeight:'900',letterSpacing:'1px',marginBottom:'9px',textTransform:'uppercase'}}>Push Preview</div>
            <div style={{background:'#1a1c22',borderRadius:'10px',padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:'10px'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'7px',flexShrink:0,background:'rgba(211,191,162,0.1)',border:'1px solid rgba(211,191,162,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem'}}>🔔</div>
              <div>
                <div style={{fontSize:'0.72rem',fontWeight:'800',color:'#fff',marginBottom:'2px'}}>{newCampaign.title||'Notification title'}</div>
                <div style={{fontSize:'0.62rem',color:'#888',lineHeight:1.4}}>{newCampaign.body||'Your message here'}</div>
                <div style={{fontSize:'0.52rem',color:'#2a2a2a',marginTop:'5px'}}>Pratyeksha · now</div>
              </div>
            </div>
          </div>
        )}
 
        <button disabled={campaignSending} onClick={async()=>{
          if(!newCampaign.title?.trim()||!newCampaign.body?.trim()){showNotif('Title and message are required','error');return;}
          setCampaignSending(true);
          try{
            await axios.post(`${BASE_URL}/campaigns/${tenantId}`,{
              title:newCampaign.title.trim(),
              body:newCampaign.body.trim(),
              segment:newCampaign.segment||'all',
              customPhones:newCampaign.customPhones||''
            });
            setNewCampaign({title:'',body:'',segment:'all',customPhones:''});
            showNotif('Campaign sent successfully!','success');
            fetchCampaigns();
          }catch(err){showNotif(err.response?.data?.error||'Failed to send','error');}
          finally{setCampaignSending(false);}
        }} style={{
          padding:'11px 24px',
          background:campaignSending?'#111':'linear-gradient(135deg,#d3bfa2,#bda88a)',
          border:'none',color:campaignSending?'#333':'#000',
          borderRadius:'8px',fontWeight:'900',fontSize:'0.7rem',
          cursor:campaignSending?'not-allowed':'pointer',
          display:'flex',alignItems:'center',gap:'6px',letterSpacing:'0.5px',
          alignSelf:'flex-start',transition:'all 0.2s'
        }}>
          <Send size={12}/>{campaignSending?'SENDING…':'SEND CAMPAIGN'}
        </button>
      </div>
    </div>
 
    {/* Campaign history */}
    <div style={{background:'#080808',border:'1px solid #161616',borderRadius:'14px',overflow:'hidden'}}>
      <div style={{padding:'13px 18px',borderBottom:'1px solid #111',background:'#060606',display:'flex',alignItems:'center',gap:'8px'}}>
        <Clock size={12} color="#8a704d"/>
        <div style={{fontSize:'0.56rem',color:'#8a704d',fontWeight:'900',letterSpacing:'1.5px'}}>SEND HISTORY</div>
        <span style={{marginLeft:'auto',fontSize:'0.52rem',color:'#2a2a2a'}}>{(Array.isArray(campaigns)?campaigns:[]).length} campaigns</span>
      </div>
      {(Array.isArray(campaigns)?campaigns:[]).length===0?(
        <div style={{textAlign:'center',padding:'40px',color:'#1a1a1a',fontSize:'0.72rem',fontWeight:'700'}}>No campaigns sent yet</div>
      ):(
        <div style={{padding:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
          {[...(Array.isArray(campaigns)?campaigns:[])].reverse().map(c=>(
            <div key={c._id} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'12px',borderRadius:'9px',background:'#060606',border:'1px solid #0d0d0d'}}>
              <div style={{width:'30px',height:'30px',borderRadius:'8px',flexShrink:0,background:'rgba(211,191,162,0.05)',border:'1px solid rgba(211,191,162,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Send size={11} color="#8a704d"/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'4px',gap:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'0.82rem',fontWeight:'800',color:'#fff'}}>{c.title||'Campaign'}</span>
                    <span style={{fontSize:'0.52rem',fontWeight:'900',padding:'2px 8px',borderRadius:'5px',background:'rgba(211,191,162,0.07)',border:'1px solid rgba(211,191,162,0.12)',color:'#8a704d',textTransform:'uppercase'}}>{c.segment||'all'}</span>
                  </div>
                  <span style={{fontSize:'0.58rem',color:'#2a2a2a',display:'flex',alignItems:'center',gap:'3px',flexShrink:0,whiteSpace:'nowrap'}}><Users size={8}/>{c.sentCount||0} reached</span>
                </div>
                <div style={{fontSize:'0.68rem',color:'#555',lineHeight:1.5,marginBottom:'4px'}}>{c.body||c.message||''}</div>
                <div style={{fontSize:'0.54rem',color:'#2a2a2a'}}>{new Date(c.createdAt||Date.now()).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </motion.div>
  )}
 
</motion.div>
)}
 

          {/* ── BILLING ── */}
          {activeTab==='billing' && (
            <motion.div key="billing" initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',gap:'50px'}}>
              <div style={{flex:1}}>
                <div style={styles.specialModeRow}>
                  <button onClick={()=>generateBill('Takeaway')} style={selectedTable==='Takeaway'?styles.activeSpecBtn:styles.specBtn}><ShoppingBag size={16}/> DIRECT TAKEAWAY</button>
                  <button onClick={generateOnlineBill} style={selectedTable==='Online'?styles.activeSpecBtn:styles.specBtn}><Truck size={16}/> ONLINE ORDERING</button>
                </div>
{/* ── DINING FLOOR OCCUPANCY GRID ── */}
<h3 style={styles.gridLabel}>DINING FLOOR OCCUPANCY</h3>
<div style={styles.tableGrid}>
  {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => {
    const id = n.toString();
    const isOcc     = occupiedTables.includes(id);
    const hasChk    = checkoutRequests.includes(id);
    const isSel     = selectedTable === id;
    const mood      = isOcc ? getTableMood(id) : null;
    const isAcked   = acknowledgedTables[id] && (Date.now() - acknowledgedTables[id]) < 5 * 60 * 1000;
    const showAlert = mood?.level === 'critical' && !isAcked;

    // ── Timer values for this table ──────────────────────────
    const elapsedMins  = tableElapsedMap[id];           // undefined if table is free
    const timerVisible = isOcc && !isSel && elapsedMins !== undefined;
    const timerStyle   = timerVisible ? getTimerStyle(elapsedMins) : {};

    return (
      <div key={n} style={{ position: 'relative' }}>

        {/* PULSING RING for hot/critical */}
        {mood?.pulse && !isSel && !isAcked && (
          <div style={{
            position: 'absolute', inset: '-3px', borderRadius: '18px',
            border: `2px solid ${mood.level === 'critical'
              ? 'rgba(138,48,48,0.6)'
              : 'rgba(186,117,23,0.5)'}`,
            animation: 'moodPulse 1.5s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 1
          }} />
        )}

        <button
          onClick={() => generateBill(id)}
          style={{
            ...styles.tableBtn,
            transition: 'all 0.2s ease',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',                   // tighter gap — timer sits below num
            background: isSel
              ? '#d3bfa2'
              : hasChk
              ? 'rgba(211,191,162,0.15)'
              : mood
              ? mood.color
              : '#0d0d0d',
            color: isSel
              ? '#000'
              : hasChk
              ? '#d3bfa2'
              : isOcc
              ? 'rgba(211,191,162,0.7)'
              : '#333',
            border: isSel
              ? '1px solid #d3bfa2'
              : hasChk
              ? '1px dashed #d3bfa2'
              : isOcc
              ? '1px solid rgba(211,191,162,0.25)'
              : '1px solid #151515',
          }}
        >
          {/* Bill-request bell */}
          {hasChk && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <BellRing size={14} style={{ color: '#d3bfa2' }} />
            </motion.div>
          )}

          {/* Table number */}
          <span style={{ fontSize: '1rem', fontWeight: '900', lineHeight: 1 }}>
            T{n}
          </span>

          {/* ── PER-TABLE ELAPSED TIMER ── */}
          {timerVisible && (
            <span style={{
              fontSize: '0.52rem',
              letterSpacing: '0.3px',
              lineHeight: 1,
              fontFamily: 'monospace',
              ...timerStyle,
            }}>
              {formatTableTimer(elapsedMins)}
            </span>
          )}

          {/* Mood label (WARM / HOT / CRITICAL) — only when not selected */}
          {mood && !isSel && (
            <span style={{
              fontSize: '0.46rem',
              fontWeight: '900',
              letterSpacing: '0.5px',
              lineHeight: 1,
              color: mood.level === 'critical'
                ? '#c97070'
                : mood.level === 'hot'
                ? '#BA7517'
                : mood.level === 'warm'
                ? '#8a704d'
                : '#555',
            }}>
              {mood.level === 'critical'
                ? 'CRITICAL'
                : mood.level === 'hot'
                ? 'HOT'
                : mood.level === 'warm'
                ? 'WARM'
                : 'ACTIVE'}
            </span>
          )}
        </button>

        {/* ACK button for critical tables */}
        {showAlert && (
          <button
            onClick={e => {
              e.stopPropagation();
              setAcknowledgedTables(p => ({ ...p, [id]: Date.now() }));
              showNotif(`T${n} alert snoozed 5 min`, 'info');
            }}
            style={{
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(138,48,48,0.8)',
              border: 'none',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.5rem',
              fontWeight: '900',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              zIndex: 2,
            }}
          >
            ACK
          </button>
        )}
      </div>
    );
  })}
</div>
                <div style={{...styles.biCard,marginTop:'25px',borderTop:'2px solid #d3bfa2',background:'#090909',padding:'20px'}}>
  <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',textAlign:'center'}}>
    {[
      ['CASH',     dailySettlementBreakdown.cash],
      ['UPI',      dailySettlementBreakdown.upi],
      ['CARD',     dailySettlementBreakdown.card],
    ].map(([label,val])=>(
      <div key={label} style={{borderRight:'1px solid #1c1f26',paddingRight:'12px'}}>
        <small style={{...styles.statLabel,color:'#555',fontSize:'0.52rem',letterSpacing:'0.5px'}}>
          DAILY {label}
        </small>
        <div style={{fontSize:'1rem',fontWeight:'900',color:'#fff',marginTop:'4px'}}>
          ₹{Number(val).toLocaleString()}
        </div>
      </div>
    ))}

    {/* GST SPLIT */}
{/* Replace the existing CGST/SGST block in the floor settlement strip */}
{(() => {
  const cgstRate = (tenantConfig?.config?.cgstPercentage ?? 2.5) / 100;
  const sgstRate = (tenantConfig?.config?.sgstPercentage ?? 2.5) / 100;
  const totalTax = cgstRate + sgstRate;
  const gross    = dailySettlementBreakdown.gross;
  const subtotal = gross / (1 + totalTax);
  const cgst     = Math.round(subtotal * cgstRate);
  const sgst     = Math.round(subtotal * sgstRate);
  return (
    <>
      <div style={{ borderRight:'1px solid #1c1f26', paddingRight:'12px' }}>
        <small style={{...styles.statLabel, color:'#8a704d', fontSize:'0.52rem', letterSpacing:'0.5px'}}>
          CGST {(cgstRate * 100).toFixed(1)}%
        </small>
        <div style={{ fontSize:'1rem', fontWeight:'900', color:'#8a704d', marginTop:'4px' }}>
          ₹{cgst.toLocaleString()}
        </div>
      </div>
      <div style={{ borderRight:'1px solid #1c1f26', paddingRight:'12px' }}>
        <small style={{...styles.statLabel, color:'#8a704d', fontSize:'0.52rem', letterSpacing:'0.5px'}}>
          SGST {(sgstRate * 100).toFixed(1)}%
        </small>
        <div style={{ fontSize:'1rem', fontWeight:'900', color:'#8a704d', marginTop:'4px' }}>
          ₹{sgst.toLocaleString()}
        </div>
      </div>
      <div style={{ borderLeft:'2px solid #d3bfa2', paddingLeft:'12px' }}>
        <small style={{...styles.statLabel, color:'#d3bfa2', fontWeight:'900', fontSize:'0.52rem'}}>
          GROSS SETTLED
        </small>
        <div style={{ fontSize:'1.2rem', fontWeight:'900', color:'#d3bfa2', marginTop:'2px' }}>
          ₹{gross.toLocaleString()}
        </div>
        <div style={{ fontSize:'0.52rem', color:'#555', marginTop:'2px' }}>
          NET ₹{Math.round(subtotal).toLocaleString()} + GST ₹{(cgst + sgst).toLocaleString()}
        </div>
      </div>
    </>
  );
})()}
  </div>
</div>
              </div>
{tableBill && (
  <motion.div initial={{x:20,opacity:0}} animate={{x:0,opacity:1}} style={styles.receipt}>

    {/* ── HEADER ── */}
    <div style={{textAlign:'center', marginBottom:'16px'}}>
      <h4 style={{margin:0, fontSize:'0.65rem', letterSpacing:'2px', fontWeight:'800', color:'#888'}}>TAX INVOICE</h4>
      <h1 style={{margin:'5px 0', fontSize:'1.6rem', fontWeight:'900', textTransform:'uppercase',color:'#555'}}>
        {tenantConfig?.name || tenantId.split('_').join(' ')}
      </h1>
      <p style={{fontSize:'0.65rem', color:'#555', margin:'0 0 3px', fontWeight:'600'}}>
        {tableBill.address || 'Address not configured'}
      </p>
      <p style={{fontSize:'0.68rem', fontWeight:'800', margin:'2px 0'}}>
        GSTIN: {tenantConfig?.gstin || '—'}
      </p>
      {tableBill.fssaiNumber && (
        <p style={{fontSize:'0.65rem', fontWeight:'700', margin:'2px 0', color:'#666'}}>
          FSSAI: {tableBill.fssaiNumber}
        </p>
      )}
    </div>

    {/* ── BILL META ── */}
    <div style={{borderTop:'2px solid #000', borderBottom:'2px solid #000', padding:'8px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
      <div>
        <div style={{fontSize:'0.55rem', fontWeight:'900', color:'#888', letterSpacing:'1px'}}>BILL NO. (TODAY)</div>
        <div style={{fontSize:'1.1rem', fontWeight:'900'}}>#{tableBill.billNo}</div>
        <div style={{fontSize:'0.55rem', color:'#aaa', marginTop:'2px'}}>Total #{tableBill.totalBillCount}</div>
      </div>
      <div>
        <div style={{fontSize:'0.55rem', fontWeight:'900', color:'#888', letterSpacing:'1px'}}>TABLE</div>
        <div style={{fontSize:'1.1rem', fontWeight:'900'}}>{selectedTable}</div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontSize:'0.75rem', fontWeight:'800'}}>{tableBill.date}</div>
        <div style={{fontSize:'0.7rem', color:'#666'}}>{tableBill.time}</div>
      </div>
    </div>

    {/* ── ITEMS ── */}
    <div style={{padding:'6px 0'}}>
      <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.58rem', fontWeight:'900', color:'#888', marginBottom:'8px', letterSpacing:'0.5px'}}>
        <span>ITEM DESCRIPTION</span><span>TOTAL</span>
      </div>
      {tableBill.items.map((it, i) => (
        <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom:'9px', fontSize:'0.82rem'}}>
          <span style={{fontWeight:'700'}}>
            {it.quantity}x {it.name}
            {it.portion && it.portion !== 'Single' && (
              <span style={{fontSize:'0.68rem', color:'#999'}}> ({it.portion})</span>
            )}
            <br/>
            <small style={{color:'#999', fontSize:'0.65rem'}}>
              @ ₹{it.pricePerUnit
                ? Number(it.pricePerUnit).toFixed(0)
                : it.quantity > 0 ? (it.subtotal / it.quantity).toFixed(0) : '—'}
            </small>
          </span>
          <b>₹{Number(it.subtotal).toFixed(2)}</b>
        </div>
      ))}
    </div>

    {/* ── TAX BREAKDOWN ── */}
    <div style={{borderTop:'1px solid #eee', paddingTop:'12px', fontSize:'0.8rem'}}>
      <div style={styles.receiptRow}>
        <span>Subtotal (excl. tax)</span>
        <span>₹{Number(tableBill.subtotal).toFixed(2)}</span>
      </div>
      <div style={styles.receiptRow}>
        <span>CGST @ {tableBill.cgstPct}%</span>
        <span>₹{Number(tableBill.cgst).toFixed(2)}</span>
      </div>
      <div style={styles.receiptRow}>
        <span>SGST @ {tableBill.sgstPct}%</span>
        <span>₹{Number(tableBill.sgst).toFixed(2)}</span>
      </div>
      <p style={{fontSize:'0.58rem', fontStyle:'italic', marginTop:'8px', fontWeight:'700', color:'#888'}}>
        {numberToWords(Math.round(tableBill.total - (tableBill.total * (discount / 100))))}
      </p>
    </div>

    {/* ── DISCOUNT ── */}
    <div style={{borderTop:'1px dashed #ddd', marginTop:'12px', paddingTop:'12px'}}>
      <div style={styles.receiptRow}>
        <span style={{fontWeight:'900'}}>DISCOUNT %</span>
        <input type="number" value={discount}
          onChange={e => setDiscount(e.target.value)}
          style={styles.discountInput}/>
      </div>
      {discount > 0 && (
        <div style={{...styles.receiptRow, color:'#888', fontSize:'0.75rem'}}>
          <span>Discount amount</span>
          <span>- ₹{(tableBill.total * (discount / 100)).toFixed(2)}</span>
        </div>
      )}
    </div>

    {/* ── PAYMENT MODE ── */}
    <div style={{margin:'16px 0'}}>
      <div style={{display:'flex', gap:'5px', marginBottom:'16px', background:'#f5f5f5', padding:'4px', borderRadius:'10px'}}>
        <button onClick={() => setActivePaymentType('full')}
          style={activePaymentType === 'full' ? styles.activeMiniTab : styles.miniTab}>SINGLE MODE</button>
        <button onClick={() => setActivePaymentType('split')}
          style={activePaymentType === 'split' ? styles.activeMiniTab : styles.miniTab}>SPLIT BILL</button>
      </div>
      {activePaymentType === 'split' ? (
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          {[['CASH', <Banknote size={14}/>, 'cash'], ['UPI', <Smartphone size={14}/>, 'upi'], ['CARD', <CreditCard size={14}/>, 'card']].map(([lbl, ico, key]) => (
            <div key={key} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.75rem', fontWeight:'900', color:'#555'}}>
                {ico} {lbl}
              </div>
              <input type="number" placeholder="₹0" style={styles.billInput}
                value={paymentModes[key]}
                onChange={e => setPaymentModes({...paymentModes, [key]: e.target.value})}/>
            </div>
          ))}
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px'}}>
          {['cash','upi','card'].map(m => (
            <button key={m} onClick={() => setSelectedSingleMode(m)}
              style={selectedSingleMode === m ? styles.activeModeBtn : styles.modeBtn}>
              {m === 'cash' && <Banknote size={16}/>}
              {m === 'upi'  && <Smartphone size={16}/>}
              {m === 'card' && <CreditCard size={16}/>}
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* ── GRAND TOTAL ── */}
    <div style={{borderTop:'2px solid #000', paddingTop:'14px'}}>
      <div style={{display:'flex', justifyContent:'space-between', fontSize:'1.4rem', fontWeight:'900'}}>
        <span>GRAND TOTAL</span>
        <span>₹{Math.round(tableBill.total - (tableBill.total * (discount / 100)))}</span>
      </div>
      <div style={{fontSize:'0.58rem', fontWeight:'800', color:'#888', textAlign:'right', marginTop:'4px'}}>
        MODE: {activePaymentType === 'split' ? 'SPLIT PAYMENT' : selectedSingleMode.toUpperCase()}
      </div>
    </div>

    {/* ── SETTLE BUTTON ── */}
    <button onClick={settleBill}
      style={{...styles.settleBtn, marginTop:'18px', opacity: isSettling ? 0.5 : 1, cursor: isSettling ? 'not-allowed' : 'pointer'}}
      disabled={isSettling}>
      {isSettling ? 'PROCESSING...' : 'FINALIZE SETTLEMENT'}
    </button>

    <div style={{textAlign:'center', marginTop:'18px', fontSize:'0.58rem', fontWeight:'900', color:'#ccc', letterSpacing:'1px'}}>
      POWERED BY PRATYEKSHA
    </div>

  </motion.div>
)}
            </motion.div>
          )}

          {/* ── INTELLIGENCE ── */}
{activeTab === 'intelligence' && (
  <motion.div key="marketing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.insightsWrapper}>

    {(() => {
      // ── Gold-only tone palette — no green/blue/red anywhere ──
      const tone = {
        urgent:   '#d3bfa2',
        warning:  '#BA7517',
        positive: '#8a9a7e',
        info:     '#8a704d',
        neutral:  '#6a6a6a',
      };

      const monthStr = viewDate.getFullYear() + '-' + String(viewDate.getMonth() + 1).padStart(2, '0');
      const recs = []; // { id, priority(1-5), category, icon, color, title, stat:{value,label,bar?}, tag }

      // ── 1. MENU ENGINEERING ──
      if (profitabilityData.length > 0) {
        const avgSold = profitabilityData.reduce((a, b) => a + (b.totalQtySold || 0), 0) / profitabilityData.length;
        const avgMargin = profitabilityData.reduce((a, b) => a + (b.marginPct || 0), 0) / profitabilityData.length;
        const puzzles = profitabilityData.filter(d => (d.totalQtySold || 0) < avgSold && (d.marginPct || 0) >= avgMargin && d.hasRecipe);
        const plowhorses = profitabilityData.filter(d => (d.totalQtySold || 0) >= avgSold && (d.marginPct || 0) < avgMargin);
        const dogs = profitabilityData.filter(d => (d.totalQtySold || 0) < avgSold && (d.marginPct || 0) < avgMargin && d.hasRecipe);

        if (puzzles.length > 0) {
          const topPuzzle = puzzles.sort((a, b) => b.marginPct - a.marginPct)[0];
          recs.push({
            id: 'puzzle-promo', priority: 2, category: 'MENU',
            icon: <Puzzle size={16} />, color: tone.warning,
            title: `Promote "${topPuzzle.name}" — high margin, low orders`,
            stat: { value: `${topPuzzle.marginPct}%`, label: `margin · sold only ${topPuzzle.totalQtySold}× this month`, bar: topPuzzle.marginPct },
            tag: `Feature as Chef's Pick at table-side and QR menu`,
          });
        }

        if (plowhorses.length > 0) {
          const topPlow = plowhorses.sort((a, b) => b.totalQtySold - a.totalQtySold)[0];
          const suggestedPrice = Math.ceil((topPlow.sellingPrice * 1.08) / 10) * 10;
          recs.push({
            id: 'plowhorse-price', priority: 2, category: 'PRICING',
            icon: <Repeat size={16} />, color: tone.info,
            title: `"${topPlow.name}" is underpriced for its demand`,
            stat: { value: `₹${topPlow.sellingPrice} → ₹${suggestedPrice}`, label: `${topPlow.totalQtySold} sold this period at only ${topPlow.marginPct}% margin` },
            tag: `Raise price by ₹${suggestedPrice - topPlow.sellingPrice} — demand won't drop much`,
          });
        }

        if (dogs.length >= 2) {
          recs.push({
            id: 'dogs-review', priority: 3, category: 'MENU',
            icon: <XCircle size={16} />, color: tone.urgent,
            title: `${dogs.length} menu items underperform on both sales and margin`,
            stat: { value: dogs.length, label: `low-sales, low-margin dishes: ${dogs.slice(0, 2).map(d => d.name).join(', ')}` },
            tag: `Remove or merge 2-3 of these to simplify the menu`,
          });
        }
      }

      // ── 2. DEAD STOCK ──
      if (profitabilityData.length > 0) {
        const dead = profitabilityData.filter(d => !d.totalQtySold || d.totalQtySold === 0);
        if (dead.length > 0) {
          recs.push({
            id: 'dead-menu', priority: 3, category: 'MENU',
            icon: <Package size={16} />, color: tone.urgent,
            title: `${dead.length} dish${dead.length > 1 ? 'es' : ''} sold zero units this period`,
            stat: { value: 0, label: `units sold — e.g. "${dead[0].name}"` },
            tag: `Reposition on menu, run a trial promo, or retire`,
          });
        }
      }

      const deadExtras = (extraAnalytics?.items || []).filter(i => !i.totalSold || i.totalSold === 0);
      if (deadExtras.length > 0) {
        recs.push({
          id: 'dead-extras', priority: 4, category: 'EXTRAS',
          icon: <ShoppingBag size={16} />, color: tone.neutral,
          title: `${deadExtras.length} extra item${deadExtras.length > 1 ? 's' : ''} sitting unsold`,
          stat: { value: deadExtras.length, label: deadExtras.slice(0, 3).map(i => i.name).join(', ') },
          tag: `Bundle with popular dishes for a small discount`,
        });
      }

      // ── 3. WASTAGE INTELLIGENCE ──
      if (wastageAnalytics && (wastageAnalytics.totalCost || 0) > 0) {
        const totalRevAllDishes = profitabilityData.reduce((a, b) => a + (b.totalRevenue || 0), 0) + (extraAnalytics?.totalRevenue || 0);
        const wastagePct = totalRevAllDishes > 0 ? (wastageAnalytics.totalCost / totalRevAllDishes) * 100 : 0;
        const topReason = Object.entries(wastageAnalytics.byReason || {}).sort((a, b) => b[1].cost - a[1].cost)[0];

        if (wastagePct > 2) {
          recs.push({
            id: 'wastage-high', priority: 1, category: 'COST CONTROL',
            icon: <Trash2 size={16} />, color: tone.urgent,
            title: `Wastage is above the healthy 2% threshold`,
            stat: { value: `${wastagePct.toFixed(1)}%`, label: `of revenue · ₹${wastageAnalytics.totalCost.toLocaleString()} lost — mainly "${topReason?.[0] || 'various causes'}"`, bar: Math.min(100, wastagePct * 20) },
            tag: `Review purchase quantities for the top-wasted item`,
          });
        }
      }

      // ── 4. INVENTORY HEALTH ──
      if (inventory.length > 0) {
        const lowStock = inventory.filter(i => i.currentStock <= i.minThreshold && i.currentStock > 0);
        const depleted = inventory.filter(i => i.currentStock <= 0);
        if (depleted.length > 0) {
          recs.push({
            id: 'stock-depleted', priority: 1, category: 'OPERATIONS',
            icon: <AlertTriangle size={16} />, color: tone.urgent,
            title: `${depleted.length} ingredient${depleted.length > 1 ? 's' : ''} fully out of stock`,
            stat: { value: depleted.length, label: depleted.slice(0, 3).map(i => i.itemName).join(', ') },
            tag: `Restock now or hide affected dishes from menu`,
          });
        } else if (lowStock.length > 2) {
          recs.push({
            id: 'stock-low', priority: 2, category: 'OPERATIONS',
            icon: <Package size={16} />, color: tone.warning,
            title: `${lowStock.length} ingredients running low`,
            stat: { value: lowStock.length, label: lowStock.slice(0, 3).map(i => i.itemName).join(', ') },
            tag: `Place restock orders today to avoid peak-hour 86s`,
          });
        }
      }

      // ── 5. STAFF / LABOR EFFICIENCY ──
      if (staffEfficiency.length > 0) {
        const lowAttendance = staffEfficiency.filter(s => s.daysPresent < 15 && s.role !== 'Manager');
        const waiterCount = staffEfficiency.filter(s => s.role === 'Waiter').length;
        const avgRevPerWaiterHour = waiterCount > 0
          ? staffEfficiency.filter(s => s.role === 'Waiter').reduce((a, s) => a + (s.revenuePerHour || 0), 0) / waiterCount
          : 0;

        if (lowAttendance.length > 0) {
          recs.push({
            id: 'low-attendance', priority: 3, category: 'STAFF',
            icon: <Users size={16} />, color: tone.warning,
            title: `${lowAttendance.length} staff member${lowAttendance.length > 1 ? 's' : ''} with low attendance`,
            stat: { value: lowAttendance[0]?.daysPresent || 0, label: `days present — ${lowAttendance.slice(0, 2).map(s => s.name).join(', ')}` },
            tag: `Check in — may signal scheduling or burnout issues`,
          });
        }

        if (hourlyAnalytics.hourly.length > 0 && waiterCount > 0) {
          const peak = hourlyAnalytics.hourly.reduce((a, b) => b.orderCount > a.orderCount ? b : a, hourlyAnalytics.hourly[0]);
          const peakLabel = peak.hour === 0 ? '12am' : peak.hour < 12 ? `${peak.hour}am` : peak.hour === 12 ? '12pm' : `${peak.hour - 12}pm`;
          recs.push({
            id: 'staff-scheduling', priority: 3, category: 'STAFF',
            icon: <Clock size={16} />, color: '#d3bfa2',
            title: `Align shifts with your ${peakLabel} peak hour`,
            stat: { value: peak.orderCount, label: `orders at peak · ₹${Math.round(avgRevPerWaiterHour)}/hr avg per waiter` },
            tag: `Schedule senior staff during this window`,
          });
        }
      }

      // ── 6. WAITLIST / COUNTER CONVERSION ──
      if (waitlistAnalytics?.month) {
        const m = waitlistAnalytics.month;
        const total = m.total || 0;
        const walked = Math.max(0, total - (m.seated || 0) - (m.pickupSettled || 0));
        const noShowPct = total > 0 ? Math.round((walked / total) * 100) : 0;

        if (noShowPct > 15 && total >= 10) {
          recs.push({
            id: 'noshow-high', priority: 2, category: 'CUSTOMER EXPERIENCE',
            icon: <UserCheck size={16} />, color: tone.urgent,
            title: `${walked} waitlisted guests never came back`,
            stat: { value: `${noShowPct}%`, label: `walk-away rate · avg wait ${m.avgWaitMin} min`, bar: noShowPct },
            tag: m.avgWaitMin > 20 ? `Reduce wait — add small tables for 2-tops` : `Check push notification delivery (${m.notifDeliveredPct}%)`,
          });
        }

        if (m.conversionPct >= 70) {
          recs.push({
            id: 'conversion-good', priority: 5, category: 'CUSTOMER EXPERIENCE',
            icon: <ClipboardCheck size={16} />, color: tone.positive,
            title: `Strong waitlist conversion — keep it running`,
            stat: { value: `${m.conversionPct}%`, label: `convert to seated, above industry norm`, bar: m.conversionPct },
            tag: `Promote "no line, join digitally" on social media`,
          });
        }

        if ((m.preOrderRevenue || 0) > 0 && total > 0) {
          recs.push({
            id: 'preorder-push', priority: 4, category: 'CUSTOMER EXPERIENCE',
            icon: <Hourglass size={16} />, color: tone.info,
            title: `Pre-orders are working — push harder`,
            stat: { value: `₹${m.preOrderRevenue.toLocaleString()}`, label: `generated from waitlist pre-orders` },
            tag: `Make pre-order the default prompt when joining waitlist`,
          });
        }
      }

      // ── 7. CHURN / RETENTION ──
      if (trendsData?.customers?.total > 0) {
        const { total, repeat, repeatPct, avgVisits } = trendsData.customers;
        if (repeatPct < 30 && total >= 20) {
          recs.push({
            id: 'low-retention', priority: 2, category: 'CUSTOMER RETENTION',
            icon: <User size={16} />, color: tone.warning,
            title: `Most guests visit only once`,
            stat: { value: `${repeatPct}%`, label: `repeat rate · ${repeat} of ${total} customers return`, bar: repeatPct },
            tag: `Send a "we miss you" SMS 30 days after last visit`,
          });
        } else if (repeatPct >= 40) {
          recs.push({
            id: 'good-retention', priority: 5, category: 'CUSTOMER RETENTION',
            icon: <Award size={16} />, color: tone.positive,
            title: `Excellent repeat rate — formalize it`,
            stat: { value: `${repeatPct}%`, label: `repeat customers, avg ${avgVisits} visits each`, bar: repeatPct },
            tag: `Add a simple punch-card loyalty system`,
          });
        }
      }

      // ── 8. PAYMENT MODE INSIGHT ──
      if (analytics.length > 0) {
        const totalC = analytics.reduce((a, b) => a + (b.cash || 0), 0);
        const totalU = analytics.reduce((a, b) => a + (b.upi || 0), 0);
        const totalK = analytics.reduce((a, b) => a + (b.card || 0), 0);
        const grand = totalC + totalU + totalK;
        if (grand > 0) {
          const digitalPct = Math.round(((totalU + totalK) / grand) * 100);
          if (digitalPct < 40) {
            recs.push({
              id: 'low-digital', priority: 4, category: 'OPERATIONS',
              icon: <Smartphone size={16} />, color: tone.info,
              title: `Cash-heavy payments slow down billing`,
              stat: { value: `${digitalPct}%`, label: `of payments are digital`, bar: digitalPct },
              tag: `Place UPI QR codes at every table`,
            });
          }
        }
      }

      // ── 9. GST / COMPLIANCE URGENCY ──
      if (stats.revenue > 0) {
        const now = new Date();
        const nextGstr1 = new Date(now.getFullYear(), now.getMonth() + 1, 11);
        const daysToGstr1 = Math.ceil((nextGstr1 - now) / (1000 * 60 * 60 * 24));
        if (daysToGstr1 <= 5 && daysToGstr1 > 0) {
          recs.push({
            id: 'gst-deadline', priority: 1, category: 'COMPLIANCE',
            icon: <ReceiptText size={16} />, color: tone.urgent,
            title: `GSTR-1 filing due soon`,
            stat: { value: `${daysToGstr1}d`, label: `left · est. liability ₹${Math.round(stats.revenue * 0.05 / 1.05).toLocaleString()}` },
            tag: `Export GST Invoice Register and send to your CA`,
          });
        }
      }

      // ── 10. BREAK-EVEN STATUS ──
      if (profitabilityData.length > 0 && staffEfficiency.length > 0 && currentMonthAnalytics.length > 0) {
        const monthlyPayroll = staffEfficiency.reduce((a, s) => {
          const rec = monthlySalaryRecords.find(r => r.staffId?.toString() === s._id?.toString() && r.monthStr === monthStr);
          return a + (Number(rec?.baseSalary || s.baseSalary) || 0);
        }, 0);
        const totalRevenue = profitabilityData.reduce((a, b) => a + (b.totalRevenue || 0), 0) + (extraAnalytics?.totalRevenue || 0);
        const ingredientCost = profitabilityData.reduce((a, b) => a + (b.totalIngredientCost || 0), 0) + (extraAnalytics?.totalCost || 0);
        const foodCostPct = totalRevenue > 0 ? ingredientCost / totalRevenue : 0.3;
        const contributionMarginPct = 1 - foodCostPct;
        const breakEvenRevenue = contributionMarginPct > 0 ? monthlyPayroll / contributionMarginPct : 0;
        const today = new Date(new Date().getTime() + 330 * 60 * 1000);
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const isCurrentMonth = viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
        const progressPct = breakEvenRevenue > 0 ? Math.round((totalRevenue / breakEvenRevenue) * 100) : 0;

        if (isCurrentMonth && progressPct < 100 && today.getDate() > daysInMonth * 0.6) {
          const daysLeft = daysInMonth - today.getDate();
          recs.push({
            id: 'breakeven-risk', priority: 1, category: 'FINANCIAL HEALTH',
            icon: <Activity size={16} />, color: tone.urgent,
            title: `Behind break-even with ${daysLeft} days left`,
            stat: { value: `${progressPct}%`, label: `of ₹${Math.round(breakEvenRevenue).toLocaleString()} payroll target reached`, bar: progressPct },
            tag: `Run a limited-time offer to close the gap`,
          });
        } else if (isCurrentMonth && progressPct >= 100) {
          recs.push({
            id: 'breakeven-achieved', priority: 5, category: 'FINANCIAL HEALTH',
            icon: <ClipboardCheck size={16} />, color: tone.positive,
            title: `Break-even achieved this month`,
            stat: { value: `${progressPct}%`, label: `of payroll covered, ${daysInMonth - today.getDate()} days left`, bar: Math.min(100, progressPct) },
            tag: `Reinvest surplus into marketing or staff bonuses`,
          });
        }
      }

      // ── 11. PEAK / DEAD HOUR OPTIMIZATION ──
      if (hourlyAnalytics.hourly.length > 0) {
        const operatingHours = hourlyAnalytics.hourly.filter(h => h.hour >= 8 && h.hour <= 23);
        const deadHours = operatingHours.filter(h => h.orderCount === 0);
        if (deadHours.length >= 4) {
          recs.push({
            id: 'dead-hours', priority: 3, category: 'GROWTH OPPORTUNITY',
            icon: <Zap size={16} />, color: tone.warning,
            title: `${deadHours.length} operating hours see zero orders`,
            stat: { value: deadHours.length, label: `dead hours during open time` },
            tag: `Try a Happy Hour discount during the slowest window`,
          });
        }
      }

      // ── 12. AGGREGATOR OPPORTUNITY ──
      if (!aggregatorConfig?.swiggy?.enabled && !aggregatorConfig?.zomato?.enabled && stats.revenue > 0) {
        recs.push({
          id: 'aggregator-opportunity', priority: 3, category: 'GROWTH OPPORTUNITY',
          icon: <Globe size={16} />, color: tone.info,
          title: `Not yet live on Swiggy or Zomato`,
          stat: { value: `₹${Math.round(stats.revenue * 0.15).toLocaleString()}+`, label: `potential added revenue from aggregators` },
          tag: `Enable from Settings → Aggregator Config`,
        });
      }

      // ── 13. REVENUE TREND ──
      if (stats.avg > 0 && trendsData?.revenue) {
        const { growthPct } = trendsData.revenue;
        if (growthPct !== null && Number(growthPct) < -5) {
          recs.push({
            id: 'revenue-decline', priority: 1, category: 'FINANCIAL HEALTH',
            icon: <TrendingDown size={16} />, color: tone.urgent,
            title: `Revenue is down vs last month`,
            stat: { value: `${growthPct}%`, label: `change from ${trendsData.revenue.previousMonthLabel}` },
            tag: `Review what changed — pricing, footfall, or menu`,
          });
        }
      }

      // ── 14. SLOW TABLE TURN ──
      if (trendsData?.tables?.slowest && trendsData.tables.overallAvgDwell > 0) {
        const slow = trendsData.tables.slowest;
        if (slow.avgDwell > trendsData.tables.overallAvgDwell * 1.4) {
          recs.push({
            id: 'slow-table', priority: 3, category: 'OPERATIONS',
            icon: <Clock size={16} />, color: tone.warning,
            title: `Table ${slow.table} holds guests far longer than average`,
            stat: { value: `${slow.avgDwell}m`, label: `avg dwell vs ${trendsData.tables.overallAvgDwell}m restaurant average` },
            tag: `Check seating comfort or service speed at this table`,
          });
        }
      }

      // ── 15. SLOW KITCHEN CATEGORY ──
      if (prepTimeData?.byCategory?.length > 0) {
        const slowest = prepTimeData.byCategory[0];
        if (slowest.avgPrep > 18) {
          recs.push({
            id: 'slow-prep', priority: 2, category: 'OPERATIONS',
            icon: <ChefHat size={16} />, color: tone.warning,
            title: `"${slowest.category}" items are slow to prepare`,
            stat: { value: `${slowest.avgPrep}m`, label: `avg prep time across ${slowest.count} orders`, bar: Math.min(100, slowest.avgPrep * 3) },
            tag: `Pre-prep components ahead of peak hours`,
          });
        }
      }

      // ── 16. EXTRA ITEMS LOW MARGIN ──
      if (extraAnalytics?.items?.length > 0) {
        const lowMarginExtras = extraAnalytics.items.filter(i => i.totalSold > 5 && i.margin < 25);
        if (lowMarginExtras.length > 0) {
          const worst = lowMarginExtras.sort((a, b) => a.margin - b.margin)[0];
          recs.push({
            id: 'extras-margin', priority: 4, category: 'EXTRAS',
            icon: <Percent size={16} />, color: tone.info,
            title: `"${worst.name}" sells well but earns little`,
            stat: { value: `${worst.margin}%`, label: `margin despite ${worst.totalSold} units sold`, bar: worst.margin },
            tag: `Renegotiate supplier cost or raise the price slightly`,
          });
        }
      }

      // ══════════════════════════════════════════════════════════════════════
// ADD THESE NEW RECOMMENDATION BLOCKS — insert after recommendation #16
// (extra items low margin) and BEFORE the "// ── SORT BY PRIORITY ──" line.
// All use the same `recs.push()` pattern, `tone` palette, and existing
// data sources already loaded in the component.
// ══════════════════════════════════════════════════════════════════════

      // ── 17. CATEGORY PERFORMANCE GAP ──
      if (Object.keys(categoryRankings).length > 1) {
        const catEntries = Object.entries(categoryRankings)
          .map(([key, m]) => ({ key, ...m }))
          .filter(c => c.totalSoldInCategory > 0)
          .sort((a, b) => b.totalSoldInCategory - a.totalSoldInCategory);
        if (catEntries.length >= 2) {
          const top = catEntries[0];
          const bottom = catEntries[catEntries.length - 1];
          if (top.totalSoldInCategory > bottom.totalSoldInCategory * 4) {
            recs.push({
              id: 'category-imbalance', priority: 3, category: 'MENU',
              icon: <Layers size={16} />, color: tone.warning,
              title: `"${(bottom.category || bottom.key).replace('cat_', '').replace(/_/g, ' ')}" category is barely selling`,
              stat: { value: bottom.totalSoldInCategory, label: `units vs ${top.totalSoldInCategory} in "${(top.category || top.key).replace('cat_', '').replace(/_/g, ' ')}"` },
              tag: `Cross-promote weak category items as combos with bestsellers`,
            });
          }
        }
      }

      // ── 18. WEEKEND VS WEEKDAY IMBALANCE ──
      if (hourlyAnalytics.dayOfWeek.length > 0) {
        const weekendDays = hourlyAnalytics.dayOfWeek.filter(d => ['Sat', 'Sun'].includes(d.day));
        const weekdayDays = hourlyAnalytics.dayOfWeek.filter(d => !['Sat', 'Sun'].includes(d.day));
        const weekendAvg = weekendDays.length > 0 ? weekendDays.reduce((a, b) => a + b.revenue, 0) / weekendDays.length : 0;
        const weekdayAvg = weekdayDays.length > 0 ? weekdayDays.reduce((a, b) => a + b.revenue, 0) / weekdayDays.length : 0;
        if (weekdayAvg > 0 && weekendAvg > 0 && weekdayAvg < weekendAvg * 0.5) {
          recs.push({
            id: 'weekday-slump', priority: 2, category: 'GROWTH OPPORTUNITY',
            icon: <Calendar size={16} />, color: tone.warning,
            title: `Weekdays earn far less than weekends`,
            stat: { value: `₹${Math.round(weekdayAvg).toLocaleString()}`, label: `avg/weekday vs ₹${Math.round(weekendAvg).toLocaleString()} avg/weekend`, bar: Math.round((weekdayAvg / weekendAvg) * 100) },
            tag: `Launch a "Weekday Special" combo to even out demand`,
          });
        }
      }

      // ── 19. PROCUREMENT — ITEMS RUNNING OUT SOON ──
      if (procurementData.length > 0) {
        const critical = procurementData.filter(p => p.daysRemaining !== null && p.daysRemaining <= 3 && p.daysRemaining >= 0);
        if (critical.length > 0) {
          recs.push({
            id: 'procurement-critical', priority: 1, category: 'OPERATIONS',
            icon: <Truck size={16} />, color: tone.urgent,
            title: `${critical.length} ingredient${critical.length > 1 ? 's' : ''} will run out within 3 days`,
            stat: { value: `${critical[0]?.daysRemaining}d`, label: `${critical[0]?.itemName} remaining at current usage rate` },
            tag: `Place purchase orders today — based on 30-day consumption trend`,
          });
        }
      }

      // ── 20. INGREDIENT COST DRIFT (WAC vs last purchase) ──
      if (inventory.length > 0) {
        const drifting = inventory.filter(i => {
          const wac = i.weightedAvgCost || i.costPrice || 0;
          const last = i.lastPurchasePrice || wac;
          if (wac <= 0) return false;
          return ((last - wac) / wac) * 100 > 15;
        });
        if (drifting.length > 0) {
          const worst = drifting.sort((a, b) => {
            const da = ((a.lastPurchasePrice - a.weightedAvgCost) / a.weightedAvgCost) * 100;
            const db = ((b.lastPurchasePrice - b.weightedAvgCost) / b.weightedAvgCost) * 100;
            return db - da;
          })[0];
          const driftPct = Math.round(((worst.lastPurchasePrice - worst.weightedAvgCost) / worst.weightedAvgCost) * 100);
          recs.push({
            id: 'cost-drift', priority: 2, category: 'COST CONTROL',
            icon: <TrendingUp size={16} />, color: tone.warning,
            title: `"${worst.itemName}" purchase price is rising fast`,
            stat: { value: `+${driftPct}%`, label: `vs weighted average cost — check supplier or switch vendor` },
            tag: `Renegotiate or source an alternate supplier`,
          });
        }
      }

      // ── 21. EXTRA ITEMS CATEGORY WINNER ──
      if (extraAnalytics?.byCategory && Object.keys(extraAnalytics.byCategory).length > 0) {
        const catList = Object.entries(extraAnalytics.byCategory).sort((a, b) => b[1].profit - a[1].profit);
        const bestCat = catList[0];
        if (bestCat && bestCat[1].profit > 0) {
          recs.push({
            id: 'extras-winner', priority: 4, category: 'EXTRAS',
            icon: <Award size={16} />, color: tone.positive,
            title: `"${bestCat[0]}" is your most profitable extra category`,
            stat: { value: `₹${Math.round(bestCat[1].profit).toLocaleString()}`, label: `profit from ${bestCat[1].sold} units sold` },
            tag: `Expand this category with 2-3 more SKUs`,
          });
        }
      }

      // ── 22. AVG ORDER VALUE OPPORTUNITY ──
      if (stats.avg > 0 && profitabilityData.length > 0) {
        const highMarginCheap = profitabilityData.filter(d => d.marginPct >= 50 && d.sellingPrice < stats.avg * 0.4 && d.totalQtySold > 0);
        if (highMarginCheap.length > 0) {
          const pick = highMarginCheap.sort((a, b) => b.marginPct - a.marginPct)[0];
          recs.push({
            id: 'upsell-addon', priority: 3, category: 'GROWTH OPPORTUNITY',
            icon: <Sparkles size={16} />, color: tone.info,
            title: `"${pick.name}" is a perfect upsell add-on`,
            stat: { value: `₹${pick.sellingPrice}`, label: `at ${pick.marginPct}% margin — train staff to suggest it` },
            tag: `Add to "would you like to add..." prompt at order time`,
          });
        }
      }

      // ── 23. RESERVATION NO-SHOW (separate from waitlist) ──
      if (reservationEntries?.length > 0) {
        const total = reservationEntries.length;
        const noShows = reservationEntries.filter(r => r.status === 'no-show').length;
        const noShowPct = total > 0 ? Math.round((noShows / total) * 100) : 0;
        if (noShowPct > 20 && total >= 5) {
          recs.push({
            id: 'reservation-noshow', priority: 3, category: 'CUSTOMER EXPERIENCE',
            icon: <CalendarClock size={16} />, color: tone.warning,
            title: `High no-show rate on table reservations`,
            stat: { value: `${noShowPct}%`, label: `of ${total} reservations today didn't arrive`, bar: noShowPct },
            tag: `Send a confirmation SMS reminder 2 hours before booking`,
          });
        }
      }

      // ── 24. STAFF OVERTIME / UNDERSTAFFING SIGNAL ──
      if (staffEfficiency.length > 0 && hourlyAnalytics.hourly.length > 0) {
        const totalOrders = hourlyAnalytics.hourly.reduce((a, b) => a + b.orderCount, 0);
        const activeStaff = staffEfficiency.filter(s => s.daysPresent > 0).length;
        const ordersPerStaff = activeStaff > 0 ? totalOrders / activeStaff : 0;
        if (ordersPerStaff > 25 && activeStaff > 0) {
          recs.push({
            id: 'understaffed', priority: 2, category: 'STAFF',
            icon: <AlertOctagon size={16} />, color: tone.warning,
            title: `Team may be stretched thin today`,
            stat: { value: Math.round(ordersPerStaff), label: `orders handled per active staff member` },
            tag: `Consider adding part-time help during peak windows`,
          });
        }
      }

      // ── 25. PREP TIME DELAY RATE ──
      if (prepTimeData && prepTimeData.totalTracked > 0) {
        const delayedPct = prepTimeData.delayedPct || 0;
        if (delayedPct > 25) {
          recs.push({
            id: 'kitchen-delays', priority: 2, category: 'OPERATIONS',
            icon: <Hourglass size={16} />, color: tone.urgent,
            title: `Over a quarter of orders are taking too long`,
            stat: { value: `${delayedPct}%`, label: `of ${prepTimeData.totalTracked} orders took 15+ min to prep`, bar: delayedPct },
            tag: `Identify bottleneck station and add prep support`,
          });
        }
      }

      // ── 26. BUSIEST HOUR KITCHEN STRAIN ──
      if (prepTimeData?.busiestHour && prepTimeData.busiestHour.avg > 15) {
        const h = prepTimeData.busiestHour.hour;
        const hLabel = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
        recs.push({
          id: 'busiest-hour-strain', priority: 3, category: 'OPERATIONS',
          icon: <Flame size={16} />, color: tone.warning,
          title: `Kitchen slows down most around ${hLabel}`,
          stat: { value: `${prepTimeData.busiestHour.avg}m`, label: `average prep time during this hour` },
          tag: `Pre-prep high-volume dishes before this window hits`,
        });
      }

      // ── 27. TABLE TURN RATE OPPORTUNITY ──
      if (trendsData?.tables?.performance?.length > 0) {
        const avgTurns = trendsData.tables.performance.reduce((a, t) => a + t.turns, 0) / trendsData.tables.performance.length;
        const underutilized = trendsData.tables.performance.filter(t => t.turns < avgTurns * 0.5);
        if (underutilized.length > 0 && trendsData.tables.performance.length >= 4) {
          recs.push({
            id: 'table-underutilized', priority: 4, category: 'OPERATIONS',
            icon: <TableProperties size={16} />, color: tone.info,
            title: `${underutilized.length} table${underutilized.length > 1 ? 's' : ''} turning far less often`,
            stat: { value: underutilized[0]?.turns || 0, label: `turns vs ${Math.round(avgTurns)} average — Table ${underutilized[0]?.table}` },
            tag: `Check if location/seating is discouraging guests`,
          });
        }
      }

      // ── 28. SPICE LEVEL / CHEF SPECIAL PERFORMANCE ──
      if (menuItems.length > 0 && profitabilityData.length > 0) {
        const chefSpecials = menuItems.filter(m => m.isChefSpecial);
        if (chefSpecials.length > 0) {
          const specialNames = new Set(chefSpecials.map(m => m.name));
          const specialPerf = profitabilityData.filter(d => specialNames.has(d.name));
          const avgSpecialSold = specialPerf.length > 0 ? specialPerf.reduce((a, b) => a + (b.totalQtySold || 0), 0) / specialPerf.length : 0;
          const avgAllSold = profitabilityData.reduce((a, b) => a + (b.totalQtySold || 0), 0) / profitabilityData.length;
          if (specialPerf.length > 0 && avgSpecialSold < avgAllSold * 0.7) {
            recs.push({
              id: 'chef-special-underperform', priority: 4, category: 'MENU',
              icon: <ChefHat size={16} />, color: tone.info,
              title: `Chef's Specials aren't outselling regular dishes`,
              stat: { value: Math.round(avgSpecialSold), label: `avg sold vs ${Math.round(avgAllSold)} restaurant-wide average` },
              tag: `Add tableside storytelling or a photo on the QR menu`,
            });
          }
        }
      }

      // ── 29. STOCK VALUE TIED UP (CAPITAL EFFICIENCY) ──
      if (inventory.length > 0 && stats.revenue > 0) {
        const totalStockValue = inventory.reduce((a, i) => a + Math.max(0, Math.round(i.currentStock * (i.weightedAvgCost || i.costPrice || 0))), 0);
        const stockToRevenueRatio = totalStockValue / stats.revenue;
        if (stockToRevenueRatio > 0.4) {
          recs.push({
            id: 'capital-tied-up', priority: 4, category: 'FINANCIAL HEALTH',
            icon: <Wallet size={16} />, color: tone.info,
            title: `A lot of cash is sitting in inventory`,
            stat: { value: `₹${totalStockValue.toLocaleString()}`, label: `tied up vs ₹${stats.revenue.toLocaleString()} monthly revenue` },
            tag: `Order smaller, more frequent batches for perishables`,
          });
        }
      }

      // ── 30. SOURCE MIX — OVER-RELIANCE ON ONE CHANNEL ──
      if (advancedStats?.sources) {
        const sourceEntries = Object.entries(advancedStats.sources).filter(([, v]) => v > 0);
        const totalSrcRev = sourceEntries.reduce((a, [, v]) => a + v, 0);
        if (totalSrcRev > 0) {
          const dominant = sourceEntries.sort((a, b) => b[1] - a[1])[0];
          const dominantPct = Math.round((dominant[1] / totalSrcRev) * 100);
          if (dominantPct > 80 && sourceEntries.length > 1) {
            recs.push({
              id: 'channel-concentration', priority: 3, category: 'GROWTH OPPORTUNITY',
              icon: <Globe size={16} />, color: tone.warning,
              title: `Over-reliant on a single revenue channel`,
              stat: { value: `${dominantPct}%`, label: `of revenue comes from "${dominant[0]}" alone`, bar: dominantPct },
              tag: `Diversify — push underused channels like takeaway or delivery`,
            });
          }
        }
      }

      // ── 31. NOTIFICATION DELIVERY FAILURE (waitlist push) ──
      if (waitlistAnalytics?.month && waitlistAnalytics.month.total >= 10) {
        const notifPct = waitlistAnalytics.month.notifDeliveredPct || 0;
        if (notifPct < 50) {
          recs.push({
            id: 'notif-failure', priority: 2, category: 'CUSTOMER EXPERIENCE',
            icon: <BellRing size={16} />, color: tone.warning,
            title: `Push notifications aren't reaching most waitlist guests`,
            stat: { value: `${notifPct}%`, label: `delivery rate — guests may be missing "table ready" alerts`, bar: notifPct },
            tag: `Prompt guests to enable notifications when joining`,
          });
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // ADD THESE NEW RECOMMENDATION BLOCKS — insert after recommendation #31
      // (notification delivery failure) and BEFORE "// ── SORT BY PRIORITY ──"
      // ══════════════════════════════════════════════════════════════════════

      // ── 32. AGGREGATOR REVENUE SHARE (only if Dyno is connected) ──
      if (aggregatorAnalytics?.enabled) {
        const aggRev = aggregatorAnalytics.combinedRevenue || 0;
        if (aggRev > 0 && stats.revenue > 0) {
          const aggPct = Math.round((aggRev / stats.revenue) * 100);
          if (aggPct > 35) {
            recs.push({
              id: 'aggregator-dependency', priority: 2, category: 'GROWTH OPPORTUNITY',
              icon: <Truck size={16} />, color: tone.warning,
              title: `Heavy reliance on Swiggy/Zomato for revenue`,
              stat: { value: `${aggPct}%`, label: `of total revenue comes from aggregators — commission cuts into margin`, bar: aggPct },
              tag: `Push dine-in/direct offers to reduce platform commission exposure`,
            });
          } else if (aggPct < 10) {
            recs.push({
              id: 'aggregator-underused', priority: 4, category: 'GROWTH OPPORTUNITY',
              icon: <Truck size={16} />, color: tone.info,
              title: `Aggregator channel is barely contributing`,
              stat: { value: `${aggPct}%`, label: `of revenue — you're live but underutilizing the channel` },
              tag: `Check item visibility, photos, and ratings on the platform`,
            });
          }
        }
      }

      // ── 33. AGGREGATOR REJECTED ORDERS ──
      if (aggregatorAnalytics?.enabled) {
        const swiggyRej = aggregatorAnalytics.swiggy?.rejectedCount || 0;
        const zomatoRej = aggregatorAnalytics.zomato?.rejectedCount || 0;
        const totalRej = swiggyRej + zomatoRej;
        if (totalRej >= 3) {
          const worse = swiggyRej >= zomatoRej ? 'Swiggy' : 'Zomato';
          recs.push({
            id: 'aggregator-rejections', priority: 2, category: 'OPERATIONS',
            icon: <XCircle size={16} />, color: tone.urgent,
            title: `${totalRej} aggregator orders rejected this month`,
            stat: { value: totalRej, label: `mostly on ${worse} — repeated rejections hurt platform ranking` },
            tag: `Review why orders are being declined — stock, capacity, or timing`,
          });
        }
      }

      // ── 34. AGGREGATOR AVG ORDER VALUE GAP ──
      if (aggregatorAnalytics?.enabled && stats.avg > 0) {
        const swiggyAOV = aggregatorAnalytics.swiggy?.avgOrderValue || 0;
        const zomatoAOV = aggregatorAnalytics.zomato?.avgOrderValue || 0;
        const aggAOV = Math.max(swiggyAOV, zomatoAOV);
        if (aggAOV > 0 && aggAOV < stats.avg * 0.7) {
          recs.push({
            id: 'aggregator-aov-gap', priority: 3, category: 'GROWTH OPPORTUNITY',
            icon: <ShoppingBag size={16} />, color: tone.info,
            title: `Online orders are smaller than dine-in`,
            stat: { value: `₹${aggAOV}`, label: `avg aggregator order vs ₹${stats.avg} dine-in average` },
            tag: `Add combo deals exclusive to Swiggy/Zomato to lift basket size`,
          });
        }
      }

      // ── 35. AGGREGATOR TOP ITEM CROSS-SELL ──
      if (aggregatorAnalytics?.enabled) {
        const swiggyTop = aggregatorAnalytics.swiggy?.topItems?.[0];
        const zomatoTop = aggregatorAnalytics.zomato?.topItems?.[0];
        const winner = swiggyTop && zomatoTop
          ? (swiggyTop.qty >= zomatoTop.qty ? swiggyTop : zomatoTop)
          : (swiggyTop || zomatoTop);
        if (winner && winner.qty >= 10) {
          recs.push({
            id: 'aggregator-bestseller', priority: 5, category: 'GROWTH OPPORTUNITY',
            icon: <Star size={16} />, color: tone.positive,
            title: `"${winner.name}" is your online bestseller`,
            stat: { value: `${winner.qty}×`, label: `ordered online — feature it as the hero image on your platform listing` },
            tag: `Use this dish in Swiggy/Zomato ad campaigns`,
          });
        }
      }

      // ── 36. NEW CUSTOMER ACQUISITION TREND ──
      if (trendsData?.customers && trendsData.customers.new > 0) {
        const { new: newCust, total } = trendsData.customers;
        const newPct = total > 0 ? Math.round((newCust / total) * 100) : 0;
        if (newPct > 70 && total >= 15) {
          recs.push({
            id: 'high-new-low-repeat', priority: 3, category: 'CUSTOMER RETENTION',
            icon: <User size={16} />, color: tone.info,
            title: `Strong new customer flow, but few return`,
            stat: { value: `${newPct}%`, label: `of guests this month are first-timers` },
            tag: `Capture phone numbers and follow up with a return offer`,
          });
        }
      }

      // ── 37. AVERAGE VISITS PER LOYAL CUSTOMER ──
      if (trendsData?.customers?.avgVisits >= 1) {
        const avgV = trendsData.customers.avgVisits;
        if (avgV >= 5) {
          recs.push({
            id: 'high-frequency-loyal', priority: 5, category: 'CUSTOMER RETENTION',
            icon: <Repeat size={16} />, color: tone.positive,
            title: `You have a strong base of frequent regulars`,
            stat: { value: `${avgV}x`, label: `average visits per customer — exceptional loyalty` },
            tag: `Introduce a VIP perk for your top 10% most frequent guests`,
          });
        }
      }

      // ── 38. INGREDIENT BREAKDOWN — SINGLE INGREDIENT DOMINATES COST ──
      if (profitabilityData.length > 0) {
        const ingredientCostMap = {};
        profitabilityData.forEach(d => {
          (d.ingredientBreakdown || []).forEach(ing => {
            ingredientCostMap[ing.name] = (ingredientCostMap[ing.name] || 0) + (ing.lineCost || 0) * (d.totalQtySold || 0);
          });
        });
        const totalIngCost = Object.values(ingredientCostMap).reduce((a, b) => a + b, 0);
        if (totalIngCost > 0) {
          const sorted = Object.entries(ingredientCostMap).sort((a, b) => b[1] - a[1]);
          const top = sorted[0];
          const topPct = Math.round((top[1] / totalIngCost) * 100);
          if (topPct > 25) {
            recs.push({
              id: 'ingredient-concentration', priority: 3, category: 'COST CONTROL',
              icon: <Package size={16} />, color: tone.warning,
              title: `"${top[0]}" drives a quarter of your food cost`,
              stat: { value: `${topPct}%`, label: `of total ingredient spend — small price changes hit hard`, bar: topPct },
              tag: `Negotiate a bulk-rate contract for this ingredient`,
            });
          }
        }
      }

      // ── 39. RECIPE COVERAGE GAP ──
      if (profitabilityData.length > 0) {
        const noRecipeCount = profitabilityData.filter(d => !d.hasRecipe).length;
        const coveragePct = Math.round(((profitabilityData.length - noRecipeCount) / profitabilityData.length) * 100);
        if (coveragePct < 60 && profitabilityData.length >= 5) {
          recs.push({
            id: 'recipe-coverage-gap', priority: 3, category: 'OPERATIONS',
            icon: <ClipboardCheck size={16} />, color: tone.info,
            title: `Most dishes have no linked recipe`,
            stat: { value: `${coveragePct}%`, label: `recipe coverage — margins for the rest are estimates, not real`, bar: coveragePct },
            tag: `Link recipes for your top 10 sellers first for accurate costing`,
          });
        }
      }

      // ── 40. DISCOUNT/MARKDOWN PATTERN (via settlement data, if discount tracked) ──
      if (analytics.length > 0) {
        const totalGross = analytics.reduce((a, b) => a + (b.revenue || 0), 0);
        // Heuristic: compare subtotal-implied vs actual when available via profitabilityData totals
        const totalListPrice = profitabilityData.reduce((a, d) => a + (d.sellingPrice * (d.totalQtySold || 0)), 0);
        if (totalListPrice > 0 && totalGross > 0) {
          const realizationPct = Math.round((totalGross / totalListPrice) * 100);
          if (realizationPct < 85 && totalListPrice > 5000) {
            recs.push({
              id: 'price-realization-gap', priority: 3, category: 'FINANCIAL HEALTH',
              icon: <Percent size={16} />, color: tone.warning,
              title: `Actual revenue trails list-price potential`,
              stat: { value: `${realizationPct}%`, label: `price realization — discounts or comps may be eating margin`, bar: realizationPct },
              tag: `Audit discount approvals over the last 2 weeks`,
            });
          }
        }
      }

      // ── 41. FIRST-HOUR VS LAST-HOUR PERFORMANCE ──
      if (hourlyAnalytics.hourly.length > 0) {
        const openHours = hourlyAnalytics.hourly.filter(h => h.orderCount > 0);
        if (openHours.length >= 3) {
          const first = openHours[0];
          const last = openHours[openHours.length - 1];
          if (last.orderCount > 0 && first.orderCount > last.orderCount * 3) {
            const fLabel = first.hour === 0 ? '12am' : first.hour < 12 ? `${first.hour}am` : first.hour === 12 ? '12pm' : `${first.hour - 12}pm`;
            recs.push({
              id: 'closing-hour-weak', priority: 4, category: 'GROWTH OPPORTUNITY',
              icon: <Clock size={16} />, color: tone.info,
              title: `Closing hours see a steep drop-off`,
              stat: { value: last.orderCount, label: `orders at close vs ${first.orderCount} at opening (${fLabel})` },
              tag: `Consider a "last call" discount to capture late footfall`,
            });
          }
        }
      }

      // ── 42. MENU SIZE VS SALES CONCENTRATION (80/20 CHECK) ──
      if (profitabilityData.length >= 10) {
        const sorted = [...profitabilityData].sort((a, b) => (b.totalQtySold || 0) - (a.totalQtySold || 0));
        const totalQty = sorted.reduce((a, b) => a + (b.totalQtySold || 0), 0);
        if (totalQty > 0) {
          const top20Count = Math.ceil(sorted.length * 0.2);
          const top20Qty = sorted.slice(0, top20Count).reduce((a, b) => a + (b.totalQtySold || 0), 0);
          const top20Pct = Math.round((top20Qty / totalQty) * 100);
          if (top20Pct > 75) {
            recs.push({
              id: 'menu-overextended', priority: 4, category: 'MENU',
              icon: <Layers size={16} />, color: tone.info,
              title: `Just ${top20Count} dishes drive ${top20Pct}% of orders`,
              stat: { value: `${sorted.length - top20Count}`, label: `other dishes contribute very little — menu may be oversized` },
              tag: `Trim the long tail to simplify kitchen ops and reduce waste`,
            });
          }
        }
      }

      // ── 43. VEG VS NON-VEG SALES SPLIT ──
      if (menuItems.length > 0 && profitabilityData.length > 0) {
        const vegNames = new Set(menuItems.filter(m => m.isVeg).map(m => m.name));
        const vegSold = profitabilityData.filter(d => vegNames.has(d.name)).reduce((a, b) => a + (b.totalQtySold || 0), 0);
        const nonVegSold = profitabilityData.filter(d => !vegNames.has(d.name)).reduce((a, b) => a + (b.totalQtySold || 0), 0);
        const totalVN = vegSold + nonVegSold;
        if (totalVN > 20) {
          const vegPct = Math.round((vegSold / totalVN) * 100);
          if (vegPct > 85 || vegPct < 15) {
            recs.push({
              id: 'veg-nonveg-skew', priority: 5, category: 'MENU',
              icon: <Sparkles size={16} />, color: tone.neutral,
              title: vegPct > 85 ? `Your guests strongly prefer vegetarian` : `Non-veg dominates your order mix`,
              stat: { value: `${vegPct}%`, label: `of dishes sold are vegetarian` },
              tag: vegPct > 85 ? `Lean into this — expand the veg menu, downsize non-veg SKUs` : `Ensure veg options are visible and appealing for mixed groups`,
            });
          }
        }
      }

      // ── 44. EXTRA ITEMS ATTACH RATE ──
      if (extraAnalytics?.totalSold > 0 && stats.avg > 0 && analytics.length > 0) {
        const totalOrders = analytics.reduce((a, b) => a + (b.count || 0), 0);
        if (totalOrders > 0) {
          const attachRate = Math.round((extraAnalytics.totalSold / totalOrders) * 100);
          if (attachRate < 15 && totalOrders >= 30) {
            recs.push({
              id: 'extras-low-attach', priority: 4, category: 'EXTRAS',
              icon: <ShoppingBag size={16} />, color: tone.info,
              title: `Extra items rarely make it onto the bill`,
              stat: { value: `${attachRate}%`, label: `attach rate — extras are sold on only a small share of orders`, bar: attachRate },
              tag: `Train waiters to suggest a drink/dessert at order time`,
            });
          }
        }
      }

      // ── 45. SALARY PAYOUT DELAY ──
      if (staffEfficiency.length > 0) {
        const unpaidCount = staffEfficiency.filter(s => {
          const rec = monthlySalaryRecords.find(r => r.staffId?.toString() === s._id?.toString() && r.monthStr === monthStr);
          return (rec?.status || s.salaryStatus) !== 'Paid';
        }).length;
        const today = new Date(new Date().getTime() + 330 * 60 * 1000);
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const isCurrentMonth = viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
        if (isCurrentMonth && unpaidCount > 0 && today.getDate() >= daysInMonth - 3) {
          recs.push({
            id: 'salary-payout-due', priority: 2, category: 'STAFF',
            icon: <Wallet size={16} />, color: tone.urgent,
            title: `${unpaidCount} staff salaries still unpaid as month closes`,
            stat: { value: unpaidCount, label: `pending payments — only ${daysInMonth - today.getDate()} days left in the month` },
            tag: `Process payroll before month-end to avoid morale issues`,
          });
        }
      }

      // ── 46. STAFF ROLE IMBALANCE (waiter-to-table ratio) ──
      if (staffEfficiency.length > 0 && tableCount > 0) {
        const activeWaiters = staffEfficiency.filter(s => s.role === 'Waiter' && s.daysPresent > 0).length;
        if (activeWaiters > 0) {
          const tablesPerWaiter = Math.round(tableCount / activeWaiters);
          if (tablesPerWaiter > 8) {
            recs.push({
              id: 'waiter-overload', priority: 3, category: 'STAFF',
              icon: <Users size={16} />, color: tone.warning,
              title: `Each waiter is covering too many tables`,
              stat: { value: tablesPerWaiter, label: `tables per active waiter — service speed may suffer` },
              tag: `Hire or cross-train a helper for floor support during peak`,
            });
          }
        }
      }

      // ── 47. PICKUP VS DINE-IN GROWTH SHIFT ──
      if (waitlistAnalytics?.month && waitlistAnalytics.month.total > 0) {
        const { dineIn, pickup } = waitlistAnalytics.month;
        const totalQ = dineIn + pickup;
        if (totalQ > 0) {
          const pickupPct = Math.round((pickup / totalQ) * 100);
          if (pickupPct > 50) {
            recs.push({
              id: 'pickup-shift', priority: 4, category: 'GROWTH OPPORTUNITY',
              icon: <PackageCheck size={16} />, color: tone.info,
              title: `Takeaway is overtaking dine-in demand`,
              stat: { value: `${pickupPct}%`, label: `of counter activity is pickup orders`, bar: pickupPct },
              tag: `Consider a dedicated pickup counter to speed up handoffs`,
            });
          }
        }
      }

      // ── 48. REPEAT WAITLIST CUSTOMERS NOT CONVERTING TO LOYALTY ──
      if (waitlistAnalytics?.month?.repeatGroups > 3 && trendsData?.customers) {
        const repeatWaitlist = waitlistAnalytics.month.repeatGroups;
        const repeatCustomers = trendsData.customers.repeat || 0;
        if (repeatWaitlist > repeatCustomers * 0.3) {
          recs.push({
            id: 'waitlist-loyalty-gap', priority: 4, category: 'CUSTOMER RETENTION',
            icon: <Repeat size={16} />, color: tone.info,
            title: `Frequent waitlist guests aren't in your loyalty data`,
            stat: { value: repeatWaitlist, label: `repeat waitlist groups — capture their phone numbers consistently` },
            tag: `Make phone capture mandatory at waitlist join`,
          });
        }
      }

      // ── 49. COST PER COVER TREND ──
      if (profitabilityData.length > 0 && trendsData?.customers?.total > 0) {
        const totalCost = profitabilityData.reduce((a, b) => a + (b.totalIngredientCost || 0), 0);
        const totalCovers = trendsData.customers.total;
        const costPerCover = totalCovers > 0 ? totalCost / totalCovers : 0;
        const avgTicket = stats.avg;
        if (costPerCover > 0 && avgTicket > 0 && (costPerCover / avgTicket) > 0.45) {
          recs.push({
            id: 'cost-per-cover-high', priority: 3, category: 'FINANCIAL HEALTH',
            icon: <Wallet size={16} />, color: tone.warning,
            title: `Food cost per guest is eating into ticket value`,
            stat: { value: `₹${Math.round(costPerCover)}`, label: `cost per cover vs ₹${avgTicket} average ticket`, bar: Math.round((costPerCover / avgTicket) * 100) },
            tag: `Review portion sizes or supplier pricing for top-cost dishes`,
          });
        }
      }

      // ── 50. SPLIT PAYMENT FREQUENCY (operational friction signal) ──
      if (analytics.length > 0) {
        const totalOrders = analytics.reduce((a, b) => a + (b.count || 0), 0);
        const cardHeavy = analytics.reduce((a, b) => a + (b.card || 0), 0);
        if (totalOrders > 20 && cardHeavy > 0 && stats.revenue > 0) {
          const cardPct = Math.round((cardHeavy / stats.revenue) * 100);
          if (cardPct > 50) {
            recs.push({
              id: 'card-dependency', priority: 5, category: 'OPERATIONS',
              icon: <CreditCard size={16} />, color: tone.neutral,
              title: `Card is your dominant payment method`,
              stat: { value: `${cardPct}%`, label: `of revenue via card — ensure backup machines/connectivity` },
              tag: `Keep a backup card reader on standby during peak hours`,
            });
          }
        }
      }

      // ── 51. MONTH-OVER-MONTH ORDER COUNT TREND ──
      if (trendsData?.revenue && currentMonthAnalytics.length > 0) {
        const currOrders = currentMonthAnalytics.reduce((a, b) => a + (b.count || 0), 0);
        const { previous, current } = trendsData.revenue;
        if (previous > 0 && current > 0) {
          const avgCurr = currOrders > 0 ? current / currOrders : 0;
          if (avgCurr > 0 && stats.avg > 0 && avgCurr < stats.avg * 0.9) {
            recs.push({
              id: 'aov-declining', priority: 3, category: 'FINANCIAL HEALTH',
              icon: <TrendingDown size={16} />, color: tone.warning,
              title: `Average order value is trending down`,
              stat: { value: `₹${Math.round(avgCurr)}`, label: `current avg vs ₹${stats.avg} typical — guests are spending less per visit` },
              tag: `Train staff on upselling and combo suggestions`,
            });
          }
        }
      }

      // ── 52. EXTRA ITEM STOCK-OUT RISK ──
      if (extraItems?.length > 0) {
        const nearOut = extraItems.filter(i => i.isAvailable && i.currentStock > 0 && i.currentStock <= (i.lowStockThreshold || 5));
        if (nearOut.length > 0) {
          recs.push({
            id: 'extras-near-stockout', priority: 3, category: 'EXTRAS',
            icon: <AlertTriangle size={16} />, color: tone.warning,
            title: `${nearOut.length} extra item${nearOut.length > 1 ? 's' : ''} about to run out`,
            stat: { value: nearOut.length, label: nearOut.slice(0, 3).map(i => i.name).join(', ') },
            tag: `Restock before they auto-hide from the menu`,
          });
        }
      }

      // ── 53. KITCHEN CATEGORY SPEED CHAMPION ──
      if (prepTimeData?.byCategory?.length > 1) {
        const fastest = [...prepTimeData.byCategory].sort((a, b) => a.avgPrep - b.avgPrep)[0];
        if (fastest && fastest.avgPrep <= 8 && fastest.count >= 10) {
          recs.push({
            id: 'fast-category', priority: 5, category: 'OPERATIONS',
            icon: <Zap size={16} />, color: tone.positive,
            title: `"${fastest.category}" is your fastest-moving category`,
            stat: { value: `${fastest.avgPrep}m`, label: `avg prep across ${fastest.count} orders — great for upselling as quick add-ons` },
            tag: `Highlight these as "ready in minutes" on the menu`,
          });
        }
      }

      // ── 54. RESERVATION PRE-ORDER ADOPTION ──
      if (reservationEntries?.length > 0) {
        const withPreorder = reservationEntries.filter(r => (r.items || []).length > 0).length;
        const preorderPct = Math.round((withPreorder / reservationEntries.length) * 100);
        if (preorderPct < 20 && reservationEntries.length >= 5) {
          recs.push({
            id: 'reservation-preorder-low', priority: 5, category: 'CUSTOMER EXPERIENCE',
            icon: <CalendarClock size={16} />, color: tone.neutral,
            title: `Few reservations include a pre-order`,
            stat: { value: `${preorderPct}%`, label: `of bookings pre-ordered — pre-orders speed up kitchen prep` },
            tag: `Prompt pre-ordering during the reservation flow`,
          });
        }
      }

      // ── 55. STOCK DRIFT — MULTIPLE ITEMS RISING TOGETHER (supplier-wide signal) ──
      if (inventory.length >= 5) {
        const risingCount = inventory.filter(i => {
          const wac = i.weightedAvgCost || i.costPrice || 0;
          const last = i.lastPurchasePrice || wac;
          return wac > 0 && ((last - wac) / wac) * 100 > 8;
        }).length;
        const risingPct = Math.round((risingCount / inventory.length) * 100);
        if (risingPct > 30) {
          recs.push({
            id: 'broad-cost-inflation', priority: 2, category: 'COST CONTROL',
            icon: <TrendingUp size={16} />, color: tone.warning,
            title: `Broad-based ingredient cost inflation detected`,
            stat: { value: `${risingPct}%`, label: `of stocked ingredients show rising purchase prices`, bar: risingPct },
            tag: `Consider a small, well-communicated menu price adjustment`,
          });
        }
      }

      // ── 56. ZERO-RECIPE HIGH-VOLUME DISH (costing blind spot) ──
      if (profitabilityData.length > 0) {
        const blindSpots = profitabilityData.filter(d => !d.hasRecipe && (d.totalQtySold || 0) > 20);
        if (blindSpots.length > 0) {
          const worst = blindSpots.sort((a, b) => b.totalQtySold - a.totalQtySold)[0];
          recs.push({
            id: 'costing-blindspot', priority: 2, category: 'COST CONTROL',
            icon: <AlertTriangle size={16} />, color: tone.urgent,
            title: `"${worst.name}" sells a lot but has no real cost data`,
            stat: { value: worst.totalQtySold, label: `units sold with only an estimated margin — true profitability unknown` },
            tag: `Link its recipe this week to know your real margin`,
          });
        }
      }

      // ── 57. AGGREGATOR DAILY TREND MOMENTUM ──
      if (aggregatorAnalytics?.enabled) {
        const platforms = ['swiggy', 'zomato'].filter(p => aggregatorAnalytics[p]?.dailyTrend?.length >= 6);
        platforms.forEach(p => {
          const trend = aggregatorAnalytics[p].dailyTrend;
          const recent = trend.slice(-3).reduce((a, b) => a + b.revenue, 0);
          const earlier = trend.slice(0, 3).reduce((a, b) => a + b.revenue, 0);
          if (earlier > 0 && recent < earlier * 0.5) {
            recs.push({
              id: `${p}-momentum-drop`, priority: 3, category: 'GROWTH OPPORTUNITY',
              icon: <TrendingDown size={16} />, color: tone.warning,
              title: `${p.charAt(0).toUpperCase() + p.slice(1)} orders have slowed recently`,
              stat: { value: `₹${recent.toLocaleString()}`, label: `last 3 days vs ₹${earlier.toLocaleString()} earlier in the period` },
              tag: `Check listing visibility, ratings, or run a platform promo`,
            });
          }
        });
      }

      // ── 58. CHURNED HIGH-VALUE CUSTOMER SIGNAL (heuristic via spend concentration) ──
      if (trendsData?.customers?.total > 10 && trendsData.customers.repeatPct > 0) {
        const { repeat, total } = trendsData.customers;
        if (repeat > 0 && repeat < total * 0.15) {
          recs.push({
            id: 'thin-loyal-base', priority: 3, category: 'CUSTOMER RETENTION',
            icon: <User size={16} />, color: tone.warning,
            title: `Very few customers form your loyal base`,
            stat: { value: repeat, label: `out of ${total} customers return — most revenue depends on new traffic` },
            tag: `A loyalty program could meaningfully stabilize revenue`,
          });
        }
      }

      // ── 59. INVENTORY ITEMS NEVER PURCHASED RECENTLY (stale data flag) ──
      if (inventory.length > 0) {
        const staleItems = inventory.filter(i => {
          if (!i.lastPurchaseDate) return false;
          const daysSince = (Date.now() - new Date(i.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > 45 && i.currentStock > 0;
        });
        if (staleItems.length >= 3) {
          recs.push({
            id: 'stale-purchase-data', priority: 5, category: 'OPERATIONS',
            icon: <Package size={16} />, color: tone.neutral,
            title: `${staleItems.length} ingredients haven't been repurchased in 45+ days`,
            stat: { value: staleItems.length, label: `items — verify stock counts are still accurate` },
            tag: `Do a physical stock audit for these items`,
          });
        }
      }

      // ── 60. OVERALL MARGIN HEALTH CHECK ──
      if (profitabilityData.length > 0) {
        const totalRev = profitabilityData.reduce((a, b) => a + (b.totalRevenue || 0), 0);
        const totalProfit = profitabilityData.reduce((a, b) => a + (b.grossProfit || 0), 0);
        const overallMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;
        if (overallMargin >= 55 && totalRev > 10000) {
          recs.push({
            id: 'strong-overall-margin', priority: 5, category: 'FINANCIAL HEALTH',
            icon: <Award size={16} />, color: tone.positive,
            title: `Your overall gross margin is excellent`,
            stat: { value: `${overallMargin}%`, label: `blended margin across the full menu — well above industry norm`, bar: overallMargin },
            tag: `This is a strong position to invest in marketing growth`,
          });
        } else if (overallMargin > 0 && overallMargin < 25 && totalRev > 10000) {
          recs.push({
            id: 'weak-overall-margin', priority: 2, category: 'FINANCIAL HEALTH',
            icon: <AlertTriangle size={16} />, color: tone.urgent,
            title: `Overall margin is thinner than ideal`,
            stat: { value: `${overallMargin}%`, label: `blended margin — target is typically 30-40% for this segment`, bar: overallMargin },
            tag: `Audit portion sizes and pricing across the top 10 sellers`,
          });
        }
      }

      // ── SORT BY PRIORITY ──
      recs.sort((a, b) => a.priority - b.priority);

      const urgentCount = recs.filter(r => r.priority === 1).length;
      const opportunityCount = recs.filter(r => r.priority <= 2).length;
      const healthScore = Math.max(0, Math.min(100, 100 - (urgentCount * 15) - (recs.filter(r => r.priority === 2).length * 7)));
      const healthColor = healthScore >= 70 ? tone.positive : healthScore >= 40 ? tone.warning : tone.urgent;

      return (
        <>
          {/* ═══ HERO: BUSINESS HEALTH SCORE ═══ */}
          <div style={{
            background: 'linear-gradient(135deg, #0f0f0f 0%, #161616 100%)',
            border: '1px solid rgba(211,191,162,0.15)',
            borderRadius: '20px', padding: '32px', marginBottom: '24px',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(211,191,162,0.06) 0%, transparent 70%)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', position: 'relative' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Sparkles size={20} color="#d3bfa2" />
                  <span style={{ fontSize: '0.62rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                    GROWTH COMMAND CENTER
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>
                  {urgentCount > 0
                    ? `${urgentCount} thing${urgentCount > 1 ? 's' : ''} need your attention today`
                    : opportunityCount > 0
                    ? `${opportunityCount} growth opportunit${opportunityCount > 1 ? 'ies' : 'y'} identified`
                    : `Operations are running smoothly`}
                </h2>
                <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#666', maxWidth: '520px', lineHeight: 1.6 }}>
                  Analyzed across menu engineering, wastage, staffing, customer retention, waitlist conversion, and financial health for {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.
                </p>
              </div>

              {/* Health score dial */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{
                  width: '110px', height: '110px', borderRadius: '50%',
                  background: `conic-gradient(${healthColor} ${healthScore * 3.6}deg, #1a1a1a 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                }}>
                  <div style={{
                    width: '88px', height: '88px', borderRadius: '50%', background: '#0f0f0f',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: '900', color: healthColor }}>
                      {healthScore}
                    </span>
                    <span style={{ fontSize: '0.48rem', color: '#444', fontWeight: '900', letterSpacing: '1px' }}>HEALTH SCORE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stat strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '28px' }}>
              {[
                { l: 'URGENT ITEMS', v: urgentCount, c: urgentCount > 0 ? tone.urgent : tone.positive },
                { l: 'OPPORTUNITIES FOUND', v: recs.length, c: '#d3bfa2' },
                { l: 'MONTHLY REVENUE', v: `₹${stats.revenue.toLocaleString()}`, c: '#fff' },
                { l: 'REPEAT RATE', v: `${stats.loyaltyRate}%`, c: stats.loyaltyRate >= 35 ? tone.positive : tone.warning },
              ].map(s => (
                <div key={s.l} style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(211,191,162,0.06)' }}>
                  <div style={{ fontSize: '0.5rem', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '5px' }}>{s.l}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ URGENT ACTIONS (priority 1) ═══ */}
          {recs.filter(r => r.priority === 1).length > 0 && (
            <>
              <SectionHeader icon={<AlertOctagon size={16} />} title="Needs Action Today" subtitle="These directly affect revenue or compliance — address first" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                {recs.filter(r => r.priority === 1).map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} urgent />
                ))}
              </div>
            </>
          )}

          {/* ═══ HIGH-IMPACT OPPORTUNITIES (priority 2) ═══ */}
          {recs.filter(r => r.priority === 2).length > 0 && (
            <>
              <SectionHeader icon={<TrendingUp size={16} />} title="High-Impact Opportunities" subtitle="Meaningful revenue or efficiency gains, act within the week" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                {recs.filter(r => r.priority === 2).map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} />
                ))}
              </div>
            </>
          )}

          {/* ═══ OPTIMIZATION SUGGESTIONS (priority 3) ═══ */}
          {recs.filter(r => r.priority === 3).length > 0 && (
            <>
              <SectionHeader icon={<Lightbulb size={16} />} title="Optimization Suggestions" subtitle="Worth scheduling into your monthly review" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                {recs.filter(r => r.priority === 3).map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} />
                ))}
              </div>
            </>
          )}

          {/* ═══ STRATEGIC / LONGER-TERM (priority 4) ═══ */}
          {recs.filter(r => r.priority === 4).length > 0 && (
            <>
              <SectionHeader icon={<Globe size={16} />} title="Strategic Considerations" subtitle="Bigger initiatives — plan over weeks, not days" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                {recs.filter(r => r.priority === 4).map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} />
                ))}
              </div>
            </>
          )}

          {/* ═══ WINS / WHAT'S WORKING (priority 5) ═══ */}
          {recs.filter(r => r.priority === 5).length > 0 && (
            <>
              <SectionHeader icon={<Award size={16} />} title="What's Working Well" subtitle="Protect and double down on these strengths" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                {recs.filter(r => r.priority === 5).map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} positive />
                ))}
              </div>
            </>
          )}

          {recs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.4 }}>
              <Sparkles size={32} color="#444" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '0.85rem', color: '#666' }}>Gathering more data to generate recommendations. Check back after a few days of operations.</p>
            </div>
          )}
        </>
      );
    })()}
  </motion.div>
)}

         {/* ── INSIGHTS ── */}
{/* ── INSIGHTS TAB ── */}
{activeTab === 'insights' && (
<motion.div
  key="insights"
  initial={{ opacity: 0, y: 14 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px', width: '100%' }}
>

{/* ════════════════════════════════════════
    SECTION HEADER COMPONENT (inline helper)
════════════════════════════════════════ */}
{(() => {
  // Reusable premium section header used throughout this tab
  const SH = ({ icon, title, sub }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      margin: '36px 0 18px', paddingBottom: '14px',
      borderBottom: '1px solid rgba(211,191,162,0.1)'
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d3bfa2'
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2px' }}>{title}</div>
        {sub && <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px', fontWeight: '500' }}>{sub}</div>}
      </div>
    </div>
  );

  // Reusable stat card
  const SC = ({ label, value, sub, c = '#fff', accent = false }) => (
    <div style={{
      background: accent ? 'rgba(211,191,162,0.07)' : '#070707',
      border: `1px solid ${accent ? 'rgba(211,191,162,0.25)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '13px', padding: '15px 17px', display: 'flex', flexDirection: 'column', gap: '4px'
    }}>
      <div style={{ fontSize: '0.46rem', fontWeight: '900', color: 'rgba(255,255,255,0.22)', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: c, fontFamily: 'monospace', letterSpacing: '-0.5px', lineHeight: 1.05 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', fontWeight: '500' }}>{sub}</div>}
    </div>
  );

  // Reusable biCard container
  const BC = ({ children, style = {} }) => (
    <div style={{
      background: '#080808', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px', padding: '20px', ...style
    }}>{children}</div>
  );

  // Reusable biTitle
  const BT = ({ icon, children, right }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '18px', paddingBottom: '13px',
      borderBottom: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d3bfa2' }}>
        {icon}
        <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2px', textTransform: 'uppercase' }}>{children}</span>
      </div>
      {right && <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700' }}>{right}</div>}
    </div>
  );

  const todayRev = currentMonthAnalytics.find(d => d._id === istTodayStr)?.revenue || 0;
  const monthOrders = currentMonthAnalytics.reduce((a, b) => a + (b.count || 0), 0);

  return (
    <>

    {/* ════ AI BRAIN PANEL ════ */}
    {aiBrain && (
      <div style={{
        background: 'linear-gradient(135deg, #08080a 0%, #0d0b00 100%)',
        border: '1px solid rgba(211,191,162,0.2)', borderRadius: '18px',
        padding: '20px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={15} color="#d3bfa2" strokeWidth={1.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2.5px' }}>PRATYEKSHA INTELLIGENCE</div>
              <div style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.35)', marginTop: '2px' }}>{aiBrain.dayOfWeek} · AI-powered daily forecast</div>
            </div>
          </div>
          <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
          {[
            { icon: <Flame size={13} color="#d3bfa2" strokeWidth={1.5} />, label: 'Expected Orders', value: aiBrain.predictedOrders ?? '—' },
            { icon: <ReceiptIndianRupee size={13} color="#d3bfa2" strokeWidth={1.5} />, label: 'Est. Revenue', value: `₹${(aiBrain.predictedRevenue || 0).toLocaleString()}` },
            { icon: <Clock3 size={13} color="#d3bfa2" strokeWidth={1.5} />, label: 'Peak Window', value: aiBrain.peakWindow ?? '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{
              background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.1)',
              borderRadius: '11px', padding: '13px', textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{icon}</div>
              <div style={{ color: '#d3bfa2', fontWeight: '900', fontSize: '0.92rem', letterSpacing: '-0.3px' }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.48rem', marginTop: '3px', letterSpacing: '0.3px' }}>{label}</div>
            </div>
          ))}
        </div>

        {aiBrain.risks?.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.48rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertTriangle size={9} color="rgba(248,113,113,0.6)" strokeWidth={2} />
              STOCK RISKS
            </div>
            {aiBrain.risks.slice(0, 3).map(r => (
              <div key={r.itemName} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', marginBottom: '5px',
                background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <AlertTriangle size={11} color="#f87171" strokeWidth={2} />
                  <span style={{ color: '#f87171', fontSize: '0.68rem', fontWeight: '700' }}>{r.itemName} may run short</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontFamily: 'monospace' }}>
                  {r.required}{r.unit} needed · {r.currentStock}{r.unit} left
                </span>
              </div>
            ))}
          </div>
        )}

        {aiBrain.ingredientRequirements?.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', fontWeight: '900', letterSpacing: '2px', marginBottom: '9px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Package size={9} color="rgba(255,255,255,0.2)" strokeWidth={2} />
              TODAY'S PREP ESTIMATES
            </div>
            {aiBrain.ingredientRequirements.slice(0, 5).map(ing => (
              <div key={ing.itemName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>{ing.itemName}</span>
                <span style={{ color: '#d3bfa2', fontSize: '0.7rem', fontWeight: '800', fontFamily: 'monospace' }}>{ing.required?.toFixed(1)} {ing.unit}</span>
              </div>
            ))}
          </div>
        )}

        {!aiBrain.risks?.length && !aiBrain.ingredientRequirements?.length && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 12px', background: 'rgba(211,191,162,0.03)', border: '1px solid rgba(211,191,162,0.07)', borderRadius: '8px' }}>
            <CheckCircle2 size={12} color="rgba(211,191,162,0.4)" strokeWidth={2} />
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.66rem' }}>All ingredients sufficient for today's predicted volume.</span>
          </div>
        )}
      </div>
    )}

    {/* ════ KPI STRIP ════ */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px,1fr))', gap: '10px', marginBottom: '24px' }}>
      <SC label="Monthly Revenue"  value={`₹${stats.revenue.toLocaleString()}`}   sub={viewDate.toLocaleString('en-IN',{month:'short',year:'numeric'})} accent c="#d3bfa2" />
      <SC label="Today Revenue"    value={`₹${todayRev.toLocaleString()}`}         sub="Live settlements" />
      <SC label="Total Orders"     value={monthOrders.toLocaleString()}             sub="Settled bills this month" />
      <SC label="Avg Order Value"  value={`₹${stats.avg}`}                         sub="Per settled bill" />
      <SC label="Loyalty Rate"     value={`${stats.loyaltyRate}%`}                 sub={`${trendsData?.customers?.repeat||0} of ${trendsData?.customers?.total||0} repeat`} />
    </div>

    {/* ════ SMART DIGEST ════ */}
    <div style={{
      background: '#080808', border: '1px solid rgba(211,191,162,0.15)',
      borderLeft: '3px solid #d3bfa2', borderRadius: '14px',
      padding: '18px 20px', marginBottom: '24px',
      display: 'flex', gap: '14px', alignItems: 'flex-start'
    }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Sparkles size={14} color="#d3bfa2" strokeWidth={1.5} />
      </div>
      <div>
        <div style={{ fontSize: '0.48rem', fontWeight: '900', color: 'rgba(211,191,162,0.4)', letterSpacing: '2px', marginBottom: '7px' }}>SMART DIGEST</div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', fontWeight: '400', lineHeight: 1.65 }}>{insightsData.digest}</p>
      </div>
    </div>

    {/* ════ GST + P&L ════ */}
    {stats.revenue > 0 && (() => {
      const monthlyRevenue      = stats.revenue;
      const cgst5               = monthlyRevenue * 0.025;
      const sgst5               = monthlyRevenue * 0.025;
      const totalGst5           = cgst5 + sgst5;
      const netRevenueAfterGst5 = monthlyRevenue - totalGst5;
      const ingredientCost      = profitabilityData.reduce((a,b)=>a+(b.totalIngredientCost||0),0) + (extraAnalytics?.totalCost||0);
      const monthStr            = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
      const payrollCost         = staffEfficiency.reduce((a,s)=>{
        const rec = monthlySalaryRecords.find(r=>r.staffId?.toString()===s._id?.toString()&&r.monthStr===monthStr);
        return a + (Number(rec?.baseSalary||s.baseSalary)||0);
      },0);
      const grossAfterGst = netRevenueAfterGst5 - ingredientCost;
      const netAfterAll   = grossAfterGst - payrollCost;
      const estimatedAnnual = monthlyRevenue * 12;
      const isCompositionEligible = estimatedAnnual < 15000000;
      const now = new Date();
      const nextGstr1  = new Date(now.getFullYear(), now.getMonth()+1, 11);
      const nextGstr3B = new Date(now.getFullYear(), now.getMonth()+1, 20);
      const daysToGstr1  = Math.ceil((nextGstr1 - now)/86400000);
      const daysToGstr3B = Math.ceil((nextGstr3B - now)/86400000);

      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>

          {/* GST Card */}
          <BC>
            <BT icon={<ReceiptText size={14} strokeWidth={1.5}/>} right={viewDate.toLocaleString('en-IN',{month:'short',year:'numeric'}).toUpperCase()}>
              GST LIABILITY
            </BT>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { l:'CGST @ 2.5%',  v:Math.round(cgst5),              c:'rgba(255,255,255,0.8)' },
                { l:'SGST @ 2.5%',  v:Math.round(sgst5),              c:'rgba(255,255,255,0.8)' },
                { l:'TOTAL GST DUE',v:Math.round(totalGst5),          c:'#fff', bold:true },
                { l:'NET REVENUE',  v:Math.round(netRevenueAfterGst5), c:'rgba(211,191,162,0.7)' },
              ].map(s=>(
                <div key={s.l} style={{ padding:'12px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                  <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'6px' }}>{s.l}</div>
                  <div style={{ fontSize: s.bold?'1rem':'0.9rem', fontWeight:'900', color:s.c, fontFamily:'monospace' }}>₹{s.v.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Revenue bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display:'flex', height:'7px', borderRadius:'4px', overflow:'hidden', gap:'1px' }}>
                <div style={{ flex:1, background:'rgba(211,191,162,0.35)', borderRadius:'4px 0 0 4px' }} title={`Net: ₹${Math.round(netRevenueAfterGst5).toLocaleString()}`} />
                <div style={{ width:'2.5%', background:'#c9a84c' }} />
                <div style={{ width:'2.5%', background:'#bda88a', borderRadius:'0 4px 4px 0' }} />
              </div>
              <div style={{ display:'flex', gap:'14px', marginTop:'6px' }}>
                {[{c:'rgba(211,191,162,0.35)',l:'Net Revenue'},{c:'#c9a84c',l:'CGST'},{c:'#bda88a',l:'SGST'}].map(s=>(
                  <div key={s.l} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                    <div style={{ width:'7px', height:'7px', borderRadius:'2px', background:s.c, flexShrink:0 }} />
                    <span style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.25)', fontWeight:'600' }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filing deadlines */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
              {[
                { label:'GSTR-1', desc:'Outward supplies', date:nextGstr1.toLocaleDateString('en-IN',{day:'numeric',month:'short'}), days:daysToGstr1 },
                { label:'GSTR-3B', desc:'Summary + payment', date:nextGstr3B.toLocaleDateString('en-IN',{day:'numeric',month:'short'}), days:daysToGstr3B },
              ].map(s=>(
                <div key={s.label} style={{ padding:'11px 13px', background: s.days<=5?'rgba(248,113,113,0.05)':'rgba(255,255,255,0.02)', border:`1px solid ${s.days<=5?'rgba(248,113,113,0.2)':'rgba(255,255,255,0.06)'}`, borderRadius:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                    <span style={{ fontSize:'0.65rem', fontWeight:'900', color: s.days<=5?'#f87171':'#d3bfa2' }}>{s.label}</span>
                    <span style={{ fontSize:'0.48rem', fontWeight:'900', padding:'2px 7px', borderRadius:'4px', background: s.days<=5?'rgba(248,113,113,0.1)':'rgba(211,191,162,0.06)', color: s.days<=5?'#f87171':'rgba(211,191,162,0.5)' }}>{s.days}d</span>
                  </div>
                  <div style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.2)' }}>{s.desc}</div>
                  <div style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.35)', fontWeight:'700', marginTop:'3px' }}>Due {s.date}</div>
                </div>
              ))}
            </div>

            {/* Composition eligibility */}
            <div style={{ padding:'10px 12px', background: isCompositionEligible?'rgba(211,191,162,0.04)':'rgba(211,191,162,0.03)', border:`1px solid ${isCompositionEligible?'rgba(211,191,162,0.15)':'rgba(211,191,162,0.08)'}`, borderRadius:'8px', display:'flex', gap:'8px', alignItems:'flex-start' }}>
              <Lightbulb size={12} color="rgba(211,191,162,0.5)" strokeWidth={1.8} style={{ marginTop:'1px', flexShrink:0 }} />
              <div>
                <div style={{ fontSize:'0.5rem', color: isCompositionEligible?'#d3bfa2':'rgba(211,191,162,0.5)', fontWeight:'900', marginBottom:'3px' }}>
                  {isCompositionEligible ? 'COMPOSITION SCHEME ELIGIBLE' : 'REGULAR GST REGIME'}
                </div>
                <div style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.3)', lineHeight:1.5 }}>
                  Est. annual ₹{Math.round(estimatedAnnual/100000).toLocaleString()}L ·{' '}
                  {isCompositionEligible ? 'Consult your CA about simplified filing.' : 'Annual turnover exceeds ₹1.5Cr threshold.'}
                </div>
              </div>
            </div>
          </BC>

          {/* P&L Card */}
          <BC>
            <BT icon={<TrendingUp size={14} strokeWidth={1.5}/>}>P&L SUMMARY</BT>
            {[
              { l:'TOTAL REVENUE',            v:monthlyRevenue,           sign:'',  bold:false },
              { l:'— GST PAID (5%)',           v:-totalGst5,               sign:'-', bold:false },
              { l:'NET REVENUE',              v:netRevenueAfterGst5,      sign:'',  bold:true  },
              { l:'— INGREDIENT COST',         v:-ingredientCost,          sign:'-', bold:false },
              { l:'GROSS PROFIT',             v:grossAfterGst,            sign:'',  bold:true  },
              ...(payrollCost>0?[
                { l:'— STAFF PAYROLL',         v:-payrollCost,             sign:'-', bold:false },
                { l:'NET PROFIT',             v:netAfterAll,              sign:'',  bold:true, net:true },
              ]:[])
            ].map((s,i)=>(
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding: s.bold?'9px 11px':'6px 11px', marginBottom: s.bold?'4px':'0',
                background: s.bold?'rgba(255,255,255,0.025)':'transparent',
                border: s.bold?'1px solid rgba(255,255,255,0.05)':'none',
                borderRadius: s.bold?'8px':'0',
                borderBottom: !s.bold?'1px solid rgba(255,255,255,0.04)':undefined,
              }}>
                <span style={{ fontSize: s.bold?'0.62rem':'0.6rem', color: s.bold?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.25)', fontWeight:'800', letterSpacing:'0.3px' }}>{s.l}</span>
                <span style={{ fontSize: s.bold?'0.88rem':'0.75rem', fontWeight:'900', fontFamily:'monospace', color: s.net ? (netAfterAll>=0?'#d3bfa2':'rgba(248,113,113,0.8)') : s.bold?'#d3bfa2':'rgba(255,255,255,0.6)' }}>
                  {s.sign&&s.v<0?'-':''}₹{Math.abs(Math.round(s.v)).toLocaleString()}
                </span>
              </div>
            ))}

            {/* Profit & Loss bar */}
            {profitabilityData.length > 0 && (() => {
              const totalRev2 = profitabilityData.reduce((a,b)=>a+(b.totalRevenue||0),0);
              const totalCost2 = profitabilityData.reduce((a,b)=>a+(b.totalIngredientCost||0),0);
              const fcPct = totalRev2>0 ? Math.round((totalCost2/totalRev2)*100) : 0;
              return (
                <div style={{ marginTop:'14px', padding:'12px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'9px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px' }}>FOOD COST RATIO</span>
                    <span style={{ fontSize:'0.55rem', fontWeight:'900', color: fcPct>40?'rgba(240,165,0,0.8)':'rgba(211,191,162,0.7)', fontFamily:'monospace' }}>{fcPct}%</span>
                  </div>
                  <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(fcPct,100)}%`, background: fcPct>40?'rgba(240,165,0,0.6)':'rgba(211,191,162,0.5)', borderRadius:'3px', transition:'width 0.4s ease' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
                    <span style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.15)' }}>IDEAL &lt;35%</span>
                    <span style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.15)' }}>HIGH &gt;40%</span>
                  </div>
                </div>
              );
            })()}
          </BC>
        </div>
      );
    })()}

    {/* ════════════════════════════════
        SECTION 1 — TODAY'S PULSE
    ════════════════════════════════ */}
    <SectionHeader
      icon={<Activity size={16}/>}
      title={(() => {
        const istNow = new Date(new Date().getTime() + 330*60*1000);
        const isCurr = viewDate.getFullYear()===istNow.getFullYear() && viewDate.getMonth()===istNow.getMonth();
        return isCurr ? "Today's Pulse" : `${viewDate.toLocaleString('default',{month:'long'})} Pulse`;
      })()}
      subtitle="Live operational signals — act on these now"
    />

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>

      {/* Peak Hour */}
      <BC>
        <BT icon={<Timer size={14} strokeWidth={1.5}/>}>PEAK HOUR INTENSITY</BT>
        {hourlyAnalytics.hourly.length > 0 ? (() => {
          const maxO = Math.max(...hourlyAnalytics.hourly.map(d=>d.orderCount),1);
          const peak = hourlyAnalytics.hourly.reduce((a,b)=>b.orderCount>a.orderCount?b:a, hourlyAnalytics.hourly[0]);
          const total = hourlyAnalytics.hourly.reduce((a,b)=>a+b.orderCount,0);
          const totalRev = hourlyAnalytics.hourly.reduce((a,b)=>a+b.revenue,0);
          const fmt = h => h===0?'12am':h===12?'12pm':h<12?`${h}am`:`${h-12}pm`;
          const colBar = c => { const r=c/maxO; return r===0?'rgba(255,255,255,0.04)':r<0.25?'rgba(211,191,162,0.15)':r<0.5?'rgba(211,191,162,0.35)':r<0.75?'rgba(211,191,162,0.6)':'#d3bfa2'; };
          const operatingHours = hourlyAnalytics.hourly.filter(h=>h.hour>=8&&h.hour<=23);
          const deadHours = operatingHours.filter(h=>h.orderCount===0);
          const avgRevPerHour = total>0 ? Math.round(totalRev/Math.max(1,operatingHours.filter(h=>h.orderCount>0).length)) : 0;
          const peakRevenue = hourlyAnalytics.hourly.find(h=>h.hour===peak?.hour)?.revenue||0;
          const topHours = [...hourlyAnalytics.hourly].sort((a,b)=>b.revenue-a.revenue).slice(0,3);
          const slowHours = operatingHours.filter(h=>h.orderCount>0&&h.orderCount<(maxO*0.25));

          return (
            <>
              {/* KPI mini strip */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
                {[
                  { l:'TOTAL ORDERS', v:`${total}` },
                  { l:'PEAK HOUR',    v:fmt(peak?.hour||0) },
                  { l:'DEAD HOURS',   v:`${deadHours.length}h`, c: deadHours.length>4?'rgba(240,165,0,0.7)':'rgba(211,191,162,0.7)' }
                ].map(s=>(
                  <div key={s.l} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'9px', padding:'10px 11px' }}>
                    <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1px', marginBottom:'4px' }}>{s.l}</div>
                    <div style={{ fontSize:'0.88rem', fontWeight:'900', color: s.c||'#d3bfa2', fontFamily:'monospace' }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div style={{ position:'relative', height:'65px', marginBottom:'4px' }}>
                <div style={{ display:'flex', alignItems:'flex-end', gap:'2px', height:'65px' }}>
                  {hourlyAnalytics.hourly.map(d=>(
                    <div key={d.hour} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end' }}>
                      <div
                        title={`${fmt(d.hour)}: ${d.orderCount} orders · ₹${d.revenue}`}
                        style={{ width:'100%', minWidth:0, height:`${Math.max(3,Math.round((d.orderCount/maxO)*100))}%`, background:colBar(d.orderCount), borderRadius:'3px 3px 0 0', position:'relative' }}>
                        {d.hour===peak?.hour && (
                          <div style={{ position:'absolute', top:'-14px', left:'50%', transform:'translateX(-50%)', fontSize:'0.44rem', color:'#d3bfa2', fontWeight:'900', whiteSpace:'nowrap' }}>PEAK</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:'2px', marginBottom:'14px' }}>
                {hourlyAnalytics.hourly.map(d=>(
                  <div key={d.hour} style={{ flex:1, textAlign:'center', fontSize:'0.42rem', color: d.hour%3===0?'rgba(255,255,255,0.2)':'transparent', minWidth:0 }}>
                    {fmt(d.hour)}
                  </div>
                ))}
              </div>

              {/* Top revenue hours */}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'13px', marginBottom:'12px' }}>
                <div style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'9px', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Award size={10} color="#d3bfa2" />
                  TOP REVENUE HOURS
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px' }}>
                  {topHours.map((h,i)=>(
                    <div key={h.hour} style={{
                      background:'rgba(255,255,255,0.02)',
                      border:`1px solid ${i===0?'rgba(211,191,162,0.3)':'rgba(255,255,255,0.06)'}`,
                      borderTop:`2px solid ${i===0?'#d3bfa2':i===1?'rgba(211,191,162,0.4)':'rgba(255,255,255,0.1)'}`,
                      borderRadius:'9px', padding:'10px'
                    }}>
                      <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', marginBottom:'4px' }}>{i===0?'1ST':i===1?'2ND':'3RD'}</div>
                      <div style={{ fontSize:'0.95rem', fontWeight:'900', color: i===0?'#d3bfa2':'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>{fmt(h.hour)}</div>
                      <div style={{ fontSize:'0.65rem', color:'rgba(211,191,162,0.6)', fontWeight:'800', marginTop:'2px' }}>₹{h.revenue.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {slowHours.length > 0 && (
                <div style={{ padding:'9px 11px', background:'rgba(240,165,0,0.04)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:'8px', display:'flex', gap:'7px', alignItems:'flex-start' }}>
                  <Zap size={11} color="rgba(240,165,0,0.6)" strokeWidth={2} style={{ flexShrink:0, marginTop:'1px' }} />
                  <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.3)', lineHeight:1.55 }}>
                    Slow hours: {slowHours.slice(0,3).map(h=>fmt(h.hour)).join(', ')} — consider happy hour promos
                  </span>
                </div>
              )}
            </>
          );
        })() : (
          <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.7rem', paddingTop:'40px', paddingBottom:'20px' }}>No orders today</div>
        )}
      </BC>

      {/* Counter & Waitlist */}
      <BC>
        <BT icon={<Users size={14} strokeWidth={1.5}/>}>COUNTER & WAITLIST — TODAY</BT>
        {waitlistAnalytics ? (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
              {[
                { l:'GROUPS TODAY',  v:waitlistAnalytics.today.total,   c:'#d3bfa2',  icon:<Users size={13}/> },
                { l:'SEATED',        v:waitlistAnalytics.today.seated,  c:'rgba(211,191,162,0.7)', icon:<UserCheck size={13}/> },
                { l:'PICKUP',        v:waitlistAnalytics.today.pickup,  c:'rgba(255,255,255,0.5)', icon:<ShoppingBag size={13}/> },
                { l:'STILL WAITING', v:waitlistAnalytics.today.waiting, c:'rgba(240,165,0,0.7)',   icon:<Timer size={13}/> },
              ].map(s=>(
                <div key={s.l} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'11px', padding:'13px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'7px', color:s.c }}>{s.icon}<span style={{ fontSize:'0.44rem', fontWeight:'900', letterSpacing:'1.2px' }}>{s.l}</span></div>
                  <div style={{ fontSize:'1.5rem', fontWeight:'900', color:s.c, lineHeight:1, fontFamily:'monospace' }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
              <div style={{ padding:'11px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1px', marginBottom:'5px' }}>WALK-AWAYS</div>
                <div style={{ fontSize:'1.15rem', fontWeight:'900', color: waitlistAnalytics.today.walked>0?'rgba(248,113,113,0.7)':'rgba(211,191,162,0.5)', fontFamily:'monospace' }}>
                  {waitlistAnalytics.today.walked}
                </div>
              </div>
              <div style={{ padding:'11px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1px', marginBottom:'5px' }}>AVG WAIT (MONTH)</div>
                <div style={{ fontSize:'1.15rem', fontWeight:'900', fontFamily:'monospace', color: waitlistAnalytics.month.avgWaitMin<15?'rgba(211,191,162,0.7)':waitlistAnalytics.month.avgWaitMin<25?'rgba(255,255,255,0.6)':'rgba(248,113,113,0.6)' }}>
                  {waitlistAnalytics.month.avgWaitMin}m
                </div>
              </div>
            </div>

            {waitlistAnalytics.month.peakHour && (
              <div style={{ padding:'9px 12px', background:'rgba(211,191,162,0.04)', border:'1px solid rgba(211,191,162,0.1)', borderRadius:'8px', fontSize:'0.62rem', color:'rgba(255,255,255,0.3)' }}>
                Peak arrival this month:&nbsp;
                <span style={{ color:'#d3bfa2', fontWeight:'900' }}>
                  {waitlistAnalytics.month.peakHour.hour===0?'12am':waitlistAnalytics.month.peakHour.hour<12?`${waitlistAnalytics.month.peakHour.hour}am`:waitlistAnalytics.month.peakHour.hour===12?'12pm':`${waitlistAnalytics.month.peakHour.hour-12}pm`}
                </span>
                &nbsp;· {waitlistAnalytics.month.peakHour.count} groups
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.7rem', paddingTop:'40px', paddingBottom:'20px' }}>No waitlist data</div>
        )}
      </BC>
    </div>

    {/* ════════════════════════════════
        SECTION 2 — REVENUE & GROWTH
    ════════════════════════════════ */}
    <SectionHeader icon={<TrendingUp size={16}/>} title="Revenue & Growth" subtitle="How money is moving — month over month" />

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>

      {/* Revenue Trend */}
      <BC>
        <BT icon={<TrendingUp size={14} strokeWidth={1.5}/>}>REVENUE TREND</BT>
        {trendsData?.revenue ? (() => {
          const { current, previous, growthPct } = trendsData.revenue;
          const isPos = growthPct !== null && Number(growthPct) >= 0;
          const todayRevCalc = hourlyAnalytics.hourly.reduce((a,b)=>a+(b.revenue||0),0);
          return (
            <>
              {[
                { l:'This month',   v:current,      c:'#fff' },
                { l:'Last month',   v:previous,     c:'rgba(255,255,255,0.4)' },
                { l:'Today so far', v:todayRevCalc, c:'#d3bfa2' },
              ].map(s=>(
                <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.3)' }}>{s.l}</span>
                  <span style={{ fontWeight:'900', color:s.c, fontFamily:'monospace' }}>₹{(s.v||0).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', marginBottom:'14px' }}>
                <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.3)' }}>Growth (MoM)</span>
                {growthPct !== null ? (
                  <span style={{ fontSize:'0.82rem', fontWeight:'900', padding:'4px 11px', borderRadius:'6px', display:'inline-flex', alignItems:'center', gap:'5px', background: isPos?'rgba(211,191,162,0.08)':'rgba(248,113,113,0.08)', color: isPos?'#d3bfa2':'rgba(248,113,113,0.8)' }}>
                    {isPos ? <ArrowUp size={12}/> : <ArrowDown size={12}/>} {isPos?'+':''}{growthPct}%
                  </span>
                ) : <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.2)' }}>No prior data</span>}
              </div>

              {/* Payment mode split */}
              {(() => {
                const totalC = analytics.reduce((a,b)=>a+(b.cash||0),0);
                const totalU = analytics.reduce((a,b)=>a+(b.upi||0),0);
                const totalK = analytics.reduce((a,b)=>a+(b.card||0),0);
                const grand = totalC + totalU + totalK;
                if (grand === 0) return null;
                const modes = [
                  { label:'Cash', val:totalC, color:'rgba(211,191,162,0.8)', pct:Math.round((totalC/grand)*100) },
                  { label:'UPI',  val:totalU, color:'rgba(211,191,162,0.5)', pct:Math.round((totalU/grand)*100) },
                  { label:'Card', val:totalK, color:'rgba(211,191,162,0.3)', pct:Math.round((totalK/grand)*100) },
                ];
                return (
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'13px' }}>
                    <div style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'9px' }}>PAYMENT SPLIT</div>
                    <div style={{ display:'flex', height:'7px', borderRadius:'4px', overflow:'hidden', marginBottom:'10px', gap:'1px' }}>
                      {modes.map(m=><div key={m.label} style={{ width:`${m.pct}%`, background:m.color }}/>)}
                    </div>
                    {modes.map(m=>(
                      <div key={m.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'0.66rem', color:'rgba(255,255,255,0.35)' }}>
                          <div style={{ width:'7px', height:'7px', borderRadius:'2px', background:m.color, flexShrink:0 }} /> {m.label}
                        </span>
                        <span style={{ fontSize:'0.7rem', fontWeight:'900', color:'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>₹{m.val.toLocaleString()} <small style={{ color:'rgba(255,255,255,0.2)' }}>({m.pct}%)</small></span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          );
        })() : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.7rem', paddingTop:'30px' }}>No data yet</div>}
      </BC>

      {/* Weekly Performance */}
      <BC>
        <BT icon={<Calendar size={14} strokeWidth={1.5}/>}>WEEKLY PERFORMANCE</BT>
        {hourlyAnalytics.dayOfWeek.length > 0 ? (() => {
          const maxR = Math.max(...hourlyAnalytics.dayOfWeek.map(d=>d.revenue),1);
          const peak = hourlyAnalytics.dayOfWeek.reduce((a,b)=>b.revenue>a.revenue?b:a, hourlyAnalytics.dayOfWeek[0]);
          const weak = hourlyAnalytics.dayOfWeek.reduce((a,b)=>b.revenue<a.revenue?b:a, hourlyAnalytics.dayOfWeek[0]);
          const totalWeekRev = hourlyAnalytics.dayOfWeek.reduce((a,b)=>a+b.revenue,0);
          const activeDays = hourlyAnalytics.dayOfWeek.filter(d=>d.orders>0).length;
          const avgPerActiveDay = activeDays>0 ? Math.round(totalWeekRev/activeDays) : 0;
          return (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px', marginBottom:'14px' }}>
                {[
                  { l:'BEST DAY',        v:peak.day,                          c:'#d3bfa2' },
                  { l:'AVG / ACTIVE DAY', v:`₹${avgPerActiveDay.toLocaleString()}`, c:'rgba(255,255,255,0.6)' },
                  { l:'SLOWEST DAY',     v:weak.day,                          c:'rgba(255,255,255,0.3)' },
                ].map(s=>(
                  <div key={s.l} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'9px', padding:'10px' }}>
                    <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1px', marginBottom:'4px' }}>{s.l}</div>
                    <div style={{ fontSize:'0.88rem', fontWeight:'900', color:s.c, fontFamily:'monospace' }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {hourlyAnalytics.dayOfWeek.map(d=>{
                const isPk = d.day===peak.day;
                const isWk = d.day===weak.day && d.revenue<peak.revenue;
                const avgOrd = d.orders>0 ? Math.round(d.revenue/d.orders) : 0;
                return (
                  <div key={d.day} style={{ marginBottom:'10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'3px' }}>
                      <span style={{ width:'30px', fontSize:'0.65rem', color: isPk?'#d3bfa2':isWk?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.35)', fontWeight:'800', flexShrink:0 }}>{d.day}</span>
                      <div style={{ flex:1, height:'7px', background:'rgba(255,255,255,0.05)', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.round((d.revenue/maxR)*100)}%`, background: isPk?'#d3bfa2':'rgba(211,191,162,0.25)', borderRadius:'4px', transition:'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize:'0.66rem', fontWeight:'900', color: isPk?'#d3bfa2':'rgba(255,255,255,0.5)', minWidth:'65px', textAlign:'right', fontFamily:'monospace' }}>₹{d.revenue.toLocaleString()}</span>
                    </div>
                    <div style={{ display:'flex', paddingLeft:'40px', gap:'12px' }}>
                      <span style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.2)' }}>{d.orders||0} orders</span>
                      {avgOrd>0 && <span style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.15)' }}>avg ₹{avgOrd}</span>}
                    </div>
                  </div>
                );
              })}
            </>
          );
        })() : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.7rem', paddingTop:'40px' }}>No data yet</div>}
      </BC>
    </div>

    {/* Month-end forecast */}
    {currentMonthAnalytics.length > 0 && (() => {
      const today = new Date(new Date().getTime() + 330*60*1000);
      const isCurr = viewDate.getMonth()===today.getMonth() && viewDate.getFullYear()===today.getFullYear();
      if (!isCurr) return null;
      const dayOfMonth = today.getDate();
      const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate();
      const dailyRevenues = currentMonthAnalytics.map(d=>d.revenue||0).filter(v=>v>0);
      if (!dailyRevenues.length) return null;
      const avgDaily = dailyRevenues.reduce((a,b)=>a+b,0)/dailyRevenues.length;
      const projected = stats.revenue + (avgDaily*(daysInMonth-dayOfMonth));
      const bestDay = Math.max(...dailyRevenues);
      const bestCase = stats.revenue + (bestDay*(daysInMonth-dayOfMonth));
      const daysLeft = daysInMonth - dayOfMonth;
      const progressPct = Math.round((dayOfMonth/daysInMonth)*100);
      return (
        <BC style={{ marginBottom:'14px', borderLeft:'3px solid rgba(211,191,162,0.4)' }}>
          <BT icon={<TrendingUp size={14} strokeWidth={1.5}/>} right={`${daysLeft}d remaining`}>MONTH-END FORECAST</BT>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
            {[
              { l:'CURRENT', v:`₹${stats.revenue.toLocaleString()}`, sub:`Day ${dayOfMonth}/${daysInMonth}` },
              { l:'PROJECTED', v:`₹${Math.round(projected).toLocaleString()}`, sub:`avg ₹${Math.round(avgDaily).toLocaleString()}/day`, accent:true },
              { l:'BEST CASE', v:`₹${Math.round(bestCase).toLocaleString()}`, sub:'if best day repeats' },
            ].map(s=>(
              <div key={s.l} style={{ padding:'12px 13px', background: s.accent?'rgba(211,191,162,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${s.accent?'rgba(211,191,162,0.18)':'rgba(255,255,255,0.06)'}`, borderRadius:'10px' }}>
                <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'5px' }}>{s.l}</div>
                <div style={{ fontSize:'0.95rem', fontWeight:'900', color: s.accent?'#d3bfa2':'rgba(255,255,255,0.7)', fontFamily:'monospace' }}>{s.v}</div>
                <div style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.2)', marginTop:'3px' }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
              <span style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.2)' }}>Month progress</span>
              <span style={{ fontSize:'0.5rem', color:'rgba(211,191,162,0.6)', fontWeight:'900' }}>{progressPct}% complete</span>
            </div>
            <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progressPct}%`, background:'linear-gradient(90deg, rgba(211,191,162,0.3), rgba(211,191,162,0.7))', borderRadius:'3px' }} />
            </div>
          </div>
        </BC>
      );
    })()}

    {/* Daily Heatmap */}
    <BC style={{ marginBottom:'14px' }}>
      <BT icon={<CalendarClock size={14} strokeWidth={1.5}/>} right={viewDate.toLocaleString('en-IN',{month:'long',year:'numeric'}).toUpperCase()}>
        DAILY REVENUE HEATMAP
      </BT>
      <div style={styles.calendarGridHeader}>{['S','M','T','W','T','F','S'].map((d,i)=><div key={i} style={styles.dayHeader}>{d}</div>)}</div>
      <div style={styles.calendarGrid}>{renderMonthHeatmap()}</div>
      <div style={styles.heatmapLegend}>
        <span>Less</span>
        <div style={{...styles.heatSquare,width:'12px',height:'12px',background:'#111'}}/>
        <div style={{...styles.heatSquare,width:'12px',height:'12px',background:'rgba(211,191,162,0.4)'}}/>
        <div style={{...styles.heatSquare,width:'12px',height:'12px',background:'rgba(211,191,162,1)'}}/>
        <span>More</span>
      </div>
    </BC>

    {/* ════════════════════════════════
        SECTION 3 — MENU INTELLIGENCE
    ════════════════════════════════ */}
    <SectionHeader icon={<Percent size={16}/>} title="Menu Intelligence" subtitle="Profitability, popularity, and pricing decisions" />

    {/* Dish Profitability */}
    <BC style={{ marginBottom:'14px' }}>
      <BT icon={<Percent size={14} strokeWidth={1.5}/>}>DISH PROFITABILITY</BT>
      {profitabilityData.length > 0 ? (() => {
        const totalGP  = profitabilityData.reduce((a,b)=>a+(b.grossProfit||0),0);
        const totalRev2 = profitabilityData.reduce((a,b)=>a+(b.totalRevenue||0),0);
        const totalCost2= profitabilityData.reduce((a,b)=>a+(b.totalIngredientCost||0),0);
        const ovMargin = totalRev2>0?Math.round((totalGP/totalRev2)*100):0;
        return (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'16px' }}>
              {[
                { l:'TOTAL REVENUE',   v:`₹${totalRev2.toLocaleString()}` },
                { l:'INGREDIENT COST', v:`₹${totalCost2.toLocaleString()}`, dim:true },
                { l:'GROSS PROFIT',    v:`₹${totalGP.toLocaleString()}`,    accent:true },
              ].map(s=>(
                <div key={s.l} style={{ padding:'12px 13px', background:'rgba(255,255,255,0.02)', border:`1px solid ${s.accent?'rgba(211,191,162,0.18)':'rgba(255,255,255,0.06)'}`, borderRadius:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'5px' }}>{s.l}</div>
                  <div style={{ fontSize:'0.95rem', fontWeight:'900', color: s.accent?'#d3bfa2':s.dim?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.7)', fontFamily:'monospace' }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(380px,1fr))', gap:'0 32px' }}>
              {profitabilityData.slice(0,8).map((d,idx)=>(
                <div key={d._id} style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', minWidth:'16px' }}>#{idx+1}</span>
                      <span style={{ color:'#fff', fontSize:'0.75rem', fontWeight:'700' }}>{d.name}</span>
                      {!d.hasRecipe && <span style={{ fontSize:'0.46rem', padding:'1px 5px', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.2)', borderRadius:'3px', border:'1px solid rgba(255,255,255,0.06)' }}>NO RECIPE</span>}
                    </div>
                    <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                      <span style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.25)' }}>{d.totalQtySold||0} sold</span>
                      <span style={{ fontWeight:'900', fontSize:'0.75rem', color: d.grossProfit>0?'#d3bfa2':'rgba(255,255,255,0.3)' }}>{d.realizedMarginPct??d.marginPct}%</span>
                    </div>
                  </div>
                  <div style={{ height:'3px', background:'rgba(255,255,255,0.05)', borderRadius:'2px', overflow:'hidden', marginBottom:'5px' }}>
                    <div style={{ height:'100%', width:`${Math.max(0,Math.min(100,d.marginPct))}%`, background: d.grossProfit<0?'rgba(255,255,255,0.1)':d.marginPct>60?'rgba(211,191,162,0.7)':'rgba(211,191,162,0.35)' }} />
                  </div>
                  {d.hasRecipe && (
                    <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.35)' }}>Sell ₹{d.sellingPrice}</span>
                      <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.2)' }}>Cost ₹{d.ingredientCostPerServing}</span>
                      <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.2)' }}>→ ₹{d.profit}/serving</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        );
      })() : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.7rem', paddingTop:'30px', paddingBottom:'10px' }}>Link recipes to compute margins</div>}
    </BC>

    {/* Menu Engineering Matrix */}
    {profitabilityData.length > 0 && (() => {
      const avgSold = profitabilityData.reduce((a,b)=>a+(b.totalQtySold||0),0)/profitabilityData.length;
      const avgMargin = profitabilityData.reduce((a,b)=>a+(b.marginPct||0),0)/profitabilityData.length;
      const quadrants = { STAR:[], PLOWHORSE:[], PUZZLE:[], DOG:[] };
      profitabilityData.forEach(d=>{
        const hs=(d.totalQtySold||0)>=avgSold, hm=(d.marginPct||0)>=avgMargin;
        if(hs&&hm) quadrants.STAR.push(d);
        else if(hs&&!hm) quadrants.PLOWHORSE.push(d);
        else if(!hs&&hm) quadrants.PUZZLE.push(d);
        else quadrants.DOG.push(d);
      });
      return (
        <BC style={{ marginBottom:'14px' }}>
          <BT icon={<Sparkles size={14} strokeWidth={1.5}/>}>MENU ENGINEERING MATRIX</BT>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {[
              { key:'STAR',      label:'STARS',      icon:<Star size={13}/>,    color:'rgba(211,191,162,0.9)', desc:'High popularity + High margin' },
              { key:'PLOWHORSE', label:'PLOWHORSES', icon:<Repeat size={13}/>,  color:'rgba(255,255,255,0.5)', desc:'High popularity + Low margin'  },
              { key:'PUZZLE',    label:'PUZZLES',    icon:<Puzzle size={13}/>,  color:'rgba(211,191,162,0.5)', desc:'Low popularity + High margin'  },
              { key:'DOG',       label:'DOGS',       icon:<XCircle size={13}/>, color:'rgba(255,255,255,0.25)', desc:'Low popularity + Low margin'  },
            ].map(({ key, label, icon, color, desc })=>(
              <div key={key} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderTop:`2px solid ${color}`, borderRadius:'12px', padding:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ fontSize:'0.65rem', fontWeight:'900', color, display:'flex', alignItems:'center', gap:'6px' }}>{icon} {label}</span>
                  <span style={{ fontSize:'0.48rem', padding:'2px 7px', borderRadius:'4px', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.3)', fontWeight:'900', border:'1px solid rgba(255,255,255,0.06)' }}>{quadrants[key]?.length||0}</span>
                </div>
                <div style={{ fontSize:'0.52rem', color:'rgba(255,255,255,0.2)', marginBottom:'9px', lineHeight:1.4 }}>{desc}</div>
                {(quadrants[key]||[]).slice(0,4).map((d,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.68rem' }}>
                    <span style={{ color:'rgba(255,255,255,0.55)' }}>{d.name}</span>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.62rem' }}>{d.totalQtySold||0} sold</span>
                      <span style={{ color, fontWeight:'800', fontSize:'0.62rem' }}>{d.marginPct||0}%</span>
                    </div>
                  </div>
                ))}
                {(quadrants[key]?.length||0)>4 && <div style={{ fontSize:'0.52rem', color:'rgba(255,255,255,0.15)', marginTop:'5px' }}>+{quadrants[key].length-4} more</div>}
              </div>
            ))}
          </div>
        </BC>
      );
    })()}

    {/* Dead menu items */}
    {profitabilityData.length > 0 && (() => {
      const dead = profitabilityData.filter(d=>!d.totalQtySold||d.totalQtySold===0);
      if (!dead.length) return null;
      return (
        <BC style={{ marginBottom:'14px', borderLeft:'3px solid rgba(255,255,255,0.15)' }}>
          <BT icon={<XCircle size={14} strokeWidth={1.5}/>}>DEAD MENU ITEMS — ZERO SALES</BT>
          <p style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.2)', marginTop:'-10px', marginBottom:'13px', lineHeight:1.55 }}>
            {dead.length} item{dead.length>1?'s':''} sold 0 units this period. Review pricing or remove from menu.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {dead.map(d=>(
              <span key={d._id} style={{ fontSize:'0.62rem', padding:'4px 10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'6px', color:'rgba(255,255,255,0.4)', fontWeight:'700' }}>
                {d.name} {d.sellingPrice?`· ₹${d.sellingPrice}`:''}
              </span>
            ))}
          </div>
        </BC>
      );
    })()}

    {/* Category Rankings */}
    {Object.keys(categoryRankings).length > 0 && (
      <BC style={{ marginBottom:'14px' }}>
        <BT icon={<Layers size={14} strokeWidth={1.5}/>}>CATEGORY PERFORMANCE</BT>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'12px' }}>
          {Object.entries(categoryRankings).map(([cat,m])=>(
            <div key={cat} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'15px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', paddingBottom:'10px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontWeight:'900', fontSize:'0.72rem', color:'#d3bfa2', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  {cat.replace('cat_','').replace('CAT_','')}
                </span>
                <span style={{ fontSize:'0.52rem', padding:'2px 8px', borderRadius:'4px', background:'rgba(211,191,162,0.06)', color:'rgba(211,191,162,0.5)', border:'1px solid rgba(211,191,162,0.12)', fontWeight:'800' }}>
                  {m.totalSoldInCategory} units
                </span>
              </div>
              <div style={{ marginBottom:'10px' }}>
                <div style={{ fontSize:'0.46rem', color:'rgba(211,191,162,0.4)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'6px', display:'flex', alignItems:'center', gap:'4px' }}>
                  <ArrowUp size={9}/> TOP PERFORMERS
                </div>
                {(m.topDishes||[]).map((d,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.7rem', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      <span style={{ fontSize:'0.55rem', color:'rgba(211,191,162,0.35)', minWidth:'14px' }}>#{i+1}</span>
                      <span style={{ color:'rgba(255,255,255,0.65)', fontWeight:'700' }}>{d.name}</span>
                    </div>
                    <span style={{ color:'rgba(211,191,162,0.6)', fontWeight:'900', fontSize:'0.65rem' }}>{d.sold} sold</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:'0.46rem', color:'rgba(255,255,255,0.15)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'6px', display:'flex', alignItems:'center', gap:'4px' }}>
                  <ArrowDown size={9}/> NEEDS ATTENTION
                </div>
                {(m.bottomDishes||[]).map((d,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.68rem', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color:'rgba(255,255,255,0.2)' }}>{d.name}</span>
                    <span style={{ color:'rgba(255,255,255,0.15)', fontSize:'0.62rem' }}>{d.sold} sold</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </BC>
    )}

    {/* Extra Items */}
    {extraAnalytics && extraAnalytics.totalSold > 0 && (
      <BC style={{ marginBottom:'14px' }}>
        <BT icon={<ShoppingBag size={14} strokeWidth={1.5}/>}>EXTRA ITEMS REVENUE</BT>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'16px' }}>
          {[
            { l:'REVENUE',      v:`₹${(extraAnalytics.totalRevenue||0).toLocaleString()}`, accent:true },
            { l:'COST',         v:`₹${(extraAnalytics.totalCost||0).toLocaleString()}` },
            { l:'GROSS PROFIT', v:`₹${(extraAnalytics.totalProfit||0).toLocaleString()}` },
            { l:'UNITS SOLD',   v:extraAnalytics.totalSold||0 },
          ].map(s=>(
            <div key={s.l} style={{ padding:'11px 12px', background: s.accent?'rgba(211,191,162,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${s.accent?'rgba(211,191,162,0.15)':'rgba(255,255,255,0.06)'}`, borderRadius:'10px', textAlign:'center' }}>
              <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'5px' }}>{s.l}</div>
              <div style={{ fontSize:'0.9rem', fontWeight:'900', color: s.accent?'#d3bfa2':'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ fontSize:'0.46rem', color:'rgba(255,255,255,0.2)', borderBottom:'1px solid rgba(255,255,255,0.06)', textTransform:'uppercase', letterSpacing:'1.5px' }}>
                {['Item','Category','Price','Margin','Sold','Revenue','Profit'].map(h=>(
                  <th key={h} style={{ padding:'0 12px 9px 0', textAlign:'left', fontWeight:'900' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(extraAnalytics.items||[]).filter(i=>i.totalSold>0).sort((a,b)=>b.profit-a.profit).map(item=>(
                <tr key={item._id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.72rem' }}>
                  <td style={{ padding:'9px 12px 9px 0', fontWeight:'800', color:'rgba(255,255,255,0.7)' }}>{item.name}</td>
                  <td style={{ color:'rgba(255,255,255,0.25)', paddingRight:'12px' }}>{item.category}</td>
                  <td style={{ color:'rgba(211,191,162,0.7)', fontWeight:'800', paddingRight:'12px', fontFamily:'monospace' }}>₹{item.price}</td>
                  <td style={{ paddingRight:'12px' }}>
                    <span style={{ fontSize:'0.6rem', padding:'2px 7px', borderRadius:'4px', fontWeight:'900', background: item.margin>40?'rgba(211,191,162,0.07)':'rgba(255,255,255,0.03)', color: item.margin>40?'rgba(211,191,162,0.8)':'rgba(255,255,255,0.35)', border:`1px solid ${item.margin>40?'rgba(211,191,162,0.18)':'rgba(255,255,255,0.07)'}` }}>
                      {item.margin}%
                    </span>
                  </td>
                  <td style={{ color:'rgba(255,255,255,0.4)', paddingRight:'12px' }}>{item.totalSold}</td>
                  <td style={{ color:'rgba(211,191,162,0.6)', fontWeight:'800', paddingRight:'12px', fontFamily:'monospace' }}>₹{(item.revenue||0).toLocaleString()}</td>
                  <td style={{ fontWeight:'900', fontFamily:'monospace', color: item.profit>0?'rgba(211,191,162,0.8)':'rgba(255,255,255,0.25)' }}>₹{(item.profit||0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BC>
    )}

    {/* Aggregator */}
    {aggregatorAnalytics?.enabled && (aggregatorAnalytics.swiggy || aggregatorAnalytics.zomato) && (
      <BC style={{ marginBottom:'14px' }}>
        <BT icon={<Truck size={14} strokeWidth={1.5}/>}>ONLINE AGGREGATOR REVENUE</BT>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'16px' }}>
          {[
            { l:'COMBINED REVENUE', v:`₹${(aggregatorAnalytics.combinedRevenue||0).toLocaleString()}`, accent:true },
            { l:'SWIGGY ORDERS',    v:aggregatorAnalytics.swiggy?.orderCount||0 },
            { l:'ZOMATO ORDERS',    v:aggregatorAnalytics.zomato?.orderCount||0 },
          ].map(s=>(
            <div key={s.l} style={{ padding:'12px 13px', background: s.accent?'rgba(211,191,162,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${s.accent?'rgba(211,191,162,0.15)':'rgba(255,255,255,0.06)'}`, borderRadius:'10px' }}>
              <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'5px' }}>{s.l}</div>
              <div style={{ fontSize:'0.95rem', fontWeight:'900', color: s.accent?'#d3bfa2':'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns: aggregatorAnalytics.swiggyEnabled&&aggregatorAnalytics.zomatoEnabled?'1fr 1fr':'1fr', gap:'12px' }}>
          {aggregatorAnalytics.swiggyEnabled && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,165,25,0.15)', borderTop:'2px solid rgba(255,165,25,0.5)', borderRadius:'12px', padding:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:'900', color:'rgba(252,128,25,0.8)' }}>SWIGGY</span>
                <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.25)' }}>{aggregatorAnalytics.swiggy?.orderCount||0} orders</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                {[{l:'REVENUE',v:`₹${(aggregatorAnalytics.swiggy?.revenue||0).toLocaleString()}`},{l:'AVG ORDER',v:`₹${aggregatorAnalytics.swiggy?.avgOrderValue||0}`}].map(s=>(
                  <div key={s.l} style={{ padding:'9px', background:'rgba(255,255,255,0.03)', borderRadius:'8px' }}>
                    <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', marginBottom:'4px' }}>{s.l}</div>
                    <div style={{ fontSize:'0.85rem', fontWeight:'900', color:'rgba(255,255,255,0.65)', fontFamily:'monospace' }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {aggregatorAnalytics.zomatoEnabled && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(203,32,45,0.15)', borderTop:'2px solid rgba(203,32,45,0.5)', borderRadius:'12px', padding:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:'900', color:'rgba(203,32,45,0.8)' }}>ZOMATO</span>
                <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.25)' }}>{aggregatorAnalytics.zomato?.orderCount||0} orders</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                {[{l:'REVENUE',v:`₹${(aggregatorAnalytics.zomato?.revenue||0).toLocaleString()}`},{l:'AVG ORDER',v:`₹${aggregatorAnalytics.zomato?.avgOrderValue||0}`}].map(s=>(
                  <div key={s.l} style={{ padding:'9px', background:'rgba(255,255,255,0.03)', borderRadius:'8px' }}>
                    <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', marginBottom:'4px' }}>{s.l}</div>
                    <div style={{ fontSize:'0.85rem', fontWeight:'900', color:'rgba(255,255,255,0.65)', fontFamily:'monospace' }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </BC>
    )}

    {/* ════════════════════════════════
        SECTION 4 — OPERATIONS
    ════════════════════════════════ */}
    <SectionHeader icon={<Layers size={16}/>} title="Operations & Resources" subtitle="Tables, staff, and inventory health" />

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
      {/* Table Performance */}
      <BC>
        <BT icon={<Layers size={14} strokeWidth={1.5}/>}>TABLE PERFORMANCE</BT>
        {trendsData?.tables?.performance?.length > 0 ? trendsData.tables.performance.slice(0,5).map(t=>{
          const mx = trendsData.tables.performance[0]?.revenue||1;
          const pct = Math.round((t.revenue/mx)*100);
          return (
            <div key={t.table} style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                <span style={{ color:'rgba(255,255,255,0.65)', fontWeight:'800', fontSize:'0.72rem' }}>Table {t.table}</span>
                <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.25)' }}>{t.turns} turns</span>
                  <span style={{ color:'rgba(211,191,162,0.7)', fontWeight:'900', fontSize:'0.72rem', fontFamily:'monospace' }}>₹{t.revenue.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ height:'4px', background:'rgba(255,255,255,0.05)', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:'rgba(211,191,162,0.35)', borderRadius:'2px' }} />
              </div>
            </div>
          );
        }) : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.7rem', paddingTop:'30px' }}>No data yet</div>}
      </BC>

      {/* Dwell + Cost per Cover */}
      <BC>
        <BT icon={<Timer size={14} strokeWidth={1.5}/>}>AVG DWELL TIME</BT>
        {trendsData?.tables ? (
          <>
            {[
              { l:'AVG DWELL',  v: trendsData.tables.overallAvgDwell>0?`${trendsData.tables.overallAvgDwell} min`:'—' },
              { l:'FASTEST',    v: trendsData.tables.fastest?`T${trendsData.tables.fastest.table} · ${trendsData.tables.fastest.avgDwell}m`:'—' },
              { l:'SLOWEST',    v: trendsData.tables.slowest?`T${trendsData.tables.slowest.table} · ${trendsData.tables.slowest.avgDwell}m`:'—' },
            ].map(s=>(
              <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.25)', fontWeight:'900' }}>{s.l}</span>
                <span style={{ fontSize:'0.75rem', fontWeight:'900', color:'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>{s.v}</span>
              </div>
            ))}
            {profitabilityData.length>0 && trendsData?.customers?.total>0 && (() => {
              const totalCostCP = profitabilityData.reduce((a,b)=>a+(b.totalIngredientCost||0),0);
              const cpc = Math.round(totalCostCP/trendsData.customers.total);
              return (
                <div style={{ marginTop:'12px', padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'9px', display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.25)', fontWeight:'900' }}>COST PER COVER</span>
                  <span style={{ fontSize:'0.75rem', fontWeight:'900', color:'rgba(211,191,162,0.7)', fontFamily:'monospace' }}>₹{cpc}</span>
                </div>
              );
            })()}
          </>
        ) : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.7rem', paddingTop:'30px' }}>No data</div>}
      </BC>
    </div>

    {/* Staff Efficiency */}
    {staffEfficiency.length > 0 && (
      <BC style={{ marginBottom:'14px' }}>
        <BT icon={<Zap size={14} strokeWidth={1.5}/>} right={viewDate.toLocaleString('en-IN',{month:'short',year:'numeric'}).toUpperCase()}>
          STAFF EFFICIENCY
        </BT>
        {(() => {
          const monthStr = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
          const totalHrs = staffEfficiency.reduce((a,s)=>a+(s.totalHours||0),0);
          const paidCount = staffEfficiency.filter(s=>{
            const rec = monthlySalaryRecords.find(r=>r.staffId?.toString()===s._id?.toString()&&r.monthStr===monthStr);
            return (rec?.status||s.salaryStatus)==='Paid';
          }).length;
          const pendingPay = filteredStaff.reduce((acc,m)=>{
            const rec = monthlySalaryRecords.find(r=>r.staffId?.toString()===m._id?.toString()&&r.monthStr===monthStr);
            return (rec?.status||'Unpaid')==='Paid'?acc:acc+(Number(rec?.baseSalary||m.baseSalary)||0);
          },0);
          return (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'16px' }}>
                {[
                  { l:'TOTAL STAFF',    v:staffEfficiency.length },
                  { l:'HOURS LOGGED',   v:`${totalHrs.toFixed(1)}h` },
                  { l:'SALARIES PAID',  v:`${paidCount}/${staffEfficiency.length}`, accent: paidCount===staffEfficiency.length },
                  { l:'PENDING PAYROLL',v:`₹${pendingPay.toLocaleString()}`, warn: pendingPay>0 },
                ].map(s=>(
                  <div key={s.l} style={{ padding:'11px 12px', background: s.accent?'rgba(211,191,162,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${s.accent?'rgba(211,191,162,0.15)':s.warn?'rgba(240,165,0,0.15)':'rgba(255,255,255,0.06)'}`, borderRadius:'10px' }}>
                    <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1px', marginBottom:'5px' }}>{s.l}</div>
                    <div style={{ fontSize:'0.88rem', fontWeight:'900', fontFamily:'monospace', color: s.accent?'#d3bfa2':s.warn?'rgba(240,165,0,0.7)':'rgba(255,255,255,0.6)' }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ fontSize:'0.46rem', color:'rgba(255,255,255,0.2)', borderBottom:'1px solid rgba(255,255,255,0.06)', textTransform:'uppercase', letterSpacing:'1.5px' }}>
                      {['Name','Role','Attendance','Hours','Rev/Hr','Salary','Status'].map(h=>(
                        <th key={h} style={{ padding:'0 12px 9px 0', textAlign:'left', fontWeight:'900' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffEfficiency.map(s=>{
                      const rec = monthlySalaryRecords.find(r=>r.staffId?.toString()===s._id?.toString()&&r.monthStr===monthStr);
                      const status = rec?.status||s.salaryStatus||'Unpaid';
                      const isPaid = status==='Paid';
                      const attPct = Math.round((s.daysPresent/26)*100);
                      return (
                        <tr key={s._id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.7rem' }}>
                          <td style={{ padding:'10px 12px 10px 0', fontWeight:'800', color:'rgba(255,255,255,0.7)' }}>{s.name}</td>
                          <td style={{ color:'rgba(255,255,255,0.3)', paddingRight:'12px' }}>{s.role}</td>
                          <td style={{ paddingRight:'12px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                              <span style={{ color:'rgba(211,191,162,0.7)', fontWeight:'800', fontFamily:'monospace' }}>{s.daysPresent}d</span>
                              <div style={{ flex:1, height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden', minWidth:'36px' }}>
                                <div style={{ height:'100%', width:`${Math.min(100,attPct)}%`, background:'rgba(211,191,162,0.4)', borderRadius:'2px' }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ color:'rgba(255,255,255,0.4)', paddingRight:'12px' }}>{s.totalHours}h</td>
                          <td style={{ fontWeight:'800', color: s.revenuePerHour>0?'rgba(211,191,162,0.6)':'rgba(255,255,255,0.2)', fontFamily:'monospace', paddingRight:'12px' }}>
                            {s.revenuePerHour>0?`₹${s.revenuePerHour.toLocaleString()}`:'—'}
                          </td>
                          <td style={{ color:'rgba(255,255,255,0.5)', paddingRight:'12px', fontFamily:'monospace' }}>₹{Number(rec?.baseSalary||s.baseSalary).toLocaleString()}</td>
                          <td>
                            <select value={status}
                              onChange={async e=>{
                                await axios.patch(`${BASE_URL}/staff/salary/${tenantId}/${s._id}/${monthStr}`,{status:e.target.value});
                                fetchMonthlySalary(monthStr);
                                showNotif(`${s.name} — ${monthStr} marked ${e.target.value}`);
                              }}
                              style={{ background:'rgba(255,255,255,0.03)', color: isPaid?'rgba(211,191,162,0.8)':'rgba(255,255,255,0.3)', border:`1px solid ${isPaid?'rgba(211,191,162,0.2)':'rgba(255,255,255,0.07)'}`, padding:'5px 9px', borderRadius:'6px', fontSize:'0.58rem', fontWeight:'900', outline:'none', cursor:'pointer' }}>
                              <option value="Unpaid">UNPAID</option>
                              <option value="Paid">PAID</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </BC>
    )}

    {/* Inventory Health */}
    {inventory.length > 0 && (() => {
      const totalItems = inventory.length;
      const lowItems = inventory.filter(i=>i.currentStock<=i.minThreshold).length;
      const depleted = inventory.filter(i=>i.currentStock<=0).length;
      const healthy  = totalItems - lowItems;
      const score    = Math.round((healthy/totalItems)*100);
      const criticals= inventory.filter(i=>i.currentStock<=i.minThreshold).sort((a,b)=>a.currentStock-b.currentStock).slice(0,4);
      const stockVal = inventory.reduce((a,i)=>a+Math.max(0,Math.round(i.currentStock*(i.weightedAvgCost||i.costPrice||0))),0);
      return (
        <BC style={{ marginBottom:'14px', borderLeft:`3px solid rgba(211,191,162,${score>80?'0.6':score>50?'0.3':'0.15'})` }}>
          <BT icon={<Layers size={14} strokeWidth={1.5}/>}>INVENTORY HEALTH</BT>
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'16px', alignItems:'center', marginBottom:'14px' }}>
            <div style={{ textAlign:'center', padding:'16px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px' }}>
              <div style={{ fontSize:'2rem', fontWeight:'900', color: score>80?'#d3bfa2':score>50?'rgba(240,165,0,0.7)':'rgba(255,255,255,0.3)', fontFamily:'monospace', lineHeight:1 }}>{score}%</div>
              <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', marginTop:'4px', letterSpacing:'1px' }}>HEALTH SCORE</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
              {[
                { l:'TOTAL ITEMS', v:totalItems },
                { l:'HEALTHY',     v:healthy,    c:'rgba(211,191,162,0.8)' },
                { l:'LOW STOCK',   v:lowItems,   c: lowItems>0?'rgba(240,165,0,0.7)':'rgba(255,255,255,0.3)' },
                { l:'DEPLETED',    v:depleted,   c: depleted>0?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.3)' },
              ].map(s=>(
                <div key={s.l} style={{ padding:'10px 11px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'9px' }}>
                  <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', marginBottom:'4px' }}>{s.l}</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:'900', color: s.c||'rgba(255,255,255,0.55)', fontFamily:'monospace' }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'9px', marginBottom: criticals.length>0?'12px':0 }}>
            <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.25)', fontWeight:'900' }}>TOTAL STOCK VALUE</span>
            <span style={{ fontSize:'0.72rem', fontWeight:'900', color:'rgba(211,191,162,0.6)', fontFamily:'monospace' }}>₹{stockVal.toLocaleString()}</span>
          </div>
          {criticals.length > 0 && (
            <div style={{ padding:'13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px' }}>
              <div style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.3)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'9px', display:'flex', alignItems:'center', gap:'5px' }}>
                <AlertTriangle size={10} color="rgba(255,255,255,0.3)" strokeWidth={2} /> NEEDS RESTOCK
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'7px' }}>
                {criticals.map(item=>(
                  <div key={item._id} style={{ padding:'9px 11px', background:'rgba(255,255,255,0.02)', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize:'0.68rem', fontWeight:'800', color:'rgba(255,255,255,0.6)' }}>{item.itemName}</div>
                    <div style={{ fontSize:'0.58rem', color: item.currentStock<=0?'rgba(255,255,255,0.35)':'rgba(240,165,0,0.6)', marginTop:'2px' }}>
                      {item.currentStock<=0 ? 'Out of stock' : `${item.currentStock} ${item.unit} left`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </BC>
      );
    })()}

    {/* Wastage */}
    {wastageAnalytics && (
      <BC style={{ marginBottom:'14px' }}>
        <BT icon={<Trash2 size={14} strokeWidth={1.5}/>} right={wastageAnalytics.monthLabel}>WASTAGE INTELLIGENCE</BT>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
          {(() => {
            const totalRev2 = profitabilityData.reduce((a,b)=>a+(b.totalRevenue||0),0) + (extraAnalytics?.totalRevenue||0);
            const wastagePct = totalRev2>0 ? ((wastageAnalytics.totalCost||0)/totalRev2*100).toFixed(1) : 0;
            return [
              { l:'COST LOST',        v:`₹${(wastageAnalytics.totalCost||0).toLocaleString()}` },
              { l:'ENTRIES',          v:wastageAnalytics.totalEntries||0 },
              { l:'% OF REVENUE',     v:`${wastagePct}%` },
            ].map(s=>(
              <div key={s.l} style={{ padding:'11px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', textAlign:'center' }}>
                <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'5px' }}>{s.l}</div>
                <div style={{ fontSize:'0.9rem', fontWeight:'900', color:'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>{s.v}</div>
              </div>
            ));
          })()}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          {/* Top wasted */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'11px', padding:'14px' }}>
            <div style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'5px' }}>
              <TrendingDown size={10} color="rgba(255,255,255,0.2)" /> TOP WASTED
            </div>
            {(wastageAnalytics.topWasted||[]).length > 0 ? wastageAnalytics.topWasted.map((item,i)=>(
              <div key={item.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                  <span style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.2)', minWidth:'14px' }}>#{i+1}</span>
                  <div>
                    <div style={{ fontSize:'0.7rem', fontWeight:'700', color:'rgba(255,255,255,0.6)' }}>{item.name}</div>
                    <div style={{ fontSize:'0.52rem', color:'rgba(255,255,255,0.2)' }}>{item.count} entries</div>
                  </div>
                </div>
                <span style={{ fontSize:'0.68rem', fontWeight:'900', color:'rgba(255,255,255,0.4)', fontFamily:'monospace' }}>
                  {item.cost>0?`₹${item.cost.toFixed(0)}`:`×${item.count}`}
                </span>
              </div>
            )) : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.12)', fontSize:'0.62rem', paddingTop:'20px' }}>No wastage logged</div>}
          </div>
          {/* By reason */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'11px', padding:'14px' }}>
            <div style={{ fontSize:'0.48rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1.5px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'5px' }}>
              <AlertTriangle size={10} color="rgba(255,255,255,0.2)" /> BY REASON
            </div>
            {Object.keys(wastageAnalytics.byReason||{}).length > 0 ? (() => {
              const total2 = wastageAnalytics.totalEntries||1;
              return Object.entries(wastageAnalytics.byReason).sort((a,b)=>b[1].cost-a[1].cost).map(([reason,data])=>{
                const pct = Math.round((data.count/total2)*100);
                return (
                  <div key={reason} style={{ marginBottom:'9px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                      <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', fontWeight:'700' }}>{reason}</span>
                      <span style={{ fontSize:'0.58rem', fontWeight:'900', color:'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>
                        {data.cost>0?`₹${data.cost.toFixed(0)}`:`${data.count}×`} <span style={{ color:'rgba(255,255,255,0.2)' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height:'4px', background:'rgba(255,255,255,0.05)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'rgba(211,191,162,0.3)', borderRadius:'2px' }} />
                    </div>
                  </div>
                );
              });
            })() : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.12)', fontSize:'0.62rem', paddingTop:'20px' }}>No data</div>}
          </div>
        </div>
      </BC>
    )}

    {/* ════════════════════════════════
        SECTION 5 — CUSTOMERS & CHANNELS
    ════════════════════════════════ */}
    <SectionHeader icon={<Users size={16}/>} title="Customers & Channels" subtitle="Retention, acquisition, and revenue sources" />

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
      <BC>
        <BT icon={<User size={14} strokeWidth={1.5}/>}>REPEAT vs NEW CUSTOMERS</BT>
        {trendsData?.customers?.total > 0 ? (
          <>
            <div style={{ display:'flex', height:'7px', borderRadius:'4px', overflow:'hidden', marginBottom:'14px', gap:'2px' }}>
              <div style={{ width:`${trendsData.customers.repeatPct}%`, background:'rgba(211,191,162,0.7)', borderRadius:'4px 0 0 4px' }} />
              <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:'0 4px 4px 0' }} />
            </div>
            {[
              { l:'TOTAL CUSTOMERS', v:trendsData.customers.total },
              { l:'REPEAT VISITORS', v:`${trendsData.customers.repeat} (${trendsData.customers.repeatPct}%)`, c:'rgba(211,191,162,0.8)' },
              { l:'NEW CUSTOMERS',   v:trendsData.customers.new },
              { l:'AVG VISITS',      v:`${trendsData.customers.avgVisits}×` },
            ].map(s=>(
              <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.25)', fontWeight:'900' }}>{s.l}</span>
                <span style={{ fontSize:'0.72rem', fontWeight:'900', color: s.c||'rgba(255,255,255,0.55)', fontFamily:'monospace' }}>{s.v}</span>
              </div>
            ))}
          </>
        ) : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.68rem', paddingTop:'30px', lineHeight:1.6 }}>Capture customer phone numbers at billing to unlock retention metrics.</div>}
      </BC>

      <BC>
        <BT icon={<Globe size={14} strokeWidth={1.5}/>}>REVENUE SOURCES</BT>
        {Object.entries(advancedStats.sources).length > 0 ? (() => {
          const total3 = Object.values(advancedStats.sources).reduce((a,b)=>a+b,0)||1;
          return Object.entries(advancedStats.sources).map(([src,val])=>{
            const pct = Math.round((val/total3)*100);
            return (
              <div key={src} style={{ marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.45)', textTransform:'capitalize', fontWeight:'700' }}>{src}</span>
                  <span style={{ fontSize:'0.65rem', fontWeight:'900', color:'rgba(255,255,255,0.55)', fontFamily:'monospace' }}>₹{val.toLocaleString()}</span>
                </div>
                <div style={{ height:'5px', background:'rgba(255,255,255,0.05)', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:'rgba(211,191,162,0.35)', borderRadius:'3px' }} />
                </div>
              </div>
            );
          });
        })() : <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:'0.7rem', paddingTop:'30px' }}>No source data</div>}
      </BC>
    </div>

    {/* ════════════════════════════════
        SECTION 6 — FINANCIAL HEALTH
    ════════════════════════════════ */}
    <SectionHeader icon={<Wallet size={16}/>} title="Financial Health" subtitle="Cash flow, profitability, and break-even" />

    {/* Payment mode intelligence */}
    {analytics.length > 0 && (() => {
      const totalC = analytics.reduce((a,b)=>a+(b.cash||0),0);
      const totalU = analytics.reduce((a,b)=>a+(b.upi||0),0);
      const totalK = analytics.reduce((a,b)=>a+(b.card||0),0);
      const grand  = totalC + totalU + totalK;
      if (!grand) return null;
      const digitalPct = Math.round(((totalU+totalK)/grand)*100);
      const modes = [
        { label:'Cash', val:totalC, pct:Math.round((totalC/grand)*100) },
        { label:'UPI',  val:totalU, pct:Math.round((totalU/grand)*100) },
        { label:'Card', val:totalK, pct:Math.round((totalK/grand)*100) },
      ];
      return (
        <BC style={{ marginBottom:'14px' }}>
          <BT icon={<CreditCard size={14} strokeWidth={1.5}/>}>PAYMENT MODE INTELLIGENCE</BT>
          <div style={{ display:'flex', height:'10px', borderRadius:'5px', overflow:'hidden', marginBottom:'14px', gap:'1px' }}>
            {modes.map(m=><div key={m.label} style={{ width:`${m.pct}%`, background:`rgba(211,191,162,${m.label==='Cash'?0.7:m.label==='UPI'?0.45:0.25})` }} />)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'12px' }}>
            {modes.map(m=>(
              <div key={m.label} style={{ padding:'11px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1px', marginBottom:'5px' }}>{m.label.toUpperCase()}</div>
                <div style={{ fontSize:'0.9rem', fontWeight:'900', color:'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>₹{m.val.toLocaleString()}</div>
                <div style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.2)', marginTop:'2px' }}>{m.pct}%</div>
              </div>
            ))}
          </div>
          <div style={{ padding:'9px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'9px', display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
            <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.25)', fontWeight:'900' }}>DIGITAL ADOPTION (UPI+CARD)</span>
            <span style={{ fontSize:'0.7rem', fontWeight:'900', color: digitalPct>60?'rgba(211,191,162,0.7)':'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>{digitalPct}%</span>
          </div>
          <div style={{ padding:'10px 12px', background:'rgba(211,191,162,0.04)', border:'1px solid rgba(211,191,162,0.1)', borderRadius:'8px', display:'flex', gap:'8px', alignItems:'flex-start' }}>
            <Lightbulb size={12} color="rgba(211,191,162,0.5)" strokeWidth={1.8} style={{ flexShrink:0, marginTop:'1px' }} />
            <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.3)', lineHeight:1.55 }}>
              {totalU>totalC ? 'UPI dominates — enable UPI QR at every table for faster settlement.' : totalC>totalU ? 'Cash is primary — keep sufficient change ready, especially during peak hours.' : 'Balanced payment mix — good for cash flow predictability.'}
            </span>
          </div>
        </BC>
      );
    })()}

    {/* Break-even tracker */}
    {profitabilityData.length>0 && staffEfficiency.length>0 && currentMonthAnalytics.length>0 && (() => {
      const monthStr = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
      const payroll = staffEfficiency.reduce((a,s)=>{
        const rec = monthlySalaryRecords.find(r=>r.staffId?.toString()===s._id?.toString()&&r.monthStr===monthStr);
        return a + (Number(rec?.baseSalary||s.baseSalary)||0);
      },0);
      const totalRev4 = profitabilityData.reduce((a,b)=>a+(b.totalRevenue||0),0)+(extraAnalytics?.totalRevenue||0);
      const totalCost4= profitabilityData.reduce((a,b)=>a+(b.totalIngredientCost||0),0)+(extraAnalytics?.totalCost||0);
      const fcPct4 = totalRev4>0 ? (totalCost4/totalRev4) : 0.3;
      const cmPct4 = 1 - fcPct4;
      const beRev = cmPct4>0 ? payroll/cmPct4 : 0;
      const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate();
      const bePerDay = beRev/daysInMonth;
      const progressPct = beRev>0 ? Math.min(100, Math.round((totalRev4/beRev)*100)) : 0;
      return (
        <BC style={{ marginBottom:'14px', borderLeft:`3px solid ${progressPct>=100?'rgba(211,191,162,0.6)':'rgba(255,255,255,0.2)'}` }}>
          <BT icon={<Activity size={14} strokeWidth={1.5}/>}>BREAK-EVEN TRACKER</BT>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'14px' }}>
            {[
              { l:'MONTHLY PAYROLL',      v:`₹${Math.round(payroll).toLocaleString()}` },
              { l:'CONTRIBUTION MARGIN',  v:`${Math.round(cmPct4*100)}%` },
              { l:'BREAK-EVEN REVENUE',   v:`₹${Math.round(beRev).toLocaleString()}` },
              { l:'BREAK-EVEN / DAY',     v:`₹${Math.round(bePerDay).toLocaleString()}` },
            ].map(s=>(
              <div key={s.l} style={{ padding:'11px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                <div style={{ fontSize:'0.44rem', color:'rgba(255,255,255,0.2)', fontWeight:'900', letterSpacing:'1px', marginBottom:'5px' }}>{s.l}</div>
                <div style={{ fontSize:'0.88rem', fontWeight:'900', color:'rgba(255,255,255,0.6)', fontFamily:'monospace' }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
              <span style={{ fontSize:'0.5rem', color:'rgba(255,255,255,0.2)' }}>Progress to break-even</span>
              <span style={{ fontSize:'0.5rem', color: progressPct>=100?'rgba(211,191,162,0.7)':'rgba(255,255,255,0.3)', fontWeight:'900' }}>{progressPct}%</span>
            </div>
            <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progressPct}%`, background: progressPct>=100?'rgba(211,191,162,0.6)':'linear-gradient(90deg,rgba(211,191,162,0.2),rgba(211,191,162,0.5))', borderRadius:'3px' }} />
            </div>
            {progressPct>=100 && (
              <div style={{ marginTop:'8px', fontSize:'0.6rem', color:'rgba(211,191,162,0.6)', fontWeight:'800', display:'flex', alignItems:'center', gap:'5px' }}>
                <ClipboardCheck size={12} /> Break-even achieved for this month
              </div>
            )}
          </div>
        </BC>
      );
    })()}

    </>
  );
})()}

</motion.div>
)}

{/* ── PREMIUM AUDIT TRAIL TAB ── */}
{/* ───────────────── AUDIT TRAIL TAB ───────────────── */}
{activeTab === 'audit' && (
  <motion.div key="audit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '100px', width: '100%' }}>

    {/* ══════════ HEADER ══════════ */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={17} color="#d3bfa2" strokeWidth={1.4} />
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2.5px' }}>AUDIT TRAIL</div>
          <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', marginTop: '3px', fontWeight: '500' }}>
            {auditLogs.length} records · Complete action history
          </div>
        </div>
      </div>
      <button onClick={fetchAuditLogs}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '9px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.18)', color: 'rgba(211,191,162,0.7)', fontSize: '0.58rem', fontWeight: '800', cursor: 'pointer', outline: 'none', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px' }}>
        <RefreshCw size={12} strokeWidth={2} />
        REFRESH
      </button>
    </div>

    {/* ══════════ CATEGORY SECTIONS ══════════ */}
    {[
      { key: 'BILLING',            label: 'BILLING',               icon: <ReceiptIndianRupee size={14} strokeWidth={1.5} />, accent: '#d3bfa2' },
      { key: 'MENU_UPDATES',       label: 'MENU UPDATES',          icon: <UtensilsCrossed size={14} strokeWidth={1.5} />,    accent: '#d3bfa2' },
      { key: 'MENU_VISIBILITY',    label: 'MENU VISIBILITY',       icon: <EyeOff size={14} strokeWidth={1.5} />,            accent: '#d3bfa2' },
      { key: 'INVENTORY',          label: 'INVENTORY CHANGES',     icon: <Package size={14} strokeWidth={1.5} />,           accent: '#d3bfa2' },
      { key: 'RECIPE_INGREDIENTS', label: 'RECIPES & INGREDIENTS', icon: <ChefHat size={14} strokeWidth={1.5} />,           accent: '#d3bfa2' },
      { key: 'SALARY_STAFF',       label: 'SALARY & STAFF',        icon: <Users size={14} strokeWidth={1.5} />,             accent: '#d3bfa2' },
      { key: 'SECURITY_SYSTEM',    label: 'SECURITY & SYSTEM',     icon: <ShieldCheck size={14} strokeWidth={1.5} />,       accent: '#d3bfa2' },
    ].map(({ key, label, icon, accent }) => {
      const sectionLogs = auditLogs.filter(l => l.category === key);
      if (sectionLogs.length === 0) return null;

      return (
        <div key={key} style={{ marginBottom: '20px' }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '10px', background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.1)', borderLeft: `3px solid ${accent}`, borderRadius: '10px' }}>
            <span style={{ color: '#d3bfa2' }}>{icon}</span>
            <span style={{ color: '#d3bfa2', fontSize: '0.6rem', fontWeight: '900', letterSpacing: '2px', flex: 1 }}>{label}</span>
            <span style={{ padding: '2px 9px', borderRadius: '12px', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.15)', color: 'rgba(211,191,162,0.6)', fontSize: '0.5rem', fontWeight: '800', fontFamily: 'monospace' }}>
              {sectionLogs.length}
            </span>
          </div>

          {/* Log rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sectionLogs.slice(0, 8).map((log, idx) => {
              const ts = new Date(log.createdAt);
              const timeStr = ts.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
              const beforeStr = log.before ? JSON.stringify(log.before).replace(/[{}"]/g, '').slice(0, 50) : null;
              const afterStr  = log.after  ? JSON.stringify(log.after).replace(/[{}"]/g, '').slice(0, 50)  : null;

              return (
                <div key={log._id || idx} style={{ background: '#060606', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px', transition: 'border-color 0.15s' }}>

                  {/* Row 1: action + timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d3bfa2', flexShrink: 0, opacity: 0.6 }} />
                      <span style={{ color: '#ffffff', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.2px' }}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.52rem', fontFamily: 'monospace', flexShrink: 0, marginLeft: '12px' }}>{timeStr}</span>
                  </div>

                  {/* Row 2: actor + entity */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: (beforeStr || afterStr) ? '8px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={10} color="rgba(255,255,255,0.2)" strokeWidth={1.8} />
                      <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>
                        By&nbsp;<strong style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>{log.actorName}</strong>
                      </span>
                    </div>
                    {log.entity && (
                      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.18)', padding: '1px 7px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                        {log.entity}
                      </span>
                    )}
                    {log.note && (
                      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>"{log.note}"</span>
                    )}
                  </div>

                  {/* Row 3: before / after diff */}
                  {(beforeStr || afterStr) && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {beforeStr && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 9px', background: 'rgba(211,191,162,0.04)', border: '1px solid rgba(211,191,162,0.1)', borderRadius: '6px', maxWidth: '100%' }}>
                          <ArrowDown size={9} color="rgba(211,191,162,0.4)" strokeWidth={2} />
                          <span style={{ fontSize: '0.58rem', color: 'rgba(211,191,162,0.45)', wordBreak: 'break-all' }}>
                            {beforeStr}
                          </span>
                        </div>
                      )}
                      {afterStr && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', maxWidth: '100%' }}>
                          <CheckCircle2 size={9} color="rgba(255,255,255,0.3)" strokeWidth={2} />
                          <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all' }}>
                            {afterStr}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {sectionLogs.length > 8 && (
              <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>
                + {sectionLogs.length - 8} more records — export to view all
              </div>
            )}
          </div>
        </div>
      );
    })}

    {/* ══════════ EMPTY STATE ══════════ */}
    {auditLogs.length === 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', gap: '14px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={24} color="rgba(255,255,255,0.1)" strokeWidth={1.3} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontWeight: '700', marginBottom: '5px' }}>No audit records yet</div>
          <div style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.62rem', maxWidth: '280px', lineHeight: 1.6 }}>
            Settlements, menu edits, inventory changes and recipe saves will appear here automatically.
          </div>
        </div>
      </div>
    )}
  </motion.div>
)}

{/* ── PRATYEKSHA OPERATOR ASSISTANT ── */}
{activeTab === 'assist' && (
  <motion.div
    key="assist"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      maxWidth: '820px', margin: '0 auto',
      width: '100%', padding: '16px 16px 0 16px',
      boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif'
    }}
  >

    {/* ── HEADER ── */}
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'rgba(211,191,162,0.07)',
          border: '1px solid rgba(211,191,162,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Sparkles size={16} color="#d3bfa2" strokeWidth={1.4} />
        </div>
        <div>
          <div style={{
            fontSize: '0.65rem', fontWeight: '900',
            color: '#d3bfa2', letterSpacing: '2.5px'
          }}>
            PRATYEKSHA ASSIST
          </div>
          <div style={{
            fontSize: '0.52rem', color: 'rgba(255,255,255,0.2)',
            marginTop: '2px', fontWeight: '500'
          }}>
            Real-time answers from your restaurant data
          </div>
        </div>
      </div>
      {/* Clear chat */}
      <button
        onClick={() => setAssistMessages([{ role: 'system', text: 'Hello. Ask me anything about your restaurant — orders, revenue, stock, staff, or menu performance.', ts: new Date() }])}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px', borderRadius: '7px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
          fontSize: '0.55rem', fontWeight: '700', letterSpacing: '0.5px',
          outline: 'none', transition: 'all 0.2s'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.2)'; e.currentTarget.style.color = 'rgba(211,191,162,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}
      >
        <RefreshCw size={10} strokeWidth={2} />
        CLEAR
      </button>
    </div>

    {/* ── CATEGORY FILTER TABS ── */}
    {(() => {
      const cats = [
        { key: 'ALL',       label: 'All',         icon: <AlignJustify size={11} strokeWidth={2} /> },
        { key: 'REVENUE',   label: 'Revenue',      icon: <ReceiptIndianRupee size={11} strokeWidth={1.8} /> },
        { key: 'ORDERS',    label: 'Orders',       icon: <ClipboardList size={11} strokeWidth={1.8} /> },
        { key: 'INVENTORY', label: 'Inventory',    icon: <Package size={11} strokeWidth={1.8} /> },
        { key: 'MENU',      label: 'Menu',         icon: <UtensilsCrossed size={11} strokeWidth={1.8} /> },
        { key: 'STAFF',     label: 'Staff',        icon: <Users size={11} strokeWidth={1.8} /> },
        { key: 'EXTRAS',    label: 'Extras',       icon: <ShoppingBag size={11} strokeWidth={1.8} /> },
      ];

      const questions = {
        ALL: [
          { label: 'Restaurant overview',    q: 'Give me a summary of the restaurant status' },
          { label: "Today's revenue",        q: "What is today's revenue?" },
          { label: 'Pending orders',         q: 'Show me pending orders' },
          { label: 'Low stock items',        q: 'Which items are low on stock?' },
          { label: 'Best selling dish',      q: 'What is the best selling dish?' },
          { label: 'Staff attendance',       q: 'How many staff are present today?' },
        ],
        REVENUE: [
          { label: "Today's revenue",       q: "What is today's revenue?" },
          { label: 'Monthly revenue',       q: 'What is the monthly revenue?' },
          { label: 'Weekly revenue',        q: 'What is this week revenue?' },
          { label: 'Average order value',   q: 'What is the average order value?' },
          { label: 'Bills settled today',   q: 'How many bills settled today?' },
          { label: 'Payment split',         q: 'Show me today payment split cash UPI card' },
        ],
        ORDERS: [
          { label: 'Pending orders',        q: 'Show me pending orders' },
          { label: 'Occupied tables',       q: 'How many tables are occupied?' },
          { label: 'Service requests',      q: 'Any service requests from customers?' },
          { label: 'Peak hour today',       q: 'What is the peak hour today?' },
          { label: 'Kitchen status',        q: 'What is the live kitchen order status?' },
          { label: 'Bills today',           q: 'How many invoices settled today?' },
        ],
        INVENTORY: [
          { label: 'Low stock alerts',      q: 'Which items are low on stock?' },
          { label: 'Out of stock',          q: 'What is out of stock?' },
          { label: 'What to purchase',      q: 'What should I procure today?' },
          { label: 'Inventory value',       q: 'What is the total inventory value?' },
          { label: 'Wastage today',         q: 'How much wastage was recorded today?' },
          { label: 'Critical stock',        q: 'Show critical stock items zero stock' },
        ],
        MENU: [
          { label: 'Best selling dish',     q: 'What is the best selling dish?' },
          { label: 'Best profit margin',    q: 'Which dish has the best margin?' },
          { label: 'Slow moving dishes',    q: 'Which dishes are slow or not selling?' },
          { label: 'Hidden dishes',         q: 'Which menu items are hidden?' },
          { label: 'Menu item count',       q: 'How many dishes are on the menu?' },
          { label: 'Top revenue dish',      q: 'Which dish generates most revenue?' },
        ],
        STAFF: [
          { label: 'Attendance today',      q: 'How many staff are present today?' },
          { label: 'Monthly payroll',       q: 'What is the total salary payroll?' },
          { label: 'Staff count',           q: 'How many staff members do we have?' },
        ],
        EXTRAS: [
          { label: 'Extra items stock',     q: 'What is the extra items beverage stock?' },
          { label: 'Extra item revenue',    q: 'What is the extra item revenue?' },
          { label: 'Low beverage stock',    q: 'Which cold drinks are running low?' },
        ],
      };

      const activeQs = questions[assistFilterCat] || questions.ALL;

      return (
        <div style={{ marginBottom: '12px', flexShrink: 0 }}>
          {/* Category pill tabs */}
          <div style={{
            display: 'flex', gap: '5px', overflowX: 'auto',
            paddingBottom: '8px', marginBottom: '10px'
          }} className="no-scrollbar">
            {cats.map(c => {
              const active = assistFilterCat === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setAssistFilterCat(c.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 11px', borderRadius: '7px', flexShrink: 0,
                    background: active ? 'rgba(211,191,162,0.1)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(211,191,162,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? '#d3bfa2' : 'rgba(255,255,255,0.25)',
                    cursor: 'pointer', outline: 'none',
                    fontSize: '0.57rem', fontWeight: '700',
                    letterSpacing: '0.3px', transition: 'all 0.15s',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  {c.icon}
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Question chips for active category */}
          <div style={{
            display: 'flex', gap: '5px', flexWrap: 'wrap'
          }}>
            {activeQs.map(({ label, q: qText }) => (
              <button
                key={label}
                onClick={() => handleAssistQuery(qText)}
                style={{
                  padding: '5px 11px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(211,191,162,0.5)', cursor: 'pointer',
                  fontSize: '0.58rem', fontWeight: '600',
                  letterSpacing: '0.2px', transition: 'all 0.15s',
                  outline: 'none', fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(211,191,162,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(211,191,162,0.2)';
                  e.currentTarget.style.color = '#d3bfa2';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.color = 'rgba(211,191,162,0.5)';
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      );
    })()}

    {/* ── MESSAGES ── */}
    <div
      className="no-scrollbar"
      style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        gap: '12px', paddingBottom: '8px'
      }}
    >
      {assistMessages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-start', gap: '8px'
          }}
        >
          {/* Assistant avatar */}
          {msg.role !== 'user' && (
            <div style={{
              width: '26px', height: '26px', borderRadius: '7px',
              background: 'rgba(211,191,162,0.07)',
              border: '1px solid rgba(211,191,162,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: '2px'
            }}>
              <Sparkles size={12} color="#d3bfa2" strokeWidth={1.4} />
            </div>
          )}

          {/* Bubble */}
          <div style={{
            maxWidth: '76%',
            padding: '10px 14px',
            borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
            background: msg.role === 'user'
              ? 'rgba(211,191,162,0.09)'
              : msg.role === 'system'
              ? 'rgba(255,255,255,0.02)'
              : '#0d0d0d',
            border: `1px solid ${msg.role === 'user'
              ? 'rgba(211,191,162,0.2)'
              : 'rgba(255,255,255,0.06)'}`,
          }}>
            {/* Message text — handle multi-line with \n */}
            <div style={{
              fontSize: '0.72rem',
              color: msg.role === 'user' ? '#d3bfa2' : 'rgba(255,255,255,0.72)',
              lineHeight: 1.65,
              fontWeight: msg.role === 'user' ? '600' : '400',
              whiteSpace: 'pre-line'
            }}>
              {msg.text}
            </div>
            {/* Timestamp */}
            <div style={{
              fontSize: '0.48rem', color: 'rgba(255,255,255,0.15)',
              marginTop: '6px', textAlign: 'right', fontFamily: 'monospace'
            }}>
              {new Date(msg.ts).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true
              })}
            </div>
          </div>

          {/* User avatar placeholder — keeps alignment */}
          {msg.role === 'user' && (
            <div style={{
              width: '26px', height: '26px', borderRadius: '7px',
              background: 'rgba(211,191,162,0.06)',
              border: '1px solid rgba(211,191,162,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: '2px'
            }}>
              <User size={12} color="rgba(211,191,162,0.5)" strokeWidth={1.8} />
            </div>
          )}
        </div>
      ))}

      {/* Typing indicator */}
      {assistLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '34px'
        }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: 'rgba(211,191,162,0.35)',
                animation: `pulse 1.3s ease-in-out ${i * 0.18}s infinite`
              }} />
            ))}
          </div>
          <span style={{
            fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)',
            fontStyle: 'italic'
          }}>
            Fetching from your data...
          </span>
        </div>
      )}

      <div ref={assistEndRef} />
    </div>

    {/* ── INPUT BAR ── */}
    <div style={{
      display: 'flex', gap: '8px', alignItems: 'center',
      padding: '12px 0 16px 0', flexShrink: 0,
      borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px'
    }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(211,191,162,0.18)',
        borderRadius: '11px', padding: '0 14px',
        transition: 'border-color 0.2s'
      }}>
        <input
          value={assistInput}
          onChange={e => setAssistInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !assistLoading) handleAssistQuery(); }}
          placeholder="Ask anything — revenue, orders, stock, staff..."
          style={{
            flex: 1, padding: '11px 0',
            background: 'transparent', border: 'none',
            color: '#fff', fontSize: '0.72rem', outline: 'none',
            fontFamily: 'Poppins, sans-serif', caretColor: '#d3bfa2'
          }}
        />
        {assistInput && (
          <button
            onClick={() => setAssistInput('')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', color: 'rgba(255,255,255,0.2)', outline: 'none'
            }}
          >
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      <button
        onClick={() => handleAssistQuery()}
        disabled={assistLoading || !assistInput.trim()}
        style={{
          width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
          background: assistInput.trim()
            ? 'rgba(211,191,162,0.12)'
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${assistInput.trim()
            ? 'rgba(211,191,162,0.3)'
            : 'rgba(255,255,255,0.06)'}`,
          cursor: assistInput.trim() && !assistLoading ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          outline: 'none', transition: 'all 0.2s'
        }}
      >
        {assistLoading
          ? <RefreshCw size={14} color="rgba(211,191,162,0.4)" strokeWidth={1.8}
              style={{ animation: 'spin 1s linear infinite' }} />
          : <Send size={14}
              color={assistInput.trim() ? '#d3bfa2' : 'rgba(255,255,255,0.15)'}
              strokeWidth={1.8} />
        }
      </button>
    </div>

  </motion.div>
)}

          {/* ── MANAGEMENT ── */}
{activeTab==='management' && (
<motion.div key="management" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
  style={{display:'flex',flexDirection:'column',gap:'32px',paddingBottom:'100px',width:'100%'}}>
 
  {/* ── LIVE FLOOR INTELLIGENCE HUD ── */}
  <div style={{
    display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'14px'
  }}>
    {[
      {
        label:'On Duty Now', icon:<Users size={16}/>,
        val: (liveFloorIntelligence.activeChefs + liveFloorIntelligence.activeHelpers + (staff.filter(s=>s.role==='Waiter').length || 0)),
        sub: `${liveFloorIntelligence.activeChefs} chefs · ${liveFloorIntelligence.activeHelpers} helpers`, accent:'#d3bfa2'
      },
      {
        label:'Table Coverage', icon:<TableProperties size={16}/>,
        val:`${liveFloorIntelligence.coveredCount}/${tableCount}`,
        sub: liveFloorIntelligence.coveredList || 'No coverage data', accent:'#8a704d'
      },
      {
        label:'Staff on Roster', icon:<ClipboardList size={16}/>,
        val: staff.length,
        sub:`${staff.filter(s=>s.role==='Waiter').length}W · ${staff.filter(s=>s.role==='Chef').length}Ch · ${staff.filter(s=>s.role==='Manager').length}Mg`, accent:'#d3bfa2'
      },
      {
        label:'Today Attendance', icon:<CheckCircle2 size={16}/>,
        val: attendanceLogs.filter(l => l.date === attendanceDate).length,
        sub:'punched in today', accent:'#4ade80'
      },
    ].map((s,i)=>(
      <div key={i} style={{
        background:'#080808', border:'1px solid #161616',
        borderTop:`2px solid ${s.accent}22`,
        borderRadius:'14px', padding:'18px 20px',
        display:'flex', flexDirection:'column', gap:'10px'
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{
            width:'32px',height:'32px',borderRadius:'9px',
            background:`${s.accent}0d`,border:`1px solid ${s.accent}22`,
            display:'flex',alignItems:'center',justifyContent:'center',
            color:s.accent
          }}>{s.icon}</div>
          <span style={{fontSize:'0.5rem',color:'#333',fontWeight:'900',letterSpacing:'1.5px',textTransform:'uppercase'}}>{s.label}</span>
        </div>
        <div>
          <div style={{fontSize:'1.7rem',fontWeight:'900',color:'#fff',lineHeight:1,fontFamily:'monospace'}}>{s.val}</div>
          <div style={{fontSize:'0.58rem',color:'#444',marginTop:'5px',fontWeight:'600'}}>{s.sub}</div>
        </div>
      </div>
    ))}
  </div>
 
  {/* ═══════════════════════════════════════════════════════
      SECTION A — WORKFORCE REGISTER TERMINAL
  ═══════════════════════════════════════════════════════ */}
  <div style={{
    background:'#080808', border:'1px solid #161616',
    borderRadius:'18px', overflow:'hidden'
  }}>
    {/* Section header */}
    <div style={{
      display:'flex',alignItems:'center',gap:'14px',
      padding:'20px 26px',
      borderBottom:'1px solid #111',
      background:'#060606'
    }}>
      <div style={{
        width:'36px',height:'36px',borderRadius:'10px',
        background:'rgba(211,191,162,0.06)',border:'1px solid rgba(211,191,162,0.14)',
        display:'flex',alignItems:'center',justifyContent:'center'
      }}>
        <UserRoundCog size={16} color="#d3bfa2"/>
      </div>
      <div>
        <div style={{fontSize:'0.62rem',color:'#d3bfa2',fontWeight:'900',letterSpacing:'2.5px'}}>WORKFORCE REGISTER TERMINAL</div>
        <div style={{fontSize:'0.6rem',color:'#333',marginTop:'2px',fontWeight:'600'}}>Enroll new staff — role, shift, table assignments, pay scale</div>
      </div>
    </div>
 
    <div style={{padding:'24px 26px'}}>
      {/* Main fields grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:'14px',marginBottom:'16px'}}>
        {[
          {l:'Full Name',k:'name',p:'e.g. Ramesh Pawar',t:'text'},
          {l:'Age',k:'age',p:'25',t:'number'},
          {l:'Contact',k:'contact',p:'9876543210',t:'text'},
          {l:'Monthly Salary (₹)',k:'baseSalary',p:'25,000',t:'number'}
        ].map(f=>(
          <div key={f.k}>
            <label style={{fontSize:'0.52rem',color:'#555',fontWeight:'900',letterSpacing:'1px',marginBottom:'7px',display:'block',textTransform:'uppercase'}}>{f.l}</label>
            <input type={f.t} placeholder={f.p}
              style={{width:'100%',padding:'10px 13px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'9px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box',fontWeight:'600'}}
              value={newStaff[f.k]} onChange={e=>setNewStaff({...newStaff,[f.k]:e.target.value})}/>
          </div>
        ))}
 
        {/* Role */}
        <div>
          <label style={{fontSize:'0.52rem',color:'#555',fontWeight:'900',letterSpacing:'1px',marginBottom:'7px',display:'block',textTransform:'uppercase'}}>Role</label>
          <select
            style={{width:'100%',padding:'10px 13px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'9px',fontSize:'0.82rem',outline:'none',cursor:'pointer'}}
            value={newStaff.role} onChange={e=>setNewStaff({...newStaff,role:e.target.value,assignedTables:[]})}>
            {['Waiter','Chef','Manager','Cashier','Helper'].map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
 
        {/* Shift */}
        <div>
          <label style={{fontSize:'0.52rem',color:'#555',fontWeight:'900',letterSpacing:'1px',marginBottom:'7px',display:'block',textTransform:'uppercase'}}>Shift</label>
          <select
            style={{width:'100%',padding:'10px 13px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'9px',fontSize:'0.82rem',outline:'none',cursor:'pointer'}}
            value={newStaff.shiftType} onChange={e=>setNewStaff({...newStaff,shiftType:e.target.value})}>
            <option value="Day Shift">Day Shift</option>
            <option value="Night Shift">Night Shift</option>
            <option value="Both Shifts">Both Shifts</option>
          </select>
        </div>
 
        {/* Joining Date */}
        <div>
          <label style={{fontSize:'0.52rem',color:'#555',fontWeight:'900',letterSpacing:'1px',marginBottom:'7px',display:'block',textTransform:'uppercase'}}>Joining Date</label>
          <input type="date"
            style={{width:'100%',padding:'10px 13px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'9px',fontSize:'0.82rem',outline:'none',colorScheme:'dark',cursor:'pointer',boxSizing:'border-box'}}
            value={newStaff.joiningDate} onChange={e=>setNewStaff({...newStaff,joiningDate:e.target.value})}/>
        </div>
      </div>
 
      {/* Table assignments — Waiter only */}
      {newStaff.role==='Waiter' && (
        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
          style={{background:'#0a0a0a',border:'1px solid #141414',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
          <div style={{fontSize:'0.52rem',color:'#8a704d',fontWeight:'900',letterSpacing:'1px',marginBottom:'12px',textTransform:'uppercase'}}>Table Assignments</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'7px'}}>
            {Array.from({length:tableCount},(_,i)=>(i+1).toString()).map(t=>{
              const isSel=newStaff.assignedTables.includes(t);
              return (
                <button key={t} type="button"
                  onClick={()=>setNewStaff({...newStaff,assignedTables:isSel?newStaff.assignedTables.filter(x=>x!==t):[...newStaff.assignedTables,t]})}
                  style={{
                    padding:'7px 14px',borderRadius:'7px',border:'none',fontSize:'0.65rem',fontWeight:'900',cursor:'pointer',transition:'all 0.15s',
                    background:isSel?'linear-gradient(135deg,#8a704d,#d3bfa2)':'#111',
                    color:isSel?'#000':'#444'
                  }}>T{t}</button>
              );
            })}
          </div>
          {newStaff.assignedTables.length>0 && (
            <div style={{fontSize:'0.58rem',color:'#555',marginTop:'8px'}}>
              Assigned: {newStaff.assignedTables.map(t=>`T${t}`).join(', ')}
            </div>
          )}
        </motion.div>
      )}
 
      {/* Chef cuisine specializations */}
      {newStaff.role==='Chef' && (
        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
          style={{background:'#0a0a0a',border:'1px solid #141414',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
          <div style={{fontSize:'0.52rem',color:'#8a704d',fontWeight:'900',letterSpacing:'1px',marginBottom:'12px',textTransform:'uppercase'}}>Cuisine Specialization</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'7px'}}>
            {[...new Set(menuItems.map(item=>item.categoryId))].filter(Boolean).map(catId=>{
              const currentSel=newStaff.cookingRole?newStaff.cookingRole.split(', '):[];
              const isChecked=currentSel.includes(catId);
              const displayName=catId.replace(/^cat_/i,'').replace(/_/g,' ');
              return (
                <button key={catId} type="button" onClick={()=>{
                  const updated=isChecked?currentSel.filter(c=>c!==catId):[...currentSel,catId];
                  setNewStaff({...newStaff,cookingRole:updated.join(', ')});
                }} style={{
                  padding:'6px 14px',borderRadius:'6px',fontSize:'0.62rem',fontWeight:'900',
                  border:isChecked?'none':'1px solid #222',cursor:'pointer',transition:'all 0.15s',
                  background:isChecked?'#d3bfa2':'#111',color:isChecked?'#000':'#555'
                }}>
                  {displayName.toUpperCase()}
                </button>
              );
            })}
          </div>
          {newStaff.cookingRole && (
            <div style={{fontSize:'0.58rem',color:'#8a704d',marginTop:'8px',fontWeight:'700'}}>
              Specializes in: {newStaff.cookingRole.split(', ').map(c=>c.replace(/^cat_/i,'').replace(/_/g,' ')).join(' · ')}
            </div>
          )}
        </motion.div>
      )}
 
      {/* Address + Submit */}
      <div style={{display:'flex',gap:'14px',alignItems:'flex-end'}}>
        <div style={{flex:1}}>
          <label style={{fontSize:'0.52rem',color:'#555',fontWeight:'900',letterSpacing:'1px',marginBottom:'7px',display:'block',textTransform:'uppercase'}}>Residential Address</label>
          <input type="text" placeholder="Full residential address"
            style={{width:'100%',padding:'10px 13px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'9px',fontSize:'0.78rem',outline:'none',boxSizing:'border-box'}}
            value={newStaff.address} onChange={e=>setNewStaff({...newStaff,address:e.target.value})}/>
        </div>
        <button onClick={async()=>{
          if(!newStaff.name||!newStaff.contact||!newStaff.baseSalary) return showNotif('Fill all required fields','error');
          try {
            const res=await axios.post(`${BASE_URL}/staff/register`,{...newStaff,tenantId,age:Number(newStaff.age),baseSalary:Number(newStaff.baseSalary)});
            if(newStaff.role==='Waiter'&&newStaff.assignedTables.length>0)
              await axios.put(`${BASE_URL}/staff/floor-map`,{tenantId,staffId:res.data.member._id,assignedTables:newStaff.assignedTables});
            showNotif(`${newStaff.name} enrolled`,'success');
            const istResetDate=(()=>{const d=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})();
            setNewStaff({name:'',role:'Waiter',age:'',contact:'',address:'',shiftType:'Day Shift',joiningDate:istResetDate,baseSalary:'',assignedTables:[],cookingRole:''});
            fetchManagementData();
          } catch { showNotif('Failed to enroll','error'); }
        }} style={{
          padding:'10px 28px',
          background:'linear-gradient(135deg,#d3bfa2,#bda88a)',
          border:'none',color:'#000',borderRadius:'10px',
          fontSize:'0.72rem',fontWeight:'900',cursor:'pointer',
          whiteSpace:'nowrap',letterSpacing:'0.5px',flexShrink:0
        }}>AUTHORIZE ROSTER</button>
      </div>
    </div>
  </div>
 
  {/* ═══════════════════════════════════════════════════════
      SECTION B — ROSTER REGISTRY TABLE
  ═══════════════════════════════════════════════════════ */}
  <div style={{
    background:'#080808', border:'1px solid #161616',
    borderRadius:'18px', overflow:'hidden'
  }}>
    {/* Header */}
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'18px 26px', borderBottom:'1px solid #111',
      background:'#060606', gap:'16px', flexWrap:'wrap'
    }}>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <Layers size={16} color="#d3bfa2"/>
        <div>
          <div style={{fontSize:'0.62rem',color:'#d3bfa2',fontWeight:'900',letterSpacing:'2px'}}>ROSTER REGISTRY</div>
          <div style={{fontSize:'0.58rem',color:'#333',marginTop:'1px'}}>{filteredStaff.length} staff members</div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        {/* Search */}
        <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#0a0a0a',border:'1px solid #141414',borderRadius:'8px',padding:'8px 13px'}}>
          <Search size={12} color="#333"/>
          <input type="text" placeholder="Filter by name..."
            style={{background:'transparent',border:'none',color:'#fff',outline:'none',fontSize:'0.72rem',width:'160px'}}
            value={rosterSearchQuery} onChange={e=>setRosterSearchQuery(e.target.value)}/>
          {rosterSearchQuery && <button onClick={()=>setRosterSearchQuery('')} style={{background:'transparent',border:'none',color:'#333',cursor:'pointer',padding:0,display:'flex'}}><X size={11}/></button>}
        </div>
        {/* Month nav */}
        <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#0a0a0a',border:'1px solid #141414',borderRadius:'8px',padding:'6px 12px'}}>
          <button onClick={()=>changeMonth(-1)} style={{background:'transparent',border:'none',color:'#444',cursor:'pointer',display:'flex',alignItems:'center',padding:'2px'}}><ChevronLeft size={13}/></button>
          <span style={{fontSize:'0.7rem',fontWeight:'900',color:'#d3bfa2',minWidth:'80px',textAlign:'center'}}>
            {viewDate.toLocaleString('default',{month:'short',year:'numeric'}).toUpperCase()}
          </span>
          <button onClick={()=>changeMonth(1)} style={{background:'transparent',border:'none',color:'#444',cursor:'pointer',display:'flex',alignItems:'center',padding:'2px'}}><ChevronRight size={13}/></button>
        </div>
      </div>
    </div>
 
    {/* Table */}
    <div style={{overflowX:'auto'}} className="custom-scroll">
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#050505',fontSize:'0.52rem',color:'#333',letterSpacing:'1.2px',textTransform:'uppercase'}}>
            {[
              ['name','Staff Member'],['','Assignments'],['','Shift'],
              ['monthlyAttendance','Attendance',true],['joiningDate','Tenure'],
              ['baseSalary','Salary'],['','Payroll'],['','Actions']
            ].map(([k,l,center],i)=>(
              <th key={i} onClick={k?()=>requestLedgerSort(k):undefined}
                style={{
                  padding:'12px 16px',textAlign:center?'center':'left',
                  cursor:k?'pointer':'default',fontWeight:'900',
                  color:ledgerSortConfig.key===k?'#d3bfa2':'#333',
                  borderBottom:'1px solid #111',
                  whiteSpace:'nowrap'
                }}>
                {l} {ledgerSortConfig.key===k&&(ledgerSortConfig.direction==='asc'?'↑':'↓')}
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
                <tr>
                  <td colSpan="8" style={{padding:'8px 16px',background:'#060606',borderBottom:'1px solid #0d0d0d',borderTop:'1px solid #0d0d0d'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{width:'3px',height:'14px',background:'#d3bfa2',borderRadius:'2px',flexShrink:0}}/>
                      <span style={{fontSize:'0.55rem',fontWeight:'900',color:'#8a704d',letterSpacing:'1.5px'}}>{role.toUpperCase()}S ({bucket.length})</span>
                    </div>
                  </td>
                </tr>
                {bucket.map(m=>{
                  const prefix=viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
                  const days=attendanceLogs.filter(l=>(l.staffId===m._id||l.staffId?.toString()===m._id?.toString())&&l.date?.startsWith(prefix)).length;
                  const pureName=m.name.includes(' (')?m.name.split(' (')[0]:m.name;
                  const staffLogs=attendanceLogs.filter(l=>(l.staffId===m._id||l.staffId?.toString()===m._id?.toString())&&l.date?.startsWith(prefix)&&l.clockIn&&l.clockOut);
                  const totalHrs=staffLogs.reduce((a,l)=>a+(l.totalWorkingHours||0),0);
                  const overtimeHrs=Math.max(0,totalHrs-(days*8));
                  return (
                    <tr key={m._id} style={{borderBottom:'1px solid #0a0a0a',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#0a0a0a'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
 
                      {/* Staff name */}
                      <td style={{padding:'14px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <div style={{
                            width:'32px',height:'32px',borderRadius:'8px',
                            background:'rgba(211,191,162,0.05)',border:'1px solid rgba(211,191,162,0.1)',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:'0.72rem',fontWeight:'900',color:'#8a704d',flexShrink:0
                          }}>
                            {pureName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontSize:'0.8rem',fontWeight:'800',color:'#fff'}}>{pureName}</div>
                            <div style={{fontSize:'0.58rem',color:'#444',marginTop:'1px'}}>
                              {m.role}{m.age?` · ${m.age}y`:''}
                              {m.contact&&<span style={{color:'#333'}}> · {m.contact}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
 
                      {/* Assignments */}
                      <td style={{padding:'14px 8px',maxWidth:'160px'}}>
                        {m.role==='Waiter'&&m.assignedTables?.length>0?(
                          <div style={{display:'flex',flexWrap:'wrap',gap:'3px'}}>
                            {m.assignedTables.map(t=>(
                              <span key={t} style={{fontSize:'0.58rem',padding:'2px 6px',background:'#111',border:'1px solid #1a1a1a',borderRadius:'4px',color:'#888',fontFamily:'monospace'}}>T{t}</span>
                            ))}
                          </div>
                        ):m.role==='Chef'&&m.cookingRole?(
                          <div style={{display:'flex',flexWrap:'wrap',gap:'3px'}}>
                            {m.cookingRole.split(', ').filter(Boolean).map((cat,i)=>(
                              <span key={i} style={{fontSize:'0.55rem',padding:'2px 7px',background:'rgba(211,191,162,0.05)',border:'1px solid rgba(211,191,162,0.1)',borderRadius:'4px',color:'#8a704d',fontWeight:'800'}}>
                                {cat.replace(/^cat_/i,'').replace(/_/g,' ')}
                              </span>
                            ))}
                          </div>
                        ):(
                          <span style={{fontSize:'0.62rem',color:'#2a2a2a'}}>—</span>
                        )}
                      </td>
 
                      {/* Shift */}
                      <td style={{padding:'14px 8px'}}>
                        <span style={{
                          display:'inline-flex',alignItems:'center',gap:'5px',
                          fontSize:'0.62rem',fontWeight:'800',
                          color:m.shiftType==='Night Shift'?'#8a704d':'#d3bfa2',
                          padding:'3px 9px',borderRadius:'6px',
                          background:m.shiftType==='Night Shift'?'rgba(138,112,77,0.07)':'rgba(211,191,162,0.05)',
                          border:`1px solid ${m.shiftType==='Night Shift'?'rgba(138,112,77,0.15)':'rgba(211,191,162,0.1)'}`
                        }}>
                          <Clock size={9}/>{m.shiftType?.replace(' Shift','') || 'Day'}
                        </span>
                      </td>
 
                      {/* Attendance */}
                      <td style={{padding:'14px 8px',textAlign:'center'}}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'3px'}}>
                          <span style={{
                            fontSize:'0.8rem',fontWeight:'900',color:'#fff',
                            fontFamily:'monospace'
                          }}>{days}<span style={{fontSize:'0.55rem',color:'#444',marginLeft:'3px'}}>days</span></span>
                          {overtimeHrs>0&&(
                            <span style={{fontSize:'0.52rem',fontWeight:'900',color:'#BA7517',background:'rgba(186,117,23,0.08)',padding:'1px 6px',borderRadius:'4px',border:'1px solid rgba(186,117,23,0.2)'}}>
                              +{overtimeHrs.toFixed(1)}h OT
                            </span>
                          )}
                        </div>
                      </td>
 
                      {/* Tenure */}
                      <td style={{padding:'14px 8px'}}>
                        <span style={{fontSize:'0.68rem',color:'#555',fontWeight:'600'}}>{calculateTenure(m.joiningDate)}</span>
                      </td>
 
                      {/* Salary */}
                      <td style={{padding:'14px 8px'}}>
                        <span style={{fontSize:'0.8rem',fontWeight:'900',color:'#d3bfa2',fontFamily:'monospace'}}>
                          ₹{Number(m.baseSalary).toLocaleString()}
                        </span>
                        <span style={{fontSize:'0.55rem',color:'#333',display:'block'}}>per month</span>
                      </td>
 
                      {/* Payroll */}
                      <td style={{padding:'14px 8px'}}>
                        {(()=>{
                          const istNow=new Date(new Date().getTime()+330*60*1000);
                          const selectedMonthDate=new Date(viewDate.getFullYear(),viewDate.getMonth(),1);
                          const currentMonthDate=new Date(istNow.getFullYear(),istNow.getMonth(),1);
                          const isFutureMonth=selectedMonthDate>currentMonthDate;
                          const monthStr=viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
                          if(isFutureMonth) return (
                            <span style={{fontSize:'0.6rem',padding:'4px 9px',borderRadius:'6px',fontWeight:'900',background:'#0a0a0a',color:'#222',border:'1px solid #111',display:'inline-block'}}>PENDING</span>
                          );
                          const salRecord=monthlySalaryRecords.find(r=>(r.staffId===m._id||r.staffId?.toString()===m._id?.toString())&&r.month===monthStr);
                          if(salRecord?.paidAt) return (
                            <div>
                              <span style={{fontSize:'0.6rem',padding:'4px 9px',borderRadius:'6px',fontWeight:'900',background:'rgba(74,222,128,0.07)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.18)',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                                <CheckCircle2 size={9}/>PAID
                              </span>
                              <div style={{fontSize:'0.52rem',color:'#333',marginTop:'3px'}}>
                                ₹{Number(salRecord.netSalary||m.baseSalary).toLocaleString()}
                              </div>
                            </div>
                          );
                          return (
                            <button onClick={async()=>{
                              const istNow2=new Date(new Date().getTime()+330*60*1000);
                              const currentMonthStr=istNow2.getFullYear()+'-'+String(istNow2.getMonth()+1).padStart(2,'0');
                              if(monthStr>currentMonthStr){showNotif('Cannot pay future month','error');return;}
                              const monthLogs=attendanceLogs.filter(l=>(l.staffId===m._id||l.staffId?.toString()===m._id?.toString())&&l.date?.startsWith(monthStr));
                              const workDays=[...new Set(monthLogs.map(l=>l.date))].length;
                              const perDay=Number(m.baseSalary)/26;
                              const net=Math.round(perDay*workDays);
                              setConfirmModal({
                                show:true,
                                title:`Pay ${pureName}?`,
                                subtitle:`${workDays} days worked · ₹${net.toLocaleString()} net salary for ${viewDate.toLocaleString('default',{month:'long'})}`,
                                onConfirm:async()=>{
                                  await axios.post(`${BASE_URL}/staff/salary/mark-paid`,{tenantId,staffId:m._id,month:monthStr,workDays,netSalary:net,baseSalary:Number(m.baseSalary)});
                                  showNotif(`${pureName} — salary marked paid`,'success');
                                  const prefix2=viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
                                  fetchMonthlySalary(prefix2);
                                }
                              });
                            }} style={{
                              padding:'5px 11px',borderRadius:'7px',cursor:'pointer',
                              fontSize:'0.6rem',fontWeight:'900',
                              border:'1px solid rgba(186,117,23,0.25)',
                              background:'rgba(186,117,23,0.07)',color:'#BA7517'
                            }}>PAY NOW</button>
                          );
                        })()}
                      </td>
 
                      {/* Actions */}
                      <td style={{padding:'14px 8px'}}>
                        <button onClick={()=>setConfirmModal({
                          show:true,title:`Remove ${pureName}?`,
                          subtitle:'This will permanently remove the staff member.',
                          onConfirm:async()=>{
                            await axios.delete(`${BASE_URL}/staff/${m._id}`);
                            showNotif(`${pureName} removed`);
                            fetchManagementData();
                          }
                        })} style={{
                          width:'30px',height:'30px',background:'transparent',
                          border:'1px solid #141414',color:'#2a2a2a',borderRadius:'7px',
                          cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                          transition:'all 0.15s'
                        }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(192,57,43,0.3)';e.currentTarget.style.color='#c0392b';}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='#141414';e.currentTarget.style.color='#2a2a2a';}}>
                          <X size={12}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          }) : (
            <tr><td colSpan="8" style={{padding:'50px',textAlign:'center',color:'#222',fontSize:'0.78rem'}}>
              {rosterSearchQuery?`No staff matching "${rosterSearchQuery}"`:'No staff enrolled yet'}
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
 
  {/* ═══════════════════════════════════════════════════════
      SECTION C — ATTENDANCE TERMINAL (side-by-side layout)
  ═══════════════════════════════════════════════════════ */}
  <div style={{
    background:'#080808', border:'1px solid #161616',
    borderRadius:'18px', overflow:'hidden'
  }}>
    {/* Header */}
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'18px 26px', borderBottom:'1px solid #111',
      background:'#060606', gap:'16px', flexWrap:'wrap'
    }}>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <CalendarCog size={16} color="#d3bfa2"/>
        <div>
          <div style={{fontSize:'0.62rem',color:'#d3bfa2',fontWeight:'900',letterSpacing:'2px'}}>ATTENDANCE TERMINAL</div>
          <div style={{fontSize:'0.58rem',color:'#333',marginTop:'1px'}}>Clock in/out · Session logs · Overtime detection</div>
        </div>
      </div>
      {/* Date picker */}
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#0a0a0a',border:'1px solid #141414',borderRadius:'8px',padding:'6px 13px'}}>
          <Calendar size={12} color="#8a704d"/>
          <input type="date" value={attendanceDate}
            onChange={e=>{setAttendanceDate(e.target.value);fetchAttendanceForDate(e.target.value);}}
            style={{background:'transparent',border:'none',color:'#fff',outline:'none',fontSize:'0.75rem',fontWeight:'700',colorScheme:'dark',cursor:'pointer'}}/>
        </div>
        <button onClick={()=>fetchAttendanceForDate(attendanceDate)}
          style={{width:'34px',height:'34px',background:'transparent',border:'1px solid #141414',color:'#444',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(211,191,162,0.25)';e.currentTarget.style.color='#d3bfa2';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#141414';e.currentTarget.style.color='#444';}}>
          <RefreshCw size={13}/>
        </button>
      </div>
    </div>
 
    {/* Quick stats row */}
    {(()=>{
      const dayLogs=attendanceLogs.filter(l=>l.date===attendanceDate);
      const presentStaffIds=[...new Set(dayLogs.map(l=>l.staffId?.toString()))];
      const onDuty=dayLogs.filter(l=>l.clockIn&&!l.clockOut).length;
      const completedToday=dayLogs.filter(l=>l.clockIn&&l.clockOut).length;
      const absent=staff.length-presentStaffIds.length;
      return (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:'1px solid #0d0d0d'}}>
          {[
            {l:'Present',v:presentStaffIds.length,c:'#d3bfa2'},
            {l:'On Duty',v:onDuty,c:'#4ade80'},
            {l:'Completed',v:completedToday,c:'#8a704d'},
            {l:'Absent',v:Math.max(0,absent),c:'#555'},
          ].map((s,i)=>(
            <div key={i} style={{
              padding:'14px 20px',
              borderRight:i<3?'1px solid #0d0d0d':'none',
              textAlign:'center'
            }}>
              <div style={{fontSize:'1.4rem',fontWeight:'900',color:s.c,fontFamily:'monospace'}}>{s.v}</div>
              <div style={{fontSize:'0.52rem',color:'#333',fontWeight:'900',letterSpacing:'1px',marginTop:'3px'}}>{s.l.toUpperCase()}</div>
            </div>
          ))}
        </div>
      );
    })()}
 
    {/* Staff cards grid */}
    <div style={{padding:'20px 24px'}}>
      {['Chef','Waiter','Manager','Cashier','Helper'].map(role=>{
        const roleStaff=filteredStaff.filter(m=>m.role===role);
        if(!roleStaff.length) return null;
        return (
          <div key={role} style={{marginBottom:'24px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
              <span style={{width:'3px',height:'14px',background:'#8a704d',borderRadius:'2px'}}/>
              <span style={{fontSize:'0.55rem',fontWeight:'900',color:'#555',letterSpacing:'1.5px'}}>{role.toUpperCase()}S ({roleStaff.length})</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
              {roleStaff.map(m=>{
                const dayLogs=attendanceLogs.filter(l=>l.date===attendanceDate&&(l.staffId===m._id||l.staffId?.toString()===m._id?.toString())).sort((a,b)=>new Date(a.clockIn)-new Date(b.clockIn));
                const activeLogs=dayLogs.filter(l=>l.clockIn&&!l.clockOut);
                const completedLogs=dayLogs.filter(l=>l.clockIn&&l.clockOut);
                const totalHoursToday=completedLogs.reduce((a,l)=>a+(l.totalWorkingHours||0),0);
                const isCurrentlyClockedIn=activeLogs.length>0;
                const hasAnyPunch=dayLogs.length>0;
                const latestActiveLog=activeLogs[activeLogs.length-1];
                const name=m.name.includes(' (')?m.name.split(' (')[0]:m.name;
                let statusLabel='Not punched'; let statusColor='#2a2a2a';
                if(isCurrentlyClockedIn){statusLabel='On duty';statusColor='#4ade80';}
                else if(completedLogs.length>0){statusLabel=`Done · ${totalHoursToday.toFixed(1)}h`;statusColor='#8a704d';}
                return (
                  <div key={m._id} style={{
                    padding:'14px',borderRadius:'12px',background:'#050505',
                    border:isCurrentlyClockedIn?'1px solid rgba(74,222,128,0.15)':completedLogs.length>0?'1px solid rgba(138,112,77,0.12)':'1px solid #0d0d0d',
                    transition:'all 0.2s'
                  }}>
                    {/* Header */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                        <div style={{
                          width:'30px',height:'30px',borderRadius:'8px',flexShrink:0,
                          background:isCurrentlyClockedIn?'rgba(74,222,128,0.08)':'rgba(255,255,255,0.03)',
                          border:`1px solid ${isCurrentlyClockedIn?'rgba(74,222,128,0.2)':'#111'}`,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:'0.68rem',fontWeight:'900',
                          color:isCurrentlyClockedIn?'#4ade80':'#333'
                        }}>{name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{fontSize:'0.78rem',fontWeight:'800',color:'#fff'}}>{name}</div>
                          <div style={{fontSize:'0.58rem',color:statusColor,fontWeight:'700',marginTop:'1px'}}>{statusLabel}</div>
                        </div>
                      </div>
                      <button
                        onClick={async()=>{
                          if(!isCurrentlyClockedIn){
                            await axios.post(`${BASE_URL}/staff/attendance/clock-in`,{tenantId,staffId:m._id});
                          } else {
                            await axios.patch(`${BASE_URL}/staff/attendance/clock-out/${latestActiveLog._id}`);
                          }
                          fetchAttendanceForDate(attendanceDate);
                        }}
                        style={{
                          background:isCurrentlyClockedIn?'rgba(138,112,77,0.1)':'rgba(211,191,162,0.9)',
                          color:isCurrentlyClockedIn?'#8a704d':'#000',
                          border:isCurrentlyClockedIn?'1px solid rgba(138,112,77,0.25)':'none',
                          padding:'7px 14px',borderRadius:'7px',
                          fontSize:'0.6rem',fontWeight:'900',cursor:'pointer',
                          whiteSpace:'nowrap',flexShrink:0,transition:'all 0.15s'
                        }}>
                        {isCurrentlyClockedIn?'Clock Out':'Clock In'}
                      </button>
                    </div>
 
                    {/* Session log */}
                    {dayLogs.length>0&&(
                      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                        {dayLogs.map((log,idx)=>{
                          const inTime=log.clockIn?new Date(log.clockIn).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}):'—';
                          const outTime=log.clockOut?new Date(log.clockOut).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}):null;
                          const hrs=log.totalWorkingHours;
                          return (
                            <div key={log._id} style={{
                              display:'flex',alignItems:'center',gap:'7px',
                              padding:'5px 8px',background:'#0a0a0a',borderRadius:'6px',border:'1px solid #0f0f0f'
                            }}>
                              <span style={{fontSize:'0.5rem',color:'#2a2a2a',fontWeight:'900',minWidth:'16px',fontFamily:'monospace'}}>#{idx+1}</span>
                              <span style={{fontSize:'0.62rem',color:'#d3bfa2',fontWeight:'700',fontFamily:'monospace'}}>{inTime}</span>
                              <span style={{fontSize:'0.5rem',color:'#2a2a2a'}}>→</span>
                              {outTime?(
                                <>
                                  <span style={{fontSize:'0.62rem',color:'#d3bfa2',fontWeight:'700',fontFamily:'monospace'}}>{outTime}</span>
                                  <span style={{
                                    marginLeft:'auto',fontSize:'0.58rem',fontWeight:'900',
                                    color:hrs>=9?'#BA7517':'#555',
                                    padding:'1px 6px',borderRadius:'4px',
                                    background:hrs>=9?'rgba(186,117,23,0.08)':'transparent',
                                    border:hrs>=9?'1px solid rgba(186,117,23,0.2)':'none'
                                  }}>
                                    {hrs?`${hrs.toFixed(1)}h`:'—'}{hrs>=9&&' ⚠'}
                                  </span>
                                </>
                              ):(
                                <span style={{fontSize:'0.6rem',color:'#4ade80',fontStyle:'italic',marginLeft:'auto'}}>live…</span>
                              )}
                            </div>
                          );
                        })}
                        {completedLogs.length>0&&(
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'4px'}}>
                            <span style={{fontSize:'0.6rem',color:'#555',fontWeight:'700'}}>Total: {totalHoursToday.toFixed(2)}h</span>
                            {totalHoursToday>=9&&(
                              <span style={{fontSize:'0.56rem',fontWeight:'900',padding:'2px 7px',borderRadius:'4px',background:'rgba(186,117,23,0.08)',color:'#BA7517',border:'1px solid rgba(186,117,23,0.2)'}}>
                                ⚠ {(totalHoursToday-8).toFixed(1)}h overtime
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
 
                    {!hasAnyPunch&&(
                      <div style={{padding:'8px',background:'#080808',borderRadius:'6px',border:'1px solid #0d0d0d',textAlign:'center'}}>
                        <span style={{fontSize:'0.58rem',color:'#1e1e1e',fontWeight:'700'}}>No punch recorded</span>
                      </div>
                    )}
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

{/* ── SMART PURCHASE ASSISTANT ── */}
{purchaseRecommendations.length > 0 && (
  <div style={{
    background: '#080808',
    border: '1px solid rgba(211,191,162,0.18)',
    borderRadius: '14px',
    padding: '17px 18px'
  }}>

    {/* Header */}
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'rgba(211,191,162,0.07)',
          border: '1px solid rgba(211,191,162,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Truck size={13} color="#d3bfa2" strokeWidth={1.5} />
        </div>
        <div>
          <div style={{
            fontSize: '0.6rem', fontWeight: '900', color: '#d3bfa2',
            letterSpacing: '2px', textTransform: 'uppercase'
          }}>
            SMART PURCHASE ASSISTANT
          </div>
          <div style={{
            fontSize: '0.53rem', color: 'rgba(255,255,255,0.2)',
            marginTop: '1px'
          }}>
            Based on daily consumption · 2-week supply target
          </div>
        </div>
      </div>
      <div style={{
        background: 'rgba(248,113,113,0.08)',
        border: '1px solid rgba(248,113,113,0.18)',
        borderRadius: '6px', padding: '3px 9px',
        display: 'flex', alignItems: 'center', gap: '5px'
      }}>
        <TrendingDown size={10} color="#f87171" strokeWidth={2} />
        <span style={{
          color: '#f87171', fontSize: '0.6rem', fontWeight: '900'
        }}>
          {purchaseRecommendations.length} LOW
        </span>
      </div>
    </div>

    {/* Item rows */}
    {purchaseRecommendations.map(item => (
      <div key={item._id} style={{
        padding: '12px 13px', marginBottom: '7px',
        background: item.urgency === 'critical'
          ? 'rgba(248,113,113,0.04)'
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${
          item.urgency === 'critical'
            ? 'rgba(248,113,113,0.16)'
            : 'rgba(255,255,255,0.05)'
        }`,
        borderRadius: '10px'
      }}>

        {/* Item name + urgency badge */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            {item.urgency === 'critical'
              ? <AlertTriangle size={12} color="#f87171" strokeWidth={2} />
              : <Package2 size={12} color="rgba(240,165,0,0.7)" strokeWidth={1.8} />
            }
            <span style={{
              color: '#fff', fontSize: '0.78rem', fontWeight: '700'
            }}>
              {item.itemName}
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.6rem', padding: '2px 9px',
            borderRadius: '20px', fontWeight: '900',
            background: item.urgency === 'critical'
              ? 'rgba(248,113,113,0.1)'
              : 'rgba(240,165,0,0.08)',
            color: item.urgency === 'critical' ? '#f87171' : '#f0a500',
            border: `1px solid ${
              item.urgency === 'critical'
                ? 'rgba(248,113,113,0.2)'
                : 'rgba(240,165,0,0.15)'
            }`
          }}>
            {item.daysRemaining === 0 ? 'OUT TODAY' : `${item.daysRemaining}d left`}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: '8px', marginBottom: '8px'
        }}>
          {[
            {
              label: 'Current Stock',
              value: `${item.currentStock || 0} ${item.unit}`,
              dim: true
            },
            {
              label: 'Daily Usage',
              value: `${(item.avgDailyUsage || 0).toFixed(1)} ${item.unit}`,
              dim: true
            },
            {
              label: 'Buy Now',
              value: `${item.recommendedQty} ${item.unit}`,
              dim: false
            },
          ].map(({ label, value, dim }) => (
            <div key={label} style={{
              textAlign: 'center', padding: '8px 6px',
              background: dim ? 'transparent' : 'rgba(211,191,162,0.05)',
              border: dim
                ? '1px solid rgba(255,255,255,0.04)'
                : '1px solid rgba(211,191,162,0.12)',
              borderRadius: '7px'
            }}>
              <div style={{
                color: dim ? 'rgba(255,255,255,0.45)' : '#d3bfa2',
                fontSize: '0.78rem', fontWeight: '800',
                fontFamily: 'monospace'
              }}>
                {value}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: '0.52rem', marginTop: '2px'
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Estimated cost */}
        {item.estimatedCost > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 8px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '6px'
          }}>
            <PackageCheck size={10} color="rgba(211,191,162,0.35)" strokeWidth={1.8} />
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.62rem' }}>
              Estimated purchase cost:
            </span>
            <span style={{
              color: 'rgba(211,191,162,0.6)', fontSize: '0.62rem',
              fontWeight: '700', fontFamily: 'monospace'
            }}>
              ₹{item.estimatedCost.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    ))}
  </div>
)}

{/* ADD FORM */}
<div style={{...styles.biCard, padding:'20px 25px'}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
    <h4 style={{...styles.biTitle, marginBottom:0, color: selectedExistingItem ? '#d3bfa2' : '#fff'}}>
      {selectedExistingItem
        ? `RESTOCK: ${selectedExistingItem.itemName.toUpperCase()}`
        : 'ADD / RESTOCK INGREDIENT'}
    </h4>
    {selectedExistingItem && (
      <button onClick={() => {
        setSelectedExistingItem(null);
        setNewInventoryItem({ itemName: '', unit: 'gm', currentStock: '', minThreshold: '', costPrice: '', purchasePrice: '', vendor: '' });
      }} style={{ background: 'transparent', border: '1px solid #333', color: '#555', padding: '4px 12px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: '900', cursor: 'pointer' }}>
        CLEAR ✕
      </button>
    )}
  </div>

  {/* RESTOCK BANNER */}
  {selectedExistingItem && (
    <div style={{ marginBottom: '16px', padding: '14px 16px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.2)', borderRadius: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.54rem', color: '#555', fontWeight: '900', letterSpacing: '1px', marginBottom: '3px' }}>CURRENT STOCK</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#d3bfa2' }}>{selectedExistingItem.currentStock} {selectedExistingItem.unit}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.54rem', color: '#555', fontWeight: '900', letterSpacing: '1px', marginBottom: '3px' }}>WAC (CURRENT)</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fff' }}>
            ₹{(selectedExistingItem.weightedAvgCost || selectedExistingItem.costPrice || 0).toFixed(2)}/{selectedExistingItem.unit}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.54rem', color: '#555', fontWeight: '900', letterSpacing: '1px', marginBottom: '3px' }}>LAST BUY PRICE</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fff' }}>
            ₹{(selectedExistingItem.lastPurchasePrice || selectedExistingItem.costPrice || 0).toFixed(2)}/{selectedExistingItem.unit}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.54rem', color: '#555', fontWeight: '900', letterSpacing: '1px', marginBottom: '3px' }}>STOCK VALUE</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#8a704d' }}>
            ₹{((selectedExistingItem.currentStock || 0) * (selectedExistingItem.weightedAvgCost || selectedExistingItem.costPrice || 0)).toFixed(0)}
          </div>
        </div>
      </div>
      {/* WAC PREVIEW — show new WAC as user types purchase price */}
      {newInventoryItem.currentStock && newInventoryItem.purchasePrice && (() => {
        const addQty = Number(newInventoryItem.currentStock);
        const buyPrice = Number(newInventoryItem.purchasePrice);
        const oldStock = selectedExistingItem.currentStock;
        const oldWAC = selectedExistingItem.weightedAvgCost || selectedExistingItem.costPrice || 0;
        const newStock = oldStock + addQty;
        const newWAC = newStock > 0 ? ((oldStock * oldWAC) + (addQty * buyPrice)) / newStock : buyPrice;
        const changePct = oldWAC > 0 ? ((buyPrice - oldWAC) / oldWAC) * 100 : 0;
        return (
          <div style={{ marginTop: '12px', padding: '10px 12px', background: '#080808', borderRadius: '8px', border: '1px solid #1a1a1a', display: 'flex', gap: '24px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.62rem', color: '#555' }}>NEW WAC PREVIEW</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#d3bfa2' }}>₹{newWAC.toFixed(2)}/{selectedExistingItem.unit}</span>
            <span style={{ fontSize: '0.62rem', color: '#555' }}>New stock: {newStock} {selectedExistingItem.unit}</span>
            {Math.abs(changePct) > 0.5 && (
              <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '2px 8px', borderRadius: '4px',
                color: changePct > 25 ? '#BA7517' : changePct > 10 ? '#d3bfa2' : '#4ade80',
                background: changePct > 25 ? 'rgba(186,117,23,0.1)' : changePct > 10 ? 'rgba(211,191,162,0.06)' : 'rgba(74,222,128,0.06)',
                border: `1px solid ${changePct > 25 ? 'rgba(186,117,23,0.3)' : changePct > 10 ? 'rgba(211,191,162,0.15)' : 'rgba(74,222,128,0.2)'}`
              }}>
                {changePct > 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(1)}% vs WAC
              </span>
            )}
          </div>
        );
      })()}
    </div>
  )}

  <div style={{ display: 'grid', gridTemplateColumns: selectedExistingItem ? '2fr 1fr 1fr 1fr auto' : '2fr 1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>

    {/* NAME with autocomplete */}
    <div style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
        NAME {selectedExistingItem && <span style={{ color: '#d3bfa2' }}>✓ MATCHED</span>}
      </label>
      <input type="text" placeholder="e.g. Tomato" style={{
        width: '100%', padding: '10px 12px',
        background: selectedExistingItem ? 'rgba(211,191,162,0.06)' : '#000',
        border: `1px solid ${selectedExistingItem ? 'rgba(211,191,162,0.35)' : '#1a1a1a'}`,
        color: '#fff', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box'
      }}
        value={newInventoryItem.itemName}
        onChange={e => {
          const val = e.target.value;
          setNewInventoryItem({ ...newInventoryItem, itemName: val });
          setSelectedExistingItem(null);
          if (val.trim().length >= 1) {
            const matches = inventory.filter(i => i.itemName.toLowerCase().includes(val.toLowerCase()));
            setInventorySuggestions(matches);
            setShowSuggestions(matches.length > 0);
          } else {
            setShowSuggestions(false);
            setInventorySuggestions([]);
          }
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
        onFocus={() => { if (newInventoryItem.itemName.trim().length >= 1 && inventorySuggestions.length > 0) setShowSuggestions(true); }}
      />
      {showSuggestions && inventorySuggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.2)', borderRadius: '8px', marginTop: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
          <div style={{ padding: '6px 10px', fontSize: '0.54rem', color: '#555', fontWeight: '900', letterSpacing: '1px', borderBottom: '1px solid #151515' }}>EXISTING — CLICK TO RESTOCK</div>
          {inventorySuggestions.map(item => {
            const wac = item.weightedAvgCost || item.costPrice || 0;
            const lastPrice = item.lastPurchasePrice || wac;
            const drift = wac > 0 ? ((lastPrice - wac) / wac) * 100 : 0;
            return (
              <div key={item._id} onMouseDown={() => {
                setSelectedExistingItem(item);
                setNewInventoryItem({ itemName: item.itemName, unit: item.unit, currentStock: '', minThreshold: item.minThreshold, costPrice: item.costPrice, purchasePrice: '', vendor: '' });
                setShowSuggestions(false);
                setInventorySuggestions([]);
              }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(211,191,162,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff' }}>{item.itemName}</div>
                  <div style={{ fontSize: '0.62rem', color: '#555', marginTop: '2px' }}>
                    {item.currentStock} {item.unit} · WAC ₹{wac.toFixed(2)}
                    {Math.abs(drift) > 0.5 && <span style={{ color: drift > 0 ? '#BA7517' : '#4ade80', marginLeft: '6px' }}>({drift > 0 ? '▲' : '▼'}{Math.abs(drift).toFixed(1)}% drift)</span>}
                  </div>
                </div>
                <span style={{ fontSize: '0.62rem', color: item.currentStock <= item.minThreshold ? '#BA7517' : '#555', fontWeight: '900', padding: '2px 8px', borderRadius: '4px', background: item.currentStock <= item.minThreshold ? 'rgba(138,112,77,0.12)' : 'rgba(211,191,162,0.04)', border: `1px solid ${item.currentStock <= item.minThreshold ? 'rgba(186,117,23,0.25)' : '#1a1a1a'}` }}>
                  {item.currentStock <= item.minThreshold ? 'LOW' : 'OK'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* QTY TO ADD */}
    <div>
      <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
        {selectedExistingItem ? 'QTY TO ADD' : 'STOCK'}
      </label>
      <input type="number" placeholder={selectedExistingItem ? `+ to ${selectedExistingItem.currentStock}` : '500'}
        style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
        value={newInventoryItem.currentStock}
        onChange={e => setNewInventoryItem({ ...newInventoryItem, currentStock: e.target.value })}
      />
    </div>

    {/* PURCHASE PRICE — replaces "cost/unit" in restock mode */}
    <div>
      <label style={{ fontSize: '0.55rem', color: selectedExistingItem ? '#d3bfa2' : '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
        {selectedExistingItem ? 'BUY PRICE (₹/unit) *' : 'COST (₹/unit)'}
      </label>
      <input type="number" step="0.01"
        placeholder={selectedExistingItem ? `last: ₹${(selectedExistingItem.lastPurchasePrice || selectedExistingItem.costPrice || 0).toFixed(2)}` : '2.50'}
        style={{ width: '100%', padding: '10px 12px', background: '#000', border: `1px solid ${selectedExistingItem ? 'rgba(211,191,162,0.35)' : '#1a1a1a'}`, color: '#fff', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
        value={selectedExistingItem ? newInventoryItem.purchasePrice : newInventoryItem.costPrice}
        onChange={e => {
          if (selectedExistingItem) {
            setNewInventoryItem({ ...newInventoryItem, purchasePrice: e.target.value });
          } else {
            setNewInventoryItem({ ...newInventoryItem, costPrice: e.target.value });
          }
        }}
      />
    </div>

    {/* VENDOR (restock only) OR MIN THRESHOLD (new item) */}
    {selectedExistingItem ? (
      <div>
        <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>VENDOR (optional)</label>
        <input type="text" placeholder="e.g. Rajesh Traders"
          style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
          value={newInventoryItem.vendor || ''}
          onChange={e => setNewInventoryItem({ ...newInventoryItem, vendor: e.target.value })}
        />
      </div>
    ) : (
      <>
        <div>
          <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>MIN THRESHOLD</label>
          <input type="number" placeholder="100"
            style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
            value={newInventoryItem.minThreshold}
            onChange={e => setNewInventoryItem({ ...newInventoryItem, minThreshold: e.target.value })}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>UNIT</label>
          <select style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            value={newInventoryItem.unit}
            onChange={e => setNewInventoryItem({ ...newInventoryItem, unit: e.target.value })}>
            {['gm', 'kg', 'ml', 'l', 'pcs'].map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
          </select>
        </div>
      </>
    )}

    {/* ADD / RESTOCK BUTTON */}
    <div>
      <label style={{ fontSize: '0.55rem', color: 'transparent', display: 'block', marginBottom: '6px' }}>_</label>
      <button onClick={async () => {
        if (!newInventoryItem.itemName?.trim() || !newInventoryItem.currentStock) return showNotif("Name and quantity are required", "error");
        if (selectedExistingItem && !newInventoryItem.purchasePrice) return showNotif("Enter the purchase price for this restock — needed to update WAC", "error");
        try {
          const payload = {
            itemName: newInventoryItem.itemName,
            unit: selectedExistingItem ? selectedExistingItem.unit : (newInventoryItem.unit || 'gm'),
            currentStock: Number(newInventoryItem.currentStock),
            vendor: newInventoryItem.vendor || '',
            ...(selectedExistingItem
              ? { costPrice: Number(newInventoryItem.purchasePrice) }  // purchase price → WAC calc on server
              : { minThreshold: Number(newInventoryItem.minThreshold) || 0, costPrice: Number(newInventoryItem.costPrice) || 0 }
            )
          };
          const res = await axios.post(`${BASE_URL}/inventory/${tenantId}`, payload);
          if (res.data.merged) {
            const msg = res.data.wacUpdated
              ? `✓ Restocked · WAC updated: ${res.data.note}`
              : `✓ ${res.data.item.itemName} restocked at existing WAC`;
            showNotif(msg);
            // Cost spike alert
            if (res.data.priceChangePct > 25) showNotif(`⚠ Price spike: +${res.data.priceChangePct}% vs WAC — check supplier`, "error");
            else if (res.data.priceChangePct > 10) showNotif(`⚡ Price up ${res.data.priceChangePct}% vs WAC`, "info");
          } else {
            showNotif(`✓ ${res.data.item.itemName} added to inventory`);
          }
          setNewInventoryItem({ itemName: '', unit: 'gm', currentStock: '', minThreshold: '', costPrice: '', purchasePrice: '', vendor: '' });
          setSelectedExistingItem(null);
          setInventorySuggestions([]);
          setShowSuggestions(false);
          fetchManagementData();
        } catch { showNotif("Failed to add ingredient", "error"); }
      }} style={{ padding: '10px 20px', background: selectedExistingItem ? 'linear-gradient(135deg,#bda88a,#d3bfa2)' : 'linear-gradient(135deg,#d3bfa2,#bda88a)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        {selectedExistingItem ? '+ RESTOCK' : '+ ADD'}
      </button>
    </div>
  </div>

  <div style={{ marginTop: '10px', fontSize: '0.62rem', color: '#333', fontWeight: '600' }}>
    {selectedExistingItem
      ? '💡 Enter the price you paid THIS time — WAC auto-recalculates weighted average across all batches.'
      : '💡 Type an ingredient name to see existing matches and restock with WAC calculation.'}
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
<table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
  <thead>
    <tr style={{ fontSize: '0.58rem', color: '#444', borderBottom: '1px solid #1a1a1a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
      <th style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>Ingredient</th>
      <th style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>Unit</th>
      <th style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>Current Stock</th>
      <th style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>
        Min Threshold
        <span style={{ color: '#d3bfa2', marginLeft: '4px', fontSize: '0.5rem' }}>✎ editable</span>
      </th>
      <th style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>
        Cost/Unit
        <span style={{ color: '#d3bfa2', marginLeft: '4px', fontSize: '0.5rem' }}>✎ editable</span>
      </th>
      <th style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>Stock Value</th>
      <th style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>Status</th>
      <th style={{ padding: '0 16px 12px 0', textAlign: 'left' }}>Action</th>
    </tr>
  </thead>
  <tbody>
    {inventory
      .filter(i => i.itemName?.toLowerCase().includes(inventorySearchQuery.toLowerCase()))
      .map(item => {
        const isLow = item.currentStock <= item.minThreshold;
        const sv = Math.round(item.currentStock * item.costPrice);
        return (
          <tr key={item._id} style={{ borderBottom: '1px solid #0d0d0d' }}>
 
            {/* INGREDIENT NAME */}
            <td style={{ padding: '14px 16px 14px 0', fontWeight: '900', color: '#fff', fontSize: '0.82rem' }}>
              {item.itemName}
            </td>
 
            {/* UNIT */}
            <td style={{ color: '#555', fontSize: '0.75rem', fontWeight: '800', paddingRight: '16px' }}>
              {item.unit}
            </td>
 
            {/* CURRENT STOCK — edits stock value only */}
            <td style={{ paddingRight: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  key={`${item._id}-stock-${item.currentStock}`}
                  defaultValue={Math.max(0, item.currentStock)}
                  title="Edit current stock level directly"
                  style={{ width: '80px', background: '#000', border: `1px solid ${item.currentStock < 0 ? 'rgba(186,117,23,0.4)' : '#1a1a1a'}`, color: item.currentStock < 0 ? '#BA7517' : '#d3bfa2', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '900', outline: 'none' }}
                  onBlur={async e => {
                    const val = Number(e.target.value);
                    if (val === item.currentStock) return;
                    // Use general patch — stock only
                    await axios.patch(`${BASE_URL}/inventory/item/${item._id}`, { currentStock: val });
                    fetchManagementData();
                    showNotif(`${item.itemName} stock → ${val} ${item.unit}`);
                  }}
                />
                {item.currentStock < 0 && (
                  <span title="Stock depleted" style={{ fontSize: '0.7rem', color: '#BA7517' }}>⚠</span>
                )}
              </div>
            </td>
 
            {/* MIN THRESHOLD — uses /config route, does NOT touch stock */}
            <td style={{ paddingRight: '16px' }}>
              <input
                type="number"
                key={`${item._id}-thresh-${item.minThreshold}`}
                defaultValue={item.minThreshold}
                title="Click to edit minimum threshold — saves on click-away"
                style={{ width: '70px', background: '#000', border: '1px solid rgba(211,191,162,0.15)', color: '#888', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', outline: 'none', cursor: 'text' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(211,191,162,0.4)'; e.target.style.color = '#fff'; }}
                onBlur={async e => {
                  e.target.style.borderColor = 'rgba(211,191,162,0.15)';
                  e.target.style.color = '#888';
                  const val = Number(e.target.value);
                  if (val === item.minThreshold) return;
                  await axios.patch(`${BASE_URL}/inventory/item/${item._id}/config`, { minThreshold: val });
                  fetchManagementData();
                  showNotif(`${item.itemName} threshold → ${val} ${item.unit}`);
                }}
              />
            </td>
 
{/* WAC + LAST PRICE */}
<td style={{ paddingRight: '16px' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    {/* WAC — editable */}
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ position: 'absolute', left: '8px', color: '#555', fontSize: '0.72rem', fontWeight: '900', pointerEvents: 'none' }}>₹</span>
      <input type="number" step="0.01"
        key={`${item._id}-wac-${item.weightedAvgCost || item.costPrice}`}
        defaultValue={(item.weightedAvgCost || item.costPrice || 0).toFixed(2)}
        title="Weighted Average Cost — auto-updated on every restock. Edit to manually correct."
        style={{ width: '82px', paddingLeft: '18px', padding: '6px 10px 6px 18px', background: '#000', border: '1px solid rgba(211,191,162,0.15)', color: '#666', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', outline: 'none', cursor: 'text' }}
        onFocus={e => { e.target.style.borderColor = 'rgba(211,191,162,0.4)'; e.target.style.color = '#fff'; }}
        onBlur={async e => {
          e.target.style.borderColor = 'rgba(211,191,162,0.15)';
          e.target.style.color = '#666';
          const val = Number(e.target.value);
          const current = item.weightedAvgCost || item.costPrice || 0;
          if (Math.abs(val - current) < 0.001) return;
          await axios.patch(`${BASE_URL}/inventory/item/${item._id}/config`, { costPrice: val });
          fetchManagementData();
          showNotif(`${item.itemName} WAC manually set → ₹${val}/${item.unit}`);
        }}
      />
    </div>
    {/* Last purchase price + drift indicator */}
    {item.lastPurchasePrice && item.lastPurchasePrice !== (item.weightedAvgCost || item.costPrice) && (() => {
      const wac = item.weightedAvgCost || item.costPrice || 0;
      const last = item.lastPurchasePrice;
      const drift = wac > 0 ? ((last - wac) / wac) * 100 : 0;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.52rem', color: '#444' }}>last ₹{last.toFixed(2)}</span>
          <span style={{ fontSize: '0.5rem', fontWeight: '900',
            color: Math.abs(drift) > 25 ? '#BA7517' : Math.abs(drift) > 10 ? '#d3bfa2' : '#555'
          }}>
            {drift > 0 ? '▲' : '▼'}{Math.abs(drift).toFixed(0)}%
          </span>
        </div>
      );
    })()}
    <span style={{ fontSize: '0.5rem', color: '#2a2a2a', letterSpacing: '0.5px' }}>WAC ✎</span>
  </div>
</td>
 
            {/* STOCK VALUE */}
            <td style={{ color: sv >= 0 ? '#d3bfa2' : '#8a704d', fontWeight: '900', fontSize: '0.82rem', paddingRight: '16px' }}>
              ₹{Math.abs(sv).toLocaleString()}{sv < 0 ? ' ⚠' : ''}
            </td>
 
            {/* STATUS */}
<td style={{ paddingRight: '10px' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    {/* Existing status badge — unchanged logic */}
    <span style={{
      fontSize: '0.58rem', padding: '3px 8px', borderRadius: '4px', fontWeight: '900',
      background: isLow ? 'rgba(186,117,23,0.12)' : 'rgba(211,191,162,0.04)',
      color: isLow ? '#BA7517' : '#444',
      border: `1px solid ${isLow ? 'rgba(186,117,23,0.25)' : '#1a1a1a'}`
    }}>
      {isLow ? 'LOW STOCK' : 'OK'}
    </span>

    {/* ── PURCHASE ORDER BUTTON — only shows when low stock ── */}
    {isLow && (
      <button
        onClick={() => {
          // Pull procurement data for this item if available
          const proc = procurementData.find(p => p._id?.toString() === item._id?.toString());

          // Calculate suggested reorder quantity:
          // avgDailyUsage × 30 days − current stock, rounded up to nearest 100/10
          const avgDaily = proc?.avgDailyUsage || 0;
          const targetDays = 30;
          const needed = Math.max(0, Math.ceil((avgDaily * targetDays) - item.currentStock));
          // Round to a sensible quantity based on unit
          const roundTo = ['kg','l'].includes(item.unit) ? 1 : item.unit === 'gm' || item.unit === 'ml' ? 100 : 10;
          const suggestedQty = needed > 0 ? Math.ceil(needed / roundTo) * roundTo : Math.ceil(item.minThreshold * 2 / roundTo) * roundTo;

          // Last vendor from purchase history
          const lastVendor = item.purchaseHistory?.[0]?.vendor || '';
          const lastPrice  = item.lastPurchasePrice || item.costPrice || 0;
          const daysLeft   = proc?.daysRemaining;

          setPurchaseOrderModal({
            item,
            proc,
            suggestedQty,
            lastVendor,
            lastPrice,
            daysLeft,
            customQty: String(suggestedQty),
            customVendor: lastVendor,
            copySuccess: false,
          });
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 8px', borderRadius: '5px',
          background: 'rgba(186,117,23,0.12)',
          border: '1px solid rgba(186,117,23,0.35)',
          color: '#BA7517', cursor: 'pointer',
          fontSize: '0.56rem', fontWeight: '900', letterSpacing: '0.5px',
          whiteSpace: 'nowrap'
        }}
        title="Generate purchase order for this ingredient"
      >
        <ShoppingCart size={9}/> PURCHASE ORDER
      </button>
    )}
  </div>
</td>
 
{/* ACTION */}
<td>
  <div style={{ display: 'flex', gap: '6px' }}>
    <button
      onClick={async () => {
        setPurchaseHistoryItem(item);
        await fetchPurchaseHistory(item._id);
      }}
      style={{ background: 'transparent', border: '1px solid rgba(211,191,162,0.2)', color: '#8a704d', padding: '5px 10px', borderRadius: '6px', fontSize: '0.58rem', cursor: 'pointer', fontWeight: '800', whiteSpace: 'nowrap' }}
      title="View purchase history"
    >
      HISTORY
    </button>
    <button
      onClick={() => setConfirmModal({
        show: true,
        title: `Remove ${item.itemName}?`,
        subtitle: 'Permanently delete this ingredient and all linked recipe references.',
        onConfirm: async () => {
          await axios.delete(`${BASE_URL}/inventory/item/${item._id}`);
          fetchManagementData();
          showNotif(`${item.itemName} removed`);
        }
      })}
      style={{ background: 'transparent', border: '1px solid #1a1a1a', color: '#444', padding: '5px 10px', borderRadius: '6px', fontSize: '0.58rem', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.color = '#BA7517'; e.currentTarget.style.borderColor = 'rgba(186,117,23,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = '#1a1a1a'; }}
    >
      REMOVE
    </button>
  </div>
</td>
          </tr>
        );
      })}
  </tbody>
  <tfoot>
    <tr style={{ borderTop: '2px solid #1a1a1a' }}>
      <td colSpan="5" style={{ padding: '14px 0', fontSize: '0.65rem', color: '#8a704d', fontWeight: '900', textTransform: 'uppercase' }}>TOTAL STOCK VALUE</td>
      <td style={{ padding: '14px 0', fontWeight: '900', color: '#d3bfa2', fontSize: '0.95rem' }}>
        ₹{inventory.reduce((a, i) => a + Math.max(0, Math.round(i.currentStock * i.costPrice)), 0).toLocaleString()}
      </td>
      <td colSpan="2" />
    </tr>
  </tfoot>
</table>
{/* PURCHASE HISTORY DRAWER */}
<AnimatePresence>
  {purchaseHistoryItem && (
    <div style={styles.modalBackdrop} onClick={() => setPurchaseHistoryItem(null)}>
      <motion.div
        initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'tween', duration: 0.25 }}
        onClick={e => e.stopPropagation()}
        style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '420px', background: '#080808', borderLeft: '1px solid #151515', display: 'flex', flexDirection: 'column', zIndex: 9100 }}
      >
        {/* HEADER */}
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #111', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '6px' }}>PURCHASE LEDGER</div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>{purchaseHistoryItem.itemName}</h3>
              <div style={{ fontSize: '0.75rem', color: '#8a704d', marginTop: '3px' }}>{purchaseHistoryItem.unit}</div>
            </div>
            <button onClick={() => setPurchaseHistoryItem(null)} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#555', padding: '7px', borderRadius: '8px', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {/* SUMMARY STATS */}
          {purchaseHistoryData && !purchaseHistoryLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '16px' }}>
              {[
                { l: 'CURRENT WAC', v: `₹${(purchaseHistoryData.weightedAvgCost || 0).toFixed(2)}` },
                { l: 'LAST BUY', v: `₹${(purchaseHistoryData.lastPurchasePrice || 0).toFixed(2)}` },
                { l: 'STOCK VALUE', v: `₹${((purchaseHistoryData.currentStock || 0) * (purchaseHistoryData.weightedAvgCost || 0)).toFixed(0)}` },
              ].map(s => (
                <div key={s.l} style={{ background: '#0d0d0d', padding: '10px', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: '0.52rem', color: '#444', fontWeight: '900', marginBottom: '3px' }}>{s.l}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#d3bfa2' }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HISTORY LIST */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 40px' }} className="custom-scroll">
          {purchaseHistoryLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#333', fontSize: '0.8rem' }}>LOADING...</div>
          ) : !purchaseHistoryData?.purchaseHistory?.length ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#222', fontSize: '0.8rem', fontWeight: '700' }}>
              NO PURCHASE HISTORY YET<br/>
              <span style={{ fontSize: '0.65rem', color: '#1a1a1a', marginTop: '8px', display: 'block' }}>History recorded from next restock</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '14px' }}>
                {purchaseHistoryData.purchaseHistory.length} PURCHASE{purchaseHistoryData.purchaseHistory.length > 1 ? 'S' : ''} RECORDED
              </div>
              {purchaseHistoryData.purchaseHistory.map((entry, idx) => {
                const driftPct = entry.wacBefore > 0
                  ? ((entry.unitPrice - entry.wacBefore) / entry.wacBefore) * 100
                  : 0;
                const isFirst = idx === purchaseHistoryData.purchaseHistory.length - 1;
                return (
                  <div key={idx} style={{ padding: '16px', background: '#0a0a0a', border: '1px solid #111', borderRadius: '12px', marginBottom: '10px' }}>
                    {/* DATE + VENDOR */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff' }}>
                          {new Date(entry.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        {entry.vendor && <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '2px' }}>{entry.vendor}</div>}
                        {entry.batchId && <div style={{ fontSize: '0.58rem', color: '#333', marginTop: '1px' }}>Batch: {entry.batchId}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#d3bfa2' }}>₹{entry.unitPrice?.toFixed(2)}/{purchaseHistoryItem.unit}</div>
                        <div style={{ fontSize: '0.62rem', color: '#444', marginTop: '2px' }}>× {entry.qty} {purchaseHistoryItem.unit} = ₹{entry.totalCost?.toFixed(0)}</div>
                      </div>
                    </div>
                    {/* WAC MOVEMENT */}
                    {!isFirst && entry.wacBefore > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#050505', borderRadius: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.62rem', color: '#444' }}>WAC</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#666' }}>₹{entry.wacBefore?.toFixed(2)}</span>
                        <span style={{ fontSize: '0.6rem', color: '#2a2a2a' }}>→</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: '900', color: '#d3bfa2' }}>₹{entry.wacAfter?.toFixed(2)}</span>
                        {Math.abs(driftPct) > 0.5 && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.6rem', fontWeight: '900', padding: '2px 7px', borderRadius: '4px',
                            color: driftPct > 25 ? '#BA7517' : driftPct > 10 ? '#d3bfa2' : driftPct < -10 ? '#4ade80' : '#555',
                            background: driftPct > 25 ? 'rgba(186,117,23,0.1)' : driftPct > 10 ? 'rgba(211,191,162,0.06)' : driftPct < -10 ? 'rgba(74,222,128,0.06)' : 'transparent',
                            border: `1px solid ${driftPct > 25 ? 'rgba(186,117,23,0.3)' : driftPct > 10 ? 'rgba(211,191,162,0.15)' : driftPct < -10 ? 'rgba(74,222,128,0.2)' : '#1a1a1a'}`
                          }}>
                            {driftPct > 0 ? '▲' : '▼'} {Math.abs(driftPct).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    )}
                    {/* STOCK BEFORE */}
                    <div style={{ fontSize: '0.58rem', color: '#333' }}>
                      Stock before: {entry.stockBefore} → {(entry.stockBefore || 0) + (entry.qty || 0)} {purchaseHistoryItem.unit}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
                   </div>
                )}
              </div>

              {/* PROCUREMENT PREDICTOR */}
{procurementData.length > 0 && (
  <div style={{ ...styles.biCard, borderLeft: '4px solid #8a704d' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h4 style={{ ...styles.biTitle, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Truck size={16}/> PROCUREMENT PREDICTOR
      </h4>
      {/* Summary pill */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <span style={{
          fontSize: '0.58rem', fontWeight: '900', padding: '4px 12px', borderRadius: '20px',
          background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.25)', color: '#BA7517'
        }}>
          {procurementData.filter(i => i.isLow || (i.daysRemaining !== null && i.daysRemaining <= 7)).length} items need reorder
        </span>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
      {procurementData.slice(0, 12).map(item => {
        const isUrg = item.daysRemaining !== null && item.daysRemaining <= 3;
        const isWrn = item.daysRemaining !== null && item.daysRemaining <= 7;
        const needsOrder = isUrg || isWrn || item.isLow;

        // Find full inventory item for vendor/price lookup
        const fullItem = inventory.find(i => i._id?.toString() === item._id?.toString()) || {};
        const lastVendor = fullItem.purchaseHistory?.[0]?.vendor || '';
        const lastPrice  = fullItem.lastPurchasePrice || fullItem.costPrice || 0;

        // Suggested qty
        const avgDaily = item.avgDailyUsage || 0;
        const needed   = Math.max(0, Math.ceil((avgDaily * 30) - item.currentStock));
        const roundTo  = ['kg','l'].includes(item.unit) ? 1 : item.unit === 'gm' || item.unit === 'ml' ? 100 : 10;
        const suggestedQty = needed > 0 ? Math.ceil(needed / roundTo) * roundTo
          : Math.ceil(item.minThreshold * 2 / roundTo) * roundTo;

        return (
          <div key={item._id} style={{
            background: '#050505',
            border: `1px solid ${isUrg ? 'rgba(186,117,23,0.4)' : needsOrder ? 'rgba(186,117,23,0.2)' : '#111'}`,
            padding: '14px', borderRadius: '12px', position: 'relative',
            boxShadow: isUrg ? '0 0 12px rgba(186,117,23,0.08)' : 'none'
          }}>
            {/* Urgency indicator strip */}
            {needsOrder && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px', borderRadius: '12px 12px 0 0',
                background: isUrg ? '#BA7517' : 'rgba(186,117,23,0.4)'
              }}/>
            )}

            {/* Item name + days left */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontWeight: '900', color: '#fff', fontSize: '0.8rem', flex: 1, marginRight: '6px' }}>{item.itemName}</div>
              {item.daysRemaining !== null ? (
                <span style={{
                  fontSize: '0.65rem', fontWeight: '900', padding: '2px 8px', borderRadius: '4px', flexShrink: 0,
                  background: isUrg ? 'rgba(186,117,23,0.18)' : isWrn ? 'rgba(186,117,23,0.08)' : 'rgba(211,191,162,0.04)',
                  color: isUrg ? '#BA7517' : isWrn ? '#d3bfa2' : '#555'
                }}>
                  {item.daysRemaining}d left
                </span>
              ) : (
                <span style={{ fontSize: '0.58rem', color: '#333' }}>No usage data</span>
              )}
            </div>

            {/* Stock bar */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.6rem', color: '#444' }}>{item.currentStock} {item.unit} remaining</span>
                <span style={{ fontSize: '0.6rem', color: '#333' }}>min: {item.minThreshold} {item.unit}</span>
              </div>
              <div style={{ height: '3px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, item.minThreshold > 0 ? Math.round((item.currentStock / (item.minThreshold * 3)) * 100) : 50)}%`,
                  background: isUrg ? '#BA7517' : isWrn ? '#8a704d' : '#2a2a2a',
                  borderRadius: '2px', transition: 'width 0.5s'
                }}/>
              </div>
            </div>

            {/* Usage rate */}
            {item.avgDailyUsage > 0 && (
              <div style={{ fontSize: '0.58rem', color: '#555', marginBottom: '8px' }}>
                Avg usage: {item.avgDailyUsage} {item.unit}/day
                {suggestedQty > 0 && <span style={{ color: '#8a704d', marginLeft: '6px' }}>· Reorder: ~{suggestedQty} {item.unit}</span>}
              </div>
            )}

            {/* Last vendor */}
            {lastVendor && (
              <div style={{ fontSize: '0.58rem', color: '#444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={8} color="#555"/> {lastVendor}
                {lastPrice > 0 && <span style={{ color: '#555' }}>· ₹{lastPrice.toFixed(2)}/{item.unit}</span>}
              </div>
            )}

            {/* 1-TAP PURCHASE ORDER BUTTON */}
            {needsOrder && (
              <button
                onClick={() => {
                  setPurchaseOrderModal({
                    item: { ...item, ...fullItem },
                    proc: item,
                    suggestedQty,
                    lastVendor,
                    lastPrice,
                    daysLeft: item.daysRemaining,
                    customQty: String(suggestedQty),
                    customVendor: lastVendor,
                    copySuccess: false,
                  });
                }}
                style={{
                  width: '100%', padding: '8px', borderRadius: '7px',
                  background: isUrg ? 'rgba(186,117,23,0.15)' : 'rgba(186,117,23,0.08)',
                  border: `1px solid ${isUrg ? 'rgba(186,117,23,0.45)' : 'rgba(186,117,23,0.25)'}`,
                  color: '#BA7517', cursor: 'pointer',
                  fontSize: '0.62rem', fontWeight: '900', letterSpacing: '0.5px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(186,117,23,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isUrg ? 'rgba(186,117,23,0.15)' : 'rgba(186,117,23,0.08)'; }}
              >
                <ShoppingCart size={11}/> GENERATE PURCHASE ORDER
              </button>
            )}
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
{activeTab === 'recipes' && (
  <motion.div key="recipes" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
    style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '100px', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>

    {/* ══════════ HEADER ══════════ */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(211,191,162,0.1)', border: '1px solid rgba(211,191,162,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChefHat size={17} color="#d3bfa2" strokeWidth={1.5} />
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2.5px' }}>RECIPE ENGINE</div>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', marginTop: '3px', fontWeight: '500' }}>
            Link ingredients · Auto stock deduction · Live costing
          </div>
        </div>
      </div>

      {/* Coverage ring */}
      {(() => {
        const mapped = recipes.filter(r => r.ingredients?.length > 0).length;
        const total  = menuItems.length;
        const pct    = total > 0 ? Math.round((mapped / total) * 100) : 0;
        const circum = 2 * Math.PI * 15.9;
        const dash   = (pct / 100) * circum;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'rgba(211,191,162,0.06)', border: '1px solid rgba(211,191,162,0.18)', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: '1.5px', marginBottom: '2px' }}>RECIPE COVERAGE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace', lineHeight: 1 }}>{pct}<span style={{ fontSize: '0.6rem', marginLeft: '1px' }}>%</span></div>
              <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{mapped} of {total} dishes</div>
            </div>
            <div style={{ width: '44px', height: '44px', position: 'relative', flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '44px', height: '44px', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#d3bfa2" strokeWidth="3.2"
                  strokeDasharray={`${dash.toFixed(1)} ${(circum - dash).toFixed(1)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.7s ease' }} />
              </svg>
            </div>
          </div>
        );
      })()}
    </div>

    {/* ══════════ RECIPE BUILDER ══════════ */}
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(211,191,162,0.18)', borderRadius: '18px', overflow: 'hidden' }}>

      {/* Builder title bar */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '9px', background: 'rgba(211,191,162,0.04)' }}>
        <CookingPot size={14} color="#d3bfa2" strokeWidth={1.5} />
        <span style={{ fontSize: '0.62rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2px' }}>
          {activeRecipeItemId
            ? `EDITING — ${menuItems.find(m => m._id === activeRecipeItemId)?.name || ''}`
            : 'RECIPE BUILDER'}
        </span>
        {activeRecipeItemId && (
          <button
            onClick={() => { setActiveRecipeItemId(''); setRecipeIngredientRows([{ inventoryId: '', quantityUsed: '' }]); }}
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: '7px', padding: '4px 10px', fontSize: '0.55rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px' }}>
            CLEAR
          </button>
        )}
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '28px' }}>

        {/* ── LEFT: Dish selector + costing panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>SELECT DISH</label>
            <select
              value={activeRecipeItemId}
              onChange={e => {
                setActiveRecipeItemId(e.target.value);
                if (e.target.value) {
                  const ex = recipes.find(r => r.menuItemId?.toString() === e.target.value);
                  setRecipeIngredientRows(ex?.ingredients?.length
                    ? ex.ingredients.map(i => ({
                        inventoryId: i.inventoryId?._id ? i.inventoryId._id.toString() : (i.inventoryId?.toString() || ''),
                        quantityUsed: i.quantityUsed
                      }))
                    : [{ inventoryId: '', quantityUsed: '' }]);
                }
              }}
              style={{ width: '100%', padding: '11px 14px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
              <option value="">— Select a dish —</option>
              {menuItems.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} {recipes.some(r => r.menuItemId?.toString() === m._id && r.ingredients?.length > 0) ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Costing summary — appears when dish selected */}
          {activeRecipeItemId && (() => {
            const dish = menuItems.find(m => m._id === activeRecipeItemId);
            if (!dish) return null;
            const totalCost = recipeIngredientRows.reduce((sum, row) => {
              if (!row.inventoryId || !row.quantityUsed) return sum;
              const inv = inventory.find(i => i._id === row.inventoryId);
              if (!inv) return sum;
              return sum + ((inv.weightedAvgCost || inv.costPrice || 0) * Number(row.quantityUsed));
            }, 0);
            const price     = dish.price || 0;
            const profit    = price - totalCost;
            const marginPct = price > 0 ? Math.round((profit / price) * 100) : 0;
            const fcPct     = price > 0 ? Math.round((totalCost / price) * 100) : 0;
            const profRow   = profitabilityData.find(p => p._id?.toString() === dish._id);
            const marginColor = marginPct >= 55 ? '#d3bfa2' : marginPct >= 35 ? '#c8a84b' : '#c87272';

            return (
              <div style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' }}>

                {/* Dish name bar */}
                <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(211,191,162,0.04)' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#ffffff', marginBottom: '6px' }}>{dish.name}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.58rem', padding: '3px 9px', borderRadius: '5px', background: 'rgba(211,191,162,0.12)', color: '#d3bfa2', border: '1px solid rgba(211,191,162,0.25)', fontFamily: 'monospace', fontWeight: '800' }}>
                      ₹{price} MENU PRICE
                    </span>
                    {dish.priceHalf > 0 && (
                      <span style={{ fontSize: '0.58rem', padding: '3px 9px', borderRadius: '5px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>
                        HALF ₹{dish.priceHalf}
                      </span>
                    )}
                    <span style={{ fontSize: '0.58rem', padding: '3px 9px', borderRadius: '5px', background: dish.isAvailable !== false ? 'rgba(211,191,162,0.06)' : 'rgba(255,255,255,0.03)', color: dish.isAvailable !== false ? 'rgba(211,191,162,0.6)' : 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {dish.isAvailable !== false ? 'VISIBLE' : 'HIDDEN'}
                    </span>
                  </div>
                </div>

                {/* Live cost rows */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.48rem', fontWeight: '900', color: 'rgba(211,191,162,0.4)', letterSpacing: '2.5px', marginBottom: '12px' }}>LIVE COSTING</div>

                  {[
                    { label: 'Ingredient Cost / Serving', value: `₹${totalCost.toFixed(2)}`, color: totalCost > 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' },
                    { label: 'Menu Price',                 value: `₹${price}`,               color: '#d3bfa2' },
                    { label: 'Profit per Serving',         value: `₹${profit.toFixed(2)}`,   color: profit > 0 ? '#d3bfa2' : '#c87272' },
                    { label: 'Food Cost %',                value: `${fcPct}%`,                color: fcPct > 40 ? '#c8a84b' : 'rgba(255,255,255,0.6)' },
                    { label: 'Gross Margin %',             value: `${marginPct}%`,            color: marginColor },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}>{label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '900', fontFamily: 'monospace', color }}>{value}</span>
                    </div>
                  ))}

                  {/* Margin bar */}
                  {price > 0 && (
                    <div style={{ marginTop: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', fontWeight: '700' }}>MARGIN HEALTH</span>
                        <span style={{ fontSize: '0.52rem', fontWeight: '900', color: marginColor, fontFamily: 'monospace' }}>{marginPct}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(Math.max(marginPct, 0), 100)}%`, background: marginColor, borderRadius: '3px', transition: 'width 0.45s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.44rem', color: '#c87272', fontWeight: '700' }}>LOW &lt;35%</span>
                        <span style={{ fontSize: '0.44rem', color: '#c8a84b', fontWeight: '700' }}>FAIR 35–55%</span>
                        <span style={{ fontSize: '0.44rem', color: '#d3bfa2', fontWeight: '700' }}>GOOD &gt;55%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Historical data */}
                {profRow?.totalQtySold > 0 && (
                  <div style={{ margin: '0 14px 14px', padding: '10px 12px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.12)', borderRadius: '9px' }}>
                    <div style={{ fontSize: '0.46rem', color: 'rgba(211,191,162,0.4)', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>HISTORICAL PERFORMANCE</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                      {[
                        { label: 'Units Sold',   value: profRow.totalQtySold },
                        { label: 'Revenue',      value: `₹${(profRow.totalRevenue || 0).toLocaleString()}` },
                        { label: 'Gross Profit', value: `₹${Math.round(profRow.grossProfit || 0).toLocaleString()}` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace' }}>{value}</div>
                          <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px', fontWeight: '600' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zero stock warning */}
                {recipeIngredientRows.some(row => { const inv = inventory.find(i => i._id === row.inventoryId); return inv && inv.currentStock <= 0; }) && (
                  <div style={{ margin: '0 14px 14px', display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px 11px', background: 'rgba(200,168,75,0.07)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: '8px' }}>
                    <AlertTriangle size={12} color="#c8a84b" strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '0.6rem', color: 'rgba(200,168,75,0.8)', lineHeight: 1.55, fontWeight: '500' }}>
                      Some ingredients are at zero stock. Recipe saves normally — dish only hides during settlement if Auto-Hide is enabled.
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── RIGHT: Ingredient rows ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', display: 'block', marginBottom: '10px' }}>INGREDIENTS PER SERVING</label>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 88px 36px', gap: '8px', marginBottom: '8px', padding: '0 2px' }}>
            {['INGREDIENT', 'QTY', 'LINE COST', ''].map(h => (
              <span key={h} style={{ fontSize: '0.46rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {recipeIngredientRows.map((row, idx) => {
              const inv        = inventory.find(i => i._id === row.inventoryId);
              const unitCost   = inv ? (inv.weightedAvgCost || inv.costPrice || 0) : 0;
              const lineCost   = unitCost * (Number(row.quantityUsed) || 0);
              const isZero     = inv && inv.currentStock <= 0;
              const isLow      = inv && inv.currentStock > 0 && inv.currentStock <= inv.minThreshold;

              return (
                <div key={idx}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 88px 36px', gap: '8px', alignItems: 'center' }}>

                    {/* Ingredient select */}
                    <div>
                      <select
                        value={row.inventoryId}
                        onChange={e => { const u = [...recipeIngredientRows]; u[idx].inventoryId = e.target.value; setRecipeIngredientRows(u); }}
                        style={{ width: '100%', padding: '9px 11px', background: '#0a0a0a', border: `1px solid ${isZero ? 'rgba(200,168,75,0.35)' : isLow ? 'rgba(211,191,162,0.2)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '9px', color: isZero ? '#c8a84b' : '#fff', fontSize: '0.72rem', outline: 'none', cursor: 'pointer' }}>
                        <option value="">— Select —</option>
                        {inventory.map(i => (
                          <option key={i._id} value={i._id}>
                            {i.itemName} ({i.unit}){i.currentStock <= 0 ? ' · OUT' : i.currentStock <= i.minThreshold ? ' · LOW' : ''}
                          </option>
                        ))}
                      </select>
                      {inv && (
                        <div style={{ marginTop: '3px', paddingLeft: '3px', fontSize: '0.48rem', color: isZero ? '#c8a84b' : 'rgba(255,255,255,0.28)', fontWeight: '600' }}>
                          Stock: <span style={{ fontFamily: 'monospace' }}>{inv.currentStock} {inv.unit}</span>
                          &nbsp;·&nbsp;WAC: <span style={{ fontFamily: 'monospace' }}>₹{(inv.weightedAvgCost || inv.costPrice || 0).toFixed(2)}/{inv.unit}</span>
                        </div>
                      )}
                    </div>

                    {/* Qty */}
                    <input
                      type="number" placeholder="Qty" min="0" step="0.01"
                      value={row.quantityUsed}
                      onChange={e => { const u = [...recipeIngredientRows]; u[idx].quantityUsed = e.target.value; setRecipeIngredientRows(u); }}
                      style={{ padding: '9px 10px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#fff', fontSize: '0.75rem', outline: 'none', width: '100%', fontFamily: 'monospace' }} />

                    {/* Line cost */}
                    <div style={{ height: '37px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: lineCost > 0 ? 'rgba(211,191,162,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${lineCost > 0 ? 'rgba(211,191,162,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '9px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '900', color: lineCost > 0 ? '#d3bfa2' : 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
                        {lineCost > 0 ? `₹${lineCost.toFixed(2)}` : '—'}
                      </span>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => setRecipeIngredientRows(p => p.filter((_, i) => i !== idx))}
                      style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', transition: 'all 0.15s', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,114,114,0.4)'; e.currentTarget.style.color = '#c87272'; e.currentTarget.style.background = 'rgba(200,114,114,0.07)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                      <X size={13} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total cost strip */}
          {recipeIngredientRows.some(r => r.inventoryId && r.quantityUsed) && (() => {
            const dish = menuItems.find(m => m._id === activeRecipeItemId);
            const total = recipeIngredientRows.reduce((sum, row) => {
              const inv = inventory.find(i => i._id === row.inventoryId);
              return sum + ((inv ? (inv.weightedAvgCost || inv.costPrice || 0) : 0) * (Number(row.quantityUsed) || 0));
            }, 0);
            const price = dish?.price || 0;
            const margin = price > 0 ? Math.round(((price - total) / price) * 100) : null;
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '11px 15px', background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.2)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'rgba(211,191,162,0.7)', letterSpacing: '0.5px' }}>TOTAL INGREDIENT COST</span>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '900', color: '#d3bfa2', fontFamily: 'monospace' }}>₹{total.toFixed(2)}</span>
                  {price > 0 && margin !== null && (
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                      {margin}% margin on ₹{price}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button
              onClick={() => setRecipeIngredientRows(p => [...p, { inventoryId: '', quantityUsed: '' }])}
              style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', fontSize: '0.6rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(211,191,162,0.3)'; e.currentTarget.style.color = '#d3bfa2'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
              <Package size={13} strokeWidth={2} />
              ADD INGREDIENT
            </button>
            <button
              disabled={!activeRecipeItemId}
              onClick={async () => {
                if (!activeRecipeItemId) return showNotif('Select a menu item first', 'error');
                const valid = recipeIngredientRows.filter(r => r.inventoryId && r.quantityUsed);
                if (!valid.length) return showNotif('Add at least one ingredient', 'error');
                try {
                  await axios.post(`${BASE_URL}/recipes/save`, { tenantId, menuItemId: activeRecipeItemId, ingredients: valid.map(r => ({ inventoryId: r.inventoryId, quantityUsed: Number(r.quantityUsed) })) });
                  const recipesRes = await axios.get(`${BASE_URL}/recipes/${tenantId}`);
                  setRecipes(recipesRes.data || []);
                  showNotif('Recipe saved');
                  setActiveRecipeItemId('');
                  setRecipeIngredientRows([{ inventoryId: '', quantityUsed: '' }]);
                  fetchAnalytics();
                  fetchManagementData();
                } catch { showNotif('Failed to save recipe', 'error'); }
              }}
              style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: activeRecipeItemId ? 'linear-gradient(135deg, #d3bfa2, #bda88a)' : 'rgba(255,255,255,0.04)', color: activeRecipeItemId ? '#0a0a0a' : 'rgba(255,255,255,0.2)', fontSize: '0.62rem', fontWeight: '900', letterSpacing: '1px', cursor: activeRecipeItemId ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.2s' }}>
              <PackageCheck size={14} strokeWidth={2} />
              SAVE RECIPE
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ══════════ RECIPE CARDS LIST ══════════ */}
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden' }}>

      {/* List header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(211,191,162,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Boxes size={14} color="#d3bfa2" strokeWidth={1.5} />
          <span style={{ fontSize: '0.62rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '2px' }}>
            DISH RECIPES
          </span>
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
            · {recipes.filter(r => r.ingredients?.length > 0).length} / {menuItems.length} mapped
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px' }}>
          <Search size={12} color="rgba(255,255,255,0.3)" strokeWidth={1.8} />
          <input type="text" placeholder="Search dish..." value={recipeSearchQuery || ''}
            onChange={e => setRecipeSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.72rem', width: '130px' }} />
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
        {menuItems
          .filter(m => m.name.toLowerCase().includes((recipeSearchQuery || '').toLowerCase()))
          .map(dish => {
            const recipeForDish = recipes.find(r => r.menuItemId?.toString() === dish._id.toString());
            const hasRecipe     = recipeForDish?.ingredients?.length > 0;
            const isActive      = activeRecipeItemId === dish._id;
            const profRow       = profitabilityData.find(p => p._id?.toString() === dish._id.toString());

            const recipeCost = hasRecipe
              ? recipeForDish.ingredients.reduce((sum, ing) => {
                  const inv = ing.inventoryId;
                  if (!inv) return sum;
                  return sum + ((inv.weightedAvgCost || inv.costPrice || 0) * ing.quantityUsed);
                }, 0)
              : null;

            const margin = recipeCost !== null && dish.price > 0
              ? Math.round(((dish.price - recipeCost) / dish.price) * 100)
              : null;

            const marginColor = margin === null ? null : margin >= 55 ? '#d3bfa2' : margin >= 35 ? '#c8a84b' : '#c87272';
            const hasOutIngredient = hasRecipe && recipeForDish.ingredients.some(ing => ing.inventoryId?.currentStock <= 0);

            return (
              <div
                key={dish._id}
                onClick={() => {
                  setActiveRecipeItemId(dish._id);
                  const ex = recipes.find(r => r.menuItemId?.toString() === dish._id.toString());
                  setRecipeIngredientRows(ex?.ingredients?.length
                    ? ex.ingredients.map(i => ({ inventoryId: i.inventoryId?._id ? i.inventoryId._id.toString() : (i.inventoryId?.toString() || ''), quantityUsed: i.quantityUsed }))
                    : [{ inventoryId: '', quantityUsed: '' }]);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  background: isActive ? 'rgba(211,191,162,0.07)' : hasRecipe ? 'rgba(255,255,255,0.03)' : '#050505',
                  border: `1px solid ${isActive ? 'rgba(211,191,162,0.4)' : hasRecipe ? 'rgba(211,191,162,0.15)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '13px', padding: '15px', cursor: 'pointer',
                  transition: 'all 0.2s', position: 'relative'
                }}
              >
                {/* Top badges */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {isActive && (
                    <span style={{ fontSize: '0.46rem', fontWeight: '900', padding: '2px 7px', borderRadius: '4px', background: 'rgba(211,191,162,0.15)', color: '#d3bfa2', border: '1px solid rgba(211,191,162,0.3)', letterSpacing: '0.5px' }}>EDITING</span>
                  )}
                  {hasOutIngredient && (
                    <AlertTriangle size={11} color="#c8a84b" strokeWidth={2} />
                  )}
                  <span style={{ fontSize: '0.46rem', fontWeight: '900', padding: '2px 7px', borderRadius: '4px', background: hasRecipe ? 'rgba(211,191,162,0.08)' : 'rgba(255,255,255,0.03)', color: hasRecipe ? '#d3bfa2' : 'rgba(255,255,255,0.25)', border: `1px solid ${hasRecipe ? 'rgba(211,191,162,0.18)' : 'rgba(255,255,255,0.07)'}`, letterSpacing: '0.5px' }}>
                    {hasRecipe ? `${recipeForDish.ingredients.length} ING` : 'NOT MAPPED'}
                  </span>
                </div>

                {/* Dish name */}
                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ffffff', marginBottom: '8px', paddingRight: '90px', lineHeight: 1.3 }}>
                  {dish.name}
                </div>

                {/* Price · cost · margin row */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.58rem', padding: '3px 8px', borderRadius: '5px', background: 'rgba(211,191,162,0.08)', color: '#d3bfa2', border: '1px solid rgba(211,191,162,0.18)', fontFamily: 'monospace', fontWeight: '800' }}>
                    ₹{dish.price}
                  </span>
                  {recipeCost !== null && (
                    <span style={{ fontSize: '0.58rem', padding: '3px 8px', borderRadius: '5px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontWeight: '700' }}>
                      Cost ₹{recipeCost.toFixed(2)}
                    </span>
                  )}
                  {margin !== null && (
                    <span style={{ fontSize: '0.58rem', padding: '3px 8px', borderRadius: '5px', fontWeight: '900', fontFamily: 'monospace', background: `${marginColor}18`, color: marginColor, border: `1px solid ${marginColor}40` }}>
                      {margin}% margin
                    </span>
                  )}
                </div>

                {/* Ingredient chips */}
                {hasRecipe && recipeForDish.ingredients.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '9px' }}>
                    {recipeForDish.ingredients.slice(0, 4).map((ing, i) => {
                      const invItem = ing.inventoryId;
                      const isOut   = invItem?.currentStock <= 0;
                      return (
                        <span key={i} style={{ fontSize: '0.52rem', padding: '3px 7px', borderRadius: '4px', background: isOut ? 'rgba(200,168,75,0.08)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isOut ? 'rgba(200,168,75,0.25)' : 'rgba(255,255,255,0.1)'}`, color: isOut ? '#c8a84b' : 'rgba(255,255,255,0.45)', fontWeight: '600' }}>
                          {invItem?.itemName || 'Unknown'} · {ing.quantityUsed}{invItem?.unit || ''}
                          {isOut ? ' OUT' : ''}
                        </span>
                      );
                    })}
                    {recipeForDish.ingredients.length > 4 && (
                      <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', padding: '3px 5px', fontWeight: '600' }}>+{recipeForDish.ingredients.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Sales line */}
                {profRow?.totalQtySold > 0 && (
                  <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', fontWeight: '600' }}>
                    {profRow.totalQtySold} sold · ₹{Math.round(profRow.grossProfit || 0).toLocaleString()} gross profit
                  </div>
                )}

                {/* Remove */}
                {hasRecipe && (
                  <button
                    onClick={async e => {
                      e.stopPropagation();
                      if (!window.confirm(`Remove recipe for "${dish.name}"?`)) return;
                      try {
                        await axios.delete(`${BASE_URL}/recipes/${tenantId}/${dish._id}`);
                        const recipesRes = await axios.get(`${BASE_URL}/recipes/${tenantId}`);
                        setRecipes(recipesRes.data || []);
                        if (activeRecipeItemId === dish._id) { setActiveRecipeItemId(''); setRecipeIngredientRows([{ inventoryId: '', quantityUsed: '' }]); }
                        showNotif('Recipe removed');
                      } catch { showNotif('Failed to remove', 'error'); }
                    }}
                    style={{ width: '100%', padding: '7px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: '0.56rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,114,114,0.35)'; e.currentTarget.style.color = '#c87272'; e.currentTarget.style.background = 'rgba(200,114,114,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}>
                    REMOVE RECIPE
                  </button>
                )}

                {/* Edit hint */}
                <div style={{ fontSize: '0.5rem', color: isActive ? 'rgba(211,191,162,0.4)' : 'rgba(255,255,255,0.18)', fontStyle: 'italic', marginTop: '7px', fontWeight: '500' }}>
                  {isActive ? 'Currently editing above' : hasRecipe ? 'Click to edit' : 'Click to add recipe'}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  </motion.div>
)}

{/* ── RESERVATIONS TAB (FULL PAGE) ── */}
{activeTab === 'reservations' && (
  <motion.div key="reservations" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}
    style={{display:'flex',flexDirection:'column',gap:'24px',paddingBottom:'100px',width:'100%'}}>

    {/* Header */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',paddingBottom:'20px',borderBottom:'1px solid #151515'}}>
      <div>
        <div style={{fontSize:'0.58rem',color:'#555',fontWeight:'900',letterSpacing:'2px',marginBottom:'6px'}}>BOOKING MANAGEMENT</div>
        <h2 style={{margin:0,fontSize:'1.2rem',fontWeight:'900',color:'#fff'}}>RESERVATION CALENDAR</h2>
        <p style={{margin:'5px 0 0',fontSize:'0.7rem',color:'#444',lineHeight:'1.5'}}>
          Manage advance bookings, table assignments and guest pre-orders.
        </p>
      </div>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        {/* Date navigator */}
        <button onClick={() => {
          const d = new Date(reservationViewDate);
          d.setDate(d.getDate()-1);
          setReservationViewDate(d.toISOString().split('T')[0]);
        }} style={{width:'32px',height:'32px',background:'transparent',border:'1px solid #1a1a1a',color:'#444',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(211,191,162,0.3)';e.currentTarget.style.color='#d3bfa2';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a1a';e.currentTarget.style.color='#444';}}>
          <ChevronLeft size={14}/>
        </button>
        <input type="date" value={reservationViewDate}
          onChange={e => setReservationViewDate(e.target.value)}
          style={{padding:'8px 12px',background:'#000',border:'1px solid rgba(211,191,162,0.2)',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.75rem',fontWeight:'900',outline:'none',colorScheme:'dark',cursor:'pointer'}}/>
        <button onClick={() => {
          const d = new Date(reservationViewDate);
          d.setDate(d.getDate()+1);
          setReservationViewDate(d.toISOString().split('T')[0]);
        }} style={{width:'32px',height:'32px',background:'transparent',border:'1px solid #1a1a1a',color:'#444',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(211,191,162,0.3)';e.currentTarget.style.color='#d3bfa2';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a1a';e.currentTarget.style.color='#444';}}>
          <ChevronRight size={14}/>
        </button>
        <button onClick={fetchCounterQueue}
          style={{padding:'8px 14px',background:'transparent',border:'1px solid rgba(211,191,162,0.2)',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.62rem',fontWeight:'900',cursor:'pointer'}}>
          ↻ REFRESH
        </button>
      </div>
    </div>

    {/* KPI strip */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
      {[
        { l:'TOTAL BOOKINGS',  v: reservationEntries.length,                                           c:'#d3bfa2' },
        { l:'CONFIRMED',       v: reservationEntries.filter(r=>r.status==='confirmed').length,          c:'#d3bfa2' },
        { l:'PENDING',         v: reservationEntries.filter(r=>r.status==='pending').length,            c:'#8a704d' },
        { l:'TOTAL COVERS',    v: reservationEntries.filter(r=>!['cancelled','no-show'].includes(r.status)).reduce((a,r)=>a+(r.partySize||0),0), c:'#fff' },
      ].map(s=>(
        <div key={s.l} style={{background:'#0d0d0d',border:'1px solid #1a1a1a',borderRadius:'14px',padding:'16px'}}>
          <div style={{fontSize:'0.52rem',color:'#444',fontWeight:'900',letterSpacing:'1px',marginBottom:'6px'}}>{s.l}</div>
          <div style={{fontSize:'1.6rem',fontWeight:'900',color:s.c}}>{s.v}</div>
        </div>
      ))}
    </div>

    {/* Timeline — hourly slots */}
    <div style={{background:'#080808',border:'1px solid rgba(211,191,162,0.07)',borderRadius:'20px',overflow:'hidden'}}>
      <div style={{padding:'16px 20px',borderBottom:'1px solid #0d0d0d',background:'#0a0a0a',display:'flex',alignItems:'center',gap:'10px'}}>
        <CalendarClock size={16} color="#d3bfa2"/>
        <span style={{fontSize:'0.72rem',fontWeight:'900',color:'#fff'}}>
          {new Date(reservationViewDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </span>
      </div>
      <div style={{padding:'20px'}}>
        {/* Generate hour slots 11am–11pm */}
        {Array.from({length:13},(_,i)=>i+11).map(hour => {
          const slotEntries = reservationEntries.filter(r => {
            const h = new Date(r.reservationTime).getHours();
            return h === hour;
          });
          const fmt = h => h === 12 ? '12:00 PM' : h < 12 ? `${h}:00 AM` : `${h-12}:00 PM`;
          const isCurrentHour = new Date().getHours() === hour;

          return (
            <div key={hour} style={{
              display:'flex',gap:'14px',
              paddingBottom:'14px',marginBottom:'14px',
              borderBottom:'1px solid #0d0d0d',
              background: isCurrentHour ? 'rgba(211,191,162,0.02)' : 'transparent',
              borderRadius: isCurrentHour ? '8px' : '0',
              padding: isCurrentHour ? '8px' : '0 0 14px 0'
            }}>
              {/* Hour label */}
              <div style={{
                minWidth:'70px',textAlign:'right',
                fontSize:'0.65rem',fontWeight:'900',
                color: isCurrentHour ? '#d3bfa2' : '#2a2a2a',
                paddingTop:'2px',flexShrink:0
              }}>
                {fmt(hour)}
                {isCurrentHour && (
                  <div style={{fontSize:'0.48rem',color:'rgba(211,191,162,0.4)',letterSpacing:'0.5px',marginTop:'2px'}}>NOW</div>
                )}
              </div>

              {/* Slot content */}
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:'6px'}}>
                {slotEntries.length === 0 ? (
                  <div style={{height:'32px',border:'1px dashed #141414',borderRadius:'8px',display:'flex',alignItems:'center',paddingLeft:'12px'}}>
                    <span style={{fontSize:'0.58rem',color:'#1e1e1e',fontWeight:'700'}}>Available</span>
                  </div>
                ) : slotEntries.map(entry => {
                  const sc = {
                    pending:   {bg:'rgba(211,191,162,0.05)',border:'rgba(211,191,162,0.12)',text:'#8a704d'},
                    confirmed: {bg:'rgba(211,191,162,0.1)', border:'rgba(211,191,162,0.3)', text:'#d3bfa2'},
                    seated:    {bg:'rgba(211,191,162,0.03)',border:'#1a1a1a',               text:'#444'},
                    cancelled: {bg:'#080808',               border:'#1a1a1a',               text:'#2a2a2a'},
                  }[entry.status] || {bg:'rgba(211,191,162,0.05)',border:'rgba(211,191,162,0.12)',text:'#8a704d'};
                  return (
                    <div key={entry._id} style={{
                      display:'flex',justifyContent:'space-between',alignItems:'center',
                      padding:'10px 14px',
                      background:sc.bg, border:`1px solid ${sc.border}`,
                      borderLeft:`3px solid ${sc.text}`,
                      borderRadius:'10px'
                    }}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{fontWeight:'900',fontSize:'0.82rem',color:'#fff'}}>{entry.customerName}</div>
                        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          <Users size={10} color="#444"/>
                          <span style={{fontSize:'0.6rem',color:'#444',fontWeight:'700'}}>{entry.partySize}p</span>
                        </div>
                        {entry.tablePreference && (
                          <span style={{fontSize:'0.58rem',padding:'2px 7px',background:'rgba(211,191,162,0.06)',border:'1px solid rgba(211,191,162,0.12)',borderRadius:'4px',color:'#8a704d',fontWeight:'800'}}>
                            T{entry.tablePreference}
                          </span>
                        )}
                        <span style={{fontSize:'0.52rem',color:sc.text,fontWeight:'900',letterSpacing:'0.5px'}}>
                          {entry.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{display:'flex',gap:'5px'}}>
                        {entry.status==='pending' && (
                          <button onClick={async()=>{
                            await axios.patch(`${BASE_URL}/reservations/${entry._id}`,{status:'confirmed'});
                            fetchCounterQueue();
                            showNotif(`${entry.customerName} confirmed`);
                          }} style={{padding:'4px 10px',background:'linear-gradient(135deg,#d3bfa2,#bda88a)',border:'none',color:'#000',borderRadius:'6px',fontSize:'0.58rem',fontWeight:'900',cursor:'pointer'}}>
                            CONFIRM
                          </button>
                        )}
                        {['pending','confirmed'].includes(entry.status) && (
                          <button onClick={()=>setAssignTableModal({...entry,_fromReservation:true})}
                            style={{padding:'4px 10px',background:'rgba(211,191,162,0.08)',border:'1px solid rgba(211,191,162,0.2)',color:'#d3bfa2',borderRadius:'6px',fontSize:'0.58rem',fontWeight:'900',cursor:'pointer'}}>
                            SEAT
                          </button>
                        )}
                        <button onClick={()=>setReservationEditModal(entry)}
                          style={{width:'26px',height:'26px',background:'transparent',border:'1px solid #1a1a1a',color:'#444',borderRadius:'6px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem'}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(211,191,162,0.25)';e.currentTarget.style.color='#d3bfa2';}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a1a';e.currentTarget.style.color='#444';}}>
                          ✎
                        </button>
                      </div>
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
    EXTRA ITEMS — Cold drinks, Ice creams, etc.
    ════════════════════════════════════════════ */}

{activeTab==='extras' && (
<motion.div key="extras" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}
  style={{display:'flex',flexDirection:'column',gap:'24px',paddingBottom:'100px',width:'100%'}}>
 
  {/* ── EDIT MODAL ── */}
  <AnimatePresence>
    {extraItemEditModal&&(
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
        onClick={e=>{if(e.target===e.currentTarget)setExtraItemEditModal(null);}}>
        <motion.div initial={{scale:0.96,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.96,opacity:0}}
          style={{background:'#0a0a0a',border:'1px solid rgba(211,191,162,0.12)',borderTop:'2px solid rgba(211,191,162,0.35)',borderRadius:'20px',padding:'28px',width:'100%',maxWidth:'540px',maxHeight:'88vh',overflowY:'auto'}}
          className="custom-scroll">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px'}}>
            <div>
              <h3 style={{margin:0,fontSize:'0.95rem',fontWeight:'900',color:'#d3bfa2'}}>EDIT ITEM</h3>
              <p style={{margin:'3px 0 0',fontSize:'0.62rem',color:'#444'}}>{extraItemEditModal.name}</p>
            </div>
            <button onClick={()=>setExtraItemEditModal(null)}
              style={{background:'transparent',border:'1px solid #1a1a1a',color:'#444',width:'30px',height:'30px',borderRadius:'7px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <X size={13}/>
            </button>
          </div>
 
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Item Name *</div>
              <input value={extraItemEditData.name||''} onChange={e=>setExtraItemEditData(p=>({...p,name:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',background:'#111',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Category</div>
              <select value={extraItemEditData.category||'Cold Drinks'} onChange={e=>setExtraItemEditData(p=>({...p,category:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',background:'#111',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',cursor:'pointer'}}>
                {['Cold Drinks','Ice Cream','Packaged Snacks','Juices','Mineral Water','Tobacco','Dairy','Sweets','Other'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
 
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Sell Price (₹) *</div>
              <input type="number" value={extraItemEditData.price??''} onChange={e=>setExtraItemEditData(p=>({...p,price:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',background:'#111',border:'1px solid #1a1a1a',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.9rem',fontWeight:'900',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Cost Price (₹)</div>
              <input type="number" value={extraItemEditData.costPrice??''} onChange={e=>setExtraItemEditData(p=>({...p,costPrice:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',background:'#111',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.9rem',outline:'none',boxSizing:'border-box'}}/>
              {extraItemEditData.price>0&&extraItemEditData.costPrice!==''&&(
                <div style={{fontSize:'0.58rem',color:'#4ade80',marginTop:'4px',fontWeight:'700'}}>
                  Margin: {Math.round(((Number(extraItemEditData.price)-Number(extraItemEditData.costPrice))/Number(extraItemEditData.price))*100)}%
                </div>
              )}
            </div>
          </div>
 
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Unit</div>
              <select value={extraItemEditData.unit||'piece'} onChange={e=>setExtraItemEditData(p=>({...p,unit:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',background:'#111',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',cursor:'pointer'}}>
                {['piece','bottle','can','pack','cup','cone','bar','pouch','litre','ml'].map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Current Stock</div>
              <input type="number" value={extraItemEditData.currentStock??''} onChange={e=>setExtraItemEditData(p=>({...p,currentStock:e.target.value}))}
                style={{width:'100%',padding:'10px 12px',background:'#111',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Alert At</div>
              <input type="number" value={extraItemEditData.lowStockThreshold??''} onChange={e=>setExtraItemEditData(p=>({...p,lowStockThreshold:e.target.value}))}
                placeholder="e.g. 5"
                style={{width:'100%',padding:'10px 12px',background:'#111',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}/>
            </div>
          </div>
 
          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',textTransform:'uppercase'}}>Description</div>
            <input value={extraItemEditData.description||''} onChange={e=>setExtraItemEditData(p=>({...p,description:e.target.value}))}
              placeholder="Optional short description"
              style={{width:'100%',padding:'10px 12px',background:'#111',border:'1px solid #1a1a1a',color:'#888',borderRadius:'8px',fontSize:'0.78rem',outline:'none',boxSizing:'border-box'}}/>
          </div>
 
          <div onClick={()=>setExtraItemEditData(p=>({...p,isAvailable:!p.isAvailable}))}
            style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:extraItemEditData.isAvailable?'rgba(74,222,128,0.04)':'#0d0d0d',border:`1px solid ${extraItemEditData.isAvailable?'rgba(74,222,128,0.18)':'#1a1a1a'}`,borderRadius:'10px',cursor:'pointer',marginBottom:'20px',transition:'all 0.15s'}}>
            <span style={{fontSize:'0.68rem',fontWeight:'800',color:extraItemEditData.isAvailable?'#4ade80':'#333'}}>
              {extraItemEditData.isAvailable?'Visible on menu':'Hidden from menu'}
            </span>
            <div style={{width:'36px',height:'19px',borderRadius:'10px',position:'relative',background:extraItemEditData.isAvailable?'#4ade80':'#1a1a1a',transition:'background 0.2s',flexShrink:0}}>
              <div style={{position:'absolute',top:'3px',left:extraItemEditData.isAvailable?'19px':'3px',width:'13px',height:'13px',borderRadius:'50%',background:extraItemEditData.isAvailable?'#000':'#444',transition:'left 0.2s'}}/>
            </div>
          </div>
 
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={async()=>{
              if(!extraItemEditData.name?.trim())return showNotif('Name is required','error');
              if(!extraItemEditData.price||Number(extraItemEditData.price)<=0)return showNotif('Valid price required','error');
              try {
                const payload={
                  name:extraItemEditData.name.trim(),category:extraItemEditData.category,
                  price:Number(extraItemEditData.price),
                  costPrice:extraItemEditData.costPrice===''?0:Number(extraItemEditData.costPrice),
                  unit:extraItemEditData.unit,currentStock:Number(extraItemEditData.currentStock)||0,
                  lowStockThreshold:extraItemEditData.lowStockThreshold===''?5:Number(extraItemEditData.lowStockThreshold),
                  description:extraItemEditData.description?.trim()||'',isAvailable:extraItemEditData.isAvailable,
                };
                const res=await axios.patch(`${BASE_URL}/extra-items/item/${extraItemEditModal._id}`,payload);
                setExtraItems(prev=>prev.map(i=>(i._id===res.data.item._id?res.data.item:i)));
                showNotif(`${payload.name} — updated`);setExtraItemEditModal(null);
              } catch(err){showNotif(err.response?.data?.error||'Update failed','error');}
            }} style={{flex:1,padding:'12px',background:'linear-gradient(135deg,#d3bfa2,#bda88a)',border:'none',color:'#000',borderRadius:'10px',fontSize:'0.72rem',fontWeight:'900',cursor:'pointer',letterSpacing:'0.5px'}}>
              SAVE CHANGES
            </button>
            <button onClick={()=>setExtraItemEditModal(null)}
              style={{padding:'12px 20px',background:'transparent',border:'1px solid #1a1a1a',color:'#444',borderRadius:'10px',fontSize:'0.72rem',fontWeight:'900',cursor:'pointer'}}>
              CANCEL
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
 
  {/* ── RESTOCK MODAL ── */}
  <AnimatePresence>
    {extraRestockModal&&(
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
        onClick={e=>{if(e.target===e.currentTarget){setExtraRestockModal(null);setExtraRestockQty('');}}}>
        <motion.div initial={{scale:0.96,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.96,opacity:0}}
          style={{background:'#0a0a0a',border:'1px solid rgba(211,191,162,0.12)',borderTop:'2px solid rgba(211,191,162,0.3)',borderRadius:'16px',padding:'26px',width:'100%',maxWidth:'340px'}}>
          <div style={{marginBottom:'20px'}}>
            <h3 style={{margin:'0 0 4px',fontSize:'0.9rem',fontWeight:'900',color:'#d3bfa2'}}>RESTOCK</h3>
            <p style={{margin:0,fontSize:'0.62rem',color:'#444',fontWeight:'600'}}>{extraRestockModal.name} · current: {extraRestockModal.currentStock} {extraRestockModal.unit}s</p>
          </div>
          <div style={{marginBottom:'18px'}}>
            <div style={{fontSize:'0.5rem',color:'#444',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'8px',textTransform:'uppercase'}}>Quantity to Add</div>
            <input type="number" min="1" autoFocus
              value={extraRestockQty} onChange={e=>setExtraRestockQty(e.target.value)}
              onKeyDown={async e=>{
                if(e.key==='Enter'&&extraRestockQty&&Number(extraRestockQty)>0){
                  await axios.patch(`${BASE_URL}/extra-items/item/${extraRestockModal._id}/restock`,{addQty:Number(extraRestockQty)});
                  showNotif(`${extraRestockModal.name} restocked +${extraRestockQty}`);
                  setExtraRestockModal(null);setExtraRestockQty('');fetchExtraItems();
                }
              }}
              placeholder="e.g. 24"
              style={{width:'100%',padding:'14px',background:'#111',border:'1px solid rgba(211,191,162,0.18)',color:'#d3bfa2',borderRadius:'8px',fontSize:'1.2rem',fontWeight:'900',outline:'none',boxSizing:'border-box',textAlign:'center'}}/>
            {extraRestockQty&&Number(extraRestockQty)>0&&(
              <div style={{fontSize:'0.62rem',color:'#555',marginTop:'7px',textAlign:'center'}}>
                New total: <span style={{color:'#d3bfa2',fontWeight:'800'}}>{extraRestockModal.currentStock+Number(extraRestockQty)} {extraRestockModal.unit}s</span>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={async()=>{
              if(!extraRestockQty||Number(extraRestockQty)<=0)return showNotif('Enter a valid quantity','error');
              try {
                await axios.patch(`${BASE_URL}/extra-items/item/${extraRestockModal._id}/restock`,{addQty:Number(extraRestockQty)});
                showNotif(`${extraRestockModal.name} restocked +${extraRestockQty}`);
                setExtraRestockModal(null);setExtraRestockQty('');fetchExtraItems();
              } catch{showNotif('Restock failed','error');}
            }} style={{flex:1,padding:'11px',background:'linear-gradient(135deg,#d3bfa2,#bda88a)',border:'none',color:'#000',borderRadius:'8px',fontSize:'0.72rem',fontWeight:'900',cursor:'pointer',letterSpacing:'0.5px'}}>
              + ADD STOCK
            </button>
            <button onClick={()=>{setExtraRestockModal(null);setExtraRestockQty('');}}
              style={{padding:'11px 16px',background:'transparent',border:'1px solid #1a1a1a',color:'#444',borderRadius:'8px',fontSize:'0.72rem',fontWeight:'900',cursor:'pointer'}}>
              CANCEL
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
 
  {/* ── KPI ROW ── */}
  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px'}}>
    {[
      {l:'Total Items',v:extraItems.length,c:'#d3bfa2',icon:<Package size={14}/>},
      {l:'Available',v:extraItems.filter(i=>i.isAvailable).length,c:'#4ade80',icon:<CheckCircle2 size={14}/>},
      {l:'Hidden',v:extraItems.filter(i=>!i.isAvailable).length,c:'#555',icon:<EyeOff size={14}/>},
      {l:'Low Stock',v:extraItems.filter(i=>i.currentStock<=(i.lowStockThreshold||5)&&i.currentStock>0).length,c:'#BA7517',icon:<AlertTriangle size={14}/>},
      {l:'Stock Value',v:`₹${extraItems.reduce((a,i)=>a+Math.round(i.currentStock*i.price),0).toLocaleString()}`,c:'#d3bfa2',icon:<WalletCards size={14}/>},
    ].map((s,i)=>(
      <div key={i} style={{
        background:'#080808',border:'1px solid #161616',
        borderTop:`2px solid ${s.c}22`,
        borderRadius:'13px',padding:'16px 18px',
        display:'flex',alignItems:'center',gap:'12px'
      }}>
        <div style={{
          width:'30px',height:'30px',borderRadius:'8px',flexShrink:0,
          background:`${s.c}0d`,border:`1px solid ${s.c}1a`,
          display:'flex',alignItems:'center',justifyContent:'center',color:s.c
        }}>{s.icon}</div>
        <div>
          <div style={{fontSize:typeof s.v==='string'&&s.v.length>6?'1rem':'1.3rem',fontWeight:'900',color:s.c,fontFamily:'monospace',lineHeight:1}}>{s.v}</div>
          <div style={{fontSize:'0.5rem',color:'#333',fontWeight:'900',letterSpacing:'1px',marginTop:'4px'}}>{s.l.toUpperCase()}</div>
        </div>
      </div>
    ))}
  </div>
 
  {/* ── ADD ITEM FORM ── */}
  <div style={{
    background:'#080808',border:'1px solid #161616',
    borderRadius:'16px',overflow:'hidden'
  }}>
    <div style={{
      display:'flex',alignItems:'center',gap:'12px',
      padding:'16px 22px',borderBottom:'1px solid #111',background:'#060606'
    }}>
      <Package2 size={14} color="#d3bfa2"/>
      <div>
        <div style={{fontSize:'0.6rem',color:'#d3bfa2',fontWeight:'900',letterSpacing:'2px'}}>REGISTER NEW ITEM</div>
        <div style={{fontSize:'0.56rem',color:'#333',marginTop:'1px'}}>Add beverage, snack or any retail item to your catalog</div>
      </div>
    </div>
    <div style={{padding:'20px 22px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'12px',marginBottom:'12px'}}>
        <div>
          <label style={{fontSize:'0.5rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',display:'block',textTransform:'uppercase'}}>Item Name *</label>
          <input type="text" placeholder="e.g. Thums Up 750ml"
            style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}
            value={newExtraItem.name} onChange={e=>setNewExtraItem({...newExtraItem,name:e.target.value})}/>
        </div>
        <div>
          <label style={{fontSize:'0.5rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',display:'block',textTransform:'uppercase'}}>Category</label>
          <select style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',cursor:'pointer'}}
            value={newExtraItem.category} onChange={e=>setNewExtraItem({...newExtraItem,category:e.target.value})}>
            {['Cold Drinks','Ice Cream','Packaged Snacks','Juices','Mineral Water','Tobacco','Dairy','Sweets','Other'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:'0.5rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',display:'block',textTransform:'uppercase'}}>Sell Price (₹) *</label>
          <input type="number" placeholder="e.g. 40"
            style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#d3bfa2',borderRadius:'8px',fontSize:'0.8rem',fontWeight:'900',outline:'none',boxSizing:'border-box'}}
            value={newExtraItem.price} onChange={e=>setNewExtraItem({...newExtraItem,price:e.target.value})}/>
        </div>
        <div>
          <label style={{fontSize:'0.5rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',display:'block',textTransform:'uppercase'}}>Cost Price (₹)</label>
          <input type="number" placeholder="e.g. 28"
            style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}
            value={newExtraItem.costPrice} onChange={e=>setNewExtraItem({...newExtraItem,costPrice:e.target.value})}/>
          {newExtraItem.price&&newExtraItem.costPrice&&Number(newExtraItem.price)>0&&(
            <div style={{fontSize:'0.56rem',color:'#4ade80',marginTop:'4px',fontWeight:'700'}}>
              Margin: {Math.round(((newExtraItem.price-newExtraItem.costPrice)/newExtraItem.price)*100)}%
            </div>
          )}
        </div>
        <div>
          <label style={{fontSize:'0.5rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',display:'block',textTransform:'uppercase'}}>Unit</label>
          <select style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',cursor:'pointer'}}
            value={newExtraItem.unit} onChange={e=>setNewExtraItem({...newExtraItem,unit:e.target.value})}>
            {['piece','bottle','can','pack','cup','cone','bar','pouch','litre','ml'].map(u=><option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:'0.5rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',display:'block',textTransform:'uppercase'}}>Opening Stock</label>
          <input type="number" placeholder="e.g. 24"
            style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}
            value={newExtraItem.currentStock} onChange={e=>setNewExtraItem({...newExtraItem,currentStock:e.target.value})}/>
        </div>
      </div>
      <div style={{display:'flex',gap:'12px',alignItems:'flex-end'}}>
        <div style={{flex:1}}>
          <label style={{fontSize:'0.5rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',marginBottom:'6px',display:'block',textTransform:'uppercase'}}>Description (optional)</label>
          <input type="text" placeholder="e.g. Chilled carbonated drink, served in bottle"
            style={{width:'100%',padding:'10px 12px',background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.78rem',outline:'none',boxSizing:'border-box'}}
            value={newExtraItem.description} onChange={e=>setNewExtraItem({...newExtraItem,description:e.target.value})}/>
        </div>
        <button onClick={async()=>{
          if(!newExtraItem.name?.trim())return showNotif('Item name is required','error');
          if(!newExtraItem.price||Number(newExtraItem.price)<=0)return showNotif('Valid price is required','error');
          try {
            await axios.post(`${BASE_URL}/extra-items/${tenantId}`,{
              name:newExtraItem.name.trim(),category:newExtraItem.category,
              price:Number(newExtraItem.price),costPrice:Number(newExtraItem.costPrice)||0,
              unit:newExtraItem.unit,currentStock:Number(newExtraItem.currentStock)||0,
              description:newExtraItem.description.trim(),isAvailable:true
            });
            setNewExtraItem({name:'',category:'Cold Drinks',price:'',costPrice:'',unit:'piece',currentStock:'',description:'',isAvailable:true,image:''});
            showNotif(`${newExtraItem.name} added to catalog`);fetchExtraItems();
          } catch(err){showNotif(err.response?.data?.error||'Failed to add item','error');}
        }} style={{
          padding:'10px 24px',
          background:'linear-gradient(135deg,#d3bfa2,#bda88a)',
          color:'#000',border:'none',borderRadius:'8px',
          fontWeight:'900',fontSize:'0.72rem',cursor:'pointer',
          whiteSpace:'nowrap',letterSpacing:'0.5px',flexShrink:0
        }}>+ REGISTER ITEM</button>
      </div>
    </div>
  </div>
 
  {/* ── FILTER BAR ── */}
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
    <div style={{display:'flex',gap:'7px',flexWrap:'wrap',flex:1}}>
      {['All',...new Set(extraItems.map(i=>i.category))].map(cat=>(
        <button key={cat} onClick={()=>setActiveExtraCategory(cat)} style={{
          padding:'7px 16px',borderRadius:'20px',fontSize:'0.62rem',fontWeight:'900',cursor:'pointer',
          border:activeExtraCategory===cat?'none':'1px solid #1a1a1a',
          background:activeExtraCategory===cat?'linear-gradient(135deg,#d3bfa2,#bda88a)':'#0d0d0d',
          color:activeExtraCategory===cat?'#000':'#444',transition:'all 0.15s',
          whiteSpace:'nowrap'
        }}>
          {cat} {cat!=='All'&&<span style={{opacity:0.7}}>({extraItems.filter(i=>i.category===cat).length})</span>}
        </button>
      ))}
    </div>
    <div style={{display:'flex',gap:'8px',alignItems:'center',flexShrink:0}}>
      {/* Low stock filter */}
      <button onClick={()=>setActiveExtraCategory(activeExtraCategory==='__lowstock__'?'All':'__lowstock__')}
        style={{
          display:'flex',alignItems:'center',gap:'6px',
          padding:'7px 14px',borderRadius:'20px',fontSize:'0.62rem',fontWeight:'900',cursor:'pointer',
          border:activeExtraCategory==='__lowstock__'?'none':'1px solid rgba(186,117,23,0.2)',
          background:activeExtraCategory==='__lowstock__'?'linear-gradient(135deg,#8a5c0a,#BA7517)':'rgba(186,117,23,0.05)',
          color:activeExtraCategory==='__lowstock__'?'#000':'#BA7517',transition:'all 0.15s'
        }}>
        <AlertTriangle size={10}/>
        LOW STOCK ({extraItems.filter(i=>i.currentStock<=(i.lowStockThreshold||5)&&i.currentStock>0).length})
      </button>
      {/* Search */}
      <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#0a0a0a',border:'1px solid #141414',borderRadius:'8px',padding:'8px 13px'}}>
        <Search size={12} color="#333"/>
        <input type="text" placeholder="Search items..." value={extraItemSearchQuery}
          onChange={e=>setExtraItemSearchQuery(e.target.value)}
          style={{background:'transparent',border:'none',color:'#fff',outline:'none',fontSize:'0.72rem',width:'150px'}}/>
        {extraItemSearchQuery&&<button onClick={()=>setExtraItemSearchQuery('')} style={{background:'transparent',border:'none',color:'#333',cursor:'pointer',padding:0,display:'flex'}}><X size={11}/></button>}
      </div>
    </div>
  </div>
 
  {/* ── ITEMS GRID ── */}
  {extraItemsLoading?(
    <div style={{textAlign:'center',padding:'60px',color:'#222',fontSize:'0.78rem',fontWeight:'700'}}>LOADING CATALOG...</div>
  ):(()=>{
    const filtered=extraItems.filter(i=>{
      if(activeExtraCategory==='__lowstock__') return i.currentStock<=(i.lowStockThreshold||5)&&i.currentStock>0;
      const matchCat=activeExtraCategory==='All'||i.category===activeExtraCategory;
      const matchSearch=i.name.toLowerCase().includes(extraItemSearchQuery.toLowerCase());
      return matchCat&&matchSearch;
    });
 
    if(filtered.length===0) return (
      <div style={{textAlign:'center',padding:'60px',background:'#080808',borderRadius:'16px',border:'1px dashed #141414'}}>
        <Package2 size={28} color="#1a1a1a" style={{marginBottom:'12px'}}/>
        <div style={{color:'#222',fontSize:'0.8rem',fontWeight:'700'}}>
          {extraItemSearchQuery?`No items matching "${extraItemSearchQuery}"`:'No items in this category'}
        </div>
      </div>
    );
 
    // Group by category if "All"
    const groups=activeExtraCategory==='All'||activeExtraCategory==='__lowstock__'
      ? [...new Set(filtered.map(i=>i.category))].map(cat=>({cat,items:filtered.filter(i=>i.category===cat)}))
      : [{cat:activeExtraCategory,items:filtered}];
 
    return groups.map(({cat,items})=>(
      <div key={cat} style={{marginBottom:'8px'}}>
        {/* Category header */}
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'9px 14px',marginBottom:'12px',
          background:'#060606',borderRadius:'10px',border:'1px solid #111'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{width:'3px',height:'14px',background:'#d3bfa2',borderRadius:'2px'}}/>
            <span style={{fontSize:'0.6rem',fontWeight:'900',color:'#8a704d',letterSpacing:'1.5px',textTransform:'uppercase'}}>{cat}</span>
            <span style={{fontSize:'0.52rem',color:'#333',fontWeight:'700'}}>{items.length} items</span>
          </div>
          <div style={{display:'flex',gap:'6px'}}>
            <span style={{fontSize:'0.52rem',color:'#4ade80',fontWeight:'700',padding:'2px 8px',background:'rgba(74,222,128,0.06)',border:'1px solid rgba(74,222,128,0.12)',borderRadius:'6px'}}>
              {items.filter(i=>i.isAvailable).length} available
            </span>
            {items.filter(i=>i.currentStock<=(i.lowStockThreshold||5)&&i.currentStock>0).length>0&&(
              <span style={{fontSize:'0.52rem',color:'#BA7517',fontWeight:'700',padding:'2px 8px',background:'rgba(186,117,23,0.06)',border:'1px solid rgba(186,117,23,0.15)',borderRadius:'6px'}}>
                {items.filter(i=>i.currentStock<=(i.lowStockThreshold||5)&&i.currentStock>0).length} low
              </span>
            )}
          </div>
        </div>
 
        {/* Items grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'14px'}}>
          {items.map(item=>{
            const isLow=item.currentStock<=(item.lowStockThreshold||5)&&item.currentStock>0;
            const isOut=item.currentStock<=0;
            const margin=item.costPrice>0?Math.round(((item.price-item.costPrice)/item.price)*100):null;
            return (
              <div key={item._id} style={{
                background:'#080808',
                border:`1px solid ${isOut?'rgba(192,57,43,0.2)':isLow?'rgba(186,117,23,0.2)':'#141414'}`,
                borderTop:`2px solid ${isOut?'rgba(192,57,43,0.4)':isLow?'rgba(186,117,23,0.35)':item.isAvailable?'rgba(211,191,162,0.12)':'#111'}`,
                borderRadius:'14px',padding:'18px',
                opacity:item.isAvailable?1:0.55,
                position:'relative',
                transition:'all 0.2s'
              }}>
                {/* Status dot */}
                <div style={{
                  position:'absolute',top:'14px',right:'14px',
                  width:'7px',height:'7px',borderRadius:'50%',
                  background:item.isAvailable?'#d3bfa2':'#222',
                  boxShadow:item.isAvailable?'0 0 6px rgba(211,191,162,0.4)':'none'
                }}/>
 
                {/* Stock warning badges */}
                {(isOut||isLow)&&(
                  <div style={{
                    position:'absolute',top:'10px',left:'10px',
                    display:'flex',alignItems:'center',gap:'4px',
                    padding:'2px 8px',borderRadius:'4px',
                    background:isOut?'rgba(192,57,43,0.12)':'rgba(186,117,23,0.1)',
                    border:`1px solid ${isOut?'rgba(192,57,43,0.3)':'rgba(186,117,23,0.25)'}`,
                    fontSize:'0.48rem',fontWeight:'900',
                    color:isOut?'#e74c3c':'#BA7517'
                  }}>
                    <AlertTriangle size={8}/>{isOut?'OUT OF STOCK':'LOW STOCK'}
                  </div>
                )}
 
                {/* Name + category */}
                <div style={{paddingTop:isOut||isLow?'18px':'0',marginBottom:'10px'}}>
                  <div style={{fontSize:'0.9rem',fontWeight:'900',color:'#fff',marginBottom:'2px',paddingRight:'20px'}}>{item.name}</div>
                  <div style={{fontSize:'0.58rem',color:'#444',fontWeight:'600'}}>{item.category}</div>
                  {item.description&&(
                    <div style={{fontSize:'0.6rem',color:'#333',marginTop:'4px',lineHeight:1.4}}>{item.description}</div>
                  )}
                </div>
 
                {/* Price + margin */}
                <div style={{display:'flex',gap:'7px',alignItems:'center',marginBottom:'12px',flexWrap:'wrap'}}>
                  <span style={{
                    fontSize:'0.78rem',fontWeight:'900',color:'#d3bfa2',
                    padding:'4px 10px',background:'rgba(211,191,162,0.06)',
                    border:'1px solid rgba(211,191,162,0.12)',borderRadius:'6px',fontFamily:'monospace'
                  }}>₹{item.price}</span>
                  {item.costPrice>0&&(
                    <span style={{fontSize:'0.6rem',color:'#555',fontFamily:'monospace'}}>cost ₹{item.costPrice}</span>
                  )}
                  {margin!==null&&(
                    <span style={{
                      fontSize:'0.58rem',fontWeight:'900',
                      color:margin>=40?'#4ade80':margin>=20?'#8a704d':'#e74c3c',
                      padding:'2px 7px',borderRadius:'4px',
                      background:margin>=40?'rgba(74,222,128,0.06)':margin>=20?'rgba(138,112,77,0.06)':'rgba(231,76,60,0.06)',
                      border:`1px solid ${margin>=40?'rgba(74,222,128,0.14)':margin>=20?'rgba(138,112,77,0.14)':'rgba(231,76,60,0.14)'}`
                    }}>{margin}% margin</span>
                  )}
                </div>
 
                {/* Stock gauge */}
                <div style={{marginBottom:'14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                    <span style={{fontSize:'0.55rem',color:'#333',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'}}>Stock</span>
                    <span style={{fontSize:'0.7rem',fontWeight:'900',color:isOut?'#e74c3c':isLow?'#BA7517':'#d3bfa2',fontFamily:'monospace'}}>
                      {item.currentStock} <span style={{fontSize:'0.55rem',color:'#444'}}>{item.unit}s</span>
                    </span>
                  </div>
                  <div style={{height:'4px',background:'#111',borderRadius:'4px',overflow:'hidden'}}>
                    <div style={{
                      height:'100%',borderRadius:'4px',transition:'width 0.3s',
                      width:`${Math.min(100,Math.max(0,(item.currentStock/(item.lowStockThreshold||5)*100)))}%`,
                      background:isOut?'#e74c3c':isLow?'linear-gradient(90deg,#8a5c0a,#BA7517)':'linear-gradient(90deg,#8a704d,#d3bfa2)'
                    }}/>
                  </div>
                  {item.lowStockThreshold>0&&(
                    <div style={{fontSize:'0.52rem',color:'#2a2a2a',marginTop:'3px',textAlign:'right'}}>alert at {item.lowStockThreshold}</div>
                  )}
                </div>
 
                {/* Actions */}
                <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                  {/* Restock */}
                  <button onClick={()=>{setExtraRestockModal(item);setExtraRestockQty('');}}
                    style={{
                      width:'100%',padding:'9px',borderRadius:'8px',cursor:'pointer',
                      background:isOut?'rgba(211,191,162,0.08)':'rgba(211,191,162,0.04)',
                      border:isOut?'1px solid rgba(211,191,162,0.25)':'1px solid rgba(211,191,162,0.12)',
                      color:isOut?'#d3bfa2':'#8a704d',fontSize:'0.65rem',fontWeight:'900',
                      display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',
                      transition:'all 0.15s',letterSpacing:'0.5px'
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(211,191,162,0.1)';e.currentTarget.style.borderColor='rgba(211,191,162,0.3)';e.currentTarget.style.color='#d3bfa2';}}
                    onMouseLeave={e=>{e.currentTarget.style.background=isOut?'rgba(211,191,162,0.08)':'rgba(211,191,162,0.04)';e.currentTarget.style.borderColor=isOut?'rgba(211,191,162,0.25)':'rgba(211,191,162,0.12)';e.currentTarget.style.color=isOut?'#d3bfa2':'#8a704d';}}>
                    <Package size={11}/>+ ADD STOCK
                  </button>
 
                  {/* Hide/Show + Edit + Delete */}
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={async()=>{
                      await axios.patch(`${BASE_URL}/extra-items/item/${item._id}`,{isAvailable:!item.isAvailable});
                      fetchExtraItems();
                      showNotif(`${item.name} ${!item.isAvailable?'shown on menu':'hidden'}`);
                    }} style={{
                      flex:1,padding:'8px 6px',
                      background:item.isAvailable?'#0d0d0d':'rgba(74,222,128,0.05)',
                      border:item.isAvailable?'1px solid #1a1a1a':'1px solid rgba(74,222,128,0.18)',
                      color:item.isAvailable?'#444':'#4ade80',
                      borderRadius:'7px',fontSize:'0.6rem',fontWeight:'900',cursor:'pointer',transition:'all 0.15s'
                    }}>
                      {item.isAvailable?'HIDE':'SHOW'}
                    </button>
                    <button onClick={()=>{setExtraItemEditModal(item);setExtraItemEditData({...item});}}
                      style={{width:'34px',height:'34px',background:'transparent',border:'1px solid #1a1a1a',color:'#333',borderRadius:'7px',fontSize:'0.7rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(211,191,162,0.25)';e.currentTarget.style.color='#d3bfa2';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a1a';e.currentTarget.style.color='#333';}}>✎</button>
                    <button onClick={()=>setConfirmModal({
                      show:true,title:`Remove "${item.name}"?`,
                      subtitle:'This permanently removes the item from your catalog.',
                      onConfirm:async()=>{await axios.delete(`${BASE_URL}/extra-items/item/${item._id}`);fetchExtraItems();showNotif(`${item.name} removed`);}
                    })} style={{width:'34px',height:'34px',background:'transparent',border:'1px solid #1a1a1a',color:'#2a2a2a',borderRadius:'7px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(192,57,43,0.25)';e.currentTarget.style.color='#c0392b';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a1a';e.currentTarget.style.color='#2a2a2a';}}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  })()}
 
</motion.div>
)}
 

        </section>{/* end scrollArea */}
      </main>

      {/* ════════════════════════════════════════════
          MODALS — rendered at root level, always correct position
          ════════════════════════════════════════════ */}

{/* ── RESERVATION EDIT MODAL ── */}
<AnimatePresence>
  {reservationEditModal && (
    <div style={styles.modalBackdrop} className="p-modal-backdrop">
      <motion.div
        initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
        style={{...styles.confirmBox, width:'480px', textAlign:'left', padding:'36px 28px', maxHeight:'85vh', overflowY:'auto'}}
        className="p-modal-box custom-scroll">

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
          <div>
            <div style={{fontSize:'0.58rem',color:'#444',fontWeight:'900',letterSpacing:'2px',marginBottom:'6px'}}>RESERVATION</div>
            <h3 style={{color:'#fff',margin:0,fontSize:'1rem',fontWeight:'900'}}>{reservationEditModal.customerName}</h3>
          </div>
          <button onClick={() => setReservationEditModal(null)}
            style={{background:'#111',border:'1px solid #1a1a1a',color:'#555',padding:'8px',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center'}}>
            <X size={16} />
          </button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {/* Status */}
          <div>
            <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>Status</label>
            <select
              defaultValue={reservationEditModal.status}
              onChange={e => setReservationEditModal(prev => ({...prev, status: e.target.value}))}
              style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid rgba(211,191,162,0.2)',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',cursor:'pointer'}}>
              {['pending','confirmed','seated','cancelled','no-show'].map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Table preference */}
          <div>
            <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>Table Assignment</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
              {Array.from({length:tableCount},(_,i)=>(i+1).toString()).map(t => {
                const isOcc = occupiedTables.includes(t);
                const isSel = reservationEditModal.tablePreference?.toString() === t;
                return (
                  <button key={t} type="button" onClick={() => !isOcc && setReservationEditModal(prev => ({...prev, tablePreference:t}))}
                    style={{
                      padding:'8px 14px',borderRadius:'8px',
                      border:'none',fontSize:'0.7rem',fontWeight:'800',cursor:isOcc?'not-allowed':'pointer',
                      background: isSel ? 'linear-gradient(135deg,#d3bfa2,#bda88a)' : isOcc ? '#0d0d0d' : '#111',
                      color: isSel ? '#000' : isOcc ? '#222' : '#555',
                      opacity: isOcc ? 0.4 : 1
                    }}>
                    T{t}{isOcc ? ' •' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special requests */}
          <div>
            <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>Special Requests</label>
            <input type="text"
              defaultValue={reservationEditModal.specialRequests || ''}
              onChange={e => setReservationEditModal(prev => ({...prev, specialRequests: e.target.value}))}
              style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.78rem',outline:'none',boxSizing:'border-box'}} />
          </div>

          <div style={{display:'flex',gap:'12px',paddingTop:'16px',borderTop:'1px solid #111'}}>
            <button onClick={() => setReservationEditModal(null)} style={styles.cancelBtn}>CANCEL</button>
            <button onClick={async () => {
              await axios.patch(`${BASE_URL}/reservations/${reservationEditModal._id}`, {
                status: reservationEditModal.status,
                tablePreference: reservationEditModal.tablePreference,
                specialRequests: reservationEditModal.specialRequests
              });
              fetchCounterQueue();
              showNotif(`Reservation updated for ${reservationEditModal.customerName}`);
              setReservationEditModal(null);
            }} style={{...styles.confirmBtn, flex:2}}>SAVE CHANGES</button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* EXTRA ITEM EDIT MODAL */}
<AnimatePresence>
  {extraItemEditModal && (
    <div style={styles.modalBackdrop}>
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
        style={{ ...styles.confirmBox, width: '520px', textAlign: 'left', maxHeight: '85vh', overflowY: 'auto', padding: '40px' }}
        className="custom-scroll"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '6px' }}>EXTRA ITEMS CATALOG</div>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>EDIT ITEM</h3>
            <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '4px' }}>{extraItemEditModal.name}</div>
          </div>
          <button onClick={() => setExtraItemEditModal(null)}
            style={{ background: '#111', border: '1px solid #1a1a1a', color: '#555', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: '0.55rem', color: '#d3bfa2', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '7px', textTransform: 'uppercase' }}>Item Name *</label>
            <input type="text" value={extraItemEditData.name || ''}
              onChange={e => setExtraItemEditData({ ...extraItemEditData, name: e.target.value })}
              style={{ width: '100%', padding: '11px 13px', background: '#000', border: '1px solid rgba(211,191,162,0.2)', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Category + Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '7px', textTransform: 'uppercase' }}>Category</label>
              <select value={extraItemEditData.category || 'Cold Drinks'}
                onChange={e => setExtraItemEditData({ ...extraItemEditData, category: e.target.value })}
                style={{ width: '100%', padding: '11px 13px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}>
                {['Cold Drinks', 'Ice Cream', 'Packaged Snacks', 'Juices', 'Mineral Water', 'Tobacco', 'Dairy', 'Sweets', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '7px', textTransform: 'uppercase' }}>Unit</label>
              <select value={extraItemEditData.unit || 'piece'}
                onChange={e => setExtraItemEditData({ ...extraItemEditData, unit: e.target.value })}
                style={{ width: '100%', padding: '11px 13px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}>
                {['piece', 'bottle', 'can', 'pack', 'cup', 'cone', 'bar', 'pouch', 'litre', 'ml'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price + Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '7px', textTransform: 'uppercase' }}>Price (₹) *</label>
              <input type="number" value={extraItemEditData.price || ''}
                onChange={e => setExtraItemEditData({ ...extraItemEditData, price: e.target.value })}
                style={{ width: '100%', padding: '11px 13px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            
            {/* Add after Price field in edit modal */}
<div>
  <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '7px', textTransform: 'uppercase' }}>Cost Price (₹)</label>
  <input type="number" value={extraItemEditData.costPrice ?? ''}
    onChange={e => setExtraItemEditData({ ...extraItemEditData, costPrice: e.target.value })}
    style={{ width: '100%', padding: '11px 13px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
  {extraItemEditData.price && extraItemEditData.costPrice && (
    <div style={{ fontSize: '0.58rem', color: '#4ade80', marginTop: '4px' }}>
      Margin: {Math.round(((extraItemEditData.price - extraItemEditData.costPrice) / extraItemEditData.price) * 100)}%
    </div>
  )}
</div>

            <div>
              <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '7px', textTransform: 'uppercase' }}>Current Stock</label>
              <input type="number" value={extraItemEditData.currentStock ?? ''}
                onChange={e => setExtraItemEditData({ ...extraItemEditData, currentStock: e.target.value })}
                style={{ width: '100%', padding: '11px 13px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.55rem', color: '#555', fontWeight: '900', letterSpacing: '0.8px', display: 'block', marginBottom: '7px', textTransform: 'uppercase' }}>Description</label>
            <input type="text" value={extraItemEditData.description || ''}
              onChange={e => setExtraItemEditData({ ...extraItemEditData, description: e.target.value })}
              style={{ width: '100%', padding: '11px 13px', background: '#000', border: '1px solid #1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Availability toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '10px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff' }}>ITEM AVAILABILITY</div>
              <div style={{ fontSize: '0.6rem', color: '#444', marginTop: '3px' }}>Toggle to show or hide from active catalog</div>
            </div>
            <button type="button" onClick={() => setExtraItemEditData({ ...extraItemEditData, isAvailable: !extraItemEditData.isAvailable })}
              style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: extraItemEditData.isAvailable ? '#d3bfa2' : '#1a1a1a', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '4px', left: extraItemEditData.isAvailable ? '22px' : '4px', width: '16px', height: '16px', borderRadius: '50%', background: extraItemEditData.isAvailable ? '#000' : '#444', transition: 'left 0.2s' }} />
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid #111' }}>
            <button onClick={() => setExtraItemEditModal(null)} style={styles.cancelBtn}>CANCEL</button>
            <button
              onClick={async () => {
                if (!extraItemEditData.name?.trim()) return showNotif('Item name required', 'error');
                if (!extraItemEditData.price || Number(extraItemEditData.price) <= 0) return showNotif('Valid price required', 'error');
                try {
                  await axios.patch(`${BASE_URL}/extra-items/item/${extraItemEditModal._id}`, {
                    name: extraItemEditData.name.trim(),
                    category: extraItemEditData.category,
                    price: Number(extraItemEditData.price),
                    unit: extraItemEditData.unit,
                    currentStock: Number(extraItemEditData.currentStock) || 0,
                    description: extraItemEditData.description || '',
                    isAvailable: extraItemEditData.isAvailable
                  });
                  showNotif(`${extraItemEditData.name} updated`);
                  setExtraItemEditModal(null);
                  fetchExtraItems();
                } catch { showNotif('Update failed', 'error'); }
              }}
              style={{ ...styles.confirmBtn, flex: 2 }}>
              SAVE CHANGES
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
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
        {/* ADD DISH MODAL */}
<AnimatePresence>
  {showAddDishModal && (
    <div style={styles.modalBackdrop}>
      <motion.div
        initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
        style={{
          ...styles.confirmBox,
          width:'560px',textAlign:'left',
          maxHeight:'85vh',overflowY:'auto',
          padding:'40px'
        }}
        className="custom-scroll"
      >
        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'28px'}}>
          <div>
            <div style={{fontSize:'0.58rem',color:'#444',fontWeight:'900',letterSpacing:'2px',marginBottom:'6px'}}>MENU REGISTRY</div>
            <h3 style={{color:'#fff',margin:0,fontSize:'1.15rem',fontWeight:'900'}}>ADD NEW DISH</h3>
          </div>
          <button onClick={()=>{setShowAddDishModal(false);setNewDish({name:'',name_mr:'',categoryId:'',price:'',priceHalf:'',priceFull:'',isVeg:false,isChefSpecial:false,isAvailable:true,ingredients:{en:'',mr:''},spicylevel:'',tags:''});}}
            style={{background:'#111',border:'1px solid #1a1a1a',color:'#555',padding:'8px',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center'}}>
            <X size={16}/>
          </button>
        </div>

        {/* FORM GRID */}
        <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

          {/* NAME ROW */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
            <div>
              <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>DISH NAME (English) *</label>
              <input type="text" placeholder="e.g. Paneer Tikka"
                style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}
                value={newDish.name} onChange={e=>setNewDish({...newDish,name:e.target.value})}/>
            </div>
            <div>
              <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>DISH NAME (Marathi)</label>
              <input type="text" placeholder="e.g. पनीर टिक्का"
                style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}
                value={newDish.name_mr} onChange={e=>setNewDish({...newDish,name_mr:e.target.value})}/>
            </div>
          </div>

          {/* CATEGORY */}
          <div>
            <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>CATEGORY *</label>
            <select
              style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:newDish.categoryId?'#fff':'#444',borderRadius:'8px',fontSize:'0.82rem',outline:'none',cursor:'pointer'}}
              value={newDish.categoryId} onChange={e=>setNewDish({...newDish,categoryId:e.target.value})}>
              <option value="">-- Select category --</option>
              {categories.map(c=><option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
            </select>
          </div>

          {/* PRICING MODE TOGGLE */}
          <div>
            <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'10px',textTransform:'uppercase'}}>PRICING MODE</label>
            <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
              {['single','half-full'].map(mode=>(
                <button key={mode} type="button"
                  onClick={()=>setNewDish({...newDish,_priceMode:mode,price:'',priceHalf:'',priceFull:''})}
                  style={{
                    padding:'8px 18px',borderRadius:'8px',fontSize:'0.65rem',fontWeight:'900',cursor:'pointer',
                    background: (newDish._priceMode||'single')===mode ? 'rgba(211,191,162,0.1)' : 'transparent',
                    border: (newDish._priceMode||'single')===mode ? '1px solid rgba(211,191,162,0.3)' : '1px solid #222',
                    color: (newDish._priceMode||'single')===mode ? '#d3bfa2' : '#444',
                    transition:'all 0.15s'
                  }}>
                  {mode === 'single' ? 'SINGLE PRICE' : 'HALF / FULL'}
                </button>
              ))}
            </div>

            {(newDish._priceMode||'single') === 'single' ? (
              <div>
                <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>PRICE (₹) *</label>
                <input type="number" placeholder="e.g. 180"
                  style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}
                  value={newDish.price} onChange={e=>setNewDish({...newDish,price:e.target.value})}/>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                <div>
                  <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>HALF PRICE (₹) *</label>
                  <input type="number" placeholder="e.g. 120"
                    style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}
                    value={newDish.priceHalf} onChange={e=>setNewDish({...newDish,priceHalf:e.target.value})}/>
                </div>
                <div>
                  <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>FULL PRICE (₹) *</label>
                  <input type="number" placeholder="e.g. 220"
                    style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}
                    value={newDish.priceFull} onChange={e=>setNewDish({...newDish,priceFull:e.target.value,price:e.target.value})}/>
                </div>
              </div>
            )}
          </div>

          {/* SPICE LEVEL */}
          <div>
            <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'10px',textTransform:'uppercase'}}>SPICE LEVEL</label>
            <div style={{display:'flex',gap:'8px'}}>
              {['','Low','Medium','High'].map(level=>(
                <button key={level} type="button"
                  onClick={()=>setNewDish({...newDish,spicylevel:level})}
                  style={{
                    flex:1,padding:'8px 6px',borderRadius:'8px',fontSize:'0.62rem',fontWeight:'900',cursor:'pointer',
                    background: newDish.spicylevel===level ? 'rgba(211,191,162,0.08)' : 'transparent',
                    border: newDish.spicylevel===level ? '1px solid rgba(211,191,162,0.25)' : '1px solid #1a1a1a',
                    color: newDish.spicylevel===level ? '#d3bfa2' : '#444',
                    transition:'all 0.15s'
                  }}>
                  {level === '' ? 'NONE' : level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

{/* ADD THIS — Serving Size */}
<div style={{ marginBottom: '12px' }}>
  <label style={{
    fontSize: '0.6rem', color: 'rgba(211,191,162,0.5)',
    fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase',
    display: 'block', marginBottom: '8px'
  }}>
    Serves (people per dish)
  </label>
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    {[1, 2, 3, 4].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => setNewDish(prev => ({ ...prev, servingSize: n }))}
        style={{
          width: '48px', height: '48px', borderRadius: '12px',
          border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '0.9rem',
          background: (newDish.servingSize || 1) === n
            ? 'linear-gradient(135deg, #d3bfa2, #bda88a)'
            : 'rgba(211,191,162,0.05)',
          color: (newDish.servingSize || 1) === n ? '#0c0c0c' : 'rgba(255,255,255,0.3)',
          outline: (newDish.servingSize || 1) === n
            ? 'none'
            : '1px solid rgba(211,191,162,0.1)',
          transition: 'all 0.15s'
        }}
      >
        {n}
      </button>
    ))}
  </div>
  <div style={{
    fontSize: '0.56rem', color: 'rgba(211,191,162,0.25)',
    marginTop: '6px', fontWeight: '600'
  }}>
    How many people can comfortably share 1 portion
  </div>
</div>
          {/* INGREDIENTS */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
            <div>
              <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>INGREDIENTS (English, comma separated)</label>
              <input type="text" placeholder="e.g. Paneer, Tomato, Capsicum"
                style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.78rem',outline:'none',boxSizing:'border-box'}}
                value={newDish.ingredients.en} onChange={e=>setNewDish({...newDish,ingredients:{...newDish.ingredients,en:e.target.value}})}/>
            </div>
            <div>
              <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>INGREDIENTS (Marathi)</label>
              <input type="text" placeholder="e.g. पनीर, टोमॅटो, कॅप्सिकम"
                style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.78rem',outline:'none',boxSizing:'border-box'}}
                value={newDish.ingredients.mr} onChange={e=>setNewDish({...newDish,ingredients:{...newDish.ingredients,mr:e.target.value}})}/>
            </div>
          </div>

{/* TOGGLES ROW */}
<div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

  {/* VEG / NON-VEG SELECTOR */}
  <div>
    <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'10px',textTransform:'uppercase'}}>DISH TYPE *</label>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
      <button type="button"
        onClick={() => setNewDish({...newDish, isVeg: true})}
        style={{
          padding: '14px', borderRadius: '10px', cursor: 'pointer',
          border: newDish.isVeg === true ? '1px solid rgba(74,124,63,0.5)' : '1px solid #1a1a1a',
          background: newDish.isVeg === true ? 'rgba(74,124,63,0.08)' : 'transparent',
          display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s'
        }}
      >
        {/* Veg symbol */}
        <div style={{
          width: '22px', height: '22px', border: `2px solid #4a7c3f`,
          borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, background: newDish.isVeg === true ? 'rgba(74,124,63,0.15)' : 'transparent'
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4a7c3f' }} />
        </div>
        <div style={{textAlign:'left'}}>
          <div style={{fontSize:'0.75rem',fontWeight:'900',color: newDish.isVeg === true ? '#fff' : '#555'}}>VEGETARIAN</div>
          <div style={{fontSize:'0.58rem',color:'#444',marginTop:'2px'}}>No meat or eggs</div>
        </div>
        {newDish.isVeg === true && (
          <div style={{marginLeft:'auto',width:'16px',height:'16px',borderRadius:'50%',background:'rgba(74,124,63,0.2)',border:'1px solid #4a7c3f',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#4a7c3f'}}/>
          </div>
        )}
      </button>

      <button type="button"
        onClick={() => setNewDish({...newDish, isVeg: false})}
        style={{
          padding: '14px', borderRadius: '10px', cursor: 'pointer',
          border: newDish.isVeg === false ? '1px solid rgba(138,48,48,0.5)' : '1px solid #1a1a1a',
          background: newDish.isVeg === false ? 'rgba(138,48,48,0.06)' : 'transparent',
          display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s'
        }}
      >
        {/* Non-veg symbol */}
        <div style={{
          width: '22px', height: '22px', border: `2px solid #8a3030`,
          borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, background: newDish.isVeg === false ? 'rgba(138,48,48,0.12)' : 'transparent'
        }}>
          <div style={{ width: '0', height: '0',
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderBottom: '9px solid #8a3030'
          }} />
        </div>
        <div style={{textAlign:'left'}}>
          <div style={{fontSize:'0.75rem',fontWeight:'900',color: newDish.isVeg === false ? '#fff' : '#555'}}>NON-VEGETARIAN</div>
          <div style={{fontSize:'0.58rem',color:'#444',marginTop:'2px'}}>Contains meat or eggs</div>
        </div>
        {newDish.isVeg === false && (
          <div style={{marginLeft:'auto',width:'16px',height:'16px',borderRadius:'50%',background:'rgba(138,48,48,0.15)',border:'1px solid #8a3030',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#8a3030'}}/>
          </div>
        )}
      </button>
    </div>
  </div>

  {/* CHEF'S SPECIAL TOGGLE */}
  <div style={{
    display:'flex',justifyContent:'space-between',alignItems:'center',
    padding:'14px',background:'#000',border:'1px solid #1a1a1a',borderRadius:'10px'
  }}>
    <div>
      <div style={{fontSize:'0.72rem',fontWeight:'900',color:'#fff'}}>CHEF'S SPECIAL</div>
      <div style={{fontSize:'0.58rem',color:'#444',marginTop:'3px'}}>Highlighted with Sparkle badge on customer menu</div>
    </div>
    <button type="button" onClick={()=>setNewDish({...newDish,isChefSpecial:!newDish.isChefSpecial})}
      style={{
        width:'40px',height:'22px',borderRadius:'11px',border:'none',cursor:'pointer',
        background:newDish.isChefSpecial?'#d3bfa2':'#1a1a1a',
        position:'relative',transition:'background 0.2s',flexShrink:0
      }}>
      <div style={{
        position:'absolute',top:'3px',
        left:newDish.isChefSpecial?'20px':'3px',
        width:'16px',height:'16px',borderRadius:'50%',
        background:newDish.isChefSpecial?'#000':'#444',
        transition:'left 0.2s'
      }}/>
    </button>
  </div>

</div>

          {/* TAGS */}
          <div>
            <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>TAGS (optional, comma separated)</label>
            <input type="text" placeholder="e.g. bestseller, must-try, new"
              style={{width:'100%',padding:'11px 13px',background:'#000',border:'1px solid #1a1a1a',color:'#fff',borderRadius:'8px',fontSize:'0.78rem',outline:'none',boxSizing:'border-box'}}
              value={newDish.tags} onChange={e=>setNewDish({...newDish,tags:e.target.value})}/>
          </div>

          {/* ACTIONS */}
          <div style={{display:'flex',gap:'12px',marginTop:'8px',paddingTop:'20px',borderTop:'1px solid #111'}}>
            <button
              onClick={()=>{setShowAddDishModal(false);setNewDish({name:'',name_mr:'',categoryId:'',price:'',priceHalf:'',priceFull:'',isVeg:false,isChefSpecial:false,isAvailable:true,ingredients:{en:'',mr:''},spicylevel:'',tags:'',_priceMode:'single'});}}
              style={styles.cancelBtn}>
              CANCEL
            </button>
            <button
              onClick={async()=>{
                if(!newDish.name?.trim()) return showNotif("Dish name is required","error");
                if(!newDish.categoryId) return showNotif("Select a category","error");
                const priceMode = newDish._priceMode || 'single';
                if(priceMode==='single' && !newDish.price) return showNotif("Price is required","error");
                if(priceMode==='half-full' && (!newDish.priceHalf||!newDish.priceFull)) return showNotif("Both Half and Full prices required","error");
                try {
                  const payload = {
                    tenantId,
                    name: newDish.name.trim(),
                    name_mr: newDish.name_mr?.trim() || '',
                    categoryId: newDish.categoryId,
                    price: priceMode==='single' ? Number(newDish.price) : Number(newDish.priceFull),
                    priceHalf: priceMode==='half-full' ? Number(newDish.priceHalf) : null,
                    priceFull: priceMode==='half-full' ? Number(newDish.priceFull) : null,
                    isVeg: newDish.isVeg,
                    isChefSpecial: newDish.isChefSpecial,
                    isAvailable: true,
                    spicylevel: newDish.spicylevel || '',
                    ingredients: {
                      en: newDish.ingredients.en ? newDish.ingredients.en.split(',').map(s=>s.trim()).filter(Boolean) : [],
                      mr: newDish.ingredients.mr ? newDish.ingredients.mr.split(',').map(s=>s.trim()).filter(Boolean) : []
                    },
                    tags: newDish.tags ? newDish.tags.split(',').map(s=>s.trim()).filter(Boolean) : []
                  };
                  await axios.post(`${BASE_URL}/menu`, payload);
                  showNotif(`${newDish.name} added to menu`,"success");
                  setShowAddDishModal(false);
setNewDish({name:'',name_mr:'',categoryId:'',price:'',priceHalf:'',priceFull:'',isVeg:true,isChefSpecial:false,isAvailable:true,ingredients:{en:'',mr:''},spicylevel:'',tags:'',_priceMode:'single'});                  fetchInitialData();
                  fetchManagementData();
                } catch(err) {
                  console.error(err);
                  showNotif("Failed to add dish","error");
                }
              }}
              style={{...styles.confirmBtn,flex:2,letterSpacing:'1px'}}>
              REGISTER DISH
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

{/* DELETE DISH MODAL */}
<AnimatePresence>
  {pendingDeleteDish && (
    <div style={styles.modalBackdrop}>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} style={styles.confirmBox}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:'20px'}}>
          <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'rgba(138,112,77,0.1)',border:'1px solid rgba(138,112,77,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <UtensilsCrossed size={22} color="#8a704d"/>
          </div>
        </div>
        <h3 style={{color:'#fff',margin:'0 0 10px',fontSize:'1.05rem',fontWeight:'900'}}>REMOVE DISH</h3>
        <p style={{color:'#555',fontSize:'0.82rem',marginBottom:'8px',lineHeight:'1.5'}}>
          Permanently delete <b style={{color:'#d3bfa2'}}>{pendingDeleteDish.name}</b> from the menu?
        </p>
        <p style={{color:'#333',fontSize:'0.72rem',marginBottom:'28px',lineHeight:'1.5'}}>
          This will remove the dish from customer menus immediately. Settled order history is unaffected.
        </p>
        <div style={{display:'flex',gap:'12px'}}>
          <button onClick={()=>setPendingDeleteDish(null)} style={styles.cancelBtn}>ABORT</button>
          <button
            onClick={async()=>{
              try {
                await axios.delete(`${BASE_URL}/menu-item/${pendingDeleteDish._id}`);
                setMenuItems(prev=>prev.filter(m=>m._id!==pendingDeleteDish._id));
                socket.emit("menu_change_detected",{tenantId,itemId:pendingDeleteDish._id,updateData:{...pendingDeleteDish,isAvailable:false,_deleted:true}});
                showNotif(`${pendingDeleteDish.name} removed from menu`,"success");
              } catch {
                showNotif("Failed to remove dish","error");
              } finally {
                setPendingDeleteDish(null);
              }
            }}
            style={{...styles.confirmBtn,background:'#8a704d',color:'#000'}}>
            REMOVE
          </button>
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
  if (wipingStaffId) return; // guard
  setWipingStaffId(pendingDeleteStaff._id);
  try {
    await axios.delete(`${BASE_URL}/staff/remove/${pendingDeleteStaff._id}`);
    setStaff(p=>p.filter(m=>m._id!==pendingDeleteStaff._id));
    setAttendanceLogs(p=>p.filter(l=>l.staffId!==pendingDeleteStaff._id));
    showNotif(`${pendingDeleteStaff.name.split(' (')[0]} removed`,"info");
    fetchManagementData();
  } catch { showNotif("Delete failed","error"); }
  finally { setWipingStaffId(null); setPendingDeleteStaff(null); }
}} 
disabled={!!wipingStaffId}
style={{
  ...styles.confirmBtn,
  background: wipingStaffId ? '#555' : '#ff4d4d',
  color:'#fff',
  cursor: wipingStaffId ? 'not-allowed' : 'pointer',
  opacity: wipingStaffId ? 0.6 : 1
}}>
  {wipingStaffId ? 'REMOVING...' : 'PURGE'}
</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


<AnimatePresence>
  {assignTableModal && (
    <div style={styles.modalBackdrop}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{   scale: 0.94, opacity: 0, y: 10  }}
        style={{ ...styles.confirmBox, width: '480px', textAlign: 'left', padding: '0', overflow: 'hidden' }}
      >
        {/* Modal header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #111', background: '#0a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(211,191,162,0.07)', border: '1px solid rgba(211,191,162,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TableProperties size={18} color="#d3bfa2" />
            </div>
            <div>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: '900', letterSpacing: '0.3px' }}>ASSIGN TABLE</h3>
              <div style={{ fontSize: '0.62rem', color: '#444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#d3bfa2', fontWeight: '800' }}>{assignTableModal.customerName}</span>
                <span>·</span>
                <Users size={10} color="#555" />
                <span>{assignTableModal.partySize} pax</span>
                {assignTableModal.items?.length > 0 && (
                  <>
                    <span>·</span>
                    <UtensilsCrossed size={10} color="#555" />
                    <span>{assignTableModal.items.length} items pre-ordered</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
 
        {/* Pre-order summary */}
        {assignTableModal.items?.length > 0 && (
          <div style={{ margin: '16px 28px 0', padding: '12px 14px', background: '#050505', border: '1px solid rgba(211,191,162,0.08)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ArrowRightCircle size={12} color="#8a704d" />
              <span style={{ fontSize: '0.56rem', color: '#8a704d', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Pre-order fires to KDS immediately on assign</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#666', lineHeight: 1.7 }}>
              {assignTableModal.items.map(i => `${i.quantity}× ${i.name}`).join('  ·  ')}
            </div>
            <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '0.7rem', fontWeight: '900', color: '#8a704d' }}>
              ₹{assignTableModal.totalAmount.toLocaleString()}
            </div>
          </div>
        )}
 
        {/* Instruction */}
        <div style={{ padding: '14px 28px 10px' }}>
          <p style={{ margin: 0, fontSize: '0.68rem', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hash size={11} color="#333" />
            Select a free table below — occupied tables are disabled
          </p>
        </div>
 
        {/* Table grid */}
        <div style={{ padding: '8px 28px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {Array.from({ length: tableCount }, (_, idx) => idx + 1).map(n => {
              const id   = n.toString();
              const isOcc = occupiedTables.includes(id);
              return (
                <button
                  key={n}
                  disabled={isOcc}
onClick={async () => {
  try {
    if (assignTableModal._fromReservation) {
      // ── RESERVATION PATH ──
      const res = await axios.patch(`${BASE_URL}/reservations/${assignTableModal._id}`, {
        status: 'seated',
        assignedTable: id
      });

      if (res.data?.success) {
        setAssignTableModal(null);
        fetchCounterQueue();
        fetchInitialData(); // refresh orders — KDS gets the pre-order if any

        // If server created an order from pre-order items, notify
        if (res.data?.order) {
          showNotif(
            `T${n} assigned to ${assignTableModal.customerName} — pre-order firing to KDS`,
            'success'
          );
        } else {
          showNotif(`T${n} assigned to ${assignTableModal.customerName}`, 'success');
        }
      } else {
        showNotif(res.data?.error || 'Assignment failed', 'error');
      }
    } else {
      // ── WAITLIST PATH (unchanged) ──
      const res = await axios.patch(`${BASE_URL}/waitlist/${assignTableModal._id}/assign`, {
        tableNumber: id
      });
      if (res.data?.success) {
        setAssignTableModal(null);
        fetchCounterQueue();
        fetchInitialData();
        showNotif(
          res.data.order
            ? `T${n} assigned to ${assignTableModal.customerName} — order firing to KDS`
            : `T${n} assigned to ${assignTableModal.customerName}`,
          'success'
        );
      } else {
        showNotif(res.data?.error || 'Assignment failed', 'error');
      }
    }
  } catch (err) {
    console.error('Assign error:', err.response?.data || err.message);
    showNotif(
      err.response?.data?.error || err.message || 'Failed to assign table',
      'error'
    );
  }
}}
        style={{
                    padding: '16px 8px', borderRadius: '12px', cursor: isOcc ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    transition: 'all 0.15s',
                    background: isOcc ? '#0d0d0d' : 'rgba(211,191,162,0.05)',
                    border: isOcc ? '1px solid #111' : '1px solid rgba(211,191,162,0.18)',
                    opacity: isOcc ? 0.35 : 1,
                    color: isOcc ? '#222' : '#d3bfa2',
                  }}
                  onMouseEnter={e => { if (!isOcc) { e.currentTarget.style.background = 'rgba(211,191,162,0.12)'; e.currentTarget.style.borderColor = 'rgba(211,191,162,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
                  onMouseLeave={e => { if (!isOcc) { e.currentTarget.style.background = 'rgba(211,191,162,0.05)'; e.currentTarget.style.borderColor = 'rgba(211,191,162,0.18)'; e.currentTarget.style.transform = 'none'; }}}
                >
                  <span style={{ fontSize: '1rem', fontWeight: '900', fontFamily: 'monospace', lineHeight: 1 }}>
                    {n}
                  </span>
                  <span style={{ fontSize: '0.46rem', fontWeight: '900', letterSpacing: '1px', color: isOcc ? '#2a2a2a' : '#555', textTransform: 'uppercase' }}>
                    {isOcc ? 'OCCUPIED' : 'FREE'}
                  </span>
                  {!isOcc && (
                    <span style={{ marginTop: '2px' }}>
                      <CircleDot size={7} color="rgba(211,191,162,0.3)" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
 
        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #0d0d0d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CircleDot size={10} color="#444" />
            <span style={{ fontSize: '0.58rem', color: '#333', fontWeight: '700' }}>
              {Array.from({ length: tableCount }, (_, i) => (i + 1).toString()).filter(id => !occupiedTables.includes(id)).length} tables free
            </span>
          </div>
          <button onClick={() => setAssignTableModal(null)} style={{
            padding: '10px 22px', background: 'transparent', border: '1px solid #1a1a1a',
            color: '#444', borderRadius: '10px', fontSize: '0.64rem', fontWeight: '900', cursor: 'pointer'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#444'; }}
          >
            CANCEL
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

<AnimatePresence>
  {activeAggregatorPopup && (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        style={{
          background: '#0d0d0d', border: '1px solid rgba(211,191,162,0.25)',
          borderTop: `4px solid ${activeAggregatorPopup.platform === 'zomato' ? '#cb202d' : '#fc8019'}`,
          borderRadius: '22px', padding: '32px', width: '100%', maxWidth: '460px',
          boxShadow: '0 0 60px rgba(211,191,162,0.08)'
        }}
      >
        {/* Platform badge + pulsing alert */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: activeAggregatorPopup.platform === 'zomato' ? '#cb202d' : '#fc8019'
              }}
            />
            <span style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '2px', color: '#888', textTransform: 'uppercase' }}>
              New Order
            </span>
          </div>
          <span style={{
            padding: '5px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '900',
            background: activeAggregatorPopup.platform === 'zomato' ? 'rgba(203,32,45,0.15)' : 'rgba(252,128,25,0.15)',
            color: activeAggregatorPopup.platform === 'zomato' ? '#cb202d' : '#fc8019',
            border: `1px solid ${activeAggregatorPopup.platform === 'zomato' ? 'rgba(203,32,45,0.3)' : 'rgba(252,128,25,0.3)'}`
          }}>
            {activeAggregatorPopup.platform?.toUpperCase()}
          </span>
        </div>

        {/* Customer */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
            {activeAggregatorPopup.customerName || 'Online Customer'}
          </div>
          {activeAggregatorPopup.customerPhone && (
            <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '2px' }}>{activeAggregatorPopup.customerPhone}</div>
          )}
        </div>

        {/* Items */}
        <div style={{ background: '#000', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 16px', marginBottom: '18px', maxHeight: '180px', overflowY: 'auto' }} className="custom-scroll">
          {(activeAggregatorPopup.items || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < activeAggregatorPopup.items.length - 1 ? '1px solid #141414' : 'none' }}>
              <span style={{ fontSize: '0.78rem', color: '#ccc', fontWeight: '700' }}>{it.quantity}× {it.name}</span>
              <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: '700' }}>₹{it.subtotal}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 4px' }}>
          <span style={{ fontSize: '0.7rem', color: '#555', fontWeight: '800', letterSpacing: '0.5px' }}>ORDER TOTAL</span>
          <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#d3bfa2' }}>₹{activeAggregatorPopup.grandTotal?.toLocaleString()}</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleAggregatorReject(activeAggregatorPopup)}
            style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #2a1515', color: '#8a3030', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px' }}
          >
            REJECT
          </button>
          <button
            onClick={() => handleAggregatorAccept(activeAggregatorPopup)}
            style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg,#d3bfa2,#bda88a)', border: 'none', color: '#000', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px' }}
          >
            ACCEPT & SEND TO KITCHEN
          </button>
        </div>

        {/* Queue indicator if more are waiting */}
        {incomingAggregatorOrders.length > 1 && (
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.62rem', color: '#444', fontWeight: '700' }}>
            +{incomingAggregatorOrders.length - 1} more order{incomingAggregatorOrders.length - 1 > 1 ? 's' : ''} waiting
          </div>
        )}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* SALARY EDIT MODAL */}
<AnimatePresence>
  {salaryEditModal && (
    <div style={styles.modalBackdrop}>
      <motion.div
        initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
        style={{...styles.confirmBox, width:'400px', textAlign:'left'}}
      >
        {/* HEADER */}
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
          <div style={{
            width:'36px',height:'36px',borderRadius:'10px',
            background:'rgba(211,191,162,0.08)',border:'1px solid rgba(211,191,162,0.15)',
            display:'flex',alignItems:'center',justifyContent:'center',color:'#d3bfa2',fontSize:'1rem'
          }}>₹</div>
          <div>
            <h3 style={{color:'#fff',margin:0,fontSize:'1rem',fontWeight:'900'}}>EDIT BASE SALARY</h3>
            <div style={{fontSize:'0.62rem',color:'#555',marginTop:'2px'}}>{salaryEditModal.name}</div>
          </div>
        </div>

        <p style={{fontSize:'0.7rem',color:'#444',marginBottom:'20px',lineHeight:'1.6',borderLeft:'2px solid #1a1a1a',paddingLeft:'10px'}}>
          Changing base salary requires authorization.<br/>

        </p>

        {/* NEW SALARY */}
        <div style={{marginBottom:'16px'}}>
          <label style={{fontSize:'0.55rem',color:'#555',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>
            NEW BASE SALARY (₹)
          </label>
          <input
            type="number"
            value={salaryEditValue}
            onChange={e => setSalaryEditValue(e.target.value)}
            placeholder="e.g. 28000"
            style={{
              width:'100%',padding:'12px 14px',background:'#000',
              border:'1px solid rgba(211,191,162,0.2)',color:'#fff',
              borderRadius:'8px',fontSize:'0.9rem',fontWeight:'900',
              outline:'none',boxSizing:'border-box'
            }}
          />
          <div style={{fontSize:'0.6rem',color:'#333',marginTop:'4px'}}>
            Current: ₹{Number(salaryEditModal.currentSalary).toLocaleString()}/mo
          </div>
        </div>

        {/* PASSWORD */}
        <div style={{marginBottom:'24px'}}>
          <label style={{fontSize:'0.55rem',color:'#d3bfa2',fontWeight:'900',letterSpacing:'0.8px',display:'block',marginBottom:'7px',textTransform:'uppercase'}}>
            AUTHORIZATION PASSWORD *
          </label>
          <input
            type="password"
            value={salaryEditPassword}
            onChange={e => setSalaryEditPassword(e.target.value)}

            style={{
              width:'100%',padding:'12px 14px',background:'#000',
              border:'1px solid rgba(211,191,162,0.2)',color:'#fff',
              borderRadius:'8px',fontSize:'0.85rem',outline:'none',boxSizing:'border-box'
            }}
          />
        </div>

        <div style={{display:'flex',gap:'12px'}}>
          <button
            onClick={() => {setSalaryEditModal(null); setSalaryEditPassword('');}}
            style={styles.cancelBtn}
          >
            CANCEL
          </button>
          <button
            onClick={async () => {
              const expectedPass = `${tenantId}@${tableCount}`;
              if (salaryEditPassword !== expectedPass) {
                showNotif('Incorrect authorization password', 'error');
                return;
              }
              if (!salaryEditValue || Number(salaryEditValue) <= 0) {
                showNotif('Enter a valid salary amount', 'error');
                return;
              }
              try {
                // Update base salary on staff record
                await axios.patch(`${BASE_URL}/staff/salary-status/${salaryEditModal.staffId}`, {
                  baseSalary: Number(salaryEditValue)
                });
                // Also update the monthly salary record for current month
                const monthStr = viewDate.getFullYear()+'-'+String(viewDate.getMonth()+1).padStart(2,'0');
                await axios.patch(`${BASE_URL}/staff/salary/${tenantId}/${salaryEditModal.staffId}/${monthStr}`, {
                  baseSalary: Number(salaryEditValue)
                });
                showNotif(`${salaryEditModal.name} salary updated to ₹${Number(salaryEditValue).toLocaleString()}`);
                setSalaryEditModal(null);
                setSalaryEditPassword('');
                fetchManagementData();
                fetchMonthlySalary(monthStr);
              } catch {
                showNotif('Failed to update salary', 'error');
              }
            }}
            style={{...styles.confirmBtn, flex: 2}}
          >
            AUTHORIZE & SAVE
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
<AnimatePresence>
  {purchaseOrderModal && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.65 }} exit={{ opacity: 0 }}
        onClick={() => setPurchaseOrderModal(null)}
        style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9200 }}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
          background: '#0a0b0e', border: '1px solid rgba(186,117,23,0.3)',
          borderRadius: '18px', zIndex: 9201,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(186,117,23,0.1)'
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: '1px solid #111',
          background: '#080808',
          borderRadius: '18px 18px 0 0',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShoppingCart size={16} color="#BA7517"/>
              <span style={{ fontSize: '0.58rem', color: '#BA7517', fontWeight: '900', letterSpacing: '2px' }}>
                PURCHASE ORDER GENERATOR
              </span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
              {purchaseOrderModal.item?.itemName}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '2px' }}>
              Current stock: {purchaseOrderModal.item?.currentStock} {purchaseOrderModal.item?.unit}
              {purchaseOrderModal.daysLeft !== null && purchaseOrderModal.daysLeft !== undefined && (
                <span style={{ color: '#BA7517', marginLeft: '8px' }}>
                  · {purchaseOrderModal.daysLeft}d remaining
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setPurchaseOrderModal(null)} style={{
            background: '#111', border: '1px solid #1a1a1a',
            color: '#555', padding: '7px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { l: 'AVG DAILY USAGE', v: purchaseOrderModal.proc?.avgDailyUsage > 0 ? `${purchaseOrderModal.proc.avgDailyUsage} ${purchaseOrderModal.item?.unit}/day` : 'No data' },
              { l: 'LAST BUY PRICE', v: purchaseOrderModal.lastPrice > 0 ? `₹${purchaseOrderModal.lastPrice.toFixed(2)}/${purchaseOrderModal.item?.unit}` : 'Not recorded' },
              { l: 'ESTIMATED COST', v: (purchaseOrderModal.lastPrice > 0 && Number(purchaseOrderModal.customQty) > 0) ? `₹${(purchaseOrderModal.lastPrice * Number(purchaseOrderModal.customQty)).toFixed(0)}` : '—' },
            ].map(s => (
              <div key={s.l} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.5rem', color: '#444', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>{s.l}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#d3bfa2' }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Editable fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

            {/* Quantity */}
            <div>
              <label style={{
                fontSize: '0.52rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px',
                textTransform: 'uppercase', display: 'block', marginBottom: '6px'
              }}>
                ORDER QUANTITY ({purchaseOrderModal.item?.unit})
                <span style={{ color: '#BA7517', marginLeft: '6px', fontWeight: '700' }}>
                  — Suggested based on 30-day usage
                </span>
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={purchaseOrderModal.customQty}
                  onChange={e => setPurchaseOrderModal(p => ({ ...p, customQty: e.target.value, copySuccess: false }))}
                  style={{
                    flex: 1, padding: '10px 14px',
                    background: '#0d0e11', border: '1px solid rgba(186,117,23,0.35)',
                    color: '#fff', borderRadius: '9px', fontSize: '0.9rem',
                    fontWeight: '900', outline: 'none', fontFamily: 'monospace'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: '700' }}>{purchaseOrderModal.item?.unit}</span>
              </div>
              {/* Quick quantity buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {(() => {
                  const base = purchaseOrderModal.suggestedQty || 100;
                  return [Math.round(base * 0.5), base, Math.round(base * 1.5), Math.round(base * 2)].map(qty => (
                    <button
                      key={qty}
                      onClick={() => setPurchaseOrderModal(p => ({ ...p, customQty: String(qty), copySuccess: false }))}
                      style={{
                        padding: '4px 10px', borderRadius: '5px', cursor: 'pointer',
                        background: purchaseOrderModal.customQty === String(qty) ? 'rgba(186,117,23,0.2)' : '#111',
                        border: `1px solid ${purchaseOrderModal.customQty === String(qty) ? 'rgba(186,117,23,0.5)' : '#1a1a1a'}`,
                        color: purchaseOrderModal.customQty === String(qty) ? '#BA7517' : '#555',
                        fontSize: '0.62rem', fontWeight: '800', fontFamily: 'monospace'
                      }}
                    >
                      {qty} {purchaseOrderModal.item?.unit}
                    </button>
                  ));
                })()}
              </div>
            </div>

            {/* Vendor */}
            <div>
              <label style={{
                fontSize: '0.52rem', color: '#555', fontWeight: '900', letterSpacing: '1.5px',
                textTransform: 'uppercase', display: 'block', marginBottom: '6px'
              }}>
                VENDOR / SUPPLIER
                {purchaseOrderModal.lastVendor && (
                  <span style={{ color: '#8a704d', marginLeft: '6px', fontWeight: '700' }}>
                    — last used: {purchaseOrderModal.lastVendor}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={purchaseOrderModal.customVendor}
                onChange={e => setPurchaseOrderModal(p => ({ ...p, customVendor: e.target.value, copySuccess: false }))}
                placeholder="e.g. Rajesh Traders, Mumbai Market, etc."
                style={{
                  width: '100%', padding: '10px 14px',
                  background: '#0d0e11', border: '1px solid #252932',
                  color: '#fff', borderRadius: '9px', fontSize: '0.82rem',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* ── PURCHASE ORDER PREVIEW ── */}
          <div style={{
            background: '#060608', border: '1px solid rgba(186,117,23,0.2)',
            borderRadius: '12px', padding: '18px', marginBottom: '16px',
            fontFamily: 'monospace'
          }}>
            <div style={{ fontSize: '0.52rem', color: '#555', fontWeight: '900', letterSpacing: '2px', marginBottom: '14px' }}>
              PURCHASE ORDER PREVIEW
            </div>

            {/* PO content — this is what gets copied */}
            <div id="po-preview-content" style={{ fontSize: '0.78rem', color: '#d3bfa2', lineHeight: 2 }}>
              {(() => {
                const item     = purchaseOrderModal.item;
                const qty      = Number(purchaseOrderModal.customQty) || 0;
                const vendor   = purchaseOrderModal.customVendor || '—';
                const price    = purchaseOrderModal.lastPrice || 0;
                const total    = price > 0 ? (price * qty).toFixed(0) : '—';
                const today    = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const deadline = (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + Math.max(1, Math.min(purchaseOrderModal.daysLeft || 3, 3)));
                  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                })();

                const lines = [
                  `PURCHASE ORDER`,
                  `Date: ${today}`,
                  `─────────────────────────────`,
                  `From: Jay Ambe Multi Fusion`,
                  `To:   ${vendor}`,
                  `─────────────────────────────`,
                  `Item:     ${item?.itemName}`,
                  `Quantity: ${qty} ${item?.unit}`,
                  price > 0 ? `Rate:     ₹${price.toFixed(2)} / ${item?.unit}` : null,
                  price > 0 && qty > 0 ? `Total:    ₹${total}` : null,
                  `─────────────────────────────`,
                  `Current Stock: ${item?.currentStock} ${item?.unit}`,
                  purchaseOrderModal.proc?.avgDailyUsage > 0 ? `Daily Usage:   ${purchaseOrderModal.proc.avgDailyUsage} ${item?.unit}/day` : null,
                  purchaseOrderModal.daysLeft !== null && purchaseOrderModal.daysLeft !== undefined ? `Runs out in:   ~${purchaseOrderModal.daysLeft} day${purchaseOrderModal.daysLeft !== 1 ? 's' : ''}` : null,
                  `Needed by:     ${deadline}`,
                  `─────────────────────────────`,
                  `Generated via Pratyeksha POS`,
                ].filter(Boolean);

                return lines.map((line, i) => (
                  <div key={i} style={{
                    color: line.startsWith('PURCHASE ORDER') ? '#BA7517'
                      : line.startsWith('─') ? '#222'
                      : line.startsWith('Item:') || line.startsWith('Quantity:') || line.startsWith('Total:') ? '#fff'
                      : '#8a8f9f'
                  }}>
                    {line}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* COPY button */}
            <button
              onClick={() => {
                const item     = purchaseOrderModal.item;
                const qty      = Number(purchaseOrderModal.customQty) || 0;
                const vendor   = purchaseOrderModal.customVendor || '—';
                const price    = purchaseOrderModal.lastPrice || 0;
                const total    = price > 0 ? (price * qty).toFixed(0) : '—';
                const today    = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const deadline = (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + Math.max(1, Math.min(purchaseOrderModal.daysLeft || 3, 3)));
                  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                })();

                const text = [
                  `PURCHASE ORDER`,
                  `Date: ${today}`,
                  `─────────────────────────────`,
                  `From: Jay Ambe Multi Fusion`,
                  `To:   ${vendor}`,
                  `─────────────────────────────`,
                  `Item:     ${item?.itemName}`,
                  `Quantity: ${qty} ${item?.unit}`,
                  price > 0 ? `Rate:     ₹${price.toFixed(2)} / ${item?.unit}` : null,
                  price > 0 && qty > 0 ? `Total:    ₹${total}` : null,
                  `─────────────────────────────`,
                  `Current Stock: ${item?.currentStock} ${item?.unit}`,
                  purchaseOrderModal.proc?.avgDailyUsage > 0 ? `Daily Usage:   ${purchaseOrderModal.proc.avgDailyUsage} ${item?.unit}/day` : null,
                  purchaseOrderModal.daysLeft !== null && purchaseOrderModal.daysLeft !== undefined ? `Runs out in:   ~${purchaseOrderModal.daysLeft} day${purchaseOrderModal.daysLeft !== 1 ? 's' : ''}` : null,
                  `Needed by:     ${deadline}`,
                  `─────────────────────────────`,
                  `Generated via Pratyeksha POS`,
                ].filter(Boolean).join('\n');

                navigator.clipboard.writeText(text).then(() => {
                  setPurchaseOrderModal(p => ({ ...p, copySuccess: true }));
                  setTimeout(() => setPurchaseOrderModal(p => p ? { ...p, copySuccess: false } : null), 3000);
                }).catch(() => {
                  // Fallback for browsers without clipboard API
                  const el = document.createElement('textarea');
                  el.value = text;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand('copy');
                  document.body.removeChild(el);
                  setPurchaseOrderModal(p => ({ ...p, copySuccess: true }));
                  setTimeout(() => setPurchaseOrderModal(p => p ? { ...p, copySuccess: false } : null), 3000);
                });
              }}
              style={{
                flex: 2, padding: '13px', borderRadius: '10px', border: 'none',
                background: purchaseOrderModal.copySuccess
                  ? 'linear-gradient(135deg,#4a7a4a,#5a9a5a)'
                  : 'linear-gradient(135deg,#8a704d,#BA7517)',
                color: '#fff', fontWeight: '900', fontSize: '0.78rem',
                cursor: 'pointer', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {purchaseOrderModal.copySuccess
                ? <><CheckCircle2 size={15}/> COPIED TO CLIPBOARD!</>
                : <><Copy size={15}/> COPY PURCHASE ORDER</>
              }
            </button>

            {/* WhatsApp share button */}
            <button
              onClick={() => {
                const item     = purchaseOrderModal.item;
                const qty      = Number(purchaseOrderModal.customQty) || 0;
                const vendor   = purchaseOrderModal.customVendor || '';
                const price    = purchaseOrderModal.lastPrice || 0;
                const total    = price > 0 ? `₹${(price * qty).toFixed(0)}` : '';
                const today    = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                const waText = encodeURIComponent(
                  `*PURCHASE ORDER* — ${today}\n` +
                  `*From:* Jay Ambe Multi Fusion\n` +
                  (vendor ? `*To:* ${vendor}\n` : '') +
                  `\n` +
                  `*Item:* ${item?.itemName}\n` +
                  `*Qty:* ${qty} ${item?.unit}\n` +
                  (price > 0 ? `*Rate:* ₹${price.toFixed(2)}/${item?.unit}\n` : '') +
                  (total ? `*Total:* ${total}\n` : '') +
                  `\n` +
                  `_Stock runs out in ~${purchaseOrderModal.daysLeft ?? '?'} days_\n` +
                  `_Please deliver before stock runs out_\n` +
                  `\n_Sent via Pratyeksha POS_`
                );

                window.open(`https://wa.me/?text=${waText}`, '_blank');
              }}
              style={{
                flex: 1, padding: '13px', borderRadius: '10px',
                background: 'rgba(37,211,102,0.12)',
                border: '1px solid rgba(37,211,102,0.3)',
                color: '#25d366', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: '900',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
              title="Share via WhatsApp"
            >
              <MessageSquare size={14}/> WHATSAPP
            </button>

            {/* Close */}
            <button
              onClick={() => setPurchaseOrderModal(null)}
              style={{
                padding: '13px 16px', borderRadius: '10px',
                background: 'transparent', border: '1px solid #252932',
                color: '#555', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '800'
              }}
            >
              <X size={14}/>
            </button>
          </div>

          {/* Tip */}
          <div style={{ marginTop: '10px', fontSize: '0.6rem', color: '#333', lineHeight: 1.5 }}>
            💡 Copy and paste into WhatsApp, SMS, or email to your supplier. Edit quantity and vendor above before copying.
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

<style>{`
 
/* ── BASE ── */
@keyframes moodPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(1.03);}}
@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
@keyframes p-slide-in{from{transform:translateX(-100%);}to{transform:translateX(0);}}
 
.custom-scroll::-webkit-scrollbar{width:4px;height:4px;}
.custom-scroll::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:10px;}
.custom-scroll::-webkit-scrollbar-track{background:transparent;}
.sidebar-nav::-webkit-scrollbar{width:2px;}
.sidebar-nav::-webkit-scrollbar-thumb{background:#222;border-radius:10px;}
.kds-scroll::-webkit-scrollbar{width:3px;}
.kds-scroll::-webkit-scrollbar-thumb{background:#2a1f0e;border-radius:10px;}
 
.spinner{border:3px solid #111;border-top:3px solid #d3bfa2;border-radius:50%;width:32px;height:32px;animation:spin .8s linear infinite;}
tr:hover td{background:rgba(255,255,255,.01);}
.mono{font-family:'JetBrains Mono','Courier New',monospace;}
 
/* ── DESKTOP — unchanged ── */
 
/* ══════════════════════════════════════════════
   TABLET  640px – 1024px
══════════════════════════════════════════════ */
@media (min-width:640px) and (max-width:1024px){
 
  /* Show hamburger, hide nothing else */
  .p-hamburger{display:flex!important;}
 
  /* Sidebar → drawer */
  .p-sidebar{
    position:fixed!important;
    left:0!important;top:0!important;bottom:0!important;
    width:260px!important;min-width:260px!important;
    z-index:9000!important;
    transform:translateX(-100%)!important;
    transition:transform 0.28s cubic-bezier(.4,0,.2,1)!important;
    box-shadow:4px 0 32px rgba(0,0,0,0.7)!important;
  }
  .p-sidebar.p-sidebar-open{
    transform:translateX(0)!important;
  }
  .p-mob-backdrop{display:block!important;}
 
  /* Nav labels visible */
  .p-nav-label{display:inline!important;}
 
  /* Main gets full width */
  main{width:100%!important;margin-left:0!important;}
 
  /* Header */
  .p-top-header{
    padding:0 18px!important;
    min-height:62px!important;
    gap:10px!important;
    flex-wrap:wrap!important;
  }
  .p-page-title{font-size:0.9rem!important;}
 
  /* HUD → horizontal scroll */
  .p-hud{
    flex-wrap:nowrap!important;
    overflow-x:auto!important;
    scrollbar-width:none!important;
    -webkit-overflow-scrolling:touch!important;
    margin-right:0!important;
    max-width:calc(100vw - 140px)!important;
  }
  .p-hud::-webkit-scrollbar{display:none!important;}
  .p-hud > div{min-width:90px!important;padding:4px 12px!important;}
 
  /* Insights header wraps */
  .p-insights-header{flex-wrap:wrap!important;gap:6px!important;}
  .p-xls-btn{padding:5px 8px!important;font-size:0.55rem!important;}
 
  /* Extras KPI */
  .p-extras-kpi > div{padding:12px 14px!important;}
 
  /* Menu header actions */
  .p-menu-header-actions{flex-wrap:wrap!important;gap:8px!important;}
  .p-autohide-label{display:none!important;}
 
  /* Scroll area */
  section[style*="scrollArea"],
  .scrollArea{padding:24px 20px!important;}
 
  /* KDS row — stacked on tablet */
  .p-kds-row{
    grid-template-columns:1fr!important;
    gap:16px!important;
  }
  .p-service-divider{display:none!important;}
 
  /* Queue grid */
  .p-queue-grid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))!important;}
 
  /* 2-col grids */
  div[style*="gridTemplateColumns:'1fr 1fr'"],
  div[style*='gridTemplateColumns:"1fr 1fr"']{
    grid-template-columns:1fr!important;
  }
 
  /* 4-col → 2-col */
  div[style*="gridTemplateColumns:'repeat(4,1fr)'"],
  div[style*="repeat(4, 1fr)"]{
    grid-template-columns:1fr 1fr!important;gap:10px!important;
  }
 
  /* Table grid */
  div[style*="tableGrid"]{grid-template-columns:repeat(4,1fr)!important;}
 
  /* Billing receipt */
  div[style*="width:'450px'"][style*="background:'#fff'"]{
    width:100%!important;max-width:100%!important;margin:0!important;
  }
 
  /* Full width grids */
  div[style*="fullWidthGrid"]{
    grid-template-columns:repeat(auto-fill,minmax(220px,1fr))!important;
  }
 
  /* Heatmap squares */
  div[style*="heatSquare"]{height:52px!important;border-radius:8px!important;}
  div[style*="heatSquareEmpty"]{height:52px!important;}
 
  /* Staff form */
  div[style*="'repeat(auto-fit,minmax(200px,1fr))'"],
  div[style*="repeat(auto-fit, minmax(200px, 1fr))"]{
    grid-template-columns:1fr 1fr!important;
  }
 
  /* Modals */
  .p-modal-backdrop{align-items:flex-end!important;padding:0!important;}
  .p-modal-box{
    max-width:100%!important;width:100%!important;
    border-radius:20px 20px 0 0!important;
    max-height:90vh!important;
    padding:28px 20px!important;margin:0!important;
  }
}
 
/* ══════════════════════════════════════════════
   MOBILE  ≤ 639px
══════════════════════════════════════════════ */
@media (max-width:639px){
 
  /* ── SIDEBAR → drawer ── */
  .p-hamburger{display:flex!important;}
  .p-sidebar{
    position:fixed!important;
    left:0!important;top:0!important;bottom:0!important;
    width:78vw!important;max-width:300px!important;
    z-index:9000!important;
    transform:translateX(-100%)!important;
    transition:transform 0.28s cubic-bezier(.4,0,.2,1)!important;
    box-shadow:4px 0 32px rgba(0,0,0,0.8)!important;
  }
  .p-sidebar.p-sidebar-open{transform:translateX(0)!important;}
  .p-mob-backdrop{display:block!important;}
  .p-nav-label{display:inline!important;}
  .p-op-text{display:block!important;}
  .p-logout-btn{display:block!important;}
  .p-op-card{display:flex!important;}
 
  /* ── MAIN ── */
  main{width:100vw!important;margin-left:0!important;overflow:hidden!important;}
 
  /* Header */
  .p-top-header{
    padding:0 12px!important;
    min-height:54px!important;height:54px!important;
    gap:8px!important;
    flex-wrap:nowrap!important;
    overflow-x:auto!important;
  }
  .p-top-header::-webkit-scrollbar{display:none!important;}
  .p-page-title{font-size:0.78rem!important;white-space:nowrap!important;}
 
  /* HUD → scrollable strip */
  .p-hud{
    flex-wrap:nowrap!important;
    overflow-x:auto!important;
    scrollbar-width:none!important;
    -webkit-overflow-scrolling:touch!important;
    max-width:calc(100vw - 80px)!important;
    margin-right:0!important;
    border-radius:8px!important;
  }
  .p-hud::-webkit-scrollbar{display:none!important;}
  .p-hud > div{min-width:80px!important;padding:4px 10px!important;}
 
  /* Insights header */
  .p-insights-header{
    flex-wrap:wrap!important;gap:5px!important;
    max-width:calc(100vw - 130px)!important;
  }
  .p-xls-btn{display:none!important;}
 
  /* Extras KPI compact */
  .p-extras-kpi{gap:6px!important;}
  .p-extras-kpi > div{padding:10px 10px!important;}
  .p-extras-kpi > div > div:first-child{font-size:1rem!important;}
  .p-extras-kpi > div > div:last-child{font-size:0.48rem!important;}
 
  /* Menu header actions */
  .p-menu-header-actions{flex-wrap:wrap!important;gap:6px!important;}
  .p-autohide-label{display:none!important;}
  .p-autohide-toggle{padding:6px 10px!important;}
 
  /* Zone buttons */
  div[style*="zoneControl"] button{
    padding:6px 10px!important;font-size:0.6rem!important;
  }
 
  /* ── SCROLL AREA ── */
  section[style*="scrollArea"]{
    padding:12px 10px 80px!important;
    height:calc(100vh - 54px)!important;
    overflow-y:auto!important;overflow-x:hidden!important;
    -webkit-overflow-scrolling:touch!important;
  }
 
  /* ── KDS pending ── */
  .p-kds-row{
    grid-template-columns:1fr!important;gap:12px!important;
  }
  .p-service-divider{display:none!important;}
  .p-queue-grid{grid-template-columns:1fr!important;}
 
  /* Queue tab bar */
  div[style*="queueTab"]{
    overflow-x:auto!important;scrollbar-width:none!important;
  }
  div[style*="queueTab"] button{
    font-size:0.5rem!important;padding:8px 8px!important;white-space:nowrap!important;
  }
 
  /* ── BILLING ── */
  div[style*="flex:1"][style*="specialModeRow"],
  div[style*="specialModeRow"]{flex-direction:column!important;gap:10px!important;}
  div[style*="specialModeRow"] button{flex:none!important;width:100%!important;}
 
  div[style*="tableGrid"]{grid-template-columns:repeat(4,1fr)!important;gap:8px!important;}
  div[style*="tableBtn"]{padding:20px 4px!important;border-radius:10px!important;}
 
  /* Receipt → full overlay */
  div[style*="width:'450px'"][style*="background:'#fff'"]{
    position:fixed!important;
    inset:54px 0 0 0!important;
    width:100vw!important;max-width:100vw!important;
    border-radius:0!important;
    z-index:7000!important;
    margin:0!important;
    padding:20px 14px 80px!important;
    overflow-y:auto!important;
  }
 
  /* ── INSIGHTS ── */
  div[style*="statsRow"]{
    flex-direction:row!important;flex-wrap:wrap!important;gap:10px!important;
  }
  div[style*="glassStat"]{
    flex:1 1 calc(50% - 10px)!important;padding:16px!important;min-width:0!important;
  }
  div[style*="statVal"]{font-size:1.3rem!important;}
 
  div[style*="heatmapCard"]{padding:14px!important;border-radius:16px!important;}
  div[style*="heatSquare"]{height:34px!important;border-radius:6px!important;}
  div[style*="heatSquareEmpty"]{height:34px!important;}
  div[style*="calendarGrid"]{gap:5px!important;}
  div[style*="dayHeader"]{font-size:0.48rem!important;}
 
  /* BI cards 2-col → 1-col */
  div[style*="display:'grid'"][style*="1fr 1fr"],
  div[style*='gridTemplateColumns:"1fr 1fr"']{
    grid-template-columns:1fr!important;
  }
 
  /* 4-col → 2-col */
  div[style*="repeat(4,1fr)"],
  div[style*="'repeat(4,1fr)'"]{
    grid-template-columns:1fr 1fr!important;gap:8px!important;
  }
  /* 3-col → 2-col */
  div[style*="repeat(3,1fr)"],
  div[style*="'repeat(3,1fr)'"]{
    grid-template-columns:1fr 1fr!important;gap:8px!important;
  }
  /* 6-col → 2-col */
  div[style*="repeat(6,1fr)"],
  div[style*="'repeat(6,1fr)'"]{
    grid-template-columns:1fr 1fr!important;gap:8px!important;
  }
 
  /* ── MENU ── */
  div[style*="fullWidthGrid"]{
    grid-template-columns:repeat(auto-fill,minmax(150px,1fr))!important;gap:10px!important;
  }
  div[style*="premiumCard"]{padding:16px!important;border-radius:16px!important;}
 
  /* ── MANAGEMENT ── */
  div[style*="repeat(auto-fit,minmax(200px,1fr))"]{
    grid-template-columns:1fr 1fr!important;
  }
  div[style*="repeat(auto-fill,minmax(280px,1fr))"]{
    grid-template-columns:1fr!important;
  }
  div[style*="overflowX:'auto'"],
  div[style*='overflowX:"auto"']{
    overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;
  }
  table{min-width:560px!important;}
 
  /* Attendance grid */
  div[style*="repeat(auto-fill,minmax(280px,1fr))"]{
    grid-template-columns:1fr!important;
  }
 
  /* ── INVENTORY ── */
  div[style*="'2fr 1fr 1fr 1fr 1fr auto'"],
  div[style*="'2fr 1fr 1fr 1fr auto'"]{
    grid-template-columns:1fr 1fr!important;
  }
 
  /* ── EXTRAS ── */
  div[style*="repeat(auto-fill,minmax(260px,1fr))"]{
    grid-template-columns:1fr!important;
  }
 
  /* Marketing 2-col */
  div[style*="botCard"]{width:100%!important;max-width:100%!important;padding:24px 16px!important;}
 
  /* Reservation KPI */
  div[style*="gridTemplateColumns:'repeat(4,1fr)'"][style*="reservation"]{
    grid-template-columns:1fr 1fr!important;gap:8px!important;
  }
 
  /* ── MODALS → bottom sheet ── */
  .p-modal-backdrop,
  div[style*="modalBackdrop"]{
    align-items:flex-end!important;padding:0!important;
  }
  .p-modal-box,
  div[style*="confirmBox"]{
    max-width:100%!important;width:100%!important;
    border-radius:20px 20px 0 0!important;
    max-height:90vh!important;overflow-y:auto!important;
    padding:22px 16px!important;margin:0!important;
  }
  div[style*="confirmBox"][style*="width:'480px'"],
  div[style*="confirmBox"][style*="width:'520px'"],
  div[style*="confirmBox"][style*="width:'400px'"],
  div[style*="confirmBox"][style*="width:'420px'"]{
    width:100%!important;
  }
 
  /* Assign table grid */
  div[style*="gridTemplateColumns:'repeat(5, 1fr)'"]{
    grid-template-columns:repeat(4,1fr)!important;gap:8px!important;
  }
 
  /* Purchase history drawer → bottom sheet */
  div[style*="position:'fixed'"][style*="right:'0'"][style*="width:'420px'"]{
    width:100vw!important;right:0!important;
    border-radius:20px 20px 0 0!important;
    top:auto!important;bottom:0!important;height:90vh!important;
  }
 
  /* Toast */
  div[style*="toast"]{
    bottom:16px!important;right:10px!important;left:10px!important;
    font-size:0.75rem!important;padding:12px 14px!important;
  }
 
  /* Add dish modal veg grid */
  div[style*="gridTemplateColumns:'1fr 1fr'"][style*="isVeg"]{
    grid-template-columns:1fr!important;
  }
 
  /* Staff add form */
  div[style*="'repeat(auto-fit,minmax(200px,1fr))'"]{
    grid-template-columns:1fr 1fr!important;
  }
 
  /* Category rankings */
  div[style*="repeat(auto-fit, minmax(300px, 1fr))"]{
    grid-template-columns:1fr!important;
  }
 
  /* Menu engineering 2×2 → 1-col */
  div[style*="matrix"]{grid-template-columns:1fr!important;}
 
  /* Dead menu items */
  div[style*="repeat(auto-fit,minmax(180px,1fr))"]{
    grid-template-columns:1fr 1fr!important;
  }
 
  /* Stats summary row compact */
  div[style*="glassStat"] h2{font-size:1.3rem!important;}
 
  /* Procurement */
  div[style*="repeat(auto-fill,minmax(200px,1fr))"]{
    grid-template-columns:1fr 1fr!important;
  }
 
  /* Extras add form */
  div[style*="'2fr 1fr 1fr 1fr 1fr 1fr auto'"]{
    grid-template-columns:1fr 1fr!important;
  }
}
 
/* ══════════════════════════════════════════════
   EXTRA SMALL  ≤ 380px
══════════════════════════════════════════════ */
@media (max-width:380px){
  section[style*="scrollArea"]{padding:8px 8px 80px!important;}
  div[style*="tableGrid"]{grid-template-columns:repeat(3,1fr)!important;}
  .p-page-title{font-size:0.68rem!important;}
  div[style*="glassStat"]{flex:1 1 100%!important;padding:12px!important;}
  div[style*="repeat(4,1fr)"],div[style*="'repeat(4,1fr)'"]{grid-template-columns:1fr 1fr!important;}
  div[style*="repeat(3,1fr)"],div[style*="'repeat(3,1fr)'"]{grid-template-columns:1fr!important;}
}
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