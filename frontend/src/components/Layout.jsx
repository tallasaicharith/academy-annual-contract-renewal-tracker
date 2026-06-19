import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-transparent flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 glass-topbar px-5 py-3.5 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-150 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        {/* Page content */}
        <main className="p-5 sm:p-7 lg:p-8 flex-1 flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>
          
          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-gray-500 font-medium">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Oxygen Sports Management</span>
              <span className="hidden sm:inline opacity-30">|</span>
              <p>© 2024 Oxygen Sports Management</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Support</a>
              <span className="opacity-30">|</span>
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-300 flex items-center justify-center text-[8px] overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=40&h=40&q=80" alt="avatar" />
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-350 flex items-center justify-center text-[8px] overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80" alt="avatar" />
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-blue-950 text-blue-400 flex items-center justify-center text-[8px] font-bold">+12</div>
                </div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Active Analysts</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default Layout
