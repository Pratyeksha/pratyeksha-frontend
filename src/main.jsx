import React, { StrictMode, Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import './index.css'
import './themeScroll.css'
// Every screen is its own download: a guest opening the menu no longer pulls the owner dashboard, kitchen board or admin tools.
const App = lazy(() => import('./App.jsx'))
const OperatorPortal = lazy(() => import('./OperatorPortal.jsx'))
const KitchenView = lazy(() => import('./KitchenView.jsx'))
const PratyekshaMasterAdmin = lazy(() => import('./PratyekshaMasterAdmin.jsx'))
const Pratyeksha = lazy(() => import('./Pratyeksha.jsx'))
const OwnerApp = lazy(() => import('./OwnerApp.jsx'))
const OwnerLauncher = lazy(() => import('./OwnerApp.jsx').then((m) => ({ default: m.OwnerLauncher })))
const CustomerHome = lazy(() => import('./CustomerHome.jsx'))
const FeedbackSuiteFrame = lazy(() => import('./FeedbackSuiteFrame.jsx'))
import { configurePwa } from './pwa.js'
import API_BASE_URL from './apiBase.js'
import { BrandLoader } from './PremiumUI.jsx'
import { loaderMessageFor } from './loaderMessages.js'
import { SubscriptionGate, installSubscriptionInterceptor } from './SubscriptionGate.jsx'

installSubscriptionInterceptor();

/* Expired subscriptions lock the customer app, KDS and Owner app behind a renewal page. */
function Gated({ children }) {
  const { tenantId } = useParams();
  return <SubscriptionGate tenantId={tenantId}>{children}</SubscriptionGate>;
}

/* Premium launch screen: shown once per page load / PWA launch, continues the static splash in index.html. */
function SplashGate({ children }) {
  const [phase, setPhase] = useState('show'); // show → fade → gone
  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('fade'), 1000);
    const t2 = window.setTimeout(() => setPhase('gone'), 1500);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);
  return (
    <>
      {children}
      {phase !== 'gone' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, opacity: phase === 'fade' ? 0 : 1, transition: 'opacity .5s ease', pointerEvents: phase === 'fade' ? 'none' : 'auto' }}>
          <BrandLoader message={loaderMessageFor(window.location.pathname)} />
        </div>
      )}
    </>
  );
}

/* Marks customer surfaces (guest home + restaurant menu) so the gold scrollbar theme leaves their hidden scrollbars alone. */
const STAFF_PREFIXES = ['landing', 'master-admin', 'kitchen', 'operator', 'owner', 'feedback-suite'];
function SurfaceFlag() {
  const { pathname } = useLocation();
  useEffect(() => {
    const first = pathname.split('/').filter(Boolean)[0] || '';
    const customer = first === '' || !STAFF_PREFIXES.includes(first);
    if (customer) document.documentElement.setAttribute('data-customer', '1');
    else document.documentElement.removeAttribute('data-customer');
  }, [pathname]);
  return null;
}

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('[ui-error-boundary]', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#0e0e0e',color:'#f7f3eb',fontFamily:'system-ui,sans-serif',textAlign:'center'}}>
      <div><h1 style={{fontSize:20,marginBottom:8,color:"#f7f3eb"}}>Something went wrong</h1><p style={{opacity:.7}}>Please refresh the page. Your saved data remains on the server.</p><button type="button" onClick={() => window.location.reload()} style={{marginTop:16,padding:'10px 16px',borderRadius:8,border:'1px solid #d3bfa2',background:'#d3bfa2',color:'#111',fontWeight:700,cursor:'pointer'}}>Refresh</button></div>
    </div>;
  }
}

const initialPath = window.location.pathname;
if (initialPath.startsWith('/operator')) configurePwa('operator');
else if (initialPath.startsWith('/kitchen')) configurePwa('kitchen');
else if (initialPath === '/' || (!initialPath.startsWith('/landing') && !initialPath.startsWith('/master-admin') && !initialPath.startsWith('/owner'))) configurePwa('customer');

