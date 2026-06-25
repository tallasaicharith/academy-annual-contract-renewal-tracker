import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './screens/Login'
import AcademyAnnualContractRenewalDashboard from './screens/AcademyAnnualContractRenewalDashboard'
import AcademyAnnualContractRenewalEntryForm from './screens/AcademyAnnualContractRenewalEntryForm'
import DetailAndHistoryView from './screens/DetailAndHistoryView'
import ReportsAndAnalyticsDashboard from './screens/ReportsAndAnalyticsDashboard'
import TeamManagement from './screens/TeamManagement'
import Settings from './screens/Settings'
import { HelpCircle } from 'lucide-react'

// Guard to restrict employee access to admin-only screens
function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user || user.role !== 'admin') {
    return <Navigate to="/my-contracts" replace />
  }
  return children
}

// Placeholder components styled professionally matching design tokens

// Help Center placeholder
function HelpCenterPlaceholder() {
  return (
    <div className="max-w-2xl mx-auto mt-16 animate-fadeIn">
      <div className="flat-card p-10 text-center bg-white border border-outline-variant">
        <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2 tracking-tight font-headline">Help Center</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed max-w-md mx-auto">
          System user documentation, standard operation guides, and customer support ticket logging will be accessible in this panel.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-widest">Coming Soon</span>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [searchValue, setSearchValue] = useState('')

  return (
    <AuthProvider>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard/Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout searchValue={searchValue} onSearchChange={setSearchValue} />
            </ProtectedRoute>
          }
        >
          {/* Main Redirect index */}
          <Route 
            index 
            element={
              <Navigate to="/dashboard" replace />
            } 
          />
          
          <Route 
            path="dashboard" 
            element={<AcademyAnnualContractRenewalDashboard searchValue={searchValue} />} 
          />

          <Route 
            path="my-contracts" 
            element={<AcademyAnnualContractRenewalDashboard searchValue={searchValue} />} 
          />

          <Route 
            path="contracts/new" 
            element={<AcademyAnnualContractRenewalEntryForm mode="create" />} 
          />
          <Route 
            path="academies/:id" 
            element={<DetailAndHistoryView />} 
          />
          <Route 
            path="contracts/:id/edit" 
            element={<AcademyAnnualContractRenewalEntryForm mode="edit" />} 
          />
          <Route 
            path="reports" 
            element={<ReportsAndAnalyticsDashboard />} 
          />

          {/* Admin Only Route */}
          <Route 
            path="team" 
            element={
              <AdminRoute>
                <TeamManagement />
              </AdminRoute>
            } 
          />

          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<HelpCenterPlaceholder />} />
        </Route>
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
