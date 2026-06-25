import { useState, useEffect } from 'react'
import { 
  User, 
  Lock, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Pencil, 
  Loader2, 
  CheckCircle2, 
  X,
  RefreshCw,
  Globe
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { 
  getSettings, 
  updateProfile, 
  changePassword, 
  updateSystemConfig, 
  getCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from '../api/api'

export default function Settings() {
  const { user, login } = useAuth()
  
  // States
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingSystem, setSavingSystem] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('success') // 'success' | 'error'

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    avatarUrl: '',
    renewalAlertThreshold: 30
  })

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')

  // System Config State
  const [systemForm, setSystemForm] = useState({
    defaultRenewalAlertThreshold: 30,
    defaultPriceRevisionSuggestion: 5.0
  })

  // Categories CRUD States
  const [categories, setCategories] = useState([])
  const [categoryNameInput, setCategoryNameInput] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')

  useEffect(() => {
    loadSettingsData()
  }, [])

  const loadSettingsData = async () => {
    try {
      setLoading(true)
      const [settings, cats] = await Promise.all([
        getSettings(),
        getCategories()
      ])

      setProfileForm({
        name: user?.name || '',
        phone: user?.phone || '',
        avatarUrl: user?.avatarUrl || '',
        renewalAlertThreshold: settings.renewalAlertThreshold || 30
      })

      if (user?.role === 'admin') {
        setSystemForm({
          defaultRenewalAlertThreshold: settings.defaultRenewalAlertThreshold || 30,
          defaultPriceRevisionSuggestion: settings.defaultPriceRevisionSuggestion || 5.0
        })
      }

      setCategories(cats)
    } catch (err) {
      console.error(err)
      showToast('Failed to load settings data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle profile avatar upload (base64)
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, avatarUrl: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      setSavingProfile(true)
      const updatedUser = await updateProfile(profileForm)
      showToast('Profile updated successfully!')
      // Sync local user object values if needed
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Confirm password does not match.')
      return
    }

    try {
      setSavingPassword(true)
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      showToast('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  // Save System Configuration Handler
  const handleSaveSystemConfig = async (e) => {
    e.preventDefault()
    try {
      setSavingSystem(true)
      await updateSystemConfig(systemForm)
      showToast('System configuration updated successfully!')
    } catch (err) {
      showToast(err.message || 'Failed to update configuration.', 'error')
    } finally {
      setSavingSystem(false)
    }
  }

  // Add Equipment Category
  const handleAddCategory = async (e) => {
    e.preventDefault()
    setCategoryError('')
    if (!categoryNameInput.trim()) return

    try {
      const newCat = await addCategory(categoryNameInput)
      setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)))
      setCategoryNameInput('')
      showToast('Category added successfully!')
    } catch (err) {
      setCategoryError(err.message || 'Failed to add category.')
    }
  }

  // Rename Equipment Category
  const handleRenameCategory = async (id) => {
    setCategoryError('')
    if (!editingCategoryName.trim()) return

    try {
      const updatedCat = await updateCategory(id, editingCategoryName)
      setCategories(prev => prev.map(c => c.id === id ? updatedCat : c).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingCategoryId(null)
      setEditingCategoryName('')
      showToast('Category renamed successfully!')
    } catch (err) {
      setCategoryError(err.message || 'Failed to rename category.')
    }
  }

  // Delete Equipment Category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to remove this category option? Existing contracts using this category will remain unchanged, but it will be removed from new selection list.')) return
    
    try {
      await deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      showToast('Category deleted successfully!')
    } catch (err) {
      showToast(err.message || 'Failed to delete category.', 'error')
    }
  }

  if (loading) {
    return <LoadingSpinner message="Retrieving settings and profiles..." />
  }

  return (
    <div className="space-y-6 animate-fadeIn relative pb-10">
      {/* Toast notifications */}
      {toastMessage && (
        <div className={`toast ${toastType === 'success' ? 'toast-success' : 'toast-error'} shadow-2xl flex items-center gap-2.5`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header breadcrumb & back button */}
      <div className="space-y-1 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-outline tracking-widest uppercase font-mono">
          <span>Oxygen Sports</span>
          <span>/</span>
          <span className="text-on-surface-variant font-extrabold">Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
          Settings & Configurations
        </h1>
        <p className="text-on-surface-variant text-xs font-medium">
          Manage your personal profile, passwords, renewal thresholds and equipment categories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Form Card */}
          <form onSubmit={handleSaveProfile} className="flat-card p-6 bg-white space-y-6">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
              <User className="w-4 h-4 text-primary" /> My Profile
            </h3>

            {/* Avatar upload section */}
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative">
                {profileForm.avatarUrl ? (
                  <img 
                    src={profileForm.avatarUrl} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-full border border-outline-variant object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border border-outline-variant uppercase font-mono">
                    {user?.name ? user.name[0] : (user?.username ? user.username[0] : 'U')}
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <input
                  type="file"
                  id="settings-avatar-upload"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  accept="image/*"
                />
                <label
                  htmlFor="settings-avatar-upload"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-[11px] font-bold uppercase tracking-wider text-on-surface border border-outline-variant rounded-sm cursor-pointer transition-colors"
                >
                  Upload New Avatar
                </label>
                <p className="text-[10px] text-outline">JPEG, PNG or GIF. Max 500KB. (Saved as Local Base64)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="flat-input w-full px-3.5 py-2 border-outline-variant"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="flat-input w-full px-3.5 py-2 border-outline-variant"
                  placeholder="e.g. +91 99999 99999"
                />
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                  Email Address (Login Identifier)
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="flat-input w-full px-3.5 py-2 bg-surface-container-low text-outline cursor-not-allowed border-outline-variant/60"
                />
              </div>

              {/* Renewal Alert Threshold (individual override) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                  My Renewal Alert Threshold (Days)
                </label>
                <input
                  type="number"
                  value={profileForm.renewalAlertThreshold}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, renewalAlertThreshold: e.target.value }))}
                  className="flat-input w-full px-3.5 py-2 border-outline-variant"
                  min="1"
                  required
                />
                <p className="text-[10px] text-outline">Customize how many days before contract expiry you want to receive alerts.</p>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-sm bg-primary hover:bg-primary/95 disabled:bg-outline-variant text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </div>
          </form>

          {/* System Configuration Section (Admin Only) */}
          {user?.role === 'admin' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Config Form Card */}
              <form onSubmit={handleSaveSystemConfig} className="flat-card p-6 bg-white space-y-6">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
                  <SettingsIcon className="w-4 h-4 text-primary" /> System Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Default Threshold */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                      Default Renewal Alert Threshold (Days)
                    </label>
                    <input
                      type="number"
                      value={systemForm.defaultRenewalAlertThreshold}
                      onChange={(e) => setSystemForm(prev => ({ ...prev, defaultRenewalAlertThreshold: e.target.value }))}
                      className="flat-input w-full px-3.5 py-2 border-outline-variant"
                      min="1"
                      required
                    />
                    <p className="text-[10px] text-outline">Default threshold applied site-wide unless an employee overrides their own.</p>
                  </div>

                  {/* Suggestion revision % */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                      Default Price Revision Suggestion (%)
                    </label>
                    <input
                      type="number"
                      value={systemForm.defaultPriceRevisionSuggestion}
                      onChange={(e) => setSystemForm(prev => ({ ...prev, defaultPriceRevisionSuggestion: e.target.value }))}
                      className="flat-input w-full px-3.5 py-2 border-outline-variant"
                      step="0.1"
                      min="0"
                      required
                    />
                    <p className="text-[10px] text-outline">Revision suggestion percentage shown as a hint on New Contract Entry form.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={savingSystem}
                    className="px-5 py-2.5 rounded-sm bg-primary hover:bg-primary/95 disabled:bg-outline-variant text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {savingSystem ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Config...
                      </>
                    ) : (
                      'Save System Config'
                    )}
                  </button>
                </div>
              </form>

              {/* Equipment Categories Management CRUD Card */}
              <div className="flat-card p-6 bg-white space-y-6">
                <div className="border-b border-outline-variant pb-3 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-primary" /> Manage Equipment Categories
                  </h3>
                  <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold font-mono tracking-wide text-secondary bg-secondary/10 uppercase">
                    New Contract Chips
                  </span>
                </div>

                {categoryError && (
                  <div className="p-3 bg-error/10 border border-error/25 text-error rounded-sm text-xs font-bold">
                    {categoryError}
                  </div>
                )}

                {/* Add Category Form Inline */}
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    value={categoryNameInput}
                    onChange={(e) => setCategoryNameInput(e.target.value)}
                    placeholder="e.g. Football Kits"
                    className="flat-input flex-1 px-3.5 py-2 border-outline-variant"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-secondary hover:bg-secondary/95 text-white text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                </form>

                {/* Categories Table List */}
                <div className="border border-outline-variant rounded-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low text-outline font-bold font-mono uppercase border-b border-outline-variant">
                      <tr>
                        <th className="py-3 px-4">Category Option Name</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {categories.map((cat) => {
                        const isEditing = editingCategoryId === cat.id
                        return (
                          <tr key={cat.id} className="hover:bg-surface-container-low/35 transition-colors">
                            <td className="py-3 px-4 font-medium text-on-surface">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingCategoryName}
                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                  className="flat-input px-2 py-1 border-primary text-xs w-full max-w-sm"
                                  autoFocus
                                />
                              ) : (
                                cat.name
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleRenameCategory(cat.id)}
                                      className="p-1 text-primary hover:bg-primary/10 rounded-sm"
                                      title="Save Change"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => { setEditingCategoryId(null); setEditingCategoryName('') }}
                                      className="p-1 text-outline hover:bg-surface-container rounded-sm"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name) }}
                                      className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-sm transition-all"
                                      title="Edit Category Name"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(cat.id)}
                                      className="p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-sm transition-all"
                                      title="Delete Category"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan="2" className="py-6 text-center text-outline italic">No equipment categories registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Password security and localized configurations */}
        <div className="space-y-6">
          {/* Password change Form Card */}
          <form onSubmit={handleChangePassword} className="flat-card p-6 bg-white space-y-6">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
              <Lock className="w-4 h-4 text-primary" /> Change Password
            </h3>

            {passwordError && (
              <div className="p-3 bg-error/10 border border-error/25 text-error rounded-sm text-xs font-bold">
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="flat-input w-full px-3.5 py-2 border-outline-variant"
                  required
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="flat-input w-full px-3.5 py-2 border-outline-variant"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="flat-input w-full px-3.5 py-2 border-outline-variant"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-outline-variant">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full bg-secondary hover:bg-secondary/95 disabled:bg-outline-variant text-white py-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>

          {/* Localization details card (Read-only, fixed to INR) */}
          <div className="flat-card p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
              <Globe className="w-4 h-4 text-primary" /> Regional Settings
            </h3>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-outline-variant/30">
                <span className="font-semibold text-on-surface-variant">Locale Configuration</span>
                <span className="font-mono bg-surface-container px-2 py-0.5 rounded-sm text-outline font-bold text-[10px] uppercase">en-IN (India)</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-outline-variant/30">
                <span className="font-semibold text-on-surface-variant">Currency Symbol</span>
                <span className="font-mono bg-surface-container px-2 py-0.5 rounded-sm text-outline font-bold text-[10px] uppercase">INR (₹)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-on-surface-variant">Digit Grouping</span>
                <span className="font-mono bg-surface-container px-2 py-0.5 rounded-sm text-outline font-bold text-[10px] uppercase">Indian Grouping</span>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant text-[10px] text-outline leading-relaxed rounded-sm font-sans mt-2">
              Note: The currency and numeric formatting locale is fixed to Indian Grouping rules (e.g. ₹12,45,200) across all renewal value analytics reports and dashboards.
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
