import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/contracts/new', label: 'New Contract Entry', icon: PlusSquare },
  { path: '/reports', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ isOpen, onClose }) {
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
        <div className="h-16 px-6 border-b border-outline/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-extrabold font-headline uppercase tracking-wider text-white">
              Oxygen Sports
            </span>
            <span className="text-[9px] font-mono tracking-widest font-bold text-outline uppercase">
              Contract Tracker
            </span>
          </div>

          {/* Close button for mobile screen */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-sm hover:bg-white/5 transition-colors cursor-pointer text-outline hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 flex flex-col justify-between">
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
                      ? 'bg-[#ab3600] text-white border-transparent shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'
                      : 'text-outline hover:bg-white/5 hover:text-white border-transparent'
                  }`
                }
              >
                <item.icon className="w-4 h-4 transition-transform group-hover:scale-105" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Help Center pinned to bottom */}
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
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
