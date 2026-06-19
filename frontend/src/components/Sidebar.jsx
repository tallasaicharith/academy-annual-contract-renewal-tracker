import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  LogOut,
  X,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/contracts/new', label: 'New Contract Entry', icon: PlusCircle },
  { path: '/reports', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-[#1A1C1E] to-[#111315] border-r border-white/[0.06] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 lg:z-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <img
                src="/oxygen-logo.svg"
                alt="Oxygen Sports Logo"
                className="h-12 object-contain"
              />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1.5 pl-0.5">
                Contract Renewal Tracker
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-500/80 uppercase tracking-[0.15em] px-3 mb-4">
              Menu
            </p>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#ab3600] to-[#c44000] text-white border-transparent shadow-lg shadow-[#ab3600]/20'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 border-transparent'
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px] transition-transform group-hover:scale-110" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Help Center Navigation Item */}
          <div className="mt-auto pt-5 border-t border-white/[0.06]">
            <NavLink
              to="/help"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ab3600] to-[#c44000] text-white border-transparent shadow-lg shadow-[#ab3600]/20'
                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 border-transparent'
                }`
              }
            >
              <HelpCircle className="w-[18px] h-[18px]" />
              Help Center
            </NavLink>
          </div>
        </nav>

        {/* User section */}
        <div className="p-5 border-t border-white/[0.06] bg-black/[0.15]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0C4F44] to-[#127464] flex items-center justify-center shadow-md ring-2 ring-white/[0.08]">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">
                {user?.username || 'User'}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                {user?.email || 'user@oxygensports.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-400 hover:bg-red-500/[0.08] hover:text-red-400 border border-transparent hover:border-red-500/15 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
