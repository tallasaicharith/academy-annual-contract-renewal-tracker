import { Bell, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function TopNav({ onSearchChange, searchValue }) {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-outline-variant bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input
          type="text"
          placeholder="Search contracts, academies..."
          value={searchValue || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-sm border border-outline-variant focus:outline-none focus:border-primary bg-surface-container-low transition-colors"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <button 
          className="p-2 hover:bg-surface-container rounded-sm relative text-on-surface-variant transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary"></span>
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 border-l border-outline-variant pl-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || user.username}
              className="w-8 h-8 rounded-full border border-outline-variant object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase font-mono">
              {user?.name ? user.name[0] : (user?.username ? user.username[0] : 'U')}
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-xs font-bold text-on-surface">{user?.name || user?.username || 'Staff'}</p>
            <p className="text-[10px] text-outline font-medium uppercase font-mono tracking-wider">
              {user?.title || (user?.role === 'admin' ? 'Lead Administrator' : 'Relationship Manager')}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopNav
