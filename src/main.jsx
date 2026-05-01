import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import OperatorPortal from './OperatorPortal.jsx'
import KitchenView from './KitchenView.jsx'
import PratyekshaMasterAdmin from './PratyekshaMasterAdmin.jsx' // 🚀 Import your new component

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. Master Admin (SaaS Control) */}
        <Route path="/master-admin" element={<PratyekshaMasterAdmin />} />

        {/* 2. Kitchen Route */}
        <Route path="/kitchen/:tenantId" element={<KitchenView />} />

        {/* 3. Operator Portal Route */}
        <Route path="/operator" element={<OperatorPortal />} />

        {/* 4. Customer Menu Route (Dynamic) */}
        {/* Must stay at the bottom of the list */}
        <Route path="/:tenantId" element={<App />} />

    
      </Routes>
    </BrowserRouter>
  </StrictMode>
)