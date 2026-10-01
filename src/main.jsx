import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import OperatorPortal from './OperatorPortal.jsx'
import KitchenView from './KitchenView.jsx'
import PratyekshaMasterAdmin from './PratyekshaMasterAdmin.jsx'
import Pratyeksha from './Pratyeksha.jsx'
import OwnerApp, { OwnerLauncher } from './OwnerApp.jsx'
import CustomerHome from './CustomerHome.jsx'
import { configurePwa } from './pwa.js'

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('[ui-error-boundary]', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#0e0e0e',color:'#f7f3eb',fontFamily:'system-ui,sans-serif',textAlign:'center'}}>
      <div><h1 style={{fontSize:20,marginBottom:8}}>Something went wrong</h1><p style={{opacity:.7}}>Please refresh the page. Your saved data remains on the server.</p><button type="button" onClick={() => window.location.reload()} style={{marginTop:16,padding:'10px 16px',borderRadius:8,border:'1px solid #d3bfa2',background:'#d3bfa2',color:'#111',fontWeight:700,cursor:'pointer'}}>Refresh</button></div>
    </div>;
  }
}

const initialPath = window.location.pathname;
if (initialPath.startsWith('/operator')) configurePwa('operator');
else if (initialPath.startsWith('/kitchen')) configurePwa('kitchen');
else if (initialPath === '/' || (!initialPath.startsWith('/landing') && !initialPath.startsWith('/master-admin') && !initialPath.startsWith('/owner'))) configurePwa('customer');

function KitchenLauncher() {
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('kitchen_tenant_id') : '';
  return tenantId ? <Navigate to={`/kitchen/${encodeURIComponent(tenantId)}`} replace /> : <Navigate to="/" replace />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
      <Routes>
        {/* 1. 🌐 Pratyeksha Landing Page */}
        <Route path="/landing" element={<Pratyeksha />} />

        {/* 2. Master Admin (SaaS Control) */}
        <Route path="/master-admin" element={<PratyekshaMasterAdmin />} />

        {/* 3. Kitchen Route */}
        <Route path="/kitchen" element={<KitchenLauncher />} />
        <Route path="/kitchen/:tenantId" element={<KitchenView />} />

        {/* 4. Operator Portal Route */}
        <Route path="/operator" element={<OperatorPortal />} />

        {/* 5a. Owner App Launcher — this is what the installed PWA icon opens
               (web manifest start_url is "/owner/", with no tenant segment) */}
        <Route path="/owner" element={<OwnerLauncher />} />

        {/* 5b. Owner App Route (Live Dashboard, P&L, Inventory, Staff, etc.) */}
        <Route path="/owner/:tenantId/*" element={<OwnerApp />} />

        {/* 6. Customer Menu Route (Dynamic) */}
        {/* Must stay near the bottom — catches /:tenantId */}
        <Route path="/:tenantId" element={<App />} />

        {/* 7. Customer PWA Home — installed app opens here unless a restaurant QR route is active */}
        <Route path="/" element={<CustomerHome />} />

        {/* 8. Default fallback → customer PWA home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>
)