import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import {
  User,
  Mail,
  Lock,
  Bell,
  Sliders,
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [toast, setToast] = useState(null)
  
  // Profile settings state
  const [profileForm, setProfileForm] = useState({
    username: user?.username || 'admin',
    email: user?.email || 'admin@oxygensports.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyReport: false,
    expiryAlerts: true,
    sidebarBadge: true
  })

  // System settings state
  const [system, setSystem] = useState({
    defaultDuration: 12,
    defaultPriceRevision: 5,
    autoStatusUpdates: true,
    backupInterval: 'daily'
  })

  // Database status state
  const [dbStatus, setDbStatus] = useState('checking')
  const [pingTime, setPingTime] = useState(null)

  useEffect(() => {
    checkDatabaseConnection()
  }, [])

  const checkDatabaseConnection = async () => {
    setDbStatus('checking')
    const start = Date.now()
    try {
      await api.get('/health')
      setPingTime(Date.now() - start)
      setDbStatus('connected')
    } catch (e) {
      // Fallback local ping
      try {
        await fetch('/api/health')
        setPingTime(Date.now() - start)
        setDbStatus('connected')
      } catch {
        setDbStatus('disconnected')
      }
    }
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      showToast('error', 'New passwords do not match')
      return
    }
    showToast('success', 'Profile settings updated successfully')
    setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
  }

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    showToast('success', 'Preferences updated')
  }

  const handleSystemChange = (key, value) => {
    setSystem(prev => ({ ...prev, [key]: value }))
    showToast('success', 'System configuration updated')
  }

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast shadow-2xl flex items-center gap-3 ${
          toast.type === 'success' ? 'toast-success' : 'toast-error'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-widest uppercase">
          <span>OXYGEN SPORTS</span>
          <span>/</span>
          <span className="text-gray-500">SYSTEM SETTINGS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Settings & Configuration
        </h1>
        <p className="text-gray-500 text-sm">
          Manage user credentials, notification engines, and system defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Tabs Sidebar */}
        <div className="lg:col-span-1 space-y-1.5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-200 text-left ${
              activeTab === 'profile'
                ? 'bg-[#0059BB] text-white border-transparent shadow-lg shadow-blue-500/15'
                : 'bg-white/40 hover:bg-white/80 text-gray-600 border-white/50'
            }`}
          >
            <User className="w-4 h-4" />
            User Profile
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-200 text-left ${
              activeTab === 'notifications'
                ? 'bg-[#0059BB] text-white border-transparent shadow-lg shadow-blue-500/15'
                : 'bg-white/40 hover:bg-white/80 text-gray-600 border-white/50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          
          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-200 text-left ${
              activeTab === 'system'
                ? 'bg-[#0059BB] text-white border-transparent shadow-lg shadow-blue-500/15'
                : 'bg-white/40 hover:bg-white/80 text-gray-600 border-white/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            System Rules
          </button>
          
          <button
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-200 text-left ${
              activeTab === 'database'
                ? 'bg-[#0059BB] text-white border-transparent shadow-lg shadow-blue-500/15'
                : 'bg-white/40 hover:bg-white/80 text-gray-600 border-white/50'
            }`}
          >
            <Database className="w-4 h-4" />
            Database & Status
          </button>
        </div>

        {/* Right Tab Content */}
        <div className="lg:col-span-3">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="glass-card p-6 sm:p-8 animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#0059BB]" />
                User Profile Settings
              </h2>
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl neon-input text-gray-900"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl neon-input text-gray-900"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 my-6 pt-5 space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update Password</h3>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Enter current password to save changes"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl neon-input text-gray-900"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl neon-input text-gray-900"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl neon-input text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0059BB] hover:bg-[#004493] text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="glass-card p-6 sm:p-8 animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#0059BB]" />
                Notification Preferences
              </h2>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Email Alerts</h3>
                    <p className="text-xs text-gray-500">Send automated warning emails when a contract is 30 days from expiry.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailAlerts}
                      onChange={() => handleNotificationChange('emailAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0C4F44]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Weekly Summary Reports</h3>
                    <p className="text-xs text-gray-500">Email weekly contract summary updates to all assigned Relationship Managers.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={() => handleNotificationChange('weeklyReport')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0C4F44]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Critical Expiry Banners</h3>
                    <p className="text-xs text-gray-500">Show alert banners on the main dashboard for contracts in 'Expiring Soon' status.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.expiryAlerts}
                      onChange={() => handleNotificationChange('expiryAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0C4F44]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Sidebar Notification Badges</h3>
                    <p className="text-xs text-gray-500">Show dynamic warning count badges next to links in the navigation sidebar.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.sidebarBadge}
                      onChange={() => handleNotificationChange('sidebarBadge')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0C4F44]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM RULES TAB */}
          {activeTab === 'system' && (
            <div className="glass-card p-6 sm:p-8 animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#0059BB]" />
                System Configuration Defaults
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Default Contract Duration (Months)</label>
                    <input
                      type="number"
                      value={system.defaultDuration}
                      onChange={(e) => handleSystemChange('defaultDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg neon-input text-gray-900"
                      min="1"
                      max="120"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Standard Price Revision (%)</label>
                    <input
                      type="number"
                      value={system.defaultPriceRevision}
                      onChange={(e) => handleSystemChange('defaultPriceRevision', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg neon-input text-gray-900"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="divide-y divide-gray-100 border-t border-gray-100 mt-5">
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Automatic Status Engine</h3>
                      <p className="text-xs text-gray-500">Auto-update contract statuses from 'Active' to 'Expiring Soon' or 'Expired' dynamically based on current date.</p>
                    </div>
                    <label className="relative inline-flex inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={system.autoStatusUpdates}
                        onChange={() => handleSystemChange('autoStatusUpdates', !system.autoStatusUpdates)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0C4F44]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Automatic Backup Frequency</h3>
                      <p className="text-xs text-gray-500">Interval for packing and saving tracker database snapshots.</p>
                    </div>
                    <select
                      value={system.backupInterval}
                      onChange={(e) => handleSystemChange('backupInterval', e.target.value)}
                      className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Every Day</option>
                      <option value="weekly">Every Week</option>
                      <option value="manual">Manual Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DATABASE TAB */}
          {activeTab === 'database' && (
            <div className="glass-card p-6 sm:p-8 animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0059BB]" />
                Database Engine & Connection
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 rounded-xl border flex items-center justify-between gap-4 bg-white/40 border-white/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full ${
                      dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                      dbStatus === 'checking' ? 'bg-amber-400 animate-spin border-t-transparent' :
                      'bg-rose-500'
                    }`}></div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        {dbStatus === 'connected' ? 'Database Connected' :
                         dbStatus === 'checking' ? 'Connecting...' :
                         'Connection Lost'}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {dbStatus === 'connected' ? `Response latency: ${pingTime}ms • Pure JS WebAssembly SQLite Engine` :
                         dbStatus === 'checking' ? 'Testing local SQLite socket...' :
                         'Express server disconnected or offline.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={checkDatabaseConnection}
                    className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                    title="Reload Connection Status"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Engine Metadata</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/30 border border-white/50 p-4 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Database Type</p>
                      <p className="text-sm font-extrabold text-gray-800 mt-1">SQLite WASM</p>
                    </div>
                    <div className="bg-white/30 border border-white/50 p-4 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Tables</p>
                      <p className="text-sm font-extrabold text-gray-800 mt-1">3 Tables</p>
                    </div>
                    <div className="bg-white/30 border border-white/50 p-4 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Records</p>
                      <p className="text-sm font-extrabold text-[#0059BB] mt-1">15 Seeded</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-blue-800 text-xs leading-relaxed flex gap-2.5">
                    <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
                    <span>
                      The system uses a pure JS WebAssembly compiled instance of SQLite via <code>sql.js</code> on top of a file-persistent backing storage. Perfect for client presentations and full-fidelity local simulations.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
