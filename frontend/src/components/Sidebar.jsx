import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  PlusSquare,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  X
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/contracts/new', label: 'New Contract Entry', icon: PlusSquare },
  { path: '/reports', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-on-surface/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-[#1a1c1e] text-white z-50 flex flex-col transition-transform duration-300 ease-in-out border-r border-outline/10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 lg:z-0`}
      >
        {/* Sidebar Header Brand Area */}
        <div className="py-6 px-6 border-b border-outline/10 flex flex-col justify-center relative">
          <div className="flex flex-col items-start">
            <img 
              src="/oxygen-sports-logo.png" 
              alt="Oxygen Sports Logo" 
              className="h-10 object-contain -ml-2" 
            />
            <span className="text-[9px] font-mono tracking-[0.2em] font-bold text-outline uppercase mt-1">
              Contract Tracker
            </span>
          </div>

          {/* Close button for mobile screens */}
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-white/5 transition-colors cursor-pointer text-outline hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 flex flex-col justify-between overflow-y-auto">
          {/* Main Links */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-outline uppercase font-mono tracking-widest px-3 block mb-3">
              Application Scope
            </span>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-xs font-semibold tracking-wide transition-all duration-150 group border ${
                    isActive
                      ? 'bg-[#ab3600] text-white border-transparent shadow-[0px_4px_12px_rgba(171,54,0,0.15)]'
                      : 'text-outline hover:bg-white/5 hover:text-white border-transparent'
                  }`
                }
              >
                <item.icon className="w-4 h-4 transition-transform group-hover:scale-105" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Help Center & User Profiles */}
          <div className="space-y-4">
            <div className="border-t border-outline/10 pt-4">
              <NavLink
                to="/help"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-xs font-semibold tracking-wide transition-all duration-150 group border ${
                    isActive
                      ? 'bg-[#ab3600] text-white border-transparent'
                      : 'text-outline hover:bg-white/5 hover:text-white border-transparent'
                  }`
                }
              >
                <HelpCircle className="w-4 h-4" />
                Help Center
              </NavLink>
            </div>

            {/* Authenticated User Session Card */}
            <div className="border-t border-outline/10 pt-4 bg-[#111315]/50 -mx-4 px-4 pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-sm bg-primary/20 flex items-center justify-center text-xs font-bold text-primary font-mono border border-primary/30 shrink-0 uppercase">
                    {user?.username ? user.username[0] : 'A'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate font-sans">{user?.username || 'Staff'}</p>
                    <p className="text-[10px] text-outline truncate font-mono uppercase tracking-wider">{user?.role || 'User'}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-sm hover:bg-[#ba1a1a]/15 hover:text-[#ffb4ab] border border-transparent hover:border-[#ba1a1a]/30 transition-all text-outline cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
