import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import Footer from './Footer'
import { Menu } from 'lucide-react'

function Layout({ searchValue, onSearchChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface flex flex-row">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* Top Navbar */}
        <div className="flex flex-row items-center bg-white border-b border-outline-variant sticky top-0 z-30">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 ml-4 rounded-sm hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <TopNav searchValue={searchValue} onSearchChange={onSearchChange} />
          </div>
        </div>

        {/* Page Content Container */}
        <main className="p-5 md:p-6 lg:p-10 flex-1 flex flex-col bg-surface">
          <div className="flex-1">
            <Outlet />
          </div>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default Layout
