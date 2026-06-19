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
import Settings from './pages/Settings'
import Help from './pages/Help'

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
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App

