import { AlertTriangle, TrendingUp } from 'lucide-react'

function StatsCard({ icon: Icon, label, value, trendValue, trendDesc, trendType, color = 'blue' }) {
  const iconColorMap = {
    blue: 'text-blue-600 bg-blue-50/70 border border-blue-100/50',
    green: 'text-emerald-700 bg-emerald-50/70 border border-emerald-100/50',
    orange: 'text-[#ab3600] bg-[#ab3600]/10 border border-[#ab3600]/10',
    teal: 'text-teal-700 bg-teal-50/70 border border-teal-100/50',
  }

  return (
    <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start mb-2">
        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl backdrop-blur-sm ${iconColorMap[color] || iconColorMap.blue}`}>
          {Icon && <Icon className="w-4.5 h-4.5" />}
        </div>
      </div>

      <div className="mt-2">
        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</span>
        
        {/* Trend area */}
        {(trendValue || trendDesc) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trendType === 'success' && (
              <span className="px-1.5 py-0.5 bg-emerald-100/60 backdrop-blur-sm text-emerald-700 text-[10px] font-extrabold rounded-lg uppercase tracking-wider">
                {trendValue}
              </span>
            )}
            {trendType === 'warning' && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide">
                  {trendValue}
                </span>
              </div>
            )}
            {trendType === 'info' && (
              <span className="px-1.5 py-0.5 bg-teal-100/60 backdrop-blur-sm text-teal-700 text-[10px] font-extrabold rounded-lg uppercase tracking-wider">
                {trendValue}
              </span>
            )}
            {trendDesc && (
              <span className="text-[10px] text-gray-400 font-medium">
                {trendDesc}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsCard
