import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Loader2, 
  UserCheck, 
  UserX, 
  Pencil, 
  Mail, 
  Phone, 
  PlusSquare,
  X,
  Lock,
  UserPlus
} from 'lucide-react'
import { getUsers, createUser, updateUser } from '../api/api'
import { useAuth } from '../context/AuthContext'

function TeamManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState(null)
  
  // Modal States
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    userId: null,
    formData: {
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'employee',
      title: 'Relationship Manager',
      phone: '',
      avatarUrl: ''
    },
    errors: {}
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      console.error(err)
      setActionError(err.message || 'Failed to load team list.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setModalConfig({
      isOpen: true,
      mode: 'create',
      userId: null,
      formData: {
        username: '',
        name: '',
        email: '',
        password: '',
        role: 'employee',
        title: 'Relationship Manager',
        phone: '',
        avatarUrl: ''
      },
      errors: {}
    })
  }

  const handleOpenEdit = (user) => {
    setModalConfig({
      isOpen: true,
      mode: 'edit',
      userId: user.id,
      formData: {
        username: user.username,
        name: user.name,
        email: user.email,
        password: '', // Leave blank for no change
        role: user.role,
        title: user.title || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
        isActive: user.isActive
      },
      errors: {}
    })
  }

  const handleCloseModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setModalConfig(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: value
      },
      errors: {
        ...prev.errors,
        [name]: ''
      }
    }))
  }

  const validateForm = () => {
    const err = {}
    const { username, name, email, password, role } = modalConfig.formData
    
    if (modalConfig.mode === 'create') {
      if (!username.trim()) err.username = 'Username is required.'
      if (!password || password.length < 6) err.password = 'Password must be at least 6 characters.'
    }
    if (!name.trim()) err.name = 'Full name is required.'
    if (!email.trim() || !email.includes('@')) err.email = 'Valid email is required.'
    if (!role) err.role = 'Role selection is required.'

    setModalConfig(prev => ({ ...prev, errors: err }))
    return Object.keys(err).length === 0
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setActionError(null)

    try {
      if (modalConfig.mode === 'create') {
        await createUser(modalConfig.formData)
      } else {
        await updateUser(modalConfig.userId, modalConfig.formData)
      }
      handleCloseModal()
      fetchUsers()
    } catch (err) {
      console.error(err)
      setActionError(err.message || 'Failed to submit form.')
    }
  }

  const handleToggleActive = async (user) => {
    setActionError(null)
    const nextActiveState = user.isActive === 1 ? 0 : 1
    
    try {
      await updateUser(user.id, {
        isActive: nextActiveState
      })
      fetchUsers()
    } catch (err) {
      console.error(err)
      setActionError(err.message || 'Failed to toggle employee active status.')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-outline tracking-widest uppercase font-mono">
            <span>Oxygen Sports</span>
            <span>/</span>
            <span className="text-on-surface-variant font-extrabold">System Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
            Team Management
          </h1>
          <p className="text-on-surface-variant text-xs font-medium">
            Manage relationship manager profiles, administrative roles, and system access.
          </p>
        </div>

        {/* Add Employee Button */}
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Global Error Banner */}
      {actionError && (
        <div className="p-4 bg-error/10 border border-error/25 text-error rounded-sm text-xs font-bold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-error hover:opacity-80 font-mono text-sm px-1">✕</button>
        </div>
      )}

      {/* Team Table */}
      <div className="flat-card p-6 bg-white space-y-4">
        <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
          Active Employees & Roles
        </h3>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-outline-variant rounded-lg">
            <table className="w-full border-collapse text-left bg-white text-xs sm:text-sm text-on-surface">
              <thead className="bg-surface-container-low text-[10px] font-bold uppercase font-mono tracking-wider text-outline border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">Employee Profile</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">Assigned Academies</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id
                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                      {/* Avatar + Name */}
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img 
                              src={u.avatarUrl} 
                              alt={u.name} 
                              className="w-9 h-9 rounded-full border border-outline-variant object-cover" 
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-outline-variant uppercase">
                              {u.name ? u.name[0] : 'U'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 bg-primary/10 border border-primary/20 text-[8px] font-extrabold uppercase font-mono text-primary rounded-sm">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono tracking-wide font-normal text-outline mt-0.5 uppercase">
                              {u.title || 'Staff'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[10px] uppercase">
                        <span className={`px-2 py-0.5 rounded-sm border ${
                          u.role === 'admin' 
                            ? 'bg-secondary/5 border-secondary/25 text-secondary' 
                            : 'bg-primary/5 border-primary/25 text-primary'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-outline" />
                            <span>{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-outline" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Assigned Academies */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-on-surface">
                        {u.assignedAcademiesCount || 0}
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase rounded-sm px-2 py-0.5 border ${
                          u.isActive === 1
                            ? 'bg-[#E6F4EA] border-[#34A853]/20 text-[#137333]'
                            : 'bg-[#FCE8E6] border-[#EA4335]/20 text-[#C5221F]'
                        }`}>
                          {u.isActive === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1 hover:bg-surface-container rounded-sm text-outline hover:text-secondary transition-colors cursor-pointer"
                            title="Edit Details"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`p-1 hover:bg-surface-container rounded-sm transition-colors cursor-pointer ${
                              u.isActive === 1 
                                ? 'text-outline hover:text-error' 
                                : 'text-outline hover:text-success'
                            }`}
                            title={u.isActive === 1 ? 'Deactivate Employee' : 'Activate Employee'}
                          >
                            {u.isActive === 1 ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white border border-outline-variant rounded-sm shadow-2xl p-6 relative">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-outline hover:text-on-surface p-1 rounded-sm hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-on-surface tracking-tight font-headline mb-1">
              {modalConfig.mode === 'create' ? 'Add New Employee' : 'Edit Employee Details'}
            </h2>
            <p className="text-xs text-on-surface-variant font-medium mb-5">
              {modalConfig.mode === 'create' 
                ? 'Create a new user account. An invites will be generated with credentials.' 
                : 'Modify account configuration parameters below.'}
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Username (Locked on edit) */}
              <div>
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={modalConfig.formData.username}
                  onChange={handleInputChange}
                  disabled={modalConfig.mode === 'edit'}
                  placeholder="e.g. sarah.jenkins"
                  className={`flat-input w-full px-3 py-2 ${
                    modalConfig.mode === 'edit' ? 'bg-surface-container-low text-outline cursor-not-allowed font-mono' : ''
                  } ${modalConfig.errors.username ? 'border-error ring-1 ring-error/25' : 'border-outline-variant'}`}
                />
                {modalConfig.errors.username && (
                  <p className="text-xs text-error font-medium mt-1">{modalConfig.errors.username}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={modalConfig.formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Sarah Jenkins"
                    className={`flat-input w-full px-3 py-2 ${
                      modalConfig.errors.name ? 'border-error ring-1 ring-error/25' : 'border-outline-variant'
                    }`}
                  />
                  {modalConfig.errors.name && (
                    <p className="text-xs text-error font-medium mt-1">{modalConfig.errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={modalConfig.formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. sarah@oxygensports.com"
                    className={`flat-input w-full px-3 py-2 ${
                      modalConfig.errors.email ? 'border-error ring-1 ring-error/25' : 'border-outline-variant'
                    }`}
                  />
                  {modalConfig.errors.email && (
                    <p className="text-xs text-error font-medium mt-1">{modalConfig.errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block mb-1">
                    {modalConfig.mode === 'create' ? 'Password' : 'Reset Password (optional)'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={modalConfig.formData.password}
                    onChange={handleInputChange}
                    placeholder={modalConfig.mode === 'create' ? 'At least 6 chars' : 'Leave empty to keep same'}
                    className={`flat-input w-full px-3 py-2 ${
                      modalConfig.errors.password ? 'border-error ring-1 ring-error/25' : 'border-outline-variant'
                    }`}
                  />
                  {modalConfig.errors.password && (
                    <p className="text-xs text-error font-medium mt-1">{modalConfig.errors.password}</p>
                  )}
                </div>

                {/* Role Dropdown */}
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block mb-1">
                    Role Privilege
                  </label>
                  <select
                    name="role"
                    value={modalConfig.formData.role}
                    onChange={handleInputChange}
                    className="flat-input w-full px-3 py-2 cursor-pointer border-outline-variant"
                  >
                    <option value="employee">Employee (Restricted Portfolio)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Job Title */}
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={modalConfig.formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Relationship Manager"
                    className="flat-input w-full px-3 py-2 border-outline-variant"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={modalConfig.formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 88888 88888"
                    className="flat-input w-full px-3 py-2 border-outline-variant"
                  />
                </div>
              </div>

              {/* Avatar Url */}
              <div>
                <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider block mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  name="avatarUrl"
                  value={modalConfig.formData.avatarUrl}
                  onChange={handleInputChange}
                  placeholder="e.g. https://images.unsplash.com/... (optional)"
                  className="flat-input w-full px-3 py-2 border-outline-variant"
                />
              </div>

              {/* Modal Actions */}
              <div className="border-t border-outline-variant pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface-container-low text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer text-on-surface-variant"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-5 py-2 bg-secondary hover:bg-secondary/95 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  {modalConfig.mode === 'create' ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamManagement
