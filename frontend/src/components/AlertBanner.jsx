import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function AlertBanner({ count, contracts = [] }) {
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  if (dismissed || count === 0) return null

  return (
    <div className="animate-fadeIn relative overflow-hidden rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-orange-100/30"></div>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-amber-200/60">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              ⚠️ {count} contract{count !== 1 ? 's' : ''} expiring within 30 days!
            </p>
            <p className="text-xs text-amber-700/70 mt-0.5">
              Review and renew these contracts to avoid service disruption.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/contracts?filter=Expiring Soon')}
            className="text-xs font-medium text-amber-800 hover:text-amber-900 bg-amber-200/50 hover:bg-amber-200/80 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
          >
            View All
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-amber-200/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-amber-600/60" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertBanner
