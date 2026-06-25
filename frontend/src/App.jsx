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
import HelpCenter from './screens/HelpCenter'
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
          <Route path="help" element={<HelpCenter />} />
        </Route>
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
