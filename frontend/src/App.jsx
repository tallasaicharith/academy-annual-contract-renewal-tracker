import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Contracts from './pages/Contracts'
import AddContract from './pages/AddContract'
import EditContract from './pages/EditContract'
import ContractDetail from './pages/ContractDetail'
import Reports from './pages/Reports'
import { Settings as SettingsIcon, HelpCircle } from 'lucide-react'

// Placeholder components
function SettingsPlaceholder() {
  return (
    <div className="max-w-2xl mx-auto mt-16 animate-fadeIn">
      <div className="glass-card p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0C4F44] to-[#127464] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#0C4F44]/15">
          <SettingsIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">System Settings</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
          Configuration parameters, role privilege mappings, and system preferences will be available here.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Under Development</span>
        </div>
      </div>
    </div>
  )
}

function HelpCenterPlaceholder() {
  return (
    <div className="max-w-2xl mx-auto mt-16 animate-fadeIn">
      <div className="glass-card p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0059BB] to-[#004493] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/15">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Help Center</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
          Product documentation, user guides, and technical support resources will be available here.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Coming Soon</span>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="contracts/new" element={<AddContract />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="contracts/:id/edit" element={<EditContract />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SettingsPlaceholder />} />
        <Route path="help" element={<HelpCenterPlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
