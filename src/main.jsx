import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import OperatorPortal from './OperatorPortal.jsx'
import KitchenView from './KitchenView.jsx'
import PratyekshaMasterAdmin from './PratyekshaMasterAdmin.jsx'
import Pratyeksha from './Pratyeksha.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. 🌐 Pratyeksha Landing Page */}
        <Route path="/landing" element={<Pratyeksha />} />

        {/* 2. Master Admin (SaaS Control) */}
        <Route path="/master-admin" element={<PratyekshaMasterAdmin />} />

        {/* 3. Kitchen Route */}
        <Route path="/kitchen/:tenantId" element={<KitchenView />} />

        {/* 4. Operator Portal Route */}
        <Route path="/operator" element={<OperatorPortal />} />

        {/* 5. Customer Menu Route (Dynamic) */}
        {/* Must stay near the bottom — catches /:tenantId */}
        <Route path="/:tenantId" element={<App />} />

        {/* 6. Default Fallback → Landing Page */}
        <Route path="/" element={<Navigate to="/landing" replace />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>
)