function KitchenLauncher() {
  const [saved] = useState(() => { try { return localStorage.getItem('kitchen_tenant_id') || ''; } catch { return ''; } });
  const [id, setId] = useState('');
  const [go, setGo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (saved) return <Navigate to={`/kitchen/${encodeURIComponent(saved)}`} replace />;
  if (go) return <Navigate to={`/kitchen/${encodeURIComponent(go)}`} replace />;
  // First visit on this device: ask for the outlet ID instead of silently dumping kitchen staff on the guest home page.
  // The outlet is checked before it is remembered, so a typo cannot trap this device on a dead kitchen board.
  const submit = async (e) => {
    e.preventDefault();
    const v = id.trim().toLowerCase();
    if (!v || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`${API_BASE_URL}/tenant/${encodeURIComponent(v)}`);
      if (r.status === 404) setErr('No restaurant found with that outlet ID. Check it and try again.');
      else if (!r.ok) setErr('Could not reach the server. Please try again.');
      else setGo(v);
    } catch { setErr('Could not reach the server. Check your internet connection.'); }
    setBusy(false);
  };
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#0e0e0e', color: '#f7f3eb', fontFamily: 'system-ui, sans-serif' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 360, display: 'grid', gap: 14, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Kitchen display</h1>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.65 }}>Enter your outlet ID to open this restaurant's kitchen board. This device will remember it.</p>
        <input value={id} onChange={(e) => { setId(e.target.value); setErr(''); }} placeholder="Outlet ID" autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false}
          style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(211,191,162,.35)', background: 'rgba(255,255,255,.05)', color: '#f7f3eb', fontSize: 16, outline: 'none' }} />
        {err && <div role="alert" style={{ fontSize: 12.5, color: '#f0a89a' }}>{err}</div>}
        <button type="submit" disabled={!id.trim() || busy} style={{ padding: '14px 16px', borderRadius: 12, border: 0, background: '#d3bfa2', color: '#14110c', fontWeight: 800, fontSize: 14, cursor: id.trim() && !busy ? 'pointer' : 'not-allowed', opacity: id.trim() && !busy ? 1 : 0.5 }}>{busy ? 'Checking…' : 'Open kitchen'}</button>
      </form>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <SplashGate>
      <BrowserRouter>
      <SurfaceFlag />
      <Suspense fallback={<BrandLoader message={loaderMessageFor(window.location.pathname)} />}>
      <Routes>
        {/* 1. 🌐 Pratyeksha Landing Page */}
        <Route path="/landing" element={<Pratyeksha />} />

        {/* 2. Master Admin (SaaS Control) */}
        <Route path="/master-admin" element={<PratyekshaMasterAdmin />} />

        {/* 3. Kitchen Route */}
        <Route path="/kitchen" element={<KitchenLauncher />} />
        <Route path="/kitchen/:tenantId" element={<Gated><KitchenView /></Gated>} />

        {/* 4. Operator Portal Route */}
        <Route path="/operator" element={<OperatorPortal />} />

        {/* 5a. Owner App Launcher — this is what the installed PWA icon opens
               (web manifest start_url is "/owner/", with no tenant segment) */}
        <Route path="/owner" element={<OwnerLauncher />} />

        {/* 5b. Owner App Route (Live Dashboard, P&L, Inventory, Staff, etc.) */}
        <Route path="/owner/:tenantId/*" element={<Gated><OwnerApp /></Gated>} />

        {/* 6. Feedback Suite — isolated sub-app; original feedback UI and CSS remain unchanged */}
        <Route path="/feedback-suite/*" element={<FeedbackSuiteFrame />} />

        {/* 7. Customer Menu Route (Dynamic) */}
        {/* Must stay near the bottom — catches /:tenantId */}
        <Route path="/:tenantId" element={<Gated><App /></Gated>} />

        {/* 8. Customer PWA Home — installed app opens here unless a restaurant QR route is active */}
        <Route path="/" element={<CustomerHome />} />

        {/* 9. Default fallback → customer PWA home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </Suspense>
      </BrowserRouter>
      </SplashGate>
    </AppErrorBoundary>
  </StrictMode>
)